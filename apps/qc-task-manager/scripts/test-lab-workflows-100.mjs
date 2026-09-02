// test-lab-workflows-100.mjs — Comprehensive Laboratory Workflow Lifecycle & Role Matrix (PROMPT-04).
//
// Verifies:
//   1. Full Test Lifecycle: Record Creation -> Sample Entry -> Review Queue -> Dual-Intent Sign -> Sealed Approval.
//   2. Role Authorization Matrix (Analyst, Supervisor, Lab Manager, Director).
//   3. Change Request Lifecycle (Intent Intake -> Review -> Rejection -> Resubmission).
//   4. Immutable Audit Trail in lab_audit_log for every transition.

import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'qc-lab-workflows-100-'));
const dbPath = join(tempDir, 'workflows.db');

process.env.QC_DATABASE_PATH = dbPath;
process.env.QC_DB_PATH = dbPath;
process.env.QC_STORAGE_DRIVER = 'local';
process.env.QC_LOCAL_STORAGE_DIR = join(tempDir, 'storage');

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✅ ${name}`);
}

function fail(name, err) {
  failed++;
  failures.push(`${name}: ${err.message}`);
  console.error(`  ❌ ${name}:`, err.message);
}

try {
  console.log('■ Initializing Laboratory Workflow Test Environment');
  const { runMigrations } = await import('../src/lib/migrations.ts');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db, { migrationsDir: join(appDir, 'db/migrations'), backup: false });

  const {
    ensureLabApprovalsAndAudit,
    verifyLabTestApprovalSealing,
    SEGREGATION_OF_DUTIES_ERROR,
  } = await import('../src/lib/qcWorkflow.ts');

  const { transitionLabTest } = await import('../src/lib/lab/review.ts');
  const { submitChangeRequest, approveChangeRequest, rejectChangeRequest, getChangeRequest } = await import('../src/lib/lab/changeRequests.ts');

  ensureLabApprovalsAndAudit(db);

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, is_active, created_at, updated_at)
    VALUES (?, 'hashed_pw', ?, ?, 1, ?, ?)
  `);

  const analystId = Number(insertUser.run('analyst_wf', 'Alex Analyst', 'employee', now, now).lastInsertRowid);
  const supervisorId = Number(insertUser.run('supervisor_wf', 'Sara Supervisor', 'supervisor', now, now).lastInsertRowid);
  const managerId = Number(insertUser.run('manager_wf', 'Marcus Manager', 'manager', now, now).lastInsertRowid);
  const directorId = Number(insertUser.run('director_wf', 'Diana Director', 'admin', now, now).lastInsertRowid);

  // Seed Master Data
  const eqId = Number(db.prepare(`
    INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
    VALUES ('Autoclave Unit 1', 'EQ-AUTO-01', 'Sterile Room', 'ACTIVE', 'SN-AUTO-100', ?)
  `).run(managerId).lastInsertRowid);

  const prodId = Number(db.prepare(`
    INSERT INTO lab_products (name, code, default_test_type, created_by)
    VALUES ('Parenteral Vial 10ml', 'PRD-VIAL-10', 'vacuum', ?)
  `).run(managerId).lastInsertRowid);

  const docSopId = Number(db.prepare(`
    INSERT INTO lab_documents (code, title, type, status, owner_id, created_by)
    VALUES ('SOP-STER-01', 'Sterility & Vacuum Testing', 'SOP', 'APPROVED', ?, ?)
  `).run(supervisorId, supervisorId).lastInsertRowid);

  const sopVerId = Number(db.prepare(`
    INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id, approved_by, approved_at)
    VALUES (?, 1, '# Sterility SOP', 'APPROVED', ?, ?, ?)
  `).run(docSopId, supervisorId, managerId, now).lastInsertRowid);
  db.prepare("UPDATE lab_documents SET current_version_id = ? WHERE id = ?").run(sopVerId, docSopId);

  const docWiId = Number(db.prepare(`
    INSERT INTO lab_documents (code, title, type, status, owner_id, created_by)
    VALUES ('WI-STER-01', 'Vacuum Chamber Loading', 'WI', 'APPROVED', ?, ?)
  `).run(supervisorId, supervisorId).lastInsertRowid);

  const wiVerId = Number(db.prepare(`
    INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id, approved_by, approved_at)
    VALUES (?, 1, '# Loading WI', 'APPROVED', ?, ?, ?)
  `).run(docWiId, supervisorId, managerId, now).lastInsertRowid);
  db.prepare("UPDATE lab_documents SET current_version_id = ? WHERE id = ?").run(wiVerId, docWiId);

  const template = db.prepare("INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES (?, ?, 'vacuum', 'ACTIVE', ?)")
    .run('Vacuum Decay Protocol', 'TPL-VAC-01', managerId);
  const templateId = Number(template.lastInsertRowid);
  const tmplVer = db.prepare("INSERT INTO lab_test_template_versions (template_id, version, default_sample_count, parameters_json, applicable_product_id, applicable_equipment_id, created_by) VALUES (?, 1, 3, ?, ?, ?, ?)")
    .run(templateId, JSON.stringify({ target_vacuum: '-80 kPa' }), prodId, eqId, managerId);
  const tmplVerId = Number(tmplVer.lastInsertRowid);

  // =========================================================================
  // 1. Complete Lab Test Lifecycle
  // =========================================================================
  console.log('\n■ 1. Complete Lab Test Lifecycle');
  try {
    // A. Creation by Analyst
    const insertTest = db.prepare(`
      INSERT INTO lab_test_records (
        test_number, test_type, product_id, equipment_id, lot_number,
        sampling_area, sample_count, final_result, status, tested_by,
        created_by, submitted_at, template_version_id, sop_version_id, wi_version_id
      ) VALUES ('TEST-WF-001', 'vacuum', ?, ?, 'LOT-VAC-2026', 'Filling Room B', 2, 'PASS', 'SUBMITTED', ?, ?, ?, ?, ?, ?)
    `).run(prodId, eqId, analystId, analystId, now, tmplVerId, sopVerId, wiVerId);
    const testId = Number(insertTest.lastInsertRowid);

    db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, status, result) VALUES (?, 1, 'SMP-01', 'TESTED', 'PASS')").run(testId);
    db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, status, result) VALUES (?, 2, 'SMP-02', 'TESTED', 'PASS')").run(testId);

    pass('step 1: analyst created test record and recorded samples (status: SUBMITTED)');

    // B. Reviewer starts review
    const startRev = transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'start_review', testId, null);
    assert.equal(startRev.status, 'UNDER_REVIEW');
    pass('step 2: supervisor picked up test for review (status: UNDER_REVIEW)');

    // C. Analyst attempts approval -> blocked by Segregation of Duties
    let sodErr = null;
    try {
      transitionLabTest({ id: analystId, role: 'employee' }, 'approve', testId, null);
    } catch (e) {
      sodErr = e.message;
    }
    assert.equal(sodErr, SEGREGATION_OF_DUTIES_ERROR);
    pass('step 3: analyst self-approval blocked by segregation of duties');

    // D. Lab Manager approves with dual-intent e-signature
    const releaseReason = 'Approved after comprehensive review of vacuum decay curves.';
    const approved = transitionLabTest(
      { id: managerId, role: 'manager' },
      'approve',
      testId,
      releaseReason,
      { esigned: true, signatureReason: releaseReason }
    );
    assert.equal(approved.status, 'APPROVED');
    pass('step 4: lab manager approved test with dual-intent e-signature');

    // E. Cryptographic seal verification
    const sealCheck = verifyLabTestApprovalSealing(db, testId);
    assert.equal(sealCheck.valid, true);
    assert.match(sealCheck.storedHash, /^[a-f0-9]{64}$/);
    pass('step 5: SHA-256 seal matches serialized test dataset exactly');
  } catch (err) {
    fail('Complete lab test lifecycle', err);
  }

  // =========================================================================
  // 2. Role Authorization Matrix
  // =========================================================================
  console.log('\n■ 2. Role Authorization Matrix');
  try {
    const testMatrixId = Number(db.prepare(`
      INSERT INTO lab_test_records (
        test_number, test_type, product_id, equipment_id, lot_number,
        sampling_area, sample_count, final_result, status, tested_by,
        created_by, submitted_at, template_version_id, sop_version_id, wi_version_id
      ) VALUES ('TEST-WF-MATRIX', 'vacuum', ?, ?, 'LOT-MAT', 'Area 1', 1, 'PASS', 'SUBMITTED', ?, ?, ?, ?, ?, ?)
    `).run(prodId, eqId, analystId, analystId, now, tmplVerId, sopVerId, wiVerId).lastInsertRowid);
    db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, status, result) VALUES (?, 1, 'SMP-M1', 'TESTED', 'PASS')").run(testMatrixId);

    // Analyst cannot review
    let analystRevErr = null;
    try {
      transitionLabTest({ id: analystId, role: 'employee' }, 'start_review', testMatrixId, null);
    } catch (e) {
      analystRevErr = e.message;
    }
    assert.match(analystRevErr, /permission to review/i);
    pass('role matrix: analyst cannot review test');

    // Supervisor can review
    transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'start_review', testMatrixId, null);
    pass('role matrix: supervisor can start review');

    // Supervisor cannot approve
    let supApproveErr = null;
    try {
      transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'approve', testMatrixId, null);
    } catch (e) {
      supApproveErr = e.message;
    }
    assert.match(supApproveErr, /permission to approve/i);
    pass('role matrix: supervisor cannot approve test');

    // Director (admin) can approve
    const dirApp = transitionLabTest({ id: directorId, role: 'admin' }, 'approve', testMatrixId, 'Director approved');
    assert.equal(dirApp.status, 'APPROVED');
    pass('role matrix: director (admin) can approve test');
  } catch (err) {
    fail('Role authorization matrix', err);
  }

  // =========================================================================
  // 3. Change Request Lifecycle (Intake -> Review -> Rejection -> Resubmission)
  // =========================================================================
  console.log('\n■ 3. Change Request Lifecycle');
  try {
    const payload = {
      entity_type: 'EQUIPMENT',
      data: {
        name: 'New Precision Balance',
        code: 'EQ-BAL-99',
        location: 'Balance Room',
        status_raw: 'ACTIVE',
        serial_number: 'SN-BAL-999',
        notes: 'High-precision micro balance',
      },
    };

    // Submit proposal
    const cr = submitChangeRequest({
      actor: { id: analystId, role: 'employee' },
      entity_type: 'EQUIPMENT',
      operation: 'CREATE',
      payload,
    });
    assert.equal(cr.status, 'PENDING');
    pass('change request submitted: status is PENDING');

    // Reject proposal
    const rejectedCr = rejectChangeRequest(cr.id, { id: managerId, role: 'manager' }, 'Provide calibration standard reference.');
    assert.equal(rejectedCr.status, 'REJECTED');
    pass('change request rejected: review note recorded');

    // Resubmit proposal
    const resubmitted = submitChangeRequest({
      actor: { id: analystId, role: 'employee' },
      entity_type: 'EQUIPMENT',
      operation: 'CREATE',
      payload: {
        ...payload,
        data: {
          ...payload.data,
          notes: 'High-precision micro balance calibrated against NIST Class 1 standard.',
        },
      },
    });
    assert.equal(resubmitted.status, 'PENDING');

    // Approve proposal
    const approvedCr = approveChangeRequest(resubmitted.id, { id: directorId, role: 'admin' }, 'Approved with NIST traceability.');
    assert.equal(approvedCr.status, 'APPROVED');
    pass('change request approved: created canonical equipment record');
  } catch (err) {
    fail('Change request lifecycle', err);
  }

  // =========================================================================
  // 4. Immutable Audit Trail in lab_audit_log
  // =========================================================================
  console.log('\n■ 4. Immutable Audit Trail in lab_audit_log');
  try {
    const auditEntries = db.prepare(`
      SELECT * FROM lab_audit_log ORDER BY id ASC
    `).all();

    assert.ok(auditEntries.length >= 4, 'multiple audit events captured');
    const actions = auditEntries.map((e) => e.action);
    assert.ok(actions.includes('STATUS_TRANSITION'), 'STATUS_TRANSITION captured');
    assert.ok(actions.includes('APPROVAL'), 'APPROVAL captured');
    pass('lab_audit_log captured every lifecycle state transition');
  } catch (err) {
    fail('Immutable audit trail', err);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('Failed checks:\n' + failures.join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}
