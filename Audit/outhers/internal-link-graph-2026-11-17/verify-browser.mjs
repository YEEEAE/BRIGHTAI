const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
import {readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4467';
const graph=JSON.parse(await readFile(new URL('./after/graph.json',import.meta.url)));
const guides=graph.nodes.filter(n=>n.path.startsWith('/knowledge/'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:844}});
  const page=await context.newPage();
  for(const guide of guides) {
    await page.goto(base+guide.path);
    const value=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,rtl:getComputedStyle(document.documentElement).direction,toc:document.querySelectorAll('.kr-sidebar nav a').length,related:document.querySelectorAll('[aria-label="أدلة مرتبطة"] a').length,practical:document.querySelectorAll('[aria-label="من الفهم إلى التطبيق"] a').length}));
    assert.equal(value.width,width);assert.equal(value.overflow,false);assert.equal(value.rtl,'rtl');assert(value.toc>0);assert.equal(value.related,3);assert(value.practical>=3&&value.practical<=4);
    results.push({path:guide.path,...value});
  }
  await page.goto(base+'/docs/?q=بيانات&topic=privacy&view=expanded');
  await page.locator('a[data-article-link][href*="pdpl-and-ai"]').first().click();
  await page.waitForFunction(()=>document.querySelector('.kr-related a').href.includes('from='));
  const originalBack=await page.locator('[data-back-center]').getAttribute('href');
  await page.locator('[aria-label="أدلة مرتبطة"] a').first().click();
  assert.equal(await page.locator('[data-back-center]').getAttribute('href'),originalBack);
  const toc=page.locator('.kr-sidebar details');if(!await toc.evaluate(e=>e.open))await toc.locator('summary').click();
  await page.locator('.kr-sidebar nav a').first().click();
  assert(await page.evaluate(()=>!!location.hash&&document.activeElement.id===decodeURIComponent(location.hash.slice(1))));
  await page.locator('.kr-related a[href*="/products/"]').first().click();
  await page.waitForSelector('[data-knowledge-return]');assert.equal(await page.locator('[data-knowledge-return]').getAttribute('href'),originalBack);
  await page.locator('main a[href*="/contact/"]').first().click();
  await page.waitForSelector('[data-knowledge-return]');assert.equal(await page.locator('[data-knowledge-return]').getAttribute('href'),originalBack);
  await page.locator('[data-knowledge-return]').click();
  assert.equal(await page.locator('#kc-query').inputValue(),'بيانات');assert.equal(await page.locator('#kc-topic').inputValue(),'privacy');assert.equal(await page.locator('[data-knowledge-center]').getAttribute('data-view'),'expanded');
  results.push({width,journey:'search → guide → related → TOC → lab → contact → results',passed:true,restoredScroll:await page.evaluate(()=>scrollY),returnTo:originalBack});
  await page.goto(base+'/knowledge/ai-governance-healthcare/?from=https://example.org/');
  assert.equal(await page.locator('[data-back-center]').getAttribute('href'),'/docs/');
  await context.close();
}
const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(base+'/knowledge/ai-risk-assessment/');assert.equal(await page.locator('[aria-label="من الفهم إلى التطبيق"] a').count(),3);assert(await page.locator('.kr-sidebar nav a').count()>0);results.push({noJS:true,staticLinksAndTOC:true});await browser.close();await writeFile(new URL('./browser.json',import.meta.url),JSON.stringify(results,null,2));console.log(`PASS ${guides.length*2} guide views; 2 complete search journeys; unsafe context rejected; no-JS links/TOC`);
