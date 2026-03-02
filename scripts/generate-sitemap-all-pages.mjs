#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const BASE_URL = "https://brightai.site";
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "sitemap.xml");

const STATIC_FILES = [
  "index.html",
  "docs.html",
];

const ROOT_INDEX_DIRS = [
  "about",
  "ai-agent",
  "ai-bots",
  "blog",
  "case-studies",
  "consultation",
  "contact",
  "data-analysis",
  "health",
  "machine-learning",
  "partners",
  "services",
  "smart-automation",
  "tools",
  "what-is-ai",
];

const HTML_SCAN_DIRS = ["frontend/pages"];
const EXCLUDE_FILES = new Set(["404.html", "500.html"]);
const LOW_QUALITY_BLOGGER_FILES = new Set([
  "agint-bblog.html",
  "ai.html",
  "analysy.html",
  "auto.html",
  "digital.html",
  "gov.html",
  "atou-job.html",
  "cloude-opus-4.6.html",
  "production-line-2.html",
]);

function isLowQualityPath(relPath) {
  const normalized = relPath.replace(/\\/g, "/");

  if (normalized.startsWith("frontend/pages/interview/")) return true;
  if (normalized.startsWith("frontend/pages/botAI/")) return true;
  if (normalized.startsWith("frontend/pages/offline/")) return true;
  if (normalized.startsWith("frontend/pages/terms/")) return true;

  if (normalized.startsWith("frontend/pages/blogger/")) {
    const base = path.basename(normalized);
    if (/\s/.test(base)) return true;
    if (base.includes("_")) return true;
    if (/\.doc\.html$/i.test(base)) return true;
    if (LOW_QUALITY_BLOGGER_FILES.has(base)) return true;
  }

  return false;
}

function toIsoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function encodeUrlPath(urlPath) {
  if (urlPath === "/") return "/";
  const trailingSlash = urlPath.endsWith("/");
  const encodeSegment = (segment) =>
    encodeURIComponent(segment).replace(/[!'()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    );
  const encoded = urlPath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeSegment(segment))
    .join("/");
  return `/${encoded}${trailingSlash ? "/" : ""}`;
}

function fileToUrlPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");

  if (normalized === "index.html") return "/";
  if (normalized === "docs.html") return "/docs";

  if (normalized.endsWith("/index.html")) {
    const dir = normalized.replace(/\/index\.html$/, "");

    if (ROOT_INDEX_DIRS.includes(dir)) return `/${dir}`;
    if (dir.startsWith("frontend/pages/ai-bots/")) {
      return `/${dir.replace(/^frontend\/pages\//, "")}`;
    }
    if (dir.startsWith("frontend/pages/try/")) {
      return `/${dir.replace(/^frontend\/pages\//, "")}`;
    }
    if (dir.startsWith("frontend/pages/demo/")) {
      return `/${dir.replace(/^frontend\/pages\//, "")}`;
    }
    if (dir === "frontend/pages/ai-workflows") return "/ai-workflows";
    if (dir === "frontend/pages/ai-scolecs") return "/ai-scolecs";
    if (dir === "frontend/pages/smart-medical-archive") return "/smart-medical-archive";
    if (dir === "frontend/pages/privacy-cookies") return "/privacy-cookies";
    if (dir === "frontend/pages/job.MAISco") return "/job.MAISco";
    if (dir === "frontend/pages/interview") return "/interview";
    return null;
  }

  if (normalized.startsWith("frontend/pages/blogger/") && normalized.endsWith(".html")) {
    return `/blog/${path.basename(normalized, ".html")}`;
  }

  if (normalized.startsWith("frontend/pages/blog/automation/") && normalized.endsWith(".html")) {
    return `/blog/automation/${path.basename(normalized, ".html")}`;
  }

  if (normalized.startsWith("frontend/pages/blog/data-analytics/") && normalized.endsWith(".html")) {
    return `/blog/data-analytics/${path.basename(normalized, ".html")}`;
  }

  if (normalized.startsWith("frontend/pages/docs/") && normalized.endsWith(".html")) {
    const slug = path.basename(normalized, ".html");
    if (slug === "docs") return null;
    return `/docs/${slug}`;
  }

  if (normalized.startsWith("frontend/pages/sectors/") && normalized.endsWith(".html")) {
    return `/sectors/${path.basename(normalized, ".html")}`;
  }

  return null;
}

async function walkHtmlFiles(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".html")) continue;
    files.push(fullPath);
  }

  return files;
}

async function collectFiles() {
  const collected = new Set();

  for (const rel of STATIC_FILES) {
    const fullPath = path.join(ROOT, rel);
    try {
      await fs.access(fullPath);
      collected.add(fullPath);
    } catch {
      // Skip missing optional file.
    }
  }

  for (const relDir of ROOT_INDEX_DIRS) {
    const fullPath = path.join(ROOT, relDir, "index.html");
    try {
      await fs.access(fullPath);
      collected.add(fullPath);
    } catch {
      // Skip missing optional directory page.
    }
  }

  for (const dir of HTML_SCAN_DIRS) {
    const fullDir = path.join(ROOT, dir);
    try {
      const htmlFiles = await walkHtmlFiles(fullDir);
      for (const file of htmlFiles) {
        collected.add(file);
      }
    } catch {
      // Skip missing optional directory.
    }
  }

  return Array.from(collected);
}

async function buildEntries() {
  const files = await collectFiles();
  const byLoc = new Map();

  for (const fullPath of files) {
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    if (EXCLUDE_FILES.has(path.basename(relPath))) continue;
    if (isLowQualityPath(relPath)) continue;

    const rawPath = fileToUrlPath(relPath);
    if (!rawPath) continue;

    const encodedPath = encodeUrlPath(rawPath);
    const loc = `${BASE_URL}${encodedPath}`;
    const stat = await fs.stat(fullPath);
    const lastmod = toIsoDate(stat.mtime);
    const changefreq =
      encodedPath === "/" ? "daily" : encodedPath.includes("/blog") ? "weekly" : "monthly";
    const priority = encodedPath === "/" ? "1.0" : encodedPath.includes("/blog") ? "0.7" : "0.8";

    byLoc.set(loc, {
      loc,
      lastmod,
      changefreq,
      priority,
    });
  }

  return Array.from(byLoc.values()).sort((a, b) => a.loc.localeCompare(b.loc, "en"));
}

function renderXml(entries) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  lines.push("");

  for (const entry of entries) {
    lines.push("  <url>");
    lines.push(`    <loc>${entry.loc}</loc>`);
    lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    lines.push(`    <priority>${entry.priority}</priority>`);
    lines.push("  </url>");
  }

  lines.push("");
  lines.push("</urlset>");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const entries = await buildEntries();
  const xml = renderXml(entries);
  await fs.writeFile(OUTPUT, xml, "utf8");
  process.stdout.write(`Generated sitemap.xml with ${entries.length} URLs\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
