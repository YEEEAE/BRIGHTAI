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

console.log('[sync-dist-flat] standalone artifact verified; no flat copy created.');
