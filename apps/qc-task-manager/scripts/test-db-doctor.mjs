import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runMigrations } from '../src/lib/migrations.ts';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationsDir = join(appDir, 'db/migrations');
const doctor = join(appDir, 'scripts/db-doctor.mjs');
const root = mkdtempSync(join(tmpdir(), 'brightai-db-doctor-'));

function runDoctor(dbPath) {
  return spawnSync(process.execPath, ['--experimental-strip-types', doctor], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    encoding: 'utf8',
  });
}

function createMigrated(name) {
  const path = join(root, `${name}.db`);
  const db = new Database(path);
  runMigrations(db, { migrationsDir, backup: false });
  db.close();
  return path;
}

try {
  console.log('■ Fresh and fully migrated database');
  const fresh = createMigrated('fresh');
  const freshResult = runDoctor(fresh);
  assert.equal(freshResult.status, 0, freshResult.stderr);
  assert.match(freshResult.stdout, /PASS/);
  assert.match(freshResult.stdout, /schema migration version:\s*34/);
  assert.match(freshResult.stdout, /latest repository migration version:\s*34/);
  assert.match(freshResult.stdout, /applied migration count:\s*34/);
  assert.doesNotMatch(freshResult.stdout, /DRIFT/);
  assert.doesNotMatch(freshResult.stdout, /MISSING/);

  console.log('■ Legacy and incompatible table shape');
  const legacy = join(root, 'legacy.db');
  const legacyDb = new Database(legacy);
  legacyDb.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE tasks (id INTEGER PRIMARY KEY);');
  legacyDb.close();
  const legacyResult = runDoctor(legacy);
  assert.notEqual(legacyResult.status, 0);
  assert.match(legacyResult.stdout, /The database schema is incompatible with migration history\./);
  assert.match(legacyResult.stdout, /tasks\.task_type/);

  console.log('■ Checksum drift and missing migration');
  const drift = createMigrated('drift');
  const driftDb = new Database(drift);
  driftDb.prepare('UPDATE schema_migrations SET checksum = ? WHERE version = 3').run('not-the-repository-checksum');
  driftDb.prepare('DELETE FROM schema_migrations WHERE version = 32').run();
  driftDb.close();
  const driftResult = runDoctor(drift);
  assert.notEqual(driftResult.status, 0);
  assert.match(driftResult.stdout, /003 .* DRIFT/);
  assert.match(driftResult.stdout, /032 .* MISSING/);

  console.log('■ Foreign-key violation and integrity failure reporting');
  const fk = join(root, 'fk.db');
  const fkDb = new Database(fk);
  fkDb.pragma('foreign_keys = OFF');
  fkDb.exec('CREATE TABLE parent (id INTEGER PRIMARY KEY); CREATE TABLE child (parent_id INTEGER REFERENCES parent(id)); INSERT INTO child VALUES (999);');
  fkDb.close();
  const fkResult = runDoctor(fk);
  assert.notEqual(fkResult.status, 0);
  assert.match(fkResult.stdout, /foreign_key_check: FAIL/);

  const malformed = join(root, 'malformed.db');
  writeFileSync(malformed, Buffer.from('not-a-sqlite-database'));
  const malformedResult = runDoctor(malformed);
  assert.notEqual(malformedResult.status, 0);
  assert.match(`${malformedResult.stdout}\n${malformedResult.stderr}`, /integrity|FAIL/i);

  console.log('■ In-memory destructive migration backup edge case');
  const destructiveDir = join(root, 'destructive-migrations');
  mkdirSync(destructiveDir);
  writeFileSync(join(destructiveDir, '001_initial.sql'), 'CREATE TABLE items (id INTEGER PRIMARY KEY);');
  writeFileSync(join(destructiveDir, '002_drop.sql'), '-- brightai:allow-destructive\nDROP TABLE items;');
  const memoryDb = new Database(':memory:');
  assert.doesNotThrow(() => runMigrations(memoryDb, { migrationsDir: destructiveDir, backupDir: join(root, 'backups') }));
  assert.equal(memoryDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items'").get(), undefined);
  memoryDb.close();

  console.log('■ DB doctor tests passed');
} finally {
  rmSync(root, { recursive: true, force: true });
}
