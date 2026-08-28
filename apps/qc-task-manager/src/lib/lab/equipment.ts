// QC Laboratory Equipment Registry (PROMPT 11, /lab/equipment).
//
// One module owns the Equipment Registry: the searchable list (URL-driven,
// fully-parameterized SQL, whitelisted sort — same shape as products.ts /
// testSearch.ts), the detail loader (fields + test usage + linked
// SOP/WI documents + change history), and the create/update/archive/restore
// service. Every change writes the shared qc_audit_log with
// entity_type='LAB_EQUIPMENT' — never a second audit system.
//
// Retiring equipment is is_archived=1, NEVER a hard delete: lab_test_records
// and lab_equipment_* reference equipment by canonical id with ON DELETE
// RESTRICT/CASCADE, and the audit trail must survive. Archive/restore are
// audited as UPDATE with an `archived`/`restored` note (the audit log's
// action CHECK has no ARCHIVE action — see 011).
//
// Status and calibration values are stored VERBATIM as supplied (mixed
// Arabic/English company data, A2). Display mapping is read-time only and
// lives in ./equipmentStatus.ts.

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { createNotification } from '../notifications';
import { canApplyLabEquipmentChange, canArchiveLabEquipment, canCreateLabEquipment, canEditLabEquipment, canProposeLabEquipmentCreate, canProposeLabEquipmentEdit } from '../permissions';
import { submitChangeRequest } from './changeRequests';
import type { LabEquipment, LabEquipmentMaintenance } from '../types';
import { statusMatchesLabel } from './equipmentStatus';
import { appendQcAudit } from '../audit/qcChain';
import { LATEST_DUE_SQL } from './overview';

// ─────────────────────────────── Audit ───────────────────────────────

type LabEquipmentAuditAction = 'CREATE' | 'UPDATE';

function auditLabEquipment(
  equipmentId: number,
  actorId: number,
  action: LabEquipmentAuditAction,
  note: string | null = null,
): void {
  appendQcAudit(getDb(), { entityType: 'LAB_EQUIPMENT', entityId: equipmentId, actorId, action, note });
}

/** Change history for one device — the shared audit log, newest first. */
export function getLabEquipmentAuditTimeline(equipmentId: number): Array<Record<string, unknown>> {
  return getDb()
    .prepare(
      `SELECT a.id, a.action, a.note, a.created_at, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_EQUIPMENT' AND a.entity_id = ?
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(equipmentId) as Array<Record<string, unknown>>;
}

function auditLabEquipmentMaintenance(
  maintenanceId: number,
  actorId: number,
  note: string | null,
): void {
  appendQcAudit(getDb(), { entityType: 'LAB_EQUIPMENT_MAINTENANCE', entityId: maintenanceId, actorId, action: 'CREATE', note });
}

// ─────────────────────────────── List / search ───────────────────────────────

export type LabEquipmentSortField =
  | 'code'
  | 'name'
  | 'location'
  | 'status_raw'
  | 'serial_number'
  | 'updated_at';

export const LAB_EQUIPMENT_SORT_FIELDS: readonly LabEquipmentSortField[] = [
  'code',
  'name',
  'location',
  'status_raw',
  'serial_number',
  'updated_at',
];

export const LAB_EQUIPMENT_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_EQUIPMENT_PER_PAGE = 25;
export const DEFAULT_LAB_EQUIPMENT_SORT: LabEquipmentSortField = 'updated_at';
export const DEFAULT_LAB_EQUIPMENT_DIR: 'asc' | 'desc' = 'desc';

export interface LabEquipmentSearchFilters {
  /** Free text — name / code / serial / location / status / notes (LIKE). */
  q: string | null;
  /** Display label ("In Use", "Under Maintenance", ...) mapped to raw statuses. */
  status: string | null;
  calibration: 'yes' | 'no' | null;
  /** Attention = open maintenance or overdue latest calibration. */
  attention: boolean;
  /** '0' (active only, default) | '1' (archived only) | null (both). */
  archived: '0' | '1' | null;
  sort: LabEquipmentSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_EQUIPMENT_FILTERS: LabEquipmentSearchFilters = {
  q: null,
  status: null,
  calibration: null,
  attention: false,
  archived: '0',
  sort: DEFAULT_LAB_EQUIPMENT_SORT,
  dir: DEFAULT_LAB_EQUIPMENT_DIR,
  page: 1,
  per_page: DEFAULT_LAB_EQUIPMENT_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeEquipmentLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Parse + validate the /lab/equipment query params into a typed filter object.
 * Invalid values are silently dropped (never throws) — same contract as the
 * product/test lists.
 */
export function parseLabEquipmentSearchFilters(url: URL): LabEquipmentSearchFilters {
  const f: LabEquipmentSearchFilters = { ...NO_LAB_EQUIPMENT_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const status = sp.get('status');
  if (status && status.trim() !== '') f.status = status.trim().slice(0, 200);
  const calibration = sp.get('calibration');
  if (calibration === 'yes' || calibration === 'no') f.calibration = calibration;
  f.attention = sp.get('attention') === '1';
  const archived = sp.get('archived');
  if (archived === '1') f.archived = '1';
  else if (archived === 'all') f.archived = null;
  const sort = sp.get('sort');
  if (sort && (LAB_EQUIPMENT_SORT_FIELDS as readonly string[]).includes(sort)) f.sort = sort as LabEquipmentSortField;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_EQUIPMENT_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

/** True when any list filter is active (drives the "Reset" affordance). */
export function hasLabEquipmentFilters(f: LabEquipmentSearchFilters): boolean {
  return Boolean(f.q || f.status || f.calibration !== null || f.attention || f.archived !== '0');
}

/** Rebuild the querystring for the current filters (sort/pagination links). */
export function labEquipmentFiltersToQuery(f: LabEquipmentSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.status) sp.set('status', f.status);
  if (f.calibration !== null) sp.set('calibration', f.calibration);
  if (f.attention) sp.set('attention', '1');
  if (f.archived === '1') sp.set('archived', '1');
  else if (f.archived === null) sp.set('archived', 'all');
  if (f.sort !== DEFAULT_LAB_EQUIPMENT_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_EQUIPMENT_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_EQUIPMENT_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Raw status values (from the DB) whose display mapping matches a label.
 * Dynamic so newly typed raw statuses stay filterable; compound values match
 * BOTH parts ("غير مستخدم / DONE" appears under "Not In Use" AND "Done").
 */
function rawStatusesForLabel(label: string): string[] {
  const raws = getDb().prepare('SELECT DISTINCT status_raw FROM lab_equipment ORDER BY status_raw').all() as Array<{
    status_raw: string;
  }>;
  return raws.map((r) => r.status_raw).filter((raw) => statusMatchesLabel(raw, label));
}

/**
 * Fully-parameterized WHERE builder for the equipment list. Exported for unit
 * tests: the SQL text NEVER contains user input — every value rides in the
 * returned params in placeholder order.
 */
export function buildLabEquipmentWhere(f: LabEquipmentSearchFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    const like = `%${escapeEquipmentLike(f.q)}%`;
    conds.push(
      "(e.name LIKE ? ESCAPE '\\' OR e.code LIKE ? ESCAPE '\\' OR e.serial_number LIKE ? ESCAPE '\\' " +
        "OR e.location LIKE ? ESCAPE '\\' OR e.status_raw LIKE ? ESCAPE '\\' OR e.notes LIKE ? ESCAPE '\\')",
    );
    params.push(like, like, like, like, like, like);
  }
  if (f.status) {
    const raws = rawStatusesForLabel(f.status);
    if (raws.length > 0) {
      conds.push(`e.status_raw IN (${raws.map(() => '?').join(', ')})`);
      params.push(...raws);
    } else {
      // No raw status maps to this label → intentionally empty result set.
      conds.push('0 = 1');
    }
  }
  if (f.calibration !== null) {
    conds.push('e.calibration_status_raw = ?');
    params.push(f.calibration);
  }
  if (f.archived !== null) {
    conds.push('e.is_archived = ?');
    params.push(Number(f.archived));
  }
  if (f.attention) {
    conds.push(`(EXISTS (SELECT 1 FROM lab_equipment_maintenance m WHERE m.equipment_id = e.id AND m.completed_date IS NULL)
      OR (${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} < date('now', 'localtime')))`);
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabEquipmentSortField, string> = {
  code: 'e.code COLLATE NOCASE',
  name: 'e.name COLLATE NOCASE',
  location: 'e.location COLLATE NOCASE',
  status_raw: 'e.status_raw COLLATE NOCASE',
  serial_number: 'e.serial_number COLLATE NOCASE',
  updated_at: 'e.updated_at',
};

export interface LabEquipmentListRow {
  id: number;
  code: string;
  name: string;
  location: string | null;
  status_raw: string;
  calibration_status_raw: string | null;
  serial_number: string | null;
  notes: string | null;
  is_archived: number;
  updated_at: string;
  updated_by_name: string | null;
  test_count: number;
}

export interface LabEquipmentSearchResult {
  rows: LabEquipmentListRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const LIST_SELECT = `SELECT e.id, e.code, e.name, e.location, e.status_raw, e.calibration_status_raw,
  e.serial_number, e.notes, e.is_archived, e.updated_at,
  (SELECT u.full_name FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
    WHERE a.entity_type = 'LAB_EQUIPMENT' AND a.entity_id = e.id
    ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS updated_by_name,
  (SELECT COUNT(*) FROM lab_test_records t WHERE t.equipment_id = e.id) AS test_count
FROM lab_equipment e`;

/** Paged, sorted, filtered Equipment Registry list. All SQL is parameterized. */
export function searchLabEquipment(f: LabEquipmentSearchFilters): LabEquipmentSearchResult {
  const db = getDb();
  const where = buildLabEquipmentWhere(f);
  const totalRow = db.prepare(`SELECT COUNT(*) AS n FROM lab_equipment e ${where.sql}`).get(...where.params) as { n: number };
  const total = Number(totalRow.n);
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db
    .prepare(`${LIST_SELECT} ${where.sql} ORDER BY ${SORT_SQL[f.sort]} ${dir}, e.id DESC LIMIT ? OFFSET ?`)
    .all(...where.params, f.per_page, offset) as LabEquipmentListRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Detail ───────────────────────────────

export interface LabEquipmentDetailView {
  equipment: LabEquipment;
  created_by_name: string | null;
  updated_by_name: string | null;
  test_count: number;
  documents: Array<{ id: number; title: string; code: string; type: string }>;
}

/** Full detail view: fields, resolved audit actors, usage, linked documents. */
export function getLabEquipmentDetail(id: number): LabEquipmentDetailView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = getDb()
    .prepare(
      `SELECT e.*,
              cu.full_name AS created_by_name,
              (SELECT u.full_name FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
                WHERE a.entity_type = 'LAB_EQUIPMENT' AND a.entity_id = e.id
                ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS updated_by_name
       FROM lab_equipment e
       LEFT JOIN users cu ON cu.id = e.created_by
       WHERE e.id = ?`,
    )
    .get(id) as (LabEquipment & Partial<LabEquipmentDetailView>) | undefined;
  if (!row) return null;
  const usage = getDb().prepare('SELECT COUNT(*) AS n FROM lab_test_records WHERE equipment_id = ?').get(id) as { n: number };
  const documents = getDb()
    .prepare(
      `SELECT d.id, d.title, d.code, d.type
       FROM lab_document_links dl JOIN lab_documents d ON d.id = dl.document_id
       WHERE dl.entity_type = 'EQUIPMENT' AND dl.entity_id = ?
       ORDER BY d.code COLLATE NOCASE ASC, d.id ASC`,
    )
    .all(id) as Array<{ id: number; title: string; code: string; type: string }>;
  const { created_by_name, updated_by_name, ...equipment } = row;
  return {
    equipment: equipment as unknown as LabEquipment,
    created_by_name: created_by_name ?? null,
    updated_by_name: updated_by_name ?? null,
    test_count: Number(usage.n),
    documents,
  };
}

// ─────────────────────────────── Create / update / archive ───────────────────────────────

/** Normalized form input after Zod validation (labEquipmentSchema). */
export interface LabEquipmentFormData {
  name: string;
  code: string;
  location: string | null;
  status_raw: string;
  calibration_status_raw: 'yes' | 'no' | null;
  serial_number: string | null;
  notes: string | null;
}

/** Thrown on UNIQUE(code) collisions so the handlers can flash a clear message. */
export class LabEquipmentCodeConflictError extends Error {
  constructor(code: string) {
    super(`A piece of equipment with code "${code}" already exists.`);
    this.name = 'LabEquipmentCodeConflictError';
  }
}

function assertCodeAvailable(code: string, excludeId: number | null): void {
  const row = getDb().prepare('SELECT id FROM lab_equipment WHERE code = ? COLLATE NOCASE LIMIT 1').get(code) as
    | { id: number }
    | undefined;
  if (row && Number(row.id) !== excludeId) throw new LabEquipmentCodeConflictError(code);
}

function formSummary(data: LabEquipmentFormData): string {
  return [
    `code=${data.code}`,
    `status=${data.status_raw}`,
    `calibration=${data.calibration_status_raw ?? '—'}`,
    `serial=${data.serial_number ?? '—'}`,
    `location=${data.location ?? '—'}`,
  ].join('; ');
}

/** Create an equipment row + CREATE audit (one transaction). */
export function createLabEquipment(data: LabEquipmentFormData, actorId: number): number {
  return transaction(() => {
    const db = getDb();
    assertCodeAvailable(data.code, null);
    const result = db
      .prepare(
        `INSERT INTO lab_equipment (
           name, code, location, status_raw, calibration_status_raw, serial_number, notes, is_archived, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .run(data.name, data.code, data.location, data.status_raw, data.calibration_status_raw, data.serial_number, data.notes, actorId);
    const id = Number(result.lastInsertRowid);
    auditLabEquipment(id, actorId, 'CREATE', formSummary(data));
    return id;
  });
}

/** Update an equipment row + UPDATE audit (one transaction). */
export function updateLabEquipment(id: number, data: LabEquipmentFormData, actorId: number): void {
  transaction(() => {
    const db = getDb();
    const existing = db.prepare('SELECT id, code, status_raw, calibration_status_raw FROM lab_equipment WHERE id = ?').get(id) as
      | { id: number; code: string; status_raw: string; calibration_status_raw: string | null }
      | undefined;
    if (!existing) throw new Error('Equipment not found.');
    assertCodeAvailable(data.code, id);
    db.prepare(
      `UPDATE lab_equipment SET
         name = ?, code = ?, location = ?, status_raw = ?, calibration_status_raw = ?,
         serial_number = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(data.name, data.code, data.location, data.status_raw, data.calibration_status_raw, data.serial_number, data.notes, id);
    const statusChanged = existing.status_raw !== data.status_raw;
    const calibrationChanged = existing.calibration_status_raw !== data.calibration_status_raw;
    const codeChanged = existing.code !== data.code;
    // Status and calibration changes are ALWAYS logged (A2) — every edit
    // records them; flag them explicitly in the audit note.
    const changed: string[] = [];
    if (codeChanged) changed.push(`code_changed_from=${existing.code}`);
    if (statusChanged) changed.push(`status_changed_from=${existing.status_raw}`);
    if (calibrationChanged) changed.push(`calibration_changed_from=${existing.calibration_status_raw ?? '—'}`);
    auditLabEquipment(
      id,
      actorId,
      'UPDATE',
      `${formSummary(data)}${changed.length > 0 ? `; ${changed.join('; ')}` : ''}`,
    );
  });
}

/**
 * Retire a device by is_archived=1 (NEVER a hard delete — tests, documents
 * and maintenance/calibration rows reference it). Audited as UPDATE.
 */
export function archiveLabEquipment(id: number, actorId: number): void {
  transaction(() => {
    const db = getDb();
    const existing = db.prepare('SELECT id, code, is_archived FROM lab_equipment WHERE id = ?').get(id) as
      | { id: number; code: string; is_archived: number }
      | undefined;
    if (!existing) throw new Error('Equipment not found.');
    if (existing.is_archived === 1) throw new Error('This piece of equipment is already archived.');
    db.prepare("UPDATE lab_equipment SET is_archived = 1, updated_at = datetime('now') WHERE id = ?").run(id);
    auditLabEquipment(id, actorId, 'UPDATE', `archived ${existing.code}`);
  });
}

/** Bring an archived device back — audited as UPDATE. */
export function restoreLabEquipment(id: number, actorId: number): void {
  transaction(() => {
    const db = getDb();
    const existing = db.prepare('SELECT id, code, is_archived FROM lab_equipment WHERE id = ?').get(id) as
      | { id: number; code: string; is_archived: number }
      | undefined;
    if (!existing) throw new Error('Equipment not found.');
    if (existing.is_archived === 0) throw new Error('This piece of equipment is not archived.');
    db.prepare("UPDATE lab_equipment SET is_archived = 0, updated_at = datetime('now') WHERE id = ?").run(id);
    auditLabEquipment(id, actorId, 'UPDATE', `restored ${existing.code}`);
  });
}

// ─────────────────────────────── Maintenance ───────────────────────────────

/** Normalized form input after Zod validation (labMaintenanceSchema). */
export interface LabMaintenanceFormData {
  maintenance_date: string;
  issue: string;
  maintenance_type: string;
  description: string | null;
  technician_vendor: string;
  status: string;
  completed_date: string | null;
  notes: string | null;
}

function maintenanceSummary(data: LabMaintenanceFormData): string {
  return [
    `maintenance_date=${data.maintenance_date}`,
    `issue=${data.issue}`,
    `type=${data.maintenance_type}`,
    `status=${data.status}`,
    `technician=${data.technician_vendor}`,
    `completed=${data.completed_date ?? '—'}`,
  ].join('; ');
}

/**
 * Create one append-only maintenance event + CREATE audit (one transaction).
 * Maintenance history is never seeded and never fabricated — only events a
 * user actually logs appear. Archived equipment rejects new events (retire
 * first, then restore to log more).
 */
export function createLabEquipmentMaintenance(
  equipmentId: number,
  data: LabMaintenanceFormData,
  actorId: number,
): number {
  return transaction(() => {
    const db = getDb();
    const equipment = db
      .prepare('SELECT id, code, name, is_archived, created_by FROM lab_equipment WHERE id = ?')
      .get(equipmentId) as { id: number; code: string; name: string; is_archived: number; created_by: number | null } | undefined;
    if (!equipment) throw new Error('Equipment not found.');
    if (equipment.is_archived === 1) throw new Error('Archived equipment cannot accept new maintenance events.');
    const result = db
      .prepare(
        `INSERT INTO lab_equipment_maintenance (
           equipment_id, maintenance_date, issue, maintenance_type, description,
           technician_vendor, status, completed_date, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        equipmentId,
        data.maintenance_date,
        data.issue,
        data.maintenance_type,
        data.description,
        data.technician_vendor,
        data.status,
        data.completed_date,
        data.notes,
        actorId,
      );
    const id = Number(result.lastInsertRowid);
    auditLabEquipmentMaintenance(id, actorId, `equipment=${equipment.code}; ${maintenanceSummary(data)}`);
    // Maintenance alert for the equipment owner (reuses the notification engine;
    // entity_href opens the device maintenance history — migration 022).
    if (equipment.created_by && equipment.created_by !== actorId) {
      createNotification({
        userId: equipment.created_by,
        taskId: null,
        type: 'lab_maintenance_event',
        title: `Maintenance logged: ${equipment.code}`,
        message: `${equipment.name} (${equipment.code}) has a new maintenance event: ${data.issue}`,
        href: `/lab/equipment/${equipmentId}/maintenance`,
      });
    }
    return id;
  });
}

/** All maintenance events for one device, newest first (no fabricated events). */
export function listLabEquipmentMaintenance(equipmentId: number): LabEquipmentMaintenance[] {
  return getDb()
    .prepare(
      `SELECT * FROM lab_equipment_maintenance
       WHERE equipment_id = ?
       ORDER BY maintenance_date DESC, id DESC`,
    )
    .all(equipmentId) as LabEquipmentMaintenance[];
}

export interface LabEquipmentMaintenanceDetailView {
  maintenance: LabEquipmentMaintenance;
  equipment_id: number;
  equipment_code: string;
  equipment_name: string;
  created_by_name: string | null;
}

/** One maintenance event + resolved equipment + logging actor (print view loader). */
export function getLabEquipmentMaintenanceDetail(id: number): LabEquipmentMaintenanceDetailView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = getDb()
    .prepare(
      `SELECT m.*, e.code AS equipment_code, e.name AS equipment_name, u.full_name AS created_by_name
       FROM lab_equipment_maintenance m
       JOIN lab_equipment e ON e.id = m.equipment_id
       LEFT JOIN users u ON u.id = m.created_by
       WHERE m.id = ?`,
    )
    .get(id) as (LabEquipmentMaintenance & {
      equipment_code: string;
      equipment_name: string;
      created_by_name: string | null;
    }) | undefined;
  if (!row) return null;
  const { equipment_code, equipment_name, created_by_name, ...maintenance } = row;
  return {
    maintenance: maintenance as LabEquipmentMaintenance,
    equipment_id: maintenance.equipment_id,
    equipment_code,
    equipment_name,
    created_by_name,
  };
}

export interface LabEquipmentMaintenanceSummary {
  count: number;
  latest: LabEquipmentMaintenance | null;
}

/** Count + latest event for the equipment detail page summary block. */
export function getLabEquipmentMaintenanceSummary(equipmentId: number): LabEquipmentMaintenanceSummary {
  const rows = listLabEquipmentMaintenance(equipmentId);
  return { count: rows.length, latest: rows[0] ?? null };
}

/**
 * Audit trail restricted to a device's maintenance events (shared log, same
 * single audit system). Every maintenance change is written here — events are
 * append-only, so CREATE covers all changes.
 */
export function getLabEquipmentMaintenanceAudit(equipmentId: number): Array<Record<string, unknown>> {
  return getDb()
    .prepare(
      `SELECT a.id, a.entity_id, a.action, a.note, a.created_at, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_EQUIPMENT_MAINTENANCE'
         AND a.entity_id IN (SELECT id FROM lab_equipment_maintenance WHERE equipment_id = ?)
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(equipmentId) as Array<Record<string, unknown>>;
}

// ─────────────────────────────── Timeline ───────────────────────────────

export type LabTimelineKind = 'USAGE' | 'MAINTENANCE' | 'CALIBRATION' | 'RETURNED_TO_SERVICE';

export interface LabEquipmentTimelineEntry {
  kind: LabTimelineKind;
  /** Sortable event date/time (YYYY-MM-DD, or timestamp for usage). */
  at: string;
  title: string;
  detail: string;
  /** Source row id (test / maintenance / calibration record). */
  ref_id: number;
  /** Link target when the source record has a page (tests do today). */
  href: string | null;
  /** Maintenance events only — raw status token for the badge. */
  status?: string | null;
}

/**
 * The combined equipment timeline (page reference §33 "related: tests,
 * maintenance, calibration"): usage (test records referencing this device),
 * maintenance events, calibration records, and — derived from completed
 * maintenance — "returned to service" markers. Nothing here is fabricated:
 * usage/maintenance/calibration come from real rows; returned-to-service is
 * derived from a COMPLETED event's completed_date. Newest first, bounded.
 */
export function getLabEquipmentTimeline(equipmentId: number): LabEquipmentTimelineEntry[] {
  const db = getDb();
  const entries: LabEquipmentTimelineEntry[] = [];

  const usage = db
    .prepare(
      `SELECT id, test_number, status, final_result, created_at
       FROM lab_test_records
       WHERE equipment_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
    )
    .all(equipmentId) as Array<{
    id: number;
    test_number: string;
    status: string;
    final_result: string | null;
    created_at: string;
  }>;
  for (const t of usage) {
    entries.push({
      kind: 'USAGE',
      at: t.created_at,
      title: `${t.test_number} · ${t.status}`,
      detail: t.final_result ? `Final result: ${t.final_result}` : 'No final result yet',
      ref_id: t.id,
      href: `/lab/tests/${t.id}`,
    });
  }

  const maintenance = listLabEquipmentMaintenance(equipmentId);
  for (const m of maintenance) {
    entries.push({
      kind: 'MAINTENANCE',
      at: m.maintenance_date ?? m.created_at,
      title: m.issue || 'Maintenance event',
      detail: [m.maintenance_type, m.technician_vendor].filter(Boolean).join(' · '),
      ref_id: m.id,
      href: null,
      status: m.status,
    });
    if (m.status === 'COMPLETED' && m.completed_date) {
      entries.push({
        kind: 'RETURNED_TO_SERVICE',
        at: m.completed_date,
        title: 'Returned to service',
        detail: `Maintenance completed · ${m.issue || `event #${m.id}`}`,
        ref_id: m.id,
        href: null,
      });
    }
  }

  const calibration = db
    .prepare(
      `SELECT id, COALESCE(last_calibrated_at, created_at) AS cal_date,
              provider, certificate_reference, result
       FROM lab_equipment_calibration
       WHERE equipment_id = ?
       ORDER BY cal_date DESC, id DESC
       LIMIT 50`,
    )
    .all(equipmentId) as Array<{
    id: number;
    cal_date: string;
    provider: string | null;
    certificate_reference: string | null;
    result: string | null;
  }>;
  for (const c of calibration) {
    entries.push({
      kind: 'CALIBRATION',
      at: c.cal_date,
      title: c.certificate_reference ? `Calibration · ${c.certificate_reference}` : 'Calibration record',
      detail: [c.provider, c.result].filter(Boolean).join(' · '),
      ref_id: c.id,
      href: null,
    });
  }

  entries.sort((a, b) => {
    const diff = b.at.localeCompare(a.at);
    return diff !== 0 ? diff : b.ref_id - a.ref_id;
  });
  return entries;
}

// ─────────────────────────────── POST handlers ───────────────────────────────

export type LabEquipmentFormAction = 'save' | 'archive' | 'restore';

/**
 * Shared POST body for create + edit + archive/restore (middleware
 * short-circuit — same pattern as handleLabProductPost). `id` comes from the
 * matched path segment, never from the body. The edit form carries a hidden
 * `form_action` (save|archive|restore); archive/restore re-check their own
 * permission (same manager+ threshold) and skip field validation.
 */
async function handleLabEquipmentPost(context: APIContext, id: number | null): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const backUrl = id === null ? '/lab/equipment/new' : `/lab/equipment/${id}/edit`;
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const form = await context.request.formData();
  const formAction = (String(form.get('form_action') ?? 'save') as LabEquipmentFormAction) || 'save';
  const isArchiveOrRestore = formAction === 'archive' || formAction === 'restore';

  if (id === null) {
    if (!canCreateLabEquipment(user.role) && !canProposeLabEquipmentCreate(user.role)) {
      setFlash(context, 'error', 'You do not have permission to add equipment to the registry.');
      return context.redirect('/lab/equipment');
    }
  } else if (isArchiveOrRestore) {
    if (!canArchiveLabEquipment(user.role)) {
      setFlash(context, 'error', 'You do not have permission to archive equipment.');
      return context.redirect(`/lab/equipment/${id}`);
    }
  } else if (!canEditLabEquipment(user.role) && !canProposeLabEquipmentEdit(user.role)) {
    setFlash(context, 'error', 'You do not have permission to edit equipment.');
    return context.redirect(`/lab/equipment/${id}`);
  }

  // Archive / restore need no field validation — just the existing row.
  if (isArchiveOrRestore && id !== null) {
    try {
      if (formAction === 'archive') {
        archiveLabEquipment(id, user.id);
        setFlash(context, 'success', 'Equipment archived.');
      } else {
        restoreLabEquipment(id, user.id);
        setFlash(context, 'success', 'Equipment restored.');
      }
      return context.redirect(`/lab/equipment/${id}`);
    } catch (err) {
      console.error('[lab] equipment archive/restore failure', err);
      setFlash(context, 'error', err instanceof Error ? err.message : 'Could not update the equipment.');
      return context.redirect(`/lab/equipment/${id}`);
    }
  }

  // Dynamic import keeps this module loadable in the bundler-less unit tests.
  const { parseFormData, labEquipmentSchema } = await import('../validation');
  const parsed = parseFormData(labEquipmentSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }
  const data = parsed.data as LabEquipmentFormData;

  try {
    if (!canApplyLabEquipmentChange(user.role)) {
      const request = submitChangeRequest({
        actor: { id: user.id, role: user.role },
        entity_type: 'EQUIPMENT',
        operation: id === null ? 'CREATE' : 'UPDATE',
        entity_id: id,
        payload: { entity_type: 'EQUIPMENT', data },
      });
      setFlash(context, 'success', 'Equipment proposal submitted for management review.');
      return context.redirect(`/lab/change-requests/${request.id}`);
    }
    if (id === null) {
      const newId = createLabEquipment(data, user.id);
      setFlash(context, 'success', `Equipment ${data.code} added to the registry.`);
      return context.redirect(`/lab/equipment/${newId}`);
    }
    updateLabEquipment(id, data, user.id);
    setFlash(context, 'success', `Equipment ${data.code} updated.`);
    return context.redirect(`/lab/equipment/${id}`);
  } catch (err) {
    if (err instanceof LabEquipmentCodeConflictError) {
      setFlash(context, 'error', err.message);
    } else {
      console.error('[lab] equipment form save failure', err);
      setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the equipment.');
    }
    return context.redirect(backUrl);
  }
}

/** POST /lab/equipment/new */
export async function handleLabEquipmentCreatePost(context: APIContext): Promise<Response> {
  return handleLabEquipmentPost(context, null);
}

/** POST /lab/equipment/[id]/edit — the id is extracted by the middleware from the path. */
export async function handleLabEquipmentEditPost(context: APIContext, id: number): Promise<Response> {
  return handleLabEquipmentPost(context, id);
}
