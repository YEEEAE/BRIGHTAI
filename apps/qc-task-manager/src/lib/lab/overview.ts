// QC Laboratory Command Center queries (PROMPT 04, architecture contract §12).
//
// Every query here is READ-ONLY (SELECT) and fully parameterized (?) — no user
// input is interpolated into SQL text. This module powers the /lab page only;
// it is NOT the global dashboard and does not share its filters. All numbers
// are computed from the lab_* tables created by migrations 011–014 — nothing
// is seeded or invented, so a fresh install shows zero everywhere.
//
// Derived-state decisions (documented, smallest extension of the contract):
// - Calibration state is derived at read time from the LATEST calibration
//   record's due date (COALESCE(next_due_at, calibration_due_at)), never
//   stored. Per the contract: Due Soon = due within 30 days. NOT_COMPLIANT
//   requires interpreting the free-text `result` field and is deliberately
//   NOT derived here — it belongs to the calibration module (open decision).
// - "Equipment Requiring Attention" = non-archived equipment with an open
//   maintenance event (completed_date IS NULL) OR an overdue latest
//   calibration. Structural checks only — no status_raw text mapping (D-1).
// - "Documents Due for Review" = active documents whose review_due_date has
//   been reached (<= today). The separate "overdue" split belongs to the
//   documents module.
// - Data-quality counts are the informational checks from the page reference
//   §56 (missing lot/equipment/tester, incomplete samples, inconsistent
//   workflow, equipment/document/product master-data gaps). Counts only —
//   this module never mutates data.

import { getDb } from '../db';
import { localToday, resolveRange } from '../dashboard';
import { IMPLEMENTED_LAB_ROUTES } from './navigation';
import type { Role } from '../types';

/** Who is requesting the overview — used to scope rows to the same rule as the
 *  test register (testSearch.ts): employees see only their own tests, while
 *  supervisor/manager/admin see the full workspace. */
export interface LabOverviewScope {
  role: Role;
  userId: number;
}

/** Employee row scope — mirror of testSearch.ts scopeClause. */
function scopeClause(scope: LabOverviewScope): { sql: string; params: unknown[] } {
  if (scope.role === 'employee') {
    return { sql: '(t.tested_by = ? OR t.created_by = ?)', params: [scope.userId, scope.userId] };
  }
  return { sql: '', params: [] };
}

/** Due-soon window for derived calibration state (contract: ≤ 30 days). */
export const CALIBRATION_DUE_SOON_DAYS = 30;

export type LabCalibrationState = 'COMPLIANT' | 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE' | 'UNKNOWN';

/** Local ISO date offset from today by `days` (negative = earlier). */
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Derive the calibration UI state from a due date (YYYY-MM-DD or NULL).
 * UNKNOWN when there is no usable due date; DUE_TODAY beats OVERDUE/DUE_SOON.
 */
export function deriveCalibrationState(dueIso: string | null, today = localToday()): LabCalibrationState {
  if (!dueIso) return 'UNKNOWN';
  if (dueIso < today) return 'OVERDUE';
  if (dueIso === today) return 'DUE_TODAY';
  if (dueIso <= isoOffset(CALIBRATION_DUE_SOON_DAYS)) return 'DUE_SOON';
  return 'COMPLIANT';
}

/**
 * Latest calibration due date for each equipment row, as a scalar subquery
 * expression: `date(COALESCE(next_due_at, calibration_due_at))` of the most
 * recent record (by created_at, then id) or NULL when none exists.
 * Exported so other read-only modules (main dashboard integration) reuse the
 * exact same derivation rule.
 */
export const LATEST_DUE_SQL = `(
  SELECT date(COALESCE(c.next_due_at, c.calibration_due_at))
  FROM lab_equipment_calibration c
  WHERE c.equipment_id = e.id
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT 1
)`;

// ─────────────────────────────── KPI cards ───────────────────────────────

export interface LabKpis {
  tests_today: number;
  tests_this_week: number;
  draft_tests: number;
  awaiting_review: number;
  approved_tests: number;
  pass_tests: number;
  fail_tests: number;
  hold_tests: number;
  equipment_requiring_attention: number;
  calibration_due: number;
  documents_due_for_review: number;
  retests_open: number;
  data_quality_issues: number;
  pending_master_data_changes: number;
  contributor_changes_today: number;
  rejected_changes: number;
  changes_waiting_over_24h: number;
}

export interface WICatalogSummary {
  total: number;
  missing_content: number;
  draft_content: number;
  under_review: number;
  approved: number;
}

/** DB-backed WI catalog counters; no content/version rows are inferred. */
export function getWICatalogSummary(): WICatalogSummary {
  const row = getDb().prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN current_version_id IS NULL THEN 1 ELSE 0 END) AS missing_content,
      SUM(CASE WHEN current_version_id IS NOT NULL AND status = 'DRAFT' THEN 1 ELSE 0 END) AS draft_content,
      SUM(CASE WHEN current_version_id IS NOT NULL AND status = 'IN_REVIEW' THEN 1 ELSE 0 END) AS under_review,
      SUM(CASE WHEN current_version_id IS NOT NULL AND status = 'APPROVED' THEN 1 ELSE 0 END) AS approved
    FROM lab_documents
    WHERE type = 'WI'
  `).get() as Record<string, number | null>;
  return {
    total: Number(row.total ?? 0),
    missing_content: Number(row.missing_content ?? 0),
    draft_content: Number(row.draft_content ?? 0),
    under_review: Number(row.under_review ?? 0),
    approved: Number(row.approved ?? 0),
  };
}

export function getLabKpis(scope: LabOverviewScope): LabKpis {
  const db = getDb();
  const today = localToday();
  const { from: weekStart } = resolveRange('week');
  const employee = scopeClause(scope);
  const scopeSql = employee.sql ? `WHERE ${employee.sql}` : '';

  const tests = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN date(t.created_at, 'localtime') = date(?) THEN 1 ELSE 0 END), 0) AS tests_today,
         COALESCE(SUM(CASE WHEN date(t.created_at, 'localtime') >= date(?) THEN 1 ELSE 0 END), 0) AS tests_this_week,
         COALESCE(SUM(CASE WHEN t.status = 'DRAFT' THEN 1 ELSE 0 END), 0) AS draft_tests,
         COALESCE(SUM(CASE WHEN t.status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END), 0) AS awaiting_review,
         COALESCE(SUM(CASE WHEN t.status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS approved_tests,
         COALESCE(SUM(CASE WHEN t.status <> 'VOID' AND t.final_result = 'PASS' THEN 1 ELSE 0 END), 0) AS pass_tests,
         COALESCE(SUM(CASE WHEN t.status <> 'VOID' AND t.final_result = 'FAIL' THEN 1 ELSE 0 END), 0) AS fail_tests,
         COALESCE(SUM(CASE WHEN t.status <> 'VOID' AND t.final_result = 'HOLD' THEN 1 ELSE 0 END), 0) AS hold_tests
       FROM lab_test_records t
       ${scopeSql}`,
    )
    .get(today, weekStart, ...employee.params) as Omit<LabKpis, 'equipment_requiring_attention' | 'calibration_due' | 'documents_due_for_review' | 'retests_open' | 'data_quality_issues'>;

  // Equipment: attention = open maintenance OR overdue latest calibration.
  // Calibration due = due today or within the 30-day window (not overdue).
  const equipment = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN ${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} < date(?)
                                OR EXISTS (
                                  SELECT 1 FROM lab_equipment_maintenance m
                                  WHERE m.equipment_id = e.id AND m.completed_date IS NULL
                                ) THEN 1 ELSE 0 END), 0) AS attention,
         COALESCE(SUM(CASE WHEN ${LATEST_DUE_SQL} IS NOT NULL
                                AND ${LATEST_DUE_SQL} >= date(?)
                                AND ${LATEST_DUE_SQL} <= date(?) THEN 1 ELSE 0 END), 0) AS calibration_due
       FROM lab_equipment e
       WHERE e.is_archived = 0`,
    )
    .get(today, today, isoOffset(CALIBRATION_DUE_SOON_DAYS)) as { attention: number; calibration_due: number };

  const documents = db
    .prepare(
      `SELECT COUNT(*) AS due
       FROM lab_documents d
       WHERE d.status NOT IN ('SUPERSEDED', 'ARCHIVED')
         AND d.review_due_date IS NOT NULL
         AND date(d.review_due_date) <= date(?)`,
    )
    .get(today) as { due: number };

  const retests = db
    .prepare(`SELECT COUNT(*) AS open FROM lab_test_retests r WHERE r.status = 'OPEN'`)
    .get() as { open: number };

  const dataQuality = countLabDataQualityIssues();
  const changeScope = scope.role === 'employee' || scope.role === 'supervisor' ? ' AND requested_by = ?' : '';
  const changeParams = changeScope ? [scope.userId] : [];
  const changes = db.prepare(`SELECT
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
    SUM(CASE WHEN status = 'PENDING' AND created_at < datetime('now', '-1 day') THEN 1 ELSE 0 END) AS waiting,
    SUM(CASE WHEN status IN ('PENDING','APPROVED','REJECTED') AND date(created_at, 'localtime') = date('now', 'localtime') THEN 1 ELSE 0 END) AS today
    FROM lab_change_requests WHERE 1 = 1${changeScope}`).get(...changeParams) as { pending: number | null; rejected: number | null; waiting: number | null; today: number | null };

  return {
    tests_today: Number(tests.tests_today),
    tests_this_week: Number(tests.tests_this_week),
    draft_tests: Number(tests.draft_tests),
    awaiting_review: Number(tests.awaiting_review),
    approved_tests: Number(tests.approved_tests),
    pass_tests: Number(tests.pass_tests),
    fail_tests: Number(tests.fail_tests),
    hold_tests: Number(tests.hold_tests),
    equipment_requiring_attention: Number(equipment.attention),
    calibration_due: Number(equipment.calibration_due),
    documents_due_for_review: Number(documents.due),
    retests_open: Number(retests.open),
    data_quality_issues: dataQuality,
    pending_master_data_changes: Number(changes.pending ?? 0),
    contributor_changes_today: Number(changes.today ?? 0),
    rejected_changes: Number(changes.rejected ?? 0),
    changes_waiting_over_24h: Number(changes.waiting ?? 0),
  };
}

/**
 * Informational data-quality count (page reference §56). A test counts once
 * even with several gaps; equipment/document/product master-data gaps are
 * counted per row. Read-only — never mutates or "fixes" anything.
 */
export function countLabDataQualityIssues(): number {
  const db = getDb();

  const tests = db
    .prepare(
      `SELECT COUNT(*) AS issues
       FROM lab_test_records t
       WHERE t.status <> 'VOID' AND (
         (t.lot_number IS NULL OR TRIM(t.lot_number) = '')
         OR t.equipment_id IS NULL
         OR t.tested_by IS NULL
         OR (SELECT COUNT(*) FROM lab_test_samples s WHERE s.test_id = t.id) <> t.sample_count
         OR (t.status = 'APPROVED' AND t.final_result IS NULL)
         OR (t.status <> 'DRAFT' AND t.submitted_at IS NULL)
       )`,
    )
    .get() as { issues: number };

  const equipment = db
    .prepare(
      `SELECT COUNT(*) AS issues
       FROM lab_equipment e
       WHERE e.is_archived = 0 AND (
         (e.code IS NULL OR TRIM(e.code) = '')
         OR e.serial_number IS NULL
         OR e.location IS NULL
         OR ${LATEST_DUE_SQL} IS NULL
       )`,
    )
    .get() as { issues: number };

  const documents = db
    .prepare(
      `SELECT COUNT(*) AS issues
       FROM lab_documents d
       WHERE d.status NOT IN ('SUPERSEDED', 'ARCHIVED')
         AND NOT (d.type = 'WI' AND COALESCE(d.source_register_code, '') = 'F-4-2-1-2' AND d.current_version_id IS NULL)
         AND (
         d.owner_id IS NULL
         OR d.review_due_date IS NULL
         OR d.effective_date IS NULL
         OR d.current_version_id IS NULL
       )`,
    )
    .get() as { issues: number };

  const products = db
    .prepare(
      `SELECT COUNT(*) AS issues
       FROM lab_products p
       WHERE p.is_active = 1 AND (
         (p.code IS NULL OR TRIM(p.code) = '')
         OR p.default_test_type IS NULL
       )`,
    )
    .get() as { issues: number };

  return Number(tests.issues) + Number(equipment.issues) + Number(documents.issues) + Number(products.issues);
}

// ─────────────────────────────── Sections ───────────────────────────────

export interface LabRecentTestRow {
  id: number;
  test_number: string;
  test_type: string;
  product_name: string | null;
  lot_number: string | null;
  equipment_code: string | null;
  tester_name: string | null;
  final_result: string | null;
  status: string;
  updated_at: string;
}

export interface LabReturnedTestRow {
  id: number;
  test_number: string;
  test_type: string;
  final_result: string | null;
  updated_at: string;
}

/** Tests returned by review, scoped to the current employee's own work. */
export function getLabReturnedTests(scope: LabOverviewScope): LabReturnedTestRow[] {
  if (scope.role !== 'employee') return [];
  return getDb().prepare(`
    SELECT id, test_number, test_type, final_result, updated_at
    FROM lab_test_records
    WHERE status = 'REJECTED' AND (tested_by = ? OR created_by = ?)
    ORDER BY updated_at DESC, id DESC
    LIMIT 8
  `).all(scope.userId, scope.userId) as LabReturnedTestRow[];
}

export interface LabOwnedDocumentContentRow {
  id: number;
  code: string;
  title: string;
  status: string;
  has_content: number;
}

/** Employee-owned WI content, including catalog-only rows that need content. */
export function getLabOwnedWIContent(scope: LabOverviewScope): LabOwnedDocumentContentRow[] {
  if (scope.role !== 'employee') return [];
  return getDb().prepare(`
    SELECT d.id, d.code, d.title, d.status,
           CASE WHEN d.current_version_id IS NULL THEN 0 ELSE 1 END AS has_content
    FROM lab_documents d
    WHERE d.type = 'WI' AND (d.owner_id = ? OR d.created_by = ?)
      AND d.status NOT IN ('SUPERSEDED', 'ARCHIVED')
    ORDER BY has_content ASC, d.updated_at DESC, d.id DESC
    LIMIT 8
  `).all(scope.userId, scope.userId) as LabOwnedDocumentContentRow[];
}

/** Latest 8 tests, most recently updated first (employee-scoped). */
export function getLabRecentTests(scope: LabOverviewScope): LabRecentTestRow[] {
  const employee = scopeClause(scope);
  const scopeSql = employee.sql ? `WHERE ${employee.sql}` : '';
  return getDb()
    .prepare(
      `SELECT t.id, t.test_number, t.test_type, t.lot_number, t.final_result, t.status, t.updated_at,
              p.name AS product_name, e.code AS equipment_code, u.full_name AS tester_name
       FROM lab_test_records t
       LEFT JOIN lab_products p ON p.id = t.product_id
       LEFT JOIN lab_equipment e ON e.id = t.equipment_id
       LEFT JOIN users u ON u.id = t.tested_by
       ${scopeSql}
       ORDER BY t.updated_at DESC, t.id DESC
       LIMIT 8`,
    )
    .all(...employee.params) as LabRecentTestRow[];
}

export interface LabPendingReviewRow {
  id: number;
  test_number: string;
  test_type: string;
  tester_name: string | null;
  submitted_at: string;
  /** Whole days since submission (0 = today). */
  aging_days: number;
  final_result: string | null;
  status: string;
}

/** Tests awaiting a reviewer (SUBMITTED or UNDER_REVIEW), oldest first —
 *  employee-scoped to their own tests (the review queue itself is supervisor+,
 *  permissions.ts canReviewLabTest). */
export function getLabPendingReviews(scope: LabOverviewScope): LabPendingReviewRow[] {
  const employee = scopeClause(scope);
  const scopeSql = employee.sql ? `AND ${employee.sql}` : '';
  return getDb()
    .prepare(
      `SELECT t.id, t.test_number, t.test_type, t.submitted_at, t.final_result, t.status,
              u.full_name AS tester_name,
              CAST(julianday(datetime('now', 'localtime')) - julianday(t.submitted_at) AS INTEGER) AS aging_days
       FROM lab_test_records t
       LEFT JOIN users u ON u.id = t.tested_by
       WHERE t.status IN ('SUBMITTED', 'UNDER_REVIEW')
         ${scopeSql}
       ORDER BY t.submitted_at ASC, t.id ASC
       LIMIT 8`,
    )
    .all(...employee.params) as LabPendingReviewRow[];
}

export interface LabEquipmentAlertRow {
  id: number;
  equipment_name: string;
  code: string;
  status_raw: string;
  calibration_state: LabCalibrationState;
  /** First matching reason: 'overdue_calibration' or 'open_maintenance'. */
  alert: 'overdue_calibration' | 'open_maintenance';
  due_date: string | null;
}

/** Non-archived equipment with an open maintenance event or an overdue calibration. */
export function getLabEquipmentAlerts(): LabEquipmentAlertRow[] {
  const today = localToday();
  const rows = getDb()
    .prepare(
      `SELECT e.id, e.name AS equipment_name, e.code, e.status_raw, ${LATEST_DUE_SQL} AS due_date,
              CASE WHEN ${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} < date(?) THEN 1 ELSE 0 END AS overdue,
              EXISTS (SELECT 1 FROM lab_equipment_maintenance m
                      WHERE m.equipment_id = e.id AND m.completed_date IS NULL) AS open_maintenance
       FROM lab_equipment e
       WHERE e.is_archived = 0
         AND (
           ${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} < date(?)
           OR EXISTS (SELECT 1 FROM lab_equipment_maintenance m
                      WHERE m.equipment_id = e.id AND m.completed_date IS NULL)
         )
       ORDER BY due_date ASC, e.id ASC
       LIMIT 8`,
    )
    .all(today, today) as Array<{
    id: number;
    equipment_name: string;
    code: string;
    status_raw: string;
    due_date: string | null;
    overdue: number;
    open_maintenance: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    equipment_name: r.equipment_name,
    code: r.code,
    status_raw: r.status_raw,
    calibration_state: deriveCalibrationState(r.due_date, today),
    alert: r.overdue ? ('overdue_calibration' as const) : ('open_maintenance' as const),
    due_date: r.due_date,
  }));
}

export interface LabCalibrationAlertRow {
  id: number;
  equipment_name: string;
  code: string;
  due_date: string;
  calibration_state: LabCalibrationState;
}

/** Equipment whose latest calibration is due today, due soon, or overdue — most urgent first. */
export function getLabCalibrationAlerts(): LabCalibrationAlertRow[] {
  const today = localToday();
  const rows = getDb()
    .prepare(
      `SELECT e.id, e.name AS equipment_name, e.code, ${LATEST_DUE_SQL} AS due_date
       FROM lab_equipment e
       WHERE e.is_archived = 0
         AND ${LATEST_DUE_SQL} IS NOT NULL
         AND ${LATEST_DUE_SQL} <= date(?)
       ORDER BY due_date ASC, e.id ASC
       LIMIT 8`,
    )
    .all(isoOffset(CALIBRATION_DUE_SOON_DAYS)) as Array<{
    id: number;
    equipment_name: string;
    code: string;
    due_date: string;
  }>;

  return rows.map((r) => ({
    ...r,
    calibration_state: deriveCalibrationState(r.due_date, today),
  }));
}

export interface LabDocumentReviewRow {
  id: number;
  code: string;
  title: string;
  type: string;
  version: number | null;
  owner_name: string | null;
  review_due_date: string;
  status: string;
}

/** Active documents whose review date has been reached, most overdue first. */
export function getLabDocumentReviewsDue(): LabDocumentReviewRow[] {
  const today = localToday();
  return getDb()
    .prepare(
      `SELECT d.id, d.code, d.title, d.type, d.review_due_date, d.status,
              v.version, u.full_name AS owner_name
       FROM lab_documents d
       LEFT JOIN lab_document_versions v ON v.id = d.current_version_id
       LEFT JOIN users u ON u.id = d.owner_id
       WHERE d.status NOT IN ('SUPERSEDED', 'ARCHIVED')
         AND d.review_due_date IS NOT NULL
         AND date(d.review_due_date) <= date(?)
       ORDER BY d.review_due_date ASC, d.id ASC
       LIMIT 8`,
    )
    .all(today) as LabDocumentReviewRow[];
}

export interface LabOpenRetestRow {
  id: number;
  retest_number: string;
  original_test_number: string;
  product_name: string | null;
  reason: string;
  status: string;
  updated_at: string;
}

/** Open retests, most recently updated first (employee-scoped to retests of
 *  their own original tests). */
export function getLabOpenRetests(scope: LabOverviewScope): LabOpenRetestRow[] {
  const isEmployee = scope.role === 'employee';
  const scopeSql = isEmployee
    ? 'AND EXISTS (SELECT 1 FROM lab_test_records own WHERE own.id = r.original_test_id AND (own.tested_by = ? OR own.created_by = ?))'
    : '';
  const params = isEmployee ? [scope.userId, scope.userId] : [];
  return getDb()
    .prepare(
      `SELECT r.id, r.retest_number, r.reason, r.status, r.updated_at,
              t.test_number AS original_test_number, p.name AS product_name
       FROM lab_test_retests r
       JOIN lab_test_records t ON t.id = r.original_test_id
       LEFT JOIN lab_products p ON p.id = t.product_id
       WHERE r.status = 'OPEN'
         ${scopeSql}
       ORDER BY r.updated_at DESC, r.id DESC
       LIMIT 8`,
    )
    .all(...params) as LabOpenRetestRow[];
}

export interface LabActivityRow {
  id: number;
  entity_type: string;
  entity_id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  record_label: string | null;
  href: string | null;
  created_at: string;
}

/**
 * Latest 10 laboratory events from the ONE audit system (`qc_audit_log`,
 * extended by migration 011 with the LAB_* entity types). Read-only.
 * Employee scope: only events on their own tests (LAB_TEST entities they
 * tested/created) or retests of their tests — the lab-wide audit trail stays
 * supervisor+ (permissions.ts canViewLabAudit).
 */
export function getLabRecentActivity(scope: LabOverviewScope): LabActivityRow[] {
  const isEmployee = scope.role === 'employee';
  const scopeSql = isEmployee
    ? `AND (
         (a.entity_type = 'LAB_TEST' AND EXISTS (
           SELECT 1 FROM lab_test_records own WHERE own.id = a.entity_id
           AND (own.tested_by = ? OR own.created_by = ?)))
         OR
         (a.entity_type = 'LAB_RETEST' AND EXISTS (
           SELECT 1 FROM lab_test_retests r
           JOIN lab_test_records own ON own.id = r.original_test_id
           WHERE r.id = a.entity_id AND (own.tested_by = ? OR own.created_by = ?)))
       ) OR
         (a.entity_type = 'LAB_CHANGE_REQUEST' AND EXISTS (
           SELECT 1 FROM lab_change_requests cr WHERE cr.id = a.entity_id AND cr.requested_by = ?))`
    : '';
  const activityParams = isEmployee ? [scope.userId, scope.userId, scope.userId, scope.userId, scope.userId] : [];
  return getDb()
    .prepare(
      `SELECT a.id, a.entity_type, a.entity_id, a.action, a.created_at,
              u.full_name AS actor_name, u.role AS actor_role,
              CASE a.entity_type
                WHEN 'LAB_TEST' THEN (SELECT test_number FROM lab_test_records WHERE id = a.entity_id)
                WHEN 'LAB_RETEST' THEN (SELECT retest_number FROM lab_test_retests WHERE id = a.entity_id)
                WHEN 'LAB_CHANGE_REQUEST' THEN ('CR-' || a.entity_id)
                WHEN 'LAB_EQUIPMENT' THEN (SELECT code FROM lab_equipment WHERE id = a.entity_id)
                WHEN 'LAB_PRODUCT' THEN (SELECT code FROM lab_products WHERE id = a.entity_id)
                WHEN 'LAB_DOCUMENT' THEN (SELECT code FROM lab_documents WHERE id = a.entity_id)
              END AS record_label,
              CASE a.entity_type
                WHEN 'LAB_TEST' THEN '/lab/tests/' || a.entity_id
                WHEN 'LAB_RETEST' THEN '/lab/retests/' || a.entity_id
                WHEN 'LAB_CHANGE_REQUEST' THEN '/lab/change-requests/' || a.entity_id
                WHEN 'LAB_EQUIPMENT' THEN '/lab/equipment/' || a.entity_id
                WHEN 'LAB_PRODUCT' THEN '/lab/products/' || a.entity_id
                WHEN 'LAB_DOCUMENT' THEN '/lab/documents/' || a.entity_id
              END AS href
       FROM qc_audit_log a
       JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type LIKE 'LAB\_%' ESCAPE '\\'
         ${scopeSql}
       ORDER BY a.id DESC
       LIMIT 10`,
    )
    .all(...activityParams) as LabActivityRow[];
}

// ─────────────────────────── Drill-down registry ───────────────────────────

export interface LabDrilldown {
  /** Full href including filter params for the target list page. */
  href: string;
  /** Base route (path without query) — must exist before the link activates. */
  route: string;
  /** Shown while the target page is not implemented yet. */
  hint: string;
}

/**
 * KPI id → filtered list target. A drill-down renders as a real link only
 * when its route is in IMPLEMENTED_LAB_ROUTES (no dead links); otherwise the
 * card shows the number with a disabled hint. Later prompts add their route
 * to IMPLEMENTED_LAB_ROUTES and every matching KPI activates automatically.
 */
export const LAB_KPI_DRILLDOWNS: Record<keyof LabKpis, LabDrilldown> = {
  tests_today: { href: '/lab/tests?created=today', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  tests_this_week: { href: '/lab/tests?created=week', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  draft_tests: { href: '/lab/tests?status=DRAFT', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  awaiting_review: { href: '/lab/tests/review', route: '/lab/tests/review', hint: 'Opens the review queue (coming with the Tests module)' },
  approved_tests: { href: '/lab/tests?status=APPROVED', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  pass_tests: { href: '/lab/tests?result=PASS', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  fail_tests: { href: '/lab/tests?result=FAIL', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  hold_tests: { href: '/lab/tests?result=HOLD', route: '/lab/tests', hint: 'Opens with the test register (coming with the Tests module)' },
  equipment_requiring_attention: { href: '/lab/equipment?attention=1', route: '/lab/equipment', hint: 'Opens the equipment register (coming with the Equipment module)' },
  calibration_due: { href: '/lab/calibration?due=1', route: '/lab/calibration', hint: 'Opens the calibration register (coming with the Calibration module)' },
  documents_due_for_review: { href: '/lab/documents?review=due', route: '/lab/documents', hint: 'Opens the document library (coming with the Documents module)' },
  retests_open: { href: '/lab/retests?status=OPEN', route: '/lab/retests', hint: 'Opens the retest register (coming with the Retests module)' },
  data_quality_issues: { href: '/lab/data-quality', route: '/lab/data-quality', hint: 'Opens the Data Quality Center with per-record findings' },
  pending_master_data_changes: { href: '/lab/change-requests?status=PENDING', route: '/lab/change-requests', hint: 'Opens the contributor change queue' },
  contributor_changes_today: { href: '/lab/change-requests?today=1', route: '/lab/change-requests', hint: 'Opens contributor changes submitted today' },
  rejected_changes: { href: '/lab/change-requests?status=REJECTED', route: '/lab/change-requests', hint: 'Opens rejected contributor changes' },
  changes_waiting_over_24h: { href: '/lab/change-requests?aging=24h', route: '/lab/change-requests', hint: 'Opens contributor changes waiting over 24 hours' },
};

/** True when the drill-down's target page exists today. */
export function labDrilldownEnabled(drilldown: LabDrilldown): boolean {
  return IMPLEMENTED_LAB_ROUTES.includes(drilldown.route);
}
