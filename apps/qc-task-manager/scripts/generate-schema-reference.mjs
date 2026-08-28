// Generate the SQLTools/manual schema reference from a fresh canonical database.
// The migration runner remains the only executable schema source of truth.

import Database from 'better-sqlite3';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const SCHEMA_PATH = join(ROOT, 'db/schema.sql');
const BOOKKEEPING_TABLES = new Set(['schema_migrations', 'schema_migration_failures']);

function freshDatabase() {
  const tempDir = mkdtempSync(join(tmpdir(), 'qc-schema-reference-'));
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

function schemaObjects(db) {
  return db
    .prepare(
      `SELECT type, name, sql
       FROM sqlite_master
       WHERE sql IS NOT NULL
         AND name NOT LIKE 'sqlite_%'
         AND NOT (type = 'table' AND name IN (${[...BOOKKEEPING_TABLES].map((name) => `'${name}'`).join(', ')}))
       ORDER BY type COLLATE BINARY, name COLLATE BINARY`,
    )
    .all();
}

const { tempDir, dbPath } = freshDatabase();
try {
  const db = new Database(dbPath, { readonly: true });
  const objects = schemaObjects(db);
  db.close();

  const header = `-- QC Task Manager schema reference (generated from a fresh canonical database)\n--\n-- The executable schema history lives in db/migrations/. This file is for\n-- SQLTools/manual inspection and compatibility only; it is not used to run\n-- migrations or record schema history.\n--\n-- schema_migrations and schema_migration_failures are intentionally omitted:\n-- they are runtime bookkeeping tables owned by the migration runner.\n--\n`;
  const sql = `${header}${objects.map(({ sql: definition }) => `${definition};`).join('\n\n')}\n`;
  writeFileSync(SCHEMA_PATH, sql, 'utf8');
  console.log(`Generated ${SCHEMA_PATH} from ${objects.length} canonical schema objects.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
