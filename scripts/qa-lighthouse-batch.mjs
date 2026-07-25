#!/usr/bin/env node
/**
 * scripts/lighthouse-batch.mjs — Run Lighthouse on 10+ BRIGHTAI pages
 * (mobile Slow 4G + desktop), save JSON exports, summarize.
 *
 * REPORTS-20: Performance audit.
 */
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.LH_BASE || 'http://localhost:4322';
const OUT_DIR = 'reports/lighthouse-20';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  '/',
  '/about/',
  '/contact/',
  '/pricing/',
  '/trust/',
  '/services/',
  '/solutions/',
  '/solutions/ai-firewall/',
  '/solutions/ai-governance-platform/',
  '/blog/',
  '/docs/',
  '/kernel/',
  '/kernel/chat/',
  '/kernel/audit/',
  '/privacy-policy/',
];

const FORM_FACTORS = ['mobile', 'desktop'];

const summary = { startedAt: new Date().toISOString(), runs: [] };

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});

try {
  for (const path of PAGES) {
    for (const formFactor of FORM_FACTORS) {
      const url = `${BASE}${path}`;
      const config = formFactor === 'desktop'
        ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } }
        : { extends: 'lighthouse:default', settings: { formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4, requestLatencyMs: 562.5, downloadThroughputKbps: 1474.56, uploadThroughputKbps: 675 } } };

      const result = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error' }, config);
      const lhr = result.lhr;
      const slug = (path === '/' ? 'home' : path.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-')) || 'home';
      const filename = `${slug}--${formFactor}.json`;
      writeFileSync(join(OUT_DIR, filename), JSON.stringify(lhr, null, 2));

      const cats = lhr.categories;
      const audits = lhr.audits;
      summary.runs.push({
        path,
        formFactor,
        url,
        perf: Math.round(cats.performance.score * 100),
        a11y: Math.round(cats.accessibility.score * 100),
        bp: Math.round(cats['best-practices'].score * 100),
        seo: Math.round(cats.seo.score * 100),
        lcp: audits['largest-contentful-paint']?.numericValue,
        lcpDisplay: audits['largest-contentful-paint']?.displayValue,
        cls: audits['cumulative-layout-shift']?.numericValue,
        clsDisplay: audits['cumulative-layout-shift']?.displayValue,
        inp: audits['interaction-to-next-paint']?.numericValue,
        inpDisplay: audits['interaction-to-next-paint']?.displayValue,
        tbt: audits['total-blocking-time']?.numericValue,
        fcp: audits['first-contentful-paint']?.numericValue,
        fcpDisplay: audits['first-contentful-paint']?.displayValue,
        ttfb: audits['server-response-time']?.numericValue,
      });
      console.log(`✓ ${path} (${formFactor}): perf=${Math.round(cats.performance.score*100)} a11y=${Math.round(cats.accessibility.score*100)} bp=${Math.round(cats['best-practices'].score*100)} seo=${Math.round(cats.seo.score*100)} LCP=${audits['largest-contentful-paint']?.displayValue} CLS=${audits['cumulative-layout-shift']?.displayValue}`);
    }
  }
} finally {
  await chrome.kill();
}

// Write summary
writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('\n=== Summary ===');
console.log(`Total runs: ${summary.runs.length}`);

function avg(field) {
  const mobile = summary.runs.filter(r => r.formFactor === 'mobile');
  const desktop = summary.runs.filter(r => r.formFactor === 'desktop');
  return {
    mobile: Math.round(mobile.reduce((s, r) => s + (r[field] || 0), 0) / mobile.length),
    desktop: Math.round(desktop.reduce((s, r) => s + (r[field] || 0), 0) / desktop.length),
  };
}

for (const field of ['perf', 'a11y', 'bp', 'seo']) {
  const a = avg(field);
  console.log(`${field.toUpperCase()} avg: mobile=${a.mobile} desktop=${a.desktop}`);
}
console.log('\nDone.');