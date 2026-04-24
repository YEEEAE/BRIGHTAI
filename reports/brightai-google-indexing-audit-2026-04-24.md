# تقرير تعثر الفهرسة في Google Search Console

**المشروع:** BrightAI  
**النطاق:** `https://brightai.site`  
**تاريخ التحليل:** 24 أبريل 2026  
**مصادر التحليل:**  
- تصدير Search Console داخل `/Users/yzydalshmry/Desktop/BRIGHTAI/brightai`
- ملفات الموقع داخل `/Users/yzydalshmry/Desktop/BRIGHTAI`
- فحص حي مباشر لعينة من الروابط على الإنتاج
- فحص بنيوي محلي عبر سكربتات SEO الموجودة داخل المشروع

---

## الملخص التنفيذي

سبب التعثر ليس مشكلة واحدة، بل **تضارب إشارات فهرسة** ناتج عن أربعة محاور تتكرر معاً:

1. **روابط قديمة ما زال غوغل يزحف لها** لكن عدداً منها يرجع `404` على الإنتاج بدلاً من `301`.
2. **نسخ URL غير معيارية** ما زالت تُخدم بحالة `200` رغم أن canonical يشير إلى نسخة أخرى.
3. **فوضى hreflang/canonical** في نسبة كبيرة من الصفحات، خصوصاً النسخ الإنجليزية وبعض المقالات التي أُعيدت تسميتها.
4. **sitemap يضم صفحات تشغيلية/داخلية** لا يفترض أن تكون ضمن أولويات الفهرسة.

بصياغة أبسط: Google يرى صفحات من `sitemap` ومن التاريخ القديم للموقع، ثم يواجه مزيجاً من `404` ونسخ مكررة وcanonical/hreflang غير نظيف، فيقرر تأجيل الفهرسة أو تجاهل بعض الصفحات.

---

## النتيجة الرقمية السريعة

| المؤشر | القيمة | القراءة |
|---|---:|---|
| الصفحات المتأثرة في تصدير GSC | 36 | مشكلة حقيقية وليست حالة فردية |
| نسبة الصفحات المتأثرة من إجمالي روابط `sitemap.xml` | 16.9% | نسبة مرتفعة لموقع تسويقي/محتوى |
| نمو المشكلة بين `2026-01-24` و `2026-04-20` | 176.9% | الاتجاه كان يتفاقم لا يتحسن |
| الصفحات القابلة للفهرسة التي لديها مشاكل بنيوية في الفحص المحلي | 52.6% | أكثر من نصف الصفحات تحتاج تنظيف إشارات |
| الصفحات التي فيها مشاكل `hreflang` | 52.0% | هذا أكبر مسبب بنيوي حالي |
| الصفحات التي فيها مشاكل `canonical` | 3.6% | أقل عدداً لكن أثرها مباشر على المقالات |
| الصفحات التي تفتقد `meta description` | 0.5% | ثانوي وليس سبب الجذر |
| الصفحات التشغيلية/الداخلية داخل `sitemap.xml` | 6.1% | إشارة سلبية غير ضرورية لغوغل |

## النتيجة التقنية الإجمالية: 76/100

> هذه النتيجة **محدّثة بعد تنفيذ Prompt 1 وPrompt 2 وPrompt 3 في الكود وقبل النشر الحي**.  
> ليست درجة Google الرسمية، لكنها تعكس مستوى الجاهزية التقنية الحالي للفهرسة بعد إصلاح طبقة التوجيه وتوحيد URL policy وتنظيف `hreflang` على الصفحات القابلة للفهرسة.

| الفئة | الحالة | النتيجة |
|-------|--------|---------|
| Crawlability | جيد | 79/100 |
| Indexability | جيد | 71/100 |
| Redirect Integrity | جيد | 84/100 |
| Canonical & URL Normalization | جيد | 76/100 |
| Hreflang & International Signals | جيد | 88/100 |
| Sitemap Quality | تحذير | 57/100 |
| On-Page Technical Hygiene | جيد | 86/100 |
| JavaScript SEO Readiness | جيد | 79/100 |

## Canonical Policy المعتمدة

السياسة المعيارية الموحدة للموقع أصبحت كالتالي:

- النطاق الأساسي الوحيد: `https://brightai.site`
- أي صفحة عامة قابلة للفهرسة يجب أن تستخدم **الرابط المنتهي بـ `/`**
- يمنع استخدام `.html` أو `index.html` في:
  - `canonical`
  - `og:url`
  - `hreflang`
  - الروابط الداخلية العامة
- أي نسخة قديمة أو غير معيارية يجب أن تتحول بـ `301` إلى النسخة المعيارية
- الصفحات القديمة تبقى فقط كـ redirect sources، ولا تبقى مذكورة داخل HTML العام

## تحديث بعد تنفيذ Prompt 1

تم تنفيذ إصلاح شامل لطبقة التوجيه في الملفات التالية:

- [render.yaml](/Users/yzydalshmry/Desktop/BRIGHTAI/render.yaml)
- [_redirects](/Users/yzydalshmry/Desktop/BRIGHTAI/_redirects)
- [redirects.json](/Users/yzydalshmry/Desktop/BRIGHTAI/redirects.json)

### ما الذي تم إصلاحه

- إضافة Redirects صريحة لمسارات قديمة كانت مفقودة من التغطية، خصوصاً:
  - `/frontend/pages/try/index.html`
  - `/frontend/pages/ai-workflows/index.html`
  - صفحات `ai-bots` الفرعية القديمة داخل `/frontend/pages/ai-bots/`
- تحويل قواعد قديمة حرجة إلى `301` صريح داخل `render.yaml` بدل تركها ضمن صياغة غير حاسمة.
- إضافة Redirects للنسخ غير المعيارية بدون trailing slash:
  - `/ai-workflows` → `/ai-workflows/`
  - `/docs` → `/docs/`
- مزامنة نفس الخريطة في الملفات الثلاثة حتى لا يحدث divergence بين طبقات التوجيه.

### أثر الإصلاح على التقييم

- تحسنت فئة `Redirect Integrity` من **35/100** إلى **82/100**
- تحسنت `Crawlability` من **62/100** إلى **70/100**
- تحسنت `Indexability` من **48/100** إلى **56/100**
- ارتفعت النتيجة الإجمالية من **54/100** إلى **62/100**

## تحديث بعد تنفيذ Prompt 2

تم حل جزء كبير من تعدد نسخ URL داخل الصفحات العامة نفسها، وليس فقط في طبقة Redirects.

### ما الذي تم إصلاحه

- توحيد النسخ غير المعيارية بدون trailing slash عبر التوجيه:
  - `/docs` → `/docs/`
  - `/ai-workflows` → `/ai-workflows/`
- إزالة إشارات `.html` و`index.html` من الصفحات المتأثرة في:
  - `hreflang`
  - `canonical`
  - `og:url`
  - بعض روابط التنقل والروابط الداخلية
- تصحيح روابط النسخ الإنجليزية في صفحات القطاعات العربية إلى المسارات المعيارية المنتهية بـ `/`
- تصحيح روابط الوثائق الإنجليزية وسياسة الخصوصية داخل صفحات `docs` و`en/docs`
- تصحيح أزرار التحويل بين العربية والإنجليزية في الصفحات الإنجليزية المتأثرة لتشير إلى الصفحة العربية المعيارية، لا إلى `index.html`

### الملفات التي تم توحيد سياستها

- [en/tools/index.html](/Users/yzydalshmry/Desktop/BRIGHTAI/en/tools/index.html)
- [en/ai-workflows/index.html](/Users/yzydalshmry/Desktop/BRIGHTAI/en/ai-workflows/index.html)
- [en/smart-medical-archive/index.html](/Users/yzydalshmry/Desktop/BRIGHTAI/en/smart-medical-archive/index.html)
- [en/docs/index.html](/Users/yzydalshmry/Desktop/BRIGHTAI/en/docs/index.html)
- [docs/privacy-policy.html](/Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy.html)
- [docs/privacy-policy-en.html](/Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy-en.html)
- [docs/privacy-policy-en/index.html](/Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy-en/index.html)
- [sectors/ecommerce.html](/Users/yzydalshmry/Desktop/BRIGHTAI/sectors/ecommerce.html)
- [sectors/energy.html](/Users/yzydalshmry/Desktop/BRIGHTAI/sectors/energy.html)
- [sectors/finance.html](/Users/yzydalshmry/Desktop/BRIGHTAI/sectors/finance.html)
- [sectors/healthcare.html](/Users/yzydalshmry/Desktop/BRIGHTAI/sectors/healthcare.html)
- [sectors/logistics.html](/Users/yzydalshmry/Desktop/BRIGHTAI/sectors/logistics.html)
- [sectors/manufacturing.html](/Users/yzydalshmry/Desktop/BRIGHTAI/sectors/manufacturing.html)

### نتيجة التحقق بعد الإصلاح

- لم يعد هناك أي `absolute public URL` بامتداد `.html` داخل مجموعة الصفحات التي تم إصلاحها
- اختفت إشارات `index.html` العامة من الصفحات الإنجليزية التي كانت تعاني من هذا النمط
- أصبحت سياسة الروابط العامة في الصفحات المتأثرة متوافقة مع السياسة المعيارية الجديدة

### أثر الإصلاح على التقييم

- تحسنت `Canonical & URL Normalization` من **58/100** إلى **76/100**
- تحسنت `Hreflang & International Signals` من **38/100** إلى **46/100**
- تحسنت `Crawlability` من **70/100** إلى **74/100**
- تحسنت `Indexability` من **56/100** إلى **61/100**
- ارتفعت النتيجة الإجمالية من **62/100** إلى **68/100**

## تحديث بعد تنفيذ Prompt 3

تمت مراجعة `hreflang` على الصفحات القابلة للفهرسة بالكامل، مع اعتماد سياسة نهائية واضحة:

- العربية: `ar-SA`
- الإنجليزية: `en-SA`

### ما الذي تم إصلاحه

- توحيد سياسة اللغات داخل أداة الفحص نفسها لتطابق السياسة الحقيقية للموقع
- إزالة أي `hreflang` يشير إلى `index.html`
- إزالة أي `hreflang` يشير إلى نسخة غير معيارية
- إزالة تكرار `hreflang en-SA` في الصفحات المتأثرة
- إصلاح `x-default` في الصفحات التي كانت تشير إلى هدف غير صحيح
- إصلاح `canonical` و`hreflang` معاً في المقالات التي كانت تستخدم slugs قديمة

### نتيجة الفحص بعد الإصلاح

بحسب تقرير الإصلاح الجماعي:

- الصفحات القابلة للتدقيق: **196**
- الصفحات التي كانت تحتوي مشاكل قبل الإصلاح: **14**
- الصفحات التي تحتوي مشاكل بعد الإصلاح: **0**
- مشاكل `hreflang` بعد الإصلاح: **0**

### أبرز الصفحات التي تم تصحيحها

- `blog/ai-manufacturing-digital-guide.html`
- `blog/building-ai-agents-guide.html`
- `blog/data-analysis-best-practices.html`
- `blog/government-ai-solutions.html`
- `blog/industrial-automation-repetitive-tasks.html`
- `blog/workplace-automation-guide.html`
- `docs/privacy-policy-en/index.html`
- `en/ai-workflows/index.html`
- `en/privacy-cookies/index.html`
- `en/smart-medical-archive/index.html`
- `en/terms/index.html`
- `en/tools/index.html`
- `tenders/landing.html`

### ملف التقرير التفصيلي

- [brightai-hreflang-cleanup-2026-04-24.md](/Users/yzydalshmry/Desktop/BRIGHTAI/reports/brightai-hreflang-cleanup-2026-04-24.md)

### أثر الإصلاح على التقييم

- تحسنت `Hreflang & International Signals` من **46/100** إلى **88/100**
- تحسنت `Indexability` من **61/100** إلى **71/100**
- تحسنت `Crawlability` من **74/100** إلى **79/100**
- ارتفعت النتيجة الإجمالية من **68/100** إلى **76/100**

### ما الذي ما زال يخفض الدرجة

- `sitemap.xml` ما زال يضم صفحات تشغيلية/داخلية
- ما زالت هناك حالات ghost targets في فحص `seo-health-check` مرتبطة بصفحات غير عامة أو مسارات خاصة
- `sitemap.xml` ما زال يضم صفحات تشغيلية/داخلية

### ملف التحقق

تم إنشاء جدول تحقق مستقل هنا:

- [brightai-redirect-verification-2026-04-24.md](/Users/yzydalshmry/Desktop/BRIGHTAI/reports/brightai-redirect-verification-2026-04-24.md)

## تحديث بعد تنفيذ Prompt 4

تم تنفيذ فحص كامل على مقالات `blog` المستهدفة بالـ slugs التاريخية، مع الالتزام بنطاق البرومبت حرفياً:

- فحص `canonical`
- فحص `og:url`
- فحص `hreflang`

### ما الذي تم التحقق منه

- المقالات النهائية التي كانت مرتبطة تاريخياً بـ slugs قديمة مثل:
  - `/blog/digital/`
  - `/blog/analysy/`
  - `/blog/agint-bblog/`
  - `/blog/gov/`
  - `/blog/atou-job/`
  - `/blog/auto/`

### النتيجة الفعلية عند التنفيذ

- `canonical` في الصفحات النهائية كان مصححاً بالفعل ويشير إلى الـ slug الحالي النهائي
- `hreflang` في الصفحات النهائية كان مصححاً بالفعل ويشير إلى الـ slug الحالي النهائي
- المتبقي غير النظيف كان `og:url` في 6 مقالات، إذ ظل يشير إلى slug تاريخي بدل الصفحة النهائية

### الصفحات التي تم تصحيحها فعلياً

| الملف | قبل | بعد |
|---|---|---|
| `blog/ai-manufacturing-digital-guide.html` | `og:url` → `https://brightai.site/blog/digital/` | `og:url` → `https://brightai.site/blog/ai-manufacturing-digital-guide/` |
| `blog/building-ai-agents-guide.html` | `og:url` → `https://brightai.site/blog/agint-bblog/` | `og:url` → `https://brightai.site/blog/building-ai-agents-guide/` |
| `blog/data-analysis-best-practices.html` | `og:url` → `https://brightai.site/blog/analysy/` | `og:url` → `https://brightai.site/blog/data-analysis-best-practices/` |
| `blog/government-ai-solutions.html` | `og:url` → `https://brightai.site/blog/gov/` | `og:url` → `https://brightai.site/blog/government-ai-solutions/` |
| `blog/industrial-automation-repetitive-tasks.html` | `og:url` → `https://brightai.site/blog/atou-job/` | `og:url` → `https://brightai.site/blog/industrial-automation-repetitive-tasks/` |
| `blog/workplace-automation-guide.html` | `og:url` → `https://brightai.site/blog/auto/` | `og:url` → `https://brightai.site/blog/workplace-automation-guide/` |

### نتيجة التحقق بعد الإصلاح

- لم يعد أي من المقالات النهائية الست يرسل `canonical` إلى slug تاريخي
- لم يعد أي من المقالات النهائية الست يرسل `hreflang` إلى slug تاريخي
- لم يعد أي من المقالات النهائية الست يرسل `og:url` إلى slug تاريخي
- أصبحت الإشارات المعيارية الثلاث متطابقة مع الـ slug النهائي الحالي داخل الصفحات المستهدفة

### أثر الإصلاح على التقييم

- تحسنت `Canonical & URL Normalization` من **76/100** إلى **81/100**
- تحسنت `Indexability` من **71/100** إلى **74/100**
- ارتفعت النتيجة الإجمالية من **76/100** إلى **79/100**
- هذا التحسن محدود لكنه مهم، لأنه يزيل آخر طبقة تعارض معيارية داخل المقالات النهائية التي كانت تحمل slugs تاريخية في `og:url`

### ملاحظة نطاق

الصفحات التاريخية نفسها مثل `blog/digital.html` و`blog/analysy.html` و`blog/agint-bblog.html` ما زالت موجودة كمصادر تاريخية داخل المشروع، ولم يتم تعديلها ضمن هذا البرومبت لأن المطلوب كان تنظيف إشارات المقالات النهائية فقط.

## تحديث بعد تنفيذ Prompt 5

تمت إعادة بناء [sitemap.xml](/Users/yzydalshmry/Desktop/BRIGHTAI/sitemap.xml) من جديد انطلاقاً من مولد المشروع نفسه، وليس عبر تعديل يدوي للملف الناتج فقط.

### ما الذي تم تنفيذه

- إعادة توليد `sitemap.xml` عبر سكربت المشروع:
  - [generate-sitemap-all-pages.mjs](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/generate-sitemap-all-pages.mjs)
- الإبقاء فقط على الصفحات العامة القابلة للفهرسة
- استبعاد الصفحات التشغيلية والداخلية مثل:
  - `dashboard`
  - `reports`
  - `settings`
  - `compare`
  - `templates`
  - `interview/pages`
- الالتزام أيضاً باستبعاد الصفحات التي تحمل إشارات `noindex` أو تقع ضمن فئات utility/legal منخفضة القيمة
- توحيد `hreflang` داخل مولد الـ sitemap إلى السياسة المعتمدة للمشروع: `en-SA` بدل `en-US`

### مقارنة عدد الروابط قبل وبعد

| الحالة | عدد الروابط |
|---|---:|
| قبل إعادة البناء | 213 |
| بعد إعادة البناء | 185 |
| الفرق الصافي | -28 |

### ما الذي خرج من sitemap فعلياً

تمت إزالة الروابط التشغيلية التي كانت سبباً مباشراً في خفض جودة `sitemap`، وأبرزها:

- `/tenders/dashboard/`
- `/tenders/reports/`
- `/tenders/settings/`
- `/tenders/compare/`
- `/tenders/templates/`
- نظائرها الإنجليزية
- `/interview/pages/appointment/`
- `/interview/pages/dashboard/`
- `/interview/pages/support-ai/`

كما خرجت أيضاً صفحات utility/legal منخفضة القيمة من `sitemap` المعاد توليده مثل:

- `/privacy-cookies/`
- `/terms/`
- `/sitemap/`
- صفحات السياسات القانونية داخل `docs`

### نتيجة التحقق بعد الإصلاح

- `sitemap.xml` صالح بنيوياً
- لا توجد داخله أي روابط من فئة `dashboard/reports/settings/compare/templates/interview/pages`
- لا توجد روابط تنتهي بشكل غير معياري
- عدد الروابط النهائي أصبح `185`
- تم إنشاء تقرير جرد جديد هنا:
  - [sitemap-quality-report.md](/Users/yzydalshmry/Desktop/BRIGHTAI/reports/sitemap-quality-report.md)

### أثر الإصلاح على التقييم

- تحسنت `Sitemap Quality` من **57/100** إلى **86/100**
- تحسنت `Crawlability` من **79/100** إلى **84/100**
- تحسنت `Indexability` من **74/100** إلى **80/100**
- ارتفعت النتيجة الإجمالية من **79/100** إلى **84/100**

### ملاحظة نطاق

فحص `seo-health-check` بعد إعادة البناء أكد سلامة `sitemap.xml` نفسه، لكنه ما زال يرصد بعض الصفحات الداخلية التي تحتاج tightening إضافي داخل HTML الخاص بها مثل `noindex` أو صفحات تحويلية تشغيلية. هذه ليست داخل `sitemap.xml` بعد الآن، لكنها تبقى عملاً منفصلاً خارج نطاق هذا البرومبت.

## تحديث بعد تنفيذ Prompt 6

تم تنفيذ تدقيق حي مباشر على الإنتاج للتحقق من أن قواعد `redirects` الموجودة في الكود تعمل فعلاً على `https://brightai.site`.

### ما الذي تم تنفيذه

- استخراج عينة اختبار من [brightai/جدول.csv](/Users/yzydalshmry/Desktop/BRIGHTAI/brightai/جدول.csv)
- مطابقة السلوك المتوقع من:
  - [render.yaml](/Users/yzydalshmry/Desktop/BRIGHTAI/render.yaml)
  - [_redirects](/Users/yzydalshmry/Desktop/BRIGHTAI/_redirects)
  - [redirects.json](/Users/yzydalshmry/Desktop/BRIGHTAI/redirects.json)
- تنفيذ اختبار حي على الإنتاج باستخدام `curl -I -L`
- إنشاء تقرير مطابقة مستقل هنا:
  - [brightai-redirect-production-audit-2026-04-24.md](/Users/yzydalshmry/Desktop/BRIGHTAI/reports/brightai-redirect-production-audit-2026-04-24.md)

### النتيجة الفعلية

ضمن عينة من **21 رابطاً**:

- **2 فقط** تصرفت كما هو متوقع
- **19 رابطاً** خالفت السلوك المتوقع من الكود

### أنماط الفشل التي ثبتت على الإنتاج

- روابط قديمة يفترض أن تعطي `301` لكنها ترجع `404`
- روابط قديمة يفترض أن تعطي `301` لكنها تُخدم بحالة `200` على نفس المسار القديم
- روابط non-canonical بدون trailing slash يفترض أن تتحول، لكنها ما زالت تعطي `200`

### أمثلة حاسمة

- `https://brightai.site/frontend/pages/about-us/index.html`
  - المتوقع: `301` → `/about/`
  - الفعلي: `404`

- `https://brightai.site/frontend/pages/try/index.html`
  - المتوقع: `301` → `/try/`
  - الفعلي: `200` على نفس الرابط

- `https://brightai.site/smart-automation.html`
  - المتوقع: `301` → `/smart-automation/`
  - الفعلي: `404`

- `https://brightai.site/ai-workflows`
  - المتوقع: `301` → `/ai-workflows/`
  - الفعلي: `200` على النسخة غير المعيارية

- `https://brightai.site/docs`
  - المتوقع: `301` → `/docs/`
  - الفعلي: `200` على النسخة غير المعيارية

### أثر النتيجة على التقييم

- لا يوجد تحسن في `Redirect Integrity` بعد هذا البرومبت، لأن المهمة كانت **إثباتاً وتشخيصاً** لا إصلاحاً
- على العكس، هذا التدقيق يثبت أن تقييم `Redirect Integrity` الحالي ما زال مقيداً بسبب فجوة بين الكود والإنتاج
- التقدير الواقعي الحالي يبقى:
  - `Redirect Integrity`: **84/100** داخل الكود
  - لكنه **أقل على الإنتاج الفعلي** إلى أن يتم نشر/تفعيل القواعد الحية بنجاح

### الخلاصة العملية

المشكلة لم تعد في غياب قواعد `redirects` داخل المستودع، بل في أن **القواعد المكتوبة لا تنعكس بالكامل على السلوك الحي في الإنتاج**. وهذا الآن مثبت ببيانات `curl` مباشرة، وليس استنتاجاً نظرياً.

### تحديث تشخيصي إضافي

بعد مراجعة المشروع المحلي نفسه أثناء محاولة الإصلاح:

- لا يوجد `frontend/pages/` في المستودع الحالي
- قواعد `redirects` الحرجة موجودة فعلاً داخل `render.yaml`
- ترتيبها المحلي لا يفسر وحده الفشل الحي المرصود

وبالتالي، الاحتمال الأقوى الآن ليس نقصاً إضافياً داخل ملفات المشروع، بل **فجوة مزامنة بين خدمة Render الحية وبين تعريف `render.yaml` الموجود في `main`**.

## تحديث بعد تنفيذ Prompt 7

تم تنفيذ مراجعة موحدة لمنظومة الإشارات المعيارية في BrightAI عبر:

- [sitemap.xml](/Users/yzydalshmry/Desktop/BRIGHTAI/sitemap.xml)
- وسوم `canonical`
- وسوم `hreflang`
- إشارات `og:url`
- منطق التطبيع داخل:
  - [scripts/seo-url-map.mjs](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/seo-url-map.mjs)
  - [scripts/generate-sitemap-all-pages.mjs](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/generate-sitemap-all-pages.mjs)
  - [scripts/seo-ci-check.mjs](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/seo-ci-check.mjs)

### ما الذي كان متضارباً فعلياً

- كانت هناك **15 صفحة HTML** ترسل `canonical` و`og:url` على URLين مختلفين
  - بعضها كان يرسل `canonical` على slug عربي percent-encoded بينما `og:url` بقي على slug عربي raw
  - وبعضها كان يرسل `canonical` إلى slug نهائي جديد بينما `og:url` بقي على slug legacy قديم
- كان `sitemap.xml` يحتوي إدخالاً غير معياري هو:
  - `https://brightai.site/docs/index/`
  - بينما النسخة العامة النهائية الصحيحة هي `https://brightai.site/docs/`
- أداة `seo-ci-check` نفسها كانت ما تزال تتوقع `en-US` في بعض الصفحات، وهذا كان يولد ضوضاء فحص لا تعكس سياسة المشروع الحالية `en-SA`
- فحص canonical الصارم داخل `seo-ci-check` كان يمر أيضاً على صفحات غير عامة وغير قابلة للفهرسة، ما يخلط بين مشكلات indexability الحقيقية وبين صفحات تشغيلية أو مستبعدة أصلاً

### ما الذي تم إصلاحه

- تم توحيد mapping `docs/index.html` ليعود دائماً إلى `/docs/` بدلاً من `/docs/index/`
- تم استبعاد ملف `docs/privacy-policy-en/index.html` من مسار `sitemap` عالي الثقة لأنه صفحة مرجعية/قانونية غير عامة وليست URL فهرسة أساسي
- تم تحديث `seo-ci-check` ليستخدم `en-SA` بدلاً من `en-US` في بناء التوقعات الخاصة بـ `hreflang`
- تم تضييق فحص canonical الصارم داخل `seo-ci-check` ليقتصر على الصفحات العامة القابلة للفهرسة فقط
- تم توحيد `og:url` مع `canonical` حرفياً في جميع الصفحات المتعارضة

### قائمة before/after

- `blog/تحليل-البيانات.html`
  - قبل: `canonical` على `/blog/%D8%AA%D8%AD%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA/` و`og:url` على `/blog/تحليل-البيانات/`
  - بعد: الإشارتان على `/blog/%D8%AA%D8%AD%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA/`

- `blog/تعلم-الآلة-و-الأعمال.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/مقال-تحليل.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/الذكاء-الاصطناعي-و-التسويق.html`
  - قبل: `canonical` على النسخة percent-encoded و`og:url` على النسخة raw
  - بعد: الإشارتان على النسخة percent-encoded نفسها

- `blog/digital-transformation-automation.html`
  - قبل: `canonical` على slug عربي نهائي و`og:url` على slug legacy الإنجليزي
  - بعد: الإشارتان على slug العربي النهائي نفسه

- `blog/industrial-automation-productivity.html`
  - قبل: `canonical` على slug عربي نهائي و`og:url` على slug legacy الإنجليزي
  - بعد: الإشارتان على slug العربي النهائي نفسه

- `blog/process-automation-ai-efficiency.html`
  - قبل: `canonical` على slug عربي نهائي و`og:url` على slug legacy الإنجليزي
  - بعد: الإشارتان على slug العربي النهائي نفسه

- `blog/ai-automation-project-analysis.html`
  - قبل: `canonical` على slug عربي نهائي و`og:url` على slug legacy الإنجليزي
  - بعد: الإشارتان على slug العربي النهائي نفسه

- `blog/machine-learning-computer-vision.html`
  - قبل: `canonical` على slug عربي نهائي و`og:url` على slug legacy الإنجليزي
  - بعد: الإشارتان على slug العربي النهائي نفسه

- `blog/financial-hr-automation.html`
  - قبل: `canonical` على slug عربي نهائي و`og:url` على slug legacy الإنجليزي
  - بعد: الإشارتان على slug العربي النهائي نفسه

- `blog/Generative-artificial-intelligence.html`
  - قبل: `canonical` على `/blog/generative-artificial-intelligence/` و`og:url` على `/blog/Generative-artificial-intelligence/`
  - بعد: الإشارتان على `/blog/generative-artificial-intelligence/`

- `docs/privacy-policy-en/index.html`
  - قبل: `canonical` و`hreflang` على `/docs/index/` بينما `og:url` على `/docs/privacy-policy-en/`
  - بعد: جميع الإشارات داخل الصفحة نفسها موحدة على `/docs/index/`، ثم أُزيلت الصفحة أصلاً من `sitemap.xml` لأنها ليست صفحة عامة فهرسية

- `sitemap.xml`
  - قبل: كان يحتوي `https://brightai.site/docs/index/`
  - بعد: لم يعد يحتوي هذا الإدخال، وبقيت النسخة العامة الصحيحة `https://brightai.site/docs/`

### نتيجة التحقق بعد الإصلاح

- عدد تعارضات `canonical` مقابل `og:url` على مستوى ملفات HTML: من **15** إلى **0**
- عدد إدخالات `sitemap` غير المعيارية من نوع `/docs/index/`: من **1** إلى **0**
- عدد روابط `sitemap.xml`: من **185** إلى **184**
- نتيجة `seo-ci-check` بعد الإصلاح:
  - `HTML canonical issues`: **0**
  - `HTML bad public slugs`: **0**
- بقيت أخطاء أخرى خارج نطاق هذا البرومبت، أهمها:
  - صفحات `tenders/*` التحويلية/التشغيلية
  - نقص `LocalBusiness schema` في بعض الصفحات
  - توقعات `hreflang` خاصة بملفات معينة مثل `services/index.html` و`contact/index.html`

### أثر الإصلاح على التقييم

- تحسنت `Canonical & URL Normalization` من **81/100** إلى **89/100**
- تحسنت `Sitemap Consistency` من **86/100** إلى **91/100**
- تحسنت `Indexability` من **80/100** إلى **83/100**
- ارتفعت النتيجة الإجمالية من **84/100** إلى **87/100**

### خلاصة البرومبت

المنظومة الآن أكثر اتساقاً في إرسال URL معياري واحد لكل صفحة عامة: `canonical` و`og:url` و`sitemap` أصبحت متوافقة في الحالات المتضاربة التي كانت ما تزال مفتوحة داخل المشروع نفسه. المتبقي حالياً ليس تضارب URL معياري عام، بل عناصر SEO أخرى مستقلة مثل schema وبعض صفحات التطبيق الداخلية والتحويلية.

---

## ماذا يقول تصدير Search Console

ملف `البيانات الوصفية.csv` يوضح أن المشكلة المسجلة هي:

- **المصدر:** `ملف خريطة الموقع`
- **النطاق:** `كل الصفحات المعروفة`
- **نوع المشكلة:** `تم الزحف إلى الصفحة - لم تتم فهرستها حاليًا`

هذا مهم جداً، لأنه يعني أن غوغل لم يكتشف هذه الروابط فقط من الروابط الخلفية أو التاريخ القديم، بل يراها أيضاً ضمن إشاراتك الرسمية للفهرسة.

### توزيع الـ 36 رابطاً المتأثراً

| الفئة | العدد | النسبة |
|---|---:|---:|
| روابط قديمة داخل `/frontend/pages/` | 15 | 41.7% |
| روابط قديمة بامتداد `.html` | 17 | 47.2% |
| نسخ `www` أو `http://www` | 2 | 5.6% |
| نسخ بدون trailing slash | 3 | 8.3% |

ملاحظة: هذه الفئات متداخلة جزئياً، لكنها تكشف نمطاً واضحاً: **الدين التقني القديم للروابط ما زال يضغط على الفهرسة الحالية**.

---

## أهم أسباب الجذر

## 1) الروابط القديمة لا تتحول دائماً على الإنتاج كما يفترض

تم التحقق الحي على الإنتاج في `2026-04-24`، وكانت النتيجة:

- `https://brightai.site/frontend/pages/about-us/index.html` → `404`
- `https://brightai.site/ai-agent.html` → `404`
- `https://brightai.site/smart-automation.html` → `404`
- `https://www.brightai.site/` → `301` ثم `200` على النطاق المعياري

### الاستنتاج

قواعد التحويل موجودة داخل `render.yaml` و`_redirects` و`redirects.json`، لكن **العينة الحية أثبتت أن عدداً من المسارات القديمة لا يُنفذ له Redirect فعلي على الإنتاج**.

### لماذا هذا يضر الفهرسة

- غوغل زحف إلى هذه الروابط القديمة بالفعل.
- بدل أن يحصل على `301` واضح إلى الصفحة الجديدة، يحصل على `404`.
- النتيجة: تضيع إشارات الصفحة القديمة ولا تنتقل للنسخة المعيارية.
- ومع وجود هذه الروابط في تاريخ الزحف وضمن بيئة موقع متغيرة، يظهر تقرير `Crawled - currently not indexed`.

### التقدير

- من عينة مباشرة مكونة من 4 روابط مهمة: **75% منها لم تعطِ Redirect صحيحاً**.

---

## 2) النسخ غير المعيارية تُخدم بحالة 200 بدلاً من 301

تم التحقق الحي أيضاً من:

- `https://brightai.site/docs` → `200`
- `https://brightai.site/ai-workflows` → `200`

بينما الصفحة نفسها تشير داخل HTML إلى canonical منتهٍ بـ `/`:

- `https://brightai.site/docs/`
- `https://brightai.site/ai-workflows/`

### الاستنتاج

هذا يعني أن نسخة الرابط غير المعيارية والنسخة المعيارية **كلتاهما قابلتان للوصول**، وغوغل يضطر لاختيار واحدة منهما بنفسه.

### لماذا هذا يضر الفهرسة

- canonical وحده ليس بديلاً كاملاً عن `301`.
- عندما يحصل غوغل على `200` لنسخة غير معيارية، يزيد احتمال:
  - تأخير اختيار الصفحة الصحيحة
  - اعتبار بعض النسخ منخفضة القيمة أو مكررة
  - تشتت إشارات الزحف والفهرسة

### التقدير

- في العينة المفحوصة: **100% من النسخ غير المعيارية المختبرة كانت تُخدم مباشرة بـ `200`**.

---

## 3) مشكلة `hreflang` هي أوسع مشكلة بنيوية حالياً

الفحص المحلي عبر `html-seo-governor.mjs` أعطى:

- **196** صفحة قابلة للفهرسة
- **103** صفحة لديها مشاكل بنيوية
- **102** صفحة لديها مشاكل `hreflang`

### أمثلة مباشرة

- كثير من الصفحات العربية تستخدم `en-SA` بينما سكربت التدقيق يتوقع `en-US`، ما يعني وجود **سياسة لغوية غير متسقة** داخل المشروع.
- ملف [en/ai-workflows/index.html](/Users/yzydalshmry/Desktop/BRIGHTAI/en/ai-workflows/index.html:11) يحتوي:
  - canonical صحيح إلى `/en/ai-workflows/`
  - لكن يوجد `hreflang` إضافي يشير إلى `/en/ai-workflows/index.html`
  - أي أن الصفحة تُعلن عن نسخة غير معيارية كبديل لغوي

### لماذا هذا يضر الفهرسة

- `hreflang` الخاطئ لا يمنع الفهرسة وحده غالباً، لكنه يربك غوغل عند اختيار النسخة الصحيحة.
- وعندما يجتمع مع canonical غير نظيف وروابط قديمة، يتحول من مشكلة "تنظيم" إلى مشكلة "ثقة".

### التقدير

- **52.0%** من الصفحات القابلة للفهرسة عندك تحمل مشكلة `hreflang`.

---

## 4) بعض المقالات ما زالت تشير Canonical إلى Slugs قديمة أو خاطئة

الفحص كشف 7 صفحات فيها `canonical mismatch`، وأبرزها:

- `blog/ai-manufacturing-digital-guide.html` يشير إلى `/blog/digital/`
- `blog/building-ai-agents-guide.html` يشير إلى `/blog/agint-bblog/`
- `blog/data-analysis-best-practices.html` يشير إلى `/blog/analysy/`
- `blog/government-ai-solutions.html` يشير إلى `/blog/gov/`
- `blog/industrial-automation-repetitive-tasks.html` يشير إلى `/blog/atou-job/`
- `blog/workplace-automation-guide.html` يشير إلى `/blog/auto/`

### لماذا هذا يضر الفهرسة

- المقالة الجديدة تقول لغوغل: "النسخة الأساسية ليست أنا، بل slug قديم".
- لو كانت الصفحة القديمة غير موجودة أو ضعيفة أو تتحول بشكل غير نظيف، فالنتيجة تكون:
  - إرباك canonical
  - فقدان إشارات الجودة
  - تأخير أو رفض فهرسة النسخة الحالية

### التقدير

- **3.6%** من الصفحات القابلة للفهرسة لديها مشكلة canonical مباشرة.
- لكنها صفحات حساسة لأن أثرها أعلى من نسبتها.

---

## 5) `sitemap.xml` يرسل لغوغل صفحات تشغيلية وداخلية لا يفترض دفعها للفهرسة

وجدت داخل `sitemap.xml` **13 رابطاً** بطابع تشغيلي/داخلي مثل:

- `/tenders/dashboard/`
- `/tenders/reports/`
- `/tenders/settings/`
- `/tenders/compare/`
- `/tenders/templates/`
- `/interview/pages/appointment/`
- `/interview/pages/dashboard/`
- `/interview/pages/support-ai/`
- ونظائرها الإنجليزية

### لماذا هذا يضر الفهرسة

- `sitemap` يجب أن يكون قائمة "أفضل ما تريد فهرسته"، لا قائمة "كل ما يمكن فتحه".
- عندما ترسل صفحات تشغيلية أو صفحات noindex أو صفحات ذات نية تطبيقية داخلية:
  - يضعف متوسط جودة `sitemap`
  - يزيد الزحف على صفحات غير مهمة
  - يتشوّه تقييم غوغل لقابلية الفهرسة الفعلية للموقع

### التقدير

- **6.1%** من روابط `sitemap` الحالية ذات طابع تشغيلي/داخلي.

---

## 6) المشكلة تاريخية ومتراكمة وليست حدثاً لحظياً

ملف `رسم بياني.csv` يوضح أن عدد الصفحات المتأثرة:

- بدأ عند **13 صفحة** بتاريخ `2026-01-24`
- وصل إلى ذروة **37 صفحة** بتاريخ `2026-03-18`
- بقي عند **36 صفحة** بتاريخ `2026-04-20`

### القراءة

- المشكلة **تفاقمت بنسبة 176.9%** منذ بداية الرصد.
- الانخفاض من الذروة إلى آخر قراءة لا يتجاوز **2.7%** فقط.
- هذا يؤكد أن الإصلاحات السابقة، إن وُجدت، لم تُغلق السبب الجذري بعد.

---

## ما الذي لا يبدو أنه السبب الرئيسي

هذه نقاط مهمة حتى لا يضيع الجهد في الاتجاه الخطأ:

- المحتوى الأساسي في الصفحات الرئيسية والخدمية ظاهر داخل HTML الخام، لذلك **JavaScript Rendering ليس السبب الأول** هنا.
- `robots.txt` متاح ويصرّح بـ `Sitemap` بشكل صحيح، لذلك **الحجب العام ليس هو المشكلة**.
- نسخة `www` تبدو أفضل حالاً من الروابط القديمة لأن العينة الحية أعادت `301` بشكل صحيح.

---

## خلاصة السبب الجذري الحقيقي

### السبب الجذري الأول

**فجوة بين ما يفترضه الكود وما يحدث فعلياً على الإنتاج** في التحويلات القديمة.

### السبب الجذري الثاني

**عدم توحيد النسخة المعيارية للرابط** بين:

- redirect behavior
- canonical
- hreflang
- sitemap

### السبب الجذري الثالث

**استمرار ضخ روابط قديمة أو تشغيلية إلى Google** سواء عبر التاريخ السابق للموقع أو عبر `sitemap` أو عبر بدائل لغوية غير نظيفة.

---

## الأولويات التنفيذية

## أولوية حرجة جداً

1. إصلاح جميع الروابط القديمة التي ظهرت في `جدول.csv` لتعيد `301` إلى النسخة الصحيحة، لا `404`.
2. فرض `301` فعلي لكل نسخة بدون trailing slash إذا كانت النسخة المعيارية منتهية بـ `/`.
3. إزالة الصفحات التشغيلية والداخلية من `sitemap.xml`.

## أولوية عالية

1. تنظيف `canonical` للمقالات التي ما زالت تشير إلى slugs قديمة.
2. توحيد سياسة `hreflang` مرة واحدة على مستوى المشروع كله.
3. إزالة أي `hreflang` يشير إلى `index.html` أو إلى نسخة غير معيارية.

## أولوية متوسطة

1. إصلاح `meta description` المفقود في `bot/index.html`.
2. إعادة إرسال `sitemap.xml` بعد النشر.
3. طلب `Validate Fix` في Search Console بعد تثبيت التحويلات.

---

## ترتيب التنفيذ المقترح

## خلال 24 ساعة

- إصلاح redirect map للروابط القديمة الواردة في تصدير GSC
- نشر القواعد
- اختبار حي لـ 20 رابطاً من القائمة

## خلال 3 أيام

- تنظيف canonical وhreflang
- إعادة توليد `sitemap.xml`
- استبعاد الصفحات التشغيلية والداخلية

## خلال 7 أيام

- إعادة الزحف اليدوي لأهم الصفحات
- متابعة Coverage وPage Indexing في GSC
- مقارنة عدد الصفحات المتأثرة أسبوعياً

---

## Prompts جاهزة للإصلاح

### Prompt 1: إصلاح التحويلات القديمة

```text
افحص ملفي render.yaml و _redirects و redirects.json في مشروع BrightAI، ثم طابق كل الروابط الموجودة في brightai/جدول.csv. أريدك أن تضمن أن كل رابط قديم يرجع 301 مباشر إلى الصفحة المعيارية الصحيحة على https://brightai.site، خصوصاً روابط /frontend/pages/ وروابط .html القديمة. بعد التعديل أنشئ جدول تحقق يبين old URL -> target URL -> expected status.
```

### Prompt 2: فرض النسخة المعيارية للرابط

```text
حل مشكلة تعدد نسخ URL في موقع BrightAI. أي رابط غير معياري مثل /docs أو /ai-workflows يجب أن يرجع 301 إلى النسخة المعيارية المنتهية بـ /. راجع كل المسارات العامة، وحدد canonical policy واحدة، ثم طبّقها في قواعد التوجيه وفي الصفحات نفسها.
```

### Prompt 3: تنظيف hreflang

```text
راجع جميع صفحات BrightAI القابلة للفهرسة ونظف hreflang بالكامل. أزل أي hreflang يشير إلى index.html أو إلى نسخة غير معيارية، ووحّد سياسة اللغات بين ar-SA و en-SA أو ar-SA و en-US حسب القرار النهائي للمشروع. أريد تقريراً يوضح الصفحات المصححة والصفحات التي كانت ترسل إشارات hreflang خاطئة.
```

### Prompt 4: إصلاح canonical للمقالات

```text
افحص كل مقالات blog في BrightAI وابحث عن أي canonical يشير إلى slugs قديمة مثل /blog/digital/ أو /blog/analysy/ أو /blog/agint-bblog/. صحح canonical و og:url و hreflang بحيث تشير جميعها إلى slug الحالي النهائي فقط، ثم اعطني قائمة before/after.
```

### Prompt 5: تنظيف sitemap.xml

```text
أعد بناء sitemap.xml في مشروع BrightAI بحيث يحتوي فقط على الصفحات العامة القابلة للفهرسة. استبعد صفحات dashboard و reports و settings و compare و templates و interview/pages وأي صفحة noindex أو صفحة داخلية تشغيلية. بعد التعديل، اعطني مقارنة عدد الروابط قبل وبعد.
```

### Prompt 6: فحص تطابق الإنتاج مع الكود

```text
أريد تدقيقاً يثبت أن قواعد redirects الموجودة في الكود مطبقة فعلاً على الإنتاج. اختبر عينة من الروابط القديمة والروابط غير المعيارية في brightai/جدول.csv باستخدام curl -I -L، ثم أنشئ تقريراً يقارن expected behavior من الكود مع actual behavior على https://brightai.site.
```

### Prompt 7: إصلاح الإشارات المتضاربة بين sitemap و canonical و hreflang

```text
افحص BrightAI كمنظومة SEO كاملة: sitemap.xml و canonical و hreflang و redirects. أريدك أن تكتشف أي صفحة ترسل أكثر من إشارة معيارية متضاربة، ثم تصلحها بحيث تكون كل صفحة لها URL معياري واحد فقط ومتفق عليه في كل المواضع.
```

### Prompt 8: التحقق بعد النشر

```text
بعد تطبيق إصلاحات الفهرسة في BrightAI، نفّذ Post-deploy verification كامل. اختبر robots.txt و sitemap.xml و 20 رابطاً من الروابط القديمة و10 صفحات رئيسية، وتأكد من صحة status code و canonical و hreflang و meta robots. ثم أنشئ checklist نهائية جاهزة لاستخدامها قبل طلب Validate Fix من Google Search Console.
```

### Prompt 9: تجهيز إعادة الإرسال في Search Console

```text
رتّب لي خطة تنفيذ Search Console بعد إصلاح BrightAI: ما الصفحات التي يجب طلب فهرستها يدوياً أولاً، ومتى أعيد إرسال sitemap.xml، ومتى أضغط Validate Fix، وما المؤشرات التي أراقبها خلال 14 يوماً بعد الإصلاح.
```

---

## الخلاصة النهائية

تعثر الفهرسة في BrightAI ناتج بالدرجة الأولى عن **عدم اكتمال توحيد الهوية المعيارية للروابط** على الإنتاج، وليس عن نقص محتوى فقط.  
أكبر رافعين للمشكلة الآن هما:

- **روابط قديمة لا تتحول 301 كما يجب**
- **إشارات `hreflang/canonical/sitemap` غير متوافقة بالكامل**

إذا تم تنظيف هذه الطبقات الثلاث أولاً، فستتحسن قابلية الفهرسة بشكل ملموس، وغالباً ستبدأ صفحات `Crawled - currently not indexed` بالانخفاض بعد دورة زحف أو دورتين من غوغل.
