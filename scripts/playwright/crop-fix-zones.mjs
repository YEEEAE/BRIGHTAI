/**
 * crop-fix-zones.mjs — Take cropped screenshots of the fixed zones
 * (breadcrumbs area + docs-recent cards) for visual verification.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '..', 'download', 'qa', 'a11y-blog-docs');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:4321';
const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'desktop-1440', width: 1440, height: 900, dpr: 1, isMobile: false, hasTouch: false },
];

const browser = await chromium.launch();

async function crop(page, url, sel, file, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dpr,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
  });
  const tab = await context.newPage();
  await tab.goto(url, { waitUntil: 'networkidle' });
  const loc = tab.locator(sel).first();
  await loc.scrollIntoViewIfNeeded();
  await loc.screenshot({ path: file });
  await context.close();
}

for (const v of VIEWPORTS) {
  await crop(null, `${BASE_URL}/blog/`, '.breadcrumbs',
    path.join(OUT_DIR, `crop-blog-breadcrumb-${v.name}.png`), v);
  await crop(null, `${BASE_URL}/docs/`, '.breadcrumbs',
    path.join(OUT_DIR, `crop-docs-breadcrumb-${v.name}.png`), v);
  await crop(null, `${BASE_URL}/docs/`, '.docs-recent',
    path.join(OUT_DIR, `crop-docs-recent-${v.name}.png`), v);
}

await browser.close();
console.log('Cropped screenshots saved to', OUT_DIR);
