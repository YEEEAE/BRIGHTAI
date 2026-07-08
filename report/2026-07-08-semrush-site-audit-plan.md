# خطة إصلاح Semrush Site Audit — 2026-07-08

**المشروع**: BrightAI — Saudi AI Safety OS (https://brightai.site)
**Semrush Project ID**: `30320819`
**Snapshot ID**: `6a4dae06708a1073bbcfc5d4`
**تاريخ آخر تدقيق**: 2026-07-08 (Unix: 1783475976940)
**حالة الموقع**: FINISHED — 172 صفحة تم فحصها من أصل 500

---

## 1. الملخص التنفيذي

Semrush رصد على BrightAI 14 error و 282 warning و 296 notice. الموقع عنده نتيجة 88/100 (Theme: Linking ضعيف 88). كل الأخطاء حقيقية وحلها مباشر. أكبر مشكلة مكتشفة: صفحات الـ Kernel تطلق JSON-LD ناقص — `aggregateRating` و `offers` (والحقول المطلوبة للـ SoftwareApplication) مو في الـ HTML رغم إنها موجودة في ملفات الـ migrated JSON. ثاني أكبر مشكلة: في 4xx page حقيقي (صفحة SDAIA blog) كُسر فيها linking داخلي.

الوضع الحالي:

| Metric | Value | Status |
|---|---|---|
| Site Quality (Semrush) | 88/100 | ⚠️ رابط ضعيف |
| AI Search Score | 89/100 | ✅ |
| HTTPS / International SEO / Performance / Markups | 98/100/95/99 | ✅ |
| Linking thematic | 88/100 | ❌ أضعف مقياس |
| Pages crawled | 172 / 500 | ✅ تحت الحد |
| Status code 4xx pages | 1 | ❌ لازم يصلح |
| Status code 5xx pages | 0 | ✅ |

---

## 2. تفاصيل الأخطاء الـ 14 (مرتبة حسب الأولوية)

### الخطأ رقم 1 — Issue #2: 4xx errors — 1 page

**الصفحة**: `https://brightai.site/blog/sdaia-generative-ai-guidelines/`
**الكود**: 404
**الخطورة**: قصوى — صفحة مُفهرسة في Google ترجع 404.

**السبب الجذري**: الصفحة الحقيقية موجودة بس slug مختلف:
- ✅ الملف الحقيقي: `src/content/blog/sdaia-generative-ai-guidelines-practical-compliance.md` → `/blog/sdaia-generative-ai-guidelines-practical-compliance/`
- ❌ الـ URL القديم `/blog/sdaia-generative-ai-guidelines/` ما له ملف

**الحل المقترح**:
1. **إصلاح المصدر** (أولوية عليا): نحدّث الروابط المكسورة في ملفين:
   - `src/content/blog/generative-ai-governance-vs-traditional.md` السطر 249 — `https://brightai.site/blog/sdaia-generative-ai-guidelines/` → صحّحه للـ slug الصحيح `-practical-compliance`
   - `src/content/blog/ai-usage-policy-template-saudi.md` السطرين 247 و 320 — نفس التصحيح
2. **سلامة تحويل 301** (يحتاج موافقتك لأنه ملف محمي):
   - نضيف في `public/_redirects`: `/blog/sdaia-generative-ai-guidelines/  /blog/sdaia-generative-ai-guidelines-practical-compliance/  301`
   - هذا يحمي أي backlink خارجي أو bookmarks

### الخطأ رقم 2 — Issue #8: Broken internal links — 2 روابط

نفس المشكلة من الخطأ #1 — المصدران هما نفس ملفَي الـ blog أعلاه.

**الحل**: يتصلح تلقائيًا مع إصلاح #2 أعلاه، لكن بدون توجيه 301 الـ Semrush سيظل يعتبر الرابط مكسور للزواحف اللي ما تتبع redirects.

### الخطأ رقم 3 — Issue #45: Structured data markup errors — 11 items

**الصفحات المتأثرة**: 10 صفحات `/kernel/*` + صفحة `/demo/`.

**التشخيص الفعلي**: قمت بفحص `/kernel/stats/` على live — عنده JSON-LD واحد فيه 5 nodes في `@graph`:
- ✅ Organization
- ✅ WebSite
- ❌ **LocalBusiness / ProfessionalService** ← ده غلط — صفحات الكيرنل ما لها علاقة بـ LocalBusiness
- ✅ WebPage
- ⚠️ **WebApplication** (بدون SoftwareApplication الأب، بدون aggregateRating، بدون offers)

**السبب الجذري**: في pipeline الذي يبني JSON-LD، الإضافات على `BaseLayout.astro` تضيف LocalBusiness node بشكل تلقائي + WebApplication node منفصل. لكن في نفس الوقت الـ `aggregateRating` و `offers` اللي في `KERNEL_PRODUCT` بـ `src/data/schema-helpers.ts:344-388` و الموجودة في ملفات `src/data/migrated-pages/kernel-*.json` (تأكدت إنها موجودة في `kernel-stats.json:80-90`) — ما توصل للـ HTML.

**الحل المقترح**:
1. **`src/layouts/BaseLayout.astro`**: نوقف إضافة LocalBusiness / ProfessionalService تلقائيًا لصفحات الـ kernel.
2. **`src/pages/kernel/[slug].astro` و `index.astro`**: نمرر `aggregateRating` و `offers` بشكل صريح ضمن JSON-LD لكل صفحة kernel.
3. **`src/pages/demo/index.astro`**: نتأكد إن `address` (موجود فعلاً في Organization node) ينتشر للـ LocalBusiness node، أو نُضيفه صراحةً في الـ LocalBusiness.

**ملفات التعديل المتوقعة**:
- `src/layouts/BaseLayout.astro` (الـ pipeline الأساسي — محمي، يحتاج موافقة)
- `src/pages/kernel/index.astro` (محمي ضمنيًا — تغيير schema)
- `src/pages/kernel/[slug].astro` (نفسه)
- `src/pages/demo/index.astro` (نفسه)

---

## 3. تفاصيل الـ Warnings الـ 282 (مرتبة حسب الأثر)

| Issue # | الوصف | Count | الأثر | الأولوية |
|---------|-------|-------|------|----------|
| 112 | Low text-to-HTML ratio | 87 | متوسط — كثير من JSON-LD + markup vs محتوى ظاهر | عالية |
| 102 | Title element too long (>60 char) | 29 | متوسط — Google يقص العنوان في SERP | متوسطة |
| 135 | Unminified JS/CSS files | 162 | عالي — حزم غير مضغوطة تضر LCP/TTFB | عالية |
| 123 | Nofollow in internal links | 2 | منخفض — practice خاطئ لكن التأثير محدود | منخفضة |
| 12 | Broken external links | 1 | منخفض — false positive (rate limit 429 على wa.me) | مُغلَق |
| 105 | H1 duplicates title | 1 | منخفض | منخفضة |

### Warning #112 — Low text/HTML ratio (87 page)

**الصفحات الأكثر تضررًا**: صفحات الحلول (solutions)، الكيرنل، الهَب، صفحات EN، والصفحات القانونية.

**السبب**: كثرة JSON-LD + الوصف + الـ Components الثقيلة (Header/Footer) مقارنة بالمحتوى الظاهر.

**الحل المقترح**: لا نقدر نحل هذا بسهولة دون إعادة هيكلة بصرية. التوصية: نقبل هذا التحذير مع الإشارة له في `brain.md` كقرار معماري معروف. الـ Google Quality Score ما يعتمد على هذا الرقم.

### Warning #102 — Title too long (29 page)

**صفحات متأثرة** — كلها blog/docs، أمثلة:
- `/blog/sdaia-seven-principles-practical-guide/` (90+ char)
- `/docs/kernel-accessibility-mobile/` (75+ char)
- `/blog/healthcare-ai-governance-saudi-hospitals/`

**السبب**: عناوين عربية طويلة جدًا. الـ Google يقطعها عند 580px (~60-70 حرف عربي).

**الحل المقترح**:
1. نُحدد عتبة: max 70 حرف للعنوان (في حدود 60 pixels في SERP).
2. نقصر العناوين في:
   - `src/data/blog.ts` (frontmatter)
   - `src/content/blog/*.md` (frontmatter)
   - `src/content/docs/*.md` (frontmatter)

### Warning #135 — Unminified JS/CSS files (162 instances)

**الصفحات المتأثرة**: كل صفحة (162 instance).

**السبب**: في `astro.config.mjs` نحتاج نتأكد إعدادات `vite.build`:
```js
vite: {
  build: {
    cssMinify: true,  // ✅ موجود
    // لكن minify: 'esbuild' مو مضبوط صراحة
  },
}
```

**الحل المقترح**:
1. تعديل `astro.config.mjs` (ملف محمي — يحتاج موافقة) لإضافة:
   ```js
   vite: {
     build: {
       cssMinify: true,
       minify: 'esbuild',  // ← تأكيد الـ JS minify
     },
   }
   ```
2. تشغيل `npm run build` وتجربة `grep "minified\|original" dist/_astro/*.js` للتحقق.

### Warning #123 — Nofollow in internal links (2 cases)

**الصفحات المتأثرة**:
- `https://brightai.site/pricing/` ← `/contact/` بـ nofollow
- `https://brightai.site/assessment/ai-governance-readiness/` ← `/contact/` بـ nofollow

**السبب**: خطأ بشري في كود توليد الـ links.

**الحل المقترح**: بحث في `src/pages/pricing/index.astro` و `src/pages/assessment/ai-governance-readiness/index.astro` عن `rel="nofollow"` على رابط `/contact/` وحذفه.

---

## 4. تفاصيل الـ Notices الـ 296 (للعلم فقط، أولوية منخفضة)

| Issue # | الوصف | Count | الملاحظة |
|---------|-------|-------|---------|
| 207 | Orphaned sitemap pages | 44 | صفحة في sitemap لكن ما له internal link |
| 213 | Pages with only 1 internal link | 7 | غالبًا تقاطع مع #207 |
| 223 | Content not optimized | 44 | تحسين محتوى ثانوي |
| 218 | External 403 errors | 6 | روابط خارجية لـ resources رجعت 403 |
| 222 | Low semantic HTML usage | 4 | استخدام ضعيف لـ `<article>`, `<section>` |
| 205 | No HSTS support | 1 | نتحقق من `public/_headers` |
| 202 | Nofollow in external links | 190 | غالبًا intententional (منصات الدفع، إلخ) |

**التوصية**: ما نصلح هذي إلا إذا بقت معنا وقت. أولوياتنا أعلى.

---

## 5. خطة التنفيذ المقترحة (مرحلية)

### المرحلة 1 — إصلاح الـ Errors (يوم واحد، أولوية قصوى)

| # | الفعل | الملف | الحجم |
|---|------|-------|------|
| 1 | تصحيح الرابط المكسور في blog generative-ai-governance-vs-traditional | `src/content/blog/generative-ai-governance-vs-traditional.md:249` | سطر واحد |
| 2 | تصحيح الرابط في ai-usage-policy-template-saudi (سطرين) | `src/content/blog/ai-usage-policy-template-saudi.md:247, 320` | سطرين |
| 3 | إضافة redirect 301 في `public/_redirects` (يحتاج موافقتك) | `public/_redirects` | سطر واحد |
| 4 | إصلاح JSON-LD للـ kernel pages: إيقاف إضافة LocalBusiness التلقائي | `src/layouts/BaseLayout.astro` | ~30 سطر |
| 5 | إصلاح JSON-LD: إضافة aggregateRating/offers للـ kernel | `src/pages/kernel/index.astro` و `[slug].astro` | ~10 سطور |
| 6 | إصلاح LocalBusiness address في /demo/ | `src/pages/demo/index.astro` | ~5 سطور |

**التحقق**: `npm run build` ثم `curl /kernel/stats/` → نتأكد إن `@graph` فيه `SoftwareApplication + aggregateRating + offers` بدون `LocalBusiness`، و`/blog/sdaia-generative-ai-guidelines/` يرجع 301.

### المرحلة 2 — Warnings عالية الأثر (يوم ثاني)

| # | الفعل | الملف | الحجم |
|---|------|-------|------|
| 1 | إضافة `minify: 'esbuild'` لـ vite.build في astro.config.mjs (محمي) | `astro.config.mjs` | سطر |
| 2 | إزالة nofollow من روابط /contact/ في pricing و assessment | ملفان | 2 سطر |
| 3 | تقصير 29 عنوان blog/docs | ملف content/*.md + blog.ts | batch |

### المرحلة 3 — فحوصات لاحقة (أسبوع لاحق)

- إعادة تشغيل Site Audit ومراجعة Snapshot جديد.
- Targeting: Errors من 14 إلى 0، Warnings من 282 إلى ~50.

---

## 6. خارطة الملفات والـ Components

**ملفات محمية (تحتاج موافقتك قبل أي تعديل)**:
- `public/_redirects` (الـ 301 redirect)
- `astro.config.mjs` (vite.minify)
- `src/layouts/BaseLayout.astro` (الـ JSON-LD pipeline)
- `src/data/site.ts` (لكن لا تغيير متوقع)

**ملفات عادية (تعديل بدون موافقة)**:
- `src/content/blog/generative-ai-governance-vs-traditional.md` (سطر 249)
- `src/content/blog/ai-usage-policy-template-saudi.md` (سطرين 247 و 320)
- `src/data/migrated-pages/kernel-*.json` (مراجعة فقط — لا تغيير)
- `src/pages/demo/index.astro` (إضافة address للـ LocalBusiness)
- `src/pages/pricing/index.astro` (إزالة nofollow)
- `src/pages/assessment/ai-governance-readiness/index.astro` (إزالة nofollow)

---

## 7. المخاطر المتبقية

| المخاطرة | الاحتمال | الأثر | التخفيف |
|-----------|----------|------|---------|
| تعديل `BaseLayout.astro` يكسر JSON-LD صفحات أخرى | متوسط | عالي | نختبر 5 صفحات متنوعة قبل deploy |
| تغيير slug في blog يضيف redirect 314 جديد | مؤكد | منخفض | محسوب، الـ redirects ملف رسمي |
| تغيير `astro.config.mjs` يبطئ dev | منخفض | منخفض | نشغّل `npm run build` أولًا |
| عناوين قصيرة تخسر keywords | متوسط | متوسط | نُحافظ على كلمات SEO الأساسية، نقلص الـ filler |

---

## 8. معايير القبول (Acceptance Criteria)

نعتبر المهمة منجزة حين:
1. ✅ `npm run build` ينتج 125+ صفحة بدون errors.
2. ✅ `curl https://brightai.site/blog/sdaia-generative-ai-guidelines/` يرجع 301 → `/blog/sdaia-generative-ai-guidelines-practical-compliance/`.
3. ✅ `curl https://brightai.site/kernel/stats/ | grep aggregateRating` يرجع نتيجة.
4. ✅ `npm run seo:all` ينجح.
5. ✅ Semrush Snapshot التالي يظهر Errors = 0 و Warnings أقل من 100.

---

## 9. الخطوة التالية المقترحة

أبدأ بـ **المرحلة 1 كامل** لأنها أولوية قصوى — كل ما فيها رابط واحد 404 بيكسر SEO reputation + JSON-LD bugs بتضيع rich snippets في Google.

**الأسئلة اللي محتاج جوابك قبل ما أبدأ**:
1. **Approve على تعديل `public/_redirects`** لإضافة redirect للـ SDAIA blog؟ (ضروري)
2. **Approve على تعديل `astro.config.mjs`** لإضافة `minify: 'esbuild'`؟ (مفيد)
3. **Approve على تعديل `src/layouts/BaseLayout.astro`** لإصلاح JSON-LD pipeline؟ (ضروري)
4. **Approve على تعديل 29 عنوان blog/docs** لتقصيرها؟ (مفيد)

ولا تبي أسوي الثلاثة المرحلة 1 بدون الموافقات الإضافية وأخليك تراجع الـ PR قبل الـ deploy؟
