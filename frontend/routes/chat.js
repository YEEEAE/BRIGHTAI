/**
 * Legacy chat route.
 * Provider access is centralized in services/aiGateway.js.
 */

const { unifiedChatHandler, buildLocalSupportReply } = require('./aiGateway');
const { runGeminiCompletion, resolveModel } = require('../services/aiGateway');

const ERROR_MESSAGES = {
  NO_MESSAGE: 'يرجى إدخال رسالة',
  MESSAGE_TOO_LONG: 'الرسالة طويلة جداً',
  API_NOT_CONFIGURED: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
  API_ERROR: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى',
  INVALID_REQUEST: 'طلب غير صالح'
};

const ENTERPRISE_SYSTEM_PROMPT = 'أنت مستشار Bright AI الرسمي. أجب بالعربية باختصار ووجّه المستخدم للخطوة التالية.';

function buildGeminiUrl() {
  return `/api/ai/chat/completions?model=${encodeURIComponent(resolveModel())}`;
}

async function callGeminiAPI(message, history = []) {
  const messages = [
    { role: 'system', content: ENTERPRISE_SYSTEM_PROMPT },
    ...history.map(item => ({
      role: item?.sender === 'user' ? 'user' : 'assistant',
      content: item?.text || ''
    })),
    { role: 'user', content: message }
  ];

  const result = await runGeminiCompletion({
    messages,
    temperature: 0.7,
    maxOutputTokens: 1024,
    demoType: 'site_chat',
    agentType: 'support_chat',
    sourcePage: '/api/ai/chat'
  });

  if (!result.ok) {
    const error = new Error(result.error?.message_ar || ERROR_MESSAGES.API_ERROR);
    error.statusCode = result.statusCode || 503;
    error.code = result.error?.code || 'AI_PROVIDER_UNAVAILABLE';
    throw error;
  }

  return result.text || result.data?.text || '';
}

module.exports = {
  chatHandler: unifiedChatHandler,
  buildLocalSupportReply,
  ERROR_MESSAGES,
  callGeminiAPI,
  buildGeminiUrl,
  ENTERPRISE_SYSTEM_PROMPT
};
