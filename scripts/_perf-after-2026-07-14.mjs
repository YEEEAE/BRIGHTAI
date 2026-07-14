#!/usr/bin/env node
/**
 * scripts/_perf-after-2026-07-14.mjs
 * Measure LCP / CLS / INP on main pages AFTER the perf-hardening changes.
 * Uses Playwright (already in devDeps) since lighthouse isn't installed in
 * the workspace. Emulates mobile Slow 4G to match the budget's profile.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.LH_BASE || 'http://localhost:4321';
const OUT_DIR = 'reports/perf-after-2026-07-14';
mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { path: '/', label: 'home' },
  { path: '/about/', label: 'about' },
  { path: '/pricing/', label: 'pricing' },
  { path: '/trust/', label: 'trust' },
  { path: '/solutions/', label: 'solutions' },
  { path: '/kernel/', label: 'kernel' },
];

const summary = { startedAt: new Date().toISOString(), runs: [] };

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  for (const page of PAGES) {
    const context = await browser.newContext({
      viewport: { width: 412, height: 823 },
      deviceScaleFactor: 1.75,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    });

    const cdpSession = await context.newCDPSession(await context.newPage());
    // Throttle to Slow 4G: 1.6 Mbps down, 750 Kbps up, 150ms RTT
    await cdpSession.send('Network.enable');
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // bytes/sec
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });

    const pageObj = await context.newPage();

    // Inject Web Vitals observer
    await pageObj.addInitScript(() => {
      window.__perfMetrics = { lcp: 0, cls: 0, fcp: 0, ttfb: 0 };
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__perfMetrics.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) window.__perfMetrics.cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name === 'first-contentful-paint') window.__perfMetrics.fcp = e.startTime;
        }
      }).observe({ type: 'paint', buffered: true });
    });

    const url = `${BASE}${page.path}`;
    const t0 = Date.now();
    const navResponse = await pageObj.goto(url, { waitUntil: 'load', timeout: 30000 });
    const ttfb = navResponse ? Date.now() - t0 - (navResponse.timing ? navResponse.timing : 0) : 0;

    // Wait for all resources to load (longer for slow 4G)
    await pageObj.waitForTimeout(5000);

    const metrics = await pageObj.evaluate(() => window.__perfMetrics);
    const elapsed = Date.now() - t0;

    // Resource breakdown — re-query after resources loaded
    const resources = await pageObj.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const breakdown = { css: 0, js: 0, font: 0, image: 0, other: 0, total: 0, count: 0 };
      for (const r of entries) {
        const size = r.transferSize || r.encodedBodySize || 0;
        breakdown.total += size;
        breakdown.count++;
        if (r.initiatorType === 'css' || r.name.endsWith('.css')) breakdown.css += size;
        else if (r.initiatorType === 'script' || r.name.endsWith('.js')) breakdown.js += size;
        else if (r.initiatorType === 'font' || /\.(woff2?|otf|ttf|eot)/.test(r.name)) breakdown.font += size;
        else if (r.initiatorType === 'img' || /\.(png|webp|jpg|jpeg|gif|svg)/.test(r.name)) breakdown.image += size;
        else breakdown.other += size;
      }
      return breakdown;
    });

    const run = {
      page: page.path,
      label: page.label,
      lcp: metrics.lcp,
      cls: metrics.cls,
      fcp: metrics.fcp,
      elapsed: `${elapsed}ms`,
      resources: {
        totalKB: Math.round(resources.total / 1024),
        cssKB: Math.round(resources.css / 1024),
        jsKB: Math.round(resources.js / 1024),
        fontKB: Math.round(resources.font / 1024),
        imageKB: Math.round(resources.image / 1024),
      },
    };
    summary.runs.push(run);
    console.log(
      `[${page.label.padEnd(10)}] LCP=${(run.lcp/1000).toFixed(2)}s CLS=${run.cls.toFixed(3)} FCP=${(run.fcp/1000).toFixed(2)}s | total=${run.resources.totalKB}KB (css=${run.resources.cssKB} font=${run.resources.fontKB} js=${run.resources.jsKB} img=${run.resources.imageKB})`
    );

    await context.close();
  }
} finally {
  await browser.close();
}

summary.finishedAt = new Date().toISOString();
writeFileSync(`${OUT_DIR}/perf-summary.json`, JSON.stringify(summary, null, 2));

console.log('\n=== PERF SUMMARY (mobile Slow 4G) ===');
console.log('| Page | LCP | CLS | FCP | Total | CSS | Font | JS | Img |');
console.log('|------|-----|-----|-----|-------|-----|------|-----|-----|');
for (const r of summary.runs) {
  console.log(
    `| ${r.page} | ${(r.lcp/1000).toFixed(2)}s | ${r.cls.toFixed(3)} | ${(r.fcp/1000).toFixed(2)}s | ${r.resources.totalKB}KB | ${r.resources.cssKB}KB | ${r.resources.fontKB}KB | ${r.resources.jsKB}KB | ${r.resources.imageKB}KB |`
  );
}
