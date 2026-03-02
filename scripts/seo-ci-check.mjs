#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const OG_IMAGE_URL = `${BASE_URL}/assets/images/Gemini.png`;

const SERVICE_PAGES = [
  {
    file: "smart-automation/index.html",
    canonical: `${BASE_URL}/smart-automation`,
    hreflang: {
      "ar-SA": `${BASE_URL}/smart-automation`,
      "x-default": `${BASE_URL}/smart-automation`,
    },
  },
  {
    file: "data-analysis/index.html",
    canonical: `${BASE_URL}/data-analysis`,
    hreflang: {
      "ar-SA": `${BASE_URL}/data-analysis`,
      "x-default": `${BASE_URL}/data-analysis`,
    },
  },
  {
    file: "ai-agent/index.html",
    canonical: `${BASE_URL}/ai-agent`,
    hreflang: {
      "ar-SA": `${BASE_URL}/ai-agent`,
      "x-default": `${BASE_URL}/ai-agent`,
    },
  },
  {
    file: "frontend/pages/smart-medical-archive/index.html",
    canonical: `${BASE_URL}/smart-medical-archive`,
    hreflang: {
      "ar-SA": `${BASE_URL}/smart-medical-archive`,
      "x-default": `${BASE_URL}/smart-medical-archive`,
    },
  },
  {
    file: "frontend/pages/ai-workflows/index.html",
    canonical: `${BASE_URL}/ai-workflows`,
    hreflang: {
      "ar-SA": `${BASE_URL}/ai-workflows`,
      "x-default": `${BASE_URL}/ai-workflows`,
    },
  },
  {
    file: "consultation/index.html",
    canonical: `${BASE_URL}/consultation`,
    hreflang: {
      "ar-SA": `${BASE_URL}/consultation`,
      "x-default": `${BASE_URL}/consultation`,
    },
  },
  {
    file: "machine-learning/index.html",
    canonical: `${BASE_URL}/machine-learning`,
    hreflang: {
      "ar-SA": `${BASE_URL}/machine-learning`,
      "x-default": `${BASE_URL}/machine-learning`,
    },
  },
  {
    file: "frontend/pages/ai-scolecs/index.html",
    canonical: `${BASE_URL}/ai-scolecs`,
    hreflang: {
      "ar-SA": `${BASE_URL}/ai-scolecs`,
      "x-default": `${BASE_URL}/ai-scolecs`,
    },
  },
  {
    file: "frontend/pages/docs/services-overview.html",
    canonical: `${BASE_URL}/docs/services-overview`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/services-overview`,
      "en-SA": `${BASE_URL}/docs/services-overview-en`,
      "x-default": `${BASE_URL}/docs/services-overview`,
    },
  },
  {
    file: "frontend/pages/docs/services-overview-en.html",
    canonical: `${BASE_URL}/docs/services-overview-en`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/services-overview`,
      "en-SA": `${BASE_URL}/docs/services-overview-en`,
      "x-default": `${BASE_URL}/docs/services-overview`,
    },
  },
  {
    file: "frontend/pages/docs/consultation.html",
    canonical: `${BASE_URL}/docs/consultation`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/consultation`,
      "en-SA": `${BASE_URL}/docs/consultation-en`,
      "x-default": `${BASE_URL}/docs/consultation`,
    },
  },
  {
    file: "frontend/pages/docs/consultation-en.html",
    canonical: `${BASE_URL}/docs/consultation-en`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/consultation`,
      "en-SA": `${BASE_URL}/docs/consultation-en`,
      "x-default": `${BASE_URL}/docs/consultation`,
    },
  },
  {
    file: "frontend/pages/docs/ai-agent.html",
    canonical: `${BASE_URL}/docs/ai-agent`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/ai-agent`,
      "en-SA": `${BASE_URL}/docs/ai-agent-en`,
      "x-default": `${BASE_URL}/docs/ai-agent`,
    },
  },
  {
    file: "frontend/pages/docs/ai-agent-en.html",
    canonical: `${BASE_URL}/docs/ai-agent-en`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/ai-agent`,
      "en-SA": `${BASE_URL}/docs/ai-agent-en`,
      "x-default": `${BASE_URL}/docs/ai-agent`,
    },
  },
  {
    file: "frontend/pages/docs/smart-automation.html",
    canonical: `${BASE_URL}/docs/smart-automation`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/smart-automation`,
      "en-SA": `${BASE_URL}/docs/smart-automation-en`,
      "x-default": `${BASE_URL}/docs/smart-automation`,
    },
  },
  {
    file: "frontend/pages/docs/smart-automation-en.html",
    canonical: `${BASE_URL}/docs/smart-automation-en`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/smart-automation`,
      "en-SA": `${BASE_URL}/docs/smart-automation-en`,
      "x-default": `${BASE_URL}/docs/smart-automation`,
    },
  },
  {
    file: "frontend/pages/docs/data-analysis.html",
    canonical: `${BASE_URL}/docs/data-analysis`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/data-analysis`,
      "en-SA": `${BASE_URL}/docs/data-analysis-en`,
      "x-default": `${BASE_URL}/docs/data-analysis`,
    },
  },
  {
    file: "frontend/pages/docs/data-analysis-en.html",
    canonical: `${BASE_URL}/docs/data-analysis-en`,
    hreflang: {
      "ar-SA": `${BASE_URL}/docs/data-analysis`,
      "en-SA": `${BASE_URL}/docs/data-analysis-en`,
      "x-default": `${BASE_URL}/docs/data-analysis`,
    },
  },
];

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

function decodePathFromLoc(loc) {
  try {
    const url = new URL(loc);
    return decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
}

function normalizeFsPath(candidate) {
  return candidate.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
}

function addCandidate(candidates, candidate) {
  const normalized = normalizeFsPath(candidate);
  if (!normalized || normalized === ".") return;
  candidates.add(normalized);
}

function buildLocalFileCandidates(decodedPath) {
  const localPath = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
  const candidates = new Set();

  if (localPath === "docs") {
    addCandidate(candidates, "docs.html");
    addCandidate(candidates, "frontend/pages/docs/docs.html");
  }

  if (localPath.startsWith("docs/")) {
    const slug = localPath.slice("docs/".length);
    addCandidate(candidates, path.join("frontend/pages/docs", `${slug}.html`));
  }

  if (localPath === "blog") {
    addCandidate(candidates, "blog/index.html");
  }

  if (localPath.startsWith("blog/automation/")) {
    const slug = localPath.slice("blog/automation/".length);
    addCandidate(candidates, path.join("frontend/pages/blog/automation", `${slug}.html`));
  }

  if (localPath.startsWith("blog/data-analytics/")) {
    const slug = localPath.slice("blog/data-analytics/".length);
    addCandidate(candidates, path.join("frontend/pages/blog/data-analytics", `${slug}.html`));
  }

  if (localPath.startsWith("blog/")) {
    const slug = localPath.slice("blog/".length);
    addCandidate(candidates, path.join("frontend/pages/blogger", `${slug}.html`));
  }

  if (localPath.startsWith("ai-bots/")) {
    const slug = localPath.slice("ai-bots/".length);
    addCandidate(candidates, path.join("frontend/pages/ai-bots", slug, "index.html"));
  }

  if (localPath.startsWith("try/")) {
    const slug = localPath.slice("try/".length);
    addCandidate(candidates, path.join("frontend/pages/try", slug, "index.html"));
  }

  if (localPath === "try") {
    addCandidate(candidates, "frontend/pages/try/index.html");
  }

  if (localPath === "demo") {
    addCandidate(candidates, "frontend/pages/demo/index.html");
  }

  if (localPath.startsWith("demo/resources/")) {
    const slug = localPath.slice("demo/resources/".length);
    addCandidate(candidates, path.join("frontend/pages/demo/resources", slug, "index.html"));
  }

  if (localPath.startsWith("demo/")) {
    const slug = localPath.slice("demo/".length);
    addCandidate(candidates, path.join("frontend/pages/demo", slug, "index.html"));
  }

  if (localPath === "interview") {
    addCandidate(candidates, "frontend/pages/interview/index.html");
  }

  if (localPath.startsWith("interview/pages/")) {
    const sub = localPath.slice("interview/pages/".length);
    addCandidate(candidates, path.join("frontend/pages/interview/pages", `${sub}.html`));
    addCandidate(candidates, path.join("frontend/pages/interview/pages", sub, "index.html"));
  }

  if (localPath.startsWith("interview/")) {
    const slug = localPath.slice("interview/".length);
    addCandidate(candidates, path.join("frontend/pages/interview", `${slug}.html`));
    addCandidate(candidates, path.join("frontend/pages/interview", slug, "index.html"));
  }

  if (localPath.startsWith("sectors/")) {
    const slug = localPath.slice("sectors/".length);
    addCandidate(candidates, path.join("frontend/pages/sectors", `${slug}.html`));
  }

  [
    "ai-workflows",
    "ai-scolecs",
    "smart-medical-archive",
    "job.MAISco",
    "privacy-cookies",
    "terms",
    "sitemap",
    "offline",
  ].forEach((slug) => {
    if (localPath === slug) {
      addCandidate(candidates, path.join("frontend/pages", slug, "index.html"));
    }
  });

  addCandidate(candidates, localPath);

  if (!path.extname(localPath)) {
    addCandidate(candidates, `${localPath}.html`);
    addCandidate(candidates, path.join(localPath, "index.html"));
  }

  if (!localPath.startsWith("frontend/pages/")) {
    addCandidate(candidates, path.join("frontend/pages", localPath));
    if (!path.extname(localPath)) {
      addCandidate(candidates, path.join("frontend/pages", `${localPath}.html`));
      addCandidate(candidates, path.join("frontend/pages", localPath, "index.html"));
    }
  }

  return Array.from(candidates);
}

async function readFileSafe(file) {
  try {
    const content = await fs.readFile(path.join(ROOT, file), "utf8");
    return { ok: true, content };
  } catch (error) {
    return { ok: false, error };
  }
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

  const canonicalLinks = extractLinksByRel(html, "canonical");
  if (canonicalLinks.length !== 1) {
    result.errors.push(`Expected 1 canonical link, found ${canonicalLinks.length}.`);
  } else if (canonicalLinks[0].href !== page.canonical) {
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
    if (hit[0].href !== expectedHreflangs[key]) {
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
    let resolved = false;
    for (const candidate of localCandidates) {
      try {
        await fs.access(path.join(ROOT, candidate));
        resolved = true;
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (!resolved) {
      const primary = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
      result.errors.push(`Sitemap points to a missing file: ${loc} -> ${primary}`);
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
  const pageResults = [];
  for (const page of SERVICE_PAGES) {
    pageResults.push(await checkServicePage(page));
  }

  const sitemapResult = await checkSitemap();

  const pageErrors = pageResults.flatMap((r) =>
    r.errors.map((message) => `[${r.file}] ${message}`)
  );
  const pageWarnings = pageResults.flatMap((r) =>
    r.warnings.map((message) => `[${r.file}] ${message}`)
  );

  const errors = [...pageErrors, ...sitemapResult.errors.map((x) => `[sitemap] ${x}`)];
  const warnings = [...pageWarnings, ...sitemapResult.warnings.map((x) => `[sitemap] ${x}`)];

  const passedPages = pageResults.filter((r) => r.errors.length === 0).length;

  console.log(`SEO CI CHECK`);
  console.log(`- Pages checked: ${pageResults.length}`);
  console.log(`- Pages passed: ${passedPages}`);
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
