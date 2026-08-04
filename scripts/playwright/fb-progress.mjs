import { chromium } from 'playwright';
const BASE = 'http://localhost:4329';
const log = (m) => console.log(m);
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(6000);

async function dismissCookie() {
  const banner = page.locator('#cookie-consent');
  if (await banner.count()) {
    const btn = banner.locator('button');
    const n = await btn.count();
    for (let i = n - 1; i >= 0; i--) {
      const label = (await btn.nth(i).textContent() || '').trim();
      if (/رفض|إغلاق|موافقة|قبول/.test(label)) {
        try { await btn.nth(i).click({ timeout: 3000 }); } catch (e) {}
        break;
      }
    }
    await page.waitForTimeout(200);
  }
}

log('STEP: goto approvals');
await page.goto(BASE + '/kernel/approvals/', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(600);
await dismissCookie();
log('STEP: dialog exists check');
const dlg = page.locator('[data-kernel-confirm]');
log('count:', await dlg.count(), 'open:', await dlg.getAttribute('data-open'));
log('STEP: open via API');
await page.evaluate(() => { window.KernelFeedback.confirm.open({ title: 't', message: 'm', confirmLabel: 'ok', variant: 'danger', onConfirm: () => {} }); });
log('after open, open attr:', await dlg.getAttribute('data-open'));
log('STEP: escape');
await page.keyboard.press('Escape');
log('after escape:', await dlg.getAttribute('data-open'));
log('STEP: reopen + Enter');
await page.evaluate(() => { window.KernelFeedback.confirm.open({ title: 't', message: 'm', confirmLabel: 'ok', variant: 'danger', onConfirm: () => { window.__c=true; } }); });
log('reopen open:', await dlg.getAttribute('data-open'));
await page.keyboard.press('Enter');
log('after Enter:', await dlg.getAttribute('data-open'), 'confirmed:', await page.evaluate(() => !!window.__c));
log('STEP: toast show with undo');
await page.evaluate(() => { window.KernelFeedback.toast.show({ message: 'x', onUndo: () => {} }); });
const toast = page.locator('#k-toast');
log('toast visible:', await toast.isVisible(), 'undo visible:', await toast.locator('[data-kernel-toast-undo]').isVisible());
log('STEP: decision flow');
await page.waitForSelector('[data-kap-card]', { timeout: 10000 });
await page.keyboard.press('a');
log('pressed a');
await page.waitForSelector('[data-kap-modal][data-open="true"]', { timeout: 5000 });
log('modal open');
await page.locator('[data-kap-modal-confirm]').click();
log('clicked confirm');
await page.waitForFunction(() => {
  const t = document.getElementById('k-toast');
  return t && !t.hidden && !t.querySelector('[data-kernel-toast-undo]').hidden;
}, { timeout: 5000 });
log('undo toast visible');
await dismissCookie();
await page.locator('#k-toast [data-kernel-toast-undo]').click();
await page.waitForTimeout(300);
log('undo clicked; toast hidden:', await page.locator('#k-toast').evaluate(el => el.hidden));
await browser.close();
log('DONE');
