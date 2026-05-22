# 🎯 برومبتات Codex لتنفيذ تقرير SEO الشامل — Bright AI

> **طريقة الاستخدام:** نفّذ كل برومبت بالترتيب. كل برومبت مستقل ويمكن تنفيذه في جلسة Codex منفصلة.
> بعد كل برومبت، شغّل أوامر التحقق المذكورة في نهايته للتأكد من نجاح التنفيذ.

---

## 🔴 المرحلة 1: إصلاحات حرجة (Critical)

---

### البرومبت 1: تنظيف السايت ماب من الروابط غير العامة

```
أنت وكيل Technical SEO لمشروع Bright AI.

المهمة: تنظيف sitemap.xml من الروابط غير العامة.

المشاكل المكتشفة:
1. يوجد 41 رابط من /reports/keywords/ داخل sitemap.xml — هذه تقارير كلمات مفتاحية داخلية وليست صفحات عامة. الـ canonical الخاص بها يشير إلى صفحات /docs/ مما يثبت أنها نسخ ثانوية.
2. يوجد رابطين يحتويان "index 2" (بمسافة):
   - https://brightai.site/en/ai-bots/BrightProject/index 2/
   - https://brightai.site/en/ai-bots/BrightSales/index 2/

المطلوب:
1. افتح sitemap.xml واحذف كل <url> يحتوي /reports/keywords/ في <loc>.
2. احذف كل <url> يحتوي "index 2" أو "index%202" في <loc>.
3. تأكد أن عدد الروابط بعد التنظيف حوالي 153 بدلاً من 196.
4. تأكد أن بنية XML سليمة بعد التعديل.

التحقق:
- npm run seo:check
- grep -c "reports/keywords" sitemap.xml → يجب أن يكون 0
- grep -c "index 2" sitemap.xml → يجب أن يكون 0
- grep -c "<loc>" sitemap.xml → يجب أن يكون حوالي 153-155
```

---

### البرومبت 2: تحديث سكربت توليد السايت ماب

```
أنت وكيل Technical SEO لمشروع Bright AI.

المهمة: تحديث منطق سكربت توليد السايت ماب scripts/generate-sitemap-all-pages.mjs لمنع إضافة روابط غير عامة مستقبلاً.

اقرأ الملف أولاً وافهم المنطق الحالي، ثم عدّل قواعد التضمين والاستبعاد:

قواعد الإضافة (Include):
- كل /demo/**/*.html العامة (بما فيها dashboard.html, compare.html إذا كانت صفحات عملاء)
- كل /services/*.html
- كل /sectors/**/*.html و /sectors/*.html
- كل /locations/*/index.html
- كل /blog/*/index.html
- كل /docs/*.html
- كل /en/**/*.html العامة
- الصفحات الجذرية: index.html, about/, contact/, consultation/, ai-agent/, etc.

قواعد الاستبعاد (Exclude):
- أي مسار يحتوي /reports/ أو /backend/ أو /.next/ أو /node_modules/ أو /.agents/ أو /tmp/
- أي ملف اسمه يحتوي مسافة (مثل "index 2.html")
- أي ملف 404.html أو 500.html أو error.html
- أي ملف API مثل api.php
- أي ملف JS/CSS/JSON مباشر
- أي صفحة canonical الخاص بها يشير إلى صفحة مختلفة عن نفسها
- أي صفحة redirect فقط

قاعدة التحويل:
- حوّل مسارات .html إلى canonical نظيفة: /services/ai-consulting.html → /services/ai-consulting/
- تأكد أن كل رابط ينتهي بـ /

التحقق:
- npm run sitemap:all
- npm run seo:check
- grep -c "reports/keywords" sitemap.xml → 0
- grep -c "index 2" sitemap.xml → 0
```

---

### البرومبت 3: حذف ملفات index 2.html المكررة

```
أنت وكيل Technical SEO لمشروع Bright AI.

المهمة: التعامل مع ملفات index 2.html المكررة ذات الأسماء الضعيفة.

الملفات المشكلة:
1. en/ai-bots/BrightProject/index 2.html
2. en/ai-bots/BrightSales/index 2.html

هذه ملفات مكررة من النسخ الرسمية (index.html) في نفس المجلد.

المطلوب:
1. قارن محتوى "index 2.html" مع "index.html" في كل مجلد. إذا كانا متطابقين أو متشابهين جداً، احذف "index 2.html".
2. إذا كان فيهما محتوى فريد مهم، ادمجه في index.html ثم احذف "index 2.html".
3. أضف redirect 301 في ملف _redirects:
   /en/ai-bots/BrightProject/index%202.html  /en/ai-bots/BrightProject/  301
   /en/ai-bots/BrightProject/index%202/      /en/ai-bots/BrightProject/  301
   /en/ai-bots/BrightSales/index%202.html    /en/ai-bots/BrightSales/    301
   /en/ai-bots/BrightSales/index%202/        /en/ai-bots/BrightSales/    301
4. تأكد أن الملفين محذوفان.
5. تأكد أن sitemap.xml لا يحتوي أي إشارة لـ "index 2".

التحقق:
- ls "en/ai-bots/BrightProject/index 2.html" → يجب أن لا يوجد
- ls "en/ai-bots/BrightSales/index 2.html" → يجب أن لا يوجد
- npm run seo:check → يجب أن يمر بدون خطأ الـ slugs الضعيفة
- npm run seo:gate
```

---

## 🟠 المرحلة 2: إصلاحات عالية الأولوية (High)

---

### البرومبت 4: إصلاح الأصول المكسورة

```
أنت وكيل Technical SEO لمشروع Bright AI.

المهمة: إصلاح 28 مرجع أصل مكسور في الموقع.

المشكلة 1: /assets/images/logo.PNG (10 مراجع)
الملف logo.PNG غير موجود. الملفات المتاحة:
- assets/images/logo-new.PNG (57 KB) ← الرسمي
- assets/images/logo.png (57 KB)
- assets/images/logo.webp (7 KB)
- assets/images/logo.avif (9 KB)

الملفات المتأثرة:
- demo/smart-hiring-system/index.html (سطر 39 و 634)

الحل: استبدل /assets/images/logo.PNG بـ /assets/images/logo-new.PNG في هذا الملف فقط.
ملاحظة: ملفات index 2.html ستُحذف في البرومبت 3، فلا تعدّلها.

المشكلة 2: /assets/images/Gemini.png (18 مرجع)
الملف غير موجود في assets/images/ لكنه موجود في blog/Gemini.png

الملفات المتأثرة (6 ملفات):
- sectors/ecommerce-en/index.html (سطر 163-165)
- sectors/energy-en/index.html (سطر 163-165)
- sectors/finance-en/index.html (سطر 163-165)
- sectors/healthcare-en/index.html (سطر 163-165)
- sectors/logistics-en/index.html (سطر 163-165)
- sectors/manufacturing-en/index.html (سطر 198-200)

الحل: انسخ blog/Gemini.png إلى assets/images/Gemini.png حتى تعمل كل المراجع.

التحقق:
- npm run resource:audit:before → يجب أن يكون Broken paths: 0
- npm run internal-links:audit → يجب أن تنخفض الأعطال
```

---

### البرومبت 5: إضافة الصفحات العامة المفقودة للسايت ماب

```
أنت وكيل Technical SEO لمشروع Bright AI.

المهمة: إضافة الصفحات العامة المفقودة إلى sitemap.xml

فحص seo:qa أظهر 4 صفحات مطلوبة مفقودة:
1. /smart-medical-archive/ → الديمو موجود في /demo/smart-medical-archive/ لكن لا يوجد صفحة في المسار الجذري
2. /tenders/ → المحتوى موجود في /demo/ai-tenders-analysis/
3. /tenders/landing/ → المحتوى في /demo/ai-tenders-analysis/landing/
4. /tenders/compare/ → المحتوى في /demo/ai-tenders-analysis/compare/

أيضاً، فحص internal-links:audit أظهر أن 110 صفحة عامة خارج السايت ماب.

المطلوب:
1. افحص scripts/high-confidence-sitemap-config.mjs وafهم الصفحات المطلوبة.
2. أضف redirects في _redirects:
   /smart-medical-archive/  /demo/smart-medical-archive/  301
   /tenders/                 /demo/ai-tenders-analysis/    301
   /tenders/landing/         /demo/ai-tenders-analysis/landing/  301
   /tenders/compare/         /demo/ai-tenders-analysis/compare/  301
3. حدّث high-confidence-sitemap-config.mjs ليعكس الروابط الصحيحة بعد الـ redirects.
4. أو بدلاً من ذلك، أنشئ صفحات landing مبسطة في المسارات المطلوبة تشير للديمو.
5. شغّل npm run sitemap:all لتحديث السايت ماب.

التحقق:
- npm run seo:qa → يجب أن يمر بدون أخطاء IMPORTANT_URL_MISSING
- npm run seo:check
```

---

### البرومبت 6: إصلاح مشاكل Hreflang (45 صفحة)

```
أنت وكيل Technical SEO + International SEO لمشروع Bright AI.

المهمة: إصلاح 45 مشكلة hreflang اكتشفها فحص html-seo-governor.

الوضع الحالي:
- 44 صفحة تفتقر لـ canonical
- 45 صفحة بمشاكل hreflang (مفقود أو غير متطابق)
- صفحات الديمو العربية: 29 منها لديها hreflang ar-SA لكن فقط 1 لديها hreflang en-SA

القواعد:
لكل صفحة لها نسخة إنجليزية مقابلة يجب أن تحتوي:
```html
<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/PAGE_AR/">
<link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/PAGE_EN/">
<link rel="alternate" hreflang="x-default" href="https://brightai.site/PAGE_AR/">
```

والنسخة الإنجليزية يجب أن تحتوي نفس الثلاثة بشكل reciprocal:
```html
<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/PAGE_AR/">
<link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/PAGE_EN/">
<link rel="alternate" hreflang="x-default" href="https://brightai.site/PAGE_AR/">
```

لصفحة ديمو عربية بدون نسخة إنجليزية، يكفي:
```html
<link rel="alternate" hreflang="ar-SA" href="SELF_URL">
<link rel="alternate" hreflang="x-default" href="SELF_URL">
```

المطلوب:
1. شغّل npm run seo:html:check لمعرفة الصفحات المتأثرة بالتفصيل.
2. شغّل npm run seo:html:fix لتطبيق الإصلاحات التلقائية.
3. بعد الإصلاح التلقائي، تحقق يدوياً من الصفحات المتبقية.
4. تأكد أن كل hreflang reciprocal (كل نسخة تشير للأخرى).
5. لا تُضف hreflang لصفحة مقابلة غير موجودة فعلياً.

التحقق:
- npm run seo:html:check → Missing/mismatched hreflang: 0
- npm run seo:html:check → Missing canonical: 0
```

---

### البرومبت 7: تعزيز الربط الداخلي

```
أنت وكيل Technical SEO + Internal Linking لمشروع Bright AI.

المهمة: تعزيز الربط الداخلي لتحقيق الفهرسة الكاملة.

الوضع الحالي:
- 6,693 رابط داخلي عبر 274 صفحة
- 0 صفحة يتيمة ← ممتاز
- 4 صفحات بروابط داخلية = 0 (معزولة)
- 1 صفحة في السايت ماب بدون روابط داخلية كافية

الصفحات المعزولة:
- /smart-medical-archive/ → 0 روابط
- /tenders/ → 0 روابط
- /tenders/landing/ → 0 روابط
- /tenders/compare/ → 0 روابط

المطلوب:
1. في الصفحة الرئيسية (index.html):
   - تأكد من وجود رابط واضح لـ /demo/ في قسم Hero أو Navigation
   - أضف قسم "جرّب حلولنا" يعرض أهم 4-6 ديموهات

2. في صفحة /demo/index.html:
   - تأكد أن كل الديموهات الـ 29 مذكورة ومربوطة

3. في كل صفحة خدمة (/services/*.html):
   - تأكد من وجود رابط CTA يشير للديمو المقابل
   - مثال: في services/smart-hiring-system.html → رابط لـ /demo/smart-hiring-system/
   - النص: "جرّب النموذج التجريبي" أو "شاهد الديمو"

4. في كل صفحة ديمو:
   - تأكد من وجود رابط يعود لصفحة الخدمة المقابلة
   - هذا موجود حالياً ← فقط تحقق

5. في الـ Footer المشترك (إذا وجد):
   - أضف روابط لأهم 5 ديموهات وأهم 5 خدمات

التحقق:
- npm run internal-links:audit → pagesOutsideSitemap أقل
- npm run internal-links:audit → sitemapMissingInternalLinks: 0
- npm run seo:qa → LOW_INTERNAL_LINKS: 0
```

---

## 🟡 المرحلة 3: إصلاحات متوسطة الأولوية (Medium)

---

### البرومبت 8: إنشاء صور og:image مخصصة لكل ديمو

```
أنت وكيل Frontend + SEO لمشروع Bright AI.

المهمة: تحسين صور og:image لصفحات الديمو.

الوضع الحالي: كل صفحات الديمو تستخدم /assets/images/logo-new.PNG كصورة og:image. هذا يعني أن كل الصفحات تظهر بنفس الصورة عند المشاركة على وسائل التواصل — ضعيف جداً للـ CTR.

المطلوب:
1. أنشئ سكربت Node.js في scripts/generate-og-images.mjs يولّد صور OG بحجم 1200×630 لكل ديمو.
2. كل صورة تحتوي:
   - خلفية gradient بألوان Bright AI (الأزرق الغامق #07111f → #1a3a5c)
   - شعار Bright AI في الزاوية
   - عنوان الديمو بالعربي بخط كبير
   - وصف مختصر بخط أصغر
   - badge "جرّب مجاناً"
3. احفظ الصور في: assets/images/og/demo-{slug}.png
4. حدّث og:image و twitter:image في كل صفحة ديمو للإشارة للصورة المخصصة.

البديل السريع (إذا كان توليد الصور معقداً):
- أنشئ صورة SVG template واحدة وحوّلها لـ PNG لكل ديمو.
- أو استخدم أداة مثل @vercel/og أو puppeteer لتوليد الصور.

التحقق:
- ls assets/images/og/ → يجب أن يحتوي صورة لكل ديمو
- grep "og:image" demo/*/index.html → يجب أن يشير لصور مخصصة
```

---

### البرومبت 9: تحويل CSS إلى Logical Properties لدعم RTL

```
أنت وكيل Frontend + RTL لمشروع Bright AI.

المهمة: تحويل CSS من physical properties إلى logical properties لدعم RTL بشكل كامل.

اقرأ مهارة rtl-ui-guardian من:
@/Users/yzydalshmry/Desktop/BRIGHTAI/.agents/skills/rtl-ui-guardian/SKILL.md

الوضع الحالي: تقرير ui:audit اكتشف 28 مشكلة عالية الخطورة متعلقة بـ RTL في ملفات CSS:
- استخدام left/right بدل margin-inline-start/end
- استخدام padding-left/right بدل padding-inline-start/end
- أحجام ثابتة (min-height: 50px) قد تقص النصوص العربية

الملفات المتأثرة الرئيسية:
- assets/css/components.css
- assets/css/brightai-home-executive.css
- assets/css/demo-premium.css (إذا وجد مشاكل)

المطلوب:
1. ابحث عن كل استخدامات margin-left/right, padding-left/right, left, right في CSS.
2. حوّلها إلى:
   - margin-left → margin-inline-start
   - margin-right → margin-inline-end
   - padding-left → padding-inline-start
   - padding-right → padding-inline-end
   - left → inset-inline-start
   - right → inset-inline-end
   - text-align: left → text-align: start
   - text-align: right → text-align: end
3. لا تغيّر القيم التي تستخدم في سياق position: fixed/absolute حيث الموضع مقصود بالتحديد (مثل شريط التنقل الثابت).
4. استبدل min-height الثابتة بـ min-height مع clamp() أو rem بدل px.

التحقق:
- npm run ui:audit → يجب أن تنخفض المشاكل العالية من 28
- افتح الموقع محلياً وتأكد أن التصميم لم يتغير بصرياً
```

---

### البرومبت 10: إنشاء نسخ إنجليزية لأهم الديموهات

```
أنت وكيل Frontend + International SEO لمشروع Bright AI.

المهمة: إنشاء نسخ إنجليزية لأهم 5 صفحات ديمو تجارية.

الديموهات المطلوب ترجمتها (حسب الأولوية التجارية):
1. /demo/smart-hiring-system/ → /en/demo/smart-hiring-system/
2. /demo/ai-tenders-analysis/ → /en/demo/ai-tenders-analysis/
3. /demo/data-analyzer/ → /en/demo/data-analyzer/
4. /demo/custom-ai-agent/ → /en/demo/custom-ai-agent/
5. /demo/customer-service-automation/ → /en/demo/customer-service-automation/

لكل صفحة:
1. انسخ هيكل صفحة الديمو العربية.
2. غيّر lang="ar-SA" dir="rtl" إلى lang="en" dir="ltr".
3. ترجم كل المحتوى للإنجليزي (titles, descriptions, H1, FAQ, CTA, use cases).
4. حدّث canonical ليشير للنسخة الإنجليزية.
5. أضف hreflang متبادل بين النسختين:
   ```html
   <link rel="alternate" hreflang="ar-SA" href="https://brightai.site/demo/SLUG/">
   <link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/demo/SLUG/">
   <link rel="alternate" hreflang="x-default" href="https://brightai.site/demo/SLUG/">
   ```
6. حدّث Schema JSON-LD: inLanguage: "en", النصوص بالإنجليزي.
7. حدّث og:locale إلى en_US.
8. حدّث النصوص داخل demo-config JSON.
9. CSS يبقى نفسه (demo-premium.css يدعم LTR و RTL).
10. أضف كل صفحة جديدة في sitemap.xml.

التحقق:
- npm run seo:html:check → لا أخطاء جديدة
- npm run seo:check
- افتح كل صفحة إنجليزية وتأكد أن المحتوى مترجم بالكامل
```

---

### البرومبت 11: تحسين السيو السعودي (Saudi Keywords)

```
أنت وكيل SEO Content + Saudi Market لمشروع Bright AI.

المهمة: تحسين عناوين ووصف صفحات الديمو بكلمات مفتاحية سعودية.

اقرأ كل ملف demo/*/index.html وحدّث <title> و <meta name="description"> و <h1> حسب الجدول التالي:

| الديمو | العنوان الحالي | العنوان المحسّن (title) | H1 المحسّن | Meta Description المحسّن |
|--------|--------------|----------------------|-----------|------------------------|
| smart-hiring-system | نظام التوظيف الذكي | نظام توظيف ذكي بالذكاء الاصطناعي للشركات السعودية \| Bright AI | نظام توظيف ذكي بالذكاء الاصطناعي | جرّب نظام التوظيف الذكي من Bright AI — فلترة سير ذاتية، تقييم مرشحين، وجدولة مقابلات بالذكاء الاصطناعي للشركات السعودية. |
| ai-tenders-analysis | تحليل المناقصات | تحليل المناقصات بالذكاء الاصطناعي \| Bright AI | تحليل المناقصات الذكي | جرّب تحليل المناقصات الذكي — مقارنة عروض، تقييم مخاطر، وتقارير تنفيذية للمناقصات الحكومية والخاصة في السعودية. |
| data-analyzer | منصة تحليل البيانات | تحليل بيانات ذكي للشركات السعودية \| Bright AI | منصة تحليل البيانات الذكية | حلّل بياناتك بالذكاء الاصطناعي — لوحات تحكم تفاعلية، رؤى تنفيذية، وتقارير مخصصة للشركات السعودية من Bright AI. |
| customer-service-automation | أتمتة خدمة العملاء | شات بوت عربي ذكي لأتمتة خدمة العملاء \| Bright AI | أتمتة خدمة العملاء بالذكاء الاصطناعي | جرّب شات بوت عربي ذكي — رد تلقائي، تذاكر دعم، وتحليل رضا العملاء بالذكاء الاصطناعي للشركات السعودية. |
| custom-ai-agent | وكيل ذكاء اصطناعي مخصص | وكيل ذكاء اصطناعي مخصص لشركتك \| Bright AI | وكيل ذكاء اصطناعي مخصص | صمّم وكيل AI مخصص لعمليات شركتك — أتمتة مهام، تحليل بيانات، وتكامل مع أنظمتك. حلول ذكاء اصطناعي سعودية من Bright AI. |
| smart-medical-archive | أرشفة طبية ذكية | نظام أرشفة طبية ذكية بالذكاء الاصطناعي \| Bright AI | أرشفة طبية ذكية | جرّب نظام الأرشفة الطبية الذكية — إدارة سجلات المرضى، استخراج بيانات طبية، وأتمتة التوثيق للمستشفيات السعودية. |
| ocr-demo | استخراج نصوص ذكي | استخراج نصوص من مستندات بالذكاء الاصطناعي \| Bright AI | استخراج نصوص ذكي من المستندات | حوّل مستنداتك الورقية والمسحوضة إلى نصوص رقمية قابلة للبحث — OCR عربي ذكي للشركات السعودية من Bright AI. |
| seo-ai-agent | وكيل SEO ذكي | وكيل سيو بالذكاء الاصطناعي لتحسين موقعك \| Bright AI | وكيل SEO ذكي | حسّن ترتيب موقعك في Google — وكيل SEO ذكي يحلل الصفحات، يقترح تحسينات، ويراقب الأداء. جرّبه مجاناً من Bright AI. |

المطلوب:
1. حدّث <title> في كل ملف (بحد أقصى 60 حرف).
2. حدّث <meta name="description"> (بحد أقصى 155 حرف).
3. لا تغيّر H1 إلا إذا كان يفتقر للكلمة المفتاحية الرئيسية.
4. حدّث og:title و twitter:title ليطابق title.
5. حدّث og:description و twitter:description ليطابق meta description.
6. حدّث Schema JSON-LD > name و description ليتسق مع العناوين الجديدة.

التحقق:
- npm run seo:html:check
- npm run seo:headings (إذا متاح)
```

---

## 🟢 المرحلة 4: تحسينات إضافية (Low)

---

### البرومبت 12: إضافة Breadcrumbs مرئية لصفحات الديمو

```
أنت وكيل Frontend + UX لمشروع Bright AI.

المهمة: إضافة breadcrumbs مرئية في أعلى كل صفحة ديمو.

الوضع الحالي: صفحات الديمو تحتوي BreadcrumbList Schema لكن لا يوجد breadcrumbs مرئي في HTML.

المطلوب:
1. أضف عنصر breadcrumbs مرئي بعد <header> مباشرة في كل صفحة ديمو:
   ```html
   <nav class="breadcrumbs" aria-label="مسار التنقل">
     <ol>
       <li><a href="/">الرئيسية</a></li>
       <li><a href="/demo/">الديموهات</a></li>
       <li aria-current="page">اسم الديمو</li>
     </ol>
   </nav>
   ```
2. أضف CSS في demo-premium.css:
   ```css
   .breadcrumbs { padding: 0.75rem 1.5rem; font-size: 0.85rem; }
   .breadcrumbs ol { display: flex; gap: 0.5rem; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
   .breadcrumbs li + li::before { content: "›"; margin-inline-end: 0.5rem; opacity: 0.5; }
   .breadcrumbs a { color: var(--color-accent, #60a5fa); text-decoration: none; }
   .breadcrumbs a:hover { text-decoration: underline; }
   .breadcrumbs [aria-current] { color: var(--color-text-secondary, #94a3b8); }
   ```
3. تأكد أن الاسم في breadcrumbs يطابق H1 أو عنوان الديمو.

التحقق:
- افتح أي صفحة ديمو وتأكد أن breadcrumbs يظهر بشكل صحيح
- npm run seo:html:check
```

---

### البرومبت 13: تعزيز عناصر الثقة في صفحات الديمو

```
أنت وكيل UX + Conversion Optimization لمشروع Bright AI.

المهمة: إضافة عناصر ثقة في صفحات الديمو لتحسين معدل التحويل.

المطلوب:
1. أضف قسم "لماذا تثق بـ Bright AI" بعد قسم حالات الاستخدام في كل صفحة ديمو:
   ```html
   <section class="section trust-section" aria-labelledby="trust-heading">
     <h2 id="trust-heading">لماذا تثق بـ Bright AI</h2>
     <div class="trust-grid">
       <div class="trust-item">
         <strong>🇸🇦 سعودي 100%</strong>
         <p>مبنية للسوق السعودي، تدعم العربية بالكامل.</p>
       </div>
       <div class="trust-item">
         <strong>🔒 خصوصية البيانات</strong>
         <p>بياناتك تبقى عندك. لا نشاركها مع أي طرف.</p>
       </div>
       <div class="trust-item">
         <strong>⚡ جاهز خلال 48 ساعة</strong>
         <p>النسخة المخصصة جاهزة خلال 48 ساعة من المراجعة.</p>
       </div>
       <div class="trust-item">
         <strong>🏢 +50 شركة سعودية</strong>
         <p>نخدم شركات في الرياض وجدة والدمام.</p>
       </div>
     </div>
   </section>
   ```
2. أضف CSS مناسب في demo-premium.css للـ trust-grid.
3. تأكد أن القسم يظهر قبل الـ CTA النهائي.

التحقق:
- افتح أي صفحة ديمو وتأكد أن قسم الثقة يظهر بشكل صحيح
```

---

### البرومبت 14: فحص شامل نهائي وتحقق

```
أنت وكيل QA + Technical SEO لمشروع Bright AI.

المهمة: فحص شامل نهائي بعد تطبيق كل الإصلاحات.

شغّل كل هذه الأوامر بالترتيب وسجّل نتائج كل واحد:

1. npm run sitemap:all
2. npm run seo:gate
3. npm run seo:check
4. npm run seo:qa
5. npm run seo:html:check
6. npm run internal-links:audit
7. npm run resource:audit:before
8. npm run ui:audit
9. npm run performance:budget

لكل أمر:
- إذا نجح: ✅ سجّل "ناجح"
- إذا فشل: ❌ سجّل سبب الفشل وعدد المشاكل المتبقية

بعد تشغيل كل الأوامر، اكتب تقرير ملخص يحتوي:
1. جدول بنتائج كل أمر
2. المشاكل المتبقية (إن وجدت)
3. مقارنة بين الحالة قبل وبعد الإصلاحات
4. الخطوات التالية المتبقية (إن وجدت)

معايير القبول النهائية (يجب أن تتحقق كلها):
- [ ] sitemap.xml لا يحتوي /reports/keywords/
- [ ] sitemap.xml لا يحتوي index 2
- [ ] لا توجد صفحات demo عليها noindex
- [ ] لا توجد صفحات demo محجوبة من robots.txt
- [ ] كل صفحة demo لها canonical ذاتي
- [ ] كل صفحة demo لها title/meta/H1
- [ ] npm run seo:gate يمر بدون Critical Errors
- [ ] npm run resource:audit:before → Broken paths: 0
- [ ] npm run internal-links:audit → brokenLinks: 0
- [ ] npm run performance:budget → ناجحة
```

---

### البرومبت 15: توليد تقرير DOCX محدّث بعد الإصلاحات

```
أنت وكيل SEO Reporting لمشروع Bright AI.

المهمة: توليد تقرير DOCX محدّث بعد تطبيق كل الإصلاحات.

شغّل الأمر التالي:
node scripts/generate-seo-report-docx.mjs

ثم قارن النتائج الجديدة مع التقرير السابق:
- الدرجة الإجمالية: كانت ~62% → يجب أن تكون >85%
- روابط /reports/ في السايت ماب: كانت 41 → يجب أن تكون 0
- روابط index 2: كانت 2 → يجب أن تكون 0
- أصول مكسورة: كانت 28 → يجب أن تكون 0
- مشاكل hreflang: كانت 45 → يجب أن تنخفض كثيراً

إذا كانت النتائج أقل من المتوقع، حدد المشاكل المتبقية واقترح حلولها.
```

---

## 📋 ملخص ترتيب التنفيذ

| # | البرومبت | الأولوية | الوقت التقديري |
|---|---------|---------|---------------|
| 1 | تنظيف السايت ماب | 🔴 حرجة | 5 دقائق |
| 2 | تحديث سكربت السايت ماب | 🔴 حرجة | 15 دقيقة |
| 3 | حذف ملفات index 2 | 🔴 حرجة | 5 دقائق |
| 4 | إصلاح الأصول المكسورة | 🟠 عالية | 10 دقائق |
| 5 | إضافة صفحات مفقودة | 🟠 عالية | 15 دقيقة |
| 6 | إصلاح Hreflang | 🟠 عالية | 20 دقيقة |
| 7 | تعزيز الربط الداخلي | 🟠 عالية | 20 دقيقة |
| 8 | صور og:image مخصصة | 🟡 متوسطة | 30 دقيقة |
| 9 | تحويل CSS لـ RTL | 🟡 متوسطة | 25 دقيقة |
| 10 | نسخ إنجليزية للديمو | 🟡 متوسطة | 45 دقيقة |
| 11 | السيو السعودي | 🟡 متوسطة | 15 دقيقة |
| 12 | Breadcrumbs مرئية | 🟢 منخفضة | 15 دقيقة |
| 13 | عناصر الثقة | 🟢 منخفضة | 15 دقيقة |
| 14 | فحص نهائي | ✅ تحقق | 10 دقائق |
| 15 | تقرير محدّث | 📄 توثيق | 5 دقائق |

**الإجمالي التقديري: ~4 ساعات**
