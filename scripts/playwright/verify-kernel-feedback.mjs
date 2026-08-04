#!/usr/bin/env node
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') console.log(`[console.error] ${m.text().slice(0, 200)}`); });

const BASE = process.env.BASE || 'http://localhost:4329';
const failures = [];
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

// Approvals page
console.log('\n── /kernel/approvals/ ──');
await page.goto(BASE + '/kernel/approvals/', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(600);

check('confirm dialog exists', (await page.locator('[data-kernel-confirm]').count()) === 1);
check('toast exists', (await page.locator('#k-toast').count()) === 1);
check('KernelFeedback exists', typeof (await page.evaluate(() => window.KernelFeedback)) === 'object');
check('kap cards rendered', (await page.locator('[data-kap-card]').count()) > 0);

// Open confirm dialog via API
await page.evaluate(() => {
  window.KernelFeedback.confirm.open({
    title: 'تأكيد', message: 'هل متأكد؟', confirmLabel: 'نعم',
    onConfirm: () => { window.__fbConfirmed = true; },
  });
});
await page.waitForTimeout(300);
check('open() shows dialog', await page.locator('[data-kernel-confirm]').getAttribute('data-open') === 'true');
check('open() sets title', (await page.locator('[data-kernel-confirm-title]').textContent()) === 'تأكيد');
check('open() sets confirm label', (await page.locator('[data-kernel-confist-ok]').textContent()) === 'نعم');
check('open() focuses confirm button', await page.locator('[data-kernel-confirm-ok]').evaluate((el) => document.activeElement === el));

// Escape cancels
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('Escape closes dialog', await page.locator('[data-kernel-confirm]').getAttribute('data-open') === 'false');

// Enter confirms
await page.evaluate(() => { window.__fbConfirmed = false; });
await page.evaluate(() => {
  window.KernelFeedback.confirm.open({ title: 't', message: 'm', confirmLabel: 'ok', onConfirm: () => { window.__fbConfirmed = true; } });
});
await page.waitForTimeout(200);
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
check('Enter runs onConfirm', await page.evaluate(() => window.__fbConfirmed));
check('Enter closes dialog', await page.locator('[data-kernel-confirm]').getAttribute('data-open') === 'false');

// Toast with undo
await page.evaluate(() => { window.__fbUndo = false; });
await page.evaluate(() => {
  window.KernelFeedback.toast.show({ message: 'تم', onUndo: () => { window.__fbUndo = true; } });
});
await page.waitForTimeout(200);
check('toast visible with undo', (await page.locator('#k-toast [data-kernel-toast-undo]').isVisible()));
await page.locator('#k-toast [data-kernel-toast-undo]').click();
await page.waitForTimeout(200);
check('undo runs handler', await page.evaluate(() => window.__fbUndo));

// Approvals decision undo
console.log('\n── approvals decision undo ──');
await page.goto(BASE + '/kernel/approvals/', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(800);
await page.waitForSelector('[data-kap-card]', { timeout: 10000 });
const ledgerBefore = await page.locator('[data-kap-ledger] li').count();
await page.keyboard.press('a');
await page.waitForTimeout(500);
await page.locator('[data-kap-modal-confirm]').click();
await page.waitForTimeout(800);
const ledgerAfter = await page.locator('[data-kap-ledger] li').count();
check('decision recorded', ledgerAfter === ledgerBefore + 1, `${ledgerBefore} → ${ledgerAfter}`);

await browser.close();

if (failures.length) {
  console.error(`\n❌ ${failures.length} fail(s):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\n✅ verify-kernel-feedback: كل البنود ناجحة.');
process.exit(0);
