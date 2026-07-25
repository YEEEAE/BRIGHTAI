/**
 * compare-blog-posts.mjs
 * Step 4 of Migration Closure: Compare legacy HTML blog posts with Astro output
 * Produces a table: [slug] | [legacy title] | [astro title] | [match %] | [action]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';

const blogDir = 'src/content/blog';
const distBlogDir = 'dist/blog';

function extractLegacyData(slug) {
  const htmlPath = join('blog', slug, 'index.html');
  if (!existsSync(htmlPath)) return null;
  const html = readFileSync(htmlPath, 'utf-8');
  const $ = load(html);
  const title = $('title').text().trim();
  const h1 = $('h1').first().text().trim();
  return { title, h1 };
}

function extractAstroData(slug) {
  const mdPath = join(blogDir, `${slug}.md`);
  if (!existsSync(mdPath)) return null;
  const md = readFileSync(mdPath, 'utf-8');
  // Extract frontmatter
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';
  // Extract H1 from body (first # heading)
  const body = md.slice(fmMatch[0].length);
  const h1Match = body.match(/^#\s+(.+)$/m);
  const h1 = h1Match ? h1Match[1].trim() : title;
  return { title, h1 };
}

// Get all markdown files
const mdFiles = readdirSync(blogDir).filter(f => f.endsWith('.md'));
const slugs = mdFiles.map(f => f.replace('.md', ''));

console.log('| slug | legacy title | astro title | legacy H1 | astro H1 | title match | H1 match | action |');
console.log('|---|---|---|---|---|---|---|---|');

let fixCount = 0;
let matchCount = 0;

for (const slug of slugs) {
  const legacy = extractLegacyData(slug);
  const astro = extractAstroData(slug);
  
  if (!legacy) {
    console.log(`| ${slug} | N/A | ${astro?.title || 'N/A'} | N/A | ${astro?.h1 || 'N/A'} | N/A | N/A | NO LEGACY |`);
    continue;
  }
  if (!astro) {
    console.log(`| ${slug} | ${legacy.title} | N/A | ${legacy.h1} | N/A | N/A | N/A | NO ASTRO |`);
    continue;
  }
  
  const titleMatch = legacy.title === astro.title ? '✅' : '❌';
  const h1Match = legacy.h1 === astro.h1 ? '✅' : '❌';
  const action = (titleMatch === '✅' && h1Match === '✅') ? 'NONE' : 'FIX_FRONTMATTER';
  
  if (action === 'NONE') matchCount++;
  else fixCount++;
  
  console.log(`| ${slug} | ${legacy.title} | ${astro.title} | ${legacy.h1} | ${astro.h1} | ${titleMatch} | ${h1Match} | ${action} |`);
}

console.log(`\n--- Summary ---`);
console.log(`Total: ${slugs.length} | Match: ${matchCount} | Need fix: ${fixCount}`);
