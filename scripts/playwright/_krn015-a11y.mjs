// KRN-015 verification: axe-core check on every page using KernelTabs pattern
// + RTL keyboard navigation smoke test on /kernel/approvals/.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URLS = [
  'http://localhost:4321/kernel/approvals/',
  'http://localhost:4321/kernel/stats/',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// axe-core via CDN injection
const axeSource = fs.readFileSync(
  '/Users/yzydalshmry/Desktop/BRIGHTAI/node_modules/.pnpm/axe-core@4.12.1/node_modules/axe-core/axe.min.js',
  'utf8',
);

const issues = [];
for (const url of URLS) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () => {
    // @ts-ignore
    return await window.axe.run({
      runOnly: { type: 'rule', values: ['aria-roles', 'aria-valid-attr-value', 'aria-required-attr', 'aria-required-children', 'aria-required-parent', 'tabindex', 'role-img-alt'] },
    });
  });
  const tablistViolations = r.violations.filter((v) =>
    /tab|tablist|role.*tab|aria-required-attr|aria-roles|tabindex/i.test(v.id + ' ' + v.help),
  );
  issues.push({ url, count: tablistViolations.length, sample: tablistViolations.slice(0, 3) });
  console.log(`${url} → axe violations (tablist-related): ${tablistViolations.length}`);
  for (const v of tablistViolations.slice(0, 3)) {
    console.log(`  - ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
  }
}

// RTL keyboard: navigate to approvals, focus tab, press ArrowLeft and verify
// the SECOND tab becomes selected (because RTL inverts: Left = next).
await page.goto('http://localhost:4321/kernel/approvals/', { waitUntil: 'networkidle' });
// Hide auto-modal that intercepts pointer events on this page
await page.evaluate(() => {
  document.querySelectorAll('.kernel-modal, [data-kernel-modal]').forEach((m) => {
    if (m instanceof HTMLElement) m.hidden = true;
  });
});
await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
const tabs = await page.$$('[role="tab"]');
console.log(`\nRTL keyboard test: ${tabs.length} tabs found`);

// Reset tab selection + focus first tab directly (avoid click intercepted by modal)
await page.evaluate(() => {
  const t = document.querySelectorAll('[role="tab"]');
  t.forEach((tab, i) => {
    const sel = i === 0;
    tab.setAttribute('aria-selected', sel ? 'true' : 'false');
    tab.setAttribute('tabindex', sel ? '0' : '-1');
  });
  (t[0]).focus();
});
const initialFocus = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? el.getAttribute('data-tab-id') : 'none';
});
console.log(`  initial focused tab: ${initialFocus} (expect pending)`);

await page.keyboard.press('ArrowLeft');
const afterLeft = await page.evaluate(() => {
  const el = document.activeElement;
  return `${el.getAttribute('data-tab-id')}::${el.getAttribute('aria-selected')}`;
});
console.log(`  after ArrowLeft in RTL: ${afterLeft} (expect: approved, since RTL inverts Left→next)`);

await page.keyboard.press('Home');
const afterHome = await page.evaluate(() => {
  const el = document.activeElement;
  return `${el.getAttribute('data-tab-id')}::${el.getAttribute('aria-selected')}`;
});
console.log(`  after Home: ${afterHome} (expect: pending, first tab)`);

await page.keyboard.press('End');
const afterEnd = await page.evaluate(() => {
  const el = document.activeElement;
  return `${el.getAttribute('data-tab-id')}::${el.getAttribute('aria-selected')}`;
});
console.log(`  after End: ${afterEnd} (expect: rejected, last tab)`);

// Now LTR test
await page.evaluate(() => document.documentElement.setAttribute('dir', 'ltr'));
await page.evaluate(() => {
  const t = document.querySelectorAll('[role="tab"]');
  t.forEach((tab, i) => {
    const sel = i === 0;
    tab.setAttribute('aria-selected', sel ? 'true' : 'false');
    tab.setAttribute('tabindex', sel ? '0' : '-1');
  });
  (t[0]).focus();
});
await page.keyboard.press('ArrowRight');
const ltrRight = await page.evaluate(() => {
  const el = document.activeElement;
  return `${el.getAttribute('data-tab-id')}::${el.getAttribute('aria-selected')}`;
});
console.log(`\nLTR keyboard test:`);
console.log(`  after ArrowRight in LTR: ${ltrRight} (expect: approved, Right→next in LTR)`);

await browser.close();
console.log(`\nDONE. tablist violations total: ${issues.reduce((a, b) => a + b.count, 0)}`);
process.exit(issues.reduce((a, b) => a + b.count, 0) > 0 ? 1 : 0);
