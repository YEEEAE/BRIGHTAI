#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { existsSync } from "fs";
import { hasNoindexDirective, extractCanonicalHref } from "./sitemap-audit-utils.mjs";

const BASE_URL = "https://brightai.site";
const SITEMAP_PATH = path.join(process.cwd(), "sitemap-priority.xml");
const ROBOTS_PATH = path.join(process.cwd(), "robots.txt");
const REDIRECTS_PATH = path.join(process.cwd(), "_redirects");
const ROOT = process.cwd();

async function parseSitemapXml(filePath) {
  const xml = await fs.readFile(filePath, "utf-8");
  const locs = [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)].map((m) => m[1].trim());
  return locs;
}

async function readRedirectSources() {
  const redirectSources = new Set();
  try {
    const content = await fs.readFile(REDIRECTS_PATH, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3 && parts[parts.length - 1] === "301") {
        redirectSources.add(parts[0]);
      }
    }
  } catch {}
  return redirectSources;
}

function getLocalPathFromLoc(loc, baseUrl) {
  const url = new URL(loc);
  const expected = new URL(baseUrl);
  if (url.origin !== expected.origin) return null;
  let p = url.pathname;
  if (p.endsWith("/")) p += "index.html";
  else if (!path.extname(p)) p += "/index.html";
  return p.startsWith("/") ? p.slice(1) : p;
}

async function checkLocalFile(localPath) {
  const fullPath = path.join(ROOT, localPath);
  const altPath = path.join(ROOT, "frontend/pages", localPath);
  if (existsSync(fullPath)) return fullPath;
  if (existsSync(altPath)) return altPath;

  // دعم كنسي للملفات الفردية المنتهية بـ .html كبديل لـ index.html
  if (localPath.endsWith("/index.html")) {
    const fallbackPath = localPath.replace(/\/index\.html$/, ".html");
    const fullFallback = path.join(ROOT, fallbackPath);
    const altFallback = path.join(ROOT, "frontend/pages", fallbackPath);
    if (existsSync(fullFallback)) return fullFallback;
    if (existsSync(altFallback)) return altFallback;
  }

  return null;
}


async function run() {
  let exitCode = 0;
  const issues = [];

  // Parse sitemap
  let urls;
  try {
    urls = await parseSitemapXml(SITEMAP_PATH);
  } catch {
    console.error("Failed to parse sitemap-priority.xml");
    process.exit(1);
  }

  if (urls.length < 25 || urls.length > 40) {
    issues.push(`URL count ${urls.length} is outside 25-40 range`);
  }

  // Check robots.txt reference
  try {
    const robots = await fs.readFile(ROBOTS_PATH, "utf-8");
    if (!robots.includes("sitemap-priority.xml")) {
      issues.push("robots.txt missing reference to sitemap-priority.xml");
    }
  } catch {
    issues.push("robots.txt not found");
  }

  const redirectSources = await readRedirectSources();

  for (const loc of urls) {
    const localPath = getLocalPathFromLoc(loc, BASE_URL);
    if (!localPath) {
      issues.push(`Invalid origin URL: ${loc}`);
      continue;
    }

    // Check local file exists
    const filePath = await checkLocalFile(localPath);
    if (!filePath) {
      issues.push(`File not found for: ${loc} (tried ${localPath})`);
      continue;
    }

    const html = await fs.readFile(filePath, "utf-8");

    // Check noindex
    if (hasNoindexDirective(html)) {
      issues.push(`NOINDEX: ${loc}`);
    }

    // Check canonical mismatch
    const canonical = extractCanonicalHref(html);
    if (canonical && new URL(canonical).pathname !== new URL(loc).pathname) {
      issues.push(`CANONICAL MISMATCH: ${loc} -> ${canonical}`);
    }

    // Check redirect source
    const urlPath = new URL(loc).pathname;
    if (redirectSources.has(urlPath)) {
      issues.push(`REDIRECT SOURCE: ${loc}`);
    }
  }

  // Print results
  if (issues.length === 0) {
    console.log(`sitemap-priority.xml: PASSED (${urls.length} URLs, all valid)`);
  } else {
    console.log(`sitemap-priority.xml: FAILED (${issues.length} issues)\n`);
    for (const issue of issues) {
      console.log(`  ${issue}`);
    }
    exitCode = 1;
  }

  process.exit(exitCode);
}

run();
