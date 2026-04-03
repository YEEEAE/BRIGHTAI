#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const ROOT = process.cwd();
const BLOGGER_PATTERN = "frontend/pages/blogger/*.html";
const TOP_RELATED_COUNT = 3;

const AR_STOPWORDS = new Set([
  "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "تلك", "هو", "هي",
  "ثم", "أو", "أن", "إن", "ما", "لا", "لم", "لن", "قد", "كل", "بين", "ضمن", "حتى",
  "بعد", "قبل", "عند", "تم", "كيف", "دليل", "شامل", "مستقبل", "حلول", "السعودية",
  "السعودي", "السعودية", "brightai", "bright", "ai"
]);

const EN_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "into", "your", "this", "that", "how", "what",
  "why", "when", "where", "guide", "case", "study", "brightai", "bright", "ai", "in",
  "of", "to", "on", "a", "an", "is", "are", "as", "by"
]);

const AUTO_RELATED_BLOCK_RE =
  /<!-- auto-related:start -->[\s\S]*?<!-- auto-related:end -->/i;

const GENERIC_RELATED_SECTION_RE =
  /<section\b(?=[^>]*class="[^"]*\brelated-articles\b[^"]*")(?![^>]*\bid="silo-hub-link")[^>]*>[\s\S]*?<h2[^>]*>\s*مقالات ذات صلة\s*<\/h2>[\s\S]*?<\/section>/i;

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(text) {
  return decodeHtmlEntities(text.replace(/<[^>]*>/g, " "));
}

function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
}

function tokenize(text) {
  const normalized = normalizeArabic(text.toLowerCase())
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return [];

  return normalized
    .split(" ")
    .filter((token) => token.length > 1)
    .filter((token) => !AR_STOPWORDS.has(token) && !EN_STOPWORDS.has(token));
}

function extractMeta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const match = html.match(re);
  return match ? stripTags(match[1]).trim() : "";
}

function extractFirst(html, pattern) {
  const match = html.match(pattern);
  return match ? stripTags(match[1]).trim() : "";
}

function buildWeightedTokens(article) {
  const weights = new Map();
  const add = (text, weight) => {
    for (const token of tokenize(text)) {
      weights.set(token, (weights.get(token) || 0) + weight);
    }
  };

  add(article.keywords, 3);
  add(article.title, 2);
  add(article.h1, 2);
  add(article.description, 1);

  return weights;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (const val of a.values()) aNorm += val * val;
  for (const val of b.values()) bNorm += val * val;
  if (!aNorm || !bNorm) return 0;

  for (const [token, aVal] of a.entries()) {
    const bVal = b.get(token);
    if (bVal) dot += aVal * bVal;
  }

  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

function hrefFromBasename(basename) {
  const slug = basename.replace(/\.html$/i, "");
  return `/blog/${slug.replace(/\s+/g, "-")}`;
}

function buildRelatedSection(relatedArticles) {
  const items = relatedArticles
    .map(
      (article) =>
        `<li><a class="hover:text-purple-400 transition" href="${hrefFromBasename(article.basename)}">${article.title}</a></li>`
    )
    .join("\n");

  return `<!-- auto-related:start -->
<section class="related-articles mt-12 p-5 bg-slate-900/50 border border-slate-700/50 rounded-xl md:p-6" data-auto-related="true" style="content-visibility: auto;">
<h2 class="text-2xl font-bold text-white mb-4">مقالات ذات صلة</h2>
<ul class="space-y-3 text-slate-300">
${items}
</ul>
</section>
<!-- auto-related:end -->`;
}

function injectRelatedSection(html, relatedSection) {
  if (AUTO_RELATED_BLOCK_RE.test(html)) {
    return html.replace(AUTO_RELATED_BLOCK_RE, relatedSection);
  }

  if (GENERIC_RELATED_SECTION_RE.test(html)) {
    return html.replace(GENERIC_RELATED_SECTION_RE, relatedSection);
  }

  if (html.includes('id="silo-hub-link"')) {
    return html.replace(/<section\b(?=[^>]*\bid="silo-hub-link")[\s\S]*$/i, `${relatedSection}\n$&`);
  }

  if (html.includes("</article>")) {
    return html.replace("</article>", `${relatedSection}\n</article>`);
  }

  if (html.includes("</main>")) {
    return html.replace("</main>", `${relatedSection}\n</main>`);
  }

  return `${html}\n${relatedSection}\n`;
}

async function run() {
  const files = await glob(BLOGGER_PATTERN, { cwd: ROOT, nodir: true });
  const articles = [];

  for (const relativePath of files) {
    const absolutePath = path.join(ROOT, relativePath);
    const basename = path.basename(relativePath);
    const html = await fs.readFile(absolutePath, "utf8");

    const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!title || /تم نقل الصفحة/i.test(title)) {
      continue;
    }

    const h1 = extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const keywords = extractMeta(html, "keywords");
    const description = extractMeta(html, "description") || extractMeta(html, "og:description");

    const article = {
      absolutePath,
      basename,
      title,
      h1,
      keywords,
      description,
      html
    };

    article.tokenWeights = buildWeightedTokens(article);
    articles.push(article);
  }

  let updatedCount = 0;

  for (const source of articles) {
    const scored = [];
    for (const candidate of articles) {
      if (candidate.basename === source.basename) continue;
      const score = cosineSimilarity(source.tokenWeights, candidate.tokenWeights);
      if (score > 0) {
        scored.push({ article: candidate, score });
      }
    }

    scored.sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, "ar"));
    const top = scored.slice(0, TOP_RELATED_COUNT).map((entry) => entry.article);
    if (top.length === 0) continue;

    const relatedSection = buildRelatedSection(top);
    const nextHtml = injectRelatedSection(source.html, relatedSection);

    if (nextHtml !== source.html) {
      await fs.writeFile(source.absolutePath, nextHtml, "utf8");
      updatedCount += 1;
    }
  }

  console.log(`Auto-related update completed.`);
  console.log(`Articles scanned: ${articles.length}`);
  console.log(`Articles updated: ${updatedCount}`);
}

run().catch((error) => {
  console.error("Failed to generate related articles:", error);
  process.exitCode = 1;
});
