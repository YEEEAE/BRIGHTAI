(function () {
  "use strict";

  if (window.__BRIGHTAI_PRODUCTION_RUNTIME__) return;
  window.__BRIGHTAI_PRODUCTION_RUNTIME__ = true;

  var API_TIMEOUT_MS = 45000;
  var originalFetch = window.fetch ? window.fetch.bind(window) : null;

  function isApiUrl(input) {
    var value = "";
    if (typeof input === "string") value = input;
    else if (input && typeof input.url === "string") value = input.url;
    return /(^|\/)api\//.test(value) || /\/api\//.test(value);
  }

  function buildApiUrl(input) {
    if (typeof input !== "string" || /^https?:\/\//i.test(input)) return input;
    if (!input.startsWith("/api/")) return input;
    var runtime = window.BrightAIRuntimeConfig;
    if (runtime && typeof runtime.buildApiUrl === "function") {
      try {
        return runtime.buildApiUrl(input);
      } catch (_error) {
        return input;
      }
    }
    return input;
  }

  function publishError(message, detail) {
    window.dispatchEvent(new CustomEvent("brightai:api-error", {
      detail: {
        message: message,
        detail: detail || null,
        timestamp: Date.now()
      }
    }));
  }

  function setBusyFromEvent(event, busy) {
    var trigger = event && event.target && event.target.closest
      ? event.target.closest("button, [role='button'], input[type='submit']")
      : null;
    if (!trigger || trigger.dataset.brightaiBusyManaged === "false") return;
    trigger.toggleAttribute("aria-busy", busy);
    trigger.classList.toggle("brightai-is-loading", busy);
  }

  if (originalFetch) {
    window.fetch = function brightAIFetch(input, init) {
      var requestInput = typeof input === "string" ? buildApiUrl(input) : input;
      var requestInit = init || {};
      var isApi = isApiUrl(requestInput);
      var controller = isApi && !requestInit.signal ? new AbortController() : null;
      var timeoutId = null;

      if (controller) {
        requestInit = Object.assign({}, requestInit, { signal: controller.signal });
        timeoutId = window.setTimeout(function () {
          controller.abort();
        }, API_TIMEOUT_MS);
      }

      return originalFetch(requestInput, requestInit)
        .then(function (response) {
          if (isApi && !response.ok) {
            publishError("تعذر تنفيذ الطلب. حاول مرة أخرى.", {
              status: response.status,
              url: response.url || String(requestInput || "")
            });
          }
          return response;
        })
        .catch(function (error) {
          if (isApi) {
            publishError(
              error && error.name === "AbortError"
                ? "انتهت مهلة الطلب. حاول مرة أخرى."
                : "تعذر الاتصال بالخدمة حالياً.",
              { url: String(requestInput || ""), name: error && error.name }
            );
          }
          throw error;
        })
        .finally(function () {
          if (timeoutId) window.clearTimeout(timeoutId);
        });
    };
  }

  function enhanceMedia() {
    document.querySelectorAll("img").forEach(function (img, index) {
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (index > 1 && !img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      if (index <= 1 && !img.hasAttribute("fetchpriority")) img.setAttribute("fetchpriority", "high");
      if (!img.getAttribute("alt") && !img.hasAttribute("role")) img.setAttribute("alt", "");
    });

    document.querySelectorAll("iframe").forEach(function (frame) {
      if (!frame.hasAttribute("loading")) frame.setAttribute("loading", "lazy");
    });
  }

  function wrapTables() {
    document.querySelectorAll("table").forEach(function (table) {
      if (table.closest(".responsive-table, .table-wrap")) return;
      var wrapper = document.createElement("div");
      wrapper.className = "responsive-table";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function bindLoadingStates() {
    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form || !form.matches || !form.matches("form")) return;
      form.setAttribute("aria-busy", "true");
      window.setTimeout(function () {
        form.removeAttribute("aria-busy");
      }, 12000);
    }, true);

    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest("button, [role='button'], input[type='submit']")
        : null;
      if (!button) return;
      var label = (button.textContent || button.value || "").trim();
      if (!/(حلل|تحليل|إرسال|ابدأ|جرّب|جرب|اسأل|توليد|احفظ|ارفع|submit|send|analy)/i.test(label)) return;
      setBusyFromEvent(event, true);
      window.setTimeout(function () {
        button.removeAttribute("aria-busy");
        button.classList.remove("brightai-is-loading");
      }, 4500);
    }, true);
  }

  function bindGlobalErrorState() {
    window.addEventListener("brightai:api-error", function (event) {
      var live = document.getElementById("brightai-api-live-region");
      if (!live) {
        live = document.createElement("div");
        live.id = "brightai-api-live-region";
        live.className = "sr-only";
        live.setAttribute("role", "status");
        live.setAttribute("aria-live", "polite");
        document.body.appendChild(live);
      }
      live.textContent = event.detail && event.detail.message
        ? event.detail.message
        : "تعذر الاتصال بالخدمة حالياً.";
    });

    window.addEventListener("error", function (event) {
      if (!event || !event.message) return;
      if (/ResizeObserver loop|Script error/i.test(event.message)) return;
      document.documentElement.dataset.runtimeError = "true";
    });

    window.addEventListener("unhandledrejection", function () {
      document.documentElement.dataset.runtimeError = "true";
    });
  }

  function init() {
    document.documentElement.classList.add("brightai-production-ready");
    enhanceMedia();
    wrapTables();
    bindLoadingStates();
    bindGlobalErrorState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
