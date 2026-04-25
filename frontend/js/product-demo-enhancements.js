(function () {
  "use strict";

  const GEMINI_MODEL = "gemini-2.5-flash";
  const AI_ENDPOINTS = ["/api/ai/chat", "/api/ai/openai-chat", "/api/ai/chat/completions"];

  function isProductDemoPage() {
    return /\/(tenders|try|ai-bots|ai-scolecs)(\/|$)/.test(window.location.pathname);
  }

  function buildApiUrl(path) {
    const gateway = window.BrightAIGateway;
    if (gateway && typeof gateway.buildUrl === "function") return gateway.buildUrl(path);
    const runtime = window.BrightAIRuntimeConfig;
    if (runtime && typeof runtime.buildApiUrl === "function") return runtime.buildApiUrl(path);
    return path;
  }

  function ensureApiBadge() {
    if (document.querySelector(".demo-api-badge")) return document.querySelector(".demo-api-badge");
    const badge = document.createElement("div");
    badge.className = "demo-api-badge";
    badge.dataset.state = "checking";
    badge.textContent = `Gemini API: ${GEMINI_MODEL} — جارٍ التحقق`;
    document.body.appendChild(badge);
    return badge;
  }

  async function refreshApiBadge() {
    const badge = ensureApiBadge();
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(function () {
        controller.abort();
      }, 4500);
      const response = await fetch(buildApiUrl("/api/health"), { signal: controller.signal });
      window.clearTimeout(timeout);
      const data = await response.json().catch(function () {
        return {};
      });
      const providers = data.providers || {};
      const gemini = data.gemini || (providers.gemini && providers.gemini.configured);
      badge.dataset.state = response.ok && gemini ? "connected" : "error";
      badge.textContent = response.ok && gemini
        ? `Gemini API: ${GEMINI_MODEL} — متصل`
        : `Gemini API: ${GEMINI_MODEL} — يحتاج إعداد الخادم`;
    } catch (error) {
      badge.dataset.state = "error";
      badge.textContent = `Gemini API: ${GEMINI_MODEL} — تعذر التحقق`;
    }
  }

  function improveForms() {
    document.querySelectorAll("textarea").forEach(function (textarea) {
      textarea.setAttribute("dir", "auto");
      textarea.addEventListener("input", function () {
        textarea.style.blockSize = "auto";
        textarea.style.blockSize = Math.min(textarea.scrollHeight, 420) + "px";
      });
    });

    document.querySelectorAll("input, select, textarea").forEach(function (field) {
      if (!field.getAttribute("aria-label") && field.placeholder) {
        field.setAttribute("aria-label", field.placeholder);
      }
    });
  }

  function improveAiButtons() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("button, .btn, .primary-btn, .cta-button");
      if (!button) return;
      const text = (button.textContent || "").trim();
      if (!/(حلل|تحليل|اسأل|توليد|إرسال|ابدأ|جرّب|جرب)/.test(text)) return;
      button.classList.add("demo-loading");
      window.setTimeout(function () {
        button.classList.remove("demo-loading");
      }, 2400);
    }, true);
  }

  function hardenAiFetchDefaults() {
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === "string" ? input : input && input.url;
        const isAiEndpoint = AI_ENDPOINTS.some(function (endpoint) {
          return String(url || "").includes(endpoint);
        });
        if (isAiEndpoint && init && init.body) {
          const payload = JSON.parse(init.body);
          if (payload && typeof payload === "object") {
            if (!payload.provider) payload.provider = "gemini";
            payload.model = GEMINI_MODEL;
            init.body = JSON.stringify(payload);
          }
        }
      } catch (error) {
        // اترك الطلب كما هو إذا لم يكن JSON صالحاً.
      }
      return originalFetch.apply(this, arguments);
    };
  }

  function init() {
    if (!isProductDemoPage()) return;
    document.documentElement.classList.add("brightai-product-demo");
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar-SA");
    hardenAiFetchDefaults();
    improveForms();
    improveAiButtons();
    refreshApiBadge();
    window.setInterval(refreshApiBadge, 45000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
