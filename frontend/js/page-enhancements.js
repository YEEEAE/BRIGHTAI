(function () {
  if (window.BrightPageEnhancer) return;

  let normalizePathname = function defaultNormalize(pathname) {
    if (!pathname || pathname === "/") return "/";
    return pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  };

  const SERVICE_CONFIG = [
    {
      key: "ai-agent",
      prefix: "/frontend/pages/ai-agent",
      title: "AI Agent",
      before: "تشغيل يدوي متكرر، بطء في الرد، وتباين في جودة الخدمة.",
      after: "وكلاء ذكية تعمل 24/7، استجابة أسرع، وجودة تشغيل مستقرة.",
      demoHref: "/frontend/pages/demo/index.html",
      demoLabel: "جرّب الآن مجاناً"
    },
    {
      key: "smart-automation",
      prefix: "/frontend/pages/smart-automation",
      title: "الأتمتة الذكية",
      before: "عمليات يدوية وهدر ساعات تشغيل يومي.",
      after: "تدفقات مؤتمتة قابلة للقياس مع خفض التكاليف التشغيلية.",
      demoHref: "/frontend/pages/demo/ocr-demo/index.html",
      demoLabel: "شاهد الديمو المباشر"
    },
    {
      key: "data-analysis",
      prefix: "/frontend/pages/data-analysis",
      title: "تحليل البيانات",
      before: "تقارير متأخرة بدون رؤية تنفيذية.",
      after: "لوحات تفاعلية وقرارات أسرع مبنية على بيانات لحظية.",
      demoHref: "/frontend/pages/try/data-analyzer/index.html",
      demoLabel: "استعرض Dashboard تفاعلي"
    },
    {
      key: "consultation",
      prefix: "/frontend/pages/consultation",
      title: "الاستشارات",
      before: "خارطة طريق غير واضحة وقرارات متفرقة.",
      after: "تشخيص واضح + خطة تنفيذ على مراحل بقياسات KPI.",
      demoHref: "/frontend/pages/contact/index.html",
      demoLabel: "ابدأ جلسة تشخيص"
    },
    {
      key: "ai-bots",
      prefix: "/frontend/pages/ai-bots",
      title: "بوتات AI",
      before: "دعم متقطع وتجربة عميل غير متسقة.",
      after: "بوتات متخصصة للمبيعات/الدعم/التوظيف مع تفاعل أعلى.",
      demoHref: "/frontend/pages/ai-bots/BrightSupport/index.html",
      demoLabel: "جرّب بوت حي"
    }
  ];

  function getMain() {
    return document.querySelector("main") || document.body;
  }

  function createSection(id, title, html) {
    const section = document.createElement("section");
    section.id = id;
    section.className = "glass-card p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 mt-10";
    section.innerHTML = `<h2 class=\"text-2xl md:text-3xl font-bold text-white mb-4\">${title}</h2>${html}`;
    return section;
  }

  function appendToMain(section) {
    const main = getMain();
    const anchor = Array.from(main.children).reverse().find((el) => el.tagName !== "SCRIPT");
    if (anchor && anchor.parentNode === main) {
      anchor.insertAdjacentElement("afterend", section);
      return;
    }
    main.appendChild(section);
  }

  function animateCounters(container) {
    const counters = container.querySelectorAll("[data-counter-target]");
    if (!counters.length) return;

    const run = () => {
      counters.forEach((el) => {
        const target = Number(el.getAttribute("data-counter-target") || "0");
        const suffix = el.getAttribute("data-counter-suffix") || "";
        const duration = 1200;
        const startAt = performance.now();

        const tick = (now) => {
          const progress = Math.min(1, (now - startAt) / duration);
          const value = Math.floor(progress * target);
          el.textContent = `${value}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run();
          io.disconnect();
        });
      }, { threshold: 0.25 });
      io.observe(container);
    } else {
      run();
    }
  }

  function injectSocialProof() {
    if (document.getElementById("bright-social-proof")) return;
    const section = createSection(
      "bright-social-proof",
      "نتائج مثبتة في السوق السعودي",
      `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article class="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
            <p class="text-3xl font-black text-indigo-300" data-counter-target="200" data-counter-suffix="+">0</p>
            <p class="text-slate-300 mt-2">شركة استفادت من حلولنا</p>
          </article>
          <article class="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
            <p class="text-3xl font-black text-emerald-300" data-counter-target="60" data-counter-suffix="%">0</p>
            <p class="text-slate-300 mt-2">خفض متوسط في التكاليف التشغيلية</p>
          </article>
          <article class="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
            <p class="text-3xl font-black text-cyan-300" data-counter-target="35" data-counter-suffix="%">0</p>
            <p class="text-slate-300 mt-2">تحسن في سرعة اتخاذ القرار</p>
          </article>
        </div>
      `
    );

    const main = getMain();
    const firstContent = main.querySelector("section, article, .doc-content") || main.firstElementChild;
    if (firstContent) {
      firstContent.insertAdjacentElement("afterend", section);
    } else {
      main.prepend(section);
    }

    animateCounters(section);
  }

  function injectComparisonTable(config) {
    if (document.getElementById("bright-service-comparison")) return;
    const section = createSection(
      "bright-service-comparison",
      `قبل ${config.title} vs بعد ${config.title}`,
      `
        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead>
              <tr class="border-b border-white/15">
                <th class="p-3 text-slate-300">المحور</th>
                <th class="p-3 text-rose-300">قبل التطبيق</th>
                <th class="p-3 text-emerald-300">بعد التطبيق</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-white/10">
                <td class="p-3 text-white">الوضع التشغيلي</td>
                <td class="p-3 text-slate-300">${config.before}</td>
                <td class="p-3 text-slate-200">${config.after}</td>
              </tr>
              <tr class="border-b border-white/10">
                <td class="p-3 text-white">سرعة الإنجاز</td>
                <td class="p-3 text-slate-300">اعتماد كبير على الإجراءات اليدوية</td>
                <td class="p-3 text-slate-200">تسريع دورة العمل مع أتمتة دقيقة</td>
              </tr>
              <tr>
                <td class="p-3 text-white">الأثر التجاري</td>
                <td class="p-3 text-slate-300">نتائج متذبذبة وصعوبة القياس</td>
                <td class="p-3 text-slate-200">KPI واضح وتحسن قابل للقياس</td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    );
    appendToMain(section);
  }

  function injectServiceFaq(config) {
    const existingFaqItems = document.querySelectorAll(".faq-item");
    if (existingFaqItems.length >= 3) return;
    if (document.getElementById("bright-service-faq")) return;

    const section = createSection(
      "bright-service-faq",
      "الأسئلة الشائعة",
      `
        <div class="space-y-3" id="bright-faq-list">
          <article class="border border-white/10 rounded-xl overflow-hidden">
            <button class="w-full text-right p-4 text-white font-bold bg-white/5" data-faq-btn>وش أسرع مدة للبدء؟</button>
            <div class="p-4 text-slate-300 hidden" data-faq-body>غالباً نبدأ نسخة تشغيلية أولية خلال 2-6 أسابيع حسب التكاملات المطلوبة.</div>
          </article>
          <article class="border border-white/10 rounded-xl overflow-hidden">
            <button class="w-full text-right p-4 text-white font-bold bg-white/5" data-faq-btn>كيف نقيس نجاح ${config.title}؟</button>
            <div class="p-4 text-slate-300 hidden" data-faq-body>نعتمد KPI متفق عليه مسبقاً مثل زمن الإنجاز، معدل التحويل، أو نسبة التوفير المالي.</div>
          </article>
          <article class="border border-white/10 rounded-xl overflow-hidden">
            <button class="w-full text-right p-4 text-white font-bold bg-white/5" data-faq-btn>هل الحل مناسب للقطاع السعودي؟</button>
            <div class="p-4 text-slate-300 hidden" data-faq-body>نعم، نراعي متطلبات الحوكمة المحلية مثل PDPL وضوابط الأمن السيبراني.</div>
          </article>
        </div>
      `
    );

    appendToMain(section);

    section.querySelectorAll("[data-faq-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const body = btn.parentElement.querySelector("[data-faq-body]");
        if (!body) return;
        body.classList.toggle("hidden");
      });
    });
  }

  function injectDemoCta(config) {
    if (document.getElementById("bright-service-demo-cta")) return;
    const section = createSection(
      "bright-service-demo-cta",
      "تجربة مباشرة",
      `
        <p class="text-slate-300 leading-8 mb-4">نقطة مهمة جداً: القرار التقني الصح يبدأ من تجربة فعلية، مو عرض نظري فقط.</p>
        <div class="flex flex-wrap gap-3">
          <a href="${config.demoHref}" class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 text-slate-900 font-bold">${config.demoLabel}</a>
          <a href="/frontend/pages/contact/index.html" class="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-white/25 text-white">تحدث مع فريقنا</a>
        </div>
      `
    );
    appendToMain(section);
  }

  function injectConsultationCalendar() {
    const path = normalizePathname(window.location.pathname);
    if (!path.startsWith("/frontend/pages/consultation")) return;
    if (document.getElementById("bright-calendar-booking")) return;
    if (document.querySelector('iframe[src*="calendly"], iframe[src*="cal.com"]')) return;

    const section = createSection(
      "bright-calendar-booking",
      "حجز موعد مباشر",
      `
        <p class="text-slate-300 mb-4">احجز جلسة عبر Calendly أو Cal.com مباشرة. في حال منع التضمين من مزود الخدمة يمكنك الفتح في تبويب جديد.</p>
        <div class="flex flex-wrap gap-3 mb-4">
          <button class="px-4 py-2 rounded-lg border border-white/20 text-white" type="button" data-calendar-src="https://calendly.com/">Calendly</button>
          <button class="px-4 py-2 rounded-lg border border-white/20 text-white" type="button" data-calendar-src="https://cal.com/">Cal.com</button>
          <a class="px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-bold" href="https://calendly.com/" target="_blank" rel="noopener noreferrer">فتح صفحة الحجز</a>
        </div>
        <iframe id="bright-calendar-embed" title="Calendar Booking" src="https://calendly.com/" style="width:100%;min-height:420px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#020617;" loading="lazy"></iframe>
      `
    );

    appendToMain(section);

    section.querySelectorAll("[data-calendar-src]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-calendar-src");
        const iframe = section.querySelector("#bright-calendar-embed");
        if (!target || !iframe) return;
        iframe.setAttribute("src", target);
      });
    });
  }

  function injectAutomationRoiCalculator() {
    const path = normalizePathname(window.location.pathname);
    if (!path.startsWith("/frontend/pages/smart-automation")) return;
    if (document.getElementById("roi-employees")) return;
    if (document.getElementById("bright-roi-calculator")) return;

    const section = createSection(
      "bright-roi-calculator",
      "ROI Calculator — الأتمتة الذكية",
      `
        <p class="text-slate-300 mb-4">احسب العائد المتوقع من الأتمتة خلال أقل من دقيقة.</p>
        <div class="grid md:grid-cols-2 gap-4">
          <label class="text-slate-200">عدد الموظفين
            <input class="mt-2 w-full rounded-lg border border-white/20 bg-black/25 text-white px-3 py-2" type="number" min="1" value="20" data-roi-input="employees" />
          </label>
          <label class="text-slate-200">عدد المهام اليومية لكل موظف
            <input class="mt-2 w-full rounded-lg border border-white/20 bg-black/25 text-white px-3 py-2" type="number" min="1" value="15" data-roi-input="tasks" />
          </label>
          <label class="text-slate-200">متوسط دقائق المهمة
            <input class="mt-2 w-full rounded-lg border border-white/20 bg-black/25 text-white px-3 py-2" type="number" min="1" value="6" data-roi-input="minutes" />
          </label>
          <label class="text-slate-200">تكلفة ساعة العمل (ريال)
            <input class="mt-2 w-full rounded-lg border border-white/20 bg-black/25 text-white px-3 py-2" type="number" min="1" value="120" data-roi-input="hourCost" />
          </label>
        </div>
        <div class="mt-4 p-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10">
          <p class="text-emerald-200 font-bold text-lg" id="bright-roi-result">وفر تقديري: -- ريال / شهر</p>
          <p class="text-slate-300 text-sm mt-1" id="bright-roi-hours">ساعات موفرة: -- ساعة / شهر</p>
        </div>
      `
    );
    appendToMain(section);

    const inputs = section.querySelectorAll("[data-roi-input]");
    const resultEl = section.querySelector("#bright-roi-result");
    const hoursEl = section.querySelector("#bright-roi-hours");

    const calculate = () => {
      const employees = Number(section.querySelector('[data-roi-input="employees"]')?.value || 0);
      const tasks = Number(section.querySelector('[data-roi-input="tasks"]')?.value || 0);
      const minutes = Number(section.querySelector('[data-roi-input="minutes"]')?.value || 0);
      const hourCost = Number(section.querySelector('[data-roi-input="hourCost"]')?.value || 0);

      const monthlyManualHours = (employees * tasks * minutes * 22) / 60;
      const monthlySavedHours = monthlyManualHours * 0.55;
      const monthlySavings = Math.round(monthlySavedHours * hourCost);

      if (resultEl) resultEl.textContent = `وفر تقديري: ${monthlySavings.toLocaleString("ar-SA")} ريال / شهر`;
      if (hoursEl) hoursEl.textContent = `ساعات موفرة: ${Math.round(monthlySavedHours).toLocaleString("ar-SA")} ساعة / شهر`;
    };

    inputs.forEach((input) => input.addEventListener("input", calculate));
    calculate();
  }

  function injectDataDashboardSample() {
    const path = normalizePathname(window.location.pathname);
    if (!path.startsWith("/frontend/pages/data-analysis")) return;
    if (document.querySelector(".dashboard-card, #dashboard-lightbox")) return;
    if (document.getElementById("bright-dashboard-sample")) return;

    const section = createSection(
      "bright-dashboard-sample",
      "Sample Dashboard تفاعلي",
      `
        <div class="flex flex-wrap gap-2 mb-4">
          <button type="button" class="px-3 py-1 rounded-full border border-white/20 text-slate-100 bg-indigo-500/25" data-dashboard-tab="sales">المبيعات</button>
          <button type="button" class="px-3 py-1 rounded-full border border-white/20 text-slate-100" data-dashboard-tab="ops">العمليات</button>
          <button type="button" class="px-3 py-1 rounded-full border border-white/20 text-slate-100" data-dashboard-tab="finance">المالية</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="bright-dashboard-cards"></div>
      `
    );
    appendToMain(section);

    const dataMap = {
      sales: [
        { title: "معدل التحويل", value: "18.4%", hint: "+3.2%" },
        { title: "قيمة السلة", value: "420 ريال", hint: "+11%" },
        { title: "تكلفة الاستحواذ", value: "86 ريال", hint: "-9%" }
      ],
      ops: [
        { title: "زمن التنفيذ", value: "2.1 يوم", hint: "-28%" },
        { title: "نسبة الأخطاء", value: "1.7%", hint: "-34%" },
        { title: "SLA الالتزام", value: "96%", hint: "+7%" }
      ],
      finance: [
        { title: "التوفير الشهري", value: "147K ريال", hint: "+22%" },
        { title: "دقة التنبؤ", value: "91%", hint: "+12%" },
        { title: "دورة التحصيل", value: "18 يوم", hint: "-15%" }
      ]
    };

    const cardsHost = section.querySelector("#bright-dashboard-cards");
    const tabs = section.querySelectorAll("[data-dashboard-tab]");

    const render = (tab) => {
      if (!cardsHost || !dataMap[tab]) return;
      cardsHost.innerHTML = dataMap[tab]
        .map((item) => `
          <article class="p-4 rounded-xl border border-white/10 bg-black/20">
            <p class="text-slate-400 text-sm">${item.title}</p>
            <p class="text-2xl font-black text-white mt-1">${item.value}</p>
            <p class="text-emerald-300 text-sm mt-1">${item.hint}</p>
          </article>
        `)
        .join("");
    };

    tabs.forEach((tabButton) => {
      tabButton.addEventListener("click", () => {
        const tab = tabButton.getAttribute("data-dashboard-tab");
        tabs.forEach((btn) => {
          const active = btn === tabButton;
          btn.className = active
            ? "px-3 py-1 rounded-full border border-white/20 text-slate-100 bg-indigo-500/25"
            : "px-3 py-1 rounded-full border border-white/20 text-slate-100";
        });
        render(tab);
      });
    });

    render("sales");
  }

  function injectAiBotsLiveDemos() {
    const path = normalizePathname(window.location.pathname);
    if (!path.startsWith("/frontend/pages/ai-bots")) return;
    if (document.getElementById("bright-ai-bots-live-demos")) return;

    const section = createSection(
      "bright-ai-bots-live-demos",
      "Live Demo للبوتات",
      `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article class="rounded-xl border border-white/15 overflow-hidden bg-black/20">
            <header class="p-3 text-white font-bold">BrightSupport</header>
            <iframe src="/frontend/pages/ai-bots/BrightSupport/index.html" title="BrightSupport Demo" style="width:100%;height:260px;border:0;"></iframe>
          </article>
          <article class="rounded-xl border border-white/15 overflow-hidden bg-black/20">
            <header class="p-3 text-white font-bold">BrightSales</header>
            <iframe src="/frontend/pages/ai-bots/BrightSales/index.html" title="BrightSales Demo" style="width:100%;height:260px;border:0;"></iframe>
          </article>
          <article class="rounded-xl border border-white/15 overflow-hidden bg-black/20">
            <header class="p-3 text-white font-bold">BrightRecruiter</header>
            <iframe src="/frontend/pages/ai-bots/BrightRecruiter/index.html" title="BrightRecruiter Demo" style="width:100%;height:260px;border:0;"></iframe>
          </article>
        </div>
      `
    );

    appendToMain(section);
  }

  function applyServiceEnhancements() {
    const path = normalizePathname(window.location.pathname);
    const config = SERVICE_CONFIG.find((item) => path.startsWith(item.prefix));
    if (!config) return;

    injectSocialProof();
    injectComparisonTable(config);
    injectServiceFaq(config);
    injectDemoCta(config);
    injectConsultationCalendar();
    injectAiBotsLiveDemos();
    injectAutomationRoiCalculator();
    injectDataDashboardSample();
  }

  function classifyTopic(text) {
    const v = String(text || "").toLowerCase();
    if (/أتمتة|automation|workflow|process|hr|production|agent|bot/.test(v)) return "automation";
    if (/بيانات|data|analytics|dashboard|bi|تحليل/.test(v)) return "data";
    if (/أمن|nca|compliance|security/.test(v)) return "security";
    if (/صحة|طبي|medical|health|hospital/.test(v)) return "healthcare";
    return "other";
  }

  function applyBlogIndexEnhancements() {
    const path = normalizePathname(window.location.pathname);
    if (
      !(
        path === "/frontend/pages/blog" ||
        path === "/frontend/pages/blog/index" ||
        path === "/frontend/pages/blog/index.html"
      )
    ) {
      return;
    }

    const blogSection = document.getElementById("blog-index");
    if (!blogSection) return;

    const cards = Array.from(blogSection.querySelectorAll("article"));
    if (!cards.length) return;
    const cardImages = Array.from(blogSection.querySelectorAll("img"));
    cardImages.forEach((image, index) => {
      if (!image.hasAttribute("loading")) image.loading = index === 0 ? "eager" : "lazy";
      if (!image.hasAttribute("decoding")) image.decoding = "async";
      if (!image.hasAttribute("fetchpriority")) image.setAttribute("fetchpriority", index === 0 ? "high" : "auto");
    });

    if (!document.getElementById("bright-blog-featured")) {
      const firstLink = cards[0].querySelector("a[href]");
      const firstTitle = cards[0].querySelector("h4")?.textContent?.trim() || "مقال مميز";
      const featured = document.createElement("section");
      featured.id = "bright-blog-featured";
      featured.className = "glass-card rounded-2xl border border-indigo-400/25 p-8 mb-8";
      featured.innerHTML = `
        <p class="text-xs uppercase tracking-wider text-indigo-300 mb-2">Featured Article</p>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-3">${firstTitle}</h2>
        <p class="text-slate-300 mb-4">اختيارنا لليوم من مكتبة Bright AI. مناسب للمدراء التنفيذيين وفرق التقنية.</p>
        <a class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-500 text-white font-bold" href="${firstLink?.getAttribute("href") || "/frontend/pages/blog/index.html"}">اقرأ المقال</a>
      `;
      blogSection.parentElement?.insertBefore(featured, blogSection);
    }

    if (!document.getElementById("bright-blog-controls")) {
      const controls = document.createElement("div");
      controls.id = "bright-blog-controls";
      controls.className = "mb-8 rounded-2xl border border-white/10 bg-white/5 p-4";
      controls.innerHTML = `
        <div class="flex flex-wrap gap-2 mb-3" id="bright-blog-filters">
          <button class="px-3 py-1 rounded-full text-sm bg-indigo-500/30 text-white" data-topic="all">الكل</button>
          <button class="px-3 py-1 rounded-full text-sm border border-white/20 text-slate-200" data-topic="automation">أتمتة</button>
          <button class="px-3 py-1 rounded-full text-sm border border-white/20 text-slate-200" data-topic="data">بيانات</button>
          <button class="px-3 py-1 rounded-full text-sm border border-white/20 text-slate-200" data-topic="security">أمن</button>
          <button class="px-3 py-1 rounded-full text-sm border border-white/20 text-slate-200" data-topic="healthcare">الرعاية الصحية</button>
        </div>
        <div>
          <input id="bright-blog-search" type="search" class="w-full rounded-lg border border-white/15 bg-black/20 text-white px-3 py-2" placeholder="ابحث داخل المدونة..." />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button id="bright-blog-site-search" type="button" class="px-3 py-1 rounded-lg border border-cyan-400/40 text-cyan-300">بحث شامل عبر Search.js</button>
        </div>
      `;
      blogSection.prepend(controls);

      cards.forEach((card) => {
        const title = card.querySelector("h4")?.textContent || "";
        const href = card.querySelector("a[href]")?.getAttribute("href") || "";
        card.dataset.topic = classifyTopic(`${title} ${href}`);
      });

      let activeTopic = "all";
      const searchInput = controls.querySelector("#bright-blog-search");
      const siteSearchButton = controls.querySelector("#bright-blog-site-search");
      const filterButtons = controls.querySelectorAll("[data-topic]");

      const applyFilter = () => {
        const q = String(searchInput?.value || "").trim().toLowerCase();
        cards.forEach((card) => {
          const topicOk = activeTopic === "all" || card.dataset.topic === activeTopic;
          const text = (card.textContent || "").toLowerCase();
          const searchOk = !q || text.includes(q);
          card.style.display = topicOk && searchOk ? "" : "none";
        });
      };

      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTopic = btn.getAttribute("data-topic") || "all";
          filterButtons.forEach((b) => {
            const selected = b === btn;
            b.className = selected
              ? "px-3 py-1 rounded-full text-sm bg-indigo-500/30 text-white"
              : "px-3 py-1 rounded-full text-sm border border-white/20 text-slate-200";
          });
          applyFilter();
        });
      });

      searchInput?.addEventListener("input", applyFilter);
      searchInput?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        siteSearchButton?.click();
      });

      siteSearchButton?.addEventListener("click", () => {
        const query = String(searchInput?.value || "").trim();
        if (window.brightSearch && typeof window.brightSearch.open === "function") {
          window.brightSearch.open();
          const modalInput = document.getElementById("searchInput");
          if (modalInput) {
            modalInput.value = query;
            modalInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          return;
        }
        if (query) {
          window.location.href = `/frontend/pages/blog/index.html?q=${encodeURIComponent(query)}`;
        }
      });

      const initialQuery = new URLSearchParams(window.location.search).get("q");
      if (initialQuery) {
        searchInput.value = initialQuery;
        applyFilter();
      }
    }

    if (!document.getElementById("bright-blog-newsletter")) {
      const newsletter = document.createElement("section");
      newsletter.id = "bright-blog-newsletter";
      newsletter.className = "glass-card rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6 my-10";
      newsletter.innerHTML = `
        <h3 class="text-2xl font-bold text-white mb-2">اشترك في نشرة Bright AI</h3>
        <p class="text-slate-200 mb-4">ملخص أسبوعي لأهم المستجدات في الذكاء الاصطناعي بالسوق السعودي.</p>
        <form class="flex flex-col md:flex-row gap-3" id="bright-newsletter-form">
          <input type="email" required placeholder="البريد الإلكتروني" class="flex-1 rounded-lg border border-white/25 bg-black/20 text-white px-3 py-2" />
          <button class="px-5 py-2 rounded-lg bg-cyan-500 text-slate-900 font-bold" type="submit">اشترك</button>
        </form>
      `;
      const middleCard = cards[Math.floor(cards.length / 2)];
      const parent = middleCard?.parentElement;
      if (parent && parent.contains(middleCard)) {
        const isGridParent = window.getComputedStyle(parent).display.includes("grid");
        if (isGridParent) {
          newsletter.style.gridColumn = "1 / -1";
        }
        middleCard.insertAdjacentElement("afterend", newsletter);
      } else {
        blogSection.appendChild(newsletter);
      }

      newsletter.querySelector("#bright-newsletter-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = newsletter.querySelector("input[type='email']").value.trim();
        if (!email) return;
        window.location.href = `mailto:yazeed1job@gmail.com?subject=${encodeURIComponent("Newsletter Subscription")}&body=${encodeURIComponent(email)}`;
      });
    }
  }

  function applyContactEnhancements() {
    const path = normalizePathname(window.location.pathname);
    if (!path.startsWith("/frontend/pages/contact")) return;

    if (!document.getElementById("bright-contact-whatsapp-float")) {
      const btn = document.createElement("a");
      btn.id = "bright-contact-whatsapp-float";
      btn.href = "https://wa.me/966538229013";
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.setAttribute("aria-label", "تواصل واتساب");
      btn.style.cssText = "position:fixed;right:1rem;bottom:5.5rem;z-index:70;width:54px;height:54px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#10b981,#06b6d4);color:white;box-shadow:0 12px 24px rgba(6,182,212,.35);";
      btn.innerHTML = "<iconify-icon icon='logos:whatsapp-icon' width='24'></iconify-icon>";
      document.body.appendChild(btn);
    }

    document.querySelectorAll("a[href*='goo.gl/maps/example']").forEach((link) => {
      link.href = "https://maps.google.com/?q=24.7136,46.6753";
    });

    const mapPlaceholder = Array.from(document.querySelectorAll("p, a")).find((el) =>
      /خريطة جوجل|خرائط/i.test(el.textContent || "")
    );
    if (mapPlaceholder && !document.getElementById("bright-contact-map-embed")) {
      const host = mapPlaceholder.closest(".glass-card") || mapPlaceholder.parentElement;
      if (host) {
        host.innerHTML = `
          <iframe id="bright-contact-map-embed" title="Bright AI Riyadh Map" style="width:100%;height:100%;min-height:300px;border:0;border-radius:12px;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=24.7136,46.6753&z=14&output=embed"></iframe>
          <a href="https://maps.google.com/?q=24.7136,46.6753" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:8px;color:#67e8f9;text-align:center;">افتح في خرائط Google</a>
        `;
      }
    }

    const existingContactForm = document.querySelector(
      "form#contact-form, form#bright-contact-form, form[name='contact'], form[data-form-type='contact'], form[action*='contact']"
    );
    if (existingContactForm) {
      if (!existingContactForm.querySelector("select[name='subject']")) {
        const subjectSelect = document.createElement("select");
        subjectSelect.name = "subject";
        subjectSelect.required = true;
        subjectSelect.className = "w-full rounded-lg border border-white/20 bg-black/20 text-white px-3 py-2";
        subjectSelect.innerHTML = `
          <option value="">اختر موضوع التواصل</option>
          <option value="sales">استفسار مبيعات</option>
          <option value="technical">استفسار تقني</option>
          <option value="partnership">شراكة</option>
          <option value="other">أخرى</option>
        `;
        const firstTextArea = existingContactForm.querySelector("textarea");
        if (firstTextArea) {
          firstTextArea.insertAdjacentElement("beforebegin", subjectSelect);
        } else {
          existingContactForm.appendChild(subjectSelect);
        }
      }

      if (!existingContactForm.querySelector("[data-contact-response-time]")) {
        const note = document.createElement("p");
        note.setAttribute("data-contact-response-time", "true");
        note.className = "text-slate-300 text-sm mt-3";
        note.textContent = "نرد غالباً خلال 24 ساعة عمل.";
        existingContactForm.appendChild(note);
      }
    }

    if (!existingContactForm && !document.getElementById("bright-contact-form-block")) {
      const section = document.createElement("section");
      section.id = "bright-contact-form-block";
      section.className = "max-w-4xl mx-auto mt-12 rounded-2xl border border-white/10 bg-white/5 p-6";
      section.innerHTML = `
        <h2 class="text-2xl font-bold text-white mb-2">أرسل طلبك الآن</h2>
        <p class="text-slate-300 mb-4">معلومة مهمة: نرد غالباً خلال 24 ساعة عمل.</p>
        <form id="bright-contact-form" class="space-y-3">
          <div class="grid md:grid-cols-2 gap-3">
            <input required type="text" name="name" placeholder="الاسم" class="w-full rounded-lg border border-white/20 bg-black/20 text-white px-3 py-2" />
            <input required type="email" name="email" placeholder="البريد الإلكتروني" class="w-full rounded-lg border border-white/20 bg-black/20 text-white px-3 py-2" />
          </div>
          <select required name="subject" class="w-full rounded-lg border border-white/20 bg-black/20 text-white px-3 py-2">
            <option value="">اختر موضوع التواصل</option>
            <option value="sales">استفسار مبيعات</option>
            <option value="technical">استفسار تقني</option>
            <option value="partnership">شراكة</option>
            <option value="other">أخرى</option>
          </select>
          <textarea required name="message" rows="4" placeholder="اكتب تفاصيل الطلب" class="w-full rounded-lg border border-white/20 bg-black/20 text-white px-3 py-2"></textarea>
          <button type="submit" class="px-5 py-2 rounded-lg bg-indigo-500 text-white font-bold">إرسال</button>
        </form>
      `;

      const main = getMain();
      main.appendChild(section);

      section.querySelector("#bright-contact-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const payload = `الاسم: ${fd.get("name")}\nالبريد: ${fd.get("email")}\nالموضوع: ${fd.get("subject")}\n\n${fd.get("message")}`;
        window.location.href = `mailto:yazeed1job@gmail.com?subject=${encodeURIComponent("Bright AI Contact")}&body=${encodeURIComponent(payload)}`;
      });
    }
  }

  function injectFooterNewsletter() {
    if (document.getElementById("bright-footer-newsletter")) return;
    const footer = document.querySelector("#main-footer, footer");
    if (!footer) return;

    const block = document.createElement("section");
    block.id = "bright-footer-newsletter";
    block.className = "mt-8 p-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10";
    block.innerHTML = `
      <h3 class="text-white font-bold mb-2">اشترك في النشرة</h3>
      <p class="text-slate-300 text-sm mb-3">محتوى تنفيذي أسبوعي حول تطبيقات الذكاء الاصطناعي محلياً.</p>
      <form id="bright-footer-newsletter-form" class="flex flex-col md:flex-row gap-2">
        <input type="email" required placeholder="البريد الإلكتروني" class="flex-1 rounded-lg border border-white/20 bg-black/20 text-white px-3 py-2" />
        <button type="submit" class="px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-bold">اشترك</button>
      </form>
    `;

    const wrapper = footer.querySelector(".max-w-7xl, .max-w-6xl, .max-w-5xl");
    if (wrapper) {
      wrapper.appendChild(block);
    } else {
      footer.appendChild(block);
    }

    block.querySelector("#bright-footer-newsletter-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = block.querySelector("input[type='email']")?.value?.trim() || "";
      if (!email) return;
      window.location.href = `mailto:yazeed1job@gmail.com?subject=${encodeURIComponent("Footer Newsletter Subscription")}&body=${encodeURIComponent(email)}`;
    });
  }

  function apply(options) {
    normalizePathname = typeof options?.normalizePathname === "function" ? options.normalizePathname : normalizePathname;
    applyServiceEnhancements();
    applyBlogIndexEnhancements();
    applyContactEnhancements();
    injectFooterNewsletter();
  }

  window.BrightPageEnhancer = { apply };
})();
