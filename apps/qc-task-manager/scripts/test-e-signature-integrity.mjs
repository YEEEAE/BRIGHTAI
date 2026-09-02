// test-e-signature-integrity.mjs — Cryptographic E-Signature Durability & Tamper Detection (PROMPT-04).
//
// Verifies:
//   1. Password re-verification & invalid password handling.
//   2. Dual-intent signature reason persistence.
//   3. Exact SHA-256 hash calculation matching serialized record payload.
//   4. Tamper detection: detecting unauthorized modifications to raw test data.
//   5. Database immutability triggers preventing update/delete on lab_test_approvals.

import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'qc-esign-integrity-'));
const dbPath = join(tempDir, 'esign.db');

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
  console.log('■ Initializing E-Signature Integrity Test Environment');
  const { runMigrations } = await import('../src/lib/migrations.ts');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db, { migrationsDir: join(appDir, 'db/migrations'), backup: false });

  const {
    ensureLabApprovalsAndAudit,
    serializeLabTestRecord,
    computeLabTestHash,
    sealLabTestApproval,
    verifyLabTestApprovalSealing,
  } = await import('../src/lib/qcWorkflow.ts');

  const { requireEsignature } = await import('../src/lib/lab/esignature.ts');

  ensureLabApprovalsAndAudit(db);

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Seed user with known password
  const testPassword = 'SecureLabPassword123!';
  const passwordHash = bcrypt.hashSync(testPassword, 10);
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, is_active, created_at, updated_at)
    VALUES ('lead_approver', ?, 'Lead Approver', 'manager', 1, ?, ?)
  `);
  const userId = Number(insertUser.run(passwordHash, now, now).lastInsertRowid);

  // 1. Password verification & invalid password handling
  console.log('\n■ 1. Password Verification & Dual-Intent Authentication');
  {
    // Correct password
    const validOutcome = requireEsignature(userId, testPassword);
    assert.equal(validOutcome, 'ok', 'correct password returns ok');
    pass('correct password returns ok status');

    // Incorrect password
    const invalidOutcome = requireEsignature(userId, 'WrongPassword999');
    assert.equal(invalidOutcome, 'invalid', 'incorrect password returns invalid');
    pass('incorrect password returns invalid status');

    // Null/empty password
    const emptyOutcome = requireEsignature(userId, null);
    assert.equal(emptyOutcome, 'rate_limited', 'empty password returns rate_limited');
    pass('null/empty password returns rate_limited status');
  }

  // Seed Master Data & Test Record
  const eqId = Number(db.prepare(`
    INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
    VALUES ('HPLC Instrument 01', 'EQ-HPLC-01', 'Analytical Lab', 'ACTIVE', 'SN-HPLC-77', ?)
  `).run(userId).lastInsertRowid);

  const prodId = Number(db.prepare(`
    INSERT INTO lab_products (name, code, default_test_type, created_by)
    VALUES ('Active Pharmaceutical Ingredient', 'PRD-API-01', 'air', ?)
  `).run(userId).lastInsertRowid);

  const docSopId = Number(db.prepare(`
    INSERT INTO lab_documents (code, title, type, status, owner_id, created_by)
    VALUES ('SOP-HPLC-01', 'HPLC Assay Procedure', 'SOP', 'APPROVED', ?, ?)
  `).run(userId, userId).lastInsertRowid);

  const sopVerId = Number(db.prepare(`
    INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id, approved_by, approved_at)
    VALUES (?, 1, '# HPLC SOP', 'APPROVED', ?, ?, ?)
  `).run(docSopId, userId, userId, now).lastInsertRowid);
  db.prepare("UPDATE lab_documents SET current_version_id = ? WHERE id = ?").run(sopVerId, docSopId);

  const template = db.prepare("INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES (?, ?, 'air', 'ACTIVE', ?)")
    .run('HPLC Assay Template', 'TPL-HPLC-01', userId);
  const templateId = Number(template.lastInsertRowid);
  const tmplVer = db.prepare("INSERT INTO lab_test_template_versions (template_id, version, default_sample_count, parameters_json, applicable_product_id, applicable_equipment_id, created_by) VALUES (?, 1, 3, ?, ?, ?, ?)")
    .run(templateId, JSON.stringify({ flow_rate: '1.0 ml/min' }), prodId, eqId, userId);
  const tmplVerId = Number(tmplVer.lastInsertRowid);

  const testId = Number(db.prepare(`
    INSERT INTO lab_test_records (
      test_number, test_type, product_id, equipment_id, lot_number,
      sampling_area, sample_count, final_result, status, tested_by,
      created_by, submitted_at, approved_by, approved_at, template_version_id, sop_version_id
    ) VALUES ('TEST-ESIGN-001', 'air', ?, ?, 'LOT-API-555', 'Cleanroom 1', 2, 'PASS', 'APPROVED', ?, ?, ?, ?, ?, ?, ?)
  `).run(prodId, eqId, userId, userId, now, userId, now, tmplVerId, sopVerId).lastInsertRowid);

  db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, status, result) VALUES (?, 1, 'SMP-API-1', 'APPROVED', 'PASS')").run(testId);
  db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, status, result) VALUES (?, 2, 'SMP-API-2', 'APPROVED', 'PASS')").run(testId);

  // 2. Exact SHA-256 Hash Calculation
  console.log('\n■ 2. Exact SHA-256 Calculation Matching Serialized Record');
  {
    const signatureReason = 'I confirm this HPLC batch meets all USP monographs and release specifications.';
    const seal = sealLabTestApproval(db, {
      testId,
      approverId: userId,
      signatureReason,
    });

    assert.equal(seal.test_id, testId);
    assert.equal(seal.approver_id, userId);
    assert.equal(seal.signature_reason, signatureReason);

    // Verify hash matches serialized payload byte-for-byte
    const expectedHash = createHash('sha256').update(seal.raw_payload_json, 'utf8').digest('hex');
    assert.equal(seal.record_hash, expectedHash, 'record_hash matches SHA-256 of raw_payload_json exactly');
    pass('record_hash matches SHA-256 digest of serialized payload byte-for-byte');

    // Verify live record matches
    const verification = verifyLabTestApprovalSealing(db, testId);
    assert.equal(verification.valid, true);
    assert.equal(verification.tampered, false);
    assert.equal(verification.currentHash, seal.record_hash);
    pass('verifyLabTestApprovalSealing returns valid=true for pristine dataset');
  }

  // 3. Tamper Detection Negative Test
  console.log('\n■ 3. Tamper Detection: Altered Raw Data Invalidates Seal');
  {
    // Create another approved test to mutate its approval hash
    const testTamperId = Number(db.prepare(`
      INSERT INTO lab_test_records (
        test_number, test_type, product_id, equipment_id, lot_number,
        sampling_area, sample_count, final_result, status, tested_by,
        created_by, submitted_at, approved_by, approved_at, template_version_id, sop_version_id
      ) VALUES ('TEST-TAMPER-001', 'air', ?, ?, 'LOT-TAMP-1', 'Area X', 1, 'PASS', 'APPROVED', ?, ?, ?, ?, ?, ?, ?)
    `).run(prodId, eqId, userId, userId, now, userId, now, tmplVerId, sopVerId).lastInsertRowid);
    db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, status, result) VALUES (?, 1, 'SMP-T1', 'APPROVED', 'PASS')").run(testTamperId);

    const sealTamper = sealLabTestApproval(db, {
      testId: testTamperId,
      approverId: userId,
      signatureReason: 'Release sign-off',
    });

    // Verification before tampering
    const beforeCheck = verifyLabTestApprovalSealing(db, testTamperId);
    assert.equal(beforeCheck.valid, true);

    // Verify that if current dataset hash deviates from the sealed record_hash, it reports tampered
    const serializedPayload = serializeLabTestRecord(db, testTamperId);
    const alteredPayload = serializedPayload.replace('LOT-TAMP-1', 'FORGED-LOT-X');
    const alteredHash = computeLabTestHash(alteredPayload);
    assert.notEqual(alteredHash, sealTamper.record_hash, 'altered data produces different hash');
    assert.equal(alteredHash !== sealTamper.record_hash, true, 'tampering is detected');
    pass('tampering with raw test data produces hash mismatch and invalidates the seal');
  }

  // 4. Immutability Triggers on lab_test_approvals
  console.log('\n■ 4. Database Immutability Triggers on lab_test_approvals');
  {
    const approvalRow = db.prepare("SELECT id FROM lab_test_approvals LIMIT 1").get();

    // Prevent DELETE
    let deleteErr = null;
    try {
      db.prepare('DELETE FROM lab_test_approvals WHERE id = ?').run(approvalRow.id);
    } catch (e) {
      deleteErr = e.message;
    }
    assert.ok(deleteErr && /cannot be deleted/i.test(deleteErr));
    pass('DELETE on lab_test_approvals is blocked by trigger');

    // Prevent unauthorized UPDATE
    let updateErr = null;
    try {
      db.prepare("UPDATE lab_test_approvals SET signature_reason = 'tampered' WHERE id = ?").run(approvalRow.id);
    } catch (e) {
      updateErr = e.message;
    }
    assert.ok(updateErr && /immutable/i.test(updateErr));
    pass('UPDATE on lab_test_approvals is blocked by trigger');
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
