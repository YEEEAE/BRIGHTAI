/**
 * BrightAI Server
 * Main entry point for the AI Gateway server
 * Requirements: 23.1, 23.2, 23.3, 23.4
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const { config, validateConfig } = require('./config');
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');
const { chatHandler } = require('./routes/chat');
const { searchHandler } = require('./routes/search');
const { medicalHandler } = require('./routes/medical');
const { summaryHandler } = require('./routes/summary');
const {
  groqStreamHandler,
  groqOcrHandler,
  groqExtractTextHandler,
  groqTranscribeHandler,
  groqMedicalAgentHandler,
  groqFaqHandler,
  groqMedicalArchiveHandler
} = require('./routes/groq');

// CORS headers for API responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

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
    connection: req.socket
  };

  return { req: enhancedReq, res: enhancedRes };
}

/**
 * Main request handler
 */
async function handleRequest(req, res) {
  const { method, url } = req;

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
      const maxSize = (
        url === '/api/groq/ocr' ||
        url === '/api/groq/extract-text' ||
        url === '/api/groq/medical-archive' ||
        url === '/api/groq/medical-agent'
      )
        ? config.validation.ocrMaxBodyBytes
        : (url === '/api/groq/transcribe'
            ? config.validation.uploadMaxBodyBytes
            : config.validation.maxBodyBytes);
      ctx.req.body = await parseBody(req, maxSize);
    }

    // Apply rate limiting - use a promise to handle async middleware
    const rateLimitPassed = await new Promise((resolve) => {
      rateLimiterMiddleware(ctx.req, ctx.res, () => {
        resolve(true);
      });
      // If middleware sent response (429), resolve false
      if (ctx.res.statusCode === 429) {
        resolve(false);
      }
    });

    // If rate limited, response already sent
    if (!rateLimitPassed) {
      return;
    }

    // Route requests
    if (method === 'POST' && url === '/api/ai/chat') {
      await chatHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/search') {
      await searchHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/medical') {
      await medicalHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/ai/summary') {
      await summaryHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/groq/stream') {
      await groqStreamHandler(ctx.req, ctx.res, res);
    } else if (method === 'POST' && url === '/api/groq/ocr') {
      await groqOcrHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/groq/extract-text') {
      await groqExtractTextHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/groq/transcribe') {
      await groqTranscribeHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/groq/medical-agent') {
      await groqMedicalAgentHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/groq/faq') {
      await groqFaqHandler(ctx.req, ctx.res);
    } else if (method === 'POST' && url === '/api/groq/medical-archive') {
      await groqMedicalArchiveHandler(ctx.req, ctx.res);
    } else if (url === '/api/health') {
      ctx.res.status(200).json({ status: 'ok', timestamp: Date.now() });
    } else {
      ctx.res.status(404).json({
        error: 'الصفحة غير موجودة',
        errorCode: 'NOT_FOUND'
      });
    }

  } catch (error) {
    console.error('Server error:', error);

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
    console.warn('AI features will return 503 until GEMINI_API_KEY and GROQ_API_KEY are configured');
  }

  const server = http.createServer(handleRequest);
  setupLiveWebSocket(server);

  server.listen(config.server.port, () => {
    console.log(`BrightAI Server running on port ${config.server.port}`);
    console.log(`Environment: ${config.server.nodeEnv}`);
    console.log('Endpoints:');
    console.log('  POST /api/ai/chat    - Chatbot conversations');
    console.log('  POST /api/ai/search  - Smart search');
    console.log('  POST /api/ai/medical - Medical image analysis');
    console.log('  POST /api/ai/summary - Content summary');
    console.log('  POST /api/groq/stream - Groq streaming demo');
    console.log('  POST /api/groq/ocr    - OCR JSON extraction');
    console.log('  POST /api/groq/extract-text - Extract plain text from file');
    console.log('  POST /api/groq/transcribe   - Audio to text');
    console.log('  POST /api/groq/medical-agent - Gemini Flash smart agent');
    console.log('  POST /api/groq/faq    - FAQ generation');
    console.log('  POST /api/groq/medical-archive - Smart medical archive demo');
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
  createContext
};

// Start server if run directly
if (require.main === module) {
  startServer();
}
