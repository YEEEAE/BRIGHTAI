// Database-backed unit checks for the Retention Status report integration
// (src/lib/lab/retention.ts + the reporting-pipeline wiring — QC-LAB-ARCHITECTURE.md §13).
//
// ABSOLUTE SCOPE: retention AWARENESS only. This test also asserts that the
// retention module contains no DELETE/UPDATE/INSERT statements at all.
//
// Mirrors test-lab-reports.mjs patterns:
//   1. Authorization × roles: employee DENIED, supervisor/manager/admin allowed.
//   2. Row accuracy on fixtures (dates, remaining days, family labels).
//   3. Metadata only — no document content / snapshot data exported.
//   4. Pipeline dispatch through readReportRows + catalog registration.
//   5. Grep-verified: no DELETE statement in the retention module.

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-retention-'));
const dbPath = join(tempDir, 'lab-retention.db');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { passed += 1; console.log(`  ✅ ${label}`); }
  else { failed += 1; failures.push(label); console.log(`  ❌ ${label}`); }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(join(backupDir, 'status.json'), JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }));

  const { getDb } = await import('../src/lib/db.ts');
  const { authorizeReport } = await import('../src/lib/reporting/authorization.ts');
  const { REPORT_CATALOG } = await import('../src/lib/reporting/catalog.ts');
  const { LAB_REPORT_TYPES, isLabReportType } = await import('../src/lib/reporting/types.ts');
  const { emptyReportFilters, parseReportFilters } = await import('../src/lib/reporting/filters.ts');
  const { toLabReportFilters, readLabReportRows } = await import('../src/lib/lab/labReports.ts');
  const { readLabRetentionStatus, LAB_RETENTION_POLICY, LAB_RETENTION_YEARS_DEFAULT } = await import('../src/lib/lab/retention.ts');
  const { readReportRows } = await import('../src/lib/reporting/reader.ts');

  // ── 1. Catalog registration ──
  console.log('\n■ Catalog registration');
  eq(LAB_RETENTION_YEARS_DEFAULT, 5, 'policy: default retention is 5 years');
  ok(LAB_REPORT_TYPES.includes('lab-retention-status'), 'catalog: lab-retention-status registered as a lab report type');
  ok(isLabReportType('lab-retention-status'), 'types: lab-retention-status detected as a lab report');
  const def = REPORT_CATALOG['lab-retention-status'];
  ok(Boolean(def), 'catalog: definition present');
  ok(def.headers[0] === 'Report ID' && def.headers.includes('Days Remaining'), 'catalog: headers include Report ID and Days Remaining');
  ok(/no deletion|READ-ONLY/i.test(def.description), 'catalog: description documents read-only awareness nature');
  eq(LAB_RETENTION_POLICY.length, 2, 'policy: two record families configured');
  ok(LAB_RETENTION_POLICY.every((p) => p.retentionYears === 5 && p.anchorColumn === 'approved_at'), 'policy: every family uses 5 years from approval date');

  // ── 2. Authorization × roles (same pattern as the 15 existing reports) ──
  console.log('\n■ Authorization (RBAC)');
  eq(authorizeReport({ id: 7, role: 'employee', department: 'QC' }, 'lab-retention-status', false).allowed, false, 'auth: employee DENIED for lab-retention-status');
  eq(authorizeReport({ id: 3, role: 'supervisor', department: 'QC' }, 'lab-retention-status', false).allowed, true, 'auth: supervisor allowed');
  eq(authorizeReport({ id: 2, role: 'manager', department: 'QA' }, 'lab-retention-status', true).allowed, true, 'auth: manager allowed');
  eq(authorizeReport({ id: 1, role: 'admin', department: null }, 'lab-retention-status', true).allowed, true, 'auth: admin allowed');

  // ── 3. Static safety: NO destructive SQL anywhere in the retention module ──
  console.log('\n■ Static safety (no deletion)');
  const retentionSource = readFileSync(join(appDir, 'src/lib/lab/retention.ts'), 'utf8');
  for (const banned of [/\bDELETE\s+FROM/i, /\bUPDATE\b/i, /\bINSERT\s+OR\b/i, /\bINSERT\s+INTO/i, /\bDROP\s+(TABLE|VIEW|INDEX)/i, /\bTRUNCATE\b/i]) {
    ok(!banned.test(retentionSource), `static: retention module contains no "${banned.source}" statement`);
  }

  // ── 4. Fixture seeding ──
  console.log('\n■ Seeding fixture');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const supervisor = db.prepare("SELECT id FROM users WHERE role = 'supervisor'").get() ?? employee;
  const uid = employee.id;

  const insertProduct = db.prepare("INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES ('Ret Product A', 'RET-A', 'air', 1, ?)");
  insertProduct.run(uid);

  // Tests: one approved ~6 years ago (ELIGIBLE), one approved recently (NOT eligible), one draft.
  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_number, test_type, product_id, lot_number, sample_count, final_result, status,
     tested_by, approved_by, approved_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const sixYearsAgo = new Date(Date.now() - 6 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const oneYearAgo = new Date(Date.now() - 1 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  insertTest.run('RET-T1', 'air', 1, 'LOT-RET1', 1, 'PASS', 'APPROVED', uid, supervisor.id, sixYearsAgo, uid, sixYearsAgo, sixYearsAgo);
  insertTest.run('RET-T2', 'air', 1, 'LOT-RET2', 1, 'PASS', 'APPROVED', uid, supervisor.id, oneYearAgo, uid, oneYearAgo, oneYearAgo);
  insertTest.run('RET-T3', 'air', 1, 'LOT-RET3', 1, null, 'DRAFT', uid, null, null, uid, oneYearAgo, oneYearAgo);

  // Documents: one APPROVED ~6 years ago (ELIGIBLE), one APPROVED recently, one DRAFT.
  const insertDoc = db.prepare(`INSERT INTO lab_documents (code, title, type, owner_id, approver_id, status, effective_date, review_due_date, approved_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertDoc.run('SOP-RET-01', 'Retention Fixture SOP', 'SOP', uid, supervisor.id, 'APPROVED', sixYearsAgo.slice(0, 10), '2027-01-01', sixYearsAgo, uid);
  insertDoc.run('WI-RET-01', 'Retention Fixture WI', 'WI', uid, supervisor.id, 'APPROVED', oneYearAgo.slice(0, 10), '2027-01-01', oneYearAgo, uid);
  insertDoc.run('SOP-RET-DRAFT', 'Draft SOP', 'SOP', uid, null, 'DRAFT', null, null, null, uid);

  const RID = 'RPT-RET';
  const collect = (gen) => [...gen];

  // ── 5. Row accuracy on fixtures ──
  console.log('\n■ Reader rows');
  const rows = collect(readLabRetentionStatus(RID, toLabReportFilters(emptyReportFilters)));
  eq(rows.length, 2, 'retention: exactly 2 eligible rows (1 test + 1 doc)');
  ok(rows.every((r) => r[0] === RID), 'retention: every row carries the report id');

  const testRows = rows.filter((r) => r[1] === 'Test Records');
  const docRows = rows.filter((r) => r[1] === 'Controlled Documents');
  eq(testRows.length, 1, 'retention: 1 eligible test row');
  eq(docRows.length, 1, 'retention: 1 eligible document row');

  eq(testRows[0][2], 'RET-T1', 'retention: old test RET-T1 eligible');
  ok(!rows.some((r) => String(r[2]).startsWith('RET-T2')), 'retention: recent test RET-T2 not yet eligible');
  ok(!rows.some((r) => String(r[2]).startsWith('RET-T3')), 'retention: unapproved DRAFT never listed');
  eq(docRows[0][2], 'SOP-RET-01', 'retention: old SOP eligible');
  ok(!rows.some((r) => String(r[2]).startsWith('WI-RET-01')), 'retention: recent WI not yet eligible');
  ok(!rows.some((r) => String(r[2]).startsWith('SOP-RET-DRAFT')), 'retention: unapproved document never listed');

  ok(String(testRows[0][4]).startsWith(sixYearsAgo.slice(0, 10)), 'retention: approval date reported');
  const untilYear = Number(String(testRows[0][5]).slice(0, 4));
  eq(untilYear - Number(sixYearsAgo.slice(0, 4)), 5, 'retention: retention_until = approval + 5 years');
  const daysRemaining = Number(testRows[0][6]);
  // ~1 year past a 5-year window on a ~6-year-old record → roughly -365.
  ok(Number.isInteger(daysRemaining) && daysRemaining < 0 && daysRemaining >= -370 && daysRemaining <= -360, `retention: days remaining computed (negative = elapsed, got ${daysRemaining})`);
  eq(testRows[0][7], 'Eligible for archival review', 'retention: status label is awareness-only wording');

  // Filters accepted but intentionally do not change eligibility semantics.
  const filtered = collect(readLabRetentionStatus(RID, toLabReportFilters(parseReportFilters(new URLSearchParams({ status: 'APPROVED' })))));
  eq(filtered.length, 2, 'retention: status filter accepted without changing eligibility');

  ok(!rows.flat().some((c) => typeof c === 'string' && c.includes('Fixture SOP body')), 'retention: document CONTENT never exported (metadata only)');
  ok(!rows.flat().some((c) => typeof c === 'string' && /snapshot|session|token/i.test(String(c))), 'retention: metadata only — no snapshot/session/token cells');

  // ── 6. Dispatcher wiring through the EXISTING pipeline ──
  console.log('\n■ Pipeline dispatch');
  const piped = [];
  for await (const row of readReportRows('lab-retention-status', emptyReportFilters, { kind: 'lab', userId: uid, department: null, sql: '1 = 1', params: [] }, RID)) {
    piped.push(row);
  }
  eq(piped.length, 2, 'pipeline: readReportRows yields retention rows via the shared reader');
  const dispatched = collect(readLabReportRows('lab-retention-status', RID, toLabReportFilters(emptyReportFilters)));
  eq(dispatched.length, 2, 'dispatcher: readLabReportRows routes lab-retention-status');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-retention crashed:', err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
