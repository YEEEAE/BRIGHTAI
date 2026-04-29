import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const servicesDir = path.join(root, "services");
const blogDir = path.join(root, "blog");

const articlePool = [
  ["/blog/ai-guide-saudi-business/", "دليل الذكاء الاصطناعي للشركات السعودية", "مدخل عملي لاختيار حالات استخدام AI داخل الشركات."],
  ["/blog/ai-agents-business-guide/", "دليل وكلاء الذكاء الاصطناعي للأعمال", "يوضح كيف تعمل الوكلاء الذكية ومتى تناسب الفرق التشغيلية."],
  ["/blog/smart-automation-benefits/", "فوائد الأتمتة الذكية للشركات", "يساعد على فهم أثر الأتمتة على العمليات اليومية دون مبالغات."],
  ["/blog/workplace-automation-guide/", "دليل أتمتة بيئة العمل", "مرجع مناسب قبل تحويل الإجراءات المتكررة إلى مسارات آلية."],
  ["/blog/business-intelligence-saudi/", "ذكاء الأعمال في السعودية", "يفيد عند ربط الخدمة بالمؤشرات ولوحات القرار."],
  ["/blog/data-analysis-decision-making/", "تحليل البيانات ودعم القرار", "يوضح كيف تتحول البيانات إلى قرارات تشغيلية أوضح."],
  ["/blog/ai-marketing-guide/", "دليل التسويق بالذكاء الاصطناعي", "مناسب لخدمات التسويق والمحتوى والنمو."],
  ["/blog/hr-automation-saudi/", "أتمتة الموارد البشرية في السعودية", "مرجع مرتبط بخدمات الموارد البشرية والتوظيف."],
  ["/blog/smart-document-processing/", "معالجة المستندات الذكية", "يفيد خدمات الوثائق والأرشفة والاستخراج."],
  ["/blog/ai-healthcare-saudi/", "الذكاء الاصطناعي في القطاع الصحي السعودي", "مرجع مناسب للخدمات الصحية."],
  ["/blog/transport-logistics-solutions/", "حلول النقل والخدمات اللوجستية", "مفيد لخدمات سلسلة الإمداد والعمليات."],
  ["/blog/ai-implementation-cost-guide/", "دليل تكلفة تطبيق الذكاء الاصطناعي", "يساعد الإدارة على تقدير المتطلبات قبل التنفيذ."]
];

const serviceArticles = {
  "seo-agent": ["/blog/ai-marketing-guide/", "/blog/business-intelligence-saudi/", "/blog/ai-guide-saudi-business/"],
  "seo-ai-agent": ["/blog/ai-marketing-guide/", "/blog/ai-agents-business-guide/", "/blog/ai-guide-saudi-business/"],
  "marketing-agent": ["/blog/ai-marketing-guide/", "/blog/saudi-ecommerce-ai-growth/", "/blog/ai-business-performance/"],
  "marketing-ai-agent": ["/blog/ai-marketing-guide/", "/blog/saudi-ecommerce-ai-growth/", "/blog/ai-agents-business-guide/"],
  "marketing-automation": ["/blog/ai-marketing-guide/", "/blog/smart-automation-benefits/", "/blog/workplace-automation-guide/"],
  "social-data-analysis": ["/blog/ai-marketing-guide/", "/blog/business-intelligence-saudi/", "/blog/data-analysis-decision-making/"],
  "hr-automation": ["/blog/hr-automation-saudi/", "/blog/hr-automation-case-study/", "/blog/financial-hr-automation/"],
  "smart-hiring-system": ["/blog/hr-automation-saudi/", "/blog/hr-automation-case-study/", "/blog/ai-guide-saudi-business/"],
  "document-automation": ["/blog/smart-document-processing/", "/blog/process-automation/", "/blog/workplace-automation-guide/"],
  "medical-archive": ["/blog/digital-health-smart-archive/", "/blog/ai-healthcare-saudi/", "/blog/smart-document-processing/"],
  "health-data-analysis": ["/blog/ai-healthcare-saudi/", "/blog/kfshrc-breast-cancer-ai/", "/blog/data-analysis-decision-making/"],
  "smart-hospital-management": ["/blog/ai-healthcare-saudi/", "/blog/private-hospital-scheduling-optimization/", "/blog/digital-health-smart-archive/"],
  "data-platform": ["/blog/business-intelligence-saudi/", "/blog/big-data-analysis/", "/blog/data-analysis-decision-making/"],
  "data-analyst-agent": ["/blog/data-analysis-decision-making/", "/blog/business-intelligence-saudi/", "/blog/kpi-dashboard-guide/"],
  "operational-reports-automation": ["/blog/kpi-dashboard-guide/", "/blog/business-intelligence-saudi/", "/blog/smart-automation-benefits/"],
  "supply-chain-optimization": ["/blog/transport-logistics-solutions/", "/blog/saudi-logistics-route-optimization/", "/blog/smart-inventory-management/"],
  "ai-tenders-analysis": ["/blog/business-intelligence-saudi/", "/blog/smart-document-processing/", "/blog/ai-guide-saudi-business/"],
  "approvals-automation": ["/blog/process-automation/", "/blog/smart-automation-benefits/", "/blog/workplace-automation-guide/"],
  "customer-service-automation": ["/blog/case-study-saudi-companies-ai-agents-customer-service/", "/blog/commerce-ministry-chatbot/", "/blog/ai-agents-business-guide/"],
  "ai-chatbot-arabic": ["/blog/commerce-ministry-chatbot/", "/blog/case-study-saudi-companies-ai-agents-customer-service/", "/blog/ai-agents-business-guide/"],
  "lead-hunter": ["/blog/ai-marketing-guide/", "/blog/smart-crm-system/", "/blog/saudi-ecommerce-ai-growth/"],
  "brightsales": ["/blog/smart-crm-system/", "/blog/ai-marketing-guide/", "/blog/saudi-ecommerce-ai-growth/"],
  "competitor-analysis-agent": ["/blog/ai-marketing-guide/", "/blog/business-intelligence-saudi/", "/blog/ai-business-performance/"],
  "opportunity-discovery-agent": ["/blog/ai-business-performance/", "/blog/ai-guide-saudi-business/", "/blog/business-intelligence-saudi/"],
  "ai-consulting": ["/blog/ai-guide-saudi-business/", "/blog/ai-implementation-cost-guide/", "/blog/choose-ai-company-saudi/"],
  "ai-agents-saudi": ["/blog/ai-agents-business-guide/", "/blog/building-ai-agents-practical-guide/", "/blog/ai-guide-saudi-business/"],
  "ai-automation-saudi": ["/blog/smart-automation-benefits/", "/blog/workplace-automation-guide/", "/blog/ai-automation-project-analysis/"],
  "custom-ai-agent": ["/blog/ai-agents-business-guide/", "/blog/building-ai-agents-practical-guide/", "/blog/ai-guide-saudi-business/"],
  "brightproject": ["/blog/kpi-dashboard-guide/", "/blog/workplace-automation-guide/", "/blog/ai-business-performance/"],
  "ai-scolecs": ["/blog/saudi-edtech-personalized-learning/", "/blog/ksu-adaptive-learning/", "/blog/ai-guide-saudi-business/"]
};

const articleMeta = new Map(articlePool.map(([href, title, desc]) => [href, { title, desc }]));

function existsRoute(route) {
  return fs.existsSync(path.join(root, route.replace(/^\//, ""), "index.html"));
}

function pickArticles(slug) {
  const preferred = serviceArticles[slug] || [];
  const selected = [];
  for (const href of preferred) {
    if (existsRoute(href) && articleMeta.has(href) && !selected.includes(href)) selected.push(href);
  }
  for (const [href] of articlePool) {
    if (selected.length >= 3) break;
    if (existsRoute(href) && !selected.includes(href)) selected.push(href);
  }
  return selected.map((href) => [href, articleMeta.get(href).title, articleMeta.get(href).desc]);
}

function extractTitle(html, file) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s*\|\s*Bright AI\s*$/i, "").trim();
  return h1 || title || file.replace(/\.html$/, "");
}

function hasText(html, text) {
  return html.includes(text);
}

function buildDecisionSection(title) {
  return `
    <section class="aeo-decision-section" aria-labelledby="aeo-decision-heading">
      <div class="container grid-3">
        <article class="card"><h2 id="aeo-decision-heading">لمن هذه الخدمة؟</h2><p>للشركات والجهات السعودية التي تحتاج ${title} ضمن عملية واضحة، قابلة للمراجعة، ومتصلة ببيانات أو إجراءات فعلية.</p></article>
        <article class="card"><h2>متى تحتاجها الشركة؟</h2><p>تحتاجها الشركة عندما يصبح العمل اليدوي أو تشتت البيانات سبباً في تأخير القرار، ضعف المتابعة، أو صعوبة قياس الأداء.</p></article>
        <article class="card"><h2>ما النتائج المتوقعة؟</h2><p>النتائج المتوقعة هي وضوح أفضل في سير العمل، تقليل الجهد المتكرر، ومخرجات قابلة للمتابعة دون وعود رقمية غير مثبتة.</p></article>
      </div>
    </section>
`;
}

function buildRelatedArticles(slug) {
  const cards = pickArticles(slug).map(([href, title, desc]) => `<a class="related-card" href="${href}"><strong>${title}</strong><span>${desc}</span></a>`).join("\n");
  return `
    <section class="aeo-related-articles" aria-labelledby="aeo-related-articles-heading">
      <div class="container">
        <article class="card">
          <h2 id="aeo-related-articles-heading">مقالات ذات صلة</h2>
          <p>مقالات تساعد الإدارة على فهم السياق قبل اختيار نطاق التنفيذ أو المقارنة بين الخدمات القريبة.</p>
          <div class="grid-1">${cards}</div>
        </article>
      </div>
    </section>
`;
}

function ensureCss(html) {
  if (html.includes(".aeo-related-articles")) return html;
  return html.replace("</style>", `
    .aeo-related-articles .grid-1 { display:grid; gap:12px; }
    .aeo-decision-section .card p, .aeo-related-articles .card p { color:#cbd5e1; }
  </style>`);
}

function extractFaqs(html) {
  const faqs = [];
  const faqSection = html.match(/<section[^>]*class="[^"]*faq[^"]*"[^>]*>[\s\S]*?<\/section>/i)?.[0] || html;
  const re = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/details>/gi;
  let match;
  while ((match = re.exec(faqSection))) {
    const question = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const answer = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

function updateFaqSchema(html, slug, faqs) {
  if (!faqs.length) return html;
  const scriptRe = /<script([^>]*)type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRe.exec(html))) {
    const raw = match[3].trim();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      continue;
    }
    const graph = Array.isArray(json["@graph"]) ? json["@graph"] : [json];
    let faqNode = graph.find((node) => node && node["@type"] === "FAQPage");
    if (!faqNode) {
      faqNode = {
        "@type": "FAQPage",
        "@id": `https://brightai.site/services/${slug}/#faq`
      };
      if (Array.isArray(json["@graph"])) json["@graph"].push(faqNode);
      else continue;
    }
    faqNode.mainEntity = faqs.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answer
      }
    }));
    const pretty = JSON.stringify(json, null, 2);
    const replacement = `<script${match[1]}type="application/ld+json"${match[2]}>\n${pretty}\n  </script>`;
    return html.slice(0, match.index) + replacement + html.slice(match.index + match[0].length);
  }
  return html;
}

function normalizeHeadings(html) {
  return html
    .replaceAll("متى تكون هذه الخدمة أولوية؟", "متى تحتاجها الشركة؟")
    .replaceAll("مخرجات عملية متوقعة", "ما النتائج المتوقعة؟");
}

function insertBeforeFaq(html, block) {
  const faqIndex = html.search(/<section[^>]*>\s*<div class="container">\s*<div class="section-head"><h2>الأسئلة الشائعة<\/h2>/);
  if (faqIndex >= 0) return html.slice(0, faqIndex) + block + html.slice(faqIndex);
  const mainEnd = html.indexOf("</main>");
  if (mainEnd >= 0) return html.slice(0, mainEnd) + block + html.slice(mainEnd);
  return html + block;
}

const files = fs.readdirSync(servicesDir)
  .filter((file) => file.endsWith(".html") && file !== "index.html")
  .sort();

const report = [];

for (const file of files) {
  const slug = file.replace(/\.html$/, "");
  const fullPath = path.join(servicesDir, file);
  let html = fs.readFileSync(fullPath, "utf8");
  const before = html;
  const title = extractTitle(html, file);

  html = normalizeHeadings(html);

  const needsDecision = !hasText(html, "لمن هذه الخدمة؟") || !hasText(html, "متى تحتاجها الشركة؟") || !hasText(html, "ما النتائج المتوقعة؟");
  if (needsDecision) html = insertBeforeFaq(html, buildDecisionSection(title));

  if (!hasText(html, "مقالات ذات صلة")) {
    html = insertBeforeFaq(html, buildRelatedArticles(slug));
  }

  html = ensureCss(html);
  const faqs = extractFaqs(html);
  html = updateFaqSchema(html, slug, faqs);

  if (html !== before) {
    fs.writeFileSync(fullPath, html);
    report.push({ file: `services/${file}`, title, changed: true, faq: faqs });
  } else {
    report.push({ file: `services/${file}`, title, changed: false, faq: faqs });
  }
}

const changedCount = report.filter((item) => item.changed).length;
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "services-aeo-geo-report.json"), JSON.stringify({ scanned: files.length, changed: changedCount, report }, null, 2));
console.log(JSON.stringify({ scanned: files.length, changed: changedCount, report }, null, 2));
