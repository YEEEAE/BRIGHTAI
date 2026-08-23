// QC Laboratory Review Center (PROMPT 07, /lab/tests/review).
//
// One reviewer queue, four actions, and the approval-time immutable snapshot
// write. It reuses the EXISTING infrastructure — it does not build a second
// workflow engine:
//   - state machine     → lab_test_records.status (migration 012)
//   - authorization     → canReviewLabTestRecord / canApproveLabTestRecord
//                         (permissions.ts — hard invariants live there)
//   - audit             → qc_audit_log (extended CHECK in migration 011)
//   - notifications     → createNotification (existing engine)
//
// Lifecycle the four actions drive (page reference §21–§22):
//   start_review       SUBMITTED            → UNDER_REVIEW
//   request_changes    SUBMITTED|UNDER_REVIEW → REJECTED  (reason required)
//   reject             SUBMITTED|UNDER_REVIEW → REJECTED  (reason required)
//   approve            SUBMITTED|UNDER_REVIEW → APPROVED  (immutable + snapshots)
//
// The Reviewer queue is scoped to what the requesting user can actually act
// on: they never see their own tests (a tester can never review/approve their
// own test — hard invariant #1). Approval writes the immutable historical
// snapshots (equipment/document/product/template) inside the same transaction
// so an approved record stays historically correct (§23, §28, §35, §44).

import { getDb, transaction } from '../db';
import { createNotification, type NotificationKind } from '../notifications';
import { deriveCalibrationState } from './overview';
import { completeLabRetestsForApproval } from './retests';
import { esignAuditNote } from './esignature';
import { canApproveLabTestRecord, canReviewLabTestRecord } from '../permissions';
import { appendQcAudit } from '../audit/qcChain';
import type { LabFinalResult, LabTestStatus, LabTestType, Role } from '../types';

/** Minimal record shape the can*LabTestRecord predicates need (matches permissions.ts). */
interface LabTestAuth {
  status: LabTestStatus;
  tested_by: number | null;
  reviewed_by: number | null;
  created_by: number;
}

/** Aging threshold for the "Aging" summary card and the default age filter. */
export const LAB_REVIEW_AGING_DAYS = 2;
/** Age filter options (minimum age in days since submission). */
export const LAB_REVIEW_AGE_OPTIONS = [1, 2, 3, 5, 7] as const;

/** The four review actions a reviewer/approver can perform (§26). */
export type LabReviewAction = 'start_review' | 'request_changes' | 'reject' | 'approve';

export const LAB_REVIEW_ACTION_LABELS: Record<LabReviewAction, string> = {
  start_review: 'Start Review',
  request_changes: 'Request Changes',
  reject: 'Reject',
  approve: 'Approve',
};

/** The audit action recorded per review action (extended qc_audit_log CHECK). */
const AUDIT_ACTION: Record<LabReviewAction, string> = {
  start_review: 'STATUS_TRANSITION',
  request_changes: 'REQUEST_CHANGES',
  reject: 'REJECTION',
  approve: 'APPROVAL',
};

/** Notification kind stored on the existing notifications table (contract §11). */
const NOTIFICATION_KIND: Record<LabReviewAction, NotificationKind> = {
  start_review: 'lab_test_review_started',
  request_changes: 'lab_test_changes_requested',
  reject: 'lab_test_rejected',
  approve: 'lab_test_approved',
};

const NOTIFICATION_TITLE: Record<LabReviewAction, string> = {
  start_review: 'Test under review',
  request_changes: 'Changes requested',
  reject: 'Test rejected',
  approve: 'Test approved',
};

function ageExpression(alias: string): string {
  // submitted_at is stored in UTC (datetime('now')); applying 'localtime' on
  // both sides yields elapsed LOCAL days. Never negative for a submitted test
  // (clamped via MAX(0, …) so a just-submitted test reads 0 days old).
  const expr = `CAST(MAX(0, CAST((julianday('now','localtime') - julianday(COALESCE(t.submitted_at, t.created_at),'localtime')) AS INTEGER)) AS INTEGER)`;
  return alias ? `${expr} AS ${alias}` : expr;
}

// ─────────────────────────────── Summary cards ───────────────────────────────
// Five counts over the reviewer queue (the current user's own tests excluded —
// they cannot act on them). Used by the /lab/tests/review header cards (§26).

export interface LabReviewSummary {
  awaiting_review: number;
  aging: number;
  hold: number;
  rejected: number;
  approved_today: number;
}

/**
 * The five Review Center summary counts. `scope` is the requesting reviewer;
 * their own tests are excluded from every card because a tester can never
 * review/approve their own test (hard invariant #1).
 */
export function labReviewSummary(scope: { userId: number }): LabReviewSummary {
  const row = getDb()
    .prepare(
      `SELECT
         SUM(CASE WHEN t.status = 'SUBMITTED' THEN 1 ELSE 0 END) AS awaiting_review,
         SUM(CASE WHEN t.status IN ('SUBMITTED','UNDER_REVIEW')
                    AND ${ageExpression('')} >= ? THEN 1 ELSE 0 END) AS aging,
         SUM(CASE WHEN t.status IN ('SUBMITTED','UNDER_REVIEW') AND t.final_result = 'HOLD'
                  THEN 1 ELSE 0 END) AS hold,
         SUM(CASE WHEN t.status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN t.status = 'APPROVED'
                    AND date(t.approved_at,'localtime') = date('now','localtime')
                  THEN 1 ELSE 0 END) AS approved_today
       FROM lab_test_records t
       WHERE t.tested_by <> ? AND t.created_by <> ?`,
    )
    .get(LAB_REVIEW_AGING_DAYS, scope.userId, scope.userId) as Record<string, number | null>;
  return {
    awaiting_review: Number(row.awaiting_review ?? 0),
    aging: Number(row.aging ?? 0),
    hold: Number(row.hold ?? 0),
    rejected: Number(row.rejected ?? 0),
    approved_today: Number(row.approved_today ?? 0),
  };
}

// ─────────────────────────────── Queue search ────────────────────────────────
// Server-side filtering/pagination mirroring src/lib/lab/testSearch.ts: the URL
// is the source of truth, every value is a bound parameter, and sorting is
// constrained to a whitelist (no injection).

export type LabReviewSortField =
  | 'id'
  | 'test_number'
  | 'test_type'
  | 'product'
  | 'tester'
  | 'submitted_at'
  | 'age'
  | 'result'
  | 'status';

export const LAB_REVIEW_SORT_FIELDS: readonly LabReviewSortField[] = [
  'id',
  'test_number',
  'test_type',
  'product',
  'tester',
  'submitted_at',
  'age',
  'result',
  'status',
];

export const DEFAULT_LAB_REVIEW_SORT: LabReviewSortField = 'submitted_at';
export const DEFAULT_LAB_REVIEW_DIR: 'asc' | 'desc' = 'asc';
export const LAB_REVIEW_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_REVIEW_PER_PAGE = 25;

export interface LabReviewFilters {
  test_type: LabTestType | null;
  tester_id: number | null;
  product_id: number | null;
  lot: string | null;
  submitted_from: string | null;
  submitted_to: string | null;
  result: LabFinalResult | null;
  /** Minimum age in days (0 = any). */
  age_days: number | null;
  /** null = the active queue (SUBMITTED + UNDER_REVIEW); a value pins one status. */
  status: LabTestStatus | null;
  sort: LabReviewSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_REVIEW_FILTERS: LabReviewFilters = {
  test_type: null,
  tester_id: null,
  product_id: null,
  lot: null,
  submitted_from: null,
  submitted_to: null,
  result: null,
  age_days: null,
  status: null,
  sort: DEFAULT_LAB_REVIEW_SORT,
  dir: DEFAULT_LAB_REVIEW_DIR,
  page: 1,
  per_page: DEFAULT_LAB_REVIEW_PER_PAGE,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isReviewSortField(v: string): v is LabReviewSortField {
  return (LAB_REVIEW_SORT_FIELDS as readonly string[]).includes(v);
}

function isPerPage(v: number): v is (typeof LAB_REVIEW_PER_PAGE_OPTIONS)[number] {
  return (LAB_REVIEW_PER_PAGE_OPTIONS as readonly number[]).includes(v);
}

function isStatus(v: string): v is LabTestStatus {
  return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'APPROVED', 'VOID'].includes(v);
}

function isResult(v: string): v is LabFinalResult {
  return v === 'PASS' || v === 'FAIL' || v === 'HOLD';
}

/**
 * Parse + validate the /lab/tests/review query params. Invalid values are
 * dropped silently (the page has no per-field flash for these). Never throws.
 */
export function parseLabReviewFilters(url: URL): LabReviewFilters {
  const f: LabReviewFilters = { ...NO_LAB_REVIEW_FILTERS };
  const sp = url.searchParams;

  const type = sp.get('type');
  if (type && (type === 'air' || type === 'vacuum')) f.test_type = type;

  const tester = sp.get('tester');
  if (tester) {
    const id = positiveInt(tester);
    if (id !== null) f.tester_id = id;
  }

  const product = sp.get('product');
  if (product) {
    const id = positiveInt(product);
    if (id !== null) f.product_id = id;
  }

  const lot = sp.get('lot');
  if (lot && lot.trim() !== '') f.lot = lot.trim().slice(0, 200);

  const fromRaw = sp.get('from');
  const toRaw = sp.get('to');
  if (fromRaw && isValidDate(fromRaw)) f.submitted_from = fromRaw;
  if (toRaw && isValidDate(toRaw)) f.submitted_to = toRaw;
  if (f.submitted_from && f.submitted_to && f.submitted_from > f.submitted_to) {
    f.submitted_from = null;
    f.submitted_to = null;
  }

  const result = sp.get('result');
  if (result && isResult(result)) f.result = result;

  const age = sp.get('age');
  if (age) {
    const n = Number(age);
    if (Number.isInteger(n) && n >= 0 && n <= 365) f.age_days = n;
  }

  const status = sp.get('status');
  if (status && isStatus(status)) f.status = status;

  const sort = sp.get('sort');
  if (sort && isReviewSortField(sort)) f.sort = sort;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;

  const page = sp.get('page');
  if (page) {
    const n = positiveInt(page);
    if (n !== null) f.page = n;
  }
  const per = sp.get('per');
  if (per) {
    const n = positiveInt(per);
    if (n !== null && isPerPage(n)) f.per_page = n;
  }

  return f;
}

/** True when any review filter is active (drives the "Reset" affordance). */
export function hasLabReviewFilters(f: LabReviewFilters): boolean {
  return Boolean(
    f.test_type ||
      f.tester_id !== null ||
      f.product_id !== null ||
      f.lot ||
      f.submitted_from ||
      f.submitted_to ||
      f.result ||
      f.age_days !== null ||
      f.status !== null,
  );
}

/** Rebuild the querystring for the current review filters (sort/page/export). */
export function labReviewFiltersToQuery(f: LabReviewFilters): string {
  const sp = new URLSearchParams();
  if (f.test_type) sp.set('type', f.test_type);
  if (f.tester_id !== null) sp.set('tester', String(f.tester_id));
  if (f.product_id !== null) sp.set('product', String(f.product_id));
  if (f.lot) sp.set('lot', f.lot);
  if (f.submitted_from) sp.set('from', f.submitted_from);
  if (f.submitted_to) sp.set('to', f.submitted_to);
  if (f.result) sp.set('result', f.result);
  if (f.age_days !== null) sp.set('age', String(f.age_days));
  if (f.status) sp.set('status', f.status);
  if (f.sort !== DEFAULT_LAB_REVIEW_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_REVIEW_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_REVIEW_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** Parameterized WHERE for the review queue. Exported for unit tests. */
export function buildLabReviewWhere(f: LabReviewFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (f.test_type) {
    conds.push('t.test_type = ?');
    params.push(f.test_type);
  }
  if (f.tester_id !== null) {
    conds.push('t.tested_by = ?');
    params.push(f.tester_id);
  }
  if (f.product_id !== null) {
    conds.push('t.product_id = ?');
    params.push(f.product_id);
  }
  if (f.lot) {
    conds.push("t.lot_number LIKE ? ESCAPE '\\'");
    params.push(`%${f.lot.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
  }
  if (f.submitted_from) {
    conds.push("date(t.submitted_at,'localtime') >= date(?)");
    params.push(f.submitted_from);
  }
  if (f.submitted_to) {
    conds.push("date(t.submitted_at,'localtime') <= date(?)");
    params.push(f.submitted_to);
  }
  if (f.result) {
    conds.push('t.final_result = ?');
    params.push(f.result);
  }
  if (f.age_days !== null && f.age_days > 0) {
    conds.push(`${ageExpression('')} >= ?`);
    params.push(f.age_days);
  }
  if (f.status) {
    conds.push('t.status = ?');
    params.push(f.status);
  } else {
    conds.push("t.status IN ('SUBMITTED','UNDER_REVIEW')");
  }

  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

const REVIEW_SORT_SQL: Record<LabReviewSortField, string> = {
  id: 't.id',
  test_number: 't.test_number COLLATE NOCASE',
  test_type: 't.test_type',
  product: 'p.name COLLATE NOCASE',
  tester: 'u.full_name COLLATE NOCASE',
  submitted_at: 't.submitted_at',
  age: ageExpression(''),
  result:
    "CASE t.final_result WHEN 'PASS' THEN 1 WHEN 'FAIL' THEN 2 WHEN 'HOLD' THEN 3 ELSE 4 END",
  status:
    "CASE t.status WHEN 'SUBMITTED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'REJECTED' THEN 3 WHEN 'APPROVED' THEN 4 ELSE 5 END",
};

function reviewOrderClause(f: LabReviewFilters): string {
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${REVIEW_SORT_SQL[f.sort]} ${dir}, t.id DESC`;
}

export interface LabReviewRow {
  id: number;
  test_number: string;
  test_type: string;
  lot_number: string | null;
  final_result: string | null;
  status: string;
  submitted_at: string | null;
  age_days: number;
  product_name: string | null;
  product_code: string | null;
  tester_name: string | null;
  tested_by: number | null;
  reviewed_by: number | null;
  created_by: number;
}

const REVIEW_SELECT = `SELECT t.id, t.test_number, t.test_type, t.lot_number, t.final_result,
       t.status, t.submitted_at, ${ageExpression('age_days')},
       t.tested_by, t.reviewed_by, t.created_by,
       p.name AS product_name, p.code AS product_code, u.full_name AS tester_name
FROM lab_test_records t
LEFT JOIN lab_products p ON p.id = t.product_id
LEFT JOIN users u ON u.id = t.tested_by`;

export interface LabReviewResult {
  rows: LabReviewRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Paged, filtered review queue. The requesting reviewer's own tests are
 * excluded (they can never act on their own test). All SQL is parameterized.
 */
export async function searchReviewQueue(
  f: LabReviewFilters,
  scope: { userId: number },
): Promise<LabReviewResult> {
  const db = await getReviewDb();
  const where = buildLabReviewWhere(f);
  const conds = [where.sql.replace(/^WHERE /, '')];
  const params = [...where.params];
  conds.push('t.tested_by <> ? AND t.created_by <> ?');
  params.push(scope.userId, scope.userId);
  const merged = `WHERE ${conds.join(' AND ')}`;

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS n FROM lab_test_records t ${merged}`)
    .get(...params) as { n: number };
  const total = Number(totalRow.n);

  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;

  const rows = db
    .prepare(`${REVIEW_SELECT} ${merged} ${reviewOrderClause(f)} LIMIT ? OFFSET ?`)
    .all(...params, f.per_page, offset) as LabReviewRow[];

  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

/** Lazy getDb — keeps this module importable without a bundler/loader. */
async function getReviewDb() {
  const { getDb } = await import('../db');
  return getDb();
}

/** Testers present on reviewable tests (filter dropdown). */
export async function listReviewTesters(): Promise<{ id: number; full_name: string }[]> {
  const db = await getReviewDb();
  return db
    .prepare(
      `SELECT DISTINCT u.id, u.full_name
       FROM lab_test_records t JOIN users u ON u.id = t.tested_by
       WHERE t.status IN ('SUBMITTED','UNDER_REVIEW','REJECTED','APPROVED')
       ORDER BY u.full_name COLLATE NOCASE ASC`,
    )
    .all() as { id: number; full_name: string }[];
}

/** Products present on reviewable tests (filter dropdown). */
export async function listReviewProducts(): Promise<{ id: number; name: string; code: string }[]> {
  const db = await getReviewDb();
  return db
    .prepare(
      `SELECT DISTINCT p.id, p.name, p.code
       FROM lab_test_records t JOIN lab_products p ON p.id = t.product_id
       WHERE t.status IN ('SUBMITTED','UNDER_REVIEW','REJECTED','APPROVED')
       ORDER BY p.name COLLATE NOCASE ASC`,
    )
    .all() as { id: number; name: string; code: string }[];
}

// ─────────────────────────────── Transitions ────────────────────────────────
// One transaction per action: authorize, transition, write approval snapshots,
// audit, and notify. There is no second workflow engine — this is the single
// mutation point for the Review Center.

export interface LabReviewTransition {
  test_id: number;
  test_number: string;
  status: LabTestStatus;
  action: LabReviewAction;
}

/**
 * Apply a review action. `user` is the actor; `reason` is required by the
 * caller for reject/request_changes (also enforced by labReviewActionSchema).
 * Throws Error on any rule violation so the API handler can surface it.
 */
export function transitionLabTest(
  user: { id: number; role: Role },
  action: LabReviewAction,
  testId: number,
  reason: string | null,
  opts?: { esigned?: boolean },
): LabReviewTransition {
  return transaction(() => {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM lab_test_records WHERE id = ?')
      .get(testId) as Record<string, unknown> | undefined;
    if (!row) throw new Error('Test not found.');

    const test: LabTestAuth = {
      status: row.status as LabTestStatus,
      tested_by: row.tested_by == null ? null : Number(row.tested_by),
      reviewed_by: row.reviewed_by == null ? null : Number(row.reviewed_by),
      created_by: Number(row.created_by),
    };
    const testNumber = String(row.test_number);

    // Every action requires a non-terminal reviewable state.
    if (test.status !== 'SUBMITTED' && test.status !== 'UNDER_REVIEW') {
      throw new Error(`Test ${testNumber} is not awaiting review (current status: ${test.status}).`);
    }

    // Authorization — hard invariants enforced here (tester can never review/
    // approve their own test; supervisor denied from approval by default D-4).
    if (action === 'approve') {
      if (!canApproveLabTestRecord(user, test)) {
        throw new Error('You do not have permission to approve this test.');
      }
    } else if (!canReviewLabTestRecord(user, test)) {
      throw new Error('You do not have permission to review this test.');
    }

    // Reject / request changes always carry a reason (§22).
    if ((action === 'reject' || action === 'request_changes') && !reason) {
      throw new Error('A reason is required to reject or request changes.');
    }

    const dbNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (action === 'start_review') {
      db.prepare(
        `UPDATE lab_test_records
         SET status = 'UNDER_REVIEW', reviewed_by = ?, reviewed_at = ?, updated_at = ?
         WHERE id = ?`,
      ).run(user.id, dbNow, dbNow, testId);
    } else if (action === 'approve') {
      // Approval freezes the record + writes immutable historical snapshots in
      // the SAME transaction (§23). No silent mutation of approved data.
      writeLabTestSnapshots(db, testId, testNumber);
      // Sample rows reach their terminal status BEFORE the record flips to
      // APPROVED — migration 020 triggers freeze lab_test_samples entirely
      // once the parent test is APPROVED, so this ordering is required.
      db.prepare(
        `UPDATE lab_test_samples
         SET status = 'APPROVED', updated_at = ?
         WHERE test_id = ? AND status <> 'APPROVED'`,
      ).run(dbNow, testId);
      db.prepare(
        `UPDATE lab_test_records
         SET status = 'APPROVED', approved_by = ?, approved_at = ?, updated_at = ?
         WHERE id = ?`,
      ).run(user.id, dbNow, dbNow, testId);
      // Retest completion (§46): when the approved test is a retest's
      // execution record, the retest moves OPEN → COMPLETED in the SAME
      // transaction, with a LAB_RETEST/APPROVAL audit row for the completion.
      completeLabRetestsForApproval(db, testId, testNumber, user.id, dbNow);
    } else {
      // reject / request_changes → REJECTED with the required reason.
      db.prepare(
        `UPDATE lab_test_records
         SET status = 'REJECTED', reviewed_by = ?, reviewed_at = ?, rejected_reason = ?, updated_at = ?
         WHERE id = ?`,
      ).run(user.id, dbNow, reason, dbNow, testId);
    }

    // Audit every transition (§61) — the shared qc_audit_log, never a second log.
    appendQcAudit(db, { entityType: 'LAB_TEST', entityId: testId, actorId: user.id, action: AUDIT_ACTION[action], oldValue: test.status, newValue: action === 'approve' ? 'APPROVED' : action === 'start_review' ? 'UNDER_REVIEW' : 'REJECTED', note: action === 'approve' && opts?.esigned ? esignAuditNote(reason) : reason });

    // Notify the tester (reuse the existing notification engine). taskId stays
    // null (lab events are not tasks); entity_href carries the real record link
    // so the bell and /lab/notifications open the source test (migration 022).
    const recipient = test.tested_by ?? test.created_by;
    if (recipient) {
      createNotification({
        userId: recipient,
        taskId: null,
        type: NOTIFICATION_KIND[action],
        title: NOTIFICATION_TITLE[action],
        message:
          action === 'approve'
            ? `${testNumber} was approved.`
            : action === 'start_review'
              ? `${testNumber} is now under review.`
              : action === 'request_changes'
                ? `${testNumber} was returned for changes: ${reason ?? ''}`
                : `${testNumber} was rejected: ${reason ?? ''}`,
        actorId: user.id,
        href: `/lab/tests/${testId}`,
      });
    }

    const newStatus: LabTestStatus =
      action === 'approve' ? 'APPROVED' : action === 'start_review' ? 'UNDER_REVIEW' : 'REJECTED';
    return { test_id: testId, test_number: testNumber, status: newStatus, action };
  });
}

/**
 * Write the immutable approval-time snapshots inside the approval transaction
 * (§23). Equipment identity + calibration, SOP/WI references, and the product
 * /template JSON snapshots are frozen as of approval so historical approved
 * records never drift when master data changes (§28, §35, §44). Parameters are
 * already snapshotted at submission (parameters_snapshot_json) — untouched here.
 */
function writeLabTestSnapshots(
  db: ReturnType<typeof getDb>,
  testId: number,
  testNumber: string,
): void {
  const row = db
    .prepare('SELECT * FROM lab_test_records WHERE id = ?')
    .get(testId) as Record<string, unknown>;

  // ── Equipment + calibration snapshot ──
  const equipmentId = row.equipment_id == null ? null : Number(row.equipment_id);
  if (equipmentId !== null) {
    const eq = db
      .prepare(
        `SELECT e.id, e.name, e.code, e.serial_number, e.location,
                (SELECT date(COALESCE(c.next_due_at, c.calibration_due_at))
                 FROM lab_equipment_calibration c WHERE c.equipment_id = e.id
                 ORDER BY c.created_at DESC, c.id DESC LIMIT 1) AS calibration_due,
                (SELECT c.certificate_reference FROM lab_equipment_calibration c
                 WHERE c.equipment_id = e.id ORDER BY c.created_at DESC, c.id DESC LIMIT 1) AS calibration_reference
         FROM lab_equipment e WHERE e.id = ?`,
      )
      .get(equipmentId) as
      | { id: number; name: string; code: string; serial_number: string | null; location: string | null; calibration_due: string | null; calibration_reference: string | null }
      | undefined;
    if (eq) {
      const today = new Date();
      const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      db.prepare(
        `INSERT INTO lab_test_equipment_snapshots
           (test_id, equipment_id, equipment_name, equipment_code, serial_number, location, calibration_state, calibration_reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        testId,
        eq.id,
        eq.name,
        eq.code,
        eq.serial_number,
        eq.location,
        deriveCalibrationState(eq.calibration_due, isoToday),
        eq.calibration_reference,
      );
    }
  }

  // ── SOP/WI document snapshots ──
  const docRoles: Array<[string, number | null]> = [
    ['SOP', row.sop_version_id == null ? null : Number(row.sop_version_id)],
    ['WI', row.wi_version_id == null ? null : Number(row.wi_version_id)],
  ];
  const insertDoc = db.prepare(
    `INSERT INTO lab_test_document_snapshots
       (test_id, role, document_id, document_code, document_type, version_number, title)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const [role, versionId] of docRoles) {
    if (versionId === null) continue;
    const doc = db
      .prepare(
        `SELECT d.id AS document_id, d.code AS document_code, d.type AS document_type,
                v.version AS version_number, d.title
         FROM lab_document_versions v
         LEFT JOIN lab_documents d ON d.id = v.document_id
         WHERE v.id = ?`,
      )
      .get(versionId) as
      | { document_id: number | null; document_code: string | null; document_type: string | null; version_number: number | null; title: string | null }
      | undefined;
    if (!doc) continue;
    insertDoc.run(
      testId,
      role,
      doc.document_id,
      doc.document_code,
      doc.document_type,
      doc.version_number,
      doc.title,
    );
  }

  // ── Product snapshot (JSON on the record) ──
  const productId = row.product_id == null ? null : Number(row.product_id);
  if (productId !== null) {
    const p = db.prepare('SELECT name, code, connector_type FROM lab_products WHERE id = ?').get(productId) as
      | { name: string; code: string; connector_type: string | null }
      | undefined;
    if (p) {
      db.prepare('UPDATE lab_test_records SET product_snapshot_json = ? WHERE id = ?').run(
        JSON.stringify({ product_name: p.name, product_code: p.code, connector_type: p.connector_type }),
        testId,
      );
    }
  }

  // ── Template snapshot (JSON on the record) ──
  // Captures the version's reference configuration (default sample count +
  // parameters) so the approved record reconstructs what the test was run
  // against even if the template later moves to newer versions (§30/§65).
  const templateVersionId = row.template_version_id == null ? null : Number(row.template_version_id);
  if (templateVersionId !== null) {
    const tv = db
      .prepare(
        `SELECT t.name, t.code, v.version, v.applicable_product_id, v.default_sample_count, v.parameters_json
         FROM lab_test_template_versions v
         LEFT JOIN lab_test_templates t ON t.id = v.template_id
         WHERE v.id = ?`,
      )
      .get(templateVersionId) as
      | { name: string | null; code: string | null; version: number | null; applicable_product_id: number | null; default_sample_count: number | null; parameters_json: string | null }
      | undefined;
    if (tv) {
      let parameters: Record<string, unknown> | null = null;
      if (tv.parameters_json) {
        try {
          const parsed = JSON.parse(tv.parameters_json) as unknown;
          if (parsed && typeof parsed === 'object') parameters = parsed as Record<string, unknown>;
        } catch {
          parameters = null;
        }
      }
      db.prepare('UPDATE lab_test_records SET template_snapshot_json = ? WHERE id = ?').run(
        JSON.stringify({
          template_name: tv.name,
          template_code: tv.code,
          version: tv.version,
          default_sample_count: tv.default_sample_count,
          ...(parameters ? { parameters } : {}),
        }),
        testId,
      );
    }
  }
}
