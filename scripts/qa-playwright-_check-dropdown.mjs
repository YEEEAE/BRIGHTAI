import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 320, height: 720 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const labels = document.querySelectorAll('.site-header__dropdown-group-label');
  return Array.from(labels).slice(0, 3).map(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      fs: cs.fontSize,
      text: (el.textContent || '').trim().slice(0, 30),
      visible: r.width > 0 && r.height > 0,
    };
  });
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
