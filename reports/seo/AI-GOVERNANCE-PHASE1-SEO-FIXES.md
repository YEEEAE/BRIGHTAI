# AI Governance Phase 1 SEO Fixes

## ما تم إصلاحه

- تم تثبيت `sitemap.xml` كقائمة URLs عادية بدل تحويله إلى sitemap index، لأن أدوات الفحص الحالية تتعامل معه كـ `urlset`.
- تم إنشاء `sitemap-solutions.xml` بخمس صفحات Solutions الأساسية فقط.
- تم تحديث `robots.txt` للإشارة إلى:
  - `sitemap.xml`
  - `sitemap-pages.xml`
  - `sitemap-legal.xml`
  - `sitemap-demo.xml`
  - `sitemap-solutions.xml`
  - `sitemap-images.xml`
- تم إبقاء `sitemap-kernel.xml` مولدًا، لكن تم استبعاده من `robots.txt` و`sitemap.xml` حتى لا يظهر كسطح فهرسة أساسي قبل حسم سياسة kernel.
- تم إضافة دعم `/solutions/<slug>/` في `scripts/seo-url-map.mjs`.
- تم إضافة alias آمن `npm run sitemap:all` لأن `render.yaml` يستدعيه.
- تم إنشاء `scripts/high-confidence-sitemap-config.mjs` حتى يعمل `seo:gate` بدل الفشل بسبب import مفقود.
- تم ضبط hreflang في الصفحات المعدلة فقط:
  - إزالة `en-SA` من `services/index.html` لأن `/en/services/` غير موجودة.
  - إزالة alternate English غير الموجود من صفحات Solutions الخمسة.
  - إزالة alternate English غير الموجود من `contact/index.html`.
- تم تنظيف schema في صفحات Solutions الخمسة بإبقاء `WebPage`, `BreadcrumbList`, و`FAQPage` الظاهر، وإضافة `LocalBusiness` حيث كان `seo:gate` يتطلبه.
- تم إضافة schema خفيف وآمن لصفحات `docs/` العشر بعد تحويلها إلى وثائق فعلية داخل الموقع: `WebPage`, `BreadcrumbList`, و`FAQPage` فقط عند وجود FAQ ظاهر.
- تم تخفيف عبارات الامتثال القاطعة في الصفحات المعدلة إلى صياغات مثل "يدعم جاهزية" و"يساعد على".

## ما تم تأجيله

- إصلاح `sitemap-images.xml` مؤجل إلى Phase 4 لأنه يحتوي نطاق صور واسع خارج الصفحات الخمسة.
- إصلاح hreflang واسع في صفحات غير معدلة مثل about/demo/docs مؤجل إلى PR لاحق.
- إصلاح 918 broken links التاريخية مؤجل لأنه يتطلب قرار معلوماتي واسع حول صفحات خدمات وديموهات ومجلدات demo/node_modules.
- تنظيف dependencies أو configs مؤجل حسب النطاق.

## السبب

الهدف في هذا التنفيذ هو أقل تغييرات ممكنة مع أعلى أثر SEO آمن: حلول الحوكمة الأساسية، sitemap/robots alignment، llms، وروابط داخلية محدودة بدون إعادة تصميم أو إصلاح شامل لكل المشروع.
