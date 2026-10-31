// Use an available Playwright installation; no runtime dependency is added.
// BRIGHTAI_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/verify-creative-ui.mjs [local-url]
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.argv[2] ?? 'http://127.0.0.1:4390';
assert(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname), 'Local verification only');
const routes=[...fs.readFileSync('dist/client/sitemap-0.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname).concat(['/kernel/','/missing-page/']);
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext();
await context.route('https://www.googletagmanager.com/**',r=>r.abort());
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const problems=[];
for(const width of [360,1440]) {
 await page.setViewportSize({width,height:900});
 for(const route of routes){
  const response=await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,visible:!!document.querySelector('h1')?.getBoundingClientRect().height,dir:document.documentElement.dir,overflowElements:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2||e.getBoundingClientRect().left< -2).slice(0,5).map(e=>e.tagName+'.'+e.className)}));
  if(result.h1!==1||result.overflow||!result.visible||response.status()!==(route==='/missing-page/'?404:200))problems.push({width,route,status:response.status(),...result});
 }
}
await page.setViewportSize({width:360,height:900});
await page.goto(base+'/products/firewall/');
await page.getByRole('button',{name:'تنقيح',exact:true}).click();assert.match(await page.locator('[data-example-output]').textContent(),/بيانات منقحة/);
await page.getByRole('button',{name:'حظر',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.getByRole('button',{name:'حظر',exact:true}).getAttribute('aria-pressed'),'true');
assert.match(await page.locator('[data-example-output]').textContent(),/يتوقف الطلب/);
await page.goto(base+'/products/risk-engine/');await page.getByRole('button',{name:'احتمال مرتفع وأثر مرتفع',exact:true}).click();assert.match(await page.locator('[data-scenario-output]').textContent(),/احتمال مرتفع/);
for(const route of ['/products/human-gate/','/products/ledger/','/products/secure-chat/']){
 await page.goto(base+route);const summary=page.locator('summary').last();await summary.focus();await page.keyboard.press('Enter');assert.equal(await summary.evaluate(e=>e.parentElement.open),true);
}
await page.goto(base+'/');await page.keyboard.press('Tab');assert.match(await page.locator(':focus').textContent(),/تخطّ/);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>location.hash),'#main');
await page.goto(base+'/products/');await page.locator('.map-node').first().click();assert.match(page.url(),/products\/firewall/);await page.getByRole('button',{name:'تحذير',exact:true}).click();assert.equal(await page.getByRole('button',{name:'تحذير',exact:true}).getAttribute('aria-pressed'),'true');
await page.goto(base+'/');await page.goto(base+'/products/');await page.locator('.map-node').first().click();await page.getByRole('button',{name:'سماح',exact:true}).click();assert.equal(await page.getByRole('button',{name:'سماح',exact:true}).getAttribute('aria-pressed'),'true');
await page.goto(base+'/contact/');await page.locator('button[type=submit]').click();assert.equal(await page.locator('input:invalid').count(),2);
await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/');await page.evaluate(()=>scrollTo(0,1000));
assert.equal(await page.locator('[data-reveal-line]').first().evaluate(e=>getComputedStyle(e).opacity),'1');
const activeAnimations=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);assert.equal(activeAnimations,0);
const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:900}});const staticPage=await nojs.newPage();
for(const route of ['/','/products/firewall/','/products/risk-engine/','/products/human-gate/','/products/ledger/','/products/secure-chat/','/docs/']){
 await staticPage.goto(base+route);assert.equal(await staticPage.locator('h1').isVisible(),true);assert.equal(await staticPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}
const result={pages:routes.length,viewportChecks:routes.length*2,problems,pageErrors:errors,interactions:'PASS',keyboard:'PASS',reducedMotion:'PASS',noJS:'PASS'};console.log(JSON.stringify(result));await browser.close();
assert.deepEqual(problems,[]);assert.deepEqual(errors,[]);
