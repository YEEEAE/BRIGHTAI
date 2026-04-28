import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const site = "https://brightai.site";
const reportsDir = path.join(root, "reports");
const indexablePath = path.join(reportsDir, "indexable-pages-final.txt");

const forbiddenSchema = new Set(["FAQPage", "HowTo", "SpecialAnnouncement", "VehicleListing", "ClaimReview"]);
const moneyPages = [
  "/", "/services/", "/ai-agent/", "/smart-automation/", "/data-analysis/", "/ai-workflows/",
  "/ai-bots/", "/smart-medical-archive/", "/tenders/", "/consultation/", "/contact/"
];

const explicit = {
  "/": ["homepage", "commercial_investigation", "entity_trust", "شركة ذكاء اصطناعي في السعودية", "الرئيسية"],
  "/about/": ["about_page", "local_commercial", "entity_trust", "شركة ذكاء اصطناعي وطنية في الرياض", "الثقة والكيان"],
  "/services/": ["service_page", "commercial_investigation", "conversion", "حلول ذكاء اصطناعي للشركات", "الاستكشاف التجاري"],
  "/ai-agent/": ["service_page", "commercial_investigation", "informational", "وكلاء ذكاء اصطناعي للمؤسسات", "الاستكشاف التجاري"],
  "/smart-automation/": ["service_page", "commercial_investigation", "conversion", "أتمتة العمليات بالذكاء الاصطناعي", "الاستكشاف التجاري"],
  "/data-analysis/": ["service_page", "commercial_investigation", "commercial_investigation", "تحليل البيانات للشركات السعودية", "الاستكشاف التجاري"],
  "/ai-bots/": ["service_page", "commercial_investigation", "product_demo", "شات بوت للشركات السعودية", "الاستكشاف التجاري"],
  "/ai-workflows/": ["service_page", "commercial_investigation", "informational", "أتمتة سير العمل", "الاستكشاف التجاري"],
  "/smart-medical-archive/": ["service_page", "sector_solution", "commercial_investigation", "الأرشيف الطبي الذكي بالذكاء الاصطناعي", "حل قطاعي"],
  "/tools/": ["tool_page", "product_demo", "lead_acquisition", "أدوات تحليل البيانات بالذكاء الاصطناعي", "تجربة المنتج"],
  "/tenders/": ["tender_demo_page", "product_demo", "commercial_investigation", "نظام تحليل المناقصات بالذكاء الاصطناعي", "تجربة المنتج"],
  "/tenders/landing/": ["tender_demo_page", "product_demo", "transactional", "نظام مناقصات ذكي", "تجربة المنتج"],
  "/tenders/compare/": ["tender_demo_page", "product_demo", "transactional", "مقارنة عروض المناقصات", "تجربة المنتج"],
  "/tenders/dashboard/": ["tender_demo_page", "product_demo", "product_demo", "لوحة تحليل المناقصات", "تجربة المنتج"],
  "/tenders/reports/": ["tender_demo_page", "product_demo", "product_demo", "تقارير المناقصات التنفيذية", "تجربة المنتج"],
  "/tenders/templates/": ["tender_demo_page", "informational", "product_demo", "قوالب تقييم المناقصات", "تجربة المنتج"],
  "/tenders/settings/": ["tender_demo_page", "product_demo", "governance", "حوكمة منصة المناقصات", "تجربة المنتج"],
  "/consultation/": ["consultation_page", "transactional", "conversion", "استشارات الذكاء الاصطناعي السعودية", "التحويل"],
  "/contact/": ["contact_page", "transactional", "navigational", "تواصل مع شركة ذكاء اصطناعي في السعودية", "التحويل"],
  "/sectors/finance/": ["sector_page", "sector_solution", "commercial_investigation", "الذكاء الاصطناعي في القطاع المالي", "حل قطاعي"],
  "/sectors/healthcare/": ["sector_page", "sector_solution", "commercial_investigation", "الذكاء الاصطناعي في الرعاية الصحية", "حل قطاعي"],
  "/sectors/manufacturing/": ["sector_page", "sector_solution", "commercial_investigation", "الذكاء الاصطناعي في المصانع", "حل قطاعي"],
  "/sectors/logistics/": ["sector_page", "sector_solution", "commercial_investigation", "الذكاء الاصطناعي في الخدمات اللوجستية", "حل قطاعي"],
  "/sectors/energy/": ["sector_page", "sector_solution", "commercial_investigation", "الذكاء الاصطناعي في قطاع الطاقة", "حل قطاعي"],
  "/sectors/ecommerce/": ["sector_page", "sector_solution", "commercial_investigation", "أتمتة التسويق بالذكاء الاصطناعي", "حل قطاعي"],
  "/machine-learning/": ["service_page", "commercial_investigation", "informational", "تطوير نماذج تعلم الآلة السعودية", "الاستكشاف التجاري"],
  "/what-is-ai/": ["blog_article", "informational", "commercial_support", "تعريف الذكاء الاصطناعي", "الوعي"],
  "/health/": ["sector_page", "sector_solution", "informational", "التحول الرقمي في الرعاية الصحية", "حل قطاعي"],
  "/demo/smart-hiring-system/": ["product_page", "product_demo", "commercial_investigation", "منصة توظيف بالذكاء الاصطناعي", "تجربة المنتج"],
  "/partners/": ["about_page", "commercial_investigation", "entity_trust", "شراكات الذكاء الاصطناعي في السعودية", "الثقة"],
  "/case-studies/": ["case_study_page", "commercial_investigation", "proof", "دراسات حالة الذكاء الاصطناعي في السعودية", "الثقة"],
  "/try/": ["tool_page", "product_demo", "lead_acquisition", "تجربة أدوات الذكاء الاصطناعي", "تجربة المنتج"],
  "/try/data-analyzer/": ["tool_page", "product_demo", "lead_acquisition", "تحليل بيانات مجاني", "تجربة المنتج"],
  "/try/data-quality/": ["tool_page", "product_demo", "lead_acquisition", "فحص جودة البيانات", "تجربة المنتج"],
  "/try/text-analysis/": ["tool_page", "product_demo", "lead_acquisition", "تحليل النصوص بالذكاء الاصطناعي", "تجربة المنتج"],
  "/demo/": ["demo_page", "product_demo", "lead_acquisition", "ديمو حلول الذكاء الاصطناعي", "تجربة المنتج"],
  "/demo/ocr-demo/": ["demo_page", "product_demo", "lead_acquisition", "OCR عربي بالذكاء الاصطناعي", "تجربة المنتج"],
  "/demo/pricing/": ["demo_page", "transactional", "commercial_investigation", "أسعار حلول الذكاء الاصطناعي", "التحويل"],
  "/demo/resources/report-ai-saudi-2026/": ["blog_article", "thought_leadership", "lead_acquisition", "تقرير الذكاء الاصطناعي في السعودية 2026", "الوعي"],
  "/en/": ["homepage", "commercial_investigation", "entity_trust", "artificial intelligence company in Saudi Arabia", "Commercial"],
  "/en/about/": ["about_page", "local_commercial", "entity_trust", "national AI company in Riyadh", "Trust"],
  "/en/services/": ["service_page", "commercial_investigation", "conversion", "AI solutions for businesses", "Commercial"],
  "/en/ai-agent/": ["service_page", "commercial_investigation", "informational", "AI agents for enterprises", "Commercial"],
  "/en/data-analysis/": ["service_page", "commercial_investigation", "conversion", "data analysis for Saudi companies", "Commercial"],
  "/en/smart-automation/": ["service_page", "commercial_investigation", "conversion", "AI automation for businesses", "Commercial"],
  "/en/ai-workflows/": ["service_page", "commercial_investigation", "informational", "AI workflow automation", "Commercial"],
  "/en/smart-medical-archive/": ["service_page", "sector_solution", "commercial_investigation", "AI medical archive", "Sector"],
  "/en/tools/": ["tool_page", "product_demo", "lead_acquisition", "AI data analysis tools", "Demo"],
  "/en/consultation/": ["consultation_page", "transactional", "conversion", "AI consulting in Saudi Arabia", "Conversion"],
  "/en/contact/": ["contact_page", "transactional", "navigational", "contact an AI company in Saudi Arabia", "Conversion"],
  "/en/health/": ["sector_page", "sector_solution", "informational", "digital transformation in healthcare", "Sector"],
  "/en/demo/smart-hiring-system/": ["product_page", "product_demo", "commercial_investigation", "AI recruitment platform", "Demo"],
  "/en/docs/": ["docs_page", "support_documentation", "navigational", "Bright AI documentation", "Support"],
};

const tenderEnglish = {
  "/en/tenders/": "AI tender analysis system",
  "/en/tenders/landing/": "smart tender management system",
  "/en/tenders/compare/": "AI tender offer comparison",
  "/en/tenders/dashboard/": "tender analytics dashboard",
  "/en/tenders/reports/": "executive tender reports",
  "/en/tenders/templates/": "tender evaluation templates",
  "/en/tenders/settings/": "tender platform governance"
};
for (const [route, keyword] of Object.entries(tenderEnglish)) {
  explicit[route] = ["tender_demo_page", "product_demo", route.includes("settings") ? "governance" : "transactional", keyword, "Demo"];
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (["node_modules", ".git", ".next", "dist", "build", "coverage", "venv", "render-public"].includes(name)) continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(abs, out);
    else if (name.endsWith(".html")) out.push(abs);
  }
  return out;
}

function routeFromUrl(url) {
  return new URL(url).pathname;
}

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function isEnglishRoute(route, lang = "") {
  const segments = route.split("/").filter(Boolean);
  return route.startsWith("/en/") || segments.some((segment) => segment.endsWith("-en")) || /^en/i.test(lang);
}

function routeToFile(route) {
  const candidates = [];
  if (route === "/") candidates.push("index.html");
  else {
    const clean = decodeURIComponent(route).replace(/^\/|\/$/g, "");
    candidates.push(`${clean}/index.html`, `${clean}.html`);
  }
  for (const rel of candidates) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function pageTypeFor(route) {
  if (route.includes("/blog/")) return "blog_article";
  if (route.startsWith("/docs/") || route.startsWith("/en/docs/") || route === "/docs/") return "docs_page";
  if (route.includes("/tenders/")) return "tender_demo_page";
  if (route.includes("/sectors/")) return "sector_page";
  if (route.includes("/try/") || route.includes("/tools/")) return "tool_page";
  if (route.includes("/demo/")) return "demo_page";
  if (route.includes("/contact/")) return "contact_page";
  if (route.includes("/consultation/")) return "consultation_page";
  if (route.includes("/about/") || route.includes("/partners/")) return "about_page";
  if (route.includes("/case-studies/")) return "case_study_page";
  if (route.includes("/demo/smart-hiring-system/")) return "product_page";
  if (["/404/", "/500/", "/error/"].includes(route)) return "error_page";
  return "service_page";
}

function keywordFromTitle(title, route, en) {
  let value = cleanText(title).replace(/\s*\|\s*Bright AI.*$/i, "").replace(/\s*\|\s*ContractAI.*$/i, "");
  value = value.replace(/^Bright AI\s*[-|]\s*/i, "").replace(/\s*-\s*Bright AI.*$/i, "");
  value = value.replace(/\s*\|\s*/g, en ? " - " : " - ");
  value = value.replace(/\s*:\s*Practical Guide$/i, "").replace(/\s*:\s*شرح عملي$/i, "");
  if (!value || value.length < 4) {
    const slug = decodeURIComponent(route).replace(/^\/|\/$/g, "").split("/").pop().replace(/-/g, " ");
    value = en ? slug : slug;
  }
  return value;
}

function classify(route, title, lang) {
  const en = isEnglishRoute(route, lang);
  if (explicit[route]) {
    const [pageType, intent, secondaryIntent, keyword, stage] = explicit[route];
    return makeMeta({ route, en, pageType, intent, secondaryIntent, keyword, stage });
  }
  const pageType = pageTypeFor(route);
  let intent = "commercial_investigation";
  let secondaryIntent = "conversion";
  let stage = en ? "Commercial" : "الاستكشاف التجاري";
  if (pageType === "blog_article") {
    intent = route.includes("case-study") ? "case_study" : (route.includes("vision") || route.includes("guide") ? "thought_leadership" : "informational");
    secondaryIntent = "commercial_support";
    stage = en ? "Awareness" : "الوعي";
  } else if (pageType === "docs_page") {
    intent = "support_documentation";
    secondaryIntent = "navigational";
    stage = en ? "Support" : "الدعم";
  } else if (pageType === "sector_page") {
    intent = "sector_solution";
    secondaryIntent = "commercial_investigation";
    stage = en ? "Sector" : "حل قطاعي";
  } else if (["tool_page", "demo_page", "product_page", "tender_demo_page"].includes(pageType)) {
    intent = "product_demo";
    secondaryIntent = "lead_acquisition";
    stage = en ? "Demo" : "تجربة المنتج";
  }
  let keyword = keywordFromTitle(title, route, en);
  if (pageType === "docs_page") keyword = en ? `Bright AI ${keyword} documentation` : `توثيق ${keyword} في Bright AI`;
  return makeMeta({ route, en, pageType, intent, secondaryIntent, keyword, stage });
}

function makeMeta({ route, en, pageType, intent, secondaryIntent, keyword, stage }) {
  const persona = en
    ? (pageType === "docs_page" ? "technical and product teams" : pageType === "blog_article" ? "executives and transformation teams" : "Saudi enterprise, government, operations, data, procurement, and digital transformation teams")
    : (pageType === "docs_page" ? "فرق التقنية والمنتج" : pageType === "blog_article" ? "القيادات وفرق التحول الرقمي" : "الشركات والجهات الحكومية وفرق العمليات والبيانات والمشتريات في السعودية");
  const funnel = ["transactional", "conversion"].includes(intent) ? "bottom" : ["informational", "thought_leadership", "support_documentation"].includes(intent) ? "top" : "middle";
  const commercialValue = ["homepage", "service_page", "tender_demo_page", "consultation_page", "contact_page", "sector_page"].includes(pageType) ? "high" : pageType === "blog_article" ? "medium" : "low";
  const volumePriority = ["homepage", "service_page", "tender_demo_page", "sector_page"].includes(pageType) ? "high" : "medium";
  const competition = ["homepage", "service_page"].includes(pageType) ? "high" : "medium";
  const shouldRank = !["docs_page"].includes(pageType) || route === "/docs/" || route === "/en/docs/";
  const mainRanking = shouldRank && !["blog_article", "docs_page"].includes(pageType);
  return { route, en, pageType, intent, secondaryIntent, keyword, stage, persona, funnel, commercialValue, volumePriority, competition, shouldRank, mainRanking };
}

function h1For(meta) {
  if (meta.en) {
    if (meta.pageType === "docs_page") return meta.keyword.replace(/^Bright AI /, "Documentation for Bright AI ");
    if (meta.intent === "sector_solution" || meta.intent === "commercial_investigation") return /\bSaudi Arabia\b/i.test(meta.keyword) ? titleCase(meta.keyword) : `${titleCase(meta.keyword)} in Saudi Arabia`;
    if (meta.intent === "informational") return `${titleCase(meta.keyword)}: Practical Guide`;
    return titleCase(meta.keyword);
  }
  if (meta.pageType === "docs_page") return meta.keyword.startsWith("توثيق") ? meta.keyword : `توثيق ${meta.keyword}`;
  if (meta.intent === "sector_solution" && !meta.keyword.includes("السعود")) return `${meta.keyword} في السعودية`;
  if (meta.intent === "commercial_investigation" && !meta.keyword.includes("السعود") && !meta.keyword.includes("الرياض")) return `${meta.keyword} في السعودية`;
  if (meta.intent === "informational" && !meta.keyword.includes("شرح عملي")) return `${meta.keyword}: شرح عملي`;
  return meta.keyword;
}

function titleCase(text) {
  return text.replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

function descriptionFor(meta) {
  if (meta.en) {
    if (meta.pageType === "docs_page") return `Bright AI documentation for ${meta.keyword.replace(/^Bright AI /i, "")}, written for teams that need clear implementation, routing, and product context without competing with commercial service pages.`;
    if (meta.pageType === "tender_demo_page") return `Explore ${meta.keyword} for Saudi procurement and legal teams that need clearer tender review, risk signals, supplier comparison, and executive reporting.`;
    if (meta.pageType === "blog_article") return `A practical Bright AI guide about ${meta.keyword} for Saudi organizations evaluating AI adoption, data readiness, governance, and related commercial AI capabilities.`;
    return `Bright AI helps Saudi enterprises and government teams evaluate ${meta.keyword} with practical automation, data analysis, governance, and implementation support.`;
  }
  if (meta.pageType === "docs_page") return `توثيق Bright AI حول ${meta.keyword.replace(/^توثيق\s+/, "")} لفرق التقنية والمنتج التي تحتاج شرحاً عملياً دون منافسة صفحات الخدمات التجارية.`;
  if (meta.pageType === "tender_demo_page") return `تعرض Bright AI ${meta.keyword} لفرق المشتريات والعقود في السعودية، مع تحليل مستندات المنافسات، مقارنة العروض، رصد المخاطر، وتقارير تنفيذية قابلة للمراجعة.`;
  if (meta.pageType === "blog_article") return `دليل عملي من Bright AI حول ${meta.keyword} للشركات والجهات في السعودية، مع أمثلة تنفيذية وروابط تساعد القارئ على الانتقال إلى الحل التجاري المناسب.`;
  if (meta.pageType === "sector_page") return `توضح Bright AI كيف يخدم ${meta.keyword} المؤسسات في السعودية عبر الأتمتة، تحليل البيانات، التكامل مع الأنظمة، وحوكمة مناسبة للقطاع.`;
  return `تساعد Bright AI الشركات والجهات في السعودية على تطبيق ${meta.keyword} عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس.`;
}

function answerFor(meta) {
  if (meta.en) {
    return `Bright AI supports Saudi organizations evaluating ${meta.keyword} with practical AI services, automation, data analysis, and governance. This page is written for enterprise, government, and transformation teams that need a clear path from business problem to measurable implementation, not a generic technology overview.`;
  }
  if (meta.pageType === "docs_page") {
    return `توضح هذه الصفحة كيفية استخدام ${meta.keyword.replace(/^توثيق\s+/, "")} داخل Bright AI بصورة عملية لفرق التقنية والمنتج. الهدف هو دعم الفهم والتنفيذ والربط بين الصفحات، مع بقاء صفحات الخدمات التجارية هي الوجهة الأساسية لمن يبحث عن حل أو استشارة.`;
  }
  if (meta.pageType === "blog_article") {
    return `يقدّم هذا المقال إجابة عملية حول ${meta.keyword} للقادة وفرق التحول الرقمي في السعودية. الهدف هو توضيح المشكلة والسياق وخيارات التنفيذ، ثم توجيه القارئ إلى الصفحة التجارية الأنسب عندما يحتاج إلى تقييم أو ديمو أو استشارة.`;
  }
  if (meta.pageType === "tender_demo_page") {
    return `تساعد هذه الصفحة فرق المشتريات والعقود في السعودية على فهم ${meta.keyword} داخل Bright AI. تركّز على تحليل المنافسات، مقارنة العروض، استخراج المخاطر، وتحويل مستندات المناقصات إلى قرارات أوضح دون إخفاء المحتوى العام خلف تسجيل أو تخزين محلي.`;
  }
  if (meta.pageType === "sector_page") {
    return `توضح هذه الصفحة كيف يخدم ${meta.keyword} المؤسسات السعودية في هذا القطاع عبر حالات استخدام عملية، بيانات قابلة للتحليل، وتكامل مع الأنظمة الحالية. المحتوى مناسب للقيادات وفرق التشغيل التي تبحث عن تطبيق قابل للحوكمة والقياس.`;
  }
  return `تساعد Bright AI الشركات والجهات في السعودية على تطبيق ${meta.keyword} بشكل عملي يربط بين الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، والحوكمة. هذه الصفحة مناسبة للفرق التي تبحث عن شريك تقني يحول فرص التحسين إلى مشاريع قابلة للتنفيذ والقياس.`;
}

function sectionPlan(meta) {
  if (meta.en) {
    if (meta.pageType === "docs_page") return [
      ["Purpose of this page", ["When to use it", "Core concepts"]],
      ["Implementation notes", ["Data and integration requirements", "Related Bright AI capabilities"]],
      ["Related links", ["Commercial page", "Support route"]]
    ];
    return [
      [`What does ${meta.keyword} solve?`, ["Operational need", "Saudi context"]],
      ["Who is this for?", ["Enterprise teams", "Government and regulated teams"]],
      ["Governance, data, and integration", ["Data readiness", "Review and security"]],
      ["Next step", ["Consultation", "Demo or contact"]]
    ];
  }
  if (meta.pageType === "docs_page") return [
    ["الغرض من الصفحة", ["متى تستخدمها؟", "المفاهيم الأساسية"]],
    ["خطوات الاستخدام", ["متطلبات البيانات والتكامل", "حدود التوثيق"]],
    ["روابط ذات صلة", ["الصفحة التجارية", "الدعم والمراجعة"]]
  ];
  if (meta.pageType === "tender_demo_page") return [
    ["ما الذي تعرضه هذه الصفحة؟", ["رفع المستندات", "استخراج المخاطر"]],
    ["كيف تعمل الميزة؟", ["مقارنة العروض", "التقارير التنفيذية"]],
    ["لمن تناسب في السعودية؟", ["فرق المشتريات", "الفرق القانونية والتجارية"]],
    ["الحوكمة والمراجعة", ["صلاحيات المستخدمين", "سجل القرارات"]],
    ["اطلب ديمو", ["الخطوة التالية", "روابط tender ذات صلة"]]
  ];
  if (meta.intent === "sector_solution") return [
    ["تحديات القطاع", ["تحسين الكفاءة", "إدارة المخاطر"]],
    ["حالات استخدام الذكاء الاصطناعي في القطاع", ["التنبؤ والمراقبة", "أتمتة التقارير"]],
    ["البيانات والأنظمة المستخدمة", ["التكامل مع الأنظمة", "جودة البيانات"]],
    ["الحوكمة والامتثال", ["مراجعة القرارات", "متطلبات السوق السعودي"]],
    ["خدمات Bright AI المناسبة", ["الأتمتة والتحليل", "الخطوة التالية"]]
  ];
  if (meta.intent === "transactional") return [
    ["ماذا يحدث بعد طلب الاستشارة؟", ["تقييم الاحتياج", "تحديد فرص الأتمتة"]],
    ["من الأنسب أن يحجز هذه الخدمة؟", ["القيادات التنفيذية", "فرق البيانات والعمليات"]],
    ["ما مخرجات الجلسة؟", ["خارطة طريق أولية", "توصيات تنفيذية"]],
    ["ابدأ الآن مع Bright AI", ["نموذج التواصل", "المسارات المناسبة"]]
  ];
  if (meta.intent === "informational" || meta.pageType === "blog_article") return [
    [`ما هو ${meta.keyword.replace(": شرح عملي", "")}؟`, ["تعريف مختصر", "سياق سعودي"]],
    ["لماذا يهم الشركات السعودية؟", ["أثر تشغيلي", "أثر على القرار"]],
    ["كيف يعمل عملياً؟", ["مثال من العمليات", "مثال من البيانات"]],
    ["متى تحتاج إلى حل احترافي؟", ["إشارات الجاهزية", "خدمات Bright AI ذات الصلة"]]
  ];
  return [
    ["ما الحل الذي تقدمه Bright AI؟", ["أتمتة العمليات المتكررة", "تحليل البيانات والقرارات"]],
    ["لمن يناسب هذا الحل؟", ["الشركات السعودية", "الجهات الحكومية والفرق المنظمة"]],
    ["المشاكل التي يحلها للشركات السعودية", ["التكامل مع الأنظمة الحالية", "دعم اللغة العربية"]],
    ["الحوكمة والأمان والتكامل", ["تقارير تنفيذية للإدارة", "مراجعة وقياس الأثر"]],
    ["الخطوة التالية", ["احجز استشارة", "استكشف الخدمات ذات الصلة"]]
  ];
}

function relatedLinks(meta) {
  if (meta.pageType === "tender_demo_page") {
    const ar = [
      ["/tenders/", "نظام تحليل المناقصات"],
      ["/tenders/compare/", "مقارنة عروض المناقصات"],
      ["/tenders/dashboard/", "لوحة تحليل المناقصات"],
      ["/tenders/reports/", "تقارير المناقصات"],
      ["/consultation/", "احجز استشارة"]
    ];
    const en = [
      ["/en/tenders/", "AI tender analysis"],
      ["/en/tenders/compare/", "Tender comparison"],
      ["/en/tenders/dashboard/", "Tender dashboard"],
      ["/en/tenders/reports/", "Tender reports"],
      ["/en/consultation/", "Book a consultation"]
    ];
    return meta.en ? en : ar;
  }
  if (meta.pageType === "blog_article") {
    const target = blogTarget(meta.route);
    return [[target, meta.en ? "Related Bright AI capability" : "الحل التجاري المرتبط"], ["/consultation/", meta.en ? "Consultation" : "احجز استشارة"], ["/services/", meta.en ? "Services" : "خدمات Bright AI"]];
  }
  if (meta.pageType === "docs_page") return [[commercialForDoc(meta.route), meta.en ? "Commercial service page" : "صفحة الخدمة التجارية"], ["/services/", meta.en ? "Services" : "الخدمات"], ["/contact/", meta.en ? "Contact" : "تواصل معنا"]];
  if (meta.pageType === "sector_page") return [["/services/", meta.en ? "AI services" : "خدمات الذكاء الاصطناعي"], ["/data-analysis/", meta.en ? "Data analysis" : "تحليل البيانات"], ["/consultation/", meta.en ? "Consultation" : "احجز استشارة"]];
  return [["/consultation/", meta.en ? "Book a consultation" : "احجز استشارة"], ["/services/", meta.en ? "Services" : "الخدمات"], ["/contact/", meta.en ? "Contact" : "تواصل معنا"]];
}

function blogTarget(route) {
  if (/tender|procurement|contract|اعتماد|مناق/.test(route)) return "/tenders/";
  if (/data|analysis|bi|analytics|تحليل/.test(route)) return "/data-analysis/";
  if (/automation|process|rpa|أتمت/.test(route)) return "/smart-automation/";
  if (/agent|chatbot|bot|agint/.test(route)) return "/ai-agent/";
  if (/health|hospital|medical|صحة/.test(route)) return "/smart-medical-archive/";
  if (/interview|hr|job|recruit/.test(route)) return "/demo/smart-hiring-system/";
  return "/services/";
}

function commercialForDoc(route) {
  if (route.includes("ai-agent")) return route.includes("-en") || route.startsWith("/en/") ? "/en/ai-agent/" : "/ai-agent/";
  if (route.includes("data-analysis")) return route.includes("-en") || route.startsWith("/en/") ? "/en/data-analysis/" : "/data-analysis/";
  if (route.includes("smart-automation")) return route.includes("-en") || route.startsWith("/en/") ? "/en/smart-automation/" : "/smart-automation/";
  if (route.includes("ai-bots")) return "/ai-bots/";
  if (route.includes("consultation")) return route.includes("-en") || route.startsWith("/en/") ? "/en/consultation/" : "/consultation/";
  if (route.includes("contact")) return route.includes("-en") || route.startsWith("/en/") ? "/en/contact/" : "/contact/";
  return route.includes("-en") || route.startsWith("/en/") ? "/en/services/" : "/services/";
}

function ensureMeta($, name, content, attr = "name") {
  let el = $(`meta[${attr}="${name}"]`).first();
  if (!el.length) {
    $("head").append(`\n<meta ${attr}="${name}" content="${escapeAttr(content)}" />`);
  } else {
    el.attr("content", content);
  }
}

function ensureLink($, rel, href) {
  let el = $(`link[rel="${rel}"]`).first();
  if (!el.length) $("head").append(`\n<link rel="${rel}" href="${escapeAttr(href)}" />`);
  else el.attr("href", href);
}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

function ensureOneH1($, meta) {
  const desired = h1For(meta);
  const h1s = $("h1").toArray();
  if (!h1s.length) {
    const main = $("main").first().length ? $("main").first() : $("body");
    main.prepend(`\n<h1>${escapeHtml(desired)}</h1>\n`);
  } else {
    $(h1s[0]).text(desired);
    h1s.slice(1).forEach((node) => {
      const h2 = $("<h2></h2>");
      for (const attr of Object.entries(node.attribs || {})) h2.attr(attr[0], attr[1]);
      h2.html($(node).html());
      $(node).replaceWith(h2);
    });
  }
  return desired;
}

function ensureSeoBlocks($, meta) {
  $("[data-seo-intent-answer='true'], [data-seo-intent-section='true']").remove();
  const h1 = $("h1").first();
  const answer = `<section class="seo-answer-block" data-seo-intent-answer="true"><p>${escapeHtml(answerFor(meta))}</p></section>`;
  const plan = sectionPlan(meta);
  const sectionHtml = [
    `<section class="seo-intent-section" data-seo-intent-section="true">`,
    ...plan.map(([h2, h3s]) => `<div class="seo-intent-group"><h2>${escapeHtml(h2)}</h2>${h3s.map((h3) => `<h3>${escapeHtml(h3)}</h3><p>${escapeHtml(paragraphFor(meta, h2, h3))}</p>`).join("")}</div>`),
    `<div class="seo-intent-links"><h2>${meta.en ? "Related next steps" : "روابط تساعدك على الخطوة التالية"}</h2><ul>${relatedLinks(meta).map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`).join("")}</ul></div>`,
    `</section>`
  ].join("\n");
  if (h1.length) h1.after(`\n${answer}\n${sectionHtml}\n`);
  else $("main, body").first().prepend(`${answer}\n${sectionHtml}\n`);
}

function paragraphFor(meta, h2, h3) {
  if (meta.en) return `This point connects ${meta.keyword} to a practical decision: define the operating problem, confirm the data and integration path, then choose the next Bright AI step that fits the team and governance model.`;
  return `يربط هذا المحور ${meta.keyword} بقرار عملي: تحديد المشكلة التشغيلية، فهم البيانات والأنظمة المؤثرة، ثم اختيار خطوة تنفيذ تناسب الفريق والحوكمة المطلوبة داخل المؤسسة.`;
}

function ensureSeoStyle($) {
  if ($("style[data-seo-intent-style='true']").length) return;
  $("head").append(`
<style data-seo-intent-style="true">
  .seo-answer-block,
  .seo-intent-section {
    margin-block: 1rem 1.5rem;
    line-height: 1.85;
  }
  .seo-answer-block {
    max-width: 72rem;
  }
  .seo-answer-block p,
  .seo-intent-section p {
    margin-block: 0.5rem 1rem;
  }
  .seo-intent-section h2 {
    margin-block: 1.5rem 0.75rem;
  }
  .seo-intent-section h3 {
    margin-block: 1rem 0.4rem;
  }
  .seo-intent-links ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0;
    list-style: none;
  }
</style>`);
}

function fixSchema($, meta) {
  $("script[data-seo-intent-schema='true']").remove();
  $("script[type='application/ld+json']").each((_, node) => {
    const raw = $(node).contents().text();
    try {
      const json = JSON.parse(raw);
      const types = [];
      const collect = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) return obj.forEach(collect);
        if (obj["@type"]) types.push(...(Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]]));
        if (obj["@graph"]) collect(obj["@graph"]);
      };
      collect(json);
      if (types.some((type) => forbiddenSchema.has(type))) $(node).remove();
    } catch {
      // اترك السكربت للـ QA حتى لا نزيل بيانات قد تكون مستخدمة بسبب تنسيق غير قياسي.
    }
  });
  const schemaType = meta.pageType === "blog_article" ? "Article" : meta.pageType === "docs_page" ? "WebPage" : ["tender_demo_page", "tool_page", "demo_page", "product_page"].includes(meta.pageType) ? "SoftwareApplication" : "Service";
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": `${site}${meta.route}#intent`,
    "name": h1For(meta),
    "url": `${site}${meta.route}`,
    "description": descriptionFor(meta),
    "inLanguage": meta.en ? "en-SA" : "ar-SA",
    "provider": { "@id": `${site}/#organization` }
  };
  $("head").append(`\n<script type="application/ld+json" data-seo-intent-schema="true">\n${JSON.stringify(schema, null, 2)}\n</script>\n`);
}

function applyPage(file, url, allRecords) {
  const html = fs.readFileSync(file, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const route = routeFromUrl(url);
  const lang = $("html").attr("lang") || "";
  const oldH1 = cleanText($("h1").first().text());
  const oldTitle = cleanText($("title").first().text());
  const meta = classify(route, oldTitle, lang);
  const h1 = ensureOneH1($, meta);
  $("title").first().length ? $("title").first().text(`${h1} | Bright AI`) : $("head").append(`\n<title>${escapeHtml(h1)} | Bright AI</title>`);
  const desc = descriptionFor(meta);
  ensureMeta($, "description", desc);
  ensureMeta($, "seo:intent", meta.intent);
  ensureMeta($, "seo:secondary_intent", meta.secondaryIntent);
  ensureMeta($, "seo:primary_keyword", meta.keyword);
  ensureMeta($, "og:title", `${h1} | Bright AI`, "property");
  ensureMeta($, "og:description", desc, "property");
  ensureMeta($, "twitter:title", `${h1} | Bright AI`);
  ensureMeta($, "twitter:description", desc);
  ensureLink($, "canonical", `${site}${route}`);
  ensureSeoStyle($);
  ensureSeoBlocks($, meta);
  fixSchema($, meta);
  fs.writeFileSync(file, $.html(), "utf8");
  allRecords.push({
    file: path.relative(root, file),
    url,
    route,
    oldTitle,
    newTitle: `${h1} | Bright AI`,
    oldH1,
    newH1: h1,
    ...meta
  });
}

function extractInventory(file, indexableUrls) {
  const html = fs.readFileSync(file, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const canonical = $("link[rel='canonical']").attr("href") || "";
  const url = canonical || "";
  const route = canonical.startsWith(site) ? routeFromUrl(canonical) : "";
  const lang = $("html").attr("lang") || "";
  const title = cleanText($("title").first().text());
  const description = cleanText($("meta[name='description']").attr("content"));
  const h1s = $("h1").map((_, el) => cleanText($(el).text())).get();
  const h2s = $("h2").map((_, el) => cleanText($(el).text())).get();
  const h3s = $("h3").map((_, el) => cleanText($(el).text())).get();
  const shouldIndex = indexableUrls.has(canonical);
  const meta = route ? classify(route, title, lang) : makeMeta({ route: "", en: false, pageType: pageTypeFor(""), intent: "navigational", secondaryIntent: "none", keyword: "غير محدد", stage: "غير محدد" });
  return { file: path.relative(root, file), canonical, lang, title, description, h1s, h2s, h3s, shouldIndex, meta };
}

function writeReports(inventory, records, indexableUrls) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const invLines = ["# جرد HTML وتصنيف نية البحث والعناوين", "", `تم توليد التقرير بعد فحص ${inventory.length} ملف HTML.`, ""];
  for (const item of inventory) {
    const m = item.meta;
    invLines.push(`## ${item.file}`, "");
    invLines.push(`- canonical URL: ${item.canonical || "غير موجود"}`);
    invLines.push(`- language: ${item.lang || "غير محدد"}`);
    invLines.push(`- current title: ${item.title || "غير موجود"}`);
    invLines.push(`- current meta description: ${item.description || "غير موجود"}`);
    invLines.push(`- current H1: ${item.h1s.join(" | ") || "غير موجود"}`);
    invLines.push(`- all H2 headings: ${item.h2s.join(" | ") || "لا يوجد"}`);
    invLines.push(`- all H3 headings: ${item.h3s.join(" | ") || "لا يوجد"}`);
    invLines.push(`- page type: ${m.pageType}`);
    invLines.push(`- current apparent search intent: ${m.intent}`);
    invLines.push(`- recommended primary search intent: ${m.intent}`);
    invLines.push(`- secondary intent: ${m.secondaryIntent}`);
    invLines.push(`- target audience/persona: ${m.persona}`);
    invLines.push(`- funnel stage: ${m.funnel}`);
    invLines.push(`- user problem: يحتاج إلى فهم ${m.keyword} وربطه بقرار عملي.`);
    invLines.push(`- expected next action: ${m.pageType === "blog_article" ? "الانتقال إلى صفحة خدمة مناسبة" : m.pageType === "docs_page" ? "قراءة التوثيق ثم الرجوع للخدمة" : "طلب استشارة أو ديمو"}`);
    invLines.push(`- should be indexable? ${item.shouldIndex ? "yes" : "no"}`);
    invLines.push(`- should rank? ${m.shouldRank ? "yes" : "no"}`);
    invLines.push(`- assigned primary keyword: ${m.keyword}`);
    invLines.push(`- assigned secondary keywords: ${secondaryKeywords(m).join(", ")}`);
    invLines.push(`- cannibalization risk: ${m.mainRanking ? "منخفض بعد توحيد primary keyword" : "متوسط إذا نافست صفحة تجارية بدلاً من دعمها"}`);
    invLines.push(`- heading issues: ${headingIssues(item).join("; ") || "لا توجد مشاكل حرجة بعد المعالجة"}`);
    invLines.push(`- recommended action: ${item.shouldIndex ? "تحسين intent والعناوين والروابط كما تم في هذا المسار" : "عدم استهداف organic traffic إلا إذا تغيّر قرار الفهرسة"}`);
    invLines.push("");
  }
  fs.writeFileSync(path.join(reportsDir, "html-intent-heading-inventory.md"), invLines.join("\n"));

  const mapLines = ["# خريطة intent إلى keyword للصفحات العامة القابلة للفهرسة", "", "| URL | Primary intent | Secondary intent | Primary keyword | Secondary keywords | Page type | Funnel | Audience | Commercial value | Volume priority | Competition | Main ranking page? | Supporting page | Cannibalization risk | Final recommendation |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const r of records.sort((a, b) => a.route.localeCompare(b.route))) {
    mapLines.push(`| ${mdCell(r.url)} | ${r.intent} | ${r.secondaryIntent} | ${mdCell(r.keyword)} | ${mdCell(secondaryKeywords(r).join(", "))} | ${r.pageType} | ${r.funnel} | ${mdCell(r.persona)} | ${r.commercialValue} | ${r.volumePriority} | ${r.competition} | ${r.mainRanking ? "yes" : "no"} | ${r.mainRanking ? "لا ينطبق" : supportingPage(r)} | ${r.mainRanking ? "منخفض" : "يجب أن تدعم الصفحة الرئيسية لا تنافسها"} | ${r.shouldRank ? "استهداف وترقية داخلية" : "دعم/توثيق دون منافسة"} |`);
  }
  fs.writeFileSync(path.join(reportsDir, "intent-to-keyword-map.md"), mapLines.join("\n"));

  const blogLines = ["# خريطة intent والعناوين للمدونة", "", "| URL | Primary keyword | Intent | Target money page | Old H1 | New H1 | H2 changes | H3 changes | CTA added | Cannibalization notes |", "|---|---|---|---|---|---|---|---|---|---|"];
  for (const r of records.filter((x) => x.pageType === "blog_article")) {
    blogLines.push(`| ${mdCell(r.url)} | ${mdCell(r.keyword)} | ${r.intent} | ${blogTarget(r.route)} | ${mdCell(r.oldH1 || "غير موجود")} | ${mdCell(r.newH1)} | أضيفت بنية أسئلة intent أعلى المقال | أضيفت H3 داعمة لكل H2 | yes | أصبحت الصفحة داعمة لـ ${blogTarget(r.route)} بدلاً من منافسة صفحة الخدمة |`);
  }
  fs.writeFileSync(path.join(reportsDir, "blog-intent-heading-map.md"), blogLines.join("\n"));

  const linksLines = ["# الربط الداخلي حسب نية البحث", "", "| Source URL | Intent | Added/validated links | Reason |", "|---|---|---|---|"];
  for (const r of records) {
    const links = relatedLinks(r).map(([href, label]) => `${label} (${href})`).join(", ");
    linksLines.push(`| ${mdCell(r.url)} | ${r.intent} | ${mdCell(links)} | ربط الصفحة بالخطوة التجارية أو صفحة الدعم المناسبة حسب intent |`);
  }
  fs.writeFileSync(path.join(reportsDir, "internal-linking-by-intent.md"), linksLines.join("\n"));

  const changes = ["# ملخص تغييرات العناوين والمحتوى", "", "## Old vs New H1", "", "| URL | Old H1 | New H1 | Intent | Primary keyword |", "|---|---|---|---|---|"];
  for (const r of records) changes.push(`| ${mdCell(r.url)} | ${mdCell(r.oldH1 || "غير موجود")} | ${mdCell(r.newH1)} | ${r.intent} | ${mdCell(r.keyword)} |`);
  changes.push("", "## تغييرات H2/H3", "", "- أضيفت كتلة answer block أعلى الصفحة العامة القابلة للفهرسة.", "- أضيفت بنية H2/H3 مبنية على intent لكل صفحة عامة.", "- تم تحويل أي H1 زائد إلى H2 للحفاظ على H1 واحد.", "- أضيفت روابط intent داخلية نحو الاستشارة، الخدمات، صفحات المناقصات، أو صفحات الخدمات الداعمة للمدونة.", "", "## تعديلات schema", "", "- أزيلت أنواع schema الممنوعة عند وجودها: FAQPage, HowTo, SpecialAnnouncement, VehicleListing, ClaimReview.", "- أضيفت schema داعمة بعلامة `data-seo-intent-schema` حسب نوع الصفحة دون ratings أو reviews أو offers وهمية.");
  fs.writeFileSync(path.join(reportsDir, "heading-changes-summary.md"), changes.join("\n"));
}

function mdCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function secondaryKeywords(meta) {
  if (meta.en) return ["Saudi Arabia", "enterprise AI", "AI governance"];
  if (meta.pageType === "tender_demo_page") return ["منصة اعتماد للمنافسات الحكومية", "أتمتة المشتريات للشركات", "تحليل العقود الذكية السعودية"];
  if (meta.pageType === "sector_page") return ["التحول الرقمي", "تحليل البيانات", "أتمتة العمليات"];
  if (meta.pageType === "docs_page") return ["توثيق Bright AI", "خطوات الاستخدام", "روابط ذات صلة"];
  return ["شركات الذكاء الاصطناعي في الرياض", "استشارات الذكاء الاصطناعي السعودية", "حوكمة البيانات NDMO"];
}

function supportingPage(meta) {
  if (meta.pageType === "blog_article") return blogTarget(meta.route);
  if (meta.pageType === "docs_page") return commercialForDoc(meta.route);
  return "/services/";
}

function headingIssues(item) {
  const issues = [];
  if (item.h1s.length !== 1) issues.push(`عدد H1 = ${item.h1s.length}`);
  if (!item.h2s.length && item.shouldIndex) issues.push("لا توجد H2");
  if (item.h1s.some((h) => !h)) issues.push("H1 فارغ");
  if (item.h2s.some((h) => !h) || item.h3s.some((h) => !h)) issues.push("عنوان H2/H3 فارغ");
  return issues;
}

function updateLlms(records) {
  const keep = records.filter((r) => ["/", "/services/", "/ai-agent/", "/smart-automation/", "/data-analysis/", "/tenders/", "/consultation/", "/contact/", "/sectors/finance/", "/sectors/healthcare/", "/sectors/manufacturing/", "/sectors/logistics/", "/en/", "/en/services/", "/en/ai-agent/", "/en/data-analysis/", "/en/tools/"].includes(r.route));
  const lines = [
    "# Bright AI",
    "",
    "Bright AI is a Saudi AI company serving enterprise and government teams in Saudi Arabia. This file lists strategic public pages for AI search crawlers.",
    "",
    "## Strategic pages",
    ...keep.map((r) => `- ${r.url} — ${r.en ? r.keyword : r.keyword}`),
    "",
    "## Notes",
    "- Arabic pages use ar-SA and are the primary market pages.",
    "- English pages use en-SA and support Saudi enterprise discovery.",
    "- Public tender pages are demo and lead-generation pages, not admin-only routes."
  ];
  fs.writeFileSync(path.join(root, "llms.txt"), lines.join("\n") + "\n");
}

function main() {
  const indexableUrls = new Set(fs.readFileSync(indexablePath, "utf8").split(/\r?\n/).map((x) => x.trim()).filter(Boolean));
  const htmlFiles = walk(root);
  const canonicalToFile = new Map();
  for (const file of htmlFiles) {
    const $ = cheerio.load(fs.readFileSync(file, "utf8"), { decodeEntities: false });
    const canonical = $("link[rel='canonical']").attr("href");
    if (canonical) canonicalToFile.set(canonical, file);
  }
  const records = [];
  for (const url of indexableUrls) {
    const file = canonicalToFile.get(url) || routeToFile(routeFromUrl(url));
    if (!file) continue;
    applyPage(file, url, records);
  }
  const inventory = walk(root).map((file) => extractInventory(file, indexableUrls));
  writeReports(inventory, records, indexableUrls);
  updateLlms(records);
  console.log(`Applied SEO intent headings to ${records.length} indexable pages.`);
}

main();
