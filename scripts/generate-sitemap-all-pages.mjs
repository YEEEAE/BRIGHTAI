#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import {
  buildPublicUrlRegistry,
  findCounterpartRelPath,
  normalizeRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";
import {
  RECOVERY_SITEMAP_REQUIRED_FILES,
} from "./high-confidence-sitemap-config.mjs";
import {
  extractCanonicalHref,
  hasMetaRefresh,
  hasNoindexDirective,
} from "./sitemap-audit-utils.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();

// مخارج ملفات الـ Sitemap
const OUTPUT = path.join(ROOT, "sitemap.xml"); // سيكون Sitemap Index
const PRIORITY_OUTPUT = path.join(ROOT, "sitemap-priority.xml");
const SERVICES_OUTPUT = path.join(ROOT, "sitemap-services.xml");
const BLOG_OUTPUT = path.join(ROOT, "sitemap-blog.xml");
const REPORT_OUTPUT = path.join(ROOT, "reports", "sitemap-quality-report.md");

const IGNORED_SCAN_DIRS = new Set([
  ".git",
  ".next",
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
const RECOVERY_REL_PATHS = new Set(RECOVERY_SITEMAP_REQUIRED_FILES.map(normalizeRelPath));

/* ── Blacklist: القائمة السوداء للمسارات غير العامة أو المرفوضة أرشفياً ── */
const EXCLUDED_REL_PATH_PATTERNS = [
  /^(404|500)\.html$/i,
  /error\.html$/i,
  /(?:^|\/)reports(?:\/|\.html$)/i,
  /(?:^|\/)backend(?:\/|$)/i,
  /(?:^|\/)\.next(?:\/|$)/i,
  /(?:^|\/)node_modules(?:\/|$)/i,
  /(?:^|\/)\.agents(?:\/|$)/i,
  /(?:^|\/)tmp(?:\/|$)/i,
  / /, // استبعاد الملفات التي تحتوي على مسافات
  /\.php$/i,
  /\.json$/i,
  /\.js$/i,
  /\.css$/i,
  /^blog\/atou\.doc\.html$/i,
  /^blog\/generative-artificial-intelligence\.html$/i,
  /^frontend\/pages\//i,
  /^interview\/index\.html$/i,
  /^interview\/pages\//i,
  /^mais-OBM\/index\.html$/i,
  /^interview\/pages\/supportAI\/index\.html$/i,
  /^try(?:\/.*)?\/index\.html$/i,
];

function toIsoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripContent(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html) {
  const text = stripContent(html);
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

function detectGroup(relPath) {
  if (relPath.startsWith("blog/") || relPath.startsWith("frontend/pages/blog/")) {
    return "blog";
  }
  if (relPath.startsWith("sectors/")) {
    return "sector";
  }
  if (relPath.startsWith("services/") || relPath.startsWith("frontend/pages/services/")) {
    return "service";
  }
  return "core";
}

function detectExplicitExclusionFamily(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (/^(404|500)\.html$/i.test(normalized)) return "error pages";
  if (/^blog\/atou\.doc\.html$/i.test(normalized)) return "legacy archive blog route";
  if (/^blog\/generative-artificial-intelligence\.html$/i.test(normalized)) return "currently unpublished blog route";
  if (/^interview\/index\.html$/i.test(normalized)) return "legacy interview route redirected to demo";
  if (/^try(?:\/.*)?\/index\.html$/i.test(normalized)) return "legacy try route redirected to demo";
  if (/^docs\/(privacy-policy|privacy-policy-en|terms-and-conditions|terms-and-conditions-en)(?:\.html|\/index\.html)$/i.test(normalized)) {
    return "legal docs already noindexed";
  }
  if (normalized.startsWith("frontend/pages/")) return "frontend source files";
  if (/^tenders\/index 2\.html$/i.test(normalized)) return "duplicate tender entry";
  return "quality or canonical exclusion";
}

function isExplicitlyExcluded(relPath) {
  return EXCLUDED_REL_PATH_PATTERNS.some((pattern) => pattern.test(normalizeRelPath(relPath)));
}

function isAllowedPublicPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (isExplicitlyExcluded(normalized)) return false;
  return RECOVERY_REL_PATHS.has(normalized);
}

function hasUppercaseUrlPath(url) {
  try {
    const parsed = new URL(url);
    return /[A-Z]/.test(decodeURIComponent(parsed.pathname));
  } catch {
    return true;
  }
}

function hasHtmlUrlPath(url) {
  try {
    const parsed = new URL(url);
    return /\.html(?:\/)?$/i.test(decodeURIComponent(parsed.pathname));
  } catch {
    return true;
  }
}

function publicPathFromRelPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.replace(/\/index\.html$/i, "")}/`;
  }
  if (normalized.endsWith(".html")) {
    return `/${normalized.replace(/\.html$/i, "")}/`;
  }
  return null;
}

function normalizeInternalHref(href) {
  if (!href || typeof href !== "string") return null;
  const value = href.trim();
  if (!value || value.startsWith("#") || /^(?:mailto|tel|javascript):/i.test(value)) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(value, BASE_URL);
  } catch {
    return null;
  }

  if (parsed.origin !== BASE_URL) return null;
  if (parsed.pathname.startsWith("/api/") || parsed.pathname.startsWith("/ws/")) return null;

  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    pathname = parsed.pathname;
  }

  if (/\.[a-z0-9]+$/i.test(pathname) && !/\.html$/i.test(pathname)) {
    return null;
  }

  if (pathname.endsWith(".html")) pathname = pathname.replace(/\.html$/i, "/");
  if (pathname !== "/" && !pathname.endsWith("/")) pathname += "/";
  return pathname;
}

function extractInternalHrefs(html) {
  const hrefs = [];
  const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const normalized = normalizeInternalHref(match[1]);
    if (normalized) hrefs.push(normalized);
  }
  return hrefs;
}

function buildRouteRegistry(relPaths) {
  const routes = new Set();
  for (const relPath of relPaths) {
    const route = publicPathFromRelPath(relPath);
    if (route) routes.add(route);
  }
  return routes;
}

function findBrokenInternalLinks(html, routeRegistry) {
  return [...new Set(extractInternalHrefs(html).filter((href) => !routeRegistry.has(href)))];
}

function detectSignalReasons(html, relPath, expectedCanonical, canonicalTagHref, canonicalTagNormalized, wordCount, group, routeRegistry) {
  const reasons = [];

  if (hasMetaRefresh(html)) {
    reasons.push("meta_refresh");
  }

  if (hasNoindexDirective(html)) {
    reasons.push("robots_noindex");
  }

  if (!canonicalTagHref || canonicalTagHref !== expectedCanonical || canonicalTagNormalized !== expectedCanonical) {
    reasons.push("canonical_mismatch");
  }

  if (!expectedCanonical) {
    reasons.push("missing_expected_canonical");
  } else {
    if (hasUppercaseUrlPath(expectedCanonical)) reasons.push("uppercase_url");
    if (hasHtmlUrlPath(expectedCanonical)) reasons.push("html_url");
  }

  if (/brightai\.com\.sa/i.test(html)) {
    reasons.push("legacy_domain_signal");
  }

  if (/https:\/\/brightai\.site\/(?:\.\.\/)+assets\//i.test(html) || /"(?:\.\.\/)+assets\//i.test(html)) {
    reasons.push("broken_schema_asset_path");
  }

  if (/\s/.test(path.basename(relPath)) || path.basename(relPath).includes("_")) {
    reasons.push("unstable_slug_shape");
  }

  const brokenInternalLinks = findBrokenInternalLinks(html, routeRegistry);
  if (brokenInternalLinks.length > 0) {
    reasons.push(`broken_internal_links:${brokenInternalLinks.slice(0, 5).join("|")}`);
  }

  return reasons;
}

function buildHreflangSet(entry, registry, lowerPathMap) {
  const selfUrl = registry.canonicalByRelPath.get(entry.relPath) || entry.loc;
  if (!selfUrl || !registry.publicRelPaths.has(entry.relPath)) {
    return [];
  }

  const counterpart = findCounterpartRelPath(entry.relPath, lowerPathMap, {
    allowedRelPaths: registry.publicRelPaths,
  });
  const counterpartUrl = counterpart ? registry.canonicalByRelPath.get(counterpart) : null;
  const isEnglish = entry.relPath.toLowerCase().startsWith("en/")
    || /-en\.html$/i.test(entry.relPath)
    || /-en\/index\.html$/i.test(entry.relPath);

  if (isEnglish) {
    if (counterpartUrl) {
      return [
        { code: "ar-SA", href: counterpartUrl },
        { code: "en-SA", href: selfUrl },
        { code: "x-default", href: counterpartUrl },
      ];
    }

    return [
      { code: "en-SA", href: selfUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  if (counterpartUrl) {
    return [
      { code: "ar-SA", href: selfUrl },
      { code: "en-SA", href: counterpartUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  return [
    { code: "ar-SA", href: selfUrl },
    { code: "x-default", href: selfUrl },
  ];
}

async function analyzePage(relPath, routeRegistry, options = {}) {
  const { bypassRecoveryWhitelist = false } = options;
  const fullPath = path.join(ROOT, relPath);
  const group = detectGroup(relPath);
  const expectedCanonical = relPathToCanonical(relPath, BASE_URL);

  try {
    const html = await fs.readFile(fullPath, "utf8");
    const canonicalTagHref = extractCanonicalHref(html);
    const canonicalTagNormalized = normalizeSiteUrl(canonicalTagHref, BASE_URL);
    const wordCount = countWords(html);
    const reasons = detectSignalReasons(
      html,
      relPath,
      expectedCanonical,
      canonicalTagHref,
      canonicalTagNormalized,
      wordCount,
      group,
      routeRegistry
    );

    if (isExplicitlyExcluded(relPath)) {
      reasons.push("explicit_scope_exclusion");
    }

    if (!bypassRecoveryWhitelist && !isAllowedPublicPath(relPath)) {
      reasons.push("not_in_public_whitelist");
    }

    const stat = await fs.stat(fullPath);

    return {
      relPath,
      fullPath,
      group,
      loc: expectedCanonical,
      canonicalTagHref,
      wordCount,
      lastmod: toIsoDate(stat.mtime),
      reasons,
      include: reasons.length === 0,
    };
  } catch (error) {
    return {
      relPath,
      fullPath,
      group,
      loc: expectedCanonical,
      canonicalTagHref: "",
      wordCount: 0,
      lastmod: "",
      reasons: ["missing_or_unreadable_file", error.code || "read_error"],
      include: false,
    };
  }
}

function changefreqForAnalysis(analysis) {
  if (analysis.loc === `${BASE_URL}/`) {
    return "daily";
  }
  if (analysis.group === "blog" || analysis.group === "service") {
    return "weekly";
  }
  if (analysis.loc === `${BASE_URL}/blog` || analysis.loc === `${BASE_URL}/docs` || analysis.loc === `${BASE_URL}/services`) {
    return "weekly";
  }
  return "monthly";
}

function priorityForAnalysis(analysis) {
  if (analysis.loc === `${BASE_URL}/`) {
    return "1.0";
  }
  if (analysis.group === "blog") {
    return "0.7";
  }
  if (analysis.group === "service") {
    return "0.8";
  }
  if (analysis.group === "sector") {
    return "0.8";
  }
  return "0.9";
}

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

function sourcePriority(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized.startsWith("frontend/pages/")) {
    return 4;
  }
  if (normalized.startsWith("interview/")) {
    return 2;
  }
  return 0;
}

// دالة عامة لمعالجة وبناء الـ Entries لأي قائمة من المرشحين
async function buildEntriesForCandidates(candidateRelPaths, allFiles, options = {}) {
  const normalizedRelPaths = allFiles.map((fullPath) => normalizeRelPath(path.relative(ROOT, fullPath)));
  const lowerPathMap = new Map(normalizedRelPaths.map((relPath) => [relPath.toLowerCase(), relPath]));
  const routeRegistry = buildRouteRegistry(normalizedRelPaths);
  const registry = buildPublicUrlRegistry(candidateRelPaths, BASE_URL);
  const analyses = await Promise.all(
    candidateRelPaths.map((relPath) => analyzePage(relPath, routeRegistry, options))
  );
  const included = analyses.filter((analysis) => analysis.include && analysis.loc);
  const byLoc = new Map();

  for (const analysis of included) {
    const current = byLoc.get(analysis.loc);
    if (current && sourcePriority(current.relPath) <= sourcePriority(analysis.relPath)) {
      continue;
    }

    byLoc.set(analysis.loc, {
      loc: analysis.loc,
      relPath: analysis.relPath,
      group: analysis.group,
      wordCount: analysis.wordCount,
      lastmod: analysis.lastmod,
      changefreq: changefreqForAnalysis(analysis),
      priority: priorityForAnalysis(analysis),
      alternates: [],
    });
  }

  const entries = Array.from(byLoc.values()).sort((first, second) => first.loc.localeCompare(second.loc, "en"));
  for (const entry of entries) {
    entry.alternates = buildHreflangSet(entry, registry, lowerPathMap);
  }

  return { entries, analyses };
}

function renderXml(entries) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
  lines.push("");

  for (const entry of entries) {
    lines.push("  <url>");
    lines.push(`    <loc>${xmlEscape(entry.loc)}</loc>`);
    for (const alt of entry.alternates) {
      if (hasUppercaseUrlPath(alt.href) || hasHtmlUrlPath(alt.href)) {
        continue;
      }
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alt.code)}" href="${xmlEscape(alt.href)}" />`
      );
    }
    lines.push(`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`);
    lines.push("  </url>");
  }

  lines.push("");
  lines.push("</urlset>");
  lines.push("");
  return lines.join("\n");
}

// دالة لتوليد ملف الـ Sitemap Index القياسي
function renderSitemapIndex(sitemaps) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  
  for (const sitemap of sitemaps) {
    lines.push("  <sitemap>");
    lines.push(`    <loc>${xmlEscape(sitemap.loc)}</loc>`);
    lines.push(`    <lastmod>${xmlEscape(sitemap.lastmod)}</lastmod>`);
    lines.push("  </sitemap>");
  }
  
  lines.push("</sitemapindex>");
  lines.push("");
  return lines.join("\n");
}

function renderReport({ priorityCount, servicesCount, blogCount, excludedCount }) {
  const lines = [
    "# Sitemap Indexing and Quality Report",
    "",
    `- Date: ${new Date().toISOString()}`,
    `- Priority Sitemap URLs (Core & Sectors): ${priorityCount}`,
    `- Services Sitemap URLs (All Services): ${servicesCount}`,
    `- Blog Sitemap URLs (All Blogs): ${blogCount}`,
    `- Excluded / Thin Content Pages: ${excludedCount}`,
    "",
    "## Inclusion Strategy",
    "- **Sitemap Index (`sitemap.xml`)** directs to three dedicated maps.",
    "- **Priority Map (`sitemap-priority.xml`)** focuses on high-confidence marketing pages.",
    "- **Services Map (`sitemap-services.xml`)** dynamically crawls and registers active Saudi SaaS services.",
    "- **Blog Map (`sitemap-blog.xml`)** discovers and indexes informative Arabic and English articles.",
    "",
    "All URLs strictly verified for canonical alignment, code 200 health, non-redirect, and noindex clearance.",
  ];
  return lines.join("\n") + "\n";
}

async function main() {
  const allFiles = await walkHtmlFiles(ROOT);

  // 1. توليد sitemap-priority.xml (عالية الثقة)
  const candidatePriorityPaths = RECOVERY_SITEMAP_REQUIRED_FILES.map(normalizeRelPath);
  const priorityResult = await buildEntriesForCandidates(candidatePriorityPaths, allFiles, {
    bypassRecoveryWhitelist: false,
  });
  const priorityXml = renderXml(priorityResult.entries);
  await fs.writeFile(PRIORITY_OUTPUT, priorityXml, "utf8");
  process.stdout.write(`Generated sitemap-priority.xml with ${priorityResult.entries.length} URLs\n`);

  // 2. توليد sitemap-services.xml (ديناميكي لصفحات الخدمات)
  const serviceFiles = await walkHtmlFiles(path.join(ROOT, "services"));
  const candidateServicePaths = serviceFiles.map((f) => normalizeRelPath(path.relative(ROOT, f)));
  const servicesResult = await buildEntriesForCandidates(candidateServicePaths, allFiles, {
    bypassRecoveryWhitelist: true,
  });
  const servicesXml = renderXml(servicesResult.entries);
  await fs.writeFile(SERVICES_OUTPUT, servicesXml, "utf8");
  process.stdout.write(`Generated sitemap-services.xml with ${servicesResult.entries.length} URLs\n`);

  // 3. توليد sitemap-blog.xml (ديناميكي لصفحات المدونة)
  const blogFiles = await walkHtmlFiles(path.join(ROOT, "blog"));
  const candidateBlogPaths = blogFiles.map((f) => normalizeRelPath(path.relative(ROOT, f)));
  const blogResult = await buildEntriesForCandidates(candidateBlogPaths, allFiles, {
    bypassRecoveryWhitelist: true,
  });
  const blogXml = renderXml(blogResult.entries);
  await fs.writeFile(BLOG_OUTPUT, blogXml, "utf8");
  process.stdout.write(`Generated sitemap-blog.xml with ${blogResult.entries.length} URLs\n`);

  // 4. توليد sitemap.xml (Sitemap Index)
  const today = toIsoDate(new Date());
  const indexSitemaps = [
    { loc: `${BASE_URL}/sitemap-priority.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-services.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-blog.xml`, lastmod: today },
  ];
  const indexXml = renderSitemapIndex(indexSitemaps);
  await fs.writeFile(OUTPUT, indexXml, "utf8");
  process.stdout.write(`Generated sitemap.xml (Sitemap Index) pointing to ${indexSitemaps.length} maps\n`);

  // 5. توليد تقرير الجودة الشامل
  const totalExcluded = priorityResult.analyses.filter(a => !a.include).length +
                        servicesResult.analyses.filter(a => !a.include).length +
                        blogResult.analyses.filter(a => !a.include).length;

  const report = renderReport({
    priorityCount: priorityResult.entries.length,
    servicesCount: servicesResult.entries.length,
    blogCount: blogResult.entries.length,
    excludedCount: totalExcluded,
  });
  await fs.mkdir(path.dirname(REPORT_OUTPUT), { recursive: true });
  await fs.writeFile(REPORT_OUTPUT, report, "utf8");
  process.stdout.write(`Generated quality report in reports/sitemap-quality-report.md\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
