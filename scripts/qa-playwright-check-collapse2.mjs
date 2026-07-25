import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => console.log(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', e => console.log(`[pageerror] ${e.message}`));

await page.goto('http://localhost:8766/kernel/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const btn = document.querySelector('[data-kernel-sidebar-collapse]');
  return {
    btnFound: !!btn,
    btnBound: btn?.dataset?.bound,
    bodyClass: document.body.className,
    bodyDataSidebar: document.body.getAttribute('data-sidebar'),
    sidebarClass: document.querySelector('.kernel-sidebar')?.className,
    pageClass: document.querySelector('.page')?.className,
  };
});
console.log('Info:', JSON.stringify(info, null, 2));

// Manually trigger click
const clicked = await page.evaluate(() => {
  const btn = document.querySelector('[data-kernel-sidebar-collapse]');
  if (!btn) return 'no btn';
  btn.click();
  return {
    bodyDataSidebar: document.body.getAttribute('data-sidebar'),
    btnLabel: btn.querySelector('.kernel-sidebar__collapse-label')?.textContent,
    sidebarWidth: document.querySelector('.kernel-sidebar')?.getBoundingClientRect()?.width,
    pagePaddingRight: getComputedStyle(document.querySelector('.page')).paddingRight,
  };
});
console.log('After click:', JSON.stringify(clicked, null, 2));

await browser.close();
