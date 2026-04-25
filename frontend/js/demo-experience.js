(function () {
  "use strict";

  const WHATSAPP = "https://api.whatsapp.com/send?phone=966538229013";
  const pagePath = window.location.pathname.replace(/\/index\.html$/, "/");

  const configs = [
    {
      match: /^\/services\/?$/,
      key: "services",
      title: "اختَر الحل، جرّبه، ثم اطلبه بدون تردد",
      summary: "صفحة الخدمات الآن تعمل كمسار قرار: بحث سريع، فلترة، مقارنة، تجربة فورية للمنتجات التي لديها demo، ثم إضافة للسلة أو تواصل واتساب.",
      primaryTarget: "#productsGrid",
      secondaryTarget: "#payment",
      primaryText: "تصفح المنتجات",
      samplesTitle: "قارن بسرعة حسب احتياجك",
      samples: [
        { label: "خدمة عملاء", fill: "خدمة عملاء واتساب دعم شحن استرجاع", target: "#searchInput" },
        { label: "تحليل بيانات", fill: "تحليل بيانات تقارير dashboard مؤشرات", target: "#searchInput" },
        { label: "توظيف", fill: "توظيف فرز مرشحين سيرة ذاتية", target: "#searchInput" },
        { label: "تعليم", fill: "تعليم منصة اختبارات طالب معلم", target: "#searchInput" }
      ],
      resultTitle: "مقارنة تنفيذية للمنتجات",
      resultSummary: "ابدأ بالمنتج الذي يملك تجربة فورية إذا كان الهدف إثبات القيمة بسرعة، ثم انتقل للشراء أو التخصيص عند ظهور احتياج بيانات داخلية.",
      kpis: [
        ["تجارب فورية", "10+"],
        ["تصنيفات", "6"],
        ["مسار الشراء", "سلة + واتساب"],
        ["الخطوة التالية", "جرّب قبل الشراء"]
      ],
      recommendations: ["استخدم البحث بصياغة المشكلة لا اسم المنتج فقط.", "ابدأ بالـ demo ثم أضف المنتج للسلة عند وضوح القيمة.", "اطلب تخصيصاً إذا احتجت ربطاً مع بيانات داخلية."]
    },
    {
      match: /^\/try\/data-analyzer\/?$/,
      key: "data",
      title: "حلّل ملفك أو ابدأ ببيانات تجريبية خلال ثوانٍ",
      summary: "تجربة SaaS مصغرة لتحويل CSV أو Excel إلى مؤشرات، ملخص تنفيذي، توصيات، وJSON قابل للنسخ أو التحميل.",
      primaryTarget: "#file-input",
      secondaryTarget: "#dashboard-section",
      primaryText: "جرّب الآن",
      samplesTitle: "بيانات تجريبية جاهزة",
      samples: [
        { label: "مبيعات", click: "[data-sample='sales']" },
        { label: "مخزون", click: "[data-sample='inventory']" },
        { label: "موارد بشرية", click: "[data-sample='hr']" },
        { label: "رضا العملاء", click: "[data-sample='csat']" }
      ],
      resultTitle: "Dashboard مصغر بعد التحليل",
      resultSummary: "النتيجة المتوقعة تشمل قراءة جودة البيانات، مؤشرات KPI، فرص نمو، أسئلة متابعة، وتوصية تنفيذية قابلة للمشاركة.",
      kpis: [
        ["جودة البيانات", "86%"],
        ["فرص واضحة", "4"],
        ["تنبيهات", "2"],
        ["زمن القراءة", "< 60ث"]
      ],
      recommendations: ["نظّف الأعمدة ذات القيم المفقودة قبل التوسع.", "اعتمد KPI واحداً لكل قرار حتى لا تتشتت اللوحة.", "نزّل JSON وشاركه مع فريق البيانات للمراجعة."]
    },
    {
      match: /^\/health\/?$/,
      key: "health",
      title: "تجربة صحية توضيحية مع مؤشرات واضحة",
      summary: "هذه تجربة توضيحية وليست تشخيصاً طبياً. استخدمها لفهم كيف يمكن للذكاء الاصطناعي تنظيم المؤشرات الحيوية وتحديد الأولويات التشغيلية.",
      primaryTarget: "#try",
      secondaryTarget: "#leadForm, #services",
      primaryText: "جرّب الآن",
      samplesTitle: "أمثلة مؤشرات حيوية",
      samples: [
        { label: "طبيعي", health: "normal" },
        { label: "يحتاج انتباه", health: "attention" },
        { label: "خطر", health: "danger" }
      ],
      resultTitle: "ملخص حالة المؤشرات",
      resultSummary: "النظام يصنف القراءة إلى طبيعي، يحتاج انتباه، أو خطر مع إبقاء القرار الطبي النهائي بيد الطبيب أو البروتوكول المعتمد.",
      kpis: [
        ["النبض", "78"],
        ["الأكسجين", "97%"],
        ["الضغط", "120/80"],
        ["الحالة", "طبيعي"]
      ],
      recommendations: ["اجعل التنبيه الطبي ظاهراً قبل أي نتيجة.", "استخدم الألوان مع النصوص لا اللون وحده.", "حوّل المنشآت الصحية إلى طلب تجربة مخصصة."]
    },
    {
      match: /^\/demo\/ocr-demo\/?$/,
      key: "ocr",
      title: "ارفع مستنداً أو جرّب مثال OCR جاهز",
      summary: "التجربة تعرض الحقول المستخرجة، ملخصاً تنفيذياً، JSON، ونواقص المراجعة حتى يرى المستخدم قيمة الأتمتة قبل الشراء.",
      primaryTarget: "#ocr-file",
      secondaryTarget: "#ocr-output",
      primaryText: "جرّب الآن",
      samplesTitle: "أمثلة وثائق جاهزة",
      samples: [
        { label: "فاتورة ضريبية", ocr: "invoice" },
        { label: "هوية وطنية", ocr: "id" },
        { label: "عقد توريد", ocr: "contract" }
      ],
      resultTitle: "نتيجة OCR منظمة",
      resultSummary: "الحقول المهمة تظهر منفصلة عن JSON، مع ملخص وملاحظات مراجعة حتى يسهل ربطها بأنظمة ERP أو الأرشفة.",
      kpis: [
        ["حقول مستخرجة", "7"],
        ["ثقة القراءة", "94%"],
        ["نواقص", "1"],
        ["صيغة جاهزة", "JSON"]
      ],
      recommendations: ["راجع الحقول منخفضة الثقة قبل الاعتماد.", "اربط JSON بنظام المحاسبة أو الأرشيف.", "اطلب نموذجاً مخصصاً إذا كانت مستنداتك غير قياسية."]
    },
    {
      match: /^\/interview\/?$/,
      key: "interview",
      title: "افحص المرشح من الوصف الوظيفي حتى أسئلة المقابلة",
      summary: "رحلة التوظيف مقسمة إلى وصف الوظيفة، السيرة الذاتية، التحليل، ثم أسئلة مقابلة مرتبطة بالفجوات.",
      primaryTarget: "#jobDescription",
      secondaryTarget: "#analysisResults",
      primaryText: "جرّب الآن",
      samplesTitle: "بيانات مرشح جاهزة",
      samples: [
        { label: "محلل بيانات", interview: "data" },
        { label: "دعم عملاء", interview: "support" },
        { label: "مدير مشروع", interview: "project" }
      ],
      resultTitle: "Score ومطابقة متطلبات",
      resultSummary: "يعرض التقييم درجة عامة، نقاط قوة، فجوات، وأسئلة مقابلة مقترحة حتى ينتقل فريق HR من الفرز إلى قرار واضح.",
      kpis: [
        ["Score", "82%"],
        ["مطابقة المتطلبات", "7/10"],
        ["فجوات", "3"],
        ["أسئلة مقابلة", "5"]
      ],
      recommendations: ["اطلب أمثلة عملية عند وجود فجوة خبرة.", "قارن المرشح بالمتطلبات الأساسية لا الكلمات المفتاحية فقط.", "استخدم التقرير كدعم قرار وليس حكماً نهائياً."]
    },
    {
      match: /^\/smart-medical-archive\/?$/,
      key: "archive",
      title: "أرشيف طبي ذكي: رفع، استخراج، تصنيف، بحث، تقرير",
      summary: "التجربة الثقيلة أصبحت أوضح عبر مسار عمل واحد يبدأ بالوثيقة وينتهي بسجل قابل للبحث وتقرير تنفيذي للمنشأة.",
      primaryTarget: "#trialConsole",
      secondaryTarget: "#dashboardStudio",
      primaryText: "جرّب الآن",
      samplesTitle: "تقارير طبية جاهزة",
      samples: [
        { label: "سكري", click: "[data-sample='diabetes']" },
        { label: "أورام", click: "[data-sample='oncology']" },
        { label: "طوارئ", click: "[data-sample='emergency']" }
      ],
      resultTitle: "أرشيف تجريبي منظم",
      resultSummary: "السجل الطبي يظهر كبيانات مستخرجة، تصنيف، مخاطر، بحث دلالي، وتقرير قابل للتصدير.",
      kpis: [
        ["سجلات", "12"],
        ["استخراج ناجح", "91%"],
        ["حالات حرجة", "2"],
        ["بحث ذكي", "مفعل"]
      ],
      recommendations: ["ابدأ بدفعة ملفات صغيرة قبل ربط الأرشيف كاملاً.", "راجع الحقول السريرية الحساسة يدوياً.", "اطلب نسخة مخصصة للمستشفى أو العيادة عند الحاجة لصلاحيات وتكاملات."]
    },
    {
      match: /^\/ai-bots\/BrightSupport\/?$/,
      key: "support",
      title: "جرّب Chatbot دعم كما سيظهر لعملائك",
      summary: "سيناريوهات جاهزة للدعم، مع تصنيف التذكرة ودرجة الاستعجال وخطوة تصعيد واضحة إلى واتساب أو الموقع.",
      primaryTarget: "#userInput",
      secondaryTarget: "#chatMessages",
      primaryText: "ابدأ المحادثة",
      samplesTitle: "سيناريوهات دعم جاهزة",
      chatScenarios: [
        ["استرجاع", "عميل يريد استرجاع طلب وصل متأخراً ويريد معرفة السياسة."],
        ["شحن", "استفسار عن شحنة تأخرت يومين ورقم الطلب غير واضح."],
        ["عميل غاضب", "عميل غاضب بسبب تجربة سيئة ويطلب تصعيداً فورياً."],
        ["سؤال منتج", "عميل يسأل عن الفرق بين الباقة الأساسية والمتقدمة."]
      ],
      resultTitle: "تصنيف تذكرة الدعم",
      resultSummary: "كل محادثة تتحول إلى نوع تذكرة، درجة استعجال، ملخص، وإجراء مقترح للفريق.",
      kpis: [
        ["نوع التذكرة", "استرجاع"],
        ["الاستعجال", "متوسط"],
        ["نبرة العميل", "منزعج"],
        ["الإجراء", "تصعيد بشري"]
      ],
      recommendations: ["صنّف النية قبل الرد.", "اجعل التصعيد واضحاً عند الغضب أو التعويض.", "اربط البوت بواتساب الموقع لتقليل زمن الاستجابة."]
    },
    {
      match: /^\/ai-bots\/BrightProject\/?$/,
      key: "project",
      title: "لوحة إدارة مشروع مصغرة داخل المحادثة",
      summary: "BrightProject يحول تحديثات الفريق إلى تقدم، مخاطر، مهام، وخطة أسبوعية قابلة للمتابعة.",
      primaryTarget: "#userInput",
      secondaryTarget: "#chatMessages",
      primaryText: "جرّب BrightProject",
      samplesTitle: "سيناريوهات مشروع جاهزة",
      chatScenarios: [
        ["تأخير مورد", "لدينا تأخير من المورد أسبوعاً ونحتاج خطة تعويض."],
        ["تقرير أسبوعي", "لخص حالة المشروع: 8 مهام مكتملة، 3 متأخرة، ومخاطرة اعتماد."],
        ["توزيع مهام", "وزع مهام الأسبوع القادم لفريق التصميم والتطوير والجودة."]
      ],
      board: [
        ["التقدم", "68%", 68],
        ["مخاطر عالية", "2", 45],
        ["مهام الأسبوع", "11", 74]
      ],
      resultTitle: "حالة مشروع تنفيذية",
      resultSummary: "النتيجة تعرض تقدم المشروع، المخاطر، المهام الحرجة، وخط زمني للأسبوع القادم.",
      kpis: [
        ["Progress", "68%"],
        ["مخاطر", "2"],
        ["مهام متأخرة", "3"],
        ["الأسبوع القادم", "5 نقاط"]
      ],
      recommendations: ["اعرض المخاطر قبل التفاصيل.", "حوّل كل توصية إلى مالك وتاريخ.", "انسخ الملخص للاجتماع الأسبوعي."]
    },
    {
      match: /^\/ai-bots\/BrightSales\/?$/,
      key: "sales",
      title: "CRM مصغر لتأهيل العملاء وكتابة المتابعة",
      summary: "BrightSales يرتب الفرص، يحسب lead score، ويجهز رسالة متابعة واتساب قابلة للنسخ.",
      primaryTarget: "#userInput",
      secondaryTarget: "#chatMessages",
      primaryText: "جرّب BrightSales",
      samplesTitle: "سيناريوهات مبيعات جاهزة",
      chatScenarios: [
        ["Lead ساخن", "عميل طلب عرض سعر خلال هذا الأسبوع ولديه ميزانية واضحة."],
        ["متابعة واتساب", "اكتب رسالة متابعة قصيرة بعد اجتماع تعريفي عن خدمة ذكاء اصطناعي."],
        ["اعتراض السعر", "عميل يرى السعر مرتفعاً ويطلب سبب الاستثمار."]
      ],
      board: [
        ["New", "14", 35],
        ["Qualified", "8", 58],
        ["Proposal", "5", 72]
      ],
      resultTitle: "Pipeline وLead Score",
      resultSummary: "النتيجة تعرض موقع العميل في المسار، درجة الأولوية، ورسالة متابعة يمكن نسخها لواتساب.",
      kpis: [
        ["Lead score", "84"],
        ["المرحلة", "Proposal"],
        ["احتمال الإغلاق", "62%"],
        ["رسالة واتساب", "جاهزة"]
      ],
      recommendations: ["ابدأ برسالة قصيرة مرتبطة بألم العميل.", "تابع الفرص الساخنة خلال 24 ساعة.", "انسخ رسالة واتساب من النتيجة وعدلها حسب اسم العميل."]
    },
    {
      match: /^\/ai-scolecs\/?$/,
      key: "school",
      title: "منصة تعليمية AI للمعلم والطالب والإدارة",
      summary: "التجربة أصبحت مقسمة حسب الدور: المعلم يولد أسئلة وخطط، الطالب يحصل على شرح، والإدارة ترى مؤشرات أداء.",
      primaryTarget: "#content-area",
      secondaryTarget: "#screen-stats",
      primaryText: "جرّب المنصة",
      samplesTitle: "اختر دور التجربة",
      samples: [
        { label: "المعلم", nav: "exams" },
        { label: "الطالب", nav: "tutor" },
        { label: "الإدارة", nav: "stats" }
      ],
      resultTitle: "تحليل أداء تعليمي",
      resultSummary: "المنصة تنتج أسئلة، خطة درس، تصحيح واجب، ولوحة أداء تساعد الإدارة على متابعة التحسن.",
      kpis: [
        ["دقة الطالب", "85%"],
        ["اختبارات", "12"],
        ["ساعات تعلم", "24"],
        ["توصيات", "4"]
      ],
      recommendations: ["استخدم التبويب حسب الدور بدل عرض كل الأدوات مرة واحدة.", "ابدأ بمادة وهدف محددين.", "صدّر تقرير الأداء عند تقييم فصل أو مجموعة."]
    }
  ];

  const config = configs.find((item) => item.match.test(pagePath));
  if (!config) return;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function toast(message) {
    let node = $(".bai-demo-toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "bai-demo-toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("is-visible");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () {
      node.classList.remove("is-visible");
    }, 2600);
  }

  function scrollToTarget(selector) {
    const target = selector ? $(selector) : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof target.focus === "function" && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)) {
        window.setTimeout(function () { target.focus({ preventScroll: true }); }, 400);
      }
    }
  }

  function setField(selector, value) {
    const field = $(selector);
    if (!field) return false;
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    scrollToTarget(selector);
    return true;
  }

  function clickTarget(selector) {
    const target = $(selector);
    if (!target) return false;
    target.click();
    scrollToTarget(selector);
    return true;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.insetInlineStart = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return Promise.resolve();
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function firstMainContainer() {
    return $("main") || $(".site-wrap") || $(".page-container") || document.body;
  }

  function createCommandPanel() {
    if ($(".bai-demo-command")) return;
    const panel = document.createElement("section");
    panel.className = "bai-demo-shell bai-demo-command";
    panel.setAttribute("aria-labelledby", "bai-demo-command-title");

    const samples = (config.samples || []).map(function (sample, index) {
      return `<button class="bai-demo-sample" type="button" data-sample-index="${index}">${escapeHtml(sample.label)}</button>`;
    }).join("");

    panel.innerHTML = `
      <div class="bai-demo-command__grid">
        <div>
          <span class="bai-demo-command__eyebrow">تجربة قبل الشراء</span>
          <h2 id="bai-demo-command-title">${escapeHtml(config.title)}</h2>
          <p>${escapeHtml(config.summary)}</p>
          <div class="bai-demo-actions">
            <button class="bai-demo-action bai-demo-action--primary" type="button" data-demo-scroll="${escapeHtml(config.primaryTarget || "")}">${escapeHtml(config.primaryText || "جرّب الآن")}</button>
            <a class="bai-demo-action bai-demo-action--whatsapp" href="${WHATSAPP}&text=${encodeURIComponent("السلام عليكم، أحتاج تجربة BrightAI على بياناتي لهذه الصفحة: " + window.location.href)}" target="_blank" rel="noopener">اطلب التطبيق على بياناتك</a>
          </div>
          ${samples ? `<p class="bai-demo-eyebrow" style="margin-block-start:20px">${escapeHtml(config.samplesTitle || "بيانات تجريبية")}</p><div class="bai-demo-samples">${samples}</div>` : ""}
        </div>
        <ol class="bai-demo-steps" aria-label="رحلة التجربة">
          <li class="bai-demo-step"><span class="bai-demo-step__num">1</span><span><strong>افهم الخدمة بسرعة</strong>العنوان والنتيجة المتوقعة ظاهرة قبل أي تفاعل.</span></li>
          <li class="bai-demo-step"><span class="bai-demo-step__num">2</span><span><strong>ابدأ ببيانات تجريبية</strong>زر واحد يملأ السيناريو أو يشغّل نموذجاً جاهزاً.</span></li>
          <li class="bai-demo-step"><span class="bai-demo-step__num">3</span><span><strong>راجع نتيجة منظمة</strong>KPIs وملخص وتوصيات وخطوات تالية قابلة للنسخ.</span></li>
          <li class="bai-demo-step"><span class="bai-demo-step__num">4</span><span><strong>حوّل إلى طلب فعلي</strong>CTA واضح للتطبيق على بيانات المنشأة أو واتساب.</span></li>
        </ol>
      </div>
    `;

    const hero = $(".hero, .hero-section, header.hero, main > section:first-of-type");
    if (hero && hero.parentNode) hero.insertAdjacentElement("afterend", panel);
    else firstMainContainer().insertAdjacentElement("afterbegin", panel);
  }

  function createResultsPanel() {
    if ($(".bai-demo-results")) return;
    const data = {
      page: config.key,
      summary: config.resultSummary,
      kpis: config.kpis,
      recommendations: config.recommendations
    };
    const section = document.createElement("section");
    section.className = "bai-demo-results";
    section.setAttribute("aria-labelledby", "bai-demo-results-title");
    section.innerHTML = `
      <span class="bai-demo-eyebrow">شكل النتيجة المتوقع</span>
      <h2 id="bai-demo-results-title">${escapeHtml(config.resultTitle)}</h2>
      <p>${escapeHtml(config.resultSummary)}</p>
      <div class="bai-demo-state" data-state="success">
        <strong>حالة التجربة</strong>
        <span>جاهزة للاستخدام. إذا لم تُدخل بيانات بعد، استخدم أحد الأمثلة الجاهزة ثم انسخ النتيجة أو حمّلها.</span>
      </div>
      <div class="bai-demo-result-grid">
        ${config.kpis.map(function (kpi) {
          return `<div class="bai-demo-kpi"><span>${escapeHtml(kpi[0])}</span><strong>${escapeHtml(kpi[1])}</strong></div>`;
        }).join("")}
      </div>
      <div class="bai-demo-output">
        <article class="bai-demo-output-card">
          <h3>نقاط عملية</h3>
          <ul>${config.recommendations.map(function (item) { return `<li>${escapeHtml(item)}</li>`; }).join("")}</ul>
        </article>
        <article class="bai-demo-output-card">
          <h3>JSON مختصر</h3>
          <pre data-demo-json>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
        </article>
      </div>
      <div class="bai-demo-result-actions">
        <button class="bai-demo-action" type="button" data-demo-copy>نسخ النتيجة</button>
        <button class="bai-demo-action" type="button" data-demo-download>تحميل JSON</button>
        <a class="bai-demo-action bai-demo-action--whatsapp" href="${WHATSAPP}&text=${encodeURIComponent("السلام عليكم، أريد تطبيق هذه التجربة على بيانات منشأتي: " + window.location.href)}" target="_blank" rel="noopener">تطبيقها على بياناتك</a>
      </div>
    `;

    const target = config.secondaryTarget ? $(config.secondaryTarget) : null;
    if (target && target.parentNode) target.insertAdjacentElement("afterend", section);
    else firstMainContainer().insertAdjacentElement("beforeend", section);
  }

  function createServicesCompare() {
    if (config.key !== "services" || $(".bai-demo-services-compare")) return;
    const section = document.createElement("section");
    section.className = "bai-demo-services-compare";
    section.innerHTML = `
      <span class="bai-demo-eyebrow">مقارنة سريعة</span>
      <h2>كيف تختار المنتج المناسب؟</h2>
      <p>ابدأ من المشكلة التشغيلية، ثم اختر المنتج الذي يملك تجربة فورية، وبعدها أضفه للسلة أو اطلب نسخة مخصصة.</p>
      <div class="bai-demo-services-compare__grid">
        <div class="bai-demo-services-compare__item"><strong>تحليل وبيانات</strong><span>مناسب عندما تحتاج لوحة مؤشرات، جودة بيانات، أو تقرير تنفيذي.</span></div>
        <div class="bai-demo-services-compare__item"><strong>أتمتة ووكلاء</strong><span>مناسب للمهام المتكررة وخدمة العملاء والمبيعات والمتابعة.</span></div>
        <div class="bai-demo-services-compare__item"><strong>قطاع صحي وتعليمي</strong><span>مناسب عندما تكون الحوكمة، الخصوصية، وتجربة المستخدم المتخصصة مهمة.</span></div>
        <div class="bai-demo-services-compare__item"><strong>تخصيص مؤسسي</strong><span>اختره عندما تحتاج ربطاً مع أنظمتك أو بياناتك الداخلية.</span></div>
      </div>
    `;
    const products = $("#productsGrid");
    if (products && products.parentNode) products.parentNode.insertBefore(section, products);
  }

  function createChatScenarios() {
    if (!config.chatScenarios || $(".bai-demo-chat-scenarios")) return;
    const container = $(".chat-container");
    if (!container || !container.parentNode) return;
    const scenarios = document.createElement("div");
    scenarios.className = "bai-demo-chat-scenarios";
    scenarios.setAttribute("aria-label", "سيناريوهات جاهزة");
    scenarios.innerHTML = config.chatScenarios.map(function (item, index) {
      return `<button type="button" data-chat-scenario="${index}">${escapeHtml(item[0])}</button>`;
    }).join("");
    container.insertAdjacentElement("beforebegin", scenarios);

    const board = document.createElement("div");
    board.className = "bai-demo-mini-board";
    const boardItems = config.board || [
      ["تصنيف التذكرة", "جاهز", 72],
      ["الاستعجال", "متوسط", 58],
      ["إجراء مقترح", "متابعة", 64]
    ];
    board.innerHTML = boardItems.map(function (item) {
      return `<div class="bai-demo-mini-board__card"><strong>${escapeHtml(item[0])}</strong><span>${escapeHtml(item[1])}</span><div class="bai-demo-progress" aria-hidden="true"><span style="width:${Number(item[2]) || 60}%"></span></div></div>`;
    }).join("");
    scenarios.insertAdjacentElement("afterend", board);
  }

  function createHealthStatus() {
    if (config.key !== "health" || $(".bai-demo-status-grid")) return;
    const trySection = $("#try") || firstMainContainer();
    const grid = document.createElement("div");
    grid.className = "bai-demo-status-grid bai-demo-shell";
    grid.setAttribute("aria-label", "تصنيف المؤشرات الحيوية");
    grid.innerHTML = `
      <div class="bai-demo-status" data-tone="normal"><strong>طبيعي</strong><p>قراءات مستقرة، المتابعة الروتينية كافية حسب بروتوكول المنشأة.</p></div>
      <div class="bai-demo-status" data-tone="attention"><strong>يحتاج انتباه</strong><p>مؤشر خارج النطاق المثالي ويحتاج مراجعة أو إعادة قياس.</p></div>
      <div class="bai-demo-status" data-tone="danger"><strong>خطر</strong><p>توصية بتصعيد فوري للطبيب أو الطوارئ وفق سياسة المنشأة.</p></div>
    `;
    trySection.insertAdjacentElement("afterbegin", grid);
  }

  function applySample(sample) {
    if (sample.click && clickTarget(sample.click)) {
      toast("تم تشغيل البيانات التجريبية.");
      return;
    }
    if (sample.target && setField(sample.target, sample.fill || "")) {
      const input = $(sample.target);
      if (input && input.id === "searchInput" && typeof window.renderProducts === "function") window.renderProducts();
      toast("تمت تعبئة المثال التجريبي.");
      return;
    }
    if (sample.health) {
      renderHealthExample(sample.health);
      return;
    }
    if (sample.ocr) {
      renderOcrExample(sample.ocr);
      return;
    }
    if (sample.interview) {
      renderInterviewExample(sample.interview);
      return;
    }
    if (sample.nav && window.app && typeof window.app.navigate === "function") {
      window.app.navigate(sample.nav);
      toast("تم فتح تبويب " + sample.label + ".");
      return;
    }
    toast("المثال جاهز، انتقل إلى منطقة التجربة.");
    scrollToTarget(config.primaryTarget);
  }

  function renderHealthExample(kind) {
    const map = {
      normal: ["طبيعي", "78", "97%", "120/80", "لا توجد مؤشرات حرجة في القراءة التجريبية."],
      attention: ["يحتاج انتباه", "104", "94%", "145/92", "يوصى بإعادة القياس ومراجعة السياق السريري."],
      danger: ["خطر", "132", "88%", "170/108", "تصعيد فوري للطبيب أو الطوارئ حسب البروتوكول."]
    };
    const values = map[kind] || map.normal;
    const panel = $(".bai-demo-results");
    if (panel) {
      $all(".bai-demo-kpi strong", panel).forEach(function (node, index) {
        node.textContent = [values[1], values[2], values[3], values[0]][index] || node.textContent;
      });
      const state = $(".bai-demo-state", panel);
      if (state) {
        state.dataset.state = kind === "danger" ? "error" : kind === "attention" ? "loading" : "success";
        state.innerHTML = `<strong>${values[0]}</strong><span>${values[4]}</span>`;
      }
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toast("تم عرض مثال المؤشرات الحيوية.");
  }

  function renderOcrExample(type) {
    const examples = {
      invoice: {
        title: "فاتورة ضريبية",
        data: { document_type: "Tax Invoice", invoice_number: "INV-2481", supplier: "شركة توريد الرياض", vat_number: "300000000000003", total: "18,420 SAR", vat: "2,402 SAR", missing: ["ختم المورد غير واضح"] }
      },
      id: {
        title: "هوية وطنية",
        data: { document_type: "National ID", name: "محمد عبدالله", id_number: "1XXXXXXXXX", expiry_date: "1449/05/12", confidence: "92%", missing: ["إخفاء الرقم الكامل مطلوب قبل المشاركة"] }
      },
      contract: {
        title: "عقد توريد",
        data: { document_type: "Supply Contract", party: "مؤسسة تشغيل", value: "240,000 SAR", term: "12 months", renewal: "automatic", missing: ["بند الجزاءات يحتاج مراجعة قانونية"] }
      }
    };
    const item = examples[type] || examples.invoice;
    const output = $("#ocr-output");
    const json = $("#ocr-json");
    if (output) {
      output.innerHTML = `
        <div class="fields-header">نتيجة مثال: ${escapeHtml(item.title)}</div>
        ${Object.keys(item.data).map(function (key) {
          return `<div class="field-row"><span class="field-label">${escapeHtml(key)}</span><span class="field-value">${escapeHtml(Array.isArray(item.data[key]) ? item.data[key].join("، ") : item.data[key])}</span></div>`;
        }).join("")}
        <div class="ocr-result-cta"><span>النتيجة جاهزة للنسخ أو التخصيص على نماذج شركتك.</span><a class="btn-primary" href="/consultation/">اطلب OCR مخصص</a></div>
      `;
    }
    if (json) json.textContent = JSON.stringify(item.data, null, 2);
    scrollToTarget("#ocr-output");
    toast("تم تحميل مثال OCR جاهز.");
  }

  function renderInterviewExample(type) {
    const jobs = {
      data: "نبحث عن محلل بيانات يجيد SQL وPower BI، يفهم مؤشرات المبيعات، ويستطيع تحويل البيانات إلى توصيات للإدارة.",
      support: "نبحث عن مسؤول دعم عملاء يجيد التعامل مع واتساب، إدارة الشكاوى، وتصعيد الحالات الحرجة بنبرة مهنية.",
      project: "نبحث عن مدير مشروع يتابع الفرق، يحدد المخاطر، يكتب تقارير أسبوعية، ويقود تنفيذ منتجات رقمية."
    };
    setField("#jobDescription", jobs[type] || jobs.data);
    const results = $("#analysisResults");
    if (results) {
      results.style.display = "block";
      const summary = $("#analysisSummary");
      const improvements = $("#cvImprovements");
      if (summary) summary.innerHTML = "<p>Score تجريبي: 82%. المرشح قوي في المتطلبات الأساسية ويحتاج أمثلة أعمق على أثر الأعمال.</p>";
      if (improvements) improvements.innerHTML = "<ul><li>أضف إنجازات رقمية واضحة.</li><li>اربط الخبرات بمتطلبات الوظيفة.</li><li>جهّز إجابة لموقف عملي مشابه.</li></ul>";
      scrollToTarget("#analysisResults");
    }
    toast("تمت تعبئة وصف وظيفي تجريبي.");
  }

  function enhanceForms() {
    $all("textarea").forEach(function (field) {
      field.setAttribute("dir", "auto");
      field.addEventListener("input", function () {
        field.style.blockSize = "auto";
        field.style.blockSize = Math.min(field.scrollHeight, 420) + "px";
      });
    });

    $all("input, textarea, select").forEach(function (field) {
      if (!field.getAttribute("aria-label")) {
        const label = field.id ? document.querySelector("label[for='" + CSS.escape(field.id) + "']") : null;
        if (label) field.setAttribute("aria-label", label.textContent.trim());
        else if (field.placeholder) field.setAttribute("aria-label", field.placeholder);
      }
      field.addEventListener("invalid", function (event) {
        event.preventDefault();
        showFieldError(field, field.validationMessage || "راجع هذا الحقل قبل المتابعة.");
      });
      field.addEventListener("input", function () {
        const next = field.parentElement && field.parentElement.querySelector(".bai-demo-sr-error");
        if (next) next.remove();
      });
    });
  }

  function showFieldError(field, message) {
    if (!field.parentElement) return;
    const old = field.parentElement.querySelector(".bai-demo-sr-error");
    if (old) old.remove();
    const error = document.createElement("div");
    error.className = "bai-demo-sr-error";
    error.setAttribute("role", "alert");
    error.textContent = message;
    field.parentElement.appendChild(error);
  }

  function enhanceLoadingStates() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("button, .btn, .btn-main, .btn-primary, .cta-button");
      if (!button || button.disabled) return;
      const text = (button.textContent || "").trim();
      if (!/(تحليل|توليد|إرسال|تشغيل|جرّب|جرب|بحث|استخراج|معالجة)/.test(text)) return;
      button.classList.add("demo-loading");
      button.setAttribute("aria-busy", "true");
      window.setTimeout(function () {
        button.classList.remove("demo-loading");
        button.removeAttribute("aria-busy");
      }, 1800);
    }, true);
  }

  function bindActions() {
    document.addEventListener("click", function (event) {
      const scrollButton = event.target.closest("[data-demo-scroll]");
      if (scrollButton) {
        scrollToTarget(scrollButton.getAttribute("data-demo-scroll"));
        return;
      }
      const sampleButton = event.target.closest("[data-sample-index]");
      if (sampleButton) {
        const sample = (config.samples || [])[Number(sampleButton.getAttribute("data-sample-index"))];
        if (sample) applySample(sample);
        return;
      }
      const chatButton = event.target.closest("[data-chat-scenario]");
      if (chatButton && config.chatScenarios) {
        const scenario = config.chatScenarios[Number(chatButton.getAttribute("data-chat-scenario"))];
        if (scenario) {
          setField("#userInput", scenario[1]);
          toast("تمت تعبئة سيناريو المحادثة.");
        }
        return;
      }
      if (event.target.closest("[data-demo-copy]")) {
        const text = ($("[data-demo-json]") && $("[data-demo-json]").textContent) || config.resultSummary;
        copyText(text).then(function () { toast("تم نسخ النتيجة."); });
        return;
      }
      if (event.target.closest("[data-demo-download]")) {
        const text = ($("[data-demo-json]") && $("[data-demo-json]").textContent) || JSON.stringify(config, null, 2);
        downloadText("brightai-demo-result-" + config.key + ".json", text);
        toast("تم تحميل ملف JSON.");
      }
    });
  }

  function updateServicesButtons() {
    if (config.key !== "services") return;
    const update = function () {
      $all(".product-card").forEach(function (card) {
        if (card.querySelector(".bai-demo-try-copy")) return;
        const actions = $(".product-actions", card);
        if (!actions) return;
        const demo = Array.from(actions.querySelectorAll("a")).find(function (link) {
          return /جرّب|جرب|النموذج|Bright/.test(link.textContent || "") && /\/(try|demo|health|interview|ai-bots|ai-scolecs|smart-medical-archive)\//.test(link.href);
        });
        if (demo) {
          demo.textContent = "جرّب قبل الشراء";
          demo.classList.add("bai-demo-try-copy");
        }
      });
    };
    update();
    const grid = $("#productsGrid");
    if (grid) new MutationObserver(update).observe(grid, { childList: true, subtree: true });
  }

  function optimizeMedia() {
    $all("img").forEach(function (img, index) {
      if (!img.loading && index > 0) img.loading = "lazy";
      if (!img.decoding) img.decoding = "async";
    });
  }

  ready(function () {
    document.documentElement.classList.add("bai-demo-experience");
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar-SA");
    createCommandPanel();
    createServicesCompare();
    createChatScenarios();
    createHealthStatus();
    createResultsPanel();
    enhanceForms();
    enhanceLoadingStates();
    bindActions();
    updateServicesButtons();
    optimizeMedia();
  });
})();
