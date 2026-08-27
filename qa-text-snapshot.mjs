#!/usr/bin/env node
/**
 * Visual QA — text extraction + baseline.
 * For each of the 14 QA pages, extracts:
 *   - <title>, <meta description>, canonical, hreflang, og:title, og:description
 *   - h1, h2, h3 counts and text
 *   - visible word count
 *   - paragraph count
 *   - image count + alt text
 *   - internal link count
 *   - JSON-LD count
 *   - placeholder checks (undefined, null, [object], Lorem, [N])
 *
 * Outputs:
 *   - qa/text-snapshot.json   (machine-readable, golden reference)
 *   - qa/text-snapshot.md     (human-readable summary)
 *
 * Usage:  node qa-text-snapshot.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const outDir = join(__dirname, 'qa');
const snapJson = join(outDir, 'text-snapshot.json');
const snapMd = join(outDir, 'text-snapshot.md');

const QA_PAGES = [
  { slug: 'home',                 path: '/index.html' },
  { slug: 'about',                path: '/about/index.html' },
  { slug: 'services',             path: '/services/index.html' },
  { slug: 'pricing',              path: '/pricing/index.html' },
  { slug: 'contact',              path: '/contact/index.html' },
  { slug: 'demo',                 path: '/demo/index.html' },
  { slug: 'trust',                path: '/trust/index.html' },
  { slug: 'hub',                  path: '/hub/index.html' },
  { slug: 'solutions-index',      path: '/solutions/index.html' },
  { slug: 'solution-ai-firewall', path: '/solutions/ai-firewall/index.html' },
  { slug: 'kernel-index',         path: '/kernel/index.html' },
  { slug: 'kernel-audit',         path: '/kernel/audit/index.html' },
  { slug: 'blog-index',           path: '/blog/index.html' },
  { slug: 'docs-index',           path: '/docs/index.html' },
];

// Strip HTML tags + decode entities; collapse whitespace.
function visibleText($) {
  // Remove script + style + noscript + template content
  $('script, style, noscript, template, svg').remove();
  // Get body text
  const txt = $('body').text() || $.root().text();
  return txt
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/[\t\n\r]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

function countWords(t) {
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function placeholderHits(t) {
  const hits = [];
  const patterns = [
    { re: /\bundefined\b/gi,    name: 'undefined' },
    { re: /\bnull\b/gi,         name: 'null' },
    { re: /\[object\s+Object\]/gi, name: '[object Object]' },
    { re: /\bLorem\s+ipsum\b/gi, name: 'Lorem ipsum' },
    { re: /\{\{[^}]+\}\}/g,       name: 'mustache-template' },
    { re: /\[N\]|\[n\]/g,         name: 'placeholder-N' },
    { re: /TBD|TODO|FIXME/gi,    name: 'TBD/TODO/FIXME' },
    { re: /\\u00a7|\\u200b/gi,   name: 'escaped-unicode-literal' },
  ];
  for (const { re, name } of patterns) {
    const m = t.match(re);
    if (m) hits.push({ name, count: m.length, sample: m[0] });
  }
  return hits;
}

function snapshot($, htmlPath) {
  const s = { file: htmlPath };

  s.title        = $('head > title').first().text().trim() || null;
  s.titleLen     = s.title ? s.title.length : 0;

  s.metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  s.metaDescLen     = s.metaDescription ? s.metaDescription.length : 0;

  s.canonical     = $('link[rel="canonical"]').attr('href') || null;

  s.hreflangs     = $('link[rel="alternate"][hreflang]').map((_, el) => ({
    lang: $(el).attr('hreflang'),
    href: $(el).attr('href'),
  })).get();

  s.ogTitle       = $('meta[property="og:title"]').attr('content') || null;
  s.ogDescription = $('meta[property="og:description"]').attr('content') || null;
  s.ogImage       = $('meta[property="og:image"]').attr('content') || null;
  s.twitterCard   = $('meta[name="twitter:card"]').attr('content') || null;

  s.h1s     = $('h1').map((_, el) => $(el).text().trim()).get();
  s.h1Count = s.h1s.length;
  s.h2Count = $('h2').length;
  s.h3Count = $('h3').length;
  s.h4Count = $('h4').length;
  s.h5Count = $('h5').length;
  s.h6Count = $('h6').length;

  s.h2s = $('h2').map((_, el) => $(el).text().trim()).get();

  s.pCount   = $('p').length;
  s.imgCount = $('img').length;
  s.altMissing = $('img:not([alt])').length;
  s.altEmpty   = $('img[alt=""]').length;
  s.alts = $('img').map((_, el) => ({
    src: $(el).attr('src') || '',
    alt: $(el).attr('alt') ?? null,
    width: $(el).attr('width') || null,
    height: $(el).attr('height') || null,
    loading: $(el).attr('loading') || null,
    decoding: $(el).attr('decoding') || null,
  })).get();

  s.aCount         = $('a').length;
  s.aInternalCount = $('a[href^="/"]').length;
  s.aExternalCount = $('a[href^="http"]:not([href*="brightai.live"])').length;
  s.aNoRelExt      = $('a[href^="http"]:not([href*="brightai.live"]):not([rel*="noopener"])').length;

  s.buttonCount = $('button').length;
  s.formCount   = $('form').length;
  s.inputCount  = $('input, textarea, select').length;

  const ld = $('script[type="application/ld+json"]').map((_, el) => {
    try { return JSON.parse($(el).contents().text()); }
    catch (e) { return { __parse_error: e.message, raw: $(el).contents().text().slice(0, 200) }; }
  }).get();
  s.jsonLdCount   = ld.length;
  s.jsonLdSchemas = ld.map((j) => j['@type'] || (j['@graph'] ? '@graph' : null)).filter(Boolean);

  s.text = visibleText($);
  s.wordCount   = countWords(s.text);
  s.charCount   = s.text.length;
  s.placeholders = placeholderHits(s.text);

  s.htmlSizeBytes  = readFileSync(htmlPath).length;
  return s;
}

// --- main ---
const result = { generatedAt: new Date().toISOString(), pages: {} };
const warnings = [];
const errors   = [];

for (const p of QA_PAGES) {
  const htmlPath = join(distDir, p.path);
  if (!existsSync(htmlPath)) {
    errors.push(`Missing: ${htmlPath}`);
    continue;
  }
  const html = readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: true });
  result.pages[p.slug] = snapshot($, htmlPath);
}

writeFileSync(snapJson, JSON.stringify(result, null, 2), 'utf8');

// --- markdown summary ---
const lines = [];
lines.push(`# Text Snapshot — Visual QA Reference`);
lines.push(``);
lines.push(`**Generated**: ${result.generatedAt}`);
lines.push(`**Source**: dist/ current build`);
lines.push(`**Pages**: ${Object.keys(result.pages).length}`);
lines.push(``);
lines.push(`## Page-by-page summary`);
lines.push(``);
lines.push(`| Page | title (len) | desc (len) | H1 | H2 | words | imgs | alt miss | int links | JSON-LD | placeholders |`);
lines.push(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|`);

for (const p of QA_PAGES) {
  const s = result.pages[p.slug];
  if (!s) { lines.push(`| ${p.slug} | ❌ missing | | | | | | | | | |`); continue; }
  const ph = s.placeholders.length > 0
    ? `🔴 ${s.placeholders.map((h) => h.name).join(', ')}`
    : `✅ 0`;
  lines.push(
    `| ${p.slug} | ${s.titleLen} | ${s.metaDescLen} | ${s.h1Count} | ${s.h2Count} | ${s.wordCount} | ${s.imgCount} | ${s.altMissing} | ${s.aInternalCount} | ${s.jsonLdCount} | ${ph} |`
  );
}
lines.push(``);

// Detail blocks
lines.push(`## Per-page detail`);
lines.push(``);
for (const p of QA_PAGES) {
  const s = result.pages[p.slug];
  if (!s) continue;
  lines.push(`### ${p.slug}`);
  lines.push(`- **file**: \`dist${p.path}\` (${(s.htmlSizeBytes / 1024).toFixed(1)} KB)`);
  lines.push(`- **title**: ${s.title ? `\`${s.title}\`` : `❌ missing`}`);
  lines.push(`- **description**: ${s.metaDescription ? `\`${s.metaDescription}\`` : `❌ missing`}`);
  lines.push(`- **canonical**: ${s.canonical ? `\`${s.canonical}\`` : `❌ missing`}`);
  lines.push(`- **hreflangs**: ${s.hreflangs.length} (${s.hreflangs.map((h) => h.lang).join(', ') || 'none'})`);
  lines.push(`- **og:title**: ${s.ogTitle ? `✅` : `❌`}`);
  lines.push(`- **og:image**: ${s.ogImage ? `✅ ${s.ogImage.slice(0, 60)}…` : `❌`}`);
  lines.push(`- **twitter:card**: ${s.twitterCard ? `✅` : `❌`}`);
  lines.push(`- **h1 count**: ${s.h1Count} ${s.h1Count === 1 ? '✅' : '❌ (should be exactly 1)'}`);
  s.h1s.forEach((h, i) => lines.push(`  - h1[${i}]: \`${h}\``));
  lines.push(`- **h2 count**: ${s.h2Count}`);
  lines.push(`- **h3-h6**: h3=${s.h3Count} h4=${s.h4Count} h5=${s.h5Count} h6=${s.h6Count}`);
  lines.push(`- **words**: ${s.wordCount} | **chars**: ${s.charCount}`);
  lines.push(`- **paragraphs**: ${s.pCount}`);
  lines.push(`- **images**: ${s.imgCount} | **alt missing**: ${s.altMissing} | **alt empty**: ${s.altEmpty}`);
  lines.push(`- **links**: total=${s.aCount} internal=${s.aInternalCount} external=${s.aExternalCount} ext-no-noopener=${s.aNoRelExt}`);
  lines.push(`- **buttons**: ${s.buttonCount} | **forms**: ${s.formCount} | **inputs**: ${s.inputCount}`);
  lines.push(`- **JSON-LD**: ${s.jsonLdCount} schemas (${s.jsonLdSchemas.join(', ') || 'none'})`);
  if (s.placeholders.length > 0) {
    lines.push(`- **🔴 placeholders**:`);
    s.placeholders.forEach((h) => lines.push(`  - ${h.name}: ${h.count}× (\`${h.sample}\`)`));
  } else {
    lines.push(`- **placeholders**: ✅ none`);
  }
  lines.push(``);
}

lines.push(`## Notes & issues`);
lines.push(``);
if (errors.length) {
  lines.push(`### ❌ Errors`);
  errors.forEach((e) => lines.push(`- ${e}`));
  lines.push(``);
}

writeFileSync(snapMd, lines.join('\n') + '\n', 'utf8');

console.log(`✅ Wrote ${snapJson}`);
console.log(`✅ Wrote ${snapMd}`);
console.log(`   Pages: ${Object.keys(result.pages).length}/${QA_PAGES.length}`);
if (errors.length) {
  console.log(`❌ ${errors.length} errors:`);
  errors.forEach((e) => console.log(`   - ${e}`));
  process.exit(1);
}
