import { chromium } from 'playwright';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const tab=await ctx.newPage();
await tab.goto('http://localhost:4321/pricing/',{waitUntil:'networkidle'});
await tab.waitForFunction(()=>{const a=document.querySelector('a');if(!a)return true;const bg=getComputedStyle(a).backgroundColor;return bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent';},{timeout:15000}).catch(()=>{});
const sels=['a[data-position="offer_detail_pilot"]','a[data-position="offer_detail_enterprise"]','a[data-cta="pilot_request"]'];
for(const s of sels){
  const r=await tab.evaluate((sel)=>{const el=document.querySelector(sel);if(!el)return sel+': NOT FOUND';const cs=getComputedStyle(el);return {sel,color:cs.color,bg:cs.backgroundColor,cls:el.className?.toString?.()};},s);
  console.log(JSON.stringify(r));
}
await b.close();
