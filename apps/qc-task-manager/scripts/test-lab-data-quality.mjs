// Database-backed unit checks for the QC Laboratory Data Quality detectors
// (src/lib/lab/dataQuality.ts — PROMPT 27, page reference §56/§75).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-overview.mjs). Uses a
// controlled fixture of structural rows only — no invented scientific values
// or real equipment data; PASS/FAIL/HOLD here are just enum values exercised
// for the consistency checks.
//
// Covered:
//   1. Empty database → zero findings in every category.
//   2. Seeded fixture → exact finding set per category: kind, record label,
//      href (link into the owning register), severity, and the read-only
//      guarantee (the report SELECTs; nothing is mutated).
//   3. Scope rules: VOID tests are exempt from required-field gaps, archived
//      equipment and SUPERSEDED/ARCHIVED documents are never reported, and
//      inactive products are only flagged while live tests reference them.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-data-quality-'));
const dbPath = join(tempDir, 'lab-data-quality.db');

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
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // PROMPT 11: keep the empty-DB fixture empty (no 24-device seed).
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  // Avoid starting the production catch-up backup during this focused test.
  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const dq = await import('../src/lib/lab/dataQuality.ts');

  // ── 1. Empty database: no findings, nothing invented ──
  console.log('\n■ Empty database → zero findings');
  {
    const report = dq.runLabDataQualityChecks();
    eq(report.tests.length, 0, 'empty: no test findings');
    eq(report.equipment.length, 0, 'empty: no equipment findings');
    eq(report.documents.length, 0, 'empty: no document findings');
    eq(report.products.length, 0, 'empty: no product findings');
    eq(report.total, 0, 'empty: total is 0');
  }

  // ── 2. Seeded fixture ──
  console.log('\n■ Fixture findings');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();

  // Products:
  //   P-GOOD  active, complete                       → no finding
  //   P-GAP   active, default_test_type NULL         → product_missing_default_test_type
  //   P-INACT inactive + referenced by a live test   → product_inactive_in_use
  const insertProduct = db.prepare(
    'INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
  );
  insertProduct.run('Fixture Product Good', 'DQ-P1', 'air', 1, employee.id);
  insertProduct.run('Fixture Product Gap', 'DQ-P2', null, 1, employee.id);
  insertProduct.run('Fixture Product Inactive', 'DQ-P3', 'vacuum', 0, employee.id);
  const productGood = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'DQ-P1'").get().id);
  const productInactive = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'DQ-P3'").get().id);

  // Equipment:
  //   EQ-OK   complete + calibration flag set        → no finding
  //   EQ-GAP  no serial, no calibration flag         → 2 findings (serial, state)
  //   EQ-ARC  archived, missing serial               → never reported
  const insertEquipment = db.prepare(
    'INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, calibration_status_raw, is_archived, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  insertEquipment.run('Fixture Rig OK', 'DQ-EQ1', 'Lab 1', 'NEW', 'SN-1', 'yes', 0, employee.id);
  insertEquipment.run('Fixture Rig Gap', 'DQ-EQ2', 'Lab 2', 'NEW', null, null, 0, employee.id);
  insertEquipment.run('Fixture Rig Archived', 'DQ-EQ3', 'Lab 3', 'NEW', null, null, 1, employee.id);
  const eqOk = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'DQ-EQ1'").get().id);

  // Tests:
  //   DQ-T1 DRAFT, missing lot                        → test_missing_lot
  //   DQ-T2 SUBMITTED, missing equipment + tester     → 2 findings, no submission gap
  //   DQ-T3 APPROVED, complete (final_result PASS)    → no finding
  //   DQ-T4 APPROVED, final_result NULL               → test_missing_final_result
  //   DQ-T5 SUBMITTED, no submitted_at                → test_missing_submission (danger)
  //   DQ-T6 UNDER_REVIEW, reviewed_at NULL            → test_inconsistent_status (danger)
  //   DQ-T7 VOID, missing everything                  → exempt everywhere
  //   DQ-T8 SUBMITTED, 1 of 2 sample rows             → test_incomplete_samples
  //   (DQ-T8 references the INACTIVE product → powers product_inactive_in_use)
  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_number, test_type, product_id, equipment_id, lot_number, sample_count, final_result, status,
     tested_by, submitted_at, reviewed_at, approved_by, approved_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertTest.run('DQ-T1', 'air', productGood, eqOk, null, 1, null, 'DRAFT',
    employee.id, null, null, null, null, employee.id, '2026-08-10 09:00:00', '2026-08-10 09:00:00');
  insertTest.run('DQ-T2', 'vacuum', productGood, null, 'LOT-DQ', 1, null, 'SUBMITTED',
    null, '2026-08-11 09:00:00', null, null, null, employee.id, '2026-08-11 09:00:00', '2026-08-11 09:00:00');
  insertTest.run('DQ-T3', 'air', productGood, eqOk, 'LOT-DQ', 1, 'PASS', 'APPROVED',
    employee.id, '2026-08-09 09:00:00', '2026-08-10 09:00:00', employee.id, '2026-08-10 10:00:00',
    employee.id, '2026-08-09 09:00:00', '2026-08-10 10:00:00');
  insertTest.run('DQ-T4', 'air', productGood, eqOk, 'LOT-DQ', 1, null, 'APPROVED',
    employee.id, '2026-08-09 09:00:00', '2026-08-10 09:00:00', employee.id, '2026-08-10 10:00:00',
    employee.id, '2026-08-09 09:00:00', '2026-08-10 10:00:00');
  insertTest.run('DQ-T5', 'air', productGood, eqOk, 'LOT-DQ', 1, null, 'SUBMITTED',
    employee.id, null, null, null, null, employee.id, '2026-08-12 09:00:00', '2026-08-12 09:00:00');
  insertTest.run('DQ-T6', 'air', productGood, eqOk, 'LOT-DQ', 1, null, 'UNDER_REVIEW',
    employee.id, '2026-08-12 09:00:00', null, null, null, employee.id, '2026-08-12 09:00:00', '2026-08-12 10:00:00');
  insertTest.run('DQ-T7', 'air', productGood, null, null, 3, null, 'VOID',
    null, null, null, null, null, employee.id, '2026-08-08 09:00:00', '2026-08-08 09:00:00');
  insertTest.run('DQ-T8', 'vacuum', productInactive, eqOk, 'LOT-DQ', 2, null, 'SUBMITTED',
    employee.id, '2026-08-13 09:00:00', null, null, null, employee.id, '2026-08-13 09:00:00', '2026-08-13 09:00:00');
  const testIds = {};
  for (const num of ['DQ-T1', 'DQ-T2', 'DQ-T3', 'DQ-T4', 'DQ-T5', 'DQ-T6', 'DQ-T8']) {
    testIds[num] = Number(db.prepare('SELECT id FROM lab_test_records WHERE test_number = ?').get(num).id);
  }
  // Complete sample grids everywhere except DQ-T8 (1 of 2 rows), so each test
  // demonstrates exactly the gap it was created for.
  for (const num of ['DQ-T1', 'DQ-T2', 'DQ-T3', 'DQ-T4', 'DQ-T5', 'DQ-T6']) {
    db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, ?)').run(testIds[num], 'PASS');
  }
  db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, ?)').run(testIds['DQ-T8'], 'PASS'); // 1 of 2

  // Documents:
  //   SOP-DQ-OK   complete APPROVED with approval metadata      → no finding
  //   SOP-DQ-GAP  IN_REVIEW, no owner/effective/version pointer → 3 findings
  //   SOP-DQ-APR  APPROVED, approver but no approved_at date    → missing approval metadata
  //   SOP-DQ-SUP  SUPERSEDED with gaps                          → never reported
  const insertDoc = db.prepare(
    `INSERT INTO lab_documents (code, title, type, owner_id, approver_id, current_version_id,
       status, effective_date, review_due_date, approved_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insertDoc.run('SOP-DQ-OK', 'Fixture SOP OK', 'SOP', employee.id, employee.id, null,
    'APPROVED', '2026-07-01', '2026-12-01', '2026-07-01 09:00:00', employee.id);
  insertDoc.run('SOP-DQ-GAP', 'Fixture SOP Gap', 'WI', null, null, null,
    'IN_REVIEW', null, '2026-12-01', null, employee.id);
  insertDoc.run('SOP-DQ-APR', 'Fixture SOP Approved', 'SOP', employee.id, employee.id, null,
    'APPROVED', '2026-07-15', '2026-12-01', null, employee.id);
  insertDoc.run('SOP-DQ-SUP', 'Fixture SOP Superseded', 'WI', null, null, null,
    'SUPERSEDED', null, null, null, employee.id);

  // The live documents need real current_version pointers (FK) to stay clean
  // apart from the one gap each is meant to demonstrate.
  db.prepare(
    `INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, approved_by, approved_at)
     VALUES ((SELECT id FROM lab_documents WHERE code = 'SOP-DQ-OK'), 1, '# Fixture', ?, 'APPROVED', ?, '2026-07-01 09:00:00')`,
  ).run(employee.id, employee.id);
  db.prepare(
    `INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, approved_by, approved_at)
     VALUES ((SELECT id FROM lab_documents WHERE code = 'SOP-DQ-APR'), 1, '# Fixture', ?, 'APPROVED', ?, '2026-07-15 09:00:00')`,
  ).run(employee.id, employee.id);
  db.prepare(
    "UPDATE lab_documents SET current_version_id = (SELECT id FROM lab_document_versions WHERE document_id = (SELECT id FROM lab_documents WHERE code = 'SOP-DQ-OK')) WHERE code = 'SOP-DQ-OK'",
  ).run();
  db.prepare(
    "UPDATE lab_documents SET current_version_id = (SELECT id FROM lab_document_versions WHERE document_id = (SELECT id FROM lab_documents WHERE code = 'SOP-DQ-APR')) WHERE code = 'SOP-DQ-APR'",
  ).run();

  // Snapshot before the report — the detectors must be read-only.
  const beforeCounts = [
    db.prepare('SELECT COUNT(*) AS n FROM lab_test_records').get().n,
    db.prepare('SELECT COUNT(*) AS n FROM lab_equipment').get().n,
    db.prepare('SELECT COUNT(*) AS n FROM lab_documents').get().n,
    db.prepare('SELECT COUNT(*) AS n FROM lab_products').get().n,
  ];
  const beforeHash = JSON.stringify(
    db.prepare(`SELECT id, status, lot_number, equipment_id, tested_by, submitted_at, reviewed_at, approved_at, final_result FROM lab_test_records ORDER BY id`).all(),
  );

  const report = dq.runLabDataQualityChecks();

  // Read-only guarantee: identical rows + counts after the full report run.
  eq(db.prepare('SELECT COUNT(*) AS n FROM lab_test_records').get().n, beforeCounts[0], 'read-only: test row count unchanged');
  eq(db.prepare('SELECT COUNT(*) AS n FROM lab_equipment').get().n, beforeCounts[1], 'read-only: equipment row count unchanged');
  eq(db.prepare('SELECT COUNT(*) AS n FROM lab_documents').get().n, beforeCounts[2], 'read-only: document row count unchanged');
  eq(db.prepare('SELECT COUNT(*) AS n FROM lab_products').get().n, beforeCounts[3], 'read-only: product row count unchanged');
  eq(
    JSON.stringify(db.prepare(`SELECT id, status, lot_number, equipment_id, tested_by, submitted_at, reviewed_at, approved_at, final_result FROM lab_test_records ORDER BY id`).all()),
    beforeHash,
    'read-only: test fields untouched',
  );

  console.log('\n■ Test findings');
  const kindsOf = (issues) => issues.map((i) => i.kind).sort();
  eq(kindsOf(report.tests).join(','),
    [
      'test_incomplete_samples',
      'test_inconsistent_status',
      'test_missing_equipment',
      'test_missing_final_result',
      'test_missing_lot',
      'test_missing_submission',
      'test_missing_tester',
    ].join(','),
    'tests: exact finding set (VOID exempt, DQ-T3 clean)');
  const byKind = (issues, kind) => issues.filter((i) => i.kind === kind);
  eq(byKind(report.tests, 'test_missing_lot')[0].record, 'DQ-T1', 'tests: missing lot points at DQ-T1');
  ok(byKind(report.tests, 'test_missing_lot')[0].href === `/lab/tests/${Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'DQ-T1'").get().id)}`,
    'tests: finding links to the owning test record');
  eq(byKind(report.tests, 'test_missing_final_result')[0].record, 'DQ-T4', 'tests: approved without final result flagged');
  eq(byKind(report.tests, 'test_missing_submission')[0].record, 'DQ-T5', 'tests: missing submission date flagged');
  eq(byKind(report.tests, 'test_inconsistent_status')[0].record, 'DQ-T6', 'tests: missing reviewed_at flagged as inconsistent');
  eq(byKind(report.tests, 'test_incomplete_samples')[0].record, 'DQ-T8', 'tests: incomplete sample grid flagged');
  ok(report.tests.every((i) => !i.record.startsWith('DQ-T7')), 'tests: VOID record never reported');

  console.log('\n■ Equipment findings');
  eq(kindsOf(report.equipment).join(','), 'equipment_missing_calibration_state,equipment_missing_serial',
    'equipment: exactly the serial + calibration-state gaps on DQ-EQ2');
  ok(report.equipment.every((i) => i.record === 'DQ-EQ2'), 'equipment: findings point at DQ-EQ2');
  ok(report.equipment.every((i) => !i.record.includes('DQ-EQ3')), 'equipment: archived device never reported');

  console.log('\n■ Document findings');
  eq(kindsOf(report.documents).join(','),
    [
      'document_missing_approval_metadata',
      'document_missing_current_version',
      'document_missing_effective_date',
      'document_missing_owner',
    ].join(','),
    'documents: exact finding set (SUPERSEDED exempt, OK doc clean)');
  eq(byKind(report.documents, 'document_missing_owner')[0].record, 'SOP-DQ-GAP', 'documents: missing owner flagged');
  eq(byKind(report.documents, 'document_missing_approval_metadata')[0].record, 'SOP-DQ-APR', 'documents: approved without approval date flagged');
  ok(byKind(report.documents, 'document_missing_owner')[0].href.includes('/edit'), 'documents: finding links to the edit page');
  ok(report.documents.every((i) => i.record !== 'SOP-DQ-SUP'), 'documents: superseded document never reported');

  console.log('\n■ Product findings');
  eq(kindsOf(report.products).join(','), 'product_inactive_in_use,product_missing_default_test_type',
    'products: exact finding set');
  eq(byKind(report.products, 'product_missing_default_test_type')[0].record, 'DQ-P2', 'products: missing default test type flagged');
  ok(byKind(report.products, 'product_inactive_in_use')[0].detail.includes('1 live test'),
    'products: inactive product reports its live test count');

  console.log('\n■ Severity policy');
  eq(dq.labDataQualitySeverity('test_missing_final_result'), 'danger', 'severity: final result gap is danger');
  eq(dq.labDataQualitySeverity('test_inconsistent_status'), 'danger', 'severity: inconsistent status is danger');
  eq(dq.labDataQualitySeverity('test_missing_submission'), 'danger', 'severity: missing submission is danger');
  eq(dq.labDataQualitySeverity('product_inactive_in_use'), 'danger', 'severity: inactive product in use is danger');
  eq(dq.labDataQualitySeverity('test_missing_lot'), 'info', 'severity: plain gaps are informational');
  eq(dq.labDataQualitySeverity('document_missing_owner'), 'info', 'severity: document gaps are informational');

  eq(report.total, report.tests.length + report.equipment.length + report.documents.length + report.products.length,
    'report: total equals the category sum');
  eq(report.total, 15, 'report: total finding count (7 tests + 2 equipment + 4 documents + 2 products)');

  // Every label + every issue has a display label (no undefined badge text).
  for (const issue of [...report.tests, ...report.equipment, ...report.documents, ...report.products]) {
    if (dq.LAB_DATA_QUALITY_ISSUE_LABELS[issue.kind] == null) {
      ok(false, `label: missing label for ${issue.kind}`);
    }
  }
  ok(Object.keys(dq.LAB_DATA_QUALITY_ISSUE_LABELS).length === 19, 'labels: all 19 kinds labeled');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-data-quality crashed:', err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
