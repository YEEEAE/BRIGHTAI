#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import {
  findCounterpartRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";
import {
  HIGH_CONFIDENCE_CORE_FILES,
  SITEMAP_REQUIRED_SERVICE_PAGE_FILES,
} from "./high-confidence-sitemap-config.mjs";
import {
  buildLocalFileCandidates,
  decodePathFromLoc,
  extractCanonicalHref,
  hasMetaRefresh,
  hasNoindexDirective,
} from "./sitemap-audit-utils.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const OG_IMAGE_URL = `${BASE_URL}/assets/images/Gemini.png`;

function buildRequiredHreflangForFile(file, lowerPathMap) {
  const selfUrl = relPathToCanonical(file, BASE_URL);
  const counterpart = findCounterpartRelPath(file, lowerPathMap);
  const counterpartUrl = counterpart ? relPathToCanonical(counterpart, BASE_URL) : null;
  const isEnglish = /-en\.html$/i.test(file);

  if (isEnglish) {
    if (counterpartUrl) {
      return {
        "ar-SA": counterpartUrl,
        "en-SA": selfUrl,
        "x-default": counterpartUrl,
      };
    }
    return {
      "en-SA": selfUrl,
      "x-default": selfUrl,
    };
  }

  if (counterpartUrl) {
    return {
      "ar-SA": selfUrl,
      "en-SA": counterpartUrl,
      "x-default": selfUrl,
    };
  }

  return {
    "ar-SA": selfUrl,
    "x-default": selfUrl,
  };
}

const SERVICE_PAGE_MAP = new Map(SITEMAP_REQUIRED_SERVICE_PAGE_FILES.map((file) => [file.toLowerCase(), file]));
const HREFLANG_PAGE_FILES = [...new Set(HIGH_CONFIDENCE_CORE_FILES)];
const HREFLANG_PAGE_MAP = new Map(HREFLANG_PAGE_FILES.map((file) => [file.toLowerCase(), file]));
const HREFLANG_PAGES = HREFLANG_PAGE_FILES.map((file) => ({
  file,
  canonical: relPathToCanonical(file, BASE_URL),
  hreflang: buildRequiredHreflangForFile(file, HREFLANG_PAGE_MAP),
}));
const SERVICE_PAGES = SITEMAP_REQUIRED_SERVICE_PAGE_FILES.map((file) => ({
  file,
  canonical: relPathToCanonical(file, BASE_URL),
  hreflang: buildRequiredHreflangForFile(file, SERVICE_PAGE_MAP),
}));

const SITEMAP_BANNED_PATTERNS = [
  /\/frontend\/pages\/interview\//,
  /\/frontend\/pages\/botAI\//,
  /\.doc\.html$/,
  /%20/,
  /_/,
];

function countMatches(input, regex) {
  const matches = input.match(regex);
  return matches ? matches.length : 0;
}

function extractLinksByRel(html, rel) {
  const links = [];
  const regex = /<link\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const tag = match[0];
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relMatch) continue;
    if (relMatch[1].toLowerCase() !== rel.toLowerCase()) continue;
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const hreflangMatch = tag.match(/\bhreflang\s*=\s*["']([^"']+)["']/i);
    links.push({ href: hrefMatch[1], hreflang: hreflangMatch ? hreflangMatch[1] : null, tag });
  }
  return links;
}

function extractMetaValues(html, key, attr = "name") {
  const values = [];
  const regex = /<meta\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const tag = match[0];
    const keyMatch = tag.match(new RegExp(`\\b${attr}\\s*=\\s*["']([^"']+)["']`, "i"));
    if (!keyMatch) continue;
    if (keyMatch[1].toLowerCase() !== key.toLowerCase()) continue;
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    values.push(contentMatch ? contentMatch[1] : "");
  }
  return values;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function collectTypesFromJsonLd(node, out = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypesFromJsonLd(item, out);
    return out;
  }

  if (node && typeof node === "object") {
    if (Object.hasOwn(node, "@type")) {
      const t = node["@type"];
      if (Array.isArray(t)) {
        for (const item of t) {
          if (typeof item === "string") out.add(item);
        }
      } else if (typeof t === "string") {
        out.add(t);
      }
    }

    for (const value of Object.values(node)) {
      collectTypesFromJsonLd(value, out);
    }
  }

  return out;
}

async function readFileSafe(file) {
  try {
    const content = await fs.readFile(path.join(ROOT, file), "utf8");
    return { ok: true, content };
  } catch (error) {
    return { ok: false, error };
  }
}

function validateCanonicalAndHreflang(html, page, result) {
  const canonicalLinks = extractLinksByRel(html, "canonical");
  if (canonicalLinks.length !== 1) {
    result.errors.push(`Expected 1 canonical link, found ${canonicalLinks.length}.`);
  } else if (
    canonicalLinks[0].href !== page.canonical ||
    normalizeSiteUrl(canonicalLinks[0].href, BASE_URL) !== page.canonical
  ) {
    result.errors.push(
      `Canonical mismatch. Expected '${page.canonical}', found '${canonicalLinks[0].href}'.`
    );
  }

  const alternateLinks = extractLinksByRel(html, "alternate").filter((x) => x.hreflang);
  const expectedHreflangs = page.hreflang;
  const expectedKeys = Object.keys(expectedHreflangs);

  if (alternateLinks.length !== expectedKeys.length) {
    result.errors.push(
      `Expected ${expectedKeys.length} hreflang links, found ${alternateLinks.length}.`
    );
  }

  for (const key of expectedKeys) {
    const hit = alternateLinks.filter((x) => x.hreflang === key);
    if (hit.length !== 1) {
      result.errors.push(`Expected exactly one hreflang '${key}', found ${hit.length}.`);
      continue;
    }
    if (
      hit[0].href !== expectedHreflangs[key] ||
      normalizeSiteUrl(hit[0].href, BASE_URL) !== expectedHreflangs[key]
    ) {
      result.errors.push(
        `hreflang '${key}' mismatch. Expected '${expectedHreflangs[key]}', found '${hit[0].href}'.`
      );
    }
  }

  const extraHreflangs = alternateLinks
    .map((x) => x.hreflang)
    .filter((x) => !Object.hasOwn(expectedHreflangs, x));
  if (extraHreflangs.length > 0) {
    result.errors.push(`Unexpected hreflang values: ${extraHreflangs.join(", ")}.`);
  }
}

async function checkHreflangPage(page) {
  const result = {
    file: page.file,
    errors: [],
    warnings: [],
  };

  const fileRead = await readFileSafe(page.file);
  if (!fileRead.ok) {
    result.errors.push("File is missing or unreadable.");
    return result;
  }

  validateCanonicalAndHreflang(fileRead.content, page, result);
  return result;
}

async function checkServicePage(page) {
  const result = {
    file: page.file,
    errors: [],
    warnings: [],
  };

  const fileRead = await readFileSafe(page.file);
  if (!fileRead.ok) {
    result.errors.push("File is missing or unreadable.");
    return result;
  }

  const html = fileRead.content;
  validateCanonicalAndHreflang(html, page, result);

  const ogImageValues = extractMetaValues(html, "og:image", "property");
  if (ogImageValues.length !== 1) {
    result.errors.push(`Expected 1 og:image meta, found ${ogImageValues.length}.`);
  } else if (ogImageValues[0] !== OG_IMAGE_URL) {
    result.errors.push(
      `og:image mismatch. Expected '${OG_IMAGE_URL}', found '${ogImageValues[0]}'.`
    );
  }

  const ogImageAltValues = extractMetaValues(html, "og:image:alt", "property");
  if (ogImageAltValues.length !== 1) {
    result.errors.push(`Expected 1 og:image:alt meta, found ${ogImageAltValues.length}.`);
  } else if (!ogImageAltValues[0].trim()) {
    result.errors.push("og:image:alt is empty.");
  }

  const twitterImageValues = extractMetaValues(html, "twitter:image", "name");
  if (twitterImageValues.length !== 1) {
    result.errors.push(`Expected 1 twitter:image meta, found ${twitterImageValues.length}.`);
  } else if (twitterImageValues[0] !== OG_IMAGE_URL) {
    result.errors.push(
      `twitter:image mismatch. Expected '${OG_IMAGE_URL}', found '${twitterImageValues[0]}'.`
    );
  }

  const twitterImageAltValues = extractMetaValues(html, "twitter:image:alt", "name");
  if (twitterImageAltValues.length !== 1) {
    result.errors.push(
      `Expected 1 twitter:image:alt meta, found ${twitterImageAltValues.length}.`
    );
  } else if (!twitterImageAltValues[0].trim()) {
    result.errors.push("twitter:image:alt is empty.");
  }

  const jsonLdBlocks = extractJsonLdBlocks(html);
  if (jsonLdBlocks.length === 0) {
    result.errors.push("No JSON-LD blocks found.");
  }

  const allTypes = new Set();
  for (const [index, block] of jsonLdBlocks.entries()) {
    try {
      const parsed = JSON.parse(block);
      collectTypesFromJsonLd(parsed, allTypes);
    } catch (error) {
      result.errors.push(`Invalid JSON-LD block at index ${index}: ${error.message}`);
    }
  }

  if (!allTypes.has("BreadcrumbList")) {
    result.errors.push("Missing BreadcrumbList schema.");
  }

  if (!allTypes.has("LocalBusiness")) {
    result.errors.push("Missing LocalBusiness schema.");
  }

  return result;
}

async function checkSitemap() {
  const result = {
    errors: [],
    warnings: [],
    summary: {
      urls: 0,
    },
  };

  let xml;
  try {
    xml = await fs.readFile(SITEMAP_PATH, "utf8");
  } catch (error) {
    result.errors.push(`sitemap.xml is missing or unreadable: ${error.message}`);
    return result;
  }

  const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  result.summary.urls = locMatches.length;

  if (locMatches.length === 0) {
    result.errors.push("sitemap.xml contains no <loc> entries.");
    return result;
  }

  const seen = new Set();
  for (const loc of locMatches) {
    if (!loc.startsWith(`${BASE_URL}/`) && loc !== BASE_URL + "/") {
      result.errors.push(`Sitemap URL has unexpected host/base: ${loc}`);
      continue;
    }

    if (loc.includes("?")) {
      result.errors.push(`Parameterized URL in sitemap is forbidden: ${loc}`);
      continue;
    }

    const normalizedLoc = normalizeSiteUrl(loc, BASE_URL);
    if (!normalizedLoc || normalizedLoc !== loc) {
      result.errors.push(`Non-canonical URL in sitemap is forbidden: ${loc}`);
      continue;
    }

    if (seen.has(loc)) {
      result.errors.push(`Duplicate URL in sitemap: ${loc}`);
      continue;
    }
    seen.add(loc);

    for (const pattern of SITEMAP_BANNED_PATTERNS) {
      if (pattern.test(loc)) {
        result.errors.push(`Banned URL pattern in sitemap: ${loc}`);
        break;
      }
    }

    const decodedPath = decodePathFromLoc(loc);
    if (!decodedPath) {
      result.errors.push(`Invalid URL in sitemap: ${loc}`);
      continue;
    }

    if (decodedPath === "/") {
      continue;
    }

    const localCandidates = buildLocalFileCandidates(decodedPath);
    let resolvedFile = null;
    for (const candidate of localCandidates) {
      try {
        const stat = await fs.stat(path.join(ROOT, candidate));
        if (!stat.isFile()) {
          continue;
        }
        resolvedFile = candidate;
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (!resolvedFile) {
      const primary = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
      result.errors.push(`Sitemap points to a missing file: ${loc} -> ${primary}`);
      continue;
    }

    let html;
    try {
      html = await fs.readFile(path.join(ROOT, resolvedFile), "utf8");
    } catch (error) {
      result.errors.push(`Unable to read sitemap target file: ${loc} -> ${resolvedFile} (${error.message})`);
      continue;
    }

    if (hasMetaRefresh(html)) {
      result.errors.push(`Redirect-like page is forbidden in sitemap: ${loc} -> ${resolvedFile}`);
    }

    if (hasNoindexDirective(html)) {
      result.errors.push(`Noindex page is forbidden in sitemap: ${loc} -> ${resolvedFile}`);
    }

    const canonicalHref = extractCanonicalHref(html);
    const normalizedCanonical = normalizeSiteUrl(canonicalHref, BASE_URL);
    if (!normalizedCanonical || normalizedCanonical !== loc) {
      result.errors.push(
        `Sitemap URL must self-canonicalize: ${loc} -> ${resolvedFile} (found '${canonicalHref || "missing"}')`
      );
    }
  }

  for (const page of SERVICE_PAGES) {
    if (!seen.has(page.canonical)) {
      result.errors.push(`Missing service page in sitemap: ${page.canonical}`);
    }
  }

  return result;
}

async function main() {
  const hreflangResults = [];
  for (const page of HREFLANG_PAGES) {
    hreflangResults.push(await checkHreflangPage(page));
  }

  const serviceResults = [];
  for (const page of SERVICE_PAGES) {
    serviceResults.push(await checkServicePage(page));
  }

  const sitemapResult = await checkSitemap();

  const combinedPageResults = [...hreflangResults, ...serviceResults];
  const pageErrors = combinedPageResults.flatMap((r) =>
    r.errors.map((message) => `[${r.file}] ${message}`)
  );
  const pageWarnings = combinedPageResults.flatMap((r) =>
    r.warnings.map((message) => `[${r.file}] ${message}`)
  );

  const errors = [...pageErrors, ...sitemapResult.errors.map((x) => `[sitemap] ${x}`)];
  const warnings = [...pageWarnings, ...sitemapResult.warnings.map((x) => `[sitemap] ${x}`)];

  const passedHreflangPages = hreflangResults.filter((r) => r.errors.length === 0).length;
  const passedServicePages = serviceResults.filter((r) => r.errors.length === 0).length;

  console.log(`SEO CI CHECK`);
  console.log(`- Hreflang pages checked: ${hreflangResults.length}`);
  console.log(`- Hreflang pages passed: ${passedHreflangPages}`);
  console.log(`- Service pages checked: ${serviceResults.length}`);
  console.log(`- Service pages passed: ${passedServicePages}`);
  console.log(`- Sitemap URLs: ${sitemapResult.summary.urls}`);
  console.log(`- Errors: ${errors.length}`);
  console.log(`- Warnings: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log("\nSEO CI check passed.");
}

main().catch((error) => {
  console.error(`Fatal error: ${error?.stack || error}`);
  process.exit(1);
});
