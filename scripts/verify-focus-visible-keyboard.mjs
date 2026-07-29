/**
 * verify-focus-visible-keyboard.mjs — BAI-A11Y-02 manual keyboard nav verification.
 *
 * يفتح / و /contact/ و / و /kernel/، يضغط Tab بشكل متتالي،
 * ويلتقط focused element + computed outline. يتأكد إن كل focusable
 * element له visible focus indicator (outline أو box-shadow).
 *
 * المخرجات:
 *   - JSON مع كل tab step + الـ focused selector + outline/shadow
 *   - Exit 1 لو أي focused element ما عنده focus indicator
 *
 * الاستخدام:
 *   BASE_URL=http://localhost:4321 node scripts/verify-focus-visible-keyboard.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const PAGES = ['/', '/contact/', '/pricing/'];
const TABS_PER_PAGE = 15;  // أول 15 focusable elements (يشمل nav + form)

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const results = [];

for (const path of PAGES) {
  const url = `${BASE_URL}${path}`;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const pageResult = { path, url, tabs: [] };

  for (let i = 0; i < TABS_PER_PAGE; i++) {
    await page.keyboard.press('Tab');
    // Give the browser a tick to apply focus-visible state
    await page.waitForTimeout(50);

    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: 'body', indicator: 'BODY' };
      const cs = getComputedStyle(el);
      const outline = `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`.trim();
      const boxShadow = cs.boxShadow;
      const hasOutline = cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px';
      // box-shadow acts as focus indicator if it has non-transparent pixels and offset 0
      const hasRing = boxShadow !== 'none' && boxShadow.length > 0;
      return {
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || null,
        role: el.getAttribute('role') || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        text: (el.textContent || '').trim().slice(0, 40),
        outline,
        boxShadow: boxShadow.slice(0, 60),
        hasOutline,
        hasRing,
        indicator: hasOutline ? 'outline' : (hasRing ? 'box-shadow' : 'NONE'),
      };
    });

    pageResult.tabs.push({ step: i + 1, ...info });
  }

  results.push(pageResult);
  await page.close();
}

await browser.close();

// طباعة ملخص
let totalChecks = 0;
let totalPassed = 0;
let failures = [];
for (const pr of results) {
  console.log(`\n═══ ${pr.path} ═══`);
  for (const t of pr.tabs) {
    totalChecks++;
    const ok = t.indicator !== 'NONE' && t.indicator !== 'BODY';
    if (ok) totalPassed++;
    else failures.push({ path: pr.path, step: t.step, tag: t.tag, info: t });
    const tag = ok ? '✅' : '❌';
    console.log(
      `  ${tag} [${t.step}] <${t.tag}${t.type ? ` type=${t.type}` : ''}${t.role ? ` role=${t.role}` : ''}> ` +
      `text="${t.text || '(empty)'}" → ${t.indicator}`,
    );
    if (t.indicator === 'outline') {
      console.log(`       outline: ${t.outline}`);
    } else if (t.indicator === 'box-shadow') {
      console.log(`       box-shadow: ${t.boxShadow}`);
    }
  }
}

console.log(`\n════════════════════════════════════════════`);
console.log(`  Total: ${totalPassed}/${totalChecks} focusable elements have visible focus indicator`);
console.log(`════════════════════════════════════════════`);

writeFileSync('focus-keyboard-report.json', JSON.stringify(results, null, 2));

if (failures.length > 0) {
  console.error(`\n❌ ${failures.length} focused element(s) lack visible focus indicator.`);
  process.exit(1);
}
console.log('\n✅ كل focusable element له focus indicator مرئي.');
process.exit(0);
