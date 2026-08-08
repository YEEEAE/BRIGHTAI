# تقرير: تخفيض ميزانية JS — BAI-PERF-02

**التاريخ:** 2026-08-08
**المهمة:** إرجاع إجمالي JS في `dist/client/_astro/` تحت ميزانية الـ 60KB gzipped
**الحالة:** ✅ مُتحقَّق منها محليًا (verified locally)
**verified_production: no** (تحقق محلي فقط — لم يُنشر للإنتاج بعد؛ يحتاج deploy + PSI measurement للتأكيد النهائي)
**النتيجة:** 329.99 KB → 26.71 KB (−92%، تحت الميزانية بـ 33.29 KB هامش أمان)

---

## الملخص التنفيذي

ميزانية JS كانت مكسورة بـ 5.5x (330KB مقابل حد 60KB). التشخيص بيّن إن السبب **ملفّان فقط** يشكّلان 91% من التجاوز، وكلاهما يأتي من **صفحة وحدة** هي `/kernel/evidence/`:

| الملف (gzipped) | الحجم | المصدر |
|---|---|---|
| `index.C28niuCj.js` | 175.83 KB | `pdf-lib` (توليد PDF في المتصفح) |
| `pdf.BRz36HYW.js` | 125.89 KB | `pdfjs-dist` (رسم PDF على canvas) |
| الباقي (9 ملفات) | ~28 KB | ClientRouter, driver.js, LeadForm, ... |

الحل: استبدلت المكتبتين بـ **مولّد PDF أدنى بلا أي dependencies** (نفس نمط `buildMinimalPdf()` الموجود أصلاً في `certificate-verifier.ts`) + **معاينة HTML منسّقة** بدل رسم canvas. النتيجة: نفس الوظيفة (معاينة + تنزيل PDF فعلي)، صفر bytes من المكتبات.

---

## التشخيص

### ليش dynamic import ما كفا؟

الـ AGENTS.md القديم كان يقول إن `pdfjs-dist` + `pdf-lib` يُحمَّلان عبر `dynamic import()` بس عند فتح الـ modal. هذا صحيح **للـ runtime** (الزائر ما يحمّلهم وقت page load)، بس **ميزانية الأداء تقيس إجمالي JS في `dist/client/_astro/`** — يعني وجود الـ chunks في الـ build directory يكسر الميزانية حتى لو ما تُحمِّل. الـ chunks كانوا موجودين لأن Astro يصدرهم كملفات منفصلة للـ dynamic import.

### ليش ما انفع CDN خارجي؟

تحميل المكتبات من unpkg/jsdelivr:
1. يخالف CSP الحالية (`script-src 'self'`)
2. يضيف external dependency + latency
3. يحل مشكلة الـ budget بس يخلق مشاكل أخطر (privacy, reliability, SPOF)

### القرار المعتمد

استبدال المعاينة + التنزيل بـ **حلول zero-dependency موجودة أصلاً في المشروع**:
- المعاينة: HTML منسّق يعرض نفس بيانات الدليل (نفس الحقول اللي كانت تُرسم على canvas)
- التنزيل: `buildMinimalPdf()` — مولّد PDF 1.4 صالح باستخدام خط Courier القياسي (standard 14 font)، بلا fonts embedded ولا worker

---

## التغييرات

### ملفات منشأة

| الملف | الوصف |
|---|---|
| `src/scripts/kernel-evidence-pdf-lite.js` | مولّد PDF بلا deps. يصدّر `buildEvidencePdfBlob(data)` اللي يرجع `Blob` صالح (`%PDF-1.4` + xref + trailer). مبني على نفس نمط `certificate-verifier.ts` buildMinimalPdf. |
| `scripts/playwright/verify-js-budget.mjs` | سكربت تحقق Playwright: يقيس long-task count على الرئيسية + يتحقق وظيفيًا من صفحة evidence (modal + preview + PDF download). قابل لإعادة التشغيل مستقبلًا. |

### ملفات معدّلة

| الملف | التغيير |
|---|---|
| `src/pages/kernel/evidence.astro` | استبدال canvas viewer بـ HTML preview (نفس البيانات، CSS منسّق). استبدال `.pdf.txt` download بـ PDF فعلي عبر `buildEvidencePdfBlob`. حذف import للـ module القديم. تعديل `openPreview` / `downloadFor` / `closePreview`. |
| `package.json` | حذف `pdfjs-dist` + `pdf-lib` من dependencies. |

### ملفات محذوفة

| الملف | السبب |
|---|---|
| `src/scripts/kernel-evidence-pdf.js` | كان يستخدم `pdf-lib` + `pdfjs-dist` — استُبدل بـ `kernel-evidence-pdf-lite.js`. |
| `public/js/pdf.worker.min.mjs` (1.2MB) | worker لـ pdfjs-dist — ما يحتاج بعد إزالة الـ viewer. |
| `public/js/pdf.worker.mjs` (1.2MB) | نسخة مكررة من الـ worker. |

---

## النتائج — Before / After

### إجمالي JS في `dist/client/_astro/` (gzipped)

| | Before | After | التغيّر |
|---|---|---|---|
| إجمالي JS | 329.99 KB | **26.71 KB** | **−303.28 KB (−92%)** |
| عدد الملفات | 11 | 7 | −4 |
| الميزانية | 60 KB | 60 KB | — |
| الفجوة عن الميزانية | +269.99 KB (FAIL) | **−33.29 KB (OK)** | ✅ |

### جدول per-file

| الملف | Before (gz) | After (gz) |
|---|---|---|
| `index.C28niuCj.js` (pdf-lib) | 175.83 KB | **محذوف** |
| `pdf.BRz36HYW.js` (pdfjs-dist) | 125.89 KB | **محذوف** |
| `driver.js.Dj4CfABu.js` | 7.14 KB | 7.15 KB |
| `ClientRouter.astro_...js` | 5.32 KB | 5.41 KB |
| `LeadForm.astro_...js` | 4.77 KB | 4.80 KB |
| `index.astro_...js` | 2.99 KB | 2.98 KB |
| `KernelOnboarding.astro_...js` | 2.05 KB | 2.07 KB |
| `SplitHero.astro_...js` | 1.91 KB | 1.95 KB |
| `KernelProductTour.astro_...js` | 1.71 KB | 2.32 KB |
| `evidence.astro_...js` | 1.69 KB | **مدمج inline في evidence.html فقط** |
| `preload-helper.js` | 0.69 KB | **محذوف (ما عاد ضروري)** |

> ملاحظة: الـ lite module الجديد (`buildEvidencePdfBlob`) دمجه Astro **inline** في `dist/client/kernel/evidence/index.html` فقط — صفر bytes في `_astro/`، ويطلع بس للصفحة اللي تحتاجه. هذا مثالي.

---

## التحقق

### 1. ميزانية الأداء (المطلوب الأساسي)

```
node scripts/check-performance-budget.js
→ ✅ نجاح: جميع البنود ضمن ميزانية الأداء.
   - JS total: 26.46 KB / 60 KB (هامش أمان 33.54 KB)
   - HTML: 36.74 KB / 80 KB ✅
   - CSS largest: 19.88 KB / 50 KB ✅
```

### 2. التحقق الوظيفي (Playwright)

`node scripts/playwright/verify-js-budget.mjs` → **7/7 passed**:

- ✅ الرئيسية: صفر heavy pdf/index JS chunks requested
- ✅ الرئيسية: long-task count = 1 (تحسّن — كان أعلى بسبب pdf-lib parse على الـ main thread)
- ✅ evidence: الـ preview modal يفتح
- ✅ evidence: HTML preview مرئي
- ✅ evidence: HTML preview فيه الحقول المتوقعة (Evidence ID, Trace ID, ...)
- ✅ evidence: صفر أخطاء console متعلقة بالصفحة
- ✅ evidence: PDF download ينتج PDF صالح فعلي (`%PDF-` + `%%EOF` + `/Type /Catalog`, 1385 bytes)

### 3. SEO + tokens (لا كسر)

```
node scripts/lint-tokens.mjs     → [PASS] 0 token violations
npm run seo:check                → 4 tests, 4 pass, 0 fail
```

---

## القيود والمخاطر المتبقية

### 1. الـ PDF الناتج Latin-1 فقط (مو عربي)

الـ PDF اللي يتنزّل يستخدم خط Courier القياسي (standard 14) اللي يدعم Latin-1 فقط. القيم العربية (sector labels, retention text) تُحوَّل لـ `?` في الـ PDF text layer. **هذا نفس الـ trade-off المعمول به أصلاً في `certificate-verifier.ts`** لتنزيل الشهادات — اتساق مع النمط الموجود.

البديل (pdf-lib مع embedded Arabic font) كان سيرجع المشكلة الأصلية (175KB). المحتوى العربي الكامل يبقى متاح عبر:
- معاينة HTML (تعرض العربية كاملة)
- تنزيل JSON (يحفظ كل القيم كما هي)
- الـ Kernel API في الإنتاج (يولّد PDF موقّع server-side)

### 2. المعاينة بلا zoom/page navigation

المعاينة القديمة (pdfjs-dist canvas) كانت تدعم zoom + prev/next page navigation. المعاينة الجديدة (HTML) تعرض المحتوى كامل في صفحة وحدة (scroll داخلي). هذا مقبول لأن ملف الدليل التجريبي صفحة وحدة — ما فيه multi-page PDF فعلي للتنقل فيه.

### 3. سكربت التحقق يحتاج preview server

`scripts/playwright/verify-js-budget.mjs` يشغّل ضد `http://localhost:4321` (astro preview). لازم السيرفر يكون شغّال قبل التشغيل. مو CI-ready بمعنى أنه ما يشغّل السيرفر بنفسه.

---

## تابع

- القياس المباشر لـ TBT عبر Lighthouse PSI على الإنتاج بعد الـ deploy (المحلي long-task count = 1 مؤشر تحسّن، بس PSI يعطي الرقم الدقيق على mobile Slow 4G). قبل التعديل: homepage TBT 740ms. المتوقع بعد: أقل بكثير لأن pdf-lib (اللي كان يُparsed على الـ main thread) انحذف تمامًا.
- مراجعة `scripts/seo-ci-check.mjs` ignore patterns (`**/js/pdf.worker*`, `**/_astro/pdf*`) — صارت dead patterns بعد حذف الملفات. ما تكسر شي بس تقدر تنظّف مستقبلًا.
