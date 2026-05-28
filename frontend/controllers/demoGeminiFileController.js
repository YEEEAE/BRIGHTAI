const { runGeminiFileDemo } = require('../services/geminiDemoService');
const { sanitizeText } = require('../utils/inputSanitizer');
const { hashInputPreview, logDemoEvent, logDemoError } = require('../utils/logger');

async function demoGeminiFileController(req, res, next) {
  const { demoType, input, file } = req.demoRequest;
  const startedAt = Date.now();
  const requestId = sanitizeText(req.headers['x-request-id'], 120) || req.id || 'unknown';
  const inputHash = hashInputPreview(`${input?.message || ''}:${file?.filename || ''}`);
  try {
    const payload = await runGeminiFileDemo({ demoType, input, file });
    logDemoEvent('file_request_complete', {
      requestId,
      demoType,
      inputHash,
      processingTime: Date.now() - startedAt,
      model: payload.model,
      status: 200,
      fileSize: file?.size || 0,
      mimeType: file?.mimeType || 'unknown'
    });
    return res.status(200).json(payload);
  } catch (error) {
    logDemoError('file_request_failed', error, {
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
  demoGeminiFileController
};
