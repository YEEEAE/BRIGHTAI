#!/usr/bin/env node
/**
 * Word-count checker for site-audit "low word count" fixes.
 * Mirrors Semrush's approach: visible text of the built HTML
 * (scripts/styles/noscript/JSON-LD stripped), whitespace token count.
 * Usage: node scripts/qa/check-word-count.mjs [target1 target2 ...]
 * Defaults to the 4 pages flagged by Semrush on 2026-09-08.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist', 'client');

const DEFAULTS = [
  ['answer/iso-42001/', 230],
  ['answer/pdpl-ai-compliance-ar/', 230],
  ['answer/sdaia-generative-ai/', 230],
  ['blog/', 280],
];

const targets = process.argv.length > 2
  ? process.argv.slice(2).map((t) => [t, 230])
  : DEFAULTS;

const strip = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(svg|path|title)\b[^>]*>[\s\S]*?<\/(svg|path|title)>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

const countWords = (text) =>
  (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’\u0640-]*/gu) || []).length;

let failures = 0;
for (const [route, min] of targets) {
  const file = join(ROOT, route, 'index.html');
  try {
    const html = readFileSync(file, 'utf8');
    const words = countWords(strip(html));
    const ok = words >= min;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  /${route}  words=${words}  (min=${min})`);
  } catch (e) {
    failures++;
    console.log(`ERROR  /${route}  ${e.message}`);
  }
}
process.exit(failures === 0 ? 0 : 1);
