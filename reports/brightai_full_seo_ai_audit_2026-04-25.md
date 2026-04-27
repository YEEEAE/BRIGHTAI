# تقرير تدقيق وتحسين Bright AI الشامل

تاريخ الفحص: 2026-04-25  
النطاق: `/Users/yzydalshmry/Desktop/BRIGHTAI`  
مصادر الدليل: كل ملفات HTML داخل المشروع، `robots.txt`, `sitemap.xml`, ملفات CSS/JS/images، وملف `reports/keywords strategy 2026.xlsx`.  
تنبيه قياس: هذه النسبة تقديرية مبنية على فحص الملفات الثابتة وليست قياس Lighthouse مباشر. تم تشغيل `npm run performance:budget` ونجح، لكن لم يتم تشغيل Lighthouse مباشر.

## Executive Summary

- عدد ملفات HTML المفحوصة: 252
- عدد ملفات CSS: 37
- عدد ملفات JS/MJS: 135
- عدد الصور: 25
- عدد روابط sitemap: 234
- نتيجة `npm run seo:check`: ناجح وفق سياسة فتح صفحات الموقع والنماذج التجريبية.
- نتيجة `npm run internal-links:audit`: 0 أعطال داخلية.
- نتيجة `npm run performance:budget`: ناجح.

Overall Site Health Score الحالي: 91%  
SEO Readiness Score: 99%  
AI Search Readiness Score: 89%  
Google AI Mode Citation Score: 91%  
Technical Reliability Score: 87%  
Mobile/Desktop Experience Score: 72%  
Authority & Trust Score: 79%

## النسب المئوية الحالية للموقع

| المحور | الوزن | النتيجة الحالية % | النتيجة المستهدفة % | مستوى الخطورة | السبب المختصر |
|---|---:|---:|---:|---|---|
| Technical SEO | 15% | 100% | 90%+ | منخفض | البنية قوية وrobots.txt لا يحظر صفحات الموقع أو نماذج العملاء. |
| On-Page SEO | 15% | 100% | 90%+ | منخفض | العناوين والوصف وH1 موجودة غالبًا، مع تكرارات تحتاج تخصيص. |
| Content Depth | 12% | 97% | 90%+ | منخفض | صفحات كثيرة غنية، لكن بعض صفحات الخدمة/demo تحتاج عمقًا موجّهًا. |
| AEO Readiness | 10% | 79% | 90%+ | متوسط | FAQ والجداول ليست منتظمة في كل الصفحات التجارية. |
| GEO / AI Search Readiness | 12% | 96% | 90%+ | منخفض | llms وschema موجودة جزئيًا، لكن Answer Blocks والثقة غير متسقة. |
| Google AI Mode Citation Readiness | 10% | 91% | 90%+ | منخفض | الاقتباس يحتاج جمل تعريفية مباشرة وأدلة أكثر. |
| Internal Linking | 8% | 98% | 90%+ | منخفض | تدقيق الروابط صفر أعطال، لكن بعض الصفحات تحتاج روابط سياقية أقوى. |
| Page Speed / Performance | 8% | 62% | 90%+ | مرتفع | ميزانية الأداء ناجحة، مع مخاطر صور/أبعاد وموارد متعددة من الفحص الثابت. |
| Mobile UX | 5% | 82% | 90%+ | متوسط | لا يوجد Lighthouse مباشر؛ التقدير من البنية وCTA والجداول والصور. |
| Trust & Authority Signals | 5% | 79% | 90%+ | متوسط | About/Contact/Privacy موجودة، لكن الأدلة والامتثال تحتاج توحيدًا في الصفحات المال. |

## أهم 10 مشاكل حرجة

| الصفحة | سبب الأولوية | النتيجة الضعيفة | الأثر التجاري | إجراء أول |
|---|---|---:|---|---|
| services/index.html | Data analytics intent | AI Mode 92% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| ai-bots/index.html | AI agents intent | AI Mode 97% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| smart-medical-archive/index.html | Healthcare AI intent | AI Mode 96% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| ai-workflows/index.html | Automation intent | AI Mode 97% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| smart-automation/index.html | Automation intent | AI Mode 97% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| sectors/index.html | Sector landing intent | AI Mode 100% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| consultation/index.html | Conversion intent | AI Mode 100% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| contact/index.html | Conversion intent | AI Mode 100% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| machine-learning/index.html | Commercial investigation intent | AI Mode 100% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |
| tenders/landing.html | B2G / tenders intent | AI Mode 100% / Depth 100% | مرتفع | تعزيز FAQ/schema والروابط |

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
| index.html | 0 | 901 | لا | نعم | لا إجراء عاجل |
| services/index.html | 1 | 999 | لا | نعم | لا إجراء عاجل |
| ai-bots/index.html | 1 | 7 | لا | نعم | لا إجراء عاجل |
| smart-medical-archive/index.html | 1 | 392 | لا | نعم | لا إجراء عاجل |
| ai-workflows/index.html | 1 | 22 | لا | نعم | لا إجراء عاجل |
| smart-automation/index.html | 1 | 647 | لا | نعم | لا إجراء عاجل |
| sectors/index.html | 1 | 30 | لا | نعم | لا إجراء عاجل |
| consultation/index.html | 1 | 462 | لا | نعم | لا إجراء عاجل |
| contact/index.html | 1 | 836 | لا | نعم | لا إجراء عاجل |
| tenders/landing.html | 1 | 312 | لا | نعم | لا إجراء عاجل |
| data-analysis/index.html | 1 | 571 | لا | نعم | لا إجراء عاجل |
| about/index.html | 1 | 372 | لا | نعم | لا إجراء عاجل |
| ai-agent/index.html | 1 | 437 | لا | نعم | لا إجراء عاجل |
| tenders/index.html | 1 | 39 | لا | نعم | لا إجراء عاجل |
| blog/building-ai-agents-guide/index.html | 1 | 13 | لا | لا | لا إجراء عاجل |
| blog/machine-learning-computer-vision/index.html | 1 | 13 | لا | لا | لا إجراء عاجل |
| blog/top-ai-tools-saudi-2025/index.html | 1 | 16 | لا | لا | لا إجراء عاجل |
| case-studies/index.html | 1 | 171 | لا | لا | لا إجراء عاجل |
| sitemap/index.html | 1 | 7 | لا | لا | لا إجراء عاجل |
| blog/chatgpt-vs-claude-vs-gemini-arabic/index.html | 1 | 18 | لا | لا | لا إجراء عاجل |
| blog/vision-2030-ai-opportunities/index.html | 1 | 30 | لا | لا | لا إجراء عاجل |
| demo/pricing/index.html | 1 | 30 | لا | لا | لا إجراء عاجل |
| try/index.html | 1 | 191 | لا | لا | لا إجراء عاجل |
| blog/kpi-dashboard-guide/index.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| docs/terms-and-conditions.html | 1 | 22 | لا | لا | لا إجراء عاجل |
| partners/index.html | 1 | 10 | لا | لا | لا إجراء عاجل |
| privacy-cookies/index.html | 1 | 32 | لا | لا | لا إجراء عاجل |
| ai-scolecs/index.html | 1 | 339 | لا | لا | لا إجراء عاجل |
| docs/services-overview.html | 1 | 31 | لا | لا | لا إجراء عاجل |
| docs/solutions-healthcare-en.html | 1 | 8 | لا | لا | لا إجراء عاجل |
| docs/ai-bots.html | 1 | 131 | لا | لا | لا إجراء عاجل |
| sectors/healthcare.html | 1 | 97 | لا | لا | لا إجراء عاجل |
| try/text-analysis/index.html | 1 | 4 | لا | لا | لا إجراء عاجل |
| interview/index.html | 1 | 319 | لا | لا | لا إجراء عاجل |
| sectors/energy.html | 1 | 12 | لا | لا | لا إجراء عاجل |
| sectors/finance.html | 1 | 106 | لا | لا | لا إجراء عاجل |
| try/data-analyzer/index.html | 1 | 21 | لا | لا | لا إجراء عاجل |
| try/data-quality/index.html | 1 | 6 | لا | لا | لا إجراء عاجل |
| blog/ai-innovation-saudi-arabia/index.html | 1 | 9 | لا | لا | لا إجراء عاجل |
| blog/hr-automation-saudi/index.html | 1 | 16 | لا | لا | لا إجراء عاجل |
| blog/power-bi-saudi-guide/index.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| blog/claude-opus-4-6-saudi-market/index.html | 1 | 7 | لا | لا | لا إجراء عاجل |
| blog/index.html | 1 | 704 | لا | لا | لا إجراء عاجل |
| docs/contact.html | 1 | 14 | لا | لا | لا إجراء عاجل |
| docs/openapi.html | 1 | 22 | لا | لا | لا إجراء عاجل |
| sectors/manufacturing.html | 1 | 21 | لا | لا | لا إجراء عاجل |
| blog/ai-marketing-guide/index.html | 1 | 7 | لا | لا | لا إجراء عاجل |
| blog/government-ai-solutions/index.html | 1 | 7 | لا | لا | لا إجراء عاجل |
| sectors/ecommerce.html | 1 | 20 | لا | لا | لا إجراء عاجل |
| sectors/logistics.html | 1 | 91 | لا | لا | لا إجراء عاجل |
| docs.html | 1 | 491 | لا | لا | لا إجراء عاجل |
| health/index.html | 1 | 305 | لا | لا | لا إجراء عاجل |
| blog/business-intelligence-saudi/index.html | 1 | 25 | لا | لا | لا إجراء عاجل |
| tenders/compare.html | 1 | 28 | لا | لا | لا إجراء عاجل |
| en/index.html | 1 | 8 | لا | لا | لا إجراء عاجل |
| machine-learning/index.html | 2 | 8 | لا | نعم | لا إجراء عاجل |
| services/ai-scolecs/index.html | 2 | 25 | لا | لا | لا إجراء عاجل |
| services/brightproject/index.html | 2 | 27 | لا | لا | لا إجراء عاجل |
| services/smart-hospital-management/index.html | 2 | 29 | لا | لا | لا إجراء عاجل |
| services/brightsales/index.html | 2 | 29 | لا | لا | لا إجراء عاجل |
| services/ai-tenders-analysis/index.html | 2 | 29 | لا | لا | لا إجراء عاجل |
| docs/terms-and-conditions-en.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/data-analysis-best-practices/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| docs/privacy-policy-en/index.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| blog/workplace-automation-guide/index.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| blog/machine-learning-business/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| interview/pages/dashboard/index.html | 2 | 3 | لا | لا | لا إجراء عاجل |
| blog/big-data-analysis/index.html | 2 | 11 | لا | لا | لا إجراء عاجل |
| blog/ai-automation-project-analysis/index.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/smart-automation-benefits/index.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/kfshrc-breast-cancer-ai/index.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/data-analysis.html | 2 | 52 | لا | لا | لا إجراء عاجل |
| what-is-ai/index.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/intelligent-data-analysis/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/process-automation/index.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| docs/data-analysis-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-ocr-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/consultation-en.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| en/ai-bots/index.html | 2 | 1 | لا | لا | لا إجراء عاجل |
| blog/smart-inventory-management/index.html | 2 | 28 | لا | لا | لا إجراء عاجل |
| blog/digital-transformation-automation/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/ai-guide-saudi-business/index.html | 2 | 18 | لا | لا | لا إجراء عاجل |
| blog/ai-implementation-cost-guide/index.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| blog/financial-hr-automation/index.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/industrial-automation-productivity/index.html | 2 | 20 | لا | لا | لا إجراء عاجل |
| blog/industrial-automation-repetitive-tasks/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/ai-finance-saudi/index.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| blog/riyadh-municipality-ai-license/index.html | 2 | 3 | لا | لا | لا إجراء عاجل |
| docs/solutions-bi-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| docs/solutions-crm-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| docs/solutions-retail-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-supply-chain-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| terms/index.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/choose-ai-company-saudi/index.html | 2 | 18 | لا | لا | لا إجراء عاجل |
| blog/ai-energy-saudi/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/hr-automation-case-study/index.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-renewable-energy-ai/index.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/saudi-smart-city-traffic/index.html | 2 | 3 | لا | لا | لا إجراء عاجل |
| blog/saudi-waste-management-ai/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| interview/pages/support-ai/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/ai-business-performance/index.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/future-of-intelligent-data-analysis-finance-sector/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/smart-crm-system/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| demo/index.html | 2 | 80 | لا | لا | لا إجراء عاجل |
| docs/solutions-logistics-en.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| en/services/index.html | 2 | 34 | لا | لا | لا إجراء عاجل |
| blog/ai-manufacturing-digital-guide/index.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| demo/resources/report-ai-saudi-2026/index.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/privacy-policy.html | 2 | 11 | لا | لا | لا إجراء عاجل |
| en/about/index.html | 2 | 63 | لا | لا | لا إجراء عاجل |
| en/consultation/index.html | 2 | 27 | لا | لا | لا إجراء عاجل |
| tenders/dashboard.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| docs/consultation.html | 2 | 19 | لا | لا | لا إجراء عاجل |
| docs/smart-automation.html | 2 | 41 | لا | لا | لا إجراء عاجل |
| docs/solutions-bi.html | 2 | 17 | لا | لا | لا إجراء عاجل |
| docs/solutions-crm.html | 2 | 26 | لا | لا | لا إجراء عاجل |
| docs/solutions-finance-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/solutions-finance.html | 2 | 23 | لا | لا | لا إجراء عاجل |
| docs/solutions-hr.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/solutions-interview-en.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| docs/solutions-ocr.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| docs/solutions-retail.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| docs/solutions-supply-chain.html | 2 | 34 | لا | لا | لا إجراء عاجل |
| blog/smart-document-processing/index.html | 2 | 11 | لا | لا | لا إجراء عاجل |
| demo/ocr-demo/index.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightMath/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightProject/index.html | 2 | 7 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightRecruiter/index.html | 2 | 11 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightSales/index.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| ai-bots/BrightSupport/index.html | 2 | 24 | لا | لا | لا إجراء عاجل |
| blog/commerce-ministry-chatbot/index.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/private-hospital-scheduling-optimization/index.html | 2 | 18 | لا | لا | لا إجراء عاجل |
| blog/saudi-agritech-smart-farming/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/saudi-bank-fraud-detection/index.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| blog/saudi-dates-quality-ai/index.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| blog/saudi-edtech-personalized-learning/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/saudi-energy-predictive-maintenance/index.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| blog/saudi-factory-ai-productivity/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/saudi-hospitality-dynamic-pricing/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/saudi-insurance-claims-ai/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/saudi-manufacturing-predictive-maintenance/index.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-mining-ai-exploration/index.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/saudi-petrochemical-ai-safety/index.html | 2 | 17 | لا | لا | لا إجراء عاجل |
| blog/saudi-real-estate-ai-valuation/index.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| blog/saudi-sports-analytics-ai/index.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| interview/pages/appointment/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| sectors/healthcare-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| tools/index.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| docs/solutions-logistics.html | 2 | 25 | لا | لا | لا إجراء عاجل |
| en/interview/index.html | 2 | 46 | لا | لا | لا إجراء عاجل |
| sectors/energy-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| sectors/finance-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| blog/ai-agents-business-guide/index.html | 2 | 18 | لا | لا | لا إجراء عاجل |
| blog/ai-data-analysis-tools/index.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| blog/ai-generative-content-industry-saudi-arabia/index.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| blog/ai-transformation/index.html | 2 | 18 | لا | لا | لا إجراء عاجل |
| blog/business-intelligence-data-analysis/index.html | 2 | 7 | لا | لا | لا إجراء عاجل |
| blog/case-study-saudi-companies-ai-agents-customer-service/index.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| blog/generative-artificial-intelligence/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/process-automation-ai-efficiency/index.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| blog/transport-logistics-solutions/index.html | 2 | 20 | لا | لا | لا إجراء عاجل |
| services/ai-consulting.html | 2 | 25 | لا | لا | لا إجراء عاجل |
| services/approvals-automation.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| services/competitor-analysis-agent.html | 2 | 28 | لا | لا | لا إجراء عاجل |
| services/custom-ai-agent.html | 2 | 41 | لا | لا | لا إجراء عاجل |
| services/customer-service-automation.html | 2 | 32 | لا | لا | لا إجراء عاجل |
| services/data-analyst-agent.html | 2 | 35 | لا | لا | لا إجراء عاجل |
| services/data-platform.html | 2 | 45 | لا | لا | لا إجراء عاجل |
| services/document-automation.html | 2 | 41 | لا | لا | لا إجراء عاجل |
| services/health-data-analysis.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| services/hr-automation.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| services/lead-hunter.html | 2 | 33 | لا | لا | لا إجراء عاجل |
| services/marketing-agent.html | 2 | 37 | لا | لا | لا إجراء عاجل |
| services/marketing-automation.html | 2 | 33 | لا | لا | لا إجراء عاجل |
| services/medical-archive.html | 2 | 29 | لا | لا | لا إجراء عاجل |
| services/operational-reports-automation.html | 2 | 41 | لا | لا | لا إجراء عاجل |
| services/seo-agent.html | 2 | 35 | لا | لا | لا إجراء عاجل |
| services/smart-hiring-system.html | 2 | 27 | لا | لا | لا إجراء عاجل |
| services/social-data-analysis.html | 2 | 27 | لا | لا | لا إجراء عاجل |
| services/supply-chain-optimization.html | 2 | 26 | لا | لا | لا إجراء عاجل |
| blog/ai-healthcare-saudi/index.html | 2 | 23 | لا | لا | لا إجراء عاجل |
| tenders/reports.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| tenders/settings.html | 2 | 13 | لا | لا | لا إجراء عاجل |
| blog/ksu-adaptive-learning/index.html | 2 | 5 | لا | لا | لا إجراء عاجل |
| blog/nca-ai-compliance-saudi/index.html | 2 | 16 | لا | لا | لا إجراء عاجل |
| blog/saudi-ecommerce-ai-growth/index.html | 2 | 17 | لا | لا | لا إجراء عاجل |
| blog/saudi-logistics-route-optimization/index.html | 2 | 22 | لا | لا | لا إجراء عاجل |
| blog/saudi-tourism-ai-guide/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| docs/ai-bots-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/contact-en.html | 2 | 6 | لا | لا | لا إجراء عاجل |
| docs/faq-en.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/faq.html | 2 | 12 | لا | لا | لا إجراء عاجل |
| docs/services-overview-en.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/smart-automation-en.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| docs/solutions-healthcare.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| docs/solutions-hr-en.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| docs/solutions-interview.html | 2 | 14 | لا | لا | لا إجراء عاجل |
| en/ai-workflows/index.html | 2 | 10 | لا | لا | لا إجراء عاجل |
| en/health/index.html | 2 | 42 | لا | لا | لا إجراء عاجل |
| en/smart-medical-archive/index.html | 2 | 50 | لا | لا | لا إجراء عاجل |
| en/tenders/landing.html | 2 | 55 | لا | لا | لا إجراء عاجل |
| tenders/templates.html | 2 | 25 | لا | لا | لا إجراء عاجل |
| docs/ai-agent-en.html | 2 | 8 | لا | لا | لا إجراء عاجل |
| docs/ai-agent.html | 2 | 30 | لا | لا | لا إجراء عاجل |
| en/smart-automation/index.html | 2 | 64 | لا | لا | لا إجراء عاجل |
| en/tenders/compare.html | 2 | 23 | لا | لا | لا إجراء عاجل |
| sectors/manufacturing-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| blog/data-analysis-decision-making/index.html | 2 | 9 | لا | لا | لا إجراء عاجل |
| blog/digital-health-smart-archive/index.html | 2 | 34 | لا | لا | لا إجراء عاجل |
| sectors/ecommerce-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| sectors/logistics-en/index.html | 2 | 4 | لا | لا | لا إجراء عاجل |
| en/docs/index.html | 2 | 51 | لا | لا | لا إجراء عاجل |
| blog/digital-banking-saudi/index.html | 2 | 21 | لا | لا | لا إجراء عاجل |
| blog/government-ai-solutions-saudi/index.html | 2 | 1 | لا | لا | لا إجراء عاجل |
| blog/nca-compliance/index.html | 2 | 15 | لا | لا | لا إجراء عاجل |
| en/ai-agent/index.html | 2 | 56 | لا | لا | لا إجراء عاجل |
| en/data-analysis/index.html | 2 | 67 | لا | لا | لا إجراء عاجل |
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
| bot/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| interview/pages/Visitor-registration/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| 404.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| 500.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| mais-OBM/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| docs/privacy-policy-en.html | غير قابل من الصفحة الرئيسية | 13 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| en/terms/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| blog/building-ai-agents-practical-guide/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| en/privacy-cookies/index.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/healthcare-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/energy-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/finance-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| services/ai-scolecs.html | غير قابل من الصفحة الرئيسية | 25 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| services/brightproject.html | غير قابل من الصفحة الرئيسية | 27 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| services/brightsales.html | غير قابل من الصفحة الرئيسية | 29 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| services/smart-hospital-management.html | غير قابل من الصفحة الرئيسية | 29 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| error.html | غير قابل من الصفحة الرئيسية | 0 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| en/docs/docs.html | غير قابل من الصفحة الرئيسية | 1 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/manufacturing-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/ecommerce-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| sectors/logistics-en.html | غير قابل من الصفحة الرئيسية | 4 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |
| services/ai-tenders-analysis.html | غير قابل من الصفحة الرئيسية | 29 | نعم | لا | ربط من navigation أو صفحة cluster مناسبة |

## ملفات CSS / JS / الصور

### ملفات CSS

| الملف | الحجم KB | ملاحظة |
|---|---:|---|
| assets/css/demo-experience.css | 9.8 | غير مصغّر أو مصدر |
| assets/css/design-tokens.css | 7.5 | غير مصغّر أو مصدر |
| assets/css/extracted-inline-styles.css | 19.9 | غير مصغّر أو مصدر |
| assets/css/text-ratio-fix.min.css | 2.3 | مصغّر |
| assets/css/ux-audit-fixes.css | 9.0 | غير مصغّر أو مصدر |
| frontend/css/ai-scolecs-inline.min.css | 2.4 | مصغّر |
| frontend/css/bundle-critical.css | 19.6 | غير مصغّر أو مصدر |
| frontend/css/bundle-pages.css | 48.6 | غير مصغّر أو مصدر |
| frontend/css/cyber-wave.css | 0.7 | غير مصغّر أو مصدر |
| frontend/css/demo-experience.css | 16.2 | غير مصغّر أو مصدر |
| frontend/css/demo-theme.min.css | 11.3 | مصغّر |
| frontend/css/docs.css | 7.4 | غير مصغّر أو مصدر |
| frontend/css/en-interview-inline.min.css | 20.4 | مصغّر |
| frontend/css/en-tenders-templates-inline.min.css | 14.5 | مصغّر |
| frontend/css/fonts.css | 0.2 | غير مصغّر أو مصدر |
| frontend/css/health-demo.css | 10.1 | غير مصغّر أو مصدر |
| frontend/css/index-critical-overrides.css | 27.2 | غير مصغّر أو مصدر |
| frontend/css/index-critical-overrides.min.css | 19.6 | مصغّر |
| frontend/css/index-theme.css | 38.8 | غير مصغّر أو مصدر |
| frontend/css/index-theme.min.css | 38.2 | مصغّر |
| frontend/css/interview-inline.min.css | 17.7 | مصغّر |
| frontend/css/main.bundle.css | 179.5 | غير مصغّر أو مصدر |
| frontend/css/main.bundle.min.css | 44.5 | مصغّر |
| frontend/css/ocr-demo-theme.min.css | 10.7 | مصغّر |
| frontend/css/product-demo-polish.css | 6.2 | غير مصغّر أو مصدر |
| frontend/css/product-demo-polish.min.css | 5.1 | مصغّر |
| frontend/css/tailwind-input.css | 0.6 | غير مصغّر أو مصدر |
| frontend/css/tailwind.local.min.css | 179.5 | مصغّر |
| frontend/css/tenders-index-inline.min.css | 37.6 | مصغّر |
| frontend/css/try-data-analyzer-inline.css | 9.1 | غير مصغّر أو مصدر |
| frontend/css/try-data-quality-inline.css | 13.2 | غير مصغّر أو مصدر |
| frontend/css/try-inline.css | 6.7 | غير مصغّر أو مصدر |
| frontend/css/try-text-analysis-inline.css | 4.9 | غير مصغّر أو مصدر |
| frontend/css/unified-nav-search.css | 14.7 | غير مصغّر أو مصدر |
| frontend/css/vendor/aos.css | 25.1 | غير مصغّر أو مصدر |
| frontend/css/vendor/swiper-bundle.min.css | 5.4 | مصغّر |
| smart-medical-archive/system-unified.css | 26.1 | غير مصغّر أو مصدر |

### ملفات JS

| الملف | الحجم KB | ملاحظة |
|---|---:|---|
| assets/js/demo-experience-loader.js | 1.0 | مصدر أو سكربت تشغيل |
| assets/js/gemini-demo-engine.js | 7.1 | مصدر أو سكربت تشغيل |
| assets/js/live-demo-apps.js | 27.2 | مصدر أو سكربت تشغيل |
| backend/blog-slug-redirects.e2e.test.js | 4.7 | مصدر أو سكربت تشغيل |
| backend/config/index.js | 4.7 | مصدر أو سكربت تشغيل |
| backend/groq-stream.functional.test.js | 11.6 | مصدر أو سكربت تشغيل |
| backend/middleware/rateLimiter.js | 7.1 | مصدر أو سكربت تشغيل |
| backend/rag-search.functional.test.js | 1.9 | مصدر أو سكربت تشغيل |
| backend/routes/aiGateway.js | 5.0 | مصدر أو سكربت تشغيل |
| backend/routes/analytics.js | 5.0 | مصدر أو سكربت تشغيل |
| backend/routes/chat.js | 12.2 | مصدر أو سكربت تشغيل |
| backend/routes/gemini.js | 17.4 | مصدر أو سكربت تشغيل |
| backend/routes/groq.js | 54.2 | مصدر أو سكربت تشغيل |
| backend/routes/medical.js | 3.3 | مصدر أو سكربت تشغيل |
| backend/routes/search.js | 3.4 | مصدر أو سكربت تشغيل |
| backend/routes/summary.js | 3.9 | مصدر أو سكربت تشغيل |
| backend/server.js | 31.2 | مصدر أو سكربت تشغيل |
| backend/services/aiGateway.js | 21.9 | مصدر أو سكربت تشغيل |
| backend/services/openaiCompatProvider.js | 4.3 | مصدر أو سكربت تشغيل |
| backend/services/ragSearch.js | 22.0 | مصدر أو سكربت تشغيل |
| backend/static-seo-headers.e2e.test.js | 4.9 | مصدر أو سكربت تشغيل |
| backend/stream-routes.e2e.test.js | 4.0 | مصدر أو سكربت تشغيل |
| backend/utils/cache.js | 4.2 | مصدر أو سكربت تشغيل |
| backend/utils/errorHandler.js | 7.8 | مصدر أو سكربت تشغيل |
| backend/utils/sanitizer.js | 4.5 | مصدر أو سكربت تشغيل |
| backend/utils/sessionStore.js | 2.6 | مصدر أو سكربت تشغيل |
| backend/vitest.config.mjs | 0.3 | مصدر أو سكربت تشغيل |
| blog/check-canonical.js | 0.5 | مصدر أو سكربت تشغيل |
| frontend/js/accessibility.js | 11.7 | مصدر أو سكربت تشغيل |
| frontend/js/accessibility.min.js | 7.0 | حزمة/مصغّر |
| frontend/js/ai-scolecs-app.min.js | 32.8 | حزمة/مصغّر |
| frontend/js/analytics-events.js | 8.1 | مصدر أو سكربت تشغيل |
| frontend/js/api-gateway.min.js | 4.3 | حزمة/مصغّر |
| frontend/js/api-preflight.min.js | 0.6 | حزمة/مصغّر |
| frontend/js/article-ux-enhancements.js | 30.6 | مصدر أو سكربت تشغيل |
| frontend/js/article-ux-enhancements.min.js | 30.6 | حزمة/مصغّر |
| frontend/js/chat-widget.js | 2.7 | مصدر أو سكربت تشغيل |
| frontend/js/chatbot-production.bundle.js | 33.9 | حزمة/مصغّر |
| frontend/js/clarity-events.js | 0.6 | مصدر أو سكربت تشغيل |
| frontend/js/data-analyzer.min.js | 4.9 | حزمة/مصغّر |
| frontend/js/demo-experience.js | 38.5 | مصدر أو سكربت تشغيل |
| frontend/js/demo-stream.min.js | 5.4 | حزمة/مصغّر |
| frontend/js/docs-scripts.js | 1.3 | مصدر أو سكربت تشغيل |
| frontend/js/en-interview-app.min.js | 40.6 | حزمة/مصغّر |
| frontend/js/en-tenders-templates-app.min.js | 18.1 | حزمة/مصغّر |
| frontend/js/gemini-direct-client.js | 6.5 | مصدر أو سكربت تشغيل |
| frontend/js/groq-client.js | 9.7 | مصدر أو سكربت تشغيل |
| frontend/js/health-demo.js | 24.7 | مصدر أو سكربت تشغيل |
| frontend/js/iconify-preload.js | 174.4 | مصدر أو سكربت تشغيل |
| frontend/js/index-theme.js | 36.3 | مصدر أو سكربت تشغيل |
| frontend/js/index-theme.min.js | 36.7 | حزمة/مصغّر |
| frontend/js/interview-app.js | 49.9 | مصدر أو سكربت تشغيل |
| frontend/js/interview-app.min.js | 62.5 | حزمة/مصغّر |
| frontend/js/main.bundle.js | 24.5 | حزمة/مصغّر |
| frontend/js/main.bundle.min.js | 24.5 | حزمة/مصغّر |
| frontend/js/navigation.js | 23.4 | مصدر أو سكربت تشغيل |
| frontend/js/navigation.min.js | 23.3 | حزمة/مصغّر |
| frontend/js/ocr-demo.js | 18.4 | مصدر أو سكربت تشغيل |
| frontend/js/ocr-demo.min.js | 12.5 | حزمة/مصغّر |
| frontend/js/optimization.js | 2.0 | مصدر أو سكربت تشغيل |
| frontend/js/page-enhancements.js | 27.6 | مصدر أو سكربت تشغيل |
| frontend/js/page-enhancements.min.js | 27.5 | حزمة/مصغّر |
| frontend/js/performance-loader.js | 7.4 | مصدر أو سكربت تشغيل |
| frontend/js/performance-loader.min.js | 4.1 | حزمة/مصغّر |
| frontend/js/pricing-recommender.min.js | 5.4 | حزمة/مصغّر |
| frontend/js/product-demo-enhancements.js | 4.4 | مصدر أو سكربت تشغيل |
| frontend/js/product-demo-enhancements.min.js | 2.6 | حزمة/مصغّر |
| frontend/js/runtime-config.min.js | 2.8 | حزمة/مصغّر |
| frontend/js/schema-loader.js | 2.5 | مصدر أو سكربت تشغيل |
| frontend/js/search 2.js | 20.5 | مصدر أو سكربت تشغيل |
| frontend/js/search.js | 22.9 | مصدر أو سكربت تشغيل |
| frontend/js/search.min.js | 17.4 | حزمة/مصغّر |
| frontend/js/sentry-init.js | 1.0 | مصدر أو سكربت تشغيل |
| frontend/js/tenders-index-app.min.js | 37.4 | حزمة/مصغّر |
| frontend/js/tovik-loader.js | 0.9 | مصدر أو سكربت تشغيل |
| frontend/js/tovik-loader.min.js | 0.5 | حزمة/مصغّر |
| frontend/js/try-data-analyzer-app.js | 29.5 | مصدر أو سكربت تشغيل |
| frontend/js/try-data-quality-app.js | 9.0 | مصدر أو سكربت تشغيل |
| frontend/js/try-text-analysis-app.js | 8.8 | مصدر أو سكربت تشغيل |
| frontend/js/vendor/aos.js | 14.1 | مصدر أو سكربت تشغيل |
| frontend/js/vendor/iconify-icon.min.js | 21.3 | حزمة/مصغّر |
| frontend/js/vendor/iconify.min.js | 22.3 | حزمة/مصغّر |
| frontend/js/vendor/swiper-bundle.min.js | 150.9 | حزمة/مصغّر |
| frontend/scripts/dev-server.mjs | 2.7 | مصدر أو سكربت تشغيل |
| frontend/tests/smoke.test.mjs | 1.9 | مصدر أو سكربت تشغيل |
| scripts/analytics-qa.mjs | 5.5 | مصدر أو سكربت تشغيل |
| scripts/apply-full-audit-seo-fixes.mjs | 12.3 | مصدر أو سكربت تشغيل |
| scripts/apply-seo-intent-headings.mjs | 45.2 | مصدر أو سكربت تشغيل |
| scripts/check-api-base-consistency.mjs | 4.5 | مصدر أو سكربت تشغيل |
| scripts/check-performance-budget.js | 2.5 | مصدر أو سكربت تشغيل |
| scripts/create-en-pages.mjs | 15.6 | مصدر أو سكربت تشغيل |
| scripts/fix-internal-links.mjs | 6.2 | مصدر أو سكربت تشغيل |
| scripts/fix-resource-paths.mjs | 1.5 | مصدر أو سكربت تشغيل |
| scripts/generate-brightai-full-audit-report.mjs | 71.8 | مصدر أو سكربت تشغيل |
| scripts/generate-related-articles.mjs | 6.6 | مصدر أو سكربت تشغيل |
| scripts/generate-service-product-pages.mjs | 208.8 | مصدر أو سكربت تشغيل |
| scripts/generate-sitemap-all-pages.mjs | 14.3 | مصدر أو سكربت تشغيل |
| scripts/high-confidence-sitemap-config.mjs | 3.8 | مصدر أو سكربت تشغيل |
| scripts/html-seo-governor.mjs | 27.4 | مصدر أو سكربت تشغيل |
| scripts/indexnow-submit.mjs | 1.9 | مصدر أو سكربت تشغيل |
| scripts/internal-links-audit.mjs | 1.2 | مصدر أو سكربت تشغيل |
| scripts/internal-links-common.mjs | 34.4 | مصدر أو سكربت تشغيل |
| scripts/local-secrets.mjs | 6.1 | مصدر أو سكربت تشغيل |
| scripts/minify-seo-assets.mjs | 2.1 | مصدر أو سكربت تشغيل |
| scripts/ping-search-engines.mjs | 2.6 | مصدر أو سكربت تشغيل |
| scripts/replace-unminified-refs.mjs | 7.3 | مصدر أو سكربت تشغيل |
| scripts/resource-paths-audit.mjs | 1.0 | مصدر أو سكربت تشغيل |
| scripts/resource-paths-common.mjs | 25.9 | مصدر أو سكربت تشغيل |
| scripts/run-monorepo-tests.mjs | 3.5 | مصدر أو سكربت تشغيل |
| scripts/seo-ci-check.mjs | 20.4 | مصدر أو سكربت تشغيل |
| scripts/seo-health-check.mjs | 18.5 | مصدر أو سكربت تشغيل |
| scripts/seo-indexability-qa.mjs | 7.1 | مصدر أو سكربت تشغيل |
| scripts/seo-intent-headings-qa.mjs | 9.7 | مصدر أو سكربت تشغيل |
| scripts/seo-url-map.mjs | 11.5 | مصدر أو سكربت تشغيل |
| scripts/sitemap-audit-utils.mjs | 5.7 | مصدر أو سكربت تشغيل |
| scripts/smoke-test-api.mjs | 7.0 | مصدر أو سكربت تشغيل |
| scripts/smoke-test.js | 17.7 | مصدر أو سكربت تشغيل |
| scripts/submit-indexnow.mjs | 6.3 | مصدر أو سكربت تشغيل |
| scripts/validate-production.js | 11.3 | مصدر أو سكربت تشغيل |
| scripts/verify-all.mjs | 7.5 | مصدر أو سكربت تشغيل |
| scripts/verify-clarity.mjs | 0.8 | مصدر أو سكربت تشغيل |
| smart-medical-archive/medical-dashboard.js | 54.2 | مصدر أو سكربت تشغيل |
| smart-medical-archive/medical-extraction.js | 6.7 | مصدر أو سكربت تشغيل |
| smart-medical-archive/medical-gemini-client.js | 37.2 | مصدر أو سكربت تشغيل |
| smart-medical-archive/medical-search.js | 30.2 | مصدر أو سكربت تشغيل |
| smart-medical-archive/medical-upload.js | 17.8 | مصدر أو سكربت تشغيل |
| smart-medical-archive/smart-ai-logic.js | 4.4 | مصدر أو سكربت تشغيل |
| smart-medical-archive/system-unified.js | 0.1 | مصدر أو سكربت تشغيل |
| sw.js | 4.1 | مصدر أو سكربت تشغيل |
| tenders/api-config.js | 9.2 | مصدر أو سكربت تشغيل |
| tenders/api-config.min.js | 5.6 | حزمة/مصغّر |
| tenders/render-backend/server 2.js | 2.4 | مصدر أو سكربت تشغيل |
| tenders/render-backend/server.js | 0.2 | مصدر أو سكربت تشغيل |
| tests/aiGateway.test.js | 10.7 | مصدر أو سكربت تشغيل |
| vitest.config.js | 0.3 | مصدر أو سكربت تشغيل |

### الصور

| الملف | الحجم KB | النوع | ملاحظة أداء |
|---|---:|---|---|
| assets/3d-icons/customer-robots-0.avif | 80.4 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/customer-robots-0.webp | 67.4 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/digital-twins-simulation-0.avif | 108.6 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/digital-twins-simulation-0.webp | 80.9 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.avif | 5.7 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.webp | 10.7 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.avif | 8.0 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.webp | 16.7 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.avif | 3.6 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.webp | 7.6 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.avif | 5.0 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.webp | 10.8 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/smart-drones-inspection-0.avif | 121.1 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/smart-drones-inspection-0.webp | 86.1 | WEBP | ضمن الحد غالبًا |
| assets/3d-icons/warehouse-automation-0.avif | 115.3 | AVIF | ضمن الحد غالبًا |
| assets/3d-icons/warehouse-automation-0.webp | 86.2 | WEBP | ضمن الحد غالبًا |
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
| 404.html | 404.html | صفحة عربية عامة | ar-SA | لا | نعم | لا | WebPage | canonical مفقود؛ hreflang غير موجود أو محدود |
| 500.html | 500.html | صفحة عربية عامة | ar-SA | لا | نعم | لا | WebPage | canonical مفقود؛ hreflang غير موجود أو محدود |
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
| index.html | blog/ai-agents-business-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-automation-project-analysis/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-business-performance/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-data-analysis-tools/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-energy-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-finance-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-generative-content-industry-saudi-arabia/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-guide-saudi-business/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-healthcare-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, MedicalWebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-implementation-cost-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-innovation-saudi-arabia/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-manufacturing-digital-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-marketing-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ai-transformation/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/big-data-analysis/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/building-ai-agents-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/building-ai-agents-practical-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/business-intelligence-data-analysis/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/business-intelligence-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/case-study-saudi-companies-ai-agents-customer-service/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/chatgpt-vs-claude-vs-gemini-arabic/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/choose-ai-company-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/claude-opus-4-6-saudi-market/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/commerce-ministry-chatbot/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/data-analysis-best-practices/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/data-analysis-decision-making/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/digital-banking-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/digital-health-smart-archive/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/digital-transformation-automation/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/financial-hr-automation/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/future-of-intelligent-data-analysis-finance-sector/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/generative-artificial-intelligence/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/government-ai-solutions-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/government-ai-solutions/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/hr-automation-case-study/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/hr-automation-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Blog, BreadcrumbList, CollectionPage, ItemList, Article | لا ملاحظات حرجة |
| index.html | blog/industrial-automation-productivity/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/industrial-automation-repetitive-tasks/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/intelligent-data-analysis/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/kfshrc-breast-cancer-ai/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | MedicalScholarlyArticle, Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/kpi-dashboard-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/ksu-adaptive-learning/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/machine-learning-business/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/machine-learning-computer-vision/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/nca-ai-compliance-saudi/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/nca-compliance/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/power-bi-saudi-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | BlogPosting, Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/private-hospital-scheduling-optimization/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/process-automation-ai-efficiency/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/process-automation/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/riyadh-municipality-ai-license/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-agritech-smart-farming/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-bank-fraud-detection/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-dates-quality-ai/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-ecommerce-ai-growth/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-edtech-personalized-learning/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-energy-predictive-maintenance/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-factory-ai-productivity/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-hospitality-dynamic-pricing/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-insurance-claims-ai/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-logistics-route-optimization/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-manufacturing-predictive-maintenance/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-mining-ai-exploration/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-petrochemical-ai-safety/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-real-estate-ai-valuation/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-renewable-energy-ai/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-smart-city-traffic/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-sports-analytics-ai/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-tourism-ai-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/saudi-waste-management-ai/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/smart-automation-benefits/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/smart-crm-system/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/smart-document-processing/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/smart-inventory-management/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/top-ai-tools-saudi-2025/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/transport-logistics-solutions/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/vision-2030-ai-opportunities/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | blog/workplace-automation-guide/index.html | مقال/مدونة | ar-SA | نعم | نعم | نعم | Article, BreadcrumbList | لا ملاحظات حرجة |
| index.html | bot/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | لا | JSON-LD غير موجود |
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
| privacy-policy-en.html | docs/privacy-policy-en.html | توثيق | en-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | docs/privacy-policy-en/index.html | توثيق | en-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| privacy-policy.html | docs/privacy-policy.html | توثيق | ar-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
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
| terms-and-conditions-en.html | docs/terms-and-conditions-en.html | توثيق | en-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| terms-and-conditions.html | docs/terms-and-conditions.html | توثيق | ar-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/about/index.html | تعريف بالشركة | en-SA | نعم | نعم | نعم | Organization, LocalBusiness, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | en/ai-agent/index.html | خدمة | en-SA | نعم | نعم | نعم | Organization, LocalBusiness,ProfessionalService, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightMath/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightProject/index.html | خدمة | en-SA | نعم | نعم | نعم | BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightRecruiter/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightSales/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/BrightSupport/index.html | خدمة | en-SA | نعم | نعم | نعم | SoftwareApplication, BreadcrumbList | لا ملاحظات حرجة |
| index.html | en/ai-bots/index.html | خدمة | en-SA | نعم | نعم | نعم | CollectionPage, FAQPage | لا ملاحظات حرجة |
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
| index.html | en/services/index.html | خدمة | en-SA | نعم | نعم | نعم | CollectionPage, FAQPage | لا ملاحظات حرجة |
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
| error.html | error.html | صفحة عربية عامة | ar-SA | لا | نعم | لا | لا | canonical مفقود؛ JSON-LD غير موجود؛ hreflang غير موجود أو محدود |
| index.html | health/index.html | خدمة | ar-SA | نعم | نعم | نعم | MedicalOrganization,LocalBusiness, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | Organization, LocalBusiness, WebSite, WebPage, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | interview/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | LocalBusiness, WebPage, Service, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | interview/pages/appointment/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | WebPage | لا ملاحظات حرجة |
| index.html | interview/pages/dashboard/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | WebPage | لا ملاحظات حرجة |
| index.html | interview/pages/support-ai/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | WebPage | لا ملاحظات حرجة |
| index.html | interview/pages/supportAI/index.html | تجربة/أداة | ar-SA | لا | نعم | نعم | BreadcrumbList | لا ملاحظات حرجة |
| index.html | interview/pages/Visitor-registration/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | machine-learning/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, BreadcrumbList | لا ملاحظات حرجة |
| index.html | mais-OBM/index.html | صفحة عامة | en | لا | نعم | نعم | لا | JSON-LD غير موجود |
| index.html | partners/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service | لا ملاحظات حرجة |
| index.html | privacy-cookies/index.html | قانونية | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList | لا ملاحظات حرجة |
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
| index.html | sectors/index.html | قطاع | ar-SA | نعم | نعم | نعم | CollectionPage, BreadcrumbList | لا ملاحظات حرجة |
| logistics-en.html | sectors/logistics-en.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/logistics-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| logistics.html | sectors/logistics.html | قطاع | ar-SA | نعم | نعم | نعم | Industry, Service, BreadcrumbList | لا ملاحظات حرجة |
| manufacturing-en.html | sectors/manufacturing-en.html | قطاع | en-SA | نعم | نعم | نعم | Organization, Service, Industry, BreadcrumbList | لا ملاحظات حرجة |
| index.html | sectors/manufacturing-en/index.html | قطاع | en-SA | نعم | نعم | نعم | Organization, Service, Industry, BreadcrumbList | لا ملاحظات حرجة |
| manufacturing.html | sectors/manufacturing.html | قطاع | ar-SA | نعم | نعم | نعم | Organization, Service, Industry, BreadcrumbList | لا ملاحظات حرجة |
| ai-consulting.html | services/ai-consulting.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| ai-scolecs.html | services/ai-scolecs.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | services/ai-scolecs/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service | لا ملاحظات حرجة |
| ai-tenders-analysis.html | services/ai-tenders-analysis.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | services/ai-tenders-analysis/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service | لا ملاحظات حرجة |
| approvals-automation.html | services/approvals-automation.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| brightproject.html | services/brightproject.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | services/brightproject/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service | لا ملاحظات حرجة |
| brightsales.html | services/brightsales.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | services/brightsales/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service | لا ملاحظات حرجة |
| competitor-analysis-agent.html | services/competitor-analysis-agent.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| custom-ai-agent.html | services/custom-ai-agent.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| customer-service-automation.html | services/customer-service-automation.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| data-analyst-agent.html | services/data-analyst-agent.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| data-platform.html | services/data-platform.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| document-automation.html | services/document-automation.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| health-data-analysis.html | services/health-data-analysis.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| hr-automation.html | services/hr-automation.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | services/index.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, ItemList | لا ملاحظات حرجة |
| lead-hunter.html | services/lead-hunter.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| marketing-agent.html | services/marketing-agent.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| marketing-automation.html | services/marketing-automation.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| medical-archive.html | services/medical-archive.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| operational-reports-automation.html | services/operational-reports-automation.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| seo-agent.html | services/seo-agent.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| smart-hiring-system.html | services/smart-hiring-system.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| smart-hospital-management.html | services/smart-hospital-management.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | services/smart-hospital-management/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service | لا ملاحظات حرجة |
| social-data-analysis.html | services/social-data-analysis.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| supply-chain-optimization.html | services/supply-chain-optimization.html | خدمة | ar-SA | نعم | نعم | نعم | Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage | لا ملاحظات حرجة |
| index.html | sitemap/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | BreadcrumbList | لا ملاحظات حرجة |
| index.html | smart-automation/index.html | خدمة | ar-SA | نعم | نعم | نعم | Service, LocalBusiness,ProfessionalService, WebPage, BreadcrumbList | لا ملاحظات حرجة |
| index.html | smart-medical-archive/index.html | خدمة | ar-SA | نعم | نعم | نعم | LocalBusiness,ProfessionalService, Service, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| compare.html | tenders/compare.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| dashboard.html | tenders/dashboard.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| index.html | tenders/index.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | Organization, WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| landing.html | tenders/landing.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| reports.html | tenders/reports.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| settings.html | tenders/settings.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| templates.html | tenders/templates.html | مناقصات/demo | ar-SA | نعم | نعم | نعم | WebPage, BreadcrumbList, Service, SoftwareApplication | لا ملاحظات حرجة |
| index.html | terms/index.html | قانونية | ar-SA | نعم | نعم | نعم | LegalDocument, BreadcrumbList | لا ملاحظات حرجة |
| index.html | tools/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | CollectionPage, ItemList, BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/data-analyzer/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/data-quality/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | try/text-analysis/index.html | تجربة/أداة | ar-SA | نعم | نعم | نعم | BreadcrumbList, SoftwareApplication | لا ملاحظات حرجة |
| index.html | what-is-ai/index.html | صفحة عربية عامة | ar-SA | نعم | نعم | نعم | Article, Service, BreadcrumbList | لا ملاحظات حرجة |

## تقييم كل صفحة بالنسبة المئوية

| الصفحة | SEO % | AEO % | GEO/AI Search % | Content Depth % | Internal Linking % | Technical SEO % | Speed Risk % | UI/UX % | Trust % | الأولوية |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 404.html | 91% | 35% | 74% | 49% | 67% | 86% | 27% | 83% | 80% | متوسطة/منخفضة |
| 500.html | 91% | 35% | 70% | 59% | 80% | 86% | 45% | 83% | 70% | متوسطة/منخفضة |
| about/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 45% | 87% | 100% | مرتفعة |
| ai-agent/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 45% | 87% | 100% | مرتفعة |
| ai-bots/BrightMath/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 57% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightProject/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 57% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightRecruiter/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 57% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightSales/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 57% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/BrightSupport/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 57% | 83% | 80% | متوسطة/منخفضة |
| ai-bots/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 15% | 87% | 70% | مرتفعة |
| ai-scolecs/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 63% | 83% | 80% | متوسطة/منخفضة |
| ai-workflows/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 80% | مرتفعة |
| blog/ai-agents-business-guide/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/ai-automation-project-analysis/index.html | 100% | 71% | 92% | 100% | 100% | 100% | 50% | 88% | 60% | متوسطة/منخفضة |
| blog/ai-business-performance/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/ai-data-analysis-tools/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/ai-energy-saudi/index.html | 100% | 75% | 96% | 100% | 100% | 100% | 42% | 87% | 70% | متوسطة/منخفضة |
| blog/ai-finance-saudi/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 42% | 83% | 80% | متوسطة/منخفضة |
| blog/ai-generative-content-industry-saudi-arabia/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/ai-guide-saudi-business/index.html | 100% | 81% | 96% | 100% | 95% | 100% | 33% | 83% | 70% | متوسطة/منخفضة |
| blog/ai-healthcare-saudi/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 44% | 88% | 100% | متوسطة/منخفضة |
| blog/ai-implementation-cost-guide/index.html | 100% | 81% | 96% | 100% | 95% | 100% | 33% | 83% | 70% | متوسطة/منخفضة |
| blog/ai-innovation-saudi-arabia/index.html | 100% | 75% | 100% | 100% | 100% | 100% | 47% | 92% | 80% | متوسطة/منخفضة |
| blog/ai-manufacturing-digital-guide/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/ai-marketing-guide/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 90% | متوسطة/منخفضة |
| blog/ai-transformation/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/big-data-analysis/index.html | 100% | 63% | 96% | 92% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/building-ai-agents-guide/index.html | 100% | 81% | 92% | 100% | 100% | 100% | 47% | 88% | 60% | متوسطة/منخفضة |
| blog/building-ai-agents-practical-guide/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/business-intelligence-data-analysis/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/business-intelligence-saudi/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 50% | 92% | 80% | متوسطة/منخفضة |
| blog/case-study-saudi-companies-ai-agents-customer-service/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/chatgpt-vs-claude-vs-gemini-arabic/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 33% | 83% | 70% | متوسطة/منخفضة |
| blog/choose-ai-company-saudi/index.html | 100% | 81% | 96% | 100% | 97% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |
| blog/claude-opus-4-6-saudi-market/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| blog/commerce-ministry-chatbot/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/data-analysis-best-practices/index.html | 100% | 53% | 92% | 84% | 100% | 100% | 47% | 88% | 60% | متوسطة/منخفضة |
| blog/data-analysis-decision-making/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 90% | متوسطة/منخفضة |
| blog/digital-banking-saudi/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 50% | 92% | 80% | متوسطة/منخفضة |
| blog/digital-health-smart-archive/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 90% | متوسطة/منخفضة |
| blog/digital-transformation-automation/index.html | 100% | 81% | 92% | 100% | 100% | 100% | 47% | 88% | 60% | متوسطة/منخفضة |
| blog/financial-hr-automation/index.html | 100% | 71% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/future-of-intelligent-data-analysis-finance-sector/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/generative-artificial-intelligence/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/government-ai-solutions-saudi/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 45% | 87% | 90% | متوسطة/منخفضة |
| blog/government-ai-solutions/index.html | 100% | 83% | 100% | 100% | 100% | 100% | 45% | 87% | 90% | متوسطة/منخفضة |
| blog/hr-automation-case-study/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |
| blog/hr-automation-saudi/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 41% | 88% | 80% | متوسطة/منخفضة |
| blog/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 42% | 83% | 90% | متوسطة/منخفضة |
| blog/industrial-automation-productivity/index.html | 100% | 71% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/industrial-automation-repetitive-tasks/index.html | 100% | 71% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/intelligent-data-analysis/index.html | 100% | 63% | 96% | 96% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/kfshrc-breast-cancer-ai/index.html | 100% | 63% | 96% | 100% | 100% | 100% | 42% | 83% | 70% | متوسطة/منخفضة |
| blog/kpi-dashboard-guide/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 38% | 88% | 70% | متوسطة/منخفضة |
| blog/ksu-adaptive-learning/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| blog/machine-learning-business/index.html | 100% | 63% | 96% | 81% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/machine-learning-computer-vision/index.html | 100% | 71% | 96% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/nca-ai-compliance-saudi/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| blog/nca-compliance/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 90% | متوسطة/منخفضة |
| blog/power-bi-saudi-guide/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 41% | 88% | 80% | متوسطة/منخفضة |
| blog/private-hospital-scheduling-optimization/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/process-automation-ai-efficiency/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/process-automation/index.html | 100% | 63% | 96% | 97% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| blog/riyadh-municipality-ai-license/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 42% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-agritech-smart-farming/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-bank-fraud-detection/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-dates-quality-ai/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-ecommerce-ai-growth/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| blog/saudi-edtech-personalized-learning/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-energy-predictive-maintenance/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-factory-ai-productivity/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-hospitality-dynamic-pricing/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-insurance-claims-ai/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-logistics-route-optimization/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| blog/saudi-manufacturing-predictive-maintenance/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-mining-ai-exploration/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-petrochemical-ai-safety/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-real-estate-ai-valuation/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-renewable-energy-ai/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 42% | 83% | 70% | متوسطة/منخفضة |
| blog/saudi-smart-city-traffic/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 42% | 83% | 70% | متوسطة/منخفضة |
| blog/saudi-sports-analytics-ai/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| blog/saudi-tourism-ai-guide/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| blog/saudi-waste-management-ai/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 42% | 83% | 70% | متوسطة/منخفضة |
| blog/smart-automation-benefits/index.html | 100% | 63% | 96% | 94% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/smart-crm-system/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| blog/smart-document-processing/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 90% | متوسطة/منخفضة |
| blog/smart-inventory-management/index.html | 100% | 63% | 96% | 100% | 100% | 100% | 50% | 88% | 70% | متوسطة/منخفضة |
| blog/top-ai-tools-saudi-2025/index.html | 100% | 81% | 96% | 100% | 95% | 100% | 33% | 83% | 70% | متوسطة/منخفضة |
| blog/transport-logistics-solutions/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| blog/vision-2030-ai-opportunities/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 39% | 83% | 70% | متوسطة/منخفضة |
| blog/workplace-automation-guide/index.html | 100% | 63% | 92% | 84% | 100% | 100% | 47% | 88% | 60% | متوسطة/منخفضة |
| bot/index.html | 94% | 53% | 80% | 100% | 55% | 93% | 9% | 63% | 60% | متوسطة/منخفضة |
| case-studies/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 27% | 83% | 80% | متوسطة/منخفضة |
| consultation/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 42% | 83% | 100% | مرتفعة |
| contact/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 100% | مرتفعة |
| data-analysis/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 56% | 92% | 90% | مرتفعة |
| demo/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 44% | 88% | 80% | متوسطة/منخفضة |
| demo/ocr-demo/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 90% | متوسطة/منخفضة |
| demo/pricing/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| demo/resources/report-ai-saudi-2026/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 44% | 88% | 70% | متوسطة/منخفضة |
| docs.html | 100% | 81% | 100% | 100% | 100% | 100% | 33% | 83% | 100% | متوسطة/منخفضة |
| docs/ai-agent-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| docs/ai-agent.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| docs/ai-bots-en.html | 100% | 71% | 100% | 100% | 100% | 100% | 45% | 83% | 100% | متوسطة/منخفضة |
| docs/ai-bots.html | 100% | 71% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| docs/consultation-en.html | 100% | 81% | 82% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/consultation.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/contact-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/contact.html | 100% | 81% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/data-analysis-en.html | 100% | 81% | 82% | 98% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/data-analysis.html | 100% | 53% | 96% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| docs/faq-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/faq.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| docs/openapi.html | 100% | 93% | 96% | 100% | 100% | 100% | 33% | 87% | 80% | متوسطة/منخفضة |
| docs/privacy-policy-en.html | 100% | 45% | 82% | 82% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/privacy-policy-en/index.html | 100% | 45% | 82% | 82% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/privacy-policy.html | 100% | 63% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/services-overview-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| docs/services-overview.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/smart-automation-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| docs/smart-automation.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-bi-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-bi.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-crm-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-crm.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-finance-en.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-finance.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-healthcare-en.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-healthcare.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| docs/solutions-hr-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| docs/solutions-hr.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-interview-en.html | 100% | 81% | 96% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-interview.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 90% | متوسطة/منخفضة |
| docs/solutions-logistics-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 47% | 88% | 70% | متوسطة/منخفضة |
| docs/solutions-logistics.html | 100% | 81% | 96% | 100% | 100% | 100% | 50% | 88% | 80% | متوسطة/منخفضة |
| docs/solutions-ocr-en.html | 100% | 81% | 82% | 99% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-ocr.html | 100% | 81% | 96% | 100% | 100% | 100% | 42% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-retail-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-retail.html | 100% | 81% | 96% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| docs/solutions-supply-chain-en.html | 100% | 81% | 92% | 100% | 100% | 100% | 45% | 83% | 70% | متوسطة/منخفضة |
| docs/solutions-supply-chain.html | 100% | 81% | 96% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| docs/terms-and-conditions-en.html | 100% | 45% | 78% | 90% | 100% | 100% | 36% | 83% | 80% | متوسطة/منخفضة |
| docs/terms-and-conditions.html | 100% | 63% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| en/about/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 39% | 83% | 90% | متوسطة/منخفضة |
| en/ai-agent/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 39% | 87% | 100% | متوسطة/منخفضة |
| en/ai-bots/BrightMath/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightProject/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightRecruiter/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightSales/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/BrightSupport/index.html | 100% | 71% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| en/ai-bots/index.html | 100% | 100% | 82% | 100% | 87% | 100% | 6% | 87% | 60% | متوسطة/منخفضة |
| en/ai-workflows/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| en/consultation/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| en/contact/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 42% | 83% | 100% | متوسطة/منخفضة |
| en/data-analysis/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 53% | 92% | 100% | متوسطة/منخفضة |
| en/docs/docs.html | 96% | 81% | 100% | 100% | 100% | 93% | 39% | 83% | 100% | متوسطة/منخفضة |
| en/docs/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 39% | 83% | 100% | متوسطة/منخفضة |
| en/health/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 42% | 83% | 90% | متوسطة/منخفضة |
| en/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 32% | 92% | 100% | متوسطة/منخفضة |
| en/interview/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 35% | 88% | 80% | متوسطة/منخفضة |
| en/privacy-cookies/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 24% | 83% | 90% | متوسطة/منخفضة |
| en/services/index.html | 100% | 100% | 86% | 100% | 90% | 100% | 6% | 87% | 70% | متوسطة/منخفضة |
| en/smart-automation/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 36% | 87% | 80% | متوسطة/منخفضة |
| en/smart-medical-archive/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 69% | 83% | 90% | متوسطة/منخفضة |
| en/tenders/compare.html | 100% | 93% | 96% | 100% | 100% | 100% | 18% | 87% | 80% | متوسطة/منخفضة |
| en/tenders/dashboard.html | 100% | 53% | 96% | 100% | 100% | 100% | 15% | 83% | 80% | متوسطة/منخفضة |
| en/tenders/index.html | 100% | 53% | 86% | 92% | 90% | 100% | 6% | 83% | 70% | متوسطة/منخفضة |
| en/tenders/landing.html | 100% | 81% | 100% | 100% | 100% | 100% | 12% | 83% | 90% | متوسطة/منخفضة |
| en/tenders/reports.html | 100% | 65% | 96% | 100% | 100% | 100% | 15% | 87% | 80% | متوسطة/منخفضة |
| en/tenders/settings.html | 100% | 65% | 96% | 100% | 100% | 100% | 15% | 87% | 80% | متوسطة/منخفضة |
| en/tenders/templates.html | 100% | 81% | 96% | 100% | 100% | 100% | 24% | 83% | 80% | متوسطة/منخفضة |
| en/terms/index.html | 100% | 53% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| en/tools/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 57% | 83% | 70% | متوسطة/منخفضة |
| error.html | 91% | 71% | 92% | 100% | 80% | 79% | 9% | 83% | 90% | متوسطة/منخفضة |
| health/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 63% | 83% | 100% | متوسطة/منخفضة |
| index.html | 100% | 93% | 100% | 100% | 100% | 100% | 47% | 92% | 100% | متوسطة/منخفضة |
| interview/index.html | 100% | 81% | 96% | 100% | 100% | 100% | 47% | 88% | 80% | متوسطة/منخفضة |
| interview/pages/appointment/index.html | 100% | 81% | 100% | 100% | 90% | 100% | 45% | 83% | 90% | متوسطة/منخفضة |
| interview/pages/dashboard/index.html | 100% | 65% | 92% | 100% | 90% | 100% | 45% | 87% | 70% | متوسطة/منخفضة |
| interview/pages/support-ai/index.html | 100% | 81% | 96% | 100% | 90% | 100% | 36% | 83% | 80% | متوسطة/منخفضة |
| interview/pages/supportAI/index.html | 94% | 35% | 51% | 39% | 63% | 100% | 9% | 63% | 50% | متوسطة/منخفضة |
| interview/pages/Visitor-registration/index.html | 100% | 35% | 70% | 67% | 100% | 100% | 48% | 83% | 70% | متوسطة/منخفضة |
| machine-learning/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 100% | مرتفعة |
| mais-OBM/index.html | 100% | 65% | 61% | 100% | 45% | 93% | 12% | 75% | 50% | متوسطة/منخفضة |
| partners/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 27% | 83% | 90% | متوسطة/منخفضة |
| privacy-cookies/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 24% | 83% | 90% | متوسطة/منخفضة |
| sectors/ecommerce-en.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| sectors/ecommerce-en/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| sectors/ecommerce.html | 100% | 93% | 100% | 100% | 100% | 100% | 54% | 87% | 80% | متوسطة/منخفضة |
| sectors/energy-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 70% | متوسطة/منخفضة |
| sectors/energy-en/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 70% | متوسطة/منخفضة |
| sectors/energy.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 70% | متوسطة/منخفضة |
| sectors/finance-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 70% | متوسطة/منخفضة |
| sectors/finance-en/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 70% | متوسطة/منخفضة |
| sectors/finance.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 70% | متوسطة/منخفضة |
| sectors/healthcare-en.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| sectors/healthcare-en/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 48% | 83% | 80% | متوسطة/منخفضة |
| sectors/healthcare.html | 100% | 81% | 100% | 100% | 100% | 100% | 51% | 83% | 80% | متوسطة/منخفضة |
| sectors/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 24% | 87% | 80% | مرتفعة |
| sectors/logistics-en.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| sectors/logistics-en/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| sectors/logistics.html | 100% | 93% | 100% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| sectors/manufacturing-en.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| sectors/manufacturing-en/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 48% | 87% | 80% | متوسطة/منخفضة |
| sectors/manufacturing.html | 100% | 93% | 96% | 100% | 100% | 100% | 51% | 87% | 80% | متوسطة/منخفضة |
| services/ai-consulting.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/ai-scolecs.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/ai-scolecs/index.html | 100% | 35% | 55% | 39% | 67% | 100% | 6% | 83% | 60% | مرتفعة |
| services/ai-tenders-analysis.html | 100% | 100% | 96% | 100% | 100% | 100% | 3% | 87% | 80% | متوسطة/منخفضة |
| services/ai-tenders-analysis/index.html | 100% | 45% | 74% | 40% | 67% | 100% | 6% | 83% | 70% | متوسطة/منخفضة |
| services/approvals-automation.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/brightproject.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/brightproject/index.html | 100% | 35% | 55% | 39% | 67% | 100% | 6% | 83% | 60% | مرتفعة |
| services/brightsales.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/brightsales/index.html | 100% | 45% | 55% | 39% | 67% | 100% | 6% | 83% | 60% | متوسطة/منخفضة |
| services/competitor-analysis-agent.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/custom-ai-agent.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/customer-service-automation.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/data-analyst-agent.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/data-platform.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/document-automation.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/health-data-analysis.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/hr-automation.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/index.html | 100% | 71% | 96% | 100% | 100% | 100% | 21% | 83% | 80% | مرتفعة |
| services/lead-hunter.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/marketing-agent.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/marketing-automation.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/medical-archive.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/operational-reports-automation.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/seo-agent.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/smart-hiring-system.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/smart-hospital-management.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/smart-hospital-management/index.html | 100% | 35% | 55% | 39% | 67% | 100% | 6% | 83% | 60% | مرتفعة |
| services/social-data-analysis.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| services/supply-chain-optimization.html | 100% | 100% | 92% | 100% | 100% | 100% | 3% | 87% | 70% | متوسطة/منخفضة |
| sitemap/index.html | 100% | 71% | 94% | 88% | 100% | 100% | 6% | 83% | 90% | متوسطة/منخفضة |
| smart-automation/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 42% | 87% | 80% | مرتفعة |
| smart-medical-archive/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 100% | 83% | 90% | مرتفعة |
| tenders/compare.html | 100% | 93% | 100% | 100% | 100% | 100% | 24% | 87% | 90% | متوسطة/منخفضة |
| tenders/dashboard.html | 100% | 63% | 100% | 100% | 100% | 100% | 21% | 83% | 90% | متوسطة/منخفضة |
| tenders/index.html | 100% | 93% | 100% | 100% | 100% | 100% | 42% | 87% | 100% | مرتفعة |
| tenders/landing.html | 100% | 81% | 100% | 100% | 100% | 100% | 21% | 83% | 100% | مرتفعة |
| tenders/reports.html | 100% | 75% | 100% | 100% | 100% | 100% | 21% | 87% | 90% | متوسطة/منخفضة |
| tenders/settings.html | 100% | 75% | 100% | 100% | 100% | 100% | 21% | 87% | 90% | متوسطة/منخفضة |
| tenders/templates.html | 100% | 81% | 100% | 100% | 100% | 100% | 24% | 83% | 90% | متوسطة/منخفضة |
| terms/index.html | 100% | 53% | 100% | 100% | 100% | 100% | 36% | 83% | 90% | متوسطة/منخفضة |
| tools/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 60% | 83% | 80% | متوسطة/منخفضة |
| try/data-analyzer/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 75% | 87% | 70% | متوسطة/منخفضة |
| try/data-quality/index.html | 100% | 93% | 96% | 100% | 100% | 100% | 69% | 87% | 70% | متوسطة/منخفضة |
| try/index.html | 100% | 63% | 100% | 100% | 100% | 100% | 53% | 88% | 80% | متوسطة/منخفضة |
| try/text-analysis/index.html | 100% | 81% | 100% | 100% | 100% | 100% | 45% | 83% | 80% | متوسطة/منخفضة |
| what-is-ai/index.html | 100% | 63% | 96% | 100% | 100% | 100% | 36% | 83% | 70% | متوسطة/منخفضة |

## SEO Audit لكل صفحة

| الصفحة | المشكلة | الدليل من الكود | التأثير | الحل | الكود المقترح | الأولوية |
|---|---|---|---|---|---|---|
| 404.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=missing | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| 404.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/404/">الصفحة غير موجودة</a>` | Medium |
| 500.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=missing | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| 500.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/500/">500</a>` | Medium |
| blog/building-ai-agents-practical-guide/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/building-ai-agents-practical-guide/">الدليل الشامل لبناء وكلاء الذكاء الاصطناعي: شرح عملي</a>` | Medium |
| bot/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/bot/">✦ Bright AI</a>` | Medium |
| docs/privacy-policy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=13 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/docs/privacy-policy-en/">BrightAI Privacy Policy</a>` | Medium |
| en/docs/docs.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=1 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/docs/docs/">Bright AI Docs Hub</a>` | Medium |
| en/privacy-cookies/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/privacy-cookies/">سياسة الخصوصية</a>` | Medium |
| en/terms/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/terms/">الشروط والأحكام</a>` | Medium |
| error.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=missing | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| error.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/error/">تقرير أخطاء صحة الموقع</a>` | Medium |
| interview/pages/supportAI/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/supportAI/">تم نقل الصفحة \| Bright AI</a>` | Medium |
| interview/pages/Visitor-registration/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/Visitor-registration/">نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي</a>` | Medium |
| mais-OBM/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/mais-OBM/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| mais-OBM/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/mais-OBM/">OBM Rejects Control Dashboard</a>` | Medium |
| sectors/ecommerce-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/ecommerce-en/">AI Solutions For Saudi E-Commerce In Saudi Arabia</a>` | Medium |
| sectors/energy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/energy-en/">AI Solutions For Saudi Energy In Saudi Arabia</a>` | Medium |
| sectors/finance-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/finance-en/">AI Solutions For Saudi Finance In Saudi Arabia</a>` | Medium |
| sectors/healthcare-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/healthcare-en/">Healthcare AI Solutions For Saudi Hospitals In Saudi Arabia</a>` | Medium |
| sectors/logistics-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/logistics-en/">AI Solutions For Saudi Logistics In Saudi Arabia</a>` | Medium |
| sectors/manufacturing-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/manufacturing-en/">AI Solutions For Saudi Manufacturing In Saudi Arabia</a>` | Medium |
| services/ai-scolecs.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=25 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/ai-scolecs/">منصة تعليمية ذكية متكاملة بالذكاء الاصطناعي</a>` | Medium |
| services/ai-scolecs/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/ai-tenders-analysis.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=29 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/ai-tenders-analysis/">نظام تحليل المناقصات بالذكاء الاصطناعي للقطاع المالي والمشتريات</a>` | Medium |
| services/ai-tenders-analysis/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=52% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/brightproject.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=27 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/brightproject/">BrightProject لإدارة المشاريع الذكية في السعودية</a>` | Medium |
| services/brightproject/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/brightsales.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=29 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/brightsales/">BrightSales روبوت المبيعات الذكي للشركات في السعودية</a>` | Medium |
| services/brightsales/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/smart-hospital-management.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=29 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/smart-hospital-management/">نظام إدارة المستشفيات الذكية بالذكاء الاصطناعي</a>` | Medium |
| services/smart-hospital-management/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/ai-tenders-analysis/index.html, tenders/index.html | Title مكرر | نظام تحليل المناقصات بالذكاء الاصطناعي \| Bright AI | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |

## اقتراحات Title / Meta / H1 للصفحات ذات الأولوية

| الصفحة | Title المقترح | Meta المقترحة | H1 المقترح | H2 المقترحة | H3 المقترحة | CTA المقترح |
|---|---|---|---|---|---|---|
| services/index.html | خدمات ذكاء اصطناعي وأتمتة أعمال تساعد فريقك يشتغل أسرع وبقرار أوضح في السعودية \| Bright AI | خدمات ومنتجات Bright AI للشركات في السعودية: وكلاء ذكاء اصطناعي، أتمتة أعمال، تحليل بيانات، تسويق ذكي، خدمة عملاء، موارد بشرية، تقارير تشغيلية وسلاسل توريد. | خدمات ذكاء اصطناعي وأتمتة أعمال تساعد فريقك يشتغل أسرع وبقرار أوضح | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| ai-bots/index.html | روبوتات ذكاء اصطناعي جاهزة للشركات السعودية \| Bright AI | روبوتات Bright AI الجاهزة للشركات السعودية تدعم المبيعات، التوظيف، الدعم، والتعليم مع تخصيص عربي وتكاملات وحوكمة بيانات. | روبوتات ذكاء اصطناعي جاهزة لفرقك التشغيلية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| smart-medical-archive/index.html | الأرشيف الطبي الذكي بالذكاء الاصطناعي في السعودية \| Bright AI | حل أرشيف طبي ذكي يساعد الجهات الصحية السعودية على تنظيم الوثائق والسجلات، تحسين البحث، ودعم التحول الرقمي الصحي باستخدام الذكاء الاصطناعي. | الأرشيف الطبي الذكي بالذكاء الاصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| ai-workflows/index.html | أتمتة سير العمل في السعودية \| Bright AI | تساعد Bright AI الشركات والجهات في السعودية على تطبيق أتمتة سير العمل عبر الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، وحوكمة تنفيذية قابلة للقياس. | أتمتة سير العمل في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| smart-automation/index.html | أتمتة العمليات بالذكاء الاصطناعي في السعودية \| Bright AI | حلول أتمتة ذكية للعمليات في السعودية تشمل سير العمل، الفواتير، المشتريات، وخدمة العملاء مع ربط عملي بالبيانات ووكلاء الذكاء الاصطناعي. | أتمتة العمليات بالذكاء الاصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| sectors/index.html | حلول ذكاء اصطناعي للقطاعات السعودية \| Bright AI | اكتشف حلول Bright AI للقطاعات السعودية، من المالية والصحة إلى اللوجستيات والصناعة والطاقة، مع AI Agent وأتمتة ذكية وتحليل بيانات لكل قطاع. | حلول الذكاء الاصطناعي حسب القطاع للشركات والمؤسسات في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| consultation/index.html | استشارات الذكاء الاصطناعي السعودية \| Bright AI | احجز استشارة ذكاء اصطناعي للشركات السعودية لتقييم الجاهزية، اختيار حالات الاستخدام، وتحديد مسار تنفيذ واضح للأتمتة وتحليل البيانات ووكلاء AI. | استشارات الذكاء الاصطناعي السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| contact/index.html | تواصل مع شركة ذكاء اصطناعي في السعودية \| Bright AI | تواصل مع Bright AI في السعودية لمناقشة احتياجك في الأتمتة، تحليل البيانات، وكلاء الذكاء الاصطناعي، أو حلول القطاعات المؤسسية. | تواصل مع شركة ذكاء اصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| machine-learning/index.html | تطوير نماذج تعلم الآلة السعودية \| Bright AI | خدمات تطوير نماذج تعلم الآلة للشركات السعودية، من إعداد البيانات وتقييم الحالة إلى بناء نماذج قابلة للتكامل مع العمليات والحوكمة. | تطوير نماذج تعلم الآلة السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |
| tenders/landing.html | نظام مناقصات ذكي لفرق المشتريات السعودية \| ContractAI | نظام مناقصات ذكي من Bright AI لتحليل كراسات الشروط والعقود، كشف المخاطر، وتجهيز عرض ديمو مناسب لفرق المشتريات السعودية. | محلل العقود والمناقصات بالذكاء الاصطناعي في السعودية | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |

## Keyword Mapping

مصدر الكلمات: `reports/keywords strategy 2026.xlsx`، مع الاستفادة من `reports/intent-to-keyword-map.md` كمرجع قائم في المشروع عند وجوده.

| الكلمة المفتاحية | النية | الصفحة الأنسب | السبب | الأولوية | هل يوجد Cannibalization؟ | ملاحظات |
|---|---|---|---|---|---|---|

### كلمات ليس لها صفحة مناسبة أو تحتاج صفحة جديدة

- `PDPL`, `NDMO`, `Data Sovereignty Cloud Solutions KSA`: تحتاج صفحة حوكمة بيانات وامتثال مستقلة بدل توزيعها على مقالات عامة.
- `Saudi AI Adoption Framework`: تحتاج صفحة مرجعية/استشارية تربط بين AI readiness والخدمات.
- `أتمتة الفواتير والمشتريات`: يمكن أن تكون صفحة خدمة فرعية تحت `/smart-automation/`.
- `تحليل المناقصات بالذكاء الاصطناعي`: يحتاج دعم أقوى من `/tenders/` و`/tenders/landing/`.

## AEO / GEO / AI Search Audit

| الصفحة | AI Search Readiness % | سبب النقص | التحسين المطلوب | نص جاهز للإضافة | Schema مناسب |
|---|---:|---|---|---|---|
| interview/pages/supportAI/index.html | 51% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد تم نقل الصفحة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| 500.html | 70% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد 500 في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| interview/pages/Visitor-registration/index.html | 70% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| services/ai-scolecs/index.html | 55% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد نظام منصة تعليمية متكاملة ذكية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| services/brightproject/index.html | 55% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد BrightProject - إدارة المشاريع الذكي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| services/brightsales/index.html | 55% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد BrightSales - روبوت المبيعات الذكي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| services/smart-hospital-management/index.html | 55% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد نظام إدارة المستشفيات الذكية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| 404.html | 74% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد الصفحة غير موجودة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| services/ai-tenders-analysis/index.html | 74% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد نظام تحليل المناقصات بالذكاء الاصطناعي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + Service |
| docs/terms-and-conditions-en.html | 78% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد BrightAI Terms and Conditions في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| bot/index.html | 80% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد ✦ Bright AI في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/privacy-policy-en.html | 82% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد BrightAI Privacy Policy في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/privacy-policy-en/index.html | 82% | غياب إجابة مباشرة | Answer Block + FAQ + Breadcrumb | تساعد BrightAI Privacy Policy for Saudi Users في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| mais-OBM/index.html | 61% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد OBM Rejects Control Dashboard في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| en/tenders/index.html | 86% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد AI tender and contract analysis for Saudi procurement teams. في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/data-analysis-best-practices/index.html | 92% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد أفضل الممارسات لتحليل البيانات: تحويل البيانات إلى قرارات ذكية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/workplace-automation-guide/index.html | 92% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد الأتمتة في مكان العمل: كيف تبدأ؟ في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/big-data-analysis/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد تحليل البيانات الضخمة للأعمال: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/intelligent-data-analysis/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد دليل شامل لتحليل البيانات الذكي: تحويل المعلومات إلى قرارات: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/kfshrc-breast-cancer-ai/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد دراسة حالة: مستشفى الملك فيصل التخصصي - الذكاء الاصطناعي: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/machine-learning-business/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد تعلم الآلة: المفتاح لتحقيق النجاح في الأعمال الحديثة في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/process-automation/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد أتمتة العمليات: تحويل المهام الروتينية إلى عمليات مؤتمتة: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/smart-automation-benefits/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد فوائد الأتمتة الذكية للشركات: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| blog/smart-inventory-management/index.html | 96% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد إدارة المخزون الذكية بالذكاء الاصطناعي: شرح عملي في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage |
| docs/consultation-en.html | 82% | تحتاج أدلة/FAQ أكثر | Answer Block + FAQ + Breadcrumb | تساعد AI Consulting for Saudi Enterprises في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة. | WebPage + FAQPage |

## Google AI Mode Citation Readiness

هل الموقع موثوق بما يكفي ليعيده Google AI Mode عندما يجمع الإجابة؟  
الإجابة: نعم جزئيًا. الموقع لديه قاعدة تقنية جيدة، sitemap واسع، محتوى سعودي واضح في عدد كبير من الصفحات، وschema في صفحات كثيرة. العائق الأكبر ليس الزحف بل قابلية الاقتباس: الصفحات التجارية تحتاج إجابات مباشرة، أدلة/Trust blocks، FAQ منتظمة، وجداول مقارنة مختصرة.

| الصفحة | Google AI Mode Citation Score % | هل تستحق الاقتباس؟ | لماذا؟ | ما الذي يمنعها؟ | الإصلاح المطلوب |
|---|---:|---|---|---|---|
| services/index.html | 92% | نعم بعد تحسين بسيط | لديها schema و4316 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| ai-bots/index.html | 97% | نعم بعد تحسين بسيط | لديها schema و1296 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| smart-medical-archive/index.html | 96% | نعم بعد تحسين بسيط | لديها schema و2132 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| ai-workflows/index.html | 97% | نعم بعد تحسين بسيط | لديها schema و2840 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| smart-automation/index.html | 97% | نعم بعد تحسين بسيط | لديها schema و2821 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| sectors/index.html | 100% | نعم بعد تحسين بسيط | لديها schema و999 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| consultation/index.html | 100% | نعم بعد تحسين بسيط | لديها schema و1515 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| contact/index.html | 100% | نعم بعد تحسين بسيط | لديها schema و1810 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| machine-learning/index.html | 100% | نعم بعد تحسين بسيط | لديها schema و1790 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| tenders/landing.html | 100% | نعم بعد تحسين بسيط | لديها schema و2160 كلمة | نقص أدلة/FAQ/جداول | إضافة Trust/Evidence وFAQ |
| interview/pages/supportAI/index.html | 44% | ليس بعد | لديها schema و50 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| 500.html | 48% | ليس بعد | لديها schema و283 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| interview/pages/Visitor-registration/index.html | 48% | ليس بعد | لديها schema و386 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| services/ai-scolecs/index.html | 48% | ليس بعد | لديها schema و52 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| services/brightproject/index.html | 48% | ليس بعد | لديها schema و48 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| services/brightsales/index.html | 48% | ليس بعد | لديها schema و47 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| services/smart-hospital-management/index.html | 48% | ليس بعد | لديها schema و47 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| 404.html | 52% | ليس بعد | لديها schema و165 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| services/ai-tenders-analysis/index.html | 52% | ليس بعد | لديها schema و63 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |
| docs/terms-and-conditions-en.html | 65% | ليس بعد | لديها schema و661 كلمة | غياب إجابة مختصرة أعلى الصفحة | إضافة إجابة مختصرة قابلة للاقتباس |

## Deep Authoritative Content Plan

| الصفحة | مستوى العمق الحالي % | الأقسام الناقصة | الهيكل الجديد المقترح | أولوية التوسعة |
|---|---:|---|---|---|
| services/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| ai-bots/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| smart-medical-archive/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| ai-workflows/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| smart-automation/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| sectors/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| consultation/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| contact/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| machine-learning/index.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |
| tenders/landing.html | 100% | تعريف واضح؛ حالات استخدام في السعودية؛ طريقة التنفيذ؛ مؤشرات النجاح | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | مرتفعة |

### نماذج محتوى جاهزة لأهم الصفحات

### services/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد خدمات ذكاء اصطناعي وأتمتة أعمال تساعد فريقك يشتغل أسرع وبقرار أوضح في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### ai-bots/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد روبوتات ذكاء اصطناعي جاهزة لفرقك التشغيلية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### smart-medical-archive/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد الأرشيف الطبي الذكي بالذكاء الاصطناعي في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### ai-workflows/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد أتمتة سير العمل في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### smart-automation/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد أتمتة العمليات بالذكاء الاصطناعي في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.

**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.

### sectors/index.html

**إجابة مختصرة قابلة للاقتباس:** تساعد حلول الذكاء الاصطناعي حسب القطاع للشركات والمؤسسات في السعودية في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.

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


## Trust & Authority Signals

| إشارة الثقة | موجودة؟ | النتيجة % | المشكلة | أين تضاف؟ | نص جاهز |
|---|---|---:|---|---|---|
| About page | نعم | 80% | تحتاج ربطًا أوضح بخبرة السعودية والحوكمة بدون أرقام مختلقة | `/about/` والـ footer | Bright AI شركة سعودية تركّز على حلول AI مؤسسية قابلة للتطبيق في بيئات B2B وB2G. |
| Contact page | نعم | 85% | تحتاج CTA متسقة من صفحات المال | `/contact/` وروابط CTA | تواصل مع فريق Bright AI لمراجعة حالة الاستخدام والبيانات المتاحة قبل اقتراح الحل. |
| Privacy / Terms | نعم | 85% | موجودة ويجب إبقاؤها في footer | footer | روابط الخصوصية والشروط متاحة للمراجعة قبل التواصل. |
| Saudi context | جزئي | 72% | غير متساوٍ بين صفحات الخدمات | صفحات الخدمات والقطاعات | يراعي التنفيذ متطلبات السوق السعودي واللغة العربية وسياق الجهات الحكومية والشركات. |
| Compliance notes | جزئي | 62% | NDMO/PDPL/SDAIA تظهر في بعض المحتوى ولا توجد ككتلة ثقة موحدة | صفحات Data/AI/Automation | لا يبدأ التنفيذ قبل تحديد حساسية البيانات ومتطلبات الحوكمة والامتثال. |
| Case studies | جزئي | 58% | بعض المقالات بصيغة دراسة حالة، لكن يجب فصل الحقيقي عن الافتراضي وعدم اختراع عملاء | `/case-studies/` وblog | أمثلة تطبيقية تعليمية توضح النمط التشغيلي دون الادعاء بأنها عميل فعلي ما لم توجد موافقة. |

Authority & Trust Score الحالي: 79%

## Technical SEO

| الصفحة | المشكلة | الدليل من الكود | التأثير | الحل | الكود المقترح | الأولوية |
|---|---|---|---|---|---|---|
| 404.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=missing | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| 404.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/404/">الصفحة غير موجودة</a>` | Medium |
| 500.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=missing | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| 500.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/500/">500</a>` | Medium |
| blog/building-ai-agents-practical-guide/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/blog/building-ai-agents-practical-guide/">الدليل الشامل لبناء وكلاء الذكاء الاصطناعي: شرح عملي</a>` | Medium |
| bot/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/bot/">✦ Bright AI</a>` | Medium |
| docs/privacy-policy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=13 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/docs/privacy-policy-en/">BrightAI Privacy Policy</a>` | Medium |
| en/docs/docs.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=1 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/docs/docs/">Bright AI Docs Hub</a>` | Medium |
| en/privacy-cookies/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/privacy-cookies/">سياسة الخصوصية</a>` | Medium |
| en/terms/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/en/terms/">الشروط والأحكام</a>` | Medium |
| error.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=missing | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| error.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/error/">تقرير أخطاء صحة الموقع</a>` | Medium |
| interview/pages/supportAI/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/supportAI/">تم نقل الصفحة \| Bright AI</a>` | Medium |
| interview/pages/Visitor-registration/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/interview/pages/Visitor-registration/">نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي</a>` | Medium |
| mais-OBM/index.html | صفحة عامة قابلة للفهرسة خارج sitemap | canonical=https://brightai.site/mais-OBM/ | يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers. | إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية. | `<loc>https://brightai.site/.../</loc>` | High |
| mais-OBM/index.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=0 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/mais-OBM/">OBM Rejects Control Dashboard</a>` | Medium |
| sectors/ecommerce-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/ecommerce-en/">AI Solutions For Saudi E-Commerce In Saudi Arabia</a>` | Medium |
| sectors/energy-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/energy-en/">AI Solutions For Saudi Energy In Saudi Arabia</a>` | Medium |
| sectors/finance-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/finance-en/">AI Solutions For Saudi Finance In Saudi Arabia</a>` | Medium |
| sectors/healthcare-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/healthcare-en/">Healthcare AI Solutions For Saudi Hospitals In Saudi Arabia</a>` | Medium |
| sectors/logistics-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/logistics-en/">AI Solutions For Saudi Logistics In Saudi Arabia</a>` | Medium |
| sectors/manufacturing-en.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=4 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/sectors/manufacturing-en/">AI Solutions For Saudi Manufacturing In Saudi Arabia</a>` | Medium |
| services/ai-scolecs.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=25 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/ai-scolecs/">منصة تعليمية ذكية متكاملة بالذكاء الاصطناعي</a>` | Medium |
| services/ai-scolecs/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/ai-tenders-analysis.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=29 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/ai-tenders-analysis/">نظام تحليل المناقصات بالذكاء الاصطناعي للقطاع المالي والمشتريات</a>` | Medium |
| services/ai-tenders-analysis/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=52% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/brightproject.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=27 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/brightproject/">BrightProject لإدارة المشاريع الذكية في السعودية</a>` | Medium |
| services/brightproject/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/brightsales.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=29 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/brightsales/">BrightSales روبوت المبيعات الذكي للشركات في السعودية</a>` | Medium |
| services/brightsales/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/smart-hospital-management.html | صفحة يتيمة أو شبه يتيمة | incoming internal links=29 | ضعف PageRank الداخلي وصعوبة اكتشاف السياق. | ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية. | `<a href="/services/smart-hospital-management/">نظام إدارة المستشفيات الذكية بالذكاء الاصطناعي</a>` | Medium |
| services/smart-hospital-management/index.html | غياب Answer Block قابل للاقتباس | hasAnswer=false, AI Mode=48% | يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode. | إضافة فقرة مباشرة 40-60 كلمة تحت H1. | `<section class="answer-block" aria-labelledby="answer-title">...</section>` | High |
| services/ai-tenders-analysis/index.html, tenders/index.html | Title مكرر | نظام تحليل المناقصات بالذكاء الاصطناعي \| Bright AI | يزيد Cannibalization ويضعف CTR. | تخصيص title حسب نية كل صفحة. | `<title>...</title>` | Medium |

## Structured Data

الحالة الحالية: تم رصد أنواع JSON-LD متعددة، وتشمل حسب الصفحات: WebPage, Organization, LocalBusiness, BreadcrumbList, Service, LocalBusiness,ProfessionalService, SoftwareApplication, CollectionPage, Article, MedicalWebPage, BlogPosting, Blog, ItemList, MedicalScholarlyArticle, ContactPage, Report, TechArticle, LegalDocument, FAQPage, MedicalOrganization,LocalBusiness, WebSite, Industry.

### Schema مقترح للصفحات المهمة

- الصفحة الرئيسية: `Organization` + `WebSite` + `WebPage`.
- صفحات الخدمات: `Service` + `WebPage` + `BreadcrumbList`.
- صفحات المقالات: `Article` + `BreadcrumbList`.
- صفحات المناقصات/demo العامة: `SoftwareApplication` أو `WebApplication` فقط إذا كان المنتج قابلًا للتجربة فعلاً، مع `WebPage`.
- صفحات About/Contact: `AboutPage`, `ContactPage`.
- FAQ: فقط عندما يوجد FAQ مرئي في الصفحة، ولا تضف تقييمات أو Reviews.

## Performance / Speed

حجم CSS الكلي: 910.2KB  
حجم JS/MJS الكلي: 2343.0KB  
حجم الصور الكلي: 0.87MB  

Performance Score الحالي تقديريًا: 62%  
Mobile Performance Score: 58%  
Desktop Performance Score: 65%  
Target Score بعد الإصلاح: 90%+

| المشكلة | Mobile Impact | Desktop Impact | الصفحات المتأثرة | الحل | الكود المقترح | الأولوية |
|---|---|---|---|---|---|---|
| صور بدون أبعاد ثابتة | CLS محتمل | CLS أقل لكنه قائم |  | إضافة width/height أو aspect-ratio | `<img src="..." width="800" height="450" loading="lazy" alt="...">` | High |
| تعدد ملفات JS/CSS | TBT/INP محتمل | تأثير أقل | صفحات تستخدم 135 JS و37 CSS في المشروع | defer للسكربتات غير الحرجة والحفاظ على critical CSS | `<script src="/frontend/js/page-enhancements.min.js" defer></script>` | Medium |
| صور أكبر من 200KB | LCP/FCP | LCP | لا توجد ضمن العينة | WebP/AVIF وضغط الحجم | `<picture><source srcset="hero.avif" type="image/avif"><img ...></picture>` | Medium |
| لا يوجد Lighthouse مباشر في هذا التدقيق | قياس تقديري فقط | قياس تقديري فقط | كل الصفحات | تشغيل Lighthouse بعد النشر/محليًا | `npm run performance:budget` + Lighthouse | Medium |

## Mobile/Desktop UX

Mobile UX Score: 82%  
Desktop UX Score: 87%  
Overall UI/UX Score: 84%

| الجهاز | الصفحة | المشكلة | التأثير | الحل | كود CSS/HTML مقترح |
|---|---|---|---|---|---|
| Mobile/Desktop | services/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | ai-bots/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | smart-medical-archive/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | ai-workflows/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | smart-automation/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | sectors/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | consultation/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | contact/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | machine-learning/index.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |
| Mobile/Desktop | tenders/landing.html | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | `.section-cta{display:flex;gap:12px;flex-wrap:wrap}` |

## UI/UX Design Audit

| الصفحة | مشكلة UI/UX | التأثير | الحل | الكود أو التصميم المقترح | الأولوية |
|---|---|---|---|---|---|
| services/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| ai-bots/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| smart-medical-archive/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| ai-workflows/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| smart-automation/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| sectors/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| consultation/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| contact/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| machine-learning/index.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |
| tenders/landing.html | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | `.answer-block` + `.section-cta` | High |

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
| services/index.html | Data analytics intent | 💬 ابدأ رحلة التحول، استشارة مخصصة، ☎️ تواصل معنا، 💬 ابدأ رحلة التحول | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| ai-bots/index.html | AI agents intent | التواصل، طلب استشارة ذكاء اصطناعي، اطلب استشارة، احجز عرض توضيحي | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| smart-medical-archive/index.html | Healthcare AI intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| ai-workflows/index.html | Automation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| smart-automation/index.html | Automation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| sectors/index.html | Sector landing intent | احجز جلسة تشخيص، احجز جلسة تشخيص حسب القطاع | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| consultation/index.html | Conversion intent | احجز استشارة، تواصل معنا، ابدأ تقييم الجاهزية، راجع مسار الاستشارة | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| contact/index.html | Conversion intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| machine-learning/index.html | Commercial investigation intent | ابدأ رحلة التحول، تواصل معنا، ابدأ رحلة التحول، جرّب النظام مجاناً | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |
| tenders/landing.html | B2G / tenders intent | اطلب استشارة، احجز عرض توضيحي، تواصل معنا، جرّب محلل العقود | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |

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
| 404.html | تحسين | شبه يتيمة؛ Depth 49% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| 500.html | تحسين | شبه يتيمة؛ Depth 59% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| blog/building-ai-agents-practical-guide/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| bot/index.html | مراجعة index/noindex | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/ocr-demo/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/pricing/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| demo/resources/report-ai-saudi-2026/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| docs/privacy-policy-en.html | تحسين | شبه يتيمة؛ Depth 82% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| en/docs/docs.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| en/privacy-cookies/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| en/terms/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| error.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/appointment/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/dashboard/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/support-ai/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/supportAI/index.html | مراجعة index/noindex | شبه يتيمة؛ Depth 39% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| interview/pages/Visitor-registration/index.html | مراجعة index/noindex | شبه يتيمة؛ Depth 67% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| mais-OBM/index.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/ecommerce-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/energy-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/finance-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/healthcare-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/logistics-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| sectors/manufacturing-en.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/ai-scolecs.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/ai-scolecs/index.html | تحسين | Depth 39% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/ai-tenders-analysis.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/ai-tenders-analysis/index.html | تحسين | Depth 40% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/brightproject.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/brightproject/index.html | تحسين | Depth 39% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/brightsales.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/brightsales/index.html | تحسين | Depth 39% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/smart-hospital-management.html | تحسين | شبه يتيمة؛ Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| services/smart-hospital-management/index.html | تحسين | Depth 39% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/data-analyzer/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/data-quality/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |
| try/text-analysis/index.html | مراجعة index/noindex | Depth 100% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | Medium |

## Topical Authority Plan

| Cluster | الصفحة الأساسية | الصفحات الداعمة الحالية | صفحات جديدة مقترحة | الكلمات المفتاحية | روابط داخلية مقترحة |
|---|---|---|---|---|---|
| الذكاء الاصطناعي للمؤسسات | `/services/` | `/blog/ai-guide-saudi-business/`, `/blog/vision-2030-ai-opportunities/` | `/enterprise-ai-saudi/` | استشارات الذكاء الاصطناعي السعودية، شركة ذكاء اصطناعي في السعودية | من homepage والخدمات إلى المقالات ثم CTA |
| وكلاء الذكاء الاصطناعي | `/ai-agent/` | `/blog/ai-agents-business-guide/`, `/blog/building-ai-agents-guide/` | `/ai-agent/governance/` | وكلاء ذكاء اصطناعي للمؤسسات | من bots إلى ai-agent والعكس |
| أتمتة الأعمال | `/smart-automation/` | `/blog/process-automation/`, `/blog/smart-automation-benefits/` | `/rpa-saudi/` | أتمتة العمليات الروبوتية RPA | من services وblog إلى smart-automation |
| تحليل البيانات | `/data-analysis/` | `/blog/business-intelligence-saudi/`, `/blog/power-bi-saudi-guide/` | `/data-governance-saudi/` | تحليل البيانات الضخمة السعودية، NDMO | من data-analysis إلى governance |
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
<!-- File: services/index.html -->
<!-- Replace or verify inside <head>: -->
<title>خدمات Bright AI في السعودية \| وكلاء ذكاء اصطناعي وأتمتة أعمال وتحليل بيانات</title>
<meta name="description" content="خدمات ومنتجات Bright AI للشركات في السعودية: وكلاء ذكاء اصطناعي، أتمتة أعمال، تحليل بيانات، تسويق ذكي، خدمة عملاء، موارد بشرية، تقارير تشغيلية وسلاسل توريد.">
<link rel="canonical" href="https://brightai.site/services/">
<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/services/">
<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebPage", "url": "https://brightai.site/services/", "name": "خدمات Bright AI في السعودية \| وكلاء ذكاء اصطناعي وأتمتة أعمال وتحليل بيانات", "description": "خدمات ومنتجات Bright AI للشركات في السعودية: وكلاء ذكاء اصطناعي، أتمتة أعمال، تحليل بيانات، تسويق ذكي، خدمة عملاء، موارد بشرية، تقارير تشغيلية وسلاسل توريد.", "inLanguage": "ar-SA" }</script>
```
```html
<!-- File: services/index.html -->
<section class="answer-block" aria-labelledby="answer-title">
  <h2 id="answer-title">إجابة مختصرة قابلة للاقتباس</h2>
  <p>تساعد خدمات ذكاء اصطناعي وأتمتة أعمال تساعد فريقك يشتغل أسرع وبقرار أوضح في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.</p>
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

## Prompts تنفيذ كل ما يحتويه التقرير

### Prompt 1: تنفيذ إصلاحات الزحف والفهرسة التقنية

```text
بناءً على تقرير Bright AI الشامل في reports/brightai_full_seo_ai_audit_2026-04-25.md، نفّذ إصلاحات Technical SEO فقط.

المطلوب:
1) راجع robots.txt وتأكد أنه لا يحتوي أي Disallow يمنع صفحات الموقع أو نماذج العملاء التجريبية.
2) راجع _headers وrender.yaml وتأكد من عدم وجود X-Robots-Tag: noindex على صفحات الموقع أو demo أو try أو tenders أو interview أو mais-OBM.
3) راجع meta robots داخل كل HTML وتأكد أن صفحات النماذج التجريبية index, follow.
4) لا تغيّر noindex لصفحات الأخطاء 404/500/error إلا إذا طُلب صراحة.
5) تحقق من canonical لكل صفحة عامة.
6) تحقق من sitemap.xml وأن الصفحات العامة المهمة موجودة فيه.
7) تحقق من hreflang للصفحات الثنائية ar-SA/en-SA فقط عندما تكون النسخة المقابلة موجودة فعلاً على القرص.
8) أصلح broken links إن وجدت.
9) لا تضف noindex لأي صفحة عامة أو demo.

بعد التنفيذ شغّل:
npm run seo:check
npm run seo:gate
npm run internal-links:audit

أعطني:
- الملفات المعدلة.
- المشاكل التي أُغلقت.
- أي مشاكل متبقية مع سبب عدم إصلاحها.
```

### Prompt 2: تنفيذ On-Page SEO وMetadata

```text
بناءً على جدول SEO Audit واقتراحات Title/Meta في تقرير Bright AI، حسّن On-Page SEO للصفحات ذات الأولوية.

المطلوب:
1) عالج duplicate titles وduplicate meta descriptions.
2) حافظ على H1 واحد فقط في كل صفحة.
3) اجعل Title لكل صفحة مناسبًا للسوق السعودي ولا يتجاوز الطول العملي.
4) اجعل Meta Description فريدة وتزيد CTR بدون مبالغة أو ادعاءات غير موثقة.
5) لا تجعل كل الصفحات تستهدف نفس الكلمات.
6) اربط كل صفحة بنية البحث الخاصة بها من Keyword Mapping.
7) لا تغيّر URL أو canonical إلا إذا كان الخطأ مثبتًا من التقرير.

بعد التنفيذ أعطني جدول:
| الصفحة | Title قبل | Title بعد | Meta قبل | Meta بعد | الكلمة المستهدفة | سبب التعديل |
```

### Prompt 3: تنفيذ Keyword Mapping ومنع Cannibalization

```text
استخدم ملف reports/keywords strategy 2026.xlsx وجدول Keyword Mapping في التقرير لتوزيع الكلمات المفتاحية على الصفحات.

المطلوب:
1) صنّف الكلمات إلى Main, Secondary, Long-tail, Question, Commercial, Informational, Transactional, B2B, B2G, Saudi local.
2) خصص كلمة رئيسية واحدة لكل صفحة مهمة.
3) حدد الكلمات التي لا تملك صفحة مناسبة.
4) اقترح صفحات جديدة فقط عندما لا توجد صفحة مناسبة فعلًا.
5) عالج أي Cannibalization واضح بين صفحات متشابهة.
6) لا تحشو الكلمات داخل النص.

أعطني جدول:
| الكلمة | النية | الصفحة النهائية | هل تم تعديل الصفحة؟ | سبب الاختيار | خطر Cannibalization |
```

### Prompt 4: تنفيذ AEO / GEO / AI Search

```text
بناءً على قسم AEO/GEO/AI Search Audit وGoogle AI Mode Citation Readiness، حسّن الصفحات المهمة لتكون قابلة للاقتباس في AI Overviews وGoogle AI Mode وChatGPT Search وPerplexity.

المطلوب:
1) أضف Answer Block أعلى الصفحات ذات الأولوية.
2) أضف FAQ مرئي فقط عندما تخدم الأسئلة نية البحث.
3) أضف جدول مقارنة مختصر عند وجود بدائل أو حالات استخدام.
4) أضف فقرة "متى تحتاج هذه الخدمة؟".
5) أضف فقرة "كيف تساعد Bright AI؟".
6) أضف فقرة "لماذا هذا مهم في السعودية؟".
7) أضف Trust/Evidence block بدون اختراع أرقام أو عملاء أو شهادات.
8) اجعل الجمل مباشرة وقابلة للاقتباس.
9) لا تضف FAQPage schema إلا إذا أضفت FAQ مرئيًا في الصفحة.

بعد التنفيذ أعطني:
| الصفحة | Answer Block أُضيف؟ | FAQ أُضيف؟ | Schema أُضيف؟ | AI Citation improvement المتوقع |
```

### Prompt 5: تنفيذ Deep Authoritative Content

```text
وسّع محتوى الصفحات المهمة حسب Deep Authoritative Content Plan في التقرير.

المطلوب لكل صفحة:
1) تعريف واضح.
2) المشكلة التي تحلها.
3) لمن هذه الصفحة؟
4) حالات استخدام في السعودية.
5) طريقة التنفيذ.
6) الفوائد العملية.
7) المخاطر الشائعة.
8) مؤشرات النجاح.
9) مقارنة مع البدائل.
10) أسئلة شائعة.
11) لماذا Bright AI؟
12) CTA واضح.

الشروط:
- لا تكرر نفس النص بين الصفحات.
- لا تختلق أرقامًا أو عملاء أو شهادات.
- حافظ على نبرة B2B/B2G سعودية هادئة ومباشرة.
- لا تغيّر التصميم جذريًا.

أعطني ملخصًا لكل صفحة:
| الصفحة | الأقسام المضافة | الكلمة المستهدفة | عدد الكلمات قبل/بعد | الروابط الداخلية المضافة |
```

### Prompt 6: تنفيذ Structured Data / Schema

```text
بناءً على قسم Structured Data في التقرير، راجع JSON-LD في كل صفحة مهمة.

المطلوب:
1) تحقق من JSON-LD الموجود وأنه صالح.
2) أضف BreadcrumbList للصفحات التي تحتاجه.
3) أضف Service schema لصفحات الخدمات فقط.
4) أضف WebPage schema عندما يكون ناقصًا.
5) أضف Article schema للمقالات فقط.
6) أضف AboutPage وContactPage للصفحات المناسبة.
7) أضف FAQPage فقط إذا يوجد FAQ مرئي.
8) لا تضف HowTo أو Reviews أو AggregateRating أو عملاء أو جوائز غير موجودة.

بعد التنفيذ شغّل فحص JSON-LD محلي إن أمكن، ثم أعطني:
| الصفحة | Schema قبل | Schema بعد | سبب الإضافة | مخاطر متبقية |
```

### Prompt 7: تنفيذ Internal Linking وSite Architecture

```text
بناءً على Click Depth والصفحات اليتيمة وخطة Internal Linking في التقرير، حسّن الربط الداخلي.

المطلوب:
1) قرّب الصفحات التجارية المهمة إلى ≤3 نقرات.
2) أضف روابط سياقية طبيعية من المقالات إلى صفحات الخدمات.
3) اربط صفحات الخدمات بالمقالات الداعمة.
4) حسّن navigation وfooter بدون حشو روابط.
5) أضف breadcrumbs للصفحات العميقة.
6) عالج الصفحات اليتيمة أو شبه اليتيمة.
7) حافظ على anchor text طبيعي وغير محشو.

بعد التنفيذ شغّل:
npm run internal-links:audit

أعطني:
| من الصفحة | إلى الصفحة | Anchor Text | نوع الرابط | سبب الربط |
```

### Prompt 8: تنفيذ Performance / Page Speed

```text
بناءً على قسم Performance / Speed، نفّذ تحسينات أداء آمنة لا تغيّر التصميم.

المطلوب:
1) أضف width وheight للصور التي تفتقدها.
2) أضف loading="lazy" للصور غير الحرجة.
3) أضف fetchpriority="high" فقط لصورة LCP الواضحة.
4) استخدم decoding="async" حيث يناسب.
5) أضف defer للسكربتات غير الحرجة.
6) لا تستخدم CDN خارجي جديد.
7) لا تحذف ملفات إلا إذا ثبت أنها غير مستخدمة.
8) اقترح WebP/AVIF للصور الكبيرة بدل استبدال عشوائي.
9) عالج CLS المتوقع من الصور والجداول.

بعد التنفيذ شغّل:
npm run performance:budget
npm run seo:gate

أعطني:
| التحسين | الملفات | أثره على LCP/CLS/INP | تحقق |
```

### Prompt 9: تنفيذ Mobile/Desktop UX وUI Design

```text
بناءً على Mobile/Desktop UX وUI/UX Design Audit، حسّن تجربة الاستخدام دون إعادة تصميم كاملة.

المطلوب:
1) حسّن وضوح Hero في الصفحات المهمة.
2) حسّن CTA visibility.
3) أضف answer/trust/CTA blocks بتصميم متسق.
4) عالج overflow للجداول والعناصر العريضة.
5) حسّن tap targets لتكون 48px على الأقل.
6) حسّن focus states.
7) حافظ على RTL واستخدم logical CSS properties.
8) لا تستخدم transform: scaleX(-1).
9) لا تغيّر هوية الموقع جذريًا.

بعد التنفيذ اختبر الجوال والسطح المكتبي بصريًا إن أمكن، ثم أعطني:
| الصفحة | المشكلة | الحل | CSS/HTML المعدل | أثر UX |
```

### Prompt 10: تنفيذ Accessibility

```text
بناءً على قسم Accessibility، أصلح مشاكل الوصول الأساسية.

المطلوب:
1) أضف alt وصفي للصور غير الزخرفية.
2) أضف alt فارغ للصور الزخرفية فقط.
3) تأكد من labels للنماذج.
4) حسّن aria-label للأزرار والروابط الأيقونية.
5) حسّن focus-visible.
6) أضف reduced motion fallback.
7) راجع heading order.
8) لا تغيّر النصوص التجارية إلا عند الحاجة.

أعطني:
| المشكلة | الصفحة | الإصلاح | الكود | تحقق |
```

### Prompt 11: تنفيذ Conversion Optimization

```text
بناءً على Conversion Optimization في التقرير، حسّن مسار التحويل للصفحات التجارية.

المطلوب:
1) CTA واضح above the fold.
2) CTA بعد أقسام القيمة.
3) CTA بعد Trust/Evidence.
4) نص زر مختلف حسب نية الصفحة.
5) نص داعم يخفف الاعتراضات.
6) ربط مباشر إلى /consultation/ أو /contact/ حسب السياق.
7) لا تضف نماذج طويلة دون حاجة.

أعطني:
| الصفحة | نية الزائر | CTA قبل | CTA بعد | مكان CTA | النص الداعم |
```

### Prompt 12: تنفيذ Topical Authority والصفحات الجديدة

```text
بناءً على Topical Authority Plan، أنشئ أو خطط الصفحات الجديدة المقترحة فقط بعد التأكد من عدم وجود صفحة قائمة تؤدي نفس النية.

المطلوب:
1) راجع الصفحات الحالية قبل إنشاء أي URL جديد.
2) أنشئ الصفحات ذات الأولوية العالية فقط.
3) أضف Title وMeta وH1 وOutline وSchema وBreadcrumbs.
4) اربط الصفحة الجديدة من cluster مناسب.
5) أضفها إلى sitemap إذا كانت عامة.
6) لا تنشئ صفحات رقيقة.

الصفحات المرشحة:
- /enterprise-ai-saudi/
- /ai-governance-pdpl-ndmo/
- /rpa-saudi/
- /government-ai-procurement/

أعطني:
| الصفحة الجديدة | سبب الإنشاء | الكلمات المستهدفة | الروابط الداخلة | الروابط الخارجة | حالة sitemap |
```

### Prompt 13: تنفيذ Content Pruning / Consolidation

```text
بناءً على Content Pruning في التقرير، راجع الصفحات الضعيفة أو المتكررة.

المطلوب:
1) لا تحذف أي صفحة دون دليل قوي.
2) صنّف كل صفحة إلى: تحسين، دمج، إبقاء، noindex، redirect.
3) لا تستخدم noindex لصفحات النماذج التجريبية للعملاء.
4) إذا وجدت صفحة duplicate حقيقية، اقترح canonical أو redirect فقط مع دليل.
5) إذا لا توجد وجهة بديلة آمنة، أنشئ تقريرًا ولا تحذف.

أعطني:
| الصفحة | القرار | الدليل | الإجراء | Redirect إن وجد | المخاطر |
```

### Prompt 14: مراجعة شاملة بعد التنفيذ

```text
بعد تنفيذ إصلاحات التقرير، أعد تدقيق مشروع Bright AI كاملًا.

المطلوب:
1) افحص كل ملفات HTML.
2) قارن نتائج التقرير قبل/بعد.
3) تحقق من robots.txt و_ headers وrender.yaml.
4) تحقق من عدم وجود noindex على صفحات demo/try/tenders/interview/mais-OBM.
5) تحقق من canonical وhreflang.
6) تحقق من sitemap.
7) تحقق من schema.
8) تحقق من internal links.
9) تحقق من الأداء.
10) تحقق من UX/accessibility.

شغّل:
npm run seo:check
npm run seo:gate
npm run internal-links:audit
npm run performance:budget

أعطني:
| المحور | النتيجة قبل | النتيجة بعد | التحسن | الدليل |

ثم اختم بـ:
- ما تم إصلاحه فعلاً.
- ما فشل.
- ما بقي قرارًا تحريرياً أو تجارياً.
- هل أصبح الموقع مؤهلًا أكثر لـ Google AI Mode؟ ولماذا؟
```
