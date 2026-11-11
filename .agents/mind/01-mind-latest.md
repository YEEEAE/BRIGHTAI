# Project Mind — BRIGHTAI / AIGAS

## Current State
- 2026-11-11 VERIFIED LOCAL T04: HEAD `48e0f4fe61a3e7b86bb752675d6148ede01c7a1d`+working tree؛ review binding v2 يفرضtenant/request/fingerprint؛unit7 وPG18.6 سيناريوأربعةمنتجات1 PASS؛ESCALATE409 فقط بلاadapter؛ `Audit/t04-products-2026-11-11/REPORT.md`؛رحلةفريقغيرمثبتة.
- 2026-11-11 VERIFIED LOCAL T03: HEAD `86954bd96dd4929a92ffa96066a309efc367ddf2`+working tree؛ bootstrap مشغّل ذري ومنحتصفح48h مستقلة؛ DB18.6 سيناريو1 PASS/unit identity4/navigation3/order5 PASS؛0033 محلي فقط؛ `Audit/t03-exploration-2026-11-11/REPORT.md`.
- 2026-11-11 VERIFIED LOCAL+STAGING T02: HEAD `95f12b9c1fff4717904d4602de86c441a7a56d22`+working tree؛ local RLS74/contracts75/order5/build56 PASS؛ Neon restricted LOGIN34/34 PASS،حُذف معfixtures؛ `Audit/t02-schema-rls-2026-11-11/REPORT.md`؛ T03 permanent pool/SSR غير مثبتة.
- 2026-11-11 VERIFIED LOCAL T01: HEAD `8a5f498`+working tree؛ Node22.22.2 build56/runtime19 (PG18 مؤقت؛ Auth probe SKIPPED)؛ `Audit/t01-node-ssr-2026-11-11/REPORT.md`؛ لا نشر.
- 2026-11-11 VERIFIED LOCAL: أزرار أسماء المنتجات أعلى«جرب المنتج اللي تحتاجه» تفتحKernel عبرproductEntryPath مثلزرالدخول، معreturnToلكلمنتج؛ أزيلscrollspyللـanchors؛ Browser5/5 وunit3 وbuild56/routes56/0broken؛ `Audit/local-trial-2026-11-11/PRODUCT-ENTRY-LINKS.md`.
- 2026-11-11 VERIFIED LOCAL: `npm run start:trial` يفتحPortal على127.0.0.1:4416 دون تغييرproduction gate؛ اختيار المستخدمGroq/qwen/qwen3.8-27b فيGROQ_MODEL وردupstream200/31tokens؛ ليس تشغيلSecureChat. قاعدة.env الخارجية بلاجداولTrial/Quota وبلاBRIGHT AI؛ registryفارغ وchat policy integrationمغلق؛ `Audit/local-trial-2026-11-11/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL (P16/AR04): HEAD `9628162`؛ 4 حزم/12 advisory (critical AVIF واحد، 2 high)؛ `sharp` اختياري بلا أثر في `dist` و`esbuild` build-only؛ الحزمان القابلان للاستغلال في `@astrojs/node` (Host مشوّه ⇒ 500، backslash ⇒ 301 protocol-relative) أُغلقا في `scripts/server.mjs` وأُثبتا قبل/بعد؛ 11 استثناءً موقّعًا حتى `2027-02-08`؛ الحرجة بلا تنازل (تحتاج موافقة المؤسس)؛ `Audit/p16-dependency-security-2026-11-10/REPORT.md`.
- 2026-11-10 INVARIANT (P16): الإصلاح الجذري يحتاج ترقية رئيسية `astro ≥ 7.3.2` + `@astrojs/node ≥ 11.1.3` + Node `≥ 22.23.4` (المثبّت `22.22.2`)؛ إدخال `astro:assets`/`Image`/`avif` قبلها يُبطل استثناءات `sharp` والحرج؛ `scripts/verify-dependency-posture.mjs` يعيد إثبات الشروط.
- 2026-11-10 VERIFIED LOCAL (P14): HEAD `2eb45b7`+working tree؛ 56 صفحة مفهرسة (أُدخل `/kernel/`) و117 alias 301 (GET/HEAD، query محفوظ، صفر loop/chain) وcanonical/OG/alt/JSON-LD وصفر روابط مكسورة؛ أُزيل noindex للاستعلام الحساس، وArticle يحمل datePublished+image؛ noindex مقصور على `/auth/*` و`/app/*` و`/healthz/` و`/404/`؛ SE04 الحي BLOCKED على push؛ `Audit/p14-seo-links-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL (P12): تنقل موحد للمنتجات وreturnTo بقائمة سماح؛ الكتالوج بلا شارات إتاحة بتوجيه المستخدم، بتصميم تحريري ورسوم وحركة تدريجية؛ build55/routes55/unit17 وChrome360/390/768/1440 وreduced-motion/no-JS PASS؛ الرحلة المخولة والعمليات/الحصص والنشر NOT VERIFIED؛ `Audit/p12-product-journey-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL+STAGING-READONLY (P03): HEAD `9f70334`؛ مصفوفة RLS 69/69 محليًا (owner0 لـruntime، صفر منح عميل، A/B CRUD، GUC، COPY، DB07)؛ staging 9/9 قراءة (36 جدول/77 سياسة/25 دالة)؛ contracts36/36؛ دليل `Audit/p03-runtime-rls-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL: HEAD `60777c9739d5584360e57bd5238d3a075b06c09a` + working tree؛ AR02/AR03 (مقيسة على `5725727`): unit31/combined36 PASS،0 FAIL/0 SKIP؛ DB18.6 بخمس قواعد ودورruntime/NOBYPASSRLS؛ build/routes55 PASS؛ مرجع `Audit/ar02-ar03-2026-11-10/REPORT.md`؛ لا إطلاق.
- 2026-11-11 VERIFIED STAGING `lucky-salad-43566291`/`br-rough-wind-bdkmg13n`/`neondb`:28/28 APPLIED/hash match؛25 receipts محفوظة،delta0030/0031/0032 فقط دون إعادة بناء؛41 جدولًا/RLS41/FORCE2/89 سياسة/30 دالة؛صفرEXECUTEعميل،18منحةأعمدةTrial؛quota/readiness/operators=0؛runtime NOLOGIN/NOBYPASSRLS/owner0 وقناةSET ROLEثبتت؛لاcutoverللتطبيق.
- العقد المحلي يتطلب `0028` لقفل العضوية/المنح دون صلاحيات تعديل إضافية، و`0029` لمنع مرجعLedger الاصطناعيnull؛ طُبقتا ضمن ledger28/28 على staging المعزول؛ أي تطبيق على الإنتاج يحتاج مراجعة وتفويضًا مستقلًا.
- التقرير له قارئHTML مستقل دون شبكة: `Audit/final-360-2026-11-10/FINAL-360-AUDIT.html`؛ يولد بـbuild-report.mjs؛76 متطلبًا و25 برومبتًا؛ Chromium360/390/768/1440 والبحث/النسخ/CSV وتهيئة الطباعة PASS؛ بيانات التدقيق لم تتغير.
- توجيه المستخدم2026-11-10: لا سقف15 لبرومبتات الإغلاق؛ الخطة الحالية25 بتقسيم تخصصي وتبعيات مفحوصة في `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`؛ أرقام التدقيق وNO-GO دون تغيير.
- 2026-11-10 VERIFIED LOCAL (P06-A): HEAD `7d7be00`+working tree؛ دورة Trial خادمية بقناة مشغّل وبوابة جاهزية/حصة؛ contracts46/46، `0030` fresh+delta، build/routes55؛ التفعيل مغلق وP06-B BLOCKED؛ `Audit/p06-trial-2026-11-10/REPORT.md`.
- 2026-11-10 HISTORICAL LIVE CHECK: SHA `7b1f533f71c7b1f41884790366a4d5967c85a87b` طابق Render deploy `dep-dbpg8kgae00c73easjr0`؛ الخدمة `srv-d7m5bcjbc2fs73826v20` static_site/dist/client وapp/Auth/API404؛ لم يُعد فحصها بجولةAR02/AR03؛ Beta/Commercial NO-GO.
- تدقيق360 تاريخي: tests18 PASS/9 FAIL/5 SKIP تجاوزتها نتائجAR02/AR03 المحلية أعلاه؛ Firewall harness8/8 و55 صفحة حية200 دليل مؤرخ في `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، دون عمليات منتج حية مثبتة.
- 2026-11-10 VERIFIED LOCAL (P04): HEAD `655a8b9` (ملفاتP04 مطابقة للمرجع `7b1f533`)؛ `/healthz/` عام 200/503 يفحص DB/schema/auth/portal بلا أسرار، و`dist/server/version.json`+readback يربطان service/deploy/SHA/artifact مع `consistent`؛ `healthCheckPath=/healthz/`؛ دليل `Audit/p04-node-ssr-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL+LIVE (P05): HEAD `7954bb6f` + working tree؛ إصلاح قفل الفاعل في `manageMember`/`policies` عبر `aigas_lock_member` ورفض self-role/revoke مبكرًا وتغليف 42501 في `createWorkspace`؛ contracts42/42 وbuild55 PASS؛ live Auth staging PASS (signup/login/restore/sign-out؛ JWT EdDSA/iss/ttl900؛ 5 هويات اصطناعية/0 جلسات/0 tenants)؛ دليل `Audit/p05-auth-identity-2026-11-10/REPORT.md`.
- 2026-11-10 STAGING FREE (Render): `brightai-staging-node`=`srv-dbpj8jajnfac739je6lg` خطة free/oregon، auto-deploy من `main`، بلا دومين؛ كشف أول نشر أن `scripts/server.mjs` يستمع على loopback ⇒ صار الافتراضي `0.0.0.0`. الخدمة المرجعية `srv-d7m5bcjbc2fs73826v20` ليست في workspace الـCLI (`tea-dade102fngtc739064v0`).
- 2026-11-10 PARTIAL (P13): HEAD `c5ef5547` + working tree؛ اختبارات المحولات 16/16 محليًا؛ مسودة URL غير معتمدة وغير كافية، وGA4 network غير مختبر؛ لا وجهة أو ingestion؛ `Audit/p13-observability-2026-11-10/REPORT.md`.

## Open Issues / Blockers
- 2026-11-11 PARTIAL T04: registryالتصعيدفارغ؛Backend/AI Governance لاعتمادoperationType وعقدمحتوىالمراجعةومحولذري؛بديلالحجبالمحددمثبت،لاpendingreviewحقيقية؛Neonقراءةoperators0/readiness0/explorationغائب؛InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-11 PARTIAL T03: NeonStaging operators0/quota0/exploration schemaغائب؛ يحتاجDBA0033 وIdentity/Operationsمشغّل وحسابات ومنح وAuthBrowserمشترك،وDevOpsNode؛closeلايبطلAuthsessions؛purgeمقفوللاحتفاظمعتمد؛InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-10 OPEN (P16): استثناء `GHSA-26w7-cxv4-gfx2` (critical، غير قابل للوصول) يحتاج موافقة المؤسس صراحةً قبل إدراجه؛ الترقية الرئيسية ورفع Node وتطبيق allowlist الآلي (`.github/workflows/ci-build-guard.yml` غير موجود) واعية؛ التحقق الحي لحراسة `Host` ينتظر push.
- 2026-11-10 BLOCKED (P06-B): التفعيل التجريبي يحتاج نتيجة readiness PASS لكل منتج لنفس SHA/البيئة واعتماد الحصص/المدة/الاحتفاظ ونجاح P07–P11؛ لا صفوف جاهزية/حصة ولا مشغّل في أي بيئة؛ `0030` طُبق علىStagingفيT02 مع0031/0032 دون اعتمادجاهزيةأوحصص.
- 2026-11-11 BLOCKED T01: الخدمة العامة static_site/dist/client/pnpm؛ deploy `dep-dbpsb5ss728c738pbpmg` مطابق لـ`8a5f498`؛ app/health/API404 وكاش GET عام300ث؛ يحتاج تفويض نشر معزول وT02/T03، لا إعادة رفع مصدر P04.
- 2026-11-11 VERIFIED Render MCP يعمل قراءة في `tea-d7m59qbeo5us73ekdu80`؛ staging `srv-dbpj8jajnfac739je6lg` أعاد404 فيه؛ افحص workspace التاريخية `tea-dade102fngtc739064v0` قبل إنشاء بديل؛ يصحح unauthorized التاريخي.
- 2026-11-10 BLOCKED (P05): AU03/AU04 نجاحًا يحتاجان قناة P19؛ تحت runtime `createWorkspace`/`accept` يفشلان 503، ودعوات invited غير مرئية قبل bootstrap. 5 هويات staging اصطناعية بلا جلسات؛ حذفها يحتاج تفويضًا مستقلًا.
- 2026-11-10 INVARIANT: `healthCheckPath=/healthz/` في blueprint؛ نشر بلا DB/Auth صالحين لا يصبح healthy (مقصود). `AIGAS_HEALTH_AUTH_PROBE=true` هو الفحص الوحيد الذي يخرج من الخدمة.
- 2026-11-11 VERIFIED READONLY T02: production غيرمحمي31/RLS31/policies2/authenticated grants124؛runtime/ledgerغائبان؛snapshots=[]؛يوجدفرعp08-restore-20261110 التاريخي،لااستعادةحاليةمعتمدةلنافذةالتغيير؛لاكتابةإنتاج.
- 2026-11-10 VERIFIED: الفرع الحي على `0001`–`0012`+`0015` فقط؛ `aigas_ld_events_chain_guard` (دالة+trigger) غائب فسلسلة Ledger غير مفروضة في DB؛ يحتاج `0013`+`0024`.
- 2026-11-10 CLOSED B9: `0018`/`0025` لم تعد تفشل 42704 — حُرست بـ`to_regrole`، وكذلك `0028` الذي كشفه اختبار `client_roles_absent`. ثلاث hashes أصبحت `MODIFIED_AFTER_REFERENCE`؛ لم يتغيّر أي منح.
- 2026-11-10 TARGET: `aigas-staging`=`lucky-salad-43566291` / `br-rough-wind-bdkmg13n`، PG18.6، Neon Auth `better_auth` (9 جداول)، غير محمي (حد الخطة)، بلا scale-to-zero (412)، CU≤1، حصص مضبوطة.
- 2026-11-10 PREREQ: أي بيئة جديدة تفشل على `0001` بـ`3F000 schema "neon_auth" does not exist` إن لم تُهيّأ Neon Auth أولًا؛ متطلب غير موثق في migrations، يجب أن ينتقل إلى runbook النشر.
- 2026-11-10 GOTCHA: منصة Neon تمنح الأدوار المُنشأة `ADMIN TRUE/INHERIT FALSE/SET FALSE` من `cloud_admin` ⇒ `SET ROLE` يفشل 42501 رغم `pg_has_role`; يلزم `GRANT … WITH SET TRUE` **بعد** الترحيلات (يتكرر بعد كل `CREATE ROLE`). الإنتاج يستلمها من `neon_service` بـSET TRUE.
- 2026-11-10 INFO: بين `0018` و`0025` تُنشئ `0023` دالتي trigger تحصلان على `EXECUTE` لـPUBLIC (`authenticated_can_execute=true`)؛ `0025` تسحبهما. أي توقف عند `0024` يترك النافذة مفتوحة.
- 2026-11-10 VERIFIED: إعادة `0025` على `aigas_runtime` موجود تفشل `42501` عند `ALTER ROLE … NOSUPERUSER` بلا superuser؛ مسار `CREATE ROLE` الأول سليم. لا تُعدّل الترحيل المطبّق؛ أصلح في ملف لاحق/runbook.
- 2026-11-11 APPROVED CONDITIONAL T02: المالكاعتمدDataAPIخيارA(تعطيلالإنتاج)بشرطاستيفاءبوابةالاستعادة؛التنفيذNOT RUN؛productionمازالactive/public/anonymous/aggregates=true،Staging404؛HEAD3×400بلامتنليسإغلاقًا؛ `docs/DATA-API-EXPOSURE-DECISION.md`.
- 2026-11-10 BLOCKED (P13): لا وجهة معتمدة — Sentry صفر مشاريع، وPostHog مشروع واحد `720936` على حد الخطة (free، أحداث 0/1M) وإعداداته (IP غير مجهول/console/perf/retention12m) غير معتمدة؛ P21 بلا وثيقة URL؛ لا ingestion/تنبيهات (P22).
- 2026-11-10 OPEN: Bootstrap/RLS وtrial/purge وموافقات المزودين والـUAT ما زالت مفتوحة.

## Ledger (الأحدث أولًا)

## [2026-11-11] — T04: عمليات ممثلة وربط التصعيد
- **تم:** سدقبولمراجعةبـtenantمختلفوتمريرfingerprintداخلالمعاملة؛لافتحregistryأوتنفيذخارجي.
- **التحقق:** PASS unit7/PG18.6سيناريو1 لأربعةمنتجات؛Browser401×4؛Neonreadbackفقط؛الانحدارFAILقبلالإصلاح.
- **الحالة:** PARTIAL — محلي؛الفريقالمشتركوالـadapterوالنشرغيرمثبتة.
- **ملفات:** `Audit/t04-products-2026-11-11/REPORT.md`.

## [2026-11-11] — T03: bootstrap واستكشاف محدود
- **تم:** قناةمشغّل منفصلة بمعاملةوتدقيق؛منحتصفحلكلمنتج48hوحصةذرية،دونتزويرreadinessأوفتحChatsend؛export/close/purge-dry-runبلاحذف.
- **التحقق:** PASS محليPG18.6 — خدمات4وChatguard/مالكواحد/A→B/expiry/quota race/audit rollback؛unit12PASS؛BrowserجزئيKernel200/API401/returnTo،Authغيرمهيأ.
- **الحالة:** PARTIAL — مصدرومحلي؛لاNeonwritesأونشرأودعوات؛رحلةفريقمشتركةNOTRUN.
- **ملفات:** `Audit/t03-exploration-2026-11-11/REPORT.md`،`migrations/0033_aigas_exploration.sql`،`scripts/operator-exploration.mjs`.

## [2026-11-11] — T02: delta وruntime على Staging
- **تم:** resumeيتحققمنكلhash؛schema+receiptذريان؛إضافة0031للـdeltaو0032لقفلEXECUTEالجديد؛حفظ25وتطبيق3علىStagingدونإعادةبناء.
- **التحقق:** PASS — fresh28/delta29/negative12؛RLS74/contracts75/order5/build56؛NeonLOGIN34/34وledger28/28/no-op؛بياناتوأدوارالفحصنُظفت.
- **الحالة:** PARTIAL — local/Staging DONE؛Production unchanged؛DataAPI Aمعتمدبشرطاستعادةمثبتة،لاتعطيلبعد.
- **ملفات:** `Audit/t02-schema-rls-2026-11-11/REPORT.md`،`scripts/apply-migrations.mjs`،`migrations/0032_aigas_trial_trigger_execute_lock.sql`.
- **مفتوح:** Neonowner/DBAللاستعادةونافذةالإنتاج؛T03لـpermanent runtime pool/bootstrap؛Internal app NOT READY؛Public/Commercial NO-GO.

## [2026-11-11] — T01: مصالحة Node والكاش
- **تم:** توسيع دليل HTTP الخاص وGET/HEAD وتصحيح handoff؛ P04 محفوظ بلا نشر.
- **التحقق:** PASS — build56/runtime19؛ Auth الشبكي و403 وedge NOT RUN.
- **الحالة:** PARTIAL — نشر معزول بتفويض DevOps وDB/Auth منT02/T03.
- **ملفات:** `Audit/t01-node-ssr-2026-11-11/REPORT.md`.

## [2026-11-10] — P16: ثغرات الاعتماديات وتراخيصها (AR04)
- **تم:** جرد lockfile (v3، 429 مدخلًا) و`npm ci` exit 0؛ إزالة `packageManager: pnpm` و`engines.pnpm` لتعارضهما مع `package-lock.json` الوحيد.
- **تم:** ربط 12 advisory بمسارها وأثرها؛ إغلاق المسارين القابلين للاستغلال في `@astrojs/node` داخل `scripts/server.mjs` (Host منفذ مشوّه ⇒ 400 بدل 500، backslash خام ⇒ 400 بدل 301 protocol-relative) والتقاط رفض المعالجة.
- **التحقق:** PASS محليًا — runtime16/1skip، posture7/7، unit62، build56، routes56/117؛ الحرج AVIF غير قابل للوصول؛ YAML 11 استثناءً فريدًا.
- **الحالة:** AR04 DONE LOCAL؛ P16 PARTIAL — استثناء critical يحتاج موافقة المؤسس، والترقية الرئيسية وNode وpush وتطبيق allowlist الآلي واعية.
- **ملفات:** `Audit/p16-dependency-security-2026-11-10/REPORT.md`، `docs/DEPENDENCY-SECURITY-2026-11-10.md`، `scripts/verify-dependency-posture.mjs`.
- **مفتوح:** `astro ≥ 7.3.2` + `@astrojs/node ≥ 11.1.3` + Node `≥ 22.23.4`؛ تحقق حي بعد push.

## [2026-11-10] — P14: روابط SEO وCanonical والفهرسة
- **تم:** فهرسة `/kernel/` وإدخالها الخريطة وllms (56 صفحة)؛ إزالة noindex المرتبط بالاستعلام الحساس؛ datePublished+image لكل Article من تواريخ المنشأ الحقيقية.
- **تم:** إصلاح حد الزحف العام في `verify-routes` (app/auth/healthz غير عامة) وحراسة أن `/auth/*` هو noindex الوحيد المتبقي.
- **التحقق:** PASS محليًا — build56، routes56، 117 redirect، 2945 مرجعًا، 0 loop/chain/مكسور/noindex عام، negative 400/404/503.
- **الحالة:** PARTIAL — SE01–SE03 PASS محليًا، SE04 محليًا ونشرُه BLOCKED على push، SE05/SE06 إلى P25.
- **ملفات:** `Audit/p14-seo-links-2026-11-10/REPORT.md`، `scripts/verify-routes.mjs`، `src/data/structured-data.ts`.
- **مفتوح:** التحقق الحي بعد نشر المالك؛ بقاء `/app` و`/auth` و`/404` و`/healthz` غير مفهرسة بقرار صلاحيات لا SEO.

## [2026-11-10] — P13: عقد المراقبة والحمولة
- **تم:** مسودة URL/referrer غير معتمدة؛ معاينة payload واختبارات محولات محلية؛ لا دليل منع تسرب GA4.
- **التحقق:** PASS محليًا — 15/15، 70 اختبارًا (61 PASS/9 SKIP)، build55، 55/55 مسارًا، relay 403/415/413/400/429؛ وجهة/إرسال NOT RUN.
- **الحالة:** PARTIAL — الوجهة والاعتماد وP21 وingestion مفتوحة؛ لا commit/push.
- **ملفات:** `Audit/p13-observability-2026-11-10/REPORT.md`، `src/server/observability/url-policy.mjs`، `tests/observability.test.mjs`.
- **مفتوح:** اختيار/ترقية وجهة Sentry وPostHog، اعتماد الحمولة والإعدادات، P21.

## [2026-11-10] — P12: رحلة المنتجات وتصميم القسم
- **تم:** روابط التفاصيل والدخول والعودة والتواصل؛ returnTo محصور ويعتمد قرار Dashboard؛ لا شارات إتاحة عامة بتوجيه المستخدم.
- **تم:** قسم تحريري متجاوب ورسوم SVG وتفاعل مؤشر وكشف نصوص؛ لا اعتماديات إنتاج جديدة ولا تغيير للهيدر/Constellation.
- **التحقق:** PASS محليًا — unit17، build55/routes55، Chrome بأربعة مقاسات وreduced-motion/no-JS؛ تحذير native view-transition موثق.
- **الحالة:** DONE LOCAL للربط والتصميم؛ PARTIAL للرحلة المخولة وعمليات Trial/Nشر؛ لا تفعيل أو كتابة خارجية.
- **ملفات:** `Audit/p12-product-journey-2026-11-10/REPORT.md`.

## [2026-11-10] — P09: Human Gate محليًا
- **تم:** إصلاح فحص التفويض تحت runtime وتصنيف تغير هدف rename؛ استهلاك permit والأثر والتدقيق في معاملة واحدة.
- **التحقق:** PASS محليًا على PG18.6 — 6/6، سباق تنفيذ وreadback ورفض وتراجع؛ Auth/Browser/Neon/runtime منشور NOT RUN.
- **الحالة:** PARTIAL؛ الاعتمادات والقبول والإطلاق غير مثبتة؛ `Audit/p09-human-gate-2026-11-10/REPORT.md`.

## [2026-11-10] — P06-A: دورة Trial الخادمية وقناة المشغّل
- **تم:** `0030` (مشغّلون، جاهزية لكل منتج/إصدار/بيئة، حصص معتمدة، RLS لكل فعل) + خدمة الطلب/المراجعة/القرار/التفعيل المغلق/الانتهاء + API وصفحة مشغّل.
- **تم:** التفعيل يرفض بلا جاهزية/حصة/إقرار، ويُعاد فرضه بـtrigger؛ دور المؤسسة لا يكتب قرارًا أو حدث `OPERATOR`.
- **التحقق:** PASS محليًا على PG18.6 — contracts46/46، `0030` في rehearsal fresh+delta، build55، routes55؛ readback staging: 25 مطبقًا و`0030=0` و0023 موجود.
- **الحالة:** P06-A DONE LOCAL؛ P06-B BLOCKED (P07–P11 والحصص/الاحتفاظ).
- **ملفات:** `migrations/0030_aigas_trial_server_cycle.sql`، `src/server/kernel/trial-service.mjs`، `Audit/p06-trial-2026-11-10/REPORT.md`.
- **مفتوح:** تطبيق `0030` على بيئة معتمدة، اعتماد الحصص/الاحتفاظ، وتفعيل بعد readiness — كلها تحتاج تفويضًا مستقلًا.

## [2026-11-10] — P05: Auth والعضويات والسياسات
- **تم:** إصلاح قفل العضوية الذاتية عبر `aigas_lock_member` في `manageMember`/`policies`، ورفض self-role/revoke قبل القراءة، وتغليف 42501 في `createWorkspace`.
- **تم:** 3 ملفات اختبار (unit/runtime/invitation) وتوسيع harness العقود إلى 7 قواعد معزولة.
- **التحقق:** PASS محليًا — contracts42/42، build55؛ PASS حي على staging — Auth signup/login/restore/revoke وJWT EdDSA، 0 جلسات/0 tenants.
- **الحالة:** PARTIAL — AU03/AU04 الحي BLOCKED حتى P19.
- **ملفات:** `Audit/p05-auth-identity-2026-11-10/REPORT.md`، `tests/identity*.test.mjs`.

## [2026-11-10] — إزالة ربط Experiential Labs من OpenCode
- **تم:** حذف `providers.explabs` وملف `secrets/explabs-api-key`، وإعادة `opencode.json` لحالة ما قبل الربط؛ `opencode.jsonc` بلا أي مدخل Experiential Labs.
- **التحقق:** PASS — الإعداد مطابق للنسخة الاحتياطية (880B، مفاتيح `$schema/mcp/plugin` فقط)، و`opencode models` بلا `explabs`.
- **الحالة:** DONE — لا أثر للاتصال.

## [2026-11-10] — P04: readiness وتتبع الإصدار لخدمة Node
- **تم:** `/healthz/` عام (200/503؛ DB/schema/auth/portal؛ `no-store`/`noindex`) وخارج بوابة `/app`، و`version.json`+readback لـservice/deploy/SHA/digest مع `consistent`.
- **تم:** `healthCheckPath`→`/healthz/`، وتصنيف `AUTH_SETUP_REQUIRED`/`DB_SETUP_REQUIRED` كـ`not configured` بدل «متاح مؤقتًا».
- **التحقق:** PASS محليًا — 15/15 runtime، build55، unit31/5skip/0fail، routes 55/0 كسر؛ المسار المشفر والبوابة و401/503 وفشل DB/Auth مقيسة بلا شبكة.
- **تم:** خدمة `brightai-staging-node` (free/oregon، بلا دومين) وأول نشر كشف استماع loopback فأُصلح افتراضي `HOST=0.0.0.0`.
- **الحالة:** PARTIAL — الخدمة غير live حتى push المالك؛ OP04 ما زال P18.
- **ملفات:** `Audit/p04-node-ssr-2026-11-10/REPORT.md`، `src/server/kernel/readiness.mjs`، `docs/APP-PORTAL-RUNTIME-HANDOFF.md`.
- **مفتوح:** push ثم تحقق حي، وضبط DB/Auth ثم تحويل `healthCheckPath` إلى `/healthz/`.

## [2026-11-10] — P03: Runtime RLS وData API
- **تم:** سكربت مصفوفة RLS (69 فحصًا على PG18 مؤقت) وسكربت لقطة قراءة فقط؛ مصفوفة صلاحيات وقرار Data API A/B/C.
- **التحقق:** PASS — DB04–DB07 محليًا 69/69؛ staging 9/9 كتالوج؛ contracts36/36؛ صفر كتابة/منح/تغيير على Neon.
- **الحالة:** DONE للمعزول والقراءة؛ PARTIAL لـcutover وbootstrap وإغلاق Data API.
- **ملفات:** `Audit/p03-runtime-rls-2026-11-10/REPORT.md`، `docs/RUNTIME-RLS-PERMISSION-MATRIX.md`، `scripts/verify-runtime-rls.mjs`.
- **مفتوح:** F1 `ALTER ROLE … NOSUPERUSER`؛ ELSE CRUD على 7 جداول؛ Data API `public`؛ bootstrap P05.

## [2026-11-10] — B9: تحصين 0018/0025/0028 وإعادة بناء الهدف
- **تم:** استبدال كل `REVOKE … FROM authenticated/anonymous` غير المحروس بـ`IF to_regrole(...)` في ثلاثة ملفات، بلا تغيير أي منح.
- **تم:** مرحلة rehearsal جديدة `client_roles_absent` تُسقط الدورين فعليًا وتبني 25/25؛ كشفت `0028` بنفس العيب فأُصلح.
- **التحقق:** PASS — 4 مراحل (25/25، 20/20+6، 26/26، 25/25) و10/10 سلبي؛ أُعيد بناء staging فطابقت ledger hashes ومجموع الأوضاع، ثم 8/8 posture و0 صفوف.
- **الحالة:** DONE؛ لم يُلمس الإنتاج، و`0018`/`0025` ما زالا غير مطبقين عليه.
- **ملفات:** `migrations/0025_aigas_tenant_isolation_closure.sql`، `scripts/db-migration-rehearsal.mjs`، `Audit/p02-staging-parity-2026-11-10/REPORT.md`.
- **مفتوح:** `ELSE`fail-open في0025؛ نافذةPUBLIC بين0018/0025؛ حماية الفرع/scale-to-zero؛ `delta` على Neon؛ استعادةP17.

## [2026-11-10] — P02: بناء staging معزول وتطبيق 25 ترحيلًا والتحقق
- **تم:** rehearsal محلي (fresh25/25، delta26/26، 9/9 سلبي) ثم بناء هدف Neon الحقيقي: Neon Auth أولًا ثم 25/25 `APPLIED` + ledger `ops.`.
- **تم:** `capture-catalog.mjs` و`verify-target-posture.mjs` جديدان؛ قياس parity (`PARITY`) و8 فحوص سلوكية (8/8) على الهدف، كلها داخل transactions مُلغاة، وصفر صفوف متبقية.
- **التحقق:** PASS على الهدف — `authenticated` لا يقرأ جدولًا ولا ينفّذ الدالة (42501)، `aigas_runtime` بلا فعل على المتن ويرى 0 صفوف بلا نطاق، chain guard يرفض ربطًا مزوّرًا (P0001).
- **الحالة:** DONE للنطاق المعزول؛ `PASS ≠ RELEASED`، والإنتاج لم يُلمس.
- **ملفات:** `Audit/p02-staging-parity-2026-11-10/REPORT.md`، `scripts/apply-migrations.mjs`، `scripts/capture-catalog.mjs`.
- **مفتوح:** تحصين`0018`/`0025` بـ`to_regrole` (يغيّر hashين)؛ `ELSE`fail-open في0025؛ حماية الفرع/scale-to-zero مدفوعة؛ `delta` على Neon؛ استعادةP17؛ مصير هدف staging بعد الإغلاق.

## [2026-11-10] — إغلاق عقود الوحدة وتكامل DB18 محليًا
- **تم:** تصحيحfixtures والعقود، Human Gate list، Risk shadowing/audit mapping، وقفلRLS محدود ومرجعLedgernull؛ لا تخفيفguards أو كتابة خارجية.
- **التحقق:** PASS — unit31/combined36،0 FAIL/0 SKIP؛ خمسDB18 بدورruntime؛ عزل/رفض/سباقات/rollback وLedgerCLI؛ build/routes55 PASS.
- **الحالة:** DONE LOCAL — لاRuntime/Approval/Release؛ P16خارج النطاق.
- **ملفات:** `Audit/ar02-ar03-2026-11-10/REPORT.md`، `scripts/verify-contracts-local.mjs`، `docs/KERNEL-DEVELOPMENT.md`.
- **مفتوح:** مراجعة وترحيل0028/0029 على هدف معتمد مستقلًا؛ bootstrap وبقية مساراتRLS غير مغطاة بهذا الإغلاق.

## [2026-11-10] — تدقيق 360 ومصفوفة أدلة حالية
- **تم:** إثبات Render static/deploy/SHA بقراءة MCP بعد اختيار المستخدم؛ جرد Neon والمراقبة وزحف55 صفحة؛ مصفوفة76 متطلبًا ومواصفات تجربة و15 برومبت إغلاق.
- **التحقق:** build PASS؛ unit18 PASS/9 FAIL/5 SKIP؛ guard8/8 LOCAL PASS؛ routes FAIL عند assertion analytics قديم؛ لا E2E/DB writes/provider/deploy.
- **الحالة:** DONE للتدقيق ضمن حدوده؛ المنتجات/Beta/Commercial BLOCKED؛ النسب مؤشرات أدلة أولية لا موافقات إطلاق.
- **ملفات:** `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`.
- **مفتوح:** SSR معزول وparity/runtime RLS وbootstrap/trial lifecycle/purge وموافقات AI/خصوصية واستعادة وUAT؛ .env بقيت ignored/untracked وصلاحيتها600 دون تغيير قيم.

## [2026-11-10] — استكمال المراقبة المحلية
- **تم:** تنقيح بقوائم ثابتة بلا stack، ربط إشارات الواجهة ونتائج الدخول، استقلال موافقة analytics، وتوثيق alert/on-call كمسودة بلا وجهات.
- **التحقق:** قراءة MCP ومراجعة المصدر/diff فقط؛ test/build/lint/typecheck/Playwright/إرسال أحداث NOT RUN حسب الطلب.
- **الحالة:** PARTIAL — SOURCE_PRESENT؛ CONFIGURED/RUNTIME_VERIFIED/APPROVED غير مثبتة؛ G8/G9 دون ترقية.
- **ملفات:** `docs/MONITORING-AND-ANALYTICS-WIRING.md`، `docs/beta/MONITORING-READONLY-STATUS-2026-11-10.md`.
- **مفتوح:** المالك طلب مشروع PostHog جديد؛ لم يُحاول الإنشاء لبلوغ السعة، ولا ترقية مدفوعة أو تعديل للموجود.
