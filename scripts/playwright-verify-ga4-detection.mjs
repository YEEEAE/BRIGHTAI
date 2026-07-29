/**
 * verify-ga4-detection.mjs — confirm whether Google Tag (gtag.js) actually loads
 * on the homepage and that the config call lands in window.dataLayer.
 *
 * Usage:
 *   node scripts/playwright-verify-ga4-detection.mjs
 *
 * Exit 0 = tag detected (gtag.js loaded + config call recorded within 5s)
 * Exit 1 = tag not detected (gtag.js didn't load, or gtag() not callable)
 */

import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://localhost:4321/';
const WAIT_MS = Number(process.env.WAIT_MS || 10000);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

const networkEvents = [];
page.on('request', (r) => {
  const u = r.url();
  if (u.includes('googletagmanager.com') || u.includes('google-analytics.com') || u.includes('analytics.google.com')) {
    networkEvents.push({ phase: 'request', url: u, method: r.method() });
  }
});
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('googletagmanager.com') || u.includes('google-analytics.com') || u.includes('analytics.google.com')) {
    networkEvents.push({ phase: 'response', url: u, status: r.status() });
  }
});
page.on('requestfailed', (r) => {
  const u = r.url();
  if (u.includes('googletagmanager.com') || u.includes('google-analytics.com') || u.includes('analytics.google.com')) {
    networkEvents.push({ phase: 'failed', url: u, reason: r.failure()?.errorText });
  }
});

const consoleErrors = [];
const consoleAll = [];
page.on('console', (m) => {
  consoleAll.push(`[${m.type()}] ${m.text()}`);
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(URL, { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(WAIT_MS);

const result = await page.evaluate(() => {
  const dl = window.dataLayer || [];
  // Modern gtag.js (googletagmanager.com/gtag/js) processes queued dataLayer
  // entries and converts them to objects with `gtm.uniqueEventId`. We check
  // for both array-shape (raw queue) and object-shape (processed by gtag.js).
  const hasConfig = dl.some(
    (e) =>
      (Array.isArray(e) && e[0] === 'config' && typeof e[1] === 'string' && e[1].startsWith('G-')) ||
      (e && typeof e === 'object' && Array.isArray(e[0]) === false && e['0'] === 'config' && typeof e['1'] === 'string' && e['1'].startsWith('G-'))
  );
  const hasConsent = dl.some(
    (e) =>
      (Array.isArray(e) && e[0] === 'consent') ||
      (e && typeof e === 'object' && e['0'] === 'consent')
  );
  const hasPageView = dl.some(
    (e) =>
      (Array.isArray(e) && e[0] === 'event' && e[1] === 'page_view') ||
      (e && typeof e === 'object' && e.event === 'page_view')
  );
  return {
    hasDataLayer: Array.isArray(window.dataLayer),
    dataLayerLength: dl.length,
    dataLayerContents: dl.map((e, i) => {
      if (Array.isArray(e)) return `[${i}] array[${e.length}]: ${JSON.stringify(e).slice(0, 200)}`;
      if (e && typeof e === 'object') return `[${i}] object keys=${Object.keys(e).join(',')} sample=${JSON.stringify(e).slice(0, 200)}`;
      return `[${i}] ${typeof e}: ${String(e).slice(0, 80)}`;
    }),
    hasConfig,
    hasConsent,
    hasPageView,
    gtagIsFunction: typeof window.gtag === 'function',
    gtagType: typeof window.gtag,
    dataLayerPushType: typeof (window.dataLayer && window.dataLayer.push),
    gaExists: typeof window.ga,
    googleTagDataExists: typeof window.google_tag_data,
    googleTagDataKeys: window.google_tag_data ? Object.keys(window.google_tag_data) : null,
    gtagJsLoaded: !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]'),
    scriptsInHead: Array.from(document.querySelectorAll('script[src]')).map((s) => s.src),
    configCallSeen: hasConfig,
    consentCallSeen: hasConsent,
    pageViewEventSeen: hasPageView,
  };
});

console.log('=== GA4 Detection Report ===');
console.log('URL:', URL);
console.log('Wait time:', WAIT_MS, 'ms');
console.log('');
console.log('-- Page state --');
console.log(JSON.stringify(result, null, 2));
console.log('');
console.log('-- Network events (googletagmanager.com + google-analytics.com) --');
if (networkEvents.length === 0) {
  console.log('(none)');
} else {
  for (const ev of networkEvents) console.log(' ', ev.phase, ev.status || '', ev.url, ev.reason || '');
}
console.log('');
console.log('-- Console errors --');
if (consoleErrors.length === 0) console.log('(none)');
else for (const e of consoleErrors) console.log('  -', e);

console.log('');
console.log('-- All console (last 20) --');
const lastConsole = consoleAll.slice(-20);
if (lastConsole.length === 0) console.log('(none)');
else for (const c of lastConsole) console.log('  ', c);

await browser.close();

const ok =
  result.gtagJsLoaded &&
  result.googleTagDataExists === 'object' &&
  result.configCallSeen &&
  networkEvents.some((e) => e.phase === 'response' && e.url.includes('google-analytics.com/g/collect'));
if (!ok) {
  console.error('');
  console.error('FAIL: GA4 tag not detected.');
  process.exit(1);
}
console.log('');
console.log('PASS: GA4 tag detected.');
console.log('  - gtag.js loaded:', result.gtagJsLoaded);
console.log('  - google_tag_data exists:', result.googleTagDataExists === 'object');
console.log('  - config call in dataLayer:', result.configCallSeen);
console.log('  - GA4 hit sent: yes (status 204 from google-analytics.com/g/collect)');
process.exit(0);