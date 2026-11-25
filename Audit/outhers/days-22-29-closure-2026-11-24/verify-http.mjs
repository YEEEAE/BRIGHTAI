import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const base = new URL(process.argv[2]);
assert.equal(base.hostname, '127.0.0.1');
const portalEnabled = process.argv[3] === 'open';
const pages = new URL('../../src/pages/', import.meta.url);
const rows = [];
const uuid = '00000000-0000-4000-8000-000000000001';
async function check(route, method, expected, jsonCode) {
  const path = route.replace(/\[[^\]]+\]/g, uuid);
  const response = await fetch(new URL(path, base), {
    method, redirect: 'manual', signal: AbortSignal.timeout(5000),
    ...(method === 'GET' || method === 'HEAD' ? {} : {
      headers: { Origin: base.origin, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
      body: '{}',
    }),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  const json = contentType.includes('application/json') && text ? JSON.parse(text) : null;
  const error = expected !== undefined && response.status !== expected ||
    jsonCode !== undefined && json?.code !== jsonCode;
  rows.push({ route, method, status: response.status, expected, code: json?.code, error });
  return { response, text };
}

const files = (await readdir(pages, { recursive: true })).filter(file => file.endsWith('.ts')).sort();
for (const file of files) {
  const route = '/' + file.replace(/\.ts$/, '').replace(/\/index$/, '') + '/';
  const source = await readFile(new URL(file, pages), 'utf8');
  const methods = [...source.matchAll(/^export const (GET|HEAD|POST|PUT|PATCH|DELETE)\b/gm)].map(match => match[1]);
  assert(methods.length, file);
  for (const method of methods) {
    if (route === '/app/api/kernel/health/' && portalEnabled) {
      const { response, text } = await check(route, method, 200);
      assert.match(response.headers.get('cache-control') ?? '', /no-store/);
      assert.equal(JSON.parse(text).status, 'setup_required');
    } else if (route.startsWith('/app/api/')) {
      await check(route, method, portalEnabled ? 401 : 503, portalEnabled ? 'UNAUTHORIZED' : 'APP_UNAVAILABLE');
    }
    else if (route === '/api/measurement-status/') await check(route, method, 200);
    else if (route === '/api/observability/') await check(route, method, 204);
    else await check(route, method, 503);
  }
}

if (!portalEnabled) {
  const sitemap = await check('/sitemap-0.xml', 'GET', 200);
  for (const [, loc] of sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const path = new URL(loc).pathname;
    const result = await check(path, 'GET', 200);
    assert(result.text.includes(`href="${loc}"`), path);
    await check(path, 'HEAD', 200);
  }
  for (const route of ['/404/', '/404.html', '/closure-synthetic-missing/']) {
    const { text } = await check(route, 'GET', 404);
    assert.match(text, /noindex/);
    await check(route, 'HEAD', 404);
  }
  for (const route of ['/app/', '/app/trial/', '/app/kernel/', '/app/firewall/', '/app/ledger/',
    '/app/human-gate/', '/app/risk-engine/', '/app/risk-engine/[assetId]/', '/app/secure-chat/',
    '/app/operator/trials/']) {
    const { response } = await check(route, 'GET', 503);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  }
  for (const path of ['/auth/sign-up/', '/auth/accept-invitation/']) {
    const { response, text } = await check(path, 'GET', 200);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/);
    assert.match(text, /noindex/);
  }
  for (const demo of ['kernel', 'firewall', 'risk-engine', 'human-gate', 'secure-chat', 'ledger']) {
    const { text } = await check(`/demo/${demo}/`, 'GET', 200);
    assert.match(text, /noindex/);
  }
  for (const view of ['offer', 'sample']) {
    await check(`/demo/workshop-preview/${view}/`, 'GET', 404);
  }
  for (const file of await readdir(new URL('../../public/downloads/', import.meta.url))) {
    const { response } = await check('/downloads/' + encodeURIComponent(file), 'GET', 200);
    assert.doesNotMatch(response.headers.get('content-type') ?? '', /text\/html/);
  }
  for (const product of ['firewall', 'risk-engine', 'human-gate', 'secure-chat', 'ledger']) {
    const { text } = await check(`/products/${product}/complaint/`, 'GET', 200);
    assert.match(text, /noindex/);
    assert.match(text, /id="lab"/);
  }
}
console.log(JSON.stringify({ portalEnabled, endpointFiles: files.length, checks: rows.length, rows }, null, 2));
if (rows.some(row => row.error)) process.exitCode = 1;
