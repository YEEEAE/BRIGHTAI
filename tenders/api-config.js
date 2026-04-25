// ═══════════════════════════════════════════════════════
// █  API CONFIGURATION - GEMINI PRIMARY AI              █
// ═══════════════════════════════════════════════════════

function getBrightAIRuntimeConfig() {
  if (!window.BrightAIRuntimeConfig || typeof window.BrightAIRuntimeConfig.buildApiUrl !== "function") {
    throw new Error(
      "ملف runtime-config.js غير محمل. يجب تحميل /frontend/js/runtime-config.js قبل tenders/api-config.js."
    );
  }

  return window.BrightAIRuntimeConfig;
}

const API_CONFIG = {
  // Gemini API Configuration عبر بروكسي BrightAI الخلفي
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    endpoints: {
      chat: "/generateContent",
      stream: "/streamGenerateContent"
    },
    model: "gemini-2.5-flash",
    provider: "gemini",
    proxyPath: "/api/ai/chat/completions"
  },

  // NVIDIA NIM API Configuration
  nvidia: {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    endpoints: {
      chat: "/chat/completions",
      embeddings: "/embeddings"
    },
    model: "nvidia/llama-3.1-nemotron-70b-instruct",
    provider: "nvidia",
    proxyPath: "/api/ai/chat/completions"
  },

  // DeepSeek AI Configuration
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    endpoints: {
      chat: "/chat/completions",
      analyze: "/analyze"
    },
    model: "deepseek-chat", // القيمة الفعلية يمكن أن تأتي من DEEPSEEKAI_MODEL على الخادم
    provider: "deepseek",
    proxyPath: "/api/ai/chat/completions"
  },

  // إعدادات عامة
  settings: {
    timeout: 60000, // 60 ثانية
    maxRetries: 3,
    retryDelay: 1000,
    maxTokens: 4096,
    temperature: 0.3, // دقة عالية للتحليل القانوني
    healthPath: "/api/health",
    getApiBase() {
      return getBrightAIRuntimeConfig().getApiBase();
    },
    buildApiUrl(path) {
      return getBrightAIRuntimeConfig().buildApiUrl(path);
    },
    getProxyUrl(path = "/api/ai/chat/completions") {
      return getBrightAIRuntimeConfig().buildApiUrl(path);
    }
  }
};

// حالة الاتصال
const connectionState = {
  gemini: { status: "disconnected", lastCheck: null },
  nvidia: { status: "disconnected", lastCheck: null },
  deepseek: { status: "disconnected", lastCheck: null },
  activeProvider: "gemini" // المزود الافتراضي
};

// دالة الاتصال العامة مع إعادة المحاولة
async function callAI(provider, messages, options = {}) {
  const config = API_CONFIG[provider];
  if (!config) throw new Error(`Provider "${provider}" not configured`);

  const url = API_CONFIG.settings.getProxyUrl(
    config.proxyPath || "/api/ai/chat/completions"
  );
  const payload = {
    provider: config.provider || provider,
    model: options.model || config.model,
    messages: messages,
    max_tokens: options.maxTokens || API_CONFIG.settings.maxTokens,
    temperature: options.temperature || API_CONFIG.settings.temperature
  };

  let lastError;
  for (let attempt = 1; attempt <= API_CONFIG.settings.maxRetries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(function () {
        controller.abort();
      }, API_CONFIG.settings.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      connectionState[provider] = { status: "connected", lastCheck: Date.now() };
      return data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed for ${provider}:`, error.message);
      if (attempt < API_CONFIG.settings.maxRetries) {
        await new Promise(function (resolve) {
          window.setTimeout(resolve, API_CONFIG.settings.retryDelay * attempt);
        });
      }
    }
  }

  connectionState[provider] = {
    status: "error",
    lastCheck: Date.now(),
    error: lastError.message
  };
  throw lastError;
}

// دالة التبديل التلقائي بين المزودين (Fallback)
async function callAIWithFallback(messages, options = {}) {
  const providers = ["gemini", "nvidia", "deepseek"];

  for (const provider of providers) {
    try {
      const result = await callAI(provider, messages, options);
      connectionState.activeProvider = provider;
      return { provider, result };
    } catch (error) {
      console.warn(`${provider} failed, trying next provider...`);
    }
  }

  throw new Error("All AI providers failed. Please try again later.");
}

function hasConfiguredProxy() {
  try {
    return Boolean(API_CONFIG.settings.getApiBase());
  } catch (error) {
    return false;
  }
}

// فحص صحة الاتصال
async function checkAPIHealth() {
  if (!hasConfiguredProxy()) {
    connectionState.gemini = { status: "disconnected", lastCheck: Date.now() };
    connectionState.nvidia = { status: "disconnected", lastCheck: Date.now() };
    connectionState.deepseek = { status: "disconnected", lastCheck: Date.now() };
    return { status: "pending", error: "Proxy URL not configured yet" };
  }

  try {
    const response = await fetch(
      API_CONFIG.settings.buildApiUrl(API_CONFIG.settings.healthPath)
    );
    const data = await response.json();
    const providers = data.providers || {};
    const geminiConfigured =
      typeof data.gemini === "boolean"
        ? data.gemini
        : !!(providers.gemini && providers.gemini.configured);
    const nvidiaConfigured =
      typeof data.nvidia === "boolean"
        ? data.nvidia
        : !!(
            (providers.nvidia && providers.nvidia.configured) ||
            (providers.nim && providers.nim.configured)
          );
    const deepseekConfigured =
      typeof data.deepseek === "boolean"
        ? data.deepseek
        : !!(providers.deepseek && providers.deepseek.configured);

    connectionState.gemini = {
      status: geminiConfigured ? "connected" : "error",
      lastCheck: Date.now(),
      error: geminiConfigured ? null : "gemini_unavailable"
    };
    connectionState.nvidia = {
      status: nvidiaConfigured ? "connected" : "error",
      lastCheck: Date.now(),
      error: nvidiaConfigured ? null : "nvidia_unavailable"
    };
    connectionState.deepseek = {
      status: deepseekConfigured ? "connected" : "error",
      lastCheck: Date.now(),
      error: deepseekConfigured ? null : "deepseek_unavailable"
    };

    if (geminiConfigured) {
      connectionState.activeProvider = "gemini";
    } else if (nvidiaConfigured) {
      connectionState.activeProvider = "nvidia";
    } else if (deepseekConfigured) {
      connectionState.activeProvider = "deepseek";
    }

    return data;
  } catch (error) {
    connectionState.gemini = {
      status: "error",
      lastCheck: Date.now(),
      error: error.message
    };
    connectionState.nvidia = {
      status: "error",
      lastCheck: Date.now(),
      error: error.message
    };
    connectionState.deepseek = {
      status: "error",
      lastCheck: Date.now(),
      error: error.message
    };
    return { status: "error", error: error.message };
  }
}

function updateAPIStatusUI() {
  const statusEl = document.getElementById("apiStatus");
  if (!statusEl) return;
  const text = statusEl.querySelector(".status-text");

  const provider = connectionState.activeProvider;
  const state = connectionState[provider];

  statusEl.dataset.status = state.status;

  if (state.status === "connected") {
    text.textContent = `متصل — ${provider === "gemini" ? "Gemini 2.5 Flash" : provider === "nvidia" ? "NVIDIA" : "DeepSeek"}`;
  } else if (
    state.error === "gemini_unavailable" ||
    state.error === "nvidia_unavailable" ||
    state.error === "deepseek_unavailable"
  ) {
    text.textContent = "الخادم لا يوفّر Gemini حالياً";
  } else if (state.status === "error") {
    text.textContent = "خطأ في الاتصال";
  } else if (!hasConfiguredProxy()) {
    text.textContent = "بإنتظار الربط";
  } else {
    text.textContent = "جارٍ الاتصال...";
  }
}

function bootAPIStatus() {
  const statusEl = document.getElementById("apiStatus");
  if (!statusEl || statusEl.dataset.bound === "true") return;
  statusEl.dataset.bound = "true";
  updateAPIStatusUI();
  statusEl.addEventListener("click", async function () {
    await checkAPIHealth();
    updateAPIStatusUI();
  });
}

window.ContractAIAPI = {
  API_CONFIG,
  connectionState,
  callAI,
  callAIWithFallback,
  checkAPIHealth,
  updateAPIStatusUI
};

window.setInterval(async function () {
  await checkAPIHealth();
  updateAPIStatusUI();
}, 30000);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", async function () {
    bootAPIStatus();
    await checkAPIHealth();
    updateAPIStatusUI();
  });
} else {
  bootAPIStatus();
  checkAPIHealth().then(updateAPIStatusUI);
}
