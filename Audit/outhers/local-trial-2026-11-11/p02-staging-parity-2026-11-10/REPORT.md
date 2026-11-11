# P02 — Staging وParity وLedger الترحيلات: دليل التنفيذ

> **التاريخ:** 2026-11-10 · **HEAD:** `60777c9739d5584360e57bd5238d3a075b06c09a` · **المرجع:** `7b1f533f71c7b1f41884790366a4d5967c85a87b`
> **هدف التنفيذ المعزول:** Neon `lucky-salad-43566291` (`aigas-staging`) / `br-rough-wind-bdkmg13n` / `neondb` — PG 18.6 · `aws-us-east-2` · CU 0.25–1.
> **البيئة المقروءة للمقارنة:** Neon `young-frog-60183055` / `br-young-bird-b43proeb` / `neondb` — **SELECT فقط**.
> **لم يُنفَّذ:** أي migration أو تغيير على `production`، أي snapshot/restore، أي commit/push/نشر، أي عملية مدفوعة.
> **الحالة:** `PASS` على الهدف المعزول — 25/25 ترحيل (أُعيد بناؤه بعد تحصين B9)، parity = `PARITY`، posture = 8/8، صفر صفوف بيانات. **`PASS ≠ RELEASED`**؛ Beta/Commercial ما زالا `NO-GO`، واستعادة P17 بوابة منفصلة.

الملفات المرافقة: `rehearsal.json` (الدليل الخام المحلي)، `staging-catalog.json` (كتالوج الهدف الحقيقي + ledger + العضويات)، `parity-target.json` (فرق الهدف مقابل rehearsal)، `staging-posture.json` (8 فحوص سلوكية على الهدف)، `live-catalog.json` (لقطة القراءة للإنتاج)، `parity.json` (فرق الإنتاج)، `migration-ledger.json` (hashes وحالة كل ملف).
الخطة: `docs/beta/STAGING-MIGRATION-REHEARSAL-PLAN-2026-11-10.md`.

---

## 1. أوامر التنفيذ

```bash
# 1) rehearsal محلي معزول + ledger + حراس + حالات سلبية
P02_REF_SHA=7b1f533f71c7b1f41884790366a4d5967c85a87b \
  node scripts/db-migration-rehearsal.mjs \
  --json Audit/p02-staging-parity-2026-11-10/rehearsal.json

# 2) التطبيق على الهدف المعزول (القيمة تُقرأ من ملف مستبعد من git، ولا تُطبع)
node --env-file=.env.staging.local scripts/apply-migrations.mjs --mode fresh --bootstrap-client-roles

# 3) التقاط كتالوج الهدف (SELECT فقط)
node --env-file=.env.staging.local scripts/capture-catalog.mjs \
  --out Audit/p02-staging-parity-2026-11-10/staging-catalog.json --label "lucky-salad-43566291 / br-rough-wind-bdkmg13n / neondb"

# 4) فحوص السلوك على الهدف (كل فحص داخل transaction يُلغى)
node --env-file=.env.staging.local scripts/verify-target-posture.mjs

# 5) الفرق بين الهدف والـrehearsal، وبين الإنتاج والـrehearsal
node scripts/db-parity-diff.mjs --expected …/rehearsal.json --actual …/staging-catalog.json --json …/parity-target.json
node scripts/db-parity-diff.mjs --expected …/rehearsal.json --actual …/live-catalog.json    --json …/parity.json
```

`migration-ledger.json` يُشتق آليًا بعد أي تغيير في `migrations/`: `sha256` لنسخة working tree مقابل `sha256` للمرجع `7b1f533` عبر `git show`، مع حالة `live` المشتقة من الكتالوج وحالة كل مرحلة من `rehearsal.json`. المراحل الأربع في الـrehearsal (`fresh`, `guards`, `delta`, `client_roles_absent`) كلها في تشغيل واحد.

`db-migration-rehearsal.mjs` ينشئ cluster خاصًا (unix socket فقط)، ويعيد تشكيل صلاحيات `neondb_owner` كما هي حيًّا (`NOSUPERUSER BYPASSRLS CREATEROLE`، عضو `authenticated`/`anonymous`/`neon_auth`/`neon_superuser`)، ويعيد إنشاء default ACL الذي يمنح `authenticated` تلقائيًا. بدون هذه المحاكاة تصبح سحوب `0018`/`0025` no-op غير مختبرة.

---

## 2. النتائج

### 2.1 الـrehearsal المحلي

| المرحلة | الملفات | النتيجة |
|---|---|---|
| `fresh` (هدف جديد من `migrations/`) | 25 | **25/25 APPLIED** |
| `delta` (محاكاة الفرع الحي ثم الإغلاق) | 26 | **26/26 APPLIED** |
| `guards` (توقف قبل `0025`) | 20 | **20/20 APPLIED** ثم استكمال 6 |
| `client_roles_absent` (بلا `authenticated`/`anonymous` — B9) | 25 | **25/25 APPLIED** |
| الحالات السلبية | 10 | **10/10 ok** |
| **النتيجة العامة** | — | **`PASS`** |

### 2.2 الحالات السلبية — الرفض الفعلي

| الحالة | النتيجة | الرسالة |
|---|---|---|
| `0027` قبل `0025` | ✅ مرفوض | `P0001 0027 requires 0025 (aigas_client_deny policy is missing)` |
| `0019` بعد `0025` | ✅ مرفوض | `P0001 0019 is superseded by 0025 and must not be applied after it` |
| `0018` بعد `0025` | ✅ مرفوض | `P0001 0018 is superseded by 0025; apply 0018 before 0025 only` |
| إعادة `0016` | ✅ مرفوض | `42723 function "aigas_sc_usage_window_v2" already exists` |
| إعادة `0017` | ✅ مرفوض | `42701 column "correlation_id" ... already exists` |
| إعادة `0029` | ✅ مرفوض | `42710 constraint "aigas_ld_synthetic_reference_required" ... already exists` |
| إعادة `0013` | ✅ **مقبول** | idempotent بـ`DROP CONSTRAINT IF EXISTS` |
| chain guard: قفزة `sequence_no=5` بلا أب | ✅ مرفوض | `P0001 Ledger sequence gap or wrong previous hash` |
| chain guard: genesis سليم (`sequence_no=1`, `previous_hash=NULL`) | ✅ مقبول | لا خطأ — الحارس ليس معطّلًا |
| `EXECUTE` لـ`aigas_sc_usage_window_v2` بعد `0025` | ✅ مسحوب | `authenticated=false`, `anonymous=false` |
| تركيب كامل بلا `authenticated`/`anonymous` (B9) | ✅ 25/25 | 36 جدولًا، 77 سياسة، `aigas_runtime` موجود، 25 صف ledger |

زوج الـchain guard مقصود: رفض الحالة المعطوبة **و** قبول الحالة السليمة، حتى لا يكون «الرفض» ناتجًا عن trigger معطّل.

### 2.3 الهدف المعزول الحقيقي — Neon

| القياس | النتيجة |
|---|---|
| الترحيلات المطبقة | **25/25 `APPLIED`** في `ops.aigas_migration_ledger` |
| زمن الترحيل الواحد | 195–446 ms |
| الجداول في `public` | **36** |
| RLS مفعّل | **36/36** |
| `FORCE RLS` | **2** |
| السياسات | **77** |
| الدوال `aigas_*` في `public` | **25** |
| منح `authenticated`/`anonymous` على `public` | **0 جدول / 0 دالة** |
| `aigas_runtime` | موجود `NOSUPERUSER NOBYPASSRLS NOLOGIN NOINHERIT` |
| منح `aigas_runtime` | **34**، وصفر على `aigas_sc_messages`/`aigas_sc_conversations` |
| Triggers الـledger | `append_only` + `chain_guard` + `no_truncate` |
| قيد `aigas_ld_events_check` يحوي `request_fingerprint` | **نعم** |
| جداول `neon_auth` | **9** — مطابقة للإنتاج اسمًا |
| صفوف البيانات في كل الجداول المفحوصة | **0** (`neon_auth.user`, `aigas_tenants`, `aigas_memberships`, `aigas_ld_events`, `aigas_sc_messages`, `aigas_hg_requests`, `aigas_fw_decisions`) |
| **parity مقابل rehearsal** | **`PARITY`** — صفر فرق في الجداول/السياسات/الدوال/الفهارس |

### 2.4 فحوص السلوك على الهدف — 8/8 `PASS`

| الفحص | النتيجة | SQLSTATE / القيمة |
|---|---|---|
| `authenticated` لا يقرأ `aigas_tenants` | ✅ | `42501 permission denied for table` |
| `authenticated` لا ينفّذ `aigas_sc_usage_window_v2` | ✅ | `42501 permission denied for function` |
| `aigas_runtime` بلا أي فعل على `aigas_sc_messages` | ✅ | `42501 permission denied for table` |
| `aigas_runtime` يرى صفر صفوف بلا نطاق مستأجر | ✅ | `count = 0` |
| `aigas_runtime` ينفّذ الدالة المجمّعة الممنوحة | ✅ | صف واحد، بلا خطأ |
| نطاق `aigas.tenant_id` لا يتسرب بعد `ROLLBACK` | ✅ | فارغ |
| … ونفس القيمة خارج الـtransaction | ✅ | `''` |
| chain guard يرفض ربطًا مزوّرًا | ✅ | `P0001 Ledger sequence gap or wrong previous hash` |

كل فحص يعمل داخل transaction ويُنهى بـ`ROLLBACK`؛ الصفر صفوف في §2.3 يثبت أن لا أثر دائم.

### 2.5 تحصين B9 — `to_regrole` في `0018`/`0025`/`0028`

المشكلة: `0018`/`0025` كانتا تنفّذان `REVOKE … FROM authenticated/anonymous` بلا شرط، فأي مشروع بلا Data API وبلا Neon Auth يفشل بـ`42704` قبل أن يبني أي وضع أمني.

| الملف | التغيير | الأثر على المنح |
|---|---|---|
| `0018` | كل `REVOKE` لـ`authenticated`/`anonymous` (كائنات + default privileges + دوال §4) صار داخل `IF to_regrole(...) IS NOT NULL` | لا شيء: نفس السحب عند وجود الدور |
| `0025` | §2 كاملة، default privileges (§2)، حلقة الدوال (§4)، §6، وفحوص §8 الأربعة | لا شيء |
| `0028` | سحب `aigas_lock_member` والدالتين المقفولتين | لا شيء |

الإثبات: مرحلة جديدة `client_roles_absent` تُسقط الدورين فعليًا (`dropErrors=[]`) ثم تبني 25/25: 36 جدولًا، 77 سياسة، `aigas_runtime` موجود `NOBYPASSRLS`، triggers الـledger الثلاثة، 25 صف `APPLIED`. قبل الإصلاح كانت هذه المرحلة تفشل عند `0018`، وبعد إصلاحه فقط فشلت عند `0028` — أي أن الاختبار كشف ملفًا ثالثًا يحمل نفس العيب.

`0028` كانت **خارج** التفويض الأصلي (0018/0025)، وأُصلحت لأن النتيجة المقبولة — تركيب كامل بلا أدوار عميل — لا تتحقق بدونها. لم يتغيّر أي منح.

---

## 3. ما اكتُشف ولم يكن موثقًا

### 3.1 `aigas_ld_events_chain_guard` غائب على الإنتاج — `HIGH`

- الدالة **و**الـtrigger غير موجودين (`pg_proc`, `pg_trigger`).
- السبب: `0003` طُبِّق من نسخة أقدم؛ الحارس أُضيف في `4e5f9f49` (2026-11-03)، وهو سلف للمرجع، والفرع لم يُطبِّق `0013` ولا `0024`.
- الأثر: قيد `sequence_no`/`previous_hash` في Ledger غير مفروض على مستوى DB.
- الإصلاح المثبت: `0013` ثم `0024` (no-op). على الهدف المعزول الحارس موجود ومُختبر (§2.4).

### 3.2 `0016` كان يُبقي `EXECUTE` متاحًا لـ`authenticated` — `CLOSED`

- كان: `REVOKE ALL ... FROM PUBLIC` فقط، وdefault ACL للمالك يمنح `authenticated=X` على كل دالة جديدة ⇒ الدالة `SECURITY DEFINER` قابلة للتنفيذ من دور العميل.
- القياس قبل الإصلاح: بعد `0016` فقط ⇒ `authenticated_can_execute=true`. بعد `0018`+`0025` ⇒ `false`.
- **الإصلاح المطبَّق بتفويض المالك:** `REVOKE ALL ... FROM authenticated` و`FROM anonymous` داخل `0016` (بحراسة `to_regrole`) بعد سحب `PUBLIC`.
- القياس بعد الإصلاح: تطبيق `0016` وحده ⇒ `false`/`false`؛ وعلى الهدف `42501` فعلي (§2.4).
- الأثر: sha256 لـ`0016` تغيّر ⇒ `drift: MODIFIED_AFTER_REFERENCE`.

### 3.3 `0016` تحقّق من GUC قديم — `INFO` (لا عيب)

`0016` يقرأ `aigas.sc_tenant_id`/`aigas.sc_user_id`. التطبيق يضبطهما فعلًا في `src/server/secure-chat/requests.mjs:12` بعد `requireProductAccess`، ويضبط `aigas.tenant_id`/`aigas.user_id` كذلك. عقدان متوازيان، وتوحيدهما تحسين لاحق.

### 3.4 `ELSE` المفتوحة في `0025` §3 — `MEDIUM` تصميمي

أي جدول `aigas_*` غير مذكور في قوائم §3 يحصل على `SELECT, INSERT, UPDATE, DELETE`. اليوم: `aigas_memberships`, `aigas_hg_policies`, `aigas_fw_rules`, `aigas_re_assessments`, `aigas_department_memberships`. RLS يقيّدها، لكن أي جدول جديد يُضاف بدون تحديث القوائم يفتح بـ4 أفعال صامتًا. التوصية: تحويل `ELSE` إلى `RAISE` أو تثبيت القائمة في نفس الترحيل.

### 3.5 `0025` لا يملك شرط `CREATEROLE` — `INFO`

`CREATE ROLE aigas_runtime` يحتاج `CREATEROLE`. `neondb_owner` يملكها فالمسار سليم؛ تطبيق `0025` بدور `BYPASSRLS` بلا `CREATEROLE` يفشل بـ`42501` برسالة لا تشرح السبب.

### 3.6 `0025` سحب شامل على دوال `public` — `INFO`

`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC` آمن اليوم لأن `public` لا يحوي إلا `aigas_*`. أي امتداد مستقبلي يُثبَّت في `public` سيُعطَّل، وفحص §8 سيرفض الترحيل.

### 3.7 لا ledger على الإنتاج — `HIGH` للحاكمية

الحالة الحالية مشتقة من الكائنات، وأي تغيير لاحق يعيد الغموض. التصميم: `ops.aigas_migration_ledger` (ينشئه الـrunner). **غير موجود على الإنتاج**؛ موجود ومملوء 25/25 على الهدف (§2.3).

### 3.8 هدف بلا Data API ولا Neon Auth لا يمكنه تشغيل `0018`/`0025` — `CLOSED` (B9)

- كانت `0018` و`0025` تنفّذان `REVOKE ALL ... FROM authenticated` **بلا شرط** ⇒ `42704 role "authenticated" does not exist` يوقف الترحيل.
- `0027` كانت تفعلها بشكل صحيح (`IF to_regrole(...) IS NOT NULL`) — التفاوت داخل المستودع نفسه.
- **أُغلق بتفويض المالك:** `0018`/`0025`/`0028` تحصّنت بنفس النمط (§2.5)، وأُثبت بمرحلة `client_roles_absent` أن السلسلة تكتمل 25/25 على مشروع بلا الدورين.
- الأثر: ثلاثة hashes تغيّرت ⇒ `MODIFIED_AFTER_REFERENCE` في `migration-ledger.json`. لا منح تغيّر، و`0025` §8 يفحص الدورين فقط عند وجودهما.

### 3.9 قيود خطة Neon منعت ضابطين أمنيين على الهدف — `MEDIUM`

| الضابط | رد الخدمة |
|---|---|
| `protected=true` | `422 maximum number of protected branches for your current plan` |
| `suspend_timeout_seconds > 0` | `412 modifying the suspend interval is not permitted on this account` |

النتيجة: الهدف **قابل للحذف** و**لا يتوقف تلقائيًا**. الضابط الفعلي للتكلفة هو سقف CU = 1 وحصص `settings.quota` فقط. رفع القيد = ترقية خطة مدفوعة = قرار مالك منفصل. `production` نفسه ما زال `protected=false`.

### 3.10 بناء جديد يفشل على `0001` قبل توفير `neon_auth` — `HIGH` للترتيب

- `0001_aigas_kernel.sql` يقرأ ويكتب `neon_auth` (FK من `aigas_ld_events.created_by` إلى `neon_auth."user"`).
- مشروع Neon جديد لا يحوي هذا الـschema ⇒ `3F000 schema "neon_auth" does not exist` كأول فشل، قبل أي شيء آخر.
- المشروع الحالي مرّ بالمسار بتفويض مالك: `provision_neon_auth` بمزوّد `better_auth` على `neondb`، فأنشأ `neon_auth` بـ9 جداول مطابقة للإنتاج.
- الخلل ليس في الترحيل بل في **عدم توثيق المتطلب المسبق**: أي بيئة جديدة (DR، staging آخر) يجب أن تُهيّئ Neon Auth **قبل** `0001`. هذا بند يجب أن ينتقل إلى runbook النشر، لا إلى ملف migration.

### 3.11 منصة Neon تمنح الأدوار الجديدة `SET FALSE` — `MEDIUM` تشغيلي

- بعد إنشاء `authenticated`/`anonymous`/`aigas_runtime`، ظهرت عضوية `neondb_owner` بها بمنحة من `cloud_admin` بـ`ADMIN TRUE, INHERIT FALSE, SET FALSE`.
- النتيجة: `pg_has_role(...) = true` لكن `SET ROLE` يفشل بـ`42501 permission denied to set role` ⇒ كل فحص على مستوى SQL (بما فيه التحقق من RLS والـchain guard) يصبح غير قابل للتنفيذ، وليس فقط «مرفوضًا».
- الإنتاج يختلف: المنحة تأتي من `neon_service` بـ`INHERIT TRUE, SET TRUE`. لذلك كان الفرق حقيقيًا لا شكليًا.
- **المعالجة المطبَّقة على الهدف فقط** (ليست migration، لأن الإنتاج لا يحتاجها):
  `GRANT authenticated TO neondb_owner WITH INHERIT TRUE, SET TRUE;` وكذلك `anonymous` و`aigas_runtime` (`INHERIT FALSE` لها).
- الأثر المتبقي: صفّا عضوية لكل دور (منحة `cloud_admin` المقيدة + منحة `neondb_owner`). الخيارات الفعّالة هي اتحاد الاثنين ⇒ `SET TRUE`، فالعضوية تعمل. الإنتاج يملك صفًا واحدًا لكل دور. فرق بنيوي في `pg_auth_members` لا يمسّ RLS ولا المنح على الجداول، وموثَّق في `staging-catalog.json → memberships`.
- **تكرّر بعد إعادة البناء:** بعد `DROP ROLE aigas_runtime` وإعادة `0025` (مسار `CREATE ROLE`)، عاد `SET ROLE` يفشل بـ`42501` حتى أُعيد `GRANT … WITH SET TRUE`. أي هدف جديد يحتاج هذه الخطوة **بعد** الترحيلات، لا قبلها. وهي خطوة تشغيلية على الهدف المعزول فقط؛ الإنتاج يستلم العضوية من `neon_service`.

### 3.12 تفعيل Neon Auth على الهدف أنشأ سطحًا خارجيًا — `INFO`/`OPEN`

- `provision_neon_auth` أنشأ نقطة نهاية `https://ep-holy-shape-bdtttebk.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth`.
- لا مستخدمين (`neon_auth.user = 0`)، ولا مزوّد هوية خارجي مُهيّأ، ولا مفاتيح. الخطر الحالي محدود، لكن السطح موجود ويستهلك حصة.
- القرار المطلوب من المالك لاحقًا: إبقاؤه للاختبار، أو حذف المشروع بعد إغلاق P02. لم يُغيَّر شيء بعد التحقق.

### 3.13 نافذة `EXECUTE` عامة بين `0018` و`0025` — `INFO` تصميمي

- `0018` تسحب `EXECUTE` من `PUBLIC` على الدوال الموجودة وقتها، لكن الترحيلات اللاحقة (`0023` مثلًا) تُنشئ **دوال trigger جديدة** تحصل على الصلاحية الافتراضية لـ`PUBLIC`.
- القياس على مرحلة `guards` (20 ملفًا، بلا `0025`): `aigas_trial_entitlement_guard` و`aigas_trial_transition_guard` تُظهر `authenticated_can_execute=true`. بعد `0025` تصبح `false` (77 سياسة، 25 دالة).
- أي بيئة تُنهي السلسلة عند `0024` تكون في هذه النافذة. الترتيب المعتمد لا يسمح بذلك (`0025` قبل `0024`)، لكن القاعدة الهشّة هي «اسحب من PUBLIC في الملف الأول فقط». التوصية: إضافة سحب `PUBLIC` نهائي في نهاية `0025` أو `0029` لكل دوال `public` بدل الاعتماد على ترتيب الملفات.

---

## 4. حدود الدليل

| البند | الحالة | السبب |
|---|---|---|
| Parity: كتالوج الهدف المعزول مقابل rehearsal | `PASS` | صفر فرق |
| Parity: الإنتاج مقابل migrations | `DRIFT` | متوقع — الإنتاج متأخر (§3.1، §3.7) |
| Ledger على الهدف المعزول | `PASS` | 25 صفًا `APPLIED` |
| حراس الترتيب (رفض فعلي) | `PASS` | 3/3 على المستوى المحلي |
| تركيب بلا أدوار عميل (B9) | `PASS` | 25/25 بدون `authenticated`/`anonymous` |
| `SECURITY DEFINER` + إصلاح `0016` | `PASS` | مغلق ومقاس قبل/بعد، ومؤكَّد على الهدف |
| RLS ومنح الأدوار على الهدف | `PASS` | 8/8 فحوص سلوكية |
| سلوك التطبيق (Kernel) على الهدف | `NOT RUN` | يتطلب تشغيل الخدمة بمفاتيح مستقلة |
| استعادة فعلية + RPO/RTO | `NOT RUN` | **بوابة P17 منفصلة** |
| Data API بعد `0025` | `N/A` على الهدف · `NOT RUN` على الإنتاج | الهدف بلا Data API |
| مسار `delta` على هدف Neon | `NOT RUN` | يحتاج نسخة من شكل الإنتاج؛ `delta` مُثبت محليًا فقط |

`PASS` هنا يعني: مجموعة الترحيلات تُبنى كاملة على PG 18.6 حقيقي بصلاحيات شبيهة بالإنتاج، والمنح والـRLS والـchain guard تعمل كما هو مصمم. **لا يعني** جاهزية إنتاج، ولا أن RLS مُتحقَّق منه تحت حمل تطبيق حقيقي، ولا أن مسار bootstrap على الإنتاج محلول.
`PASS ≠ RELEASED`؛ Beta/Commercial `NO-GO`.

---

## 5. التغييرات في المستودع

| الملف | النوع |
|---|---|
| `scripts/db-migration-rehearsal.mjs` | جديد — rehearsal معزول + ledger + حراس + حالات سلبية |
| `scripts/db-parity-diff.mjs` | جديد — فرق parity بين ملفَّي JSON، بلا اتصال بأي قاعدة |
| `scripts/apply-migrations.mjs` | جديد — runner بترتيب مفروض وledger وحراسة شكل الهدف |
| `scripts/migration-order.mjs` | جديد — ترتيب الترحيلات المشترك |
| `scripts/capture-catalog.mjs` | جديد — لقطة كتالوج/عضويات/ledger بـSELECT فقط |
| `scripts/verify-target-posture.mjs` | جديد — 8 فحوص سلوكية على الهدف، كلها داخل transactions مُلغاة |
| `docs/beta/STAGING-MIGRATION-REHEARSAL-PLAN-2026-11-10.md` | جديد — الخطة والهدف والتكلفة والرجوع وبوابة التفويض |
| `Audit/p02-staging-parity-2026-11-10/*` | جديد — 8 ملفات دليل |
| `migrations/0016_aigas_sc_user_token_quota.sql` | **تعديل** — سحب `EXECUTE` من `authenticated`/`anonymous` (بتفويض) |
| `migrations/0018_aigas_data_api_grant_hardening.sql` | **تعديل** — حراسة `to_regrole` لكل REVOKE (B9) |
| `migrations/0025_aigas_tenant_isolation_closure.sql` | **تعديل** — حراسة `to_regrole` في §2/§4/§6/§8 (B9) |
| `migrations/0028_aigas_runtime_membership_lock.sql` | **تعديل** — حراسة `to_regrole` لسحب الدوال الثلاث (B9) |
| `.agents/mind/01-mind-latest.md` | تحديث |

لا تعديل على `src/`، ولا على الاختبارات، ولا على workflows. `.env` و`.env.staging.local` مستبعدان من git (`gitignore:2` و`:113`) وبصلاحية `600`، ولم تُطبع أي قيمة سر.

---

## 6. ما تبقّى قبل إغلاق P02

1. **B2 — حماية الفرع وscale-to-zero**: يتطلب خطة مدفوعة. بدونهما الهدف قابل للحذف ولا يتوقف تلقائيًا (§3.9).
2. **مسار `delta` على هدف Neon**: لتغطية سيناريو إغلاق الإنتاج فعليًا، لا محليًا فقط.
3. **P17 — استعادة + RPO/RTO**: بوابة منفصلة قبل أي نقل للإنتاج.
4. **runbook النشر**: تسجيل ثلاث خطوات إلزامية — تهيئة `neon_auth` قبل `0001` (§3.10)، ضبط عضوية `SET TRUE` بعد الترحيلات على أي هدف بلا `neon_service` (§3.11)، وسحب `EXECUTE` من `PUBLIC` بعد آخر ملف ينشئ دوال (§3.13).
5. **قرار مصير الهدف** بعد التحقق: إبقاء أو حذف (§3.12).

**مغلق في هذه الجولة:** B9 (`0018`/`0025`/`0028`) — مُثبت بمرحلة `client_roles_absent`، وقرار المالك بالتنفيذ مأخوذ. تغيّرت ثلاثة hashes إلى `MODIFIED_AFTER_REFERENCE`، و`0018`/`0025` ما زالا **غير مطبقين** على الإنتاج، فالتغيير لم يُطبَّق على أي بيئة حقيقية سوى الهدف المعزول.
