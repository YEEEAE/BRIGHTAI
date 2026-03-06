#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import {
  encodeUrlPath,
  normalizeRelPath,
  relPathToCanonical,
} from "./seo-url-map.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const LEGACY_BASE_URL = "https://brightai.com.sa";
const HTML_PATTERNS = ["**/*.html", "**/*.HTML"];
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.netlify/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
];
const BLOG_ARTICLE_PREFIXES = [
  "frontend/pages/blogger/",
  "frontend/pages/blog/automation/",
  "frontend/pages/blog/data-analytics/",
];

const CANONICAL_REGEX = /<link[^>]*rel=["']canonical["'][^>]*>/i;
const OG_URL_REGEX = /<meta[^>]*property=["']og:url["'][^>]*>/i;
const HREFLANG_ALT_REGEX =
  /\s*<link\b[^>]*rel=["'][^"']*\balternate\b[^"']*["'][^>]*hreflang=["'][^"']+["'][^>]*>\s*/gi;
const JSON_LD_BLOCK_REGEX =
  /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi;

function stripTrailingSlash(value) {
  if (value === "/") return value;
  return value.replace(/\/+$/, "") || "/";
}

function normalizeSitePath(rawPath) {
  if (!rawPath) return "/";
  const collapsed = rawPath.replace(/\/{2,}/g, "/");
  const normalized = path.posix.normalize(collapsed);
  if (!normalized || normalized === ".") return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function sitePathToUrl(sitePath) {
  const normalizedPath = normalizeSitePath(sitePath);
  const encodedPath = encodeUrlPath(stripTrailingSlash(normalizedPath) || "/");
  return `${BASE_URL}${encodedPath}`;
}

function extractAttribute(tag, attrName) {
  const match = tag.match(new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() || null;
}

function normalizeToSitePath(rawValue, sourceFile) {
  if (!rawValue) return null;
  const value = rawValue.trim();
  if (!value) return null;

  try {
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value);
      return normalizeSitePath(parsed.pathname || "/");
    }
  } catch {
    // Fall through to local-path handling.
  }

  if (value.startsWith("/")) {
    return normalizeSitePath(value);
  }

  const sourceDir = path.posix.dirname(sourceFile.replace(/\\/g, "/"));
  return normalizeSitePath(path.posix.join("/", sourceDir, value));
}

function extractRedirectTargetPath(content, sourceFile) {
  const metaTags = [...content.matchAll(/<meta[^>]*>/gi)].map((match) => match[0]);
  for (const tag of metaTags) {
    if (!/http-equiv\s*=\s*["']refresh["']/i.test(tag)) continue;
    const refreshContent = extractAttribute(tag, "content");
    if (!refreshContent) continue;
    const urlMatch = refreshContent.match(/url\s*=\s*([^;]+)/i);
    if (!urlMatch) continue;
    const candidate = normalizeToSitePath(urlMatch[1], sourceFile);
    if (candidate) return candidate;
  }

  const jsRedirectMatch = content.match(/window\.location\.replace\(\s*["']([^"']+)["']\s*\)/i);
  if (jsRedirectMatch?.[1]) {
    return normalizeToSitePath(jsRedirectMatch[1], sourceFile);
  }

  return null;
}

function insertIntoHead(content, tag) {
  const headOpen = content.match(/<head[^>]*>/i);
  if (!headOpen || headOpen.index == null) {
    return `${tag}\n${content}`;
  }
  const insertAt = headOpen.index + headOpen[0].length;
  return `${content.slice(0, insertAt)}\n${tag}${content.slice(insertAt)}`;
}

function upsertTag(content, regex, tag) {
  if (regex.test(content)) {
    return content.replace(regex, tag);
  }
  return insertIntoHead(content, tag);
}

function replaceAllLiteral(content, fromValue, toValue) {
  if (!fromValue || fromValue === toValue || !content.includes(fromValue)) {
    return { content, count: 0 };
  }

  const parts = content.split(fromValue);
  return {
    content: parts.join(toValue),
    count: parts.length - 1,
  };
}

function isBlogArticleRelPath(relPath) {
  return BLOG_ARTICLE_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

function getTypeTokens(node) {
  const raw = node?.["@type"];
  if (Array.isArray(raw)) return raw.filter((value) => typeof value === "string");
  if (typeof raw === "string") return [raw];
  return [];
}

function normalizeAssetUrl(rawValue) {
  if (typeof rawValue !== "string" || !rawValue.trim()) return rawValue;
  const value = rawValue.trim();

  const knownAssets = [
    "Gemini.png",
    "brightai-og-placeholder.png",
  ];

  for (const assetName of knownAssets) {
    if (new RegExp(`${assetName.replace(".", "\\.")}$`, "i").test(value)) {
      return `${BASE_URL}/assets/images/${assetName}`;
    }
  }

  if (/blog-default\.jpg$/i.test(value)) {
    return `${BASE_URL}/assets/images/Gemini.png`;
  }

  if (/^https?:\/\/brightai\.(?:site|com\.sa)\/(?:\.\.\/)+assets\//i.test(value)) {
    return value.replace(
      /^https?:\/\/brightai\.(?:site|com\.sa)\/(?:\.\.\/)+assets\//i,
      `${BASE_URL}/assets/`
    );
  }

  if (/^https?:\/\/brightai\.(?:site|com\.sa)\/frontend\/assets\//i.test(value)) {
    return value.replace(
      /^https?:\/\/brightai\.(?:site|com\.sa)\/frontend\/assets\//i,
      `${BASE_URL}/assets/`
    );
  }

  if (/^https?:\/\/brightai\.site\/\/assets\//i.test(value)) {
    return value.replace(/^https?:\/\/brightai\.site\/\/assets\//i, `${BASE_URL}/assets/`);
  }

  return value;
}

function normalizeGenericSiteUrl(rawValue) {
  if (typeof rawValue !== "string" || !rawValue.trim()) return rawValue;

  const assetNormalized = normalizeAssetUrl(rawValue);
  if (assetNormalized !== rawValue) return assetNormalized;

  if (rawValue === LEGACY_BASE_URL) return `${BASE_URL}/`;
  if (rawValue === `${LEGACY_BASE_URL}/`) return `${BASE_URL}/`;
  if (rawValue === BASE_URL) return `${BASE_URL}/`;

  return rawValue.replaceAll(LEGACY_BASE_URL, BASE_URL);
}

function updateMainEntityOfPage(rawValue, articleCanonical) {
  if (!rawValue) {
    return {
      "@type": "WebPage",
      "@id": articleCanonical,
    };
  }

  if (typeof rawValue === "string") {
    return articleCanonical;
  }

  if (typeof rawValue === "object") {
    return {
      ...rawValue,
      "@id": articleCanonical,
    };
  }

  return rawValue;
}

function normalizeJsonLdNode(node, context) {
  if (Array.isArray(node)) {
    return node.map((item) => normalizeJsonLdNode(item, context));
  }

  if (!node || typeof node !== "object") {
    if (typeof node === "string") {
      return normalizeGenericSiteUrl(node);
    }
    return node;
  }

  const typeTokens = getTypeTokens(node);
  const normalized = {};

  for (const [key, rawValue] of Object.entries(node)) {
    if (key === "mainEntityOfPage") {
      normalized[key] = context.articleCanonical
        ? updateMainEntityOfPage(rawValue, context.articleCanonical)
        : normalizeJsonLdNode(rawValue, context);
      continue;
    }

    if (key === "image" || key === "logo" || key === "thumbnailUrl" || key === "contentUrl") {
      if (typeof rawValue === "string") {
        normalized[key] = normalizeAssetUrl(rawValue);
      } else {
        normalized[key] = normalizeJsonLdNode(rawValue, context);
      }
      continue;
    }

    if (key === "url" || key === "@id" || key === "item") {
      if (
        context.articleCanonical &&
        typeof rawValue === "string" &&
        (
          rawValue.includes("/blogger/") ||
          rawValue.includes("/blog/") ||
          rawValue.includes(LEGACY_BASE_URL)
        )
      ) {
        normalized[key] = context.articleCanonical;
      } else if (typeof rawValue === "string") {
        normalized[key] = normalizeGenericSiteUrl(rawValue);
      } else {
        normalized[key] = normalizeJsonLdNode(rawValue, context);
      }
      continue;
    }

    if (Array.isArray(rawValue)) {
      normalized[key] = rawValue.map((item) => normalizeJsonLdNode(item, context));
      continue;
    }

    if (rawValue && typeof rawValue === "object") {
      normalized[key] = normalizeJsonLdNode(rawValue, context);
      continue;
    }

    if (typeof rawValue === "string") {
      normalized[key] = normalizeGenericSiteUrl(rawValue);
      continue;
    }

    normalized[key] = rawValue;
  }

  const isArticle =
    typeTokens.includes("Article") ||
    typeTokens.includes("BlogPosting") ||
    typeTokens.includes("NewsArticle");

  if (context.articleCanonical && isArticle) {
    normalized.url = context.articleCanonical;
    normalized.mainEntityOfPage = updateMainEntityOfPage(
      normalized.mainEntityOfPage,
      context.articleCanonical
    );
  }

  if (typeTokens.includes("BreadcrumbList") && Array.isArray(normalized.itemListElement)) {
    const items = normalized.itemListElement.map((item) => (
      item && typeof item === "object" ? { ...item } : item
    ));

    if (items[0] && typeof items[0] === "object") {
      items[0].item = `${BASE_URL}/`;
    }

    if (items[1] && typeof items[1] === "object") {
      items[1].item = `${BASE_URL}/blog`;
    }

    const lastIndex = items.length - 1;
    if (context.articleCanonical && items[lastIndex] && typeof items[lastIndex] === "object") {
      items[lastIndex].item = context.articleCanonical;
    }

    normalized.itemListElement = items;
  }

  return normalized;
}

function rewriteJsonLdBlocks(content, context) {
  return content.replace(JSON_LD_BLOCK_REGEX, (full, openTag, body, closeTag) => {
    const source = body.trim();
    if (!source) return full;

    try {
      const parsed = JSON.parse(source);
      const updated = normalizeJsonLdNode(parsed, context);
      const serialized = JSON.stringify(updated, null, 2);
      if (serialized === source) return full;
      return `${openTag}\n${serialized}\n${closeTag}`;
    } catch {
      return full;
    }
  });
}

function buildArticleVariantRewrites(articleEntries) {
  const rewrites = [];

  for (const entry of articleEntries) {
    const basename = path.posix.basename(entry.relPath);
    const slug = basename.replace(/\.html$/i, "");
    const canonicalUrl = entry.canonicalUrl;
    const canonicalPath = new URL(canonicalUrl).pathname;
    const relativeVariants = new Set([
      `/blogger/${basename}`,
      `/blogger/${slug}`,
      encodeURI(`/blogger/${basename}`),
      encodeURI(`/blogger/${slug}`),
    ]);

    for (const variant of relativeVariants) {
      rewrites.push({ from: variant, to: canonicalPath });
      rewrites.push({ from: `${BASE_URL}${variant}`, to: canonicalUrl });
      rewrites.push({ from: `${LEGACY_BASE_URL}${variant}`, to: canonicalUrl });
    }
  }

  return rewrites.sort((a, b) => b.from.length - a.from.length);
}

function collectHtmlFiles() {
  return glob(HTML_PATTERNS, {
    cwd: ROOT,
    nodir: true,
    ignore: IGNORE_PATTERNS,
  }).then((files) => files.map(normalizeRelPath).sort((a, b) => a.localeCompare(b, "en")));
}

async function buildArticleEntries(files) {
  const entries = [];

  for (const relPath of files) {
    if (!isBlogArticleRelPath(relPath)) continue;

    const absolutePath = path.join(ROOT, relPath);
    const content = await fs.readFile(absolutePath, "utf8");
    const redirectTargetPath = extractRedirectTargetPath(content, relPath);
    const canonicalUrl = redirectTargetPath
      ? sitePathToUrl(redirectTargetPath)
      : relPathToCanonical(relPath, BASE_URL);

    if (!canonicalUrl) continue;

    entries.push({
      relPath,
      canonicalUrl,
    });
  }

  return entries;
}

async function main() {
  const htmlFiles = await collectHtmlFiles();
  const articleEntries = await buildArticleEntries(htmlFiles);
  const literalRewrites = buildArticleVariantRewrites(articleEntries);
  const articleCanonicalByFile = new Map(articleEntries.map((entry) => [entry.relPath, entry.canonicalUrl]));

  let changedFiles = 0;
  let cleanedLegacyUrls = 0;
  let cleanedLegacyDomains = 0;
  let fixedSchemaAssets = 0;
  let fixedBlogSignals = 0;

  for (const relPath of htmlFiles) {
    const absolutePath = path.join(ROOT, relPath);
    const original = await fs.readFile(absolutePath, "utf8");
    let updated = original;

    for (const rewrite of literalRewrites) {
      const result = replaceAllLiteral(updated, rewrite.from, rewrite.to);
      updated = result.content;
      cleanedLegacyUrls += result.count;
    }

    const beforeDomainCleanup = updated;
    updated = updated.replaceAll(LEGACY_BASE_URL, BASE_URL);
    cleanedLegacyDomains += (beforeDomainCleanup.match(new RegExp(LEGACY_BASE_URL.replaceAll(".", "\\."), "g")) || []).length;

    const assetPatterns = [
      /^https?:\/\/brightai\.(?:site|com\.sa)\/(?:\.\.\/)+assets\/[^\s"'<>]+$/i,
      /^https?:\/\/brightai\.(?:site|com\.sa)\/frontend\/assets\/[^\s"'<>]+$/i,
      /^https?:\/\/brightai\.site\/\/assets\/[^\s"'<>]+$/i,
      /^https?:\/\/brightai\.(?:site|com\.sa)\/[^\s"'<>]*Gemini\.png$/i,
      /^https?:\/\/brightai\.(?:site|com\.sa)\/[^\s"'<>]*brightai-og-placeholder\.png$/i,
      /^https?:\/\/brightai\.(?:site|com\.sa)\/[^\s"'<>]*blog-default\.jpg$/i,
    ];

    updated = updated.replace(/https?:\/\/brightai\.(?:site|com\.sa)\/[^\s"'<>]+/gi, (match) => {
      const normalized = normalizeAssetUrl(match);
      if (normalized !== match && assetPatterns.some((pattern) => pattern.test(match))) {
        fixedSchemaAssets += 1;
      }
      return normalized;
    });

    if (isBlogArticleRelPath(relPath)) {
      const articleCanonical = articleCanonicalByFile.get(relPath);
      if (articleCanonical) {
        updated = upsertTag(updated, CANONICAL_REGEX, `<link rel="canonical" href="${articleCanonical}" />`);
        updated = upsertTag(updated, OG_URL_REGEX, `<meta property="og:url" content="${articleCanonical}" />`);
        updated = updated.replace(HREFLANG_ALT_REGEX, "\n");
        updated = insertIntoHead(
          insertIntoHead(
            updated,
            `<link rel="alternate" hreflang="ar-SA" href="${articleCanonical}" />`
          ),
          `<link rel="alternate" hreflang="x-default" href="${articleCanonical}" />`
        );
        updated = rewriteJsonLdBlocks(updated, { articleCanonical });
        fixedBlogSignals += 1;
      }
    }

    if (!isBlogArticleRelPath(relPath) && updated.includes(LEGACY_BASE_URL)) {
      updated = updated.replaceAll(LEGACY_BASE_URL, BASE_URL);
    }

    if (updated !== original) {
      await fs.writeFile(absolutePath, updated, "utf8");
      changedFiles += 1;
    }
  }

  console.log("Phase 1 signal stabilization completed.");
  console.log(`HTML files scanned: ${htmlFiles.length}`);
  console.log(`Files changed: ${changedFiles}`);
  console.log(`Legacy blog path rewrites: ${cleanedLegacyUrls}`);
  console.log(`Legacy domain rewrites: ${cleanedLegacyDomains}`);
  console.log(`Schema asset fixes: ${fixedSchemaAssets}`);
  console.log(`Blog signal normalizations: ${fixedBlogSignals}`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
