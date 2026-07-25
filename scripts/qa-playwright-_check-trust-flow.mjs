import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const winW = window.innerWidth;
  const all = document.body.querySelectorAll('*');
  const offenders = [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'absolute') continue;  // skip positioned
    const r = el.getBoundingClientRect();
    if (r.right > winW + 1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        class: (typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join('.') : '').slice(0, 80),
        right: Math.round(r.right),
        width: Math.round(r.width),
        position: cs.position,
        text: (el.textContent || '').trim().slice(0, 25),
      });
    }
    if (offenders.length >= 10) break;
  }
  return offenders;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
