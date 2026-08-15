// QC Laboratory retests — controlled repeat testing (§46–§47).
//
// A retest NEVER modifies the original test row (D-5, ON DELETE RESTRICT on
// original_test_id). At creation the retest row freezes WHY the retest exists
// (reason + note) and the original's result/final state (original_result /
// original_status columns, migration 019) so the register stays truthful even
// if the original is later voided. A new DRAFT test record is created as the
// retest execution vehicle (new_test_id) carrying the original's controlled
// context (product, lot, sampling area, equipment, template/SOP/WI refs) —
// measurements are re-taken, never copied. The retest completes when that new
// test is APPROVED (hook in review.ts, same transaction as the approval).
//
// Audit: every retest creation writes LAB_RETEST/CREATE (+ a LAB_TEST/LINK
// row on the original for traceability); every completion writes
// LAB_RETEST/APPROVAL — the shared qc_audit_log, never a second log.

import type { APIContext } from 'astro';
import { transaction, getDb } from '../db';
import type BetterSqliteDatabase from 'better-sqlite3';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { createNotification } from '../notifications';
import { canCreateLabRetest } from '../permissions';
import {
  LAB_RETEST_REASONS,
  LAB_RETEST_STATUSES,
  LAB_RETEST_REASON_LABELS,
  type LabRetestReason,
  type LabRetestStatus,
} from './policy';

export { LAB_RETEST_REASONS, LAB_RETEST_STATUSES, LAB_RETEST_REASON_LABELS };
export type { LabRetestReason, LabRetestStatus };

/** Original states a retest may be created from — the record must have
 *  reached a disposition (APPROVED / REJECTED / VOID) first. Retesting an
 *  in-flight DRAFT/SUBMITTED/UNDER_REVIEW test is refused (decision D-5). */
export const LAB_RETEST_ELIGIBLE_ORIGINAL_STATUSES = ['APPROVED', 'REJECTED', 'VOID'] as const;

export interface LabRetestFormData {
  reason: LabRetestReason;
  reason_note: string | null;
}

function auditLabRetest(
  db: BetterSqliteDatabase.Database,
  retestId: number,
  actorId: number,
  action: 'CREATE' | 'APPROVAL',
  note: string,
): void {
  db.prepare(
    `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note)
     VALUES ('LAB_RETEST', ?, NULL, ?, ?, NULL, NULL, ?)`,
  ).run(retestId, actorId, action, note);
}

/** Audit trail for one retest (shared qc_audit_log, newest first). */
export function getLabRetestAudit(retestId: number): Array<Record<string, unknown>> {
  return getDb()
    .prepare(
      `SELECT a.id, a.action, a.note, a.created_at, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_RETEST' AND a.entity_id = ?
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(retestId) as Array<Record<string, unknown>>;
}

// ── Register (search) ─────────────────────────────────────────────────────

export type LabRetestSortField = 'retest_number' | 'original_test' | 'status' | 'reason' | 'created_at' | 'updated_at';
export const LAB_RETEST_SORT_FIELDS: readonly LabRetestSortField[] = [
  'retest_number',
  'original_test',
  'status',
  'reason',
  'created_at',
  'updated_at',
];
export const LAB_RETEST_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_RETEST_SORT: LabRetestSortField = 'created_at';
export const DEFAULT_LAB_RETEST_DIR: 'asc' | 'desc' = 'desc';
export const DEFAULT_LAB_RETEST_PER_PAGE = 25;

export interface LabRetestSearchFilters {
  /** Free text — retest number, original test number, original product name/code. */
  q: string | null;
  reason: LabRetestReason | null;
  status: LabRetestStatus | null;
  sort: LabRetestSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_RETEST_FILTERS: LabRetestSearchFilters = {
  q: null,
  reason: null,
  status: null,
  sort: DEFAULT_LAB_RETEST_SORT,
  dir: DEFAULT_LAB_RETEST_DIR,
  page: 1,
  per_page: DEFAULT_LAB_RETEST_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeRetestLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Parse + validate the /lab/retests query params. Invalid values drop silently. */
export function parseLabRetestSearchFilters(url: URL): LabRetestSearchFilters {
  const f: LabRetestSearchFilters = { ...NO_LAB_RETEST_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const reason = sp.get('reason');
  if (reason && (LAB_RETEST_REASONS as readonly string[]).includes(reason)) {
    f.reason = reason as LabRetestReason;
  }
  const status = sp.get('status');
  if (status && (LAB_RETEST_STATUSES as readonly string[]).includes(status)) {
    f.status = status as LabRetestStatus;
  }
  const sort = sp.get('sort');
  if (sort && (LAB_RETEST_SORT_FIELDS as readonly string[]).includes(sort)) f.sort = sort as LabRetestSortField;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_RETEST_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

export function hasLabRetestFilters(f: LabRetestSearchFilters): boolean {
  return Boolean(f.q || f.reason || f.status);
}

export function labRetestFiltersToQuery(f: LabRetestSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.reason) sp.set('reason', f.reason);
  if (f.status) sp.set('status', f.status);
  if (f.sort !== DEFAULT_LAB_RETEST_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_RETEST_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_RETEST_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const RETEST_SORT_SQL: Record<LabRetestSortField, string> = {
  retest_number: 'r.retest_number',
  original_test: 'ot.test_number',
  status: 'r.status',
  reason: 'r.reason',
  created_at: 'r.created_at',
  updated_at: 'r.updated_at',
};

export interface LabRetestRow {
  id: number;
  retest_number: string;
  original_test_id: number;
  original_test_number: string;
  original_test_status: string;
  original_result: string | null;
  original_status: string | null;
  reason: string;
  reason_note: string | null;
  status: string;
  new_test_id: number | null;
  new_test_number: string | null;
  new_test_status: string | null;
  new_test_result: string | null;
  product_name: string | null;
  product_code: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabRetestSearchResult {
  rows: LabRetestRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Bounded, fully parameterized register query (employee sees retests of the
 *  tests they can already see via the test register's scope — the retest view
 *  itself is role-level for all roles, D-5). */
export function searchLabRetests(f: LabRetestSearchFilters): LabRetestSearchResult {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    const like = `%${escapeRetestLike(f.q)}%`;
    where.push(
      `(r.retest_number LIKE ? ESCAPE '\\' OR ot.test_number LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\' OR p.code LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like, like);
  }
  if (f.reason) {
    where.push('r.reason = ?');
    params.push(f.reason);
  }
  if (f.status) {
    where.push('r.status = ?');
    params.push(f.status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const base = `FROM lab_test_retests r
     LEFT JOIN lab_test_records ot ON ot.id = r.original_test_id
     LEFT JOIN lab_test_records nt ON nt.id = r.new_test_id
     LEFT JOIN lab_products p ON p.id = ot.product_id
     LEFT JOIN users u ON u.id = r.created_by`;

  const total = Number(
    (db.prepare(`SELECT COUNT(*) AS n ${base} ${whereSql}`).get(...params) as { n: number }).n,
  );
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(Math.max(1, f.page), totalPages);

  const rows = db
    .prepare(
      `SELECT r.id, r.retest_number, r.original_test_id, r.reason, r.reason_note, r.status,
              r.original_result, r.original_status, r.new_test_id, r.created_at, r.updated_at,
              ot.test_number AS original_test_number, ot.status AS original_test_status,
              nt.test_number AS new_test_number, nt.status AS new_test_status,
              nt.final_result AS new_test_result,
              p.name AS product_name, p.code AS product_code,
              u.full_name AS created_by_name
       ${base} ${whereSql}
       ORDER BY ${RETEST_SORT_SQL[f.sort]} ${f.dir === 'asc' ? 'ASC' : 'DESC'}, r.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, f.per_page, (page - 1) * f.per_page) as unknown as LabRetestRow[];

  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ── Detail + create context ───────────────────────────────────────────────

export interface LabRetestDetail {
  retest: LabRetestRow;
  original_type: string | null;
  original_lot: string | null;
  original_sampling_area: string | null;
  audit: Array<Record<string, unknown>>;
}

export function getLabRetestDetail(id: number): LabRetestDetail | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = getDb();
  const retest = db
    .prepare(
      `SELECT r.id, r.retest_number, r.original_test_id, r.reason, r.reason_note, r.status,
              r.original_result, r.original_status, r.new_test_id, r.created_at, r.updated_at,
              ot.test_number AS original_test_number, ot.status AS original_test_status,
              nt.test_number AS new_test_number, nt.status AS new_test_status,
              nt.final_result AS new_test_result,
              p.name AS product_name, p.code AS product_code,
              u.full_name AS created_by_name
       FROM lab_test_retests r
       LEFT JOIN lab_test_records ot ON ot.id = r.original_test_id
       LEFT JOIN lab_test_records nt ON nt.id = r.new_test_id
       LEFT JOIN lab_products p ON p.id = ot.product_id
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = ?`,
    )
    .get(id) as LabRetestRow | undefined;
  if (!retest) return null;
  const original = db
    .prepare('SELECT test_type, lot_number, sampling_area FROM lab_test_records WHERE id = ?')
    .get(retest.original_test_id) as { test_type: string; lot_number: string | null; sampling_area: string | null } | undefined;
  return {
    retest,
    original_type: original ? original.test_type.toUpperCase() : null,
    original_lot: original ? original.lot_number : null,
    original_sampling_area: original ? original.sampling_area : null,
    audit: getLabRetestAudit(id),
  };
}

/** Context for the Create Retest form: the original test + its existing
 *  retests (so the operator sees RETEST-01/RETEST-02 already used). */
export function getLabRetestCreateContext(
  testId: number,
): {
  test: {
    id: number;
    test_number: string;
    test_type: string;
    status: string;
    final_result: string | null;
    product_name: string | null;
    lot_number: string | null;
    sampling_area: string | null;
  } | null;
  existing: Array<{ id: number; retest_number: string; reason: string; status: string }>;
  eligible: boolean;
} {
  if (!Number.isInteger(testId) || testId <= 0) return { test: null, existing: [], eligible: false };
  const db = getDb();
  const test = db
    .prepare(
      `SELECT t.id, t.test_number, t.test_type, t.status, t.final_result,
              p.name AS product_name, t.lot_number, t.sampling_area
       FROM lab_test_records t LEFT JOIN lab_products p ON p.id = t.product_id
       WHERE t.id = ?`,
    )
    .get(testId) as
    | {
        id: number;
        test_number: string;
        test_type: string;
        status: string;
        final_result: string | null;
        product_name: string | null;
        lot_number: string | null;
        sampling_area: string | null;
      }
    | undefined;
  const existing = db
    .prepare(
      `SELECT id, retest_number, reason, status FROM lab_test_retests
       WHERE original_test_id = ? ORDER BY created_at ASC, id ASC`,
    )
    .all(testId) as Array<{ id: number; retest_number: string; reason: string; status: string }>;
  return {
    test: test ?? null,
    existing,
    eligible:
      !!test && (LAB_RETEST_ELIGIBLE_ORIGINAL_STATUSES as readonly string[]).includes(test.status),
  };
}

// ── Creation ──────────────────────────────────────────────────────────────

export interface LabRetestCreateResult {
  retest_id: number;
  retest_number: string;
  new_test_id: number;
  new_test_number: string;
}

/**
 * Create a controlled retest for an original test (one transaction):
 *
 * 1. the original must exist and be dispositioned (APPROVED/REJECTED/VOID);
 * 2. the retest row freezes reason/note + the original's result and final
 *    state (migration 019 columns) — the original row is only ever READ;
 * 3. a new DRAFT test record is created carrying the original's controlled
 *    context (product/equipment/lot/sampling area/connector/sample count/
 *    template/SOP/WI refs) — measurements and results are NEVER copied;
 * 4. LAB_RETEST/CREATE + LAB_TEST/LINK audit rows are written.
 */
export function createLabRetest(
  user: { id: number },
  originalTestId: number,
  data: LabRetestFormData,
): LabRetestCreateResult {
  return transaction(() => {
    const db = getDb();
    const original = db
      .prepare('SELECT * FROM lab_test_records WHERE id = ?')
      .get(originalTestId) as Record<string, unknown> | undefined;
    if (!original) throw new Error('Original test not found.');
    const originalStatus = String(original.status);
    if (!(LAB_RETEST_ELIGIBLE_ORIGINAL_STATUSES as readonly string[]).includes(originalStatus)) {
      throw new Error(
        `Test ${String(original.test_number)} is not eligible for a retest (current status: ${originalStatus}).`,
      );
    }

    // Sequential retest number per original: LAB-RETEST-00081-01, -02, ...
    const originalNumber = String(original.test_number);
    const digits = originalNumber.replace(/^LAB-TEST-/, '');
    const existingCount = Number(
      (db
        .prepare('SELECT COUNT(*) AS n FROM lab_test_retests WHERE original_test_id = ?')
        .get(originalTestId) as { n: number }).n,
    );
    let retestNumber = '';
    let insertResult: { lastInsertRowid: number | bigint } | null = null;
    const insert = db.prepare(
      `INSERT INTO lab_test_retests (
         retest_number, original_test_id, reason, reason_note, status,
         original_result, original_status, created_by
       ) VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)`,
    );
    for (let seq = existingCount + 1; seq <= existingCount + 20 && !insertResult; seq += 1) {
      retestNumber = `LAB-RETEST-${digits}-${String(seq).padStart(2, '0')}`;
      try {
        insertResult = insert.run(
          retestNumber,
          originalTestId,
          data.reason,
          data.reason_note,
          original.final_result == null ? null : String(original.final_result),
          originalStatus,
          user.id,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes('UNIQUE')) throw err;
        // Sequence gap (a manual insert raced us) — try the next sequence.
      }
    }
    if (!insertResult) throw new Error('Could not allocate a retest number.');
    const retestId = Number(insertResult.lastInsertRowid);

    // New DRAFT execution record — controlled context copied, measurements
    // NOT copied (the retest re-measures everything, §46).
    const placeholder = `PENDING-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const newTestResult = db
      .prepare(
        `INSERT INTO lab_test_records (
           test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
           medium_used, connector_type, sample_count, status, tested_by, created_by,
           template_id, template_version_id, sop_version_id, wi_version_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?, ?, ?, ?, ?)`,
      )
      .run(
        placeholder,
        original.test_type,
        original.product_id ?? null,
        original.equipment_id ?? null,
        original.lot_number ?? null,
        original.sampling_area ?? null,
        original.medium_used ?? null,
        original.connector_type ?? null,
        original.sample_count ?? 5,
        user.id,
        original.template_id ?? null,
        original.template_version_id ?? null,
        original.sop_version_id ?? null,
        original.wi_version_id ?? null,
      );
    const newTestId = Number(newTestResult.lastInsertRowid);
    const newTestNumber = `LAB-TEST-${String(newTestId).padStart(5, '0')}`;
    db.prepare('UPDATE lab_test_records SET test_number = ? WHERE id = ?').run(newTestNumber, newTestId);
    db.prepare('UPDATE lab_test_retests SET new_test_id = ? WHERE id = ?').run(newTestId, retestId);

    // Audit — every creation (§61).
    auditLabRetest(
      db,
      retestId,
      user.id,
      'CREATE',
      `original=${originalNumber}; reason=${data.reason}` +
        (data.reason_note ? `; note=${data.reason_note}` : '') +
        `; original_result=${original.final_result ?? 'NULL'}; original_status=${originalStatus}` +
        `; new_test=${newTestNumber}`,
    );
    db.prepare(
      `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note)
       VALUES ('LAB_TEST', ?, NULL, ?, 'LINK', NULL, NULL, ?)`,
    ).run(originalTestId, user.id, `retest=${retestNumber}; new_test=${newTestNumber}`);

    // Notify the original test's owner that a retest was opened (reuses the
    // notification engine; entity_href opens the retest — migration 022).
    const retestRecipient =
      original.tested_by == null ? (original.created_by as number | null) : (original.tested_by as number);
    if (retestRecipient && retestRecipient !== user.id) {
      createNotification({
        userId: retestRecipient,
        taskId: null,
        type: 'lab_retest_update',
        title: `Retest opened: ${originalNumber}`,
        message: `${retestNumber} was opened for ${originalNumber} (reason: ${data.reason}).`,
        href: `/lab/retests/${retestId}`,
      });
    }

    return { retest_id: retestId, retest_number: retestNumber, new_test_id: newTestId, new_test_number: newTestNumber };
  });
}

/**
 * Retest completion — called INSIDE the approval transaction in review.ts:
 * when the retest's new test is approved, the retest moves OPEN → COMPLETED
 * and an APPROVAL audit row records the completion (never a second log).
 * Returns the retest numbers that were completed (empty array when the
 * approved test is not a retest execution record).
 */
export function completeLabRetestsForApproval(
  db: BetterSqliteDatabase.Database,
  newTestId: number,
  newTestNumber: string,
  actorId: number,
  dbNow: string,
): string[] {
  const open = db
    .prepare(
      `SELECT r.id, r.retest_number, r.created_by, o.test_number AS original_number
       FROM lab_test_retests r
       JOIN lab_test_records o ON o.id = r.original_test_id
       WHERE r.new_test_id = ? AND r.status = 'OPEN'`,
    )
    .all(newTestId) as Array<{ id: number; retest_number: string; created_by: number | null; original_number: string }>;
  for (const row of open) {
    db.prepare(`UPDATE lab_test_retests SET status = 'COMPLETED', updated_at = ? WHERE id = ?`).run(dbNow, row.id);
    auditLabRetest(db, row.id, actorId, 'APPROVAL', `retest completed: new test ${newTestNumber} approved`);
    // Notify the retest creator that it resolved (entity_href opens the
    // retest — migration 022).
    if (row.created_by && row.created_by !== actorId) {
      createNotification({
        userId: row.created_by,
        taskId: null,
        type: 'lab_retest_update',
        title: `Retest completed: ${row.retest_number}`,
        message: `${row.retest_number} for ${row.original_number} completed — retest ${newTestNumber} was approved.`,
        href: `/lab/retests/${row.id}`,
      });
    }
  }
  return open.map((r) => r.retest_number);
}

// ── POST handler (middleware short-circuit) ───────────────────────────────

/**
 * POST /lab/retests/new?test=<id> — the original test id comes from the URL
 * QUERY only (never the body, §66 hidden-field manipulation). Re-checks
 * supervisor+ (D-5), CSRF and the shared Zod validation.
 */
export async function handleLabRetestCreatePost(context: APIContext): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const testParam = Number(context.url.searchParams.get('test') ?? '');
  const backUrl = Number.isInteger(testParam) && testParam > 0
    ? `/lab/retests/new?test=${testParam}`
    : '/lab/retests';

  if (!canCreateLabRetest(user.role)) {
    setFlash(context, 'error', 'You do not have permission to create retests.');
    return context.redirect('/lab/retests');
  }

  // Dynamic import keeps this module loadable in the bundler-less unit tests.
  const { parseFormData, labRetestSchema } = await import('../validation');
  const form = await context.request.formData();
  const parsed = parseFormData(labRetestSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  if (!Number.isInteger(testParam) || testParam <= 0) {
    setFlash(context, 'error', 'A valid original test is required to create a retest.');
    return context.redirect('/lab/retests');
  }

  try {
    const result = createLabRetest({ id: user.id }, testParam, parsed.data as LabRetestFormData);
    setFlash(
      context,
      'success',
      `Retest ${result.retest_number} created — new test ${result.new_test_number} is ready.`,
    );
    return context.redirect(`/lab/retests/${result.retest_id}`);
  } catch (err) {
    console.error('[lab] retest create failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not create the retest.');
    return context.redirect(backUrl);
  }
}
