#!/usr/bin/env node

import { glob } from 'glob';
import { readFile } from 'node:fs/promises';

const htmlFiles = await glob('**/*.html', {
  cwd: process.cwd(),
  nodir: true,
  ignore: ['**/node_modules/**', '**/.git/**'],
});

const missing = [];

for (const file of htmlFiles) {
  const content = await readFile(file, 'utf8');
  const hasClarityTag =
    content.includes('https://www.clarity.ms/tag/') ||
    content.includes('(window, document, "clarity", "script"');

  if (!hasClarityTag) {
    missing.push(file);
  }
}

if (missing.length === 0) {
  console.log(`OK: Clarity script found in all ${htmlFiles.length} HTML files.`);
  process.exit(0);
}

console.log('Missing Clarity script in the following HTML files:');
for (const file of missing) {
  console.log(`- ${file}`);
}

process.exit(1);
