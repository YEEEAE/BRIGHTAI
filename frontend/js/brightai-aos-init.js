(function () {
  "use strict";

  function init() {
    if (typeof window.AOS !== "undefined") {
      window.AOS.init({ duration: 800, once: true, offset: 100 });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
