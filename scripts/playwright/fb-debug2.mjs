import { chromium } from 'playwright';
const BASE = 'http://localhost:4329';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(BASE + '/kernel/approvals/', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(800);
console.log('loaded. step markers:');
const dlg = page.locator('[data-kernel-confirm]');
await page.evaluate(() => {
  window.__fbTest = { confirmed: false, cancelled: true };
});
console.log('s1: evaluate __fbTest');
await page.evaluate(() => {
  window.KernelFeedback.confirm.open({
    title: 'اختبار الحذف', message: 'متأكد؟', confirmLabel: 'احذف', variant: 'danger',
    onConfirm: () => { window.__fbTest.confirmed = true; },
  });
});
console.log('s2: opened, data-open =', await dlg.getAttribute('data-open'));
console.log('s3: activeElement is ok btn =', await dlg.locator('[data-kernel-confirm-ok]').evaluate((el) => document.activeElement === el));
console.log('s4: press Escape');
await page.keyboard.press('Escape');
console.log('s5: after Escape data-open =', await dlg.getAttribute('data-open'));
console.log('s6: confirmed =', await page.evaluate(() => window.__fbTest.confirmed));
console.log('s7: reopen');
await page.evaluate(() => {
  window.KernelFeedback.confirm.open({
    title: 'اختبار الحذف', message: 'متأكد؟', confirmLabel: 'احذف', variant: 'danger',
    onConfirm: () => { window.__fbTest.confirmed = true; },
  });
});
console.log('s8: press Enter');
await page.keyboard.press('Enter');
console.log('s9: after Enter data-open =', await dlg.getAttribute('data-open'));
console.log('s10: confirmed =', await page.evaluate(() => window.__fbTest.confirmed));
console.log('s11: toast test');
await page.evaluate(() => {
  window.KernelFeedback.toast.show({ message: 'تم الحفظ', onUndo: () => { window.__fbUndo = true; } });
});
const toast = page.locator('#k-toast');
console.log('s12: toast visible =', await toast.isVisible());
console.log('s13: undo visible =', await toast.locator('[data-kernel-toast-undo]').isVisible());
console.log('s14: click undo');
await toast.locator('[data-kernel-toast-undo]').click();
console.log('s15: after undo, toast hidden =', !(await toast.isVisible()));
await browser.close();
console.log('DONE');
