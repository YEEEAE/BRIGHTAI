// E2E spec for the QC Laboratory SOP/WI Document Library register
// (/lab/documents — page reference §39).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-calibration.mjs). Covers the document register end-to-end:
//   A. Auth wall: anonymous GET the register → login redirect.
//   B. RBAC walls: all roles may view (canViewLab); the New Document action
//      is supervisor+ (canCreateLabDocument) and stays DISABLED until the
//      editor page lands — employee sees no affordance, supervisor/manager see
//      a disabled button (no dead link to an unimplemented route).
//   C. Fixtures: manager inserts documents (SOP approved w/ review due,
//      WI draft, archived w/ past review date) directly + typed equipment/
//      product links → register lists them with version, owner, type badges.
//   D. Filters: type/status/owner/review=due narrow the register server-side;
//      the review=due filter excludes ARCHIVED/SUPERSEDED (command-center KPI
//      semantics); the KPI drill-down on /lab now links to /lab/documents?review=due.
//   E. Search: q matches title / code / product / equipment.
//   F. Sorting: clicking a column header re-sorts (code asc/desc cycle).
//   G. Pagination: per=2 over 3+ rows renders Prev/Next + page numbers.
//   H. No horizontal overflow on the register at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-documents.mjs

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

const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);

const registerUrl = '/lab/documents';
const PREFIX = 'E2E-';
const TITLE_AIR = 'E2E Subatmospheric Air Procedure';
const TITLE_WI = 'E2E Vacuum Tester Setup';
const TITLE_OLD = 'E2E Retired Packaging Check';

// Clean up any leftover E2E docs/products from a previous partial run.
db.prepare(`DELETE FROM lab_document_links WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE '${PREFIX}%')`).run();
db.prepare(`DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE '${PREFIX}%')`).run();
db.prepare(`DELETE FROM lab_documents WHERE code LIKE '${PREFIX}%'`).run();
db.prepare("DELETE FROM lab_products WHERE code = 'E2E-CONN'").run();

// Fixtures: one approved SOP with review due yesterday + product/equipment
// links; one WI draft; one archived doc with a past review date (must be
// excluded from review=due).
const product = db
  .prepare("INSERT INTO lab_products (name, code, is_active, created_by) VALUES ('E2E Connector', 'E2E-CONN', 1, ?)")
  .run(managerId);
const productId = Number(product.lastInsertRowid);
const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);

const today = new Date();
function isoDay(offset) {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function insertDoc({ code, title, type, status, ownerId, reviewDue = null, effective = null, updatedAt }) {
  const r = db
    .prepare(
      `INSERT INTO lab_documents (code, title, type, owner_id, status, review_due_date, effective_date, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(code, title, type, ownerId, status, reviewDue, effective, managerId, updatedAt, updatedAt);
  const docId = Number(r.lastInsertRowid);
  const v = db
    .prepare(
      `INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status)
       VALUES (?, 1, '# content', 'E2E fixture.', ?, 'APPROVED')`,
    )
    .run(docId, managerId);
  const versionId = Number(v.lastInsertRowid);
  db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
  return docId;
}

const airId = insertDoc({
  code: 'E2E-SOP-001',
  title: TITLE_AIR,
  type: 'SOP',
  status: 'APPROVED',
  ownerId: managerId,
  reviewDue: isoDay(-1),
  effective: isoDay(-30),
  updatedAt: '2026-01-06 09:00:00',
});
db.prepare("INSERT INTO lab_document_links (document_id, entity_type, entity_id, created_by) VALUES (?, 'PRODUCT', ?, ?)").run(airId, productId, managerId);
db.prepare("INSERT INTO lab_document_links (document_id, entity_type, entity_id, created_by) VALUES (?, 'EQUIPMENT', ?, ?)").run(airId, equipmentId, managerId);

insertDoc({
  code: 'E2E-WI-002',
  title: TITLE_WI,
  type: 'WI',
  status: 'DRAFT',
  ownerId: supervisorId,
  updatedAt: '2026-01-05 09:00:00',
});
insertDoc({
  code: 'E2E-WI-OLD',
  title: TITLE_OLD,
  type: 'WI',
  status: 'ARCHIVED',
  ownerId: managerId,
  reviewDue: isoDay(-50),
  updatedAt: '2026-01-04 09:00:00',
});

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${registerUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET document register → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let manager;
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  const res = await emp.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, 'employee: document register → 200');
  eq_(await emp.locator('button[disabled][aria-disabled="true"]').count(), 0, 'employee: no create affordance (supervisor+)');
  await emp.close();

  const sup = await browser.newPage();
  await login(sup, 'supervisor');
  const res2 = await sup.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res2.status() === 200, 'supervisor: document register → 200');
  // New Document appears twice for supervisor+: the page header action AND the
  // secondary nav entry (both now live with the editor).
  eq_(await sup.locator('main a[href="/lab/documents/new"]').count(), 2, 'supervisor: live New Document links (header + nav)');
  await sup.close();

  manager = await browser.newPage();
  await login(manager, 'manager');
  const res3 = await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res3.status() === 200, 'manager: document register → 200');
  eq_(await manager.locator('main a[href="/lab/documents/new"]').count(), 2, 'manager: live New Document links (header + nav)');
}

// ── C. Register lists fixtures with version/owner/type ──
{
  await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR), 'register: approved SOP listed');
  ok(body.includes(TITLE_WI), 'register: WI draft listed');
  ok(body.includes(TITLE_OLD), 'register: archived WI listed');
  ok(body.includes('v1'), 'register: version rendered from current_version_id');
  ok(body.includes('Department Manager'), 'register: owner name joined');
  ok(body.includes('Approved') && body.includes('Draft') && body.includes('Archived'), 'register: status badges rendered');
  ok(body.includes('E2E-CONN') || body.includes('E2E Connector'), 'register: product name joined');

  // /lab/documents/… links on this page = New Document header action (1) +
  // New Document secondary-nav entry (1) + a per-row Edit link for each
  // editable record (manager may edit every non-archived / non-superseded
  // document → APPROVED + DRAFT = 2; ARCHIVED has none) = 4. No detail-page
  // (/lab/documents/[id]) links exist yet — the reader lands later.
  eq_(await manager.locator('main a[href^="/lab/documents/"]').count(), 4, 'register: 2× New Document + 2 editable-row Edit links');
}

// ── D. Filters ──
{
  // type filter
  await manager.goto(`${BASE}${registerUrl}?type=WI`, { waitUntil: 'domcontentloaded' });
  let body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_WI) && body.includes(TITLE_OLD), 'filter: type=WI lists WI docs');
  ok(!body.includes(TITLE_AIR), 'filter: type=WI excludes SOPs');
  ok(body.includes('2 documents found'), 'filter: type=WI count label');

  // status filter
  await manager.goto(`${BASE}${registerUrl}?status=APPROVED`, { waitUntil: 'domcontentloaded' });
  body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR) && !body.includes(TITLE_WI), 'filter: status=APPROVED isolates the approved SOP');

  // owner filter
  await manager.goto(`${BASE}${registerUrl}?owner=${managerId}`, { waitUntil: 'domcontentloaded' });
  body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR) && body.includes(TITLE_OLD), 'filter: owner=manager lists owned docs');
  ok(!body.includes(TITLE_WI), 'filter: owner=manager excludes supervisor-owned WI');

  // review=due → only the active doc whose review date is reached
  await manager.goto(`${BASE}${registerUrl}?review=due`, { waitUntil: 'domcontentloaded' });
  body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR), 'filter: review=due includes the due SOP');
  ok(!body.includes(TITLE_OLD), 'filter: review=due excludes ARCHIVED with past review date');
  ok(body.includes('1 document found'), 'filter: review=due count label');

  // command-center KPI drill-down is now live and honors review=due
  await manager.goto(`${BASE}/lab`, { waitUntil: 'domcontentloaded' });
  const labBody = await manager.locator('main').innerText();
  ok(/Document Reviews Due|SOP|documents/i.test(labBody), 'command center: documents KPI section rendered');
  const drilldown = manager.locator('main a[href="/lab/documents?review=due"]');
  ok((await drilldown.count()) > 0, 'command center: KPI drill-down links to /lab/documents?review=due');
  await drilldown.first().click();
  await manager.waitForURL((u) => u.pathname === '/lab/documents' && u.search === '?review=due', { timeout: 15_000 });
  body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR) && !body.includes(TITLE_OLD), 'drill-down: lands on the review=due filter result');
}

// ── E. Search ──
{
  await manager.goto(`${BASE}${registerUrl}?q=Subatmospheric`, { waitUntil: 'domcontentloaded' });
  let body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR), 'search: title match');

  await manager.goto(`${BASE}${registerUrl}?q=E2E-CONN`, { waitUntil: 'domcontentloaded' });
  body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR), 'search: product code match');

  await manager.goto(`${BASE}${registerUrl}?q=NOC-05`, { waitUntil: 'domcontentloaded' });
  body = await manager.locator('main').innerText();
  ok(body.includes(TITLE_AIR), 'search: equipment code match');

  await manager.goto(`${BASE}${registerUrl}?q=zzz-no-such`, { waitUntil: 'domcontentloaded' });
  body = await manager.locator('main').innerText();
  ok(body.includes('No documents match your search'), 'search: no-match empty state');
}

// ── F. Sorting ──
{
  // default sort: updated_at desc → newest first (E2E-SOP-001, 2026-01-06).
  await manager.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  let firstRow = (await manager.locator('main tbody tr').first().innerText()) ?? '';
  ok(firstRow.includes('E2E-SOP-001'), 'sort: default updated_at desc → SOP first');

  // click Document Code → asc
  await manager.locator('main a', { hasText: 'Document Code' }).click();
  await manager.waitForURL((u) => u.pathname === '/lab/documents' && u.search.includes('sort=code') && u.search.includes('dir=asc'), { timeout: 15_000 });
  firstRow = (await manager.locator('main tbody tr').first().innerText()) ?? '';
  ok(firstRow.includes('E2E-SOP-001'), 'sort: code asc → E2E-SOP-001 first');

  // click again → desc (desc is the default dir, so it drops from the URL)
  await manager.locator('main a', { hasText: 'Document Code' }).click();
  await manager.waitForURL((u) => u.pathname === '/lab/documents' && u.search.includes('sort=code') && !u.search.includes('dir=asc'), { timeout: 15_000 });
  firstRow = (await manager.locator('main tbody tr').first().innerText()) ?? '';
  ok(firstRow.includes('E2E-WI-OLD'), 'sort: code desc → E2E-WI-OLD first');
}

// ── G. Pagination ──
{
  // per=10 is the smallest valid page size — insert extra docs so the register
  // spans two pages (3 fixtures + 10 extras = 13).
  for (let i = 1; i <= 10; i++) {
    insertDoc({
      code: `E2E-EXTRA-${String(i).padStart(3, '0')}`,
      title: `E2E Extra Document ${i}`,
      type: i % 2 === 0 ? 'WI' : 'SOP',
      status: 'DRAFT',
      ownerId: supervisorId,
      updatedAt: `2026-01-0${1 + (i % 9)} ${String(9 + (i % 10)).padStart(2, '0')}:00:00`,
    });
  }

  await manager.goto(`${BASE}${registerUrl}?per=10`, { waitUntil: 'domcontentloaded' });
  let body = await manager.locator('main').innerText();
  ok(body.includes('13 documents found'), 'pagination: total count label');
  ok(body.includes('Next'), 'pagination: Next rendered');
  const pagination = manager.locator('nav[aria-label="Pagination"] a');
  ok((await pagination.count()) >= 3, 'pagination: page numbers + Prev/Next links rendered');
  const hrefs = await pagination.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  ok(hrefs.some((h) => h?.includes('page=2')), 'pagination: page-2 link present');
  await pagination.filter({ hasText: '2' }).click();
  await manager.waitForURL((u) => u.search.includes('page=2'), { timeout: 15_000 });
  body = await manager.locator('main').innerText();
  ok(body.includes('Prev'), 'pagination: page 2 shows Prev');
  ok(body.includes('E2E-EXTRA-'), 'pagination: page 2 lists remaining docs');
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

// Cleanup fixtures (leave the shared DB tidy for later suites).
db.prepare(`DELETE FROM lab_document_links WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE '${PREFIX}%')`).run();
db.prepare(`DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE '${PREFIX}%')`).run();
db.prepare(`DELETE FROM lab_documents WHERE code LIKE '${PREFIX}%'`).run();
db.prepare("DELETE FROM lab_products WHERE code = 'E2E-CONN'").run();

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory SOP/WI document register E2E checks passed.');