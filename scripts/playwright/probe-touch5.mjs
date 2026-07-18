import { chromium } from 'playwright';
const b = await chromium.launch();
// الصفحات اللي كان عندها gaps + kernel/audit
const pages=['/kernel/audit/','/kernel/evidence/','/docs/kernel-security-model/','/events/ai-governance-day/','/calculator/roi/','/contact/','/blog/cloud-cybersecurity-controls-ccc-saudi/','/design/buttons/','/design/forms/','/referral/','/newsletter/','/partners/'];
let grand=0;
for (const p of pages) {
  for (const bp of [320,375,544,768,1024]) {
    const ctx = await b.newContext({ viewport: { width: bp, height: 900 } });
    const tab = await ctx.newPage();
    await tab.goto('http://localhost:4321'+p, { waitUntil: 'networkidle' });
    await tab.waitForFunction(() => { const a=document.querySelector('a'); if(!a)return true; const bg=getComputedStyle(a).backgroundColor; return bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'; }, {timeout:15000}).catch(()=>{});
    const r = await tab.evaluate(() => {
      const els = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [tabindex]');
      const MIN=44; let gaps=0;
      els.forEach((el) => {
        if(el.matches('input[type="checkbox"],input[type="radio"]'))return; // معفية
        const rect=el.getBoundingClientRect(); const cs=getComputedStyle(el);
        if(rect.width===0||rect.height===0||cs.visibility==='hidden'||cs.display==='none')return;
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
        if(w<MIN||h<MIN)gaps++;
      });
      return { gaps };
    });
    grand+=r.gaps;
    if(r.gaps>0)console.log(`${p} bp=${bp}: gaps=${r.gaps}`);
    await tab.close(); await ctx.close();
  }
}
console.log('\nGRAND TOTAL gaps on sampled pages:', grand);
await b.close();
