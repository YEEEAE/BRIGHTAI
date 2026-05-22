# 🎯 برومبتات Codex لتنفيذ تقرير SEO الشامل — Bright AI

> **طريقة الاستخدام:** نفّذ كل برومبت بالترتيب. كل برومبت مستقل ويمكن تنفيذه في جلسة Codex منفصلة.
> بعد كل برومبت، شغّل أوامر التحقق المذكورة في نهايته للتأكد من نجاح التنفيذ.

---



### البرومبت 9: تحويل CSS إلى Logical Properties لدعم RTL

---

### البرومبت 10: إنشاء نسخ إنجليزية لأهم الديموهات

```

---

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
