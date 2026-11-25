import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const output = process.env.UX_OUTPUT;
const baseline = process.env.UX_BASELINE === '1';
const widths = [320, 375, 768, 1440];
const products = ['firewall', 'risk-engine', 'human-gate', 'ledger', 'secure-chat'];
const paths = ['/', '/products/', ...products.map(slug => '/products/' + slug + '/'),
  '/kernel/', '/pricing/', '/trust/', '/contact/', '/ux-audit-missing/',
  '/auth/sign-in/', '/auth/sign-up/', '/app/', '/app/trial/'];
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
const failures = [];

try {
  if (output) await mkdir(output, { recursive: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  for (const path of paths) {
    const page = await context.newPage();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(new URL(path, origin).href);
      const main = page.getByRole('main');
      const heading = main.getByRole('heading', { level: 1 });
      const layout = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        direction: getComputedStyle(document.documentElement).direction,
        overflow: document.documentElement.scrollWidth - innerWidth,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      }));
      const row = { path, width, status: response.status(), ...layout, h1: await heading.count() };
      if (output) {
        const name = path.split('/').filter(Boolean).join('-') || 'home';
        await page.screenshot({ path: join(output, name + '-' + width + '.png'), animations: 'disabled', timeout: 15000 });
      }
      await page.keyboard.press('Tab');
      if (await page.locator(':is(.skip-link, .ds-skip):focus').count()) await page.keyboard.press('Enter');
      row.skip = await main.evaluate(node => node === document.activeElement);
      if (row.status === 503 && path.startsWith('/app/')) {
        row.skip = null;
        row.recoveryFocused = await page.getByRole('link', { name: 'خيارات الوصول' }).evaluate(node => node === document.activeElement);
      }
      if (width === 375) {
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        row.axe = axe.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
        const snapshot = await main.ariaSnapshot();
        if (output) await writeFile(join(output, (path.split('/').filter(Boolean).join('-') || 'home') + '.aria.yml'), snapshot);
      }
      const expectedStatus = path === '/ux-audit-missing/' ? [404] : path.startsWith('/app/') ? [200, 503] : [200];
      if (!baseline && (!expectedStatus.includes(row.status) || row.overflow > 1 || row.h1 !== 1 || !(row.skip ?? row.recoveryFocused) || row.direction !== 'rtl' ||
          !row.lang.startsWith('ar') || row.scrollBehavior !== 'auto' || row.axe?.length)) failures.push(row);
      results.push(row);
    }
    await page.close();
  }

  if (!baseline) {
    const page = await context.newPage();
    const capture = async (locator, name) => {
      if (output) await locator.screenshot({ path: join(output, name + '.png'), animations: 'disabled' });
    };
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(new URL('/', origin).href);
    const menu = page.locator('[data-primary-navigation] summary');
    await menu.press('Enter');
    await page.locator('[data-primary-navigation] summary[aria-expanded="true"]').waitFor();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-primary-navigation] a:focus').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert.equal(await menu.evaluate(node => document.activeElement === node), true);

    await page.goto(new URL('/products/', origin).href);
    for (const stage of ['demo', 'preview', 'pilot', 'production']) {
      assert.equal(await page.locator('[data-release-legend] [data-release-stage="' + stage + '"]').count(), 1);
    }
    await capture(page.locator('[data-release-legend]'), 'release-stages');
    for (const slug of products) {
      await page.goto(new URL('/products/' + slug + '/', origin).href);
      assert.equal(await page.locator('.lab-header [data-release-stage="demo"]').count(), 1);
      assert.equal(await page.getByRole('link', { name: 'اطلب الوصول لهذا المنتج' }).count(), 1);
    }
    await page.goto(new URL('/kernel/', origin).href);
    await page.getByRole('link', { name: 'ابدأ محاكاة السياسة' }).press('Enter');
    assert.equal(await page.getByRole('combobox', { name: 'الأصل الاصطناعي' }).evaluate(node => document.activeElement === node), true);
    await page.getByRole('combobox', { name: 'سياسة المثال' }).selectOption('deny');
    await page.getByRole('button', { name: /طبّق سياسة المثال/ }).press('Enter');
    assert.match(await page.locator('[data-kernel-decision]').textContent(), /BLOCK/);

    await page.goto(new URL('/contact/', origin).href);
    const draft = page.getByRole('textbox', { name: 'مسودة الاستفسار' });
    const copy = page.getByRole('button', { name: 'انسخ المسودة' });
    const state = page.getByRole('status').and(page.locator('#contact-status'));
    await copy.press('Enter');
    assert.equal(await state.getAttribute('data-state'), 'empty');
    await capture(state, 'contact-empty');
    assert.equal(await draft.evaluate(node => document.activeElement === node), true);
    await draft.fill('مسودة اختبار اصطناعية');
    await page.evaluate(() => {
      window.finishCopy = undefined;
      navigator.clipboard.writeText = () => new Promise(resolve => { window.finishCopy = resolve; });
    });
    await copy.press('Enter');
    assert.equal(await state.getAttribute('data-state'), 'loading');
    await capture(state, 'contact-loading');
    await page.evaluate(() => window.finishCopy());
    await page.locator('#contact-status[data-state="success"]').waitFor();
    assert.equal(await state.getAttribute('data-state'), 'success');
    await capture(state, 'contact-success');
    for (const [name, expected] of [['NotAllowedError', 'denied'], ['UnknownError', 'error']]) {
      await page.evaluate(name => {
        navigator.clipboard.writeText = () => Promise.reject(new DOMException('', name));
      }, name);
      await copy.press('Enter');
      await page.locator('#contact-status[data-state="' + expected + '"]').waitFor();
      await capture(state, 'contact-' + expected);
    }
    await context.setOffline(true);
    await page.locator('#contact-network[data-state="offline"]').waitFor();
    await capture(page.locator('#contact-network'), 'contact-offline');
    await context.setOffline(false);
    await page.locator('#contact-network:not([data-state])').waitFor({ state: 'attached' });
  }
} finally {
  if (output) await writeFile(join(output, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ runs: results.length, failures }, null, 2));
assert.equal(failures.length, 0);
