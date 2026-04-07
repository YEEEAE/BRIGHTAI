#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import {
  findCounterpartRelPath,
  normalizeRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";
import {
  extractCanonicalHref,
  hasMetaRefresh,
  hasNoindexDirective,
} from "./sitemap-audit-utils.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "sitemap.xml");
const REPORT_OUTPUT = path.join(ROOT, "reports", "sitemap-quality-report.md");
const IGNORED_SCAN_DIRS = new Set([
  ".git",
  "node_modules",
  "aimais",
  "brightai-platform",
  "coverage",
  "dist",
  "build",
]);
const EXCLUDED_REL_PATH_PATTERNS = [
  /^(404|500)\.html$/i,
  /^privacy-cookies\/index\.html$/i,
  /^terms\/index\.html$/i,
  /^sitemap\/index\.html$/i,
  /^blog\/atou\.doc\.html$/i,
  /^blog\/generative-artificial-intelligence\.html$/i,
  /^docs\/(privacy-policy|privacy-policy-en|terms-and-conditions|terms-and-conditions-en)\.html$/i,
  /^frontend\/pages\//i,
  /^interview\/pages\//i,
  /^tenders\/(?:dashboard|reports|settings|compare|templates)\.html$/i,
  /^en\/tenders\/(?:dashboard|reports|settings|compare|templates)\.html$/i,
  /^tenders\/index 2\.html$/i,
  /^tenders\/landing\.html$/i,
];
const MIN_WORDS_BY_GROUP = {
  core: 120,
  sector: 350,
  blog: 450,
};

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
  if (/^docs\/(privacy-policy|privacy-policy-en|terms-and-conditions|terms-and-conditions-en)\.html$/i.test(normalized)) {
    return "legal docs already noindexed";
  }
  if (/^(privacy-cookies|terms|sitemap)\/index\.html$/i.test(normalized)) return "utility and legal pages";
  if (normalized.startsWith("frontend/pages/")) return "frontend source files";
  if (normalized.startsWith("interview/pages/")) {
    return "interview app internal routes";
  }
  if (/^tenders\/(?:dashboard|reports|settings|compare|templates)\.html$/i.test(normalized)) return "authenticated tender app routes";
  if (/^en\/tenders\/(?:dashboard|reports|settings|compare|templates)\.html$/i.test(normalized)) return "authenticated tender app routes";
  if (/^tenders\/index 2\.html$/i.test(normalized)) return "duplicate tender entry";
  if (/^tenders\/landing\.html$/i.test(normalized)) return "duplicate tender landing page";
  return "quality or canonical exclusion";
}

function isExplicitlyExcluded(relPath) {
  return EXCLUDED_REL_PATH_PATTERNS.some((pattern) => pattern.test(normalizeRelPath(relPath)));
}

function detectSignalReasons(html, relPath, expectedCanonical, canonicalTagHref, canonicalTagNormalized, wordCount, group) {
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

  return reasons;
}

function buildHreflangSet(selfUrl) {
  try {
    const urlObj = new URL(selfUrl);
    const pathname = urlObj.pathname;
    
    const isEnglish = pathname.startsWith("/en/") || pathname === "/en";
    
    let arPath = isEnglish ? pathname.substring(3) : pathname;
    if (!arPath || arPath === "") arPath = "/";
    
    let enPath = "/en" + (arPath.startsWith("/") ? arPath : "/" + arPath);
    
    // Normalize slashes
    arPath = arPath.replace(/\/+/g, "/");
    enPath = enPath.replace(/\/+/g, "/");
    
    const arUrl = urlObj.origin + arPath + urlObj.search + urlObj.hash;
    const enUrl = urlObj.origin + enPath + urlObj.search + urlObj.hash;

    return [
      { code: "ar-SA", href: arUrl },
      { code: "en-US", href: enUrl },
      { code: "x-default", href: arUrl },
    ];
  } catch (error) {
    return [];
  }
}

async function analyzePage(relPath) {
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
      group
    );
    if (isExplicitlyExcluded(relPath)) {
      reasons.push("explicit_scope_exclusion");
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
  const analyses = await Promise.all(
    allFiles.map((fullPath) => analyzePage(normalizeRelPath(path.relative(ROOT, fullPath))))
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
    entry.alternates = buildHreflangSet(entry.loc);
  }

  return { entries, analyses };
}

async function buildExcludedInventory() {
  const allFiles = await walkHtmlFiles(ROOT);
  const rows = [];

  for (const fullPath of allFiles) {
    const relPath = normalizeRelPath(path.relative(ROOT, fullPath));
    const analysis = await analyzePage(relPath);
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
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alt.code)}" href="${xmlEscape(alt.href)}" />`
      );
    }
    lines.push(`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`);
    lines.push(`    <priority>${xmlEscape(entry.priority)}</priority>`);
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
    "- نضم كل صفحة عامة قابلة للفهرسة داخل الموقع إذا كان canonical النهائي صحيحًا ولا تحتوي `noindex` أو redirect/meta refresh أو إشارات legacy أو مسارات تقنية مستبعدة.",
    "- نستبعد تلقائياً الصفحات القانونية منخفضة القيمة، صفحات الخطأ، الصفحات الداخلية للتطبيقات، الملفات الجزئية، والنسخ المكررة أو القديمة.",
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
  await fs.writeFile(REPORT_OUTPUT, report, "utf8");

  process.stdout.write(`Generated sitemap.xml with ${entries.length} high-confidence URLs\n`);
  process.stdout.write(
    `Generated reports/sitemap-quality-report.md with ${excludedInventory.length + analyses.length} analyzed rows\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
