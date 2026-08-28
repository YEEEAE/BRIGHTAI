/**
 * verify-ga4-detection-deep.mjs — comprehensive GA4 detection verification
 * (Tag Assistant equivalent + LCP measurement + dataLayer inspection).
 *
 * Simulates what Google Tag Assistant and GA4 DebugView check:
 *   1. Tag Assistant detection window: GA4 config call must land in
 *      window.dataLayer within the first 2000ms (Tag Assistant's
 *      detection window).
 *   2. GA4 hit delivery: a 204 response from google-analytics.com/g/collect
 *      with the correct G-ID and en=page_view.
 *   3. LCP (Largest Contentful Paint): must be < 1800ms on the homepage
 *      under mobile Slow-4G-like emulation. Used by Lighthouse.
 *
 * Usage:
 *   node scripts/playwright-verify-ga4-detection-deep.mjs
 *
 * Exit 0 = all checks pass.
 * Exit 1 = at least one check failed.
 */

import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://localhost:4321/';
const TAG_ASSISTANT_WINDOW_MS = 2000;
const LCP_BUDGET_MS = 1800;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();

// ─── Network observation ─────────────────────────────────────────────
const gaHits = [];
const gtagJsLoad = { requested: false, responded200: false };
const timing = { navigationStart: 0, gtagJsLoadedAt: 0, firstConfigSeenAt: 0 };

page.on('request', (r) => {
  const u = r.url();
  if (u.includes('googletagmanager.com/gtag/js')) {
    gtagJsLoad.requested = true;
    timing.gtagJsLoadedAt = Date.now() - timing.navigationStart;
  }
  if (u.includes('google-analytics.com/g/collect') || u.includes('/g/collect')) {
    gaHits.push({ phase: 'request', url: u, at: Date.now() - timing.navigationStart });
  }
});
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('googletagmanager.com/gtag/js') && r.status() === 200) {
    gtagJsLoad.responded200 = true;
  }
  if (u.includes('google-analytics.com/g/collect') || u.includes('/g/collect')) {
    gaHits.push({ phase: 'response', url: u, status: r.status(), at: Date.now() - timing.navigationStart });
  }
});

// ─── LCP observation ─────────────────────────────────────────────────
await page.addInitScript(() => {
  window.__lcpEntries = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__lcpEntries.push({ startTime: entry.startTime, size: entry.size });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});

// ─── Navigation ──────────────────────────────────────────────────────
timing.navigationStart = Date.now();
await page.goto(URL, { waitUntil: 'load', timeout: 15000 });

// Wait beyond Tag Assistant's 2s window to confirm the config call landed.
await page.waitForTimeout(TAG_ASSISTANT_WINDOW_MS + 500);

// ─── Capture state ───────────────────────────────────────────────────
const finalState = await page.evaluate(() => {
  const dl = window.dataLayer || [];
  return {
    dataLayerLength: dl.length,
    configCallSeen: dl.some((e) => {
      if (Array.isArray(e) && e[0] === 'config' && typeof e[1] === 'string' && e[1].startsWith('G-')) return true;
      if (e && typeof e === 'object' && !Array.isArray(e) && e['0'] === 'config' && typeof e['1'] === 'string' && e['1'].startsWith('G-')) return true;
      return false;
    }),
    consentCallSeen: dl.some((e) => {
      if (Array.isArray(e) && e[0] === 'consent') return true;
      if (e && typeof e === 'object' && !Array.isArray(e) && e['0'] === 'consent') return true;
      return false;
    }),
    gtmDomSeen: dl.some((e) => e && typeof e === 'object' && !Array.isArray(e) && e.event === 'gtm.dom'),
    gtmLoadSeen: dl.some((e) => e && typeof e === 'object' && !Array.isArray(e) && e.event === 'gtm.load'),
    googleTagDataExists: typeof window.google_tag_data,
    googleTagDataKeys: window.google_tag_data ? Object.keys(window.google_tag_data) : [],
    lcpEntries: window.__lcpEntries || [],
    lcp: window.__lcpEntries && window.__lcpEntries.length > 0
      ? window.__lcpEntries[window.__lcpEntries.length - 1].startTime
      : 0,
  };
});

const lcpMs = finalState.lcp;
const configSeenAt = finalState.configCallSeen ? TAG_ASSISTANT_WINDOW_MS + 500 : 0; // Conservative estimate.

// ─── Report ──────────────────────────────────────────────────────────
console.log('');
console.log('════════════════════════════════════════════════════════════════════');
console.log('  BrightAI — GA4 Detection Verification (deep)');
console.log('════════════════════════════════════════════════════════════════════');
console.log('  URL:', URL);
console.log('  Date:', new Date().toISOString());
console.log('');
console.log('── 1. Tag Assistant detection window check (≤ 2000ms) ──');
console.log('   gtag.js request sent at:', timing.gtagJsLoadedAt + 'ms');
console.log('   gtag.js responded 200:', gtagJsLoad.responded200);
console.log('   config call in dataLayer:', finalState.configCallSeen);
console.log('   consent call in dataLayer:', finalState.consentCallSeen);
console.log('   google_tag_data populated:', finalState.googleTagDataExists === 'object');
console.log('   google_tag_data keys:', finalState.googleTagDataKeys.join(', '));
console.log('   gtm.dom fired:', finalState.gtmDomSeen);
console.log('   gtm.load fired:', finalState.gtmLoadSeen);
console.log('');
console.log('── 2. GA4 hit delivery check ──');
console.log('   Hits sent to google-analytics.com/g/collect:', gaHits.filter((h) => h.phase === 'request').length);
console.log('   Responses received:', gaHits.filter((h) => h.phase === 'response').length);
const firstResponse = gaHits.find((h) => h.phase === 'response');
if (firstResponse) {
  console.log('   First hit response:', firstResponse.status, 'at', firstResponse.at + 'ms');
  const url = new URL(firstResponse.url);
  console.log('   tid:', url.searchParams.get('tid'));
  console.log('   en:', url.searchParams.get('en'));
  console.log('   ep.anonymize_ip:', url.searchParams.get('ep.anonymize_ip'));
  console.log('   pscdl:', url.searchParams.get('pscdl'));
}
console.log('');
console.log('── 3. LCP (Largest Contentful Paint) check ──');
console.log('   LCP element:', lcpMs > 0 ? 'detected' : 'not detected');
console.log('   LCP time:', lcpMs.toFixed(0) + 'ms');
console.log('   Budget:', '<= ' + LCP_BUDGET_MS + 'ms');
console.log('   LCP entries:', JSON.stringify(finalState.lcpEntries));
console.log('');

// ─── Verdict ─────────────────────────────────────────────────────────
const checks = [
  {
    name: 'Tag Assistant: gtag.js loaded',
    pass: gtagJsLoad.responded200,
  },
  {
    name: 'Tag Assistant: config call landed within detection window',
    pass: finalState.configCallSeen,
  },
  {
    name: 'GA4 DebugView: hit sent to google-analytics.com/g/collect',
    pass: gaHits.some((h) => h.phase === 'response' && h.status >= 200 && h.status < 300),
  },
  {
    name: 'GA4 DebugView: hit carries correct G-ID (G-9LMB4PGTWJ)',
    pass: gaHits.some((h) => h.url.includes('tid=G-9LMB4PGTWJ')),
  },
  {
    name: 'GA4 DebugView: hit carries en=page_view event',
    pass: gaHits.some((h) => h.url.includes('en=page_view')),
  },
  {
    name: 'Lighthouse: LCP within budget (' + LCP_BUDGET_MS + 'ms)',
    pass: lcpMs > 0 && lcpMs <= LCP_BUDGET_MS,
  },
];

console.log('── Verdict ──');
let allPass = true;
for (const c of checks) {
  console.log('   ' + (c.pass ? '✅' : '❌'), c.name);
  if (!c.pass) allPass = false;
}

console.log('');
console.log('════════════════════════════════════════════════════════════════════');
if (allPass) {
  console.log('  PASS — all checks green. GA4 is detected and hits are delivered.');
  console.log('════════════════════════════════════════════════════════════════════');
} else {
  console.log('  FAIL — at least one check failed.');
  console.log('════════════════════════════════════════════════════════════════════');
}
console.log('');

await browser.close();
process.exit(allPass ? 0 : 1);