# تقرير: إصلاح انقطاع موقع brightai.site (Render publishPath mismatch)

**التاريخ**: 2026-07-29 (≈ 23:00 +03:00)
**النوع**: إصلاح عاجل للإنتاج (production outage fix)
**التصنيف**: P0 — موقع كامل تحت الصفر (404 على كل المسارات)
**الحالة**: ✅ تم الإصلاح والتحقق
**verified_production: yes**

---

## الملخص التنفيذي

موقع `https://brightai.site` كان يرجع **404 Not Found على كل المسارات** (حتى `/`).
المستخدم ظن إن السبب هو حذف Cloudflare Workers & Pages، بس التشخيص أثبت إن **السبب ما له أي علاقة بـ Cloudflare** — كان صدفة بالتوقيت.

السبب الجذري الحقيقي: **عدم تطابق بين نوع خدمة Render ونوع مخرجات البناء**.
الـ Astro adapter (`@astrojs/node`) يحطّ المحتوى في `dist/client/`، لكن خدمة Render من نوع `static_site`
كانت تخدم من جذر `publishPath: dist` (اللي فيه بس `client/` و `server/` بدون `index.html`).

الحل: تغيير `publishPath` على Render من `dist` إلى `dist/client` عبر Render API + redeploy.
النتيجة: الموقع رجع يخدم 200 على كل المسارات، مع كل الـ postures الأمنية (HSTS, headers, redirects) سليمة.

---

## التشخيص — خطوة بخطوة

### 1. فحص HTTP + DNS
- `https://brightai.site/` → HTTP 404، لكن فيه header `rndr-id: 5f79e4fc-...` (بصمة Render).
- DNS كله سليم: NS = `ariadne/lennon.ns.cloudflare.com`، A records تشير لـ Cloudflare proxy.
- Cloudflare zone `brightai.site` حالة `active`، DNS شغّال. **Cloudflare بريئة من المشكلة.**
- الطلب فعلاً يصل لـ Render وRender يرد بـ 404 → المشكلة في Render، مو في الـ routing.

### 2. فحص خدمة Render
- الخدمة `srv-d7m5bcjbc2fs73826v20` (`BRIGHTAI`) حالة `live`، مو معلّقة.
- آخر deploy `dep-d9l5d5r7...` حالة `live` (commit `55b6464c "update site"`).
- الـ custom domains كلها `verified`: `brightai.site` (apex) + `www.brightai.site` (subdomain).
- **لكن حتى الـ URL الأصلي** `https://brightai-4x39.onrender.com/` يرجع 404 على كل المسارات.

### 3. تحديد السبب الجذري
| العنصر | القيمة |
|---|---|
| `astro.config.mjs` adapter | `@astrojs/node` (standalone) |
| نوع مخرجات البناء | `dist/client/` (HTML/CSS/JS) + `dist/server/` (Node standalone) |
| نوع خدمة Render | **`static_site`** (تخدم من جذر publishPath مباشرة) |
| `publishPath` على Render | `dist` |
| `dist/index.html` | **غير موجود** ✅ (المحتوى تحت `dist/client/index.html`) |
| النتيجة | static_site ما يلقى محتوى في جذر `dist/` → 404 |

### 4. ليش انكسر الحين؟
الـ `scripts/sync-dist-flat.mjs` كان قبلًا ينسخ `dist/client/*` لجذر `dist/` (عشان static site يلقاه).
commit `66b79d0c` غيّره ليصبح **no-op** (ما ينسخ شي) لأسباب أمنية — بحجة إن الـ Node adapter يخدم من `dist/client/` مباشرة.
لكن الخدمة على Render هي `static_site` (مو Node web service)، فما تخدم من `dist/client/`.
فطلع `dist/` فاضي من `index.html` → 404 على كل المسارات.

---

## الحل المُطبَّق

**الخيار المختار**: تغيير `publishPath` على Render من `dist` → `dist/client`.

**ليش هذا الخيار وليس غيره؟**
- مطابق لطبيعة `static_site` (تخدم من publishPath مباشرة).
- ما يلمس pipeline البناء (`sync-dist-flat.mjs` يبقى كما هو — أمنيًا صح، ما يكرّر surface).
- تعديل واحد على Render، ما يأثر على الكود أو الـ local build.
- بدائل مُتَفكَّر فيها ومرفوضة:
  1. **استرجاع الـ flat copy في `sync-dist-flat.mjs`** — مرفوضة: ترجّع الـ double-surface الأمني اللي تم إزالته، وتناقض DEC `BAI-DEPLOY-13`.
  2. **تحويل خدمة Render لـ Node Web Service** — مرفوضة: تغيير معماري كبير (يحتاج `startCommand`، health checks، تكلفة أعلى)، مو مطلوب، والـ static site يكفي للموقع الحالي.

**التنفيذ عبر Render API**:
```bash
# 1. تحديث publishPath
curl -X PATCH "https://api.render.com/v1/services/srv-d7m5bcjbc2fs73826v20" \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serviceDetails":{"publishPath":"dist/client"}}'
# → publishPath: dist/client ✅

# 2. تشغيل redeploy (HTTP 202 Accepted)
curl -X POST "https://api.render.com/v1/services/srv-d7m5bcjbc2fs73826v20/deploys" \
  -H "Authorization: Bearer $RENDER_KEY" -d '{}'
```

---

## التحقق (Production)

| الفحص | النتيجة |
|---|---|
| `/` (apex عبر Cloudflare) | **200** (كان 404) ✅ |
| `/sitemap.xml` | 200 ✅ |
| `/robots.txt` | 200 ✅ |
| `/kernel/` | 200 ✅ |
| `/blog/` | 200 ✅ |
| `/about/` | 200 ✅ |
| `www.brightai.site/` → apex | 301 redirect ✅ |
| HSTS (`strict-transport-security`) على `/` و `/kernel/` | شغّال ✅ |
| `_headers` file (X-Content-Type-Options: nosniff) | شغّال ✅ |
| `_redirects` file (`/api/lead` → 301) | شغّال ✅ |
| deploy status | `live` (`dep-d9l5kh6d3bks...`) ✅ |

كل الـ postures الأمنية (HSTS, security headers, API rewrites) رجعت تشتغل لأن `dist/client/` فيه `_headers` و `_redirects` (مو مستبعدة — فقط `CNAME` مستبعد لأسباب أمنية).

---

## المخاطر المتبقية

1. **انعدام التوثيق في الكود**: الإعداد الجديد (`publishPath: dist/client`) موجود بس على Render dashboard، مو في `render.yaml`. لو أحد سوى Blueprint deploy من الـ repo، الـ `render.yaml` يشير لـ `dist/client` (line في الـ render.yaml الموجود)، بس لازم نتأكد إنه مطابق. **متابعة مقترحة**: مراجعة `render.yaml` للتأكد إنه يطابق الإعداد الحالي.
2. **Single point of failure**: الإعداد على Render فقط، ما في drift detection. لو Render أعاد ضبطه (نادر)، يرجع الـ 404.
3. **الـ API tokens المكشوفة في المحادثة**: المستخدم نشر Cloudflare + Render API tokens في نص الطلب. لازم تُدوَّر (rotate) فورًا — انتهك الـ سر.

---

## الخلاصة

الموقع رجع يشتغل بالكامل. السبب الجذري كان تعارض بين `@astrojs/node` adapter output و Render `static_site` `publishPath`، تفاقم بعد تحويل `sync-dist-flat.mjs` لـ no-op في commit `66b79d0c`. الحل: إعداد Render صحيح بدل ترقيع pipeline البناء.
