#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://brightai.site";
const MAX_BASENAME_LENGTH = 80;
const MAX_RELATIVE_PATH_LENGTH = 180;

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".netlify",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "reports",
  "tmp"
]);

const UNSAFE_PATH_CHARS = /[\x00-\x1F\x7F<>:"\\|?*#]/;
const ENCODED_UNICODE_PATTERN = /#U[0-9A-Fa-f]{4,6}/;
const HTML_FILE_PATTERN = /\.html?$/i;
const PAGE_LINK_PATTERN = /(?:^|\/)$|\.html?$/i;
const SKIP_LINK_PREFIXES = [
  "mailto:",
  "tel:",
  "sms:",
  "javascript:",
  "data:",
  "blob:",
  "geo:",
  "ftp:",
  "ws:",
  "wss:",
  "whatsapp:",
  "about:"
];

const errors = [];
const warnings = [];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function report(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function walkFiles(dir, bucket = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, bucket);
    } else if (entry.isFile()) {
      bucket.push(absolutePath);
    }
  }
  return bucket;
}

function readTextFile(relPath) {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), "utf8");
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeSitePath(sitePath) {
  let normalized = safeDecodeURIComponent(sitePath || "/");
  normalized = normalized.split("#")[0].split("?")[0];
  normalized = normalized.replace(/\\/g, "/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = path.posix.normalize(normalized);
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  return normalized;
}

function stripLeadingSlash(sitePath) {
  return normalizeSitePath(sitePath).replace(/^\/+/, "");
}

function buildPageCandidates(sitePath) {
  const normalized = normalizeSitePath(sitePath);
  const withoutSlash = stripLeadingSlash(normalized);
  const candidates = new Set();

  if (normalized === "/") {
    candidates.add("index.html");
    return candidates;
  }

  if (withoutSlash) {
    candidates.add(withoutSlash);
  }

  if (normalized.endsWith("/")) {
    const base = withoutSlash.replace(/\/+$/, "");
    candidates.add(`${base}/index.html`);
    candidates.add(`${base}.html`);
  } else if (!path.posix.extname(withoutSlash)) {
    candidates.add(`${withoutSlash}/index.html`);
    candidates.add(`${withoutSlash}.html`);
  }

  return candidates;
}

function localPageExists(sitePath, fileSet) {
  for (const candidate of buildPageCandidates(sitePath)) {
    if (fileSet.has(candidate)) {
      return true;
    }
  }
  return false;
}

function localPageExistsOrRedirects(sitePath, fileSet, redirectMap) {
  if (localPageExists(sitePath, fileSet)) {
    return true;
  }

  const redirectTarget = redirectMap.get(normalizeRouteEndpoint(sitePath));
  return Boolean(redirectTarget && localPageExists(redirectTarget, fileSet));
}

function htmlFileToSitePath(relPath) {
  if (relPath === "index.html") {
    return "/";
  }
  if (relPath.endsWith("/index.html")) {
    return `/${relPath.slice(0, -"index.html".length)}`;
  }
  return `/${relPath}`;
}

function resolveLocalUrl(rawValue, sourceRelPath) {
  const raw = rawValue.trim();
  if (!raw || raw.startsWith("#")) {
    return null;
  }

  const lowerRaw = raw.toLowerCase();
  if (SKIP_LINK_PREFIXES.some((prefix) => lowerRaw.startsWith(prefix))) {
    return null;
  }

  if (raw.startsWith("//")) {
    return null;
  }

  const sourceUrl = new URL(htmlFileToSitePath(sourceRelPath), SITE_ORIGIN);
  const url = new URL(raw, sourceUrl);
  if (url.origin !== SITE_ORIGIN) {
    return null;
  }
  return normalizeSitePath(url.pathname);
}

function extractCanonical(content) {
  const linkPattern = /<link\b[^>]*>/gi;
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const tag = match[0];
    if (!/\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["']/i.test(tag)) {
      continue;
    }
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    return hrefMatch ? hrefMatch[1].trim() : "";
  }
  return "";
}

function extractAnchorLinks(content) {
  const links = [];
  const anchorPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = anchorPattern.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function validatePaths(files) {
  for (const absolutePath of files) {
    const relPath = toPosix(path.relative(ROOT_DIR, absolutePath));
    const basename = path.posix.basename(relPath);

    if (basename.length > MAX_BASENAME_LENGTH) {
      warn(`اسم الملف أطول من ${MAX_BASENAME_LENGTH} حرفاً: ${relPath} (${basename.length})`);
    }

    if (relPath.length > MAX_RELATIVE_PATH_LENGTH) {
      warn(`المسار النسبي أطول من ${MAX_RELATIVE_PATH_LENGTH} حرفاً: ${relPath} (${relPath.length})`);
    }

    if (ENCODED_UNICODE_PATTERN.test(relPath)) {
      report(`المسار يحتوي نمط Unicode مشفّر غير مسموح مثل #U0627: ${relPath}`);
    }

    if (UNSAFE_PATH_CHARS.test(relPath)) {
      report(`المسار يحتوي محارف غير آمنة: ${relPath}`);
    }
  }
}

function validateBlogCanonicals(htmlFiles, fileSet, redirectMap) {
  for (const relPath of htmlFiles) {
    if (!relPath.startsWith("blog/")) {
      continue;
    }

    const content = readTextFile(relPath);
    const canonical = extractCanonical(content);
    if (!canonical) {
      report(`ملف مدونة بلا canonical URL: ${relPath}`);
      continue;
    }

    const localPath = resolveLocalUrl(canonical, relPath);
    if (!localPath) {
      report(`canonical في ملف المدونة ليس رابطاً محلياً صالحاً: ${relPath} -> ${canonical}`);
      continue;
    }

    if (!localPageExistsOrRedirects(localPath, fileSet, redirectMap)) {
      report(`canonical يشير إلى صفحة محلية غير موجودة: ${relPath} -> ${canonical}`);
    }
  }
}

function validateInternalHtmlLinks(htmlFiles, fileSet, redirectMap) {
  for (const relPath of htmlFiles) {
    const content = readTextFile(relPath);
    for (const href of extractAnchorLinks(content)) {
      const localPath = resolveLocalUrl(href, relPath);
      if (!localPath || !PAGE_LINK_PATTERN.test(localPath)) {
        continue;
      }

      if (!localPageExistsOrRedirects(localPath, fileSet, redirectMap)) {
        report(`رابط HTML داخلي يشير إلى صفحة محلية غير موجودة: ${relPath} -> ${href}`);
      }
    }
  }
}

function validateSitemap(fileSet, redirectMap) {
  const sitemapRelPath = "sitemap.xml";
  if (!fileSet.has(sitemapRelPath)) {
    report("ملف sitemap.xml غير موجود.");
    return;
  }

  const content = readTextFile(sitemapRelPath);
  const locPattern = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = locPattern.exec(content)) !== null) {
    const rawUrl = match[1].trim();
    const localPath = resolveLocalUrl(rawUrl, "index.html");
    if (!localPath) {
      report(`sitemap.xml يحتوي URL خارج الدومين المحلي أو غير صالح: ${rawUrl}`);
      continue;
    }

    if (!localPageExistsOrRedirects(localPath, fileSet, redirectMap)) {
      report(`sitemap.xml يحتوي URL لا يقابله ملف محلي: ${rawUrl}`);
    }
  }
}

function parseRenderRoutes() {
  const renderRelPath = "render.yaml";
  if (!fs.existsSync(path.join(ROOT_DIR, renderRelPath))) {
    return [];
  }

  const routes = [];
  const lines = readTextFile(renderRelPath).split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const typeMatch = line.match(/^\s*-\s*type:\s*(redirect|rewrite)\s*$/);
    if (typeMatch) {
      if (current) {
        routes.push(current);
      }
      current = { type: typeMatch[1] };
      continue;
    }

    if (!current) {
      continue;
    }

    const propertyMatch = line.match(/^\s*(source|destination|status):\s*(.+?)\s*$/);
    if (propertyMatch) {
      current[propertyMatch[1]] = propertyMatch[2].replace(/^["']|["']$/g, "");
    }
  }

  if (current) {
    routes.push(current);
  }

  return routes.filter((route) => route.source && route.destination);
}

function normalizeRouteEndpoint(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "/");
}

function validateRenderRoutes() {
  const routes = parseRenderRoutes();
  const byTypeAndSource = new Map();
  const routeMaps = {
    redirect: new Map(),
    rewrite: new Map()
  };

  for (const route of routes) {
    const source = normalizeRouteEndpoint(route.source);
    const destination = normalizeRouteEndpoint(route.destination);
    const duplicateKey = `${route.type}:${source}`;

    if (byTypeAndSource.has(duplicateKey)) {
      const first = byTypeAndSource.get(duplicateKey);
      if (normalizeRouteEndpoint(first.destination) !== destination) {
        report(`render.yaml يحتوي ${route.type} مكرراً لنفس المصدر بوجهتين مختلفتين: ${route.source} -> ${first.destination} و ${route.destination}`);
      } else {
        warn(`render.yaml يحتوي ${route.type} مكرراً لنفس المصدر ونفس الوجهة: ${route.source} -> ${route.destination}`);
      }
    } else {
      byTypeAndSource.set(duplicateKey, route);
    }

    if (source === destination) {
      report(`render.yaml يحتوي ${route.type} يوجه إلى نفسه: ${route.source} -> ${route.destination}`);
    }

    routeMaps[route.type].set(source, destination);
  }

  for (const [type, routeMap] of Object.entries(routeMaps)) {
    for (const [source, destination] of routeMap.entries()) {
      const reverseDestination = routeMap.get(destination);
      if (reverseDestination === source) {
        report(`render.yaml يحتوي احتمال حلقة ${type}: ${source} -> ${destination} -> ${source}`);
      }
    }
  }
}

function main() {
  const files = walkFiles(ROOT_DIR);
  const relativeFiles = files.map((file) => toPosix(path.relative(ROOT_DIR, file)));
  const fileSet = new Set(relativeFiles);
  const htmlFiles = relativeFiles.filter((file) => HTML_FILE_PATTERN.test(file));
  const redirectMap = new Map(
    parseRenderRoutes()
      .filter((route) => route.type === "redirect")
      .map((route) => [normalizeRouteEndpoint(route.source), normalizeRouteEndpoint(route.destination)])
  );

  validatePaths(files);
  validateBlogCanonicals(htmlFiles, fileSet, redirectMap);
  validateSitemap(fileSet, redirectMap);
  validateRenderRoutes();
  validateInternalHtmlLinks(htmlFiles, fileSet, redirectMap);

  if (errors.length > 0) {
    console.error("فشل فحص الإنتاج:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error(`\nإجمالي الأخطاء: ${errors.length}`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("تحذيرات فحص الإنتاج:");
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
    console.warn(`\nإجمالي التحذيرات: ${warnings.length}`);
  }

  console.log("نجح فحص الإنتاج: لا توجد أخطاء مانعة للنشر.");
}

main();
