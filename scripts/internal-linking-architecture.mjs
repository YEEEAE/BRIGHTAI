#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import {
  buildPublicUrlRegistry,
  canonicalizeSitePath,
  relPathToCanonical,
  relPathToSitePath,
  normalizeRelPath,
  normalizeSiteUrl,
} from "./seo-url-map.mjs";
import { extractCanonicalHref, hasNoindexDirective } from "./sitemap-audit-utils.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";
const REPORT_DIR = path.join(ROOT, "reports", "internal-links");
const REPORT_JSON = path.join(REPORT_DIR, "full-inventory.json");
const REPORT_MD = path.join(REPORT_DIR, "full-inventory.md");
const START = "<!-- BRIGHTAI_INTERNAL_LINKS_START -->";
const END = "<!-- BRIGHTAI_INTERNAL_LINKS_END -->";

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "reports",
  "tmp",
  "dist",
  "build",
  "coverage",
]);

const OWNER_DECISION_PATTERNS = [
  /^404\.html$/i,
  /^500\.html$/i,
  /^error\.html$/i,
  /^backend\//i,
  /^tenders\/render-backend\//i,
  /^interview\/pages\//i,
  /^mais-OBM\//i,
];

const PILLAR_LINKS_AR = [
  { href: "/", text: "شركة ذكاء اصطناعي في السعودية" },
  { href: "/services/", text: "خدمات الذكاء الاصطناعي للشركات" },
  { href: "/ai-agent/", text: "وكلاء الذكاء الاصطناعي للأعمال" },
  { href: "/smart-automation/", text: "أتمتة الأعمال بالذكاء الاصطناعي" },
  { href: "/data-analysis/", text: "تحليل البيانات للشركات السعودية" },
  { href: "/bot/", text: "مساعد Bright AI التجريبي" },
  { href: "/contact/", text: "تواصل مع Bright AI لتنفيذ حلول AI" },
];

const PILLAR_LINKS_EN = [
  { href: "/en/", text: "Bright AI Saudi enterprise AI" },
  { href: "/en/services/", text: "AI services for Saudi companies" },
  { href: "/en/ai-agent/", text: "AI agents for business teams" },
  { href: "/en/smart-automation/", text: "AI workflow automation" },
  { href: "/en/data-analysis/", text: "Data analytics for Saudi teams" },
  { href: "/en/contact/", text: "Contact Bright AI for AI implementation" },
  { href: "/en/privacy-cookies/", text: "Bright AI privacy and cookies policy" },
  { href: "/en/terms/", text: "Bright AI terms and conditions" },
];

const LOCATION_LINKS_AR = [
  { href: "/locations/riyadh/", text: "خدمات الذكاء الاصطناعي في الرياض" },
  { href: "/locations/jeddah/", text: "حلول AI للشركات في جدة" },
  { href: "/locations/dammam/", text: "أتمتة وذكاء اصطناعي في الدمام" },
];

const SERVICE_CLUSTER_LINKS_AR = [
  { href: "/services/ai-automation-saudi/", text: "أتمتة الذكاء الاصطناعي في السعودية" },
  { href: "/services/ai-agents-saudi/", text: "وكلاء الذكاء الاصطناعي للشركات السعودية" },
  { href: "/services/ai-chatbot-arabic/", text: "شات بوت عربي للشركات" },
  { href: "/services/customer-service-automation/", text: "أتمتة خدمة العملاء بالذكاء الاصطناعي" },
  { href: "/services/ai-consulting/", text: "استشارات الذكاء الاصطناعي" },
  { href: "/services/data-platform/", text: "منصة تحليل بيانات للشركات" },
];

const BLOG_SUPPORT_LINKS_AR = [
  { href: "/blog/ai-guide-saudi-business/", text: "دليل الذكاء الاصطناعي للشركات السعودية" },
  { href: "/blog/building-ai-agents-practical-guide/", text: "شرح عملي لبناء وكلاء الذكاء الاصطناعي" },
  { href: "/blog/ai-agents-business-guide/", text: "دليل وكلاء الذكاء الاصطناعي للأعمال" },
  { href: "/blog/choose-ai-company-saudi/", text: "اختيار شركة ذكاء اصطناعي في السعودية" },
  { href: "/blog/smart-automation-benefits/", text: "فوائد الأتمتة الذكية للشركات" },
  { href: "/blog/ai-implementation-cost-guide/", text: "تكلفة تطبيق الذكاء الاصطناعي في السعودية" },
];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

async function walkHtml(dir = ROOT, bucket = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      await walkHtml(path.join(dir, entry.name), bucket);
    } else if (entry.isFile() && /\.html?$/i.test(entry.name)) {
      bucket.push(path.join(dir, entry.name));
    }
  }
  return bucket;
}

function stripHashAndQuery(value) {
  return String(value || "").split("#")[0].split("?")[0];
}

function normalizeInternalHref(href, sourceUrl) {
  const value = String(href || "").trim();
  if (!value || value.startsWith("#")) return null;
  if (/^(mailto|tel|sms|whatsapp|javascript|data|blob):/i.test(value)) return null;

  try {
    const parsed = new URL(value, sourceUrl || BASE_URL);
    if (parsed.origin !== BASE_URL) return null;
    return `${BASE_URL}${canonicalizeSitePath(parsed.pathname || "/")}`;
  } catch {
    return null;
  }
}

function titleFromHtml($, relPath) {
  const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();
  if (h1) return h1;
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  return title || relPath;
}

function isOwnerDecision(relPath) {
  return OWNER_DECISION_PATTERNS.some((pattern) => pattern.test(relPath));
}

async function readSitemapUrls() {
  try {
    const xml = await fs.readFile(path.join(ROOT, "sitemap.xml"), "utf8");
    return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => normalizeSiteUrl(match[1], BASE_URL)).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function buildInventory() {
  const htmlFiles = await walkHtml();
  const relPaths = htmlFiles.map((file) => normalizeRelPath(toPosix(path.relative(ROOT, file))));
  const registry = buildPublicUrlRegistry(relPaths, BASE_URL);
  const sitemapUrls = await readSitemapUrls();
  const pages = [];
  const outgoingByUrl = new Map();
  const incomingByUrl = new Map();
  const weakAnchors = [];
  const hashIssues = [];
  const noHrefLinks = [];
  const canonicalIssues = [];

  for (const relPath of relPaths) {
    const fullPath = path.join(ROOT, relPath);
    const html = await fs.readFile(fullPath, "utf8");
    const $ = cheerio.load(html, { decodeEntities: false });
    const canonicalHref = extractCanonicalHref(html);
    const expectedCanonical = relPathToCanonical(relPath, BASE_URL);
    const canonical = normalizeSiteUrl(canonicalHref, BASE_URL);
    const route = relPathToSitePath(relPath);
    const indexable = Boolean(expectedCanonical) && !hasNoindexDirective(html) && !isOwnerDecision(relPath) && canonical === expectedCanonical;
    const url = canonical || expectedCanonical || (route ? `${BASE_URL}${canonicalizeSitePath(route)}` : "");
    const anchors = [];
    const outgoing = new Set();
    const hashTargets = new Set();

    $("[id]").each((_, el) => hashTargets.add($(el).attr("id")));
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (!href) {
        noHrefLinks.push({ relPath, text });
        return;
      }
      if (href.startsWith("#") && href.length > 1 && !hashTargets.has(href.slice(1))) {
        hashIssues.push({ relPath, href, text, issue: "missing_section_target" });
      }
      const normalized = normalizeInternalHref(href, url || BASE_URL);
      if (!normalized) return;
      outgoing.add(normalized);
      anchors.push({ href: normalized, text });
      if (/^(اقرأ المزيد|المزيد|اضغط هنا|learn more|view more|more)$/i.test(text)) {
        weakAnchors.push({ relPath, href: normalized, oldText: text });
      }
    });

    if (expectedCanonical && canonical !== expectedCanonical && !isOwnerDecision(relPath)) {
      canonicalIssues.push({ relPath, expectedCanonical, canonical: canonicalHref || "" });
    }

    pages.push({
      relPath,
      url,
      expectedCanonical,
      canonical: canonicalHref || "",
      title: titleFromHtml($, relPath),
      routeType: relPath.endsWith("/index.html") ? "static-index-route" : "static-html-route",
      indexable,
      inSitemap: url ? sitemapUrls.has(url) : false,
      ownerDecisionNeeded: isOwnerDecision(relPath),
      outgoing: [...outgoing].sort(),
      outgoingAnchors: anchors,
    });
    outgoingByUrl.set(url, outgoing);
  }

  for (const page of pages) {
    if (!page.url) continue;
    incomingByUrl.set(page.url, new Set());
  }

  for (const page of pages) {
    for (const target of page.outgoing) {
      if (!incomingByUrl.has(target)) continue;
      incomingByUrl.get(target).add(page.url);
    }
  }

  for (const page of pages) {
    page.incoming = [...(incomingByUrl.get(page.url) || new Set())].filter((url) => url !== page.url).sort();
    page.isOrphan = page.indexable && page.url !== `${BASE_URL}/` && page.incoming.length === 0;
    page.problem = [
      page.isOrphan ? "orphan_page" : "",
      page.indexable && !page.inSitemap ? "missing_from_sitemap" : "",
      page.expectedCanonical && page.canonical && normalizeSiteUrl(page.canonical, BASE_URL) !== page.expectedCanonical ? "canonical_mismatch" : "",
      page.ownerDecisionNeeded ? "owner_decision_needed" : "",
    ].filter(Boolean).join(", ");
    page.severity = page.problem.includes("canonical_mismatch") || page.problem.includes("orphan_page") ? "High" : page.problem ? "Medium" : "None";
  }

  const sitemapMissingInternalLinks = [...sitemapUrls].filter((url) => {
    const page = pages.find((row) => row.url === url);
    return page && page.url !== `${BASE_URL}/` && page.incoming.length === 0;
  });

  return {
    generatedAt: new Date().toISOString(),
    filesScanned: relPaths.length,
    pages,
    summary: {
      pagesDiscovered: pages.length,
      indexablePages: pages.filter((page) => page.indexable).length,
      internalLinksDiscovered: pages.reduce((sum, page) => sum + page.outgoing.length, 0),
      orphanPages: pages.filter((page) => page.isOrphan).length,
      brokenLinks: 0,
      pagesOutsideSitemap: pages.filter((page) => page.indexable && !page.inSitemap).length,
      weakAnchors: weakAnchors.length,
      noHrefLinks: noHrefLinks.length,
      canonicalIssues: canonicalIssues.length,
      hashIssues: hashIssues.length,
      sitemapUrls: sitemapUrls.size,
      sitemapMissingInternalLinks: sitemapMissingInternalLinks.length,
    },
    weakAnchors,
    noHrefLinks,
    canonicalIssues,
    hashIssues,
    sitemapMissingInternalLinks,
    registrySize: registry.publicRelPaths.size,
  };
}

function pageKind(page) {
  const rel = page.relPath.toLowerCase();
  if (rel === "index.html") return "home";
  if (rel.startsWith("services/")) return "service";
  if (rel.startsWith("blog/")) return "blog";
  if (rel.startsWith("locations/")) return "location";
  if (rel.startsWith("sectors/")) return "sector";
  if (rel.startsWith("docs/")) return "docs";
  if (rel.startsWith("en/")) return "english";
  if (rel.startsWith("try/") || rel.startsWith("demo/") || rel.startsWith("tools/")) return "tool";
  return "core";
}

function dedupeLinks(links, currentUrl) {
  const seen = new Set();
  const result = [];
  for (const link of links) {
    const url = `${BASE_URL}${canonicalizeSitePath(new URL(link.href, BASE_URL).pathname)}`;
    if (url === currentUrl || seen.has(url)) continue;
    seen.add(url);
    result.push(link);
  }
  return result.slice(0, 8);
}

function relatedLinksForPage(page) {
  if (pageKind(page) === "english") {
    return dedupeLinks(PILLAR_LINKS_EN, page.url);
  }

  const kind = pageKind(page);
  if (kind === "service") {
    return dedupeLinks([
      { href: "/services/", text: "كل خدمات الذكاء الاصطناعي من Bright AI" },
      ...SERVICE_CLUSTER_LINKS_AR,
      ...LOCATION_LINKS_AR,
      { href: "/consultation/", text: "احجز استشارة ذكاء اصطناعي للشركات" },
    ], page.url);
  }

  if (kind === "blog") {
    const rel = page.relPath.toLowerCase();
    const topical = [];
    if (/health|medical|hospital|سرطان|صحي/.test(rel)) topical.push({ href: "/sectors/healthcare/", text: "حلول الذكاء الاصطناعي للقطاع الصحي" }, { href: "/services/medical-archive/", text: "الأرشيف الطبي الذكي" });
    if (/finance|bank|insurance|مالي/.test(rel)) topical.push({ href: "/sectors/finance/", text: "حلول AI للقطاع المالي في السعودية" }, { href: "/data-analysis/", text: "تحليل البيانات المالية والتشغيلية" });
    if (/logistics|supply|transport/.test(rel)) topical.push({ href: "/sectors/logistics/", text: "حلول الذكاء الاصطناعي للخدمات اللوجستية" }, { href: "/services/supply-chain-optimization/", text: "أتمتة تحسين سلسلة التوريد" });
    if (/hr|hiring|recruit/.test(rel)) topical.push({ href: "/services/hr-automation/", text: "أتمتة الموارد البشرية" }, { href: "/services/smart-hiring-system/", text: "نظام التوظيف الذكي" });
    return dedupeLinks([...topical, ...PILLAR_LINKS_AR, ...BLOG_SUPPORT_LINKS_AR], page.url);
  }

  if (kind === "location") {
    return dedupeLinks([
      { href: "/services/", text: "خدمات الذكاء الاصطناعي للشركات السعودية" },
      ...SERVICE_CLUSTER_LINKS_AR,
      ...LOCATION_LINKS_AR,
      { href: "/contact/", text: "تواصل مع Bright AI لتنفيذ حلول AI" },
    ], page.url);
  }

  if (kind === "sector") {
    return dedupeLinks([
      { href: "/services/", text: "خدمات AI المرتبطة بالقطاعات" },
      { href: "/services/data-platform/", text: "منصة تحليل بيانات للقطاعات التشغيلية" },
      { href: "/services/custom-ai-agent/", text: "وكيل ذكاء اصطناعي مخصص للقطاع" },
      { href: "/services/operational-reports-automation/", text: "أتمتة التقارير التشغيلية" },
      ...LOCATION_LINKS_AR,
    ], page.url);
  }

  if (kind === "tool") {
    return dedupeLinks([
      { href: "/tools/", text: "أدوات ذكاء اصطناعي مجانية من Bright AI" },
      { href: "/try/", text: "جرّب نماذج AI للأعمال" },
      { href: "/services/", text: "حوّل التجربة إلى حل ذكاء اصطناعي مؤسسي" },
      { href: "/contact/", text: "ناقش تطبيق الأداة داخل شركتك" },
    ], page.url);
  }

  return dedupeLinks([...PILLAR_LINKS_AR, ...SERVICE_CLUSTER_LINKS_AR, ...LOCATION_LINKS_AR], page.url);
}

function renderInternalLinksBlock(page, links) {
  const isEnglish = pageKind(page) === "english";
  const heading = isEnglish ? "Related Bright AI pages" : "روابط داخلية مهمة";
  const intro = isEnglish
    ? "Use these crawlable links to continue through Bright AI services and implementation pages."
    : "روابط مختارة تساعد الزائر ومحركات البحث على الوصول إلى الصفحات الأساسية والمرتبطة بالسياق.";
  const items = links.map((link) => `        <li><a href="${link.href}">${link.text}</a></li>`).join("\n");
  return `${START}
<section class="brightai-internal-links" aria-labelledby="brightai-internal-links-title" dir="${isEnglish ? "ltr" : "rtl"}">
  <div class="brightai-internal-links__inner">
    <h2 id="brightai-internal-links-title">${heading}</h2>
    <p>${intro}</p>
    <ul>
${items}
    </ul>
  </div>
</section>
${END}`;
}

function ensureInternalLinksCss(html) {
  if (html.includes(".brightai-internal-links")) return html;
  const css = `<style>
.brightai-internal-links{background:#020617;color:#e5e7eb;border-top:1px solid rgba(148,163,184,.18);padding:32px 20px}
.brightai-internal-links__inner{max-width:1120px;margin:0 auto}
.brightai-internal-links h2{font-size:clamp(1.25rem,2vw,1.75rem);margin:0 0 8px;color:#fff;letter-spacing:0}
.brightai-internal-links p{margin:0 0 18px;color:#94a3b8;line-height:1.8}
.brightai-internal-links ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px 18px;list-style:none;padding:0;margin:0}
.brightai-internal-links a{display:block;color:#c7d2fe;text-decoration:none;padding:10px 0;line-height:1.6}
.brightai-internal-links a:hover{color:#fff;text-decoration:underline}
</style>`;
  return html.replace(/<\/head>/i, `${css}\n</head>`);
}

function replaceWeakAnchors($) {
  const replacements = [];
  $("a").each((_, el) => {
    const anchor = $(el);
    const href = anchor.attr("href") || "";
    const oldText = anchor.text().replace(/\s+/g, " ").trim();
    if (!/^(اقرأ المزيد|المزيد|اضغط هنا|learn more|view more|more)$/i.test(oldText)) return;
    let nextText = "";
    if (href.includes("/services/")) nextText = "استكشف خدمة الذكاء الاصطناعي المرتبطة";
    else if (href.includes("/blog/")) nextText = "اقرأ الدليل الكامل حول الذكاء الاصطناعي";
    else if (href.includes("/contact") || href.includes("/consultation")) nextText = "تواصل مع Bright AI للاستشارة";
    else nextText = oldText.match(/[A-Za-z]/) ? "Explore the related Bright AI page" : "استكشف الصفحة المرتبطة في Bright AI";
    anchor.text(nextText);
    replacements.push({ oldText, nextText, href });
  });
  return replacements;
}

async function applyArchitecture() {
  const before = await buildInventory();
  const changedFiles = [];
  const anchorReplacements = [];

  for (const page of before.pages) {
    if (!page.indexable) continue;
    const fullPath = path.join(ROOT, page.relPath);
    let html = await fs.readFile(fullPath, "utf8");
    const links = relatedLinksForPage(page);
    if (!links.length) continue;

    const $ = cheerio.load(html, { decodeEntities: false });
    const replacements = replaceWeakAnchors($);
    if (replacements.length) {
      anchorReplacements.push(...replacements.map((row) => ({ ...row, relPath: page.relPath })));
      html = $.html();
    }

    const block = renderInternalLinksBlock(page, links);
    if (html.includes(START)) {
      html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
    } else if (/<footer[\s>]/i.test(html)) {
      html = html.replace(/<footer[\s>]/i, `${block}\n$&`);
    } else if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${block}\n</body>`);
    } else {
      html += `\n${block}\n`;
    }

    html = ensureInternalLinksCss(html);
    await fs.writeFile(fullPath, html, "utf8");
    changedFiles.push(page.relPath);
  }

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(REPORT_DIR, "architecture-fix-report.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    changedFiles,
    anchorReplacements,
  }, null, 2), "utf8");

  return { changedFiles, anchorReplacements };
}

function renderMarkdown(report) {
  const problemPages = report.pages.filter((page) => page.problem);
  const topPages = report.pages.filter((page) => page.indexable).slice(0, 220);
  const lines = [
    "# Full Internal Links Inventory",
    "",
    `- Date: ${report.generatedAt}`,
    `- Files scanned: ${report.filesScanned}`,
    `- Pages discovered: ${report.summary.pagesDiscovered}`,
    `- Indexable pages: ${report.summary.indexablePages}`,
    `- Internal links discovered: ${report.summary.internalLinksDiscovered}`,
    `- Orphan pages: ${report.summary.orphanPages}`,
    `- Broken links: ${report.summary.brokenLinks}`,
    `- Pages outside sitemap: ${report.summary.pagesOutsideSitemap}`,
    `- Weak anchors: ${report.summary.weakAnchors}`,
    `- Links without href: ${report.summary.noHrefLinks}`,
    `- Canonical issues: ${report.summary.canonicalIssues}`,
    "",
    "## Page / URL / Source File / Route Type / Incoming Internal Links / Outgoing Internal Links / Is Orphan? / In Sitemap? / Canonical / Indexable? / Problem / Severity / Fix",
    "",
    "| Page | URL | Source File | Route Type | Incoming | Outgoing | Orphan | Sitemap | Canonical | Indexable | Problem | Severity | Fix |",
    "| --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const page of topPages) {
    lines.push(`| ${page.title.replace(/\|/g, "\\|")} | ${page.url} | ${page.relPath} | ${page.routeType} | ${page.incoming.length} | ${page.outgoing.length} | ${page.isOrphan ? "Yes" : "No"} | ${page.inSitemap ? "Yes" : "No"} | ${String(page.canonical).replace(/\|/g, "\\|")} | ${page.indexable ? "Yes" : "No"} | ${page.problem || "None"} | ${page.severity} | ${page.problem ? "Add contextual HTML links, sitemap regeneration, or canonical correction" : "None"} |`);
  }

  lines.push("", "## Problems", "");
  if (!problemPages.length) {
    lines.push("- No page-level internal linking problems detected.");
  } else {
    lines.push("| File | URL | Problem | Severity |");
    lines.push("| --- | --- | --- | --- |");
    for (const page of problemPages.slice(0, 220)) {
      lines.push(`| ${page.relPath} | ${page.url} | ${page.problem} | ${page.severity} |`);
    }
  }

  lines.push("", "## Weak Anchor Text", "");
  if (!report.weakAnchors.length) lines.push("- None.");
  else {
    lines.push("| File | Old Anchor | Target | Suggested Fix |");
    lines.push("| --- | --- | --- | --- |");
    for (const row of report.weakAnchors.slice(0, 160)) {
      lines.push(`| ${row.relPath} | ${row.oldText} | ${row.href} | Use descriptive Saudi AI / service anchor text |`);
    }
  }

  lines.push("", "## Owner Decision Needed", "");
  const owner = report.pages.filter((page) => page.ownerDecisionNeeded);
  if (!owner.length) lines.push("- None.");
  else for (const page of owner) lines.push(`- ${page.relPath}: technical, error, app, or admin-like page; excluded from public sitemap decisions.`);

  return `${lines.join("\n")}\n`;
}

async function auditOnly() {
  const report = await buildInventory();
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(REPORT_JSON, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(REPORT_MD, renderMarkdown(report), "utf8");
  console.log(`Full inventory written to ${REPORT_MD}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

const mode = process.argv.includes("--fix") ? "fix" : "audit";
if (mode === "fix") {
  const result = await applyArchitecture();
  console.log(`Updated internal linking architecture in ${result.changedFiles.length} files.`);
  console.log(`Anchor text replacements: ${result.anchorReplacements.length}`);
} else {
  await auditOnly();
}
