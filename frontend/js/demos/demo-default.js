(function () {
  "use strict";

  function initDemo(root) {
    const scope = root || document.querySelector("[data-brightai-demo]");
    if (!scope) return;
    const api = window.BrightAIDemoApiClient;
    const ui = window.BrightAIDemoUIKit;
    const a11y = window.BrightAIDemoA11y;
    const analytics = window.BrightAIDemoAnalytics;
    const panel = scope.querySelector("[data-demo-result]");
    if (!api || !ui || !panel) return;
    a11y?.hardenArabicDirection(scope);
    analytics?.bindDemoAnalytics(scope);
    ui.bindForm(scope, async formData => {
      ui.setLoading(scope, true);
      analytics?.track("demo_submit", { demoType: scope.dataset.demoType || "general" });
      try {
        const result = await api.runDemoApiRequest({
          demoType: scope.dataset.demoType || "general",
          input: formData.get("input") || formData.get("demo-input") || ""
        });
        ui.renderResult(panel, result);
        a11y?.announce("اكتمل تحليل الديمو.");
      } catch (error) {
        ui.renderError(panel, api.normalizeDemoApiError(error));
      } finally {
        ui.setLoading(scope, false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initDemo());
  } else {
    initDemo();
  }

  window.BrightAIDemoDefault = Object.freeze({ initDemo });
})();
