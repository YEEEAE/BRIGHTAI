#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRouteSet,
  canonicalPath,
  parseRedirects,
  redirectPath,
  walkFiles,
} from "./indexing-recovery-utils.mjs";
import {
  resolveClientBuildRoot,
  resolveClientSitemapFile,
  listClientHtmlFiles,
} from "./_build-output.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// REDIRECTS-CHECK-001 (2026-07-18): unify client build root resolution.
// Before this change the script walked `dist/` directly, which after
// @astrojs/node adapter (KERNEL-AI-2026-07-14) might miss HTML files if
// `sync-dist-flat.mjs` hasn't run yet. Now we read from the canonical
// client root via _build-output.mjs and bail loudly when no build exists.
const clientBuild = resolveClientBuildRoot(ROOT);

async function loadRedirects(root) {
  let netlify = [];
  try {
    netlify = parseRedirects(await fs.readFile(path.join(root, "_redirects"), "utf8"), "_redirects");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const json = JSON.parse(await fs.readFile(path.join(root, "redirects.json"), "utf8"));
  return [...netlify, ...(json.redirects || []).map((entry) => ({
    source: "redirects.json",
    from: entry.from,
    to: entry.to,
    status: Number(entry.status || 301),
  }))];
}

export async function checkRedirectDestinations({ root = ROOT } = {}) {
  // جمع HTML routes من جذر المشروع (public + src)
  const rootHtmlFiles = (await walkFiles(root)).filter((file) => file.endsWith(".html"));
  const routes = buildRouteSet(rootHtmlFiles);

  // REDIRECTS-CHECK-001: prefer the unified client build root (dist/client/
  // when present, else dist/) for the post-build route set. This is the
  // single source of truth shared with the other 3 verification scripts.
  const clientRoot = (resolveClientBuildRoot(root).root) ?? path.join(root, "dist");
  try {
    const distHtmlFiles = await listClientHtmlFiles(root);
    for (const f of distHtmlFiles) {
      const rel = path.relative(clientRoot, f).replaceAll("\\", "/");
      const r = canonicalPath(
        "/" + rel.replace(/\/index\.html$/, "/").replace(/\.html$/, "/")
      );
      if (r) routes.add(r);
    }
  } catch {
    // dist غير موجود - متوقع قبل build
  }

  // إضافة special root files كـ valid destinations
  const SPECIAL_DESTINATIONS = new Set([
    "/404.html",
    "/500.html",
    "/blog/feed.xml",
    "/sitemap.xml",
    "/llms.txt",
    "/llms-full.txt",
    "/ai.txt",
    "/robots.txt",
    "/manifest.webmanifest",
  ]);
  for (const sp of SPECIAL_DESTINATIONS) {
    const r = canonicalPath(sp);
    if (r) routes.add(r);
    // أضف المسار كما هو أيضاً بدون canonical transform لملفات .xml/.txt
    routes.add(sp);
  }

  // REDIRECTS-CHECK-001: prefer the sitemap emitted at the client build
  // root. Fall back to public/sitemap.xml (the source-of-truth) and the
  // old root-level sitemap.xml for back-compat with older branches.
  const sitemapCandidates = [
    resolveClientSitemapFile(root),
    path.join(root, "public", "sitemap.xml"),
    path.join(root, "sitemap.xml"),
  ].filter(Boolean);
  const SITE_ORIGIN = "https://brightai.live";
  for (const sitemapPath of sitemapCandidates) {
    try {
      const sitemapXml = await fs.readFile(sitemapPath, "utf8");
      const locMatches = sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g);
      for (const m of locMatches) {
        try {
          const u = new URL(m[1].trim());
          if (u.origin === SITE_ORIGIN) {
            const r = canonicalPath(u.pathname);
            if (r) routes.add(r);
          }
        } catch {
          // ignore invalid URLs
        }
      }
      // Stop at the first readable sitemap candidate — duplicates are
      // harmless (Set dedup) but reading every candidate wastes I/O on
      // a 166-URL file.
      if (locMatches && sitemapPath) break;
    } catch {
      // try next candidate
    }
  }

  const redirects = await loadRedirects(root);
  const permanentRedirects = redirects.filter(
    (redirect) => redirect.status >= 300 && redirect.status < 400,
  );
  const redirectMap = new Map();
  const redirectSources = new Set();
  const selfRedirects = [];
  const missingDestinations = [];
  const htmlDestinations = [];
  const duplicateSources = [];

  for (const redirect of permanentRedirects) {
    if (/[:*]/.test(redirect.from) || /[:*]/.test(redirect.to)) continue;
    const from = redirectPath(redirect.from);
    const to = redirectPath(redirect.to);
    if (!from || !to) continue;
    redirectSources.add(from);
  }

  for (const redirect of permanentRedirects) {
    if (/[:*]/.test(redirect.from) || /[:*]/.test(redirect.to)) continue;
    const from = redirectPath(redirect.from);
    const to = redirectPath(redirect.to);
    if (!from || !to) continue;
    if (from === to) selfRedirects.push(redirect);
    if (/\.html(?:[?#]|$)/i.test(redirect.to)) htmlDestinations.push(redirect);
    if (!routes.has(canonicalPath(to)) && !redirectSources.has(to)) missingDestinations.push(redirect);
    const sourceKey = `${redirect.source}:${from}`;
    if (redirectMap.has(sourceKey) && redirectMap.get(sourceKey) !== to) {
      duplicateSources.push(redirect);
    } else {
      redirectMap.set(sourceKey, to);
    }
  }

  const routeMap = new Map();
  for (const redirect of permanentRedirects) {
    if (/[:*]/.test(redirect.from) || /[:*]/.test(redirect.to)) continue;
    const from = redirectPath(redirect.from);
    const to = redirectPath(redirect.to);
    if (from && to && !routeMap.has(from)) routeMap.set(from, to);
  }
  const chains = [];
  const cycles = [];
  for (const [start, first] of routeMap) {
    if (routeMap.has(first)) chains.push({ from: start, via: first, to: routeMap.get(first) });
    const seen = new Set([start]);
    let current = first;
    while (routeMap.has(current)) {
      if (seen.has(current)) {
        cycles.push({ from: start, at: current });
        break;
      }
      seen.add(current);
      current = routeMap.get(current);
    }
  }

  return {
    redirectsScanned: redirects.length,
    selfRedirects,
    missingDestinations,
    htmlDestinations,
    duplicateSources,
    chains,
    cycles,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await checkRedirectDestinations();
  console.log(JSON.stringify(result, null, 2));
  const issueCount = Object.entries(result)
    .filter(([key]) => key !== "redirectsScanned")
    .reduce((sum, [, value]) => sum + value.length, 0);
  if (issueCount) process.exitCode = 1;
}
