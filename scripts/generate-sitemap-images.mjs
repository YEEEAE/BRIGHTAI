import { promises as fs } from "fs";
import path from "path";
import { isPublicIndexableRelPath, relPathToCanonical } from "./seo-url-map.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, "sitemap-images.xml");

const IGNORED_SCAN_DIRS = new Set([
  ".git",
  ".next",
  ".render-static",
  ".agents",
  "node_modules",
  "aimais",
  "backend",
  "coverage",
  "dist",
  "build",
  "reports",
  "tmp",
]);

async function walkHtmlFiles(dirPath) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_SCAN_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveImageUrl(imageSrc, htmlRelPath) {
  if (!imageSrc) return null;
  const src = imageSrc.trim();
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return null; // تجاهل صور البيانات المضمنة
  }

  if (src.startsWith("/")) {
    return `${BASE_URL}${src}`;
  }

  // حل المسار النسبي بناءً على موقع ملف الـ HTML
  const htmlDir = path.dirname(htmlRelPath);
  const resolved = path.posix.join(htmlDir === "." ? "" : htmlDir, src);
  return `${BASE_URL}/${resolved.replace(/^\.\//, "")}`;
}

async function extractImagesFromHtml(fullPath, relPath) {
  try {
    const html = await fs.readFile(fullPath, "utf8");
    const images = [];

    // تعبير منتظم متطور للبحث عن علامات img وخصائص src و alt
    const imgRegex = /<img\b([^>]+)>/gi;
    let match;

    while ((match = imgRegex.exec(html))) {
      const attrsStr = match[1];
      const srcMatch = attrsStr.match(/src\s*=\s*["']([^"']+)["']/i);
      if (!srcMatch) continue;

      const rawSrc = srcMatch[1];
      const resolvedUrl = resolveImageUrl(rawSrc, relPath);
      if (!resolvedUrl) continue;

      const altMatch = attrsStr.match(/alt\s*=\s*["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1].trim() : "";

      images.push({
        loc: resolvedUrl,
        title: alt
      });
    }

    return images;
  } catch (error) {
    console.error(`فشل استخراج الصور من الملف ${relPath}:`, error);
    return [];
  }
}

async function main() {
  console.log("=== بدء توليد خريطة الصور Sitemap Images ===");
  const allFiles = await walkHtmlFiles(ROOT);
  const indexablePages = [];

  for (const fullPath of allFiles) {
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    if (isPublicIndexableRelPath(relPath)) {
      const canonical = relPathToCanonical(relPath, BASE_URL);
      if (canonical) {
        const images = await extractImagesFromHtml(fullPath, relPath);
        if (images.length > 0) {
          indexablePages.push({
            loc: canonical,
            images
          });
        }
      }
    }
  }

  // بناء ملف الـ XML
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  lines.push('        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
  lines.push("");

  for (const page of indexablePages) {
    lines.push("  <url>");
    lines.push(`    <loc>${xmlEscape(page.loc)}</loc>`);
    for (const img of page.images) {
      lines.push("    <image:image>");
      lines.push(`      <image:loc>${xmlEscape(img.loc)}</image:loc>`);
      if (img.title) {
        lines.push(`      <image:title>${xmlEscape(img.title)}</image:title>`);
      }
      lines.push("    </image:image>");
    }
    lines.push("  </url>");
  }

  lines.push("</urlset>");
  lines.push("");

  await fs.writeFile(OUTPUT_FILE, lines.join("\n"), "utf8");
  console.log(`✓ تم بنجاح توليد ملف خريطة الصور في: ${OUTPUT_FILE}`);
  console.log(`- إجمالي الصفحات التي تحتوي على صور: ${indexablePages.length}`);
  console.log(`- إجمالي الصور المفهرسة: ${indexablePages.reduce((acc, p) => acc + p.images.length, 0)}`);
  console.log("=========================================\n");
}

main().catch(error => {
  console.error("خطأ غير متوقع في توليد خريطة الصور:", error);
  process.exit(1);
});
