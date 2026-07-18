/**
 * migrate-docs-html-to-md.mjs
 * Extracts article body content from legacy HTML docs files
 * and appends it to the corresponding Astro content collection
 * markdown files (src/content/docs/<slug>.md).
 *
 * Usage: node scripts/migrate-docs-html-to-md.mjs [--dry-run] [--slug=<slug>]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const SLUG_FILTER = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1];

// All docs slugs that have both HTML and markdown files
const DOCS_SLUGS = [
  'ai-audit-readiness', 'ai-audit-trail', 'ai-evidence-file', 'ai-firewall',
  'ai-governance-platform', 'ai-governance-saudi-arabia', 'ai-risk-management',
  'governance-application', 'human-approval-layer', 'kernel-accessibility-mobile',
  'kernel-api-client', 'kernel-approvals', 'kernel-architecture', 'kernel-audit-evidence',
  'kernel-audit-trail', 'kernel-changelog-template', 'kernel-chat', 'kernel-compliance',
  'kernel-connectors', 'kernel-developer-onboarding', 'kernel-evidence',
  'kernel-internal-linking', 'kernel-nvidia-proxy', 'kernel-operations-runbook',
  'kernel-pages', 'kernel-policies', 'kernel-production-vs-demo', 'kernel-reports',
  'kernel-scenarios', 'kernel-security-model', 'kernel-stats', 'kernel-testing-checklist',
  'nca-ecc-ai-controls', 'nca-ecc-ai-controls-mapping', 'nca-ecc-ai-governance',
  'nca-ecc-ai-guide', 'pdpl-ai-complete-guide', 'pdpl-ai-governance',
  'pdpl-chatgpt-data-protection', 'sdaia-generative-ai-guidelines', 'superpowers',
];

function extractArticleBody(html, slug) {
  const $ = cheerio.load(html);

  // Remove elements we don't want
  $('script, style, link[rel="preload"], noscript, meta, link[rel="canonical"], link[rel="alternate"]').remove();
  $('header, footer, nav').remove();
  $('[id*="brightai-unified-header"]').remove();
  $('.brightai-raw-internal-links').remove();
  $('section.brightai-raw-internal-links').remove();

  // Remove FAQ accordion headers (keep content)
  $('.faq-icon, .icon-chevron-down').remove();
  $('.top').remove();
  $('header.top').remove();

  let content = '';

  // Strategy 1: Look for <main> tag
  const mainEl = $('main');
  if (mainEl.length) {
    const articleEl = mainEl.find('article');
    if (articleEl.length) {
      articleEl.find('aside, .toc, .cta, .related').remove();
      content = articleEl.html();
    } else {
      mainEl.find('.crumb-nav, .top, header.top, .nav, .nav-links, .brand').remove();
      mainEl.find('script').remove();
      const wrapContent = mainEl.find('.wrap');
      if (wrapContent.length) {
        wrapContent.find('nav.crumb-nav').remove();
        content = wrapContent.html();
      } else {
        content = mainEl.html();
      }
    }
  }

  // Strategy 2: article tag
  if (!content) {
    const articleEl = $('article');
    if (articleEl.length) {
      articleEl.find('aside, .toc, .cta, .related').remove();
      content = articleEl.html();
    }
  }

  // Strategy 3: body fallback
  if (!content) {
    content = $('body').html() || '';
  }

  // Clean up
  content = content.replace(/<iconify-icon[^>]*>[\s\S]*?<\/iconify-icon>/g, '');
  content = content.replace(/<iconify-icon[^>]*\/>/g, '');
  content = content.replace(/<!-- AI-CITATION:[\s\S]*?-->/g, '');
  content = content.replace(/\n{4,}/g, '\n\n\n');

  return content.trim();
}

function hasBodyContent(mdContent) {
  const afterFrontmatter = mdContent.replace(/^---[\s\S]*?---\s*/, '').trim();
  return afterFrontmatter.length > 200;
}

function processDoc(slug) {
  const htmlPath = resolve(ROOT, `docs/${slug}/index.html`);
  const mdPath = resolve(ROOT, `src/content/docs/${slug}.md`);

  if (!existsSync(htmlPath)) {
    return { slug, status: 'html_missing' };
  }

  if (!existsSync(mdPath)) {
    return { slug, status: 'md_missing' };
  }

  const html = readFileSync(htmlPath, 'utf-8');
  const md = readFileSync(mdPath, 'utf-8');

  if (hasBodyContent(md)) {
    return { slug, status: 'already_has_content', mdSize: md.length };
  }

  const bodyContent = extractArticleBody(html, slug);

  if (!bodyContent || bodyContent.trim().length < 50) {
    return { slug, status: 'extraction_failed' };
  }

  const newContent = md.trimEnd() + '\n\n' + bodyContent + '\n';

  if (DRY_RUN) {
    return { slug, status: 'dry_run', bytesWritten: bodyContent.length };
  }

  writeFileSync(mdPath, newContent, 'utf-8');
  return { slug, status: 'migrated', bytesWritten: bodyContent.length };
}

// Main
console.log('🚀 Docs HTML → Markdown Migration Script');
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log(`   Slugs: ${SLUG_FILTER ? SLUG_FILTER : 'ALL (' + DOCS_SLUGS.length + ')'}`);
console.log('');

const allSlugs = SLUG_FILTER ? [SLUG_FILTER] : DOCS_SLUGS;
const results = [];

for (const slug of allSlugs) {
  const result = processDoc(slug);
  results.push(result);
  if (result.status === 'migrated' || result.status === 'dry_run') {
    console.log(`  ✅ ${slug}: ${result.bytesWritten} bytes`);
  } else if (result.status === 'already_has_content') {
    console.log(`  ⏭️  ${slug}: already has content (${result.mdSize} bytes)`);
  } else {
    console.log(`  ⚠️  ${slug}: ${result.status}`);
  }
}

// Summary
console.log('\n📊 Summary:');
const migrated = results.filter(r => r.status === 'migrated' || r.status === 'dry_run');
const alreadyDone = results.filter(r => r.status === 'already_has_content');
const failed = results.filter(r => r.status === 'extraction_failed' || r.status === 'html_missing' || r.status === 'md_missing');

console.log(`  Migrated: ${migrated.length}`);
console.log(`  Already done: ${alreadyDone.length}`);
console.log(`  Failed/skipped: ${failed.length}`);
