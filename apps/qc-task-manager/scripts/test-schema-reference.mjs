// Verify db/schema.sql has no drift from a fresh canonical migration database.

import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const SCHEMA_PATH = join(ROOT, 'db/schema.sql');
const BOOKKEEPING_TABLES = new Set(['schema_migrations', 'schema_migration_failures']);

function schemaObjects(db) {
  return db
    .prepare(
      `SELECT type, name, sql
       FROM sqlite_master
       WHERE sql IS NOT NULL
         AND name NOT LIKE 'sqlite_%'
         AND NOT (type = 'table' AND name IN ('schema_migrations', 'schema_migration_failures'))
       ORDER BY type COLLATE BINARY, name COLLATE BINARY`,
    )
    .all();
}

function objectKey({ type, name }) {
  return `${type}:${name}`;
}

function referenceObjects(sql) {
  const objects = [];
  const pattern = /^CREATE\s+(UNIQUE\s+)?(TABLE|INDEX|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?("[^"]+"|[A-Za-z0-9_]+)/gim;
  for (const match of sql.matchAll(pattern)) {
    objects.push({
      type: match[2].toLowerCase(),
      name: match[3].replace(/^"|"$/g, ''),
    });
  }
  return objects;
}

function freshDatabase() {
  const tempDir = mkdtempSync(join(tmpdir(), 'qc-schema-reference-test-'));
  const dbPath = join(tempDir, 'fresh.db');
  const result = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/init-db.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      QC_DATABASE_PATH: dbPath,
      QC_BACKUP_DIR: join(tempDir, 'backups'),
      QC_SEED_LAB_EQUIPMENT: '0',
    },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Canonical database initialization failed:\n${result.stdout}\n${result.stderr}`);
  }
  return { tempDir, dbPath };
}

function formatObject({ type, name }) {
  return `${type} ${name}`;
}

const { tempDir, dbPath } = freshDatabase();
try {
  const freshDb = new Database(dbPath, { readonly: true });
  const referenceSql = readFileSync(SCHEMA_PATH, 'utf8');
  const reference = referenceObjects(referenceSql);
  const fresh = schemaObjects(freshDb);
  const referenceByKey = new Map(reference.map((object) => [objectKey(object), object]));
  const freshByKey = new Map(fresh.map((object) => [objectKey(object), object]));
  const missing = fresh.filter((object) => !referenceByKey.has(objectKey(object)));
  const unexpected = reference.filter((object) => !freshByKey.has(objectKey(object)));
  const changed = fresh.filter(
    (object) => referenceByKey.has(objectKey(object)) && !referenceSql.includes(`${object.sql};`),
  );
  const orderChanged = fresh.some((object, index) => objectKey(reference[index] ?? {}) !== objectKey(object));

  const bookkeepingInReference = [...BOOKKEEPING_TABLES].filter((name) =>
    reference.some((object) => object.type === 'table' && object.name === name),
  );
  if (bookkeepingInReference.length) {
    unexpected.push(...bookkeepingInReference.map((name) => ({ type: 'table', name })));
  }

  if (missing.length || unexpected.length || changed.length || orderChanged) {
    console.error('Schema reference drift detected.');
    if (missing.length) console.error(`Missing from db/schema.sql: ${missing.map(formatObject).join(', ')}`);
    if (unexpected.length) console.error(`Unexpected in db/schema.sql: ${unexpected.map(formatObject).join(', ')}`);
    if (changed.length) console.error(`Definitions changed: ${changed.map(formatObject).join(', ')}`);
    if (orderChanged) console.error('Object order changed: expected sqlite_master ORDER BY type, name.');
    process.exitCode = 1;
  } else {
    console.log(`Schema reference passed: ${fresh.length} objects match the fresh canonical database.`);
  }

  freshDb.close();
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
