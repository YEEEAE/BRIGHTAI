#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const site = "https://brightai.site";
const wa = "https://wa.me/966538229013";
const today = "2026-04-29";

const sharedFaq = [
  ["هل التجربة مجانية؟", "سؤال منطقي، والجواب الصريح: نعم. تقدر تجرّب براحتك ببيانات وهمية وتشوف شكل التقرير قبل ما تطلب نسخة مخصصة."],
  ["هل نقدر نربطها بأنظمة الشركة؟", "نعم، النسخة المخصصة نقدر نربطها مع API أو قواعد البيانات أو ملفات العمل بعد مراجعة الصلاحيات."],
  ["وش وضع البيانات؟", "بياناتك تبقى عندك. لا تستخدم بيانات حساسة في الديمو العام، والنسخة المخصصة تنبني بصلاحيات وصول وسجل تدقيق وضوابط مشاركة."],
  ["هل تدعم العربية السعودية؟", "أكيد. التجربة مبنية بالعربية السعودية واتجاهها من اليمين لليسار ومهيأة لسياق الشركات السعودية."],
  ["وش الخطوة بعد الديمو؟", "راجع التقرير، اختر حالة استخدام واحدة، ثم احجز مكالمة 15 دقيقة عشان نحولها لنسخة مرتبطة ببياناتك."]
];

const demos = [
  {
    slug: "ai-agent",
    path: "ai-agent",
    demoType: "ai-agent",
    title: "AI Agent للشركات",
    h1: "وكيل ذكاء اصطناعي للشركات السعودية",
    service: "/services/custom-ai-agent.html",
    model: "gemini-2.5-flash",
    sector: "وكلاء الأعمال",
    audience: "الإدارة التشغيلية وفرق خدمة العملاء والمبيعات",
    problem: "تكرار المهام والأسئلة بين الفرق بدون ذاكرة أو صلاحيات واضحة",
    outcome: "تعريف وكيل، حدود صلاحيات، خطة تكامل، ومؤشر جاهزية",
    answer: "اختر سيناريو عمل يومي، وشاهد كيف يحوّله الديمو إلى وكيل واضح المهام والحدود وخطوات الربط.",
    samples: [
      ["خدمة عملاء", "وكيل يرد على استفسارات العملاء عن الطلبات، يصنف النية، ويصعد الحالات الحساسة للموظف المختص."],
      ["عمليات داخلية", "وكيل يتابع طلبات الإدارات، يلخص التعثرات، ويطلب المستندات الناقصة من أصحاب العلاقة."],
      ["مبيعات", "وكيل يؤهل العملاء المحتملين، يسأل أسئلة محددة، ويرسل ملخصاً لفريق المبيعات قبل الاتصال."]
    ],
    faq: [["متى أحتاج وكيل ذكاء اصطناعي؟", "عندما تتكرر أسئلة أو مهام تشغيلية وتحتاج ربطها بسياسات الشركة وصلاحياتها بدل الاعتماد على أداة عامة."]]
  },
  {
    slug: "ai-tenders-analysis",
    path: "demo/ai-tenders-analysis",
    demoType: "ai-tenders-analysis",
    title: "تحليل المناقصات والعقود",
    h1: "تحليل المناقصات والعقود بالذكاء الاصطناعي",
    service: "/services/ai-tenders-analysis.html",
    model: "gemini-2.5-pro",
    sector: "المناقصات والمشتريات",
    audience: "شركات المقاولات والخدمات والموردين",
    problem: "قراءة كراسات وشروط طويلة مع احتمال تفويت متطلبات أو مخاطر تعاقدية",
    outcome: "ملخص متطلبات، مخاطر امتثال، جاهزية تقديم، وخطة قرار",
    answer: "ألصق ملخص شروط غير حساس، وسيعرض الديمو أهم المتطلبات والمخاطر ونقاط القرار قبل التقديم.",
    samples: [
      ["مقاولات", "مناقصة صيانة مرافق حكومية لمدة ٢٤ شهراً، ضمان ابتدائي، خبرة مطلوبة في ٣ مشاريع مشابهة، وغرامات تأخير."],
      ["تقنية", "عقد منصة داخلية يتطلب تكاملات أمنية، تدريب مستخدمين، اتفاقية مستوى خدمة، ودعم سنة كاملة."],
      ["توريد", "مناقصة توريد أجهزة على دفعات مع جدول تسليم مرحلي، فحص قبول، وغرامات عند التأخير."]
    ],
    faq: [["هل يحلل العقود أيضاً؟", "نعم، الديمو يقرأ ملخصات العقود والمناقصات غير الحساسة ويبرز الالتزامات والمخاطر التي تحتاج مراجعة بشرية."]]
  },
  {
    slug: "data-analysis",
    path: "demo/data-analysis",
    demoType: "data-analysis",
    title: "تحليل البيانات",
    h1: "تحليل بيانات تنفيذي للشركات السعودية",
    service: "/services/data-platform.html",
    model: "gemini-2.5-flash",
    sector: "البيانات والقرار",
    audience: "الإدارة التنفيذية وفرق التحليل والعمليات",
    problem: "وجود أرقام كثيرة لا تتحول إلى قرار واضح أو مؤشر قابل للمتابعة",
    outcome: "رؤى، شذوذ، مؤشرات مقترحة، وخطوات تحسين جودة البيانات",
    answer: "أدخل عينة جدولية أو وصف أعمدة، وسيحوّلها الديمو إلى ملخص تنفيذي ورؤى قابلة للتنفيذ.",
    samples: [
      ["مبيعات", "يناير: زيارات ٩٢٠٠، طلبات ٤٢٠، مرتجعات ٢٨، إيراد ٣٢٠٠٠٠. فبراير: زيارات ١١٠٠٠، طلبات ٥١٠، مرتجعات ٥٧، إيراد ٣٨٠٠٠٠."],
      ["تشغيل", "توقفات يومية في وردية المساء، ارتفاع الهدر بنسبة ١٨٪، وتأخر تسليم الطلبات الكبرى في آخر أسبوعين."],
      ["تسويق", "قنوات العملاء: إعلانات، واتساب، توصيات. معدل التحويل ٤٪، ١٢٪، ١٨٪ مع تباين كبير في تكلفة العميل."]
    ],
    faq: [["هل أحتاج ملف بيانات كامل؟", "لا، الديمو يعمل بوصف أو عينة صغيرة غير حساسة، والنسخة المخصصة يمكن ربطها بمصادر البيانات الفعلية."]]
  },
  {
    slug: "smart-automation",
    path: "demo/smart-automation",
    demoType: "smart-automation",
    title: "أتمتة الأعمال الذكية",
    h1: "أتمتة الأعمال الذكية للفرق السعودية",
    service: "/services/ai-automation-saudi.html",
    model: "gemini-2.5-flash",
    sector: "العمليات والأتمتة",
    audience: "مديرو العمليات والتحول الرقمي والفرق الإدارية",
    problem: "مهام متكررة بين البريد والواتساب والملفات تؤخر القرار وتزيد الأخطاء",
    outcome: "خريطة سير عمل، نقاط أتمتة، مخاطر، ومؤشر جاهزية",
    answer: "صف العملية المتكررة، وسيقترح الديمو أين تبدأ الأتمتة وكيف تربطها بالأنظمة بدون تعقيد.",
    samples: [
      ["اعتمادات", "طلب شراء يبدأ من نموذج داخلي، يمر على المدير المالي، ثم المشتريات، ثم إشعار واتساب لصاحب الطلب."],
      ["تقارير", "كل أسبوع يجمع الفريق أرقام المبيعات من ملفات متعددة ويرسل ملخصاً للإدارة مساء الخميس."],
      ["خدمة", "بلاغات العملاء تصل من واتساب والبريد وتحتاج تصنيفاً ثم توجيهاً للفريق المختص خلال ساعتين."]
    ],
    faq: [["ما أفضل عملية أبدأ بها؟", "ابدأ بعملية متكررة، عالية الحجم، واضحة الخطوات، ولا تحتاج حكماً بشرياً معقداً في كل مرة."]]
  },
  {
    slug: "ai-workflows",
    path: "demo/ai-workflows",
    demoType: "ai-workflows",
    title: "AI Workflows",
    h1: "سير عمل AI من الفكرة إلى التنفيذ",
    service: "/services/approvals-automation.html",
    model: "gemini-2.5-flash",
    sector: "سير العمل المؤسسي",
    audience: "فرق المنتج والعمليات والتحول الرقمي",
    problem: "تداخل الخطوات بين البشر والأنظمة والذكاء الاصطناعي بدون ترتيب واضح",
    outcome: "تصميم سير عمل، أدوار، نقاط قرار، ومخرجات قابلة للقياس",
    answer: "اكتب هدف سير العمل، وسيحوّله الديمو إلى خطوات منظمة بين الإنسان والأنظمة والذكاء الاصطناعي.",
    samples: [
      ["تأهيل عميل", "نموذج عميل جديد يصل من الموقع، يحتاج تلخيص احتياجه، تقييم الأولوية، ثم جدولة اتصال للمبيعات."],
      ["مراجعة مستند", "ملف عقد جديد يحتاج استخراج البنود المهمة، مقارنة سياسة الشركة، ثم إرسال نقاط مراجعة للإدارة."],
      ["إطلاق خدمة", "فريق المنتج يحتاج جمع ملاحظات العملاء، تلخيصها، ترتيب الأولويات، ثم إرسال خطة أسبوعية."]
    ],
    faq: [["ما الفرق بين سير العمل والأتمتة؟", "سير العمل يحدد التسلسل والأدوار ونقاط القرار، بينما الأتمتة تنفذ أجزاء محددة من هذا التسلسل."]]
  },
  {
    slug: "smart-education-platform",
    path: "demo/smart-education-platform",
    demoType: "smart-education-platform",
    title: "منصة تعليمية ذكية متكاملة",
    h1: "منصة تعليمية ذكية للمدارس ومراكز التدريب",
    service: "/services/ai-scolecs.html",
    model: "gemini-2.5-flash",
    sector: "التعليم والتدريب",
    audience: "المدارس الأهلية ومراكز التدريب والجامعات",
    problem: "صعوبة متابعة أداء المتعلمين وتخصيص الدعم وتلخيص تقدم الدورات",
    outcome: "خطة تعلم، مؤشرات متابعة، تدخلات مبكرة، وتقارير إدارية",
    answer: "أدخل وصف برنامج أو فصل تدريبي، وسيقترح الديمو مؤشرات التعلم والتدخلات المناسبة.",
    samples: [
      ["مدرسة", "صف ثالث متوسط لديه انخفاض في الواجبات ونتائج متفاوتة في الرياضيات، والمعلم يحتاج خطة متابعة أسبوعية."],
      ["مركز تدريب", "برنامج مهني مدته ٦ أسابيع، الحضور جيد لكن إنجاز المشاريع منخفض ويحتاج المدرب إنذارات مبكرة."],
      ["جامعة", "مقرر كبير بعدد ١٨٠ طالباً، تحتاج الإدارة ملخص أداء ومجموعات دعم للطلاب المتعثرين."]
    ],
    faq: [["هل يناسب التعليم الأهلي؟", "نعم، يناسب المدارس ومراكز التدريب التي تحتاج متابعة تقدم وتدخلات مبكرة وتقارير واضحة للإدارة."]]
  },
  {
    slug: "smart-hospital-management",
    path: "demo/smart-hospital-management",
    demoType: "smart-hospital-management",
    title: "نظام إدارة المستشفيات الذكية",
    h1: "إدارة المستشفى الذكية بالذكاء الاصطناعي",
    service: "/services/smart-hospital-management.html",
    model: "gemini-2.5-pro",
    sector: "الرعاية الصحية",
    audience: "إدارة المستشفيات والعيادات وفرق الجودة",
    problem: "صعوبة رؤية الاختناقات بين الانتظار والأسرة والعيادات والجودة التشغيلية",
    outcome: "مؤشرات تشغيلية، مخاطر جودة، أولويات تحسين، وخطة متابعة",
    answer: "أدخل مؤشرات تشغيلية غير حساسة، وسيعرض الديمو لوحة قرار تساعد الإدارة على ترتيب التحسينات.",
    samples: [
      ["طوارئ", "متوسط الانتظار ٧٥ دقيقة، إشغال الأسرة ٨٨٪، زيادة مراجعي المساء، وشكاوى عن تأخر نتائج المختبر."],
      ["عيادات", "نسبة عدم الحضور ٢٢٪، ضغط على عيادة الجلدية، ومواعيد متابعة تتأخر أكثر من ١٤ يوماً."],
      ["جودة", "ارتفاع إعادة الجدولة، ملاحظات رضا منخفضة في الاستقبال، وتباين زمن الخدمة بين الفروع."]
    ],
    faq: [["هل يستخدم بيانات مرضى؟", "الديمو العام لا يحتاج بيانات مرضى. استخدم مؤشرات تشغيلية منزوعة الحساسية فقط، والنسخة المخصصة تُصمم بضوابط صحية مناسبة."]]
  }
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function json(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function waLink(title) {
  return `${wa}?text=${encodeURIComponent(`هلا والله، شفت ديمو ${title} وأبغى نسخة مخصصة لشركتي عبر Bright AI`)}`;
}

function fallback(demo) {
  return {
    executiveSummary: [
      `هذا اللي طلع معنا: ${demo.title} يقدر يساعد فريقك في التعامل مع ${demo.problem} إذا كانت المدخلات واضحة وغير حساسة.`,
      `المخرجات المتوقعة هي ${demo.outcome}، وتبقى للمراجعة البشرية قبل أي قرار تشغيلي.`
    ],
    score: demo.model.includes("pro") ? 86 : 82,
    keyInsights: [
      `السيناريو مناسب لـ ${demo.audience}.`,
      "العينة تكفي لتجربة الفكرة، لكنها ما تمثل كل بيانات الشركة.",
      "ربط الأنظمة الداخلية يرفع جودة التقرير ويخفف العمل اليدوي."
    ],
    risks: [
      "لا ترفع بيانات حساسة في النسخة العامة.",
      "النتائج تقديرية وتحتاج اعتماد صاحب القرار.",
      "ضعف جودة البيانات قد يغيّر التوصيات."
    ],
    recommendedActions: [
      "ابدأ بسيناريو واحد عالي الأثر.",
      "حدد مؤشر نجاح واضح قبل التوسع.",
      "اطلب نسخة مخصصة إذا تبغى ربط الأنظمة والصلاحيات."
    ],
    businessImpact: "تقليل وقت التحليل اليدوي وتحويل التجربة إلى قرار قابل للقياس حسب حجم البيانات وتكرار العملية.",
    integrationReadiness: ["API", "صلاحيات وصول", "سجل تدقيق", "تصدير تقرير"],
    nextSteps: ["راجع التقرير مع الفريق", "حدد الأنظمة المطلوب ربطها", "احجز مكالمة 15 دقيقة مع Bright AI"]
  };
}

function schema(demo) {
  const url = `${site}/${demo.path}/`;
  const faq = [...sharedFaq, ...demo.faq];
  const graph = [
    { "@type": "Organization", "@id": `${site}/#organization`, name: "Bright AI", url: `${site}/`, logo: `${site}/assets/images/logo.PNG`, areaServed: { "@type": "Country", name: "Saudi Arabia" }, contactPoint: { "@type": "ContactPoint", telephone: "+966538229013", contactType: "sales", areaServed: "SA", availableLanguage: ["Arabic"] } },
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: `${demo.title} | Bright AI`, description: demo.answer, inLanguage: "ar-SA", isPartOf: { "@id": `${site}/#website` }, about: { "@id": `${url}#software` } },
    { "@type": "SoftwareApplication", "@id": `${url}#software`, name: demo.title, applicationCategory: "BusinessApplication", operatingSystem: "Web", url, inLanguage: "ar-SA", description: demo.answer, provider: { "@id": `${site}/#organization` }, offers: { "@type": "Offer", price: "0", priceCurrency: "SAR", description: "تجربة عامة مجانية قبل طلب نسخة مخصصة" } },
    { "@type": "Service", "@id": `${site}${demo.service}#service`, name: demo.title, serviceType: demo.sector, url: `${site}${demo.service}`, description: demo.answer, provider: { "@id": `${site}/#organization` }, areaServed: { "@type": "Country", name: "Saudi Arabia" } },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "الرئيسية", item: `${site}/` }, { "@type": "ListItem", position: 2, name: "الديموهات", item: `${site}/demo/` }, { "@type": "ListItem", position: 3, name: demo.title, item: url }] }
  ];
  if (demo.path !== "ai-agent") {
    graph.splice(4, 0, { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  }
  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

function page(demo) {
  const url = `${site}/${demo.path}/`;
  const config = { slug: demo.slug, demoKey: demo.slug, demoType: demo.demoType, agentType: demo.demoType, locale: "ar-SA", sourcePage: `/${demo.path}/`, title: demo.title, model: demo.model, problem: demo.problem, outcome: demo.outcome, fallbackResult: fallback(demo) };
  const faq = [...sharedFaq, ...demo.faq];
  const sampleButtons = demo.samples.map(([name, body], i) => `<button type="button" class="sample-card" data-sample="${i}"><strong>${esc(name)}</strong><span>${esc(body)}</span></button>`).join("\n          ");
  const options = demo.samples.map(([name]) => `<option>${esc(name)}</option>`).join("");
  const cases = demo.samples.map(([name, body]) => `<article><h3>${esc(name)}</h3><p><strong>الحالة:</strong> ${esc(demo.problem)}.</p><p><strong>المدخلات:</strong> ${esc(body)}</p><p><strong>مخرجات الديمو:</strong> ${esc(demo.outcome)}.</p><p><strong>الأثر التجاري:</strong> وضوح أسرع وتجربة قابلة للتخصيص.</p></article>`).join("\n        ");
  const faqHtml = faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n      ");
  const related = demos.filter((item) => item.slug !== demo.slug).slice(0, 4).map((item) => `<a href="/${item.path}/">${esc(item.title)}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-8LLESL207Q');</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Bright AI">
  <meta name="theme-color" content="#07111f">
  <title>${esc(demo.title)} | ديمو ذكاء اصطناعي للشركات السعودية</title>
  <meta name="description" content="${esc(demo.answer)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ar-SA" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
  <link rel="sitemap" type="application/xml" href="${site}/sitemap.xml">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Bright AI">
  <meta property="og:title" content="${esc(demo.title)} | Bright AI">
  <meta property="og:description" content="${esc(demo.answer)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site}/assets/images/og/demos/${demo.slug}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(demo.title)} | Bright AI">
  <meta name="twitter:description" content="${esc(demo.answer)}">
  <meta name="twitter:image" content="${site}/assets/images/og/demos/${demo.slug}.png">
  <link rel="icon" href="/assets/images/logo.PNG" type="image/png">
  <link rel="stylesheet" href="/assets/css/design-tokens.css">
  <link rel="stylesheet" href="/assets/css/demo-premium.css">
  <link rel="stylesheet" href="/assets/css/demo-design-system.css">
  <script type="application/ld+json">${json(schema(demo))}</script>
</head>
<body class="premium-demo" data-demo-slug="${esc(demo.slug)}">
  <a class="skip-link" href="#demo-form">تجاوز إلى التجربة</a>
  <header class="demo-nav" aria-label="تنقل الديمو">
    <a class="brand" href="/" aria-label="Bright AI الرئيسية"><img src="/assets/images/logo.PNG" width="36" height="36" alt="شعار Bright AI" decoding="async"></a>
    <nav class="nav-links" aria-label="روابط داخلية"><a href="/demo/">كل الديموهات</a><a href="/services/">الخدمات</a><a href="${esc(demo.service)}">صفحة الخدمة</a><a href="/contact/">تواصل معنا</a></nav>
  </header>
  <main>
    <section class="hero section">
      <div class="hero-copy">
        <p class="eyebrow">هلا والله، نوّرت 👋</p>
        <h1>${esc(demo.h1)}</h1>
        <p class="direct-answer">خلّنا نوريك وش يقدر يسوّيه BrightAI لشركتك. ${esc(demo.answer)}</p>
        <div class="hero-points" aria-label="قيمة الديمو"><span>المشكلة: ${esc(demo.problem)}</span><span>النتيجة: ${esc(demo.outcome)}</span><span>الفئة: ${esc(demo.audience)}</span></div>
        <div class="hero-actions"><button class="btn btn-secondary" type="button" data-load-first-sample>جرّب مثال جاهز</button><a class="btn btn-primary" href="#demo-form">ابدأ التجربة</a><a class="btn btn-outline" href="${waLink(demo.title)}" target="_blank" rel="noopener">اطلب نسخة مخصصة</a></div>
      </div>
      <aside class="quick-answer" aria-label="إجابة سريعة">
        <img src="/assets/images/logo.PNG" width="96" height="96" alt="رمز Bright AI" loading="eager" decoding="async">
        <h2>الزبدة بسرعة</h2>
        <dl><div><dt>لمن هذه التجربة؟</dt><dd>${esc(demo.audience)}</dd></div><div><dt>ماذا تحتاج؟</dt><dd>وصف مختصر أو عينة بيانات غير حساسة.</dd></div><div><dt>ماذا ستحصل؟</dt><dd>${esc(demo.outcome)}.</dd></div><div><dt>الموديل الافتراضي</dt><dd><span dir="ltr">${esc(demo.model)}</span> عبر الخلفية فقط.</dd></div></dl>
      </aside>
    </section>
    <section class="section quote-summary" aria-labelledby="summary-heading"><h2 id="summary-heading">ملخص التجربة</h2><ul><li>${esc(demo.title)} تجربة عملية موجهة للسوق السعودي.</li><li>الديمو يساعدك تتعامل مع ${esc(demo.problem)} بمدخلات بسيطة وقابلة للمراجعة.</li><li>المخرجات تشمل ${esc(demo.outcome)} دون كشف بيانات حساسة.</li><li>كل طلب AI يمر عبر الخلفية ولا يوجد استدعاء مباشر من المتصفح إلى مزود النماذج.</li></ul></section>
    <section class="section" aria-labelledby="what-heading"><h2 id="what-heading">ما الذي يفعله الديمو؟</h2><div class="two-col"><p>${esc(demo.title)} يحوّل سيناريو عمل قصير من قطاع ${esc(demo.sector)} إلى تقرير تنفيذي يساعدك تفهم الوضع الحالي والخطوة الجاية بدون ما يعطي AI قرار نهائي بدالك.</p><div class="trust-list" aria-label="مؤشرات ثقة"><span>عربي سعودي</span><span>اتجاه كامل من اليمين لليسار</span><span>قابل للتكامل</span><span>صلاحيات وسجل تدقيق</span><span>مناسب للشركات</span></div></div></section>
    <section class="section steps" aria-labelledby="usage-heading"><h2 id="usage-heading">كيف تستخدم التجربة؟</h2><ol><li><strong>اختر السيناريو</strong><span>اختر السيناريو اللي يشبه شغلك، أو اكتب سياقك.</span></li><li><strong>أدخل بيانات بسيطة</strong><span>استخدم وصف مختصر وغير حساس.</span></li><li><strong>شغّل AI</strong><span>الطلب يمر عبر المسار الخلفي الآمن فقط.</span></li><li><strong>شوف التقرير</strong><span>راجع التقرير ثم اطلب نسخة مخصصة.</span></li></ol></section>
    <section class="section demo-workspace" aria-labelledby="samples-heading"><div class="workspace-copy"><h2 id="samples-heading">خلّنا نجرّبها سوا</h2><p>اختر السيناريو اللي يشبه شغلك، وخلّنا نبدأ. لا تستخدم بيانات حساسة في هذه النسخة العامة.</p><div class="sample-grid">${sampleButtons}</div></div><form class="demo-form" id="demo-form" data-demo-form><input type="hidden" name="demoType" value="${esc(demo.demoType)}"><label for="scenario">السيناريو</label><select id="scenario" name="scenario">${options}</select><label for="demo-input">البيانات المختصرة</label><textarea id="demo-input" name="input" rows="7" required placeholder="اكتب وصف مختصر أو استخدم مثال جاهز. لا تضع بيانات حساسة.">${esc(demo.samples[0][1])}</textarea><details class="advanced-settings"><summary>الإعدادات المتقدمة</summary><label for="goal">هدف القرار</label><input id="goal" name="goal" value="${esc(demo.outcome)}"><label for="systems">الأنظمة المحتملة للربط</label><input id="systems" name="systems" value="نظام داخلي، ملفات بيانات، واتساب، أو API"></details><div class="form-actions"><button class="btn btn-primary" type="submit">شغّل التحليل</button><button class="btn btn-secondary" type="button" data-reset-demo>إعادة ضبط</button></div><p class="privacy-note">بياناتك تبقى عندك، استخدم بيانات وهمية أو منزوعة الحساسية فقط.</p></form></section>
    <section class="section result-zone" aria-labelledby="result-heading"><div><h2 id="result-heading">هذا اللي بيطلع معنا</h2><p>النتيجة قدامك كلوحة قرار واضحة، مو ملف خام. وإذا صار خلل بسيط، نعرض لك نتيجة توضيحية آمنة مع زر إعادة المحاولة.</p><ul class="result-promises"><li>ملخص تنفيذي</li><li>مؤشر جاهزية</li><li>رؤى رئيسية</li><li>مخاطر</li><li>قرارات قابلة للتنفيذ</li><li>أثر تجاري</li><li>جاهزية تكامل</li><li>خطوات تالية</li></ul></div><div class="loading-box" data-loading-box hidden><p>AI يفكّر الحين... خلّنا نشوف وش بيطلع</p><ol><li data-stage="0">نقرأ الطلب الحين</li><li data-stage="1">نستخرج الكيانات</li><li data-stage="2">نبني المؤشرات</li><li data-stage="3">نجهّز التحليل</li><li data-stage="4">نرتّب التقرير</li></ol></div><div class="result-panel" data-result-panel aria-live="polite"><div class="empty-state"><strong>تمام، جاهز نبدأ؟</strong><p>شغّل التجربة، وثوانٍ بس وتجيك النتيجة كلوحة تنفيذية قابلة للمشاركة.</p></div></div></section>
    <section class="section comparison" aria-labelledby="compare-heading"><h2 id="compare-heading">قبل Bright AI / بعد Bright AI</h2><div class="compare-grid"><article><h3>قبل Bright AI</h3><p>العمل اليدوي ياخذ وقت، والمخرجات تتفاوت، والقرار يتشتت بين الملفات والرسائل.</p></article><article><h3>بعد Bright AI</h3><p>تبدأ من سيناريو واضح، تشوف تقرير منظم، ثم تطلب نسخة مخصصة مرتبطة بالأنظمة والصلاحيات.</p></article></div></section>
    <section class="section use-cases" aria-labelledby="use-cases-heading"><h2 id="use-cases-heading">حالات استخدام منظمة</h2><div class="case-grid">${cases}</div></section>
    <section class="section" aria-labelledby="why-heading"><h2 id="why-heading">الديموهات المرتبطة</h2><p>انتقل بين الديموهات السبعة فقط لمقارنة حالات الاستخدام قبل طلب نسخة مخصصة.</p><div class="internal-links">${related}</div></section>
    <section class="section faq" aria-labelledby="faq-heading"><h2 id="faq-heading">الأسئلة الشائعة</h2>${faqHtml}</section>
    <section class="section final-cta" aria-label="خطوة تجارية"><h2>خلّ BrightAI يضبطها لك بمقاسك</h2><p>عجبتك التجربة؟ خلّنا نضبطها على بيانات شركتك خلال 48 ساعة كبداية عمل واضحة، بعد ما نراجع المتطلبات معك.</p><div class="hero-actions"><a class="btn btn-primary" href="/contact/">احجز مكالمة 15 دقيقة</a><a class="btn btn-secondary" href="${waLink(demo.title)}" target="_blank" rel="noopener">اطلب عرض سعر</a><button class="btn btn-outline" type="button" data-download-report>حمّل التقرير</button></div></section>
  </main>
  <footer class="demo-footer"><p>© 2026 Bright AI. تجربة ${esc(demo.title)} مخصصة للمراجعة الأولية ولا تقدم ضمانات نتائج.</p><a href="/docs/privacy-policy.html">سياسة الخصوصية</a></footer>
  <script type="application/json" id="demo-config">${json(config)}</script>
  <script type="application/json" id="demo-samples">${json(demo.samples)}</script>
  <script defer src="/assets/js/demo-config.js"></script>
  <script defer src="/assets/js/demo-api-client.js"></script>
  <script defer src="/assets/js/demo-ui-kit.js"></script>
  <script defer src="/assets/js/demo-streaming.js"></script>
  <script defer src="/assets/js/demo-analytics.js"></script>
  <script defer src="/assets/js/demo-a11y.js"></script>
  <script defer src="/assets/js/demo-shared-app.js"></script>
  <script src="/frontend/js/production-runtime.v20260427.js" defer></script>
  <script defer src="/frontend/js/accessibility.min.js?v=2026042904"></script>
  <script src="/frontend/js/brightai-logo-replace.js" defer></script>
</body>
</html>
`;
}

for (const demo of demos) {
  const dir = path.join(root, demo.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(demo));
}

function demoIndex() {
  const cards = demos.map((demo) => `<article class="dash-section"><h3>${esc(demo.title)}</h3><p>${esc(demo.answer)}</p><div class="dash-cta"><a class="btn btn-primary" href="/${demo.path}/">افتح الديمو</a><a class="btn btn-outline" href="${esc(demo.service)}">صفحة الخدمة</a></div></article>`).join("\n        ");
  const schemaIndex = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${site}/demo/#webpage`,
    url: `${site}/demo/`,
    name: "ديموهات Bright AI السبعة",
    inLanguage: "ar-SA",
    hasPart: demos.map((demo) => ({ "@type": "SoftwareApplication", name: demo.title, url: `${site}/${demo.path}/`, applicationCategory: "BusinessApplication" }))
  };
  return `<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-8LLESL207Q');</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#07111f">
  <title>ديموهات Bright AI السبعة للشركات السعودية</title>
  <meta name="description" content="سبعة ديموهات ذكاء اصطناعي عملية من Bright AI للشركات السعودية: وكلاء، مناقصات، بيانات، أتمتة، سير عمل، تعليم، ومستشفيات.">
  <link rel="canonical" href="${site}/demo/">
  <link rel="alternate" hreflang="ar-SA" href="${site}/demo/">
  <link rel="alternate" hreflang="x-default" href="${site}/demo/">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:type" content="website">
  <meta property="og:title" content="ديموهات Bright AI السبعة للشركات السعودية">
  <meta property="og:description" content="اختر ديمو، شغّل سيناريو سعودي، وشاهد تقرير ذكاء اصطناعي جاهز للقرار خلال دقائق.">
  <meta property="og:url" content="${site}/demo/">
  <meta property="og:image" content="${site}/assets/images/logo.PNG">
  <link rel="icon" href="/assets/images/logo.PNG" type="image/png">
  <link rel="stylesheet" href="/assets/css/design-tokens.css">
  <link rel="stylesheet" href="/assets/css/demo-premium.css">
  <script type="application/ld+json">${json(schemaIndex)}</script>
</head>
<body class="premium-demo" data-demo-slug="demo-index">
  <header class="demo-nav" aria-label="تنقل الديموهات"><a class="brand" href="/"><img src="/assets/images/logo.PNG" width="36" height="36" alt="شعار Bright AI"></a><nav class="nav-links"><a href="/services/">الخدمات</a><a href="/contact/">تواصل معنا</a></nav></header>
  <main>
    <section class="hero section"><div class="hero-copy"><p class="eyebrow">هلا والله، نوّرت 👋</p><h1>ديموهات Bright AI للشركات السعودية</h1><p class="direct-answer">اختر حالة استخدام تشبه شغلك، شغّل سيناريو سعودي، وشوف تقرير واضح يساعدك تنتقل من الفضول إلى خطوة تواصل ذكية بدون مبالغة.</p><div class="hero-points"><span>كل الطلبات تمر عبر الخلفية فقط</span><span>واجهة عربية باتجاه كامل من اليمين لليسار</span><span>مهيأة للفهرسة والثقة والتحويل</span></div></div><aside class="quick-answer"><h2>الزبدة بسرعة</h2><dl><div><dt>العدد</dt><dd>٧ ديموهات فقط</dd></div><div><dt>السوق</dt><dd>الشركات السعودية</dd></div><div><dt>الهدف</dt><dd>نتيجة واضحة ثم دعوة إجراء مباشرة</dd></div></dl></aside></section>
    <section class="section use-cases" aria-labelledby="demos-heading"><h2 id="demos-heading">اختر الديمو</h2><div class="case-grid">${cards}</div></section>
    <section class="section final-cta"><h2>خلّ BrightAI يضبطها لك بمقاسك</h2><p>ابدأ بالديمو الأقرب لحالتك، ثم احجز مكالمة قصيرة عشان نحوله إلى تطبيق مرتبط ببياناتك.</p><div class="hero-actions"><a class="btn btn-primary" href="/contact/">احجز مكالمة 15 دقيقة</a><a class="btn btn-secondary" href="${wa}?text=${encodeURIComponent("هلا والله، أبغى أجرب ديموهات Bright AI واختيار الأنسب لشركتي")}" target="_blank" rel="noopener">اطلبها عبر واتساب</a></div></section>
  </main>
  <footer class="demo-footer"><p>© 2026 Bright AI. مركز الديموهات الرسمي.</p><a href="/docs/privacy-policy.html">سياسة الخصوصية</a></footer>
</body>
</html>
`;
}

fs.writeFileSync(path.join(root, "demo", "index.html"), demoIndex());

const sitemapPath = path.join(root, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8");
for (const demo of demos) {
  const loc = `${site}/${demo.path}/`;
  if (!sitemap.includes(`<loc>${loc}</loc>`)) {
    const entry = `  <url>\n    <loc>${loc}</loc>\n    <xhtml:link rel="alternate" hreflang="ar-SA" href="${loc}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />\n    <lastmod>${today}</lastmod>\n    <priority>0.9</priority>\n  </url>\n`;
    sitemap = sitemap.replace("</urlset>", `${entry}\n</urlset>`);
  }
}
fs.writeFileSync(sitemapPath, sitemap);

console.log(`Generated ${demos.length} investor-grade demos.`);
