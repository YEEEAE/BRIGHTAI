(function () {
  "use strict";

  const RESERVED_KEYS = new Set(["input", "prompt", "message", "customerText", "raw"]);

  function sanitizePayload(payload) {
    const clean = {};
    Object.keys(payload || {}).forEach(key => {
      if (RESERVED_KEYS.has(key)) return;
      const value = payload[key];
      if (value === null || value === undefined) return;
      clean[key] = typeof value === "string" ? value.slice(0, 180) : value;
    });
    return clean;
  }

  function track(eventName, payload) {
    window.BrightAIDemoApiClient?.trackDemoEvent(eventName, sanitizePayload(payload));
  }

  function bindDemoAnalytics(root) {
    root.querySelectorAll("[data-demo-track]").forEach(node => {
      node.addEventListener("click", () => {
        track(node.getAttribute("data-demo-track") || "demo_click", {
          demoType: root.dataset.demoType || "",
          target: node.tagName.toLowerCase()
        });
      });
    });
  }

  window.BrightAIDemoAnalytics = Object.freeze({
    sanitizePayload,
    track,
    bindDemoAnalytics
  });
})();
