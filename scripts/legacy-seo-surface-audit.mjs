#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalizeSitePath,
  relPathToSitePath,
} from "./seo-url-map.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SITE_ORIGIN = "https://brightai.site";
const IGNORED_DIRS = new Set([
  ".git",
  ".agents",
  ".claude",
  ".gemini",
  ".kilo",
  ".render-static",
  "node_modules",
  "reports",
  "components",
]);
const MACHINE_READABLE_FILES = ["robots.txt", "llms.txt", "llms-full.txt", "ai.txt"];
const LEGACY_PUBLIC_PATH = /\/(?:demo)\/pages\//i;
const LEGACY_DESTINATION_PATH = /\/(?:demo)\/pages\//i;

async function walkFiles(root, current = "", files = [], ignoreSet = IGNORED_DIRS) {
  const entries = await fs.readdir(path.join(root, current), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoreSet.has(entry.name)) continue;
    const relPath = path.posix.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(root, relPath, files, ignoreSet);
    } else if (entry.isFile()) {
      files.push(relPath);
    }
  }
  return files;
}

function routeVariantsForHtml(relPath) {
  const sitePath = relPathToSitePath(relPath);
  if (!sitePath) return [];
  const canonicalPath = canonicalizeSitePath(sitePath);
  const variants = new Set([canonicalPath]);
  if (canonicalPath !== "/") {
    variants.add(canonicalPath.replace(/\/$/, ""));
  }
  return [...variants];
}

function parseNetlifyRedirects(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status = "301"] = line.split(/\s+/);
      return { source: "_redirects", from, to, status };
    });
}

function isDynamicRoute(value) {
  return /[:*]/.test(value);
}

function localPathFromUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.origin === SITE_ORIGIN ? decodeURIComponent(parsed.pathname) : null;
    } catch {
      return null;
    }
  }
  if (!value.startsWith("/")) return null;
  try {
    return decodeURIComponent(value.split(/[?#]/, 1)[0]);
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function comparableRedirectPath(value) {
  if (!value || isDynamicRoute(value)) return null;
  try {
    const parsed = new URL(value, `${SITE_ORIGIN}/`);
    if (parsed.origin !== SITE_ORIGIN) return null;
    return decodeURIComponent(parsed.pathname).replace(/\/{2,}/g, "/");
  } catch {
    return null;
  }
}

function routeExists(route, routeSet, fileSet) {
  if (!route) return true;
  const rawRelative = route.replace(/^\/+/, "").replace(/\/+$/, "");
  if (fileSet.has(rawRelative)) return true;
  const canonical = canonicalizeSitePath(route);
  if (routeSet.has(canonical) || routeSet.has(canonical.replace(/\/$/, ""))) return true;
  const relative = canonical.replace(/^\/+/, "");
  if (fileSet.has(relative)) return true;
  if (fileSet.has(path.posix.join(relative, "index.html"))) return true;
  if (fileSet.has(`${relative}.html`)) return true;
  // Handle .html targets: /kernel/approvals.html -> check kernel/approvals/index.html
  if (route.endsWith(".html")) {
    const noExt = route.replace(/\.html$/, "");
    const canonicalNoExt = canonicalizeSitePath(noExt);
    if (routeSet.has(canonicalNoExt) || routeSet.has(canonicalNoExt.replace(/\/$/, ""))) return true;
    const relativeNoExt = canonicalNoExt.replace(/^\/+/, "");
    if (fileSet.has(path.posix.join(relativeNoExt, "index.html"))) return true;
  }
  return false;
}

function extractPublicLegacyLinks(content, relPath) {
  const findings = [];
  const regex = /\b(?:href|src|action|data-href|data-src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(content))) {
    if (LEGACY_PUBLIC_PATH.test(match[1])) {
      findings.push(`${relPath}: ${match[1]}`);
    }
  }
  return findings;
}

function extractBrightAiUrls(content) {
  return [...content.matchAll(/https:\/\/brightai\.site\/[^\s<>"')\]]*/gi)]
    .map((match) => match[0].replace(/[.,;:]$/, ""));
}

export async function auditLegacySeoSurface({ root = DEFAULT_ROOT } = {}) {
  const sourceFiles = await walkFiles(root);
  // Also include dist output for route existence checks (Astro generates pages there)
  const distDir = path.join(root, "dist", "client");
  let distFiles = [];
  try {
    // When walking dist/client, only ignore node_modules and .git
    distFiles = await walkFiles(distDir, "", [], new Set(["node_modules", ".git"]));
  } catch {
    // dist/client may not exist yet
  }
  const allFiles = [...sourceFiles, ...distFiles];
  const fileSet = new Set(allFiles);
  const htmlFiles = sourceFiles.filter((file) => file.endsWith(".html"));
  const routeSet = new Set(["/"]);

  // Build routes from both source HTML and dist HTML
  for (const htmlFile of allFiles.filter((f) => f.endsWith(".html"))) {
    for (const route of routeVariantsForHtml(htmlFile)) routeSet.add(route);
  }

  const redirectsJsonPath = fsSync.existsSync(path.join(root, "redirects.json"))
    ? path.join(root, "redirects.json")
    : path.join(root, "public", "redirects.json");
  const redirectsJson = JSON.parse(await fs.readFile(redirectsJsonPath, "utf8"));
  const jsonRedirects = (redirectsJson.redirects || []).map((entry) => ({
    source: "redirects.json",
    from: entry.from,
    to: entry.to,
    status: String(entry.status || 301),
  }));
  const redirectsPath = fsSync.existsSync(path.join(root, "_redirects"))
    ? path.join(root, "_redirects")
    : path.join(root, "public", "_redirects");
  const netlifyRedirects = parseNetlifyRedirects(
    await fs.readFile(redirectsPath, "utf8"),
  );
  const redirects = [...jsonRedirects, ...netlifyRedirects];

  const selfRedirects = [];
  const missingRedirectDestinations = [];
  for (const redirect of redirects) {
    if (isDynamicRoute(redirect.from) || isDynamicRoute(redirect.to)) continue;
    const from = localPathFromUrl(redirect.from);
    const to = localPathFromUrl(redirect.to);
    const comparableFrom = comparableRedirectPath(redirect.from);
    const comparableTo = comparableRedirectPath(redirect.to);
    // Only flag as self-redirect if the paths are identical after canonicalization
    // AND it's not just a trailing-slash normalization (which is valid)
    if (
      comparableFrom &&
      comparableTo &&
      comparableFrom === comparableTo &&
      redirect.status !== "200" &&
      from !== to // Skip trailing-slash normalizations like /about -> /about/
    ) {
      selfRedirects.push(`${redirect.source}: ${redirect.from} -> ${redirect.to}`);
    }
    if (to && !routeExists(to, routeSet, fileSet)) {
      missingRedirectDestinations.push(`${redirect.source}: ${redirect.from} -> ${redirect.to}`);
    }
  }

  const publicLegacyLinks = [];
  for (const htmlFile of htmlFiles) {
    const content = await fs.readFile(path.join(root, htmlFile), "utf8");
    publicLegacyLinks.push(...extractPublicLegacyLinks(content, htmlFile));
  }

  const missingMachineReadableUrls = [];
  for (const relPath of MACHINE_READABLE_FILES) {
    const machinePath = fsSync.existsSync(path.join(root, relPath))
      ? path.join(root, relPath)
      : path.join(root, "public", relPath);
    const content = await fs.readFile(machinePath, "utf8");
    for (const url of extractBrightAiUrls(content)) {
      const pathname = new URL(url).pathname;
      if (!routeExists(pathname, routeSet, fileSet)) {
        missingMachineReadableUrls.push(`${relPath}: ${url}`);
      }
    }
  }

  const legacyRuntimeDestinations = [];
  for (const relPath of allFiles.filter((file) => {
    return /\.(?:js|mjs)$/i.test(file) && /redirect/i.test(path.posix.basename(file));
  })) {
    if (relPath === "redirects.json" || relPath === "scripts/normalize-legacy-redirects.mjs") continue;
    const content = await fs.readFile(path.join(root, relPath), "utf8");
    for (const match of content.matchAll(/["'`]([^"'`]*\/(?:demo)\/pages\/[^"'`]*)["'`]/gi)) {
      if (LEGACY_DESTINATION_PATH.test(match[1])) {
        legacyRuntimeDestinations.push(`${relPath}: ${match[1]}`);
      }
    }
  }

  return {
    htmlFilesScanned: htmlFiles.length,
    redirectsScanned: redirects.length,
    selfRedirects: [...new Set(selfRedirects)].sort(),
    missingRedirectDestinations: [...new Set(missingRedirectDestinations)].sort(),
    publicLegacyLinks: [...new Set(publicLegacyLinks)].sort(),
    missingMachineReadableUrls: [...new Set(missingMachineReadableUrls)].sort(),
    legacyRuntimeDestinations: [...new Set(legacyRuntimeDestinations)].sort(),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await auditLegacySeoSurface();
  console.log(JSON.stringify(result, null, 2));
  const issueCount =
    result.selfRedirects.length +
    result.missingRedirectDestinations.length +
    result.publicLegacyLinks.length +
    result.missingMachineReadableUrls.length +
    result.legacyRuntimeDestinations.length;
  process.exitCode = issueCount > 0 ? 1 : 0;
}
