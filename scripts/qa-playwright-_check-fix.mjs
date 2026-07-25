import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 320, height: 720 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const chips = document.querySelectorAll('.chip');
  const inputs = document.querySelectorAll('input[type="text"]');
  const links = document.querySelectorAll('a:not(.btn):not(.wa-btn):not(.chip)');
  return {
    chips: Array.from(chips).slice(0, 3).map(c => {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return { w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, text: (c.textContent || '').trim().slice(0, 20) };
    }),
    inputs: Array.from(inputs).slice(0, 3).map(c => {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return { w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, type: c.type };
    }),
    linksCount: links.length,
    smallLinks: Array.from(links).filter(l => {
      const r = l.getBoundingClientRect();
      return r.width < 44 || r.height < 44;
    }).slice(0, 3).map(l => {
      const r = l.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), text: (l.textContent || '').trim().slice(0, 20) };
    }),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
