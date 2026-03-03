#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import {
  findCounterpartRelPath,
  normalizeRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "sitemap.xml");

const STATIC_FILES = ["index.html", "docs.html"];
const ROOT_INDEX_DIRS = [
  "about",
  "ai-agent",
  "ai-bots",
  "blog",
  "case-studies",
  "consultation",
  "contact",
  "data-analysis",
  "health",
  "machine-learning",
  "partners",
  "services",
  "smart-automation",
  "tools",
  "what-is-ai",
];
const HTML_SCAN_DIRS = ["frontend/pages"];

const EXCLUDE_FILES = new Set(["404.html", "500.html"]);
const LOW_QUALITY_BLOGGER_FILES = new Set([
  "agint-bblog.html",
  "ai.html",
  "analysy.html",
  "auto.html",
  "digital.html",
  "gov.html",
  "atou-job.html",
  "cloude-opus-4.6.html",
  "production-line-2.html",
]);

function isExcludedPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  const base = path.basename(normalized);
  if (EXCLUDE_FILES.has(base)) return true;
  if (normalized.includes("/partials/")) return true;
  if (normalized.startsWith("frontend/pages/interview/")) return true;
  if (normalized.startsWith("frontend/pages/botAI/")) return true;
  if (normalized.startsWith("frontend/pages/offline/")) return true;
  if (normalized.startsWith("frontend/pages/terms/")) return true;
  if (normalized.startsWith("frontend/pages/sitemap/")) return true;
  if (/\s/.test(normalized) || normalized.includes("_")) return true;

  if (normalized.startsWith("frontend/pages/blogger/")) {
    if (/\.doc\.html$/i.test(base)) return true;
    if (LOW_QUALITY_BLOGGER_FILES.has(base)) return true;
  }

  return false;
}

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

async function walkHtmlFiles(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".html")) continue;
    files.push(fullPath);
  }
  return files;
}

async function collectCandidateFiles() {
  const collected = new Set();

  for (const rel of STATIC_FILES) {
    try {
      await fs.access(path.join(ROOT, rel));
      collected.add(rel);
    } catch {
      // Optional page.
    }
  }

  for (const relDir of ROOT_INDEX_DIRS) {
    const rel = `${relDir}/index.html`;
    try {
      await fs.access(path.join(ROOT, rel));
      collected.add(rel);
    } catch {
      // Optional page.
    }
  }

  for (const scanDir of HTML_SCAN_DIRS) {
    const fullDir = path.join(ROOT, scanDir);
    try {
      const files = await walkHtmlFiles(fullDir);
      for (const fullPath of files) {
        collected.add(normalizeRelPath(path.relative(ROOT, fullPath)));
      }
    } catch {
      // Optional directory.
    }
  }

  return Array.from(collected).sort((a, b) => a.localeCompare(b, "en"));
}

async function buildEntries() {
  const candidates = await collectCandidateFiles();
  const byLoc = new Map();

  for (const relPath of candidates) {
    if (isExcludedPath(relPath)) continue;

    const canonicalUrl = relPathToCanonical(relPath, BASE_URL);
    if (!canonicalUrl) continue;

    const fullPath = path.join(ROOT, relPath);
    const html = await fs.readFile(fullPath, "utf8");
    if (hasMetaRefresh(html)) continue;

    const canonicalTagHref = extractCanonicalHref(html);
    const canonicalTagNormalized = normalizeSiteUrl(canonicalTagHref, BASE_URL);
    if (canonicalTagHref !== canonicalUrl || canonicalTagNormalized !== canonicalUrl) {
      continue;
    }

    const stat = await fs.stat(fullPath);
    const pathname = new URL(canonicalUrl).pathname;
    const changefreq = pathname === "/" ? "daily" : pathname.startsWith("/blog/") ? "weekly" : "monthly";
    const priority = pathname === "/" ? "1.0" : pathname.startsWith("/blog/") ? "0.7" : "0.8";

    byLoc.set(canonicalUrl, {
      loc: canonicalUrl,
      relPath,
      lastmod: toIsoDate(stat.mtime),
      changefreq,
      priority,
      alternates: [],
    });
  }

  const entries = Array.from(byLoc.values()).sort((a, b) => a.loc.localeCompare(b.loc, "en"));
  const lowerPathMap = new Map(entries.map((entry) => [entry.relPath.toLowerCase(), entry.relPath]));
  const includedRelPaths = new Set(entries.map((entry) => entry.relPath.toLowerCase()));

  for (const entry of entries) {
    entry.alternates = buildHreflangSet(entry.relPath, entry.loc, lowerPathMap, includedRelPaths);
  }

  return entries;
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

async function main() {
  const entries = await buildEntries();
  const xml = renderXml(entries);
  await fs.writeFile(OUTPUT, xml, "utf8");
  process.stdout.write(`Generated sitemap.xml with ${entries.length} canonical URLs\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
