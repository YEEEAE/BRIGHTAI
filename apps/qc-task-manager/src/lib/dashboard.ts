// Dashboard analytics layer for QC Task Manager.
//
// Every query here is READ-ONLY (SELECT) and fully parameterized (?) — no
// user input is ever interpolated into SQL text. Filter values are validated
// and typed in parseDashboardFilters before any query runs.
//
// The /dashboard page renders KPI cards, three charts (donut, bar, line) and
// two tables, all driven from this module so the page stays thin and the
// numbers are computed in one place.

import { getDb } from './db';
import { listActiveUsers } from './tasks';
import { parseDbDate } from './format';
import { setFlash } from './flash';
import type { AstroCookies } from 'astro';
import type { TaskPriority } from './types';

// ───────────────────── Status presentation (charts + legends) ─────────────────────
// Single source for the dashboard's status colors/labels so the KPI cards, the
// React charts island and the tables never drift apart.
export const STATUS_ORDER = ['not_started', 'in_progress', 'on_hold', 'completed'] as const;

export const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<string, string> = {
  not_started: '#ef4444', // red
  in_progress: '#f59e0b', // amber
  on_hold: '#f97316',     // orange
  completed: '#22c55e',   // green
};

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

// Active users for the assignee filter dropdown (reused from the task layer).
export { listActiveUsers } from './tasks';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─────────────────────────────── Filter model ───────────────────────────────

export interface DashboardFilters {
  /** created_at >= from (YYYY-MM-DD, inclusive) */
  from: string | null;
  /** created_at <= to (YYYY-MM-DD, inclusive) */
  to: string | null;
  /** assigned_to = assignee */
  assignee: number | null;
  priority: TaskPriority | null;
}

export const NO_FILTERS: DashboardFilters = {
  from: null,
  to: null,
  assignee: null,
  priority: null,
};

/** Today's date in the server's local timezone, as YYYY-MM-DD. */
export function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidDate(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function isPriority(v: string): v is TaskPriority {
  return (PRIORITIES as string[]).includes(v);
}

/** Anything exposing Astro's cookies API (the page frontmatter `Astro` global). */
interface CookieJar {
  cookies: AstroCookies;
}

/**
 * Parse + validate the ?from&to&assignee&priority query params.
 * Invalid values are dropped and reported via a one-shot flash so the user
 * knows why a filter had no effect. Never throws — always returns a safe
 * filter object.
 */
export function parseDashboardFilters(url: URL, jar: CookieJar): DashboardFilters {
  const f: DashboardFilters = { ...NO_FILTERS };
  const sp = url.searchParams;

  const from = sp.get('from');
  const to = sp.get('to');
  if (from) {
    if (isValidDate(from)) f.from = from;
    else setFlash(jar, 'error', 'Invalid "from" date — expected YYYY-MM-DD.');
  }
  if (to) {
    if (isValidDate(to)) f.to = to;
    else setFlash(jar, 'error', 'Invalid "to" date — expected YYYY-MM-DD.');
  }
  if (f.from && f.to && f.from > f.to) {
    setFlash(jar, 'error', '"From" date must be on or before the "to" date.');
    f.from = null;
    f.to = null;
  }

  const assignee = sp.get('assignee');
  if (assignee && assignee.trim() !== '') {
    const id = Number(assignee);
    if (Number.isInteger(id) && id > 0) f.assignee = id;
    else setFlash(jar, 'error', 'Invalid assignee filter.');
  }

  const priority = sp.get('priority');
  if (priority && priority.trim() !== '') {
    if (isPriority(priority)) f.priority = priority;
    else setFlash(jar, 'error', 'Invalid priority filter.');
  }

  return f;
}

/** True when any filter is active (drives the "Clear filters" affordance). */
export function hasActiveFilters(f: DashboardFilters): boolean {
  return Boolean(f.from || f.to || f.assignee !== null || f.priority);
}

/**
 * Build the shared, fully parameterized task WHERE clause. Callers add their
 * own extra conditions (with their own bound params); every condition is
 * joined with AND and the query text never contains raw user input.
 */
function whereClause(
  f: DashboardFilters,
  extra: Array<{ sql: string; params: unknown[] }> = [],
): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  // created_at is a UTC timestamp (datetime('now')); shift to the server's
  // LOCAL calendar day so filter boundaries match how dates are displayed
  // everywhere else in the app (formatDbDate parses UTC → renders local).
  if (f.from) {
    conds.push("date(t.created_at, 'localtime') >= date(?)");
    params.push(f.from);
  }
  if (f.to) {
    conds.push("date(t.created_at, 'localtime') <= date(?)");
    params.push(f.to);
  }
  if (f.assignee !== null) {
    conds.push('t.assigned_to = ?');
    params.push(f.assignee);
  }
  if (f.priority) {
    conds.push('t.priority = ?');
    params.push(f.priority);
  }
  const allConds = [...extra.map((e) => e.sql), ...conds];
  const allParams = [...extra.flatMap((e) => e.params), ...params];
  return {
    sql: allConds.length ? `WHERE ${allConds.join(' AND ')}` : '',
    params: allParams,
  };
}

// ─────────────────────────────── KPI cards ───────────────────────────────

export interface Kpis {
  total: number;
  not_started: number;
  in_progress: number;
  on_hold: number;
  completed: number;
  /** due_date before today AND status != 'completed' */
  overdue: number;
}

export function getKpis(f: DashboardFilters): Kpis {
  const db = getDb();
  const today = localToday();
  const { sql, params } = whereClause(f);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN t.status = 'not_started' THEN 1 ELSE 0 END), 0) AS not_started,
              COALESCE(SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress,
              COALESCE(SUM(CASE WHEN t.status = 'on_hold' THEN 1 ELSE 0 END), 0) AS on_hold,
              COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
              COALESCE(SUM(CASE WHEN t.due_date IS NOT NULL AND date(t.due_date) < date(?)
                                 AND t.status != 'completed' THEN 1 ELSE 0 END), 0) AS overdue
       FROM tasks t
       ${sql}`,
    )
    // Placeholder order follows the SQL text: the SELECT's date(?) comes BEFORE
    // the WHERE clause's filter placeholders, so `today` binds first.
    .get(today, ...params) as {
    total: number;
    not_started: number;
    in_progress: number;
    on_hold: number;
    completed: number;
    overdue: number;
  };

  return {
    total: Number(row.total),
    not_started: Number(row.not_started),
    in_progress: Number(row.in_progress),
    on_hold: Number(row.on_hold),
    completed: Number(row.completed),
    overdue: Number(row.overdue),
  };
}

// ─────────────────────── Donut: tasks by status ───────────────────────

export interface DonutSlice {
  status: string;
  label: string;
  color: string;
  count: number;
}

/** Counts per status, in a fixed order (zeros included) for the donut chart. */
export function getStatusDistribution(f: DashboardFilters): DonutSlice[] {
  const db = getDb();
  const { sql, params } = whereClause(f);
  const rows = db
    .prepare(`SELECT t.status, COUNT(*) AS count FROM tasks t ${sql} GROUP BY t.status`)
    .all(...params) as { status: string; count: number }[];
  const byStatus = new Map(rows.map((r) => [r.status, Number(r.count)]));
  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    count: byStatus.get(status) ?? 0,
  }));
}

// ─────────────────── Bar: tasks per employee ───────────────────

export interface EmployeeBar {
  user_id: number;
  full_name: string;
  total: number;
  statuses: DonutSlice[];
}

/** Sentinel user id for the "Unassigned" bar (tasks with no assignee, or whose
 * assignee is no longer active — those rows would otherwise vanish from the
 * chart while still counting in the KPI/donut totals). */
export const UNASSIGNED_USER_ID = -1;

/**
 * Assigned-task counts per ACTIVE user, split by status, sorted by total
 * (descending). Users with no assigned tasks in the filtered set appear with
 * zeroed statuses so the chart always reflects the full team. Tasks with no
 * assignee (or assigned to an inactive user) are rolled into an "Unassigned"
 * bar so the bar chart always reconciles with the donut total.
 */
export function getPerEmployee(f: DashboardFilters): EmployeeBar[] {
  const db = getDb();
  const users = listActiveUsers();
  const activeIds = new Set(users.map((u) => u.id));
  const { sql, params } = whereClause(f);
  const rows = db
    .prepare(
      `SELECT t.assigned_to, t.status, COUNT(*) AS count
       FROM tasks t
       ${sql}
       GROUP BY t.assigned_to, t.status`,
    )
    .all(...params) as { assigned_to: number | null; status: string; count: number }[];

  const byUser = new Map<number, Map<string, number>>();
  const unassigned = new Map<string, number>();
  for (const r of rows) {
    if (r.assigned_to === null || !activeIds.has(r.assigned_to)) {
      unassigned.set(r.status, (unassigned.get(r.status) ?? 0) + Number(r.count));
      continue;
    }
    if (!byUser.has(r.assigned_to)) byUser.set(r.assigned_to, new Map());
    byUser.get(r.assigned_to)!.set(r.status, Number(r.count));
  }

  const build = (id: number, name: string, counts: Map<string, number>): EmployeeBar => {
    const statuses = STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      color: STATUS_COLORS[status],
      count: counts.get(status) ?? 0,
    }));
    const total = statuses.reduce((sum, s) => sum + s.count, 0);
    return { user_id: id, full_name: name, total, statuses };
  };

  const result = users.map((u) => build(u.id, u.full_name, byUser.get(u.id) ?? new Map()));
  const unassignedTotal = [...unassigned.values()].reduce((a, b) => a + b, 0);
  if (unassignedTotal > 0) result.push(build(UNASSIGNED_USER_ID, 'Unassigned', unassigned));

  return result.sort((a, b) => b.total - a.total || a.full_name.localeCompare(b.full_name));
}

// ─────────────── Line: tasks completed per week ───────────────

export interface WeekPoint {
  /** ISO date (YYYY-MM-DD) of the week's Monday. */
  weekStart: string;
  label: string;
  count: number;
}

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

/** The last 8 week buckets (Monday-aligned, oldest first, current week last). */
export function last8Weeks(): WeekPoint[] {
  const thisMonday = startOfWeekLocal(new Date());
  const out: WeekPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const monday = new Date(thisMonday);
    monday.setDate(monday.getDate() - 7 * i);
    const label = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    out.push({ weekStart: isoDay(monday), label, count: 0 });
  }
  return out;
}

/**
 * Completions bucketed into the last 8 weeks (from completed_at, mapped onto
 * local calendar weeks). Weeks with no completions stay at zero.
 */
export function getCompletedPerWeek(f: DashboardFilters): WeekPoint[] {
  const db = getDb();
  const weeks = last8Weeks();
  const windowStart = weeks[0].weekStart; // Monday 8 weeks ago
  const { sql, params } = whereClause(f, [
    {
      // completed_at is a UTC timestamp; use the local calendar day so the SQL
      // window matches the JS week bucketing (parseDbDate → local Monday).
      sql: "t.status = 'completed' AND t.completed_at IS NOT NULL AND date(t.completed_at, 'localtime') >= date(?)",
      params: [windowStart],
    },
  ]);
  const rows = db
    .prepare(`SELECT t.completed_at FROM tasks t ${sql}`)
    .all(...params) as { completed_at: string }[];

  const index = new Map<string, number>();
  weeks.forEach((w, i) => index.set(w.weekStart, i));

  for (const r of rows) {
    const d = parseDbDate(r.completed_at);
    if (!d) continue;
    const key = isoDay(startOfWeekLocal(d));
    const i = index.get(key);
    if (i !== undefined) weeks[i].count += 1;
  }
  return weeks;
}

// ─────────────────────────────── Tables ───────────────────────────────

export interface OverdueRow {
  id: number;
  title: string;
  assignee_name: string | null;
  due_date: string;
  days_overdue: number;
}

/** Overdue = due before today AND not completed. Sorted by most overdue first. */
export function getOverdueTasks(f: DashboardFilters): OverdueRow[] {
  const db = getDb();
  const today = localToday();
  const { sql, params } = whereClause(f, [
    {
      sql: "t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status != 'completed'",
      params: [today],
    },
  ]);
  const rows = db
    .prepare(
      `SELECT t.id, t.title, t.due_date, u.full_name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       ${sql}
       ORDER BY date(t.due_date) ASC, t.id ASC
       LIMIT 50`,
    )
    .all(...params) as {
    id: number;
    title: string;
    due_date: string;
    assignee_name: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    assignee_name: r.assignee_name,
    due_date: r.due_date,
    days_overdue: daysBetween(r.due_date, today),
  }));
}

/** Whole days from `fromIso` (inclusive) to `toIso` (exclusive), local calendar. */
function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const a = new Date(fy, fm - 1, fd);
  const b = new Date(ty, tm - 1, td);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface RecentRow {
  id: number;
  title: string;
  completed_by_name: string | null;
  completed_at: string;
}

/** The 10 most recently completed tasks (completed_by joined for the name). */
export function getRecentlyCompleted(f: DashboardFilters): RecentRow[] {
  const db = getDb();
  const { sql, params } = whereClause(f, [
    { sql: "t.status = 'completed' AND t.completed_at IS NOT NULL", params: [] },
  ]);
  return db
    .prepare(
      `SELECT t.id, t.title, t.completed_at, u.full_name AS completed_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.completed_by
       ${sql}
       ORDER BY t.completed_at DESC, t.id DESC
       LIMIT 10`,
    )
    .all(...params) as RecentRow[];
}
