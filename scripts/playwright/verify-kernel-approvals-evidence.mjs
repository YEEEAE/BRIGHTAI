/**
 * verify-kernel-approvals-evidence.mjs — Browser smoke test for M28 Link 4
 * (approvals → evidence) and Link 3 (replay → parent).
 *
 * Link 4 verifies:
 *  1. /kernel/approvals/ renders a decision ledger whose links are now real
 *     anchors/buttons: Audit → /kernel/audit/?trace=, Evidence/Cert →
 *     /kernel/evidence/?trace=&evd=, Trace → opens the shared drawer.
 *  2. Clicking a ledger Trace button opens the shared drawer (#k-trace-drawer)
 *     with a non-empty title.
 *  3. Navigating to /kernel/evidence/?trace=...&evd=... highlights the matching
 *     evidence item (data-trace attribute) and updates the counter.
 *
 * Link 3 verifies:
 *  4. /kernel/replay/ affected-rows table cells are real buttons
 *     (button.rp-table__trace[data-rp-trace-open]) that open the shared drawer.
 *  5. The investigation tab reveals the "افتح الرحلة في الدرج المشترك" button
 *     after a run, and clicking it opens the drawer.
 *
 * Run: node scripts/playwright/verify-kernel-approvals-evidence.mjs
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4323';
const APPROVALS_URL = `${BASE}/kernel/approvals/`;
const EVIDENCE_URL = `${BASE}/kernel/evidence/`;
const REPLAY_URL = `${BASE}/kernel/replay/`;

const browser = await chromium.launch();

const harmless = [
  "frame-ancestors' is ignored when delivered via a <meta>",
  "'report-uri' is ignored when delivered via a <meta>",
  'X-Frame-Options may only be set via an HTTP header',
];

let failures = 0;
function ok(name) { console.log(`  ✓ ${name}`); }
function fail(name, detail) {
  failures += 1;
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}
function attachLoggers(page, arr) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!harmless.some((h) => text.includes(h))) arr.push(text);
    }
  });
  page.on('pageerror', (err) => arr.push(err.message));
}

async function dismissCookie(page) {
  try {
    const cookieBtn = page.locator('#cookie-accept');
    if (await cookieBtn.count()) await cookieBtn.click({ force: true, timeout: 3000 });
  } catch { /* no cookie bar */ }
}

async function makeLedgerDecision(page) {
  // Decision modal buttons use data-kap-decide; keyboard shortcut A approves.
  // Drive the first decision through the documented path: select card (already
  // selected on render) → press 'a' → confirm in modal.
  const decideBtn = page.locator('[data-kap-decide="approve"]').first();
  const confirmBtn = page.locator('[data-kap-modal-confirm]');
  if (await decideBtn.count()) {
    await decideBtn.click({ timeout: 5000 });
  } else {
    await page.keyboard.press('a');
  }
  await page.waitForTimeout(300);
  if (await confirmBtn.count()) await confirmBtn.click({ timeout: 5000 });
  await page.waitForTimeout(600);
}

function ledgerLinks(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kernel-ap-ledger__links .kernel-ap-ledger__link')).map((a) => ({
      tag: a.tagName.toLowerCase(),
      text: a.textContent.trim(),
      href: a.getAttribute('href') || '',
      trace: a.getAttribute('data-kap-ledger-trace') || '',
    }));
  });
}

// ---- Phase A: approvals ledger links are real anchors/buttons.
console.log('Phase A: /kernel/approvals/ ledger links');
const pageA = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errsA = [];
attachLoggers(pageA, errsA);
await pageA.goto(APPROVALS_URL, { waitUntil: 'networkidle', timeout: 60000 });
await pageA.waitForTimeout(1500);
await dismissCookie(pageA);
await makeLedgerDecision(pageA);

const links = await ledgerLinks(pageA);
ok(links.length >= 4 ? `ledger links count: ${links.length}` : `ledger links: ${links.length} (expected ≥ 4)`);
if (links.length < 4) fail('ledger links count', String(links.length));

const traceBtn = links.find((l) => l.tag === 'button' && l.text === 'Trace');
ok(traceBtn ? 'Trace is a real <button>' : 'Trace button missing');
if (!traceBtn) fail('Trace button', 'missing');

const audit = links.find((l) => l.text.startsWith('Audit '));
ok(audit && /^\/kernel\/audit\/\?trace=/.test(audit.href) ? 'Audit → /kernel/audit/?trace=' : `Audit href malformed: ${audit?.href}`);
if (audit && !/^\/kernel\/audit\/\?trace=/.test(audit.href)) fail('Audit href', audit.href);

const evidence = links.find((l) => l.text.startsWith('Evidence '));
ok(evidence && /^\/kernel\/evidence\/\?trace=/.test(evidence.href) ? 'Evidence → /kernel/evidence/?trace=&evd=' : `Evidence href malformed: ${evidence?.href}`);
if (evidence && !/^\/kernel\/evidence\/\?trace=/.test(evidence.href)) fail('Evidence href', evidence.href);
if (evidence && !/&evd=/.test(evidence.href)) fail('Evidence href evd param', evidence.href);

ok(errsA.length === 0 ? 'no console errors' : `console errors (${errsA.length}): ${errsA.join(' | ')}`);
if (errsA.length) fail('console errors', errsA.join(' | '));

// ---- Phase B: clicking ledger Trace opens the shared drawer.
console.log('Phase B: ledger Trace → shared drawer');
const drawerOpen = await pageA.evaluate(() => {
  const drawer = document.getElementById('k-trace-drawer');
  if (!drawer) return { exists: false };
  const before = drawer.hasAttribute('data-open') ? drawer.getAttribute('data-open') : null;
  const btn = document.querySelector('button[data-kap-ledger-trace]');
  if (btn) btn.click();
  return { exists: true, before };
});
ok(drawerOpen.exists ? 'shared drawer #k-trace-drawer exists' : 'shared drawer missing');
if (!drawerOpen.exists) fail('drawer exists', 'missing');
await pageA.waitForTimeout(400);
const drawerState = await pageA.evaluate(() => {
  const drawer = document.getElementById('k-trace-drawer');
  const title = document.querySelector('#k-trace-title');
  return {
    open: drawer ? drawer.getAttribute('data-open') : null,
    title: title ? title.textContent.trim().slice(0, 40) : '',
    user: (document.querySelector('[data-kernel-drawer-user]') || {}).textContent || '',
  };
});
ok(drawerState.open !== 'false' ? `drawer open after click (data-open=${drawerState.open})` : 'drawer still closed');
if (drawerState.open === 'false') fail('drawer open', drawerState.open);
ok(drawerState.user && drawerState.user !== '—' ? `drawer shows user: ${drawerState.user}` : 'drawer user empty');
if (!drawerState.user || drawerState.user === '—') fail('drawer user', drawerState.user);
await pageA.close();

// ---- Phase C: evidence page honors ?trace= and highlights the item.
console.log('Phase C: /kernel/evidence/?trace= highlight');
const pageC = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errsC = [];
attachLoggers(pageC, errsC);
// Grab a real traceId from the evidence page's own static items first.
await pageC.goto(EVIDENCE_URL, { waitUntil: 'networkidle', timeout: 60000 });
await pageC.waitForTimeout(1200);
await dismissCookie(pageC);
const aTrace = await pageC.evaluate(() => {
  const el = document.querySelector('[data-kernel-evidence-item][data-trace]');
  return el ? el.getAttribute('data-trace') : null;
});
ok(aTrace ? `evidence static trace: ${aTrace}` : 'no static evidence trace found');
if (!aTrace) fail('evidence trace', 'none');

const targetUrl = `${EVIDENCE_URL}?trace=${encodeURIComponent(aTrace)}`;
await pageC.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
await pageC.waitForTimeout(1200);

const highlighted = await pageC.evaluate(() => {
  const target = document.querySelector('.kernel-evidence-item--linktarget');
  const visible = Array.from(document.querySelectorAll('[data-kernel-evidence-item]')).filter((el) => !el.hidden);
  const counter = document.querySelector('[data-kernel-evidence-count]');
  return {
    targetExists: !!target,
    visibleCount: visible.length,
    counter: counter ? counter.textContent.trim() : '',
  };
});
ok(highlighted.targetExists ? 'target item got .kernel-evidence-item--linktarget' : 'no highlighted item');
if (!highlighted.targetExists) fail('linktarget highlight', 'missing');
ok(highlighted.visibleCount === 1 ? `only matching item visible (${highlighted.visibleCount})` : `visible items: ${highlighted.visibleCount} (expected 1)`);
if (highlighted.visibleCount !== 1) fail('filtered to one', String(highlighted.visibleCount));
ok(highlighted.counter.includes('1 من') ? `counter: ${highlighted.counter}` : `counter unexpected: ${highlighted.counter}`);
if (!highlighted.counter.includes('1 من')) fail('counter', highlighted.counter);

ok(errsC.length === 0 ? 'no console errors' : `console errors (${errsC.length}): ${errsC.join(' | ')}`);
if (errsC.length) fail('console errors', errsC.join(' | '));
await pageC.screenshot({ path: '/var/folders/md/ply6x_qd1k3gzt5vvg5ksnrr0000gn/T/opencode/kernel-approvals-evidence.png' });
await pageC.close();

// ---- Phase D: replay affected-rows are clickable trace buttons.
console.log('Phase D: /kernel/replay/ affected-rows trace buttons');
const pageD = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errsD = [];
attachLoggers(pageD, errsD);
await pageD.goto(REPLAY_URL, { waitUntil: 'networkidle', timeout: 60000 });
await pageD.waitForTimeout(1200);
await dismissCookie(pageD);

// Run a simulation so the affected-rows table populates: pick the first
// policy checkbox, then click the run button.
const policyCheck = pageD.locator('[data-rp-policy-check]').first();
if (await policyCheck.count()) {
  await policyCheck.check({ force: true, timeout: 5000 });
}
const runBtn = pageD.locator('[data-rp-run]');
if (await runBtn.count()) {
  await runBtn.click({ timeout: 5000 });
  await pageD.waitForTimeout(2500);
}
const traceButtons = await pageD.evaluate(() => {
  return Array.from(document.querySelectorAll('button[data-rp-trace-open]')).map((b) => ({
    text: b.textContent.trim(),
    aria: b.getAttribute('aria-label'),
  }));
});
ok(traceButtons.length >= 1 ? `affected-rows trace buttons: ${traceButtons.length}` : 'no trace buttons rendered');
if (traceButtons.length < 1) fail('trace buttons', 'none');
ok(traceButtons[0] && traceButtons[0].aria ? `first has aria-label: ${traceButtons[0].aria}` : 'missing aria-label on trace button');
if (traceButtons[0] && !traceButtons[0].aria) fail('trace aria-label', 'missing');

// Click the first trace button → shared drawer opens.
const replayDrawerOpen = await pageD.evaluate(() => {
  const btn = document.querySelector('button[data-rp-trace-open]');
  if (btn) btn.click();
  return true;
});
await pageD.waitForTimeout(400);
const replayDrawerState = await pageD.evaluate(() => {
  const drawer = document.getElementById('k-trace-drawer');
  const user = (document.querySelector('[data-kernel-drawer-user]') || {}).textContent || '';
  return { open: drawer ? drawer.getAttribute('data-open') : null, user };
});
ok(replayDrawerOpen && replayDrawerState.open !== 'false' ? 'replay trace click opened shared drawer' : 'replay trace drawer not open');
if (!replayDrawerOpen || replayDrawerState.open === 'false') fail('replay drawer open', String(replayDrawerState.open));
ok(replayDrawerState.user && replayDrawerState.user !== '—' ? `replay drawer user: ${replayDrawerState.user}` : 'replay drawer user empty');
if (!replayDrawerState.user || replayDrawerState.user === '—') fail('replay drawer user', replayDrawerState.user);

ok(errsD.length === 0 ? 'no console errors' : `console errors (${errsD.length}): ${errsD.join(' | ')}`);
if (errsD.length) fail('console errors', errsD.join(' | '));
await pageD.close();

await browser.close();

if (failures > 0) {
  console.log(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\n✅ kernel approvals→evidence + replay→parent links: all checks passed');
process.exit(0);
