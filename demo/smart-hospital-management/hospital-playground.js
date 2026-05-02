(function () {
  const state = {
    scenarioId: "hajj_surge",
    snapshot: null,
    lastRecommendation: null,
    audit: [],
    sandboxTimer: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const data = window.HospitalSyntheticData;
  const config = window.HospitalGeminiConfig;

  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("visible");
    window.setTimeout(() => node.classList.remove("visible"), 2400);
  }

  function cssClassForValue(value) {
    if (value >= 95) return "critical";
    if (value >= 88) return "high";
    if (value >= 76) return "mid";
    return "low";
  }

  function renderScenarios() {
    const list = $("#scenario-list");
    list.innerHTML = data.scenarios.map((scenario) => `
      <button class="scenario-chip" type="button" data-scenario="${scenario.id}" aria-pressed="${scenario.id === state.scenarioId}">
        <strong>${scenario.title}</strong>
        <span>${scenario.summary}</span>
      </button>
    `).join("");
  }

  function renderKpis(snapshot) {
    $("#kpi-strip").innerHTML = snapshot.kpis.map((kpi) => `
      <article class="kpi-card">
        <span>${kpi.label}</span>
        <strong>${kpi.value}</strong>
        <small class="trend-${kpi.trend}">${kpi.delta}</small>
      </article>
    `).join("");
  }

  function renderHero(snapshot) {
    $("[data-hero-occupancy]").textContent = `${snapshot.hero.occupancy}%`;
    $("[data-hero-er]").textContent = `${snapshot.hero.erWait} د`;
    $("[data-hero-staff]").textContent = snapshot.hero.staffGaps;
    $("[data-hero-supply]").textContent = snapshot.hero.supplyCritical;
    $("[data-clock]").textContent = new Date().toLocaleTimeString("en-GB");
  }

  function renderHeatmap(snapshot) {
    const wards = ["باطنية", "جراحة", "عناية", "ولادة", "أطفال"];
    const floors = ["الأول", "الثاني", "الثالث", "الرابع"];
    const cells = [`<div class="heat-label">القسم</div>${wards.map((ward) => `<div class="heat-label">${ward}</div>`).join("")}`];
    floors.forEach((floor) => {
      cells.push(`<div class="heat-label">${floor}</div>`);
      wards.forEach((ward) => {
        const bed = snapshot.beds.find((item) => item.floor === floor && item.ward === ward);
        cells.push(`<div class="heat-cell ${cssClassForValue(bed.value)}" title="توقع 6 ساعات: ${bed.predicted}%">${bed.value}%</div>`);
      });
    });
    $("#bed-heatmap").innerHTML = cells.join("");
  }

  function renderDashboard(snapshot) {
    renderHero(snapshot);
    renderKpis(snapshot);
    renderHeatmap(snapshot);
    $("#er-list").innerHTML = snapshot.er.map((row) => `
      <div class="metric-row">
        <span>${row.name}<br><small>${row.surge}</small></span>
        <strong>${row.current} د ← ${row.predicted} د</strong>
      </div>
    `).join("");
    $("#or-list").innerHTML = snapshot.operations.map((op) => `
      <div class="or-item" draggable="true" data-operation="${op.id}">
        <span><strong>${op.name}</strong><br><small>${op.room} · ${op.time} · استخدام ${op.utilization}</small></span>
        <span class="badge ${op.conflict ? "badge-risk" : "badge-ok"}">${op.conflict ? "تعارض" : "مستقر"}</span>
      </div>
    `).join("");
    $("#roster-grid").innerHTML = snapshot.roster.map((slot) => `
      <div class="roster-slot" data-gap="${slot.gap}">
        <strong>${slot.area}</strong>
        <p>${slot.shift}</p>
        <span class="badge ${slot.gap ? "badge-risk" : "badge-ok"}">تغطية ${slot.coverage}</span>
      </div>
    `).join("");
    $("#supply-alerts").innerHTML = snapshot.supply.map((alert) => `
      <div class="alert">
        <strong>${alert.item}</strong>
        <p>${alert.status}</p>
        <span class="badge ${alert.risk === "high" ? "badge-risk" : "badge-warn"}">${alert.risk === "high" ? "حرج" : "مراقبة"}</span>
      </div>
    `).join("");
    $("#last-update").textContent = `آخر تحديث ${new Date().toLocaleTimeString("ar-SA")}`;
  }

  function refreshSnapshot() {
    state.snapshot = data.createSnapshot(state.scenarioId);
    renderDashboard(state.snapshot);
  }

  function setProgress(index) {
    $$("#progress-steps .step").forEach((step, stepIndex) => {
      step.classList.toggle("active", stepIndex <= index);
    });
  }

  function renderRecommendation(result) {
    state.lastRecommendation = result;
    $("#visual-output").innerHTML = `
      <article class="report-card">
        <h3>ملخص القرار</h3>
        <p>${result.decision_summary}</p>
        <span class="badge ${result.human_approval_required ? "badge-risk" : "badge-ok"}">${result.human_approval_required ? "يتطلب اعتماداً بشرياً" : "لا يتطلب اعتماداً فورياً"}</span>
      </article>
      <article class="report-card">
        <h3>الإجراءات الموصى بها</h3>
        ${result.recommended_actions.map((item) => `
          <div class="metric-row">
            <span><strong>${item.action}</strong><br><small>${item.owner_role} · ${item.deadline} · جهد ${item.effort}</small></span>
            <strong>${item.impact_estimate}</strong>
          </div>
        `).join("")}
      </article>
      <article class="report-card">
        <h3>المؤشرات المتأثرة</h3>
        ${result.affected_kpis.map((kpi) => `
          <div class="metric-row"><span>${kpi.kpi}</span><strong>${kpi.current} ← ${kpi.projected}</strong></div>
        `).join("")}
      </article>
      <article class="report-card">
        <h3>ملاحظات الامتثال</h3>
        ${result.compliance_notes.map((note) => `
          <div class="alert"><strong>${note.standard}</strong><p>${note.clause}: ${note.status}</p></div>
        `).join("")}
      </article>
    `;
    $("#json-output").textContent = JSON.stringify(result, null, 2);
    $("#lead-capture").classList.add("visible");
  }

  function renderAudit() {
    $("#audit-output").innerHTML = state.audit.map((item) => `
      <div class="alert">
        <strong>${item.time}</strong>
        <p>${item.message}</p>
      </div>
    `).join("");
  }

  function addAudit(message) {
    state.audit.unshift({ time: new Date().toLocaleTimeString("ar-SA"), message });
    renderAudit();
  }

  function updateScenario(id) {
    const scenario = data.scenarios.find((item) => item.id === id) || data.scenarios[0];
    state.scenarioId = scenario.id;
    renderScenarios();
    $("#director-question").value = scenario.question;
    updateCounter();
    refreshSnapshot();
    addAudit(`تم تحميل سيناريو: ${scenario.title}`);
  }

  function localToolCall(question) {
    if (question.includes("سباهي") || question.includes("CBAHI")) return "check_compliance(CBAHI)";
    if (question.includes("تقرير")) return "generate_report(monthly_quality, current_month)";
    if (question.includes("أثر") || question.includes("محاكاة")) return "simulate_scenario(active_change, 6h)";
    return "query_kpi(operational_summary, 7d, active_scenario)";
  }

  async function callGemini(question) {
    const payload = {
      question,
      scenario: state.scenarioId,
      snapshot: state.snapshot,
      model: $("#model-variant").value,
      temperature: Number($("#temperature").value),
      maxTokens: Number($("#max-tokens").value),
      persona: $("#persona").value,
      responseSchema: config.responseSchema,
      stream: true
    };

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Gemini proxy error ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      $("#stream-status").textContent = "يبث الآن";
      $("#json-output").textContent = buffer;
      $("#visual-output").innerHTML = `
        <article class="report-card">
          <h3>بث مباشر من Gemini</h3>
          <p>${buffer.replace(/[{}[\]",]/g, " ").slice(0, 520) || "جارٍ استقبال الرموز..."}</p>
        </article>
        <div class="skeleton" aria-hidden="true"></div>
      `;
    }
    return JSON.parse(buffer);
  }

  async function runAnalysis(question) {
    setProgress(0);
    $("#stream-status").textContent = "جارٍ القراءة";
    $("#visual-output").innerHTML = `<div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div>`;
    addAudit(`استدعاء أداة افتراضية: ${localToolCall(question)}`);

    const progressTimers = [1, 2, 3].map((step, index) => window.setTimeout(() => {
      setProgress(step);
      $("#stream-status").textContent = ["التحليل", "التحقق", "التوليد"][index];
    }, (index + 1) * 650));

    try {
      const result = await callGemini(question);
      progressTimers.forEach(window.clearTimeout);
      setProgress(3);
      $("#stream-status").textContent = "اكتمل";
      renderRecommendation(result);
      addAudit("اكتمل توليد توصية Gemini عبر الوكيل الخلفي.");
      toast("تم توليد التقرير");
    } catch (error) {
      progressTimers.forEach(window.clearTimeout);
      setProgress(3);
      const fallback = data.fallbackRecommendation(state.snapshot, question);
      $("#stream-status").textContent = "اكتمل بنمط محلي";
      renderRecommendation(fallback);
      addAudit(`تعذر الاتصال بالوكيل الخلفي، تم استخدام نموذج محلي آمن: ${error.message}`);
      toast("تم استخدام نتيجة محلية بسبب غياب الاتصال");
    }
  }

  function addChatMessage(message, type = "assistant") {
    const node = document.createElement("div");
    node.className = `message ${type}`;
    node.textContent = message;
    $("#chat-log").appendChild(node);
    node.scrollIntoView({ block: "nearest" });
  }

  function runSandbox() {
    const scenario = data.scenarios.find((item) => item.id === state.scenarioId);
    const timeline = $("#sandbox-timeline");
    let index = 0;
    window.clearInterval(state.sandboxTimer);
    timeline.innerHTML = scenario.timeline.map((item, itemIndex) => `
      <div class="timeline-item" data-timeline="${itemIndex}">
        <strong>${String(itemIndex * 6).padStart(2, "0")} ث</strong>
        <span>${item}</span>
      </div>
    `).join("") + `<div class="timeline-bar"><span></span></div>`;
    const bar = $(".timeline-bar span", timeline);
    state.sandboxTimer = window.setInterval(() => {
      $$("[data-timeline]", timeline).forEach((item) => item.classList.remove("active"));
      const active = $(`[data-timeline="${Math.min(index, scenario.timeline.length - 1)}"]`, timeline);
      if (active) active.classList.add("active");
      bar.style.width = `${Math.min(100, (index / 5) * 100)}%`;
      addChatMessage(scenario.timeline[Math.min(index, scenario.timeline.length - 1)]);
      index += 1;
      if (index > 5) {
        window.clearInterval(state.sandboxTimer);
        runAnalysis(scenario.question);
      }
    }, 6000);
    toast("بدأت محاكاة 30 ثانية");
  }

  function updateCounter() {
    const input = $("#director-question");
    $("#question-counter").textContent = `${input.value.length} / ${input.maxLength}`;
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const scenarioButton = event.target.closest("[data-scenario]");
      if (scenarioButton) updateScenario(scenarioButton.dataset.scenario);

      const quickQuestion = event.target.closest("[data-quick-question]");
      if (quickQuestion) {
        $("#chat-input").value = quickQuestion.dataset.quickQuestion;
        $("#chat-input").focus();
      }
    });

    $("#director-question").addEventListener("input", updateCounter);
    $("#ops-form").addEventListener("submit", (event) => {
      event.preventDefault();
      runAnalysis($("#director-question").value.trim());
    });

    $("#chat-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const question = $("#chat-input").value.trim();
      if (!question) return;
      addChatMessage(question, "user");
      runAnalysis(question);
    });

    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".tab").forEach((item) => item.setAttribute("aria-selected", "false"));
        $$(".tab-panel").forEach((panel) => { panel.hidden = true; });
        tab.setAttribute("aria-selected", "true");
        $(`#${tab.getAttribute("aria-controls")}`).hidden = false;
      });
    });

    $("#run-sandbox").addEventListener("click", runSandbox);

    $("[data-copy]").addEventListener("click", async () => {
      await navigator.clipboard.writeText($("#json-output").textContent);
      toast("تم نسخ التقرير");
    });

    $("[data-download]").addEventListener("click", () => {
      const blob = new Blob([$("#json-output").textContent], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "brightai-hospital-recommendation.json";
      anchor.click();
      URL.revokeObjectURL(url);
      toast("تم تنزيل الملف");
    });

    $("[data-share]").addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#${state.scenarioId}`;
      await navigator.clipboard.writeText(url);
      toast("تم نسخ رابط المشاركة");
    });

    $("[data-theme-toggle]").addEventListener("click", () => {
      const dark = document.documentElement.dataset.theme !== "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      localStorage.setItem("hospital-theme", dark ? "dark" : "light");
    });

    $("[data-video-trigger]").addEventListener("click", () => {
      toast("نسخة الفيديو يمكن ربطها عند توفر ملف العرض");
    });

    document.addEventListener("dragstart", (event) => {
      const item = event.target.closest("[data-operation]");
      if (item) event.dataTransfer.setData("text/plain", item.dataset.operation);
    });

    document.addEventListener("dragover", (event) => {
      if (event.target.closest("#or-list")) event.preventDefault();
    });

    document.addEventListener("drop", (event) => {
      const list = event.target.closest("#or-list");
      if (!list) return;
      event.preventDefault();
      addAudit("تمت إعادة ترتيب جدول العمليات، وأعيد حساب التعارضات محلياً.");
      toast("تم تحديث جدول العمليات");
      runAnalysis("أعد حساب تعارضات غرف العمليات بعد تعديل الجدول");
    });
  }

  function init() {
    document.documentElement.dataset.theme = localStorage.getItem("hospital-theme") || "light";
    renderScenarios();
    updateScenario(location.hash.replace("#", "") || state.scenarioId);
    updateCounter();
    bindEvents();
    addChatMessage("أنا جاهز لمراجعة إشغال الأسرة والطوارئ والكادر والإمداد. اختر سيناريو أو اكتب سؤال المدير.");
    window.setInterval(refreshSnapshot, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
