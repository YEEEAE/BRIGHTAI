(function () {
  "use strict";

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.media = "print";
    link.onload = () => {
      link.media = "all";
    };
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
      script.async = true;
      script.defer = true;
      script.fetchPriority = "low";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`تعذر تحميل ${src}`));
      document.head.appendChild(script);
    });
  }

  function reportLoaderError(error) {
    if (typeof window.gtag === "function") {
      window.gtag("event", "demo_loader_error", {
        status: "error",
        error_message: error?.message || "demo_loader_failed"
      });
    }
    window.dispatchEvent(new CustomEvent("bai-demo-error", {
      detail: { demoType: "experience_loader", message: error?.message || "demo_loader_failed" }
    }));
  }

  function scheduleDemoLoad() {
    const run = () => {
      loadCss("/assets/css/demo-experience.css");
      loadScript("/assets/js/gemini-demo-engine.js")
        .then(() => loadScript("/assets/js/live-demo-apps.js"))
        .catch(reportLoaderError);
    };

    const runWhenIdle = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(run, { timeout: 1800 });
      } else {
        window.setTimeout(run, 600);
      }
    };

    if (document.readyState === "complete") runWhenIdle();
    else window.addEventListener("load", runWhenIdle, { once: true });
  }

  scheduleDemoLoad();
})();
