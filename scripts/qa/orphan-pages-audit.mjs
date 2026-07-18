#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Find all HTML files
const htmlFiles = glob.sync('**/*.html', {
  cwd: ROOT,
  ignore: ['node_modules/**', '.git/**', 'reports/**']
});

// Extract all internal links from all pages
const allLinks = new Set();
const pageUrls = new Set();

console.log('🔍 Scanning for internal links...\n');

for (const file of htmlFiles) {
  const filePath = path.join(ROOT, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Get the URL for this page
  let pageUrl = '/' + file.replace(/index\.html$/, '').replace(/\.html$/, '/');
  if (pageUrl === '//') pageUrl = '/';
  pageUrls.add(pageUrl);

  // Extract all href links
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    let link = match[1];

    // Skip external links, anchors, mailto, tel, etc.
    if (link.startsWith('http') || link.startsWith('//') ||
        link.startsWith('#') || link.startsWith('mailto:') ||
        link.startsWith('tel:') || link.startsWith('javascript:')) {
      continue;
    }

    // Normalize the link
    if (!link.startsWith('/')) {
      // Relative link - convert to absolute
      const dir = path.dirname(pageUrl);
      link = path.join(dir, link);
    }

    // Remove query strings and anchors
    link = link.split('?')[0].split('#')[0];

    // Ensure trailing slash for directories
    if (!link.endsWith('/') && !link.includes('.')) {
      link += '/';
    }

    allLinks.add(link);
  }
}

// Find orphan pages (pages that are not linked from anywhere)
const orphanPages = [];

for (const pageUrl of pageUrls) {
  // Skip the homepage
  if (pageUrl === '/') continue;

  // Check if this page is linked from anywhere
  if (!allLinks.has(pageUrl)) {
    orphanPages.push(pageUrl);
  }
}

// Sort orphan pages
orphanPages.sort();

// Generate report
console.log('📊 Orphan Pages Report\n');
console.log('='.repeat(60));
console.log(`Total Pages: ${pageUrls.size}`);
console.log(`Total Internal Links: ${allLinks.size}`);
console.log(`Orphan Pages: ${orphanPages.length}`);
console.log('='.repeat(60));

if (orphanPages.length > 0) {
  console.log('\n🔴 Orphan Pages (not linked from any other page):\n');
  orphanPages.forEach((page, index) => {
    console.log(`${index + 1}. ${page}`);
  });
} else {
  console.log('\n✅ No orphan pages found! All pages are linked.\n');
}

// Save report
const reportDir = path.join(ROOT, 'reports', 'internal-links');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportPath = path.join(reportDir, 'orphan-pages-report.md');
let reportContent = `# Orphan Pages Report

- Date: ${new Date().toISOString()}
- Total Pages: ${pageUrls.size}
- Total Internal Links: ${allLinks.size}
- Orphan Pages: ${orphanPages.length}

## Orphan Pages

`;

if (orphanPages.length > 0) {
  orphanPages.forEach((page, index) => {
    reportContent += `${index + 1}. ${page}\n`;
  });
} else {
  reportContent += 'No orphan pages found! ✅\n';
}

fs.writeFileSync(reportPath, reportContent, 'utf-8');
console.log(`\n📄 Report saved to: ${reportPath}\n`);
