(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function list(items) {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!safeItems.length) return "<p>لا توجد نقاط كافية بعد.</p>";
    return `<ul>${safeItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function setLoading(root, isLoading) {
    const box = root.querySelector("[data-loading-box]");
    const submit = root.querySelector("[data-demo-form] button[type='submit']");
    if (box) box.hidden = !isLoading;
    if (submit) {
      submit.disabled = isLoading;
      submit.textContent = isLoading ? "جاري التحليل..." : "شغّل التحليل";
    }
  }

  function normalizeFallback(config) {
    const fallback = config.fallbackResult || {};
    return {
      ok: true,
      score: fallback.score || 78,
      title: config.title || "تجربة BrightAI",
      report: {
        executiveSummary: Array.isArray(fallback.executiveSummary)
          ? fallback.executiveSummary.join(" ")
          : fallback.executiveSummary || "هذه نتيجة توضيحية آمنة عند تعذر تشغيل التحليل الحي.",
        keyInsights: fallback.keyInsights || [],
        risks: fallback.risks || [],
        recommendedActions: fallback.recommendedActions || [],
        businessImpact: fallback.businessImpact || "",
        integrationReadiness: fallback.integrationReadiness || [],
        nextAction: Array.isArray(fallback.nextSteps) ? fallback.nextSteps[0] : fallback.nextSteps || "احجز جلسة تقييم تنفيذية.",
        whatsappSummary: fallback.whatsappSummary || ""
      }
    };
  }

  function renderResult(panel, result, config) {
    const report = result.report || {};
    const score = Number(result.score || 0);
    panel.innerHTML = `
      <article class="bai-decision-report" tabindex="-1">
        <div class="bai-score-card">
          <span>مؤشر الجاهزية</span>
          <strong>${Number.isFinite(score) ? Math.round(score) : 72}%</strong>
        </div>
        <h3>${escapeHtml(result.title || config.title || "تقرير الديمو")}</h3>
        <p class="bai-executive-summary">${escapeHtml(report.executiveSummary)}</p>
        <div class="bai-report-grid">
          <section><h4>الرؤى الحاسمة</h4>${list(report.keyInsights)}</section>
          <section><h4>المخاطر قبل الشراء</h4>${list(report.risks)}</section>
          <section><h4>الإجراءات المقترحة</h4>${list(report.recommendedActions)}</section>
          <section><h4>جاهزية الربط</h4>${list(report.integrationReadiness)}</section>
        </div>
        <div class="bai-impact-note">
          <strong>الأثر التجاري</strong>
          <p>${escapeHtml(report.businessImpact)}</p>
        </div>
        <div class="bai-next-action">
          <strong>الخطوة التالية</strong>
          <p>${escapeHtml(report.nextAction)}</p>
        </div>
      </article>
    `;
    panel.querySelector(".bai-decision-report")?.focus({ preventScroll: true });
  }

  function renderError(panel, error, config) {
    const fallback = normalizeFallback(config);
    panel.innerHTML = `
      <div class="bai-error-state" role="alert">
        <strong>تعذر تشغيل التحليل الحي الآن</strong>
        <p>${escapeHtml(error?.message || "استخدمنا نتيجة توضيحية آمنة حتى لا تتوقف التجربة.")}</p>
        <button class="btn btn-secondary" type="button" data-render-fallback>عرض نتيجة توضيحية</button>
      </div>
    `;
    panel.querySelector("[data-render-fallback]")?.addEventListener("click", () => renderResult(panel, fallback, config));
  }

  function bindSamples(root, config) {
    const textarea = root.querySelector("#demo-input");
    const scenario = root.querySelector("#scenario");
    const samples = Array.isArray(config.samples) ? config.samples : [];
    root.querySelectorAll("[data-sample]").forEach((button) => {
      button.addEventListener("click", () => {
        const sample = samples[Number(button.dataset.sample)] || [];
        if (scenario && sample[0]) scenario.value = sample[0];
        if (textarea && sample[1]) textarea.value = sample[1];
      });
    });
    root.querySelector("[data-load-first-sample]")?.addEventListener("click", () => {
      const first = root.querySelector("[data-sample='0']");
      first?.click();
      root.querySelector("#demo-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  window.BrightAIDemoUI = {
    escapeHtml,
    setLoading,
    normalizeFallback,
    renderResult,
    renderError,
    bindSamples
  };
})();
