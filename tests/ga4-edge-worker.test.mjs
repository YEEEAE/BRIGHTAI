import test from 'node:test';
import assert from 'node:assert/strict';
import { GA4_ID, GA4_TAG_SRC, GA4_INLINE_SOURCE, injectGa4, handleRequest } from '../cloudflare/workers/ga4-injector/index.mjs';
import { inlineSnippet } from './helpers/ga4-attribution.mjs';

const normalizeScript = value => value.trim().split('\n').map(line => line.trim()).join('\n');

test('edge bootstrap stays identical to the app GA4 privacy and attribution bootstrap', () => {
  assert.equal(normalizeScript(GA4_INLINE_SOURCE), normalizeScript(inlineSnippet()));
  assert.equal(GA4_ID, 'G-9LMB4PGTWJ');
});

test('injects one GA4 bootstrap into legacy HTML before the closing head', () => {
  const legacy = '<!doctype html><html><head><title>Legacy</title></head><body>Article</body></html>';
  const result = injectGa4(legacy);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'head');
  assert.equal((result.html.match(/G-9LMB4PGTWJ/g) ?? []).length, 2);
  assert.match(result.html, /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-9LMB4PGTWJ"><\/script>/);
  assert.ok(result.html.indexOf('googletagmanager.com') < result.html.indexOf('</head>'));
  const secondPass = injectGa4(result.html);
  assert.equal(secondPass.changed, false);
  assert.equal(secondPass.reason, 'already-covered');
});

test('adds the head element when a valid HTML document omitted it', () => {
  const result = injectGa4('<html><body>Legacy document</body></html>');
  assert.equal(result.changed, true);
  assert.match(result.html, /<head>[\s\S]*googletagmanager[\s\S]*<\/head>/);
});

test('does not modify a current page that already has the GA4 config and loader', () => {
  const current = `<html><head><script>${GA4_INLINE_SOURCE}</script><script async src="${GA4_TAG_SRC}"></script></head></html>`;
  const result = injectGa4(current);
  assert.equal(result.changed, false);
  assert.equal(result.html, current);
});

test('adds only the missing half if an origin has a config or loader but not both', () => {
  const configOnly = `<html><head><script>${GA4_INLINE_SOURCE}</script></head></html>`;
  const configResult = injectGa4(configOnly);
  assert.equal((configResult.html.match(/gtag\/js\?id=G-9LMB4PGTWJ/g) ?? []).length, 1);
  assert.equal((configResult.html.match(/gtag\('config', 'G-9LMB4PGTWJ'/g) ?? []).length, 1);

  const loaderOnly = `<html><head><script async src="${GA4_TAG_SRC}"></script></head></html>`;
  const loaderResult = injectGa4(loaderOnly);
  assert.equal((loaderResult.html.match(/gtag\/js\?id=G-9LMB4PGTWJ/g) ?? []).length, 1);
  assert.equal((loaderResult.html.match(/gtag\('config', 'G-9LMB4PGTWJ'/g) ?? []).length, 1);
});

test('leaves non-HTML, non-GET and non-2xx origin responses untouched', async () => {
  const cases = [
    [new Request('https://brightai.live/app.js'), new Response('js', { headers: { 'content-type': 'text/javascript' } })],
    [new Request('https://brightai.live/page/', { method: 'HEAD' }), new Response(null, { headers: { 'content-type': 'text/html' } })],
    [new Request('https://brightai.live/page/', { headers: { accept: 'text/html', range: 'bytes=0-20' } }), new Response('<html><head></head></html>', { status: 206, headers: { 'content-type': 'text/html', 'content-range': 'bytes 0-20/100' } })],
    [new Request('https://brightai.live/missing/'), new Response('<html><head></head></html>', { status: 404, headers: { 'content-type': 'text/html' } })],
  ];
  for (const [request, originResponse] of cases) {
    const response = await handleRequest(request, async () => originResponse);
    assert.equal(response, originResponse);
  }
});

test('rewrites successful HTML responses and removes stale body validators', async () => {
  const request = new Request('https://brightai.live/blog/legacy/', { headers: { accept: 'text/html' } });
  const response = await handleRequest(request, async () => new Response('<html><head></head><body>Legacy</body></html>', {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-length': '46',
      'content-encoding': 'gzip',
      etag: '"origin-v1"',
      'last-modified': 'Mon, 23 Nov 2026 00:00:00 GMT',
      'cache-control': 'public, max-age=60',
    },
  }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/html/i);
  for (const header of ['content-length', 'content-encoding', 'etag', 'content-md5', 'content-digest', 'accept-ranges']) {
    assert.equal(response.headers.get(header), null, header);
  }
  assert.equal(response.headers.get('last-modified'), 'Mon, 23 Nov 2026 00:00:00 GMT');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  assert.match(await response.text(), /googletagmanager\.com\/gtag\/js\?id=G-9LMB4PGTWJ/);
});

test('retries a browser HTML 304 without conditional validators before injecting', async () => {
  const request = new Request('https://brightai.live/blog/legacy/', {
    headers: { accept: 'text/html', 'if-none-match': '"old"', 'if-modified-since': 'Mon, 23 Nov 2026 00:00:00 GMT' },
  });
  const seen = [];
  const response = await handleRequest(request, async current => {
    seen.push(current);
    if (seen.length === 1) return new Response(null, { status: 304 });
    assert.equal(current.headers.get('if-none-match'), null);
    assert.equal(current.headers.get('if-modified-since'), null);
    return new Response('<html><head></head><body>Legacy</body></html>', {
      headers: { 'content-type': 'text/html' },
    });
  });
  assert.equal(seen.length, 2);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /G-9LMB4PGTWJ/);
});

test('does not invent analytics when an HTML response lacks an html/head insertion point', () => {
  const result = injectGa4('plain text from an upstream failure');
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'no-html-document');
});

test('preserves confidential Secure Chat HTML even on encoded aliases', async () => {
  for (const path of ['/app/secure-chat/', '/%61pp/%73ecure-chat/']) {
    const original = new Response('<html><head></head></html>', {
      headers: { 'content-type': 'text/html' },
    });
    assert.equal(await handleRequest(new Request('https://brightai.live' + path), async () => original), original);
  }
});
