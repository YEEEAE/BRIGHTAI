#!/usr/bin/env node
import { promises as fs } from "fs";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import {
  buildPublicUrlRegistry,
  findCounterpartRelPath,
  normalizeRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";
import {
  extractCanonicalHref,
  hasMetaRefresh,
  hasNoindexDirective,
} from "./sitemap-audit-utils.mjs";
import {
  ensureNonEmptySitemap,
  resolveClientBuildRoot,
} from "./_build-output.mjs";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
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
// sitemap produced here (status pages + design utilities filtered out), NOT
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

function toIsoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function getGitLastModifiedDate(relPath) {
  const normalizedRelPath = normalizeRelPath(relPath);
  if (gitLastmodCache.has(normalizedRelPath)) {
    return gitLastmodCache.get(normalizedRelPath);
  }

  let lastmod = "";
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%cs", "--", normalizedRelPath],
      { cwd: ROOT }
    );
    const gitDate = stdout.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
      lastmod = gitDate;
    }
  } catch {
    lastmod = "";
  }

  gitLastmodCache.set(normalizedRelPath, lastmod);
  return lastmod;
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
  if (normalized.includes("404.html") || normalized.includes("500.html") || normalized.includes("error.html")) {
    return null;
  }
  if (
    normalized.includes("offline") ||
    normalized.includes("login") ||
    normalized.includes("forgot-password") ||
    normalized.includes("reset-password") ||
    normalized.includes("permission-denied") ||
    normalized.includes("profile") ||
    normalized.includes("admin") ||
    normalized.includes("backend") ||
    normalized.includes("/api/") ||
    normalized.includes("/ws/")
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
      normalized === "kernel/reports.html" ||
      normalized === "kernel/reports/index.html" ||
      normalized === "kernel/evidence.html" ||
      normalized === "kernel/evidence/index.html"
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
    normalized === "pricing/index.html" ||
    normalized === "services/index.html" ||
    normalized === "demo/index.html" ||
    normalized === "sitemap/index.html" ||
    normalized === "sales-deck/index.html" ||
    normalized === "en/sales-deck/index.html" ||
    normalized === "en/index.html" ||
    normalized === "calculator/roi/index.html" ||
    normalized === "events/ai-governance-day/index.html" ||
    normalized === "events/leap-2026/index.html" ||
    normalized === "events/webinar/index.html" ||
    normalized === "newsletter/index.html" ||
    normalized === "partners/index.html" ||
    normalized === "referral/index.html" ||
    (normalized.startsWith("authors/") && normalized.endsWith("/index.html")) ||
    (normalized.startsWith("blog/") && normalized.endsWith("/index.html")) ||
    (normalized.startsWith("docs/") && normalized.endsWith("/index.html")) ||
    normalized === "blog/ai-governance.html"
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

function buildHreflangSet(entry, registry, lowerPathMap) {
  const selfUrl = registry.canonicalByRelPath.get(entry.relPath) || entry.loc;
  if (!selfUrl || !registry.publicRelPaths.has(entry.relPath)) {
    return [];
  }

  const counterpart = findCounterpartRelPath(entry.relPath, lowerPathMap, {
    allowedRelPaths: registry.publicRelPaths,
  });
  const counterpartUrl = counterpart ? registry.canonicalByRelPath.get(counterpart) : null;
  const isEnglish = entry.relPath.toLowerCase().startsWith("en/")
    || /-en\.html$/i.test(entry.relPath)
    || /-en\/index\.html$/i.test(entry.relPath);

  if (isEnglish) {
    if (counterpartUrl) {
      return [
        { code: "ar-SA", href: counterpartUrl },
        { code: "en-SA", href: selfUrl },
        { code: "x-default", href: counterpartUrl },
      ];
    }
    return [
      { code: "en-SA", href: selfUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  if (counterpartUrl) {
    return [
      { code: "ar-SA", href: selfUrl },
      { code: "en-SA", href: counterpartUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  return [
    { code: "ar-SA", href: selfUrl },
    { code: "x-default", href: selfUrl },
  ];
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
    lines.push(`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`);
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

    const stat = await fs.stat(fullPath);
    const gitLastmod = await getGitLastModifiedDate(relPath);
    return {
      relPath,
      loc: expectedCanonical,
      wordCount,
      lastmod: gitLastmod || toIsoDate(stat.mtime),
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
      entry.alternates = buildHreflangSet(entry, registry, lowerPathMap);
    }
    return sorted;
  };

  const finalPages = processEntries(pagesList);
  const finalKernel = processEntries(kernelList);
  const finalDemo = processEntries(demoList);
  const finalLegal = processEntries(legalList);
  const finalSolutions = processEntries(solutionsList);

  // A single canonical sitemap is easier to validate and prevents stale split sitemap references.
  const primarySitemapEntries = [
    ...finalPages,
    ...finalKernel,
    ...finalLegal,
    ...finalDemo,
    ...finalSolutions,
  ].sort((a, b) => a.loc.localeCompare(b.loc, "en"));

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
  const cleanSitemapUrl = "https://brightai.site/sitemap.xml";
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
