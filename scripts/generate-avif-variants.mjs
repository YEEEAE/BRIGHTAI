#!/usr/bin/env node
/**
 * scripts/generate-avif-variants.mjs — AVIF-001 (2026-07-15)
 *
 * يولّد AVIF variants للصور في public/ كـ postbuild step.
 *
 * WHY:
 *   - AVIF أصغر من WebP بـ 20-30% في نفس الجودة.
 *   - مدعوم في 95%+ من المتصفحات (Safari 16+، Chrome 85+، Firefox 93+).
 *   - LCP image (logo-192.webp) ينخفض ~7KB (17KB → ~10KB).
 *
 * HOW:
 *   - يفحص public/_STAR_STAR_/_.webp + public/_STAR_STAR_/_.png + public/_STAR_STAR_/_.jpg ويولّد .avif بجانب كل صورة.
 *   - يستخدم sharp (npm package) — نفس الـ engine المستخدم في Astro image pipeline.
 *   - يحفظ في نفس المجلد (logo-192.webp → logo-192.avif).
 *
 * SCOPE:
 *   - يعالج الصور في public/ فقط (ما يلامس src/assets/).
 *   - يتجاهل SVG (ما يحتاج AVIF — vector أصلاً).
 *   - يتجاهل الصور أكبر من 200KB (OG images — ما يدعمها LinkedIn/Twitter).
 *
 * USAGE:
 *   - standalone: `node scripts/generate-avif-variants.mjs`
 *   - postbuild hook: شغّال تلقائياً بعد `pnpm build` (موجود في package.json).
 *
 * PREREQUISITES:
 *   - sharp مثبت (pnpm add -w sharp).
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PUBLIC_DIR = join(ROOT, 'public');
const SUPPORTED_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.agents', 'report', '.kilo', 'tests']);

// إعدادات الجودة (low effort, high ROI).
// AVIF quality 50-60 يكافئ WebP quality 75-85 بصرياً.
const AVIF_QUALITY = 60;
// Max file size to process (OG images ما تحتاج AVIF — LinkedIn/Twitter لا تدعمه).
const MAX_FILE_SIZE_BYTES = 200 * 1024;

function walkDir(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (SUPPORTED_EXTS.has(extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

async function generateAvif(sourcePath) {
  const targetPath = sourcePath.replace(/\.(webp|png|jpe?g)$/i, '.avif');

  // Skip لو الـ target أحدث من الـ source (idempotent rebuilds).
  if (existsSync(targetPath)) {
    const srcMtime = statSync(sourcePath).mtimeMs;
    const tgtMtime = statSync(targetPath).mtimeMs;
    if (tgtMtime >= srcMtime) {
      return { skipped: true, source: sourcePath, target: targetPath };
    }
  }

  const srcSize = statSync(sourcePath).size;
  if (srcSize > MAX_FILE_SIZE_BYTES) {
    return { skipped: true, reason: 'too-large', source: sourcePath, size: srcSize };
  }

  await sharp(sourcePath)
    .avif({ quality: AVIF_QUALITY, effort: 4 }) // effort=4 = faster encode (default=9, slow)
    .toFile(targetPath);

  const tgtSize = statSync(targetPath).size;
  const reduction = ((1 - tgtSize / srcSize) * 100).toFixed(1);
  return { source: sourcePath, target: targetPath, srcSize, tgtSize, reduction };
}

function log(msg) {
  console.log(`[avif-gen] ${msg}`);
}

async function main() {
  log(`يفحص ${PUBLIC_DIR} للصور المدعومة...`);
  const sources = walkDir(PUBLIC_DIR);
  log(`لُقى ${sources.length} صورة.`);

  let generated = 0;
  let skipped = 0;
  let totalSrcBytes = 0;
  let totalTgtBytes = 0;

  for (const source of sources) {
    const result = await generateAvif(source);
    if (result.skipped) {
      skipped++;
      if (result.reason === 'too-large') {
        log(`  ⊘ ${basename(source)} (${(result.size / 1024).toFixed(1)} KB) — تخطي (أكبر من 200KB)`);
      }
      continue;
    }
    generated++;
    totalSrcBytes += result.srcSize;
    totalTgtBytes += result.tgtSize;
    log(
      `  ✓ ${basename(result.source)} (${(result.srcSize / 1024).toFixed(1)} KB) → ` +
      `${basename(result.target)} (${(result.tgtSize / 1024).toFixed(1)} KB, -${result.reduction}%)`
    );
  }

  log('');
  log(`Generated: ${generated} | Skipped: ${skipped}`);
  if (generated > 0) {
    const totalReduction = ((1 - totalTgtBytes / totalSrcBytes) * 100).toFixed(1);
    log(`Total savings: ${(totalSrcBytes / 1024).toFixed(1)} KB → ${(totalTgtBytes / 1024).toFixed(1)} KB (-${totalReduction}%)`);
  }
  log('done.');
}

main().catch((err) => {
  console.error('[avif-gen] ❌', err);
  process.exit(1);
});