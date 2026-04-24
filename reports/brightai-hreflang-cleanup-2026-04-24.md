# تقرير تنظيف hreflang في BrightAI

**التاريخ:** 24 أبريل 2026  
**النطاق:** الصفحات القابلة للفهرسة في BrightAI  
**السياسة النهائية المعتمدة:** `ar-SA` + `en-SA`

---

## السياسة المعتمدة

تم اعتماد سياسة لغة وإقليم موحدة للموقع:

- الصفحات العربية: `hreflang="ar-SA"`
- الصفحات الإنجليزية: `hreflang="en-SA"`
- `x-default`:
  - يشير إلى النسخة العربية عندما توجد نسخة عربية/إنجليزية مزدوجة
  - ويشير إلى الصفحة نفسها عندما لا يوجد نظير لغوي آخر

كما تم اعتماد القواعد التالية:

- يمنع استخدام `index.html` داخل `hreflang`
- يمنع استخدام `.html` داخل `hreflang` إذا كانت الصفحة العامة المعيارية منتهية بـ `/`
- أي `hreflang` يجب أن يشير إلى النسخة المعيارية فقط

---

## النتيجة قبل وبعد

| المؤشر | قبل | بعد |
|---|---:|---:|
| الصفحات القابلة للتدقيق | 196 | 196 |
| الصفحات التي لديها مشاكل | 14 | 0 |
| مشاكل `hreflang` | 13 | 0 |
| مشاكل `canonical` المرتبطة بالإشارات الدولية | 7 | 0 |

---

## نوع المشاكل التي كانت موجودة

### 1. سياسة لغة غير متسقة

كانت الأداة تعتبر `en-US` هو المتوقع، بينما الصفحات الفعلية مبنية على `en-SA`.

### 2. `hreflang` يشير إلى نسخ غير معيارية

أمثلة:

- `https://brightai.site/en/ai-workflows/index.html`
- `https://brightai.site/en/tools/index.html`
- `https://brightai.site/blog/digital/`
- `https://brightai.site/blog/gov/`

### 3. تكرار وسوم اللغة

بعض الصفحات كانت تحتوي `Duplicate hreflang en-SA`.

### 4. `x-default` يشير إلى صفحة غير صحيحة

بعض الصفحات الإنجليزية كانت ترسل `x-default` إلى مسار قديم أو غير متوقع.

---

## الصفحات التي كانت ترسل إشارات hreflang خاطئة

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

---

## الصفحات التي تم تصحيحها فعلياً

- `blog/ai-manufacturing-digital-guide.html`  
  تم إصلاح `canonical` و`hreflang`

- `blog/building-ai-agents-guide.html`  
  تم إصلاح `canonical` و`hreflang`

- `blog/data-analysis-best-practices.html`  
  تم إصلاح `canonical` و`hreflang`

- `blog/government-ai-solutions.html`  
  تم إصلاح `canonical` و`hreflang`

- `blog/industrial-automation-repetitive-tasks.html`  
  تم إصلاح `canonical` و`hreflang`

- `blog/workplace-automation-guide.html`  
  تم إصلاح `canonical` و`hreflang`

- `docs/privacy-policy-en/index.html`  
  تم إصلاح `canonical` و`hreflang`

- `en/ai-workflows/index.html`  
  تم إصلاح `hreflang`

- `en/privacy-cookies/index.html`  
  تم إصلاح `hreflang`

- `en/smart-medical-archive/index.html`  
  تم إصلاح `hreflang`

- `en/terms/index.html`  
  تم إصلاح `hreflang`

- `en/tools/index.html`  
  تم إصلاح `hreflang`

- `tenders/landing.html`  
  تم إصلاح `hreflang`

---

## تعديل منطق الفحص نفسه

تم أيضاً تحديث منطق أدوات SEO المحلية حتى يتوافق مع السياسة الفعلية للموقع:

- [scripts/html-seo-governor.mjs](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/html-seo-governor.mjs)
- [scripts/seo-url-map.mjs](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/seo-url-map.mjs)

ما الذي تغير:

- استبدال التوقع من `en-US` إلى `en-SA`
- تحسين مطابقة النظائر العربية/الإنجليزية لصفحات `...-en/index.html`

---

## النتيجة النهائية

ضمن نطاق الصفحات القابلة للفهرسة التي تدققها الأداة:

- لم يعد هناك أي خطأ `hreflang`
- لم يعد هناك أي `Duplicate hreflang`
- لم يعد هناك أي `hreflang` يشير إلى `index.html`
- لم يعد هناك أي `hreflang` يشير إلى نسخة عامة غير معيارية داخل الصفحات المصححة

المتبقي خارج هذا البرومبت:

- تنظيف `sitemap.xml`
- إصلاح الصفحات التشغيلية أو غير العامة التي ما زالت تظهر كـ ghost targets في فحص `seo-health-check`
- استكمال تنظيف `canonical` في باقي المسارات التاريخية إذا ظهرت بعد النشر الحي
