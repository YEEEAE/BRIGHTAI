(function () {
  "use strict";

  var currentScript = document.currentScript || {};
  var clarityId = currentScript.dataset.clarityId || "voq2kb6voe";

  function loadClarity() {
    window.clarity =
      window.clarity ||
      function clarity() {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };

    if (document.querySelector('script[src*="clarity.ms/tag/"]')) return;

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.clarity.ms/tag/" + clarityId;

    var firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  function scheduleLoad() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadClarity, { timeout: 2000 });
    } else {
      window.setTimeout(loadClarity, 1);
    }
  }

  if (document.readyState === "complete") {
    scheduleLoad();
  } else {
    window.addEventListener("load", scheduleLoad, { once: true });
  }
})();
