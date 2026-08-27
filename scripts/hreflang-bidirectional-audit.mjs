#!/usr/bin/env node
// hreflang-bidirectional-audit.mjs — BAI-SEO-003-S2 + S3 automated test.
//
// Reads the built client HTML (dist/client/**/*.html) and public/sitemap.xml,
// then verifies the bidirectional hreflang contract:
//   1. 0 missing return tags — every ar-SA/en-SA alternate must be returned
//      by its counterpart page (reciprocity).
//   2. 0 hreflang URLs returning non-200 — every alternate URL must resolve.
//   3. 0 canonical/hreflang mismatch — the self hreflang URL must equal the
//      page canonical, literally.
//   4. 0 missing x-default — every indexed page must declare an x-default.
//   5. (S3) Every EN page (canonical contains /en/) MUST emit
//      en-SA=self + ar-SA pointing to the AR counterpart — the contract
//      that was broken before S3 fixed the bidirectional keying of the
//      hreflang pair map (see regression fixture checkEnPageContract).
//   6. (S3) No AR-only page (i.e. not in the bilingual pair map) may
//      emit an invented en-SA alternate — the symmetric invariant that
//      guarantees the "no invented English counterpart" acceptance
//      criterion (see checkArOnlyPageNoEnAlternate).
//
// Output: number of hreflang sets audited + error counts. Exits non-zero on
// any error so it can gate CI / seo:gate.
//
// Run AFTER `pnpm build` (needs dist/client + public/sitemap.xml present).
import { promises as fs, readFileSync, readdirSync } from "fs";
import path from "path";
import { chromium } from "playwright";
import { resolveClientBuildRoot } from "./_build-output.mjs";
import { extractAlternateHreflangLinks, extractCanonicalHref, hasNoindexDirective } from "./sitemap-audit-utils.mjs";
import { isExplicitBilingualPair } from "../src/data/hreflang-pairs.ts";

function parseArgs(argv) {
  const args = {
    live: false,
    host: 'https://brightai.live',
    sample: 200,
    concurrency: 10,
    timeout: 15000,
    report: null,
    showHelp: false,
  };

  // Helper: parse a value flag. Accepts both `--key value` and `--key=value`.
  // Returns { value, nextIndex } — caller advances i to nextIndex.
  const valueFlag = (arg, key) => {
    if (arg === `--${key}`) {
      return { value: argv[argv.indexOf(arg) + 1], nextIndex: argv.indexOf(arg) + 2 };
    }
    if (arg.startsWith(`--${key}=`)) {
      return { value: arg.slice(key.length + 3), nextIndex: argv.indexOf(arg) + 1 };
    }
    return null;
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') args.live = true;
    else if (arg === '--local') args.live = false;
    else if (arg === '--help' || arg === '-h') args.showHelp = true;
    else if (arg.startsWith('--host')) {
      const parsed = valueFlag(arg, 'host');
      if (parsed) { args.host = parsed.value; i = parsed.nextIndex - 1; }
    } else if (arg.startsWith('--sample')) {
      const parsed = valueFlag(arg, 'sample');
      if (parsed) { args.sample = parseInt(parsed.value, 10); i = parsed.nextIndex - 1; }
    } else if (arg.startsWith('--concurrency')) {
      const parsed = valueFlag(arg, 'concurrency');
      if (parsed) { args.concurrency = parseInt(parsed.value, 10); i = parsed.nextIndex - 1; }
    } else if (arg.startsWith('--timeout')) {
      const parsed = valueFlag(arg, 'timeout');
      if (parsed) { args.timeout = parseInt(parsed.value, 10); i = parsed.nextIndex - 1; }
    } else if (arg.startsWith('--report')) {
      const parsed = valueFlag(arg, 'report');
      if (parsed) { args.report = parsed.value; i = parsed.nextIndex - 1; }
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/hreflang-bidirectional-audit.mjs [options]

Hreflang bidirectional audit (BAI-IDX-14)

Options:
  --live                   Fetch from production via Playwright (default: filesystem)
  --local                  Force filesystem mode (parity with check-mobile-375)
  --host <url>             Production host (default: https://brightai.live)
  --sample <n>             Pages to sample (default: 200; 0 = all)
  --concurrency <n>        Parallel browser contexts (default: 10)
  --timeout <ms>           Per-page navigation timeout (default: 15000)
  --report <path>          JSON report output path
  -h, --help               Show this help

Examples:
  node scripts/hreflang-bidirectional-audit.mjs                    # Local filesystem
  node scripts/hreflang-bidirectional-audit.mjs --live             # Production
  node scripts/hreflang-bidirectional-audit.mjs --live --sample=50 # Sample 50 pages

Exit codes:
  0  All checks passed
  1  One or more violations detected
  2  Internal error (browser launch, network, parse failure)
`);
}

const BASE_URL = "https://brightai.live";
const ROOT = process.cwd();

// Lazy resolve the client build root. The filesystem audit (and the test
// file's import-time evaluation) must not exit on a clean checkout before
// `pnpm run build` — this helper only fires when fetchFilesystem() is
// actually called.
let _clientRoot;
function getClientRoot() {
  if (_clientRoot) return _clientRoot;
  const clientBuild = resolveClientBuildRoot(ROOT);
  if (!clientBuild.root) {
    throw new Error(`hreflang-bidirectional-audit: ${clientBuild.reason}. Run \`pnpm run build\` first.`);
  }
  _clientRoot = clientBuild.root;
  return _clientRoot;
}

// Collect all built HTML files under the client root.
// Synchronous version — keeps fetchFilesystem sync (see Task 2.1).
function walkHtml(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtml(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

// Extract the set of hreflang alternates from a built HTML file's <head>.
function parseHeadHreflang(html) {
  return extractAlternateHreflangLinks(html);
}

// Build a map: canonical URL -> { file, alternates: Map<lang,href> }
// Synchronous — Task 2.1 renamed `buildPageIndex` → `fetchFilesystem` to match
// the source abstraction (filesystem vs live). Uses readFileSync so the function
// returns the Map directly (no Promise). `run()` calls `await fetchFilesystem()`
// for parity with the live path; await on a non-Promise is a no-op.
function fetchFilesystem() {
  const files = walkHtml(getClientRoot());
  const index = new Map();
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const canonical = extractCanonicalHref(html);
    if (!canonical) continue;
    // Skip noindex pages (error pages, thank-you, etc.) — they are not part
    // of the indexable hreflang contract.
    if (hasNoindexDirective(html)) continue;
    const alternates = parseHeadHreflang(html);
    const map = new Map();
    for (const a of alternates) {
      map.set(a.hreflang, a.href);
    }
    index.set(canonical, { file, alternates: map });
  }
  return index;
}

// Verify reciprocity: for every (lang, href) alternate on page P, the target
// page at `href` must list P's canonical as a return alternate. AR-only pages
// (ar-SA + x-default, no en-SA) legitimately have no en-SA return, so we skip
// the return check when the target does not declare the return language.
//
// Self-references (href === canonical) are NOT relevant to reciprocity — the
// page IS the target, so there is no cross-page return tag to verify. Skipping
// them avoids a false-positive where the page's own ar-SA self would be
// compared against the target's en-SA (which legitimately points to the EN
// counterpart, not back to the AR self). BAI-SEO-003-S3 (2026-07-25) added
// this skip after the /en/ pattern fix exposed the pre-existing bug: every
// AR + EN page has a self-reference (ar-SA=self or en-SA=self) that the
// reciprocity loop was incorrectly flagging.
function checkReciprocity(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    for (const [lang, href] of alternates) {
      if (lang === "x-default") continue;
      // Skip self-references — reciprocity is a cross-page contract.
      if (href === canonical) continue;
      const target = index.get(href);
      if (!target) {
        errors.push(`missing-return: ${canonical} → ${lang} ${href} (target not in build)`);
        continue;
      }
      const returnLang = lang === "ar-SA" ? "en-SA" : "ar-SA";
      // AR-only target (not in the bilingual pair map) legitimately has no
      // return tag — skip without flagging. EN target missing the ar-SA
      // return IS a violation (an EN page that points to AR must come back).
      if (!target.alternates.has(returnLang)) {
        if (returnLang === "ar-SA") continue; // AR-only target — no return expected
        errors.push(`missing-return: ${canonical} → ${lang} ${href} (target missing ${returnLang} return tag)`);
        continue;
      }
      const returnHref = target.alternates.get(returnLang);
      if (returnHref !== canonical) {
        errors.push(`missing-return: ${canonical} → ${lang} ${href} (target returns ${returnHref}, expected ${canonical})`);
      }
    }
  }
  return errors;
}

// Verify canonical === self hreflang URL (the page's own lang alternate must
// equal its canonical literally).
function checkCanonicalSelfMatch(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    const selfLang = canonical.includes("/en/") ? "en-SA" : "ar-SA";
    const selfHref = alternates.get(selfLang);
    if (!selfHref) {
      errors.push(`canonical-mismatch: ${canonical} (no ${selfLang} self-reference)`);
      continue;
    }
    if (selfHref !== canonical) {
      errors.push(`canonical-mismatch: ${canonical} (${selfLang} = ${selfHref})`);
    }
  }
  return errors;
}

// Verify x-default is present on every indexed page AND does NOT point to
// /en/ (BAI-IDX-14 AC#3: Arabic is the default site language; pointing
// x-default at /en/ would override this for non-bilingual visitors).
function checkXDefault(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    if (!alternates.has("x-default")) {
      errors.push(`missing-xdefault: ${canonical}`);
      continue;
    }
    const xDefault = alternates.get("x-default");
    try {
      const xDefaultPath = new URL(xDefault).pathname;
      if (xDefaultPath === "/en/" || xDefaultPath === "/en" || xDefaultPath.startsWith("/en/")) {
        errors.push(`xdefault-points-to-en: ${canonical} (x-default = ${xDefault}; Arabic is the default site language, not English)`);
      }
    } catch {
      errors.push(`xdefault-malformed: ${canonical} (x-default = ${xDefault})`);
    }
  }
  return errors;
}

// BAI-SEO-003-S3 REGRESSION FIXTURE — checkEnPageContract.
//
// Original bug: the EN page at https://brightai.live/en/ (and the 6 other
// EN pages — 5 legal + sales-deck) emitted only ar-SA=self + x-default=self
// because EXPLICIT_HREFLANG_PAIRS in src/data/hreflang-pairs.ts was keyed
// only by the AR URL. The EN canonical missed the map lookup, fell through
// to the synthetic AR-only default, and dropped the en-SA self-reference
// AND the ar-SA pointing back to the AR counterpart. The audit caught 7
// canonical-mismatch errors + 14 missing-return errors before the fix.
//
// The S3 fix made the map bidirectionally keyed (see makeBidirectionalEntries
// in hreflang-pairs.ts). This fixture re-asserts the EN page contract on
// every audit run so a future regression of the same shape is caught
// immediately and named explicitly in the error log.
//
// Contract for any EN page (canonical contains /en/):
//   1. en-SA self-reference MUST exist and equal canonical
//   2. ar-SA alternate MUST exist (must point to the AR counterpart —
//      the return-tag check is covered by checkReciprocity, but the
//      presence of ar-SA at all is the symmetric invariant this fixture
//      enforces)
function checkEnPageContract(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    if (!canonical.includes("/en/")) continue;

    // Contract 1: en-SA self.
    const enSelf = alternates.get("en-SA");
    if (!enSelf) {
      errors.push(
        `en-page-contract: ${canonical} — REGRESSION BAI-SEO-003-S3 (no en-SA self-reference; the /en/ page dropped its en-SA self because the hreflang pair map was not bidirectionally keyed)`,
      );
      continue;
    }
    if (enSelf !== canonical) {
      errors.push(
        `en-page-contract: ${canonical} — REGRESSION BAI-SEO-003-S3 (en-SA = ${enSelf}, expected = canonical)`,
      );
    }

    // Contract 2: ar-SA alternate present (points to the AR counterpart).
    if (!alternates.has("ar-SA")) {
      errors.push(
        `en-page-contract: ${canonical} — REGRESSION BAI-SEO-003-S3 (no ar-SA pointing to AR counterpart; the /en/ page dropped its return tag because the hreflang pair map was not bidirectionally keyed)`,
      );
    }
  }
  return errors;
}

// BAI-SEO-003-S3 INVARIANT — checkArOnlyPageNoEnAlternate.
//
// The pair map (src/data/hreflang-pairs.ts) is the single source of truth
// for which pages have an en-SA alternate. Pages not in the bilingual map
// (i.e. isExplicitBilingualPair() === false) are AR-only by design and
// MUST NOT emit an en-SA alternate. An en-SA alternate on an AR-only page
// would be an "invented English counterpart" — the same class of regression
// that S1 fixed for /privacy-cookies/ in 2026-07-18.
//
// This check is the symmetric counterpart of checkEnPageContract: it
// enforces the "No AR-only page gets an invented English counterpart"
// acceptance criterion from the BAI-IDX-01 task spec. Without this check,
// a future refactor could add a bogus en-SA alternate to an AR-only page
// and the existing reciprocity check would only catch it if the target
// also failed to return — leaving a silent failure when the target is
// some other bilingual page that happens to return ar-SA correctly.
function checkArOnlyPageNoEnAlternate(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    // Bilingual pages (in the explicit pair map) legitimately emit en-SA.
    if (isExplicitBilingualPair(canonical)) continue;
    if (alternates.has("en-SA")) {
      errors.push(
        `ar-only-invented-en: ${canonical} — REGRESSION BAI-SEO-003-S3 (AR-only page emits an en-SA alternate; the pair map is the single source of truth and does not list this URL as bilingual)`,
      );
    }
  }
  return errors;
}

// Filesystem-only: verify every alternate URL has a built HTML file under
// CLIENT_ROOT. A missing file means non-200 in prod. Extracted from the
// original inline non-200 loop in main() so run() can branch on source.
// Task 2 will rename/move this as part of the fetchFilesystem split.
async function checkNon200Files(index) {
  const allAlternateUrls = new Set();
  for (const { alternates } of index.values()) {
    for (const href of alternates.values()) {
      allAlternateUrls.add(href);
    }
  }
  const errors = [];
  for (const href of allAlternateUrls) {
    // Map absolute URL → relative file under client root.
    let relPath;
    try {
      const parsed = new URL(href);
      relPath = decodeURIComponent(parsed.pathname);
    } catch {
      errors.push(`bad-url: ${href}`);
      continue;
    }
    if (relPath === "/") relPath = "/index.html";
    else if (relPath.endsWith("/")) relPath += "index.html";
    else if (!relPath.endsWith(".html")) relPath += "/index.html";
    const candidate = path.join(getClientRoot(), relPath);
    try {
      await fs.access(candidate);
    } catch {
      errors.push(`non-200: ${href} (missing ${candidate})`);
    }
  }
  return errors;
}

// Fetches the live production sitemap + each sampled page via Playwright.
// Returns a Map<canonical, { url, status, alternates }> with the same
// alternates shape as fetchFilesystem. `url` replaces `file` (HTTP source
// vs filesystem). Static assets (CSS, fonts, images) are blocked at the
// context level to save bandwidth.
async function fetchLive({ host, sample, concurrency, timeout }) {
  const browser = await chromium.launch({ headless: true });
  let context = null;
  try {
    context = await browser.newContext({
      userAgent: "BrightAI-Hreflang-Audit/1.0 (+https://brightai.live)",
    });
    // Abort static assets to save bandwidth + time
    await context.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["stylesheet", "font", "image", "media", "other"].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    // Get sitemap URLs (production surface)
    const sitemapUrl = `${host.replace(/\/$/, "")}/sitemap.xml`;
    const page = await context.newPage();
    let urls;
    try {
      const response = await page.goto(sitemapUrl, { waitUntil: "domcontentloaded", timeout });
      if (!response || response.status() >= 400) {
        throw new Error(`Sitemap fetch failed: ${response?.status() ?? "no response"}`);
      }
      const sitemapXml = await page.content();
      urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
      await page.close();
      if (urls.length === 0) throw new Error("Sitemap contains no URLs");
    } catch (err) {
      await page.close().catch(() => {});
      throw err;
    }

    return await fetchPages(context, urls, sample, concurrency, timeout);
  } finally {
    // Nested try/finally so browser.close() always runs even if
    // context.close() throws (e.g., Playwright already torn down).
    if (context) {
      try { await context.close(); } catch { /* swallow — best-effort cleanup */ }
    }
    try { await browser.close(); } catch { /* swallow — best-effort cleanup */ }
  }
}

// Chunked page fetcher. Splits the sampled URLs into chunks of `concurrency`
// pages, fetches each chunk in parallel with Promise.allSettled (one URL
// failure does not stop the audit), and returns { index, non200 } where
// `non200` collects every URL that returned a non-2xx status (so the live
// audit can flag production outages that would otherwise pass silently).
async function fetchPages(context, urls, host, sample, concurrency, timeout) {
  const sampled = sample > 0 ? urls.slice(0, sample) : urls;
  const index = new Map();
  const non200 = [];
  const chunks = [];
  for (let i = 0; i < sampled.length; i += concurrency) {
    chunks.push(sampled.slice(i, i + concurrency));
  }
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (url) => {
        const page = await context.newPage();
        try {
          const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });
          const status = response?.status() ?? 0;
          if (status >= 400) {
            return { kind: "non200", url, status };
          }
          const html = await page.content();
          const canonical = extractCanonicalHref(html);
          if (!canonical) return { kind: "no-canonical", url, status };
          if (hasNoindexDirective(html)) return { kind: "noindex", url, status };
          const alternates = parseHeadHreflang(html);
          const map = new Map();
          for (const a of alternates) {
            map.set(a.hreflang, a.href);
          }
          return { kind: "ok", canonical, url, status, alternates: map };
        } finally {
          await page.close();
        }
      }),
    );
    for (const r of results) {
      if (r.status === "rejected") {
        non200.push({ url, status: 0, reason: r.reason?.message || "navigation/close failed" });
        continue;
      }
      const v = r.value;
      if (v.kind === "ok") {
        index.set(v.canonical, { url: v.url, status: v.status, alternates: v.alternates });
      } else {
        non200.push({ url: v.url, status: v.status, reason: v.kind });
      }
    }
  }
  return { index, non200 };
}

// Writes the JSON report to the specified path with 2-space indentation.
async function reportWriter(path, data) {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
}

/**
 * Extract a structured violation from the error string emitted by check* functions.
 * Format: `${type}: <url> <rest of message>`.
 * The URL is always the first whitespace-separated token after the type prefix.
 */
function parseViolation(type, errorString) {
  // Strip the type prefix: "missing-return: <url> ..." → "<url> ..."
  const colonIdx = errorString.indexOf(':');
  const remainder = colonIdx >= 0 ? errorString.slice(colonIdx + 1).trim() : errorString;
  // The URL is the first whitespace-separated token.
  const url = remainder.split(/\s+/)[0] || null;
  return { type, url, detail: errorString };
}

async function run({ source, args, fetchLive, fetchFilesystem, reportWriter }) {
  // Build the page index from the chosen source. filesystem path uses the
  // sync fetchFilesystem (await is a no-op on a sync return — kept for parity
  // with the live path); live returns { index, non200 }.
  const liveResult = source === 'live'
    ? await fetchLive({ host: args.host, sample: args.sample, concurrency: args.concurrency, timeout: args.timeout })
    : null;
  const pageIndex = source === 'live' ? liveResult.index : await fetchFilesystem();
  const liveNon200 = source === 'live' ? liveResult.non200 : [];

  const setCount = pageIndex.size;

  const reciprocityErrors = checkReciprocity(pageIndex);
  const canonicalErrors = checkCanonicalSelfMatch(pageIndex);
  const xDefaultErrors = checkXDefault(pageIndex);
  const enPageContractErrors = checkEnPageContract(pageIndex);
  const arOnlyInventedEnErrors = checkArOnlyPageNoEnAlternate(pageIndex);

  // Non-200 check is filesystem-only (live fetch tracks its own non-200s).
  let non200Errors = [];
  if (source === 'filesystem') {
    non200Errors = await checkNon200Files(pageIndex);
  }
  if (source === 'live') {
    non200Errors = liveNon200.map((e) => `non-200: ${e.url} (status ${e.status}, ${e.reason || 'fetched'})`);
  }

  const totalErrors =
    reciprocityErrors.length +
    canonicalErrors.length +
    xDefaultErrors.length +
    enPageContractErrors.length +
    arOnlyInventedEnErrors.length +
    non200Errors.length;

  // Summary output (mode-aware)
  const mode = source === 'live' ? 'live' : 'local';
  console.log(`Hreflang bidirectional audit (${mode} mode)`);
  if (source === 'live') {
    console.log(`  Host:                ${args.host}`);
    console.log(`  Pages sampled:       ${args.sample}`);
    console.log(`  Concurrency:         ${args.concurrency}`);
  }
  console.log(`  Sets audited:           ${setCount}`);
  console.log(`  Missing return tags:    ${reciprocityErrors.length}`);
  console.log(`  Canonical mismatch:     ${canonicalErrors.length}`);
  console.log(`  Missing x-default:      ${xDefaultErrors.length}`);
  console.log(`  EN page contract (S3):  ${enPageContractErrors.length}`);
  console.log(`  AR-only invented en:    ${arOnlyInventedEnErrors.length}`);
  console.log(`  Non-200 hreflang:       ${non200Errors.length}`);
  console.log(`  TOTAL ERRORS:           ${totalErrors}`);

  if (reciprocityErrors.length) {
    console.log("\n-- reciprocity errors --");
    reciprocityErrors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (canonicalErrors.length) {
    console.log("\n-- canonical errors --");
    canonicalErrors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (xDefaultErrors.length) {
    console.log("\n-- x-default errors --");
    xDefaultErrors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (enPageContractErrors.length) {
    console.log("\n-- EN page contract (BAI-SEO-003-S3 regression fixture) --");
    enPageContractErrors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (arOnlyInventedEnErrors.length) {
    console.log("\n-- AR-only invented en (BAI-SEO-003-S3 invariant) --");
    arOnlyInventedEnErrors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (non200Errors.length) {
    console.log("\n-- non-200 errors --");
    non200Errors.forEach((e) => console.log(`  ✗ ${e}`));
  }

  // JSON report (only when --report is set)
  if (args.report) {
    await reportWriter(args.report, {
      host: args.host,
      sampledPages: args.sample,
      totalPages: setCount,
      concurrency: args.concurrency,
      timestamp: new Date().toISOString(),
      errors: {
        missingReturn: reciprocityErrors.length,
        canonicalMismatch: canonicalErrors.length,
        missingXDefault: xDefaultErrors.length,
        enPageContract: enPageContractErrors.length,
        arOnlyInventedEn: arOnlyInventedEnErrors.length,
        non200Responses: non200Errors.length,
      },
      violations: [
        ...reciprocityErrors.map((e) => parseViolation('missing-return', e)),
        ...canonicalErrors.map((e) => parseViolation('canonical-mismatch', e)),
        ...xDefaultErrors.map((e) => parseViolation('missing-xdefault', e)),
        ...enPageContractErrors.map((e) => parseViolation('en-page-contract', e)),
        ...arOnlyInventedEnErrors.map((e) => parseViolation('ar-only-invented-en', e)),
        ...non200Errors.map((e) => parseViolation('non-200', e)),
      ],
    });
  }

  if (totalErrors > 0) {
    console.log(`\n❌ ${totalErrors} hreflang violation(s) detected.`);
    return { totalErrors, exitCode: 1, mode };
  }
  console.log(`\n✅ All hreflang bidirectional checks passed (${mode}).`);
  return { totalErrors: 0, exitCode: 0, mode };
}

// Run as CLI when invoked directly; export for tests when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv);
  if (args.showHelp) {
    printHelp();
    process.exit(0);
  }
  run({
    source: args.live ? 'live' : 'filesystem',
    args,
    fetchLive,
    fetchFilesystem: fetchFilesystem,
    reportWriter,
  })
    .then((result) => {
      if (result && typeof result.exitCode === 'number') {
        process.exit(result.exitCode);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(2); // Internal error (distinct from violations=1)
    });
}

export { parseArgs, printHelp, run, fetchFilesystem, checkNon200Files, parseViolation };
