import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { after, before, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import redirects from '../redirects.json' with { type: 'json' };
import { isPublicIndexPath, publicSite } from '../src/server/seo/indexability.mjs';

const root = new URL('../', import.meta.url);
const built = existsSync(new URL('dist/server/entry.mjs', root));
const xmlNamespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const locations = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
const pageTypes = ['WebPage', 'CollectionPage', 'AboutPage', 'ContactPage'];
let server;
let origin;

const request = (path, method = 'GET') => fetch(new URL(path, origin), {
  method, redirect: 'manual', signal: AbortSignal.timeout(5000),
});

describe('published sitemap contract on the production Node entry point', {
  skip: !built && 'Run npm run test:seo to build the site first',
}, () => {
  before(async () => {
    const socket = createServer().listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const { port } = socket.address();
    await new Promise(resolve => socket.close(resolve));
    origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ['scripts/server.mjs'], {
      cwd: fileURLToPath(root),
      env: { PATH: process.env.PATH, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { output += chunk; });
    for (let attempt = 0; attempt < 100 && server.exitCode === null; attempt++) {
      try { await request('/', 'HEAD'); return; } catch { await delay(100); }
    }
    assert.fail(`Node server did not start: ${output}`);
  });

  after(async () => {
    if (server?.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
    }
  });

  test('robots advertises a valid discovery tree and every URL is indexable, canonical and structured', async () => {
    const robots = await request('/robots.txt');
    assert.equal(robots.status, 200);
    const robotsText = await robots.text();
    assert.match(robotsText, /^User-agent: \*\s*\nAllow: \/\s*$/m);
    assert.doesNotMatch(robotsText, /^\s*Disallow:\s*\S/im);
    assert.deepEqual([...robotsText.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map(([, url]) => url),
      [`${publicSite}/sitemap-index.xml`]);

    async function sitemap(path, element) {
      const response = await request(path);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get('content-type') ?? '', /xml/i, path);
      const xml = await response.text();
      assert(xml.includes(`<${element} xmlns="${xmlNamespace}"`), path);
      assert(xml.trimEnd().endsWith(`</${element}>`), path);
      const urls = locations(xml);
      assert(urls.length && new Set(urls).size === urls.length, path);
      return urls;
    }

    const sitemapUrls = [];
    for (const child of await sitemap('/sitemap-index.xml', 'sitemapindex')) {
      const url = new URL(child);
      assert.equal(url.origin, publicSite);
      assert.match(url.pathname, /^\/sitemap-\d+\.xml$/);
      assert.equal(url.href, `${publicSite}${url.pathname}`);
      sitemapUrls.push(...await sitemap(url.pathname, 'urlset'));
    }
    assert.equal(new Set(sitemapUrls).size, sitemapUrls.length);
    assert(sitemapUrls.includes(`${publicSite}/`));
    const paths = new Set(sitemapUrls.map(url => new URL(url).pathname));
    assert(redirects.redirects.every(({ source }) => !paths.has(source)), 'Redirect alias in sitemap');

    for (const canonical of sitemapUrls) {
      const { origin: site, pathname, search, hash } = new URL(canonical);
      assert.equal(site, publicSite, canonical);
      assert(!search && !hash && pathname.endsWith('/') && isPublicIndexPath(pathname), canonical);
      const [get, head] = await Promise.all([request(pathname), request(pathname, 'HEAD')]);
      for (const response of [get, head]) {
        assert.equal(response.status, 200, pathname);
        assert.equal(response.headers.get('location'), null, pathname);
        assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /\b(?:noindex|none)\b/i, pathname);
        assert.match(response.headers.get('content-type') ?? '', /^text\/html/i, pathname);
      }
      const html = await get.text();
      assert.equal([...html.matchAll(/src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-9LMB4PGTWJ"/g)].length, 1, pathname);
      assert.doesNotMatch(html, /ga-disable-G-9LMB4PGTWJ/, pathname);
      assert.deepEqual([...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map(([, url]) => url), [canonical]);
      assert.match(html, /<meta name="robots" content="index, follow">/, pathname);
      assert.match(html, /<html lang="ar-SA" dir="rtl">/, pathname);
      assert.doesNotMatch(html, /<link\b[^>]*\bhreflang=/i, pathname);

      const payloads = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
        .map(([, source]) => JSON.parse(source));
      const { '@context': context, '@graph': graph } = payloads[0] ?? {};
      assert.equal(context, 'https://schema.org', pathname);
      assert(Array.isArray(graph), canonical);
      const entity = type => graph.find(node => node['@type'] === type);
      const page = graph.find(node => pageTypes.includes(node['@type']));
      assert.equal(page?.url, canonical);
      assert.equal(page?.['@id'], canonical);
      assert.equal(page?.inLanguage, 'ar-SA');
      const website = entity('WebSite');
      const organization = entity('Organization');
      assert.equal(website?.url, `${publicSite}/`);
      assert.equal(organization?.url, `${publicSite}/`);
      assert.deepEqual(website.publisher, { '@id': organization['@id'] });
      assert.deepEqual(page.isPartOf, { '@id': website['@id'] });
      assert.deepEqual(page.publisher, { '@id': organization['@id'] });

      if (pathname !== '/') {
        assert.match(html, /<nav class="breadcrumb" aria-label="مسار التنقل">/, pathname);
        const trail = entity('BreadcrumbList');
        assert.deepEqual(page.breadcrumb, { '@id': `${canonical}#breadcrumb` });
        assert(trail?.itemListElement.length >= 2, pathname);
        assert.equal(trail.itemListElement.at(-1).item, canonical);
        for (const [index, crumb] of trail.itemListElement.entries()) {
          assert.equal(crumb.position, index + 1);
          assert(crumb.name && paths.has(new URL(crumb.item).pathname), pathname);
        }
      }
      const expectedType = pathname.startsWith('/knowledge/') ? 'Article'
        : /^\/resources\/[^/]+\/$/.test(pathname) ? 'CreativeWork'
        : pathname === '/services/' ? 'Service' : undefined;
      if (expectedType) {
        const main = entity(expectedType);
        assert(main, pathname);
        assert.deepEqual(page.mainEntity, { '@id': main['@id'] });
        if (expectedType === 'Article') assert.equal(main.mainEntityOfPage['@id'], canonical);
      }
      for (const key of ['title', 'description', 'url', 'image', 'locale', 'type']) {
        assert.match(html, new RegExp(`<meta property="og:${key}" content="[^"]+"`), pathname);
      }
      for (const key of ['title', 'description', 'image', 'card']) {
        assert.match(html, new RegExp(`<meta name="twitter:${key}" content="[^"]+"`), pathname);
      }
      if (pathname.startsWith('/knowledge/')) {
        for (const label of ['حالة المراجعة التخصصية', 'آخر مراجعة تخصصية', 'المراجع']) {
          assert(html.includes(`<dt>${label}</dt>`), pathname);
        }
      }
      if (/^\/products\/[^/]+\/$/.test(pathname)) {
        assert.equal(entity('Product'), undefined, pathname);
        const journey = html.match(/<section[^>]+data-product-next[^>]*>(.*?)<\/section>/s)?.[1] ?? '';
        const guide = journey.match(/href="(\/knowledge\/[^"]+)"/)?.[1];
        const hub = journey.match(/href="(\/docs\/topics\/[^"]+)"/)?.[1];
        assert(paths.has(guide) && paths.has(hub), pathname);
        const slug = pathname.split('/')[2];
        assert(journey.includes(`href="/request-access/?track=production&amp;product=${slug}"`), pathname);
        const access = await request(`/request-access/?track=production&product=${slug}`);
        assert.equal(access.status, 200, pathname);
        const accessHtml = await access.text();
        assert.match(accessHtml, /data-track="production" data-selected="true"/, pathname);
        assert(accessHtml.includes(`href="/contact/?access=production&amp;product=${slug}#contact"`), pathname);
      }
      if (pathname.startsWith('/docs/topics/')) {
        assert.equal(page['@type'], 'CollectionPage');
        assert.deepEqual(page.isPartOf, { '@id': website['@id'] });
        assert((await (await request('/docs/')).text()).includes(`href="${pathname}"`), pathname);
        for (const item of page.mainEntity.itemListElement) {
          const guide = new URL(item.url).pathname;
          assert(paths.has(guide) && html.includes(`href="${guide}"`), guide);
          assert((await (await request(guide)).text()).includes(`href="${pathname}"`), guide);
        }
      }
      if (pathname === '/docs/') assert.equal(page.mainEntity['@type'], 'ItemList');
      if (pathname === '/about/') assert.equal(page['@type'], 'AboutPage');
      if (pathname === '/contact/') assert.equal(page['@type'], 'ContactPage');
    }
  });

  test('legacy aliases return one permanent hop and preserve the query for GET and HEAD', async () => {
    const query = '?audit=1&topic=%D8%B9%D8%B1%D8%B6';
    for (const { source, destination } of redirects.redirects) {
      for (const method of ['GET', 'HEAD']) {
        const response = await request(source + query, method);
        assert.equal(response.status, 301, `${method} ${source}`);
        assert.equal(response.headers.get('location'), destination + query, `${method} ${source}`);
      }
    }
    for (const destination of new Set(redirects.redirects.map(row => row.destination))) {
      const response = await request(destination, 'HEAD');
      assert.equal(response.status, 200, destination);
      assert.equal(response.headers.get('location'), null, destination);
    }
  });

  test('explicit and unknown error URLs give a real 404 with custom, noindex HTML', async () => {
    const paths = ['/404', '/404/', '/404.html', '/seo-audit-missing-20261124/',
      '/knowledge/seo-audit-missing-20261124/'];
    for (const path of paths) {
      for (const method of ['GET', 'HEAD']) {
        const response = await request(path, method);
        assert.equal(response.status, 404, `${method} ${path}`);
        assert.equal(response.headers.get('location'), null, path);
        assert.match(response.headers.get('content-type') ?? '', /^text\/html/i);
        const html = await response.text();
        if (method === 'HEAD') { assert.equal(html, ''); continue; }
        assert.match(html, /الرابط غير موجود/);
        assert.match(html, /<meta name="robots" content="noindex, follow">/);
        assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json/);
      }
    }
  });
});
