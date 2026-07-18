/**
 * screenshot-problem-section.mjs
 * Takes a focused screenshot of the homepage problem section after
 * the scroll-reveal observer has run on all its cards.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = 'http://localhost:4321/';
const OUT = '/Users/yzydalshmry/Desktop/BRIGHTAI/download/qa/homepage-reveal-fix';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Scroll to problem section and wait for reveal
await page.evaluate(() => {
  const el = document.getElementById('problem');
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(1500);

// Take problem section screenshot
const problemRect = await page.$eval('#problem', (el) => {
  const r = el.getBoundingClientRect();
  return { x: 0, y: Math.max(0, r.top), width: 1440, height: Math.min(900, r.height) };
});
await page.screenshot({
  path: join(OUT, 'problem-section-after-fix.png'),
  clip: problemRect,
});

// Also scroll past and take a wide screenshot of multiple sections
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT, 'homepage-mid.png'), fullPage: false });

// Take a top-of-page screenshot for reference
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, 'homepage-top.png'), fullPage: false });

await browser.close();
console.log('Screenshots saved to', OUT);
