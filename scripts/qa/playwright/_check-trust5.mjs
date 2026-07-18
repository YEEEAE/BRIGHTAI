import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const cards = document.querySelectorAll('article.card--feature.card--lg');
  // Find the one at x: -238
  const target = Array.from(cards).find(c => c.getBoundingClientRect().x < 0);
  if (!target) return null;
  let p = target;
  const chain = [];
  while (p && p !== document.body) {
    const r = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    chain.push({
      tag: p.tagName.toLowerCase(),
      class: (typeof p.className === 'string' ? p.className.split(' ').slice(0, 4).join('.') : '').slice(0, 100),
      x: Math.round(r.x),
      width: Math.round(r.width),
      display: cs.display,
      gridTemplateColumns: cs.gridTemplateColumns.slice(0, 50),
      transform: cs.transform,
    });
    p = p.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
