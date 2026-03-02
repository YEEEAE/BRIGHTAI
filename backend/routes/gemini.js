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
أنت "BrightAI Assistant" — المساعد الذكي الرسمي لموقع Bright AI في السعودية.

## الهوية والدور:
- اسمك: BrightAI Assistant
- شركتك: Bright AI — شركة سعودية متخصصة في حلول الذكاء الاصطناعي
- التواصل البشري: yazeed1job@gmail.com | واتساب: +966538229013
- نبرة الرد: عربية واضحة مع لمسة سعودية مهنية خفيفة عند الحاجة
- دورك: مساعدة تقنية وتجارية، وتوجيه المستخدم بسرعة للخطوة التالية

## خدمات Bright AI التي تشرحها بثقة:
- وكلاء الذكاء الاصطناعي (AI Agents): /ai-agent
- الأتمتة الذكية (RPA): /smart-automation
- تحليل البيانات: /data-analysis
- الاستشارات: /consultation
- المنصة التفاعلية: /brightai-platform/
- حلول مخصصة للقطاعات السعودية: حكومي، صحي، تجزئة، لوجستيات، صناعة

## سيناريوهات إلزامية:
1) حجز موعد / استشارة:
- اجمع: الاسم، جهة العمل، المجال، الوقت المناسب للتواصل
- اقترح صفحة الاستشارات أو التواصل المباشر

2) طلب عرض سعر:
- اجمع: نوع الخدمة، حجم الاستخدام، عدد المستخدمين، التكاملات المطلوبة، الإطار الزمني
- إذا البيانات ناقصة، اطلبها بنقاط قصيرة ومباشرة

3) الدعم التقني:
- اجمع: وصف المشكلة، الصفحة/المسار، وقت حدوث الخطأ، المتصفح/الجهاز، لقطة شاشة إن وجدت
- قدم أول خطوة حل عملية قبل أي تصعيد

## قواعد التصعيد لفريق بشري (مهم):
- صعّد فوراً إذا المستخدم طلب موظف بشري أو مكالمة مباشرة
- صعّد فوراً عند شكاوى متكررة أو عطل تشغيلي مؤثر
- صعّد فوراً في مسائل قانونية/مالية/عقود أو بلاغات أمن وخصوصية
- عند التصعيد: وضّح قناة التصعيد (واتساب + البريد) بنهاية الرد

## أسلوب الرد:
- إجابة مختصرة وواضحة (2 إلى 5 جمل)
- لا تذكر أي مفاتيح API أو تفاصيل داخلية
- اختم بسؤال متابعة واحد مختصر يساعد على التقدم
- إذا السؤال خارج النطاق، قل ذلك بوضوح ووجّه لمسار تواصل مناسب

## تنسيق إضافي مطلوب:
- بعد الإجابة أضف هذا الفاصل حرفياً: ---SUGGESTIONS---
- بعد الفاصل أضف 3 أسئلة متابعة قصيرة (كل سؤال في سطر مستقل، بدون ترقيم)
`;
const STREAM_SYSTEM_PROMPT_MARKER = '## تنسيق إضافي مطلوب:';
const GEMINI_STREAM_SYSTEM_PROMPT = (() => {
  const markerIndex = GEMINI_SYSTEM_PROMPT.indexOf(STREAM_SYSTEM_PROMPT_MARKER);
  if (markerIndex < 0) return GEMINI_SYSTEM_PROMPT;
  return `${GEMINI_SYSTEM_PROMPT.slice(0, markerIndex)}${STREAM_SYSTEM_PROMPT_MARKER}
- قدم الإجابة مباشرة بدون فواصل خاصة أو قوائم اقتراحات.
- لا تضف عبارة ---SUGGESTIONS--- مطلقاً.`;
})();

function resolveGeminiApiKey() {
  const envValue = typeof process.env.GEMINI_API_KEY === 'string'
    ? process.env.GEMINI_API_KEY.trim()
    : '';
  if (envValue && envValue !== 'YOUR_SECRET_HERE') return envValue;

  const configValue = typeof config.gemini.apiKey === 'string'
    ? config.gemini.apiKey.trim()
    : '';
  if (configValue && configValue !== 'YOUR_SECRET_HERE') return configValue;

  return '';
}

function buildGeminiUrl() {
  const model = String(config.gemini.model || 'gemini-2.5-flash').trim() || 'gemini-2.5-flash';
  const base = `${config.gemini.endpoint}/${model}:generateContent`;
  const apiKey = resolveGeminiApiKey();
  if (apiKey) {
    return `${base}?key=${encodeURIComponent(apiKey)}`;
  }
  return base;
}

function buildGeminiStreamUrl() {
  const model = String(config.gemini.model || 'gemini-2.5-flash').trim() || 'gemini-2.5-flash';
  const base = `${config.gemini.endpoint}/${model}:streamGenerateContent`;
  const params = new URLSearchParams();
  params.set('alt', 'sse');
  const apiKey = resolveGeminiApiKey();
  if (apiKey) {
    params.set('key', apiKey);
  }
  return `${base}?${params.toString()}`;
}

function mapSessionRole(role) {
  if (role === 'assistant' || role === 'model') return 'model';
  return 'user';
}

function buildContents(history, message, systemPrompt = GEMINI_SYSTEM_PROMPT) {
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }]
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

function normalizeStatusCode(error) {
  let statusCode = Number(error?.statusCode) || 0;
  if (statusCode) return statusCode;
  const errCode = String(error?.code || '').toUpperCase();
  const errMessage = String(error?.message || '').toLowerCase();
  if (errCode === 'ETIMEDOUT' || errMessage.includes('timeout')) return 408;
  if (
    errCode === 'ECONNRESET' ||
    errCode === 'ECONNREFUSED' ||
    errCode === 'ENOTFOUND' ||
    errCode === 'ENETUNREACH'
  ) {
    return 503;
  }
  return 500;
}

function createInputError(statusCode, message, errorCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = errorCode;
  error.userMessage = message;
  return error;
}

function parseIncomingChatRequest(req) {
  if (!isApiKeyConfigured()) {
    throw createInputError(
      503,
      'خدمة الذكاء الاصطناعي غير متاحة حالياً — مفتاح GEMINI_API_KEY غير مُعد في بيئة الإنتاج. أضفه في إعدادات Netlify Environment Variables.',
      'GEMINI_NOT_CONFIGURED'
    );
  }

  if (!req.body || typeof req.body.message !== 'string') {
    throw createInputError(400, 'طلب غير صالح', 'INVALID_REQUEST');
  }

  const rawMessage = req.body.message;
  const sanitizedMessage = sanitizeUserInput(rawMessage);
  if (!sanitizedMessage) {
    throw createInputError(400, 'يرجى إدخال رسالة', 'NO_MESSAGE');
  }

  if (sanitizedMessage.length > config.validation.maxInputLength) {
    throw createInputError(
      400,
      `الرسالة طويلة جداً. الحد الأقصى ${config.validation.maxInputLength} حرف`,
      'MESSAGE_TOO_LONG'
    );
  }

  const providedSessionId = typeof req.body.sessionId === 'string'
    ? sanitizeUserInput(req.body.sessionId).slice(0, 120)
    : '';
  const session = getOrCreateSession(providedSessionId || createSessionId());
  const activeSessionId = session.id;
  const history = Array.isArray(session.history) ? session.history.slice(-12) : [];

  return {
    sanitizedMessage,
    activeSessionId,
    history
  };
}

function writeSse(streamRes, payload) {
  streamRes.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function extractStreamPayloadText(parsedPayload, fallbackAccumulator = '') {
  const text = parseGeminiText(parsedPayload);
  if (!text) return '';
  if (fallbackAccumulator && text.startsWith(fallbackAccumulator)) {
    return text.slice(fallbackAccumulator.length);
  }
  return text;
}

async function callGeminiStream(contents, { signal, onToken } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error('TIMEOUT'));
  }, REQUEST_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason || new Error('ABORTED'));
    } else {
      signal.addEventListener(
        'abort',
        () => controller.abort(signal.reason || new Error('ABORTED')),
        { once: true }
      );
    }
  }

  let accumulated = '';

  try {
    const response = await fetch(buildGeminiStreamUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.gemini.apiKey
      },
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

    const reader = response.body?.getReader?.();
    if (!reader) {
      const bodyText = await response.text().catch(() => '');
      if (!bodyText.trim()) {
        const emptyError = new Error('EMPTY_GEMINI_REPLY');
        emptyError.statusCode = 502;
        emptyError.code = 'EMPTY_GEMINI_REPLY';
        throw emptyError;
      }
      accumulated = bodyText.trim();
      if (onToken) onToken(accumulated);
      return accumulated;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processChunk = (rawChunk) => {
      const lines = rawChunk.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.replace(/^data:\s*/, '');
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = extractStreamPayloadText(parsed, accumulated);
          if (!delta) continue;
          accumulated += delta;
          if (onToken) onToken(delta);
        } catch (_error) {
          continue;
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';
      chunks.forEach(processChunk);
    }

    if (buffer.trim()) {
      processChunk(buffer);
    }

    if (!accumulated.trim()) {
      const emptyError = new Error('EMPTY_GEMINI_REPLY');
      emptyError.statusCode = 502;
      emptyError.code = 'EMPTY_GEMINI_REPLY';
      throw emptyError;
    }

    return accumulated;
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
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.gemini.apiKey
        },
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
  try {
    const { sanitizedMessage, activeSessionId, history } = parseIncomingChatRequest(req);
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
    const statusCode = normalizeStatusCode(error);

    return res.status(statusCode).json({
      error: error?.userMessage || getArabicErrorMessage(error, statusCode),
      errorCode: error?.code || 'GEMINI_CHAT_ERROR'
    });
  }
}

async function geminiChatStreamHandler(req, res, rawRes) {
  const streamRes = rawRes || res;

  let chatContext;
  try {
    chatContext = parseIncomingChatRequest(req);
  } catch (error) {
    const statusCode = normalizeStatusCode(error);
    return res.status(statusCode).json({
      error: error?.userMessage || getArabicErrorMessage(error, statusCode),
      errorCode: error?.code || 'GEMINI_CHAT_ERROR'
    });
  }

  const { sanitizedMessage, activeSessionId, history } = chatContext;

  streamRes.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  writeSse(streamRes, { type: 'session', sessionId: activeSessionId });

  const controller = new AbortController();
  req.on('close', () => {
    const closeError = new Error('CLIENT_ABORTED');
    closeError.code = 'CLIENT_ABORTED';
    controller.abort(closeError);
  });

  let assistantText = '';

  try {
    const contents = buildContents(history, sanitizedMessage, GEMINI_STREAM_SYSTEM_PROMPT);
    addToSession(activeSessionId, 'user', sanitizedMessage);

    assistantText = await callGeminiStream(contents, {
      signal: controller.signal,
      onToken: (delta) => {
        if (!delta) return;
        writeSse(streamRes, { type: 'token', token: delta });
      }
    });

    const { reply, suggestions } = splitReplyAndSuggestions(assistantText);
    const safeReply = reply || 'أهلاً بك، كيف أقدر أخدمك اليوم؟';

    addToSession(activeSessionId, 'assistant', safeReply);
    writeSse(streamRes, {
      type: 'done',
      reply: safeReply,
      sessionId: activeSessionId,
      suggestions
    });
    streamRes.write('data: [DONE]\n\n');
  } catch (error) {
    if (error?.code === 'CLIENT_ABORTED') {
      try { streamRes.end(); } catch (_endError) { /* ignore */ }
      return;
    }
    const statusCode = normalizeStatusCode(error);
    writeSse(streamRes, {
      type: 'error',
      error: error?.userMessage || getArabicErrorMessage(error, statusCode),
      errorCode: error?.code || 'GEMINI_CHAT_STREAM_ERROR',
      statusCode
    });
    streamRes.write('data: [DONE]\n\n');
  } finally {
    try {
      streamRes.end();
    } catch (_endError) {
      // Ignore closed connection errors.
    }
  }
}

module.exports = {
  geminiChatHandler,
  geminiChatStreamHandler,
  GEMINI_SYSTEM_PROMPT,
  GEMINI_STREAM_SYSTEM_PROMPT,
  buildGeminiUrl,
  buildGeminiStreamUrl,
  splitReplyAndSuggestions
};
