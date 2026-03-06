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
  HIGH_CONFIDENCE_BLOG_FILES,
  HIGH_CONFIDENCE_CORE_FILES,
  HIGH_CONFIDENCE_SECTOR_FILES,
  HIGH_CONFIDENCE_SITEMAP_FILES,
} from "./high-confidence-sitemap-config.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "sitemap.xml");
const REPORT_OUTPUT = path.join(ROOT, "sitemap-quality-report.md");

const HIGH_CONFIDENCE_CORE_SET = new Set(HIGH_CONFIDENCE_CORE_FILES);
const HIGH_CONFIDENCE_SECTOR_SET = new Set(HIGH_CONFIDENCE_SECTOR_FILES);
const HIGH_CONFIDENCE_BLOG_SET = new Set(HIGH_CONFIDENCE_BLOG_FILES);
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

function extractCanonicalHref(html) {
  const match = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
  if (!match) return "";
  const href = match[0].match(/\bhref\s*=\s*["']([^"']+)["']/i);
  return (href?.[1] || "").trim();
}

function hasMetaRefresh(html) {
  return /<meta\s+http-equiv=["']refresh["']/i.test(html);
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
  if (HIGH_CONFIDENCE_BLOG_SET.has(relPath)) {
    return "blog";
  }
  if (HIGH_CONFIDENCE_SECTOR_SET.has(relPath)) {
    return "sector";
  }
  if (HIGH_CONFIDENCE_CORE_SET.has(relPath)) {
    return "core";
  }
  return "other";
}

function detectExplicitExclusionFamily(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized.startsWith("frontend/pages/ai-bots/")) return "ai-bots detail pages";
  if (normalized.startsWith("frontend/pages/try/")) return "try/demo playground";
  if (normalized.startsWith("frontend/pages/demo/")) return "try/demo playground";
  if (normalized.startsWith("frontend/pages/interview/")) return "interview flow";
  if (normalized.startsWith("frontend/pages/botAI/")) return "legacy botAI paths";
  if (normalized.startsWith("frontend/pages/privacy-cookies/")) return "legal and utility pages";
  if (normalized.startsWith("frontend/pages/terms/")) return "legal and utility pages";
  if (normalized.startsWith("frontend/pages/offline/")) return "legal and utility pages";
  if (normalized.startsWith("frontend/pages/sitemap/")) return "legal and utility pages";
  return "phase-3 scope exclusion";
}

function detectSignalReasons(html, relPath, expectedCanonical, canonicalTagHref, canonicalTagNormalized, wordCount, group) {
  const reasons = [];

  if (hasMetaRefresh(html)) {
    reasons.push("meta_refresh");
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

function buildHreflangSet(relPath, selfUrl, lowerPathMap, includedRelPaths) {
  const counterpart = findCounterpartRelPath(relPath, lowerPathMap);
  const counterpartExists = counterpart && includedRelPaths.has(counterpart.toLowerCase());
  const counterpartUrl = counterpartExists ? relPathToCanonical(counterpart, BASE_URL) : null;
  const isEnglish = /-en\.html$/i.test(relPath);

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
      files.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function buildEntries() {
  const analyses = await Promise.all(HIGH_CONFIDENCE_SITEMAP_FILES.map((relPath) => analyzePage(relPath)));
  const included = analyses.filter((analysis) => analysis.include && analysis.loc);
  const byLoc = new Map();

  for (const analysis of included) {
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
  const lowerPathMap = new Map(entries.map((entry) => [entry.relPath.toLowerCase(), entry.relPath]));
  const includedRelPaths = new Set(entries.map((entry) => entry.relPath.toLowerCase()));

  for (const entry of entries) {
    entry.alternates = buildHreflangSet(entry.relPath, entry.loc, lowerPathMap, includedRelPaths);
  }

  return { entries, analyses };
}

async function buildExcludedInventory() {
  const auditDirs = [
    "frontend/pages/blogger",
    "frontend/pages/blog/automation",
    "frontend/pages/blog/data-analytics",
    "frontend/pages/sectors",
  ];
  const rows = [];
  const selectedSet = new Set(HIGH_CONFIDENCE_SITEMAP_FILES);

  for (const relDir of auditDirs) {
    const fullDir = path.join(ROOT, relDir);
    let files = [];
    try {
      files = await walkHtmlFiles(fullDir);
    } catch {
      continue;
    }

    for (const fullPath of files) {
      const relPath = normalizeRelPath(path.relative(ROOT, fullPath));
      if (selectedSet.has(relPath)) {
        continue;
      }

      const analysis = await analyzePage(relPath);
      const reasons = analysis.reasons.length
        ? [...analysis.reasons, detectExplicitExclusionFamily(relPath)]
        : [detectExplicitExclusionFamily(relPath)];

      rows.push({
        relPath,
        group: detectGroup(relPath),
        wordCount: analysis.wordCount,
        reasons,
        loc: analysis.loc || "",
      });
    }
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
    lines.push(`    <changefreq>${xmlEscape(entry.changefreq)}</changefreq>`);
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
    `- Total URLs in high-confidence sitemap: ${entries.length}`,
    `- Included core pages: ${includedCore.length}`,
    `- Included sector pages: ${includedSectors.length}`,
    `- Included blog articles: ${includedBlogs.length}`,
    `- Excluded curated candidates: ${excludedSelected.length}`,
    `- Excluded inventory rows: ${excludedInventory.length}`,
    "",
    "## Inclusion Policy",
    "- نضم فقط الصفحات المحددة ضمن high-confidence sitemap scope.",
    "- أي صفحة تفشل في canonical النهائي أو تحتوي إشارات legacy أو مسارات assets معطوبة أو محتوى أضعف من الحد الأدنى تُستبعد تلقائياً.",
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
  lines.push("## Excluded Curated Candidates");
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
  process.stdout.write(`Generated sitemap-quality-report.md with ${excludedInventory.length + analyses.length} analyzed rows\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
