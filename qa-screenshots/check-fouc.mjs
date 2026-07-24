import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const OUT = '/Users/yzydalshmry/Desktop/BRIGHTAI/qa-screenshots';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push('pageerror: ' + err.message));

// Pre-warm: clear cache
await page.goto('http://127.0.0.1:4322/', { waitUntil: 'domcontentloaded' });
await page.screenshot({ path: `${OUT}/home-mobile-dom-content-loaded.png`, fullPage: false });
await page.waitForLoadState('networkidle');
await page.screenshot({ path: `${OUT}/home-mobile-network-idle.png`, fullPage: false });

// Get LCP + stylesheet info
const info = await page.evaluate(() => {
  const h1 = document.querySelector('.split-hero__h1');
  const cs = h1 ? window.getComputedStyle(h1) : null;
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => ({
    href: l.getAttribute('href'),
    loaded: !!l.sheet
  }));
  const fontsLoaded = document.fonts ? document.fonts.size : 0;
  return {
    h1: h1 ? {
      text: h1.textContent.trim().substring(0, 60),
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight
    } : null,
    stylesheets: links,
    fontsLoaded
  };
});

console.log(JSON.stringify({ info, consoleErrors: errors.length, errors: errors.slice(0, 5) }, null, 2));
await browser.close();
