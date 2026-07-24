#!/usr/bin/env node
/**
 * scripts/_build-output.mjs — Single source of truth for the Astro build
 * output root used by all verification scripts.
 *
 * Context (KERNEL-AI-2026-07-14, 2026-07-15):
 *   - Pre-2026-07-14: plain `output: 'static'` → HTML emitted at `dist/`.
 *   - 2026-07-14+: hybrid model (`output: 'static'` + `@astrojs/node`
 *     adapter, mode: 'standalone') → static HTML emitted at
 *     `dist/client/`, SSR entry at `dist/server/entry.mjs`.
 *   - `scripts/sync-dist-flat.mjs` verifies this layout and intentionally
 *     does not mirror `dist/client/` into `dist/`.
 *
 * Why this helper exists (2026-07-18, this file):
 *   Before this change, every verification script picked its own path:
 *     - `seo-health-check.mjs` walked the entire project ROOT and
 *       ignored `dist/`, finding only 3 HTML files (a11y reports).
 *     - `verify-all.mjs` checked `dist/client/404.html` then fell back
 *       to `dist/` (inconsistent, but worked).
 *     - `check-redirect-destinations.mjs` hardcoded `dist/`.
 *     - `check-performance-budget.js` hardcoded `dist/`.
 *     - `generate-sitemap-all-pages.mjs` walked `dist/`.
 *   The user reported that `pnpm seo:all` and `pnpm verify:all` were
 *   reading 0 HTML / 0 sitemap URLs from `dist/client/` and writing
 *   a sitemap with 0 URLs. This helper unifies path resolution so
 *   every script reads from the same canonical location: the adapter's
 *   `dist/client/` when it exists, otherwise the legacy `dist/`.
 *
 * Public API:
 *   resolveClientBuildRoot(rootDir)  → { root, adapter, reason }
 *   listClientHtmlFiles(rootDir)     → string[] (absolute paths)
 *   resolveClientSitemapFile(rootDir) → string | null
 *   readClientSitemapUrls(rootDir)   → string[] (URLs from <loc>)
 *   readClientSitemapEntries(rootDir) → { locs, alternates, total }
 *   ensureNonEmptySitemap({ ... })  → { skipped: boolean, reason?: string }
 *
 * Pure module — no I/O side effects except fs reads via fs.promises and
 * the file-existence probes in resolveClientBuildRoot. All async APIs use
 * fs.promises so callers can compose with their own async flows.
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

/** Conventional name of the HTML entry point emitted by Astro. */
const ENTRY_HTML = "index.html";

/** Conventional sitemap candidates at the client root, in priority order. */
const SITEMAP_CANDIDATES = [
  "sitemap.xml",         // IP-07 clean output (overrides @astrojs/sitemap)
  "sitemap-0.xml",       // @astrojs/sitemap default
  "sitemap-index.xml",   // sitemap index that points to the above
];

/** Directories the helper skips when walking for HTML files. */
const DEFAULT_WALK_IGNORE = new Set([
  ".git",
  "node_modules",
  ".astro",
  ".DS_Store",
]);

/**
 * resolveClientBuildRoot — pick the directory that holds the prerendered
 * static HTML emitted by the current Astro build pipeline.
 *
 * Resolution order:
 *   1. `dist/client/index.html` (adapter-laid, since KERNEL-AI-2026-07-14).
 *   2. `dist/index.html` (legacy plain-static, still honored for
 *      back-compat with older branches / fixture tests).
 *   3. `null` if neither exists — caller decides whether to fail loudly.
 *
 * @param {string} rootDir  Absolute path to the project root.
 * @returns {{ root: string|null, adapter: boolean, reason: string }}
 */
export function resolveClientBuildRoot(rootDir) {
  if (!rootDir || typeof rootDir !== "string") {
    return {
      root: null,
      adapter: false,
      reason: "rootDir must be a non-empty string",
    };
  }

  const adapterRoot = path.join(rootDir, "dist", "client");
  if (
    safeExists(adapterRoot) &&
    safeExists(path.join(adapterRoot, ENTRY_HTML))
  ) {
    return {
      root: adapterRoot,
      adapter: true,
      reason: `${path.join("dist", "client", ENTRY_HTML)} exists (adapter-laid hybrid output)`,
    };
  }

  const staticRoot = path.join(rootDir, "dist");
  if (
    safeExists(staticRoot) &&
    safeExists(path.join(staticRoot, ENTRY_HTML))
  ) {
    return {
      root: staticRoot,
      adapter: false,
      reason: `${path.join("dist", ENTRY_HTML)} exists (plain static output)`,
    };
  }

  return {
    root: null,
    adapter: false,
    reason: "no built HTML found in dist/client/ or dist/ — run `pnpm build` first",
  };
}

/**
 * listClientHtmlFiles — walk the client root and return all .html files
 * (absolute paths, no filtering beyond the default ignore set). Symlinks
 * are followed for files but not for directories (avoids cycles).
 *
 * @param {string} rootDir
 * @param {object} [options]
 * @param {Set<string>} [options.extraIgnore]  Additional dir basenames to skip.
 * @returns {Promise<string[]>}
 */
export async function listClientHtmlFiles(rootDir, options = {}) {
  const resolved = resolveClientBuildRoot(rootDir);
  if (!resolved.root) {
    return [];
  }
  const ignore = new Set([...DEFAULT_WALK_IGNORE, ...(options.extraIgnore ?? [])]);
  return walkHtmlFiles(resolved.root, ignore);
}

/**
 * resolveClientSitemapFile — return the absolute path to the first
 * existing sitemap candidate inside the client root, or null.
 * Candidates are tried in SITEMAP_CANDIDATES order.
 *
 * @param {string} rootDir
 * @returns {string|null}
 */
export function resolveClientSitemapFile(rootDir) {
  const resolved = resolveClientBuildRoot(rootDir);
  if (!resolved.root) return null;
  for (const candidate of SITEMAP_CANDIDATES) {
    const full = path.join(resolved.root, candidate);
    if (safeExists(full)) return full;
  }
  return null;
}

/**
 * readClientSitemapUrls — parse the chosen sitemap and return the URLs
 * listed inside <loc> elements. For a sitemap-index, recurses into the
 * child sitemaps one level (the project's sitemaps never nest deeper).
 *
 * @param {string} rootDir
 * @returns {Promise<{ locs: string[], total: number, source: string|null }>}
 *   total counts unique URLs across <loc> + <xhtml:link rel="alternate" href>.
 *   locs counts <loc> entries only.
 */
export async function readClientSitemapEntries(rootDir) {
  const sitemapFile = resolveClientSitemapFile(rootDir);
  if (!sitemapFile) {
    return { locs: [], total: 0, source: null };
  }
  const xml = await fsp.readFile(sitemapFile, "utf8");
  return parseSitemapXml(xml, sitemapFile, rootDir);
}

/**
 * readClientSitemapUrls — convenience wrapper returning only the
 * <loc> URLs (most scripts only need the primary list).
 *
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
export async function readClientSitemapUrls(rootDir) {
  const entries = await readClientSitemapEntries(rootDir);
  return entries.locs;
}

/**
 * ensureNonEmptySitemap — refuse to write a sitemap that would contain
 * zero URLs. Returns { skipped, reason }. The caller decides what to do
 * with skipped=true (exit 1, log warning, etc.). The function does NOT
 * touch the filesystem — it only validates the in-memory payload.
 *
 * @param {{ urls: string[], outputPath: string, existingPath?: string }} args
 * @returns {{ skipped: boolean, reason?: string }}
 */
export function ensureNonEmptySitemap({ urls, outputPath, existingPath }) {
  if (!Array.isArray(urls)) {
    return { skipped: true, reason: "urls is not an array" };
  }
  if (urls.length === 0) {
    return {
      skipped: true,
      reason: `Refusing to write ${outputPath}: 0 URLs. Run \`pnpm build\` first and verify the client root at dist/client/.`,
    };
  }
  return { skipped: false };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Internal helpers (exported for tests via the _internals namespace)
 * ────────────────────────────────────────────────────────────────────────── */

function safeExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

async function walkHtmlFiles(dir, ignore) {
  const out = [];
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (ignore.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkHtmlFiles(full, ignore)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

const LOC_RE = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
const XHTML_ALT_RE = /<xhtml:link[^>]*\bhref="([^"]+)"/gi;
const SITEMAPINDEX_RE = /<sitemapindex[\s>]/i;

async function parseSitemapXml(xml, source, rootDir) {
  const locs = [...new Set(extractAll(LOC_RE, xml))];
  const alternates = [...new Set(extractAll(XHTML_ALT_RE, xml))];

  // If this is a sitemap-index, recurse one level into child sitemaps.
  if (SITEMAPINDEX_RE.test(xml)) {
    const childLocs = locs; // sitemap-index <loc> = child sitemap URLs
    const resolvedRoot = resolveClientBuildRoot(rootDir).root;
    if (resolvedRoot) {
      for (const childUrl of childLocs) {
        let childPath = null;
        try {
          const u = new URL(childUrl);
          childPath = path.join(resolvedRoot, u.pathname.replace(/^\//, ""));
        } catch {
          childPath = null;
        }
        if (childPath && safeExists(childPath)) {
          try {
            const childXml = await fsp.readFile(childPath, "utf8");
            const childParsed = await parseSitemapXml(childXml, childPath, rootDir);
            for (const l of childParsed.locs) {
              if (!locs.includes(l)) locs.push(l);
            }
            for (const a of childParsed.alternates) {
              if (!alternates.includes(a)) alternates.push(a);
            }
          } catch {
            // unreadable child — skip silently
          }
        }
      }
    }
  }

  const allUrls = new Set([...locs, ...alternates]);
  return { locs: [...new Set(locs)], total: allUrls.size, source };
}

function extractAll(re, str) {
  // Use String.prototype.matchAll which creates an internal iterator and
  // never shares state with the passed-in regex. The previous
  // `re.lastIndex = 0` + `re.exec(str)` loop was correct in isolation
  // but the module-level regex constants above were silently truncated
  // when `parseSitemapXml` recursed — the recursive call reset
  // `lastIndex` again on the SAME regex, then the parent resumed from
  // the reset position and missed matches.
  return [...str.matchAll(re)].map((m) => m[1].trim());
}

/** Test-only handle: exposes internals for the unit suite. */
export const _internals = {
  walkHtmlFiles,
  parseSitemapXml,
  extractAll,
  SITEMAP_CANDIDATES,
  DEFAULT_WALK_IGNORE,
};
