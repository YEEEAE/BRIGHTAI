import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const winW = window.innerWidth;
  const all = document.querySelectorAll('*');
  const offenders = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.right > winW + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        class: (typeof el.className === 'string' ? el.className.split(' ').slice(0, 4).join('.') : '').slice(0, 100),
        right: Math.round(r.right),
        left: Math.round(r.left),
        width: Math.round(r.width),
        x: Math.round(r.x),
        text: (el.textContent || '').trim().slice(0, 25),
      });
    }
    if (offenders.length >= 20) break;
  }
  return { winW, docW: document.documentElement.scrollWidth, count: offenders.length, offenders };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
