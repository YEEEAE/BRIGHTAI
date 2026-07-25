/**
 * migrate-blog-html-to-md.mjs
 * 
 * Extracts article body content from legacy HTML blog files
 * and appends it to the corresponding Astro content collection
 * markdown files (src/content/blog/<slug>.md).
 * 
 * Usage: node scripts/migrate-blog-html-to-md.mjs [--dry-run] [--slug=<slug>]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const SLUG_FILTER = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1];

// Blog posts that need body content (frontmatter-only markdown files)
const BLOG_SLUGS = [
  'ai-audit-trail-compliance-path',
  'ai-ethics-saudi-responsible-ai',
  'ai-firewall-why-you-need-it',
  'ai-governance',
  'ai-governance-vs-ai-safety-vs-ai-security',
  'ai-red-teaming-security-testing',
  'banking-ai-governance-sama-requirements',
  'best-ai-governance-platforms-2026',
  'healthcare-ai-governance-saudi-hospitals',
  'hidden-ai-risks-saudi-organizations',
  'iso-42001-saudi-implementation-guide',
  'nca-ecc-ai-controls-guide',
  'pdpl-ai-compliance-guide',
  'pdpl-ai-safety',
  'sdaia-generative-ai-guidelines-practical-compliance',
  'shadow-ai-discovery-saudi-company',
  'vision-2030-ai-governance-roadmap',
  'what-is-ai-governance-saudi-companies',
];

// Partial posts that need more content
const PARTIAL_SLUGS = [
  'pdpl-and-ai-saudi',
  'ai-audit-trail-saudi',
];

function extractArticleBody(html, slug) {
  const $ = cheerio.load(html);

  // Remove elements we don't want in the article body
  $('script, style, link[rel="preload"], noscript, meta, link[rel="canonical"], link[rel="alternate"]').remove();
  $('header, footer, nav').remove();

  // Remove noscript navigation blocks
  $('[id*="brightai-unified-header"]').remove();
  $('.brightai-raw-internal-links').remove();
  $('section.brightai-raw-internal-links').remove();

  // Remove FAQ JavaScript accordion markup (keep content)
  // Remove iconify-icon references that won't render
  // Keep the content structure

  let content = '';

  // Strategy 1: Look for <main> tag (most blog posts)
  const mainEl = $('main');
  if (mainEl.length) {
    // Try to find the article content area
    const articleEl = mainEl.find('article');
    if (articleEl.length) {
      // Clean up sidebar/aside content
      articleEl.find('aside, .toc, .cta, .related').remove();
      content = articleEl.html();
    } else {
      // Use the main content, removing breadcrumb nav and hero meta
      mainEl.find('.crumb-nav, .top, header.top, .nav, .nav-links, .brand').remove();
      mainEl.find('script').remove();
      
      // For ai-governance style: content is directly in main.wrap
      const wrapContent = mainEl.find('.wrap');
      if (wrapContent.length) {
        wrapContent.find('nav.crumb-nav').remove();
        content = wrapContent.html();
      } else {
        content = mainEl.html();
      }
    }
  }

  // Strategy 2: Look for article class directly
  if (!content) {
    const articleEl = $('article');
    if (articleEl.length) {
      articleEl.find('aside, .toc, .cta, .related').remove();
      content = articleEl.html();
    }
  }

  // Strategy 3: Fallback to body content
  if (!content) {
    content = $('body').html() || '';
  }

  // Clean up the extracted content
  content = cleanContent(content, $);

  return content;
}

function cleanContent(html, $) {
  const $c = cheerio.load(html, null, false);

  // Remove empty elements
  $c('section:empty, div:empty').remove();

  // Remove breadcrumb navigation within content
  $c('.crumb-nav').remove();
  $c('nav.crumb-nav').remove();

  // Remove hero section metadata that's duplicated by layout
  // Keep the hero text content but remove meta/tags sections

  // Remove scripts
  $c('script').remove();

  // Remove any inline styles that are layout-specific
  // (keep content-related styles)

  // Clean up FAQ accordion headers - remove iconify icons but keep text
  $c('.faq-icon, .icon-chevron-down').remove();

  // Remove the top nav/header if it somehow got included
  $c('.top').remove();
  $c('header.top').remove();

  // Clean up whitespace
  let result = $c.html();
  result = result
    .replace(/\n{3,}/g, '\n\n')  // Collapse multiple newlines
    .replace(/[ \t]+\n/g, '\n')  // Trailing whitespace
    .replace(/\n[ \t]+/g, '\n')  // Leading whitespace on lines
    .trim();

  return result;
}

function hasBodyContent(mdContent) {
  // Check if the markdown file has content after the frontmatter
  const afterFrontmatter = mdContent.replace(/^---[\s\S]*?---\s*/, '').trim();
  return afterFrontmatter.length > 100; // More than just whitespace/newlines
}

function processBlogPost(slug) {
  const htmlPath = resolve(ROOT, `blog/${slug}/index.html`);
  const mdPath = resolve(ROOT, `src/content/blog/${slug}.md`);

  if (!existsSync(htmlPath)) {
    console.log(`  ⚠️  HTML not found: ${htmlPath}`);
    return { slug, status: 'html_missing' };
  }

  if (!existsSync(mdPath)) {
    console.log(`  ⚠️  Markdown not found: ${mdPath}`);
    return { slug, status: 'md_missing' };
  }

  const html = readFileSync(htmlPath, 'utf-8');
  const md = readFileSync(mdPath, 'utf-8');

  if (hasBodyContent(md)) {
    console.log(`  ✅ Already has body content: ${slug}`);
    return { slug, status: 'already_migrated' };
  }

  const bodyContent = extractArticleBody(html, slug);

  if (!bodyContent || bodyContent.trim().length < 50) {
    console.log(`  ❌ Failed to extract content: ${slug}`);
    return { slug, status: 'extraction_failed' };
  }

  // Preserve existing frontmatter, append body
  const newContent = md.trimEnd() + '\n\n' + bodyContent + '\n';

  if (DRY_RUN) {
    console.log(`  🔍 [DRY RUN] Would write ${bodyContent.length} bytes to ${slug}.md`);
    return { slug, status: 'dry_run', bytesWritten: bodyContent.length };
  }

  writeFileSync(mdPath, newContent, 'utf-8');
  console.log(`  ✅ Migrated ${slug}: ${bodyContent.length} bytes written`);
  return { slug, status: 'migrated', bytesWritten: bodyContent.length };
}

// Main
console.log('🚀 Blog HTML → Markdown Migration Script');
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log(`   Slugs: ${SLUG_FILTER ? SLUG_FILTER : 'ALL (' + [...BLOG_SLUGS, ...PARTIAL_SLUGS].length + ')'}`);
console.log('');

const allSlugs = SLUG_FILTER
  ? [SLUG_FILTER]
  : [...BLOG_SLUGS, ...PARTIAL_SLUGS];

const results = [];

for (const slug of allSlugs) {
  console.log(`Processing: ${slug}`);
  const result = processBlogPost(slug);
  results.push(result);
}

// Summary
console.log('\n📊 Migration Summary:');
console.log('─'.repeat(50));
const migrated = results.filter(r => r.status === 'migrated' || r.status === 'dry_run');
const alreadyDone = results.filter(r => r.status === 'already_migrated');
const failed = results.filter(r => r.status === 'extraction_failed' || r.status === 'html_missing' || r.status === 'md_missing');

console.log(`  ✅ Migrated: ${migrated.length}`);
console.log(`  ⏭️  Already done: ${alreadyDone.length}`);
console.log(`  ❌ Failed: ${failed.length}`);

if (migrated.length > 0) {
  const totalBytes = migrated.reduce((sum, r) => sum + (r.bytesWritten || 0), 0);
  console.log(`  📝 Total bytes written: ${totalBytes.toLocaleString()}`);
}

if (failed.length > 0) {
  console.log('\n  Failed slugs:');
  failed.forEach(r => console.log(`    - ${r.slug} (${r.status})`));
}

console.log('\n✅ Migration complete!');
