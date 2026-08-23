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
const { appendQcAudit, verifyQcAuditChain } = await import('../src/lib/audit/qcChain.ts');
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

  // A legitimate task deletion must retain both the deletion decision and
  // the activity rows that carry the global chain through the deleted task.
  db.prepare("UPDATE task_activity_log SET new_value='no' WHERE id=1").run();
  db.prepare("DELETE FROM task_activity_log").run();
  db.prepare("INSERT INTO tasks (title, created_by) VALUES ('Delete me', 1)").run();
  const taskId = Number(db.prepare("SELECT id FROM tasks WHERE title='Delete me'").get().id);
  db.prepare("INSERT INTO tasks (title, created_by) VALUES ('Keep me', 1)").run();
  const survivorId = Number(db.prepare("SELECT id FROM tasks WHERE title='Keep me'").get().id);
  logActivity({ taskId, userId: 1, action: 'before_delete', newValue: 'yes' });
  logActivity({ taskId: survivorId, userId: 1, action: 'survivor', newValue: 'yes' });
  db.prepare("INSERT INTO task_delete_requests (task_id, requested_by, reason, status, reviewed_by, reviewed_at, review_note) VALUES (?, 1, 'duplicate', 'approved', 1, '2026-08-23T10:00:00.000Z', 'approved')").run(taskId);
  db.prepare("INSERT INTO task_deletion_history (task_id, task_title, requested_by, reason, reviewed_by, review_note, requested_at, reviewed_at, outcome) VALUES (?, 'Delete me', 1, 'duplicate', 1, 'approved', '2026-08-23T09:00:00.000Z', '2026-08-23T10:00:00.000Z', 'approved')").run(taskId);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM task_deletion_history WHERE task_id = ?').get(taskId).n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM task_activity_log WHERE task_id = ?').get(taskId).n, 1);
  assert.equal(verifyAuditChain(db).status, 'PASS');

  const qc1 = appendQcAudit(db, { entityType: 'LAB_TEST', entityId: 1, actorId: 1, action: 'CREATE', note: 'one', createdAt: '2026-08-23T10:00:00.000Z' });
  appendQcAudit(db, { entityType: 'LAB_TEST', entityId: 1, actorId: 1, action: 'UPDATE', note: 'two', createdAt: '2026-08-23T10:01:00.000Z' });
  assert.equal(verifyQcAuditChain(db).status, 'PASS');
  db.prepare("UPDATE qc_audit_log SET note='tampered' WHERE id=?").run(qc1);
  assert.equal(verifyQcAuditChain(db).status, 'FAIL');
  db.prepare("UPDATE qc_audit_log SET note='one' WHERE id=?").run(qc1);
  db.prepare('DELETE FROM qc_audit_log WHERE id=?').run(qc1);
  assert.equal(verifyQcAuditChain(db).status, 'FAIL');
  console.log('Audit integrity tests passed');
} finally {
  closeDatabase();
  db.close();
  rmSync(root, { recursive: true, force: true });
}
