# APP PORTAL — RUNTIME HANDOFF (OPERATOR ONLY)

> **الغرض:** تسليم تشغيلي موجز لمشغّل مخوّل، لا تنفيذ نشر.
> **الحالة:** `SOURCE_PRESENT`; رُصد HTTP 404 على الروابط العامة بتاريخ 2026-11-08. خدمة الـOrigin وDeployment SHA والـartifact الذي أجاب الطلب `NOT_VERIFIED`؛ لذلك لا تنسب 404 إلى CSS أو إلى source قبل ربط الطلب ببيئته.
> **آخر مراجعة:** 2026-11-08. لم يُشغّل build أو خادم محلي، ولم يُنشر شيء.

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
AIGAS_APP_ENABLED=true npm run start:local
```

بدون `AIGAS_APP_ENABLED=true` تبقى البوابة مغلقة عند `start:local`. أما `astro dev` فتبقى مفتوحة ما لم يُضبط العلم صراحةً بـ`false`.

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
