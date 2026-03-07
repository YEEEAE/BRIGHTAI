#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import CleanCSS from 'clean-css';
import { minify as terserMinify } from 'terser';

const root = process.cwd();
const publishDir = path.join(root, '.netlify-publish');

const entriesToCopy = [
  '404.html',
  '500.html',
  'about',
  'ahrefs_540816f77eec3c6bccb64458a16cfa022c451cb1dd0d49a48d47d3ea108058ee',
  'ai-agent',
  'ai-bots',
  'assets',
  'blog',
  'case-studies',
  'consultation',
  'contact',
  'data-analysis',
  'docs',
  'docs.html',
  'frontend',
  'health',
  'index.html',
  'llms.txt',
  'machine-learning',
  'manifest.json',
  'partners',
  'robots.txt',
  'schema-saudi-seo.json',
  'services',
  'sitemap.xml',
  'smart-automation',
  'sw.js',
  'tools',
  'what-is-ai'
];

const ASSET_MINIFY_PLAN = [
  { type: 'css', source: 'assets/css/extracted-inline-styles.css', target: 'assets/css/extracted-inline-styles.min.css' },
  { type: 'css', source: 'frontend/css/bundle-critical.css', target: 'frontend/css/bundle-critical.min.css' },
  { type: 'css', source: 'frontend/css/bundle-pages.css', target: 'frontend/css/bundle-pages.min.css' },
  { type: 'css', source: 'frontend/css/docs.css', target: 'frontend/css/docs.min.css' },
  { type: 'css', source: 'frontend/css/unified-nav-search.css', target: 'frontend/css/unified-nav-search.min.css' },
  { type: 'css', source: 'frontend/css/main.bundle.css', target: 'frontend/css/main.bundle.min.css' },
  { type: 'css', source: 'frontend/css/index-theme.css', target: 'frontend/css/index-theme.min.css' },
  { type: 'js', source: 'frontend/js/article-ux-enhancements.js', target: 'frontend/js/article-ux-enhancements.min.js' },
  { type: 'js', source: 'frontend/js/clarity-events.js', target: 'frontend/js/clarity-events.min.js' },
  { type: 'js', source: 'frontend/js/docs-scripts.js', target: 'frontend/js/docs-scripts.min.js' },
  { type: 'js', source: 'frontend/js/index-theme.js', target: 'frontend/js/index-theme.min.js' },
  { type: 'js', source: 'frontend/js/main.bundle.js', target: 'frontend/js/main.bundle.min.js' },
  { type: 'js', source: 'frontend/js/navigation.js', target: 'frontend/js/navigation.min.js' },
  { type: 'js', source: 'frontend/js/sentry-init.js', target: 'frontend/js/sentry-init.min.js' }
];

const REMOVABLE_EXTERNAL_SCRIPT_PATTERNS = [
  /<script[\s\S]*?src=["']https:\/\/js\.sentry-cdn\.com\/[^"']+["'][\s\S]*?<\/script>\s*/gi,
  /<script[\s\S]*?src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"']+["'][\s\S]*?<\/script>\s*/gi
];

const LEGACY_ROUTE_REPLACEMENTS = [
  ['/smart-medical-archive', '/health'],
  ['/job.MAISco', '/ai-bots'],
  ['/ai-scolecs', '/services'],
  ['/ai-workflows', '/smart-automation'],
  ['/try', '/tools'],
  ['/demo/pricing', '/services'],
  ['/demo', '/tools'],
  ['/interview', '/consultation']
];

const LEGACY_EXTERNAL_REPLACEMENTS = [
  ['https://d.top4top.io/p_33458j6zm1.png', 'https://brightai.site/assets/images/Gemini.png'],
  ['https://www2.0zz0.com/2025/06/23/22/317775783.png', 'https://brightai.site/assets/images/Gemini.png'],
  ['https://www2.0zz0.com/2025/07/11/04/899155430.png', 'https://brightai.site/assets/images/Gemini.png'],
  ['https://www2.0zz0.com/2025/07/12/12/475874739.png', 'https://brightai.site/assets/images/Gemini.png'],
  ['https://www2.0zz0.com/2025/07/28/09/699905019.png', 'https://brightai.site/assets/images/Gemini.png'],
  ['https://www.instagram.com/iililil44', 'https://www.linkedin.com/company/brightai-saudi'],
  ['https://www.youtube.com/@TeechLab', 'https://www.youtube.com/@BrightAiSaudi'],
  ['https://x.com/BrightAIII', 'https://x.com/brightai_sa'],
  ['https://www.tiktok.com/@bright1ai', 'https://x.com/brightai_sa']
];

const PAGE_SPECIFIC_REWRITES = [
  {
    test: (file) => file.endsWith('/ai-bots/index.html'),
    transform: (html) => html
      .replaceAll('https://d.top4top.io/p_33458j6zm1.png', 'https://brightai.site/assets/images/Gemini.png')
      .replaceAll('https://www2.0zz0.com/2025/06/23/22/317775783.png', 'https://brightai.site/assets/images/Gemini.png')
      .replaceAll('https://www.instagram.com/iililil44', 'https://www.linkedin.com/company/brightai-saudi')
      .replaceAll('https://www.youtube.com/@TeechLab', 'https://www.youtube.com/@BrightAiSaudi')
      .replaceAll('https://www.tiktok.com/@bright1ai', 'https://x.com/brightai_sa')
      .replace(
        /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@graph": \[[\s\S]*?<\/script>\s*/i,
        ''
      ),
  },
  {
    test: (file) => file.endsWith('/services/index.html'),
    transform: (html) => html
      .replace(
        /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "ItemList",[\s\S]*?<\/script>\s*/i,
        ''
      )
      .replace('<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>\n', '')
      .replace('<style type="text/tailwindcss">', '<style>'),
  },
  {
    test: (file) => file.endsWith('/index.html'),
    transform: (html) => html
      .replace(
        /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "WebSite",[\s\S]*?<\/script>\s*/i,
        ''
      )
      .replace(
        /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "SoftwareApplication",[\s\S]*?<\/script>\s*/i,
        ''
      )
      .replace(
        /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "HowTo",[\s\S]*?<\/script>\s*/i,
        ''
      )
      .replace(
        /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "ItemList",\s*"name": "خدمات Bright AI للذكاء الاصطناعي",[\s\S]*?<\/script>\s*/i,
        ''
      ),
  },
];

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dirPath, matcher) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath, matcher)));
      continue;
    }
    if (entry.isFile() && matcher(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function preserveQueryReplacement(html, fromPath, toPath) {
  const escaped = fromPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}(\\?[^"'\\s>]*)?`, 'g');
  return html.replace(pattern, (_, query = '') => `${toPath}${query}`);
}

function rewriteLegacyRoutes(html) {
  let updated = html;
  for (const [fromPath, toPath] of LEGACY_ROUTE_REPLACEMENTS) {
    updated = preserveQueryReplacement(updated, fromPath, toPath);
    updated = updated.replaceAll(`https://brightai.site${fromPath}`, `https://brightai.site${toPath}`);
  }
  for (const [fromUrl, toUrl] of LEGACY_EXTERNAL_REPLACEMENTS) {
    updated = updated.replaceAll(fromUrl, toUrl);
  }
  return updated;
}

function minifyHtml(html) {
  return html
    .replace(/<!--(?!\[if[\s\S]*?endif\]-->)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function writeMinifiedAsset(plan) {
  const sourcePath = path.join(publishDir, plan.source);
  if (!(await exists(sourcePath))) {
    return;
  }

  const original = await fs.readFile(sourcePath, 'utf8');
  let minified = original;

  if (plan.type === 'css') {
    const result = new CleanCSS({ level: 2 }).minify(original);
    if (result.errors.length > 0) {
      throw new Error(`CSS minify failed for ${plan.source}: ${result.errors.join('; ')}`);
    }
    minified = result.styles;
  } else {
    const result = await terserMinify(original, {
      compress: true,
      mangle: true,
      format: {
        comments: false,
      },
    });
    if (!result.code) {
      throw new Error(`JS minify failed for ${plan.source}`);
    }
    minified = result.code;
  }

  await fs.mkdir(path.dirname(path.join(publishDir, plan.target)), { recursive: true });
  await fs.writeFile(path.join(publishDir, plan.target), minified, 'utf8');
}

async function rewriteHtmlAssetReferences() {
  const htmlFiles = await walkFiles(publishDir, (file) => file.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    let html = await fs.readFile(htmlFile, 'utf8');
    let updated = html;

    for (const pattern of REMOVABLE_EXTERNAL_SCRIPT_PATTERNS) {
      updated = updated.replace(pattern, '');
    }

    for (const plan of ASSET_MINIFY_PLAN) {
      updated = preserveQueryReplacement(updated, `/${plan.source}`, `/${plan.target}`);
    }

    updated = rewriteLegacyRoutes(updated);

    for (const rewrite of PAGE_SPECIFIC_REWRITES) {
      if (rewrite.test(htmlFile)) {
        updated = rewrite.transform(updated);
      }
    }

    updated = minifyHtml(updated);

    if (updated !== html) {
      await fs.writeFile(htmlFile, updated, 'utf8');
    }
  }
}

function isGenericTextArtifact(filePath) {
  return [
    '.js',
    '.json',
    '.txt',
    '.xml',
    '.css',
  ].some((ext) => filePath.endsWith(ext));
}

async function rewriteGenericTextArtifacts() {
  const textFiles = await walkFiles(
    publishDir,
    (file) => isGenericTextArtifact(file) && !file.endsWith('.html')
  );

  for (const textFile of textFiles) {
    const original = await fs.readFile(textFile, 'utf8');
    const updated = rewriteLegacyRoutes(original);
    if (updated !== original) {
      await fs.writeFile(textFile, updated, 'utf8');
    }
  }
}

async function main() {
  await fs.rm(publishDir, { recursive: true, force: true });
  await fs.mkdir(publishDir, { recursive: true });

  for (const entry of entriesToCopy) {
    const source = path.join(root, entry);
    const destination = path.join(publishDir, entry);
    if (!(await exists(source))) {
      continue;
    }

    await fs.cp(source, destination, { recursive: true, force: true });
  }

  for (const plan of ASSET_MINIFY_PLAN) {
    await writeMinifiedAsset(plan);
  }

  await rewriteHtmlAssetReferences();
  await rewriteGenericTextArtifacts();

  console.log(`Prepared Netlify publish directory: ${publishDir}`);
}

main().catch((error) => {
  console.error('Failed to prepare Netlify publish directory.');
  console.error(error);
  process.exit(1);
});
