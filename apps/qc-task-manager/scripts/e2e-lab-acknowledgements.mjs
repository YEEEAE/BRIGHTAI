// E2E spec for the QC Laboratory controlled-document acknowledgement flow
// (/lab/acknowledgements — contract §5.2 LAB_DOCUMENT_ACKNOWLEDGE use case).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-documents.mjs). Covers the acknowledgement register end-to-end:
//   A. Auth wall: anonymous GET the register → login redirect.
//   B. RBAC walls: all roles may view the register; the Acknowledge action
//      renders only on the viewer's OWN pending rows; assignment (supervisor+)
//      is gated both on the page (employee redirected away) and the server.
//   C. Version history link: every version row on /lab/documents/[id]/versions
//      links to its version-scoped acknowledgement register.
//   D. Assignment: a supervisor assigns an APPROVED version to employees via
//      the real form → PENDING rows + CREATE audit + notifications; the
//      register lists the six tracked fields; non-APPROVED versions render an
//      empty state with no form.
//   E. Acknowledgement: the assigned employee acknowledges their own pending
//      row via the real button → ACKNOWLEDGED + acknowledged date + audit +
//      owner notification + flash.
//   F. Version-specific: same employee holds independent rows on v3 and v4 of
//      one document; acknowledging v3 leaves v4 PENDING (DB + register).
//   G. Filters: status / version drill-down / document / employee.
//   H. No horizontal overflow at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-acknowledgements.mjs

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

const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);
const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);

// Clean up any leftover E2E fixtures from a previous partial run.
db.prepare(`DELETE FROM lab_document_acknowledgements WHERE document_version_id IN (SELECT id FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2EACK-%'))`).run();
db.prepare(`DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2EACK-%')`).run();
db.prepare(`DELETE FROM lab_documents WHERE code LIKE 'E2EACK-%'`).run();
db.prepare("DELETE FROM users WHERE username = 'e2eack-employee'").run();
db.prepare("DELETE FROM notifications WHERE title LIKE 'E2EACK-%' OR title LIKE '%E2EACK-%'").run();

// A second employee for multi-employee assignment.
const second = db
  .prepare(
    `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
     VALUES ('e2eack-employee', 'unused', 'E2E Ack Employee 2', 'employee', 'QC', 1, 1)`,
  )
  .run();
const secondEmployeeId = Number(second.lastInsertRowid);

// Fixtures: one approved SOP with v3 + v4, and one DRAFT SOP (never assignable).
function insertDoc({ code, title, type = 'SOP', status = 'APPROVED' }) {
  const r = db
    .prepare(
      `INSERT INTO lab_documents (code, title, type, owner_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '2026-02-01 09:00:00', '2026-02-01 09:00:00')`,
    )
    .run(code, title, type, managerId, status, managerId);
  const docId = Number(r.lastInsertRowid);
  db.prepare('UPDATE lab_documents SET created_at = ?, updated_at = ? WHERE id = ?').run('2026-02-01 09:00:00', '2026-02-01 09:00:00', docId);
  return docId;
}
function insertVersion(docId, version, versionStatus = 'APPROVED') {
  const v = db
    .prepare(
      `INSERT INTO lab_document_versions (document_id, version, content_md, content_html_sanitized, change_summary, author_id, approved_by, approved_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(docId, version, `# v${version} content`, `<h2>v${version}</h2><p>content</p>`, `E2E v${version} release.`, managerId, managerId, '2026-02-02 09:00:00', versionStatus);
  const versionId = Number(v.lastInsertRowid);
  db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
  return versionId;
}

const sopId = insertDoc({ code: 'E2EACK-SOP-001', title: 'E2E Acknowledgement Air Procedure' });
const v3Id = insertVersion(sopId, 3, 'APPROVED');
const v4Id = insertVersion(sopId, 4, 'APPROVED');
const draftId = insertDoc({ code: 'E2EACK-SOP-090', title: 'E2E Draft Never Assignable', status: 'DRAFT' });
const draftV1Id = insertVersion(draftId, 1, 'DRAFT');

const registerUrl = '/lab/acknowledgements';

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${registerUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET acknowledgement register → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let employee;
let supervisor;
{
  employee = await browser.newPage();
  await login(employee, 'employee');
  const res = await employee.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, 'employee: acknowledgement register → 200');
  ok((await employee.locator('main').innerText()).includes('Document Acknowledgements'), 'employee: register header rendered');
  eq_(await employee.locator('main a[href^="/lab/acknowledgements/assign"]').count(), 0, 'employee: no assign affordance on empty register');

  supervisor = await browser.newPage();
  await login(supervisor, 'supervisor');
  const res2 = await supervisor.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res2.status() === 200, 'supervisor: acknowledgement register → 200');

  // Employee cannot open the assign page — redirected with a flash.
  const empAssign = await employee.goto(`${BASE}/lab/acknowledgements/assign?version=${v3Id}`, { waitUntil: 'domcontentloaded' });
  eq_(empAssign.status(), 200, 'employee: assign page request resolves (redirect target)');
  ok(empAssign.url().includes('/lab/acknowledgements') && !empAssign.url().includes('/assign'), 'employee: assign page redirects to the register');
  ok((await employee.locator('main').innerText()).includes('do not have permission'), 'employee: flash explains the redirect');
}

// ── C. Version history links into the version-scoped register ──
{
  await supervisor.goto(`${BASE}/lab/documents/${sopId}/versions`, { waitUntil: 'domcontentloaded' });
  const links = supervisor.locator(`main a[href="/lab/acknowledgements?version=${v3Id}"], main a[href="/lab/acknowledgements?version=${v4Id}"]`);
  eq_(await links.count(), 2, 'versions: every version row links to its acknowledgement register');
  await supervisor.locator(`main a[href="/lab/acknowledgements?version=${v3Id}"]`).click();
  await supervisor.waitForURL((u) => u.pathname === '/lab/acknowledgements' && u.search === `?version=${v3Id}`, { timeout: 15_000 });
  ok((await supervisor.locator('main').innerText()).includes('Showing acknowledgements for one version only.'), 'register: version-scoped banner rendered');
}

// ── D. Assignment via the real form (supervisor+) ──
{
  // The version-scoped register shows the Assign button for supervisor+.
  const assignHref = `/lab/acknowledgements/assign?version=${v3Id}`;
  const btn = supervisor.locator(`main a[href="${assignHref}"]`);
  ok((await btn.count()) > 0, 'register: supervisor sees the Assign Employees button on a version-scoped view');
  await btn.first().click();
  await supervisor.waitForURL((u) => u.pathname === '/lab/acknowledgements/assign', { timeout: 15_000 });
  const assignBody = await supervisor.locator('main').innerText();
  ok(assignBody.includes('E2EACK-SOP-001') && assignBody.includes('v3'), 'assign page: document + version identity rendered');
  // Every active user is assignable when nothing is assigned yet (5 seeded
  // accounts + the e2e second employee are all is_active=1).
  eq_(await supervisor.locator('main input[name="user_ids"]').count(), 5, 'assign page: all five active users available');

  // Pick the employee + the second employee and submit the real form.
  await supervisor.locator('main input[name="user_ids"][value="' + employeeId + '"]').check();
  await supervisor.locator('main input[name="user_ids"][value="' + secondEmployeeId + '"]').check();
  await supervisor.locator('main button[type="submit"]:has-text("Assign")').click();
  await supervisor.waitForURL((u) => u.pathname === '/lab/acknowledgements' && u.search === `?version=${v3Id}`, { timeout: 15_000 });

  const rows = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE document_version_id = ?').all(v3Id);
  eq_(rows.length, 2, 'assign: two PENDING rows written');
  ok(rows.every((r) => r.status === 'PENDING'), 'assign: rows are PENDING');
  ok(rows.every((r) => Boolean(r.assigned_at)), 'assign: assigned date stamped');
  ok(rows.every((r) => r.acknowledged_at === null), 'assign: acknowledged date null');

  const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT_VERSION' AND entity_id = ? AND action = 'CREATE'").get(v3Id);
  ok(audit, 'assign: CREATE audit row written');
  ok(String(audit.note).includes('E2EACK-SOP-001'), 'assign: audit note carries the document code');

  const notified = db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE type = 'lab_document_acknowledgement' AND title LIKE '%E2EACK-SOP-001%'").get().n;
  eq_(Number(notified), 2, 'assign: both employees notified');

  ok((await supervisor.locator('main').innerText()).includes('Acknowledgement assigned to 2 employees'), 'assign: success flash rendered');
}

// ── E. Register lists the six tracked fields + own-row Acknowledge action ──
{
  await employee.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  const body = await employee.locator('main').innerText();
  ok(body.includes('E2EACK-SOP-001'), 'register: document listed');
  ok(body.includes('v3'), 'register: version listed');
  ok(body.includes('QC Employee'), 'register: employee name listed');
  // thead is uppercase-styled (text-xs uppercase) so the date column headers
  // read as ASSIGNED DATE / ACKNOWLEDGED DATE in rendered text.
  ok(body.toUpperCase().includes('ASSIGNED DATE') && body.toUpperCase().includes('ACKNOWLEDGED DATE'), 'register: date columns rendered');
  ok(body.includes('Pending'), 'register: status rendered');
  eq_(await employee.locator('main form[action^="/lab/acknowledgements/"]').count(), 1, 'register: exactly one Acknowledge action (own pending row only)');

  // The supervisor sees NO acknowledge form (nothing assigned to them). Scope
  // to the acknowledge action explicitly: the page also renders the
  // role-visible "Save this view" POST form (saved views), which is unrelated
  // to acknowledgements.
  await supervisor.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  eq_(await supervisor.locator('main form[action$="/acknowledge"]').count(), 0, 'register: non-assigned roles see no acknowledge forms');
}

// ── F. Employee acknowledges via the real button ──
{
  const before = db.prepare("SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT_VERSION' AND action = 'ACKNOWLEDGE'").get().n;
  await employee.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  await employee.locator('main button:has-text("Acknowledge")').first().click();
  await employee.waitForURL((u) => u.pathname === '/lab/acknowledgements', { timeout: 15_000 });
  ok((await employee.locator('main').innerText()).includes('Document version acknowledged.'), 'acknowledge: success flash rendered');

  const row = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE document_version_id = ? AND user_id = ?').get(v3Id, employeeId);
  eq_(row.status, 'ACKNOWLEDGED', 'acknowledge: status flips to ACKNOWLEDGED');
  ok(Boolean(row.acknowledged_at), 'acknowledge: acknowledged date stamped');

  const after = db.prepare("SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT_VERSION' AND action = 'ACKNOWLEDGE'").get().n;
  eq_(Number(after), Number(before) + 1, 'acknowledge: ACKNOWLEDGE audit row written');

  const ownerNote = db.prepare("SELECT * FROM notifications WHERE type = 'lab_document_acknowledged' AND user_id = ?").get(managerId);
  ok(ownerNote, 'acknowledge: document owner notified');
}

// ── G. Version-specific acknowledgement ──
{
  // Assign the same employee to v4 too — a DISTINCT row from the v3 one.
  const c = await supervisor.request.post(`${BASE}/lab/acknowledgements/assign?version=${v4Id}`, {
    form: { user_ids: String(employeeId) },
    headers: { Origin: BASE },
    maxRedirects: 0,
  });
  ok(c.status() === 302, 'version-specific: v4 assignment redirects');
  const v4Row = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE document_version_id = ? AND user_id = ?').get(v4Id, employeeId);
  ok(v4Row, 'version-specific: employee holds a distinct v4 row');
  eq_(v4Row.status, 'PENDING', 'version-specific: v4 PENDING while v3 is acknowledged');

  // The register distinguishes the two versions for the same employee.
  await employee.goto(`${BASE}${registerUrl}?employee=${employeeId}`, { waitUntil: 'domcontentloaded' });
  const body = await employee.locator('main').innerText();
  ok(body.includes('v3') && body.includes('v4'), 'version-specific: register lists both versions');
  ok(body.includes('Acknowledged') && body.includes('Pending'), 'version-specific: v3 Acknowledged + v4 Pending rendered');
  eq_(await employee.locator('main button:has-text("Acknowledge")').count(), 1, 'version-specific: only the v4 row still shows Acknowledge');
}

// ── H. Filters ──
{
  // status=PENDING narrows to pending rows only (scoped to tbody: the page
  // chrome and the status filter select also contain the word "Acknowledged").
  await employee.goto(`${BASE}${registerUrl}?status=PENDING`, { waitUntil: 'domcontentloaded' });
  let body = await employee.locator('main').innerText();
  ok(body.includes('Pending'), 'filter: status=PENDING shows pending rows');
  eq_(await employee.locator('main tbody tr', { hasText: 'Acknowledged' }).count(), 0, 'filter: status=PENDING hides acknowledged rows');

  // document filter.
  await employee.goto(`${BASE}${registerUrl}?document=${sopId}`, { waitUntil: 'domcontentloaded' });
  body = await employee.locator('main').innerText();
  ok(body.includes('E2EACK-SOP-001') && !body.includes('E2EACK-SOP-090'), 'filter: document narrows to the SOP');

  // version drill-down shows only that version's rows (scoped to tbody: the
  // page description mentions "SOP-QC-001 v3 never counts for v4").
  await employee.goto(`${BASE}${registerUrl}?version=${v4Id}`, { waitUntil: 'domcontentloaded' });
  const tbody = await employee.locator('main tbody').innerText();
  ok(tbody.includes('v4') && !tbody.includes('v3'), 'filter: version drill-down isolates v4');
}

// ── I. Non-APPROVED versions are never assignable ──
{
  await supervisor.goto(`${BASE}/lab/acknowledgements/assign?version=${draftV1Id}`, { waitUntil: 'domcontentloaded' });
  const body = await supervisor.locator('main').innerText();
  ok(body.includes('Only approved versions can be assigned'), 'assign page: DRAFT version shows the empty state');
  eq_(await supervisor.locator('main form[method="post"]').count(), 0, 'assign page: no form for non-APPROVED versions');
}

// ── J. No horizontal overflow ──
{
  await supervisor.setViewportSize({ width: 1440, height: 900 });
  await supervisor.goto(`${BASE}${registerUrl}`, { waitUntil: 'domcontentloaded' });
  ok(!(await supervisor.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'register: no horizontal overflow at 1440px');

  await supervisor.setViewportSize({ width: 390, height: 844 });
  await supervisor.goto(`${BASE}${registerUrl}?status=PENDING`, { waitUntil: 'domcontentloaded' });
  ok(!(await supervisor.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'register: no horizontal overflow at 390px');

  await supervisor.setViewportSize({ width: 1440, height: 900 });
  await supervisor.goto(`${BASE}/lab/acknowledgements/assign?version=${v3Id}`, { waitUntil: 'domcontentloaded' });
  ok(!(await supervisor.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'assign page: no horizontal overflow at 1440px');
}

// Cleanup fixtures (leave the shared DB tidy for later suites).
db.prepare(`DELETE FROM lab_document_acknowledgements WHERE document_version_id IN (SELECT id FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2EACK-%'))`).run();
db.prepare(`DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code LIKE 'E2EACK-%')`).run();
db.prepare(`DELETE FROM lab_documents WHERE code LIKE 'E2EACK-%'`).run();
db.prepare("DELETE FROM users WHERE username = 'e2eack-employee'").run();
db.prepare("DELETE FROM notifications WHERE title LIKE 'E2EACK-%' OR title LIKE '%E2EACK-%'").run();
db.prepare(`DELETE FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT_VERSION' AND entity_id NOT IN (SELECT id FROM lab_document_versions)`).run();

await employee.close();
await supervisor.close();
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
console.log('✅ Laboratory document acknowledgement E2E checks passed.');
