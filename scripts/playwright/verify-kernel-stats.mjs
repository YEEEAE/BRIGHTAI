/**
 * verify-kernel-stats.mjs — Browser smoke test for /kernel/stats/ (M24 + M28-Phase2).
 *
 * Verifies:
 *  1. Page loads with no console errors (CSP-safe, module scripts run).
 *  2. KPI cards render (6 cards).
 *  3. Store-runs panel (#ks-store-runs) appears and reads from KernelEvalStore
 *     (Prompt 25: every Eval Run appears in Stats).
 *  4. Empty state renders when no runs exist.
 *  5. With a seeded run, the table row + "افتح Trace" button render.
 *  6. Clicking "افتح Trace" opens the SHARED #k-trace-drawer.
 *
 * Run: node scripts/playwright/verify-kernel-stats.mjs
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/stats/`;

const STORE_KEY = 'brightai-kernel-eval';

// A minimal-but-valid run (matching kernel-eval-store's state shape).
const seededRun = {
  id: 'EVAL-2026-00999',
  name: 'تقييم تجريبي للتحقق',
  status: 'complete',
  published: true,
  version: 1,
  parentRunId: undefined,
  traces: [{ id: 'AI-TRACE-DEMO-1' }],
  setup: { seed: 'brightai-demo', model: { name: 'jais' } },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
const pageErrors = [];
const harmless = [
  "frame-ancestors' is ignored when delivered via a <meta>",
  "'report-uri' is ignored when delivered via a <meta>",
  'X-Frame-Options may only be set via an HTTP header',
];
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const text = msg.text();
    if (!harmless.some((h) => text.includes(h))) consoleErrors.push(text);
  }
});
page.on('pageerror', (err) => pageErrors.push(err.message));

let failures = 0;
function ok(name) { console.log(`  ✓ ${name}`); }
function fail(name, detail) {
  failures += 1;
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

// ---- Phase A: seeded run — verify table row + drawer open.
console.log(`Navigating to ${URL} (seeded run)`);
await page.addInitScript(({ key, run }) => {
  const state = { runs: [run], datasets: [], certificates: [] };
  try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
}, { key: STORE_KEY, run: seededRun });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

// Dismiss overlays.
try {
  const cookieBtn = page.locator('#cookie-accept');
  if (await cookieBtn.count()) await cookieBtn.click({ force: true, timeout: 3000 });
} catch { /* no cookie bar */ }

// 1. Console errors
ok(consoleErrors.length === 0 ? 'no console errors' : `console errors (${consoleErrors.length}): ${consoleErrors.join(' | ')}`);
if (consoleErrors.length) fail('console errors', consoleErrors.join(' | '));
ok(pageErrors.length === 0 ? 'no page errors' : `page errors (${pageErrors.length}): ${pageErrors.join(' | ')}`);
if (pageErrors.length) fail('page errors', pageErrors.join(' | '));

// 2. KPI cards
const kpiCount = await page.evaluate(() => document.querySelectorAll('#ks-kpis .ks-kpi').length);
ok(kpiCount === 6 ? `KPI cards render: ${kpiCount}` : `KPI cards: ${kpiCount} (expected 6)`);
if (kpiCount !== 6) fail('KPI cards', `count=${kpiCount}`);

// 3. Store panel present + reads from store
const storePanel = await page.evaluate(() => {
  const el = document.getElementById('ks-store-runs');
  return el ? el.textContent.trim().slice(0, 200) : null;
});
ok(storePanel ? `store panel rendered: ${storePanel.slice(0, 60)}` : 'store panel missing');
if (!storePanel) fail('store panel', 'null');

const rowCount = await page.evaluate(() => document.querySelectorAll('.ks-store-table tbody tr').length);
ok(rowCount === 1 ? `seeded run row rendered (${rowCount})` : `seeded run rows: ${rowCount} (expected 1)`);
if (rowCount !== 1) fail('store table', `rows=${rowCount}`);

const summaryTotal = await page.evaluate(() => {
  const el = document.querySelector('.ks-store-summary .ks-store-metric__value');
  return el ? el.textContent.trim() : null;
});
ok(summaryTotal === '1' ? `summary total = 1` : `summary total = ${summaryTotal}`);
if (summaryTotal !== '1') fail('summary total', summaryTotal);

// 4. Click "افتح Trace" → shared drawer opens
await page.evaluate(() => document.querySelector('.ks-store-open')?.click());
await page.waitForTimeout(900);
const drawerOpen = await page.evaluate(() => {
  const el = document.querySelector('#k-trace-drawer');
  if (!el) return false;
  return el.getAttribute('aria-hidden') === 'false';
});
ok(drawerOpen ? 'shared drawer opened from store run' : 'shared drawer did not open');
if (!drawerOpen) fail('drawer open', 'not open');

const traceIdShown = await page.evaluate(() => {
  const el = document.querySelector('#k-trace-drawer [data-kernel-trace-id]');
  return el ? el.textContent.trim() : null;
});
ok(traceIdShown ? `drawer traceId: ${traceIdShown}` : 'drawer traceId missing');
if (!traceIdShown) fail('drawer traceId', 'null');

await page.screenshot({ path: '/var/folders/md/ply6x_qd1k3gzt5vvg5ksnrr0000gn/T/opencode/kernel-stats-seeded.png' });

// ---- Phase B: empty store — verify empty state.
console.log('Navigating to /kernel/stats/ (empty store)');
const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page2.on('console', (msg) => {
  if (msg.type() === 'error') {
    const text = msg.text();
    if (!harmless.some((h) => text.includes(h))) consoleErrors.push(text);
  }
});
await page2.addInitScript(({ key }) => {
  try { localStorage.setItem(key, JSON.stringify({ runs: [], datasets: [], certificates: [] })); } catch (e) {}
}, { key: STORE_KEY });

await page2.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page2.waitForTimeout(2000);

const emptyText = await page2.evaluate(() => {
  const el = document.querySelector('#ks-store-runs .ks-store-empty');
  return el ? el.textContent.trim().slice(0, 120) : null;
});
ok(emptyText ? `empty state: ${emptyText.slice(0, 50)}` : 'empty state missing');
if (!emptyText) fail('empty state', 'null');

await page2.close();

await browser.close();

if (failures > 0) {
  console.log(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\n✅ kernel-stats browser smoke: all checks passed');
process.exit(0);
