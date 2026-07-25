import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const [source, output] = process.argv.slice(2);
if (!source || !output) {
  console.error('Usage: node scripts/extract-one-legacy-page.mjs <source.html> <output.json>');
  process.exit(1);
}

const html = fs.readFileSync(source, 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });
const canonical = $('link[rel="canonical"]').attr('href');
if (!canonical) throw new Error(`Missing canonical in ${source}`);

const cleanUrl = (value) => {
  if (!value || !value.includes('.html')) return value;
  const resolved = new URL(value, canonical);
  resolved.pathname = resolved.pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '/');
  return resolved.origin === 'https://brightai.site'
    ? `${resolved.pathname}${resolved.search}${resolved.hash}`
    : resolved.href;
};

const root = $('main').first();
if (!root.length) throw new Error(`Missing <main> in ${source}`);

root.find('script, style, header, nav, footer, .brightai-raw-internal-links').remove();
root.find('a[href]').each((_, element) => {
  const href = $(element).attr('href');
  $(element).attr('href', cleanUrl(href));
});
root.find('[src]').each((_, element) => {
  const src = $(element).attr('src');
  if (!src || /^(?:https?:|data:|\/)/.test(src)) return;
  $(element).attr('src', new URL(src, canonical).pathname);
});

const jsonLd = $('script[type="application/ld+json"]')
  .map((_, element) => {
    try { return JSON.parse($(element).text()); } catch { return null; }
  })
  .get()
  .filter(Boolean);

const page = {
  source,
  title: $('title').text().trim(),
  description: $('meta[name="description"]').attr('content') ?? '',
  canonical,
  hreflang: $('link[rel="alternate"][hreflang]').map((_, element) => ({
    lang: $(element).attr('hreflang'),
    href: $(element).attr('href'),
  })).get(),
  jsonLd,
  html: root.html()?.trim() ?? '',
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(page, null, 2)}\n`);
console.log(`${source} -> ${output}`);
