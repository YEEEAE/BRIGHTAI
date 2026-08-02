/**
 * axe-kernel.mjs — M29: WCAG 2.2 AA scan على كل صفحات Kernel الـ16.
 *
 * الاستخدام:
 *   A11Y_BASE_URL=http://localhost:4322 node scripts/playwright/axe-kernel.mjs
 *
 * المخرجات:
 *   - report/a11y-kernel.json  (النتائج كاملة)
 *   - report/a11y-kernel.txt   (ملخص مخالفات لكل صفحة)
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:4322';

const KERNEL_PAGES = [
  '/kernel/', '/kernel/admin/', '/kernel/api/', '/kernel/approvals/',
  '/kernel/audit/', '/kernel/chat/', '/kernel/compliance/', '/kernel/connectors/',
  '/kernel/datasets/', '/kernel/eval/', '/kernel/evidence/', '/kernel/models/',
  '/kernel/offline/', '/kernel/playground/', '/kernel/policies/', '/kernel/redteam/',
  '/kernel/replay/', '/kernel/reports/', '/kernel/scenarios/', '/kernel/scorers/',
  '/kernel/stats/',
];

const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const all = [];
for (const path of KERNEL_PAGES) {
  const url = `${BASE_URL}${path}`;
  let results;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
  } catch (err) {
    console.error(`⚠️ فشل ${url}: ${err.message}`);
    all.push({ path, url, error: err.message, violations: [] });
    continue;
  }
  all.push({ path, url, violations: results.violations });
}
await browser.close();

const summary = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
const byPage = [];
for (const r of all) {
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  for (const v of r.violations) if (v.impact && SEVERITY_ORDER.includes(v.impact)) counts[v.impact]++;
  for (const s of SEVERITY_ORDER) summary[s] += counts[s];
  byPage.push({ path: r.path, counts, total: r.violations.length, error: r.error || null });
}

const line = '═'.repeat(60);
let txt = `${line}\n  A11y Kernel Scan (WCAG 2.2 AA) — ${BASE_URL}\n${line}\n`;
txt += `  Pages: ${all.length}   Critical: ${summary.critical}   Serious: ${summary.serious}   Moderate: ${summary.moderate}   Minor: ${summary.minor}\n\n`;
const failByRule = new Map();
for (const r of all) {
  const tag = r.error ? 'ERR' : r.violations.length ? 'FAIL' : ' ok ';
  txt += `  [${tag}] ${r.path.padEnd(30)} C:${byPage.find(b => b.path === r.path).counts.critical} S:${byPage.find(b => b.path === r.path).counts.serious} M:${byPage.find(b => b.path === r.path).counts.moderate} m:${byPage.find(b => b.path === r.path).counts.minor}\n`;
  for (const v of r.violations) {
    if (v.impact === 'critical' || v.impact === 'serious') {
      const key = `${v.id} [${v.impact}]`;
      failByRule.set(key, (failByRule.get(key) || 0) + 1);
    }
  }
}
txt += `${line}\n  مخالفات Critical/Serious متكررة عبر الصفحات:\n`;
for (const [rule, n] of [...failByRule.entries()].sort((a, b) => b[1] - a[1])) {
  txt += `    ${String(n).padStart(3)} × ${rule}\n`;
}
txt += line + '\n';
console.log(txt);

writeFileSync('report/a11y-kernel.json', JSON.stringify(all, null, 2));
writeFileSync('report/a11y-kernel.txt', txt);
console.log(`تم الحفظ: report/a11y-kernel.json + report/a11y-kernel.txt`);

if (summary.critical > 0) process.exit(1);
process.exit(0);
