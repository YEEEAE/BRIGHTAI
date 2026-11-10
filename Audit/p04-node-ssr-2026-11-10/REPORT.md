# P04 — تهيئة Node SSR وتتبع الإصدار

**التاريخ:** 2026-11-10 · **البيئة:** macOS (darwin) محلي · **Node:** v22.22.2 · **npm:** 10.9.7 · **Astro:** 6.4.8 · **@astrojs/node:** 10.1.4
**النطاق:** OP01–OP05 (تهيئة الخدمة، تتبع الإصدار، العلم، readiness، التراجع) — **بلا نشر**.
**الحالة:** `PARTIAL` — تمهيد محلي مُثبت؛ إنشاء خدمة Render وربط الدومين و`env` **BLOCKED** بانتظار تفويض المشغّل.

---

## 1. المرجع والانحراف

| البند | القيمة |
|---|---|
| SHA المرجعي للتدقيق | `7b1f533f71c7b1f41884790366a4d5967c85a87b` |
| HEAD وقت التنفيذ | `655a8b9ac2c2e30deee8d64c2348e0b66440063f` (`main`) |
| انحراف ملفات P04 | **صفر** — `astro.config.mjs`، `scripts/server.mjs`، `src/middleware.ts`، `render.yaml`، `package.json` غير معدّلة بين المرجع وHEAD |
| محتوى الانحراف | إضافات تدقيق/تقارير/ترحيلات 0028–0029 وسكربتات P02/P03 فقط |
| `origin/main` (مرجع محلي آخر fetch) | `0 0` مع HEAD — لم يُعد الـfetch، فالقيمة `HISTORICAL` وليست إثباتًا حيًا |
| working tree قبل العمل | نظيف |

إذن نتائج التدقيق القديمة عن الأصل ما زالت تصف الكود الحالي، لكن **حالة Render الحية لم تُعد قراءتها** (البند 6).

---

## 2. ما تغيّر ولماذا

| الملف | التغيير | السبب |
|---|---|---|
| `scripts/build-version.mjs` (جديد) | تكامل Astro يكتب `dist/server/version.json` عند `astro:build:done` | يربط الـartifact بـSHA والاعتماديات بدل الاعتماد على تصنيف deploy |
| `src/server/kernel/version.mjs` (جديد) | يقرأ الـartifact ويعرض service/deploy/commit/digest ومقارنة `consistent` | تتبع service→deploy→SHA→artifact من داخل العملية |
| `src/server/kernel/readiness.mjs` (جديد) | آلة حالة الجاهزية: db + auth + portal | OP01/OP05: readiness تفصل إعدادًا ناقصًا عن عطل تبعية |
| `src/server/kernel/db.mjs` | `probeDatabase()` اتصال قصير العمر (2s) + `DB_SETUP_REQUIRED` يحمل `not configured` | فحص الجاهزية لا يستهلك pool الخدمة أثناء عطل DB؛ تصنيف الإعداد الناقص صحيح |
| `src/server/kernel/auth.mjs` | `AUTH_SETUP_REQUIRED` يحمل `not configured` | نفس السبب: عقد `dependencyStatus` في `contracts.mjs` يميّز «غير مهيأ» عن «متاح مؤقتًا» |
| `src/pages/healthz.ts` (جديد) | `GET`/`HEAD` عام، JSON، `no-store`/`noindex`، 200 أو 503 | فحص صحة يعمل حتى والباب مغلق؛ لا يمر عبر بوابة `/app` |
| `astro.config.mjs` | تسجيل تكامل الإصدار + استثناء `/healthz` من sitemap | لا يُنشر مسار تشغيلي في خريطة الموقع (بقيت 55 صفحة) |
| `render.yaml` | `healthCheckPath: /healthz/` + `AIGAS_HEALTH_AUTH_PROBE=true` + أسماء الأسرار في تعليق | فحص جاهزية بدل صفحة رئيسية؛ لا قيم أسرار |
| `scripts/verify-node-runtime.mjs` (جديد) | 15 فحصًا على الخادم الحقيقي بثلاث تهيئات | دليل قابل للتكرار بدل لقطة يدوية |
| `docs/APP-PORTAL-RUNTIME-HANDOFF.md` | القسم 9: الأوامر، عقد `/healthz/`، خريطة التتبع، خطة staging، التراجع، الحدود | تسليم تشغيلي بلا تنفيذ |

محدود: 5 ملفات معدّلة (128+/6−) و5 ملفات جديدة. لا تغيير في `scripts/server.mjs` ولا `src/middleware.ts` (سلوك البوابة والتحويلات كافٍ ومُختبر).

---

## 3. الأوامر والنتائج

```bash
npm ci                     # لم يُعد تنفيذه: node_modules موجود ومطابق (lockfile digest مثبت في artifact)
npm run build              # PASS — 55 صفحة عامة، version.json: 655a8b9ac2c2
node --test tests/*.test.mjs                              # 31 pass / 5 skip / 0 fail (36)
node scripts/verify-node-runtime.mjs                      # 15/15 PASS
node scripts/verify-routes.mjs http://127.0.0.1:4388      # PASS — pages 55, references 2880, redirects 117
```

- `build`: `[brightai-seo-coverage] PASS: 55 public pages` + `[brightai-build-version] version.json: 655a8b9ac2c2`، بلا أخطاء.
- الاختبارات: النتيجة مطابقة لخط الأساس في العقل (`unit 31`، `5 skip` بسبب غياب `KERNEL_TEST_DATABASE_URL`) — **لا انحدار** من تعديل `db.mjs`/`auth.mjs`.
- `verify-contracts-local.mjs`: **NOT RUN** — يتطلب `KERNEL_TEST_DATABASE_URL` بقاعدة مُرحّلة (خارج نطاق P04).
- `verify-routes`: 55 صفحة، 0 مرجع مكسور، 0 صفحة يتيمة، 234 فحص تحويل.
- `verify-node-runtime`: **15/15 PASS** مع قاعدة الجاهزية المحلية؛ وبدون `P04_READY_DATABASE_URL` تعطي **14 PASS / 1 SKIP / 0 FAIL** مع `exit 0` (الحالة الموجبة C هي المتخطاة فقط، لا تُحتسب فشلًا).

### 3.1 artifact مبني من نفس SHA

```json
{ "schema": 1,
  "commit": "655a8b9ac2c2e30deee8d64c2348e0b66440063f",
  "builtAt": "2026-11-10T15:03:55.799Z",
  "node": "v22.22.2",
  "packageLock": "sha256:362c1a0c27d9275362c984382192314082a233ccab79d5faf9daeaec65a1cf3a" }
```

`release.artifact.digest = sha256:842c8bd6f6828622ca3e7ae2c883de0693ea30bebd8ced5735d5147e84d0804f` و`release.commit` يساوي `git rev-parse HEAD`.

---

## 4. الحالات السلبية المقيسة

| # | الإدخال | المتوقع | الناتج |
|---|---|---|---|
| A1 | `AIGAS_APP_ENABLED=false` بلا DB/Auth | 503 `setup_required` | 503، `database: UNCONFIGURED`، `auth: UNCONFIGURED`، `portal: DISABLED` |
| A3 | استجابات `/healthz/` | غير مخزّنة | `no-store` + `CDN-Cache-Control: no-store` + `X-Robots-Tag: noindex, nofollow` |
| A4 | `HEAD /healthz/` | رمز بلا جسم | 503، جسم بطول 0 |
| A6 | `GET /app/` والباب مغلق | 503 HTML خاص | 503 + `private, no-store` + `noindex` + `Retry-After: 3600` |
| A7 | `GET /app/api/kernel/health/` | 503 JSON لا HTML | 503 `APP_UNAVAILABLE`، `application/json` |
| A8 | `/%61pp/`، `/%61pp/api/kernel/health/`، `/app/./api/kernel/health/` | لا تتجاوز البوابة | 503 في الثلاثة (JSON للـAPI) |
| A9 | جسم `/healthz/` | لا قيم إعداد | لا DSN، لا نمط توكن، لا ماركر |
| B1 | `/app/api/kernel/members/` بلا جلسة | 401 JSON | 401 `UNAUTHORIZED` + `private, no-store` |
| B2 | جلسة غير صالحة بلا إعداد Auth | 503 إعداد | 503 `AUTH_SETUP_REQUIRED` + `dependencyStatus: not configured` |
| B3 | `DATABASE_URL` إلى `127.0.0.1:1` | إغلاق الجاهزية | 503، `database: UNAVAILABLE`، `portal: ENABLED` |
| B4 | هوية المنصة مُمرَّرة | readback | `srv-local-proof` / `dep-local-proof` / `claimedCommit=HEAD` / `consistent=true` |
| B5 | جسم readiness مع DSN فيه ماركر | لا تسريب | الماركر غائب |
| C1 | DB محلية + Auth مهيأ | 200 `ready` | 200، `database: READY`، `auth: READY`، `authProbe: SKIPPED` |
| probe | `AIGAS_HEALTH_AUTH_PROBE=true` وJWKS غير متاح | 503 `unavailable` | 503، `auth: UNREACHABLE`، `authProbe: ACTIVE`؛ النداء التالي `CACHED` في 7ms |

ملاحظات سلوكية (دقيقة، لا تُخفى):
- `/app` و`/healthz` بلا شرطة أخيرة يعيدان **301** إلى النسخة بـ`/` قبل تشغيل middleware (سلوك Astro `trailingSlash: 'always'`). التحويل لا يكشف محتوى، والنسخة النهائية محكومة بالبوابة. لذلك `healthCheckPath` يستخدم `/healthz/` صراحة.
- `/APP/` و`/app%2F...` يعيدان 404: لا route مطابق أصلًا، فلا يوجد مسار بيانات يتجاوز البوابة.

---

## 5. حالة المتطلبات

| المتطلب | الحالة | الدليل | الحد |
|---|---|---|---|
| OP01 Node SSR + مسارات البوابة | `PARTIAL` | SSR حقيقي و`/app/*` 503 JSON/HTML محليًا | الخدمة المنشورة ما زالت `static_site`؛ لا خدمة Node مُنشأة |
| OP02 service→deploy→SHA | `PARTIAL` | artifact + readback + مقارنة `consistent` مثبتة محليًا | deploy/digest الحي غير مقروء (Render MCP غير مخوّل) |
| OP03 `AIGAS_APP_ENABLED` | `PARTIAL` | العقد مقيس في الوضعين false/true | القيمة الحية غير معروفة؛ لا `env` معدّل |
| OP04 حماية/كاش | `BLOCKED` (P18) | لم يُعدّل؛ سياسة CSP/HSTS على مسار P18 | خارج نطاق P04 وفق التعليمات |
| OP05 readiness + rollback | `PARTIAL` | readiness 200/503 + فشل DB/Auth + خطة رجوع موثقة | لا تمرين rollback على خدمة قائمة (لا خدمة) |

`PASS ≠ RELEASED`: كل ما سبق محلي؛ لا Portal ولا دومين ولا UAT.

---

## 6. ما تعذّر ولماذا

1. **قراءة Render الحية — BLOCKED.** `render.list_services` أعاد `no workspace selected` ثم `list_workspaces` أعاد `unauthorized`. لم أختر workspace ولم أفترض خدمة. لم تُعد قراءة الخدمة `srv-d7m5bcjbc2fs73826v20` ولا آخر deploy؛ ما في التدقيق (`dep-dbpg8kgae00c73easjr0`، `static_site`، `dist/client`) يبقى `HISTORICAL`.
2. **GitHub — لم يُستخدم.** لا MCP لـGitHub في هذه الجلسة؛ حالة `origin/main` من مرجع محلي سابق فقط، غير مُعاد fetch.
3. **إنشاء/تعديل Render — لم يُطلب تفويضه.** أي `create_web_service` أو تغيير `env` أو DNS/دومين أو نشر يبقى ممنوعًا حتى عرض الخطة والتكلفة وتفويض العملية نفسها. الخطة في القسم 9.4 من الـrunbook.
4. **اختبار Auth الكامل** يعتمد على P05؛ readiness هنا يثبت التهيئة والاتصال، لا صحة JWT.

---

## 7. التراجع

- إبقاء `AIGAS_APP_ENABLED=false` وعدم ربط الدومين = لا أثر إنتاجي؛ التراجع إغلاق الخدمة أو إعادة آخر deploy صالح.
- لا حذف خدمة/deploy/DNS؛ التتبع يبقى عبر `AIGAS_DEPLOY_ID` و`commit` في `/healthz/`.
- `healthCheckPath: /healthz/` يجعل تعطل DB/Auth يُفشل النشر بدل توجيه الحركة — مقصود، وموثق.

## 8. تنظيف

- قاعدة محلية مؤقتة `aigas_p04_readiness` أُنشئت للاختبار الموجب ثم **حُذفت** (تحقق: 0 قاعدة بهذا الاسم).
- لا ملفات `dist` معدّلة يدويًا؛ `dist/` متجاهل.
- لا أسرار في الكود أو التقرير: الأسماء فقط، والماركر محلي وهمي.

## 9. الملفات

`scripts/build-version.mjs` · `src/server/kernel/version.mjs` · `src/server/kernel/readiness.mjs` · `src/pages/healthz.ts` · `scripts/verify-node-runtime.mjs` · `src/server/kernel/db.mjs` · `src/server/kernel/auth.mjs` · `astro.config.mjs` · `render.yaml` · `scripts/server.mjs` · `docs/APP-PORTAL-RUNTIME-HANDOFF.md`

---

## 10. خدمة Free Staging على Render (تفويض المستخدم 2026-11-10)

المستخدم اختار «Render Free + تفويض إنشاء». أُنشئت خدمة حقيقية بخطة مجانية عبر Render CLI المخوّل (`render v2.15.1`، workspace `tea-dade102fngtc739064v0`):

| البند | القيمة |
|---|---|
| الخدمة | `brightai-staging-node` · `srv-dbpj8jajnfac739je6lg` |
| النوع/الخطة/المنطقة | `web_service` / `free` / `oregon` |
| المصدر | `github.com/YEEEAE/BRIGHTAI` / `main` / auto-deploy |
| العنوان | `https://brightai-staging-node.onrender.com` |
| الدومين المخصص | **لم يُلمس** — لا DNS ولا شهادة مخصصة |
| التكلفة | **$0** (750 ساعة/شهر للـworkspace؛ النائم لا يستهلك) |

كما تبيّن أن workspace الـCLI **لا يحتوي** الخدمة المرجعية `srv-d7m5bcjbc2fs73826v20` (ولا أي خدمة BRIGHTAI)، فما زال تتبع `static_site/dist/client` `HISTORICAL` ولا علاقة لهذه الخدمة به.

### 10.1 عيب حقيقي كشفه أول نشر

بناء Render نجح (`55 public pages`، `version.json` لم يكن موجودًا بعد لأن P04 غير مرفوع)، ثم:

```
BRIGHTAI listening on localhost:10000
==> No open ports detected on 0.0.0.0, continuing to scan...
```

`scripts/server.mjs` كان يورّث `HOST` من مهايئ Astro، فيستمع على loopback وRender لا يرى منفذًا. أُصلح: الافتراضي الآن `0.0.0.0` و`HOST=127.0.0.1` خيار محلي صريح. الدليل المحلي:

```
BRIGHTAI listening on 0.0.0.0:4410
node  TCP *:4410 (LISTEN)
127.0.0.1=200   lan(192.168.8.4)=200
```

هذا العيب كان سيصيب **أي** خدمة تُنشأ بلا `HOST`، و`render.yaml` كان يخفيه بضبط `HOST=0.0.0.0` صراحةً.

### 10.2 الحالة والخطوة الحاجزة

- النشر الأول: `dep-dbpj8jijnfac739je7q0` على commit `655a8b9` — لم يصبح live بسبب عيب الربط، وسيُستبدل بنشر جديد.
- التغييرات (P04 + إصلاح الربط) **غير مرفوعة**؛ الـpush ممنوع على الوكيل. بعد push المستخدم لـ`main` سيُطلق auto-deploy ويصبح الدليل الحقيقي متاحًا:
  `GET /app/api/kernel/health/` → 503 JSON (لا 404) · `/app/` → 503 مع `no-store`/`noindex` · `/healthz/` → 503 `setup_required` مع service/deploy/SHA/artifact · homepage 200.
- `healthCheckPath` بقي `/` على هذه الخدمة، ويُحوَّل إلى `/healthz/` بعد ضبط `DATABASE_URL` وAuth، وإلا فشل كل نشر (readiness تفشل عمدًا).

