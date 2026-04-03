import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const host = process.env.HOST || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '4173', 10);

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function toSafeFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const normalizedPath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(workspaceRoot, normalizedPath);

  if (!filePath.startsWith(workspaceRoot)) {
    return null;
  }

  return filePath;
}

async function readFileWithFallback(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return readFileWithFallback(path.join(filePath, 'index.html'));
    }
    return {
      filePath,
      content: await fs.readFile(filePath)
    };
  } catch (error) {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const requestedPath = toSafeFilePath(req.url || '/');
  if (!requestedPath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  const candidatePaths = requestedPath === workspaceRoot
    ? [
      path.join(workspaceRoot, 'index.html'),
      path.join(workspaceRoot, 'pages', 'demo', 'index.html')
    ]
    : [requestedPath];

  let file = null;
  for (const candidatePath of candidatePaths) {
    // eslint-disable-next-line no-await-in-loop
    file = await readFileWithFallback(candidatePath);
    if (file) break;
  }

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const extension = path.extname(file.filePath).toLowerCase();
  const mimeType = MIME_TYPES.get(extension) || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mimeType });
  res.end(file.content);
});

server.listen(port, host, () => {
  console.log(`Frontend static server running at http://${host}:${port}`);
  console.log('Tip: open /pages/demo/index.html or any page inside /pages');
});
