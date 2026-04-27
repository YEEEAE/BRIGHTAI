(function () {
  "use strict";

  const TAB_IDS = ["ops-kpis", "quality-decision", "report-reader", "department-case"];
  const MAX_INLINE_FILE_SIZE = 10 * 1024 * 1024;
  const SAFETY_NOTE = "تنبيه سلامة: هذه المخرجات لدعم التشغيل والجودة واتخاذ القرار الإداري، ولا تقدم تشخيصاً أو علاجاً نهائياً. عند وجود حالة طبية أو خطر على سلامة المريض يجب الرجوع إلى مختص وبروتوكولات المنشأة.";

  const byId = (id) => document.getElementById(id);

  const els = {
    tabs: Array.from(document.querySelectorAll(".tabs button")),
    sections: Object.fromEntries(TAB_IDS.map((id) => [id, byId(id)])),
    scenarioButtons: Array.from(document.querySelectorAll(".scenario-chip")),
    ops: {
      dept: byId("opsDept"),
      context: byId("opsContext"),
      scenario: byId("opsScenario"),
      status: byId("opsStatus"),
      output: byId("opsOutput"),
      analyze: byId("opsAnalyzeBtn"),
      clear: byId("opsClearBtn")
    },
    quality: {
      scope: byId("qualityScope"),
      context: byId("qualityContext"),
      status: byId("qualityStatus"),
      output: byId("qualityOutput"),
      analyze: byId("qualityAnalyzeBtn"),
      clear: byId("qualityClearBtn")
    },
    report: {
      type: byId("reportType"),
      text: byId("reportText"),
      drop: byId("reportDrop"),
      file: byId("reportFile"),
      status: byId("reportStatus"),
      output: byId("reportOutput"),
      analyze: byId("reportAnalyzeBtn"),
      clear: byId("reportClearBtn")
    },
    deptCase: {
      dept: byId("caseDept"),
      context: byId("caseContext"),
      goal: byId("caseGoal"),
      status: byId("caseStatus"),
      output: byId("caseOutput"),
      analyze: byId("caseAnalyzeBtn"),
      clear: byId("caseClearBtn")
    }
  };

  const HOSPITAL_OPS_SCHEMA = {
    type: "object",
    required: ["hospital_snapshot", "ops_kpis", "quality_risks", "capacity_forecast", "recommended_interventions", "executive_summary_ar", "clinical_safety_disclaimer_ar", "integration_plan", "next_action_ar", "whatsapp_summary_ar"],
    properties: {
      hospital_snapshot: {
        type: "object",
        required: ["department", "case_type", "operational_context_ar"],
        properties: {
          department: { type: "string" },
          case_type: { type: "string" },
          operational_context_ar: { type: "string" }
        }
      },
      ops_kpis: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            status: { type: "string" },
            value: { type: "string" },
            interpretation_ar: { type: "string" }
          }
        }
      },
      quality_risks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            risk: { type: "string" },
            severity: { type: "string" },
            evidence: { type: "string" },
            recommended_owner: { type: "string" }
          }
        }
      },
      capacity_forecast: {
        type: "object",
        required: ["next_24h_ar", "next_7d_ar", "confidence"],
        properties: {
          next_24h_ar: { type: "string" },
          next_7d_ar: { type: "string" },
          confidence: { type: "number" }
        }
      },
      recommended_interventions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { type: "string" },
            impact: { type: "string" },
            urgency: { type: "string" },
            owner: { type: "string" }
          }
        }
      },
      executive_summary_ar: { type: "string" },
      clinical_safety_disclaimer_ar: { type: "string" },
      integration_plan: {
        type: "object",
        required: ["his", "ehr", "bi_dashboard"],
        properties: {
          his: { type: "string" },
          ehr: { type: "string" },
          bi_dashboard: { type: "string" }
        }
      },
      next_action_ar: { type: "string" },
      whatsapp_summary_ar: { type: "string" }
    }
  };

  function getEngine() {
    if (!window.GeminiDemoEngine) {
      throw new Error("GeminiDemoEngine is not loaded");
    }
    if (!getEngine._instance) {
      getEngine._instance = new window.GeminiDemoEngine({
        demoId: "health",
        usageLimit: 10,
        timeoutMs: 20000
      });
    }
    return getEngine._instance;
  }

  function errorMessage(error) {
    return error?.message || "تعذر الاتصال بالخدمة حالياً.";
  }

  async function toInlineData(file) {
    if (!file) throw new Error("لم يتم اختيار ملف.");
    if (file.size > MAX_INLINE_FILE_SIZE) throw new Error("حجم الملف أكبر من 10MB. اختر ملفاً أصغر للتجربة.");
    if (!window.BrightAIDemoUtils?.fileToInlineData) {
      throw new Error("أداة تحويل الملف غير متاحة.");
    }
    return window.BrightAIDemoUtils.fileToInlineData(file);
  }

  function inferMimeType(file) {
    const name = String(file?.name || "").toLowerCase();
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".txt")) return "text/plain";
    if (name.endsWith(".doc")) return "application/msword";
    if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return file?.type || "application/octet-stream";
  }

  async function geminiPrompt(prompt, options = {}) {
    const engine = getEngine();
    const fileData = options.fileData || null;
    const result = await engine.generate({
      prompt,
      file: fileData,
      schema: HOSPITAL_OPS_SCHEMA,
      schemaName: "hospitalOpsDetailedSchema",
      domain: "health",
      temperature: 0.18,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_LOW_AND_ABOVE" }
      ]
    });
    if (!result) throw new Error("لم يتم الحصول على نتيجة من الخدمة.");
    return result;
  }

  function renderExecutiveBoard(data) {
    const normalized = normalizeHospitalOutput(data);
    return JSON.stringify(normalized, null, 2);
  }

  let selectedReportFile = null;

  const scenarioTemplates = {
    "ازدحام طوارئ": {
      dept: "الطوارئ",
      context: "ازدحام في الطوارئ خلال الوردية الحالية. إشغال الأسرّة 86%، متوسط الانتظار 74 دقيقة، 18 حالة فرز أصفر، عبء التمريض 1.32x، و7 تنبيهات جودة مرتبطة بالتوثيق وتأخر النقل للتنويم.",
      quality: "تأخر فرز بعض الحالات، شكاوى انتظار، واحتمال ارتفاع مخاطر سلامة المرضى عند استمرار الازدحام.",
      goal: "خفض الازدحام خلال الوردية الحالية مع حماية مؤشرات الجودة."
    },
    "ارتفاع وقت الانتظار": {
      dept: "العيادات الخارجية",
      context: "متوسط وقت الانتظار 92 دقيقة في العيادات، تأخر حضور بعض الأطباء، ضغط على التسجيل، وانخفاض معدل الالتزام بالمواعيد.",
      quality: "تزايد شكاوى تجربة المرضى وانخفاض الرضا في نقاط التسجيل والانتظار.",
      goal: "تقليل وقت الانتظار خلال اليوم وتحسين تجربة المرضى."
    },
    "نقص كوادر في قسم": {
      dept: "العناية المركزة",
      context: "نقص تمريض في العناية المركزة، نسبة المرضى لكل ممرض أعلى من المخطط، ضغط على المناوبة الليلية، وزيادة طلبات النقل الداخلي.",
      quality: "مخاطر إرهاق الكوادر وتأخر التوثيق والمتابعة التمريضية تحتاج مراجعة مسؤول التمريض والجودة.",
      goal: "إعادة توزيع الموارد دون خفض سلامة المرضى."
    },
    "انخفاض رضا المرضى": {
      dept: "العيادات الخارجية",
      context: "انخفاض رضا المرضى إلى 72%، شكاوى حول الانتظار والشرح قبل المغادرة، وتباين في زمن إغلاق البلاغات.",
      quality: "مؤشرات تجربة المرضى تحتاج تحليل سبب جذري وخطة متابعة أسبوعية.",
      goal: "رفع الرضا وتحسين نقاط الاحتكاك عالية الأثر."
    },
    "مؤشرات جودة تحتاج مراجعة": {
      dept: "التنويم",
      context: "ارتفاع مخاطر إعادة الدخول خلال 7 أيام إلى 21%، تنبيهات توثيق غير مكتمل، وتأخر في خطط الخروج لبعض المرضى.",
      quality: "مؤشرات إعادة الدخول وخطة الخروج تحتاج مراجعة جودة ومراجعة مختص للحالات الطبية ذات الصلة.",
      goal: "تقليل مخاطر إعادة الدخول وتحسين اكتمال خطة الخروج."
    }
  };

  function setStatus(el, message, type = "") {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("ok", "warn", "err");
    if (type) el.classList.add(type);
  }

  function setBusy(button, busy, busyLabel, idleLabel) {
    if (!button) return;
    button.disabled = busy;
    button.innerHTML = busy ? `${busyLabel} <span class="spinner" aria-hidden="true"></span>` : idleLabel;
  }

  function hospitalPrompt(payload) {
    return `أنت مستشار تشغيل وجودة مستشفيات في السعودية. حلل المدخلات كدعم قرار تشغيلي فقط.

القواعد:
- لا تقدم تشخيصاً أو علاجاً نهائياً.
- ركز على التشغيل والجودة والسعة ودعم القرار.
- أضف تنبيه مراجعة مختص عند أي حالة طبية.
- أعد JSON صالحاً يتبع الـ Schema المحدد.

المدخلات:
${JSON.stringify(payload, null, 2)}`;
  }

  function normalizeHospitalOutput(value) {
    return {
      hospital_snapshot: {
        department: value?.hospital_snapshot?.department || "غير محدد",
        case_type: value?.hospital_snapshot?.case_type || "تحليل تشغيلي",
        operational_context_ar: value?.hospital_snapshot?.operational_context_ar || "سياق تشغيلي يحتاج استكمال بيانات."
      },
      ops_kpis: Array.isArray(value?.ops_kpis) ? value.ops_kpis : [],
      quality_risks: Array.isArray(value?.quality_risks) ? value.quality_risks : [],
      capacity_forecast: {
        next_24h_ar: value?.capacity_forecast?.next_24h_ar || "توقع أولي يحتاج بيانات تاريخية.",
        next_7d_ar: value?.capacity_forecast?.next_7d_ar || "توقع أسبوعي يحتاج ربطاً بلوحة BI.",
        confidence: Number(value?.capacity_forecast?.confidence ?? 0.62)
      },
      recommended_interventions: Array.isArray(value?.recommended_interventions) ? value.recommended_interventions : [],
      executive_summary_ar: value?.executive_summary_ar || "ملخص تنفيذي غير مكتمل.",
      clinical_safety_disclaimer_ar: value?.clinical_safety_disclaimer_ar || SAFETY_NOTE,
      integration_plan: {
        his: value?.integration_plan?.his || "ربط بيانات التسجيل، التنويم، المواعيد، والأسرّة من HIS.",
        ehr: value?.integration_plan?.ehr || "قراءة سياق الحالة من EHR مع إخفاء البيانات الحساسة في التجربة.",
        bi_dashboard: value?.integration_plan?.bi_dashboard || "نشر مؤشرات تشغيل وجودة في لوحة BI للإدارة."
      },
      next_action_ar: value?.next_action_ar || "ابدأ بمراجعة المؤشرات الحرجة وتحديد مالك لكل تدخل.",
      whatsapp_summary_ar: value?.whatsapp_summary_ar || "ملخص واتساب يحتاج توليداً من البيانات."
    };
  }

  function fallbackOutput(error, payload) {
    const context = `${payload.context || payload.quality_context || payload.report_text || ""}`;
    const isCritical = /حرج|طوارئ|ازدحام|نقص|عدوى|إعادة الدخول|انتظار|سلامة/.test(context);
    return normalizeHospitalOutput({
      hospital_snapshot: {
        department: payload.department || payload.scope || "غير محدد",
        case_type: payload.case_type || payload.scenario || "تحليل تشغيلي",
        operational_context_ar: context || "لم يتم إدخال سياق كاف."
      },
      ops_kpis: [
        { name: "Bed Occupancy", status: isCritical ? "risk" : "watch", value: "86%", interpretation_ar: "الإشغال قريب من مستوى الضغط ويحتاج متابعة السعة." },
        { name: "Waiting Time", status: isCritical ? "critical" : "watch", value: "74 دقيقة", interpretation_ar: "وقت الانتظار يؤثر على تجربة المرضى وقد يزيد مخاطر التصعيد." },
        { name: "Readmission Risk", status: "watch", value: "21%", interpretation_ar: "المؤشر يحتاج مراجعة جودة وخطة خروج أدق." },
        { name: "Staff Load", status: "risk", value: "1.32x", interpretation_ar: "عبء الكوادر فوق الطبيعي ويحتاج إعادة توزيع مناوبات." },
        { name: "Quality Alerts", status: "risk", value: "7", interpretation_ar: "توجد تنبيهات جودة يجب إسنادها إلى مالك مسؤول." }
      ],
      quality_risks: [
        { risk: "تأخر الفرز أو الخدمة", severity: isCritical ? "high" : "medium", evidence: "مؤشرات الانتظار والضغط التشغيلي في المدخلات.", recommended_owner: "مدير التشغيل المناوب" },
        { risk: "تأثير محتمل على سلامة المرضى", severity: "medium", evidence: "وجود سياق طبي أو مؤشرات جودة تحتاج مراجعة.", recommended_owner: "مسؤول الجودة وسلامة المرضى" }
      ],
      capacity_forecast: {
        next_24h_ar: "قد يستمر الضغط خلال 24 ساعة إذا لم تتم إعادة توزيع الأسرة والكوادر.",
        next_7d_ar: "يلزم تحليل بيانات تاريخية ومواسم مراجعين لبناء توقع أسبوعي موثوق.",
        confidence: 0.66
      },
      recommended_interventions: [
        { action: "فتح مسار سريع للحالات منخفضة التعقيد وفق بروتوكول المنشأة.", impact: "high", urgency: "now", owner: "مدير الطوارئ" },
        { action: "إعادة توزيع التمريض بين نقاط الضغط لمدة الوردية الحالية.", impact: "medium", urgency: "today", owner: "مشرف التمريض" },
        { action: "مراجعة تنبيهات الجودة وإغلاق البلاغات عالية الشدة.", impact: "medium", urgency: "today", owner: "مسؤول الجودة" },
        { action: "ربط المؤشرات بلوحة BI يومية للإدارة التنفيذية.", impact: "high", urgency: "this_week", owner: "فريق التحول الرقمي" }
      ],
      executive_summary_ar: `تعذر الوصول إلى Gemini: ${errorMessage(error)}. تم عرض تحليل fallback تشغيلي مبسط لتوضيح شكل لوحة الإدارة التنفيذية.`,
      clinical_safety_disclaimer_ar: SAFETY_NOTE,
      integration_plan: {
        his: "ربط بيانات الأسرّة، التسجيل، الانتظار، والمواعيد من HIS.",
        ehr: "استخدام EHR كسياق فقط مع مراجعة مختص لأي حالة طبية.",
        bi_dashboard: "بناء لوحة Bed Occupancy وWaiting Time وReadmission Risk وStaff Load وQuality Alerts."
      },
      next_action_ar: "ابدأ بالمؤشر الأعلى خطورة وحدد مالكاً تنفيذياً وتوقيت متابعة.",
      whatsapp_summary_ar: "تنبيه تشغيلي: توجد مؤشرات ضغط تحتاج تدخل مدير التشغيل والجودة اليوم. راجع لوحة المؤشرات وحدد إجراءات الوردية."
    });
  }

  function wireDropZone(zone, input, onFile) {
    if (!zone || !input) return;
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.click();
      }
    });
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("drag");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("drag");
      const file = event.dataTransfer?.files?.[0];
      if (file) onFile(file);
    });
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) onFile(file);
    });
  }

  function activateTab(tab, updateHash) {
    if (!TAB_IDS.includes(tab)) return;
    els.tabs.forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    Object.entries(els.sections).forEach(([id, section]) => {
      if (section) section.hidden = id !== tab;
    });
    if (updateHash) history.replaceState(null, "", `#${tab}`);
  }

  function initTabs() {
    els.tabs.forEach((button) => {
      const tab = button.dataset.tab;
      button.setAttribute("aria-controls", tab);
      button.setAttribute("aria-selected", button.classList.contains("active") ? "true" : "false");
      button.addEventListener("click", () => activateTab(tab, true));
    });
    TAB_IDS.forEach((id) => {
      const section = els.sections[id];
      if (!section) return;
      section.setAttribute("role", "tabpanel");
      section.setAttribute("tabindex", "-1");
    });
    const hash = window.location.hash.replace("#", "");
    if (TAB_IDS.includes(hash)) activateTab(hash, false);
  }

  function applyScenario(name) {
    const template = scenarioTemplates[name];
    if (!template) return;
    els.scenarioButtons.forEach((button) => button.classList.toggle("active", button.dataset.scenario === name));
    if (els.ops.dept) els.ops.dept.value = template.dept;
    if (els.ops.context) els.ops.context.value = template.context;
    if (els.ops.scenario) els.ops.scenario.value = name;
    if (els.quality.context) els.quality.context.value = template.quality;
    if (els.deptCase.dept) els.deptCase.dept.value = template.dept;
    if (els.deptCase.context) els.deptCase.context.value = template.context;
    if (els.deptCase.goal) els.deptCase.goal.value = template.goal;
  }

  function initScenarios() {
    els.scenarioButtons.forEach((button) => {
      button.addEventListener("click", () => applyScenario(button.dataset.scenario));
    });
    applyScenario("ازدحام طوارئ");
  }

  async function runAnalysis(ui, payload, idleLabel) {
    setBusy(ui.analyze, true, "جاري إنشاء لوحة تنفيذية...", idleLabel);
    setStatus(ui.status, "جاري إرسال السياق عبر Gemini Structured Output...", "");
    ui.output.textContent = "جاري المعالجة...";
    try {
      const fileData = payload.file ? await toInlineData(payload.file) : null;
      const result = await geminiPrompt(hospitalPrompt(payload), { fileData });
      const json = normalizeHospitalOutput(result);
      setStatus(ui.status, "تم إنشاء لوحة الإدارة التنفيذية عبر Gemini Structured Output.", "ok");
      ui.output.textContent = renderExecutiveBoard(json);
    } catch (error) {
      console.error(error);
      setStatus(ui.status, "تعذر الاتصال. تم عرض نموذج تشغيلي محلي.", "err");
      ui.output.textContent = renderExecutiveBoard(fallbackOutput(error, payload));
    } finally {
      setBusy(ui.analyze, false, "", idleLabel);
    }
  }

  function initOpsTab() {
    const ui = els.ops;
    ui.analyze?.addEventListener("click", () => {
      const payload = {
        case_type: "مؤشرات تشغيل المستشفى",
        department: ui.dept.value,
        scenario: ui.scenario.value.trim(),
        context: ui.context.value.trim()
      };
      if (!payload.context) {
        setStatus(ui.status, "أدخل لقطة المؤشرات أو اختر سيناريو جاهزاً.", "warn");
        return;
      }
      runAnalysis(ui, payload, "حلل مؤشرات منشأتك");
    });
    ui.clear?.addEventListener("click", () => {
      ui.context.value = "";
      ui.scenario.value = "";
      ui.output.textContent = "سيتم عرض مخرجات Gemini التشغيلية هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function initQualityTab() {
    const ui = els.quality;
    ui.analyze?.addEventListener("click", () => {
      const payload = {
        case_type: "دعم قرار الجودة",
        scope: ui.scope.value,
        department: ui.scope.value,
        quality_context: ui.context.value.trim()
      };
      if (!payload.quality_context) {
        setStatus(ui.status, "أدخل مؤشرات الجودة أو اختر سيناريو جاهزاً.", "warn");
        return;
      }
      runAnalysis(ui, payload, "حلل مخاطر الجودة");
    });
    ui.clear?.addEventListener("click", () => {
      ui.context.value = "";
      ui.output.textContent = "سيتم عرض مخاطر الجودة والتدخلات هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function initReportTab() {
    const ui = els.report;
    wireDropZone(ui.drop, ui.file, (file) => {
      selectedReportFile = file;
      setStatus(ui.status, `تم رفع الملف: ${file.name} (${Math.round(file.size / 1024)} كيلوبايت)`, "ok");
    });
    ui.analyze?.addEventListener("click", () => {
      const payload = {
        case_type: "قراءة تقرير أو ملف طبي",
        department: ui.type.value,
        report_type: ui.type.value,
        report_text: ui.text.value.trim(),
        context: ui.text.value.trim(),
        file: selectedReportFile
      };
      if (!payload.report_text && !payload.file) {
        setStatus(ui.status, "الصق نص التقرير أو ارفع ملفاً.", "warn");
        return;
      }
      runAnalysis(ui, payload, "اقرأ التقرير تشغيلياً");
    });
    ui.clear?.addEventListener("click", () => {
      ui.text.value = "";
      ui.file.value = "";
      selectedReportFile = null;
      ui.output.textContent = "سيتم عرض ملخص التقرير والتنبيهات هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function initCaseTab() {
    const ui = els.deptCase;
    ui.analyze?.addEventListener("click", () => {
      const payload = {
        case_type: "تحليل حالة تشغيلية لقسم",
        department: ui.dept.value,
        context: ui.context.value.trim(),
        decision_goal: ui.goal.value.trim()
      };
      if (!payload.context) {
        setStatus(ui.status, "اكتب الحالة التشغيلية أو اختر سيناريو جاهزاً.", "warn");
        return;
      }
      runAnalysis(ui, payload, "حلل الحالة التشغيلية");
    });
    ui.clear?.addEventListener("click", () => {
      ui.context.value = "";
      ui.goal.value = "";
      ui.output.textContent = "سيتم عرض الخطة التشغيلية هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function initContactForm() {
    byId("contactBtn")?.addEventListener("click", () => {
      const name = byId("contactName")?.value.trim();
      const phone = byId("contactPhone")?.value.trim();
      const status = byId("contactStatus");
      if (!name || !phone) {
        setStatus(status, "الرجاء إدخال الاسم ورقم الجوال.", "warn");
        return;
      }
      if (!/^05\d{8}$/.test(phone.replace(/\s/g, ""))) {
        setStatus(status, "رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.", "warn");
        return;
      }
      setStatus(status, "تم استلام طلبك. سنتواصل معك لربط HIS أو إعداد لوحة المؤشرات.", "ok");
      ["contactName", "contactPhone", "contactEmail", "contactMsg"].forEach((id) => {
        const input = byId(id);
        if (input) input.value = "";
      });
    });
  }

  function initOutputFocus() {
    [els.ops.output, els.quality.output, els.report.output, els.deptCase.output].forEach((output) => {
      if (!output) return;
      const observer = new MutationObserver(() => {
        output.setAttribute("tabindex", "-1");
        output.focus({ preventScroll: true });
        window.setTimeout(() => output.removeAttribute("tabindex"), 200);
      });
      observer.observe(output, { childList: true, characterData: true, subtree: true });
    });
  }

  function boot() {
    if (!document.querySelector(".tabs")) return;
    initTabs();
    initScenarios();
    initOpsTab();
    initQualityTab();
    initReportTab();
    initCaseTab();
    initContactForm();
    initOutputFocus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
