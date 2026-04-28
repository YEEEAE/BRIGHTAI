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

  function nextFrame(callback) {
    if (typeof window.requestAnimationFrame === "function") return window.requestAnimationFrame(callback);
    return window.setTimeout(callback, 0);
  }

  function ensureFormStyles() {
    if (document.getElementById("brightai-form-ux-style")) return;
    var style = document.createElement("style");
    style.id = "brightai-form-ux-style";
    style.textContent = [
      ".brightai-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}",
      ".brightai-field-error{display:block;margin-block-start:.4rem;color:#fecaca;font-size:.86rem;line-height:1.6}",
      ".brightai-form-status{margin-block-start:.8rem;padding:.75rem .9rem;border-radius:.8rem;border:1px solid rgba(148,163,184,.24);background:rgba(15,23,42,.72);color:#dbeafe;line-height:1.7}",
      ".brightai-form-status[data-state='success']{border-color:rgba(34,197,94,.45);background:rgba(22,101,52,.18);color:#dcfce7}",
      ".brightai-form-status[data-state='error']{border-color:rgba(248,113,113,.45);background:rgba(127,29,29,.18);color:#fee2e2}",
      ".brightai-is-loading{cursor:progress!important;opacity:.78}",
      "form[aria-busy='true'] input,form[aria-busy='true'] select,form[aria-busy='true'] textarea{opacity:.82}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function escapeSelector(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value || "").replace(/["\\]/g, "\\$&");
  }

  function fieldLabelText(field) {
    var labelledBy = field.getAttribute("aria-labelledby");
    if (labelledBy) {
      var labelNode = document.getElementById(labelledBy);
      if (labelNode) return normalizeText(labelNode.textContent);
    }
    if (field.labels && field.labels.length) return normalizeText(field.labels[0].textContent);
    return normalizeText(field.getAttribute("aria-label") || field.getAttribute("placeholder") || field.getAttribute("name") || "هذا الحقل");
  }

  function ensureFieldLabel(field, index) {
    if (!field || field.type === "hidden") return;
    if (field.labels && field.labels.length) return;
    var labelledBy = field.getAttribute("aria-labelledby");
    if (labelledBy && document.getElementById(labelledBy)) return;
    if (!field.id) field.id = "brightai-field-" + (Date.now() + index);
    if (document.querySelector('label[for="' + escapeSelector(field.id) + '"]')) return;
    var label = document.createElement("label");
    label.className = "brightai-sr-only";
    label.setAttribute("for", field.id);
    label.textContent = fieldLabelText(field);
    field.insertAdjacentElement("beforebegin", label);
  }

  function ensureFieldError(field, form, index) {
    if (!field || field.type === "hidden") return null;
    if (!field.id) field.id = "brightai-field-" + (Date.now() + index);
    var errorId = field.id + "-error";
    var error = document.getElementById(errorId);
    if (!error) {
      error = document.createElement("span");
      error.id = errorId;
      error.className = "brightai-field-error";
      error.setAttribute("role", "alert");
      error.hidden = true;
      field.insertAdjacentElement("afterend", error);
    }
    var describedBy = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (describedBy.indexOf(errorId) === -1) {
      describedBy.push(errorId);
      field.setAttribute("aria-describedby", describedBy.join(" "));
    }
    field.addEventListener("input", function () {
      if (field.checkValidity()) setFieldError(field, "");
    });
    field.addEventListener("invalid", function () {
      setFieldError(field, validationMessage(field));
    });
    return error;
  }

  function validationMessage(field) {
    var label = fieldLabelText(field);
    if (field.validity.valueMissing) return "يرجى تعبئة " + label + ".";
    if (field.validity.typeMismatch && field.type === "email") return "يرجى إدخال بريد إلكتروني صحيح.";
    if (field.validity.typeMismatch && field.type === "url") return "يرجى إدخال رابط صحيح.";
    if (field.validity.patternMismatch) return "صيغة " + label + " غير صحيحة. راجع المثال داخل الحقل.";
    if (field.validity.tooShort) return "قيمة " + label + " قصيرة جداً.";
    if (field.validity.tooLong) return "قيمة " + label + " أطول من الحد المسموح.";
    return "راجع " + label + " قبل الإرسال.";
  }

  function setFieldError(field, message) {
    var errorId = field.getAttribute("aria-describedby") || "";
    var error = errorId.split(/\s+/).map(function (id) { return document.getElementById(id); }).find(function (node) {
      return node && node.classList.contains("brightai-field-error");
    });
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
    field.toggleAttribute("aria-invalid", Boolean(message));
  }

  function ensureFormStatus(form) {
    var statusId = form.id ? form.id + "-status" : "brightai-form-status-" + Array.prototype.indexOf.call(document.forms, form);
    var status = document.getElementById(statusId);
    if (!status) {
      status = document.createElement("p");
      status.id = statusId;
      status.className = "brightai-form-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.hidden = true;
      form.appendChild(status);
    }
    if (!form.getAttribute("aria-describedby")) form.setAttribute("aria-describedby", statusId);
    return status;
  }

  function setFormStatus(form, state, message) {
    var status = ensureFormStatus(form);
    status.dataset.state = state || "info";
    status.textContent = message || "";
    status.hidden = !message;
  }

  function setSubmitBusy(form, busy, message) {
    var submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!submit) return;
    if (busy) {
      if (!submit.dataset.brightaiOriginalText) submit.dataset.brightaiOriginalText = submit.tagName === "INPUT" ? submit.value : submit.innerHTML;
      if (submit.tagName === "INPUT") submit.value = message || "جارٍ الإرسال...";
      else submit.innerHTML = message || "جارٍ الإرسال...";
    } else if (submit.dataset.brightaiOriginalText) {
      if (submit.tagName === "INPUT") submit.value = submit.dataset.brightaiOriginalText;
      else submit.innerHTML = submit.dataset.brightaiOriginalText;
      delete submit.dataset.brightaiOriginalText;
    }
    submit.disabled = busy || Boolean(submit.dataset.brightaiKeepDisabled === "true");
    submit.toggleAttribute("aria-busy", busy);
    submit.classList.toggle("brightai-is-loading", busy);
  }

  function validateForm(form) {
    var fields = Array.from(form.querySelectorAll("input, select, textarea")).filter(function (field) {
      return field.type !== "hidden" && !field.disabled;
    });
    var firstInvalid = null;
    fields.forEach(function (field) {
      var message = field.checkValidity() ? "" : validationMessage(field);
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus({ preventScroll: false });
    return !firstInvalid;
  }

  function shouldHandleStaticSubmit(form) {
    if (form.dataset.demoForm !== undefined) return false;
    if (form.id === "appointmentForm") return false;
    if (form.classList.contains("download-form")) return true;
    if (form.id === "visitorForm") return true;
    if (form.getAttribute("data-form-type")) return true;
    return false;
  }

  function enhanceForms() {
    ensureFormStyles();
    document.querySelectorAll("form").forEach(function (form, formIndex) {
      if (form.dataset.brightaiFormUx === "true") return;
      form.dataset.brightaiFormUx = "true";
      ensureFormStatus(form);
      Array.from(form.querySelectorAll("input, select, textarea")).forEach(function (field, index) {
        ensureFieldLabel(field, formIndex * 100 + index);
        ensureFieldError(field, form, formIndex * 100 + index);
      });
    });

    if (window.__brightaiFormSubmitUxReady) return;
    window.__brightaiFormSubmitUxReady = true;
    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form || !form.matches || !form.matches("form")) return;
      if (!validateForm(form)) {
        event.preventDefault();
        setFormStatus(form, "error", "لم يتم الإرسال. يرجى مراجعة الحقول المحددة بالأحمر.");
        return;
      }
      if (form.dataset.demoForm !== undefined || form.id === "appointmentForm" || form.id === "bright-chat-form" || form.classList.contains("bright-newsletter-form")) {
        return;
      }
      if (form.dataset.brightaiSubmitting === "true") {
        event.preventDefault();
        setFormStatus(form, "info", "طلبك قيد المعالجة بالفعل. انتظر لحظة.");
        return;
      }
      form.dataset.brightaiSubmitting = "true";
      form.setAttribute("aria-busy", "true");
      setSubmitBusy(form, true, "جارٍ الإرسال...");

      window.setTimeout(function () {
        if (form.dataset.brightaiSubmitting === "true" && !form.dataset.brightaiHandledByStaticUx) {
          delete form.dataset.brightaiSubmitting;
          form.removeAttribute("aria-busy");
          setSubmitBusy(form, false);
        }
      }, 12000);

      if (!shouldHandleStaticSubmit(form)) return;

      event.preventDefault();
      form.dataset.brightaiHandledByStaticUx = "true";
      setFormStatus(form, "info", "جارٍ معالجة الطلب...");
      window.setTimeout(function () {
        delete form.dataset.brightaiSubmitting;
        delete form.dataset.brightaiHandledByStaticUx;
        form.removeAttribute("aria-busy");
        setSubmitBusy(form, false);
        setFormStatus(form, "success", "تم استلام الطلب بنجاح. سنراجع البيانات ونتواصل معك عبر القناة المناسبة.");
        if (window.BrightAIAnalytics && typeof window.BrightAIAnalytics.trackFormSuccess === "function") {
          window.BrightAIAnalytics.trackFormSuccess(form.id || form.getAttribute("data-form-type") || "form");
        }
        if (form.classList.contains("download-form")) {
          setFormStatus(form, "success", "تم تسجيل طلب التقرير. راجع بريدك خلال دقائق أو تواصل معنا إذا لم يصلك.");
        }
      }, 900);
    }, true);
  }

  function observeDynamicForms() {
    if (!("MutationObserver" in window) || window.__brightaiFormObserverReady) return;
    window.__brightaiFormObserverReady = true;
    var queued = false;
    var observer = new MutationObserver(function (mutations) {
      var hasFormChange = mutations.some(function (mutation) {
        return Array.from(mutation.addedNodes || []).some(function (node) {
          return node.nodeType === 1 && (node.matches && node.matches("form, input, select, textarea") || node.querySelector && node.querySelector("form, input, select, textarea"));
        });
      });
      if (!hasFormChange || queued) return;
      queued = true;
      nextFrame(function () {
        queued = false;
        enhanceForms();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
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
    enhanceForms();
    wrapTables();
    bindLoadingStates();
    bindGlobalErrorState();
    observeDynamicForms();
    nextFrame(enhanceInteractiveLabels);
    nextFrame(enhanceForms);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
