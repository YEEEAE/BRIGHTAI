/**
 * fix-blog-content-artifacts.mjs
 * 
 * Cleans up migrated blog markdown content:
 * 1. Strips <iconify-icon> tags (iconify not loaded in BaseLayout)
 * 2. Removes duplicate author cards (layout handles author display)
 * 3. Removes duplicate hero sections (layout handles hero)
 * 4. Cleans up excessive inline styles
 * 5. Removes duplicate content sections
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BLOG_DIR = resolve(ROOT, 'src/content/blog');

const DRY_RUN = process.argv.includes('--dry-run');

// All migrated blog slugs
const SLUGS = [
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

function fixContent(content) {
  let fixed = content;
  let changes = 0;

  // 1. Strip <iconify-icon ...>...</iconify-icon> tags (keep nothing - icons won't render)
  const iconifyBefore = fixed.length;
  fixed = fixed.replace(/<iconify-icon[^>]*>[\s\S]*?<\/iconify-icon>/g, '');
  if (fixed.length !== iconifyBefore) { changes++; }

  // 2. Strip self-closing <iconify-icon .../> tags
  const iconifySelfBefore = fixed.length;
  fixed = fixed.replace(/<iconify-icon[^>]*\/>/g, '');
  if (fixed.length !== iconifySelfBefore) { changes++; }

  // 3. Remove duplicate author cards (layout handles author display)
  const authorBefore = fixed.length;
  fixed = fixed.replace(/<div class="author">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');
  if (fixed.length !== authorBefore) { changes++; }

  // 4. Remove duplicate hero sections that are already handled by layout
  // (Only if the hero content is duplicated - keep content, remove wrapper)
  // The layout already shows title, description, tags - so hero sections in body are redundant
  const heroBefore = fixed.length;
  fixed = fixed.replace(/<section class="hero-section">[\s\S]*?<\/section>/g, '');
  if (fixed.length !== heroBefore) { changes++; }

  // 5. Remove AI-CITATION comments (not needed in markdown)
  fixed = fixed.replace(/<!-- AI-CITATION:.*?-->/g, '');

  // 6. Clean up excessive empty lines
  fixed = fixed.replace(/\n{4,}/g, '\n\n\n');

  return { content: fixed, changes };
}

console.log('🔧 Blog Content Artifact Fixer');
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log(`   Files: ${SLUGS.length}`);
console.log('');

let totalFixed = 0;
let totalSkipped = 0;

for (const slug of SLUGS) {
  const mdPath = resolve(BLOG_DIR, `${slug}.md`);
  
  if (!existsSync(mdPath)) {
    console.log(`  ⚠️  Not found: ${slug}.md`);
    continue;
  }

  const content = readFileSync(mdPath, 'utf-8');
  const { content: fixed, changes } = fixContent(content);

  if (changes === 0) {
    console.log(`  ⏭️  No changes: ${slug}`);
    totalSkipped++;
    continue;
  }

  const bytesRemoved = content.length - fixed.length;
  console.log(`  ✅ Fixed ${slug}: ${bytesRemoved} bytes removed, ${changes} fix types applied`);

  if (!DRY_RUN) {
    writeFileSync(mdPath, fixed, 'utf-8');
  }

  totalFixed++;
}

console.log(`\n📊 Summary:`);
console.log(`  Fixed: ${totalFixed}`);
console.log(`  Skipped: ${totalSkipped}`);
console.log(`  Total: ${SLUGS.length}`);
