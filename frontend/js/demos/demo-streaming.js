(function () {
  "use strict";

  function createStreamingRenderer(target) {
    let buffer = "";
    function append(chunk) {
      buffer += String(chunk || "");
      target.textContent = buffer;
    }
    function reset() {
      buffer = "";
      target.textContent = "";
    }
    return { append, reset, getText: () => buffer };
  }

  function bindStreamingDemo(root, options) {
    const api = window.BrightAIDemoApiClient;
    const ui = window.BrightAIDemoUIKit;
    const output = root.querySelector("[data-demo-stream-output]");
    const form = root.querySelector("[data-demo-form]");
    if (!api || !ui || !output || !form) return null;
    const renderer = createStreamingRenderer(output);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      renderer.reset();
      ui.setLoading(root, true);
      api.runDemoApiStream({
        demoType: options?.demoType || root.dataset.demoType || "general",
        input: data.get("input") || data.get("demo-input") || "",
        onChunk: renderer.append,
        onComplete: () => ui.setLoading(root, false),
        onError: error => {
          ui.setLoading(root, false);
          output.textContent = api.getFriendlyErrorMessage(error.code);
        }
      });
    });
    return renderer;
  }

  window.BrightAIDemoStreaming = Object.freeze({
    createStreamingRenderer,
    bindStreamingDemo
  });
})();
