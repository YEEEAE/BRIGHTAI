import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { readdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const probe = createServer().listen(0, '127.0.0.1');
await once(probe, 'listening');
const { port } = probe.address();
await new Promise(resolve => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/server.mjs'], {
  env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'production', AIGAS_APP_ENABLED: 'true' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
let browser;
const reportPath = '/api/security/csp-report/';

function assertHeaders(headers, privateSurface = false) {
  const csp = headers['content-security-policy'];
  assert.ok(csp);
  assert.equal(headers['content-security-policy-report-only'], undefined);
  assert.doesNotMatch(csp, /unsafe-eval|script-src[^;]*unsafe-inline|style-src [^;]*unsafe-inline/);
  assert.match(csp, /frame-src 'none'/);
  assert.match(csp, new RegExp(`frame-ancestors '${privateSurface ? 'none' : 'self'}'`));
  assert.ok(csp.includes(`report-uri ${reportPath}`));
  assert.equal(headers['x-frame-options'], privateSurface ? 'DENY' : 'SAMEORIGIN');
  assert.equal(headers['referrer-policy'], privateSurface ? 'no-referrer' : 'strict-origin-when-cross-origin');
  assert.equal(headers['permissions-policy'], 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  assert.equal(headers['cross-origin-resource-policy'], 'same-origin');
  assert.equal(headers['cross-origin-opener-policy'], 'same-origin');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['strict-transport-security'], 'max-age=15552000');
  assert.equal(headers['access-control-allow-origin'], undefined);
  assert.equal(headers['access-control-allow-credentials'], undefined);
  if (privateSurface) assert.match(headers['cache-control'], /no-store/);
}

try {
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    ready = Boolean(await fetch(origin).catch(() => null));
    if (!ready) await delay(50);
  }
  assert.ok(ready, 'Node origin unavailable');
  assert.equal((await fetch(origin)).headers.has('strict-transport-security'), false);

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  // Simulate the HTTPS proxy header. All traffic stays local; GA4 is intercepted.
  const context = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-proto': 'https' } });
  let gaLoads = 0;
  let gaCollections = 0;
  await context.route(/^https:\/\//, async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js') {
      gaLoads++;
      return route.fulfill({
        contentType: 'application/javascript',
        body: "fetch('https://region1.google-analytics.com/g/collect', { mode: 'no-cors' });",
      });
    }
    if (url.hostname === 'region1.google-analytics.com' && url.pathname === '/g/collect') {
      gaCollections++;
      return route.fulfill({ status: 204 });
    }
    return route.abort();
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.cspViolations = [];
    addEventListener('securitypolicyviolation', event => window.cspViolations.push([event.effectiveDirective, event.blockedURI, event.lineNumber]));
  });

  const resources = new Set();
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin !== origin || !response.ok()) return;
    if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/fonts/')) {
      resources.add(response.request().resourceType());
    }
  });
  const checkPage = async (path, privateSurface = false, status = 200) => {
    const response = await page.goto(origin + path, { waitUntil: 'load' });
    assert.equal(response.status(), status, path);
    assertHeaders(await response.allHeaders(), privateSurface);
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(await page.evaluate(() => window.cspViolations), [], path);
  };

  await checkPage('/?code=synthetic-marker&utm_source=fixture');
  const config = await page.evaluate(() => window.dataLayer.filter(entry => entry[0] === 'config').map(entry => entry[2]));
  assert.equal(config.length, 1);
  assert.equal(new URL(config[0].page_location).search, '?utm_source=fixture');
  assert.equal(gaLoads, 1);
  assert.equal(gaCollections, 1);
  for (const type of ['script', 'stylesheet', 'font']) assert.ok(resources.has(type), type);

  const files = await readdir('dist/client', { recursive: true });
  const pages = files.filter(file => file === '404.html' || /\/index\.html$/.test(file));
  for (const file of pages) {
    const path = file === '404.html' ? '/404/' : '/' + file.slice(0, -'index.html'.length);
    await checkPage(path, false, file === '404.html' ? 404 : 200);
  }
  await checkPage('/auth/sign-up/', true);
  await checkPage('/app/firewall/', true);
  const gaBeforeChat = gaLoads;
  await checkPage('/app/secure-chat/', true);
  assert.equal(gaLoads, gaBeforeChat);
  assert.equal(await page.evaluate(() => typeof window.gtag), 'undefined');

  for (const method of ['GET', 'POST', 'OPTIONS']) {
    const response = await page.request.fetch(origin + '/app/api/trial/', {
      method, headers: { Origin: 'https://cross-origin.invalid' },
      ...(method === 'POST' ? { data: { operation: 'start' } } : {}),
    });
    assert.ok([401, 403, 404, 405, 503].includes(response.status()), method);
    assertHeaders(response.headers(), true);
  }

  const received = page.waitForResponse(response => new URL(response.url()).pathname === reportPath);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.unapprovedScriptRan = true';
    document.head.append(script);
  });
  assert.equal((await received).status(), 204);
  assert.equal(await page.evaluate(() => window.unapprovedScriptRan), undefined);

  for (const [headers, data, status] of [
    [{ 'content-type': 'text/plain' }, '{}', 415],
    [{ 'content-type': 'application/csp-report', 'sec-fetch-site': 'cross-site' }, '{}', 403],
    [{ 'content-type': 'application/csp-report' }, '{', 400],
    [{ 'content-type': 'application/csp-report' }, 'x'.repeat(8193), 413],
  ]) {
    const response = await page.request.post(origin + reportPath, { headers: { Origin: origin, ...headers }, data });
    assert.equal(response.status(), status);
  }
  console.log(`PASS: ${pages.length + 1} built documents, auth, app, Secure Chat, API GET/POST/OPTIONS, GA4 fixture, Astro assets, CSP reporting`);
} finally {
  await browser?.close();
  server.kill();
  await once(server, 'close');
}
