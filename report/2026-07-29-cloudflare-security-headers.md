# تقرير: إصلاح فجوة security headers عبر Cloudflare Transform Rules

**التاريخ**: 2026-07-29 (≈ 23:10 +03:00)
**النوع**: إصلاح أمني (security hardening)
**التصنيف**: P1 — فجوة أمنية حقيقية (CSP + 4 headers ناقصة)
**الحالة**: ✅ تم الإصلاح والتحقق
**verified_production: yes**

---

## الملخص التنفيذي

بعد إصلاح انقطاع الموقع (تقرير `2026-07-29-fix-render-publishpath.md`)، اكتشفت فحص معمّق إن الإنتاج كان يخدم **فقط 2 من 7 security headers** على كل صفحة. السبب: خدمة Render نوعها `static_site` تقرأ `_redirects` بس **ما تقرأ `_headers`** إطلاقًا. النتيجة: `Content-Security-Policy` + `X-Frame-Options` + `Referrer-Policy` + `Permissions-Policy` + `X-Robots-Tag` كلها كانت **مفقودة** في الإنتاج، رغم وجودها في `dist/client/_headers` و `render.yaml`.

الحل: توسيع قاعدة Cloudflare Transform Rule الموجودة (BAI-SEC-11 HSTS) لتشمل كل الـ 7 headers. النتيجة: كل الصفحات صارت تخدم الـ 7 headers، والموقع ما انكسر (0 functional errors، GA4 شغّال).

---

## التشخيص — متعدد الطبقات

### الطبقة 1: Render Static Site ما يقرأ `_headers`

**الدليل القاطع**: فحصت ملف CSS على الإنتاج:
```
cache-control: public, max-age=14400, s-maxage=300   ← قيمة Render الافتراضية
```
لكن `dist/client/_headers` يقول للـ `_astro/*`:
```
Cache-Control: public, max-age=31536000, immutable   ← ما وصل للإنتاج
```
يعني **60+ قاعدة في `_headers` كاملة مُهمَلة**. Render Static Site يطبّق `_redirects` (210 قاعدة شغّالة ✅) بس يتجاهل `_headers` ❌.

### الطبقة 2: مصدر الـ 2 headers الشغّالة

| Header | المصدر الفعلي |
|---|---|
| `Strict-Transport-Security` | **Cloudflare Transform Rule** "BAI-SEC-11" (expression `true`، `set`) |
| `X-Content-Type-Options` | **Render default** (يضيفه تلقائيًا على كل response) |

### الطبقة 3: التشخيص القديم كان غلط (جزئيًا)

تعليق `BAI-IDX-02` في `dist/client/_headers` (السطور 6-15) يقول إن الإنتاج يعتمد على:
1. `src/middleware.ts` (HTTP headers على `/api/*` SSR)
2. `injectSecurityMeta()` في `astro.config.mjs` (`<meta http-equiv>` في كل HTML)
3. Cloudflare edge Transform Rule (HSTS)

**هذا التشخيص غلط**: الخدمة `static_site` ما تشغّل middleware (يحتاج Node). الـ `<meta>` موجودة بس تنتج warnings (مو كل directives مدعومة في `<meta>`). والمشكلة إن `<meta>` + HTTP header كلاهما ناقصين (ما يكفيان لحماية الموقع).

---

## الحل المُطبَّق

**توسيع قاعدة Cloudflare Transform Rule** (ruleset `f79b8e31941b4ae7a947f40f3d19146a`، rule `f03f82879fec450d93f9dab888c389ca`) لتشمل كل الـ 7 headers. عبر `PUT /zones/{zone}/rulesets/{ruleset}`.

**الـ headers المضافة (5 جديدة + HSTS محفوظ)**:
1. `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (محفوظ من BAI-SEC-11)
2. `X-Frame-Options: SAMEORIGIN` (جديد)
3. `X-Content-Type-Options: nosniff` (جديد — يعزز default Render)
4. `Referrer-Policy: strict-origin-when-cross-origin` (جديد)
5. `Permissions-Policy: camera=(), microphone=(), geolocation=()` (جديد)
6. `X-Robots-Tag: index, follow, max-image-preview:large, ...` (جديد)
7. `Content-Security-Policy: default-src 'self'; ...` (جديد — قيمة كاملة من `render.yaml` canonical)

**إصدارات القاعدة**:
- v1 (موجود سابقًا): HSTS فقط.
- v2 (تطبيقي الأول): +6 headers.
- v3 (نهائي): v2 + إضافة `https://static.cloudflareinsights.com` و `https://cloudflareinsights.com` لـ `script-src`/`script-src-elem`/`connect-src`.

---

## التحقق (Production) — Playwright

| الفحص | النتيجة |
|---|---|
| `/`, `/kernel/`, `/blog/`, `/contact/` → عدد security headers | **7/7** ✅ |
| Functional CSP errors (non-beacon) | **0** ✅ |
| GA4 (GTM `G-8LLESL207Q`) يحمّل | ✅ 200 |
| H1 رندر | ✅ "حوكمة الذكاء الاصطناعي للشركات السعودية..." |
| Failed requests (non-beacon) | 0 ✅ |

---

## المشاكل المتبقية (known issues — ليست من تغييري)

### 1. CSP مزدوج (HTTP header + `<meta>`)
الموقع عنده مصدرين CSP:
- **HTTP header** (الـ Transform Rule الجديد) — شغّال على كل response.
- **`<meta http-equiv="Content-Security-Policy">`** (مخبوزة في كل HTML من `injectSecurityMeta()` في `astro.config.mjs:94`).

المتصفح يطبّق **intersection** (الأشد). النتيجة:
- تحذيرات console (`frame-ancestors`/`report-uri`/`X-Frame-Options` مُتجاهلة في `<meta>`). هذي **pre-existing warnings** (مو من تغييري — الـ `<meta>` موجودة من قبل).
- الـ beacon `cloudflareinsights.com` يظل ممنوع لأن الـ `<meta>` ما عندها هذي القاعدة. **الحل**: لازم يصير rebuild + redeploy عشان إما نزيل الـ `<meta>` (الـ HTTP header صار كافي) أو نضيف `cloudflareinsights.com` لها. ما أقدر أسويه من غير code change.

### 2. `/api/*` endpoints معطّلة (بس مصمّمة للـ fallback)
الخدمة `static_site` ما تشغّل `src/pages/api/*.ts`. النتيجة:
- `/api/ai/chat/` → معطّل، بس الـ **frontend عنده demo-mode** (`KernelAiAssistant.astro:499`).
- `/api/lead/` → معطّل، بس الـ **frontend يحوّل لـ WhatsApp** تلقائيًا (`KernelLeadForm.astro:530`).
- `/api/health/` → 404 (ما في health check).

هذا **مقصود** — المشروع مصمّم ليعيش كـ static site.

### 3. `render.yaml` drifting
يصف خدمة Node Web Service ما موجودة. **خطر مستقبلي**: لو أحد سوى "Blueprint Apply" في Render Dashboard، ينشئ خدمة جديدة مكسورة. (متابعة مقترحة منفصلة — مش في scope هذا التقرير.)

---

## الخلاصة

الفجوة الأمنية الحقيقية (CSP + 4 headers ناقصة) انحلت بالكامل عبر Cloudflare Transform Rules. الموقع الآن يخدم 7/7 security headers على كل صفحة، بدون كسر أي وظيفة. المشاكل المتبقية (CSP مزدوج، `/api/*` معطّلة، `render.yaml` drifting) ليست من scope هذا التقرير وموثّقة كـ known issues للحل مستقبلًا.
