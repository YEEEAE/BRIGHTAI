import path from "node:path";

const DEFAULT_BASE_URL = "https://brightai.site";

export function extractCanonicalHref(html) {
  if (!html || typeof html !== "string") return "";
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)];
  for (const match of linkTags) {
    const tag = match[0];
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relMatch) continue;
    const relTokens = relMatch[1]
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);
    if (!relTokens.includes("canonical")) continue;

    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch?.[1]) {
      return hrefMatch[1].trim();
    }
  }
  return "";
}

export function hasMetaRefresh(html) {
  if (!html || typeof html !== "string") return false;
  return /<meta\b[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/i.test(html);
}

export function hasJsRedirect(html) {
  if (!html || typeof html !== "string") return false;
  return /(?:window\.)?location\.(?:href|assign|replace)\s*\(|(?:window\.)?location\s*=\s*["']/i.test(
    html
  );
}

export function hasHtmlRedirectSignals(html) {
  return hasMetaRefresh(html) || hasJsRedirect(html);
}

export function hasNoindexDirective(html) {
  if (!html || typeof html !== "string") return false;

  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)];
  for (const match of metaTags) {
    const tag = match[0];
    const nameMatch = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    const name = nameMatch?.[1]?.trim().toLowerCase() || "";
    const content = contentMatch?.[1]?.trim().toLowerCase() || "";
    if ((name === "robots" || name === "googlebot") && content.includes("noindex")) {
      return true;
    }
  }

  return false;
}

export function extractAlternateHreflangLinks(html) {
  if (!html || typeof html !== "string") return [];

  const matches = [...html.matchAll(/<link\b[^>]*>/gi)];
  const links = [];
  for (const match of matches) {
    const tag = match[0];
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relMatch) continue;
    const relTokens = relMatch[1]
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);
    if (!relTokens.includes("alternate")) continue;

    const hreflangMatch = tag.match(/\bhreflang\s*=\s*["']([^"']+)["']/i);
    if (!hreflangMatch) continue;

    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    links.push({
      hreflang: hreflangMatch[1].trim(),
      href: hrefMatch?.[1]?.trim() || "",
      tag,
    });
  }

  return links;
}

export function findOnrenderReferences(input) {
  if (!input || typeof input !== "string") return [];
  return [...new Set(input.match(/https?:\/\/[^\s"'<>]*\.onrender\.com[^\s"'<>]*/gi) || [])];
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

  if (/^(smart-medical-archive|privacy-cookies)$/i.test(trimmed)) {
    add(path.posix.join(trimmed, "index.html"));
  }

  if (/^tenders$/i.test(trimmed)) {
    add("tenders/index.html");
  }

  if (/^interview$/i.test(trimmed)) {
    add(path.posix.join(trimmed, "index.html"));
    add(path.posix.join("frontend/pages", trimmed, "index.html"));
  }

  if (/^(ai-workflows|ai-scolecs|job\.MAISco|terms|sitemap|offline|demo|try)$/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", trimmed, "index.html"));
  }

  if (/^interview\/.+/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", `${trimmed}.html`));
    add(path.posix.join("frontend/pages", trimmed, "index.html"));
  }

  if (/^blog\/automation\/[^/]+$/i.test(trimmed) || /^blog\/data-analytics\/[^/]+$/i.test(trimmed)) {
    add(path.posix.join("frontend/pages", `${trimmed}.html`));
  }

  if (/^sectors\/[^/]+$/i.test(trimmed)) {
    add(`${trimmed}.html`);
    add(path.posix.join("frontend/pages", `${trimmed}.html`));
  }

  if (/^tenders\/[^/]+$/i.test(trimmed)) {
    add(`${trimmed}.html`);
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

  if (!isDirectoryPath && /^blog\/[^/]+$/i.test(trimmed)) {
    add(path.posix.join("blog", `${path.posix.basename(trimmed)}.html`));
  }

  return [...candidates];
}
