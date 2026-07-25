#!/usr/bin/env node
/**
 * gsc-export.mjs — BAI-IDX-13 (2026-07-25)
 *
 * Weekly Google Search Console (GSC) indexation snapshot.
 *
 * What it does:
 *   1. Reads URLs from dist/client/sitemap.xml (the clean sitemap, NOT
 *      sitemap-0.xml — per DEC-IP-07-001, the clean one is the source of truth).
 *   2. Calls the URL Inspection API (searchconsole.googleapis.com) for each URL
 *      using a service-account JWT (no SDK — pure crypto + fetch).
 *   3. Buckets URLs by coverage state into:
 *        - indexed          (Submitted and indexed)
 *        - crawled_not_indexed (Crawled - currently not indexed, Discovered - currently not indexed)
 *        - not_indexed      (Excluded, Page with redirect, Not found (404), etc.)
 *        - unknown          (errors, API failures, missing coverageState)
 *   4. Writes a JSON snapshot to report/gsc/YYYY-MM-DD.json.
 *   5. Reads the most recent prior snapshot from report/gsc/ and computes
 *      a week-over-week delta for the bucket counts.
 *
 * Acceptance (per BAI-IDX-13 ticket):
 *   - report/gsc/ contains a JSON file per run.
 *   - Each file has: indexed_count, not_indexed_count, crawled_not_indexed_urls.
 *   - Diff vs previous week is included.
 *
 * Usage:
 *   # Live (requires GSC_SERVICE_ACCOUNT_JSON env var with the SA key JSON):
 *   GSC_SERVICE_ACCOUNT_JSON="$(cat /path/to/sa.json)" node scripts/gsc-export.mjs
 *
 *   # Dry run (no API calls, uses synthetic fixture):
 *   node scripts/gsc-export.mjs --dry-run
 *
 *   # Custom sitemap / output dir:
 *   node scripts/gsc-export.mjs --sitemap=dist/client/sitemap.xml --out=report/gsc
 *
 *   # Custom site URL (default sc-domain:brightai.site):
 *   GSC_SITE_URL=sc-domain:brightai.site node scripts/gsc-export.mjs
 *
 * Quotas (URL Inspection API):
 *   - 2,000 inspections/day per site.
 *   - 600 inspections/minute per project.
 *   - 180 URLs (the current sitemap size) fits well within both limits.
 *
 * Required env (live mode):
 *   GSC_SERVICE_ACCOUNT_JSON   string. Full JSON content of a service-account
 *                              key file. The corresponding service account
 *                              email must be added as an Owner in GSC for
 *                              sc-domain:brightai.site (or whichever
 *                              GSC_SITE_URL you set).
 *
 * Optional env:
 *   GSC_SITE_URL              default 'sc-domain:brightai.site'.
 *
 * GitHub Actions:
 *   Wired in .github/workflows/weekly-gsc.yml. Runs Sundays 06:00 UTC.
 *   Commits the new report/gsc/YYYY-MM-DD.json back to the repo.
 *
 * Idempotency:
 *   - Re-running on the same UTC date overwrites the same filename.
 *   - The first run on a new date creates a new file.
 *   - The delta is always computed against the most recent prior file
 *     (not necessarily 7 days back — handles skipped weeks gracefully).
 *
 * Failure modes:
 *   - Missing GSC_SERVICE_ACCOUNT_JSON in live mode: exit 1 with a clear
 *     error. No file is written.
 *   - API errors per URL: the URL is recorded as "unknown" with the error
 *     message. The script continues (does not abort) so a single bad URL
 *     cannot poison the whole snapshot.
 *   - Quota exhaustion: retried up to 3 times with exponential backoff
 *     (1s, 2s, 4s). After that, the URL is recorded as "unknown".
 *
 * Reversal cost: low. Delete the script + workflow + report/gsc/ + secret.
 *
 * Author: BrightAI Workspace Agent
 * Date: 2026-07-25
 * License: internal
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createSign, randomUUID, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// 1. Constants & config
// ---------------------------------------------------------------------------

const HOST = "brightai.site";
const DEFAULT_SITE_URL = `sc-domain:${HOST}`;
const SITEMAP_PATH = "dist/client/sitemap.xml";
const OUTPUT_DIR = "report/gsc";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const INSPECT_URL =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

/** Coverage states we treat as "indexed". */
const INDEXED_STATES = new Set(["Submitted and indexed"]);

/** Coverage states we treat as "crawled but not yet indexed". */
const CRAWLED_NOT_INDEXED_STATES = new Set([
  "Crawled - currently not indexed",
  "Discovered - currently not indexed",
]);

/** Coverage states we treat as "not indexed" (other exclusions). */
const NOT_INDEXED_STATES = new Set([
  "Excluded by noindex tag",
  "Excluded by robots.txt",
  "Excluded by 'noindex' detected in 'robots' meta tag",
  "Blocked by robots.txt",
  "Blocked by page removal",
  "Page with redirect",
  "Soft 404",
  "Not found (404)",
  "Duplicate without user-selected canonical",
  "Duplicate, Google chose different canonical than user",
  "Alternate page with proper canonical tag",
]);

// ---------------------------------------------------------------------------
// 2. CLI arg parsing
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const args = {
    sitemap: SITEMAP_PATH,
    out: OUTPUT_DIR,
    dryRun: false,
    concurrency: 10,
  };
  for (const arg of argv.slice(2)) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--sitemap=")) args.sitemap = arg.slice("--sitemap=".length);
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else if (arg.startsWith("--concurrency=")) {
      const n = Number(arg.slice("--concurrency=".length));
      if (Number.isFinite(n) && n > 0) args.concurrency = n;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/gsc-export.mjs [options]

Options:
  --sitemap=<path>     Path to sitemap XML (default: ${SITEMAP_PATH})
  --out=<dir>          Output directory for JSON snapshots (default: ${OUTPUT_DIR})
  --concurrency=<n>    Concurrent URL inspections (default: 10)
  --dry-run            Skip API calls, write a synthetic snapshot for testing
  --help, -h           Show this help

Required env (live mode only):
  GSC_SERVICE_ACCOUNT_JSON   Full JSON content of a GSC service account key.

Optional env:
  GSC_SITE_URL   default: ${DEFAULT_SITE_URL}`);
}

// ---------------------------------------------------------------------------
// 3. Sitemap parsing
// ---------------------------------------------------------------------------

/** Read URLs from sitemap.xml. Returns deduped array of absolute URLs. */
export async function readSitemapUrls(sitemapPath) {
  const xml = await readFile(sitemapPath, "utf8");
  const matches = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
  const urls = [];
  const seen = new Set();
  for (const m of matches) {
    const url = m[1].trim();
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

// ---------------------------------------------------------------------------
// 4. Service account JWT auth (no SDK — pure crypto)
// ---------------------------------------------------------------------------

/** Build a self-signed RS256 JWT for the service-account assertion. */
export function signServiceAccountJwt(serviceAccount, nowSec) {
  const { client_email, private_key, token_uri } = serviceAccount;
  if (!client_email || !private_key) {
    throw new Error(
      "Service account JSON must contain client_email and private_key.",
    );
  }
  const iat = nowSec ?? Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1h max for a service-account assertion
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: client_email,
    scope: SCOPES.join(" "),
    aud: token_uri ?? TOKEN_URL,
    iat,
    exp,
  };
  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(private_key).toString("base64url");
  return `${signingInput}.${signature}`;
}

/** Exchange the signed JWT for a Google OAuth2 access token. */
export async function fetchAccessToken(serviceAccount) {
  const assertion = signServiceAccountJwt(serviceAccount);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `OAuth2 token exchange failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth2 response missing access_token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ---------------------------------------------------------------------------
// 5. URL Inspection API
// ---------------------------------------------------------------------------

/**
 * Inspect a single URL via the URL Inspection API.
 * Returns the raw inspectionResult (or null on hard error).
 */
export async function inspectUrl(accessToken, siteUrl, inspectionUrl, { logger } = {}) {
  const res = await fetch(INSPECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl,
      languageCode: "en-US",
    }),
  });

  if (res.status === 429 || res.status === 500 || res.status === 503) {
    const err = new Error(`Inspect retryable: ${res.status} ${res.statusText}`);
    err.retryable = true;
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Inspect ${inspectionUrl} failed: ${res.status} — ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.inspectionResult ?? null;
}

/** Inspect with retry + exponential backoff. Returns { ok, result, error }. */
export async function inspectUrlWithRetry(
  accessToken,
  siteUrl,
  inspectionUrl,
  { maxRetries = 3, logger = console } = {},
) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await inspectUrl(accessToken, siteUrl, inspectionUrl, { logger });
      return { ok: true, result };
    } catch (err) {
      lastErr = err;
      if (!err.retryable || attempt === maxRetries) break;
      const delayMs = 1000 * 2 ** attempt; // 1s, 2s, 4s
      logger.warn?.(
        `  retry ${attempt + 1}/${maxRetries} for ${inspectionUrl} in ${delayMs}ms (status=${err.status})`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return { ok: false, error: String(lastErr?.message ?? lastErr) };
}

/** Run a worker pool: process items in parallel with a concurrency cap. */
export async function runPool(items, worker, concurrency, logger = console) {
  const results = new Array(items.length);
  let cursor = 0;
  const launch = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      const item = items[idx];
      try {
        results[idx] = await worker(item, idx);
      } catch (err) {
        logger.error?.(`Worker failed on item ${idx}: ${err.message}`);
        results[idx] = { ok: false, error: String(err.message) };
      }
    }
  };
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, launch);
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// 6. Coverage state bucketing
// ---------------------------------------------------------------------------

/** Classify a coverage state into one of our 4 buckets. */
export function bucketCoverageState(coverageState) {
  if (!coverageState) return "unknown";
  if (INDEXED_STATES.has(coverageState)) return "indexed";
  if (CRAWLED_NOT_INDEXED_STATES.has(coverageState)) return "crawled_not_indexed";
  if (NOT_INDEXED_STATES.has(coverageState)) return "not_indexed";
  // Anything else (including new states we haven't enumerated) goes to unknown
  // so the operator can decide what to do.
  return "unknown";
}

/** Build the per-URL result list from API responses. */
export function buildPerUrlResults(inspections) {
  const perUrl = [];
  for (const entry of inspections) {
    const { url, ok, result, error } = entry;
    if (!ok) {
      perUrl.push({ url, bucket: "unknown", error });
      continue;
    }
    const status = result?.indexStatusResult;
    const coverageState = status?.coverageState ?? null;
    perUrl.push({
      url,
      bucket: bucketCoverageState(coverageState),
      coverageState,
      verdict: status?.verdict ?? null,
      pageFetchState: status?.pageFetchState ?? null,
      robotsTxtState: status?.robotsTxtState ?? null,
      indexingState: status?.indexingState ?? null,
      lastCrawlTime: status?.lastCrawlTime ?? null,
      crawledAs: status?.crawledAs ?? null,
    });
  }
  return perUrl;
}

// ---------------------------------------------------------------------------
// 7. Delta computation
// ---------------------------------------------------------------------------

/** Find the most recent prior snapshot file (excluding `currentFile`). */
export async function findPreviousSnapshot(outDir, currentFile) {
  let entries;
  try {
    entries = await readdir(outDir);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  const candidates = entries
    .filter((name) => name.endsWith(".json") && name !== currentFile)
    .sort();
  if (candidates.length === 0) return null;
  const last = candidates[candidates.length - 1];
  try {
    const content = await readFile(path.join(outDir, last), "utf8");
    return { file: last, data: JSON.parse(content) };
  } catch {
    return null;
  }
}

/** Compute delta vs previous snapshot. Counts and bucket URLs. */
export function computeDelta(current, previous) {
  if (!previous) {
    return { has_previous: false };
  }
  const prev = previous.data;
  const delta = {
    has_previous: true,
    previous_file: previous.file,
    previous_date: prev.date ?? null,
    days_between: prev.date
      ? Math.round(
          (new Date(current.date).getTime() - new Date(prev.date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
    indexed_count: current.indexed_count - (prev.indexed_count ?? 0),
    not_indexed_count: current.not_indexed_count - (prev.not_indexed_count ?? 0),
    crawled_not_indexed_count:
      current.crawled_not_indexed_count - (prev.crawled_not_indexed_count ?? 0),
    unknown_count: current.unknown_count - (prev.unknown_count ?? 0),
    total_count: current.total_count - (prev.total_count ?? 0),
    newly_indexed: [],
    newly_unindexed: [],
    newly_crawled_not_indexed: [],
    newly_resolved: [], // was crawled_not_indexed, now indexed
  };

  const prevByUrl = new Map();
  for (const r of prev.per_url ?? []) prevByUrl.set(r.url, r.bucket);

  for (const r of current.per_url ?? []) {
    const prevBucket = prevByUrl.get(r.url);
    if (prevBucket === r.bucket) continue;
    if (r.bucket === "indexed" && prevBucket === "crawled_not_indexed") {
      delta.newly_resolved.push(r.url);
    } else if (r.bucket === "indexed") {
      delta.newly_indexed.push(r.url);
    } else if (r.bucket === "crawled_not_indexed") {
      delta.newly_crawled_not_indexed.push(r.url);
    } else if (prevBucket === "indexed" && r.bucket !== "indexed") {
      delta.newly_unindexed.push(r.url);
    }
  }
  return delta;
}

// ---------------------------------------------------------------------------
// 8. Snapshot assembly + output
// ---------------------------------------------------------------------------

/** Today's UTC date as YYYY-MM-DD. */
export function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}

export function buildSnapshot({ date, siteUrl, sitemapPath, perUrl, delta }) {
  const counts = { indexed: 0, not_indexed: 0, crawled_not_indexed: 0, unknown: 0 };
  for (const r of perUrl) counts[r.bucket] = (counts[r.bucket] ?? 0) + 1;

  const crawledNotIndexedUrls = perUrl
    .filter((r) => r.bucket === "crawled_not_indexed")
    .map((r) => ({ url: r.url, coverageState: r.coverageState, lastCrawlTime: r.lastCrawlTime }));

  const notIndexedUrls = perUrl
    .filter((r) => r.bucket === "not_indexed")
    .map((r) => ({ url: r.url, coverageState: r.coverageState, pageFetchState: r.pageFetchState }));

  const unknownUrls = perUrl
    .filter((r) => r.bucket === "unknown")
    .map((r) => ({ url: r.url, error: r.error ?? "no inspection result" }));

  return {
    schema_version: 1,
    date,
    site_url: siteUrl,
    sitemap_path: sitemapPath,
    total_count: perUrl.length,
    indexed_count: counts.indexed,
    not_indexed_count: counts.not_indexed,
    crawled_not_indexed_count: counts.crawled_not_indexed,
    unknown_count: counts.unknown,
    bucket_counts: {
      indexed: counts.indexed,
      not_indexed: counts.not_indexed,
      crawled_not_indexed: counts.crawled_not_indexed,
      unknown: counts.unknown,
    },
    crawled_not_indexed_urls: crawledNotIndexedUrls,
    not_indexed_urls: notIndexedUrls,
    unknown_urls: unknownUrls,
    delta,
    per_url: perUrl,
  };
}

// ---------------------------------------------------------------------------
// 9. Dry-run fixture (for tests + local validation)
// ---------------------------------------------------------------------------

/**
 * Build a synthetic per_url list that mimics what the real API would return.
 * Used for tests + `--dry-run` so the operator can preview the file shape
 * without burning quota.
 */
export function buildDryRunPerUrl(urls) {
  const buckets = ["indexed", "indexed", "crawled_not_indexed", "not_indexed", "unknown"];
  return urls.map((url, i) => {
    const bucket = buckets[i % buckets.length];
    return {
      url,
      bucket,
      coverageState:
        bucket === "indexed"
          ? "Submitted and indexed"
          : bucket === "crawled_not_indexed"
            ? "Crawled - currently not indexed"
            : bucket === "not_indexed"
              ? "Excluded by noindex tag"
              : null,
      verdict: bucket === "indexed" ? "PASS" : "NEUTRAL",
      pageFetchState: bucket === "unknown" ? null : "SUCCESSFUL",
      robotsTxtState: "ALLOWED",
      indexingState: bucket === "indexed" ? "INDEXING_ALLOWED" : null,
      lastCrawlTime:
        bucket === "unknown"
          ? null
          : new Date(Date.now() - (i % 30) * 86400_000).toISOString(),
      crawledAs: bucket === "indexed" ? "MOBILE" : null,
    };
  });
}

// ---------------------------------------------------------------------------
// 10. Main
// ---------------------------------------------------------------------------

export async function run({ argv = process.argv, env = process.env, logger = console, fsImpl = null } = {}) {
  const args = parseArgs(argv);
  const siteUrl = env.GSC_SITE_URL || DEFAULT_SITE_URL;
  const date = todayUtcIso();
  const outFile = path.join(args.out, `${date}.json`);

  // Read sitemap URLs
  logger.info?.(`Reading sitemap: ${args.sitemap}`);
  const urls = await readSitemapUrls(args.sitemap);
  logger.info?.(`Found ${urls.length} URLs`);

  if (urls.length === 0) {
    throw new Error(`No URLs found in sitemap: ${args.sitemap}`);
  }

  // Inspect each URL
  let perUrl;
  if (args.dryRun) {
    logger.info?.(`--dry-run: skipping API calls, using synthetic bucket distribution`);
    perUrl = buildDryRunPerUrl(urls);
  } else {
    const saJson = env.GSC_SERVICE_ACCOUNT_JSON;
    if (!saJson) {
      throw new Error(
        "GSC_SERVICE_ACCOUNT_JSON env var is required for live mode. " +
          "Set it to the full JSON content of a GSC service account key, " +
          "or pass --dry-run to skip API calls.",
      );
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(saJson);
    } catch (err) {
      throw new Error(`GSC_SERVICE_ACCOUNT_JSON is not valid JSON: ${err.message}`);
    }

    logger.info?.(`Fetching OAuth2 access token…`);
    const accessToken = await fetchAccessToken(serviceAccount);
    logger.info?.(`Inspecting ${urls.length} URLs (concurrency=${args.concurrency})…`);

    const inspections = await runPool(
      urls,
      async (url) => {
        const { ok, result, error } = await inspectUrlWithRetry(
          accessToken,
          siteUrl,
          url,
          { logger },
        );
        return { url, ok, result, error };
      },
      args.concurrency,
      logger,
    );

    perUrl = buildPerUrlResults(inspections);

    const failed = inspections.filter((i) => !i.ok).length;
    if (failed > 0) {
      logger.warn?.(`${failed} URL(s) failed after retries; recorded as 'unknown'`);
    }
  }

  // Find previous snapshot and compute delta
  const prev = await findPreviousSnapshot(args.out, path.basename(outFile));
  const draft = buildSnapshot({
    date,
    siteUrl,
    sitemapPath: args.sitemap,
    perUrl,
    delta: null,
  });
  const delta = computeDelta(draft, prev);
  const snapshot = { ...draft, delta };

  // Write output
  await mkdir(args.out, { recursive: true });
  await writeFile(outFile, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  logger.info?.(`Wrote ${outFile}`);

  // Summary to stdout
  logger.info?.(`Summary:
  total:               ${snapshot.total_count}
  indexed:             ${snapshot.indexed_count}
  crawled_not_indexed: ${snapshot.crawled_not_indexed_count}
  not_indexed:         ${snapshot.not_indexed_count}
  unknown:             ${snapshot.unknown_count}
  ${prev ? `delta_vs:           ${prev.file}` : "delta_vs:           (no prior snapshot)"}`);

  return { outFile, snapshot };
}

// CLI entry: only when run directly (not when imported for tests).
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  run().catch((err) => {
    console.error(`❌ gsc-export failed: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });
}
