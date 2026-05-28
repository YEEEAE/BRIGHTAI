(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/i, "/").replace(/\/$/, "");
  }

  ready(function () {
    var body = document.body;
    var sidebar = document.querySelector(".sidebar");
    var currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll(".sidebar-nav a, .dashboard-quick-nav a").forEach(function (link) {
      try {
        var linkPath = normalizePath(new URL(link.getAttribute("href"), window.location.href).pathname);
        if (linkPath === currentPath) {
          link.classList.add("active", "is-active");
          link.setAttribute("aria-current", "page");
        }
      } catch {
        // Ignore malformed placeholders.
      }
    });

    document.querySelectorAll("table").forEach(function (table) {
      if (table.closest(".table-responsive, .dashboard-table-scroll")) {
        return;
      }
      var wrapper = document.createElement("div");
      wrapper.className = "dashboard-table-scroll";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    document.querySelectorAll("img:not([loading])").forEach(function (image) {
      if (!image.closest(".sidebar, .topbar, header")) {
        image.loading = "lazy";
      }
      if (!image.hasAttribute("decoding")) {
        image.decoding = "async";
      }
    });

    document.querySelectorAll(".topbar-btn, .hamburger, [data-dashboard-sidebar-toggle]").forEach(function (button) {
      var label = (button.getAttribute("aria-label") || button.textContent || "").toLowerCase();
      if (!/sidebar|menu|القائمة|التنقل/.test(label)) {
        return;
      }
      button.addEventListener("click", function () {
        if (sidebar) {
          sidebar.classList.toggle("is-mobile-active");
        }
        body.classList.toggle("sidebar-open");
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (sidebar) {
          sidebar.classList.remove("is-mobile-active");
        }
        body.classList.remove("sidebar-open");
      }
    });

    document.documentElement.classList.add("brightai-dashboard-ready");
  });
}());
