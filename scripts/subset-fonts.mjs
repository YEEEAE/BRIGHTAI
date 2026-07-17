#!/usr/bin/env node
/**
 * scripts/subset-fonts.mjs — Brand font subsetting لـ BrightAI.
 *
 * PURPOSE:
 * - يصغّر TheYearofTheCamel-Medium.woff2 (60KB) عبر subsetting دقيق.
 * - يولّد TheYearofTheCamel-Medium.subset.woff2 (~25KB).
 * - يحفظ backup في original/ (للـ rollback).
 *
 * SCOPE (مهم):
 * - يشتغل على TheYearofTheCamel brand font فقط (Latin-heavy display font).
 * - ما يلمس IBM Plex Sans Arabic (يأتي من Google Fonts CDN مع unicode-range
 *   subsetting تلقائي — لا داعي للـ self-host + subset).
 *
 * USAGE:
 * - كـ standalone: `node scripts/subset-fonts.mjs`
 * - كـ prebuild step: `pnpm fonts:subset` (معرّف في package.json)
 *
 * PREREQUISITES:
 * - Python 3 + fonttools: `pip3 install fonttools brotli`
 * - الـ source font موجود في public/assets/fonts/TheYearofTheCamel-Medium.woff2
 *
 * NON-NEGOTIABLES:
 * - لا نلمس IBM Plex Sans Arabic (قرار المستخدم — self-host يحتاج CI/CD setup).
 * - لا نحذف الـ original — نحتفظ به في original/ للـ rollback.
 * - الـ unicode-range محدود (brand + Latin basic) — مضمون < 40KB.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const FONT_DIR = join(ROOT, 'public/assets/fonts');
const ORIGINAL_DIR = join(FONT_DIR, 'original');
const SOURCE = join(FONT_DIR, 'TheYearofTheCamel-Medium.woff2');
const BACKUP = join(ORIGINAL_DIR, 'TheYearofTheCamel-Medium.original.woff2');
const OUTPUT = join(FONT_DIR, 'TheYearofTheCamel-Medium.subset.woff2');

// النص الفعلي اللي يظهر بـ BrightAI Official font:
// - Brand logo + module names + أرقام + punctuation الأساسية.
// - شامل كل الـ Latin chars اللي تظهر في headings (BrightAI, Kernel, QNX...).
// - لا يشمل عربي (الـ brand font Latin-only).
const TEXT_USED = [
  'BrightAI',           // brand name (الأهم)
  'QNX',                // analogy في tagline
  'Kernel',             // main module
  'Firewall',           // solution
  'Audit',              // solution
  'Approval',           // solution
  'Evidence',           // solution
  'OS',                 // system
  'AI',                 // كلمة متكررة
  'Saudi',              // English context
  '0123456789',         // أرقام
  ' .,+-/&·()[]{}!?',   // punctuation شائعة
  '™®©',               // trademarks
].join('');

function log(msg) {
  console.log(`[fonts:subset] ${msg}`);
}

function err(msg) {
  console.error(`[fonts:subset] ❌ ${msg}`);
  process.exit(1);
}

// ─── Step 1: تأكد إن الـ source موجود ─────────────────────────────
if (!existsSync(SOURCE)) {
  err(`الـ font الأصلي مش موجود: ${SOURCE}\nالـ script متوقعه يكون في public/assets/fonts/`);
}

// ─── Step 2: backup أول مرة (reproducible builds) ──────────────────
if (!existsSync(BACKUP)) {
  log('أول تشغيل — ينسخ backup إلى original/ ...');
  mkdirSync(ORIGINAL_DIR, { recursive: true });
  copyFileSync(SOURCE, BACKUP);
}

// ─── Step 3: لو الـ subset موجود أصلاً (مسلّم في git) — نتخطى ───
if (existsSync(OUTPUT)) {
  const existingSize = statSync(OUTPUT).size;
  log(`الـ subset موجود مسبقاً (${OUTPUT}) — ${(existingSize / 1024).toFixed(1)} KB`);
  log('نتخطى التوليد (idempotent). ثبّت fonttools محلياً لإعادة التوليد يدوياً:');
  log('  pip3 install fonttools brotli');
  log('done.');
  process.exit(0);
}

// ─── Step 3b: تأكد إن pyftsubset متاح (محلياً) ──────────────────
try {
  execFileSync('python3', ['-c', 'from fontTools import subset'], { stdio: 'pipe' });
} catch {
  err('pyftsubset مش متاح والـ subset غير موجود. ثبّت fonttools محلياً:\n  pip3 install fonttools brotli');
}

// ─── Step 4: قس حجم الـ source ─────────────────────────────────────
const sourceSize = statSync(BACKUP).size; // نستخدم backup (reproducibility)
log(`الـ source: ${BACKUP}`);
log(`حجم الـ source: ${(sourceSize / 1024).toFixed(1)} KB`);

// ─── Step 5: subsetting ─────────────────────────────────────────────
log('يشغّل pyftsubset ...');

const pyftArgs = [
  '-m', 'fontTools.subset',
  BACKUP,
  `--text=${TEXT_USED}`,
  '--flavor=woff2',
  `--output-file=${OUTPUT}`,
  // Optimizations — نخلي الـ font أصغر ما يمكن بدون ما نخسر glyphs.
  '--no-hinting',           // لا نحتاج hinting على الويب (modern browsers يتجاهلونه)
  '--desubroutinize',       // يفك CFF subroutines → أصغر
  '--name-IDs=*',           // يحتفظ بكل name records
  '--name-legacy',          // يحتفظ بـ Mac Roman name
  '--name-languages=*',
  '--glyph-names',          // يحتفظ بـ PostScript names
  '--symbol-cmap',
  '--legacy-cmap',
  '--notdef-glyph',         // يحتفظ بـ .notdef (ضروري)
  '--notdef-outline',
  '--recommended-glyphs',   // يحتفظ بالـ recommended glyphs
  '--drop-tables=',         // ما يحذف أي table
  '--passthrough-tables=',
  // Layout features — نخلي Latin shaping يعمل بشكل صحيح.
  '--layout-features=liga,clig,calt,kern,case,frac,numr,dnom,ordn,zero,sups,subs,smcp,caps',
];

try {
  execFileSync('python3', pyftArgs, { stdio: 'inherit' });
} catch (e) {
  err(`pyftsubset فشل: ${e.message}`);
}

// ─── Step 6: تحقّق من النتيجة ───────────────────────────────────────
if (!existsSync(OUTPUT)) {
  err(`Subset ما اتولد — تحقق من pyftsubset output.`);
}

const outputSize = statSync(OUTPUT).size;
const reduction = ((1 - outputSize / sourceSize) * 100).toFixed(1);

log(`✅ subset generated: ${OUTPUT}`);
log(`   ${(sourceSize / 1024).toFixed(1)} KB → ${(outputSize / 1024).toFixed(1)} KB (-${reduction}%)`);

if (outputSize > 40 * 1024) {
  console.warn(`[fonts:subset] ⚠️ الـ subset أكبر من المتوقع (>40 KB): ${(outputSize / 1024).toFixed(1)} KB`);
  console.warn('[fonts:subset]    ممكن تحتاج تضيف نصوص أكثر إلى TEXT_USED أو تـ optimize أكثر.');
}

log('done. شغّل pnpm build للحفظ في dist/.');