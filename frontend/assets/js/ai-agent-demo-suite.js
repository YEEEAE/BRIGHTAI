(() => {
  "use strict";

  const endpoint = "/api/ai/chat/completions";
  const locale = "ar-SA";

  const resultSchema = {
    type: "object",
    required: [
      "executiveSummary",
      "scoreCard",
      "insights",
      "actionPlan",
      "workflow",
      "table",
      "timeline",
      "cta"
    ],
    properties: {
      executiveSummary: {
        type: "object",
        properties: {
          headline: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
          disclaimer: { type: "string" }
        }
      },
      scoreCard: {
        type: "object",
        properties: {
          score: { type: "number" },
          label: { type: "string" },
          metrics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                note: { type: "string" }
              }
            }
          }
        }
      },
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            detail: { type: "string" },
            priority: { type: "string" }
          }
        }
      },
      actionPlan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { type: "string" },
            owner: { type: "string" },
            impact: { type: "string" }
          }
        }
      },
      workflow: {
        type: "array",
        items: {
          type: "object",
          properties: {
            step: { type: "string" },
            input: { type: "string" },
            output: { type: "string" },
            review: { type: "string" }
          }
        }
      },
      table: {
        type: "object",
        properties: {
          headers: { type: "array", items: { type: "string" } },
          rows: { type: "array", items: { type: "array", items: { type: "string" } } }
        }
      },
      timeline: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phase: { type: "string" },
            duration: { type: "string" },
            deliverable: { type: "string" }
          }
        }
      },
      cta: {
        type: "object",
        properties: {
          headline: { type: "string" },
          primary: { type: "string" },
          secondary: { type: "string" },
          whatsapp: { type: "string" }
        }
      }
    }
  };

  const commonLoadingSteps = [
    "فهم سياق المنشأة",
    "تحليل المدخلات",
    "تقييم الجاهزية والمخاطر",
    "بناء التقرير التنفيذي"
  ];

  const configs = {
    "custom-ai-agent": {
      agentType: "custom-ai-agent",
      title: "وكيل ذكاء اصطناعي مخصص",
      description: "يصمم وكيلاً يعمل بنبرة الشركة، يعتمد على سياساتها، ويحوّل المهام المتكررة إلى مسارات تشغيل قابلة للربط.",
      sampleData: {
        companyName: "شركة المتقدمة للحلول التقنية",
        sector: "تقنية",
        agentRole: "خدمة عملاء",
        brandVoice: "رسمية",
        topTasks: "الرد على استفسارات العملاء\nشرح الباقات والأسعار\nتصعيد طلبات الدعم المتقدمة",
        policyExample: "سياسة الاسترجاع: يمكن للعميل استرجاع المنتج خلال 14 يوماً من الشراء مع إرفاق الفاتورة الأصلية. المنتجات المخصصة لا تقبل الاسترجاع.",
        channel: "موقع"
      },
      inputFields: ["companyName", "sector", "agentRole", "brandVoice", "topTasks", "policyExample", "channel"],
      schemaName: "custom_ai_agent_demo_report",
      loadingSteps: commonLoadingSteps,
      resultSections: ["executiveSummary", "scoreCard", "insights", "workflow", "actionPlan", "timeline", "cta"],
      fallbackResult: makeFallback("وكيل الشركة المخصص", 82, [
        "ابدأ بقاعدة معرفة صغيرة للسياسات والأسئلة المتكررة.",
        "اجعل التصعيد البشري إلزامياً للحالات الحساسة.",
        "اربط الوكيل بواتساب أو البوابة الداخلية بعد اختبار النبرة."
      ]),
      ctaConfig: {
        primaryHref: "/contact/",
        secondaryHref: "/services/custom-ai-agent.html",
        primaryText: "احجز ديمو مخصص",
        secondaryText: "راجع صفحة الخدمة"
      },
      whatsappSummaryTemplate: (data) => `أريد وكيل ذكاء اصطناعي مخصص. الشركة: ${data.companyName || "غير محددة"}، الدور: ${data.agentRole || "غير محدد"}، القناة: ${data.channel || "غير محددة"}.`
    },
    "competitor-analysis-agent": {
      agentType: "competitor-analysis-agent",
      title: "وكيل تحليل المنافسين",
      description: "يحوّل بيانات السوق العامة والمصرح بها إلى مقارنة تنفيذية، فجوات فرص، وخطة تحرك دون استخدام بيانات خاصة أو scraping مخالف.",
      sampleData: {
        companyName: "عيادة النور الطبية",
        sector: "عيادات طبية",
        city: "الرياض",
        competitors: "عيادة الصحة\nمركز الشفاء\nعيادة الأمل",
        competitorUrls: "https://example-clinic.sa\nhttps://example-shifa.sa",
        analysisGoal: "تحليل شامل",
        reportLevel: "تنفيذي"
      },
      inputFields: ["companyName", "sector", "city", "competitors", "competitorUrls", "analysisGoal", "reportLevel"],
      schemaName: "competitor_analysis_agent_demo_report",
      loadingSteps: ["تنظيف أسماء المنافسين", "مقارنة الرسائل والعروض", "استخراج فجوات السوق", "ترتيب التحركات الاستراتيجية"],
      resultSections: ["executiveSummary", "scoreCard", "table", "insights", "actionPlan", "timeline", "cta"],
      fallbackResult: makeFallback("تحليل المنافسين", 74, [
        "الفجوة الأكبر غالباً في وضوح الرسالة والعرض المحلي.",
        "راجع صفحات المنافسين العامة قبل اتخاذ قرار تسعيري.",
        "ابدأ بتحسين صفحة خدمة واحدة ورسالة إعلانية واحدة."
      ]),
      ctaConfig: {
        primaryHref: "/contact/",
        secondaryHref: "/services/competitor-analysis-agent.html",
        primaryText: "اطلب تحليل منافسين كامل",
        secondaryText: "راجع صفحة الخدمة"
      },
      whatsappSummaryTemplate: (data) => `أريد تحليل منافسين. شركتي: ${data.companyName || "غير محددة"}، السوق: ${data.city || "السعودية"}، المنافسون: ${data.competitors || "غير محددين"}.`
    },
    "seo-ai-agent": {
      agentType: "seo-ai-agent",
      title: "وكيل SEO ذكي",
      description: "ينتج خطة SEO للسوق السعودي تشمل الكلمات، هيكل الصفحة، الإصلاحات التقنية، الروابط الداخلية، والمحتوى دون وعود ترتيب مضمونة.",
      sampleData: {
        siteUrl: "شركة تقنية في الرياض تقدم حلول ذكاء اصطناعي للشركات",
        sector: "تقنية",
        city: "الرياض",
        mainService: "حلول ذكاء اصطناعي للشركات",
        audience: "شركات متوسطة وكبيرة في السعودية",
        competitors: "شركة تقنية منافسة 1\nشركة AI منافسة 2",
        seoGoal: "عملاء محتملين"
      },
      inputFields: ["siteUrl", "sector", "city", "mainService", "audience", "competitors", "seoGoal"],
      schemaName: "seo_ai_agent_demo_report",
      loadingSteps: ["فهم نية البحث", "تقييم الصفحة والكلمات", "اقتراح بنية المحتوى", "ترتيب إصلاحات SEO التقنية"],
      resultSections: ["executiveSummary", "scoreCard", "insights", "table", "actionPlan", "timeline", "cta"],
      fallbackResult: makeFallback("خطة SEO", 86, [
        "أنشئ صفحة خدمة محلية واضحة قبل توسيع المدونة.",
        "اربط صفحات الخدمات بمقالات داعمة وروابط داخلية وصفية.",
        "تجنب الوعود المضمونة وركز على تحسين قابلية الفهرسة."
      ]),
      ctaConfig: {
        primaryHref: "/contact/",
        secondaryHref: "/services/seo-ai-agent.html",
        primaryText: "اطلب خطة SEO مخصصة",
        secondaryText: "راجع صفحة الخدمة"
      },
      whatsappSummaryTemplate: (data) => `أريد خطة SEO. الموقع أو النشاط: ${data.siteUrl || "غير محدد"}، المدينة: ${data.city || "السعودية"}، الخدمة: ${data.mainService || "غير محددة"}.`
    },
    "marketing-ai-agent": {
      agentType: "marketing-ai-agent",
      title: "وكيل التسويق الذكي",
      description: "يبني حملة تسويقية قابلة للقياس تشمل الجمهور، القنوات، الرسائل، التقويم، وقياس الأداء مع احترام الموافقات وسياسات المنصات.",
      sampleData: {
        businessType: "عيادة",
        product: "تبييض الأسنان",
        audience: "نساء 25-45 سنة يبحثن عن تجميل الأسنان",
        city: "جدة",
        goal: "مبيعات",
        budget: "15,000 - 50,000 ريال",
        channels: "Instagram, Google Ads, WhatsApp",
        brandVoice: "ودية"
      },
      inputFields: ["businessType", "product", "audience", "city", "goal", "budget", "channels", "brandVoice"],
      schemaName: "marketing_ai_agent_demo_report",
      loadingSteps: ["تحديد الجمهور", "توزيع القنوات", "صياغة الرسائل", "بناء خطة القياس"],
      resultSections: ["executiveSummary", "scoreCard", "insights", "table", "actionPlan", "timeline", "cta"],
      fallbackResult: makeFallback("خطة الحملة", 83, [
        "ابدأ بقناتين فقط حتى تثبت الرسالة والتحويل.",
        "اجعل واتساب قناة متابعة لا قناة إزعاج.",
        "اربط كل رسالة بمؤشر قياس واضح مثل الحجز أو الطلب."
      ]),
      ctaConfig: {
        primaryHref: "/contact/",
        secondaryHref: "/services/marketing-ai-agent.html",
        primaryText: "اطلب حملة مخصصة",
        secondaryText: "راجع صفحة الخدمة"
      },
      whatsappSummaryTemplate: (data) => `أريد حملة تسويقية. النشاط: ${data.businessType || "غير محدد"}، المنتج: ${data.product || "غير محدد"}، المدينة: ${data.city || "غير محددة"}، الميزانية: ${data.budget || "غير محددة"}.`
    },
    "opportunity-discovery-agent": {
      agentType: "opportunity-discovery-agent",
      title: "وكيل اكتشاف الفرص والعملاء",
      description: "ينتج ICP ونموذج Lead Scoring وتسلسل متابعة مبيعات اعتماداً على إشارات فرص مشروعة وقابلة للإدخال في CRM.",
      sampleData: {
        companyType: "شركة تقنية",
        serviceSold: "حلول ذكاء اصطناعي للشركات في السعودية",
        idealCustomer: "شركات متوسطة في قطاعات العيادات، التعليم، والتجارة الإلكترونية تحتاج أتمتة عملياتها وتحسين تجربة عملائها",
        citySector: "الرياض",
        avgDealSize: "50,000 - 200,000",
        salesCycle: "متوسطة (1-3 أشهر)",
        currentSources: "نماذج الموقع، إحالات، معارض",
        monthlyGoal: "10 عملاء مؤهلين شهرياً"
      },
      inputFields: ["companyType", "serviceSold", "idealCustomer", "citySector", "avgDealSize", "salesCycle", "currentSources", "monthlyGoal"],
      schemaName: "opportunity_discovery_agent_demo_report",
      loadingSteps: ["تعريف العميل المثالي", "تحليل إشارات الفرصة", "بناء Lead Score", "تجهيز تسلسل المتابعة"],
      resultSections: ["executiveSummary", "scoreCard", "insights", "table", "workflow", "actionPlan", "cta"],
      fallbackResult: makeFallback("اكتشاف الفرص", 79, [
        "قسّم السوق إلى قطاعات قابلة للبيع لا قوائم عشوائية.",
        "استخدم Lead Score قبل التواصل حتى لا تهدر وقت فريق المبيعات.",
        "اربط الفرص المؤهلة بمراحل CRM واضحة."
      ]),
      ctaConfig: {
        primaryHref: "/contact/",
        secondaryHref: "/services/opportunity-discovery-agent.html",
        primaryText: "اطلب نموذج فرص مخصص",
        secondaryText: "راجع صفحة الخدمة"
      },
      whatsappSummaryTemplate: (data) => `أريد اكتشاف فرص مبيعات. الشركة: ${data.companyType || "غير محددة"}، الخدمة: ${data.serviceSold || "غير محددة"}، السوق: ${data.citySector || "غير محدد"}.`
    }
  };

  function makeFallback(topic, score, insights) {
    return {
      executiveSummary: {
        headline: `تقرير ${topic} التجريبي جاهز`,
        bullets: [
          "هذه نتيجة بديلة منظمة تظهر شكل التقرير عند تعذر الاتصال بالذكاء الاصطناعي.",
          "المخرجات تقديرية وتعتمد دقتها على جودة البيانات المدخلة.",
          "ينصح بتطبيق النموذج على بيانات منشأتك قبل اتخاذ قرار تنفيذي."
        ],
        disclaimer: "النتيجة مساعدة ولا تمثل وعداً تجارياً أو ترتيباً مضموناً."
      },
      scoreCard: {
        score,
        label: "جاهزية تقديرية",
        metrics: [
          { label: "وضوح المدخلات", value: "جيد", note: "قابل للتحسين بعينة بيانات أكبر" },
          { label: "جاهزية الربط", value: "API", note: "يعمل عبر Backend موحد" },
          { label: "المخاطر", value: "متوسطة", note: "تحتاج مراجعة بشرية قبل الإطلاق" }
        ]
      },
      insights: insights.map((detail, index) => ({ title: `رؤية ${index + 1}`, detail, priority: index === 0 ? "عالية" : "متوسطة" })),
      actionPlan: [
        { action: "اختيار سيناريو واحد عالي القيمة", owner: "مالك المنتج", impact: "تقليل نطاق الإطلاق الأول" },
        { action: "تحديد مصادر البيانات والصلاحيات", owner: "الفريق التقني", impact: "رفع جودة المخرجات" },
        { action: "قياس النتيجة مع فريق صغير", owner: "الإدارة", impact: "خفض مخاطر التوسع" }
      ],
      workflow: [
        { step: "استقبال البيانات", input: "نموذج الديمو", output: "سياق منظم", review: "آلي" },
        { step: "تحليل AI", input: "السياق والمخطط", output: "توصيات منظمة", review: "مراجعة بشرية" },
        { step: "تحويل النتيجة", input: "تقرير الديمو", output: "طلب ربط أو عرض سعر", review: "فريق Bright AI" }
      ],
      table: {
        headers: ["البند", "التقييم", "الإجراء"],
        rows: [
          ["البيانات", "كافية للتجربة", "إضافة عينة واقعية"],
          ["الربط", "جاهز مبدئياً", "تحديد API والأنظمة"],
          ["الحوكمة", "مطلوبة", "إضافة صلاحيات وسجل تدقيق"]
        ]
      },
      timeline: [
        { phase: "الاكتشاف", duration: "أسبوع", deliverable: "نطاق MVP ومصادر بيانات" },
        { phase: "البناء", duration: "أسبوعان", deliverable: "وكيل أولي وربط Backend" },
        { phase: "الاختبار", duration: "أسبوع", deliverable: "تقرير دقة وتحسينات" }
      ],
      cta: {
        headline: "الخطوة التالية",
        primary: "احجز ديمو مباشر",
        secondary: "راجع صفحة الخدمة",
        whatsapp: "أرسل الملخص عبر واتساب"
      }
    };
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function getAgentType() {
    const fromBody = document.body?.dataset?.agentDemo;
    if (fromBody && configs[fromBody]) return fromBody;
    const match = window.location.pathname.match(/\/demo\/([^/]+)\/?/);
    return match && configs[match[1]] ? match[1] : "";
  }

  function fieldValue(name) {
    const radio = document.querySelector(`input[name="${cssEscape(name)}"]:checked`);
    if (radio) return radio.value;
    const field = document.getElementById(name) || document.querySelector(`[name="${cssEscape(name)}"]`);
    return field ? field.value.trim ? field.value.trim() : field.value : "";
  }

  function collectInputs(config) {
    return config.inputFields.reduce((values, name) => {
      values[name] = fieldValue(name);
      return values;
    }, {});
  }

  function setInputValue(name, value) {
    const radio = Array.from(document.querySelectorAll(`input[name="${cssEscape(name)}"]`)).find((item) => item.value === String(value));
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const field = document.getElementById(name) || document.querySelector(`[name="${cssEscape(name)}"]`);
    if (!field) return;
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function applySample(config, engine) {
    Object.entries(config.sampleData).forEach(([name, value]) => setInputValue(name, value));
    engine.trackUsage("agent_sample_loaded");
  }

  function buildMessages(config, values) {
    const dataLines = config.inputFields.map((name) => `${name}: ${values[name] || ""}`).join("\n");
    return [
      {
        role: "system",
        content: [
          "أنت Principal AI Product Engineer وSenior Technical SEO Engineer في Bright AI.",
          "أعد تقرير ديمو عربي للسوق السعودي بصيغة JSON مطابقة للمخطط فقط.",
          "لا تعرض JSON للمستخدم النهائي. لا تقدم وعوداً مضمونة. لا تستخدم بيانات حساسة أو مصادر غير مصرح بها.",
          `نوع الوكيل: ${config.agentType}.`
        ].join("\n")
      },
      {
        role: "user",
        content: [
          config.description,
          "المدخلات:",
          dataLines,
          "المطلوب: ملخص تنفيذي، درجة جاهزية، رؤى، خطة عمل، سير عمل، جدول، خط زمني، وCTA."
        ].join("\n")
      }
    ];
  }

  function mergeResult(config, result) {
    const fallback = config.fallbackResult;
    const merged = { ...fallback, ...(result || {}) };
    merged.executiveSummary = { ...fallback.executiveSummary, ...(result?.executiveSummary || {}) };
    merged.scoreCard = { ...fallback.scoreCard, ...(result?.scoreCard || {}) };
    merged.cta = { ...fallback.cta, ...(result?.cta || {}) };
    return merged;
  }

  function renderExecutiveSummary(data) {
    return `<section class="result-card agent-result-wide"><h3>الملخص التنفيذي</h3><h4>${esc(data.headline)}</h4><ul>${(data.bullets || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>${data.disclaimer ? `<p class="privacy-note">${esc(data.disclaimer)}</p>` : ""}</section>`;
  }

  function renderScoreCard(data) {
    const score = Math.max(0, Math.min(100, Number(data.score || 0)));
    return `<section class="result-card"><h3>درجة الجاهزية</h3><div class="score agent-score"><strong>${score}</strong><span>${esc(data.label || "جاهزية")}</span></div><div class="agent-metrics">${(data.metrics || []).map((item) => `<div class="demo-kpi"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><small>${esc(item.note || "")}</small></div>`).join("")}</div></section>`;
  }

  function renderInsights(items) {
    return `<section class="result-card"><h3>الرؤى</h3><div class="agent-list">${(items || []).map((item) => `<article><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p><span>${esc(item.priority || "متوسطة")}</span></article>`).join("")}</div></section>`;
  }

  function renderActionPlan(items) {
    return `<section class="result-card"><h3>خطة العمل</h3><div class="agent-list">${(items || []).map((item) => `<article><strong>${esc(item.action)}</strong><p>${esc(item.impact)}</p><span>${esc(item.owner || "الفريق")}</span></article>`).join("")}</div></section>`;
  }

  function renderWorkflow(items) {
    return `<section class="result-card"><h3>سير العمل</h3><div class="agent-workflow">${(items || []).map((item, index) => `<div><span>${index + 1}</span><strong>${esc(item.step)}</strong><p>${esc(item.input)} ← ${esc(item.output)}</p><small>${esc(item.review || "")}</small></div>`).join("")}</div></section>`;
  }

  function renderTable(table) {
    const headers = table?.headers || [];
    const rows = table?.rows || [];
    return `<section class="result-card agent-result-wide"><h3>جدول القرار</h3><div class="agent-table-wrap"><table><thead><tr>${headers.map((item) => `<th>${esc(item)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
  }

  function renderTimeline(items) {
    return `<section class="result-card"><h3>الخط الزمني</h3><div class="agent-timeline">${(items || []).map((item) => `<div><strong>${esc(item.phase)}</strong><span>${esc(item.duration)}</span><p>${esc(item.deliverable)}</p></div>`).join("")}</div></section>`;
  }

  function renderCTA(data, config, values, engine) {
    const summary = config.whatsappSummaryTemplate(values);
    const wa = engine.createWhatsAppUrl(summary);
    return `<section class="result-card agent-result-wide agent-cta"><h3>${esc(data.headline || "الخطوة التالية")}</h3><div class="result-actions hero-actions"><a class="btn primary" href="${esc(config.ctaConfig.primaryHref)}" data-agent-lead>${esc(data.primary || config.ctaConfig.primaryText)}</a><a class="btn soft" href="${esc(config.ctaConfig.secondaryHref)}">${esc(data.secondary || config.ctaConfig.secondaryText)}</a><a class="btn whatsapp" href="${esc(wa)}" target="_blank" rel="noopener" data-agent-whatsapp>${esc(data.whatsapp || "أرسل الملخص عبر واتساب")}</a><button class="btn soft" type="button" data-agent-download>حمّل التقرير</button></div></section>`;
  }

  const renderers = {
    executiveSummary: (result) => renderExecutiveSummary(result.executiveSummary),
    scoreCard: (result) => renderScoreCard(result.scoreCard),
    insights: (result) => renderInsights(result.insights),
    actionPlan: (result) => renderActionPlan(result.actionPlan),
    workflow: (result) => renderWorkflow(result.workflow),
    table: (result) => renderTable(result.table),
    timeline: (result) => renderTimeline(result.timeline),
    cta: (result, config, values, engine) => renderCTA(result.cta, config, values, engine)
  };

  function loadingMarkup(config) {
    return `<div class="loading agent-loading" aria-live="polite"><strong>يتم تشغيل ${esc(config.title)}...</strong><div class="pulse"></div><div class="loading-stages">${config.loadingSteps.map((step) => `<span>${esc(step)}</span>`).join("")}</div></div>`;
  }

  function renderReport(result, config, values, engine) {
    const safe = mergeResult(config, result);
    const fallbackBanner = result?.__fallback
      ? `<section class="result-card agent-result-wide error-state"><h3>تعذر تشغيل التحليل الآن</h3><p>تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة.</p><div class="result-actions hero-actions"><button class="btn soft" type="button" data-agent-retry>إعادة المحاولة</button><a class="btn whatsapp" href="${esc(engine.createWhatsAppUrl(config.whatsappSummaryTemplate(values)))}" target="_blank" rel="noopener" data-agent-whatsapp>تواصل واتساب</a></div></section>`
      : "";
    return `<div class="agent-result-shell" dir="rtl">${fallbackBanner}${config.resultSections.map((section) => renderers[section]?.(safe, config, values, engine) || "").join("")}</div>`;
  }

  function downloadReport(agentType, panel, engine) {
    engine.trackUsage("agent_report_downloaded");
    window.BrightAIDemoUtils?.downloadText(`${agentType}-report.txt`, panel.innerText, "text/plain;charset=utf-8");
  }

  function bindResultActions(panel, agentType, engine, rerun) {
    if (panel.dataset.agentActionsBound === "true") return;
    panel.dataset.agentActionsBound = "true";
    panel.querySelector("[data-agent-download]")?.addEventListener("click", () => downloadReport(agentType, panel, engine));
    panel.querySelector("[data-agent-whatsapp]")?.addEventListener("click", () => engine.trackUsage("agent_whatsapp_clicked"));
    panel.querySelector("[data-agent-lead]")?.addEventListener("click", () => engine.trackUsage("agent_lead_submitted"));
    panel.querySelector("[data-agent-retry]")?.addEventListener("click", rerun);
  }

  async function runDemo(config, engine, button, panel) {
    const values = collectInputs(config);
    const requiredField = config.inputFields.find((name) => !values[name] && config.sampleData[name]);
    if (requiredField) {
      applySample(config, engine);
      Object.assign(values, collectInputs(config));
    }

    const originalText = button.textContent;
    button.disabled = true;
    panel.innerHTML = loadingMarkup(config);

    const messages = buildMessages(config, values);
    try {
      const result = await engine.generate({
        agentType: config.agentType,
        domain: config.agentType,
        locale,
        sourcePage: window.location.pathname,
        messages,
        schema: resultSchema,
        schemaName: config.schemaName,
        fallback: config.fallbackResult,
        temperature: 0.2
      });

      panel.innerHTML = renderReport(result, config, values, engine);
      delete panel.dataset.agentActionsBound;
      bindResultActions(panel, config.agentType, engine, () => runDemo(config, engine, button, panel));
    } catch (error) {
      panel.innerHTML = renderReport({ ...config.fallbackResult, __fallback: true }, config, values, engine);
      delete panel.dataset.agentActionsBound;
      bindResultActions(panel, config.agentType, engine, () => runDemo(config, engine, button, panel));
      engine.trackUsage("demo_error", error?.message || "agent_demo_failed");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function mount() {
    const agentType = getAgentType();
    const config = configs[agentType];
    const button = $("#generateBtn");
    const sample = $("#fillSampleBtn");
    const panel = $("#resultsPanel") || $("#agentDemoApp [data-output]");
    if (!config || !button || !panel || !window.GeminiDemoEngine) return;
    if (button.dataset.agentDemoBound === "true") return;

    document.body.dataset.agentDemo = agentType;
    const engine = new window.GeminiDemoEngine({ demoId: agentType, endpoint, timeoutMs: 60000 });

    if (sample && sample.dataset.agentDemoBound !== "true") sample.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      applySample(config, engine);
    }, true);
    if (sample) sample.dataset.agentDemoBound = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      runDemo(config, engine, button, panel);
    }, true);
    button.dataset.agentDemoBound = "true";
  }

  window.BrightAIAgentDemoSuite = {
    configs,
    renderExecutiveSummary,
    renderScoreCard,
    renderInsights,
    renderActionPlan,
    renderWorkflow,
    renderTable,
    renderTimeline,
    renderCTA
  };

  ready(mount);
})();
