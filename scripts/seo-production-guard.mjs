#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import {
  decodePathFromLoc,
  buildLocalFileCandidates,
  hasNoindexDirective,
  hasHtmlRedirectSignals,
  extractCanonicalHref
} from "./sitemap-audit-utils.mjs";
import { runAudit as runInternalLinksAudit } from "./internal-links-common.mjs";
import { SITEMAP_REQUIRED_SERVICE_PAGE_FILES } from "./high-confidence-sitemap-config.mjs";
import { relPathToCanonical, normalizeSiteUrl } from "./seo-url-map.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.env.SEO_ROOT ? path.join(process.cwd(), process.env.SEO_ROOT) : process.cwd();
const errors = [];
const warnings = [];

function logError(message) {
  errors.push(message);
}

async function runProductionGuard() {
  console.log("=== البدء في تشغيل نظام الحماية الإنتاجي النهائي لـ SEO ===");

  // 1. فحص robots.txt وإعلانات Sitemap
  console.log("\n1. فحص robots.txt وإعلانات Sitemap...");
  const robotsPath = path.join(ROOT, "robots.txt");
  let robotsContent = "";
  try {
    robotsContent = await fs.readFile(robotsPath, "utf8");
  } catch (error) {
    logError(`فشل قراءة ملف robots.txt: ${error.message}`);
  }

  if (robotsContent) {
    // استخراج أسطر Sitemap
    const sitemapLines = [...robotsContent.matchAll(/^Sitemap:\s*(.+)$/gim)].map(m => m[1].trim());
    if (sitemapLines.length === 0) {
      logError("ملف robots.txt لا يحتوي على أي إعلان لخرائط المواقع (Sitemap).");
    } else {
      console.log(`✓ تم العثور على (${sitemapLines.length}) إعلانات لخرائط المواقع في robots.txt.`);
      for (const sitemapUrl of sitemapLines) {
        // استخراج اسم الملف من الرابط
        try {
          const parsedUrl = new URL(sitemapUrl);
          const filename = path.basename(parsedUrl.pathname);
          const localSitemapPath = path.join(ROOT, filename);
          try {
            await fs.access(localSitemapPath);
            console.log(`  ✓ تم التحقق من وجود ملف خريطة الموقع محلياً: ${filename}`);
          } catch {
            logError(`ملف خريطة الموقع المعلن عنه في robots.txt غير موجود محلياً في الجذر: ${filename} (الرابط: ${sitemapUrl})`);
          }
        } catch (err) {
          logError(`إعلان خريطة الموقع يحتوي على رابط غير صالح في robots.txt: ${sitemapUrl}`);
        }
      }
    }
  }

  // 2. فحص خرائط المواقع (Sitemaps) والروابط المدرجة فيها
  console.log("\n2. فحص محتويات خرائط المواقع وعناوين الروابط...");
  // سنفحص ملف sitemap.xml الرئيسي وأي ملفات sitemap أخرى معلنة
  const sitemapsToScan = ["sitemap.xml", "sitemap-services.xml", "sitemap-blog.xml", "sitemap-priority.xml"];
  const scannedUrls = new Set();

  for (const sitemapFile of sitemapsToScan) {
    const sitemapPath = path.join(ROOT, sitemapFile);
    let sitemapXml = "";
    try {
      sitemapXml = await fs.readFile(sitemapPath, "utf8");
    } catch {
      // إذا كان الملف غير موجود اختيارياً فلا بأس، لكن sitemap.xml يجب أن يكون موجوداً
      if (sitemapFile === "sitemap.xml") {
        logError("الملف الرئيسي sitemap.xml غير موجود أو متعذر القراءة.");
      }
      continue;
    }

    console.log(`\nجاري فحص خريطة الموقع: ${sitemapFile}...`);
    const locMatches = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
    if (locMatches.length === 0) {
      logError(`خريطة الموقع ${sitemapFile} لا تحتوي على أي روابط <loc>.`);
      continue;
    }

    for (const loc of locMatches) {
      if (scannedUrls.has(loc)) continue;
      scannedUrls.add(loc);

      // التحقق من الحروف الكبيرة (Uppercase) في جزء المسار
      try {
        const parsed = new URL(loc);
        const pathname = parsed.pathname;
        if (/[A-Z]/.test(pathname)) {
          logError(`الرابط المدرج في خريطة الموقع يحتوي على أحرف كبيرة (Uppercase): ${loc} في خريطة ${sitemapFile}`);
        }
        
        // التحقق من وجود امتداد .html
        if (pathname.includes(".html")) {
          logError(`الرابط المدرج في خريطة الموقع يحتوي على امتداد .html الممنوع: ${loc} في خريطة ${sitemapFile}`);
        }
      } catch (err) {
        logError(`رابط غير صالح في خريطة الموقع ${sitemapFile}: ${loc}`);
        continue;
      }

      // التحقق من الـ 200 محلياً (وجود الملف)
      const decodedPath = decodePathFromLoc(loc, BASE_URL);
      if (!decodedPath) {
        logError(`فشل فك تشفير مسار الرابط: ${loc}`);
        continue;
      }

      const candidates = buildLocalFileCandidates(decodedPath);
      let resolvedFile = null;
      for (const candidate of candidates) {
        try {
          const stat = await fs.stat(path.join(ROOT, candidate));
          if (stat.isFile()) {
            resolvedFile = candidate;
            break;
          }
        } catch {}
      }

      if (!resolvedFile) {
        logError(`الرابط المدرج في خريطة الموقع يشير إلى صفحة غير موجودة (فشل حالة 200): ${loc} (المرشحون المفحوصون: ${candidates.join(", ")})`);
        continue;
      }

      // قراءة محتوى الملف والتحقق من الشروط الفنية لـ SEO
      try {
        const htmlContent = await fs.readFile(path.join(ROOT, resolvedFile), "utf8");

        // أ. منع noindex
        if (hasNoindexDirective(htmlContent)) {
          logError(`الصفحة المدرجة في خريطة الموقع تحتوي على وسم noindex الممنوع للصفحات المفهرسة: ${loc} -> ${resolvedFile}`);
        }

        // ب. منع الـ Redirects
        if (hasHtmlRedirectSignals(htmlContent)) {
          logError(`الصفحة المدرجة في خريطة الموقع تحتوي على إشارات إعادة توجيه (Redirect): ${loc} -> ${resolvedFile}`);
        }

        // ج. تطابق الـ Canonical مع الرابط المدرج (Self-Canonical)
        const canonicalHref = extractCanonicalHref(htmlContent);
        const normalizedCanonical = normalizeSiteUrl(canonicalHref, BASE_URL);
        if (!normalizedCanonical || normalizedCanonical !== loc) {
          logError(`رابط Canonical لا يطابق عنوان الرابط المدرج في خريطة الموقع: ${loc} -> ${resolvedFile} (وجد: '${canonicalHref || "لا يوجد canonical"}')`);
        }

      } catch (err) {
        logError(`فشل قراءة أو معالجة الملف المحلي للرابط ${loc} -> ${resolvedFile}: ${err.message}`);
      }
    }
  }

  // 3. التحقق من عدم وجود أي روابط داخلية مكسورة
  console.log("\n3. فحص وتدقيق الروابط الداخلية في كامل المشروع...");
  try {
    const linkReport = await runInternalLinksAudit({ root: ROOT });
    console.log(`- الملفات المفحوصة: ${linkReport.filesScanned}`);
    console.log(`- المراجع المفحوصة: ${linkReport.referencesScanned}`);
    console.log(`- الروابط الداخلية المكسورة: ${linkReport.brokenReferences}`);

    if (linkReport.brokenReferences > 0) {
      logError(`تم اكتشاف (${linkReport.brokenReferences}) روابط داخلية مكسورة في المشروع!`);
      if (linkReport.brokenRows && linkReport.brokenRows.length > 0) {
        for (const row of linkReport.brokenRows) {
          logError(`  رابط مكسور في: ${row.file}:${row.line} -> المرجع: "${row.reference}" (السبب: ${row.reason})`);
        }
      }
    } else {
      console.log("✓ خلو المشروع من أي روابط داخلية مكسورة.");
    }
  } catch (err) {
    logError(`فشل تشغيل تدقيق الروابط الداخلية: ${err.message}`);
  }

  // 4. التدقيق الصارم لصفحات الخدمات (Service Pages)
  console.log("\n4. فحص صفحات الخدمات المطلوبة والتأكد من عناصر السيو الأساسية...");
  for (const serviceFile of SITEMAP_REQUIRED_SERVICE_PAGE_FILES) {
    const filePath = path.join(ROOT, serviceFile);
    try {
      await fs.access(filePath);
    } catch {
      logError(`ملف الخدمة المطلوب غير موجود في المشروع: ${serviceFile}`);
      continue;
    }

    try {
      const html = await fs.readFile(filePath, "utf8");
      const $ = cheerio.load(html);

      // أ. العنوان title
      const title = $("title").first().text().trim();
      if (!title) {
        logError(`صفحة الخدمة تفتقد لوسم العنوان <title>: ${serviceFile}`);
      }

      // ب. الوصف description
      const description = $("meta[name='description']").attr("content") || "";
      if (!description.trim()) {
        logError(`صفحة الخدمة تفتقد لوصف ميتا <meta name="description">: ${serviceFile}`);
      }

      // ج. وسم H1 واحد بالضبط
      const h1Count = $("h1").length;
      if (h1Count !== 1) {
        logError(`صفحة الخدمة تحتوي على عدد غير مسموح به من وسوم <h1> (${h1Count} وسوم بدلاً من 1): ${serviceFile}`);
      }

      // د. Canonical صحيح ومطابق
      const canonical = $("link[rel='canonical']").attr("href") || "";
      if (!canonical.trim()) {
        logError(`صفحة الخدمة تفتقد لوسم canonical: ${serviceFile}`);
      } else {
        const expectedCanonical = relPathToCanonical(serviceFile, BASE_URL);
        const normalizedCanonical = normalizeSiteUrl(canonical, BASE_URL);
        if (!normalizedCanonical || normalizedCanonical !== expectedCanonical) {
          logError(`وسم canonical في صفحة الخدمة لا يطابق المسار المتوقع: ${serviceFile} (المتوقع: ${expectedCanonical}، وجد: ${canonical})`);
        }
      }
    } catch (err) {
      logError(`فشل فحص عناصر السيو لصفحة الخدمة ${serviceFile}: ${err.message}`);
    }
  }

  // ملخص النتائج والتحقق من الأخطاء
  console.log("\n=== ملخص فحوصات نظام الحماية الصارم لـ SEO ===");
  console.log(`- الأخطاء المكتشفة: ${errors.length}`);
  console.log(`- التنبيهات: ${warnings.length}`);

  if (errors.length > 0) {
    console.error("\n❌ فشل التحقق! تم اكتشاف أخطاء حرجة تمنع النشر والدمج:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log("\n✅ نجح التحقق الكامل! الموقع الإنتاجي مستعد ومحمي بالكامل من أي مشاكل فهرسة أو SEO.");
  process.exit(0);
}

runProductionGuard().catch(err => {
  console.error("خطأ قاتل غير متوقع أثناء تشغيل نظام الحماية:", err);
  process.exit(1);
});
