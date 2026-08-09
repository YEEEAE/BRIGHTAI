#!/usr/bin/env node
/**
 * scripts/patch-server-entry.mjs
 *
 * BAI-SEC-10 (2026-07-25) — patches the @astrojs/node standalone bundle
 * so the deployment-surface deny-list is enforced at the LISTENER level,
 * before the static file layer ever reads a file from disk.
 *
 * Why listen-level (not handler-wrap):
 *   The standalone `createStandaloneHandler` returns:
 *
 *     return (req, res) => {
 *       try { decodeURI(req.url); } catch { ... }
 *       staticHandler(req, res, () => appHandler(req, res));
 *     };
 *
 *   The `staticHandler` is a `send`-based handler that reads from
 *   `dist/client/`. If a file exists (e.g. an accidentally-shipped
 *   `dist/client/frontend/server.js` from a stale build), the static
 *   handler writes it to `res` and ends the response BEFORE the
 *   Astro app handler ever runs. So wrapping the exported `handler`
 *   in `entry.mjs` is a no-op for the leak — the static handler
 *   already wrote 200 + file content.
 *
 *   The fix is to inject the deny-list check into the listener inside
 *   the chunk file (`chunks/server_<HASH>.mjs`), right at the top of
 *   the returned function. The check is:
 *
 *     1. Read req.url
 *     2. If it matches any deny pattern → 404 + safety headers + end
 *     3. Otherwise → fall through to the original listener
 *
 * What this patcher touches (after `astro build`):
 *   1. Copies `src/server/deny-list.mjs` → `dist/server/_deny-list.mjs`
 *      (sibling of entry.mjs, accessible from the chunk as `../_deny-list.mjs`).
 *   2. Patches `dist/server/entry.mjs` to import the deny-list at the
 *      top (so verifier sanity-checks that the wrapper is wired in;
 *      and so future devs grepping for `withDenyList` find it).
 *      — the runtime deny-list lives in the chunk, not entry.mjs.
 *   3. Patches the `chunks/server_<HASH>.mjs` file:
 *        a. Adds `import { isDenied } from '../_deny-list.mjs';` near
 *           the top (after the existing `import path from 'node:path';`).
 *        b. Replaces the `createStandaloneHandler` function with a
 *           version that calls `isDenied(req.url)` at the top of the
 *           returned listener.
 *
 * Idempotent:
 *   - Detects the marker comment `BAI-SEC-10:deny-list` in the chunk
 *     and skips the chunk rewrite.
 *   - Re-runs of `pnpm run build:patch-entry` are safe.
 *
 * Failure modes:
 *   - dist/server/ or entry.mjs missing → exit 1.
 *   - chunks/server_*.mjs not found → exit 1.
 *   - createStandaloneHandler function body not found in chunk → exit 1
 *     (this means @astrojs/node changed its output format; the patcher
 *     needs updating).
 *
 * Hooks:
 *   - `package.json` build script runs this as the last step.
 *   - Also safe to run as `pnpm run build:patch-entry` for manual use.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const SRC_DENY_LIST = path.join(root, 'src', 'server', 'deny-list.mjs');
const SRC_SECURITY_HEADERS = path.join(root, 'scripts', 'security-headers.mjs');
const DIST_SERVER = path.join(root, 'dist', 'server');
const ENTRY = path.join(DIST_SERVER, 'entry.mjs');
const DENY_LIST_DEPLOY = path.join(DIST_SERVER, '_deny-list.mjs');
const SECURITY_HEADERS_DEPLOY = path.join(DIST_SERVER, '_security-headers.mjs');

// PATCH_MARKER is the per-build identifier we inject into the chunk. We
// started with BAI-SEC-10:deny-list for the deny-list patch and added
// BAI-DEPLOY-11:build-info when we introduced the x-brightai-build header,
// then BAI-DEPLOY-12:hsts when the Cloudflare Transform Rule approach
// turned out to be inert under CNAME setup (Transform Rule creates
// successfully but is not executed on responses — verified 2026-07-28).
// The function we replace the createStandaloneHandler with now stamps
// ALL three markers, so re-running the patcher against an
// already-patched chunk (with any marker present) would re-apply the
// same logic and produce a non-idempotent change. To keep idempotency
// tight, we treat ANY of the per-build markers as "chunk already
// patched" and skip the rewrite. The full patcher should re-run only
// after a fresh `astro build` (which regenerates the chunk with a new
// hash filename).
//
// BAI-DEPLOY-12 — HSTS INJECTION RATIONALE
// ========================================
// Why listener-level HSTS (not middleware, not meta, not _headers):
//   - middleware.ts in src/ runs only on SSR routes (/api/*). Prerendered
//     HTML in dist/client/ is served by staticHandler BEFORE the Astro
//     app handler — middleware is bypassed.
//   - <meta http-equiv="Strict-Transport-Security"> is honoured by NO
//     browser. HSTS is HTTP-layer only.
//   - public/_headers is the Netlify / Cloudflare Pages / Render Static
//     convention. Render Web Service (Node) does not read it.
//   - Cloudflare Transform Rule (scripts/setup-cloudflare-hsts-transform-rule.mjs)
//     is the design-intended layer, but brightai.site is on CNAME setup
//     at Cloudflare — the rule is created successfully but never executes
//     on responses. Cloudflare Workers Custom Domains work (proven on
//     hsts.brightai.site) but Workers Routes are also inert under CNAME
//     setup (proven 2026-07-28 — Route binds in dashboard but is not
//     invoked for brightai.site traffic).
// The only remaining HTTP-layer hook for the prerendered HTML responses
// is the Node server listener itself — the createStandaloneHandler
// returned function. Setting Strict-Transport-Security via res.setHeader
// there is the same layer that already stamps x-brightai-build, and it
// runs for every response (deny-list 404, static file 200, SSR 200/4xx/5xx).
const PATCH_MARKERS = [
  'BAI-SEC-10:deny-list',
  'BAI-DEPLOY-11:build-info',
  'BAI-DEPLOY-12:hsts',
];

function log(msg) { console.log(`[patch-server-entry] ${msg}`); }
function warn(msg) { console.error(`[patch-server-entry] WARN: ${msg}`); }
function die(msg) { console.error(`[patch-server-entry] FATAL: ${msg}`); process.exit(1); }

if (!fs.existsSync(SRC_DENY_LIST)) {
  die(`source deny-list module missing: ${SRC_DENY_LIST} — create it first`);
}
if (!fs.existsSync(DIST_SERVER)) {
  die(`dist/server/ missing — astro build did not run before this patcher`);
}
if (!fs.existsSync(ENTRY)) {
  die(`dist/server/entry.mjs missing — astro build did not produce the Node entry`);
}

// ── Step 1: copy the deny-list module to dist/server/ ──
const srcContent = fs.readFileSync(SRC_DENY_LIST, 'utf-8');
fs.writeFileSync(DENY_LIST_DEPLOY, srcContent, 'utf-8');
log(`wrote ${path.relative(root, DENY_LIST_DEPLOY)} (${srcContent.length} bytes)`);

// ── Step 1.1: BAI-P1-SEC-001 — copy the security-headers SoT to dist/server/ ──
// The patched listener imports RESPONSE_SECURITY_HEADERS from this copy so
// the CSP (Content-Security-Policy-Report-Only) + baseline headers are
// delivered as real HTTP response headers on EVERY response (static + SSR),
// from a single source of truth. This is the authoritative HTTP-layer
// posture for the Node service — the meta CSP was removed (BAI-P1-SEC-001).
const securityHeadersContent = fs.readFileSync(SRC_SECURITY_HEADERS, 'utf-8');
fs.writeFileSync(SECURITY_HEADERS_DEPLOY, securityHeadersContent, 'utf-8');
log(`wrote ${path.relative(root, SECURITY_HEADERS_DEPLOY)} (${securityHeadersContent.length} bytes)`);

// ── Step 1.5: BAI-DEPLOY-11 — capture build identity ──
// Read git SHA + build time at patch time. These are inlined into the
// chunk and also written to dist/server/_build-info.mjs for any module
// that wants to read them. Used by:
//   - the patched createStandaloneHandler listener (sets x-brightai-build
//     + x-brightai-build-time response headers on every response, before
//     staticHandler or appHandler),
//   - process.env.BRIGHTAI_BUILD_COMMIT / BRIGHTAI_BUILD_TIME (so SSR
//     routes like src/pages/api/health.ts can include the build identity
//     in their JSON response without importing a hashed chunk),
//   - scripts/verify-post-deploy.mjs (parses these from a live curl to
//     detect deployment drift).
//
// Failure modes:
//   - git rev-parse HEAD fails (e.g. a tarball that stripped .git) →
//     fall back to "unknown" with a warning. The deploy still proceeds.
//   - date command fails → same fallback. Patch is best-effort for the
//     build identity, hard-required for the deny-list (step 4).
function captureBuildIdentity() {
  let commit = 'unknown';
  let commitShort = 'unknown';
  let buildTime = 'unknown';
  try {
    commit = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    commitShort = commit.slice(0, 12);
  } catch (err) {
    warn(`could not read git SHA (continuing with "unknown"): ${err.message.split('\n')[0]}`);
  }
  try {
    buildTime = execSync('date -u +%Y-%m-%dT%H:%M:%SZ', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    // macOS BSD date is portable via +%Y-%m-%dT%H:%M:%SZ
    try {
      buildTime = execSync('date -u "+%Y-%m-%dT%H:%M:%SZ"', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (err2) {
      warn(`could not read build time (continuing with "unknown"): ${err2.message.split('\n')[0]}`);
    }
  }
  return { commit, commitShort, buildTime };
}

const BUILD_IDENTITY = captureBuildIdentity();
const BUILD_INFO_DEPLOY = path.join(DIST_SERVER, '_build-info.mjs');
const buildInfoContent =
  `// Auto-generated by scripts/patch-server-entry.mjs at build time.\n` +
  `// Do not edit by hand. Re-run \`pnpm run build:patch-entry\` to refresh.\n` +
  `export const BUILD_COMMIT = ${JSON.stringify(BUILD_IDENTITY.commit)};\n` +
  `export const BUILD_COMMIT_SHORT = ${JSON.stringify(BUILD_IDENTITY.commitShort)};\n` +
  `export const BUILD_TIME = ${JSON.stringify(BUILD_IDENTITY.buildTime)};\n` +
  `export const SERVICE = ${JSON.stringify('brightai-site')};\n`;
fs.writeFileSync(BUILD_INFO_DEPLOY, buildInfoContent, 'utf-8');
log(`wrote ${path.relative(root, BUILD_INFO_DEPLOY)} (commit ${BUILD_IDENTITY.commitShort}, built ${BUILD_IDENTITY.buildTime})`);

// ── Step 2: read entry.mjs and find the chunk it imports ──
const entryContent = fs.readFileSync(ENTRY, 'utf-8');
const exportLineRe = /export\s*\{\s*h\s+as\s+handler\s*,\s*o\s+as\s+options\s*,\s*a\s+as\s+startServer\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?/;
const entryMatch = entryContent.match(exportLineRe);
if (!entryMatch) {
  die(
    'entry.mjs format not recognised. Expected the @astrojs/node standalone pattern ' +
    '`export { h as handler, o as options, a as startServer } from \'./chunks/<hash>.mjs\'`.'
  );
}
const chunksRel = entryMatch[1];            // e.g. './chunks/server_AIN_EUWc.mjs'
const chunkAbs = path.resolve(path.dirname(ENTRY), chunksRel);
if (!fs.existsSync(chunkAbs)) {
  die(`chunk file referenced by entry.mjs not found: ${chunksRel} (resolved to ${chunkAbs})`);
}
log(`entry.mjs imports handler from: ${chunksRel}`);

// ── Step 3: rewrite entry.mjs to import the deny-list + build-info (for verifier sanity check) ──
// Idempotency strategy: strip ANY prior marker block (BAI-SEC-10 or
// BAI-DEPLOY-11) before adding the new one. This handles the case where
// a previous run added only the deny-list marker (BAI-SEC-10 era) and
// the current run needs to add both deny-list + build-info markers.
if (entryContent.includes("from './_deny-list.mjs'") && entryContent.includes("from './_build-info.mjs'")) {
  log('entry.mjs already references _deny-list.mjs + _build-info.mjs — skipping entry rewrite');
} else {
  // Strip any prior marker block: from the first marker comment through
  // the import lines that follow. The prior block can be in either order
  // and may have duplicate imports if a previous version of the patcher
  // was run more than once.
  const priorMarkerRe =
    /\/\/ BAI-SEC-10[\s\S]*?(?:^import\s+['"][^'"]+['"];?\s*\n)+/m;
  let base = entryContent;
  let stripped = 0;
  while (priorMarkerRe.test(base)) {
    base = base.replace(priorMarkerRe, '');
    stripped += 1;
  }

  // Add the new marker block at the top.
  const marker =
    `// BAI-SEC-10 (2026-07-25) — runtime deny-list enforced by the patched chunk.\n` +
    `// BAI-DEPLOY-11 (2026-07-25) — x-brightai-build header + process.env identity.\n` +
    `// Patcher: scripts/patch-server-entry.mjs. Idempotent.\n` +
    `import './_deny-list.mjs';\n` +
    `import './_build-info.mjs';\n\n`;
  const newEntry = marker + base;
  fs.writeFileSync(ENTRY, newEntry, 'utf-8');
  if (stripped > 0) {
    log(`entry.mjs: stripped ${stripped} prior marker block(s) + added current marker`);
  } else {
    log(`entry.mjs: added top-of-file import markers for deny-list + build-info (verifier sanity check)`);
  }
}

// ── Step 4: patch the chunk file ──
const chunkContent = fs.readFileSync(chunkAbs, 'utf-8');

// More precise check: the marker must appear as a token, not as a
// substring of a derivative name. Use a regex with a non-identifier
// character (or EOF) following the marker.
const markerRe = (m) =>
  new RegExp(`${m.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?![-_A-Za-z0-9])`);
const existingMarker = PATCH_MARKERS.find((m) => markerRe(m).test(chunkContent));
if (existingMarker) {
  log(`chunk already patched (found marker ${existingMarker}) — skipping chunk rewrite`);
} else {
  // 4a. Add the imports near the top of the chunk.
  //     - isDenied from the runtime deny-list (BAI-SEC-10).
  //     - BUILD_COMMIT + BUILD_TIME from the auto-generated build-info
  //       module (BAI-DEPLOY-11). Used to stamp x-brightai-build on
  //       every response and to populate process.env for SSR routes.
  //     Place them after the existing `import path from 'node:path';`
  //     line to group Node stdlib imports together. If that line is not
  //     found, fall back to placing after the first `import` line.
  const importLines = [
    `import { isDenied } from '../_deny-list.mjs';`,
    `import { BUILD_COMMIT, BUILD_TIME } from '../_build-info.mjs';`,
    `import { RESPONSE_SECURITY_HEADERS } from '../_security-headers.mjs';`,
  ];
  let newChunk = chunkContent;

  for (const importLine of importLines) {
    if (newChunk.includes(importLine)) {
      log(`chunk already imports ${importLine.split(' ')[1]} — skipping import injection`);
      continue;
    }
    const nodePathImportRe = /^import path from 'node:path';$/m;
    if (nodePathImportRe.test(newChunk)) {
      newChunk = newChunk.replace(nodePathImportRe, `import path from 'node:path';\n${importLine}`);
      log(`chunk: added "${importLine}" after existing node:path import`);
    } else {
      // Fallback: insert after the first import statement
      const firstImportRe = /^(import\s.+?;)$/m;
      const m = newChunk.match(firstImportRe);
      if (!m) {
        die('chunk has no import statements — unexpected @astrojs/node output format');
      }
      newChunk = newChunk.replace(firstImportRe, `${m[1]}\n${importLine}`);
      log(`chunk: inserted "${importLine}" after first import (fallback path)`);
    }
  }

  // 4b. Replace the `createStandaloneHandler` function body to inject the
  //     deny-list check at the top of the returned listener.
  //
  // Original function (from the @astrojs/node bundle, version 11.x):
  //
  //   function createStandaloneHandler(app, options, headersMap) {
  //     const appHandler = createAppHandler(app, options);
  //     const staticHandler = createStaticHandler(app, options);
  //     return (req, res) => {
  //       try {
  //         decodeURI(req.url);
  //       } catch {
  //         res.writeHead(400);
  //         res.end("Bad request.");
  //         return;
  //       }
  //       staticHandler(req, res, () => appHandler(req, res));
  //     };
  //   }
  //
  // We replace the entire function with a patched version that:
  //   1. Adds a marker comment (for idempotency detection).
  //   2. Calls `isDenied(req.url)` at the top of the listener — if true,
  //      writes 404 + safety headers and returns.
  //   3. Falls through to the original decodeURI / static / app flow.
  const fnStart = 'function createStandaloneHandler(';
  const fnIdx = newChunk.indexOf(fnStart);
  if (fnIdx === -1) {
    die('could not find `function createStandaloneHandler(` in the chunk — @astrojs/node output format changed; update this patcher');
  }

  // Find the matching closing brace. We walk forward counting { and },
  // skipping string literals and template literals.
  let depth = 0;
  let endIdx = -1;
  let inString = null; // '"' | "'" | '`'
  let escaped = false;
  for (let i = fnIdx; i < newChunk.length; i += 1) {
    const ch = newChunk[i];
    if (escaped) { escaped = false; continue; }
    if (inString) {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === inString) { inString = null; }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  if (endIdx === -1) {
    die('could not find end of `createStandaloneHandler` function body — patcher bug');
  }
  const originalFn = newChunk.slice(fnIdx, endIdx + 1);
  log(`chunk: located createStandaloneHandler (${originalFn.length} chars, lines ${newChunk.slice(0, fnIdx).split('\n').length}..${newChunk.slice(0, endIdx).split('\n').length})`);

  // Build the patched function. The body keeps the original decodeURI
  // check, staticHandler call, and appHandler fallback; we just add:
  //   (1) a deny-list short-circuit at the top of the returned listener
  //       (BAI-SEC-10),
  //   (2) x-brightai-build + x-brightai-build-time response headers on
  //       every response, set BEFORE staticHandler so they appear on
  //       both 200 static files and SSR responses (BAI-DEPLOY-11).
  // Build identity is read from the auto-generated _build-info.mjs
  // (written by step 1.5) and inlined via the import at the top of the
  // chunk. We also stamp process.env so SSR routes like api/health.ts
  // can include the build identity in their JSON response.
  //
  // Idempotency: the PATCH_MARKERS inside this function let step 4
  // detect an already-patched chunk and skip the rewrite. The two
  // markers are BAI-SEC-10:deny-list (deny-list short-circuit) and
  // BAI-DEPLOY-11:build-info (x-brightai-build response header +
  // process.env identity for SSR routes).
  const patchedFn = `function createStandaloneHandler(app, options, headersMap) {
  // BAI-SEC-10:deny-list + BAI-DEPLOY-11:build-info (2026-07-25) +
  // BAI-DEPLOY-12:hsts (2026-07-28) + BAI-P1-SEC-001 (2026-08-09) —
  // deployment-surface deny-list + build identity + full security
  // header posture (incl. Content-Security-Policy-Report-Only) at the
  // listener level. Runs BEFORE staticHandler reads any file from disk.
  // See src/server/deny-list.mjs, scripts/patch-server-entry.mjs.
  // BAI-DEPLOY-11: stamp process.env so SSR routes (api/health.ts) can
  // include the build identity in their JSON response.
  try {
    if (typeof process !== 'undefined' && process.env) {
      process.env.BRIGHTAI_BUILD_COMMIT = BUILD_COMMIT;
      process.env.BRIGHTAI_BUILD_TIME = BUILD_TIME;
    }
  } catch { /* ignore */ }
  const appHandler = createAppHandler(app, options);
  const staticHandler = createStaticHandler(app, options);
  return (req, res) => {
    // BAI-DEPLOY-11: stamp build identity on every response BEFORE the
    // deny-list check. Even denied responses carry the header so a
    // post-deploy gate can verify which build is live.
    // BAI-DEPLOY-12:hsts — set Strict-Transport-Security on every
    // response, including denied (404) and static file (200) responses.
    // BAI-P1-SEC-001 — apply the FULL RESPONSE_SECURITY_HEADERS posture
    // (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
    // Permissions-Policy, X-Robots-Tag, Content-Security-Policy-Report-Only)
    // on every response. The CSP is delivered as a real HTTP response
    // header here (NOT a meta tag) so Report-Only works, frame-ancestors
    // is honoured, and requests before meta-parse are covered. Values come
    // from the single source of truth scripts/security-headers.mjs (copied
    // to dist/server/_security-headers.mjs at build time).
    try {
      if (res && typeof res.setHeader === 'function') {
        try { res.setHeader('x-brightai-build', BUILD_COMMIT); } catch { /* ignore */ }
        try { res.setHeader('x-brightai-build-time', BUILD_TIME); } catch { /* ignore */ }
        for (const [name, value] of Object.entries(RESPONSE_SECURITY_HEADERS)) {
          try { res.setHeader(name, value); } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    // BAI-SEC-10 deny-list check — short-circuit to 404 before the static
    // file layer touches the disk. Fail-OPEN on any internal error so
    // a transient deny-list bug never breaks the public site.
    try {
      if (isDenied(req && typeof req.url === 'string' ? req.url : '/')) {
        try {
          res.writeHead(404, {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
            'X-Content-Type-Options': 'nosniff',
            'Content-Type': 'text/plain; charset=utf-8',
          });
        } catch {
          // headers already sent — fall through
        }
        try { res.end('Not Found'); } catch { /* ignore */ }
        return;
      }
    } catch {
      // fall through to original handler
    }
    try {
      decodeURI(req.url);
    } catch {
      res.writeHead(400);
      res.end("Bad request.");
      return;
    }
    staticHandler(req, res, () => appHandler(req, res));
  };
}`;

  newChunk = newChunk.slice(0, fnIdx) + patchedFn + newChunk.slice(endIdx + 1);
  fs.writeFileSync(chunkAbs, newChunk, 'utf-8');
  log(`chunk: patched createStandaloneHandler (${path.relative(root, chunkAbs)})`);
  log(`chunk: new file size: ${newChunk.length} bytes (was ${chunkContent.length})`);
}

log('done');
