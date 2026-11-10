# APP PORTAL — RUNTIME HANDOFF (OPERATOR ONLY)

> **الغرض:** تسليم تشغيلي موجز لمشغّل مخوّل، لا تنفيذ نشر.
> **الحالة:** `SOURCE_PRESENT`; رُصد HTTP 404 على الروابط العامة بتاريخ 2026-11-08. خدمة الـOrigin وDeployment SHA والـartifact الذي أجاب الطلب `NOT_VERIFIED`؛ لذلك لا تنسب 404 إلى CSS أو إلى source قبل ربط الطلب ببيئته.
> **آخر مراجعة:** 2026-11-10 (P04: readiness + تتبع إصدار؛ محلي فقط، بلا نشر). لم يُنشر شيء.

> **تحديث التشغيل 2026-11-08:** `npm start` يشغّل الآن `scripts/server.mjs` الذي يطبّق `redirects.json` قبل معالج Astro standalone، لأن ملفات `index.html` الثابتة تتجاوز middleware. البناء والتحقق المحلي لصفحات SEO والتحويلات: PASS؛ لا نشر. الدليل: `Audit/seo-saudi-2026-11-08/REPORT.md`.

> **دليل حي 2026-11-08:** متصفح قراءة فقط أعاد HTTP 404 بلا تحويل للصفحات `/app/`, `/app/kernel/`, `/app/firewall/`, `/app/ledger/`, `/app/human-gate/`, `/app/risk-engine/`, `/app/secure-chat/` و`/app/api/kernel/health`. هذا يثبت سلوك URLs وقت الفحص فقط، ولا يحدد خدمة الـOrigin أو SHA المنشور. راجع `Audit/outhers/RELEASE-TRACEABILITY-BASELINE-2026-11-08.md`.

## 1. مصدر التشغيل الحالي (من الكود)

| العنصر | القيمة | الملف |
|---|---|---|
| نوع المخرَج | `output: 'server'` | `astro.config.mjs` |
| المهايئ | `@astrojs/node` بنمط `standalone` | `astro.config.mjs` |
| بناء | `npm ci && npm run build` | `render.yaml` |
| تشغيل | `npm start` → `node ./scripts/server.mjs` → Astro standalone handler | `package.json` |
| Node | `22.x` (Blueprint: `22.22.2`) | `package.json` / `render.yaml` |
| المنفذ والعنوان | `PORT=10000`، `HOST=0.0.0.0` | `render.yaml` |

هذا يعني: صفحات `/app/*` و`/app/api/*` **لا تُبنى كملفات ثابتة**. أي خدمة تستضيف `dist/client` وحدها ستُعيد 404 لهذه المسارات حتى لو كان الكود صحيحًا.

## 2. Node SSR مقابل Static hosting

| | Node web service (SSR) | Static hosting / CDN |
|---|---|---|
| `dist/server/entry.mjs` | يعمل ويخدم كل الطلبات | غير موجود / غير مُنفّذ |
| `src/middleware.ts` | يعمل (بوابة، ترويسات، تحويلات) | لا يعمل |
| `/app/*` | 503 أو الصفحة المصادق عليها | 404 |
| `/app/api/*` | JSON من الخادم | 404 أو ملف ثابت |
| أسرار الخادم | تبقى على الخادم | لا يوجد مكان آمن لها |

**مكان التغيير للمشغّل:** خدمة Render الحالية يجب أن تكون `type: web`, `runtime: node`، ويكون الدومين مربوطًا بها لا بصفحة ثابتة. تعديل مزوّد الاستضافة أو DNS **خارج نطاق هذه المهمة** ولم يُنفّذ.

## 3. تحديد مصدر 404 وربط الـartifact (قبل أي تغيير)

نفّذ هذه الخطوات كمشغّل مخوّل في Render ولوحة DNS/CDN، وسجّل الأدلة في سجل الإصدار. لا تغيّر الإعدادات أثناء التشخيص.

1. سجّل الوقت UTC، الـhostname، المسار، طريقة HTTP، ورؤوس الاستجابة (`server`, `via`, `x-render-origin-server`, `cf-ray` إن وُجدت). لا تسجّل cookies أو `Authorization` أو query تحتوي بيانات حساسة.
2. من Render، حدّد الخدمة التي تملك الدومين وسجّل service ID، النوع/runtime، الحالة، `startCommand`، الفرع، آخر deploy ID وحالته، وcommit SHA الذي بُني منه. طابق SHA مع `git rev-parse HEAD` للنسخة المقصودة؛ اسم الفرع أو `live` وحده لا يثبت تطابق المصدر.
3. افتح تفاصيل الـdeploy المطابق وسجّل build command، وقت البناء، build/deploy logs ذات الصلة، ونتيجة build. اربط artifact بذلك الـdeploy: Render Git deploy يستخدم build الناتج من SHA؛ إذا وُجد image أو artifact وسيط، سجّل image digest أو معرف artifact من مصدره الفعلي. لا تستنتج تطابق artifact من نجاح build محلي.
4. افحص domain attachment وDNS/CDN origin: يجب أن يصل `/app/*` و`/app/api/*` إلى **Node web service نفسها** وأن يصل المسار كما هو. افحص قواعد rewrite/fallback إلى `/index.html`، كاش CDN، وأي static site يسبق Node. لا تغيّر DNS أو إعدادات CDN ضمن هذا handoff.
5. بعد أن يثبت المشغّل أن الطلب وصل للـNode deploy المقصود، أرسل GET وHEAD دون أسرار إلى `/app/` وGET إلى `/app/api/kernel/health`. مع `AIGAS_APP_ENABLED=false` المتوقع 503 مع HTML للصفحة وJSON للـAPI، و`Cache-Control: private, no-store` و`X-Robots-Tag: noindex, nofollow`. 404 من static/CDN قبل وصول Node لا يثبت خلل middleware.

**سجل الربط المطلوب قبل الإغلاق:** `hostname → DNS/CDN target → Render service ID/type → deploy ID/status → source SHA → artifact/image digest → origin response → edge response`. إذا تعذر إثبات حلقة، أبقِ السبب `NOT VERIFIED`.

## 4. ما يفعله المشغّل بعد تحديد المصدر (لا يوجد إجراء منفّذ هنا)

1. تأكد أن الخدمة المنشورة هي Node web service، وأن `startCommand` هو `npm start` (ليس نشر مجلد `dist/client`).
2. تأكد أن الطلبات إلى `/app/*` و`/app/api/*` تُمرَّر كما هي دون rewrite إلى `/index.html`، وأن كاش الـCDN معطّل لهذا البادئة.
3. أضف متغيرات الخادم في لوحة الخدمة كأسرار (`sync: false`): `DATABASE_URL`، `NEON_AUTH_BASE_URL`، `NEON_AUTH_JWKS_URL`. لا تُضاف في المستودع ولا في ملفات tracked.
4. اترك `AIGAS_APP_ENABLED=false` حتى اعتماد المالك. البوابة المغلقة ترد الآن `503` مع رمز `APP_UNAVAILABLE` للصفحات وJSON للـAPI، وليس تحويلًا إلى صفحة عامة.
5. لا تضبط `AIGAS_APP_ENABLED=true` إلا بعد: اعتماد الإتاحة، وجود مساحة مؤسسة، ومراجعة ترويسات `no-store`/`noindex` على الاستجابة الفعلية.
6. بعد الربط، تحقق (أمر تشغيلي، لا نتيجة): `curl -sS -o /dev/null -w '%{http_code}\n' https://<host>/app/` — المتوقع `503` قبل التفعيل، و`200/302` بعده. ثم `/app/api/kernel/health` يجب أن يعيد JSON لا HTML.

> إن ظهرت صفحة 404 من مزوّد الاستضافة بدل استجابة الخادم، فالسبب في الأصل/المسار لا في مصدر الصفحة.

## 5. تشغيل محلي (اختياري للمشغّل)

```bash
npm ci
npm run build
# .env محلي غير متتبع يحتوي قيم تطوير معتمدة
npm run start:trial
```

`npm run start:trial` يفتح بوابة الدخول على `127.0.0.1` فقط ويحمّل `.env`، ولا يمنح عضوية أو استحقاقًا ولا يفعّل مزود AI. `npm start` و`start:local` يحتفظان ببوابة الإغلاق؛ بدون `AIGAS_APP_ENABLED=true` تبقى البوابة مغلقة عند `start:local`. أما `astro dev` فتبقى مفتوحة ما لم يُضبط العلم صراحةً بـ`false`.

## 6. مصفوفة سلوك البوابة

| العلم | المسار | الاستجابة |
|---|---|---|
| `false` أو غير مضبوط في الإنتاج | `/app/...` | `503` صفحة HTML عربية، `no-store`, `noindex`, `Retry-After` |
| `false` أو غير مضبوط | `/app/api/...` | `503` JSON `{ code: "APP_UNAVAILABLE" }` |
| `true` | `/app/...` | الصفحة المصادق عليها؛ الوصول يقرره الخادم لا الواجهة |
| `true` | `/app/api/...` | يعود للـhandler؛ غياب الجلسة `401`، غياب الإعداد `503` |

البوابة لا تمنح وصولًا؛ هي فقط تمنع تقديم واجهة أو JSON خاص عند الإغلاق. تطبّع `src/middleware.ts` المسار (فك `%xx`، دمج الشرطات، حلّ `.`/`..`) قبل القرار، فلا يتجاوز البوابة مسار مُرمّز مثل `/%61pp/...` يطابقه Astro كمسار `/app/...`.

## 7. Rollback وحدود الإغلاق

- قبل أي تغيير حي، دوّن إعداد origin/domain/CDN الحالي وdeploy ID الحالي كمرجع رجوع، وتأكد أن مشغّل الخدمة يملك صلاحية الاستعادة.
- إذا فشل Node deploy أو فحوصه، أعد الدومين/توجيه المسار إلى إعداد origin السابق المعروف، أو أعد نشر آخر deploy سليم للخدمة وفق إجراء Render المعتمد. أبقِ `AIGAS_APP_ENABLED=false`؛ لا تفتح البوابة كحل إسعافي.
- امسح كاش `/app/*` بعد الاستعادة عند الحاجة، ثم أعد GET/HEAD للصفحات العامة ومسارات `/app/` وAPI، وسجّل status والرؤوس من الحافة. عودة الموقع العام لا تثبت سلامة البوابة.
- لا تحذف خدمة أو deploy أو DNS record كجزء من rollback دون موافقة مالك المورد.

## 8. عوائق ومحددات

- **لم يُنفّذ** نشر أو تغيير Origin/DNS/CDN أو تعديل `AIGAS_APP_ENABLED` على بيئة حقيقية. لا يزال تحديد سبب 404 يتطلب أدلة المشغّل أعلاه.
- **سجل 2026-11-03 التاريخي:** لم يُنفّذ فيه build أو تشغيل خادم أو فحص متصفح أو `curl`. في مراجعة 2026-11-08 جرى فحص المتصفح العام فقط وكانت النتيجة 404؛ Origin وSHA المنشور لا يزالان `NOT_VERIFIED`.
- نجاح التشغيل المحلي لا يثبت إتاحة البوابة أو صحة الجلسة أو صلاحيات قاعدة البيانات.
- لا مستخدمين أو بيانات عملاء؛ Neon production لم يُقرأ أو يُكتب في هذه المهمة.
- تفعيل البوابة يحتاج اعتماد مالك مستقل، ثم تحقق ترويسات الاستجابة من البيئة الفعلية.

## 9. تهيئة Node SSR وتتبع الإصدار (P04 — 2026-11-10، محلي فقط)

> **الحالة:** تمهيد محلي مُثبت، **بلا نشر**. لم تُنشأ خدمة Render، ولم يُعدّل `env` أو دومين أو DNS.
> **الدليل:** `Audit/p04-node-ssr-2026-11-10/REPORT.md`. **OP04** (حماية كل الاستجابات والكاش من edge) ما زال مسؤولية P18، واكتماله ليس شرطًا لتهيئة الخدمة.

### 9.1 أوامر قابلة للتكرار

```bash
npm ci
npm run build                       # ينتج dist/client و dist/server و dist/server/version.json
npm start                           # node ./scripts/server.mjs على PORT/HOST
node scripts/verify-node-runtime.mjs # يبدأ الخادم نفسه بثلاث تهيئات ويقيس السلوك
```

`scripts/verify-node-runtime.mjs` لا يتصل بالشبكة الخارجية: يستخدم `127.0.0.1` و`127.0.0.1:1` كحالة فشل. الحالة الموجبة للـreadiness تحتاج قاعدة محلية مُهيأة:

```bash
createdb aigas_p04_readiness
psql -d aigas_p04_readiness -c 'CREATE TABLE aigas_tenants(id uuid primary key default gen_random_uuid())'
P04_READY_DATABASE_URL="postgresql://$USER@127.0.0.1:5432/aigas_p04_readiness" node scripts/verify-node-runtime.mjs
```

### 9.2 عقد readiness — `/healthz/`

| البند | السلوك |
|---|---|
| الغرض | جاهزية الخدمة، لا مجرد إتاحة الصفحة الرئيسية |
| الاستجابة | JSON غير مخزّن (`no-store`، `noindex`، `CDN-Cache-Control: no-store`) |
| `200` | فقط عندما تكون قاعدة البيانات والـAuth جاهزتين |
| `503` | `setup_required` (إعداد ناقص) أو `blocked` (schema/صلاحية) أو `unavailable` (تبعية لا تستجيب) |
| `HEAD` | نفس الرمز بلا جسم |
| الأسرار | لا DSN، لا توكن، لا اسم دور، لا رسالة سائق؛ حالات ورموز فقط |
| البوابة المغلقة | `portal: "DISABLED"` ولا تُفشل الجاهزية؛ إغلاق البوابة قرار منتج لا عطل تبعية |

الفحوص: `database` (اتصال قصير العمر + وجود `aigas_tenants`)، `auth` (تهيئة `NEON_AUTH_BASE_URL`/`NEON_AUTH_JWKS_URL`، وفحص فعلي لـJWKS عند `AIGAS_HEALTH_AUTH_PROBE=true` بمهلة 2s وكاش 15s)، `schema` يميّز `SCHEMA_MISSING` عن `UNAVAILABLE`، `PRIVILEGE_DENIED` منفصل.

> اتصال الفحص قصير العمر ومستقل عن pool الطلبات، فلا يجوع الخدمة أثناء عطل DB. على Neon اضبط فاصل فحص المنصة على 10s أو أكثر حتى لا يستهلك كل فحص اتصالًا جديدًا بلا داعٍ. المسار عام ويُظهر معرّفات وdigests فقط؛ ليست أسرارًا، لكنها ليست للفهرسة (`noindex`).

### 9.3 تتبع الإصدار: service → deploy → SHA → artifact

| المصدر | المحتوى | من يضبطه |
|---|---|---|
| `dist/server/version.json` | `commit`, `builtAt`, `node`, `packageLock` (sha256) | `scripts/build-version.mjs` أثناء البناء |
| `release.artifact.digest` | sha256 لملف `version.json` نفسه | الخادم عند القراءة |
| `RENDER_SERVICE_ID` / `RENDER_SERVICE_NAME` / `RENDER_SERVICE_TYPE` | هوية الخدمة | Render |
| `RENDER_GIT_COMMIT` | SHA الذي intent الـdeploy | Render |
| `AIGAS_RELEASE_SHA` | SHA صريح من CI عند الحاجة | المشغّل/CI |
| `AIGAS_DEPLOY_ID` | معرّف الـdeploy للتتبع | المشغّل/CI (اختياري) |
| `AIGAS_IMAGE_DIGEST` | `sha256:…` عند النشر بصورة | المشغّل (اختياري، غير منطبق على Node runtime الأصلي) |
| `release.consistent` | مقارنة artifact مع قيمة المنصة | الخادم؛ `null` تعني لا يوجد طرف للمقارنة |

`consistent=false` يعني أن الـartifact لا يطابق ما تظنه المنصة: لا تُفتح البوابة ولا يُحوّل الدومين حتى يُفسَّر التعارض.

### 9.4 خطة خدمة Node Staging (تحتاج تفويضًا — لم تُنفّذ)

| البند | القيمة المقترحة |
|---|---|
| النوع | `type: web`، `runtime: node` (ليس `static_site`) |
| البناء | `npm ci && npm run build` |
| التشغيل | `npm start` (`scripts/server.mjs` → Astro standalone) |
| فحص الصحة | `/healthz/` |
| Node | `22.22.2` |
| `AIGAS_APP_ENABLED` | `false` حتى اعتماد المالك |
| `AIGAS_CSP_ENFORCE` | `false` (السياسة الكاملة Report-Only حتى P18) |
| `AIGAS_HEALTH_AUTH_PROBE` | `true` لبيئة staging |
| `AIGAS_REQUIRE_RLS` | `true` فقط بعد ربط `DATABASE_URL` بدور runtime بأقل صلاحية |
| أسرار (أسماء فقط) | `DATABASE_URL`، `NEON_AUTH_BASE_URL`، `NEON_AUTH_JWKS_URL` |
| الدومين | لا يُنقل؛ تُستخدم `onrender.com` للاختبار حتى قرار الإطلاق |

**التكلفة:** لا تُنشأ قاعدة أو خدمة مدفوعة إضافية داخل هذه المهمة؛ التكلفة = خدمة web واحدة على خطة الحساب الحالية (خطة الخدمة + ساعات التشغيل). يجب أن يؤكد المشغّل الخطة والسعر داخل Render قبل التفويض؛ لا يُفترض رقم من هذا المستند.

### 9.5 التراجع

- إبقاء `AIGAS_APP_ENABLED=false` وعدم ربط الدومين يجعل التراجع إغلاق الخدمة أو إعادة آخر deploy صالح.
- لا حذف خدمة أو deploy؛ التتبع يبقى عبر `deployId` و`commit` المسجلين في `/healthz/`.
- أي rollback يرافقه إعادة قراءة `/healthz/` وسجل `consistent` للنسخة السابقة.

### 9.6 الحدود

- OP04 (CSP/HSTS على كل استجابات HTTP، وكاش edge للخاص) وP18 هما مالك إثبات الحماية الكاملة؛ هذا المستند لا يدّعيها.
- `healthCheckPath: /healthz/` يعني أن تعطل التبعيات يُفشل الـdeploy بدل توجيه الحركة؛ هذا مقصود، ويجب أن يبقى `DATABASE_URL` مضبوطًا قبل أول نشر ناجح.
- لا يوجد تمرين rollback حقيقي لأن لا خدمة Node قائمة.

### 9.7 خدمة Free Staging الفعلية (2026-11-10)

| البند | القيمة |
|---|---|
| الخدمة | `brightai-staging-node` · `srv-dbpj8jajnfac739je6lg` |
| النوع/الخطة/المنطقة | `web_service` · `free` · `oregon` |
| المصدر | `github.com/YEEEAE/BRIGHTAI` · `main` · auto-deploy على كل push |
| العنوان | `https://brightai-staging-node.onrender.com` (بلا دومين مخصص، بلا DNS) |
| فحص الصحة | `/` مؤقتًا؛ يتحول إلى `/healthz/` فقط بعد ضبط `DATABASE_URL` وAuth، وإلا صار كل نشر غير صحي |
| التكلفة | **صفر**؛ 750 ساعة/شهر للـworkspace، والخدمة النائمة لا تستهلك |

**درس إلزامي (عيب حقيقي ظهر عند أول نشر):** `scripts/server.mjs` كان يستخدم `HOST` من المهايئ فيستمع على `localhost`، وRender يعلن `No open ports detected on 0.0.0.0`. صار الافتراضي `0.0.0.0`، و`HOST=127.0.0.1` خيار محلي صريح. أي خدمة تُنشأ بدون `HOST` ستعمل الآن بلا هذا العيب.

**انحراف مقصود:** هذه الخدمة أُنشئت بـCLI لا من Blueprint، لذلك `render.yaml` لا يحكمها؛ الـBlueprint يبقى تعريفًا للنشر المعتمد، والخدمة المجانية دليل staging مؤقت. الفرق المؤثر حاليًا: `healthCheckPath`.

**قيود الخطة المجانية:** نوم بعد 15 دقيقة خمول وإيقاظ ~دقيقة (فحص المنصة يحدث عند النشر لا كمراقبة uptime)؛ قرص مؤقت؛ Rollback لآخر نشرين؛ ليست للإنتاج؛ وقد تُوقف عند حركة خارجية غير معتادة.
