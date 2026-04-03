#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { normalizeSiteUrl, relPathToCanonical } from "./seo-url-map.mjs";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://brightai.site";
const HTML_GLOB = "**/*.html";
const IGNORE_PATTERNS = [
  "**/.git/**",
  "**/node_modules/**",
  "backend/**",
  "brightai-platform/**",
  "scripts/**",
  "reports/**",
  "brightai_orchestrator_output/**"
];

const ANCHOR_HREF_REGEX = /(<a\b[^>]*\bhref\s*=\s*)(["'])([^"']+)(\2)/gi;
const STRUCTURED_DATA_URL_REGEX = /(\"(?:url|item)\"\s*:\s*)(["'])([^"']+)(\2)/gi;
const TRACKING_PARAM_NAMES = new Set(["gclid", "fbclid", "msclkid"]);

function isTrackingParam(name) {
  const lower = String(name || "").toLowerCase();
  return lower.startsWith("utm_") || TRACKING_PARAM_NAMES.has(lower);
}

function toRelativeSiteUrl(absoluteUrl) {
  const parsed = new URL(absoluteUrl);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function resolveCanonicalAbsoluteUrl(rawValue) {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(trimmed, `${SITE_ORIGIN}/`);
  } catch {
    return null;
  }

  if (parsed.origin.toLowerCase() !== SITE_ORIGIN) {
    return null;
  }

  const trimmedPath = (parsed.pathname || "/").replace(/^\/+/, "");
  let canonicalAbsolute = null;

  if (trimmedPath) {
    const directCanonical = relPathToCanonical(trimmedPath);
    if (directCanonical) {
      canonicalAbsolute = directCanonical;
    } else if (trimmedPath.startsWith("frontend/pages/") && !path.posix.extname(trimmedPath)) {
      canonicalAbsolute = relPathToCanonical(`${trimmedPath}.html`);
    }
  }

  if (!canonicalAbsolute) {
    canonicalAbsolute = normalizeSiteUrl(parsed.toString(), SITE_ORIGIN);
  }

  if (!canonicalAbsolute) {
    return null;
  }

  const keptSearch = new URLSearchParams();
  for (const [name, paramValue] of parsed.searchParams.entries()) {
    if (!isTrackingParam(name)) {
      keptSearch.append(name, paramValue);
    }
  }

  const canonicalUrl = new URL(canonicalAbsolute);
  canonicalUrl.search = keptSearch.toString();
  canonicalUrl.hash = parsed.hash || "";
  return canonicalUrl.toString();
}

function normalizeInternalHref(rawHref) {
  if (!rawHref) {
    return null;
  }

  const value = rawHref.trim();
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return null;
  }

  const normalizedAbsolute = resolveCanonicalAbsoluteUrl(value);
  if (!normalizedAbsolute) {
    return null;
  }

  return toRelativeSiteUrl(normalizedAbsolute);
}

function normalizeStructuredDataUrl(rawValue) {
  if (!rawValue) {
    return null;
  }

  const value = rawValue.trim();
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return null;
  }

  const normalizedAbsolute = resolveCanonicalAbsoluteUrl(value);
  return normalizedAbsolute || null;
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
  let updatedContent = originalContent.replace(ANCHOR_HREF_REGEX, (fullMatch, prefix, quote, hrefValue, suffix) => {
    const normalizedHref = normalizeInternalHref(hrefValue);
    if (!normalizedHref || normalizedHref === hrefValue) {
      return fullMatch;
    }

    fileChanges += 1;
    return `${prefix}${quote}${normalizedHref}${suffix}`;
  });

  updatedContent = updatedContent.replace(STRUCTURED_DATA_URL_REGEX, (fullMatch, prefix, quote, value, suffix) => {
    const normalizedValue = normalizeStructuredDataUrl(value);
    if (!normalizedValue || normalizedValue === value) {
      return fullMatch;
    }

    fileChanges += 1;
    return `${prefix}${quote}${normalizedValue}${suffix}`;
  });

  if (updatedContent !== originalContent) {
    await fs.writeFile(absoluteFile, updatedContent, "utf8");
    changedFiles += 1;
    changedAnchors += fileChanges;
  }
}

console.log(`تم تحديث ${changedAnchors} رابط <a href> داخل ${changedFiles} ملف.`);
