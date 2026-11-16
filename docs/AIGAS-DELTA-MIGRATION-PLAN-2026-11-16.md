# خطة Delta والتحقق والتراجع — AIGAS / BRIGHT AI

> **الحالة:** `PROPOSED — NOT APPROVED — NOT APPLIED`
> **التاريخ:** 2026-11-16
> **النطاق:** الانتقال من Production الحالي (31 جدولًا، سياستان، بلا runtime/ledger) إلى رأس Staging (42 جدولًا، 90 سياسة، 29/29 ledger) مع إغلاق فجوة `0033`، ثم cutover إلى دور تشغيل أقل صلاحية.
> **الأساس:** `Audit/tenant-isolation-2026-11-16/REPORT.md`، `production-baseline.json`، `staging-posture.json`، `local-rls-matrix.json`.
> **قاعدة:** لا يُنفّذ أي أمر هنا على Neon Production أو Staging. كل تنفيذ يحتاج اعتماد المالك والمشغّل في نافذة معلنة.

---

## 1. مبادئ غير قابلة للتفاوض

1. **Forward-only:** لا تُعدّل مهاجرة مطبقة. أي إصلاح يأتي برقم جديد. سبب: ledger يربط `filename` بـ`sha256`، وتغيير ملف مطبّق يفسد الاستئناف.
2. **Transaction per migration:** كل مهاجرة وreceiptها في معاملة واحدة (`applyMigration`). لا تقسيم يدوي.
3. **لا owner DSN للتطبيق:** المالك للترحيلات وops فقط. التطبيق على `aigas_runtime` (`NOBYPASSRLS`).
4. **RLS ليست بديلًا عن الفحوص:** كل مسار منتج يحتفظ بشرط `tenant_id` الصريح. RLS طبقة ثانية.
5. **Staging ليس Public Demo:** `/demo/*` static مستقل. لا خدمة عامة تتصل بـStaging.
6. **Live 48h مغلقة** حتى نجاح RLS/identity/role على المصدر العامل، لا على المحلي فقط.
7. **الاستعادة قبل التغيير:** فرع pre-change + استعادة مثبتة. نجاح snapshot ليس دليل استعادة.

---

## 2. البوابات (يجب أن تُغلق بالترتيب)

| البوابة | الشرط | المسؤول | الحالة |
|---|---|---|---|
| G0 | موافقة Owner على الخطة والنافذة، وتعيين Operator مستقل | Owner | NOT STARTED |
| G1 | إثبات استعادة على فرع معزول (`verify-restore-rehearsal.mjs`) | Operator | NOT RUN |
| G2 | حماية `production` والفرع المؤقت، وتقصير صلاحية الوصول | Owner | NOT RUN |
| G3 | Preflight Production PASS (baseline 31 + drift المتوقع) | Operator | READY TO RUN |
| G4 | تطبيق Delta + 0034 على Production، وledger متسق | Operator | NOT RUN |
| G5 | Post-apply posture PASS (42 جدولًا، ≥91 سياسة، runtime، صفر منح عميل) | Reviewer | NOT RUN |
| G6 | Staging behavioral verification PASS (كتابة اصطناعية) | Operator + Reviewer | PARTIAL (قراءة فقط PASS) |
| G7 | Runtime cutover + smoke PASS مع `AIGAS_REQUIRE_RLS=true` | Operator | NOT RUN |
| G8 | فتح Live 48h بقرار مكتوب بعد G7 + readiness/quota/operator | Owner | CLOSED |

**لا تُفتح G8 قبل G7.** ولا تُعتمد G4 قبل G6.

---

## 3. Preflight Production (قراءة فقط)

شغّل من جلسة قراءة معتمدة (أو MCP read-only). المتوقع:

```sql
-- 3.1 الشكل الأساسي: 31 جدولًا بالضبط، والصفر غير AIGAS
SELECT count(*) AS tables,
       count(*) FILTER (WHERE tablename LIKE 'aigas\_%') AS aigas_tables
FROM pg_tables WHERE schemaname='public';
-- المتوقع: 31 / 31

-- 3.2 لا ledger مسبق ولا ops
SELECT to_regclass('ops.aigas_migration_ledger') AS ledger;  -- NULL
SELECT nspname FROM pg_namespace WHERE nspname='ops';       -- لا صف

-- 3.3 لا runtime مسبق (أو سماته صحيحة فقط)
SELECT rolname,rolcanlogin,rolbypassrls,rolinherit,rolsuper
FROM pg_roles WHERE rolname='aigas_runtime';                -- لا صف متوقع

-- 3.4 drift معروف فقط
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='aigas_audit_events'
  AND column_name IN ('correlation_id','policy_version','idempotency_key'); -- 0 صفوف
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='aigas_re_treatment_revisions'
  AND column_name LIKE 'residual\_%';                       -- 0 صفوف
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='aigas_policy_versions'
  AND column_name='required_approvals';                     -- 1 صف (0020 جزئي، والملف محروس)

-- 3.5 لا تكرار يمنع الفهارس الفريدة (0022)
SELECT count(*) FROM (
  SELECT request_id FROM public.aigas_fw_decisions
  WHERE request_id IS NOT NULL GROUP BY request_id HAVING count(*)>1
) d;                                                        -- 0
SELECT count(*) FROM (
  SELECT id FROM public.aigas_sc_requests GROUP BY id HAVING count(*)>1
) d;                                                        -- 0

-- 3.6 لا كائنات غير AIGAS في public (0025 يسحب PUBLIC من كل الدوال/الجداول)
SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT LIKE 'aigas\_%'; -- 0
SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname NOT LIKE 'aigas\_%';                  -- 0
```

**إيقاف إلزامي:** أي انحراف عن 31/31، أو وجود ledger، أو duplicates، أو كائن غير AIGAS ⇒ توقف. لا «تجاهل وتحايل».

### 3.1 فحص Data API (control plane)

| القياس | Production الحالي | القرار |
|---|---|---|
| `status` | `active` | يجب تعطيله (الخيار A) أو تقييده بمخطط غير `public` |
| `db_schemas` | `["public"]` | مرفوض للـBeta |
| `db_anon_role` | `anonymous` | لا يُترك مع منح AIGAS |
| `db_aggregates_enabled` | `true` | يُعطّل مع الإغلاق |

لا يغيّر SQL هذه الإعدادات. هي إجراء Owner، ومشروطة ببوابة الاستعادة. يمكن تطبيق `0025` قبل تعطيل Data API لأنها تسحب منح العميل، لكن **الاعتماد النهائي** يتطلب `get_data_api` = 404/`db_schemas != public`.

---

## 4. ترتيب Delta

`DELTA_ORDER` الحالي (من `scripts/migration-order.mjs`):

| # | ملف | لماذا | مخاطر/اعتماد |
|---|---|---|---|
| 1 | `0013` | حارس سلسلة Ledger | مستقل؛ يعيد إنشاء trigger |
| 2 | `0014` | جداول delegations/grants لـHuman Gate | يجب قبل 0025 |
| 3 | `0016` | `aigas_sc_usage_window_v2` | مستقل |
| 4 | `0017` | أعمدة audit context | **بلا حراسة**؛ الأعمدة غائبة حاليًا |
| 5 | `0018` | Data API grant hardening | يجب قبل 0025 |
| 6 | `0020` | required_approvals/WITHDRAWN | محروس؛ العمود موجود مسبقًا |
| 7 | `0021` | acceptance guard | `CREATE OR REPLACE` |
| 8 | `0022` | فهارس مرجع عالمية | يجب قبل 0025؛ افحص duplicates |
| 9 | `0023` | جداول التجربة | يجب قبل 0030 |
| 10 | `0025` | RLS/الأدوار/المنح | **جوهر التغيير**؛ يجب بعد 0014/0018/0022/0023 |
| 11 | `0026` | residual/acceptance | **بلا حراسة**؛ الأعمدة غائبة |
| 12 | `0027` | Secure Chat participant-only + FORCE | بعد 0025 |
| 13 | `0028` | membership lock definer | بعد 0025 |
| 14 | `0029` | ledger required reference | مستقل |
| 15 | `0024` | catalog parity repair | بعد 0029 (كما هو معتمد) |
| 16 | `0030` | trial server cycle | بعد 0023/0025 |
| 17 | `0031` | risk treatment runtime lock | بعد 0026/0028 |
| 18 | `0032` | trigger execute lock | بعد 0030 |
| 19 | `0033` | exploration | بعد 0025 |
| 20 | **`0034` (مقترح)** | إغلاق client deny + banned check | بعد 0033 |

**التغيير المطلوب قبل التنفيذ:** إنشاء `migrations/0034_aigas_tenant_isolation_delta.sql` من `Audit/tenant-isolation-2026-11-16/proposed-0034.sql`، وإضافة `'0034'` إلى `DELTA_ORDER` بعد `'0033'`، وتحديث `scripts/verify-runtime-rls.mjs` بإضافة `aigas_exploration_grants` إلى `readOnly` (وإلا يبقى `runtime-verb-matrix-exact` فاشلًا حتى بعد الإصلاح).

**تحقق الترتيب بعد التعديل:**
```bash
node --test tests/migration-order.test.mjs
node scripts/apply-migrations.mjs --mode delta --dry-run
# المتوقع: 20 خطوة، 0034 آخرها
```

---

## 5. `0034` المقترح (forward-only)

الملف الكامل: `Audit/tenant-isolation-2026-11-16/proposed-0034.sql`.

ملخص:
1. `aigas_client_deny` restrictive على `aigas_exploration_grants`.
2. سحب كل المنح/EXECUTE عن العميل من الجدول والدالة (idempotent).
3. إعادة تعريف `aigas_is_tenant_member` لتشترط `u.banned IS NOT TRUE`.
4. Postcondition يفشل إذا بقي أي جدول AIGAS بلا client deny.

**لماذا لا يُعدّل `0033`؟** لأنه مطبق على Staging بـhash `faa5dc3b8554…`، وأي تعديل يجعله `MODIFIED_AFTER_REFERENCE` ويكسر `resumeOrder`.

**بعد 0034:** Staging يصبح 91 سياسة، والمصفوفة المحلية يجب أن تعود 74/74 بعد تحديث expected matrix.

---

## 6. Bootstrap بعد cutover — `0035` (مقترح، ليس ضمن 0034)

**المشكلة:** `aigas_runtime` لا يملك INSERT على `aigas_tenants`، و`createWorkspace` يكتب مباشرة. كذلك قبول الدعوة يقرأ `aigas_member_invitations` قبل وجود عضوية. النتيجة: cutover بلا bootstrap يعطّل أول مساحة عمل والدعوات.

**الحل المقترح:** دالة `SECURITY DEFINER` واحدة ضيقة:

```sql
CREATE OR REPLACE FUNCTION public.aigas_bootstrap_workspace(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor uuid := public.aigas_actor();
  v_id uuid := gen_random_uuid();
  v_owned integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authenticated actor required' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM neon_auth."user" u WHERE u.id=v_actor AND u.banned IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'Active identity required' USING ERRCODE='42501';
  END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Workspace name must be 2..100 characters' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_actor::text,0));
  SELECT count(*) INTO v_owned FROM public.aigas_memberships
   WHERE user_id=v_actor AND role='OWNER';
  IF v_owned >= 10 THEN
    RAISE EXCEPTION 'Workspace ceiling reached' USING ERRCODE='P0001';
  END IF;
  INSERT INTO public.aigas_tenants(id,name) VALUES(v_id,btrim(p_name));
  INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES(v_id,v_actor,'OWNER');
  INSERT INTO public.aigas_product_access(tenant_id,product_slug)
    SELECT v_id, unnest(ARRAY['firewall','ledger','human-gate','risk-engine','secure-chat']);
  INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action)
    VALUES(gen_random_uuid(),v_id,v_actor,'workspace.created');
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.aigas_bootstrap_workspace(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_bootstrap_workspace(text) TO aigas_runtime;
```

**شروط القبول:**
- لا يقبل `owner` أو `tenant` من المتصل؛ الفاعل من GUC الموثّق.
- سقف 10 مساحات كما في الكود.
- اختبار: مستخدم A ينشئ مساحة واحدة؛ لا يرى مساحة B؛ لا يستطيع إنشاء عضوية لدور آخر.
- يتطلب تعديل `createWorkspace` لاستدعاء الدالة بدل INSERT المباشر (PR منفصل).
- قبول الدعوة يحتاج دالة bootstrap مشابهة أو قناة privileged منفصلة؛ لا تُفتح الدعوات قبل ذلك.

---

## 7. تحقق Staging السلوكي (المطلوب قبل G4)

يُنفّذ على Staging فقط، بموافقة Owner، وببيانات اصطناعية، ومن جلسة DBA، وكل خطوة داخل معاملة تُغلق بـ`ROLLBACK` ما لم يُنص على خلاف ذلك.

| # | الاختبار | المتوقع |
|---|---|---|
| S1 | `aigas_runtime` بلا GUCs يقرأ `aigas_fw_rules` | 0 صفوف |
| S2 | Tenant A + actor A يقرأ جداوله | صفوف A فقط |
| S3 | Tenant A + actor A يحاول `INSERT tenant_id=B` | `42501` / RLS violation |
| S4 | Tenant A + actor A يحاول `UPDATE` صف B | 0 صفوف |
| S5 | غير عضو يضبط GUCs لـA | 0 صفوف، `tenant_scope(A)=false` |
| S6 | `aigas_lock_member(A, outsider)` | 0 صفوف |
| S7 | عضو يحاول `UPDATE` عضويته لدور أعلى | 0 صفوف (سياسة `user_id <> actor`) |
| S8 | `SET ROLE authenticated` ثم `SELECT/INSERT` على AIGAS | `42501` على الجدول والدالة |
| S9 | GUC بعد `COMMIT`/`ROLLBACK` | سلسلة فارغة، لا `tenant_id` |
| S10 | `aigas_exploration_consume` سباق على آخر وحدة | نجاح واحد فقط، والثاني `EXPLORATION_QUOTA_EXCEEDED` |
| S11 | منحة منتهية/ملغاة | `EXPLORATION_EXPIRED` |
| S12 | runtime `UPDATE aigas_exploration_grants` مباشرة | `42501` |
| S13 | `aigas_trial_consume_quota` مفتاحان متزامنان | لا تجاوز للسقف؛ replay بنفس المفتاح لا يضاعف |
| S14 | `aigas_trial_consume_quota` بعد `CLOSED`/`CANCELLED` | رفض `TRIAL_NOT_ACTIVE` |
| S15 | `pg_stat_activity` لاتصال الخدمة | `current_user` = login، وبعد SET ROLE = `aigas_runtime` |

**ما أُنجز قراءة فقط (2026-11-16):** S1/S2/S4/S5/S6 جزئيًا PASS (SELECT فقط). S3/S7/S8–S15 **NOT RUN** (تحتاج كتابة/اتصال خدمة).

**سجل الأدلة:** أضف `Audit/tenant-isolation-2026-11-16/staging-behavioral.json` بعد التنفيذ. لا تسجل DSN أو توكنات أو محتوى.

---

## 8. تطبيق Production (بعد G0–G3 وG6)

### 8.1 قبل التطبيق

1. أنشئ فرعًا `pre-delta-YYYYMMDD-HHMM` من `production`، وفعّل حمايته، وسجّل LSN/الوقت.
2. استعد الفرع في فرع منفصل وتحقق:
```bash
DATABASE_URL_UNPOOLED=<source> RESTORE_DATABASE_URL=<restore> \
node scripts/verify-restore-rehearsal.mjs \
  --source-env DATABASE_URL_UNPOOLED --target-env RESTORE_DATABASE_URL
```
3. أبقِ `AIGAS_APP_ENABLED=false`.
4. جهّز DSN ترحيل **unpooled** بدور يملك DDL/DCL (المالك أو migration role)، ولا تطبعه.

### 8.2 التطبيق

```bash
DATABASE_URL_UNPOOLED=<approved-unpooled-dsn> \
node scripts/apply-migrations.mjs \
  --mode delta \
  --confirm-live-baseline \
  --expected-host <approved-host> \
  --expected-database neondb
```

- 20 خطوة بعد إضافة 0034.
- كل خطوة + receipt في معاملة. أي فشل: توقف، اقرأ `FAILED` في `ops.aigas_migration_ledger`، لا تعِد المحاولة قبل معرفة السبب.
- لا تستخدم `--mode resume` إلا بعد التأكد أن كل hash مطابق. لا تعدّل ملفًا مطبقًا.
- إن فشلت خطوة بعد إنشاء الجداول، لا تحذف يدويًا؛ استخدم فرع pre-change أو forward-fix.

### 8.3 Post-apply (قراءة فقط)

```sql
SELECT count(*) FROM pg_tables WHERE schemaname='public';            -- 42
SELECT count(*) FROM pg_policies WHERE schemaname='public';          -- ≥91
SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity; -- 0
SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\_%'
  AND NOT EXISTS (SELECT 1 FROM pg_policies p
    WHERE p.schemaname='public' AND p.tablename=c.relname
      AND p.policyname='aigas_client_deny');                         -- 0
SELECT role,cmd,roles::text FROM pg_policies
WHERE schemaname='public' AND tablename='aigas_exploration_grants';  -- deny + read
SELECT rolname,rolbypassrls FROM pg_roles WHERE rolname='aigas_runtime'; -- false
SELECT count(*) FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('authenticated','anonymous'); -- 0
SELECT count(*) FROM ops.aigas_migration_ledger WHERE status='APPLIED';   -- 20
```

أي فشل ⇒ لا cutover، ولا Live، واستعادة/forward-fix حسب §9.

---

## 9. Restore / Rollback

### 9.1 مبادئ

- **DDL ليس له rollback معاكس آمن** بعد revokes/constraints. التراجع المعتمد = استعادة فرع pre-change، وليس كتابة DROP عشوائي.
- PITR الإنتاج = **6 ساعات** فقط. إن تجاوزت النافذة، لا تعتمد عليه. الفرع pre-change هو خطة التراجع الأساسية.
- `ops.aigas_migration_ledger` يبقى دليلًا؛ لا تحذفه.

### 9.2 شجرة القرار

| الحالة | الإجراء |
|---|---|
| فشل preflight | توقف. لا تغيير. صحّح الانحراف في بيئة معزولة. |
| فشل مهاجرة واحدة | المعاملة rollback تلقائي + receipt `FAILED`. أصلح السبب، ثم `--mode resume --confirm-existing-ledger` بعد التحقق من hashes. |
| فشل post-apply posture | لا cutover. إن كان العيب في 0034 فقط: forward-fix `0035` (DROP/إنشاء السياسة). إن كان في 0025/0027: استعادة الفرع. |
| فشل cutover | أعد `DATABASE_URL` إلى آخر DSN معروف (يفضل مالك break-glass) مع `AIGAS_APP_ENABLED=false`، ثم أعد النشر السابق. لا تفتح البوابة. |
| فشل بعد Live | أغلق البوابة فورًا، أوقف المهام، استخدم فرع pre-change أو PITR إن كان ضمن 6 ساعات. |
| تسريب/عزل مكسور | أغلق Data API، أوقف الخدمة، استعد، وأبلغ Owner/Reviewer. لا تحاول «إصلاحًا سريعًا» على الإنتاج. |

### 9.3 استعادة الفرع

1. أنشئ فرعًا جديدًا من `pre-delta-…` (أو PITR إن كان ضمن النافذة).
2. شغّل `verify-restore-rehearsal.mjs` بين الفرع الحالي والمستعاد.
3. وجّه DSN للخدمة إلى المستعاد فقط بعد موافقة Owner، وأبقِ البوابة مغلقة حتى smoke.
4. سجّل: الفرع، LSN/الوقت، السبب، من وافق، وما فُقد.

### 9.4 Rollback موضعي لـ0034

```sql
-- فقط إذا كان 0034 هو العيب الوحيد وبموافقة مكتوبة
DROP POLICY IF EXISTS aigas_client_deny ON public.aigas_exploration_grants;
-- إعادة تعريف aigas_is_tenant_member بالنسخة السابقة من 0025
```
لا يُستخدم هذا لإعادة فتح منح العميل. إعادة الفتح قرار معماري مرفوض.

---

## 10. Runtime cutover (G7)

1. **أنشئ login مخصصًا** (خارج SQL المتتبع):
```sql
CREATE ROLE aigas_app_login LOGIN PASSWORD '<from-secret-store>' NOINHERIT;
GRANT aigas_runtime TO aigas_app_login WITH SET TRUE;
```
لا تضع كلمة المرور في Git أو docs.
2. **اربط الاتصال بالدور:** إما `options=-c role=aigas_runtime` في DSN (URL-encoded)، أو `SET ROLE aigas_runtime` بعد الاتصال في `db.mjs`. لا تعتمد على `NOINHERIT` وحدها.
3. **اضبط** `AIGAS_REQUIRE_RLS=true` و`AIGAS_APP_ENABLED=false` أولًا.
4. **Smoke محلي/Staging** قبل Production:
   - `/healthz/` = 200، و`/app/api/kernel/health` = حالة متسقة.
   - `createWorkspace` عبر `aigas_bootstrap_workspace` (0035).
   - dashboard + product browse + cross-tenant denial.
   - `pg_stat_activity`: `current_user=aigas_runtime` بعد SET ROLE، و`rolbypassrls=false`.
5. **بعد النجاح فقط:** `AIGAS_APP_ENABLED=true`، ثم Live gate.
6. **تراجع فوري:** أعد DSN السابق، أعد `AIGAS_APP_ENABLED=false`، وأعد النشر السابق.

**لا تحوّل DSN قبل 0035.** بدونه ستفقد إنشاء المساحات والدعوات.

---

## 11. بوابة Live 48h

يُفتح Live فقط عند تحقق كل ما يلي، بدليل مرفق:

- [ ] G0–G7 مكتملة وموقعة.
- [ ] RLS/identity/role isolation PASS على **المصدر العامل** (Production بعد cutover)، وليس المحلي فقط.
- [ ] `aigas_runtime` هو دور الاتصال، و`AIGAS_REQUIRE_RLS=true`.
- [ ] فحص A/B سلوكي على Staging: INSERT/UPDATE/DELETE مرفوضة عبر الحدود.
- [ ] `client_roles_absent` = 0 منح، و`aigas_client_deny` على 100% من الجداول.
- [ ] Data API معطّل أو `db_schemas != public`.
- [ ] فرع pre-change محمي، واستعادة مثبتة، ونافذة PITR مفهومة (6h).
- [ ] `aigas_trial_operators` مشغّل مستقل عن مقدّم الطلب، و`aigas_release_readiness` PASS لكل منتج/إصدار/بيئة، و`aigas_trial_quota_limits` معتمدة.
- [ ] 0 منح استكشاف نشطة قبل الفتح؛ ثم تُنشأ بمرجع اعتماد وسقف معلن.
- [ ] سقف reservations/rate limit لـ`aigas_trial_consume_quota` (F10).
- [ ] `close` يغلق entitlements (F11).
- [ ] خطة إغلاق فوري: `AIGAS_APP_ENABLED=false` + إلغاء المنح + تدوير الجلسات.

**الوضع الحالي:** البوابة مغلقة بالغياب: 0 grants نشطة، 0 readiness، 0 quota، 0 trials. لا تفتحها بإنشاء بيانات فقط؛ الانتظار حتى G7.

---

## 12. المختبر العام (مستقل)

- `/demo/*` = `prerender=true`، بلا layout تحليلات، بلا Auth، بلا API، `connect-src 'none'`.
- المدخلات في الذاكرة، reset عند التنقل، بلا تخزين.
- `/products/` `#lab` يستخدم نفس المحاكاة بلا اتصال بخدمة.
- **ممنوع:** ربط `/demo/*` بـStaging DB، أو إضافة `workspace`/توكن إلى روابطه، أو إضافة endpoint جديد للمختبر.
- يمكن فتح المختبر العام قبل Live بأمان؛ هو لا يعتمد على G4/G7.

---

## 13. الاعتمادات والتوقيع

| القرار | صاحب الاعتماد | مطلوب قبل |
|---|---|---|
| الخطة والنافذة | Owner | G0 |
| إنشاء فرع pre-change وحمايته | Owner | G1/G2 |
| تعطيل/تقييد Data API | Owner (Neon) | G8 |
| تطبيق Delta على Production | Owner + Operator مستقل | G4 |
| إنشاء login/سر runtime | Owner/Operator | G7 |
| فتح Live 48h | Owner + Reviewer أمني | G8 |
| قبول مخاطر PITR 6h | Owner | G1 |

**الحالة النهائية لهذه الخطة:** `PROPOSED — NOT APPROVED — NOT APPLIED`.
