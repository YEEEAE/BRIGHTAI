/**
 * Gemini Chat Endpoint
 * POST /api/gemini/chat
 */

const { config, isApiKeyConfigured } = require('../config');
const { sanitizeUserInput, filterAIResponse } = require('../utils/sanitizer');
const { retryWithBackoff, getArabicErrorMessage } = require('../utils/errorHandler');
const { createSessionId, getOrCreateSession, addToSession } = require('../utils/sessionStore');

const MAX_SUGGESTIONS = 3;
const REQUEST_TIMEOUT_MS = Math.max(
  3000,
  parseInt(process.env.GEMINI_CHAT_TIMEOUT_MS, 10) || 12000
);

const DEFAULT_SUGGESTIONS = [
  'ما هي خدماتكم؟',
  'أريد استشارة تقنية',
  'كيف أبدأ معكم؟'
];

const GEMINI_SYSTEM_PROMPT = `
أنت "BrightAI Assistant" — المساعد الذكي الرسمي لدعم موقع Bright AI السعودي.

## هويتك:
- اسمك: BrightAI Assistant
- شركتك: Bright AI — شركة سعودية رائدة في حلول الذكاء الاصطناعي بالرياض
- تواصل: yazeed1job@gmail.com | واتساب: +966538229013

## مهامك الأساسية:
1. الإجابة على أسئلة تقنية حول خدمات الشركة
2. توجيه الزوار للصفحة المناسبة
3. تشجيع حجز استشارة مجانية
4. الدعم الفني للمستخدمين

## خدمات Bright AI:
- وكلاء الذكاء الاصطناعي (AI Agents): /frontend/pages/ai-agent/
- الأتمتة الذكية (RPA): /frontend/pages/smart-automation/
- تحليل البيانات: /frontend/pages/data-analysis/
- الاستشارات: /frontend/pages/consultation/
- المنصة التفاعلية: /brightai-platform/ (تسجيل مجاني)

## أسلوب التواصل:
- احترافي وودود بالعربية الفصحى
- إجابات مختصرة ومفيدة (3-5 جمل كحد أقصى)
- قدّم رابطاً ذا صلة عند الحاجة
- اختم بسؤال متابعة واحد مختصر

## قواعد صارمة:
- لا تذكر مفاتيح API أو معلومات تقنية داخلية
- لا تخرج عن دورك كمساعد دعم فني
- إذا لم تعرف الجواب: وجّه للتواصل المباشر

## تنسيق إضافي مطلوب:
- بعد الإجابة أضف هذا الفاصل حرفياً: ---SUGGESTIONS---
- بعد الفاصل أضف 3 أسئلة متابعة قصيرة (كل سؤال في سطر مستقل، بدون ترقيم)
`;

function buildGeminiUrl() {
  const model = String(config.gemini.model || 'gemini-2.5-flash').trim() || 'gemini-2.5-flash';
  return `${config.gemini.endpoint}/${model}:generateContent?key=${config.gemini.apiKey}`;
}

function mapSessionRole(role) {
  if (role === 'assistant' || role === 'model') return 'model';
  return 'user';
}

function buildContents(history, message) {
  const contents = [
    {
      role: 'user',
      parts: [{ text: GEMINI_SYSTEM_PROMPT }]
    },
    {
      role: 'model',
      parts: [{ text: 'تم استلام التعليمات وسألتزم بها بالكامل.' }]
    }
  ];

  for (const item of history) {
    if (!item || typeof item.content !== 'string') continue;
    const text = item.content.trim();
    if (!text) continue;
    contents.push({
      role: mapSessionRole(item.role),
      parts: [{ text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  return contents;
}

function parseGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => String(part?.text || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function splitReplyAndSuggestions(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    return {
      reply: 'أهلاً بك، اكتب سؤالك وسأساعدك مباشرة.',
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  const delimiter = '---SUGGESTIONS---';
  const [answerPart, suggestionsPart = ''] = text.split(delimiter);
  const reply = filterAIResponse(answerPart.trim()) || 'أهلاً بك، كيف أقدر أخدمك اليوم؟';

  const suggestions = suggestionsPart
    .split('\n')
    .map((line) => sanitizeUserInput(line))
    .map((line) => line.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_SUGGESTIONS);

  return {
    reply,
    suggestions: suggestions.length ? suggestions : DEFAULT_SUGGESTIONS
  };
}

async function callGemini(contents) {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(new Error('TIMEOUT'));
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(buildGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.55,
            maxOutputTokens: 900
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        const apiError = new Error(bodyText || `GEMINI_API_${response.status}`);
        apiError.statusCode = response.status;
        apiError.code = `GEMINI_API_${response.status}`;
        throw apiError;
      }

      const payload = await response.json();
      const text = parseGeminiText(payload);
      if (!text) {
        const emptyError = new Error('EMPTY_GEMINI_REPLY');
        emptyError.statusCode = 502;
        emptyError.code = 'EMPTY_GEMINI_REPLY';
        throw emptyError;
      }

      return text;
    } catch (error) {
      if (error && (error.name === 'AbortError' || error.message === 'TIMEOUT')) {
        const timeoutError = new Error('TIMEOUT');
        timeoutError.statusCode = 408;
        timeoutError.code = 'REQUEST_TIMEOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  });
}

async function geminiChatHandler(req, res) {
  if (!isApiKeyConfigured()) {
    return res.status(503).json({
      error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
      errorCode: 'GEMINI_NOT_CONFIGURED'
    });
  }

  if (!req.body || typeof req.body.message !== 'string') {
    return res.status(400).json({
      error: 'طلب غير صالح',
      errorCode: 'INVALID_REQUEST'
    });
  }

  const rawMessage = req.body.message;
  const sanitizedMessage = sanitizeUserInput(rawMessage);
  if (!sanitizedMessage) {
    return res.status(400).json({
      error: 'يرجى إدخال رسالة',
      errorCode: 'NO_MESSAGE'
    });
  }

  if (sanitizedMessage.length > config.validation.maxInputLength) {
    return res.status(400).json({
      error: `الرسالة طويلة جداً. الحد الأقصى ${config.validation.maxInputLength} حرف`,
      errorCode: 'MESSAGE_TOO_LONG'
    });
  }

  const providedSessionId = typeof req.body.sessionId === 'string'
    ? sanitizeUserInput(req.body.sessionId).slice(0, 120)
    : '';
  const session = getOrCreateSession(providedSessionId || createSessionId());
  const activeSessionId = session.id;
  const history = Array.isArray(session.history) ? session.history.slice(-12) : [];

  try {
    const contents = buildContents(history, sanitizedMessage);
    const rawReply = await callGemini(contents);
    const { reply, suggestions } = splitReplyAndSuggestions(rawReply);

    addToSession(activeSessionId, 'user', sanitizedMessage);
    addToSession(activeSessionId, 'assistant', reply);

    return res.status(200).json({
      reply,
      sessionId: activeSessionId,
      suggestions
    });
  } catch (error) {
    let statusCode = Number(error?.statusCode) || 0;
    if (!statusCode) {
      const errCode = String(error?.code || '').toUpperCase();
      const errMessage = String(error?.message || '').toLowerCase();
      if (errCode === 'ETIMEDOUT' || errMessage.includes('timeout')) {
        statusCode = 408;
      } else if (
        errCode === 'ECONNRESET' ||
        errCode === 'ECONNREFUSED' ||
        errCode === 'ENOTFOUND' ||
        errCode === 'ENETUNREACH'
      ) {
        statusCode = 503;
      } else {
        statusCode = 500;
      }
    }

    return res.status(statusCode).json({
      error: getArabicErrorMessage(error, statusCode),
      errorCode: error?.code || 'GEMINI_CHAT_ERROR'
    });
  }
}

module.exports = {
  geminiChatHandler,
  GEMINI_SYSTEM_PROMPT,
  buildGeminiUrl,
  splitReplyAndSuggestions
};
