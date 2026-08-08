/**
 * serve-static.mjs — serve dist/client on :8788 for local Lighthouse/vitals runs.
 * No runtime dependency (pure node:http). Matches the production static payload.
 * trailingSlash: 'always' — /foo → /foo/index.html.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = new URL('../dist/client/', import.meta.url).pathname;
const PORT = Number(process.env.PORT) || 8788;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

function resolvePath(urlPath) {
  let p = normalize(urlPath.split('?')[0]).replace(/^(\.\.[/\\])+/, '');
  return join(ROOT, p);
}

const server = createServer(async (req, res) => {
  try {
    let fp = resolvePath(req.url || '/');
    let st = await stat(fp).catch(() => null);
    if (st && st.isDirectory()) fp = join(fp, 'index.html');
    if (!extname(fp)) fp = `${fp}/index.html`; // trailingSlash: always
    const body = await readFile(fp);
    res.setHeader('Content-Type', TYPES[extname(fp)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const notFound = await readFile(join(ROOT, '404.html')).catch(() => Buffer.from('Not found'));
    res.end(notFound);
  }
});

server.listen(PORT, () => {
  console.log(`[serve-static] serving ${ROOT} on http://localhost:${PORT}/`);
});
