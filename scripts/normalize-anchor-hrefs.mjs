#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://brightai.site";
const HTML_GLOB = "**/*.html";
const IGNORE_PATTERNS = [
  "**/.git/**",
  "**/node_modules/**",
  "**/.netlify/**",
  "**/.netlify-publish/**",
  "backend/**",
  "brightai-platform/**",
  "docs/**",
  "scripts/**",
  "تقارير للمشروع/**",
  "brightai_orchestrator_output/**"
];

const ANCHOR_HREF_REGEX = /(<a\b[^>]*\bhref\s*=\s*)(["'])([^"']+)(\2)/gi;
const TRACKING_PARAM_NAMES = new Set(["gclid", "fbclid", "msclkid"]);

function isTrackingParam(name) {
  const lower = String(name || "").toLowerCase();
  return lower.startsWith("utm_") || TRACKING_PARAM_NAMES.has(lower);
}

function normalizeSitePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const collapsed = pathname.replace(/\/{2,}/g, "/");
  const normalized = path.posix.normalize(collapsed);
  if (!normalized || normalized === ".") {
    return "/";
  }

  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  if (withLeadingSlash === "/index.html") {
    return "/";
  }

  if (withLeadingSlash.endsWith("/index.html")) {
    return withLeadingSlash.replace(/\/index\.html$/i, "") || "/";
  }

  if (withLeadingSlash.endsWith(".html")) {
    return withLeadingSlash.replace(/\.html$/i, "") || "/";
  }

  return withLeadingSlash === "/" ? "/" : withLeadingSlash.replace(/\/+$/, "") || "/";
}

function normalizeInternalHref(rawHref) {
  if (!rawHref) {
    return null;
  }

  const value = rawHref.trim();
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(value, `${SITE_ORIGIN}/`);
  } catch {
    return null;
  }

  if (parsed.origin.toLowerCase() !== SITE_ORIGIN) {
    return null;
  }

  const keptSearch = new URLSearchParams();
  for (const [name, paramValue] of parsed.searchParams.entries()) {
    if (!isTrackingParam(name)) {
      keptSearch.append(name, paramValue);
    }
  }

  const normalizedPath = normalizeSitePath(parsed.pathname || "/");
  const normalizedSearch = keptSearch.toString();
  return `${normalizedPath}${normalizedSearch ? `?${normalizedSearch}` : ""}${parsed.hash || ""}`;
}

const files = await glob(HTML_GLOB, {
  cwd: ROOT,
  nodir: true,
  ignore: IGNORE_PATTERNS
});

let changedFiles = 0;
let changedAnchors = 0;

for (const relativeFile of files.sort()) {
  const absoluteFile = path.join(ROOT, relativeFile);
  const originalContent = await fs.readFile(absoluteFile, "utf8");

  let fileChanges = 0;
  const updatedContent = originalContent.replace(ANCHOR_HREF_REGEX, (fullMatch, prefix, quote, hrefValue, suffix) => {
    const normalizedHref = normalizeInternalHref(hrefValue);
    if (!normalizedHref || normalizedHref === hrefValue) {
      return fullMatch;
    }

    fileChanges += 1;
    return `${prefix}${quote}${normalizedHref}${suffix}`;
  });

  if (updatedContent !== originalContent) {
    await fs.writeFile(absoluteFile, updatedContent, "utf8");
    changedFiles += 1;
    changedAnchors += fileChanges;
  }
}

console.log(`تم تحديث ${changedAnchors} رابط <a href> داخل ${changedFiles} ملف.`);
