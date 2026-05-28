(function () {
  "use strict";

  function ensureLiveRegion() {
    let region = document.querySelector("[data-demo-live-region]");
    if (region) return region;
    region = document.createElement("div");
    region.className = "sr-only";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("data-demo-live-region", "");
    document.body.appendChild(region);
    return region;
  }

  function announce(message) {
    const region = ensureLiveRegion();
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 30);
  }

  function hardenPageDirection() {
    document.documentElement.lang = document.documentElement.lang || "ar-SA";
    document.documentElement.dir = "rtl";
    document.body?.setAttribute("dir", "rtl");
  }

  window.BrightAIDemoA11y = {
    announce,
    hardenPageDirection
  };
})();
