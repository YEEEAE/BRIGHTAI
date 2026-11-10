import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// Run after building and starting the server with npm start:
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
assert(!routes.some(path => /^\/(app|auth)(\/|$)/.test(path)), 'Private routes must be omitted');
// Derive expected pages from actual build output, including expanded dynamic routes.
async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await htmlFiles(url));
    else if (entry.name.endsWith('.html')) files.push(url);
  }
  return files;
}
const client = new URL('../dist/client/', import.meta.url);
const expectedRoutes = [];
for (const file of await htmlFiles(client)) {
  const html = await readFile(file, 'utf8');
  if (!html.includes('name="robots" content="index, follow"')) continue;
  const canonical = html.match(/rel="canonical" href="(https:\/\/brightai\.live[^"\s]*)"/)?.[1];
  assert(canonical, `Missing canonical: ${file.pathname}`);
  const path = new URL(canonical).pathname;
  assert.equal(decodeURIComponent(file.pathname.slice(client.pathname.length)),
    path === '/' ? 'index.html' : decodeURIComponent(path.slice(1)) + 'index.html',
    `Canonical does not match built page: ${file.pathname}`);
  expectedRoutes.push(path);
}
assert.deepEqual([...routes].sort(), [...expectedRoutes].sort(), 'Sitemap must include every indexable built page');
assert.equal(new Set(redirects.map(r => r.source)).size, redirects.length, 'Duplicate redirect sources');
for (const path of routes) {
  const alias = path === '/' ? '/index.html' : path.slice(0, -1) + '.html';
  assert(redirects.some(r => r.source === alias && r.destination === path), `Missing HTML alias: ${path}`);
  if (path !== '/') assert(redirects.some(r => r.source === path + 'index.html' && r.destination === path), `Missing index.html alias: ${path}`);
}
for (const { source, destination } of redirects) {
  assert(!routes.includes(source), `Redirect alias leaked into sitemap: ${source}`);
  assert(!redirects.some(r => r.source === destination), `Redirect chain or loop: ${source}`);
}
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
  assert.equal([...html.matchAll(/gtag\('config', 'G-9LMB4PGTWJ', analyticsPage\)/g)].length, 1, `Analytics: ${path}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(([, s]) => JSON.parse(s));
  if (path !== '/') assert(schemas.some(s => s['@type'] === 'BreadcrumbList'), `Breadcrumbs: ${path}`);
  if (path.startsWith('/knowledge/')) {
    const articles = schemas.filter(s => s['@type'] === 'Article');
    assert.equal(articles.length, 1, `Exactly one Article entity: ${path}`);
    assert(articles[0].author && articles[0].publisher && articles[0].dateModified, `Article ownership and date: ${path}`);
  }
  for (const faq of schemas.filter(s => s['@type'] === 'FAQPage')) {
    for (const question of faq.mainEntity) {
      assert(html.includes(question.name) && html.includes(question.acceptedAnswer.text), `FAQ must match visible text: ${path}`);
    }
  }
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
const catalog = JSON.parse(pages.get('/docs/').match(/<script type="application\/json" id="kc-data"[^>]*>(.*?)<\/script>/s)?.[1] ?? 'null');
assert(Array.isArray(catalog), 'Knowledge catalog must be available in initial HTML');
assert.deepEqual(catalog.map(item => item.href).sort(), routes.filter(path => path.startsWith('/knowledge/')).sort(),
  'Every built article must be discoverable in the knowledge center');
assert(catalog.every(item => item.headings.length > 0 && item.minutes > 0), 'Article previews must contain actual headings and reading time');
const sourceLlms = await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8');
assert.equal(sourceLlms, await readFile(new URL('../dist/client/llms.txt', import.meta.url), 'utf8'), 'Source and deployed llms.txt must match');
for (const { source, destination } of redirects) {
  if (!['/kernel/', '/404/', '/sitemap-index.xml'].includes(destination)) {
    assert(routes.includes(destination), `Redirect target missing from sitemap: ${destination}`);
  }
  const query = '?topic=%D8%B9%D8%B1%D8%B6&source=audit';
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(new URL(source + query, base), { method, redirect: 'manual' });
    if (response.status !== 301 || response.headers.get('location') !== destination + query) {
      redirectFailures.push(`${method} ${source}: ${response.status} ${response.headers.get('location') ?? ''}`);
    }
  }
  if (!destination.endsWith('/') || destination === '/') continue;
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
for (const path of ['/sitemap-index.xml', '/sitemap-0.xml', '/robots.txt', '/llms.txt']) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `Discovery document: ${path}`);
  if (path === '/llms.txt') {
    const text = await response.text();
    for (const route of routes) assert(text.includes(`https://brightai.live${route})`), `Page missing from llms.txt: ${route}`);
    assert(!/https:\/\/brightai\.live\/(app|auth)\//.test(text), 'Private URL leaked into llms.txt');
  }
}
console.log(JSON.stringify({ status: 'PASS', pages: routes.length, references: references.length,
  articles: catalog.length,
  uniquePaths: checked.size, cssAssets, redirects: redirects.length, redirectMethodChecks: redirects.length * 2,
  orphanPages: 0, brokenReferences: 0 }, null, 2));
