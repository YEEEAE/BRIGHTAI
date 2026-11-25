# تدقيق healthz وreadiness — BRIGHTAI

- التاريخ: 2026-11-24
- النطاق: `src/pages/healthz.ts`، `src/server/kernel/readiness.mjs`، `src/server/kernel/db.mjs`، `scripts/server.mjs`، `render.yaml`.
- الحالة: كود وتحقّق محلي مكتمل. لا نشر ولا فحص إنتاج.

## الملخص

العقد السابق كان يعمل عبر `/healthz/` فقط. المسار `/healthz` كان يعيد **301**
لأن `trailingSlash: 'always'` في Astro يعالج التحويل قبل الـroute والـmiddleware.
هذا مهم لأن Render يعتبر أي 2xx/3xx صحيًا، فقد يمر الفحص دون تقييم DB/Auth.
كما أن مسار الفشل في `healthz.ts` كان يُسقط `dependencies` و`release` و`service`،
فلا يكون الـschema ثابتًا.

تم إصلاح ذلك بعقد HTTP واحد في `src/server/kernel/health-endpoint.mjs`، ويستخدمه
route الأسترو وalias في `scripts/server.mjs`.

## النتائج قبل/بعد

| # | قبل | بعد | الدليل |
|---|---|---|---|
| 1 | `GET /healthz` = 301 إلى `/healthz/` | 200/503 JSON مباشر | curl + integration |
| 2 | `HEAD /healthz` = 301 بلا JSON | 200/503 بنفس ترويسات GET وبلا body | curl + integration |
| 3 | `HEAD /healthz/` بلا `content-type` | `application/json; charset=utf-8` | curl |
| 4 | مسار الفشل بلا `dependencies` | كل المفاتيح موجودة دائمًا | unit |
| 5 | `errorType` غير موحّد | `error` كود محدود أو `null` | unit |
| 6 | `new pg.Client` خارج `try` | داخل `try`؛ DSN مشوّه = 503 | unit/code |
| 7 | Render يستخدم `/healthz/` (صحيح) | بقي صحيحًا مع alias مباشر | unit + docs |

## العقد النهائي

```json
{
  "schema": 1,
  "status": "ready | not_ready",
  "state": "ready | setup_required | blocked | unavailable",
  "checkedAt": "ISO-8601",
  "dependencies": { "database": "…", "auth": "…", "authProbe": "…", "portal": "…" },
  "release": { "commit": "…", "consistent": true, "artifact": {}, "deploy": {} },
  "service": { "id": "…", "name": "…", "type": "…" },
  "error": null
}
```

- 200 فقط عند `status=ready` و`state=ready`.
- 503 لكل ما عدا ذلك، بما في ذلك تقرير داخلي مشوّه أو استثناء.
- لا DSN، لا مفاتيح، لا أسماء أدوار، لا رسائل PostgreSQL خام.

## الأدلة المنفّذة

```
node --test tests/healthz.test.mjs
  12 PASS

node --test tests/healthz.test.mjs tests/healthz-integration.test.mjs
  13 PASS / 1 SKIP (positive DB opt-in)

HEALTHZ_READY_DATABASE_URL=<disposable localhost db>
  node --test tests/healthz-integration.test.mjs
  2 PASS (200 ready + 503)

node scripts/smoke-healthz.mjs http://127.0.0.1:<port>
  4 PASS (GET/HEAD × /healthz, /healthz/)

node scripts/smoke-healthz.mjs … --require-ready
  exit 1 كما هو متوقع عند 503

node scripts/verify-node-runtime.mjs
  20 PASS / 1 SKIP / 0 FAIL
```

- SHA: `4a4bcc8f95dfd45c566faac1c55d4226da87455e`
- Node المستخدم: `v24.20.0`
- Astro الموجود في `node_modules`: `7.4.12`
- `package-lock.json` يثبت `6.4.8` — انحراف سابق في بيئة التطوير، لم يُغيّر.

## حدود

- لم يُنشر شيء، ولم يُفحص Render أو brightai.live.
- مسار 200 يحتاج DB محليًا يحوي `public.aigas_tenants`؛ استُخدمت قاعدة مؤقتة
  أُنشئت ثم حُذفت.
- لا إثبات لاكتمال migrations أو RLS أو منح المنتجات: الفحص يثبت وجود
  `aigas_tenants` فقط.
- `astro dev`/`astro preview` يبقيان على 301 لـ`/healthz`؛ الإنتاج عبر
  `npm start` يعيد JSON مباشرة.

## الملفات

- `src/server/kernel/health-endpoint.mjs` (جديد)
- `src/pages/healthz.ts`
- `src/server/kernel/db.mjs`
- `scripts/server.mjs`
- `tests/healthz.test.mjs` (جديد)
- `tests/healthz-integration.test.mjs` (جديد)
- `scripts/smoke-healthz.mjs` (جديد)
- `docs/HEALTHZ-READINESS.md` (جديد)
- `render.yaml`
