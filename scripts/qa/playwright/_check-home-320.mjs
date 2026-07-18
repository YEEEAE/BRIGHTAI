import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 320, height: 720 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const cards = document.querySelectorAll('a.card--glass');
  return Array.from(cards).slice(0, 5).map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim().slice(0, 30),
      w: Math.round(r.width),
      h: Math.round(r.height),
      display: cs.display,
      gridColumn: cs.gridColumn,
      parentDisplay: getComputedStyle(el.parentElement).display,
      parentClass: el.parentElement.className,
    };
  });
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
