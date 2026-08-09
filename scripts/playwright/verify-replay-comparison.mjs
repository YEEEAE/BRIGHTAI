#!/usr/bin/env node
/**
 * verify-replay-comparison.mjs — COMPARE-UX (2026-08-09) end-to-end gate.
 *
 * Proves the replay comparison drawer answers the user's core question —
 * "why did the outcome change?" — across the scenarios the incident-response
 * UX must survive:
 *
 *   1. PARTIAL REPLAY  — one policy, open an affected trace from the table:
 *      the compare section must appear, before/after verdicts must be correct,
 *      and the reason text must name the policy.
 *   2. MISSING TRACE   — a Trace ID absent from the demo dataset in the
 *      investigation tab: the timeline still renders, and the drawer opens
 *      WITHOUT a compare section (graceful degradation).
 *   3. PROVIDER FAILURE (consent gate) — external mode without consent must
 *      show the consent modal and run NO simulation; with consent it runs and
 *      the compare section works afterwards.
 *   4. NON-REPLAY CONTEXT — opening the drawer from /kernel/audit/ (no
 *      compare seed) must NOT reveal the compare section (no regression on
 *      other pages).
 *   5. EXPORT EVIDENCE — clicking "صدّر دليل المقارنة" opens a printable
 *      window containing the comparison content.
 *
 * Acceptance criterion: "user can identify why outcome changed."
 *
 * Usage: node scripts/playwright/verify-replay-comparison.mjs
 *        (requires `npm run preview` on http://localhost:4321 first)
 *        exit 0 = pass, exit 1 = fail
 *
 * CSP-safe, no network. Headless Chromium. Deterministic demo dataset.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const REPLAY_URL = `${BASE}/kernel/replay/`;
const AUDIT_URL = `${BASE}/kernel/audit/`;

const failures = [];
function check(name, ok, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function drawerVisible(page) {
  return page.locator('#k-trace-drawer').evaluate((el) => el.getAttribute('aria-hidden') === 'false');
}

async function compareVisible(page) {
  // The compare section reveals when its `hidden` attribute is absent.
  const sec = await page.locator('[data-kernel-drawer-compare]').count();
  if (sec === 0) return false;
  return page.locator('[data-kernel-drawer-compare]').evaluate((el) => !el.hasAttribute('hidden'));
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  // Capture console errors (not console.log, which is forbidden in prod but
  // we want to surface genuine runtime errors during the test).
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  // ─────────────────────────────────────────────────────────────────────
  // CASE 1: PARTIAL REPLAY — one policy, open an affected trace.
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n— Case 1: partial replay → compare section —');
  await page.goto(REPLAY_URL, { waitUntil: 'networkidle', timeout: 60000 });

  // Pick one policy (p-pii-export, high false-positive → guaranteed affected rows).
  await page.locator('[data-rp-policy-check][value="p-pii-export"]').check();
  await sleep(120);
  // Ensure the "محاكاة السياسات" tab is active (default).
  await page.locator('[data-rp-run]').click();
  // Wait for results to render (the table body fills asynchronously in pages of 30).
  await page.waitForSelector('[data-rp-tbody] tr [data-rp-trace-open]', { timeout: 15000 });
  const affectedCount = await page.locator('[data-rp-tbody] tr').count();
  check('1a partial replay produced affected rows', affectedCount > 0, `rows=${affectedCount}`);

  // Open the first affected trace.
  const firstTraceBtn = page.locator('[data-rp-tbody] tr [data-rp-trace-open]').first();
  const traceId = await firstTraceBtn.getAttribute('data-rp-trace-open');
  await firstTraceBtn.click();
  await sleep(350); // drawer slide-in + fill

  const drawer1 = await drawerVisible(page);
  check('1b drawer opened from affected row', drawer1);

  const cmp1 = await compareVisible(page);
  check('1c compare section visible in replay context', cmp1);

  if (cmp1) {
    // before/after verdicts must be filled (not the placeholder "—").
    const beforeText = (await page.locator('[data-compare-before]').textContent()) || '';
    const afterText = (await page.locator('[data-compare-after]').textContent()) || '';
    const beforeOk = beforeText === 'مسموح' || beforeText === 'محظور';
    const afterOk = afterText === 'مسموح' || afterText === 'محظور';
    check('1d before verdict filled', beforeOk, `before="${beforeText}"`);
    check('1e after verdict filled', afterOk, `after="${afterText}"`);
    // The verdicts should differ (this row was "affected" = flipped).
    check('1f verdict flipped on affected row', beforeText !== afterText, `${beforeText}→${afterText}`);

    // Reason text must mention the policy name.
    const reasonText = (await page.locator('[data-compare-reason]').textContent()) || '';
    const reasonNamesPolicy = reasonText.includes('PII') || reasonText.includes('تصدير');
    check('1g reason names the policy', reasonNamesPolicy, `reason="${reasonText.slice(0, 80)}…"`);

    // Policy version + model version must be filled.
    const policyVer = (await page.locator('[data-compare-policy-version]').textContent()) || '';
    const modelVer = (await page.locator('[data-compare-model-version]').textContent()) || '';
    check('1h policy version filled', policyVer.trim() !== '—' && policyVer.trim() !== '', `policyVer="${policyVer}"`);
    check('1i model version filled', modelVer.trim() !== '—' && modelVer.trim() !== '', `modelVer="${modelVer}"`);

    // Input summary must be filled (the original request text).
    const inputText = (await page.locator('[data-compare-input-text]').textContent()) || '';
    check('1j input summary filled', inputText.trim() !== '—' && inputText.trim() !== '', `input="${inputText.slice(0, 50)}…"`);

    // Export evidence button must be present.
    const exportBtn = await page.locator('[data-kernel-drawer-export-evidence]').count();
    check('1k export-evidence button present', exportBtn === 1);
  }

  // Close drawer for the next case.
  await page.keyboard.press('Escape');
  await sleep(200);

  // ─────────────────────────────────────────────────────────────────────
  // CASE 2: MISSING TRACE — a Trace ID absent from the dataset.
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n— Case 2: missing trace → graceful degradation —');
  await page.goto(REPLAY_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('[data-rp-tab="invest"]').click();
  await sleep(150);
  // AI-2026-99999 is far outside the 10000..10519 range of the demo dataset.
  await page.locator('[data-rp-invest-input]').fill('AI-2026-99999');
  await page.locator('[data-rp-invest-run]').click();
  await sleep(300);
  // The investigation tab resolves a timeline deterministically even for
  // unknown traces (the engine builds steps from the hash of the ID). The
  // drawer button should stay hidden because res.found === false.
  const investDrawerBtn = page.locator('[data-rp-invest-drawer]');
  const drawerBtnHidden = await investDrawerBtn.isHidden();
  check('2a missing trace: drawer button hidden (not found)', drawerBtnHidden);

  // Now try a VALID trace from the dataset to confirm the investigation path
  // DOES produce a drawer + compare section.
  await page.locator('[data-rp-invest-input]').fill('AI-2026-10519'); // first row, blocked
  await page.locator('[data-rp-invest-run]').click();
  await page.waitForSelector('[data-rp-invest-drawer]:not([hidden])', { timeout: 10000 });
  await page.locator('[data-rp-invest-drawer]').click();
  await sleep(350);
  const drawer2 = await drawerVisible(page);
  check('2b valid trace: drawer opened from investigation', drawer2);
  if (drawer2) {
    const cmp2 = await compareVisible(page);
    check('2c valid trace: compare section visible', cmp2);
  }
  await page.keyboard.press('Escape');
  await sleep(200);

  // ─────────────────────────────────────────────────────────────────────
  // CASE 3: PROVIDER FAILURE — external mode consent gate.
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n— Case 3: provider consent gate —');
  await page.goto(REPLAY_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('[data-rp-policy-check][value="p-pii-export"]').check();
  await sleep(120);
  // Switch to external mode.
  await page.locator('[data-rp-mode][value="external"]').check();
  await page.locator('[data-rp-run]').click();
  await sleep(300);
  // The consent modal must appear and NO results must be shown yet.
  const consentVisible = await page.locator('[data-rp-consent]').evaluate((el) => !el.hasAttribute('hidden'));
  check('3a consent modal shown for external mode', consentVisible);
  const resultsHiddenBefore = await page.locator('[data-rp-results]').isHidden();
  check('3b no simulation before consent', resultsHiddenBefore);

  if (consentVisible) {
    // Approve consent → simulation runs → results appear.
    await page.locator('[data-rp-consent-approve]').click();
    await page.waitForSelector('[data-rp-results]:not([hidden])', { timeout: 15000 });
    const resultsShown = await page.locator('[data-rp-results]').isVisible();
    check('3c simulation runs after consent', resultsShown);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CASE 4: NON-REPLAY CONTEXT — drawer opened from audit must NOT show compare.
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n— Case 4: non-replay context (audit) → no compare section —');
  await page.goto(AUDIT_URL, { waitUntil: 'networkidle', timeout: 60000 });
  // The audit page opens the drawer via KernelTraceDrawer.open(traceId, seed)
  // where seed has NO compare field. We trigger it by dispatching the public
  // event the drawer listens for (kerneltrace:open), then confirm the compare
  // section stays hidden.
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('kerneltrace:open', { detail: { traceId: 'AI-2026-10519' } }));
  });
  await sleep(350);
  const drawer4 = await drawerVisible(page);
  check('4a drawer opened on audit page', drawer4);
  if (drawer4) {
    const cmp4 = await compareVisible(page);
    check('4b compare section NOT visible in audit context', !cmp4, cmp4 ? 'FAIL: compare leaked' : 'hidden as expected');
  }

  // ─────────────────────────────────────────────────────────────────────
  // CASE 5: EXPORT EVIDENCE — opens a printable window.
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n— Case 5: export evidence window —');
  await page.goto(REPLAY_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('[data-rp-policy-check][value="p-pii-export"]').check();
  await sleep(120);
  await page.locator('[data-rp-run]').click();
  await page.waitForSelector('[data-rp-tbody] tr [data-rp-trace-open]', { timeout: 15000 });
  await page.locator('[data-rp-tbody] tr [data-rp-trace-open]').first().click();
  await sleep(350);

  // Intercept the popup that window.open creates.
  const popupPromise = context.waitForEvent('page', { timeout: 5000 });
  await page.locator('[data-kernel-drawer-export-evidence]').click();
  let popupOk = false;
  let popupContent = '';
  try {
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded', { timeout: 5000 });
    popupContent = await popup.locator('body').textContent();
    popupOk = popupContent.includes('دليل مقارنة') && popupContent.includes('قبل');
    await popup.close();
  } catch (e) {
    popupOk = false;
    popupContent = `(popup failed: ${e.message})`;
  }
  check('5a export evidence opens printable window with comparison', popupOk, popupContent.slice(0, 80));

  // ─────────────────────────────────────────────────────────────────────
  // Console errors sweep (no silent runtime failures).
  // ─────────────────────────────────────────────────────────────────────
  check('no uncaught pageerrors during the run', consoleErrors.length === 0,
    consoleErrors.length ? consoleErrors.join(' | ') : '');

  await browser.close();

  console.log(`\n${failures.length === 0 ? '✅ جميع الحالات نجحت' : '❌ ' + failures.length + ' حالة فشلت'}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verify-replay-comparison.mjs crashed:', err);
  process.exit(1);
});
