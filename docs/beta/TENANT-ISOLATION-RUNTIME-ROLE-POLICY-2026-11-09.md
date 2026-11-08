# سياسة عزل المؤسسات ودور التشغيل — قراءة 2026-11-09

> **النوع:** سياسة محلية قابلة للتطبيق بعد اعتماد DBA + خطة تحقق غير منفذة. ليست دليل تشغيل، وليست ترحيلًا مطبقًا، ولا ترفع G4.
> **HEAD المحلي وقت المراجعة:** `aef462c3b1a26430813b3557145c7031c31d465a` (فرع `main` محليًا). يختلف عن `46ecaeae…` المذكور في الطلب.
> **هدف Neon:** المشروع `young-frog-60183055`، الفرع `production` (`br-young-bird-b43proeb`)، قاعدة `neondb`.
> **حدود هذه الدفعة:** قراءة فقط عبر Neon MCP. لم تُطبّق migrations، ولم تُنشأ أدوار أو Login، ولم تُغيّر منح أو RLS أو Data API، ولم يُشغّل build/test/E2E، ولم يُعدّل الإنتاج أو الأسرار.

الوسوم: `SOURCE_PRESENT` / `SCHEMA_PRESENT` / `CONFIGURED` / `RUNTIME_VERIFIED` / `APPROVED` / `NOT_RUN`.

---

## 1. الخلاصة

1. `relrowsecurity=true` على 31 جدولًا **لا يثبت** عزل المؤسسات: لا توجد سياسات إلا على جدولين، والاتصال المفحوص مالك بـ`rolbypassrls=true` فلا تُقيَّم عليه السياسات أصلًا.
2. `authenticated` يملك 124 منح DML على 31 جدولًا وEXECUTE على 10 دوال `aigas_*`، لكن الوصول الفعلي عبر RLS هو **default deny** على 29 جدولًا، وليس عزلًا مصممًا. المنح وحده ليس قراءة، وغيابه ليس إثبات أمان.
3. Default ACL لـ`neondb_owner` يعيد منح `authenticated` تلقائيًا على الجداول/الدوال/التسلسلات الجديدة؛ لذلك سحب المنح الحالية وحده لا يغلق المسار.
4. Data API **نشط** على `public`؛ SQL لا يعطّله. الإغلاق يحتاج إجراء control-plane بموافقة مالك Neon، مع سحب المنح كطبقة دفاع إضافية.
5. `aigas_runtime` غير موجود. تصميمه المحلي في `0025` صحيح من حيث `NOBYPASSRLS`، لكن التطبيق يحتاج اعتماد DBA وفرع staging قابل للاستعادة وcutover لـ`DATABASE_URL`.
6. **G4 يبقى `BLOCKED`** حتى يظهر دليل `RUNTIME_VERIFIED` على staging، ثم `APPROVED` بتوقيع مالك قاعدة البيانات والأمن.

---

## 2. الحالة الحية — قراءة فقط 2026-11-09

| الفحص | القيمة | الوسم |
|---|---|---|
| الجداول في `public` | 31 جدولًا كلها `aigas_*` | `SCHEMA_PRESENT` |
| RLS | 31/31 مفعّل، `FORCE` = 0 | `SCHEMA_PRESENT` |
| السياسات | 2 فقط: `sc_request_owner`, `sc_cancellation_owner` على `aigas_sc_requests`/`aigas_sc_cancellations` | `PARTIAL` |
| شكل السياستين | `TO public`، `ALL`، تعتمد `aigas.sc_tenant_id`/`aigas.sc_user_id` فقط بلا عضوية | `PARTIAL` |
| `neondb_owner` | `rolsuper=false`, `rolbypassrls=true`, login | `VERIFIED` |
| `authenticated` | 124 منح (SELECT/INSERT/UPDATE/DELETE × 31)، لا login | `VERIFIED` |
| `anonymous` | 0 منح على جداول/دوال `public`، لا login | `VERIFIED` |
| EXECUTE لـ`authenticated` | 10 دوال `aigas_*`، منها `aigas_sc_usage_window` (`SECURITY DEFINER`) | `VERIFIED` |
| Default ACL | `neondb_owner`: `authenticated=arwd` جداول، `X` دوال، `U` تسلسلات | `VERIFIED` |
| منح `PUBLIC` على جداول `aigas_*` | 0 (لا `relacl` لعنصر grantee=0) | `VERIFIED` |
| اتصال نشط وقت القراءة | `neondb_owner` عبر `pgbouncer` (اتصال أداة القراءة؛ لا يثبت دور خدمة Node) | `NOT_VERIFIED` للخدمة |
| `aigas_runtime` | غير موجود | `NOT_PRESENT` |
| Data API | `active`، `db_schemas=["public"]`، `db_anon_role=anonymous` | `CONFIGURED` |
| `public` schema ACL | `pg_database_owner=UC`, `=U` (PUBLIC usage), `authenticated=U` | `VERIFIED` |
| التسلسلات | لا توجد تسلسلات في `public` | `VERIFIED` |
| صفوف AIGAS/Auth | 0 في العينة المفحوصة (`tenants`, `memberships`, Auth user/session/org/member/invitation) | `VERIFIED` (عينة) |

**تفسير مهم:**

- `neondb_owner` يتجاوز RLS بسبب `rolbypassrls`، وليس بسبب `FORCE`؛ إضافة `FORCE` لا تربط هذا الدور.
- `authenticated` يرى 29 جدولًا بلا سياسة → منع افتراضي، والجدولان الآخران مشروطان بـGUC لا يضبطه Data API. هذا ليس عزلًا مؤسسيًا مصممًا.
- `aigas_sc_usage_window` دالة definer مكشوفة لـ`authenticated`؛ منح EXECUTE للعميل غير ضروري ويجب سحبه (0018/0025).

---

## 3. تقييم الترحيلات وارتباطها

### 3.1 `0018_aigas_data_api_grant_hardening.sql`

- **الدور:** يسحب منح العميل ويعيد سياسات Secure Chat مع فحص عضوية.
- **خطأ محدد صُحح محليًا:**
  - السياستان كانتا تعيدان إنشاء `aigas.sc_*` بعد أن أصبح `src/server/kernel/db.mjs` يضبط `aigas.tenant_id`/`aigas.user_id`؛ تطبيق `0018` وحده كان سيعطّل قراءة `aigas_sc_requests` عبر `tenantGuard`. صُحح إلى GUC الموحّد.
  - سحب EXECUTE من `authenticated` لا يزيل مسار `PUBLIC` الافتراضي للدوال. أُضيف `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC`.
  - أُضيف حارس ترتيب يرفض تشغيل `0018` بعد `0025`.
- **ما لا يفعله:** لا يغيّر Data API، ولا يسحب `USAGE` على schema، ولا يغطي كل الجداول بسياسات نطاق.

### 3.2 `0019_aigas_runtime_least_privilege.sql`

- **الدور:** دور runtime وسياسات نطاق على 29 جدولًا مكتوبة يدويًا.
- **عيوب:**
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES` يمنح أفعالًا على جداول append-only وSecure Chat content.
  - قائمة الجداول الثابتة تفوت جداول `0014` و`0023`.
  - سياسة العضوية `FOR ALL` لا تتحقق من دور المدير عند الإضافة/التعديل، فيمكن نظريًا لعضو عادي إضافة عضوية بدور أعلى إن وصل إلى قاعدة البيانات.
  - `0019` بعد `0025` يعيد فتح المنح الواسعة.
- **القرار:** `0019` **متجاوَز**؛ لا يُطبق بعد `0025`. أُضيف حارس يرفض ذلك. المسار المعتمد: `0025` ثم `0027`.

### 3.3 `0025_aigas_tenant_isolation_closure.sql`

- **الدور:** الملف المرجعي: دور `aigas_runtime` بـ`NOBYPASSRLS`، منح مصنفة، سياسات catalog-driven، سياسة `RESTRICTIVE` تمنع أدوار العميل، فهارس مرجع عالمية، وفحوص posture.
- **خطأ محدد صُحح محليًا:**
  - `GRANT` تراكمي: إن طُبّق `0019` سابقًا، بقيت `UPDATE/DELETE` على جداول append-only. أُضيف `REVOKE ALL ON ALL TABLES/SEQUENCES/FUNCTIONS ... FROM aigas_runtime` قبل المصفوفة الانتقائية.
  - فحص النهاية كان يفحص `SELECT` فقط لأدوار العميل. وُسّع إلى كل الأفعال (`INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER`).
- **قيود مقصودة:** `FORCE` غير مستخدم عمومًا لأن المالك الحالي `BYPASSRLS`؛ الإصلاح الحقيقي هو cutover. bootstrap أول مساحة عمل وقبول الدعوة غير محلولين ويحتاجان مسارًا مميزًا معتمدًا.

### 3.4 `0027_aigas_sc_content_participant_only.sql`

- **الدور:** يحصر محتوى المحادثة على المؤلف (`tenant_id + user_id`) ويسحب كل منح جدولي المتن.
- **خطأ محدد صُحح محليًا:**
  - تعليق كان يقول إن `FORCE` يمنع قراءة المالك؛ غير صحيح مع `rolbypassrls=true`. صُحح النص ليطابق `0025`.
  - فحص النهاية كان يفحص `SELECT` فقط؛ وُسّع لكل الأفعال.
  - أُضيف `REVOKE ... FROM PUBLIC` (منحة PUBLIC تنجو من سحب الأدوار).
  - أُضيف حارس ترتيب يرفض `0027` قبل `0025`.
- **حدود:** لا يمثل منع وصول الدعم/الاحتفاظ؛ أي قراءة دعم تحتاج دورًا وسياسة معتمدين. كما أن `0025` يبقي **بيانات طلب** Secure Chat (لا المتن) بنطاق مؤسسة كامل لأغراض الحصة/الإدارة؛ إن أرادت الخصوصية حصرها بالمؤلف أيضًا، يلزم ترحيل لاحق مستقل بسياسة `user_id` على `aigas_sc_requests`/`aigas_sc_cancellations` بعد مراجعة أثر الحصة.

### 3.5 الترتيب المعتمد

```text
0018 → 0022 → 0025 → 0027
```

`0019` لا يدخل هذا التسلسل. `0009`/`0016` تسبقان منطقيًا لأن `0027` يفترض وجود جدولي المتن ودالة الحصة. `0014`/`0017`/`0023`/`0024`/`0026` ترحيلات منتجات مستقلة ولا تغيّر هذا التسلسل الأمني.

---

## 4. تصميم دور `aigas_runtime`

### 4.1 السمات

```sql
CREATE ROLE aigas_runtime
  NOLOGIN NOINHERIT NOBYPASSRLS
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
```

- `NOBYPASSRLS` شرط لازم، وليس كافيًا: يجب أن تكون كل معاملة مضبوطة النطاق.
- `NOINHERIT` يمنع عضوية موروثة من منح الصلاحيات تلقائيًا.
- `NOLOGIN` في الترحيل؛ المشغّل ينشئ Login منفصلًا (`SET ROLE aigas_runtime`) أو يفعّل LOGIN ويخزن السر في secret store. لا كلمة مرور في SQL أو المستودع.
- لا عضوية في `neondb_owner`/`neon_superuser`/`authenticated`/`anonymous`.

### 4.2 مصفوفة المنح

| الفئة | الأفعال |
|---|---|
| جداول append-only (`audit`, `ledger`, `dt`, `fw_decisions`, `hg_events/decisions`, `policy_approvals`, revisions, `sc_cancellations`, `trial_events`) | `SELECT, INSERT` |
| جداول select+insert (`auth_organizations`) | `SELECT, INSERT` |
| جداول دورة العمل (`sc_requests`, `hg_requests`, `re_assets`, policies, departments, product_access, invitations) | `SELECT, INSERT, UPDATE` |
| `aigas_tenants` | `SELECT, UPDATE` فقط |
| جداول قراءة فقط (`product_grants`, `ld_evidence_requirements`, trial requests/entitlements) | `SELECT` |
| محتوى Secure Chat (`sc_conversations`, `sc_messages`) | **صفر منح** |
| `neon_auth` | `SELECT` على أعمدة محددة فقط، بلا كتابة |
| الدوال | EXECUTE على `aigas_actor`, `aigas_is_tenant_member`, `aigas_actor_role`, `aigas_actor_is_manager`, `aigas_tenant_scope`, و`aigas_sc_usage_window(_v2)` عند وجودها؛ لا EXECUTE لـPUBLIC/`authenticated`/`anonymous` |

### 4.3 ضبط النطاق داخل المعاملة

الترتيب الإلزامي:

```sql
BEGIN;
-- 1) actor من التوكن الموثّق فقط
SELECT set_config('aigas.user_id', $1, true);
-- 2) تحقق العضوية في المؤسسة المطلوبة (من التوكن/العضوية، لا من body)
SELECT 1 FROM public.aigas_memberships WHERE tenant_id=$2 AND user_id=$1;
-- 3) tenant بعد التحقق فقط
SELECT set_config('aigas.tenant_id', $2, true);
-- 4) قراءة/كتابة
SELECT ...;
COMMIT; -- set_config(..., true) / SET LOCAL يُصفَّر
```

- `set_config('aigas.tenant_id', $1, true)` مكافئ لـ`SET LOCAL` داخل معاملة، ويُصفَّر عند `COMMIT/ROLLBACK`.
- `src/server/kernel/db.mjs` يرفض الضبط خارج معاملة عبر `SAVEPOINT` ويتحقق من القيم بعد الضبط؛ `setActorScope` يمسح `aigas.tenant_id` صراحةً.
- `src/server/kernel/access.mjs` يضبط actor ثم يتحقق من العضوية (`assertTenantMembership`) ثم يضبط tenant، ثم `requireRlsPosture` عند `AIGAS_REQUIRE_RLS=true`.
- `src/server/kernel/service.mjs` `tenantGuard`: قيمة `workspace` مجرد محدد داخل عضويات المستخدم، وليست مصدر صلاحية.
- **لا يُقبل `tenantId` من جسم الطلب كصلاحية.** أي معرّف غير UUID أو غير مطابق يُرفض قبل الاستعلام.

---

## 5. Data API — الخيارات والترتيب

الحالة: `active` على `public`، `db_anon_role=anonymous`، والمخططات المتاحة `auth`, `neon_auth`, `public`.

| الخيار | الأثر | من ينفذه |
|---|---|---|
| A. تعطيل Data API للفرع | يزيل سطح REST كاملًا | مالك Neon (control plane) |
| B. إزالة `public` من `db_schemas` | يمنع REST من الوصول لـAIGAS؛ يبقي Auth | مالك Neon |
| C. سحب المنح + default ACL + `RESTRICTIVE` | دفاع داخل PostgreSQL؛ لا يثبت إعداد control plane | DBA عبر `0018/0025/0027` |
| D. إبقاء الوضع | غير مقبول لـBeta | — |

**الترتيب الموصى به (على staging أولًا):**

1. تطبيق `0018 → 0022 → 0025 → 0027` على فرع staging.
2. تشغيل سيناريو A/B وفحص `pg_policies`/`pg_default_acl`/`role_table_grants`.
3. تنفيذ الخيار A أو B على staging، وإثبات أن REST لا يرى `public`.
4. على production: نافذة معتمدة — سحب المنح ثم تقييد control plane، دون تغيير `DATABASE_URL` في الخطوة نفسها.
5. تحويل `DATABASE_URL` إلى Login يبدأ بـ`SET ROLE aigas_runtime`؛ إعادة تشغيل الخدمة؛ فحص `pg_stat_activity` أن الاتصال `aigas_runtime` وليس `neondb_owner`.
6. أي فشل: إعادة `DATABASE_URL` السابق فورًا، والاحتفاظ بالدور القديم حتى ثبات النتيجة.

**قاعدة DSN:** لا يُكتب في المستودع أو التقرير أو الـMind. يُدار في secret store فقط، ويُدوّر بعد أي تعرض. لا يُنقل DSN قبل تطبيق السياسات والتحقق، لأن التحويل وحده لا يغلق Data API.

---

## 6. سيناريو التحقق اللاحق — NOT RUN

التفاصيل التنفيذية في `docs/TENANT-ISOLATION-VERIFICATION.md` (تم توسيعه بنفس التاريخ). يشمل:

1. مؤسستان اصطناعيتان A/B وعضوان (`owner-a`, `owner-b`) بمعرّفات UUID ثابتة وبيانات وهمية فقط.
2. رفض قراءة/كتابة cross-tenant عبر `aigas_runtime` (**42501** أو 0 صفوف).
3. `SET ROLE authenticated` و`SET ROLE anonymous` → رفض كامل على جداول `aigas_*` والدوال.
4. `SET ROLE neondb_owner` → يثبت التجاوز المتوقع، ويوثق أن المالك ليس دور الخدمة.
5. `neon_auth`: قراءة أعمدة محددة فقط، رفض الكتابة، ورفض `authenticated` للوصول إلى `neon_auth`.
6. محتوى المحادثة: A يرى/يكتب صفوفه فقط، ولا يرى صفوف B في نفس المؤسسة، وOWNER لا يقرأ محتوى غيره؛ ودور runtime بلا منح.
7. عدم بقاء `aigas.tenant_id` بعد `COMMIT/ROLLBACK`.
8. Data API: REST بلا JWT وبـJWT مصطنع لا يقرأ `public.aigas_*` (بعد الخيار A/B).
9. تسجيل `current_user`, `rolbypassrls`, `SQLSTATE`, عدد الصفوف، والوقت لكل خطوة.

**لا يُشغّل الآن.** التشغيل يحتاج موافقة منفصلة، وفرع staging، وبيانات اصطناعية، ومسجل نتائج مستقل.

---

## 7. القرار والاعتمادات

| البند | الحالة |
|---|---|
| `SOURCE_PRESENT` | نعم: `0018/0022/0025/0027` + `db.mjs` + `access.mjs`. |
| `SCHEMA_PRESENT` | لا: `aigas_runtime` غائب، والسياسات الحالية 2 فقط. |
| `CONFIGURED` | لا: Data API على `public`، والاتصال المفحوص مالك متجاوز. |
| `RUNTIME_VERIFIED` | لا: لم يُشغّل أي سيناريو. |
| `APPROVED` | لا. |
| **G4** | **BLOCKED** حتى دليل staging موقّع. |

**يلزم قبل التطبيق:**

- موافقة مالك BRIGHT AI على النطاق.
- موافقة الأمن/الخصوصية على Data API، RLS، ومحتوى المحادثة.
- اعتماد مالك Neon/DBA لـ: فرع staging، نقطة استعادة، تطبيق DCL، إنشاء Login، نافذة cutover.
- مراجع أمني مستقل يوقّع نتيجة A/B.
- خطة rollback معتمدة.

**لا يرفع هذا المستند أي بوابة إلى GO، ولا يعلن Beta READY.**
