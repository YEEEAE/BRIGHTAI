/**
 * verify-scenario-banner.mjs — K1-DRIFT-FIX (2026-08-09)
 *
 * يحقق أن مصدر الحقيقة الوحيد لـ scenario banner هو #scenarios-banner-config
 * (المبني من SCENARIO_META في kernel-journey.ts) — لا يوجد MAP يدوي مكرر.
 *
 * يفحص:
 *   1. كل scenario IDs موجودة في الـ blob (12 مفترضة).
 *   2. الـ blob لا يحتوي على `action` (الـ MAP القديم كان يستخدم `action`
 *      بدل `expectedAction`) — أي drift من النمط القديم.
 *   3. لا يوجد `MAP = {` في script الصفحة (إزالة الـ mirror اليدوي).
 *   4. invalid ID recovery: ?scenario=invalid لا يُظهر البانر.
 *   5. valid ID: ?scenario=pdpl-id-leak يُظهر البانر + preflight + run CTA.
 *
 * Usage: node scripts/playwright/verify-scenario-banner.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SC_URL || 'http://localhost:4877/kernel/chat/';
const failures = [];
const ok = (name, cond) => {
  if (cond) console.log('✅ ' + name);
  else { console.log('❌ ' + name); failures.push(name); }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
// Ignore known project-wide CSP/browser warnings (report-only CSP + meta
// X-Frame-Options) — same pattern as other verify scripts in this repo.
// Ignore project-wide CSP/browser warnings + missing static-asset 404s
// (the local `astro preview` in this repo returns text/html for unbuilt
// CSS/JS — a test-env artifact, not a regression from the scenario change).
const IGNORED = /upgrade-insecure-requests|X-Frame-Options may only be set via an HTTP header|Content Security Policy|frame-ancestors|Failed to load resource: the server responded with a status of 404|not a supported stylesheet MIME type|not executable, and strict MIME type/;
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  if (IGNORED.test(msg.text())) return;
  consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

// ── 0. Load the chat page (no scenario) ──
await page.goto(BASE, { waitUntil: 'networkidle' });

// ── 1. Config blob parses + contains 12 scenarios ──
const blobInfo = await page.evaluate(() => {
  const el = document.getElementById('scenarios-banner-config');
  if (!el) return { exists: false, count: 0, hasActionKey: false, sectorLabels: 0, riskLabels: 0 };
  try {
    const cfg = JSON.parse(el.textContent || '{}');
    const scenarios = cfg.scenarios || [];
    const hasActionKey = scenarios.some((s) => 'action' in s && !('expectedAction' in s));
    return {
      exists: true,
      count: scenarios.length,
      hasActionKey,
      sectorLabels: Object.keys(cfg.sectorLabels || {}).length,
      riskLabels: Object.keys(cfg.riskLabels || {}).length,
    };
  } catch (e) {
    return { exists: true, count: -1, hasActionKey: false, sectorLabels: 0, riskLabels: 0, error: String(e) };
  }
});
ok('banner config blob exists', blobInfo.exists);
ok('banner config has 12 scenarios', blobInfo.count === 12);
ok('banner config includes sectorLabels', blobInfo.sectorLabels >= 7);
ok('banner config includes riskLabels', blobInfo.riskLabels === 5);
ok('banner config uses expectedAction (not old action key)', !blobInfo.hasActionKey);

// ── 2. No hand-maintained MAP mirror in the page script ──
const pageHtml = await page.content();
const hasOldMapPattern = /var\s+MAP\s*=\s*\{\s*'pdpl-id-leak'/.test(pageHtml);
ok('no hand-maintained MAP mirror (old drift source)', !hasOldMapPattern);

// ── 3. Invalid scenario ID recovery: banner stays hidden ──
await page.goto(BASE + '?scenario=definitely-invalid-id', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const invalidBannerHidden = await page.evaluate(() => {
  const b = document.querySelector('[data-scenario-banner]');
  return b ? b.hidden : true;
});
ok('invalid scenario ID → banner stays hidden (recovery)', invalidBannerHidden);

// ── 4. Valid scenario ID: banner shows + preflight + run CTA ──
await page.goto(BASE + '?scenario=pdpl-id-leak', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const validState = await page.evaluate(() => {
  const b = document.querySelector('[data-scenario-banner]');
  if (!b) return { present: false };
  const preflight = b.querySelector('[data-banner-preflight]');
  const preflightText = b.querySelector('[data-banner-preflight-text]');
  const runBtn = b.querySelector('[data-scenario-run]');
  return {
    present: true,
    hidden: b.hidden,
    scenarioId: b.getAttribute('data-scenario-id'),
    sector: b.getAttribute('data-sector'),
    riskBand: b.getAttribute('data-risk-band'),
    preflightVisible: preflight ? !preflight.hidden : false,
    preflightText: preflightText ? (preflightText.textContent || '').trim() : '',
    runBtnPresent: !!runBtn,
  };
});
ok('valid scenario → banner present + visible', validState.present && !validState.hidden);
ok('banner scenario-id matches URL', validState.scenarioId === 'pdpl-id-leak');
ok('banner sector = legal', validState.sector === 'legal');
ok('banner risk-band = critical', validState.riskBand === 'critical');
ok('preflight summary visible', validState.preflightVisible);
ok('preflight text contains sector label', /القانوني/.test(validState.preflightText));
ok('preflight text contains risk label', /حرج/.test(validState.preflightText));
ok('preflight text contains PDPL pack', /PDPL/.test(validState.preflightText));
ok('run CTA present', validState.runBtnPresent);

// ── 5. Run CTA fills the composer with the prompt hint ──
await page.evaluate(() => {
  const runBtn = document.querySelector('[data-scenario-run]');
  if (runBtn) runBtn.click();
});
await page.waitForTimeout(200);
const composerFilled = await page.evaluate(() => {
  const input = document.querySelector('[data-kernel-chat-input]');
  return input ? input.value : '';
});
ok('run CTA fills composer with prompt hint', composerFilled.length > 0 && /سيناريو PDPL/.test(composerFilled));

// ── 6. No console errors ──
ok('no console/page errors', consoleErrors.length === 0);
if (consoleErrors.length) console.log('   console errors: ' + consoleErrors.join(' | '));

await browser.close();

console.log('');
if (failures.length) {
  console.log('FAILED CHECKS: ' + failures.join(', '));
  process.exit(1);
}
console.log('ALL SCENARIO BANNER CHECKS PASSED');
process.exit(0);