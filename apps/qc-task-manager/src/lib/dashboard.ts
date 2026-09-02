// Dashboard analytics layer for QC Task Manager.
//
// Every query here is READ-ONLY (SELECT) and fully parameterized (?) — no
// user input is ever interpolated into SQL text. Filter values are validated
// and typed in parseDashboardFilters before any query runs.
//
// The /dashboard page renders KPI cards, six charts and five tables, all
// driven from this module so the page stays thin and every number is computed
// in one place. Filters scope every widget through the same WHERE clause.
//
// Overdue definition (spec): due_date < today AND status NOT IN
// ('completed', 'cancelled'). Applied identically in the KPI, the overdue
// table and the overdue-by-employee chart.

import { getDb } from './db';
import { listActiveUsers } from './tasks';
import { parseDbDate } from './format';
import { setFlash } from './flash';
import { FINDING_CLASSIFICATIONS, RISK_LEVELS, TASK_PRIORITIES, TASK_STATUSES } from './task-policy';
import { SLA_STATUSES } from './sla';
import type { AstroCookies } from 'astro';
import type { FindingClassification, RiskLevel, TaskPriority, TaskStatus } from './types';
import type { SlaStatus } from './sla';

// ───────────────────── Status presentation (charts + legends) ─────────────────────
// Single source for the dashboard's status colors/labels so the KPI cards, the
// React charts island and the tables never drift apart.
export const STATUS_ORDER = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const;

export const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  not_started: '#ef4444', // red
  in_progress: '#f59e0b', // amber
  on_hold: '#f97316',     // orange
  completed: '#22c55e',   // green
  cancelled: '#64748b',   // slate
};

// Priority colors + labels — single source for the priority chart + legends.
// Urgent is a vivid red so it always reads as "act now".
export const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#0ea5e9',     // sky
  medium: '#6366f1',  // indigo
  high: '#f43f5e',    // rose
  urgent: '#dc2626',  // red-600 (solid, prominent)
};

// Filter option lists — single source is task-policy's enum arrays; never
// hardcode a second list here.
export const PRIORITIES: readonly TaskPriority[] = TASK_PRIORITIES;
export const STATUSES: readonly TaskStatus[] = TASK_STATUSES;

// Active users for the assignee filter dropdown (reused from the task layer).
export { listActiveUsers } from './tasks';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─────────────────────────────── Filter model ───────────────────────────────

/** Range presets — resolved to from/to on the local calendar before queries. */
export type RangePreset = 'today' | 'week' | 'month' | 'custom';

export const RANGE_PRESETS: RangePreset[] = ['today', 'week', 'month', 'custom'];

export interface DashboardFilters {
  /** created_at >= from (YYYY-MM-DD, inclusive) — resolved from range or from/to. */
  from: string | null;
  /** created_at <= to (YYYY-MM-DD, inclusive) — resolved from range or from/to. */
  to: string | null;
  /** The raw preset the user picked (drives the dropdown's selected option). */
  range: RangePreset | null;
  /** assigned_to = assignee */
  assignee: number | null;
  department: string | null;
  supervisor: number | null;
  priority: TaskPriority | null;
  status: TaskStatus | null;
  risk: RiskLevel | null;
  finding_classification: FindingClassification | null;
  sla_status: SlaStatus | null;
  /** Overdue-only switch: restrict every widget to overdue tasks. */
  overdue_only: boolean;
}

export const NO_FILTERS: DashboardFilters = {
  from: null,
  to: null,
  range: null,
  assignee: null,
  department: null,
  supervisor: null,
  priority: null,
  status: null,
  risk: null,
  finding_classification: null,
  sla_status: null,
  overdue_only: false,
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

function isStatus(v: string): v is TaskStatus {
  return (STATUSES as string[]).includes(v);
}

function isRisk(v: string): v is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(v);
}

function isFindingClassification(v: string): v is FindingClassification {
  return (FINDING_CLASSIFICATIONS as readonly string[]).includes(v);
}

function isSlaStatus(v: string): v is SlaStatus {
  return (SLA_STATUSES as readonly string[]).includes(v.toUpperCase());
}

function isRangePreset(v: string): v is RangePreset {
  return (RANGE_PRESETS as string[]).includes(v);
}

/** Local ISO date n days from today (negative = past). */
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Resolve a range preset to a {from, to} window on the local calendar.
 * - today:  from = to = today
 * - week:   from = this week's Monday, to = today (ISO weeks, Monday-first)
 * - month:  from = first of this month, to = today
 * Never extends into the future — `to` is clamped to today so partial weeks/
 * months show the in-progress picture rather than an empty future window.
 */
export function resolveRange(range: RangePreset): { from: string; to: string } {
  const today = localToday();
  if (range === 'today') return { from: today, to: today };
  if (range === 'week') {
    const d = new Date();
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    // JS getDay: 0 = Sunday … 6 = Saturday. Shift so Monday = 0.
    const sinceMonday = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - sinceMonday);
    const from = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    return { from, to: today };
  }
  // month
  const d = new Date();
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  return { from, to: today };
}

/** Anything exposing Astro's cookies API (the page frontmatter `Astro` global). */
interface CookieJar {
  cookies: AstroCookies;
}

/**
 * Parse + validate the dashboard query params:
 *   ?range=today|week|month|custom &from=YYYY-MM-DD &to=YYYY-MM-DD
 *   &assignee=<id> &priority=<p> &status=<s> &overdue=1
 *
 * Range resolution:
 *   - range=today/week/month → from/to computed on the local calendar (any
 *     from/to in the URL is ignored).
 *   - range=custom (or absent) with from/to in the URL → those exact dates.
 *   - nothing → no date filter (all tasks).
 *
 * Invalid values are dropped and reported via a one-shot flash so the user
 * knows why a filter had no effect. Never throws — always returns a safe
 * filter object.
 */
export function parseDashboardFilters(url: URL, jar: CookieJar): DashboardFilters {
  const f: DashboardFilters = { ...NO_FILTERS };
  const sp = url.searchParams;

  // ── Date window (range preset first, then explicit from/to) ──
  const rangeParam = sp.get('range');
  if (rangeParam && isRangePreset(rangeParam) && rangeParam !== 'custom') {
    f.range = rangeParam;
    const { from, to } = resolveRange(rangeParam);
    f.from = from;
    f.to = to;
  } else {
    f.range = rangeParam === 'custom' ? 'custom' : null;
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
  }

  const assignee = sp.get('assignee') ?? sp.get('employee');
  if (assignee && assignee.trim() !== '') {
    const id = Number(assignee);
    if (Number.isInteger(id) && id > 0) f.assignee = id;
    else setFlash(jar, 'error', 'Invalid assignee filter.');
  }

  const department = sp.get('department')?.trim();
  if (department) {
    if (department.length <= 50) f.department = department;
    else setFlash(jar, 'error', 'Invalid department filter.');
  }

  const supervisor = sp.get('supervisor');
  if (supervisor && supervisor.trim() !== '') {
    const id = Number(supervisor);
    if (Number.isInteger(id) && id > 0) f.supervisor = id;
    else setFlash(jar, 'error', 'Invalid supervisor filter.');
  }

  const priority = sp.get('priority');
  if (priority && priority.trim() !== '') {
    if (isPriority(priority)) f.priority = priority;
    else setFlash(jar, 'error', 'Invalid priority filter.');
  }

  const status = sp.get('status');
  if (status && status.trim() !== '') {
    if (isStatus(status)) f.status = status;
    else setFlash(jar, 'error', 'Invalid status filter.');
  }

  const risk = sp.get('risk');
  if (risk && risk.trim() !== '') {
    if (isRisk(risk)) f.risk = risk;
    else setFlash(jar, 'error', 'Invalid risk filter.');
  }

  const classification = sp.get('finding_classification');
  if (classification && classification.trim() !== '') {
    if (isFindingClassification(classification)) f.finding_classification = classification;
    else setFlash(jar, 'error', 'Invalid finding classification filter.');
  }

  const slaStatus = sp.get('sla_status');
  if (slaStatus && slaStatus.trim() !== '') {
    const normalized = slaStatus.toUpperCase();
    if (isSlaStatus(normalized)) f.sla_status = normalized;
    else setFlash(jar, 'error', 'Invalid SLA status filter.');
  }

  const overdue = sp.get('overdue');
  if (overdue === '1' || overdue === 'true') f.overdue_only = true;

  return f;
}

/** True when any filter is active (drives the "Clear filters" affordance). */
export function hasActiveFilters(f: DashboardFilters): boolean {
  return Boolean(
    f.from || f.to || f.assignee !== null || f.department || f.supervisor !== null || f.priority || f.status || f.risk || f.finding_classification || f.sla_status || f.overdue_only,
  );
}

/** Rebuild the querystring for the current filters (used by the clear link). */
export function filterQuerystring(f: DashboardFilters): string {
  const sp = new URLSearchParams();
  if (f.range && f.range !== 'custom') sp.set('range', f.range);
  else if (f.from || f.to) {
    sp.set('range', 'custom');
    if (f.from) sp.set('from', f.from);
    if (f.to) sp.set('to', f.to);
  }
  if (f.assignee !== null) sp.set('assignee', String(f.assignee));
  if (f.department) sp.set('department', f.department);
  if (f.supervisor !== null) sp.set('supervisor', String(f.supervisor));
  if (f.priority) sp.set('priority', f.priority);
  if (f.status) sp.set('status', f.status);
  if (f.risk) sp.set('risk', f.risk);
  if (f.finding_classification) sp.set('finding_classification', f.finding_classification);
  if (f.sla_status) sp.set('sla_status', f.sla_status);
  if (f.overdue_only) sp.set('overdue', '1');
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Build the shared, fully parameterized task WHERE clause. Callers add their
 * own extra conditions (with their own bound params); every condition is
 * joined with AND and the query text never contains raw user input.
 *
 * The "extra" conditions are placed FIRST in the text (so a caller can put a
 * `date(?)` in the SELECT and bind its param before the WHERE params — see
 * getKpis). All params are returned in the exact order they appear in the SQL.
 */
function whereClause(
  f: DashboardFilters,
  extra: Array<{ sql: string; params: unknown[] }> = [],
): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
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
  if (f.department) {
    conds.push('t.department = ?');
    params.push(f.department);
  }
  if (f.supervisor !== null) {
    conds.push('t.created_by = ?');
    params.push(f.supervisor);
  }
  if (f.priority) {
    conds.push('t.priority = ?');
    params.push(f.priority);
  }
  if (f.status) {
    conds.push('t.status = ?');
    params.push(f.status);
  }
  if (f.risk) {
    conds.push('t.risk_level = ?');
    params.push(f.risk);
  }
  if (f.finding_classification) {
    conds.push('t.finding_classification = ?');
    params.push(f.finding_classification);
  }
  if (f.sla_status) {
    conds.push('t.sla_status = ?');
    params.push(f.sla_status);
  }
  if (f.overdue_only) {
    const today = localToday();
    conds.push(
      "t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status NOT IN ('completed', 'cancelled')",
    );
    params.push(today);
  }
  const allConds = [...extra.map((e) => e.sql), ...conds];
  const allParams = [...extra.flatMap((e) => e.params), ...params];
  return {
    sql: allConds.length ? `WHERE ${allConds.join(' AND ')}` : '',
    params: allParams,
  };
}

/**
 * A WHERE clause scoped to a SPECIFIC date window (used by the completion-rate
 * comparison so we can compute the previous period independently). Other
 * filters (assignee/priority) still apply; status/overdue_only are dropped
 * because they would distort the ratio's meaning.
 */
function whereClauseForWindow(
  f: DashboardFilters,
  from: string | null,
  to: string | null,
): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (from) {
    conds.push("date(t.created_at, 'localtime') >= date(?)");
    params.push(from);
  }
  if (to) {
    conds.push("date(t.created_at, 'localtime') <= date(?)");
    params.push(to);
  }
  if (f.assignee !== null) {
    conds.push('t.assigned_to = ?');
    params.push(f.assignee);
  }
  if (f.department) {
    conds.push('t.department = ?');
    params.push(f.department);
  }
  if (f.supervisor !== null) {
    conds.push('t.created_by = ?');
    params.push(f.supervisor);
  }
  if (f.priority) {
    conds.push('t.priority = ?');
    params.push(f.priority);
  }
  if (f.risk) {
    conds.push('t.risk_level = ?');
    params.push(f.risk);
  }
  if (f.finding_classification) {
    conds.push('t.finding_classification = ?');
    params.push(f.finding_classification);
  }
  if (f.sla_status) {
    conds.push('t.sla_status = ?');
    params.push(f.sla_status);
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

// ─────────────────────────────── KPI cards ───────────────────────────────

export interface Kpis {
  total: number;
  not_started: number;
  in_progress: number;
  on_hold: number;
  completed: number;
  /** status = 'cancelled' (manager/admin cancel flow) */
  cancelled: number;
  /** due_date before today AND status NOT IN ('completed', 'cancelled') */
  overdue: number;
  /** priority = 'urgent' AND status NOT IN ('completed', 'cancelled') */
  urgent_open: number;
  /** status = 'completed' with NO is_evidence=1 attachment */
  completed_without_evidence: number;
  /**
   * KPI canonical definition (PROMPT-07 / P2-2): Average Completion Time =
   * AVG(completed_at − created_at) — task creation → technician completion.
   * null when no completed task qualifies.
   */
  avg_completion_seconds: number | null;
  /** Denominator of avg_completion_seconds (completed tasks in scope). */
  avg_completion_n: number;
  /**
   * Average Work Duration = AVG(completed_at − started_at) — work start →
   * technician completion (excludes queue wait). This replaces the former
   * duplicate "Average Resolution" card, which showed the same number as
   * Average Completion Time.
   */
  avg_work_seconds: number | null;
  /** Denominator of avg_work_seconds (completed tasks with started_at). */
  avg_work_n: number;
  sla_compliance_percent: number;
  /** Denominator of sla_compliance_percent (completed tasks with an SLA). */
  sla_compliance_n: number;
  sla_at_risk: number;
  sla_critical: number;
  sla_breached: number;
  avg_sla_consumption_percent: number | null;
  /** Denominator of avg_sla_consumption_percent (SLA-tracked tasks). */
  avg_sla_consumption_n: number;
}

/**
 * Refresh dashboard SLA snapshots in one set-based UPDATE. The previous
 * implementation selected every task and called refreshTaskSla once per row,
 * creating an N+1 query pattern on every dashboard request. Escalation events
 * remain mutation/scheduler responsibilities; the dashboard only needs the
 * current read model for its aggregates.
 */
function refreshAllSla(): void {
  const db = getDb();
  db.prepare(`
    UPDATE tasks AS t
    SET
      sla_elapsed_seconds = MAX(
        t.sla_elapsed_seconds,
        CAST(MAX(0, (julianday(
          CASE WHEN p.pause_on_hold = 1 AND t.status = 'on_hold' AND t.sla_paused_at IS NOT NULL
               THEN t.sla_paused_at ELSE datetime('now') END
        ) - julianday(t.sla_started_at)) * 86400.0) AS INTEGER)
      ),
      sla_remaining_seconds = CAST((julianday(t.sla_due_at) - julianday(
        CASE WHEN p.pause_on_hold = 1 AND t.status = 'on_hold' AND t.sla_paused_at IS NOT NULL
             THEN t.sla_paused_at ELSE datetime('now') END
      )) * 86400.0 AS INTEGER),
      sla_percent_used = ROUND(
        100.0 * MAX(
          t.sla_elapsed_seconds,
          CAST(MAX(0, (julianday(
            CASE WHEN p.pause_on_hold = 1 AND t.status = 'on_hold' AND t.sla_paused_at IS NOT NULL
                 THEN t.sla_paused_at ELSE datetime('now') END
          ) - julianday(t.sla_started_at)) * 86400.0) AS INTEGER)
        ) / NULLIF((julianday(t.sla_due_at) - julianday(t.sla_started_at)) * 86400.0, 0), 2),
      sla_status = CASE
        WHEN p.pause_on_hold = 1 AND t.status = 'on_hold' AND t.sla_paused_at IS NOT NULL THEN 'PAUSED'
        WHEN (julianday(t.sla_due_at) - julianday(datetime('now'))) < 0 THEN 'BREACHED'
        WHEN 100.0 * MAX(t.sla_elapsed_seconds, CAST(MAX(0, (julianday(datetime('now')) - julianday(t.sla_started_at)) * 86400.0) AS INTEGER)) / NULLIF((julianday(t.sla_due_at) - julianday(t.sla_started_at)) * 86400.0, 0) >= p.critical_percent THEN 'CRITICAL'
        WHEN 100.0 * MAX(t.sla_elapsed_seconds, CAST(MAX(0, (julianday(datetime('now')) - julianday(t.sla_started_at)) * 86400.0) AS INTEGER)) / NULLIF((julianday(t.sla_due_at) - julianday(t.sla_started_at)) * 86400.0, 0) >= p.warning_percent THEN 'AT_RISK'
        ELSE 'NORMAL'
      END
    FROM sla_policies AS p
    WHERE t.sla_started_at IS NOT NULL AND t.sla_due_at IS NOT NULL AND p.id = t.sla_policy_id
  `).run();
}

export function getKpis(f: DashboardFilters): Kpis {
  const db = getDb();
  refreshAllSla();
  const today = localToday();
  const { sql, params } = whereClause(f);
  // NOTE on placeholder order: SQLite binds placeholders in the order they
  // appear in the text. The SELECT contains date(?) (for the overdue CASE)
  // BEFORE the WHERE clause, so `today` must bind FIRST, then the WHERE params.
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN t.status = 'not_started' THEN 1 ELSE 0 END), 0) AS not_started,
              COALESCE(SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress,
              COALESCE(SUM(CASE WHEN t.status = 'on_hold' THEN 1 ELSE 0 END), 0) AS on_hold,
              COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
              COALESCE(SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled,
              COALESCE(SUM(CASE WHEN t.due_date IS NOT NULL AND date(t.due_date) < date(?)
                                 AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END), 0) AS overdue,
              COALESCE(SUM(CASE WHEN t.priority = 'urgent'
                                 AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END), 0) AS urgent_open,
              COALESCE(SUM(CASE WHEN t.status = 'completed'
                                 AND NOT EXISTS (
                                   SELECT 1 FROM task_attachments a
                                   WHERE a.task_id = t.id AND a.is_evidence = 1
                                 ) THEN 1 ELSE 0 END), 0) AS completed_without_evidence
       FROM tasks t
       ${sql}`,
    )
    .get(today, ...params) as {
    total: number;
    not_started: number;
    in_progress: number;
    on_hold: number;
    completed: number;
    cancelled: number;
    overdue: number;
    urgent_open: number;
    completed_without_evidence: number;
  };

  // Average Completion Time (creation → technician completion) = AVG(
  // completed_at − created_at) for completed tasks, plus its denominator N.
  // Computed separately so the heavyweight AVG/julianday does not interfere
  // with the COUNT query's placeholder order. The status/timestamp conditions
  // ride in `extra` so the WHERE/AND shape stays correct whether or not the
  // user picked filters.
  const { sql: avgSql, params: avgParams } = whereClause(f, [
    {
      sql: "t.status = 'completed' AND t.completed_at IS NOT NULL",
      params: [],
    },
  ]);
  const avgRow = db
    .prepare(
      `SELECT AVG((julianday(t.completed_at) - julianday(t.created_at)) * 86400.0) AS avg_seconds,
              COUNT(*) AS n
       FROM tasks t
       ${avgSql}`,
    )
    .get(...avgParams) as { avg_seconds: number | null; n: number } | undefined;

  const avgSeconds = avgRow?.avg_seconds ?? null;
  const avgCompletionN = Number(avgRow?.n ?? 0);

  // Average Work Duration (work start → completion) — the metric the former
  // duplicate "Average Resolution" card mislabeled.
  const { sql: workSql, params: workParams } = whereClause(f, [
    {
      sql: "t.status = 'completed' AND t.completed_at IS NOT NULL AND t.started_at IS NOT NULL",
      params: [],
    },
  ]);
  const workRow = db
    .prepare(
      `SELECT AVG((julianday(t.completed_at) - julianday(t.started_at)) * 86400.0) AS avg_seconds,
              COUNT(*) AS n
       FROM tasks t
       ${workSql}`,
    )
    .get(...workParams) as { avg_seconds: number | null; n: number } | undefined;

  const avgWorkSeconds = workRow?.avg_seconds ?? null;
  const avgWorkN = Number(workRow?.n ?? 0);

  const { sql: slaSql, params: slaParams } = whereClause(f);
  const slaRow = db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN t.sla_status = 'AT_RISK' THEN 1 ELSE 0 END), 0) AS at_risk,
       COALESCE(SUM(CASE WHEN t.sla_status = 'CRITICAL' THEN 1 ELSE 0 END), 0) AS critical,
       COALESCE(SUM(CASE WHEN t.sla_status = 'BREACHED' THEN 1 ELSE 0 END), 0) AS breached,
       AVG(CASE WHEN t.sla_started_at IS NOT NULL THEN t.sla_percent_used END) AS avg_consumption,
       COALESCE(SUM(CASE WHEN t.sla_started_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS consumption_n,
       COALESCE(SUM(CASE WHEN t.status = 'completed' AND t.sla_started_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS compliance_n,
       CASE WHEN SUM(CASE WHEN t.status = 'completed' AND t.sla_started_at IS NOT NULL THEN 1 ELSE 0 END) = 0 THEN 0
            ELSE ROUND(100.0 * SUM(CASE WHEN t.status = 'completed' AND t.sla_started_at IS NOT NULL AND t.sla_percent_used <= 100 THEN 1 ELSE 0 END)
              / SUM(CASE WHEN t.status = 'completed' AND t.sla_started_at IS NOT NULL THEN 1 ELSE 0 END), 2) END AS compliance
     FROM tasks t ${slaSql}`,
  ).get(...slaParams) as {
    at_risk: number;
    critical: number;
    breached: number;
    avg_consumption: number | null;
    consumption_n: number;
    compliance_n: number;
    compliance: number;
  };

  return {
    total: Number(row.total),
    not_started: Number(row.not_started),
    in_progress: Number(row.in_progress),
    on_hold: Number(row.on_hold),
    completed: Number(row.completed),
    cancelled: Number(row.cancelled),
    overdue: Number(row.overdue),
    urgent_open: Number(row.urgent_open),
    completed_without_evidence: Number(row.completed_without_evidence),
    avg_completion_seconds: avgSeconds == null ? null : Number(avgSeconds),
    avg_completion_n: avgCompletionN,
    avg_work_seconds: avgWorkSeconds == null ? null : Number(avgWorkSeconds),
    avg_work_n: avgWorkN,
    sla_compliance_percent: Number(slaRow.compliance),
    sla_compliance_n: Number(slaRow.compliance_n),
    sla_at_risk: Number(slaRow.at_risk),
    sla_critical: Number(slaRow.critical),
    sla_breached: Number(slaRow.breached),
    avg_sla_consumption_percent: slaRow.avg_consumption == null ? null : Number(slaRow.avg_consumption),
    avg_sla_consumption_n: Number(slaRow.consumption_n),
  };
}

// ───────────────────── Executive-metric formatting (PROMPT-07) ─────────────────────
// Business rule: a KPI whose denominator is zero renders "N/A (N=0)" — never a
// misleading 0 hours / 0% / 100%. The denominators come from the same queries
// as the values, so the number and its N can never drift apart.

/** "2d 6h"-style duration used by the dashboard KPI cards. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  if (seconds < 60) return '< 1m';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours === 0 ? `${days}d` : `${days}d ${remHours}h`;
}

/** Duration KPI with its denominator; N = 0 → "N/A (N=0)". */
export function formatKpiDuration(seconds: number | null, n: number): string {
  if (n <= 0) return 'N/A (N=0)';
  return formatDuration(seconds);
}

/** Percentage KPI with its denominator; N = 0 → "N/A (N=0)". */
export function formatKpiPercent(value: number | null, n: number): string {
  if (n <= 0) return 'N/A (N=0)';
  return value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;
}

/** Average checklist completion across tasks in the current dashboard scope. */
export function getChecklistCompletion(f: DashboardFilters): { completed: number; total: number; percent: number } {
  const db = getDb();
  const { sql, params } = whereClause(f);
  const row = db.prepare(`SELECT COALESCE(SUM((SELECT COUNT(*) FROM task_checklists c WHERE c.task_id = t.id AND c.is_completed = 1)), 0) AS completed,
                                COALESCE(SUM((SELECT COUNT(*) FROM task_checklists c WHERE c.task_id = t.id)), 0) AS total
                         FROM tasks t ${sql}`).get(...params) as { completed: number; total: number };
  const total = Number(row.total); const completed = Number(row.completed);
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
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

// ─────────────────────── Bar: tasks by priority ───────────────────────

export interface PrioritySlice {
  priority: string;
  label: string;
  color: string;
  count: number;
}

/** Counts per priority, in a fixed order (zeros included) for the bar chart. */
export function getPriorityDistribution(f: DashboardFilters): PrioritySlice[] {
  const db = getDb();
  const { sql, params } = whereClause(f);
  const rows = db
    .prepare(`SELECT t.priority, COUNT(*) AS count FROM tasks t ${sql} GROUP BY t.priority`)
    .all(...params) as { priority: string; count: number }[];
  const byPriority = new Map(rows.map((r) => [r.priority, Number(r.count)]));
  return PRIORITY_ORDER.map((priority) => ({
    priority,
    label: PRIORITY_LABELS[priority],
    color: PRIORITY_COLORS[priority],
    count: byPriority.get(priority) ?? 0,
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

// ─────────────────── Bar: overdue tasks per employee ───────────────────

export interface OverdueEmployee {
  user_id: number;
  full_name: string;
  count: number;
}

/**
 * Overdue-task counts per ACTIVE user (overdue = due before today AND status
 * NOT IN completed/cancelled). Sorted by count descending. Includes an
 * "Unassigned" row when there are overdue tasks without an active assignee.
 */
export function getOverdueByEmployee(f: DashboardFilters): OverdueEmployee[] {
  const db = getDb();
  const users = listActiveUsers();
  const activeIds = new Set(users.map((u) => u.id));
  const today = localToday();
  const { sql, params } = whereClause(f, [
    {
      sql: "t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status NOT IN ('completed', 'cancelled')",
      params: [today],
    },
  ]);
  const rows = db
    .prepare(
      `SELECT t.assigned_to, COUNT(*) AS count
       FROM tasks t
       ${sql}
       GROUP BY t.assigned_to`,
    )
    .all(...params) as { assigned_to: number | null; count: number }[];

  const byId = new Map<number, number>();
  let unassigned = 0;
  for (const r of rows) {
    if (r.assigned_to === null || !activeIds.has(r.assigned_to)) {
      unassigned += Number(r.count);
    } else {
      byId.set(r.assigned_to, (byId.get(r.assigned_to) ?? 0) + Number(r.count));
    }
  }

  const result: OverdueEmployee[] = users
    .map((u) => ({ user_id: u.id, full_name: u.full_name, count: byId.get(u.id) ?? 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count || a.full_name.localeCompare(b.full_name));
  if (unassigned > 0) {
    result.push({ user_id: UNASSIGNED_USER_ID, full_name: 'Unassigned', count: unassigned });
  }
  return result;
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

// ─────────────── Gauge: completion rate vs previous period ───────────────

export interface CompletionRate {
  /** Current window [from, to] (defaults to the last 30 days when unfiltered). */
  current_from: string;
  current_to: string;
  /** Previous window (same length, immediately before the current one). */
  previous_from: string;
  previous_to: string;
  /** completed / total in the current window (0–1, or null when total = 0). */
  current: number | null;
  /** completed / total in the previous window (0–1, or null when total = 0). */
  previous: number | null;
  /** Percentage-point change (current − previous), or null if either is null. */
  delta_pp: number | null;
}

/**
 * Completion rate for the filtered window, compared to the immediately
 * preceding window of the same length.
 *
 *   completion rate = completed tasks / total tasks (by created_at)
 *
 * The date window comes from the dashboard filters (from/to). With no date
 * filter the window defaults to the last 30 days so the metric is always
 * meaningful. Status + overdue_only filters are intentionally NOT applied
 * here — they would make the ratio trivial (e.g. status=completed → 100%).
 * Assignee and priority DO apply, so a manager can scope the rate to a person.
 */
export function getCompletionRate(f: DashboardFilters): CompletionRate {
  const db = getDb();
  // Default window: last 30 days when no date filter is active. NOTE the
  // negative offset — isoDaysFromToday ADDS `days` to today, so -29 gives the
  // start of the 30-day window ending today (today-29 … today inclusive).
  const currentFrom = f.from ?? isoDaysFromToday(-29);
  const currentTo = f.to ?? localToday();

  // Length of the current window in days (inclusive of both endpoints). Clamp
  // to at least 1 so the previous window is well-formed for a single-day range.
  const lenDays = Math.max(1, daysBetween(currentFrom, currentTo) + 1);
  const previousTo = isoOffset(currentFrom, -1);
  const previousFrom = isoOffset(previousTo, -(lenDays - 1));

  const compute = (from: string, to: string): { rate: number | null; completed: number; total: number } => {
    const { sql, params } = whereClauseForWindow(f, from, to);
    const row = db
      .prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed
         FROM tasks t
         ${sql}`,
      )
      .all(...params) as { total: number; completed: number }[];
    const total = row.length > 0 ? Number(row[0].total) : 0;
    const completed = row.length > 0 ? Number(row[0].completed) : 0;
    return { rate: total > 0 ? completed / total : null, completed, total };
  };

  const cur = compute(currentFrom, currentTo);
  const prev = compute(previousFrom, previousTo);
  const delta = cur.rate !== null && prev.rate !== null ? (cur.rate - prev.rate) * 100 : null;

  return {
    current_from: currentFrom,
    current_to: currentTo,
    previous_from: previousFrom,
    previous_to: previousTo,
    current: cur.rate,
    previous: prev.rate,
    delta_pp: delta,
  };
}

/** Whole days from `fromIso` (inclusive) to `toIso` (inclusive). */
function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const a = new Date(fy, fm - 1, fd);
  const b = new Date(ty, tm - 1, td);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** ISO date offset from `baseIso` by `days` days (negative = earlier). */
function isoOffset(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────── Tables ───────────────────────────────

export interface OverdueRow {
  id: number;
  title: string;
  assignee_name: string | null;
  due_date: string;
  days_overdue: number;
}

/** Overdue = due before today AND not completed/cancelled. Sorted by most overdue first. */
export function getOverdueTasks(f: DashboardFilters): OverdueRow[] {
  const db = getDb();
  const today = localToday();
  const { sql, params } = whereClause(f, [
    {
      sql: "t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status NOT IN ('completed', 'cancelled')",
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

export interface WithoutEvidenceRow {
  id: number;
  title: string;
  assignee_name: string | null;
  completed_at: string;
}

/**
 * Completed tasks that have NO is_evidence=1 attachment. These are surfaced
 * separately so reviewers can chase missing proof-of-work on completed items.
 */
export function getCompletedWithoutEvidence(f: DashboardFilters): WithoutEvidenceRow[] {
  const db = getDb();
  const { sql, params } = whereClause(f, [
    {
      sql:
        "t.status = 'completed' AND NOT EXISTS (SELECT 1 FROM task_attachments a WHERE a.task_id = t.id AND a.is_evidence = 1)",
      params: [],
    },
  ]);
  return db
    .prepare(
      `SELECT t.id, t.title, t.completed_at, u.full_name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       ${sql}
       ORDER BY t.completed_at DESC, t.id DESC
       LIMIT 25`,
    )
    .all(...params) as WithoutEvidenceRow[];
}

export interface BlockerRow {
  id: number;
  title: string;
  assignee_name: string | null;
  blocker_note: string;
  on_hold_since: string | null;
}

/**
 * Current blockers — tasks that are on hold (status = 'on_hold'). Includes the
 * blocker note (required when moving to on_hold) and the last update time so a
 * manager can see at a glance what is stuck and for how long.
 */
export function getCurrentBlockers(f: DashboardFilters): BlockerRow[] {
  const db = getDb();
  const { sql, params } = whereClause(f, [
    { sql: "t.status = 'on_hold'", params: [] },
  ]);
  return db
    .prepare(
      `SELECT t.id, t.title, t.blocker_note, t.updated_at AS on_hold_since, u.full_name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       ${sql}
       ORDER BY t.updated_at DESC, t.id DESC
       LIMIT 25`,
    )
    .all(...params) as BlockerRow[];
}

export interface ActivityRow {
  id: number;
  task_id: number;
  task_title: string;
  user_name: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

/**
 * The latest 20 activity entries across all tasks (the dashboard feed). The
 * task filters (assignee/priority/status/overdue_only + date window on the
 * task's created_at) scope the feed via the JOIN, so a manager viewing a given
 * assignee sees that person's recent activity. `t.*` columns resolve through
 * the JOIN, so the shared whereClause drops in unchanged.
 */
export function getLatestActivity(f: DashboardFilters): ActivityRow[] {
  const db = getDb();
  const { sql, params } = whereClause(f);
  return db
    .prepare(
      `SELECT a.id, a.task_id, t.title AS task_title, u.full_name AS user_name,
              a.action, a.old_value, a.new_value, a.created_at
       FROM task_activity_log a
       JOIN tasks t ON t.id = a.task_id
       JOIN users u ON u.id = a.user_id
       ${sql}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT 20`,
    )
    .all(...params) as ActivityRow[];
}
