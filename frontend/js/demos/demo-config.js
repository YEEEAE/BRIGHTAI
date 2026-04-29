(function () {
  "use strict";

  window.BRIGHTAI_DEMO_CONFIG = Object.freeze({
    apiBaseUrl: "https://api.brightai.site",
    endpoints: {
      standard: "/api/demo/gemini",
      streaming: "/api/demo/gemini/stream"
    },
    defaultMode: "api",
    fallbackToMock: true,
    enableStreaming: true,
    timeoutMs: 30000,
    streamTimeoutMs: 60000,
    clientName: "brightai-demo-web",
    version: "2.0.0",
    locale: "ar-SA",
    features: Object.freeze({
      haptics: true,
      soundCues: false,
      cinematicReveal: true,
      keyboardShortcuts: true
    })
  });
})();
