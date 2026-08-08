/**
 * measure-home-vitals.mjs — measure LCP / CLS / TBT on the homepage.
 *
 * Drives the built static output through Playwright (headless Chromium) and
 * captures Core Web Vitals via the PerformanceObserver API:
 *   - LCP  : largest-contentful-paint entries (last one wins)
 *   - CLS  : layout-shift entries, summed (session-window approximation)
 *   - TBT  : longtask entries > 50ms, sum(duration - 50)
 *
 * Usage:
 *   node scripts/serve-static.mjs &           # serve dist/client on :8788
 *   node scripts/playwright/measure-home-vitals.mjs --url=http://localhost:8788/
 *
 * Desktop emulation (matches lh-home-desktop.json formFactor=desktop).
 *
 * NOTE on accuracy: this is a LOCAL build without the Cloudflare edge layer
 * (no challenge-platform main.js, no edge TTFB variance). Local LCP/TBT will
 * therefore read LOWER than production. The deltas attributable to our fixes
 * (CLS fallback metrics, deferred decorative scripts, dropped Inter preload)
 * are what matter — they are layout-layer, not edge-layer.
 */

import { chromium } from 'playwright';

const argUrl = process.argv.find((a) => a.startsWith('--url='));
const url = argUrl ? argUrl.split('=')[1] : 'http://localhost:8788/';

const browser = await chromium.launch();
const context = await browser.newContext({
  // Desktop, matches the committed Lighthouse run (formFactor=desktop).
  viewport: { width: 1350, height: 940 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
});
const page = await context.newPage();

// Console errors → best-practices signal
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

// Capture CWV via the PerformanceObserver API in the real page context.
const vitals = await page.evaluate(() => {
  return new Promise((resolve) => {
    const out = { lcp: 0, cls: 0, tbt: 0, longTasks: 0, lcpEl: '' };
    try {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          out.lcp = last.startTime;
          out.lcpEl = last.element ? (last.element.tagName + (last.element.id ? ('#' + last.element.id) : '') + '.' + (last.element.className || '')).slice(0, 80) : '';
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) out.cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // TBT from longtasks
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          out.longTasks += 1;
          if (e.duration > 50) out.tbt += e.duration - 50;
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (err) {
      out.error = String(err);
    }
    // Long tasks + LCP are async — wait for things to settle.
    setTimeout(() => resolve(out), 4000);
  });
});

await browser.close();

const result = {
  url,
  lcp_ms: Math.round(vitals.lcp),
  cls: Math.round(vitals.cls * 1000) / 1000,
  tbt_ms: Math.round(vitals.tbt),
  longTasks: vitals.longTasks,
  lcpElement: vitals.lcpEl,
  consoleErrors: consoleErrors.slice(0, 12),
  notes: vitals.error ? [vitals.error] : [],
};
console.log(JSON.stringify(result, null, 2));

// Exit code reflects the task targets (CLS <0.1, LCP <2500, TBT <300).
const pass =
  result.cls < 0.1 && result.lcp_ms > 0 && result.lcp_ms < 2500 && result.tbt_ms < 300;
process.exit(pass ? 0 : 1);
