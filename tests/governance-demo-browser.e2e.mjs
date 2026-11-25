import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:4329';
const server = spawn(process.execPath, ['scripts/server.mjs'], {
  env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: '4329' }, stdio: 'ignore',
});
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(origin + '/demo/governance/')).ok) break; } catch {}
    assert(attempt < 50 && server.exitCode === null, 'Local built server must start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = [];
  page.on('request', request => requests.push(request));
  const visit = async fragment => {
    const response = await page.goto(origin + '/demo/governance/' + fragment) ?? await page.reload();
    assert.equal(response?.status(), 200);
    await page.locator(fragment).waitFor();
  };
  const nav = key => page.locator(`nav a[href="#${key}"]`);
  const submit = action => page.locator(`form[data-action="${action}"] button`).click();

  await visit('#firewall');
  await submit('check');
  assert.match(await page.locator('#firewall-result').innerText(), /مسموح/);
  await visit('#risk-engine');
  await submit('assess');
  assert.match(await page.locator('#risk-result').innerText(), /منخفض/);
  await visit('#human-gate');
  await submit('review');
  assert.match(await page.locator('#review-result').innerText(), /معتمد/);
  await visit('#ledger');
  await submit('record');
  assert.equal(await page.locator('#governance-evidence li').count(), 1);

  await nav('inventory').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.closest('section')?.id === 'inventory');
  await page.locator('#asset-template').selectOption('intake');
  await submit('add');
  assert.match(await page.locator('#governance-detail').innerText(), /مصنّف الطلبات/);
  await nav('policies').click();
  await page.locator('#policy-pack').selectOption('supervision');
  await submit('policy');
  await nav('firewall').click();
  await submit('check');
  assert.match(await page.locator('#firewall-result').innerText(), /يتطلب مراجعة/);
  await nav('human-gate').click();
  await page.locator('#review-source').selectOption('4');
  await submit('review');
  await nav('firewall').click();
  assert.match(await page.locator('#firewall-result').innerText(), /معتمد افتراضيًا/);
  await nav('ledger').click();
  assert.equal(await page.locator('#governance-evidence li').count(), 4);
  assert.match(await page.locator('#governance-evidence li').last().innerText(), /مرجع #4/);

  const other = await context.newPage();
  await other.goto(origin + '/demo/governance/#ledger');
  await other.locator('#ledger').waitFor();
  assert.equal(await other.locator('#governance-asset option').count(), 1);
  assert.equal(await other.locator('#governance-evidence li').count(), 0);
  await other.close();

  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const results = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(results.violations.map(item => item.id), []);
  }
  assert(await page.locator('#governance-export').isDisabled());
  await page.locator('#governance-consent').check();
  const saved = page.waitForEvent('download');
  await page.locator('#governance-export').click();
  assert.equal((await saved).suggestedFilename(), 'brightai-governance-demo.json');
  await page.locator('#governance-clear').click();
  assert(await page.locator('#governance-lab').isHidden());
  assert.equal(await page.locator('#governance-evidence li').count(), 0);
  await page.clock.install();
  await page.locator('#governance-start').click();
  await page.clock.fastForward(30 * 60 * 1000);
  assert(await page.locator('#governance-lab').isHidden());
  assert.match(await page.getByRole('status').innerText(), /انتهت مدة الجلسة/);
  assert.deepEqual(requests.filter(r => !r.url().startsWith(origin + '/') || ['fetch', 'xhr', 'ping'].includes(r.resourceType())), []);
  console.log('PASS: four direct products, integration, isolation, consent, reset, expiry, no network operations, keyboard, 320/768/1440 and axe');
} finally {
  await browser?.close();
  server.kill();
}
