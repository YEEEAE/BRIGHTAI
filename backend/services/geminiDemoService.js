const { createHttpError } = require('../utils/httpErrors');
const { getDemoPrompt, getModelForDemo } = require('./demoPromptRegistry');
const { runMockDemo, streamMockDemo } = require('./demoMockProvider');
const { appendSafetyNotice } = require('./demoSafetyFilter');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = Number(process.env.DEMO_GEMINI_TIMEOUT_MS) || 25000;

function shouldUseMock() {
  return process.env.DEMO_MOCK_PROVIDER === '1' || process.env.AI_GATEWAY_MOCK_MODE === '1';
}

function buildPrompt({ demoType, input }) {
  const prompt = getDemoPrompt(demoType);
  return prompt.buildPrompt(input, {
    scenario: input?.scenarioId,
    message: input?.message,
    metadata: input?.metadata
  });
}

function buildGeminiRequestBody({ prompt, userText }) {
  const body = {
    systemInstruction: {
      parts: [{ text: prompt.systemInstruction || prompt.system || '' }]
    },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: prompt.generationConfig
  };
  if (!body.systemInstruction.parts[0].text) delete body.systemInstruction;
  return body;
}

async function callGeminiJson({ demoType, input, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createHttpError('AI_PROVIDER_ERROR');
  const prompt = getDemoPrompt(demoType);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(buildGeminiRequestBody({
        prompt,
        userText: buildPrompt({ demoType, input })
      }))
    });

    if (!response.ok) throw createHttpError('AI_PROVIDER_ERROR');
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
    return prompt.normalizeGeminiResponse(text, input, {
      scenario: input?.scenarioId,
      message: input?.message,
      metadata: input?.metadata
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw createHttpError('TIMEOUT');
    if (error?.code) throw error;
    throw createHttpError('AI_PROVIDER_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}

async function* streamGeminiJson({ demoType, input, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createHttpError('AI_PROVIDER_ERROR');
  const prompt = getDemoPrompt(demoType);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(buildGeminiRequestBody({
        prompt,
        userText: buildPrompt({ demoType, input })
      }))
    });

    if (!response.ok || !response.body) throw createHttpError('AI_PROVIDER_ERROR');

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) {
        const line = event.split('\n').find(item => item.startsWith('data: '));
        if (!line) continue;
        const payload = JSON.parse(line.slice(6));
        const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
        if (text) {
          accumulated += text;
          yield { type: 'delta', text };
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
  if (demoType === 'smart-hiring-system') {
    for await (const event of streamGeminiJson({ demoType, input, model })) {
      yield event;
    }
    yield { type: 'done' };
    return;
  }
  const result = await callGeminiJson({ demoType, input, model });
  yield { type: 'result', data: appendSafetyNotice(demoType, prompt.normalizeGeminiResponse(result, input)) };
  yield { type: 'done' };
}

module.exports = {
  buildPrompt,
  runGeminiDemo,
  streamGeminiDemo
};
