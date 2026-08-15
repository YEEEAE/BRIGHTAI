// E2E spec for the QC Laboratory Product Master (PROMPT 08, /lab/products).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-review.mjs). Covers the Product Master end-to-end:
//   A. Auth wall: anonymous GET /lab/products → login redirect.
//   B. RBAC walls: employee cannot open /lab/products/new (bounced); manager
//      reaches the list, new, edit and detail pages (200).
//   C. Manager creates a product through the real form POST → redirected to
//      the detail page; row + equipment link + CREATE audit exist in the DB.
//   D. Manager edits the product (name + equipment swap) → UPDATE audit.
//   E. Detail page shows master fields, related equipment, usage count with a
//      live drill-down into the test register, and the change history.
//   F. Duplicate code POST is rejected (flash) and leaves no row.
//   G. Test form integration: /lab/tests/new shows the Product Master
//      suggestions panel when the typed description matches an active
//      product (populate — measured fields stay editable inputs).
//   H. No horizontal overflow on the list / detail at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-products.mjs

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

// ── Seed reference master data (equipment only — no fabricated products) ──
const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
db.prepare("INSERT OR IGNORE INTO lab_equipment (name, code, status_raw, created_by) VALUES ('E2E Product Rig', 'EQ-PRD', 'IN_USE', ?)").run(managerId);
const equipmentA = Number(db.prepare("SELECT id FROM lab_equipment WHERE code='EQ-PRD'").get().id);
db.prepare("INSERT OR IGNORE INTO lab_equipment (name, code, status_raw, created_by) VALUES ('E2E Product Rig B', 'EQ-PRDB', 'IN_USE', ?)").run(managerId);
const equipmentB = Number(db.prepare("SELECT id FROM lab_equipment WHERE code='EQ-PRDB'").get().id);

const auditsFor = (pid) =>
  db.prepare("SELECT action FROM qc_audit_log WHERE entity_type='LAB_PRODUCT' AND entity_id = ? ORDER BY id").all(pid);

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}/lab/products`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET /lab/products → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let manager;
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  await emp.goto(`${BASE}/lab/products/new`, { waitUntil: 'domcontentloaded' });
  ok(emp.url().startsWith(`${BASE}/lab/products`) && !emp.url().includes('/new'), 'employee: bounced from /lab/products/new');
  await emp.goto(`${BASE}/lab/products`, { waitUntil: 'domcontentloaded' });
  ok(emp.url().startsWith(`${BASE}/lab/products`), 'employee: may view the Product Master list');
  await emp.close();

  manager = await browser.newPage();
  await login(manager, 'manager');
  for (const path of ['/lab/products', '/lab/products/new']) {
    const res = await manager.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    ok(res.status() === 200, `manager: ${path} → 200`);
  }
}

// ── C. Create through the real form ──
let productId;
{
  await manager.fill('#name', 'E2E Syringe Seal');
  await manager.fill('#code', 'PRD-E2E');
  await manager.fill('#description', 'E2E product created through the form');
  await manager.selectOption('#connector_type', { label: 'Locking connector with fixed threads' });
  await manager.selectOption('#default_test_type', 'air');
  await manager.check(`input[name="equipment_ids"][value="${equipmentA}"]`);
  await manager.locator('form[action^="/lab/products"] button[type="submit"]').click();
  await manager.waitForURL((u) => /\/lab\/products\/\d+$/.test(u.pathname), { timeout: 15_000 });
  productId = Number(manager.url().match(/\/lab\/products\/(\d+)$/)?.[1] ?? 0);
  ok(productId > 0, 'create: redirected to the new product detail page');

  const row = db.prepare('SELECT * FROM lab_products WHERE id = ?').get(productId);
  ok(Boolean(row), 'create: row exists');
  eq_(row.name, 'E2E Syringe Seal', 'create: name stored');
  eq_(row.code, 'PRD-E2E', 'create: code stored');
  eq_(row.is_active, 1, 'create: active');
  const links = db.prepare('SELECT equipment_id FROM lab_product_equipment WHERE product_id = ?').all(productId);
  eq_(links.length, 1, 'create: one equipment link');
  eq_(Number(links[0].equipment_id), equipmentA, 'create: linked equipment id');
  eq_(auditsFor(productId).map((a) => a.action).join(','), 'CREATE', 'create: CREATE audit row');

  ok((await manager.getByRole('heading', { name: 'E2E Syringe Seal' }).count()) > 0, 'detail: product name heading');
  ok((await manager.locator('section[aria-labelledby="sec-history"]').getByText('CREATE').count()) > 0, 'detail: change history shows CREATE');
  ok((await manager.getByText('E2E Product Rig').count()) > 0, 'detail: related equipment listed');
}

// ── D. Edit through the real form ──
{
  await manager.goto(`${BASE}/lab/products/${productId}/edit`, { waitUntil: 'domcontentloaded' });
  await manager.fill('#name', 'E2E Syringe Seal v2');
  await manager.uncheck(`input[name="equipment_ids"][value="${equipmentA}"]`);
  await manager.check(`input[name="equipment_ids"][value="${equipmentB}"]`);
  await manager.fill('#notes', 'updated in e2e');
  await manager.locator('form[action^="/lab/products"] button[type="submit"]').click();
  await manager.waitForURL((u) => u.pathname === `/lab/products/${productId}`, { timeout: 15_000 });

  const row = db.prepare('SELECT name, notes FROM lab_products WHERE id = ?').get(productId);
  eq_(row.name, 'E2E Syringe Seal v2', 'edit: name updated');
  const links = db.prepare('SELECT equipment_id FROM lab_product_equipment WHERE product_id = ?').all(productId);
  eq_(links.length, 1, 'edit: equipment link swapped');
  eq_(Number(links[0].equipment_id), equipmentB, 'edit: new equipment id');
  eq_(auditsFor(productId).map((a) => a.action).join(','), 'CREATE,UPDATE', 'edit: audit trail CREATE → UPDATE');
}

// ── E. Detail + register drill-down ──
{
  db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, product_id, sample_count, status, tested_by, created_by, created_at, updated_at)
     VALUES ('LAB-TEST-91001', 'air', ?, 5, 'DRAFT', ?, ?, datetime('now'), datetime('now'))`,
  ).run(productId, managerId, managerId);
  await manager.goto(`${BASE}/lab/products/${productId}`, { waitUntil: 'domcontentloaded' });
  ok((await manager.getByText('1 test reference this product').count()) > 0, 'detail: usage count includes the seeded test');
  await manager.click('a[href*="/lab/tests?product="]');
  await manager.waitForURL((u) => u.pathname === '/lab/tests' && u.search.includes(`product=${productId}`), { timeout: 15_000 });
  ok((await manager.getByText('LAB-TEST-91001').count()) > 0, 'register: drill-down shows the referencing test');
}

// ── F. Duplicate code rejected ──
{
  await manager.goto(`${BASE}/lab/products/new`, { waitUntil: 'domcontentloaded' });
  await manager.fill('#name', 'Duplicate Attempt');
  await manager.fill('#code', 'PRD-E2E');
  await manager.locator('form[action^="/lab/products"] button[type="submit"]').click();
  await manager.waitForURL((u) => u.pathname === '/lab/products/new', { timeout: 15_000 });
  const dups = db.prepare('SELECT COUNT(*) AS n FROM lab_products WHERE code = ?').get('PRD-E2E').n;
  eq_(dups, 1, 'duplicate: no second row created');
}

// ── G. Test form integration (populate, never overwrite) ──
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  await emp.goto(`${BASE}/lab/tests/new?type=air`, { waitUntil: 'networkidle' });
  // The island is client:visible — hydration must finish before the fill can
  // flip React state. A pre-hydration fill is a harmless no-op that leaves
  // React's state empty, so retry the fill (same pattern as e2e-delete-request)
  // until the reference panel confirms the onChange handler ran.
  let panel = emp.locator('[data-testid="product-reference-panel"]');
  let tries = 0;
  do {
    await emp.fill('#product_description', 'e2e syringe seal v2'); // case-insensitive match
    if (await panel.count() > 0) break;
    await emp.waitForTimeout(300);
    tries += 1;
  } while (tries < 5);
  await panel.waitFor({ state: 'visible', timeout: 10_000 });
  ok((await emp.locator('[data-testid="product-reference-panel"]').getByText('Locking connector with fixed threads').count()) > 0, 'test form: product panel shows the stored connector default');
  // The measured fields remain editable inputs on the same page.
  const pressure = emp.locator('#actual_pressure');
  ok((await pressure.count()) === 1, 'test form: measured Actual Pressure remains an editable input');
  const conn = emp.locator('#connector_type');
  eq_(await conn.inputValue(), 'Locking connector with fixed threads', 'test form: empty Connector Type prefilled from the Product Master');
  await emp.close();
}

// ── H. No horizontal overflow ──
{
  for (const [width, label] of [[1440, 'desktop'], [390, 'mobile']]) {
    await manager.setViewportSize({ width, height: 900 });
    await manager.goto(`${BASE}/lab/products`, { waitUntil: 'domcontentloaded' });
    const w1 = await manager.evaluate(() => document.documentElement.scrollWidth);
    ok(w1 <= width, `overflow: /lab/products at ${label} (${w1} ≤ ${width})`);
    await manager.goto(`${BASE}/lab/products/${productId}`, { waitUntil: 'domcontentloaded' });
    const w2 = await manager.evaluate(() => document.documentElement.scrollWidth);
    ok(w2 <= width, `overflow: product detail at ${label} (${w2} ≤ ${width})`);
  }
}

function eq_(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

await browser.close();
db.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
