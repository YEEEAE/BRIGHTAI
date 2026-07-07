#!/usr/bin/env node
/**
 * Link Graph Validator — checks that every <a href> in the published HTML
 * resolves to an existing route. Walks dist/ + public/ by default (the
 * actual production output); pass a different root as the first positional
 * arg if you need to validate a custom directory.
 *
 * Why not the project root by default? Walking the full repo would also
 * scan dist/, kernel/, qa-*.mjs, _reports/, _archive/ which are either
 * build artifacts, dev tooling, or archives — not part of the published
 * site. Scanning them produces noise (every <a href> looks "broken"
 * because the canonicalized route `/about/` doesn't match the project-
 * rooted route `/dist/about/`).
 *
 * dist/ + public/ is exactly what gets deployed to brightai.site.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRouteSet,
  canonicalPath,
  relPathToRoute,
} from "./indexing-recovery-utils.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Walk only `dist/` + `public/` (the deployable surface) and merge their
 * HTML files into one flat list. Routes are derived relative to each
 * surface so `/dist/about/index.html` registers as `/about/`, not
 * `/dist/about/`.
 *
 * Also index other published assets that <a href> can validly point to:
 * `/rss.xml`, `/sitemap.xml`, `/sitemap-*.xml`, webmanifest, robots.txt —
 * these exist in dist/ as actual files but are not HTML, so a pure-HTML
 * route set would falsely flag every link to them as broken.
 */
async function collectPublishedHtml(root) {
  const distDir = path.join(root, "dist");
  const publicDir = path.join(root, "public");
  const surfaces = [];
  for (const base of [distDir, publicDir]) {
    try {
      await fs.access(base);
      surfaces.push(base);
    } catch {
      // surface missing — skip silently
    }
  }
  const htmls = [];
  const assetRoutes = [];
  const stack0 = surfaces.map((base) => ({ abs: base, rel: "" }));
  while (stack0.length) {
    const { abs, rel } = stack0.pop();
    const entries = await fs.readdir(abs, { withFileTypes: true });
    for (const entry of entries) {
      const absChild = path.join(abs, entry.name);
      const relChild = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) stack0.push({ abs: absChild, rel: relChild });
      else if (entry.isFile()) {
        if (entry.name.endsWith(".html")) {
          htmls.push({ absPath: absChild, relPath: relChild, surface: path.basename(abs) });
        } else if (/^(rss|sitemap|sitemap-index)\.xml$|sitemap-.*\.xml$|robots\.txt$|manifest\.webmanifest$|llms.*\.txt$|humans\.txt$|ai\.txt$/i.test(entry.name)) {
          // Treat well-known assets as a route at `/<relPath-without-dist-prefix>`.
          const route = `/${relChild}`;
          assetRoutes.push(route);
        }
      }
    }
  }
  return { htmls, assetRoutes };
}

export async function validateLinkGraph({ root = PROJECT_ROOT } = {}) {
  const { htmls, assetRoutes } = await collectPublishedHtml(root);
  const routes = new Set([
    ...htmls.map((h) => relPathToRoute(h.relPath)).filter(Boolean).map(canonicalPath),
    ...assetRoutes.map((r) => canonicalPath(r) || r),
  ]);
  const htmlFiles = htmls.map((h) => h.relPath);
  const brokenLinks = [];
  const legacyPaths = [];
  const htmlSuffixes = [];

  for (const { relPath, absPath } of htmls) {
    const html = await fs.readFile(absPath, "utf8");
    // Skip error pages — they intentionally list routes that may or may
    // not exist depending on the error, polluting the broken-link signal.
    if (/(?:^|\/)(?:404|500|error)\.html$/i.test(relPath)) continue;
    for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi)) {
      const href = match[1].trim();
      if (/^(?:mailto:|tel:|javascript:|https?:\/\/(?!brightai\.site)|\/\/)/i.test(href)) continue;
      if (href.includes("${")) continue;
      const normalized = canonicalPath(href);
      if (!normalized) continue;
      const finding = { relPath, originalHref: href, normalized };
      if (/\/(?:demo)\/pages\//i.test(href)) legacyPaths.push(finding);
      if (/\.html(?:[?#]|$)/i.test(href) && !/(?:404|500|error)\.html/i.test(href)) {
        htmlSuffixes.push(finding);
      }
      if (!routes.has(normalized)) brokenLinks.push(finding);
    }
  }

  return { filesScanned: htmlFiles.length, brokenLinks, legacyPaths, htmlSuffixes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rootArg = process.argv.find((arg, i) => i > 1 && !arg.startsWith("--"));
  const root = rootArg ? path.resolve(rootArg) : PROJECT_ROOT;
  const result = await validateLinkGraph({ root });
  console.log(JSON.stringify(result, null, 2));
  const issues = result.brokenLinks.length + result.legacyPaths.length + result.htmlSuffixes.length;
  if (process.argv.includes("--strict") && issues) process.exitCode = 1;
}

