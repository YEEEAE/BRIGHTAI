import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const IMPORTANT_PAGES = [
  "index.html",
  "services/index.html",
  "ai-agent/index.html",
  "smart-automation/index.html",
  "data-analysis/index.html",
  "ai-bots/index.html",
  "ai-workflows/index.html",
  "smart-medical-archive/index.html",
  "tools/index.html",
  "tenders/index.html",
  "tenders/landing.html",
  "tenders/compare.html",
  "consultation/index.html",
  "contact/index.html",
];

const IGNORE_DIRS = new Set([".git", "node_modules", "venv", "tmp", "reports", "render-public"]);
const issues = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function addIssue(file, code, message) {
  issues.push({ file, code, message });
}

function addWarning(file, code, message) {
  warnings.push({ file, code, message });
}

function isPublicHtml(relPath) {
  return !relPath.startsWith("frontend/pages/") && !relPath.startsWith("mais-OBM/");
}

function isTrackableContactHref(href) {
  return /^tel:/i.test(href) || /^mailto:/i.test(href) || /whatsapp|wa\.me|api\.whatsapp/i.test(href);
}

for (const file of walk(ROOT)) {
  const relPath = rel(file);
  if (!isPublicHtml(relPath)) continue;
  const html = fs.readFileSync(file, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const gtagScripts = $("script[src*='googletagmanager.com/gtag/js']").length;
  const gtmScripts = $("script[src*='googletagmanager.com/gtm.js'], iframe[src*='googletagmanager.com/ns.html']").length;
  const analyticsEvents = $("script[src='/frontend/js/analytics-events.js']").length;

  if (gtagScripts + gtmScripts === 0) addIssue(relPath, "MISSING_ANALYTICS", "لا يوجد GA4/GTM script.");
  if (gtagScripts > 1 || gtmScripts > 1) addIssue(relPath, "DUPLICATE_ANALYTICS", "يوجد أكثر من تحميل analytics.");
  if (analyticsEvents !== 1) addIssue(relPath, "MISSING_EVENTS_LAYER", "ملف analytics-events.js غير مربوط مرة واحدة.");

  $("a,button").each((_, el) => {
    const node = $(el);
    const href = node.attr("href") || "";
    const text = node.text().replace(/\s+/g, " ").trim();
    const looksCta = /btn|button|cta|primary|secondary|nav-cta/i.test(node.attr("class") || "") || /استشارة|تواصل|ديمو|عرض|جرّب|ابدأ|اشترك|مبيعات|واتساب|تحميل|تسعير/i.test(text);
    if (looksCta && !node.attr("data-analytics-event")) addWarning(relPath, "CTA_WITHOUT_TRACKING", `CTA بدون data-analytics-event: ${text.slice(0, 80)}`);
    if (isTrackableContactHref(href) && !node.attr("data-analytics-event")) addWarning(relPath, "CONTACT_LINK_WITHOUT_TRACKING", `رابط تواصل بدون تتبع: ${href}`);
  });

  $("form").each((_, el) => {
    const node = $(el);
    if (!node.attr("data-analytics-event") && !node.attr("data-analytics-submit-event")) {
      addWarning(relPath, "FORM_WITHOUT_TRACKING", `form بدون tracking: ${node.attr("id") || node.attr("name") || "unnamed"}`);
    }
  });

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (/^https?:\/\//i.test(href) || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (href.includes("/frontend/pages/")) addIssue(relPath, "FRONTEND_PAGES_LINK", href);
    if (/\.html(?:$|[?#])/.test(href)) addIssue(relPath, "HTML_PUBLIC_LINK", href);
    if (/^\/[^?#.]+[^/]$/.test(href) && !href.startsWith("/api/") && !href.startsWith("/ws/")) {
      addIssue(relPath, "MISSING_TRAILING_SLASH", href);
    }
  });
}

for (const important of IMPORTANT_PAGES) {
  const file = path.join(ROOT, important);
  if (!fs.existsSync(file)) {
    addIssue(important, "IMPORTANT_PAGE_MISSING", "صفحة مهمة غير موجودة على القرص.");
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const primaryCta = $("[data-analytics-event='generate_lead'], [data-analytics-event='request_demo'], [data-analytics-event='consultation_request'], [data-analytics-event='tender_demo_start'], [data-analytics-event='whatsapp_click']").length;
  if (primaryCta === 0) addIssue(important, "IMPORTANT_PAGE_WITHOUT_PRIMARY_CTA", "صفحة مال بدون CTA رئيسي متتبع.");
}

if (fs.existsSync(path.join(ROOT, "404.html"))) {
  const html = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
  if (!/page_not_found/.test(html) && !/data-page-type=["']404/.test(html)) {
    addIssue("404.html", "MISSING_404_EVENT", "صفحة 404 لا تشير إلى page_not_found.");
  }
}

if (issues.length) {
  console.log(`Analytics QA failed: ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(`${issue.file} | ${issue.code} | ${issue.message}`);
  }
  process.exit(1);
}

if (warnings.length) {
  console.log(`Analytics QA passed with ${warnings.length} warning(s).`);
  for (const warning of warnings.slice(0, 120)) {
    console.log(`${warning.file} | ${warning.code} | ${warning.message}`);
  }
  if (warnings.length > 120) console.log(`... ${warnings.length - 120} more warning(s) omitted.`);
} else {
  console.log("Analytics QA passed.");
}
