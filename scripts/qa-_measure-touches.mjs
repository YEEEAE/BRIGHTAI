import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ar-SA' });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
const items = await page.evaluate(() => {
  const target = document.querySelectorAll('.home-kernel-feature-link');
  return Array.from(target).map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { 
      text: el.innerText.slice(0, 40), 
      w: Math.round(r.width), h: Math.round(r.height),
      minHeight: cs.minHeight,
      padding: cs.padding,
      display: cs.display,
    };
  });
});
console.log(JSON.stringify(items, null, 2));
await browser.close();
