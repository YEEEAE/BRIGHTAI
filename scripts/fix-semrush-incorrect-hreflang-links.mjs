#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { encodeUrlPath, relPathToSitePath } from "./seo-url-map.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const DATE_STAMP = "2026-03-08";
const REPORT_PATH =
  process.argv[2] ||
  path.join(ROOT, "reports", `semrush-incorrect-hreflang-links-${DATE_STAMP}.json`);
const OUTPUT_REPORT =
  process.argv[3] ||
  path.join(ROOT, "reports", `semrush-incorrect-hreflang-fixed-${DATE_STAMP}.md`);

function normalizeRelPath(relPath) {
  return relPath.replace(/\\/g, "/");
}

function sourceUrlToRelPath(sourceUrl) {
  const pathname = decodeURIComponent(new URL(sourceUrl).pathname || "/");
  if (!pathname.startsWith("/frontend/pages/")) {
    return null;
  }

  if (pathname.endsWith("/")) {
    return pathname.slice(1) + "index.html";
  }

  return pathname.slice(1);
}

function relPathToPublicUrl(relPath) {
  const normalized = normalizeRelPath(relPath);
  let sitePath = relPathToSitePath(normalized);

  if (!sitePath) {
    if (normalized === "frontend/pages/index.html") {
      sitePath = "/";
    } else if (normalized.endsWith("/index.html")) {
      sitePath = `/${normalized
        .replace(/^frontend\/pages\//, "")
        .replace(/\/index\.html$/, "")}/`;
    } else if (normalized.startsWith("frontend/pages/")) {
      sitePath = `/${normalized
        .replace(/^frontend\/pages\//, "")
        .replace(/\.html$/, "")}`;
    } else {
      throw new Error(`Unable to derive public URL from ${normalized}`);
    }
  }

  if (normalized.endsWith("/index.html") && sitePath !== "/" && !sitePath.endsWith("/")) {
    sitePath = `${sitePath}/`;
  }

  return `${BASE_URL}${encodeUrlPath(sitePath || "/")}`;
}

function replaceAttr(tag, attr, value) {
  const attrRegex = new RegExp(`(${attr}\\s*=\\s*["'])[^"']*(["'])`, "i");
  if (attrRegex.test(tag)) {
    return tag.replace(attrRegex, `$1${value}$2`);
  }

  return tag.replace(/>$/, ` ${attr}="${value}">`);
}

function replaceTagAttr(content, regex, attr, value) {
  let count = 0;
  const next = content.replace(regex, (tag) => {
    count += 1;
    return replaceAttr(tag, attr, value);
  });
  return { content: next, count };
}

function normalizeTopLevelJsonLdNode(node, finalUrl) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return node;
  }

  const next = { ...node };

  if (typeof next.url === "string") {
    next.url = finalUrl;
  }

  if (typeof next.mainEntityOfPage === "string") {
    next.mainEntityOfPage = finalUrl;
  } else if (
    next.mainEntityOfPage &&
    typeof next.mainEntityOfPage === "object" &&
    !Array.isArray(next.mainEntityOfPage)
  ) {
    next.mainEntityOfPage = {
      ...next.mainEntityOfPage,
      "@id": finalUrl,
      url: typeof next.mainEntityOfPage.url === "string" ? finalUrl : next.mainEntityOfPage.url,
    };
  }

  return next;
}

function normalizeJsonLdBlocks(content, finalUrl) {
  let replacements = 0;
  const next = content.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (full, openTag, rawJson, closeTag) => {
      try {
        const parsed = JSON.parse(rawJson);
        const normalized = Array.isArray(parsed)
          ? parsed.map((item) => normalizeTopLevelJsonLdNode(item, finalUrl))
          : normalizeTopLevelJsonLdNode(parsed, finalUrl);
        const serialized = JSON.stringify(normalized, null, 2);
        if (serialized !== rawJson.trim()) {
          replacements += 1;
        }
        return `${openTag}\n${serialized}\n${closeTag}`;
      } catch {
        return full;
      }
    },
  );

  return { content: next, count: replacements };
}

const raw = await fs.readFile(REPORT_PATH, "utf8");
const report = JSON.parse(raw);
const relPaths = [...new Set((report.data || []).map((row) => sourceUrlToRelPath(row.source_url)).filter(Boolean))];

const results = [];

for (const relPath of relPaths) {
  const absPath = path.join(ROOT, relPath);
  const finalUrl = relPathToPublicUrl(relPath);
  const original = await fs.readFile(absPath, "utf8");

  let updated = original;
  const stats = {
    relPath,
    finalUrl,
    hreflang: 0,
    canonical: 0,
    ogUrl: 0,
    jsonLd: 0,
  };

  const xDefaultResult = replaceTagAttr(
    updated,
    /<link\b[^>]*rel=["'][^"']*\balternate\b[^"']*["'][^>]*hreflang=["']x-default["'][^>]*>/gi,
    "href",
    finalUrl,
  );
  updated = xDefaultResult.content;
  stats.hreflang += xDefaultResult.count;

  const arSaResult = replaceTagAttr(
    updated,
    /<link\b[^>]*rel=["'][^"']*\balternate\b[^"']*["'][^>]*hreflang=["']ar-SA["'][^>]*>/gi,
    "href",
    finalUrl,
  );
  updated = arSaResult.content;
  stats.hreflang += arSaResult.count;

  const canonicalResult = replaceTagAttr(
    updated,
    /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
    "href",
    finalUrl,
  );
  updated = canonicalResult.content;
  stats.canonical += canonicalResult.count;

  const ogUrlResult = replaceTagAttr(
    updated,
    /<meta\b[^>]*property=["']og:url["'][^>]*>/i,
    "content",
    finalUrl,
  );
  updated = ogUrlResult.content;
  stats.ogUrl += ogUrlResult.count;

  const jsonLdResult = normalizeJsonLdBlocks(updated, finalUrl);
  updated = jsonLdResult.content;
  stats.jsonLd += jsonLdResult.count;

  if (updated !== original) {
    await fs.writeFile(absPath, updated);
  }

  results.push(stats);
}

const changedFiles = results.filter((item) => item.hreflang || item.canonical || item.ogUrl || item.jsonLd);
const reportLines = [
  "# Semrush Incorrect Hreflang Fix Report",
  `**Date:** ${DATE_STAMP}`,
  "",
  "## Summary",
  `- Source pages processed: \`${results.length}\``,
  `- Files changed: \`${changedFiles.length}\``,
  `- Hreflang tags updated: \`${results.reduce((sum, item) => sum + item.hreflang, 0)}\``,
  `- Canonical tags updated: \`${results.reduce((sum, item) => sum + item.canonical, 0)}\``,
  `- og:url tags updated: \`${results.reduce((sum, item) => sum + item.ogUrl, 0)}\``,
  `- JSON-LD blocks updated: \`${results.reduce((sum, item) => sum + item.jsonLd, 0)}\``,
  "",
  "## Changed Files",
  ...changedFiles.map(
    (item) =>
      `- \`${item.relPath}\` -> \`${item.finalUrl}\` (hreflang: ${item.hreflang}, canonical: ${item.canonical}, og:url: ${item.ogUrl}, json-ld: ${item.jsonLd})`,
  ),
];

await fs.writeFile(OUTPUT_REPORT, `${reportLines.join("\n")}\n`);

console.log(
  JSON.stringify(
    {
      processed: results.length,
      changed: changedFiles.length,
      report: OUTPUT_REPORT,
    },
    null,
    2,
  ),
);
