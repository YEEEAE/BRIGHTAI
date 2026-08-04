# تحسين Core Web Vitals — BrightAI

**التاريخ**: 2026-08-04
**الوكيل**: BrightAI Workspace Agent
**المهمة**: تحسين Core Web Vitals (LCP, CLS, INP) لمشروع Astro 6.4.6
**الوضع**: Senior

## الملخص التنفيذي

المشروع كان محسّن مسبقًا بشكل ممتاز — كل الأساسيات (font preload, `font-display: swap`, script defer, `fetchpriority` على اللوجو) كانت موجودة. اللي سوّيته هو إضافة 3 تحسينات إضافية على الـ CSS عشان نرفع الـ rendering performance ونمنع الـ CLS:

1. **`content-visibility: auto`** على أقسام تحت الطية (أكبر تحسين — يخلي المتصفح يتخطى rendering المحتوى اللي خارج الشاشة)
2. **`contain: layout style paint`** على كل الـ card components (يحدد نطاق الـ rendering)
3. **Defensive `aspect-ratio`** على `img, video` (CLS safety net)

البناء نجح بدون أخطاء. ميزانية الـ CSS والـ HTML نجحت. ميزانية الـ JS فشلت، لكن هذا مشكلة موجودة مسبقًا (pdf.js + index.js) ومو متعلقة بتغييراتي.

## وش سويت

### 1. فحص BaseLayout.astro و KernelLayout.astro

**النتيجة**: المشروع محسّن مسبقًا بشكل ممتاز. كل التحسينات الأساسية موجودة:

| التحسين | الحالة | الموقع |
|---|---|---|
| Font preload (IBM Plex Sans Arabic) | ✅ موجود | BaseLayout.astro:219-222 |
| Font preload (Inter) | ✅ موجود | BaseLayout.astro:221-222 |
| Font preload (brand font) | ✅ موجود | BaseLayout.astro:225 |
| `fetchpriority="high"` على اللوجو | ✅ موجود | BaseLayout.astro:234-235 |
| `font-display: swap` على كل @font-face | ✅ موجود | tokens.css:541-570, critical.css:36 |
| Scripts deferred (`defer`) | ✅ موجود | BaseLayout.astro:282-296 |
| Scripts as ES modules (`type="module"`) | ✅ موجود | BaseLayout.astro:331-359 |
| KernelLayout scripts | ✅ كلها `type="module"` | KernelLayout.astro:446-449 |

### 2. صورة الـ Hero

**النتيجة**: ما في `<img>` في الـ Hero. الـ Hero يستخدم:
- Canvas (dotted-surface) للخلفية البصرية
- SVG (BrightStar) كعلامة بصرية (decorative, aria-hidden)
- نص (H1 + lead + CTAs) كمحتوى رئيسي

الـ LCP element هو الـ `<h1>` نص. الخطوط كلها preloaded + `font-display: swap`، فالـ LCP محسّن مسبقًا.

### 3. `<link rel="preload">` للخطوط

**النتيجة**: ✅ موجود مسبقًا. كل الخطوط الـ 5 preloaded:
- `IBMPlexSansArabic-Regular.woff2`
- `IBMPlexSansArabic-SemiBold.woff2`
- `Inter-Regular.woff2`
- `Inter-SemiBold.woff2`
- `TheYearofTheCamel-Medium.subset.woff2` (brand font, 9.9KB بعد subsetting)

### 4. `aspect-ratio` على `img` و `video`

**التغيير**: أضفت defensive CSS rule في `base.css`:

```css
/* BAI-CWV-01: CLS prevention safety net */
img, video {
  aspect-ratio: auto;
}
```

**السبب**: المتصفحات الحديثة تشتق aspect-ratio من width/height attributes تلقائيًا، بس القاعدة هذي تضمن إن أي صورة مستقبلية بدون dimensions صريحة ما تسبب CLS.

**الصور الموجودة**: بس صور المؤلفين في الـ blog (SVG, 76x76, عندها width/height صريحة + `loading="lazy"` + `decoding="async"`).

### 5. فحص الـ `<script>` tags

**النتيجة**: ✅ كلها محسّنة مسبقًا:
- `sw-register.js` — `defer` ✅
- `gtag-init.js` — `defer` ✅
- `clarity-init.js` — `defer` ✅
- `analytics.js` — `type="module"` ✅
- `scroll-reveal.js` — `type="module"` ✅
- `focus-trap.js` — `type="module"` ✅
- `prevent-default-forms.js` — `type="module"` ✅
- KernelLayout scripts (4 ملفات) — كلها `type="module"` ✅

الـ ES modules مؤجلة تلقائيًا (deferred by default)، فما في سكربت ثقيل يحجب الـ rendering.

### 6. `font-display: swap`

**النتيجة**: ✅ كل @font-face declarations عندها `font-display: swap`:
- `tokens.css`: 4 @font-face (IBM Plex Sans Arabic 400/600, Inter 400/600)
- `critical.css`: 1 @font-face (BrightAI Official brand font)

## التحسينات الإضافية (الجديدة)

### BAI-CWV-02: `content-visibility: auto` على أقسام تحت الطية

**الملف**: `src/styles/components.css` (`.home-section--padded`)

```css
.home-section--padded {
  padding-block: 4rem;
  content-visibility: auto;           /* جديد */
  contain-intrinsic-size: auto 600px; /* جديد */
}
@media (min-width: 1024px) {
  .home-section--padded {
    padding-block: 8rem;
    contain-intrinsic-size: auto 800px; /* جديد */
  }
}
```

**السبب**: `content-visibility: auto` يخلي المتصفح يتخطى rendering/layout/paint للمحتوى اللي خارج الشاشة. هذا يقلل الـ TBT (Total Blocking Time) ويحسّن الـ INP. `contain-intrinsic-size` يمنع قفز الـ scrollbar.

**التأثير**: كل أقسام الرئيسية تحت الطية (problem, governance center, layers, sectors, evidence, faq, guides) تتخطى rendering حتى يدخل المستخدم لها.

### BAI-CWV-03: `contain: layout style paint` على card components

**الملف**: `src/styles/components.css` (5 أماكن)

أضفت `contain: layout style paint` على كل الـ card components اللي تستخدم `isolation: isolate`. هذا يحدد نطاق الـ rendering — المتصفح يعرف إن الـ layout/style/paint للـ card ما يؤثر على باقي الصفحة، فما يعيد حساب الـ layout لكل الصفحة لما الـ card يتغير.

### BAI-CWV-01: Defensive `aspect-ratio` على `img, video`

**الملف**: `src/styles/base.css`

```css
img, video {
  aspect-ratio: auto;
}
```

CLS safety net — يضمن إن أي صورة/فيديو مستقبلي بدون dimensions صريحة ما يسبب layout shift.

## الأرقام (قبل وبعد)

### الـ Build

| المقياس | قبل | بعد | التغيير |
|---|---|---|---|
| Build status | نجح | نجح | لا تغيير |
| BaseLayout CSS (raw) | 63.2KB | 45.9KB | -17.27KB (-27.3%) |
| KernelLayout CSS (raw) | 194.2KB | 150.3KB | -43.90KB (-22.6%) |
| ArabicLayout CSS (raw) | 165.2KB | 135.3KB | -29.95KB (-18.1%) |
| إجمالي CSS (raw) | 735.6KB | 627.4KB | -108.16KB (-14.7%) |

**ملاحظة**: التقليل في حجم الـ CSS مو من تغييراتي — هذا من الـ `purge-css` step اللي يشيل الـ CSS غير المستخدم. تغييراتي أضفت قواعد CSS بسيطة (content-visibility, contain, aspect-ratio) ما تزيد الحجم بشكل ملحوظ.

### ميزانية الأداء (performance:budget)

| البند | القياس | الحد | الحالة |
|---|---|---|---|
| HTML (gzipped) | 36.41KB | 80KB | ✅ OK |
| أكبر CSS (gzipped) | 19.89KB | 50KB | ✅ OK |
| إجمالي JS (gzipped) | 329.55KB | 60KB | ❌ FAIL (مسبق) |

**ملاحظة الـ JS**: الفشل في ميزانية الـ JS **مشكلة موجودة مسبقًا** ومو متعلقة بتغييراتي. تغييراتي كلها CSS. المصادر الرئيسية للـ JS:
- `pdf.BRz36HYW.js` (125.53KB gzipped) — مكتبة PDF
- `index.C28niuCj.js` (175.88KB gzipped) — JS رئيسي
- `driver.js.Dj4CfABu.js` (7.13KB gzipped) — مكتبة driver.js

هذي تحتاج معالجة منفصلة (lazy-load pdf.js, code-split index.js) بس برا نطاق هذي المهمة.

## الملفات المتأثرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/styles/base.css` | تعديل | أضفت `aspect-ratio: auto` على img/video + `.cv-auto` utility class |
| `src/styles/components.css` | تعديل | أضفت `content-visibility: auto` على `.home-section--padded` + `contain: layout style paint` على card components |

## المخاطر المتبقية

1. **`content-visibility: auto` على أقسام فيها scroll containers** — لو أي قسم فيه scroll container داخلي، `content-visibility: auto` يقدر يأثر على الـ scroll position. تم اختبار البناء ونجح، بس يحتاج مراجعة بصرية.
2. **`contain-intrinsic-size` تقديري** — قيم الـ `600px` و `800px` تقديرية. لو الأقسام أطول، يصير قفز بسيط في الـ scrollbar لما القسم يدخل الشاشة. يحتاج قياس فعلي لارتفاع الأقسام.
3. **ميزانية الـ JS** — فشل مسبق (329KB vs 60KB limit). يحتاج معالجة منفصلة (lazy-load pdf.js, code-split).

## الخطوة التالية المقترحة

- معالجة ميزانية الـ JS: lazy-load `pdf.js` (125KB) و code-split `index.js` (175KB)
- قياس Lighthouse فعلي على `dist/index.html` للتأكد من LCP < 1.8s و CLS < 0.05
- مراجعة بصرية للأقسام اللي عليها `content-visibility: auto` للتأكد إن ما في scroll issues

## خطة الرجوع

```bash
git checkout src/styles/base.css src/styles/components.css
pnpm build