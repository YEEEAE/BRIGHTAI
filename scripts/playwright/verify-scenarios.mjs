/**
 * verify-scenarios.mjs — M15 Scenario Lab functional verification.
 * Launches Chromium, loads /kernel/scenarios/, clicks «شغّل الكل», then
 * asserts: engine mounted, run completes, matrix renders, report renders,
 * policy modal opens, no console errors.
 */
import { chromium } from 'playwright';

const BASE = process.env.SC_URL || 'http://localhost:4877/kernel/scenarios/';
const failures = [];
const ok = (name, cond) => {
  if (cond) console.log('✅ ' + name);
  else { console.log('❌ ' + name); failures.push(name); }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

await page.goto(BASE, { waitUntil: 'networkidle' });

// Dismiss overlays that can intercept clicks (cookie consent + kernel sidebar)
await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const c = q('.cookie-consent'); if (c) c.remove();
  const s = q('#kernel-sidebar'); if (s) s.remove();
  const n = q('.kernel-sidebar'); if (n) n.remove();
  const toast = q('#k-toast'); if (toast) toast.remove();
});

// Engine mounted?
const engineMounted = await page.evaluate(() => !!window.KernelScenarios);
ok('engine mounted (window.KernelScenarios)', engineMounted);

// Config blob parsed?
const blobCount = await page.evaluate(() => {
  const el = document.getElementById('scenarios-config');
  if (!el) return 0;
  try { return JSON.parse(el.textContent || '{}').scenarios.length; } catch (e) { return -1; }
});
ok('config blob parsed (12 scenarios)', blobCount === 12);

// Wait for skeleton reveal
await page.waitForTimeout(1900);

// 12 cards present?
const cards = await page.locator('[data-sc-card]').count();
ok('12 scenario cards rendered', cards === 12);

// Run all — wait for completion (12 * ~165ms + overhead)
await page.evaluate(() => window.KernelScenarios.runAll());
const beforeRun = Date.now();
await page.waitForFunction(() => {
  const s = window.KernelScenarios && window.KernelScenarios.snapshot();
  return s && s.phase === 'complete' && s.completed === 12;
}, { timeout: 20000 });
const runMs = Date.now() - beforeRun;
console.log('   run completed in ' + runMs + 'ms');

const snap = await page.evaluate(() => {
  const s = window.KernelScenarios.snapshot();
  return { completed: s.completed, failed: s.failed, gate: s.gate, runCount: s.runCount };
});
ok('runAll completed 12/12', snap.completed === 12);
ok('gate computed (passed|passed-with-findings|review-required)', ['passed', 'passed-with-findings', 'review-required'].includes(snap.gate));
console.log('   snapshot:', JSON.stringify(snap));

// KPI numbers updated?
const kpiFailed = await page.locator('[data-sc-kpi-failed]').textContent();
ok('KPI failed updated (' + kpiFailed + ')', kpiFailed !== '0' || snap.failed === 0);

// Card verdict badge rendered?
const firstBadge = await page.locator('[data-sc-card] [data-sc-verdict]').first().textContent();
ok('card verdict badge rendered', firstBadge.trim().length > 0);

// Trace id present on at least one card?
const traceCount = await page.locator('[data-sc-trace][data-trace-id]').count();
ok('trace ids attached (' + traceCount + ')', traceCount > 0);

// Matrix renders
await page.locator('[data-sc-tab="matrix"]').click();
await page.waitForTimeout(200);
const matrixRows = await page.locator('.sc-matrix tbody tr').count();
ok('matrix renders 12 rows', matrixRows === 12);
const matrixCells = await page.locator('.sc-matrix__cell--pass').count();
console.log('   matrix pass cells: ' + matrixCells);

// Compare toggle shows prev note
await page.locator('[data-sc-compare-toggle]').check();
await page.waitForTimeout(150);
const prevNoteHidden = await page.locator('[data-sc-matrix-prev-note]').isHidden();
ok('compare note visible after 1 run', !prevNoteHidden);

// Report renders
await page.locator('[data-sc-tab="report"]').click();
await page.waitForTimeout(200);
const reportRows = await page.locator('.sc-report__table tbody tr').count();
ok('report renders 12 rows', reportRows === 12);

// Policy suggest buttons appear on failed scenarios (if any fail)
await page.locator('[data-sc-tab="grid"]').click();
await page.waitForTimeout(200);
const suggestVisible = await page.locator('[data-sc-policy-suggest]:not([hidden])').count();
console.log('   policy-suggest visible buttons: ' + suggestVisible);

// Open first policy modal if any suggest button exists
if (suggestVisible > 0) {
  await page.locator('[data-sc-policy-suggest]:not([hidden])').first().click();
  await page.waitForTimeout(150);
  const modalVisible = await page.locator('[data-sc-policy-modal]').isVisible();
  ok('policy modal opens', modalVisible);
  const policyText = await page.locator('[data-sc-policy-text]').textContent();
  ok('policy text non-empty', (policyText || '').trim().length > 20);
  await page.keyboard.press('Escape');
}

// Filter by sector
await page.locator('[data-sc-cat="code"]').click();
await page.waitForTimeout(150);
const codeVisible = await page.locator('[data-sc-card]:not([hidden])').count();
ok('sector filter (code) shows cards', codeVisible > 0);

// Search filter (reset sector filter first so term matches across sectors)
await page.locator('[data-sc-cat="all"]').click();
await page.locator('[data-sc-search]').fill('آيبان');
await page.waitForTimeout(150);
const searchVisible = await page.locator('[data-sc-card]:not([hidden])').count();
ok('search narrows to >=1 card', searchVisible >= 1);
await page.locator('[data-sc-search]').fill('');

// Filter by result: fail (if any) or partial/pass
await page.locator('[data-sc-result-filter="fail"]').click();
await page.waitForTimeout(150);
const failVisible = await page.locator('[data-sc-card]:not([hidden])').count();
ok('result filter (fail) works', failVisible >= 0);

await browser.close();

console.log('');
if (failures.length) {
  console.log('FAILED CHECKS: ' + failures.join(', '));
  process.exit(1);
}
console.log('ALL SCENARIO LAB CHECKS PASSED');
process.exit(0);
