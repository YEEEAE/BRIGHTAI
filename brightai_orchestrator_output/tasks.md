# خطة تنفيذ المتطلبات (Tasks)

هذه المهام منظمة لتنفيذ كامل متطلبات BrightAI Authority Orchestrator وفق الأولويات. الحالة الافتراضية: غير منفذ.

## المرحلة 0 — تحضير البيانات
- [x] استلام `site_url` النهائي والدومين المعتمد لضبط canonical وUTM. (brightai.site)
- [x] استلام بيانات Analytics (`ga_data`) إن توفرت وربطها مع الصفحات. (/Users/yzydalshmry/Desktop/BrightAI/تقارير للمشروع/الصفحات_والشاشات_عنوان_الصفحة_وفئة_الشاشة.csv)
- [x] تأكيد `crawl_limit` النهائي إذا كان مختلفاً عن 120. (اعتمد 120)

## المرحلة 1 — صفحات الملك (Command Pages)
- [x] إنشاء صفحة `/demo` مع H1 وMeta وCTA واضح (نسخة سعودية) + مسار تتبع CTA.
- [x] إنشاء صفحة `/demo/ocr-demo/` مع رفع ملف وتجربة فورية + عرض JSON.
- [x] إنشاء صفحة `/demo/resources/report-ai-saudi-2026/` بهبوط تحميل التقرير وCTA.
- [x] إنشاء صفحة `/demo/pricing/` بعرض الباقات + CTA ثانوي للاستشارة.
- [x] إضافة canonical + Open Graph لكل صفحة ملك.

## المرحلة 2 — الروابط الداخلية (Internal Linking)
- [x] تنفيذ أعلى 10 روابط من `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/internal_links_plan.csv`. (تم تنفيذ 12 رابط عالي الأولوية)
- [x] تنفيذ بقية الروابط عالية الأولوية (High).
- [x] تقليل نسبة الصفحات اليتيمة باستخدام `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/orphan_suggestions.json`.
- [x] إعادة قياس نسبة اليتيم بعد التنفيذ (الهدف < 5%). النتيجة: 1.9% (باستثناء صفحات 404/500).

## المرحلة 3 — تحسينات Technical SEO
- [x] إصلاح عناوين مكررة مثل "تم نقل الصفحة" وتحديثها بعناوين دلالية.
- [x] إضافة Meta description للصفحات الناقصة (تمت تغطية جميع الصفحات الناقصة).
- [x] إضافة H1 للصفحات الناقصة (تمت تغطية جميع الصفحات الناقصة).
- [x] تحديث `sitemap.xml` و`robots.txt` وإضافة canonical عند التكرار.

## المرحلة 4 — الأداء وCore Web Vitals
- [x] ضغط صور الهيرو الثقيلة في الصفحة الرئيسية (WebP/AVIF). (تم إنشاء نسخ WebP مصغرة للصور الثقيلة في الصفحة الرئيسية)
- [x] تفعيل `loading="lazy"` للصور غير المرئية. (على صور البطاقات الثقيلة في الصفحة الرئيسية)
- [x] تحسين تحميل الخطوط الأساسية (preload/async) في الصفحة الرئيسية وصفحات الملك.
- [x] تقليل حظر العرض عبر defer للأيقونات + preconnect/dns-prefetch للمصادر الخارجية.
- [x] تأخير الخلفيات والأنيميشن الثقيلة إلى idle لتقليل LCP وCLS.
- [x] توطين Tailwind محلياً وإزالة تحميل CDN على مستوى الموقع بالكامل.
- [x] توطين Iconify/Lucide وإزالة استدعاءات الأيقونات الخارجية عبر API/CDN.
- [x] توطين AOS/Swiper/GSAP وربطها محلياً بدل CDN.
- [ ] قياس LCP على الجوال وضبطه أقل من 2.5 ثانية.

## المرحلة 5 — تكاملات Groq (UX مباشر)
- [x] تنفيذ بث Streaming داخل `/demo` (SSE/WebSocket).
- [x] إضافة ذاكرة جلسة قصيرة للديمو (session context).
- [x] تنفيذ استخراج JSON بعد OCR في `/demo/ocr-demo/`.
- [x] توليد FAQ ديناميكي للتقرير وتحويله إلى JSON-LD.
- [x] تطبيق rate-limit + حماية مفاتيح API (Backend proxy).

## المرحلة 6 — Schema / JSON-LD
- [ ] إدراج `demo.jsonld` في صفحة `/demo`.
- [ ] إدراج `ocr-demo.jsonld` في صفحة `/demo/ocr-demo/`.
- [ ] إدراج `report-ai-saudi-2026.jsonld` في صفحة التقرير.
- [ ] إدراج `pricing.jsonld` في صفحة الأسعار.

## المرحلة 7 — محتوى سعودي داعم
- [ ] إنتاج 4 مقالات سعودية داعمة تربط مباشرة بصفحات الملك.
- [ ] إدراج روابط داخلية التحويل من المقالات إلى صفحات الملك.
- [ ] تحسين العناوين والوصف لرفع CTR.

## المرحلة 8 — القياس والتحسين
- [ ] تفعيل تتبع CTA وبدء الديمو ورفع ملفات OCR.
- [ ] تنفيذ اختبار A/B لنسخ CTA في `/demo` و`/demo/pricing/`.
- [ ] مراجعة CTR وLCP بعد 2–4 أسابيع وتحسين النصوص.

## مخرجات مرجعية
- خريطة السلطة: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/authority_map.json`
- خطة الروابط الداخلية: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/internal_links_plan.csv`
- Playbook أسبوعي: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/playbook_weekly.json`
- تكاملات Groq: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/groq_integration_snippets.md`
- مقترحات اليتيم: `/Users/yzydalshmry/Desktop/BrightAI/brightai_orchestrator_output/orphan_suggestions.json`

**ملاحظة تنظيمية:** تم نقل صفحات الملك لتكون جميعها داخل `/frontend/pages/demo/` كما طُلب، وأصبحت المسارات الجديدة تحت `/demo/`.
