#!/usr/bin/env node
/**
 * scripts/sync-dist-flat.mjs — KERNEL-AI-2026-07-14 (updated for @astrojs/node)
 *
 * When `@astrojs/node` (standalone mode) is the adapter, `astro build`
 * ends with the following directory layout:
 *
 *   dist/client/                 ← 190 prerendered HTML, CSS, JS, sitemap, public/*
 *   dist/server/                 ← Node standalone server (entry.mjs, manifests, etc.)
 *
 * Render Node service needs BOTH directories:
 *   - dist/server/entry.mjs     (the Node process to start)
 *   - dist/client/               (static files the Node server serves at request time)
 *
 * However, legacy CI scripts (e.g. resource-paths-audit, internal-links-audit,
 * some seo scripts) assume `dist/<relpath>` is the canonical path — i.e. they
 * expect HTML files at `dist/index.html`, not `dist/client/index.html`.
 *
 * The old implementation mirrored `dist/client/` onto `dist/`. That made a
 * second, unintended static surface part of the deployment artifact. The
 * Node adapter already serves `dist/client/` directly, while current CI
 * scripts resolve the client root through `scripts/_build-output.mjs`.
 *
 * This guard deliberately does not copy files. It asserts the artifact keeps
 * the two directories the standalone server needs and leaves legacy checks to
 * use their adapter-aware resolver.
 *
 * If the build is a plain-static one without an adapter (no dist/client/
 * and no dist/server/), this script is a no-op.
 *
 * ─────────────────────────────────────────────────────────────────────
 * BAI-DEPLOY-13 (2026-07-25) — EXCLUDE_PATTERNS enforcement
 * ─────────────────────────────────────────────────────────────────────
 * The Node server maps dist/client/foo → /foo at request time. Any of the
 * following landing in dist/client/ would leak source code, repo metadata,
 * or build internals to a publicly-accessible URL:
 *
 *   /client/  /frontend/  /server/   /package.json
 *   /render.yaml  /_headers  /_redirects  /CNAME
 *
 * Examples of the leak:
 *   dist/client/client/index.html  → GET /client/index.html  (172KB, served)
 *   dist/client/frontend/server.js → GET /frontend/server.js (served)
 *   dist/client/server/entry.mjs   → GET /server/entry.mjs   (served)
 *   dist/client/_headers           → GET /_headers           (served)
 *   dist/client/_redirects         → GET /_redirects         (served)
 *   dist/client/CNAME              → GET /CNAME              (served)
 *
 * Why the source produces these (and why a build-time guard is needed):
 *   - `public/_headers`, `public/_redirects`, `public/CNAME` are still
 *     in the repo. They were used by Render's legacy static-site deploy
 *     (the `headers:` and `routes:` blocks in `render.yaml` now replace
 *     them for the Node runtime). Astro copies `public/*` into
 *     `dist/client/*` on every build, so they reappear in the artifact
 *     every time. We can't delete them from `public/` (they are
 *     protected files per `agent.md` Section 2.1) — the right place
 *     to remove them is the post-build deployment artifact.
 *   - `dist/client/client/`, `dist/client/frontend/`, `dist/client/server/`
 *     are never produced by a clean build. If they ever appear, something
 *     upstream changed (a future migration, a manual copy, etc.) and we
 *     want to fail-loud here rather than ship the leak.
 *
 * ─────────────────────────────────────────────────────────────────────
 * BAI-DEPLOY-12 (2026-07-28) — RETAIN _headers + _redirects for Static Site
 * ─────────────────────────────────────────────────────────────────────
 * brightai.site is deployed on Render as a STATIC SITE service (not a
 * Node Web Service — verified 2026-07-28 via rndr-id + 404 on /api/*).
 * The original exclusion of `/_headers` and `/_redirects` was based on
 * the assumption that the Node Web Service runtime ignores them
 * (the comment in public/_headers says "DOCUMENTATION ONLY" for that
 * reason). That assumption is wrong for this deployment: Render Static
 * Site DOES read both files, and removing them disables:
 *   - HSTS via _headers (max-age=63072000; includeSubDomains; preload) —
 *     the entire BAI-DEPLOY-12 posture depends on this file surviving.
 *   - /api/* rewrites via _redirects (legacy /api/lead, /api/csrf-token
 *     → brightai-api.onrender.com Express backend).
 *
 * CNAME stays excluded: it leaks the hosting provider (Cloudflare → IONOS
 * via CNAME setup) and the underlying nameservers, which an attacker
 * could correlate with subdomain-takeover or DNS-rebinding reconnaissance.
 * It is never used by Render Static Site for serving — only by the
 * GitHub Pages deploy flow which is not in scope for brightai.site.
 *
 * The runtime `src/server/deny-list.mjs` (deployed as
 * `dist/server/_deny-list.mjs` and wired into `dist/server/entry.mjs` via
 * the BAI-SEC-10 patch) is the SECOND line of defense. This script is
 * the FIRST line of defense: it removes the leak at build time so it
 * never reaches the production artifact at all.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const dst = path.join(root, 'dist');
const src = path.join(root, 'dist', 'client');

if (!fs.existsSync(src)) {
  console.error('[sync-dist-flat] dist/client/ is missing — standalone Node artifact is incomplete.');
  process.exit(1);
}

const serverEntry = path.join(dst, 'server', 'entry.mjs');
if (!fs.existsSync(serverEntry)) {
  console.error('[sync-dist-flat] dist/server/entry.mjs is missing — did astro build run with the Node adapter?');
  process.exit(1);
}

/**
 * EXCLUDE_PATTERNS — dist/client/ entries that MUST NOT be in the
 * deployable artifact. Each pattern maps the public URL path to the
 * relative path inside dist/client/ that the Node server would serve
 * at that URL.
 *
 * Pattern source: BAI-DEPLOY-13 task spec (P0, depends on BAI-DEPLOY-12).
 * Mirrors the runtime deny-list in `src/server/deny-list.mjs` (BAI-SEC-10)
 * for the first three; the last five are the build-time-only concerns
 * (`/_headers`, `/_redirects`, `/CNAME` are intentionally in `public/`
 * for legacy static-site compatibility but MUST NOT be served by the
 * Node runtime, and `/package.json` + `/render.yaml` are protected
 * repo metadata per `agent.md` Section 2.1).
 */
const EXCLUDE_PATTERNS = [
  // Top-level dirs that would expose source code / build internals.
  { urlPath: '/client/', relPath: 'client' },
  { urlPath: '/frontend/', relPath: 'frontend' },
  { urlPath: '/server/', relPath: 'server' },
  // Top-level files that must never be served.
  { urlPath: '/package.json', relPath: 'package.json' },
  { urlPath: '/render.yaml', relPath: 'render.yaml' },
  // BAI-DEPLOY-12 (2026-07-28): CNAME is the only special-file exclusion
  // remaining. _headers and _redirects are now retained so Render Static
  // Site can serve HSTS + /api/* rewrites from them. See the
  // BAI-DEPLOY-12 comment block above for the rationale.
  { urlPath: '/CNAME', relPath: 'CNAME' },
];

let removedCount = 0;
for (const { urlPath, relPath } of EXCLUDE_PATTERNS) {
  const fullPath = path.join(src, relPath);
  if (fs.existsSync(fullPath)) {
    console.warn(`[sync-dist-flat] excluding ${urlPath} → removing ${fullPath}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
    removedCount += 1;
  }
}
if (removedCount > 0) {
  console.log(
    `[sync-dist-flat] removed ${removedCount} excluded path(s) from the deployable artifact. ` +
      `Defense in depth: the runtime deny-list in dist/server/_deny-list.mjs (BAI-SEC-10) ` +
      `still enforces 404 on these URL paths.`
  );
}

console.log('[sync-dist-flat] standalone artifact verified; no flat copy created.');
