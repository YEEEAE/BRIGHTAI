# جرد النماذج التجريبية لصفحة الخدمات

تاريخ الجرد: 2026-04-25

## نطاق الجرد

- صفحة الخدمات الرئيسية: `/services/`، والملف الفعلي: `services/index.html`.
- صفحات المنتجات المنشورة بصيغة: `/services/[slug]/`.
- الملفات الفعلية في المستودع بصيغة: `services/[slug].html`.
- حالة الربط تعتمد على وجود `demoUrl` في `services/index.html` ووجود زر/قسم النموذج في صفحة المنتج عند فحص الملفات الحالية.

## مجلدات النماذج التجريبية الموجودة

| المجلد | الملفات/المسارات الموجودة | ملاحظة |
|---|---|---|
| `/health/` | `index.html` | نموذج بيانات صحية/إدارة صحية |
| `/interview/` | `index.html`, `pages/` | نموذج الاستقطاب والتوظيف الذكي |
| `/smart-medical-archive/` | `index.html`, `medical-dashboard.js`, `medical-extraction.js`, `medical-gemini-client.js`, `medical-search.js`, `medical-upload.js`, `smart-ai-logic.js`, `system-unified.css`, `system-unified.js` | نموذج الأرشيف الطبي |
| `/tenders/` | `api-config.js`, `api-config.min.js`, `compare.html`, `dashboard.html`, `index.html`, `landing.html`, `render-backend`, `reports.html`, `settings.html`, `templates.html` | نموذج تحليل المناقصات |
| `/ai-scolecs/` | `index.html` | نموذج المنصة التعليمية |
| `/ai-bots/` | `BrightMath/`, `BrightProject/`, `BrightRecruiter/`, `BrightSales/`, `BrightSupport/`, `index.html` | نماذج بوتات Bright AI |
| `/demo/` | `index.html`, `ocr-demo/`, `pricing/`, `resources/` | نماذج عامة حالية، ولا توجد النماذج العشرة الجديدة بعد |
| `/sectors/` | `ecommerce.html`, `ecommerce/`, `manufacturing.html`, `manufacturing/`, `finance.html`, `healthcare.html`, `logistics.html`, `energy.html` مع نسخ `en` | صفحات قطاعات مستخدمة كنماذج قريبة لبعض الخدمات |
| `/try/` | `data-analyzer/`, `data-quality/`, `index.html`, `text-analysis/` | نماذج تحليل بيانات وتجارب عامة |

## جرد المنتجات وحالة النماذج

| # | المنتج | صفحة الخدمة | الملف الفعلي | النموذج التجريبي المرتبط | حالة الربط |
|---:|---|---|---|---|---|
| 1 | نظام الاستقطاب (توظيف ذكي) | `/services/smart-hiring-system/` | `services/smart-hiring-system.html` | `/interview/` + `/ai-bots/BrightRecruiter/` | ✅ مربوط |
| 2 | نظام سجلات (أرشيف طبي) | `/services/medical-archive/` | `services/medical-archive.html` | `/smart-medical-archive/` + `/health/` | ✅ مربوط |
| 3 | نظام التحليل (منصة بيانات) | `/services/data-platform/` | `services/data-platform.html` | `/try/data-analyzer/` | ✅ مربوط |
| 4 | نظام منصة تعليمية متكاملة ذكية | `/services/ai-scolecs/` | `services/ai-scolecs.html` | `/ai-scolecs/` | ✅ مربوط |
| 5 | نظام إدارة المستشفيات الذكية | `/services/smart-hospital-management/` | `services/smart-hospital-management.html` | `/health/` | ✅ مربوط |
| 6 | أتمتة إدارة البيانات والوثائق | `/services/document-automation/` | `services/document-automation.html` | `/demo/ocr-demo/` | ✅ مربوط |
| 7 | أتمتة خدمة العملاء | `/services/customer-service-automation/` | `services/customer-service-automation.html` | `/ai-bots/BrightSupport/` | ✅ مربوط |
| 8 | أتمتة إدارة الموارد البشرية | `/services/hr-automation/` | `services/hr-automation.html` | `/demo/hr-automation/` | ❌ يحتاج إنشاء |
| 9 | أتمتة التسويق الرقمي | `/services/marketing-automation/` | `services/marketing-automation.html` | `/sectors/ecommerce/` | ✅ مربوط |
| 10 | أتمتة الموافقات الإدارية | `/services/approvals-automation/` | `services/approvals-automation.html` | `/demo/approvals-automation/` | ❌ يحتاج إنشاء |
| 11 | أتمتة التقارير التشغيلية | `/services/operational-reports-automation/` | `services/operational-reports-automation.html` | `/demo/operational-reports/` | ❌ يحتاج إنشاء |
| 12 | أتمتة تحسين سلسلة التوريد | `/services/supply-chain-optimization/` | `services/supply-chain-optimization.html` | `/sectors/manufacturing/` | ✅ مربوط |
| 13 | وكيل محلل بيانات | `/services/data-analyst-agent/` | `services/data-analyst-agent.html` | `/try/data-analyzer/` | ✅ مربوط |
| 14 | وكيل ذكاء اصطناعي مخصص | `/services/custom-ai-agent/` | `services/custom-ai-agent.html` | `/demo/custom-ai-agent/` | ❌ يحتاج إنشاء |
| 15 | وكيل تحليل المنافسين | `/services/competitor-analysis-agent/` | `services/competitor-analysis-agent.html` | `/demo/competitor-analysis/` | ❌ يحتاج إنشاء |
| 16 | وكيل تحسين محركات البحث SEO | `/services/seo-agent/` | `services/seo-agent.html` | `/demo/seo-agent/` | ❌ يحتاج إنشاء |
| 17 | وكيل تسويق | `/services/marketing-agent/` | `services/marketing-agent.html` | `/demo/marketing-agent/` | ❌ يحتاج إنشاء |
| 18 | وكيل اكتشاف الفرص والعملاء | `/services/lead-hunter/` | `services/lead-hunter.html` | `/demo/lead-hunter/` | ❌ يحتاج إنشاء |
| 19 | BrightProject - إدارة المشاريع الذكي في السعودية | `/services/brightproject/` | `services/brightproject.html` | `/ai-bots/BrightProject/` | ✅ مربوط |
| 20 | BrightSales - روبوت المبيعات الذكي في السعودية | `/services/brightsales/` | `services/brightsales.html` | `/ai-bots/BrightSales/` | ✅ مربوط |
| 21 | تحليل بيانات وسائل التواصل الاجتماعي متقدم | `/services/social-data-analysis/` | `services/social-data-analysis.html` | `/demo/social-data-analysis/` | ❌ يحتاج إنشاء |
| 22 | تحليل البيانات الصحية | `/services/health-data-analysis/` | `services/health-data-analysis.html` | `/health/` | ✅ مربوط |
| 23 | نظام تحليل المناقصات بالذكاء الاصطناعي | `/services/ai-tenders-analysis/` | `services/ai-tenders-analysis.html` | `/tenders/` | ✅ مربوط |
| 24 | استشارات الذكاء الاصطناعي | `/services/ai-consulting/` | `services/ai-consulting.html` | `/demo/ai-consulting/` | ❌ يحتاج إنشاء |

## ملخص الحالة

- إجمالي المنتجات في `services/index.html`: 24.
- منتجات مرتبطة بنموذج تجريبي حالي: 14.
- منتجات تحتاج إنشاء نموذج تجريبي جديد وربطه: 10.
- `services/index.html` يحتوي حالياً على زر النموذج فقط للمنتجات التي لديها `demoUrl`.
- الصفحات العشر الناقصة لا يظهر فيها زر "جرّب النموذج الأولي" ولا تحتوي على `potentialAction` مخصص للنموذج التجريبي حتى يتم إنشاء مسارات `/demo/` المطلوبة.

## قائمة المنتجات التي تحتاج إنشاء وربط في المراحل التالية

1. `/demo/custom-ai-agent/` لخدمة `/services/custom-ai-agent/`
2. `/demo/competitor-analysis/` لخدمة `/services/competitor-analysis-agent/`
3. `/demo/seo-agent/` لخدمة `/services/seo-agent/`
4. `/demo/marketing-agent/` لخدمة `/services/marketing-agent/`
5. `/demo/lead-hunter/` لخدمة `/services/lead-hunter/`
6. `/demo/social-data-analysis/` لخدمة `/services/social-data-analysis/`
7. `/demo/hr-automation/` لخدمة `/services/hr-automation/`
8. `/demo/approvals-automation/` لخدمة `/services/approvals-automation/`
9. `/demo/operational-reports/` لخدمة `/services/operational-reports-automation/`
10. `/demo/ai-consulting/` لخدمة `/services/ai-consulting/`

## ملاحظات للمرحلة 2

- الروابط المباشرة المطلوبة في المرحلة 2 موجودة فعلياً في `services/index.html` للمنتجات الـ 14 المرتبطة.
- صفحات المنتجات المرتبطة التي تم فحصها تحتوي على زر في منطقة البطل وقسم "جرّب النموذج الأولي قبل الشراء" و`potentialAction.target` مطابق للمسار المرتبط.
- منتج "نظام تحليل المناقصات بالذكاء الاصطناعي" موجود بسعر 799 ريال ومربوط في صفحة الخدمات ونموذجه `/tenders/`.
