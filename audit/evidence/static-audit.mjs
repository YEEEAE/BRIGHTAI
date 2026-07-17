import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const client = join(root, 'dist/client');
const audit = join(root, 'audit');
const site = 'https://brightai.site';
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const quote = (value) => `"${String(value ?? '').replaceAll('"', '""').replaceAll(/\s+/g, ' ').trim()}"`;
const csv = (rows, fields) => [fields.join(','), ...rows.map((r) => fields.map((f) => quote(r[f])).join(','))].join('\n') + '\n';
const normalizePath = (href, base = '/') => {
  try {
    const url = new URL(href, new URL(base, site));
    if (url.origin !== site) return null;
    return url.pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(url.pathname) ? url.pathname : `${url.pathname}/`;
  } catch { return null; }
};
const routeFromFile = (file) => {
  const rel = relative(client, file).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html' || rel === '500.html') return `/${rel}`;
  return `/${rel.replace(/index\.html$/, '')}`;
};
const files = walk(client).filter((p) => p.endsWith('.html'));
const pages = [];
const edges = [];
const issues = [];
const routeSet = new Set(files.map(routeFromFile));
for (const file of files) {
  const route = routeFromFile(file);
  const html = readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  const links = $('a[href]').map((_, el) => $(el).attr('href')).get();
  const internal = links.map((href) => normalizePath(href, route)).filter(Boolean);
  for (const [i, href] of links.entries()) {
    const target = normalizePath(href, route);
    if (target) edges.push({ source: route, target, anchor: $('a[href]').eq(i).text(), exists: routeSet.has(target) || target.startsWith('/api/') });
  }
  const schemas = $('script[type="application/ld+json"]');
  let invalidSchema = 0;
  schemas.each((_, el) => { try { JSON.parse($(el).text()); } catch { invalidSchema += 1; } });
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const title = $('title').first().text();
  const description = $('meta[name="description"]').attr('content') || '';
  const h1 = $('h1').length;
  const lang = $('html').attr('lang') || '';
  const dir = $('html').attr('dir') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const words = $('body').text().replaceAll(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  const images = $('img').length;
  const missingAlt = $('img').filter((_, el) => !$(el).is('[alt]')).length;
  const blankUnsafe = $('a[target="_blank"]').filter((_, el) => !/noopener/.test($(el).attr('rel') || '')).length;
  const checks = [
    ['SEO-CANONICAL', !canonical, 'High', 'Canonical مفقود'],
    ['SEO-TITLE', !title, 'High', 'Title مفقود'],
    ['SEO-DESCRIPTION', !description, 'Medium', 'Meta description مفقود'],
    ['SEO-H1', h1 !== 1, 'Medium', `عدد H1 هو ${h1}`],
    ['I18N-LANG', !lang, 'Medium', 'lang مفقود'],
    ['I18N-DIR', !dir, 'Medium', 'dir مفقود'],
    ['SCHEMA-JSON', invalidSchema > 0, 'High', `${invalidSchema} JSON-LD غير صالح`],
    ['A11Y-ALT', missingAlt > 0, 'Medium', `${missingAlt} صور بدون alt attribute`],
    ['SEC-BLANK', blankUnsafe > 0, 'Medium', `${blankUnsafe} روابط target=_blank بدون noopener`],
    ['CONTENT-THIN', words < 150 && !robots.includes('noindex') && !['/404.html','/500.html'].includes(route), 'Medium', `${words} كلمة فقط`],
  ];
  for (const [id, fail, severity, detail] of checks) if (fail) issues.push({ id: `${id}-${issues.length + 1}`, category: id.split('-')[0], severity, status: 'open', url: route, file: relative(root, file), selector: '', evidence: detail, reproduction: `افتح ${route} وافحص HTML المبني`, recommendation: 'راجع معيار الفحص وأصلح المصدر ثم أعد build.' });
  pages.push({ route, file: relative(root, file), status: route === '/404.html' ? 404 : 200, canonical, indexable: robots.includes('noindex') ? 'no' : 'yes', lang, dir, title, description, h1_count: h1, word_count: words, schema_blocks: schemas.length, invalid_schema: invalidSchema, internal_outlinks: internal.length, images, missing_alt: missingAlt });
}
const incoming = new Map();
for (const edge of edges) incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
for (const page of pages) page.internal_inlinks = incoming.get(page.route) || 0;
for (const page of pages.filter((p) => p.indexable === 'yes' && p.internal_inlinks === 0 && p.route !== '/')) issues.push({ id: `LINK-ORPHAN-${issues.length + 1}`, category: 'LINK', severity: 'High', status: 'open', url: page.route, file: page.file, selector: '', evidence: '0 internal inlinks', reproduction: 'ابحث في INTERNAL-LINKS.csv', recommendation: 'أضف رابط سياقي من صفحة hub مناسبة.' });
const redirects = JSON.parse(readFileSync(join(root, 'redirects.json'), 'utf8')).redirects;
const redirectRows = redirects.map((r) => ({ old_url: r.from, new_url: r.to, status: 301, destination_exists: routeSet.has(normalizePath(r.to) || r.to) ? 'yes' : 'no', chain: r.from === r.to ? 'self' : 'direct', parity: 'unknown', evidence: 'redirects.json' }));
const recommendations = pages.filter((p) => p.internal_inlinks === 0 && p.indexable === 'yes' && p.route !== '/').map((p) => ({ source: '/', target: p.route, anchor: p.title || p.route, reason: 'صفحة قابلة للفهرسة بدون روابط داخلية مكتشفة', priority: 'High' }));
writeFileSync(join(audit, 'PAGE-INVENTORY.csv'), csv(pages, Object.keys(pages[0])));
writeFileSync(join(audit, 'ISSUES.csv'), csv(issues, ['id','category','severity','status','url','file','selector','evidence','reproduction','recommendation']));
writeFileSync(join(audit, 'REDIRECT-MIGRATION-MAP.csv'), csv(redirectRows, Object.keys(redirectRows[0])));
writeFileSync(join(audit, 'INTERNAL-LINKS.csv'), csv(edges, ['source','target','anchor','exists']));
writeFileSync(join(audit, 'INTERNAL-LINK-RECOMMENDATIONS.csv'), csv(recommendations, ['source','target','anchor','reason','priority']));
writeFileSync(join(audit, 'evidence/static-summary.json'), JSON.stringify({ generatedAt: new Date().toISOString(), pages: pages.length, redirects: redirects.length, edges: edges.length, brokenInternalEdges: edges.filter((e) => !e.exists).length, issues: issues.length, issueCounts: Object.groupBy(issues, (i) => i.severity), orphanPages: pages.filter((p) => p.internal_inlinks === 0 && p.indexable === 'yes').length, invalidSchemaPages: pages.filter((p) => p.invalid_schema > 0).length, missingAltTotal: pages.reduce((n,p) => n + p.missing_alt, 0) }, null, 2));
console.log(JSON.stringify({ pages: pages.length, redirects: redirects.length, edges: edges.length, issues: issues.length }, null, 2));
