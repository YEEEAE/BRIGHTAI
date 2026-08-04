/**
 * verify-policies-visual.mjs — Visual Condition Builder verification for /kernel/policies/.
 */
import { chromium } from 'playwright';

const BASE = process.env.PO_URL || 'http://localhost:4877/kernel/policies/';
const failures = [];
const ok = (name, cond, detail = '') => {
  if (cond) console.log('✅ ' + name + (detail ? ' — ' + detail : ''));
  else { console.log('❌ ' + name + (detail ? ' — ' + detail : '')); failures.push(name); }
};

console.log('🚀 Starting Visual Condition Builder Playwright Test on ' + BASE);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  if (text.includes('.vite/deps') || text.includes('Outdated Optimize Dep')) return;
  if (text.includes('Content Security Policy directive') || text.includes('X-Frame-Options may only be set')) return;
  consoleErrors.push(text);
});
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 1. Engine mounted
  const engineMounted = await page.evaluate(() => !!window.KernelPolicies);
  ok('engine mounted (window.KernelPolicies)', engineMounted);

  // 2. Open editor modal for a policy (e.g. pr_email_pdpl)
  await page.locator('[data-po-edit="pr_email_pdpl"]').first().click();
  await page.waitForTimeout(200);

  const editorVisible = await page.locator('[data-po-editor]').getAttribute('hidden');
  ok('editor modal opened', editorVisible === null);

  // 3. Condition builder root exists inside modal
  const builderRoot = await page.locator('[data-po-builder-root]').count();
  ok('visual condition builder mounted in modal', builderRoot > 0);

  // 4. Live Arabic preview exists and is populated
  const arabicPreview = await page.locator('[data-po-builder-arabic-preview]').innerText();
  ok('live plain Arabic preview generated', arabicPreview && arabicPreview.includes('إذا كانت الرسالة تحتوي على'), arabicPreview.replace(/\n/g, ' '));

  // 5. Add Condition (AND) button click
  await page.locator('[data-po-add-condition-btn]').click();
  await page.waitForTimeout(150);

  const conditionCards = await page.locator('.po-condition-card').count();
  ok('adding condition node increases card count (2)', conditionCards === 2);

  // 6. Check updated Arabic preview text contains additional condition
  const updatedPreview = await page.locator('[data-po-builder-arabic-preview]').innerText();
  ok('updated Arabic preview reflects new condition', updatedPreview && updatedPreview.length > arabicPreview.length);

  // 7. Mode switch toggle: switch to classic mode
  await page.locator('[data-po-builder-mode="classic"]').click();
  await page.waitForTimeout(100);

  const visualHidden = await page.locator('[data-po-builder-canvas]').getAttribute('hidden');
  ok('classic mode hides visual canvas', visualHidden !== null);
  const classicVisible = await page.locator('[data-po-classic-rules-wrap]').getAttribute('hidden');
  ok('classic mode shows classic rules form', classicVisible === null);

  // Switch back to visual mode
  await page.locator('[data-po-builder-mode="visual"]').click();
  await page.waitForTimeout(100);
  const visualShownAgain = await page.locator('[data-po-builder-canvas]').getAttribute('hidden');
  ok('switching back to visual mode shows visual canvas', visualShownAgain === null);

  // 8. Save policy version
  await page.locator('[data-po-editor-save]').click();
  await page.waitForTimeout(300);

  const editorClosed = await page.locator('[data-po-editor]').getAttribute('hidden');
  ok('saving policy closes editor modal', editorClosed !== null);

  // 9. No console errors
  ok('no console errors (' + consoleErrors.length + ')', consoleErrors.length === 0);
  if (consoleErrors.length) consoleErrors.forEach((e) => console.log('   console: ' + e));

} catch (err) {
  console.error('Test execution error:', err);
  failures.push('Execution Error: ' + err.message);
} finally {
  await browser.close();
}

if (failures.length) {
  console.log('\n❌ FAILED CHECKS: ' + failures.join(', '));
  process.exit(1);
}

console.log('\n✅ ALL VISUAL CONDITION BUILDER CHECKS PASSED SUCCESSFULLY!');
process.exit(0);
