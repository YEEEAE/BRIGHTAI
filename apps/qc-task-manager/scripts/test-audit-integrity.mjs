import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runMigrations } from '../src/lib/migrations.ts';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = mkdtempSync(join(tmpdir(), 'brightai-audit-'));
process.env.QC_DATABASE_PATH = join(root, 'activity.db');
const db = new Database(process.env.QC_DATABASE_PATH);
const { createAuditEventHash, logActivity, verifyAuditChain } = await import('../src/lib/activity.ts');
const { closeDatabase } = await import('../src/lib/db.ts');

try {
  runMigrations(db, { migrationsDir: join(appDir, 'db/migrations'), backup: false });
  db.prepare("INSERT INTO users (username, password_hash, full_name, role) VALUES ('audit-user', 'x', 'Audit User', 'admin')").run();
  db.prepare("INSERT INTO tasks (title, created_by) VALUES ('Audit task', 1)").run();

  logActivity({ taskId: 1, userId: 1, action: 'created', newValue: 'yes' });
  logActivity({ taskId: 1, userId: 1, action: 'updated', oldValue: 'yes', newValue: 'no', field: 'status', note: 'safe' });
  const rows = db.prepare('SELECT * FROM task_activity_log ORDER BY id').all();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].previous_hash, null);
  assert.equal(rows[1].previous_hash, rows[0].event_hash);
  assert.equal(rows[0].event_hash, createAuditEventHash(rows[0], null));
  assert.deepEqual(verifyAuditChain(db), { status: 'PASS' });

  db.prepare("UPDATE task_activity_log SET new_value='tampered' WHERE id=1").run();
  const result = verifyAuditChain(db);
  assert.equal(result.status, 'FAIL');
  assert.equal(result.first_invalid_event, 1);
  assert.notEqual(result.expected_hash, result.actual_hash);
  console.log('Audit integrity tests passed');
} finally {
  closeDatabase();
  db.close();
  rmSync(root, { recursive: true, force: true });
}
