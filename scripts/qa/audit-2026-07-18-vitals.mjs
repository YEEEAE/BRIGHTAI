#!/usr/bin/env node
/**
 * audit-2026-07-18-vitals.mjs — One-shot Web Vitals audit
 *
 * يقيس LCP/CLS على صفحات حرجة عبر Playwright + mobile Slow 4G + CPU throttling.
 * يكتب النتائج JSON + Markdown summary.
 *
 *   BASE_URL=http://127.0.0.1:4321 node scripts/audit-2026-07-18-vitals.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4321';

const PAGES = [
  '/',
  '/about/',
  '/pricing/',
  '/solutions/',
  '/kernel/',
  '/kernel/chat/',
  '/blog/',
  '/docs/',
  '/contact/',
  '/trust/',
];

const results = [];

const browser = await chromium.launch({ args: ['--no-sandbox'] });

for (const path of PAGES) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();

  // Network errors
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Slow 4G + 4x CPU throttling via CDP
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Navigate
  try {
    await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    results.push({ path, url: BASE_URL + path, error: 'navigation failed: ' + e.message });
    await ctx.close();
    continue;
  }

  // Collect LCP and CLS in the page
  const lcpClsData = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lastLcp = null;
      let cls = 0;
      const lcpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) lastLcp = entry;
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => {
        lcpObs.disconnect();
        clsObs.disconnect();
        resolve({
          lcp_ms: lastLcp ? lastLcp.startTime : null,
          lcp_element: lastLcp?.element?.outerHTML?.slice(0, 200) || null,
          lcp_size: lastLcp?.size || null,
          cls,
        });
      }, 3000);
    });
  });

  results.push({
    path,
    url: BASE_URL + path,
    ...lcpClsData,
    errors,
  });

  await ctx.close();
}

await browser.close();

// Compute summary
const summary = {
  pages: results.length,
  lcp_avg: 0,
  lcp_max: 0,
  cls_avg: 0,
  cls_max: 0,
  errors_total: 0,
  failed_pages: 0,
};
for (const r of results) {
  if (r.error) { summary.failed_pages++; continue; }
  if (typeof r.lcp_ms === 'number') {
    summary.lcp_avg += r.lcp_ms;
    summary.lcp_max = Math.max(summary.lcp_max, r.lcp_ms);
  }
  if (typeof r.cls === 'number') {
    summary.cls_avg += r.cls;
    summary.cls_max = Math.max(summary.cls_max, r.cls);
  }
  summary.errors_total += (r.errors || []).length;
}
const okCount = results.filter((r) => !r.error).length;
if (okCount > 0) {
  summary.lcp_avg = Math.round(summary.lcp_avg / okCount);
  summary.cls_avg = Number((summary.cls_avg / okCount).toFixed(4));
}

writeFileSync('report/2026-07-18-vitals.json', JSON.stringify({ summary, results }, null, 2));

let md = `# Web Vitals Audit — 2026-07-18\n\n`;
md += `**Base URL**: ${BASE_URL}\n`;
md += `**Device**: moto g power (2022) — Android 11 — viewport 412×823 — DPR 1.75\n`;
md += `**Network**: Slow 4G (1.6Mbps/750Kbps, 150ms RTT)\n`;
md += `**CPU**: 4× throttling\n\n`;
md += `## Summary\n\n`;
md += `| Metric | Value | Budget | Status |\n|---|---|---|---|\n`;
md += `| Pages scanned | ${summary.pages} | — | — |\n`;
md += `| Failed pages | ${summary.failed_pages} | 0 | ${summary.failed_pages === 0 ? '✅' : '❌'} |\n`;
md += `| LCP avg (ms) | ${summary.lcp_avg} | < 2500 | ${summary.lcp_avg < 2500 ? '✅' : '❌'} |\n`;
md += `| LCP max (ms) | ${summary.lcp_max} | < 2500 | ${summary.lcp_max < 2500 ? '✅' : '❌'} |\n`;
md += `| CLS avg | ${summary.cls_avg} | < 0.05 | ${summary.cls_avg < 0.05 ? '✅' : '❌'} |\n`;
md += `| CLS max | ${summary.cls_max} | < 0.1 | ${summary.cls_max < 0.1 ? '✅' : '❌'} |\n`;
md += `| Console errors | ${summary.errors_total} | 0 | ${summary.errors_total === 0 ? '✅' : '❌'} |\n\n`;
md += `## Per-page\n\n| Path | LCP (ms) | CLS | Errors |\n|---|---|---|---|\n`;
for (const r of results) {
  if (r.error) {
    md += `| ${r.path} | ERROR | — | ${r.error} |\n`;
  } else {
    md += `| ${r.path} | ${r.lcp_ms?.toFixed?.(0) ?? '—'} | ${r.cls?.toFixed?.(4) ?? '—'} | ${(r.errors || []).length} |\n`;
  }
}
md += `\n## LCP elements\n\n`;
for (const r of results) {
  if (r.lcp_element) {
    md += `- **${r.path}**: \`${r.lcp_element.replace(/\\s+/g, ' ').slice(0, 150)}\`\n`;
  }
}
md += `\n_Generated by scripts/audit-2026-07-18-vitals.mjs — Playwright + CDP_\n`;

writeFileSync('report/2026-07-18-vitals.md', md);
console.log(md);
