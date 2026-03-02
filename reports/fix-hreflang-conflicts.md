# Hreflang Conflicts Fix Report
**Date:** 2026-03-03
**Scope:** إصلاح تعارضات hreflang/canonical حسب تقرير Semrush (2026-03-02)

## التشخيص
- السبب الجذري كان في `scripts/html-seo-governor.mjs`: توليد canonical/hreflang كان يعتمد مسار الملف بدل مسار URL الفعلي النهائي (200).
- آلية الإصلاح السابقة كانت تضيف/تعدل جزئيًا فقط، بدون إزالة القيم المكررة أو غير المتوقعة لـ hreflang.
- فحص CI لم يكن يستخدم نفس normalization على canonical/hreflang، مما يسبب drift مع الوقت.

## التعديلات المنفذة
- إنشاء ملف جديد: `scripts/seo-url-map.mjs`
  - توحيد mapping من مسار الملف إلى public URL canonical.
  - توحيد URL normalization (إزالة trailing slash، إزالة query/hash، توحيد encoding).
  - توفير helper لاكتشاف counterpart (ar/en).
- تحديث `scripts/html-seo-governor.mjs`
  - استخدام mapping موحد للـ canonical.
  - إصلاح canonical إذا كان مفقودًا أو غير متطابق.
  - فرض hreflang set ثابت: `ar-SA`, `en-SA` (عند توفر نسخة EN), `x-default` -> النسخة العربية.
  - إزالة hreflang tags الزائدة/المكررة ثم إعادة حقن المجموعة الصحيحة فقط.
- تحديث `scripts/seo-ci-check.mjs`
  - بناء expected canonical/hreflang ديناميكيًا من نفس mapping helper.
  - مقارنة canonical/hreflang عبر normalized URLs لضمان منع regression.

## نتائج قبل/بعد
| Check | Before | After |
|---|---:|---:|
| `npm run seo:check` (Errors) | 74 | 0 |
| `npm run seo:html:check` (Pages with issues) | 192 | 0 |
| `npm run seo:html:check` (Missing/mismatched hreflang) | 192 | 0 |

## أوامر التحقق المنفذة
```bash
npm run seo:check
npm run seo:html:check
npm run performance:budget
```

## قائمة الملفات المعدلة
- `scripts/seo-url-map.mjs`
- `scripts/html-seo-governor.mjs`
- `scripts/seo-ci-check.mjs`

## Files Updated (84)

- `404.html` (canonical, hreflang)
- `500.html` (canonical, hreflang)
- `brightai-platform/public/404.html` (canonical, hreflang)
- `brightai-platform/public/index.html` (canonical, hreflang)
- `frontend/pages/blogger/ production-line.html` (canonical, hreflang)
- `frontend/pages/blogger/astr.doc.html` (canonical, hreflang)
- `frontend/pages/blogger/Generative artificial intelligence.html` (canonical, hreflang)
- `frontend/pages/blogger/generative-artificial-intelligence-2.html` (canonical, hreflang)
- `frontend/pages/blogger/production-line-2.html` (canonical, hreflang)
- `frontend/pages/blogger/أتمتة الذكاء الاصطناعي_ حلول مخصصة لتحليل المشاريع وتحسين محركات البحث (1).html` (canonical, hreflang)
- `frontend/pages/blogger/أتمتة العمليات باستخدام الذكاء الاصطناعي_ الطريق إلى تحسين الكفاءة التشغيلية.html` (canonical, hreflang)
- `frontend/pages/blogger/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html` (canonical, hreflang)
- `frontend/pages/blogger/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html` (canonical, hreflang)
- `frontend/pages/blogger/استشارات الذكاء الاصطناعي_ كيف تسهم في تحقيق التحول الرقمي للشركات.html` (canonical, hreflang)
- `frontend/pages/blogger/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات.html` (canonical, hreflang)
- `frontend/pages/blogger/الأتمتة الصناعية وأتمتة المهام المتكررة_ كيفية تحسين الكفاءة الإنتاجية.html` (canonical, hreflang)
- `frontend/pages/blogger/الأتمتة المالية وأتمتة الموارد البشرية_ حلول مستقبلية للشركات الذكية.html` (canonical, hreflang)
- `frontend/pages/blogger/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html` (canonical, hreflang)
- `frontend/pages/blogger/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html` (canonical, hreflang)
- `frontend/pages/blogger/التحول الرقمي وأتمتة العمليات_ كيف يمكن للذكاء الاصطناعي أن يقود الابتكار.html` (canonical, hreflang)
- `frontend/pages/blogger/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html` (canonical, hreflang)
- `frontend/pages/blogger/التعلم الآلي والرؤية الحاسوبية_ مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور.html` (canonical, hreflang)
- `frontend/pages/blogger/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html` (canonical, hreflang)
- `frontend/pages/blogger/الذكاء-الاصطناعي-و-التسويق.html` (canonical, hreflang)
- `frontend/pages/blogger/تحليل-البيانات.html` (canonical, hreflang)
- `frontend/pages/blogger/تعلم-الآلة-و-الأعمال.html` (canonical, hreflang)
- `frontend/pages/blogger/مقال-تحليل.html` (canonical, hreflang)
- `frontend/pages/botAI/BrightMath.html` (canonical, hreflang)
- `frontend/pages/botAI/BrightProject.html` (canonical, hreflang)
- `frontend/pages/botAI/BrightRecruiter.html` (canonical, hreflang)
- `frontend/pages/botAI/BrightSales.html` (canonical, hreflang)
- `frontend/pages/botAI/BrightSupport.html` (canonical, hreflang)
- `frontend/pages/docs/ai-agent-en.html` (hreflang)
- `frontend/pages/docs/ai-agent.html` (hreflang)
- `frontend/pages/docs/ai-bots-en.html` (hreflang)
- `frontend/pages/docs/ai-bots.html` (hreflang)
- `frontend/pages/docs/consultation-en.html` (hreflang)
- `frontend/pages/docs/consultation.html` (hreflang)
- `frontend/pages/docs/contact-en.html` (hreflang)
- `frontend/pages/docs/contact.html` (hreflang)
- `frontend/pages/docs/data-analysis-en.html` (hreflang)
- `frontend/pages/docs/data-analysis.html` (hreflang)
- `frontend/pages/docs/faq-en.html` (hreflang)
- `frontend/pages/docs/faq.html` (hreflang)
- `frontend/pages/docs/privacy-policy-en.html` (hreflang)
- `frontend/pages/docs/privacy-policy.html` (hreflang)
- `frontend/pages/docs/services-overview-en.html` (hreflang)
- `frontend/pages/docs/services-overview.html` (hreflang)
- `frontend/pages/docs/smart-automation-en.html` (hreflang)
- `frontend/pages/docs/smart-automation.html` (hreflang)
- `frontend/pages/docs/solutions-bi-en.html` (hreflang)
- `frontend/pages/docs/solutions-bi.html` (hreflang)
- `frontend/pages/docs/solutions-crm-en.html` (hreflang)
- `frontend/pages/docs/solutions-crm.html` (hreflang)
- `frontend/pages/docs/solutions-finance-en.html` (hreflang)
- `frontend/pages/docs/solutions-finance.html` (hreflang)
- `frontend/pages/docs/solutions-healthcare-en.html` (hreflang)
- `frontend/pages/docs/solutions-healthcare.html` (hreflang)
- `frontend/pages/docs/solutions-hr-en.html` (hreflang)
- `frontend/pages/docs/solutions-hr.html` (hreflang)
- `frontend/pages/docs/solutions-interview-en.html` (hreflang)
- `frontend/pages/docs/solutions-interview.html` (hreflang)
- `frontend/pages/docs/solutions-logistics-en.html` (hreflang)
- `frontend/pages/docs/solutions-logistics.html` (hreflang)
- `frontend/pages/docs/solutions-ocr-en.html` (hreflang)
- `frontend/pages/docs/solutions-ocr.html` (hreflang)
- `frontend/pages/docs/solutions-retail-en.html` (hreflang)
- `frontend/pages/docs/solutions-retail.html` (hreflang)
- `frontend/pages/docs/solutions-supply-chain-en.html` (hreflang)
- `frontend/pages/docs/solutions-supply-chain.html` (hreflang)
- `frontend/pages/docs/terms-and-conditions-en.html` (hreflang)
- `frontend/pages/docs/terms-and-conditions.html` (hreflang)
- `frontend/pages/interview/g.html` (hreflang)
- `frontend/pages/interview/pages/admin.html` (hreflang)
- `frontend/pages/interview/pages/appointment/index.html` (hreflang)
- `frontend/pages/interview/pages/dashboard/index.html` (hreflang)
- `frontend/pages/interview/pages/support-ai.html` (hreflang)
- `frontend/pages/interview/pages/supportAI.html` (hreflang)
- `frontend/pages/interview/pages/Visitor-registration/index.html` (hreflang)
- `frontend/pages/interview/Presentation.html` (hreflang)
- `frontend/pages/offline/index.html` (hreflang)
- `frontend/pages/terms/index.html` (canonical, hreflang)
- `الاهم/saudi-keyword-targeting-complete.html` (description, canonical, hreflang)
- `الاهم/تقارير للمشروع/SEO_Codex_Report_BrightAI.html` (canonical, hreflang)

## حالة القبول
- اختفت أخطاء hreflang المرتبطة من `seo checks`.
- لم يحدث كسر في canonical الحالي، والفحص النهائي يمر بدون أخطاء.
