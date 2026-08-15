// E2E spec for the QC Laboratory calendar (/lab/calendar — PROMPT 25).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-acknowledgements.mjs). Covers:
//   A. Auth wall: anonymous GET → login redirect (middleware prefix guard).
//   B. RBAC: every role (all hold LAB_VIEW) renders the calendar.
//   C. Derived events only: real stored fixture dates appear with their
//      click-through hrefs; out-of-window fixtures never surface (the calendar
//      invents nothing).
//   D. Acknowledgement scoping: supervisor sees the pending count, the employee
//      sees only their own assignment.
//   E. Month navigation: ?month= renders the requested month; a distant month
//      shows none of the in-window fixtures.
//   F. Mobile (390px) list view renders the fixture events.
//   G. No horizontal overflow at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-calendar.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH || process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

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
function eq_(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

// Local YYYY-MM-DD / naive-UTC timestamps relative to now (real dates written
// by the fixture — the calendar only ever displays stored values).
const isoDay = (days) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA');
const utcTs = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' ');
const isoMonth = (days) => isoDay(days).slice(0, 7);

const db = new Database(DB_PATH, { readonly: false });
const browser = await chromium.launch({ headless: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);
const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);

// Clean up any leftover E2E fixtures from a previous partial run.
function cleanup() {
  db.prepare(`DELETE FROM lab_document_acknowledgements WHERE document_version_id IN (SELECT id FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2ECAL-%'))`).run();
  db.prepare(`DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2ECAL-%')`).run();
  db.prepare(`DELETE FROM lab_documents WHERE code LIKE 'E2ECAL-%'`).run();
  db.prepare(`DELETE FROM lab_equipment_maintenance WHERE equipment_id IN (SELECT id FROM lab_equipment WHERE code LIKE 'E2ECAL-%')`).run();
  db.prepare(`DELETE FROM lab_equipment_calibration WHERE equipment_id IN (SELECT id FROM lab_equipment WHERE code LIKE 'E2ECAL-%')`).run();
  db.prepare(`DELETE FROM lab_test_retests WHERE retest_number LIKE 'E2ECAL-%'`).run();
  db.prepare(`DELETE FROM lab_test_records WHERE test_number LIKE 'E2ECAL-%'`).run();
  db.prepare(`DELETE FROM lab_equipment WHERE code LIKE 'E2ECAL-%'`).run();
}
cleanup();

// Fixtures: calibration, maintenance, SOP/WI review, acknowledgement, test/retest.
const insertEquipment = db.prepare(
  'INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by) VALUES (?, ?, ?, ?, ?, ?)',
);
insertEquipment.run('E2E Calendar Rig A', 'E2ECAL-EQ-A', 'Lab 1', 'NEW', 'SN-E2ECAL-A', employeeId);
insertEquipment.run('E2E Calendar Rig Far', 'E2ECAL-EQ-FAR', 'Lab 1', 'NEW', 'SN-E2ECAL-FAR', employeeId);
const eqAId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'E2ECAL-EQ-A'").get().id);
const eqFarId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'E2ECAL-EQ-FAR'").get().id);

db.prepare('INSERT INTO lab_equipment_calibration (equipment_id, calibration_due_at, created_by, created_at) VALUES (?, ?, ?, ?)')
  .run(eqAId, isoDay(5), employeeId, utcTs(-40));
db.prepare('INSERT INTO lab_equipment_calibration (equipment_id, calibration_due_at, created_by, created_at) VALUES (?, ?, ?, ?)')
  .run(eqFarId, isoDay(120), employeeId, utcTs(-40)); // far outside any month view around today

db.prepare(
  'INSERT INTO lab_equipment_maintenance (equipment_id, issue, maintenance_type, status, maintenance_date, completed_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
).run(eqAId, 'E2E planned maintenance', 'PREVENTIVE', 'PLANNED', isoDay(3), null, employeeId);

const insertDoc = db.prepare(
  'INSERT INTO lab_documents (code, title, type, owner_id, review_due_date, effective_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
);
insertDoc.run('E2ECAL-SOP-001', 'E2E Calendar SOP', 'SOP', managerId, isoDay(7), isoDay(-30), 'APPROVED', managerId);
insertDoc.run('E2ECAL-WI-001', 'E2E Calendar WI', 'WI', managerId, isoDay(10), isoDay(-30), 'APPROVED', managerId);
const sopId = Number(db.prepare("SELECT id FROM lab_documents WHERE code = 'E2ECAL-SOP-001'").get().id);

db.prepare(
  'INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, created_at) VALUES (?, 1, ?, ?, ?, ?)',
).run(sopId, 'e2e calendar content', managerId, 'APPROVED', utcTs(-30));
const versionId = Number(db.prepare('SELECT id FROM lab_document_versions WHERE document_id = ?').get(sopId).id);
db.prepare(
  'INSERT INTO lab_document_acknowledgements (document_version_id, user_id, assigned_at, status) VALUES (?, ?, ?, ?)',
).run(versionId, employeeId, utcTs(-10), 'PENDING');
db.prepare(
  'INSERT INTO lab_document_acknowledgements (document_version_id, user_id, assigned_at, status) VALUES (?, ?, ?, ?)',
).run(versionId, supervisorId, utcTs(-10), 'PENDING');

const testNumber = `E2ECAL-${Date.now()}`;
db.prepare(`INSERT INTO lab_test_records
  (test_number, test_type, sample_count, status, tested_by, created_by, created_at, updated_at)
  VALUES (?, 'air', 5, 'DRAFT', ?, ?, ?, ?)`).run(testNumber, employeeId, employeeId, utcTs(0), utcTs(0));
const testId = Number(db.prepare('SELECT id FROM lab_test_records WHERE test_number = ?').get(testNumber).id);
db.prepare('INSERT INTO lab_test_retests (retest_number, original_test_id, reason, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  .run(`E2ECAL-R-${Date.now()}`, testId, 'FAIL', 'OPEN', employeeId, utcTs(-1), utcTs(-1));

const calendarUrl = '/lab/calendar';

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${calendarUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET calendar → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. Every role renders the calendar (all hold LAB_VIEW) ──
const pages = {};
for (const username of ['admin', 'manager', 'supervisor', 'employee']) {
  const page = await browser.newPage();
  pages[username] = page;
  await login(page, username);
  const res = await page.goto(`${BASE}${calendarUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, `${username}: calendar → 200`);
  ok((await page.locator('main').innerText()).includes('Laboratory Calendar'), `${username}: calendar header rendered`);
}

// ── C. Derived events: real stored dates + click-throughs; nothing invented ──
{
  const admin = pages.admin;
  await admin.goto(`${BASE}${calendarUrl}`, { waitUntil: 'domcontentloaded' });
  const body = await admin.locator('main').innerText();

  ok(body.includes('E2E Calendar Rig A'), 'events: calibration rig name rendered');
  ok(body.includes('E2E Calendar SOP'), 'events: SOP review rendered');
  ok(body.includes('E2E Calendar WI'), 'events: WI review rendered');
  ok(body.includes(testNumber), 'events: test lifecycle event rendered');
  ok(body.includes('E2E planned maintenance'), 'events: maintenance type rendered');

  // Click-through hrefs to the source records (page reference §54).
  eq_(await admin.locator(`main a[href="/lab/equipment/${eqAId}"]`).count() > 0, true, 'click-through: equipment source link');
  eq_(await admin.locator(`main a[href="/lab/documents/${sopId}/edit"]`).count() > 0, true, 'click-through: SOP editor link');
  eq_(await admin.locator(`main a[href="/lab/acknowledgements"]`).count() > 0, true, 'click-through: acknowledgement register link');
  eq_(await admin.locator(`main a[href="/lab/tests/${testId}"]`).count() > 0, true, 'click-through: test detail link');

  // The far-out-of-window calibration fixture must NOT surface — the calendar
  // derives only what the stored dates say.
  ok(!body.includes('E2ECAL-EQ-FAR') && !body.includes('E2E Calendar Rig Far'), 'events: out-of-window fixture never rendered');
}

// ── D. Acknowledgement scoping ──
{
  const supervisor = pages.supervisor;
  await supervisor.goto(`${BASE}${calendarUrl}`, { waitUntil: 'domcontentloaded' });
  ok((await supervisor.locator('main').innerText()).includes('2 pending'), 'acknowledgement: supervisor sees the pending count');

  const employee = pages.employee;
  await employee.goto(`${BASE}${calendarUrl}`, { waitUntil: 'domcontentloaded' });
  ok((await employee.locator('main').innerText()).includes('your acknowledgement pending'), 'acknowledgement: employee sees their own assignment only');
}

// ── E. Month navigation ──
{
  const admin = pages.admin;
  const target = isoMonth(60); // ~two months ahead — no fixture lands there
  await admin.goto(`${BASE}${calendarUrl}?month=${target}`, { waitUntil: 'domcontentloaded' });
  const body = await admin.locator('main').innerText();
  const monthLabel = new Date(Date.UTC(Number(target.slice(0, 4)), Number(target.slice(5, 7)) - 1, 1))
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  ok(body.includes(monthLabel), `month nav: requested month label rendered (${monthLabel})`);
  // A distant month shows none of the in-window fixtures.
  ok(!body.includes('E2E Calendar Rig A'), 'month nav: distant month hides in-window fixtures');

  // Invalid month param falls back to the current month (no crash).
  const res = await admin.goto(`${BASE}${calendarUrl}?month=bogus`, { waitUntil: 'domcontentloaded' });
  eq_(res.status(), 200, 'month nav: invalid param → 200 fallback');
  ok((await admin.locator('main').innerText()).includes('E2E Calendar Rig A'), 'month nav: fallback month shows fixtures again');
}

// ── F. Mobile list view ──
{
  const admin = pages.admin;
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.goto(`${BASE}${calendarUrl}`, { waitUntil: 'domcontentloaded' });
  const list = await admin.locator('section[aria-label="Calendar events by date"]').innerText();
  ok(list.includes('E2E Calendar Rig A'), 'mobile: list view shows the calibration event');
  ok(list.includes('E2E Calendar SOP'), 'mobile: list view shows the SOP review event');
  await admin.setViewportSize({ width: 1440, height: 900 });
}

// ── G. No horizontal overflow ──
{
  const admin = pages.admin;
  await admin.goto(`${BASE}${calendarUrl}`, { waitUntil: 'domcontentloaded' });
  ok(!(await admin.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'calendar: no horizontal overflow at 1440px');
  await admin.setViewportSize({ width: 390, height: 844 });
  ok(!(await admin.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'calendar: no horizontal overflow at 390px');
}

// Cleanup fixtures (leave the shared DB tidy for later suites).
cleanup();

for (const page of Object.values(pages)) await page.close();
await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory calendar E2E checks passed.');
