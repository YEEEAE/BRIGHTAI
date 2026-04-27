/**
 * BrightAI Unified AI Gateway
 * طبقة موحدة لكل استدعاءات الذكاء الاصطناعي في المشروع
 * - Gemini كمزود أساسي
 * - اختيار المزود بشكل صحيح بناءً على البيئة
 * - توحيد payload و response و error handling
 */

const { config, isApiKeyConfigured, isGroqConfigured, isNvidiaConfigured, isDeepSeekConfigured } = require('../config');
const { sanitizeUserInput, filterAIResponse } = require('../utils/sanitizer');
const { retryWithBackoff } = require('../utils/errorHandler');
const { createSessionId, getOrCreateSession, addToSession } = require('../utils/sessionStore');
const { pickProvider, callOpenAiCompatibleProvider } = require('./openaiCompatProvider');

const REQUEST_TIMEOUT_MS = Math.max(3000, parseInt(process.env.AI_GATEWAY_TIMEOUT_MS, 10) || 30000);
const MAX_SUGGESTIONS = 3;
const DEFAULT_SUGGESTIONS = [
  'ما هي خدماتكم؟',
  'أريد استشارة تقنية',
  'كيف أبدأ معكم؟'
];

const CHAT_SYSTEM_PROMPT = `
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
- حلول مخصصة للقطاعات السعودية: حكومي، صحي، تجزئة، لوجستيات، صناعة

## سيناريوهات إلزامية:
1) حجز موعد / استشارة:
- اجمع: الاسم، جهة العمل، المجال، الوقت المناسب للتواصل
- اقترح صفحة الاستشارات أو التواصل المباشر

2) طلب عرض سعر:
- اجمع: نوع الخدمة، حجم الاستخدام، عدد المستخدمين، التكاملات المطلوبة
- إذا البيانات ناقصة، اطلبها بنقاط قصيرة ومباشرة

3) الدعم التقني:
- اجمع: وصف المشكلة، الصفحة/المسار، وقت حدوث الخطأ، المتصفح/الجهاز
- قدم أول خطوة حل عملية قبل أي تصعيد

## قواعد التصعيد لفريق بشري:
- صعّد فوراً إذا المستخدم طلب موظف بشري أو مكالمة مباشرة
- صعّد فوراً عند شكاوى متكررة أو عطل تشغيلي مؤثر
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

const STREAM_SYSTEM_PROMPT = (() => {
  const marker = '## تنسيق إضافي مطلوب:';
  const markerIndex = CHAT_SYSTEM_PROMPT.indexOf(marker);
  if (markerIndex < 0) return CHAT_SYSTEM_PROMPT;
  return `${CHAT_SYSTEM_PROMPT.slice(0, markerIndex)}${marker}
- قدم الإجابة مباشرة بدون فواصل خاصة أو قوائم اقتراحات.
- لا تضف عبارة ---SUGGESTIONS--- مطلقاً.`;
})();

function resolveApiKey() {
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

function resolveModel() {
  return String(config.gemini.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim() || 'gemini-2.5-flash';
}

function buildGeminiGenerateUrl(modelOverride) {
  const model = String(modelOverride || resolveModel()).trim() || resolveModel();
  const base = `${config.gemini.endpoint}/${model}:generateContent`;
  const apiKey = resolveApiKey();
  if (apiKey) {
    return `${base}?key=${encodeURIComponent(apiKey)}`;
  }
  return base;
}

function buildGeminiStreamUrl(modelOverride) {
  const model = String(modelOverride || resolveModel()).trim() || resolveModel();
  const base = `${config.gemini.endpoint}/${model}:streamGenerateContent`;
  const params = new URLSearchParams();
  params.set('alt', 'sse');
  const apiKey = resolveApiKey();
  if (apiKey) {
    params.set('key', apiKey);
  }
  return `${base}?${params.toString()}`;
}

function mapSessionRole(role) {
  if (role === 'assistant' || role === 'model') return 'model';
  return 'user';
}

function buildGeminiContents(history, message, systemPrompt) {
  const prompt = systemPrompt || CHAT_SYSTEM_PROMPT;
  const contents = [
    { role: 'user', parts: [{ text: prompt }] },
    { role: 'model', parts: [{ text: 'تم استلام التعليمات وسألتزم بها بالكامل.' }] }
  ];

  for (const item of history) {
    if (!item || typeof item.content !== 'string') continue;
    const text = item.content.trim();
    if (!text) continue;
    contents.push({ role: mapSessionRole(item.role), parts: [{ text }] });
  }

  contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

function parseGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map(part => String(part?.text || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function normalizeGeminiPart(part) {
  if (!part || typeof part !== 'object') return null;
  if (typeof part.text === 'string') return { text: part.text };
  if (part.type === 'text' && typeof part.text === 'string') return { text: part.text };
  if (part.inline_data && part.inline_data.mime_type && part.inline_data.data) {
    return { inline_data: { mime_type: part.inline_data.mime_type, data: part.inline_data.data } };
  }
  if (part.inlineData && (part.inlineData.mime_type || part.inlineData.mimeType) && part.inlineData.data) {
    return {
      inline_data: {
        mime_type: part.inlineData.mime_type || part.inlineData.mimeType,
        data: part.inlineData.data
      }
    };
  }
  if ((part.type === 'input_file' || part.type === 'file') && (part.mime_type || part.mimeType) && part.data) {
    return {
      inline_data: {
        mime_type: part.mime_type || part.mimeType,
        data: part.data
      }
    };
  }
  if (part.type === 'image_url' && part.image_url && typeof part.image_url.url === 'string') {
    const match = part.image_url.url.match(/^data:([^;,]+);base64,(.+)$/);
    if (match) return { inline_data: { mime_type: match[1], data: match[2] } };
  }
  return null;
}

function buildGeminiPartsFromContent(content) {
  if (typeof content === 'string') {
    const text = content.trim();
    return text ? [{ text }] : [];
  }

  if (!Array.isArray(content)) return [];
  const parts = [];
  for (const item of content) {
    const part = normalizeGeminiPart(item);
    if (part) parts.push(part);
  }
  return parts;
}

function splitReplyAndSuggestions(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    return { reply: 'أهلاً بك، اكتب سؤالك وسأساعدك مباشرة.', suggestions: DEFAULT_SUGGESTIONS };
  }

  const delimiter = '---SUGGESTIONS---';
  const [answerPart, suggestionsPart = ''] = text.split(delimiter);
  const reply = filterAIResponse(answerPart.trim()) || 'أهلاً بك، كيف أقدر أخدمك اليوم؟';

  const suggestions = suggestionsPart
    .split('\n')
    .map(line => sanitizeUserInput(line))
    .map(line => line.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_SUGGESTIONS);

  return { reply, suggestions: suggestions.length ? suggestions : DEFAULT_SUGGESTIONS };
}

function normalizeStatusCode(error) {
  let statusCode = Number(error?.statusCode) || 0;
  if (statusCode) return statusCode;
  const errCode = String(error?.code || '').toUpperCase();
  const errMessage = String(error?.message || '').toLowerCase();
  if (errCode === 'ETIMEDOUT' || errMessage.includes('timeout')) return 408;
  if (errCode === 'ECONNRESET' || errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND' || errCode === 'ENETUNREACH') return 503;
  return 500;
}

function createInputError(statusCode, message, errorCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = errorCode;
  error.userMessage = message;
  return error;
}

function validateChatRequest(req) {
  if (!isApiKeyConfigured()) {
    throw createInputError(
      503,
      'خدمة الذكاء الاصطناعي غير متاحة حالياً — مفتاح GEMINI_API_KEY غير مُعد في بيئة الخادم.',
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
    throw createInputError(400, `الرسالة طويلة جداً. الحد الأقصى ${config.validation.maxInputLength} حرف`, 'MESSAGE_TOO_LONG');
  }

  const providedSessionId = typeof req.body.sessionId === 'string'
    ? sanitizeUserInput(req.body.sessionId).slice(0, 120)
    : '';
  const session = getOrCreateSession(providedSessionId || createSessionId());
  const activeSessionId = session.id;
  const history = Array.isArray(session.history) ? session.history.slice(-12) : [];

  return { sanitizedMessage, activeSessionId, history };
}

function normalizeGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return null;
  const copy = Array.isArray(schema) ? schema.map(normalizeGeminiSchema) : { ...schema };
  if (copy.type && typeof copy.type === 'string') copy.type = copy.type.toUpperCase();
  if (copy.properties && typeof copy.properties === 'object') {
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([key, value]) => [key, normalizeGeminiSchema(value)])
    );
  }
  if (copy.items) copy.items = normalizeGeminiSchema(copy.items);
  if (Array.isArray(copy.anyOf)) copy.anyOf = copy.anyOf.map(normalizeGeminiSchema);
  if (Array.isArray(copy.oneOf)) copy.oneOf = copy.oneOf.map(normalizeGeminiSchema);
  if (Array.isArray(copy.allOf)) copy.allOf = copy.allOf.map(normalizeGeminiSchema);
  delete copy.additionalProperties;
  delete copy.$schema;
  return copy;
}

function resolveResponseSchema(body) {
  const responseFormat = body?.response_format || body?.responseFormat || {};
  return normalizeGeminiSchema(
    body?.responseSchema ||
    body?.response_schema ||
    responseFormat?.json_schema?.schema ||
    responseFormat?.schema
  );
}

function resolveSafetySettings(body) {
  if (Array.isArray(body?.safetySettings)) return body.safetySettings;
  if (Array.isArray(body?.safety_settings)) return body.safety_settings;

  const domain = String(body?.domain || body?.demoDomain || '').toLowerCase();
  const threshold = (domain === 'health' || domain === 'medical' || domain === 'medical_archive')
    ? 'BLOCK_LOW_AND_ABOVE'
    : 'BLOCK_MEDIUM_AND_ABOVE';

  return [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold }
  ];
}

async function callGemini(contents, options = {}) {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('TIMEOUT')), REQUEST_TIMEOUT_MS);

    try {
      const generationConfig = {
        temperature: Number.isFinite(Number(options.temperature)) ? Number(options.temperature) : 0.55,
        maxOutputTokens: Number.isFinite(Number(options.maxOutputTokens)) ? Number(options.maxOutputTokens) : 900
      };
      const responseSchema = normalizeGeminiSchema(options.responseSchema);
      if (responseSchema) {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = responseSchema;
      } else if (options.responseMimeType) {
        generationConfig.responseMimeType = options.responseMimeType;
      }

      const response = await fetch(buildGeminiGenerateUrl(options.model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': resolveApiKey()
        },
        body: JSON.stringify({
          contents,
          generationConfig,
          safetySettings: Array.isArray(options.safetySettings) ? options.safetySettings : undefined
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

async function callGeminiStream(contents, { signal, onToken } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('TIMEOUT')), REQUEST_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason || new Error('ABORTED'));
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason || new Error('ABORTED')), { once: true });
    }
  }

  let accumulated = '';

  try {
    const response = await fetch(buildGeminiStreamUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': resolveApiKey()
      },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.55, maxOutputTokens: 900 }
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
          const text = parseGeminiText(parsed);
          if (!text) continue;
          const delta = accumulated && text.startsWith(accumulated) ? text.slice(accumulated.length) : text;
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

    if (buffer.trim()) processChunk(buffer);

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

function writeSse(streamRes, payload) {
  streamRes.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function chat(req) {
  const { sanitizedMessage, activeSessionId, history } = validateChatRequest(req);
  const contents = buildGeminiContents(history, sanitizedMessage, CHAT_SYSTEM_PROMPT);
  const rawReply = await callGemini(contents);
  const { reply, suggestions } = splitReplyAndSuggestions(rawReply);

  addToSession(activeSessionId, 'user', sanitizedMessage);
  addToSession(activeSessionId, 'assistant', reply);

  return { reply, sessionId: activeSessionId, suggestions };
}

async function chatStream(req, rawRes) {
  const streamRes = rawRes;

  let chatContext;
  try {
    chatContext = validateChatRequest(req);
  } catch (error) {
    const statusCode = normalizeStatusCode(error);
    return { error: true, statusCode, errorData: { error: error?.userMessage || 'حدث خطأ', errorCode: error?.code || 'CHAT_ERROR' } };
  }

  const { sanitizedMessage, activeSessionId, history } = chatContext;

  streamRes.writeHead(200, {
    ...(req.corsHeaders || {}),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
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
    const contents = buildGeminiContents(history, sanitizedMessage, STREAM_SYSTEM_PROMPT);
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
    writeSse(streamRes, { type: 'done', reply: safeReply, sessionId: activeSessionId, suggestions });
    streamRes.write('data: [DONE]\n\n');
  } catch (error) {
    if (error?.code === 'CLIENT_ABORTED') {
      try { streamRes.end(); } catch (_e) { /* ignore */ }
      return { error: true, clientAborted: true };
    }
    const statusCode = normalizeStatusCode(error);
    writeSse(streamRes, {
      type: 'error',
      error: error?.userMessage || 'حدث خطأ أثناء البث',
      errorCode: error?.code || 'STREAM_ERROR',
      statusCode
    });
    streamRes.write('data: [DONE]\n\n');
  } finally {
    try { streamRes.end(); } catch (_e) { /* ignore */ }
  }

  return { error: false };
}

async function openAiCompatChat(req) {
  const body = req && req.body && typeof req.body === 'object' ? req.body : {};
  const provider = pickProvider(body);
  const model = String(body.model || '').trim() || resolveModel();
  const temperature = Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.4;
  const maxTokens = Number.isFinite(Number(body.max_tokens || body.maxTokens)) ? Number(body.max_tokens || body.maxTokens) : 900;

  const messages = Array.isArray(body.messages)
    ? body.messages
    : (typeof body.prompt === 'string' && body.prompt.trim()
      ? [{ role: 'user', content: body.prompt }]
      : []);

  if (!messages.length) {
    const error = new Error('يرجى إرسال messages أو prompt');
    error.statusCode = 400;
    error.code = 'INVALID_MESSAGES';
    throw error;
  }

  if (provider === 'nvidia' || provider === 'deepseek') {
    const result = await callOpenAiCompatibleProvider({ provider, messages, temperature, maxTokens, model: body.model });
    return { ...result.data, provider: result.provider, activeModel: result.model };
  }

  if (!isApiKeyConfigured()) {
    const error = new Error('GEMINI_NOT_CONFIGURED');
    error.statusCode = 503;
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  const contents = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;
    const parts = buildGeminiPartsFromContent(msg.content);
    if (!parts.length) continue;
    contents.push({
      role: mapSessionRole(msg.role),
      parts
    });
  }

  if (!contents.length) {
    const error = new Error('يرجى إرسال messages أو prompt');
    error.statusCode = 400;
    error.code = 'INVALID_MESSAGES';
    throw error;
  }

  const activeModel = String(model || resolveModel()).trim() || resolveModel();
  const wantsJson = body.response_format?.type === 'json_object' || body.response_format?.type === 'json_schema' || body.responseFormat?.type === 'json_schema';
  const responseSchema = resolveResponseSchema(body);
  const generationConfig = { temperature, maxOutputTokens: maxTokens };
  if (responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = responseSchema;
  } else if (wantsJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(`${config.gemini.endpoint}/${activeModel}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': resolveApiKey()
    },
    body: JSON.stringify({
      contents,
      generationConfig,
      safetySettings: resolveSafetySettings(body)
    })
  });

  const data = await response.json();
  const text = parseGeminiText(data);

  if (!response.ok) {
    const error = new Error(data?.error?.message || `Gemini API Error (${response.status})`);
    error.statusCode = response.status;
    error.code = `GEMINI_API_${response.status}`;
    throw error;
  }

  return {
    choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
    provider: 'gemini',
    activeModel
  };
}

function getProviderStatus() {
  return {
    gemini: {
      configured: isApiKeyConfigured(),
      model: resolveModel(),
      primary: true,
      message: isApiKeyConfigured() ? 'GEMINI_API_KEY مُعد وجاهز' : 'GEMINI_API_KEY غير مُعد'
    },
    groq: {
      configured: isGroqConfigured(),
      model: config.groq.model,
      primary: false,
      message: isGroqConfigured() ? 'GROQ_API_KEY مُعد' : 'GROQ_API_KEY غير مُعد'
    },
    nvidia: {
      configured: isNvidiaConfigured(),
      model: config.nvidia.model,
      primary: false,
      message: isNvidiaConfigured() ? 'NVIDIA_API_KEY مُعد' : 'NVIDIA_API_KEY غير مُعد'
    },
    deepseek: {
      configured: isDeepSeekConfigured(),
      model: config.deepseek.model,
      primary: false,
      message: isDeepSeekConfigured() ? 'DEEPSEEK_API_KEY مُعد' : 'DEEPSEEK_API_KEY غير مُعد'
    }
  };
}

module.exports = {
  chat,
  chatStream,
  openAiCompatChat,
  validateChatRequest,
  callGemini,
  callGeminiStream,
  buildGeminiContents,
  parseGeminiText,
  splitReplyAndSuggestions,
  resolveApiKey,
  resolveModel,
  normalizeStatusCode,
  getProviderStatus,
  CHAT_SYSTEM_PROMPT,
  STREAM_SYSTEM_PROMPT,
  DEFAULT_SUGGESTIONS,
  writeSse
};
