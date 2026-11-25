# P0 — تسليم مرشّح Node SSR

**قرار النشر: NO-GO إلى أن تنجح بوابات القبول أدناه.** لا نشر ولا تغيير DNS ضمن هذه المهمة.

## المرشّح والاعتماديات

- المصدر الأساسي `57153b521b2fa6c5b5f7a73e7ea37bb427f9777f`، والمرشّح تغييرات محلية فوقه. الـSHA الذي يظهر في بناء الشجرة المحلية ليس SHA نشر المرشّح.
- Node `22.23.5` وnpm `10.9.7`، Astro `7.4.13` و`@astrojs/node` `11.1.14` بإصدارات ثابتة. استخدم `package-lock.json` فقط، و`npm ci && npm run build` ثم `npm start`. لا `pnpm install` ولا نشر `dist/client` كبديل عن الـSSR.
- `11.1.3` يعالج GHSA-qh8j-hqjv-7m4x لكنه يطلب Astro `^7.2.1` وليس Astro 6، ولا يكفي لـGHSA-r3h5-4585-7x3w. احتفظنا بحواجز `scripts/server.mjs`، وسياسة CSP وحراس origin للتطبيق.
- جرد `npm audit` الأساسي: `@astrojs/node`: GHSA-r557-wffq-wvrc، GHSA-qh8j-hqjv-7m4x، GHSA-r3h5-4585-7x3w؛ `astro`: GHSA-f48w-9m4c-m7f5، GHSA-7pw4-f3q4-r2p2، GHSA-4g3v-8h47-v7g6، GHSA-26w7-cxv4-gfx2 (حرجة)، GHSA-376h-93r7-7g6f، GHSA-98hj-9722-w3j8، GHSA-mh32-jxcr-mh9f، GHSA-r3h5-4585-7x3w؛ `esbuild`: GHSA-g7r4-m6w7-qqqr؛ `sharp`: GHSA-f88m-g3jw-g9cj، GHSA-rgj7-g3m4-5g8c، GHSA-wq5f-xc86-pv6w. تدقيق المرشّح الكامل و`--omit=dev`: صفر نتائج من السجل وقت الفحص؛ ليس ضمانًا ضد إصدارات إفصاح لاحقة. `npm ci` يحذّر من اختلاف peer لـ`@better-fetch/fetch` ضمن شجرة Neon Auth؛ لا تتجاوز فحص Auth بسببه.
- يعيد `npm ci` نفس شجرة الإقفال على بيئة مماثلة. لا ندّعي تطابق بايتات المخرجات؛ `version.json` يحتوي وقت البناء. سجّل Node/npm وSHA الكامل وSHA-256 للقفل وartifact digest والمنطقة ومعرّف الخدمة والنشر. طابق `dist/server/version.json` و`/healthz/` مع SHA والـdigest المتوقعَين.

## Staging منفصل — للمشغّل بعد اعتماد المرحلة 01

1. تحقّق أولًا من ملكية خدمة `brightai-staging-node` التاريخية أو من الخدمة المعتمدة في workspace الصحيح. افصلها عن خدمة الإنتاج، عطّل auto-deploy، ولا تربط نطاق الإنتاج أو DNS. الإعداد التاريخي للإنتاج `static_site`/`dist/client` و`pnpm install`، بخلاف `render.yaml` المحلي؛ لا تفترض أن لوحة Render تزامنت معه.
2. شغّل Web Service (`runtime: node`) بملف البناء والقفل أعلاه، `HOST=0.0.0.0` ومنفذ Render، وفحص `/readyz/` وليس `/`. اضبط `BRIGHTAI_STAGING_ORIGIN` وقت البناء و`AIGAS_API_ORIGINS` وقت التشغيل إلى عنوان HTTPS الدقيق المعتمد، بلا wildcard. تحقّق من نقل HTTPS/Host على الحافة؛ لا تُضعف allowedDomains أو حارس التطبيق لمعالجة 403.
3. ابدأ بـ`AIGAS_APP_ENABLED=false` و`AIGAS_REQUIRE_RLS=true` و`AIGAS_DB_RUNTIME_ROLE=aigas_runtime` و`AIGAS_HEALTH_AUTH_PROBE=true`. استخدم فرع PostgreSQL وNeon Auth معزولين وبيانات اصطناعية فقط، وأدخل الأسرار من لوحة البيئة. قبول المرحلة 01 للعزل وRLS وما يلزم من اعتماد الوصول شرط قبل تفعيل staging. افصل الاعتمادات عن الإنتاج وتأكد أن مسار الاختبار محمي؛ لا يكفي غياب DNS.
4. شغّل `npm run smoke:healthz -- "$STAGING_ORIGIN" --require-ready --expect-commit="$EXPECTED_COMMIT"`؛ تحقّق من GET/HEAD والصيغتين بلا تحويل. عند فشل اعتماد اختباري، توقّع liveness `200` وreadiness `503` بلا أسرار. لا تعدّ فحص JWKS إثباتًا لمسار الحساب: بعد تفويض تفعيل **staging فقط** افحص تسجيل الدخول/الخروج والدعوة، deep links وإعادة التحميل لـ`/app/` و`/app/trial/` ومسارات المنتجات؛ غير المصرح يتلقى رفضًا أو تحويل دخول وليس بيانات، والمسارات المعروفة لا تتحول إلى 404 ثابتة.
5. افحص origin والحافة كلًا على حدة: `no-store` للـapp وAuth وprobes بما فيها التحويلات والأخطاء، `Vary: Authorization, Cookie` للخاص، وCSP نافذة، وHSTS على HTTPS. مرّر فحص Chrome للـHero والجوال بلا أخطاء JS أو CSP. افحص Sentry staging بعد التحقق من المشروع، واربط الأخطاء بالـSHA من دون PII. **CI أخضر على SHA المرشّح شرط مستقل**؛ شغّل workflow المعتمد على Linux واعتمد Node/npm المذكورين، ولا تحسب تشغيل smoke المحلي نتيجة CI بعيدة.
6. **Rollback:** أوقف التعريض بإعادة العلم إلى `false`. أعد تشغيل آخر artifact Node مُعتمد ومتوافق مع المخطط من خلال Render، وتحقق من SHA وhealth/ready وCSP والكاش ورفض التطبيق. إن لم توجد نسخة Node سليمة، اعزل staging واترك الإنتاج العام بلا تغيير؛ لا تستخدم static artifact لإرجاع البوابة ولا تنفّذ down migration ضمن rollback التطبيق. سجّل المعرّف والوقت ونتيجة الفحص. التمرين على Render غير منفّذ.

## MagicPath

لم يُقدّم مكوّن أو revision محدد للاستيراد. يبقى Astro SSR مصدر المسار والصلاحية والـHTML؛ الاختيار الافتراضي نقل العرض إلى Astro + TypeScript، مع وحدة عميل محلية فقط حيث يلزم التفاعل. لا تستورد `App.tsx` أو global CSS. قبل الدمج افحص شجرة الحزم والتراخيص، واحصر CSS في المكوّن، واحتفظ بعقد route state داخل الخادم/عنوان URL. اختبر نفس artifact: وصول مباشر وإعادة تحميل، عدم ظهور 404 ثابتة للمسار الديناميكي، واتصال العميل تحت CSP دون توسيعها. البناء هنا للواجهة الحالية نفسها، لا لنسخة MagicPath جديدة.

## سجل التنفيذ والقياس — 2026-11-26

| البوابة | الدليل |
|---|---|
| Install / Build | `npm ci` وAstro build ناجحان، 67 صفحة عامة مسجلة، وفحص صياغة حزم JS المولّدة ناجح. بصمة القفل `7c788be26a006529235bf8a5c795b4ce4d65383f9254d400e143915033ff4f85`. |
| تكرار البناء | تشغيلان محليان بنفس القفل والأدوات وبيئة البناء؛ من أصل 353 ملفًا بعد استثناء `version.json` تطابق 352، واختلف `server/entry.mjs`. لا تطابق بتّي شامل. |
| توافق Astro 7 | `allowedDomains` يحدد مضيفي الإنتاج وstaging المعتمد والمحلي؛ حارس Auth لم يتغير. أزيل الاستيراد الديناميكي المشروط من مختبر المخاطر العام بعد ظهور JS غير صالح في البناء الأول؛ وحدة العميل تقتصر على مساري مساحة المخاطر SSR. |
| Health / readiness | 16/16، منها readiness 200 مع PostgreSQL 18 محلي وتهيئة Auth اصطناعية، و503 عند عدم الجاهزية. ليست نتيجة إثبات JWKS حي. |
| Chrome DevTools / Hero | عنوان الـHero والرسم ورابطا المنتجات والتواصل ظهرت. مع العلم مغلق: `/` و`/healthz/` و`/auth/sign-up/` = 200؛ `/readyz/` و`/app/` و`/app/trial/` = 503؛ CSP موجودة في جميع العينة و`no-store` لغير `/`. |
| Smoke المحلي الموافق لخطوة CI | 13 سجلًا بلا إخفاقات. عينة Hero على preview: TTFB ‏3ms، LCP ‏160ms، CLS ‏0.002. قياس اصطناعي على جهاز واحد، لا مقارنة زمنية قبل/بعد ولا CWV ميدانية. |
| App مفعّل محليًا فقط | `/app/` أعاد 302؛ ثمانية مسارات SSR، منها trial وKernel وRisk detail بعنوان اصطناعي مباشر، أعادت 200 دون 404. رموز HTML لا تثبت منح صلاحية أو نجاح عمليات API. |
| Auth E2E | **FAIL**: تجاوز التسجيل/الدخول والدعوة والتجربة الاصطناعية ثم توقف عند غياب `[data-access-status]` المرئي في `/products/` (السطر 410)، وهو نفس المسار الذي سجّلت فيه بوابة الإطلاق السابقة إخفاقًا. لا نعدّل الاختبار لإخفاء الفرق. |
| CI البعيد | لم يُرفع المرشّح. [تشغيل SHA الأساسي](https://github.com/YEEEAE/BRIGHTAI/actions/runs/45682883259) فشل، ولم تتوفر خطوات/سجلات كافية لتعيين السبب. |
| Render MCP | `list_workspaces` أعاد `unauthorized`؛ إعداد الخدمة والنشر وSHA الحالي غير متحقق منها. فحوص GET على عنوان staging التاريخي انتهت بمهلة 6 ثوانٍ بلا رد؛ ليست نتيجة 404 ولا دليل حذف. |
| Sentry / Graphify | بحث Sentry عن BrightAI لم يجد مشروعًا مرئيًا؛ لا استنتاج بشأن الأخطاء. لا يوجد `graphify-out/graph.json` محليًا؛ استُخدمت قراءة الكود الموجهة. |
