# التحقق التشغيلي من عزل المؤسسات — سيناريو Tenant A/B

> الحالة: **PARTIAL — نُفِّذت المصفوفة على عنقود محلي معزول، ولقطة وضع على هدف staging بقراءة فقط. الخطوات التي تحتاج خدمة حقيقية أو بيانات حيّة ما زالت `NOT RUN`.**
> الدليل: `Audit/p03-runtime-rls-2026-11-10/REPORT.md`، `local-runtime-rls.json` (69/69)، `neon-staging-posture.json` (9/9 قراءة فقط).
> لا يُشغّل على `production`. يُشغّل فقط على فرع staging معزول بعد موافقة مالك Neon ومراجع أمني.
> لا تُلصق Connection URI أو كلمات مرور أو توكنات في هذا الملف أو في logs.

## 0. ما نُفِّذ فعليًا (P03)

| البند | البيئة | النتيجة |
|---|---|---|
| RLS/ملكية/سمات الدور/`FORCE`/السياسات/`EXECUTE` | عنقود PG18.6 محلي مؤقت | `PASS` — 69/69 |
| Tenant A/B: CRUD، غير عضو، GUC switch، `COPY`/تصدير | عنقود محلي (بيانات اصطناعية) | `PASS` |
| محتوى Secure Chat participant-only بما فيه ADMIN غير مشارك | عنقود محلي بدور اختبار بمنحة داخل العنقود | `PASS` |
| كتالوج وضع الهدف المعزول | Neon staging، `SELECT` فقط | `PASS` — 9/9 (36 جدولًا/77 سياسة/25 دالة، صفر منح للعميل) |
| الخدمة متصلة بـ`aigas_runtime` (`pg_stat_activity`) | — | `NOT RUN` — يحتاج login/سر نافذة cutover |
| خطوات `SET ROLE` أدناه على الهدف | Neon staging | `NOT RUN` — تحتاج كتابة/معاملات على هدف معتمد؛ أُجريت محليًا بدلًا منها |
| REST فعلي بعد تقييد Data API | — | `NOT RUN` — يحتاج تفويض control plane |

يظل §2 هو سيناريو نافذة cutover، لا وصفًا لما أُنجز.

## 1. الشروط المسبقة

1. موافقة مالك Neon على إنشاء فرع staging مؤقت ونقطة استعادة، وموافقة مالك BRIGHT AI على نافذة الاختبار.
2. تطبيق `0018` ثم `0022` ثم `0025` ثم `0027` على staging فقط، والتحقق من `pg_policies` و`relrowsecurity` و`relforcerowsecurity` و`pg_default_acl` و`role_table_grants`. **لا يُطبق `0019`**؛ `0025` يتجاوزه، وتطبيقه بعده يعيد فتح منح واسعة.
3. إنشاء Login لـ`aigas_runtime` خارج SQL (`ALTER ROLE aigas_runtime LOGIN PASSWORD ...`)، أو Login منفصل يبدأ بـ`SET ROLE aigas_runtime` (مثل `options=-c role=aigas_runtime`)، وتخزين السر في secret store مؤقت خاص بـstaging. `NOINHERIT` يعني أن مجرد العضوية لا تمنح الصلاحيات.
4. تعيين `DATABASE_URL` في خدمة staging إلى دور `aigas_runtime`، وتعيين `AIGAS_REQUIRE_RLS=true` ليجعل مسارات المنتجات ترفض اتصالًا يتجاوز RLS، ثم إعادة تشغيل الخدمة.
5. إخراج `public` من `db_schemas` في Data API، أو تعطيل Data API على staging.
6. بيانات اصطناعية فقط: مستخدمون `tenant-a-owner@example.invalid` و`tenant-b-owner@example.invalid` أو معرّفات UUID ثابتة، ومؤسستان A/B بلا أي بيانات عمل حقيقية.
7. `0016` مطبق قبل اختبار `aigas_sc_usage_window_v2`؛ بدونه لا يُختبر مسار الحصة، ويبقى `NOT_CONFIGURED` لا `FAIL`.

## 2. سيناريو التحقق

نفّذ كل خطوة داخل معاملة، وسجّل `SQLSTATE` وعدد الصفوف و`current_user` والوقت. لا تنسخ DSN.

> **مهم:** خطوات `SET ROLE` تُنفذ من جلسة DBA مخوّلة (مالك Neon/المشغّل المعتمد)، وليست من اتصال خدمة `aigas_runtime`. اختبر دور runtime باتصال منفصل أو بـ`SET ROLE aigas_runtime` من جلسة DBA. لا تمنح `aigas_runtime` عضوية في `authenticated`/`neondb_owner` لأجل الاختبار.

```sql
-- 0) هوية الاتصال ووضع RLS
SELECT current_user, r.rolsuper, r.rolbypassrls
FROM pg_roles r WHERE r.rolname = current_user;
-- المتوقع: aigas_runtime, false, false

-- 1) عضوية A: قراءة صفوف المؤسسة A فقط
BEGIN;
SELECT set_config('aigas.user_id', '<USER_A_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
SELECT tenant_id, count(*) FROM public.aigas_fw_decisions GROUP BY tenant_id;
-- المتوقع: TENANT_A فقط، أو صفر صفوف قبل إدخال أي بيانات. لا يظهر TENANT_B.
ROLLBACK;

-- 2) إدخال صف لـA ثم محاولة إدخال صف يخص B بنفس السياق
BEGIN;
SELECT set_config('aigas.user_id', '<USER_A_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
INSERT INTO public.aigas_fw_rules (id, tenant_id, name, match_type, pattern, action, priority)
VALUES (gen_random_uuid(), '<TENANT_A_UUID>', 'synthetic-a', 'TEXT', 'x', 'ALLOW', 1);
-- المتوقع: نجاح.
INSERT INTO public.aigas_fw_rules (id, tenant_id, name, match_type, pattern, action, priority)
VALUES (gen_random_uuid(), '<TENANT_B_UUID>', 'synthetic-b-cross', 'TEXT', 'x', 'ALLOW', 1);
-- المتوقع: رفض RLS بـ42501 أو "new row violates row-level security policy".
ROLLBACK;

-- 3) قراءة عابرة للمؤسسة
BEGIN;
SELECT set_config('aigas.user_id', '<USER_A_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
SELECT count(*) FROM public.aigas_fw_rules WHERE tenant_id = '<TENANT_B_UUID>';
-- المتوقع: 0، وليس خطأ يكشف وجود الصف.
ROLLBACK;

-- 4) مرجع طلب معاد استخدامه بين مؤسستين
BEGIN;
SELECT set_config('aigas.user_id', '<USER_A_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
INSERT INTO public.aigas_fw_decisions (id, tenant_id, action, reason, mode, request_id, policy_version)
VALUES (gen_random_uuid(), '<TENANT_A_UUID>', 'ALLOW', 'synthetic', 'GUARD', '<REQUEST_UUID>', 'v1');
COMMIT;

BEGIN;
SELECT set_config('aigas.user_id', '<USER_B_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_B_UUID>', true);
INSERT INTO public.aigas_fw_decisions (id, tenant_id, action, reason, mode, request_id, policy_version)
VALUES (gen_random_uuid(), '<TENANT_B_UUID>', 'ALLOW', 'synthetic', 'GUARD', '<REQUEST_UUID>', 'v1');
-- المتوقع: 23505 من aigas_fw_decisions_request_scope_idx، وليس إدخالًا ناجحًا.
ROLLBACK;

-- 5) دور عميل Data API
SET ROLE authenticated;
SELECT count(*) FROM public.aigas_tenants;
-- المتوقع: 42501 permission denied. ثم RESET ROLE.

-- 6) عدم بقاء السياق بعد المعاملة
BEGIN;
SELECT set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
COMMIT;
SELECT current_setting('aigas.tenant_id', true);
-- المتوقع: سلسلة فارغة أو غير المعرّف، وليس TENANT_A.

-- 7) قفل الصف بـFOR UPDATE بعضوية MEMBER (تسلسل الطلبات)
BEGIN;
SELECT set_config('aigas.user_id', '<MEMBER_A_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
SELECT id FROM public.aigas_tenants WHERE id = '<TENANT_A_UUID>' FOR UPDATE;
-- المتوقع: يعيد الصف. إن رفض RLS القفل، استبدل قفل tenants في الكود
-- بـpg_advisory_xact_lock قبل cutover؛ لا توسّع سياسة UPDATE للمستخدم العادي.
ROLLBACK;

-- 8) دور المالك: يثبت سبب عدم استخدامه كدور خدمة
-- نفّذ من جلسة إدارية منفصلة، وليس عبر aigas_runtime.
SET ROLE neondb_owner;
SELECT count(*) FROM public.aigas_fw_rules;
-- المتوقع: يرى كل الصفوف (rolbypassrls=true). سجّل ذلك كدليل على أن المالك
-- ليس دور العزل، وليس كنجاح. ثم RESET ROLE.

-- 9) Data API / دور الهوية
SET ROLE authenticated;
SELECT count(*) FROM public.aigas_tenants;          -- المتوقع: 42501
SELECT count(*) FROM public.aigas_sc_messages;      -- المتوقع: 42501
INSERT INTO public.aigas_fw_rules (id, tenant_id, name, pattern, action)
VALUES (gen_random_uuid(), '<TENANT_A_UUID>', 'x', 'x', 'ALLOW'); -- المتوقع: 42501
SELECT public.aigas_sc_usage_window('<TENANT_A_UUID>', '<USER_A_UUID>'); -- المتوقع: 42501
RESET ROLE;

SET ROLE anonymous;
SELECT count(*) FROM public.aigas_tenants;          -- المتوقع: 42501
RESET ROLE;

-- 10) Auth directory
SET ROLE aigas_runtime;
SELECT id, name, email, banned, "emailVerified" FROM neon_auth."user" LIMIT 1;
-- المتوقع: مسموح بهذه الأعمدة فقط.
INSERT INTO neon_auth."user" (id) VALUES ('00000000-0000-0000-0000-000000000000');
-- المتوقع: 42501 (لا كتابة).
SELECT count(*) FROM neon_auth.session; -- المتوقع: 42501 (لا منح على session)
RESET ROLE;

SET ROLE authenticated;
SELECT count(*) FROM neon_auth."user";   -- المتوقع: 42501
RESET ROLE;

-- 11) محتوى Secure Chat — participant-only
SET ROLE aigas_runtime;
BEGIN;
SELECT set_config('aigas.user_id', '<USER_A_UUID>', true),
       set_config('aigas.tenant_id', '<TENANT_A_UUID>', true);
INSERT INTO public.aigas_sc_conversations
  (tenant_id, user_id, id, expires_at, retention_policy_ref, opt_in_at)
VALUES ('<TENANT_A_UUID>', '<USER_A_UUID>', gen_random_uuid(),
        now() + interval '1 day', 'synthetic-retention', now());
-- المتوقع بعد 0027: 42501 لأن aigas_runtime بلا منح على جدولي المتن.
ROLLBACK;
RESET ROLE;
-- أعِد الفحص بدور يملك منحة اصطناعية مؤقتة في staging فقط:
-- INSERT لصف A ينجح؛ SELECT/INSERT لصف user B في نفس المؤسسة يفشل؛
-- OWNER لا يقرأ محتوى غيره. لا تمنح هذا الدور في production.

-- 12) بقاء النطاق بعد المعاملة
SET ROLE aigas_runtime;
BEGIN;
SELECT set_config('aigas.tenant_id', '<TENANT_A_UUID>', true),
       set_config('aigas.user_id', '<USER_A_UUID>', true);
COMMIT;
SELECT current_setting('aigas.tenant_id', true),
       current_setting('aigas.user_id', true);
-- المتوقع: '' أو غير معرّف، وليس قيم A.
RESET ROLE;

-- 13) Data API نفسه بعد الخيار A/B
-- من خارج SQL: طلب REST بلا JWT وبـJWT مصطنع إلى /rest/v1/aigas_tenants.
-- المتوقع: 404/401/42501، ولا صف واحد من public.aigas_*.
-- إن بقي 200 مع صفوف، فالخيار A/B لم يُطبق: أوقف الاختبار.
```

## 3. معايير النجاح

- `current_user=aigas_runtime`, `rolsuper=false`, `rolbypassrls=false`.
- لا يظهر أي صف من B في سياق A، ولا صف من A في سياق B.
- محاولة الكتابة لمؤسسة أخرى تفشل بـ`42501` من RLS.
- إعادة استخدام `request_id` بين مؤسستين تفشل بـ`23505`.
- `SET ROLE authenticated` و`SET ROLE anonymous` لا يمنحان أي قراءة/كتابة/EXECUTE على `aigas_*` أو `neon_auth`.
- `current_setting('aigas.tenant_id', true)` لا يحتفظ بقيمة بعد `COMMIT/ROLLBACK`.
- لا يوجد أي `INSERT/UPDATE/DELETE` ناجح بدون `SET LOCAL` أو `set_config(..., true)` داخل معاملة.
- `SET ROLE neondb_owner` يثبت التجاوز المتوقع، ويُسجّل كسبب لعدم استخدامه دورًا للخدمة.
- `neon_auth` مقروء بالأعمدة المحددة فقط، وكل كتابة مرفوضة، و`session` غير متاح لـ`aigas_runtime`.
- محتوى `aigas_sc_messages`/`aigas_sc_conversations` participant-only: لا قراءة أو كتابة لصف مؤلف آخر حتى داخل المؤسسة نفسها، ولا قراءة لـOWNER.
- Data API لا يعيد أي صف من `public.aigas_*` بعد الخيار A/B.

## 4. ما لا يثبته هذا السيناريو

- لا يثبت أن Data API معطّل فعليًا؛ يثبت فقط أن الدور لا يملك منحًا. إعداد `db_schemas` يُفحص من control plane.
- لا يثبت سلامة مسار bootstrap أو قبول الدعوة؛ كلاهما `BLOCKED` حتى اعتماد مسار مميز.
- لا يثبت أن اتصال الإنتاج تحوّل إلى `aigas_runtime`؛ هذا يُثبت من `pg_stat_activity`/إعداد الخدمة في نافذة cutover.
- لا يثبت عدم وجود ثغرة منطقية داخل نفس المؤسسة (RBAC)؛ تلك تحقق منفصل.
- لا يثبت أن `FORCE ROW LEVEL SECURITY` يحمي من `neondb_owner`؛ الدور `BYPASSRLS` يتجاوزها، وهذا مقصود في السيناريو 8.
- لا يثبت جدول احتفاظ أو حذف أو Legal Hold لمحتوى المحادثة؛ `0027` يغلق الوصول فقط.
- لا يثبت أن Data API مقيد على production؛ الاختبار 13 على staging فقط، وتغيير control plane يحتاج موافقة منفصلة.

## 5. الجهات الموافقة

| القرار | صاحب الموافقة |
|---|---|
| إنشاء فرع staging ونقطة استعادة | مالك مشروع Neon |
| تطبيق `0018/0025` على staging | مشغّل معتمد + مراجع أمني |
| إنشاء Login وتخزين السر | مالك Neon / مشغّل المنصة |
| تعطيل أو تقييد Data API | مالك Neon |
| إعلان نتيجة العزل | مراجع أمني مستقل |
