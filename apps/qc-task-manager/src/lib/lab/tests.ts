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
import { parseFormData, labTestFormSchema, labTestVoidSchema } from '../validation';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { canCreateLabTest, canEditLabTestRecord, canVoidLabTest, canVoidLabTestRecord } from '../permissions';
import { createNotification } from '../notifications';
import { deriveCalibrationState, LATEST_DUE_SQL, type LabCalibrationState } from './overview';
import {
  ESIGN_FAILURE_MESSAGE_AR,
  ESIGN_FIELD_NAME,
  ESIGN_RATE_LIMITED_MESSAGE_AR,
  esignAuditNote,
  requireEsignature,
} from './esignature';
import { getLabTestFindingLinks, type LabTestFindingLink } from './findingLinks';
import type { LabTestSample, LabTestStatus, LabTestType, Role } from '../types';
import { appendQcAudit } from '../audit/qcChain';
import { ensureLabApprovalsAndAudit, sealLabTestVoid } from '../qcWorkflow';
import { recordUxEvent } from '../uxTelemetry';

/** Lab audit actions allowed by the extended qc_audit_log CHECK (migration 011). */
type LabAuditAction = 'CREATE' | 'SUBMIT' | 'UPDATE' | 'VOID';

function auditLabTest(
  testId: number,
  actorId: number,
  action: LabAuditAction,
  note: string | null = null,
  oldValue: string | null = null,
  newValue: string | null = null,
): void {
  appendQcAudit(getDb(), { entityType: 'LAB_TEST', entityId: testId, actorId, action, oldValue, newValue, note });
}

/** Approved template parameters only; absent/mismatched references stay null. */
function approvedTemplateParametersSnapshot(db: ReturnType<typeof getDb>, versionId: number | null, testType: LabTestType): string | null {
  if (versionId === null) return null;
  const row = db.prepare(`SELECT t.test_type, t.status, t.current_version_id, v.id, v.parameters_json
    FROM lab_test_template_versions v JOIN lab_test_templates t ON t.id = v.template_id WHERE v.id = ?`).get(versionId) as
    | { test_type: string; status: string; current_version_id: number | null; id: number; parameters_json: string }
    | undefined;
  if (!row || row.test_type !== testType || row.status !== 'ACTIVE' || Number(row.current_version_id) !== Number(row.id)) return null;
  return row.parameters_json || '{}';
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

/**
 * Test Template integration (§29-§30, PROMPT 10): the form posts a template
 * version id; the server resolves it to (template_id, template_version_id)
 * ONLY when the version exists, its template is ACTIVE with an APPROVED
 * current version, and the template's test type matches the query's type.
 * Anything else resolves to null — a forged or stale id never lands on the
 * record. Measured values are NEVER taken from the template (populate, never
 * overwrite — the island only prefills untouched fields).
 */
export function resolveLabTemplateVersion(
  templateVersionId: number | null,
  testType: LabTestType,
): { template_id: number; template_version_id: number; requires_approved_template_for_submission: boolean } | null {
  if (templateVersionId === null) return null;
  const row = getDb()
    .prepare(
      `SELECT v.id AS version_id, v.template_id, t.test_type, t.status, t.current_version_id,
              COALESCE(v.requires_approved_template_for_submission, 0) AS requires_approved_template_for_submission
       FROM lab_test_template_versions v
       JOIN lab_test_templates t ON t.id = v.template_id
       WHERE v.id = ?`,
    )
    .get(templateVersionId) as
    | { version_id: number; template_id: number; test_type: string; status: string; current_version_id: number | null; requires_approved_template_for_submission: number }
    | undefined;
  if (!row) return null;
  if (row.test_type !== testType) return null;
  if (row.status !== 'ACTIVE') return null;
  if (row.current_version_id !== row.version_id) return null;
  return {
    template_id: Number(row.template_id),
    template_version_id: Number(row.version_id),
    requires_approved_template_for_submission: Number(row.requires_approved_template_for_submission) === 1,
  };
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
  actual_force: string | null;
  torque_in_lb: string | null;
  torque_value: string | null;
  time_sec: string | null;
  angle: string | null;
  temperature_measured: string | null;
  testing_date: string | null;
  humidity_measured: string | null;
  samples_json: Array<{
    sample_no: number;
    part_name: string | null;
    set_pressure: string | null;
    actual_pressure: string | null;
    applied_pressure: string | null;
    volume_sec: string | null;
    volume_liter: string | null;
    pressure_difference: string | null;
    holding_time_sec: string | null;
    leakage_rate: string | null;
    result: 'PASS' | 'FAIL' | 'HOLD' | null;
  }> | null;
  /** Supplementary session environment readings (PROMPT 51) — optional. */
  environment_readings_json: Array<{
    reading_at: string | null;
    temperature: string | null;
    humidity: string | null;
    notes: string | null;
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
export function createLabTest(
  data: LabTestFormData & { product_id: number | null; template_id?: number | null; template_version_id?: number | null },
  actorId: number,
  testType: LabTestType,
): LabTestCreateResult {
  const submit = data.form_action === 'submit';
  return transaction(() => {
    const db = getDb();

    // Archived equipment must never be used for new tests (same rule as
    // maintenance/calibration — retired devices are is_archived=1, never hard-
    // deleted, so existence alone does not mean the device is usable).
    if (data.equipment_id != null) {
      const equipment = db
        .prepare('SELECT id, is_archived FROM lab_equipment WHERE id = ?')
        .get(data.equipment_id) as { id: number; is_archived: number } | undefined;
      if (!equipment) throw new Error('Invalid equipment.');
      if (equipment.is_archived === 1) throw new Error('Archived equipment cannot be used for new tests.');
    }

    // test_number needs the autoincrement id; insert with a unique placeholder
    // then finalize inside the same transaction (no visible intermediate state).
    const placeholder = `PENDING-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const result = db
      .prepare(
        `INSERT INTO lab_test_records (
           test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
           medium_used, connector_type, sample_count, actual_pressure, torque_in_lb,
           actual_force, torque_value, time_sec, angle, temperature_measured, testing_date, humidity_measured, remarks, final_result, status,
           tested_by, created_by, submitted_at, parameters_snapshot_json,
           template_id, template_version_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, ?, ?, ?)`,
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
        data.actual_force,
        data.torque_value,
        data.time_sec,
        data.angle,
        data.temperature_measured,
        data.testing_date,
        data.humidity_measured,
        data.remarks,
        submit ? data.final_result : null,
        submit ? 'SUBMITTED' : 'DRAFT',
        actorId,
        actorId,
        submit ? 1 : 0,
        submit ? approvedTemplateParametersSnapshot(db, data.template_version_id ?? null, testType) : null,
        data.template_id ?? null,
        data.template_version_id ?? null,
      );
    const id = Number(result.lastInsertRowid);
    const testNumber = `LAB-TEST-${String(id).padStart(5, '0')}`;
    db.prepare('UPDATE lab_test_records SET test_number = ? WHERE id = ?').run(testNumber, id);

    const rows = [...(data.samples_json ?? [])].sort((a, b) => a.sample_no - b.sample_no);
    const insertSample = db.prepare(
      `INSERT INTO lab_test_samples (
         test_id, sample_no, sample_identifier, part_name, set_pressure, actual_pressure,
         applied_pressure, volume_sec, volume_liter, pressure_difference, holding_time_sec, leakage_rate, result, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of rows) {
      insertSample.run(
        id,
        row.sample_no,
        `${testNumber}-S${String(row.sample_no).padStart(2, '0')}`,
        row.part_name,
        row.set_pressure,
        row.actual_pressure,
        row.applied_pressure,
        row.volume_sec,
        row.volume_liter,
        row.pressure_difference,
        row.holding_time_sec,
        row.leakage_rate,
        row.result,
        row.result != null ? 'TESTED' : 'PENDING',
      );
    }

    // Supplementary environment readings (PROMPT 51): only complete rows are
    // stored; fully-empty rows from the island are dropped silently.
    const readings = (data.environment_readings_json ?? []).filter(isValidEnvironmentReading);
    if (readings.length > 0) {
      const insertReading = db.prepare(
        `INSERT INTO lab_test_environment_readings
           (test_id, reading_at, temperature, humidity, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );
      for (const r of readings) {
        insertReading.run(id, r.reading_at, r.temperature, r.humidity, r.notes, actorId);
      }
    }

    auditLabTest(
      id,
      actorId,
      'CREATE',
      `test_type=${testType}; status=${submit ? 'SUBMITTED' : 'DRAFT'}; samples=${data.sample_count}; readings=${readings.length}`,
    );
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
    // Template resolution is server-authoritative: the id from the body is only
    // accepted when it names the approved current version of an ACTIVE
    // template matching the query's test type.
    const rawTemplateVersionId = form.get('template_version_id');
    const templateVersionId =
      rawTemplateVersionId !== null && rawTemplateVersionId !== '' && Number.isInteger(Number(rawTemplateVersionId)) && Number(rawTemplateVersionId) > 0
        ? Number(rawTemplateVersionId)
        : null;
    const templateRef = resolveLabTemplateVersion(templateVersionId, testType);
    if (data.form_action === 'submit' && templateVersionId !== null && templateRef === null) {
      throw new Error('Submit requires a compatible approved template version.');
    }
    const created = createLabTest(
      { ...data, product_id: productId, template_id: templateRef?.template_id ?? null, template_version_id: templateRef?.template_version_id ?? null },
      user.id,
      testType,
    );
    try {
      recordUxEvent({
        event_name: 'lab_form_submit_success',
        route: '/lab/tests/new',
        outcome: 'success',
        metadata: { surface: 'lab-test-form', form_type: testType, action: data.form_action },
      }, user.role);
    } catch (telemetryError) {
      console.error('[ux-telemetry] lab success event failed', telemetryError);
    }
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
    try {
      recordUxEvent({
        event_name: 'lab_form_submit_error',
        route: '/lab/tests/new',
        outcome: 'error',
        metadata: { surface: 'lab-test-form', form_type: testType, action: 'unknown' },
      }, user.role);
    } catch (telemetryError) {
      console.error('[ux-telemetry] lab error event failed', telemetryError);
    }
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the test.');
    return context.redirect(formUrl);
  }
}

// ─────────────────────────────── DRAFT editing (PROMPT 43-B) ───────────────────────────────

/** Thrown when the editable draft does not exist or is outside the caller's scope (→ 404). */
export class LabTestDraftNotFoundError extends Error {
  constructor() {
    super('Test not found.');
    this.name = 'LabTestDraftNotFoundError';
  }
}

/** Thrown when the test exists and is in scope but is not editable (→ 400). */
export class LabTestNotDraftError extends Error {
  constructor(status: string) {
    super(`Only DRAFT tests can be edited — this test is ${status}.`);
    this.name = 'LabTestNotDraftError';
  }
}

function loadLabTestAuth(row: Record<string, unknown>) {
  return {
    status: row.status as LabTestStatus,
    tested_by: row.tested_by == null ? null : Number(row.tested_by),
    reviewed_by: row.reviewed_by == null ? null : Number(row.reviewed_by),
    created_by: Number(row.created_by),
  };
}

/**
 * Prefill payload for the edit-mode test form. Null when the draft is missing
 * or out of scope (→ not-found page). `product_description` pre-fills from the
 * canonical product's name — the record stores product_id, not free text
 * (same contract as create).
 */
export function getLabTestEditableDraft(
  id: number,
  user: { id: number; role: Role },
): {
  id: number;
  test_number: string;
  test_type: LabTestType;
  record: Record<string, unknown>;
  product_description: string;
  samples: LabTestSample[];
} | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = getDb()
    .prepare(
      `SELECT t.*, p.name AS product_name
       FROM lab_test_records t LEFT JOIN lab_products p ON p.id = t.product_id
       WHERE t.id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (!canEditLabTestRecord(user, loadLabTestAuth(row))) return null;
  return {
    id,
    test_number: String(row.test_number),
    test_type: row.test_type as LabTestType,
    record: row,
    product_description: row.product_name == null ? '' : String(row.product_name),
    samples: listLabTestSamples(id),
  };
}

/** Record fields covered by the shared form — diffed for the UPDATE audit. */
const EDITABLE_FIELDS = [
  'connector_type',
  'sample_count',
  'lot_number',
  'sampling_area',
  'equipment_id',
  'medium_used',
  'actual_pressure',
  'torque_in_lb',
  'time_sec',
  'angle',
  'temperature_measured',
  'remarks',
  'final_result',
] as const;

/**
 * Update a DRAFT or REJECTED test in ONE transaction (PROMPT 43-B/RBAC expansion). Scope + lifecycle are
 * enforced server-side: an out-of-scope caller gets LabTestDraftNotFoundError
 * (404 — the record is not discoverable), an in-scope non-DRAFT gets
 * LabTestNotDraftError (400). The full payload is revalidated by the caller
 * with the SAME labTestFormSchema used on create (no partial-update bypass);
 * the sample grid is replaced wholesale and re-derives the SAME stable
 * identifiers (LAB-TEST-%05d-SNN from test_number + sample_no). test_type
 * comes from the stored record, never from the request. On form_action=submit
 * the draft moves to SUBMITTED exactly like create's submit path. Every
 * changed field is audited as LAB_TEST/UPDATE with old/new values.
 */
export function updateLabTestDraft(
  user: { id: number; role: Role },
  testId: number,
  data: LabTestFormData & { product_id: number | null; template_id?: number | null; template_version_id?: number | null },
): { id: number; test_number: string } {
  return transaction(() => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(testId) as Record<string, unknown> | undefined;
    if (!row) throw new LabTestDraftNotFoundError();
    const auth = loadLabTestAuth(row);
    // Scope first: an out-of-scope record must not reveal whether it exists.
    // The owner (or manager+) of a non-DRAFT test then gets the explicit
    // 400 lifecycle error — SUBMITTED and beyond belong to the review flow.
    const isOwn = auth.tested_by === user.id || auth.created_by === user.id;
    const isManagerOrAbove = user.role === 'manager' || user.role === 'admin';
    if (!isOwn && !isManagerOrAbove) throw new LabTestDraftNotFoundError();
    if (auth.status !== 'DRAFT' && auth.status !== 'REJECTED') throw new LabTestNotDraftError(auth.status);
    const previousStatus = auth.status;

    const testType = row.test_type as LabTestType;
    const testNumber = String(row.test_number);
    const submit = data.form_action === 'submit';

    // Same archived-equipment guard as create.
    if (data.equipment_id != null) {
      const equipment = db.prepare('SELECT id, is_archived FROM lab_equipment WHERE id = ?').get(data.equipment_id) as
        | { id: number; is_archived: number }
        | undefined;
      if (!equipment) throw new Error('Invalid equipment.');
      if (equipment.is_archived === 1) throw new Error('Archived equipment cannot be used for new tests.');
    }

    const oldSnapshot: Record<string, unknown> = {
      ...(Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, row[f] ?? null])) as Record<string, unknown>),
      product_id: row.product_id ?? null,
      template_id: row.template_id ?? null,
      template_version_id: row.template_version_id ?? null,
      environment_readings: listLabTestEnvironmentReadings(testId).map((r) => ({
        reading_at: r.reading_at,
        temperature: r.temperature,
        humidity: r.humidity,
        notes: r.notes,
      })),
    };
    const newSnapshot: Record<string, unknown> = {
      connector_type: data.connector_type,
      sample_count: data.sample_count,
      lot_number: data.lot_number,
      sampling_area: data.sampling_area,
      equipment_id: data.equipment_id,
      medium_used: data.medium_used,
      actual_pressure: data.actual_pressure,
      torque_in_lb: data.torque_in_lb,
      time_sec: data.time_sec,
      angle: data.angle,
      temperature_measured: data.temperature_measured,
      remarks: data.remarks,
      final_result: data.final_result,
      product_id: data.product_id,
      template_id: data.template_id ?? null,
      template_version_id: data.template_version_id ?? null,
      environment_readings: (data.environment_readings_json ?? []).filter(isValidEnvironmentReading),
    };
    const oldDiff: Record<string, unknown> = {};
    const newDiff: Record<string, unknown> = {};
    for (const key of Object.keys(oldSnapshot)) {
      // JSON.stringify comparison (not String()): the environment_readings
      // value is an array of rows and must be compared structurally.
      if (JSON.stringify(oldSnapshot[key] ?? null) !== JSON.stringify(newSnapshot[key] ?? null)) {
        oldDiff[key] = oldSnapshot[key];
        newDiff[key] = newSnapshot[key];
      }
    }

    db.prepare(
      `UPDATE lab_test_records SET
         product_id = ?, equipment_id = ?, lot_number = ?, sampling_area = ?, medium_used = ?,
         connector_type = ?, sample_count = ?, actual_pressure = ?, torque_in_lb = ?, actual_force = ?, torque_value = ?, time_sec = ?,
         angle = ?, temperature_measured = ?, testing_date = ?, humidity_measured = ?, remarks = ?, final_result = ?,
         status = CASE WHEN ? = 1 THEN 'SUBMITTED' ELSE status END,
         submitted_at = CASE WHEN ? = 1 THEN datetime('now') ELSE submitted_at END,
         parameters_snapshot_json = CASE WHEN ? = 1 THEN ? ELSE parameters_snapshot_json END,
         template_id = ?, template_version_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      data.product_id,
      data.equipment_id,
      data.lot_number,
      data.sampling_area,
      data.medium_used,
      data.connector_type,
      data.sample_count,
      data.actual_pressure,
      data.torque_in_lb,
      data.actual_force,
      data.torque_value,
      data.time_sec,
      data.angle,
      data.temperature_measured,
      data.testing_date,
      data.humidity_measured,
      data.remarks,
      submit ? data.final_result : null,
      submit ? 1 : 0,
      submit ? 1 : 0,
      submit ? 1 : 0,
      submit ? approvedTemplateParametersSnapshot(db, data.template_version_id ?? null, testType) : null,
      data.template_id ?? null,
      data.template_version_id ?? null,
      testId,
    );

    // Replace the sample grid — identifiers re-derive identically from the
    // immutable test_number + sample_no, so approved-later traceability and
    // existing identifiers stay stable.
    db.prepare('DELETE FROM lab_test_samples WHERE test_id = ?').run(testId);
    const rows = [...(data.samples_json ?? [])].sort((a, b) => a.sample_no - b.sample_no);
    const insertSample = db.prepare(
      `INSERT INTO lab_test_samples (
         test_id, sample_no, sample_identifier, part_name, set_pressure, actual_pressure,
         applied_pressure, volume_sec, volume_liter, pressure_difference, holding_time_sec, leakage_rate, result, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const r of rows) {
      insertSample.run(
        testId,
        r.sample_no,
        `${testNumber}-S${String(r.sample_no).padStart(2, '0')}`,
        r.part_name,
        r.set_pressure,
        r.actual_pressure,
        r.applied_pressure,
        r.volume_sec,
        r.volume_liter,
        r.pressure_difference,
        r.holding_time_sec,
        r.leakage_rate,
        r.result,
        r.result != null ? 'TESTED' : 'PENDING',
      );
    }

    // Replace the environment readings wholesale (PROMPT 51) — same pattern as
    // the sample grid. DRAFT-only is already guaranteed above; the structural
    // triggers freeze these rows once the test reaches APPROVED/VOID.
    db.prepare('DELETE FROM lab_test_environment_readings WHERE test_id = ?').run(testId);
    const newReadings = (data.environment_readings_json ?? []).filter(isValidEnvironmentReading);
    if (newReadings.length > 0) {
      const insertReading = db.prepare(
        `INSERT INTO lab_test_environment_readings
           (test_id, reading_at, temperature, humidity, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );
      for (const r of newReadings) {
        insertReading.run(testId, r.reading_at, r.temperature, r.humidity, r.notes, user.id);
      }
    }

    if (Object.keys(oldDiff).length > 0 || rows.length > 0) {
      auditLabTest(
        testId,
        user.id,
        'UPDATE',
        `edited ${previousStatus.toLowerCase()} test ${testNumber}; samples=${data.sample_count}; readings=${newReadings.length}`,
        JSON.stringify(oldDiff),
        JSON.stringify(newDiff),
      );
    }
    if (submit) {
      auditLabTest(testId, user.id, 'SUBMIT', `test_number=${testNumber}; final_result=${data.final_result}`, previousStatus, 'SUBMITTED');
    }
    return { id: testId, test_number: testNumber };
  });
}

/**
 * POST /lab/tests/[id]/edit — the edit-mode submission of the shared form
 * (PROMPT 43-B). The test id comes from the path segment only; test_type is
 * re-resolved from the STORED record (never the query/body); the body runs
 * through the same labTestFormSchema as create, and product/template ids are
 * re-resolved server-authoritatively exactly like handleLabTestFormPost.
 */
export async function handleLabTestEditPost(context: APIContext, testId: number): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(`/lab/tests/${testId}/edit`)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  // Scope + DRAFT/REJECTED check against the stored record — 404-style flash for
  // out-of-scope (same IDOR decision as the detail page), error flash for 400.
  const row = getDb().prepare('SELECT * FROM lab_test_records WHERE id = ?').get(testId) as Record<string, unknown> | undefined;
  const rowAuth = row ? loadLabTestAuth(row) : null;
  const inScope = rowAuth
    ? rowAuth.tested_by === user.id || rowAuth.created_by === user.id || user.role === 'manager' || user.role === 'admin'
    : false;
  if (!row || !rowAuth || !inScope) {
    setFlash(context, 'error', 'Test not found.');
    return context.redirect('/lab/tests');
  }
  if (rowAuth.status !== 'DRAFT' && rowAuth.status !== 'REJECTED') {
    setFlash(context, 'error', new LabTestNotDraftError(rowAuth.status).message);
    return context.redirect(`/lab/tests/${testId}`);
  }
  const testType = row.test_type as LabTestType;
  if (testType !== 'air' && testType !== 'vacuum') {
    setFlash(context, 'error', 'Invalid test type.');
    return context.redirect('/lab/tests');
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labTestFormSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(`/lab/tests/new?test=${testId}`);
  }

  try {
    const data = parsed.data;
    const productId = resolveLabProductId(data.product_description);
    const rawTemplateVersionId = form.get('template_version_id');
    const templateVersionId =
      rawTemplateVersionId !== null && rawTemplateVersionId !== '' && Number.isInteger(Number(rawTemplateVersionId)) && Number(rawTemplateVersionId) > 0
        ? Number(rawTemplateVersionId)
        : null;
    const templateRef = resolveLabTemplateVersion(templateVersionId, testType);
    if (data.form_action === 'submit' && templateVersionId !== null && templateRef === null) {
      throw new Error('Submit requires a compatible approved template version.');
    }
    const updated = updateLabTestDraft(
      { id: user.id, role: user.role },
      testId,
      { ...data, product_id: productId, template_id: templateRef?.template_id ?? null, template_version_id: templateRef?.template_version_id ?? null },
    );
    if (data.form_action === 'submit') {
      setFlash(context, 'success', `Test ${updated.test_number} submitted for review.`);
      return context.redirect(`/lab/tests/${testId}`);
    }
    if (data.form_action === 'continue') {
      setFlash(context, 'success', `Draft ${updated.test_number} updated.`);
      return context.redirect(`/lab/tests/new?type=${testType}`);
    }
    setFlash(context, 'success', `Draft ${updated.test_number} updated.`);
    return context.redirect(`/lab/tests/${testId}`);
  } catch (err) {
    console.error('[lab] test draft edit failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the test.');
    return context.redirect(`/lab/tests/new?test=${testId}`);
  }
}

/** Sample rows of a test (read helper for tests/verification). */
export function listLabTestSamples(testId: number): LabTestSample[] {
  return getDb()
    .prepare('SELECT * FROM lab_test_samples WHERE test_id = ? ORDER BY sample_no ASC')
    .all(testId) as LabTestSample[];
}

/**
 * A readings row is stored only when BOTH core cells are non-blank. Empty
 * strings (not just null) count as absent — the island sends fully-empty rows
 * as ''-filled objects before the Zod layer normalizes them.
 */
function isValidEnvironmentReading(r: { reading_at: unknown; temperature: unknown }): boolean {
  const at = r.reading_at == null ? '' : String(r.reading_at).trim();
  const temperature = r.temperature == null ? '' : String(r.temperature).trim();
  return at !== '' && temperature !== '';
}

/** One supplementary session environment reading (PROMPT 51). */
export interface LabTestEnvironmentReading {
  id: number;
  test_id: number;
  reading_at: string;
  temperature: string;
  humidity: string | null;
  notes: string | null;
  created_by: number;
  created_by_name?: string | null;
  created_at: string;
}

/** Environment readings of a test, oldest first. */
export function listLabTestEnvironmentReadings(testId: number): LabTestEnvironmentReading[] {
  return getDb()
    .prepare(
      `SELECT r.*, u.full_name AS created_by_name
       FROM lab_test_environment_readings r
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.test_id = ?
       ORDER BY r.reading_at ASC, r.id ASC`,
    )
    .all(testId) as LabTestEnvironmentReading[];
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
       ORDER BY a.created_at ASC, a.id ASC`,
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
       ORDER BY a.created_at ASC, a.id ASC`,
    )
    .all(testId) as Record<string, unknown>[];
}

export interface LabTestView {
  record: Record<string, unknown> | null;
  samples: LabTestSample[];
  environmentReadings: LabTestEnvironmentReading[];
  equipmentSnapshot: Record<string, unknown> | null;
  documentSnapshots: Record<string, unknown>[];
  productSnapshot: Record<string, unknown> | null;
  templateSnapshot: Record<string, unknown> | null;
  parametersSnapshot: Record<string, unknown> | null;
  retests: LabTestRetestHistoryRow[];
  findingLinks: LabTestFindingLink[];
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
      environmentReadings: [],
      equipmentSnapshot: null,
      documentSnapshots: [],
      productSnapshot: null,
      templateSnapshot: null,
      parametersSnapshot: null,
      retests: [],
      findingLinks: [],
      relatedQuality: [],
      timeline: [],
    };
  }
  const record = getLabTestRecordById(id) ?? null;
  if (!record) {
    return {
      record: null,
      samples: [],
      environmentReadings: [],
      equipmentSnapshot: null,
      documentSnapshots: [],
      productSnapshot: null,
      templateSnapshot: null,
      parametersSnapshot: null,
      retests: [],
      findingLinks: [],
      relatedQuality: [],
      timeline: [],
    };
  }
  return {
    record,
    samples: listLabTestSamples(id),
    environmentReadings: listLabTestEnvironmentReadings(id),
    equipmentSnapshot: getLabTestEquipmentSnapshot(id) ?? null,
    documentSnapshots: getLabTestDocumentSnapshots(id),
    productSnapshot: parseJsonObject(record.product_snapshot_json),
    templateSnapshot: parseJsonObject(record.template_snapshot_json),
    parametersSnapshot: parseJsonObject(record.parameters_snapshot_json),
    retests: getLabTestRetestHistory(id),
    findingLinks: getLabTestFindingLinks(id),
    relatedQuality: getLabTestRelatedQualityEntities(id),
    timeline: getLabTestAuditTimeline(id),
  };
}

export interface LabTestVoidResult {
  test_id: number;
  test_number: string;
  status: 'VOID';
}

/**
 * Void a laboratory test (PROMPT 42).
 * Manager/Admin authority only. Allowed from any non-terminal status except
 * APPROVED and VOID (approved records are immutable quality records; VOID is
 * terminal).
 * Mandatory reason required. Blocked if open retests exist for the test.
 */
export function voidLabTest(
  user: { id: number; role: Role },
  testId: number,
  reason: string,
  opts?: { esigned?: boolean },
): LabTestVoidResult {
  return transaction(() => {
    const db = getDb();
    // Install the terminal-record guard before any void transition. This also
    // ensures the same connection rejects later direct UPDATE/DELETE bypasses.
    ensureLabApprovalsAndAudit(db);
    const row = db
      .prepare('SELECT * FROM lab_test_records WHERE id = ?')
      .get(testId) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Test not found.');

    const testAuth = {
      status: row.status as LabTestStatus,
      tested_by: row.tested_by == null ? null : Number(row.tested_by),
      reviewed_by: row.reviewed_by == null ? null : Number(row.reviewed_by),
      created_by: Number(row.created_by),
    };
    const testNumber = String(row.test_number);

    if (!canVoidLabTest(user.role)) {
      throw new Error('You do not have permission to void laboratory tests.');
    }

    if (testAuth.status === 'APPROVED') {
      throw new Error('Approved tests are immutable and cannot be voided.');
    }
    if (testAuth.status === 'VOID') {
      throw new Error('Test is already voided.');
    }

    if (!canVoidLabTestRecord(user, testAuth)) {
      throw new Error(`Cannot void test in status ${testAuth.status}.`);
    }

    const trimmedReason = reason?.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('A reason is required to void this test.');
    }

    // Check for open retests linked to this test (as original or new test)
    const openRetests = db
      .prepare(
        `SELECT retest_number FROM lab_test_retests WHERE (original_test_id = ? OR new_test_id = ?) AND status = 'OPEN'`,
      )
      .all(testId, testId) as Array<{ retest_number: string }>;

    if (openRetests.length > 0) {
      const nums = openRetests.map((r) => r.retest_number).join(', ');
      throw new Error(
        `لا يمكن إلغاء الاختبار لوجود إعادة اختبار مفتوحة (${nums}). يرجى إغلاقها أو معالجتها أولاً.`,
      );
    }

    const dbNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Void samples
    db.prepare(
      `UPDATE lab_test_samples SET status = 'VOID', updated_at = ? WHERE test_id = ? AND status <> 'VOID'`,
    ).run(dbNow, testId);

    // Void record
    db.prepare(
      `UPDATE lab_test_records SET status = 'VOID', updated_at = ? WHERE id = ?`,
    ).run(dbNow, testId);

    // Durable action evidence: the final VOID state is sealed in the existing
    // lab_test_approvals evidence table; no password material is included.
    sealLabTestVoid(db, {
      testId,
      approverId: user.id,
      signatureReason: opts?.esigned ? trimmedReason : `Void decision: ${trimmedReason}`,
    });

    // Audit transition — the e-signature marker is appended to the reason;
    // no secret material is ever recorded in the audit trail.
    auditLabTest(
      testId,
      user.id,
      'VOID',
      opts?.esigned ? esignAuditNote(trimmedReason) : trimmedReason,
      testAuth.status,
      'VOID',
    );

    // Notify tester and their supervisor(s)
    const testerId = testAuth.tested_by ?? testAuth.created_by;
    const recipientIds = new Set<number>();
    if (testerId && testerId !== user.id) {
      recipientIds.add(testerId);
    }

    // Look up supervisor(s)
    let testerDept = 'QC';
    if (testerId) {
      const uRow = db.prepare('SELECT department FROM users WHERE id = ?').get(testerId) as { department?: string } | undefined;
      if (uRow?.department) testerDept = uRow.department;
    }
    const supervisors = db
      .prepare("SELECT id FROM users WHERE role = 'supervisor' AND is_active = 1 AND (department = ? OR department = 'QC')")
      .all(testerDept) as Array<{ id: number }>;

    for (const s of supervisors) {
      if (s.id !== user.id) {
        recipientIds.add(s.id);
      }
    }

    for (const uid of recipientIds) {
      createNotification({
        userId: uid,
        taskId: null,
        type: 'lab_test_voided',
        title: `Test voided: ${testNumber}`,
        message: `${testNumber} was voided: ${trimmedReason}`,
        actorId: user.id,
        href: `/lab/tests/${testId}`,
      });
    }

    return { test_id: testId, test_number: testNumber, status: 'VOID' };
  });
}

/**
 * Handle POST /lab/tests/[id]/void or form submission on /lab/tests/[id].
 */
export async function handleLabTestVoidPost(context: APIContext, testId: number): Promise<Response> {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(`/lab/tests/${testId}`)}`);
  }

  if (!canVoidLabTest(user.role)) {
    setFlash(context, 'error', 'You do not have permission to void laboratory tests.');
    return context.redirect(`/lab/tests/${testId}`);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labTestVoidSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(`/lab/tests/${testId}`);
  }

  try {
    // E-signature step: VOID is a highest-authority action and requires
    // re-verifying the current user's password server-side (no session
    // reissue; failures rate-limited per user + audited without secrets).
    const outcome = requireEsignature(user.id, form.get(ESIGN_FIELD_NAME)?.toString() ?? null);
    if (outcome === 'rate_limited') {
      setFlash(context, 'error', ESIGN_RATE_LIMITED_MESSAGE_AR);
      return context.redirect(`/lab/tests/${testId}`);
    }
    if (outcome === 'invalid') {
      setFlash(context, 'error', ESIGN_FAILURE_MESSAGE_AR);
      return context.redirect(`/lab/tests/${testId}`);
    }
    const result = voidLabTest({ id: user.id, role: user.role }, testId, parsed.data.reason, { esigned: true });
    setFlash(context, 'success', `Test ${result.test_number} was voided.`);
  } catch (err) {
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not void this test.');
  }

  return context.redirect(`/lab/tests/${testId}`);
}
