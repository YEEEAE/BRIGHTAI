#!/usr/bin/env node
/**
 * check-word-count.mjs
 *
 * CLI: يفحص عدد كلمات جميع المقالات في src/content/blog/*.md
 *      يتجاهل الـ frontmatter ويحسب كلمات الـ body فقط.
 *      يطبع جدولاً: الملف | عدد الكلمات | الحالة (>= الحد الأدنى).
 *      يدعم --min=N (الافتراضي 1200).
 *      يخرج exit 1 إذا وُجد مقال تحت الحد.
 *
 * API المُصدَّر (للتوافق مع الاختبارات القديمة):
 *   checkWordCounts({ root, targets }) ← يقرأ HTML files من targets
 *   (الـ CLI لا يستخدمه؛ يحل محله منطق blog markdown الجديد)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripHtml } from "./indexing-recovery-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_TARGETS = {
  "contact/index.html": 800,
  "solutions/index.html": 900,
  "trust/index.html": 800,
  "assessment/ai-governance-readiness/index.html": 900,
  "solutions/healthcare-ai-governance/jeddah/index.html": 900,
  "solutions/government-ai-governance/dammam/index.html": 900,
  "solutions/banking-ai-governance/riyadh/index.html": 900,
};

/* ────────────────────────────────────────────────────────────────────────
 *  API القديم (للتوافق مع الاختبارات)
 * ──────────────────────────────────────────────────────────────────────── */

export async function checkWordCounts({ root = ROOT, targets = DEFAULT_TARGETS } = {}) {
  const results = [];
  for (const [relPath, minimum] of Object.entries(targets)) {
    if (relPath === "kernel/offline.html") continue;
    const html = await fs.readFile(path.join(root, relPath), "utf8");
    const count = stripHtml(html).split(/\s+/).filter(Boolean).length;
    results.push({ relPath, minimum, count, passed: count >= minimum });
  }
  return { results, failures: results.filter((entry) => !entry.passed) };
}

/* ────────────────────────────────────────────────────────────────────────
 *  CLI الجديد: فحص src/content/blog/*.md
 * ──────────────────────────────────────────────────────────────────────── */

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function stripFrontmatter(markdown) {
  return markdown.replace(FRONTMATTER_RE, "");
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function parseCliArgs(argv) {
  const args = { min: 1200 };
  for (const arg of argv) {
    if (arg.startsWith("--min=")) {
      const n = Number.parseInt(arg.slice("--min=".length), 10);
      if (!Number.isFinite(n) || n < 1) {
        console.error(`❌ قيمة --min غير صالحة: ${arg}`);
        process.exit(2);
      }
      args.min = n;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`استخدام: node scripts/check-word-count.mjs [--min=N]

الخيارات:
  --min=N     الحد الأدنى لعدد الكلمات (الافتراضي: 1200)
  -h, --help  عرض هذه المساعدة

يقرأ src/content/blog/*.md ويتجاهل الـ frontmatter، ثم يطبع جدولاً:
  الملف | عدد الكلمات | الحالة (>= الحد)
يخرج exit 1 إذا وُجد مقال تحت الحد.`);
      process.exit(0);
    } else {
      console.error(`❌ وسيط غير معروف: ${arg}`);
      process.exit(2);
    }
  }
  return args;
}

async function runCli() {
  const { min } = parseCliArgs(process.argv.slice(2));

  const blogDir = path.join(ROOT, "src", "content", "blog");
  let entries;
  try {
    entries = await fs.readdir(blogDir, { withFileTypes: true });
  } catch (err) {
    console.error(`❌ فشل قراءة ${blogDir}: ${err.message}`);
    process.exit(1);
  }

  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  if (mdFiles.length === 0) {
    console.error(`❌ لا توجد ملفات *.md في ${blogDir}`);
    process.exit(1);
  }

  const rows = [];
  for (const name of mdFiles) {
    const filePath = path.join(blogDir, name);
    const raw = await fs.readFile(filePath, "utf8");
    const body = stripFrontmatter(raw);
    const words = countWords(body);
    rows.push({ file: name, words, passed: words >= min });
  }

  /* ── طباعة الجدول ── */
  const FILE_W = Math.max(20, ...rows.map((r) => r.file.length));
  const WORDS_W = 12;

  console.log(
    `\n┌── فحص عدد كلمات المقالات (src/content/blog/*.md) — الحد الأدنى ${min} كلمة ──┐\n`
  );
  console.log(`│ ${"الملف".padEnd(FILE_W)} │ ${"الكلمات".padStart(WORDS_W)} │ ${"الحالة".padEnd(8)} │`);
  console.log(
    `│ ${"-".repeat(FILE_W)} │ ${"-".repeat(WORDS_W)} │ ${"-".repeat(8)} │`
  );

  for (const r of rows) {
    const status = r.passed ? "✅ OK" : "❌ FAIL";
    console.log(
      `│ ${r.file.padEnd(FILE_W)} │ ${String(r.words).padStart(WORDS_W)} │ ${status.padEnd(8)} │`
    );
  }

  console.log("");

  /* ── ملخص + exit code ── */
  const total = rows.length;
  const passed = rows.filter((r) => r.passed).length;
  const failed = total - passed;
  const underMin = rows.filter((r) => !r.passed);

  console.log(`الإجمالي: ${total} مقال | نجح: ${passed} | تحت الحد: ${failed}`);
  if (underMin.length > 0) {
    console.log("\nالمقالات تحت الحد:");
    for (const r of underMin) {
      const gap = min - r.words;
      console.log(`  - ${r.file}: ${r.words} كلمة (نقص ${gap} كلمة)`);
    }
    console.log("");
    process.exit(1);
  }
  console.log(`✅ جميع المقالات (${total}) تجاوزت الحد الأدنى (${min}).\n`);
  process.exit(0);
}

/* نقطة الدخول: نفّذ CLI فقط عند تشغيل السكربت مباشرة */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runCli();
}