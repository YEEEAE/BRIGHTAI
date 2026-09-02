// QC and Laboratory Workflow Authority (PROMPT-04, QC-REMEDIATION-004).
//
// Responsibilities:
//   1. Strict Segregation of Duties: Analysts who performed/created a test CANNOT approve it.
//   2. Dual-Intent E-Signature with SHA-256 Record Sealing: Sealing approved records in `lab_test_approvals`.
//   3. Tamper Detection: Re-verifying stored SHA-256 digest against live serialized test record.
//   4. SOP Major Version Acknowledgements: Flagging assigned operators as 'Pending Acknowledgement'.
//   5. Immutability & Audit Durability: Preventing record mutation/deletion after approval and audit log deletions.

import { createHash } from 'node:crypto';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { getDb } from './db';
import { appendQcAudit } from './audit/qcChain';
import { createNotification } from './notifications';
import type { Role } from './types';

let _labSchemaEnsured = false;

/**
 * Ensure `lab_test_approvals` table, `lab_audit_log` view, and immutability triggers exist.
 * Safe to call idempotently across runtime and test databases.
 */
export function ensureLabApprovalsAndAudit(database?: BetterSqliteDatabase): void {
  const target = database ?? getDb();
  if (_labSchemaEnsured && !database) return;

  target.exec(`
    CREATE TABLE IF NOT EXISTS lab_test_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE CASCADE,
      approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      signature_reason TEXT NOT NULL,
      record_hash TEXT NOT NULL,
      raw_payload_json TEXT NOT NULL,
      signed_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'TAMPERED'))
    );

    CREATE INDEX IF NOT EXISTS idx_lab_test_approvals_test ON lab_test_approvals(test_id, signed_at);

    CREATE TRIGGER IF NOT EXISTS lab_test_approvals_no_delete
    BEFORE DELETE ON lab_test_approvals
    BEGIN
      SELECT RAISE(ABORT, 'lab_test_approvals records cannot be deleted under any circumstances');
    END;

    CREATE TRIGGER IF NOT EXISTS lab_test_approvals_no_update
    BEFORE UPDATE ON lab_test_approvals
    BEGIN
      SELECT RAISE(ABORT, 'lab_test_approvals records are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS lab_test_records_frozen_after_approval_update
    BEFORE UPDATE ON lab_test_records
    WHEN OLD.status = 'APPROVED' AND NEW.status = 'APPROVED'
      AND (
        OLD.final_result IS NOT NEW.final_result OR
        OLD.test_type IS NOT NEW.test_type OR
        OLD.lot_number IS NOT NEW.lot_number OR
        OLD.sampling_area IS NOT NEW.sampling_area OR
        OLD.parameters_snapshot_json IS NOT NEW.parameters_snapshot_json
      )
    BEGIN
      SELECT RAISE(ABORT, 'approved lab test records are immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS lab_test_records_frozen_after_approval_delete
    BEFORE DELETE ON lab_test_records
    WHEN OLD.status = 'APPROVED'
    BEGIN
      SELECT RAISE(ABORT, 'approved lab test records cannot be deleted');
    END;

    CREATE TRIGGER IF NOT EXISTS qc_audit_log_no_delete
    BEFORE DELETE ON qc_audit_log
    BEGIN
      SELECT RAISE(ABORT, 'qc_audit_log records cannot be deleted under any circumstances');
    END;

    CREATE VIEW IF NOT EXISTS lab_audit_log AS
    SELECT
      id,
      entity_type,
      entity_id,
      task_id,
      actor_id,
      actor_id AS user_id,
      action,
      old_value,
      old_value AS previous_state,
      new_value,
      new_value AS new_state,
      note,
      created_at,
      created_at AS timestamp,
      previous_hash,
      event_hash
    FROM qc_audit_log
    WHERE entity_type LIKE 'LAB_%';
  `);

  if (!database) _labSchemaEnsured = true;
}

/** Error message when analyst attempts self-approval. */
export const SEGREGATION_OF_DUTIES_ERROR =
  'Segregation of duties violation: Analyst cannot approve own test.';

/**
 * Enforces strict segregation of duties between the analyst who entered results
 * and the approving supervisor/manager.
 */
export function enforceSegregationOfDuties(
  actor: { id: number; role?: Role | string },
  test: { tested_by: number | null; created_by: number },
): void {
  if (test.tested_by === actor.id || test.created_by === actor.id) {
    throw new Error(SEGREGATION_OF_DUTIES_ERROR);
  }
}

export interface SerializedTestDataset {
  record: Record<string, unknown>;
  samples: Array<Record<string, unknown>>;
  readings: Array<Record<string, unknown>>;
  equipment_snapshot: Record<string, unknown> | null;
  document_snapshots: Array<Record<string, unknown>>;
}

/**
 * Canonically serialize the entire dataset of a lab test for cryptographic sealing.
 */
export function serializeLabTestRecord(db: BetterSqliteDatabase, testId: number): string {
  ensureLabApprovalsAndAudit(db);
  const record = db.prepare(`SELECT * FROM lab_test_records WHERE id = ?`).get(testId) as Record<string, unknown> | undefined;
  if (!record) throw new Error(`Test #${testId} not found for serialization.`);

  const samples = db.prepare(`
    SELECT * FROM lab_test_samples WHERE test_id = ? ORDER BY sample_no ASC, id ASC
  `).all(testId) as Array<Record<string, unknown>>;

  const readings = db.prepare(`
    SELECT * FROM lab_test_environment_readings WHERE test_id = ? ORDER BY id ASC
  `).all(testId) as Array<Record<string, unknown>>;

  const equipmentSnapshot = db.prepare(`
    SELECT * FROM lab_test_equipment_snapshots WHERE test_id = ?
  `).get(testId) as Record<string, unknown> | undefined;

  const documentSnapshots = db.prepare(`
    SELECT * FROM lab_test_document_snapshots WHERE test_id = ? ORDER BY role ASC, document_id ASC
  `).all(testId) as Array<Record<string, unknown>>;

  const payload: SerializedTestDataset = {
    record,
    samples,
    readings,
    equipment_snapshot: equipmentSnapshot ?? null,
    document_snapshots: documentSnapshots,
  };

  return JSON.stringify(payload);
}

/**
 * Compute SHA-256 digest of serialized payload.
 */
export function computeLabTestHash(serializedPayload: string): string {
  return createHash('sha256').update(serializedPayload, 'utf8').digest('hex');
}

export interface LabTestApprovalSeal {
  id: number;
  test_id: number;
  approver_id: number;
  signature_reason: string;
  record_hash: string;
  raw_payload_json: string;
  signed_at: string;
  status: 'VALID' | 'TAMPERED';
}

/**
 * Seal a lab test approval with dual-intent e-signature reason and SHA-256 hash.
 */
export function sealLabTestApproval(
  db: BetterSqliteDatabase,
  params: {
    testId: number;
    approverId: number;
    signatureReason: string;
  },
): LabTestApprovalSeal {
  ensureLabApprovalsAndAudit(db);
  const serialized = serializeLabTestRecord(db, params.testId);
  const recordHash = computeLabTestHash(serialized);
  const reason = params.signatureReason.trim() || 'I approve this test result for release';

  const insert = db.prepare(`
    INSERT INTO lab_test_approvals (test_id, approver_id, signature_reason, record_hash, raw_payload_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(params.testId, params.approverId, reason, recordHash, serialized);

  const sealId = Number(insert.lastInsertRowid);
  return db.prepare('SELECT * FROM lab_test_approvals WHERE id = ?').get(sealId) as LabTestApprovalSeal;
}

export interface VerificationResult {
  valid: boolean;
  tampered: boolean;
  storedHash: string;
  currentHash: string;
  approvalId: number;
  signedAt: string;
}

/**
 * Verify cryptographic sealing of an approved lab test against live record.
 * Any subsequent tampering with raw test data invalidates the signature hash.
 */
export function verifyLabTestApprovalSealing(
  db: BetterSqliteDatabase,
  testId: number,
): VerificationResult {
  ensureLabApprovalsAndAudit(db);
  const approval = db.prepare(`
    SELECT * FROM lab_test_approvals WHERE test_id = ? ORDER BY id DESC LIMIT 1
  `).get(testId) as LabTestApprovalSeal | undefined;

  if (!approval) {
    throw new Error(`No approval seal found for test #${testId}.`);
  }

  const currentSerialized = serializeLabTestRecord(db, testId);
  const currentHash = computeLabTestHash(currentSerialized);
  const valid = currentHash === approval.record_hash;

  return {
    valid,
    tampered: !valid,
    storedHash: approval.record_hash,
    currentHash,
    approvalId: approval.id,
    signedAt: approval.signed_at,
  };
}

/**
 * Verify and trigger operator acknowledgements when an SOP gets bumped to a new major version.
 * Flags all operators who were assigned to previous versions of this document as 'Pending Acknowledgement'.
 */
export function triggerSopMajorVersionAcknowledgements(
  db: BetterSqliteDatabase,
  params: {
    documentId: number;
    newVersionId: number;
    newVersionNumber: number;
    actorId: number;
    documentType: string;
    documentCode: string;
  },
): { assignedCount: number; userIds: number[] } {
  ensureLabApprovalsAndAudit(db);

  // Identify operator pool: users who previously had acknowledgements for this document,
  // or all active lab personnel (employee/supervisor) if first version or unassigned.
  const previousAssignees = db.prepare(`
    SELECT DISTINCT a.user_id
    FROM lab_document_acknowledgements a
    JOIN lab_document_versions v ON v.id = a.document_version_id
    WHERE v.document_id = ? AND a.document_version_id <> ?
  `).all(params.documentId, params.newVersionId) as Array<{ user_id: number }>;

  let targetUserIds = previousAssignees.map((r) => r.user_id);

  if (targetUserIds.length === 0) {
    const activeOperators = db.prepare(`
      SELECT id FROM users
      WHERE is_active = 1 AND role IN ('employee', 'supervisor')
    `).all() as Array<{ id: number }>;
    targetUserIds = activeOperators.map((r) => r.id);
  }

  let assignedCount = 0;
  const insertAck = db.prepare(`
    INSERT OR IGNORE INTO lab_document_acknowledgements (document_version_id, user_id, status)
    VALUES (?, ?, 'PENDING')
  `);

  for (const uid of targetUserIds) {
    const res = insertAck.run(params.newVersionId, uid);
    if (res.changes > 0) assignedCount++;
  }

  if (assignedCount > 0) {
    appendQcAudit(db, {
      entityType: 'LAB_DOCUMENT_VERSION',
      entityId: params.newVersionId,
      actorId: params.actorId,
      action: 'CREATE',
      note: `Automatic assignment of ${assignedCount} operator(s) for major version v${params.newVersionNumber} (${params.documentCode})`,
    });

    for (const uid of targetUserIds) {
      createNotification({
        userId: uid,
        taskId: null,
        type: 'lab_document_acknowledged',
        title: 'New SOP version pending acknowledgement',
        message: `${params.documentCode} v${params.newVersionNumber} was released. Formal employee acknowledgement required.`,
        actorId: params.actorId,
        href: '/lab/acknowledgements',
      });
    }
  }

  return { assignedCount, userIds: targetUserIds };
}
