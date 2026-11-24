import assert from 'node:assert/strict';
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const origin = new URL(process.env.BRIGHTAI_SC_BROWSER_ORIGIN ?? 'http://127.0.0.1:45438');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname) && ['http:', 'https:'].includes(origin.protocol), 'Local Astro instance required');

const browser = await chromium.launch({ executablePath: process.env.BRIGHTAI_CHROME_EXECUTABLE, headless: true });
try {
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  const base = origin.origin;
  const user = { id: '5f34639d-dcce-4610-bcf1-5236759261dc', email: 'synthetic@example.invalid' };
  const tenant = { tenant_id: '38657c24-2cb0-4a00-acde-9fc538171ec8', name: 'Synthetic', role: 'OWNER' };
  const calls = [], errors = [];
  page.on('request', request => calls.push({ url: request.url(), body: request.postData() }));
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === '/auth/api/get-session/') return route.fulfill({ json: { user, session: { userId: user.id, id: user.id } } });
    if (url.pathname === '/auth/api/token/') return route.fulfill({ json: { token: 'synthetic-browser-token' } });
    if (url.pathname === '/app/api/kernel/') return route.fulfill({ json: { tenant, memberships: [tenant], products: [{ slug: 'secure-chat', enabled: true }] } });
    if (url.pathname === '/app/api/secure-chat/models/') return route.fulfill({ json: { available: true, models: [{ id: 'fixture', ready: true }], message: 'Synthetic available' } });
    if (url.pathname === '/app/api/secure-chat/messages/') return route.fulfill({ json: { reply: 'BROWSEROUTCANARY <b>literal</b>', submittedText: 'BROWSERINCANARY', usage: null } });
    return route.continue();
  });
  const response = await page.goto(base + '/app/secure-chat/');
  assert.equal(response.status(), 200);
  const headers = await response.allHeaders();
  assert.match(headers['content-security-policy'], /script-src 'self'; connect-src 'self'/);
  assert.match(headers['cache-control'], /no-store/);
  assert.equal(await page.locator('[data-monitoring-gate], script[src="/measurement.mjs"]').count(), 0);
  assert.equal(await page.evaluate(() => typeof window.gtag), 'undefined');
  await page.locator('#chat-message').fill('BROWSERINCANARY');
  await page.locator('[data-synthetic]').check();
  await page.locator('[data-send]').click();
  await page.locator('[data-messages] [data-role=assistant]').waitFor();
  assert.equal(await page.locator('[data-messages] [data-role=assistant]').textContent(), 'BROWSEROUTCANARY <b>literal</b>');
  assert.equal(await page.locator('[data-messages] b').count(), 0);
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'BROWSEROUTCANARY' })));
  await page.waitForTimeout(250);
  assert.deepEqual(calls.filter(call => /CANARY/.test(JSON.stringify(call))).map(call => new URL(call.url).pathname), ['/app/api/secure-chat/messages/']);
  assert.ok(calls.every(call => new URL(call.url).origin === base && !/\/api\/observability\/?|measurement\.mjs/.test(call.url)));
  assert.ok(!JSON.stringify(await page.evaluate(() => [Object.entries(localStorage), Object.entries(sessionStorage), location.href])).includes('CANARY'));
  assert.deepEqual(errors, []);
  console.log('PASS Chrome: CSP, no browser telemetry or external requests, JSON-only prompt and text-only rendering');
} finally { await browser.close(); }
