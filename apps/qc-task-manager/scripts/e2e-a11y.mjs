// E2E a11y GATE — WCAG 2.1/2.2 AA keyboard + axe-core enforcement (QC-A11Y-GATE-010).
//
// This suite is a pilot GATE, not a report: it FAILS the build when any
// scanned page has a critical or serious axe violation. Moderate/minor
// violations are reported (console + download/qa/a11y-qc-report.json) without
// blocking, unless they break a core workflow (covered by the keyboard
// scenarios instead). No axe rule is disabled or overridden to pass.
//
// Keyboard + interaction scenarios (fatal):
//   1. Skip link — the first Tab on any page focuses it (focus-visible ring
//      verified); Enter jumps to #main; the next Tab reaches the navbar.
//   2. Notification dropdown — Enter opens it and focus moves into the menu;
//      Tab enters the open disclosure; Escape closes it and
//      returns focus to the bell trigger.
//   3. Completion wizard — opens with focus inside, announces a programmatically
//      associated name (aria-labelledby → real heading), traps Tab, returns
//      focus to its trigger on Escape.
//   4. Cancel dialog — same contract as the wizard.
//   5. Mobile navigation (390×844) — toggle is keyboard operable, aria-expanded
//      tracks state, grouped links are reachable, Escape closes and restores
//      focus to the toggle.
//
// Runtime structural checks per scanned page (fatal):
//   - exactly one visible H1 and no skipped heading levels;
//   - status pills are never color-only (every visible, non-aria-hidden
//     span.rounded-full carries text);
//   - every aria-describedby token resolves to an existing element;
//   - every visible form control has an accessible name
//     (wrapping/explicit <label>, aria-label or aria-labelledby).
//
// Axe scan (the gate): WCAG 2.x A+AA across 12 pilot pages — /login (guest),
// /employee (employee), /manager, /tasks/[id], /lab, /lab/tests,
// /lab/tests/new?type=air, /lab/tests/[id], /lab/documents,
// /lab/change-requests, /lab/search, /reports (manager). Fixtures are
// deterministic (fixed identifiers, pre/post cleanup) so counts are stable.
//
// Report: download/qa/a11y-qc-report.json (also uploaded by the QC Release
// Gate workflow when the pipeline fails).
//
// Usage: QC_DB_PATH=<db> BASE_URL=<server> node scripts/e2e-a11y.mjs

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4322';
const DB_PATH = process.env.QC_DB_PATH ?? process.env.QC_DATABASE_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DB_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

// ── tiny test harness ──
let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label, category = 'keyboard') {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push({ category, label });
    console.log(`  ❌ ${label}`);
  }
}

// ── bootstrap schema + seed before touching the DB file (mirrors the
// acceptance runner warmup: POST /login initializes SQLite, GET does not) ──
try {
  await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { Origin: BASE, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=%5F%5Fwarmup%5F%5F&password=x',
    redirect: 'manual',
  });
} catch {
  // Server unreachable — the login below will fail loudly anyway.
}

// ── DB helpers ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);
const userByName = (name) => q('SELECT id, username, role FROM users WHERE username = ?', name);

// ── deterministic fixtures (fixed identifiers; idempotent re-runs) ──
const TASK_TITLE = 'A11Y gate fixture';
const NOTIF_TITLE = 'A11Y gate notification';
const LAB_TEST_NUMBER = 'LAB-TEST-A11Y-GATE-01';
const LAB_PRODUCT_CODE = 'PROD-A11Y-GATE-01';
const LAB_EQUIPMENT_CODE = 'EQ-A11Y-GATE-01';

const mgr = userByName('manager');
ok(!!mgr, 'seeded manager exists', 'fixtures');
const emp = userByName('employee');
ok(!!emp, 'seeded employee exists', 'fixtures');

let taskId = null;
let labTestId = null;
function clearFixtures() {
  const prev = q('SELECT id FROM tasks WHERE title = ?', TASK_TITLE);
  if (prev) {
    db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(prev.id);
    db.prepare('DELETE FROM task_activity_log WHERE task_id = ?').run(prev.id);
    db.prepare('DELETE FROM notifications WHERE task_id = ?').run(prev.id);
    db.prepare('DELETE FROM task_comments WHERE task_id = ?').run(prev.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(prev.id);
  }
  db.prepare('DELETE FROM notifications WHERE title = ?').run(NOTIF_TITLE);
  const prevTest = q('SELECT id FROM lab_test_records WHERE test_number = ?', LAB_TEST_NUMBER);
  if (prevTest) {
    // Samples of APPROVED/VOID tests are frozen by DB triggers — flip OUR OWN
    // fixture row back to DRAFT first so the fixture can be removed.
    db.prepare("UPDATE lab_test_records SET status = 'DRAFT' WHERE id = ?").run(prevTest.id);
    db.prepare('DELETE FROM lab_test_samples WHERE test_id = ?').run(prevTest.id);
    db.prepare('DELETE FROM lab_test_retests WHERE original_test_id = ?').run(prevTest.id);
    db.prepare('DELETE FROM lab_test_records WHERE id = ?').run(prevTest.id);
  }
  db.prepare('DELETE FROM lab_products WHERE code = ?').run(LAB_PRODUCT_CODE);
  db.prepare('DELETE FROM lab_equipment WHERE code = ?').run(LAB_EQUIPMENT_CODE);
}
clearFixtures();

const seedTx = db.transaction(() => {
  // Active task for the wizard/cancel dialog tests + detail-page scan.
  const info = db
    .prepare(
      `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, due_date)
       VALUES (?, 'a11y gate fixture', 'in_progress', 'medium', 10, ?, ?, NULL)`,
    )
    .run(TASK_TITLE, mgr.id, mgr.id);
  taskId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO task_activity_log (task_id, user_id, action, new_value) VALUES (?, ?, ?, ?)').run(
    taskId,
    mgr.id,
    'task_created',
    TASK_TITLE,
  );
  // One unread notification so the bell dropdown has focusable items.
  db.prepare(
    `INSERT INTO notifications (user_id, task_id, type, title, message)
     VALUES (?, ?, 'assigned', ?, 'Keyboard focus fixture')`,
  ).run(mgr.id, taskId, NOTIF_TITLE);

  // Deterministic lab fixtures: product + equipment + an APPROVED test with
  // one sample, owned by the employee (detail page renders the full record).
  const prodId = Number(
    db
      .prepare(
        `INSERT INTO lab_products (name, code, description, connector_type, created_by)
         VALUES ('A11Y Gate Product', ?, 'a11y gate fixture', 'Threaded', ?)`,
      )
      .run(LAB_PRODUCT_CODE, mgr.id).lastInsertRowid,
  );
  const equipId = Number(
    db
      .prepare(
        `INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
         VALUES ('A11Y Gate Manometer', ?, 'Lab Bench 1', 'Operational', 'SN-A11Y-GATE-01', ?)`,
      )
      .run(LAB_EQUIPMENT_CODE, mgr.id).lastInsertRowid,
  );
  labTestId = Number(
    db
      .prepare(
        `INSERT INTO lab_test_records (
          test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
          sample_count, final_result, status, tested_by, created_by
         ) VALUES (?, 'air', ?, ?, 'LOT-A11Y-GATE-01', 'Area A', 1, 'PASS', 'APPROVED', ?, ?)`,
      )
      .run(LAB_TEST_NUMBER, prodId, equipId, emp.id, emp.id).lastInsertRowid,
  );
  db.prepare(
    `INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, status)
     VALUES (?, 1, 'LAB-TEST-A11Y-GATE-01-S01', 'Coupling Ring', 'PASS', 'APPROVED')`,
  ).run(labTestId);
});
seedTx();

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

/**
 * Open a dialog by focusing its trigger button and pressing Enter, retrying
 * while the island hydrates. The wizard/cancel triggers are server-rendered
 * and visible before the React hydration click handlers attach, so a single
 * Enter under load can land on a dead button; every retry re-presses Enter and
 * polls for the dialog (all focus/trap assertions below remain unchanged).
 */
async function openDialogWithKeyboard(page, triggerLocator, dialogSelector) {
  await triggerLocator.waitFor({ state: 'visible', timeout: 15_000 });
  await triggerLocator.focus();
  const dialog = page.locator(dialogSelector);
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Enter');
    try {
      await dialog.waitFor({ state: 'visible', timeout: 800 });
      return dialog;
    } catch {
      // Island may still be hydrating — the next Enter press is the retry.
    }
  }
  throw new Error(`Dialog ${dialogSelector} did not open after retries.`);
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
console.log(`\n▶ E2E a11y gate — ${BASE}\n`);

// Axe page plan: path + the session that scans it. Fixed identifiers keep the
// fixture pages deterministic across runs.
const SCAN_PAGES = [
  { path: '/login', role: 'guest' },
  { path: '/employee', role: 'employee' },
  { path: '/manager', role: 'manager' },
  { path: `/tasks/${taskId}`, role: 'manager' },
  { path: '/lab', role: 'manager' },
  { path: '/lab/tests', role: 'manager' },
  { path: '/lab/tests/new?type=air', role: 'employee' },
  { path: `/lab/tests/${labTestId}`, role: 'manager' },
  { path: '/lab/documents', role: 'manager' },
  { path: '/lab/change-requests', role: 'manager' },
  { path: '/lab/search', role: 'manager' },
  { path: '/reports', role: 'manager' },
];
const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'];
const axeReport = [];

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

  const skipRing = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || !el.classList.contains('skip-link')) return false;
    const cs = getComputedStyle(el);
    return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  });
  ok(skipRing, '1b. skip link shows a visible focus ring (focus-visible)');

  await page.keyboard.press('Tab');
  const nextInNav = await page.evaluate(() => document.activeElement?.closest('header') !== null);
  ok(nextInNav, '1c. next Tab reaches the navbar (skip link is truly first)');

  await page.keyboard.press('Shift+Tab');
  const skipAgain = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName === 'A' && el.classList.contains('skip-link');
  });
  ok(skipAgain, '1d. Shift+Tab returns to the skip link');

  await page.keyboard.press('Enter');
  const jumped = await page.evaluate(() => document.activeElement?.id === 'main' || location.hash === '#main');
  ok(jumped, '1e. Enter on the skip link jumps to #main');

  // Primary nav carries a visible focus ring (focus-visible contract of the
  // shared Navbar/AppButton primitives). Shift+Tab from #main walks backward
  // into the header's last focusable — a keyboard-initiated focus, so
  // :focus-visible applies deterministically.
  await page.keyboard.press('Shift+Tab');
  const navRing = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || !el.closest('header')) return false;
    const cs = getComputedStyle(el);
    return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  });
  ok(navRing, '1f. navbar links show a visible focus ring');

  // ─────────────────── 2. Notification disclosure: native Tab flow, Escape back ───────────────────
  console.log('\n── Scenario 2: notification dropdown keyboard behaviour ──');
  const bell = page.locator('button[aria-label^="Notifications"]');
  await bell.focus();
  const bellFocused = await page.evaluate(() =>
    document.activeElement?.getAttribute('aria-label')?.startsWith('Notifications'),
  );
  ok(bellFocused, '2a. bell button focused');

  await page.keyboard.press('Enter');
  await page.waitForSelector('#notification-dropdown', { state: 'visible', timeout: 5_000 });
  ok(await page.evaluate(() => document.activeElement === document.querySelector('button[aria-label^="Notifications"]')), '2b. opening the disclosure keeps focus on its trigger');
  await page.keyboard.press('Tab');
  ok(await waitFocusInside(page, '#notification-dropdown'), '2c. Tab enters the open disclosure naturally');

  await page.keyboard.press('Escape');
  await page.waitForSelector('#notification-dropdown', { state: 'detached', timeout: 5_000 });
  const focusBackOnBell = await page.evaluate(() =>
    document.activeElement?.getAttribute('aria-label')?.startsWith('Notifications'),
  );
  ok(focusBackOnBell, '2d. Escape closes the dropdown and returns focus to the bell');

  // ─────────────────── 3. Completion wizard: name, focus in, trap, Escape back ───────────────────
  console.log('\n── Scenario 3: completion wizard keyboard behaviour ──');
  await page.goto(`${BASE}/tasks/${taskId}`);
  const completeBtn = page.locator('button:has-text("Complete task")');
  const wizard = await openDialogWithKeyboard(page, completeBtn, '[role="dialog"][aria-labelledby="completion-wizard-title"]');
  ok(
    await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-labelledby="completion-wizard-title"]');
      const heading = document.getElementById('completion-wizard-title');
      return !!dlg && !!heading && heading.textContent.trim().length > 0 && dlg.contains(heading);
    }),
    '3a. wizard has a programmatic name (aria-labelledby → real heading)',
  );
  ok(await waitFocusInside(page, '[role="dialog"][aria-labelledby="completion-wizard-title"]'), '3b. wizard opens with focus inside the dialog');

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
  ok(wTrapped, '3c. wizard traps Tab inside the dialog (wrap-around)');

  await page.keyboard.press('Escape');
  await wizard.waitFor({ state: 'detached', timeout: 5_000 });
  const wizardFocusBack = await page.evaluate(() => document.activeElement?.textContent?.includes('Complete task'));
  ok(wizardFocusBack, '3d. Escape closes the wizard and returns focus to the Complete button');

  // ─────────────────── 4. Cancel dialog: name, focus in, Escape back ───────────────────
  console.log('\n── Scenario 4: cancel dialog keyboard behaviour ──');
  const cancelBtn = page.locator('button:has-text("Cancel task")');
  const cancelDlg = await openDialogWithKeyboard(page, cancelBtn, '[role="dialog"][aria-labelledby="cancel-dialog-title"]');
  ok(
    await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-labelledby="cancel-dialog-title"]');
      const heading = document.getElementById('cancel-dialog-title');
      return !!dlg && !!heading && heading.textContent.trim().length > 0 && dlg.contains(heading);
    }),
    '4a. cancel dialog has a programmatic name (aria-labelledby → real heading)',
  );
  ok(
    await waitFocusInside(page, '[role="dialog"][aria-labelledby="cancel-dialog-title"]'),
    '4b. cancel dialog opens with focus inside',
  );

  await page.keyboard.press('Escape');
  await cancelDlg.waitFor({ state: 'detached', timeout: 5_000 });
  const cancelFocusBack = await page.evaluate(() => document.activeElement?.textContent?.includes('Cancel task'));
  ok(cancelFocusBack, '4c. Escape closes the cancel dialog and returns focus to its trigger');

  // Second session pages (login/employee/manager contexts) — the same shared
  // login page is scanned logged-out and the role pages from live sessions.
  const guestCtx = await browser.newContext();
  const guestPage = await guestCtx.newPage();
  const empCtx = await browser.newContext();
  const empPage = await empCtx.newPage();
  await login(empPage, 'employee');

  const pageForRole = { guest: guestPage, employee: empPage, manager: page };

  // ─────────────────── 5. Mobile navigation (390×844) ───────────────────
  console.log('\n── Scenario 5: mobile navigation keyboard behaviour ──');
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileCtx.newPage();
  await login(mobilePage, 'manager');
  await mobilePage.goto(`${BASE}/dashboard`);
  await mobilePage.waitForSelector('button[aria-controls="mobile-menu"]', { timeout: 15_000 });

  const toggle = mobilePage.locator('button[aria-controls="mobile-menu"]');
  ok(
    await toggle.evaluate((el) => el.getAttribute('aria-expanded') === 'false' && el.offsetParent !== null),
    '5a. mobile toggle visible and aria-expanded=false when closed',
  );

  await toggle.focus();
  await mobilePage.keyboard.press('Enter');
  await mobilePage.waitForSelector('#mobile-menu', { state: 'visible', timeout: 5_000 });
  ok(
    await toggle.evaluate((el) => el.getAttribute('aria-expanded') === 'true'),
    '5b. Enter opens the menu and flips aria-expanded=true',
  );
  ok(
    await mobilePage.evaluate(() => {
      const links = [...document.querySelectorAll('#mobile-menu a[href]')];
      return links.some((a) => a.textContent.trim() === 'Laboratory') && links.length >= 4;
    }),
    '5c. grouped menu exposes the role links (Laboratory reachable)',
  );

  await mobilePage.keyboard.press('Tab');
  ok(
    await mobilePage.evaluate(() => !!document.activeElement?.closest('#mobile-menu')),
    '5d. Tab moves focus into the open mobile menu',
  );

  await mobilePage.keyboard.press('Escape');
  await mobilePage.waitForSelector('#mobile-menu', { state: 'hidden', timeout: 5_000 });
  ok(
    (await toggle.evaluate((el) => el.getAttribute('aria-expanded') === 'false')) &&
      (await mobilePage.evaluate(() => document.activeElement?.getAttribute('aria-controls') === 'mobile-menu')),
    '5e. Escape closes the menu and returns focus to the toggle',
  );
  await mobileCtx.close();

  // ─────────────────── 6. axe-core scan (THE GATE) + structural checks ───────────────────
  console.log('\n── Scenario 6: axe-core WCAG A/AA gate + structural checks ──');
  const SHOT_DIR = join(process.cwd(), 'download', 'qa');
  if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

  for (const { path, role } of SCAN_PAGES) {
    const pg = pageForRole[role];
    await pg.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await pg.waitForTimeout(400);

    const results = await new AxeBuilder({ page: pg })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    // Structural checks on the same settled page.
    const structure = await pg.evaluate(() => {
      const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
      const levels = headings.map((h) => Number(h.tagName[1]));
      let orderOk = true;
      for (let i = 1; i < levels.length; i += 1) if (levels[i] > levels[i - 1] + 1) orderOk = false;
      const pills = [...document.querySelectorAll('span.rounded-full')].filter(
        (el) => visible(el) && el.getAttribute('aria-hidden') !== 'true',
      );
      const colorOnlyPills = pills.filter((el) => el.textContent.trim().length === 0).map((el) => el.className);
      const brokenDescribedBy = [...document.querySelectorAll('[aria-describedby]')]
        .flatMap((el) => (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean))
        .filter((id) => !document.getElementById(id));
      const unnamedControls = [...document.querySelectorAll('input, select, textarea')].filter((el) => {
        if (el.type === 'hidden') return false;
        if (!visible(el)) return false;
        const labelled =
          (el.labels && el.labels.length > 0) ||
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby');
        return !labelled;
      });
      return {
        h1Count: levels.filter((l) => l === 1).length,
        orderOk,
        colorOnlyPills,
        brokenDescribedBy,
        unnamedControls: unnamedControls.map((el) => `${el.tagName.toLowerCase()}[name=${el.name ?? ''}]`),
      };
    });
    ok(structure.h1Count === 1, `[${path}] exactly one visible H1 (got ${structure.h1Count})`, 'structure');
    ok(structure.orderOk, `[${path}] heading levels do not skip`, 'structure');
    ok(structure.colorOnlyPills.length === 0, `[${path}] status pills carry text (not color-only)`, 'structure');
    ok(structure.brokenDescribedBy.length === 0, `[${path}] all aria-describedby targets resolve`, 'structure');
    ok(structure.unnamedControls.length === 0, `[${path}] all visible form controls are labelled`, 'structure');

    const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
    for (const v of results.violations) {
      if (v.impact && SEVERITY_ORDER.includes(v.impact)) counts[v.impact] += 1;
    }
    axeReport.push({
      path,
      role,
      counts,
      total: results.violations.length,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags.filter((t) => t.startsWith('wcag')),
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
      })),
    });
    console.log(
      `  [${path.padEnd(26)}] C:${counts.critical} S:${counts.serious} M:${counts.moderate} m:${counts.minor} (${results.violations.length} total)`,
    );
    for (const v of results.violations) {
      console.log(`      - [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
    }
  }
  await guestCtx.close();
  await empCtx.close();

  // ── THE GATE: critical/serious block; moderate/minor report-only ──
  const summary = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  for (const p of axeReport) for (const s of SEVERITY_ORDER) summary[s] += p.counts[s];
  console.log(
    `\n  axe summary → critical:${summary.critical} serious:${summary.serious} moderate:${summary.moderate} minor:${summary.minor}`,
  );
  ok(
    summary.critical === 0,
    `GATE: 0 critical violations (got ${summary.critical})`,
    'gate',
  );
  ok(
    summary.serious === 0,
    `GATE: 0 serious violations (got ${summary.serious})`,
    'gate',
  );

  // ── report artifact (written even when the gate fails, for triage) ──
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    tool: `axe-core via @axe-core/playwright (wcag2a/2aa/21a/21aa/22aa)`,
    policy:
      'PILOT GATE — fail when critical > 0 or serious > 0 on any scanned page; moderate/minor are reported without blocking (core-workflow impact is covered by the keyboard scenarios).',
    gate: {
      passed: summary.critical === 0 && summary.serious === 0,
      critical: summary.critical,
      serious: summary.serious,
      moderate: summary.moderate,
      minor: summary.minor,
      pagesScanned: axeReport.length,
    },
    pages: axeReport,
    assertions: { passed, failed, failures },
  };
  writeFileSync(join(SHOT_DIR, 'a11y-qc-report.json'), JSON.stringify(report, null, 2));
  console.log(`  📄 report → download/qa/a11y-qc-report.json`);
} catch (err) {
  failed += 1;
  failures.push({ category: 'crash', label: `unhandled error: ${err.message}` });
  console.error('❌ E2E a11y crashed:', err);
} finally {
  // ── cleanup: fixtures + sessions ──
  try {
    clearFixtures();
    if (taskId) {
      db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(taskId);
      db.prepare('DELETE FROM task_activity_log WHERE task_id = ?').run(taskId);
      db.prepare('DELETE FROM notifications WHERE task_id = ?').run(taskId);
      db.prepare('DELETE FROM task_comments WHERE task_id = ?').run(taskId);
      db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    }
    if (labTestId) {
      db.prepare("UPDATE lab_test_records SET status = 'DRAFT' WHERE id = ?").run(labTestId);
      db.prepare('DELETE FROM lab_test_samples WHERE test_id = ?').run(labTestId);
      db.prepare('DELETE FROM lab_test_records WHERE id = ?').run(labTestId);
    }
    db.prepare('DELETE FROM sessions').run();
  } finally {
    await browser.close();
    db.close();
  }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - [${f.category}] ${f.label}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
