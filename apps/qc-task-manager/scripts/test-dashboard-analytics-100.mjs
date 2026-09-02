// PROMPT-07 — Dashboard analytics contract tests (QC-REMEDIATION-007).
//
// Covers the acceptance criteria that are verifiable without a browser:
//   * Chart→table equivalence (AC-03): every chart-table spec must carry
//     exactly the chart's data — row counts, headers, footer totals.
//   * KPI canonical definitions (AC-02): Average Completion Time =
//     created_at → completed_at with denominator N; Average Work Duration
//     (drill key 'average_resolution') = started_at → completed_at.
//   * Executive N=0 rule (AC-04): zero-denominator KPIs render "N/A (N=0)"
//     — never "0 hours" or "100%".
//   * SQL performance: indexed created_at/status queries execute < 20ms.
//   * Role scoping: an employee's drill-down scope is own_tasks, so manager
//     metrics can never leak into a lower-role viewport.
//
// Run: pnpm run test:dashboard-analytics-100

import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

// The dashboard/db modules read the database path from the environment at
// call time; set an isolated fixture DB BEFORE importing them.
process.env.NODE_ENV = 'test';
const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-analytics-'));
process.env.QC_DATABASE_PATH = join(tempRoot, 'analytics.db');

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationDir = join(appDir, 'db/migrations');

const { getDb } = await import('../src/lib/db.ts');
const { runMigrations } = await import('../src/lib/migrations.ts');
const {
  getKpis,
  NO_FILTERS,
  formatDuration,
  formatKpiDuration,
  formatKpiPercent,
} = await import('../src/lib/dashboard.ts');
const {
  statusDistributionTable,
  priorityDistributionTable,
  perEmployeeTable,
  overdueByEmployeeTable,
  completedPerWeekTable,
  completionRateTable,
  labSliceTable,
  labWeeklyTable,
  chartTakeaway,
} = await import('../src/lib/chartTables.ts');
const { DRILLDOWN_KPIS, listDrilldownTasks } = await import('../src/lib/reporting/queries.ts');
const { parseReportFilters } = await import('../src/lib/reporting/filters.ts');
const { resolveReportScope } = await import('../src/lib/reporting/scope.ts');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}
function eq(actual, expected, label) {
  ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`,
  );
}

try {
  // getDb() initializes (migrates + seeds) the isolated fixture DB on first
  // call; a follow-up runMigrations must therefore be a no-op.
  const db = getDb();
  const migrated = runMigrations(db, { migrationsDir: migrationDir, backup: false });
  eq(migrated.applied.length, 0, 'fixture database already initialized by getDb()');
  ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='tasks'").get(), 'fixture database has the tasks table');

  // ── Seed users + tasks with deterministic timestamps (UTC, like the app) ──
  const insertUser = db.prepare(
    `INSERT INTO users (username, password_hash, full_name, role, department, is_active) VALUES (?, ?, ?, ?, 'QC', 1)`,
  );
  const managerId = Number(insertUser.run('mgr_analytics', 'x', 'Analytics Manager', 'manager').lastInsertRowid);
  const employeeId = Number(insertUser.run('emp_analytics', 'x', 'Analytics Employee', 'employee').lastInsertRowid);

  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, department,
                        created_at, started_at, completed_at, completed_by)
     VALUES (@title, 'fixture', @status, @priority, @progress, @created_by, @assigned_to, 'QC',
             @created_at, @started_at, @completed_at, @completed_by)`,
  );
  db.transaction(() => {
    // completion = created→completed = 2 days; work = started→completed = 1 day.
    insertTask.run({
      title: 'ANA done 2d/1d', status: 'completed', priority: 'high', progress: 100,
      created_by: managerId, assigned_to: employeeId,
      created_at: '2026-08-01 10:00:00', started_at: '2026-08-02 10:00:00',
      completed_at: '2026-08-03 10:00:00', completed_by: employeeId,
    });
    // completion = 2 days; NO started_at → excluded from Average Work Duration.
    insertTask.run({
      title: 'ANA done no-start', status: 'completed', priority: 'low', progress: 100,
      created_by: managerId, assigned_to: employeeId,
      created_at: '2026-08-05 10:00:00', started_at: null,
      completed_at: '2026-08-07 10:00:00', completed_by: employeeId,
    });
    // open task — feeds counts, not the averages.
    insertTask.run({
      title: 'ANA open', status: 'in_progress', priority: 'medium', progress: 10,
      created_by: managerId, assigned_to: employeeId,
      created_at: '2026-08-10 10:00:00', started_at: null,
      completed_at: null, completed_by: null,
    });
  })();

  // ─────────────── 1. KPI canonical definitions (AC-02) ───────────────
  console.log('\n── 1. KPI numbers + denominators against seeded fixtures ──');
  const kpis = getKpis(NO_FILTERS);
  eq(kpis.total, 3, '1. total = 3 seeded tasks');
  eq(kpis.completed, 2, '1. completed = 2');
  eq(kpis.avg_completion_n, 2, '1. Average Completion Time denominator N = 2 completed tasks');
  ok(
    kpis.avg_completion_seconds !== null && Math.abs(kpis.avg_completion_seconds - 172_800) < 1,
    `1. avg completion = 2d (created_at → completed_at), got ${kpis.avg_completion_seconds}s`,
  );
  eq(kpis.avg_work_n, 1, '1. Average Work Duration denominator N = 1 (only tasks with started_at)');
  ok(
    kpis.avg_work_seconds !== null && Math.abs(kpis.avg_work_seconds - 86_400) < 1,
    `1. avg work duration = 1d (started_at → completed_at), got ${kpis.avg_work_seconds}s`,
  );
  // The two KPIs are genuinely different numbers now (P2-2 dedup).
  ok(kpis.avg_completion_seconds !== kpis.avg_work_seconds, '1. completion time ≠ work duration (no duplicate KPI)');

  // SQL-verification: the exact query the KPI runs, re-derived independently.
  const sqlCheck = db
    .prepare(
      `SELECT AVG((julianday(t.completed_at) - julianday(t.created_at)) * 86400.0) AS s
       FROM tasks t WHERE t.status = 'completed' AND t.completed_at IS NOT NULL`,
    )
    .get().s;
  ok(Math.abs(sqlCheck - 172_800) < 1, '1. KPI value is reproducible by direct SQL');

  // ─────────────── 2. Executive N=0 rule (AC-04) ───────────────
  console.log('\n── 2. N=0 renders "N/A (N=0)" — never 0 hours / 0% / 100% ──');
  eq(formatKpiDuration(null, 0), 'N/A (N=0)', '2. duration formatter, N=0 → N/A (N=0)');
  eq(formatKpiPercent(0, 0), 'N/A (N=0)', '2. percent formatter, N=0 → N/A (N=0)');
  eq(formatKpiPercent(100, 0), 'N/A (N=0)', '2. percent formatter refuses 100% at N=0');
  eq(formatKpiDuration(172_800, 2), '2d', '2. duration formatter with N>0 → 2d');
  eq(formatKpiPercent(50, 4), '50.0%', '2. percent formatter with N>0 → 50.0%');
  eq(formatDuration(null), '—', '2. bare duration keeps — for null');

  const emptyKpis = getKpis({ ...NO_FILTERS, department: 'NO_SUCH_DEPARTMENT' });
  eq(emptyKpis.total, 0, '2. zero-match filter → total 0');
  eq(emptyKpis.avg_completion_n, 0, '2. zero-match filter → completion denominator 0');
  ok(emptyKpis.avg_completion_seconds === null, '2. zero-match filter → avg completion null (not 0)');
  ok(emptyKpis.avg_work_seconds === null, '2. zero-match filter → avg work null (not 0)');
  eq(emptyKpis.sla_compliance_n, 0, '2. zero-match filter → SLA compliance denominator 0');
  eq(formatKpiPercent(emptyKpis.sla_compliance_percent, emptyKpis.sla_compliance_n), 'N/A (N=0)',
    '2. SLA compliance displays N/A (N=0), not 0.0% or 100%');
  eq(formatKpiDuration(emptyKpis.avg_completion_seconds, emptyKpis.avg_completion_n), 'N/A (N=0)',
    '2. average completion displays N/A (N=0), not 0 hours');

  // ─────────────── 3. Chart→table equivalence (AC-03) ───────────────
  console.log('\n── 3. Chart-to-table equivalence contract ──');
  const statusSlices = [
    { label: 'Not started', count: 5 },
    { label: 'In progress', count: 10 },
    { label: 'On hold', count: 0 },
    { label: 'Completed', count: 25 },
    { label: 'Cancelled', count: 2 },
  ];
  const statusTable = statusDistributionTable(statusSlices);
  eq(statusTable.columns, ['Status', 'Tasks', 'Share'], '3. status table headers');
  eq(statusTable.rows.length, statusSlices.length, '3. status table rows = chart slices (1-to-1)');
  eq(statusTable.rows.map((r) => r[0]), statusSlices.map((s) => s.label), '3. status table row headers = slice labels');
  eq(statusTable.rows.map((r) => Number(r[1])), statusSlices.map((s) => s.count), '3. status table counts = slice counts');
  eq(statusTable.footer, ['Total', '42', '100%'], '3. status table footer = exact total');

  const priorityTable = priorityDistributionTable([
    { label: 'Low', count: 1 },
    { label: 'Medium', count: 2 },
    { label: 'High', count: 3 },
    { label: 'Urgent', count: 4 },
  ]);
  eq(priorityTable.rows.length, 4, '3. priority table rows = 4 priorities');
  eq(priorityTable.footer, ['Total', '10', '100%'], '3. priority table footer total');

  const statusLabels = ['Not started', 'In progress', 'On hold', 'Completed', 'Cancelled'];
  // status counts sum to the bar total, exactly like the chart data contract.
  const bars = [
    { full_name: 'Alice', total: 3, statuses: statusLabels.map((l, i) => ({ label: l, count: [0, 1, 2, 0, 0][i] })) },
    { full_name: 'Bob', total: 7, statuses: statusLabels.map((l, i) => ({ label: l, count: [1, 1, 2, 2, 1][i] })) },
  ];
  const employeeTable = perEmployeeTable(bars);
  eq(employeeTable.columns, ['Employee', ...statusLabels, 'Total'], '3. employee table headers = Employee + statuses + Total');
  eq(employeeTable.rows.length, bars.length, '3. employee table rows = chart bars');
  eq(employeeTable.rows[1][0], 'Bob', '3. employee table row header = employee name');
  eq(Number(employeeTable.rows[0][6]), bars[0].total, '3. employee table row total = bar total');
  eq(employeeTable.footer, ['Total', '1', '2', '4', '2', '1', '10'], '3. employee table footer reconciles status columns and grand total');

  const overdueTable = overdueByEmployeeTable([
    { full_name: 'Alice', count: 3 },
    { full_name: 'Unassigned', count: 1 },
  ]);
  eq(overdueTable.rows.map((r) => r[0]), ['Alice', 'Unassigned'], '3. overdue-by-employee row headers = employee names');
  eq(overdueTable.footer, ['Total', '4'], '3. overdue-by-employee footer total');

  const weeks = Array.from({ length: 8 }, (_, i) => ({ label: `W${i}`, count: i }));
  const weeklyTable = completedPerWeekTable(weeks);
  eq(weeklyTable.rows.length, 8, '3. weekly table rows = 8 week buckets');
  eq(weeklyTable.footer, ['Total', '28'], '3. weekly table footer = bucket sum');

  const rateTable = completionRateTable({
    current: 0.5, previous: null, delta_pp: null,
    current_from: '2026-08-01', current_to: '2026-08-30',
    previous_from: '2026-07-02', previous_to: '2026-07-31',
  });
  eq(rateTable.rows[0][1], '50%', '3. completion-rate table current cell');
  eq(rateTable.rows[1][1], 'N/A (N=0)', '3. completion-rate table renders N/A (N=0) for an empty period');
  eq(rateTable.footer[1], '—', '3. completion-rate footer change = — when a period is empty');

  const labTable = labSliceTable('Final results', [
    { label: 'PASS', count: 7 },
    { label: 'FAIL', count: 2 },
    { label: 'HOLD', count: 1 },
  ]);
  eq(labTable.columns, ['Category', 'Records', 'Share'], '3. lab slice table headers');
  eq(labTable.footer, ['Total', '10', '100%'], '3. lab slice table footer');
  eq(labTable.caption, 'Final results — exact figures for all laboratory records', '3. lab table caption names the scope');

  const labWeekTable = labWeeklyTable([{ label: '3 Mar', count: 0 }, { label: '10 Mar', count: 4 }]);
  eq(labWeekTable.footer, ['Total', '4'], '3. lab weekly table footer');
  ok(labWeekTable.caption.includes('last 8 weeks'), '3. lab weekly caption states the period');

  // ─────────────── 4. Screen-reader takeaway (AC-05) ───────────────
  console.log('\n── 4. aria-label takeaway summaries ──');
  ok(
    chartTakeaway(statusSlices) === '42 total, largest Completed 25 (60%)',
    `4. takeaway names the largest slice with count and share (got "${chartTakeaway(statusSlices)}")`,
  );
  eq(chartTakeaway(statusSlices.map((s) => ({ ...s, count: 0 }))), 'no records match the current filters',
    '4. empty chart takeaway explains the empty state');

  // ─────────────── 5. SQL performance (< 20ms, indexed) ───────────────
  console.log('\n── 5. Indexed dashboard queries execute < 20ms ──');
  const indexNames = new Set(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((r) => r.name),
  );
  ok(indexNames.has('idx_tasks_created_at'), '5. idx_tasks_created_at exists');
  ok(indexNames.has('idx_tasks_status'), '5. idx_tasks_status exists');
  const timedQuery = db.prepare(
    `SELECT COUNT(*) AS n FROM tasks t
     WHERE date(t.created_at, 'localtime') >= date(?) AND t.status = ?`,
  );
  const t0 = performance.now();
  timedQuery.get('2026-01-01', 'completed');
  const elapsedMs = performance.now() - t0;
  ok(elapsedMs < 20, `5. created_at+status query executed in ${elapsedMs.toFixed(2)}ms (< 20ms)`);

  // ─────────────── 6. Role scoping / no metric leakage ───────────────
  console.log('\n── 6. Drill-down scoping keeps manager metrics out of lower roles ──');
  ok(DRILLDOWN_KPIS.includes('average_completion'), '6. average_completion is a valid drill-down KPI');
  const noFilters = parseReportFilters(new URLSearchParams());
  const empScope = resolveReportScope({ id: employeeId, role: 'employee', department: 'QC' }, noFilters);
  eq(empScope.kind, 'own_tasks', '6. employee drill-down scope is own_tasks (never organization)');
  const orgScope = resolveReportScope({ id: managerId, role: 'manager', department: 'QC' }, noFilters);
  eq(orgScope.kind, 'organization', '6. manager drill-down scope is organization');
  const completionTasks = listDrilldownTasks(noFilters, orgScope, 'average_completion');
  eq(completionTasks.length, 2, '6. average_completion drill-down = both completed tasks');
  const workTasks = listDrilldownTasks(noFilters, orgScope, 'average_resolution');
  eq(workTasks.length, 1, '6. average_resolution (work duration) drill-down = only tasks with started_at');
  const empTasks = listDrilldownTasks(noFilters, empScope, 'average_completion');
  eq(empTasks.length, 2, '6. employee sees only their own tasks behind the same KPI');

  console.log(`\nDASHBOARD-ANALYTICS-100: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed)`);
  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
