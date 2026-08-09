import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

// CSS-FATIGUE (2026-08-09): desktop/mobile visual snapshots for kernel
// dashboard (index) + compliance, before/after the nested-card reduction.
// Run against a local preview server on port 4877.

const BASE = process.env.PREVIEW_URL || 'http://localhost:4877';
const OUT = 'download/qa';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const errs = [];
const shot = async (path, width, height, selector, name) => {
  const page = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/preload|CSP|X-Frame-Options|frame-ancestors|report-uri/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text());
    }
  });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const c = document.querySelector('.cookie-consent');
    if (c) c.remove();
  });
  await page.waitForTimeout(1600);
  const loc = selector ? page.locator(selector) : page;
  await loc.screenshot({ path: `${OUT}/${name}.png`, fullPage: !selector });
  await page.close();
};

// Dashboard — full page (mobile) + primary grid region (desktop)
await shot('/kernel/', 1440, 900, '.kernel-main', 'cf-dashboard-desktop');
await shot('/kernel/', 390, 844, '.kernel-main', 'cf-dashboard-mobile');
// Compliance — full page desktop + mobile
await shot('/kernel/compliance/', 1440, 900, '.kernel-main', 'cf-compliance-desktop');
await shot('/kernel/compliance/', 390, 844, '.kernel-main', 'cf-compliance-mobile');

console.log('screenshots saved. errs:', errs.length ? errs.join('\n') : 'NONE');
await b.close();
