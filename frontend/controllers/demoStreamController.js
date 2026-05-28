const { streamGeminiDemo } = require('../services/geminiDemoService');
const { sanitizeText } = require('../utils/inputSanitizer');
const { hashInputPreview, logDemoEvent, logDemoError } = require('../utils/logger');

function writeSse(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function demoStreamController(req, res, next) {
  const { demoType, input } = req.demoRequest;
  const startedAt = Date.now();
  const requestId = sanitizeText(req.headers['x-request-id'], 120) || req.id || 'unknown';
  const inputHash = hashInputPreview(input?.message || input?.scenarioId || '');
  try {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    for await (const event of streamGeminiDemo({ demoType, input })) {
      writeSse(res, event);
    }
    logDemoEvent('stream_complete', {
      requestId,
      demoType,
      inputHash,
      processingTime: Date.now() - startedAt,
      model: 'gemini-stream',
      status: 200
    });
    return res.end();
  } catch (error) {
    logDemoError('stream_failed', error, {
      requestId,
      demoType,
      inputHash,
      processingTime: Date.now() - startedAt,
      model: 'gemini-stream',
      status: error?.statusCode || 500
    });
    if (res.headersSent) {
      writeSse(res, { type: 'error', errorCode: error.code || 'INTERNAL_ERROR' });
      return res.end();
    }
    return next(error);
  }
}

module.exports = {
  demoStreamController
};
