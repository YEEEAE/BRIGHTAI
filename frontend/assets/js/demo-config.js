(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    apiEndpoint: "/api/demo/run",
    registryEndpoint: "/api/demo/registry",
    locale: "ar-SA",
    direction: "rtl",
    timeoutMs: 28000,
    analyticsPrefix: "brightai_demo",
    whatsappPhone: "966538229013"
  };

  function readJsonScript(id, fallback) {
    const node = document.getElementById(id);
    if (!node) return fallback;
    try {
      return JSON.parse(node.textContent || "");
    } catch (_error) {
      return fallback;
    }
  }

  function normalizeDemoKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "")
      .replace(/^demo\//, "")
      .replace(/\/index\.html$/, "")
      .replace(/\.html$/, "");
  }

  function getDemoConfig() {
    const embedded = readJsonScript("demo-config", {});
    const slug = normalizeDemoKey(embedded.slug || embedded.demoType || document.body?.dataset?.demoSlug || location.pathname);
    return {
      ...DEFAULT_CONFIG,
      ...embedded,
      slug,
      demoKey: normalizeDemoKey(embedded.demoKey || embedded.demoType || slug),
      sourcePage: embedded.sourcePage || location.pathname,
      samples: readJsonScript("demo-samples", [])
    };
  }

  window.BrightAIDemoConfig = {
    defaults: DEFAULT_CONFIG,
    readJsonScript,
    normalizeDemoKey,
    getDemoConfig
  };
})();
