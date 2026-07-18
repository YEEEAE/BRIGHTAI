import { chromium } from 'playwright';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const tab=await ctx.newPage();
await tab.goto('http://localhost:4321/en/',{waitUntil:'networkidle'});
await tab.waitForFunction(()=>{const a=document.querySelector('a');if(!a)return true;const bg=getComputedStyle(a).backgroundColor;return bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent';},{timeout:15000}).catch(()=>{});
const r=await tab.evaluate(()=>{
  const el=document.querySelector('#cookie-accept');
  const cs=getComputedStyle(el);
  const before=getComputedStyle(el,'::before');
  return {color:cs.color, bg:cs.backgroundColor, opacity:cs.opacity, beforeBg:before.backgroundColor, cls:el.className, text:(el.textContent||'').trim().slice(0,20)};
});
console.log(JSON.stringify(r,null,2));
await b.close();
