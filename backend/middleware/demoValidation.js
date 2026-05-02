const { createHttpError } = require('../utils/httpErrors');
const { sanitizeObject, sanitizeText } = require('../utils/inputSanitizer');
const { isSupportedDemoType } = require('../services/demoPromptRegistry');
const { assertSafeDemoInput } = require('../services/demoSafetyFilter');

const SUPPORTED_LOCALES = new Set(['ar-SA', 'en-SA']);
const SCENARIO_ID_PATTERN = /^[A-Za-z0-9-]+$/;
const MAX_MESSAGE_LENGTH = 3000;
const MAX_DATA_ANALYZER_MESSAGE_LENGTH = 60000;
const MAX_MEDICAL_ARCHIVE_MESSAGE_LENGTH = 12000;
const MAX_BODY_BYTES = Number(process.env.DEMO_API_MAX_BODY_SIZE || process.env.DEMO_MAX_BODY_BYTES) || 256 * 1024;
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /reveal\s+(your\s+)?(system|developer)\s+(prompt|instructions|message)/i,
  /print\s+(your\s+)?(system|developer)\s+(prompt|instructions|message)/i,
  /act\s+as\s+(dan|developer\s+mode|jailbreak)/i,
  /تجاهل\s+(كل\s+)?(التعليمات|الأوامر)\s+(السابقة|أعلاه)/i,
  /اكشف\s+(تعليمات|رسالة|برومبت)\s+(النظام|المطور)/i,
  /اطبع\s+(تعليمات|رسالة|برومبت)\s+(النظام|المطور)/i
];

function demoPayloadSizeGuard(req, _res, next) {
  const length = Number(req.headers['content-length'] || 0);
  if (length > MAX_BODY_BYTES) return next(createHttpError('PAYLOAD_TOO_LARGE'));
  return next();
}

function hasPromptInjectionAttempt(input) {
  const text = [
    input?.scenarioId,
    input?.message,
    JSON.stringify(input?.metadata || {})
  ].filter(Boolean).join('\n');
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

function validateDemoRequest(req, _res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(createHttpError('VALIDATION_ERROR'));
  }

  const demoType = sanitizeText(body.demoType, 80);
  if (!isSupportedDemoType(demoType)) {
    return next(createHttpError('UNSUPPORTED_DEMO_TYPE'));
  }

  const inputSource = body.input && typeof body.input === 'object' && !Array.isArray(body.input) ? body.input : null;
  if (!inputSource) return next(createHttpError('VALIDATION_ERROR'));
  const maxMessageLength = demoType === 'smart-medical-archive'
    ? MAX_MEDICAL_ARCHIVE_MESSAGE_LENGTH
    : demoType === 'data-analyzer'
      ? MAX_DATA_ANALYZER_MESSAGE_LENGTH
      : MAX_MESSAGE_LENGTH;
  if (typeof inputSource.message === 'string' && inputSource.message.length > maxMessageLength) {
    return next(createHttpError('VALIDATION_ERROR'));
  }

  const input = sanitizeObject(inputSource);
  input.scenarioId = sanitizeText(input.scenarioId, 120);
  input.message = sanitizeText(inputSource.message || input.message || '', maxMessageLength);
  input.locale = sanitizeText(input.locale, 8);

  if (!input.scenarioId || !SCENARIO_ID_PATTERN.test(input.scenarioId) || !SUPPORTED_LOCALES.has(input.locale)) {
    return next(createHttpError('VALIDATION_ERROR'));
  }

  if (hasPromptInjectionAttempt(input)) {
    return next(createHttpError('VALIDATION_ERROR'));
  }

  try {
    req.demoRequest = {
      demoType,
      input,
      safety: assertSafeDemoInput(demoType, input)
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  MAX_BODY_BYTES,
  MAX_DATA_ANALYZER_MESSAGE_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_MEDICAL_ARCHIVE_MESSAGE_LENGTH,
  SCENARIO_ID_PATTERN,
  SUPPORTED_LOCALES,
  demoPayloadSizeGuard,
  validateDemoRequest
};
