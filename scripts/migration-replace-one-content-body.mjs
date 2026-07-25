import fs from 'node:fs';
import * as cheerio from 'cheerio';

const [source, target, mode = 'article'] = process.argv.slice(2);
if (!source || !target) {
  console.error('Usage: node scripts/replace-one-content-body.mjs <source.html> <target.md> [article|document]');
  process.exit(1);
}

const sourceHtml = fs.readFileSync(source, 'utf8');
const targetText = fs.readFileSync(target, 'utf8');
const frontmatterMatch = targetText.match(/^---\n[\s\S]*?\n---\n?/);
if (!frontmatterMatch) throw new Error(`Missing frontmatter in ${target}`);

const $ = cheerio.load(sourceHtml, { decodeEntities: false });
const canonical = $('link[rel="canonical"]').attr('href');
const root = $('main').first().length ? $('main').first() : $('article').first();
if (!canonical || !root.length) throw new Error(`Missing canonical or content root in ${source}`);

root.find('script, style, .brightai-raw-internal-links').remove();
if (mode === 'article') root.find('h1').first().remove();

root.find('a[href]').each((_, element) => {
  const href = $(element).attr('href');
  if (!href || !href.includes('.html')) return;
  const resolved = new URL(href, canonical);
  resolved.pathname = resolved.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
  $(element).attr('href', resolved.origin === 'https://brightai.site'
    ? `${resolved.pathname}${resolved.search}${resolved.hash}`
    : resolved.href);
});
root.find('[src]').each((_, element) => {
  const src = $(element).attr('src');
  if (!src || /^(?:https?:|data:|\/)/.test(src)) return;
  $(element).attr('src', new URL(src, canonical).pathname);
});

const body = root.html()?.trim() ?? '';
fs.writeFileSync(target, `${frontmatterMatch[0].trim()}\n\n${body}\n`);
console.log(`${source} -> ${target}`);
