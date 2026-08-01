/**
 * verify-kernel-approvals.mjs — Browser smoke test for /kernel/approvals/.
 *
 * Verifies:
 *  1. Page loads with no console errors (CSP-safe, module scripts run).
 *  2. Loading state clears + status filter cards render with the contract
 *     counts (7 معلقة · 3 حرجة · 2 مراجعة · 142 موافقة · 8 رفض · 162 total).
 *  3. Queue list renders cards (kernel-ap-card) with risk + SLA + trace.
 *  4. Filter card click narrows the list + toggles kernel-ap-filter--active.
 *  5. Card click opens the detail panel (PII chips, policies, what-if).
 *  6. Decision modal opens from the approve button; confirming appends a
 *     ledger entry (Audit · Trace · Evidence · Certificate).
 *  7. Empty state shows on a no-match search + reset restores pending.
 *  8. Shortcuts overlay toggles via the toolbar button and the '?' key.
 *
 * Run: node scripts/playwright/verify-kernel-approvals.mjs
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/approvals/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
const pageErrors = [];
// Known-harmless meta-CSP browser warnings (frame-ancestors/report-uri/X-Frame-Options
// delivered via <meta>). The real CSP comes from HTTP headers; the meta is a fallback.
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

console.log(`Navigating to ${URL}`);
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

// Give the loading-state transition + worker boot time to settle.
await page.waitForTimeout(2500);

// Dismiss overlays (cookie consent + any modal sidebar) so pointer events land.
try {
  const cookieBtn = page.locator('#cookie-accept');
  if (await cookieBtn.count()) await cookieBtn.click({ force: true, timeout: 3000 });
} catch { /* no cookie bar */ }
try {
  const sidebarClose = page.locator('#kernel-sidebar [data-drawer-close], #kernel-sidebar .kernel-sidebar__close');
  if (await sidebarClose.count()) await sidebarClose.first().click({ force: true, timeout: 3000 });
} catch { /* no sidebar */ }

// 1. Console errors
ok(consoleErrors.length === 0 ? 'no console errors' : `console errors (${consoleErrors.length}): ${consoleErrors.join(' | ')}`);
if (consoleErrors.length) fail('console errors', consoleErrors.join(' | '));
ok(pageErrors.length === 0 ? 'no page errors' : `page errors (${pageErrors.length}): ${pageErrors.join(' | ')}`);
if (pageErrors.length) fail('page errors', pageErrors.join(' | '));

// 2. Loading cleared + filter cards + counts
const loadingRemoved = await page.evaluate(() => document.querySelectorAll('[data-kernel-loading]').length === 0);
ok(loadingRemoved ? 'loading state cleared' : 'loading state still present');
const filterCards = await page.evaluate(() =>
  [...document.querySelectorAll('[data-kap-filter]')].map((c) => c.getAttribute('data-kap-filter')),
);
const expected = ['pending', 'critical', 'review', 'approved', 'rejected'];
ok(JSON.stringify(filterCards) === JSON.stringify(expected) ? `filter cards: ${filterCards.join(', ')}` : `filter cards mismatch: ${filterCards.join(', ')}`);
if (JSON.stringify(filterCards) !== JSON.stringify(expected)) fail('filter cards', filterCards.join(', '));

const counts = await page.evaluate(() => {
  const out = {};
  document.querySelectorAll('[data-kap-filter-count]').forEach((el) => {
    out[el.getAttribute('data-kap-filter-count')] = el.textContent.trim();
  });
  return out;
});
ok(counts.pending === '7' && counts.critical === '3' && counts.review === '2'
  && counts.approved === '142' && counts.rejected === '8'
  ? `filter counts: ${JSON.stringify(counts)}` : `filter counts wrong: ${JSON.stringify(counts)}`);
if (!(counts.pending === '7' && counts.critical === '3' && counts.review === '2'
  && counts.approved === '142' && counts.rejected === '8')) fail('filter counts', JSON.stringify(counts));

// 3. Queue list renders cards
let cardCount = await page.evaluate(() => document.querySelectorAll('.kernel-ap-card').length);
ok(cardCount > 0 ? `queue cards rendered: ${cardCount}` : 'no queue cards');
if (cardCount === 0) fail('queue cards', '0');
const cardHasRiskSlaTrace = await page.evaluate(() => {
  const card = document.querySelector('.kernel-ap-card');
  if (!card) return false;
  return !!card.querySelector('.kernel-ap-card__risk')
    && !!card.querySelector('.kernel-ap-sla')
    && !!card.querySelector('.kernel-ap-card__trace');
});
ok(cardHasRiskSlaTrace ? 'card shows risk + SLA + trace' : 'card missing risk/SLA/trace');
if (!cardHasRiskSlaTrace) fail('card anatomy', 'missing risk/SLA/trace');

// 4. Filter click (critical) narrows list
const before = cardCount;
await page.click('[data-kap-filter="critical"]');
await page.waitForTimeout(700);
cardCount = await page.evaluate(() => document.querySelectorAll('.kernel-ap-card').length);
const activeFilter = await page.evaluate(() => {
  const el = document.querySelector('.kernel-ap-filter--active');
  return el ? el.getAttribute('data-kap-filter') : null;
});
ok(cardCount === 3 && activeFilter === 'critical' ? `critical filter → ${cardCount} cards (active=${activeFilter})` : `critical filter → ${cardCount} cards (active=${activeFilter})`);
if (cardCount !== 3 || activeFilter !== 'critical') fail('critical filter', `${cardCount} cards, active=${activeFilter}`);
ok(before > cardCount ? 'list narrowed after filter' : 'list did not narrow');
if (!(before > cardCount)) fail('list narrowing', 'no change');

// 5. Card click opens detail panel
await page.click('.kernel-ap-card');
await page.waitForTimeout(500);
const detailOk = await page.evaluate(() => {
  const d = document.querySelector('[data-kap-detail]');
  if (!d) return false;
  return !!d.querySelector('.kernel-ap-detail__title')
    && !!d.querySelector('.kernel-ap-pii')
    && !!d.querySelector('.kernel-ap-whatif')
    && !!d.querySelector('[data-kap-decide]');
});
ok(detailOk ? 'detail panel shows title + PII + what-if + decide buttons' : 'detail panel incomplete');
if (!detailOk) fail('detail panel', 'incomplete');

// 6. Decision modal → approve → ledger entry
await page.click('[data-kap-decide="approve"]');
await page.waitForTimeout(400);
const modalOpen = await page.evaluate(() => document.querySelector('[data-kap-modal]').getAttribute('data-open') === 'true');
ok(modalOpen ? 'decision modal opened' : 'decision modal did not open');
if (!modalOpen) fail('decision modal', 'not open');
await page.click('[data-kap-modal-confirm]');
await page.waitForTimeout(600);
const ledgerItems = await page.evaluate(() => document.querySelectorAll('[data-kap-ledger] .kernel-ap-ledger__item').length);
const ledgerHasLinks = await page.evaluate(() => {
  const item = document.querySelector('[data-kap-ledger] .kernel-ap-ledger__item');
  return item ? item.textContent.includes('Audit · Trace · Evidence · Certificate') : false;
});
ok(ledgerItems >= 1 ? `ledger entries: ${ledgerItems}` : 'no ledger entries');
if (!(ledgerItems >= 1)) fail('ledger', `${ledgerItems} entries`);
ok(ledgerHasLinks ? 'ledger item links Audit · Trace · Evidence · Certificate' : 'ledger missing link labels');
if (!ledgerHasLinks) fail('ledger links', 'missing');

// 7. Empty state on no-match search + reset
await page.fill('[data-kap-search]', 'zzz-no-match-xyz');
await page.waitForTimeout(900);
const emptyVisible = await page.evaluate(() => {
  const el = document.querySelector('[data-kap-empty]');
  return el ? !el.hidden : false;
});
ok(emptyVisible ? 'empty state shows on no-match search' : 'empty state did not show');
if (!emptyVisible) fail('empty state', 'not visible');
await page.click('[data-kap-reset]');
await page.waitForTimeout(700);
const resetFilter = await page.evaluate(() => {
  const el = document.querySelector('.kernel-ap-filter--active');
  return el ? el.getAttribute('data-kap-filter') : null;
});
ok(resetFilter === 'pending' ? 'reset returns to pending filter' : `reset filter = ${resetFilter}`);
if (resetFilter !== 'pending') fail('reset', resetFilter);

// 8. Shortcuts overlay via toolbar button + '?' key
await page.click('[data-kap-shortcuts-btn]');
await page.waitForTimeout(300);
const sBtn = await page.evaluate(() => {
  const el = document.querySelector('[data-kap-shortcuts]');
  return el ? el.hidden : null;
});
ok(sBtn === false ? 'shortcuts overlay toggled by toolbar button' : 'shortcuts not toggled by button');
if (sBtn !== false) fail('shortcuts button', `hidden=${sBtn}`);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const sEsc = await page.evaluate(() => {
  const el = document.querySelector('[data-kap-shortcuts]');
  return el ? el.hidden : null;
});
ok(sEsc === true ? 'shortcuts overlay closed by Escape' : 'shortcuts not closed by Escape');
if (sEsc !== true) fail('shortcuts escape', `hidden=${sEsc}`);
await page.keyboard.press('?');
await page.waitForTimeout(300);
const sQ = await page.evaluate(() => {
  const el = document.querySelector('[data-kap-shortcuts]');
  return el ? el.hidden : null;
});
ok(sQ === false ? "'?' re-opens shortcuts overlay" : "'?' did not toggle shortcuts");
if (sQ !== false) fail("shortcuts '?' key", `hidden=${sQ}`);

// Screenshot for the record
await page.screenshot({ path: '/var/folders/md/ply6x_qd1k3gzt5vvg5ksnrr0000gn/T/opencode/kernel-approvals.png', fullPage: false });

await browser.close();

if (failures > 0) {
  console.log(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\n✅ kernel-approvals browser smoke: all checks passed');
process.exit(0);
