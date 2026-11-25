import assert from 'node:assert/strict';

const origin = new URL(process.argv[2]).origin;
assert.equal(new URL(origin).hostname, '127.0.0.1');
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--disable-background-networking', '--disable-component-update', '--no-proxy-server'],
});
const results = [];
const clientErrors = [];
const sandboxRequests = [];
async function open(path, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce',
    ...options,
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === '/api/public-demo/groq-sandbox/') sandboxRequests.push(url.pathname);
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => clientErrors.push(error.message));
  await page.goto(origin + path);
  return page;
}
async function run(id, path, check, options) {
  let page;
  try {
    page = await open(path, options);
    await check(page);
    results.push({ id, path, pass: true });
  } catch (error) {
    results.push({ id, path, pass: false, error: error.message });
  } finally {
    await page?.context().close();
  }
}
const css = (page, selector) => page.locator(selector);
async function status(page, selector, pattern) {
  await page.waitForFunction(([selector, regex]) => new RegExp(regex).test(document.querySelector(selector)?.textContent), [selector, pattern.source]);
}

try {
  for (const js of [true, false]) {
    for (const path of ['/contact/', '/pricing/']) {
      await run(`UX-02/${js ? 'js' : 'no-js'}`, path, async page => {
        const link = css(page, 'main a[href="/products/#lab"]').first();
        await link.focus();
        await page.keyboard.press('Enter');
        await page.waitForURL(origin + '/products/#lab');
        await page.waitForFunction(() => document.activeElement?.id === 'lab');
      }, { javaScriptEnabled: js });
    }
  }
  await run('DEM-01', '/kernel/#lab', async page => {
    await css(page, '[data-kernel-form] button').click();
    await status(page, '[data-kernel-decision]', /REDACT/);
  });
  await run('DEM-02+UX-06', '/products/firewall/#lab', async page => {
    await css(page, '[data-demo-example]').filter({ hasText: 'REDACT' }).click();
    await css(page, '[data-check]').click();
    await status(page, '[data-demo-workspace] [data-decision]', /REDACT/);
    await page.goto(origin + '/products/');
    const resume = css(page, '[data-lab-resume]');
    await resume.waitFor();
    assert.equal(await resume.getAttribute('href'), '/products/firewall/#lab');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('aigas:lab:last')), 'firewall');
  });
  await run('DEM-03+UX-04', '/products/secure-chat/#lab', async page => {
    const count = sandboxRequests.length;
    await css(page, '[data-chat-demo] [data-scenario]').first().click();
    await css(page, '[data-chat-demo] button[type=submit]').click();
    await status(page, '[data-thread]', /محاكاة/);
    await css(page, '[data-live]').click();
    assert.match(await css(page, '[data-consent]').innerText(), /خادم BRIGHT AI.*Groq/s);
    await css(page, '[data-consent] [data-cancel]').click();
    await status(page, '[data-live-status]', /أُلغيت الموافقة/);
    assert.equal(sandboxRequests.length, count);
  });
  await run('DEM-04', '/products/risk-engine/#lab', async page => {
    const score = await css(page, '[data-residual]').textContent();
    await css(page, '[data-field=control]').selectOption('human');
    await page.waitForFunction(initial => document.querySelector('[data-residual]').textContent !== initial, score);
  });
  await run('DEM-05', '/products/human-gate/#lab', async page => {
    await css(page, '#hg-reason').fill('سبب اصطناعي للمراجعة');
    await css(page, '[data-act=APPROVE]').click();
    await status(page, '[data-hg-demo] [data-feedback]', /مقدم الطلب|نفسه/);
    await css(page, '[data-persona]').selectOption('reviewer');
    await css(page, '[data-act=APPROVE]').click();
    await status(page, '[data-hg-demo] [data-feedback]', /APPROVED/);
  });
  await run('DEM-06', '/products/ledger/#lab', async page => {
    await css(page, '[data-action=add]').click();
    await css(page, '[data-action=verify]').click();
    await status(page, '#chain-status', /VALID/);
    await css(page, '[data-action=alter]').click();
    await css(page, '[data-action=verify]').click();
    await status(page, '#chain-status', /ALTERED/);
  });
  await run('DEM-07+GAP-11', '/services/#workshop', async page => {
    await css(page, '#workshop a[href="/contact/#workshop"]').click();
    await page.waitForURL(origin + '/contact/#workshop');
    await css(page, '#copy-draft').click();
    await status(page, '#contact-status', /نُسخت المسودة فقط/);
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /الاستفسار عن ورشة/);
    const channels = await css(page, '[data-measure-channel]').evaluateAll(links => links.map(link => new URL(link.href)));
    assert.equal(channels.length, 2);
    for (const link of await css(page, '[data-measure-channel]').all()) {
      assert.doesNotMatch(await link.getAttribute('href'), /[?#]/);
    }
  }, { permissions: ['clipboard-read', 'clipboard-write'] });
  await run('COMPLAINT-FLOW', '/products/#lab', async page => {
    await css(page, '.hub-quickstart').click();
    for (const action of ['redact', 'draft', 'assess']) {
      await css(page, `[data-journey-action=${action}]`).click();
      await css(page, '[data-journey-next]').click();
    }
    for (const action of ['submit', 'edit', 'approve']) {
      await css(page, `[data-journey-action=${action}]`).click();
    }
    await css(page, '[data-journey-next]').click();
    await css(page, 'a[href="/contact/#workshop-lab"]').click();
    await page.waitForURL(origin + '/contact/#workshop-lab');
    await css(page, '#return-to-result').click();
    await page.waitForURL(origin + '/products/ledger/complaint/#lab');
    await css(page, '[data-ledger-events] li').first().waitFor();
  });
  await run('DEM-08+UX-07', '/auth/sign-up/', async page => {
    assert.equal(await css(page, 'main form').count(), 0);
    assert.ok(await css(page, 'main a[href="/contact/"]').count());
    for (const path of ['/app/', '/app/trial/']) {
      assert.equal((await page.goto(origin + path)).status(), 503);
    }
  });
} finally {
  await browser.close();
}
const transitionWarnings = clientErrors.filter(message => message ===
  'Transition was aborted because of invalid state. ViewTransition opt-in disabled').length;
const unexpectedErrors = clientErrors.filter(message => message !==
  'Transition was aborted because of invalid state. ViewTransition opt-in disabled');
console.log(JSON.stringify({ browser: 'Chrome headless', viewport: [390, 844], results, transitionWarnings, unexpectedErrors, sandboxRequests }, null, 2));
if (results.some(result => !result.pass) || unexpectedErrors.length || sandboxRequests.length) process.exitCode = 1;
