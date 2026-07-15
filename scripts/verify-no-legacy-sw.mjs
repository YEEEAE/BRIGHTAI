#!/usr/bin/env node
/**
 * verify-no-legacy-sw.mjs — CI guard ضد إعادة تفعيل الـ legacy kernel SW
 * --------------------------------------------------------------------
 * Finding: KRN-005 (§3e) — Critical if re-registered.
 *
 * الـ legacy `kernel/sw.js` كان يعمل caching لـ `/api/kernel/*` ويصطفّ
 * الـ mutations مع PII في IndexedDB. الحين مؤرشف في `kernel/legacy-disabled/`
 * وما يُسجَّل من أي مكان. هذا الـ script يضمن إن ما حد ضاف ملف جديد
 * داخل `kernel/` (مو `legacy-disabled/`) يحاول إعادة الـ SW للحياة.
 *
 * Acceptance:
 *   - Pass: ✅ message + exit 0.
 *   - Fail: قائمة الملفات + الـ patterns + exit 1.
 *
 * القواعد:
 *   - يفحص `kernel/` (مو `kernel/legacy-disabled/`) recursive.
 *   - يركّز على ملفات الكود: `.html`, `.js`, `.ts`, `.mjs`, `.cjs`, `.css`, `.json`.
 *     ملفات `.md` (التوثيق) مسموح لها تذكر الـ patterns بالاسم — التوثيق ما ينفّذ كود.
 *   - ما يلامس `public/sw.js` (الـ active SW). يتجاهل `public/` و `src/`.
 *   - ما يعمل network calls — pure file read + regex.
 *   - سريع: < 100ms على مستودع كامل.
 *
 * Patterns المراقبة (لو ظهرت في ملف كود داخل `kernel/` خارج `legacy-disabled/`):
 *   1. `navigator.serviceWorker.register` — أي تسجيل للـ SW
 *   2. `kernel/manifest.json` — ربط للـ legacy PWA manifest
 *   3. `kernel/sw.js` — ربط للـ legacy SW script
 *   4. `kernel/assets/js/kernel-pwa.js` — ربط للـ legacy PWA module
 *
 * Rollback plan: `git rm scripts/verify-no-legacy-sw.mjs` وارجع
 * الـ files من `git mv kernel/legacy-disabled/<file> kernel/<file>`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SCAN_ROOT = path.join(ROOT, "kernel");
const ARCHIVE_DIR = path.join(SCAN_ROOT, "legacy-disabled");

// امتدادات ملفات الكود اللي يفحصها السكربت. ملفات `.md` (التوثيق)
// مسموح لها تذكر الـ patterns بالاسم بدون trigger.
const CODE_EXTENSIONS = new Set([
  ".html", ".htm", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
  ".css", ".scss", ".json", ".xml", ".yaml", ".yml",
]);

// الملفات اللي ما نلمسها (auto-generated، tests قديمة، إلخ).
const IGNORE_PATHS = new Set([
  path.join(SCAN_ROOT, ".DS_Store"),
]);

// الـ patterns اللي لازم تكون صفر في kernel/ (خارج legacy-disabled/).
// كل pattern: { name, re } — الـ re بدون flags (case-sensitive؛ الـ codebase كله lowercase).
const FORBIDDEN_PATTERNS = [
  {
    name: "service-worker-registration",
    description: "تسجيل service worker داخل kernel/ (الـ SW الأَحياء في public/sw.js فقط)",
    re: /navigator\.serviceWorker\.register\s*\(/,
  },
  {
    name: "legacy-manifest-reference",
    description: "ربط بـ kernel/manifest.json (انتقل لـ kernel/legacy-disabled/manifest.json)",
    re: /kernel\/manifest\.json/,
  },
  {
    name: "legacy-sw-reference",
    description: "ربط بـ kernel/sw.js (انتقل لـ kernel/legacy-disabled/sw.js)",
    re: /kernel\/sw\.js/,
  },
  {
    name: "legacy-pwa-reference",
    description: "ربط بـ kernel/assets/js/kernel-pwa.js (انتقل لـ kernel/legacy-disabled/assets/js/kernel-pwa.js)",
    re: /kernel\/assets\/js\/kernel-pwa\.js/,
  },
];

// يمشي recursive تحت SCAN_ROOT ويتجاهل ARCHIVE_DIR والـ IGNORE_PATHS
// و ملفات `.md` (التوثيق — مسموح يذكر الـ patterns بالاسم).
function* walkFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    // قارن بعد تطبيع (macOS لا يهتم بالـ trailing slash).
    if (full === ARCHIVE_DIR || full === ARCHIVE_DIR + path.sep) continue;
    if (IGNORE_PATHS.has(full)) continue;
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) continue;
      yield full;
    }
  }
}

// فحص ملف واحد: يرجع مصفوفة hits (فاضية لو نظيف).
function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return [{ pattern: "read-error", error: err.message }];
  }
  const hits = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.re.test(content)) {
      hits.push({ pattern: pattern.name, description: pattern.description });
    }
  }
  return hits;
}

function rel(p) {
  return path.relative(ROOT, p);
}

function main() {
  if (!fs.existsSync(SCAN_ROOT)) {
    console.log(`ℹ️  ${rel(SCAN_ROOT)} غير موجود — تخطّي الفحص (CI pass).`);
    process.exit(0);
  }

  const violations = [];
  let scannedFiles = 0;
  for (const file of walkFiles(SCAN_ROOT)) {
    scannedFiles++;
    const hits = scanFile(file);
    for (const hit of hits) {
      violations.push({ file: rel(file), ...hit });
    }
  }

  console.log(`فحص ${rel(SCAN_ROOT)} (ما عدا ${rel(ARCHIVE_DIR)}): ${scannedFiles} ملف.`);
  console.log("");

  if (violations.length === 0) {
    console.log("✅ نجح الفحص. لا تسجيل service worker ولا ربط بالـ legacy files داخل kernel/.");
    console.log("");
    console.log("الـ patterns المراقبة (للتوثيق):");
    for (const pattern of FORBIDDEN_PATTERNS) {
      console.log(`  • ${pattern.name}: ${pattern.description}`);
    }
    process.exit(0);
  }

  console.error(`❌ فشل الفحص. ${violations.length} انتهاك${violations.length === 1 ? "" : "ات"}:`);
  console.error("");
  for (const v of violations) {
    console.error(`  📁 ${v.file}`);
    if (v.error) {
      console.error(`     ↳ خطأ قراءة: ${v.error}`);
    } else {
      console.error(`     ↳ ${v.pattern}: ${v.description}`);
    }
  }
  console.error("");
  console.error("الإصلاح:");
  console.error("  • شيل الـ reference من الملف المحدد.");
  console.error("  • لو الملف نفسه لازم يكون في legacy-disabled/، انقله بـ `git mv`.");
  console.error("  • لو التسجيل مطلوب، استخدم public/sw.js (الـ active SW) بدل kernel/sw.js.");
  process.exit(1);
}

main();
