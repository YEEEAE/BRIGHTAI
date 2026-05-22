import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const SITE = "https://brightai.site";
const IMPORTANT_URLS = [
  "/",
  "/services/",
  "/ai-agent/",
  "/smart-automation/",
  "/data-analysis/",
  "/ai-bots/",
  "/ai-workflows/",
  "/demo/smart-medical-archive/",
  "/tools/",
  "/demo/ai-tenders-analysis/",
  "/demo/ai-tenders-analysis/landing/",
  "/demo/ai-tenders-analysis/compare/",
  "/consultation/",
  "/contact/",
];
const COMMERCIAL_PREFIXES = ["/", "/services/", "/ai-agent/", "/smart-automation/", "/data-analysis/", "/ai-bots/", "/ai-workflows/", "/smart-medical-archive/", "/tools/", "/tenders/", "/consultation/", "/contact/"];
const IGNORE_DIRS = new Set([".git", "node_modules", "venv", "tmp", "reports", "render-public"]);
const issues = [];
const routeToFile = new Map();
const inbound = new Map(IMPORTANT_URLS.map((url) => [url, 0]));
const NON_INDEXABLE_HTML = /^(404|500)\.html$|^error\.html$|^interview\/pages\//i;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function addIssue(file, code, message) {
  issues.push({ file, code, message });
}

function publicPathFromRel(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return "/" + relPath.replace(/\/index\.html$/, "/");
  if (relPath.endsWith(".html")) return "/" + relPath.replace(/\.html$/, "/");
  return null;
}

function cleanCanonical(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      parsed.hostname === "brightai.site" &&
      !parsed.pathname.includes("/frontend/pages/") &&
      !parsed.pathname.endsWith(".html") &&
      (parsed.pathname === "/" || parsed.pathname.endsWith("/"));
  } catch {
    return false;
  }
}

function normalizeHref(href) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null;
  let parsed;
  try {
    parsed = new URL(href, SITE);
  } catch {
    return null;
  }
  if (parsed.hostname !== "brightai.site") return null;
  let pathname = decodeURI(parsed.pathname);
  if (pathname.endsWith(".html")) pathname = pathname.replace(/\.html$/, "/");
  if (pathname !== "/" && !pathname.endsWith("/")) pathname += "/";
  return pathname;
}

const htmlFiles = walk(ROOT).filter((file) => {
  const relPath = rel(file);
  return !relPath.startsWith("frontend/pages/") && !relPath.startsWith("mais-OBM/");
});

for (const file of htmlFiles) {
  const relPath = rel(file);
  const route = publicPathFromRel(relPath);
  if (route) routeToFile.set(route, relPath);
}

for (const file of htmlFiles) {
  const relPath = rel(file);
  const html = fs.readFileSync(file, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const title = $("title").first().text().trim();
  const description = $("meta[name='description']").attr("content") || "";
  const canonical = $("link[rel='canonical']").attr("href") || "";
  const h1Count = $("h1").length;
  const robots = ($("meta[name='robots']").attr("content") || "").toLowerCase();
  const publicPath = publicPathFromRel(relPath);
  const isNonIndexableHtml = NON_INDEXABLE_HTML.test(relPath) || robots.includes("noindex");

  if (!title) addIssue(relPath, "MISSING_TITLE", "لا يوجد title.");
  if (!description.trim()) addIssue(relPath, "MISSING_META_DESCRIPTION", "لا يوجد meta description.");
  if (h1Count !== 1) addIssue(relPath, "BAD_H1_COUNT", `عدد H1 هو ${h1Count}.`);
  if (!canonical && !isNonIndexableHtml) addIssue(relPath, "MISSING_CANONICAL", "لا يوجد canonical.");
  else if (canonical && !cleanCanonical(canonical)) addIssue(relPath, "DIRTY_CANONICAL", canonical);
  if (IMPORTANT_URLS.includes(publicPath) && robots.includes("noindex")) addIssue(relPath, "IMPORTANT_NOINDEX", "صفحة مهمة عليها noindex.");

  $("script[type='application/ld+json']").each((_, el) => {
    const json = $(el).contents().text();
    try {
      const parsed = JSON.parse(json);
      const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
      for (const node of graph) {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        for (const type of types.filter(Boolean)) {
          if (["HowTo", "SpecialAnnouncement"].includes(type)) addIssue(relPath, "UNSUPPORTED_SCHEMA", type);
          if (type === "FAQPage" && COMMERCIAL_PREFIXES.some((prefix) => publicPath === prefix || publicPath?.startsWith(prefix + "/"))) {
            addIssue(relPath, "FAQ_ON_COMMERCIAL_PAGE", "FAQPage على صفحة تجارية.");
          }
        }
      }
    } catch (error) {
      addIssue(relPath, "INVALID_JSON_LD", error.message);
    }
  });

  $("a[href]").each((_, el) => {
    const normalized = normalizeHref($(el).attr("href"));
    if (!normalized) return;
    if (inbound.has(normalized) && normalized !== publicPath) inbound.set(normalized, inbound.get(normalized) + 1);
    if (/\.[a-z0-9]+\/?$/i.test(normalized) && !normalized.endsWith(".html/")) return;
    if (!routeToFile.has(normalized) && !normalized.startsWith("/api/") && !normalized.startsWith("/ws/")) {
      addIssue(relPath, "BROKEN_INTERNAL_LINK", normalized);
    }
  });
}

const sitemapPath = path.join(ROOT, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) addIssue("sitemap.xml", "MISSING_SITEMAP", "sitemap.xml غير موجود.");
else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  for (const url of IMPORTANT_URLS) {
    if (!sitemap.includes(`${SITE}${url}`)) addIssue("sitemap.xml", "IMPORTANT_URL_MISSING", `${SITE}${url}`);
  }
  if (/\/frontend\/pages\//.test(sitemap)) addIssue("sitemap.xml", "FRONTEND_PAGES_IN_SITEMAP", "يوجد /frontend/pages/ في sitemap.");
  if (/<loc>[^<]+\.html<\/loc>/.test(sitemap)) addIssue("sitemap.xml", "HTML_URL_IN_SITEMAP", "يوجد .html في sitemap loc.");
}

const robotsPath = path.join(ROOT, "robots.txt");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  const starBlock = [];
  let inStarBlock = false;
  for (const line of robots.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^User-agent:/i.test(trimmed)) {
      inStarBlock = /^User-agent:\s*\*/i.test(trimmed);
      continue;
    }
    if (inStarBlock) starBlock.push(trimmed);
  }
  for (const url of IMPORTANT_URLS) {
    const blocked = starBlock.some((line) => line.toLowerCase() === `disallow: ${url}`.toLowerCase());
    if (blocked) addIssue("robots.txt", "IMPORTANT_BLOCKED", url);
  }
}

for (const [url, count] of inbound) {
  if (count < 3) addIssue("internal-links", "LOW_INTERNAL_LINKS", `${url} has ${count} internal links.`);
}

if (issues.length) {
  console.log(`SEO indexability QA failed: ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(`${issue.file} | ${issue.code} | ${issue.message}`);
  }
  process.exit(1);
}

console.log("SEO indexability QA passed.");
