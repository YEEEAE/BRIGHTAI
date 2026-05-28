(function () {
  "use strict";

  var LOGO_PATH = "/frontend/images/logo-new.PNG";
  var LOGO_ABSOLUTE = "https://brightai.site/frontend/images/logo-new.PNG";
  var LEGACY_LOGO_RE = /(logo(?:-new)?\.(?:png|jpg|jpeg|webp|avif)|logo\.PNG|og-cover\.jpg)/i;

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function isLikelyLogoImage(img) {
    var source = [
      img.getAttribute("src") || "",
      img.currentSrc || "",
      img.getAttribute("srcset") || "",
      img.getAttribute("alt") || "",
      img.className || ""
    ].join(" ");

    return LEGACY_LOGO_RE.test(source) || /شعار|logo|brand/i.test(source);
  }

  function tuneImage(img, index) {
    if (!img || img.dataset.brightaiModernized === "true") {
      return;
    }

    if (isLikelyLogoImage(img)) {
      img.src = LOGO_PATH;
      img.removeAttribute("srcset");
      img.classList.add("brightai-brand-image");
      img.decoding = "async";
      if (!img.getAttribute("alt")) {
        img.alt = "شعار Bright AI";
      }
      if (!img.getAttribute("width")) {
        img.width = 48;
      }
      if (!img.getAttribute("height")) {
        img.height = 48;
      }
      if (index === 0 || img.closest("header, .sidebar, .top-nav, .demo-nav, .site-header")) {
        img.setAttribute("fetchpriority", "high");
      }
      img.dataset.brightaiModernized = "true";
      return;
    }

    if (!img.hasAttribute("loading") && !img.closest("header, .hero, .hero-section")) {
      img.loading = "lazy";
    }
    if (!img.hasAttribute("decoding")) {
      img.decoding = "async";
    }
    img.dataset.brightaiModernized = "true";
  }

  function tuneFrame(frame) {
    if (!frame || frame.dataset.brightaiModernized === "true") {
      return;
    }

    if (frame.tagName === "IFRAME") {
      if (!frame.hasAttribute("loading")) {
        frame.loading = "lazy";
      }
      if (!frame.hasAttribute("title")) {
        frame.title = "محتوى مضمّن من Bright AI";
      }
    }

    frame.dataset.brightaiModernized = "true";
  }

  function createLogoImage(sourceClass, hidden) {
    var image = document.createElement("img");
    image.src = LOGO_PATH;
    image.alt = hidden ? "" : "شعار Bright AI";
    image.width = 48;
    image.height = 48;
    image.decoding = "async";
    image.className = (sourceClass ? sourceClass + " " : "") + "brightai-brand-image";
    if (hidden) {
      image.setAttribute("aria-hidden", "true");
    }
    return image;
  }

  function replaceSvgBrandMarks(root) {
    root.querySelectorAll("svg.brand-logo, svg.brand-mark").forEach(function (svg) {
      if (svg.dataset.brightaiModernized === "true") {
        return;
      }
      var hidden = svg.getAttribute("aria-hidden") === "true";
      svg.replaceWith(createLogoImage(svg.getAttribute("class") || "", hidden));
    });
  }

  function enrichTextBrandMarks(root) {
    root.querySelectorAll(".brand-icon").forEach(function (node) {
      if (node.dataset.brightaiModernized === "true" || node.querySelector("img")) {
        return;
      }
      node.replaceWith(createLogoImage("brand-icon", false));
    });

    root.querySelectorAll(".sidebar-logo, .auth-brand, .footer-brand").forEach(function (node) {
      if (node.querySelector("img")) {
        return;
      }
      var firstSvg = node.querySelector("svg");
      if (firstSvg) {
        firstSvg.replaceWith(createLogoImage(firstSvg.getAttribute("class") || "", false));
      }
    });
  }

  function wrapWideTables(root) {
    root.querySelectorAll("table").forEach(function (table) {
      if (table.closest(".brightai-responsive-table, .table-container, .table-wrapper, .table-shell")) {
        return;
      }
      var wrapper = document.createElement("div");
      wrapper.className = "brightai-responsive-table";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function normalizeMetaLogos() {
    document.querySelectorAll("meta[property='og:image'], meta[name='twitter:image']").forEach(function (meta) {
      var content = meta.getAttribute("content") || "";
      if (!content || /logo-new\.PNG/i.test(content) || LEGACY_LOGO_RE.test(content)) {
        meta.setAttribute("content", LOGO_ABSOLUTE);
      }
    });
  }

  function improveLinks() {
    document.querySelectorAll("a[target='_blank']").forEach(function (link) {
      var rel = (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
      ["noopener", "noreferrer"].forEach(function (token) {
        if (rel.indexOf(token) === -1) {
          rel.push(token);
        }
      });
      link.setAttribute("rel", rel.join(" "));
    });
  }

  function buttonLabel(button) {
    var text = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (text) {
      return "";
    }

    var id = button.id || "";
    var labels = {
      sidebarToggle: "فتح قائمة لوحة التحكم",
      "sidebar-toggle": "فتح إعدادات المحادثة",
      mobileMenuBtn: "فتح قائمة التنقل",
      menuBtn: "فتح قائمة التنقل"
    };

    return button.getAttribute("title") || labels[id] || "زر إجراء";
  }

  function labelIconOnlyButtons(root) {
    root.querySelectorAll("button").forEach(function (button) {
      if (button.getAttribute("aria-label") || button.getAttribute("aria-labelledby")) {
        return;
      }

      var label = buttonLabel(button);
      if (label) {
        button.setAttribute("aria-label", label);
      }
    });
  }

  function isTargetOpen(target) {
    if (!target) {
      return false;
    }

    if (target.classList.contains("hidden")) {
      return false;
    }

    if (target.classList.contains("sidebar-closed")) {
      return false;
    }

    if (target.classList.contains("sidebar-open") || target.classList.contains("is-mobile-active")) {
      return true;
    }

    var style = window.getComputedStyle(target);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    var rect = target.getBoundingClientRect();
    if (rect.width > 0 && (rect.right <= 0 || rect.left >= window.innerWidth)) {
      return false;
    }

    return true;
  }

  function syncDisclosureButton(button, target) {
    if (!button || !target || button.dataset.brightaiDisclosure === "true") {
      return;
    }

    button.setAttribute("aria-controls", target.id);
    button.setAttribute("aria-expanded", String(isTargetOpen(target)));
    button.dataset.brightaiDisclosure = "true";

    button.addEventListener("click", function () {
      window.setTimeout(function () {
        button.setAttribute("aria-expanded", String(isTargetOpen(target)));
      }, 0);
    });
  }

  function improveMenus() {
    [
      ["sidebarToggle", "sidebar"],
      ["sidebar-toggle", "sidebar"],
      ["mobileMenuBtn", "mobileMenu"],
      ["menuBtn", "mobileMenu"]
    ].forEach(function (pair) {
      var button = document.getElementById(pair[0]);
      var target = document.getElementById(pair[1]);
      syncDisclosureButton(button, target);
    });
  }

  function run(root) {
    root = root || document;
    replaceSvgBrandMarks(root);
    enrichTextBrandMarks(root);
    root.querySelectorAll("img").forEach(tuneImage);
    root.querySelectorAll("iframe, embed, object").forEach(tuneFrame);
    wrapWideTables(root);
    normalizeMetaLogos();
    improveLinks();
    labelIconOnlyButtons(root);
    improveMenus();
    document.documentElement.classList.add("brightai-modernized");
  }

  onReady(function () {
    run(document);

    if (!("MutationObserver" in window)) {
      return;
    }

    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) {
        return;
      }
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        run(document);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}());
