import path from "node:path";

const DEFAULT_BASE_URL = "https://brightai.site";

export function extractCanonicalHref(html) {
  if (!html || typeof html !== "string") return "";
  const match = html.match(
    /<link\b[^>]*rel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i
  );
  return match ? match[1].trim() : "";
}

export function hasMetaRefresh(html) {
  if (!html || typeof html !== "string") return false;
  return /<meta\b[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/i.test(html);
}

export function hasNoindexDirective(html) {
  if (!html || typeof html !== "string") return false;

  const robotsMetaRegex = /<meta\b[^>]*(?:name|property)\s*=\s*["']([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = robotsMetaRegex.exec(html))) {
    const name = match[1].trim().toLowerCase();
    const content = match[2].trim().toLowerCase();
    if ((name === "robots" || name === "googlebot") && content.includes("noindex")) {
      return true;
    }
  }

  return false;
}

export function decodePathFromLoc(loc, baseUrl = DEFAULT_BASE_URL) {
  if (!loc || typeof loc !== "string") return null;

  let parsed;
  try {
    parsed = new URL(loc);
  } catch {
    return null;
  }

  const expectedOrigin = new URL(baseUrl).origin.toLowerCase();
  if (parsed.origin.toLowerCase() !== expectedOrigin) {
    return null;
  }

  const pathname = parsed.pathname || "/";
  const decoded = pathname
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

  return decoded || "/";
}

export function buildLocalFileCandidates(decodedPath) {
  if (!decodedPath || typeof decodedPath !== "string") {
    return [];
  }

  if (decodedPath === "/") {
    return ["index.html"];
  }

  const normalized = decodedPath.startsWith("/") ? decodedPath : `/${decodedPath}`;
  const isDirectoryPath = normalized.endsWith("/");
  const trimmed = normalized.replace(/^\/+|\/+$/g, "");

  if (!trimmed) {
    return ["index.html"];
  }

  const candidates = new Set();
  const add = (candidate) => {
    if (candidate) candidates.add(candidate);
  };

  if (trimmed === "docs") {
    add("docs.html");
  }

  if (/^docs\/[^/]+$/i.test(trimmed)) {
    add(`${trimmed}.html`);
  }

  if (/^(ai-workflows|ai-scolecs|smart-medical-archive|privacy-cookies|job\.MAISco|interview|terms|sitemap|offline)$/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", trimmed, "index.html"));
  }

  if (/^blog\/automation\/[^/]+$/i.test(trimmed) || /^blog\/data-analytics\/[^/]+$/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", `${trimmed}.html`));
  }

  if (/^blog\/[^/]+$/i.test(trimmed)) {
    add(path.posix.join("frontend/pages/blogger", `${path.posix.basename(trimmed)}.html`));
  }

  if (/^sectors\/[^/]+$/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", `${trimmed}.html`));
  }

  if (/^(ai-bots|try|demo)\/.+/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", trimmed, "index.html"));
    add(path.posix.join("frontend/pages", `${trimmed}.html`));
  }

  if (isDirectoryPath) {
    add(path.posix.join(trimmed, "index.html"));
    add(`${trimmed}.html`);
  } else {
    add(`${trimmed}.html`);
    add(path.posix.join(trimmed, "index.html"));
  }

  return [...candidates];
}
