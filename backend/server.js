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

// CORS headers for API responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-BrightAI-Analytics-Key, Authorization',
  'Content-Type': 'application/json'
};

const STREAM_ROUTE_ALIASES = new Set(['/api/ai/stream', '/api/groq/stream']);

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
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      body += chunk.toString();
      // Limit body size
      if (size > maxSizeBytes) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
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
function createContext(req, res) {
  // Enhanced response object
  const enhancedRes = {
    statusCode: 200,
    headers: { ...CORS_HEADERS },

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
    }
  };

  // Enhanced request object
  const enhancedReq = {
    ...req,
    body: null,
    ip: req.socket?.remoteAddress,
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
  try {
    const host = req.headers?.host || `127.0.0.1:${config.server.port}`;
    url = new URL(rawUrl, `http://${host}`).pathname;
  } catch (error) {
    url = rawUrl.split('?')[0] || rawUrl;
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
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

    // Route requests
    if (method === 'POST' && url === '/api/gemini/chat') {
      await geminiChatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/gemini/chat/stream') {
      await geminiChatStreamHandler(ctx.req, ctx.res, res);
    } else if (method === 'POST' && url === '/api/ai/chat') {
      await chatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/search') {
      await searchHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/medical') {
      await medicalHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/summary') {
      await summaryHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && (url === '/api/ai/openai-chat' || url === '/api/ai/chat/completions')) {
      await groqOpenAiCompatHandler(ctx.req, ctx.res);
    } else if (method === 'GET' && url === '/api/ai/models') {
      ctx.res.status(200).json({
        object: 'list',
        data: [
          { id: 'gemini-2.5-flash', object: 'model', owned_by: 'google' },
          { id: 'gemini-1.5-pro', object: 'model', owned_by: 'google' }
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
    } else if (method === 'POST' && url === '/api/analytics/ga4/conversion') {
      await ga4ConversionHandler(ctx.req, ctx.res);
    } else if (method === 'GET' && url === '/api/docs') {
      // Serve Swagger UI
      const swaggerHtml = generateSwaggerUI();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(swaggerHtml);
      return;
    } else if (method === 'GET' && url === '/api/docs/openapi.yaml') {
      // Serve OpenAPI YAML file
      try {
        const yamlPath = path.join(__dirname, '../docs/openapi.yaml');
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/yaml; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
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
      const geminiReady = !!(config.gemini.apiKey && config.gemini.apiKey !== 'YOUR_KEY_HERE' && config.gemini.apiKey !== 'YOUR_GEMINI_KEY_HERE');
      const geminiModel = config.gemini.model || 'not set';
      const overallOk = geminiReady;

      ctx.res.status(overallOk ? 200 : 503).json({
        status: overallOk ? 'ok' : 'degraded',
        timestamp: Date.now(),
        environment: config.server.nodeEnv,
        providers: {
          gemini: {
            configured: geminiReady,
            model: geminiModel,
            message: geminiReady
              ? 'GEMINI_API_KEY مُعد وجاهز'
              : 'GEMINI_API_KEY غير مُعد — أضفه في Netlify Environment Variables'
          }
        }
      });
    } else {
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
  // Validate configuration
  if (!validateConfig()) {
    console.warn('Warning: Server starting with incomplete configuration');
    console.warn('AI features may return 503 until at least one provider key is configured (GROQ_API_KEY or GEMINI_API_KEY)');
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
    console.log('  POST /api/ai/openai-chat - OpenAI-compatible chat payload');
    console.log('  POST /api/ai/chat/completions - OpenAI-compatible alias');
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
