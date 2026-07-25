import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ar-SA' });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/solutions/ai-firewall/', { waitUntil: 'networkidle' });
const items = await page.evaluate(() => {
  // Find any small links
  const allLinks = Array.from(document.querySelectorAll('a, button'));
  return allLinks
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { 
        text: (el.innerText || el.textContent || '').slice(0, 30).trim(), 
        href: el.href?.slice(0, 60) || '',
        w: Math.round(r.width), h: Math.round(r.height),
        cls: el.className.slice(0, 80),
      };
    })
    .filter((el) => el.w > 0 && el.h > 0 && (el.w < 44 || el.h < 44))
    .slice(0, 15);
});
console.log(JSON.stringify(items, null, 2));
await browser.close();
