#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import {
  encodeUrlPath,
  findCounterpartRelPath,
  normalizeRelPath,
  normalizeSiteUrl,
  relPathToCanonical,
} from "./seo-url-map.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";

const HTML_PATTERNS = ["**/*.html", "**/*.HTML"];
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.netlify/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
];

function parseArgs(argv) {
  const args = {
    fix: false,
    report: null,
    json: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--fix") {
      args.fix = true;
      continue;
    }

    if (current === "--report") {
      args.report = argv[i + 1] || null;
      i += 1;
      continue;
    }

    if (current === "--json") {
      args.json = argv[i + 1] || null;
      i += 1;
      continue;
    }
  }

  return args;
}

function stripTrailingSlash(value) {
  if (value === "/") return value;
  return value.replace(/\/+$/, "") || "/";
}

function extractAttribute(tag, attrName) {
  const match = tag.match(new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() || null;
}

function normalizeToSitePath(rawValue, sourceFile) {
  if (!rawValue) return null;
  const value = rawValue.trim();
  if (!value) return null;

  try {
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value);
      return parsed.pathname || "/";
    }
  } catch {
    // Fall through to local-path handling.
  }

  if (value.startsWith("/")) return value;

  const sourceDir = path.posix.dirname(sourceFile.replace(/\\/g, "/"));
  const resolved = path.posix.normalize(path.posix.join("/", sourceDir, value));
  return resolved.startsWith("/") ? resolved : `/${resolved}`;
}

function extractRedirectTargetPath(content, sourceFile) {
  const metaTags = [...content.matchAll(/<meta[^>]*>/gi)].map((match) => match[0]);
  for (const tag of metaTags) {
    if (!/http-equiv\s*=\s*["']refresh["']/i.test(tag)) continue;
    const refreshContent = extractAttribute(tag, "content");
    if (!refreshContent) continue;
    const urlMatch = refreshContent.match(/url\s*=\s*([^;]+)/i);
    if (!urlMatch) continue;
    const candidate = normalizeToSitePath(urlMatch[1], sourceFile);
    if (candidate) return candidate;
  }

  const jsRedirectMatch = content.match(/window\.location\.replace\(\s*["']([^"']+)["']\s*\)/i);
  if (jsRedirectMatch?.[1]) {
    return normalizeToSitePath(jsRedirectMatch[1], sourceFile);
  }

  return null;
}

function resolveExpectedCanonical(content, relPath) {
  const redirectTargetPath = extractRedirectTargetPath(content, relPath);
  if (!redirectTargetPath) {
    return relPathToCanonical(relPath, BASE_URL);
  }

  const normalizedPath = stripTrailingSlash(redirectTargetPath) || "/";
  return `${BASE_URL}${encodeUrlPath(normalizedPath)}`;
}

function parseAttributes(tag) {
  const attrs = {};
  const attrRegex = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attrRegex.exec(tag))) {
    const key = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? "";
    attrs[key] = value;
  }
  return attrs;
}

function hasRelToken(relValue, token) {
  if (!relValue) return false;
  return relValue
    .split(/\s+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(token.toLowerCase());
}

function stripTags(input) {
  return input.replace(/<[^>]*>/g, " ");
}

function normalizeText(input) {
  return input.replace(/\s+/g, " ").trim();
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortenDescription(input, max = 160) {
  const normalized = normalizeText(input);
  if (normalized.length <= max) return normalized;
  const truncated = normalized.slice(0, max);
  const safeCut = truncated.slice(0, truncated.lastIndexOf(" "));
  return `${(safeCut || truncated).trim()}...`;
}

function extractTagContent(html, tagName) {
  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(regex);
  if (!match) return "";
  return normalizeText(stripTags(match[1] || ""));
}

function extractHtmlLang(html) {
  const match = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i);
  return match?.[1]?.trim().toLowerCase() || "";
}

function extractHtmlDir(html) {
  const match = html.match(/<html\b[^>]*\bdir\s*=\s*["']([^"']+)["']/i);
  return match?.[1]?.trim().toLowerCase() || "";
}

function detectLang(html, relPath, titleText, h1Text) {
  const htmlLang = extractHtmlLang(html);
  if (htmlLang.startsWith("ar")) return "ar";
  if (htmlLang.startsWith("en")) return "en";

  if (/-en\.html$/i.test(relPath)) return "en";

  const textProbe = `${titleText} ${h1Text}`;
  if (/[\u0600-\u06FF]/.test(textProbe)) return "ar";

  const htmlDir = extractHtmlDir(html);
  if (htmlDir === "rtl") return "ar";
  if (htmlDir === "ltr") return "en";

  return "ar";
}

function deriveTitle(relPath, h1Text, lang) {
  if (h1Text) {
    return /bright ai/i.test(h1Text) ? h1Text : `${h1Text} | Bright AI`;
  }

  const stem = path.basename(relPath, path.extname(relPath));
  const humanized = normalizeText(decodeSafe(stem).replace(/[-_]+/g, " "));
  const base =
    humanized ||
    (lang === "ar" ? "صفحة Bright AI" : "Bright AI Page");

  return /bright ai/i.test(base) ? base : `${base} | Bright AI`;
}

function deriveDescription(html, titleText, lang) {
  const firstParagraph = extractTagContent(html, "p");
  const base = firstParagraph || titleText || (lang === "ar" ? "حلول Bright AI." : "Bright AI solutions.");

  const normalized = shortenDescription(base);
  if (normalized.length >= 45) return normalized;

  if (lang === "ar") {
    return shortenDescription(`${titleText || "هذه الصفحة"} من Bright AI تقدم محتوى موثوق للسوق السعودي.`);
  }
  return shortenDescription(`${titleText || "This page"} by Bright AI for enterprise use in Saudi Arabia.`);
}

function titleToH1(titleText) {
  const cleaned = normalizeText(titleText.replace(/\s*\|\s*Bright AI\s*$/i, ""));
  return cleaned || "Bright AI";
}

function isFullHtmlDocument(content) {
  return /<html\b/i.test(content) && /<head\b/i.test(content) && /<body\b/i.test(content);
}

function extractLinkTags(html) {
  const tags = [];
  const regex = /<link\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    tags.push({
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      attrs: parseAttributes(match[0]),
    });
  }
  return tags;
}

function extractMetaTags(html) {
  const tags = [];
  const regex = /<meta\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    tags.push({
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      attrs: parseAttributes(match[0]),
    });
  }
  return tags;
}

function replaceSlice(content, start, end, replacement) {
  return `${content.slice(0, start)}${replacement}${content.slice(end)}`;
}

function insertIntoHead(content, tag) {
  const headOpen = content.match(/<head\b[^>]*>/i);
  if (!headOpen || headOpen.index == null) {
    return `${tag}\n${content}`;
  }
  const insertAt = headOpen.index + headOpen[0].length;
  return `${content.slice(0, insertAt)}\n${tag}${content.slice(insertAt)}`;
}

function insertIntoBodyTop(content, tag) {
  const bodyOpen = content.match(/<body\b[^>]*>/i);
  if (!bodyOpen || bodyOpen.index == null) {
    return `${content}\n${tag}`;
  }
  const insertAt = bodyOpen.index + bodyOpen[0].length;
  return `${content.slice(0, insertAt)}\n${tag}${content.slice(insertAt)}`;
}

function buildRequiredHreflang(relPath, lang, lowerPathMap, selfUrlOverride = null) {
  const selfUrl = selfUrlOverride || relPathToCanonical(relPath, BASE_URL);
  const counterpart = findCounterpartRelPath(relPath, lowerPathMap);
  const counterpartUrl = counterpart ? relPathToCanonical(counterpart, BASE_URL) : null;

  if (!selfUrl) return [];

  if (lang === "en") {
    if (counterpartUrl) {
      return [
        { code: "ar-SA", href: counterpartUrl },
        { code: "en-SA", href: selfUrl },
        { code: "x-default", href: counterpartUrl },
      ];
    }
    return [
      { code: "en-SA", href: selfUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  if (counterpartUrl) {
    return [
      { code: "ar-SA", href: selfUrl },
      { code: "en-SA", href: counterpartUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  return [
    { code: "ar-SA", href: selfUrl },
    { code: "x-default", href: selfUrl },
  ];
}

function extractAlternateLinks(html) {
  return extractLinkTags(html)
    .filter((tag) => hasRelToken(tag.attrs.rel, "alternate") && tag.attrs.hreflang)
    .map((tag) => ({
      ...tag,
      hreflang: tag.attrs.hreflang.trim(),
      href: (tag.attrs.href || "").trim(),
    }));
}

function removeLinkTags(content, predicate) {
  const tags = extractLinkTags(content)
    .filter(predicate)
    .sort((a, b) => b.start - a.start);

  let updated = content;
  for (const tag of tags) {
    updated = replaceSlice(updated, tag.start, tag.end, "");
  }
  return updated;
}

function auditFile(content, relPath, lowerPathMap) {
  if (!isFullHtmlDocument(content)) {
    return {
      eligible: false,
      issues: [],
      requiredHreflang: [],
      missing: {
        title: false,
        description: false,
        canonical: false,
        h1: false,
        hreflang: false,
      },
      hreflangProblems: [],
    };
  }

  const titleText = extractTagContent(content, "title");
  const h1Text = extractTagContent(content, "h1");
  const lang = detectLang(content, relPath, titleText, h1Text);
  const expectedCanonical = resolveExpectedCanonical(content, relPath);

  if (!expectedCanonical) {
    return {
      eligible: false,
      issues: [],
      requiredHreflang: [],
      missing: {
        title: false,
        description: false,
        canonical: false,
        h1: false,
        hreflang: false,
      },
      hreflangProblems: [],
    };
  }

  const requiredHreflang = buildRequiredHreflang(relPath, lang, lowerPathMap, expectedCanonical);

  const linkTags = extractLinkTags(content);
  const canonical = linkTags.find((tag) => hasRelToken(tag.attrs.rel, "canonical"));
  const canonicalRaw = (canonical?.attrs.href || "").trim();
  const canonicalNormalized = normalizeSiteUrl(canonicalRaw, BASE_URL);
  const canonicalMismatch = canonicalRaw !== expectedCanonical || canonicalNormalized !== expectedCanonical;
  const metaDescription = extractMetaTags(content).find(
    (tag) => (tag.attrs.name || "").trim().toLowerCase() === "description"
  );

  const alternateLinks = extractAlternateLinks(content);
  const hreflangProblems = [];
  const groupedByCode = new Map();
  for (const link of alternateLinks) {
    const code = link.hreflang.toLowerCase();
    if (!groupedByCode.has(code)) groupedByCode.set(code, []);
    groupedByCode.get(code).push(link);
  }

  for (const expected of requiredHreflang) {
    const bucket = groupedByCode.get(expected.code.toLowerCase()) || [];
    if (bucket.length === 0) {
      hreflangProblems.push(`Missing hreflang ${expected.code}`);
      continue;
    }
    if (bucket.length > 1) {
      hreflangProblems.push(`Duplicate hreflang ${expected.code} (${bucket.length})`);
      continue;
    }
    const hit = bucket[0];
    const hitNormalizedHref = normalizeSiteUrl(hit.href, BASE_URL);
    if (hit.href !== expected.href || hitNormalizedHref !== expected.href) {
      hreflangProblems.push(
        `hreflang ${expected.code} points to '${hit.href || "(empty)"}' instead of '${expected.href}'`
      );
    }
  }

  const expectedCodes = new Set(requiredHreflang.map((item) => item.code.toLowerCase()));
  for (const code of groupedByCode.keys()) {
    if (!expectedCodes.has(code)) {
      hreflangProblems.push(`Unexpected hreflang ${code}`);
    }
  }

  const missing = {
    title: !titleText,
    description: !metaDescription || !(metaDescription.attrs.content || "").trim(),
    canonical: !canonicalRaw || canonicalMismatch,
    h1: !h1Text,
    hreflang: hreflangProblems.length > 0,
  };

  const issues = [];
  if (missing.title) issues.push("Missing title");
  if (missing.description) issues.push("Missing meta description");
  if (missing.canonical) {
    issues.push(
      !canonicalRaw
        ? "Missing canonical"
        : `Canonical mismatch: '${canonicalRaw}' should be '${expectedCanonical}'`
    );
  }
  if (missing.h1) issues.push("Missing H1");
  if (missing.hreflang) issues.push(...hreflangProblems);

  return {
    eligible: true,
    lang,
    titleText,
    h1Text,
    requiredHreflang,
    missing,
    issues,
    hreflangProblems,
  };
}

function applyFixes(content, relPath, lowerPathMap) {
  const initialAudit = auditFile(content, relPath, lowerPathMap);
  if (!initialAudit.eligible) {
    return { content, changed: false, actions: [] };
  }

  let updated = content;
  const actions = [];

  const titleText = extractTagContent(updated, "title");
  const existingH1 = extractTagContent(updated, "h1");
  const lang = detectLang(updated, relPath, titleText, existingH1);
  const fallbackTitle = deriveTitle(relPath, existingH1, lang);
  const expectedCanonical = resolveExpectedCanonical(updated, relPath);

  if (initialAudit.missing.title) {
    const titleMatch = updated.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const titleTag = `<title>${escapeHtml(fallbackTitle)}</title>`;
    if (titleMatch && titleMatch.index != null) {
      updated = replaceSlice(
        updated,
        titleMatch.index,
        titleMatch.index + titleMatch[0].length,
        titleTag
      );
    } else {
      updated = insertIntoHead(updated, titleTag);
    }
    actions.push("title");
  }

  const finalTitle = extractTagContent(updated, "title") || fallbackTitle;

  if (initialAudit.missing.description) {
    const descriptionText = deriveDescription(updated, finalTitle, lang);
    const descriptionTag = `<meta name="description" content="${escapeHtml(descriptionText)}" />`;
    const metaTags = extractMetaTags(updated);
    const current = metaTags.find(
      (tag) => (tag.attrs.name || "").trim().toLowerCase() === "description"
    );
    if (current) {
      updated = replaceSlice(updated, current.start, current.end, descriptionTag);
    } else {
      updated = insertIntoHead(updated, descriptionTag);
    }
    actions.push("description");
  }

  if (initialAudit.missing.canonical) {
    const canonicalTag = `<link rel="canonical" href="${expectedCanonical}" />`;
    updated = removeLinkTags(updated, (tag) => hasRelToken(tag.attrs.rel, "canonical"));
    updated = insertIntoHead(updated, canonicalTag);
    actions.push("canonical");
  }

  if (initialAudit.missing.h1) {
    const h1Text = titleToH1(finalTitle);
    const hiddenH1 =
      `<h1 data-seo-auto="true" style="position:absolute;left:-9999px;` +
      `top:auto;width:1px;height:1px;overflow:hidden;">${escapeHtml(h1Text)}</h1>`;
    const currentH1 = updated.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (currentH1 && currentH1.index != null) {
      updated = replaceSlice(
        updated,
        currentH1.index,
        currentH1.index + currentH1[0].length,
        `<h1>${escapeHtml(h1Text)}</h1>`
      );
    } else {
      updated = insertIntoBodyTop(updated, hiddenH1);
    }
    actions.push("h1");
  }

  if (initialAudit.missing.hreflang) {
    const required = buildRequiredHreflang(relPath, lang, lowerPathMap, expectedCanonical);
    updated = removeLinkTags(
      updated,
      (tag) => hasRelToken(tag.attrs.rel, "alternate") && Boolean(tag.attrs.hreflang)
    );
    for (const expected of required) {
      const hreflangTag = `<link rel="alternate" hreflang="${expected.code}" href="${expected.href}" />`;
      updated = insertIntoHead(updated, hreflangTag);
    }
    actions.push("hreflang");
  }

  return {
    content: updated,
    changed: updated !== content,
    actions,
  };
}

function summarizeAudits(audits) {
  const eligible = audits.filter((item) => item.audit.eligible);
  const skipped = audits.filter((item) => !item.audit.eligible).map((item) => item.file);
  const affected = eligible.filter((item) => item.audit.issues.length > 0);

  const missingCounts = {
    title: 0,
    description: 0,
    canonical: 0,
    h1: 0,
    hreflang: 0,
  };

  for (const item of eligible) {
    for (const key of Object.keys(missingCounts)) {
      if (item.audit.missing[key]) {
        missingCounts[key] += 1;
      }
    }
  }

  return {
    scanned: audits.length,
    eligible: eligible.length,
    skipped: skipped.length,
    skippedFiles: skipped,
    affected: affected.length,
    missingCounts,
    failingFiles: affected.map((item) => ({
      file: item.file,
      issues: item.audit.issues,
    })),
  };
}

function renderSummary(title, summary) {
  const lines = [];
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(`- ملفات HTML المفحوصة: ${summary.scanned}`);
  lines.push(`- صفحات HTML القابلة للتدقيق: ${summary.eligible}`);
  lines.push(`- ملفات مستثناة (ليست صفحة HTML كاملة): ${summary.skipped}`);
  lines.push(`- صفحات تحتاج معالجة: ${summary.affected}`);
  lines.push(`- نقص title: ${summary.missingCounts.title}`);
  lines.push(`- نقص meta description: ${summary.missingCounts.description}`);
  lines.push(`- نقص canonical: ${summary.missingCounts.canonical}`);
  lines.push(`- نقص H1: ${summary.missingCounts.h1}`);
  lines.push(`- نقص/خلل hreflang: ${summary.missingCounts.hreflang}`);
  lines.push("");

  if (summary.failingFiles.length > 0) {
    lines.push("### صفحات بها مشاكل");
    lines.push("");
    for (const item of summary.failingFiles) {
      lines.push(`- \`${item.file}\`: ${item.issues.join(" | ")}`);
    }
    lines.push("");
  }

  if (summary.skippedFiles.length > 0) {
    lines.push("### ملفات مستثناة");
    lines.push("");
    for (const file of summary.skippedFiles) {
      lines.push(`- \`${file}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderCompareReport(beforeSummary, afterSummary, fixedFiles) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push("# HTML SEO Repair Report");
  lines.push(`**Date:** ${today}`);
  lines.push("");
  lines.push("## Before vs After");
  lines.push("");
  lines.push("| Metric | Before | After |");
  lines.push("|---|---:|---:|");
  lines.push(`| Scanned HTML files | ${beforeSummary.scanned} | ${afterSummary.scanned} |`);
  lines.push(`| Eligible pages | ${beforeSummary.eligible} | ${afterSummary.eligible} |`);
  lines.push(`| Pages with issues | ${beforeSummary.affected} | ${afterSummary.affected} |`);
  lines.push(`| Missing title | ${beforeSummary.missingCounts.title} | ${afterSummary.missingCounts.title} |`);
  lines.push(
    `| Missing meta description | ${beforeSummary.missingCounts.description} | ${afterSummary.missingCounts.description} |`
  );
  lines.push(
    `| Missing canonical | ${beforeSummary.missingCounts.canonical} | ${afterSummary.missingCounts.canonical} |`
  );
  lines.push(`| Missing H1 | ${beforeSummary.missingCounts.h1} | ${afterSummary.missingCounts.h1} |`);
  lines.push(
    `| Missing/mismatched hreflang | ${beforeSummary.missingCounts.hreflang} | ${afterSummary.missingCounts.hreflang} |`
  );
  lines.push("");
  lines.push(`## Files Updated (${fixedFiles.length})`);
  lines.push("");
  if (fixedFiles.length === 0) {
    lines.push("- لا يوجد تعديلات مطلوبة.");
  } else {
    for (const item of fixedFiles) {
      lines.push(`- \`${item.file}\` (${item.actions.join(", ")})`);
    }
  }
  lines.push("");
  lines.push(renderSummary("Before Audit Details", beforeSummary));
  lines.push(renderSummary("After Audit Details", afterSummary));
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const htmlFiles = (
    await glob(HTML_PATTERNS, {
      cwd: ROOT,
      nodir: true,
      ignore: IGNORE_PATTERNS,
    })
  )
    .map(normalizeRelPath)
    .sort((a, b) => a.localeCompare(b, "en"));

  const lowerPathMap = new Map(htmlFiles.map((file) => [file.toLowerCase(), file]));

  const beforeAudits = [];
  for (const relPath of htmlFiles) {
    const content = await fs.readFile(path.join(ROOT, relPath), "utf8");
    beforeAudits.push({
      file: relPath,
      audit: auditFile(content, relPath, lowerPathMap),
    });
  }
  const beforeSummary = summarizeAudits(beforeAudits);

  const fixedFiles = [];
  if (args.fix) {
    for (const relPath of htmlFiles) {
      const fullPath = path.join(ROOT, relPath);
      const original = await fs.readFile(fullPath, "utf8");
      if (!isFullHtmlDocument(original)) continue;
      const result = applyFixes(original, relPath, lowerPathMap);
      if (!result.changed) continue;
      await fs.writeFile(fullPath, result.content, "utf8");
      fixedFiles.push({
        file: relPath,
        actions: result.actions,
      });
    }
  }

  const afterAudits = [];
  for (const relPath of htmlFiles) {
    const content = await fs.readFile(path.join(ROOT, relPath), "utf8");
    afterAudits.push({
      file: relPath,
      audit: auditFile(content, relPath, lowerPathMap),
    });
  }
  const afterSummary = summarizeAudits(afterAudits);

  console.log("HTML SEO GOVERNOR");
  console.log(`- Scanned HTML files: ${afterSummary.scanned}`);
  console.log(`- Eligible pages: ${afterSummary.eligible}`);
  console.log(`- Skipped files: ${afterSummary.skipped}`);
  console.log(`- Pages with issues (before): ${beforeSummary.affected}`);
  console.log(`- Pages with issues (after): ${afterSummary.affected}`);
  console.log(`- Files updated: ${fixedFiles.length}`);
  console.log(`- Missing title (after): ${afterSummary.missingCounts.title}`);
  console.log(`- Missing description (after): ${afterSummary.missingCounts.description}`);
  console.log(`- Missing canonical (after): ${afterSummary.missingCounts.canonical}`);
  console.log(`- Missing H1 (after): ${afterSummary.missingCounts.h1}`);
  console.log(`- Missing/mismatched hreflang (after): ${afterSummary.missingCounts.hreflang}`);

  const compareReport = renderCompareReport(beforeSummary, afterSummary, fixedFiles);
  if (args.report) {
    const reportPath = path.join(ROOT, args.report);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, compareReport, "utf8");
    console.log(`- Markdown report: ${args.report}`);
  }

  if (args.json) {
    const jsonPath = path.join(ROOT, args.json);
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(
      jsonPath,
      JSON.stringify(
        {
          before: beforeSummary,
          after: afterSummary,
          fixedFiles,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`- JSON report: ${args.json}`);
  }

  if (afterSummary.affected > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
