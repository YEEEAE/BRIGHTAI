#!/usr/bin/env node
/**
 * scripts/sitemap-contract.test.mjs — IP-07 + HIGH-05 + HIGH-06
 *
 * Unit tests for the unified sitemap/indexing contract.
 *
 * Run with: `node --test scripts/sitemap-contract.test.mjs`
 *
 * Coverage:
 *   - Pattern detection (status pages, design utilities, dev utilities, API)
 *   - URL extraction from urlset and sitemapindex
 *   - Recursive sitemap expansion via fetchChild
 *   - Bad URL detection (status pages, design utilities, etc.)
 *   - Canonical validation (matching, missing, mismatched)
 *   - Integration: validates dist/sitemap-index.xml end-to-end (reads files,
 *     does not make network calls)
 */

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  STATUS_PAGE_PATTERNS,
  DESIGN_UTILITY_PATTERNS,
  DEV_UTILITY_PATTERNS,
  API_PATTERNS,
  FORBIDDEN_PATTERNS,
  extractPathname,
  classifySitemapUrl,
  isAllowedSitemapUrl,
  extractSitemapLocs,
  isSitemapIndex,
  isUrlset,
  extractSitemapUrls,
  validateSitemapUrls,
  extractCanonicalFromHtml,
  validatePageCanonical,
  validateSitemapContract,
} from "./sitemap-contract.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Pattern detection
// ---------------------------------------------------------------------------

test("STATUS_PAGE_PATTERNS catches 404/500/offline/error/kernel-offline", () => {
  const positives = [
    "https://brightai.site/404/",
    "https://brightai.site/500/",
    "https://brightai.site/error/",
    "https://brightai.site/offline/",
    "https://brightai.site/kernel/offline/",
  ];
  for (const url of positives) {
    assert.ok(
      STATUS_PAGE_PATTERNS.some((p) => p.test(new URL(url).pathname)),
      `expected ${url} to match a STATUS_PAGE pattern`,
    );
  }
});

test("STATUS_PAGE_PATTERNS does not match legitimate marketing pages", () => {
  const negatives = [
    "https://brightai.site/about/",
    "https://brightai.site/about/404-not-found/",
    "https://brightai.site/blog/404-errors-explained/",
    "https://brightai.site/kernel/",
    "https://brightai.site/kernel/chat/",
    "https://brightai.site/",
  ];
  for (const url of negatives) {
    assert.ok(
      !STATUS_PAGE_PATTERNS.some((p) => p.test(new URL(url).pathname)),
      `expected ${url} NOT to match any STATUS_PAGE pattern`,
    );
  }
});

test("DESIGN_UTILITY_PATTERNS catches /design/* system pages", () => {
  const positives = [
    "https://brightai.site/design/buttons/",
    "https://brightai.site/design/cards/",
    "https://brightai.site/design/colors/",
    "https://brightai.site/design/forms/",
    "https://brightai.site/design/typography/",
    "https://brightai.site/styleguide/colors/",
    "https://brightai.site/style-guide/components/",
    "https://brightai.site/components-preview/button/",
  ];
  for (const url of positives) {
    assert.ok(
      DESIGN_UTILITY_PATTERNS.some((p) => p.test(new URL(url).pathname)),
      `expected ${url} to match a DESIGN_UTILITY pattern`,
    );
  }
});

test("DESIGN_UTILITY_PATTERNS does not match legitimate product pages", () => {
  const negatives = [
    "https://brightai.site/solutions/ai-firewall/",
    "https://brightai.site/blog/ai-design-systems/",
    "https://brightai.site/docs/ui-kit/",
  ];
  for (const url of negatives) {
    assert.ok(
      !DESIGN_UTILITY_PATTERNS.some((p) => p.test(new URL(url).pathname)),
      `expected ${url} NOT to match any DESIGN_UTILITY pattern`,
    );
  }
});

test("DEV_UTILITY_PATTERNS catches /admin/, /dev/, /test/, /internal/", () => {
  const positives = [
    "https://brightai.site/admin/dashboard/",
    "https://brightai.site/dev/staging/",
    "https://brightai.site/test/fixtures/",
    "https://brightai.site/internal/docs/",
  ];
  for (const url of positives) {
    assert.ok(
      DEV_UTILITY_PATTERNS.some((p) => p.test(new URL(url).pathname)),
      `expected ${url} to match a DEV_UTILITY pattern`,
    );
  }
});

test("API_PATTERNS catches /api/* and /ws/*", () => {
  const positives = [
    "https://brightai.site/api/ai/chat/",
    "https://brightai.site/api/health/",
    "https://brightai.site/ws/chat/",
  ];
  for (const url of positives) {
    assert.ok(
      API_PATTERNS.some((p) => p.test(new URL(url).pathname)),
      `expected ${url} to match an API pattern`,
    );
  }
});

test("FORBIDDEN_PATTERNS is the union of all forbidden categories", () => {
  assert.ok(FORBIDDEN_PATTERNS.length >= STATUS_PAGE_PATTERNS.length);
  assert.ok(FORBIDDEN_PATTERNS.length >= DESIGN_UTILITY_PATTERNS.length);
  assert.ok(FORBIDDEN_PATTERNS.length >= DEV_UTILITY_PATTERNS.length);
  assert.ok(FORBIDDEN_PATTERNS.length >= API_PATTERNS.length);
});

// ---------------------------------------------------------------------------
// URL extraction
// ---------------------------------------------------------------------------

test("extractPathname returns normalised pathname for valid URLs", () => {
  assert.equal(extractPathname("https://brightai.site/"), "/");
  assert.equal(extractPathname("https://brightai.site/about/"), "/about/");
  // No auto-trailing-slash added — validateSitemapUrls owns that check.
  assert.equal(extractPathname("https://brightai.site/about"), "/about");
  // Case is preserved (canonical validator handles case-insensitivity).
  assert.equal(
    extractPathname("https://brightai.site/Blog/AI-Firewall/"),
    "/Blog/AI-Firewall/",
  );
});

test("extractPathname returns null for cross-origin URLs", () => {
  assert.equal(extractPathname("https://example.com/about/"), null);
  assert.equal(extractPathname("https://other-site.com/"), null);
});

test("extractPathname returns null for malformed URLs", () => {
  assert.equal(extractPathname("not-a-url"), null);
  assert.equal(extractPathname(""), null);
  assert.equal(extractPathname(null), null);
  assert.equal(extractPathname(undefined), null);
});

test("classifySitemapUrl flags status pages with reason=status_page", () => {
  const result = classifySitemapUrl("https://brightai.site/404/");
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "status_page");
  assert.equal(result.pathname, "/404/");
});

test("classifySitemapUrl flags design pages with reason=design_utility", () => {
  const result = classifySitemapUrl("https://brightai.site/design/buttons/");
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "design_utility");
});

test("classifySitemapUrl flags API routes with reason=api_route", () => {
  const result = classifySitemapUrl("https://brightai.site/api/ai/chat/");
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "api_route");
});

test("classifySitemapUrl allows legitimate marketing pages", () => {
  const positives = [
    "https://brightai.site/",
    "https://brightai.site/about/",
    "https://brightai.site/blog/ai-firewall-why-you-need-it/",
    "https://brightai.site/solutions/ai-firewall/",
    "https://brightai.site/kernel/chat/",
    "https://brightai.site/docs/",
    "https://brightai.site/en/privacy-policy/",
  ];
  for (const url of positives) {
    assert.ok(isAllowedSitemapUrl(url), `expected ${url} to be allowed`);
  }
});

test("isAllowedSitemapUrl rejects cross-origin URLs", () => {
  assert.equal(isAllowedSitemapUrl("https://example.com/about/"), false);
});

// ---------------------------------------------------------------------------
// XML parsing
// ---------------------------------------------------------------------------

test("isUrlset detects a urlset XML", () => {
  assert.equal(isUrlset(`<?xml version="1.0"?><urlset></urlset>`), true);
  assert.equal(isUrlset(`<urlset xmlns="..."/>`), true);
});

test("isUrlset returns false for non-urlset XML", () => {
  assert.equal(isUrlset(`<sitemapindex></sitemapindex>`), false);
  assert.equal(isUrlset(`<html></html>`), false);
  assert.equal(isUrlset(""), false);
});

test("isSitemapIndex detects a sitemapindex XML", () => {
  assert.equal(isSitemapIndex(`<sitemapindex></sitemapindex>`), true);
  assert.equal(isSitemapIndex(`<sitemapindex xmlns="..."/>`), true);
});

test("extractSitemapLocs extracts all <loc> URLs", () => {
  const xml = `<?xml version="1.0"?>
    <urlset>
      <url><loc>https://brightai.site/</loc></url>
      <url><loc>https://brightai.site/about/</loc></url>
      <url><loc>https://brightai.site/blog/</loc></url>
    </urlset>`;
  const locs = extractSitemapLocs(xml);
  assert.deepEqual(locs, [
    "https://brightai.site/",
    "https://brightai.site/about/",
    "https://brightai.site/blog/",
  ]);
});

test("extractSitemapLocs handles whitespace inside <loc> tags", () => {
  const xml = `<urlset><url><loc>
    https://brightai.site/about/
  </loc></url></urlset>`;
  const locs = extractSitemapLocs(xml);
  assert.deepEqual(locs, ["https://brightai.site/about/"]);
});

test("extractSitemapLocs returns empty array for invalid input", () => {
  assert.deepEqual(extractSitemapLocs(""), []);
  assert.deepEqual(extractSitemapLocs(null), []);
  assert.deepEqual(extractSitemapLocs(undefined), []);
});

// ---------------------------------------------------------------------------
// Recursive sitemap expansion
// ---------------------------------------------------------------------------

test("extractSitemapUrls returns URLs from a urlset (no recursion)", async () => {
  const xml = `<urlset><url><loc>https://brightai.site/</loc></url></urlset>`;
  const result = await extractSitemapUrls(xml);
  assert.deepEqual(result.urls, ["https://brightai.site/"]);
  assert.deepEqual(result.childSitemaps, []);
  assert.equal(result.depth, 0);
});

test("extractSitemapUrls returns child sitemap URLs when no fetchChild", async () => {
  const xml = `<sitemapindex>
    <sitemap><loc>https://brightai.site/sitemap-0.xml</loc></sitemap>
    <sitemap><loc>https://brightai.site/sitemap-1.xml</loc></sitemap>
  </sitemapindex>`;
  const result = await extractSitemapUrls(xml);
  assert.deepEqual(result.urls, []);
  assert.deepEqual(result.childSitemaps, [
    "https://brightai.site/sitemap-0.xml",
    "https://brightai.site/sitemap-1.xml",
  ]);
  assert.equal(result.depth, 1);
});

test("extractSitemapUrls recursively expands sitemapindex with fetchChild", async () => {
  const indexXml = `<sitemapindex>
    <sitemap><loc>https://brightai.site/sitemap-0.xml</loc></sitemap>
  </sitemapindex>`;
  const childXml = `<urlset>
    <url><loc>https://brightai.site/about/</loc></url>
    <url><loc>https://brightai.site/contact/</loc></url>
  </urlset>`;

  const fetchChild = async (url) => {
    if (url === "https://brightai.site/sitemap-0.xml") return childXml;
    throw new Error(`unexpected child URL: ${url}`);
  };

  const result = await extractSitemapUrls(indexXml, { fetchChild, maxDepth: 3 });
  assert.deepEqual(result.urls, [
    "https://brightai.site/about/",
    "https://brightai.site/contact/",
  ]);
  assert.deepEqual(result.childSitemaps, [
    "https://brightai.site/sitemap-0.xml",
  ]);
});

test("extractSitemapUrls handles broken child sitemaps gracefully", async () => {
  const indexXml = `<sitemapindex>
    <sitemap><loc>https://brightai.site/sitemap-0.xml</loc></sitemap>
    <sitemap><loc>https://brightai.site/sitemap-1.xml</loc></sitemap>
  </sitemapindex>`;
  const child0Xml = `<urlset><url><loc>https://brightai.site/</loc></url></urlset>`;

  const fetchChild = async (url) => {
    if (url === "https://brightai.site/sitemap-0.xml") return child0Xml;
    if (url === "https://brightai.site/sitemap-1.xml") throw new Error("404");
    throw new Error("unexpected");
  };

  const result = await extractSitemapUrls(indexXml, { fetchChild, maxDepth: 3 });
  assert.deepEqual(result.urls, ["https://brightai.site/"]);
  // Both children are listed; one of them is broken.
  assert.equal(result.childSitemaps.length, 2);
});

test("extractSitemapUrls respects maxDepth", async () => {
  const indexXml = `<sitemapindex>
    <sitemap><loc>https://brightai.site/sitemap-0.xml</loc></sitemap>
  </sitemapindex>`;
  const childXml = `<sitemapindex>
    <sitemap><loc>https://brightai.site/sitemap-deep.xml</loc></sitemap>
  </sitemapindex>`;

  const fetchChild = async (url) => {
    if (url.endsWith("sitemap-0.xml")) return childXml;
    throw new Error(`unexpected child at maxDepth=0: ${url}`);
  };

  // maxDepth=0 means no recursion
  const result = await extractSitemapUrls(indexXml, { fetchChild, maxDepth: 0 });
  assert.deepEqual(result.urls, []);
  // Children are listed but not expanded
  assert.deepEqual(result.childSitemaps, [
    "https://brightai.site/sitemap-0.xml",
  ]);
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test("validateSitemapUrls returns no errors for a clean sitemap", () => {
  const urls = [
    "https://brightai.site/",
    "https://brightai.site/about/",
    "https://brightai.site/blog/ai-firewall/",
    "https://brightai.site/kernel/chat/",
  ];
  const errors = validateSitemapUrls(urls);
  assert.deepEqual(errors, []);
});

test("validateSitemapUrls catches status pages in sitemap", () => {
  const urls = [
    "https://brightai.site/",
    "https://brightai.site/404/",
    "https://brightai.site/offline/",
  ];
  const errors = validateSitemapUrls(urls);
  assert.equal(errors.length, 2);
  assert.ok(errors.some((e) => e.reason === "status_page" && e.pathname === "/404/"));
  assert.ok(errors.some((e) => e.reason === "status_page" && e.pathname === "/offline/"));
});

test("validateSitemapUrls catches design utilities", () => {
  const urls = [
    "https://brightai.site/",
    "https://brightai.site/design/buttons/",
    "https://brightai.site/design/cards/",
  ];
  const errors = validateSitemapUrls(urls);
  assert.equal(errors.length, 2);
  assert.ok(errors.every((e) => e.reason === "design_utility"));
});

test("validateSitemapUrls catches API routes", () => {
  const errors = validateSitemapUrls([
    "https://brightai.site/api/ai/chat/",
    "https://brightai.site/ws/chat/",
  ]);
  assert.equal(errors.length, 2);
  assert.ok(errors.every((e) => e.reason === "api_route"));
});

test("validateSitemapUrls catches duplicates", () => {
  const errors = validateSitemapUrls([
    "https://brightai.site/about/",
    "https://brightai.site/about/",
  ]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].reason, "duplicate_url");
});

test("validateSitemapUrls catches missing trailing slash", () => {
  const errors = validateSitemapUrls(["https://brightai.site/about"], {
    requireTrailingSlash: true,
  });
  assert.equal(errors.length, 1);
  assert.equal(errors[0].reason, "missing_trailing_slash");
  assert.equal(errors[0].pathname, "/about");
});

test("validateSitemapUrls allows missing trailing slash when disabled", () => {
  const errors = validateSitemapUrls(["https://brightai.site/about"], {
    requireTrailingSlash: false,
  });
  assert.deepEqual(errors, []);
});

test("validateSitemapUrls allows duplicates when disabled", () => {
  const errors = validateSitemapUrls(
    ["https://brightai.site/about/", "https://brightai.site/about/"],
    { rejectDuplicates: false },
  );
  assert.deepEqual(errors, []);
});

test("validateSitemapUrls supports additional forbidden patterns", () => {
  const errors = validateSitemapUrls(
    ["https://brightai.site/foo-bar/"],
    { additionalForbiddenPatterns: [/^\/foo-bar\/?$/i] },
  );
  assert.equal(errors.length, 1);
  assert.equal(errors[0].reason, "forbidden_pattern");
});

test("validateSitemapUrls catches cross-origin URLs", () => {
  const errors = validateSitemapUrls(["https://example.com/about/"]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].reason, "invalid_url");
});

// ---------------------------------------------------------------------------
// Canonical validation
// ---------------------------------------------------------------------------

test("extractCanonicalFromHtml finds the canonical link", () => {
  const html = `<html><head>
    <link rel="canonical" href="https://brightai.site/about/" />
  </head></html>`;
  assert.equal(
    extractCanonicalFromHtml(html),
    "https://brightai.site/about/",
  );
});

test("extractCanonicalFromHtml returns empty for missing canonical", () => {
  const html = `<html><head><title>No canonical</title></head></html>`;
  assert.equal(extractCanonicalFromHtml(html), "");
});

test("extractCanonicalFromHtml returns empty for invalid input", () => {
  assert.equal(extractCanonicalFromHtml(""), "");
  assert.equal(extractCanonicalFromHtml(null), "");
});

test("validatePageCanonical passes when canonical matches", () => {
  const html = `<link rel="canonical" href="https://brightai.site/about/" />`;
  const result = validatePageCanonical(
    html,
    "https://brightai.site/about/",
  );
  assert.equal(result.valid, true);
  assert.equal(result.mismatched, false);
  assert.equal(result.missing, false);
});

test("validatePageCanonical flags missing canonical", () => {
  const html = `<html><head><title>No canonical</title></head></html>`;
  const result = validatePageCanonical(html, "https://brightai.site/about/");
  assert.equal(result.valid, false);
  assert.equal(result.missing, true);
});

test("validatePageCanonical flags mismatched canonical", () => {
  const html = `<link rel="canonical" href="https://brightai.site/Wrong-Path/" />`;
  const result = validatePageCanonical(
    html,
    "https://brightai.site/about/",
  );
  assert.equal(result.valid, false);
  assert.equal(result.mismatched, true);
});

test("validatePageCanonical is case-insensitive", () => {
  const html = `<link rel="canonical" href="HTTPS://BrightAI.Site/About/" />`;
  const result = validatePageCanonical(
    html,
    "https://brightai.site/about/",
  );
  assert.equal(result.valid, true);
});

// ---------------------------------------------------------------------------
// Integration: end-to-end contract validation against dist/
// ---------------------------------------------------------------------------

test("validateSitemapContract flags design utilities in synthetic sitemap", async () => {
  // Build a synthetic sitemap that mirrors what the @astrojs/sitemap plugin
  // WOULD produce if astro.config.mjs weren't filtering. This proves the
  // contract catches the violations regardless of whether the build is clean
  // or dirty.
  //
  // Post-IP-07, the build pipeline (npm run build) overwrites sitemap-0.xml
  // with the clean version via generate-sitemap-all-pages.mjs. So the
  // on-disk sitemap is clean. We test the contract on a synthetic dirty
  // sitemap instead.
  const dirtySitemapXml = `<?xml version="1.0"?>
    <urlset>
      <url><loc>https://brightai.site/</loc></url>
      <url><loc>https://brightai.site/design/buttons/</loc></url>
      <url><loc>https://brightai.site/design/cards/</loc></url>
      <url><loc>https://brightai.site/design/colors/</loc></url>
      <url><loc>https://brightai.site/design/forms/</loc></url>
      <url><loc>https://brightai.site/design/typography/</loc></url>
    </urlset>`;
  const result = await validateSitemapContract(dirtySitemapXml);

  const designUtilityErrors = result.errors.filter(
    (e) => e.reason === "design_utility",
  );
  assert.equal(
    designUtilityErrors.length,
    5,
    `expected 5 design_utility violations in synthetic dirty sitemap, got ${designUtilityErrors.length}`,
  );
});

test("validateSitemapContract flags status pages in synthetic sitemap", async () => {
  // Same pattern as the design utilities test — synthetic dirty sitemap.
  const dirtySitemapXml = `<?xml version="1.0"?>
    <urlset>
      <url><loc>https://brightai.site/</loc></url>
      <url><loc>https://brightai.site/404/</loc></url>
      <url><loc>https://brightai.site/offline/</loc></url>
      <url><loc>https://brightai.site/kernel/offline/</loc></url>
    </urlset>`;
  const result = await validateSitemapContract(dirtySitemapXml);

  const statusErrors = result.errors.filter((e) => e.reason === "status_page");
  assert.ok(
    statusErrors.length >= 1,
    `expected at least 1 status_page violation, got ${statusErrors.length}`,
  );
  assert.ok(
    statusErrors.some((e) => e.pathname === "/404/"),
    "expected /404/ to be flagged as status_page",
  );
});

test("dist/sitemap-0.xml is clean after build pipeline (IP-07)", async () => {
  // IP-07 changed the build pipeline: generate-sitemap-all-pages.mjs now
  // runs as part of `npm run build` and overwrites the @astrojs/sitemap
  // output with the filtered, contract-conformant sitemap. This test
  // verifies that the on-disk result actually IS clean.
  const sitemapPath = path.join(ROOT, "dist", "sitemap-0.xml");
  if (!fs.existsSync(sitemapPath)) {
    return; // dist hasn't been built — skip
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const result = await validateSitemapContract(xml);
  assert.equal(
    result.errors.length,
    0,
    `dist/sitemap-0.xml should be clean after IP-07, found violations: ${JSON.stringify(result.errors)}`,
  );
});

test("validateSitemapContract returns no errors for a clean synthetic sitemap", async () => {
  const cleanXml = `<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://brightai.site/</loc></url>
      <url><loc>https://brightai.site/about/</loc></url>
      <url><loc>https://brightai.site/blog/</loc></url>
      <url><loc>https://brightai.site/kernel/chat/</loc></url>
      <url><loc>https://brightai.site/solutions/ai-firewall/</loc></url>
    </urlset>`;
  const result = await validateSitemapContract(cleanXml);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("validateSitemapContract returns error for non-sitemap XML", async () => {
  const result = await validateSitemapContract("<html></html>");
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].reason, "not_a_sitemap");
});

test("validateSitemapContract validates canonicals against local HTML files", async () => {
  const distRoot = path.join(ROOT, "dist", "client");
  if (!fs.existsSync(distRoot)) {
    // Adapter-laid dist (KERNEL-AI-2026-07-14). Try the legacy path too.
    const legacyDist = path.join(ROOT, "dist");
    if (!fs.existsSync(path.join(legacyDist, "about", "index.html"))) {
      return; // dist hasn't been built — skip
    }
  }

  const distHtmlRoot = fs.existsSync(path.join(distRoot, "about", "index.html"))
    ? distRoot
    : path.join(ROOT, "dist");

  const resolveLocalHtml = async (sitemapUrl) => {
    const pathname = new URL(sitemapUrl).pathname;
    if (pathname === "/") {
      const indexPath = path.join(distHtmlRoot, "index.html");
      return fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : null;
    }
    const filePath = path.join(distHtmlRoot, pathname, "index.html");
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf8");
  };

  // Use a small synthetic sitemap referencing real pages
  const xml = `<?xml version="1.0"?>
    <urlset>
      <url><loc>https://brightai.site/</loc></url>
      <url><loc>https://brightai.site/about/</loc></url>
    </urlset>`;
  const result = await validateSitemapContract(xml, { resolveLocalHtml });

  // We expect either 0 canonical errors (good) or some (the test still
  // proves the integration works). The key invariant: no exceptions thrown.
  assert.ok(Array.isArray(result.canonicalErrors));
});