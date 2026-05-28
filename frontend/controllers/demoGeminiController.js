const { runGeminiDemo } = require('../services/geminiDemoService');
const { sanitizeText } = require('../utils/inputSanitizer');
const { hashInputPreview, logDemoEvent, logDemoError } = require('../utils/logger');

async function demoGeminiController(req, res, next) {
  const { demoType, input } = req.demoRequest;
  const startedAt = Date.now();
  const requestId = sanitizeText(req.headers['x-request-id'], 120) || req.id || 'unknown';
  const inputHash = hashInputPreview(input?.message || input?.scenarioId || '');
  try {
    const payload = await runGeminiDemo({ demoType, input });
    logDemoEvent('request_complete', {
      requestId,
      demoType,
      inputHash,
      processingTime: Date.now() - startedAt,
      model: payload.model,
      status: 200
    });
    return res.status(200).json(payload);
  } catch (error) {
    logDemoError('request_failed', error, {
      requestId,
      demoType,
      inputHash,
      processingTime: Date.now() - startedAt,
      model: 'unknown',
      status: error?.statusCode || 500
    });
    return next(error);
  }
}

module.exports = {
  demoGeminiController
};
