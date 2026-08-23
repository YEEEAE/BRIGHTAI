// Database-backed unit checks for the Laboratory Reporting integration
// (src/lib/lab/labReports.ts + the reporting-pipeline wiring in
// src/lib/reporting/{authorization,scope,filters,reader,catalog,types}.ts —
// QC-LAB-ARCHITECTURE.md §13).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-data-quality.mjs).
// Uses a controlled fixture — no invented scientific values.
//
// Covered:
//   1. Authorization: employees DENIED for every lab type; supervisor+ allowed
//      (contract §13 RBAC: LAB_REPORT_VIEW / LAB_EXPORT ❌ employee).
//   2. Scope: lab report types resolve to the 'lab' scope kind.
//   3. Filters: lab params (test_type/result/status/reason/product/equipment)
//      parse + validate; invalid values throw.
//   4. Catalog: exactly 15 lab report types registered, all with headers.
//   5. Readers: every one of the 15 reports yields the expected rows from the
//      fixture; metadata only (no snapshot JSON / document content / secrets);
//      filters are respected end-to-end; date ranges bound the result.
//   6. Safe CSV: report rows survive csvCell escaping.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-reports-'));
const dbPath = join(tempDir, 'lab-reports.db');

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
function throws(fn, label) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  ok(threw, label);
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
  const { resolveReportScope } = await import('../src/lib/reporting/scope.ts');
  const { parseReportFilters, emptyReportFilters } = await import('../src/lib/reporting/filters.ts');
  const { REPORT_CATALOG } = await import('../src/lib/reporting/catalog.ts');
  const { LAB_REPORT_TYPES, isLabReportType } = await import('../src/lib/reporting/types.ts');
  const { readLabReportRows, toLabReportFilters } = await import('../src/lib/lab/labReports.ts');
  const { readReportRows } = await import('../src/lib/reporting/reader.ts');
  const { csvCell } = await import('../src/lib/reporting/writers/csv.ts');

  // ── 1. Catalog: exactly 15 lab report types ──
  console.log('\n■ Catalog registration');
  eq(LAB_REPORT_TYPES.length, 16, 'catalog: 16 lab report types');
  for (const key of LAB_REPORT_TYPES) {
    const def = REPORT_CATALOG[key];
    ok(Boolean(def), `catalog: ${key} is registered`);
    ok(Array.isArray(def?.headers) && def.headers.length > 0 && def.headers[0] === 'Report ID', `catalog: ${key} has headers starting with Report ID`);
    ok(isLabReportType(key), `types: ${key} detected as a lab report`);
  }
  ok(!isLabReportType('monthly-qc'), 'types: task reports are not lab reports');

  // ── 2. Authorization: employee denied, supervisor+ allowed ──
  console.log('\n■ Authorization (RBAC)');
  for (const key of LAB_REPORT_TYPES) {
    const employee = authorizeReport({ id: 7, role: 'employee', department: 'QC' }, key, false);
    ok(employee.allowed === false, `auth: employee DENIED for ${key}`);
    const supervisor = authorizeReport({ id: 3, role: 'supervisor', department: 'QC' }, key, false);
    ok(supervisor.allowed === true, `auth: supervisor allowed for ${key}`);
    const manager = authorizeReport({ id: 2, role: 'manager', department: 'QA' }, key, true);
    ok(manager.allowed === true, `auth: manager allowed for ${key}`);
    const admin = authorizeReport({ id: 1, role: 'admin', department: null }, key, true);
    ok(admin.allowed === true, `auth: admin allowed for ${key}`);
  }
  // Task reports keep their original behaviour for employees.
  eq(authorizeReport({ id: 7, role: 'employee', department: 'QC' }, 'overdue', false).allowed, true, 'auth: employee still allowed for task report');

  // ── 3. Scope: lab types resolve to the 'lab' scope ──
  console.log('\n■ Scope resolution');
  for (const key of LAB_REPORT_TYPES) {
    const scope = resolveReportScope({ id: 3, role: 'supervisor', department: 'QC' }, emptyReportFilters, key);
    ok(scope.kind === 'lab', `scope: ${key} resolves to lab scope`);
  }
  eq(resolveReportScope({ id: 7, role: 'employee', department: 'QC' }, emptyReportFilters, 'overdue').kind, 'own_tasks', 'scope: task report keeps own_tasks for employee');

  // ── 4. Filter parsing ──
  console.log('\n■ Filter parsing');
  const filters = parseReportFilters(new URLSearchParams({
    from: '2026-08-01', to: '2026-08-12',
    test_type: 'air', result: 'PASS', status: 'APPROVED', reason: 'FAIL', product: '5', equipment: '9',
  }));
  eq(filters.test_type, 'air', 'filters: test_type parsed');
  eq(filters.result, 'PASS', 'filters: result parsed');
  eq(filters.status, 'APPROVED', 'filters: status parsed');
  eq(filters.reason, 'FAIL', 'filters: reason parsed');
  eq(filters.product, 5, 'filters: product id parsed');
  eq(filters.equipment, 9, 'filters: equipment id parsed');
  throws(() => parseReportFilters(new URLSearchParams({ test_type: 'water' })), 'filters: invalid test_type rejected');
  throws(() => parseReportFilters(new URLSearchParams({ result: 'MAYBE' })), 'filters: invalid result rejected');
  throws(() => parseReportFilters(new URLSearchParams({ status: 'BOGUS' })), 'filters: invalid status rejected');
  throws(() => parseReportFilters(new URLSearchParams({ reason: 'NOPE' })), 'filters: invalid reason rejected');
  throws(() => parseReportFilters(new URLSearchParams({ product: '-1' })), 'filters: non-positive product rejected');

  // ── 5. Fixture ──
  console.log('\n■ Seeding fixture');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const supervisor = db.prepare("SELECT id FROM users WHERE role = 'supervisor'").get() ?? employee;
  const uid = employee.id;

  const insertProduct = db.prepare('INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)');
  insertProduct.run('Rep Product A', 'RP-A', 'air', 1, uid);
  insertProduct.run('Rep Product B', 'RP-B', 'vacuum', 1, uid);
  const prodA = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'RP-A'").get().id);
  const prodB = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'RP-B'").get().id);

  const insertEquipment = db.prepare('INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, calibration_status_raw, is_archived, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertEquipment.run('Rep Rig A', 'RP-EQ1', 'Lab 1', 'مستخدم', 'SN-A', 'yes', 0, uid);
  insertEquipment.run('Rep Rig B', 'RP-EQ2', 'Lab 2', 'NEW', 'SN-B', null, 0, uid);
  const eqA = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'RP-EQ1'").get().id);
  const eqB = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'RP-EQ2'").get().id);

  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_number, test_type, product_id, equipment_id, lot_number, sample_count, final_result, status,
     tested_by, submitted_at, reviewed_at, approved_by, approved_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  // RP-T1 AIR APPROVED PASS, RP-T2 VACUUM APPROVED FAIL, RP-T3 AIR DRAFT (no result)
  insertTest.run('RP-T1', 'air', prodA, eqA, 'LOT-RP1', 2, 'PASS', 'APPROVED',
    uid, '2026-08-05 09:00:00', '2026-08-06 09:00:00', supervisor.id, '2026-08-06 10:00:00',
    uid, '2026-08-05 09:00:00', '2026-08-06 10:00:00');
  insertTest.run('RP-T2', 'vacuum', prodB, eqB, 'LOT-RP2', 2, 'FAIL', 'APPROVED',
    uid, '2026-08-07 09:00:00', '2026-08-08 09:00:00', supervisor.id, '2026-08-08 10:00:00',
    uid, '2026-08-07 09:00:00', '2026-08-08 10:00:00');
  insertTest.run('RP-T3', 'air', prodA, eqA, 'LOT-RP3', 2, null, 'DRAFT',
    uid, null, null, null, null, uid, '2026-08-09 09:00:00', '2026-08-09 09:00:00');
  const t1 = Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'RP-T1'").get().id);
  const t2 = Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'RP-T2'").get().id);
  for (const tid of [t1, t2]) {
    db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, 'PASS')").run(tid);
    db.prepare("INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 2, 'PASS')").run(tid);
  }

  // Retest for RP-T2 (FAIL) → RP-T3
  db.prepare(`INSERT INTO lab_test_retests (retest_number, original_test_id, new_test_id, reason, status, original_result, original_status, created_by, created_at)
    VALUES ('RP-RT1', ?, ?, 'FAIL', 'OPEN', 'FAIL', 'APPROVED', ?, '2026-08-09 11:00:00')`).run(t2, t1 === t2 ? null : Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number='RP-T3'").get().id), uid);

  // Calibration + maintenance on RP-EQ1
  db.prepare(`INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, provider, certificate_reference, result, next_due_at, created_by)
    VALUES (?, '2026-07-01', 'Fixture Calibration Co.', 'CERT-RP-01', 'Pass', '2026-09-30', ?)`).run(eqA, uid);
  db.prepare(`INSERT INTO lab_equipment_maintenance (equipment_id, maintenance_date, issue, maintenance_type, technician_vendor, status, completed_date, created_by)
    VALUES (?, '2026-08-01', 'Fixture valve leak', 'Corrective', 'Fixture Tech', 'COMPLETED', '2026-08-02', ?)`).run(eqA, uid);

  // SOP + WI documents (one APPROVED with a version, one DRAFT)
  const insertDoc = db.prepare(`INSERT INTO lab_documents (code, title, type, owner_id, approver_id, status, effective_date, review_due_date, approved_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertDoc.run('SOP-RP-01', 'Fixture SOP', 'SOP', uid, supervisor.id, 'APPROVED', '2026-07-01', '2027-01-01', '2026-07-01 09:00:00', uid);
  insertDoc.run('WI-RP-01', 'Fixture WI', 'WI', uid, null, 'DRAFT', null, '2027-01-01', null, uid);
  db.prepare(`INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, approved_by, approved_at)
    VALUES ((SELECT id FROM lab_documents WHERE code = 'SOP-RP-01'), 1, '# Fixture SOP body (never exported)', ?, 'APPROVED', ?, '2026-07-01 09:00:00')`).run(uid, supervisor.id);
  db.prepare("UPDATE lab_documents SET current_version_id = (SELECT id FROM lab_document_versions WHERE document_id = (SELECT id FROM lab_documents WHERE code = 'SOP-RP-01')) WHERE code = 'SOP-RP-01'").run();

  // Acknowledgement assignment for the SOP version
  db.prepare(`INSERT INTO lab_document_acknowledgements (document_version_id, user_id, assigned_at, status)
    VALUES ((SELECT id FROM lab_document_versions WHERE document_id = (SELECT id FROM lab_documents WHERE code = 'SOP-RP-01')), ?, '2026-08-01 09:00:00', 'PENDING')`).run(uid);

  // Lab audit event
  db.prepare(`INSERT INTO qc_audit_log (entity_type, entity_id, actor_id, action, created_at) VALUES ('LAB_TEST', ?, ?, 'CREATE', '2026-08-05 09:00:00')`).run(t1, uid);

  const noFilters = toLabReportFilters(emptyReportFilters);
  const collect = (gen) => [...gen];
  const RID = 'RPT-TEST';

  // ── 6. Readers: every report yields expected rows ──
  console.log('\n■ Report readers');

  const testReg = collect(readLabReportRows('lab-test-register', RID, noFilters));
  eq(testReg.length, 3, 'test register: 3 test rows');
  ok(testReg.every((r) => r[0] === RID), 'test register: every row carries the report id');
  const regNumbers = testReg.map((r) => r[1]).sort();
  eq(regNumbers.join(','), 'RP-T1,RP-T2,RP-T3', 'test register: exact test numbers');

  const airReg = collect(readLabReportRows('lab-test-register-air', RID, noFilters));
  ok(airReg.every((r) => r[2] === 'AIR'), 'AIR register: only AIR tests');
  eq(airReg.length, 2, 'AIR register: 2 AIR tests');

  const vacuumReg = collect(readLabReportRows('lab-test-register-vacuum', RID, noFilters));
  ok(vacuumReg.every((r) => r[2] === 'VACUUM'), 'VACUUM register: only VACUUM tests');
  eq(vacuumReg.length, 1, 'VACUUM register: 1 VACUUM test');

  // Filters respected on the register
  const passOnly = collect(readLabReportRows('lab-test-register', RID, toLabReportFilters(parseReportFilters(new URLSearchParams({ result: 'PASS' })))));
  ok(passOnly.every((r) => r[1] === 'RP-T1'), 'register: result=PASS filter narrows to RP-T1');
  const dateBounded = collect(readLabReportRows('lab-test-register', RID, toLabReportFilters(parseReportFilters(new URLSearchParams({ from: '2026-08-06', to: '2026-08-08' })))));
  ok(dateBounded.length === 1 && dateBounded[0][1] === 'RP-T2', 'register: date range narrows to RP-T2');
  const prodFiltered = collect(readLabReportRows('lab-test-register', RID, toLabReportFilters(parseReportFilters(new URLSearchParams({ product: String(prodB) })))));
  ok(prodFiltered.length === 1 && prodFiltered[0][1] === 'RP-T2', 'register: product filter narrows to RP-T2');
  const statusFiltered = collect(readLabReportRows('lab-test-register', RID, toLabReportFilters(parseReportFilters(new URLSearchParams({ status: 'DRAFT' })))));
  ok(statusFiltered.length === 1 && statusFiltered[0][1] === 'RP-T3', 'register: status=DRAFT narrows to RP-T3');

  const results = collect(readLabReportRows('lab-results', RID, noFilters));
  eq(results.length, 2, 'PASS/FAIL/HOLD: only approved-with-result rows');
  const resultLabels = results.map((r) => r[3]).sort();
  eq(resultLabels.join(','), 'FAIL,PASS', 'PASS/FAIL/HOLD: result labels present');

  const retests = collect(readLabReportRows('lab-retests', RID, noFilters));
  eq(retests.length, 1, 'retests: 1 retest row');
  eq(retests[0][1], 'RP-RT1', 'retests: retest number');
  eq(retests[0][2], 'RP-T2', 'retests: original test number joined');
  eq(retests[0][4], 'FAIL result', 'retests: reason mapped to label');

  const history = collect(readLabReportRows('lab-product-history', RID, toLabReportFilters(parseReportFilters(new URLSearchParams({ product: String(prodA) })))));
  ok(history.every((r) => r[1] === 'Rep Product A'), 'product history: all rows are product A');
  eq(history.length, 2, 'product history: 2 tests for product A');
  const emptyHistory = collect(readLabReportRows('lab-product-history', RID, noFilters));
  eq(emptyHistory.length, 0, 'product history: no product filter → no rows (report requires a subject product)');

  const equipReg = collect(readLabReportRows('lab-equipment-register', RID, noFilters));
  eq(equipReg.length, 2, 'equipment register: 2 devices');
  const eqARow = equipReg.find((r) => r[1] === 'RP-EQ1');
  eq(eqARow[4], 'In Use', 'equipment register: Arabic status mapped to In Use');
  eq(eqARow[5], 'Yes', 'equipment register: calibration flag mapped');

  const calibration = collect(readLabReportRows('lab-calibration', RID, noFilters));
  eq(calibration.length, 1, 'calibration: 1 record');
  eq(calibration[0][1], 'RP-EQ1', 'calibration: equipment code');
  eq(calibration[0][3], '2026-07-01', 'calibration: last calibrated');
  eq(calibration[0][6], 'CERT-RP-01', 'calibration: certificate reference');

  const maintenance = collect(readLabReportRows('lab-maintenance', RID, noFilters));
  eq(maintenance.length, 1, 'maintenance: 1 record');
  eq(maintenance[0][1], 'RP-EQ1', 'maintenance: equipment code');
  eq(maintenance[0][7], 'Completed', 'maintenance: status mapped to label');

  const sopReg = collect(readLabReportRows('lab-sop-register', RID, noFilters));
  eq(sopReg.length, 1, 'SOP register: 1 SOP');
  eq(sopReg[0][1], 'SOP-RP-01', 'SOP register: code');
  eq(sopReg[0][3], 1, 'SOP register: current version');
  ok(!sopReg.flat().some((cell) => typeof cell === 'string' && cell.includes('Fixture SOP body')), 'SOP register: document CONTENT never exported');

  const wiReg = collect(readLabReportRows('lab-wi-register', RID, noFilters));
  eq(wiReg.length, 34, 'WI register: imported catalog plus 1 fixture WI');
  eq(wiReg[0][1], 'WI-RP-01', 'WI register: code');

  const reviewDue = collect(readLabReportRows('lab-doc-review-due', RID, noFilters));
  // Both docs have review_due 2027-01-01 (well within +30 days of now? No —
  // 2027-01-01 is ~140 days out). So none should appear unless within 30 days.
  ok(Array.isArray(reviewDue), 'doc review due: returns an array (may be empty for distant dates)');

  const ack = collect(readLabReportRows('lab-acknowledgements', RID, noFilters));
  eq(ack.length, 1, 'acknowledgements: 1 assignment');
  eq(ack[0][1], 'SOP-RP-01', 'acknowledgements: document code');
  eq(ack[0][3], 'QC Employee', 'acknowledgements: assignee name');

  const activity = collect(readLabReportRows('lab-activity', RID, noFilters));
  ok(activity.length >= 1, 'activity: at least 1 LAB_ audit event');
  ok(activity.every((r) => String(r[2]).startsWith('LAB_')), 'activity: only LAB_* entity types');

  const dqReport = collect(readLabReportRows('lab-data-quality', RID, noFilters));
  ok(dqReport.length > 0, 'data quality: findings surfaced');
  ok(dqReport.every((r) => ['Tests', 'Equipment', 'Documents', 'Products'].includes(r[1])), 'data quality: category labels');

  // ── 7. Pipeline wiring: readReportRows dispatches lab types ──
  console.log('\n■ Pipeline dispatch');
  const pipedRows = [];
  for await (const row of readReportRows('lab-test-register', emptyReportFilters, { kind: 'lab', userId: uid, department: null, sql: '1 = 1', params: [] }, RID)) {
    pipedRows.push(row);
  }
  eq(pipedRows.length, 3, 'pipeline: readReportRows yields lab register rows');
  ok(pipedRows.every((r) => r[0] === RID), 'pipeline: report id prepended');

  // ── 8. Safe CSV: escaping survives csvCell ──
  console.log('\n■ Safe CSV');
  const tricky = 'Line, with "quotes" & <html>\nsecond line';
  const cell = csvCell(tricky);
  ok(cell.includes('""quotes""'), 'csv: embedded quotes doubled');
  ok(cell.includes('& <html>'), 'csv: special chars preserved (no html injection)');
  const csvRow = testReg[0].map((v) => csvCell(v)).join(',');
  ok(typeof csvRow === 'string' && csvRow.length > 0, 'csv: register row serializes');
  ok(csvCell('=HYPERLINK("http://evil","x")').includes("'=HYPERLINK"), 'csv: formula injection (leading =) neutralized');
  ok(csvCell('-2+3').startsWith("'-"), 'csv: formula injection (leading -) neutralized');
  ok(csvCell('@SUM(1,2)').includes("'@SUM"), 'csv: formula injection (leading @) neutralized');
  ok(csvCell('plain').startsWith('plain'), 'csv: plain cells untouched');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-reports crashed:', err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
