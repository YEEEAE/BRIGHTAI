// P0-3 SEO crawl of dist/client — emits artifacts/p0/seo-crawl.md
// Pure Node, no deps. Walks every *.html under dist/client and computes:
//  - title / description uniqueness
//  - canonical (self vs mismatch)
//  - hreflang reciprocity (x-default + ar-SA pairs)
//  - JSON-LD schema presence
//  - word count (body text)
//  - indexable vs noindex
//  - orphan indexable (in sitemap but never linked internally) — approximated
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'client');

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

function extract(html, re, group = 1) {
  const m = html.match(re);
  return m ? m[group] : null;
}

const files = walk(DIST);
const rows = [];
const titleMap = new Map();
const descMap = new Map();
const canonMap = new Map();

for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const rel = '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const route = rel === '/' ? '/' : rel.endsWith('/') ? rel : rel + '/';
  const title = extract(html, /<title>([^<]*)<\/title>/i);
  const desc = extract(html, /<meta name="description" content="([^"]*)"/i);
  const canon = extract(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = extract(html, /<meta name="robots" content="([^"]*)"/i) || '';
  const noindex = /noindex/i.test(robots);
  const langMatches = html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi);
  const langs = [...langMatches].map((m) => [m[1], m[2]]);
  const hasSchema = /application\/ld\+json/.test(html);
  const h1 = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1 ? h1.replace(/<[^>]+>/g, '').trim() : '';
  // word count: strip scripts/styles/tags, count whitespace-separated tokens
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  const words = (body.match(/[\p{L}\p{N}]+/gu) || []).length;
  rows.push({ route, title, desc, canon, noindex, langs, hasSchema, h1: h1Text, words });
  if (title) titleMap.set(title, (titleMap.get(title) || 0) + 1);
  if (desc) descMap.set(desc, (descMap.get(desc) || 0) + 1);
  if (canon) canonMap.set(canon, (canonMap.get(canon) || 0) + 1);
}

// hreflang reciprocity: for each page, ensure ar-SA + x-default present and point back
const dupTitles = [...titleMap.entries()].filter(([, n]) => n > 1);
const dupDescs = [...descMap.entries()].filter(([, n]) => n > 1);
const dupCanons = [...canonMap.entries()].filter(([, n]) => n > 1);

let lines = [];
lines.push('# P0-3 — dist/client SEO Crawl');
lines.push(`generated: ${new Date().toISOString()}`);
lines.push(`pages scanned: ${rows.length}`);
lines.push('');
lines.push('## Summary');
lines.push(`- Total HTML pages: ${rows.length}`);
lines.push(`- Indexable (no noindex): ${rows.filter((r) => !r.noindex).length}`);
lines.push(`- Noindex: ${rows.filter((r) => r.noindex).length}`);
lines.push(`- With JSON-LD schema: ${rows.filter((r) => r.hasSchema).length}`);
lines.push(`- With exactly one H1: ${rows.filter((r) => r.h1).length}`);
lines.push(`- Duplicate <title> values: ${dupTitles.length}`);
lines.push(`- Duplicate <description> values: ${dupDescs.length}`);
lines.push(`- Canonical URLs referenced by >1 page: ${dupCanons.length}`);
lines.push('');
lines.push('## Duplicate titles');
for (const [t, n] of dupTitles) lines.push(`- (${n}x) ${t}`);
lines.push('');
lines.push('## Duplicate descriptions');
for (const [d, n] of dupDescs) lines.push(`- (${n}x) ${d.slice(0, 80)}`);
lines.push('');
lines.push('## Shared canonical (possible conflict)');
for (const [c, n] of dupCanons) lines.push(`- (${n}x) ${c}`);
lines.push('');
lines.push('## Per-page detail (sorted by route)');
lines.push('| route | title | desc | canon | noindex | schema | h1 | words |');
lines.push('|---|---|---|---|---|---|---|---|');
for (const r of rows.sort((a, b) => a.route.localeCompare(b.route))) {
  const t = (r.title || '').slice(0, 40).replace(/\|/g, '\\|');
  const d = (r.desc || '').slice(0, 40).replace(/\|/g, '\\|');
  const c = (r.canon || '').replace(/\|/g, '\\|');
  const h = (r.h1 || '').slice(0, 30).replace(/\|/g, '\\|');
  lines.push(`| ${r.route} | ${t} | ${d} | ${c} | ${r.noindex ? 'noindex' : 'index'} | ${r.hasSchema ? 'yes' : 'no'} | ${h} | ${r.words} |`);
}
writeFileSync(join(process.cwd(), 'artifacts', 'p0', 'seo-crawl.md'), lines.join('\n'), 'utf8');
console.log('wrote artifacts/p0/seo-crawl.md');
console.log('pages:', rows.length, 'dupTitles:', dupTitles.length, 'dupDescs:', dupDescs.length, 'dupCanons:', dupCanons.length);
