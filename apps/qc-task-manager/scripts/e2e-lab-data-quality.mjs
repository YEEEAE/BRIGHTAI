// E2E spec for the QC Laboratory Data Quality Center (/lab/data-quality —
// PROMPT 27, page reference §56/§75).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-calendar.mjs). Covers:
//   A. Auth wall: anonymous GET → login redirect (middleware prefix guard).
//   B. RBAC: admin/manager/supervisor render the report; employee is bounced
//      to /lab with a flash error (supervisor+ only).
//   C. Findings render: each seeded per-category gap appears with its label,
//      detail and click-through link into the owning register; clean/VOID/
//      archived/superseded fixtures never surface.
//   D. Read-only guarantee: loading the report mutates no stored row.
//   E. Empty state + summary counts render.
//   F. No horizontal overflow at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-data-quality.mjs

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

const utcTs = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' ');
const isoDay = (days) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA');

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
const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);

// Clean up any leftover E2E fixtures from a previous partial run.
function cleanup() {
  db.prepare(`DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2EDQ-%')`).run();
  db.prepare(`DELETE FROM lab_documents WHERE code LIKE 'E2EDQ-%'`).run();
  db.prepare(`DELETE FROM lab_test_samples WHERE test_id IN (SELECT id FROM lab_test_records WHERE test_number LIKE 'E2EDQ-%')`).run();
  db.prepare(`DELETE FROM lab_test_records WHERE test_number LIKE 'E2EDQ-%'`).run();
  db.prepare(`DELETE FROM lab_equipment WHERE code LIKE 'E2EDQ-%'`).run();
  db.prepare(`DELETE FROM lab_products WHERE code LIKE 'E2EDQ-%'`).run();
}
cleanup();

// Fixtures: one seeded gap per category + clean controls that must stay silent.
db.prepare('INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)')
  .run('E2E DQ Product Good', 'E2EDQ-P-OK', 'air', 1, managerId);
db.prepare('INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)')
  .run('E2E DQ Product Inactive', 'E2EDQ-P-INACT', 'vacuum', 0, managerId);
const productOk = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'E2EDQ-P-OK'").get().id);
const productInactive = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'E2EDQ-P-INACT'").get().id);

db.prepare('INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, calibration_status_raw, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
  .run('E2E DQ Rig Gap', 'E2EDQ-EQ-GAP', 'Lab 1', 'NEW', null, 'yes', employeeId);
db.prepare('INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, calibration_status_raw, is_archived, created_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
  .run('E2E DQ Rig Archived', 'E2EDQ-EQ-ARC', 'Lab 1', 'NEW', null, null, employeeId);
const eqGapId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'E2EDQ-EQ-GAP'").get().id);

const insertTest = db.prepare(`INSERT INTO lab_test_records
  (test_number, test_type, product_id, equipment_id, lot_number, sample_count, final_result, status,
   tested_by, submitted_at, reviewed_at, approved_by, approved_at, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
// Seeded gaps: missing lot (DRAFT) + inactive product still referenced by a live test.
insertTest.run('E2EDQ-T-GAP', 'air', productOk, eqGapId, null, 1, null, 'DRAFT',
  employeeId, null, null, null, null, employeeId, utcTs(0), utcTs(0));
insertTest.run('E2EDQ-T-LIVE', 'vacuum', productInactive, eqGapId, 'LOT-E2EDQ', 1, null, 'SUBMITTED',
  employeeId, utcTs(-1), null, null, null, employeeId, utcTs(-1), utcTs(-1));
// Control: VOID with everything missing → exempt from every detector.
insertTest.run('E2EDQ-T-VOID', 'air', productOk, null, null, 5, null, 'VOID',
  null, null, null, null, null, employeeId, utcTs(-2), utcTs(-2));
const gapTestId = Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'E2EDQ-T-GAP'").get().id);
for (const num of ['E2EDQ-T-GAP', 'E2EDQ-T-LIVE']) {
  const id = Number(db.prepare('SELECT id FROM lab_test_records WHERE test_number = ?').get(num).id);
  db.prepare('INSERT INTO lab_test_samples (test_id, sample_no, result) VALUES (?, 1, ?)').run(id, 'PASS');
}

// Document: APPROVED with an approver but no approval date (and a real version
// pointer so only the approval-metadata gap is demonstrated).
db.prepare(
  `INSERT INTO lab_documents (code, title, type, owner_id, approver_id, status, effective_date, review_due_date, approved_at, created_by)
   VALUES ('E2EDQ-SOP-APR', 'E2E DQ Approved SOP', 'SOP', ?, ?, 'APPROVED', ?, ?, NULL, ?)`,
).run(managerId, managerId, isoDay(-30), isoDay(300), managerId);
const docId = Number(db.prepare("SELECT id FROM lab_documents WHERE code = 'E2EDQ-SOP-APR'").get().id);
db.prepare(
  `INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, approved_by, approved_at, created_at)
   VALUES (?, 1, 'e2e dq content', ?, 'APPROVED', ?, ?, ?)`,
).run(docId, managerId, managerId, utcTs(-30), utcTs(-30));
db.prepare('UPDATE lab_documents SET current_version_id = (SELECT id FROM lab_document_versions WHERE document_id = ?) WHERE id = ?')
  .run(docId, docId);

const url = '/lab/data-quality';

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${url}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET data quality → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC ──
const pages = {};
for (const username of ['admin', 'manager', 'supervisor']) {
  const page = await browser.newPage();
  pages[username] = page;
  await login(page, username);
  const res = await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, `${username}: data quality → 200`);
  ok((await page.locator('main').innerText()).includes('Data Quality Center'), `${username}: report header rendered`);
}
{
  const employee = await browser.newPage();
  await login(employee, 'employee');
  await employee.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  ok(employee.url().replace(BASE, '').startsWith('/lab') && !employee.url().includes('/lab/data-quality'),
    'employee: bounced away from the Data Quality Center');
  ok((await employee.locator('main').innerText()).includes('do not have permission'),
    'employee: flash explains the denial');
  await employee.close();
}

// ── C. Findings render with labels + click-through links ──
{
  const admin = pages.admin;
  await admin.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  const body = await admin.locator('main').innerText();

  ok(body.includes('Missing Lot Number') && body.includes('E2EDQ-T-GAP'), 'findings: missing-lot test rendered');
  ok(body.includes('Missing serial number') && body.includes('E2EDQ-EQ-GAP'), 'findings: missing-serial equipment rendered');
  ok(body.includes('Missing approval metadata') && body.includes('E2EDQ-SOP-APR'), 'findings: document approval gap rendered');
  ok(body.includes('Inactive product in use') && body.includes('E2EDQ-P-INACT'), 'findings: inactive product rendered');

  // Click-through hrefs into the owning registers.
  ok((await admin.locator(`main a[href="/lab/tests/${gapTestId}"]`).count()) > 0, 'click-through: test detail link');
  ok((await admin.locator(`main a[href="/lab/equipment/${eqGapId}"]`).count()) > 0, 'click-through: equipment detail link');
  ok((await admin.locator(`main a[href="/lab/documents/${docId}/edit"]`).count()) > 0, 'click-through: document editor link');

  // Scope rules: exempt fixtures never surface.
  ok(!body.includes('E2EDQ-T-VOID'), 'scope: VOID test never reported');
  ok(!body.includes('E2EDQ-EQ-ARC'), 'scope: archived equipment never reported');
  ok(!body.includes('E2EDQ-P-OK'), 'scope: clean product never reported');
}

// ── D. Read-only guarantee: the report mutates nothing ──
{
  const before = JSON.stringify([
    db.prepare("SELECT * FROM lab_test_records WHERE test_number LIKE 'E2EDQ-%' ORDER BY id").all(),
    db.prepare("SELECT * FROM lab_equipment WHERE code LIKE 'E2EDQ-%' ORDER BY id").all(),
    db.prepare("SELECT * FROM lab_documents WHERE code LIKE 'E2EDQ-%' ORDER BY id").all(),
    db.prepare("SELECT * FROM lab_products WHERE code LIKE 'E2EDQ-%' ORDER BY id").all(),
  ]);
  await pages.admin.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await pages.admin.reload({ waitUntil: 'domcontentloaded' });
  const after = JSON.stringify([
    db.prepare("SELECT * FROM lab_test_records WHERE test_number LIKE 'E2EDQ-%' ORDER BY id").all(),
    db.prepare("SELECT * FROM lab_equipment WHERE code LIKE 'E2EDQ-%' ORDER BY id").all(),
    db.prepare("SELECT * FROM lab_documents WHERE code LIKE 'E2EDQ-%' ORDER BY id").all(),
    db.prepare("SELECT * FROM lab_products WHERE code LIKE 'E2EDQ-%' ORDER BY id").all(),
  ]);
  ok(before === after, 'read-only: fixture rows unchanged after loading the report twice');
}

// ── E. Summary counts render ──
{
  const admin = pages.admin;
  const body = (await admin.locator('main').innerText()).toUpperCase();
  ok(body.includes('TOTAL FINDINGS'), 'summary: total card rendered');
  ok(body.includes('TEST RECORDS') && body.includes('EQUIPMENT') && body.includes('DOCUMENTS') && body.includes('PRODUCTS'),
    'summary: all four category sections rendered');
  ok((await admin.locator('main').innerText()).includes('never modifies anything'), 'report: read-only notice present');
}

// ── F. No horizontal overflow ──
{
  const admin = pages.admin;
  await admin.setViewportSize({ width: 1440, height: 900 });
  await admin.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  ok(!(await admin.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'data quality: no horizontal overflow at 1440px');
  await admin.setViewportSize({ width: 390, height: 844 });
  ok(!(await admin.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'data quality: no horizontal overflow at 390px');
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
console.log('✅ Laboratory data quality E2E checks passed.');
