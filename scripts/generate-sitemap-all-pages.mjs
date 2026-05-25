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
const OUTPUT = path.join(ROOT, "sitemap.xml");
const PRIORITY_OUTPUT = path.join(ROOT, "sitemap-priority.xml");
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

/* ── Blacklist: any match here forces exclusion regardless of whitelist ── */
const EXCLUDED_REL_PATH_PATTERNS = [
  // ── Error / system pages ──
  /^(404|500)\.html$/i,
  /error\.html$/i,
  // ── Paths containing non-public segments ──
  /(?:^|\/)reports(?:\/|\.html$)/i,
  /(?:^|\/)backend(?:\/|$)/i,
  /(?:^|\/)\.next(?:\/|$)/i,
  /(?:^|\/)node_modules(?:\/|$)/i,
  /(?:^|\/)\.agents(?:\/|$)/i,
  /(?:^|\/)tmp(?:\/|$)/i,
  // ── Files with spaces in the name (e.g. "index 2.html") ──
  / /,
  // ── API / non-HTML assets ──
  /\.php$/i,
  /\.json$/i,
  /\.js$/i,
  /\.css$/i,
  // ── Legacy / internal routes ──
  /^blog\/atou\.doc\.html$/i,
  /^blog\/generative-artificial-intelligence\.html$/i,
  /^frontend\/pages\//i,
  /^interview\/index\.html$/i,
  /^interview\/pages\//i,
  /^mais-OBM\/index\.html$/i,
  /^interview\/pages\/supportAI\/index\.html$/i,
  /^try(?:\/.*)?\/index\.html$/i,
];
const MIN_WORDS_BY_GROUP = {};

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
  if (!text) {
    return 0;
  }
  return text.split(" ").filter(Boolean).length;
}

function detectGroup(relPath) {
  if (relPath.startsWith("blog/") || relPath.startsWith("frontend/pages/blog/")) {
    return "blog";
  }
  if (relPath.startsWith("sectors/")) {
    return "sector";
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
  // Blacklist always wins
  if (isExplicitlyExcluded(normalized)) return false;
  // Recovery sitemap is intentionally limited to hand-picked, high-confidence pages.
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
  if (
    !value ||
    value.startsWith("#") ||
    /^(?:mailto|tel|javascript):/i.test(value)
  ) {
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

  const minWords = MIN_WORDS_BY_GROUP[group] || 0;
  if (minWords && wordCount < minWords) {
    reasons.push(`thin_content_lt_${minWords}`);
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

async function analyzePage(relPath, routeRegistry) {
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
    if (!isAllowedPublicPath(relPath)) {
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
  if (analysis.group === "blog") {
    return "weekly";
  }
  if (analysis.loc === `${BASE_URL}/blog` || analysis.loc === `${BASE_URL}/docs`) {
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
  if (analysis.group === "sector") {
    return "0.8";
  }
  return "0.9";
}

async function walkHtmlFiles(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

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

async function buildEntries() {
  const allFiles = await walkHtmlFiles(ROOT);
  const normalizedRelPaths = allFiles.map((fullPath) => normalizeRelPath(path.relative(ROOT, fullPath)));
  const candidateRelPaths = RECOVERY_SITEMAP_REQUIRED_FILES.map(normalizeRelPath);
  const lowerPathMap = new Map(normalizedRelPaths.map((relPath) => [relPath.toLowerCase(), relPath]));
  const routeRegistry = buildRouteRegistry(normalizedRelPaths);
  const registry = buildPublicUrlRegistry(candidateRelPaths, BASE_URL);
  const analyses = await Promise.all(
    candidateRelPaths.map((relPath) => analyzePage(relPath, routeRegistry))
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

async function buildExcludedInventory() {
  const allFiles = await walkHtmlFiles(ROOT);
  const normalizedRelPaths = allFiles.map((fullPath) => normalizeRelPath(path.relative(ROOT, fullPath)));
  const routeRegistry = buildRouteRegistry(normalizedRelPaths);
  const rows = [];

  for (const relPath of RECOVERY_SITEMAP_REQUIRED_FILES.map(normalizeRelPath)) {
    const analysis = await analyzePage(relPath, routeRegistry);
    if (analysis.include) {
      continue;
    }

    rows.push({
      relPath,
      group: detectGroup(relPath),
      wordCount: analysis.wordCount,
      reasons: [...new Set([...analysis.reasons, detectExplicitExclusionFamily(relPath)])],
      loc: analysis.loc || "",
    });
  }

  rows.sort((first, second) => first.relPath.localeCompare(second.relPath, "en"));
  return rows;
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

function renderReport({ entries, analyses, excludedInventory }) {
  const includedCore = entries.filter((entry) => entry.group === "core");
  const includedSectors = entries.filter((entry) => entry.group === "sector");
  const includedBlogs = entries.filter((entry) => entry.group === "blog");
  const excludedSelected = analyses.filter((analysis) => !analysis.include);
  const reasonCounts = new Map();

  for (const row of [...excludedSelected, ...excludedInventory]) {
    for (const reason of row.reasons) {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }
  }

  const topReasons = [...reasonCounts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]));
  const lines = [
    "# Sitemap Quality Report",
    "",
    `- Date: ${new Date().toISOString()}`,
    `- Total URLs in generated sitemap: ${entries.length}`,
    `- Included core pages: ${includedCore.length}`,
    `- Included sector pages: ${includedSectors.length}`,
    `- Included blog articles: ${includedBlogs.length}`,
    `- Excluded analyzed pages: ${excludedSelected.length}`,
    `- Excluded inventory rows: ${excludedInventory.length}`,
    "",
    "## Inclusion Policy",
    "- هذه خريطة تعافي مؤقتة عالية الثقة فقط، وليست جرداً كاملاً لكل صفحات الموقع.",
    "- نضم الصفحة فقط إذا كانت ضمن allowlist التعافي، موجودة محلياً، self-canonical، لا تحتوي `noindex`، لا تحتوي redirect/meta refresh، ولا تملك روابط داخلية مكسورة.",
    "- نستبعد مؤقتاً صفحات demo الضعيفة، docs التقنية أو المتكررة، الصفحات ذات uppercase URL، روابط `.html`، وأي canonical mismatch.",
    "- لم يتم تعديل أي `<title>` ضمن هذه المرحلة.",
    "",
    "## Top Exclusion Reasons",
    ""
  ];

  if (!topReasons.length) {
    lines.push("- لا توجد أسباب استبعاد مسجلة.");
  } else {
    lines.push("| Reason | Count |");
    lines.push("| --- | ---: |");
    for (const [reason, count] of topReasons) {
      lines.push(`| ${reason} | ${count} |`);
    }
  }

  lines.push("");
  lines.push("## Included URLs");
  lines.push("");
  lines.push("| Group | File | Words | URL |");
  lines.push("| --- | --- | ---: | --- |");
  for (const entry of entries) {
    lines.push(`| ${entry.group} | ${entry.relPath.replace(/\|/g, "\\|")} | ${entry.wordCount} | ${entry.loc.replace(/\|/g, "\\|")} |`);
  }

  lines.push("");
  lines.push("## Excluded Analyzed Pages");
  lines.push("");
  if (!excludedSelected.length) {
    lines.push("- لا توجد صفحات مختارة تم استبعادها بعد بوابة الجودة.");
  } else {
    lines.push("| File | Words | Reasons |");
    lines.push("| --- | ---: | --- |");
    for (const row of excludedSelected) {
      lines.push(`| ${row.relPath.replace(/\|/g, "\\|")} | ${row.wordCount} | ${row.reasons.join(", ").replace(/\|/g, "\\|")} |`);
    }
  }

  lines.push("");
  lines.push("## Excluded Content Inventory");
  lines.push("");
  if (!excludedInventory.length) {
    lines.push("- لا توجد صفحات مستبعدة في نطاق الجرد.");
  } else {
    lines.push("| File | Words | Reasons |");
    lines.push("| --- | ---: | --- |");
    for (const row of excludedInventory) {
      lines.push(`| ${row.relPath.replace(/\|/g, "\\|")} | ${row.wordCount} | ${row.reasons.join(", ").replace(/\|/g, "\\|")} |`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const { entries, analyses } = await buildEntries();
  const excludedInventory = await buildExcludedInventory();
  const xml = renderXml(entries);
  const report = renderReport({ entries, analyses, excludedInventory });

  await fs.writeFile(OUTPUT, xml, "utf8");
  await fs.writeFile(PRIORITY_OUTPUT, xml, "utf8");
  await fs.writeFile(REPORT_OUTPUT, report, "utf8");

  process.stdout.write(`Generated sitemap.xml with ${entries.length} high-confidence URLs\n`);
  process.stdout.write(`Generated sitemap-priority.xml with ${entries.length} matching high-confidence URLs\n`);
  process.stdout.write(
    `Generated reports/sitemap-quality-report.md with ${excludedInventory.length + analyses.length} analyzed rows\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
