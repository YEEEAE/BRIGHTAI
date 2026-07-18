import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const cards = document.querySelectorAll('article.card--feature.card--lg');
  const html = document.documentElement;
  return {
    docW: html.scrollWidth,
    winW: window.innerWidth,
    cards: Array.from(cards).slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect();
      let p = el.parentElement;
      const ancestors = [];
      while (p) {
        const pr = p.getBoundingClientRect();
        ancestors.push({
          tag: p.tagName.toLowerCase(),
          class: p.className.slice(0, 60),
          right: Math.round(pr.right),
          width: Math.round(pr.width),
          maxWidth: getComputedStyle(p).maxWidth,
        });
        if (ancestors.length >= 5) break;
        p = p.parentElement;
      }
      return { text: (el.textContent || '').trim().slice(0, 30), right: Math.round(r.right), width: Math.round(r.width), ancestors };
    }),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
