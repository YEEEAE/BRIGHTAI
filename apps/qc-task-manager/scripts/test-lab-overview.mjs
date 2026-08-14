// Database-backed unit checks for the /lab Command Center query layer
// (src/lib/lab/overview.ts — PROMPT 04).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-db-rules.mjs). Uses a
// controlled fixture of structural rows only — no invented scientific values,
// acceptance criteria, or real equipment data; PASS/FAIL/HOLD here are just
// enum values exercised for counting.
//
// Covered:
//   1. Empty database → every KPI is 0 and every section is empty.
//   2. Seeded fixture → exact KPI numbers, section rows, review aging,
//      derived calibration states, drill-down registry completeness.
//   3. Query safety: all queries run through prepared statements (module-level
//      guarantee — asserted indirectly by running every function).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-overview-'));
const dbPath = join(tempDir, 'lab-overview.db');

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
  const overview = await import('../src/lib/lab/overview.ts');

  // ── 1. Empty database: zeros everywhere, nothing invented ──
  console.log('\n■ Empty database → zero state');
  {
    const kpis = overview.getLabKpis();
    for (const [key, value] of Object.entries(kpis)) {
      eq(value, 0, `empty: ${key} = 0`);
    }
    eq(overview.getLabRecentTests().length, 0, 'empty: recent tests section empty');
    eq(overview.getLabPendingReviews().length, 0, 'empty: pending reviews empty');
    eq(overview.getLabEquipmentAlerts().length, 0, 'empty: equipment alerts empty');
    eq(overview.getLabCalibrationAlerts().length, 0, 'empty: calibration alerts empty');
    eq(overview.getLabDocumentReviewsDue().length, 0, 'empty: document reviews empty');
    eq(overview.getLabOpenRetests().length, 0, 'empty: open retests empty');
    eq(overview.getLabRecentActivity().length, 0, 'empty: recent activity empty');
  }

  // ── 2. Controlled fixture ──
  console.log('\n■ Fixture KPIs');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();

  // Products: P1 active but without default_test_type → 1 product data-quality issue.
  db.prepare(
    'INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, NULL, 1, ?)',
  ).run('Fixture Product', 'PRD-1', employee.id);

  // Equipment + calibration (due dates derived relative to today):
  //   E1 due in +10 days → DUE_SOON (calibration due KPI)
  //   E2 due 5 days ago   → OVERDUE (equipment attention KPI)
  //   E3 no calibration record + open maintenance → attention + UNKNOWN + equipment dq issue
  //   E4 due in +60 days  → COMPLIANT (no alert)
  const insertEquipment = db.prepare(
    'INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by) VALUES (?, ?, ?, ?, ?, ?)',
  );
  insertEquipment.run('Fixture Rig A', 'EQ-A', 'Lab 1', 'NEW', 'SN-A', employee.id);
  insertEquipment.run('Fixture Rig B', 'EQ-B', 'Lab 1', 'NEW', 'SN-B', employee.id);
  insertEquipment.run('Fixture Rig C', 'EQ-C', 'Lab 1', 'NEW', 'SN-C', employee.id);
  insertEquipment.run('Fixture Rig D', 'EQ-D', 'Lab 1', 'NEW', 'SN-D', employee.id);
  const eqIds = {};
  for (const code of ['EQ-A', 'EQ-B', 'EQ-C', 'EQ-D']) {
    eqIds[code] = Number(db.prepare('SELECT id FROM lab_equipment WHERE code = ?').get(code).id);
  }
  const insertCal = db.prepare(
    'INSERT INTO lab_equipment_calibration (equipment_id, calibration_due_at, created_by) VALUES (?, ?, ?)',
  );
  const isoDay = (days) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const utcTs = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' '); // UTC naive, like datetime('now')
  insertCal.run(eqIds['EQ-A'], isoDay(10), employee.id);
  insertCal.run(eqIds['EQ-B'], isoDay(-5), employee.id);
  insertCal.run(eqIds['EQ-D'], isoDay(60), employee.id);
  db.prepare(
    "INSERT INTO lab_equipment_maintenance (equipment_id, issue, completed_date, created_by) VALUES (?, ?, NULL, ?)",
  ).run(eqIds['EQ-C'], 'Fixture open maintenance', employee.id);

  // Tests:
  //   T1 DRAFT created now, missing lot → today+1, draft+1, 1 test dq issue
  //   T2 SUBMITTED 3d ago, PASS, 2 expected samples but 1 row → week+1, awaiting+1, pass+1, 1 dq issue
  //   T3 APPROVED 10d ago, FAIL, complete → fail+1
  //   T4 UNDER_REVIEW submitted 2d ago, HOLD, complete → awaiting total 2, hold+1
  //   T5 VOID with final_result PASS → must NOT count in PASS
  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_number, test_type, product_id, equipment_id, lot_number, sample_count, final_result, status,
     tested_by, submitted_at, approved_by, approved_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'PRD-1'").get().id);

  insertTest.run('LAB-TEST-00001', 'air', productId, eqIds['EQ-D'], null, 5, null, 'DRAFT',
    employee.id, null, null, null, employee.id, utcTs(0), utcTs(0));
  insertTest.run('LAB-TEST-00002', 'vacuum', productId, eqIds['EQ-D'], 'LOT-9', 2, 'PASS', 'SUBMITTED',
    employee.id, utcTs(-3), null, null, employee.id, utcTs(-3), utcTs(-3));
  insertTest.run('LAB-TEST-00003', 'air', productId, eqIds['EQ-A'], 'LOT-9', 1, 'FAIL', 'APPROVED',
    employee.id, utcTs(-11), employee.id, utcTs(-10), employee.id, utcTs(-10), utcTs(-10));
  insertTest.run('LAB-TEST-00004', 'air', productId, eqIds['EQ-B'], 'LOT-9', 1, 'HOLD', 'UNDER_REVIEW',
    employee.id, utcTs(-2), null, null, employee.id, utcTs(-2), utcTs(0));
  insertTest.run('LAB-TEST-00005', 'vacuum', productId, eqIds['EQ-D'], 'LOT-9', 1, 'PASS', 'VOID',
    employee.id, utcTs(-9), employee.id, utcTs(-9), employee.id, utcTs(-9), utcTs(-9));

  const testIds = {};
  for (const num of ['LAB-TEST-00001', 'LAB-TEST-00002', 'LAB-TEST-00003', 'LAB-TEST-00004']) {
    testIds[num] = Number(db.prepare('SELECT id FROM lab_test_records WHERE test_number = ?').get(num).id);
  }
  db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, ?)').run(testIds['LAB-TEST-00002'], 'PASS'); // 1 of expected 2 → incomplete
  db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, ?)').run(testIds['LAB-TEST-00003'], 'FAIL');
  db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, ?)').run(testIds['LAB-TEST-00004'], 'HOLD');

  // Retests: one OPEN, one CLOSED.
  db.prepare('INSERT INTO lab_test_retests (retest_number, original_test_id, reason, status, created_by) VALUES (?, ?, ?, ?, ?)')
    .run('LAB-RETEST-00003-01', testIds['LAB-TEST-00003'], 'FAIL', 'OPEN', employee.id);
  db.prepare('INSERT INTO lab_test_retests (retest_number, original_test_id, reason, status, created_by) VALUES (?, ?, ?, ?, ?)')
    .run('LAB-RETEST-00001-01', testIds['LAB-TEST-00001'], 'OTHER', 'CLOSED', employee.id);

  // Document: review due 2 days ago, missing current_version → due KPI +1, 1 doc dq issue.
  db.prepare(
    'INSERT INTO lab_documents (code, title, type, owner_id, review_due_date, effective_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run('SOP-FIX-01', 'Fixture SOP', 'SOP', employee.id, isoDay(-2), isoDay(-30), 'APPROVED', employee.id);

  // One laboratory audit event (the SAME audit system, LAB_TEST entity type).
  db.prepare('INSERT INTO qc_audit_log (entity_type, entity_id, actor_id, action) VALUES (?, ?, ?, ?)')
    .run('LAB_TEST', testIds['LAB-TEST-00002'], employee.id, 'SUBMIT');

  const kpis = overview.getLabKpis();
  eq(kpis.tests_today, 1, 'kpi: tests today');
  eq(kpis.tests_this_week, 3, 'kpi: tests this week (T1+T2+T4 since Monday)');
  eq(kpis.draft_tests, 1, 'kpi: draft tests');
  eq(kpis.awaiting_review, 2, 'kpi: awaiting review');
  eq(kpis.approved_tests, 1, 'kpi: approved tests');
  eq(kpis.pass_tests, 1, 'kpi: PASS (VOID excluded)');
  eq(kpis.fail_tests, 1, 'kpi: FAIL');
  eq(kpis.hold_tests, 1, 'kpi: HOLD');
  eq(kpis.equipment_requiring_attention, 2, 'kpi: equipment requiring attention (overdue + open maintenance)');
  eq(kpis.calibration_due, 1, 'kpi: calibration due (due-soon only)');
  eq(kpis.documents_due_for_review, 1, 'kpi: documents due for review');
  eq(kpis.retests_open, 1, 'kpi: retests open');
  eq(kpis.data_quality_issues, 5, 'kpi: data quality issues (2 tests + 1 equipment + 1 product + 1 document)');

  console.log('\n■ Sections');
  const recent = overview.getLabRecentTests();
  eq(recent.length, 5, 'section: recent tests rows');
  eq(recent[0].test_number, 'LAB-TEST-00004', 'section: recent tests ordered by updated_at');
  ok(recent[0].product_name === 'Fixture Product', 'section: recent tests join product name');
  ok(recent[0].equipment_code === 'EQ-B', 'section: recent tests join equipment code');
  ok(recent[0].tester_name != null, 'section: recent tests join tester name');

  const pending = overview.getLabPendingReviews();
  eq(pending.length, 2, 'section: pending reviews rows');
  eq(pending[0].test_number, 'LAB-TEST-00002', 'section: pending reviews oldest first');
  eq(pending[0].aging_days, 3, 'section: review aging 3 days');
  eq(pending[1].aging_days, 2, 'section: review aging 2 days');

  const equipAlerts = overview.getLabEquipmentAlerts();
  eq(equipAlerts.length, 2, 'section: equipment alerts rows');
  ok(equipAlerts.some((e) => e.code === 'EQ-B' && e.alert === 'overdue_calibration' && e.calibration_state === 'OVERDUE'),
    'section: overdue calibration alert with derived state');
  ok(equipAlerts.some((e) => e.code === 'EQ-C' && e.alert === 'open_maintenance' && e.calibration_state === 'UNKNOWN'),
    'section: open maintenance alert');

  const calAlerts = overview.getLabCalibrationAlerts();
  eq(calAlerts.length, 2, 'section: calibration alerts rows (overdue + due soon)');
  eq(calAlerts[0].code, 'EQ-B', 'section: calibration alerts most urgent first');
  ok(calAlerts.some((c) => c.code === 'EQ-A' && c.calibration_state === 'DUE_SOON'),
    'section: due-soon equipment derived correctly');

  const docReviews = overview.getLabDocumentReviewsDue();
  eq(docReviews.length, 1, 'section: document reviews due rows');
  eq(docReviews[0].code, 'SOP-FIX-01', 'section: document review row content');
  ok(docReviews[0].owner_name != null, 'section: document review joins owner name');

  const retests = overview.getLabOpenRetests();
  eq(retests.length, 1, 'section: open retests rows');
  eq(retests[0].retest_number, 'LAB-RETEST-00003-01', 'section: retest row joins original test');
  eq(retests[0].original_test_number, 'LAB-TEST-00003', 'section: retest row original test number');
  eq(retests[0].product_name, 'Fixture Product', 'section: retest row product name');

  const activity = overview.getLabRecentActivity();
  eq(activity.length, 1, 'section: recent activity rows');
  eq(activity[0].entity_type, 'LAB_TEST', 'section: activity reads qc_audit_log LAB_* events');
  eq(activity[0].actor_name != null, true, 'section: activity joins actor name');

  console.log('\n■ Derived calibration state helper');
  eq(overview.deriveCalibrationState(null), 'UNKNOWN', 'calibration: no due date → UNKNOWN');
  eq(overview.deriveCalibrationState('1999-01-01'), 'OVERDUE', 'calibration: past due → OVERDUE');
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
  eq(overview.deriveCalibrationState(todayStr), 'DUE_TODAY', 'calibration: today → DUE_TODAY');
  const soon = new Date(Date.now() + 7 * 86_400_000).toLocaleDateString('en-CA');
  eq(overview.deriveCalibrationState(soon), 'DUE_SOON', 'calibration: +7 days → DUE_SOON');
  const far = new Date(Date.now() + 90 * 86_400_000).toLocaleDateString('en-CA');
  eq(overview.deriveCalibrationState(far), 'COMPLIANT', 'calibration: +90 days → COMPLIANT');

  console.log('\n■ Drill-down registry');
  const kpiKeys = [
    'tests_today', 'tests_this_week', 'draft_tests', 'awaiting_review', 'approved_tests',
    'pass_tests', 'fail_tests', 'hold_tests', 'equipment_requiring_attention',
    'calibration_due', 'documents_due_for_review', 'retests_open', 'data_quality_issues',
  ];
  for (const key of kpiKeys) {
    const d = overview.LAB_KPI_DRILLDOWNS[key];
    ok(d != null && typeof d.href === 'string' && d.href.startsWith('/lab/') && typeof d.hint === 'string',
      `drilldown: ${key} has a /lab target + hint`);
  }
  // Today no lab list page exists yet → every drill-down must be disabled,
  // i.e. labDrilldownEnabled never returns true for an unknown route.
  eq(overview.labDrilldownEnabled({ href: '/lab/tests', route: '/lab/tests', hint: 'x' }), false,
    'drilldown: unimplemented route disabled');
  eq(overview.labDrilldownEnabled({ href: '/lab', route: '/lab', hint: 'x' }), true,
    'drilldown: implemented route enabled');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-overview crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}
