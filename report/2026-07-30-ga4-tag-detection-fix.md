# BAI-SEO-30: إصلاح "Google لا يكتشف الوسم" في GA4

**التاريخ**: 2026-07-30
**الوكيل**: BrightAI Workspace Agent
**المهمة**: تشخيص + إصلاح "Google لا يكتشف الوسم GA4" في BrightAI
**الوضع**: Mid → Senior (single-file change في critical path)

---

## الملخص التنفيذي

المستخدم أبلغ إن Google ما يكتشف وسم GA4 (Tag Assistant + GA4 Realtime ما يطلع فيه بيانات). التشخيص بـ Playwright كشف السبب الفعلي: **gtag.js كان يحمّل بنجاح لكن ما كان يبعت أي hit إلى `google-analytics.com/g/collect`**. بعد ما حذفنا `requestIdleCallback` التأخير و `send_page_view: false` من `public/js/gtag-init.js`، الـ Playwright verification يثبت إن GA4 يستقبل hit بـ status 204.

---

## المشكلة الفعلية (السبب الجذري)

سببين مجتمعين:

### السبب 1 — تأخير تحميل gtag.js
`gtag-init.js` كان يحمّل gtag.js الفعلي عبر:
```js
if ('requestIdleCallback' in window) {
  requestIdleCallback(loadGtag, { timeout: 4000 });
} else {
  setTimeout(loadGtag, 1500);
}
```

هذا يعني gtag.js الفعلي ما يبدأ التحميل إلا بعد 1.5-4 ثواني من تحميل الصفحة. Tag Assistant يراقب ~2 ثانية، فما يلحق الـ config call. النتيجة: **Tag Assistant يقول "Tag Not Detected"** حتى لو gtag.js يشتغل في الخلفية.

### السبب 2 — `send_page_view: false`
الـ config call كان يقول:
```js
gtag('config', id, { anonymize_ip: true, send_page_view: false });
```

يعني gtag.js **ما يطلق page_view تلقائي**. الاعتماد كان على `analytics.js` يطلق `page_view` بعد ما يضغط المستخدم "قبول الكوكيز". تحت Consent Mode v2 default `denied`:
1. `analytics_storage: denied` → GA4 يحفظ hit مع `pscdl=denied` (conversion modeling) **فقط لو الـ hit اتبعت**
2. `analytics.js` يبعت `track('page_view')` → `track()` يفحص `CONSENT === 'unknown'` → يصفّر الـ event في queue
3. لو ما ضغط المستخدم "قبول" → ما يصير hit لـ GA4 أبداً

---

## التغييرات

| ملف | تغيير | السبب |
|---|---|---|
| `public/js/gtag-init.js` | حذف `requestIdleCallback` (4s) و `setTimeout` (1.5s) → `loadGtag()` direct call | gtag.js يحمّل فوراً، Tag Assistant يلحق الـ config call |
| `public/js/gtag-init.js` | حذف `send_page_view: false` من الـ config call | gtag.js يطلق page_view تلقائياً، يعمل مع consent modeling |
| `public/js/gtag-init.js` | تحديث header comments + inline comments | توثيق التغيير + السبب |
| `scripts/playwright-verify-ga4-detection.mjs` | جديد (سكربت تشخيص + تحقق) | تشخيص + تحقق قبل/بعد كل تعديل GA4 مستقبلي |
| `.agents/brain.md` | إدخال جديد في change ledger | توثيق التغيير |

**ما لم يُلمس** (محمي):
- `src/data/site.ts` (G-ID = `G-8LLESL207Q`)
- `src/layouts/BaseLayout.astro` (script tag wiring)
- `public/_headers` (CSP)
- `src/lib/analytics.ts` (نظام موحّد)
- `public/500.html` (نفس الـ loader pattern)

---

## التحقق (Verification)

### Playwright diagnostic (`scripts/playwright-verify-ga4-detection.mjs`)

**قبل** الإصلاح:
```
- gtag.js loaded: true ✅
- google_tag_data exists: true ✅
- Network requests to google-analytics.com: ❌ ZERO
- → Tag not detected
```

**بعد** الإصلاح:
```
PASS: GA4 tag detected.
  - gtag.js loaded: true
  - google_tag_data exists: true
  - config call in dataLayer: true
  - GA4 hit sent: yes (status 204 from google-analytics.com/g/collect)
```

الـ hit URL المرسل:
```
https://www.google-analytics.com/g/collect?v=2&tid=G-8LLESL207Q&...&dl=http%3A%2F%2Flocalhost%2F&dt=...&en=page_view&ep.anonymize_ip=true&pscdl=denied
```

- ✅ `tid=G-8LLESL207Q` — الـ G-ID صحيح
- ✅ `en=page_view` — page_view event مرسل
- ✅ `ep.anonymize_ip=true` — anonymize_ip config مطبّق
- ✅ `pscdl=denied` — consent denied signal مرسل (Google يستخدمه للـ conversion modeling)
- ✅ Response 204 (No Content) — الـ hit اتقبل

### Build + Verification

| أمر | نتيجة |
|---|---|
| `npm run build` | ✅ نجح — dist/client/index.html يحتوي نفس script tag |
| `npm run performance:budget` | ✅ PASS — HTML 36.16KB / CSS 19.65KB / JS 12KB (كلها ضمن الميزانية) |
| `npm run verify:all` | ⚠️ 9 broken links pre-existing (في blog/authors/events pages — مو بسبب التغيير) |

---

## الأداء (Performance)

| مقياس | قبل | بعد | ملاحظة |
|---|---|---|---|
| LCP | ~1.8s | لم يُقَس (Playwright synthetic) | المتوقع: نفس، لأن `<h1>` يُرسم من HTML+CSS inline |
| HTML gzipped | 36.16KB | 36.16KB | بدون تغيير |
| CSS gzipped | 19.65KB max | 19.65KB max | بدون تغيير |
| JS gzipped | 12KB | 12KB | بدون تغيير |

**التأثير المتوقع على LCP**: gtag.js (182KB) يبدأ التحميل فوراً بعد `gtag-init.js` ينتهي. لكن `gtag-init.js` نفسه 5.8KB ويعمل `defer` (مو blocking). الـ network waterfall:
1. HTML parsing
2. `gtag-init.js` defer → ينفذ بعد HTML parsed
3. `gtag-init.js` يضيف `<script async src="googletagmanager.com/gtag/js?id=...">` → المتصفح يحمّل بالـ background parallel
4. `<h1>` يُرسم من HTML+CSS — **مستقل عن gtag.js**

الخلاصة: LCP ما يتأثر فعلياً. لو ارتفع > 1.8s في production، نرجع للـ `requestIdleCallback` بـ timeout 500ms.

---

## المخاطر المتبقية

| المخاطرة | الاحتمال | التخفيف |
|---|---|---|
| LCP يرتفع > 1.8s بسبب تحميل gtag.js أبكر | منخفض | Lighthouse run بعد الـ deploy |
| 9 broken links pre-existing (مو بسبب التغيير) | عالي | commit منفصل: blog/authors/events links |
| Gemini API key leak في 6 ملفات HEAD | عالي | rotation + scrubbing commit منفصل |
| Screenshots `‏لقطة الشاشة ...` ما هي في `.gitignore` | عالي | commit منفصل: `.gitignore` |

---

## المتابعة بعد الـ Deploy

1. **Tag Assistant**: https://tagassistant.google.com/ — تحقق إن GA4 يظهر خلال < 2 ثانية
2. **GA4 DebugView**: https://analytics.google.com/analytics/debugview/ — تحقق إن page_view يدخل Realtime
3. **Lighthouse** على `https://brightai.site/`: قِس LCP قبل/بعد — لازم ما يزيد > 200ms

---

## القرارات المعمارية (DEC)

لا قرار معماري جديد — التعديل يتبع نفس الـ architecture (external loader في `public/js/gtag-init.js` بدل inline في BaseLayout) ويحلّلها فقط للسرعة.

---

## ملاحظة: اكتشاف عرضي (Out-of-Scope)

خلال التشخيص اكتشفت 3 مشاكل أمنية/نظافة منفصلة عن هذا الإصلاح:

1. **تسريب مفاتيح API**:
   - `AIzaSy...` (Gemini key قديم) مكتوب صريح في 6 ملفات tracked HEAD + 11+ commit بالتاريخ
   - الـ repo عام على GitHub
   - **الإجراء المطلوب**: rotation في Google AI Studio فوراً + scrubbing في commit منفصل + إضافة `‏لقطة الشاشة *.png` لـ `.gitignore`

2. **9 broken links** في blog/authors/events (مو بسبب التغيير):
   - `authors/*/index.html` → `/authors/` (المسار غير موجود)
   - `blog/ai-implementation-cost-saudi/` → `/solutions/agile-ai-governance/` (غير موجود)
   - `blog/big-data-analytics-saudi-companies/` → `/solutions/big-data-analytics/` (غير موجود)
   - `events/*/index.html` → `/events/` (غير موجود)

3. **Screenshots في repo**:
   - `‏لقطة الشاشة ١٤٤٨-٠٢-١٥ في ١١.١٨.١٠ م.png` (يحتوي GEMINI_API_KEY)
   - في الـ root directory، untracked

كل واحدة تتحل في commit منفصل بعد هذا الـ fix.