# خطة Staging وParity وLedger الترحيلات — P02 (2026-11-10)

> **الحالة:** `DONE` للنطاق المعزول — `aigas-staging` (`lucky-salad-43566291`) بُني بـ25/25 ترحيلًا، parity=`PARITY`، posture=8/8. لا snapshot، ولا تغيير على `production`؛ `PASS ≠ RELEASED`.
> **ما نُفِّذ فعليًا:** جرد قراءة فقط على الفرع الحي + rehearsal محلي معزول على PostgreSQL 18.6 مع ledger وحراس وسيناريوهات سلبية + إنشاء هدف Neon مستقل + إصلاح `0016`.
> **الأدلة:** `Audit/p02-staging-parity-2026-11-10/REPORT.md`، `rehearsal.json`، `parity.json`، `live-catalog.json`، `migration-ledger.json`.
> **المرجع التاريخي:** SHA `7b1f533f71c7b1f41884790366a4d5967c85a87b`. **HEAD وقت التنفيذ:** `60777c9739d5584360e57bd5238d3a075b06c09a`.
> **حدود إلزامية:** تمرين الاستعادة وRPO/RTO مسؤولية P17، وليست شرطًا لهذه الخطة، لكنها بوابة منفصلة قبل أي نقل للإنتاج.

---

## 0. الانحراف عن المرجع

| البند | المرجع `7b1f533` | HEAD `60777c9` | الأثر |
|---|---|---|---|
| commits إضافية | — | 2 (`57257276`, `60777c97`) | لا تمسّ `migrations/` |
| `migrations/0001`–`0027` | — | **مطابقة بايت-ببايت** (sha256 لكل ملف) | كتالوج الترحيل لم يتغير |
| `migrations/0028`, `0029` | غير موجودة | موجودة | خارج نطاق 0001–0027، مجموعة مستقلة تحتاج مراجعة وتفويضًا |
| `docs/beta/STAGING-RESTORE-AND-MIGRATION-PLAN.md` | — | لم يتغير | رقم `0027` كأعلى ترحيل أصبح قديمًا؛ أعلى ترحيل فعلي `0029` |

**لذلك:** أي رقم «أعلى ترحيل» في التقارير الأقدم يشير إلى `0027` أو `0020`، وهو **تاريخي** ولا يصلح كحقيقة حالية.

---

## 1. جرد الفرع الحي — قراءة فقط 2026-11-10

المشروع `young-frog-60183055`، الفرع `br-young-bird-b43proeb` (`production`, `primary`, `default`, `protected=false`)، قاعدة `neondb`، PostgreSQL 18.

| الفحص | القيمة الحية | الوسم |
|---|---|---|
| الجداول في `public` | 31 جدولًا، كلها `aigas_*` | `VERIFIED` |
| RLS | 31/31 مفعّل، `FORCE` = 0 | `VERIFIED` |
| السياسات | 2 فقط، تعتمد `aigas.sc_tenant_id`/`aigas.sc_user_id` (عقد ما قبل 0018) | `VERIFIED` |
| جدول ledger للترحيلات | **غير موجود** | `VERIFIED` |
| `aigas_runtime` | **غير موجود** | `VERIFIED` |
| منح `authenticated` | 124 منح DML على 31 جدولًا (من default ACL للمالك) | `VERIFIED` |
| Default ACL لـ`neondb_owner` | `authenticated=arwd` جداول، `X` دوال، `U` تسلسلات | `VERIFIED` |
| `neondb_owner` | `rolsuper=false`, `rolbypassrls=true`, `rolcreaterole=true`, عضو `authenticated`/`anonymous`/`neon_auth`/`neon_superuser` | `VERIFIED` |
| `pg_session_jwt` | ممتد في `public` لكن دواله في `auth` ⇒ لا دوال غير `aigas_*` في `public` | `VERIFIED` |
| التسلسلات في `public` | 0 | `VERIFIED` |
| الصفوف في الجداول المفحوصة | 0 (`tenants`, `memberships`, `audit_events`, `ld_events`, `sc_messages`) | `VERIFIED` (عينة) |
| `history_retention_seconds` | 21600 | `VERIFIED` |

### 1.1 حالة الترحيل الفعلية — مشتقة من الكائنات لا من ledger

لا يوجد ledger على الفرع، فأُعيد بناء الحالة من الكائنات (`information_schema`, `pg_class`, `pg_proc`, `pg_constraint`, `pg_trigger`, `pg_indexes`):

| الملف | الحالة الحية | الدليل |
|---|---|---|
| `0001`–`0010` | **APPLIED** | كل الجداول/الفهارس/الدوال/الـtriggers موجودة |
| `0011`, `0012` | **APPLIED** | `aigas_fw_decisions_action_check` خمس حالات + `request_fingerprint` + `guard_binding_check NOT VALID` |
| `0003` (نسخة اليوم) | **DRIFT** | الـconstraint الحي هو نسخة ثلاثية الحالات، و`aigas_ld_events_chain_guard` (دالة + trigger) **غائب** |
| `0013` | **NOT APPLIED** | لا `request_fingerprint` في قيد ledger، ولا chain guard |
| `0014` | **NOT APPLIED** | لا `aigas_hg_delegations`/`aigas_hg_grants` |
| `0015` | **APPLIED** | `aigas_re_treatment_revisions.residual_risk_description` موجود |
| `0016` | **NOT APPLIED** | فقط `aigas_sc_usage_window(uuid,uuid)`، لا `_v2` |
| `0017` | **NOT APPLIED** | `aigas_audit_events` بخمسة أعمدة فقط |
| `0018` | **NOT APPLIED** | السياستان تستخدمان `aigas.sc_*` |
| `0019` | **NOT APPLIED** | لا `aigas_runtime` |
| `0020`, `0021` | **NOT APPLIED** | لا أعمدة review/acceptance؛ `aigas_re_guard_treatment` نسخة ما قبل 0021 |
| `0022` | **NOT APPLIED** | لا الفهرسان الفريدان |
| `0023` | **NOT APPLIED** | لا جداول trial |
| `0024` | **NOT APPLIED** | — (لاحقًا no-op تحقّق) |
| `0025`, `0027` | **NOT APPLIED** | 2 سياسة فقط، لا `aigas_client_deny`، لا `sc_content_participant` |
| `0026` | **NOT APPLIED** | لا أعمدة residual/acceptance_policy |
| `0028`, `0029` | **NOT APPLIED** | — |

### 1.2 العيب الأمني/السلامي المؤكد

**`aigas_ld_events_chain_guard` غير موجود على الإنتاج.** الأثر: سلسلة hash الخاصة بـLedger غير مفروضة في قاعدة البيانات؛ يمكن إدخال `sequence_no` بقفزة أو `previous_hash` خاطئ دون رفض DB. الكود المحلي يفترض وجوده.

- السبب الجذري: `0003` على الفرع طُبِّق من نسخة أقدم (أُضيف الحارس إلى الملف في `4e5f9f49`، 2026-11-03، وهو سلف للمرجع)، والفرع لم يُعِد تطبيق `0003` ولا `0013` ولا `0024`.
- الإصلاح: `0013` (يستبدل القيد ويُنشئ الحارس) ثم `0024` (no-op تحقّق).
- **لا يُصلَح بـforward-only في هذه الخطة دون rehearsal** — rehearsal المحلي أثبت أن `0013` ينتج الحارس والقيد الخماسي (انظر §5).

---

## 2. الهدف المعزول المقترح

**المقترح المعتمد للتوصية: مشروع Neon مستقل `aigas-staging`، لا فرع من `production`.**

### 2.0 ما أُنشئ فعليًا (مفوَّض 2026-11-10)

| البند | القيمة |
|---|---|
| المشروع | `lucky-salad-43566291` — `aigas-staging` |
| الفرع | `br-rough-wind-bdkmg13n` — `staging` (primary/default) |
| القاعدة | `neondb`، الدور `neondb_owner` |
| `pg_version` | 18.6 (مطابق للإنتاج) |
| المنطقة | `aws-us-east-2` (مطابقة للإنتاج) |
| CU | `0.25`–`1` (الإنتاج `0.25`–`2`) |
| `history_retention_seconds` | 21600 |
| الحصص | `active_time 72000s`, `compute_time 36000s`, `written_data 1GiB`, `data_transfer 1GiB`, `logical_size 1GiB` |
| الجداول قبل الترحيل | 0 (تحقق: `pg_tables` = 0، والمخططات `public` فقط) |
| الأدوار | `cloud_admin`, `neon_service`, `neon_superuser`, `neondb_owner`, `token_roles` — **لا `authenticated`/`anonymous`** |

### 2.0.1 ضوابط لم تُنفَّذ — بسبب قيود الحساب لا بسبب اختيار

| الضابط | الحالة | سبب فعلي |
|---|---|---|
| `protected=true` | ❌ **مرفوض** | `422 maximum number of protected branches for your current plan`. الإنتاج نفسه `protected=false`؛ الحماية تحتاج ترقية خطة = قرار مالك منفصل |
| `suspend_timeout_seconds > 0` | ❌ **مرفوض** | `412 modifying the suspend interval is not permitted on this account`؛ الهدف يرث `0` |
| `expires_at` | ❌ | فرع محمي لا يقبل `expires_at`؛ وبما أن الحماية فشلت، يمكن ضبطه لاحقًا — لم يُضبط |
| `block_public_connections=true` | ⏸️ مؤجل | يحتاج `allowed_ips` لعناوين خروج المشغّل غير المعروفة بعد |
| Data API | ✅ غير مفعّل | المشروع جديد بلا خدمة Data API |

**أثر هذه القيود:** الهدف **غير محمي وقابل للحذف** و**لا يتوقف تلقائيًا**. الضابط الفعلي الوحيد للتكلفة اليوم هو سقف CU = 1 وحصص `settings.quota` أعلاه. أي ترقية خطة لحماية الفرع أو scale-to-zero **قرار مالك مدفوع** ولا يُنفَّذ من هذا الوكيل.

### 2.0.2 عائق جديد: `authenticated`/`anonymous` غير موجودين

المشروع الجديد بلا Data API ⇒ الدوران غير موجودين (تحقق: `to_regrole` = null، و`has_table_privilege('authenticated',…)` يفشل بـ`42704`). لكن `0018` و`0025` تنفّذان `REVOKE … FROM authenticated/anonymous` **بلا شرط** ⇒ الترحيل يفشل على أي هدف بلا Data API.

خياران:

| الخيار | الأثر | الحالة |
|---|---|---|
| أ. أدوار بديلة `NOLOGIN` بلا أي منح (`--bootstrap-client-roles`) | لا تعديل على الترحيلات؛ يبقى `0025` §8 فحصًا فعّالًا (صفر منح) | **مطبَّق في الـrunner**، يحتاج تمرير العلم صراحةً |
| ب. تحصين `0018`/`0025` بـ`to_regrole` كما يفعل `0027` أصلًا | الأنظف هندسيًا؛ يغيّر sha256 لترحيلين معتمدين | **مؤجل** — يحتاج تفويض تعديل |

### 2.1 المواصفات المستهدفة

| الخاصية | القيمة المقترحة | السبب |
|---|---|---|
| النوع | مشروع مستقل | فرع Neon يرث بيانات الأصل وAuth metadata |
| البيانات | اصطناعية بالكامل من `migrations/` | لا نسخ بيانات عملاء |
| `pg_version` | 18 (مطابقة الإنتاج) | يمنع فروق planner/RLS بين النسختين |
| الأسرار | `DATABASE_URL_UNPOOLED` مستقل، وJWT secret مستقل | لا مشاركة أسرار |
| الاتصال | `block_public_connections=true` + Private/allow-list | تقليل السطح |
| الحماية | `protected=true` | منع الحذف العرضي |
| scale-to-zero | `suspend_timeout_seconds > 0` | ضبط التكلفة (الإنتاج حاليًا `0`) |
| Data API | معطّل أو `db_schemas` بلا `public` | لا وصول عميل مباشر |
| مزودو AI | `APPROVED_MODELS=[]`, `approvedProviders=[]` | لا إرسال خارجي |

**رفض صريح:** إنشاء فرع من `production`. حتى مع عدّ صفوف = 0 في العينة، الفرع ينسخ schemas وAuth metadata، وسياسة Beta تقتضي بيانات اصطناعية.

### 2.1 التكلفة

لا أُدرج رقمًا نقديًا: لا يوجد مصدر تسعير معتمد داخل المستودع، واختلاق رقم يخالف قاعدة الأدلة.

**نموذج التكلفة المطلوب اعتماده من المالك (بنود قابلة للقياس لا تقديرات):**

| البند | الحالة |
|---|---|
| حساب Neon منفصل | يتطلب قرار الخطة (Free/Launch/Scale) من المالك |
| CU-hours للمشروع الجديد | يُقاس من `active_time`/`cpu_used_sec` بعد الإنشاء؛ يحتاج `suspend_timeout_seconds>0` |
| تخزين | حجم منطقي ابتدائي صغير (المخطط فقط، صفر صفوف) |
| نقل بيانات | rehearsal محلي لا يستهلك نقلًا؛ الاتصال من المعزول قد يستهلك |
| تكرار | مشروع واحد فقط؛ لا فروع متعددة، ولا snapshots دائمة |

**ضوابط إلزامية مرفقة بالتفويض:** حد CU أدنى/أقصى، `suspend_timeout_seconds` غير صفري، `expires_at` معلن أو مراجعة شهرية، وحذف الهدف بعد إغلاق P02 أو تحويله إلى هدف مرجعي معتمد.

### 2.2 الأسرار المطلوبة — بالأسماء فقط

| الاسم | الغرض | القيد |
|---|---|---|
| `DATABASE_URL_UNPOOLED` | اتصال مباشر لهدف معزول معتمد | لا يُطبع، لا يُحفظ في المستودع، لا يُرسل لأداة غير معنية |
| `AIGAS_STAGING_JWT_SECRET` | توقيع مستقل للـstaging | مستقل تمامًا عن الإنتاج |
| `AIGAS_APPROVED_MODELS` = فارغ | منع أي إرسال لمزود | — |

لا مفاتيح مزودين، ولا بيانات عملاء، ولا نسخ من أسرار الإنتاج.

---

## 3. خطة الكائنات (ما سيتغير فعليًا)

الأرقام من rehearsal المحلي (`.postures.fresh` في `rehearsal.json`)، وليست تقديرات:

| الكائن | قبل (الحي) | بعد (هدف fresh من `migrations/`) |
|---|---|---|
| جداول `aigas_*` | 31 | **36** (+`aigas_hg_delegations`, `aigas_hg_grants`, `aigas_trial_requests`, `aigas_trial_events`, `aigas_trial_entitlements`) |
| RLS مفعّل | 31/31 | **36/36** |
| `FORCE RLS` | 0 | **2** (`aigas_sc_conversations`, `aigas_sc_messages`) |
| السياسات | 2 | **77** (tenant-scoped + `aigas_client_deny` RESTRICTIVE على كل جدول + participant-only على المحتوى) |
| الدوال في `public` | 10 | **25** (خمسة scope helpers، ثلاثة lock helpers، حراس 0014، حراس trial، `_v2`) |
| `SECURITY DEFINER` | 1 (`aigas_sc_usage_window`) | 7 (`aigas_is_tenant_member`, `aigas_actor_role`, `aigas_actor_is_manager`, `aigas_sc_usage_window(_v2)`, `aigas_lock_member`, `aigas_locked_*`) — راجع §6 |
| `aigas_runtime` | غائب | **موجود**: `NOLOGIN NOINHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION` |
| منح `authenticated`/`anonymous` على `public` | 124 | **0** |
| Default ACL للمالك | يمنح `authenticated` تلقائيًا | **0 صفوف** |
| منح `aigas_runtime` | — | **34** منحًا مصنّفًا؛ **صفر** على `aigas_sc_messages`/`aigas_sc_conversations` |
| Chain guard | **غائب** | **موجود** (دالة + trigger) |

⚠️ **قاعدة `ELSE` المفتوحة في 0025:** أي جدول `aigas_*` لا يقع في قوائم §3 يحصل على `SELECT, INSERT, UPDATE, DELETE`. اليوم يقع في `ELSE`: `aigas_memberships`, `aigas_hg_policies`, `aigas_fw_rules`, `aigas_re_assessments`, `aigas_department_memberships`. مقبول لأن RLS يقيّدها، لكنه **fail-open في التصميم** لأي جدول يُضاف لاحقًا. يجب تثبيت القائمة أو تحويل `ELSE` إلى `RAISE` قبل أي ترحيل جديد يضيف جدولًا.

---

## 4. ترتيب الترحيلات

### 4.1 هدف معزول جديد (fresh install)

```
0001 0002 0003 0004 0005 0006 0007 0008 0009 0010
0014 0015 0016 0017 0018 0020 0021 0022 0023 0024
0025 0026 0027 0028 0029
```

مستبعد عمدًا من fresh:

| الملف | السبب |
|---|---|
| `0011`, `0012` | بديلان ترقويان لـ`0002`؛ `0002` الحالي يتضمن نتيجتهما |
| `0013` | ترقية لـ`0003`؛ `0003` الحالي يتضمن الحارس والقيد الخماسي |
| `0019` | متجاوَز بـ`0025`؛ تطبيقه بعدها مرفوض بحارس، وتطبيقه قبلها يفتح منحًا واسعة ثم تُسحب |

هذا الترتيب هو نفسه الذي يفرضه `tests/helpers/database.mjs` (`installSchema`)، فأي انحراف عنه يجعل الاختبارات والـstaging يمثلان حالتين مختلفتين.

### 4.2 إغلاق الإنتاج (delta)

```
0013 → 0014 → 0016 → 0017 → 0018 → 0020 → 0021 → 0022 → 0023 → 0025 → 0026 → 0027 → 0028 → 0029 → 0024
```

| القيد | السبب |
|---|---|
| `0013` أولًا | يعيد قيد ledger الخماسي وينشئ الحارس الغائب؛ لا يعتمد على أي ترحيل لاحق |
| `0018` قبل `0025` | `0025` يُعيد صياغة سحوب `0018`؛ و`0018` يرفض نفسه بعد `0025` |
| `0022` قبل `0025` | `0025` يعيد استخدام أسماء فهارس `0022` بـ`IF NOT EXISTS` |
| `0021` قبل `0026` | `0026` يستبدل `aigas_re_guard_treatment` الذي أنشأه `0021` |
| `0025` قبل `0027`, `0028` | كلاهما يتحقق من `aigas_client_deny`/`aigas_tenant_scope` |
| `0024` آخرًا | تحقّق no-op بعد أن يكون `0013`+`0017` قد أنجزا العقد |
| `0019` **مستبعد** | حارس داخلي يرفضه بعد `0025`؛ وممنوع قبله بحسب القرار المعتمد |

**قيود إعادة التشغيل (مثبتة بالاختبار):**

| الملف | إعادة التشغيل |
|---|---|
| `0013` | آمن (idempotent: `DROP CONSTRAINT IF EXISTS`) |
| `0020`, `0024` | آمنة (`IF NOT EXISTS` / فحوص) |
| `0014` | ❌ `ADD COLUMN` بلا `IF NOT EXISTS` |
| `0016` | ❌ `CREATE FUNCTION` بلا `OR REPLACE` |
| `0017` | ❌ `ADD COLUMN` بلا `IF NOT EXISTS` |
| `0022` | ❌ `CREATE UNIQUE INDEX` بلا `IF NOT EXISTS` |
| `0023` | ❌ `CREATE TABLE` بلا حماية |
| `0029` | ❌ `ADD CONSTRAINT` بلا حماية |

⇒ الـrunner **يجب** أن يقرأ ledger قبل التطبيق، لا أن يعتمد على «كل الملفات آمنة».

---

## 5. حراس الترتيب — السلوك المثبت

| الحارس | الملف | مُشغَّل | النتيجة المختبَرة |
|---|---|---|---|
| `0027` يتطلب `aigas_client_deny` | `0027` | `0025` لم يُطبَّق | ✅ `P0001 0027 requires 0025 (aigas_client_deny policy is missing)` |
| `0019` متجاوَز | `0019` | بعد `0025` | ✅ `P0001 0019 is superseded by 0025 and must not be applied after it` |
| `0018` متجاوَز | `0018` | بعد `0025` | ✅ `P0001 0018 is superseded by 0025; apply 0018 before 0025 only` |
| `0025` يتطلب مالكًا/BYPASSRLS | `0025` | — | شرط مسبق: `neondb_owner` يحقق الشرط (`rolbypassrls=true`) ويملك `CREATEROLE` |
| فحص `0025` النهائي | `0025` | بعد التطبيق | يرفض أي منح عميل أو RLS غير مفعّل أو دور غير least-privilege |
| فحص `0027` النهائي | `0027` | بعد التطبيق | يرفض أي سياسة غير participant-scoped أو أي منح على جدولي المتن |

**ثغرة حراس مسجّلة:** لا حارس يمنع تطبيق `0014`/`0016`/`0017`/`0023` **قبل** `0018`. لا أثر أمني (لا منح جديدة قبل `0018` سوى default ACL)، لكنه يعني أن خطأ ترتيب مبكرًا لا يُكتشف بـfail-closed. الـrunner يجب أن يفرضه، لا الأمل.

---

## 6. مراجعة `SECURITY DEFINER` — `0016` أساسًا

`public.aigas_sc_usage_window_v2(uuid,uuid)` — تُرجع **مجاميع عدّ/رموز فقط، لا صفوفًا ولا نصًا**.

| البند | التقييم | ملاحظة |
|---|---|---|
| `SET search_path = pg_catalog, public` | ✅ صحيح | يمنع اختطاف `search_path`؛ `pg_catalog` أولًا |
| المالك | `neondb_owner` (`BYPASSRLS`) | الدالة تتجاوز RLS؛ حدودها داخلية فقط |
| تضييق النطاق | ✅ | `tenant_id = wanted_tenant` + `EXISTS` عضوية + مطابقة GUC للطرفين |
| GUC المستخدم | `aigas.sc_tenant_id` / `aigas.sc_user_id` | التطبيق يضبطهما في `secure-chat/requests.mjs` بعد `requireProductAccess` — مطابق |
| `REVOKE ... FROM PUBLIC` | ✅ | — |
| **`REVOKE ... FROM authenticated`** | ❌ **غائب** | default ACL للمالك يمنح `authenticated=X` تلقائيًا عند الإنشاء ⇒ **`EXECUTE` يصل لدور العميل حتى يعمل `0018` أو `0025`** |
| إعادة التشغيل | ❌ | `CREATE FUNCTION` بلا `OR REPLACE` |
| `GRANT` لدور runtime | غير موجود في `0016` | يأتي من `0025` §6 |

**العيب المؤكد (بلُغة دليل):** تطبيق `0016` وحده، أو أي ترتيب يضع `0016` بعد `0025` (مستحيل بحارس) أو قبل `0018` مع فشل لاحق، يترك دالة `SECURITY DEFINER` قابلة للتنفيذ من `authenticated` عبر Data API.

`auth_ok` المختبَر: بعد `0018`+`0025` ⇒ `authenticated_can_execute=false`, `anonymous_can_execute=false`. قبل `0018` ⇒ `authenticated_can_execute=true` (مسجّل في `findings`).

**توصية ملزمة قبل التطبيق على الهدف:** إضافة `REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM authenticated, anonymous;` داخل `0016` **أو** إلزام الـrunner بأن `0018` يُطبَّق في نفس الموجة. الخيار الأول أصغر وأقل اعتمادًا. أي تعديل على ملف ترحيل قائم يحتاج تفويضًا مستقلًا لأنه يغيّر الـsha256 المعتمد.

**إضافات خارج نطاق الطلب، مسجّلة لا مُنفَّذة:** `0025` تضيف أربع دوال `SECURITY DEFINER` (`aigas_is_tenant_member`, `aigas_actor_role`, `aigas_actor_is_manager`, `aigas_sc_usage_window_v2`) و`0028` تضيف ثلاثًا (`aigas_lock_member`, `aigas_locked_product_grants`, `aigas_locked_evidence_requirements`)؛ كلها `SET search_path = pg_catalog, public`، وتُرجع قيمة/صفوفًا محدودة لا محتوى، وتُسحب منها `PUBLIC` ثم تُمنح لـ`aigas_runtime` فقط — لكن `0028` تحتاج مراجعة مستقلة لأنها **لم** تُدرَج في نطاق `0001`–`0027`.

---

## 7. Ledger الترحيلات

**الفجوة:** لا يوجد ledger على الإنتاج، فالحالة الحالية مشتقة من الكائنات (§1.1). أي تغيير مستقبلي سيُكرِّر نفس الغموض.

**التصميم المقترح على الهدف المعزول:**

```sql
CREATE SCHEMA IF NOT EXISTS ops;
CREATE TABLE ops.aigas_migration_ledger (
  filename     text PRIMARY KEY,
  sha256       text NOT NULL,
  applied_at   timestamptz NOT NULL DEFAULT now(),
  duration_ms  integer NOT NULL,
  status       text NOT NULL,          -- APPLIED | FAILED | SKIPPED
  detail       text
);
```

- في schema `ops` لا `public`، حتى لا تلمسها سحوب `0018`/`0025` ولا قوائم `0025`/`0027`.
- `filename` كمفتاح يمنع إعادة التطبيق الصامت؛ و`sha256` يمنع تطبيق محتوى تغيّر بعد الاعتماد.
- لا يُدرج أي ledger على الإنتاج في هذه الخطة. إدراجه على الإنتاج تغيير DDL مستقل يحتاج تفويضًا.

**نُفِّذ محليًا:** 25 ملفًا في fresh + 26 صفًا في delta مطابقة، و`ledgerRows` قابلة للاستعلام (`rehearsal.json`).

---

## 8. خطة الرجوع

| المستوى | الإجراء | القيود |
|---|---|---|
| هدف معزول جديد | `DROP DATABASE`/حذف المشروع أو `reset` من الأب | مسموح لأنه لا بيانات حقيقية؛ يحتاج تفويض المورد نفسه |
| `0013` | إعادة القيد القديم من `pg_get_constraintdef` المحفوظ مسبقًا + `DROP TRIGGER/FUNCTION` | إن وُجدت صفوف بالحالات الخماسية ⇒ **roll-forward فقط** |
| `0014` | **لا down migration** | `NOT NULL` بعد تحديث صفوف؛ الرجوع = نقطة استعادة |
| `0016` | `REVOKE ALL` ثم `DROP FUNCTION` | آمن إن لم يوجد اعتماد |
| `0017` | `DROP INDEX` + `DROP CONSTRAINT` + `DROP COLUMN` | يفقد سياق audit المكتوب؛ لا يُنفّذ بعد كتابة حقيقية |
| `0018` | إعادة المنح من لقطة `role_table_grants` + `pg_default_acl` محفوظة حرفيًا | تحتاج اللقطة **قبل** التطبيق |
| `0022` | `DROP INDEX` | إن وُجد تصادم بيانات، لا يُنشأ أصلًا |
| `0023` | `DROP TABLE` (events → entitlements → requests) | فقدان بيانات؛ معزول فقط |
| `0025` | `DROP POLICY` للمجموعة + `REVOKE` + `DROP FUNCTION` + `DROP ROLE` بعد إثبات عدم الاعتماد + إعادة ACL من لقطة `0018` | `DROP ROLE` يفشل إن بقيت اعتماديات |
| `0026` | `DROP` القيود والأعمدة + إعادة تعريف دالة `0021` من `pg_get_functiondef` محفوظ | — |
| `0027` | **roll-forward مفضل** | التراجع يعيد تعريض المحتوى لسياسة مؤسسة |
| الإنتاج | **لا `DROP`**؛ roll-forward أو استعادة كاملة معتمدة | بوابة P17 |

**قاعدة:** لا `DROP` عشوائي. كل تراجع يحتاج تعريفًا محفوظًا مسبقًا، أو استعادة معتمدة.

---

## 9. ما يحتاج تفويضًا صريحًا (BLOCKED الآن)

| # | العملية | الحالة |
|---|---|---|
| B1 | إنشاء مشروع/فرع Neon معزول | ✅ **DONE** 2026-11-10 — `lucky-salad-43566291` / `br-rough-wind-bdkmg13n` |
| B2 | `protected=true` أو `suspend_timeout` أو `block_public_connections` | ⛔ **BLOCKED** — مرفوض من الخطة، ويحتاج ترقية مدفوعة أو عناوين خروج |
| B3 | تطبيق الترحيلات على الهدف المعزول | ✅ **DONE** — 25/25 APPLIED، parity `PARITY`، posture 8/8 |
| B4 | إنشاء `ops.aigas_migration_ledger` على الإنتاج | ⛔ **BLOCKED** |
| B5 | إنشاء Login لـ`aigas_runtime` أو تخزين سره | ⏸️ **READY** على الهدف المعزول فقط |
| B6 | تعطيل/تقييد Data API على `public` | ✅ لا ينطبق على الهدف (بلا Data API)؛ ⛔ على الإنتاج |
| B7 | أي snapshot/restore خارجي، وقياس RPO/RTO | ⛔ **BLOCKED** — بوابة P17 |
| B8 | تعديل `0016` لسحب `authenticated`/`anonymous` | ✅ **DONE** 2026-11-10 بتفويض المالك |
| B9 | تحصين `0018`/`0025` بـ`to_regrole` (خيار 2.0.2/ب) | ✅ **DONE بتفويض** — شمل `0028` أيضًا؛ يغيّر ثلاثة hashes؛ مُثبت بمرحلة `client_roles_absent` 25/25 |
| B10 | commit / push / merge / نشر | ⛔ **BLOCKED** |

**الصلاحية التقنية للأداة ليست تفويضًا.**

---

## 10. معايير قبول P02

| المعيار | الحالة |
|---|---|
| Parity موثّقة بين الكتالوج الحي والهدف المبني من `migrations/` | ✅ محليًا (`parity.json`، verdict `DRIFT` متوقع ومفسّر بندًا بندًا) |
| hashes لكل ملف ترحيل + انحراف المرجع | ✅ (`migration-ledger.json`) |
| ترتيب ترحيلات مثبت بـpass/fail لا برأي | ✅ fresh 25/25، delta 26/26 |
| حراس `0019`/`0025`/`0027` مثبتة بالرفض الفعلي | ✅ 3/3 |
| مراجعة `SECURITY DEFINER` لـ`0016` | ✅ عيب مؤكد + دليل قبل/بعد |
| بيئة معزولة موثقة | ✅ محلية PG18.6 **+** هدف Neon معزول مُنشأ (`aigas-staging`) وغير محميِّ بسبب حد الخطة |
| عدم مساس بيانات العملاء | ✅ صفر صفوف، SELECT فقط، ولا أسرار |
| استعادة + RPO/RTO | ❌ **P17، بوابة منفصلة** |

**الحالة العامة: `DONE` للنطاق المعزول — 25/25 مطبقة على الهدف، `0018`/`0025`/`0028` محصّنة (B9 مغلق)، parity `PARITY`، posture 8/8؛ تبقّى حماية الفرع/scale-to-zero (B2، مدفوع)، ومسار `delta` على Neon، واستعادة P17، وبنود runbook الثلاثة (تهيئة `neon_auth`، عضوية `SET TRUE`، سحب `EXECUTE` من `PUBLIC`).**
