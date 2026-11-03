#!/usr/bin/env node
/**
 * Counts visible words in the rendered HTML of a knowledge article.
 * Usage: node scripts/count-words.mjs [dist/client/knowledge/<slug>/index.html]
 * Strips script/style/svg/noscript blocks, then tags, then counts tokens.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2] ?? 'dist/client/knowledge/sdaia-ai-adoption-framework/index.html';
const html = readFileSync(resolve(file), 'utf8');

const strip = (value) =>
  value
    .replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const count = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? html;
// Prefer the article body region when present: from the body wrapper to the
// "read next" block, which sits outside the article element.
const start = html.indexOf('<article class="k1-body"');
const end = html.indexOf('<section class="k1-next"');
const article = start >= 0 && end > start ? html.slice(start, end) : '';

const mainWords = count(strip(main));
const bodyWords = article ? count(strip(article)) : 0;

console.log(`file: ${file}`);
console.log(`main words: ${mainWords}`);
if (bodyWords) console.log(`article body words: ${bodyWords}`);
if (mainWords < 2900 || mainWords > 3300) {
  console.log(`OUT OF RANGE (target 2900-3300)`);
  process.exitCode = 1;
} else {
  console.log('IN RANGE');
}
