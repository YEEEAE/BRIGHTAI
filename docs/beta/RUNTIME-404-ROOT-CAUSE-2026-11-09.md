# 404 على `/app/*` — تشخيص وربط المصادر (2026-11-09)

> **النوع:** تشخيص قراءة فقط + خطة تحقق. ليس تصريح نشر، ولا دليل على أن المواد المنشورة تطابق SHA الحالي.
> **HEAD المحلي المفحوص:** `5ee9df758165c411e5f6e3677a4d4da5e1bb60b5` (فرع Git محلي `main`). قيمة الطلب `46ecaeae…` أصبحت تاريخية.
> **Neon:** `young-frog-60183055` / `production` (`br-young-bird-b43proeb`) / `neondb`.
> **نطاق هذه الدفعة:** قراءة ملفات، قراءة Neon، وطلبات HTTP عامة GET/HEAD بلا أسرار. لم يُنفّذ build/test/lint/Playwright، ولم يُعدّل Neon أو Render أو DNS أو أي سر، ولم يُنشر شيء.

## 1. النتيجة المختصرة

`brightai.live` يصل عبر Cloudflare إلى **أصل Render يقدّم ملفات ثابتة** (سلوك Render Static Site): كل استجابة تحمل `rndr-id`، و`last-modified` موحّد `2026-11-08T21:37:31Z`، و`cache-control: public, max-age=0, s-maxage=300`، و`etag` موحّد لصفحة 404. `/app/` و`/app` و`/nonexistent-xyz/` تعيد **نفس** 404 ونفس `etag`، ولا تحمل أي ترويسة من `src/middleware.ts`.

المصدر نفسه سليم: كل صفحات `src/pages/app/**` تحمل `export const prerender = false`، وبناء Astro الحالي يضع مساراتها في `dist/server` فقط (`/app/*` غير موجود في `dist/client`). لذلك:

- **إن وصل الطلب إلى Node standalone كما في `render.yaml`، فالمتوقع `503` من البوابة وليس `404`.**
- **`404` الحالي يعني أن الطلب لا يصل إلى Node SSR/الـmiddleware.** إما أن الدومين مربوط بخدمة Static، أو أن الـdeploy المنشور لا يحتوي SSR لـ`/app`.
- تغيير route في Astro أو تعديل CSS **لا يصلح** هذا؛ العطل في ربط الأصل/الـartifact.

هذا لا يرفع `G2` أو `G3`: يلزم من Render: service ID/type، deploy ID، commit SHA، وartifact digest؛ وRender MCP أعاد `unauthorized` في هذه الجلسة.

## 2. الأدلة المرصودة (RUNTIME_VERIFIED لردّ HTTP فقط)

طلبات `curl` عامة، 2026-11-09 (UTC+3)، دون cookies أو authorization:

| المسار | Status | ملاحظات |
|---|---|---|
| `/` | 200 | `cf-cache-status: HIT`، `last-modified: 2026-11-08T21:37:31Z` |
| `/app/` | 404 | `etag: W/"a36e05b4…"`، `cache-control: public, max-age=0, s-maxage=300`، `rndr-id` |
| `/app` | 404 | نفس الـ`etag` تمامًا |
| `/nonexistent-xyz/` | 404 | نفس الـ`etag` تمامًا ⇒ صفحة 404 الثابتة |
| `/app/api/kernel/health` | 404 | `content-type: text/html`؛ لا JSON |
| `/images/brightai-logo.webp` | 200 | نفس `last-modified` و`s-maxage=300` |
| `/sitemap-index.xml` | 200 | نفس النمط |

**غياب ترويسات الـmiddleware:** لا `X-Frame-Options`، ولا `Content-Security-Policy`، ولا `Content-Security-Policy-Report-Only`، ولا `Permissions-Policy`، ولا `Referrer-Policy`، ولا `Cross-Origin-Resource-Policy`، ولا `Strict-Transport-Security` على أي استجابة فُحصت، بما فيها `/`. وجود `x-content-type-options: nosniff` وحده يضيفه أصل Render الثابت ولا يثبت تشغيل `src/middleware.ts`.

**دليل المصدر والـartifact المحلي:**
- `npm start` → `scripts/server.mjs` → `dist/server/entry.mjs` (standalone).
- `scripts/server.mjs` يمرّر للـhandler بعد جدول التحويلات؛ الـmiddleware يغلق `/app` قبل أي route.
- `dist/client` لا يحتوي أي `/app/*`؛ `dist/server/chunks` يحتوي مسارات `/app/…` (بنية صحيحة لـSSR).
- `node_modules/@astrojs/node/dist/standalone.js` + `serve-static.js`: **الملفات الثابتة تُخدَم قبل middleware**. أي أن الصفحات prerendered في الإنتاج الصحيح تتجاوز `src/middleware.ts` وترويساتها. هذه ملاحظة أمنية منفصلة عن 404، ولم تُعالج في هذه الدفعة.

## 3. سلسلة الربط: المُثبت مقابل الناقص

```text
brightai.live
  → Cloudflare (server: cloudflare, cf-ray, cf-cache-status)        [VERIFIED]
  → Render origin (rndr-id على كل استجابة)                          [VERIFIED]
  → ??? service ID / type (web vs static)                          [BLOCKED: Render MCP unauthorized]
  → ??? deploy ID / status / commit SHA                            [BLOCKED]
  → ??? artifact/image digest                                      [BLOCKED]
  → استجابة ثابتة 404.html لمسارات غير موجودة في dist/client        [VERIFIED من السلوك]
```

**الاستنتاج المقيّد:** ما يجيب الطلبات الآن يخدم ملفات ثابتة فقط. لا يمكن الجزم باسم الخدمة أو الـSHA المنشور أو نوع الخدمة (Static Site مقابل Web Service يقدّم `dist/client`) دون Render. كلاهما يقود إلى نفس الإجراء: ربط الدومين بخدمة Node تشغّل `npm start`.

## 4. تصنيف البوابات (لا تغيير في القرار)

| البوابة | الحالة | الدليل |
|---|---|---|
| G1 — وصول الموقع العام | `PASS` بنطاق ضيق | 200 لصفحات عامة؛ لا يثبت تطابق الـartifact |
| G2 — Source/Artifact parity | `BLOCKED` | لا deploy ID/SHA/digest؛ Render MCP `unauthorized` |
| G3 — App SSR + Auth | `BLOCKED` | `/app/*` = 404 ثابت؛ لا `503` متوقع؛ لا جلسة |
| G4 — RLS/tenant | `BLOCKED` | بلا تغيير: 31 جدول/RLS 31، سياستان، `aigas_runtime` غائب، Data API `active` على `public` |
| G8 — Monitoring | `BLOCKED` | Sentry org بلا مشاريع؛ PostHog project `ingested_event=false`؛ لا SDK في `package.json` |

**Neon قراءة فقط (2026-11-09):** 31 جدولًا في `public`، RLS 31/31، `FORCE=0`، سياستان، `aigas_runtime=0`، `neon_auth.user=0`، `session=0`، `organization=0`، Data API `active` على `public`. مطابق للسجل السابق؛ لا كتابة.

## 5. التغييرات المحلية

**لا تغيير في كود التطبيق.** `render.yaml` و`src/middleware.ts` و`scripts/server.mjs` تصف التشغيل الصحيح وتُنتج `503` عند وصول الطلب لـNode. لا يوجد تصحيح برمجي يعالج دومينًا مربوطًا بأصل ثابت؛ تغيير route أو إضافة صفحة ثابتة لـ`/app` سيخفي السبب ويكسر دلالة `503`.

**ملاحظات مؤجلة (تحتاج تفويضًا منفصلًا):**
1. الصفحات prerendered تتجاوز middleware في standalone، فلا تحصل على CSP baseline وHSTS. معالجة ذلك في `scripts/server.mjs` أو عبر Render headers تحتاج تغييرًا وفحصًا مصرّحًا.
2. `render.yaml` يفحص `healthCheckPath: /` فقط؛ مراقبة `/app/api/kernel/health` غير مهيأة (G8).

## 6. خطة تحقق لاحقة (NOT RUN — تحتاج إذن المالك)

### 6.1 G2 — ربط المصادر (مشغّل Render + مالك المنصة)
1. في Render: سجّل service ID، النوع (`web` أم `static`)، الـruntime، `startCommand`، والفرع. **أسماء** متغيرات البيئة فقط؛ لا قيم.
2. سجّل آخر deploy ID وحالته، ثم commit SHA للـdeploy. قارنه بـ`git rev-parse HEAD` للنسخة المقصودة.
3. سجّل build command/زمن البناء/نتيجة البناء، وartifact أو image digest إن وُجد.
4. في Cloudflare/DNS: سجّل target الدومين وقواعد rewrite/cache. يجب أن يصل `/app/*` كما هو.
5. أنشئ سجل الربط: `host → DNS/CDN → service ID/type → deploy ID → SHA → digest → origin response`.

### 6.2 G3 — بوابة و`503` (مشغّل + أمن)
بعد ربط الدومين بخدمة Node، مع `AIGAS_APP_ENABLED=false`:

```bash
curl -sS -o /dev/null -D - https://<host>/app/
# المتوقع: 503، Cache-Control: private, no-store، X-Robots-Tag: noindex، X-Frame-Options: DENY
curl -sS -o /dev/null -D - https://<host>/app/api/kernel/health
# المتوقع: 503 JSON { "code": "APP_UNAVAILABLE" } وليس HTML 404
curl -sS -o /dev/null -D - https://<host>/ | grep -iE 'content-security|x-frame|referrer-policy'
```

- نجاح `503`: `RUNTIME_VERIFIED` للبوابة المغلقة فقط.
- بعدها فقط، وعلى staging: `AIGAS_APP_ENABLED=true` ثم `200/302` لـ`/app/` وJSON لـhealth.
- **لا يُرفع العلم على production** قبل G4/G5/G6/G7 وغالبية G8.

### 6.3 Auth/Invitation ببيانات اصطناعية (staging فقط)
حسابان اصطناعيان ومؤسستان، ثم: تسجيل → جلسة → عضوية → قبول دعوة → رفض مؤسسة أخرى. تُسجَّل الأدلة مع الطوابع الزمنية. لا بيانات عملاء ولا أسرار في السجلات.

### 6.4 التحقق المحلي المتكافئ (بإذن، على نفس SHA)
```bash
npm ci && npm run build          # فحص فقط، لا نشر
AIGAS_APP_ENABLED=false npm start
curl -sS -o /dev/null -D - http://127.0.0.1:10000/app/
# المتوقع: 503 من البوابة
```
هذا يثبت أن الـartifact ينتج `503`؛ لا يثبت النشر.

## 7. ما يلزم من المالك

| القرار | السبب |
|---|---|
| تفويض Render MCP أو قراءة الخدمة عبر حساب المشغّل | Render MCP أعاد `unauthorized`؛ لا workspace محدد من المالك بعد |
| اختيار Render workspace | القاعدة: لا اختيار تلقائي |
| ربط الدومين بخدمة Node (`npm start`) بدل الأصل الثابت | السبب الجذري للـ404 |
| اعتماد نافذة التحقق أعلاه على staging | G2/G3 لا يُغلقان بدون أدلة مؤرخة |
| اعتماد منفصل لمعالجة تجاوز middleware للصفحات prerendered | تغيير أمني خارج نطاق هذه الدفعة |

## 8. حدود الدليل

- لم يُثبت تطابق الأصل المنشور مع `5ee9df75`؛ بل ثبت أنه **لا يخدم** SSR لـ`/app`.
- لم تُقرأ أي قيمة سرية، ولم يُعدّل أي إعداد خارجي.
- لا `200` ولا `503` أُعلن لأي مسار `/app`؛ الملاحظ `404` فقط.
- لا ادعاء `BETA READY`، ولا رفع لأي بوابة من `BLOCKED`.
