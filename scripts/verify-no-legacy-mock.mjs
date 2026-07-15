#!/usr/bin/env node
/**
 * verify-no-legacy-mock.mjs — CI guard ضد إعادة تفعيل الـ legacy kernel mock handlers
 * --------------------------------------------------------------------
 * Finding: KRN-006 (§3f) — Critical if re-loaded.
 *
 * الـ legacy `kernel-mock-handlers.js` كان يسجّل `fetch` interceptor على
 * الـ window ويقرأ localStorage flag (الـ demo mode). الحين مؤرشف في
 * `kernel/legacy-disabled/mock/` وما يُحمَّل من أي مكان. هذا الـ script
 * يضمن إن ما حد ضاف ملف جديد داخل `kernel/` (مو `legacy-disabled/`)
 * يحاول إعادة الـ mock surface للحياة.
 *
 * Acceptance:
 *   - Pass: ✅ message + exit 0.
 *   - Fail: قائمة الملفات + الـ patterns + exit 1.
 *
 * القواعد:
 *   - يفحص `kernel/` (مو `kernel/legacy-disabled/`) recursive.
 *   - يركّز على ملفات الكود: `.html`, `.js`, `.ts`, `.mjs`, `.cjs`, `.css`, `.json`.
 *     ملفات `.md` (التوثيق) مسموح لها تذكر الـ patterns بالاسم — التوثيق ما ينفّذ كود.
 *   - ما يعمل network calls — pure file read + regex.
 *   - سريع: < 100ms على مستودع كامل.
 *
 * Patterns المراقبة (لو ظهرت في ملف كود داخل `kernel/` خارج `legacy-disabled/`):
 *   1. `window.fetch` — أي مرجع للـ fetch global (read أو patch).
 *      الـ attack: `window.fetch = function(...) { return mock; }` يستبدل كل fetch calls.
 *   2. `brightai_kernel_demo_mode` — الـ localStorage key اللي يفعّل الـ mock.
 *      الـ attack: `localStorage.setItem(brightai_kernel_demo_mode, 'true')` يقلب الـ mode.
 *
 * Rollback plan: `git rm scripts/verify-no-legacy-mock.mjs` وارجع
 * الـ files من `git mv kernel/legacy-disabled/mock/* kernel/assets/js/`.
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
//
// Pattern 1: `window.fetch` — يلتقط أي مرجع للـ fetch global، read أو patch.
//   الـ monkey-patching attack: `window.fetch = function(...) { return mock; }`.
//   الـ read: `const f = window.fetch;` (نادر، بس ما يهم لو يطلع — security check strict).
//   الـ justification: لو في ملف كود جديد يستخدم window.fetch بدل fetch() المباشر،
//   هذا code smell يستحق review (ممكن يكون patch مقنّع).
//
// Pattern 2: `brightai_kernel_demo_mode` — الـ localStorage key.
//   أي string literal في code = إشارة للـ flag = potential attack surface.
const FORBIDDEN_PATTERNS = [
  {
    name: "window-fetch-reference",
    description: "مرجع للـ window.fetch داخل kernel/ (الـ attack: monkey-patch الـ fetch global لإرجاع mock data)",
    re: /window\.fetch/,
  },
  {
    name: "demo-mode-flag-reference",
    description: "مرجع للـ localStorage flag 'brightai_kernel_demo_mode' (الـ attack: قلب الـ flag عبر XSS أو DevTools لتفعيل mock mode في production)",
    re: /brightai_kernel_demo_mode/,
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
    console.log("✅ نجح الفحص. لا monkey-patch على window.fetch ولا مرجع للـ demo mode flag داخل kernel/.");
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
  console.error("  • لو الملف يقرأ window.fetch عادي: استبدله بـ fetch() المباشر.");
  console.error("  • لو الملف يحتاج يصل لـ demo mode flag: استخدم feature flag server-side بدل localStorage.");
  console.error("  • لو الملف لازم يكون في legacy-disabled/، انقله بـ `git mv`.");
  console.error("  • استثناء `.md` فقط — أي ملف كود (.js/.ts/.astro/.html) يذكر الـ patterns = violation.");
  process.exit(1);
}

main();
