import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1024, height: 900 } });
const t = await ctx.newPage();
await t.goto('http://localhost:4321/pricing/', { waitUntil: 'networkidle', cache: 'no-cache' });
await t.waitForTimeout(500);
const info = await t.evaluate(() => {
  const a = document.querySelector('a[data-position="offer_detail_pilot"]');
  const cs = getComputedStyle(a);
  const rules = [];
  for (const sheet of document.styleSheets) {
    let r; try { r = sheet.cssRules; } catch(e){ continue; }
    for (const rule of r) {
      if (rule.type === 1 && rule.style && rule.style.color && a.matches(rule.selectorText)) {
        rules.push({ sel: rule.selectorText, color: rule.style.color, href: sheet.href ? sheet.href.split('/').pop() : 'inline' });
      }
    }
  }
  return { computed: cs.color, ipVar: getComputedStyle(document.documentElement).getPropertyValue('--interactive-primary').trim(), matched: rules };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
