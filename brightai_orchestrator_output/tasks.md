# خطة تنفيذ المتطلبات (Tasks)

هذه المهام منظمة لتنفيذ كامل متطلبات BrightAI Authority Orchestrator وفق الأولويات. الحالة الافتراضية: غير منفذ.

## المرحلة 0 — تحضير البيانات
- [ ] استلام `site_url` النهائي والدومين المعتمد لضبط canonical وUTM.
- [ ] استلام بيانات Analytics (`ga_data`) إن توفرت وربطها مع الصفحات.
- [ ] تأكيد `crawl_limit` النهائي إذا كان مختلفاً عن 120.

## المرحلة 1 — صفحات الملك (Command Pages)
- [ ] إنشاء صفحة `/demo` مع H1 وMeta وCTA واضح (نسخة سعودية) + مسار تتبع CTA.
- [ ] إنشاء صفحة `/ocr-demo` مع رفع ملف وتجربة فورية + عرض JSON.
- [ ] إنشاء صفحة `/resources/report-ai-saudi-2026` بهبوط تحميل التقرير وCTA.
- [ ] إنشاء صفحة `/pricing` بعرض الباقات + CTA ثانوي للاستشارة.
- [ ] إضافة canonical + Open Graph لكل صفحة ملك.

## المرحلة 2 — الروابط الداخلية (Internal Linking)
- [ ] تنفيذ أعلى 10 روابط من `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/internal_links_plan.csv`.
- [ ] تنفيذ بقية الروابط عالية الأولوية (High).
- [ ] تقليل نسبة الصفحات اليتيمة باستخدام `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/orphan_suggestions.json`.
- [ ] إعادة قياس نسبة اليتيم بعد التنفيذ (الهدف < 5%).

## المرحلة 3 — تحسينات Technical SEO
- [ ] إصلاح عناوين مكررة مثل "تم نقل الصفحة" وتحديثها بعناوين دلالية.
- [ ] إضافة Meta description للصفحات الناقصة (18 صفحة على الأقل).
- [ ] إضافة H1 للصفحات الناقصة (15 صفحة على الأقل).
- [ ] تحديث `sitemap.xml` و`robots.txt` وإضافة canonical عند التكرار.

## المرحلة 4 — الأداء وCore Web Vitals
- [ ] ضغط صور الهيرو الثقيلة في الصفحة الرئيسية (WebP/AVIF).
- [ ] تفعيل `loading="lazy"` للصور غير المرئية.
- [ ] تحسين تحميل الخطوط الأساسية (preload/async).
- [ ] قياس LCP على الجوال وضبطه أقل من 2.5 ثانية.

## المرحلة 5 — تكاملات Groq (UX مباشر)
- [ ] تنفيذ بث Streaming داخل `/demo` (SSE/WebSocket).
- [ ] إضافة ذاكرة جلسة قصيرة للديمو (session context).
- [ ] تنفيذ استخراج JSON بعد OCR في `/ocr-demo`.
- [ ] توليد FAQ ديناميكي للتقرير وتحويله إلى JSON-LD.
- [ ] تطبيق rate-limit + حماية مفاتيح API (Backend proxy).

## المرحلة 6 — Schema / JSON-LD
- [ ] إدراج `demo.jsonld` في صفحة `/demo`.
- [ ] إدراج `ocr-demo.jsonld` في صفحة `/ocr-demo`.
- [ ] إدراج `report-ai-saudi-2026.jsonld` في صفحة التقرير.
- [ ] إدراج `pricing.jsonld` في صفحة الأسعار.

## المرحلة 7 — محتوى سعودي داعم
- [ ] إنتاج 4 مقالات سعودية داعمة تربط مباشرة بصفحات الملك.
- [ ] إدراج روابط داخلية التحويل من المقالات إلى صفحات الملك.
- [ ] تحسين العناوين والوصف لرفع CTR.

## المرحلة 8 — القياس والتحسين
- [ ] تفعيل تتبع CTA وبدء الديمو ورفع ملفات OCR.
- [ ] تنفيذ اختبار A/B لنسخ CTA في `/demo` و`/pricing`.
- [ ] مراجعة CTR وLCP بعد 2–4 أسابيع وتحسين النصوص.

## مخرجات مرجعية
- خريطة السلطة: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/authority_map.json`
- خطة الروابط الداخلية: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/internal_links_plan.csv`
- Playbook أسبوعي: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/playbook_weekly.json`
- تكاملات Groq: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/groq_integration_snippets.md`
- مقترحات اليتيم: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/orphan_suggestions.json`
