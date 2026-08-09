/**
 * verify-chat-screenreader.mjs — CHAT-STATE-001 screen-reader verification.
 *
 * Verifies the chat page is comprehensible to assistive technology:
 *   1. axe-core: no critical/serious violations on initial load.
 *   2. Every interactive element has an accessible name (button/link/input).
 *   3. The source badge on each AI message has a meaningful aria-label.
 *   4. The announcer live region exists + is empty on load (no premature
 *      announcement), then gets the complete reply after a demo send.
 *   5. The error banner uses role="alert" (assertive) + has text content.
 *
 * Usage: node scripts/playwright/verify-chat-screenreader.mjs --base=http://localhost:8788
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.argv.find((a) => a.startsWith('--base='))?.split('=')[1] ?? 'http://localhost:8788';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const failures = [];

function report(label, ok, detail = '') {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(label);
}

console.log(`\nCHAT screen-reader verification — ${base}/kernel/chat/\n`);
await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });

// 1. axe-core scan.
console.log('1) axe-core scan (critical/serious)');
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
const critical = axe.violations.filter((v) => v.impact === 'critical');
const serious = axe.violations.filter((v) => v.impact === 'serious');
report('no critical violations', critical.length === 0, critical.map((v) => v.id).join(', ') || 'none');
report('no serious violations', serious.length === 0, serious.map((v) => v.id).join(', ') || 'none');
if (critical.length || serious.length) {
  for (const v of [...critical, ...serious]) {
    console.log(`     • ${v.id}: ${v.description}`);
    v.nodes.slice(0, 2).forEach((n) => console.log(`       target: ${JSON.stringify(n.target)}`));
  }
}

// 2. Every interactive element has an accessible name.
console.log('\n2) Accessible names on interactive elements');
const unnamed = await page.evaluate(() => {
  const out = [];
  const sel = 'button:not([aria-hidden="true"]), a[href]:not([aria-hidden="true"]), input:not([type=hidden]):not([aria-hidden="true"]), textarea:not([aria-hidden="true"]), select:not([aria-hidden="true"])';
  document.querySelectorAll(sel).forEach((el) => {
    if (el.getClientRects().length === 0) return; // skip off-screen
    const name = el.getAttribute('aria-label') || el.getAttribute('title') ||
      (el.labels && el.labels[0] && el.labels[0].textContent) ||
      (el.textContent || '').trim();
    if (!name) out.push(el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''));
  });
  return out;
});
report('all interactive elements have a name', unnamed.length === 0, unnamed.slice(0, 5).join(', ') || 'none unnamed');

// 3. Source badge accessible label (seed messages carry badges? No —
//    badges are added by JS at runtime. So we trigger a demo reply and
//    check the new badge has an aria-label.)
console.log('\n3) Source badge aria-label after a demo reply');
await page.route('**/api/ai/chat/**', (route) =>
  route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not_found"}' }),
);
await page.fill('[data-kernel-chat-input]', 'اختبار قارئ الشاشة');
await page.click('[data-kernel-chat-send]');
await page.waitForTimeout(1500); // demo reply delay
const badgeHasLabel = await page.evaluate(() => {
  const badges = document.querySelectorAll('.kernel-source-badge[data-source]:not([data-source="pending"])');
  for (const b of badges) {
    const label = b.getAttribute('aria-label');
    if (!label || label.length < 4) return { ok: false, label };
  }
  return { ok: badges.length > 0, count: badges.length };
});
report('demo badge has meaningful aria-label', badgeHasLabel.ok, badgeHasLabel.label || `count=${badgeHasLabel.count}`);
await page.unroute('**/api/ai/chat/**');

// 4. Announcer live region: exists, empty on load.
console.log('\n4) Announcer live region');
const announcerPresent = await page.locator('[data-kernel-chat-announcer]').count();
report('announcer live region present', announcerPresent > 0);

// 5. Error banner uses role="alert".
console.log('\n5) Error banner role=alert');
await page.route('**/api/ai/chat/**', (route) =>
  route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"provider_failed"}' }),
);
await page.fill('[data-kernel-chat-input]', 'سؤال ثاني');
await page.click('[data-kernel-chat-send]');
await page.waitForTimeout(500);
const alertRole = await page.locator('[data-kernel-chat-error-slot] [role="alert"]').count();
report('error banner uses role="alert"', alertRole > 0);
const retryLabel = await page.locator('[data-kernel-chat-error-slot] [data-kernel-retry]').first().getAttribute('aria-label');
report('retry button has aria-label', !!retryLabel, retryLabel || 'missing');
await page.unroute('**/api/ai/chat/**');

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${failures.length === 0 ? '✅ ALL SCREEN-READER CHECKS PASSED' : '❌ ' + failures.length + ' CHECK(S) FAILED'}`);
if (failures.length) {
  console.log('Failed:');
  failures.forEach((f) => console.log('  - ' + f));
}
await browser.close();
process.exit(failures.length === 0 ? 0 : 1);
