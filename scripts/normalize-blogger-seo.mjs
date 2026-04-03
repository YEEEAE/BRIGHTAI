#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const LEGACY_BASE_URL = "https://brightai.com.sa";

const BLOGGER_PATTERNS = ["frontend/pages/blogger/*.html", "blog/*.html"];
const HTML_PATTERNS = ["index.html", "docs.html", "docs/**/*.html", "frontend/pages/**/*.html"];

const CANONICAL_REGEX = /<link[^>]*rel=["']canonical["'][^>]*>/i;
const OG_URL_REGEX = /<meta[^>]*property=["']og:url["'][^>]*>/i;
const ROBOTS_REGEX = /<meta[^>]*name=["']robots["'][^>]*>/i;
const TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const DESCRIPTION_REGEX = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i;
const OG_DESCRIPTION_REGEX = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i;
const OG_IMAGE_REGEX = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i;
const OG_IMAGE_ALT_REGEX = /<meta[^>]*property=["']og:image:alt["'][^>]*content=["']([^"']*)["'][^>]*>/i;
const NOINDEX_REGEX = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i;
const TWITTER_CARD_REGEX = /<meta[^>]*name=["']twitter:card["'][^>]*>/i;
const TWITTER_SITE_REGEX = /<meta[^>]*name=["']twitter:site["'][^>]*>/i;
const TWITTER_TITLE_REGEX = /<meta[^>]*name=["']twitter:title["'][^>]*>/i;
const TWITTER_DESCRIPTION_REGEX = /<meta[^>]*name=["']twitter:description["'][^>]*>/i;
const TWITTER_IMAGE_REGEX = /<meta[^>]*name=["']twitter:image["'][^>]*>/i;
const TWITTER_IMAGE_ALT_REGEX = /<meta[^>]*name=["']twitter:image:alt["'][^>]*>/i;
const OG_TITLE_REGEX = /<meta[^>]*property=["']og:title["'][^>]*>/i;
const OG_TYPE_REGEX = /<meta[^>]*property=["']og:type["'][^>]*>/i;
const DEFAULT_IMAGE_URL = `${BASE_URL}/assets/images/Gemini.png`;
const TWITTER_HANDLE = "@BrightAI_SA";

function extractAttribute(tag, attrName) {
  const pattern = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i");
  const match = tag.match(pattern);
  return match ? match[1].trim() : null;
}

function normalizeToSitePath(rawValue, sourceFile) {
  if (!rawValue) return null;
  const value = rawValue.trim();
  if (!value) return null;

  try {
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value);
      return parsed.pathname || "/";
    }
  } catch {
    // Fall through to local path handling.
  }

  if (value.startsWith("/")) {
    return value;
  }

  const sourceDir = path.posix.dirname(sourceFile.replace(/\\/g, "/"));
  const resolved = path.posix.normalize(path.posix.join("/", sourceDir, value));
  return resolved.startsWith("/") ? resolved : `/${resolved}`;
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
  if (!headOpen) {
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
  const count = parts.length - 1;
  return { content: parts.join(toValue), count };
}

function extractHeadValue(content, regex) {
  const match = content.match(regex);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function normalizeImageUrl(rawValue) {
  if (!rawValue) return DEFAULT_IMAGE_URL;
  const value = rawValue.trim();
  if (!value) return DEFAULT_IMAGE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${BASE_URL}${value}`;
  return DEFAULT_IMAGE_URL;
}

function ensureIndexableBlogSocialMarkup(content, canonicalUrl) {
  if (NOINDEX_REGEX.test(content)) {
    return { content, changed: false };
  }

  const title = extractHeadValue(content, TITLE_REGEX);
  const description =
    extractHeadValue(content, DESCRIPTION_REGEX) ||
    extractHeadValue(content, OG_DESCRIPTION_REGEX) ||
    title;
  const ogImage = normalizeImageUrl(extractHeadValue(content, OG_IMAGE_REGEX));
  const imageAlt = extractHeadValue(content, OG_IMAGE_ALT_REGEX) || title || "Bright AI";

  let updated = content;
  updated = upsertTag(updated, OG_TYPE_REGEX, '<meta property="og:type" content="article" />');
  if (title) {
    updated = upsertTag(updated, OG_TITLE_REGEX, `<meta property="og:title" content="${title}" />`);
  }
  if (description) {
    updated = upsertTag(
      updated,
      OG_DESCRIPTION_REGEX,
      `<meta property="og:description" content="${description}" />`
    );
  }
  updated = upsertTag(updated, OG_IMAGE_REGEX, `<meta property="og:image" content="${ogImage}" />`);
  updated = upsertTag(
    updated,
    OG_IMAGE_ALT_REGEX,
    `<meta property="og:image:alt" content="${imageAlt}" />`
  );
  updated = upsertTag(updated, OG_URL_REGEX, `<meta property="og:url" content="${canonicalUrl}" />`);
  updated = upsertTag(updated, TWITTER_CARD_REGEX, '<meta name="twitter:card" content="summary_large_image" />');
  updated = upsertTag(updated, TWITTER_SITE_REGEX, `<meta name="twitter:site" content="${TWITTER_HANDLE}" />`);
  if (title) {
    updated = upsertTag(
      updated,
      TWITTER_TITLE_REGEX,
      `<meta name="twitter:title" content="${title}" />`
    );
  }
  if (description) {
    updated = upsertTag(
      updated,
      TWITTER_DESCRIPTION_REGEX,
      `<meta name="twitter:description" content="${description}" />`
    );
  }
  updated = upsertTag(
    updated,
    TWITTER_IMAGE_REGEX,
    `<meta name="twitter:image" content="${ogImage}" />`
  );
  updated = upsertTag(
    updated,
    TWITTER_IMAGE_ALT_REGEX,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`
  );

  return { content: updated, changed: updated !== content };
}

async function main() {
  const bloggerFiles = [
    ...new Set(
      (
        await Promise.all(BLOGGER_PATTERNS.map((pattern) => glob(pattern, { nodir: true, cwd: ROOT })))
      ).flat()
    ),
  ];
  const redirectMap = new Map();

  let redirectPagesUpdated = 0;
  let ogUrlAddedOnRegularPages = 0;
  let socialMarkupNormalized = 0;
  let metadataFilesChanged = 0;

  for (const relativeFile of bloggerFiles) {
    const absoluteFile = path.join(ROOT, relativeFile);
    const basename = path.basename(relativeFile);
    const selfPath = `/blog/${path.basename(relativeFile, ".html")}`;
    const selfUrl = `${BASE_URL}${selfPath}`;

    const originalContent = await fs.readFile(absoluteFile, "utf8");
    let updatedContent = originalContent;

    const redirectTargetPath = extractRedirectTargetPath(originalContent, relativeFile);

    if (redirectTargetPath) {
      const redirectTargetUrl = `${BASE_URL}${redirectTargetPath}`;
      redirectMap.set(selfPath, redirectTargetPath);

      updatedContent = upsertTag(
        updatedContent,
        ROBOTS_REGEX,
        '<meta name="robots" content="noindex, follow" />'
      );
      updatedContent = upsertTag(
        updatedContent,
        CANONICAL_REGEX,
        `<link rel="canonical" href="${redirectTargetUrl}" />`
      );
      updatedContent = upsertTag(
        updatedContent,
        OG_URL_REGEX,
        `<meta property="og:url" content="${redirectTargetUrl}" />`
      );
    } else {
      const canonicalMatch = updatedContent.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
      );
      const canonicalUrl = canonicalMatch?.[1]?.trim() || selfUrl;

      if (!OG_URL_REGEX.test(updatedContent)) {
        updatedContent = upsertTag(
          updatedContent,
          OG_URL_REGEX,
          `<meta property="og:url" content="${canonicalUrl}" />`
        );
        ogUrlAddedOnRegularPages += 1;
      }

      const socialResult = ensureIndexableBlogSocialMarkup(updatedContent, canonicalUrl);
      updatedContent = socialResult.content;
      if (socialResult.changed) {
        socialMarkupNormalized += 1;
      }
    }

    if (updatedContent !== originalContent) {
      await fs.writeFile(absoluteFile, updatedContent, "utf8");
      metadataFilesChanged += 1;
      if (redirectTargetPath) redirectPagesUpdated += 1;
    }
  }

  const htmlFiles = await glob(HTML_PATTERNS, { nodir: true, cwd: ROOT });
  let totalLinkRewrites = 0;
  let linkRewriteFilesChanged = 0;

  for (const relativeFile of htmlFiles) {
    const absoluteFile = path.join(ROOT, relativeFile);
    const originalContent = await fs.readFile(absoluteFile, "utf8");
    let updatedContent = originalContent;
    let fileRewriteCount = 0;

    for (const [oldPath, targetPath] of redirectMap.entries()) {
      if (oldPath === targetPath) continue;

      const oldBasename = path.posix.basename(oldPath);
      const oldLegacyPath = `/blogger/${oldBasename}`;

      const oldPathEncoded = encodeURI(oldPath);
      const targetPathEncoded = encodeURI(targetPath);
      const oldLegacyPathEncoded = encodeURI(oldLegacyPath);

      const candidatePairs = [
        [oldPath, targetPath],
        [oldPathEncoded, targetPathEncoded],
        [`${BASE_URL}${oldPath}`, `${BASE_URL}${targetPath}`],
        [`${BASE_URL}${oldPathEncoded}`, `${BASE_URL}${targetPathEncoded}`],
        [oldLegacyPath, targetPath],
        [oldLegacyPathEncoded, targetPathEncoded],
        [`${BASE_URL}${oldLegacyPath}`, `${BASE_URL}${targetPath}`],
        [`${BASE_URL}${oldLegacyPathEncoded}`, `${BASE_URL}${targetPathEncoded}`],
        [`${LEGACY_BASE_URL}${oldLegacyPath}`, `${BASE_URL}${targetPath}`],
        [`${LEGACY_BASE_URL}${oldLegacyPathEncoded}`, `${BASE_URL}${targetPathEncoded}`]
      ];

      for (const [fromValue, toValue] of candidatePairs) {
        const result = replaceAllLiteral(updatedContent, fromValue, toValue);
        updatedContent = result.content;
        fileRewriteCount += result.count;
      }
    }

    if (updatedContent !== originalContent) {
      await fs.writeFile(absoluteFile, updatedContent, "utf8");
      linkRewriteFilesChanged += 1;
      totalLinkRewrites += fileRewriteCount;
    }
  }

  console.log("Blogger SEO normalization completed.");
  console.log(`Blogger files scanned: ${bloggerFiles.length}`);
  console.log(`Redirect mappings detected: ${redirectMap.size}`);
  console.log(`Redirect pages normalized: ${redirectPagesUpdated}`);
  console.log(`Regular pages with added og:url: ${ogUrlAddedOnRegularPages}`);
  console.log(`Indexable blog pages with normalized social markup: ${socialMarkupNormalized}`);
  console.log(`Metadata files changed: ${metadataFilesChanged}`);
  console.log(`HTML files with legacy-link rewrites: ${linkRewriteFilesChanged}`);
  console.log(`Total legacy-link rewrites: ${totalLinkRewrites}`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
