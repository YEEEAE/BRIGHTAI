(function () {
  "use strict";

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  loadCss("/assets/css/demo-experience.css");
  loadScript("/assets/js/gemini-demo-engine.js")
    .then(() => loadScript("/assets/js/live-demo-apps.js"))
    .catch(() => {
      if (typeof window.gtag === "function") {
        window.gtag("event", "demo_loader_error", { status: "error" });
      }
    });
})();
