#!/usr/bin/env node
/**
 * check-performance-budget.js
 *
 * فحص ميزانية الأداء لمخرجات dist/client/ الفعلية بعد `astro build`.
 * يقيس:
 *   1. dist/client/index.html < 80KB
 *   2. أكبر ملف CSS في dist/client/_astro < 50KB (مرحلة أولى، الهدف النهائي 30KB)
 *   3. إجمالي JS في dist/client/_astro < 60KB
 *
 * السلوك:
 *   - نجاح: يطبع جدولاً ملخصاً بحالة "OK" لكل بند، ثم exit 0.
 *   - فشل: يطبع جدولاً كاملاً يبيّن كل بند وحجمه والحد والفجوة، ثم exit 1.
 *
 * لا يعتمد على أي ملف إعداد خارجي — الميزانيات مدمجة هنا لأنها متطلبات
 * تشغيليّة محدّدة (مرحلة 1). عند تشديد الحدود لاحقاً، عدّل BUDGETS مباشرة.
 *
 * PERF-BUDGET-001 (2026-07-18): read from the unified client build root
 * (dist/client/ when present, else dist/) via _build-output.mjs. Before
 * this change the script hardcoded `dist/`, which meant it measured the
 * flat copy (sync-dist-flat.mjs output) rather than the actual adapter
 * output. Now it reads the same root as the other 3 verification scripts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { resolveClientBuildRoot } from './_build-output.mjs';

const ROOT = process.cwd();
// PERF-BUDGET-001: resolve the canonical client build root. Fail loudly
// instead of silently measuring a stale `dist/` from a previous build.
const clientBuild = resolveClientBuildRoot(ROOT);
if (!clientBuild.root) {
  console.error(`\u274c فشل فحص ميزانية الأداء: ${clientBuild.reason}`);
  process.exit(1);
}
const DIST_DIR = clientBuild.root;
const ASTRO_DIR = path.join(DIST_DIR, '_astro');

/**
 * ميزانيات الأداء (مرحلة 1).
 * عند تشديد أي حد لاحقاً (مثلاً: cssMaxBytes → 30KB نهائياً)، عدّل القيمة هنا.
 *
 * PERF-BUDGET-001 (2026-07-18): labels now reflect the actual measured
 * location (dist/client/) rather than the legacy flat dist/.
 */
const BUDGETS = {
  indexHtml: { label: 'dist/client/index.html', maxBytes: 80 * 1024 },
  cssLargest: { label: 'أكبر ملف CSS في dist/client/_astro', maxBytes: 50 * 1024 },
  jsTotal: { label: 'إجمالي JS في dist/client/_astro', maxBytes: 60 * 1024 },
};

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(2)} ك.ب`;
}

function fail(msg) {
  console.error(`\u274c فشل فحص ميزانية الأداء: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(DIST_DIR)) {
  fail(`مجلد ${path.relative(ROOT, DIST_DIR)}/ غير موجود. شغّل \`npm run build\` أولاً.`);
}

/* ──────────────────────────────────────────────────────────────────────────
 * جمع البيانات
 * ────────────────────────────────────────────────────────────────────────── */

const indexHtmlPath = path.join(DIST_DIR, 'index.html');
const indexHtmlBytes = fs.existsSync(indexHtmlPath)
  ? fs.statSync(indexHtmlPath).size
  : null;

const cssFiles = globSync('**/*.css', { cwd: ASTRO_DIR, nodir: true }).map((rel) => {
  const full = path.join(ASTRO_DIR, rel);
  return { rel, bytes: fs.statSync(full).size };
});
cssFiles.sort((a, b) => b.bytes - a.bytes);

const jsFiles = globSync('**/*.js', { cwd: ASTRO_DIR, nodir: true }).map((rel) => {
  const full = path.join(ASTRO_DIR, rel);
  return { rel, bytes: fs.statSync(full).size };
});
jsFiles.sort((a, b) => b.bytes - a.bytes);

const jsTotalBytes = jsFiles.reduce((sum, f) => sum + f.bytes, 0);
const cssLargestBytes = cssFiles.length > 0 ? cssFiles[0].bytes : 0;
const cssLargestName = cssFiles.length > 0 ? cssFiles[0].rel : '—';

/* ──────────────────────────────────────────────────────────────────────────
 * تقييم البنود
 * ────────────────────────────────────────────────────────────────────────── */

const checks = [
  {
    key: 'index-html',
    label: BUDGETS.indexHtml.label,
    path: 'dist/index.html',
    measured: indexHtmlBytes,
    budget: BUDGETS.indexHtml.maxBytes,
    unit: 'bytes',
  },
  {
    key: 'css-largest',
    label: `${BUDGETS.cssLargest.label} (${cssLargestName})`,
    path: `dist/_astro/${cssLargestName}`,
    measured: cssLargestBytes,
    budget: BUDGETS.cssLargest.maxBytes,
    unit: 'bytes',
  },
  {
    key: 'js-total',
    label: `${BUDGETS.jsTotal.label} (${jsFiles.length} ملف)`,
    path: 'dist/_astro/**',
    measured: jsTotalBytes,
    budget: BUDGETS.jsTotal.maxBytes,
    unit: 'bytes',
  },
];

for (const check of checks) {
  if (check.measured === null) {
    check.passed = false;
    check.gap = null;
    check.note = 'الملف غير موجود';
  } else {
    check.passed = check.measured <= check.budget;
    check.gap = check.measured - check.budget;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * طباعة الجدول
 * ────────────────────────────────────────────────────────────────────────── */

const pad = (s, n) => String(s).padEnd(n, ' ');
const padNum = (s, n) => String(s).padStart(n, ' ');

const NAME_W = 46;
const MEASURED_W = 12;
const BUDGET_W = 12;
const GAP_W = 12;
const STATUS_W = 8;

console.log(`\n┌── فحص ميزانية الأداء (${path.relative(ROOT, DIST_DIR)}/) ──────────────────────────────────┐\n`);

console.log(
  `│ ${pad('البند', NAME_W)} │ ${padNum('القياس', MEASURED_W)} │ ${padNum('الحد', BUDGET_W)} │ ${padNum('الفجوة', GAP_W)} │ ${pad('الحالة', STATUS_W)} │`
);
console.log(
  `│ ${pad('─'.repeat(NAME_W), NAME_W)} │ ${pad('─'.repeat(MEASURED_W - 2), MEASURED_W)} │ ${pad('─'.repeat(BUDGET_W - 2), BUDGET_W)} │ ${pad('─'.repeat(GAP_W - 2), GAP_W)} │ ${pad('─'.repeat(STATUS_W - 2), STATUS_W)} │`
);

for (const c of checks) {
  const measuredText = c.measured === null ? '—' : formatKB(c.measured);
  const budgetText = formatKB(c.budget);
  const gapText = c.gap === null
    ? '—'
    : (c.gap > 0 ? `+${formatKB(c.gap)}` : `${formatKB(c.gap)}`);
  const statusText = c.passed ? '✅ OK' : (c.note ? `⚠ ${c.note}` : '❌ FAIL');

  console.log(
    `│ ${pad(c.label, NAME_W)} │ ${padNum(measuredText, MEASURED_W)} │ ${padNum(budgetText, BUDGET_W)} │ ${padNum(gapText, GAP_W)} │ ${pad(statusText, STATUS_W)} │`
  );
}

console.log('');

/* طباعة تفاصيل (top 3 CSS + كل JS) لتسهيل التشخيص */
if (cssFiles.length > 0) {
  console.log(`أعلى 3 ملفات CSS في ${path.relative(ROOT, ASTRO_DIR)}/:`);
  for (const f of cssFiles.slice(0, 3)) {
    console.log(`  - ${f.rel} → ${formatKB(f.bytes)}`);
  }
}
if (jsFiles.length > 0) {
  console.log(`\nكل ملفات JS في ${path.relative(ROOT, ASTRO_DIR)}/:`);
  for (const f of jsFiles) {
    console.log(`  - ${f.rel} → ${formatKB(f.bytes)}`);
  }
}
console.log('');

/* ──────────────────────────────────────────────────────────────────────────
 * الخلاصة + exit code
 * ────────────────────────────────────────────────────────────────────────── */

const failed = checks.filter((c) => !c.passed);

if (failed.length === 0) {
  console.log('✅ نجاح: جميع البنود ضمن ميزانية الأداء.\n');
  process.exit(0);
}

console.log(`❌ فشل ${failed.length} بند(ات) من ميزانية الأداء:\n`);
for (const c of failed) {
  if (c.note) {
    console.log(`  - ${c.label}: ${c.note}`);
  } else {
    console.log(`  - ${c.label}: قياس ${formatKB(c.measured)} vs حد ${formatKB(c.budget)} (تجاوز ${formatKB(c.gap)})`);
  }
}
console.log('');
process.exit(1);