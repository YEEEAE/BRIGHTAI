#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const indexPath = path.join(root, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");

const navPattern = /<!-- Header \/ Navbar -->[\s\S]*?<div class="backdrop-overlay fixed inset-0 z-50 bg-black\/60 backdrop-blur-sm hidden"><\/div>/;
const navMatch = indexHtml.match(navPattern);

if (!navMatch) {
  throw new Error("Could not extract the canonical top bar block from index.html");
}

const canonicalNav = navMatch[0].trim();
const htmlFiles = execSync("rg --files -g '*.html'", { cwd: root, encoding: "utf8" })
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

const excluded = new Set(["new_index_part.html"]);

function findMatchingDivEnd(html, startIndex) {
  const openRe = /<div\b[^>]*>/gi;
  const closeRe = /<\/div>/gi;

  openRe.lastIndex = startIndex;
  const startTag = openRe.exec(html);
  if (!startTag || startTag.index !== startIndex) return -1;

  let depth = 1;
  let cursor = openRe.lastIndex;

  while (depth > 0) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;

    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);

    if (!nextClose) return -1;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = openRe.lastIndex;
    } else {
      depth -= 1;
      cursor = closeRe.lastIndex;
    }
  }

  return cursor;
}

function removeDivBlocksByClass(html, className) {
  const classRe = new RegExp(`<div\\b[^>]*class=(["'])[^"']*\\b${className}\\b[^"']*\\1[^>]*>`, "i");

  while (true) {
    const match = html.match(classRe);
    if (!match || match.index === undefined) break;

    const start = match.index;
    const end = findMatchingDivEnd(html, start);
    if (end === -1) break;

    html = html.slice(0, start) + html.slice(end);
  }

  return html;
}

function ensureHeadAsset(html, markerPattern, assetTag) {
  if (!/<\/head>/i.test(html)) return html;
  if (markerPattern.test(html)) return html;
  return html.replace(/<\/head>/i, `${assetTag}\n</head>`);
}

let updatedCount = 0;
let skippedCount = 0;

for (const file of htmlFiles) {
  if (excluded.has(file)) continue;

  const fullPath = path.join(root, file);
  let html = fs.readFileSync(fullPath, "utf8");
  const original = html;

  if (!/<body\b/i.test(html) || !/<\/head>/i.test(html)) {
    skippedCount += 1;
    continue;
  }

  // Remove previous nav-injection comment markers and old unified nav blocks.
  html = html.replace(/<!--\s*UNIFIED HEADER[^>]*-->\s*/gi, "");
  html = html.replace(/<!--\s*Header\s*\/\s*Navbar[^>]*-->\s*/gi, "");

  html = html.replace(/<header\b[^>]*\bid=(["'])main-header\1[^>]*>[\s\S]*?<\/header>\s*/gi, "");
  html = html.replace(/<header\b[^>]*class=(["'])[^"']*\bunified-nav\b[^"']*\1[^>]*>[\s\S]*?<\/header>\s*/gi, "");
  html = html.replace(/<nav\b[^>]*class=(["'])[^"']*\bunified-nav\b[^"']*\1[^>]*>[\s\S]*?<\/nav>\s*/gi, "");

  html = removeDivBlocksByClass(html, "mobile-menu-drawer");
  html = html.replace(/<div\b[^>]*class=(["'])[^"']*\bbackdrop-overlay\b[^"']*\1[^>]*>\s*<\/div>\s*/gi, "");

  html = html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${canonicalNav}\n`);

  // Ensure shared assets needed for identical top bar styling + dropdown behavior.
  html = ensureHeadAsset(
    html,
    /\/frontend\/css\/unified-nav-search\.css/i,
    '<link href="/frontend/css/unified-nav-search.css" rel="stylesheet"/>'
  );
  html = ensureHeadAsset(
    html,
    /\/frontend\/css\/tailwind\.local\.min\.css/i,
    '<link href="/frontend/css/tailwind.local.min.css" rel="stylesheet"/>'
  );
  html = ensureHeadAsset(
    html,
    /\/frontend\/js\/vendor\/iconify\.min\.js/i,
    '<script defer="" src="/frontend/js/vendor/iconify.min.js"></script>'
  );
  html = ensureHeadAsset(
    html,
    /\/frontend\/js\/vendor\/iconify-icon\.min\.js/i,
    '<script defer="" src="/frontend/js/vendor/iconify-icon.min.js"></script>'
  );
  html = ensureHeadAsset(
    html,
    /\/frontend\/js\/navigation\.js/i,
    '<script defer="" src="/frontend/js/navigation.js"></script>'
  );

  if (html !== original) {
    fs.writeFileSync(fullPath, html);
    updatedCount += 1;
  }
}

console.log(`Updated ${updatedCount} HTML files. Skipped ${skippedCount} files.`);
