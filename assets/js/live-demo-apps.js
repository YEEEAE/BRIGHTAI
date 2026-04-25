(function () {
  "use strict";

  const DEMOS = {
    health: {
      title: "تجربة تحليل الصور والبيانات الصحية بالذكاء الاصطناعي",
      intro: "ارفع صورة أو اكتب بيانات تشغيلية، واحصل على تقرير طبي/تشغيلي منظم مع تنويه واضح أنه تحليل تجريبي وليس تشخيصاً.",
      submitLabel: "حلّل النموذج الصحي",
      schema: true,
      file: { label: "صورة طبية أو تقرير PDF", accept: "image/*,.pdf" },
      fields: [
        { name: "mode", label: "نوع التحليل", type: "select", options: ["تحليل صورة طبية", "لوحة مؤشرات مستشفى", "استخراج سجل طبي"] },
        { name: "context", label: "السياق السريري أو التشغيلي", type: "textarea", placeholder: "مثال: مستشفى عام، 120 سريراً، 430 مريضاً يومياً، أو ملاحظات سريرية للصورة..." }
      ],
      prompt: (v) => `أنت مساعد طبي وتشغيلي متخصص في حلول Bright AI للقطاع الصحي السعودي.
نوع المهمة: ${v.mode}
السياق: ${v.context}
إذا كانت المهمة صورة طبية فحلل الصورة طبياً بشكل منظم، وإذا كانت مؤشرات مستشفى فاستخرج KPIs واختناقات وتوصيات ROI، وإذا كانت سجلاً طبياً فاستخرج بطاقة سجل.
أعد JSON عربي بالمفاتيح:
{
  "summary": ["..."],
  "kpis": [{"label":"...","value":"...","note":"..."}],
  "findings": ["..."],
  "impression": "...",
  "recommendations": ["..."],
  "confidence": "منخفض|متوسط|عالي",
  "structured_record": {"patient_name":"", "date":"", "symptoms":[], "diagnosis":"", "medications":[], "follow_up":""},
  "disclaimer": "هذا تحليل تجريبي من Bright AI Demo وليس بديلاً عن التشخيص الطبي المعتمد."
}`
    },
    interview: {
      title: "محاكي التوظيف الذكي وفرز السير الذاتية",
      intro: "ارفع سيرة أو ألصق نصها مع المسمى والمتطلبات لتحصل على أسئلة مقابلة، درجة ملاءمة، ونقاط قوة وضعف.",
      submitLabel: "حلّل المرشح",
      schema: true,
      file: { label: "سيرة ذاتية PDF أو صورة", accept: ".pdf,image/*" },
      fields: [
        { name: "position", label: "المسمى الوظيفي", type: "text", placeholder: "مثال: مدير مبيعات B2B" },
        { name: "requirements", label: "المتطلبات أو نص السيرة", type: "textarea", placeholder: "ألصق وصف الوظيفة أو ملخص السيرة الذاتية..." }
      ],
      prompt: (v) => `أنت خبير توظيف Senior في السعودية.
حلل السيرة أو النص المرفق وقارنها بالوصف الوظيفي:
- المسمى: ${v.position}
- المتطلبات والسياق: ${v.requirements}
أعد JSON:
{
  "match_score": 0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "interview_questions": [{"q": "...", "purpose": "..."}],
  "follow_up_questions": ["..."],
  "saudization_eligible": true,
  "recommended_action": "تقدم للمقابلة | استبعاد | احتياطي",
  "salary_range_estimate": "X-Y SAR"
}`
    },
    "smart-medical-archive": {
      title: "محرك البحث الدلالي واستخراج الوصفات الطبية",
      intro: "اسأل سؤالاً طبيعياً عن السجلات أو ارفع وصفة، وسيحوّل Bright AI السؤال إلى نتيجة منظمة قابلة للعرض.",
      submitLabel: "استخرج السجل",
      schema: true,
      file: { label: "صورة وصفة أو تقرير", accept: "image/*,.pdf" },
      fields: [
        { name: "query", label: "السؤال أو وصف المستند", type: "textarea", placeholder: "كم مريض سكري راجعنا الشهر الماضي؟ أو اكتب سياق الوصفة..." }
      ],
      prompt: (v) => `أنت محرك أرشيف طبي ذكي للمستشفيات السعودية.
السؤال أو المستند: ${v.query}
حوّل السؤال إلى استعلام منظم وولّد بيانات وهمية واقعية للعرض، أو استخرج بيانات وصفة طبية إذا وجدت صورة.
أعد JSON:
{
  "summary": ["..."],
  "structured_query": {"intent":"", "filters":[], "metric":""},
  "table": [{"field":"", "value":"", "note":""}],
  "chart": [{"label":"", "value":0}],
  "medications": [{"name":"", "dose":"", "frequency":"", "duration":"", "interaction_alert":""}],
  "recommendations": ["..."]
}`
    },
    tenders: {
      title: "تحليل كراسة مناقصة كامل خلال دقائق",
      intro: "ألصق نص كراسة الشروط أو ارفع PDF للحصول على ملخص تنفيذي، مخاطر مالية وقانونية، Checklist، وأسئلة استيضاح.",
      submitLabel: "حلّل المناقصة",
      schema: true,
      file: { label: "كراسة شروط PDF", accept: ".pdf,image/*" },
      fields: [
        { name: "tenderText", label: "نص المناقصة أو ملخصها", type: "textarea", placeholder: "ألصق البنود المهمة، نطاق العمل، تواريخ التقديم، والغرامات..." }
      ],
      prompt: (v) => `أنت محلل عقود ومناقصات Senior في السعودية، خبير في نظام المنافسات والمشتريات الحكومية.
حلل المستند أو النص التالي: ${v.tenderText}
أعد تقريراً منظماً بصيغة JSON:
{
  "executive_summary": ["نقطة 1", "نقطة 2"],
  "tender_value_estimate": "X-Y SAR",
  "submission_deadline": "...",
  "critical_terms": [{"term": "...", "page": "...", "risk_level": "high|medium|low"}],
  "financial_risks": ["..."],
  "legal_risks": ["..."],
  "compliance_requirements": ["..."],
  "checklist": ["..."],
  "recommended_questions": ["..."],
  "go_no_go_recommendation": "تقديم | عدم التقديم | تقديم مشروط",
  "competitive_advantages_needed": ["..."],
  "disclaimer": "هذا تحليل تجريبي. القرار النهائي للجنة المختصة."
}`
    },
    "ai-scolecs": {
      title: "المنصة التعليمية الذكية: خطط، تصحيح، ومساعد طالب",
      intro: "أنشئ خطة درس أو صحح إجابات أو جرّب مساعداً تعليمياً سقراطياً باللغة العربية أو الإنجليزية.",
      submitLabel: "ولّد التجربة التعليمية",
      schema: true,
      fields: [
        { name: "mode", label: "نوع التجربة", type: "select", options: ["مولّد خطة درسية", "مصحح إجابات", "مساعد طالب سقراطي"] },
        { name: "stage", label: "المرحلة والمادة", type: "text", placeholder: "مثال: ثالث متوسط - رياضيات" },
        { name: "topic", label: "الموضوع أو السؤال والإجابات", type: "textarea", placeholder: "اكتب الموضوع وعدد الحصص أو ألصق إجابات الطلاب..." }
      ],
      prompt: (v) => `أنت خبير تعليم رقمي في السعودية.
نوع التجربة: ${v.mode}
المرحلة والمادة: ${v.stage}
الموضوع أو الإجابات: ${v.topic}
أعد JSON:
{
  "objectives": ["..."],
  "activities": ["..."],
  "assessment": ["..."],
  "homework": ["..."],
  "student_feedback": [{"student":"", "score":"", "comment":""}],
  "socratic_response": ["..."],
  "recommendations": ["..."]
}`
    },
    brightproject: {
      title: "BrightProject: مدير المشاريع الذكي",
      intro: "صف مشروعك وسيولّد النظام WBS، مخطط زمني مبدئي، مخاطر، ميزانية، وأدوار RACI مع قفل جزئي للنسخة الكاملة.",
      submitLabel: "خطّط المشروع",
      schema: true,
      fields: [
        { name: "project", label: "وصف المشروع", type: "textarea", placeholder: "مثال: إطلاق منصة تجارة إلكترونية خلال 12 أسبوعاً لفريق من 8 أشخاص..." }
      ],
      prompt: (v) => `أنت مدير مشاريع Senior.
وصف المشروع: ${v.project}
أعد JSON:
{
  "executive_summary": ["..."],
  "wbs": [{"phase":"", "tasks":["..."]}],
  "gantt": [{"task":"", "start_week":1, "duration_weeks":2}],
  "budget_estimate": "X-Y SAR",
  "duration_estimate": "...",
  "risks": [{"risk":"", "level":"high|medium|low", "response":""}],
  "raci": [{"role":"", "responsibility":""}],
  "locked_full_plan_note": "اعرض جزءاً من الخطة والباقي خلف الاشتراك الشهري."
}`
    },
    brightsales: {
      title: "BrightSales: رسائل مبيعات وحاسبة ROI",
      intro: "أدخل العميل والشركة والمنتج لتحصل على رسائل واتساب وإيميل وLinkedIn مع تقدير عائد الأتمتة.",
      submitLabel: "ولّد رسائل البيع",
      schema: true,
      fields: [
        { name: "lead", label: "اسم العميل المحتمل وشركته", type: "text", placeholder: "مثال: أحمد من شركة نمو التجارية" },
        { name: "product", label: "المنتج والبيانات المالية", type: "textarea", placeholder: "مثال: أتمتة خدمة العملاء، 1200 محادثة شهرياً، تكلفة الموظف..." }
      ],
      prompt: (v) => `أنت مستشار مبيعات B2B في السعودية.
العميل: ${v.lead}
المنتج والبيانات: ${v.product}
أعد JSON:
{
  "messages": [{"channel":"WhatsApp|Email|LinkedIn", "message":"..."}],
  "roi": {"expected_saving":"", "payback_period":"", "roas_or_roi":"", "assumptions":["..."]},
  "follow_up_plan": ["..."]
}`
    },
    brightsupport: {
      title: "BrightSupport: بناء بوت دعم في 60 ثانية",
      intro: "ألصق رابط موقعك أو وصف خدماتك لتحصل على FAQ، Flow، وردود واتساب، مع محادثة تجريبية على نفس البيانات.",
      submitLabel: "ابنِ بوت الدعم",
      schema: true,
      fields: [
        { name: "business", label: "رابط الموقع أو وصف الخدمات", type: "textarea", placeholder: "اكتب خدماتك، سياساتك، وأكثر الأسئلة المتكررة..." }
      ],
      prompt: (v) => `أنت مصمم بوت خدمة عملاء للشركات السعودية.
بيانات النشاط: ${v.business}
أعد JSON:
{
  "faqs": [{"q":"", "a":""}],
  "flow": [{"step":"", "action":""}],
  "whatsapp_templates": ["..."],
  "demo_chat": [{"user":"", "bot":""}],
  "handoff_rules": ["..."]
}`
    },
    ocr: {
      title: "OCR عربي متقدم بـ Gemini Vision",
      intro: "ارفع فاتورة أو عقداً أو هوية، وسيستخرج النظام النص العربي ويهيكله حسب نوع المستند.",
      submitLabel: "استخرج النص",
      schema: true,
      file: { label: "صورة المستند", accept: "image/*,.pdf" },
      fields: [
        { name: "docType", label: "نوع المستند المتوقع", type: "select", options: ["فاتورة", "عقد", "هوية", "مستند عام"] },
        { name: "notes", label: "ملاحظات إضافية", type: "textarea", placeholder: "مثال: ركّز على البنود المالية أو رقم الهوية..." }
      ],
      prompt: (v) => `أنت محرك OCR عربي دقيق.
نوع المستند: ${v.docType}
ملاحظات: ${v.notes}
استخرج النص وهيكله. أعد JSON:
{
  "document_type": "",
  "extracted_text": "",
  "fields": [{"name":"", "value":"", "confidence":"low|medium|high"}],
  "tables": [{"columns":[], "rows":[]}],
  "warnings": ["..."]
}`
    },
    "data-analyzer": {
      title: "محلل البيانات الذكي",
      intro: "ارفع CSV/Excel أو ألصق بياناتك وسيقترح Gemini أنماطاً وشذوذاً ورسومات ورؤى أعمال وتنبؤات.",
      submitLabel: "حلّل البيانات",
      schema: true,
      file: { label: "ملف CSV أو Excel", accept: ".csv,.xlsx,.xls" },
      fields: [
        { name: "data", label: "بيانات أو وصف الأعمدة", type: "textarea", placeholder: "ألصق عينة CSV أو صف الأعمدة ومصدر البيانات..." }
      ],
      prompt: (v) => `أنت محلل بيانات أعمال.
البيانات: ${v.data}
أعد JSON:
{
  "patterns": ["..."],
  "anomalies": ["..."],
  "recommended_charts": [{"title":"", "type":"bar|line|pie", "reason":""}],
  "business_insights": ["..."],
  "forecast_next_month": [{"metric":"", "value":"", "confidence":"low|medium|high"}],
  "chart": [{"label":"", "value":0}]
}`
    },
    ecommerce: {
      title: "مولّد حملة إعلانية كاملة",
      intro: "أدخل المنتج والجمهور والميزانية لتحصل على رسائل إعلانية، استراتيجية قنوات، CAC/ROAS، وجدول نشر شهري.",
      submitLabel: "ولّد الحملة",
      schema: true,
      fields: [
        { name: "product", label: "المنتج", type: "text", placeholder: "مثال: عطور سعودية فاخرة" },
        { name: "audience", label: "الجمهور والميزانية", type: "textarea", placeholder: "مثال: نساء 25-40 في الرياض وجدة، ميزانية 15000 ريال..." }
      ],
      prompt: (v) => `أنت استراتيجي تسويق رقمي للسوق السعودي.
المنتج: ${v.product}
الجمهور والميزانية: ${v.audience}
أعد JSON:
{
  "ad_messages": ["..."],
  "channel_strategy": [{"channel":"Meta|Google|TikTok", "budget_share":"", "reason":""}],
  "cac_estimate": "",
  "roas_estimate": "",
  "monthly_calendar": [{"week":"", "content":"", "goal":""}]
}`
    },
    manufacturing: {
      title: "محسّن المخزون وسلسلة التوريد",
      intro: "أدخل المنتجات والمبيعات وLead Time لتحصل على ROP وEOQ وتنبؤ الطلب وتنبيهات نفاد المخزون.",
      submitLabel: "حسّن المخزون",
      schema: true,
      fields: [
        { name: "inventory", label: "قائمة المنتجات والطلب", type: "textarea", placeholder: "مثال: منتج A، مبيعات 400 شهرياً، Lead Time 14 يوم، تكلفة طلب..." }
      ],
      prompt: (v) => `أنت خبير سلسلة توريد ومخزون.
البيانات: ${v.inventory}
أعد JSON:
{
  "items": [{"product":"", "rop":"", "eoq":"", "stockout_alert":"", "note":""}],
  "demand_forecast_3_months": [{"month":"", "demand":0}],
  "risks": ["..."],
  "recommendations": ["..."],
  "chart": [{"label":"", "value":0}]
}`
    }
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function getCurrentDemoId() {
    const currentScript = document.currentScript;
    if (currentScript?.dataset.demo) return currentScript.dataset.demo;
    const path = location.pathname.toLowerCase();
    if (path.includes("/health/")) return "health";
    if (path.includes("/interview/")) return "interview";
    if (path.includes("/smart-medical-archive/")) return "smart-medical-archive";
    if (path.includes("/tenders/")) return "tenders";
    if (path.includes("/ai-scolecs/")) return "ai-scolecs";
    if (path.includes("/brightproject/")) return "brightproject";
    if (path.includes("/brightsales/")) return "brightsales";
    if (path.includes("/brightsupport/")) return "brightsupport";
    if (path.includes("/demo/")) return "ocr";
    if (path.includes("/try/data-analyzer/")) return "data-analyzer";
    if (path.includes("/sectors/ecommerce")) return "ecommerce";
    if (path.includes("/sectors/manufacturing")) return "manufacturing";
    return "";
  }

  function fieldMarkup(field) {
    if (field.type === "select") {
      return `<div class="bai-demo-field"><label for="bai-${field.name}">${escapeHtml(field.label)}</label><select id="bai-${field.name}" name="${escapeHtml(field.name)}">${field.options.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}</select></div>`;
    }
    if (field.type === "textarea") {
      return `<div class="bai-demo-field"><label for="bai-${field.name}">${escapeHtml(field.label)}</label><textarea id="bai-${field.name}" name="${escapeHtml(field.name)}" placeholder="${escapeHtml(field.placeholder || "")}"></textarea></div>`;
    }
    return `<div class="bai-demo-field"><label for="bai-${field.name}">${escapeHtml(field.label)}</label><input id="bai-${field.name}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type || "text")}" placeholder="${escapeHtml(field.placeholder || "")}"></div>`;
  }

  function renderShell(demoId, config, engine) {
    const section = document.createElement("section");
    section.className = "bai-live-demo";
    section.id = "live-ai-demo";
    section.setAttribute("aria-labelledby", "live-ai-demo-title");
    section.innerHTML = `
      <div class="bai-demo-head">
        <div>
          <span class="bai-demo-eyebrow">تجربة حية مع Gemini 2.5 Flash</span>
          <h2 id="live-ai-demo-title">${escapeHtml(config.title)}</h2>
          <p>${escapeHtml(config.intro)}</p>
        </div>
        <span class="bai-demo-limit" data-demo-limit>متبقي ${engine.getRemainingUses()} من 3 محاولات</span>
      </div>
      <div class="bai-demo-grid">
        <form class="bai-demo-form" data-demo-form>
          <div class="bai-demo-fields">
            ${(config.file ? `<div class="bai-demo-field"><label for="bai-file">${escapeHtml(config.file.label)}</label><input id="bai-file" name="file" type="file" accept="${escapeHtml(config.file.accept)}"></div>` : "")}
            ${config.fields.map(fieldMarkup).join("")}
          </div>
          <div class="bai-demo-actions">
            <button class="bai-demo-btn bai-demo-btn-primary" type="submit">${escapeHtml(config.submitLabel)}</button>
            <a class="bai-demo-btn bai-demo-btn-whatsapp" data-demo-cta href="${engine.createWhatsAppUrl(config.title)}" target="_blank" rel="noopener">أعجبتك التجربة؟ اطلب التطبيق الكامل</a>
          </div>
        </form>
        <div class="bai-demo-output" data-demo-output>
          <div class="bai-demo-empty">ابدأ بإدخال بيانات بسيطة. ستظهر هنا نتيجة منظمة بعلامة Bright AI Demo، ويمكنك تنزيل JSON أو طباعة التقرير كـ PDF من المتصفح.</div>
        </div>
      </div>
    `;
    return section;
  }

  function collectValues(form) {
    const values = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.type === "file") return;
      values[el.name] = el.value.trim();
    });
    return values;
  }

  function loadingMarkup() {
    return `<div class="bai-demo-loading" aria-live="polite"><div class="bai-demo-spinner"></div><strong>جارٍ توليد التقرير خلال ثوانٍ...</strong><span class="bai-demo-skeleton"></span><span class="bai-demo-skeleton"></span><span class="bai-demo-skeleton" style="width:70%"></span></div>`;
  }

  function renderValue(value) {
    if (Array.isArray(value)) {
      if (value.length && typeof value[0] === "object") return renderTable(value);
      return `<ul>${value.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }
    if (value && typeof value === "object") {
      return renderTable(Object.entries(value).map(([field, item]) => ({ field, value: Array.isArray(item) ? item.join("، ") : item })));
    }
    return `<p>${escapeHtml(value || "غير محدد")}</p>`;
  }

  function renderTable(rows) {
    const keys = Array.from(rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()));
    if (!keys.length) return "";
    return `<div class="bai-demo-table-wrap"><table class="bai-demo-table"><thead><tr>${keys.map((key) => `<th>${escapeHtml(key)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${keys.map((key) => `<td>${formatCell(row?.[key])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function formatCell(value) {
    if (Array.isArray(value)) return escapeHtml(value.join("، "));
    if (value && typeof value === "object") return escapeHtml(JSON.stringify(value));
    if (String(value).match(/^(high|medium|low)$/i)) {
      const cls = String(value).toLowerCase();
      const label = cls === "high" ? "عالي" : cls === "medium" ? "متوسط" : "منخفض";
      return `<span class="bai-demo-badge ${cls}">${label}</span>`;
    }
    return escapeHtml(value ?? "");
  }

  function renderKpis(data) {
    const kpis = data.kpis || data.forecast_next_month || [];
    if (!Array.isArray(kpis) || !kpis.length) return "";
    return `<div class="bai-demo-kpis">${kpis.slice(0, 3).map((item) => `<div class="bai-demo-kpi"><span>${escapeHtml(item.label || item.metric || "مؤشر")}</span><strong>${escapeHtml(item.value || item.score || "")}</strong><small>${escapeHtml(item.note || item.confidence || "")}</small></div>`).join("")}</div>`;
  }

  function renderReport(demoId, data, engine) {
    const title = data.title || data.document_type || data.go_no_go_recommendation || "تقرير Bright AI Demo";
    const hidden = new Set(["title", "chart", "kpis"]);
    const sections = Object.entries(data || {})
      .filter(([key, value]) => !hidden.has(key) && value !== null && value !== undefined && value !== "")
      .map(([key, value]) => `<section class="bai-demo-report-section"><h4>${escapeHtml(labelFor(key))}</h4>${renderValue(value)}</section>`)
      .join("");
    const html = `<div class="bai-demo-report"><h3>${escapeHtml(title)}</h3>${renderKpis(data)}${renderChart(data.chart)}${sections}<div class="bai-demo-watermark">تم الإنشاء بواسطة Bright AI Demo - ${new Date().toLocaleDateString("ar-SA")} | brightai.site | +966 53 822 9013</div><div class="bai-demo-actions"><button class="bai-demo-btn bai-demo-btn-soft" type="button" data-download-json>تنزيل JSON</button><button class="bai-demo-btn bai-demo-btn-soft" type="button" data-print-report>طباعة / PDF</button><a class="bai-demo-btn bai-demo-btn-whatsapp" href="${engine.createWhatsAppUrl(title)}" target="_blank" rel="noopener" data-demo-whatsapp>اطلب التطبيق الكامل في شركتك</a></div></div>`;
    return html;
  }

  function renderChart(chart) {
    if (!Array.isArray(chart) || !chart.length) return "";
    const values = chart.map((item) => Number(item.value || item.demand || 0));
    const max = Math.max(...values, 1);
    return `<section class="bai-demo-report-section"><h4>تصور بياني سريع</h4><div class="bai-demo-chart"><div class="bai-demo-bars">${chart.slice(0, 8).map((item) => {
      const value = Number(item.value || item.demand || 0);
      const width = Math.max(6, Math.round((value / max) * 100));
      return `<div class="bai-demo-bar"><span>${escapeHtml(item.label || item.month || item.metric || "مؤشر")}</span><span class="bai-demo-bar-track"><span class="bai-demo-bar-fill" style="width:${width}%"></span></span><strong>${escapeHtml(value)}</strong></div>`;
    }).join("")}</div></div></section>`;
  }

  function labelFor(key) {
    const labels = {
      executive_summary: "ملخص تنفيذي",
      summary: "الملخص",
      findings: "النتائج الملاحظة",
      impression: "الانطباع",
      recommendations: "التوصيات",
      confidence: "مستوى الثقة",
      structured_record: "بطاقة السجل",
      critical_terms: "الشروط الجوهرية",
      financial_risks: "المخاطر المالية",
      legal_risks: "المخاطر القانونية",
      compliance_requirements: "متطلبات الامتثال",
      checklist: "Checklist التقديم",
      recommended_questions: "أسئلة الاستيضاح",
      competitive_advantages_needed: "المزايا المطلوبة",
      interview_questions: "أسئلة المقابلة",
      follow_up_questions: "أسئلة متابعة",
      strengths: "نقاط القوة",
      weaknesses: "نقاط الضعف",
      messages: "رسائل المبيعات",
      roi: "حاسبة ROI",
      monthly_calendar: "تقويم النشر",
      items: "تحليل المنتجات",
      demand_forecast_3_months: "توقع الطلب لثلاثة أشهر"
    };
    return labels[key] || key.replace(/_/g, " ");
  }

  function attachHandlers(section, demoId, config, engine) {
    const form = section.querySelector("[data-demo-form]");
    const output = section.querySelector("[data-demo-output]");
    const limit = section.querySelector("[data-demo-limit]");
    const cta = section.querySelector("[data-demo-cta]");

    cta.addEventListener("click", () => engine.trackUsage("demo_to_whatsapp"));
    engine.trackUsage("demo_started");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      output.innerHTML = loadingMarkup();
      const values = collectValues(form);
      const fileInput = form.querySelector("input[type='file']");
      const file = fileInput?.files?.[0] ? await window.BrightAIDemoUtils.fileToInlineData(fileInput.files[0]) : null;
      const result = await engine.generate({
        prompt: config.prompt(values),
        file,
        schema: config.schema,
        temperature: config.temperature || 0.35
      });
      limit.textContent = `متبقي ${engine.getRemainingUses()} من 3 محاولات`;
      if (!result) {
        output.innerHTML = `<div class="bai-demo-error">تعذر توليد النتيجة الآن. جرّب تقليل حجم الملف أو إعادة المحاولة، ويمكنك التواصل معنا لتفعيل النسخة الكاملة داخل شركتك.</div>`;
        return;
      }
      output.innerHTML = renderReport(demoId, result, engine);
      output.querySelector("[data-download-json]")?.addEventListener("click", () => {
        window.BrightAIDemoUtils.downloadText(`brightai-${demoId}-demo.json`, JSON.stringify(result, null, 2), "application/json;charset=utf-8");
      });
      output.querySelector("[data-print-report]")?.addEventListener("click", () => {
        window.BrightAIDemoUtils.printReport(`Bright AI Demo - ${demoId}`, output.querySelector(".bai-demo-report").innerHTML);
      });
      output.querySelector("[data-demo-whatsapp]")?.addEventListener("click", () => engine.trackUsage("demo_to_whatsapp"));
    });
  }

  function mount() {
    const demoId = getCurrentDemoId();
    const config = DEMOS[demoId];
    if (!config || document.getElementById("live-ai-demo")) return;
    const engine = new window.GeminiDemoEngine({ demoId });
    const section = renderShell(demoId, config, engine);
    const target = document.querySelector("main") || document.body;
    const anchor = target.querySelector("section:nth-of-type(2)") || target.firstElementChild;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor.nextSibling);
    } else {
      target.appendChild(section);
    }
    attachHandlers(section, demoId, config, engine);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
