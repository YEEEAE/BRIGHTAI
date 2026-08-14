// QC Laboratory Test Register search layer (PROMPT 06, /lab/tests).
//
// Mirrors src/lib/taskSearch.ts exactly: one module owns the filter model,
// the param parser, the querystring rebuild, the fully-parameterized WHERE
// builder, the whitelisted ORDER BY, pagination, and the paged + export
// queries. This is the register's server-side search/filter/sort/paginate —
// no user input ever appears in SQL text (every value rides in `?` params),
// sorting is constrained to a whitelisted union (no injection), and the
// register is RBAC-scoped: employees see only tests they tested or created,
// while supervisor/manager/admin see the full register.
//
// Row scope mirrors the task list rule (scopeClause below): an employee sees
// `tested_by = me OR created_by = me`. Approved/VOID records are immutable —
// that is enforced by the row-action rendering in the page via the
// can*LabTestRecord predicates, not by this query layer.

import type { LabFinalResult, LabTestStatus, LabTestType, Role } from '../types';
import { setFlash } from '../flash';
import { LAB_RESULT_OPTIONS } from './policy';

// ─────────────────────────────── Filter model ───────────────────────────────

export type LabTestSortField =
  | 'id'
  | 'test_number'
  | 'test_type'
  | 'product'
  | 'lot'
  | 'sampling_area'
  | 'equipment'
  | 'tester'
  | 'result'
  | 'status'
  | 'created_at'
  | 'updated_at';

export const LAB_TEST_SORT_FIELDS: readonly LabTestSortField[] = [
  'id',
  'test_number',
  'test_type',
  'product',
  'lot',
  'sampling_area',
  'equipment',
  'tester',
  'result',
  'status',
  'created_at',
  'updated_at',
];

export const LAB_TEST_STATUSES: readonly LabTestStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'REJECTED',
  'APPROVED',
  'VOID',
];

export const LAB_TEST_STATUS_LABELS: Record<LabTestStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REJECTED: 'Rejected',
  APPROVED: 'Approved',
  VOID: 'Void',
};

export const LAB_TEST_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_TEST_PER_PAGE = 25;
export const DEFAULT_LAB_TEST_SORT: LabTestSortField = 'updated_at';
export const DEFAULT_LAB_TEST_DIR: 'asc' | 'desc' = 'desc';
/** Safety cap for the register export — never dumps more than this. */
export const LAB_TEST_EXPORT_MAX_ROWS = 10_000;

export interface LabTestSearchFilters {
  /** Free text — test number / product / lot / sampling area / equipment / tester (LIKE). */
  q: string | null;
  test_type: LabTestType | null;
  status: LabTestStatus | null;
  result: LabFinalResult | null;
  tester_id: number | null;
  equipment_id: number | null;
  product_id: number | null;
  /** Lot Number (LIKE). */
  lot: string | null;
  /** Created preset — 'today' | 'week'. Normalized into from/to at parse time. */
  created: 'today' | 'week' | null;
  /** Custom created-on date window (from ≤ to). */
  created_from: string | null;
  created_to: string | null;
  sort: LabTestSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_TEST_FILTERS: LabTestSearchFilters = {
  q: null,
  test_type: null,
  status: null,
  result: null,
  tester_id: null,
  equipment_id: null,
  product_id: null,
  lot: null,
  created: null,
  created_from: null,
  created_to: null,
  sort: DEFAULT_LAB_TEST_SORT,
  dir: DEFAULT_LAB_TEST_DIR,
  page: 1,
  per_page: DEFAULT_LAB_TEST_PER_PAGE,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function isTestType(v: string): v is LabTestType {
  return v === 'air' || v === 'vacuum';
}

function isStatus(v: string): v is LabTestStatus {
  return (LAB_TEST_STATUSES as readonly string[]).includes(v);
}

function isResult(v: string): v is LabFinalResult {
  return (LAB_RESULT_OPTIONS as readonly string[]).includes(v);
}

function isSortField(v: string): v is LabTestSortField {
  return (LAB_TEST_SORT_FIELDS as readonly string[]).includes(v);
}

function isDir(v: string): v is 'asc' | 'desc' {
  return v === 'asc' || v === 'desc';
}

function isPerPage(v: number): v is (typeof LAB_TEST_PER_PAGE_OPTIONS)[number] {
  return (LAB_TEST_PER_PAGE_OPTIONS as readonly number[]).includes(v);
}

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Today's local date (YYYY-MM-DD) — same as dashboard.localToday. */
export function labLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Resolve the `created` preset to a {from, to} window (this week = Monday-first). */
function createdWindow(preset: 'today' | 'week'): { from: string; to: string } {
  const today = labLocalToday();
  if (preset === 'today') return { from: today, to: today };
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  const from = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  return { from, to: today };
}

/** Anything exposing Astro's cookies API (the page frontmatter `Astro` global). */
interface CookieJar {
  cookies: import('astro').AstroCookies;
}

/**
 * Parse + validate the /lab/tests query params into a typed filter object.
 * Invalid values are dropped and reported via a one-shot flash. Never throws.
 */
export function parseLabTestSearchFilters(url: URL, jar: CookieJar): LabTestSearchFilters {
  const f: LabTestSearchFilters = { ...NO_LAB_TEST_FILTERS };
  const sp = url.searchParams;

  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);

  const type = sp.get('type');
  if (type && type.trim() !== '') {
    if (isTestType(type)) f.test_type = type;
    else f.test_type = null;
  }

  const status = sp.get('status');
  if (status && status.trim() !== '') {
    if (isStatus(status)) f.status = status;
    else f.status = null;
  }

  const result = sp.get('result');
  if (result && result.trim() !== '') {
    if (isResult(result)) f.result = result;
    else f.result = null;
  }

  const tester = sp.get('tester');
  if (tester && tester.trim() !== '') {
    const id = positiveInt(tester);
    if (id !== null) f.tester_id = id;
    else f.tester_id = null;
  }

  const equipment = sp.get('equipment');
  if (equipment && equipment.trim() !== '') {
    const id = positiveInt(equipment);
    if (id !== null) f.equipment_id = id;
    else f.equipment_id = null;
  }

  const product = sp.get('product');
  if (product && product.trim() !== '') {
    const id = positiveInt(product);
    if (id !== null) f.product_id = id;
    else f.product_id = null;
  }

  const lot = sp.get('lot');
  if (lot && lot.trim() !== '') f.lot = lot.trim().slice(0, 200);

  // Created preset (drill-downs from /lab use ?created=today|week) OR a custom
  // date window (?from=…&to=…). Preset wins when present.
  const created = sp.get('created');
  if (created === 'today' || created === 'week') {
    f.created = created;
    const win = createdWindow(created);
    f.created_from = win.from;
    f.created_to = win.to;
  } else {
    const fromRaw = sp.get('from');
    const toRaw = sp.get('to');
    if (fromRaw && fromRaw.trim() !== '' && isValidDate(fromRaw)) f.created_from = fromRaw;
    if (toRaw && toRaw.trim() !== '' && isValidDate(toRaw)) f.created_to = toRaw;
    if (f.created_from && f.created_to && f.created_from > f.created_to) {
      setFlash(jar, 'error', 'The "from" date must be on or before the "to" date.');
      f.created_from = null;
      f.created_to = null;
    }
  }

  const sort = sp.get('sort');
  if (sort && isSortField(sort)) f.sort = sort;
  const dir = sp.get('dir');
  if (dir && isDir(dir)) f.dir = dir;

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

/** True when any register filter is active (drives the "Reset" affordance). */
export function hasLabTestFilters(f: LabTestSearchFilters): boolean {
  return Boolean(
    f.q ||
      f.test_type ||
      f.status ||
      f.result ||
      f.tester_id !== null ||
      f.equipment_id !== null ||
      f.product_id !== null ||
      f.lot ||
      f.created ||
      f.created_from ||
      f.created_to,
  );
}

/**
 * Rebuild the querystring for the current filters (used by sort/pagination/
 * export links). The page is excluded so pagination links can pin a different
 * page; sort/dir/per_page are included so the whole state survives navigation.
 */
export function labTestFiltersToQuery(f: LabTestSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.test_type) sp.set('type', f.test_type);
  if (f.status) sp.set('status', f.status);
  if (f.result) sp.set('result', f.result);
  if (f.tester_id !== null) sp.set('tester', String(f.tester_id));
  if (f.equipment_id !== null) sp.set('equipment', String(f.equipment_id));
  if (f.product_id !== null) sp.set('product', String(f.product_id));
  if (f.lot) sp.set('lot', f.lot);
  if (f.created) sp.set('created', f.created);
  else {
    if (f.created_from) sp.set('from', f.created_from);
    if (f.created_to) sp.set('to', f.created_to);
  }
  if (f.sort !== DEFAULT_LAB_TEST_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_TEST_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_TEST_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ─────────────────────── Parameterized WHERE builder ───────────────────────
// Pure (no DB) so it is unit-testable: given filters it returns the SQL text
// and the bound params in the exact order the placeholders appear.

/** Escape LIKE wildcards so user input matches literally (`%` → `\%` etc.). */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Build the shared, fully parameterized WHERE clause for a filter set.
 * Exported for unit tests: the SQL text NEVER contains user input — every
 * value rides in the returned params in placeholder order.
 */
export function buildLabTestWhere(f: LabTestSearchFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (f.q) {
    const like = `%${escapeLike(f.q)}%`;
    conds.push(
      `(t.test_number LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\' OR p.code LIKE ? ESCAPE '\\'
        OR t.lot_number LIKE ? ESCAPE '\\' OR t.sampling_area LIKE ? ESCAPE '\\'
        OR e.name LIKE ? ESCAPE '\\' OR e.code LIKE ? ESCAPE '\\' OR u.full_name LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like, like, like, like, like, like);
  }
  if (f.test_type) {
    conds.push('t.test_type = ?');
    params.push(f.test_type);
  }
  if (f.status) {
    conds.push('t.status = ?');
    params.push(f.status);
  }
  if (f.result) {
    conds.push('t.final_result = ?');
    params.push(f.result);
  }
  if (f.tester_id !== null) {
    conds.push('t.tested_by = ?');
    params.push(f.tester_id);
  }
  if (f.equipment_id !== null) {
    conds.push('t.equipment_id = ?');
    params.push(f.equipment_id);
  }
  if (f.product_id !== null) {
    conds.push('t.product_id = ?');
    params.push(f.product_id);
  }
  if (f.lot) {
    conds.push("t.lot_number LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(f.lot)}%`);
  }
  if (f.created_from) {
    conds.push("date(t.created_at, 'localtime') >= date(?)");
    params.push(f.created_from);
  }
  if (f.created_to) {
    conds.push("date(t.created_at, 'localtime') <= date(?)");
    params.push(f.created_to);
  }

  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

/** Role scope: employees see only their own tests (same rule as the lists). */
function scopeClause(role: Role, userId: number): { sql: string; params: unknown[] } {
  if (role === 'employee') {
    return { sql: '(t.tested_by = ? OR t.created_by = ?)', params: [userId, userId] };
  }
  return { sql: '', params: [] };
}

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabTestSortField, string> = {
  id: 't.id',
  test_number: 't.test_number COLLATE NOCASE',
  test_type: 't.test_type',
  product: 'p.name COLLATE NOCASE',
  lot: 't.lot_number COLLATE NOCASE',
  sampling_area: 't.sampling_area COLLATE NOCASE',
  equipment: 'e.name COLLATE NOCASE',
  tester: 'u.full_name COLLATE NOCASE',
  result:
    "CASE t.final_result WHEN 'PASS' THEN 1 WHEN 'FAIL' THEN 2 WHEN 'HOLD' THEN 3 ELSE 4 END",
  status:
    "CASE t.status WHEN 'DRAFT' THEN 1 WHEN 'SUBMITTED' THEN 2 WHEN 'UNDER_REVIEW' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'APPROVED' THEN 5 WHEN 'VOID' THEN 6 ELSE 7 END",
  created_at: 't.created_at',
  updated_at: 't.updated_at',
};

function orderClause(f: LabTestSearchFilters): string {
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  // Stable tiebreaker: id DESC always breaks ties so pagination never
  // duplicates or skips rows when two tests share the sort value.
  return `ORDER BY ${SORT_SQL[f.sort]} ${dir}, t.id DESC`;
}

// ─────────────────────────────── Search query ───────────────────────────────

export interface LabTestSearchRow {
  id: number;
  test_number: string;
  test_type: string;
  lot_number: string | null;
  sampling_area: string | null;
  final_result: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  product_name: string | null;
  product_code: string | null;
  equipment_name: string | null;
  equipment_code: string | null;
  tester_name: string | null;
}

const LAB_TEST_SELECT = `SELECT t.id, t.test_number, t.test_type, t.lot_number, t.sampling_area,
       t.final_result, t.status, t.created_at, t.updated_at,
       p.name AS product_name, p.code AS product_code,
       e.name AS equipment_name, e.code AS equipment_code,
       u.full_name AS tester_name
FROM lab_test_records t
LEFT JOIN lab_products p ON p.id = t.product_id
LEFT JOIN lab_equipment e ON e.id = t.equipment_id
LEFT JOIN users u ON u.id = t.tested_by`;

export interface LabTestSearchResult {
  rows: LabTestSearchRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Merge two WHERE fragments into one with their params in text order. */
function mergeWheres(
  a: { sql: string; params: unknown[] },
  b: { sql: string; params: unknown[] },
): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  for (const part of [a, b]) {
    if (!part.sql) continue;
    conds.push(part.sql.replace(/^WHERE /, ''));
    params.push(...part.params);
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

/**
 * Paged, sorted, filtered test-register search. `scope` carries the requesting
 * user so employees only see their own tests. All SQL is parameterized.
 */
export async function searchLabTests(
  f: LabTestSearchFilters,
  scope: { role: Role; userId: number },
): Promise<LabTestSearchResult> {
  const db = await getSearchDb();
  const merged = mergeWheres(buildLabTestWhere(f), scopeClause(scope.role, scope.userId));

  // The WHERE builder may reference joined tables (p/e/u), so the count query
  // must carry the same joins as the SELECT.
  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS n FROM lab_test_records t
       LEFT JOIN lab_products p ON p.id = t.product_id
       LEFT JOIN lab_equipment e ON e.id = t.equipment_id
       LEFT JOIN users u ON u.id = t.tested_by
       ${merged.sql}`,
    )
    .get(...merged.params) as { n: number };
  const total = Number(totalRow.n);

  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;

  const rows = db
    .prepare(`${LAB_TEST_SELECT} ${merged.sql} ${orderClause(f)} LIMIT ? OFFSET ?`)
    .all(...merged.params, f.per_page, offset) as LabTestSearchRow[];

  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

/**
 * Every row matching the filters (no pagination) — used by the CSV/XLSX
 * exports. Capped at LAB_TEST_EXPORT_MAX_ROWS so a careless query cannot dump
 * the whole database.
 */
export async function searchLabTestRows(
  f: LabTestSearchFilters,
  scope: { role: Role; userId: number },
): Promise<LabTestSearchRow[]> {
  const db = await getSearchDb();
  const merged = mergeWheres(buildLabTestWhere(f), scopeClause(scope.role, scope.userId));
  return db
    .prepare(`${LAB_TEST_SELECT} ${merged.sql} ${orderClause(f)} LIMIT ?`)
    .all(...merged.params, LAB_TEST_EXPORT_MAX_ROWS) as LabTestSearchRow[];
}

// ─────────────────────────── Filter dropdown data ───────────────────────────

// NOTE on DB access: the SQLite connection is pulled via a lazy dynamic import
// (same pattern as taskSearch.ts) so this module stays loadable in the
// server-less test runner — db.ts imports schema.sql?raw which plain Node
// cannot resolve. Only the DB-touching functions below are async.

/** Lazy getDb — keeps this module importable without a bundler/loader. */
async function getSearchDb() {
  const { getDb } = await import('../db');
  return getDb();
}

/** Testers that appear on at least one test (tester filter dropdown). */
export async function listLabTesters(): Promise<{ id: number; full_name: string }[]> {
  const db = await getSearchDb();
  return db
    .prepare(
      `SELECT DISTINCT u.id, u.full_name
       FROM lab_test_records t JOIN users u ON u.id = t.tested_by
       ORDER BY u.full_name COLLATE NOCASE ASC`,
    )
    .all() as { id: number; full_name: string }[];
}

/** Equipment that appears on at least one test (equipment filter dropdown). */
export async function listLabTestEquipment(): Promise<{ id: number; name: string; code: string }[]> {
  const db = await getSearchDb();
  return db
    .prepare(
      `SELECT DISTINCT e.id, e.name, e.code
       FROM lab_test_records t JOIN lab_equipment e ON e.id = t.equipment_id
       ORDER BY e.name COLLATE NOCASE ASC`,
    )
    .all() as { id: number; name: string; code: string }[];
}

/** Products referenced by at least one test (product filter dropdown). */
export async function listLabTestProducts(): Promise<{ id: number; name: string; code: string }[]> {
  const db = await getSearchDb();
  return db
    .prepare(
      `SELECT DISTINCT p.id, p.name, p.code
       FROM lab_test_records t JOIN lab_products p ON p.id = t.product_id
       ORDER BY p.name COLLATE NOCASE ASC`,
    )
    .all() as { id: number; name: string; code: string }[];
}