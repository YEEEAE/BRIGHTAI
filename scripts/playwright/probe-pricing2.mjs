import { chromium } from 'playwright';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const tab=await ctx.newPage();
await tab.goto('http://localhost:4321/pricing/',{waitUntil:'networkidle'});
await tab.waitForFunction(()=>{const a=document.querySelector('a');if(!a)return true;const bg=getComputedStyle(a).backgroundColor;return bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent';},{timeout:15000}).catch(()=>{});
const r=await tab.evaluate(()=>{
  const el=document.querySelector('a[data-position="offer_detail_pilot"]');
  const cs=getComputedStyle(el);
  // نطبع كل الـ matched rules للون
  return {
    color: cs.color,
    matchedColor: cs.getPropertyValue('color'),
    parents: [...el.ancestors?el.ancestors():[]].map(a=>a.className).slice(0,3),
    inlineStyle: el.getAttribute('style'),
    cls: el.className,
  };
});
console.log(JSON.stringify(r,null,2));
await b.close();
