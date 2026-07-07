import fs from "node:fs/promises";
import path from "node:path";

export const SITE_ORIGIN = "https://brightai.site";
// REPORTS-SEO-FOUNDATION (2026-07-07): added agent / worktree dirs to the
// ignorelist so audit output isn't polluted by code living inside tool
// sandboxes (mavis, hermes, kiro, kilo, roo, claude, opencode worktrees).
// None of these directories ship to production.
export const IGNORED_DIRS = new Set([
  ".git",
  ".agents",
  ".render-static",
  "node_modules",
  "reports",
  ".kilo",
  ".hermes",
  ".kiro",
  ".roo",
  ".claude",
  ".vscode",
  ".astro",
  "_archive",
]);

export async function walkFiles(root, current = "", files = []) {
  const entries = await fs.readdir(path.join(root, current), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
    const relPath = path.posix.join(current, entry.name);
    if (entry.isDirectory()) await walkFiles(root, relPath, files);
    else if (entry.isFile()) files.push(relPath);
  }
  return files;
}

export function canonicalPath(value) {
  if (!value) return null;
  let parsed;
  try {
    parsed = new URL(value, SITE_ORIGIN);
  } catch {
    return null;
  }
  if (parsed.origin !== SITE_ORIGIN) return null;
  let pathname = decodeURIComponent(parsed.pathname).replace(/\/{2,}/g, "/");
  pathname = pathname.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "/");
  if (pathname !== "/" && !pathname.endsWith("/")) pathname += "/";
  return pathname;
}

export function redirectPath(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value, SITE_ORIGIN);
    if (parsed.origin !== SITE_ORIGIN) return null;
    return decodeURIComponent(parsed.pathname).replace(/\/{2,}/g, "/");
  } catch {
    return null;
  }
}

export function relPathToRoute(relPath) {
  const normalized = relPath.replaceAll("\\", "/");
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.slice(0, -10)}`;
  }
  if (normalized.endsWith(".html")) {
    return `/${normalized.slice(0, -5)}/`;
  }
  return null;
}

export function buildRouteSet(htmlFiles) {
  return new Set(htmlFiles.map(relPathToRoute).filter(Boolean).map(canonicalPath));
}

export function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRedirects(content, source) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status = "301"] = line.split(/\s+/);
      return { source, from, to, status: Number(status) };
    });
}
