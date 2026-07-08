import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
});
const page = await ctx.newPage();
const lcpEntries = [];
page.on('response', (r) => {
  if (r.url().includes('localhost') && r.request().resourceType() === 'document') {
    // console.log('document', r.url());
  }
});

// Slow 4G throttling via CDP
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,        // 150ms RTT
  downloadThroughput: (1.6 * 1024 * 1024) / 8,  // 1.6Mbps
  uploadThroughput: (750 * 1024) / 8,             // 750Kbps
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

await page.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
// collect LCP
const lcp = await page.evaluate(() => {
  return new Promise((resolve) => {
    let lastEntry = null;
    const obs = new PerformanceObserver(list => {
      const entries = list.getEntries();
      lastEntry = entries[entries.length - 1];
    });
    obs.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => {
      obs.disconnect();
      resolve({
        element: lastEntry ? lastEntry.element?.outerHTML?.slice(0, 300) : 'no LCP',
        url: lastEntry?.url || '',
        startTime: lastEntry?.startTime,
        size: lastEntry?.size,
        loadTime: lastEntry?.loadTime,
        renderTime: lastEntry?.renderTime,
      });
    }, 3000);
  });
});
console.log('LCP:', JSON.stringify(lcp, null, 2));

// also: list rendered text on first viewport
const visibleText = await page.evaluate(() => {
  // simulate fold area
  const body = document.body;
  const fold = body.getBoundingClientRect();
  const items = [];
  document.querySelectorAll('img, h1, h2, p, video, svg').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.top < 823 && r.bottom > 0 && r.width > 100 && r.height > 50) {
      items.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className?.toString().slice(0, 80),
        text: el.textContent?.slice(0, 80),
        top: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
        src: el.tagName === 'IMG' ? el.src.slice(-60) : '',
      });
    }
  });
  return items.slice(0, 15);
});
console.log('---');
console.log('Above-fold elements:');
visibleText.forEach(v => console.log(JSON.stringify(v)));

await browser.close();
