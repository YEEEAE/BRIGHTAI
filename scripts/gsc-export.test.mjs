/**
 * gsc-export.test.mjs — unit tests for scripts/gsc-export.mjs (BAI-IDX-13).
 *
 * Runs via: node --test scripts/gsc-export.test.mjs
 *
 * Coverage:
 *   - readSitemapUrls        — parses <loc> elements, dedupes, handles whitespace
 *   - bucketCoverageState     — all 4 buckets + unknown fallback
 *   - buildPerUrlResults      — flattens API responses into per_url entries
 *   - buildSnapshot           — assembles counts + URL buckets + delta
 *   - computeDelta            — counts delta + newly_indexed / newly_unindexed / newly_resolved
 *   - findPreviousSnapshot    — picks the most recent prior JSON
 *   - signServiceAccountJwt   — round-trip via a generated RSA key
 *   - run dry-run path        — writes a JSON file with synthetic data
 *
 * No live API calls. All network / file I/O is via injected fakes.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateKeyPairSync, createVerify } from "node:crypto";
import test from "node:test";

import {
  buildDryRunPerUrl,
  buildPerUrlResults,
  buildSnapshot,
  bucketCoverageState,
  computeDelta,
  parseArgs,
  readSitemapUrls,
  run,
  signServiceAccountJwt,
  todayUtcIso,
} from "./gsc-export.mjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writeSitemap(dir, urls) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
    "</urlset>",
  ].join("\n");
  await fs.writeFile(path.join(dir, "sitemap.xml"), xml, "utf8");
  return path.join(dir, "sitemap.xml");
}

/** Generate a fresh service-account-like key for JWT signing tests. */
function generateServiceAccountFixture() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return {
    client_email: "[email protected]",
    private_key: privateKey,
    token_uri: "https://oauth2.googleapis.com/token",
    _publicKey: publicKey, // for tests
  };
}

// ---------------------------------------------------------------------------
// 1. Sitemap parsing
// ---------------------------------------------------------------------------

test("readSitemapUrls: parses <loc> elements", async () => {
  const dir = await makeTempDir("gsc-sitemap-");
  const sitemap = await writeSitemap(dir, [
    "https://brightai.site/",
    "https://brightai.site/about/",
  ]);
  const urls = await readSitemapUrls(sitemap);
  assert.deepEqual(urls, [
    "https://brightai.site/",
    "https://brightai.site/about/",
  ]);
});

test("readSitemapUrls: dedupes repeated URLs and trims whitespace", async () => {
  const dir = await makeTempDir("gsc-sitemap-dedupe-");
  const sitemap = path.join(dir, "sitemap.xml");
  await fs.writeFile(
    sitemap,
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<urlset>",
      '  <url><loc>https://brightai.site/</loc></url>',
      '  <url><loc>  https://brightai.site/  </loc></url>', // duplicate + whitespace
      '  <url><loc>https://brightai.site/about/</loc></url>',
      "</urlset>",
    ].join("\n"),
    "utf8",
  );
  const urls = await readSitemapUrls(sitemap);
  assert.deepEqual(urls, [
    "https://brightai.site/",
    "https://brightai.site/about/",
  ]);
});

test("readSitemapUrls: returns [] for an empty sitemap", async () => {
  const dir = await makeTempDir("gsc-sitemap-empty-");
  const sitemap = path.join(dir, "sitemap.xml");
  await fs.writeFile(sitemap, '<?xml version="1.0"?>\n<urlset></urlset>\n', "utf8");
  const urls = await readSitemapUrls(sitemap);
  assert.deepEqual(urls, []);
});

// ---------------------------------------------------------------------------
// 2. bucketCoverageState
// ---------------------------------------------------------------------------

test("bucketCoverageState: maps all 4 known buckets + unknown fallback", () => {
  assert.equal(bucketCoverageState("Submitted and indexed"), "indexed");
  assert.equal(bucketCoverageState("Crawled - currently not indexed"), "crawled_not_indexed");
  assert.equal(bucketCoverageState("Discovered - currently not indexed"), "crawled_not_indexed");
  assert.equal(bucketCoverageState("Excluded by noindex tag"), "not_indexed");
  assert.equal(bucketCoverageState("Page with redirect"), "not_indexed");
  assert.equal(bucketCoverageState("Not found (404)"), "not_indexed");
  // New / unknown state should go to "unknown" so the operator sees it.
  assert.equal(bucketCoverageState("Some New Google State"), "unknown");
  assert.equal(bucketCoverageState(null), "unknown");
  assert.equal(bucketCoverageState(undefined), "unknown");
});

// ---------------------------------------------------------------------------
// 3. buildPerUrlResults
// ---------------------------------------------------------------------------

test("buildPerUrlResults: flattens API responses and records errors as unknown", () => {
  const inspections = [
    {
      url: "https://brightai.site/",
      ok: true,
      result: {
        indexStatusResult: {
          coverageState: "Submitted and indexed",
          verdict: "PASS",
          pageFetchState: "SUCCESSFUL",
          robotsTxtState: "ALLOWED",
          indexingState: "INDEXING_ALLOWED",
          lastCrawlTime: "2026-07-20T10:00:00Z",
          crawledAs: "MOBILE",
        },
      },
    },
    {
      url: "https://brightai.site/about/",
      ok: true,
      result: {
        indexStatusResult: {
          coverageState: "Crawled - currently not indexed",
          verdict: "NEUTRAL",
          pageFetchState: "SUCCESSFUL",
          robotsTxtState: "ALLOWED",
          indexingState: "INDEXING_ALLOWED",
          lastCrawlTime: "2026-07-19T10:00:00Z",
        },
      },
    },
    {
      url: "https://brightai.site/solutions/ai-firewall/",
      ok: false,
      error: "503 backend down",
    },
  ];
  const perUrl = buildPerUrlResults(inspections);
  assert.equal(perUrl.length, 3);
  assert.equal(perUrl[0].bucket, "indexed");
  assert.equal(perUrl[0].verdict, "PASS");
  assert.equal(perUrl[1].bucket, "crawled_not_indexed");
  assert.equal(perUrl[2].bucket, "unknown");
  assert.equal(perUrl[2].error, "503 backend down");
});

// ---------------------------------------------------------------------------
// 4. buildSnapshot
// ---------------------------------------------------------------------------

test("buildSnapshot: computes bucket_counts and URL lists per bucket", () => {
  const perUrl = [
    { url: "https://brightai.site/", bucket: "indexed", coverageState: "Submitted and indexed" },
    { url: "https://brightai.site/about/", bucket: "indexed", coverageState: "Submitted and indexed" },
    { url: "https://brightai.site/blog/", bucket: "crawled_not_indexed", coverageState: "Crawled - currently not indexed", lastCrawlTime: "2026-07-20T00:00:00Z" },
    { url: "https://brightai.site/sitemap-only/", bucket: "not_indexed", coverageState: "Page with redirect", pageFetchState: "SUCCESSFUL" },
    { url: "https://brightai.site/error/", bucket: "unknown", error: "429" },
  ];
  const snap = buildSnapshot({
    date: "2026-07-25",
    siteUrl: "sc-domain:brightai.site",
    sitemapPath: "dist/client/sitemap.xml",
    perUrl,
    delta: null,
  });
  assert.equal(snap.total_count, 5);
  assert.equal(snap.indexed_count, 2);
  assert.equal(snap.crawled_not_indexed_count, 1);
  assert.equal(snap.not_indexed_count, 1);
  assert.equal(snap.unknown_count, 1);
  assert.equal(snap.bucket_counts.indexed, 2);
  assert.equal(snap.crawled_not_indexed_urls.length, 1);
  assert.equal(snap.crawled_not_indexed_urls[0].url, "https://brightai.site/blog/");
  assert.equal(snap.not_indexed_urls.length, 1);
  assert.equal(snap.not_indexed_urls[0].url, "https://brightai.site/sitemap-only/");
  assert.equal(snap.unknown_urls.length, 1);
  assert.equal(snap.unknown_urls[0].url, "https://brightai.site/error/");
  assert.equal(snap.schema_version, 1);
  assert.equal(snap.date, "2026-07-25");
});

// ---------------------------------------------------------------------------
// 5. computeDelta
// ---------------------------------------------------------------------------

test("computeDelta: counts delta + classifies new/resolved/unindexed", () => {
  const previous = {
    date: "2026-07-18",
    total_count: 4,
    indexed_count: 1,
    not_indexed_count: 1,
    crawled_not_indexed_count: 1,
    unknown_count: 1,
    per_url: [
      { url: "https://brightai.site/a/", bucket: "indexed" },
      { url: "https://brightai.site/b/", bucket: "crawled_not_indexed" },
      { url: "https://brightai.site/c/", bucket: "not_indexed" },
      { url: "https://brightai.site/d/", bucket: "unknown" },
    ],
  };
  const current = {
    date: "2026-07-25",
    total_count: 4,
    indexed_count: 2,
    not_indexed_count: 1,
    crawled_not_indexed_count: 0,
    unknown_count: 1,
    per_url: [
      { url: "https://brightai.site/a/", bucket: "indexed" },
      // /b/ resolved: crawled_not_indexed -> indexed
      { url: "https://brightai.site/b/", bucket: "indexed" },
      { url: "https://brightai.site/c/", bucket: "not_indexed" },
      // /d/ still unknown
      { url: "https://brightai.site/d/", bucket: "unknown" },
    ],
  };
  const delta = computeDelta(current, { file: "2026-07-18.json", data: previous });
  assert.equal(delta.has_previous, true);
  assert.equal(delta.previous_file, "2026-07-18.json");
  assert.equal(delta.days_between, 7);
  assert.equal(delta.indexed_count, 1);
  assert.equal(delta.crawled_not_indexed_count, -1);
  assert.deepEqual(delta.newly_resolved, ["https://brightai.site/b/"]);
  assert.deepEqual(delta.newly_indexed, []);
  assert.deepEqual(delta.newly_unindexed, []);
});

test("computeDelta: detects newly_unindexed when a previously-indexed URL drops", () => {
  const previous = {
    date: "2026-07-18",
    total_count: 2,
    indexed_count: 2,
    not_indexed_count: 0,
    crawled_not_indexed_count: 0,
    unknown_count: 0,
    per_url: [
      { url: "https://brightai.site/x/", bucket: "indexed" },
      { url: "https://brightai.site/y/", bucket: "indexed" },
    ],
  };
  const current = {
    date: "2026-07-25",
    total_count: 2,
    indexed_count: 1,
    not_indexed_count: 1,
    crawled_not_indexed_count: 0,
    unknown_count: 0,
    per_url: [
      { url: "https://brightai.site/x/", bucket: "indexed" },
      { url: "https://brightai.site/y/", bucket: "not_indexed" },
    ],
  };
  const delta = computeDelta(current, { file: "2026-07-18.json", data: previous });
  assert.deepEqual(delta.newly_unindexed, ["https://brightai.site/y/"]);
});

test("computeDelta: returns has_previous=false when there's no prior snapshot", () => {
  const current = {
    date: "2026-07-25",
    total_count: 1,
    indexed_count: 1,
    not_indexed_count: 0,
    crawled_not_indexed_count: 0,
    unknown_count: 0,
    per_url: [{ url: "https://brightai.site/first/", bucket: "indexed" }],
  };
  const delta = computeDelta(current, null);
  assert.equal(delta.has_previous, false);
});

// ---------------------------------------------------------------------------
// 6. findPreviousSnapshot (covered indirectly via run dry-run)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 7. signServiceAccountJwt — round-trip signature verification
// ---------------------------------------------------------------------------

test("signServiceAccountJwt: produces a verifiable RS256 token", () => {
  const sa = generateServiceAccountFixture();
  const jwt = signServiceAccountJwt(sa, 1_700_000_000);
  const [headerB64, payloadB64, signatureB64] = jwt.split(".");
  assert.ok(headerB64 && payloadB64 && signatureB64, "JWT must have 3 parts");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  assert.equal(header.alg, "RS256");
  assert.equal(header.typ, "JWT");
  assert.equal(payload.iss, sa.client_email);
  assert.equal(payload.aud, sa.token_uri);
  assert.equal(payload.iat, 1_700_000_000);
  assert.equal(payload.exp, 1_700_000_000 + 3600);
  // Verify the signature
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const ok = verifier.verify(sa._publicKey, signatureB64, "base64url");
  assert.equal(ok, true, "JWT signature must verify with the public key");
});

test("signServiceAccountJwt: throws when private_key is missing", () => {
  assert.throws(
    () => signServiceAccountJwt({ client_email: "[email protected]" }, 1_700_000_000),
    /private_key/,
  );
});

// ---------------------------------------------------------------------------
// 8. parseArgs
// ---------------------------------------------------------------------------

test("parseArgs: applies defaults", () => {
  const args = parseArgs(["node", "gsc-export.mjs"]);
  assert.equal(args.dryRun, false);
  assert.equal(args.sitemap, "dist/client/sitemap.xml");
  assert.equal(args.out, "report/gsc");
  assert.equal(args.concurrency, 10);
});

test("parseArgs: parses --dry-run + --sitemap= + --concurrency=", () => {
  const args = parseArgs([
    "node",
    "gsc-export.mjs",
    "--dry-run",
    "--sitemap=custom/sitemap.xml",
    "--concurrency=4",
    "--out=tmp/gsc",
  ]);
  assert.equal(args.dryRun, true);
  assert.equal(args.sitemap, "custom/sitemap.xml");
  assert.equal(args.out, "tmp/gsc");
  assert.equal(args.concurrency, 4);
});

// ---------------------------------------------------------------------------
// 9. todayUtcIso
// ---------------------------------------------------------------------------

test("todayUtcIso: returns YYYY-MM-DD", () => {
  const d = todayUtcIso();
  assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
});

// ---------------------------------------------------------------------------
// 10. run dry-run end-to-end
// ---------------------------------------------------------------------------

test("run: dry-run writes a JSON snapshot with delta and exits cleanly", async () => {
  const root = await makeTempDir("gsc-run-");
  const sitemap = await writeSitemap(root, [
    "https://brightai.site/",
    "https://brightai.site/about/",
    "https://brightai.site/blog/",
    "https://brightai.site/solutions/ai-firewall/",
    "https://brightai.site/kernel/",
  ]);
  const outDir = path.join(root, "report", "gsc");
  const logs = [];
  const result = await run({
    argv: ["node", "gsc-export.mjs", "--dry-run", `--sitemap=${sitemap}`, `--out=${outDir}`],
    env: {},
    logger: { info: (m) => logs.push(m), warn: () => {}, error: () => {} },
  });
  assert.ok(result.outFile.endsWith(".json"));
  const fileContent = await fs.readFile(result.outFile, "utf8");
  const snap = JSON.parse(fileContent);
  assert.equal(snap.total_count, 5);
  // Dry-run uses a 5-bucket cycle: indexed, indexed, crawled_not_indexed, not_indexed, unknown
  // (5 URLs → 2 indexed, 1 crawled, 1 not_indexed, 1 unknown)
  assert.equal(snap.indexed_count, 2);
  assert.equal(snap.crawled_not_indexed_count, 1);
  assert.equal(snap.not_indexed_count, 1);
  assert.equal(snap.unknown_count, 1);
  assert.equal(snap.delta.has_previous, false, "no prior snapshot in this test");
  // Today's UTC date is in the file name
  const today = todayUtcIso();
  assert.ok(result.outFile.endsWith(`${today}.json`));
});

test("run: dry-run computes delta when a previous snapshot exists", async () => {
  const root = await makeTempDir("gsc-run-delta-");
  const sitemap = await writeSitemap(root, [
    "https://brightai.site/",
    "https://brightai.site/about/",
    "https://brightai.site/blog/",
  ]);
  const outDir = path.join(root, "report", "gsc");
  await fs.mkdir(outDir, { recursive: true });

  // Plant a "previous" snapshot: 1 indexed, 2 crawled_not_indexed.
  const prev = {
    schema_version: 1,
    date: "2026-07-18",
    site_url: "sc-domain:brightai.site",
    sitemap_path: "old-sitemap.xml",
    total_count: 3,
    indexed_count: 1,
    not_indexed_count: 0,
    crawled_not_indexed_count: 2,
    unknown_count: 0,
    bucket_counts: { indexed: 1, not_indexed: 0, crawled_not_indexed: 2, unknown: 0 },
    crawled_not_indexed_urls: [],
    not_indexed_urls: [],
    unknown_urls: [],
    delta: { has_previous: false },
    per_url: [
      { url: "https://brightai.site/", bucket: "indexed" },
      { url: "https://brightai.site/about/", bucket: "crawled_not_indexed" },
      { url: "https://brightai.site/blog/", bucket: "crawled_not_indexed" },
    ],
  };
  await fs.writeFile(path.join(outDir, "2026-07-18.json"), JSON.stringify(prev), "utf8");

  const result = await run({
    argv: ["node", "gsc-export.mjs", "--dry-run", `--sitemap=${sitemap}`, `--out=${outDir}`],
    env: {},
    logger: { info: () => {}, warn: () => {}, error: () => {} },
  });
  const snap = JSON.parse(await fs.readFile(result.outFile, "utf8"));
  assert.equal(snap.delta.has_previous, true);
  assert.equal(snap.delta.previous_file, "2026-07-18.json");
  assert.equal(snap.delta.indexed_count, snap.indexed_count - 1);
});

test("run: live mode fails fast when GSC_SERVICE_ACCOUNT_JSON is missing", async () => {
  const root = await makeTempDir("gsc-run-noauth-");
  const sitemap = await writeSitemap(root, ["https://brightai.site/"]);
  await assert.rejects(
    () =>
      run({
        argv: ["node", "gsc-export.mjs", `--sitemap=${sitemap}`],
        env: {}, // no GSC_SERVICE_ACCOUNT_JSON
        logger: { info: () => {}, warn: () => {}, error: () => {} },
      }),
    /GSC_SERVICE_ACCOUNT_JSON/,
  );
});
