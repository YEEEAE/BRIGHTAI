const { createHttpError } = require('../utils/httpErrors');
const { getDemoPrompt, getModelForDemo } = require('./demoPromptRegistry');
const { runMockDemo, streamMockDemo } = require('./demoMockProvider');
const { appendSafetyNotice } = require('./demoSafetyFilter');
const { extractJsonObject } = require('../utils/safeJson');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Configurable timeout per demo type ---
const DEFAULT_TIMEOUT_MS = Number(process.env.DEMO_GEMINI_TIMEOUT_MS) || 30000;
const DEMO_TIMEOUT_MAP = {
  'data-analyzer': 45000,
  'smart-medical-archive': 40000,
  'tenders-analysis': 35000,
  'smart-hospital-management': 35000,
  'customer-service-automation': 25000,
  'smart-hiring-system': 25000
};
const MAX_RETRIES = Number(process.env.DEMO_GEMINI_MAX_RETRIES) || 2;
const RETRY_DELAY_MS = Number(process.env.DEMO_GEMINI_RETRY_DELAY_MS) || 1000;

function getTimeoutForDemo(demoType) {
  return DEMO_TIMEOUT_MAP[demoType] || DEFAULT_TIMEOUT_MS;
}

function shouldUseMock() {
  return process.env.DEMO_MOCK_PROVIDER === '1' || process.env.AI_GATEWAY_MOCK_MODE === '1';
}

// --- Enhanced JSON extraction from Gemini response ---

function extractTextFromGeminiPayload(payload) {
  if (!payload) return '';
  // Try standard candidates path
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map(part => part.text || '').join('');
  }
  // Try promptFeedback/block reason
  if (payload?.promptFeedback?.blockReason) {
    return '';
  }
  // Try error structure
  if (payload?.error?.message) {
    return '';
  }
  return '';
}

function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  // Direct JSON parse
  const direct = extractJsonObject(text);
  if (direct) return direct;
  // Try stripping markdown fences
  const stripped = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^{[]*/, '')
    .replace(/[^}\]]*$/, '');
  return extractJsonObject(stripped);
}

// --- Build functions ---

function buildPrompt({ demoType, input }) {
  const prompt = getDemoPrompt(demoType);
  return prompt.buildPrompt(input, {
    scenario: input?.scenarioId,
    message: input?.message,
    metadata: input?.metadata
  });
}

function buildGeminiRequestBody({ prompt, userText }) {
  const systemText = prompt.systemInstruction || prompt.system || '';
  const body = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: prompt.generationConfig || {}
  };
  if (systemText) {
    body.systemInstruction = {
      parts: [{ text: systemText }]
    };
  }
  if (prompt.tools) body.tools = prompt.tools;
  return body;
}

function buildGeminiFileRequestBody({ prompt, userText, file }) {
  const body = buildGeminiRequestBody({ prompt, userText });
  body.contents[0].parts.push({
    inlineData: {
      mimeType: file.mimeType,
      data: file.base64
    }
  });
  return body;
}

// --- Gemini API call with retry ---

async function fetchWithRetry(url, options, retries = MAX_RETRIES, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  options.signal = controller.signal;

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Retry on 429 (rate limit) or 5xx (server error)
      if ((response.status === 429 || response.status >= 500) && retries > 0) {
        clearTimeout(timeout);
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * (MAX_RETRIES - retries + 1);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));
        return fetchWithRetry(url, options, retries - 1, timeoutMs);
      }
    }
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// --- Core Gemini calls ---

async function callGeminiJson({ demoType, input, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createHttpError('AI_PROVIDER_ERROR');

  const prompt = getDemoPrompt(demoType);
  const timeoutMs = getTimeoutForDemo(demoType);
  const userText = buildPrompt({ demoType, input });

  try {
    const response = await fetchWithRetry(
      `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiRequestBody({ prompt, userText }))
      },
      MAX_RETRIES,
      timeoutMs
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const errMsg = errorBody.slice(0, 200);
      throw createHttpError('AI_PROVIDER_ERROR', {
        meta: { status: response.status, body: errMsg }
      });
    }

    const payload = await response.json();
    const text = extractTextFromGeminiPayload(payload);

    if (!text) {
      // Check for safety block
      const blockReason = payload?.promptFeedback?.blockReason;
      if (blockReason) {
        throw createHttpError('UNSAFE_CONTENT_DETECTED');
      }
      // Fallback to empty response
      return prompt.fallbackResponse(input, {
        scenario: input?.scenarioId,
        message: input?.message,
        metadata: input?.metadata
      });
    }

    return prompt.normalizeGeminiResponse(text, input, {
      scenario: input?.scenarioId,
      message: input?.message,
      metadata: input?.metadata
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw createHttpError('TIMEOUT');
    if (error?.code) throw error;
    throw createHttpError('AI_PROVIDER_ERROR');
  }
}

async function callGeminiFileJson({ demoType, input, file, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createHttpError('AI_PROVIDER_ERROR');

  const prompt = getDemoPrompt(demoType);
  const timeoutMs = getTimeoutForDemo(demoType);

  const filePrompt = demoType === 'smart-medical-archive'
    ? [
        buildPrompt({ demoType, input }),
        `اسم الملف: ${file.filename}`,
        `نوع الملف: ${file.mimeType}`,
        'استخرج النص السريري من الملف المرفق إن كان صورة أو PDF، ثم نظمه حسب مخطط الأرشيف الطبي فقط.',
        'لا تعرض أي رقم ملف أو هوية أو اسم مريض حقيقي. اخف كل معرفات المرضى.',
        'لا تقدم تشخيصاً ولا توصية علاجية.'
      ].join('\n')
    : [
        buildPrompt({ demoType, input }),
        `اسم الملف: ${file.filename}`,
        `نوع الملف: ${file.mimeType}`,
        'استخرج السيرة الذاتية من الملف المرفق، ثم قيّمها حسب الوصف الوظيفي في مدخل المستخدم.',
        'لا تعرض أي بريد أو هاتف أو رقم هوية في المخرجات.'
      ].join('\n');

  try {
    const response = await fetchWithRetry(
      `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiFileRequestBody({
          prompt,
          userText: filePrompt,
          file
        }))
      },
      MAX_RETRIES,
      timeoutMs
    );

    if (!response.ok) {
      throw createHttpError('AI_PROVIDER_ERROR', {
        meta: { status: response.status }
      });
    }

    const payload = await response.json();
    const text = extractTextFromGeminiPayload(payload);

    if (!text) {
      const blockReason = payload?.promptFeedback?.blockReason;
      if (blockReason) {
        throw createHttpError('UNSAFE_CONTENT_DETECTED');
      }
      return prompt.fallbackResponse(input, {
        scenario: input?.scenarioId,
        message: input?.message,
        metadata: input?.metadata
      });
    }

    return prompt.normalizeGeminiResponse(text, input, {
      scenario: input?.scenarioId,
      message: input?.message,
      metadata: input?.metadata
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw createHttpError('TIMEOUT');
    if (error?.code) throw error;
    throw createHttpError('AI_PROVIDER_ERROR');
  }
}

// --- SSE Streaming with improved parsing ---

async function* streamGeminiJson({ demoType, input, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createHttpError('AI_PROVIDER_ERROR');

  const prompt = getDemoPrompt(demoType);
  const timeoutMs = getTimeoutForDemo(demoType);
  const userText = buildPrompt({ demoType, input });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(buildGeminiRequestBody({ prompt, userText }))
      }
    );

    if (!response.ok || !response.body) {
      throw createHttpError('AI_PROVIDER_ERROR', {
        meta: { status: response?.status }
      });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n');
        const dataLine = lines.find(line => line.startsWith('data: '));
        if (!dataLine) continue;

        try {
          const payload = JSON.parse(dataLine.slice(6));
          const text = extractTextFromGeminiPayload(payload);
          if (text) {
            accumulated += text;
            yield { type: 'delta', text };
          }
        } catch (_parseError) {
          // Skip malformed SSE events
          continue;
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const remainingLine = buffer.split('\n').find(l => l.startsWith('data: '));
      if (remainingLine) {
        try {
          const payload = JSON.parse(remainingLine.slice(6));
          const text = extractTextFromGeminiPayload(payload);
          if (text) {
            accumulated += text;
            yield { type: 'delta', text };
          }
        } catch (_e) {
          // Skip
        }
      }
    }

    yield {
      type: 'result',
      data: appendSafetyNotice(demoType, prompt.normalizeGeminiResponse(accumulated, input))
    };
  } catch (error) {
    if (error?.name === 'AbortError') throw createHttpError('TIMEOUT');
    if (error?.code) throw error;
    throw createHttpError('AI_PROVIDER_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}

// --- Public API ---

async function runGeminiDemo({ demoType, input }) {
  const model = getModelForDemo(demoType);
  const prompt = getDemoPrompt(demoType);

  const result = shouldUseMock()
    ? await runMockDemo({ demoType, input, model })
    : await callGeminiJson({ demoType, input, model });

  return {
    ok: true,
    demoType,
    model,
    result: appendSafetyNotice(demoType, prompt.normalizeGeminiResponse(result, input))
  };
}

async function runGeminiFileDemo({ demoType, input, file }) {
  const model = getModelForDemo(demoType);
  const prompt = getDemoPrompt(demoType);

  const result = shouldUseMock()
    ? prompt.fallbackResponse(input)
    : await callGeminiFileJson({ demoType, input, file, model });

  return {
    ok: true,
    demoType,
    model,
    file: {
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size
    },
    result: appendSafetyNotice(demoType, prompt.normalizeGeminiResponse(result, input))
  };
}

async function* streamGeminiDemo({ demoType, input }) {
  const model = getModelForDemo(demoType);

  if (shouldUseMock()) {
    for await (const event of streamMockDemo({ demoType, input, model })) {
      yield event;
    }
    return;
  }

  const prompt = getDemoPrompt(demoType);
  yield { type: 'start', demoType, model };

  // Stream for demos that benefit from progressive output
  const streamableDemos = new Set([
    'smart-hiring-system',
    'customer-service-automation',
    'data-analyzer',
    'smart-medical-archive'
  ]);

  if (streamableDemos.has(demoType)) {
    for await (const event of streamGeminiJson({ demoType, input, model })) {
      yield event;
    }
    yield { type: 'done' };
    return;
  }

  // Non-streaming path with single result
  const result = await callGeminiJson({ demoType, input, model });
  yield { type: 'result', data: appendSafetyNotice(demoType, prompt.normalizeGeminiResponse(result, input)) };
  yield { type: 'done' };
}

module.exports = {
  buildPrompt,
  runGeminiDemo,
  runGeminiFileDemo,
  streamGeminiDemo,
  // Export helpers for testing
  extractTextFromGeminiPayload,
  extractJsonFromText,
  getTimeoutForDemo
};
