#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

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

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
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

  console.log(`Prepared Netlify publish directory: ${publishDir}`);
}

main().catch((error) => {
  console.error('Failed to prepare Netlify publish directory.');
  console.error(error);
  process.exit(1);
});
