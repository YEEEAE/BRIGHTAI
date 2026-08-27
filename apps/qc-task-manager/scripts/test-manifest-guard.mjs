// Registry drift guard: makes the QC test/acceptance registry impossible to
// silently drift from the filesystem.
//
// Scans apps/qc-task-manager/scripts/ and fails when ANY of these holds:
//   1. a package.json test:* command is absent from the manifest;
//   2. a manifest command does not exist in package.json;
//   3. a scripts/test-*.mjs file exists but is unregistered and not
//      explicitly classified (TEST_SCRIPT_CLASSIFICATIONS);
//   4. a scripts/e2e-*.mjs file exists but is absent from the E2E registry
//      and not explicitly classified (E2E_SCRIPT_CLASSIFICATIONS);
//   5. a registered file does not exist on disk;
//   6. duplicate canonical entries exist (test manifest or E2E suites).
//
// It also asserts the consumers stay wired to the registries
// (run-full-tests.mjs → test-manifest.mjs, e2e-acceptance.mjs → e2e-registry.mjs)
// so nobody can reintroduce a hardcoded, drifting suite list.

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CANONICAL_TEST_SCRIPTS,
  META_TEST_SCRIPTS,
  TEST_SCRIPT_CLASSIFICATIONS,
} from './test-manifest.mjs';
import { CANONICAL_E2E_SUITES, E2E_SCRIPT_CLASSIFICATIONS } from './e2e-registry.mjs';

const errors = [];
const fail = (message) => errors.push(message);

const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
const packageScriptNames = Object.keys(packageJson.scripts ?? {});
const packageTests = packageScriptNames.filter((name) => name.startsWith('test:'));

// ── Rules 1+2: package.json test:* commands ↔ manifest ──
const manifest = [...CANONICAL_TEST_SCRIPTS, ...META_TEST_SCRIPTS];
const missingFromManifest = packageTests.filter((name) => !manifest.includes(name));
const missingFromPackage = manifest.filter((name) => !packageScriptNames.includes(name));
if (missingFromManifest.length) fail(`test:* package commands absent from manifest: ${missingFromManifest.join(', ')}`);
if (missingFromPackage.length) fail(`manifest commands absent from package.json: ${missingFromPackage.join(', ')}`);
if (new Set(CANONICAL_TEST_SCRIPTS).size !== CANONICAL_TEST_SCRIPTS.length) {
  fail('duplicate canonical test entries in test-manifest.mjs');
}
if (META_TEST_SCRIPTS.size !== [...META_TEST_SCRIPTS].length) fail('duplicate entries in META_TEST_SCRIPTS');

// ── Filesystem inventory of the conventional test directories ──
const scriptsDir = resolve('scripts');
const diskScripts = (await readdir(scriptsDir)).filter((name) => name.endsWith('.mjs'));
const diskTestScripts = diskScripts.filter((name) => /^test-.+\.mjs$/.test(name)).sort();
const diskE2eScripts = diskScripts.filter((name) => /^e2e-.+\.mjs$/.test(name)).sort();

// Extract every scripts/*.mjs file referenced by a registered test command.
// App-local refs start with `scripts/`; `../../scripts/...` refs resolve
// against the repository root (shared TS loader).
const commandRefs = new Map();
for (const name of packageTests) {
  commandRefs.set(name, [...packageJson.scripts[name].matchAll(/\S*scripts\/[A-Za-z0-9._-]+\.mjs/g)].map((m) => m[0]));
}
const referencedFiles = new Set([...commandRefs.values()].flat());

// ── Rule 5a: every file referenced by a registered command must exist ──
for (const [command, files] of commandRefs) {
  for (const ref of files) {
    const exists = ref.startsWith('scripts/')
      ? diskScripts.includes(ref.replace(/^scripts\//, ''))
      : existsSync(resolve(ref));
    if (!exists) fail(`command "${command}" references missing file: ${ref}`);
  }
}
for (const name of manifest) {
  if (commandRefs.get(name)?.length === 0) {
    fail(`registered command "${name}" references no scripts/*.mjs file`);
  }
}

// ── Rule 3: scripts/test-*.mjs must be registered or explicitly classified ──
const classifiedTestFiles = [...TEST_SCRIPT_CLASSIFICATIONS.keys()];
const registeredTestFiles = diskTestScripts.filter((file) => referencedFiles.has(`scripts/${file}`));
const unclassifiedTestFiles = diskTestScripts.filter(
  (file) => !referencedFiles.has(`scripts/${file}`) && !classifiedTestFiles.includes(`scripts/${file}`),
);
if (unclassifiedTestFiles.length) {
  fail(`orphan scripts/test-*.mjs (register them or classify in TEST_SCRIPT_CLASSIFICATIONS): ${unclassifiedTestFiles.join(', ')}`);
}
// Classified entries must exist on disk and stay on-convention (no stale rows).
for (const file of classifiedTestFiles) {
  if (!/^scripts\/test-.+\.mjs$/.test(file)) fail(`TEST_SCRIPT_CLASSIFICATIONS key off-convention: ${file}`);
  if (!diskScripts.includes(file.replace(/^scripts\//, ''))) fail(`TEST_SCRIPT_CLASSIFICATIONS entry missing on disk: ${file}`);
}

// ── Rules 4+5b+6: E2E registry ↔ filesystem ──
const registryScripts = CANONICAL_E2E_SUITES.map(([, script]) => script);
const registryLabels = CANONICAL_E2E_SUITES.map(([label]) => label);
const duplicateScripts = registryScripts.filter((script, i) => registryScripts.indexOf(script) !== i);
const duplicateLabels = registryLabels.filter((label, i) => registryLabels.indexOf(label) !== i);
if (duplicateScripts.length) fail(`duplicate canonical E2E suite scripts: ${duplicateScripts.join(', ')}`);
if (duplicateLabels.length) fail(`duplicate canonical E2E suite labels: ${duplicateLabels.join(', ')}`);

for (const script of registryScripts) {
  if (!diskScripts.includes(script.replace(/^scripts\//, ''))) fail(`E2E registry entry missing on disk: ${script}`);
}
for (const file of E2E_SCRIPT_CLASSIFICATIONS.keys()) {
  if (!/^scripts\/e2e-.+\.mjs$/.test(file)) fail(`E2E_SCRIPT_CLASSIFICATIONS key off-convention: ${file}`);
  if (!diskScripts.includes(file.replace(/^scripts\//, ''))) fail(`E2E_SCRIPT_CLASSIFICATIONS entry missing on disk: ${file}`);
}
const orphanE2e = diskE2eScripts
  .map((file) => `scripts/${file}`)
  .filter((file) => !registryScripts.includes(file) && !E2E_SCRIPT_CLASSIFICATIONS.has(file));
if (orphanE2e.length) {
  fail(`orphan scripts/e2e-*.mjs (register in e2e-registry.mjs or classify in E2E_SCRIPT_CLASSIFICATIONS): ${orphanE2e.join(', ')}`);
}

// ── Structural wiring: registries must stay the single source of truth ──
const acceptanceSource = await readFile(resolve('scripts/e2e-acceptance.mjs'), 'utf8');
if (!acceptanceSource.includes("from './e2e-registry.mjs'")) {
  fail('e2e-acceptance.mjs no longer imports the e2e registry (hardcoded suite list would drift)');
}
const fullTestsSource = await readFile(resolve('scripts/run-full-tests.mjs'), 'utf8');
if (!fullTestsSource.includes("from './test-manifest.mjs'")) {
  fail('run-full-tests.mjs no longer imports the canonical test manifest');
}

if (errors.length) {
  console.error('Test manifest mismatch.');
  for (const message of errors.sort()) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Test manifest guard passed: ${CANONICAL_TEST_SCRIPTS.length} canonical suites, ${CANONICAL_E2E_SUITES.length} canonical E2E suites, ${classifiedTestFiles.length} classified non-runnable test scripts, ${E2E_SCRIPT_CLASSIFICATIONS.size} classified E2E scripts.`);
