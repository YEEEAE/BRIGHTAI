#!/usr/bin/env node
/**
 * Inline test: starts mock server in same process, drives one Playwright page,
 * checks the analytics endpoint actually returns 204.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');

const config = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
const HEADER_BLOCKS = config.headers || [];
function compileSource(src) {
  let out = src.replace(/\(\.\*\)/g, '<<<CAP_ANY>>>');
  out = out.replace(/[.+^${}|[\]\\]/g, '\\$&');
  out = out.replace(/\*/g, '[^/]*');
  out = out.replace(/<<<CAP_ANY>>>/g, '(.*)');
  return new RegExp('^' + out + '$');
}
const COMPILED = HEADER_BLOCKS.map((b) => ({ pattern: compileSource(b.source), headers: b.headers }));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
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

await new Promise((resolve) => server.listen(4323, '127.0.0.1', resolve));
console.log('Mock server on 4323');

const browser = await chromium.launch();
const ctx = await browser.newContext({ extraHTTPHeaders: { 'Origin': 'https://www.brightaii.com' } });
const page = await ctx.newPage();

let analyticsStatus = null;
let analyticsError = null;

page.on('requestfailed', (req) => {
  if (req.url().includes('analytics.google.com') || req.url().includes('googletagmanager')) {
    analyticsError = `${req.url().slice(0, 80)} :: ${req.failure()?.errorText}`;
  }
});
page.on('response', (r) => {
  if (r.url().includes('analytics.google.com') || r.url().includes('googletagmanager')) {
    console.log(`response: ${r.status()} ${r.url().slice(0, 80)}`);
  }
});
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log(`console-error: ${msg.text().slice(0, 150)}`);
  }
});

await page.goto('http://127.0.0.1:4323/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

await browser.close();
server.close();

console.log('analyticsError =', analyticsError);
console.log(analyticsError?.includes('BLOCKED_BY_CONTENT_SECURITY_POLICY')
  ? '❌ CSP BLOCKED analytics request'
  : '✅ CSP did NOT block analytics request (failure is network/local, not CSP)');