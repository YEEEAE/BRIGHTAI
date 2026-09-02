import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runMigrations } from '../src/lib/migrations.ts';
import { appendQcAudit, verifyAllAuditChains } from '../src/lib/audit/qcChain.ts';
import { createBackup, restoreBackup, verifyBackup } from '../src/lib/backup.ts';
import { assertSqliteDeploymentContract } from '../src/lib/db.ts';

const root = mkdtempSync(join(tmpdir(), 'brightai-qc-operations-'));
const dbPath = join(root, 'qc_tasks.db');
const backupDir = join(root, 'backups');
const migrationDir = join(process.cwd(), 'db/migrations');

try {
  assert.throws(() => assertSqliteDeploymentContract({ QC_SQLITE_INSTANCE_COUNT: '2' }), /one writable instance/);
  assert.doesNotThrow(() => assertSqliteDeploymentContract({ QC_SQLITE_INSTANCE_COUNT: '1' }));

  let db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  runMigrations(db, { migrationsDir: migrationDir, backup: false });
  db.prepare("INSERT INTO users (id, username, password_hash, full_name, role) VALUES (1, 'drill', 'hash', 'Drill User', 'admin')").run();
  db.prepare("INSERT INTO tasks (id, title, created_by) VALUES (1, 'Restore drill record', 1)").run();
  appendQcAudit(db, { entityType: 'LAB_TEST', entityId: 1, actorId: 1, action: 'CREATE', note: 'restore drill', createdAt: '2026-08-23T10:00:00.000Z' });
  db.close();

  const backup = await createBackup({ dbPath, backupDir, trigger: 'test' });
  assert.equal((await verifyBackup({ file: backup.file, expectedSchemaVersion: 39 })).result, 'PASS');

  db = new Database(dbPath);
  db.prepare("UPDATE tasks SET title = 'Mutated record' WHERE id = 1").run();
  db.close();
  const restored = await restoreBackup({ productionDbPath: dbPath, backupFile: backup.file, metadataFile: backup.metadataFile, confirmation: 'RESTORE QC DATABASE', backupDir, expectedSchemaVersion: 39 });
  assert.equal(restored.verification.result, 'PASS');

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  assert.equal(db.prepare('SELECT title FROM tasks WHERE id = 1').get().title, 'Restore drill record');
  assert.equal(db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version, 40);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(verifyAllAuditChains(db).task.status, 'PASS');
  assert.equal(verifyAllAuditChains(db).qcLab.status, 'PASS');
  db.close();
  console.log('Production operations tests passed: restore drill, restart, integrity, FK, migrations, audit chains, and deployment contract.');
} finally {
  rmSync(root, { recursive: true, force: true });
}
