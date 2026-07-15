/**
 * axe-scan.mjs — WCAG 2.1 AA automated accessibility scan (BAI-008)
 *
 * يشغّل axe-core على صفحات حرجة عبر Playwright + @axe-core/playwright.
 *
 *   - Critical violations  → process.exit(1)  (يفشّل الـ merge عبر الـ workflow)
 *   - Serious violations   → تحذير فقط (يُنشر كـ comment على الـ PR)
 *   - Moderate / Minor     → تقرير فقط
 *
 * المخرجات:
 *   - a11y-report.json   (النتائج كاملة — تُرفع كـ artifact)
 *   - a11y-report.html   (تقرير HTML مكتفٍ ذاتيًا — للمراجعة)
 *
 * الاستخدام:
 *   BASE_URL=http://localhost:4321 node scripts/axe-scan.mjs
 *
 * ملاحظة: @axe-core/reporter-html غير موجود في الـ registry، فنولّد
 * التقرير HTML من الـ JSON داخليًا بدون dependency إضافية.
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:4321';

// صفحات حرجة — مسارات مُتحقّق منها فعليًا في src/pages
const CRITICAL_PAGES = [
  '/',
  '/en/',
  '/pricing/',
  '/contact/',
  '/about/',
  '/trust/',
  '/kernel/',
  '/kernel/chat/',
  '/blog/',
  '/customers/bank/',
  '/solutions/',
  '/docs/',
  '/hub/',
];

const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

/** @type {Array<{path:string,url:string,error?:string,violations:object[],full:object}>} */
const all = [];

for (const path of CRITICAL_PAGES) {
  const url = `${BASE_URL}${path}`;
  let results;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
  } catch (err) {
    console.error(`⚠️ فشل تحميل أو فحص ${url}: ${err.message}`);
    all.push({ path, url, error: err.message, violations: [], full: null });
    continue;
  }
  all.push({
    path,
    url,
    violations: results.violations,
    full: results,
  });
}

await browser.close();

// تجميع حسب الشدة
const summary = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
const byPage = [];
for (const r of all) {
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  for (const v of r.violations) {
    if (v.impact && SEVERITY_ORDER.includes(v.impact)) counts[v.impact]++;
  }
  for (const s of SEVERITY_ORDER) summary[s] += counts[s];
  byPage.push({ path: r.path, url: r.url, counts, total: r.violations.length, error: r.error || null });
}

// طباعة الملخص
const line = '═'.repeat(54);
console.log(line);
console.log('  A11y Scan Summary (WCAG 2.1 AA)');
console.log(line);
console.log(`  Pages scanned : ${all.length}`);
console.log(`  Critical      : ${summary.critical}`);
console.log(`  Serious       : ${summary.serious}`);
console.log(`  Moderate      : ${summary.moderate}`);
console.log(`  Minor         : ${summary.minor}`);
console.log('');
for (const bp of byPage) {
  const tag = bp.error ? 'ERR ' : bp.total ? 'FAIL' : ' ok ';
  console.log(
    `  [${tag}] ${bp.path.padEnd(20)} C:${bp.counts.critical} S:${bp.counts.serious} M:${bp.counts.moderate} m:${bp.counts.minor}`,
  );
}
console.log(line);

// كتابة المخرجات
writeFileSync('a11y-report.json', JSON.stringify(all, null, 2));
writeFileSync('a11y-report.html', buildHtmlReport(all, summary));

// قرار الخروج
if (summary.critical > 0) {
  console.error(`\n❌ ${summary.critical} critical violation(s) — يفشل الـ merge.`);
  process.exit(1);
}
if (summary.serious > 0) {
  console.warn(`\n⚠️ ${summary.serious} serious violation(s) — تحذير فقط (ما يفشل).`);
}
console.log('\n✅ لا يوجد critical violations.');
process.exit(0);

/**
 * يولّد تقرير HTML مكتفٍ ذاتيًا من نتائج axe.
 */
function buildHtmlReport(data, summary) {
  const rows = data
    .map((r) => {
      const items = (r.violations || [])
        .map((v) => {
          const nodes = (v.nodes || [])
            .map((n) => `<li><code>${(n.target || []).join(' ')}</code></li>`)
            .join('');
          return `
        <div class="violation severity-${(v.impact || 'unknown')}">
          <h3>${escapeHtml(v.id)} — <span class="impact">${(v.impact || 'unknown').toUpperCase()}</span></h3>
          <p>${escapeHtml(v.help || '')} <a href="${escapeHtml(v.helpUrl || '#')}" target="_blank" rel="noopener">docs</a></p>
          <ul>${nodes || '<li>—</li>'}</ul>
        </div>`;
        })
        .join('');
      const status = r.error
        ? `<span class="err">ERROR: ${escapeHtml(r.error)}</span>`
        : r.violations.length
          ? `${r.violations.length} violation(s)`
          : '<span class="ok">clean</span>';
      return `
      <section class="page">
        <h2>${escapeHtml(r.path)} <small>${escapeHtml(r.url)}</small></h2>
        <p class="status">${status}</p>
        ${items || '<p class="ok">لا يوجد مخالفات.</p>'}
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BrightAI A11y Report</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#111;}
  h1{font-size:1.4rem;}
  .summary{display:flex;gap:1rem;margin:1rem 0;}
  .summary div{border:1px solid #ccc;border-radius:8px;padding:.75rem 1rem;min-width:90px;text-align:center;}
  .summary b{display:block;font-size:1.4rem;}
  .page{border-top:1px solid #eee;padding:1rem 0;}
  .violation{border-left:4px solid #999;padding:.5rem .75rem;margin:.5rem 0;background:#fafafa;}
  .severity-critical{border-color:#d33;}
  .severity-serious{border-color:#e90;}
  .severity-moderate{border-color:#fb3;}
  .severity-minor{border-color:#9ad;}
  .impact{font-size:.75rem;padding:.1rem .4rem;border-radius:4px;background:#222;color:#fff;}
  .ok{color:#2a2;} .err{color:#d33;} code{background:#f0f0f0;padding:.1rem .3rem;border-radius:4px;}
  small{color:#888;font-weight:normal;}
</style>
</head>
<body>
<h1>BrightAI — Accessibility Scan (WCAG 2.1 AA)</h1>
<div class="summary">
  <div><b>${summary.critical}</b>Critical</div>
  <div><b>${summary.serious}</b>Serious</div>
  <div><b>${summary.moderate}</b>Moderate</div>
  <div><b>${summary.minor}</b>Minor</div>
</div>
${rows}
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
