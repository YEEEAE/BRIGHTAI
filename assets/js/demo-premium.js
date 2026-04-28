(function () {
  "use strict";

  const endpoint = "/api/ai/chat/completions";
  const FALLBACK_MESSAGE = "تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة.";
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function text(value) {
    return String(value ?? "");
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function parseJsonScript(id, fallback) {
    try {
      return JSON.parse($(id)?.textContent || "");
    } catch {
      return fallback;
    }
  }

  function asArray(value, fallback) {
    if (Array.isArray(value) && value.length) return value.map(String);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return fallback || [];
  }

  function normalizeResult(raw, fallback) {
    let data = raw;
    if (typeof data === "string") {
      const clean = data.replace(/```json/gi, "").replace(/```/g, "").trim();
      try {
        data = JSON.parse(clean);
      } catch {
        data = { executiveSummary: [clean] };
      }
    }
    const merged = { ...(fallback || {}), ...(data || {}) };
    return {
      executiveSummary: asArray(merged.executiveSummary || merged.executive_summary, fallback.executiveSummary),
      score: Number(merged.score || merged.readinessIndex || merged.readiness_index || fallback.score || 80),
      keyInsights: asArray(merged.keyInsights || merged.key_insights, fallback.keyInsights),
      risks: asArray(merged.risks, fallback.risks),
      recommendedActions: asArray(merged.recommendedActions || merged.recommended_actions, fallback.recommendedActions),
      businessImpact: text(merged.businessImpact || merged.business_impact || fallback.businessImpact),
      integrationReadiness: asArray(merged.integrationReadiness || merged.integration_readiness || merged.integration_plan, fallback.integrationReadiness),
      nextSteps: asArray(merged.nextSteps || merged.next_steps, fallback.nextSteps)
    };
  }

  function list(items) {
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function whatsappUrl(config, summary) {
    const msg = `السلام عليكم، شاهدت تقرير ${config.title} وأرغب في نسخة مخصصة. الملخص: ${summary}`;
    return `https://wa.me/966538229013?text=${encodeURIComponent(msg)}`;
  }

  function renderResult(panel, result, config, isFallback) {
    const score = Math.max(0, Math.min(100, Math.round(result.score || 0)));
    const summary = result.executiveSummary[0] || config.title;
    panel.innerHTML = `
      <div class="dashboard ${isFallback ? "error-state" : ""}" data-rendered-report>
        ${isFallback ? `<section class="dash-section error-state"><h3>تعذر تشغيل التحليل الآن</h3><p>تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة.</p><div class="dash-cta"><button class="btn btn-secondary" type="button" data-retry-demo>إعادة المحاولة</button><a class="btn btn-primary" href="${whatsappUrl(config, summary)}" target="_blank" rel="noopener">تواصل واتساب</a></div></section>` : ""}
        <section class="score-card">
          <div class="score-ring" style="--score:${score}"><span>${score}</span></div>
          <div>
            <h3>مؤشر الجاهزية</h3>
            <p>قراءة تقديرية تساعد على ترتيب القرار، وليست ضماناً لنتيجة تجارية محددة.</p>
          </div>
        </section>
        <section class="dash-section"><h3>ملخص تنفيذي</h3>${list(result.executiveSummary)}</section>
        <section class="dash-section"><h3>رؤى رئيسية</h3>${list(result.keyInsights)}</section>
        <section class="dash-section"><h3>المخاطر</h3>${list(result.risks)}</section>
        <section class="dash-section"><h3>الإجراءات الموصى بها</h3>${list(result.recommendedActions)}</section>
        <section class="dash-section"><h3>الأثر التجاري أو العائد المتوقع</h3><p>${escapeHtml(result.businessImpact)}</p></section>
        <section class="dash-section"><h3>جاهزية التكامل</h3>${list(result.integrationReadiness)}</section>
        <section class="dash-section"><h3>الخطوات التالية</h3>${list(result.nextSteps)}</section>
        <section class="dash-section">
          <h3>خطوة تجارية</h3>
          <div class="dash-cta">
            <a class="btn btn-primary" href="/contact/">احجز ديمو مباشر</a>
            <a class="btn btn-secondary" href="${whatsappUrl(config, summary)}" target="_blank" rel="noopener">أرسل التقرير عبر واتساب</a>
            <button class="btn btn-outline" type="button" data-download-report>حمّل التقرير</button>
          </div>
        </section>
      </div>
    `;
    window.__brightAiLastReport = { config, result };
  }

  async function showLoading(box) {
    box.hidden = false;
    const stages = all("[data-stage]", box);
    stages.forEach((stage) => stage.classList.remove("active"));
    for (const stage of stages) {
      stage.classList.add("active");
      await delay(260);
    }
  }

  async function unifiedDemoRequest(payload, options) {
    if (window.BrightAI?.generateDemoResult && window.BrightAI.generateDemoResult !== unifiedDemoRequest) {
      return window.BrightAI.generateDemoResult(payload);
    }

    const body = {
      model: payload.model || "gemini-2.5-flash",
      demoType: payload.demoType,
      agentType: payload.agentType || payload.demoType,
      schemaName: payload.schemaName,
      locale: "ar-SA",
      sourcePage: payload.sourcePage || window.location.pathname,
      messages: [
        { role: "system", content: payload.systemPrompt || "أنت محلل Bright AI. أعد نتيجة عربية منظمة قابلة للعرض فقط." },
        { role: "user", content: payload.taskPrompt || JSON.stringify(payload.userInputs || {}, null, 2) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: payload.schemaName || "genericDemoSchema", schema: payload.responseSchema || undefined }
      },
      temperature: payload.temperature ?? 0.2
    };

    const timeoutMs = options?.timeoutMs || 45000;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    };
    try {
      const res = window.BrightAIGateway?.apiFetch
        ? await window.BrightAIGateway.apiFetch(endpoint, request, timeoutMs)
        : await fetch(window.BrightAIRuntimeConfig?.buildApiUrl ? window.BrightAIRuntimeConfig.buildApiUrl(endpoint) : endpoint, request);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error?.message_ar || FALLBACK_MESSAGE);
      return data?.data || data?.choices?.[0]?.message?.content || data;
    } catch (error) {
      window.dispatchEvent(new CustomEvent("bai-demo-error", {
        detail: {
          demoType: payload.demoType,
          agentType: payload.agentType || payload.demoType,
          message: error?.message || FALLBACK_MESSAGE
        }
      }));
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  window.BrightAI = window.BrightAI || {};
  window.BrightAI.generateDemoResult = window.BrightAI.generateDemoResult || unifiedDemoRequest;

  async function requestAi(config, input, extra) {
    return unifiedDemoRequest({
      model: "gemini-2.5-flash",
      demoType: config.demoType,
      agentType: config.agentType,
      schemaName: config.schemaName,
      sourcePage: config.sourcePage,
      fallbackResult: config.fallbackResult,
      systemPrompt: "أنت محلل أعمال من Bright AI. أعد نتيجة عربية منظمة للوحة ديمو فقط ولا تعرض JSON للمستخدم.",
      taskPrompt: `اسم الديمو: ${config.title}\nالمشكلة: ${config.problem}\nالنتيجة المطلوبة: ${config.outcome}\nالمدخلات: ${input}\nتفاصيل إضافية: ${extra}`,
      userInputs: { input, extra },
      temperature: 0.2
    }, { timeoutMs: 45000 });
  }

  function downloadReport() {
    const report = window.__brightAiLastReport;
    const content = report
      ? `${report.config.title}\n\n${report.result.executiveSummary.join("\n")}\n\nالإجراءات:\n${report.result.recommendedActions.join("\n")}`
      : document.title;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bright-ai-demo-report.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function init() {
    if (window.__brightDemoPremiumInitialized) return;
    window.__brightDemoPremiumInitialized = true;
    const config = parseJsonScript("#demo-config", null);
    const samples = parseJsonScript("#demo-samples", []);
    const form = $("[data-demo-form]");
    const input = $("#demo-input");
    const scenario = $("#scenario");
    const resultPanel = $("[data-result-panel]");
    const loadingBox = $("[data-loading-box]");
    if (!config || !form || !input || !resultPanel || !loadingBox) return;

    function loadSample(index) {
      const sample = samples[index] || samples[0];
      if (!sample) return;
      if (scenario) scenario.value = sample[0];
      input.value = sample[1];
      input.focus();
    }

    all("[data-sample]").forEach((button) => {
      if (button.dataset.demoPremiumBound === "true") return;
      button.dataset.demoPremiumBound = "true";
      button.addEventListener("click", () => loadSample(Number(button.getAttribute("data-sample")) || 0));
    });

    const firstSample = $("[data-load-first-sample]");
    if (firstSample && firstSample.dataset.demoPremiumBound !== "true") {
      firstSample.dataset.demoPremiumBound = "true";
      firstSample.addEventListener("click", () => {
        loadSample(0);
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const resetDemo = $("[data-reset-demo]");
    if (resetDemo && resetDemo.dataset.demoPremiumBound !== "true") {
      resetDemo.dataset.demoPremiumBound = "true";
      resetDemo.addEventListener("click", () => loadSample(0));
    }

    if (form.dataset.demoPremiumBound !== "true") form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      await showLoading(loadingBox);
      try {
        const extra = `${$("#goal")?.value || ""} ${$("#systems")?.value || ""}`.trim();
        const raw = await requestAi(config, input.value.trim(), extra);
        renderResult(resultPanel, normalizeResult(raw, config.fallbackResult), config, false);
      } catch {
        renderResult(resultPanel, normalizeResult(config.fallbackResult, config.fallbackResult), config, true);
      } finally {
        loadingBox.hidden = true;
        submit.disabled = false;
      }
    });
    form.dataset.demoPremiumBound = "true";

    if (!window.__brightDemoPremiumDocumentClickBound) document.addEventListener("click", (event) => {
      if (event.target.closest("[data-download-report]")) downloadReport();
      if (event.target.closest("[data-retry-demo]")) form.requestSubmit();
    });
    window.__brightDemoPremiumDocumentClickBound = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
