import { chromium } from 'playwright';
const b = await chromium.launch();
for (const page of ['/kernel/audit/','/kernel/evidence/']) {
  const ctx = await b.newContext({ viewport: { width: 320, height: 700 } });
  const tab = await ctx.newPage();
  await tab.goto('http://localhost:4321'+page, { waitUntil: 'networkidle' });
  await tab.waitForFunction(() => { const a=document.querySelector('a'); if(!a)return true; const bg=getComputedStyle(a).backgroundColor; return bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }, {timeout:15000}).catch(()=>{});
  const r = await tab.evaluate(() => ({
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    clientW: document.documentElement.clientWidth,
    hasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  }));
  console.log(page, JSON.stringify(r));
  await tab.close(); await ctx.close();
}
await b.close();
