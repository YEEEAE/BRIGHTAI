(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  ready(() => {
    const config = window.BrightAIDemoConfig.getDemoConfig();
    const root = document;
    const form = root.querySelector("[data-demo-form]");
    const panel = root.querySelector("[data-result-panel]");
    if (!form || !panel) return;

    window.BrightAIDemoA11y.hardenPageDirection();
    window.BrightAIDemoUI.bindSamples(root, config);
    const ticker = window.BrightAIDemoStreaming.createStageTicker(root);

    root.querySelector("[data-reset-demo]")?.addEventListener("click", () => {
      form.reset();
      panel.innerHTML = '<div class="empty-state"><strong>تمام، جاهز نبدأ؟</strong><p>شغّل التجربة، وثوانٍ بس وتجيك النتيجة كلوحة تنفيذية قابلة للمشاركة.</p></div>';
      window.BrightAIDemoAnalytics.track(config, "reset");
    });

    root.querySelector("[data-download-report]")?.addEventListener("click", () => {
      window.print();
      window.BrightAIDemoAnalytics.track(config, "print_report");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      window.BrightAIDemoUI.setLoading(root, true);
      ticker.start();
      window.BrightAIDemoA11y.announce("بدأ تحليل الديمو");
      window.BrightAIDemoAnalytics.track(config, "submit");

      try {
        const result = await window.BrightAIDemoApi.runDemo(form, config);
        window.BrightAIDemoUI.renderResult(panel, result, config);
        window.BrightAIDemoA11y.announce("اكتمل تحليل الديمو");
        window.BrightAIDemoAnalytics.track(config, "success", { score: result.score || 0 });
      } catch (error) {
        window.BrightAIDemoUI.renderError(panel, error, config);
        window.BrightAIDemoA11y.announce("تعذر تشغيل التحليل الحي");
        window.BrightAIDemoAnalytics.track(config, "error", { status: error.status || 0 });
      } finally {
        ticker.stop();
        window.BrightAIDemoUI.setLoading(root, false);
      }
    });
  });
})();
