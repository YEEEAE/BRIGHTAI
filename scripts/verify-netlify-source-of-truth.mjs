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
  { from: '/blog/ai-guide-saudi-business', to: '/blog/ai-guide-saudi-business', status: 301 },
  { from: '/blog/nca-ai-compliance-saudi', to: '/blog/nca-ai-compliance-saudi', status: 301 },
];

for (const rule of requiredRedirects) {
  check(
    hasRedirect(rule.from, rule.to, rule.status),
    `redirect ${rule.from} -> ${rule.to} (${rule.status})`,
    `Missing redirect rule: ${JSON.stringify(rule)}`
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
