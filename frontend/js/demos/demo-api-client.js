(function () {
  "use strict";

  const CONFIG_NAME = "BRIGHTAI_DEMO_CONFIG";
  const DEFAULT_ERROR = "تعذر تشغيل التجربة الآن. حاول مرة أخرى بعد لحظات.";
  const DIRECT_GOOGLE_HOST = ["generativelanguage", "googleapis", "com"].join(".");

  function getConfig() {
    return window[CONFIG_NAME] || {};
  }

  function joinUrl(baseUrl, endpoint) {
    const base = String(baseUrl || "").replace(/\/+$/u, "");
    const path = String(endpoint || "").replace(/^\/+/u, "");
    return `${base}/${path}`;
  }

  function assertAllowedApiUrl(url) {
    const parsed = new URL(url, window.location.origin);
    if (parsed.hostname === DIRECT_GOOGLE_HOST || parsed.hostname.endsWith(`.${DIRECT_GOOGLE_HOST}`)) {
      throw normalizeDemoApiError({ code: "FORBIDDEN_UPSTREAM", message: "Direct Gemini calls are not allowed." });
    }
    return parsed.toString();
  }

  /**
   * Returns the single configured API origin for all frontend demos.
   * @returns {string}
   */
  function getDemoApiBaseUrl() {
    return String(getConfig().apiBaseUrl || "").replace(/\/+$/u, "");
  }

  /**
   * Resolves an API endpoint URL from the central demo config.
   * @param {"standard"|"streaming"} [type="standard"]
   * @returns {string}
   */
  function getDemoEndpoint(type = "standard") {
    const endpoints = getConfig().endpoints || {};
    const endpoint = endpoints[type] || endpoints.standard || "/api/demo/gemini";
    return assertAllowedApiUrl(joinUrl(getDemoApiBaseUrl(), endpoint));
  }

  /**
   * Creates a request correlation id without storing user input.
   * @returns {string}
   */
  function createRequestId() {
    const bytes = new Uint8Array(12);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
    }
    const randomPart = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    return `bai_${Date.now().toString(36)}_${randomPart || Math.random().toString(36).slice(2, 14)}`;
  }

  /**
   * Trims and limits demo input before network transport.
   * @param {unknown} input
   * @returns {string}
   */
  function sanitizeDemoInput(input) {
    return safeText(input).replace(/\s+/gu, " ").trim().slice(0, 6000);
  }

  function buildPayload(demoType, input) {
    const config = getConfig();
    return {
      demoType: safeText(demoType).slice(0, 120),
      input: sanitizeDemoInput(input),
      locale: config.locale || "ar-SA",
      client: {
        name: config.clientName || "brightai-demo-web",
        version: config.version || "2.0.0",
        requestId: createRequestId()
      }
    };
  }

  /**
   * Runs the standard demo request through the BrightAI API.
   * @param {{ demoType: string, input: unknown, signal?: AbortSignal }} params
   * @returns {Promise<object>}
   */
  async function runDemoApiRequest({ demoType, input, signal }) {
    const controller = new AbortController();
    const externalAbort = () => controller.abort(signal.reason || new Error("ABORTED"));
    if (signal) {
      if (signal.aborted) externalAbort();
      else signal.addEventListener("abort", externalAbort, { once: true });
    }

    const request = fetch(getDemoEndpoint("standard"), {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-BrightAI-Client": getConfig().clientName || "brightai-demo-web"
      },
      body: JSON.stringify(buildPayload(demoType, input)),
      credentials: "omit",
      signal: controller.signal
    }).then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw normalizeDemoApiError({ status: response.status, payload: data });
      }
      return data;
    });

    return withTimeout(request, getConfig().timeoutMs || 30000, controller).catch(error => {
      if (getConfig().fallbackToMock) return runDemoMockRequest({ demoType, input });
      throw normalizeDemoApiError(error);
    }).finally(() => {
      if (signal) signal.removeEventListener("abort", externalAbort);
    });
  }

  function decodeStreamValue(value, decoder) {
    return decoder.decode(value, { stream: true });
  }

  function parseStreamLines(buffer, emit) {
    const lines = buffer.split(/\r?\n/u);
    const rest = lines.pop() || "";
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") return;
      const data = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
      try {
        emit(JSON.parse(data));
      } catch (_error) {
        emit({ text: data });
      }
    });
    return rest;
  }

  /**
   * Runs the streaming demo request and emits sanitized chunks.
   * @param {{ demoType: string, input: unknown, onChunk?: Function, onComplete?: Function, onError?: Function }} params
   * @returns {Promise<void>}
   */
  async function runDemoApiStream({ demoType, input, onChunk, onComplete, onError }) {
    const controller = new AbortController();
    try {
      const request = fetch(getDemoEndpoint("streaming"), {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
          "X-BrightAI-Client": getConfig().clientName || "brightai-demo-web"
        },
        body: JSON.stringify(buildPayload(demoType, input)),
        credentials: "omit",
        signal: controller.signal
      });
      const response = await withTimeout(request, getConfig().streamTimeoutMs || 60000, controller);
      if (!response.ok || !response.body) throw normalizeDemoApiError({ status: response.status });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = Boolean(chunk.done);
        if (chunk.value) {
          buffer += decodeStreamValue(chunk.value, decoder);
          buffer = parseStreamLines(buffer, part => {
            const text = sanitizeForDisplay(part.text || part.delta || part.content || part.message || "");
            if (text && typeof onChunk === "function") onChunk(text, part);
          });
        }
      }
      if (buffer.trim()) {
        parseStreamLines(`${buffer}\n`, part => {
          const text = sanitizeForDisplay(part.text || part.delta || part.content || part.message || "");
          if (text && typeof onChunk === "function") onChunk(text, part);
        });
      }
      if (typeof onComplete === "function") onComplete();
    } catch (error) {
      const normalized = normalizeDemoApiError(error);
      if (typeof onError === "function") onError(normalized);
      else throw normalized;
    }
  }

  /**
   * Aborts a promise after the provided duration.
   * @template T
   * @param {Promise<T>} promise
   * @param {number} ms
   * @param {AbortController} abortController
   * @returns {Promise<T>}
   */
  function withTimeout(promise, ms, abortController) {
    let timer = 0;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => {
        if (abortController) abortController.abort(new Error("TIMEOUT"));
        reject(normalizeDemoApiError({ code: "TIMEOUT" }));
      }, Number(ms) || 30000);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
  }

  /**
   * Normalizes thrown values into a stable demo error object.
   * @param {unknown} error
   * @returns {{ code: string, message: string, status?: number, payload?: unknown }}
   */
  function normalizeDemoApiError(error) {
    const status = Number(error && error.status);
    const payload = error && error.payload;
    const payloadCode = payload && (payload.code || payload.errorCode || payload.error);
    const code = safeText((error && error.code) || payloadCode || (status ? `HTTP_${status}` : "UNKNOWN_ERROR"));
    return {
      code,
      message: getFriendlyErrorMessage(code),
      status: Number.isFinite(status) ? status : undefined,
      payload
    };
  }

  /**
   * Maps error codes to Arabic user-facing messages.
   * @param {string} code
   * @returns {string}
   */
  function getFriendlyErrorMessage(code) {
    const normalized = safeText(code).toUpperCase();
    if (normalized.includes("TIMEOUT")) return "استغرق التحليل وقتاً أطول من المتوقع. جرّب نصاً أقصر أو أعد المحاولة.";
    if (normalized.includes("HTTP_429") || normalized.includes("RATE")) return "وصلت التجربة إلى حد الطلبات المؤقت. حاول مرة أخرى بعد قليل.";
    if (normalized.includes("HTTP_4")) return "تعذر قبول الطلب. راجع المدخلات ثم أعد المحاولة.";
    if (normalized.includes("FORBIDDEN_UPSTREAM")) return "تم منع مسار اتصال غير مسموح لحماية التجربة.";
    if (normalized.includes("ABORT")) return "تم إيقاف الطلب قبل اكتماله.";
    return DEFAULT_ERROR;
  }

  /**
   * Converts any value into plain text.
   * @param {unknown} value
   * @returns {string}
   */
  function safeText(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "");
  }

  /**
   * Escapes report text for safe plain-text export.
   * @param {unknown} value
   * @returns {string}
   */
  function escapeForReport(value) {
    return safeText(value).replace(/[<>]/gu, "").trim();
  }

  /**
   * Sanitizes AI output before rendering with textContent.
   * @param {unknown} value
   * @returns {string}
   */
  function sanitizeForDisplay(value) {
    return safeText(value).replace(/\u2028|\u2029/gu, "\n").trim();
  }

  /**
   * Emits analytics without storing customer input.
   * @param {string} eventName
   * @param {Record<string, unknown>} [payload]
   * @returns {void}
   */
  function trackDemoEvent(eventName, payload) {
    const cleanPayload = Object.assign({}, payload || {});
    delete cleanPayload.input;
    delete cleanPayload.prompt;
    delete cleanPayload.message;
    window.dispatchEvent(new CustomEvent("brightai-demo-event", {
      detail: {
        eventName: safeText(eventName).slice(0, 120),
        payload: cleanPayload,
        ts: Date.now()
      }
    }));
    if (typeof window.gtag === "function") {
      window.gtag("event", safeText(eventName).slice(0, 40), cleanPayload);
    }
  }

  /**
   * Converts confidence score into a UX bucket.
   * @param {number} score
   * @returns {"low"|"medium"|"high"}
   */
  function bucketConfidence(score) {
    const value = Number(score);
    if (!Number.isFinite(value) || value < 0.5) return "low";
    if (value < 0.8) return "medium";
    return "high";
  }

  /**
   * Produces a safe mock response for offline demo fallback.
   * @param {{ demoType: string, input: unknown }} params
   * @returns {Promise<object>}
   */
  function runDemoMockRequest({ demoType, input }) {
    const cleanInput = sanitizeDemoInput(input);
    return Promise.resolve({
      ok: true,
      mode: "mock",
      demoType: safeText(demoType),
      requestId: createRequestId(),
      confidence: 0.74,
      confidenceBucket: "medium",
      result: {
        title: "نتيجة توضيحية آمنة",
        summary: cleanInput
          ? `تم تحليل المدخلات محلياً كنموذج توضيحي دون تخزينها. طول النص ${cleanInput.length} حرفاً.`
          : "أدخل وصفاً مختصراً لتشغيل تجربة أوضح.",
        recommendations: [
          "حدّد الهدف التجاري قبل ربط الأنظمة.",
          "ابدأ بنطاق صغير قابل للقياس.",
          "راجع جودة البيانات قبل الاعتماد على المخرجات."
        ]
      }
    });
  }

  window.BrightAIDemoApiClient = Object.freeze({
    getDemoApiBaseUrl,
    getDemoEndpoint,
    createRequestId,
    sanitizeDemoInput,
    runDemoApiRequest,
    runDemoApiStream,
    withTimeout,
    normalizeDemoApiError,
    getFriendlyErrorMessage,
    safeText,
    escapeForReport,
    sanitizeForDisplay,
    trackDemoEvent,
    bucketConfidence,
    runDemoMockRequest
  });
})();
