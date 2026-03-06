import path from "node:path";

const BASE_URL = "https://brightai.site";

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
  "smart-automation",
  "tools",
  "what-is-ai",
]);

export function normalizeRelPath(filePath) {
  return filePath.replace(/\\/g, "/");
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

export function relPathToSitePath(relPath) {
  const normalized = normalizeRelPath(relPath);

  if (normalized === "frontend/pages/blogger/Generative-artificial-intelligence.html") {
    return "/blog/generative-artificial-intelligence";
  }

  if (normalized === "index.html") return "/";
  if (normalized === "docs.html") return "/docs";

  if (normalized.startsWith("docs/") && normalized.endsWith(".html")) {
    return `/docs/${path.basename(normalized, ".html")}`;
  }

  if (normalized.endsWith("/index.html")) {
    const dir = normalized.replace(/\/index\.html$/, "");

    if (ROOT_INDEX_DIRS.has(dir)) return `/${dir}`;
    if (dir === "frontend/pages/ai-workflows") return "/ai-workflows";
    if (dir === "frontend/pages/ai-scolecs") return "/ai-scolecs";
    if (dir === "frontend/pages/smart-medical-archive") return "/smart-medical-archive";
    if (dir === "frontend/pages/privacy-cookies") return "/privacy-cookies";
    if (dir === "frontend/pages/job.MAISco") return "/job.MAISco";
    if (dir === "frontend/pages/interview") return "/interview";
    if (dir === "frontend/pages/terms") return "/terms";
    if (dir === "frontend/pages/sitemap") return "/sitemap";
    if (dir === "frontend/pages/offline") return "/offline";

    if (
      dir.startsWith("frontend/pages/ai-bots/") ||
      dir.startsWith("frontend/pages/try/") ||
      dir.startsWith("frontend/pages/demo/")
    ) {
      return `/${dir.replace(/^frontend\/pages\//, "")}`;
    }

    if (dir.startsWith("frontend/pages/")) {
      return `/${dir.replace(/^frontend\/pages\//, "")}`;
    }

    return `/${dir}`;
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

  if (normalized.startsWith("frontend/pages/sectors/") && normalized.endsWith(".html")) {
    return `/sectors/${path.basename(normalized, ".html")}`;
  }

  if (normalized.startsWith("frontend/pages/") && normalized.endsWith(".html")) {
    return `/${normalized.replace(/^frontend\/pages\//, "").replace(/\.html$/, "")}`;
  }

  if (normalized.endsWith(".html")) {
    return `/${normalized.replace(/\.html$/, "")}`;
  }

  return null;
}

export function relPathToCanonical(relPath, baseUrl = BASE_URL) {
  const sitePath = relPathToSitePath(relPath);
  if (!sitePath) return null;
  const normalizedPath = stripTrailingSlash(sitePath);
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

  const pathValue = stripTrailingSlash(parsed.pathname || "/") || "/";
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

export function findCounterpartRelPath(relPath, lowerPathMap) {
  const normalized = normalizeRelPath(relPath);
  const lower = normalized.toLowerCase();

  if (/-en\.html$/i.test(lower)) {
    const candidate = normalized.replace(/-en\.html$/i, ".html").toLowerCase();
    return lowerPathMap.get(candidate) || null;
  }

  if (/\.html$/i.test(lower)) {
    const candidate = normalized.replace(/\.html$/i, "-en.html").toLowerCase();
    return lowerPathMap.get(candidate) || null;
  }

  return null;
}
