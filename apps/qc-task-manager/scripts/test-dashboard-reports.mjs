import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runMigrations } from '../src/lib/migrations.ts';
import { parseReportFilters } from '../src/lib/reporting/filters.ts';
import { resolveReportScope } from '../src/lib/reporting/scope.ts';
import { buildKpiHref } from '../src/lib/reporting/drilldown.ts';
import { REPORT_CATALOG } from '../src/lib/reporting/catalog.ts';
import { rowsToCsv } from '../src/lib/reporting/writers/csv.ts';
import { authorizeReport } from '../src/lib/reporting/authorization.ts';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationDir = join(appDir, 'db/migrations');
const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-reports-'));

try {
  const db = new Database(join(tempRoot, 'migration.db'));
  const first = runMigrations(db, { migrationsDir: migrationDir, backup: false });
    assert.equal(first.applied.length, 39, "report, audit, AI, evidence, lab, user-audit, and UX measurement migrations are applied");
  const columns = db.prepare('PRAGMA table_info(report_audit_log)').all().map((row) => row.name);
  for (const column of ['report_id', 'report_type', 'generated_by', 'filters_json', 'generated_at', 'format', 'data_scope_json', 'status', 'row_count', 'failure_reason']) {
    assert.ok(columns.includes(column), `report_audit_log has ${column}`);
  }
  assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_report_audit_actor_time'").get());
  const second = runMigrations(db, { migrationsDir: migrationDir, backup: false });
  assert.equal(second.applied.length, 0, 'report migration is idempotent');
  db.close();

  const filters = parseReportFilters(new URLSearchParams({
    from: '2026-08-01',
    to: '2026-08-12',
    department: 'QC',
    employee: '42',
    priority: 'high',
    risk: 'critical',
    finding_classification: 'major',
    sla_status: 'BREACHED',
  }));
  assert.deepEqual(filters, {
    from: '2026-08-01', to: '2026-08-12', department: 'QC', employee: 42,
    supervisor: null, priority: 'high', risk: 'critical', finding_classification: 'major', sla_status: 'BREACHED',
    test_type: null, result: null, status: null, reason: null, product: null, equipment: null,
  });
  assert.throws(() => parseReportFilters(new URLSearchParams({ employee: 'not-an-id' })), /employee/i);
  assert.throws(() => parseReportFilters(new URLSearchParams({ scope: 'department' })), /scope/i);
  assert.throws(() => parseReportFilters(new URLSearchParams({ page: '2' })), /unsupported|pagination|page/i);
  assert.deepEqual(resolveReportScope({ id: 7, role: 'employee', department: 'QC' }, filters), {
    kind: 'own_tasks', userId: 7, department: 'QC', sql: '(t.assigned_to = ? OR t.created_by = ?)', params: [7, 7],
  });
  assert.deepEqual(resolveReportScope({ id: 2, role: 'manager', department: 'QA' }, filters).kind, 'organization');
  assert.equal(
    buildKpiHref('sla_breached', new URLSearchParams({ from: '2026-08-01', department: 'QC' })),
    '/dashboard/drilldown?from=2026-08-01&department=QC&sla_status=BREACHED&dashboard=1',
  );
  assert.equal(buildKpiHref('overdue', new URLSearchParams()), '/dashboard/drilldown?overdue=1&dashboard=1');
  assert.deepEqual(Object.keys(REPORT_CATALOG), [
    'monthly-qc', 'sla', 'findings', 'capa', 'employee-performance', 'audit-trail', 'evidence-compliance', 'overdue',
    // Laboratory reports (§13 — same pipeline, rendered by the same writers)
    'lab-test-register', 'lab-test-register-air', 'lab-test-register-vacuum',
    'lab-results', 'lab-retests', 'lab-product-history',
    'lab-equipment-register', 'lab-calibration', 'lab-maintenance',
    'lab-sop-register', 'lab-wi-register', 'lab-doc-review-due', 'lab-acknowledgements',
    'lab-activity', 'lab-data-quality', 'lab-retention-status',
  ]);
  const csv = rowsToCsv(['Report ID', 'Task'], [['R-1', 'Line, with "quotes"\nnext']]);
  assert.match(csv, /^\uFEFFReport ID,Task\r\nR-1,"Line, with ""quotes""\nnext"\r\n$/);
  assert.equal(rowsToCsv(['v'], [['=SUM(A1)']]).includes("'=SUM(A1)"), true, 'csv: formula injection neutralized');
  assert.equal(rowsToCsv(['v'], [['@cmd']]).includes("'@cmd"), true, 'csv: formula injection (leading @) neutralized');
  assert.equal(authorizeReport({ id: 7, role: 'employee', department: 'QC' }, 'overdue', false).allowed, true);
  assert.equal(authorizeReport({ id: 7, role: 'employee', department: 'QC' }, 'employee-performance', true).allowed, false);
  assert.equal(authorizeReport({ id: 3, role: 'supervisor', department: 'QC' }, 'findings', true).scopeKind, 'department');
  assert.equal(authorizeReport({ id: 2, role: 'manager', department: 'QA' }, 'audit-trail', true).scopeKind, 'organization');

  // Supervisor scope must NEVER widen from the query string: a supervisor with
  // no department cannot fall back to filters.department (attacker-controlled),
  // and a supervisor WITH a department ignores the query-string department.
  const forged = parseReportFilters(new URLSearchParams({ department: 'QA' }));
  const noDept = resolveReportScope({ id: 3, role: 'supervisor', department: null }, forged);
  assert.equal(noDept.kind, 'own_tasks', 'scope: supervisor without department is restricted to own tasks (no query widening)');
  assert.equal(noDept.sql, '(t.assigned_to = ? OR t.created_by = ?)', 'scope: supervisor without department scopes to own tasks SQL');
  const withDept = resolveReportScope({ id: 3, role: 'supervisor', department: 'QC' }, forged);
  assert.equal(withDept.kind, 'department', 'scope: supervisor with department keeps department scope');
  assert.deepEqual(withDept.params, ['QC'], 'scope: supervisor department comes from the profile, not the query string');
  console.log('Dashboard reports migration tests passed.');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
