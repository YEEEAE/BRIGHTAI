// Local browser verification. Reuses an available Playwright installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.argv[2] ?? 'http://127.0.0.1:4395';
assert(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname));
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900}});
await context.route('https://www.googletagmanager.com/**', route => route.abort());
const page = await context.newPage(); const errors=[];
await page.addInitScript(() => addEventListener('pagereveal', event => { window.__nativeTransition = !!event.viewTransition; }));
page.on('pageerror', error => errors.push(error.message));
const goto = route => page.goto(base+route);
try {
  await goto('/kernel/');
  await page.locator('[data-kernel-play]').click();
  await page.waitForFunction(() => document.querySelector('[data-kernel-stage][data-active=true]'));
  await page.locator('[data-kernel-skip]').click();
  assert.match(await page.locator('[data-kernel-output]').textContent(),/\[بيانات منقحة\]/);
  await page.locator('[data-kernel-play]').click();
  await page.waitForFunction(() => document.querySelector('[data-kernel-sequence]').dataset.running === 'false');
  assert.equal(await page.locator('[data-kernel-stage][data-complete=true]').count(),4);

  await goto('/products/firewall/');
  await page.locator('.experience').hover();
  await page.waitForFunction(() => document.querySelector('.experience').style.getPropertyValue('--pointer-x'));
  for (const label of ['حظر','تنقيح','تحذير','موافقة بشرية','سماح']) {
    await page.getByRole('button',{name:label,exact:true}).click();
    assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true');
  }
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('[data-decision-packet]').getAttribute('cx'),'60');
  await page.locator('[data-redaction-run]').click();
  assert.equal(await page.locator('[data-redaction]').getAttribute('data-scanning'),'');
  await page.waitForFunction(() => document.querySelector('[data-redaction-value]').textContent === '[بيانات منقحة]');
  assert.match(await page.locator('[data-redaction-status]').textContent(),/لم تُرسل بيانات/);

  await goto('/products/human-gate/');
  for (const state of ['allow','block','pending']) {
    await page.locator(`[data-approval=${state}]`).focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-approval-demo]').getAttribute('data-approval-state'),state);
  }
  await goto('/products/risk-engine/');
  await page.getByRole('button',{name:'احتمال مرتفع وأثر مرتفع',exact:true}).click();
  assert.match(await page.locator('[data-example-output]').textContent(),/لا يُستنتج حظر آلي/);
  await goto('/products/');
  await page.locator('.map-node[href="/products/ledger/"]').focus();
  assert.equal(await page.locator('.system-map').getAttribute('data-highlight'),'ledger');
  const uniqueNames = await page.evaluate(() => [...document.querySelectorAll('main *')].map(el => getComputedStyle(el).viewTransitionName).filter(name => name && name !== 'none'));
  assert.equal(new Set(uniqueNames).size,uniqueNames.length);
  assert(uniqueNames.includes('product-ledger'));
  await page.locator('.catalog-row[href="/products/ledger/"]').click();
  await page.waitForFunction(() => typeof window.__nativeTransition === 'boolean');
  assert.equal(await page.evaluate(() => window.__nativeTransition),true);
  assert.equal(await page.locator('h1 bdi').evaluate(el => getComputedStyle(el).viewTransitionName),'product-ledger');
  await page.goBack(); assert.equal(await page.locator('[data-motion-ready]').count(),1);
  await goto('/products/secure-chat/');
  await page.getByRole('button',{name:'بيانات داخلية',exact:true}).click();
  assert.equal(await page.locator('.motion-typing').count(),1);
  await page.waitForFunction(() => !document.querySelector('.motion-typing'));
  await goto('/knowledge/ai-risk-assessment/');
  await page.locator('[data-checklist] input').first().check();
  assert.match(await page.locator('[data-checklist-output]').textContent(),/1 من 3/);
  await page.locator('.document-toc summary').click();
  await page.locator('.document-toc a').last().click();
  await page.waitForFunction(() => document.querySelector('.document-toc a:last-child').getAttribute('aria-current') === 'location');
  await goto('/privacy/'); await page.evaluate(() => scrollTo(0,document.body.scrollHeight/2));
  await page.waitForFunction(() => document.querySelector('.motion-reading-progress').value > 0);
  await goto('/contact/?topic=اختبار%20موضوع');
  assert.equal(await page.locator('select[name=topic]').inputValue(),'اختبار موضوع');
  await page.locator('button[type=submit]').click();
  assert.equal(await page.locator('[aria-invalid=true]').count(),2);
  assert.equal(await page.locator('#contact-status').textContent(),'');

  // Preference changes during work finish meaningful state and cancel animations.
  await goto('/kernel/'); await page.locator('[data-kernel-play]').click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => document.querySelector('[data-kernel-sequence]').dataset.running === 'false');
  assert.match(await page.locator('[data-kernel-output]').textContent(),/بيانات منقحة/);
  for (const route of ['/kernel/','/products/firewall/','/products/human-gate/','/products/secure-chat/','/pillars/privacy/','/solutions/healthcare/','/pricing/','/privacy/']) {
    await goto(route); await page.evaluate(() => scrollTo(0,innerHeight));
    if (await page.locator('[data-redaction-run]').count()) { await page.locator('[data-redaction-run]').click(); assert.equal(await page.locator('[data-redaction-value]').textContent(),'[بيانات منقحة]'); }
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length),0,route);
  }

  const nojs = await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:900}});
  const staticPage = await nojs.newPage();
  for (const route of ['/kernel/','/pillars/privacy/','/privacy/','/terms/','/knowledge/ai-risk-assessment/','/compliance/','/trust/','/services/']) {
    await staticPage.goto(base+route);
    assert.equal(await staticPage.locator('h1').isVisible(),true,route);
    assert.equal(await staticPage.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,route);
    if (['/privacy/','/terms/'].includes(route)) { await staticPage.locator('.document-toc summary').click(); assert((await staticPage.locator('.document-toc a:visible').count()) > 0); }
  }
  // Optional same-run baseline: exact legal body text remains unchanged.
  const legalText = () => { const main=document.querySelector('main').cloneNode(true);main.querySelectorAll('nav,.section-compass,progress,.motion-reading-meter').forEach(el=>el.remove());return main.textContent.replace(/\s+/g,' ').trim(); };
  let legalComparisons = 0;
  for (const route of ['privacy','terms']) {
    const baseline=`/tmp/brightai-motion-baseline/${route}.html`;
    if (!fs.existsSync(baseline)) continue;
    await staticPage.setContent(fs.readFileSync(baseline,'utf8'));
    const before=await staticPage.evaluate(legalText);
    await staticPage.goto(`${base}/${route}/`);
    assert.equal(await staticPage.evaluate(legalText),before,`${route}: legal wording`);
    legalComparisons++;
  }
  assert.deepEqual(errors,[]);
  const result={status:'PASS',kernel:'PASS',packetSelection:'PASS',redaction:'PASS',approval:'PASS',risk:'PASS',namedTransitions:'PASS (native pagereveal verified)',mapFocus:'PASS',spotlight:'PASS',chatTyping:'PASS',checklist:'PASS',readingTOC:'PASS',contactInvalid:'PASS',dynamicReducedMotion:'PASS',noJS:'PASS',legalText:legalComparisons === 2 ? 'PASS (same-run baseline)' : 'NOT RUN (same-run baseline unavailable)',pageErrors:errors};
  fs.writeFileSync('Audit/2026-10-31-advanced-motion-verification.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
