!(function attachBrightAIGateway(globalScope, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory(globalScope);
    return;
  }

  globalScope.BrightAIGateway = factory(globalScope);
})(typeof globalThis !== "undefined" ? globalThis : this, function buildBrightAIGateway(globalScope) {
  "use strict";

  var ENDPOINTS = Object.freeze({
    GEMINI_CHAT: "/api/gemini/chat",
    GEMINI_CHAT_STREAM: "/api/gemini/chat/stream",
    AI_STREAM: "/api/ai/stream",
    AI_CHAT: "/api/ai/chat",
    AI_SEARCH: "/api/ai/search",
    AI_MEDICAL: "/api/ai/medical",
    AI_SUMMARY: "/api/ai/summary",
    AI_OCR: "/api/ai/ocr",
    AI_EXTRACT_TEXT: "/api/ai/extract-text",
    AI_TRANSCRIBE: "/api/ai/transcribe",
    AI_MEDICAL_AGENT: "/api/ai/medical-agent",
    AI_FAQ: "/api/ai/faq",
    AI_MEDICAL_ARCHIVE: "/api/ai/medical-archive",
    AI_MODELS: "/api/ai/models",
    AI_OPENAI_CHAT: "/api/ai/openai-chat",
    HEALTH: "/api/health",
    HEALTH_AI: "/api/health/ai",
    ANALYTICS_CONVERSION: "/api/analytics/ga4/conversion"
  });

  var healthState = {
    checked: false,
    healthy: false,
    message: "",
    timestamp: 0
  };

  function getRuntimeConfig() {
    var runtimeConfig = globalScope && globalScope.BrightAIRuntimeConfig;
    if (!runtimeConfig || typeof runtimeConfig.buildApiUrl !== "function") {
      throw new Error(
        "ملف runtime-config.js غير محمل. يجب تحميل /frontend/js/runtime-config.js قبل api-gateway.js."
      );
    }
    return runtimeConfig;
  }

  function getApiBase() {
    return getRuntimeConfig().getApiBase();
  }

  function buildUrl(path) {
    return getRuntimeConfig().buildApiUrl(path);
  }

  function showHealthBanner(message) {
    if (
      typeof document === "undefined" ||
      document.getElementById("brightai-health-banner")
    ) {
      return;
    }

    var banner = document.createElement("div");
    banner.id = "brightai-health-banner";
    banner.setAttribute("role", "alert");
    banner.setAttribute("dir", "rtl");
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(135deg,#991b1b,#7f1d1d);color:#fecaca;padding:14px 20px;font-size:14px;line-height:1.7;font-family:system-ui,-apple-system,sans-serif;text-align:right;box-shadow:0 4px 20px rgba(0,0,0,.4);border-bottom:2px solid #dc2626;";

    var closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    closeButton.style.cssText =
      "position:absolute;top:8px;left:12px;background:none;border:none;color:#fecaca;font-size:18px;cursor:pointer;padding:4px;";
    closeButton.addEventListener("click", function removeBanner() {
      banner.remove();
    });

    banner.textContent = "⚠️ " + message;
    banner.appendChild(closeButton);
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function mapPreflightError(status, details) {
    if (status === 503) {
      if (details && (details.includes("key") || details.includes("API") || details.includes("configured"))) {
        return "الخادم يعمل لكن مفتاح API غير مُعد (GEMINI_API_KEY). أضف المفتاح في متغيرات البيئة على الخادم.";
      }
      return "الخادم يعمل لكن الخدمة غير متاحة حالياً (503). تحقق من إعدادات المزود.";
    }

    if (status === 404) {
      return "مسار /api/health غير موجود (404). تحقق من مسار الخادم أو إعدادات إعادة التوجيه.";
    }

    if (status === 500) {
      return "خطأ داخلي في الخادم (500). راجع سجلات الـ backend أو الـ runtime.";
    }

    return "فشل الاتصال بالخادم (HTTP " + status + "). " + (details || "");
  }

  return {
    getApiBase: getApiBase,
    resetApiBase: function resetApiBase() {
      return getRuntimeConfig().resolveApiBase();
    },
    buildUrl: buildUrl,
    ENDPOINTS: ENDPOINTS,
    preflight: async function preflight(options) {
      var settings = options || {};
      var timeoutMs = settings.timeoutMs || 6000;
      var silent = settings.silent || false;
      var controller = new AbortController();
      var timeoutId = setTimeout(function abortRequest() {
        controller.abort();
      }, timeoutMs);

      try {
        var response = await fetch(buildUrl(ENDPOINTS.HEALTH), {
          method: "GET",
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          var details = "";
          try {
            var payload = await response.json();
            details = payload.error || payload.message || "";
          } catch (error) {
            details = "HTTP " + response.status;
          }

          var failureMessage = mapPreflightError(response.status, details);
          healthState = {
            checked: true,
            healthy: false,
            message: failureMessage,
            timestamp: Date.now()
          };

          if (!silent) {
            console.error("[BrightAI Gateway] فشل فحص الاتصال:", failureMessage);
            showHealthBanner(failureMessage);
          }

          return { healthy: false, message: failureMessage };
        }

        healthState = {
          checked: true,
          healthy: true,
          message: "الاتصال بالخادم يعمل بنجاح",
          timestamp: Date.now()
        };

        if (!silent) {
          console.info("[BrightAI Gateway] الاتصال بالخادم يعمل بنجاح");
        }

        return { healthy: true, message: "ok" };
      } catch (error) {
        clearTimeout(timeoutId);

        var message =
          error && error.name === "AbortError"
            ? "انتهت مهلة الاتصال بالخادم (" + timeoutMs / 1000 + " ثوانٍ). تأكد أن الخادم يعمل وأن الـ API endpoint متاح."
            : "تعذر الاتصال بالخادم: " + ((error && error.message) || "خطأ غير معروف") + ". تأكد من إعدادات الشبكة والنشر.";

        healthState = {
          checked: true,
          healthy: false,
          message: message,
          timestamp: Date.now()
        };

        if (!silent) {
          console.error("[BrightAI Gateway] فشل فحص الاتصال:", message);
          showHealthBanner(message);
        }

        return { healthy: false, message: message };
      }
    },
    getHealthState: function getHealthState() {
      return Object.assign({}, healthState);
    },
    apiFetch: async function apiFetch(path, fetchOptions, timeoutMs) {
      var timeout = timeoutMs || 15000;
      var controller = new AbortController();
      var timeoutId = setTimeout(function abortRequest() {
        controller.abort();
      }, timeout);
      var options = Object.assign({}, fetchOptions || {});
      options.signal = controller.signal;

      try {
        var response = await fetch(buildUrl(path), options);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
  };
});
