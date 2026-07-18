import { chromium } from 'playwright';
import fs from 'node:fs';
const AXE=fs.readFileSync('node_modules/axe-core/axe.min.js','utf-8');
const b=await chromium.launch();
for(const p of ['/en/','/pricing/','/kernel/chat/']){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const tab=await ctx.newPage();
  await tab.goto('http://localhost:4321'+p,{waitUntil:'networkidle'});
  await tab.waitForFunction(()=>{const a=document.querySelector('a');if(!a)return true;const bg=getComputedStyle(a).backgroundColor;return bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent';},{timeout:15000}).catch(()=>{});
  await tab.addScriptTag({content:AXE});
  const res=await tab.evaluate(async()=>await window.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']},resultTypes:['violations']}));
  const ser=res.violations.filter(v=>v.impact==='serious'||v.impact==='critical');
  console.log('=== '+p+' ===');
  ser.forEach(v=>console.log('  '+v.id+' ['+v.impact+'] ('+v.nodes.length+') — '+v.help+'\n    targets: '+JSON.stringify(v.nodes.slice(0,3).map(n=>n.target))));
  await tab.close(); await ctx.close();
}
await b.close();
