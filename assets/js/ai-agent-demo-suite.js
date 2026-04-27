(() => {
  "use strict";
  const configs = {
  "custom-ai-agent": {
    "name": "وكيل ذكاء اصطناعي مخصص",
    "title": "وكيل ذكاء اصطناعي مخصص يعمل بهوية شركتك وأساليبك التشغيلية",
    "description": "مبني خصيصاً ليحاكي دماغ مؤسستك. ندرّبه على سياساتك وبياناتك الخاصة لينفذ أعقد المهام التشغيلية بأسلوب وهوية علامتك التجارية بشكل تام.",
    "compliance": "لا يتم استخدام بيانات العميل إلا لغرض التجربة والتقييم. لا ترفع بيانات حساسة أو أسرار تشغيلية في الديمو العام.",
    "sample": "شركة خدمات لديها سياسات داخلية، دليل إجراءات، 6 أقسام تشغيلية، وتحتاج وكيلاً يجيب الموظفين والعملاء بنفس نبرة العلامة ويقترح خطوات تنفيذية.",
    "scenarios": [
      "مساعد سياسات داخلية",
      "وكيل خدمة عملاء مخصص",
      "مساعد عمليات للفرق"
    ],
    "metrics": [
      [
        "جاهزية التشغيل",
        "82%"
      ],
      [
        "توفير وقت تقديري",
        "35%"
      ],
      [
        "قابلية الربط",
        "API"
      ]
    ]
  },
  "competitor-analysis-agent": {
    "name": "وكيل تحليل المنافسين",
    "title": "وكيل تحليل المنافسين — يكشف أسرار السوق ويعطيك أفضلية حقيقية",
    "description": "رادار مؤسسي لا يتوقف. يراقب أرقام وحملات وتقييمات منافسيك يومياً، ويستخرج نقاط ضعفهم ليمنحك تقارير استراتيجية تضعك في صدارة الحصة السوقية.",
    "compliance": "لا يستخدم اختراقاً أو بيانات خاصة أو scraping مخالف. يعتمد على البيانات المتاحة والمصرح بها وسياسات كل منصة.",
    "sample": "شركة SaaS سعودية لديها 4 منافسين، تريد فهم الرسائل الإعلانية، الأسعار التقريبية، تقييمات العملاء، ونقاط الضعف القابلة للاستثمار.",
    "scenarios": [
      "تحليل عروض المنافسين",
      "رصد حملات السوق",
      "مقارنة تجربة العميل"
    ],
    "metrics": [
      [
        "سرعة الرصد",
        "يومي"
      ],
      [
        "وضوح الفجوات",
        "74%"
      ],
      [
        "جاهزية القرار",
        "عالية"
      ]
    ]
  },
  "seo-ai-agent": {
    "name": "وكيل SEO",
    "title": "وكيل SEO ذكي يرفع ترتيبك ويقلّل تكلفة الإعلانات",
    "description": "يستهدف الكلمات البيعية العالية ويكتب محتوى محسّن يساعد على مضاعفة الزيارات العضوية وخفض تكاليف النقرات الإعلانية.",
    "compliance": "لا يستخدم spam أو cloaking أو keyword stuffing. النتائج تقديرية حسب جودة الموقع والمحتوى والمنافسة.",
    "sample": "موقع شركة خدمات في الرياض لديه صفحات قليلة، إعلانات مكلفة، وهدفه تحسين صفحات الخدمات والكلمات البيعية مثل شركة ذكاء اصطناعي في السعودية.",
    "scenarios": [
      "تحليل صفحة خدمة",
      "خريطة كلمات بيعية",
      "خطة محتوى محلية"
    ],
    "metrics": [
      [
        "قابلية الفهرسة",
        "86%"
      ],
      [
        "فرص الترتيب",
        "تقديرية"
      ],
      [
        "خفض الهدر",
        "أفضل"
      ]
    ]
  },
  "marketing-ai-agent": {
    "name": "وكيل تسويق",
    "title": "وكيل تسويق ذكي يضاعف وصول علامتك ويزيد التحويلات",
    "description": "أداة تسويق آلية تدير حملاتك الرقمية، تحدد جمهورك المثالي، تولّد محتوى جذاب، وتحلّل الأداء لحظياً. تقلّل الهدر وتزيد الفعالية، وتضمن وصول علامتك لأكبر عدد من العملاء المحتملين بأقل تكلفة ممكنة.",
    "compliance": "لا يرسل حملات مزعجة أو مخالفة. يجب احترام موافقات التواصل، سياسات المنصات، ومتطلبات الخصوصية.",
    "sample": "شركة تجارة إلكترونية بميزانية 30 ألف ريال، تستهدف الرياض وجدة، وتريد حملة لإطلاق منتج جديد مع رسائل واتساب وصفحات هبوط وإعلانات بحث.",
    "scenarios": [
      "خطة حملة سريعة",
      "توليد رسائل وقنوات",
      "تحليل أداء تسويقي"
    ],
    "metrics": [
      [
        "سرعة التخطيط",
        "70%"
      ],
      [
        "تحسين التحويل",
        "تقديري"
      ],
      [
        "قنوات مدعومة",
        "متعددة"
      ]
    ]
  },
  "opportunity-discovery-agent": {
    "name": "وكيل اكتشاف الفرص والعملاء",
    "title": "وكيل اكتشاف الفرص الذكي — يجلب لك عملاء محتملين جاهزين للبيع",
    "description": "صياد آلي لا يتعب. يمسح السوق والمنصات لجمع وتصنيف العملاء المحتملين وتقييم جديتهم لضخهم مباشرة كتدفق مستمر إلى فريق المبيعات.",
    "compliance": "لا يجمع بيانات شخصية حساسة بدون أساس نظامي. يجب احترام الخصوصية وسياسات المنصات وقنوات التواصل المصرح بها.",
    "sample": "شركة B2B تقدم حلول تقنية للشركات المتوسطة، تريد تحديد قطاعات واعدة في الرياض والدمام وتصنيف العملاء المحتملين حسب الجدية وقابلية البيع.",
    "scenarios": [
      "تحديد قطاعات واعدة",
      "تصنيف Leads",
      "خطة متابعة مبيعات"
    ],
    "metrics": [
      [
        "تأهيل الفرص",
        "Score"
      ],
      [
        "زمن البحث",
        "أقل"
      ],
      [
        "جاهزية CRM",
        "عالية"
      ]
    ]
  }
};
  const schema = {
    type: "object",
    required: ["executive_summary", "score", "key_insights", "recommended_actions", "risks", "roi", "integration_readiness", "next_steps"],
    properties: {
      executive_summary: { type: "array", items: { type: "string" } },
      score: { type: "number" },
      key_insights: { type: "array", items: { type: "string" } },
      recommended_actions: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      roi: { type: "array", items: { type: "string" } },
      integration_readiness: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } }
    }
  };
  const fallback = (config) => ({
    executive_summary: ["هذه نتيجة تجريبية بديلة توضح شكل التقرير عند تعذر الاتصال بالذكاء الاصطناعي.", config.description],
    score: 78,
    key_insights: ["المدخلات تكفي لبناء تصور أولي.", "الأثر الحقيقي يعتمد على جودة البيانات والربط."],
    recommended_actions: ["ابدأ بسيناريو واحد عالي القيمة.", "حدد مصادر البيانات والصلاحيات.", "اختبر المخرجات مع فريق صغير قبل التوسع."],
    risks: [config.compliance, "النتائج تقديرية وليست وعداً تجارياً أو ترتيباً مضموناً."],
    roi: ["توفير وقت في التحليل والمتابعة اليدوية.", "رفع وضوح القرار وربط التوصيات بخطوات تنفيذية."],
    integration_readiness: ["Backend موحد", "API-ready", "قابل للربط مع CRM أو ERP حسب البيئة"],
    next_steps: ["احجز ديمو مباشر.", "شارك التقرير عبر واتساب.", "اطلب عرض سعر للنسخة المخصصة."]
  });
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }
  function list(items) {
    return "<ul>" + (items || []).map((item) => "<li>" + esc(item) + "</li>").join("") + "</ul>";
  }
  function loading() {
    return '<div class="loading"><strong>الوكيل يحلل البيانات...</strong><div class="pulse"></div><div class="loading-stages"><span>فهم السياق</span><span>تحليل المدخلات</span><span>توليد التوصيات</span><span>بناء التقرير</span></div></div>';
  }
  function report(data, config, engine) {
    const safe = { ...fallback(config), ...(data || {}) };
    const score = Math.max(0, Math.min(100, Number(safe.score || 78)));
    const wa = engine.createWhatsAppUrl((safe.executive_summary || [config.title])[0]);
    return '<div class="result-grid">' +
      '<section class="result-card"><h3>Executive Summary</h3>' + list(safe.executive_summary) + '</section>' +
      '<section class="result-card"><h3>Score</h3><div class="score"><strong>' + score + '</strong><span>جاهزية تقديرية</span></div></section>' +
      '<section class="result-card"><h3>Key Insights</h3>' + list(safe.key_insights) + '</section>' +
      '<section class="result-card"><h3>Recommended Actions</h3>' + list(safe.recommended_actions) + '</section>' +
      '<section class="result-card"><h3>Risks</h3>' + list(safe.risks) + '</section>' +
      '<section class="result-card"><h3>ROI / Business Impact</h3>' + list(safe.roi) + '</section>' +
      '<section class="result-card"><h3>Integration Readiness</h3>' + list(safe.integration_readiness) + '</section>' +
      '<section class="result-card"><h3>Next Steps</h3>' + list(safe.next_steps) + '</section>' +
      '</div><div class="result-actions hero-actions"><a class="btn primary" href="/contact/">احجز ديمو مباشر</a><a class="btn soft" href="/contact/">اطلب عرض سعر</a><a class="btn whatsapp" href="' + wa + '" target="_blank" rel="noopener">أرسل التقرير عبر واتساب</a><button class="btn soft" type="button" data-download>حمّل التقرير</button></div>';
  }
  function prompt(config, form) {
    return "أنت Principal AI Product Engineer وSEO Strategist في Bright AI. أنشئ تقريراً عربياً تنفيذياً للسوق السعودي عن " + config.name + ".\n" +
      "السيناريو: " + form.scenario + "\n" +
      "بيانات الشركة: " + form.input + "\n" +
      "القطاع: " + form.industry + "\n" +
      "الهدف: " + form.goal + "\n" +
      "التزم بال JSON schema فقط. لا تعرض JSON خارجياً. اجعل النتائج تقديرية حسب البيانات، واذكر المخاطر والامتثال وخطة الربط.";
  }
  function mount() {
    const key = document.body.dataset.agentDemo;
    const config = configs[key];
    const mountNode = document.getElementById("agentDemoApp");
    if (!config || !mountNode || !window.GeminiDemoEngine) return;
    const engine = new window.GeminiDemoEngine({ demoId: key, endpoint: "/api/ai/chat/completions", timeoutMs: 16000 });
    mountNode.innerHTML = '<ol class="demo-stepper"><li>اختر السيناريو</li><li>أدخل بيانات شركتك</li><li>استخدم بيانات تجريبية</li><li>شغّل الوكيل</li><li>شاهد التقرير</li><li>اطلب الربط أو العرض</li></ol><div class="demo-grid"><form class="demo-card" data-form><div class="mode-row"><button type="button" class="is-active" data-mode="quick">الوضع السريع</button><button type="button" data-mode="advanced">إعدادات متقدمة</button></div><label>اختر السيناريو</label><select name="scenario">' + config.scenarios.map((s) => '<option>' + esc(s) + '</option>').join("") + '</select><label>بيانات شركتك</label><textarea name="input" placeholder="اكتب وصفاً مختصراً للشركة أو استخدم المثال الجاهز..."></textarea><div class="sample-row"><button type="button" data-sample>استخدم مثال جاهز</button></div><div class="advanced" data-advanced><label>القطاع</label><input name="industry" placeholder="مثال: SaaS، تجارة، صحة، لوجستيات"><label>الهدف التجاري</label><input name="goal" placeholder="مثال: زيادة التحويلات أو خفض وقت التحليل"></div><p class="privacy-note">' + esc(config.compliance) + '</p><div class="hero-actions"><button class="btn primary" type="submit">شغّل الوكيل</button><a class="btn soft" href="https://wa.me/966538229013" target="_blank" rel="noopener">اطلب نسخة مخصصة</a></div></form><div class="demo-card" data-output><h2>Result Dashboard</h2><p>ستظهر النتيجة في بطاقات تنفيذية تشمل الملخص، الدرجة، الرؤى، الإجراءات، المخاطر، الأثر التجاري، جاهزية الربط، والخطوات التالية.</p></div></div>';
    const form = mountNode.querySelector("[data-form]");
    const output = mountNode.querySelector("[data-output]");
    const advanced = mountNode.querySelector("[data-advanced]");
    mountNode.querySelector("[data-mode='advanced']").addEventListener("click", (event) => {
      mountNode.querySelectorAll("[data-mode]").forEach((button) => button.classList.remove("is-active"));
      event.currentTarget.classList.add("is-active");
      advanced.classList.add("is-open");
    });
    mountNode.querySelector("[data-mode='quick']").addEventListener("click", (event) => {
      mountNode.querySelectorAll("[data-mode]").forEach((button) => button.classList.remove("is-active"));
      event.currentTarget.classList.add("is-active");
      advanced.classList.remove("is-open");
    });
    mountNode.querySelector("[data-sample]").addEventListener("click", () => {
      form.elements.input.value = config.sample;
      engine.trackUsage("sample_loaded");
    });
    window.addEventListener("bai-demo-error", (event) => {
      if (event.detail?.demoId === key) {
        output.insertAdjacentHTML("afterbegin", '<p class="error-note">تعذر الاتصال بالذكاء الاصطناعي حالياً. عرضنا نتيجة تجريبية بديلة ويمكنك إعادة المحاولة.</p>');
      }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      if (!values.input) values.input = config.sample;
      output.innerHTML = loading();
      const result = await engine.generate({ prompt: prompt(config, values), schema, schemaName: key.replaceAll("-", "_") + "_report", domain: key, fallback: fallback(config), temperature: 0.2 });
      output.innerHTML = report(result, config, engine);
      output.querySelector("[data-download]")?.addEventListener("click", () => window.BrightAIDemoUtils.downloadText(key + "-report.txt", output.innerText));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();