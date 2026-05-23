import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/yzydalshmry/Desktop/BRIGHTAI';

function getHtmlFiles(dir, maxDepth = 5, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
        results.push(...getHtmlFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch (e) { /* skip */ }
  return results;
}

const files = getHtmlFiles(ROOT, 3);
let fixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;

  // Add analytics attrs to WhatsApp links that don't have them
  content = content.replace(
    /<a\s([^>]*?)href="https:\/\/api\.whatsapp\.com\/send\?phone=966538229013([^"]*)"([^>]*)>/g,
    function(match, before, query, after, offset) {
      if (match.includes('data-analytics-event')) return match;
      // Determine section from context (look back ~300 chars)
      const context = content.slice(Math.max(0, offset - 300), offset);
      let section = 'in-content';
      if (context.includes('nav-cta') || context.includes('navbar') || context.includes('desktop-menu') || context.includes('cta-desktop')) {
        section = 'navbar';
      } else if (match.includes('sitewide-cta') || context.includes('footer')) {
        section = 'footer';
      }
      return `<a ${before}href="https://api.whatsapp.com/send?phone=966538229013${query}"${after} data-analytics-event="whatsapp_click" data-cta-location="${section}">`;
    }
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    fixed++;
    console.log(`  ✅ ${file.replace(ROOT, '')}`);
  }
}

console.log(`\nFixed WhatsApp links in ${fixed} files`);
