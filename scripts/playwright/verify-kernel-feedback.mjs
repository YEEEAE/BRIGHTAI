#!/usr/bin/env node
/**
 * scripts/playwright/verify-kernel-feedback.mjs — M-A14 KernelConfirmDialog +
 * KernelUndoToast integration verification.
 *
 * Checks against the local preview server (port 4329):
 *   1. Confirm dialog exists on approvals/policies, hidden by default.
 *   2. KernelFeedback.confirm.open() shows it, sets title/message/variant,
 *      focus moves to the confirm button; Enter confirms + runs onConfirm;
 *      Escape cancels without running onConfirm.
 *   3. KernelFeedback.toast.show() with onUndo shows #k-toast + undo button;
 *      clicking undo runs the handler.
 *   4. Toast without onUndo has no undo button.
 *
 * Exit 0 = pass.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4329';
const PAGES = ['/kernel/approvals/', '/kernel/policies/'];

const failures = [];
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log(`   [pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') console.log(`   [console.error] ${m.text()}`); });

for (const p of PAGES) {
  console.log(`\n── ${p} ──`);
  await page.goto(BASE + p, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(600);

  // 1. confirm dialog present + hidden
  const dlg = page.locator('[data-kernel-confirm]');
  check(`${p}: confirm dialog exists`, (await dlg.count()) === 1);
  check(`${p}: confirm dialog hidden by default`, await dlg.getAttribute('data-open') === 'false');
  check(`${p}: confirm dialog aria-hidden`, await dlg.getAttribute('aria-hidden') === 'true');

  // visible? (display:none via [data-open=false])
  check(`${p}: confirm dialog not visually visible`, !(await dlg.isVisible()));

  // 2. open via API
  let confirmed = false;
  let cancelled = true;
  await page.evaluate(() => {
    window.__fbTest = { confirmed: false, cancelled: true };
  });
  await page.evaluate(() => {
    window.KernelFeedback.confirm.open({
      title: 'اختبار الحذف',
      message: 'متأكد من الحذف؟',
      confirmLabel: 'احذف',
      variant: 'danger',
      onConfirm: () => { window.__fbTest.confirmed = true; },
    });
  });
  check(`${p}: open() sets data-open=true`, await dlg.getAttribute('data-open') === 'true');
  check(`${p}: open() sets variant`, await dlg.getAttribute('data-variant') === 'danger');
  check(`${p}: open() sets title`, (await dlg.locator('[data-kernel-confirm-title]').textContent()) === 'اختبار الحذف');
  check(`${p}: open() sets message`, (await dlg.locator('[data-kernel-confirm-message]').textContent()) === 'متأكد من الحذف؟');
  check(`${p}: open() sets confirm label`, (await dlg.locator('[data-kernel-confirm-ok]').textContent()) === 'احذف');
  check(`${p}: open() focuses confirm button`, await dlg.locator('[data-kernel-confirm-ok]').evaluate((el) => document.activeElement === el));

  // Escape cancels (no onConfirm)
  await page.keyboard.press('Escape');
  check(`${p}: Escape closes dialog`, await dlg.getAttribute('data-open') === 'false');
  check(`${p}: Escape does not run onConfirm`, await page.evaluate(() => !window.__fbTest.confirmed));

  // reopen + Enter confirms
  await page.evaluate(() => {
    window.KernelFeedback.confirm.open({
      title: 'اختبار الحذف',
      message: 'متأكد من الحذف؟',
      confirmLabel: 'احذف',
      variant: 'danger',
      onConfirm: () => { window.__fbTest.confirmed = true; },
    });
  });
  await page.keyboard.press('Enter');
  check(`${p}: Enter closes dialog`, await dlg.getAttribute('data-open') === 'false');
  check(`${p}: Enter runs onConfirm`, await page.evaluate(() => window.__fbTest.confirmed));

  // cancel button click (no onConfirm)
  await page.evaluate(() => {
    window.__fbTest.confirmed = false;
    window.KernelFeedback.confirm.open({ title: 't', message: 'm', onConfirm: () => { window.__fbTest.confirmed = true; } });
  });
  await dlg.locator('[data-kernel-confirm-close]').first().click();
  check(`${p}: cancel button closes`, await dlg.getAttribute('data-open') === 'false');
  check(`${p}: cancel button does not confirm`, await page.evaluate(() => !window.__fbTest.confirmed));

  // 3. toast with undo
  const toast = page.locator('#k-toast');
  check(`${p}: toast exists`, (await toast.count()) === 1);
  let undoRan = false;
  await page.evaluate(() => {
    window.__fbUndo = false;
  });
  await page.evaluate(() => {
    window.KernelFeedback.toast.show({
      message: 'تم الحفظ',
      onUndo: () => { window.__fbUndo = true; },
    });
  });
  check(`${p}: toast visible`, await toast.isVisible());
  check(`${p}: toast message`, (await toast.locator('[data-kernel-toast-msg]').textContent()) === 'تم الحفظ');
  check(`${p}: undo button visible`, await toast.locator('[data-kernel-toast-undo]').isVisible());
  await toast.locator('[data-kernel-toast-undo]').click();
  check(`${p}: undo click runs handler`, await page.evaluate(() => window.__fbUndo));
  check(`${p}: undo click hides toast`, !(await toast.isVisible()));

  // 4. toast without undo → no undo button
  await page.evaluate(() => {
    window.KernelFeedback.toast.show({ message: 'بدون تراجع' });
  });
  check(`${p}: plain toast visible`, await toast.isVisible());
  check(`${p}: plain toast has no undo button`, await toast.locator('[data-kernel-toast-undo]').isHidden());
}

// 5. approvals: decision → undo removes ledger entry
console.log(`\n── /kernel/approvals/ decision undo ──`);
await page.goto(BASE + '/kernel/approvals/', { waitUntil: 'load', timeout: 20000 });
await page.waitForSelector('[data-kap-card]', { timeout: 10000 });
// open decision modal via keyboard shortcut A
await page.keyboard.press('a');
await page.waitForSelector('[data-kap-modal][data-open="true"]', { timeout: 5000 });
await page.locator('[data-kap-modal-confirm]').click();
await page.waitForSelector('#k-toast[hidden=""]', { state: 'detached' }).catch(() => {});
// toast should be visible with undo
const toast2 = page.locator('#k-toast');
await page.waitForFunction(() => {
  const t = document.getElementById('k-toast');
  return t && !t.hidden && !t.querySelector('[data-kernel-toast-undo]').hidden;
}, { timeout: 5000 });
check('approvals: decision shows undo toast', true);
const ledgerBefore = await page.locator('[data-kap-ledger] li').count();
await toast2.locator('[data-kernel-toast-undo]').click();
await page.waitForTimeout(200);
const ledgerAfter = await page.locator('[data-kap-ledger] li').count();
check('approvals: undo removes ledger entry', ledgerAfter === ledgerBefore - 1, `${ledgerBefore} → ${ledgerAfter}`);

await browser.close();

if (failures.length) {
  console.error(`\n❌ ${failures.length} fail(s):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\n✅ verify-kernel-feedback: كل البنود ناجحة.');
process.exit(0);
