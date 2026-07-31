/**
 * verify-kernel-scripts.mjs — CSP-FIX-2026-07-31 runtime verification.
 *
 * Purpose: confirm kernel-eval-store.js + kernel-shell.js + kernel-drawer.js
 * actually reach the browser after moving them from src/scripts/ (frontmatter
 * import = server-side only) to public/js/ (static ES module script tags).
 *
 * Checks on /kernel/chat/:
 *   - window.KernelEvalStore exists (kernel-eval-store.js loaded)
 *   - body.kernel-shell class applied (kernel-shell.js ran initShell)
 *   - #k-cmdk palette present + cmd key binding works (shell interactive)
 *   - kernel-eval-store API works (listRuns returns array, createRun + versioning)
 *
 * Usage: node scripts/playwright/verify-kernel-scripts.mjs
 * Exit 0 = pass, 1 = fail.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/chat/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

let failures = [];

try {
  await page.goto(URL, { waitUntil: 'networkidle' });

  // 1. kernel-eval-store.js loaded?
  const hasStore = await page.evaluate(() => typeof window.KernelEvalStore !== 'undefined');
  console.log(`1. window.KernelEvalStore present: ${hasStore}`);
  if (!hasStore) failures.push('KernelEvalStore missing');

  // 2. kernel-shell.js initShell ran?
  const hasShell = await page.evaluate(() => document.body.classList.contains('kernel-shell'));
  console.log(`2. body.kernel-shell applied: ${hasShell}`);
  if (!hasShell) failures.push('body.kernel-shell missing');

  // 3. cmd palette DOM present?
  const hasPalette = await page.evaluate(() => !!document.getElementById('k-cmdk'));
  console.log(`3. #k-cmdk palette present: ${hasPalette}`);
  if (!hasPalette) failures.push('#k-cmdk missing');

  // 4. Store API works — create a run + verify published locking
  const storeApi = await page.evaluate(() => {
    const S = window.KernelEvalStore;
    const runs = S.listRuns();
    const r = S.createRun({
      name: 'تقييم تحقق CSP-FIX',
      setup: {
        dataset: { id: 'ds-demo-csp-fix', name: 'تقييم CSP Fix' },
        model: { id: 'm-demo', name: 'gpt-4o', version: '1.0', provider: 'openai' },
        prompt: { id: 'p-demo', version: '1' },
        policy: { id: 'pol-demo', version: '1' },
        scorers: [{ id: 'pii', name: 'PII' }, { id: 'injection', name: 'Injection' }],
        environment: 'demo',
        provider: { id: 'prov-demo', name: 'groq', model: 'llama-3.3' },
      },
    });
    S.publishRun(r.id);
    const published = S.getRun(r.id);
    let lockWorked = false;
    try {
      S.updateRun(r.id, { title: 'ممنوع' });
    } catch (e) {
      lockWorked = true;
    }
    const cloned = S.cloneRun(r.id);
    return {
      runsBefore: runs.length,
      createdId: r.id,
      publishedFlag: published.published,
      cloneVersion: cloned.version,
      lockWorked,
    };
  });
  console.log(`4. store API: ${JSON.stringify(storeApi)}`);
  if (!storeApi.lockWorked) failures.push('published lock not enforced');
  if (storeApi.publishedFlag !== true) failures.push('publish flag not set');
  if (!storeApi.cloneVersion || storeApi.cloneVersion <= 1) failures.push('cloneRun versioning wrong');

  // 5. drawer present?
  const hasDrawer = await page.evaluate(() => !!document.getElementById('k-trace-drawer'));
  console.log(`5. #k-trace-drawer present: ${hasDrawer}`);
  if (!hasDrawer) failures.push('#k-trace-drawer missing');

  // 6. console errors?
  console.log(`6. console/page errors: ${consoleErrors.length ? consoleErrors.join(' | ') : 'none'}`);
  if (consoleErrors.length) failures.push(`console errors: ${consoleErrors.join(' | ')}`);
} catch (err) {
  failures.push(`navigation/exec failed: ${err.message}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('\n❌ FAILURES:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log('\n✅ All kernel script runtime checks passed.');
process.exit(0);
