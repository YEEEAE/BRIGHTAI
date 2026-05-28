#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const CSS_HREF = "/frontend/css/production-fixes.v20260427.css";
const JS_SRC = "/frontend/js/production-runtime.v20260427.js";
const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "dist", "build", ".next", "coverage", ".render-static"]);
const ERROR_PAGES = new Set(["404.html", "500.html", "error.html"]);
const SERVICE_PATH_RE = /(^|\/)(services|ai-agent|ai-bots|smart-automation|data-analysis|machine-learning|ai-workflows|consultation|sectors|health|smart-medical-archive|tenders)(\/|\.html|$)/i;
const COMMERCIAL_ROUTE_RE = /^\/(?:contact|tools|about|case-studies|partners)\/?$/i;

function normalizeRel(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function routeFromRel(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return `/${relPath.slice(0, -"index.html".length)}`;
  return `/${relPath.replace(/\.html$/i, "/")}`;
}

function canonicalFromRel(relPath) {
  return `${BASE_URL}${routeFromRel(relPath)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirst(html, regex) {
  return stripTags((html.match(regex) || [])[1] || "");
}

function extractTitle(html) {
  return extractFirst(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i) || "Bright AI";
}

function extractDescription(html, title) {
  const meta = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  return stripTags(meta?.[1] || extractFirst(html, /<p\b[^>]*>([\s\S]*?)<\/p>/i) || title).slice(0, 220);
}

function extractH1(html, title) {
  return extractFirst(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || title.replace(/\s*\|\s*Bright AI\s*$/i, "");
}

function detectLanguage(relPath, html) {
  const lang = (html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i) || [])[1] || "";
  if (lang.toLowerCase().startsWith("en") || relPath.startsWith("en/") || /-en\.html$/i.test(relPath)) return "en";
  return "ar";
}

function orgGraph() {
  return {
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${BASE_URL}/#organization`,
    name: "Bright AI",
    url: BASE_URL,
    logo: `${BASE_URL}/frontend/images/logo-new.PNG`,
    areaServed: "SA",
    sameAs: []
  };
}

function websiteGraph() {
  return {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "Bright AI",
    publisher: { "@id": `${BASE_URL}/#organization` },
    inLanguage: ["ar-SA", "en-SA"]
  };
}

function breadcrumbGraph(relPath, title, canonical) {
  const parts = routeFromRel(relPath).split("/").filter(Boolean);
  const items = [{ "@type": "ListItem", position: 1, name: "Bright AI", item: `${BASE_URL}/` }];
  let current = BASE_URL;
  parts.forEach((part, index) => {
    current += `/${part}`;
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: index === parts.length - 1 ? title.replace(/\s*\|\s*Bright AI\s*$/i, "") : part.replace(/-/g, " "),
      item: `${current}/`
    });
  });
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: items
  };
}

function serviceGraph(relPath, title, description, canonical) {
  if (!SERVICE_PATH_RE.test(relPath)) return null;
  return {
    "@type": "Service",
    "@id": `${canonical}#service`,
    name: title.replace(/\s*\|\s*Bright AI\s*$/i, ""),
    description,
    provider: { "@id": `${BASE_URL}/#organization` },
    areaServed: "Saudi Arabia",
    serviceType: "AI SaaS and automation services",
    url: canonical
  };
}

function faqGraph(html, canonical, lang) {
  const urlPath = new URL(canonical).pathname;
  const isCommercial = SERVICE_PATH_RE.test(urlPath) || COMMERCIAL_ROUTE_RE.test(urlPath) || urlPath === "/";
  if (isCommercial && !/\/docs\/faq(?:-en)?\/?$|\/faq(?:-en)?\/?$/i.test(urlPath)) {
    return null;
  }

  const questions = [];
  const faqBlock = /faq|أسئلة|سؤال|question/i.test(html);
  if (faqBlock) {
    const headingMatches = [...html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
    for (const match of headingMatches) {
      const q = stripTags(match[1]);
      const a = stripTags(match[2]);
      if (q.length >= 8 && a.length >= 20 && /[؟?]|how|what|why|متى|كيف|ما|هل/i.test(q)) {
        questions.push({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a.slice(0, 500) }
        });
      }
      if (questions.length >= 4) break;
    }
  }
  if (!questions.length && /\/docs\/faq(?:-en)?\/?$|\/faq(?:-en)?\/?$/i.test(urlPath)) {
    questions.push({
      "@type": "Question",
      name: lang === "en" ? "What does Bright AI provide on this page?" : "ماذا تقدم Bright AI في هذه الصفحة؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: lang === "en"
          ? "Bright AI provides AI automation and data solutions for organizations in Saudi Arabia, with implementation focused on measurable business workflows."
          : "تقدم Bright AI حلول ذكاء اصطناعي وأتمتة وتحليل بيانات للجهات والشركات في السعودية، مع تنفيذ يركز على سير عمل قابل للقياس."
      }
    });
  }
  if (!questions.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: questions
  };
}

function schemaJson(relPath, html) {
  const canonical = canonicalFromRel(relPath);
  const title = extractTitle(html);
  const description = extractDescription(html, title);
  const lang = detectLanguage(relPath, html);
  const graph = [
    orgGraph(),
    websiteGraph(),
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@id": `${BASE_URL}/#organization` },
      inLanguage: lang === "en" ? "en-SA" : "ar-SA"
    },
    breadcrumbGraph(relPath, title, canonical)
  ];
  const service = serviceGraph(relPath, title, description, canonical);
  if (service) graph.push(service);
  const faq = faqGraph(html, canonical, lang);
  if (faq) graph.push(faq);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

function ensureCanonical(html, relPath) {
  const canonical = canonicalFromRel(relPath);
  const tag = `<link rel="canonical" href="${canonical}">`;
  if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function ensureRobots(html, relPath) {
  const robots = ERROR_PAGES.has(relPath) ? "noindex, follow" : "index, follow";
  const tag = `<meta name="robots" content="${robots}">`;
  if (/<meta\b[^>]*name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function ensureAssetTags(html) {
  if (!html.includes(CSS_HREF)) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="${CSS_HREF}">\n</head>`);
  }
  if (!html.includes(JS_SRC)) {
    html = html.replace(/<\/body>/i, `  <script src="${JS_SRC}" defer></script>\n</body>`);
  }
  return html;
}

function ensureSchema(html, relPath) {
  const marker = "brightai-production-schema";
  const script = `<script id="${marker}" type="application/ld+json">\n${schemaJson(relPath, html)}\n  </script>`;
  if (html.includes(`id="${marker}"`)) {
    return html.replace(/<script\b[^>]*id=["']brightai-production-schema["'][\s\S]*?<\/script>/i, script);
  }
  return html.replace(/<\/head>/i, `  ${script}\n</head>`);
}

function ensureAnswerBlock(html, relPath) {
  if (!SERVICE_PATH_RE.test(relPath) || /class=["'][^"']*answer-block/i.test(html)) return html;
  const title = extractH1(html, extractTitle(html));
  const lang = detectLanguage(relPath, html);
  const text = lang === "en"
    ? `Bright AI helps Saudi organizations turn ${title} into measurable workflows through AI automation, data readiness, secure integration, and operational dashboards. The page explains when the solution fits, what data is required, and how teams can start safely.`
    : `تساعد Bright AI الجهات والشركات في السعودية على تحويل ${title} إلى سير عمل قابل للقياس عبر الأتمتة الذكية، جاهزية البيانات، التكامل الآمن، ولوحات متابعة تشغيلية. توضّح الصفحة متى يناسب الحل، وما البيانات المطلوبة، وكيف يبدأ الفريق بأمان.`;
  const block = `<section class="answer-block" aria-labelledby="answer-title-${relPath.replace(/[^a-z0-9]+/gi, "-")}">
    <h2 id="answer-title-${relPath.replace(/[^a-z0-9]+/gi, "-")}">${lang === "en" ? "Short Answer" : "إجابة مختصرة"}</h2>
    <p>${escapeHtml(text)}</p>
  </section>`;
  const h1Close = html.search(/<\/h1>/i);
  if (h1Close === -1) return html;
  const insertAt = h1Close + html.slice(h1Close).match(/<\/h1>/i)[0].length;
  return `${html.slice(0, insertAt)}\n${block}\n${html.slice(insertAt)}`;
}

function enhanceResourceLoading(html) {
  html = html.replace(/<script\b(?![^>]*\bdefer\b)(?![^>]*\basync\b)([^>]*\bsrc=["'][^"']+["'][^>]*)><\/script>/gi, (match, attrs) => {
    if (/application\/ld\+json|type=["']module["']/i.test(match)) return match;
    return `<script${attrs} defer></script>`;
  });
  html = html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    let next = attrs;
    if (!/\bdecoding=/i.test(next)) next += ' decoding="async"';
    if (!/\bloading=/i.test(next) && !/\bfetchpriority=["']high["']/i.test(next)) next += ' loading="lazy"';
    return `<img${next}>`;
  });
  return html;
}

async function walkHtml(dir, bucket = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtml(full, bucket);
    } else if (/\.html$/i.test(entry.name)) {
      bucket.push(full);
    }
  }
  return bucket;
}

async function main() {
  const files = await walkHtml(ROOT);
  let changed = 0;
  for (const fullPath of files) {
    const relPath = normalizeRel(path.relative(ROOT, fullPath));
    if (relPath.startsWith("reports/") || relPath.startsWith("tmp/")) continue;
    let html = await fs.readFile(fullPath, "utf8");
    if (!/<head\b/i.test(html) || !/<body\b/i.test(html)) continue;
    const original = html;
    html = ensureRobots(html, relPath);
    html = ensureCanonical(html, relPath);
    html = ensureSchema(html, relPath);
    html = ensureAnswerBlock(html, relPath);
    html = ensureAssetTags(html);
    html = enhanceResourceLoading(html);
    if (html !== original) {
      await fs.writeFile(fullPath, html, "utf8");
      changed += 1;
    }
  }
  process.stdout.write(`Applied production audit fixes to ${changed} HTML files\\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\\n`);
  process.exitCode = 1;
});
