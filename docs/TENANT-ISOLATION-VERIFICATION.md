# التحقق التشغيلي من عزل المؤسسات — سيناريو Tenant A/B

> الحالة: **NOT RUN / BLOCKED**. هذا مستند تشغيل، وليس دليل نجاح.
> لا يُشغّل على `production`. يُشغّل فقط على فرع staging معزول بعد موافقة مالك Neon ومراجع أمني.
> لا تُلصق Connection URI أو كلمات مرور أو توكنات في هذا الملف أو في logs.

## 1. الشروط المسبقة

1. موافقة مالك Neon على إنشاء فرع staging مؤقت ونقطة استعادة، وموافقة مالك BRIGHT AI على نافذة الاختبار.
2. تطبيق `0018` ثم `0025` على staging فقط، والتحقق من `pg_policies` و`relrowsecurity` و`pg_default_acl`.
3. إنشاء Login لـ`aigas_runtime` خارج SQL (`ALTER ROLE aigas_runtime LOGIN PASSWORD ...`)، أو Login منفصل يبدأ بـ`SET ROLE aigas_runtime` (مثل `options=-c role=aigas_runtime`)، وتخزين السر في secret store مؤقت خاص بـstaging. `NOINHERIT` يعني أن مجرد العضوية لا يمنح الصلاحيات.
4. تعيين `DATABASE_URL` في خدمة staging إلى دور `aigas_runtime`، وتعيين `AIGAS_REQUIRE_RLS=true` ليجعل مسارات المنتجات ترفض اتصالًا يتجاوز RLS، ثم إعادة تشغيل الخدمة.
5. إخراج `public` من `db_schemas` في Data API، أو تعطيل Data API على staging.
6. بيانات اصطناعية فقط: مستخدمون `tenant-a-owner@example.invalid` و`tenant-b-owner@example.invalid` أو معرّفات UUID ثابتة، ومؤسستان A/B بلا أي بيانات عمل حقيقية.

## 2. سيناريو التحقق

نفّذ كل خطوة داخل معاملة، وسجّل `SQLSTATE` وعدد الصفوف و`current_user` والوقت. لا تنسخ DSN.

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
```

## 3. معايير النجاح

- `current_user=aigas_runtime`, `rolsuper=false`, `rolbypassrls=false`.
- لا يظهر أي صف من B في سياق A، ولا صف من A في سياق B.
- محاولة الكتابة لمؤسسة أخرى تفشل بـ`42501` من RLS.
- إعادة استخدام `request_id` بين مؤسستين تفشل بـ`23505`.
- `SET ROLE authenticated` لا يمنح أي قراءة لجدول `aigas_*`.
- `current_setting('aigas.tenant_id', true)` لا يحتفظ بقيمة بعد `COMMIT/ROLLBACK`.
- لا يوجد أي `INSERT/UPDATE/DELETE` ناجح بدون `SET LOCAL` أو `set_config(..., true)` داخل معاملة.

## 4. ما لا يثبته هذا السيناريو

- لا يثبت أن Data API معطّل فعليًا؛ يثبت فقط أن الدور لا يملك منحًا. إعداد `db_schemas` يُفحص من control plane.
- لا يثبت سلامة مسار bootstrap أو قبول الدعوة؛ كلاهما `BLOCKED` حتى اعتماد مسار مميز.
- لا يثبت أن اتصال الإنتاج تحوّل إلى `aigas_runtime`؛ هذا يُثبت من `pg_stat_activity`/إعداد الخدمة في نافذة cutover.
- لا يثبت عدم وجود ثغرة منطقية داخل نفس المؤسسة (RBAC)؛ تلك تحقق منفصل.

## 5. الجهات الموافقة

| القرار | صاحب الموافقة |
|---|---|
| إنشاء فرع staging ونقطة استعادة | مالك مشروع Neon |
| تطبيق `0018/0025` على staging | مشغّل معتمد + مراجع أمني |
| إنشاء Login وتخزين السر | مالك Neon / مشغّل المنصة |
| تعطيل أو تقييد Data API | مالك Neon |
| إعلان نتيجة العزل | مراجع أمني مستقل |
