// Database-backed unit checks for the /lab calendar query layer
// (src/lib/lab/calendar.ts — PROMPT 25).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-overview.mjs). Uses a
// controlled fixture of structural rows only — every date asserted here is a
// REAL stored date written by the fixture, never a synthesized one.
//
// Covered:
//   1. Empty database → zero events, 42-cell grid, empty upcoming/overdue.
//   2. Month helpers: resolveCalendarMonth fallback, buildCalendarMonth grid
//      shape (Monday-first, 6 rows), shiftIsoDate arithmetic.
//   3. Derived events: calibration (latest-record COALESCE rule), maintenance
//      (scheduled/completed), SOP + WI review deadlines, acknowledgement
//      deadlines (anchored to the document's real review_due_date), test +
//      retest lifecycle dates — each with a click-through href.
//   4. Employee scope mirrors the task-list rule: own acknowledgements and
//      own tests only; supervisors+ see everything.
//   5. Out-of-window dates are excluded (no invented events).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-calendar-'));
const dbPath = join(tempDir, 'lab-calendar.db');

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
  // Keep the empty-DB fixture empty (no device seed).
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
  const calendar = await import('../src/lib/lab/calendar.ts');

  const isoDay = (days) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const utcTs = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' ');

  // ── 1. Empty database: nothing invented ──
  console.log('\n■ Empty database → zero state');
  {
    const data = calendar.labCalendarData({ role: 'admin', userId: 1 });
    eq(data.events.length, 0, 'empty: no events');
    eq(data.upcoming.length, 0, 'empty: no upcoming deadlines');
    eq(data.overdue.length, 0, 'empty: no overdue deadlines');
    eq(data.month.days.length, 42, 'empty: grid is 6 rows × 7 days');
    ok(data.month.days.every((d) => d.events.length === 0), 'empty: every day cell has no events');
    ok(/^\d{4}-\d{2}$/.test(data.month.prev.split('month=')[1]), 'empty: prev month param well-formed');
  }

  // ── 2. Month helpers ──
  console.log('\n■ Month helpers');
  {
    const today = isoDay(0);
    const resolved = calendar.resolveCalendarMonth(null, today);
    eq(resolved.year, Number(today.slice(0, 4)), 'resolve: null → current year');
    eq(resolved.month, Number(today.slice(5, 7)), 'resolve: null → current month');
    eq(calendar.resolveCalendarMonth('2026-13', today).month, resolved.month, 'resolve: month 13 rejected → fallback');
    eq(calendar.resolveCalendarMonth('bogus', today).year, resolved.year, 'resolve: garbage rejected → fallback');
    const jan = calendar.resolveCalendarMonth('2026-01', today);
    eq(jan.year, 2026, 'resolve: valid param year');
    eq(jan.month, 1, 'resolve: valid param month');

    const grid = calendar.buildCalendarMonth(2026, 8, today);
    eq(grid.days.length, 42, 'grid: 42 cells');
    eq(grid.days[0].iso < '2026-08-01' || grid.days[0].iso === '2026-08-01', true, 'grid: Monday-first padding');
    const firstOfAug = grid.days.find((d) => d.iso === '2026-08-01');
    ok(firstOfAug != null && firstOfAug.inMonth, 'grid: 2026-08-01 present + in month');
    ok(grid.prev.includes('month=2026-07'), 'grid: prev link → July');
    ok(grid.next.includes('month=2026-09'), 'grid: next link → September');
    ok(grid.label.includes('2026'), 'grid: label carries the year');

    eq(calendar.shiftIsoDate('2026-08-31', 1), '2026-09-01', 'shift: month rollover');
    eq(calendar.shiftIsoDate('2026-01-01', -1), '2025-12-31', 'shift: year rollover backwards');
    eq(calendar.shiftIsoDate('2024-02-28', 1), '2024-02-29', 'shift: leap day');
  }

  // ── 3. Controlled fixture: real stored dates only ──
  console.log('\n■ Fixture derived events');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const supervisor = db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get();

  // Equipment + calibration:
  //   EQ-C1 due in +10 days  → calibration event inside window
  //   EQ-C2 due in +90 days  → OUTSIDE the month grid window
  //   EQ-C3 two records: old due -100, latest next_due_at +20 → latest wins
  const insertEquipment = db.prepare(
    'INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by) VALUES (?, ?, ?, ?, ?, ?)',
  );
  insertEquipment.run('Fixture Rig C1', 'EQ-C1', 'Lab 1', 'NEW', 'SN-C1', employee.id);
  insertEquipment.run('Fixture Rig C2', 'EQ-C2', 'Lab 1', 'NEW', 'SN-C2', employee.id);
  insertEquipment.run('Fixture Rig C3', 'EQ-C3', 'Lab 1', 'NEW', 'SN-C3', employee.id);
  const eqId = (code) => Number(db.prepare('SELECT id FROM lab_equipment WHERE code = ?').get(code).id);
  const insertCal = db.prepare(
    'INSERT INTO lab_equipment_calibration (equipment_id, calibration_due_at, next_due_at, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  insertCal.run(eqId('EQ-C1'), isoDay(10), null, employee.id, utcTs(-40));
  insertCal.run(eqId('EQ-C2'), isoDay(90), null, employee.id, utcTs(-40));
  // EQ-C3: older record with a stale due date, then the LATEST record with next_due_at +20.
  insertCal.run(eqId('EQ-C3'), isoDay(-100), null, employee.id, utcTs(-120));
  insertCal.run(eqId('EQ-C3'), isoDay(-110), isoDay(20), employee.id, utcTs(-1));

  // Maintenance: scheduled in +3 days (planned), one completed -2 days (real completed_date).
  db.prepare(
    'INSERT INTO lab_equipment_maintenance (equipment_id, issue, maintenance_type, status, maintenance_date, completed_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(eqId('EQ-C1'), 'Fixture planned maintenance', 'PREVENTIVE', 'PLANNED', isoDay(3), null, employee.id);
  db.prepare(
    'INSERT INTO lab_equipment_maintenance (equipment_id, issue, maintenance_type, status, maintenance_date, completed_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(eqId('EQ-C2'), 'Fixture done maintenance', 'CORRECTIVE', 'COMPLETED', isoDay(-5), utcTs(-2), employee.id);

  // Documents: SOP review due +5 days, WI review due +12 days, one SUPERSEDED
  // SOP (must NOT appear), one without review_due_date (must NOT appear).
  const insertDoc = db.prepare(
    'INSERT INTO lab_documents (code, title, type, owner_id, review_due_date, effective_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  insertDoc.run('SOP-CAL-01', 'Fixture SOP', 'SOP', employee.id, isoDay(5), isoDay(-30), 'APPROVED', employee.id);
  insertDoc.run('WI-CAL-01', 'Fixture WI', 'WI', employee.id, isoDay(12), isoDay(-30), 'APPROVED', employee.id);
  insertDoc.run('SOP-CAL-02', 'Fixture Superseded SOP', 'SOP', employee.id, isoDay(2), isoDay(-30), 'SUPERSEDED', employee.id);
  insertDoc.run('SOP-CAL-03', 'Fixture No-Date SOP', 'SOP', employee.id, null, isoDay(-30), 'APPROVED', employee.id);

  // Document version + acknowledgements: SOP-CAL-01 has two PENDING acks
  // (employee + supervisor), anchored to the document's real review_due_date.
  const sopDocId = Number(db.prepare("SELECT id FROM lab_documents WHERE code = 'SOP-CAL-01'").get().id);
  db.prepare(
    'INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, created_at) VALUES (?, 1, ?, ?, ?, ?)',
  ).run(sopDocId, 'fixture content', employee.id, 'APPROVED', utcTs(-30));
  const versionId = Number(db.prepare('SELECT id FROM lab_document_versions WHERE document_id = ?').get(sopDocId).id);
  db.prepare(
    'INSERT INTO lab_document_acknowledgements (document_version_id, user_id, assigned_at, status) VALUES (?, ?, ?, ?)',
  ).run(versionId, employee.id, utcTs(-10), 'PENDING');
  db.prepare(
    'INSERT INTO lab_document_acknowledgements (document_version_id, user_id, assigned_at, status) VALUES (?, ?, ?, ?)',
  ).run(versionId, supervisor.id, utcTs(-10), 'PENDING');

  // Tests: created today (DRAFT), submitted -1 day, approved +0 day.
  const productId = Number(db.prepare('SELECT id FROM lab_products LIMIT 1').get()?.id ?? 0);
  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_number, test_type, product_id, sample_count, status,
     tested_by, submitted_at, approved_by, approved_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertTest.run('LAB-CAL-00001', 'air', productId || null, 5, 'DRAFT',
    employee.id, null, null, null, employee.id, utcTs(0), utcTs(0));
  insertTest.run('LAB-CAL-00002', 'vacuum', productId || null, 5, 'SUBMITTED',
    employee.id, utcTs(-1), null, null, employee.id, utcTs(-1), utcTs(-1));
  insertTest.run('LAB-CAL-00003', 'air', productId || null, 5, 'APPROVED',
    employee.id, utcTs(-6), employee.id, utcTs(0), employee.id, utcTs(-6), utcTs(-6));
  // A test by the supervisor only — employee scope must exclude it.
  insertTest.run('LAB-CAL-00004', 'air', productId || null, 5, 'DRAFT',
    supervisor.id, null, null, null, supervisor.id, utcTs(0), utcTs(0));

  // Retest: created -1 day (real created_at).
  const testId3 = Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'LAB-CAL-00003'").get().id);
  db.prepare('INSERT INTO lab_test_retests (retest_number, original_test_id, reason, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('LAB-CAL-00003-01', testId3, 'FAIL', 'OPEN', employee.id, utcTs(-1), utcTs(-1));

  // Wide window covering every fixture date.
  const from = isoDay(-15);
  const to = isoDay(30);

  const adminEvents = calendar.labCalendarEvents({ from, to, role: 'admin', userId: Number(supervisor.id) });
  const types = new Set(adminEvents.map((e) => e.type));
  ok(types.has('calibration'), 'events: calibration derived');
  ok(types.has('maintenance'), 'events: maintenance derived');
  ok(types.has('sop_review'), 'events: SOP review derived');
  ok(types.has('wi_review'), 'events: WI review derived');
  ok(types.has('acknowledgement'), 'events: acknowledgement derived');
  ok(types.has('test_created'), 'events: test created derived');
  ok(types.has('test_submitted'), 'events: test submitted derived');
  ok(types.has('test_approved'), 'events: test approved derived');
  ok(types.has('retest_created'), 'events: retest created derived');

  // Calibration: latest-record COALESCE rule — EQ-C3 uses next_due_at (+20),
  // never the stale -100 record. EQ-C2 (+90) is outside the window.
  const calEvents = adminEvents.filter((e) => e.type === 'calibration');
  eq(calEvents.length, 2, 'calibration: only in-window events (EQ-C1, EQ-C3)');
  ok(calEvents.some((e) => e.date === isoDay(10) && e.label === 'Fixture Rig C1'), 'calibration: EQ-C1 due date preserved');
  ok(calEvents.some((e) => e.date === isoDay(20) && e.label === 'Fixture Rig C3'), 'calibration: latest-record next_due_at wins');
  ok(!calEvents.some((e) => e.date === isoDay(-100)), 'calibration: stale record never surfaces');
  ok(!calEvents.some((e) => e.label === 'Fixture Rig C2'), 'calibration: out-of-window event excluded');

  // Maintenance: planned +3, completed -2 (real completed_date).
  const maintEvents = adminEvents.filter((e) => e.type === 'maintenance');
  eq(maintEvents.length, 2, 'maintenance: both scheduled and completed events');
  ok(maintEvents.some((e) => e.date === isoDay(3) && e.detail.includes('planned')), 'maintenance: planned uses maintenance_date');
  ok(maintEvents.some((e) => e.date === isoDay(-2) && e.detail.includes('completed')), 'maintenance: completed uses completed_date');

  // Document reviews: SOP +5, WI +12; SUPERSEDED and no-date docs excluded.
  const sopEvents = adminEvents.filter((e) => e.type === 'sop_review');
  const wiEvents = adminEvents.filter((e) => e.type === 'wi_review');
  eq(sopEvents.length, 1, 'sop_review: only live SOP with a date');
  eq(sopEvents[0].date, isoDay(5), 'sop_review: real review_due_date');
  ok(sopEvents[0].href === `/lab/documents/${sopDocId}/edit`, 'sop_review: click-through to editor');
  eq(wiEvents.length, 1, 'wi_review: only live WI with a date');
  eq(wiEvents[0].date, isoDay(12), 'wi_review: real review_due_date');
  ok(!adminEvents.some((e) => e.label.includes('Superseded')), 'review: SUPERSEDED document excluded');
  ok(!adminEvents.some((e) => e.label.includes('No-Date')), 'review: document without a date excluded');

  // Acknowledgement: anchored to the document's real review_due_date (+5).
  const ackEvents = adminEvents.filter((e) => e.type === 'acknowledgement');
  eq(ackEvents.length, 1, 'acknowledgement: one pending document group');
  eq(ackEvents[0].date, isoDay(5), 'acknowledgement: anchored to document review date');
  ok(ackEvents[0].detail.includes('2 pending'), 'acknowledgement: counts both pending users');
  ok(ackEvents[0].href === '/lab/acknowledgements', 'acknowledgement: click-through to register');

  // Test/retest lifecycle: real dates only.
  const createdEvents = adminEvents.filter((e) => e.type === 'test_created');
  ok(createdEvents.some((e) => e.label.startsWith('LAB-CAL-00001')), 'test_created: draft test today');
  const submittedEvents = adminEvents.filter((e) => e.type === 'test_submitted');
  // Both LAB-CAL-00002 and the approved LAB-CAL-00003 were submitted.
  eq(submittedEvents.length, 2, 'test_submitted: every submitted test');
  const submitted00002 = submittedEvents.find((e) => e.label.startsWith('LAB-CAL-00002'));
  ok(submitted00002 != null && submitted00002.date === isoDay(-1), 'test_submitted: real submitted_at');
  const approvedEvents = adminEvents.filter((e) => e.type === 'test_approved');
  eq(approvedEvents.length, 1, 'test_approved: only approved test');
  const retestEvents = adminEvents.filter((e) => e.type === 'retest_created');
  eq(retestEvents.length, 1, 'retest_created: one retest');
  ok(retestEvents[0].href.includes('/lab/retests/'), 'retest: click-through to retest detail');

  // Every event carries a click-through href (page reference §54).
  ok(adminEvents.every((e) => typeof e.href === 'string' && e.href.startsWith('/lab/')), 'events: every event has a /lab click-through href');
  // Deterministic ordering: sorted by date.
  const dates = adminEvents.map((e) => e.date);
  ok(dates.every((d, i) => i === 0 || dates[i - 1] <= d), 'events: sorted by date ascending');

  // ── 4. Employee scope: task-list rule (own acks + own tests only) ──
  console.log('\n■ Employee scope');
  {
    const empEvents = calendar.labCalendarEvents({ from, to, role: 'employee', userId: Number(employee.id) });
    // Shared operational data stays visible.
    ok(empEvents.some((e) => e.type === 'calibration'), 'employee: sees shared calibration events');
    ok(empEvents.some((e) => e.type === 'maintenance'), 'employee: sees shared maintenance events');
    // Acknowledgements: the fixture doc has acks for employee + supervisor, but
    // the employee-scoped query counts only their own assignment.
    const empAck = empEvents.filter((e) => e.type === 'acknowledgement');
    eq(empAck.length, 1, 'employee: own acknowledgement group');
    ok(empAck[0].detail.includes('your acknowledgement pending'), 'employee: ack detail is personal');
    // Tests: supervisor-only LAB-CAL-00004 must NOT appear for the employee.
    ok(!empEvents.some((e) => e.label.startsWith('LAB-CAL-00004')), 'employee: foreign test excluded by scope rule');
    ok(empEvents.some((e) => e.label.startsWith('LAB-CAL-00001')), 'employee: own test visible');
  }

  // ── 5. Page data: grid placement + windows ──
  console.log('\n■ Page data (labCalendarData)');
  {
    const today = isoDay(0);
    const currentMonth = `${today.slice(0, 4)}-${today.slice(5, 7)}`;
    const data = calendar.labCalendarData({ monthParam: currentMonth, role: 'admin', userId: Number(supervisor.id) });
    eq(data.today, today, 'data: today propagated');
    ok(data.month.days.some((d) => d.events.length > 0), 'data: events placed onto day cells');
    // Placed events are only inside the displayed grid.
    ok(data.month.days.every((d) => d.events.every((e) => e.date === d.iso)), 'data: events placed on their own date');
    // Overdue window includes the completed maintenance (-2) only if its type is
    // a deadline type — maintenance is, so overdue >= 1 here.
    ok(data.overdue.length >= 1, 'data: overdue list populated from real past deadlines');
    ok(data.upcoming.length >= 3, 'data: upcoming list has calibration/SOP/WI deadlines');
    // Upcoming never contains lifecycle events.
    ok(data.upcoming.every((e) => (calendar.LAB_CALENDAR_DEADLINE_TYPES).includes(e.type)), 'data: upcoming is deadline-types only');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-calendar crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}
