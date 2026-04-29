#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildPublicUrlRegistry,
  findCounterpartRelPath,
  normalizeRelPath,
  relPathToCanonical,
} from "./seo-url-map.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "coverage",
  "dist",
  "build",
  "reports",
  "tmp",
]);

const mode = process.argv.includes("--fix") ? "fix" : "audit";

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function walkHtmlFiles(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        files.push(...await walkHtmlFiles(fullPath));
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractHead(html) {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  return match ? match[1] : "";
}

function extractCanonical(head) {
  return head.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
}

function extractAlternates(head) {
  const alternates = [];
  const pattern = /<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = pattern.exec(head))) {
    alternates.push({ code: match[1], href: match[2] });
  }
  return alternates;
}

function sameAlternates(current, expected) {
  if (current.length !== expected.length) return false;
  const currentMap = new Map(current.map((item) => [item.code, item.href]));
  return expected.every((item) => currentMap.get(item.code) === item.href);
}

function buildExpectedAlternates(relPath, registry, lowerPathMap) {
  const selfUrl = registry.canonicalByRelPath.get(relPath);
  if (!selfUrl) return [];

  const counterpart = findCounterpartRelPath(relPath, lowerPathMap, {
    allowedRelPaths: registry.publicRelPaths,
  });
  const counterpartUrl = counterpart ? registry.canonicalByRelPath.get(counterpart) : null;
  const isEnglish = relPath.toLowerCase().startsWith("en/")
    || /-en\.html$/i.test(relPath)
    || /-en\/index\.html$/i.test(relPath);

  if (!counterpartUrl) {
    return isEnglish
      ? [
          { code: "en-SA", href: selfUrl },
          { code: "x-default", href: selfUrl },
        ]
      : [
          { code: "ar-SA", href: selfUrl },
          { code: "x-default", href: selfUrl },
        ];
  }

  if (isEnglish) {
    return [
      { code: "ar-SA", href: counterpartUrl },
      { code: "en-SA", href: selfUrl },
      { code: "x-default", href: counterpartUrl },
    ];
  }

  return [
    { code: "ar-SA", href: selfUrl },
    { code: "en-SA", href: counterpartUrl },
    { code: "x-default", href: selfUrl },
  ];
}

function renderAlternates(alternates) {
  return alternates
    .map((item) => `<link rel="alternate" hreflang="${item.code}" href="${item.href}" />`)
    .join("\n");
}

function replaceAlternates(html, expected) {
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return html;

  const head = headMatch[1];
  const withoutAlternates = head.replace(/\n?\s*<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>\s*/gi, "\n");
  const alternateBlock = renderAlternates(expected);
  const canonicalPattern = /(<link\b[^>]*rel=["']canonical["'][^>]*>\s*)/i;
  const nextHead = canonicalPattern.test(withoutAlternates)
    ? withoutAlternates.replace(canonicalPattern, `$1\n${alternateBlock}\n`)
    : `\n${alternateBlock}\n${withoutAlternates}`;

  return html.slice(0, headMatch.index)
    + headMatch[0].replace(head, nextHead)
    + html.slice(headMatch.index + headMatch[0].length);
}

async function main() {
  const htmlFiles = await walkHtmlFiles(ROOT);
  const relPaths = htmlFiles.map((file) => normalizeRelPath(path.relative(ROOT, file)));
  const lowerPathMap = new Map(relPaths.map((relPath) => [relPath.toLowerCase(), relPath]));
  const registry = buildPublicUrlRegistry(relPaths, BASE_URL);
  const sitemapAlternatesByLoc = await readSitemapAlternates();
  const changed = [];
  const issues = [];
  const paired = [];

  for (const relPath of [...registry.publicRelPaths].sort((a, b) => a.localeCompare(b, "en"))) {
    const fullPath = path.join(ROOT, relPath);
    const html = await fs.readFile(fullPath, "utf8");
    const head = extractHead(html);
    const canonical = extractCanonical(head);
    const expectedCanonical = relPathToCanonical(relPath, BASE_URL);
    const current = extractAlternates(head);
    const expected = buildExpectedAlternates(relPath, registry, lowerPathMap);
    const hasCounterpart = expected.some((item) => item.code === "ar-SA")
      && expected.some((item) => item.code === "en-SA");
    const sitemapAlternates = sitemapAlternatesByLoc.get(expectedCanonical) || [];

    if (hasCounterpart) {
      paired.push({ relPath, expectedCanonical, expected });
      for (const required of ["ar-SA", "en-SA", "x-default"]) {
        if (!expected.some((item) => item.code === required)) {
          issues.push({ relPath, type: "missing_expected_code", detail: required });
        }
      }
    }

    if (canonical && canonical !== expectedCanonical) {
      issues.push({ relPath, type: "canonical_mismatch", detail: `${canonical} != ${expectedCanonical}` });
    }

    if (!sameAlternates(current, expected)) {
      issues.push({
        relPath,
        type: "html_hreflang_mismatch",
        detail: `current=${JSON.stringify(current)} expected=${JSON.stringify(expected)}`,
      });
      if (mode === "fix") {
        await fs.writeFile(fullPath, replaceAlternates(html, expected), "utf8");
        changed.push(relPath);
      }
    }

    if (sitemapAlternates.length && !sameAlternates(sitemapAlternates, expected)) {
      issues.push({
        relPath,
        type: "sitemap_hreflang_mismatch",
        detail: `sitemap=${JSON.stringify(sitemapAlternates)} expected=${JSON.stringify(expected)}`,
      });
    }

    for (const item of current) {
      if (!["ar-SA", "en-SA", "x-default"].includes(item.code)) {
        issues.push({ relPath, type: "invalid_hreflang_code", detail: item.code });
      }
    }
  }

  process.stdout.write(JSON.stringify({
    mode,
    scannedPublicPages: registry.publicRelPaths.size,
    pairedPages: paired.length,
    changedPages: changed,
    issueCount: issues.length,
    issues,
  }, null, 2));
  process.stdout.write("\n");
}

async function readSitemapAlternates() {
  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const alternatesByLoc = new Map();
  let xml = "";
  try {
    xml = await fs.readFile(sitemapPath, "utf8");
  } catch {
    return alternatesByLoc;
  }

  const urlPattern = /<url>([\s\S]*?)<\/url>/gi;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(xml))) {
    const block = urlMatch[1];
    const loc = block.match(/<loc>([^<]+)<\/loc>/i)?.[1] || "";
    const alternates = [];
    const altPattern = /<xhtml:link\b[^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
    let altMatch;
    while ((altMatch = altPattern.exec(block))) {
      alternates.push({ code: altMatch[1], href: altMatch[2] });
    }
    if (loc) {
      alternatesByLoc.set(loc, alternates.map((item) => ({
        code: item.code,
        href: item.href.replace(/&amp;/g, "&"),
      })));
    }
  }

  return alternatesByLoc;
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
