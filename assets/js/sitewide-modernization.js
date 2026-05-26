(function () {
  "use strict";

  var PAGE_TYPES = [
    "home",
    "blog-post",
    "blog-index",
    "service-detail",
    "services-index",
    "demo",
    "dashboard",
    "contact",
    "about",
    "docs",
    "legal",
    "pricing",
    "sector",
    "location",
    "error",
    "tool",
    "ai-bots",
    "ai-agent"
  ];

  function toKebab(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizePageType(value) {
    var type = toKebab(value);
    return PAGE_TYPES.indexOf(type) === -1 ? "" : type;
  }

  function inferPageType(pathname) {
    var path = String(pathname || "/").toLowerCase();

    if (path === "/" || path === "/index.html" || path === "/en/" || path === "/en/index.html") {
      return "home";
    }

    if (/(404|500|error|permission-denied)/.test(path)) {
      return "error";
    }

    if (/\/blog\/index\.html$|\/blog\/?$/.test(path)) {
      return "blog-index";
    }

    if (path.indexOf("/blog/") === 0 || path.indexOf("/en/blog/") === 0) {
      return "blog-post";
    }

    if (/\/services\/index\.html$|\/services\/?$/.test(path)) {
      return "services-index";
    }

    if (path.indexOf("/services/") === 0 || path.indexOf("/en/services/") === 0) {
      return "service-detail";
    }

    if (path.indexOf("/demo/") === 0 || path.indexOf("/en/demo/") === 0 || path.indexOf("/en/tenders/") === 0) {
      return "demo";
    }

    if (path.indexOf("/ai-reject-dashboard/") === 0 || /dashboard|login|profile|workflow|reports/.test(path)) {
      return "dashboard";
    }

    if (path.indexOf("/contact/") === 0 || path.indexOf("/consultation/") === 0 || path.indexOf("/en/contact/") === 0) {
      return "contact";
    }

    if (path.indexOf("/about/") === 0 || path.indexOf("/en/about/") === 0) {
      return "about";
    }

    if (path.indexOf("/docs/") === 0 || path.indexOf("/en/docs/") === 0 || /\/docs\.html$/.test(path)) {
      return "docs";
    }

    if (/privacy|terms/.test(path)) {
      return "legal";
    }

    if (path.indexOf("/pricing/") === 0 || path.indexOf("/demo/pricing/") === 0) {
      return "pricing";
    }

    if (path.indexOf("/sectors/") === 0) {
      return "sector";
    }

    if (path.indexOf("/locations/") === 0) {
      return "location";
    }

    if (path.indexOf("/tools/") === 0 || path.indexOf("/try/") === 0) {
      return "tool";
    }

    if (path.indexOf("/ai-bots/") === 0 || path.indexOf("/en/ai-bots/") === 0 || path.indexOf("/bot/") === 0) {
      return "ai-bots";
    }

    if (path.indexOf("/ai-agent/") === 0 || path.indexOf("/en/ai-agent/") === 0) {
      return "ai-agent";
    }

    return "";
  }

  function setPageType(body) {
    var existing = normalizePageType(body.getAttribute("data-bright-page-type"));
    var inferred = inferPageType(window.location.pathname);
    var pageType = existing || inferred || "service-detail";

    body.setAttribute("data-bright-page-type", pageType);
    body.classList.add("bright-page--" + pageType);
  }

  function protectWideTables(body) {
    var tables = Array.prototype.slice.call(body.querySelectorAll("table"));

    tables.forEach(function (table) {
      if (table.closest(".table-wrap, .table-wrapper, .responsive-table, .bright-table-scroll")) {
        return;
      }

      var wrapper = document.createElement("div");
      wrapper.className = "bright-table-scroll";
      wrapper.setAttribute("tabindex", "0");
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("data-scroll-hint", "true");
      wrapper.setAttribute("aria-label", table.getAttribute("aria-label") || "جدول قابل للتمرير");
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function protectEmbeds(body) {
    Array.prototype.slice.call(body.querySelectorAll("iframe, video, embed, object")).forEach(function (embed) {
      if (!embed.closest(".bright-media-frame")) {
        embed.classList.add("bright-responsive-media");
      }

      if (embed.tagName.toLowerCase() === "iframe" && !embed.getAttribute("loading")) {
        embed.setAttribute("loading", "lazy");
      }
    });
  }

  function flagOverflowRisk(body) {
    var root = document.documentElement;

    window.setTimeout(function () {
      if (root.scrollWidth > root.clientWidth + 2) {
        body.classList.add("bright-has-overflow-risk");
      } else {
        body.classList.remove("bright-has-overflow-risk");
      }
    }, 120);
  }

  function textOf(element) {
    return (element && element.textContent ? element.textContent : "").replace(/\s+/g, " ").trim();
  }

  function matchesAny(text, words) {
    var value = String(text || "").toLowerCase();
    return words.some(function (word) {
      return value.indexOf(word.toLowerCase()) !== -1;
    });
  }

  function closestSection(element) {
    return element.closest("section, article, .card, .feature-card, .service-card, .answer-list-card, .glass, .panel");
  }

  function markSectionByHeading(body, className, words) {
    var headings = Array.prototype.slice.call(body.querySelectorAll("h1, h2, h3"));

    headings.forEach(function (heading) {
      if (!matchesAny(textOf(heading), words)) {
        return;
      }

      var section = closestSection(heading);

      if (section) {
        section.classList.add(className);
      }
    });
  }

  function markCards(body, selector, className) {
    var main = body.querySelector("main");
    var mainContent = body.querySelector("#main-content");
    var scope = main || (mainContent && mainContent.children.length ? mainContent : body);

    Array.prototype.slice.call(scope.querySelectorAll(selector)).forEach(function (element) {
      if (element.closest("header, footer, nav, .unified-nav, .mobile-menu, .site-footer")) {
        return;
      }

      element.classList.add(className);
    });
  }

  function enhanceForms(body) {
    Array.prototype.slice.call(body.querySelectorAll("form")).forEach(function (form) {
      form.classList.add("bright-modern-form");

      Array.prototype.slice.call(form.querySelectorAll("input, select, textarea")).forEach(function (field) {
        if (!field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby")) {
          var label = field.closest("label");
          var placeholder = field.getAttribute("placeholder");

          if (label && textOf(label)) {
            field.setAttribute("aria-label", textOf(label));
          } else if (placeholder) {
            field.setAttribute("aria-label", placeholder);
          }
        }
      });
    });
  }

  function isEnglishPage() {
    return /^en/i.test(document.documentElement.getAttribute("lang") || "") || window.location.pathname.indexOf("/en/") === 0;
  }

  function pageGuidanceCopy(pageType) {
    var english = isEnglishPage();
    var copy = {
      home: english
        ? ["You are on Bright AI's main page.", "Start with a consultation or explore live demos.", "/consultation/", "Request consultation"]
        : ["أنت في الصفحة الرئيسية لـ Bright AI.", "ابدأ باستشارة تشخيصية أو استكشف نماذج الديمو العملية.", "/consultation/", "طلب استشارة"],
      "services-index": english
        ? ["You are browsing Bright AI services.", "Compare solutions by need, then open the service closest to your goal.", "/services/", "Explore services"]
        : ["أنت في فهرس خدمات Bright AI.", "قارن الحلول حسب احتياجك ثم افتح الخدمة الأقرب لهدفك.", "/services/", "استكشاف الخدمات"],
      "service-detail": english
        ? ["You are viewing a service page.", "Review the problem, value, implementation steps, then request a consultation.", "/consultation/", "Request consultation"]
        : ["أنت في صفحة خدمة تفصيلية.", "راجع المشكلة والقيمة وخطوات التنفيذ ثم اطلب استشارة مناسبة.", "/consultation/", "طلب استشارة"],
      "blog-index": english
        ? ["You are in the Bright AI knowledge hub.", "Choose a topic, read the guide, then move to the related service when ready.", "/blog/", "Read more"]
        : ["أنت في مركز معرفة Bright AI.", "اختر موضوعًا، اقرأ الدليل، ثم انتقل للخدمة المرتبطة عند الجاهزية.", "/blog/", "قراءة المزيد"],
      "blog-post": english
        ? ["You are reading a practical article.", "Use it to understand the idea, then explore the related service or demo.", "/blog/", "More articles"]
        : ["أنت تقرأ مقالًا عمليًا.", "استخدمه لفهم الفكرة ثم انتقل للخدمة أو الديمو المرتبط.", "/blog/", "مقالات أكثر"],
      demo: english
        ? ["You are in a demo experience.", "Try the inputs, review the result, then request a tailored version.", "/consultation/", "Request a tailored demo"]
        : ["أنت في تجربة ديمو.", "جرّب المدخلات، راجع النتيجة، ثم اطلب نسخة مخصصة لجهتك.", "/consultation/", "طلب ديمو مخصص"],
      tool: english
        ? ["You are using a practical tool.", "Enter the required data, review the output, then discuss implementation.", "/consultation/", "Discuss implementation"]
        : ["أنت تستخدم أداة عملية.", "أدخل البيانات المطلوبة، راجع المخرجات، ثم ناقش طريقة التنفيذ.", "/consultation/", "مناقشة التنفيذ"],
      dashboard: english
        ? ["You are in a dashboard view.", "Review the indicators, filters, and tables before taking action.", "#main-content", "Review indicators"]
        : ["أنت في لوحة تحكم.", "راجع المؤشرات والفلاتر والجداول قبل اتخاذ الإجراء التالي.", "#main-content", "مراجعة المؤشرات"],
      contact: english
        ? ["You are on the contact page.", "Choose the fastest channel or send a clear request to the team.", "/contact/", "Contact Bright AI"]
        : ["أنت في صفحة التواصل.", "اختر أسرع قناة أو أرسل طلبًا واضحًا لفريق Bright AI.", "/contact/", "تواصل معنا"],
      about: english
        ? ["You are reading about Bright AI.", "Review our story, values, and approach before starting a conversation.", "/consultation/", "Start a conversation"]
        : ["أنت تتعرف على Bright AI.", "راجع القصة والقيم وطريقة العمل قبل بدء الحوار.", "/consultation/", "ابدأ الحوار"],
      legal: english
        ? ["You are reading a legal page.", "Review the terms carefully, then contact us if anything needs clarification.", "/contact/", "Ask a question"]
        : ["أنت تقرأ صفحة قانونية.", "راجع البنود بهدوء، وتواصل معنا إذا احتجت توضيحًا.", "/contact/", "طلب توضيح"],
      error: english
        ? ["This page is not available.", "Return to the homepage or explore services and demos.", "/", "Back to homepage"]
        : ["هذه الصفحة غير متاحة.", "ارجع للرئيسية أو استكشف الخدمات والديموهات.", "/", "العودة للرئيسية"],
      "ai-bots": english
        ? ["You are browsing Bright AI bots.", "Compare ready bots, then request the one closest to your workflow.", "/consultation/", "Request a bot"]
        : ["أنت تستعرض روبوتات Bright AI.", "قارن الروبوتات الجاهزة ثم اطلب الأقرب لسير عملك.", "/consultation/", "طلب روبوت"],
      "ai-agent": english
        ? ["You are exploring AI agents.", "Review the use cases, then discuss the agent your team needs.", "/consultation/", "Discuss an agent"]
        : ["أنت تستكشف وكلاء الذكاء الاصطناعي.", "راجع حالات الاستخدام ثم ناقش الوكيل المناسب لفريقك.", "/consultation/", "مناقشة وكيل"],
      sector: english
        ? ["You are viewing a sector page.", "Read the sector context, then explore the matching service.", "/services/", "Explore matching services"]
        : ["أنت في صفحة قطاع.", "اقرأ سياق القطاع ثم استكشف الخدمة المناسبة.", "/services/", "استكشاف الخدمات المناسبة"],
      location: english
        ? ["You are viewing a location page.", "Review local use cases, then contact the team for next steps.", "/contact/", "Contact the team"]
        : ["أنت في صفحة مدينة أو منطقة.", "راجع حالات الاستخدام المحلية ثم تواصل مع الفريق.", "/contact/", "تواصل مع الفريق"],
      pricing: english
        ? ["You are reviewing pricing context.", "Compare the options, then request a fit assessment.", "/consultation/", "Assess fit"]
        : ["أنت تراجع سياق الأسعار.", "قارن الخيارات ثم اطلب تقييم الملاءمة.", "/consultation/", "تقييم الملاءمة"],
      docs: english
        ? ["You are reading documentation.", "Use this page to understand scope, behavior, and integration details.", "/contact/", "Ask about integration"]
        : ["أنت تقرأ صفحة توثيق.", "استخدمها لفهم النطاق والسلوك وتفاصيل الربط.", "/contact/", "اسأل عن الربط"]
    };

    return copy[pageType] || copy.home;
  }

  function addPageGuidance(body) {
    if (body.querySelector(".bright-page-guidance")) {
      return;
    }

    var pageType = normalizePageType(body.getAttribute("data-bright-page-type")) || "home";
    var h1 = body.querySelector("main h1, #main-content h1, h1");

    if (!h1) {
      return;
    }

    var data = pageGuidanceCopy(pageType);
    var aside = document.createElement("aside");
    aside.className = "bright-page-guidance";
    aside.setAttribute("aria-label", isEnglishPage() ? "Page context and next action" : "سياق الصفحة والخطوة التالية");
    aside.innerHTML = '<p><strong>' + data[0] + '</strong> ' + data[1] + '</p> <a href="' + data[2] + '">' + data[3] + '</a>';
    h1.insertAdjacentElement("afterend", aside);
  }

  function markPagePatterns(body) {
    var pageType = normalizePageType(body.getAttribute("data-bright-page-type"));

    enhanceForms(body);
    addPageGuidance(body);

    if (pageType === "service-detail") {
      markSectionByHeading(body, "bright-section--problem", ["المشكلة", "problem", "التحدي", "challenge"]);
      markSectionByHeading(body, "bright-section--value", ["القيمة", "حل bright", "الحل", "value", "why"]);
      markSectionByHeading(body, "bright-section--steps", ["خطوات", "طريقة التنفيذ", "كيف", "steps", "implementation"]);
      markSectionByHeading(body, "bright-section--benefits", ["الفوائد", "benefits", "مخرجات", "النتائج"]);
      markSectionByHeading(body, "bright-section--related", ["خدمات مكملة", "ذات صلة", "related", "قارن"]);
      markCards(body, ".related-card, .hub-link, .service-demo-cta, .sitewide-cta", "bright-modern-cta-card");
    }

    if (pageType === "services-index") {
      markCards(body, "a[href^='/services/'], .ai-agent-card, .answer-list-card, .service-card", "bright-service-index-card");
    }

    if (pageType === "blog-post") {
      markCards(body, "blockquote, .quote, .callout", "bright-reading-callout");
    }

    if (pageType === "blog-index") {
      markCards(body, "article, .post, .blog-card, a[href^='/blog/']", "bright-blog-index-card");
    }

    if (pageType === "demo" || pageType === "tool") {
      markCards(body, ".demo-panel, .demo-card, .tool-panel, .result, .results, output, form", "bright-interactive-panel");
    }

    if (pageType === "dashboard") {
      markCards(body, ".metric, .metrics-card, .stat-card, .kpi-card, .card", "bright-dashboard-card");
      markCards(body, "form, .filters, .filter-bar, .toolbar", "bright-dashboard-filter");
    }

    if (pageType === "contact") {
      markCards(body, "form, .contact-card, .sitewide-cta, [data-cta-section]", "bright-contact-panel");
    }

    if (pageType === "about") {
      markCards(body, ".timeline, .value-card, .card, article", "bright-about-story-card");
    }

    if (pageType === "legal") {
      markCards(body, "article, .doc-content, .prose", "bright-legal-reader");
    }

    if (pageType === "error") {
      markCards(body, "main a, main button", "bright-error-action");
    }
  }

  function markRevealTargets(body) {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      return;
    }

    var selector = [
      ".feature-card",
      ".service-card",
      ".demo-card",
      ".tool-card",
      ".pricing-card",
      ".post",
      "article > section",
      ".dashboard-grid > *",
      ".metrics-grid > *"
    ].join(",");
    var targets = Array.prototype.slice.call(body.querySelectorAll(selector)).slice(0, 80);

    if (!targets.length) {
      return;
    }

    targets.forEach(function (target, index) {
      target.classList.add("bright-modern-reveal");
      target.style.setProperty("--bright-reveal-index", String(index % 8));
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.1
    });

    targets.forEach(function (target) {
      observer.observe(target);
    });
  }

  function boot() {
    var body = document.body;

    if (!body || body.dataset.brightModernized === "true") {
      return;
    }

    body.dataset.brightModernized = "true";
    setPageType(body);
    protectWideTables(body);
    protectEmbeds(body);
    markPagePatterns(body);
    markRevealTargets(body);
    flagOverflowRisk(body);
  }

  function scheduleBoot() {
    var run = function () {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(boot, { timeout: 900 });
      } else {
        window.setTimeout(boot, 0);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }
  }

  scheduleBoot();
}());
