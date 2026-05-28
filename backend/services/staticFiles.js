const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ONE_HOUR_SECONDS = 60 * 60;
const ONE_DAY_SECONDS = 24 * ONE_HOUR_SECONDS;

const HTML_SECURITY_HEADERS = {
  'Content-Language': 'ar-SA',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN'
};

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || 'application/octet-stream';
}

function isHtmlPath(filePath) {
  return path.extname(filePath).toLowerCase() === '.html';
}

function isSensitiveStaticPath(pathname) {
  const lowerPath = pathname.toLowerCase();
  const basename = path.posix.basename(lowerPath);

  return (
    lowerPath.endsWith('.map') ||
    lowerPath.endsWith('.log') ||
    lowerPath.endsWith('.sql') ||
    basename === '.env' ||
    basename.startsWith('.env.')
  );
}

function normalizeStaticPathname(pathname) {
  let decodedPathname = pathname;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (_error) {
    decodedPathname = pathname;
  }

  const normalized = path.posix.normalize(decodedPathname);
  if (!normalized.startsWith('/')) {
    return `/${normalized}`;
  }

  return normalized;
}

function resolveStaticFilePath(pathname) {
  const normalizedPathname = normalizeStaticPathname(pathname);
  const trimmedPathname = normalizedPathname === '/'
    ? '/'
    : normalizedPathname.replace(/\/+$/, '');
  const hasExtension = path.posix.extname(trimmedPathname) !== '';
  const candidates = trimmedPathname === '/'
    ? ['/index.html']
    : hasExtension
      ? [trimmedPathname]
      : [`${trimmedPathname}/index.html`, `${trimmedPathname}.html`];

  for (const candidate of candidates) {
    const absolutePath = path.resolve(PROJECT_ROOT, `.${candidate}`);
    if (!absolutePath.startsWith(`${PROJECT_ROOT}${path.sep}`) && absolutePath !== PROJECT_ROOT) {
      continue;
    }

    try {
      const stats = fs.statSync(absolutePath);
      if (stats.isFile()) {
        return absolutePath;
      }
    } catch (_error) {
      // نكمل على المرشح التالي إذا لم يوجد الملف.
    }
  }

  return null;
}

function buildStaticHeaders(filePath, extraHeaders = {}) {
  const headers = {
    'Content-Type': getContentType(filePath),
    ...extraHeaders
  };

  if (isHtmlPath(filePath)) {
    Object.assign(headers, HTML_SECURITY_HEADERS);
  }

  return headers;
}

function getStaticCacheControl(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();

  if (basename === 'index.html' || extension === '.html') {
    return 'public, max-age=0, must-revalidate';
  }

  if (['.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'].includes(extension)) {
    return 'public, max-age=31536000, immutable';
  }

  if (['.js', '.css'].includes(extension)) {
    return `public, max-age=${ONE_DAY_SECONDS}, stale-while-revalidate=${7 * ONE_DAY_SECONDS}`;
  }

  if (extension === '.xml') return `public, max-age=${ONE_HOUR_SECONDS}`;
  if (extension === '.txt' || extension === '.json') return `public, max-age=${ONE_DAY_SECONDS}`;
  return `public, max-age=${ONE_HOUR_SECONDS}`;
}

function buildEntityTag(stats) {
  return `"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
}

function clientHasFreshStaticCopy(req, etag, lastModified) {
  const noneMatch = req.headers['if-none-match'];
  if (noneMatch && noneMatch.split(',').map(value => value.trim()).includes(etag)) {
    return true;
  }

  const modifiedSince = req.headers['if-modified-since'];
  if (!modifiedSince) return false;

  const modifiedSinceMs = Date.parse(modifiedSince);
  const lastModifiedMs = Date.parse(lastModified);
  return Number.isFinite(modifiedSinceMs) && Number.isFinite(lastModifiedMs) && lastModifiedMs <= modifiedSinceMs;
}

function sendStaticFile(req, res, filePath, statusCode = 200, extraHeaders = {}) {
  const stats = fs.statSync(filePath);
  const lastModified = stats.mtime.toUTCString();
  const etag = buildEntityTag(stats);
  const headers = buildStaticHeaders(filePath, {
    'Cache-Control': getStaticCacheControl(filePath),
    'Last-Modified': lastModified,
    ETag: etag,
    ...extraHeaders
  });

  if (statusCode === 200 && clientHasFreshStaticCopy(req, etag, lastModified)) {
    res.writeHead(304, headers);
    res.end();
    return;
  }

  res.writeHead(statusCode, headers);

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', error => {
    console.error('Static file stream error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('حدث خطأ أثناء تحميل الملف.');
  });
  stream.pipe(res);
}

function sendStatic404(req, res) {
  const notFoundPath = path.join(PROJECT_ROOT, '404.html');
  const extraHeaders = { 'X-Robots-Tag': 'noindex' };

  try {
    const stats = fs.statSync(notFoundPath);
    if (stats.isFile()) {
      sendStaticFile(req, res, notFoundPath, 404, extraHeaders);
      return;
    }
  } catch (_error) {
    // نرجع إلى الاستجابة الاحتياطية إذا لم تتوفر صفحة 404.
  }

  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    ...HTML_SECURITY_HEADERS,
    ...extraHeaders
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.end('<!DOCTYPE html><html lang="ar-SA" dir="rtl"><head><meta charset="utf-8"><title>404</title></head><body><h1>404</h1></body></html>');
}

function tryServeStaticRequest(req, res, pathname) {
  const normalizedPathname = normalizeStaticPathname(pathname);

  if (isSensitiveStaticPath(normalizedPathname)) {
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow'
    });
    res.end(req.method === 'HEAD' ? undefined : '403 Forbidden');
    return true;
  }

  const filePath = resolveStaticFilePath(normalizedPathname);
  if (!filePath) {
    sendStatic404(req, res);
    return true;
  }

  const extraHeaders = {};
  const lowerPathname = normalizedPathname.toLowerCase();

  if (lowerPathname === '/sitemap.xml') {
    extraHeaders['Content-Type'] = 'application/xml; charset=utf-8';
    extraHeaders['Cache-Control'] = 'public, max-age=3600';
  } else if (lowerPathname === '/robots.txt') {
    extraHeaders['Content-Type'] = 'text/plain; charset=utf-8';
    extraHeaders['Cache-Control'] = 'public, max-age=86400';
  }

  sendStaticFile(req, res, filePath, 200, extraHeaders);
  return true;
}

module.exports = {
  HTML_SECURITY_HEADERS,
  tryServeStaticRequest,
  normalizeStaticPathname,
  resolveStaticFilePath
};
