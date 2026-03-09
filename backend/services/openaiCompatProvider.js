const {
  config,
  isApiKeyConfigured,
  isGroqConfigured,
  isNvidiaConfigured,
  isDeepSeekConfigured
} = require('../config');

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeProvider(value) {
  const candidate = String(value || '').trim().toLowerCase();
  if (!candidate) return '';
  if (candidate === 'google') return 'gemini';
  if (candidate === 'deepseekai') return 'deepseek';
  return candidate;
}

function pickProvider(body = {}) {
  const explicitProvider = normalizeProvider(body.provider || body.aiProvider);
  if (explicitProvider) return explicitProvider;

  const requestedModel = String(body.model || '').trim().toLowerCase();
  if (requestedModel.startsWith('nvidia/')) return 'nvidia';
  if (requestedModel.startsWith('deepseek')) return 'deepseek';
  if (requestedModel.startsWith('gemini')) return 'gemini';
  if (requestedModel.startsWith('llama-3.3') || requestedModel.includes('groq')) return 'groq';

  if (isApiKeyConfigured()) return 'gemini';
  if (isGroqConfigured()) return 'groq';
  if (isNvidiaConfigured()) return 'nvidia';
  if (isDeepSeekConfigured()) return 'deepseek';

  return 'nvidia';
}

function resolveProviderModel(provider, requestedModel) {
  const model = hasText(requestedModel) ? String(requestedModel).trim() : '';

  if (provider === 'nvidia') {
    return config.nvidia.model || model || 'nvidia/llama-3.1-nemotron-70b-instruct';
  }

  if (provider === 'deepseek') {
    return config.deepseek.model || model || 'deepseek-chat';
  }

  if (provider === 'gemini') {
    return hasText(model) ? model : config.gemini.model;
  }

  return hasText(model) ? model : config.groq.model;
}

function assertProviderReady(provider) {
  if (provider === 'nvidia' && !isNvidiaConfigured()) {
    const error = new Error('NVIDIA_API_KEY غير مُعد في بيئة الخادم');
    error.statusCode = 503;
    error.code = 'NVIDIA_NOT_CONFIGURED';
    throw error;
  }

  if (provider === 'deepseek' && !isDeepSeekConfigured()) {
    const error = new Error('DEEPSEEK_API_KEY غير مُعد في بيئة الخادم');
    error.statusCode = 503;
    error.code = 'DEEPSEEK_NOT_CONFIGURED';
    throw error;
  }
}

async function callOpenAiCompatibleProvider({ provider, messages, temperature, maxTokens, model }) {
  assertProviderReady(provider);

  const resolvedModel = resolveProviderModel(provider, model);
  const endpoint = provider === 'nvidia' ? config.nvidia.endpoint : config.deepseek.endpoint;
  const apiKey = provider === 'nvidia' ? config.nvidia.apiKey : config.deepseek.apiKey;

  const upstreamResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false
    })
  });

  const data = await upstreamResponse.json().catch(() => ({}));
  if (!upstreamResponse.ok) {
    const error = new Error(
      data?.error?.message ||
      data?.message ||
      `Upstream ${provider} error (${upstreamResponse.status})`
    );
    error.statusCode = upstreamResponse.status;
    error.code = `${provider.toUpperCase()}_UPSTREAM_ERROR`;
    error.details = data;
    throw error;
  }

  return { data, provider, model: resolvedModel };
}

function getProviderHealthSnapshot() {
  return {
    nvidia: {
      configured: isNvidiaConfigured(),
      model: config.nvidia.model,
      message: isNvidiaConfigured()
        ? 'NVIDIA_API_KEY مُعد وجاهز'
        : 'NVIDIA_API_KEY غير مُعد'
    },
    deepseek: {
      configured: isDeepSeekConfigured(),
      model: config.deepseek.model,
      message: isDeepSeekConfigured()
        ? 'DEEPSEEK_API_KEY مُعد وجاهز'
        : 'DEEPSEEK_API_KEY غير مُعد'
    },
    gemini: {
      configured: isApiKeyConfigured(),
      model: config.gemini.model,
      message: isApiKeyConfigured()
        ? 'GEMINI_API_KEY مُعد وجاهز'
        : 'GEMINI_API_KEY غير مُعد'
    },
    groq: {
      configured: isGroqConfigured(),
      model: config.groq.model,
      message: isGroqConfigured()
        ? 'GROQ_API_KEY مُعد وجاهز'
        : 'GROQ_API_KEY غير مُعد'
    }
  };
}

module.exports = {
  pickProvider,
  callOpenAiCompatibleProvider,
  getProviderHealthSnapshot
};
