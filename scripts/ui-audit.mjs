#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "reports", "ui-audit");
const SITE_ORIGIN = "https://brightai.site";

const IGNORED_DIRS = new Set([
  ".git",
  ".render-static",
  ".venv",
  "coverage",
  "dist",
  "node_modules",
  "reports",
  "tmp"
]);

const TEXT_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".svg"
]);

const UI_EXTENSIONS = new Set([".html", ".css", ".js", ".mjs", ".cjs"]);
const ASSET_EXTENSIONS = new Set([
  ".avif",
  ".css",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mp4",
  ".png",
  ".svg",
  ".ttf",
  ".webmanifest",
  ".webp",
  ".woff",
  ".woff2"
]);

const SKIP_URL_PREFIXES = [
  "#",
  "about:",
  "blob:",
  "data:",
  "geo:",
  "javascript:",
  "mailto:",
  "sms:",
  "tel:",
  "whatsapp:",
  "ws:",
  "wss:"
];

const riskyCssRules = [
  [/display\s*:\s*none\b/i, "display:none may hide visible UI"],
  [/visibility\s*:\s*hidden\b/i, "visibility:hidden may hide visible UI"],
  [/opacity\s*:\s*0\b/i, "opacity:0 may hide visible UI"],
  [/pointer-events\s*:\s*none\b/i, "pointer-events:none can block interaction"],
  [/overflow(?:-[xy])?\s*:\s*hidden\b/i, "overflow hidden can clip text or sections"],
  [/\b(?:width|min-width)\s*:\s*(?:[4-9]\d{2,}|\d{4,})px\b/i, "fixed wide width can cause horizontal scroll"],
  [/\b(?:height|max-height)\s*:\s*(?:[1-9]\d*)px\b/i, "fixed height can clip Arabic text"],
  [/\bposition\s*:\s*(?:absolute|fixed)\b/i, "absolute/fixed positioning can overlap UI"],
  [/\b(?:left|right)\s*:\s*[^;]+;/i, "physical left/right should be reviewed for RTL"],
  [/\b(?:margin|padding|border)-(?:left|right)\s*:/i, "physical side spacing should use logical properties in RTL"],
  [/\boutline\s*:\s*none\b/i, "removed outline harms keyboard focus"]
];

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function rel(filePath) {
  return toPosix(path.relative(ROOT, filePath));
}

function walk(dir, bucket = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, bucket);
    else if (entry.isFile()) bucket.push(full);
  }
  return bucket;
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function isExternal(raw) {
  if (!raw) return true;
  const trimmed = raw.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  if (SKIP_URL_PREFIXES.some((prefix) => lower.startsWith(prefix))) return true;
  if (trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed, SITE_ORIGIN);
    return parsed.origin !== SITE_ORIGIN;
  } catch {
    return false;
  }
}

function stripUrl(raw) {
  return raw.split("#")[0].split("?")[0].trim();
}

function pageUrlForHtml(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return `/${relPath.slice(0, -"index.html".length)}`;
  return `/${relPath}`;
}

function resolveLocalReference(raw, sourceRel) {
  if (!raw || isExternal(raw)) return null;
  const cleaned = stripUrl(raw);
  if (!cleaned) return null;
  const base = new URL(pageUrlForHtml(sourceRel), SITE_ORIGIN);
  const resolved = new URL(cleaned, base);
  if (resolved.origin !== SITE_ORIGIN) return null;
  return decodeURIComponent(resolved.pathname).replace(/^\/+/, "");
}

function candidatePaths(sitePath) {
  const normalized = sitePath.replace(/^\/+/, "");
  const candidates = new Set([normalized]);
  if (!path.posix.extname(normalized)) {
    candidates.add(path.posix.join(normalized, "index.html"));
    candidates.add(`${normalized}.html`);
  }
  if (normalized.endsWith("/")) {
    candidates.add(path.posix.join(normalized, "index.html"));
  }
  if (!normalized) candidates.add("index.html");
  return [...candidates].filter(Boolean);
}

function existsCaseSensitive(candidate) {
  const absolute = path.join(ROOT, candidate);
  if (!fs.existsSync(absolute)) return false;
  const parts = candidate.split("/");
  let current = ROOT;
  for (const part of parts) {
    const names = fs.readdirSync(current);
    if (!names.includes(part)) return false;
    current = path.join(current, part);
  }
  return true;
}

function localTargetExists(sitePath) {
  return candidatePaths(sitePath).some(existsCaseSensitive);
}

function getAttrRefs($, relPath) {
  const refs = [];
  const add = (kind, selector, attr) => {
    $(selector).each((_, el) => {
      const value = ($(el).attr(attr) || "").trim();
      if (value) refs.push({ kind, attr, value, file: relPath });
    });
  };
  add("stylesheet", "link[rel~='stylesheet'][href]", "href");
  add("script", "script[src]", "src");
  add("image", "img[src]", "src");
  add("source", "source[src]", "src");
  add("video", "video[src]", "src");
  add("manifest", "link[rel='manifest'][href]", "href");
  add("icon", "link[rel*='icon'][href]", "href");
  return refs;
}

function lineFor(content, offset) {
  return content.slice(0, offset).split("\n").length;
}

function extractImports(content) {
  const imports = [];
  const patterns = [
    /import\s+(?:[^'"]+?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /export\s+[^'"]+?\s+from\s+["']([^"']+)["']/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) imports.push(match[1]);
  }
  return imports;
}

function resolveImport(sourceFile, specifier) {
  if (specifier.startsWith("node:")) return true;
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) return true;
  const base = specifier.startsWith("/")
    ? path.join(ROOT, specifier)
    : path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}.json`,
    path.join(base, "index.js"),
    path.join(base, "index.mjs")
  ];
  return candidates.some(fs.existsSync);
}

function severityFor(issue) {
  if (issue.type === "missing-reference" || issue.type === "missing-import") return "high";
  if (issue.type === "a11y" || issue.type === "rtl") return "medium";
  return "low";
}

function addIssue(issues, issue) {
  issues.push({ severity: severityFor(issue), ...issue });
}

function auditHtml(filePath, content, fileSet, issues, inventory, pages) {
  const relPath = rel(filePath);
  const $ = cheerio.load(content, { decodeEntities: false });
  const html = $("html").first();
  const lang = html.attr("lang") || "";
  const dir = html.attr("dir") || "";
  const title = ($("title").first().text() || "").trim();
  const route = pageUrlForHtml(relPath);
  const htmlLang = lang.toLowerCase();
  const isEnglish = htmlLang.startsWith("en") || relPath.startsWith("en/") || /(?:^|-)en(?:$|-)/i.test(relPath);
  const isArabicLikely = !isEnglish && /[\u0600-\u06FF]/.test($("body").text());

  pages.push({
    page: title || path.basename(path.dirname(relPath)) || "Home",
    route,
    file: relPath,
    layout: "Static HTML",
    components: Array.from(new Set($("[class]").toArray().flatMap((el) => ($(el).attr("class") || "").split(/\s+/)).filter(Boolean))).slice(0, 40),
    css: $("link[rel='stylesheet']").toArray().map((el) => $(el).attr("href")).filter(Boolean),
    assets: getAttrRefs($, relPath).filter((ref) => ["image", "source", "video", "icon"].includes(ref.kind)).map((ref) => ref.value),
    scripts: $("script[src]").toArray().map((el) => $(el).attr("src")).filter(Boolean),
    dataApi: $("form[action], [data-api], [data-endpoint]").length ? "form/data endpoint" : "",
    responsiveRisk: content.includes("min-width") || content.includes("overflow") ? "medium" : "low",
    rtlRisk: isArabicLikely && (dir !== "rtl" || !/^ar/i.test(lang)) ? "high" : "low",
    visualRisk: $("img").length && $("img:not([width]):not([height])").length ? "medium" : "low",
    uxRisk: $("a[href], button").length === 0 ? "medium" : "low"
  });

  inventory.push({
    file: relPath,
    type: "HTML page",
    purpose: title || route,
    relatedPages: route,
    uiRelevance: "high",
    uxRelevance: "high",
    cssRelevance: $("link[rel='stylesheet']").length ? "high" : "medium",
    runtimeRelevance: $("script[src]").length ? "high" : "low",
    risk: isArabicLikely && dir !== "rtl" ? "high" : "medium",
    needsFix: false,
    notes: ""
  });

  if (isArabicLikely && dir !== "rtl") {
    addIssue(issues, {
      type: "rtl",
      file: relPath,
      selector: "html",
      problem: "Arabic page is missing dir=\"rtl\"",
      impact: "Arabic layout and text flow can render LTR.",
      fix: "Set html dir=\"rtl\"."
    });
  }
  if (isArabicLikely && !/^ar/i.test(lang)) {
    addIssue(issues, {
      type: "rtl",
      file: relPath,
      selector: "html",
      problem: "Arabic page is missing Arabic lang value",
      impact: "Screen readers, hyphenation, and browser font behavior may be wrong.",
      fix: "Set html lang=\"ar-SA\"."
    });
  }

  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    const alt = $(el).attr("alt");
    if (alt === undefined) {
      addIssue(issues, {
        type: "a11y",
        file: relPath,
        selector: `img[src="${src}"]`,
        problem: "Image is missing alt attribute",
        impact: "Screen readers do not get a text alternative.",
        fix: "Add alt or alt=\"\" for decorative images."
      });
    }
  });

  $("button").each((_, el) => {
    const label = [$(el).text(), $(el).attr("aria-label"), $(el).attr("title")]
      .map((value) => String(value || "").replace(/\s+/g, " ").trim())
      .find(Boolean) || "";
    if (!label) {
      addIssue(issues, {
        type: "a11y",
        file: relPath,
        selector: "button",
        problem: "Button has no accessible label",
        impact: "Keyboard and screen reader users cannot identify the action.",
        fix: "Add visible text or aria-label."
      });
    }
  });

  $("a").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    const text = [$(el).text(), $(el).attr("aria-label"), $(el).attr("title")]
      .map((value) => String(value || "").replace(/\s+/g, " ").trim())
      .find(Boolean) || "";
    if (!href) {
      addIssue(issues, {
        type: "a11y",
        file: relPath,
        selector: "a",
        problem: "Anchor is missing href",
        impact: "Link appears interactive but cannot navigate.",
        fix: "Use a button for actions or add a valid href."
      });
    }
    if (href && !text && !$(el).find("img[alt], svg[aria-label], iconify-icon[aria-label]").length) {
      addIssue(issues, {
        type: "a11y",
        file: relPath,
        selector: `a[href="${href}"]`,
        problem: "Link has no accessible name",
        impact: "Screen readers announce an unlabeled link.",
        fix: "Add visible text or aria-label."
      });
    }
  });

  for (const ref of getAttrRefs($, relPath)) {
    const target = resolveLocalReference(ref.value, relPath);
    if (!target) continue;
    const ext = path.extname(target).toLowerCase();
    const shouldExist = ASSET_EXTENSIONS.has(ext) || !ext;
    if (shouldExist && !localTargetExists(target)) {
      addIssue(issues, {
        type: "missing-reference",
        file: relPath,
        selector: `${ref.kind}[${ref.attr}]`,
        problem: `Missing local ${ref.kind}: ${ref.value}`,
        impact: "A page asset or route will 404 in production.",
        fix: "Correct the path, add the asset, or remove the reference."
      });
    }
  }

  const ids = new Map();
  $("[id]").each((_, el) => {
    const id = $(el).attr("id");
    if (!id) return;
    ids.set(id, (ids.get(id) || 0) + 1);
  });
  for (const [id, count] of ids.entries()) {
    if (count > 1) {
      addIssue(issues, {
        type: "a11y",
        file: relPath,
        selector: `#${id}`,
        problem: `Duplicate id used ${count} times`,
        impact: "Fragment links, labels, and scripts can target the wrong element.",
        fix: "Make ids unique."
      });
    }
  }
}

function auditCss(filePath, content, issues, inventory) {
  const relPath = rel(filePath);
  inventory.push({
    file: relPath,
    type: "CSS",
    purpose: "Stylesheet",
    relatedPages: "linked pages",
    uiRelevance: "high",
    uxRelevance: "medium",
    cssRelevance: "high",
    runtimeRelevance: "low",
    risk: relPath.endsWith(".min.css") ? "medium" : "high",
    needsFix: false,
    notes: ""
  });
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const [pattern, problem] of riskyCssRules) {
      if (pattern.test(line)) {
        addIssue(issues, {
          type: "css-risk",
          file: relPath,
          line: index + 1,
          selector: line.slice(0, 180),
          problem,
          impact: "Needs visual review because this rule can break responsive, clipping, RTL, or focus.",
          fix: "Replace with responsive/logical CSS or scope the rule to deliberate hidden states."
        });
      }
    }
  }
}

function auditJs(filePath, content, issues, inventory) {
  const relPath = rel(filePath);
  inventory.push({
    file: relPath,
    type: "JavaScript",
    purpose: "UI/runtime script",
    relatedPages: "script consumers",
    uiRelevance: "medium",
    uxRelevance: "medium",
    cssRelevance: "low",
    runtimeRelevance: "high",
    risk: relPath.endsWith(".min.js") ? "medium" : "high",
    needsFix: false,
    notes: ""
  });

  for (const specifier of extractImports(content)) {
    if (!resolveImport(filePath, specifier)) {
      addIssue(issues, {
        type: "missing-import",
        file: relPath,
        selector: specifier,
        problem: `Missing JS import target: ${specifier}`,
        impact: "The module can fail at runtime or during build.",
        fix: "Correct import path or add the missing module."
      });
    }
  }

  const windowAccess = /\b(?:window|document|localStorage|sessionStorage)\b/.test(content);
  if (windowAccess && /\bexport\b|\bimport\b/.test(content) && !/typeof\s+(?:window|document)\s*!==?\s*["']undefined["']/.test(content)) {
    addIssue(issues, {
      type: "runtime-risk",
      file: relPath,
      selector: "browser globals",
      problem: "Module uses browser globals without an SSR/browser guard",
      impact: "This can break if reused by SSR or prerendering tools.",
      fix: "Guard browser-only code or keep script browser-only."
    });
  }
}

function markdownTable(headers, rows, limit = 80) {
  const safeRows = rows.slice(0, limit);
  const header = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = safeRows.map((row) => `| ${headers.map((key) => String(row[key] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 220)).join(" | ")} |`);
  const more = rows.length > limit ? [`\nعرض أول ${limit} من ${rows.length} سجل. راجع JSON للتفاصيل الكاملة.`] : [];
  return [header, sep, ...body, ...more].join("\n");
}

const files = walk(ROOT).filter((file) => UI_EXTENSIONS.has(path.extname(file).toLowerCase()));
const fileSet = new Set(walk(ROOT).map((file) => rel(file)));
const issues = [];
const inventory = [];
const pages = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) continue;
  const content = read(file);
  if (ext === ".html") auditHtml(file, content, fileSet, issues, inventory, pages);
  else if (ext === ".css") auditCss(file, content, issues, inventory);
  else if ([".js", ".mjs", ".cjs"].includes(ext)) auditJs(file, content, issues, inventory);
}

const summary = {
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  htmlPages: pages.length,
  issues: issues.length,
  high: issues.filter((issue) => issue.severity === "high").length,
  medium: issues.filter((issue) => issue.severity === "medium").length,
  low: issues.filter((issue) => issue.severity === "low").length
};

ensureOutDir();
fs.writeFileSync(path.join(OUT_DIR, "ui-audit.json"), JSON.stringify({ summary, inventory, pages, issues }, null, 2));

const issueRows = issues.map((issue) => ({
  File: issue.file,
  Type: issue.type,
  Selector: issue.selector || "",
  Problem: issue.problem,
  Impact: issue.impact,
  Severity: issue.severity,
  Fix: issue.fix
}));

const pageRows = pages.map((page) => ({
  Page: page.page,
  Route: page.route,
  "Main File": page.file,
  Components: page.components.slice(0, 8).join(", "),
  CSS: page.css.join(", "),
  Assets: page.assets.slice(0, 6).join(", "),
  "Data/API": page.dataApi,
  "Responsive Risk": page.responsiveRisk,
  "RTL Risk": page.rtlRisk,
  "UX Risk": page.uxRisk
}));

const inventoryRows = inventory.map((item) => ({
  File: item.file,
  Type: item.type,
  Purpose: item.purpose,
  "Related Pages": item.relatedPages,
  Risk: item.risk,
  "Needs Fix": item.needsFix ? "yes" : "review",
  Notes: item.notes
}));

const markdown = [
  "# BRIGHTAI UI Audit",
  "",
  `Generated: ${summary.generatedAt}`,
  "",
  "## Summary",
  "",
  markdownTable(["filesScanned", "htmlPages", "issues", "high", "medium", "low"], [summary], 1),
  "",
  "## Issues",
  "",
  markdownTable(["File", "Type", "Selector", "Problem", "Impact", "Severity", "Fix"], issueRows, 120),
  "",
  "## Page Inventory",
  "",
  markdownTable(["Page", "Route", "Main File", "Components", "CSS", "Assets", "Data/API", "Responsive Risk", "RTL Risk", "UX Risk"], pageRows, 160),
  "",
  "## UI File Inventory",
  "",
  markdownTable(["File", "Type", "Purpose", "Related Pages", "Risk", "Needs Fix", "Notes"], inventoryRows, 160),
  ""
].join("\n");

fs.writeFileSync(path.join(OUT_DIR, "ui-audit.md"), markdown);

console.log(`UI files scanned: ${summary.filesScanned}`);
console.log(`HTML pages: ${summary.htmlPages}`);
console.log(`Issues: ${summary.issues} high=${summary.high} medium=${summary.medium} low=${summary.low}`);
console.log(`Report: ${path.relative(ROOT, path.join(OUT_DIR, "ui-audit.md"))}`);

if (summary.high > 0) {
  process.exitCode = 1;
}
