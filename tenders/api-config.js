// ═══════════════════════════════════════════════════════
// █  API CONFIGURATION - NVIDIA & DEEPSEEK              █
// ═══════════════════════════════════════════════════════

const API_CONFIG = {
  // NVIDIA NIM API Configuration
  nvidia: {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    endpoints: {
      chat: "/chat/completions",
      embeddings: "/embeddings"
    },
    model: "nvidia/llama-3.1-nemotron-70b-instruct",
    // API Key يُقرأ من Environment Variable في Render
    // في الـ Frontend، نستخدم Proxy Backend
    proxyUrl: "https://YOUR-RENDER-APP.onrender.com/api/nvidia"
  },

  // DeepSeek AI Configuration
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    endpoints: {
      chat: "/chat/completions",
      analyze: "/analyze"
    },
    model: "deepseek-chat", // أو deepseek-coder للتحليل التقني
    proxyUrl: "https://YOUR-RENDER-APP.onrender.com/api/deepseek"
  },

  // إعدادات عامة
  settings: {
    timeout: 60000, // 60 ثانية
    maxRetries: 3,
    retryDelay: 1000,
    maxTokens: 4096,
    temperature: 0.3 // دقة عالية للتحليل القانوني
  }
};

// حالة الاتصال
const connectionState = {
  nvidia: { status: "disconnected", lastCheck: null },
  deepseek: { status: "disconnected", lastCheck: null },
  activeProvider: "nvidia" // المزود الافتراضي
};

// دالة الاتصال العامة مع إعادة المحاولة
async function callAI(provider, messages, options = {}) {
  const config = API_CONFIG[provider];
  if (!config) throw new Error(`Provider "${provider}" not configured`);

  const url = `${config.proxyUrl}/chat`;
  const payload = {
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
  const providers = ["nvidia", "deepseek"];

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
  return (
    API_CONFIG.nvidia.proxyUrl.indexOf("YOUR-RENDER-APP") === -1 &&
    API_CONFIG.deepseek.proxyUrl.indexOf("YOUR-RENDER-APP") === -1
  );
}

// فحص صحة الاتصال
async function checkAPIHealth() {
  if (!hasConfiguredProxy()) {
    connectionState.nvidia = { status: "disconnected", lastCheck: Date.now() };
    connectionState.deepseek = { status: "disconnected", lastCheck: Date.now() };
    return { status: "pending", error: "Proxy URL not configured yet" };
  }

  try {
    const response = await fetch(
      `${API_CONFIG.nvidia.proxyUrl.replace("/nvidia", "")}/health`
    );
    const data = await response.json();

    connectionState.nvidia = {
      status: data.nvidia ? "connected" : "error",
      lastCheck: Date.now()
    };
    connectionState.deepseek = {
      status: data.deepseek ? "connected" : "error",
      lastCheck: Date.now()
    };

    if (data.nvidia) {
      connectionState.activeProvider = "nvidia";
    } else if (data.deepseek) {
      connectionState.activeProvider = "deepseek";
    }

    return data;
  } catch (error) {
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
    text.textContent = `متصل — ${provider === "nvidia" ? "NVIDIA" : "DeepSeek"}`;
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
