import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1024, height: 900 } });
const t = await ctx.newPage();
await t.goto('http://localhost:4321/pricing/', { waitUntil: 'networkidle' });
const info = await t.evaluate(() => {
  const a = document.querySelector('a[data-position="offer_detail_pilot"]');
  if (!a) return 'NOT FOUND';
  const cs = getComputedStyle(a);
  // Walk matched rules
  const rules = [];
  for (const sheet of document.styleSheets) {
    let rulesArr;
    try { rulesArr = sheet.cssRules; } catch (e) { continue; }
    for (const rule of rulesArr) {
      if (rule.type === CSSRule.STYLE_RULE) {
        try {
          if (a.matches(rule.selectorText)) {
            if (rule.style.color) rules.push({ sel: rule.selectorText, color: rule.style.color });
          }
        } catch (e) {}
      }
    }
  }
  return { computed: cs.color, matched: rules.slice(0, 8) };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
