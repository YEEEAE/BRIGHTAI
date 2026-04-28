/**
 * BrightAI Server
 * Main entry point for the AI Gateway server
 * Requirements: 23.1, 23.2, 23.3, 23.4
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const { config, validateConfig } = require('./config');
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');
const { chatHandler } = require('./routes/chat');
const { geminiChatHandler, geminiChatStreamHandler } = require('./routes/gemini');
const { searchHandler } = require('./routes/search');
const { medicalHandler } = require('./routes/medical');
const { summaryHandler } = require('./routes/summary');
const { ga4ConversionHandler } = require('./routes/analytics');
const {
  groqStreamHandler,
  groqOcrHandler,
  groqExtractTextHandler,
  groqTranscribeHandler,
  groqMedicalAgentHandler,
  groqFaqHandler,
  groqMedicalArchiveHandler,
  groqHealthHandler,
  groqOpenAiCompatHandler
} = require('./routes/groq');
const { getProviderHealthSnapshot } = require('./services/openaiCompatProvider');
const {
  unifiedChatHandler,
  unifiedChatStreamHandler,
  unifiedOpenAiCompatHandler
} = require('./routes/aiGateway');
const { getProviderStatus, getSafeAiStatus } = require('./services/aiGateway');

const PROJECT_ROOT = path.resolve(__dirname, '..');
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

const PRODUCTION_ALLOWED_ORIGINS = new Set([
  'https://brightai.site',
  'https://www.brightai.site'
]);
const DEVELOPMENT_ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

// CORS headers for API responses
const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-BrightAI-Analytics-Key, Authorization',
  Vary: 'Origin',
  'Content-Type': 'application/json'
};

const STREAM_ROUTE_ALIASES = new Set(['/api/ai/stream', '/api/groq/stream']);
const CHAT_ROUTE_ALIASES = new Set(['/api/gemini/chat']);
const CHAT_STREAM_ROUTE_ALIASES = new Set(['/api/gemini/chat/stream']);
const OPENAI_COMPAT_ROUTE_ALIASES = new Set(['/api/ai/openai-chat', '/api/ai/chat/completions']);
const STATIC_ROUTE_REDIRECTS = new Map([
  ['/interview', '/demo/smart-hiring-system/'],
  ['/interview/', '/demo/smart-hiring-system/'],
  ['/interview/index.html', '/demo/smart-hiring-system/'],
  ['/interview/pages/supportAI', '/demo/smart-hiring-system/pages/support-ai/'],
  ['/interview/pages/supportAI/', '/demo/smart-hiring-system/pages/support-ai/'],
  ['/interview/pages/supportAI/index.html', '/demo/smart-hiring-system/pages/support-ai/'],
  ['/job.MAISco', '/demo/smart-hiring-system/'],
  ['/job.MAISco/', '/demo/smart-hiring-system/']
]);
const BLOG_SLUG_REDIRECTS = new Map([
  [
    '/blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1',
    '/blog/ai-automation-project-analysis/'
  ],
  [
    '/blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية',
    '/blog/process-automation-ai-efficiency/'
  ],
  [
    '/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية',
    '/blog/industrial-automation-productivity/'
  ],
  [
    '/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية',
    '/blog/financial-hr-automation/'
  ],
  [
    '/blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار',
    '/blog/digital-transformation-automation/'
  ],
  [
    '/blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور',
    '/blog/machine-learning-computer-vision/'
  ],
  [
    '/blog/الذكاء-الاصطناعي-و-التسويق',
    '/blog/ai-marketing-guide/'
  ],
  [
    '/blog/تحليل-البيانات',
    '/blog/data-analysis-decision-making/'
  ],
  [
    '/blog/تعلم-الآلة-و-الأعمال',
    '/blog/machine-learning-business/'
  ],
  [
    '/blog/مقال-تحليل',
    '/blog/ai-data-analysis-tools/'
  ],
  [
    '/blog/أتمتة الذكاء الاصطناعي_ حلول مخصصة لتحليل المشاريع وتحسين محركات البحث (1)',
    '/blog/ai-automation-project-analysis/'
  ],
  [
    '/blog/أتمتة العمليات باستخدام الذكاء الاصطناعي_ الطريق إلى تحسين الكفاءة التشغيلية',
    '/blog/process-automation-ai-efficiency/'
  ],
  [
    '/blog/استشارات الذكاء الاصطناعي_ كيف تسهم في تحقيق التحول الرقمي للشركات',
    '/blog/choose-ai-company-saudi/'
  ],
  [
    '/blog/الأتمتة الصناعية وأتمتة المهام المتكررة_ كيفية تحسين الكفاءة الإنتاجية',
    '/blog/industrial-automation-productivity/'
  ],
  [
    '/blog/الأتمتة المالية وأتمتة الموارد البشرية_ حلول مستقبلية للشركات الذكية',
    '/blog/financial-hr-automation/'
  ],
  [
    '/blog/التحول الرقمي وأتمتة العمليات_ كيف يمكن للذكاء الاصطناعي أن يقود الابتكار',
    '/blog/digital-transformation-automation/'
  ],
  [
    '/blog/التعلم الآلي والرؤية الحاسوبية_ مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور',
    '/blog/machine-learning-computer-vision/'
  ],
  [
    '/blog/atou.doc',
    '/blog/process-automation-ai-efficiency/'
  ],
  [
    '/blog/astr.doc',
    '/blog/'
  ]
]);
const FOLDER_BLOG_SLUGS = new Set([
  'ai-automation-project-analysis',
  'process-automation-ai-efficiency',
  'industrial-automation-productivity',
  'financial-hr-automation',
  'digital-transformation-automation',
  'machine-learning-computer-vision',
  'ai-marketing-guide',
  'data-analysis-decision-making',
  'machine-learning-business',
  'ai-data-analysis-tools'
]);

function normalizeStaticRedirectSource(pathname) {
  if (!pathname || pathname === '/') {
    return pathname;
  }

  let normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (normalized.endsWith('.html')) {
    normalized = normalized.slice(0, -5);
  }
  return normalized;
}

function getStaticRedirectTarget(pathname) {
  if (!pathname || !pathname.startsWith('/blog/')) {
    return null;
  }

  const folderSlug = pathname.match(/^\/blog\/([A-Za-z0-9-]+)\/?$/);
  if (folderSlug && FOLDER_BLOG_SLUGS.has(folderSlug[1])) {
    return pathname.endsWith('/') ? null : `/blog/${folderSlug[1]}/`;
  }

  const folderSlugHtml = pathname.match(/^\/blog\/([A-Za-z0-9-]+)\.html$/);
  if (folderSlugHtml && FOLDER_BLOG_SLUGS.has(folderSlugHtml[1])) {
    return `/blog/${folderSlugHtml[1]}/`;
  }

  if (pathname === '/blog/production-line' || pathname === '/blog/production-line/' || pathname === '/blog/production-line.html') {
    return '/blog/industrial-automation-productivity/';
  }

  if (
    pathname === '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات' ||
    pathname === '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات/' ||
    pathname === '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات.html'
  ) {
    return '/blog/choose-ai-company-saudi/';
  }

  const candidates = new Set([pathname]);
  try {
    candidates.add(decodeURIComponent(pathname));
  } catch (_error) {
    // نتجاهل المسارات غير القابلة للفك ونكتفي بالقيمة الأصلية.
  }

  for (const candidate of candidates) {
    const normalized = normalizeStaticRedirectSource(candidate);
    if (BLOG_SLUG_REDIRECTS.has(normalized)) {
      return BLOG_SLUG_REDIRECTS.get(normalized);
    }
  }

  return null;
}

function createLivePayload() {
  const levels = ['info', 'success', 'warning', 'critical'];
  const messages = [
    'تحديث لحظي: تم تسجيل عملية بحث جديدة.',
    'تحديث لحظي: تمت مزامنة مؤشرات الأداء بنجاح.',
    'تنبيه فوري: حالة حرجة تحتاج مراجعة عاجلة.',
    'تحديث فوري: معالجة دفعة ملفات جديدة اكتملت.',
    'مؤشر حي: ارتفاع نشاط المستخدمين في آخر دقيقة.'
  ];
  return {
    type: 'metrics_update',
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: Date.now()
  };
}

function getCorsOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return '';

  let parsed;
  try {
    parsed = new URL(origin);
  } catch (_error) {
    return '';
  }

  if (config.server.nodeEnv === 'production') {
    return PRODUCTION_ALLOWED_ORIGINS.has(origin) ? origin : '';
  }

  return DEVELOPMENT_ALLOWED_HOSTS.has(parsed.hostname) ? origin : '';
}

function buildCorsHeaders(req) {
  const allowedOrigin = getCorsOrigin(req);
  return {
    ...BASE_CORS_HEADERS,
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {})
  };
}

function getClientIp(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (forwardedFor) return forwardedFor;
  return req.socket?.remoteAddress || '';
}

function findBackendRuntimeFilesWithSpaces() {
  const offenders = [];
  const runtimeDirs = [path.join(__dirname, 'routes'), path.join(__dirname, 'utils'), path.join(__dirname, 'services')];
  for (const dir of runtimeDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && /\s/.test(entry.name)) {
        offenders.push(path.relative(__dirname, path.join(dir, entry.name)));
      }
    }
  }
  return offenders;
}

function setupLiveWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set();

  const broadcast = payload => {
    const serialized = JSON.stringify(payload);
    clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(serialized);
      }
    });
  };

  server.on('upgrade', (request, socket, head) => {
    const host = request.headers.host || `127.0.0.1:${config.server.port}`;
    let pathname = '';
    try {
      pathname = new URL(request.url || '/', `http://${host}`).pathname;
    } catch (error) {
      pathname = request.url || '/';
    }

    if (pathname !== '/ws/live') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', ws => {
    clients.add(ws);
    ws.send(JSON.stringify({
      type: 'connected',
      level: 'success',
      message: 'تم ربط قناة التحديثات الفورية بنجاح.',
      timestamp: Date.now()
    }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('message', raw => {
      const text = String(raw || '').trim();
      if (text === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', level: 'info', message: 'pong', timestamp: Date.now() }));
      }
    });
  });

  const intervalId = setInterval(() => {
    if (!clients.size) return;
    broadcast(createLivePayload());
  }, 7000);

  server.on('close', () => {
    clearInterval(intervalId);
    clients.forEach(client => {
      try { client.close(); } catch (error) { /* ignore */ }
    });
    clients.clear();
  });

  return { wss, broadcast };
}

/**
 * Parse JSON body from request
 * @param {http.IncomingMessage} req
 * @param {number} maxSizeBytes
 * @returns {Promise<object>}
 */
function parseBody(req, maxSizeBytes = config.validation.maxBodyBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let rejected = false;

    req.on('data', chunk => {
      if (rejected) return;

      size += chunk.length;
      if (size > maxSizeBytes) {
        rejected = true;
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      if (rejected) return;

      try {
        const body = chunks.length ? Buffer.concat(chunks, size).toString('utf8') : '';
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Create Express-like request/response objects
 */
function createContext(req, res, corsHeaders = buildCorsHeaders(req)) {
  // Enhanced response object
  const enhancedRes = {
    statusCode: 200,
    headers: { ...corsHeaders },

    status(code) {
      this.statusCode = code;
      return this;
    },

    setHeader(name, value) {
      this.headers[name] = value;
    },

    json(data) {
      res.writeHead(this.statusCode, this.headers);
      res.end(JSON.stringify(data));
    },

    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      if (headers) Object.assign(this.headers, headers);
      res.writeHead(statusCode, this.headers);
      return this;
    },

    write(chunk) {
      return res.write(chunk);
    },

    end(chunk) {
      return res.end(chunk);
    }
  };

  // Enhanced request object
  const enhancedReq = {
    ...req,
    body: null,
    corsHeaders,
    ip: getClientIp(req),
    connection: req.socket,
    on: req.on.bind(req),
    once: req.once ? req.once.bind(req) : undefined,
    addListener: req.addListener ? req.addListener.bind(req) : undefined,
    removeListener: req.removeListener ? req.removeListener.bind(req) : undefined
  };

  return { req: enhancedReq, res: enhancedRes };
}

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

/**
 * Generate Swagger UI HTML
 */
function generateSwaggerUI() {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrightAI API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      background-color: #667eea;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `;
}

/**
 * Main request handler
 */
async function handleRequest(req, res) {
  const { method } = req;
  const rawUrl = req.url || '/';
  let url = rawUrl;
  let search = '';
  try {
    const host = req.headers?.host || `127.0.0.1:${config.server.port}`;
    const parsedUrl = new URL(rawUrl, `http://${host}`);
    url = parsedUrl.pathname;
    search = parsedUrl.search;
  } catch (error) {
    url = rawUrl.split('?')[0] || rawUrl;
    search = rawUrl.includes('?') ? `?${rawUrl.split('?').slice(1).join('?')}` : '';
  }

  const redirectTarget = (method === 'GET' || method === 'HEAD')
    ? (STATIC_ROUTE_REDIRECTS.get(url) || getStaticRedirectTarget(url))
    : null;
  if (redirectTarget) {
    res.writeHead(301, {
      Location: encodeURI(`${redirectTarget}${search}`)
    });
    res.end();
    return;
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, buildCorsHeaders(req));
    res.end();
    return;
  }

  if ((method === 'GET' || method === 'HEAD') && !url.startsWith('/api/')) {
    if (tryServeStaticRequest(req, res, url)) {
      return;
    }
  }

  // Create context
  const ctx = createContext(req, res);

  try {
    // Parse body for POST requests
    if (method === 'POST') {
      const isOcrSizedRoute = (
        url === '/api/ai/ocr' ||
        url === '/api/ai/extract-text' ||
        url === '/api/ai/medical-archive' ||
        url === '/api/ai/medical-agent'
      );
      const isUploadSizedRoute = (url === '/api/ai/transcribe');
      const maxSize = isOcrSizedRoute
        ? config.validation.ocrMaxBodyBytes
        : (isUploadSizedRoute ? config.validation.uploadMaxBodyBytes : config.validation.maxBodyBytes);
      ctx.req.body = await parseBody(req, maxSize);
    }

    // Apply rate limiting
    let rateLimitPassed = false;
    await rateLimiterMiddleware(ctx.req, ctx.res, () => {
      rateLimitPassed = true;
    });

    // If rate limited, response already sent
    if (!rateLimitPassed) {
      return;
    }

    // Route requests — Unified AI Gateway (primary) + legacy aliases
    if (method === 'POST' && url === '/api/ai/chat') {
      await unifiedChatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/chat/stream') {
      await unifiedChatStreamHandler(ctx.req, ctx.res, res);
    } else if (method === 'POST' && CHAT_ROUTE_ALIASES.has(url)) {
      // Alias: /api/gemini/chat → unified chat
      await unifiedChatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && CHAT_STREAM_ROUTE_ALIASES.has(url)) {
      // Alias: /api/gemini/chat/stream → unified stream
      await unifiedChatStreamHandler(ctx.req, ctx.res, res);
    } else if (method === 'POST' && OPENAI_COMPAT_ROUTE_ALIASES.has(url)) {
      // Alias: /api/ai/openai-chat, /api/ai/chat/completions → unified OpenAI-compat
      await unifiedOpenAiCompatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/search') {
      await searchHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/medical') {
      await medicalHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/summary') {
      await summaryHandler(ctx.req, ctx.res);
    } else if (method === 'GET' && url === '/api/ai/models') {
      ctx.res.status(200).json({
        object: 'list',
        data: [
          { id: 'nvidia/llama-3.1-nemotron-70b-instruct', object: 'model', owned_by: 'nvidia' },
          { id: 'deepseek-chat', object: 'model', owned_by: 'deepseek' },
          { id: 'gemini-2.5-flash', object: 'model', owned_by: 'google' },
          { id: 'gemini-1.5-pro', object: 'model', owned_by: 'google' },
          { id: config.groq.model || 'llama-3.3-70b-versatile', object: 'model', owned_by: 'groq' }
        ]
      });
    } else if (method === 'POST' && STREAM_ROUTE_ALIASES.has(url)) {
      await groqStreamHandler(ctx.req, ctx.res, res);
    } else if (method === 'POST' && url === '/api/ai/ocr') {
      await groqOcrHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/extract-text') {
      await groqExtractTextHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/transcribe') {
      await groqTranscribeHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/medical-agent') {
      await groqMedicalAgentHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/faq') {
      await groqFaqHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/medical-archive') {
      await groqMedicalArchiveHandler(ctx.req, ctx.res);
    } else if (method === 'GET' && url === '/api/health/ai') {
      await groqHealthHandler(ctx.req, ctx.res);
    } else if (method === 'GET' && url === '/api/ai/status') {
      ctx.res.status(200).json(getSafeAiStatus());
    } else if (method === 'POST' && url === '/api/analytics/ga4/conversion') {
      await ga4ConversionHandler(ctx.req, ctx.res);
    } else if (method === 'GET' && url === '/api/docs') {
      // Serve Swagger UI
      const swaggerHtml = generateSwaggerUI();
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        ...HTML_SECURITY_HEADERS
      });
      if (method !== 'HEAD') {
        res.end(swaggerHtml);
      } else {
        res.end();
      }
      return;
    } else if (method === 'GET' && url === '/api/docs/openapi.yaml') {
      // Serve OpenAPI YAML file
      try {
        const yamlPath = path.join(__dirname, '../docs/openapi.yaml');
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        res.writeHead(200, {
          ...buildCorsHeaders(req),
          'Content-Type': 'text/yaml; charset=utf-8'
        });
        res.end(yamlContent);
        return;
      } catch (error) {
        console.error('Error reading OpenAPI YAML:', error);
        ctx.res.status(500).json({
          error: 'فشل تحميل وثائق API',
          errorCode: 'DOCS_ERROR'
        });
      }
    } else if (url === '/api/health') {
      const providers = getProviderStatus();
      const overallOk = Object.values(providers).some(provider => provider.configured);

      ctx.res.status(overallOk ? 200 : 503).json({
        status: overallOk ? 'ok' : 'degraded',
        timestamp: Date.now(),
        environment: config.server.nodeEnv,
        providers
      });
    } else {
      ctx.res.setHeader('X-Robots-Tag', 'noindex');
      ctx.res.status(404).json({
        error: 'الصفحة غير موجودة',
        errorCode: 'NOT_FOUND'
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    if (res.headersSent) {
      try { res.end(); } catch (_endError) { /* ignore */ }
      return;
    }

    if (error.message === 'Invalid JSON') {
      ctx.res.status(400).json({
        error: 'طلب غير صالح',
        errorCode: 'INVALID_JSON'
      });
    } else if (error.message === 'Body too large') {
      ctx.res.status(413).json({
        error: 'الطلب كبير جداً',
        errorCode: 'BODY_TOO_LARGE'
      });
    } else {
      ctx.res.status(500).json({
        error: 'حدث خطأ في الخادم',
        errorCode: 'SERVER_ERROR'
      });
    }
  }
}

/**
 * Start the server
 */
function startServer() {
  const spacedRuntimeFiles = findBackendRuntimeFilesWithSpaces();
  if (spacedRuntimeFiles.length > 0) {
    throw new Error(`Backend runtime filenames must not contain spaces: ${spacedRuntimeFiles.join(', ')}`);
  }

  if (config.server.nodeEnv === 'production' && process.env.AI_GATEWAY_MOCK_MODE === '1') {
    throw new Error('AI_GATEWAY_MOCK_MODE must not be enabled in production');
  }

  // Validate configuration
  if (!validateConfig()) {
    console.warn('Warning: Server starting with incomplete configuration');
    console.warn('AI features may return 503 until at least one provider key is configured (GEMINI_API_KEY, GROQ_API_KEY, NVIDIA_API_KEY, or DEEPSEEK_API_KEY)');
  }

  const server = http.createServer(handleRequest);
  setupLiveWebSocket(server);

  server.listen(config.server.port, () => {
    console.log(`BrightAI Server running on port ${config.server.port}`);
    console.log(`Environment: ${config.server.nodeEnv}`);
    console.log('Endpoints:');
    console.log('  POST /api/gemini/chat - Gemini chat gateway (session + suggestions)');
    console.log('  POST /api/gemini/chat/stream - Gemini chat streaming (SSE)');
    console.log('  POST /api/ai/chat    - Chatbot conversations');
    console.log('  POST /api/ai/search  - Smart search');
    console.log('  POST /api/ai/medical - Medical image analysis');
    console.log('  POST /api/ai/summary - Text summarization');
    console.log('  POST /api/ai/openai-chat - OpenAI-compatible chat payload (supports NVIDIA/DeepSeek/Groq)');
    console.log('  POST /api/ai/chat/completions - OpenAI-compatible alias for tenders/chat systems');
    console.log('  GET  /api/ai/status - Safe AI provider readiness');
    console.log('  GET  /api/ai/models - Model catalog');
    console.log('  POST /api/ai/stream   - Streaming AI responses');
    console.log('  POST /api/ai/ocr      - OCR JSON extraction');
    console.log('  POST /api/ai/extract-text - Extract plain text from file');
    console.log('  POST /api/ai/transcribe   - Audio to text');
    console.log('  POST /api/ai/medical-agent - Medical smart agent');
    console.log('  POST /api/ai/faq      - FAQ generation');
    console.log('  POST /api/ai/medical-archive - Smart medical archive demo');
    console.log('  GET  /api/health/ai   - AI provider health check');
    console.log('  POST /api/analytics/ga4/conversion - Forward conversion events to GA4');
    console.log('  GET  /api/docs       - API Documentation (Swagger UI)');
    console.log('  GET  /api/health     - Health check');
    console.log('  WS   /ws/live        - Real-time dashboard updates');
  });

  return server;
}

// Export for testing
module.exports = {
  handleRequest,
  startServer,
  parseBody,
  createContext,
  generateSwaggerUI
};

// Start server if run directly
if (require.main === module) {
  startServer();
}
