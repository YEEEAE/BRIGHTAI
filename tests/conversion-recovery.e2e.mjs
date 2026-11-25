// Run after npm run build. The only recipient is a disposable HTTPS inbox on loopback.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:https';
import { createServer as createTcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const directory = await mkdtemp(join(tmpdir(), 'brightai-conversion-'));
const cert = join(directory, 'localhost.crt');
const key = join(directory, 'localhost.key');
const address = 'conversion-fixture@example.test';
const message = 'Synthetic conversion request marker';
const token = 'disposable-loopback-relay';
const attempts = [];
let inbox, app, browser;

try {
  execFileSync('openssl', ['req', '-x509', '-nodes', '-newkey', 'rsa:2048', '-days', '1',
    '-keyout', key, '-out', cert, '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
  inbox = createServer({ key: await readFile(key), cert: await readFile(cert) }, async (request, response) => {
    try {
      assert.equal(request.url, '/inbox');
      assert.equal(request.headers.authorization, 'Bearer ' + token);
      let body = '';
      for await (const chunk of request) body += chunk;
      const data = JSON.parse(body);
      assert.equal(request.headers['idempotency-key'], data.submissionId);
      const record = join(directory, data.submissionId + '.json');
      attempts.push(data.submissionId);
      if (attempts.length === 1) {
        await writeFile(record, body, { flag: 'wx' });
        response.writeHead(202, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'pending', submissionId: data.submissionId }));
        return;
      }
      assert.equal(body, await readFile(record, 'utf8'));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ status: 'received', submissionId: data.submissionId }));
    } catch {
      response.writeHead(500).end();
    }
  }).listen(0, '127.0.0.1');
  await once(inbox, 'listening');

  const reservation = createTcpServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const origin = 'http://127.0.0.1:' + port;
  app = spawn(process.execPath, ['scripts/server.mjs'], {
    env: {
      PATH: process.env.PATH, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
      AIGAS_APP_ENABLED: 'false', NODE_EXTRA_CA_CERTS: cert,
      BRIGHTAI_INQUIRY_RELAY_URL: 'https://127.0.0.1:' + inbox.address().port + '/inbox',
      BRIGHTAI_INQUIRY_RELAY_TOKEN: token,
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const [started] = await Promise.race([once(app.stdout, 'data'), once(app, 'exit')]);
  assert.match(String(started), /BRIGHTAI listening/);

  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  const thirdParty = [];
  await page.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).origin === origin) return route.continue();
    thirdParty.push(request.url() + ' ' + (request.postData() || ''));
    return route.abort();
  });
  const products = ['firewall', 'risk-engine', 'human-gate', 'ledger', 'secure-chat'];
  const routes = ['/products/', ...products.map(slug => '/products/' + slug + '/'), '/kernel/', '/trust/', '/demo/governance/', '/demo/kernel/', ...products.map(slug => '/demo/' + slug + '/')];
  for (const width of [320, 375, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      assert.equal((await page.goto(origin + path)).status(), 200);
      await page.getByRole('link', { name: 'طلب تجربة مؤسسية', exact: true }).first().click();
      await page.waitForURL('**/request-access/**');
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://brightai.live/request-access/');
      assert.equal(await page.getByRole('heading', { name: 'طلب تجربة مؤسسية' }).isVisible(), true);
      assert.equal(await page.locator('#trial-option').isHidden(), true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  for (const path of ['/contact/', '/request-access/']) {
    const alias = await fetch(origin + path + 'index.html', { redirect: 'manual' });
    assert.equal(alias.status, 301);
    assert.equal(alias.headers.get('location'), path);
  }
  await page.goto(origin + '/demo/governance/');
  const summary = page.locator('#governance-summary-export');
  await summary.waitFor();
  assert.equal(await summary.isDisabled(), true);
  await page.locator('#governance-consent').check();
  const downloaded = page.waitForEvent('download');
  await summary.click();
  const download = await downloaded;
  assert.equal(download.suggestedFilename(), 'brightai-governance-summary.txt');
  const summaryText = await readFile(await download.path(), 'utf8');
  assert.match(summaryText, /بيانات اصطناعية/);
  assert.equal(attempts.length, 0);
  await page.getByRole('link', { name: 'طلب تجربة مؤسسية', exact: true }).click();
  await page.getByRole('link', { name: 'جهّز طلب التواصل' }).click();
  await page.waitForURL('**/contact/**');
  const draft = page.locator('#contact-draft');
  await draft.fill(message);
  await page.locator('#inquiry-email').fill(address);
  assert.equal(attempts.length, 0);
  const submit = page.locator('#inquiry-submit');
  await submit.click();
  const feedback = page.locator('#inquiry-feedback');
  await feedback.filter({ hasText: 'تعذر تأكيد وصول' }).waitFor();
  assert.equal(await draft.inputValue(), message);
  await page.getByRole('button', { name: 'أعد المحاولة' }).click();
  await feedback.filter({ hasText: 'وصل استفسارك' }).waitFor();
  assert.equal(await draft.inputValue(), '');
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0], attempts[1]);
  const stored = JSON.parse(await readFile(join(directory, attempts[0] + '.json'), 'utf8'));
  assert.deepEqual(stored, { submissionId: attempts[0], email: address, message });
  const exposed = JSON.stringify([page.url(), thirdParty, await page.evaluate(() => window.dataLayer)]);
  assert.ok(!exposed.includes(address) && !exposed.includes(message) && !exposed.includes(attempts[0]));
  assert.equal(await page.locator('a[href^="mailto:"]').count() > 0, true);
  assert.equal(await page.locator('a[href^="https://wa.me/"]').count() > 0, true);
  console.log('PASS: 90 CTA journeys, canonical and redirect, closed trial, consent-only summary, explicit inquiry, durable loopback receipt, retry, URL and analytics privacy.');
} finally {
  await browser?.close();
  if (app && app.exitCode === null && app.signalCode === null) {
    app.kill();
    await once(app, 'exit');
  }
  if (inbox?.listening) await new Promise(resolve => inbox.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
