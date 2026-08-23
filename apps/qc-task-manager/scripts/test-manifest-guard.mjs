import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CANONICAL_TEST_SCRIPTS, META_TEST_SCRIPTS } from './test-manifest.mjs';

const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
const packageTests = Object.keys(packageJson.scripts ?? {}).filter((name) => name.startsWith('test:'));
const canonicalPackageTests = packageTests.filter((name) => !META_TEST_SCRIPTS.has(name));
const manifest = new Set(CANONICAL_TEST_SCRIPTS);
const missing = canonicalPackageTests.filter((name) => !manifest.has(name));
const unknown = CANONICAL_TEST_SCRIPTS.filter((name) => !canonicalPackageTests.includes(name));

if (missing.length || unknown.length || manifest.size !== CANONICAL_TEST_SCRIPTS.length) {
  console.error('Test manifest mismatch.');
  if (missing.length) console.error(`Missing from manifest: ${missing.join(', ')}`);
  if (unknown.length) console.error(`Not canonical package scripts: ${unknown.join(', ')}`);
  process.exit(1);
}

console.log(`Test manifest guard passed: ${CANONICAL_TEST_SCRIPTS.length} canonical suites.`);
