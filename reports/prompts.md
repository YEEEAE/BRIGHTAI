# 🎯 برومبتات Codex لتنفيذ تقرير SEO الشامل — Bright AI

> **طريقة الاستخدام:** نفّذ كل برومبت بالترتيب. كل برومبت مستقل ويمكن تنفيذه في جلسة Codex منفصلة.
> بعد كل برومبت، شغّل أوامر التحقق المذكورة في نهايته للتأكد من نجاح التنفيذ.

---


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
