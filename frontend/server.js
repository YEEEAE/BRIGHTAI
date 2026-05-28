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
const { getRedirectTarget } = require('./services/redirects');
const { HTML_SECURITY_HEADERS, tryServeStaticRequest } = require('./services/staticFiles');
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
  unifiedOpenAiCompatHandler,
  unifiedChatCloseHandler
} = require('./routes/aiGateway');
const { canHandleDemoRoute, demoRouteHandler } = require('./routes/demo');
const { demoGeminiApp, canHandleDemoGeminiRoute } = require('./demoGeminiApp');
const { getProviderStatus, getSafeAiStatus } = require('./services/aiGateway');
const { getSkills, getSkillsSummary } = require('./services/skillsRegistry');
const { kernelRouteHandler } = require('./routes/kernel');
const { initializeDatabase } = require('./db/init');

const API_SECURITY_HEADERS = {
  'Content-Language': 'ar-SA',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

const PRODUCTION_ALLOWED_ORIGINS = new Set([
  'https://brightai.site',
  'https://www.brightai.site'
]);
const DEVELOPMENT_ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

// CORS headers for API responses
const BASE_CORS_HEADERS = {
  ...API_SECURITY_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-BrightAI-Analytics-Key, Authorization',
  Vary: 'Origin',
  'Content-Type': 'application/json'
};

const STREAM_ROUTE_ALIASES = new Set(['/api/ai/stream', '/api/groq/stream']);
const CHAT_ROUTE_ALIASES = new Set(['/api/gemini/chat']);
const CHAT_STREAM_ROUTE_ALIASES = new Set(['/api/gemini/chat/stream']);
const OPENAI_COMPAT_ROUTE_ALIASES = new Set(['/api/ai/openai-chat', '/api/ai/chat/completions']);

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
    ? getRedirectTarget(url)
    : null;
  if (redirectTarget) {
    res.writeHead(301, {
      Location: encodeURI(`${redirectTarget}${search}`)
    });
    res.end();
    return;
  }

  if ((method === 'GET' || method === 'HEAD') && !url.startsWith('/api/')) {
    if (tryServeStaticRequest(req, res, url)) {
      return;
    }
  }

  if (canHandleDemoGeminiRoute(method, url)) {
    demoGeminiApp(req, res);
    return;
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, buildCorsHeaders(req));
    res.end();
    return;
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
    if (canHandleDemoRoute(method, url)) {
      await demoRouteHandler(ctx.req, ctx.res, method, url);
    } else if (method === 'POST' && url === '/api/ai/chat') {
      await unifiedChatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && (url === '/api/ai/chat/close' || url === '/api/ai/chat/clear')) {
      await unifiedChatCloseHandler(ctx.req, ctx.res);
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
    } else if (method === 'GET' && url === '/api/gateway-status') {
      const providers = getProviderStatus();
      const skillsSummary = getSkillsSummary();
      const overallOk = Object.values(providers).some(p => p.configured);

      ctx.res.status(200).json({
        status: overallOk ? 'ok' : 'degraded',
        timestamp: Date.now(),
        environment: config.server.nodeEnv,
        version: '1.0.0',
        services: {
          ai_gateway: overallOk,
          skills: skillsSummary,
          websocket: true,
          static_files: true
        },
        providers
      });
    } else if (method === 'GET' && url === '/api/skills') {
      const refresh = search.includes('refresh=true');
      const { skills, scannedAt } = getSkills(refresh);

      ctx.res.status(200).json({
        object: 'list',
        total: skills.length,
        scannedAt,
        skills
      });
    } else if (url.startsWith('/api/kernel/')) {
      // BrightAI Kernel — AI Safety & Governance
      await kernelRouteHandler(ctx.req, ctx.res, method, url);
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

  // Initialize BrightAI Kernel database (PostgreSQL)
  initializeDatabase().then(() => {
    console.log('[BrightAI Kernel] Database ready');
  }).catch(dbError => {
    console.error('Failed to initialize BrightAI Kernel database:', dbError.message);
  });

  server.listen(config.server.port, () => {
    console.log(`BrightAI Server running on port ${config.server.port}`);
    console.log(`Environment: ${config.server.nodeEnv}`);
    console.log('Endpoints:');
    console.log('  POST /api/gemini/chat - Gemini chat gateway (session + suggestions)');
    console.log('  POST /api/gemini/chat/stream - Gemini chat streaming (SSE)');
    console.log('  POST /api/demo/gemini - Unified seven-demo Gemini backend');
    console.log('  POST /api/demo/gemini/stream - Unified seven-demo Gemini stream');
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
    console.log('  GET  /api/gateway-status - Gateway status + skills summary');
    console.log('  GET  /api/skills     - Full skills registry');
    console.log('  --- BrightAI Kernel (AI Safety & Governance) ---');
    console.log('  POST /api/kernel/chat            - Process AI request through all security layers');
    console.log('  GET  /api/kernel/audit           - Query audit trail');
    console.log('  GET  /api/kernel/audit/:id       - Get specific audit entry');
    console.log('  POST /api/kernel/approve/:id     - Approve pending request');
    console.log('  POST /api/kernel/reject/:id      - Reject pending request');
    console.log('  GET  /api/kernel/pending         - List pending approvals');
    console.log('  GET  /api/kernel/stats           - Dashboard statistics');
    console.log('  POST /api/kernel/evidence/:id    - Generate Evidence File');
    console.log('  GET  /api/kernel/compliance/check - Compliance status');
    console.log('  GET  /dashboard/     - BrightAI Kernel Dashboard UI');
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
