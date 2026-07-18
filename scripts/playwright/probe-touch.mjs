import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 544, height: 900 } });
const tab = await ctx.newPage();
await tab.goto('http://localhost:4321/about/', { waitUntil: 'networkidle' });
await tab.waitForFunction(() => { const a=document.querySelector('a'); if(!a)return true; const bg=getComputedStyle(a).backgroundColor; return bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }, {timeout:15000}).catch(()=>{});
const r = await tab.evaluate(() => {
  const links = document.querySelectorAll('.breadcrumbs__link, .footer__link, .prose a');
  const out = [];
  links.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    const before = getComputedStyle(el, '::before');
    const hitCenter = document.elementFromPoint(cx, cy);
    const pts = [[cx-22,cy],[cx+22,cy],[cx,cy-22],[cx,cy+22]];
    let reach = 0;
    pts.forEach(([x,y])=>{ if(x<0||y<0||x>window.innerWidth||y>window.innerHeight)return; const h=document.elementFromPoint(x,y); if(h && (el===h||el.contains(h))) reach++; });
    out.push({ cls:(el.className||'').toString().slice(0,30), w:Math.round(rect.width), h:Math.round(rect.height),
      beforePos: before.position, beforeZ: before.zIndex, beforePE: before.pointerEvents,
      beforeBB: before.insetBlockStart, beforeMB: before.minBlockSize,
      hitCenterIsSelf: el===hitCenter||el.contains(hitCenter), reach });
  });
  return out.slice(0, 10);
});
console.log(JSON.stringify(r, null, 2));
await b.close();
