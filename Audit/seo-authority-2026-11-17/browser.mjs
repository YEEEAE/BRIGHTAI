import {chromium} from '/Users/yzydalshmry/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir=new URL('./',import.meta.url);
const paths=['/','/docs/','/knowledge/ai-governance-saudi/','/knowledge/pdpl-and-ai/','/knowledge/iso-42001-saudi/','/products/firewall/','/contact/','/solutions/government/'];
const browser=await chromium.launch({channel:'chrome',headless:true});
const axe=await readFile('/tmp/brightai-cwv/axe.min.js','utf8');
const vitals=await readFile('/tmp/brightai-cwv/web-vitals.js','utf8');
const result={mode:'LAB; cold load; single run; not field p75',generatedAt:new Date().toISOString(),pages:[]};
try{
 for(const width of [390,1440])for(const path of paths){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,200)));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  if(width===390){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  await context.addInitScript({content:vitals+';window.__seoVitals={};for(const n of ["LCP","CLS","INP"])webVitals["on"+n](m=>window.__seoVitals[n]=m.value,{reportAllChanges:true});'});
  const response=await page.goto('http://127.0.0.1:4401'+path,{waitUntil:'load',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1800);
  await page.addScriptTag({content:axe});
  const a11y=await page.evaluate(async()=>{const r=await axe.run();return r.violations.map(x=>({id:x.id,impact:x.impact,count:x.nodes.length}));});
  const dom=await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,toc:!!document.querySelector('[aria-label="فهرس الدليل"]'),vitals:window.__seoVitals,resources:performance.getEntriesByType('resource').reduce((a,r)=>a+r.transferSize,0)}));
  const keyboard=[];for(let i=0;i<8;i++){await page.keyboard.press('Tab');keyboard.push(await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return {tag:e.tagName,visible:r.width>0&&r.height>0};}));}
  await page.goto('about:blank');result.pages.push({path,width,http:response.status(),...dom,a11y,keyboard,errors,INP:'NOT VERIFIED; navigation and Tab do not measure representative interactions',screenReader:'NOT RUN'});
  await context.close();
 }
}finally{await browser.close();await writeFile(new URL('browser-lab.json',dir),JSON.stringify(result,null,2));}
console.log(JSON.stringify(result.pages.map(p=>({path:p.path,width:p.width,http:p.http,overflow:p.overflow,vitals:p.vitals,a11y:p.a11y})),null,2));
