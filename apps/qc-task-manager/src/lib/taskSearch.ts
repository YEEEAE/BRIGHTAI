// Advanced task search layer for QC Task Manager.
//
// One page (/search) + three export endpoints (/api/export/search.csv,
// /api/export/search.xlsx, /api/export/tasks/pdf/[id]) are driven from this
// module so the filter semantics, the WHERE clause and the saved-filters
// storage live in exactly one place.
//
// Design rules (same as the dashboard layer):
//   - Every query is READ-ONLY and fully parameterized (?) — user input is
//     NEVER interpolated into SQL text. Filter values are validated and typed
//     in parseTaskSearchFilters before any query runs.
//   - Free-text `q` matches title / description / blocker_note / comments via
//     LIKE with ESCAPE — wildcards typed by the user are neutralized so `%`/`_`
//     search literally.
//   - Employee accounts are scoped to their own tasks (assigned to them or
//     created by them); every other role searches the full task table.
//   - Sorting uses a fixed whitelist (never raw user input) with a stable
//     id tiebreaker so pagination cannot duplicate/skip rows.
//   - The URL query string is the source of truth for the filter state — every
//     link on the page (sort, pagination, exports, reset) rebuilds it from the
//     parsed filters (filtersToQuery), so state survives navigation.

import { setFlash } from './flash';
import { localDateStr } from './format';
import { TASK_ROW_SCOPE_SQL, rowScopeParams } from './scope';
import { getDb } from './db';
import { buildOrderClause, DEFAULT_PER_PAGE, isPerPage, isSortDir, mergeWheres, PER_PAGE_OPTIONS } from './pagination';
import {
  MAX_SAVED_FILTER_NAME as MAX_SAVED_FILTER_NAME_POLICY,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  TASK_STATUSES,
} from './task-policy';

// Re-exported for the search page dropdowns + save form (single source).
export {
  MAX_SAVED_FILTER_NAME_POLICY as MAX_SAVED_FILTER_NAME,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  TASK_STATUSES,
};
import type { AstroCookies } from 'astro';
import type { Role, TaskPriority, TaskRecurrence, TaskStatus } from './types';

// ─────────────────────────────── Filter model ───────────────────────────────

export type SearchSortField =
  | 'id'
  | 'title'
  | 'status'
  | 'priority'
  | 'assignee'
  | 'due_date'
  | 'created_at'
  | 'updated_at'
  | 'completed_at';

export const SEARCH_SORT_FIELDS: readonly SearchSortField[] = [
  'id',
  'title',
  'status',
  'priority',
  'assignee',
  'due_date',
  'created_at',
  'updated_at',
  'completed_at',
];

export const SEARCH_PER_PAGE_OPTIONS = PER_PAGE_OPTIONS;
export { DEFAULT_PER_PAGE };
export const DEFAULT_SORT: SearchSortField = 'updated_at';
export const DEFAULT_DIR: 'asc' | 'desc' = 'desc';
/** Safety cap for exports — a filtered export never returns more than this. */
export const EXPORT_MAX_ROWS = 10_000;

export interface TaskSearchFilters {
  /** Free text — title / description / blocker_note / comments (LIKE). */
  q: string | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  department: string | null;
  assigned_to: number | null;
  created_by: number | null;
  due_from: string | null;
  due_to: string | null;
  created_from: string | null;
  created_to: string | null;
  completed_from: string | null;
  completed_to: string | null;
  /** due_date before today AND not completed/cancelled. */
  overdue_only: boolean;
  /** Task has at least one is_evidence=1 attachment. */
  has_evidence: boolean;
  /** An evidence_skipped activity entry exists for the task. */
  evidence_skipped: boolean;
  recurrence: TaskRecurrence | null;
  /** A PENDING deletion request exists for the task. */
  deletion_requested: boolean;
  sort: SearchSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_SEARCH_FILTERS: TaskSearchFilters = {
  q: null,
  status: null,
  priority: null,
  department: null,
  assigned_to: null,
  created_by: null,
  due_from: null,
  due_to: null,
  created_from: null,
  created_to: null,
  completed_from: null,
  completed_to: null,
  overdue_only: false,
  has_evidence: false,
  evidence_skipped: false,
  recurrence: null,
  deletion_requested: false,
  sort: DEFAULT_SORT,
  dir: DEFAULT_DIR,
  page: 1,
  per_page: DEFAULT_PER_PAGE,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function isStatus(v: string): v is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(v);
}

function isPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(v);
}

function isRecurrenceValue(v: string): v is TaskRecurrence {
  return (TASK_RECURRENCES as readonly string[]).includes(v);
}

function isSortField(v: string): v is SearchSortField {
  return (SEARCH_SORT_FIELDS as readonly string[]).includes(v);
}

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Anything exposing Astro's cookies API (the page frontmatter `Astro` global). */
interface CookieJar {
  cookies: AstroCookies;
}

/**
 * Parse + validate the /search query params into a typed filter object.
 *
 * Supported params:
 *   q, status, priority, department, assigned, creator,
 *   due_from/due_to, created_from/created_to, completed_from/completed_to,
 *   overdue=1, has_evidence=1, evidence_skipped=1, recurrence,
 *   deletion=1, sort, dir, page, per
 *
 * Invalid values are dropped and reported via a one-shot flash so the user
 * knows why a filter had no effect. Never throws — always returns a safe
 * filter object (mirrors parseDashboardFilters).
 */
export function parseTaskSearchFilters(url: URL, jar: CookieJar): TaskSearchFilters {
  const f: TaskSearchFilters = { ...NO_SEARCH_FILTERS };
  const sp = url.searchParams;

  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);

  const status = sp.get('status');
  if (status && status.trim() !== '') {
    if (isStatus(status)) f.status = status;
    else setFlash(jar, 'error', 'Invalid status filter.');
  }

  const priority = sp.get('priority');
  if (priority && priority.trim() !== '') {
    if (isPriority(priority)) f.priority = priority;
    else setFlash(jar, 'error', 'Invalid priority filter.');
  }

  const department = sp.get('department');
  if (department && department.trim() !== '') f.department = department.trim().slice(0, 60);

  const assigned = sp.get('assigned');
  if (assigned && assigned.trim() !== '') {
    const id = positiveInt(assigned);
    if (id !== null) f.assigned_to = id;
    else setFlash(jar, 'error', 'Invalid assigned-user filter.');
  }

  const creator = sp.get('creator');
  if (creator && creator.trim() !== '') {
    const id = positiveInt(creator);
    if (id !== null) f.created_by = id;
    else setFlash(jar, 'error', 'Invalid creator filter.');
  }

  // ── date ranges (each window validated independently) ──
  const parseWindow = (
    fromParam: string,
    toParam: string,
    label: string,
  ): { from: string | null; to: string | null } => {
    const fromRaw = sp.get(fromParam);
    const toRaw = sp.get(toParam);
    let from: string | null = null;
    let to: string | null = null;
    if (fromRaw && fromRaw.trim() !== '') {
      if (isValidDate(fromRaw)) from = fromRaw;
      else setFlash(jar, 'error', `Invalid ${label} "from" date — expected YYYY-MM-DD.`);
    }
    if (toRaw && toRaw.trim() !== '') {
      if (isValidDate(toRaw)) to = toRaw;
      else setFlash(jar, 'error', `Invalid ${label} "to" date — expected YYYY-MM-DD.`);
    }
    if (from && to && from > to) {
      setFlash(jar, 'error', `${label} "from" must be on or before the "to" date.`);
      return { from: null, to: null };
    }
    return { from, to };
  };

  const due = parseWindow('due_from', 'due_to', 'Due');
  f.due_from = due.from;
  f.due_to = due.to;
  const created = parseWindow('created_from', 'created_to', 'Created');
  f.created_from = created.from;
  f.created_to = created.to;
  const completed = parseWindow('completed_from', 'completed_to', 'Completed');
  f.completed_from = completed.from;
  f.completed_to = completed.to;

  if (sp.get('overdue') === '1' || sp.get('overdue') === 'true') f.overdue_only = true;
  if (sp.get('has_evidence') === '1' || sp.get('has_evidence') === 'true') f.has_evidence = true;
  if (sp.get('evidence_skipped') === '1' || sp.get('evidence_skipped') === 'true') {
    f.evidence_skipped = true;
  }
  if (sp.get('deletion') === '1' || sp.get('deletion') === 'true') f.deletion_requested = true;

  const recurrence = sp.get('recurrence');
  if (recurrence && recurrence.trim() !== '') {
    if (isRecurrenceValue(recurrence)) f.recurrence = recurrence;
    else setFlash(jar, 'error', 'Invalid recurrence filter.');
  }

  const sort = sp.get('sort');
  if (sort && isSortField(sort)) f.sort = sort;
  const dir = sp.get('dir');
  if (dir && isSortDir(dir)) f.dir = dir;

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

/** True when any search filter is active (drives the "Reset" affordance). */
export function hasSearchFilters(f: TaskSearchFilters): boolean {
  return Boolean(
    f.q ||
      f.status ||
      f.priority ||
      f.department ||
      f.assigned_to !== null ||
      f.created_by !== null ||
      f.due_from ||
      f.due_to ||
      f.created_from ||
      f.created_to ||
      f.completed_from ||
      f.completed_to ||
      f.overdue_only ||
      f.has_evidence ||
      f.evidence_skipped ||
      f.recurrence ||
      f.deletion_requested,
  );
}

/**
 * Rebuild the querystring for the current filters (used by sort/pagination/
 * export links and the save-filter payload). The page is excluded so
 * pagination links can pin a different page; sort/dir/per_page are included
 * so the whole state survives navigation.
 */
export function filtersToQuery(f: TaskSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.status) sp.set('status', f.status);
  if (f.priority) sp.set('priority', f.priority);
  if (f.department) sp.set('department', f.department);
  if (f.assigned_to !== null) sp.set('assigned', String(f.assigned_to));
  if (f.created_by !== null) sp.set('creator', String(f.created_by));
  if (f.due_from) sp.set('due_from', f.due_from);
  if (f.due_to) sp.set('due_to', f.due_to);
  if (f.created_from) sp.set('created_from', f.created_from);
  if (f.created_to) sp.set('created_to', f.created_to);
  if (f.completed_from) sp.set('completed_from', f.completed_from);
  if (f.completed_to) sp.set('completed_to', f.completed_to);
  if (f.overdue_only) sp.set('overdue', '1');
  if (f.has_evidence) sp.set('has_evidence', '1');
  if (f.evidence_skipped) sp.set('evidence_skipped', '1');
  if (f.recurrence) sp.set('recurrence', f.recurrence);
  if (f.deletion_requested) sp.set('deletion', '1');
  if (f.sort !== DEFAULT_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_PER_PAGE) sp.set('per', String(f.per_page));
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
export function buildSearchWhere(f: TaskSearchFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (f.q) {
    const like = `%${escapeLike(f.q)}%`;
    conds.push(
      `(t.title LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\' OR t.blocker_note LIKE ? ESCAPE '\\'
        OR EXISTS (SELECT 1 FROM task_comments c WHERE c.task_id = t.id AND c.comment LIKE ? ESCAPE '\\'))`,
    );
    params.push(like, like, like, like);
  }
  if (f.status) {
    conds.push('t.status = ?');
    params.push(f.status);
  }
  if (f.priority) {
    conds.push('t.priority = ?');
    params.push(f.priority);
  }
  if (f.department) {
    conds.push('t.department = ?');
    params.push(f.department);
  }
  if (f.assigned_to !== null) {
    conds.push('t.assigned_to = ?');
    params.push(f.assigned_to);
  }
  if (f.created_by !== null) {
    conds.push('t.created_by = ?');
    params.push(f.created_by);
  }
  if (f.due_from) {
    conds.push('date(t.due_date) >= date(?)');
    params.push(f.due_from);
  }
  if (f.due_to) {
    conds.push('date(t.due_date) <= date(?)');
    params.push(f.due_to);
  }
  if (f.created_from) {
    conds.push("date(t.created_at, 'localtime') >= date(?)");
    params.push(f.created_from);
  }
  if (f.created_to) {
    conds.push("date(t.created_at, 'localtime') <= date(?)");
    params.push(f.created_to);
  }
  if (f.completed_from) {
    conds.push("date(t.completed_at, 'localtime') >= date(?)");
    params.push(f.completed_from);
  }
  if (f.completed_to) {
    conds.push("date(t.completed_at, 'localtime') <= date(?)");
    params.push(f.completed_to);
  }
  if (f.overdue_only) {
    const today = localDateStr();
    conds.push(
      "t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status NOT IN ('completed', 'cancelled')",
    );
    params.push(today);
  }
  if (f.has_evidence) {
    conds.push(
      'EXISTS (SELECT 1 FROM task_attachments a WHERE a.task_id = t.id AND a.is_evidence = 1)',
    );
  }
  if (f.evidence_skipped) {
    conds.push(
      "EXISTS (SELECT 1 FROM task_activity_log l WHERE l.task_id = t.id AND l.action = 'evidence_skipped')",
    );
  }
  if (f.recurrence) {
    conds.push('t.recurrence = ?');
    params.push(f.recurrence);
  }
  if (f.deletion_requested) {
    conds.push(
      "EXISTS (SELECT 1 FROM task_delete_requests r WHERE r.task_id = t.id AND r.status = 'pending')",
    );
  }

  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

/** Role scope: employees see only their own tasks (same rule as the lists). */
function scopeClause(role: Role, userId: number): { sql: string; params: unknown[] } {
  if (role === 'employee') {
    return { sql: TASK_ROW_SCOPE_SQL, params: rowScopeParams(userId) };
  }
  return { sql: '', params: [] };
}

/** Whitelisted sort expression per field — raw input is never used as SQL.
 * NOTE: the assignee join is aliased `u` in SEARCH_SELECT (never `a`). */
const SORT_SQL: Record<SearchSortField, string> = {
  id: 't.id',
  title: 't.title COLLATE NOCASE',
  status: 't.status',
  priority:
    "CASE t.priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 ELSE 4 END",
  assignee: 'u.full_name COLLATE NOCASE',
  due_date: 't.due_date',
  created_at: 't.created_at',
  updated_at: 't.updated_at',
  completed_at: 't.completed_at',
};

function orderClause(f: TaskSearchFilters): string {
  return buildOrderClause(SORT_SQL[f.sort], f.dir);
}

// ─────────────────────────────── Search query ───────────────────────────────

export interface SearchTaskRow {
  id: number;
  title: string;
  description: string | null;
  blocker_note: string | null;
  status: string;
  priority: string;
  progress_percent: number;
  department: string;
  recurrence: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  assignee: string | null;
  creator: string | null;
  comments_count: number;
  evidence_count: number;
  delete_pending: number;
  /** Evidence filenames joined with "; " (never the BLOB content). */
  evidence_files: string | null;
  /** 1 when the closure flow logged evidence_skipped. */
  evidence_skipped: number;
}

const SEARCH_SELECT = `SELECT t.id, t.title, t.description, t.blocker_note, t.status, t.priority, t.progress_percent, t.department,
       t.recurrence, t.due_date, t.created_at, t.completed_at, t.updated_at,
       u.full_name AS assignee, cr.full_name AS creator,
       (SELECT COUNT(*) FROM task_comments c2 WHERE c2.task_id = t.id) AS comments_count,
       (SELECT COUNT(*) FROM task_attachments a2 WHERE a2.task_id = t.id AND a2.is_evidence = 1) AS evidence_count,
       (SELECT 1 FROM task_delete_requests r WHERE r.task_id = t.id AND r.status = 'pending' LIMIT 1) AS delete_pending,
       (SELECT group_concat(a3.file_name, '; ')
          FROM task_attachments a3 WHERE a3.task_id = t.id AND a3.is_evidence = 1) AS evidence_files,
       (SELECT 1 FROM task_activity_log l2 WHERE l2.task_id = t.id AND l2.action = 'evidence_skipped' LIMIT 1) AS evidence_skipped
FROM tasks t
LEFT JOIN users u  ON u.id  = t.assigned_to
LEFT JOIN users cr ON cr.id = t.created_by`;

export interface SearchResult {
  rows: SearchTaskRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Paged, sorted, filtered task search. `scope` carries the requesting user so
 * employees only see their own tasks. All SQL is parameterized.
 */
export async function searchTasks(
  f: TaskSearchFilters,
  scope: { role: Role; userId: number },
): Promise<SearchResult> {
  const db = getDb();
  // Scope condition ANDs with the filters; params are bound in text order.
  const merged = mergeWheres(buildSearchWhere(f), scopeClause(scope.role, scope.userId));

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS n FROM tasks t ${merged.sql}`)
    .get(...merged.params) as { n: number };
  const total = Number(totalRow.n);

  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;

  const rows = db
    .prepare(`${SEARCH_SELECT} ${merged.sql} ${orderClause(f)} LIMIT ? OFFSET ?`)
    .all(...merged.params, f.per_page, offset) as SearchTaskRow[];

  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

/**
 * Every row matching the filters (no pagination) — used by the CSV/XLSX
 * exports. Capped at EXPORT_MAX_ROWS so a careless query cannot dump the whole
 * database.
 */
export async function searchTaskRows(
  f: TaskSearchFilters,
  scope: { role: Role; userId: number },
): Promise<SearchTaskRow[]> {
  const db = getDb();
  const merged = mergeWheres(buildSearchWhere(f), scopeClause(scope.role, scope.userId));
  return db
    .prepare(`${SEARCH_SELECT} ${merged.sql} ${orderClause(f)} LIMIT ?`)
    .all(...merged.params, EXPORT_MAX_ROWS) as SearchTaskRow[];
}

// ─────────────────────────── Filter dropdown data ───────────────────────────


/** Active users (assignee filter dropdown) — same rule as listActiveUsers. */
export async function listSearchAssignees(): Promise<
  { id: number; full_name: string; role: string }[]
> {
  const db = getDb();
  return db
    .prepare('SELECT id, full_name, role FROM users WHERE is_active = 1 ORDER BY full_name ASC')
    .all() as { id: number; full_name: string; role: string }[];
}

/** Distinct departments present on tasks (for the department filter). */
export async function listSearchDepartments(): Promise<string[]> {
  const db = getDb();
  return (
    db
      .prepare('SELECT DISTINCT department FROM tasks ORDER BY department COLLATE NOCASE ASC')
      .all() as { department: string }[]
  ).map((r) => r.department);
}

/** Distinct task creators (for the creator filter). */
export async function listSearchCreators(): Promise<{ id: number; full_name: string }[]> {
  const db = getDb();
  return db
    .prepare(
      `SELECT DISTINCT u.id, u.full_name
       FROM tasks t JOIN users u ON u.id = t.created_by
       ORDER BY u.full_name COLLATE NOCASE ASC`,
    )
    .all() as { id: number; full_name: string }[];
}

// ─────────────────────────── Saved filters (per user) ───────────────────────────
// Backed by the saved_filters table (user child — ON DELETE CASCADE). Each row
// stores the raw query-string JSON so an "Apply" link can rebuild the exact URL.


export interface SavedFilter {
  id: number;
  name: string;
  filter_json: string;
  created_at: string;
}

/** All saved filters of a user, newest first. */
export async function listSavedFilters(userId: number): Promise<SavedFilter[]> {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, filter_json, created_at
       FROM saved_filters WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(userId) as SavedFilter[];
}

/** Insert a saved filter for the user. Returns the new id. */
export async function saveFilter(
  userId: number,
  name: string,
  filterJson: string,
): Promise<number> {
  const db = getDb();
  const res = db
    .prepare('INSERT INTO saved_filters (user_id, name, filter_json) VALUES (?, ?, ?)')
    .run(userId, name, filterJson);
  return Number(res.lastInsertRowid);
}

/** Delete a saved filter — owner only (returns false when not owned). */
export async function deleteSavedFilter(userId: number, id: number): Promise<boolean> {
  const db = getDb();
  const res = db
    .prepare('DELETE FROM saved_filters WHERE id = ? AND user_id = ?')
    .run(id, userId);
  return res.changes > 0;
}

/** Turn a stored filter_json back into a search URL (for the Apply link). */
export function savedFilterHref(json: string): string {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(parsed)) {
      if (v === null || v === undefined || v === '') continue;
      sp.set(k, String(v));
    }
    const qs = sp.toString();
    return qs ? `/search?${qs}` : '/search';
  } catch {
    return '/search';
  }
}
