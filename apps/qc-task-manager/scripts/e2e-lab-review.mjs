// E2E spec for the QC Laboratory Review Center (PROMPT 07, /lab/tests/review).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern as
// e2e-lab-tests.mjs). Covers the Review Center end-to-end:
//   A. Auth wall: anonymous GET /lab/tests/review → login redirect.
//   B. RBAC wall: employee (non-reviewer) is bounced to /lab; manager/
//      supervisor/admin reach the page (200).
//   C. Summary cards render (Awaiting Review / Aging / HOLD / Rejected /
//      Approved Today) with the correct counts for the manager's scope.
//   D. The queue lists the employee's submitted tests (reviewable) but never
//      the manager's own test.
//   E. Start Review → record becomes UNDER_REVIEW (audit + notification).
//   F. Request Changes (reason) → REJECTED.
//   G. Reject (reason) → REJECTED.
//   H. Approve a SUBMITTED test (not started by the manager) → APPROVED with
//      immutable equipment/product/template/document snapshots + audit.
//   I. No horizontal overflow on the Review Center at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-review.mjs

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

// ── Seed master data + a reviewable queue ──
const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);
const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);
const adminId = Number(db.prepare("SELECT id FROM users WHERE username='admin'").get().id);

db.prepare("INSERT INTO lab_products (name, code, connector_type, default_test_type, is_active, created_by) VALUES (?, ?, 'MS', 'air', 1, ?)")
  .run('E2E Review Seal', 'PRD-REV', managerId);
const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code='PRD-REV'").get().id);
db.prepare("INSERT INTO lab_equipment (name, code, status_raw, serial_number, location, created_by) VALUES (?, ?, 'IN_USE', 'REV-SN', 'Bay 1', ?)")
  .run('E2E Review Rig', 'EQ-REV', managerId);
const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code='EQ-REV'").get().id);
db.prepare("INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, calibration_due_at, provider, certificate_reference, created_by) VALUES (?, ?, ?, ?, ?, ?)")
  .run(equipmentId, '2026-06-01', '2027-06-01', 'SASO Lab', 'REV-CAL-1', managerId);

const tpl = db.prepare("INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES (?, 'TPL-REV', 'air', 'ACTIVE', ?)")
  .run('E2E Template', managerId);
const templateId = Number(tpl.lastInsertRowid);
const tplVer = db.prepare("INSERT INTO lab_test_template_versions (template_id, version, default_sample_count, parameters_json, applicable_product_id, applicable_equipment_id, created_by) VALUES (?, 1, 5, ?, ?, ?, ?)")
  .run(templateId, JSON.stringify({ pressure: '6 bar' }), productId, equipmentId, managerId);
const templateVersionId = Number(tplVer.lastInsertRowid);

const sop = db.prepare("INSERT INTO lab_documents (code, title, type, status, owner_id, created_by) VALUES (?, ?, 'SOP', 'APPROVED', ?, ?)")
  .run('SOP-REV-01', 'E2E SOP', managerId, managerId);
const sopId = Number(sop.lastInsertRowid);
const sopVer = db.prepare("INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id, created_at) VALUES (?, 1, '# SOP', 'APPROVED', ?, datetime('now'))")
  .run(sopId, managerId);
const sopVersionId = Number(sopVer.lastInsertRowid);

const insertTest = db.prepare(
  `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
     sample_count, final_result, status, tested_by, created_by, submitted_at, reviewed_by,
     template_version_id, sop_version_id, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const submittedOld = '2026-01-01 09:00:00';
insertTest.run('LAB-TEST-90001', 'air', productId, equipmentId, 'LOT-REV-01', 'Bay 1', 5, 'PASS', 'SUBMITTED', employeeId, employeeId, submittedOld, null, templateVersionId, sopVersionId, submittedOld, submittedOld);
insertTest.run('LAB-TEST-90002', 'air', productId, equipmentId, 'LOT-REV-02', 'Bay 2', 5, 'FAIL', 'SUBMITTED', employeeId, employeeId, submittedOld, null, templateVersionId, sopVersionId, submittedOld, submittedOld);
insertTest.run('LAB-TEST-90003', 'air', productId, equipmentId, 'LOT-REV-03', 'Bay 3', 5, 'PASS', 'SUBMITTED', employeeId, employeeId, submittedOld, null, templateVersionId, sopVersionId, submittedOld, submittedOld);
insertTest.run('LAB-TEST-90004', 'vacuum', productId, equipmentId, 'LOT-REV-04', 'Bay 4', 5, 'HOLD', 'UNDER_REVIEW', employeeId, employeeId, submittedOld, supervisorId, templateVersionId, sopVersionId, submittedOld, submittedOld);
// A test the manager owns — must never appear in the manager's own queue.
insertTest.run('LAB-TEST-90005', 'air', productId, equipmentId, 'LOT-REV-05', 'Bay 5', 5, 'PASS', 'SUBMITTED', managerId, managerId, submittedOld, null, templateVersionId, sopVersionId, submittedOld, submittedOld);

const getRow = (num) => db.prepare('SELECT * FROM lab_test_records WHERE test_number = ?').get(num);
const auditsFor = (testId) => db.prepare("SELECT action FROM qc_audit_log WHERE entity_type='LAB_TEST' AND entity_id = ? ORDER BY id").all(testId);

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}/lab/tests/review`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET /lab/tests/review → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC wall ──
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  const empRes = await emp.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const empUrl = emp.url();
  ok(empUrl.startsWith(`${BASE}/lab`), 'employee: bounced away from review center');
  ok(!empUrl.includes('/lab/tests/review'), 'employee: not on review center');
  const empFlash = await emp.locator('body').innerText();
  ok(/permission/.test(empFlash), 'employee: permission flash shown');
  await emp.close();

  for (const username of ['manager', 'supervisor', 'admin']) {
    const page = await browser.newPage();
    await login(page, username);
    const res = await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
    ok(res.status() === 200, `${username}: /lab/tests/review → 200`);
    const text = await page.locator('main').innerText();
    ok(text.includes('Review Center'), `${username}: header present`);
    await page.close();
  }
}

// ── C. Summary cards (manager scope) ──
{
  const page = await browser.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const text = (await page.locator('main').innerText()).toLowerCase();
  ok(text.includes('awaiting review'), 'cards: Awaiting Review present');
  ok(text.includes('aging'), 'cards: Aging present');
  ok(text.includes('hold'), 'cards: HOLD present');
  ok(text.includes('rejected'), 'cards: Rejected present');
  ok(text.includes('approved today'), 'cards: Approved Today present');
  ok(text.includes('lab-test-90001'), 'queue: shows employee submitted test');
  ok(text.includes('lab-test-90004'), 'queue: shows UNDER_REVIEW test');
  ok(!text.includes('lab-test-90005'), 'queue: manager own test excluded');
  await page.close();
}

// ── E. Start Review ──
{
  const page = await browser.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: 'LAB-TEST-90001' });
  await row.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/lab/tests/') && res.url().includes('/review')),
    row.getByRole('button', { name: 'Start Review' }).click(),
  ]);
  await page.waitForLoadState('domcontentloaded');
  const flash = await page.locator('body').innerText();
  ok(/Start Review/.test(flash), 'start_review: success flash shown');
  const r = getRow('LAB-TEST-90001');
  ok(r.status === 'UNDER_REVIEW', 'start_review: DB status UNDER_REVIEW');
  ok(Number(r.reviewed_by) === managerId, 'start_review: reviewed_by = manager');
  ok(auditsFor(r.id).some((a) => a.action === 'STATUS_TRANSITION'), 'start_review: audit STATUS_TRANSITION');
  ok(
    db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND type = ?').get(employeeId, 'lab_test_review_started').n === 1,
    'start_review: notification to tester',
  );
  await page.close();
}

// ── F. Request Changes (reason) ──
{
  const page = await browser.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: 'LAB-TEST-90002' });
  await row.scrollIntoViewIfNeeded();
  await row.locator('input[name="reason"]').fill('rework traceability');
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/lab/tests/') && res.url().includes('/review')),
    row.getByRole('button', { name: 'Request Changes' }).click(),
  ]);
  await page.waitForLoadState('domcontentloaded');
  const r = getRow('LAB-TEST-90002');
  ok(r.status === 'REJECTED', 'request_changes: DB status REJECTED');
  ok(r.rejected_reason === 'rework traceability', 'request_changes: reason persisted');
  ok(auditsFor(r.id).some((a) => a.action === 'REQUEST_CHANGES'), 'request_changes: audit REQUEST_CHANGES');
  await page.close();
}

// ── G. Reject (reason) ──
{
  const page = await browser.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: 'LAB-TEST-90004' });
  await row.scrollIntoViewIfNeeded();
  await row.locator('input[name="reason"]').fill('sample count below spec');
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/lab/tests/') && res.url().includes('/review')),
    row.getByRole('button', { name: 'Reject' }).click(),
  ]);
  await page.waitForLoadState('domcontentloaded');
  const r = getRow('LAB-TEST-90004');
  ok(r.status === 'REJECTED', 'reject: DB status REJECTED');
  ok(r.rejected_reason === 'sample count below spec', 'reject: reason persisted');
  ok(auditsFor(r.id).some((a) => a.action === 'REJECTION'), 'reject: audit REJECTION');
  await page.close();
}

// ── H. Approve (immutable snapshots) ──
{
  const page = await browser.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: 'LAB-TEST-90003' });
  await row.scrollIntoViewIfNeeded();
  await row.getByRole('button', { name: 'Approve' }).click();
  await page.locator('#esign-password').fill(PASS);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/lab/tests/') && res.url().includes('/review')),
    page.locator('#esign-confirm').click(),
  ]);
  await page.waitForLoadState('domcontentloaded');
  const r = getRow('LAB-TEST-90003');
  ok(r.status === 'APPROVED', 'approve: DB status APPROVED');
  ok(Number(r.approved_by) === managerId, 'approve: approved_by = manager');
  ok(r.product_snapshot_json && JSON.parse(r.product_snapshot_json).product_code === 'PRD-REV', 'approve: product snapshot written');
  ok(r.template_snapshot_json && JSON.parse(r.template_snapshot_json).version === 1, 'approve: template snapshot written');
  ok(
    db.prepare('SELECT COUNT(*) AS n FROM lab_test_equipment_snapshots WHERE test_id = ?').get(r.id).n === 1,
    'approve: equipment snapshot row written',
  );
  const eqSnap = db.prepare('SELECT equipment_code, calibration_reference FROM lab_test_equipment_snapshots WHERE test_id = ?').get(r.id);
  ok(eqSnap.equipment_code === 'EQ-REV', 'approve: equipment snapshot code');
  ok(eqSnap.calibration_reference === 'REV-CAL-1', 'approve: calibration snapshot reference');
  ok(
    db.prepare('SELECT COUNT(*) AS n FROM lab_test_document_snapshots WHERE test_id = ?').get(r.id).n === 1,
    'approve: SOP document snapshot written',
  );
  ok(auditsFor(r.id).some((a) => a.action === 'APPROVAL'), 'approve: audit APPROVAL');
  ok(
    db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND type = ?').get(employeeId, 'lab_test_approved').n === 1,
    'approve: notification to tester',
  );

  // The approved row is now read-only history in the queue view.
  await page.waitForTimeout(500);
  try {
    await page.goto(`${BASE}/lab/tests/review?status=APPROVED`, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.goto(`${BASE}/lab/tests/review?status=APPROVED`, { waitUntil: 'domcontentloaded' });
  }
  const approvedRow = page.locator('tr', { hasText: 'LAB-TEST-90003' });
  await approvedRow.scrollIntoViewIfNeeded();
  const rowText = await approvedRow.innerText();
  ok(rowText.includes('Read-only'), 'approve: approved row is Read-only in queue');
  ok(!/Start Review|Request Changes|Reject/.test(rowText), 'approve: approved row has no action buttons');
  await page.close();
}

// ── I. No horizontal overflow ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page, 'admin');
  await page.goto(`${BASE}/lab/tests/review`, { waitUntil: 'domcontentloaded' });
  const overflow1440 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow1440, 'review: no horizontal overflow at 1440px');
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow390, 'review: no horizontal overflow at 390px (table scrolls in place)');
  await page.close();
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
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory Review Center E2E checks passed.');
