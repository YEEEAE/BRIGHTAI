const { DEMO_KEYS, getDemoPrompt } = require('./demoPromptRegistry');
const { sanitizeUserInput } = require('../utils/sanitizer');

const MAX_FIELD_LENGTH = 1600;
const MAX_CONTEXT_FIELDS = 12;

function createValidationError(message, code = 'INVALID_DEMO_REQUEST') {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = code;
  error.userMessage = message;
  return error;
}

function normalizeDemoKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^demo\//, '')
    .replace(/\/index\.html$/, '')
    .replace(/\.html$/, '');
}

function cleanText(value, fallback = '') {
  const cleaned = sanitizeUserInput(String(value || fallback || '')).trim();
  return cleaned.slice(0, MAX_FIELD_LENGTH);
}

function normalizeContext(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const entries = Object.entries(source).slice(0, MAX_CONTEXT_FIELDS);
  return Object.fromEntries(entries.map(([key, value]) => [
    cleanText(key).slice(0, 80),
    Array.isArray(value)
      ? value.map(item => cleanText(item).slice(0, 240)).filter(Boolean).slice(0, 8)
      : cleanText(value)
  ]).filter(([key, value]) => key && (Array.isArray(value) ? value.length : value)));
}

function validateDemoRunRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createValidationError('طلب الديمو غير صالح');
  }

  const demoKey = normalizeDemoKey(body.demoKey || body.demo || body.sourcePage);
  const promptConfig = getDemoPrompt(demoKey);
  if (!promptConfig) {
    throw createValidationError(`الديمو غير مدعوم. الديموهات المتاحة: ${DEMO_KEYS.join(', ')}`, 'UNSUPPORTED_DEMO');
  }

  const businessGoal = cleanText(body.businessGoal || body.goal || body.message);
  const industry = cleanText(body.industry || body.sector || 'قطاع أعمال سعودي');
  const companySize = cleanText(body.companySize || body.size || 'غير محدد');
  const currentProcess = cleanText(body.currentProcess || body.process || body.challenge);
  const successMetric = cleanText(body.successMetric || body.metric || body.kpi);
  const urgency = cleanText(body.urgency || 'خلال 30 إلى 90 يوم');
  const context = normalizeContext(body.context);

  if (!businessGoal || businessGoal.length < 12) {
    throw createValidationError('اكتب هدفاً تجارياً واضحاً لا يقل عن 12 حرفاً', 'MISSING_BUSINESS_GOAL');
  }

  return {
    demoKey,
    promptConfig,
    businessGoal,
    industry,
    companySize,
    currentProcess,
    successMetric,
    urgency,
    context,
    locale: cleanText(body.locale || 'ar-SA').slice(0, 12) || 'ar-SA',
    sourcePage: cleanText(body.sourcePage || demoKey).slice(0, 160)
  };
}

module.exports = {
  validateDemoRunRequest,
  normalizeDemoKey
};
