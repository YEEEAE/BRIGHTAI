// QC Laboratory Calibration Register (PROMPT 37, /lab/calibration).
//
// The register tracks dated calibration records (lab_equipment_calibration,
// migration 011): equipment, last calibration date, calibration due date,
// provider, certificate reference, calibration result, next due date, status,
// notes. All optional fields stay NULLable — missing data is displayed as "—"
// and NEVER auto-filled (A2: no fabricated history).
//
// The six UI states (Compliant / Due Soon / Due Today / Overdue / Not
// Compliant / Unknown) are DERIVED at read time, never stored (011 table has
// no status column). Due-state follows the overview.ts derivation (Due Soon =
// within CALIBRATION_DUE_SOON_DAYS, DUE_TODAY beats OVERDUE, UNKNOWN when no
// due date); NOT_COMPLIANT additionally interprets the free-text `result`
// field (token match on LOWER(result), D-1: the original text is preserved
// verbatim). The overview module deliberately left NOT_COMPLIANT to this
// module (open decision documented in overview.ts).
//
// Writes go through one transaction: row + shared qc_audit_log
// (entity_type='LAB_EQUIPMENT_CALIBRATION', CREATE/UPDATE) + a calibration
// alert notification (reusing the existing notification engine, taskId null
// so the bell link resolves to /notifications — same known limitation as lab
// test notifications). No auto-blocking anywhere (page reference §38: do not
// automatically block unless approved policy requires it).

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { appendQcAudit } from '../audit/qcChain';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { createNotification } from '../notifications';
import { canCreateLabCalibration, canEditLabCalibration, canProposeLabCalibrationCreate, canProposeLabCalibrationEdit } from '../permissions';
import { submitChangeRequest } from './changeRequests';
import type { LabEquipmentCalibration } from '../types';
import { CALIBRATION_DUE_SOON_DAYS, deriveCalibrationState, type LabCalibrationState } from './overview';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../pagination';
import { labCalibrationSchema, parseFormData } from '../validation';

export type LabCalibrationStatus = LabCalibrationState | 'NOT_COMPLIANT';

export const LAB_CALIBRATION_STATUSES: readonly LabCalibrationStatus[] = [
  'COMPLIANT',
  'DUE_SOON',
  'DUE_TODAY',
  'OVERDUE',
  'NOT_COMPLIANT',
  'UNKNOWN',
];

export const LAB_CALIBRATION_STATUS_LABELS: Record<LabCalibrationStatus, string> = {
  COMPLIANT: 'Compliant',
  DUE_SOON: 'Due Soon',
  DUE_TODAY: 'Due Today',
  OVERDUE: 'Overdue',
  NOT_COMPLIANT: 'Not Compliant',
  UNKNOWN: 'Unknown',
};

/**
 * Free-text tokens that mark a calibration result as NOT_COMPLIANT. The
 * `result` column stores company text verbatim (mixed Arabic/English, D-1), so
 * non-compliance is a read-time token match on LOWER(result). Additive —
 * expanding this list never rewrites stored data.
 */
export const LAB_CALIBRATION_NOT_COMPLIANT_TOKENS: readonly string[] = [
  'fail',
  'failed',
  'not compliant',
  'non-compliant',
  'noncompliant',
  'rejected',
  'out of tolerance',
  'out-of-tolerance',
];

/** True when the free-text result signals a failed calibration. */
export function resultIndicatesNonCompliant(result: string | null | undefined): boolean {
  if (!result) return false;
  const lower = String(result).toLowerCase();
  return LAB_CALIBRATION_NOT_COMPLIANT_TOKENS.some((token) => lower.includes(token));
}

/** Local ISO date offset from today by `days` (mirrors overview.ts). */
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Derive the six-state calibration status for one record. NOT_COMPLIANT (from
 * the result text) wins over the due-date state; otherwise the same
 * COMPLIANT / DUE_SOON / DUE_TODAY / OVERDUE / UNKNOWN derivation as the
 * command center (page reference §37).
 */
export function deriveLabCalibrationStatus(
  dueIso: string | null,
  result: string | null | undefined,
  today = isoOffset(0),
): LabCalibrationStatus {
  if (resultIndicatesNonCompliant(result)) return 'NOT_COMPLIANT';
  return deriveCalibrationState(dueIso, today);
}

/**
 * The due date of one calibration record: COALESCE(next_due_at,
 * calibration_due_at) — same convention as overview.ts's LATEST_DUE_SQL.
 */
export function labCalibrationDueDate(row: { next_due_at: string | null; calibration_due_at: string | null }): string | null {
  return row.next_due_at ?? row.calibration_due_at;
}

// ─────────────────────────────── Audit ───────────────────────────────

function auditLabCalibration(
  calibrationId: number,
  actorId: number,
  action: 'CREATE' | 'UPDATE',
  note: string | null,
): void {
  appendQcAudit(getDb(), { entityType: 'LAB_EQUIPMENT_CALIBRATION', entityId: calibrationId, actorId, action, note });
}

/** Audit rows for one device's calibration records (shared log, newest first). */
export function getLabCalibrationAudit(equipmentId: number): Array<Record<string, unknown>> {
  return getDb()
    .prepare(
      `SELECT a.id, a.entity_id, a.action, a.note, a.created_at, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_EQUIPMENT_CALIBRATION'
         AND a.entity_id IN (SELECT id FROM lab_equipment_calibration WHERE equipment_id = ?)
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(equipmentId) as Array<Record<string, unknown>>;
}

// ─────────────────────────────── Status SQL ───────────────────────────────

/** The six-state status expression per calibration row. Fully parameterized. */
export function calibrationStatusSql(): { sql: string; params: unknown[] } {
  const today = isoOffset(0);
  const soon = isoOffset(CALIBRATION_DUE_SOON_DAYS);
  const tokens = LAB_CALIBRATION_NOT_COMPLIANT_TOKENS;
  const notCompliant = `CASE WHEN (${tokens.map(() => "lower(coalesce(c.result,'')) LIKE ?").join(' OR ')}) THEN 1 ELSE 0 END`;
  const params: unknown[] = tokens.map((t) => `%${t}%`);
  params.push(today, today, soon);
  return {
    sql: `CASE
      WHEN ${notCompliant} THEN 'NOT_COMPLIANT'
      WHEN date(COALESCE(c.next_due_at, c.calibration_due_at)) IS NULL THEN 'UNKNOWN'
      WHEN date(COALESCE(c.next_due_at, c.calibration_due_at)) < date(?) THEN 'OVERDUE'
      WHEN date(COALESCE(c.next_due_at, c.calibration_due_at)) = date(?) THEN 'DUE_TODAY'
      WHEN date(COALESCE(c.next_due_at, c.calibration_due_at)) <= date(?) THEN 'DUE_SOON'
      ELSE 'COMPLIANT'
    END`,
    params,
  };
}

// ─────────────────────────────── List / search ───────────────────────────────

export type LabCalibrationSortField =
  | 'last_calibrated_at'
  | 'due_date'
  | 'provider'
  | 'certificate_reference'
  | 'result'
  | 'equipment_code'
  | 'status'
  | 'created_at';

export const LAB_CALIBRATION_SORT_FIELDS: readonly LabCalibrationSortField[] = [
  'last_calibrated_at',
  'due_date',
  'provider',
  'certificate_reference',
  'result',
  'equipment_code',
  'status',
  'created_at',
];

export const LAB_CALIBRATION_PER_PAGE_OPTIONS = PER_PAGE_OPTIONS;
export const DEFAULT_LAB_CALIBRATION_PER_PAGE = DEFAULT_PER_PAGE;
export const DEFAULT_LAB_CALIBRATION_SORT: LabCalibrationSortField = 'created_at';
export const DEFAULT_LAB_CALIBRATION_DIR: 'asc' | 'desc' = 'desc';

export interface LabCalibrationSearchFilters {
  /** Free text — equipment code/name, provider, certificate reference (LIKE). */
  q: string | null;
  /** Derived status filter — one of LAB_CALIBRATION_STATUSES. */
  status: LabCalibrationStatus | null;
  /** Restrict to one equipment id (equipment detail page drill-down). */
  equipment: number | null;
  /** '1' → due within the attention window (DUE_SOON / DUE_TODAY) — command-center KPI. */
  due: '1' | null;
  sort: LabCalibrationSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_CALIBRATION_FILTERS: LabCalibrationSearchFilters = {
  q: null,
  status: null,
  equipment: null,
  due: null,
  sort: DEFAULT_LAB_CALIBRATION_SORT,
  dir: DEFAULT_LAB_CALIBRATION_DIR,
  page: 1,
  per_page: DEFAULT_LAB_CALIBRATION_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeCalibrationLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Parse + validate the /lab/calibration query params. Invalid values drop silently. */
export function parseLabCalibrationSearchFilters(url: URL): LabCalibrationSearchFilters {
  const f: LabCalibrationSearchFilters = { ...NO_LAB_CALIBRATION_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const status = sp.get('status');
  if (status && (LAB_CALIBRATION_STATUSES as readonly string[]).includes(status)) {
    f.status = status as LabCalibrationStatus;
  }
  const equipment = positiveInt(sp.get('equipment') ?? '');
  if (equipment !== null) f.equipment = equipment;
  if (sp.get('due') === '1') f.due = '1';
  const sort = sp.get('sort');
  if (sort && (LAB_CALIBRATION_SORT_FIELDS as readonly string[]).includes(sort)) f.sort = sort as LabCalibrationSortField;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_CALIBRATION_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

/** True when any list filter is active (drives the "Reset" affordance). */
export function hasLabCalibrationFilters(f: LabCalibrationSearchFilters): boolean {
  return Boolean(f.q || f.status || f.equipment !== null || f.due !== null);
}

/** Rebuild the querystring for the current filters (sort/pagination links). */
export function labCalibrationFiltersToQuery(f: LabCalibrationSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.status) sp.set('status', f.status);
  if (f.equipment !== null) sp.set('equipment', String(f.equipment));
  if (f.due === '1') sp.set('due', '1');
  if (f.sort !== DEFAULT_LAB_CALIBRATION_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_CALIBRATION_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_CALIBRATION_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const LAB_CALIBRATION_LIST_COLUMNS = `
  SELECT c.id, c.equipment_id, c.last_calibrated_at, c.calibration_due_at, c.provider,
         c.certificate_reference, c.result, c.next_due_at, c.notes, c.created_by, c.created_at,
         e.code AS equipment_code, e.name AS equipment_name, e.is_archived,
         date(COALESCE(c.next_due_at, c.calibration_due_at)) AS due_date,
         (SELECT u.full_name FROM users u WHERE u.id = c.created_by) AS created_by_name`;

const LAB_CALIBRATION_LIST_FROM = `
  FROM lab_equipment_calibration c
  JOIN lab_equipment e ON e.id = c.equipment_id`;

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabCalibrationSortField, string> = {
  last_calibrated_at: 'last_calibrated_at',
  due_date: 'due_date',
  provider: 'provider COLLATE NOCASE',
  certificate_reference: 'certificate_reference COLLATE NOCASE',
  result: 'result COLLATE NOCASE',
  equipment_code: 'equipment_code COLLATE NOCASE',
  status: 'status',
  created_at: 'created_at',
};

export interface LabCalibrationListRow {
  id: number;
  equipment_id: number;
  equipment_code: string;
  equipment_name: string;
  last_calibrated_at: string | null;
  calibration_due_at: string | null;
  next_due_at: string | null;
  due_date: string | null;
  provider: string | null;
  certificate_reference: string | null;
  result: string | null;
  notes: string | null;
  created_by_name: string | null;
  created_at: string;
  is_archived: number;
  status: LabCalibrationStatus;
}

export interface LabCalibrationSearchResult {
  rows: LabCalibrationListRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Paged, sorted, filtered calibration register. Status is derived per row in
 * SQL (subquery so filters/sorts can reference the derived alias); every value
 * rides in the params array — no user input in SQL text.
 */
export function searchLabCalibration(f: LabCalibrationSearchFilters): LabCalibrationSearchResult {
  const db = getDb();
  const statusSql = calibrationStatusSql();
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    const like = `%${escapeCalibrationLike(f.q)}%`;
    conds.push(
      "(t.equipment_code LIKE ? ESCAPE '\\' OR t.equipment_name LIKE ? ESCAPE '\\' OR t.provider LIKE ? ESCAPE '\\' " +
        "OR t.certificate_reference LIKE ? ESCAPE '\\')",
    );
    params.push(like, like, like, like);
  }
  if (f.status) {
    conds.push('status = ?');
    params.push(f.status);
  }
  if (f.equipment !== null) {
    conds.push('equipment_id = ?');
    params.push(f.equipment);
  }
  if (f.due === '1') {
    conds.push("status IN ('DUE_SOON', 'DUE_TODAY')");
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const from = `(
    ${LAB_CALIBRATION_LIST_COLUMNS},
    ${statusSql.sql} AS status
    ${LAB_CALIBRATION_LIST_FROM}
  )`;

  const totalRow = db.prepare(`SELECT COUNT(*) AS n FROM ${from} t ${where}`).get(...statusSql.params, ...params) as { n: number };
  const total = Number(totalRow.n);
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db
    .prepare(
      `SELECT * FROM ${from} t ${where} ORDER BY ${SORT_SQL[f.sort]} ${dir}, t.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...statusSql.params, ...params, f.per_page, offset) as LabCalibrationListRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Summary ───────────────────────────────

export interface LabCalibrationSummary {
  count: number;
  latest: LabEquipmentCalibration | null;
  /** Derived six-state status of the latest record (UNKNOWN when none). */
  status: LabCalibrationStatus;
  due_date: string | null;
}

/** Count + latest record for the equipment detail page summary block. */
export function getLabCalibrationSummary(equipmentId: number, today = isoOffset(0)): LabCalibrationSummary {
  const rows = getDb()
    .prepare(
      `SELECT * FROM lab_equipment_calibration
       WHERE equipment_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(equipmentId) as LabEquipmentCalibration[];
  const latest = rows[0] ?? null;
  return {
    count: rows.length,
    latest,
    status: latest ? deriveLabCalibrationStatus(labCalibrationDueDate(latest), latest.result, today) : 'UNKNOWN',
    due_date: latest ? labCalibrationDueDate(latest) : null,
  };
}

// ─────────────────────────────── Detail ───────────────────────────────

export interface LabCalibrationDetailView {
  calibration: LabEquipmentCalibration;
  equipment_code: string;
  equipment_name: string;
  is_archived: number;
  status: LabCalibrationStatus;
  due_date: string | null;
  created_by_name: string | null;
}

/** One calibration record + resolved equipment + actor + derived status. */
export function getLabCalibrationDetail(id: number): LabCalibrationDetailView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = getDb()
    .prepare(
      `SELECT c.*, e.code AS equipment_code, e.name AS equipment_name, e.is_archived,
              u.full_name AS created_by_name,
              date(COALESCE(c.next_due_at, c.calibration_due_at)) AS due_date
       FROM lab_equipment_calibration c
       JOIN lab_equipment e ON e.id = c.equipment_id
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = ?`,
    )
    .get(id) as
    | (LabEquipmentCalibration & {
        equipment_code: string;
        equipment_name: string;
        is_archived: number;
        created_by_name: string | null;
        due_date: string | null;
      })
    | undefined;
  if (!row) return null;
  const { equipment_code, equipment_name, is_archived, created_by_name, due_date, ...calibration } = row;
  return {
    calibration: calibration as unknown as LabEquipmentCalibration,
    equipment_code,
    equipment_name,
    is_archived: Number(is_archived),
    status: deriveLabCalibrationStatus(due_date, calibration.result),
    due_date,
    created_by_name,
  };
}

// ─────────────────────────────── Create / update ───────────────────────────────

/** Normalized form input after Zod validation (labCalibrationSchema). */
export interface LabCalibrationFormData {
  equipment_id: number;
  last_calibrated_at: string | null;
  calibration_due_at: string | null;
  provider: string | null;
  certificate_reference: string | null;
  result: string | null;
  next_due_at: string | null;
  notes: string | null;
}

function calibrationSummary(data: LabCalibrationFormData): string {
  return [
    `last_calibrated_at=${data.last_calibrated_at ?? '—'}`,
    `calibration_due_at=${data.calibration_due_at ?? '—'}`,
    `next_due_at=${data.next_due_at ?? '—'}`,
    `provider=${data.provider ?? '—'}`,
    `certificate_reference=${data.certificate_reference ?? '—'}`,
    `result=${data.result ?? '—'}`,
  ].join('; ');
}

/** Active equipment rows for the form dropdown (non-archived only). */
export function listLabEquipmentOptionsForCalibration(): Array<{ id: number; code: string; name: string }> {
  return getDb()
    .prepare(
      `SELECT id, code, name FROM lab_equipment WHERE is_archived = 0 ORDER BY name ASC, id ASC`,
    )
    .all() as Array<{ id: number; code: string; name: string }>;
}

/**
 * Notify the equipment owner when a calibration record leaves the equipment
 * in an attention state (DUE_SOON / DUE_TODAY / OVERDUE). Reuses the existing
 * notification engine; entity_href points at the equipment record so the bell
 * and /lab/notifications open the source device (migration 022).
 */
function notifyCalibrationAttention(equipmentId: number, status: LabCalibrationStatus): void {
  const equipment = getDb()
    .prepare('SELECT code, name, created_by FROM lab_equipment WHERE id = ?')
    .get(equipmentId) as { code: string; name: string; created_by: number } | undefined;
  if (!equipment || !equipment.created_by) return;
  if (status !== 'OVERDUE' && status !== 'DUE_TODAY' && status !== 'DUE_SOON') return;
  createNotification({
    userId: equipment.created_by,
    taskId: null,
    type: status === 'OVERDUE' ? 'lab_calibration_overdue' : 'lab_calibration_due',
    title: `Calibration ${status === 'OVERDUE' ? 'overdue' : 'due'}: ${equipment.code}`,
    message:
      status === 'OVERDUE'
        ? `${equipment.name} (${equipment.code}) calibration is overdue — schedule recalibration.`
        : `${equipment.name} (${equipment.code}) calibration is ${status === 'DUE_TODAY' ? 'due today' : 'due soon'} — schedule recalibration.`,
    href: `/lab/equipment/${equipmentId}`,
  });
}

/** Create a calibration record + CREATE audit + attention notification (one transaction). */
export function createLabCalibration(data: LabCalibrationFormData, actorId: number): number {
  return transaction(() => {
    const db = getDb();
    const equipment = db
      .prepare('SELECT id, code, is_archived FROM lab_equipment WHERE id = ?')
      .get(data.equipment_id) as { id: number; code: string; is_archived: number } | undefined;
    if (!equipment) throw new Error('Equipment not found.');
    if (equipment.is_archived === 1) throw new Error('Archived equipment cannot accept new calibration records.');
    const result = db
      .prepare(
        `INSERT INTO lab_equipment_calibration (
           equipment_id, last_calibrated_at, calibration_due_at, provider,
           certificate_reference, result, next_due_at, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.equipment_id,
        data.last_calibrated_at,
        data.calibration_due_at,
        data.provider,
        data.certificate_reference,
        data.result,
        data.next_due_at,
        data.notes,
        actorId,
      );
    const id = Number(result.lastInsertRowid);
    auditLabCalibration(id, actorId, 'CREATE', `equipment=${equipment.code}; ${calibrationSummary(data)}`);
    notifyCalibrationAttention(
      data.equipment_id,
      deriveLabCalibrationStatus(labCalibrationDueDate(data), data.result),
    );
    return id;
  });
}

/** Update a calibration record + UPDATE audit + attention notification (one transaction). */
export function updateLabCalibration(id: number, data: LabCalibrationFormData, actorId: number): void {
  transaction(() => {
    const db = getDb();
    const existing = db
      .prepare('SELECT c.id, c.equipment_id, e.code FROM lab_equipment_calibration c JOIN lab_equipment e ON e.id = c.equipment_id WHERE c.id = ?')
      .get(id) as { id: number; equipment_id: number; code: string } | undefined;
    if (!existing) throw new Error('Calibration record not found.');
    const equipment = db
      .prepare('SELECT id, code, is_archived FROM lab_equipment WHERE id = ?')
      .get(data.equipment_id) as { id: number; code: string; is_archived: number } | undefined;
    if (!equipment) throw new Error('Equipment not found.');
    if (equipment.is_archived === 1) throw new Error('Archived equipment cannot accept new calibration records.');
    db.prepare(
      `UPDATE lab_equipment_calibration SET
         equipment_id = ?, last_calibrated_at = ?, calibration_due_at = ?, provider = ?,
         certificate_reference = ?, result = ?, next_due_at = ?, notes = ?
       WHERE id = ?`,
    ).run(
      data.equipment_id,
      data.last_calibrated_at,
      data.calibration_due_at,
      data.provider,
      data.certificate_reference,
      data.result,
      data.next_due_at,
      data.notes,
      id,
    );
    auditLabCalibration(id, actorId, 'UPDATE', `equipment=${equipment.code}; ${calibrationSummary(data)}`);
    notifyCalibrationAttention(
      data.equipment_id,
      deriveLabCalibrationStatus(labCalibrationDueDate(data), data.result),
    );
  });
}

// ─────────────────────────────── POST handlers ───────────────────────────────

/**
 * Shared POST body for create + edit (middleware short-circuit — same pattern
 * as handleLabEquipmentPost). `id` comes from the matched path segment, never
 * from the body. The id is extracted by the middleware; the permission is
 * re-checked server-side per action (create manager+, edit manager+).
 */
async function handleLabCalibrationPost(context: APIContext, id: number | null): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const backUrl = id === null ? '/lab/calibration/new' : `/lab/calibration/${id}/edit`;
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  if (id === null) {
    if (!canCreateLabCalibration(user.role) && !canProposeLabCalibrationCreate(user.role)) {
      setFlash(context, 'error', 'You do not have permission to add calibration records.');
      return context.redirect('/lab/calibration');
    }
  } else if (!canEditLabCalibration(user.role) && !canProposeLabCalibrationEdit(user.role)) {
    setFlash(context, 'error', 'You do not have permission to edit calibration records.');
    return context.redirect(`/lab/calibration/${id}`);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labCalibrationSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }
  const data = parsed.data as LabCalibrationFormData;

  try {
    if (!canCreateLabCalibration(user.role) && !canEditLabCalibration(user.role)) {
      const request = submitChangeRequest({
        actor: { id: user.id, role: user.role },
        entity_type: 'CALIBRATION',
        operation: id === null ? 'CREATE' : 'UPDATE',
        entity_id: id,
        payload: { entity_type: 'CALIBRATION', data },
      });
      setFlash(context, 'success', 'Calibration proposal submitted for management review.');
      return context.redirect(`/lab/change-requests/${request.id}`);
    }
    if (id === null) {
      const newId = createLabCalibration(data, user.id);
      setFlash(context, 'success', 'Calibration record added to the register.');
      return context.redirect(`/lab/calibration/${newId}`);
    }
    updateLabCalibration(id, data, user.id);
    setFlash(context, 'success', 'Calibration record updated.');
    return context.redirect(`/lab/calibration/${id}`);
  } catch (err) {
    console.error('[lab] calibration form save failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the calibration record.');
    return context.redirect(backUrl);
  }
}

/** POST /lab/calibration/new */
export async function handleLabCalibrationCreatePost(context: APIContext): Promise<Response> {
  return handleLabCalibrationPost(context, null);
}

/** POST /lab/calibration/[id]/edit — the id is extracted by the middleware from the path. */
export async function handleLabCalibrationEditPost(context: APIContext, id: number): Promise<Response> {
  return handleLabCalibrationPost(context, id);
}
