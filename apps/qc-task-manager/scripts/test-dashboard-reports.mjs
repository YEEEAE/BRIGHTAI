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
    assert.equal(first.applied.length, 20, "report, audit, AI, evidence, and lab migrations are applied");
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
  });
  assert.throws(() => parseReportFilters(new URLSearchParams({ employee: 'not-an-id' })), /employee/i);
  assert.deepEqual(resolveReportScope({ id: 7, role: 'employee', department: 'QC' }, filters), {
    kind: 'own_tasks', userId: 7, department: 'QC', sql: '(t.assigned_to = ? OR t.created_by = ?)', params: [7, 7],
  });
  assert.deepEqual(resolveReportScope({ id: 2, role: 'manager', department: 'QA' }, filters).kind, 'organization');
  assert.equal(
    buildKpiHref('sla_breached', new URLSearchParams({ from: '2026-08-01', department: 'QC' })),
    '/dashboard/drilldown?from=2026-08-01&department=QC&sla_status=BREACHED&dashboard=1',
  );
  assert.equal(buildKpiHref('overdue', new URLSearchParams()), '/dashboard/drilldown?overdue=1&dashboard=1');
  assert.deepEqual(Object.keys(REPORT_CATALOG), ['monthly-qc', 'sla', 'findings', 'capa', 'employee-performance', 'audit-trail', 'evidence-compliance', 'overdue']);
  const csv = rowsToCsv(['Report ID', 'Task'], [['R-1', 'Line, with "quotes"\nnext']]);
  assert.match(csv, /^\uFEFFReport ID,Task\r\nR-1,"Line, with ""quotes""\nnext"\r\n$/);
  assert.equal(authorizeReport({ id: 7, role: 'employee', department: 'QC' }, 'overdue', false).allowed, true);
  assert.equal(authorizeReport({ id: 7, role: 'employee', department: 'QC' }, 'employee-performance', true).allowed, false);
  assert.equal(authorizeReport({ id: 3, role: 'supervisor', department: 'QC' }, 'findings', true).scopeKind, 'department');
  assert.equal(authorizeReport({ id: 2, role: 'manager', department: 'QA' }, 'audit-trail', true).scopeKind, 'organization');
  console.log('Dashboard reports migration tests passed.');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
