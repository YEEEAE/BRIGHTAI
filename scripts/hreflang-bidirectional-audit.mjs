#!/usr/bin/env node
// hreflang-bidirectional-audit.mjs — BAI-SEO-003-S2 automated test.
//
// Reads the built client HTML (dist/client/**/*.html) and public/sitemap.xml,
// then verifies the bidirectional hreflang contract:
//   1. 0 missing return tags — every ar-SA/en-SA alternate must be returned
//      by its counterpart page (reciprocity).
//   2. 0 hreflang URLs returning non-200 — every alternate URL must resolve.
//   3. 0 canonical/hreflang mismatch — the self hreflang URL must equal the
//      page canonical, literally.
//
// Output: number of hreflang sets audited + error counts. Exits non-zero on
// any error so it can gate CI / seo:gate.
//
// Run AFTER `pnpm build` (needs dist/client + public/sitemap.xml present).
import { promises as fs } from "fs";
import path from "path";
import { resolveClientBuildRoot } from "./_build-output.mjs";
import { extractAlternateHreflangLinks, extractCanonicalHref, hasNoindexDirective } from "./sitemap-audit-utils.mjs";

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
function checkReciprocity(index) {
  const errors = [];
  for (const [canonical, { alternates }] of index) {
    for (const [lang, href] of alternates) {
      if (lang === "x-default") continue;
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

async function main() {
  const index = await buildPageIndex();
  const setCount = index.size;

  const reciprocityErrors = checkReciprocity(index);
  const canonicalErrors = checkCanonicalSelfMatch(index);
  const xDefaultErrors = checkXDefault(index);

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
    non200Errors.length;

  console.log(`Hreflang bidirectional audit`);
  console.log(`  Sets audited:        ${setCount}`);
  console.log(`  Missing return tags: ${reciprocityErrors.length}`);
  console.log(`  Canonical mismatch:  ${canonicalErrors.length}`);
  console.log(`  Missing x-default:   ${xDefaultErrors.length}`);
  console.log(`  Non-200 hreflang:    ${non200Errors.length}`);
  console.log(`  TOTAL ERRORS:        ${totalErrors}`);

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
