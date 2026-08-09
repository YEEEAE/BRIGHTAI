/**
 * verify-form-ux.mjs — KRN-FORM-001 verification (2026-08-09).
 *
 * Verifies the canonical form vocabulary on the in-scope kernel pages:
 *   /kernel/playground/  /kernel/chat/  /kernel/policies/
 *
 * Checks (acceptance: "every field has an associated label and a recovery
 * message"):
 *   1. Every input/select/textarea has an accessible name (label or aria-label).
 *   2. axe-core: no critical/serious a11y violations (form-related).
 *   3. Keyboard: the primary composer/input is tab-focusable.
 *   4. Recovery: submitting empty on playground + chat reveals a live error
 *      and sets aria-invalid on the control.
 *
 * Usage: node scripts/playwright/verify-form-ux.mjs --base=http://localhost:8788
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.argv.find((a) => a.startsWith('--base='))?.split('=')[1] ?? 'http://localhost:8788';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
let failures = [];

function report(label, ok, detail = '') {
  console.log(`${ok ? '  ✅' : '  ❌'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(label);
}

async function checkLabels(url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  const missing = await page.evaluate(() => {
    const out = [];
    const sel = 'input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea';
    document.querySelectorAll(sel).forEach((el) => {
      const hasAriaLabel = el.getAttribute('aria-label');
      const hasLabel =
        (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
        el.closest('label');
      if (!hasAriaLabel && !hasLabel) out.push(`${el.tagName.toLowerCase()}#${el.id || '(no-id)'} (${(el.getAttribute('placeholder') || '').slice(0, 30)})`);
    });
    return out;
  });
  report(`${url} — كل الحقول لها اسم ميسّر`, missing.length === 0, missing.length ? missing.join(' | ') : '');
}

// axe on the three pages
for (const url of [`${base}/kernel/playground/`, `${base}/kernel/chat/`, `${base}/kernel/policies/`]) {
  await checkLabels(url);
  await page.goto(url, { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  const formRel = serious.filter((v) => v.id.match(/label|name|button-name|aria|region|nested-interactive/i));
  report(`axe ${url} — 0 critical/serious form violations`, formRel.length === 0,
    formRel.map((v) => `${v.id}(${v.nodes.length})`).join(' | '));
}

// Keyboard: composer focusability
await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const composerFocused = await page.evaluate(() => {
  const ta = document.querySelector('#kernel-chat-input');
  if (!ta) return false;
  ta.focus();
  return document.activeElement === ta;
});
report('chat — composer قابل للتركيز بالكيبورد', composerFocused === true);

// Recovery: chat empty submit
await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.focus('#kernel-chat-input');
await page.press('#kernel-chat-input', 'Enter');
const chatRecovery = await page.evaluate(() => {
  const err = document.getElementById('kernel-chat-input-error');
  const input = document.getElementById('kernel-chat-input');
  return { visible: err && !err.hidden, invalid: input && input.getAttribute('aria-invalid') === 'true' };
});
report('chat — إرسال فارغ يظهر رسالة استرداد + aria-invalid', chatRecovery.visible && chatRecovery.invalid,
  JSON.stringify(chatRecovery));

// Recovery: playground empty run
await page.goto(`${base}/kernel/playground/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.click('#pg-run');
const pgRecovery = await page.evaluate(() => {
  const err = document.getElementById('pg-input-error');
  const input = document.getElementById('pg-input');
  return { visible: err && !err.hidden, invalid: input && input.getAttribute('aria-invalid') === 'true' };
});
report('playground — تشغيل فارغ يظهر رسالة استرداد + aria-invalid', pgRecovery.visible && pgRecovery.invalid,
  JSON.stringify(pgRecovery));

await browser.close();
if (failures.length) {
  console.log(`\n${failures.length} فحص فشل.`);
  process.exit(1);
}
console.log('\nكل فحوصات النموذج نجحت.');
process.exit(0);
