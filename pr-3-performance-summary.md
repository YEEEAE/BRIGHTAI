# PR-3 Performance Summary

تاريخ التنفيذ: 2026-04-25

## نطاق PR-3

تم تنفيذ تحسينات أداء تقنية فقط بدون تعديل `title` أو `meta description` أو `H1` أو `schema` أو الرسائل التسويقية. التعديلات ركزت على تحميل CSS/JS، الخطوط، الطرفيات الخارجية، وCLS في صفحة الخدمات.

## الملفات المعدلة ولماذا

| الملف | السبب |
|---|---|
| `index.html` | تأخير تحميل Google Analytics عبر `performance-loader` بدلاً من جلب `gtag.js` مبكراً، تأجيل `ux-audit-fixes.css`، وإزالة `fetchpriority="high"` من صورة ليست Hero. |
| `services/index.html` | تأخير Analytics، تأجيل CSS غير الحرج، إضافة preload وخط محلي مع `font-display: swap`، وإزالة `content-visibility:auto` من أول قسم مرئي لإصلاح CLS. |
| `demo/index.html` | استبدال تحميل Sentry/Clarity/gtag المباشر بتحميل مؤجل، تأجيل Font Awesome وCSS غير الحرج، وإضافة preload للخط المحلي. |
| `demo/ocr-demo/index.html` | نفس تحسينات الديمو: إزالة خطوط Google من المسار الحرج، تأجيل CSS غير الحرج، وتحميل الطرفيات عبر `performance-loader`. |
| `docs.html` | تأخير Sentry/Clarity/gtag وتأجيل ملفات CSS غير الحرجة. |
| `interview/pages/support-ai/index.html` | إزالة `@import` لخط Google، استخدام خط محلي، تأخير الطرفيات، وتأجيل CSS غير الحرج. |
| `frontend/css/demo-theme.min.css` | إزالة `@import`, تعريف خط محلي `woff2` مع `font-display: swap`, وتقليل أوزان 800/900 إلى 700 في المواضع الآمنة. |
| `frontend/css/ocr-demo-theme.min.css` | نفس تعديلات خط الديمو وإزالة `@import`. |

## Before / After بالأرقام المتاحة

لم يكن لدى PR-1 أرقام Lighthouse قبلية؛ تقرير PR-1 ذكر أن Lighthouse تعذر بسبب عدم توفر الحزمة. لذلك المقارنة القبلية المتاحة هنا هي أحجام الملفات من Git قبل PR-3 مقابل بعدها.

| الملف | قبل | بعد | الفرق |
|---|---:|---:|---:|
| `index.html` | 295,287 B | 295,105 B | -182 B |
| `services/index.html` | 216,754 B | 217,421 B | +667 B |
| `demo/index.html` | 60,268 B | 59,921 B | -347 B |
| `demo/ocr-demo/index.html` | 63,663 B | 63,438 B | -225 B |
| `docs.html` | 73,075 B | 72,433 B | -642 B |
| `interview/pages/support-ai/index.html` | 86,332 B | 85,936 B | -396 B |
| `frontend/css/demo-theme.min.css` | 11,485 B | 11,581 B | +96 B |
| `frontend/css/ocr-demo-theme.min.css` | 10,894 B | 10,990 B | +96 B |

## Lighthouse بعد التعديل

تم تشغيل Lighthouse محلياً عبر `http://127.0.0.1:4173` وحفظ النتائج في `reports/lighthouse-pr3/`.

| الصفحة | الوضع | Score | FCP | LCP | TBT | CLS | TTFB | Requests | الوزن |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | mobile | 73 | 2.43s | 4.81s | 67ms | 0.149 | 16ms | 31 | 811KB |
| `/` | desktop | 76 | 0.57s | 0.93s | 0ms | 0.639 | 8ms | 34 | 812KB |
| `/services/` | mobile | 91 | 2.14s | 3.15s | 83ms | 0.000 | 1ms | 15 | 550KB |
| `/services/` | desktop | 100 | 0.43s | 0.64s | 0ms | 0.038 | 3ms | 14 | 550KB |

## حالة الأهداف

| الهدف | النتيجة |
|---|---|
| `LCP <= 2.0s` على 4G | لم يتحقق في mobile للصفحة الرئيسية ولا الخدمات. تحقق على desktop. |
| `INP <= 200ms` | Lighthouse لا يعطي INP معملياً؛ استخدمت `Max Potential FID`: الصفحة الرئيسية mobile 150ms، الخدمات mobile 133ms. |
| `CLS <= 0.05` | تحقق في `/services/` بعد إصلاح `products-section`. لم يتحقق في `/` بسبب shift داخل Hero/Body قائم من بنية الصفحة الحالية. |
| `TTFB <= 500ms` | تحقق محلياً. |
| Lighthouse mobile >= 90 | تحقق في `/services/` فقط: 91. الصفحة الرئيسية بقيت 73. |

## الأصول المؤجلة أو المحسنة

- تم تأجيل `gtag.js` في الصفحات المعدلة عبر `/frontend/js/performance-loader.min.js` إلى `load`.
- تم تأجيل Clarity إلى interaction، وSentry إلى idle في صفحات الديمو والتوثيق والدعم.
- تم تأجيل CSS غير الحرج باستخدام `media="print" onload="this.media='all'"` مع `noscript` fallback.
- تم تأجيل Font Awesome في صفحات الديمو باستخدام preload strategy.
- تمت إزالة `@import` من CSS الديمو ونافذة الدعم.
- تم استخدام `/assets/fonts/IBMPlexSansArabic-Regular.woff2` كخط محلي رئيسي مع `font-display: swap`.
- لم يتم ضغط صور جديدة أو حذف صور مستخدمة.

## التحقق

- `npm run internal-links:audit`: نجح، 0 روابط/مسارات مكسورة.
- `npm run performance:budget`: نجح.
- Lighthouse محلي: تم توليد JSON للصفحة الرئيسية وصفحة الخدمات mobile/desktop.

## مخاطر Regression

- تأجيل CSS قد يسبب ومضة أسلوب قصيرة في اتصالات بطيئة جداً، لكن تم الإبقاء على critical CSS الموجود و`noscript` fallback.
- الصفحة الرئيسية لا تزال خارج أهداف PR-3 بسبب بنية HTML كبيرة وCLS داخل Hero/Body. إصلاحها بالكامل يتطلب تفكيك ترتيب الـ Hero/SEO blocks أو إعادة توزيع CSS/JS بشكل أعمق، وهذا يقترب من تغيير بنيوي/SEO خارج نطاق PR-3.
- صفحة الخدمات تحسنت بوضوح في CLS وLighthouse، لكن LCP mobile ما زال 3.15s بسبب حجم HTML والتوليد الكثيف للبطاقات.
