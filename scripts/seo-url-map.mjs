import path from "node:path";

const BASE_URL = "https://brightai.site";
const DEFAULT_COUNTERPART_OPTIONS = Object.freeze({});

const ROOT_INDEX_DIRS = new Set([
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
  "sectors",
  "smart-automation",
  "tools",
  "what-is-ai",
]);

const REL_PATH_ALIASES = new Map();
const NON_INDEXABLE_REL_PATH_PATTERNS = [
  /^(404|500)\.html$/i,
  /^error\.html$/i,
  /^privacy-cookies\/index\.html$/i,
  /^terms\/index\.html$/i,
  /^sitemap\/index\.html$/i,
  /^mais-OBM\/index\.html$/i,
  /^en\/docs\/docs\.html$/i,
  /^blog\/(ai-automation-project-analysis|digital-transformation-automation|financial-hr-automation|industrial-automation-productivity|machine-learning-computer-vision|process-automation-ai-efficiency)\.html$/i,
  /^aimais\/public\//i,
  /^frontend\/pages\//i,
  /^interview\/pages\//i,
  /^blog\/atou\.doc\.html$/i,
  /^blog\/generative-artificial-intelligence\.html$/i,
  /^docs\/(privacy-policy|privacy-policy-en|terms-and-conditions|terms-and-conditions-en)(?:\.html|\/index\.html)$/i,
];

const TRAILING_SLASH_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/en(?:\/.*)?\/?$/i,
  /^\/docs(?:\/.*)?\/?$/i,
  /^\/blog(?:\/.*)?\/?$/i,
  /^\/sectors\/[^/]+\/?$/i,
  /^\/tenders(?:\/.*)?\/?$/i,
  /^\/ai-bots\/[^/]+\/?$/i,
  /^\/(?:ai-workflows|ai-scolecs|smart-medical-archive|privacy-cookies|job\.MAISco|sitemap|terms|offline)\/?$/i,
  /^\/(?:try|demo|interview)(?:\/.*)?\/?$/i,
];

export function normalizeRelPath(filePath) {
  return filePath.replace(/\\/g, "/").normalize("NFC");
}

export function isPublicIndexableRelPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  return !NON_INDEXABLE_REL_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function encodeUrlPath(urlPath) {
  if (urlPath === "/") return "/";
  const trailingSlash = urlPath.endsWith("/");
  const encoded = urlPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/${encoded}${trailingSlash ? "/" : ""}`;
}

function stripTrailingSlash(sitePath) {
  if (sitePath === "/") return sitePath;
  return sitePath.replace(/\/+$/, "");
}

function shouldKeepTrailingSlash(sitePath) {
  if (!sitePath || sitePath === "/") return true;
  if (TRAILING_SLASH_ROUTE_PATTERNS.some((pattern) => pattern.test(sitePath))) {
    return true;
  }
  const trimmed = stripTrailingSlash(sitePath);
  const segment = trimmed.slice(1);
  return ROOT_INDEX_DIRS.has(segment);
}

export function canonicalizeSitePath(rawPath) {
  if (!rawPath || rawPath === "/") {
    return "/";
  }

  const collapsed = String(rawPath).replace(/\/{2,}/g, "/");
  const normalized = path.posix.normalize(collapsed);
  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  if (withLeadingSlash === "/" || withLeadingSlash === "/.") {
    return "/";
  }

  if (shouldKeepTrailingSlash(withLeadingSlash)) {
    return `${stripTrailingSlash(withLeadingSlash) || "/"}/`.replace(/\/{2,}$/g, "/");
  }

  return stripTrailingSlash(withLeadingSlash) || "/";
}

export function relPathToSitePath(relPath) {
  const normalized = normalizeRelPath(relPath);
  const aliasedPath = REL_PATH_ALIASES.get(normalized);

  if (aliasedPath) {
    return relPathToSitePath(aliasedPath);
  }

  if (normalized === "frontend/pages/blogger/Generative-artificial-intelligence.html") {
    return "/blog/generative-artificial-intelligence";
  }

  if (normalized === "index.html") return "/";
  if (normalized === "docs/index.html") return "/docs/";
  if (normalized === "docs.html") return "/docs/";

  if (normalized.startsWith("docs/") && normalized.endsWith(".html")) {
    return `/docs/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.endsWith("/index.html")) {
    const dir = normalized.replace(/\/index\.html$/, "");

    if (ROOT_INDEX_DIRS.has(dir)) return `/${dir}/`;
    if (dir === "frontend/pages/ai-workflows") return "/ai-workflows/";
    if (dir === "frontend/pages/ai-scolecs") return "/ai-scolecs/";
    if (dir === "smart-medical-archive") return "/smart-medical-archive/";
    if (dir === "privacy-cookies") return "/privacy-cookies/";
    if (dir === "frontend/pages/job.MAISco") return "/job.MAISco/";
    if (dir === "frontend/pages/interview") return "/interview/";
    if (dir === "frontend/pages/terms") return "/terms/";
    if (dir === "frontend/pages/sitemap") return "/sitemap/";
    if (dir === "frontend/pages/offline") return "/offline/";
    if (dir === "tenders") return "/tenders/";

    if (
      dir.startsWith("frontend/pages/ai-bots/") ||
      dir.startsWith("frontend/pages/try/") ||
      dir.startsWith("frontend/pages/demo/")
    ) {
      return `/${dir.replace(/^frontend\/pages\//, "")}/`;
    }

    if (dir.startsWith("frontend/pages/")) {
      return `/${dir.replace(/^frontend\/pages\//, "")}/`;
    }

    return `/${dir}/`;
  }

  if (normalized.startsWith("frontend/pages/blogger/") && normalized.endsWith(".html")) {
    return `/blog/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/botAI/") && normalized.endsWith(".html")) {
    return `/ai-bots/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/blog/automation/") && normalized.endsWith(".html")) {
    return `/blog/automation/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/blog/data-analytics/") && normalized.endsWith(".html")) {
    return `/blog/data-analytics/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/sectors/") && normalized.endsWith(".html")) {
    return `/sectors/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("blog/") && normalized.endsWith(".html")) {
    return `/blog/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("sectors/") && normalized.endsWith(".html")) {
    return `/sectors/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("tenders/") && normalized.endsWith(".html")) {
    return `/tenders/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/") && normalized.endsWith(".html")) {
    return `/${normalized.replace(/^frontend\/pages\//, "").replace(/\.html$/, "")}/`;
  }

  if (normalized.endsWith(".html")) {
    return `/${normalized.replace(/\.html$/, "")}`;
  }

  return null;
}

export function relPathToCanonical(relPath, baseUrl = BASE_URL) {
  if (!isPublicIndexableRelPath(relPath)) return null;
  const sitePath = relPathToSitePath(relPath);
  if (!sitePath) return null;
  const normalizedPath = canonicalizeSitePath(sitePath);
  return `${baseUrl}${encodeUrlPath(normalizedPath || "/")}`;
}

export function normalizeSiteUrl(rawUrl, baseUrl = BASE_URL) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const value = rawUrl.trim();
  if (!value) return null;

  let parsed;
  try {
    parsed = new URL(value, `${baseUrl}/`);
  } catch {
    return null;
  }

  const expectedOrigin = new URL(baseUrl).origin.toLowerCase();
  if (parsed.origin.toLowerCase() !== expectedOrigin) return null;

  const pathValue = canonicalizeSitePath(parsed.pathname || "/");
  const decodedPath = pathValue
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
  return `${baseUrl}${encodeUrlPath(decodedPath)}`;
}

function pickAllowedPath(candidateKey, lowerPathMap, allowedRelPaths) {
  const candidate = lowerPathMap.get(candidateKey);
  if (!candidate) return null;
  if (allowedRelPaths && !allowedRelPaths.has(candidate)) {
    return null;
  }
  if (!isPublicIndexableRelPath(candidate)) {
    return null;
  }
  return candidate;
}

export function buildPublicUrlRegistry(relPaths, baseUrl = BASE_URL) {
  const publicRelPaths = new Set();
  const canonicalByRelPath = new Map();
  const relPathByCanonical = new Map();

  for (const relPath of relPaths) {
    const normalized = normalizeRelPath(relPath);
    if (!isPublicIndexableRelPath(normalized)) continue;
    const canonical = relPathToCanonical(normalized, baseUrl);
    if (!canonical) continue;
    publicRelPaths.add(normalized);
    canonicalByRelPath.set(normalized, canonical);
    if (!relPathByCanonical.has(canonical)) {
      relPathByCanonical.set(canonical, normalized);
    }
  }

  return {
    publicRelPaths,
    canonicalByRelPath,
    relPathByCanonical,
  };
}

export function findCounterpartRelPath(relPath, lowerPathMap, options = DEFAULT_COUNTERPART_OPTIONS) {
  const normalized = normalizeRelPath(relPath);
  const lower = normalized.toLowerCase();
  const allowedRelPaths = options.allowedRelPaths || null;

  if (lower === "docs.html") {
    return (
      pickAllowedPath("en/docs/index.html", lowerPathMap, allowedRelPaths) ||
      pickAllowedPath("en/docs/docs.html", lowerPathMap, allowedRelPaths)
    );
  }

  if (lower === "docs/index.html") {
    return (
      pickAllowedPath("en/docs/index.html", lowerPathMap, allowedRelPaths) ||
      pickAllowedPath("en/docs/docs.html", lowerPathMap, allowedRelPaths)
    );
  }

  if (lower === "en/docs/index.html") {
    return (
      pickAllowedPath("docs.html", lowerPathMap, allowedRelPaths) ||
      pickAllowedPath("docs/index.html", lowerPathMap, allowedRelPaths)
    );
  }

  if (lower === "index.html") {
    return pickAllowedPath("en/index.html", lowerPathMap, allowedRelPaths);
  }

  if (lower === "en/index.html") {
    return pickAllowedPath("index.html", lowerPathMap, allowedRelPaths);
  }

  if (lower.startsWith("en/")) {
    const candidate = normalized.slice(3).toLowerCase();
    return pickAllowedPath(candidate, lowerPathMap, allowedRelPaths);
  }

  if (/-en\/index\.html$/i.test(lower)) {
    const candidate = normalized.replace(/-en\/index\.html$/i, ".html").toLowerCase();
    return pickAllowedPath(candidate, lowerPathMap, allowedRelPaths);
  }

  const englishMirrorCandidate = `en/${normalized}`.toLowerCase();
  if (lowerPathMap.has(englishMirrorCandidate)) {
    return pickAllowedPath(englishMirrorCandidate, lowerPathMap, allowedRelPaths);
  }

  if (/-en\.html$/i.test(lower)) {
    const candidate = normalized.replace(/-en\.html$/i, ".html").toLowerCase();
    return pickAllowedPath(candidate, lowerPathMap, allowedRelPaths);
  }

  if (/\.html$/i.test(lower)) {
    const candidate = normalized.replace(/\.html$/i, "-en.html").toLowerCase();
    return pickAllowedPath(candidate, lowerPathMap, allowedRelPaths);
  }

  return null;
}
