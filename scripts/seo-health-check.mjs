#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractAlternateHreflangLinks,
  extractCanonicalHref,
  findOnrenderReferences,
  hasHtmlRedirectSignals,
  hasNoindexDirective,
} from "./sitemap-audit-utils.mjs";
import {
  buildPublicUrlRegistry,
  isPublicIndexableRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";

const BASE_URL = "https://brightai.site";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const ROBOTS_PATH = path.join(ROOT, "robots.txt");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const HTML_IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
]);
const INTERNAL_PAGE_PATTERN =
  /(^|\/)(404|500)\.html$|(^|\/)offline\/index\.html$|^aimais\/public\/|^frontend\/pages\/interview\/|(^|\/)(admin|dashboard|settings|analytics|reports|operations|scorecard|copilot|executive|appointment)(\/|\.|$)/i;

function icon(ok) {
  return ok ? "✅" : "❌";
}

function printSection(title) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

function printResult(ok, label, details = "") {
  const suffix = details ? `: ${details}` : "";
  console.log(`${icon(ok)} ${label}${suffix}`);
}

function formatPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function toRootRelative(filePath) {
  return formatPath(path.relative(ROOT, filePath));
}

function unique(values) {
  return [...new Set(values)];
}

function takeSample(values, limit = 10) {
  if (values.length <= limit) return values;
  return [...values.slice(0, limit), `... +${values.length - limit} أخرى`];
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function countMatches(input, regex) {
  const matches = input.match(regex);
  return matches ? matches.length : 0;
}

function extractMetaDescription(html) {
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)];
  for (const match of metaTags) {
    const tag = match[0];
    const nameMatch = tag.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch || nameMatch[1].trim().toLowerCase() !== "description") continue;
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    return contentMatch?.[1]?.trim() || "";
  }
  return "";
}

function extractTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function countH1(html) {
  return countMatches(html, /<h1\b[^>]*>/gi);
}

function isHtmlDocument(html) {
  return /<html\b/i.test(html) && /<head\b/i.test(html) && /<body\b/i.test(html);
}

function hasFrontendPagesLinks(html) {
  return /\/frontend\/pages\//i.test(html);
}

function isInternalPage(relPath) {
  return INTERNAL_PAGE_PATTERN.test(relPath);
}

function extractInternalHrefTargets(html) {
  const matches = [...html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)];
  return matches
    .map((match) => (match[1] || "").trim())
    .filter(Boolean)
    .filter((href) => href.startsWith("/") || href.startsWith("https://brightai.site/"));
}

function normalizeInternalHrefToCanonical(href) {
  try {
    const parsed = new URL(href, `${BASE_URL}/`);
    if (parsed.origin !== BASE_URL) return null;
    return normalizeSiteUrl(parsed.toString(), BASE_URL);
  } catch {
    return null;
  }
}

function extractSitemapAlternateTargets(xml) {
  return [...xml.matchAll(/<xhtml:link\b[^>]*\bhref="([^"]+)"[^>]*>/gi)].map((match) =>
    decodeXmlEntities(match[1].trim())
  );
}

function hasBadPublicSlugPattern(relPath) {
  return /(^|\/)[^/]*([ _()]|\.doc(?=\/|\.|$)|[A-Z])[^/]*\.html?$/u.test(relPath);
}

function normalizeRobotsLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function checkRobots(content) {
  const lines = normalizeRobotsLines(content);
  const disallowFrontendPages = lines.some((line) =>
    /^disallow:\s*\/frontend\/pages\/?$/i.test(line)
  );
  const sitemapLine = lines.find((line) => /^sitemap:\s*/i.test(line)) || "";
  const hasSitemap = /sitemap\.xml(?:\s*)$/i.test(sitemapLine);

  return {
    disallowFrontendPages,
    hasSitemap,
    sitemapLine,
  };
}

function validateSitemapXml(xml) {
  const errors = [];
  const trimmed = xml.trim();

  if (!trimmed.startsWith("<?xml")) {
    errors.push("تعريف XML غير موجود في بداية الملف.");
  }

  if (!/<urlset\b/i.test(xml) || !/<\/urlset>/i.test(xml)) {
    errors.push("عنصر urlset غير مكتمل.");
  }

  const openUrlCount = countMatches(xml, /<url\b/gi);
  const closeUrlCount = countMatches(xml, /<\/url>/gi);
  if (openUrlCount !== closeUrlCount) {
    errors.push(`عدد وسوم url الافتتاحية (${openUrlCount}) لا يطابق الختامية (${closeUrlCount}).`);
  }

  const locMatches = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];
  if (locMatches.length === 0) {
    errors.push("لا توجد أي وسوم loc داخل sitemap.");
  }

  const invalidUrls = [];
  for (const match of locMatches) {
    const rawLoc = decodeXmlEntities(match[1].trim());
    try {
      new URL(rawLoc);
    } catch {
      invalidUrls.push(rawLoc);
    }
  }

  if (invalidUrls.length > 0) {
    errors.push(`يوجد ${invalidUrls.length} رابط غير صالح داخل loc.`);
  }

  return {
    ok: errors.length === 0,
    errors,
    locs: locMatches.map((match) => decodeXmlEntities(match[1].trim())),
  };
}

async function walkHtmlFiles(dirPath, bucket = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (HTML_IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await walkHtmlFiles(fullPath, bucket);
      continue;
    }

    if (entry.isFile() && /\.html?$/i.test(entry.name)) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

async function auditHtmlFile(filePath, publicRegistry) {
  const relPath = toRootRelative(filePath);
  const html = await fs.readFile(filePath, "utf8");

  if (!isHtmlDocument(html)) {
    return {
      relPath,
      isDocument: false,
      issues: [],
    };
  }

  const issues = [];
  const canonical = extractCanonicalHref(html);
  const expectedCanonical = relPathToCanonical(relPath, BASE_URL);
  const normalizedCanonical = normalizeSiteUrl(canonical, BASE_URL);
  const title = extractTitle(html);
  const description = extractMetaDescription(html);
  const h1Count = countH1(html);
  const internal = isInternalPage(relPath);
  const publicDocument = isPublicIndexableRelPath(relPath) && Boolean(expectedCanonical) && !internal;
  const hasNoindex = hasNoindexDirective(html);
  const hreflangLinks = extractAlternateHreflangLinks(html);
  const frontendPagesLink = hasFrontendPagesLinks(html);
  const onrenderRefs = findOnrenderReferences(html);
  const hasHtmlRedirect = hasHtmlRedirectSignals(html);
  const hreflangGhostTargets = [];
  const brokenAiBotsLinks = [];

  for (const link of hreflangLinks) {
    const normalizedHref = normalizeSiteUrl(link.href, BASE_URL);
    if (!normalizedHref || !publicRegistry.relPathByCanonical.has(normalizedHref)) {
      hreflangGhostTargets.push(`${link.hreflang} -> ${link.href || "(empty)"}`);
    }
  }

  for (const href of extractInternalHrefTargets(html)) {
    if (!/\/ai-bots\//i.test(href)) continue;
    const normalizedHref = normalizeInternalHrefToCanonical(href);
    if (!normalizedHref || !publicRegistry.relPathByCanonical.has(normalizedHref)) {
      brokenAiBotsLinks.push(href);
    }
  }

  if (publicDocument && !canonical) {
    issues.push("canonical_missing");
  } else if (publicDocument && normalizedCanonical !== expectedCanonical) {
    issues.push("canonical_invalid");
  }

  if (publicDocument && !title) {
    issues.push("title_missing");
  }

  if (publicDocument && !description) {
    issues.push("description_missing");
  }

  if (publicDocument && h1Count !== 1) {
    issues.push("h1_invalid");
  }

  if (internal && !hasNoindex) {
    issues.push("internal_missing_noindex");
  }

  if (frontendPagesLink) {
    issues.push("frontend_pages_link");
  }

  if (onrenderRefs.length > 0) {
    issues.push("onrender_reference");
  }

  if (hasNoindex && hreflangLinks.length > 0) {
    issues.push("noindex_hreflang");
  }

  if (publicDocument && hreflangGhostTargets.length > 0) {
    issues.push("hreflang_ghost");
  }

  if (hasHtmlRedirect && !hasNoindex) {
    issues.push("html_redirect");
  }

  if (publicDocument && !hasNoindex && hasBadPublicSlugPattern(relPath)) {
    issues.push("public_bad_slug");
  }

  if (brokenAiBotsLinks.length > 0) {
    issues.push("broken_ai_bots_link");
  }

  return {
    relPath,
    isDocument: true,
    issues,
    expectedCanonical,
    actualCanonical: canonical,
    onrenderRefs,
    hreflangGhostTargets,
    brokenAiBotsLinks,
  };
}

function summarizeIssue(results, issueCode, formatter = (item) => item.relPath) {
  return results.filter((item) => item.issues.includes(issueCode)).map(formatter);
}

async function main() {
  const robotsContent = await fs.readFile(ROBOTS_PATH, "utf8");
  const sitemapContent = await fs.readFile(SITEMAP_PATH, "utf8");

  const robots = checkRobots(robotsContent);
  const sitemap = validateSitemapXml(sitemapContent);
  const sitemapLocs = sitemap.locs;
  const sitemapLocSet = new Set(sitemapLocs.map((loc) => normalizeSiteUrl(loc, BASE_URL)).filter(Boolean));
  const sitemapAlternates = extractSitemapAlternateTargets(sitemapContent);
  const sitemapWithSpaces = sitemapLocs.filter((loc) => /%20/i.test(loc));
  const sitemapAdminDashboard = sitemapLocs.filter((loc) => {
    try {
      const pathname = decodeURIComponent(new URL(loc).pathname);
      return /\/(admin|dashboard)(\/|$)/i.test(pathname);
    } catch {
      return false;
    }
  });
  const sitemapWithoutTrailingSlash = sitemapLocs.filter((loc) => {
    try {
      const parsed = new URL(loc);
      return parsed.pathname !== "/" && !parsed.pathname.endsWith("/");
    } catch {
      return false;
    }
  });
  const publicRegistry = buildPublicUrlRegistry(
    (await walkHtmlFiles(ROOT)).map((filePath) => toRootRelative(filePath)),
    BASE_URL
  );
  const sitemapAlternateTargetMissing = sitemapAlternates.filter((href) => {
    const normalizedHref = normalizeSiteUrl(href, BASE_URL);
    return (
      !normalizedHref ||
      !publicRegistry.relPathByCanonical.has(normalizedHref) ||
      !sitemapLocSet.has(normalizedHref)
    );
  });

  const htmlFiles = await walkHtmlFiles(ROOT);
  const htmlAudits = await Promise.all(
    htmlFiles.map((filePath) => auditHtmlFile(filePath, publicRegistry))
  );
  const documentAudits = htmlAudits.filter((item) => item.isDocument);
  const skippedHtmlFiles = htmlAudits.filter((item) => !item.isDocument).map((item) => item.relPath);

  const canonicalMissing = summarizeIssue(documentAudits, "canonical_missing");
  const canonicalInvalid = summarizeIssue(
    documentAudits,
    "canonical_invalid",
    (item) =>
      `${item.relPath} -> المتوقع: ${item.expectedCanonical || "غير معروف"} | الحالي: ${item.actualCanonical || "غير موجود"}`
  );
  const titleMissing = summarizeIssue(documentAudits, "title_missing");
  const descriptionMissing = summarizeIssue(documentAudits, "description_missing");
  const h1Invalid = summarizeIssue(documentAudits, "h1_invalid");
  const internalMissingNoindex = summarizeIssue(documentAudits, "internal_missing_noindex");
  const frontendPagesLinks = summarizeIssue(documentAudits, "frontend_pages_link");
  const onrenderReferences = summarizeIssue(
    documentAudits,
    "onrender_reference",
    (item) => `${item.relPath} -> ${takeSample(item.onrenderRefs, 3).join(" | ")}`
  );
  const noindexHreflang = summarizeIssue(documentAudits, "noindex_hreflang");
  const htmlRedirectPages = summarizeIssue(documentAudits, "html_redirect");
  const publicBadSlugs = summarizeIssue(documentAudits, "public_bad_slug");
  const hreflangGhostPages = summarizeIssue(
    documentAudits,
    "hreflang_ghost",
    (item) => `${item.relPath} -> ${takeSample(item.hreflangGhostTargets, 4).join(" | ")}`
  );
  const brokenAiBotsLinks = summarizeIssue(
    documentAudits,
    "broken_ai_bots_link",
    (item) => `${item.relPath} -> ${takeSample(unique(item.brokenAiBotsLinks), 4).join(" | ")}`
  );

  printSection("تقرير فحص SEO المحلي");
  console.log(`المجلد: ${ROOT}`);
  console.log(`الموقع المرجعي: ${BASE_URL}`);

  printSection("1) robots.txt");
  printResult(
    robots.disallowFrontendPages,
    "حظر المسار /frontend/pages/",
    robots.disallowFrontendPages ? "" : "أضف Disallow: /frontend/pages/"
  );
  printResult(
    robots.hasSitemap,
    "وجود سطر Sitemap",
    robots.hasSitemap ? robots.sitemapLine : "لا يوجد سطر يشير إلى sitemap.xml"
  );

  printSection("2) sitemap.xml");
  printResult(sitemap.ok, "سلامة بنية XML", sitemap.ok ? "" : sitemap.errors.join(" | "));
  printResult(
    sitemapWithSpaces.length === 0,
    "عدم وجود روابط تحتوي %20",
    sitemapWithSpaces.length === 0 ? "" : takeSample(sitemapWithSpaces).join(" | ")
  );
  printResult(
    sitemapAdminDashboard.length === 0,
    "عدم وجود روابط admin/dashboard",
    sitemapAdminDashboard.length === 0 ? "" : takeSample(sitemapAdminDashboard).join(" | ")
  );
  printResult(
    sitemapWithoutTrailingSlash.length === 0,
    "كل الروابط تنتهي بـ /",
    sitemapWithoutTrailingSlash.length === 0 ? "" : takeSample(sitemapWithoutTrailingSlash).join(" | ")
  );
  printResult(
    sitemapAlternateTargetMissing.length === 0,
    "كل بدائل sitemap تشير إلى صفحات عامة موجودة",
    sitemapAlternateTargetMissing.length === 0 ? "" : takeSample(sitemapAlternateTargetMissing).join(" | ")
  );
  console.log(`✅ عدد الروابط في sitemap.xml: ${sitemapLocs.length}`);

  printSection("3) ملفات HTML");
  console.log(`✅ إجمالي ملفات HTML: ${htmlAudits.length}`);
  console.log(`✅ الصفحات الكاملة التي تم فحصها: ${documentAudits.length}`);
  if (skippedHtmlFiles.length > 0) {
    console.log(
      `✅ ملفات HTML الجزئية أو غير المكتملة التي تم تجاوز فحصها التفصيلي: ${skippedHtmlFiles.length}`
    );
    console.log(`   ${takeSample(skippedHtmlFiles).join(" | ")}`);
  }

  printResult(
    canonicalMissing.length === 0,
    "وجود canonical tag في كل صفحة",
    canonicalMissing.length === 0 ? "" : takeSample(canonicalMissing).join(" | ")
  );
  printResult(
    canonicalInvalid.length === 0,
    "صحة canonical",
    canonicalInvalid.length === 0 ? "" : takeSample(canonicalInvalid, 8).join(" | ")
  );
  printResult(
    titleMissing.length === 0,
    "وجود title في كل صفحة",
    titleMissing.length === 0 ? "" : takeSample(titleMissing).join(" | ")
  );
  printResult(
    descriptionMissing.length === 0,
    "وجود description في كل صفحة",
    descriptionMissing.length === 0 ? "" : takeSample(descriptionMissing).join(" | ")
  );
  printResult(
    h1Invalid.length === 0,
    "وجود H1 واحد لكل صفحة",
    h1Invalid.length === 0 ? "" : takeSample(h1Invalid).join(" | ")
  );
  printResult(
    internalMissingNoindex.length === 0,
    "الصفحات الداخلية تحتوي noindex",
    internalMissingNoindex.length === 0 ? "" : takeSample(internalMissingNoindex).join(" | ")
  );
  printResult(
    frontendPagesLinks.length === 0,
    "عدم وجود روابط إلى /frontend/pages/",
    frontendPagesLinks.length === 0 ? "" : takeSample(frontendPagesLinks).join(" | ")
  );
  printResult(
    onrenderReferences.length === 0,
    "عدم وجود أي مراجع إلى onrender.com داخل HTML",
    onrenderReferences.length === 0 ? "" : takeSample(onrenderReferences, 8).join(" | ")
  );
  printResult(
    noindexHreflang.length === 0,
    "صفحات noindex لا تحتوي hreflang",
    noindexHreflang.length === 0 ? "" : takeSample(noindexHreflang).join(" | ")
  );
  printResult(
    hreflangGhostPages.length === 0,
    "لا يوجد hreflang يشير إلى صفحات غير موجودة أو غير عامة",
    hreflangGhostPages.length === 0 ? "" : takeSample(hreflangGhostPages, 8).join(" | ")
  );
  printResult(
    htmlRedirectPages.length === 0,
    "عدم وجود صفحات HTML تحويلية",
    htmlRedirectPages.length === 0 ? "" : takeSample(htmlRedirectPages).join(" | ")
  );
  printResult(
    publicBadSlugs.length === 0,
    "عدم وجود صفحات عامة بمسارات رديئة أو مرمزة بشكل ضعيف",
    publicBadSlugs.length === 0 ? "" : takeSample(publicBadSlugs).join(" | ")
  );
  printResult(
    brokenAiBotsLinks.length === 0,
    "عدم وجود روابط داخلية مكسورة ضمن النمط /ai-bots/",
    brokenAiBotsLinks.length === 0 ? "" : takeSample(brokenAiBotsLinks, 8).join(" | ")
  );

  const failureCount =
    Number(!robots.disallowFrontendPages) +
    Number(!robots.hasSitemap) +
    Number(!sitemap.ok) +
    Number(sitemapWithSpaces.length > 0) +
    Number(sitemapAdminDashboard.length > 0) +
    Number(sitemapWithoutTrailingSlash.length > 0) +
    Number(sitemapAlternateTargetMissing.length > 0) +
    Number(canonicalMissing.length > 0) +
    Number(canonicalInvalid.length > 0) +
    Number(titleMissing.length > 0) +
    Number(descriptionMissing.length > 0) +
    Number(h1Invalid.length > 0) +
    Number(internalMissingNoindex.length > 0) +
    Number(frontendPagesLinks.length > 0) +
    Number(onrenderReferences.length > 0) +
    Number(noindexHreflang.length > 0) +
    Number(hreflangGhostPages.length > 0) +
    Number(htmlRedirectPages.length > 0) +
    Number(publicBadSlugs.length > 0) +
    Number(brokenAiBotsLinks.length > 0);

  printSection("النتيجة النهائية");
  if (failureCount === 0) {
    console.log("✅ لا توجد مشاكل SEO ضمن الفحوصات المطلوبة.");
  } else {
    console.log(`❌ تم العثور على ${failureCount} فئة من المشاكل تحتاج معالجة.`);
  }

  process.exitCode = failureCount === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("❌ تعذر تشغيل فحص SEO المحلي.");
  console.error(`السبب: ${error.message}`);
  process.exitCode = 1;
});
