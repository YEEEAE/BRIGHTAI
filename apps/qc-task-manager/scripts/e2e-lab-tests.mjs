// E2E spec for the laboratory test register + details page (PROMPT 06).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern as
// e2e-lab-form.mjs). Covers the register contract end-to-end:
//   A. Auth wall: anonymous GET /lab/tests → login redirect.
//   B. Every role opens /lab/tests (200) with header + filter form + register
//      table; the drill-down params from /lab (?created=today, ?status=DRAFT,
//      ?result=PASS) render without error.
//   C. Filters + sorting are server-driven: applying a status filter narrows
//      the visible rows and updates the count; clicking a sortable header
//      changes the URL (state lives in the querystring).
//   D. Employee RBAC scope: an employee does not see other testers' rows.
//   E. Read-only rule: an APPROVED row shows a "Read-only" chip and no
//      mutable action buttons.
//   F. View opens the details page /lab/tests/[id]; a bogus id → 404 page.
//   G. Export affordance: supervisor+ sees Export CSV/XLSX; employee does not.
//   H. No horizontal overflow on the register at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-tests.mjs

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

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

// Seed Product Master + equipment, then three tests: one APPROVED (air) by the
// manager, one DRAFT (vacuum) and one APPROVED (air) by the employee. This
// gives the RBAC scope + read-only assertions something real to check.
const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);
db.prepare("INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES ('E2E Seal', 'PRD-E2E', 'air', 1, ?)").run(managerId);
const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code='PRD-E2E'").get().id);
db.prepare("INSERT INTO lab_equipment (name, code, status_raw, created_by) VALUES ('E2E Rig', 'EQ-E2E', 'NEW', ?)").run(managerId);
const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code='EQ-E2E'").get().id);

const insertTest = db.prepare(
  `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
     sample_count, final_result, status, tested_by, created_by, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
insertTest.run('LAB-TEST-00001', 'air', productId, equipmentId, 'LOT-E2E-A', 'Bay 1', 5, 'PASS', 'APPROVED', managerId, managerId, '2026-01-01 09:00:00', '2026-01-01 10:00:00');
insertTest.run('LAB-TEST-00002', 'vacuum', productId, equipmentId, 'LOT-E2E-B', 'Bay 2', 5, null, 'DRAFT', employeeId, employeeId, '2026-01-02 09:00:00', '2026-01-02 09:00:00');
insertTest.run('LAB-TEST-00003', 'air', productId, equipmentId, 'LOT-E2E-C', 'Bay 3', 5, 'PASS', 'APPROVED', employeeId, employeeId, '2026-01-03 09:00:00', '2026-01-03 09:00:00');

// Frozen equipment + calibration snapshot for the approved record so the
// detail/print calibration-snapshot sections have real data to show.
db.prepare(
  `INSERT INTO lab_test_equipment_snapshots (test_id, equipment_id, equipment_name, equipment_code,
     serial_number, location, calibration_state, calibration_reference)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
).run(1, equipmentId, 'E2E Rig', 'EQ-E2E', 'E2E-SN-1', 'Lab', 'COMPLIANT', 'CAL-2026-001');

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const getRes = await ctx.request.get(`${BASE}/lab/tests`, { maxRedirects: 0 });
  ok(getRes.status() === 302, 'anonymous GET /lab/tests → 302');
  ok((getRes.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. Every role opens the register + drill-downs render ──
{
  for (const username of ['admin', 'manager', 'supervisor', 'employee']) {
    const page = await browser.newPage();
    await login(page, username);
    const response = await page.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
    ok(response.status() === 200, `${username}: /lab/tests → 200`);
    const text = await page.locator('main').innerText();
    ok(text.includes('Laboratory Test Register'), `${username}: header present`);
    ok(text.includes('Search'), `${username}: search input present`);
    ok(text.includes('Apply filters'), `${username}: filter form present`);
    // Drill-down params from /lab must never error.
    for (const qs of ['?created=today', '?status=DRAFT', '?result=PASS']) {
      const r = await page.goto(`${BASE}/lab/tests${qs}`, { waitUntil: 'domcontentloaded' });
      ok(r.status() === 200, `${username}: drill-down ${qs} → 200`);
    }
    await page.close();
  }
}

// ── C. Filters + sorting are server-driven (URL is the source of truth) ──
{
  const page = await browser.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
  ok((await page.locator('main').innerText()).includes('3 tests found'), 'register: shows total count');
  await page.selectOption('select[name="status"]', 'APPROVED');
  await page.click('text=Apply filters');
  await page.waitForURL((u) => u.searchParams.get('status') === 'APPROVED', { timeout: 10_000 });
  const filteredText = await page.locator('main').innerText();
  ok(filteredText.includes('2 tests found'), 'filter: status=APPROVED narrows to 2');
  ok(!filteredText.includes('LAB-TEST-00002'), 'filter: DRAFT row hidden');
  // Sorting header pushes state into the URL.
  await page.click('th a:has-text("Created")');
  await page.waitForURL((u) => u.searchParams.get('sort') === 'created_at', { timeout: 10_000 });
  const sortDir = new URL(page.url()).searchParams.get('dir');
  ok(sortDir === 'asc' || sortDir === 'desc', 'sort: clicking Created sets sort=created_at + a dir');
  await page.close();
}

// ── D. Employee RBAC scope ──
{
  const page = await browser.newPage();
  await login(page, 'employee');
  await page.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
  const text = await page.locator('main').innerText();
  ok(text.includes('LAB-TEST-00002'), 'employee: sees own DRAFT row');
  ok(text.includes('LAB-TEST-00003'), 'employee: sees own APPROVED row');
  ok(!text.includes('LAB-TEST-00001'), 'employee: does not see the manager-only row');
  await page.close();
}

// ── E. Read-only rule on APPROVED rows ──
{
  const page = await browser.newPage();
  await login(page, 'employee');
  await page.goto(`${BASE}/lab/tests?status=APPROVED`, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: 'LAB-TEST-00003' });
  await row.scrollIntoViewIfNeeded();
  const rowText = await row.innerText();
  ok(rowText.includes('Read-only'), 'read-only: APPROVED row shows Read-only chip');
  ok(!/Edit|Submit|Review|Approve/.test(rowText.replace('Approved', '')), 'read-only: APPROVED row has no mutable action buttons');
  await page.close();
}

// ── F. View → details page; bogus id → 404 ──
{
  const page = await browser.newPage();
  await login(page, 'employee');
  await page.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
  await page.locator('a:has-text("View")').first().click();
  await page.waitForURL(/\/lab\/tests\/\d+$/, { timeout: 10_000 });
  await page.locator('h1', { hasText: /LAB-TEST-\d{5}/ }).waitFor({ timeout: 10_000 });
  const h1 = await page.locator('h1').innerText();
  ok(/LAB-TEST-\d{5}/.test(h1), 'details: opens a LAB-TEST record');
  // Every requested detail section is present on the read-only page (§24).
  for (const label of [
    'Test Identification',
    'Sample Identification',
    'Equipment Used',
    'Connector Assembly',
    'Differential Conversion',
    'Test Parameters',
    'Sample Results',
    'Final Result',
    'Workflow',
    'Applicable SOP / WI',
    'Related Product',
    'Retest History',
    'Investigation / NCR / CAPA Links',
    'Authorization',
    'Audit Timeline',
  ]) {
    await page.getByText(label, { exact: true }).waitFor({ timeout: 10_000 });
    ok(true, `details: section "${label}" present`);
  }
  await page.locator('a:has-text("Print")').waitFor({ timeout: 10_000 });
  ok(true, 'details: Print affordance present');

  const notFound = await page.goto(`${BASE}/lab/tests/999999`, { waitUntil: 'domcontentloaded' });
  const nfText = await page.locator('main').innerText();
  ok(nfText.includes('Test not found'), 'details: bogus id → Test not found');
  await page.close();
}

// ── G. Export affordance (supervisor+ vs employee) ──
{
  const sup = await browser.newPage();
  await login(sup, 'supervisor');
  await sup.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
  const supText = await sup.locator('main').innerText();
  ok(supText.includes('Export CSV') && supText.includes('Export XLSX'), 'export: supervisor sees CSV + XLSX');
  await sup.close();

  const emp = await browser.newPage();
  await login(emp, 'employee');
  await emp.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
  const empText = await emp.locator('main').innerText();
  ok(!empText.includes('Export CSV'), 'export: employee does not see export buttons');
  await emp.close();
}

// ── H. No horizontal overflow on the register ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page, 'admin');
  await page.goto(`${BASE}/lab/tests`, { waitUntil: 'domcontentloaded' });
  const overflow1440 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow1440, 'register: no horizontal overflow at 1440px');
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow390, 'register: no horizontal overflow at 390px (table scrolls in place)');
  await page.close();
}

// ── I. Controlled print view /lab/tests/[id]/print ──
{
  // Employee may print only own records (IDOR wall mirrors the details page).
  const emp = await browser.newPage();
  await login(emp, 'employee');
  await emp.goto(`${BASE}/lab/tests/1/print`, { waitUntil: 'domcontentloaded' });
  await emp.locator('.print-title', { hasText: /not found|Not found/i }).first().waitFor({ timeout: 10_000 });
  const empDenied = await emp.locator('body').textContent();
  ok(/not found/i.test(empDenied), 'print: employee cannot print another tester\'s record');

  await emp.goto(`${BASE}/lab/tests/3/print`, { waitUntil: 'domcontentloaded' });
  await emp.locator('.print-title', { hasText: 'QC Laboratory' }).waitFor({ timeout: 10_000 });
  const empPrint = await emp.locator('body').textContent();
  ok(empPrint.includes('QC Laboratory'), 'print: employee prints own approved record');
  await emp.close();

  // Approved record prints: exact stored values, final result, authorization,
  // SOP/WI + equipment/calibration snapshot + print timestamp. No nav chrome.
  // textContent() is used (not innerText) so checks match the exact stored
  // values even where the print CSS applies text-transform: uppercase.
  const page = await browser.newPage();
  await login(page, 'admin');
  await page.goto(`${BASE}/lab/tests/1/print`, { waitUntil: 'domcontentloaded' });
  await page.locator('.print-title', { hasText: 'QC Laboratory' }).waitFor({ timeout: 10_000 });
  const printText = await page.locator('body').textContent();
  ok(printText.includes('LAB-TEST-00001'), 'print: shows exact test ID');
  ok(printText.includes('Test ID'), 'print: Test ID field present');
  ok(printText.includes('Sample Identification'), 'print: sample identification present');
  ok(printText.includes('Sample Results'), 'print: sample results section present');
  ok(printText.includes('Authorization'), 'print: authorization section present');
  ok(printText.includes('Final Result'), 'print: final result section present');
  ok(printText.includes('PASS'), 'print: final result value PASS printed');
  ok(printText.includes('Applicable SOP / WI'), 'print: SOP/WI section present');
  ok(printText.includes('Calibration State'), 'print: calibration state snapshot present');
  ok(printText.includes('Controlled Version Metadata'), 'print: controlled version metadata present');
  ok(/Generated \d{4}-\d{2}-\d{2}/.test(printText), 'print: print timestamp present');

  const hasNav = await page.evaluate(() => !!document.querySelector('nav'));
  ok(!hasNav, 'print: no navigation chrome');
  const hasSkipLink = await page.evaluate(() => !!document.querySelector('.skip-link'));
  ok(!hasSkipLink, 'print: no skip-link/dashboard chrome');
  const a4 = await page.evaluate(() => {
    const match = [...document.styleSheets].map((s) => {
      try { return Array.from(s.cssRules || []).map((r) => r.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    return /@page\s*\{[^}]*size\s*:\s*A4/i.test(match);
  });
  ok(a4, 'print: declares @page A4');
  await page.close();

  // Bogus id → not found on the print route too.
  const nf = await browser.newPage();
  await login(nf, 'admin');
  await nf.goto(`${BASE}/lab/tests/999999/print`, { waitUntil: 'domcontentloaded' });
  const nfText = await nf.locator('body').textContent();
  ok(/not found/i.test(nfText), 'print: bogus id → not found');
  await nf.close();
}

await browser.close();
db.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory test register E2E checks passed.');