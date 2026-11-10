// Local product section layout/motion verification. No external services or secrets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const root=new URL('../', import.meta.url).pathname.replace(/\/$/,'');
const output=root+'/Audit/p12-product-journey-2026-11-10/';
const child=spawn(process.execPath,['scripts/server.mjs'],{cwd:root,env:{PATH:process.env.PATH,HOST:'127.0.0.1',PORT:'4414',NODE_ENV:'production',AIGAS_APP_ENABLED:'true'},stdio:'ignore'});
let browser;
try{
 for(let i=0;;i++){try{await fetch('http://127.0.0.1:4414/');break;}catch{if(i>40)throw Error('server unavailable');await new Promise(r=>setTimeout(r,100));}}
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const results=[];
 for(const width of [360,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:4414/products/');
  for(const card of await page.locator('[data-product-card]').all()){
   await card.scrollIntoViewIfNeeded();
   await page.waitForTimeout(600);
   assert(await card.evaluate(e=>getComputedStyle(e).opacity==='1'));
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  assert.equal(await page.locator('[data-product-card] a a').count(),0);
  for(const link of await page.locator('.product-gallery .actions a, .product-index a').all()){
   const box=await link.boundingBox();assert(box.height>=44,`target height ${width}`);
  }

  await page.locator('[data-product-showcase]').screenshot({path:output+`showcase-${width}.png`,style:'.skip-link,.section-compass{visibility:hidden!important}'});
  results.push({name:`visual layout, reveal, touch targets ${width}px`,status:'PASS'});
 }
 await page.locator('.card-ledger').scrollIntoViewIfNeeded();
 const sheet=page.locator('.card-ledger .sheet-front');
 const before=await sheet.evaluate(e=>getComputedStyle(e).transform);
 await page.locator('.card-ledger').hover();await page.waitForTimeout(300);
 const after=await sheet.evaluate(e=>getComputedStyle(e).transform);assert.notEqual(before,after);
 results.push({name:'Pointer illustration feedback',status:'PASS'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload();
 await page.locator('.card-ledger').hover();await page.waitForTimeout(300);
 assert.equal(await sheet.evaluate(e=>getComputedStyle(e).transform),'none');
 assert.equal(await page.locator('[data-product-showcase]').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 results.push({name:'Reduced motion: no spatial or running showcase animation',status:'PASS'});
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:900}});
 await nojs.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await nojs.goto('http://127.0.0.1:4414/products/');
 assert.equal(await nojs.locator('.catalog-row:visible').count(),5);
 await nojs.locator('.catalog-row').first().click();await nojs.waitForURL('**/products/firewall/');
 results.push({name:'No JavaScript: all cards visible and details navigate',status:'PASS'});
 assert.deepEqual(errors,[]);
 await writeFile(output+'design-results.json',JSON.stringify({results,errors},null,2));
 console.log(JSON.stringify({results,errors},null,2));
}finally{await browser?.close();if(child.exitCode===null&&child.signalCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}}
