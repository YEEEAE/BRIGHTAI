#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function nonCommentLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function parseBlocks(content, blockName) {
  const marker = `[[${blockName}]]`;
  const parts = content.split(marker);
  return parts.slice(1).map((part) => `${marker}${part}`);
}

function extractString(block, key) {
  const match = block.match(new RegExp(`^\\s*${key}\\s*=\\s*"(.*)"\\s*$`, 'm'));
  return match ? match[1] : null;
}

function extractNumber(block, key) {
  const match = block.match(new RegExp(`^\\s*${key}\\s*=\\s*(\\d+)\\s*$`, 'm'));
  return match ? Number(match[1]) : null;
}

function headerHasKey(block, key) {
  return new RegExp(`^\\s*${key}\\s*=`, 'm').test(block);
}

function headerHasExactValue(block, key, expectedValue) {
  const match = block.match(new RegExp(`^\\s*${key}\\s*=\\s*"(.*)"\\s*$`, 'm'));
  return Boolean(match) && match[1] === expectedValue;
}

const checks = [];

function check(ok, name, details = '') {
  checks.push({ ok, name, details });
}

const htaccess = readFile('.htaccess');
const headersFile = readFile('_headers');
const netlifyToml = readFile('netlify.toml');

check(
  htaccess.includes('ARCHIVED FILE (NOT USED IN PRODUCTION)'),
  '.htaccess is archived',
  'Missing archive marker in .htaccess'
);

check(
  headersFile.includes('ARCHIVED FILE (NOT USED IN PRODUCTION)'),
  '_headers is archived',
  'Missing archive marker in _headers'
);

check(
  nonCommentLines(htaccess).length === 0,
  '.htaccess has no active directives',
  'Found non-comment lines in .htaccess'
);

check(
  nonCommentLines(headersFile).length === 0,
  '_headers has no active directives',
  'Found non-comment lines in _headers'
);

check(
  netlifyToml.includes('Netlify is the only production source of truth'),
  'netlify.toml marked as source of truth',
  'Missing source-of-truth marker in netlify.toml'
);

const redirectBlocks = parseBlocks(netlifyToml, 'redirects').map((block) => ({
  from: extractString(block, 'from'),
  to: extractString(block, 'to'),
  status: extractNumber(block, 'status'),
}));

function hasRedirect(from, to, status) {
  return redirectBlocks.some(
    (redirect) =>
      redirect.from === from && redirect.to === to && redirect.status === status
  );
}

const requiredRedirects = [
  { from: '/api/*', to: '/.netlify/functions/all', status: 200 },
  { from: '/sitemap.html', to: '/sitemap', status: 301 },
  { from: '/terms.html', to: '/terms', status: 301 },
  { from: '/offline.html', to: '/offline', status: 301 },
  { from: '/index.html', to: '/', status: 301 },
  { from: '/blog/:slug', to: '/frontend/pages/blogger/:slug.html', status: 200 },
  { from: '/blog/automation/:slug', to: '/frontend/pages/blog/automation/:slug.html', status: 200 },
  { from: '/blog/data-analytics/:slug', to: '/frontend/pages/blog/data-analytics/:slug.html', status: 200 },
];

const disallowedDirectoryLoopRedirects = [
  { from: '/about/', to: '/about', status: 301 },
  { from: '/services/', to: '/services', status: 301 },
  { from: '/contact/', to: '/contact', status: 301 },
  { from: '/blog/', to: '/blog', status: 301 },
  { from: '/ai-agent/', to: '/ai-agent', status: 301 },
  { from: '/ai-bots/', to: '/ai-bots', status: 301 },
  { from: '/data-analysis/', to: '/data-analysis', status: 301 },
  { from: '/consultation/', to: '/consultation', status: 301 },
  { from: '/smart-automation/', to: '/smart-automation', status: 301 },
  { from: '/case-studies/', to: '/case-studies', status: 301 },
  { from: '/what-is-ai/', to: '/what-is-ai', status: 301 },
  { from: '/partners/', to: '/partners', status: 301 },
  { from: '/tools/', to: '/tools', status: 301 },
  { from: '/health/', to: '/health', status: 301 },
  { from: '/machine-learning/', to: '/machine-learning', status: 301 },
  { from: '/docs/', to: '/docs', status: 301 },
  { from: '/docs/:slug/', to: '/docs/:slug', status: 301 },
];

for (const rule of requiredRedirects) {
  check(
    hasRedirect(rule.from, rule.to, rule.status),
    `redirect ${rule.from} -> ${rule.to} (${rule.status})`,
    `Missing redirect rule: ${JSON.stringify(rule)}`
  );
}

for (const rule of disallowedDirectoryLoopRedirects) {
  check(
    !hasRedirect(rule.from, rule.to, rule.status),
    `directory loop redirect absent for ${rule.from} -> ${rule.to} (${rule.status})`,
    `Risky redirect loop rule still present: ${JSON.stringify(rule)}`
  );
}

const headerBlocks = parseBlocks(netlifyToml, 'headers').map((block) => ({
  forPath: extractString(block, 'for'),
  block,
}));

function getHeaderBlock(forPath) {
  return headerBlocks.find((item) => item.forPath === forPath)?.block ?? '';
}

const securityBlock = getHeaderBlock('/*');
const htmlBlock = getHeaderBlock('/*.html');
const assetsBlock = getHeaderBlock('/assets/*');
const swBlock = getHeaderBlock('/sw.js');
const frontendPagesBlock = getHeaderBlock('/frontend/pages/*');

const requiredPublicHeaderPaths = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/blog',
  '/ai-agent',
  '/ai-bots',
  '/data-analysis',
  '/consultation',
  '/smart-automation',
  '/case-studies',
  '/what-is-ai',
  '/partners',
  '/health',
  '/machine-learning',
  '/blog/*',
];

const requiredNoindexHeaderPaths = [
  '/tools',
  '/docs',
  '/ai-workflows',
  '/ai-scolecs',
  '/smart-medical-archive',
  '/job.MAISco',
  '/try',
  '/demo',
  '/demo/pricing',
  '/interview',
  '/privacy-cookies',
  '/terms',
  '/sitemap',
  '/offline',
  '/docs/*',
  '/ai-bots/*',
  '/try/*',
  '/demo/*',
  '/interview/*',
  '/sectors/*',
];

check(
  securityBlock.length > 0,
  'security header block exists for /*',
  'Missing [[headers]] block for /*'
);

for (const key of [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Content-Security-Policy',
]) {
  check(
    headerHasKey(securityBlock, key),
    `security header contains ${key}`,
    `Missing ${key} in /* headers block`
  );
}

check(
  htmlBlock.length > 0 && headerHasKey(htmlBlock, 'Cache-Control'),
  'HTML cache policy exists',
  'Missing Cache-Control in /*.html headers block'
);

check(
  htmlBlock.length > 0 && headerHasKey(htmlBlock, 'X-Robots-Tag'),
  'HTML X-Robots-Tag exists',
  'Missing X-Robots-Tag in /*.html headers block'
);

check(
  assetsBlock.length > 0 && headerHasKey(assetsBlock, 'Cache-Control'),
  'asset cache policy exists',
  'Missing Cache-Control in /assets/* headers block'
);

check(
  swBlock.length > 0 &&
    headerHasKey(swBlock, 'Cache-Control') &&
    headerHasKey(swBlock, 'Service-Worker-Allowed'),
  'service worker headers exist',
  'Missing sw.js Cache-Control or Service-Worker-Allowed'
);

for (const headerPath of requiredPublicHeaderPaths) {
  const block = getHeaderBlock(headerPath);
  check(
    block.length > 0,
    `public header block exists for ${headerPath}`,
    `Missing [[headers]] block for ${headerPath}`
  );
  check(
    block.length > 0 && headerHasExactValue(block, 'Cache-Control', 'public, max-age=0, must-revalidate'),
    `public cache policy matches for ${headerPath}`,
    `Missing or incorrect Cache-Control for ${headerPath}`
  );
  if (headerPath !== '/') {
    check(
      block.length > 0 && headerHasExactValue(block, 'X-Robots-Tag', 'index,follow'),
      `public robots policy matches for ${headerPath}`,
      `Missing or incorrect X-Robots-Tag for ${headerPath}`
    );
  }
}

for (const headerPath of requiredNoindexHeaderPaths) {
  const block = getHeaderBlock(headerPath);
  check(
    block.length > 0,
    `noindex header block exists for ${headerPath}`,
    `Missing [[headers]] block for ${headerPath}`
  );
  check(
    block.length > 0 && headerHasExactValue(block, 'Cache-Control', 'public, max-age=0, must-revalidate'),
    `noindex cache policy matches for ${headerPath}`,
    `Missing or incorrect Cache-Control for ${headerPath}`
  );
  check(
    block.length > 0 && headerHasExactValue(block, 'X-Robots-Tag', 'noindex,nofollow,noarchive'),
    `noindex robots policy matches for ${headerPath}`,
    `Missing or incorrect X-Robots-Tag for ${headerPath}`
  );
}

check(
  frontendPagesBlock.length > 0 && headerHasExactValue(frontendPagesBlock, 'X-Robots-Tag', 'noindex,nofollow,noarchive'),
  'frontend/pages stay noindex',
  'Missing or incorrect X-Robots-Tag for /frontend/pages/*'
);

check(
  fs.existsSync(path.join(root, 'docs/deployment-archive/.htaccess.legacy')),
  'legacy .htaccess archive exists',
  'Missing docs/deployment-archive/.htaccess.legacy'
);

check(
  fs.existsSync(path.join(root, 'docs/deployment-archive/_headers.legacy')),
  'legacy _headers archive exists',
  'Missing docs/deployment-archive/_headers.legacy'
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  const mark = item.ok ? 'PASS' : 'FAIL';
  console.log(`${mark} - ${item.name}`);
  if (!item.ok && item.details) {
    console.log(`  ${item.details}`);
  }
}

if (failed.length > 0) {
  console.error(`\nSource-of-truth validation failed (${failed.length} check(s)).`);
  process.exit(1);
}

console.log(`\nSource-of-truth validation passed (${checks.length} checks).`);
