// QC Laboratory test records — shared AIR/VACUUM test form (PROMPT 05).
//
// One form, one handler, one schema serves both /lab/tests/new?type=air and
// ?type=vacuum. `test_type` is resolved from the QUERY PARAMETER only — the
// request body can never change it (page reference §66, hidden-field
// manipulation). Only printed/black fields from the approved form become
// employee-entry fields; reference values are displayed, never validated
// (§77–§78) and no scientific formula is applied anywhere.
//
// Authorization identities are system-controlled: tested_by comes from the
// session user, never from the body (§18). The result (PASS/FAIL/HOLD) is a
// human decision — AI never determines results (§19, §76).

import type { APIContext } from 'astro';
import { transaction, getDb } from '../db';
import { setFlash } from '../flash';
import { parseFormData, labTestFormSchema } from '../validation';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { canCreateLabTest } from '../permissions';
import { deriveCalibrationState, type LabCalibrationState } from './overview';
import { labParametersSnapshotJson } from './policy';
import type { LabTestSample, LabTestType } from '../types';

/** Lab audit actions allowed by the extended qc_audit_log CHECK (migration 011). */
type LabAuditAction = 'CREATE' | 'SUBMIT' | 'UPDATE' | 'VOID';

function auditLabTest(testId: number, actorId: number, action: LabAuditAction, note: string | null = null): void {
  getDb()
    .prepare(
      `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note)
       VALUES ('LAB_TEST', ?, NULL, ?, ?, NULL, NULL, ?)`,
    )
    .run(testId, actorId, action, note);
}

/**
 * The shared form's test type comes from the URL query alone. Anything else
 * (missing, or a forged value) resolves to null and the request is refused.
 */
export function resolveLabTestType(value: string | null | undefined): LabTestType | null {
  return value === 'air' || value === 'vacuum' ? value : null;
}

/**
 * Product Master integration (§11): when the typed Product Description
 * exactly matches an active product name (case-insensitive), the canonical
 * product_id relationship is resolved — otherwise it stays NULL and the
 * description is preserved verbatim on the record.
 */
export function resolveLabProductId(description: string | null): number | null {
  const name = description?.trim();
  if (!name) return null;
  const row = getDb()
    .prepare('SELECT id FROM lab_products WHERE is_active = 1 AND name = ? COLLATE NOCASE LIMIT 1')
    .get(name) as { id: number } | undefined;
  return row ? Number(row.id) : null;
}

export interface LabEquipmentOption {
  id: number;
  name: string;
  code: string;
  status_raw: string;
  serial_number: string | null;
  calibration_state: LabCalibrationState;
  calibration_due: string | null;
}

/** Latest calibration due date per equipment (same derivation as overview.ts). */
const LATEST_DUE_SQL = `(
  SELECT date(COALESCE(c.next_due_at, c.calibration_due_at))
  FROM lab_equipment_calibration c
  WHERE c.equipment_id = e.id
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT 1
)`;

/**
 * Equipment picker options for the form (Machine Name is backed by
 * equipment_id — the canonical relationship, §12/§34). Non-archived rows only,
 * each with its derived calibration state so the tester sees it before use.
 */
export function listLabEquipmentForForm(): LabEquipmentOption[] {
  const today = new Date();
  const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const rows = getDb()
    .prepare(
      `SELECT e.id, e.name, e.code, e.status_raw, e.serial_number, ${LATEST_DUE_SQL} AS calibration_due
       FROM lab_equipment e
       WHERE e.is_archived = 0
       ORDER BY e.name ASC, e.id ASC`,
    )
    .all() as Array<{ id: number; name: string; code: string; status_raw: string; serial_number: string | null; calibration_due: string | null }>;
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    code: r.code,
    status_raw: r.status_raw,
    serial_number: r.serial_number,
    calibration_state: deriveCalibrationState(r.calibration_due, isoToday),
    calibration_due: r.calibration_due,
  }));
}

export interface LabProductOption {
  id: number;
  name: string;
  code: string;
}

/** Active Product Master rows for the Product Description datalist (§11). */
export function listLabProductsForForm(): LabProductOption[] {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_products WHERE is_active = 1 ORDER BY name ASC, id ASC')
    .all() as LabProductOption[];
}

/** Normalized form input after Zod validation (labTestFormSchema). */
export interface LabTestFormData {
  form_action: 'draft' | 'continue' | 'submit';
  product_description: string | null;
  connector_type: string | null;
  sample_count: number;
  lot_number: string | null;
  sampling_area: string | null;
  equipment_id: number | null;
  medium_used: string | null;
  actual_pressure: string | null;
  torque_in_lb: string | null;
  time_sec: string | null;
  angle: string | null;
  temperature_measured: string | null;
  samples_json: Array<{
    sample_no: number;
    part_name: string | null;
    set_pressure: string | null;
    actual_pressure: string | null;
    volume_sec: string | null;
    pressure_difference: string | null;
    holding_time_sec: string | null;
    leakage_rate: string | null;
    result: 'PASS' | 'FAIL' | 'HOLD' | null;
  }> | null;
  remarks: string | null;
  final_result: 'PASS' | 'FAIL' | 'HOLD' | null;
}

export interface LabTestCreateResult {
  id: number;
  test_number: string;
}

/**
 * Create a laboratory test inside ONE transaction: the record, the bounded
 * sample rows (1..sample_count — never arbitrary growth, §16), the stable
 * test number (LAB-TEST-%05d) and per-sample identifiers
 * (LAB-TEST-%05d-SNN), the parameters reference snapshot on submission, and
 * the CREATE (+ SUBMIT when applicable) audit events.
 *
 * Drafts keep final_result NULL and status DRAFT; submissions freeze the
 * human-entered final result and move to SUBMITTED with submitted_at.
 */
export function createLabTest(data: LabTestFormData & { product_id: number | null }, actorId: number, testType: LabTestType): LabTestCreateResult {
  const submit = data.form_action === 'submit';
  return transaction(() => {
    const db = getDb();

    // test_number needs the autoincrement id; insert with a unique placeholder
    // then finalize inside the same transaction (no visible intermediate state).
    const placeholder = `PENDING-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const result = db
      .prepare(
        `INSERT INTO lab_test_records (
           test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
           medium_used, connector_type, sample_count, actual_pressure, torque_in_lb,
           time_sec, angle, temperature_measured, remarks, final_result, status,
           tested_by, created_by, submitted_at, parameters_snapshot_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, ?)`,
      )
      .run(
        placeholder,
        testType,
        data.product_id,
        data.equipment_id,
        data.lot_number,
        data.sampling_area,
        data.medium_used,
        data.connector_type,
        data.sample_count,
        data.actual_pressure,
        data.torque_in_lb,
        data.time_sec,
        data.angle,
        data.temperature_measured,
        data.remarks,
        submit ? data.final_result : null,
        submit ? 'SUBMITTED' : 'DRAFT',
        actorId,
        actorId,
        submit ? 1 : 0,
        submit ? labParametersSnapshotJson() : null,
      );
    const id = Number(result.lastInsertRowid);
    const testNumber = `LAB-TEST-${String(id).padStart(5, '0')}`;
    db.prepare('UPDATE lab_test_records SET test_number = ? WHERE id = ?').run(testNumber, id);

    const rows = [...(data.samples_json ?? [])].sort((a, b) => a.sample_no - b.sample_no);
    const insertSample = db.prepare(
      `INSERT INTO lab_test_samples (
         test_id, sample_no, sample_identifier, part_name, set_pressure, actual_pressure,
         volume_sec, pressure_difference, holding_time_sec, leakage_rate, result
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of rows) {
      insertSample.run(
        id,
        row.sample_no,
        `${testNumber}-S${String(row.sample_no).padStart(2, '0')}`,
        row.part_name,
        row.set_pressure,
        row.actual_pressure,
        row.volume_sec,
        row.pressure_difference,
        row.holding_time_sec,
        row.leakage_rate,
        row.result,
      );
    }

    auditLabTest(id, actorId, 'CREATE', `test_type=${testType}; status=${submit ? 'SUBMITTED' : 'DRAFT'}; samples=${data.sample_count}`);
    if (submit) {
      auditLabTest(id, actorId, 'SUBMIT', `test_number=${testNumber}; final_result=${data.final_result}`);
    }
    return { id, test_number: testNumber };
  });
}

/**
 * POST /lab/tests/new — the shared form submission (middleware short-circuit,
 * same pattern as handleCreateTaskPost). The route guard has already confirmed
 * the /lab wall; this handler re-checks create permission, resolves test_type
 * from the query parameter only, validates the body with the shared Zod
 * schema, and flashes + redirects. Tested By / Reviewed By / Approved By are
 * never accepted from the body.
 */
export async function handleLabTestFormPost(context: APIContext): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname + context.url.search)}`);
  }
  if (!canCreateLabTest(user.role)) {
    setFlash(context, 'error', 'You do not have permission to create laboratory tests.');
    return context.redirect('/lab');
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const testType = resolveLabTestType(context.url.searchParams.get('type'));
  if (!testType) {
    setFlash(context, 'error', 'Invalid test type.');
    return context.redirect('/lab');
  }
  const formUrl = `/lab/tests/new?type=${testType}`;

  const form = await context.request.formData();
  const parsed = parseFormData(labTestFormSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(formUrl);
  }

  try {
    const data = parsed.data;
    const productId = resolveLabProductId(data.product_description);
    const created = createLabTest({ ...data, product_id: productId }, user.id, testType);
    if (data.form_action === 'submit') {
      setFlash(context, 'success', `Test ${created.test_number} submitted for review.`);
      return context.redirect('/lab');
    }
    if (data.form_action === 'continue') {
      // Save and Continue: keep the batch-entry flow — a fresh form of the
      // same type (redirects to the test register once PROMPT 06 lands).
      setFlash(context, 'success', `Test ${created.test_number} saved as draft. Continue with the next test.`);
      return context.redirect(formUrl);
    }
    setFlash(context, 'success', `Test ${created.test_number} saved as draft.`);
    return context.redirect('/lab');
  } catch (err) {
    console.error('[lab] test form save failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the test.');
    return context.redirect(formUrl);
  }
}

/** Sample rows of a test (read helper for tests/verification). */
export function listLabTestSamples(testId: number): LabTestSample[] {
  return getDb()
    .prepare('SELECT * FROM lab_test_samples WHERE test_id = ? ORDER BY sample_no ASC')
    .all(testId) as LabTestSample[];
}

/** Full detail row for the read-only test record page (PROMPT 06 /lab/tests/[id]). */
export function getLabTestRecordById(id: number): Record<string, unknown> | undefined {
  return getDb()
    .prepare(
      `SELECT t.*,
         p.name AS product_name, p.code AS product_code,
         e.name AS equipment_name, e.code AS equipment_code,
         tester.full_name AS tester_name,
         reviewer.full_name AS reviewer_name,
         approver.full_name AS approver_name,
         creator.full_name AS creator_name
       FROM lab_test_records t
       LEFT JOIN lab_products p ON p.id = t.product_id
       LEFT JOIN lab_equipment e ON e.id = t.equipment_id
       LEFT JOIN users tester ON tester.id = t.tested_by
       LEFT JOIN users reviewer ON reviewer.id = t.reviewed_by
       LEFT JOIN users approver ON approver.id = t.approved_by
       LEFT JOIN users creator ON creator.id = t.created_by
       WHERE t.id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
}

/** Equipment identity frozen at approval (lab_test_equipment_snapshots). */
export function getLabTestEquipmentSnapshot(testId: number): Record<string, unknown> | undefined {
  return getDb()
    .prepare('SELECT * FROM lab_test_equipment_snapshots WHERE test_id = ?')
    .get(testId) as Record<string, unknown> | undefined;
}

/** Controlled-document (SOP/WI) snapshots frozen at approval. */
export function getLabTestDocumentSnapshots(testId: number): Record<string, unknown>[] {
  return getDb()
    .prepare('SELECT * FROM lab_test_document_snapshots WHERE test_id = ? ORDER BY role ASC')
    .all(testId) as Record<string, unknown>[];
}

/** Audit timeline for a test (PROMPT 06 details page) — newest first. */
export function getLabTestAuditTimeline(testId: number): Record<string, unknown>[] {
  return getDb()
    .prepare(
      `SELECT a.*, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_TEST' AND a.entity_id = ?
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(testId) as Record<string, unknown>[];
}

export interface LabTestRetestHistoryRow {
  id: number;
  retest_number: string;
  reason: string;
  reason_note: string | null;
  status: string;
  created_by: number;
  created_at: string;
  new_test_id: number | null;
  new_test_number: string | null;
  new_test_status: string | null;
  new_test_result: string | null;
}

/**
 * Controlled retest history for a test (§46–§48). The original test stays
 * immutable; retests reference it and are listed newest first. If the retest
 * has been executed (new_test_id set) the resulting record's number, status
 * and final result are joined so the operator can jump to the outcome.
 */
export function getLabTestRetestHistory(testId: number): LabTestRetestHistoryRow[] {
  return getDb()
    .prepare(
      `SELECT r.id, r.retest_number, r.reason, r.reason_note, r.status,
              r.created_by, r.created_at, r.new_test_id,
              nt.test_number AS new_test_number,
              nt.status AS new_test_status,
              nt.final_result AS new_test_result
       FROM lab_test_retests r
       LEFT JOIN lab_test_records nt ON nt.id = r.new_test_id
       WHERE r.original_test_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
    )
    .all(testId) as LabTestRetestHistoryRow[];
}

/**
 * Related Investigation / NCR / CAPA hooks for a test (§49). The existing
 * application links those quality entities to tasks, not laboratory tests, so
 * this surface is intentionally wired through the shared audit log's
 * LINK/UNLINK actions on the LAB_TEST entity rather than a parallel linking
 * table. Nothing writes these yet (that lands with the workflow/link module),
 * so it returns an empty array by default — the detail/print pages render a
 * clear empty state instead of inventing links.
 */
export function getLabTestRelatedQualityEntities(testId: number): Record<string, unknown>[] {
  return getDb()
    .prepare(
      `SELECT a.id, a.action, a.actor_id, a.created_at, a.note, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_TEST' AND a.entity_id = ?
         AND a.action IN ('LINK','UNLINK')
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(testId) as Record<string, unknown>[];
}

export interface LabTestView {
  record: Record<string, unknown> | null;
  samples: LabTestSample[];
  equipmentSnapshot: Record<string, unknown> | null;
  documentSnapshots: Record<string, unknown>[];
  productSnapshot: Record<string, unknown> | null;
  templateSnapshot: Record<string, unknown> | null;
  parametersSnapshot: Record<string, unknown> | null;
  retests: LabTestRetestHistoryRow[];
  relatedQuality: Record<string, unknown>[];
  timeline: Record<string, unknown>[];
}

function parseJsonObject(json: unknown): Record<string, unknown> | null {
  if (typeof json !== 'string' || !json) return null;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Single loader backing BOTH the details page and the controlled print page.
 * Returning one consistent shape guarantees the print output matches the
 * stored record exactly (§25, §70): both pages read the exact same values.
 *
 * `allowed` encodes the employee scope decision (tested-by-me OR created-by-me
 * for employees); when false the whole view is nulled so callers render the
 * not-found state (mirrors the register scope and the IDOR wall, §66).
 */
export function loadLabTestView(id: number, allowed: boolean): LabTestView {
  if (!Number.isInteger(id) || id <= 0 || !allowed) {
    return {
      record: null,
      samples: [],
      equipmentSnapshot: null,
      documentSnapshots: [],
      productSnapshot: null,
      templateSnapshot: null,
      parametersSnapshot: null,
      retests: [],
      relatedQuality: [],
      timeline: [],
    };
  }
  const record = getLabTestRecordById(id) ?? null;
  if (!record) {
    return {
      record: null,
      samples: [],
      equipmentSnapshot: null,
      documentSnapshots: [],
      productSnapshot: null,
      templateSnapshot: null,
      parametersSnapshot: null,
      retests: [],
      relatedQuality: [],
      timeline: [],
    };
  }
  return {
    record,
    samples: listLabTestSamples(id),
    equipmentSnapshot: getLabTestEquipmentSnapshot(id) ?? null,
    documentSnapshots: getLabTestDocumentSnapshots(id),
    productSnapshot: parseJsonObject(record.product_snapshot_json),
    templateSnapshot: parseJsonObject(record.template_snapshot_json),
    parametersSnapshot: parseJsonObject(record.parameters_snapshot_json),
    retests: getLabTestRetestHistory(id),
    relatedQuality: getLabTestRelatedQualityEntities(id),
    timeline: getLabTestAuditTimeline(id),
  };
}