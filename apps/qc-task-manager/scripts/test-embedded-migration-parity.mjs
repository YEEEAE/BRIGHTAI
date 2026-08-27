// Embedded migration parity guard.
//
// Verifies that the application's embedded migration registry
// (src/lib/migrationRegistry.ts — the SQL that ships inside the production
// bundle) is byte-for-byte identical to the repository migration files
// (db/migrations/*.sql). Fails on any of:
//   - a repository migration missing from the embedded registry
//   - an embedded migration that does not exist in the repository
//   - wrong filename / wrong version / wrong name
//   - source content or SHA-256 mismatch
//   - non-sequential migration history (disk or embedded)
//   - registry entries not bound to their .sql file via a `?raw` import
//   - db.ts not consuming the frozen EMBEDDED_MIGRATIONS registry
//
// Run: `pnpm test:embedded-migration-parity`.
// Read-only: no database is opened and no file is written.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMBEDDED_MIGRATIONS } from '../src/lib/migrationRegistry.ts';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationsDir = join(appDir, 'db/migrations');
const registryPath = join(appDir, 'src/lib/migrationRegistry.ts');
const dbModulePath = join(appDir, 'src/lib/db.ts');
const FILE_PATTERN = /^(\d{3})_([a-z0-9_]+)\.sql$/;

function sha256(source) {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

const failures = [];
function fail(message) {
  failures.push(message);
}

// ── 1. Enumerate the repository migrations ────────────────────────────────
const diskSqlFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();
for (const file of diskSqlFiles) {
  if (!FILE_PATTERN.test(file)) fail(`repository file does not match NNN_name.sql: ${file}`);
}
const diskMigrations = diskSqlFiles
  .filter((file) => FILE_PATTERN.test(file))
  .map((file) => {
    const match = FILE_PATTERN.exec(file);
    const source = readFileSync(join(migrationsDir, file), 'utf8');
    return { file, version: Number(match[1]), name: match[2], source, checksum: sha256(source) };
  });

if (diskMigrations.length === 0) fail(`no repository migration files found in ${migrationsDir}`);

diskMigrations.forEach((migration, index) => {
  if (migration.version !== index + 1) {
    fail(`non-sequential repository history: position ${index + 1} holds version ${migration.version} (${migration.file})`);
  }
});

// ── 2. Embedded registry structure ────────────────────────────────────────
if (!Object.isFrozen(EMBEDDED_MIGRATIONS)) fail('EMBEDDED_MIGRATIONS is not frozen (registry must be immutable)');
for (const entry of EMBEDDED_MIGRATIONS) {
  if (!Object.isFrozen(entry)) fail(`embedded entry ${entry.file} is not frozen (registry must be immutable)`);
}

const embeddedMigrations = EMBEDDED_MIGRATIONS.map((entry) => {
  const match = FILE_PATTERN.exec(entry.file);
  if (!match) {
    fail(`invalid embedded filename (must match NNN_name.sql): ${entry.file}`);
    return null;
  }
  return { file: entry.file, version: Number(match[1]), name: match[2], source: entry.source };
}).filter(Boolean);

embeddedMigrations.forEach((migration, index) => {
  if (migration.version !== index + 1) {
    fail(`non-sequential embedded history: position ${index + 1} holds version ${migration.version} (${migration.file})`);
  }
});

// Every embedded source must be bound to its .sql file by a `?raw` import —
// an inlined source string would silently diverge from the repository file.
const registrySource = readFileSync(registryPath, 'utf8');
const rawImports = new Map();
for (const match of registrySource.matchAll(/import\s+(\w+)\s+from\s+'([^']+\?raw)';/g)) {
  rawImports.set(match[1], match[2]);
}
const registryEntries = [
  ...registrySource.matchAll(/Object\.freeze\(\{\s*file:\s*'([^']+)',\s*source:\s*(\w+),?\s*\}\)/g),
];
for (const [, file, identifier] of registryEntries) {
  const specifier = rawImports.get(identifier);
  if (!specifier) {
    fail(`embedded entry ${file} binds source to "${identifier}" which is not a ?raw import (inline sources are forbidden)`);
  } else if (!specifier.endsWith(`/${file}?raw`)) {
    fail(`embedded entry ${file} is bound to the wrong ?raw import: ${specifier}`);
  }
}
if (registryEntries.length !== EMBEDDED_MIGRATIONS.length) {
  fail(
    `registry source declares ${registryEntries.length} entries but exports ${EMBEDDED_MIGRATIONS.length} — inspect ${registryPath}`,
  );
}

// ── 3. db.ts must consume the shared registry ─────────────────────────────
const dbModuleSource = readFileSync(dbModulePath, 'utf8');
if (!/embeddedMigrations:\s*EMBEDDED_MIGRATIONS/.test(dbModuleSource)) {
  fail(`db.ts does not pass EMBEDDED_MIGRATIONS to runMigrations — inspect ${dbModulePath}`);
}
if (/\bsource:\s*'/.test(dbModuleSource) || /\.sql\?raw/.test(dbModuleSource)) {
  fail(`db.ts still declares inline migration sources or ?raw SQL imports — the registry owns them: ${registryPath}`);
}

// ── 4. Set and order comparison ───────────────────────────────────────────
const diskByFile = new Map(diskMigrations.map((migration) => [migration.file, migration]));
const embeddedByFile = new Map(embeddedMigrations.map((migration) => [migration.file, migration]));
for (const migration of diskMigrations) {
  if (!embeddedByFile.has(migration.file)) fail(`repository migration missing from the embedded registry: ${migration.file}`);
}
for (const migration of embeddedMigrations) {
  if (!diskByFile.has(migration.file)) fail(`embedded migration does not exist in the repository: ${migration.file}`);
}
const diskOrder = diskMigrations.map((migration) => migration.file).join('\n');
const embeddedOrder = embeddedMigrations.map((migration) => migration.file).join('\n');
if (diskOrder !== embeddedOrder) {
  fail(`embedded registry order differs from the repository files:\n  repository: ${diskOrder.replaceAll('\n', ', ')}\n  embedded:   ${embeddedOrder.replaceAll('\n', ', ')}`);
}

// ── 5. Per-migration parity (exact source + SHA-256) ──────────────────────
console.log('■ Embedded migration parity');
console.log(`  repository: ${migrationsDir}`);
console.log(`  registry:   ${registryPath.replace(`${appDir}/`, '')}`);
let verified = 0;
for (const disk of diskMigrations) {
  const embedded = embeddedByFile.get(disk.file);
  if (!embedded) {
    console.log(`  ${disk.file} SKIPPED (not embedded)`);
    continue;
  }
  const problems = [];
  if (embedded.version !== disk.version) problems.push(`version ${embedded.version} != ${disk.version}`);
  if (embedded.name !== disk.name) problems.push(`name "${embedded.name}" != "${disk.name}"`);
  if (embedded.source !== disk.source) problems.push('source bytes differ');
  if (sha256(embedded.source) !== disk.checksum) problems.push('sha256 differs');
  if (problems.length > 0) {
    fail(`${disk.file}: ${problems.join('; ')}`);
    console.log(`  ${disk.file} MISMATCH (${problems.join('; ')})`);
  } else {
    verified += 1;
    console.log(`  ${disk.file} ${disk.checksum} OK`);
  }
}

// ── Verdict ───────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`\nEmbedded migration parity failures (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('EMBEDDED MIGRATION PARITY: FAIL');
  process.exitCode = 1;
} else {
  console.log(`\n  ${verified}/${diskMigrations.length} embedded migrations byte-identical to the repository (sha256 verified)`);
  console.log('EMBEDDED MIGRATION PARITY: PASS');
}
