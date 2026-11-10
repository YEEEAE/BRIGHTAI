# Project Mind — BRIGHTAI / AIGAS

## Current State
- 2026-11-10 VERIFIED LOCAL (P12): تنقل موحد للمنتجات وreturnTo بقائمة سماح؛ الكتالوج بلا شارات إتاحة بتوجيه المستخدم، بتصميم تحريري ورسوم وحركة تدريجية؛ build55/routes55/unit17 وChrome360/390/768/1440 وreduced-motion/no-JS PASS؛ الرحلة المخولة والعمليات/الحصص والنشر NOT VERIFIED؛ `Audit/p12-product-journey-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL+STAGING-READONLY (P03): HEAD `9f70334`؛ مصفوفة RLS 69/69 محليًا (owner0 لـruntime، صفر منح عميل، A/B CRUD، GUC، COPY، DB07)؛ staging 9/9 قراءة (36 جدول/77 سياسة/25 دالة)؛ contracts36/36؛ دليل `Audit/p03-runtime-rls-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL: HEAD `60777c9739d5584360e57bd5238d3a075b06c09a` + working tree؛ AR02/AR03 (مقيسة على `5725727`): unit31/combined36 PASS،0 FAIL/0 SKIP؛ DB18.6 بخمس قواعد ودورruntime/NOBYPASSRLS؛ build/routes55 PASS؛ مرجع `Audit/ar02-ar03-2026-11-10/REPORT.md`؛ لا إطلاق.
- 2026-11-10 VERIFIED STAGING `lucky-salad-43566291`/`br-rough-wind-bdkmg13n`/`neondb` (بُني مرتين؛ الثاني بعد تحصين B9): 25/25 APPLIED، ledger hashes == repo، 36 جدولًا/RLS36/FORCE2/77 سياسة/25 دالة، 0 منح لـ`authenticated`/`anonymous`، `aigas_runtime` NOBYPASSRLS بـ34 منحة وصفر على جداول المتن، chain guard+append_only+no_truncate، 9 جداول `neon_auth`، 0 صفوف؛ parity=`PARITY`، posture 8/8.
- العقد المحلي يتطلب `0028` لقفل العضوية/المنح دون صلاحيات تعديل إضافية، و`0029` لمنع مرجعLedger الاصطناعيnull؛ طُبقتا ضمن 25/25 على staging المعزول؛ أي تطبيق على الإنتاج يحتاج مراجعة وتفويضًا مستقلًا.
- التقرير له قارئHTML مستقل دون شبكة: `Audit/final-360-2026-11-10/FINAL-360-AUDIT.html`؛ يولد بـbuild-report.mjs؛76 متطلبًا و25 برومبتًا؛ Chromium360/390/768/1440 والبحث/النسخ/CSV وتهيئة الطباعة PASS؛ بيانات التدقيق لم تتغير.
- توجيه المستخدم2026-11-10: لا سقف15 لبرومبتات الإغلاق؛ الخطة الحالية25 بتقسيم تخصصي وتبعيات مفحوصة في `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`؛ أرقام التدقيق وNO-GO دون تغيير.
- 2026-11-10 VERIFIED LOCAL (P06-A): HEAD `7d7be00`+working tree؛ دورة Trial خادمية بقناة مشغّل وبوابة جاهزية/حصة؛ contracts46/46، `0030` fresh+delta، build/routes55؛ التفعيل مغلق وP06-B BLOCKED؛ `Audit/p06-trial-2026-11-10/REPORT.md`.
- 2026-11-10 HISTORICAL LIVE CHECK: SHA `7b1f533f71c7b1f41884790366a4d5967c85a87b` طابق Render deploy `dep-dbpg8kgae00c73easjr0`؛ الخدمة `srv-d7m5bcjbc2fs73826v20` static_site/dist/client وapp/Auth/API404؛ لم يُعد فحصها بجولةAR02/AR03؛ Beta/Commercial NO-GO.
- تدقيق360 تاريخي: tests18 PASS/9 FAIL/5 SKIP تجاوزتها نتائجAR02/AR03 المحلية أعلاه؛ Firewall harness8/8 و55 صفحة حية200 دليل مؤرخ في `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، دون عمليات منتج حية مثبتة.
- 2026-11-10 VERIFIED LOCAL (P04): HEAD `655a8b9` (ملفاتP04 مطابقة للمرجع `7b1f533`)؛ `/healthz/` عام 200/503 يفحص DB/schema/auth/portal بلا أسرار، و`dist/server/version.json`+readback يربطان service/deploy/SHA/artifact مع `consistent`؛ `healthCheckPath=/healthz/`؛ دليل `Audit/p04-node-ssr-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL+LIVE (P05): HEAD `7954bb6f` + working tree؛ إصلاح قفل الفاعل في `manageMember`/`policies` عبر `aigas_lock_member` ورفض self-role/revoke مبكرًا وتغليف 42501 في `createWorkspace`؛ contracts42/42 وbuild55 PASS؛ live Auth staging PASS (signup/login/restore/sign-out؛ JWT EdDSA/iss/ttl900؛ 5 هويات اصطناعية/0 جلسات/0 tenants)؛ دليل `Audit/p05-auth-identity-2026-11-10/REPORT.md`.
- 2026-11-10 STAGING FREE (Render): `brightai-staging-node`=`srv-dbpj8jajnfac739je6lg` خطة free/oregon، auto-deploy من `main`، بلا دومين؛ كشف أول نشر أن `scripts/server.mjs` يستمع على loopback ⇒ صار الافتراضي `0.0.0.0`. الخدمة المرجعية `srv-d7m5bcjbc2fs73826v20` ليست في workspace الـCLI (`tea-dade102fngtc739064v0`).
- المراقبة: اعتماد مستقل لكل طبقة + SHA كامل؛ PostHog staging/beta فقط؛ واجهة App/Auth ترسل رموزًا ثابتة عبر same-origin relay؛ لا SDK أو stack؛ خطة التحقق O1–O8 غير منفذة.

## Open Issues / Blockers
- 2026-11-10 BLOCKED (P06-B): التفعيل التجريبي يحتاج نتيجة readiness PASS لكل منتج لنفس SHA/البيئة واعتماد الحصص/المدة/الاحتفاظ ونجاح P07–P11؛ لا صفوف جاهزية/حصة ولا مشغّل في أي بيئة، و`0030` غير مطبق خارجيًا.
- 2026-11-10 BLOCKED (P04): تغييرات P04+إصلاح الربط غير مرفوعة؛ `push` ممنوع على الوكيل ⇒ خدمة `brightai-staging-node` لم تصبح live بعد. بعد push المالك تُثبت الحالات الحية.
- 2026-11-10 BLOCKED (P04): Render MCP غير مخوّل (`list_workspaces`=`unauthorized`) — الوصول عبر CLI/لوحة فقط؛ قراءة `static_site` المرجعية تبقى HISTORICAL وليست في workspace الـCLI.
- 2026-11-10 BLOCKED (P05): AU03/AU04 نجاحًا يحتاجان قناة P19؛ تحت runtime `createWorkspace`/`accept` يفشلان 503، ودعوات invited غير مرئية قبل bootstrap. 5 هويات staging اصطناعية بلا جلسات؛ حذفها يحتاج تفويضًا مستقلًا.
- 2026-11-10 INVARIANT: `healthCheckPath=/healthz/` في blueprint؛ نشر بلا DB/Auth صالحين لا يصبح healthy (مقصود). `AIGAS_HEALTH_AUTH_PROBE=true` هو الفحص الوحيد الذي يخرج من الخدمة.
- 2026-11-10 VERIFIED: Neon production وحيد غير محمي؛ 31 جدولًا/RLS31/سياسات2/FORCE0؛ runtime role وmigration ledger غائبان؛ لا استعادة مقاسة.
- 2026-11-10 VERIFIED: الفرع الحي على `0001`–`0012`+`0015` فقط؛ `aigas_ld_events_chain_guard` (دالة+trigger) غائب فسلسلة Ledger غير مفروضة في DB؛ يحتاج `0013`+`0024`.
- 2026-11-10 CLOSED B9: `0018`/`0025` لم تعد تفشل 42704 — حُرست بـ`to_regrole`، وكذلك `0028` الذي كشفه اختبار `client_roles_absent`. ثلاث hashes أصبحت `MODIFIED_AFTER_REFERENCE`؛ لم يتغيّر أي منح.
- 2026-11-10 TARGET: `aigas-staging`=`lucky-salad-43566291` / `br-rough-wind-bdkmg13n`، PG18.6، Neon Auth `better_auth` (9 جداول)، غير محمي (حد الخطة)، بلا scale-to-zero (412)، CU≤1، حصص مضبوطة.
- 2026-11-10 PREREQ: أي بيئة جديدة تفشل على `0001` بـ`3F000 schema "neon_auth" does not exist` إن لم تُهيّأ Neon Auth أولًا؛ متطلب غير موثق في migrations، يجب أن ينتقل إلى runbook النشر.
- 2026-11-10 GOTCHA: منصة Neon تمنح الأدوار المُنشأة `ADMIN TRUE/INHERIT FALSE/SET FALSE` من `cloud_admin` ⇒ `SET ROLE` يفشل 42501 رغم `pg_has_role`; يلزم `GRANT … WITH SET TRUE` **بعد** الترحيلات (يتكرر بعد كل `CREATE ROLE`). الإنتاج يستلمها من `neon_service` بـSET TRUE.
- 2026-11-10 INFO: بين `0018` و`0025` تُنشئ `0023` دالتي trigger تحصلان على `EXECUTE` لـPUBLIC (`authenticated_can_execute=true`)؛ `0025` تسحبهما. أي توقف عند `0024` يترك النافذة مفتوحة.
- 2026-11-10 VERIFIED: إعادة `0025` على `aigas_runtime` موجود تفشل `42501` عند `ALTER ROLE … NOSUPERUSER` بلا superuser؛ مسار `CREATE ROLE` الأول سليم. لا تُعدّل الترحيل المطبّق؛ أصلح في ملف لاحق/runbook.
- 2026-11-10 VERIFIED: Data API على production `active` و`db_schemas=["public"]` (`anonymous`, aggregates=true)؛ staging بلا Data API؛ الإغلاق يحتاج تفويض control plane (خيار A/B في `docs/DATA-API-EXPOSURE-DECISION.md`).
- Sentry projects=[] ضمن الاتصال؛ PostHog720936 ingested_event=false وإعدادات خصوصية تحتاج مراجعة؛ لا وجهة معتمدة، وحد الخطة التاريخي لم يُعد التحقق منه. Bootstrap/RLS وtrial/purge وموافقات المزودين والـUAT ما زالت مفتوحة.

## Ledger (الأحدث أولًا)

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

