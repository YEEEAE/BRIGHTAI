import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const OUT = '/Users/yzydalshmry/Desktop/BRIGHTAI/qa-screenshots';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', err => errors.push('pageerror: ' + err.message));

await page.goto('http://127.0.0.1:4322/', { waitUntil: 'domcontentloaded' });
await page.screenshot({ path: `${OUT}/home-desktop-dom-content-loaded.png`, fullPage: false });
await page.waitForLoadState('networkidle');
await page.screenshot({ path: `${OUT}/home-desktop-network-idle.png`, fullPage: false });

const info = await page.evaluate(() => {
  const h1 = document.querySelector('.split-hero__h1');
  const cs = h1 ? window.getComputedStyle(h1) : null;
  return {
    h1: h1 ? {
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily.substring(0, 40)
    } : null
  };
});

console.log(JSON.stringify({ info, pageErrors: errors }, null, 2));
await browser.close();
