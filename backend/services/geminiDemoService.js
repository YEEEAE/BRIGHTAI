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
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt({ demoType, input }) }] }],
        generationConfig: prompt.generationConfig
      })
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
  const result = await callGeminiJson({ demoType, input, model });
  yield { type: 'start', demoType, model };
  yield { type: 'result', data: appendSafetyNotice(demoType, prompt.normalizeGeminiResponse(result, input)) };
  yield { type: 'done' };
}

module.exports = {
  buildPrompt,
  runGeminiDemo,
  streamGeminiDemo
};
