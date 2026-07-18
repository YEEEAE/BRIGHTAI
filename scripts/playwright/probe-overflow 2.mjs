import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 320, height: 700 } });
const tab = await ctx.newPage();
await tab.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await tab.waitForFunction(() => { const a=document.querySelector('a'); if(!a)return true; const bg=getComputedStyle(a).backgroundColor; return bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }, {timeout:15000}).catch(()=>{});
const bad = await tab.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') return;
    if (r.right <= 0 || r.left >= vw) return;
    if (r.right > vw + 1 && r.width > 0 && cs.position !== 'fixed') {
      out.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,50), w: Math.round(r.width), right: Math.round(r.right) });
    }
  });
  return { vw, count: out.length, sample: out.slice(0, 12) };
});
console.log(JSON.stringify(bad, null, 2));
await b.close();
