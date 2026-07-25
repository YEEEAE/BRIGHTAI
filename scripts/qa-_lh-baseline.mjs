#!/usr/bin/env node
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

const BASE = process.env.LH_BASE || 'http://localhost:4321';
const OUT_DIR = 'reports/perf-baseline-2026-07-14/lighthouse';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { path: '/', label: 'home' },
  { path: '/about/', label: 'about' },
  { path: '/pricing/', label: 'pricing' },
  { path: '/trust/', label: 'trust' },
  { path: '/solutions/', label: 'solutions' },
  { path: '/kernel/', label: 'kernel' },
];

const FORM_FACTORS = ['mobile', 'desktop'];

const summary = { startedAt: new Date().toISOString(), runs: [] };

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});

try {
  for (const page of PAGES) {
    for (const formFactor of FORM_FACTORS) {
      const url = `${BASE}${page.path}`;
      const config = formFactor === 'desktop'
        ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } }
        : { extends: 'lighthouse:default', settings: { formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4, requestLatencyMs: 562.5, downloadThroughputKbps: 1474.56, uploadThroughputKbps: 675 } } };

      console.log(`[lh] ${formFactor.padEnd(7)} ${page.path}`);
      const t0 = Date.now();
      const runnerResult = await lighthouse(url, config, undefined);
      const lhr = runnerResult.lhr;
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      const cat = lhr.categories;
      const audits = lhr.audits;
      const run = {
        page: page.path,
        label: page.label,
        formFactor,
        elapsed: `${elapsed}s`,
        scores: {
          performance: Math.round((cat.performance?.score || 0) * 100),
          accessibility: Math.round((cat.accessibility?.score || 0) * 100),
          bestPractices: Math.round((cat['best-practices']?.score || 0) * 100),
          seo: Math.round((cat.seo?.score || 0) * 100),
        },
        metrics: {
          lcp: audits['largest-contentful-paint']?.numericValue,
          fcp: audits['first-contentful-paint']?.numericValue,
          cls: audits['cumulative-layout-shift']?.numericValue,
          inp: audits['experimental-interaction-to-next-paint']?.numericValue,
          ttfb: audits['server-response-time']?.numericValue,
          tbt: audits['total-blocking-time']?.numericValue,
          speedIndex: audits['speed-index']?.numericValue,
        },
        resources: {
          totalBytes: audits['total-byte-weight']?.numericValue,
          unusedCss: audits['unused-css-rules']?.numericValue,
          unusedJs: audits['unused-javascript']?.numericValue,
          renderBlocking: audits['render-blocking-resources']?.numericValue,
        }
      };
      summary.runs.push(run);
      console.log(`        perf=${run.scores.performance} a11y=${run.scores.accessibility} LCP=${(run.metrics.lcp/1000).toFixed(2)}s CLS=${run.metrics.cls.toFixed(3)} unusedCss=${(run.resources.unusedCss/1024).toFixed(0)}KB`);
    }
  }
} finally {
  await chrome.kill();
}

summary.finishedAt = new Date().toISOString();
writeFileSync('reports/perf-baseline-2026-07-14/lighthouse-summary.json', JSON.stringify(summary, null, 2));

// Print summary table
console.log('\n\n========== LIGHTHOUSE BASELINE SUMMARY ==========\n');
console.log('| Page | Device | Perf | A11y | BP | SEO | LCP | CLS | INP | Unused CSS |');
console.log('|------|--------|------|------|-----|-----|-----|-----|-----|-----------|');
for (const r of summary.runs) {
  const lcp = r.metrics.lcp ? (r.metrics.lcp/1000).toFixed(2)+'s' : 'N/A';
  const cls = r.metrics.cls ? r.metrics.cls.toFixed(3) : 'N/A';
  const inp = r.metrics.inp ? r.metrics.inp.toFixed(0)+'ms' : 'N/A';
  const unusedCss = r.resources.unusedCss ? (r.resources.unusedCss/1024).toFixed(0)+'KB' : '0KB';
  console.log(`| ${r.page} | ${r.formFactor} | ${r.scores.performance} | ${r.scores.accessibility} | ${r.scores.bestPractices} | ${r.scores.seo} | ${lcp} | ${cls} | ${inp} | ${unusedCss} |`);
}
