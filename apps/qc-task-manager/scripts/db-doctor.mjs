// Read-only migration and SQLite diagnostics for the QC Task Manager.
// Run with `pnpm db:status` or `pnpm db:verify` (the pnpm scripts register the
// repo test-ts-loader, required to import the embedded migration registry).

import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { EMBEDDED_MIGRATIONS } from '../src/lib/migrationRegistry.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');
const defaultDbPath = resolve(appDir, 'db/qc_tasks.db');
const dbPath = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? defaultDbPath;
const migrationsDir = join(appDir, 'db/migrations');

const REQUIRED_COLUMNS = {
  tasks: ['task_type'],
  task_attachments: ['evidence_type'],
  users: ['skills_json'],
  task_activity_log: ['previous_hash'],
  lab_test_templates: ['current_version_id'],
  lab_test_records: ['product_id', 'created_by'],
  lab_documents: ['code', 'approved_at'],
  lab_test_samples: ['test_id'],
};

function checksum(source) {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

function repositoryMigrations() {
  return readdirSync(migrationsDir)
    .filter((file) => /^\d{3}_[a-z0-9_]+\.sql$/.test(file))
    .sort()
    .map((file) => {
      const source = readFileSync(join(migrationsDir, file), 'utf8');
      const match = /^(\d{3})_([a-z0-9_]+)\.sql$/.exec(file);
      return { version: Number(match[1]), name: match[2], file, checksum: checksum(source) };
    });
}

// Disk/bundle parity is INDEPENDENT of the database: it compares the
// repository migration files against the embedded registry that ships inside
// the production bundle (src/lib/migrationRegistry.ts). A database can be
// healthy here while a deployed bundle would still drift at boot, so this is
// reported as its own section and folded into the overall PASS/FAIL.
function embeddedBundleParity() {
  console.log('embedded bundle parity (repository vs embedded registry):');
  const disk = repositoryMigrations();
  const embedded = [];
  let ok = true;
  for (const entry of EMBEDDED_MIGRATIONS) {
    const match = /^(\d{3})_([a-z0-9_]+)\.sql$/.exec(entry.file);
    if (!match) {
      ok = false;
      console.log(`${entry.file} MISMATCH (invalid embedded filename)`);
      continue;
    }
    embedded.push({ version: Number(match[1]), name: match[2], file: entry.file, checksum: checksum(entry.source) });
  }
  const diskByFile = new Map(disk.map((migration) => [migration.file, migration]));
  const embeddedByFile = new Map(embedded.map((migration) => [migration.file, migration]));
  for (const migration of disk) {
    const bundled = embeddedByFile.get(migration.file);
    if (!bundled) {
      ok = false;
      console.log(`${migration.file} not embedded`);
    } else if (
      bundled.checksum !== migration.checksum ||
      bundled.name !== migration.name ||
      bundled.version !== migration.version
    ) {
      ok = false;
      console.log(
        `${migration.file} MISMATCH bundled=${bundled.checksum.slice(0, 12)} repository=${migration.checksum.slice(0, 12)}`,
      );
    }
  }
  for (const migration of embedded) {
    if (!diskByFile.has(migration.file)) {
      ok = false;
      console.log(`${migration.file} embedded but absent from the repository`);
    }
  }
  if (embedded.length !== disk.length) {
    ok = false;
    console.log(`registry count ${embedded.length} != repository count ${disk.length}`);
  }
  console.log(`embedded bundle parity: ${ok ? 'PASS' : 'FAIL'}`);
  return ok;
}

function print(label, value) {
  console.log(`${label}: ${value}`);
}

function printGuidance() {
  console.log('');
  console.log('Safe guidance:');
  console.log('For existing database:');
  console.log('pnpm db:init');
  console.log('For disposable local database only:');
  console.log('pnpm db:reset');
  console.log('Never use db:reset if the database contains production or user data.');
  console.log('Do not execute individual migration files from DataGrip/SQLTools.');
  console.log('002 is a runner marker and is not a standalone SQL migration.');
}

function tableExists(db, table) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}

function columns(db, table) {
  if (!tableExists(db, table)) return new Set();
  return new Set(db.prepare(`PRAGMA table_info("${table.replaceAll('"', '""')}")`).all().map((row) => row.name));
}

function diagnose(db, migrations) {
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name));
  const hasMigrations = tables.has('schema_migrations');
  const hasFailures = tables.has('schema_migration_failures');
  const appliedRows = hasMigrations
    ? db.prepare('SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version').all()
    : [];
  const appliedByVersion = new Map(appliedRows.map((row) => [Number(row.version), row]));
  const latest = migrations.at(-1)?.version ?? 0;
  const current = appliedRows.length > 0 ? Math.max(...appliedRows.map((row) => Number(row.version))) : 0;

  print('schema migration version', current);
  print('latest repository migration version', latest);
  print('applied migration count', appliedRows.length);
  print('migration failures count', hasFailures ? db.prepare('SELECT COUNT(*) AS count FROM schema_migration_failures').get().count : 0);
  console.log('migration checksums:');

  let migrationOk = hasMigrations;
  for (const migration of migrations) {
    const applied = appliedByVersion.get(migration.version);
    let state = 'MISSING';
    if (applied) {
      state = applied.name === migration.name && applied.checksum === migration.checksum ? 'MATCH' : 'DRIFT';
    }
    if (state !== 'MATCH') migrationOk = false;
    console.log(`${String(migration.version).padStart(3, '0')} ${migration.name} ${state} applied_at=${applied?.applied_at ?? '-'}`);
  }
  for (const applied of appliedRows) {
    if (!migrations.some((migration) => migration.version === Number(applied.version))) {
      migrationOk = false;
      console.log(`${String(applied.version).padStart(3, '0')} ${applied.name} DRIFT applied_at=${applied.applied_at}`);
    }
  }

  const missingSchema = [];
  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    if (!tables.has(table)) {
      missingSchema.push(`${table} (table)`);
      continue;
    }
    const actualColumns = columns(db, table);
    for (const column of required) {
      if (!actualColumns.has(column)) missingSchema.push(`${table}.${column}`);
    }
  }
  if (missingSchema.length > 0) {
    console.log(`schema diagnostics: FAIL missing ${missingSchema.join(', ')}`);
    console.log('The database schema is incompatible with migration history.');
  } else {
    console.log('schema diagnostics: PASS');
  }

  const integrity = String(db.prepare('PRAGMA integrity_check').get().integrity_check);
  const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
  print('integrity_check', integrity === 'ok' ? 'PASS' : `FAIL (${integrity})`);
  print('foreign_key_check', foreignKeys.length === 0 ? 'PASS' : `FAIL (${foreignKeys.length} violation(s))`);
  return migrationOk && missingSchema.length === 0 && integrity === 'ok' && foreignKeys.length === 0;
}

function main() {
  console.log(`Resolved database path: ${dbPath}`);
  print('File exists', existsSync(dbPath) ? 'YES' : 'NO');
  if (!existsSync(dbPath)) {
    print('File size', '0');
    print('WAL mode', 'UNKNOWN');
    print('foreign_keys state', 'UNKNOWN');
    printGuidance();
    console.log('PASS / FAIL: FAIL');
    process.exitCode = 1;
    return;
  }
  print('File size', statSync(dbPath).size);

  let db;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
    print('WAL mode', String(db.pragma('journal_mode', { simple: true })).toUpperCase());
    // foreign_keys is connection-local; enabling it here is read-only and
    // makes the following foreign_key_check meaningful for this connection.
    db.pragma('foreign_keys = ON');
    print('foreign_keys state', String(db.pragma('foreign_keys', { simple: true })) === '1' ? 'ON' : 'OFF');
    const ok = diagnose(db, repositoryMigrations());
    const parityOk = embeddedBundleParity();
    console.log(`PASS / FAIL: ${ok && parityOk ? 'PASS' : 'FAIL'}`);
    if (!ok || !parityOk) process.exitCode = 1;
  } catch (error) {
    print('WAL mode', 'UNKNOWN');
    print('foreign_keys state', 'UNKNOWN');
    print('integrity_check', 'FAIL');
    print('foreign_key_check', 'FAIL');
    console.log(`diagnostic error: ${error instanceof Error ? error.message : String(error)}`);
    console.log('PASS / FAIL: FAIL');
    process.exitCode = 1;
  } finally {
    db?.close();
    printGuidance();
  }
}

main();
