import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = mkdtempSync(join(tmpdir(), 'brightai-delete-durability-'));
process.env.QC_DATABASE_PATH = join(root, 'delete.db');
process.env.QC_SEED_LAB_EQUIPMENT = '0';
const { getDb, closeDatabase } = await import('../src/lib/db.ts');
const { reviewDeleteRequest } = await import('../src/lib/deleteRequests.ts');
const { appendQcAudit, verifyQcAuditChain } = await import('../src/lib/audit/qcChain.ts');

try {
  const db = getDb();
  db.prepare("INSERT INTO users (username, password_hash, full_name, role) VALUES ('dur-employee', 'x', 'Durability Employee', 'employee')").run();
  db.prepare("INSERT INTO users (username, password_hash, full_name, role) VALUES ('dur-manager', 'x', 'Durability Manager', 'manager')").run();
  const employee = db.prepare("SELECT id FROM users WHERE username='dur-employee'").get();
  const manager = db.prepare("SELECT id FROM users WHERE username='dur-manager'").get();

  db.prepare("INSERT INTO tasks (title, created_by, assigned_to) VALUES ('Reject durability', ?, ?)").run(manager.id, employee.id);
  const rejectedTask = db.prepare("SELECT last_insert_rowid() AS id").get().id;
  db.prepare("INSERT INTO task_delete_requests (task_id, requested_by, reason) VALUES (?, ?, 'still needed')").run(rejectedTask, employee.id);
  const rejectedRequest = db.prepare("SELECT last_insert_rowid() AS id").get().id;
  const rejected = reviewDeleteRequest({ requestId: rejectedRequest, reviewer: { id: manager.id, role: 'manager', username: 'dur-manager' }, decision: 'rejected', reviewNote: 'Keep for audit work' });
  assert.equal(rejected.ok, true);
  assert.deepEqual(db.prepare('SELECT task_id, task_title, reason, requested_by, reviewed_by, review_note, outcome FROM task_deletion_history WHERE task_id=?').get(rejectedTask), { task_id: rejectedTask, task_title: 'Reject durability', reason: 'still needed', requested_by: employee.id, reviewed_by: manager.id, review_note: 'Keep for audit work', outcome: 'rejected' });

  db.prepare("INSERT INTO tasks (title, created_by, assigned_to) VALUES ('Approve durability', ?, ?)").run(manager.id, employee.id);
  const approvedTask = db.prepare("SELECT last_insert_rowid() AS id").get().id;
  db.prepare("INSERT INTO qc_findings (finding_number, task_id, inspection_type, classification, severity, risk_description, owner, created_by) VALUES ('DUR-F-001', ?, 'audit', 'major', 'high', 'durability fixture', ?, ?)").run(approvedTask, manager.id, manager.id);
  const findingId = db.prepare("SELECT last_insert_rowid() AS id").get().id;
  appendQcAudit(db, { entityType: 'FINDING', entityId: findingId, taskId: approvedTask, actorId: manager.id, action: 'CREATE', newValue: 'durability fixture', createdAt: '2026-08-23T10:00:00.000Z' });
  assert.equal(verifyQcAuditChain(db).status, 'PASS');
  db.prepare("INSERT INTO task_delete_requests (task_id, requested_by, reason) VALUES (?, ?, 'duplicate')").run(approvedTask, employee.id);
  const approvedRequest = db.prepare("SELECT last_insert_rowid() AS id").get().id;
  const approved = reviewDeleteRequest({ requestId: approvedRequest, reviewer: { id: manager.id, role: 'manager', username: 'dur-manager' }, decision: 'approved', reviewNote: 'Approved after review' });
  assert.equal(approved.ok, true);
  assert.deepEqual(db.prepare('SELECT task_id, task_title, reason, requested_by, reviewed_by, review_note, outcome FROM task_deletion_history WHERE task_id=?').get(approvedTask), { task_id: approvedTask, task_title: 'Approve durability', reason: 'duplicate', requested_by: employee.id, reviewed_by: manager.id, review_note: 'Approved after review', outcome: 'approved' });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE id=?').get(approvedTask).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM qc_findings WHERE id=?').get(findingId).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_id=? AND task_id=?').get(findingId, approvedTask).n, 1);
  assert.equal(verifyQcAuditChain(db).status, 'PASS');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM task_activity_log WHERE task_id=? AND action='delete_approved'").get(approvedTask).n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM task_delete_requests WHERE id=?').get(approvedRequest).n, 0);
  assert.throws(() => db.prepare('DELETE FROM task_deletion_history WHERE task_id=?').run(approvedTask), /immutable/);
  console.log('Delete durability tests passed');
} finally {
  closeDatabase();
  rmSync(root, { recursive: true, force: true });
}
