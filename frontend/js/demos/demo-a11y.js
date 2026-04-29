(function () {
  "use strict";

  function ensureLiveRegion() {
    let region = document.querySelector("[data-brightai-demo-live]");
    if (region) return region;
    region = document.createElement("div");
    region.className = "bai-sr-only";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("data-brightai-demo-live", "");
    document.body.appendChild(region);
    return region;
  }

  function announce(message) {
    const region = ensureLiveRegion();
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = String(message || "");
    }, 30);
  }

  function hardenArabicDirection(root) {
    document.documentElement.lang = document.documentElement.lang || "ar-SA";
    document.documentElement.dir = "rtl";
    const scope = root || document.body;
    if (scope) {
      scope.dir = "rtl";
      scope.lang = scope.lang || "ar-SA";
    }
  }

  function bindKeyboardShortcuts(root, actions) {
    const config = window.BRIGHTAI_DEMO_CONFIG || {};
    if (!config.features?.keyboardShortcuts) return;
    root.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && typeof actions?.submit === "function") {
        event.preventDefault();
        actions.submit();
      }
      if (event.key === "Escape" && typeof actions?.cancel === "function") {
        actions.cancel();
      }
    });
  }

  window.BrightAIDemoA11y = Object.freeze({
    ensureLiveRegion,
    announce,
    hardenArabicDirection,
    bindKeyboardShortcuts
  });
})();
