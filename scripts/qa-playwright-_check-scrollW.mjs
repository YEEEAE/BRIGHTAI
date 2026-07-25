import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  return {
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
    bodyW: document.body.scrollWidth,
    bodyOverflow: getComputedStyle(document.body).overflowX,
    htmlOverflow: getComputedStyle(document.documentElement).overflowX,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
