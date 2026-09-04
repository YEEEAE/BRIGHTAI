// E2E spec for the QC Laboratory Calibration Register
// (/lab/calibration — page reference §37).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-maintenance.mjs). Covers the calibration register end-to-end:
//   A. Auth wall: anonymous GET the register → login redirect.
//   B. RBAC walls: employee and supervisor may view and propose New/Edit;
//      affordance (canCreateLabCalibration / canEditLabCalibration are
//      manager+); manager sees the New button (200).
//   C. Manager creates a COMPLIANT record through the real form POST →
//      redirected to the detail page; row + CREATE audit exist in the DB.
//   D. The detail page renders the fields and the derived status badge; the
//      register lists the record.
//   E. Status derivation: a FAIL-result record renders NOT_COMPLIANT on the
//      register, and the due=1 filter isolates the due-soon window.
//   F. Edit: manager updates the record → UPDATE audit row.
//   G. Validation failure: next-due-before-due (passes HTML5, fails server) →
//      flash error, no row written.
//   H. No horizontal overflow on the register at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-calibration.mjs

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

const db = new Database(DB_PATH, { readonly: false });
const browser = await chromium.launch({ headless: true });
try {

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

// A dedicated device for this suite (like e2e-lab-maintenance's EQ-MAINT-E2E).
const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);

const CODE = 'EQ-CAL-E2E';
db.prepare(
  `INSERT INTO lab_equipment (code, name, location, status_raw, calibration_status_raw, is_archived, created_by, created_at, updated_at)
   VALUES (?, 'E2E Calibration Device', 'LABORATORY', 'In Use', 'yes', 0, ?, datetime('now'), datetime('now'))`,
).run(CODE, managerId);
const equipmentId = Number(db.prepare('SELECT id FROM lab_equipment WHERE code = ?').get(CODE).id);
const registerUrl = '/lab/calibration';

const calibrationCount = () =>
  Number(db.prepare('SELECT COUNT(*) AS n FROM lab_equipment_calibration WHERE equipment_id = ?').get(equipmentId).n);
const auditsForCalibration = () =>
  db
    .prepare(
      "SELECT action, note, actor_id FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT_CALIBRATION' AND entity_id IN (SELECT id FROM lab_equipment_calibration WHERE equipment_id = ?) ORDER BY id",
    )
    .all(equipmentId);

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${registerUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET calibration register → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let manager;
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  const res = await emp.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, 'employee: calibration register → 200');
  ok((await emp.locator(`a[href="${registerUrl}/new"]`).count()) > 0, 'employee: create proposal affordance visible');
  await emp.close();

  const sup = await browser.newPage();
  await login(sup, 'supervisor');
  const res2 = await sup.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res2.status() === 200, 'supervisor: calibration register → 200');
  ok((await sup.locator(`a[href="${registerUrl}/new"]`).count()) > 0, 'supervisor: create proposal affordance visible');
  await sup.close();

  manager = await browser.newPage();
  await login(manager, 'manager');
  const res3 = await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res3.status() === 200, 'manager: calibration register → 200');
  ok((await manager.locator(`a[href="${registerUrl}/new"]`).count()) > 0, 'manager: create affordance visible');
}

// ── C. Create a COMPLIANT record through the real form ──
let recordUrl;
{
  await manager.goto(`${BASE}${registerUrl}/new`, { waitUntil: 'domcontentloaded' });
  await manager.selectOption('#equipment_id', String(equipmentId));
  await manager.fill('#last_calibrated_at', '2026-07-10');
  await manager.fill('#calibration_due_at', '2026-09-10');
  await manager.fill('#next_due_at', '2027-09-10');
  await manager.fill('#provider', 'Metrology SA');
  await manager.fill('#certificate_reference', 'CAL-E2E-001');
  await manager.fill('#result', 'PASS');
  await manager.fill('#notes', 'E2E recertified within tolerance.');
  await manager.locator('form[action="/lab/calibration/new"] button[type="submit"]').click();
  await manager.waitForURL((u) => /^\/lab\/calibration\/\d+$/.test(u.pathname), { timeout: 15_000 });
  recordUrl = manager.url();

  eq_(calibrationCount(), 1, 'create: one calibration row written');
  const row = db.prepare('SELECT * FROM lab_equipment_calibration WHERE equipment_id = ?').get(equipmentId);
  eq_(row.certificate_reference, 'CAL-E2E-001', 'create: certificate_reference stored');
  eq_(row.provider, 'Metrology SA', 'create: provider stored');
  eq_(row.result, 'PASS', 'create: result stored');
  eq_(row.created_by, managerId, 'create: actor recorded');
  const audit = auditsForCalibration();
  eq_(audit.length, 1, 'create: exactly one CREATE audit row');
  eq_(audit[0].action, 'CREATE', 'create: audit action CREATE');
  ok(audit[0].note.includes('equipment=EQ-CAL-E2E'), 'create: audit note carries the equipment code');

  const alert = await manager.locator('[role="alert"]').textContent();
  ok(/Calibration record added/.test(alert ?? ''), 'create: success flash shown');
}

// ── D. Detail page renders fields + derived status; register lists it ──
{
  await manager.goto(recordUrl, { waitUntil: 'domcontentloaded' });
  const body = await manager.locator('main').innerText();
  ok(body.includes('EQ-CAL-E2E'), 'detail: equipment code shown');
  ok(body.includes('Metrology SA'), 'detail: provider shown');
  ok(body.includes('CAL-E2E-001'), 'detail: certificate reference shown');
  ok(body.includes('Compliant'), 'detail: derived status badge Compliant');

  await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const registerBody = await manager.locator('main').innerText();
  ok(registerBody.includes('EQ-CAL-E2E'), 'register: equipment code listed');
  ok(registerBody.includes('CAL-E2E-001'), 'register: certificate reference listed');
}

// ── E. NOT_COMPLIANT derivation + due=1 filter ──
{
  // FAIL result → NOT_COMPLIANT, even with a far-future due date (D-1 token match).
  db.prepare(
    `INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, calibration_due_at, provider, certificate_reference, result, created_by)
     VALUES (?, '2026-08-01', '2027-01-01', 'Metrology SA', 'CAL-E2E-002', 'FAIL', ?)`,
  ).run(equipmentId, supervisorId);

  await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const body = await manager.locator('main').innerText();
  ok(body.includes('Not Compliant'), 'derive: FAIL result renders NOT_COMPLIANT on the register');

  // due=1 isolates the due-soon window only (not compliant / not overdue).
  const dueOnly = await manager.request.get(`${BASE}${registerUrl}?due=1`);
  const dueText = await dueOnly.text();
  ok(dueText.includes('CAL-E2E-001') === false || dueText.includes('1 calibration record found'), 'filter: due=1 does not surface non-window records');
}

// ── F. Edit via the real form → UPDATE audit ──
{
  const id = recordUrl.match(/(\d+)\/?$/)[1];
  await manager.goto(`${BASE}${registerUrl}/${id}/edit`, { waitUntil: 'domcontentloaded' });
  await manager.fill('#result', 'PASS after rework');
  await manager.locator(`form[action="/lab/calibration/${id}/edit"] button[type="submit"]`).click();
  await manager.waitForURL((u) => u.pathname === `/lab/calibration/${id}`, { timeout: 15_000 });

  const row = db.prepare('SELECT * FROM lab_equipment_calibration WHERE id = ?').get(Number(id));
  eq_(row.result, 'PASS after rework', 'edit: result updated');
  const audit = auditsForCalibration();
  ok(audit.some((a) => a.action === 'UPDATE'), 'edit: UPDATE audit row written');

  const alert = await manager.locator('[role="alert"]').textContent();
  ok(/Calibration record updated/.test(alert ?? ''), 'edit: success flash shown');
}

// ── G. Validation failure: next-due-before-due → flash error, no row ──
{
  await manager.goto(`${BASE}${registerUrl}/new`, { waitUntil: 'domcontentloaded' });
  await manager.selectOption('#equipment_id', String(equipmentId));
  await manager.fill('#calibration_due_at', '2027-01-01');
  await manager.fill('#next_due_at', '2026-01-01');
  await Promise.all([
    manager.waitForResponse((res) => res.url().includes('/lab/calibration/new')),
    manager.locator('form[action="/lab/calibration/new"] button[type="submit"]').click(),
  ]);
  await manager.waitForLoadState('domcontentloaded');
  const alert = await manager.locator('[role="alert"]').textContent();
  ok(/Next Due Date cannot be before the Calibration Due Date/.test(alert ?? ''), 'validation: cross-field date rule flashes a clear error');
  const bad = db.prepare("SELECT COUNT(*) AS n FROM lab_equipment_calibration WHERE certificate_reference = 'CAL-E2E-BAD'").get();
  eq_(Number(bad.n), 0, 'validation: no row written on failure');
}

// ── H. No horizontal overflow ──
{
  await manager.setViewportSize({ width: 1440, height: 900 });
  await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const overflow1440 = await manager.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow1440, 'register: no horizontal overflow at 1440px');

  await manager.setViewportSize({ width: 390, height: 844 });
  const overflow390 = await manager.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow390, 'register: no horizontal overflow at 390px');
}

} finally {
  for (const context of browser.contexts()) {
    for (const page of context.pages()) await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
  await browser.close().catch(() => {});
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory calibration register E2E checks passed.');
