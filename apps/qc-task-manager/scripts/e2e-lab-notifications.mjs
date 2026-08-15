// E2E spec for /lab/notifications (PROMPT 26) — the lab-filtered view over
// the SAME notifications table (never a second system).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-calendar.mjs). Covers:
//   A. Auth wall: anonymous GET → login redirect (middleware prefix guard).
//   B. RBAC: every role with LAB_VIEW renders the page.
//   C. Lab-scoped content: fixture lab rows render with severity sections,
//      entity links and unread dots; a non-lab row never surfaces.
//   D. Read state: per-row mark-read (React island → /api/notifications/[id]/read),
//      the Unread filter, and mark-all-read (shared is_read column).
//   E. No horizontal overflow at 1440 / 390 + mobile render.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-notifications.mjs

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

// Fixture lab kinds only — the non-lab legacy row (type 'assigned') is a
// scoping probe and must never count toward read-state assertions.
const LAB_TYPES = `'lab_test_rejected','lab_calibration_overdue','lab_test_approved','lab_retest_update','lab_document_review_due','lab_maintenance_event'`;
const countLabUnread = () =>
  Number(db.prepare(`SELECT COUNT(*) AS n FROM notifications WHERE title LIKE 'E2ENOTIF-%' AND type IN (${LAB_TYPES}) AND is_read = 0`).get().n);

const db = new Database(DB_PATH, { readonly: false });
const browser = await chromium.launch({ headless: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

const employeeId = Number(db.prepare("SELECT id FROM users WHERE username='employee'").get().id);

// Clean up any leftover E2E fixtures from a previous partial run.
function cleanup() {
  db.prepare("DELETE FROM notifications WHERE title LIKE 'E2ENOTIF-%'").run();
}
cleanup();

// Fixtures: deterministic lab rows for the employee, one per representative
// kind. Titles are E2ENOTIF-prefixed so cleanup stays exact.
const insertNotification = db.prepare(
  `INSERT INTO notifications (user_id, task_id, type, title, message, entity_href, is_read, created_at)
   VALUES (?, NULL, ?, ?, ?, ?, ?, datetime('now'))`,
);
insertNotification.run(employeeId, 'lab_test_rejected', 'E2ENOTIF-rejected', 'Test LAB-TEST-00001 was rejected: out of tolerance.', '/lab/tests/100001', 0);
insertNotification.run(employeeId, 'lab_calibration_overdue', 'E2ENOTIF-cal-overdue', 'Pressure Rig 1 calibration is overdue.', '/lab/equipment/200001', 0);
insertNotification.run(employeeId, 'lab_test_approved', 'E2ENOTIF-approved', 'Test LAB-TEST-00002 was approved.', '/lab/tests/100002', 0);
insertNotification.run(employeeId, 'lab_retest_update', 'E2ENOTIF-retest', 'LAB-RETEST-00003-01 was opened.', '/lab/retests/300001', 0);
insertNotification.run(employeeId, 'lab_document_review_due', 'E2ENOTIF-doc-review', 'SOP-QC-001 review is due today.', '/lab/documents/400001/edit', 0);
insertNotification.run(employeeId, 'lab_maintenance_event', 'E2ENOTIF-maintenance', 'Pressure Rig 1 has a new maintenance event.', '/lab/equipment/200001/maintenance', 1); // already read
// Non-lab row: must NEVER surface on the lab view (same table, one system).
insertNotification.run(employeeId, 'assigned', 'E2ENOTIF-legacy-task', 'A global-only task alert.', null, 0);

const ids = Object.fromEntries(
  db.prepare("SELECT id, title FROM notifications WHERE title LIKE 'E2ENOTIF-%'").all().map((r) => [r.title, r.id]),
);

const pageUrl = '/lab/notifications';

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${pageUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. Every role renders the page ──
const pages = {};
for (const username of ['admin', 'manager', 'supervisor', 'employee']) {
  const page = await browser.newPage();
  pages[username] = page;
  await login(page, username);
  const res = await page.goto(`${BASE}${pageUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, `${username}: notifications page → 200`);
  ok((await page.locator('main').innerText()).includes('Notifications'), `${username}: page header rendered`);
}

// ── C. Lab-scoped content for the employee ──
{
  const employee = pages.employee;
  await employee.goto(`${BASE}${pageUrl}`, { waitUntil: 'domcontentloaded' });
  const body = await employee.locator('main').innerText();

  for (const title of ['E2ENOTIF-rejected', 'E2ENOTIF-cal-overdue', 'E2ENOTIF-approved', 'E2ENOTIF-retest', 'E2ENOTIF-doc-review', 'E2ENOTIF-maintenance']) {
    ok(body.includes(title), `content: ${title} rendered`);
  }
  ok(!body.includes('E2ENOTIF-legacy-task'), 'content: non-lab notification never surfaces on the lab view');

  // Severity section labels (headings render uppercase — innerText is the
  // rendered text, so assert the uppercased form).
  ok(body.includes('TESTS REJECTED'), 'content: danger section label rendered');
  ok(body.includes('TESTS APPROVED'), 'content: success section label rendered');
  ok(body.includes('RETEST UPDATES'), 'content: retest section label rendered');

  // Entity links to the real source records.
  for (const href of ['/lab/tests/100001', '/lab/equipment/200001', '/lab/retests/300001', '/lab/documents/400001/edit']) {
    eq_(await employee.locator(`main a[href="${href}"]`).count() > 0, true, `entity link: ${href}`);
  }

  // Counts: 6 lab rows total, 5 unread (the maintenance row is read).
  ok(body.includes('All (6)'), 'counter: All shows 6 lab rows');
  ok(body.includes('Unread (5)'), 'counter: Unread shows 5 lab rows');
}

// ── D. Read state: per-row mark-read + unread filter + mark-all ──
{
  const employee = pages.employee;
  await employee.goto(`${BASE}${pageUrl}`, { waitUntil: 'domcontentloaded' });

  // Per-row mark-read (React island → API → page reload). The island reloads
  // the page after the API call, so wait for the unread count to drop in the
  // shared table, then for the fresh render (the button text returns to its
  // idle state once the reload finishes).
  const markReadBtn = employee.locator('button', { hasText: 'Mark as read' }).first();
  ok((await employee.locator('button', { hasText: 'Mark as read' }).count()) >= 1, 'mark-read: island buttons rendered for unread rows');
  await markReadBtn.click();
  let deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (countLabUnread() === 4) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  eq_(countLabUnread(), 4, 'mark-read: unread lab fixture count drops to 4 in the shared table');
  await employee.waitForTimeout(300); // let the reload land before the next goto

  // Unread filter hides the read rows.
  await employee.goto(`${BASE}${pageUrl}?filter=unread`, { waitUntil: 'domcontentloaded' });
  let body = await employee.locator('main').innerText();
  ok(!body.includes('E2ENOTIF-maintenance'), 'unread filter: read maintenance row hidden');
  ok(body.includes('E2ENOTIF-rejected'), 'unread filter: unread rows still shown');

  // Mark-all-read clears the rest (same endpoint as the global page). Same
  // race-safe wait: poll the shared table, then let the redirect land.
  await employee.goto(`${BASE}${pageUrl}`, { waitUntil: 'domcontentloaded' });
  await employee.locator('button', { hasText: 'Mark all as read' }).click();
  deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (countLabUnread() === 0) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  await employee.waitForTimeout(400); // let the redirect land
  await employee.waitForLoadState('domcontentloaded');
  eq_(countLabUnread(), 0, 'mark-all-read: every lab fixture row read in the shared table');
  body = await employee.locator('main').innerText();
  ok(body.includes('Unread (0)'), 'mark-all-read: counter shows zero unread');
}

// ── E. Mobile + no horizontal overflow ──
{
  const employee = pages.employee;
  await employee.setViewportSize({ width: 390, height: 844 });
  await employee.goto(`${BASE}${pageUrl}`, { waitUntil: 'domcontentloaded' });
  ok((await employee.locator('main').innerText()).includes('E2ENOTIF-rejected'), 'mobile: rows render at 390px');
  ok(!(await employee.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no horizontal overflow at 390px');
  await employee.setViewportSize({ width: 1440, height: 900 });
  await employee.goto(`${BASE}${pageUrl}`, { waitUntil: 'domcontentloaded' });
  ok(!(await employee.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no horizontal overflow at 1440px');
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
console.log('✅ Laboratory notifications E2E checks passed.');
