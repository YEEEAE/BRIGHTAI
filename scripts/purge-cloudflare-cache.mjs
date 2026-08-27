#!/usr/bin/env node
/**
 * scripts/purge-cloudflare-cache.mjs — BAI-DEPLOY-11 (2026-07-25)
 *
 * Purges Cloudflare's edge cache for brightai.live so a fresh Render
 * deploy is not hidden behind stale cf-cache HIT responses.
 *
 * Why this exists:
 *   Cloudflare sits in front of brightai.live and serves cached
 *   responses (cf-cache HIT) for HTML/JS/CSS. The default cache TTL
 *   in render.yaml is `s-maxage=300` (5 minutes) — but Cloudflare
 *   also honours the `Cache-Control` header from origin, and the
 *   `Last-Modified` / `ETag` of the asset. Leaked /frontend/* and
 *   stale /js/css-defer.js can persist for hours after a deploy.
 *   Purging forces Cloudflare to revalidate against Render on the
 *   next request, so the new x-brightai-build + deny-list takes
 *   effect immediately.
 *
 * Two purge modes:
 *   --all         Purge EVERYTHING in the zone (default, safest post-deploy).
 *                 Costs more Cloudflare API quota but guarantees no
 *                 stale surface lingers.
 *   --files <...> Purge a specific list of paths (faster, more targeted).
 *                 Use this for surgical purges (e.g. just /).
 *
 * Configuration (env vars):
 *   CLOUDFLARE_API_TOKEN  required — must have Zone.Cache Purge permission
 *   CLOUDFLARE_ZONE_ID    required — the brightai.live zone ID
 *   HOST                  default: https://brightai.live (used for --files
 *                         to construct full URLs)
 *
 * Usage:
 *   pnpm run cloudflare:purge                    # purge everything
 *   pnpm run cloudflare:purge -- --all           # explicit
 *   pnpm run cloudflare:purge -- --files / /api/health/ /js/css-defer.js
 *   CLOUDFLARE_ZONE_ID=abc... node scripts/purge-cloudflare-cache.mjs --all
 *
 * Exit codes:
 *   0  — purge succeeded
 *   1  — purge failed (Cloudflare API error, network, missing env, etc.)
 *
 * Future work (out of scope for BAI-DEPLOY-11):
 *   - Auto-trigger after every successful Render deploy (webhook)
 *   - Cached "purge already done today" guard (Cloudflare charges per
 *     purge in some plans)
 *   - Split into per-tag purges (e.g. only HTML, only static assets)
 */

import process from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const HOST = process.env.HOST || 'https://brightai.live';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);

const argv = process.argv.slice(2);
const allFlag = argv.includes('--all');
const filesFlagIdx = argv.indexOf('--files');
const fileArgs = filesFlagIdx >= 0 ? argv.slice(filesFlagIdx + 1).filter((a) => !a.startsWith('--')) : [];

const PURGE_ALL = allFlag || fileArgs.length === 0;

function log(msg)  { console.log(`[cloudflare:purge] ${msg}`); }
function err(msg)  { console.error(`[cloudflare:purge] ${msg}`); }
function die(msg)  { err(msg); process.exit(1); }

/* ---------- preflight ---------- */

if (!TOKEN) {
  die(
    'CLOUDFLARE_API_TOKEN env var is required. Generate one at\n' +
    '  https://dash.cloudflare.com/profile/api-tokens\n' +
    'with the "Zone.Cache Purge" permission on the brightai.live zone.'
  );
}
if (!ZONE_ID) {
  die(
    'CLOUDFLARE_ZONE_ID env var is required. Find it at\n' +
    '  https://dash.cloudflare.com → brightai.live → Overview → API → Zone ID.'
  );
}

if (!PURGE_ALL && fileArgs.length === 0) {
  err('no purge mode selected — use --all or --files <path1> <path2> ...');
  process.exit(1);
}

/* ---------- build the request body ---------- */

const url = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`;

let body;
let mode;
if (PURGE_ALL) {
  body = { purge_everything: true };
  mode = 'purge_everything';
} else {
  // Normalise file paths to full URLs (Cloudflare expects full URLs in `files`).
  const files = fileArgs.map((p) => {
    if (/^https?:\/\//i.test(p)) return p;
    const pathOnly = p.startsWith('/') ? p : `/${p}`;
    return `${HOST.replace(/\/$/, '')}${pathOnly}`;
  });
  body = { files };
  mode = `purge_files (${files.length})`;
}

/* ---------- send ---------- */

const ac = new AbortController();
const t = setTimeout(() => ac.abort(), TIMEOUT_MS);

log(`zone: ${ZONE_ID}`);
log(`host: ${HOST}`);
log(`mode: ${mode}`);

let res;
try {
  res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: ac.signal,
  });
} catch (e) {
  die(`request failed: ${e.message}`);
} finally {
  clearTimeout(t);
}

let parsed = null;
const text = await res.text().catch(() => '');
try { parsed = JSON.parse(text); } catch { /* leave null */ }

if (res.ok && parsed && parsed.success) {
  log(`✅ purge succeeded (HTTP ${res.status}, request id: ${parsed.result?.id || 'n/a'})`);
  if (PURGE_ALL) {
    log('next step: run `pnpm run verify:post-deploy` to confirm the new build is live');
  }
  process.exit(0);
} else {
  err(`❌ purge failed (HTTP ${res.status})`);
  if (parsed && parsed.errors) {
    for (const e of parsed.errors) {
      err(`  - code ${e.code}: ${e.message}`);
    }
  } else {
    err(`  body: ${text.slice(0, 200)}`);
  }
  process.exit(1);
}
