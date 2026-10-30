#!/usr/bin/env node
/**
 * generate-image-sitemap.mjs
 * Generates public/sitemap-images.xml with all publicly accessible images.
 *
 * Collects from:
 *   - public/** (images served as-is)
 *   - public/assets/images/** (logo, og, screenshots)
 *   - dist/images/** (generated/processed images if dist exists)
 *
 * Output: public/sitemap-images.xml
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const SITE_URL = 'https://brightai.live';
const OUTPUT = 'public/sitemap-images.xml';
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.ico']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.agents', 'report', '.kilo', 'tests', 'badges', '_archive-old-badges']);

function walkDir(dir, results = [], rootDir = null) {
  if (!existsSync(dir)) return results;
  const base = rootDir || dir;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results, base);
    } else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

// Collect all image paths
const allImages = [];
walkDir('public', allImages);
walkDir('public/assets/images', allImages);
walkDir('dist/images', allImages);

// Build URL entries
const imageUrls = [];
const seen = new Set();

for (const filePath of allImages) {
  let relPath;

  if (filePath.startsWith('public/')) {
    relPath = '/' + relative('public', filePath).replace(/\\/g, '/');
  } else if (filePath.startsWith('public/assets/images/')) {
    relPath = '/assets/images/' + relative('public/assets/images', filePath).replace(/\\/g, '/');
  } else if (filePath.startsWith('dist/images/')) {
    relPath = '/' + relative('dist/images', filePath).replace(/\\/g, '/');
  } else {
    continue;
  }

  relPath = relPath.replace(/\/+/g, '/');
  if (seen.has(relPath)) continue;
  seen.add(relPath);

  const fileName = relPath.split('/').pop();
  if (fileName.startsWith('favicon-') || fileName.startsWith('android-chrome-') || fileName.startsWith('apple-touch-icon') || fileName.startsWith('mstile-')) {
    continue;
  }

  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  imageUrls.push({
    loc: SITE_URL + relPath,
    image: SITE_URL + relPath,
    title: title,
  });
}

// Escape XML special chars using char codes to avoid formatter issues
function esc(s) {
  return s
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026apos;');
}

const entries = imageUrls.map(u => {
  return '  <url>\n    <loc>' + u.loc + '</loc>\n    <image:image>\n      <image:loc>' + u.image + '</image:loc>\n      <image:title>' + esc(u.title) + '</image:title>\n    </image:image>\n  </url>';
}).join('\n');

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + entries + '\n</urlset>';

writeFileSync(OUTPUT, xml, 'utf-8');
console.log('Generated ' + OUTPUT + ' with ' + imageUrls.length + ' image URLs.');
