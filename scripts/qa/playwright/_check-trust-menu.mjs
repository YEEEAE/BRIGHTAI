import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return { found: false };
  const r = menu.getBoundingClientRect();
  const cs = getComputedStyle(menu);
  return {
    found: true,
    bounds: { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width) },
    transform: cs.transform,
    visibility: cs.visibility,
    pointerEvents: cs.pointerEvents,
    display: cs.display,
    hasOpenClass: menu.classList.contains('mobile-menu--open'),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
