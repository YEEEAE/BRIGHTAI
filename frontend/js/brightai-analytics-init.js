(function () {
  "use strict";

  var currentScript = document.currentScript || {};
  var analyticsId = currentScript.dataset.gaId || "G-8LLESL207Q";
  var configuredKey = "__brightaiGoogleTagConfigured";

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window[configuredKey] = window[configuredKey] || {};
  if (window[configuredKey][analyticsId]) return;

  var hasExistingConfig = window.dataLayer.some(function (entry) {
    return entry && entry[0] === "config" && entry[1] === analyticsId;
  });

  if (!hasExistingConfig) {
    window.gtag("js", new Date());
    window.gtag("config", analyticsId);
  }

  window[configuredKey][analyticsId] = true;
})();
