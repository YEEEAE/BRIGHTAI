/**
 * scripts/verify-vercel-headers.mjs — REPORTS-SEC-02 (2026-07-07)
 *
 * Local server that mirrors how Vercel applies vercel.json headers:
 *   - Serves dist/ as static files.
 *   - For each request, evaluates vercel.json `headers[].source` patterns
 *     in declaration order and applies matching headers.
 *   - Prints Response Headers for the path passed via CLI.
 *
 * Usage:
 *   node scripts/verify-vercel-headers.mjs <path1> [<path2> ...]
 *   node scripts/verify-vercel-headers.mjs / /about/ /contact/ /api/ai/chat
 *
 * Exits 0 on success. This script does NOT fail on missing headers —
 * the operator visually inspects the printed table.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');

if (!fs.existsSync(DIST)) {
  console.error(`dist/ not found at ${DIST}. Run \`npm run build\` first.`);
  process.exit(1);
}
if (!fs.existsSync(VERCEL_JSON)) {
  console.error(`vercel.json not found at ${VERCEL_JSON}.`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
const HEADER_BLOCKS = config.headers || [];

// Compile source patterns to RegExp. Vercel source patterns use POSIX-style
// globs. We translate each known pattern by hand to keep behaviour obvious
// and predictable — we don't try to be a general Vercel-pattern engine.
function compileSource(src) {
  // Step 1: replace `(.*)` (Vercel's "match anything" placeholder) with `(.*)`
  // BEFORE we escape any regex specials. We must do this on the raw source.
  // Step 2: escape regex specials except `*` and `(` `)`.
  // Step 3: replace standalone `*` with `[^/]*` (match zero-or-more path-segment chars).
  // Step 4: anchor with `^...$`.
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
  // Trim trailing slash (except root)
  let p = requestPath.split('?')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  // 1) Direct file under dist/
  let candidate = path.join(DIST, p);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  // 2) With trailing slash + index.html
  candidate = path.join(DIST, p, 'index.html');
  if (fs.existsSync(candidate)) return candidate;

  // 3) With .html appended
  candidate = path.join(DIST, p + '.html');
  if (fs.existsSync(candidate)) return candidate;

  // 4) 404 fallback
  return path.join(DIST, '404.html');
}

const server = http.createServer((req, res) => {
  const filePath = findFile(req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const status = fs.existsSync(filePath) ? 200 : 404;

  // Headers that Vercel would apply for this exact path.
  const appliedHeaders = {};
  for (const block of COMPILED) {
    if (block.pattern.test(req.url)) {
      for (const h of block.headers) {
        appliedHeaders[h.key.toLowerCase()] = h.value;
      }
    }
  }

  // Body: stream the file (or empty for /api/* which won't have a static body).
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  for (const [k, v] of Object.entries(appliedHeaders)) res.setHeader(k, v);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.end();
  }
});

const PORT = parseInt(process.env.PORT || '4321', 10);
const TARGETS = process.argv.slice(2);

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`Mock-Vercel server listening on http://127.0.0.1:${PORT}`);
  console.log(`Serving dist/ from: ${DIST}`);
  console.log(`Applying vercel.json headers from: ${VERCEL_JSON}`);
  console.log();

  const SECURITY_HEADERS = [
    'strict-transport-security',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'x-frame-options',
    'x-robots-tag',
    'content-security-policy',
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'access-control-allow-credentials',
    'access-control-max-age',
    'vary',
    'cache-control',
  ];

  for (const target of TARGETS) {
    const url = `http://127.0.0.1:${PORT}${target}`;
    try {
      const resp = await fetch(url, { method: 'GET' });
      console.log(`═══ ${target}  (status ${resp.status})`);
      for (const key of SECURITY_HEADERS) {
        const val = resp.headers.get(key);
        if (val !== null) {
          const truncated = val.length > 140 ? val.slice(0, 140) + '…' : val;
          console.log(`   ${key}: ${truncated}`);
        }
      }
      console.log();
    } catch (e) {
      console.log(`═══ ${target}  ERROR: ${e.message}`);
      console.log();
    }
  }

  server.close();
  process.exit(0);
});