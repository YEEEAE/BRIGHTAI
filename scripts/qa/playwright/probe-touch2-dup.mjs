import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 544, height: 900 } });
const tab = await ctx.newPage();
await tab.goto('http://localhost:4321/about/', { waitUntil: 'networkidle' });
await tab.waitForFunction(() => { const a=document.querySelector('a'); if(!a)return true; const bg=getComputedStyle(a).backgroundColor; return bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }, {timeout:15000}).catch(()=>{});
const r = await tab.evaluate(() => {
  const els = document.querySelectorAll('.footer__link, .breadcrumbs__link, .prose a');
  const out=[]; const MIN=44;
  els.forEach((el)=>{
    const rect=el.getBoundingClientRect(); const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none')return;
    let left=rect.left,top=rect.top,right=rect.right,bottom=rect.bottom;
    const before=getComputedStyle(el,'::before');
    if(before.content&&before.content!=='none'){
      const ib=parseFloat(before.insetBlockStart)||0, ii=parseFloat(before.insetInlineStart)||0;
      const mb=parseFloat(before.minBlockSize)||0, mi=parseFloat(before.minInlineSize)||0;
      const eT=top+(ib<0?ib:0), eB=bottom-(ib<0?ib:0), eL=left+(ii<0?ii:0), eR=right-(ii<0?ii:0);
      left=Math.min(left,eL); top=Math.min(top,eT); right=Math.max(right,eR); bottom=Math.max(bottom,eB);
      if(mb&&(bottom-top)<mb){const h=(mb-(bottom-top))/2; top-=h; bottom+=h;}
      if(mi&&(right-left)<mi){const h=(mi-(right-left))/2; left-=h; right+=h;}
    }
    const w=right-left,h=bottom-top;
    out.push({cls:(el.className||'').toString().slice(0,24), rawW:Math.round(rect.width), rawH:Math.round(rect.height), expW:Math.round(w), expH:Math.round(h), pass: w>=MIN&&h>=MIN});
  });
  return {total:out.length, pass:out.filter(o=>o.pass).length, failSample: out.filter(o=>!o.pass).slice(0,5)};
});
console.log(JSON.stringify(r,null,2));
await b.close();
