import { chromium } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: 250 * 1024,
  uploadThroughput: 100 * 1024,
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));
await page.goto(process.argv[2] || 'http://localhost:8788/', { waitUntil: 'networkidle', timeout: 90000 });
const vitals = await page.evaluate(() => new Promise((resolve) => {
  const out = { lcp: 0, cls: 0, tbt: 0, shifts: [], fonts: 0 };
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) out.lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) { out.cls += e.value; out.shifts.push(+e.value.toFixed(4)); }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.duration > 50) out.tbt += e.duration - 50;
    }).observe({ type: 'longtask', buffered: true });
    try { out.fonts = performance.getEntriesByType('resource').filter((r) => r.name.includes('font') || r.name.includes('.woff2')).length; } catch {}
  } catch (err) { out.error = String(err); }
  setTimeout(() => resolve(out), 9000);
}));
await browser.close();
console.log(JSON.stringify({
  lcp_ms: Math.round(vitals.lcp),
  cls: +vitals.cls.toFixed(4),
  tbt_ms: Math.round(vitals.tbt),
  shifts_detail: vitals.shifts,
  fontResources: vitals.fonts,
  consoleErrors,
}, null, 2));
