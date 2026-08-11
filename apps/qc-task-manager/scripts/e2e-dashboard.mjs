// E2E spec for the dashboard (/dashboard).
//
// Verifies the acceptance criteria against a LIVE server that shares the same
// SQLite database as QC_DB_PATH:
//   1. Numbers match the actual database — every rendered KPI, chart value and
//      table row is compared against values computed directly from SQL.
//   2. Employee role cannot access the page — 302 redirect + flash message.
//
// The script seeds a controlled dataset with dates relative to "now" (midday
// UTC so calendar days are stable in any timezone), then asserts the rendered
// dashboard against independently-computed SQL expectations.
//
// Usage: QC_DB_PATH=<app>/db/e2e_test.db node scripts/e2e-dashboard.mjs

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
const PASS = 'admin123';

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
function eq(actual, expected, label) {
  ok(JSON.stringify(actual) === JSON.stringify(expected), `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

// ── DB helpers ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const userByName = (name) => q('SELECT id, username, role FROM users WHERE username = ?', name);

// ── date helpers (local calendar days; midday UTC timestamps) ──
const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const now = new Date();
/** Local calendar date n days from today (negative = future). */
function isoDaysAgo(n) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return localIso(d);
}
/** Midday (UTC) n days ago — stable calendar day in any timezone. */
function dtDaysAgo(n) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
/** Same local-today semantics as the app (src/lib/dashboard.ts). */
function localToday() {
  return localIso(now);
}
/** Local Monday 00:00 of the week containing `d`. */
function mondayOf(d) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - diff);
  return c;
}
/**
 * Expected "completed per week" buckets — parse each completed_at as UTC (same
 * as the app's parseDbDate), map onto local Monday weeks, keep the last 8.
 */
function expectedLineBuckets(extraWhere = '') {
  const today = new Date();
  const thisMonday = mondayOf(today);
  const buckets = [];
  for (let i = 7; i >= 0; i--) {
    const m = new Date(thisMonday);
    m.setDate(m.getDate() - 7 * i);
    buckets.push({ weekStart: localIso(m), label: m.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), count: 0 });
  }
  const windowStart = buckets[0].weekStart;
  const rows = all(
    `SELECT completed_at FROM tasks t
     WHERE t.status = 'completed' AND t.completed_at IS NOT NULL
       AND date(t.completed_at, 'localtime') >= date(?) ${extraWhere}`,
    windowStart,
  );
  for (const r of rows) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(r.completed_at);
    if (!m) continue;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
    const key = localIso(mondayOf(d));
    const b = buckets.find((x) => x.weekStart === key);
    if (b) b.count += 1;
  }
  return buckets;
}

/** Expected KPI counts from raw SQL (independent of the app's queries). */
function expectedKpis(extraWhere = '', params = []) {
  const today = localToday();
  const row = q(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN t.status = 'not_started' THEN 1 ELSE 0 END), 0) AS not_started,
            COALESCE(SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress,
            COALESCE(SUM(CASE WHEN t.status = 'on_hold' THEN 1 ELSE 0 END), 0) AS on_hold,
            COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
            COALESCE(SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled,
            COALESCE(SUM(CASE WHEN t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END), 0) AS overdue
     FROM tasks t ${extraWhere}`,
    today,
    ...params,
  );
  return {
    total: Number(row.total),
    not_started: Number(row.not_started),
    in_progress: Number(row.in_progress),
    on_hold: Number(row.on_hold),
    completed: Number(row.completed),
    cancelled: Number(row.cancelled),
    overdue: Number(row.overdue),
  };
}

// ── browser helpers ──
const browser = await chromium.launch({ headless: true });
const SHOT_DIR = join(process.cwd(), 'download', 'qa');
if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

/** Read the rendered KPI values from the KPI card data attributes. */
async function readKpis(page) {
  const out = {};
  for (const key of ['total', 'not_started', 'in_progress', 'on_hold', 'completed', 'cancelled', 'overdue']) {
    out[key] = Number(await page.locator(`[data-kpi="${key}"] .text-3xl`).innerText());
  }
  return out;
}

/**
 * Read the trailing numeric value from each "<label> <count>" part of a chart
 * SVG's aria-label (the rendered output itself — stronger than parsing island
 * props). Returns null when the chart did not render.
 */
async function svgCounts(page, ariaPrefix) {
  const label = await page.locator(`svg[aria-label^="${ariaPrefix}"]`).first().getAttribute('aria-label');
  if (!label) return null;
  const parts = label.split(', ');
  return parts.map((p) => {
    const m = /(\d+)\s*$/.exec(p);
    return m ? Number(m[1]) : null;
  });
}

const mgr = userByName('manager');
const emp = userByName('employee');
const sup = userByName('supervisor');
const adm = userByName('admin');
ok(!!mgr && !!emp && !!sup && !!adm, 'seeded roles exist');

// ── seed a controlled dataset (dates relative to now) ──
const SEED = [
  // [title, status, priority, assignee|null, dueDaysAgo, createdDaysAgo, completedDaysAgo|null, completedBy|null]
  ['DASH overdue 3d', 'not_started', 'high', 'employee', 3, 20, null, null],
  ['DASH overdue 10d', 'in_progress', 'medium', 'employee', 10, 18, null, null],
  ['DASH on hold', 'on_hold', 'low', 'supervisor', -1, 15, null, null],
  ['DASH done 2d', 'completed', 'medium', 'employee', 5, 12, 2, 'employee'],
  ['DASH done 40d', 'completed', 'low', 'supervisor', null, 60, 40, 'supervisor'],
  ['DASH done 70d', 'completed', 'medium', 'manager', null, 80, 70, 'manager'],
  ['DASH no due', 'not_started', 'medium', 'manager', null, 10, null, null],
  ['DASH due today', 'in_progress', 'high', 'employee', 0, 5, null, null],
  ['DASH done 3d', 'completed', 'high', 'employee', -3, 4, 3, 'employee'],
  ['DASH done 10d', 'completed', 'medium', 'employee', null, 30, 10, 'admin'],
  // cancelled 5d ago, DUE 5d ago → counts in cancelled KPI/donut, NOT in overdue
  ['DASH cancelled', 'cancelled', 'medium', 'employee', 5, 25, null, null],
  // unassigned — must surface in the bar chart as an "Unassigned" bucket
  ['DASH unassigned', 'not_started', 'low', null, 8, 2, null, null],
];
const insertTask = db.prepare(
  `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, due_date, completed_at, completed_by, created_at)
   VALUES (@title, @description, @status, @priority, @progress, @created_by, @assigned_to, @due_date, @completed_at, @completed_by, @created_at)`,
);
db.transaction(() => {
  for (const [title, status, priority, assigneeName, dueDaysAgo, createdDaysAgo, completedDaysAgo, completedByName] of SEED) {
    const assignee = assigneeName ? userByName(assigneeName).id : null;
    insertTask.run({
      title,
      description: 'e2e dashboard fixture',
      status,
      priority,
      progress: status === 'completed' ? 100 : 0,
      created_by: mgr.id,
      assigned_to: assignee,
      due_date: dueDaysAgo === null ? null : isoDaysAgo(dueDaysAgo),
      completed_at: completedDaysAgo === null ? null : dtDaysAgo(completedDaysAgo),
      completed_by: completedByName ? userByName(completedByName).id : null,
      created_at: dtDaysAgo(createdDaysAgo),
    });
  }
})();

// Expected values must be computed AFTER seeding (the unfiltered baseline).
const expect = expectedKpis();

const ALL_WHERE = ''; // no filters → the whole dataset
const F_HIGH = "WHERE t.priority = 'high'";
const F_ASSIGNEE = `WHERE t.assigned_to = ?`;
const F_RANGE = `WHERE date(t.created_at, 'localtime') >= date(?) AND date(t.created_at, 'localtime') <= date(?)`;

console.log(`\n▶ E2E dashboard — ${BASE}\n`);

try {
  // ─────────────────── 1. Manager: no filters ───────────────────
  console.log('── Scenario 1: manager, unfiltered numbers match the database ──');
  const mgrPage = await browser.newPage();
  await login(mgrPage, 'manager');
  await mgrPage.goto(`${BASE}/dashboard`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });

  const kpis = await readKpis(mgrPage);
  eq(kpis, expect, '1. KPI cards match raw SQL counts');

  const donutCounts = await svgCounts(mgrPage, 'Tasks by status');
  ok(donutCounts !== null, '1. donut chart rendered');
  if (donutCounts) {
    eq(
      donutCounts,
      [expect.not_started, expect.in_progress, expect.on_hold, expect.completed, expect.cancelled],
      '1. donut counts = status distribution (incl. cancelled)',
    );
  }

  // Bar chart: one entry per active user (+ "Unassigned" bucket for tasks with
  // no assignee or an inactive assignee), sorted by total desc — mirrors
  // getPerEmployee so every rendered entry must match the database.
  const activeUsers = all('SELECT id, full_name FROM users WHERE is_active = 1');
  const assignCounts = all('SELECT t.assigned_to, COUNT(*) AS n FROM tasks t GROUP BY t.assigned_to');
  const byAssign = new Map(assignCounts.map((c) => [c.assigned_to, Number(c.n)]));
  const expectedBar = activeUsers.map((u) => ({
    user_id: u.id,
    full_name: u.full_name,
    total: byAssign.get(u.id) ?? 0,
  }));
  const activeIds = new Set(activeUsers.map((u) => u.id));
  let unassignedTotal = 0;
  for (const c of assignCounts) {
    if (c.assigned_to === null || !activeIds.has(c.assigned_to)) unassignedTotal += Number(c.n);
  }
  if (unassignedTotal > 0) expectedBar.push({ user_id: -1, full_name: 'Unassigned', total: unassignedTotal });
  expectedBar.sort((a, b) => b.total - a.total || a.full_name.localeCompare(b.full_name));
  const barLabel = await mgrPage.locator('svg[aria-label^="Tasks per employee"]').first().getAttribute('aria-label');
  ok(barLabel !== null, '1. bar chart rendered');
  if (barLabel) {
    // strip the chart's aria-label prefix before splitting into entries
    const barParts = barLabel.replace(/^Tasks per employee:\s*/, '').split(', ');
    eq(barParts.length, expectedBar.length, '1. bar chart has one entry per active user');
    if (barParts.length === expectedBar.length) {
      for (let i = 0; i < expectedBar.length; i++) {
        const m = /^(.*?) (\d+)$/.exec(barParts[i]);
        const name = m ? m[1] : null;
        const count = m ? Number(m[2]) : null;
        ok(name === expectedBar[i].full_name && count === expectedBar[i].total, `1. bar entry #${i + 1} = ${expectedBar[i].full_name} ${expectedBar[i].total} (got ${barParts[i]})`);
      }
    }
  }

  const lineCounts = await svgCounts(mgrPage, 'Tasks completed per week');
  ok(lineCounts !== null, '1. line chart rendered');
  if (lineCounts) {
    eq(lineCounts, expectedLineBuckets().map((w) => w.count), '1. line chart buckets match last-8-week completions');
  }

  // Overdue table
  const overdueRows = mgrPage.locator('section[aria-label="Overdue tasks"] tbody tr');
  const expectedOverdue = all(
    `SELECT t.id, t.title, t.due_date, u.full_name AS assignee
     FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.due_date IS NOT NULL AND date(t.due_date) < date(?) AND t.status NOT IN ('completed', 'cancelled')
     ORDER BY date(t.due_date) ASC, t.id ASC`,
    localToday(),
  );
  eq(await overdueRows.count(), expectedOverdue.length, '1. overdue table row count matches SQL');
  if (expectedOverdue.length > 0) {
    const firstTitle = await overdueRows.first().locator('td').first().innerText();
    ok(firstTitle === expectedOverdue[0].title, `1. most-overdue task first (${firstTitle})`);
    const daysBadge = await overdueRows.first().locator('td').nth(3).innerText();
    const expDays = Math.round((new Date(localToday()) - new Date(`${expectedOverdue[0].due_date}T00:00:00`)) / 86_400_000);
    ok(daysBadge.trim().startsWith(String(expDays)), `1. days-overdue badge (${daysBadge.trim()}) matches ${expDays}`);
  }

  // Recently completed
  const recentRows = mgrPage.locator('section[aria-label="Recently completed"] tbody tr');
  const expectedRecent = all(
    `SELECT t.id, t.title, u.full_name AS completed_by FROM tasks t
     LEFT JOIN users u ON u.id = t.completed_by
     WHERE t.status = 'completed' AND t.completed_at IS NOT NULL
     ORDER BY t.completed_at DESC, t.id DESC LIMIT 10`,
  );
  eq(await recentRows.count(), expectedRecent.length, '1. recently-completed row count matches SQL');
  if (expectedRecent.length > 0) {
    const t0 = await recentRows.first().locator('td').first().innerText();
    ok(t0 === expectedRecent[0].title, `1. most recent completion first (${t0})`);
    const by0 = await recentRows.first().locator('td').nth(2).innerText();
    ok(by0 === expectedRecent[0].completed_by, `1. completed_by name rendered (${by0})`);
  }

  // ─────────────────── 2. Filters ───────────────────
  console.log('\n── Scenario 2: filters scope every number ──');

  await mgrPage.goto(`${BASE}/dashboard?priority=high`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  eq(await readKpis(mgrPage), expectedKpis(F_HIGH), '2a. priority=high KPIs match SQL');

  await mgrPage.goto(`${BASE}/dashboard?assignee=${emp.id}`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  eq(await readKpis(mgrPage), expectedKpis(F_ASSIGNEE, [emp.id]), '2b. assignee=employee KPIs match SQL');

  const fromD = isoDaysAgo(12);
  const toD = isoDaysAgo(3);
  await mgrPage.goto(`${BASE}/dashboard?from=${fromD}&to=${toD}`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  eq(await readKpis(mgrPage), expectedKpis(F_RANGE, [fromD, toD]), '2c. date-range KPIs match SQL');

  await mgrPage.goto(`${BASE}/dashboard?priority=high&assignee=${emp.id}`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  eq(
    await readKpis(mgrPage),
    expectedKpis(`${F_HIGH} AND t.assigned_to = ?`, [emp.id]),
    '2d. combined filters KPIs match SQL',
  );

  await mgrPage.goto(`${BASE}/dashboard?from=not-a-date`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  eq(await readKpis(mgrPage), expect, '2e. invalid filter is dropped (KPIs unchanged)');
  ok(
    (await mgrPage.locator('text=Invalid "from" date').count()) === 1,
    '2e. invalid filter flashes an error message',
  );
  await mgrPage.goto(`${BASE}/dashboard`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  ok((await mgrPage.locator('text=Invalid "from" date').count()) === 0, '2e. flash is one-shot (gone on next load)');

  // ─────────────────── 3. Role gating ───────────────────
  console.log('\n── Scenario 3: employees have no dashboard (CORE BUSINESS RULE #1) ──');

  const empPage = await browser.newPage();
  await login(empPage, 'employee');
  const res = await empPage.request.get(`${BASE}/dashboard`, { maxRedirects: 0 });
  ok(res.status() === 302 && (res.headers()['location'] ?? '').startsWith('/employee'), '3. employee /dashboard → 302 to /employee');
  const setCookie = res.headers()['set-cookie'] ?? '';
  ok(setCookie.includes('qc_flash') && setCookie.includes('permission'), '3. redirect carries a flash cookie about permissions');

  await empPage.goto(`${BASE}/dashboard`);
  await empPage.waitForURL((u) => u.pathname === '/employee', { timeout: 10_000 });
  await empPage.waitForSelector('text=permission to access the dashboard', { timeout: 10_000 });
  ok(true, '3. employee sees the flash message after being bounced');

  const supPage = await browser.newPage();
  await login(supPage, 'supervisor');
  await supPage.goto(`${BASE}/dashboard`);
  await supPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  ok((await supPage.url()).includes('/dashboard'), '3. supervisor can view the dashboard');

  // ─────────────────── 4. Visual snapshots ───────────────────
  await mgrPage.setViewportSize({ width: 1440, height: 900 });
  await mgrPage.goto(`${BASE}/dashboard`);
  await mgrPage.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  await mgrPage.waitForTimeout(600);
  await mgrPage.screenshot({ path: join(SHOT_DIR, 'dashboard-desktop.png'), fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await login(mobile, 'manager');
  await mobile.goto(`${BASE}/dashboard`);
  await mobile.waitForSelector('[data-kpi="total"]', { timeout: 15_000 });
  await mobile.waitForTimeout(600);
  await mobile.screenshot({ path: join(SHOT_DIR, 'dashboard-mobile.png'), fullPage: true });
  console.log('   📸 screenshots → download/qa/dashboard-{desktop,mobile}.png');
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: remove fixture rows + sessions, keep seeded users ──
  db.prepare(`DELETE FROM tasks WHERE title LIKE 'DASH %'`).run();
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
