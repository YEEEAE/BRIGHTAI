import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { build } from "esbuild";

const ROOT = process.cwd();
const INPUT_CSS = path.join(ROOT, "frontend", "css", "tailwind-input.css");
const TMP_CSS = path.join(ROOT, "frontend", "css", "tailwind.local.tmp.css");
const PURGED_CSS = path.join(ROOT, "frontend", "css", "tailwind.local.purged.css");
const OUTPUT_MIN_CSS = path.join(ROOT, "frontend", "css", "tailwind.local.min.css");
const CONFIG_FILE = path.join(ROOT, "tailwind.config.cjs");

async function main() {
  console.log("=== بدء عملية بناء وتصفية Tailwind CSS ===");

  // 1. تشغيل Tailwind CSS CLI لتوليد الملف المؤقت الكامل
  console.log("1. تشغيل تجميع تيلويند الأولي...");
  try {
    execSync(
      `npx tailwindcss -i "${INPUT_CSS}" -o "${TMP_CSS}" --config "${CONFIG_FILE}"`,
      { stdio: "inherit" }
    );
  } catch (error) {
    console.error("فشل تجميع Tailwind الأولي:", error);
    process.exit(1);
  }

  // 2. تشغيل PurgeCSS لتصفية المحددات غير المستخدمة
  console.log("2. تشغيل PurgeCSS لتصفية الأنماط غير المستخدمة...");
  try {
    const contentPaths = [
      "./index.html",
      "./docs.html",
      "./404.html",
      "./500.html",
      "./about/**/*.html",
      "./blog/**/*.html",
      "./contact/**/*.html",
      "./dashboard/**/*.html",
      "./demo/**/*.html",
      "./docs/**/*.html",
      "./frontend/**/*.html",
      "./frontend/**/*.js",
      "./kernel/**/*.html",
      "./offline/**/*.html",
      "./pricing/**/*.html",
      "./privacy-cookies/**/*.html",
      "./services/**/*.html",
      "./privacy-policy/**/*.html",
      "./terms/**/*.html",
      "./cookie-policy/**/*.html",
      "./pdpl-statement/**/*.html",
      "./data-processing-agreement/**/*.html"
    ].map(p => `"${path.join(ROOT, p)}"`).join(" ");

    execSync(
      `npx purgecss --css "${TMP_CSS}" --content ${contentPaths} --output "${PURGED_CSS}"`,
      { stdio: "inherit" }
    );
  } catch (error) {
    console.error("فشل تشغيل PurgeCSS:", error);
    // تنظيف في حال الفشل
    if (fs.existsSync(TMP_CSS)) fs.unlinkSync(TMP_CSS);
    process.exit(1);
  }

  // 3. تقليص وتصغير الملف المصفى باستخدام esbuild
  console.log("3. تقليص وتصغير ملف الـ CSS النهائي باستخدام esbuild...");
  try {
    await build({
      entryPoints: [PURGED_CSS],
      outfile: OUTPUT_MIN_CSS,
      bundle: false,
      minify: true,
      legalComments: "none",
      charset: "utf8",
      loader: { ".css": "css" }
    });
    console.log(`تم بنجاح تقليص الملف وحفظه في: ${OUTPUT_MIN_CSS}`);
  } catch (error) {
    console.error("فشل تقليص CSS باستخدام esbuild:", error);
    process.exit(1);
  } finally {
    // تنظيف الملفات المؤقتة
    console.log("4. تنظيف وتطهير الملفات المؤقتة...");
    if (fs.existsSync(TMP_CSS)) fs.unlinkSync(TMP_CSS);
    if (fs.existsSync(PURGED_CSS)) fs.unlinkSync(PURGED_CSS);
  }

  // 4. إظهار تقرير الحجم النهائي
  const stats = fs.statSync(OUTPUT_MIN_CSS);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`\n✓ تم إنجاز العملية بنجاح!`);
  console.log(`- حجم ملف CSS النهائي المصفى والمصغر: ${sizeKB} KB`);
  console.log("=========================================\n");
}

main().catch(error => {
  console.error("خطأ غير متوقع:", error);
  process.exit(1);
});
