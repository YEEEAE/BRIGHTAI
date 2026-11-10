# Project Mind — BRIGHTAI / AIGAS

## Current State
- 2026-11-10 VERIFIED LOCAL: HEAD `60777c9739d5584360e57bd5238d3a075b06c09a` + working tree؛ AR02/AR03 (مقيسة على `5725727`): unit31/combined36 PASS،0 FAIL/0 SKIP؛ DB18.6 بخمس قواعد ودورruntime/NOBYPASSRLS؛ build/routes55 PASS؛ مرجع `Audit/ar02-ar03-2026-11-10/REPORT.md`؛ لا إطلاق.
- 2026-11-10 VERIFIED STAGING `lucky-salad-43566291`/`br-rough-wind-bdkmg13n`/`neondb` (بُني مرتين؛ الثاني بعد تحصين B9): 25/25 APPLIED، ledger hashes == repo، 36 جدولًا/RLS36/FORCE2/77 سياسة/25 دالة، 0 منح لـ`authenticated`/`anonymous`، `aigas_runtime` NOBYPASSRLS بـ34 منحة وصفر على جداول المتن، chain guard+append_only+no_truncate، 9 جداول `neon_auth`، 0 صفوف؛ parity=`PARITY`، posture 8/8.
- العقد المحلي يتطلب `0028` لقفل العضوية/المنح دون صلاحيات تعديل إضافية، و`0029` لمنع مرجعLedger الاصطناعيnull؛ طُبقتا ضمن 25/25 على staging المعزول؛ أي تطبيق على الإنتاج يحتاج مراجعة وتفويضًا مستقلًا.
- التقرير له قارئHTML مستقل دون شبكة: `Audit/final-360-2026-11-10/FINAL-360-AUDIT.html`؛ يولد بـbuild-report.mjs؛76 متطلبًا و25 برومبتًا؛ Chromium360/390/768/1440 والبحث/النسخ/CSV وتهيئة الطباعة PASS؛ بيانات التدقيق لم تتغير.
- توجيه المستخدم2026-11-10: لا سقف15 لبرومبتات الإغلاق؛ الخطة الحالية25 بتقسيم تخصصي وتبعيات مفحوصة في `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`؛ أرقام التدقيق وNO-GO دون تغيير.
- 2026-11-10 HISTORICAL LIVE CHECK: SHA `7b1f533f71c7b1f41884790366a4d5967c85a87b` طابق Render deploy `dep-dbpg8kgae00c73easjr0`؛ الخدمة `srv-d7m5bcjbc2fs73826v20` static_site/dist/client وapp/Auth/API404؛ لم يُعد فحصها بجولةAR02/AR03؛ Beta/Commercial NO-GO.
- تدقيق360 تاريخي: tests18 PASS/9 FAIL/5 SKIP تجاوزتها نتائجAR02/AR03 المحلية أعلاه؛ Firewall harness8/8 و55 صفحة حية200 دليل مؤرخ في `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، دون عمليات منتج حية مثبتة.
- المراقبة: اعتماد مستقل لكل طبقة + SHA كامل؛ PostHog staging/beta فقط؛ واجهة App/Auth ترسل رموزًا ثابتة عبر same-origin relay؛ لا SDK أو stack؛ خطة التحقق O1–O8 غير منفذة.

## Open Issues / Blockers
- 2026-11-10 VERIFIED: Neon production وحيد غير محمي؛ 31 جدولًا/RLS31/سياسات2/FORCE0؛ runtime role وmigration ledger غائبان؛ لا استعادة مقاسة.
- 2026-11-10 VERIFIED: الفرع الحي على `0001`–`0012`+`0015` فقط؛ `aigas_ld_events_chain_guard` (دالة+trigger) غائب فسلسلة Ledger غير مفروضة في DB؛ يحتاج `0013`+`0024`.
- 2026-11-10 CLOSED B9: `0018`/`0025` لم تعد تفشل 42704 — حُرست بـ`to_regrole`، وكذلك `0028` الذي كشفه اختبار `client_roles_absent`. ثلاث hashes أصبحت `MODIFIED_AFTER_REFERENCE`؛ لم يتغيّر أي منح.
- 2026-11-10 TARGET: `aigas-staging`=`lucky-salad-43566291` / `br-rough-wind-bdkmg13n`، PG18.6، Neon Auth `better_auth` (9 جداول)، غير محمي (حد الخطة)، بلا scale-to-zero (412)، CU≤1، حصص مضبوطة.
- 2026-11-10 PREREQ: أي بيئة جديدة تفشل على `0001` بـ`3F000 schema "neon_auth" does not exist` إن لم تُهيّأ Neon Auth أولًا؛ متطلب غير موثق في migrations، يجب أن ينتقل إلى runbook النشر.
- 2026-11-10 GOTCHA: منصة Neon تمنح الأدوار المُنشأة `ADMIN TRUE/INHERIT FALSE/SET FALSE` من `cloud_admin` ⇒ `SET ROLE` يفشل 42501 رغم `pg_has_role`; يلزم `GRANT … WITH SET TRUE` **بعد** الترحيلات (يتكرر بعد كل `CREATE ROLE`). الإنتاج يستلمها من `neon_service` بـSET TRUE.
- 2026-11-10 INFO: بين `0018` و`0025` تُنشئ `0023` دالتي trigger تحصلان على `EXECUTE` لـPUBLIC (`authenticated_can_execute=true`)؛ `0025` تسحبهما. أي توقف عند `0024` يترك النافذة مفتوحة.
- Sentry projects=[] ضمن الاتصال؛ PostHog720936 ingested_event=false وإعدادات خصوصية تحتاج مراجعة؛ لا وجهة معتمدة، وحد الخطة التاريخي لم يُعد التحقق منه. Bootstrap/RLS وtrial/purge وموافقات المزودين والـUAT ما زالت مفتوحة.

## Ledger (الأحدث أولًا)

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

