#!/usr/bin/env node
/**
 * scripts/sitemap-contract.mjs — IP-07 + HIGH-05 + HIGH-06
 *
 * Unified sitemap/indexing contract for BrightAI.
 *
 * Single source of truth for:
 *   - What URLs are allowed in the sitemap (allowed = indexable, no status pages,
 *     no design utilities, no dev-only pages).
 *   - How to parse a sitemap (urlset + sitemapindex, recursive).
 *   - How to validate a sitemap against the contract.
 *   - How to validate a page's canonical against the sitemap URL.
 *
 * Why this exists:
 *   1. `astro.config.mjs` (PROTECTED per CLAUDE.md Section 2.1) currently has a
 *      `sitemap({ filter })` rule that only excludes `/api/*` — so `@astrojs/sitemap`
 *      emits design pages (`/design/*`), `/404/`, `/offline/`, `/kernel/offline/`
 *      into `dist/sitemap-0.xml`. The custom `scripts/generate-sitemap-all-pages.mjs`
 *      filters those out of `public/sitemap.xml`, but the canonical sitemap-index
 *      (`dist/sitemap-index.xml`) points to `sitemap-0.xml` (the unfiltered one).
 *   2. We cannot modify `astro.config.mjs` without explicit user approval (it is a
 *      protected file). Instead, this module defines the contract externally so
 *      a CI validator can flag every violation. The recommended fix to
 *      `astro.config.mjs` is documented in `report/2026-07-15-sitemap-contract.md`
 *      and recorded as KI-054 in `.agents/brain.md` for user approval.
 *
 * Usage:
 *   import { isAllowedSitemapUrl, extractSitemapUrls, validateSitemap, validatePageCanonical } from "./sitemap-contract.mjs";
 *   const urls = extractSitemapUrls(sitemapXml);
 *   const errors = validateSitemap(urls, { baseUrl: "https://brightai.live" });
 *
 * Module is pure (no I/O) so it can be tested without filesystem mocking.
 */

const BASE_URL = "https://brightai.live";

/**
 * URL patterns that MUST NEVER appear in the sitemap.
 *
 * - Status artifacts: build outputs served for HTTP error codes, not real
 *   content. We keep `/404/` indexable per astro.config.mjs (so Google can
 *   crawl it), but `/404/` (status page) must NOT be in sitemap — that's a
 *   different thing from the 404 HTTP response. The page `/404/` has its own
 *   canonical (intentional marketing page in this codebase).
 *
 *   SEMRUSH-UNBLOCK (2026-09-08): user decision — /500/, /offline/ and
 *   /kernel/offline/ are now indexable content pages and ARE allowed in the
 *   sitemap; only /404/ and /error/ remain status-artifact excluded.
 *
 * - Dev-only / admin: pages that should never be crawled.
 *
 * - API routes: handled by astro.config filter (`!page.includes('/api/')`) but
 *   we re-check here for defense in depth.
 */
export const STATUS_PAGE_PATTERNS = [
  /^\/404\/?$/i,                  // /404/ as a status code page (not /404.html)
  /^\/error\/?$/i,
];

export const DESIGN_UTILITY_PATTERNS = [
  // SEMRUSH-UNBLOCK (2026-09-08): /design/* pages are indexable per user
  // decision and sitemap-included; the styleguide aliases stay excluded.
  /^\/styleguide\/.+/i,
  /^\/style-guide\/.+/i,
  /^\/components-preview\/.+/i,
  /^\/_design\/.+/i,
  /^\/_styleguide\/.+/i,
];

export const DEV_UTILITY_PATTERNS = [
  /^\/admin\/.+/i,
  /^\/internal\/.+/i,
  /^\/dev\/.+/i,
  /^\/test\/.+/i,
  /^\/_test\/.+/i,
  /^\/_dev\/.+/i,
];

export const API_PATTERNS = [
  /^\/api\/.+/i,
  /^\/ws\/.+/i,
];

/**
 * Pattern for URLs that are explicitly FORBIDDEN in the sitemap.
 * Combines all the above categories.
 */
export const FORBIDDEN_PATTERNS = [
  ...STATUS_PAGE_PATTERNS,
  ...DESIGN_UTILITY_PATTERNS,
  ...DEV_UTILITY_PATTERNS,
  ...API_PATTERNS,
];

/**
 * Pathname-level patterns (used after stripping the origin).
 */
export const ALLOWED_REASON_BY_PATTERN = (() => {
  const map = new Map();
  for (const pat of STATUS_PAGE_PATTERNS) map.set(pat, "status_page");
  for (const pat of DESIGN_UTILITY_PATTERNS) map.set(pat, "design_utility");
  for (const pat of DEV_UTILITY_PATTERNS) map.set(pat, "dev_utility");
  for (const pat of API_PATTERNS) map.set(pat, "api_route");
  return map;
})();

/**
 * Extract the pathname from a URL with NFC normalization.
 * Preserves case (canonical URLs are case-insensitive but the canonical
 * validator does its own normalisation).
 *
 * Returns:
 *   "/" for the homepage (e.g. "https://brightai.live/" → "/")
 *   The pathname as-is (no auto-trailing-slash) for everything else, so
 *   that `validateSitemapUrls` can flag missing trailing slashes.
 *   null for cross-origin or malformed URLs.
 */
export function extractPathname(url, baseUrl = BASE_URL) {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    const expectedOrigin = new URL(baseUrl).origin.toLowerCase();
    if (parsed.origin.toLowerCase() !== expectedOrigin) {
      return null; // cross-origin URL — reject
    }
    let pathname = parsed.pathname || "/";
    pathname = pathname.normalize("NFC");
    return pathname;
  } catch {
    return null;
  }
}

/**
 * Classify a URL against the forbidden patterns.
 * Returns { allowed, reason?, pathname } where reason is one of:
 *   "status_page", "design_utility", "dev_utility", "api_route", or null.
 */
export function classifySitemapUrl(url, baseUrl = BASE_URL) {
  const pathname = extractPathname(url, baseUrl);
  if (pathname === null) {
    return { allowed: false, reason: "invalid_url", pathname: null };
  }

  for (const [pattern, reason] of ALLOWED_REASON_BY_PATTERN.entries()) {
    if (pattern.test(pathname)) {
      return { allowed: false, reason, pathname };
    }
  }

  return { allowed: true, reason: null, pathname };
}

/**
 * Convenience: returns true iff the URL is allowed in the sitemap.
 */
export function isAllowedSitemapUrl(url, baseUrl = BASE_URL) {
  return classifySitemapUrl(url, baseUrl).allowed;
}

/**
 * Extract <loc> URLs from a sitemap XML string.
 * Supports both <urlset> and <sitemapindex>. For <sitemapindex>, only the
 * URLs of the child sitemaps are returned (NOT recursively expanded).
 * Use `extractSitemapUrlsRecursive` for full expansion.
 */
export function extractSitemapLocs(xmlText) {
  if (!xmlText || typeof xmlText !== "string") return [];
  const locs = [];
  const matches = xmlText.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi);
  for (const match of matches) {
    locs.push(match[1].trim());
  }
  return locs;
}

/**
 * Detect whether the XML is a sitemap index.
 */
export function isSitemapIndex(xmlText) {
  if (!xmlText || typeof xmlText !== "string") return false;
  return /<sitemapindex[\s>]/i.test(xmlText);
}

/**
 * Detect whether the XML is a urlset.
 */
export function isUrlset(xmlText) {
  if (!xmlText || typeof xmlText !== "string") return false;
  return /<urlset[\s>]/i.test(xmlText);
}

/**
 * Extract URLs from a sitemap XML, treating <sitemapindex> as a container of
 * child sitemaps. By default the recursion is enabled (reads child sitemaps).
 *
 * @param {string} xmlText      - The sitemap XML to parse.
 * @param {object} [options]
 * @param {Function} [options.fetchChild] - async (url) => xmlText. Allows
 *   the caller to plug in fetch (Node 18+), curl wrapper, or a fake for tests.
 *   Defaults to a function that throws — caller must opt in to recursion.
 * @param {number} [options.maxDepth=3] - Maximum recursion depth (defensive).
 * @returns {Promise<{ urls: string[], childSitemaps: string[], depth: number }>}
 */
export async function extractSitemapUrls(xmlText, options = {}) {
  const { fetchChild, maxDepth = 3 } = options;
  const urls = [];
  const childSitemaps = [];

  if (!isUrlset(xmlText) && !isSitemapIndex(xmlText)) {
    return { urls, childSitemaps, depth: 0, error: "not_a_sitemap" };
  }

  if (isUrlset(xmlText)) {
    urls.push(...extractSitemapLocs(xmlText));
    return { urls, childSitemaps, depth: 0 };
  }

  // sitemapindex — recurse into children if fetchChild is provided
  childSitemaps.push(...extractSitemapLocs(xmlText));

  if (fetchChild && maxDepth > 0) {
    for (const childUrl of childSitemaps) {
      try {
        const childXml = await fetchChild(childUrl);
        const result = await extractSitemapUrls(childXml, {
          fetchChild,
          maxDepth: maxDepth - 1,
        });
        urls.push(...result.urls);
      } catch {
        // Skip child that we can't fetch — caller can detect via childSitemaps.
      }
    }
  }

  return { urls, childSitemaps, depth: 1 };
}

/**
 * Validate a list of sitemap URLs against the contract.
 * Returns an array of error objects: { url, reason, pathname }.
 *
 * @param {string[]} urls - List of sitemap URLs.
 * @param {object} [options]
 * @param {string} [options.baseUrl] - Site origin (default https://brightai.live).
 * @param {RegExp[]} [options.additionalForbiddenPatterns] - Extra patterns to
 *   forbid (e.g. from a custom config).
 * @param {boolean} [options.requireTrailingSlash=true] - Require URLs to end with "/".
 * @param {boolean} [options.rejectDuplicates=true] - Reject duplicate URLs.
 */
export function validateSitemapUrls(urls, options = {}) {
  const {
    baseUrl = BASE_URL,
    additionalForbiddenPatterns = [],
    requireTrailingSlash = true,
    rejectDuplicates = true,
  } = options;

  const errors = [];
  const seen = new Set();
  const allForbidden = [...FORBIDDEN_PATTERNS, ...additionalForbiddenPatterns];

  for (const url of urls) {
    if (!url || typeof url !== "string") {
      errors.push({ url, reason: "invalid_url", pathname: null });
      continue;
    }

    const pathname = extractPathname(url, baseUrl);

    if (pathname === null) {
      errors.push({ url, reason: "invalid_url", pathname: null });
      continue;
    }

    if (requireTrailingSlash && !pathname.endsWith("/")) {
      errors.push({ url, reason: "missing_trailing_slash", pathname });
    }

    for (const pattern of allForbidden) {
      if (pattern.test(pathname)) {
        errors.push({ url, reason: patternReason(pattern), pathname });
        break;
      }
    }

    if (rejectDuplicates) {
      if (seen.has(pathname)) {
        errors.push({ url, reason: "duplicate_url", pathname });
      } else {
        seen.add(pathname);
      }
    }
  }

  return errors;
}

/**
 * Map a regex pattern back to its human-readable reason.
 */
function patternReason(pattern) {
  for (const [p, reason] of ALLOWED_REASON_BY_PATTERN.entries()) {
    if (p === pattern) return reason;
  }
  return "forbidden_pattern";
}

/**
 * Extract canonical URL from a page's HTML.
 * Returns the href of the first <link rel="canonical"> tag, or "" if missing.
 */
export function extractCanonicalFromHtml(htmlText) {
  if (!htmlText || typeof htmlText !== "string") return "";
  const linkTags = htmlText.matchAll(/<link\b[^>]*>/gi);
  for (const match of linkTags) {
    const tag = match[0];
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relMatch) continue;
    const relTokens = relMatch[1]
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!relTokens.includes("canonical")) continue;
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch?.[1]) return hrefMatch[1].trim();
  }
  return "";
}

/**
 * Validate that a page's canonical URL matches the expected sitemap URL.
 * Returns { valid, canonical, expected, mismatched } where mismatched is true
 * iff canonical is present but doesn't match (case-insensitive, NFC-normalised).
 */
export function validatePageCanonical(htmlText, expectedCanonicalUrl, baseUrl = BASE_URL) {
  const canonical = extractCanonicalFromHtml(htmlText);
  const expected = expectedCanonicalUrl || "";
  if (!canonical) {
    return { valid: false, canonical: "", expected, mismatched: false, missing: true };
  }
  if (!expected) {
    return { valid: false, canonical, expected: "", mismatched: false, missing: false };
  }

  const normalize = (u) => {
    try {
      return new URL(u).toString().toLowerCase().normalize("NFC");
    } catch {
      return u.toLowerCase().normalize("NFC");
    }
  };

  const normCanonical = normalize(canonical);
  const normExpected = normalize(expected);

  if (normCanonical === normExpected) {
    return { valid: true, canonical, expected, mismatched: false, missing: false };
  }

  return { valid: false, canonical, expected, mismatched: true, missing: false };
}

/**
 * High-level: validate a sitemap file's content against the contract.
 *
 * @param {string} xmlText - Sitemap XML content.
 * @param {object} [options] - Same as validateSitemapUrls, plus:
 * @param {Function} [options.resolveLocalHtml] - async (sitemapUrl) => htmlText.
 *   If provided, every URL in the sitemap is also checked for a matching
 *   <link rel="canonical"> in the corresponding HTML. This catches pages
 *   that drift from their canonical.
 * @param {string} [options.baseUrl] - Site origin.
 */
export async function validateSitemapContract(xmlText, options = {}) {
  const { resolveLocalHtml, baseUrl = BASE_URL, fetchChild } = options;

  const { urls, childSitemaps, error } = await extractSitemapUrls(xmlText, {
    fetchChild,
    maxDepth: 3,
  });

  if (error) {
    return {
      ok: false,
      errors: [{ reason: "not_a_sitemap", detail: error }],
      urls: [],
      childSitemaps: [],
      canonicalErrors: [],
    };
  }

  const urlErrors = validateSitemapUrls(urls, { baseUrl });

  const canonicalErrors = [];
  if (resolveLocalHtml) {
    for (const url of urls) {
      try {
        const html = await resolveLocalHtml(url);
        if (html === null) continue; // resolver opted out
        const result = validatePageCanonical(html, url, baseUrl);
        if (!result.valid) {
          canonicalErrors.push({
            url,
            canonical: result.canonical,
            expected: result.expected,
            reason: result.missing ? "missing_canonical" : "canonical_mismatch",
          });
        }
      } catch {
        // Skip — caller can detect missing pages separately
      }
    }
  }

  const ok = urlErrors.length === 0 && canonicalErrors.length === 0;

  return {
    ok,
    errors: urlErrors,
    urls,
    childSitemaps,
    canonicalErrors,
  };
}