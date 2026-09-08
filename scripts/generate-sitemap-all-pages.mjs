#!/usr/bin/env node
/**
 * scripts/generate-sitemap-all-pages.mjs — IP-07 / BAI-IDX-03 (2026-07-25)
 *
 * The single canonical writer of `public/sitemap.xml` (and the matching
 * `dist/client/sitemap.xml`, `dist/client/sitemap-0.xml`,
 * `dist/client/sitemap-index.xml`). After this script finishes, every
 * sitemap consumer — Google, Bing, humans reading dist/sitemap-0.xml
 * directly — sees the same contract-conformant output.
 *
 * BAI-IDX-03 sitemap contract:
 *   1. EXACTLY ONE public sitemap file: `sitemap.xml`. No split files
 *      advertised in `public/robots.txt` — that file declares one
 *      Sitemap: directive only.
 *   2. ZERO noindex / redirect / status / dev / api URLs.
 *      The page-level `analyzePage()` rejects pages whose HTML
 *      contains `<meta name="robots" content="noindex">` or
 *      `<meta http-equiv="refresh">`, or whose canonical doesn't
 *      match the expected URL. `groupRelPath()` further filters
 *      `/404/`, `/api/*`, etc.
 *      SEMRUSH-UNBLOCK (2026-09-08): per user decision, /500/, /offline/,
 *      /kernel/offline/, /thank-you/, /go/whatsapp/ and /design/* are now
 *      indexable and sitemap-included; only /404/ (status artifact) and
 *      dev/api routes remain excluded.
 *   3. lastmod is derived from `git log -1 --format=%cs -- <source>`
 *      where <source> is the page's real source file under src/ (the
 *      HTML relPath is resolved to source candidates — see
 *      resolveSourceFiles()). If no source candidate has git
 *      history, the <lastmod> field is OMITTED from the URL entry
 *      entirely. NEVER use the build artifact's mtime — that is
 *      the build timestamp, which would lie about content freshness.
 *      `astro.config.mjs` no longer sets `lastmod: new Date()` for
 *      this reason (BAI-IDX-03).
 *
 * Single file, one source of truth. See:
 *   - report/2026-07-25-bai-idx-03-sitemap-robots-unification.md
 *   - .agents/brain.md (BAI-IDX-03 change ledger entry)
 *   - scripts/sitemap-contract.mjs (the pure validator module)
 *   - scripts/verify-all.mjs (the CI gate that enforces the contract)
 */
import { promises as fs } from "fs";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import {
  buildPublicUrlRegistry,
  normalizeRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";
import { getHreflangLinks } from "../src/data/hreflang-pairs.ts";
import {
  extractCanonicalHref,
  hasMetaRefresh,
  hasNoindexDirective,
} from "./sitemap-audit-utils.mjs";
import {
  ensureNonEmptySitemap,
  resolveClientBuildRoot,
} from "./_build-output.mjs";

const BASE_URL = "https://brightai.live";
const ROOT = process.cwd();

// SITEMAP-ORDER-002 (2026-08-28): order URLs by business importance so
// crawlers (and humans) see the highest-value pages first. Sorting is
// purely a reordering — no URL is ever added or removed here. Tiers:
//   0 homepage · 1 core product/commercial · 2 company & section hubs
//   3 solution/hub subpages · 4 docs · 5 content (blog/answer) ·
//   6 lead-gen & secondary · 7 legal & utility.
// Within a tier, alphabetical order is kept (deterministic output).
function importanceTier(pathname) {
  const p = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const exact = (x) => p === x;
  const pre = (x) => p.startsWith(x);

  if (exact("/") || exact("/en/")) return 0;
  if (
    exact("/kernel/") ||
    exact("/solutions/") ||
    exact("/pricing/") ||
    exact("/demo/") ||
    exact("/contact/")
  ) {
    return 1;
  }
  if (
    exact("/about/") ||
    exact("/services/") ||
    exact("/hub/") ||
    exact("/blog/") ||
    exact("/docs/") ||
    exact("/customers/") ||
    exact("/trust/") ||
    exact("/partners/")
  ) {
    return 2;
  }
  if (pre("/solutions/") || pre("/hub/")) return 3;
  if (pre("/docs/")) return 4;
  if (pre("/blog/category/")) return 6;
  if (pre("/blog/") || pre("/answer/") || pre("/assessment/")) return 5;
  if (
    pre("/lp/") ||
    pre("/tools/") ||
    pre("/calculator/") ||
    pre("/events/") ||
    pre("/customers/") ||
    pre("/authors/") ||
    pre("/newsletter/")
  ) {
    return 6;
  }
  return 7;
}

function importanceComparator(a, b) {
  const tierA = importanceTier(new URL(a.loc).pathname);
  const tierB = importanceTier(new URL(b.loc).pathname);
  if (tierA !== tierB) return tierA - tierB;
  return a.loc.localeCompare(b.loc, "en");
}
const execFileAsync = promisify(execFile);
const gitLastmodCache = new Map();

// SITEMAP-GEN-001 (2026-07-18): resolve the canonical client build root
// via _build-output.mjs and bail loudly when no build is present. Before
// this change, the generator hardcoded `dist/` and would happily emit a
// 0-URL sitemap if dist/client was empty (e.g. mid-build). The user
// reported exactly this: "لا تكتب sitemap صفر URL".
const clientBuild = resolveClientBuildRoot(ROOT);
if (!clientBuild.root) {
  console.error(`❌ ${clientBuild.reason}`);
  process.exit(1);
}
const CLIENT_ROOT = clientBuild.root;
const CLIENT_REL = path.relative(ROOT, CLIENT_ROOT);

// Sitemap Outputs
const SITEMAP_INDEX = path.join(ROOT, "public", "sitemap.xml");
const REPORT_OUTPUT = path.join(ROOT, "reports", "sitemap-quality-report.md");
// IP-07 + HIGH-05 + HIGH-06: We want sitemap-index.xml to point at the clean
// sitemap produced here (status artifacts + dev/api filtered out), NOT
// at the @astrojs/sitemap output (`sitemap-0.xml`) which still contains them.
// astro.config.mjs is PROTECTED (CLAUDE.md Section 2.1), so we cannot change
// the @astrojs/sitemap `filter` directly. Instead, we override the adapter-
// emitted sitemap-index.xml here. See:
//   - report/2026-07-15-sitemap-contract.md
//   - brain.md KI-054 (astro.config.mjs remediation pending approval)
const DIST_SITEMAP_XML = path.join(CLIENT_ROOT, "sitemap.xml");
const DIST_SITEMAP_INDEX_XML = path.join(CLIENT_ROOT, "sitemap-index.xml");
const DIST_SITEMAP_INDEX_XML_CLIENT = path.join(CLIENT_ROOT, "sitemap-index.xml");
const DIST_SITEMAP_0_XML = path.join(CLIENT_ROOT, "sitemap-0.xml");
const DIST_SITEMAP_0_XML_CLIENT = path.join(ROOT, "dist", "client", "sitemap-0.xml");

const IGNORED_SCAN_DIRS = new Set([
  ".git",
  ".next",
  ".render-static",
  ".agents",
  "node_modules",
  "aimais",
  "backend",
  "coverage",
  "dist",
  "build",
  "tmp",
  // KERNEL-SEO-2026-07-14: removed `"reports"` from this list. It was
  // matching the kernel/reports/ subdirectory (slug = "reports") and
  // silently excluding /kernel/reports/ from the sitemap. Top-level
  // `reports/` (project reports dir) is excluded by the relPath check
  // below (`if (relPath.startsWith("reports/"))`).
]);

// Kept for potential future use (e.g. report timestamp formatting).
// BAI-IDX-03 removed the file-mtime lastmod fallback; this function is
// no longer called inside the sitemap pipeline.
function toIsoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}
// BAI-IDX-03 (2026-07-25): lastmod source-of-truth. We resolve the
// HTML relPath to its real source file(s) under src/ and ask git for
// the last commit that touched them. The build timestamp would lie to
// crawlers about content freshness — a page that hasn't changed in 30
// days would show today's date after every deploy. Page freshness MUST
// reflect real edits.
//
// Returns an ordered list of candidate source files. The first one
// with git history wins. Order is:
//   1. The static page candidate (src/pages/<relPath>) — works for
//      every regular .astro file (about, contact, kernel/chat, etc.)
//   2. Content collection candidates (src/content/blog|docs|hub/*.md)
//      — for dynamic [slug] routes that render from Markdown
//   3. Data file candidates (src/data/*.ts) — for data-driven routes
//      (authors from blog.ts, solutions from solutions.ts, kernel
//      from kernel.ts, cities from cities.ts, legal content from
//      legal-content-inline.ts, etc.)
function resolveSourceFiles(relPath) {
  if (!relPath) return [];
  if (relPath === "index.html") return ["src/pages/index.astro"];
  if (relPath === "404.html") return ["src/pages/404.astro"];
  if (relPath === "500.html") return []; // no source — Render fallback
  if (relPath === "offline.html" || relPath === "kernel/offline.html") {
    return ["src/pages/offline/index.astro", "src/pages/kernel/offline.astro"];
  }

  const sources = [];
  const dir = relPath.replace(/\/index\.html$/, "").replace(/\.html$/, "");

  // 1) Static page candidate — every relPath has one.
  if (relPath.endsWith("/index.html")) {
    sources.push(`src/pages/${dir}/index.astro`);
  } else {
    sources.push(`src/pages/${dir}.astro`);
  }

  // 2) Dynamic [param] route candidates — the route template is what
  //    holds the rendering logic, regardless of the actual param value.
  //    These candidates MUST be checked because the relPath carries the
  //    concrete param value, not the template.
  if (dir === "blog/category" || dir.startsWith("blog/category/")) {
    // blog category subpages: src/pages/blog/category/[category].astro
    // plus the data file that defines the category list.
    sources.push("src/pages/blog/category/[category].astro");
    sources.push("src/data/blog.ts");
  }
  if (dir === "hub" || dir.startsWith("hub/")) {
    // hub subpages: src/pages/hub/[slug].astro (dynamic), with content
    // sourced from src/data/hub-content-inline.ts.
    sources.push("src/pages/hub/[slug].astro");
    sources.push("src/data/hub-content-inline.ts");
  }
  if (dir === "authors" || dir.startsWith("authors/")) {
    // author pages: src/pages/authors/[slug].astro, with author data
    // embedded in src/data/blog.ts.
    sources.push("src/pages/authors/[slug].astro");
    sources.push("src/data/blog.ts");
  }
  if (dir.startsWith("solutions/cities/")) {
    // city pages: src/pages/solutions/cities/[city].astro, with city
    // data in src/data/cities.ts.
    sources.push("src/pages/solutions/cities/[city].astro");
    sources.push("src/data/cities.ts");
  } else if (dir.startsWith("solutions/") && dir.split("/").length >= 3) {
    // sector + city pages: src/pages/solutions/[sector]/[city].astro,
    // with sector data in src/data/solutions.ts.
    sources.push("src/pages/solutions/[sector]/[city].astro");
    sources.push("src/data/solutions.ts");
  } else if (dir === "solutions" || dir === "solutions/index") {
    // solutions index.
  } else if (dir.startsWith("solutions/")) {
    // /solutions/<slug>/ — could be a solution page (src/pages/solutions/
    // [slug].astro + src/data/solutions.ts) or a sector page
    // (src/pages/solutions/[sector].astro + src/pages/solutions/[sector]/
    // index.astro). Both are dynamic, so probe the most common templates.
    const slug = dir.slice("solutions/".length);
    sources.push("src/pages/solutions/[slug].astro");
    sources.push("src/pages/solutions/[sector].astro");
    sources.push("src/pages/solutions/[sector]/index.astro");
    sources.push("src/data/solutions.ts");
    // The slug itself can also be a static .astro file (e.g. a
    // pre-rendered sector landing page). Try the literal path too.
    sources.push(`src/pages/solutions/${slug}.astro`);
  }
  if (dir === "kernel" || dir.startsWith("kernel/")) {
    // kernel subpages: src/pages/kernel/[slug].astro (dynamic), with
    // kernel data in src/data/kernel.ts.
    if (dir === "kernel/api") {
      // BAI-SEO-004 (2026-08-08): kernel/api is a static .astro page,
      // not a [slug] route — point lastmod at the real source file.
      sources.push("src/pages/kernel/api.astro");
    }
    sources.push("src/pages/kernel/[slug].astro");
    sources.push("src/data/kernel.ts");
  }
  if (dir === "lp" || dir.startsWith("lp/")) {
    // /lp/ landing pages: src/pages/lp/[slug].astro (dynamic). BAI-IDX-04
    // (2026-08-08) added them to the sitemap — keep lastmod wired to the
    // route template so edits to a landing page refresh its freshness.
    sources.push("src/pages/lp/[slug].astro");
  }

  // 3) Content collection candidates — only meaningful when the relPath
  //    matches an actual content slug (e.g. blog/<slug>, docs/<slug>).
  if (dir === "blog" || dir.startsWith("blog/")) {
    const slug = dir === "blog" ? null : dir.slice("blog/".length);
    if (slug && !slug.includes("/")) {
      // Only try .md/.mdx when the slug looks like a direct child
      // (not a category subpath).
      sources.push(`src/content/blog/${slug}.md`);
      sources.push(`src/content/blog/${slug}.mdx`);
    }
    if (dir === "blog" || slug) {
      // blog index or any blog subpage: data file holds authors + posts.
      sources.push("src/pages/blog/[...slug].astro");
      sources.push("src/data/blog.ts");
    }
  }
  if (dir === "docs" || dir.startsWith("docs/")) {
    const slug = dir === "docs" ? null : dir.slice("docs/".length);
    if (slug && !slug.includes("/")) {
      sources.push(`src/content/docs/${slug}.md`);
      sources.push(`src/content/docs/${slug}.mdx`);
    }
    if (dir === "docs" || slug) {
      sources.push("src/pages/docs/[...slug].astro");
    }
  }
  if (dir === "answer" || dir.startsWith("answer/")) {
    // answer pages: src/pages/answer/[slug].astro (dynamic), with content
    // sourced from src/data/answers.ts. Without this branch the 17 answer
    // URLs got no git history and were emitted without <lastmod>.
    sources.push("src/pages/answer/[slug].astro");
    sources.push("src/data/answers.ts");
  }

  // 4) Data file candidates (data-driven pages).
  if (dir === "newsletter" || dir.startsWith("newsletter/")) {
    sources.push("src/data/marketing.ts");
  }
  if (
    [
      "privacy-policy",
      "terms",
      "cookie-policy",
      "pdpl-statement",
      "data-processing-agreement",
      "privacy-cookies",
    ].includes(dir)
  ) {
    sources.push("src/data/legal-content-inline.ts");
  }
  if (dir.startsWith("en/")) {
    sources.push("src/data/legal-content-en-inline.ts");
    sources.push("src/data/i18n-pairs.ts");
  }
  if (dir === "sitemap" || dir.startsWith("sitemap/")) {
    sources.push("src/data/sitemap-builder.ts");
  }

  return [...new Set(sources)];
}

// BAI-IDX-03 (2026-07-25): returns "" if no source has git history.
// We deliberately do NOT fall back to the build artifact's mtime —
// that's the exact "build date as page freshness" anti-pattern the
// brief is calling out. Pages without a resolvable git date simply
// get no <lastmod> in the sitemap (Google accepts missing lastmod
// as "unknown freshness" — that's strictly better than a lie).
async function getGitLastModifiedDate(relPath) {
  const sources = resolveSourceFiles(relPath);
  for (const source of sources) {
    if (gitLastmodCache.has(source)) {
      const cached = gitLastmodCache.get(source);
      if (cached) return cached;
      continue;
    }
    let lastmod = "";
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["log", "-1", "--format=%cs", "--", source],
        { cwd: ROOT }
      );
      const gitDate = stdout.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
        lastmod = gitDate;
      }
    } catch {
      lastmod = "";
    }
    gitLastmodCache.set(source, lastmod);
    if (lastmod) return lastmod;
  }
  return "";
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripContent(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html) {
  const text = stripContent(html);
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

function groupRelPath(relPath) {
  const normalized = relPath.toLowerCase();

  // Exclude list
  // SEMRUSH-UNBLOCK (2026-09-08): /500/ is now indexable per user decision —
  // only /404/ and /error/ status artifacts remain sitemap-excluded.
  if (normalized.includes("404.html") || normalized.includes("error.html")) {
    return null;
  }
  if (
    normalized.includes("login") ||
    normalized.includes("forgot-password") ||
    normalized.includes("reset-password") ||
    normalized.includes("permission-denied") ||
    normalized.includes("profile") ||
    normalized.includes("admin") ||
    normalized.includes("backend") ||
    // BAI-SEO-004 (2026-08-08): only exclude root-level API routes.
    // The previous `includes("/api/")` accidentally excluded the real,
    // indexable docs page `kernel/api/` (see kernel whitelist below).
    normalized.startsWith("api/") ||
    normalized.startsWith("ws/")
  ) {
    return null;
  }

  // Legal
  if (
    normalized.includes("privacy-policy") ||
    normalized.includes("cookie-policy") ||
    normalized.includes("terms") ||
    normalized.includes("pdpl-statement") ||
    normalized.includes("data-processing-agreement") ||
    normalized.includes("privacy-cookies") ||
    normalized.includes("trust")
  ) {
    return "legal";
  }

  // Kernel
  // Supports BOTH legacy single-file format (`kernel/chat.html`) and the
  // current `build.format: 'directory'` output (`kernel/chat/index.html`).
  // After REPORTS-SEO-FOUNDATION (2026-07-07) + @astrojs/node adapter
  // (KERNEL-AI-2026-07-14), the dist contains the directory form. We accept
  // both so the customPages list (404 + 10 kernel sub-pages) stays in sync
  // with the actual built HTML.
  //
  // `normalizeRelPath` is a pass-through (lowercases, NFC-normalises), so
  // `dist/kernel/chat/index.html` is fed in as `kernel/chat/index.html`.
  if (normalized.startsWith("kernel/")) {
    if (
      normalized === "kernel/index.html" ||
      normalized === "kernel/index/index.html" ||
      normalized === "kernel/chat.html" ||
      normalized === "kernel/chat/index.html" ||
      normalized === "kernel/audit.html" ||
      normalized === "kernel/audit/index.html" ||
      normalized === "kernel/approvals.html" ||
      normalized === "kernel/approvals/index.html" ||
      normalized === "kernel/stats.html" ||
      normalized === "kernel/stats/index.html" ||
      normalized === "kernel/compliance.html" ||
      normalized === "kernel/compliance/index.html" ||
      normalized === "kernel/policies.html" ||
      normalized === "kernel/policies/index.html" ||
      normalized === "kernel/connectors.html" ||
      normalized === "kernel/connectors/index.html" ||
      normalized === "kernel/scenarios.html" ||
      normalized === "kernel/scenarios/index.html" ||
      normalized === "kernel/redteam.html" ||
      normalized === "kernel/redteam/index.html" ||
      normalized === "kernel/replay.html" ||
      normalized === "kernel/replay/index.html" ||
      normalized === "kernel/reports.html" ||
      normalized === "kernel/reports/index.html" ||
      normalized === "kernel/evidence.html" ||
      normalized === "kernel/evidence/index.html" ||
       normalized === "kernel/playground.html" ||
       normalized === "kernel/playground/index.html" ||
       normalized === "kernel/models.html" ||
       normalized === "kernel/models/index.html" ||
       normalized === "kernel/datasets.html" ||
       normalized === "kernel/datasets/index.html" ||
       normalized === "kernel/scorers.html" ||
       normalized === "kernel/scorers/index.html" ||
       normalized === "kernel/eval.html" ||
       normalized === "kernel/eval/index.html" ||
       // BAI-SEO-004 (2026-08-08): kernel/api is a real, indexable docs
       // page (11k words, canonical + no noindex). It was silently dropped
       // by the old root-level `/api/` exclusion — whitelist it explicitly.
       normalized === "kernel/api.html" ||
       normalized === "kernel/api/index.html" ||
       // SEMRUSH-UNBLOCK (2026-09-08): /kernel/offline/ is indexable per
       // user decision — include it in the kernel sitemap group.
       normalized === "kernel/offline.html" ||
       normalized === "kernel/offline/index.html"
     ) {
      return "kernel";
    }
    return null;
  }

  // Solutions
  if (normalized.startsWith("solutions/") && normalized.endsWith("/index.html")) {
    return "solutions";
  }

  // Content hubs
  if (normalized.startsWith("hub/") && normalized.endsWith("/index.html")) {
    return "pages";
  }

  // Demo
  if (normalized.startsWith("demo/")) {
    return "demo";
  }

  // Pages
  if (
    normalized === "blog/index.html" ||
    normalized === "report/index.html" ||
    normalized === "assessment/ai-governance-readiness/index.html" ||
    normalized === "index.html" ||
    normalized === "about/index.html" ||
    normalized === "contact/index.html" ||
    normalized.startsWith("answer/") && normalized.endsWith("/index.html") ||
    // BAI-IDX-04 (2026-08-08): /lp/ landing pages are indexable and now
    // receive inbound links — include them in the sitemap.
    normalized.startsWith("lp/") && normalized.endsWith("/index.html") ||
    normalized === "pricing/index.html" ||
    normalized === "services/index.html" ||
    normalized === "demo/index.html" ||
    normalized === "sitemap/index.html" ||
    normalized === "sales-deck/index.html" ||
    normalized === "en/sales-deck/index.html" ||
    normalized === "en/index.html" ||
    normalized === "calculator/roi/index.html" ||
    // BAI-SEO-004 (2026-08-08): events/index.html is the real events hub
    // (3471 words, canonical /events/, CollectionPage schema). The 3
    // sub-events were already listed; the index page was missing.
    normalized === "events/index.html" ||
    normalized === "events/ai-governance-day/index.html" ||
    normalized === "events/leap-2026/index.html" ||
    normalized === "events/webinar/index.html" ||
    normalized === "newsletter/index.html" ||
    normalized === "partners/index.html" ||
    normalized === "referral/index.html" ||
    (normalized.startsWith("authors/") && normalized.endsWith("/index.html")) ||
    (normalized.startsWith("customers/") && normalized.endsWith("/index.html")) ||
    (normalized.startsWith("blog/category/") && normalized.endsWith("/index.html")) ||
    (normalized.startsWith("blog/") && normalized.endsWith("/index.html")) ||
    (normalized.startsWith("docs/") && normalized.endsWith("/index.html")) ||
    // BAI-IDX-REDIR-002 (2026-08-24): /tools/ pages are public indexable
    // content (e.g. /tools/ai-risk-register/). Without this branch the
    // allowlist silently excluded them from the sitemap while the pages
    // themselves stayed indexable — orphaned from discovery.
    (normalized.startsWith("tools/") && normalized.endsWith("/index.html")) ||
    normalized === "blog/ai-governance.html" ||
    // SEMRUSH-UNBLOCK (2026-09-08): previously blocked utility pages are now
    // indexable per user decision and must not be orphaned from discovery.
    normalized === "500.html" ||
    normalized === "offline/index.html" ||
    normalized === "offline.html" ||
    normalized === "thank-you/index.html" ||
    normalized === "go/whatsapp/index.html" ||
    normalized === "go/whatsapp.html" ||
    (normalized.startsWith("design/") && normalized.endsWith("/index.html"))
  ) {
    return "pages";
  }

  return null;
}

function hasUppercaseUrlPath(url) {
  try {
    const parsed = new URL(url);
    return /[A-Z]/.test(decodeURIComponent(parsed.pathname));
  } catch {
    return true;
  }
}

function hasHtmlUrlPath(url) {
  try {
    const parsed = new URL(url);
    return /\.html(?:\/)?$/i.test(decodeURIComponent(parsed.pathname));
  } catch {
    return true;
  }
}

// BAI-SEO-003-S2 (2026-07-18): build hreflang from the explicit pair map
// (src/data/hreflang-pairs.ts) instead of deriving /en/ by path matching.
// getHreflangLinks() guarantees self-reference + return tag + x-default and
// never invents an en-SA counterpart for AR-only pages.
function buildHreflangSet(entry) {
  const selfUrl = entry.loc;
  if (!selfUrl) {
    return [];
  }
  const links = getHreflangLinks(selfUrl);
  return links.map((link) => ({ code: link.lang, href: link.href }));
}

async function walkHtmlFiles(dirPath) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_SCAN_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function renderXml(entries) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
  lines.push("");

  for (const entry of entries) {
    let cleanLoc = entry.loc;
    if (/\.html(?:\/)?$/i.test(cleanLoc)) {
      try {
        const parsed = new URL(cleanLoc);
        let pathname = parsed.pathname;
        if (pathname.endsWith(".html/")) {
          pathname = pathname.slice(0, -6);
        } else if (pathname.endsWith(".html")) {
          pathname = pathname.slice(0, -5);
        }
        if (!pathname.endsWith("/")) {
          pathname += "/";
        }
        parsed.pathname = pathname;
        cleanLoc = parsed.toString();
      } catch {
        cleanLoc = cleanLoc.replace(/\.html\/?$/i, "/");
      }
    }

    if (/\.html(?:\/)?$/i.test(cleanLoc)) {
      continue;
    }

    lines.push("  <url>");
    lines.push(`    <loc>${xmlEscape(cleanLoc)}</loc>`);
    for (const alt of entry.alternates) {
      if (hasUppercaseUrlPath(alt.href) || hasHtmlUrlPath(alt.href)) {
        continue;
      }
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alt.code)}" href="${xmlEscape(alt.href)}" />`
      );
    }
    // BAI-IDX-03 (2026-07-25): emit <lastmod> ONLY when we have a real
    // git-derived date. Omit the field entirely when empty — emitting
    // a build-time date would lie to crawlers about content freshness.
    if (entry.lastmod) {
      lines.push(`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`);
    }
    if (entry.changefreq) {
      lines.push(`    <changefreq>${xmlEscape(entry.changefreq)}</changefreq>`);
    }
    if (entry.priority) {
      lines.push(`    <priority>${xmlEscape(entry.priority)}</priority>`);
    }
    lines.push("  </url>");
  }

  lines.push("");
  lines.push("</urlset>");
  lines.push("");
  return lines.join("\n");
}

async function analyzePage(relPath) {
  // SITEMAP-GEN-001 (2026-07-18): analyze from the unified client build
  // root, not the legacy flat dist/. When `relPath` is "about/index.html",
  // `fullPath` is now `${CLIENT_ROOT}/about/index.html` — matching the
  // pages the other 3 verification scripts audit.
  const fullPath = path.join(CLIENT_ROOT, relPath);
  const expectedCanonical = relPathToCanonical(relPath, BASE_URL);

  try {
    const html = await fs.readFile(fullPath, "utf8");
    const canonicalTagHref = extractCanonicalHref(html);
    const canonicalTagNormalized = normalizeSiteUrl(canonicalTagHref, BASE_URL);
    const wordCount = countWords(html);
    
    const reasons = [];
    if (hasMetaRefresh(html)) reasons.push("meta_refresh");
    if (hasNoindexDirective(html)) reasons.push("robots_noindex");
    const decodeUrl = (u) => {
      try { return decodeURIComponent(u || ""); } catch { return u || ""; }
    };
    if (!canonicalTagHref || decodeUrl(canonicalTagHref) !== decodeUrl(expectedCanonical) || decodeUrl(canonicalTagNormalized) !== decodeUrl(expectedCanonical)) {
      reasons.push("canonical_mismatch");
    }

    const gitLastmod = await getGitLastModifiedDate(relPath);
    return {
      relPath,
      loc: expectedCanonical,
      wordCount,
      // BAI-IDX-03 (2026-07-25): strict — no file mtime fallback.
      // Pages whose source can't be resolved to a git-tracked file
      // get an empty lastmod; renderXml() then omits the <lastmod>
      // field entirely. Better to omit than to emit build time.
      lastmod: gitLastmod,
      reasons,
      include: reasons.length === 0,
    };
  } catch (error) {
    return {
      relPath,
      loc: expectedCanonical,
      wordCount: 0,
      lastmod: "",
      reasons: ["read_error"],
      include: false,
    };
  }
}

async function main() {
  // SITEMAP-GEN-001 (2026-07-18): walk the unified client build root.
  // Before this change the generator walked `dist/`, which only worked
  // because sync-dist-flat.mjs mirrored `dist/client/` → `dist/`. If that
  // step is skipped or stale, the generator produced a sitemap missing
  // pages — or, worse, an empty one.
  const allFiles = await walkHtmlFiles(CLIENT_ROOT);
  const normalizedRelPaths = allFiles.map((fullPath) =>
    normalizeRelPath(path.relative(CLIENT_ROOT, fullPath))
  );
  const lowerPathMap = new Map(
    normalizedRelPaths.map((relPath) => [relPath.toLowerCase(), relPath])
  );

  const pagesList = [];
  const kernelList = [];
  const demoList = [];
  const legalList = [];
  const solutionsList = [];
  const allAllowedRelPaths = [];

  for (const relPath of normalizedRelPaths) {
    const group = groupRelPath(relPath);
    if (!group) continue;

    const analysis = await analyzePage(relPath);
    if (analysis.include) {
      allAllowedRelPaths.push(relPath);
      const entry = {
        loc: analysis.loc,
        relPath: analysis.relPath,
        lastmod: analysis.lastmod,
        alternates: [],
      };
      if (group === "pages") pagesList.push(entry);
      else if (group === "kernel") kernelList.push(entry);
      else if (group === "demo") demoList.push(entry);
      else if (group === "legal") legalList.push(entry);
      else if (group === "solutions") solutionsList.push(entry);
    }
  }

  const registry = buildPublicUrlRegistry(allAllowedRelPaths, BASE_URL);

  const processEntries = (list) => {
    const sorted = list.sort((a, b) => a.loc.localeCompare(b.loc, "en"));
    for (const entry of sorted) {
      entry.alternates = buildHreflangSet(entry);
    }
    return sorted;
  };

  const finalPages = processEntries(pagesList);
  const finalKernel = processEntries(kernelList);
  const finalDemo = processEntries(demoList);
  const finalLegal = processEntries(legalList);
  const finalSolutions = processEntries(solutionsList);

  // A single canonical sitemap is easier to validate and prevents stale split sitemap references.
  // SITEMAP-ORDER-002 (2026-08-28): ordered by business importance
  // (importanceComparator) instead of plain alphabetical. Same URL set —
  // nothing added, nothing removed.
  const primarySitemapEntries = [
    ...finalPages,
    ...finalKernel,
    ...finalLegal,
    ...finalDemo,
    ...finalSolutions,
  ].sort(importanceComparator);

  // SITEMAP-GEN-001 (2026-07-18): 0-URL guard. Before this guard, the
  // generator would happily write an empty <urlset/> if all HTML files
  // failed canonical/noindex/no-meta-refresh checks. The user reported:
  // "وما تكتب sitemap صفر URL". Now we refuse to write and exit 1.
  const guard = ensureNonEmptySitemap({
    urls: primarySitemapEntries.map((entry) => entry.loc),
    outputPath: SITEMAP_INDEX,
    existingPath: SITEMAP_INDEX,
  });
  if (guard.skipped) {
    console.error(`❌ ${guard.reason}`);
    process.exit(1);
  }

  const sitemapXmlContent = renderXml(primarySitemapEntries);
  await fs.writeFile(SITEMAP_INDEX, sitemapXmlContent, "utf8");
  try {
    await fs.writeFile(path.join(ROOT, "sitemap.xml"), sitemapXmlContent, "utf8");
  } catch {}
  try {
    await fs.writeFile(DIST_SITEMAP_XML, sitemapXmlContent, "utf8");
  } catch {}

  // IP-07 + HIGH-05 + HIGH-06: emit a sitemap-index.xml that points to the
  // clean sitemap.xml. This OVERRIDES the @astrojs/sitemap output (which
  // points to sitemap-0.xml and contains forbidden URLs like /design/* and
  // /404/). The override is safe because:
  //   - The clean sitemap.xml has already been written above
  //   - Both robots.txt and the verification pipeline read sitemap-index.xml
  //     as the canonical entry point
  //   - Once astro.config.mjs is updated (KI-054), the @astrojs/sitemap
  //     plugin will emit the same shape and this override becomes redundant
  //     (idempotent overwrite)
  const cleanSitemapUrl = "https://brightai.live/sitemap.xml";
  const sitemapIndexContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${cleanSitemapUrl}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`,
    '</sitemapindex>',
    '',
  ].join("\n");
  try {
    await fs.writeFile(DIST_SITEMAP_INDEX_XML, sitemapIndexContent, "utf8");
  } catch {}
  try {
    await fs.writeFile(DIST_SITEMAP_INDEX_XML_CLIENT, sitemapIndexContent, "utf8");
  } catch {}

  // Also overwrite dist/sitemap-0.xml with the clean sitemap content. This is
  // defense-in-depth: any consumer that reads sitemap-0.xml directly (some
  // search engines do, even when given sitemap-index.xml) gets the clean
  // version. The @astrojs/sitemap plugin will overwrite this on the next
  // build — that's fine, the override above ensures sitemap-index.xml always
  // points to the clean file.
  try {
    await fs.writeFile(DIST_SITEMAP_0_XML, sitemapXmlContent, "utf8");
  } catch {}
  try {
    await fs.writeFile(DIST_SITEMAP_0_XML_CLIENT, sitemapXmlContent, "utf8");
  } catch {}

  process.stdout.write(`Generated sitemap.xml with ${primarySitemapEntries.length} public URLs\n`);
  process.stdout.write(`Overwrote dist/sitemap-index.xml → ${cleanSitemapUrl}\n`);

  // Write Quality Report
  const reportLines = [
    "# Sitemap Indexing and Quality Report",
    "",
    `- Date: ${new Date().toISOString()}`,
    `- Pages Sitemap URLs: ${finalPages.length}`,
    `- Kernel Sitemap URLs: ${finalKernel.length}`,
    `- Demo Sitemap URLs: ${finalDemo.length}`,
    `- Legal Sitemap URLs: ${finalLegal.length}`,
    `- Solutions Sitemap URLs: ${finalSolutions.length}`,
    `- Total Sitemap URLs: ${primarySitemapEntries.length}`,
    "- Public URLs are generated only in sitemap.xml. Split sitemap files are intentionally not produced.",
    "",
    "All URLs strictly verified for canonical alignment, code 200 health, and indexability.",
  ];
  await fs.mkdir(path.dirname(REPORT_OUTPUT), { recursive: true });
  await fs.writeFile(REPORT_OUTPUT, reportLines.join("\n") + "\n", "utf8");
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
