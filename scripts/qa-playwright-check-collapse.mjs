import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8766/kernel/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Dismiss cookie banner
await page.evaluate(() => document.getElementById('cookie-consent')?.remove());
await page.waitForTimeout(300);

console.log('Before click:');
console.log('  body data-sidebar =', await page.evaluate(() => document.body.getAttribute('data-sidebar')));
console.log('  button label =', await page.evaluate(() => document.querySelector('[data-kernel-sidebar-collapse]')?.querySelector('.kernel-sidebar__collapse-label')?.textContent));

// Click
await page.evaluate(() => document.querySelector('[data-kernel-sidebar-collapse]')?.click());
await page.waitForTimeout(500);

console.log('After click:');
console.log('  body data-sidebar =', await page.evaluate(() => document.body.getAttribute('data-sidebar')));
console.log('  button label =', await page.evaluate(() => document.querySelector('[data-kernel-sidebar-collapse]')?.querySelector('.kernel-sidebar__collapse-label')?.textContent));
console.log('  sidebar width =', await page.evaluate(() => document.querySelector('.kernel-sidebar')?.getBoundingClientRect()?.width));
console.log('  computed --kernel-sidebar-w =', await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--kernel-sidebar-w')));

await browser.close();
