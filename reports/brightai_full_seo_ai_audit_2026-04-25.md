# تقرير تدقيق وتحسين Bright AI الشامل

تاريخ الفحص: 2026-04-25  
النطاق: `/Users/yzydalshmry/Desktop/BRIGHTAI`  
مصادر الدليل: كل ملفات HTML داخل المشروع، `robots.txt`, `sitemap.xml`, ملفات CSS/JS/images، وملف `reports/keywords strategy 2026.xlsx`.  
تنبيه قياس: هذه النسبة تقديرية مبنية على فحص الملفات الثابتة وليست قياس Lighthouse مباشر. تم تشغيل `npm run performance:budget` ونجح، لكن لم يتم تشغيل Lighthouse مباشر.

## Executive Summary

- عدد ملفات HTML المفحوصة: 234
- عدد ملفات CSS: 28
- عدد ملفات JS/MJS: 117
- عدد الصور: 25
- عدد روابط sitemap: 199
- نتيجة `npm run seo:check`: ناجح وفق سياسة فتح صفحات الموقع والنماذج التجريبية.
- نتيجة `npm run internal-links:audit`: 0 أعطال داخلية.
- نتيجة `npm run performance:budget`: ناجح.

Overall Site Health Score الحالي: 91%  
SEO Readiness Score: 99%  
AI Search Readiness Score: 88%  
Google AI Mode Citation Score: 91%  
Technical Reliability Score: 85%  
Mobile/Desktop Experience Score: 69%  
Authority & Trust Score: 80%

## النسب المئوية الحالية للموقع

| المحور | الوزن | النتيجة الحالية % | النتيجة المستهدفة % | مستوى الخطورة | السبب المختصر |
|---|---:|---:|---:|---|---|
| Technical SEO | 15% | 100% | 90%+ | منخفض | البنية قوية وrobots.txt لا يحظر صفحات الموقع أو نماذج العملاء. |
| On-Page SEO | 15% | 100% | 90%+ | منخفض | العناوين والوصف وH1 موجودة غالبًا، مع تكرارات تحتاج تخصيص. |
| Content Depth | 12% | 98% | 90%+ | منخفض | صفحات كثيرة غنية، لكن بعض صفحات الخدمة/demo تحتاج عمقًا موجّهًا. |
| AEO Readiness | 10% | 76% | 90%+ | متوسط | FAQ والجداول ليست منتظمة في كل الصفحات التجارية. |
| GEO / AI Search Readiness | 12% | 97% | 90%+ | منخفض | llms وschema موجودة جزئيًا، لكن Answer Blocks والثقة غير متسقة. |
| Google AI Mode Citation Readiness | 10% | 91% | 90%+ | منخفض | الاقتباس يحتاج جمل تعريفية مباشرة وأدلة أكثر. |
| Internal Linking | 8% | 98% | 90%+ | منخفض | تدقيق الروابط صفر أعطال، لكن بعض الصفحات تحتاج روابط سياقية أقوى. |
| Page Speed / Performance | 8% | 56% | 90%+ | حرج | ميزانية الأداء ناجحة، مع مخاطر صور/أبعاد وموارد متعددة من الفحص الثابت. |
| Mobile UX | 5% | 82% | 90%+ | متوسط | لا يوجد Lighthouse مباشر؛ التقدير من البنية وCTA والجداول والصور. |
| Trust & Authority Signals | 5% | 80% | 90%+ | متوسط | About/Contact/Privacy موجودة، لكن الأدلة والامتثال تحتاج توحيدًا في الصفحات المال. |

## أهم 10 مشاكل حرجة

| الصفحة | سبب الأولوية | النتيجة الضعيفة | الأثر التجاري | إجراء أول |
|---|---|---:|---|---|
| sectors/index.html | Sector landing intent | AI Mode 52% / Depth 59% | مرتفع | إضافة Answer Block وفقرة ثقة |
| ai-bots/index.html | AI agents intent | AI Mode 76% / Depth 90% | مرتفع | تعزيز FAQ/schema والروابط |
| interview/pages/supportAI/index.html | Commercial investigation intent | AI Mode 34% / Depth 37% | متوسط | إضافة Answer Block وفقرة ثقة |
| ai-workflows/index.html | Automation intent | AI Mode 92% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| about/index.html | Commercial investigation intent | AI Mode 90% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| consultation/index.html | Conversion intent | AI Mode 90% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| contact/index.html | Conversion intent | AI Mode 90% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| machine-learning/index.html | Commercial investigation intent | AI Mode 90% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| smart-medical-archive/index.html | Healthcare AI intent | AI Mode 96% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| smart-automation/index.html | Automation intent | AI Mode 97% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |

## Site Architecture Map

- `/` الصفحة الرئيسية
  - `/services/` الخدمات
    - `/ai-agent/` وكلاء الذكاء الاصطناعي
    - `/ai-bots/` ومنتجات Bright bots
    - `/smart-automation/` الأتمتة الذكية
    - `/data-analysis/` تحليل البيانات
    - `/machine-learning/` تعلم الآلة
  - `/sectors/` القطاعات
  - `/tenders/` منصة المناقصات demo
  - `/blog/` المحتوى الداعم
  - `/about/`, `/contact/`, `/consultation/` الثقة والتحويل
  - `/en/` النسخ الإنجليزية المرافقة
  - `/docs/` التوثيق وصفحات الدعم

## Click Depth والصفحات اليتيمة

| الصفحة | Click Depth | Incoming Links | Orphan Risk | مهمة تجاريًا؟ | الإجراء المقترح |
|---|---:|---:|---|---|---|
| index.html | 0 | 891 | لا | نعم | لا إجراء عاجل |
| sectors/index.html | 1 | 33 | لا | نعم | لا إجراء عاجل |
| ai-bots/index.html | 1 | 7 | لا | نعم | لا إجراء عاجل |
| ai-workflows/index.html | 1 | 24 | لا | نعم | لا إجراء عاجل |
| about/index.html | 1 | 406 | لا | نعم | لا إجراء عاجل |
| consultation/index.html | 1 | 440 | لا | نعم | لا إجراء عاجل |
| contact/index.html | 1 | 843 | لا | نعم | لا إجراء عاجل |
| smart-medical-archive/index.html | 1 | 419 | لا | نعم | لا إجراء عاجل |
| smart-automation/index.html | 1 | 682 | لا | نعم | لا إجراء عاجل |
| services/index.html | 1 | 922 | لا | نعم | لا إجراء عاجل |
| tenders/landing.html | 1 | 335 | لا | نعم | لا إجراء عاجل |
| data-analysis/index.html | 1 | 591 | لا | نعم | لا إجراء عاجل |
| ai-agent/index.html | 1 | 457 | لا | نعم | لا إجراء عاجل |
| tenders/index.html | 1 | 38 | لا | نعم | لا إجراء عاجل |
| blog/top-ai-tools-saudi-2025.html | 1 | 16 | لا | لا | لا إجراء عاجل |
| blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | 1 | 9 | لا | لا | لا إجراء عاجل |
| case-studies/index.html | 1 | 182 | لا | لا | لا إجراء عاجل |
| blog/chatgpt-vs-claude-vs-gemini-arabic.html | 1 | 19 | لا | لا | لا إجراء عاجل |
| blog/vision-2030-ai-opportunities.html | 1 | 30 | لا | لا | لا إجراء عاجل |
| try/data-analyzer/index.html | 1 | 15 | لا | لا | لا إجراء عاجل |
| demo/pricing/index.html | 1 | 30 | لا | لا | لا إجراء عاجل |
| try/index.html | 1 | 208 | لا | لا | لا إجراء عاجل |
| blog/agint-bblog.html | 1 | 10 | لا | لا | لا إجراء عاجل |
| blog/data-analytics/kpi-dashboard-guide/index.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| partners/index.html | 1 | 11 | لا | لا | لا إجراء عاجل |
| ai-scolecs/index.html | 1 | 360 | لا | لا | لا إجراء عاجل |
| docs/services-overview.html | 1 | 28 | لا | لا | لا إجراء عاجل |
| docs/solutions-healthcare-en.html | 1 | 8 | لا | لا | لا إجراء عاجل |
| docs/ai-bots.html | 1 | 141 | لا | لا | لا إجراء عاجل |
| sectors/healthcare.html | 1 | 80 | لا | لا | لا إجراء عاجل |
| try/text-analysis/index.html | 1 | 4 | لا | لا | لا إجراء عاجل |
| interview/index.html | 1 | 340 | لا | لا | لا إجراء عاجل |
| sectors/energy.html | 1 | 14 | لا | لا | لا إجراء عاجل |
| sectors/finance.html | 1 | 107 | لا | لا | لا إجراء عاجل |
| try/data-quality/index.html | 1 | 6 | لا | لا | لا إجراء عاجل |
| blog/ai-innovation-saudi-arabia.html | 1 | 10 | لا | لا | لا إجراء عاجل |
| blog/automation/hr-automation-saudi/index.html | 1 | 15 | لا | لا | لا إجراء عاجل |
| blog/data-analytics/power-bi-saudi-guide/index.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| blog/cloude-opus-4.6.html | 1 | 8 | لا | لا | لا إجراء عاجل |
| blog/index.html | 1 | 766 | لا | لا | لا إجراء عاجل |
| docs/contact.html | 1 | 15 | لا | لا | لا إجراء عاجل |
| docs/openapi.html | 1 | 26 | لا | لا | لا إجراء عاجل |
| sectors/manufacturing.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| blog/الذكاء-الاصطناعي-و-التسويق.html | 1 | 7 | لا | لا | لا إجراء عاجل |
| sectors/ecommerce.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| sectors/logistics.html | 1 | 94 | لا | لا | لا إجراء عاجل |
| docs.html | 1 | 519 | لا | لا | لا إجراء عاجل |
| health/index.html | 1 | 324 | لا | لا | لا إجراء عاجل |
| blog/business-intelligence-saudi.html | 1 | 25 | لا | لا | لا إجراء عاجل |
| blog/gov.html | 1 | 6 | لا | لا | لا إجراء عاجل |
| tenders/compare.html | 1 | 28 | لا | لا | لا إجراء عاجل |
| en/index.html | 1 | 8 | لا | لا | لا إجراء عاجل |
| docs/terms-and-conditions.html | 1 | 22 | لا | لا | لا إجراء عاجل |
| privacy-cookies/index.html | 1 | 33 | لا | لا | لا إجراء عاجل |
| sitemap/index.html | 1 | 8 | لا | لا | لا إجراء عاجل |
| machine-learning/index.html | 2 | 8 | لا | نعم | لا إجراء عاجل |
| en/ai-bots/index.html | 2 | 1 | لا | لا | لا إجراء عاجل |
| en/services/index.html | 2 | 34 | لا | لا | لا إجراء عاجل |
| blog/data-analysis-best-practices.html | 2 | 1 | لا | لا | لا إجراء عاجل |
| blog/تعلم-الآلة-و-الأعمال.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/big-data-analysis.html | 2 | 11 | لا | لا | لا إجراء عاجل |
| blog/smart-automation-benefits.html | 2 | 20 | لا | لا | لا إجراء عاجل |
| blog/kfshrc-breast-cancer-ai.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/data-analysis.html | 2 | 60 | لا | لا | لا إجراء عاجل |
| what-is-ai/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/intelligent-data-analysis.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/process-automation.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| blog/analysy.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| blog/auto.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/smart-inventory-management.html | 2 | 27 | لا | لا | لا إجراء عاجل |
| blog/building-ai-agents-guide.html | 2 | 2 | لا | لا | لا إجراء عاجل |
| blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/ai-guide-saudi-business.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| blog/ai-implementation-cost-guide.html | 2 | 23 | لا | لا | لا إجراء عاجل |
| blog/ai-finance-saudi.html | 2 | 20 | لا | لا | لا إجراء عاجل |
| blog/riyadh-municipality-ai-license.html | 2 | 3 | لا | لا | لا إجراء عاجل |
| docs/consultation-en.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/data-analysis-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-bi-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| docs/solutions-crm-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| docs/solutions-ocr-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-retail-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-supply-chain-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/choose-ai-company-saudi.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| blog/ai-energy-saudi.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/hr-automation-case-study.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-renewable-energy-ai.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/saudi-smart-city-traffic.html | 2 | 3 | لا | لا | لا إجراء عاجل |
| blog/saudi-waste-management-ai.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| docs/terms-and-conditions-en.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/ai.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/future-of-intelligent-data-analysis-finance-sector.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/smart-crm-system.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| demo/index.html | 2 | 81 | لا | لا | لا إجراء عاجل |
| docs/solutions-logistics-en.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/atou-job.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/digital.html | 2 | 7 | لا | لا | لا إجراء عاجل |
| demo/resources/report-ai-saudi-2026/index.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/privacy-policy-en/index.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| en/about/index.html | 2 | 63 | لا | لا | لا إجراء عاجل |
| en/consultation/index.html | 2 | 27 | لا | لا | لا إجراء عاجل |
| tenders/dashboard.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| docs/consultation.html | 2 | 23 | لا | لا | لا إجراء عاجل |
| docs/smart-automation.html | 2 | 45 | لا | لا | لا إجراء عاجل |
| docs/solutions-bi.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/solutions-crm.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| docs/solutions-finance-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-finance.html | 2 | 26 | لا | لا | لا إجراء عاجل |
| docs/solutions-hr.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| docs/solutions-interview-en.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| docs/solutions-ocr.html | 2 | 34 | لا | لا | لا إجراء عاجل |
| docs/solutions-retail.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| docs/solutions-supply-chain.html | 2 | 41 | لا | لا | لا إجراء عاجل |
| blog/smart-document-processing.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| demo/ocr-demo/index.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightMath/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightProject/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightRecruiter/index.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightSales/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightSupport/index.html | 2 | 24 | لا | لا | لا إجراء عاجل |
| blog/commerce-ministry-chatbot.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/private-hospital-scheduling-optimization.html | 2 | 18 | لا | لا | لا إجراء عاجل |
| blog/saudi-agritech-smart-farming.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/saudi-bank-fraud-detection.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| blog/saudi-dates-quality-ai.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/saudi-edtech-personalized-learning.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/saudi-energy-predictive-maintenance.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/saudi-factory-ai-productivity.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/saudi-hospitality-dynamic-pricing.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/saudi-insurance-claims-ai.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/saudi-manufacturing-predictive-maintenance.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-mining-ai-exploration.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/saudi-petrochemical-ai-safety.html | 2 | 17 | لا | لا | لا إجراء عاجل |
| blog/saudi-real-estate-ai-valuation.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/saudi-sports-analytics-ai.html | 2 | 33 | لا | لا | لا إجراء عاجل |
| sectors/healthcare-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| tools/index.html | 2 | 24 | لا | لا | لا إجراء عاجل |
| docs/solutions-logistics.html | 2 | 28 | لا | لا | لا إجراء عاجل |
| en/interview/index.html | 2 | 46 | لا | لا | لا إجراء عاجل |
| sectors/energy-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| sectors/finance-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| interview/pages/dashboard/index.html | 2 | 3 | لا | لا | لا إجراء عاجل |
| blog/ai-agent.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| blog/ai-generative-content-industry-saudi-arabia.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/ai-transformation.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| blog/business-intelligence-data-analysis.html | 2 | 7 | لا | لا | لا إجراء عاجل |
| blog/case-study-saudi-companies-ai-agents-customer-service.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| blog/generative-artificial-intelligence/index.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/transport-logistics-solutions.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | 2 | 20 | لا | لا | لا إجراء عاجل |
| blog/مقال-تحليل.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/ai-healthcare-saudi.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| tenders/reports.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| tenders/settings.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| blog/ksu-adaptive-learning.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/nca-ai-compliance-saudi.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-ecommerce-ai-growth.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-logistics-route-optimization.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| blog/saudi-tourism-ai-guide.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| docs/ai-bots-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/contact-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/faq-en.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/faq.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/services-overview-en.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/smart-automation-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| docs/solutions-healthcare.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/solutions-hr-en.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| docs/solutions-interview.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| en/ai-workflows/index.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| en/health/index.html | 2 | 42 | لا | لا | لا إجراء عاجل |
| en/smart-medical-archive/index.html | 2 | 50 | لا | لا | لا إجراء عاجل |
| en/tenders/landing.html | 2 | 55 | لا | لا | لا إجراء عاجل |
| tenders/templates.html | 2 | 25 | لا | لا | لا إجراء عاجل |
| docs/ai-agent-en.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| docs/ai-agent.html | 2 | 32 | لا | لا | لا إجراء عاجل |
| en/smart-automation/index.html | 2 | 64 | لا | لا | لا إجراء عاجل |
| en/tenders/compare.html | 2 | 23 | لا | لا | لا إجراء عاجل |
| sectors/manufacturing-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| blog/digital-health-smart-archive.html | 2 | 34 | لا | لا | لا إجراء عاجل |
| blog/تحليل-البيانات.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/government-ai-solutions.html | 2 | 2 | لا | لا | لا إجراء عاجل |
| sectors/ecommerce-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| sectors/logistics-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| en/docs/index.html | 2 | 51 | لا | لا | لا إجراء عاجل |
| blog/digital-banking-saudi.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| blog/nca-compliance.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| interview/pages/support-ai/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html | 2 | 24 | لا | لا | لا إجراء عاجل |
| blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| en/ai-agent/index.html | 2 | 56 | لا | لا | لا إجراء عاجل |
| terms/index.html | 2 | 7 | لا | لا | لا إجراء عاجل |
| en/data-analysis/index.html | 2 | 67 | لا | لا | لا إجراء عاجل |
| interview/pages/appointment/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| docs/privacy-policy.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| en/tenders/index.html | 3 | 7 | لا | لا | لا إجراء عاجل |
| en/tenders/dashboard.html | 3 | 15 | لا | لا | لا إجراء عاجل |
| en/tenders/reports.html | 3 | 16 | لا | لا | لا إجراء عاجل |
| en/tenders/settings.html | 3 | 14 | لا | لا | لا إجراء عاجل |
| en/tools/index.html | 3 | 13 | لا | لا | لا إجراء عاجل |
| en/ai-bots/BrightMath/index.html | 3 | 1 | لا | لا | لا إجراء عاجل |
| en/ai-bots/BrightProject/index.html | 3 | 1 | لا | لا | لا إجراء عاجل |
| en/ai-bots/BrightRecruiter/index.html | 3 | 1 | لا | لا | لا إجراء عاجل |
| en/ai-bots/BrightSales/index.html | 3 | 1 | لا | لا | لا إجراء عاجل |
| en/ai-bots/BrightSupport/index.html | 3 | 1 | لا | لا | لا إجراء عاجل |
| en/tenders/templates.html | 3 | 24 | لا | لا | لا إجراء عاجل |
| en/contact/index.html | 3 | 48 | لا | لا | لا إجراء عاجل |
| interview/pages/supportAI/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| mais-OBM/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| bot/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| interview/pages/Visitor-registration/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/Generative-artificial-intelligence.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/workplace-automation-guide.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/ai-automation-project-analysis.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/digital-transformation-automation.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/industrial-automation-repetitive-tasks.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/machine-learning-computer-vision.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| en/terms/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/ai-manufacturing-digital-guide.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| docs/privacy-policy-en.html | غير قابل من الصفحة الرئيسية | 13 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| en/privacy-cookies/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/healthcare-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/energy-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/finance-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/process-automation-ai-efficiency.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| en/docs/docs.html | غير قابل من الصفحة الرئيسية | 1 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/manufacturing-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/ecommerce-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/logistics-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/financial-hr-automation.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/industrial-automation-productivity.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |

## ملفات CSS / JS / الصور

### ملفات CSS

| الملف | الحجم KB | ملاحظة |
|---|---:|---|
| assets/css/extracted-inline-styles.css | 19.9 | غير مصغّر أو مصدر |
| assets/css/text-ratio-fix.min.css | 2.3 | مصغّر |
| frontend/css/ai-scolecs-inline.min.css | 2.4 | مصغّر |
| frontend/css/bundle-critical.css | 19.6 | غير مصغّر أو مصدر |
| frontend/css/bundle-pages.css | 48.6 | غير مصغّر أو مصدر |
| frontend/css/cyber-wave.css | 0.7 | غير مصغّر أو مصدر |
| frontend/css/demo-theme.min.css | 2.9 | مصغّر |
| frontend/css/docs.css | 7.4 | غير مصغّر أو مصدر |
| frontend/css/en-interview-inline.min.css | 20.4 | مصغّر |
| frontend/css/en-tenders-templates-inline.min.css | 14.5 | مصغّر |
| frontend/css/fonts.css | 0.2 | غير مصغّر أو مصدر |
| frontend/css/index-critical-overrides.css | 11.7 | غير مصغّر أو مصدر |
| frontend/css/index-critical-overrides.min.css | 8.6 | مصغّر |
| frontend/css/index-theme.css | 38.8 | غير مصغّر أو مصدر |
| frontend/css/index-theme.min.css | 38.2 | مصغّر |
| frontend/css/interview-inline.min.css | 17.7 | مصغّر |
| frontend/css/main.bundle.css | 179.5 | غير مصغّر أو مصدر |
| frontend/css/main.bundle.min.css | 44.5 | مصغّر |
| frontend/css/ocr-demo-theme.min.css | 2.5 | مصغّر |
| frontend/css/services-page.css | 4.1 | غير مصغّر أو مصدر |
| frontend/css/services-page.min.css | 3.1 | مصغّر |
| frontend/css/tailwind-input.css | 0.6 | غير مصغّر أو مصدر |
| frontend/css/tailwind.local.min.css | 179.5 | مصغّر |
| frontend/css/tenders-index-inline.min.css | 37.6 | مصغّر |
| frontend/css/unified-nav-search.css | 6.8 | غير مصغّر أو مصدر |
| frontend/css/vendor/aos.css | 25.1 | غير مصغّر أو مصدر |
| frontend/css/vendor/swiper-bundle.min.css | 5.4 | مصغّر |
| smart-medical-archive/system-unified.css | 26.1 | غير مصغّر أو مصدر |

### ملفات JS

| الملف | الحجم KB | ملاحظة |
|---|---:|---|
| backend/blog-slug-redirects.e2e.test.js | 4.0 | مصدر أو سكربت تشغيل |
| backend/config/index.js | 4.7 | مصدر أو سكربت تشغيل |
| backend/groq-stream.functional.test.js | 11.6 | مصدر أو سكربت تشغيل |
| backend/middleware/rateLimiter.js | 7.1 | مصدر أو سكربت تشغيل |
| backend/rag-search.functional.test.js | 1.9 | مصدر أو سكربت تشغيل |
| backend/routes/aiGateway.js | 4.9 | مصدر أو سكربت تشغيل |
| backend/routes/analytics.js | 5.0 | مصدر أو سكربت تشغيل |
| backend/routes/chat.js | 12.1 | مصدر أو سكربت تشغيل |
| backend/routes/gemini.js | 17.4 | مصدر أو سكربت تشغيل |
| backend/routes/groq.js | 54.2 | مصدر أو سكربت تشغيل |
| backend/routes/medical.js | 3.3 | مصدر أو سكربت تشغيل |
| backend/routes/search 2.js | 7.4 | مصدر أو سكربت تشغيل |
| backend/routes/search 3.js | 7.4 | مصدر أو سكربت تشغيل |
| backend/routes/search.js | 3.0 | مصدر أو سكربت تشغيل |
| backend/routes/summary.js | 3.8 | مصدر أو سكربت تشغيل |
| backend/server.js | 25.6 | مصدر أو سكربت تشغيل |
| backend/services/aiGateway.js | 20.1 | مصدر أو سكربت تشغيل |
| backend/services/openaiCompatProvider.js | 4.3 | مصدر أو سكربت تشغيل |
| backend/services/ragSearch.js | 19.6 | مصدر أو سكربت تشغيل |
| backend/static-seo-headers.e2e.test.js | 4.9 | مصدر أو سكربت تشغيل |
| backend/stream-routes.e2e.test.js | 4.0 | مصدر أو سكربت تشغيل |
| backend/utils/cache 2.js | 4.2 | مصدر أو سكربت تشغيل |
| backend/utils/cache.js | 4.2 | مصدر أو سكربت تشغيل |
| backend/utils/errorHandler.js | 7.8 | مصدر أو سكربت تشغيل |
| backend/utils/sanitizer.js | 4.5 | مصدر أو سكربت تشغيل |
| backend/utils/sessionStore.js | 2.6 | مصدر أو سكربت تشغيل |
| backend/vitest.config.mjs | 0.3 | مصدر أو سكربت تشغيل |
| blog/check-canonical.js | 0.5 | مصدر أو سكربت تشغيل |
| frontend/js/accessibility.js | 8.0 | مصدر أو سكربت تشغيل |
| frontend/js/accessibility.min.js | 4.6 | حزمة/مصغّر |
| frontend/js/ai-scolecs-app.min.js | 16.3 | حزمة/مصغّر |
| frontend/js/analytics-events.js | 8.1 | مصدر أو سكربت تشغيل |
| frontend/js/api-gateway.min.js | 4.3 | حزمة/مصغّر |
| frontend/js/api-preflight.min.js | 0.6 | حزمة/مصغّر |
| frontend/js/article-ux-enhancements.js | 30.6 | مصدر أو سكربت تشغيل |
| frontend/js/article-ux-enhancements.min.js | 30.6 | حزمة/مصغّر |
| frontend/js/chat-widget.js | 2.7 | مصدر أو سكربت تشغيل |
| frontend/js/chatbot-production.bundle.js | 15.3 | حزمة/مصغّر |
| frontend/js/clarity-events.js | 0.6 | مصدر أو سكربت تشغيل |
| frontend/js/data-analyzer.min.js | 4.9 | حزمة/مصغّر |
| frontend/js/demo-stream.min.js | 1.8 | حزمة/مصغّر |
| frontend/js/docs-scripts.js | 1.3 | مصدر أو سكربت تشغيل |
| frontend/js/en-interview-app.min.js | 40.6 | حزمة/مصغّر |
| frontend/js/en-tenders-templates-app.min.js | 18.1 | حزمة/مصغّر |
| frontend/js/groq-client.js | 9.7 | مصدر أو سكربت تشغيل |
| frontend/js/iconify-preload.js | 174.4 | مصدر أو سكربت تشغيل |
| frontend/js/index-theme.js | 35.5 | مصدر أو سكربت تشغيل |
| frontend/js/index-theme.min.js | 36.0 | حزمة/مصغّر |
| frontend/js/interview-app.min.js | 43.3 | حزمة/مصغّر |
| frontend/js/main.bundle.js | 24.5 | حزمة/مصغّر |
| frontend/js/main.bundle.min.js | 24.5 | حزمة/مصغّر |
| frontend/js/navigation.js | 22.9 | مصدر أو سكربت تشغيل |
| frontend/js/navigation.min.js | 22.9 | حزمة/مصغّر |
| frontend/js/ocr-demo.min.js | 2.8 | حزمة/مصغّر |
| frontend/js/optimization.js | 2.0 | مصدر أو سكربت تشغيل |
| frontend/js/page-enhancements.js | 27.6 | مصدر أو سكربت تشغيل |
| frontend/js/page-enhancements.min.js | 27.5 | حزمة/مصغّر |
| frontend/js/performance-loader.js | 6.8 | مصدر أو سكربت تشغيل |
| frontend/js/performance-loader.min.js | 3.8 | حزمة/مصغّر |
| frontend/js/runtime-config.min.js | 1.8 | حزمة/مصغّر |
| frontend/js/schema-loader.js | 2.5 | مصدر أو سكربت تشغيل |
| frontend/js/search 2.js | 20.5 | مصدر أو سكربت تشغيل |
| frontend/js/search.js | 25.5 | مصدر أو سكربت تشغيل |
| frontend/js/search.min.js | 25.5 | حزمة/مصغّر |
| frontend/js/sentry-init.js | 1.0 | مصدر أو سكربت تشغيل |
| frontend/js/services-page.js | 2.5 | مصدر أو سكربت تشغيل |
| frontend/js/services-page.min.js | 1.4 | حزمة/مصغّر |
| frontend/js/tenders-index-app.min.js | 37.4 | حزمة/مصغّر |
| frontend/js/tovik-loader.js | 0.9 | مصدر أو سكربت تشغيل |
| frontend/js/tovik-loader.min.js | 0.5 | حزمة/مصغّر |
| frontend/js/vendor/aos.js | 14.1 | مصدر أو سكربت تشغيل |
| frontend/js/vendor/iconify-icon.min.js | 21.3 | حزمة/مصغّر |
| frontend/js/vendor/iconify.min.js | 22.3 | حزمة/مصغّر |
| frontend/js/vendor/swiper-bundle.min.js | 150.9 | حزمة/مصغّر |
| frontend/scripts/dev-server.mjs | 2.7 | مصدر أو سكربت تشغيل |
| frontend/tests/smoke.test.mjs | 1.5 | مصدر أو سكربت تشغيل |
| scripts/analytics-qa.mjs | 5.5 | مصدر أو سكربت تشغيل |
| scripts/apply-seo-intent-headings.mjs | 45.2 | مصدر أو سكربت تشغيل |
| scripts/check-api-base-consistency.mjs | 4.2 | مصدر أو سكربت تشغيل |
| scripts/check-performance-budget.js | 2.5 | مصدر أو سكربت تشغيل |
| scripts/create-en-pages.mjs | 15.6 | مصدر أو سكربت تشغيل |
| scripts/fix-internal-links.mjs | 6.2 | مصدر أو سكربت تشغيل |
| scripts/fix-resource-paths.mjs | 1.5 | مصدر أو سكربت تشغيل |
| scripts/generate-brightai-full-audit-report.mjs | 59.0 | مصدر أو سكربت تشغيل |
| scripts/generate-related-articles.mjs | 6.6 | مصدر أو سكربت تشغيل |
| scripts/generate-sitemap-all-pages.mjs | 14.8 | مصدر أو سكربت تشغيل |
| scripts/high-confidence-sitemap-config.mjs | 3.8 | مصدر أو سكربت تشغيل |
| scripts/html-seo-governor.mjs | 27.3 | مصدر أو سكربت تشغيل |
| scripts/indexnow-submit.mjs | 1.9 | مصدر أو سكربت تشغيل |
| scripts/internal-links-audit.mjs | 1.2 | مصدر أو سكربت تشغيل |
| scripts/internal-links-common.mjs | 34.4 | مصدر أو سكربت تشغيل |
| scripts/local-secrets.mjs | 6.1 | مصدر أو سكربت تشغيل |
| scripts/minify-seo-assets.mjs | 2.0 | مصدر أو سكربت تشغيل |
| scripts/ping-search-engines.mjs | 2.6 | مصدر أو سكربت تشغيل |
| scripts/replace-unminified-refs.mjs | 6.1 | مصدر أو سكربت تشغيل |
| scripts/resource-paths-audit.mjs | 1.0 | مصدر أو سكربت تشغيل |
| scripts/resource-paths-common.mjs | 26.0 | مصدر أو سكربت تشغيل |
| scripts/run-monorepo-tests.mjs | 3.6 | مصدر أو سكربت تشغيل |
| scripts/seo-ci-check.mjs | 20.4 | مصدر أو سكربت تشغيل |
| scripts/seo-health-check.mjs | 18.6 | مصدر أو سكربت تشغيل |
| scripts/seo-indexability-qa.mjs | 7.1 | مصدر أو سكربت تشغيل |
| scripts/seo-intent-headings-qa.mjs | 9.7 | مصدر أو سكربت تشغيل |
| scripts/seo-url-map.mjs | 10.5 | مصدر أو سكربت تشغيل |
| scripts/sitemap-audit-utils.mjs | 5.7 | مصدر أو سكربت تشغيل |
| scripts/smoke-test-api.mjs | 7.0 | مصدر أو سكربت تشغيل |
| scripts/submit-indexnow.mjs | 6.3 | مصدر أو سكربت تشغيل |
| scripts/verify-all.mjs | 7.5 | مصدر أو سكربت تشغيل |
| scripts/verify-clarity.mjs | 0.8 | مصدر أو سكربت تشغيل |
| smart-medical-archive/smart-ai-logic.js | 9.2 | مصدر أو سكربت تشغيل |
| smart-medical-archive/system-unified.js | 118.5 | مصدر أو سكربت تشغيل |
| sw.js | 4.1 | مصدر أو سكربت تشغيل |
| tenders/api-config.js | 8.1 | مصدر أو سكربت تشغيل |
| tenders/api-config.min.js | 4.9 | حزمة/مصغّر |
| tenders/render-backend/server 2.js | 2.4 | مصدر أو سكربت تشغيل |
| tenders/render-backend/server.js | 0.2 | مصدر أو سكربت تشغيل |
| tests/aiGateway.test.js | 10.8 | مصدر أو سكربت تشغيل |
| vitest.config.js | 0.3 | مصدر أو سكربت تشغيل |

### الصور

| الملف | الحجم KB | النوع | ملاحظة أداء |
|---|---:|---|---|
| assets/3d-icons/gpt-image-1.5_Digital_twins_Accurate_simulation_of_equipment_and_processes_—_testing_scenari-0.avif | 108.6 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/gpt-image-1.5_Digital_twins_Accurate_simulation_of_equipment_and_processes_—_testing_scenari-0.webp | 80.9 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/gpt-image-1.5_Smart_drones_Aerial_surveying_infrastructure_monitoring_industrial_inspection_pr-0.avif | 121.1 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/gpt-image-1.5_Smart_drones_Aerial_surveying_infrastructure_monitoring_industrial_inspection_pr-0.webp | 86.1 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/gpt-image-1.5_Warehouse_automation_Goods_handling_parcel_sorting_inventory_management_truck_lo-0.avif | 115.3 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/gpt-image-1.5_Warehouse_automation_Goods_handling_parcel_sorting_inventory_management_truck_lo-0.webp | 86.2 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.avif | 5.7 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.webp | 10.7 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.avif | 8.0 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.webp | 16.7 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.avif | 3.6 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.webp | 7.6 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.avif | 5.0 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.webp | 10.8 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/seedream-4.5_Customer_interaction_robots_Reception_shopping_cleaning_and_hospitality_robots_-0.avif | 80.4 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/seedream-4.5_Customer_interaction_robots_Reception_shopping_cleaning_and_hospitality_robots_-0.webp | 67.4 | WEBP | ضمن الحد غالبًا |
| assets/images/chatbot.svg | 2.2 | SVG | ضمن الحد غالبًا |
| assets/images/Gemini.png | 4.3 | PNG | ضمن الحد غالبًا |
| assets/images/grid.svg | 0.7 | SVG | ضمن الحد غالبًا |
| assets/images/hero-brain.svg | 11.4 | SVG | ضمن الحد غالبًا |
| assets/images/noise.png | 0.1 | PNG | ضمن الحد غالبًا |
| assets/svg/inline-icon-20ad9f0ba8e6.svg | 0.9 | SVG | ضمن الحد غالبًا |
| assets/svg/inline-icon-3effdab8a020.svg | 1.3 | SVG | ضمن الحد غالبًا |
| assets/svg/inline-icon-756421bc760e.svg | 1.3 | SVG | ضمن الحد غالبًا |
| blog/Gemini.png | 50.0 | PNG | ضمن الحد غالبًا |

## جدول كل صفحات HTML

| الملف | المسار | نوع الصفحة | اللغة | موجود في sitemap؟ | قابل للفهرسة؟ | له canonical؟ | له schema؟ | ملاحظات |
|---|---|---|---|---|---|---|---|---|
| 404.html | 404.html | صفحة عربية عامة | ar-SA | لا | لا | لا | WebPage | canonical مفقود |
| 500.html | 500.html | صفحة عربية عامة | ar-SA | لا | لا | لا | WebPage | canonical مفقود |
| index.html | about/index.html | تعريف بالشركة | ar-SA | نعم | نعم | نعم | Organization, LocalBusiness, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | ai-agent/index.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, LocalBusiness,ProfessionalService, WebPage, Service, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | ai-bots/BrightMath/index.html | خدمة | ar-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | ai-bots/BrightProject/index.html | خدمة | ar-SA | نعم | نعم | نعم | BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | ai-bots/BrightRecruiter/index.html | خدمة | ar-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | ai-bots/BrightSales/index.html | خدمة | ar-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | ai-bots/BrightSupport/index.html | خدمة | ar-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | ai-bots/index.html | خدمة | ar-SA | نعم | نعم | نعم | CollectionPage, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | ai-scolecs/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | BreadcrumbList, LocalBusiness,ProfessionalService, Service | لا ملاحظات حرجة |
| index.html | ai-workflows/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList | لا ملاحظات حرجة |
| agint-bblog.html | blog/agint-bblog.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-agent.html | blog/ai-agent.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-automation-project-analysis.html | blog/ai-automation-project-analysis.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-energy-saudi.html | blog/ai-energy-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-finance-saudi.html | blog/ai-finance-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-generative-content-industry-saudi-arabia.html | blog/ai-generative-content-industry-saudi-arabia.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-guide-saudi-business.html | blog/ai-guide-saudi-business.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-healthcare-saudi.html | blog/ai-healthcare-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, MedicalWebPage, BreadcrumbList | لا ملاحظات حرجة |
| ai-implementation-cost-guide.html | blog/ai-implementation-cost-guide.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-innovation-saudi-arabia.html | blog/ai-innovation-saudi-arabia.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-manufacturing-digital-guide.html | blog/ai-manufacturing-digital-guide.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai-transformation.html | blog/ai-transformation.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| ai.html | blog/ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| analysy.html | blog/analysy.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| atou-job.html | blog/atou-job.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| auto.html | blog/auto.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/automation/hr-automation-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| big-data-analysis.html | blog/big-data-analysis.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| building-ai-agents-guide.html | blog/building-ai-agents-guide.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| business-intelligence-data-analysis.html | blog/business-intelligence-data-analysis.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| business-intelligence-saudi.html | blog/business-intelligence-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| case-study-saudi-companies-ai-agents-customer-service.html | blog/case-study-saudi-companies-ai-agents-customer-service.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| chatgpt-vs-claude-vs-gemini-arabic.html | blog/chatgpt-vs-claude-vs-gemini-arabic.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| choose-ai-company-saudi.html | blog/choose-ai-company-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| cloude-opus-4.6.html | blog/cloude-opus-4.6.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| commerce-ministry-chatbot.html | blog/commerce-ministry-chatbot.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| data-analysis-best-practices.html | blog/data-analysis-best-practices.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/data-analytics/kpi-dashboard-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/data-analytics/power-bi-saudi-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| digital-banking-saudi.html | blog/digital-banking-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| digital-health-smart-archive.html | blog/digital-health-smart-archive.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| digital-transformation-automation.html | blog/digital-transformation-automation.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| digital.html | blog/digital.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| financial-hr-automation.html | blog/financial-hr-automation.html | مقال/مدونة | ar-SA | لا | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| future-of-intelligent-data-analysis-finance-sector.html | blog/future-of-intelligent-data-analysis-finance-sector.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| Generative-artificial-intelligence.html | blog/Generative-artificial-intelligence.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/generative-artificial-intelligence/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| gov.html | blog/gov.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| government-ai-solutions.html | blog/government-ai-solutions.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| hr-automation-case-study.html | blog/hr-automation-case-study.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Blog, BreadcrumbList, CollectionPage, ItemList, Article | لا ملاحظات حرجة |
| industrial-automation-productivity.html | blog/industrial-automation-productivity.html | مقال/مدونة | ar-SA | لا | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| industrial-automation-repetitive-tasks.html | blog/industrial-automation-repetitive-tasks.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| intelligent-data-analysis.html | blog/intelligent-data-analysis.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| kfshrc-breast-cancer-ai.html | blog/kfshrc-breast-cancer-ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | MedicalScholarlyArticle, Article, BreadcrumbList | لا ملاحظات حرجة |
| ksu-adaptive-learning.html | blog/ksu-adaptive-learning.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| machine-learning-computer-vision.html | blog/machine-learning-computer-vision.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| nca-ai-compliance-saudi.html | blog/nca-ai-compliance-saudi.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| nca-compliance.html | blog/nca-compliance.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| private-hospital-scheduling-optimization.html | blog/private-hospital-scheduling-optimization.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| process-automation-ai-efficiency.html | blog/process-automation-ai-efficiency.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| process-automation.html | blog/process-automation.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| riyadh-municipality-ai-license.html | blog/riyadh-municipality-ai-license.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-agritech-smart-farming.html | blog/saudi-agritech-smart-farming.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-bank-fraud-detection.html | blog/saudi-bank-fraud-detection.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-dates-quality-ai.html | blog/saudi-dates-quality-ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-ecommerce-ai-growth.html | blog/saudi-ecommerce-ai-growth.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-edtech-personalized-learning.html | blog/saudi-edtech-personalized-learning.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-energy-predictive-maintenance.html | blog/saudi-energy-predictive-maintenance.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-factory-ai-productivity.html | blog/saudi-factory-ai-productivity.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-hospitality-dynamic-pricing.html | blog/saudi-hospitality-dynamic-pricing.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-insurance-claims-ai.html | blog/saudi-insurance-claims-ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-logistics-route-optimization.html | blog/saudi-logistics-route-optimization.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-manufacturing-predictive-maintenance.html | blog/saudi-manufacturing-predictive-maintenance.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-mining-ai-exploration.html | blog/saudi-mining-ai-exploration.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-petrochemical-ai-safety.html | blog/saudi-petrochemical-ai-safety.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-real-estate-ai-valuation.html | blog/saudi-real-estate-ai-valuation.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-renewable-energy-ai.html | blog/saudi-renewable-energy-ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-smart-city-traffic.html | blog/saudi-smart-city-traffic.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-sports-analytics-ai.html | blog/saudi-sports-analytics-ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-tourism-ai-guide.html | blog/saudi-tourism-ai-guide.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| saudi-waste-management-ai.html | blog/saudi-waste-management-ai.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| smart-automation-benefits.html | blog/smart-automation-benefits.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| smart-crm-system.html | blog/smart-crm-system.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| smart-document-processing.html | blog/smart-document-processing.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| smart-inventory-management.html | blog/smart-inventory-management.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| top-ai-tools-saudi-2025.html | blog/top-ai-tools-saudi-2025.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| transport-logistics-solutions.html | blog/transport-logistics-solutions.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| vision-2030-ai-opportunities.html | blog/vision-2030-ai-opportunities.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| workplace-automation-guide.html | blog/workplace-automation-guide.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html | blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html | blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html | مقال/مدونة | ar-SA | لا | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | مقال/مدونة | ar-SA | لا | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| الذكاء-الاصطناعي-و-التسويق.html | blog/الذكاء-الاصطناعي-و-التسويق.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| تحليل-البيانات.html | blog/تحليل-البيانات.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| تعلم-الآلة-و-الأعمال.html | blog/تعلم-الآلة-و-الأعمال.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| مقال-تحليل.html | blog/مقال-تحليل.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | bot/index.html | تجربة/أداة | ar-SA | لا | نعم | نعم | لا | JSON-LD غير موجود |
| index.html | case-studies/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | CollectionPage, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | consultation/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList | لا ملاحظات حرجة |
| index.html | contact/index.html | تواصل | ar-SA | نعم | نعم | نعم | ContactPage, LocalBusiness, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | data-analysis/index.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, LocalBusiness,ProfessionalService, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | demo/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | demo/ocr-demo/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | Organization, WebPage, Service, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | demo/pricing/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | demo/resources/report-ai-saudi-2026/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | Report, BreadcrumbList, Article | لا ملاحظات حرجة |
| docs.html | docs.html | توثيق | ar-SA | نعم | نعم | نعم | CollectionPage, WebPage, BreadcrumbList | لا ملاحظات حرجة |
| ai-agent-en.html | docs/ai-agent-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| ai-agent.html | docs/ai-agent.html | توثيق | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| ai-bots-en.html | docs/ai-bots-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| ai-bots.html | docs/ai-bots.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| consultation-en.html | docs/consultation-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| consultation.html | docs/consultation.html | توثيق | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| contact-en.html | docs/contact-en.html | توثيق | en-SA | نعم | نعم | نعم | ContactPage, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| contact.html | docs/contact.html | توثيق | ar-SA | نعم | نعم | نعم | ContactPage, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| data-analysis-en.html | docs/data-analysis-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| data-analysis.html | docs/data-analysis.html | توثيق | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| faq-en.html | docs/faq-en.html | توثيق | en-SA | نعم | نعم | نعم | BreadcrumbList, WebPage | لا ملاحظات حرجة |
| faq.html | docs/faq.html | توثيق | ar-SA | نعم | نعم | نعم | BreadcrumbList, WebPage | لا ملاحظات حرجة |
| openapi.html | docs/openapi.html | توثيق | ar-SA | نعم | نعم | نعم | TechArticle, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| privacy-policy-en.html | docs/privacy-policy-en.html | توثيق | en-SA | لا | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | docs/privacy-policy-en/index.html | توثيق | en-SA | لا | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| privacy-policy.html | docs/privacy-policy.html | توثيق | ar-SA | لا | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| services-overview-en.html | docs/services-overview-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| services-overview.html | docs/services-overview.html | توثيق | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| smart-automation-en.html | docs/smart-automation-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| smart-automation.html | docs/smart-automation.html | توثيق | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-bi-en.html | docs/solutions-bi-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-bi.html | docs/solutions-bi.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-crm-en.html | docs/solutions-crm-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-crm.html | docs/solutions-crm.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-finance-en.html | docs/solutions-finance-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-finance.html | docs/solutions-finance.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-healthcare-en.html | docs/solutions-healthcare-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-healthcare.html | docs/solutions-healthcare.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-hr-en.html | docs/solutions-hr-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-hr.html | docs/solutions-hr.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-interview-en.html | docs/solutions-interview-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-interview.html | docs/solutions-interview.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-logistics-en.html | docs/solutions-logistics-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-logistics.html | docs/solutions-logistics.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-ocr-en.html | docs/solutions-ocr-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-ocr.html | docs/solutions-ocr.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-retail-en.html | docs/solutions-retail-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-retail.html | docs/solutions-retail.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-supply-chain-en.html | docs/solutions-supply-chain-en.html | توثيق | en-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| solutions-supply-chain.html | docs/solutions-supply-chain.html | توثيق | ar-SA | نعم | نعم | نعم | Service, BreadcrumbList, WebPage | لا ملاحظات حرجة |
| terms-and-conditions-en.html | docs/terms-and-conditions-en.html | توثيق | en-SA | لا | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| terms-and-conditions.html | docs/terms-and-conditions.html | توثيق | ar-SA | لا | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/about/index.html | تعريف بالشركة | en-SA | نعم | نعم | نعم | Organization, LocalBusiness, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | en/ai-agent/index.html | خدمة | en-SA | نعم | نعم | نعم | Organization, LocalBusiness,ProfessionalService, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightMath/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightProject/index.html | خدمة | en-SA | نعم | نعم | نعم | BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightRecruiter/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightSales/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightSupport/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/index.html | خدمة | en-SA | نعم | نعم | نعم | CollectionPage | لا ملاحظات حرجة |
| index.html | en/ai-workflows/index.html | خدمة | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/consultation/index.html | خدمة | en-SA | نعم | نعم | نعم | LocalBusiness,ProfessionalService, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | en/contact/index.html | تواصل | en-SA | نعم | نعم | نعم | ContactPage, LocalBusiness, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/data-analysis/index.html | خدمة | en-SA | نعم | نعم | نعم | Organization, LocalBusiness,ProfessionalService, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| docs.html | en/docs/docs.html | توثيق | en-SA | نعم | نعم | نعم | CollectionPage, WebPage, BreadcrumbList | hreflang غير موجود أو محدود |
| index.html | en/docs/index.html | توثيق | en-SA | نعم | نعم | نعم | CollectionPage, WebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/health/index.html | خدمة | en-SA | نعم | نعم | نعم | MedicalOrganization,LocalBusiness, WebPage, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | en/index.html | صفحة إنجليزية | en-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/interview/index.html | صفحة إنجليزية | en-SA | نعم | نعم | نعم | LocalBusiness, WebPage, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | en/privacy-cookies/index.html | قانونية | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/services/index.html | خدمة | en-SA | نعم | نعم | نعم | CollectionPage | لا ملاحظات حرجة |
| index.html | en/smart-automation/index.html | خدمة | en-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, WebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/smart-medical-archive/index.html | خدمة | en-SA | نعم | نعم | نعم | LocalBusiness,ProfessionalService, BreadcrumbList, Service | لا ملاحظات حرجة |
| compare.html | en/tenders/compare.html | مناقصات/demo | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| dashboard.html | en/tenders/dashboard.html | مناقصات/demo | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| index.html | en/tenders/index.html | مناقصات/demo | en-SA | نعم | نعم | نعم | Service, SoftwareApplication | لا ملاحظات حرجة |
| landing.html | en/tenders/landing.html | مناقصات/demo | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| reports.html | en/tenders/reports.html | مناقصات/demo | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| settings.html | en/tenders/settings.html | مناقصات/demo | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| templates.html | en/tenders/templates.html | مناقصات/demo | en-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| index.html | en/terms/index.html | قانونية | en-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/tools/index.html | صفحة إنجليزية | en-SA | نعم | نعم | نعم | CollectionPage, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| error.html | error.html | صفحة عربية عامة | ar-SA | لا | لا | لا | لا | canonical مفقود؛ JSON-LD غير موجود |
| index.html | health/index.html | خدمة | ar-SA | نعم | نعم | نعم | MedicalOrganization,LocalBusiness, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | Organization, LocalBusiness, WebSite, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | interview/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | LocalBusiness, WebPage, Service, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | interview/pages/appointment/index.html | تجربة/أداة | ar-SA | لا | نعم | نعم | WebPage | hreflang غير موجود أو محدود |
| index.html | interview/pages/dashboard/index.html | تجربة/أداة | ar-SA | لا | نعم | نعم | WebPage | hreflang غير موجود أو محدود |
| index.html | interview/pages/support-ai/index.html | تجربة/أداة | ar-SA | لا | نعم | نعم | WebPage | hreflang غير موجود أو محدود |
| index.html | interview/pages/supportAI/index.html | تجربة/أداة | ar-SA | لا | نعم | لا | لا | canonical مفقود؛ JSON-LD غير موجود؛ hreflang غير موجود أو محدود |
| index.html | interview/pages/Visitor-registration/index.html | تجربة/أداة | ar-SA | لا | نعم | نعم | WebPage | hreflang غير موجود أو محدود |
| index.html | machine-learning/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList | لا ملاحظات حرجة |
| index.html | mais-OBM/index.html | صفحة عامة | en | لا | نعم | نعم | لا | JSON-LD غير موجود؛ hreflang غير موجود أو محدود |
| index.html | partners/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | privacy-cookies/index.html | قانونية | ar-SA | لا | نعم | نعم | WebPage, BreadcrumbList | لا ملاحظات حرجة |
| ecommerce-en.html | sectors/ecommerce-en.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/ecommerce-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| ecommerce.html | sectors/ecommerce.html | قطاع | ar-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| energy-en.html | sectors/energy-en.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/energy-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| energy.html | sectors/energy.html | قطاع | ar-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| finance-en.html | sectors/finance-en.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/finance-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| finance.html | sectors/finance.html | قطاع | ar-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| healthcare-en.html | sectors/healthcare-en.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/healthcare-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| healthcare.html | sectors/healthcare.html | قطاع | ar-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/index.html | قطاع | ar-SA | لا | نعم | نعم | CollectionPage, BreadcrumbList | لا ملاحظات حرجة |
| logistics-en.html | sectors/logistics-en.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/logistics-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| logistics.html | sectors/logistics.html | قطاع | ar-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| manufacturing-en.html | sectors/manufacturing-en.html | قطاع | en-SA | نعم | نعم | نعم | Organization, Service, Industry, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/manufacturing-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Organization, Service, Industry, BreadcrumbList | لا ملاحظات حرجة |
| manufacturing.html | sectors/manufacturing.html | قطاع | ar-SA | نعم | نعم | نعم | Organization, Service, Industry, BreadcrumbList | لا ملاحظات حرجة |
| index.html | services/index.html | خدمة | ar-SA | نعم | نعم | نعم | CollectionPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sitemap/index.html | صفحة عامة | en | لا | نعم | نعم | BreadcrumbList | لا ملاحظات حرجة |
| index.html | smart-automation/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, WebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | smart-medical-archive/index.html | خدمة | ar-SA | نعم | نعم | نعم | LocalBusiness,ProfessionalService, Service, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| compare.html | tenders/compare.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| dashboard.html | tenders/dashboard.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| index.html | tenders/index.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | Organization, WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| landing.html | tenders/landing.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| reports.html | tenders/reports.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| settings.html | tenders/settings.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| templates.html | tenders/templates.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| index.html | terms/index.html | قانونية | ar-SA | لا | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | tools/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | CollectionPage, ItemList, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/data-analyzer/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/data-quality/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/text-analysis/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | what-is-ai/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | Article, Service, BreadcrumbList | لا ملاحظات حرجة |

## تقييم كل صفحة بالنسبة المئوية

| الصفحة | SEO % | AEO % | GEO/AI Search % | Content Depth % | Internal Linking % | Technical SEO % | Speed Risk % | UI/UX % | Trust % | الأولوية |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 404.html | 91% | 35% | 74% | 49% | 75% | 93% | 27% | 83% | 80% | متوسطة/منخفضة |
| 500.html | 91% | 35% | 70% | 59% | 80% | 93% | 48% | 83% | 70% | متوسطة/منخفضة |
| about/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 42% | 83% | 100% | مرتفعة |
| ai-agent/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 42% | 87% | 100% | مرتفعة |
| ai-bots/BrightMath/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 54% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightProject/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightRecruiter/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightSales/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightSupport/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/index.html | 100% | 63% | 86% | 90% | 100% | 100% | 6% | 83% | 70% | مرتفعة |
| ai-scolecs/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 75% | 83% | 80% | متوسطة/منخفضة |
| ai-workflows/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 80% | مرتفعة |
| blog/agint-bblog.html | 100% | 81% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/ai-agent.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| blog/ai-automation-project-analysis.html | 100% | 71% | 92% | 100% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/ai-energy-saudi.html | 100% | 75% | 96% | 100% | 100% | 100% | 45% | 87% | 70% | متوسطة/منخفضة |
| blog/ai-finance-saudi.html | 100% | 63% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/ai-generative-content-industry-saudi-arabia.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| blog/ai-guide-saudi-business.html | 100% | 81% | 96% | 100% | 95% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |
| blog/ai-healthcare-saudi.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 100% | متوسطة/منخفضة |
| blog/ai-implementation-cost-guide.html | 100% | 81% | 96% | 100% | 95% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |
| blog/ai-innovation-saudi-arabia.html | 100% | 75% | 100% | 100% | 100% | 100% | 50% | 92% | 80% | متوسطة/منخفضة |
| blog/ai-manufacturing-digital-guide.html | 100% | 81% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/ai-transformation.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| blog/ai.html | 100% | 63% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/analysy.html | 100% | 63% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/atou-job.html | 100% | 81% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/auto.html | 100% | 63% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/automation/hr-automation-saudi/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 44% | 88% | 80% | متوسطة/منخفضة |
| blog/big-data-analysis.html | 100% | 63% | 96% | 92% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/building-ai-agents-guide.html | 100% | 81% | 92% | 100% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/business-intelligence-data-analysis.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/business-intelligence-saudi.html | 100% | 93% | 100% | 100% | 100% | 100% | 53% | 92% | 80% | متوسطة/منخفضة |
| blog/case-study-saudi-companies-ai-agents-customer-service.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/chatgpt-vs-claude-vs-gemini-arabic.html | 100% | 81% | 96% | 100% | 100% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |
| blog/choose-ai-company-saudi.html | 100% | 81% | 96% | 100% | 97% | 100% | 39% | 83% | 70% | متوسطة/منخفضة |
| blog/cloude-opus-4.6.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| blog/commerce-ministry-chatbot.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/data-analysis-best-practices.html | 100% | 53% | 92% | 84% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/data-analytics/kpi-dashboard-guide/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 41% | 88% | 70% | متوسطة/منخفضة |
| blog/data-analytics/power-bi-saudi-guide/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 44% | 88% | 80% | متوسطة/منخفضة |
| blog/digital-banking-saudi.html | 100% | 93% | 100% | 100% | 100% | 100% | 53% | 92% | 80% | متوسطة/منخفضة |
| blog/digital-health-smart-archive.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 90% | متوسطة/منخفضة |
| blog/digital-transformation-automation.html | 100% | 81% | 92% | 100% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/digital.html | 100% | 81% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/financial-hr-automation.html | 100% | 71% | 96% | 100% | 90% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/future-of-intelligent-data-analysis-finance-sector.html | 100% | 63% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/Generative-artificial-intelligence.html | 100% | 63% | 92% | 77% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/generative-artificial-intelligence/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| blog/gov.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 90% | متوسطة/منخفضة |
| blog/government-ai-solutions.html | 100% | 83% | 100% | 100% | 100% | 100% | 48% | 87% | 90% | متوسطة/منخفضة |
| blog/hr-automation-case-study.html | 100% | 81% | 96% | 100% | 100% | 100% | 39% | 83% | 70% | متوسطة/منخفضة |
| blog/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| blog/industrial-automation-productivity.html | 100% | 71% | 96% | 100% | 90% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/industrial-automation-repetitive-tasks.html | 100% | 71% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/intelligent-data-analysis.html | 100% | 63% | 96% | 96% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/kfshrc-breast-cancer-ai.html | 100% | 63% | 96% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| blog/ksu-adaptive-learning.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| blog/machine-learning-computer-vision.html | 100% | 71% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/nca-ai-compliance-saudi.html | 100% | 81% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| blog/nca-compliance.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 90% | متوسطة/منخفضة |
| blog/private-hospital-scheduling-optimization.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/process-automation-ai-efficiency.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/process-automation.html | 100% | 63% | 96% | 97% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/riyadh-municipality-ai-license.html | 100% | 63% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-agritech-smart-farming.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-bank-fraud-detection.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-dates-quality-ai.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-ecommerce-ai-growth.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| blog/saudi-edtech-personalized-learning.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-energy-predictive-maintenance.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-factory-ai-productivity.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-hospitality-dynamic-pricing.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-insurance-claims-ai.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-logistics-route-optimization.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| blog/saudi-manufacturing-predictive-maintenance.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-mining-ai-exploration.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-petrochemical-ai-safety.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-real-estate-ai-valuation.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-renewable-energy-ai.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| blog/saudi-smart-city-traffic.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| blog/saudi-sports-analytics-ai.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-tourism-ai-guide.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| blog/saudi-waste-management-ai.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| blog/smart-automation-benefits.html | 100% | 63% | 96% | 94% | 100% | 100% | 53% | 88% | 70% | متوسطة/منخفضة |
| blog/smart-crm-system.html | 100% | 63% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/smart-document-processing.html | 100% | 63% | 100% | 100% | 100% | 100% | 50% | 88% | 90% | متوسطة/منخفضة |
| blog/smart-inventory-management.html | 100% | 63% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/top-ai-tools-saudi-2025.html | 100% | 81% | 96% | 100% | 95% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |
| blog/transport-logistics-solutions.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| blog/vision-2030-ai-opportunities.html | 100% | 81% | 96% | 100% | 100% | 100% | 39% | 83% | 70% | متوسطة/منخفضة |
| blog/workplace-automation-guide.html | 100% | 63% | 92% | 84% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html | 100% | 81% | 92% | 100% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html | 100% | 71% | 96% | 100% | 90% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | 100% | 71% | 96% | 100% | 90% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | 100% | 81% | 92% | 100% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | 100% | 71% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/الذكاء-الاصطناعي-و-التسويق.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 90% | متوسطة/منخفضة |
| blog/تحليل-البيانات.html | 100% | 81% | 100% | 100% | 100% | 100% | 53% | 88% | 90% | متوسطة/منخفضة |
| blog/تعلم-الآلة-و-الأعمال.html | 100% | 63% | 96% | 81% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/مقال-تحليل.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| bot/index.html | 94% | 53% | 80% | 100% | 45% | 93% | 9% | 63% | 60% | متوسطة/منخفضة |
| case-studies/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 30% | 83% | 80% | متوسطة/منخفضة |
| consultation/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 33% | 83% | 100% | مرتفعة |
| contact/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 45% | 83% | 100% | مرتفعة |
| data-analysis/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 47% | 92% | 90% | مرتفعة |
| demo/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| demo/ocr-demo/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 53% | 88% | 90% | متوسطة/منخفضة |
| demo/pricing/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| demo/resources/report-ai-saudi-2026/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| docs.html | 100% | 81% | 100% | 100% | 100% | 100% | 42% | 83% | 100% | متوسطة/منخفضة |
| docs/ai-agent-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| docs/ai-agent.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| docs/ai-bots-en.html | 100% | 71% | 100% | 100% | 100% | 100% | 48% | 83% | 100% | متوسطة/منخفضة |
| docs/ai-bots.html | 100% | 71% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| docs/consultation-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/consultation.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/contact-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/contact.html | 100% | 81% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/data-analysis-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/data-analysis.html | 100% | 53% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/faq-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/faq.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 90% | متوسطة/منخفضة |
| docs/openapi.html | 100% | 93% | 96% | 100% | 100% | 100% | 36% | 87% | 80% | متوسطة/منخفضة |
| docs/privacy-policy-en.html | 100% | 45% | 82% | 82% | 90% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/privacy-policy-en/index.html | 100% | 45% | 82% | 82% | 90% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/privacy-policy.html | 100% | 63% | 100% | 100% | 90% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/services-overview-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| docs/services-overview.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/smart-automation-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| docs/smart-automation.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-bi-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-bi.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-crm-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-crm.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-finance-en.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-finance.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-healthcare-en.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-healthcare.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 90% | متوسطة/منخفضة |
| docs/solutions-hr-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 90% | متوسطة/منخفضة |
| docs/solutions-hr.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-interview-en.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-interview.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 90% | متوسطة/منخفضة |
| docs/solutions-logistics-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| docs/solutions-logistics.html | 100% | 81% | 96% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| docs/solutions-ocr-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-ocr.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-retail-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-retail.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-supply-chain-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-supply-chain.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/terms-and-conditions-en.html | 100% | 45% | 78% | 90% | 90% | 100% | 39% | 83% | 80% | متوسطة/منخفضة |
| docs/terms-and-conditions.html | 100% | 63% | 100% | 100% | 90% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| en/about/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 42% | 83% | 90% | متوسطة/منخفضة |
| en/ai-agent/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 39% | 87% | 100% | متوسطة/منخفضة |
| en/ai-bots/BrightMath/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 54% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightProject/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightRecruiter/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightSales/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightSupport/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/index.html | 100% | 35% | 70% | 56% | 87% | 100% | 6% | 83% | 60% | متوسطة/منخفضة |
| en/ai-workflows/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| en/consultation/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 33% | 83% | 90% | متوسطة/منخفضة |
| en/contact/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 45% | 83% | 100% | متوسطة/منخفضة |
| en/data-analysis/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 47% | 92% | 100% | متوسطة/منخفضة |
| en/docs/docs.html | 96% | 81% | 100% | 100% | 100% | 93% | 42% | 83% | 100% | متوسطة/منخفضة |
| en/docs/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 42% | 83% | 100% | متوسطة/منخفضة |
| en/health/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| en/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 32% | 92% | 100% | متوسطة/منخفضة |
| en/interview/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 38% | 88% | 80% | متوسطة/منخفضة |
| en/privacy-cookies/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 27% | 83% | 90% | متوسطة/منخفضة |
| en/services/index.html | 100% | 35% | 74% | 58% | 90% | 100% | 6% | 83% | 70% | متوسطة/منخفضة |
| en/smart-automation/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 39% | 87% | 80% | متوسطة/منخفضة |
| en/smart-medical-archive/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 72% | 83% | 90% | متوسطة/منخفضة |
| en/tenders/compare.html | 100% | 93% | 96% | 100% | 100% | 100% | 18% | 87% | 80% | متوسطة/منخفضة |
| en/tenders/dashboard.html | 100% | 53% | 96% | 100% | 100% | 100% | 15% | 83% | 80% | متوسطة/منخفضة |
| en/tenders/index.html | 100% | 53% | 86% | 92% | 90% | 100% | 6% | 83% | 70% | متوسطة/منخفضة |
| en/tenders/landing.html | 100% | 81% | 100% | 100% | 100% | 100% | 12% | 83% | 90% | متوسطة/منخفضة |
| en/tenders/reports.html | 100% | 65% | 96% | 100% | 100% | 100% | 15% | 87% | 80% | متوسطة/منخفضة |
| en/tenders/settings.html | 100% | 65% | 96% | 100% | 100% | 100% | 15% | 87% | 80% | متوسطة/منخفضة |
| en/tenders/templates.html | 100% | 81% | 96% | 100% | 100% | 100% | 24% | 83% | 80% | متوسطة/منخفضة |
| en/terms/index.html | 100% | 53% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| en/tools/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 60% | 83% | 70% | متوسطة/منخفضة |
| error.html | 91% | 71% | 92% | 100% | 80% | 86% | 9% | 83% | 90% | متوسطة/منخفضة |
| health/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 100% | متوسطة/منخفضة |
| index.html | 100% | 93% | 100% | 100% | 100% | 100% | 56% | 92% | 100% | متوسطة/منخفضة |
| interview/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 38% | 88% | 80% | متوسطة/منخفضة |
| interview/pages/appointment/index.html | 96% | 81% | 100% | 100% | 80% | 93% | 48% | 83% | 90% | متوسطة/منخفضة |
| interview/pages/dashboard/index.html | 96% | 65% | 92% | 100% | 80% | 93% | 48% | 87% | 70% | متوسطة/منخفضة |
| interview/pages/support-ai/index.html | 96% | 81% | 96% | 100% | 80% | 93% | 45% | 83% | 80% | متوسطة/منخفضة |
| interview/pages/supportAI/index.html | 85% | 35% | 39% | 37% | 47% | 79% | 6% | 63% | 50% | مرتفعة |
| interview/pages/Visitor-registration/index.html | 96% | 35% | 70% | 67% | 80% | 93% | 54% | 83% | 70% | متوسطة/منخفضة |
| machine-learning/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 45% | 83% | 100% | مرتفعة |
| mais-OBM/index.html | 96% | 65% | 61% | 100% | 45% | 86% | 12% | 75% | 50% | متوسطة/منخفضة |
| partners/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 30% | 83% | 90% | متوسطة/منخفضة |
| privacy-cookies/index.html | 100% | 63% | 100% | 100% | 90% | 100% | 27% | 83% | 90% | متوسطة/منخفضة |
| sectors/ecommerce-en.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/ecommerce-en/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/ecommerce.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/energy-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| sectors/energy-en/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| sectors/energy.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| sectors/finance-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| sectors/finance-en/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| sectors/finance.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| sectors/healthcare-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| sectors/healthcare-en/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| sectors/healthcare.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| sectors/index.html | 100% | 45% | 74% | 59% | 90% | 100% | 24% | 83% | 70% | مرتفعة |
| sectors/logistics-en.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/logistics-en/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/logistics.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/manufacturing-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/manufacturing-en/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/manufacturing.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| services/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 38% | 88% | 90% | مرتفعة |
| sitemap/index.html | 100% | 71% | 94% | 100% | 90% | 100% | 6% | 83% | 90% | متوسطة/منخفضة |
| smart-automation/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 39% | 87% | 80% | مرتفعة |
| smart-medical-archive/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 72% | 83% | 90% | مرتفعة |
| tenders/compare.html | 100% | 93% | 100% | 100% | 100% | 100% | 18% | 87% | 90% | متوسطة/منخفضة |
| tenders/dashboard.html | 100% | 63% | 100% | 100% | 100% | 100% | 15% | 83% | 90% | متوسطة/منخفضة |
| tenders/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 30% | 87% | 100% | مرتفعة |
| tenders/landing.html | 100% | 81% | 100% | 100% | 100% | 100% | 12% | 83% | 100% | مرتفعة |
| tenders/reports.html | 100% | 75% | 100% | 100% | 100% | 100% | 15% | 87% | 90% | متوسطة/منخفضة |
| tenders/settings.html | 100% | 75% | 100% | 100% | 100% | 100% | 15% | 87% | 90% | متوسطة/منخفضة |
| tenders/templates.html | 100% | 81% | 100% | 100% | 100% | 100% | 18% | 83% | 90% | متوسطة/منخفضة |
| terms/index.html | 100% | 53% | 100% | 100% | 90% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| tools/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 60% | 83% | 80% | متوسطة/منخفضة |
| try/data-analyzer/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 54% | 83% | 70% | متوسطة/منخفضة |
| try/data-quality/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 70% | متوسطة/منخفضة |
| try/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| try/text-analysis/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 27% | 83% | 80% | متوسطة/منخفضة |
| what-is-ai/index.html | 100% | 63% | 96% | 100% | 100% | 100% | 39% | 83% | 70% | متوسطة/منخفضة |

## SEO Audit لكل صفحة

| الصفحة | المشكلة | الدليل من الكود | التأثير | الحل | الكود المقترح | الأولوية |
|---|---|---|---|---|---|---|
| blog/ai-automation-project-analysis.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/ai-automation-project-analysis/">أتمتة الذكاء الاصطناعي: حلول مخصصة لتحليل المشاريع وتحسين محركات البحث</` | Medium |
| blog/ai-manufacturing-digital-guide.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/ai-manufacturing-digital-guide/">الدليل الشامل لتطبيق الذكاء الاصطناعي في المصانع: خطة عملية للتحول الرقم` | Medium |
| blog/digital-transformation-automation.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/digital-transformation-automation/">التحول الرقمي وأتمتة العمليات: كيف يمكن للذكاء الاصطناعي أن يقود الاب` | Medium |
| blog/financial-hr-automation.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/%D8%A7%D9%84%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9-%D9%88%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D9%85%D9%88%D8%A7%D8%B1%D8%AF-%D8%A7%D9%84%D8%A8%D8%B4%D8%B1%D9%8A%D8%A9-%D8%AD%D9%84%D9%88%D9%84-%D9%85%D8%B3%D8%AA%D9%82%D8%A8%D9%84%D9%8A%D8%A9-%D9%84%D9%84%D8%B4%D8%B1%D9%83%D8%A7%D8%AA-%D8%A7%D9%84%D8%B0%D9%83%D9%8A%D8%A9/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/financial-hr-automation.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/financial-hr-automation/">الأتمتة المالية وأتمتة الموارد البشرية: حلول مستقبلية للشركات الذكية</a>` | Medium |
| blog/Generative-artificial-intelligence.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/Generative-artificial-intelligence/">الذكاء الاصطناعي التوليدي: ثورة في عالم الإبداع</a>` | Medium |
| blog/industrial-automation-productivity.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/%D8%A7%D9%84%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D8%B5%D9%86%D8%A7%D8%B9%D9%8A%D8%A9-%D9%88%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D9%85%D9%87%D8%A7%D9%85-%D8%A7%D9%84%D9%85%D8%AA%D9%83%D8%B1%D8%B1%D8%A9-%D9%83%D9%8A%D9%81%D9%8A%D8%A9-%D8%AA%D8%AD%D8%B3%D9%8A%D9%86-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D8%A1%D8%A9-%D8%A7%D9%84%D8%A5%D9%86%D8%AA%D8%A7%D8%AC%D9%8A%D8%A9/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/industrial-automation-productivity.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/industrial-automation-productivity/">الأتمتة الصناعية وأتمتة المهام المتكررة: كيفية تحسين الكفاءة الإنتاج` | Medium |
| blog/industrial-automation-repetitive-tasks.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/industrial-automation-repetitive-tasks/">الأتمتة الصناعية وأتمتة المهام المتكررة: كيفية تحسين الكفاءة الإ` | Medium |
| blog/machine-learning-computer-vision.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/machine-learning-computer-vision/">التعلم الآلي والرؤية الحاسوبية: مستقبل الذكاء الاصطناعي في معالجة اللغ` | Medium |
| blog/process-automation-ai-efficiency.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/process-automation-ai-efficiency/">أتمتة العمليات باستخدام الذكاء الاصطناعي: الطريق إلى تحسين الكفاءة الت` | Medium |
| blog/workplace-automation-guide.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/workplace-automation-guide/">الأتمتة في مكان العمل: كيف تبدأ؟</a>` | Medium |
| blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| bot/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/bot/">✦ Bright AI</a>` | Medium |
| docs/privacy-policy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=13 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/docs/privacy-policy-en/">Privacy Policy</a>` | Medium |
| en/ai-bots/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| en/docs/docs.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=1 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/docs/docs/">Bright AI Docs Hub</a>` | Medium |
| en/privacy-cookies/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/privacy-cookies/">سياسة الخصوصية</a>` | Medium |
| en/services/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=52% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| en/terms/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/terms/">الشروط والأحكام</a>` | Medium |
| interview/pages/supportAI/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/supportAI/">تم نقل الصفحة \| Bright AI</a>` | Medium |
| interview/pages/Visitor-registration/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/Visitor-registration/">نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي</a>` | Medium |
| mais-OBM/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/mais-OBM/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| mais-OBM/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/mais-OBM/">OBM Rejects Control Dashboard</a>` | Medium |
| sectors/ecommerce-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/ecommerce-en/">AI Solutions For Saudi E-Commerce In Saudi Arabia</a>` | Medium |
| sectors/energy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/energy-en/">AI Solutions For Saudi Energy In Saudi Arabia</a>` | Medium |
| sectors/finance-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/finance-en/">AI Solutions For Saudi Finance In Saudi Arabia</a>` | Medium |
| sectors/healthcare-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/healthcare-en/">Healthcare AI Solutions For Saudi Hospitals In Saudi Arabia</a>` | Medium |
| sectors/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/sectors/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| sectors/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=52% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| sectors/logistics-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/logistics-en/">AI Solutions For Saudi Logistics In Saudi Arabia</a>` | Medium |
| sectors/manufacturing-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/manufacturing-en/">AI Solutions For Saudi Manufacturing In Saudi Arabia</a>` | Medium |
| sitemap/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/sitemap/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/digital-transformation-automation.html, blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | Title مكرر | التحول الرقمي وأتمتة العمليات: كيف يمكن للذكاء الاصطناعي أن | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/financial-hr-automation.html, blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | Title مكرر | الأتمتة المالية وأتمتة الموارد البشرية: حلول مستقبلية | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/machine-learning-computer-vision.html, blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | Title مكرر | التعلم الآلي والرؤية الحاسوبية: مستقبل الذكاء الاصطناعي في | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/process-automation-ai-efficiency.html, blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | Title مكرر | أتمتة العمليات باستخدام الذكاء الاصطناعي: الطريق إلى تحسين | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| docs/privacy-policy-en.html, docs/privacy-policy-en/index.html | Title مكرر | Privacy Policy for Saudi Users \| Bright AI | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/digital-transformation-automation.html, blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | Meta description مكررة | اكتشف دور الذكاء الاصطناعي في قيادة التحول الرقمي وأتمتة العمليات في الشركات الحديثة | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| blog/financial-hr-automation.html, blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | Meta description مكررة | اكتشف كيف تسهم الأتمتة المالية وأتمتة الموارد البشرية في تحقيق التحول الرقمي للشركات. | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| blog/machine-learning-computer-vision.html, blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | Meta description مكررة | التعلم الآلي والرؤية الحاسوبية: مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور - مُشرقة AI الشركة السعودية الرائدة في ال | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| blog/process-automation-ai-efficiency.html, blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | Meta description مكررة | تعرف على كيفية تحسين الكفاءة التشغيلية من خلال أتمتة العمليات باستخدام الذكاء الاصطناعي | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| docs/privacy-policy-en.html, docs/privacy-policy-en/index.html | Meta description مكررة | Read how Bright AI collects, uses, protects, and manages data across public pages, inquiries, and service interactions for Saudi users. | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |

## اقتراحات Title / Meta / H1 للصفحات ذات الأولوية

| الصفحة | Title المقترح | Meta المقترحة | H1 المقترح | H2 المقترحة | H3 المقترحة | CTA المقترح |
|---|---|---|---|---|---|---|
| sectors/index.html | حلول ذكاء اصطناعي للقطاعات السعودية \| Bright AI | اكتشف حلول Bright AI للقطاعات السعودية، من المالية والصحة إلى اللوجستيات والصناعة والطاقة، مع AI Agent وأتمتة ذكية وتحليل بيانات لكل قطاع. | حلول الذكاء الاصطناعي حسب القطاع للشركات والمؤسسات في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| ai-bots/index.html | روبوتات ذكاء اصطناعي جاهزة للشركات السعودية \| Bright AI | روبوتات Bright AI الجاهزة للشركات السعودية تدعم المبيعات، التوظيف، الدعم، والتعليم مع تخصيص عربي وتكاملات وحوكمة بيانات. | روبوتات ذكاء اصطناعي جاهزة لفرقك التشغيلية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| interview/pages/supportAI/index.html | تم نقل الصفحة \| Bright AI | تساعد تم نقل الصفحة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب | تم نقل الصفحة \| Bright AI | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| ai-workflows/index.html | أتمتة سير العمل في السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق أتمتة سير العمل عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | أتمتة سير العمل في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| about/index.html | شركة ذكاء اصطناعي وطنية في الرياض \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق شركة ذكاء اصطناعي وطنية في الرياض عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | شركة ذكاء اصطناعي وطنية في الرياض | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| consultation/index.html | استشارات الذكاء الاصطناعي السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق استشارات الذكاء الاصطناعي السعودية عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | استشارات الذكاء الاصطناعي السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| contact/index.html | تواصل مع شركة ذكاء اصطناعي في السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق تواصل مع شركة ذكاء اصطناعي في السعودية عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | تواصل مع شركة ذكاء اصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| machine-learning/index.html | تطوير نماذج تعلم الآلة السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق تطوير نماذج تعلم الآلة السعودية عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | تطوير نماذج تعلم الآلة السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| smart-medical-archive/index.html | الأرشيف الطبي الذكي بالذكاء الاصطناعي في السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق الأرشيف الطبي الذكي بالذكاء الاصطناعي عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | الأرشيف الطبي الذكي بالذكاء الاصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| smart-automation/index.html | أتمتة العمليات بالذكاء الاصطناعي في السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق أتمتة العمليات بالذكاء الاصطناعي عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | أتمتة العمليات بالذكاء الاصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |

## Keyword Mapping

مصدر الكلمات: `reports/keywords strategy 2026.xlsx`، مع الاستفادة من `reports/intent-to-keyword-map.md` كمرجع قائم في المشروع عند وجوده.

| الكلمة المفتاحية | النية | الصفحة الأنسب | السبب | الأولوية | هل يوجد Cannibalization؟ | ملاحظات |
|---|---|---|---|---|---|---|
| بيانات حجم البحث - الكلمات المفتاحية الرئيسية | Informational + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| الكلمة المفتاحية | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| الذكاء الاصطناعي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | نعم: about/index.html, ai-agent/index.html, ai-bots/BrightMath/index.html, ai-bots/BrightProject/index.html | المصدر: حجم البحث - عام |
| ذكاء اصطناعي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | نعم: about/index.html, ai-agent/index.html, ai-bots/index.html, blog/top-ai-tools-saudi-2025.html | المصدر: حجم البحث - عام |
| علم البيانات | Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| تحليل البيانات | Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | نعم: about/index.html, ai-agent/index.html, ai-bots/BrightMath/index.html, ai-bots/BrightProject/index.html | المصدر: حجم البحث - عام |
| موقع الذكاء الاصطناعي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| تطبيقات الذكاء الاصطناعي | Mixed | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| ذكاء اصطناعي مجاني | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| اساسيات الذكاء الاصطناعي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| ما هو الذكاء الاصطناعي | Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| ما هي الأتمتة | Informational + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| automation معنى | Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| معنى الاتمتة | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| شركة اتمتة | Commercial | / | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| دورة تحليل بيانات | Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| بحث عن الذكاء الاصطناعي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| تعريف الذكاء الاصطناعي | Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| ذكاء اصطناعي (المصطلح الرئيسي) | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| الذكاء الاصطناعي بالعربي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: حجم البحث - عام |
| الكلمة المفتاحية المستهدفة | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| المجموعة الأولى: الذكاء الاصطناعي والتحول الرقمي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| استشارات الذكاء الاصطناعي السعودية | Commercial + Saudi local | /consultation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| التحول الرقمي رؤية 2030 | Commercial + Informational | /machine-learning/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| شركات الذكاء الاصطناعي في الرياض | Saudi local | / | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تطوير نماذج تعلم الآلة السعودية | Commercial + Informational + Saudi local | /machine-learning/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أتمتة التسويق بالذكاء الاصطناعي | Commercial + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| استراتيجية البيانات والذكاء الاصطناعي | Commercial + Informational + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| Saudi AI Adoption Framework | Informational + Saudi local | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| خدمات التحول الرقمي للشركات | Commercial + Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| المجموعة الثانية: حوكمة البيانات والامتثال المؤسسي | Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تحليل البيانات الضخمة السعودية | Commercial + Saudi local + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| حوكمة البيانات NDMO | Commercial + Informational + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| ذكاء الأعمال والتحليلات التنبؤية | Commercial + Informational + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الامتثال لنظام حماية البيانات PDPL | Commercial + Informational + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تأسيس مكتب إدارة البيانات | Commercial + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أدوات تحليل البيانات بالذكاء الاصطناعي | Commercial + Informational + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| Data Sovereignty Cloud Solutions KSA | Commercial + Saudi local + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| لوحات معلومات تفاعلية للشركات | Commercial + Informational | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| المجموعة الثالثة: المشتريات والمناقصات ومنصة اعتماد | B2G + Informational | /tenders/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| نظام تحليل المناقصات بالذكاء الاصطناعي | B2G + Commercial + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| منصة اعتماد للمنافسات الحكومية | B2G + Informational | /tenders/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تحليل العقود الذكية السعودية | Commercial + Saudi local + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أتمتة المشتريات للشركات | Commercial + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| Etimad Tender Translation AI | B2G + Commercial | /tenders/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| إعداد العروض الفنية والمالية | Commercial + Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| استكشاف مناقصات اعتماد بالذكاء الاصطناعي | B2G + Commercial + Informational | /tenders/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| إدارة مخاطر الموردين AI | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| المجموعة الرابعة: المعلوماتية الصحية والذكاء الاصطناعي السريري | Informational | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الأرشيف الطبي الذكي بالذكاء الاصطناعي | Commercial | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الذكاء الاصطناعي في التشخيص الطبي | Commercial + Informational | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| السجلات الصحية الإلكترونية السعودية EHR | Commercial + Saudi local | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| نظام معلومات المستشفيات HIS | Commercial + Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| التحول الرقمي في الرعاية الصحية | Informational | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تحليل البيانات الجينية AI | Commercial + Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أتمتة مواعيد المرضى | Commercial + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| المجموعة الخامسة: الأتمتة التشغيلية وسلاسل الإمداد | Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أتمتة العمليات الروبوتية RPA | Commercial + Informational + AI agents + Automation | /ai-agent/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الذكاء الاصطناعي في الخدمات اللوجستية | Commercial + Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تحسين سلاسل الإمداد AI | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الأتمتة الذكية للعمليات | Commercial + Informational + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أتمتة الفواتير والمشتريات | Commercial + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| دمج الأنظمة القديمة RPA | Informational + Automation | /smart-automation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| إدارة المخزون بالذكاء الاصطناعي | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| منصة توظيف بالذكاء الاصطناعي | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| نظام تتبع المتقدمين ATS السعودية | Commercial + Saudi local | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| فرز السير الذاتية بالذكاء الاصطناعي | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| التوظيف الذكي السعودية | Commercial + Informational + Saudi local | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| تقييم المقابلات بالذكاء الاصطناعي | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| AI Saudization Compliance Tools | Commercial + Saudi local | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الامتثال لمعايير NCA | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| ضوابط الأمن السيبراني الأساسية ECC | Commercial + Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| استشارات الأمن السيبراني السعودية | Commercial + Saudi local | /consultation/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| حماية البنية التحتية الحساسة | Commercial + Informational | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| أمن الحوسبة السحابية CCC | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| إدارة المخاطر السيبرانية بالذكاء الاصطناعي | Commercial | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: الكلمات المفتاحية الاستراتيجية |
| الذكاء الاصطناعي والتحول الرقمي | Mixed | /services/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: ملخص تنفيذي |
| حوكمة البيانات والامتثال المؤسسي | Data/Governance | /data-analysis/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: ملخص تنفيذي |
| المشتريات والمناقصات ومنصة اعتماد | B2G + Informational | /tenders/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | مرتفعة | لا واضح من الفحص الثابت | المصدر: ملخص تنفيذي |
| المعلوماتية الصحية والذكاء الاصطناعي السريري | Informational | /smart-medical-archive/ | توزيع حسب دلالة الكلمة وملف الاستراتيجية | متوسطة | لا واضح من الفحص الثابت | المصدر: ملخص تنفيذي |

### كلمات ليس لها صفحة مناسبة أو تحتاج صفحة جديدة

- `PDPL`, `NDMO`, `Data Sovereignty Cloud Solutions KSA`: تحتاج صفحة حوكمة بيانات وامتثال مستقلة بدل توزيعها على مقالات عامة.
- `Saudi AI Adoption Framework`: تحتاج صفحة مرجعية/استشارية تربط بين AI readiness والخدمات.
- `أتمتة الفواتير والمشتريات`: يمكن أن تكون صفحة خدمة فرعية تحت `/smart-automation/`.
- `تحليل المناقصات بالذكاء الاصطناعي`: يحتاج دعم أقوى من `/tenders/` و`/tenders/landing/`.

## AEO / GEO / AI Search Audit

| الصفحة | AI Search Readiness % | سبب النقص | التحسين المطلوب | نص جاهز للإضافة | Schema مناسب |
|---|---:|---|---|---|---|
| interview/pages/supportAI/index.html | 39% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد تم نقل الصفحة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| en/ai-bots/index.html | 70% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد AI bots ready for enterprise teams في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| interview/pages/Visitor-registration/index.html | 70% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| en/services/index.html | 74% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد AI delivery paths built for real operating teams. في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| sectors/index.html | 74% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد حلول الذكاء الاصطناعي حسب القطاع للشركات والمؤسسات في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/terms-and-conditions-en.html | 78% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد Terms & Conditions في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| bot/index.html | 80% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد ✦ Bright AI في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/privacy-policy-en.html | 82% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد Privacy Policy في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/privacy-policy-en/index.html | 82% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد Privacy Policy في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| mais-OBM/index.html | 61% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد OBM Rejects Control Dashboard في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| ai-bots/index.html | 86% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد روبوتات ذكاء اصطناعي جاهزة لفرقك التشغيلية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| en/tenders/index.html | 86% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد AI tender and contract analysis for Saudi procurement teams. في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/data-analysis-best-practices.html | 92% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد أفضل الممارسات لتحليل البيانات: تحويل البيانات إلى قرارات ذكية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/Generative-artificial-intelligence.html | 92% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد الذكاء الاصطناعي التوليدي: ثورة في عالم الإبداع في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/workplace-automation-guide.html | 92% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد الأتمتة في مكان العمل: كيف تبدأ؟ في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/analysy.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد أفضل الممارسات لتحليل البيانات: تحويل البيانات: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/auto.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد الأتمتة في مكان العمل: كيف تبدأ؟: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/big-data-analysis.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد تحليل البيانات الضخمة للأعمال: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/intelligent-data-analysis.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد دليل شامل لتحليل البيانات الذكي: تحويل المعلومات إلى قرارات: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/kfshrc-breast-cancer-ai.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد دراسة حالة: مستشفى الملك فيصل التخصصي - الذكاء الاصطناعي: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/process-automation.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد أتمتة العمليات: تحويل المهام الروتينية إلى عمليات مؤتمتة: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/smart-automation-benefits.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد فوائد الأتمتة الذكية للشركات: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/smart-inventory-management.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد إدارة المخزون الذكية بالذكاء الاصطناعي: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/تعلم-الآلة-و-الأعمال.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد تعلم الآلة: المفتاح لتحقيق النجاح في الأعمال الحديثة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/data-analysis.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد توثيق توثيق توثيق تحليل البيانات وذكاء الأعمال - وثائق Bright AI في Bright AI في Bright AI في Bright AI في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |

## Google AI Mode Citation Readiness

هل الموقع موثوق بما يكفي ليعيده Google AI Mode عندما يجمع الإجابة؟  
الإجابة: نعم جزئيًا. الموقع لديه قاعدة تقنية جيدة، sitemap واسع، محتوى سعودي واضح في عدد كبير من الصفحات، وschema في صفحات كثيرة. العائق الأكبر ليس الزحف بل قابلية الاقتباس: الصفحات التجارية تحتاج إجابات مباشرة، أدلة/Trust blocks، FAQ منتظمة، وجداول مقارنة مختصرة.

| الصفحة | Google AI Mode Citation Score % | هل تستحق الاقتباس؟ | لماذا؟ | ما الذي يمنعها؟ | الإصلاح المطلوب |
|---|---:|---|---|---|---|
| sectors/index.html | 52% | ليس بعد | لديها schema و292 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| ai-bots/index.html | 76% | نعم بعد تحسين بسيط | لديها schema و657 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| interview/pages/supportAI/index.html | 34% | ليس بعد | schema محدود و19 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| ai-workflows/index.html | 92% | نعم بعد تحسين بسيط | لديها schema و2318 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| about/index.html | 90% | نعم بعد تحسين بسيط | لديها schema و1540 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| consultation/index.html | 90% | نعم بعد تحسين بسيط | لديها schema و1314 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| contact/index.html | 90% | نعم بعد تحسين بسيط | لديها schema و1605 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| machine-learning/index.html | 90% | نعم بعد تحسين بسيط | لديها schema و1475 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| smart-medical-archive/index.html | 96% | نعم بعد تحسين بسيط | لديها schema و1947 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| smart-automation/index.html | 97% | نعم بعد تحسين بسيط | لديها schema و2631 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| en/ai-bots/index.html | 48% | ليس بعد | لديها schema و254 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| interview/pages/Visitor-registration/index.html | 48% | ليس بعد | لديها schema و380 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| en/services/index.html | 52% | ليس بعد | لديها schema و270 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| docs/terms-and-conditions-en.html | 65% | ليس بعد | لديها schema و663 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| bot/index.html | 68% | ليس بعد | schema محدود و829 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| docs/privacy-policy-en.html | 69% | ليس بعد | لديها schema و565 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| docs/privacy-policy-en/index.html | 69% | ليس بعد | لديها schema و565 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| mais-OBM/index.html | 69% | ليس بعد | schema محدود و5051 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |

## Deep Authoritative Content Plan

| الصفحة | مستوى العمق الحالي % | الأقسام الناقصة | الهيكل الجديد المقترح | أولوية التوسعة |
|---|---:|---|---|---|
| sectors/index.html | 59% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| ai-bots/index.html | 90% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| interview/pages/supportAI/index.html | 37% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | متوسطة |
| ai-workflows/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| about/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| consultation/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| contact/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| machine-learning/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح؛ FAQ | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| smart-medical-archive/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| smart-automation/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |

### نماذج محتوى جاهزة لأهم الصفحات

### sectors/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد حلول الذكاء الاصطناعي حسب القطاع للشركات والمؤسسات في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### ai-bots/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد روبوتات ذكاء اصطناعي جاهزة لفرقك التشغيلية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### interview/pages/supportAI/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد تم نقل الصفحة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### ai-workflows/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد أتمتة سير العمل في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### about/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد شركة ذكاء اصطناعي وطنية في الرياض في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### consultation/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد استشارات الذكاء الاصطناعي السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### contact/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد تواصل مع شركة ذكاء اصطناعي في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### machine-learning/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد تطوير نماذج تعلم الآلة السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.


## Trust & Authority Signals

| إشارة الثقة | موجودة؟ | النتيجة % | المشكلة | أين تضاف؟ | نص جاهز |
|---|---|---:|---|---|---|
| About page | نعم | 80% | تحتاج ربطًا أوضح بخبرة السعودية والحوكمة بدون أرقام مختلقة | `/about/` والـ footer | Bright AI شركة سعودية تركّز على حلول AI مؤسسية قابلة للتطبيق في بيئات B2B وB2G. |
| Contact page | نعم | 85% | تحتاج CTA متسقة من صفحات المال | `/contact/` وروابط CTA | تواصل مع فريق Bright AI لمراجعة حالة الاستخدام والبيانات المتاحة قبل اقتراح الحل. |
| Privacy / Terms | نعم | 85% | موجودة ويجب إبقاؤها في footer | footer | روابط الخصوصية والشروط متاحة للمراجعة قبل التواصل. |
| Saudi context | جزئي | 72% | غير متساوٍ بين صفحات الخدمات | صفحات الخدمات والقطاعات | يراعي التنفيذ متطلبات السوق السعودي واللغة العربية وسياق الجهات الحكومية والشركات. |
| Compliance notes | جزئي | 62% | NDMO/PDPL/SDAIA تظهر في بعض المحتوى ولا توجد ككتلة ثقة موحدة | صفحات Data/AI/Automation | لا يبدأ التنفيذ قبل تحديد حساسية البيانات ومتطلبات الحوكمة والامتثال. |
| Case studies | جزئي | 58% | بعض المقالات بصيغة دراسة حالة، لكن يجب فصل الحقيقي عن الافتراضي وعدم اختراع عملاء | `/case-studies/` وblog | أمثلة تطبيقية تعليمية توضح النمط التشغيلي دون الادعاء بأنها عميل فعلي ما لم توجد موافقة. |

Authority & Trust Score الحالي: 80%

## Technical SEO

| الصفحة | المشكلة | الدليل من الكود | التأثير | الحل | الكود المقترح | الأولوية |
|---|---|---|---|---|---|---|
| blog/ai-automation-project-analysis.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/ai-automation-project-analysis/">أتمتة الذكاء الاصطناعي: حلول مخصصة لتحليل المشاريع وتحسين محركات البحث</` | Medium |
| blog/ai-manufacturing-digital-guide.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/ai-manufacturing-digital-guide/">الدليل الشامل لتطبيق الذكاء الاصطناعي في المصانع: خطة عملية للتحول الرقم` | Medium |
| blog/digital-transformation-automation.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/digital-transformation-automation/">التحول الرقمي وأتمتة العمليات: كيف يمكن للذكاء الاصطناعي أن يقود الاب` | Medium |
| blog/financial-hr-automation.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/%D8%A7%D9%84%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9-%D9%88%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D9%85%D9%88%D8%A7%D8%B1%D8%AF-%D8%A7%D9%84%D8%A8%D8%B4%D8%B1%D9%8A%D8%A9-%D8%AD%D9%84%D9%88%D9%84-%D9%85%D8%B3%D8%AA%D9%82%D8%A8%D9%84%D9%8A%D8%A9-%D9%84%D9%84%D8%B4%D8%B1%D9%83%D8%A7%D8%AA-%D8%A7%D9%84%D8%B0%D9%83%D9%8A%D8%A9/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/financial-hr-automation.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/financial-hr-automation/">الأتمتة المالية وأتمتة الموارد البشرية: حلول مستقبلية للشركات الذكية</a>` | Medium |
| blog/Generative-artificial-intelligence.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/Generative-artificial-intelligence/">الذكاء الاصطناعي التوليدي: ثورة في عالم الإبداع</a>` | Medium |
| blog/industrial-automation-productivity.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/%D8%A7%D9%84%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D8%B5%D9%86%D8%A7%D8%B9%D9%8A%D8%A9-%D9%88%D8%A3%D8%AA%D9%85%D8%AA%D8%A9-%D8%A7%D9%84%D9%85%D9%87%D8%A7%D9%85-%D8%A7%D9%84%D9%85%D8%AA%D9%83%D8%B1%D8%B1%D8%A9-%D9%83%D9%8A%D9%81%D9%8A%D8%A9-%D8%AA%D8%AD%D8%B3%D9%8A%D9%86-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D8%A1%D8%A9-%D8%A7%D9%84%D8%A5%D9%86%D8%AA%D8%A7%D8%AC%D9%8A%D8%A9/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/industrial-automation-productivity.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/industrial-automation-productivity/">الأتمتة الصناعية وأتمتة المهام المتكررة: كيفية تحسين الكفاءة الإنتاج` | Medium |
| blog/industrial-automation-repetitive-tasks.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/industrial-automation-repetitive-tasks/">الأتمتة الصناعية وأتمتة المهام المتكررة: كيفية تحسين الكفاءة الإ` | Medium |
| blog/machine-learning-computer-vision.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/machine-learning-computer-vision/">التعلم الآلي والرؤية الحاسوبية: مستقبل الذكاء الاصطناعي في معالجة اللغ` | Medium |
| blog/process-automation-ai-efficiency.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/process-automation-ai-efficiency/">أتمتة العمليات باستخدام الذكاء الاصطناعي: الطريق إلى تحسين الكفاءة الت` | Medium |
| blog/workplace-automation-guide.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/workplace-automation-guide/">الأتمتة في مكان العمل: كيف تبدأ؟</a>` | Medium |
| blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| bot/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/bot/">✦ Bright AI</a>` | Medium |
| docs/privacy-policy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=13 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/docs/privacy-policy-en/">Privacy Policy</a>` | Medium |
| en/ai-bots/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| en/docs/docs.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=1 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/docs/docs/">Bright AI Docs Hub</a>` | Medium |
| en/privacy-cookies/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/privacy-cookies/">سياسة الخصوصية</a>` | Medium |
| en/services/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=52% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| en/terms/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/terms/">الشروط والأحكام</a>` | Medium |
| interview/pages/supportAI/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/supportAI/">تم نقل الصفحة \| Bright AI</a>` | Medium |
| interview/pages/Visitor-registration/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/Visitor-registration/">نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي</a>` | Medium |
| mais-OBM/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/mais-OBM/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| mais-OBM/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/mais-OBM/">OBM Rejects Control Dashboard</a>` | Medium |
| sectors/ecommerce-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/ecommerce-en/">AI Solutions For Saudi E-Commerce In Saudi Arabia</a>` | Medium |
| sectors/energy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/energy-en/">AI Solutions For Saudi Energy In Saudi Arabia</a>` | Medium |
| sectors/finance-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/finance-en/">AI Solutions For Saudi Finance In Saudi Arabia</a>` | Medium |
| sectors/healthcare-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/healthcare-en/">Healthcare AI Solutions For Saudi Hospitals In Saudi Arabia</a>` | Medium |
| sectors/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/sectors/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| sectors/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=52% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| sectors/logistics-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/logistics-en/">AI Solutions For Saudi Logistics In Saudi Arabia</a>` | Medium |
| sectors/manufacturing-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/manufacturing-en/">AI Solutions For Saudi Manufacturing In Saudi Arabia</a>` | Medium |
| sitemap/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/sitemap/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| blog/digital-transformation-automation.html, blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | Title مكرر | التحول الرقمي وأتمتة العمليات: كيف يمكن للذكاء الاصطناعي أن | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/financial-hr-automation.html, blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | Title مكرر | الأتمتة المالية وأتمتة الموارد البشرية: حلول مستقبلية | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/machine-learning-computer-vision.html, blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | Title مكرر | التعلم الآلي والرؤية الحاسوبية: مستقبل الذكاء الاصطناعي في | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/process-automation-ai-efficiency.html, blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | Title مكرر | أتمتة العمليات باستخدام الذكاء الاصطناعي: الطريق إلى تحسين | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| docs/privacy-policy-en.html, docs/privacy-policy-en/index.html | Title مكرر | Privacy Policy for Saudi Users \| Bright AI | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |
| blog/digital-transformation-automation.html, blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html | Meta description مكررة | اكتشف دور الذكاء الاصطناعي في قيادة التحول الرقمي وأتمتة العمليات في الشركات الحديثة | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| blog/financial-hr-automation.html, blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html | Meta description مكررة | اكتشف كيف تسهم الأتمتة المالية وأتمتة الموارد البشرية في تحقيق التحول الرقمي للشركات. | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| blog/machine-learning-computer-vision.html, blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html | Meta description مكررة | التعلم الآلي والرؤية الحاسوبية: مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور - مُشرقة AI الشركة السعودية الرائدة في ال | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| blog/process-automation-ai-efficiency.html, blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html | Meta description مكررة | تعرف على كيفية تحسين الكفاءة التشغيلية من خلال أتمتة العمليات باستخدام الذكاء الاصطناعي | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |
| docs/privacy-policy-en.html, docs/privacy-policy-en/index.html | Meta description مكررة | Read how Bright AI collects, uses, protects, and manages data across public pages, inquiries, and service interactions for Saudi users. | يضعف تمييز الصفحات في نتائج البحث. | كتابة وصف فريد لكل صفحة حسب intent. | `<meta name="description" content="...">` | Medium |

## Structured Data

الحالة الحالية: تم رصد أنواع JSON-LD متعددة، وتشمل حسب الصفحات: WebPage, Organization, LocalBusiness, BreadcrumbList, Service, LocalBusiness,ProfessionalService, SoftwareApplication, CollectionPage, Article, MedicalWebPage, BlogPosting, Blog, ItemList, MedicalScholarlyArticle, ContactPage, Report, TechArticle, LegalDocument, MedicalOrganization,LocalBusiness, WebSite, Industry.

### Schema مقترح للصفحات المهمة

- الصفحة الرئيسية: `Organization` + `WebSite` + `WebPage`.
- صفحات الخدمات: `Service` + `WebPage` + `BreadcrumbList`.
- صفحات المقالات: `Article` + `BreadcrumbList`.
- صفحات المناقصات/demo العامة: `SoftwareApplication` أو `WebApplication` فقط إذا كان المنتج قابلًا للتجربة فعلاً، مع `WebPage`.
- صفحات About/Contact: `AboutPage`, `ContactPage`.
- FAQ: فقط عندما يوجد FAQ مرئي في الصفحة، ولا تضف تقييمات أو Reviews.

## Performance / Speed

حجم CSS الكلي: 768.7KB  
حجم JS/MJS الكلي: 1765.0KB  
حجم الصور الكلي: 0.87MB  

Performance Score الحالي تقديريًا: 56%  
Mobile Performance Score: 52%  
Desktop Performance Score: 59%  
Target Score بعد الإصلاح: 90%+

| المشكلة | Mobile Impact | Desktop Impact | الصفحات المتأثرة | الحل | الكود المقترح | الأولوية |
|---|---|---|---|---|---|---|
| صور بدون أبعاد ثابتة | CLS محتمل | CLS أقل لكنه قائم |  | إضافة width/height أو aspect-ratio | `<img src="..." width="800" height="450" loading="lazy" alt="...">` | High |
| تعدد ملفات JS/CSS | TBT/INP محتمل | تأثير أقل | صفحات تستخدم 117 JS و28 CSS في المشروع | defer للسكربتات غير الحرجة والحفاظ على critical CSS | `<script src="/frontend/js/page-enhancements.min.js" defer></script>` | Medium |
| صور أكبر من 200KB | LCP/FCP | LCP | لا توجد ضمن العينة | WebP/AVIF وضغط الحجم | `<picture><source srcset="hero.avif" type="image/avif"><img ...></picture>` | Medium |
| لا يوجد Lighthouse مباشر في هذا التدقيق | قياس تقديري فقط | قياس تقديري فقط | كل الصفحات | تشغيل Lighthouse بعد النشر/محليًا | `npm run performance:budget` + Lighthouse | Medium |

## Mobile/Desktop UX

Mobile UX Score: 82%  
Desktop UX Score: 87%  
Overall UI/UX Score: 83%

| الجهاز | الصفحة | المشكلة | التأثير | الحل | كود CSS/HTML مقترح |
|---|---|---|---|---|---|
| Mobile/Desktop | sectors/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | ai-bots/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | interview/pages/supportAI/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | ai-workflows/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | about/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | consultation/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | contact/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | machine-learning/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | smart-medical-archive/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | smart-automation/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |

## UI/UX Design Audit

| الصفحة | مشكلة UI/UX | التأثير | الحل | الكود أو التصميم المقترح | الأولوية |
|---|---|---|---|---|---|
| sectors/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| ai-bots/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| interview/pages/supportAI/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | Medium |
| ai-workflows/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| about/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| consultation/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| contact/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| machine-learning/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| smart-medical-archive/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| smart-automation/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |

### Design System مختصر

- Colors: الحفاظ على لوحة Bright AI الحالية، مع accent ثابت لروابط CTA وحالات focus.
- Typography: أحجام ثابتة غير مرتبطة بـ viewport، line-height مريح للعربية، بلا letter-spacing سالب.
- Buttons: ارتفاع لا يقل عن 48px، نص واضح، icon عند الأوامر.
- Cards: radius حتى 8px، لا بطاقات داخل بطاقات.
- Sections: تباعد `clamp(48px, 7vw, 96px)`.
- Forms: labels واضحة، focus visible، رسائل خطأ مقروءة.
- Tables: overflow أفقي على الجوال.
- Breakpoints: 480 / 768 / 1024 / 1280.
- Shadows: خفيفة للمكونات فقط، لا تحويل الأقسام إلى cards.

## Internal Linking Plan

| من الصفحة | إلى الصفحة | Anchor Text المقترح | نوع الرابط | سبب الربط | الأولوية |
|---|---|---|---|---|---|
| / | /services/ | خدمات الذكاء الاصطناعي للمؤسسات | Navigation/Contextual | توجيه النية التجارية العامة | High |
| /services/ | /ai-agent/ | وكلاء ذكاء اصطناعي للمؤسسات | Contextual | دعم صفحة المال لوكلاء AI | High |
| /services/ | /data-analysis/ | تحليل البيانات وذكاء الأعمال | Contextual | توزيع نية data analytics | High |
| /smart-automation/ | /blog/process-automation/ | دليل أتمتة العمليات | Supporting content | دعم topical depth | Medium |
| /data-analysis/ | /blog/business-intelligence-saudi/ | ذكاء الأعمال في السعودية | Supporting content | ربط المقال بالخدمة | Medium |
| /tenders/ | /tenders/landing/ | تحليل المناقصات بالذكاء الاصطناعي | Product flow | دعم B2G conversion | High |
| /about/ | /contact/ | تواصل مع Bright AI | Conversion | تحويل الثقة إلى إجراء | Medium |

## Accessibility

| المشكلة | الصفحة | التأثير | الحل | الكود المقترح |
|---|---|---|---|---|
| صور بلا alt أو أبعاد في بعض الصفحات |  | قارئات الشاشة وCLS | إضافة alt وصفي وwidth/height | `<img alt="..." width="..." height="...">` |
| الحاجة إلى focus واضح | CSS عام | Keyboard navigation | توحيد `:focus-visible` | `:focus-visible{outline:3px solid var(--ba-focus);outline-offset:3px}` |
| الجداول على الجوال | صفحات بها tables | overflow | wrapper responsive | `.responsive-table{overflow-x:auto}` |
| تقليل الحركة | CSS عام | Motion sensitivity | prefers-reduced-motion | راجع كود CSS أدناه |

Accessibility Score الحالي: 92%

## Conversion Optimization

| الصفحة | نية الزائر | CTA الحالي | CTA المقترح | مكان CTA | نص الزر | النص الداعم |
|---|---|---|---|---|---|---|
| sectors/index.html | Sector landing intent | احجز جلسة تشخيص | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| ai-bots/index.html | AI agents intent | التواصل، طلب استشارة ذكاء اصطناعي، اطلب استشارة، احجز عرض توضيحي | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| interview/pages/supportAI/index.html | Commercial investigation intent | غير واضح من النص | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| ai-workflows/index.html | Automation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| about/index.html | Commercial investigation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| consultation/index.html | Conversion intent | احجز استشارة، تواصل معنا، احجز استشارة مجانية، ابدأ نموذج الحجز | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| contact/index.html | Conversion intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| machine-learning/index.html | Commercial investigation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| smart-medical-archive/index.html | Healthcare AI intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| smart-automation/index.html | Automation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |

## أسباب ضعف الفهرسة والزيارات

| السبب | الدليل من الملفات | الصفحات المتأثرة | التأثير | الحل | الأولوية |
|---|---|---|---|---|---|
| بقايا قواعد noindex/Disallow | فحص `robots.txt` و`_headers` و`render.yaml` | صفحات النماذج التجريبية | منع ظهور النماذج للعملاء والزواحف | إبقاء صفحات التجارب `index, follow` وإزالة `X-Robots-Tag` | Critical |
| قابلية الاقتباس غير متسقة | صفحات بلا Answer Block | صفحات خدمات وقطاعات | ضعف AI Mode | إضافة answer/FAQ/table | High |
| تكرار بعض metadata | تحليل titles/metas | صفحات متعددة | Cannibalization/CTR | تخصيص العناوين | Medium |
| عمق بعض صفحات demo/tools | Content Depth منخفض | demo/try/interview وبعض tenders | زيارات أقل وتحويل أضعف | تحديد index/noindex أو توسيع demo العام | Medium |
| Trust blocks غير موحدة | trustSignals متفاوتة | صفحات المال | ثقة أقل قبل CTA | إضافة proof/compliance notes | High |

## Content Pruning

| الصفحة | القرار | السبب | الإجراء | Redirect إن وجد | الأولوية |
|---|---|---|---|---|---|
| 404.html | تحسين | Depth 49% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/ai-automation-project-analysis.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/ai-manufacturing-digital-guide.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/digital-transformation-automation.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/financial-hr-automation.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/Generative-artificial-intelligence.html | تحسين | شبه يتيمة؛ Depth 77% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/industrial-automation-productivity.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/industrial-automation-repetitive-tasks.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/machine-learning-computer-vision.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/process-automation-ai-efficiency.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/workplace-automation-guide.html | تحسين | شبه يتيمة؛ Depth 84% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| bot/index.html | مراجعة index/noindex | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/ocr-demo/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/pricing/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/resources/report-ai-saudi-2026/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| docs/privacy-policy-en.html | تحسين | شبه يتيمة؛ Depth 82% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| en/docs/docs.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| en/privacy-cookies/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| en/terms/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/appointment/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/dashboard/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/support-ai/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/supportAI/index.html | مراجعة index/noindex | شبه يتيمة؛ Depth 37% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/Visitor-registration/index.html | مراجعة index/noindex | شبه يتيمة؛ Depth 67% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| mais-OBM/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/ecommerce-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/energy-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/finance-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/healthcare-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/logistics-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/manufacturing-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/data-analyzer/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/data-quality/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/text-analysis/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |

## Topical Authority Plan

| Cluster | الصفحة الأساسية | الصفحات الداعمة الحالية | صفحات جديدة مقترحة | الكلمات المفتاحية | روابط داخلية مقترحة |
|---|---|---|---|---|---|
| الذكاء الاصطناعي للمؤسسات | `/services/` | `/blog/ai-guide-saudi-business/`, `/blog/vision-2030-ai-opportunities/` | `/enterprise-ai-saudi/` | استشارات الذكاء الاصطناعي السعودية، شركة ذكاء اصطناعي في السعودية | من homepage والخدمات إلى المقالات ثم CTA |
| وكلاء الذكاء الاصطناعي | `/ai-agent/` | `/blog/ai-agent/`, `/blog/building-ai-agents-guide/` | `/ai-agent/governance/` | وكلاء ذكاء اصطناعي للمؤسسات | من bots إلى ai-agent والعكس |
| أتمتة الأعمال | `/smart-automation/` | `/blog/process-automation/`, `/blog/smart-automation-benefits/` | `/rpa-saudi/` | أتمتة العمليات الروبوتية RPA | من services وblog إلى smart-automation |
| تحليل البيانات | `/data-analysis/` | `/blog/business-intelligence-saudi/`, `/blog/data-analytics/power-bi-saudi-guide/` | `/data-governance-saudi/` | تحليل البيانات الضخمة السعودية، NDMO | من data-analysis إلى governance |
| المناقصات والقطاع الحكومي | `/tenders/` | `/tenders/landing/`, `/tenders/reports/` | `/government-ai-procurement/` | تحليل المناقصات بالذكاء الاصطناعي، B2G | من homepage/footer إلى tenders |
| الحوكمة والامتثال | `/data-analysis/` | `/blog/nca-ai-compliance-saudi/`, `/blog/nca-compliance/` | `/ai-governance-pdpl-ndmo/` | PDPL، NDMO، حوكمة البيانات | روابط من data/services/blog |

### صفحات جديدة مقترحة

| URL | Title | Meta | H1 | Search intent | Target keywords | Outline | Internal links |
|---|---|---|---|---|---|---|---|
| /enterprise-ai-saudi/ | الذكاء الاصطناعي للمؤسسات في السعودية | دليل عملي لتطبيق AI مؤسسي في السعودية مع الحوكمة والبيانات وخارطة التنفيذ. | الذكاء الاصطناعي للمؤسسات في السعودية | Commercial/Informational | استشارات الذكاء الاصطناعي السعودية | تعريف، حالات استخدام، جاهزية، حوكمة، تنفيذ، FAQ | /services/, /consultation/ |
| /ai-governance-pdpl-ndmo/ | حوكمة الذكاء الاصطناعي والبيانات في السعودية | كيف تربط الشركات AI بمتطلبات PDPL وNDMO دون تعطيل التنفيذ. | حوكمة AI وامتثال البيانات | B2B/B2G | PDPL, NDMO, حوكمة البيانات | المخاطر، المتطلبات، إطار العمل، FAQ | /data-analysis/, /services/ |
| /rpa-saudi/ | أتمتة العمليات RPA في السعودية | متى تستخدم RPA ومتى تحتاج أتمتة ذكية مدعومة بالذكاء الاصطناعي. | أتمتة العمليات RPA في السعودية | Commercial | أتمتة العمليات الروبوتية RPA | تعريف، حالات استخدام، مقارنة، تنفيذ، CTA | /smart-automation/ |
| /government-ai-procurement/ | الذكاء الاصطناعي للمشتريات والمناقصات الحكومية | تحسين قراءة وتحليل وثائق المناقصات مع سياق B2G سعودي. | AI للمشتريات والمناقصات الحكومية | B2G | تحليل المناقصات بالذكاء الاصطناعي | المشكلة، workflow، المخاطر، dashboard، CTA | /tenders/ |

## أكواد جاهزة للتطبيق

```html
<!-- File: robots.txt -->
<!-- Add under internal folders block, while keeping Allow: /frontend/js/ and /frontend/css/ above it: -->
# لا توجد قواعد Disallow لصفحات الموقع أو نماذج العملاء التجريبية.
```
```html
<!-- File: sectors/index.html -->
<!-- Replace or verify inside <head>: -->
<title>حلول ذكاء اصطناعي للقطاعات السعودية \| Bright AI</title>
<meta name="description" content="اكتشف حلول Bright AI للقطاعات السعودية، من المالية والصحة إلى اللوجستيات والصناعة والطاقة، مع AI Agent وأتمتة ذكية وتحليل بيانات لكل قطاع.">
<link rel="canonical" href="https://brightai.site/sectors/">
<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/sectors/">
<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebPage", "url": "https://brightai.site/sectors/", "name": "حلول ذكاء اصطناعي للقطاعات السعودية \| Bright AI", "description": "اكتشف حلول Bright AI للقطاعات السعودية، من المالية والصحة إلى اللوجستيات والصناعة والطاقة، مع AI Agent وأتمتة ذكية وتحليل بيانات لكل قطاع.", "inLanguage": "ar-SA" }</script>
```
```html
<!-- File: sectors/index.html -->
<section class="answer-block" aria-labelledby="answer-title">
  <h2 id="answer-title">إجابة مختصرة قابلة للاقتباس</h2>
  <p>تساعد حلول الذكاء الاصطناعي حسب القطاع للشركات والمؤسسات في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.</p>
</section>
```
```html
<nav class="site-nav" aria-label="التنقل الرئيسي">
  <a href="/services/">الخدمات</a>
  <a href="/ai-agent/">وكلاء الذكاء الاصطناعي</a>
  <a href="/data-analysis/">تحليل البيانات</a>
  <a href="/smart-automation/">الأتمتة الذكية</a>
  <a href="/tenders/">المناقصات</a>
  <a href="/consultation/" class="nav-cta">احجز استشارة</a>
</nav>
```
```css
/* File: frontend/css/main.bundle.css */
/* Add or fold into the existing design system without changing identity */
:root{--ba-radius:8px;--ba-focus:#00d4ff;--ba-section:clamp(48px,7vw,96px);}
.answer-block{border-inline-start:4px solid var(--ba-focus);padding:20px 24px;margin-block:24px;background:rgba(0,212,255,.06);border-radius:var(--ba-radius);}
.section-cta{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-block-start:24px;}
.section-cta a{min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:var(--ba-radius);}
@media (max-width: 768px){.answer-block{padding:16px;margin-block:18px}.responsive-table{display:block;overflow-x:auto}.site-nav{gap:10px}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
```
```html
<picture>
  <source srcset="/assets/images/example.avif" type="image/avif">
  <source srcset="/assets/images/example.webp" type="image/webp">
  <img src="/assets/images/example.png" width="960" height="540" loading="lazy" decoding="async" alt="واجهة تحليل بيانات مؤسسية من Bright AI">
</picture>
```

## خطة التنفيذ

| المرحلة | المهمة | التأثير المتوقع | الصعوبة | الملفات المتأثرة | الأولوية |
|---|---|---|---|---|---|
| أول 24 ساعة | إصلاح robots.txt وإعادة `seo:check` | إغلاق الفشل التقني الوحيد الحالي | منخفضة | robots.txt | Critical |
| أول 24 ساعة | مراجعة الصفحات العاجلة وإضافة Answer Block | رفع AI Mode citation | متوسطة | صفحات top 10 | High |
| أول 24 ساعة | تخصيص duplicated titles/metas المؤثرة | تحسين CTR وتقليل cannibalization | متوسطة | HTML متعدد | High |
| أول أسبوع | Breadcrumbs وFAQ للصفحات التجارية | تحسين AEO/schema/internal linking | متوسطة | services/ai/data/tenders | High |
| أول أسبوع | تحسين روابط contextual من المقالات للخدمات | نقل authority إلى صفحات المال | متوسطة | blog + service pages | High |
| أول شهر | بناء صفحات authority الجديدة | رفع topical authority السعودي | عالية | صفحات جديدة + sitemap | High |
| أول شهر | تحسين الصور وأبعادها | تقليل CLS/LCP risk | متوسطة | HTML/images/CSS | Medium |
| 90 يوم | خطة نشر محتوى clusters ومراقبة GSC | نمو AI Search وorganic | عالية | blog/services/reports | High |

## Prompts التنفيذ النهائية

1. راقب بقاء `robots.txt` بدون `Disallow` لصفحات الموقع، ثم شغّل `npm run seo:check` و`npm run internal-links:audit`.
2. نفّذ AEO/GEO للصفحات العشر العاجلة من جدول الأولوية.
3. وسّع محتوى صفحات الخدمات حسب Deep Authoritative Content Plan.
4. نفّذ تحسينات الأداء الآمنة للصور والسكربتات دون تغيير التصميم.
5. راجع قبل/بعد بالنسب نفسها في هذا التقرير.

## Definition of Done

- [ ] كل صفحة لها Title فريد.
- [ ] كل صفحة لها Meta Description فريد.
- [ ] كل صفحة لها H1 واحد.
- [ ] كل صفحة مهمة موجودة في sitemap.
- [ ] لا توجد صفحات يتيمة مهمة.
- [ ] لا توجد broken internal links.
- [ ] كل صفحة لها canonical صحيح.
- [ ] كل صفحة لها lang/hreflang صحيح.
- [ ] كل صفحة مهمة لها Schema مناسب.
- [ ] كل صورة مهمة لها alt و width و height.
- [ ] كل صفحة مهمة فيها CTA واضح.
- [ ] كل صفحة خدمة فيها FAQ.
- [ ] كل صفحة مهمة فيها Answer Block مناسب لـ AI Search.
- [ ] Mobile UX محسّن.
- [ ] Desktop UX محسّن.
- [ ] Performance risks منخفضة.
- [ ] Trust signals واضحة.
- [ ] Internal linking محسّن.
- [ ] لا يوجد keyword cannibalization خطير.
