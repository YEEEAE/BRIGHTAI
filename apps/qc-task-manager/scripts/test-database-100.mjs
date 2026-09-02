// Isolated database proof gate for QC-100-DATABASE-003.
// This script never resolves the application's default database path.

import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createBackup, restoreBackup, verifyBackup } from '../src/lib/backup.ts';

const root = resolve(import.meta.dirname, '..');
const tempRoot = mkdtempSync(join(tmpdir(), 'qc-database-100-'));
const dbPath = join(tempRoot, 'fresh', 'qc_tasks.db');
const backupDir = join(tempRoot, 'backups');
const restorePath = join(tempRoot, 'restored', 'qc_tasks.db');
const checks = [];

function pass(name) {
  checks.push(name);
  console.log(`PASS ${name}`);
}

function runScript(name, file, extraEnv = {}) {
  const result = spawnSync(process.execPath, ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', file], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`${name} failed:\n${result.stdout}\n${result.stderr}`);
  }
  pass(name);
}

try {
  mkdirSync(join(tempRoot, 'fresh'), { recursive: true });
  runScript('migration 001 → latest', 'scripts/test-migrations.mjs');
  runScript('embedded migration parity', 'scripts/test-embedded-migration-parity.mjs');
  runScript('schema-reference parity', 'scripts/test-schema-reference.mjs');
  runScript('DB doctor / checksum / failure diagnostics', 'scripts/test-db-doctor.mjs');
  runScript('domain constraints / duplicate prevention', 'scripts/test-db-rules.mjs');
  runScript('retention behavior', 'scripts/test-lab-retention.mjs');
  runScript('backup/restore/restart operational drill', 'scripts/test-production-operations.mjs');

  const schemaSql = readFileSync(join(root, 'db/schema.sql'), 'utf8');
  const dbSource = readFileSync(join(root, 'src/lib/db.ts'), 'utf8');
  const schemaIndexes = [...schemaSql.matchAll(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/g)].map((match) => match[1]);
  const requiredIndexes = [...dbSource.matchAll(/^\s+'(idx_[a-z0-9_]+)'[,]?$/gm)].map((match) => match[1]);
  assert.deepEqual(schemaIndexes.filter((name) => !requiredIndexes.includes(name)), []);
  pass(`index contract covers ${schemaIndexes.length} schema indexes from observed query paths`);

  const init = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/init-db.mjs'], {
    cwd: root,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_BACKUP_DIR: backupDir, QC_SEED_LAB_EQUIPMENT: '0' },
    encoding: 'utf8',
  });
  assert.equal(init.status, 0, `${init.stdout}\n${init.stderr}`);
  pass('fresh initialization');

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  assert.equal(db.pragma('journal_mode', { simple: true }), 'wal');
  assert.equal(Number(db.pragma('foreign_keys', { simple: true })), 1);
  assert.equal(Number(db.pragma('busy_timeout', { simple: true })), 5000);
  assert.equal(String(db.pragma('synchronous', { simple: true })).toLowerCase(), '1');
  pass('WAL configuration');

  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(Number(db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version), 39);
  pass('SQLite integrity check');
  pass('foreign key integrity');
  pass('restored schema version prerequisite');

  const adminId = Number(db.prepare("SELECT id FROM users WHERE username = 'admin'").get().id);
  const beforeRollback = Number(db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count);
  assert.throws(() => db.transaction(() => {
    db.prepare('INSERT INTO tasks (title, created_by) VALUES (?, ?)').run('rollback sentinel', adminId);
    throw new Error('intentional rollback');
  })(), /intentional rollback/);
  assert.equal(Number(db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count), beforeRollback);
  pass('transactional rollback behavior');

  assert.throws(() => db.prepare("INSERT INTO users (username, password_hash, full_name, role) VALUES ('admin', 'x', 'Duplicate', 'admin')").run(), /UNIQUE/);
  assert.throws(() => db.prepare('INSERT INTO tasks (title, status, created_by) VALUES (?, ?, ?)').run('invalid status', 'not-a-status', adminId), /CHECK/);
  assert.throws(() => db.prepare("INSERT INTO notifications (user_id, type, title, message) VALUES (999999, 'x', 'x', 'x')").run(), /FOREIGN KEY/);
  pass('duplicate prevention');
  pass('invalid state prevention');

  const marker = db.prepare('INSERT INTO tasks (title, description, created_by) VALUES (?, ?, ?)').run('QC-100 restore marker', 'isolated restore equality marker', adminId);
  const markerId = Number(marker.lastInsertRowid);
  const beforeRestore = db.prepare('SELECT id, title, description, created_by FROM tasks WHERE id = ?').get(markerId);
  db.close();

  const backup = await createBackup({ dbPath, backupDir, trigger: 'test' });
  assert.equal((await verifyBackup({ file: backup.file, metadataFile: backup.metadataFile, expectedSchemaVersion: 39 })).result, 'PASS');
  pass('backup creation and validation');

  const restored = await restoreBackup({
    productionDbPath: restorePath,
    backupFile: backup.file,
    metadataFile: backup.metadataFile,
    confirmation: 'RESTORE QC DATABASE',
    backupDir,
    expectedSchemaVersion: 39,
  });
  assert.equal(restored.verification.result, 'PASS');
  const restoredDb = new Database(restorePath, { readonly: true });
  restoredDb.pragma('foreign_keys = ON');
  assert.deepEqual(restoredDb.prepare('SELECT id, title, description, created_by FROM tasks WHERE id = ?').get(markerId), beforeRestore);
  assert.equal(restoredDb.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(restoredDb.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(Number(restoredDb.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version), 39);
  restoredDb.close();
  pass('restore into clean environment');
  pass('restored DB integrity');
  pass('restored DB FK check');
  pass('critical record equality before/after restore');
  pass('restart persistence (covered by production operations gate)');
  pass('downgrade/failure behavior (covered by migration/doctor gates)');

  console.log(`DATABASE-100: PASS (${checks.length} checks)`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
