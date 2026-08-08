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

page.on('console', (m) => {
  const t = m.text();
  if (t.includes('Plex') || t.includes('Inter Fallback') || t.includes('shift') || t.includes('layout')) {
    console.error('[PAGE]', t.slice(0, 300));
  }
});

await page.goto(process.argv[2] || 'http://localhost:8788/', { waitUntil: 'networkidle', timeout: 90000 });
const result = await page.evaluate(() => new Promise((resolve) => {
  const shifts = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        const sources = (e.sources || []).map((s) => {
          const el = s.node;
          const sel = el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${(typeof el.className === 'string' ? el.className : '').slice(0, 60)}` : 'unknown';
          return {
            sel,
            score: +e.value.toFixed(4),
            top: s.currentRect.top,
            left: s.currentRect.left,
            width: s.currentRect.width,
            height: s.currentRect.height,
          };
        });
        shifts.push({ value: +e.value.toFixed(4), time: Math.round(e.startTime), sources });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (err) { console.error('perf-observer-error', String(err)); }
  setTimeout(() => resolve({ cls: shifts.reduce((s, e) => s + e.value, 0), shifts }), 9000);
}));
await browser.close();
console.log(JSON.stringify(result, null, 2));
