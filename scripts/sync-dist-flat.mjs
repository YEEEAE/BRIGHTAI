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
 * To keep BOTH deployment and legacy CI working, this script mirrors
 * `dist/client/` onto `dist/` after the build (overlapping files are
 * overwritten; no existing files in dist/ are removed). This way:
 *   - dist/server/entry.mjs still exists for startCommand
 *   - dist/client/ still exists for the Node server's static file serving
 *   - dist/index.html, dist/about/index.html, etc. exist for legacy scripts
 *
 * If the build is a plain-static one without an adapter (no dist/client/
 * and no dist/server/), this script is a no-op.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const dst = path.join(root, 'dist');
const src = path.join(root, 'dist', 'client');

// Helper: copy a single file
function copyFileSync(srcFile, dstFile) {
  fs.mkdirSync(path.dirname(dstFile), { recursive: true });
  fs.copyFileSync(srcFile, dstFile);
}

// Helper: walk src and copy each file to dst (preserving relative paths)
function mirrorInto(srcDir, dstDir) {
  let count = 0;
  function walk(sDir, dDir) {
    if (!fs.existsSync(sDir)) return;
    for (const entry of fs.readdirSync(sDir, { withFileTypes: true })) {
      const s = path.join(sDir, entry.name);
      const d = path.join(dDir, entry.name);
      if (entry.isDirectory()) {
        walk(s, d);
      } else if (entry.isFile()) {
        copyFileSync(s, d);
        count++;
      }
    }
  }
  walk(srcDir, dstDir);
  return count;
}

if (!fs.existsSync(src)) {
  console.log('[sync-dist-flat] no dist/client/ found — assuming plain static build, no-op.');
  process.exit(0);
}

if (!fs.existsSync(dst)) {
  console.error('[sync-dist-flat] dist/ does not exist — did astro build run?');
  process.exit(1);
}

// Mirror dist/client/ → dist/ (does NOT remove anything; just adds/overwrites).
// This preserves dist/server/ AND keeps dist/client/ intact.
const fileCount = mirrorInto(src, dst);
console.log(`[sync-dist-flat] mirrored dist/client/ → dist/ (${fileCount} file(s) copied; dist/server/ preserved).`);
