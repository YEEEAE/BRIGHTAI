#!/usr/bin/env node
/**
 * scripts/verify-cors-preflight.mjs — REPORTS-SEC-02 (2026-07-07)
 *
 * Runs the mock-Vercel server in the foreground, performs OPTIONS preflight
 * from BOTH the allowed origin (https://www.brightaii.com) and a denied
 * origin (https://evil.example.com), and prints the CORS headers.
 *
 * Both cases should return the headers (Vercel sets the headers regardless
 * of Origin), but only the allowed-origin request actually succeeds in a
 * browser because the browser reads Access-Control-Allow-Origin.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');

const config = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
function compileSource(src) {
  let out = src.replace(/\(\.\*\)/g, '<<<CAP_ANY>>>');
  out = out.replace(/[.+^${}|[\]\\]/g, '\\$&');
  out = out.replace(/\*/g, '[^/]*');
  out = out.replace(/<<<CAP_ANY>>>/g, '(.*)');
  return new RegExp('^' + out + '$');
}
const COMPILED = config.headers.map((b) => ({ pattern: compileSource(b.source), headers: b.headers }));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };

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

await new Promise((resolve) => server.listen(4324, '127.0.0.1', resolve));

async function preflight(label, origin) {
  console.log(`═══ ${label}`);
  console.log(`   Origin: ${origin}`);
  const resp = await fetch(`http://127.0.0.1:4324/api/ai/chat`, {
    method: 'OPTIONS',
    headers: {
      'Origin': origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });
  console.log(`   status: ${resp.status}`);
  for (const h of ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-allow-credentials', 'access-control-max-age', 'vary']) {
    const v = resp.headers.get(h);
    if (v) console.log(`   ${h}: ${v}`);
  }
  console.log();
}

await preflight('Preflight from ALLOWED origin (https://www.brightaii.com)', 'https://www.brightaii.com');
await preflight('Preflight from DENIED origin (https://evil.example.com)', 'https://evil.example.com');
await preflight('Preflight with NO Origin header', '');

// Real GET to confirm normal page access still works
console.log('═══ Real GET / (no Origin) — should NOT have CORS');
const r = await fetch('http://127.0.0.1:4324/');
console.log(`   status: ${r.status}`);
console.log(`   access-control-allow-origin: ${r.headers.get('access-control-allow-origin') || '(absent — pages are NOT subject to CORS)'}`);

server.close();