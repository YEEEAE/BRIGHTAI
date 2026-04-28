import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const today = "2026-04-28";
const site = "https://brightai.site";
const whatsapp = "966538229013";

const agents = [
  {
    key: "custom-ai-agent",
    serviceFile: "services/custom-ai-agent.html",
    demoDir: "demo/custom-ai-agent",
    name: "وكيل ذكاء اصطناعي مخصص",
    title: "وكيل ذكاء اصطناعي مخصص يعمل بهوية شركتك وأساليبك التشغيلية",
    description: "مبني خصيصاً ليحاكي دماغ مؤسستك. ندرّبه على سياساتك وبياناتك الخاصة لينفذ أعقد المهام التشغيلية بأسلوب وهوية علامتك التجارية بشكل تام.",
    meta: "وكيل ذكاء اصطناعي مخصص للشركات في السعودية يعمل وفق سياساتك وبياناتك وهويتك التشغيلية، مع ديمو تفاعلي وتكامل آمن عبر Backend موحد.",
    keyword: "وكيل ذكاء اصطناعي مخصص",
    secondary: ["AI Agent مخصص", "وكيل ذكاء اصطناعي للشركات", "أتمتة مهام بالذكاء الاصطناعي"],
    icon: "AI",
    accent: "#14b8a6",
    audience: "الشركات والجهات التي لديها معرفة داخلية وسياسات تشغيلية تحتاج وكيل AI لا يعمل كأداة عامة.",
    compliance: "لا يتم استخدام بيانات العميل إلا لغرض التجربة والتقييم. لا ترفع بيانات حساسة أو أسرار تشغيلية في الديمو العام.",
    related: [
      ["/services/data-analyst-agent/", "وكيل محلل بيانات"],
      ["/services/document-automation/", "أتمتة إدارة البيانات والوثائق"],
      ["/services/customer-service-automation/", "أتمتة خدمة العملاء"],
      ["/ai-agent/", "دليل وكلاء الذكاء الاصطناعي"]
    ],
    metrics: [["جاهزية التشغيل", "82%"], ["توفير وقت تقديري", "35%"], ["قابلية الربط", "API"]],
    sample: "شركة خدمات لديها سياسات داخلية، دليل إجراءات، 6 أقسام تشغيلية، وتحتاج وكيلاً يجيب الموظفين والعملاء بنفس نبرة العلامة ويقترح خطوات تنفيذية.",
    scenarios: ["مساعد سياسات داخلية", "وكيل خدمة عملاء مخصص", "مساعد عمليات للفرق"],
    seoTerms: ["وكيل ذكاء اصطناعي مخصص", "AI Agent للشركات السعودية", "أتمتة تشغيلية بالذكاء الاصطناعي"]
  },
  {
    key: "competitor-analysis-agent",
    serviceFile: "services/competitor-analysis-agent.html",
    demoDir: "demo/competitor-analysis-agent",
    name: "وكيل تحليل المنافسين",
    title: "وكيل تحليل المنافسين — يكشف أسرار السوق ويعطيك أفضلية حقيقية",
    description: "رادار مؤسسي لا يتوقف. يراقب أرقام وحملات وتقييمات منافسيك يومياً، ويستخرج نقاط ضعفهم ليمنحك تقارير استراتيجية تضعك في صدارة الحصة السوقية.",
    meta: "وكيل تحليل المنافسين للشركات في السعودية يرصد تحركات السوق والحملات والتقييمات من مصادر مسموحة ويحوّلها إلى توصيات استراتيجية.",
    keyword: "وكيل تحليل المنافسين",
    secondary: ["تحليل المنافسين بالذكاء الاصطناعي", "مراقبة المنافسين", "تحليل السوق السعودي"],
    icon: "CX",
    accent: "#38bdf8",
    audience: "فرق التسويق والمبيعات وتطوير الأعمال التي تحتاج رصد منافسين مستمر دون متابعة يدوية مشتتة.",
    compliance: "لا يستخدم اختراقاً أو بيانات خاصة أو scraping مخالف. يعتمد على البيانات المتاحة والمصرح بها وسياسات كل منصة.",
    related: [
      ["/services/seo-ai-agent.html", "وكيل SEO"],
      ["/services/marketing-ai-agent.html", "وكيل تسويق"],
      ["/services/opportunity-discovery-agent.html", "وكيل اكتشاف الفرص"],
      ["/services/social-data-analysis/", "تحليل السوشيال ميديا"]
    ],
    metrics: [["سرعة الرصد", "يومي"], ["وضوح الفجوات", "74%"], ["جاهزية القرار", "عالية"]],
    sample: "شركة SaaS سعودية لديها 4 منافسين، تريد فهم الرسائل الإعلانية، الأسعار التقريبية، تقييمات العملاء، ونقاط الضعف القابلة للاستثمار.",
    scenarios: ["تحليل عروض المنافسين", "رصد حملات السوق", "مقارنة تجربة العميل"],
    seoTerms: ["تحليل المنافسين السعودية", "مراقبة المنافسين بالذكاء الاصطناعي", "تحليل السوق السعودي"]
  },
  {
    key: "seo-ai-agent",
    serviceFile: "services/seo-ai-agent.html",
    demoDir: "demo/seo-ai-agent",
    name: "وكيل SEO",
    title: "وكيل SEO ذكي يرفع ترتيبك ويقلّل تكلفة الإعلانات",
    description: "يستهدف الكلمات البيعية العالية ويكتب محتوى محسّن يساعد على مضاعفة الزيارات العضوية وخفض تكاليف النقرات الإعلانية.",
    meta: "وكيل SEO عربي للسوق السعودي يساعد على تحسين الظهور العضوي، بناء محتوى قابل للفهرسة، وتحسين فرص الترتيب دون ممارسات spam.",
    keyword: "وكيل SEO",
    secondary: ["تحسين محركات البحث السعودية", "SEO AI Agent", "تحسين الظهور في Google"],
    icon: "SEO",
    accent: "#22c55e",
    audience: "فرق التسويق والمحتوى والمتاجر ومواقع الخدمات التي تريد نمو الزيارات العضوية وتقليل الاعتماد على الإعلانات.",
    compliance: "لا يستخدم spam أو cloaking أو keyword stuffing. النتائج تقديرية حسب جودة الموقع والمحتوى والمنافسة.",
    related: [
      ["/services/marketing-ai-agent.html", "وكيل تسويق"],
      ["/services/competitor-analysis-agent.html", "وكيل تحليل المنافسين"],
      ["/services/social-data-analysis/", "تحليل بيانات وسائل التواصل"],
      ["/blog/ai-marketing-guide/", "دليل التسويق بالذكاء الاصطناعي"]
    ],
    metrics: [["قابلية الفهرسة", "86%"], ["فرص الترتيب", "تقديرية"], ["خفض الهدر", "أفضل"]],
    sample: "موقع شركة خدمات في الرياض لديه صفحات قليلة، إعلانات مكلفة، وهدفه تحسين صفحات الخدمات والكلمات البيعية مثل شركة ذكاء اصطناعي في السعودية.",
    scenarios: ["تحليل صفحة خدمة", "خريطة كلمات بيعية", "خطة محتوى محلية"],
    seoTerms: ["وكيل SEO السعودية", "تحسين محركات البحث بالذكاء الاصطناعي", "AI Search Optimization"]
  },
  {
    key: "marketing-ai-agent",
    serviceFile: "services/marketing-ai-agent.html",
    demoDir: "demo/marketing-ai-agent",
    name: "وكيل تسويق",
    title: "وكيل تسويق ذكي يضاعف وصول علامتك ويزيد التحويلات",
    description: "أداة تسويق آلية تدير حملاتك الرقمية، تحدد جمهورك المثالي، تولّد محتوى جذاب، وتحلّل الأداء لحظياً. تقلّل الهدر وتزيد الفعالية، وتضمن وصول علامتك لأكبر عدد من العملاء المحتملين بأقل تكلفة ممكنة.",
    meta: "وكيل تسويق ذكي للشركات في السعودية يساعد على تخطيط الحملات، توليد المحتوى، تحليل الأداء، وتحسين التحويلات بتقديرات عملية.",
    keyword: "وكيل تسويق",
    secondary: ["تسويق ذكي السعودية", "حملات رقمية بالذكاء الاصطناعي", "Marketing AI Agent"],
    icon: "MKT",
    accent: "#f59e0b",
    audience: "فرق التسويق والنمو والتجارة الإلكترونية والمبيعات التي تحتاج ربط الرسائل والحملات بالأداء والتحويل.",
    compliance: "لا يرسل حملات مزعجة أو مخالفة. يجب احترام موافقات التواصل، سياسات المنصات، ومتطلبات الخصوصية.",
    related: [
      ["/services/seo-ai-agent.html", "وكيل SEO"],
      ["/services/competitor-analysis-agent.html", "وكيل تحليل المنافسين"],
      ["/services/marketing-automation/", "أتمتة التسويق الرقمي"],
      ["/services/opportunity-discovery-agent.html", "وكيل اكتشاف العملاء"]
    ],
    metrics: [["سرعة التخطيط", "70%"], ["تحسين التحويل", "تقديري"], ["قنوات مدعومة", "متعددة"]],
    sample: "شركة تجارة إلكترونية بميزانية 30 ألف ريال، تستهدف الرياض وجدة، وتريد حملة لإطلاق منتج جديد مع رسائل واتساب وصفحات هبوط وإعلانات بحث.",
    scenarios: ["خطة حملة سريعة", "توليد رسائل وقنوات", "تحليل أداء تسويقي"],
    seoTerms: ["وكيل تسويق السعودية", "تسويق بالذكاء الاصطناعي", "أتمتة الحملات الرقمية"]
  },
  {
    key: "opportunity-discovery-agent",
    serviceFile: "services/opportunity-discovery-agent.html",
    demoDir: "demo/opportunity-discovery-agent",
    name: "وكيل اكتشاف الفرص والعملاء",
    title: "وكيل اكتشاف الفرص الذكي — يجلب لك عملاء محتملين جاهزين للبيع",
    description: "صياد آلي لا يتعب. يمسح السوق والمنصات لجمع وتصنيف العملاء المحتملين وتقييم جديتهم لضخهم مباشرة كتدفق مستمر إلى فريق المبيعات.",
    meta: "وكيل اكتشاف فرص وعملاء محتملين للسوق السعودي يساعد فرق المبيعات على تصنيف الفرص وتحديد الأولويات دون جمع بيانات حساسة بلا أساس نظامي.",
    keyword: "وكيل اكتشاف الفرص",
    secondary: ["توليد العملاء المحتملين السعودية", "Lead Generation AI", "اكتشاف فرص المبيعات"],
    icon: "LEAD",
    accent: "#a78bfa",
    audience: "فرق المبيعات وتطوير الأعمال وشركات B2B التي تحتاج تدفق فرص مؤهل وقابل للمتابعة.",
    compliance: "لا يجمع بيانات شخصية حساسة بدون أساس نظامي. يجب احترام الخصوصية وسياسات المنصات وقنوات التواصل المصرح بها.",
    related: [
      ["/services/marketing-ai-agent.html", "وكيل تسويق"],
      ["/services/competitor-analysis-agent.html", "وكيل تحليل المنافسين"],
      ["/services/brightsales/", "BrightSales"],
      ["/services/customer-service-automation/", "أتمتة خدمة العملاء"]
    ],
    metrics: [["تأهيل الفرص", "Score"], ["زمن البحث", "أقل"], ["جاهزية CRM", "عالية"]],
    sample: "شركة B2B تقدم حلول تقنية للشركات المتوسطة، تريد تحديد قطاعات واعدة في الرياض والدمام وتصنيف العملاء المحتملين حسب الجدية وقابلية البيع.",
    scenarios: ["تحديد قطاعات واعدة", "تصنيف Leads", "خطة متابعة مبيعات"],
    seoTerms: ["توليد عملاء محتملين السعودية", "وكيل اكتشاف العملاء", "Lead Generation AI"]
  }
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function ensureWrite(path, content) {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function ga() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", "G-8LLESL207Q");
  </script>`;
}

function agentLinks(activeKey) {
  return agents.map((agent) => `<a class="agent-chip${agent.key === activeKey ? " is-active" : ""}" href="/services/${agent.key}.html">${esc(agent.name)}</a>`).join("\n        ");
}

function canonicalAgentLinks(activeKey) {
  return agents
    .filter((agent) => agent.key !== activeKey)
    .map((agent) => `<a href="/services/${agent.key}/">${esc(agent.name)}</a>`)
    .join(" · ");
}

function schema(agent, type) {
  const serviceUrl = `${site}/services/${agent.key}/`;
  const demoUrl = `${site}/demo/${agent.key}/`;
  const faq = [
    ["ما الذي يقدمه هذا الوكيل؟", `${agent.name} يساعد فرق العمل على تحويل البيانات والسياق إلى تقرير تنفيذي وتوصيات قابلة للتنفيذ داخل السوق السعودي.`],
    ["هل النتائج مضمونة؟", "النتائج تقديرية حسب جودة البيانات والسوق والمنافسة، ولا نستخدم وعوداً مطلقة مثل ضمان المركز الأول أو ضمان المبيعات."],
    ["هل يمكن ربط الوكيل بأنظمة الشركة؟", "نعم، يتم تقييم جاهزية الربط مع CRM أو ERP أو قواعد البيانات أو مصادر المحتوى حسب البيئة التقنية والصلاحيات."],
    ["هل الديمو يستخدم مفتاح API في المتصفح؟", "لا. صفحات الديمو تمر عبر Backend موحد ولا تعرض أي مفاتيح API في الواجهة."]
  ];
  const graph = [
    { "@type": "Organization", "@id": `${site}/#organization`, name: "Bright AI", url: `${site}/`, logo: `${site}/assets/images/logo.png`, areaServed: { "@type": "Country", name: "Saudi Arabia" } },
    { "@type": "WebSite", "@id": `${site}/#website`, url: `${site}/`, name: "Bright AI", inLanguage: "ar-SA", publisher: { "@id": `${site}/#organization` } },
    { "@type": "WebPage", "@id": `${serviceUrl}#webpage`, url: serviceUrl, name: agent.title, description: agent.meta, inLanguage: "ar-SA", isPartOf: { "@id": `${site}/#website` }, about: { "@id": `${serviceUrl}#service` }, dateModified: today },
    { "@type": "BreadcrumbList", "@id": `${serviceUrl}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "الرئيسية", item: `${site}/` }, { "@type": "ListItem", position: 2, name: "الخدمات", item: `${site}/services/` }, { "@type": "ListItem", position: 3, name: agent.name, item: serviceUrl }] },
    { "@type": "Service", "@id": `${serviceUrl}#service`, name: agent.name, serviceType: "AI Agent Service", category: "وكلاء الذكاء الاصطناعي", description: agent.description, url: serviceUrl, provider: { "@id": `${site}/#organization` }, areaServed: { "@type": "Country", name: "Saudi Arabia" }, audience: { "@type": "Audience", audienceType: agent.audience }, potentialAction: { "@type": "ViewAction", name: "جرّب الديمو التفاعلي", target: demoUrl } },
    { "@type": "FAQPage", "@id": `${serviceUrl}#faq`, mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ];
  if (type === "demo") {
    graph[2].url = demoUrl;
    graph[2]["@id"] = `${demoUrl}#webpage`;
    graph[2].name = `ديمو ${agent.name}`;
    graph[2].description = `تجربة تفاعلية لوكيل ${agent.name} عبر Backend موحد دون عرض مفاتيح API في المتصفح.`;
    graph.push({ "@type": "SoftwareApplication", "@id": `${demoUrl}#application`, name: `ديمو ${agent.name}`, applicationCategory: "BusinessApplication", operatingSystem: "Web", url: demoUrl, inLanguage: "ar-SA", provider: { "@id": `${site}/#organization` } });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

function servicePage(agent) {
  const serviceUrl = `${site}/services/${agent.key}/`;
  const demoPath = `/demo/${agent.key}/`;
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar-SA">
<head>
  <meta charset="UTF-8" />
  ${ga()}
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(agent.title)} | Bright AI السعودية</title>
  <meta name="description" content="${esc(agent.meta)}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#020617" />
  <link rel="canonical" href="${serviceUrl}" />
  <link rel="alternate" hreflang="ar-SA" href="${serviceUrl}" />
  <link rel="alternate" hreflang="x-default" href="${serviceUrl}" />
  <meta property="og:locale" content="ar_SA" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bright AI" />
  <meta property="og:title" content="${esc(agent.title)}" />
  <meta property="og:description" content="${esc(agent.meta)}" />
  <meta property="og:url" content="${serviceUrl}" />
  <meta property="og:image" content="${site}/assets/images/logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(agent.title)}" />
  <meta name="twitter:description" content="${esc(agent.meta)}" />
  <link rel="stylesheet" href="/assets/css/ai-agent-suite.css" />
  <script type="application/ld+json">${schema(agent, "service")}</script>
</head>
<body>
  <header class="agent-nav">
    <a class="agent-brand" href="/" aria-label="Bright AI">Bright<span>AI</span></a>
    <nav aria-label="وكلاء الذكاء الاصطناعي">
      ${agentLinks(agent.key)}
    </nav>
    <a class="nav-cta" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">احجز استشارة</a>
  </header>
  <main>
    <section class="agent-hero">
      <div class="agent-container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">وكلاء الذكاء الاصطناعي للشركات في السعودية</p>
          <h1>${esc(agent.title)}</h1>
          <p class="lead">${esc(agent.description)}</p>
          <div class="hero-actions">
            <a class="btn primary" href="${demoPath}">جرّب الآن</a>
            <a class="btn soft" href="https://wa.me/${whatsapp}?text=${encodeURIComponent(`أريد نسخة مخصصة من ${agent.name}`)}" target="_blank" rel="noopener">اطلب نسخة مخصصة</a>
          </div>
        </div>
        <aside class="hero-panel" aria-label="مؤشرات قيمة تقديرية">
          ${agent.metrics.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}
        </aside>
      </div>
    </section>

    <section class="agent-container section-grid">
      <article class="content-card">
        <h2>لماذا تحتاج ${esc(agent.name)}؟</h2>
        <p>${esc(agent.audience)} يعمل الوكيل كطبقة ذكاء مؤسسية تفهم الهدف والسياق وتحوّل المدخلات المختصرة إلى ملخص تنفيذي، مؤشرات، مخاطر، وخطوات تالية قابلة للمتابعة.</p>
        <p>النهج مصمم لتحسين الظهور التشغيلي والقرار التجاري، ويساعد على رفع فرص الترتيب والفهرسة عندما يكون مرتبطاً بمحتوى أو صفحات عامة، مع تجنب أي وعود مطلقة.</p>
      </article>
      <article class="content-card">
        <h2>ما الذي يستلمه العميل؟</h2>
        <ul>
          <li>تصميم سيناريوهات تشغيلية مناسبة لبيئة الشركة.</li>
          <li>تجربة ديمو تفاعلية تستخدم Backend موحد للذكاء الاصطناعي.</li>
          <li>لوحة نتائج تحتوي على Summary وScore وInsights وActions وRisks وROI.</li>
          <li>خطة ربط أولية مع CRM أو ERP أو مصادر البيانات عند الحاجة.</li>
        </ul>
      </article>
    </section>

    <section class="agent-container">
      <div class="section-head">
        <h2>حالات استخدام عالية القيمة</h2>
        <p>سيناريوهات البداية تكون قصيرة وواضحة حتى يرى صاحب القرار الأثر قبل التوسع.</p>
      </div>
      <div class="cards-3">
        ${agent.scenarios.map((item) => `<article class="mini-card"><h3>${esc(item)}</h3><p>نبدأ بمدخلات بسيطة، ثم ننتج تقريراً منظماً يوضح الأثر والمخاطر وخطوات الربط.</p></article>`).join("")}
      </div>
    </section>

    <section class="agent-container section-grid">
      <article class="content-card">
        <h2>تنبيه امتثال وسلامة</h2>
        <p>${esc(agent.compliance)}</p>
      </article>
      <article class="content-card">
        <h2>جرّب قبل الطلب</h2>
        <p>صفحة الديمو تعرض الوضع السريع أولاً، ثم إعدادات متقدمة عند الحاجة. عند فشل الذكاء الاصطناعي تظهر نتيجة تجريبية بديلة بدلاً من JSON خام.</p>
        <a class="btn primary" href="${demoPath}">فتح ديمو ${esc(agent.name)}</a>
      </article>
    </section>

    <section class="agent-container">
      <div class="section-head"><h2>خدمات قريبة وروابط داخلية</h2><p>الربط الداخلي يساعد العميل ومحركات البحث على فهم علاقة الوكيل بباقي منظومة Bright AI.</p></div>
      <div class="link-grid">
        ${agent.related.map(([href, label]) => `<a href="${href}"><strong>${esc(label)}</strong><span>استكشف كيف يكمل هذا المسار ${esc(agent.name)}.</span></a>`).join("")}
      </div>
    </section>

    <section class="agent-container faq">
      <h2>أسئلة شائعة</h2>
      <details><summary>هل ${esc(agent.name)} مناسب للسوق السعودي؟</summary><p>نعم، صُممت الصفحة والتجربة والمحتوى حول احتياجات الشركات السعودية، مع لغة عربية مهنية وروابط خدمات ذات علاقة.</p></details>
      <details><summary>هل يمكن الاعتماد على نتائج الديمو كقرار نهائي؟</summary><p>لا، النتائج تقديرية حسب البيانات المدخلة وتحتاج مراجعة الفريق المختص قبل أي قرار تجاري أو تشغيلي.</p></details>
      <details><summary>هل يوجد API Key في الواجهة؟</summary><p>لا. الديمو يستخدم endpoint داخلي موحد ولا يتصل مباشرة مع Google Gemini من المتصفح.</p></details>
      <details><summary>ما أفضل خطوة بعد التجربة؟</summary><p>شارك التقرير عبر واتساب أو اطلب نسخة مخصصة حتى نحدد مصادر البيانات والربط والصلاحيات ونطاق الإطلاق الأول.</p></details>
    </section>

    <section class="final-cta">
      <div class="agent-container">
        <h2>حوّل ${esc(agent.name)} إلى أصل تشغيلي داخل شركتك</h2>
        <p>ابدأ بديمو قصير، ثم نحدد معك نطاق النسخة المخصصة، بياناتها، ضوابطها، وربطها مع أنظمتك الحالية.</p>
        <div class="hero-actions center">
          <a class="btn primary" href="${demoPath}">جرّب الآن</a>
          <a class="btn whatsapp" href="https://wa.me/${whatsapp}?text=${encodeURIComponent(`أريد عرض سعر لخدمة ${agent.name}`)}" target="_blank" rel="noopener">اطلب عرض سعر</a>
        </div>
      </div>
    </section>
  </main>
  <footer class="agent-footer"><a href="/services/">كل الخدمات</a> · ${canonicalAgentLinks(agent.key)} · <a href="/contact/">تواصل معنا</a> · Bright AI</footer>
</body>
</html>
`;
}

function demoPage(agent) {
  const demoUrl = `${site}/demo/${agent.key}/`;
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar-SA">
<head>
  <meta charset="UTF-8" />
  ${ga()}
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>ديمو ${esc(agent.name)} | Bright AI</title>
  <meta name="description" content="ديمو تفاعلي لخدمة ${esc(agent.name)} عبر Backend موحد. جرّب السيناريو، أدخل بيانات مختصرة، وشاهد تقريراً تنفيذياً دون JSON خام." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${demoUrl}" />
  <link rel="alternate" hreflang="ar-SA" href="${demoUrl}" />
  <link rel="alternate" hreflang="x-default" href="${demoUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="ديمو ${esc(agent.name)} من Bright AI" />
  <meta property="og:description" content="${esc(agent.meta)}" />
  <meta property="og:url" content="${demoUrl}" />
  <meta property="og:image" content="${site}/assets/images/logo.png" />
  <link rel="stylesheet" href="/assets/css/ai-agent-suite.css" />
  <script type="application/ld+json">${schema(agent, "demo")}</script>
</head>
<body data-agent-demo="${agent.key}">
  <header class="agent-nav">
    <a class="agent-brand" href="/" aria-label="Bright AI">Bright<span>AI</span></a>
    <nav aria-label="روابط الخدمات">
      <a class="agent-chip" href="/services/${agent.key}.html">صفحة الخدمة</a>
      <a class="agent-chip" href="/services/">كل الخدمات</a>
      <a class="agent-chip" href="/demo/">كل الديموهات</a>
    </nav>
    <a class="nav-cta" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">اطلب نسخة مخصصة</a>
  </header>
  <main>
    <section class="agent-hero compact">
      <div class="agent-container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Demo تفاعلي عبر Backend موحد</p>
          <h1>ديمو ${esc(agent.title)}</h1>
          <p class="lead">${esc(agent.description)}</p>
          <div class="hero-actions">
            <a class="btn primary" href="#agentDemoApp">جرّب الآن</a>
            <a class="btn soft" href="https://wa.me/${whatsapp}?text=${encodeURIComponent(`أريد نسخة مخصصة من ديمو ${agent.name}`)}" target="_blank" rel="noopener">اطلب نسخة مخصصة</a>
          </div>
        </div>
        <aside class="hero-panel">
          ${agent.metrics.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}
        </aside>
      </div>
    </section>
    <section id="agentDemoApp" class="agent-container demo-shell" aria-label="تجربة الوكيل" data-sample="${esc(agent.sample)}">
      <div class="demo-placeholder">يتم تحميل تجربة ${esc(agent.name)}...</div>
    </section>
  </main>
  <script src="/frontend/js/runtime-config.min.js" defer></script>
  <script src="/frontend/js/api-gateway.min.js" defer></script>
  <script src="/assets/js/gemini-demo-engine.js" defer></script>
  <script src="/assets/js/ai-agent-demo-suite.js" defer></script>
</body>
</html>
`;
}

function css() {
  return `:root{--bg:#020617;--panel:rgba(15,23,42,.82);--line:rgba(148,163,184,.2);--text:#f8fafc;--muted:#b6c6d8;--brand:#14b8a6;--brand2:#38bdf8;--radius:8px;--max:1180px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 75% -10%,rgba(20,184,166,.2),transparent 30%),radial-gradient(circle at 12% 10%,rgba(56,189,248,.14),transparent 28%),linear-gradient(180deg,#020617,#07111f 52%,#020617);color:var(--text);font-family:"IBM Plex Sans Arabic","Tajawal",Arial,sans-serif;line-height:1.85}a{color:inherit;text-decoration:none}.agent-container{width:min(var(--max),calc(100% - 32px));margin-inline:auto}.agent-nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px clamp(16px,4vw,34px);background:rgba(2,6,23,.82);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)}.agent-brand{font-weight:950;font-size:22px}.agent-brand span{color:var(--brand)}.agent-nav nav{display:flex;gap:8px;overflow:auto}.agent-chip,.nav-cta{white-space:nowrap;border:1px solid var(--line);border-radius:999px;padding:8px 12px;color:#dbeafe;background:rgba(255,255,255,.05);font-size:13px;font-weight:850}.agent-chip.is-active,.nav-cta{border-color:rgba(20,184,166,.4);background:rgba(20,184,166,.14);color:#ccfbf1}.agent-hero{padding:clamp(58px,8vw,104px) 0 34px}.agent-hero.compact{padding-block:46px 24px}.hero-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:22px;align-items:stretch}.hero-copy,.hero-panel,.content-card,.mini-card,.faq details,.demo-card,.result-card{border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(180deg,var(--panel),rgba(15,23,42,.62));box-shadow:0 24px 70px rgba(0,0,0,.25)}.hero-copy{padding:clamp(22px,4vw,44px)}.eyebrow{display:inline-flex;padding:7px 12px;border-radius:999px;background:rgba(20,184,166,.13);border:1px solid rgba(20,184,166,.28);color:#99f6e4;font-weight:900}h1{margin:16px 0 0;font-size:clamp(32px,5vw,58px);line-height:1.15;letter-spacing:0}h2{font-size:clamp(24px,3vw,36px);line-height:1.25;letter-spacing:0}.lead{max-width:820px;color:#dbeafe;font-size:18px}.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.hero-actions.center{justify-content:center}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:11px 17px;border-radius:var(--radius);font-weight:950;border:1px solid transparent}.btn.primary{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#02111f}.btn.soft{background:rgba(255,255,255,.06);border-color:var(--line);color:#e2e8f0}.btn.whatsapp{background:#16a34a;color:white}.hero-panel{padding:18px;display:grid;gap:12px}.hero-panel div,.demo-kpi{padding:16px;border-radius:var(--radius);border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05)}.hero-panel span,.demo-kpi span{display:block;color:var(--muted);font-size:13px}.hero-panel strong,.demo-kpi strong{display:block;color:#fff;font-size:28px;line-height:1.3}.section-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-block:28px}.content-card,.mini-card{padding:22px}.content-card p,.content-card li,.mini-card p,.faq p{color:#cbd5e1}.cards-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.section-head{margin-block:28px 14px}.section-head p{color:var(--muted)}.link-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.link-grid a{display:grid;gap:5px;padding:16px;border-radius:var(--radius);border:1px solid rgba(20,184,166,.22);background:rgba(20,184,166,.08)}.link-grid span{color:var(--muted);font-size:14px}.faq{padding-block:30px}.faq details{padding:16px;margin-block:10px}.faq summary{cursor:pointer;font-weight:950}.final-cta{text-align:center;padding:40px 0;margin-top:26px;background:linear-gradient(135deg,rgba(20,184,166,.15),rgba(56,189,248,.08));border-block:1px solid rgba(255,255,255,.08)}.agent-footer{text-align:center;color:var(--muted);padding:30px}.demo-shell{margin-block:24px 60px}.demo-stepper{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none;counter-reset:s}.demo-stepper li{counter-increment:s;display:inline-flex;gap:8px;align-items:center;border:1px solid rgba(20,184,166,.24);border-radius:999px;padding:8px 11px;background:rgba(20,184,166,.08);color:#ccfbf1;font-size:13px;font-weight:850}.demo-stepper li:before{content:counter(s);display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--brand);color:#02111f}.demo-grid{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(0,1.1fr);gap:16px}.demo-card{padding:20px}.mode-row,.sample-row,.result-actions,.loading-stages{display:flex;flex-wrap:wrap;gap:10px}.mode-row button,.sample-row button{border:1px solid var(--line);border-radius:var(--radius);background:rgba(255,255,255,.05);color:#e2e8f0;padding:9px 12px;font:inherit;font-weight:900;cursor:pointer}.mode-row button.is-active,.sample-row button:hover{border-color:rgba(20,184,166,.48);background:rgba(20,184,166,.14);color:#ccfbf1}label{display:block;margin:14px 0 7px;color:#dbeafe;font-weight:900}textarea,input,select{width:100%;min-height:48px;border:1px solid rgba(148,163,184,.28);border-radius:var(--radius);background:rgba(2,6,23,.48);color:#fff;padding:12px;font:inherit}textarea{min-height:132px;resize:vertical}.advanced{display:none}.advanced.is-open{display:grid;gap:10px}.privacy-note,.error-note{color:#fef3c7;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.26);border-radius:var(--radius);padding:12px}.result-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.result-card{padding:16px}.score{display:grid;place-items:center;min-height:140px;background:conic-gradient(from 0deg,var(--brand),var(--brand2),rgba(255,255,255,.1));border-radius:var(--radius);color:#02111f}.score strong{font-size:44px}.loading{display:grid;gap:14px}.pulse{height:10px;border-radius:999px;background:linear-gradient(90deg,rgba(20,184,166,.1),rgba(56,189,248,.5),rgba(20,184,166,.1));animation:pulse 1.2s infinite}.loading-stages span{border:1px solid var(--line);border-radius:999px;padding:7px 10px;color:#dbeafe}.demo-placeholder{padding:24px;border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}@keyframes pulse{50%{opacity:.45}}@media(max-width:900px){.agent-nav{align-items:flex-start;flex-direction:column}.hero-grid,.section-grid,.demo-grid,.result-grid{grid-template-columns:1fr}.cards-3,.link-grid{grid-template-columns:1fr}h1{font-size:34px}}`;
}

function js() {
  return `(() => {
  "use strict";
  const configs = ${JSON.stringify(Object.fromEntries(agents.map((agent) => [agent.key, {
    name: agent.name,
    title: agent.title,
    description: agent.description,
    compliance: agent.compliance,
    sample: agent.sample,
    scenarios: agent.scenarios,
    metrics: agent.metrics
  }])), null, 2)};
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
    return "أنت Principal AI Product Engineer وSEO Strategist في Bright AI. أنشئ تقريراً عربياً تنفيذياً للسوق السعودي عن " + config.name + ".\\n" +
      "السيناريو: " + form.scenario + "\\n" +
      "بيانات الشركة: " + form.input + "\\n" +
      "القطاع: " + form.industry + "\\n" +
      "الهدف: " + form.goal + "\\n" +
      "التزم بال JSON schema فقط. لا تعرض JSON خارجياً. اجعل النتائج تقديرية حسب البيانات، واذكر المخاطر والامتثال وخطة الربط.";
  }
  function mount() {
    const key = document.body.dataset.agentDemo;
    const config = configs[key];
    const mountNode = document.getElementById("agentDemoApp");
    if (!config || !mountNode || !window.GeminiDemoEngine) return;
    const engine = new window.GeminiDemoEngine({ demoId: key, endpoint: "/api/ai/chat/completions", timeoutMs: 16000 });
    mountNode.innerHTML = '<ol class="demo-stepper"><li>اختر السيناريو</li><li>أدخل بيانات شركتك</li><li>استخدم بيانات تجريبية</li><li>شغّل الوكيل</li><li>شاهد التقرير</li><li>اطلب الربط أو العرض</li></ol><div class="demo-grid"><form class="demo-card" data-form><div class="mode-row"><button type="button" class="is-active" data-mode="quick">الوضع السريع</button><button type="button" data-mode="advanced">إعدادات متقدمة</button></div><label>اختر السيناريو</label><select name="scenario">' + config.scenarios.map((s) => '<option>' + esc(s) + '</option>').join("") + '</select><label>بيانات شركتك</label><textarea name="input" placeholder="اكتب وصفاً مختصراً للشركة أو استخدم المثال الجاهز..."></textarea><div class="sample-row"><button type="button" data-sample>استخدم مثال جاهز</button></div><div class="advanced" data-advanced><label>القطاع</label><input name="industry" placeholder="مثال: SaaS، تجارة، صحة، لوجستيات"><label>الهدف التجاري</label><input name="goal" placeholder="مثال: زيادة التحويلات أو خفض وقت التحليل"></div><p class="privacy-note">' + esc(config.compliance) + '</p><div class="hero-actions"><button class="btn primary" type="submit">شغّل الوكيل</button><a class="btn soft" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">اطلب نسخة مخصصة</a></div></form><div class="demo-card" data-output><h2>Result Dashboard</h2><p>ستظهر النتيجة في بطاقات تنفيذية تشمل الملخص، الدرجة، الرؤى، الإجراءات، المخاطر، الأثر التجاري، جاهزية الربط، والخطوات التالية.</p></div></div>';
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
})();`;
}

function updateServicesIndex() {
  const path = join(root, "services/index.html");
  if (!existsSync(path)) return;
  let html = readFileSync(path, "utf8");
  html = html.replace(/(?:<a class="internal-linking-cta" href="\/demo\/custom-ai-agent\/">ديمو وكيل مخصص<\/a>)+/g, '<a class="internal-linking-cta" href="/demo/custom-ai-agent/">ديمو وكيل مخصص</a>');
  const replacements = [
    ["/services/custom-ai-agent/", "/services/custom-ai-agent.html"],
    ["/services/competitor-analysis-agent/", "/services/competitor-analysis-agent.html"],
    ["/services/seo-agent/", "/services/seo-ai-agent.html"],
    ["/services/marketing-agent/", "/services/marketing-ai-agent.html"],
    ["/services/lead-hunter/", "/services/opportunity-discovery-agent.html"]
  ];
  for (const [from, to] of replacements) html = html.split(from).join(to);
  if (!html.includes('href="/demo/custom-ai-agent/"')) {
    html = html.replace(/<a class="internal-linking-cta" href="\/services\/custom-ai-agent\.html">وكيل مخصص<\/a>/, '<a class="internal-linking-cta" href="/services/custom-ai-agent.html">وكيل مخصص</a><a class="internal-linking-cta" href="/demo/custom-ai-agent/">ديمو وكيل مخصص</a>');
  }
  const block = `<section class="answer-section" aria-labelledby="ai-agents-products-heading">
            <div class="container">
                <div class="section-head">
                    <div>
                        <h2 id="ai-agents-products-heading">وكلاء الذكاء الاصطناعي</h2>
                        <p>خمس خدمات جديدة بوكلاء AI مع صفحات خدمة مستقلة وديمو تفاعلي يمر عبر Backend موحد دون كشف مفاتيح API.</p>
                    </div>
                </div>
                <div class="answer-lists">
                    <article class="answer-list-card">
                        <h3>وكلاء الذكاء الاصطناعي</h3>
                        <ul>
                            <li><a href="/services/custom-ai-agent.html"><strong>وكيل ذكاء اصطناعي مخصص</strong><span>يعمل بهوية شركتك وأساليبك التشغيلية.</span></a></li>
                            <li><a href="/services/competitor-analysis-agent.html"><strong>وكيل تحليل المنافسين</strong><span>يرصد السوق والحملات ويستخرج فرص التفوق.</span></a></li>
                            <li><a href="/services/seo-ai-agent.html"><strong>وكيل SEO</strong><span>مصمم لتحسين الظهور العضوي وتقليل الهدر الإعلاني.</span></a></li>
                            <li><a href="/services/marketing-ai-agent.html"><strong>وكيل تسويق</strong><span>يخطط الحملات ويحلل الأداء ويرفع فرص التحويل.</span></a></li>
                            <li><a href="/services/opportunity-discovery-agent.html"><strong>وكيل اكتشاف الفرص والعملاء</strong><span>يصنف العملاء المحتملين ويجهزهم لفريق المبيعات.</span></a></li>
                        </ul>
                    </article>
                </div>
            </div>
        </section>`;
  if (!html.includes('id="ai-agents-products-heading"')) {
    html = html.replace('<section class="geo-section" aria-labelledby="geo-heading">', `${block}\n\n        <section class="geo-section" aria-labelledby="geo-heading">`);
  }
  html = html
    .replace(/"id":"custom-ai-agent"([\s\S]*?)"sku":"custom-ai-agent"/, '"id":"custom-ai-agent"$1"sku":"custom-ai-agent","demoUrl":"https://brightai.site/demo/custom-ai-agent/","demoLabel":"جرّب الوكيل المخصص","hasLiveDemo":true')
    .replace(/"id":"competitor-analysis-agent"([\s\S]*?)"sku":"competitor-analysis-agent"/, '"id":"competitor-analysis-agent"$1"sku":"competitor-analysis-agent","demoUrl":"https://brightai.site/demo/competitor-analysis-agent/","demoLabel":"جرّب تحليل المنافسين","hasLiveDemo":true')
    .replace(/"id":"seo-agent"([\s\S]*?)"sku":"seo-agent"/, '"id":"seo-ai-agent"$1"sku":"seo-ai-agent","demoUrl":"https://brightai.site/demo/seo-ai-agent/","demoLabel":"جرّب وكيل SEO","hasLiveDemo":true')
    .replace(/"id":"marketing-agent"([\s\S]*?)"sku":"marketing-agent"/, '"id":"marketing-ai-agent"$1"sku":"marketing-ai-agent","demoUrl":"https://brightai.site/demo/marketing-ai-agent/","demoLabel":"جرّب وكيل التسويق","hasLiveDemo":true')
    .replace(/"id":"lead-hunter"([\s\S]*?)"sku":"lead-hunter"/, '"id":"opportunity-discovery-agent"$1"sku":"opportunity-discovery-agent","demoUrl":"https://brightai.site/demo/opportunity-discovery-agent/","demoLabel":"جرّب اكتشاف الفرص","hasLiveDemo":true');
  writeFileSync(path, html);
}

function updateSitemap() {
  const path = join(root, "sitemap.xml");
  if (!existsSync(path)) return;
  let xml = readFileSync(path, "utf8");
  for (const agent of agents) {
    const htmlUrl = `${site}/services/${agent.key}.html`;
    const prettyUrl = `${site}/services/${agent.key}/`;
    xml = xml.replace(new RegExp(`<url>\\n\\s*<loc>${htmlUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>[\\s\\S]*?\\n\\s*</url>\\n?`, "g"), "");
    xml = xml.split(htmlUrl).join(prettyUrl);
  }
  const entries = agents.flatMap((agent) => [`${site}/services/${agent.key}/`, `${site}/demo/${agent.key}/`]);
  const blocks = entries
    .filter((url) => !xml.includes(`<loc>${url}</loc>`))
    .map((url) => `  <url>
    <loc>${url}</loc>
    <xhtml:link rel="alternate" hreflang="ar-SA" href="${url}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${url}" />
    <lastmod>${today}</lastmod>
    <priority>0.9</priority>
  </url>`)
    .join("\n");
  if (blocks) xml = xml.replace("\n</urlset>", `\n${blocks}\n</urlset>`);
  writeFileSync(path, xml);
}

ensureWrite("assets/css/ai-agent-suite.css", css());
ensureWrite("assets/js/ai-agent-demo-suite.js", js());
for (const agent of agents) {
  ensureWrite(agent.serviceFile, servicePage(agent));
  ensureWrite(`${agent.demoDir}/index.html`, demoPage(agent));
}
updateServicesIndex();
updateSitemap();
