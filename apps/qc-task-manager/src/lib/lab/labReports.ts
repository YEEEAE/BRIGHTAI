// Laboratory report readers (QC-LAB-ARCHITECTURE.md §13, contract lines 401-402).
//
// All 15 laboratory reports are rendered through the EXISTING reporting
// pipeline (`src/lib/reporting/`) — same endpoint, same writers, same audit.
// This module is the lab-shaped half: bounded, chunked SELECTs over the lab_*
// tables that yield one row as a `Cell[]` matching the catalog headers.
//
// Hard rules baked in:
//   * Metadata only. Snapshot JSON columns, document content, attachment
//     BLOBs, and session/token data are NEVER exported (§13 "no secrets").
//   * Every filter value is parameter-bound (? placeholders only) — the
//     ReportFilters shape is validated by parseReportFilters before use.
//   * Derived state, never stored state: calibration due date via the shared
//     LATEST_DUE_SQL expression; equipment display status via the canonical
//     equipmentStatus mapping; review-due windows computed from the date.
//   * Chunked iteration (LAB_REPORT_CHUNK_SIZE with a descending-id cursor)
//     for register tables, so a full export never loads the whole table.
//   * Employees never reach these readers — authorizeReport denies every lab
//     report type for the employee role (contract §13 RBAC: LAB_EXPORT ❌).

import { getDb } from '../db';
import { deriveCalibrationState } from './overview';
import { calibrationLabel, statusLabels } from './equipmentStatus';
import { runLabDataQualityChecks, labDataQualitySeverity, LAB_DATA_QUALITY_ISSUE_LABELS } from './dataQuality';
import { LAB_RESULT_LABELS, LAB_RETEST_REASON_LABELS, LAB_MAINTENANCE_STATUS_LABELS } from './policy';
import type { LabMaintenanceStatus, LabResultOption, LabRetestReason } from './policy';
import type { ReportFilters, ReportType } from '../reporting/types';
import { readLabRetentionStatus } from './retention';

export type ReportCell = string | number | null;
const LAB_REPORT_CHUNK_SIZE = 500;

/**
 * Allowlist for the lab `status` filter. It intentionally spans every lab
 * workflow family (test, document, acknowledgement, retest, maintenance) —
 * each reader applies only the statuses its own table can hold, and any
 * other value is rejected at parse time (never reaches a query).
 */
export const LAB_REPORT_STATUSES: readonly string[] = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'APPROVED', 'VOID',
  'IN_REVIEW', 'SUPERSEDED', 'ARCHIVED',
  'PENDING', 'ACKNOWLEDGED',
  'OPEN', 'COMPLETED',
  'PLANNED', 'IN_PROGRESS', 'CANCELLED',
];

/** Lab report filters shared by every lab reader (§13: filters respected). */
export interface LabReportFilterValues {
  from: string | null;
  to: string | null;
  result: 'PASS' | 'FAIL' | 'HOLD' | null;
  status: string | null;
  reason: LabRetestReason | null;
  product: number | null;
  equipment: number | null;
}

/** Project the shared ReportFilters shape into the lab filter values. */
export function toLabReportFilters(filters: ReportFilters): LabReportFilterValues {
  return {
    from: filters.from,
    to: filters.to,
    result: filters.result,
    status: filters.status,
    reason: filters.reason,
    product: filters.product,
    equipment: filters.equipment,
  };
}

interface Clause {
  sql: string;
  params: (string | number)[];
}

function dateRange(column: string, from: string | null, to: string | null): Clause {
  const sql: string[] = [];
  const params: (string | number)[] = [];
  if (from) {
    sql.push(`date(${column}) >= date(?)`);
    params.push(from);
  }
  if (to) {
    sql.push(`date(${column}) <= date(?)`);
    params.push(to);
  }
  return sql.length ? { sql: sql.join(' AND '), params } : { sql: '1 = 1', params: [] };
}

function allClauses(clauses: Clause[]): { sql: string; params: (string | number)[] } {
  const parts = clauses.filter((c) => c.sql !== '1 = 1');
  if (parts.length === 0) return { sql: '1 = 1', params: [] };
  return { sql: parts.map((c) => `(${c.sql})`).join(' AND '), params: parts.flatMap((c) => c.params) };
}

function boolLabel(value: number | boolean | null | undefined): string {
  return value ? 'Yes' : 'No';
}

// ── Test-based reports (1-6) ─────────────────────────────────────────────
// One shared query shape: the test register with type/result/product/
// equipment/status filters and a created_at date range. The three register
// variants differ only by the forced test_type.

const TEST_SELECT = `
  SELECT t.id, t.test_number, t.test_type, t.lot_number, t.sample_count,
         t.final_result, t.status, t.created_at,
         p.name AS product_name, e.name AS equipment_name,
         tester.full_name AS tested_by_name, reviewer.full_name AS reviewed_by_name, approver.full_name AS approved_by_name
  FROM lab_test_records t
  LEFT JOIN lab_products p ON p.id = t.product_id
  LEFT JOIN lab_equipment e ON e.id = t.equipment_id
  LEFT JOIN users tester ON tester.id = t.tested_by
  LEFT JOIN users reviewer ON reviewer.id = t.reviewed_by
  LEFT JOIN users approver ON approver.id = t.approved_by`;

function testRegisterWhere(filters: LabReportFilterValues, forcedType: 'air' | 'vacuum' | null): { sql: string; params: (string | number)[] } {
  return allClauses([
    dateRange('t.created_at', filters.from, filters.to),
    forcedType ? { sql: 't.test_type = ?', params: [forcedType] } : { sql: '1 = 1', params: [] },
    filters.result ? { sql: 't.final_result = ?', params: [filters.result] } : { sql: '1 = 1', params: [] },
    filters.status ? { sql: 't.status = ?', params: [filters.status] } : { sql: '1 = 1', params: [] },
    filters.product ? { sql: 't.product_id = ?', params: [filters.product] } : { sql: '1 = 1', params: [] },
    filters.equipment ? { sql: 't.equipment_id = ?', params: [filters.equipment] } : { sql: '1 = 1', params: [] },
  ]);
}

function* yieldTestRegisterRows(reportId: string, rows: Record<string, ReportCell>[]): Generator<readonly ReportCell[]> {
  for (const row of rows) {
    yield [
      reportId,
      row.test_number,
      String(row.test_type).toUpperCase(),
      row.product_name,
      row.equipment_name,
      row.lot_number,
      row.sample_count,
      row.final_result ? (LAB_RESULT_LABELS[row.final_result as LabResultOption] ?? String(row.final_result)) : null,
      row.status,
      row.tested_by_name,
      row.created_at,
      row.reviewed_by_name,
      row.approved_by_name,
    ];
  }
}

export function* readLabTestRegister(reportId: string, filters: LabReportFilterValues, forcedType: 'air' | 'vacuum' | null): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = testRegisterWhere(filters, forcedType);
    const sql = cursor === null
      ? `${TEST_SELECT} WHERE ${where.sql} ORDER BY t.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `${TEST_SELECT} WHERE ${where.sql} AND t.id < ? ORDER BY t.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    yield* yieldTestRegisterRows(reportId, rows);
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// PASS/FAIL/HOLD — approved decisions only (a final result is a human
// decision recorded at approval; drafts without a result carry nothing).
export function* readLabResultsReport(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      { sql: `t.status = 'APPROVED' AND t.final_result IS NOT NULL`, params: [] },
      dateRange('t.created_at', filters.from, filters.to),
      filters.result ? { sql: 't.final_result = ?', params: [filters.result] } : { sql: '1 = 1', params: [] },
      filters.product ? { sql: 't.product_id = ?', params: [filters.product] } : { sql: '1 = 1', params: [] },
      filters.equipment ? { sql: 't.equipment_id = ?', params: [filters.equipment] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `${TEST_SELECT} WHERE ${where.sql} ORDER BY t.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `${TEST_SELECT} WHERE ${where.sql} AND t.id < ? ORDER BY t.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        row.test_number,
        String(row.test_type).toUpperCase(),
        row.final_result ? (LAB_RESULT_LABELS[row.final_result as LabResultOption] ?? String(row.final_result)) : null,
        row.status,
        row.product_name,
        row.lot_number,
        row.approved_by_name,
        row.created_at,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// Retest register — retests are tracked separately; originals are never
// overwritten (D-5). The original/new test numbers are resolved by join.
export function* readLabRetestReport(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      dateRange('r.created_at', filters.from, filters.to),
      filters.reason ? { sql: 'r.reason = ?', params: [filters.reason] } : { sql: '1 = 1', params: [] },
      filters.status ? { sql: 'r.status = ?', params: [filters.status] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `SELECT r.id, r.retest_number, r.reason, r.status, r.original_result, r.created_at,
                orig.test_number AS original_test_number, next.test_number AS new_test_number,
                creator.full_name AS created_by_name
         FROM lab_test_retests r
         JOIN lab_test_records orig ON orig.id = r.original_test_id
         LEFT JOIN lab_test_records next ON next.id = r.new_test_id
         LEFT JOIN users creator ON creator.id = r.created_by
         WHERE ${where.sql} ORDER BY r.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT r.id, r.retest_number, r.reason, r.status, r.original_result, r.created_at,
                orig.test_number AS original_test_number, next.test_number AS new_test_number,
                creator.full_name AS created_by_name
         FROM lab_test_retests r
         JOIN lab_test_records orig ON orig.id = r.original_test_id
         LEFT JOIN lab_test_records next ON next.id = r.new_test_id
         LEFT JOIN users creator ON creator.id = r.created_by
         WHERE ${where.sql} AND r.id < ? ORDER BY r.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        row.retest_number,
        row.original_test_number,
        row.new_test_number,
        LAB_RETEST_REASON_LABELS[row.reason as LabRetestReason] ?? String(row.reason),
        row.status,
        row.original_result,
        row.created_by_name,
        row.created_at,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// Product test history — one product's full test history (product filter is
// mandatory; the report is meaningless without a subject product).
export function* readLabProductHistory(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  if (!filters.product) return;
  const db = getDb();
  const productName = db.prepare('SELECT name FROM lab_products WHERE id = ?').get(filters.product) as { name: string } | undefined;
  if (!productName) return;
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      { sql: 't.product_id = ?', params: [filters.product] },
      dateRange('t.created_at', filters.from, filters.to),
      filters.result ? { sql: 't.final_result = ?', params: [filters.result] } : { sql: '1 = 1', params: [] },
      filters.status ? { sql: 't.status = ?', params: [filters.status] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `SELECT t.id, t.test_number, t.test_type, t.lot_number, t.final_result, t.status, t.created_at, tester.full_name AS tested_by_name
         FROM lab_test_records t LEFT JOIN users tester ON tester.id = t.tested_by
         WHERE ${where.sql} ORDER BY t.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT t.id, t.test_number, t.test_type, t.lot_number, t.final_result, t.status, t.created_at, tester.full_name AS tested_by_name
         FROM lab_test_records t LEFT JOIN users tester ON tester.id = t.tested_by
         WHERE ${where.sql} AND t.id < ? ORDER BY t.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        productName.name,
        row.test_number,
        String(row.test_type).toUpperCase(),
        row.lot_number,
        row.final_result ? (LAB_RESULT_LABELS[row.final_result as LabResultOption] ?? String(row.final_result)) : null,
        row.status,
        row.tested_by_name,
        row.created_at,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// ── Equipment reports (7-9) ───────────────────────────────────────────────

// Equipment register — raw status values are canonical business data and are
// never rewritten; the display label comes from the equipmentStatus mapping.
export function* readLabEquipmentRegister(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      dateRange('e.created_at', filters.from, filters.to),
      filters.equipment ? { sql: 'e.id = ?', params: [filters.equipment] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `SELECT e.id, e.code, e.name, e.location, e.status_raw, e.calibration_status_raw, e.serial_number, e.is_archived, e.created_at
         FROM lab_equipment e WHERE ${where.sql} ORDER BY e.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT e.id, e.code, e.name, e.location, e.status_raw, e.calibration_status_raw, e.serial_number, e.is_archived, e.created_at
         FROM lab_equipment e WHERE ${where.sql} AND e.id < ? ORDER BY e.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        row.code,
        row.name,
        row.location,
        statusLabels(row.status_raw == null ? null : String(row.status_raw)),
        calibrationLabel(row.calibration_status_raw == null ? null : String(row.calibration_status_raw)),
        row.serial_number,
        boolLabel(row.is_archived as number | boolean | null),
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// Equipment calibration — one row per calibration record. The due date is
// derived (COALESCE next_due_at, calibration_due_at) and the UI state comes
// from deriveCalibrationState — calibration state is NEVER stored.
export function* readLabCalibrationReport(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      dateRange('c.created_at', filters.from, filters.to),
      filters.equipment ? { sql: 'c.equipment_id = ?', params: [filters.equipment] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `SELECT c.id, c.last_calibrated_at, c.provider, c.certificate_reference, c.result, c.created_at,
                e.code AS equipment_code, e.name AS equipment_name,
                date(COALESCE(c.next_due_at, c.calibration_due_at)) AS due_date
         FROM lab_equipment_calibration c JOIN lab_equipment e ON e.id = c.equipment_id
         WHERE ${where.sql} ORDER BY c.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT c.id, c.last_calibrated_at, c.provider, c.certificate_reference, c.result, c.created_at,
                e.code AS equipment_code, e.name AS equipment_name,
                date(COALESCE(c.next_due_at, c.calibration_due_at)) AS due_date
         FROM lab_equipment_calibration c JOIN lab_equipment e ON e.id = c.equipment_id
         WHERE ${where.sql} AND c.id < ? ORDER BY c.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      const dueIso = row.due_date == null ? null : String(row.due_date);
      yield [
        reportId,
        row.equipment_code,
        row.equipment_name,
        row.last_calibrated_at,
        deriveCalibrationState(dueIso),
        row.provider,
        row.certificate_reference,
        row.result,
        row.created_at,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// Equipment maintenance — one row per maintenance record, status mapped to
// the canonical maintenance label.
export function* readLabMaintenanceReport(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      dateRange('m.created_at', filters.from, filters.to),
      filters.equipment ? { sql: 'm.equipment_id = ?', params: [filters.equipment] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `SELECT m.id, m.maintenance_date, m.issue, m.maintenance_type, m.technician_vendor, m.status, m.completed_date,
                e.code AS equipment_code, e.name AS equipment_name
         FROM lab_equipment_maintenance m JOIN lab_equipment e ON e.id = m.equipment_id
         WHERE ${where.sql} ORDER BY m.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT m.id, m.maintenance_date, m.issue, m.maintenance_type, m.technician_vendor, m.status, m.completed_date,
                e.code AS equipment_code, e.name AS equipment_name
         FROM lab_equipment_maintenance m JOIN lab_equipment e ON e.id = m.equipment_id
         WHERE ${where.sql} AND m.id < ? ORDER BY m.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      const statusLabel = row.status == null ? null : (LAB_MAINTENANCE_STATUS_LABELS[row.status as LabMaintenanceStatus] ?? String(row.status));
      yield [
        reportId,
        row.equipment_code,
        row.equipment_name,
        row.maintenance_date,
        row.issue,
        row.maintenance_type,
        row.technician_vendor,
        statusLabel,
        row.completed_date,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// ── Controlled document reports (10-13) ──────────────────────────────────
// Document CONTENT is never exported — identity, workflow state, dates, and
// people only. This mirrors the register exports' "metadata only" rule.

const DOCUMENT_SELECT = `
  SELECT d.id, d.code, d.title, d.type, d.status, d.effective_date, d.review_due_date,
         owner.full_name AS owner_name, reviewer.full_name AS reviewer_name, approver.full_name AS approver_name,
         (SELECT v.version FROM lab_document_versions v WHERE v.id = d.current_version_id) AS current_version
  FROM lab_documents d
  LEFT JOIN users owner ON owner.id = d.owner_id
  LEFT JOIN users reviewer ON reviewer.id = d.reviewer_id
  LEFT JOIN users approver ON approver.id = d.approver_id`;

function* yieldDocumentRegisterRows(reportId: string, rows: Record<string, ReportCell>[]): Generator<readonly ReportCell[]> {
  for (const row of rows) {
    yield [
      reportId,
      row.code,
      row.title,
      row.current_version,
      row.status,
      row.owner_name,
      row.reviewer_name,
      row.approver_name,
      row.effective_date,
      row.review_due_date,
    ];
  }
}

function* readLabDocumentRegister(reportId: string, docType: 'SOP' | 'WI', filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      { sql: 'd.type = ?', params: [docType] },
      dateRange('d.created_at', filters.from, filters.to),
      filters.status ? { sql: 'd.status = ?', params: [filters.status] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `${DOCUMENT_SELECT} WHERE ${where.sql} ORDER BY d.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `${DOCUMENT_SELECT} WHERE ${where.sql} AND d.id < ? ORDER BY d.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    yield* yieldDocumentRegisterRows(reportId, rows);
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

export function* readLabSopRegister(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  yield* readLabDocumentRegister(reportId, 'SOP', filters);
}

export function* readLabWiRegister(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  yield* readLabDocumentRegister(reportId, 'WI', filters);
}

// Document review due — ACTIVE documents (SUPERSEDED/ARCHIVED excluded) whose
// review date is within 30 days or overdue. The window is derived from the
// date at read time, never stored.
export function* readLabDocReviewDue(reportId: string, _filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const sql = cursor === null
      ? `SELECT d.id, d.code, d.title, d.type, d.status, d.review_due_date,
                CAST(julianday(d.review_due_date) - julianday('now','localtime') AS INTEGER) AS days_until
         FROM lab_documents d
         WHERE d.status NOT IN ('SUPERSEDED','ARCHIVED') AND d.review_due_date IS NOT NULL
           AND date(d.review_due_date) <= date('now','localtime','+30 days')
         ORDER BY d.review_due_date ASC, d.id ASC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT d.id, d.code, d.title, d.type, d.status, d.review_due_date,
                CAST(julianday(d.review_due_date) - julianday('now','localtime') AS INTEGER) AS days_until
         FROM lab_documents d
         WHERE d.status NOT IN ('SUPERSEDED','ARCHIVED') AND d.review_due_date IS NOT NULL
           AND date(d.review_due_date) <= date('now','localtime','+30 days')
           AND (date(d.review_due_date), d.id) > (SELECT date(review_due_date), id FROM lab_documents WHERE id = ?)
         ORDER BY d.review_due_date ASC, d.id ASC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? [] : [cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      const days = row.days_until == null ? null : Number(row.days_until);
      const window = days == null ? null : days < 0 ? 'Overdue' : days === 0 ? 'Due Today' : days <= 7 ? 'Due within 7 days' : days <= 15 ? 'Due within 15 days' : 'Due within 30 days';
      yield [
        reportId,
        row.code,
        row.title,
        row.type,
        row.review_due_date,
        days,
        window,
        row.status,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// Document acknowledgements — assignments and completion state. The document
// content is never part of this export.
export function* readLabAcknowledgements(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      dateRange('a.assigned_at', filters.from, filters.to),
      filters.status ? { sql: 'a.status = ?', params: [filters.status] } : { sql: '1 = 1', params: [] },
    ]);
    const sql = cursor === null
      ? `SELECT a.id, a.assigned_at, a.acknowledged_at, a.status,
                d.code AS document_code, v.version, assignee.full_name AS assignee_name
         FROM lab_document_acknowledgements a
         JOIN lab_document_versions v ON v.id = a.document_version_id
         JOIN lab_documents d ON d.id = v.document_id
         LEFT JOIN users assignee ON assignee.id = a.user_id
         WHERE ${where.sql} ORDER BY a.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT a.id, a.assigned_at, a.acknowledged_at, a.status,
                d.code AS document_code, v.version, assignee.full_name AS assignee_name
         FROM lab_document_acknowledgements a
         JOIN lab_document_versions v ON v.id = a.document_version_id
         JOIN lab_documents d ON d.id = v.document_id
         LEFT JOIN users assignee ON assignee.id = a.user_id
         WHERE ${where.sql} AND a.id < ? ORDER BY a.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        row.document_code,
        row.version,
        row.assignee_name,
        row.assigned_at,
        row.acknowledged_at,
        row.status,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// ── Laboratory activity + data quality (14-15) ───────────────────────────

// Laboratory activity — the single qc_audit_log table is the only activity
// system. Lab events are entity_type LIKE 'LAB\_%' (same derivation as the
// lab overview's recent activity feed).
export function* readLabActivityReport(reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    const where = allClauses([
      { sql: `a.entity_type LIKE 'LAB\\_%' ESCAPE '\\'`, params: [] },
      dateRange('a.created_at', filters.from, filters.to),
    ]);
    const sql = cursor === null
      ? `SELECT a.id, a.entity_type, a.entity_id, a.action, a.created_at, u.full_name AS actor_name
         FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
         WHERE ${where.sql} ORDER BY a.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`
      : `SELECT a.id, a.entity_type, a.entity_id, a.action, a.created_at, u.full_name AS actor_name
         FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
         WHERE ${where.sql} AND a.id < ? ORDER BY a.id DESC LIMIT ${LAB_REPORT_CHUNK_SIZE}`;
    const rows = db.prepare(sql).all(...(cursor === null ? where.params : [...where.params, cursor])) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        row.created_at,
        row.entity_type,
        row.entity_id,
        row.action,
        row.actor_name,
      ];
    }
    if (rows.length < LAB_REPORT_CHUNK_SIZE) return;
  }
}

// Data quality — a snapshot of the read-only detectors (dataQuality.ts).
// The detectors themselves never mutate anything; this report only exposes
// the issue list the Data Quality page already shows. Bounded by the
// detectors' own queries (each scans the live tables once).
export function* readLabDataQualityReport(reportId: string): Generator<readonly ReportCell[]> {
  const report = runLabDataQualityChecks();
  const groups = [
    { label: 'Tests', issues: report.tests },
    { label: 'Equipment', issues: report.equipment },
    { label: 'Documents', issues: report.documents },
    { label: 'Products', issues: report.products },
  ];
  for (const group of groups) {
    for (const issue of group.issues) {
      yield [
        reportId,
        group.label,
        LAB_DATA_QUALITY_ISSUE_LABELS[issue.kind],
        labDataQualitySeverity(issue.kind) === 'danger' ? 'Integrity' : 'Informational',
        issue.record,
        issue.detail,
        issue.href,
      ];
    }
  }
}

// ── Report form options ──────────────────────────────────────────────────
// Small bounded lookups for the /lab/reports filter form (product/equipment
// dropdowns). Read-only, id+display columns only.

export function listLabProductsForReports(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_products WHERE is_active = 1 ORDER BY name ASC LIMIT 500')
    .all() as Array<{ id: number; name: string; code: string }>;
}

export function listLabEquipmentForReports(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_equipment WHERE is_archived = 0 ORDER BY name ASC LIMIT 500')
    .all() as Array<{ id: number; name: string; code: string }>;
}

// ── Dispatcher ────────────────────────────────────────────────────────────

/** Yield every row for a lab report. The caller (reader.ts) already verified
 *  the type is a lab type via isLabReportType. */
export function* readLabReportRows(reportType: ReportType, reportId: string, filters: LabReportFilterValues): Generator<readonly ReportCell[]> {
  switch (reportType) {
    case 'lab-test-register':
      yield* readLabTestRegister(reportId, filters, null);
      break;
    case 'lab-test-register-air':
      yield* readLabTestRegister(reportId, filters, 'air');
      break;
    case 'lab-test-register-vacuum':
      yield* readLabTestRegister(reportId, filters, 'vacuum');
      break;
    case 'lab-results':
      yield* readLabResultsReport(reportId, filters);
      break;
    case 'lab-retests':
      yield* readLabRetestReport(reportId, filters);
      break;
    case 'lab-product-history':
      yield* readLabProductHistory(reportId, filters);
      break;
    case 'lab-equipment-register':
      yield* readLabEquipmentRegister(reportId, filters);
      break;
    case 'lab-calibration':
      yield* readLabCalibrationReport(reportId, filters);
      break;
    case 'lab-maintenance':
      yield* readLabMaintenanceReport(reportId, filters);
      break;
    case 'lab-sop-register':
      yield* readLabSopRegister(reportId, filters);
      break;
    case 'lab-wi-register':
      yield* readLabWiRegister(reportId, filters);
      break;
    case 'lab-doc-review-due':
      yield* readLabDocReviewDue(reportId, filters);
      break;
    case 'lab-acknowledgements':
      yield* readLabAcknowledgements(reportId, filters);
      break;
    case 'lab-activity':
      yield* readLabActivityReport(reportId, filters);
      break;
    case 'lab-data-quality':
      yield* readLabDataQualityReport(reportId);
      break;
    case 'lab-retention-status':
      yield* readLabRetentionStatus(reportId, filters);
      break;
  }
}
