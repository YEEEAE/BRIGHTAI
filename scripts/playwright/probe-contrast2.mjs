import { chromium } from 'playwright';
const b=await chromium.launch();
const checks=[
  {p:'/en/',sel:'#cookie-accept'},
  {p:'/pricing/',sel:'a[data-position="offer_detail_pilot"]'},
  {p:'/kernel/chat/',sel:'.btn--primary.btn[rel="noopener noreferrer"]'},
];
for(const c of checks){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const tab=await ctx.newPage();
  await tab.goto('http://localhost:4321'+c.p,{waitUntil:'networkidle'});
  await tab.waitForFunction(()=>{const a=document.querySelector('a');if(!a)return true;const bg=getComputedStyle(a).backgroundColor;return bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent';},{timeout:15000}).catch(()=>{});
  const r=await tab.evaluate((sel)=>{
    const el=document.querySelector(sel); if(!el)return 'NOT FOUND';
    const cs=getComputedStyle(el);
    return {color:cs.color, bg:cs.backgroundColor, cls:el.className?.toString?.()||''};
  },c.sel);
  console.log(c.p+' '+c.sel+' -> '+JSON.stringify(r));
  await tab.close(); await ctx.close();
}
await b.close();
