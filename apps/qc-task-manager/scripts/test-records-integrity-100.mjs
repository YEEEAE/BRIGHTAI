// End-to-end record integrity and high-authority approval proof gate.
//
// This test intentionally exercises both layers of evidence:
//   - login_attempts: authentication/security attempts only;
//   - qc_audit_log + lab_test_approvals: durable business actions/snapshots.
//
// It also probes the mutation boundary directly, because a service-only guard
// is not enough for approved, void, superseded, or historical records.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const appDir = process.cwd();
const root = mkdtempSync(join(tmpdir(), 'brightai-record-integrity-'));
const dbPath = join(root, 'records.db');
const backupDir = join(root, 'backups');
const restorePath = join(root, 'restored.db');

process.env.QC_DATABASE_PATH = dbPath;
process.env.QC_DB_PATH = dbPath;
process.env.QC_SEED_LAB_EQUIPMENT = '0';
process.env.QC_STORAGE_DRIVER = 'local';
process.env.QC_LOCAL_STORAGE_DIR = join(root, 'storage');

let passed = 0;
function pass(label) {
  passed += 1;
  console.log(`  ✅ ${label}`);
}
function throws(label, fn, pattern = /immutable|cannot be deleted|not awaiting|permission|already/) {
  assert.throws(fn, pattern, label);
  pass(label);
}
function idFor(db, username) {
  return Number(db.prepare('SELECT id FROM users WHERE username = ?').get(username).id);
}
function insertTest(db, number, testedBy, status = 'SUBMITTED') {
  return Number(db.prepare(`
    INSERT INTO lab_test_records
      (test_number, test_type, sample_count, final_result, status, tested_by,
       created_by, submitted_at, created_at, updated_at)
    VALUES (?, 'air', 1, 'PASS', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
  `).run(number, status, testedBy, testedBy).lastInsertRowid);
}

let db;
try {
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '0' },
    stdio: 'ignore',
  });

  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { verifyAllAuditChains } = await import('../src/lib/audit/qcChain.ts');
  const { ensureLabApprovalsAndAudit, verifyLabTestApprovalSealing } = await import('../src/lib/qcWorkflow.ts');
  const { transitionLabTest } = await import('../src/lib/lab/review.ts');
  const { voidLabTest } = await import('../src/lib/lab/tests.ts');
  const docs = await import('../src/lib/lab/documents.ts');
  const templates = await import('../src/lib/lab/templates.ts');
  const { requireEsignature, auditEsignAttempt, esignAuditNote } = await import('../src/lib/lab/esignature.ts');
  const { applyTaskUpdate } = await import('../src/lib/taskUpdates/update.ts');
  const { createBackup, restoreBackup, verifyBackup } = await import('../src/lib/backup.ts');

  db = getDb();
  ensureLabApprovalsAndAudit(db);
  const adminId = idFor(db, 'admin');
  const managerId = idFor(db, 'manager');
  const supervisorId = idFor(db, 'supervisor');
  const employeeId = idFor(db, 'employee');

  console.log('■ Security-attempt audit is separate from business approval audit');
  assert.equal(requireEsignature(managerId, ''), 'invalid');
  assert.equal(requireEsignature(managerId, undefined), 'invalid');
  assert.equal(
    Number(db.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE username = 'manager' AND ip_address = 'e-signature:failed'").get().n),
    2,
  );
  pass('empty and missing passwords are invalid, counted, and recorded in login_attempts');
  assert.equal(requireEsignature(managerId, 'not-the-password'), 'invalid');
  for (let i = 0; i < 4; i += 1) requireEsignature(adminId, 'not-the-password');
  assert.equal(requireEsignature(adminId, 'not-the-password'), 'invalid');
  assert.equal(requireEsignature(adminId, 'admin123'), 'rate_limited');
  pass('wrong, rate-limited, and correct-while-locked attempts never approve an action');
  db.exec('DROP TABLE login_attempts');
  assert.doesNotThrow(() => auditEsignAttempt(managerId, 'failed'));
  db.exec(`CREATE TABLE login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    ip_address TEXT,
    succeeded INTEGER NOT NULL CHECK (succeeded IN (0,1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  pass('failed security-audit write path is fail-closed for the business action and never throws to the caller');

  console.log('■ Lab test approval: identity, snapshot, SoD, replay, and immutability');
  const approvedTestId = insertTest(db, 'INT-APPROVED-001', employeeId);
  db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, \'PASS\')').run(approvedTestId);
  throws('self-approval is rejected', () => transitionLabTest({ id: employeeId, role: 'employee' }, 'approve', approvedTestId, 'self', { esigned: true }), /Segregation/);
  throws('supervisor role cannot bypass approval authority', () => transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'approve', approvedTestId, 'role bypass', { esigned: true }), /permission/);
  const approved = transitionLabTest({ id: managerId, role: 'manager' }, 'approve', approvedTestId, 'Release approval', { esigned: true, signatureReason: 'I approve the recorded result for release' });
  assert.equal(approved.status, 'APPROVED');
  const seal = db.prepare('SELECT * FROM lab_test_approvals WHERE test_id = ?').get(approvedTestId);
  assert.equal(seal.approver_id, managerId);
  assert.equal(seal.signature_reason, 'I approve the recorded result for release');
  assert.ok(seal.signed_at && seal.raw_payload_json && seal.record_hash);
  assert.equal(verifyLabTestApprovalSealing(db, approvedTestId).valid, true);
  pass('approved test stores actor, signature meaning, timestamp, immutable snapshot payload, and hash');
  throws('double approval/replay is rejected by current state', () => transitionLabTest({ id: managerId, role: 'manager' }, 'approve', approvedTestId, 'replay', { esigned: true }), /not awaiting/);
  throws('approved lab test UPDATE is blocked', () => db.prepare("UPDATE lab_test_records SET remarks = 'tampered' WHERE id = ?").run(approvedTestId));
  throws('approved lab test DELETE is blocked', () => db.prepare('DELETE FROM lab_test_records WHERE id = ?').run(approvedTestId));
  throws('historical approval metadata UPDATE is blocked', () => db.prepare("UPDATE lab_test_approvals SET signature_reason = 'tampered' WHERE test_id = ?").run(approvedTestId));
  throws('historical approval metadata DELETE is blocked', () => db.prepare('DELETE FROM lab_test_approvals WHERE test_id = ?').run(approvedTestId));

  const staleTestId = insertTest(db, 'INT-STALE-001', employeeId);
  db.prepare("UPDATE lab_test_records SET status = 'REJECTED', rejected_reason = 'stale state' WHERE id = ?").run(staleTestId);
  throws('stale record approval is rejected from current state', () => transitionLabTest({ id: managerId, role: 'manager' }, 'approve', staleTestId, 'stale', { esigned: true }), /not awaiting/);

  console.log('■ Lab test VOID: reason/e-sign evidence and terminal immutability');
  const voidTestId = insertTest(db, 'INT-VOID-001', employeeId);
  const voidResult = voidLabTest({ id: managerId, role: 'manager' }, voidTestId, 'Operator error recorded', { esigned: true });
  assert.equal(voidResult.status, 'VOID');
  const voidAudit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'VOID'").get(voidTestId);
  assert.equal(voidAudit.actor_id, managerId);
  assert.equal(voidAudit.old_value, 'SUBMITTED');
  assert.equal(voidAudit.new_value, 'VOID');
  assert.ok(voidAudit.created_at && String(voidAudit.note).includes('Operator error recorded') && String(voidAudit.note).includes('approved with e-signature'));
  const voidSeal = db.prepare("SELECT * FROM lab_test_approvals WHERE test_id = ? AND action = 'VOID'").get(voidTestId);
  assert.equal(voidSeal.approver_id, managerId);
  assert.equal(voidSeal.signature_reason, 'Operator error recorded');
  assert.ok(voidSeal.signed_at && voidSeal.raw_payload_json && voidSeal.record_hash);
  assert.equal(verifyLabTestApprovalSealing(db, voidTestId).valid, true);
  pass('VOID evidence carries actor, record/action, before/after state, timestamp, reason, signature meaning, and final snapshot seal');
  throws('VOID lab test UPDATE is blocked', () => db.prepare("UPDATE lab_test_records SET remarks = 'tampered' WHERE id = ?").run(voidTestId));
  throws('VOID lab test DELETE is blocked', () => db.prepare('DELETE FROM lab_test_records WHERE id = ?').run(voidTestId));
  throws('second VOID is rejected', () => voidLabTest({ id: managerId, role: 'manager' }, voidTestId, 'second reason', { esigned: true }), /already voided/);

  console.log('■ Controlled document and template versions');
  const docId = Number(db.prepare(`INSERT INTO lab_documents (code, title, type, status, owner_id, created_by) VALUES ('INT-SOP-001', 'Integrity SOP', 'SOP', 'IN_REVIEW', ?, ?)`).run(employeeId, employeeId).lastInsertRowid);
  const docV1 = Number(db.prepare(`INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id) VALUES (?, 1, '# v1', 'IN_REVIEW', ?)`).run(docId, employeeId).lastInsertRowid);
  db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(docV1, docId);
  docs.approveLabDocument(docId, { id: managerId, role: 'manager' }, esignAuditNote('Release v1'));
  const docApproval = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'APPROVAL'").get(docId);
  assert.equal(docApproval.actor_id, managerId);
  assert.equal(docApproval.old_value, 'IN_REVIEW');
  assert.equal(docApproval.new_value, 'APPROVED');
  assert.ok(String(docApproval.note).includes('v1') && String(docApproval.note).includes('approved with e-signature') && docApproval.created_at);
  pass('approved document evidence links actor, document/version, action, timestamp, signature meaning, and version');
  throws('approved document version UPDATE is blocked', () => db.prepare("UPDATE lab_document_versions SET content_md = 'tampered' WHERE id = ?").run(docV1));
  throws('approved document version DELETE is blocked', () => db.prepare('DELETE FROM lab_document_versions WHERE id = ?').run(docV1));

  const docV2 = Number(db.prepare(`INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id) VALUES (?, 2, '# v2', 'IN_REVIEW', ?)`).run(docId, employeeId).lastInsertRowid);
  db.prepare("UPDATE lab_documents SET current_version_id = ?, status = 'IN_REVIEW' WHERE id = ?").run(docV2, docId);
  docs.approveLabDocument(docId, { id: managerId, role: 'manager' }, esignAuditNote('Release v2'));
  throws('superseded document version UPDATE is blocked', () => db.prepare("UPDATE lab_document_versions SET content_md = 'tampered' WHERE id = ?").run(docV1));
  throws('superseded document version DELETE is blocked', () => db.prepare('DELETE FROM lab_document_versions WHERE id = ?').run(docV1));

  const templateId = Number(db.prepare(`INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES ('Integrity Template', 'INT-TPL-001', 'air', 'DRAFT', ?)`).run(employeeId).lastInsertRowid);
  const tplV1 = Number(db.prepare(`INSERT INTO lab_test_template_versions (template_id, version, parameters_json, status, created_by) VALUES (?, 1, '{}', 'IN_REVIEW', ?)`).run(templateId, employeeId).lastInsertRowid);
  templates.approveLabTemplate(templateId, { id: managerId, role: 'manager' }, null, 'Release template v1');
  const templateApproval = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEMPLATE' AND entity_id = ? AND action = 'APPROVAL'").get(templateId);
  assert.equal(templateApproval.actor_id, managerId);
  assert.ok(String(templateApproval.note).includes('approved v1') && String(templateApproval.note).includes('approved with e-signature') && templateApproval.created_at);
  pass('approved template evidence links actor, template/version, action, timestamp, signature meaning, and version');
  throws('approved template version UPDATE is blocked', () => db.prepare("UPDATE lab_test_template_versions SET parameters_json = '{\"tampered\":true}' WHERE id = ?").run(tplV1));
  throws('approved template version DELETE is blocked', () => db.prepare('DELETE FROM lab_test_template_versions WHERE id = ?').run(tplV1));
  const tplV2 = Number(db.prepare(`INSERT INTO lab_test_template_versions (template_id, version, parameters_json, status, created_by) VALUES (?, 2, '{}', 'IN_REVIEW', ?)`).run(templateId, employeeId).lastInsertRowid);
  templates.approveLabTemplate(templateId, { id: managerId, role: 'manager' }, null, 'Release template v2');
  assert.equal(db.prepare('SELECT status FROM lab_test_template_versions WHERE id = ?').get(tplV1).status, 'SUPERSEDED');
  throws('superseded template version UPDATE is blocked', () => db.prepare("UPDATE lab_test_template_versions SET parameters_json = '{\"tampered\":true}' WHERE id = ?").run(tplV1));
  throws('superseded template version DELETE is blocked', () => db.prepare('DELETE FROM lab_test_template_versions WHERE id = ?').run(tplV1));
  assert.equal(db.prepare('SELECT id FROM lab_test_template_versions WHERE id = ?').get(tplV2).id, tplV2);

  console.log('■ Terminal task, audit chain, and backup/restore');
  const terminalTaskId = Number(db.prepare("INSERT INTO tasks (title, status, created_by, completed_by, completed_at) VALUES ('Terminal integrity task', 'completed', ?, ?, datetime('now'))").run(managerId, managerId).lastInsertRowid);
  const form = new FormData();
  form.set('title', 'attempted mutation');
  const taskResult = applyTaskUpdate({ taskId: terminalTaskId, actor: { id: managerId, role: 'manager' }, form });
  assert.equal(taskResult.ok, false);
  pass('completed terminal task mutation is rejected by the canonical state machine');
  const chains = verifyAllAuditChains(db);
  assert.equal(chains.task.status, 'PASS');
  assert.equal(chains.qcLab.status, 'PASS');
  pass('task and QC audit chains verify PASS before backup');
  const qcAuditId = db.prepare("SELECT id FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'APPROVAL'").get(approvedTestId).id;
  throws('historical business audit UPDATE is blocked', () => db.prepare("UPDATE qc_audit_log SET note = 'tampered' WHERE id = ?").run(qcAuditId));
  throws('historical business audit DELETE is blocked', () => db.prepare('DELETE FROM qc_audit_log WHERE id = ?').run(qcAuditId));

  closeDatabase();
  const backup = await createBackup({ dbPath, backupDir, trigger: 'records-integrity' });
  assert.equal((await verifyBackup({ file: backup.file, metadataFile: backup.metadataFile, expectedSchemaVersion: 40 })).result, 'PASS');
  const restored = await restoreBackup({ productionDbPath: restorePath, backupFile: backup.file, metadataFile: backup.metadataFile, confirmation: 'RESTORE QC DATABASE', backupDir, expectedSchemaVersion: 40 });
  assert.equal(restored.verification.result, 'PASS');
  const restoredDb = new Database(restorePath, { readonly: true });
  assert.equal(restoredDb.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(restoredDb.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(restoredDb.prepare('SELECT status FROM lab_test_records WHERE id = ?').get(voidTestId).status, 'VOID');
  assert.equal(restoredDb.prepare('SELECT COUNT(*) AS n FROM lab_test_approvals WHERE test_id = ?').get(approvedTestId).n, 1);
  assert.equal(restoredDb.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'trigger' AND name = 'lab_test_records_terminal_update'").get().n, 1);
  assert.equal(verifyAllAuditChains(restoredDb).qcLab.status, 'PASS');
  restoredDb.close();
  pass('backup/restore preserves terminal records, approval evidence, guards, and audit-chain integrity');

  console.log(`RECORDS-INTEGRITY-100: PASS (${passed} checks)`);
} finally {
  try {
    const { closeDatabase } = await import('../src/lib/db.ts');
    closeDatabase();
  } catch {}
  if (db?.open) db.close();
  rmSync(root, { recursive: true, force: true });
}
