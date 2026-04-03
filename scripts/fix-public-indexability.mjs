#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { buildLocalFileCandidates } from "./sitemap-audit-utils.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const ROUTES_REPORT = path.join(ROOT, "reports", "public-routes-priority.txt");
const FIX_REPORT = path.join(ROOT, "reports", "public-indexability-fix-report.json");
const HTML_SITEMAP_FILE = path.join(ROOT, "frontend/pages/sitemap/index.html");
const SITEMAP_LINK_TAG = `<link rel="sitemap" type="application/xml" href="${BASE_URL}/sitemap.xml" />`;
const INDEX_ROBOTS_TAG =
  '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />';
const DEFAULT_NOINDEX_ROBOTS_TAG = '<meta name="robots" content="noindex, nofollow, noarchive" />';

function decodePathname(pathname) {
  return pathname
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
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isUrlLine(line) {
  return /^https:\/\/brightai\.site\//i.test(line.trim());
}

function routePathToAbsoluteUrl(routePath) {
  return `${BASE_URL}${routePath}`;
}

function hasNoindexDirective(html) {
  return /<meta\b[^>]*(?:name|property)\s*=\s*["'](?:robots|googlebot)["'][^>]*content\s*=\s*["'][^"']*noindex/i.test(
    html
  );
}

function extractRobotsTag(html) {
  const match = html.match(
    /<meta\b[^>]*(?:name|property)\s*=\s*["'](?:robots|googlebot)["'][^>]*content\s*=\s*["'][^"']*["'][^>]*>/i
  );
  return match ? match[0].trim() : "";
}

function buildRouteLabel(routePath) {
  if (routePath === "/") return "الرئيسية";
  const decoded = decodePathname(routePath).replace(/^\/|\/$/g, "");
  return decoded || "الرئيسية";
}

async function readPriorityRoutes() {
  const content = await fs.readFile(ROUTES_REPORT, "utf8");
  const lines = content.split(/\r?\n/);
  const sections = [];
  let currentSection = null;
  const seenUrls = new Set();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("ملاحظة:") || line === "روابط BrightAI العامة" || line === "ترتيب من الأهم إلى الأقل") {
      continue;
    }

    if (isUrlLine(line)) {
      if (seenUrls.has(line)) {
        continue;
      }
      seenUrls.add(line);
      if (!currentSection) {
        currentSection = { title: "روابط عامة", urls: [] };
        sections.push(currentSection);
      }
      currentSection.urls.push(line);
      continue;
    }

    currentSection = { title: line, urls: [] };
    sections.push(currentSection);
  }

  const routeEntries = [];
  for (const section of sections) {
    for (const url of section.urls) {
      const parsed = new URL(url);
      routeEntries.push({
        section: section.title,
        url,
        routePath: parsed.pathname || "/",
        decodedPath: decodePathname(parsed.pathname || "/"),
      });
    }
  }

  const homeUrl = `${BASE_URL}/`;
  if (!routeEntries.some((entry) => entry.url === homeUrl)) {
    if (!sections.length) {
      sections.push({ title: "المسارات الأساسية الأعلى", urls: [homeUrl] });
    } else {
      sections[0].urls = [homeUrl, ...sections[0].urls.filter((url) => url !== homeUrl)];
    }
    routeEntries.unshift({
      section: sections[0].title,
      url: homeUrl,
      routePath: "/",
      decodedPath: "/",
    });
  }

  return { sections, routeEntries };
}

function renderPriorityRoutesText(sections) {
  const lines = ["روابط BrightAI العامة", "ترتيب من الأهم إلى الأقل", ""];

  for (const section of sections) {
    if (!section.urls.length) continue;
    lines.push(section.title);
    lines.push(...section.urls);
    lines.push("");
  }

  lines.push("ملاحظة: هذه القائمة تمثل المسارات العامة المستهدفة للفهرسة داخل brightai.site.");
  return `${lines.join("\n")}\n`;
}

async function resolveRouteFile(routeEntry) {
  const candidates = buildLocalFileCandidates(routeEntry.decodedPath);
  for (const candidate of candidates) {
    const fullPath = path.join(ROOT, candidate);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        return { relPath: candidate, fullPath };
      }
    } catch {
      // تجاهل المرشح غير الموجود.
    }
  }
  return null;
}

function buildHreflangTags(routePath, routeSet, isIndexable) {
  if (!isIndexable) {
    return [];
  }

  if (/^\/docs\/[^/]+-en\/$/i.test(routePath)) {
    const arPath = routePath.replace(/-en\/$/i, "/");
    if (routeSet.has(arPath)) {
      return [
        `<link rel="alternate" hreflang="ar-SA" href="${routePathToAbsoluteUrl(arPath)}" />`,
        `<link rel="alternate" hreflang="en-US" href="${routePathToAbsoluteUrl(routePath)}" />`,
        `<link rel="alternate" hreflang="x-default" href="${routePathToAbsoluteUrl(arPath)}" />`,
      ];
    }
    return [
      `<link rel="alternate" hreflang="en-US" href="${routePathToAbsoluteUrl(routePath)}" />`,
      `<link rel="alternate" hreflang="x-default" href="${routePathToAbsoluteUrl(routePath)}" />`,
    ];
  }

  if (/^\/docs\/[^/]+\/$/i.test(routePath) && !/-en\/$/i.test(routePath)) {
    const enPath = routePath.replace(/\/$/, "-en/");
    if (routeSet.has(enPath)) {
      return [
        `<link rel="alternate" hreflang="ar-SA" href="${routePathToAbsoluteUrl(routePath)}" />`,
        `<link rel="alternate" hreflang="en-US" href="${routePathToAbsoluteUrl(enPath)}" />`,
        `<link rel="alternate" hreflang="x-default" href="${routePathToAbsoluteUrl(routePath)}" />`,
      ];
    }
  }

  return [
    `<link rel="alternate" hreflang="ar-SA" href="${routePathToAbsoluteUrl(routePath)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${routePathToAbsoluteUrl(routePath)}" />`,
  ];
}

function upsertSeoSignals(html, routePath, routeSet) {
  const canonicalUrl = routePathToAbsoluteUrl(routePath);
  const isIndexable = !hasNoindexDirective(html);
  const robotsTag = isIndexable ? INDEX_ROBOTS_TAG : extractRobotsTag(html) || DEFAULT_NOINDEX_ROBOTS_TAG;
  const hreflangTags = buildHreflangTags(routePath, routeSet, isIndexable).join("\n");

  let updated = html;

  updated = updated.replace(
    /\s*<meta\b[^>]*(?:name|property)\s*=\s*["'](?:robots|googlebot)["'][^>]*>\s*/gi,
    "\n"
  );
  updated = updated.replace(/\s*<link\b[^>]*rel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'][^>]*>\s*/gi, "\n");
  updated = updated.replace(
    /\s*<link\b[^>]*rel\s*=\s*["'][^"']*\balternate\b[^"']*["'][^>]*hreflang\s*=\s*["'][^"']+["'][^>]*>\s*/gi,
    "\n"
  );
  updated = updated.replace(/\s*<meta\b[^>]*property\s*=\s*["']og:url["'][^>]*>\s*/gi, "\n");
  updated = updated.replace(/\s*<link\b[^>]*rel\s*=\s*["']sitemap["'][^>]*>\s*/gi, "\n");

  const headOpen = updated.match(/<head\b[^>]*>/i);
  if (!headOpen || headOpen.index == null) {
    return updated;
  }

  const injectAt = headOpen.index + headOpen[0].length;
  const seoBlock = [
    "",
    robotsTag,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    hreflangTags,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    SITEMAP_LINK_TAG,
  ]
    .filter(Boolean)
    .join("\n");

  return `${updated.slice(0, injectAt)}\n${seoBlock}${updated.slice(injectAt)}`;
}

function buildHtmlSitemap(sections) {
  const renderedSections = sections
    .filter((section) => section.urls.length > 0)
    .map((section) => {
      const items = section.urls
        .map((url) => {
          const routePath = new URL(url).pathname || "/";
          const label = buildRouteLabel(routePath);
          return `<li><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></li>`;
        })
        .join("\n");

      return `
    <section class="section-block">
      <h2>${escapeHtml(section.title)}</h2>
      <ul>
${items}
      </ul>
    </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>خريطة الموقع | BrightAI</title>
  <meta name="description" content="خريطة HTML شاملة لجميع صفحات BrightAI العامة لتسهيل الزحف والفهرسة والوصول السريع إلى كل المسارات المهمة." />
  ${INDEX_ROBOTS_TAG}
  <link rel="canonical" href="${BASE_URL}/sitemap/" />
  <link rel="alternate" hreflang="ar-SA" href="${BASE_URL}/sitemap/" />
  <link rel="alternate" hreflang="x-default" href="${BASE_URL}/sitemap/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="خريطة الموقع | BrightAI" />
  <meta property="og:description" content="صفحة تجمع كل روابط BrightAI العامة لتسهيل الفهرسة والوصول." />
  <meta property="og:url" content="${BASE_URL}/sitemap/" />
  ${SITEMAP_LINK_TAG}
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --card: rgba(15, 23, 42, 0.86);
      --border: rgba(255, 255, 255, 0.08);
      --text: #e5eefb;
      --muted: #9cb0cf;
      --accent: #d5aa47;
      --link: #8ad7ff;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Tajawal", system-ui, sans-serif;
      background:
        radial-gradient(circle at top right, rgba(213, 170, 71, 0.18), transparent 24%),
        radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.16), transparent 22%),
        linear-gradient(180deg, #06101d 0%, #0b1322 100%);
      color: var(--text);
      min-height: 100vh;
    }

    main {
      width: min(1160px, calc(100% - 32px));
      margin: 0 auto;
      padding: 56px 0 72px;
    }

    .hero {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      backdrop-filter: blur(14px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      margin-bottom: 24px;
    }

    .hero h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 3vw, 3rem);
    }

    .hero p {
      margin: 0;
      color: var(--muted);
      line-height: 1.9;
    }

    .meta-links {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 18px;
    }

    .meta-links a {
      color: var(--text);
      text-decoration: none;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.04);
      border-radius: 999px;
      padding: 10px 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
    }

    .section-block {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 22px 20px;
      backdrop-filter: blur(12px);
    }

    .section-block h2 {
      margin: 0 0 14px;
      font-size: 1.08rem;
      color: var(--accent);
    }

    .section-block ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 10px;
    }

    .section-block a {
      color: var(--link);
      text-decoration: none;
      line-height: 1.8;
      word-break: break-word;
    }

    .section-block a:hover {
      color: #ffffff;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>خريطة الموقع</h1>
      <p>هذه الصفحة تجمع كل الروابط العامة المهمة داخل BrightAI بصيغة واضحة لمحركات البحث والزوار. تم ترتيب الروابط من الأهم إلى الأقل وفق أولويات الفهرسة الحالية داخل المشروع.</p>
      <div class="meta-links">
        <a href="${BASE_URL}/">العودة إلى الرئيسية</a>
        <a href="${BASE_URL}/sitemap.xml">Sitemap XML</a>
      </div>
    </section>
    <div class="grid">
${renderedSections}
    </div>
  </main>
</body>
</html>
`;
}

async function main() {
  const { sections, routeEntries } = await readPriorityRoutes();
  const routeSet = new Set(routeEntries.map((entry) => entry.routePath));
  const missingRoutes = [];
  const fixedFiles = [];

  for (const routeEntry of routeEntries) {
    const resolved = await resolveRouteFile(routeEntry);
    if (!resolved) {
      missingRoutes.push(routeEntry.routePath);
      continue;
    }

    const original = await fs.readFile(resolved.fullPath, "utf8");
    const updated = upsertSeoSignals(original, routeEntry.routePath, routeSet);
    if (updated !== original) {
      await fs.writeFile(resolved.fullPath, updated, "utf8");
      fixedFiles.push(resolved.relPath);
    }
  }

  const htmlSitemap = buildHtmlSitemap(sections);
  await fs.writeFile(HTML_SITEMAP_FILE, htmlSitemap, "utf8");

  const normalizedRoutesText = renderPriorityRoutesText(sections);
  await fs.writeFile(ROUTES_REPORT, normalizedRoutesText, "utf8");

  const report = {
    scannedRoutes: routeEntries.length,
    fixedFiles: [...new Set(fixedFiles)].sort((a, b) => a.localeCompare(b, "en")),
    missingRoutes,
  };

  await fs.writeFile(
    FIX_REPORT,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log(`Routes scanned: ${routeEntries.length}`);
  console.log(`Files fixed: ${report.fixedFiles.length}`);
  console.log(`Missing routes: ${missingRoutes.length}`);
  if (missingRoutes.length > 0) {
    console.log(missingRoutes.join("\n"));
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
