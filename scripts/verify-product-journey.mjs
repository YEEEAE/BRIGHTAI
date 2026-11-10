// Local real-browser navigation only; no identity/entitlement/provider is fabricated.
// Run after npm run build. Uses an already installed Playwright via the documented override.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { productNavigation, productEntryPath } from '../src/shared/product-navigation.mjs';
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const base = 'http://127.0.0.1:4412';
const output = new URL('../Audit/p12-product-journey-2026-11-10/', import.meta.url);
await mkdir(output, { recursive: true });
const child = spawn(process.execPath, ['scripts/server.mjs'], {
  cwd: new URL('../', import.meta.url),
  env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: '4412', NODE_ENV: 'production', AIGAS_APP_ENABLED: 'true' },
  stdio: 'ignore',
});
let browser;
const results = [];
try {
  for (let attempt = 0; ; attempt++) {
    try { await fetch(base); break; } catch { if (attempt > 50) throw new Error('Local server unavailable'); await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  // Do not send analytics or other remote requests during local navigation checks.
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const references = new Map();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/products/`);
    assert.equal(await page.locator('.catalog-item').count(), 5);
    assert.equal(await page.locator('.catalog-item a a, .catalog-item a button, .catalog-item .catalog-availability').count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Catalog overflow ${width}`);
    for (const product of productNavigation) {
      const indexLink = page.locator('.product-index a').filter({ hasText: product.name });
      assert.equal(await indexLink.getAttribute('href'), productEntryPath(product.slug));
      assert.equal(await page.locator(`#catalog-${product.slug} .journey-entry`).getAttribute('href'), productEntryPath(product.slug));
      await indexLink.click();
      await page.waitForURL(`${base}${productEntryPath(product.slug)}`);
      assert.equal(await page.locator('[data-kernel]').getAttribute('data-return-to'), product.workspacePath);
      await page.goBack();
      await page.waitForURL(`${base}/products/`);
      await page.locator(`.catalog-row[href="${product.publicPath}"]`).click();
      await page.waitForURL(`${base}${product.publicPath}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${product.slug} overflow ${width}`);
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
      await page.getByRole('link', { name: `الدخول إلى مساحة ${product.name}`, exact: true }).click();
      await page.waitForURL(`${base}${productEntryPath(product.slug)}`);
      assert.equal(await page.locator('[data-kernel]').getAttribute('data-return-to'), product.workspacePath);
      await page.reload();
      assert.equal(await page.locator('[data-kernel]').getAttribute('data-return-to'), product.workspacePath);
      await page.goBack();
      await page.waitForURL(`${base}${product.publicPath}`);
      await page.goto(`${base}${product.workspacePath}`);
      assert.equal(await page.locator('.journey-nav a[href="' + product.publicPath + '"]').count(), 2);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Workspace overflow ${product.slug}/${width}`);
      await page.locator('.journey-nav a[href="/products/"]').click();
      await page.waitForURL(`${base}/products/`);
    }
    await page.screenshot({ path: new URL(`catalog-${width}.png`, output).pathname, fullPage: true });
    results.push({ name: `RTL click/reload/back/return five products ${width}px`, status: 'PASS' });
  }
  // Scan rendered anchors from every public product and every workspace shell.
  for (const path of ['/products/', ...productNavigation.flatMap(p => [p.publicPath, p.workspacePath]), '/app/kernel/']) {
    await page.goto(base + path);
    const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.href));
    for (const link of links) {
      const url = new URL(link);
      if (url.origin !== base || references.has(url.pathname)) continue;
      const response = await fetch(url, { redirect: 'follow' });
      references.set(url.pathname, response.status);
      assert.equal(response.status, 200, `${path} -> ${url.pathname}`);
    }
  }
  results.push({ name: 'Rendered same-origin link scan', status: 'PASS', checked: references.size });
  for (const product of productNavigation) {
    const slug = product.slug;
    const api = { firewall: 'rules', ledger: 'events', 'human-gate': 'requests', 'risk-engine': 'assets', 'secure-chat': 'models' }[slug];
    for (const token of [null, 'invalid.expired.token']) {
      const response = await fetch(`${base}/app/api/${slug}/${api}/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      assert.equal(response.status, token ? 503 : 401, `${slug}: reject credentials without Auth configuration`);
      const body = await response.json();
      assert.equal(body.code, token ? 'AUTH_SETUP_REQUIRED' : 'UNAUTHORIZED');
      assert.match(response.headers.get('cache-control'), /private.*no-store/);
    }
  }
  results.push({ name: 'Five API guards: missing credentials 401; token without Auth configuration 503 (not a signed expiry test)', status: 'PASS' });
  for (const path of ['/auth/sign-up/', '/app/kernel/']) {
    const response = await fetch(base + path);
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
  }
  await page.goto(`${base}/app/kernel/?returnTo=${encodeURIComponent('https://example.com/')}`);
  assert.equal(await page.locator('[data-kernel]').getAttribute('data-return-to'), null);
  assert.equal(new URL(page.url()).origin, base);
  await page.goto(`${base}/products/`);
  await page.locator('.catalog-row').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(`${base}/products/firewall/`);
  results.push({ name: 'External returnTo ignored; keyboard Enter opens product', status: 'PASS' });
  // Chrome reports a native cross-document transition abort when navigating
  // between public pages (opted in) and app pages (not opted in). Keep every
  // occurrence in evidence; other script errors still fail this check. P23 owns motion.
  const transitionWarnings = errors.filter(message => message === 'Transition was aborted because of invalid state. ViewTransition opt-in disabled');
  assert.deepEqual(errors.filter(message => !transitionWarnings.includes(message)), [], 'Browser script errors');
  await writeFile(new URL('browser-results.json', output), JSON.stringify({ environment: 'local Node22 / Chrome headless / no DB or Auth configuration', results, transitionWarnings, links: Object.fromEntries(references), authenticatedBrowser: 'NOT RUN: no authorized session in isolated local environment', signedExpiredSession: 'NOT RUN: invalid-token rejection is separate evidence', liveDeployment: 'NOT RUN' }, null, 2));
  console.log(JSON.stringify({ results, transitionWarnings: transitionWarnings.length, browserErrors: errors.length - transitionWarnings.length }, null, 2));
} finally {
  await browser?.close();
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM');
    await exited;
  }
}
