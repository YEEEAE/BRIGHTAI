/**
 * BAI-VOC-001-B (2026-07-18): minimal multi-threaded static server for
 * Playwright verification. Serves the `dist/client/` directory on
 * 127.0.0.1:4178. Started by `verify-voc-001-b.mjs` if no other
 * static server is already running.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'dist/client');
const PORT = 4178;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function tryFile(path) {
  try {
    const s = await stat(path);
    if (s.isFile()) return path;
  } catch { /* fallthrough */ }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    let url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (url === '/') url = '/index.html';
    let path = normalize(join(ROOT, url));
    if (!path.startsWith(ROOT)) {
      res.statusCode = 403;
      res.end('forbidden');
      return;
    }
    let file = await tryFile(path);
    if (!file && !extname(path)) {
      // try as directory + /index.html
      file = await tryFile(join(path, 'index.html'));
    }
    if (!file) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    const data = await readFile(file);
    res.statusCode = 200;
    res.setHeader('content-type', MIME[extname(file)] || 'application/octet-stream');
    res.setHeader('cache-control', 'no-store');
    res.end(data);
  } catch (e) {
    res.statusCode = 500;
    res.end('error: ' + (e && e.message));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`static server: http://127.0.0.1:${PORT}/dist/client`);
});
