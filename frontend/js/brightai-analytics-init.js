(function () {
  "use strict";

  var currentScript = document.currentScript || {};
  var analyticsId = currentScript.dataset.gaId || "G-8LLESL207Q";

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", analyticsId);
})();
