#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildPublicUrlRegistry,
  findCounterpartRelPath,
  relPathToCanonical,
  normalizeRelPath,
} from "./seo-url-map.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";

const explicitTitles = new Map([
  ["docs.html", ["مركز وثائق BrightAI للشركات السعودية", "أدلة BrightAI للخدمات والتكاملات والحوكمة، مع روابط مباشرة للوثائق القانونية والدعم وواجهات API والصفحات الإنجليزية."]],
  ["en/docs/index.html", ["BrightAI Documentation for Saudi Teams", "BrightAI documentation for Saudi enterprise teams, including services, API references, governance pages, and English support resources."]],
  ["docs/privacy-policy-en/index.html", ["BrightAI Privacy Policy for Saudi Users", "Read how BrightAI handles data, cookies, inquiries, and service communication for users and organizations in Saudi Arabia."]],
]);

const docsLabels = {
  "ai-agent": ["دليل وكلاء الذكاء الاصطناعي للشركات السعودية", "AI Agents for Saudi Enterprises"],
  "ai-bots": ["دليل الشات بوت العربي للشركات", "Arabic AI Chatbots for Saudi Teams"],
  "consultation": ["دليل استشارات الذكاء الاصطناعي في السعودية", "AI Consulting for Saudi Enterprises"],
  "contact": ["دليل التواصل والدعم في BrightAI", "BrightAI Contact and Support"],
  "data-analysis": ["دليل تحليل البيانات للشركات السعودية", "Data Analysis for Saudi Teams"],
  "faq": ["الأسئلة الشائعة عن BrightAI", "BrightAI FAQ"],
  "openapi": ["مرجع OpenAPI لمطوري BrightAI", "BrightAI OpenAPI Reference"],
  "services-overview": ["دليل خدمات BrightAI للشركات", "BrightAI Services Overview"],
  "smart-automation": ["دليل أتمتة الأعمال بالذكاء الاصطناعي", "AI Business Automation Guide"],
  "solutions-bi": ["دليل ذكاء الأعمال ولوحات البيانات", "Business Intelligence Documentation"],
  "solutions-crm": ["دليل CRM الذكي وخدمة العملاء", "CRM and Customer Intelligence Documentation"],
  "solutions-finance": ["دليل حلول الذكاء الاصطناعي للقطاع المالي", "Finance AI Solutions Documentation"],
  "solutions-healthcare": ["دليل حلول الذكاء الاصطناعي للرعاية الصحية", "Healthcare AI Solutions Documentation"],
  "solutions-hr": ["دليل أتمتة الموارد البشرية والتوظيف", "HR Automation Documentation"],
  "solutions-interview": ["دليل التوظيف الذكي والمقابلات", "Smart Hiring Documentation"],
  "solutions-logistics": ["دليل حلول اللوجستيات الذكية", "Logistics AI Solutions Documentation"],
  "solutions-ocr": ["دليل OCR واستخراج بيانات المستندات", "OCR and Document AI Documentation"],
  "solutions-retail": ["دليل حلول التجزئة والتجارة الإلكترونية", "Retail and Ecommerce AI Documentation"],
  "solutions-supply-chain": ["دليل حلول سلسلة الإمداد الذكية", "Supply Chain AI Documentation"],
  "privacy-policy": ["سياسة الخصوصية في BrightAI", "BrightAI Privacy Policy"],
  "terms-and-conditions": ["الشروط والأحكام في BrightAI", "BrightAI Terms and Conditions"],
};

function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isEnglish(relPath) {
  return relPath.startsWith("en/") || /-en(?:\/index)?\.html$/i.test(relPath);
}

function pageStem(relPath) {
  if (relPath === "docs.html") return "docs";
  if (relPath === "en/docs/index.html") return "docs";
  const base = relPath.replace(/^docs\//, "").replace(/\/index\.html$/, "").replace(/\.html$/, "");
  return base.replace(/-en$/i, "");
}

function deriveDocMeta(relPath) {
  if (explicitTitles.has(relPath)) return explicitTitles.get(relPath);
  const stem = pageStem(relPath);
  const labels = docsLabels[stem] || [stem.replace(/-/g, " "), stem.replace(/-/g, " ")];
  const en = isEnglish(relPath);
  const titleCore = en ? labels[1] : labels[0];
  const title = `${titleCore} | BrightAI`;
  const description = en
    ? `${titleCore} from BrightAI for Saudi teams that need clear implementation context, service routing, and practical next steps.`
    : `${titleCore} من BrightAI لفرق السعودية التي تحتاج شرحاً عملياً، روابط تنفيذ واضحة، وسياقاً يساعد على اتخاذ القرار.`;
  return [title, description];
}

function replaceOrInsertHead(html, regex, replacement, before = /<\/head>/i) {
  if (regex.test(html)) return html.replace(regex, replacement);
  return html.replace(before, `${replacement}\n$&`);
}

function replaceMeta(html, selectorRegex, replacement) {
  return replaceOrInsertHead(html, selectorRegex, replacement);
}

function cleanDocsContent(html, relPath, title, description) {
  const en = isEnglish(relPath);
  const h1 = title.replace(/\s*\|\s*BrightAI$/i, "");
  const answer = en
    ? `BrightAI provides this documentation page to help Saudi teams understand ${h1} without relying on generic AI content. It explains the purpose, implementation context, related service routes, and the next step for enterprise teams evaluating AI solutions in Saudi Arabia.`
    : `توضح هذه الصفحة ${h1} ضمن سياق BrightAI للشركات السعودية. الهدف هو تقديم إجابة مباشرة قابلة للاقتباس، وربط القارئ بخطوة عملية نحو حلول الذكاء الاصطناعي في السعودية دون حشو أو تكرار.`;
  const section = en
    ? `<section class="seo-answer-block" data-seo-intent-answer="true"><p>${answer}</p></section>`
    : `<section class="seo-answer-block" data-seo-intent-answer="true"><p>${answer}</p></section>`;

  html = html.replace(/Documentation for Bright AI\s*/gi, "");
  html = html.replace(/\bdocumentation(?:\s+documentation)+\b/gi, "documentation");
  html = html.replace(/توثيق\s+توثيق\s+توثيق\s*/g, "");
  html = html.replace(/توثيق\s+توثيق\s*/g, "توثيق ");
  html = html.replace(/\s+في Bright AI(?:\s+في Bright AI)+/g, " في BrightAI");
  html = html.replace(/Bright AI/g, "BrightAI");
  html = html.replace(/<h2>([^<]+)<\/p>/g, "<h2>$1</h2>");
  html = html.replace(/<h3>([^<]+)<\/p>/g, "<h3>$1</h3>");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  html = replaceMeta(html, /<meta\b[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttr(description)}">`);
  html = replaceMeta(html, /<meta\b[^>]*property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttr(title)}">`);
  html = replaceMeta(html, /<meta\b[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttr(description)}">`);
  html = replaceMeta(html, /<meta\b[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(title)}">`);
  html = replaceMeta(html, /<meta\b[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(description)}">`);
  html = replaceMeta(html, /<meta\b[^>]*name=["']seo:primary_keyword["'][^>]*>/i, `<meta name="seo:primary_keyword" content="${escapeAttr(h1)}">`);
  html = html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${escapeAttr(h1)}</h1>`);
  html = html.replace(/<section class="seo-answer-block"[\s\S]*?<\/section>/i, section);
  html = html.replace(/"name"\s*:\s*"[^"]*(?:توثيق|Documentation|documentation)[^"]*"/g, `"name": "${title.replace(/\s*\|\s*BrightAI$/i, "")}"`);
  html = html.replace(/"description"\s*:\s*"[^"]*(?:توثيق|Documentation|documentation)[^"]*"/g, `"description": "${description}"`);
  return html;
}

function canonicalLinks(relPath, canonical, registry, lowerPathMap) {
  const counterpart = findCounterpartRelPath(relPath, lowerPathMap, {
    allowedRelPaths: registry.publicRelPaths,
  });
  const counterpartUrl = counterpart ? registry.canonicalByRelPath.get(counterpart) : null;
  const en = isEnglish(relPath);

  if (en) {
    if (!counterpartUrl) {
      return [
        `<link rel="alternate" hreflang="en-SA" href="${canonical}" />`,
        `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
      ].join("\n");
    }
    return [
      `<link rel="alternate" hreflang="ar-SA" href="${counterpartUrl}" />`,
      `<link rel="alternate" hreflang="en-SA" href="${canonical}" />`,
      `<link rel="alternate" hreflang="x-default" href="${counterpartUrl}" />`,
    ].join("\n");
  }

  if (!counterpartUrl) {
    return [
      `<link rel="alternate" hreflang="ar-SA" href="${canonical}" />`,
      `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
    ].join("\n");
  }

  return [
    `<link rel="alternate" hreflang="ar-SA" href="${canonical}" />`,
    `<link rel="alternate" hreflang="en-SA" href="${counterpartUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
  ].join("\n");
}

function upsertCanonicalAndHreflang(html, relPath, registry, lowerPathMap) {
  const canonical = relPathToCanonical(relPath, BASE_URL);
  if (!canonical) return html;
  html = html.replace(/https:\/\/www\.brightai\.site/gi, BASE_URL);
  html = html.replace(/https:\/\/brightai\.com\.sa/gi, BASE_URL);
  html = replaceOrInsertHead(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = replaceOrInsertHead(html, /<meta\b[^>]*property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  const alternates = canonicalLinks(relPath, canonical, registry, lowerPathMap);
  if (/<link\b[^>]*rel=["']alternate["'][^>]*hreflang=/i.test(html)) {
    html = html.replace(/(?:\s*<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>\s*)+/i, `\n${alternates}\n`);
  } else {
    html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, `$&\n${alternates}`);
  }
  return html;
}

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", "build", "coverage", "reports", "tmp"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

async function main() {
  const files = await walk(ROOT);
  const relPaths = files.map((file) => normalizeRelPath(path.relative(ROOT, file)));
  const lowerPathMap = new Map(relPaths.map((relPath) => [relPath.toLowerCase(), relPath]));
  const registry = buildPublicUrlRegistry(relPaths, BASE_URL);
  const changed = [];
  for (const file of files) {
    const relPath = normalizeRelPath(path.relative(ROOT, file));
    let html = await fs.readFile(file, "utf8");
    let next = upsertCanonicalAndHreflang(html, relPath, registry, lowerPathMap);
    if (relPath === "bot/index.html") {
      next = replaceMeta(next, /<meta\b[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="مساعد عملاء عربي من BrightAI يوضح تجربة الشات بوت للشركات السعودية مع ربط عملي بخدمات الأتمتة والدعم." />`);
    }
    if (relPath === "sitemap/index.html") {
      next = next.replace(/<html lang="en" dir="ltr"/i, `<html lang="ar-SA" dir="rtl"`);
      next = next.replace(/hreflang="en"/gi, `hreflang="ar-SA"`);
      next = next.replace(/BrightAI/g, "BrightAI");
    }
    if (relPath === "docs.html" || relPath === "en/docs/index.html" || relPath.startsWith("docs/")) {
      const [title, description] = deriveDocMeta(relPath);
      next = cleanDocsContent(next, relPath, title, description);
    }
    if (next !== html) {
      await fs.writeFile(file, next, "utf8");
      changed.push(relPath);
    }
  }
  process.stdout.write(`Applied full audit SEO fixes to ${changed.length} HTML files\n`);
  for (const rel of changed) process.stdout.write(`- ${rel}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
