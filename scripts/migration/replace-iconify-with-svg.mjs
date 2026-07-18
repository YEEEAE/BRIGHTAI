#!/usr/bin/env node
/**
 * replace-iconify-with-svg.mjs
 * Step 9: Replace <iconify-icon icon="mdi:xxx"> with SVG sprite <svg class="icon"><use href="/icons.svg#mdi-xxx"/></svg>
 * Also removes iconify runtime <script> tags loading from code.iconify.design
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC_DIR = 'src';
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

function walkAstro(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkAstro(full));
    } else if (extname(entry.name) === '.astro') {
      files.push(full);
    }
  }
  return files;
}

function replaceIconifyTags(html) {
  // Replace <iconify-icon icon="mdi:xxx" ...>...</iconify-icon> with SVG sprite
  // Handle both self-closing and with content
  let result = html;
  
  // Pattern: <iconify-icon icon="mdi:xxx" class="yyy" style="zzz"></iconify-icon>
  // Pattern: <iconify-icon icon="mdi:xxx" class="yyy" style="zzz"></iconify-icon>
  // Pattern: <iconify-icon icon="mdi:xxx"></iconify-icon> (self-closing)
  // Pattern with dynamic props: <iconify-icon icon={xxx}> — these need special handling
  
  // First, handle STATIC icon attributes: icon="mdi:xxx"
  result = result.replace(
    /<iconify-icon\s+([^>]*?)icon="([^"]+)"([^>]*?)>\s*<\/iconify-icon>/g,
    (match, before, icon, after) => {
      const id = icon.replace(':', '-');
      // Extract class and style from before+after
      const allAttrs = before + after;
      const classMatch = allAttrs.match(/class="([^"]*)"/);
      const styleMatch = allAttrs.match(/style="([^"]*)"/);
      const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';
      const styleAttr = styleMatch ? ` style="${styleMatch[1]}"` : '';
      return `<svg${classAttr}${styleAttr} aria-hidden="true" width="1em" height="1em"><use href="/icons.svg#${id}"></use></svg>`;
    }
  );
  
  // Handle self-closing: <iconify-icon icon="mdi:xxx" ... />
  result = result.replace(
    /<iconify-icon\s+([^>]*?)icon="([^"]+)"([^>]*?)\/>/g,
    (match, before, icon, after) => {
      const id = icon.replace(':', '-');
      const allAttrs = before + after;
      const classMatch = allAttrs.match(/class="([^"]*)"/);
      const styleMatch = allAttrs.match(/style="([^"]*)"/);
      const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';
      const styleAttr = styleMatch ? ` style="${styleMatch[1]}"` : '';
      return `<svg${classAttr}${styleAttr} aria-hidden="true" width="1em" height="1em"><use href="/icons.svg#${id}"></use></svg>`;
    }
  );
  
  // Handle DYNAMIC icon attributes: icon={xxx} — convert to Icon component usage
  // These appear in .astro files as: <iconify-icon icon={sector.icon}>
  // We'll leave these as-is for now since they need the Icon component
  // Actually, we can convert them to use the Icon component inline
  result = result.replace(
    /<iconify-icon\s+([^>]*?)icon=\{([^}]+)\}([^>]*?)>/g,
    (match, before, expr, after) => {
      const allAttrs = before + after;
      const classMatch = allAttrs.match(/class="([^"]*)"/);
      const classMatch2 = allAttrs.match(/class=\{([^}]+)\}/);
      const styleMatch = allAttrs.match(/style="([^"]*)"/);
      const classVal = classMatch ? `"${classMatch[1]}"` : classMatch2 ? `{${classMatch2[1]}}` : '""';
      const styleAttr = styleMatch ? ` style="${styleMatch[1]}"` : '';
      // Keep as Icon component import
      return `<Icon name={${expr}} class=${classVal}${styleAttr} />`;
    }
  );
  
  return result;
}

function removeIconifyScripts(html) {
  // Remove <script src="https://code.iconify.design/..."> tags
  return html.replace(
    /\s*<script[^>]*src="https:\/\/code\.iconify\.design[^"]*"[^>]*><\/script>/g,
    ''
  );
}

const files = walkAstro(SRC_DIR);
let totalReplacements = 0;
let filesModified = 0;
let filesNeedingIconImport = [];

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;
  
  content = replaceIconifyTags(content);
  content = removeIconifyScripts(content);
  
  // Check if we introduced <Icon component usage and need to add import
  if (content.includes('<Icon ') && !content.includes("import Icon from")) {
    // Add Icon import at the top (after --- frontmatter)
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd > 0) {
      const importLine = "import Icon from '../components/Icon.astro';";
      // Check if it's a nested page
      const depth = file.split('/').length - 2; // relative depth from src/
      const importPath = depth > 1 ? '../../components/Icon.astro' : '../components/Icon.astro';
      
      // Only add import if we have Icon usage
      if (content.includes('<Icon ')) {
        // Find the last import line in frontmatter
        const frontmatter = content.slice(0, frontmatterEnd);
        const lastImportIdx = frontmatter.lastIndexOf('import ');
        if (lastImportIdx > 0) {
          const lineEnd = frontmatter.indexOf('\n', lastImportIdx);
          content = content.slice(0, lineEnd + 1) + 
            `\nimport Icon from '${importPath}';` + 
            content.slice(lineEnd);
        } else {
          content = content.slice(0, 4) + `\nimport Icon from '${importPath}';` + content.slice(4);
        }
        filesNeedingIconImport.push(file);
      }
    }
  }
  
  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    const diff = (original.match(/iconify-icon/g) || []).length;
    totalReplacements += diff;
    filesModified++;
    console.log(`  Updated ${file} (${diff} replacements)`);
  }
}

console.log(`\n--- Summary ---`);
console.log(`Files scanned: ${files.length}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total iconify-icon references replaced: ${totalReplacements}`);
console.log(`Files needing Icon import: ${filesNeedingIconImport.length}`);
