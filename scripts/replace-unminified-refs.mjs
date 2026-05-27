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
  {
    pattern: /\/frontend\/js\/index-theme\.js/g,
    replacement: "/frontend/js/index-theme.min.js",
    label: "index-theme.js"
  },
  {
    pattern: /\/frontend\/js\/main\.bundle\.js/g,
    replacement: "/frontend/js/main.bundle.min.js",
    label: "main.bundle.js"
  },
  {
    pattern: /\/frontend\/js\/navigation\.js/g,
    replacement: "/frontend/js/navigation.min.js",
    label: "navigation.js"
  },
  {
    pattern: /\/frontend\/js\/search\.js/g,
    replacement: "/frontend/js/search.min.js",
    label: "search.js"
  },
  {
    pattern: /\/frontend\/js\/performance-loader\.js/g,
    replacement: "/frontend/js/performance-loader.min.js",
    label: "performance-loader.js"
  },
  {
    pattern: /\/frontend\/css\/index-theme\.css/g,
    replacement: "/frontend/css/index-theme.min.css",
    label: "index-theme.css"
  },
  {
    pattern: /\/frontend\/css\/index-critical-overrides\.css/g,
    replacement: "/frontend/css/index-critical-overrides.min.css",
    label: "index-critical-overrides.css"
  },
  {
    pattern: /\/frontend\/css\/main\.bundle\.css/g,
    replacement: "/frontend/css/main.bundle.min.css",
    label: "main.bundle.css"
  },
  // text-ratio-fix.css → text-ratio-fix.min.css
  {
    pattern: /\/assets\/css\/text-ratio-fix\.css/g,
    replacement: "/assets/css/text-ratio-fix.min.css",
    label: "text-ratio-fix.css"
  },
  // --- Demo / Interview / Sectors / Try ---
  // api-gateway.js → api-gateway.min.js
  {
    pattern: /\/frontend\/js\/api-gateway\.js/g,
    replacement: "/frontend/js/api-gateway.min.js",
    label: "api-gateway.js"
  },
  // api-preflight.js → api-preflight.min.js
  {
    pattern: /\/frontend\/js\/api-preflight\.js/g,
    replacement: "/frontend/js/api-preflight.min.js",
    label: "api-preflight.js"
  },
  // interview-app.js → interview-app.min.js
  {
    pattern: /\/frontend\/js\/interview-app\.js/g,
    replacement: "/frontend/js/interview-app.min.js",
    label: "interview-app.js"
  },
  // en-interview-app.js → en-interview-app.min.js
  {
    pattern: /\/frontend\/js\/en-interview-app\.js/g,
    replacement: "/frontend/js/en-interview-app.min.js",
    label: "en-interview-app.js"
  },
  // ocr-demo.js → ocr-demo.min.js
  {
    pattern: /\/frontend\/js\/ocr-demo\.js/g,
    replacement: "/frontend/js/ocr-demo.min.js",
    label: "ocr-demo.js"
  },
  // data-analyzer.js → data-analyzer.min.js
  {
    pattern: /\/frontend\/js\/data-analyzer\.js/g,
    replacement: "/frontend/js/data-analyzer.min.js",
    label: "data-analyzer.js"
  },
  // demo-stream.js → demo-stream.min.js
  {
    pattern: /\/frontend\/js\/demo-stream\.js/g,
    replacement: "/frontend/js/demo-stream.min.js",
    label: "demo-stream.js"
  },
  // tenders-index-app.js → tenders-index-app.min.js
  {
    pattern: /\/frontend\/js\/tenders-index-app\.js/g,
    replacement: "/frontend/js/tenders-index-app.min.js",
    label: "tenders-index-app.js"
  },
  // en-tenders-templates-app.js → en-tenders-templates-app.min.js
  {
    pattern: /\/frontend\/js\/en-tenders-templates-app\.js/g,
    replacement: "/frontend/js/en-tenders-templates-app.min.js",
    label: "en-tenders-templates-app.js"
  },
  // interview-inline.css → interview-inline.min.css
  {
    pattern: /\/frontend\/css\/interview-inline\.css/g,
    replacement: "/frontend/css/interview-inline.min.css",
    label: "interview-inline.css"
  },
  // en-interview-inline.css → en-interview-inline.min.css
  {
    pattern: /\/frontend\/css\/en-interview-inline\.css/g,
    replacement: "/frontend/css/en-interview-inline.min.css",
    label: "en-interview-inline.css"
  },
  // demo-theme.css → demo-theme.min.css
  {
    pattern: /\/frontend\/css\/demo-theme\.css/g,
    replacement: "/frontend/css/demo-theme.min.css",
    label: "demo-theme.css"
  },
  // ocr-demo-theme.css → ocr-demo-theme.min.css
  {
    pattern: /\/frontend\/css\/ocr-demo-theme\.css/g,
    replacement: "/frontend/css/ocr-demo-theme.min.css",
    label: "ocr-demo-theme.css"
  },
  // tenders-index-inline.css → tenders-index-inline.min.css
  {
    pattern: /\/frontend\/css\/tenders-index-inline\.css/g,
    replacement: "/frontend/css/tenders-index-inline.min.css",
    label: "tenders-index-inline.css"
  },
  // en-tenders-templates-inline.css → en-tenders-templates-inline.min.css
  {
    pattern: /\/frontend\/css\/en-tenders-templates-inline\.css/g,
    replacement: "/frontend/css/en-tenders-templates-inline.min.css",
    label: "en-tenders-templates-inline.css"
  }
  // ai-scolecs-app.min.js و ai-scolecs-inline.min.css مُصغّرتان مسبقاً — الأصول الأصلية محذوفة
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
