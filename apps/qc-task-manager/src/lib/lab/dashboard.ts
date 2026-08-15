// QC Laboratory integration with the main dashboard (PROMPT 28).
//
// The main /dashboard page gains a Laboratory section from this module —
// counts and chart datasets only, all READ-ONLY SELECTs, fully parameterized
// (?). Nothing here mutates lab_* tables. The numbers reuse the same derived
// rules as the Lab Command Center (overview.ts):
//
//   * Calibration state is derived at read time from the LATEST calibration
//     record's due date (never stored). Attention = OVERDUE + DUE_TODAY +
//     DUE_SOON (i.e. anything inside the 30-day window or past it);
//     compliant = COMPLIANT. UNKNOWN rows are shown in the chart only.
//   * Equipment status buckets map the VERBATIM status_raw Arabic/English
//     tokens via equipmentStatus.ts (the ONE display mapping place). A
//     compound value classifies once, by priority: Under Maintenance >
//     New > In Use > unused (Not In Use / Done / unmapped raw values).
//   * PASS/FAIL/HOLD counts exclude VOID records, exactly like the Command
//     Center KPIs.
//   * Data Quality is the open-issue total from the Data Quality Center
//     detectors (informational, read-only).
//
// Drill-down: every count maps to an EXISTING filtered /lab/* register route
// (LAB_DASHBOARD_DRILLDOWNS). All those routes are in IMPLEMENTED_LAB_ROUTES
// today, so every link is live — no dead drill-downs.

import { getDb } from '../db';
import { localToday, last8Weeks } from '../dashboard';
import { parseDbDate } from '../format';
import { CALIBRATION_DUE_SOON_DAYS, LATEST_DUE_SQL, deriveCalibrationState, type LabCalibrationState } from './overview';
import { runLabDataQualityChecks } from './dataQuality';
import { statusMatchesLabel } from './equipmentStatus';
import { LAB_RETEST_REASONS, LAB_RETEST_REASON_LABELS, type LabRetestReason } from './policy';

// ─────────────────────────────── Chart slices ───────────────────────────────

export interface LabChartSlice {
  key: string;
  label: string;
  color: string;
  count: number;
}

export interface LabWeekPoint {
  weekStart: string;
  label: string;
  count: number;
}

export interface LabDashboardData {
  tests: {
    total: number;
    air: number;
    vacuum: number;
    draft: number;
    submitted: number;
    under_review: number;
    approved: number;
    rejected: number;
    void: number;
  };
  results: { pass: number; fail: number; hold: number };
  equipment: {
    active: number;
    fresh: number;
    maintenance: number;
    unused: number;
    calibration_attention: number;
    calibration_compliant: number;
    by_status: LabChartSlice[];
    by_calibration: LabChartSlice[];
  };
  documents: {
    sop: number;
    wi: number;
    draft: number;
    in_review: number;
    approved: number;
    superseded: number;
    archived: number;
    review_due: number;
    ack_pending: number;
    by_status: LabChartSlice[];
  };
  retests: {
    total: number;
    open: number;
    completed: number;
    by_reason: LabChartSlice[];
  };
  data_quality_open: number;
  charts: {
    tests_by_week: LabWeekPoint[];
    tests_by_type: LabChartSlice[];
    results: LabChartSlice[];
  };
}

// ─────────────────────────────── Helpers ───────────────────────────────

/** Monday 00:00 of the week containing `d` (local time). */
function startOfWeekLocal(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (copy.getDay() + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const REASON_COLORS: Record<LabRetestReason, string> = {
  FAIL: '#ef4444',
  HOLD: '#f59e0b',
  SAMPLE_ISSUE: '#0ea5e9',
  EQUIPMENT_ISSUE: '#8b5cf6',
  PROCEDURAL_ISSUE: '#f97316',
  OTHER: '#94a3b8',
};

// ─────────────────────────────── Tests + results ───────────────────────────────

function getTestCounts() {
  const rows = getDb()
    .prepare(`SELECT t.status, COUNT(*) AS n FROM lab_test_records t GROUP BY t.status`)
    .all() as Array<{ status: string; n: number }>;
  const by = new Map(rows.map((r) => [r.status, Number(r.n)]));
  const pick = (s: string) => by.get(s) ?? 0;
  const total = [...by.values()].reduce((sum, n) => sum + n, 0);
  return {
    total,
    draft: pick('DRAFT'),
    submitted: pick('SUBMITTED'),
    under_review: pick('UNDER_REVIEW'),
    approved: pick('APPROVED'),
    rejected: pick('REJECTED'),
    void: pick('VOID'),
  };
}

function getTypeCounts() {
  const rows = getDb()
    .prepare(`SELECT t.test_type, COUNT(*) AS n FROM lab_test_records t GROUP BY t.test_type`)
    .all() as Array<{ test_type: string; n: number }>;
  const by = new Map(rows.map((r) => [r.test_type, Number(r.n)]));
  return { air: by.get('air') ?? 0, vacuum: by.get('vacuum') ?? 0 };
}

/** PASS/FAIL/HOLD on non-VOID records (voiding must not skew the result mix). */
function getResultCounts() {
  const rows = getDb()
    .prepare(
      `SELECT t.final_result, COUNT(*) AS n
       FROM lab_test_records t
       WHERE t.status <> 'VOID' AND t.final_result IS NOT NULL
       GROUP BY t.final_result`,
    )
    .all() as Array<{ final_result: string; n: number }>;
  const by = new Map(rows.map((r) => [r.final_result, Number(r.n)]));
  return { pass: by.get('PASS') ?? 0, fail: by.get('FAIL') ?? 0, hold: by.get('HOLD') ?? 0 };
}

/** Tests created per week — last 8 weeks, current week last. */
function getTestsByWeek(): LabWeekPoint[] {
  const weeks = last8Weeks();
  const windowStart = weeks[0].weekStart;
  const rows = getDb()
    .prepare(
      `SELECT t.created_at FROM lab_test_records t
       WHERE date(t.created_at, 'localtime') >= date(?)`,
    )
    .all(windowStart) as Array<{ created_at: string }>;

  const index = new Map(weeks.map((w, i) => [w.weekStart, i]));
  for (const r of rows) {
    const d = parseDbDate(r.created_at);
    if (!d) continue;
    const i = index.get(isoDay(startOfWeekLocal(d)));
    if (i !== undefined) weeks[i].count += 1;
  }
  return weeks;
}

// ─────────────────────────────── Equipment ───────────────────────────────

type EquipmentBucket = 'active' | 'fresh' | 'maintenance' | 'unused';

/** Classify a verbatim status_raw via the display mapping (priority order). */
function classifyEquipmentStatus(raw: string | null): EquipmentBucket {
  if (statusMatchesLabel(raw, 'Under Maintenance')) return 'maintenance';
  if (statusMatchesLabel(raw, 'New')) return 'fresh';
  if (statusMatchesLabel(raw, 'In Use')) return 'active';
  return 'unused'; // Not In Use / Done / unmapped raw values
}

function getEquipmentCounts() {
  const db = getDb();

  const statusRows = db
    .prepare(
      `SELECT e.status_raw, COUNT(*) AS n FROM lab_equipment e WHERE e.is_archived = 0 GROUP BY e.status_raw`,
    )
    .all() as Array<{ status_raw: string | null; n: number }>;

  const buckets: Record<EquipmentBucket, number> = { active: 0, fresh: 0, maintenance: 0, unused: 0 };
  for (const r of statusRows) buckets[classifyEquipmentStatus(r.status_raw)] += Number(r.n);

  // Calibration state per non-archived equipment, derived at read time from
  // the latest calibration record's due date (never stored).
  const calRows = db
    .prepare(
      `SELECT e.id, ${LATEST_DUE_SQL} AS due_date FROM lab_equipment e WHERE e.is_archived = 0`,
    )
    .all() as Array<{ id: number; due_date: string | null }>;

  const today = localToday();
  const cal: Record<LabCalibrationState, number> = {
    COMPLIANT: 0,
    DUE_SOON: 0,
    DUE_TODAY: 0,
    OVERDUE: 0,
    UNKNOWN: 0,
  };
  for (const r of calRows) cal[deriveCalibrationState(r.due_date, today)] += 1;
  // Attention = due today, within the 30-day window, or already overdue.
  const attention = cal.OVERDUE + cal.DUE_TODAY + cal.DUE_SOON;

  const by_status: LabChartSlice[] = [
    { key: 'active', label: 'In Use', color: '#10b981', count: buckets.active },
    { key: 'fresh', label: 'New', color: '#0ea5e9', count: buckets.fresh },
    { key: 'maintenance', label: 'Under Maintenance', color: '#f59e0b', count: buckets.maintenance },
    { key: 'unused', label: 'Not In Use', color: '#94a3b8', count: buckets.unused },
  ];

  const by_calibration: LabChartSlice[] = [
    { key: 'compliant', label: 'Compliant', color: '#10b981', count: cal.COMPLIANT },
    { key: 'due_soon', label: `Due within ${CALIBRATION_DUE_SOON_DAYS} days`, color: '#f59e0b', count: cal.DUE_SOON },
    { key: 'due_today', label: 'Due today', color: '#fb923c', count: cal.DUE_TODAY },
    { key: 'overdue', label: 'Overdue', color: '#ef4444', count: cal.OVERDUE },
    { key: 'unknown', label: 'No calibration record', color: '#cbd5e1', count: cal.UNKNOWN },
  ];

  return {
    active: buckets.active,
    fresh: buckets.fresh,
    maintenance: buckets.maintenance,
    unused: buckets.unused,
    calibration_attention: attention,
    calibration_compliant: cal.COMPLIANT,
    by_status,
    by_calibration,
  };
}

// ─────────────────────────────── Documents ───────────────────────────────

function getDocumentCounts() {
  const db = getDb();
  const today = localToday();

  const typeRows = db
    .prepare(`SELECT d.type, COUNT(*) AS n FROM lab_documents d GROUP BY d.type`)
    .all() as Array<{ type: string; n: number }>;
  const byType = new Map(typeRows.map((r) => [r.type, Number(r.n)]));

  const statusRows = db
    .prepare(`SELECT d.status, COUNT(*) AS n FROM lab_documents d GROUP BY d.status`)
    .all() as Array<{ status: string; n: number }>;
  const byStatus = new Map(statusRows.map((r) => [r.status, Number(r.n)]));
  const pick = (s: string) => byStatus.get(s) ?? 0;

  const reviewDue = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM lab_documents d
         WHERE d.status NOT IN ('SUPERSEDED', 'ARCHIVED')
           AND d.review_due_date IS NOT NULL
           AND date(d.review_due_date) <= date(?)`,
      )
      .get(today) as { n: number }
  ).n;

  const ackPending = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM lab_document_acknowledgements WHERE status = 'PENDING'`)
      .get() as { n: number }
  ).n;

  const by_status: LabChartSlice[] = [
    { key: 'draft', label: 'Draft', color: '#94a3b8', count: pick('DRAFT') },
    { key: 'in_review', label: 'In Review', color: '#0ea5e9', count: pick('IN_REVIEW') },
    { key: 'approved', label: 'Approved', color: '#10b981', count: pick('APPROVED') },
    { key: 'superseded', label: 'Superseded', color: '#8b5cf6', count: pick('SUPERSEDED') },
    { key: 'archived', label: 'Archived', color: '#64748b', count: pick('ARCHIVED') },
  ];

  return {
    sop: byType.get('SOP') ?? 0,
    wi: byType.get('WI') ?? 0,
    draft: pick('DRAFT'),
    in_review: pick('IN_REVIEW'),
    approved: pick('APPROVED'),
    superseded: pick('SUPERSEDED'),
    archived: pick('ARCHIVED'),
    review_due: Number(reviewDue),
    ack_pending: Number(ackPending),
    by_status,
  };
}

// ─────────────────────────────── Retests ───────────────────────────────

function getRetestCounts() {
  const db = getDb();

  const statusRows = db
    .prepare(`SELECT r.status, COUNT(*) AS n FROM lab_test_retests r GROUP BY r.status`)
    .all() as Array<{ status: string; n: number }>;
  const byStatus = new Map(statusRows.map((r) => [r.status, Number(r.n)]));

  const reasonRows = db
    .prepare(`SELECT r.reason, COUNT(*) AS n FROM lab_test_retests r GROUP BY r.reason`)
    .all() as Array<{ reason: string; n: number }>;
  const byReason = new Map(reasonRows.map((r) => [r.reason, Number(r.n)]));

  const by_reason: LabChartSlice[] = LAB_RETEST_REASONS.map((reason) => ({
    key: reason,
    label: LAB_RETEST_REASON_LABELS[reason],
    color: REASON_COLORS[reason],
    count: byReason.get(reason) ?? 0,
  }));

  const total = [...byStatus.values()].reduce((sum, n) => sum + n, 0);
  return {
    total,
    open: byStatus.get('OPEN') ?? 0,
    completed: byStatus.get('COMPLETED') ?? 0,
    by_reason,
  };
}

// ─────────────────────────────── Aggregate ───────────────────────────────

/** Full read-only laboratory dataset for the main dashboard. Never mutates. */
export function getLabDashboardData(): LabDashboardData {
  const db = getDb();

  const statusCounts = getTestCounts();
  const typeCounts = getTypeCounts();
  const resultCounts = getResultCounts();
  const equipment = getEquipmentCounts();
  const documents = getDocumentCounts();
  const retests = getRetestCounts();
  const dataQuality = runLabDataQualityChecks();

  const tests_by_type: LabChartSlice[] = [
    { key: 'air', label: 'AIR', color: '#0ea5e9', count: typeCounts.air },
    { key: 'vacuum', label: 'VACUUM', color: '#6366f1', count: typeCounts.vacuum },
  ];

  const results: LabChartSlice[] = [
    { key: 'pass', label: 'PASS', color: '#10b981', count: resultCounts.pass },
    { key: 'fail', label: 'FAIL', color: '#ef4444', count: resultCounts.fail },
    { key: 'hold', label: 'HOLD', color: '#f59e0b', count: resultCounts.hold },
  ];

  return {
    tests: { ...statusCounts, ...typeCounts },
    results: resultCounts,
    equipment,
    documents,
    retests,
    data_quality_open: dataQuality.total,
    charts: {
      tests_by_week: getTestsByWeek(),
      tests_by_type,
      results,
    },
  };
}

// ─────────────────────────────── Drill-downs ───────────────────────────────

/**
 * KPI id → filtered /lab/* register route. Every target is an IMPLEMENTED
 * route (verified in navigation.ts), so all drill-downs render as live links.
 */
export const LAB_DASHBOARD_DRILLDOWNS: Record<string, string> = {
  // Tests
  lab_total_tests: '/lab/tests',
  lab_tests_air: '/lab/tests?type=air',
  lab_tests_vacuum: '/lab/tests?type=vacuum',
  lab_tests_draft: '/lab/tests?status=DRAFT',
  lab_tests_submitted: '/lab/tests?status=SUBMITTED',
  lab_tests_under_review: '/lab/tests?status=UNDER_REVIEW',
  lab_tests_approved: '/lab/tests?status=APPROVED',
  lab_tests_rejected: '/lab/tests?status=REJECTED',
  lab_tests_void: '/lab/tests?status=VOID',
  // Results
  lab_result_pass: '/lab/tests?result=PASS',
  lab_result_fail: '/lab/tests?result=FAIL',
  lab_result_hold: '/lab/tests?result=HOLD',
  // Equipment (status param = display label from equipmentStatus.ts)
  lab_equipment_active: '/lab/equipment?status=In Use',
  lab_equipment_new: '/lab/equipment?status=New',
  lab_equipment_maintenance: '/lab/equipment?status=Under Maintenance',
  lab_equipment_unused: '/lab/equipment?status=Not In Use',
  lab_calibration_attention: '/lab/calibration?due=1',
  lab_calibration_compliant: '/lab/calibration',
  // Documents
  lab_doc_sop: '/lab/documents?type=SOP',
  lab_doc_wi: '/lab/documents?type=WI',
  lab_doc_draft: '/lab/documents?status=DRAFT',
  lab_doc_review: '/lab/documents?status=IN_REVIEW',
  lab_doc_approved: '/lab/documents?status=APPROVED',
  lab_doc_superseded: '/lab/documents?status=SUPERSEDED',
  lab_doc_archived: '/lab/documents?status=ARCHIVED',
  lab_doc_review_due: '/lab/documents?review=due',
  lab_ack_pending: '/lab/acknowledgements?status=PENDING',
  // Retests
  lab_retests_total: '/lab/retests',
  lab_retests_open: '/lab/retests?status=OPEN',
  lab_retests_completed: '/lab/retests?status=COMPLETED',
  lab_retests_reason_FAIL: '/lab/retests?reason=FAIL',
  lab_retests_reason_HOLD: '/lab/retests?reason=HOLD',
  lab_retests_reason_SAMPLE_ISSUE: '/lab/retests?reason=SAMPLE_ISSUE',
  lab_retests_reason_EQUIPMENT_ISSUE: '/lab/retests?reason=EQUIPMENT_ISSUE',
  lab_retests_reason_PROCEDURAL_ISSUE: '/lab/retests?reason=PROCEDURAL_ISSUE',
  lab_retests_reason_OTHER: '/lab/retests?reason=OTHER',
  // Data quality
  lab_data_quality: '/lab/data-quality',
};
