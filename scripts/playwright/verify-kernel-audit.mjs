/**
 * verify-kernel-audit.mjs — Browser smoke test for /kernel/audit/.
 *
 * Verifies (AUDIT-TRUST 2026-08-09 + original smoke set):
 *  1. Page loads with no console errors (CSP-safe, module scripts run).
 *  2. Virtual table renders rows (viewport fills with data-kernel-loading removed).
 *  3. Filter by status works (FIXED selector: data-kernel-audit-filter, not data-ka-filter).
 *  4. Search filters rows.
 *  5. Verifier panel computes a valid FNV-1a chain.
 *  6. Tamper button surfaces a violation.
 *  7. Row click opens the drawer.
 *  8. NEW — Copy: hash copy button flashes data-copied.
 *  9. NEW — Export: CSV + JSON downloads carry provenance (source + exportedAt).
 * 10. NEW — No-results empty state shows on a no-match search.
 * 11. NEW — Focus return: closing the drawer restores focus to the opener.
 * 12. NEW — Filter URL state: changing a filter writes status=… to the URL.
 * 13. NEW — Drawer provenance: the inline source band shows "بيانات تجريبية".
 *
 * Run: node scripts/playwright/verify-kernel-audit.mjs
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/audit/`;

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

// 2. Loading state cleared + rows rendered
const loadingRemoved = await page.evaluate(() => document.querySelectorAll('[data-kernel-loading]').length === 0);
ok(loadingRemoved ? 'loading state cleared' : 'loading state still present');
const rowCount = await page.evaluate(() => document.querySelectorAll('.kernel-audit-vrow').length);
ok(rowCount > 0 ? `virtual rows rendered: ${rowCount}` : 'no virtual rows');
if (rowCount === 0) fail('virtual rows', 'rowCount = 0');

// 3. Total counter shows full contract count
const totalShown = await page.evaluate(() => {
  const el = document.querySelector('[data-ka-scrollpos]');
  return el ? el.textContent.trim() : null;
});
ok(totalShown ? `counter shows: ${totalShown}` : 'no counter');
if (!totalShown) fail('counter', 'null');

// 4. Status filter (FIXED selector). The engine binds [data-kernel-audit-filter],
//    not the old [data-ka-filter] this script used to look for.
const statusSelect = await page.evaluate(() => !!document.querySelector('[data-kernel-audit-filter="status"]'));
if (statusSelect) {
  await page.selectOption('[data-kernel-audit-filter="status"]', 'blocked');
  await page.waitForTimeout(800);
  const blockedRows = await page.evaluate(() => document.querySelectorAll('.kernel-audit-vrow').length);
  ok(blockedRows > 0 ? `filtered blocked rows render: ${blockedRows}` : 'no blocked rows');
  if (blockedRows === 0) fail('status filter', '0 rows after blocked');
  // Reset to all for subsequent tests.
  await page.selectOption('[data-kernel-audit-filter="status"]', '');
  await page.waitForTimeout(500);
} else {
  fail('status filter', 'select [data-kernel-audit-filter="status"] not found');
}

// 5. Search filters + no-results empty state
const hasSearch = await page.evaluate(() => !!document.querySelector('[data-ka-search]'));
if (hasSearch) {
  await page.fill('[data-ka-search]', 'zzz-no-match-xyz');
  await page.waitForTimeout(700);
  const emptyVisible = await page.evaluate(() => {
    const el = document.querySelector('[data-ka-empty]');
    return el ? getComputedStyle(el).display !== 'none' && !el.hidden : false;
  });
  ok(emptyVisible ? 'empty state shows on no-match' : 'empty state NOT shown');
  if (!emptyVisible) fail('no-results empty state', 'not visible');
  await page.fill('[data-ka-search]', '');
  await page.waitForTimeout(500);
} else {
  fail('search', '[data-ka-search] not found');
}

// 6. Copy — hash copy button flashes data-copied (deterministic, clipboard-free).
const copyOk = await page.evaluate(() => {
  const btn = document.querySelector('.kernel-audit-vrow .kernel-audit-table__hash-copy');
  if (!btn) return false;
  btn.click();
  // The flash() sets data-copied synchronously then removes it after 1400ms.
  return btn.getAttribute('data-copied') === 'true';
});
ok(copyOk ? 'hash copy button flashes data-copied' : 'copy did not flash');
if (!copyOk) fail('copy', 'data-copied not set');

// 7. Export — CSV + JSON downloads carry provenance (source + exportedAt).
//    We stub window.open + capture the in-memory file content via the engine's
//    downloadFile helper (it builds a Blob + clicks an <a download>). We intercept
//    anchor clicks to read the Blob text instead of triggering a real download.
async function captureExport(format) {
  return page.evaluate((fmt) => {
    return new Promise((resolve) => {
      const btn = document.querySelector(`[data-kernel-audit-export="${fmt}"]`);
      if (!btn) return resolve({ error: 'no button' });
      // Intercept the download <a> click to read the Blob before navigation.
      const observer = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const a = ev.currentTarget;
        observerAnchor.removeEventListener('click', observer, true);
        fetch(a.href).then((r) => r.text()).then((txt) => resolve({ name: a.download, body: txt })).catch((e) => resolve({ error: String(e) }));
      };
      const observerAnchor = document.body;
      document.body.addEventListener('click', observer, true);
      btn.click();
      // Fallback timeout — the export worker round-trip can take a moment.
      setTimeout(() => resolve({ error: 'timeout' }), 4000);
    });
  }, format);
}

// CSV: first line must be the provenance comment.
const csvRes = await captureExport('csv');
if (csvRes && !csvRes.error) {
  const firstLine = csvRes.body.split('\n')[0];
  const hasProv = firstLine.includes('source=demo-seeded') && /exported_at=\d{4}-\d{2}-\d{2}T/.test(firstLine);
  ok(hasProv ? `CSV provenance header OK (${firstLine.slice(0, 60)}…)` : `CSV provenance MISSING`);
  ok(/kernel-audit-.*\.csv/.test(csvRes.name) ? `CSV filename: ${csvRes.name}` : `CSV filename odd: ${csvRes.name}`);
  if (!hasProv) fail('CSV provenance', firstLine);
} else {
  fail('CSV export', csvRes ? csvRes.error : 'no result');
}

// JSON: must be an envelope { schema, source, exportedAt, count, events }, not a bare array.
const jsonRes = await captureExport('json');
if (jsonRes && !jsonRes.error) {
  let parsed = null;
  try { parsed = JSON.parse(jsonRes.body); } catch (e) { /* malformed */ }
  const isEnvelope = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    && parsed.schema === 'brightai.kernel.audit-events'
    && parsed.source === 'demo-seeded'
    && typeof parsed.exportedAt === 'string' && /\d{4}-\d{2}-\d{2}T/.test(parsed.exportedAt)
    && Array.isArray(parsed.events);
  ok(isEnvelope ? `JSON envelope OK (schema=${parsed.schema}, source=${parsed.source}, count=${parsed.count})` : 'JSON envelope MISSING');
  if (!isEnvelope) fail('JSON provenance', jsonRes.body.slice(0, 120));
} else {
  fail('JSON export', jsonRes ? jsonRes.error : 'no result');
}

// 8. Filter URL state — changing the status filter writes ?status=blocked.
await page.selectOption('[data-kernel-audit-filter="status"]', 'blocked');
await page.waitForTimeout(700);
const urlAfterFilter = await page.evaluate(() => location.search);
const urlHasStatus = /[?&]status=blocked/.test(urlAfterFilter);
ok(urlHasStatus ? `URL reflects filter: ${urlAfterFilter}` : `URL did NOT update: ${urlAfterFilter}`);
if (!urlHasStatus) fail('filter URL state (write)', urlAfterFilter);
// Reset.
await page.selectOption('[data-kernel-audit-filter="status"]', '');
await page.waitForTimeout(500);

// 9. Inbound URL state — reload with ?status=blocked and confirm the filter applies.
await page.goto(`${URL}?status=blocked`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
const inboundApplied = await page.evaluate(() => {
  const sel = document.querySelector('[data-kernel-audit-filter="status"]');
  return sel ? sel.value === 'blocked' : false;
});
ok(inboundApplied ? 'inbound ?status=blocked restored on load' : 'inbound URL filter NOT restored');
if (!inboundApplied) fail('filter URL state (read)', 'select value not restored');

// 10. Drawer open + provenance band + focus return.
//      Open the drawer via the first row's view button, check the provenance
//      band shows the demo label, then Escape and confirm focus returned.
const openerHandle = await page.evaluate(() => {
  const row = document.querySelector('.kernel-audit-vrow');
  if (!row) return null;
  const btn = row.querySelector('.kernel-audit-table__view-btn');
  if (!btn) return null;
  btn.focus({ preventScroll: true });
  btn.click();
  return true;
});
await page.waitForTimeout(800);

// Drawer open + traceId readable.
const drawerOpen = await page.evaluate(() => {
  const el = document.querySelector('#k-trace-drawer');
  return !!el && el.getAttribute('aria-hidden') === 'false';
});
ok(drawerOpen ? 'shared drawer opened' : 'shared drawer did not open');
if (!drawerOpen) fail('drawer', 'not open');

// Provenance band visible + labeled.
const provLabel = await page.evaluate(() => {
  const band = document.querySelector('#k-trace-drawer [data-kernel-drawer-provenance]');
  if (!band) return null;
  const visible = getComputedStyle(band).display !== 'none' && !band.hidden;
  const txt = band.querySelector('[data-kernel-drawer-source-label]');
  return { visible, text: txt ? txt.textContent.trim() : '' };
});
ok(provLabel && provLabel.visible && provLabel.text.includes('بيانات تجريبية')
  ? `drawer provenance band: "${provLabel.text.slice(0, 40)}…"`
  : `drawer provenance band MISSING/hidden`);
if (!provLabel || !provLabel.visible || !provLabel.text.includes('بيانات تجريبية')) {
  fail('drawer provenance', provLabel ? JSON.stringify(provLabel) : 'null');
}

// Read traceId for the verifier tests below.
const traceId = await page.evaluate(() => {
  const cell = document.querySelector('#k-trace-drawer [data-kernel-trace-id]');
  return cell ? cell.textContent.trim() : null;
});

// 11. Focus return — Escape the drawer, confirm focus lands back on a row/view button.
if (drawerOpen) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const focusReturned = await page.evaluate(() => {
    const ae = document.activeElement;
    if (!ae) return false;
    // Focus should be on the opener button or its row (.kernel-audit-vrow).
    return ae.classList.contains('kernel-audit-table__view-btn')
      || ae.classList.contains('kernel-audit-vrow')
      || !!ae.closest('.kernel-audit-vrow');
  });
  ok(focusReturned ? 'focus returned to opener after Escape' : 'focus NOT returned to opener');
  if (!focusReturned) fail('focus trap/return', `activeElement: ${await page.evaluate(() => document.activeElement?.className || '<null>')}`);
}

// 12+13. Verifier & tamper — fill the trace input, run verify + tamper simulation.
if (traceId) {
  // page.fill fails on elements inside the hidden-until-ready filter panel,
  // so set the value via the native setter + dispatch input/change.
  await page.evaluate((tid) => {
    const inp = document.querySelector('[data-ka-verify-trace]');
    if (!inp) return;
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), 'value').set;
    setter.call(inp, tid);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, traceId);
  await page.evaluate(() => document.querySelector('[data-ka-verify-btn]')?.click());
  await page.waitForTimeout(1500);
  const verifyOut = await page.evaluate(() => {
    const el = document.querySelector('[data-ka-verify-out]');
    return el ? el.textContent.trim().slice(0, 200) : null;
  });
  ok(verifyOut && verifyOut.includes('✓') ? `verifier: ${verifyOut.slice(0, 70)}` : 'verifier failed or empty');
  if (!verifyOut || !verifyOut.includes('✓')) fail('verifier', verifyOut || 'no output');
} else {
  fail('verifier', 'no traceId from drawer');
}

const hasTamper = await page.evaluate(() => !!document.querySelector('[data-ka-tamper-btn]'));
if (hasTamper && traceId) {
  await page.evaluate((tid) => {
    const inp = document.querySelector('[data-ka-verify-trace]');
    if (!inp) return;
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), 'value').set;
    setter.call(inp, tid);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, traceId);
  await page.evaluate(() => document.querySelector('[data-ka-tamper-btn]')?.click());
  await page.waitForTimeout(1500);
  const tamperOut = await page.evaluate(() => {
    const el = document.querySelector('[data-ka-verify-out]');
    return el ? el.textContent.trim() : null;
  });
  ok(tamperOut && tamperOut.includes('✗') ? `tamper: ${tamperOut.slice(0, 70)}` : 'tamper failed or empty');
  if (!tamperOut || !tamperOut.includes('✗')) fail('tamper', tamperOut || 'no output');
}

// Screenshot for the record
const shotPath = '/var/folders/md/ply6x_qd1k3gzt5vvg5ksnrr0000gn/T/opencode/kernel-audit.png';
try { await page.screenshot({ path: shotPath, fullPage: false }); } catch { /* non-fatal */ }

await browser.close();

if (failures > 0) {
  console.log(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\n✅ kernel-audit browser smoke: all checks passed');
process.exit(0);
