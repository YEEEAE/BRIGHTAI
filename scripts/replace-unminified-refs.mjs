/**
 * replace-unminified-refs.mjs
 * ---------------------------------------------------------------------------
 * يبحث في جميع ملفات HTML في المشروع ويستبدل استدعاءات الملفات غير المصغرة
 * بالنسخ المصغرة (.min.js / .min.css).
 *
 * الاستخدام:
 *   node scripts/replace-unminified-refs.mjs          # تنفيذ فعلي
 *   node scripts/replace-unminified-refs.mjs --dry-run # محاكاة فقط بدون كتابة
 * ---------------------------------------------------------------------------
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { glob } from "glob";

const ROOT = resolve(import.meta.dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

/**
 * أزواج الاستبدال: [نمط المطابقة، البديل]
 * كل زوج يستبدل المسار غير المصغر بالنسخة المصغرة.
 */
const REPLACEMENTS = [
  // runtime-config.js → runtime-config.min.js
  {
    pattern: /\/frontend\/js\/runtime-config\.js/g,
    replacement: "/frontend/js/runtime-config.min.js",
    label: "runtime-config.js"
  },
  // text-ratio-fix.css → text-ratio-fix.min.css
  {
    pattern: /\/assets\/css\/text-ratio-fix\.css/g,
    replacement: "/assets/css/text-ratio-fix.min.css",
    label: "text-ratio-fix.css"
  }
];

const IGNORE_DIRS = [
  "node_modules/**",
  ".git/**",
  "venv/**",
  ".agents/**",
  "tmp/**",
  "backend/**"
];

async function main() {
  const htmlFiles = await glob("**/*.html", {
    cwd: ROOT,
    absolute: true,
    ignore: IGNORE_DIRS
  });

  console.log(`\n🔍 وُجد ${htmlFiles.length} ملف HTML\n`);

  let totalFiles = 0;
  let totalReplacements = 0;

  for (const filePath of htmlFiles) {
    const original = await readFile(filePath, "utf8");
    let modified = original;
    let fileReplacements = 0;

    for (const { pattern, replacement, label } of REPLACEMENTS) {
      const matches = modified.match(pattern);
      if (matches) {
        fileReplacements += matches.length;
        modified = modified.replace(pattern, replacement);
      }
    }

    if (fileReplacements > 0) {
      const relativePath = filePath.replace(ROOT + "/", "");
      console.log(`  ✅ ${relativePath} (${fileReplacements} استبدال)`);

      if (!DRY_RUN) {
        await writeFile(filePath, modified, "utf8");
      }

      totalFiles++;
      totalReplacements += fileReplacements;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`📊 النتيجة: ${totalReplacements} استبدال في ${totalFiles} ملف`);
  if (DRY_RUN) {
    console.log("⚠️  وضع المحاكاة – لم يتم تعديل أي ملفات");
  } else {
    console.log("✅ تم تحديث جميع المسارات بنجاح");
  }
  console.log();
}

main().catch((error) => {
  console.error("❌ فشل في استبدال المسارات:", error);
  process.exit(1);
});
