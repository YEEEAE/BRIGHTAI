// E2E spec for the QC Laboratory Retest workflow
// (/lab/retests + /lab/retests/[id] — page reference §46–§47).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-calibration.mjs). Covers the retest workflow end-to-end:
//   A. Auth wall: anonymous GET the register → login redirect.
//   B. RBAC walls: every role may view the register; only supervisor+ reach
//      /lab/retests/new (employee is bounced); supervisor sees the secondary
//      nav entry.
//   C. Supervisor creates a retest through the real form (?test=<APPROVED
//      FAIL original) → detail page; the original row is untouched; the
//      retest row preserves original id/reason/original result/original final
//      state/new test id; LAB_RETEST/CREATE + LAB_TEST/LINK audit rows.
//   D. Detail + register show the frozen values; the new DRAFT execution
//      test exists; a second retest numbers -02; the test detail page shows
//      the Create Retest affordance and links retests.
//   E. Completion: the new test is submitted and approved through the real
//      review API → retest OPEN → COMPLETED + LAB_RETEST/APPROVAL audit.
//   F. Ineligible original (DRAFT): the create form shows the not-eligible
//      empty state; a forged direct POST writes nothing.
//   G. No horizontal overflow on the register at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-retests.mjs

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

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);
const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);

// Fixtures: an APPROVED FAIL test + a DRAFT test + a product (structural
// fixture only — no fabricated scientific values).
const productId = Number(
  db
    .prepare(
      "INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES ('E2E Retest Catheter', 'PRD-RT-E2E', 'air', 1, ?)",
    )
    .run(managerId).lastInsertRowid,
);
function insertTestRow(overrides = {}) {
  const cols = {
    test_number: `PENDING-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    test_type: 'air',
    product_id: productId,
    lot_number: 'LOT-E2E-RT',
    sampling_area: 'Area 1',
    connector_type: 'Locking connector with fixed threads',
    sample_count: 5,
    final_result: 'FAIL',
    status: 'APPROVED',
    tested_by: employeeId,
    created_by: employeeId,
    approved_by: managerId,
    approved_at: '2026-08-10 09:00:00',
    ...overrides,
  };
  const keys = Object.keys(cols);
  const id = Number(
    db.prepare(`INSERT INTO lab_test_records (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
      .run(...keys.map((k) => cols[k])).lastInsertRowid,
  );
  const number = `LAB-TEST-${String(id).padStart(5, '0')}`;
  db.prepare('UPDATE lab_test_records SET test_number = ? WHERE id = ?').run(number, id);
  return { id, number };
}
const original = insertTestRow();
const draftOriginal = insertTestRow({ status: 'DRAFT', final_result: null, approved_by: null, approved_at: null });
const registerUrl = '/lab/retests';

const retestRows = () => db.prepare('SELECT * FROM lab_test_retests WHERE original_test_id = ? ORDER BY id').all(original.id);
const retestAudit = (retestId) =>
  db.prepare("SELECT action, note FROM qc_audit_log WHERE entity_type='LAB_RETEST' AND entity_id=? ORDER BY id").all(retestId);

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${registerUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET retest register → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let supervisor;
let manager;
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  const res = await emp.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, 'employee: retest register viewable (all roles)');
  ok((await emp.locator('nav[aria-label="Laboratory sections"] a[href="/lab/retests"]').count()) === 0, 'employee: no retests secondary-nav entry (supervisor+)');
  await emp.goto(`${BASE}/lab/retests/new?test=${original.id}`, { waitUntil: 'domcontentloaded' });
  await emp.waitForURL((u) => u.pathname === '/lab/retests', { timeout: 15_000 });
  ok(true, 'employee: bounced from the create form to the register');
  await emp.close();

  supervisor = await browser.newPage();
  await login(supervisor, 'supervisor');
  const res2 = await supervisor.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res2.status() === 200, 'supervisor: retest register → 200');
  ok((await supervisor.locator('nav[aria-label="Laboratory sections"] a[href="/lab/retests"]').count()) === 1, 'supervisor: retests secondary-nav entry visible');

  manager = await browser.newPage();
  await login(manager, 'manager');
  await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok((await manager.locator('nav[aria-label="Laboratory sections"] a[href="/lab/retests"]').count()) === 1, 'manager: retests secondary-nav entry visible');
}

// ── C. Supervisor creates a retest through the real form ──
let retestId;
let newTestId;
{
  const before = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(original.id);

  await supervisor.goto(`${BASE}/lab/retests/new?test=${original.id}`, { waitUntil: 'domcontentloaded' });
  const formBody = await supervisor.locator('main').innerText();
  ok(formBody.includes(original.number), 'create form: original test number shown read-only');
  ok(formBody.includes('APPROVED'), 'create form: original status shown');
  await supervisor.selectOption('#reason', 'FAIL');
  await supervisor.fill('#reason_note', 'E2E: sample out of tolerance.');
  await supervisor.locator(`form[action="/lab/retests/new?test=${original.id}"] button[type="submit"]`).click();
  await supervisor.waitForURL((u) => /^\/lab\/retests\/\d+$/.test(u.pathname), { timeout: 15_000 });
  retestId = Number(supervisor.url().match(/(\d+)\/?$/)[1]);

  const rows = retestRows();
  eq_(rows.length, 1, 'create: one retest row written');
  const row = rows[0];
  eq_(row.retest_number, `LAB-RETEST-${String(original.id).padStart(5, '0')}-01`, 'create: retest number is -01');
  eq_(Number(row.original_test_id), original.id, 'create: original test id preserved');
  eq_(row.reason, 'FAIL', 'create: reason preserved');
  eq_(row.original_result, 'FAIL', 'create: original result frozen');
  eq_(row.original_status, 'APPROVED', 'create: original final state frozen');
  ok(row.new_test_id !== null, 'create: new test id preserved (relationship)');
  newTestId = Number(row.new_test_id);
  const nt = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(newTestId);
  eq_(nt.status, 'DRAFT', 'create: new execution test is DRAFT');
  eq_(nt.lot_number, 'LOT-E2E-RT', 'create: controlled context copied (lot)');

  const after = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(original.id);
  eq_(JSON.stringify(before), JSON.stringify(after), 'create: ORIGINAL test row is untouched');

  const audit = retestAudit(retestId);
  eq_(audit.length, 1, 'create: exactly one LAB_RETEST audit row');
  eq_(audit[0].action, 'CREATE', 'create: creation audited (CREATE)');
  const link = db
    .prepare("SELECT id FROM qc_audit_log WHERE entity_type='LAB_TEST' AND action='LINK' AND entity_id=?")
    .get(original.id);
  ok(!!link, 'create: original test gets a LINK audit row');
}

// ── D. Detail + register + second retest + test-detail affordance ──
{
  await supervisor.goto(`${BASE}/lab/retests/${retestId}`, { waitUntil: 'domcontentloaded' });
  const body = await supervisor.locator('main').innerText();
  ok(body.includes(`LAB-RETEST-${String(original.id).padStart(5, '0')}-01`), 'detail: retest number shown');
  ok(body.includes(original.number), 'detail: original test number shown');
  ok(body.includes('FAIL result'), 'detail: documented reason shown');
  ok(body.includes('OPEN'), 'detail: OPEN status shown');
  ok(body.includes(db.prepare('SELECT test_number FROM lab_test_records WHERE id = ?').get(newTestId).test_number), 'detail: new execution test linked');

  await supervisor.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const registerBody = await supervisor.locator('main').innerText();
  ok(registerBody.includes(`LAB-RETEST-${String(original.id).padStart(5, '0')}-01`), 'register: retest listed');
  ok(registerBody.includes('1 retest found'), 'register: count shown');

  // Second retest → -02.
  await supervisor.goto(`${BASE}/lab/retests/new?test=${original.id}`, { waitUntil: 'domcontentloaded' });
  await supervisor.selectOption('#reason', 'HOLD');
  await supervisor.locator(`form[action="/lab/retests/new?test=${original.id}"] button[type="submit"]`).click();
  await supervisor.waitForURL((u) => /^\/lab\/retests\/\d+$/.test(u.pathname), { timeout: 15_000 });
  eq_(retestRows().length, 2, 'second retest: written');
  eq_(retestRows()[1].retest_number, `LAB-RETEST-${String(original.id).padStart(5, '0')}-02`, 'second retest: number is -02');

  // Test detail: Create Retest affordance (supervisor, APPROVED original) + retest links.
  await supervisor.goto(`${BASE}/lab/tests/${original.id}`, { waitUntil: 'domcontentloaded' });
  ok((await supervisor.locator(`a[href="/lab/retests/new?test=${original.id}"]`).count()) === 1, 'test detail: Create Retest affordance visible');
  const testDetailBody = await supervisor.locator('main').innerText();
  ok(testDetailBody.includes(`LAB-RETEST-${String(original.id).padStart(5, '0')}-01`), 'test detail: Retest History links the retest');
}

// ── E. Completion: approve the new test through the real review API ──
{
  db.prepare("UPDATE lab_test_records SET status='SUBMITTED', tested_by=? WHERE id = ?").run(employeeId, newTestId);
  const res = await manager.request.post(`${BASE}/api/lab/tests/${newTestId}/review`, {
    form: { action: 'approve' },
    headers: { Origin: BASE },
    maxRedirects: 0,
  });
  ok(res.status() === 302 || res.status() === 303, 'completion: approve POST accepted (redirect)');

  const row = db.prepare('SELECT * FROM lab_test_retests WHERE id = ?').get(retestId);
  eq_(row.status, 'COMPLETED', 'completion: retest OPEN → COMPLETED');
  const audit = retestAudit(retestId);
  eq_(audit.length, 2, 'completion: second LAB_RETEST audit row');
  eq_(audit[1].action, 'APPROVAL', 'completion: audited as APPROVAL');

  await supervisor.goto(`${BASE}/lab/retests/${retestId}`, { waitUntil: 'domcontentloaded' });
  const body = await supervisor.locator('main').innerText();
  ok(body.includes('COMPLETED'), 'detail: COMPLETED badge after approval');
}

// ── F. Ineligible original (DRAFT) ──
{
  await supervisor.goto(`${BASE}/lab/retests/new?test=${draftOriginal.id}`, { waitUntil: 'domcontentloaded' });
  const body = await supervisor.locator('main').innerText();
  ok(body.includes('not eligible for a retest'), 'eligibility: DRAFT original shows the not-eligible empty state');

  // Forged direct POST (valid reason, ineligible original) → flash error, no row.
  const before = db.prepare('SELECT COUNT(*) AS n FROM lab_test_retests WHERE original_test_id = ?').get(draftOriginal.id).n;
  const res = await supervisor.request.post(`${BASE}/lab/retests/new?test=${draftOriginal.id}`, {
    form: { reason: 'FAIL', reason_note: '' },
    headers: { Origin: BASE },
    maxRedirects: 0,
  });
  ok(res.status() === 302 || res.status() === 303, 'eligibility: forged POST redirected');
  const after = db.prepare('SELECT COUNT(*) AS n FROM lab_test_retests WHERE original_test_id = ?').get(draftOriginal.id).n;
  eq_(after, before, 'eligibility: no retest row written for a DRAFT original');
}

// ── G. No horizontal overflow ──
{
  await supervisor.setViewportSize({ width: 1440, height: 900 });
  await supervisor.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const overflow1440 = await supervisor.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow1440, 'register: no horizontal overflow at 1440px');

  await supervisor.setViewportSize({ width: 390, height: 844 });
  const overflow390 = await supervisor.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow390, 'register: no horizontal overflow at 390px');
}

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory retest workflow E2E checks passed.');
