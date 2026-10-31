// Run against the local built site. No application dependency is installed.
// BRIGHTAI_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/verify-interior-ui.mjs [local-url]
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.argv[2] ?? 'http://127.0.0.1:4392';
assert(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname), 'Local verification only');
const routes = [...fs.readFileSync('dist/client/sitemap-0.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname).filter(path => path !== '/').concat('/kernel/','/missing-page/');
const browser = await chromium.launch({ channel:'chrome',headless:true });
const context = await browser.newContext();
await context.route('https://www.googletagmanager.com/**',route => route.abort());
const page = await context.newPage(); const errors = []; page.on('pageerror',error => errors.push(error.message));
let viewportChecks = 0;
for (const width of [360,768,1440]) {
  await page.setViewportSize({width,height:900});
  for (const path of routes) {
    const response = await page.goto(base+path); await page.evaluate(() => document.fonts.ready);
    assert.equal(response.status(),path === '/missing-page/' ? 404 : 200,path);
    assert.equal(await page.locator('h1').count(),1,path);
    assert.equal(await page.locator('h1').isVisible(),true,path);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,`${width}: ${path}`);
    assert.equal(await page.locator('.interior-page').count(),1,path);
    viewportChecks++;
  }
}
await page.setViewportSize({width:360,height:900});
await page.goto(base+'/docs/');
await page.getByRole('button',{name:'المخاطر',exact:true}).click();
assert.equal(await page.locator('.catalog-row:visible').count(),1);
assert.match(await page.locator('.catalog-row:visible').textContent(),/تقييم مخاطر/);
await page.getByRole('button',{name:'الكل',exact:true}).click();
await page.getByLabel('ابحث في الأدلة',{exact:true}).fill('حقنغيرموجود');
assert.equal(await page.locator('[data-knowledge-empty]').isVisible(),true);
await page.getByRole('button',{name:'اعرض كل الأدلة',exact:true}).click();
assert.equal(await page.locator('.catalog-row:visible').count(),5);
await page.getByLabel('ابحث في الأدلة',{exact:true}).fill('البيانات');
assert((await page.locator('.catalog-row:visible').count()) > 0);

await page.goto(base+'/products/firewall/');
await page.getByRole('button',{name:'حظر',exact:true}).focus();await page.keyboard.press('Enter');
assert.equal(await page.locator('.experience').getAttribute('data-state'),'4');
assert.equal(await page.locator('[data-path-label]').textContent(),'حظر');
assert.match(await page.locator('[data-example-output]').textContent(),/يتوقف الطلب/);
const branchColor = await page.locator('.branch-4').evaluate(element => getComputedStyle(element).color);
assert.notEqual(branchColor,await page.locator('.branch-0').evaluate(element => getComputedStyle(element).color));
await page.goto(base+'/products/ledger/');
await page.getByRole('button',{name:'مثال معدّل',exact:true}).click();
assert.match(await page.locator('[data-integrity-output]').textContent(),/لا يجري هنا فحص تشفيري/);
await page.getByRole('button',{name:'مثال سليم',exact:true}).click();
assert.equal(await page.locator('.experience').getAttribute('data-integrity-state'),'valid');
await page.goto(base+'/products/secure-chat/');
await page.getByRole('button',{name:'بيانات داخلية',exact:true}).click();
assert.match(await page.locator('.chat-bubble.assistant').textContent(),/توقف وراجع/);
assert.equal(await page.locator('.experience input,.experience textarea').count(),0);

await page.goto(base+'/pricing/');
await page.getByRole('checkbox',{name:'AIGAS Firewall',exact:true}).check();
await page.getByRole('checkbox',{name:'AIGAS Ledger',exact:true}).check();
await page.getByRole('radio',{name:'معزول Air-Gapped',exact:true}).check();
const scope = new URL(await page.locator('[data-scope-link]').getAttribute('href'),base);
assert.match(scope.searchParams.get('topic'),/Firewall.*Ledger.*Air-Gapped/);
await page.locator('[data-scope-link]').click();
assert.match(await page.locator('select[name=topic]').inputValue(),/Firewall.*Ledger.*Air-Gapped/);
// No submit: mailto is the existing user-controlled communication route.

await page.goto(base+'/solutions/government/');
await page.locator('.sector-stages summary').last().focus();await page.keyboard.press('Enter');
assert.equal(await page.locator('.sector-stages details').last().getAttribute('open'),'');
await page.goto(base+'/knowledge/ai-risk-assessment/');
await page.evaluate(() => scrollTo(0,document.body.scrollHeight/2));
await page.waitForFunction(() => document.querySelector('.reading-progress')?.value > 0);
await page.locator('[data-section-compass] summary').click();
assert.equal(await page.locator('[data-section-links] a').count(),7);
await page.locator('[data-section-links] a').last().click();
assert.equal(await page.locator('[data-section-compass]').getAttribute('open'),null);
assert.equal(await page.locator(':focus').evaluate(element => element.tagName),'H2');
// BFCache/native back navigation must not duplicate generated controls.
await page.goto(base+'/docs/');await page.goBack();
assert.equal(await page.locator('.reading-progress').count(),1);
assert.equal(await page.locator('[data-section-links] a').count(),7);
await page.emulateMedia({reducedMotion:'reduce'});
await page.goto(base+'/products/firewall/');await page.evaluate(() => scrollTo(0,1200));
assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length),0);
await page.getByRole('button',{name:'تنقيح',exact:true}).click();
assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length),0);

const nojs = await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:900}});
const staticPage = await nojs.newPage();
for (const path of routes) {
  await staticPage.goto(base+path);
  assert.equal(await staticPage.locator('h1').isVisible(),true,path);
  assert.equal(await staticPage.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,path);
  if (path !== '/kernel/' && path !== '/missing-page/') assert.equal(await staticPage.locator('[data-content-extension]').count(),1,path);
}
await staticPage.goto(base+'/docs/');assert.equal(await staticPage.locator('.catalog-row:visible').count(),5);
await staticPage.goto(base+'/products/firewall/');assert.match(await staticPage.locator('.experience noscript').textContent(),/حظر/);
assert.deepEqual(errors,[]);
const result = {status:'PASS',routes:routes.length,viewportChecks,noJSRoutes:routes.length,search:'PASS',emptyState:'PASS',scopeComposer:'PASS',diagrams:'PASS',keyboard:'PASS',reducedMotion:'PASS',nativeBackNavigation:'PASS',pageErrors:errors};
console.log(JSON.stringify(result,null,2));
fs.writeFileSync('Audit/2026-10-31-interior-ui-verification.json',JSON.stringify(result,null,2)+'\n');
await browser.close();
