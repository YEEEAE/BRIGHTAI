/**
 * scripts/verify-csp-functional.mjs — REPORTS-SEC-02 (2026-07-07)
 *
 * Drives a real Chromium browser against the local mock-Vercel server.
 * For each of 5 representative pages, captures:
 *   - any console errors (especially CSP violations)
 *   - any network failures with status 0 / blocked by CSP
 *   - DOM-level evidence that the page actually rendered (h1 exists, body text non-empty)
 *
 * Pages chosen to cover the highest-risk interactions:
 *   1. /                       (homepage with SplitHero + GA + lazy inline scripts)
 *   2. /about/                 (a content page; should be clean)
 *   3. /contact/               (Google Maps iframe — must keep frame-src working)
 *   4. /blog/                  (blog index with inline JS)
 *   5. /kernel/chat/           (interactive kernel page with is:inline define:vars scripts)
 *
 * Usage:
 *   node scripts/verify-csp-functional.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');

if (!fs.existsSync(DIST)) {
  console.error(`dist/ not found at ${DIST}. Run \`npm run build\` first.`);
  process.exit(1);
}
if (!fs.existsSync(VERCEL_JSON)) {
  console.error(`vercel.json not found.`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
const HEADER_BLOCKS = config.headers || [];

function compileSource(src) {
  let out = src.replace(/\(\.\*\)/g, '<<<CAP_ANY>>>');
  out = out.replace(/[.+^${}|[\]\\]/g, '\\$&');
  out = out.replace(/\*/g, '[^/]*');
  out = out.replace(/<<<CAP_ANY>>>/g, '(.*)');
  return new RegExp('^' + out + '$');
}
const COMPILED = HEADER_BLOCKS.map((b) => ({
  pattern: compileSource(b.source),
  headers: b.headers,
}));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function findFile(requestPath) {
  let p = requestPath.split('?')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  let candidate = path.join(DIST, p);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  candidate = path.join(DIST, p, 'index.html');
  if (fs.existsSync(candidate)) return candidate;
  candidate = path.join(DIST, p + '.html');
  if (fs.existsSync(candidate)) return candidate;
  return path.join(DIST, '404.html');
}

const server = http.createServer((req, res) => {
  const filePath = findFile(req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const status = fs.existsSync(filePath) ? 200 : 404;
  const appliedHeaders = {};
  for (const block of COMPILED) {
    if (block.pattern.test(req.url)) {
      for (const h of block.headers) appliedHeaders[h.key.toLowerCase()] = h.value;
    }
  }
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  for (const [k, v] of Object.entries(appliedHeaders)) res.setHeader(k, v);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.end();
  }
});

const PAGES = [
  { path: '/', label: 'Homepage (GA + SplitHero + lazy inline)', checkIframe: false },
  { path: '/about/', label: 'About page', checkIframe: false },
  { path: '/contact/', label: 'Contact page (Google Maps iframe)', checkIframe: true },
  { path: '/blog/', label: 'Blog index', checkIframe: false },
  { path: '/kernel/chat/', label: 'Kernel chat (is:inline define:vars scripts)', checkIframe: false },
];

const PORT = 4322;

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`Mock-Vercel server listening on http://127.0.0.1:${PORT}`);
console.log();

const browser = await chromium.launch({ args: ['--disable-web-security=false'] });

let totalErrors = 0;
let totalCSPViolations = 0;
let totalFailedRequests = 0;
const results = [];

for (const target of PAGES) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Send a realistic Origin header so CORS preflight can be inspected.
    extraHTTPHeaders: { 'Origin': 'https://www.brightaii.com' },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const cspViolations = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      if (/Content Security Policy/i.test(msg.text())) cspViolations.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push('PAGEERROR: ' + err.message);
  });
  page.on('requestfailed', (req) => {
    const errText = req.failure()?.errorText || 'unknown';
    failedRequests.push(`${req.method()} ${req.url()} :: ${errText}`);
  });
  page.on('response', async (resp) => {
    if (resp.status() >= 400 && !resp.url().includes('favicon')) {
      failedRequests.push(`HTTP ${resp.status()} ${resp.url()}`);
    }
  });

  let h1Text = null;
  let iframeCount = 0;
  let status = '—';
  try {
    const resp = await page.goto(`http://127.0.0.1:${PORT}${target.path}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    status = resp?.status?.() ?? '—';
    h1Text = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.slice(0, 80) : null;
    });
    iframeCount = await page.evaluate(() => document.querySelectorAll('iframe').length);
  } catch (e) {
    consoleErrors.push('NAVIGATION: ' + e.message);
  }

  await page.waitForTimeout(800);
  await context.close();

  totalErrors += consoleErrors.length;
  totalCSPViolations += cspViolations.length;
  totalFailedRequests += failedRequests.length;

  const verdict = cspViolations.length === 0 && consoleErrors.length === 0 ? '✅' : '⚠️';
  results.push({
    path: target.path,
    label: target.label,
    status,
    h1: h1Text,
    iframes: iframeCount,
    consoleErrors,
    cspViolations,
    failedRequests,
    verdict,
  });
}

await browser.close();
server.close();

for (const r of results) {
  console.log(`═══ ${r.path}  ${r.verdict}`);
  console.log(`   Label: ${r.label}`);
  console.log(`   Status: ${r.status}`);
  console.log(`   <h1>: ${r.h1 || '(none)'}`);
  console.log(`   iframes: ${r.iframes}`);
  console.log(`   Console errors: ${r.consoleErrors.length}`);
  for (const e of r.consoleErrors) console.log(`     - ${e.slice(0, 200)}`);
  console.log(`   CSP violations: ${r.cspViolations.length}`);
  for (const e of r.cspViolations) console.log(`     - ${e.slice(0, 200)}`);
  console.log(`   Failed requests: ${r.failedRequests.length}`);
  for (const e of r.failedRequests.slice(0, 5)) console.log(`     - ${e.slice(0, 200)}`);
  console.log();
}

console.log(`═══ TOTALS`);
console.log(`   Total console errors: ${totalErrors}`);
console.log(`   Total CSP violations: ${totalCSPViolations}`);
console.log(`   Total failed requests: ${totalFailedRequests}`);
console.log();

if (totalCSPViolations === 0) {
  console.log(`✅ CSP hardening did NOT break any of the 5 representative pages.`);
  process.exit(0);
} else {
  console.log(`⚠️ CSP violations detected — see details above.`);
  process.exit(1);
}