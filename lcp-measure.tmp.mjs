// Lab-style LCP measurement v2 — correct static root via process.cwd().
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';

const DIST = join(process.cwd(), 'dist/client');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.lottie': 'application/octet-stream', '.wasm': 'application/wasm', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
// Production parity: Cloudflare/Render gzip text assets. woff2/avif/jpg/lottie/wasm are already compressed.
const GZIP_OK = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.json', '.webmanifest']);

const srv = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(DIST, p));
    const ext = extname(p);
    const accept = req.headers['accept-encoding'] || '';
    if (GZIP_OK.has(ext) && accept.includes('gzip')) {
      const gz = gzipSync(data);
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'content-encoding': 'gzip' });
      res.end(gz);
    } else {
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    }
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;
console.log('serving', DIST, 'on', port);

const browser = await chromium.launch();
const MOBILE_NET = { offline: false, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 };

async function measure(label, path, ctxOpts, cpu, net) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (net) await cdp.send('Network.emulateNetworkConditions', net);
  const seen = [];
  page.on('response', (r) => { try { seen.push({ s: r.status(), url: r.url().replace(`http://127.0.0.1:${port}`, ''), len: Number(r.headers()['content-length'] || 0) }); } catch {} });
  await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(9000);
  const perf = await page.evaluate(() => new Promise((resolve) => {
    const out = {};
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      out.nav = nav ? { dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) } : null;
      out.paint = {};
      for (const e of performance.getEntriesByType('paint')) out.paint[e.name] = Math.round(e.startTime);
      out.res = performance.getEntriesByType('resource').map((r) => ({ n: r.name.replace(/.*\//, ''), t: r.initiatorType, st: Math.round(r.startTime), d: Math.round(r.duration), kb: Math.round(r.transferSize / 1024) })).sort((a, b) => a.st - b.st);
    } catch (e) { out.err = String(e); }
    try {
      const obs = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) { out.lcp = Math.round(last.startTime); out.lcpEl = (last.element?.tagName || '?') + ' .' + (last.element?.className?.toString?.().slice(0, 70) || ''); out.lcpSize = last.size; out.lcpUrl = (last.url || '').replace(/.*\//, ''); }
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => { obs.disconnect(); resolve(out); }, 600);
    } catch (e) { out.err2 = String(e); resolve(out); }
  }));
  console.log('\n===== ' + label + ' =====');
  console.log('nav:', JSON.stringify(perf.nav), 'paint:', JSON.stringify(perf.paint), 'LCP:', perf.lcp + 'ms el=' + perf.lcpEl + ' url=' + (perf.lcpUrl || ''));
  console.log('responses:', seen.length, 'totalKB:', Math.round(seen.reduce((a, r) => a + r.len, 0) / 1024));
  for (const x of (perf.res || []).slice(0, 35)) console.log(`  ${String(x.st).padStart(5)}ms +${String(x.d).padStart(4)}ms ${String(x.kb).padStart(5)}KB [${x.t}] ${x.n}`);
  await ctx.close();
}

await measure('MOBILE /solutions/ai-governance-platform/', '/solutions/ai-governance-platform/', { viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Linux; Android 10) Mobile Safari/537.36', deviceScaleFactor: 2, isMobile: true }, 4, MOBILE_NET);
await measure('MOBILE /contact/', '/contact/', { viewport: { width: 1440, height: 900 } }, 1, null);
await browser.close();
srv.close();
