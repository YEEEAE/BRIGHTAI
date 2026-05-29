(function () {
  "use strict";

  function loadCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src, callback) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (callback) callback();
      return;
    }

    var script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (callback) script.onload = callback;
    document.body.appendChild(script);
  }

  function initAos() {
    if (typeof window.AOS !== "undefined") {
      window.AOS.init({ duration: 800, once: true, offset: 100 });
    }
  }

  function loadDeferredResources() {
    loadCSS("https://fonts.googleapis.com/css2?family=BrightAI Official:wght@400;500;700;800&display=swap");
    loadCSS("/frontend/css/vendor/aos.css");
  }

  function loadAnimations() {
    loadScript("/frontend/js/vendor/aos.js", initAos);
  }

  function start() {
    window.setTimeout(loadDeferredResources, 50);
    window.setTimeout(loadAnimations, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
