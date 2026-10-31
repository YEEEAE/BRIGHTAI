import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Run after building and starting the standalone server:
// node scripts/verify-routes.mjs http://127.0.0.1:4387
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4387');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Local verification only');
const { redirects } = JSON.parse(await readFile(new URL('../redirects.json', import.meta.url)));
const xml = await readFile(new URL('../dist/client/sitemap-0.xml', import.meta.url), 'utf8');
const routes = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => new URL(url).pathname);
assert(routes.length > 0, 'Sitemap must contain pages');
assert.equal(new Set(routes).size, routes.length, 'Duplicate sitemap routes');
assert(!routes.includes('/kernel/'), 'Noindex demo must be omitted from sitemap');
assert(!routes.includes('/404/'), '404 route must be omitted from sitemap');
const pages = new Map();
const references = [];
const titles = new Set();
let cssAssets = 0;

for (const path of routes) {
  assert(path.endsWith('/'), `Not a clean route: ${path}`);
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert(html.includes('<html lang="ar-SA" dir="rtl">'), `Locale/direction: ${path}`);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title && !titles.has(title), `Missing or duplicate title: ${path}`);
  titles.add(title);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `H1: ${path}`);
  assert(html.includes(`rel="canonical" href="https://brightai.live${path}"`), `Canonical: ${path}`);
  assert(html.includes('name="robots" content="index, follow"'), `Indexability: ${path}`);
  assert.equal([...html.matchAll(/gtag\('config', 'G-9LMB4PGTWJ'\)/g)].length, 1, `Analytics: ${path}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(([, s]) => JSON.parse(s));
  if (path !== '/') assert(schemas.some(s => s['@type'] === 'BreadcrumbList'), `Breadcrumbs: ${path}`);
  pages.set(path, html);
  for (const [, tag, value] of html.matchAll(/<(a|link|img|script)\b[^>]*?\s(?:href|src)="([^"]+)"/g)) {
    const url = new URL(value.replaceAll('&amp;', '&'), new URL(path, base));
    if (url.origin === base.origin) references.push({ from: path, tag, url });
  }
}

const checked = new Set();
for (const { from, url } of references) {
  if (!checked.has(url.pathname)) {
    const response = await fetch(url, { redirect: 'manual' });
    assert.equal(response.status, 200, `Broken reference: ${from} -> ${url.pathname}`);
    if (url.pathname.endsWith('.css')) {
      const css = await response.text();
      for (const [, value] of css.matchAll(/url\(['"]?([^'"\s)]+)['"]?\)/g)) {
        const asset = new URL(value, url);
        if (asset.origin !== base.origin || asset.protocol === 'data:') continue;
        assert.equal((await fetch(asset)).status, 200, `CSS asset: ${asset.pathname}`);
        cssAssets++;
      }
    }
    checked.add(url.pathname);
  }
  if (url.hash) {
    const html = pages.get(url.pathname);
    const id = decodeURIComponent(url.hash.slice(1));
    assert(html?.includes(`id="${id}"`), `Broken anchor: ${from} -> ${url.pathname}${url.hash}`);
  }
}

const redirectFailures = [];
for (const { source, destination } of redirects) {
  if (!['/kernel/', '/404/'].includes(destination)) {
    assert(routes.includes(destination), `Redirect target missing from sitemap: ${destination}`);
  }
  const query = '?topic=%D8%B9%D8%B1%D8%B6&source=audit';
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(new URL(source + query, base), { method, redirect: 'manual' });
    if (response.status !== 301 || response.headers.get('location') !== destination + query) {
      redirectFailures.push(`${method} ${source}: ${response.status} ${response.headers.get('location') ?? ''}`);
    }
  }
  const response = await fetch(new URL(destination.slice(0, -1) + query, base), { redirect: 'manual' });
  if (response.status !== 301 || response.headers.get('location') !== destination + query) {
    redirectFailures.push(`Trailing slash ${destination}: ${response.status} ${response.headers.get('location') ?? ''}`);
  }
}

const reachable = new Set(['/']);
let previous = 0;
while (previous !== reachable.size) {
  previous = reachable.size;
  for (const { from, tag, url } of references) {
    if (tag === 'a' && reachable.has(from) && pages.has(url.pathname)) reachable.add(url.pathname);
  }
}
assert.equal(reachable.size, routes.length, 'Orphan sitemap pages');
for (const path of ['/missing-page.html', '/products/missing/', '/api/ai/chat/']) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 404, `Unexpected route: ${path}`);
  assert((await response.text()).includes('الرابط غير موجود'), `Custom 404 content: ${path}`);
}
const demo = await fetch(new URL('/kernel/', base));
assert.equal(demo.status, 200, 'Kernel explainer route');
assert((await demo.text()).includes('name="robots" content="noindex, follow"'), 'Kernel demo must be noindex');
for (const path of ['/knowledge/ai-governance-saudi/', '/knowledge/protect-company-data-chatgpt/',
  '/knowledge/ai-risk-assessment/', '/knowledge/prompt-injection/', '/knowledge/ai-use-policy-employees/']) {
  assert(routes.includes(path), `Knowledge article missing from sitemap: ${path}`);
}
assert.deepEqual(redirectFailures, [], `Legacy redirects failed: ${redirectFailures.slice(0, 5).join('; ')}`);
console.log(JSON.stringify({ status: 'PASS', pages: routes.length, references: references.length,
  uniquePaths: checked.size, cssAssets, redirects: redirects.length, redirectChecks: redirects.length * 3,
  orphanPages: 0, brokenReferences: 0 }, null, 2));
