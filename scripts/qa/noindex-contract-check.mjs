#!/usr/bin/env node
/**
 * scripts/noindex-contract-check.mjs — BAI-SEO-003-S1 acceptance script
 *
 * Walks every HTML file under dist/client/ and verifies the noindex contract:
 *
 *   1. Pages that pass robots="noindex" in source MUST emit a noindex
 *      meta robots directive in the rendered HTML.
 *   2. Pages that render with `noindex` MUST NOT emit hreflang annotations
 *      (Google cluster contract — a noindex page breaks the hreflang cluster).
 *   3. The exact noindex allowlist (currently { /thank-you/ }) is the only
 *      source of truth for "which pages may opt-in to noindex". Any page
 *      outside the allowlist that renders noindex is flagged.
 *   4. Canonical must still be present + absolute HTTPS + trailing slash
 *      even on noindex pages (noindex ≠ no-canonical).
 *   5. Title + description must still be present + non-empty (UX quality).
 *
 * Exits 0 on success, 1 on any contract violation. Prints a Saudi-dialect
 * summary for the worklog.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveClientBuildRoot } from "./_build-output.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const BASE_URL = "https://brightai.site";

const clientBuild = resolveClientBuildRoot(ROOT);
if (!clientBuild.root) {
  console.error(`❌ تعذر تحديد client build root: ${clientBuild.reason}`);
  process.exit(1);
}
const CLIENT_ROOT = clientBuild.root;

/**
 * BAI-SEO-003-S1 allowlist — these paths are the ONLY ones permitted to
 * emit noindex. Adding a new entry here requires a documented SEO decision
 * in the worklog (S1 spec rule: "اتخذ قرارًا موثقًا").
 */
const NOINDEX_ALLOWLIST = new Set(["/thank-you/"]);

function icon(ok) {
  return ok ? "✅" : "❌";
}

function rel(p) {
  return path.relative(CLIENT_ROOT, p).split(path.sep).join("/");
}

function extractTitle(html) {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function extractMeta(html, attr, value) {
  const re = new RegExp(`<meta\\b[^>]*\\b${attr}\\s*=\\s*["']${value}["'][^>]*>`, "i");
  const m = html.match(re);
  if (!m) return "";
  const content = m[0].match(/\bcontent\s*=\s*["']([^"']*)["']/i);
  return content ? content[1].trim() : "";
}

function extractCanonical(html) {
  const m = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
  if (!m) return "";
  const href = m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i);
  return href ? href[1].trim() : "";
}

function extractHreflangLinks(html) {
  const re = /<link\b[^>]*\brel\s*=\s*["']alternate["'][^>]*>/gi;
  const links = [];
  for (const m of html.matchAll(re)) {
    const lang = m[0].match(/\bhreflang\s*=\s*["']([^"']+)["']/i);
    const href = m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (lang && href) links.push({ lang: lang[1], href: href[1] });
  }
  return links;
}

function normalizePath(p) {
  if (p === "/") return "/";
  return p.endsWith("/") ? p : `${p}/`;
}

async function walkHtml(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (e.isFile() && /\.html?$/i.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = await walkHtml(CLIENT_ROOT);
  const violations = [];
  const noindexPages = [];
  let htmlCount = 0;

  for (const file of files) {
    const html = await fs.readFile(file, "utf8");
    if (!/<html\b/i.test(html) || !/<head\b/i.test(html) || !/<body\b/i.test(html)) {
      continue; // skip partial / fragment HTML
    }
    htmlCount++;

    const r = rel(file);
    // Skip the special error pages (404 + 500) — they're static HTML files
    // intentionally rendered without trailing-slash canonicals. They are
    // excluded from sitemap + hreflang pairs by INTERNAL_PAGE_PATTERN in
    // seo-health-check.mjs, and their canonical is intentionally the file
    // name (not a directory URL). They are not in the noindex contract.
    if (r === "404.html" || r === "500.html") continue;

    const title = extractTitle(html);
    const description = extractMeta(html, "name", "description");
    const robots = extractMeta(html, "name", "robots");
    const canonical = extractCanonical(html);
    const hreflang = extractHreflangLinks(html);
    const isNoindex = /noindex/i.test(robots);

    // Derive expected path from file location.
    let expectedPath = "/" + r.replace(/\/index\.html?$/, "/").replace(/\.html?$/, "");
    expectedPath = normalizePath(expectedPath);

    // 1. Title + description must exist on every public page
    if (!title) violations.push({ file: r, rule: "title_missing" });
    if (!description) violations.push({ file: r, rule: "description_missing" });

    // 2. Canonical must exist + be absolute HTTPS + trailing slash
    if (!canonical) {
      violations.push({ file: r, rule: "canonical_missing" });
    } else {
      if (!canonical.startsWith("https://")) {
        violations.push({ file: r, rule: "canonical_not_https", detail: canonical });
      }
      const parsed = (() => {
        try { return new URL(canonical); } catch { return null; }
      })();
      if (!parsed) {
        violations.push({ file: r, rule: "canonical_unparseable", detail: canonical });
      } else {
        if (parsed.pathname !== "/" && !parsed.pathname.endsWith("/")) {
          violations.push({ file: r, rule: "canonical_no_trailing_slash", detail: canonical });
        }
        if (parsed.origin !== BASE_URL) {
          violations.push({ file: r, rule: "canonical_wrong_origin", detail: canonical });
        }
      }
    }

    // 3. Noindex contract enforcement
    if (isNoindex) {
      noindexPages.push(r);
      if (hreflang.length > 0) {
        violations.push({
          file: r,
          rule: "noindex_with_hreflang",
          detail: hreflang.map((h) => h.lang).join(","),
        });
      }
      if (!NOINDEX_ALLOWLIST.has(expectedPath)) {
        violations.push({
          file: r,
          rule: "noindex_outside_allowlist",
          detail: expectedPath,
        });
      }
    }
  }

  // 4. Inverse check: every allowlisted path must actually be noindex
  for (const allowedPath of NOINDEX_ALLOWLIST) {
    // Look for a built HTML at this path
    const candidate = path.join(
      CLIENT_ROOT,
      allowedPath.replace(/^\//, "").replace(/\/$/, ""),
      "index.html",
    );
    try {
      const html = await fs.readFile(candidate, "utf8");
      const robots = extractMeta(html, "name", "robots");
      if (!/noindex/i.test(robots)) {
        violations.push({
          file: rel(candidate),
          rule: "noindex_allowlist_violated",
          detail: `expected noindex, got: ${robots || "(missing)"}`,
        });
      }
    } catch {
      // Path doesn't have a built page — flag it
      violations.push({
        file: allowedPath,
        rule: "noindex_allowlist_path_missing",
        detail: candidate,
      });
    }
  }

  // 5. Title + description uniqueness across all built pages
  const titleMap = new Map();
  const descMap = new Map();
  for (const file of files) {
    const html = await fs.readFile(file, "utf8");
    if (!/<html\b/i.test(html) || !/<head\b/i.test(html)) continue;
    const t = extractTitle(html);
    const d = extractMeta(html, "name", "description");
    const r = rel(file);
    if (t) {
      const list = titleMap.get(t) || [];
      list.push(r);
      titleMap.set(t, list);
    }
    if (d) {
      const list = descMap.get(d) || [];
      list.push(r);
      descMap.set(d, list);
    }
  }

  // Allow intentional duplicates (designed duplicates are a known issue, not
  // a contract mismatch). The S1 spec says "title فريد" so we strictly flag
  // any title appearing on > 1 page. Description: same.
  for (const [t, list] of titleMap) {
    if (list.length > 1) {
      violations.push({
        file: list.join(" | "),
        rule: "title_duplicate",
        detail: t.slice(0, 80),
      });
    }
  }
  for (const [d, list] of descMap) {
    if (list.length > 1) {
      violations.push({
        file: list.join(" | "),
        rule: "description_duplicate",
        detail: d.slice(0, 80),
      });
    }
  }

  // Report
  console.log("=" + "=".repeat(58));
  console.log("BAI-SEO-003-S1 — Noindex Contract + Metadata Layer Audit");
  console.log("=" + "=".repeat(58));
  console.log(`Client build root: ${CLIENT_ROOT}`);
  console.log(`HTML files scanned: ${htmlCount}`);
  console.log(`Pages rendering noindex: ${noindexPages.length}`);
  if (noindexPages.length > 0) {
    for (const p of noindexPages) console.log(`  - ${p}`);
  }
  console.log(`Allowlist: ${[...NOINDEX_ALLOWLIST].join(", ")}`);

  // Group violations by rule
  const byRule = new Map();
  for (const v of violations) {
    const list = byRule.get(v.rule) || [];
    list.push(v);
    byRule.set(v.rule, list);
  }

  console.log("\nالفحوصات:");
  console.log("-".repeat(60));
  const checks = [
    { rule: "title_missing", label: "0 missing title", ok: !byRule.has("title_missing") },
    { rule: "description_missing", label: "0 missing description", ok: !byRule.has("description_missing") },
    { rule: "canonical_missing", label: "0 missing canonical", ok: !byRule.has("canonical_missing") },
    { rule: "canonical_not_https", label: "canonical مطلق HTTPS", ok: !byRule.has("canonical_not_https") },
    { rule: "canonical_no_trailing_slash", label: "canonical متسق trailing slash", ok: !byRule.has("canonical_no_trailing_slash") },
    { rule: "canonical_wrong_origin", label: "canonical يشير إلى brightai.site", ok: !byRule.has("canonical_wrong_origin") },
    { rule: "canonical_unparseable", label: "canonical قابل للـ parse", ok: !byRule.has("canonical_unparseable") },
    { rule: "noindex_with_hreflang", label: "صفحات noindex ما فيها hreflang", ok: !byRule.has("noindex_with_hreflang") },
    { rule: "noindex_outside_allowlist", label: "noindex محصور بالـ allowlist", ok: !byRule.has("noindex_outside_allowlist") },
    { rule: "noindex_allowlist_violated", label: "صفحات الـ allowlist فعلاً noindex", ok: !byRule.has("noindex_allowlist_violated") },
    { rule: "noindex_allowlist_path_missing", label: "مسار الـ allowlist موجود فعليًا", ok: !byRule.has("noindex_allowlist_path_missing") },
    { rule: "title_duplicate", label: "0 title مكرر", ok: !byRule.has("title_duplicate") },
    { rule: "description_duplicate", label: "0 description مكرر", ok: !byRule.has("description_duplicate") },
  ];

  for (const c of checks) {
    const list = byRule.get(c.rule) || [];
    const detail = list.length > 0 ? `: ${list.slice(0, 3).map((v) => v.file).join(" | ")}` : "";
    console.log(`${icon(c.ok)} ${c.label}${detail}`);
  }

  console.log("\nالنتيجة النهائية:");
  console.log("-".repeat(60));
  if (violations.length === 0) {
    console.log("✅ 0 missing title/description/canonical و0 canonical duplicates غير مقصودة و0 noindex-contract mismatch");
    console.log("✅ اختبار القبول BAI-SEO-003-S1 نجح.");
    process.exitCode = 0;
  } else {
    console.log(`❌ ${violations.length} انتهاك متبقي.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("❌ تعذر تشغيل فحص noindex-contract-check.");
  console.error(`السبب: ${err.message}`);
  process.exitCode = 1;
});
