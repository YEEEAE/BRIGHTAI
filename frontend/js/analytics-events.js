(function () {
  "use strict";

  var EVENT_PREFIX = "brightai:";
  var startedFormsKey = "brightai_started_forms";
  var scrollMarks = { 50: false, 90: false };
  var scrollTicking = false;

  function isReady() {
    return typeof window.gtag === "function";
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function pageParams(extra) {
    return Object.assign({
      page_path: window.location.pathname,
      page_title: document.title,
      language: document.documentElement.lang || "ar-SA",
      country_target: "SA"
    }, extra || {});
  }

  function safeParams(params) {
    var blocked = /(^|_)(email|phone|mobile|name|full_name|company|message|notes|input|search_term|query|id_number|national_id|identity|text|content|body)($|_)/i;
    var source = params || {};
    var clean = {};
    Object.keys(source).forEach(function (key) {
      if (blocked.test(key)) return;
      if (key === "link_url" && typeof source[key] === "string") {
        clean[key] = source[key].split("?")[0].split("#")[0];
        return;
      }
      clean[key] = source[key];
    });
    return clean;
  }

  function track(eventName, params) {
    if (!eventName || !/^[a-z][a-z0-9_]*$/.test(eventName)) return;
    var payload = pageParams(safeParams(params));
    if (isReady()) {
      window.gtag("event", eventName, payload);
    }
    window.dispatchEvent(new CustomEvent(EVENT_PREFIX + eventName, { detail: payload }));
  }

  function getStartedForms() {
    try {
      return JSON.parse(sessionStorage.getItem(startedFormsKey) || "[]");
    } catch (error) {
      return [];
    }
  }

  function markFormStarted(formId) {
    var started = getStartedForms();
    if (started.indexOf(formId) !== -1) return false;
    started.push(formId);
    try {
      sessionStorage.setItem(startedFormsKey, JSON.stringify(started));
    } catch (error) {
      return true;
    }
    return true;
  }

  function inferServiceName(anchor) {
    var value = anchor.getAttribute("data-service-name");
    if (value) return value;
    var href = anchor.getAttribute("href") || "";
    if (href.indexOf("/ai-agent/") === 0) return "ai_agent";
    if (href.indexOf("/smart-automation/") === 0) return "smart_automation";
    if (href.indexOf("/data-analysis/") === 0) return "data_analysis";
    if (href.indexOf("/ai-bots/") === 0) return "ai_bots";
    if (href.indexOf("/ai-workflows/") === 0) return "ai_workflows";
    if (href.indexOf("/demo/smart-medical-archive/") === 0) return "smart_medical_archive";
    if (href.indexOf("/demo/ai-tenders-analysis/") === 0) return "contractai_tenders";
    if (href.indexOf("/services/") === 0) return "services";
    return undefined;
  }

  function inferClickEvent(anchor) {
    var explicit = anchor.getAttribute("data-analytics-event");
    if (explicit) return explicit;
    var href = anchor.getAttribute("href") || "";
    var text = cleanText(anchor.textContent || anchor.getAttribute("aria-label"));
    var lowerText = text.toLowerCase();
    if (/^tel:/i.test(href)) return "phone_click";
    if (/^mailto:/i.test(href)) return "email_click";
    if (/whatsapp|wa\.me|api\.whatsapp/i.test(href)) return "whatsapp_click";
    if (href.indexOf("#pricing") === 0 || /pricing|price|التسعير|الأسعار/.test(lowerText)) return "pricing_click";
    if (href.indexOf("/demo/ai-tenders-analysis/compare.html") === 0) return "tender_compare_open";
    if (href.indexOf("/demo/ai-tenders-analysis/landing.html") === 0 || /demo|ديمو|عرض توضيحي|ابدأ مجاناً|جرب|جرّب/.test(lowerText)) return "request_demo";
    if (href.indexOf("/consultation/") === 0 || /استشارة|جلسة/.test(lowerText)) return "consultation_request";
    if (href.indexOf("/contact/") === 0 || /تواصل|اتصل|مبيعات/.test(lowerText)) return "generate_lead";
    if (/^https?:\/\//i.test(href) && !href.includes("brightai.site")) return "outbound_click";
    if (/\.(pdf|docx?|xlsx?|csv|zip)(\?|#|$)/i.test(href)) return "file_download";
    return null;
  }

  function handleClick(event) {
    var target = event.target.closest("a,button,[role='button']");
    if (!target) return;

    var eventName = target.getAttribute("data-analytics-event");
    if (!eventName && target.matches("a")) eventName = inferClickEvent(target);
    if (!eventName && target.matches("button,[role='button']")) {
      var id = target.id || "";
      var text = cleanText(target.textContent || target.getAttribute("aria-label"));
      if (/search|بحث/.test(id + " " + text)) eventName = "search_open";
      if (/start|analyze|submit|send|تشغيل|تحليل|إرسال|ابدأ|جرّب/.test(id + " " + text)) eventName = "tool_start";
    }
    if (!eventName) return;

    track(eventName, {
      cta_text: cleanText(target.textContent || target.getAttribute("aria-label")),
      cta_location: target.getAttribute("data-cta-location") || nearestSection(target),
      service_name: inferServiceName(target),
      tool_name: target.getAttribute("data-tool-name") || undefined,
      tender_feature: target.getAttribute("data-tender-feature") || undefined,
      link_url: target.getAttribute("href") || undefined
    });
  }

  function nearestSection(element) {
    var section = element.closest("[data-analytics-section], section[id], header, footer, nav, main");
    if (!section) return "body";
    return section.getAttribute("data-analytics-section") || section.id || section.tagName.toLowerCase();
  }

  function handleFormStart(event) {
    var form = event.target.closest("form");
    if (!form) return;
    var formId = form.id || form.getAttribute("name") || form.getAttribute("data-form-type") || "form_" + Array.prototype.indexOf.call(document.forms, form);
    if (!markFormStarted(formId)) return;
    var eventName = form.getAttribute("data-analytics-start-event") || (formId.indexOf("contact") !== -1 ? "contact_form_start" : "contact_form_start");
    track(eventName, {
      form_id: formId,
      cta_location: nearestSection(form)
    });
  }

  function handleFormSubmit(event) {
    var form = event.target;
    if (!form || form.tagName !== "FORM") return;
    var formId = form.id || form.getAttribute("name") || form.getAttribute("data-form-type") || "form";
    if (event.defaultPrevented || form.getAttribute("data-analytics-wait-for-success") === "true") {
      track("contact_form_error", {
        form_id: formId,
        cta_location: nearestSection(form)
      });
      return;
    }
    var eventName = form.getAttribute("data-analytics-submit-event") || (formId.indexOf("consultation") !== -1 ? "consultation_request" : "contact_form_submit");
    track(eventName, {
      form_id: formId,
      cta_location: nearestSection(form)
    });
    if (eventName !== "contact_form_submit") {
      track("contact_form_submit", {
        form_id: formId,
        cta_location: nearestSection(form)
      });
    }
  }

  function handleSearchSubmit(event) {
    var form = event.target;
    if (!form || form.tagName !== "FORM") return;
    if (!/search|بحث/i.test(form.id + " " + form.getAttribute("role") + " " + form.getAttribute("aria-label"))) return;
    track("site_search", {
      form_id: form.id || "site_search",
      has_query: Boolean(form.querySelector("input[type='search'], input[name='q'], input[name='search']")?.value)
    });
  }

  function handleScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      scrollTicking = false;
      measureScrollDepth();
    });
  }

  function measureScrollDepth() {
    var doc = document.documentElement;
    var scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    var depth = Math.round((window.scrollY / scrollable) * 100);
    [50, 90].forEach(function (mark) {
      if (!scrollMarks[mark] && depth >= mark) {
        scrollMarks[mark] = true;
        track("scroll_depth_" + mark, { scroll_depth: mark });
      }
    });
  }

  function track404() {
    var is404 = document.body && (document.body.dataset.pageType === "404" || /404|غير موجودة|not found/i.test(document.title));
    if (!is404) return;
    track("page_not_found", {
      requested_path: window.location.pathname + window.location.search
    });
  }

  window.BrightAIAnalytics = {
    track: track,
    trackFormSuccess: function (formId, eventName) {
      track(eventName || "contact_form_submit", { form_id: formId || "form" });
    },
    trackFormError: function (formId) {
      track("contact_form_error", { form_id: formId || "form" });
    }
  };

  document.addEventListener("click", handleClick, true);
  document.addEventListener("focusin", handleFormStart, true);
  document.addEventListener("submit", handleSearchSubmit, true);
  document.addEventListener("submit", handleFormSubmit, true);
  window.addEventListener("scroll", handleScroll, { passive: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", track404);
  } else {
    track404();
  }
})();
