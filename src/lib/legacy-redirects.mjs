/**
 * src/lib/legacy-redirects.mjs — BAI-IDX-22 (2026-07-25)
 *
 * Runtime lookup table for legacy URL redirects. The single source of
 * truth is `redirects.json` at the project root, which is the input
 * to `scripts/generate-all-redirects.mjs` (writes `public/_redirects`
 * for Netlify/Cloudflare Pages) and to the routes section of
 * `render.yaml` (for Render Static Sites — but Render Web Services
 * with Node runtime do NOT process `routes:`, see DEC-BAI-IDX-12-001).
 *
 * Without this module, the 207 entries in `redirects.json` are
 * dormant on the live Render Node deployment. The result: legacy
 * URLs like `/about.html`, `/report`, `/blog/ai` return 404 instead
 * of 301 to their canonical destination. GSC then flags the chain
 * (Cloudflare http→https + www→apex + trailing-slash → 404) as
 * "Redirect error" because the final hop is a terminal 404.
 *
 * This module is consumed by `src/middleware.ts`, which the
 * @astrojs/node static handler invokes for any request that does
 * NOT resolve to a static file in `dist/client/`. So:
 *
 *   - `/about/` (with trailing slash, has static file):
 *       static handler serves `dist/client/about/index.html` (200).
 *       Middleware is NOT called.
 *
 *   - `/about.html` (extension, no static file):
 *       static handler fails to find a file → falls through to
 *       `app.render()` → middleware runs → this module returns
 *       `{ to: "/about/", status: 301 }`.
 *
 *   - `/blog/ai` (no extension, no static file):
 *       static handler does trailing-slash 301 → `/blog/ai/`.
 *       `/blog/ai/` is not a static file → falls through to
 *       middleware. The redirect map includes the trailing-slash
 *       variant, so this module returns
 *       `{ to: "/404/", status: 301 }`.
 *
 * Build-time notes:
 *   - The file is loaded once at module init via top-level await.
 *     No per-request file I/O.
 *   - The function is pure and easy to unit-test in isolation
 *     (see `scripts/legacy-redirects.test.mjs`).
 *   - Adding new entries to `redirects.json` + re-running
 *     `pnpm run build` is the only thing required to update the
 *     runtime redirect map.
 *
 * Reversal cost: low. Delete this file + the call in middleware.ts.
 *
 * @module lib/legacy-redirects
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the path to `redirects.json` relative to this module.
 *
 * In dev (Astro Vite), this module is loaded from `src/lib/` so
 * `../../redirects.json` resolves to the project root.
 *
 * In production (Astro build), the compiled module is at
 * `dist/server/chunks/<hash>.mjs` (or similar). The two-level
 * resolution is no longer correct. To handle both, we use a
 * fallback chain: try the path relative to this module first;
 * if that fails, try the cwd. The cwd at request time is the
 * project root on Render.
 *
 * @returns {string} absolute path to redirects.json
 */
function resolveRedirectsJsonPath() {
  // Primary: relative to this file (dev + most build outputs).
  const fromModule = path.resolve(__dirname, "..", "..", "redirects.json");
  return fromModule;
}

/**
 * Load redirects.json from disk and return a Map keyed by every
 * path variant that the @astrojs/node static handler might forward
 * to the middleware. Returns an empty Map if the file is missing
 * (e.g. test fixture, fresh checkout, misconfigured deploy).
 *
 * The Map values are `{ to: string, status: number }` so the
 * middleware can build a 301 (or other status) Response without
 * looking up the redirect config again.
 *
 * @param {string} [customPath] override the path to redirects.json.
 *   Used by tests to point at a fixture file.
 * @returns {Promise<Map<string, {to: string, status: number}>>}
 */
export async function loadLegacyRedirects(customPath) {
  const filePath = customPath ?? resolveRedirectsJsonPath();
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      // Missing file is not a fatal error — it just means no
      // legacy redirects are configured. This keeps the middleware
      // safe to load in environments where redirects.json has not
      // been generated yet (CI, fresh checkout, etc.).
      return new Map();
    }
    throw err;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    // Malformed JSON IS a fatal error — the source of truth is
    // broken and the middleware cannot function correctly.
    const wrapped = new Error(
      `legacy-redirects: redirects.json at ${filePath} is not valid JSON: ${err && err.message ? err.message : String(err)}`,
    );
    wrapped.cause = err;
    throw wrapped;
  }

  const redirects = Array.isArray(data && data.redirects) ? data.redirects : [];
  const map = new Map();

  for (const r of redirects) {
    if (!r || typeof r.from !== "string" || typeof r.to !== "string") {
      // Skip malformed entries silently. The
      // `check-redirect-destinations.mjs` audit catches these.
      continue;
    }
    const status = Number.isInteger(r.status) ? r.status : 301;
    addRedirectWithVariants(map, r.from, r.to, status);
  }

  return map;
}

/**
 * Add a redirect to the map, expanding the source path into every
 * variant the @astrojs/node static handler might forward to the
 * middleware. First variant wins on conflict (existing entries
 * take precedence over later additions — defensive against
 * duplicate keys in redirects.json).
 *
 * @param {Map<string, {to: string, status: number}>} map
 * @param {string} from
 * @param {string} to
 * @param {number} status
 */
function addRedirectWithVariants(map, from, to, status) {
  for (const variant of expandVariants(from)) {
    if (!map.has(variant)) {
      map.set(variant, { to, status });
    }
  }
}

/**
 * Generate every path variant a single redirect source can take
 * after the @astrojs/node static handler's own normalization.
 *
 * The static handler in `node_modules/@astrojs/node/dist/serve-static.js`
 * runs BEFORE our middleware for every request. For a request like
 * `/blog/ai` (no extension, no trailing slash) it issues a trailing-
 * slash 301 to `/blog/ai/` first. For `/about.html` (has extension)
 * it falls through directly to the middleware without rewriting.
 *
 * So our middleware sees these inputs:
 *   - `/about.html`         (the original, no rewriting for extensions)
 *   - `/report/`            (after trailing-slash 301 from `/report`)
 *   - `/blog/ai/`           (after trailing-slash 301 from `/blog/ai`)
 *
 * We expand each redirects.json entry to cover all three forms:
 *
 *   `/about.html`           → `/about.html`, `/about.html/`, `/about`, `/about/`
 *   `/about/index.html`     → `/about/index.html`, `/about/index.html/`, `/about`, `/about/`
 *   `/blog/ai`              → `/blog/ai`, `/blog/ai/`
 *   `/blog/ai.html`         → `/blog/ai.html`, `/blog/ai.html/`, `/blog/ai`, `/blog/ai/`
 *
 * @param {string} from the source path from redirects.json
 * @returns {string[]} every variant to register in the lookup map
 */
export function expandVariants(from) {
  const variants = new Set();

  // 1. The path as written.
  variants.add(from);

  // 2. The path with a trailing slash (if not already present).
  if (!from.endsWith("/")) {
    variants.add(from + "/");
  }

  // 3. If the path ends in .html, also register the extension-stripped
  //    form (with and without trailing slash). This catches requests
  //    for paths that the static handler might rewrite to a form
  //    without the .html suffix — e.g. /about.html/index.html or any
  //    user request to /about (no extension) for an entry that only
  //    registered /about.html.
  if (from.endsWith(".html") && !from.endsWith("/index.html")) {
    const stripped = from.slice(0, -".html".length);
    variants.add(stripped);
    if (!stripped.endsWith("/")) {
      variants.add(stripped + "/");
    }
  }

  // 4. If the path ends in /index.html, also register the directory
  //    form (with and without trailing slash). This is the common
  //    "directory index" form: /report/index.html → /report and /report/.
  if (from.endsWith("/index.html")) {
    const dir = from.slice(0, -"/index.html".length);
    if (dir) {
      variants.add(dir);
      if (!dir.endsWith("/")) {
        variants.add(dir + "/");
      }
    }
  }

  return [...variants];
}

/**
 * Look up a redirect by pathname. Returns null if no redirect
 * matches — the middleware should then call next() to continue
 * the request pipeline.
 *
 * @param {string} pathname the request URL pathname (e.g. "/about.html")
 * @param {Map<string, {to: string, status: number}>} map the redirect map
 * @returns {{to: string, status: number} | null}
 */
export function findLegacyRedirect(pathname, map) {
  if (!pathname || !map || map.size === 0) return null;
  return map.get(pathname) ?? null;
}
