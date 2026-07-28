#!/usr/bin/env node

/**
 * Orphan Pages Audit — checks built HTML pages for incoming internal links.
 *
 * Scope: dist/client/ only. This avoids counting source fixtures as published pages.
 * Exit 0 when no orphan pages exist; exit 1 when orphan pages are found.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const distClient = path.join(root, 'dist', 'client');

if (!fs.existsSync(distClient)) {
  console.error('❌ dist/client/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = globSync('**/*.html', {
  cwd: distClient,
  ignore: ['**/* 2.html', '**/* 2/**'],
});
const pages = new Set();
const incoming = new Map();

const routeFromFile = (file) => {
  let route = `/${file.replace(/index\.html$/, '').replace(/\.html$/, '')}`;
  if (route === '/') return route;
  if (!route.endsWith('/')) route += '/';
  return route;
};

const normalizeRoute = (value, pageRoute) => {
  if (!value || value.startsWith('http') || value.startsWith('//') || value.startsWith('#') ||
      value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) {
    return null;
  }

  const withoutQuery = value.split('?')[0].split('#')[0];
  const absolute = withoutQuery.startsWith('/')
    ? withoutQuery
    : path.posix.join(path.posix.dirname(pageRoute), withoutQuery);
  const normalized = path.posix.normalize(absolute);
  if (normalized === '/') return normalized;
  if (path.posix.extname(normalized)) return normalized;
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

for (const file of htmlFiles) {
  const pageRoute = routeFromFile(file);
  pages.add(pageRoute);
  incoming.set(pageRoute, 0);
}

for (const file of htmlFiles) {
  const pageRoute = routeFromFile(file);
  const html = fs.readFileSync(path.join(distClient, file), 'utf8');
  for (const [, href] of html.matchAll(/href=["']([^"']+)["']/g)) {
    const target = normalizeRoute(href, pageRoute);
    if (target && pages.has(target)) incoming.set(target, (incoming.get(target) ?? 0) + 1);
  }
}

const orphanPages = [...pages].filter((route) => route !== '/' && (incoming.get(route) ?? 0) === 0).sort();
const underlinkedPages = [...pages].filter((route) => route !== '/' && (incoming.get(route) ?? 0) < 2).sort();

console.log(`Pages scanned: ${pages.size}`);
console.log(`Orphan pages: ${orphanPages.length}`);
console.log(`Pages with fewer than 2 incoming links: ${underlinkedPages.length}`);

if (orphanPages.length) {
  console.log('\nOrphan pages:');
  orphanPages.forEach((route) => console.log(`- ${route}`));
}
if (underlinkedPages.length) {
  console.log('\nUnder-linked pages:');
  underlinkedPages.forEach((route) => console.log(`- ${route} (${incoming.get(route)} incoming)`));
}

const reportDir = path.join(root, 'reports', 'internal-links');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'orphan-pages-report.md'), [
  '# Orphan Pages Report',
  '',
  `- Source: dist/client/`,
  `- Pages scanned: ${pages.size}`,
  `- Orphan pages: ${orphanPages.length}`,
  `- Pages with fewer than 2 incoming links: ${underlinkedPages.length}`,
  '',
  '## Orphan Pages',
  orphanPages.length ? orphanPages.map((route) => `- ${route}`).join('\n') : 'None',
  '',
  '## Under-linked Pages',
  underlinkedPages.length ? underlinkedPages.map((route) => `- ${route} (${incoming.get(route)} incoming)`).join('\n') : 'None',
  '',
].join('\n'), 'utf8');

process.exit(orphanPages.length ? 1 : 0);
