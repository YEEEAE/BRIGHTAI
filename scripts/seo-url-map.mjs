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
  "locations",
  "machine-learning",
  "mais-OBM",
  "partners",
  "pricing",
  "services",
  "sectors",
  "smart-automation",
  "tools",
  "what-is-ai",
  "privacy-policy",
  "terms",
  "trust",
  "cookie-policy",
  "pdpl-statement",
  "data-processing-agreement",
]);

const REL_PATH_ALIASES = new Map([
  ["blog/Generative-artificial-intelligence.html", "blog/generative-artificial-intelligence/index.html"],
  ["blog/agint-bblog.html", "blog/building-ai-agents-practical-guide/index.html"],
  ["blog/ai-agent.html", "blog/ai-agents-business-guide/index.html"],
  ["blog/ai.html", "blog/ai-business-performance/index.html"],
  ["blog/analysy.html", "blog/data-analysis-best-practices/index.html"],
  ["blog/atou-job.html", "blog/industrial-automation-repetitive-tasks/index.html"],
  ["blog/auto.html", "blog/workplace-automation-guide/index.html"],
  ["blog/automation/hr-automation-saudi/index.html", "blog/hr-automation-saudi/index.html"],
  ["blog/cloude-opus-4.6.html", "blog/claude-opus-4-6-saudi-market/index.html"],
  ["blog/data-analytics/kpi-dashboard-guide/index.html", "blog/kpi-dashboard-guide/index.html"],
  ["blog/data-analytics/power-bi-saudi-guide/index.html", "blog/power-bi-saudi-guide/index.html"],
  ["blog/digital.html", "blog/ai-manufacturing-digital-guide/index.html"],
  ["blog/gov.html", "blog/government-ai-solutions-saudi/index.html"],
]);

const TENDERS_DEMO_COUNTERPARTS = new Map([
  ["demo/ai-tenders-analysis/compare.html", "en/tenders/compare.html"],
  ["demo/ai-tenders-analysis/dashboard.html", "en/tenders/dashboard.html"],
  ["demo/ai-tenders-analysis/landing.html", "en/tenders/landing.html"],
  ["demo/ai-tenders-analysis/reports.html", "en/tenders/reports.html"],
  ["demo/ai-tenders-analysis/settings.html", "en/tenders/settings.html"],
  ["demo/ai-tenders-analysis/templates.html", "en/tenders/templates.html"],
  ["en/tenders/compare.html", "demo/ai-tenders-analysis/compare.html"],
  ["en/tenders/dashboard.html", "demo/ai-tenders-analysis/dashboard.html"],
  ["en/tenders/landing.html", "demo/ai-tenders-analysis/landing.html"],
  ["en/tenders/reports.html", "demo/ai-tenders-analysis/reports.html"],
  ["en/tenders/settings.html", "demo/ai-tenders-analysis/settings.html"],
  ["en/tenders/templates.html", "demo/ai-tenders-analysis/templates.html"],
]);
const NON_INDEXABLE_REL_PATH_PATTERNS = [
  /^(404|500)\.html$/i,
  /^error\.html$/i,
  /^en\/docs\/docs\.html$/i,
  /^blog\/(ai-automation-project-analysis|digital-transformation-automation|financial-hr-automation|industrial-automation-productivity|machine-learning-computer-vision|process-automation-ai-efficiency)\.html$/i,
  /^aimais\/public\//i,
  /^frontend\/pages\//i,
  /^mais-OBM\/index\.html$/i,
  /^interview\/pages\/supportAI\/index\.html$/i,
  /^blog\/atou\.doc\.html$/i,
  /^blog\/generative-artificial-intelligence\.html$/i,
  /^demo\/mais-dashboard\//i,
  /^demo\/ai-reject-dashboard\/frontend\/pages\//i,
];

const TRAILING_SLASH_ROUTE_PATTERNS = [
  /^\/assessment(?:\/.*)?\/?$/i,
  /^\/$/,
  /^\/en(?:\/.*)?\/?$/i,
  /^\/docs(?:\/.*)?\/?$/i,
  /^\/blog(?:\/.*)?\/?$/i,
  /^\/services\/[^/]+\/?$/i,
  /^\/solutions\/[^/]+\/?$/i,
  /^\/locations\/[^/]+\/?$/i,
  /^\/sectors\/[^/]+\/?$/i,
  /^\/tools\/[^/]+\/?$/i,
  /^\/ai-reject-dashboard\/?$/i,
  /^\/tenders(?:\/.*)?\/?$/i,
  /^\/ai-bots\/[^/]+\/?$/i,
  /^\/(?:ai-workflows|ai-scolecs|smart-medical-archive|privacy-cookies|job\.MAISco|sitemap|terms|offline)\/?$/i,
  /^\/bot\/?$/i,
  /^\/(?:try|demo|interview)(?:\/.*)?\/?$/i,
  /^\/kernel(?:\/.*)?\/?$/i,
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

  if (normalized.endsWith("/index.html")) {
    const dir = normalized.replace(/\/index\.html$/, "");

    if (dir.startsWith("docs/")) return `/${dir}/`;
    if (ROOT_INDEX_DIRS.has(dir)) return `/${dir}/`;
    if (dir === "frontend/pages/ai-workflows") return "/ai-workflows/";
    if (dir === "frontend/pages/ai-scolecs") return "/ai-scolecs/";
    if (dir === "smart-medical-archive") return "/smart-medical-archive/";
    if (dir === "privacy-cookies") return "/privacy-cookies/";
    if (dir === "frontend/pages/job.MAISco") return "/job.MAISco/";
    if (dir === "frontend/pages/interview") return "/demo/smart-hiring-system/";
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

  if (normalized.startsWith("docs/") && normalized.endsWith(".html")) {
    return `/docs/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/blogger/") && normalized.endsWith(".html")) {
    return `/blog/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/botAI/") && normalized.endsWith(".html")) {
    return `/ai-bots/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/blog/workplace-automation-guide/mation/") && normalized.endsWith(".html")) {
    return `/blog/workplace-automation-guide/mation/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/blog/data-analytics/") && normalized.endsWith(".html")) {
    return `/blog/data-analytics/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("frontend/pages/sectors/") && normalized.endsWith(".html")) {
    return `/sectors/${path.basename(normalized, ".html")}/`;
  }

  if (normalized.startsWith("demo/ai-reject-dashboard/frontend/pages/") && normalized.endsWith(".html")) {
    const slug = path.basename(normalized, ".html");
    if (slug === "index-ar") return "/demo/ai-reject-dashboard/";
    return `/demo/ai-reject-dashboard/${slug}/`;
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

  const mappedCounterpart = TENDERS_DEMO_COUNTERPARTS.get(lower);
  if (mappedCounterpart) {
    return pickAllowedPath(mappedCounterpart, lowerPathMap, allowedRelPaths);
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
