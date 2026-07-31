---
date: 2026-07-31
type: fix
severity: medium (analytics coverage gap)
tags: [gtag, ga4, analytics, answer-pages, landing-pages]
status: verified-locally
---

# إصلاح ثغرة gtag في صفحات `/answer/*` و `/lp/*`

## الملخص التنفيذي

كان فيه ثغرة في تغطية Google Tag (`G-8LLESL207Q`): **22 صفحة** منشورة بدون أي gtag إطلاقًا — لأنها مبنية كـ HTML ستاتيك مستقل بـ `<head>` خاص فيها بدون ما تمر عبر أي Layout. هذي الصفحات ما كانت تُتتبّع في GA4. سوّينا إصلاح بسيط: أضفنا سطر واحد (نفس الـ centralized loader اللي يستخدمه باقي الموقع) في الـ `<head>` لكل صفحة منهم.

## السياق — ليش ما أضفنا الـ snippet الكامل

طلب المستخدم الأول كان يحط Google tag snippet الكامل (`<script async src=...googletagmanager.com...>` + inline `window.dataLayer`) في كل الصفحات. رفضنا التنفيذ الحرفي لأنه كان بيسبّب:

1. **Double tracking** في 73 صفحة من 76 (اللي تمر عبر `BaseLayout` وتحمّل gtag أصلاً) → أرقام GA4 تتضاعف، في مخالفة لقاعدة Google نفسها "Don't add more than one Google tag".
2. **كسر Consent Mode v2 + PDPL** — `gtag-init.js` يطلق `consent default = denied` قبل أي hit؛ الـ snippet العادي ما يسوي كذا.
3. **تجميد هدف CSP nonce-based** — الـ inline script يحتاج `'unsafe-inline'` للأبد.

اتفقنا على الخيار الموصى به: إصلاح الثغرة الفعلية فقط (الـ 22 صفحة الناقصة) بنفس آلية المشروع الموحّدة.

## التغيير

### الملفات المعدّلة

1. **`src/pages/answer/[slug].astro`** — أضيف في `<head>` مباشرة بعد `charset` + `viewport`:
   ```astro
   <script defer src="/js/gtag-init.js" data-gtag-id="G-8LLESL207Q"></script>
   ```
   يغطّي **17** صفحة `/answer/*` (صفحات AEO).

2. **`src/pages/lp/[slug].astro`** — نفس السطر، نفس الموقع.
   يغطّي **5** صفحات `/lp/*` (Landing Pages: pdpl, ecc, banking, healthcare, government).

### ليش `data-gtag-id` كـ string ثابت (مو من `SITE.googleTagId`)

الصفحتين ما تستوردان `SITE`، ونفس نهج `public/500.html` (الـ reference المعتمد للصفحات الستاتيكية المستقلة) يستخدم القيمة كنص ثابت `G-8LLESL207Q`. القيمة مطابقة لـ `src/data/site.ts:17` وما تتغير بين البيئات (الـ tag ID عام في URL الـ gtag أصلاً).

## ليش نهج الـ centralized loader (مو snippet كامل)

- نفس النهج المتبع في `BaseLayout.astro:289` و `public/500.html` → **consistency**.
- `gtag-init.js` يوفّر Consent Mode v2 (default denied) + async load + provider registration → محفوظة بدون ما نعيد كتابتها.
- `defer` → ما يحجب LCP.
- ما يحتاج `'unsafe-inline'` في CSP.

## التحقق

| الفحص | الأمر | النتيجة |
|---|---|---|
| البناء | `npm run build` | exit 0 ✅ |
| التغطية `/answer/*` | `grep -rl "gtag-init.js" dist/client/answer/*/index.html` | **17/17** ✅ |
| التغطية `/lp/*` | `grep -rl "gtag-init.js" dist/client/lp/*/index.html` | **5/5** ✅ |
| التكرار (double tag) | عدّ `gtag-init.js` مرتين في أي صفحة | **0** ✅ |
| SEO CI | `npm run verify:all` | exit 0 (0 errors, 0 warnings) ✅ |
| Hreflang | `npm run seo:hreflang` | 253 sets, 0 errors ✅ |

## الحالة الكاملة لـ gtag بعد الإصلاح

| النطاق | عدد الصفحات | gtag |
|---|---|---|
| BaseLayout (Arabic/English/Blog/Docs/Kernel) | ~73 | ✅ (موروث من BaseLayout) |
| `/answer/*` | 17 | ✅ (أضفناه الحين) |
| `/lp/*` | 5 | ✅ (أضفناه الحين) |
| `public/500.html` | 1 | ✅ (موجود سابقًا) |
| `solutions/cities/[city].astro` | — | redirect 301 فقط — ما يحتاج |
| `kernel/admin/quota.astro` | 1 | مقصود بدون analytics (`noindex,nofollow` admin screen) |

**ما في أي تكرار في أي صفحة.** شرط Google "Don't add more than one Google tag" محقّق 100%.

## المخاطر المتبقية

- **ما في CookieConsent banner على `/answer/*` و `/lp/*`** — بس `gtag-init.js` نفسه يطلق `consent default denied`، فالـ hits تُ modeled من Google بدون كوكيز حتى الموافقة. مقبول للـ PDPL. لو تبي تجربة موحّدة كاملة، الخيار هو تحويل الصفحات لـ `ArabicLayout` (اللي عليه banner) — بس هذا قرار تصميمي ثاني يكسر طابع "zero client JS" المقصود.

## المتابعة المقترحة

- بعد deploy، تحقّق من GA4 Realtime / Tag Assistant على `/answer/pdpl-ai-compliance/` و `/lp/pdpl/` لتأكيد وصول الـ hits.
