/**
 * migrate-partial-posts.mjs
 * Migrate the 2 remaining partial blog posts from HTML to markdown.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const POSTS = [
  { slug: 'pdpl-and-ai-saudi', htmlPath: 'blog/pdpl-and-ai-saudi/index.html', mdPath: 'src/content/blog/pdpl-and-ai-saudi.md' },
  { slug: 'ai-audit-trail-saudi', htmlPath: 'blog/ai-audit-trail-saudi/index.html', mdPath: 'src/content/blog/ai-audit-trail-saudi.md' },
];

for (const post of POSTS) {
  const html = readFileSync(resolve(ROOT, post.htmlPath), 'utf-8');
  const md = readFileSync(resolve(ROOT, post.mdPath), 'utf-8');
  
  const $ = cheerio.load(html);
  $('script, style, noscript, header, footer, nav').remove();
  $('section.brightai-raw-internal-links').remove();
  $('[id=brightai-unified-header]').remove();
  $('.breadcrumb, .breadcrumb-nav, .toc').remove();
  
  let content = '';
  const main = $('main');
  if (main.length) {
    main.find('.faq-item').each(function() { $(this).remove(); });
    main.find('.cta-section').remove();
    content = main.html();
  } else {
    const article = $('article');
    if (article.length) {
      article.find('.faq-item').each(function() { $(this).remove(); });
      article.find('.cta-section').remove();
      content = article.html();
    }
  }
  
  // Clean up
  content = content.replace(/<iconify-icon[^>]*>[\s\S]*?<\/iconify-icon>/g, '');
  content = content.replace(/<iconify-icon[^>]*\/>/g, '');
  content = content.replace(/<!-- AI-CITATION:[\s\S]*?-->/g, '');
  content = content.replace(/\n{4,}/g, '\n\n\n');
  
  const fmMatch = md.match(/^---[\s\S]*?---/);
  const frontmatter = fmMatch ? fmMatch[0] : '';
  
  const newContent = frontmatter + '\n\n' + content.trim() + '\n';
  writeFileSync(resolve(ROOT, post.mdPath), newContent, 'utf-8');
  console.log(`Migrated ${post.slug}: ${content.trim().length} bytes`);
}
