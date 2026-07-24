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
import { promises as fs } from "fs";
import path from "path";
import { resolveClientBuildRoot } from "./_build-output.mjs";
import { extractAlternateHreflangLinks, extractCanonicalHref, hasNoindexDirective } from "./sitemap-audit-utils.mjs";
import { isExplicitBilingualPair } from "../src/data/hreflang-pairs.ts";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();

// Resolve the unified client build root (dist/client or equivalent).
const clientBuild = resolveClientBuildRoot(ROOT);
if (!clientBuild.root) {
  console.error(`❌ ${clientBuild.reason}`);
  process.exit(1);
}
const CLIENT_ROOT = clientBuild.root;

// Collect all built HTML files under the client root.
async function walkHtml(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkHtml(full)));
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
async function buildPageIndex() {
  const files = await walkHtml(CLIENT_ROOT);
  const index = new Map();
  for (const file of files) {
    const html = await fs.readFile(file, "utf8");
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
      // AR-only target has no en-SA — no return expected.
      if (!target.alternates.has(returnLang)) continue;
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

// Verify x-default is present on every indexed page.
function checkXDefault(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    if (!alternates.has("x-default")) {
      errors.push(`missing-xdefault: ${canonical}`);
    }
  }
  return errors;
}

// BAI-SEO-003-S3 REGRESSION FIXTURE — checkEnPageContract.
//
// Original bug: the EN page at https://brightai.site/en/ (and the 6 other
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

async function main() {
  const index = await buildPageIndex();
  const setCount = index.size;

  const reciprocityErrors = checkReciprocity(index);
  const canonicalErrors = checkCanonicalSelfMatch(index);
  const xDefaultErrors = checkXDefault(index);
  const enPageContractErrors = checkEnPageContract(index);
  const arOnlyInventedEnErrors = checkArOnlyPageNoEnAlternate(index);

  // Non-200 check: collect all alternate URLs, hit them via local file
  // existence (build artifact) — a missing HTML file means non-200 in prod.
  const allAlternateUrls = new Set();
  for (const { alternates } of index.values()) {
    for (const href of alternates.values()) {
      allAlternateUrls.add(href);
    }
  }
  const non200Errors = [];
  for (const href of allAlternateUrls) {
    // Map absolute URL → relative file under client root.
    let relPath;
    try {
      const parsed = new URL(href);
      relPath = decodeURIComponent(parsed.pathname);
    } catch {
      non200Errors.push(`bad-url: ${href}`);
      continue;
    }
    if (relPath === "/") relPath = "/index.html";
    else if (relPath.endsWith("/")) relPath += "index.html";
    else if (!relPath.endsWith(".html")) relPath += "/index.html";
    const candidate = path.join(CLIENT_ROOT, relPath);
    try {
      await fs.access(candidate);
    } catch {
      non200Errors.push(`non-200: ${href} (missing ${candidate})`);
    }
  }

  const totalErrors =
    reciprocityErrors.length +
    canonicalErrors.length +
    xDefaultErrors.length +
    enPageContractErrors.length +
    arOnlyInventedEnErrors.length +
    non200Errors.length;

  console.log(`Hreflang bidirectional audit`);
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

  if (totalErrors > 0) {
    process.exit(1);
  }
  console.log("\n✅ All hreflang bidirectional checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
