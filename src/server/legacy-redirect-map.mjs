/**
 * src/server/legacy-redirect-map.mjs — BAI-IDX-REDIR-001 (2026-08-24)
 *
 * Synchronous legacy-redirect lookup for the patched Node listener.
 *
 * Why this module exists: live verification on 2026-08-24 showed every
 * legacy redirect 404ing in production (both `.html` variants — which
 * Astro's static build drops from the server manifest — and trailing-
 * slash keys that work against the identical local dist). The Astro
 * middleware does NOT run for unmatched paths in the standalone Node
 * adapter (verified empirically; see DEC-BAI-IDX-22-001), so the only
 * hook that fires for every request is the patched listener in
 * dist/server/entry.mjs (scripts/patch-server-entry.mjs). That layer
 * is synchronous, hence this sync loader.
 *
 * It reuses the pure helpers (expandVariants, findLegacyRedirect) from
 * the copy of src/lib/legacy-redirects.mjs that the patcher ships as
 * dist/server/_legacy-redirects.mjs — no variant logic is duplicated.
 * redirects.json is resolved from (in order):
 *   1. <dist>/redirects.json  (shipped by scripts/patch-server-entry.mjs)
 *   2. <cwd>/redirects.json   (Render runs from the repo root)
 *
 * Fail-open: any error produces an empty map (no redirects, site still
 * serves). scripts/legacy-redirects.test.mjs pins parity between this
 * map and the async src/lib loader.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expandVariants, findLegacyRedirect } from '../lib/legacy-redirects.mjs';

let cachedMap = null;

function buildMap() {
  const map = new Map();
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Deployed: dist/server/_legacy-redirect-map.mjs → dist/redirects.json
    path.resolve(here, '..', 'redirects.json'),
    // Deployed fallback / local dev: cwd is the repo root on Render.
    path.resolve(process.cwd(), 'redirects.json'),
    // Local dev when imported straight from src/server/.
    path.resolve(here, '..', 'redirects.json'),
  ];
  const file = candidates.find((p) => existsSync(p));
  if (!file) return map;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const entries = Array.isArray(data && data.redirects) ? data.redirects : [];
  for (const r of entries) {
    if (!r || typeof r.from !== 'string' || typeof r.to !== 'string') continue;
    const status = Number.isInteger(r.status) ? r.status : 301;
    for (const variant of expandVariants(r.from)) {
      if (!map.has(variant)) map.set(variant, { to: r.to, status });
    }
  }
  return map;
}

/**
 * Look up a legacy redirect for a request pathname (query/hash stripped).
 *
 * @param {string} pathname e.g. "/services/finance.html"
 * @returns {{to: string, status: number} | null} null = no redirect
 */
export function getLegacyRedirect(pathname) {
  if (cachedMap === null) {
    try {
      cachedMap = buildMap();
    } catch {
      cachedMap = new Map();
    }
  }
  return findLegacyRedirect(pathname, cachedMap);
}
