/**
 * BrightAI Server
 * Main entry point for the AI Gateway server
 * Requirements: 23.1, 23.2, 23.3, 23.4
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { config, validateConfig } = require('./config');
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');
const { chatHandler } = require('./endpoints/chat');
const { searchHandler } = require('./endpoints/search');
const { medicalHandler } = require('./endpoints/medical');
const { summaryHandler } = require('./endpoints/summary');
const { groqStreamHandler, groqOcrHandler, groqFaqHandler } = require('./endpoints/groq');

// CORS headers for API responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

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
      const maxSize = url === '/api/groq/ocr'
        ? config.validation.ocrMaxBodyBytes
        : config.validation.maxBodyBytes;
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
    } else if (method === 'POST' && url === '/api/groq/faq') {
      await groqFaqHandler(ctx.req, ctx.res);
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

  server.listen(config.server.port, () => {
    console.log(`BrightAI Server running on port ${config.server.port}`);
    console.log(`Environment: ${config.server.nodeEnv}`);
    console.log('Endpoints:');
    console.log('  POST /api/ai/chat    - Chatbot conversations');
    console.log('  POST /api/ai/search  - Smart search');
    console.log('  POST /api/ai/medical - Medical image analysis');
    console.log('  POST /api/ai/summary - Text summarization');
    console.log('  POST /api/groq/stream - Groq streaming demo');
    console.log('  POST /api/groq/ocr    - OCR JSON extraction');
    console.log('  POST /api/groq/faq    - FAQ generation');
    console.log('  GET  /api/docs       - API Documentation (Swagger UI)');
    console.log('  GET  /api/health     - Health check');
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
