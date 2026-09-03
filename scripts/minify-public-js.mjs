#!/usr/bin/env node
/** Minify deployed public JavaScript while keeping source files readable. */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const root = process.cwd();
const jsRoot = path.join(root, 'dist', 'client', 'js');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(target);
  }
  return files;
}

try {
  const files = await walk(jsRoot);
  for (const file of files) {
    const result = await transform(await fs.readFile(file, 'utf8'), {
      minify: true,
      legalComments: 'none',
      sourcefile: path.relative(root, file),
    });
    await fs.writeFile(file, result.code, 'utf8');
  }
  console.log(`[minify-public-js] minified ${files.length} deployed JavaScript files`);
} catch (error) {
  console.error('[minify-public-js] failed:', error);
  process.exitCode = 1;
}
