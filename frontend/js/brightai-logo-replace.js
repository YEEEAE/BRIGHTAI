/*
 * Arabic: يستبدل شعارات BrightAI القديمة بالشعار الجديد ويحسن وضوحها على الخلفيات الداكنة.
 * English: Replaces legacy BrightAI logos with the new logo and improves visibility on dark backgrounds.
 */
(function () {
  "use strict";

  /*
   * Arabic: إعدادات مركزية للمسارات والأسماء القديمة والجديدة.
   * English: Central settings for legacy and new logo paths.
   */
  var NEW_LOGO_PATH = "/assets/images/logo-new.PNG?v=20260430";
  var NEW_LOGO_BASE_PATH = "/assets/images/logo-new.PNG";
  var LOGO_CLASS = "brightai-injected-logo";
  var STYLE_ID = "brightai-injected-logo-styles";
  var PROCESSED_ATTR = "data-brightai-logo-replaced";
  var LEGACY_LOGO_PATTERNS = [
    "logo.png",
    "logo.PNG",
    "IMG_7919.JPG",
    "img_7919.jpg"
  ];

  /*
   * Arabic: يضيف CSS مرة واحدة فقط، ويترك سلوك روابط الشعار كما هو.
   * English: Injects CSS once only while leaving logo anchor behavior untouched.
   */
  function ensureLogoStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "." + LOGO_CLASS + " {",
      "  width: 180px !important;",
      "  max-width: 180px !important;",
      "  height: auto !important;",
      "  object-fit: contain !important;",
      "  filter: drop-shadow(0 0 6px rgba(205, 103, 73, 0.35)) !important;",
      "  transition: filter 0.3s ease !important;",
      "}",
      "." + LOGO_CLASS + ":hover {",
      "  filter: drop-shadow(0 0 14px rgba(205, 103, 73, 0.6)) !important;",
      "}",
      "@media (max-width: 768px) {",
      "  ." + LOGO_CLASS + " {",
      "    width: 130px !important;",
      "    max-width: 130px !important;",
      "  }",
      "}"
    ].join("\n");

    document.head.appendChild(style);
  }

  /*
   * Arabic: يتحقق هل الصورة الحالية هي شعار قديم أو شعار جديد يحتاج إلى تنسيق.
   * English: Detects whether an image is a legacy logo or a new logo that needs styling.
   */
  function isLogoImage(img) {
    if (!img || img.tagName !== "IMG") {
      return false;
    }

    var src = img.getAttribute("src") || "";
    var currentSrc = img.currentSrc || "";
    var dataSrc = img.getAttribute("data-src") || "";
    var srcset = img.getAttribute("srcset") || "";
    var combinedSource = [src, currentSrc, dataSrc, srcset].join(" ");
    var normalizedSource = combinedSource.toLowerCase();

    if (
      src === NEW_LOGO_PATH ||
      normalizedSource.indexOf(NEW_LOGO_PATH.toLowerCase()) !== -1 ||
      normalizedSource.indexOf(NEW_LOGO_BASE_PATH.toLowerCase()) !== -1
    ) {
      return true;
    }

    return LEGACY_LOGO_PATTERNS.some(function (pattern) {
      return combinedSource.indexOf(pattern) !== -1 || normalizedSource.indexOf(pattern.toLowerCase()) !== -1;
    });
  }

  /*
   * Arabic: يستبدل مصدر الصورة فقط ويضيف التنسيق، بدون تغيير الرابط الأب أو أحداث النقر.
   * English: Replaces only the image source and applies styling without changing parent links or click handlers.
   */
  function replaceLogo(img) {
    if (!isLogoImage(img)) {
      return;
    }

    if (img.getAttribute("src") !== NEW_LOGO_PATH) {
      img.setAttribute("src", NEW_LOGO_PATH);
    }

    if (img.hasAttribute("srcset")) {
      img.removeAttribute("srcset");
    }

    img.classList.add(LOGO_CLASS);
    img.style.height = "auto";
    img.style.objectFit = "contain";
    img.decoding = img.decoding || "async";

    if (!img.getAttribute("alt")) {
      img.setAttribute("alt", "BrightAI");
    }

    img.setAttribute(PROCESSED_ATTR, "true");
  }

  /*
   * Arabic: يفحص الصورة الحالية وأي صور داخل عنصر جديد تمت إضافته للصفحة.
   * English: Scans the current image and any images nested inside a newly added element.
   */
  function scanNode(node) {
    if (!node || node.nodeType !== 1) {
      return;
    }

    if (node.tagName === "IMG") {
      replaceLogo(node);
      return;
    }

    var images = node.querySelectorAll ? node.querySelectorAll("img") : [];
    images.forEach(function (img) {
      replaceLogo(img);
    });
  }

  /*
   * Arabic: يشغل الاستبدال الأولي بعد توفر DOM.
   * English: Runs the initial replacement once the DOM is available.
   */
  function replaceExistingLogos() {
    ensureLogoStyles();
    document.querySelectorAll("img").forEach(function (img) {
      replaceLogo(img);
    });
  }

  /*
   * Arabic: يراقب الشعارات التي تُحقن بعد التحميل، مثل قائمة الجوال أو الفوتر الديناميكي.
   * English: Observes logos injected after load, such as lazy mobile menus or dynamic footers.
   */
  function observeDynamicLogos() {
    if (!("MutationObserver" in window)) {
      return;
    }

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(scanNode);
        }

        if (mutation.type === "attributes" && mutation.target && mutation.target.tagName === "IMG") {
          replaceLogo(mutation.target);
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "data-src"]
    });
  }

  /*
   * Arabic: نقطة التشغيل؛ مناسبة للحقن قبل body أو بعده.
   * English: Bootstraps safely whether injected before or after the body is ready.
   */
  function init() {
    replaceExistingLogos();
    observeDynamicLogos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
