// E2E spec for the delete-request workflow (CORE BUSINESS RULE #4).
// Runs against a live dev server (BASE_URL, default http://localhost:4322) and
// asserts DB state via better-sqlite3 on the SAME database the server uses.
// Scenarios: A approve path (with REQUIRED confirmation dialog), B reject path
// (with optional rejection reason), C completed blocked, D duplicate blocked,
// E supervisor cannot review, F role surface.
//
// The live request row remains task-owned and cascades, while reviewed
// decisions are copied to task_deletion_history and task activity remains a
// durable hash-chain record after approval.
// Usage: QC_DB_PATH=<app>/db/e2e_test.db node scripts/e2e-delete-request.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4322';
const DB_PATH = process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DB_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
// Astro's built-in same-origin CSRF check requires an Origin header; a real
// browser sends it on form POSTs, Playwright's APIRequestContext does not.
const CSRF_HEADERS = { Origin: BASE, Referer: `${BASE}/` };

// ── tiny test harness ──
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

// ── DB helpers ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const userByName = (name) => q('SELECT id, username, role FROM users WHERE username = ?', name);
const taskByTitle = (title) => q('SELECT id, title, status FROM tasks WHERE title = ?', title);
const requestForTask = (taskId) =>
  q('SELECT * FROM task_delete_requests WHERE task_id = ? ORDER BY id DESC LIMIT 1', taskId);
const activityForTask = (taskId) =>
  all('SELECT action, user_id FROM task_activity_log WHERE task_id = ? ORDER BY id', taskId);

// ── browser helpers ──
async function launch() {
  const browser = await chromium.launch({ headless: true });
  return browser;
}

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  // Scope to the login form: the Navbar also renders a submit button (Sign out)
  // once a session exists, which would otherwise be clicked first.
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

/** Manager creates a task assigned to the given user id. Returns task id. */
async function createTask(managerPage, { title, description, assigneeId }) {
  await managerPage.goto(`${BASE}/manager/new`);
  await managerPage.fill('#title', title);
  if (description) await managerPage.fill('#description', description);
  if (assigneeId) await managerPage.selectOption('#assigned_to', String(assigneeId));
  // Scope to the new-task form: the Navbar's "Sign out" is also a submit
  // button and comes first in the DOM — an unscoped click logs the manager out.
  await managerPage.locator('form[action="/manager/new"] button[type="submit"]').click();
  await managerPage.waitForURL((u) => u.pathname === '/manager', { timeout: 15_000 });
  const row = taskByTitle(title);
  if (!row) throw new Error(`createTask: "${title}" not found in DB`);
  return row.id;
}

/** Employee opens a task and submits a deletion request (reason null = skipped). */
async function employeeRequestsDeletion(employeePage, taskId, reason) {
  await employeePage.goto(`${BASE}/tasks/${taskId}`);
  await employeePage.waitForSelector('text=🗑️ Request Deletion', { timeout: 15_000 });
  // Exercise the protected HTTP boundary directly. The acceptance runner is
  // intentionally deterministic and does not make React hydration timing a
  // prerequisite for authorization/CSRF coverage; task-shared covers the same
  // endpoint plus the rendered notification/badge contract.
  const response = await employeePage.request.post(`${BASE}/api/tasks/${taskId}/delete-request`, {
    form: { reason: reason ?? '' },
    headers: CSRF_HEADERS,
  });
  const body = await response.json();
  if (response.status() !== 200 || body.ok !== true) {
    throw new Error(`delete request failed: ${response.status()} ${JSON.stringify(body)}`);
  }
  await employeePage.reload();
  await employeePage.waitForSelector('text=🗑️ Deletion requested', { timeout: 15_000 });
}

async function openRequestsPage(managerPage) {
  await managerPage.goto(`${BASE}/manager/requests`);
  await managerPage.waitForSelector('h1:has-text("Delete requests")', { timeout: 15_000 });
}

/**
 * Click a review trigger button (data-review-action) and wait for its confirm
 * dialog. Retries the click in case the React island has not hydrated yet (a
 * pre-hydration click is a harmless no-op). The trigger is located by data
 * attribute because the dialog's own confirm button is always in the DOM
 * (hidden when closed) and would collide with a text-based locator.
 */
async function openReviewDialog(page, row, action) {
  let tries = 0;
  while ((await page.locator('dialog[open]').count()) === 0 && tries < 3) {
    await row.locator(`button[data-review-action="${action}"]`).click();
    tries += 1;
    await page.waitForTimeout(250);
  }
  await page.waitForSelector('dialog[open]', { timeout: 10_000 });
}
// ── part 2: scenarios A–B ──
const browser = await launch();
const SHOT_DIR = join(process.cwd(), 'download', 'qa');
if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

const managerCtx = await browser.newContext();
const employeeCtx = await browser.newContext();
const supervisorCtx = await browser.newContext();
const managerPage = await managerCtx.newPage();
const employeePage = await employeeCtx.newPage();
const supervisorPage = await supervisorCtx.newPage();

try {
  const mgr = userByName('manager');
  const emp = userByName('employee');
  const sup = userByName('supervisor');
  ok(!!mgr && !!emp && !!sup, 'seeded roles exist (manager, employee, supervisor)');
  if (!mgr || !emp) throw new Error('seeding failed');

  console.log(`\n▶ E2E delete-request workflow — ${BASE}\n`);
  await login(managerPage, 'manager');
  await login(employeePage, 'employee');
  await login(supervisorPage, 'supervisor');

  // ─────────────── Scenario A: approve path ───────────────
  console.log('\n── Scenario A: employee requests → manager approves → task deleted ──');

  const aId = await createTask(managerPage, {
    title: 'SC-A delete me',
    description: 'Duplicate task, should be deleted after approval.',
    assigneeId: emp.id,
  });

  await employeeRequestsDeletion(employeePage, aId, 'Duplicate task, please remove.');

  const dupRes = await employeePage.request.post(`${BASE}/api/tasks/${aId}/delete-request`, {
    form: { reason: 'second attempt' },
    headers: CSRF_HEADERS,
  });
  const dupBody = await dupRes.json();
  ok(dupRes.status() === 400 && /already pending/.test(dupBody.error ?? ''), 'D. duplicate pending request blocked (400)');

  const aActsBefore = activityForTask(aId);
  ok(aActsBefore.some((a) => a.action === 'delete_requested' && a.user_id === emp.id), 'A. delete_requested logged to activity');

  await employeePage.goto(`${BASE}/employee`);
  const empListBadge = await employeePage.locator('li:has-text("SC-A delete me") span:has-text("🗑️ Deletion requested")').count();
  ok(empListBadge === 1, 'A. employee list shows "🗑️ Deletion requested" badge');

  await managerPage.goto(`${BASE}/manager`);
  const mgrListBadge = await managerPage.locator(`tr:has-text("SC-A delete me") :text("🗑️")`).count();
  ok(mgrListBadge === 1, 'A. manager list shows pending-deletion marker');

  await openRequestsPage(managerPage);
  const pendingRow = managerPage.locator('section:has-text("Pending") li', { hasText: 'SC-A delete me' }).first();
  await pendingRow.waitFor({ timeout: 10_000 });
  const rowText = await pendingRow.innerText();
  ok(rowText.includes('QC Employee'), 'A. pending row shows requester name');
  ok(rowText.includes('Duplicate task, please remove.'), 'A. pending row shows reason');
  ok(/Requested by .*·/.test(rowText), 'A. pending row shows request date');

  // A. approval requires confirmation — nothing is sent before the reviewer
  // confirms (no task delete, no request change).
  await openReviewDialog(managerPage, pendingRow, 'approve');
  const approveDlgText = await managerPage.locator('dialog[open]').innerText();
  ok(approveDlgText.includes('permanently delete') && approveDlgText.includes('SC-A delete me'), 'A. approval dialog explains the permanent deletion');
  ok(taskByTitle('SC-A delete me') !== undefined, 'A. task NOT deleted before confirmation');
  ok(requestForTask(aId)?.status === 'pending', 'A. request still pending before confirmation');
  await managerPage.locator('dialog[open] button:has-text("Delete task permanently")').click();
  await managerPage.waitForSelector('text=Deletion approved', { timeout: 15_000 });

  await managerPage.goto(`${BASE}/tasks/${aId}`);
  await managerPage.waitForSelector('h1:has-text("404")', { timeout: 10_000 });
  ok(true, 'A. task page returns 404 after approval');
  ok(taskByTitle('SC-A delete me') === undefined, 'A. task row deleted from DB');
  const aReq = requestForTask(aId);
  ok(aReq === undefined, 'A. request row cascade-deleted with the task (spec: ON DELETE CASCADE)');
  ok(activityForTask(aId).some((a) => a.action === 'delete_approved'), 'A. approval activity remains durable after task deletion');
  const aHistory = q('SELECT * FROM task_deletion_history WHERE task_id = ? AND outcome = \'approved\'', aId);
  ok(aHistory?.requested_by === emp.id && aHistory?.reviewed_by === mgr.id && aHistory?.reason === 'Duplicate task, please remove.', 'A. immutable deletion history preserves identity, reason, requester, and reviewer');

  await openRequestsPage(managerPage);
  const aHistoryRow = await managerPage.locator('section:has-text("History") li', { hasText: 'SC-A delete me' }).count();
  ok(aHistoryRow === 1, 'A. approved request remains in immutable history after task cascade');
// ─────────────── Scenario B: reject path ───────────────
  console.log('\n── Scenario B: employee requests → manager rejects → badge clears ──');

  const bId = await createTask(managerPage, {
    title: 'SC-B keep me',
    description: 'This one should survive the rejection.',
    assigneeId: emp.id,
  });

  await employeeRequestsDeletion(employeePage, bId, null);
  ok(true, 'B. request submitted without a reason (optional)');
  const bReq0 = requestForTask(bId);
  ok(bReq0?.status === 'pending' && bReq0?.reason === null, 'B. pending request inserted with NULL reason');

  await openRequestsPage(managerPage);
  const bPendingRow = managerPage.locator('section:has-text("Pending") li', { hasText: 'SC-B keep me' }).first();
  await bPendingRow.waitFor({ timeout: 10_000 });
  // B. rejection may include a reason — typed into the review dialog.
  await openReviewDialog(managerPage, bPendingRow, 'reject');
  await managerPage.fill(`#review-note-${bReq0.id}`, 'Keep this task — still needed');
  ok((await managerPage.locator('dialog[open] textarea').inputValue()) === 'Keep this task — still needed', 'B. rejection reason entered in the dialog');
  await managerPage.locator('dialog[open] button:has-text("Reject deletion request")').click();
  await managerPage.waitForSelector('text=Delete request for "SC-B keep me" rejected', { timeout: 15_000 });

  const bReq = requestForTask(bId);
  ok(bReq?.status === 'rejected', 'B. request status = rejected');
  ok(bReq?.reviewed_by === mgr.id && !!bReq?.reviewed_at, 'B. reviewed_by/at recorded');
  ok(bReq?.review_note === 'Keep this task — still needed', 'B. rejection reason persisted in review_note');
  ok(taskByTitle('SC-B keep me') !== undefined, 'B. task still exists after rejection');
  const bActs = activityForTask(bId);
  ok(bActs.some((a) => a.action === 'delete_requested'), 'B. delete_requested logged');
  ok(bActs.some((a) => a.action === 'delete_rejected' && a.user_id === mgr.id), 'B. delete_rejected logged');
  const bRejAct = q("SELECT new_value FROM task_activity_log WHERE task_id = ? AND action = 'delete_rejected'", bId);
  ok(bRejAct?.new_value === 'Keep this task — still needed', 'B. rejection reason logged in the activity entry');
  const bNotif = q("SELECT * FROM notifications WHERE user_id = ? AND type = 'delete_rejected' AND task_id = ?", emp.id, bId);
  ok(!!bNotif && bNotif.message.includes('Keep this task — still needed'), 'B. rejection reason included in the requester notification');

  await employeePage.goto(`${BASE}/employee`);
  const bBadgeGone = await employeePage.locator('li:has-text("SC-B keep me") span:has-text("🗑️ Deletion requested")').count();
  ok(bBadgeGone === 0, 'B. badge cleared from employee list');
  await employeePage.goto(`${BASE}/tasks/${bId}`);
  await employeePage.waitForSelector('text=🗑️ Request Deletion', { timeout: 15_000 });
  ok(true, 'B. "Request Deletion" button is back on the task page');

  await openRequestsPage(managerPage);
  const bHistRow = managerPage.locator('section:has-text("History") li', { hasText: 'SC-B keep me' }).first();
  await bHistRow.waitFor({ timeout: 10_000 });
  const bHistText = await bHistRow.innerText();
  ok(bHistText.includes('rejected'), 'B. history shows rejected');
  ok(bHistText.includes('reviewed by Department Manager'), 'B. history shows reviewer name');
  ok(bHistText.includes('Rejection note') && bHistText.includes('Keep this task — still needed'), 'B. history shows the rejection note');

  // ─────────────── Scenario C: completed task blocked ───────────────
  console.log('\n── Scenario C: completed tasks are not deletion-requestable ──');

  const cId = await createTask(managerPage, {
    title: 'SC-C completed',
    description: 'Must be frozen.',
    assigneeId: emp.id,
  });
  // No closure UI in the scaffold yet — simulate completion directly.
  db.prepare(
    "UPDATE tasks SET status = 'completed', progress_percent = 100, completed_at = datetime('now'), completed_by = ? WHERE id = ?",
  ).run(emp.id, cId);

  await employeePage.goto(`${BASE}/tasks/${cId}`);
  await employeePage.waitForSelector('text=read-only for everyone', { timeout: 15_000 });
  const cButton = await employeePage.locator('text=🗑️ Request Deletion').count();
  ok(cButton === 0, 'C. no "Request Deletion" button on a completed task');

  const cRes = await employeePage.request.post(`${BASE}/api/tasks/${cId}/delete-request`, {
    form: { reason: 'should fail' },
    headers: CSRF_HEADERS,
  });
  const cBody = await cRes.json();
  ok(cRes.status() === 400 && /Completed tasks/.test(cBody.error ?? ''), 'C. API rejects deletion request for completed task');
  ok(requestForTask(cId) === undefined, 'C. no request row created for completed task');
// ─────────────── Scenario E: supervisor cannot review ───────────────
  console.log('\n── Scenario E: only manager/admin may review requests ──');

  const eRes = await supervisorPage.request.post(`${BASE}/manager/requests/api`, {
    form: { action: 'approve', request_id: String(bReq.id) },
    maxRedirects: 0,
    headers: CSRF_HEADERS,
  });
  ok(eRes.status() === 302 && (eRes.headers()['location'] ?? '').startsWith('/supervisor'), 'E. supervisor POST /manager/requests/api → redirected away');
  ok(requestForTask(bId)?.status === 'rejected', 'E. rejected request untouched by supervisor attempt');

  // ─────────────── Scenario F: role surface ───────────────
  console.log('\n── Scenario F: role surface sanity ──');

  await employeePage.goto(`${BASE}/dashboard`);
  await employeePage.waitForURL((u) => u.pathname === '/employee', { timeout: 10_000 });
  ok(true, 'F. employee /dashboard redirects to /employee');

  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await login(adminPage, 'admin');
  await adminPage.goto(`${BASE}/manager/requests`);
  await adminPage.waitForSelector('h1:has-text("Delete requests")', { timeout: 15_000 });
  ok(true, 'F. admin can review delete requests');
  await adminCtx.close();

  // ────────────────────────────── cleanup ──────────────────────────────
  // Remove test rows so the e2e database is left clean (users remain).
  db.prepare('DELETE FROM task_attachments').run();
  db.prepare('DELETE FROM task_comments').run();
  db.prepare('DELETE FROM task_activity_log').run();
  db.prepare('DELETE FROM task_delete_requests').run();
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM sessions').run();
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
  try {
    await employeePage.screenshot({ path: join(SHOT_DIR, 'e2e-failure.png'), fullPage: true });
    console.log(`   screenshot: ${join(SHOT_DIR, 'e2e-failure.png')}`);
  } catch {
    /* ignore */
  }
} finally {
  await browser.close();
  db.close();
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
