/**
 * Footer visual verification v2 — Clean capture without Cookie Consent overlay
 * Captures: full footer + bottom bar detail + brand detail
 * Output: /Users/yzydalshmry/Desktop/BRIGHTAI/reports/screenshots/footer-*.png
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:4321';
const OUT_DIR = '/Users/yzydalshmry/Desktop/BRIGHTAI/reports/screenshots';

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

// Single high-fidelity desktop pass + single mobile pass for both langs
const runs = [
  { name: 'home-ar-desktop', url: '/',                 lang: 'ar', viewport: { width: 1440, height: 900 } },
  { name: 'home-en-desktop', url: '/en/privacy-policy/', lang: 'en', viewport: { width: 1440, height: 900 } },
  { name: 'home-ar-mobile',  url: '/',                 lang: 'ar', viewport: { width: 390,  height: 844 } },
  { name: 'home-en-mobile',  url: '/en/privacy-policy/', lang: 'en', viewport: { width: 390,  height: 844 } },
];

for (const run of runs) {
  const context = await browser.newContext({
    viewport: run.viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Auto-accept cookies / hide consent banner so it doesn't occlude footer
  await page.addInitScript(() => {
    try {
      localStorage.setItem('brightai_cookie_consent', 'accepted');
    } catch (_) { /* ignore */ }
  });

  await page.goto(BASE + run.url, { waitUntil: 'networkidle' });

  // Hide cookie consent banner if still present
  await page.evaluate(() => {
    document.querySelectorAll('[class*="cookie"], [class*="consent"], [data-consent]').forEach((el) => {
      if (el instanceof HTMLElement) el.style.display = 'none';
    });
    document.querySelectorAll('.whatsapp-fab, .floating-cta').forEach((el) => {
      if (el instanceof HTMLElement) el.style.display = 'none';
    });
  });

  await page.waitForSelector('.footer', { state: 'visible' });

  // 1) Scroll so footer is fully visible at top of viewport
  await page.evaluate(() => {
    const f = document.querySelector('.footer');
    if (f) f.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(500);

  const footer = page.locator('.footer');

  // Full footer element screenshot
  await footer.screenshot({ path: `${OUT_DIR}/footer-${run.name}.png` });
  console.log(`✓ ${OUT_DIR}/footer-${run.name}.png`);

  // Detail shots (only desktop, useful for design review)
  if (run.viewport.width >= 1024) {
    const brand = page.locator('.footer__brand');
    if (await brand.count()) {
      await brand.screenshot({ path: `${OUT_DIR}/footer-brand-${run.name}.png` });
      console.log(`✓ ${OUT_DIR}/footer-brand-${run.name}.png`);
    }
    const bottom = page.locator('.footer__bottom');
    if (await bottom.count()) {
      await bottom.screenshot({ path: `${OUT_DIR}/footer-bottom-${run.name}.png` });
      console.log(`✓ ${OUT_DIR}/footer-bottom-${run.name}.png`);
    }
  }

  await page.close();
  await context.close();
}

await browser.close();
console.log('Done.');