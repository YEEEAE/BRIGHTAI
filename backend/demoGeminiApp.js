const express = require('express');
const demoGeminiRoutes = require('./routes/demoGemini');
const demoGeminiStreamRoutes = require('./routes/demoGeminiStream');
const { demoCors } = require('./middleware/demoCors');
const { demoSecurityHeaders } = require('./middleware/demoSecurityHeaders');
const { demoPayloadSizeGuard, MAX_BODY_BYTES } = require('./middleware/demoValidation');
const { MAX_DEMO_FILE_BYTES } = require('./middleware/demoMultipartUpload');
const { sendError, createHttpError } = require('./utils/httpErrors');

function createDemoGeminiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(demoSecurityHeaders);
  app.use(demoCors);
  app.use((req, res, next) => {
    if (String(req.headers['content-type'] || '').includes('multipart/form-data')) {
      const length = Number(req.headers['content-length'] || 0);
      if (length > MAX_DEMO_FILE_BYTES + 64 * 1024) return next(createHttpError('PAYLOAD_TOO_LARGE'));
      return next();
    }
    return demoPayloadSizeGuard(req, res, next);
  });
  app.use(express.json({
    limit: `${MAX_BODY_BYTES}b`,
    strict: true
  }));
  app.use('/api/demo', demoGeminiRoutes);
  app.use('/api/demo', demoGeminiStreamRoutes);
  app.use((error, _req, _res, next) => {
    if (error?.type === 'entity.too.large') return next(createHttpError('PAYLOAD_TOO_LARGE'));
    if (error instanceof SyntaxError) return next(createHttpError('VALIDATION_ERROR'));
    return next(error);
  });
  app.use((error, _req, res, _next) => sendError(res, error));
  return app;
}

const demoGeminiApp = createDemoGeminiApp();

function canHandleDemoGeminiRoute(method, url) {
  return (method === 'POST' || method === 'OPTIONS') && (
    url === '/api/demo/gemini' ||
    url === '/api/demo/gemini/stream' ||
    url === '/api/demo/gemini/file'
  );
}

module.exports = {
  createDemoGeminiApp,
  demoGeminiApp,
  canHandleDemoGeminiRoute
};
