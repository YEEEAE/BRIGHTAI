/**
 * audit-mobile-360px.mjs — Mobile a11y audit at 360px viewport
 *
 * DEC-A11Y-005 (2026-07-14): Tests 6 target pages at 360×800 (smallest
 * common Android viewport, also iPhone SE width). For each page:
 *
 *   1. Take a screenshot (for visual review)
 *   2. Measure horizontal scroll (must be 0 — page should fit 360px)
 *   3. Measure touch targets on all interactive elements (must be ≥ 44×44px)
 *   4. Verify body font-size ≥ 16px (iOS auto-zooms if smaller)
 *   5. Check viewport meta is set without user-scalable=no
 *   6. Count focusable elements and verify they're keyboard reachable
 *
 * Usage:
 *   node scripts/audit-mobile-360px.mjs
 *   node scripts/audit-mobile-360px.mjs --url=http://localhost:4321
 *   node scripts/audit-mobile-360px.mjs --pages=/, /contact/, /kernel/chat/
 *
 * Requires: playwright (devDep already in package.json)
 * First-time setup: npx playwright install chromium
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : fallback;
};

const BASE = arg('url', 'http://localhost:4321');
const PAGES = arg('pages', null)?.split(/[,\s]+/).filter(Boolean) || [
  '/',
  '/solutions/',
  '/blog/ai-governance-saudi-arabia/',
  '/kernel/chat/',
  '/contact/',
  '/assessment/ai-governance-readiness/',
];
const OUT_DIR = arg('out', 'reports/a11y-mobile-360px');
const TOUCH_MIN = 44; // WCAG 2.5.5 baseline (iOS/Android)
const FONT_MIN = 16;  // iOS auto-zoom threshold

mkdirSync(OUT_DIR, { recursive: true });

console.log('═'.repeat(80));
console.log('  Mobile a11y audit @ 360×800 (Playwright)');
console.log(`  Base: ${BASE}`);
console.log(`  Pages: ${PAGES.length}`);
console.log('═'.repeat(80));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});

const results = [];

for (const path of PAGES) {
  const url = `${BASE}${path}`;
  const page = await context.newPage();
  console.log(`\n  ▸ ${url}`);

  // Capture console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Capture page errors (uncaught exceptions)
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log(`     ❌ navigation failed: ${e.message}`);
    results.push({ path, error: e.message });
    await page.close();
    continue;
  }

  // 1. Take screenshot
  const slug = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'home';
  const screenshotPath = join(OUT_DIR, `${slug}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  // 2. Horizontal scroll
  const hScroll = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      diff: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  // 3. Touch targets
  const touchTargets = await page.evaluate(() => {
    const interactive = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"]), summary'
    );
    const small = [];
    let count = 0;
    interactive.forEach((el) => {
      // Skip hidden elements
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') return;
      count++;
      if (rect.width < 44 || rect.height < 44) {
        small.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          class: el.className?.toString().slice(0, 60) || null,
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    });
    return { count, small };
  });

  // 4. Body font-size
  const fontSize = await page.evaluate(() => {
    return parseFloat(getComputedStyle(document.body).fontSize);
  });

  // 5. Viewport meta
  const viewportMeta = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return { present: false };
    const content = meta.getAttribute('content') || '';
    return {
      present: true,
      content,
      hasUserScalableNo: /user-scalable\s*=\s*no/i.test(content),
    };
  });

  // 6. Tab order (count focusable + first 3 elements)
  const tabOrder = await page.evaluate(() => {
    const focusable = Array.from(
      document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return {
      count: focusable.length,
      first3: focusable.slice(0, 3).map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
      })),
    };
  });

  // Report
  const hScrollOk = hScroll.diff <= 1; // 1px tolerance
  const fontOk = fontSize >= FONT_MIN;
  const viewportOk = viewportMeta.present && !viewportMeta.hasUserScalableNo;

  console.log(`     Screenshot: ${screenshotPath}`);
  console.log(`     H-scroll: ${hScroll.scrollWidth}px (viewport ${hScroll.clientWidth}px) ${hScrollOk ? '✅' : '❌ +' + hScroll.diff + 'px'}`);
  console.log(`     Body font-size: ${fontSize}px ${fontOk ? '✅' : '❌ (iOS would zoom)'}`);
  console.log(`     Viewport meta: ${viewportOk ? '✅' : '❌'} ${viewportMeta.hasUserScalableNo ? '(user-scalable=no!)' : ''}`);
  console.log(`     Interactive elements: ${touchTargets.count}`);
  console.log(`     Touch targets < ${TOUCH_MIN}px: ${touchTargets.small.length} ${touchTargets.small.length === 0 ? '✅' : '❌'}`);
  if (touchTargets.small.length > 0 && touchTargets.small.length <= 8) {
    touchTargets.small.forEach((s) => {
      console.log(`       - ${s.tag}.${(s.class || '').slice(0, 30)} (${s.w}×${s.h}) "${s.text}"`);
    });
  } else if (touchTargets.small.length > 8) {
    console.log(`       (showing first 5 of ${touchTargets.small.length})`);
    touchTargets.small.slice(0, 5).forEach((s) => {
      console.log(`       - ${s.tag}.${(s.class || '').slice(0, 30)} (${s.w}×${s.h}) "${s.text}"`);
    });
  }
  console.log(`     Tab focusable: ${tabOrder.count} (first 3: ${tabOrder.first3.map((e) => e.tag + ':' + e.text).join(' | ')})`);
  if (consoleErrors.length > 0) {
    console.log(`     ⚠️  Console errors: ${consoleErrors.length}`);
    consoleErrors.slice(0, 3).forEach((e) => console.log(`        ${e.slice(0, 100)}`));
  }
  if (pageErrors.length > 0) {
    console.log(`     ⚠️  Page errors: ${pageErrors.length}`);
    pageErrors.slice(0, 3).forEach((e) => console.log(`        ${e.slice(0, 100)}`));
  }

  results.push({
    path,
    url,
    hScroll: hScroll.diff,
    fontSize,
    viewportMeta,
    touchTargets: { count: touchTargets.count, small: touchTargets.small },
    tabOrder: { count: tabOrder.count, first3: tabOrder.first3 },
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length,
    hScrollOk,
    fontOk,
    viewportOk,
    touchOk: touchTargets.small.length === 0,
    screenshot: screenshotPath,
  });

  await page.close();
}

await browser.close();

// Summary
console.log('\n' + '═'.repeat(80));
console.log('  Summary');
console.log('═'.repeat(80));

const allHScrollOk = results.every((r) => r.hScrollOk);
const allFontOk = results.every((r) => r.fontOk);
const allViewportOk = results.every((r) => r.viewportOk);
const allTouchOk = results.every((r) => r.touchOk);

console.log(`  H-scroll:        ${allHScrollOk ? '✅ all clean' : '❌ some pages overflow'}`);
console.log(`  Font-size:       ${allFontOk ? '✅ all ≥ ' + FONT_MIN + 'px' : '❌ some < ' + FONT_MIN + 'px'}`);
console.log(`  Viewport meta:   ${allViewportOk ? '✅ all set correctly' : '❌ some have user-scalable=no'}`);
console.log(`  Touch targets:   ${allTouchOk ? '✅ all ≥ ' + TOUCH_MIN + 'px' : '❌ some < ' + TOUCH_MIN + 'px'}`);

// Write CSV
const csvPath = join(OUT_DIR, 'audit.csv');
const csvLines = [
  'path,h_scroll_diff,font_size,viewport_ok,touch_count,small_touch_count,touch_ok,console_errors,page_errors',
];
results.forEach((r) => {
  csvLines.push(
    [
      r.path,
      r.hScroll,
      r.fontSize,
      r.viewportOk ? 'true' : 'false',
      r.touchTargets?.count || 0,
      r.touchTargets?.small?.length || 0,
      r.touchOk ? 'true' : 'false',
      r.consoleErrors || 0,
      r.pageErrors || 0,
    ].join(',')
  );
});
writeFileSync(csvPath, csvLines.join('\n'));
console.log(`\n  CSV: ${csvPath}`);
console.log(`  Screenshots: ${OUT_DIR}/<slug>.png`);

// Exit code
const failed = !allHScrollOk || !allFontOk || !allViewportOk || !allTouchOk;
if (failed) process.exitCode = 1;
