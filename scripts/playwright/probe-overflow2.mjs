import { chromium } from 'playwright';
const b = await chromium.launch();
for (const page of ['/kernel/audit/','/kernel/evidence/']) {
  const ctx = await b.newContext({ viewport: { width: 320, height: 700 } });
  const tab = await ctx.newPage();
  await tab.goto('http://localhost:4321'+page, { waitUntil: 'networkidle' });
  await tab.waitForFunction(() => { const a=document.querySelector('a'); if(!a)return true; const bg=getComputedStyle(a).backgroundColor; return bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }, {timeout:15000}).catch(()=>{});
  const bad = await tab.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') return;
      if (r.right <= 0 || r.left >= vw) return;
      if (r.right > vw + 1 && r.width > 0 && cs.position !== 'fixed') {
        out.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,50), w: Math.round(r.width), right: Math.round(r.right), parent: el.parentElement?.className?.toString().slice(0,40) });
      }
    });
    return out.slice(0, 10);
  });
  console.log('=== '+page+' ===');
  console.log(JSON.stringify(bad, null, 2));
  await tab.close(); await ctx.close();
}
await b.close();
