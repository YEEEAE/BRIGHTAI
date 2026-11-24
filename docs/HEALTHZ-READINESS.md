# Healthz — عقد الجاهزية والفرق بين liveness وreadiness

> الحالة 2026-11-24: العقد مُنفَّذ ومُختبَر محليًا. الإنتاج لم يُفحص في هذا التدقيق.
> المصدر: `src/pages/healthz.ts` → `src/server/kernel/health-endpoint.mjs` → `src/server/kernel/readiness.mjs`.

## 1. الفرق بين liveness وreadiness

| | liveness | readiness |
|---|---|---|
| السؤال | هل العملية حيّة؟ | هل يمكنها خدمة الطلب الآن؟ |
| يعتمد على DB/Auth؟ | لا | نعم |
| عند الفشل | أعد تشغيل العملية | لا توجّه إليها traffic |
| المسار الحالي | فحص TCP على منفذ الخدمة (Render الافتراضي) | `GET /healthz/` و`GET /healthz` |
| لا يصلح له | — | `/` أو أي صفحة HTML |

`/healthz` هو **readiness** فقط. لا يوجد liveness HTTP منفصل: فحص Render TCP يكفي
لإثبات أن العملية تستمع، و`/healthz` يضيف فحص DB وAuth وإصدار البناء. لا يجوز
استخدام `/healthz` كـliveness (لأن فشل DB سيؤدي إلى restart بلا فائدة)، ولا
استخدام `/` كـreadiness (لأن صفحة HTML قد تعمل بينما DB/Auth متعطلان).

المسار `/app/api/kernel/health/` يخصّ صحة منتج Kernel خلف بوابة `/app`، وليس
بديلًا عن فحص المنصة.

## 2. المسارات والطرق

| المسار | الطرق | الاستجابة |
|---|---|---|
| `/healthz/` | GET, HEAD | JSON بعقد ثابت |
| `/healthz` | GET, HEAD | نفس JSON مباشرة (بدون redirect) |

`astro.config.mjs` يستخدم `trailingSlash: 'always'`، لذلك Astro يعيد 301 لـ
`/healthz` قبل تشغيل الـroute أو الـmiddleware. يعالج `scripts/server.mjs`
المسار بلا slash بنفس الدالة، لأن Render يعتبر **أي 2xx أو 3xx صحية**؛ redirect
كان سيجعل الفحص ينجح دون تقييم أي اعتمادية. في `astro dev` و`astro preview`
فقط (بلا `scripts/server.mjs`) يبقى `/healthz` تحويلًا إلى `/healthz/`.

الاستجابة `Content-Type: application/json; charset=utf-8`، و:
`Cache-Control: no-store, max-age=0`، `CDN-Cache-Control: no-store`،
`Cloudflare-CDN-Cache-Control: no-store`، `X-Robots-Tag: noindex, nofollow`،
`X-Content-Type-Options: nosniff`.
HEAD يعيد نفس الترويسات بلا body.

## 3. العقد الثابت

كل استجابة — نجاحًا أو فشلًا — تحتوي المفاتيح التالية:

```json
{
  "schema": 1,
  "status": "ready | not_ready",
  "state": "ready | setup_required | blocked | unavailable",
  "checkedAt": "ISO-8601",
  "dependencies": {
    "database": "READY | UNCONFIGURED | SCHEMA_MISSING | PRIVILEGE_DENIED | UNAVAILABLE | UNKNOWN",
    "auth": "READY | UNCONFIGURED | UNREACHABLE | UNKNOWN",
    "authProbe": "ACTIVE | CACHED | SKIPPED | UNKNOWN",
    "portal": "ENABLED | DISABLED | UNKNOWN"
  },
  "release": { "commit": "…", "consistent": true, "artifact": { }, "deploy": { } },
  "service": { "id": "…", "name": "…", "type": "…" },
  "error": null
}
```

- المفاتيح الخمسة المطلوبة دائمًا: `schema`, `status`, `state`, `checkedAt`, `dependencies`.
- `release` و`service` حقول هوية إضافية ثابتة، وليست إعدادات سرية.
- عند فشل الفحص نفسه: `error` كود محدود مثل `READINESS_CHECK_FAILED` أو
  `READINESS_CONTRACT_INVALID`، و`dependencies` كلها `UNKNOWN`. لا يُسرَّب نص
  الاستثناء.
- `release`/`service` تكون `null` فقط إذا تعذّر بناء هوية العملية.
- أي تقرير داخلي لا يطابق العقد يُعامل كـ503 وليس 200.

## 4. الحالات ورمز HTTP

| state | المعنى | HTTP |
|---|---|---|
| `ready` | DB جاهز، Auth مهيأ، إصدار البناء متسق | 200 |
| `setup_required` | DB أو Auth غير مهيأ | 503 |
| `blocked` | schema ناقص، صلاحية مرفوضة، أو تعارض commit | 503 |
| `unavailable` | DB لا يستجيب أو Auth غير قابل للوصول أو فحص فاشل | 503 |

`status` = `ready` فقط عندما `state` = `ready`. البوابة المغلقة
(`AIGAS_APP_ENABLED=false`) لا تُفشل الجاهزية؛ تُبلَّغ كـ`portal: DISABLED`.

فحص Auth الشبكي اختياري عبر `AIGAS_HEALTH_AUTH_PROBE=true`، بحد 2 ثانية
وذاكرة 15 ثانية. بدونه يُبلَّغ Auth المهيأ كـ`READY` مع `authProbe: SKIPPED`.

## 5. منع التسريب

الاستجابة لا تحتوي أبدًا:

- `DATABASE_URL` أو أي DSN أو host أو port.
- مفاتيح أو tokens أو cookies.
- أسماء أدوار قاعدة البيانات (`aigas_runtime` وغيرها).
- رسائل PostgreSQL الخام أو `permission denied` أو stack traces.

`probeDatabase` في `db.mjs` يعيد حالة فقط، ويحوّل `42501` إلى
`PRIVILEGE_DENIED` وأي خطأ آخر إلى `UNAVAILABLE`. استُخرج إنشاء `pg.Client`
داخل `try` حتى لا يتحول DSN مشوّه إلى استثناء يفلت من العقد.

## 6. Render

`render.yaml` يستخدم:

```yaml
healthCheckPath: /healthz/
```

هذا صحيح: الفحص يصل إلى route الجاهزية مباشرة، ويعيد 503 عند تعطل الاعتمادية.
لا تضبطه على `/` أو على مسار HTML. ولا تضبطه على `/healthz` في نشر يعتمد على
redirect قديم؛ المسار بلا slash يجب أن يعيد JSON عبر `scripts/server.mjs`.

وفق توثيق Render: الفحص HTTP يعتبر النجاح عند `2xx` أو `3xx` خلال 5 ثوانٍ.
لذلك أي redirect إلى `/healthz/` قد يُخفى كنجاح حتى لو كانت الاعتماديات متعطلة.
Render يوقف التوجيه بعد 15 ثانية من الفشل المتتالي، ويعيد التشغيل بعد 60 ثانية،
ويلغي النشر الجديد إذا لم تنجح كل العينات خلال 15 دقيقة.

## 7. الاختبارات وsmoke

```bash
npm run build
npm run test:healthz          # unit + integration (503 path)
node --test tests/healthz.test.mjs

# positive 200 against a disposable localhost DB with public.aigas_tenants:
HEALTHZ_READY_DATABASE_URL=postgresql://…/aigas_healthz npm run test:healthz

# post-deploy (read-only, no credentials):
node scripts/smoke-healthz.mjs https://<service>.onrender.com
node scripts/smoke-healthz.mjs https://<service>.onrender.com --require-ready --expect-commit=<sha>
```

- Unit: عقد الاستجابة، 200/503، الحالات، HEAD، منع التسريب، تعارض commit،
  تقرير مشوّه، ومسار 42501.
- Integration: يشغّل `scripts/server.mjs` الحقيقي ويختبر GET/HEAD للمسارين
  دون DB (503).
- Smoke: يرفض أي 3xx، ويتحقق من JSON والعقد وعدم التسريب وتطابق الحالة مع
  رمز HTTP، ويمكنه اشتراط 200 وتطابق SHA.

## 8. حدود التحقق

- محليًا: البناء تم بـNode 24.20.0 وAstro 7.4.12 الموجود في `node_modules`؛
  `package-lock.json` يثبت Astro 6.4.8. هذا انحراف سابق في بيئة التطوير وليس
  تغييرًا في هذا التدقيق، ويجب أن يُعاد البناء بـ`npm ci` قبل الاعتماد النهائي.
- مسار 200 يحتاج قاعدة بيانات تحوي `public.aigas_tenants`؛ الاختبار الملتزم
  يجعله اختياريًا عبر `HEALTHZ_READY_DATABASE_URL`.
- لم يُنشر شيء ولم يُفحص Render أو الدومين في هذا التدقيق.
- نجاح 200 لا يعني اكتمال كل migrations أو RLS أو منح المنتجات؛ الفحص يثبت
  وجود جدول `aigas_tenants` فقط.
