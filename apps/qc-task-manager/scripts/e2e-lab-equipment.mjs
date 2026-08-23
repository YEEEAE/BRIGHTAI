// E2E spec for the QC Laboratory Equipment Registry (PROMPT 11, /lab/equipment).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-products.mjs). Covers the Equipment Registry end-to-end:
//   A. Auth wall: anonymous GET /lab/equipment → login redirect.
//   B. RBAC walls: employee may view the registry but cannot open /new or
//      /edit (bounced); manager reaches list, new, edit and detail (200).
//   C. Manager creates a device through the real form POST → redirected to the
//      detail page; row + CREATE audit exist in the DB.
//   D. Manager edits the device (name + status + calibration) → UPDATE audit
//      with status/calibration change flags.
//   E. Detail page shows master fields, the read-time status label, test usage
//      with a live drill-down into the register, and the change history.
//   F. Duplicate code POST is rejected (flash) and leaves no row.
//   G. Archive → is_archived=1 + UPDATE audit note; edit bounces archived rows
//      back to the read-only detail; restore brings it back (no hard delete).
//   H. Search + filters: q narrows the list, status/calibration filters match.
//   I. No horizontal overflow on list / detail at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-equipment.mjs

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

const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);

const auditsFor = (id) =>
  db.prepare("SELECT action, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT' AND entity_id = ? ORDER BY id").all(id);

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}/lab/equipment`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET /lab/equipment → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let manager;
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  await emp.goto(`${BASE}/lab/equipment`, { waitUntil: 'domcontentloaded' });
  ok(emp.url().startsWith(`${BASE}/lab/equipment`), 'employee: may view the Equipment Registry list');
  await emp.goto(`${BASE}/lab/equipment/new`, { waitUntil: 'domcontentloaded' });
  ok(emp.url() === `${BASE}/lab/equipment/new`, 'employee: may open the Equipment proposal form');
  const firstRowId = Number(db.prepare('SELECT id FROM lab_equipment ORDER BY id LIMIT 1').get().id);
  await emp.goto(`${BASE}/lab/equipment/${firstRowId}/edit`, { waitUntil: 'domcontentloaded' });
  ok(emp.url() === `${BASE}/lab/equipment/${firstRowId}/edit`, 'employee: may open the Equipment edit proposal form');
  await emp.close();

  manager = await browser.newPage();
  await login(manager, 'manager');
  for (const path of ['/lab/equipment', '/lab/equipment/new']) {
    const res = await manager.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    ok(res.status() === 200, `manager: ${path} → 200`);
  }
}

// ── C. Create through the real form ──
let equipmentId;
const CODE = 'EQ-E2E-001';
{
  await manager.goto(`${BASE}/lab/equipment/new`, { waitUntil: 'domcontentloaded' });
  await manager.fill('#name', 'E2E Syringe Pump');
  await manager.fill('#code', CODE);
  await manager.fill('#location', 'Room 2');
  await manager.fill('#serial_number', 'E2E-SER-001');
  await manager.fill('#status_raw', 'مستخدم');
  await manager.selectOption('#calibration_status_raw', 'yes');
  await manager.fill('#notes', 'Created through the live form');
  await manager.locator('form[action="/lab/equipment/new"] button[type="submit"]').click();
  await manager.waitForURL((u) => /\/lab\/equipment\/\d+$/.test(u.pathname), { timeout: 15_000 });
  equipmentId = Number(manager.url().match(/\/lab\/equipment\/(\d+)$/)?.[1] ?? 0);
  ok(equipmentId > 0, 'create: redirected to the new equipment detail page');

  const row = db.prepare('SELECT * FROM lab_equipment WHERE id = ?').get(equipmentId);
  ok(Boolean(row), 'create: row exists');
  eq_(row.code, CODE, 'create: code stored');
  eq_(row.name, 'E2E Syringe Pump', 'create: name stored');
  eq_(row.status_raw, 'مستخدم', 'create: raw status preserved verbatim');
  eq_(row.calibration_status_raw, 'yes', 'create: calibration flag stored');
  eq_(row.is_archived, 0, 'create: active');
  eq_(auditsFor(equipmentId).map((a) => a.action).join(','), 'CREATE', 'create: CREATE audit row');

  ok((await manager.getByRole('heading', { name: 'E2E Syringe Pump' }).count()) > 0, 'detail: equipment name heading');
  ok((await manager.getByText('In Use').count()) > 0, 'detail: raw status displayed as In Use');
  ok((await manager.getByText('Yes').count()) > 0, 'detail: calibration shown as Yes');
  ok((await manager.getByText('E2E-SER-001').count()) > 0, 'detail: serial number shown');
  ok((await manager.locator('section[aria-labelledby="sec-history"]').getByText('CREATE').count()) > 0, 'detail: change history shows CREATE');
}

// ── D. Edit through the real form ──
{
  await manager.goto(`${BASE}/lab/equipment/${equipmentId}/edit`, { waitUntil: 'domcontentloaded' });
  await manager.fill('#name', 'E2E Syringe Pump v2');
  await manager.fill('#status_raw', 'تحت الصيانة');
  await manager.selectOption('#calibration_status_raw', 'no');
  await manager.locator(`form[action="/lab/equipment/${equipmentId}/edit"] button[type="submit"]`).filter({ hasText: 'Update' }).click();
  await manager.waitForURL((u) => u.pathname === `/lab/equipment/${equipmentId}`, { timeout: 15_000 });

  const row = db.prepare('SELECT name, status_raw, calibration_status_raw FROM lab_equipment WHERE id = ?').get(equipmentId);
  eq_(row.name, 'E2E Syringe Pump v2', 'edit: name updated');
  eq_(row.status_raw, 'تحت الصيانة', 'edit: status updated verbatim');
  eq_(row.calibration_status_raw, 'no', 'edit: calibration updated');
  const audit = auditsFor(equipmentId);
  eq_(audit.map((a) => a.action).join(','), 'CREATE,UPDATE', 'edit: audit trail CREATE → UPDATE');
  ok(audit[1].note.includes('status_changed_from=مستخدم'), 'edit: audit flags the status change');
  ok(audit[1].note.includes('calibration_changed_from=yes'), 'edit: audit flags the calibration change');
}

// ── E. Detail + register drill-down ──
{
  db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, equipment_id, sample_count, status, tested_by, created_by, created_at, updated_at)
     VALUES ('LAB-TEST-EQ9101', 'air', ?, 5, 'DRAFT', ?, ?, datetime('now'), datetime('now'))`,
  ).run(equipmentId, managerId, managerId);
  await manager.goto(`${BASE}/lab/equipment/${equipmentId}`, { waitUntil: 'domcontentloaded' });
  ok((await manager.getByText('1 test reference this device by ID').count()) > 0, 'detail: usage count includes the seeded test');
  await manager.click('a[href*="/lab/tests?equipment="]');
  await manager.waitForURL((u) => u.pathname === '/lab/tests' && u.search.includes(`equipment=${equipmentId}`), { timeout: 15_000 });
  ok((await manager.getByText('LAB-TEST-EQ9101').count()) > 0, 'register: drill-down shows the referencing test');
}

// ── F. Duplicate code rejected ──
{
  await manager.goto(`${BASE}/lab/equipment/new`, { waitUntil: 'domcontentloaded' });
  await manager.fill('#name', 'Duplicate Attempt');
  await manager.fill('#code', CODE);
  await manager.fill('#status_raw', 'مستخدم');
  await manager.locator('form[action="/lab/equipment/new"] button[type="submit"]').click();
  await manager.waitForURL((u) => u.pathname === '/lab/equipment/new', { timeout: 15_000 });
  const dups = db.prepare('SELECT COUNT(*) AS n FROM lab_equipment WHERE code = ?').get(CODE).n;
  eq_(dups, 1, 'duplicate: no second row created');
}

// ── G. Archive + restore (no hard delete) ──
{
  await manager.goto(`${BASE}/lab/equipment/${equipmentId}`, { waitUntil: 'domcontentloaded' });
  await manager.locator(`form[action="/lab/equipment/${equipmentId}/edit"] button`).filter({ hasText: 'Archive Equipment' }).click();
  await manager.waitForURL((u) => u.pathname === `/lab/equipment/${equipmentId}`, { timeout: 15_000 });
  eq_(db.prepare('SELECT is_archived FROM lab_equipment WHERE id = ?').get(equipmentId).is_archived, 1, 'archive: row archived');
  ok(auditsFor(equipmentId).at(-1).note.includes(`archived ${CODE}`), 'archive: audit note records the archived device');

  await manager.goto(`${BASE}/lab/equipment/${equipmentId}/edit`, { waitUntil: 'domcontentloaded' });
  ok(manager.url().startsWith(`${BASE}/lab/equipment/${equipmentId}`) && !manager.url().includes('/edit'), 'edit: archived row bounces to read-only detail');

  await manager.goto(`${BASE}/lab/equipment/${equipmentId}`, { waitUntil: 'domcontentloaded' });
  await manager.locator(`form[action="/lab/equipment/${equipmentId}/edit"] button`).filter({ hasText: 'Restore Equipment' }).click();
  await manager.waitForURL((u) => u.pathname === `/lab/equipment/${equipmentId}`, { timeout: 15_000 });
  eq_(db.prepare('SELECT is_archived FROM lab_equipment WHERE id = ?').get(equipmentId).is_archived, 0, 'restore: row active again');
  ok(auditsFor(equipmentId).at(-1).note.includes(`restored ${CODE}`), 'restore: audit note records the restored device');
  const totalRows = db.prepare('SELECT COUNT(*) AS n FROM lab_equipment WHERE id = ?').get(equipmentId).n;
  eq_(totalRows, 1, 'archive/restore: device row was never hard-deleted');
}

// ── H. Search + filters ──
{
  await manager.goto(`${BASE}/lab/equipment?q=EQ-E2E-001`, { waitUntil: 'domcontentloaded' });
  ok((await manager.getByText('E2E Syringe Pump v2').count()) > 0, 'search: q finds the created device');
  ok((await manager.getByText('Under Maintenance').count()) > 0, 'search: updated status label rendered');

  await manager.goto(`${BASE}/lab/equipment?q=EQ-E2E-001&status=In+Use`, { waitUntil: 'domcontentloaded' });
  ok((await manager.getByText('E2E Syringe Pump v2').count()) === 0, 'filter: status In Use excludes an Under Maintenance device');

  await manager.goto(`${BASE}/lab/equipment?q=EQ-E2E-001&status=Under+Maintenance`, { waitUntil: 'domcontentloaded' });
  ok((await manager.getByText('E2E Syringe Pump v2').count()) > 0, 'filter: status Under Maintenance includes the device');

  await manager.goto(`${BASE}/lab/equipment?q=EQ-E2E-001&calibration=no`, { waitUntil: 'domcontentloaded' });
  ok((await manager.getByText('E2E Syringe Pump v2').count()) > 0, 'filter: calibration no includes the device');
}

// ── I. No horizontal overflow ──
{
  for (const [width, label] of [[1440, 'desktop'], [390, 'mobile']]) {
    await manager.setViewportSize({ width, height: 900 });
    await manager.goto(`${BASE}/lab/equipment`, { waitUntil: 'domcontentloaded' });
    const w1 = await manager.evaluate(() => document.documentElement.scrollWidth);
    ok(w1 <= width, `overflow: /lab/equipment at ${label} (${w1} ≤ ${width})`);
    await manager.goto(`${BASE}/lab/equipment/${equipmentId}`, { waitUntil: 'domcontentloaded' });
    const w2 = await manager.evaluate(() => document.documentElement.scrollWidth);
    ok(w2 <= width, `overflow: equipment detail at ${label} (${w2} ≤ ${width})`);
  }
}

function eq_(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

} finally {
  for (const context of browser.contexts()) {
    for (const page of context.pages()) await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
  await browser.close().catch(() => {});
  db.close();
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
