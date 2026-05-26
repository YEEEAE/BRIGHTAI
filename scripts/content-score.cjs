#!/usr/bin/env node
/**
 * content:score - Content quality scoring for BRIGHTAI pages
 * Scores pages on: title quality, description, H1, headings structure, 
 * content length, FAQ presence, schema markup, internal links, CTA
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MIN_CONTENT_LENGTH = 200;
const MIN_HEADING_COUNT = 3;
const MIN_FAQ_COUNT = 3;

function findHtmlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.render-static' && entry.name !== 'backend') {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'index.html') {
      files.push(fullPath);
    }
  }
  return files;
}

function scoreFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(ROOT, filePath);
  const scores = {};
  const issues = [];

  // Check if noindex (skip from fail threshold)
  const noindex = /meta\s+name="robots"\s+content="[^"]*noindex/.test(html);

  // 1. Title quality (0-10)
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '';
  if (!title) {
    scores.title = 0;
    issues.push('Missing <title>');
  } else if (title.length < 20) {
    scores.title = 5;
    issues.push('Title too short');
  } else if (title.length > 70) {
    scores.title = 6;
    issues.push('Title too long');
  } else {
    scores.title = 10;
  }

  // 2. Meta description (0-10)
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  const desc = descMatch ? descMatch[1] : '';
  if (!desc) {
    scores.description = 0;
    issues.push('Missing meta description');
  } else if (desc.length < 50) {
    scores.description = 5;
    issues.push('Description too short');
  } else if (desc.length > 170) {
    scores.description = 7;
  } else {
    scores.description = 10;
  }

  // 3. H1 (0-10)
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '';
  if (!h1Text) {
    scores.h1 = 0;
    issues.push('Missing H1');
  } else if (html.match(/<h1/g)?.length > 1) {
    scores.h1 = 5;
    issues.push('Multiple H1 tags');
  } else {
    scores.h1 = 10;
  }

  // 4. Headings structure (0-10)
  const h2Count = (html.match(/<h2/g) || []).length;
  const h3Count = (html.match(/<h3/g) || []).length;
  if (h2Count + h3Count < MIN_HEADING_COUNT) {
    scores.headings = 4;
    issues.push(`Only ${h2Count + h3Count} subheadings`);
  } else {
    scores.headings = 10;
  }

  // 5. Content length (0-10)
  const bodyText = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, '').trim();
  const textLength = bodyText.replace(/\s+/g, ' ').length;
  if (textLength < MIN_CONTENT_LENGTH) {
    scores.content = 3;
    issues.push(`Thin content (${textLength} chars)`);
  } else if (textLength < 500) {
    scores.content = 6;
  } else if (textLength < 1500) {
    scores.content = 8;
  } else {
    scores.content = 10;
  }

  // 6. FAQ (0-10)
  const faqCount = (html.match(/<details>/g) || []).length;
  if (faqCount >= MIN_FAQ_COUNT) {
    scores.faq = 10;
  } else if (faqCount > 0) {
    scores.faq = 5;
    issues.push(`Only ${faqCount} FAQ items`);
  } else {
    scores.faq = 0;
    issues.push('No FAQ section');
  }

  // 7. Schema markup (0-10)
  const hasBreadcrumbSchema = html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"');
  const hasFAQSchema = html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"');
  const hasSoftwareSchema = html.includes('"@type":"SoftwareApplication"') || html.includes('"@type": "SoftwareApplication"');
  const schemaCount = [hasBreadcrumbSchema, hasFAQSchema, hasSoftwareSchema].filter(Boolean).length;
  scores.schema = Math.min(10, schemaCount * 4);
  if (schemaCount === 0) issues.push('No structured data');

  // 8. Internal links (0-10)
  const internalLinks = (html.match(/href="\/(?!\/)[^"]+"/g) || []).length;
  if (internalLinks < 3) {
    scores.links = 3;
    issues.push('Few internal links');
  } else if (internalLinks < 6) {
    scores.links = 7;
  } else {
    scores.links = 10;
  }

  // 9. CTA (0-10)
  const hasCTA = html.includes('consultation') || html.includes('احجز') || html.includes('contact') || html.includes('واتساب');
  scores.cta = hasCTA ? 10 : 3;
  if (!hasCTA) issues.push('No clear CTA');

  // 10. Canonical (0-10)
  const hasCanonical = html.includes('rel="canonical"');
  scores.canonical = hasCanonical ? 10 : 0;
  if (!hasCanonical) issues.push('Missing canonical');

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = Object.keys(scores).length * 10;
  const percentage = Math.round((totalScore / maxScore) * 100);

  return { relativePath, scores, totalScore, maxScore, percentage, issues, noindex };
}

// Run
const htmlFiles = findHtmlFiles(ROOT);
console.log(`\nContent Quality Scoring: ${htmlFiles.length} pages\n`);

const results = htmlFiles.map(scoreFile);
const sorted = [...results].sort((a, b) => a.percentage - b.percentage);

const avgScore = Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length);

console.log(`Overall Content Score: ${avgScore}%\n`);

const failing = sorted.filter(r => r.percentage < 60 && !r.noindex);
const passing = sorted.filter(r => r.percentage >= 60);

if (failing.length > 0) {
  console.log(`Pages below 60% (${failing.length}):`);
  for (const r of failing.slice(0, 20)) {
    console.log(`  ${r.percentage}% ${r.relativePath} - ${r.issues.join(', ')}`);
  }
  console.log();
}

console.log(`Pages >= 60%: ${passing.length}/${results.length}`);
console.log(`Pages >= 80%: ${results.filter(r => r.percentage >= 80).length}/${results.length}`);

if (failing.length > 0) {
  console.log(`\nFAIL: ${failing.length} pages below 60%`);
  process.exit(1);
} else {
  console.log('\nPASS: All pages >= 60%');
  process.exit(0);
}
