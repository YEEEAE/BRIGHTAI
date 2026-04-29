(function () {
  "use strict";

  function track(config, action, params) {
    const payload = {
      demo_key: config.demoKey,
      page_path: config.sourcePage || location.pathname,
      ...(params || {})
    };
    if (typeof window.gtag === "function") {
      window.gtag("event", `${config.analyticsPrefix || "brightai_demo"}_${action}`, payload);
    }
    window.dispatchEvent(new CustomEvent("brightai-demo-analytics", {
      detail: { action, ...payload }
    }));
  }

  window.BrightAIDemoAnalytics = { track };
})();
