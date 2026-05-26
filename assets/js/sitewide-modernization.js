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
      wrapper.setAttribute("aria-label", table.getAttribute("aria-label") || "جدول قابل للتمرير");
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function markRevealTargets(body) {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
    markRevealTargets(body);
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
