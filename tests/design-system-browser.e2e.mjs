// Run against a local build with AIGAS_APP_ENABLED=true. Playwright may be installed separately.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:4321').origin;
const browser = await chromium.launch({ channel: 'chrome' });

async function visit(page, path) {
  const response = await page.goto(origin + path);
  assert.equal(response?.status(), 200, path);
  assert.equal(new URL(page.url()).pathname, path);
}

async function focused(page, selector) {
  await page.waitForFunction(selector => document.activeElement?.matches(selector), selector);
  assert(await page.locator(selector).evaluate(node => {
    const style = getComputedStyle(node);
    return node.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  }), `Visible keyboard focus on ${selector}`);
}

async function assertReflow(page, path, width) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert(size.content <= size.viewport + 1, `${path} at ${width}px: ${JSON.stringify(size)}`);
}

const appPaths = [
  '/app/kernel/', '/app/trial/', '/app/secure-chat/', '/app/firewall/',
  '/app/human-gate/', '/app/ledger/', '/app/risk-engine/', '/app/operator/trials/',
];
try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/docs/design-system/', ...appPaths]) {
      await visit(page, path);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
      assert.equal(await page.locator('.ds-theme').count(), 1);
      await assertReflow(page, path, width);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, '/docs/design-system/');
  await page.keyboard.press('Tab');
  await focused(page, '.docs-skip');
  await page.keyboard.press('Enter');
  await focused(page, '#design-main');

  const modalTrigger = page.locator('#ds-modal-trigger');
  await page.locator('#ds-toast-trigger').focus();
  await page.keyboard.press('Tab');
  await focused(page, '#ds-modal-trigger');
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: 'مثال حوار' });
  assert(await modal.isVisible());
  await focused(page, '#ds-example-modal [autofocus]');
  await page.keyboard.press('Tab');
  await focused(page, '#ds-example-modal [value="done"]');
  await page.keyboard.press('Shift+Tab');
  await focused(page, '#ds-example-modal [autofocus]');
  await page.keyboard.press('Escape');
  assert.equal(await modal.count(), 0);
  await focused(page, '#ds-modal-trigger');
  await modalTrigger.press('Space');
  await page.keyboard.press('Enter');
  assert.equal(await modal.count(), 0);
  await focused(page, '#ds-modal-trigger');

  await page.keyboard.press('Shift+Tab');
  await focused(page, '#ds-toast-trigger');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('[data-toast-live]')?.textContent?.includes('ظهر الإشعار'));
  await focused(page, '#ds-toast-trigger');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await focused(page, '[data-toast-dismiss]');
  await page.keyboard.press('Enter');
  assert(await page.locator('[data-toast-content]').isHidden());
  await focused(page, '#ds-toast-trigger');

  const email = page.getByRole('textbox', { name: 'البريد الإلكتروني', exact: true });
  assert.equal(await email.getAttribute('aria-invalid'), 'true');
  assert.equal(await email.getAttribute('aria-describedby'), 'ds-email-hint ds-email-error');
  assert.equal(await email.getAttribute('dir'), 'ltr');
  const belowMinimum = await page.locator('.ds-button:not([disabled]), .ds-control').evaluateAll(nodes => nodes
    .filter(node => node.getBoundingClientRect().width)
    .filter(node => { const rect = node.getBoundingClientRect(); return rect.width < 44 || rect.height < 44; })
    .map(node => node.outerHTML));
  assert.deepEqual(belowMinimum, [], 'Visible demo controls are at least 44 × 44 CSS pixels');

  const contrast = await page.evaluate(() => {
    const luminance = color => {
      const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(channel => {
        const value = Number(channel) / 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      return .2126 * r + .7152 * g + .0722 * b;
    };
    const ratio = (left, right) => {
      const [a, b] = [luminance(left), luminance(right)].sort((a, b) => b - a);
      return (a + .05) / (b + .05);
    };
    const checks = [
      ...['#ds-toast-trigger', '#ds-modal-trigger', '#ds-email', '#ds-product', '#ds-notes', '.ds-product-status[data-state="ENABLED"]']
        .map(selector => [selector, 'color', 4.5]),
      ['#ds-product', 'borderColor', 3],
    ];
    return checks.map(([selector, property, minimum]) => {
      const style = getComputedStyle(document.querySelector(selector));
      return { selector, property, minimum, actual: ratio(style[property], style.backgroundColor) };
    });
  });
  assert.deepEqual(contrast.filter(({ actual, minimum }) => actual < minimum), [], 'Computed component contrast');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert(await modalTrigger.evaluate(node => getComputedStyle(node).transitionDuration
    .split(',').every(duration => parseFloat(duration) === 0)));
  await page.emulateMedia({ forcedColors: 'active' });
  await focused(page, '#ds-toast-trigger');
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });

  await visit(page, '/app/kernel/');
  await page.keyboard.press('Tab');
  await focused(page, '.ds-skip');
  await page.keyboard.press('Enter');
  await focused(page, '#main');
  const refresh = page.locator('[data-health-refresh]');
  await refresh.focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => {
    const node = document.activeElement;
    if (!(node instanceof HTMLElement) || !node.matches(':focus-visible')) return false;
    const rect = node.getBoundingClientRect();
    const x = Math.max(0, Math.min(innerWidth - 1, rect.x + rect.width / 2));
    const y = Math.max(0, Math.min(innerHeight - 1, rect.y + rect.height / 2));
    return node.contains(document.elementFromPoint(x, y));
  }), 'Next portal control is visible and unobscured');
  assert.equal(await page.locator('[data-product-status].ds-product-status').count(), 5);

  for (const path of ['/', '/docs/', '/services/', '/products/', '/products/risk-engine/', '/demo/risk-engine/']) {
    await visit(page, path);
    assert.equal(await page.locator('.ds-theme').count(), 0, path);
    assert((await page.locator('h1').first().textContent())?.trim(), path);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: 27 RTL/reflow checks, keyboard focus, dialog, toast, field semantics, target size, reduced motion, forced colors, and 6 public smoke checks.');
} finally {
  await browser.close();
}
