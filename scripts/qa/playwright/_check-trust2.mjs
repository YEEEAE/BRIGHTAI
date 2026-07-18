import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const winW = window.innerWidth;
  const all = document.querySelectorAll('*');
  const culprits = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.right > winW + 1) {
      culprits.push({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        class: (typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join('.') : '').slice(0, 80),
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 30),
      });
    }
    if (culprits.length >= 10) break;
  }
  return culprits;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
