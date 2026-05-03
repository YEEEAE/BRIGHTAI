(function () {
  "use strict";

  var CHAT_SESSION_KEY = "brightai.chat.sessionId";
  var CHAT_RATE_KEY = "brightai.chat.rate";
  var COOKIE_KEY = "brightai.cookieConsent";
  var COOKIE_TTL_DAYS = 365;
  var WA = "966538229013";
  var API_ENDPOINT = "/api/ai/chat";
  var PAGES = {
    "الاستشارات": "https://brightai.site/consultation/",
    "وكلاء الذكاء الاصطناعي": "https://brightai.site/ai-agent/",
    "تحليل البيانات": "https://brightai.site/data-analysis/",
    "الأتمتة الذكية": "https://brightai.site/smart-automation/"
  };

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function on(target, eventName, handler, options, controller) {
    if (!target) return;
    var opts = options || {};
    if (controller) opts.signal = controller.signal;
    target.addEventListener(eventName, handler, opts);
  }

  function debounce(fn, wait) {
    var timer = 0;
    return function () {
      var args = arguments;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  function throttle(fn, wait) {
    var last = 0;
    var timer = 0;
    return function () {
      var now = Date.now();
      var args = arguments;
      if (now - last >= wait) {
        last = now;
        fn.apply(null, args);
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        last = Date.now();
        fn.apply(null, args);
      }, wait);
    };
  }

  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
      return;
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function safeUrl(url) {
    try {
      var parsed = new URL(url, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    } catch (error) {
      return "#";
    }
    return "#";
  }

  function renderMarkdown(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
        return '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
      })
      .replace(/\n/g, "<br>");
  }

  function getStoredJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setStoredJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return false;
    }
    return true;
  }

  function initDecorativeIcons() {
    document.querySelectorAll("iconify-icon").forEach(function (icon) {
      var parent = icon.closest("button,a,[aria-label],[role='img']");
      if (!icon.hasAttribute("aria-hidden") && (!parent || parent.hasAttribute("aria-label"))) {
        icon.setAttribute("aria-hidden", "true");
      }
      if (!icon.hasAttribute("width")) icon.setAttribute("width", "20");
      if (!icon.hasAttribute("height")) icon.setAttribute("height", icon.getAttribute("width") || "20");
    });
  }

  function initNavA11y() {
    document.querySelectorAll(".nav-item").forEach(function (item, index) {
      var button = item.querySelector('.nav-link[aria-haspopup="true"]');
      var menu = item.querySelector(".dropdown-menu");
      if (!button || !menu) return;
      if (!menu.id) menu.id = "desktop-dropdown-" + (index + 1);
      button.setAttribute("aria-controls", menu.id);
      menu.setAttribute("role", "menu");
    });
  }

  function initMobileDrawerClose() {
    var drawer = document.getElementById("mobileDrawer") || document.querySelector(".mobile-menu-drawer");
    if (!drawer) return;
    var toggles = document.querySelectorAll(".mobile-toggle");
    var backdrop = document.querySelector(".backdrop-overlay");
    function closeDrawer() {
      drawer.classList.remove("active");
      drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-nav-open");
      document.body.style.overflow = "";
      if (backdrop) backdrop.classList.remove("active");
      toggles.forEach(function (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      });
    }
    drawer.querySelectorAll("a[href]").forEach(function (link) {
      on(link, "click", closeDrawer, { passive: true });
    });
  }

  function initCookieConsent() {
    var banner = document.getElementById("cookies");
    var ok = document.getElementById("cookieOk");
    if (!banner || !ok) return;
    var consent = getStoredJson(COOKIE_KEY, null);
    var now = Date.now();
    if (consent && consent.expiresAt > now) {
      banner.remove();
      return;
    }
    window.setTimeout(function () {
      banner.classList.remove("translate-y-[200%]");
      banner.classList.add("translate-y-0");
    }, 900);
    on(ok, "click", function () {
      setStoredJson(COOKIE_KEY, {
        accepted: true,
        expiresAt: now + COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000
      });
      banner.classList.add("translate-y-[200%]");
      window.setTimeout(function () {
        banner.remove();
      }, 450);
      track("cookie_consent", { status: "accepted" });
    });
  }

  function checkChatRateLimit() {
    var now = Date.now();
    var bucket = getStoredJson(CHAT_RATE_KEY, { start: now, count: 0 });
    if (!bucket.start || now - bucket.start > 60000) bucket = { start: now, count: 0 };
    if (bucket.count >= 10) return false;
    bucket.count += 1;
    setStoredJson(CHAT_RATE_KEY, bucket);
    return true;
  }

  function localSupportReply(text) {
    var query = String(text || "").toLowerCase();
    if (/سعر|اسعار|أسعار|تكلفة|باقة|pricing|price/.test(query)) {
      return "التسعير يعتمد على نطاق المشروع والتكاملات. ابدأ من [صفحة الاستشارات](" + PAGES["الاستشارات"] + ") أو واتساب: https://wa.me/" + WA;
    }
    if (/وكيل|agent|بوت|شات|خدمة عملاء/.test(query)) {
      return "نقدر نبني وكيل ذكاء اصطناعي للمبيعات أو خدمة العملاء أو الموارد البشرية. التفاصيل هنا: [وكلاء الذكاء الاصطناعي](" + PAGES["وكلاء الذكاء الاصطناعي"] + ").";
    }
    if (/تحليل|بيانات|dashboard|bi|تقرير/.test(query)) {
      return "خدمة تحليل البيانات تحول البيانات إلى مؤشرات ولوحات متابعة قابلة للقياس. التفاصيل هنا: [تحليل البيانات](" + PAGES["تحليل البيانات"] + ").";
    }
    if (/أتمت|rpa|عمليات|workflow|سير عمل/.test(query)) {
      return "الأتمتة الذكية مناسبة للمهام المتكررة مثل إدخال البيانات والتقارير والمتابعة بين الأنظمة. ابدأ من: [الأتمتة الذكية](" + PAGES["الأتمتة الذكية"] + ").";
    }
    return "أقدر أساعدك في وكلاء الذكاء الاصطناعي، الأتمتة، تحليل البيانات، والاستشارات. اكتب هدفك التشغيلي أو تواصل عبر واتساب: https://wa.me/" + WA;
  }

  function initChatbot() {
    var fab = document.getElementById("bai-chat-fab");
    var box = document.getElementById("bai-chat-box");
    var messages = document.getElementById("bai-chat-msgs");
    var input = document.getElementById("bai-chat-input");
    var sendButton = document.getElementById("bai-chat-send");
    var closeButton = document.getElementById("bai-chat-close");
    if (!fab || !box || !messages || !input || !sendButton || !closeButton) return;

    var controller = new AbortController();
    var chatOpen = false;
    var sending = false;

    function toggle(open) {
      chatOpen = open;
      box.classList.toggle("is-open", open);
      fab.classList.toggle("is-hidden", open);
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && !messages.children.length) {
        addMessage("bot", "هلا وغلا، أنا مساعد Bright AI. وش أقدر أساعدك فيه اليوم؟");
      }
      if (open) input.focus();
    }

    function addMessage(role, text) {
      var node = document.createElement("div");
      node.className = "bai-msg " + role;
      node.innerHTML = renderMarkdown(text);
      messages.appendChild(node);
      messages.scrollTop = messages.scrollHeight;
      return node;
    }

    async function callChatApi(text) {
      var sessionId = "";
      try {
        sessionId = window.sessionStorage.getItem(CHAT_SESSION_KEY) || "";
      } catch (error) {
        sessionId = "";
      }
      try {
        var requestController = new AbortController();
        var timeout = window.setTimeout(function () {
          requestController.abort();
        }, 12000);
        var response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId: sessionId || null }),
          signal: requestController.signal
        });
        window.clearTimeout(timeout);
        var data = await response.json().catch(function () {
          return {};
        });
        if (!response.ok) throw new Error(data.error || "HTTP " + response.status);
        if (data.sessionId) window.sessionStorage.setItem(CHAT_SESSION_KEY, data.sessionId);
        return String(data.reply || "").trim();
      } catch (error) {
        return localSupportReply(text);
      }
    }

    async function send() {
      var text = input.value.trim();
      if (!text || sending) return;
      if (!checkChatRateLimit()) {
        addMessage("bot", "وصلت للحد المؤقت للرسائل. جرّب بعد دقيقة أو تواصل مباشرة عبر واتساب: https://wa.me/" + WA);
        return;
      }
      sending = true;
      sendButton.disabled = true;
      input.value = "";
      input.style.height = "auto";
      addMessage("user", text);
      var typing = addMessage("bot", "يكتب...");
      typing.classList.add("typing");
      var reply = await callChatApi(text);
      typing.remove();
      addMessage("bot", reply || localSupportReply(text));
      sending = false;
      sendButton.disabled = false;
      input.focus();
      track("chat_message_sent", { source: "homepage_chat" });
    }

    on(fab, "click", function () { toggle(!chatOpen); }, {}, controller);
    on(closeButton, "click", function () { toggle(false); }, {}, controller);
    on(sendButton, "click", send, {}, controller);
    on(input, "input", debounce(function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 80) + "px";
      sendButton.disabled = !input.value.trim();
    }, 80), {}, controller);
    on(input, "keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    }, {}, controller);
  }

  function initSearchHint() {
    var trigger = document.querySelector(".search-trigger");
    if (!trigger || window.localStorage.getItem("brightai.searchHintSeen") === "true") return;
    trigger.setAttribute("title", "افتح البحث السريع عبر Ctrl+K أو ⌘K");
    window.setTimeout(function () {
      window.localStorage.setItem("brightai.searchHintSeen", "true");
    }, 2500);
  }

  function initScrollProgressThrottle() {
    var nav = document.querySelector(".unified-nav");
    if (!nav) return;
    on(window, "scroll", throttle(function () {
      nav.dataset.scrollY = String(Math.round(window.scrollY));
    }, 100), { passive: true });
  }

  function initLazyEnhancements() {
    if (!("IntersectionObserver" in window)) {
      initChatbot();
      return;
    }
    var chat = document.getElementById("bai-chat-box");
    if (!chat) return initChatbot();
    var observer = new IntersectionObserver(function () {
      initChatbot();
      observer.disconnect();
    });
    observer.observe(document.getElementById("bai-chat-fab") || chat);
  }

  ready(function () {
    initDecorativeIcons();
    initNavA11y();
    initMobileDrawerClose();
    initCookieConsent();
    initSearchHint();
    initScrollProgressThrottle();
    initLazyEnhancements();
  });
}());
