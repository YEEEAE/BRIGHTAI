(function () {
  "use strict";

  function createTimeoutSignal(timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      controller.abort(new Error("DEMO_REQUEST_TIMEOUT"));
    }, timeoutMs);
    return { controller, timer };
  }

  async function postJson(url, payload, options) {
    const { controller, timer } = createTimeoutSignal(options.timeoutMs || 28000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: "same-origin"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        const error = new Error(data.error || data?.error?.message_ar || "تعذر تشغيل الديمو");
        error.status = response.status;
        error.payload = data;
        throw error;
      }
      return data;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function collectFormPayload(form, config) {
    const formData = new FormData(form);
    const input = String(formData.get("input") || formData.get("demo-input") || "").trim();
    const scenario = String(formData.get("scenario") || "").trim();
    const goal = String(formData.get("goal") || config.outcome || "").trim();
    const systems = String(formData.get("systems") || "").trim();

    return {
      demoKey: config.demoKey,
      sourcePage: config.sourcePage,
      locale: config.locale || "ar-SA",
      businessGoal: goal || input,
      currentProcess: input,
      successMetric: goal,
      industry: config.industry || scenario || "قطاع أعمال سعودي",
      companySize: config.companySize || "شركة سعودية",
      context: {
        scenario,
        systems,
        problem: config.problem || "",
        expectedOutcome: config.outcome || ""
      }
    };
  }

  async function runDemo(form, config) {
    return postJson(config.apiEndpoint || "/api/demo/run", collectFormPayload(form, config), config);
  }

  window.BrightAIDemoApi = {
    postJson,
    collectFormPayload,
    runDemo
  };
})();
