// E2E a11y suite — WCAG 2.2 AA keyboard baseline + axe-core scan.
//
// Keyboard (fatal):
//   1. Skip link — the first Tab on any page focuses it; Enter jumps to #main;
//      the next Tab reaches the navbar (proves it is first in the tab order).
//   2. Notification dropdown — Enter opens it and focus moves into the menu;
//      Tab wraps inside the open menu (focus trap); Escape closes it and
//      returns focus to the bell trigger.
//   3. Task lifecycle dialogs — the completion wizard and the cancel dialog
//      open with focus inside, trap Tab, and return focus to their trigger
//      button on Escape.
//
// Axe (report-only, never fails the suite): WCAG 2.1/2.2 A+AA scan of /login,
// /dashboard and /tasks/[id]. Violations are printed and written to
// download/qa/a11y-qc-report.json so humans can triage them.
//
// Usage: QC_DB_PATH=<db> BASE_URL=<server> node scripts/e2e-a11y.mjs

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4322';
const DB_PATH = process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DB_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

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

// ── fixture: an active task for the wizard tests + one unread notification so
// the bell dropdown has focusable items ──
const mgr = userByName('manager');
ok(!!mgr, 'seeded manager exists');

let taskId = null;
const seedTx = db.transaction(() => {
  const info = db
    .prepare(
      `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, due_date)
       VALUES (?, ?, 'in_progress', 'medium', 10, ?, ?, NULL)`,
    )
    .run('A11Y keyboard fixture', 'a11y e2e fixture', mgr.id, mgr.id);
  taskId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO task_activity_log (task_id, user_id, action, new_value) VALUES (?, ?, ?, ?)').run(
    taskId,
    mgr.id,
    'task_created',
    'A11Y keyboard fixture',
  );
  db.prepare(
    `INSERT INTO notifications (user_id, task_id, type, title, message)
     VALUES (?, ?, 'assigned', 'A11Y test notification', 'Keyboard focus fixture')`,
  ).run(mgr.id, taskId);
});
seedTx();

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

/** Focus is inside the given selector? (polled — React effects move focus after paint.) */
async function waitFocusInside(page, selector, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const inside = await page.evaluate((sel) => {
      const el = document.activeElement;
      const root = document.querySelector(sel);
      return !!el && !!root && root.contains(el);
    }, selector);
    if (inside) return true;
    await page.waitForTimeout(50);
  }
  return false;
}

const browser = await chromium.launch({ headless: true });
console.log(`\n▶ E2E a11y — ${BASE}\n`);

try {
  // ─────────────────── 1. Skip link (first focusable, Enter → #main) ───────────────────
  console.log('── Scenario 1: skip link ──');
  // Pages must come from a context — axe-core 4.x rejects browser.newPage().
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, 'manager');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });

  await page.keyboard.press('Tab');
  const skipFirst = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName === 'A' && el.classList.contains('skip-link');
  });
  ok(skipFirst, '1a. first Tab focuses the skip link');

  await page.keyboard.press('Tab');
  const nextInNav = await page.evaluate(() => document.activeElement?.closest('header') !== null);
  ok(nextInNav, '1b. next Tab reaches the navbar (skip link is truly first)');

  await page.keyboard.press('Shift+Tab');
  const skipAgain = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName === 'A' && el.classList.contains('skip-link');
  });
  ok(skipAgain, '1c. Shift+Tab returns to the skip link');

  await page.keyboard.press('Enter');
  const jumped = await page.evaluate(() => document.activeElement?.id === 'main' || location.hash === '#main');
  ok(jumped, '1d. Enter on the skip link jumps to #main');

  // ─────────────────── 2. Notification dropdown: focus in, trap, Escape back ───────────────────
  console.log('\n── Scenario 2: notification dropdown keyboard behaviour ──');
  const bell = page.locator('button[aria-label^="Notifications"]');
  await bell.focus();
  const bellFocused = await page.evaluate(() =>
    document.activeElement?.getAttribute('aria-label')?.startsWith('Notifications'),
  );
  ok(bellFocused, '2a. bell button focused');

  await page.keyboard.press('Enter');
  await page.waitForSelector('#notification-dropdown', { state: 'visible', timeout: 5_000 });
  ok(await waitFocusInside(page, '#notification-dropdown'), '2b. opening the dropdown moves focus into it');

  let trapped = true;
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => {
      const el = document.activeElement;
      const menu = document.getElementById('notification-dropdown');
      return !!el && !!menu && menu.contains(el);
    });
    if (!inside) {
      trapped = false;
      break;
    }
  }
  ok(trapped, '2c. Tab wraps inside the open dropdown (focus trap)');

  await page.keyboard.press('Escape');
  await page.waitForSelector('#notification-dropdown', { state: 'detached', timeout: 5_000 });
  const focusBackOnBell = await page.evaluate(() =>
    document.activeElement?.getAttribute('aria-label')?.startsWith('Notifications'),
  );
  ok(focusBackOnBell, '2d. Escape closes the dropdown and returns focus to the bell');

  // ─────────────────── 3. Completion wizard: focus in, trap, Escape back ───────────────────
  console.log('\n── Scenario 3: completion wizard keyboard behaviour ──');
  await page.goto(`${BASE}/tasks/${taskId}`);
  const completeBtn = page.locator('button:has-text("Complete task")');
  await completeBtn.waitFor({ state: 'visible', timeout: 15_000 });
  await completeBtn.focus();
  await page.keyboard.press('Enter');

  const wizard = page.locator('[role="dialog"][aria-labelledby="completion-wizard-title"]');
  await wizard.waitFor({ state: 'visible', timeout: 5_000 });
  ok(await waitFocusInside(page, '[role="dialog"][aria-labelledby="completion-wizard-title"]'), '3a. wizard opens with focus inside the dialog');

  let wTrapped = true;
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => {
      const el = document.activeElement;
      const dlg = document.querySelector('[role="dialog"][aria-labelledby="completion-wizard-title"]');
      return !!el && !!dlg && dlg.contains(el);
    });
    if (!inside) {
      wTrapped = false;
      break;
    }
  }
  ok(wTrapped, '3b. wizard traps Tab inside the dialog (wrap-around)');

  await page.keyboard.press('Escape');
  await wizard.waitFor({ state: 'detached', timeout: 5_000 });
  const wizardFocusBack = await page.evaluate(() => document.activeElement?.textContent?.includes('Complete task'));
  ok(wizardFocusBack, '3c. Escape closes the wizard and returns focus to the Complete button');

  // ─────────────────── 4. Cancel dialog: focus in, Escape back ───────────────────
  console.log('\n── Scenario 4: cancel dialog keyboard behaviour ──');
  const cancelBtn = page.locator('button:has-text("Cancel task")');
  await cancelBtn.focus();
  await page.keyboard.press('Enter');

  const cancelDlg = page.locator('[role="dialog"][aria-labelledby="cancel-dialog-title"]');
  await cancelDlg.waitFor({ state: 'visible', timeout: 5_000 });
  ok(
    await waitFocusInside(page, '[role="dialog"][aria-labelledby="cancel-dialog-title"]'),
    '4a. cancel dialog opens with focus inside',
  );

  await page.keyboard.press('Escape');
  await cancelDlg.waitFor({ state: 'detached', timeout: 5_000 });
  const cancelFocusBack = await page.evaluate(() => document.activeElement?.textContent?.includes('Cancel task'));
  ok(cancelFocusBack, '4b. Escape closes the cancel dialog and returns focus to its trigger');

  // ─────────────────── 5. axe-core scan (report-only) ───────────────────
  console.log('\n── Scenario 5: axe-core WCAG A/AA scan ──');
  const SHOT_DIR = join(process.cwd(), 'download', 'qa');
  if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

  const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'];
  const axePages = [];

  // /login must be scanned logged-out — use a separate context.
  const guestCtx = await browser.newContext();
  const guestPage = await guestCtx.newPage();
  await guestPage.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30_000 });
  await guestPage.waitForTimeout(300);
  const loginResults = await new AxeBuilder({ page: guestPage })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  axePages.push({ path: '/login', results: loginResults });

  for (const path of ['/dashboard', `/tasks/${taskId}`]) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    axePages.push({ path, results });
  }
  await guestCtx.close();

  const summary = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  const report = [];
  for (const { path, results } of axePages) {
    const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
    for (const v of results.violations) {
      if (v.impact && SEVERITY_ORDER.includes(v.impact)) counts[v.impact] += 1;
    }
    for (const s of SEVERITY_ORDER) summary[s] += counts[s];
    report.push({
      path,
      counts,
      total: results.violations.length,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
      })),
    });
    console.log(
      `  [${path.padEnd(14)}] C:${counts.critical} S:${counts.serious} M:${counts.moderate} m:${counts.minor} (${results.violations.length} total)`,
    );
    for (const v of results.violations) {
      console.log(`      - [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
    }
  }
  writeFileSync(join(SHOT_DIR, 'a11y-qc-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n  axe summary → critical:${summary.critical} serious:${summary.serious} moderate:${summary.moderate} minor:${summary.minor}`);
  console.log(`  📄 report → download/qa/a11y-qc-report.json`);
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E a11y crashed:', err);
} finally {
  // ── cleanup: fixture task + notification + activity + sessions ──
  if (taskId) {
    db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(taskId);
    db.prepare('DELETE FROM task_activity_log WHERE task_id = ?').run(taskId);
    db.prepare('DELETE FROM notifications WHERE task_id = ?').run(taskId);
    db.prepare('DELETE FROM task_comments WHERE task_id = ?').run(taskId);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  }
  db.prepare('DELETE FROM notifications WHERE title = ?').run('A11Y test notification');
  db.prepare('DELETE FROM sessions').run();
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
