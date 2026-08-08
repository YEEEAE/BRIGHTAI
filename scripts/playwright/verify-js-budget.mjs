/**
 * scripts/playwright/verify-js-budget.mjs — BAI-PERF-02 (2026-08-08)
 *
 * Verification script for the JS budget reduction task. Confirms:
 *   1. Homepage no longer ships the heavy PDF chunks (pdf.* + index.*).
 *   2. Homepage TBT improved (was 740ms per Lighthouse).
 *   3. /kernel/evidence/ page: preview modal opens + renders HTML preview.
 *   4. /kernel/evidence/ page: PDF download produces a real PDF Blob (not
 *      the old .pdf.txt plain text).
 *
 * Runs against the local astro preview server (http://localhost:4321).
 * Saved per agent.md Section 6.5.9 (Script Persistence Rule) so it can be
 * re-run after future changes to the evidence page.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const results = { pass: [], fail: [], metrics: {} };

function ok(name) { results.pass.push(name); }
function bad(name, detail) { results.fail.push({ name, detail }); }

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

// ─── 1. Homepage: no heavy PDF chunks loaded ────────────────────────────
{
  const page = await context.newPage();
  const heavyChunks = [];
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/_astro/') && url.endsWith('.js')) {
      // Flag any chunk that looks like the old pdf-lib/pdfjs-dist bundles.
      if (url.includes('pdf.') || /^.*\/index\.[A-Za-z0-9_-]+\.js$/.test(url)) {
        heavyChunks.push(url);
      }
    }
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  if (heavyChunks.length === 0) {
    ok('homepage: no heavy pdf/index JS chunks requested');
  } else {
    bad('homepage: no heavy pdf/index JS chunks requested', heavyChunks.join('\n'));
  }
  await page.close();
}

// ─── 2. Homepage: collect LCP + TBT proxy (long tasks) ──────────────────
{
  const page = await context.newPage();
  const longTasks = [];
  await page.context().addInitScript(() => {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          // longTask buffer
          window.__longTasks = (window.__longTasks || 0) + 1;
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const longTaskCount = await page.evaluate(() => window.__longTasks || 0);
  // TBT correlates with long-task duration. We can't get exact TBT without
  // Lighthouse, but long-task count is a strong proxy. Before fix: many long
  // tasks from 175KB pdf-lib parse. After: should be near zero.
  results.metrics.homepageLongTasks = longTaskCount;
  if (longTaskCount <= 3) {
    ok(`homepage: long-task count low (${longTaskCount})`);
  } else {
    bad(`homepage: long-task count high (${longTaskCount})`, 'expected <= 3');
  }
  await page.close();
}

// ─── 3. Evidence page: preview modal opens + renders HTML preview ───────
{
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto(`${BASE}/kernel/evidence/`, { waitUntil: 'networkidle' });

  // Open the first preview button.
  const previewBtn = page.locator('[data-kernel-evidence-preview]').first();
  await previewBtn.click({ timeout: 5000 });

  // Modal should be open + preview should be visible with content.
  await page.waitForTimeout(300);
  const modalOpen = await page.locator('[data-kernel-evidence-preview-modal]').getAttribute('data-open');
  const previewVisible = await page.locator('[data-kernel-evidence-preview-panel]').isVisible();
  const previewBody = await page.locator('[data-kernel-evidence-preview-body]').textContent();

  if (modalOpen === 'true') {
    ok('evidence: preview modal opens');
  } else {
    bad('evidence: preview modal opens', `data-open=${modalOpen}`);
  }
  if (previewVisible) {
    ok('evidence: HTML preview visible');
  } else {
    bad('evidence: HTML preview visible', 'not visible');
  }
  if (previewBody && previewBody.includes('Evidence ID') && previewBody.includes('Trace ID')) {
    ok('evidence: HTML preview has expected fields');
  } else {
    bad('evidence: HTML preview has expected fields', `body="${(previewBody || '').slice(0, 80)}"`);
  }
  // Filter out pre-existing env noise: CSP meta-delivery warnings (the
  // project intentionally uses <meta http-equiv> CSP — see astro.config.mjs),
  // and analytics/network failures from headless localhost. Only flag errors
  // that relate to the page's own scripts.
  const relevantErrors = errors.filter((e) => {
    if (/Content Security Policy directive.*ignored.*meta/i.test(e)) return false;
    if (/X-Frame-Options may only be set via an HTTP header/i.test(e)) return false;
    if (/google-analytics\.com|gtag|g\/collect/i.test(e)) return false;
    if (/certificate-verifier\/|ERR_SSL_PROTOCOL_ERROR/i.test(e)) return false;
    if (/Failed to load resource.*404/i.test(e)) return false;
    return true;
  });
  if (relevantErrors.length === 0) {
    ok('evidence: no relevant console errors');
  } else {
    bad('evidence: no relevant console errors', relevantErrors.join('\n'));
  }
  await page.close();
}

// ─── 4. Evidence page: PDF download produces a real PDF Blob ────────────
{
  const page = await context.newPage();
  await page.goto(`${BASE}/kernel/evidence/`, { waitUntil: 'networkidle' });

  // Intercept the download triggered by downloadFor() via window.__kernelEvidencePdf.
  const pdfResult = await page.evaluate(async () => {
    if (!window.__kernelEvidencePdf) return { ok: false, reason: 'no __kernelEvidencePdf' };
    const data = {
      id: 'EVD-TEST-001', title: 'Test Evidence', query: 'test', trace: 'AI-TEST-1',
      hash: '0xabc', risk: 42, status: 'allowed', sector: 'banking', pack: 'PDPL',
      retention: '5y', cert: 'CERT-1', size: '12KB', signed: 'yes',
    };
    const blob = window.__kernelEvidencePdf(data);
    if (!(blob instanceof Blob)) return { ok: false, reason: 'not a Blob' };
    const text = await blob.text();
    return {
      ok: true,
      type: blob.type,
      size: blob.size,
      isPdf: text.startsWith('%PDF-') && text.includes('%%EOF'),
      hasCatalog: text.includes('/Type /Catalog'),
    };
  });

  if (pdfResult.ok && pdfResult.isPdf && pdfResult.hasCatalog) {
    ok(`evidence: PDF download is a valid PDF (type=${pdfResult.type}, ${pdfResult.size}B)`);
  } else {
    bad('evidence: PDF download is a valid PDF', JSON.stringify(pdfResult));
  }
  await page.close();
}

await browser.close();

// ─── Report ─────────────────────────────────────────────────────────────
console.log('\n═══ BAI-PERF-02 JS Budget Verification ═══');
console.log(`\nPassed: ${results.pass.length}`);
for (const p of results.pass) console.log(`  ✅ ${p}`);
if (results.fail.length > 0) {
  console.log(`\nFailed: ${results.fail.length}`);
  for (const f of results.fail) {
    console.log(`  ❌ ${f.name}`);
    if (f.detail) console.log(`      ${f.detail.split('\n').join('\n      ')}`);
  }
}
if (Object.keys(results.metrics).length > 0) {
  console.log('\nMetrics:');
  for (const [k, v] of Object.entries(results.metrics)) console.log(`  ${k}: ${v}`);
}
console.log(`\nExit: ${results.fail.length === 0 ? 0 : 1}`);
process.exit(results.fail.length === 0 ? 0 : 1);
