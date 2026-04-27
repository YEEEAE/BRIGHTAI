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

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function humanizePath(value) {
    var clean = String(value || "")
      .replace(/^https?:\/\/[^/]+/i, "")
      .split("#")[0]
      .split("?")[0]
      .replace(/^\/+|\/+$/g, "");
    if (!clean) return "";
    var last = clean.split("/").filter(Boolean).pop() || clean;
    return last.replace(/[-_]+/g, " ").trim();
  }

  function inferInteractiveLabel(element) {
    var href = element.tagName === "A" ? element.getAttribute("href") || "" : "";
    var descriptor = [
      element.id,
      element.className,
      href,
      element.getAttribute("data-label"),
      element.getAttribute("data-title"),
      element.querySelector && element.querySelector("img[alt]") ? element.querySelector("img[alt]").getAttribute("alt") : "",
      element.querySelector && element.querySelector("iconify-icon") ? element.querySelector("iconify-icon").getAttribute("icon") : ""
    ].join(" ").toLowerCase();

    if (/whatsapp|api\.whatsapp|wa\.me/.test(descriptor)) return "التواصل عبر واتساب";
    if (/mailto:|mail/.test(descriptor)) return "إرسال بريد إلكتروني";
    if (/x\.com|twitter/.test(descriptor)) return "زيارة حساب Bright AI على منصة إكس";
    if (/linkedin/.test(descriptor)) return "زيارة صفحة Bright AI على لينكدإن";
    if (/youtube/.test(descriptor)) return "زيارة قناة Bright AI على يوتيوب";
    if (/search/.test(descriptor)) return "البحث في الموقع";
    if (/menu|hamburger|mobile-toggle/.test(descriptor)) return "فتح القائمة";
    if (/close|times|xmark/.test(descriptor)) return "إغلاق";
    if (/filter/.test(descriptor)) return "تصفية النتائج";
    if (/share/.test(descriptor)) return "مشاركة";
    if (href && href !== "#") return "فتح " + humanizePath(href);
    return "";
  }

  function enhanceInteractiveLabels() {
    document.querySelectorAll("a, button, [role='button']").forEach(function (element) {
      if (element.getAttribute("aria-label") || element.getAttribute("aria-labelledby")) return;
      var text = normalizeText(element.textContent || element.value || element.title);
      if (text) return;
      var label = inferInteractiveLabel(element);
      if (label) element.setAttribute("aria-label", label);
    });

    document.querySelectorAll("button svg, button iconify-icon, button i, a svg, a iconify-icon, a i").forEach(function (icon) {
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
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
    enhanceInteractiveLabels();
    wrapTables();
    bindLoadingStates();
    bindGlobalErrorState();
    window.requestAnimationFrame(enhanceInteractiveLabels);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
