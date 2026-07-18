#!/usr/bin/env node
/**
 * Extracts article body HTML from blog/*.html files and saves as
 * src/content/blog/<slug>.md with frontmatter.
 * Run: node scripts/extract-blog-articles.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'blog');
const OUT_DIR = join(ROOT, 'src', 'content', 'blog');

// All 22 slugs from sitemap
const SLUGS = [
  'ai-audit-trail-compliance-path',
  'ai-audit-trail-saudi',
  'ai-customer-data-protection-saudi',
  'ai-ethics-saudi-responsible-ai',
  'ai-firewall-why-you-need-it',
  'ai-governance-saudi-arabia',
  'ai-governance-vs-ai-safety-vs-ai-security',
  'ai-governance',
  'ai-red-teaming-security-testing',
  'banking-ai-governance-sama-requirements',
  'best-ai-governance-platforms-2026',
  'healthcare-ai-governance-saudi-hospitals',
  'hidden-ai-risks-saudi-organizations',
  'iso-42001-saudi-implementation-guide',
  'nca-ecc-ai-controls-guide',
  'pdpl-ai-compliance-guide',
  'pdpl-ai-safety',
  'pdpl-and-ai-saudi',
  'sdaia-generative-ai-guidelines-practical-compliance',
  'shadow-ai-discovery-saudi-company',
  'vision-2030-ai-governance-roadmap',
  'what-is-ai-governance-saudi-companies',
];

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let extracted = 0;
let skipped = 0;

for (const slug of SLUGS) {
  const htmlPath = join(BLOG_DIR, slug, 'index.html');
  if (!existsSync(htmlPath)) {
    console.warn(`⚠ Missing: ${htmlPath}`);
    skipped++;
    continue;
  }

  const html = readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  // Extract the main article content area
  // Articles use .article-content as the main body
  let articleHtml = '';

  // Try .article-content first
  const articleContent = $('.article-content');
  if (articleContent.length) {
    articleHtml = articleContent.html() || '';
  }

  // Also capture the short-answer box if present
  const shortAnswer = $('.short-answer-box');
  let shortAnswerHtml = '';
  if (shortAnswer.length) {
    shortAnswerHtml = shortAnswer.html() || '';
  }

  // Also capture hero subtitle for the lead
  const heroSubtitle = $('.hero-subtitle').text().trim();

  // Capture FAQ section
  const faqSection = $('.faq-section');
  let faqHtml = '';
  if (faqSection.length) {
    faqHtml = faqSection.html() || '';
  }

  // Capture CTA section
  const ctaSection = $('.cta-section');
  let ctaHtml = '';
  if (ctaSection.length) {
    ctaHtml = ctaSection.html() || '';
  }

  // Capture checklist sections
  const checklist = $('.checklist');
  let checklistHtml = '';
  if (checklist.length) {
    checklistHtml = checklist.html() || '';
  }

  // Capture risk/step/solution grids
  const extraSections = [];
  $('.risk-grid, .steps-container, .solutions-grid').each((_, el) => {
    extraSections.push($(el).html() || '');
  });

  // Build the full article body
  const bodyParts = [];
  if (shortAnswerHtml) {
    bodyParts.push(`<div class="short-answer-box">\n${shortAnswerHtml}\n</div>`);
  }
  if (articleHtml) {
    bodyParts.push(articleHtml);
  }
  if (checklistHtml) {
    bodyParts.push(`<div class="checklist">\n${checklistHtml}\n</div>`);
  }
  for (const extra of extraSections) {
    bodyParts.push(extra);
  }
  if (faqHtml) {
    bodyParts.push(`<div class="faq-section">\n${faqHtml}\n</div>`);
  }
  if (ctaHtml) {
    bodyParts.push(`<div class="cta-section">\n${ctaHtml}\n</div>`);
  }

  const fullBody = bodyParts.join('\n\n');

  // Count words for reading time verification
  const textContent = $.text();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  // Extract title from h1
  const h1 = $('h1').first().text().trim();
  // Extract meta description
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  // Extract canonical
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  // Extract pub date from JSON-LD or meta
  const datePublished = $('meta[property="article:published_time"]').attr('content')?.split('T')[0] || '2026-06-01';
  const dateModified = $('meta[property="article:modified_time"]').attr('content')?.split('T')[0] || datePublished;

  // Build frontmatter
  const frontmatter = `---
title: "${h1.replace(/"/g, '\\"')}"
description: "${metaDesc.replace(/"/g, '\\"')}"
canonical: "${canonical}"
pubDate: "${datePublished}"
updatedDate: "${dateModified}"
author: "nasser-alabdullah"
slug: "${slug}"
readingTime: ${Math.max(5, Math.ceil(wordCount / 200))}
---`;

  const mdContent = `${frontmatter}\n\n${fullBody}`;

  const outPath = join(OUT_DIR, `${slug}.md`);
  writeFileSync(outPath, mdContent, 'utf-8');
  extracted++;
  console.log(`✓ ${slug} (${wordCount} words, ~${Math.ceil(wordCount / 200)} min read)`);
}

console.log(`\n━━━ Extraction Summary ━━━`);
console.log(`Extracted: ${extracted}/${SLUGS.length}`);
console.log(`Skipped: ${skipped}`);
console.log(`Output: ${OUT_DIR}`);
if (extracted !== SLUGS.length) {
  console.error(`❌ WARNING: Expected ${SLUGS.length} articles, got ${extracted}. Check missing files!`);
} else {
  console.log(`✅ All ${SLUGS.length} articles extracted successfully.`);
}