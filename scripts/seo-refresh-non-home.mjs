#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_IMAGE = "https://brightai.site/assets/images/Gemini.png";
const SITE_NAME_AR = "Bright AI - مُشرقة للذكاء الاصطناعي";
const SITE_NAME_EN = "Bright AI";

const DOC_FILES = [
  "docs/ai-agent.html",
  "docs/ai-agent-en.html",
  "docs/ai-bots.html",
  "docs/ai-bots-en.html",
  "docs/consultation.html",
  "docs/consultation-en.html",
  "docs/contact.html",
  "docs/contact-en.html",
  "docs/data-analysis.html",
  "docs/data-analysis-en.html",
  "docs/faq.html",
  "docs/faq-en.html",
  "docs/openapi.html",
  "docs/privacy-policy.html",
  "docs/privacy-policy-en.html",
  "docs/services-overview.html",
  "docs/services-overview-en.html",
  "docs/smart-automation.html",
  "docs/smart-automation-en.html",
  "docs/solutions-bi.html",
  "docs/solutions-bi-en.html",
  "docs/solutions-crm.html",
  "docs/solutions-crm-en.html",
  "docs/solutions-finance.html",
  "docs/solutions-finance-en.html",
  "docs/solutions-healthcare.html",
  "docs/solutions-healthcare-en.html",
  "docs/solutions-hr.html",
  "docs/solutions-hr-en.html",
  "docs/solutions-interview.html",
  "docs/solutions-interview-en.html",
  "docs/solutions-logistics.html",
  "docs/solutions-logistics-en.html",
  "docs/solutions-ocr.html",
  "docs/solutions-ocr-en.html",
  "docs/solutions-retail.html",
  "docs/solutions-retail-en.html",
  "docs/solutions-supply-chain.html",
  "docs/solutions-supply-chain-en.html",
  "docs/terms-and-conditions.html",
  "docs/terms-and-conditions-en.html",
  "tools/index.html",
  "blog/index.html",
];

const BLOG_SOCIAL_FILES = [
  "blog/business-intelligence-saudi.html",
  "blog/digital-banking-saudi.html",
  "blog/smart-crm-system.html",
  "blog/smart-document-processing.html",
  "blog/smart-inventory-management.html",
  "blog/transport-logistics-solutions.html",
];

const LEGAL_FILES = new Set([
  "docs/privacy-policy.html",
  "docs/privacy-policy-en.html",
  "docs/terms-and-conditions.html",
  "docs/terms-and-conditions-en.html",
]);

const BLOG_REDIRECT_HINTS = [
  "تم نقل الصفحة",
  "تحويل المقال",
  "يتم توجيهك تلقائيًا",
];

const BLOG_LINK_REPLACEMENTS = new Map([
  [
    "/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات/",
    "/blog/",
  ],
  [
    "/blog/astr.doc/",
    "/blog/ai-implementation-cost-guide/",
  ],
  [
    "/blog/atou.doc/",
    "/blog/process-automation/",
  ],
]);

function readTitle(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function readDescription(html) {
  return (
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]*)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"]*)["'][^>]+name=["']description["']/i)?.[1] ||
    ""
  ).replace(/\s+/g, " ").trim();
}

function readCanonical(html) {
  return (
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"]*)["']/i)?.[1] ||
    html.match(/<link[^>]+href=["']([^"]*)["'][^>]+rel=["']canonical["']/i)?.[1] ||
    ""
  ).trim();
}

function htmlLang(html, filePath) {
  const raw = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";
  if (raw.startsWith("en") || filePath.endsWith("-en.html")) {
    return "en";
  }
  return "ar";
}

function socialBlock({ lang, title, description }) {
  const locale = lang === "en" ? "en_SA" : "ar_SA";
  const siteName = lang === "en" ? SITE_NAME_EN : SITE_NAME_AR;
  const imageAlt =
    lang === "en"
      ? "Bright AI enterprise AI solutions for Saudi organizations"
      : "Bright AI حلول الذكاء الاصطناعي المؤسسية في السعودية";

  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${DEFAULT_IMAGE}" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta property="og:locale" content="${locale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
  ].join("\n");
}

function ensureSocialMeta(html, filePath) {
  const title = readTitle(html);
  const description = readDescription(html);
  const canonical = readCanonical(html);
  const lang = htmlLang(html, filePath);
  if (!title || !description || !canonical) {
    return html;
  }

  const block = [
    `<meta property="og:url" content="${canonical}" />`,
    socialBlock({ lang, title, description }),
  ].join("\n");

  html = html.replace(/<meta\b[^>]*property="og:url"[^>]*>\s*/gi, "");
  html = html.replace(/<meta\b[^>]*property="og:(type|site_name|title|description|image|image:alt|locale)"[^>]*>\s*/gi, "");
  html = html.replace(/<meta\b[^>]*name="twitter:(card|title|description|image|image:alt)"[^>]*>\s*/gi, "");

  const insertAfter = /<link rel="alternate" hreflang="x-default"[^>]*>\s*/i;
  if (insertAfter.test(html)) {
    return html.replace(insertAfter, (match) => `${match}${block}\n`);
  }

  return html;
}

function setRobots(html, content) {
  if (/<meta name="robots"/i.test(html)) {
    return html.replace(/<meta name="robots" content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${content}" />`);
  }
  return html.replace(/<head>/i, `<head>\n<meta name="robots" content="${content}" />`);
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectRedirectTarget(html) {
  const metaRefresh = html.match(/http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^;"']+)/i)?.[1];
  if (metaRefresh) return metaRefresh.trim();
  const jsRedirect = html.match(/window\.location\.replace\(["']([^"']+)["']\)/i)?.[1];
  if (jsRedirect) return jsRedirect.trim();
  if (/href="\/blog\/"/.test(html)) return "/blog/";
  return null;
}

function ensureCanonical(html, href) {
  if (!href) return html;
  if (/<link rel="canonical"/i.test(html)) {
    return html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${href}" />`);
  }
  return html.replace(/<head>/i, `<head>\n<link rel="canonical" href="${href}" />`);
}

function stripMetaRefresh(html) {
  return html.replace(/\s*<meta[^>]+http-equiv=["']refresh["'][^>]*>\s*/gi, "\n");
}

function stripRedirectScripts(html) {
  return html.replace(/\s*<script>\s*window\.location\.replace\(["'][^"']+["']\);\s*<\/script>\s*/gi, "\n");
}

function updateRedirectBlogPage(html) {
  const title = readTitle(html);
  const headSlice = html.slice(0, 1200);
  const isRedirect =
    BLOG_REDIRECT_HINTS.some((hint) => headSlice.includes(hint) || title.includes(hint)) ||
    /window\.location\.replace\(/i.test(html) ||
    /http-equiv=["']refresh["']/i.test(html);
  if (!isRedirect) return html;

  const target = detectRedirectTarget(html) || "/blog/";
  html = setRobots(html, "noindex, follow, noarchive");
  html = ensureCanonical(html, target.startsWith("http") ? target : `https://brightai.site${target}`);
  html = stripMetaRefresh(html);
  html = stripRedirectScripts(html);
  return html;
}

function removeToolRatings(html) {
  return html
    .replace(/,\s*"aggregateRating":\s*\{[\s\S]*?\}\s*,\s*"review":\s*\[[\s\S]*?\](\s*\n)?/m, "\n")
    .replace(/,\s*"review":\s*\[[\s\S]*?\](\s*\n)?/m, "\n");
}

function improveIndexLinks(html) {
  for (const [from, to] of BLOG_LINK_REPLACEMENTS.entries()) {
    html = html.replaceAll(`href="${from}"`, `href="${to}"`);
  }
  return html;
}

async function updateFile(relPath, transform) {
  const fullPath = path.join(ROOT, relPath);
  const original = await fs.readFile(fullPath, "utf8");
  const next = transform(original);
  if (next !== original) {
    await fs.writeFile(fullPath, next);
    return true;
  }
  return false;
}

async function main() {
  const changed = [];

  for (const relPath of DOC_FILES) {
    const didChange = await updateFile(relPath, (html) => {
      let next = ensureSocialMeta(html, relPath);
      if (LEGAL_FILES.has(relPath)) {
        next = setRobots(next, "noindex, follow, noarchive");
      }
      if (relPath === "tools/index.html") {
        next = removeToolRatings(next);
      }
      if (relPath === "blog/index.html") {
        next = improveIndexLinks(next);
      }
      return next;
    });
    if (didChange) changed.push(relPath);
  }

  for (const relPath of BLOG_SOCIAL_FILES) {
    const didChange = await updateFile(relPath, (html) => ensureSocialMeta(html, relPath));
    if (didChange) changed.push(relPath);
  }

  const blogFiles = (await fs.readdir(path.join(ROOT, "blog")))
    .filter((file) => file.endsWith(".html") && file !== "index.html")
    .map((file) => `blog/${file}`);

  for (const relPath of blogFiles) {
    const didChange = await updateFile(relPath, (html) => updateRedirectBlogPage(html));
    if (didChange) changed.push(relPath);
  }

  if (changed.length) {
    console.log(changed.join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
