# BRIGHT AI / AIGAS — Grant, Licence and 48-Hour Trial Rollout Runbook

**الحالة:** `PREPARED_LOCALLY — NOT RUN`
**التاريخ:** 2026-11-08
**النطاق:** `aigas_product_grants`، `aigas_product_access`، وترحيل التجربة `0023`.
**قاعدة صارمة:** هذا المستند لا يفوّض تنفيذ DDL/DCL أو تفعيل منتج أو تجربة. كل خطوة تحتاج موافقة صاحبها المذكور، وتُنفّذ في بيئة معتمدة منفصلة، ولا تُنفّذ داخل جلسة وكيل.

## 1. مصادر الحقيقة

| العنصر | المصدر الحالي | ما يثبته |
|---|---|---|
| سياسة التجربة | `docs/ENTERPRISE-TRIAL-POLICY.md` | الشروط والمدة وحدود عدم الفوترة |
| دورة الحالة | `src/server/kernel/trial.mjs` | `REQUESTED → … → CLOSED` وقيود التفعيل |
| قرار الوصول الموحد | `src/server/kernel/access.mjs` → `resolveProductAccess` | فصل `ADMIN_NON_BILLED` عن `TRIAL_48H` و`LICENSE` |
| حارس المنتج | `requireProductAccess` | التطبيق الخادمي لحالة الوصول نفسها |
| مخطط التجربة | `migrations/0023_aigas_enterprise_trial_lifecycle.sql` | الجداول والقيود والحارس |
| صلاحيات التشغيل | `migrations/0025_aigas_tenant_isolation_closure.sql` | `aigas_runtime` وRLS والمنح |

وجود الكود أو الملف لا يعني `VERIFIED_OPERATIONAL`. الحالة الحالية: `SOURCE_PRESENT` فقط، و`0023`/`0025` غير مطبقتين على الفرع المفحوص.

## 2. الفصل الإلزامي بين المصادر

- `ADMIN_NON_BILLED`: قرار إداري مؤقت من مشغّل، له مرجع اعتماد (`approval_reference`) ونافذة زمنية. ليس تجربة ولا ترخيصًا ولا اشتراكًا.
- `TRIAL_48H`: استحقاق مشتق من طلب `ACTIVATED` وصف استحقاق `ACTIVE` ونافذة `activated_at + 48h` بالضبط.
- `LICENSE` / `SUBSCRIPTION` / `PERPETUAL` / `ON_PREMISE`: `NOT_CONFIGURED` حتى يوجد مُصدر ترخيص أو عقد وسعر معتمدان. لا تُشتق من منحة إدارية أو من تمكين المنتج.
- `EXPIRED`: حالة لكل مصدر على حدة؛ انتهاء منحة إدارية لا يُعرض كتجربة منتهية، والعكس.
- `Kernel` أساس مشترك: لا صف ترخيص ولا رسم منفصل، وأمان التدقيق الأساسي لا يعتمد على شراء `Ledger`.

## 3. المتطلبات قبل أي تنفيذ

1. اعتماد مالك المنتج/العمليات لسياسة `AIGAS-COM-TRIAL-001` وتحديد المشغّل المخوّل للتفعيل (هوية منفصلة عن مقدّم الطلب).
2. اعتماد الأمن والخصوصية لسياسة الاحتفاظ والتصدير والحذف؛ تبقى `POLICY_PENDING_APPROVAL` حتى ذلك الحين.
3. اعتماد المالية لحدود الاستخدام والتكلفة؛ لا أرقام في هذا المستند ولا في الكود.
4. مراجعة `0023` و`0025` معًا، وترتيب التطبيق: `0023` ثم `0025` (حتى تُغطّى جداول التجربة بالمنح والسياسات المولدة).
5. فرع staging معتمد ونسخة استعادة مُختبرة. لا تطبيق على `production` مباشرة.

## 4. خطوات التطبيق (لمنفّذ مخوّل فقط)

1. أنشئ فرعًا معزولًا واستعادة اصطناعية؛ لا تستورد بيانات عملاء.
2. طبّق `0023` ثم `0025` على الفرع، وسجّل نتيجة كل عبارة.
3. أنشئ Login لـ`aigas_runtime` خارج SQL، واضبط `DATABASE_URL` للخادم عليه، مع `AIGAS_REQUIRE_RLS=true` في البيئة المعتمدة.
4. تحقق من المنح: `aigas_trial_requests` و`aigas_trial_entitlements` قراءة فقط، و`aigas_trial_events` إلحاق فقط، و`aigas_product_grants` قراءة فقط لدور التشغيل.
5. أنشئ منحة إدارية بمشغّل مخوّل عبر مسار مالك قاعدة البيانات، مع `approval_reference` ونافذة ≤ 90 يومًا، وسجّل مرجع الاعتماد في نظام الاعتماد المؤسسي.
6. فعّل المنتج من لوحة المالك فقط بعد قراءة القرار الموحد؛ يجب أن يعرض المصدر `ADMIN_NON_BILLED` صراحة.
7. للتجربة: أنشئ الطلب بحالة `REQUESTED`، ثم `ELIGIBILITY_REVIEW`، ثم `APPROVED` بقرار مشغّل. لا تُنشئ استحقاقًا قبل التفعيل.
8. عند التفعيل: عيّن `activated_at` من ساعة القاعدة، و`expires_at = activated_at + 48h`، و`decision_source='OPERATOR'`، و`decided_by` مختلفًا عن `requested_by`، ثم أدرج استحقاق كل منتج بالنافذة نفسها.
9. سجّل كل خطوة كحدث تدقيق Kernel أو حدث تجربة بحسب الحالة؛ لا تُكمل خطوة كتابة لا يوجد لها سجل فعّال.

## 5. تحقق للقراءة فقط بعد التطبيق

```sql
-- نافذة التفعيل مطابقة لـ48 ساعة ومصدر القرار مشغّل مستقل
SELECT id, state, activation_window_ok, operator_separated
FROM (
  SELECT id, state,
         (expires_at = activated_at + interval '48 hours') AS activation_window_ok,
         (decision_source = 'OPERATOR' AND decided_by <> requested_by) AS operator_separated
  FROM public.aigas_trial_requests
) t;

-- كل استحقاق مطابق لنافذة طلبه
SELECT e.trial_id, e.product_slug, e.status,
       (e.starts_at = r.activated_at AND e.ends_at = r.expires_at) AS window_matches
FROM public.aigas_trial_entitlements e
JOIN public.aigas_trial_requests r ON r.id = e.trial_id AND r.tenant_id = e.tenant_id;

-- الدور التشغيلي لا يتجاوز RLS ولا يكتب على قرارات التجربة
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'aigas_runtime';
```

لا تُنفّذ هذه الاستعلامات على الإنتاج من داخل هذه المهمة.

## 6. التراجع

- إيقاف المنتج: أعِد `aigas_product_access.status` إلى `DISABLED` عبر لوحة المالك (عملية مدققة).
- سحب المنحة الإدارية: عيّن `revoked_at` عبر مسار مالك قاعدة البيانات، وسجّل مرجع القرار.
- التجربة: `ACTIVATED → EXPIRED` أو `CANCELLED` بحدث وسبب؛ لا تعد `EXPIRED` إلى `ACTIVATED`.
- لا تحذف سجلات التدقيق أو أحداث التجربة للتراجع.

## 7. ممنوع في هذه المرحلة

- أي سعر أو حصة أو SLA أو وعد تجربة مفعّلة.
- أي تجديد أو تحويل أو خصم تلقائي.
- تنفيذ `0023` على `production` أو تفعيل ذاتي أو إرسال بريد تجربة.
- أي حذف بيانات أو تصدير محتوى عميل.
