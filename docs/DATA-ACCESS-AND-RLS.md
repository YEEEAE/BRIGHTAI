# وصول البيانات وعزل المؤسسات — RLS وGRANT ودور التشغيل

> الحالة: **مرجع مصدر مؤرخ + خطة ترحيل محلية غير مطبقة**. لا يمثل هذا المستند دليل تشغيل أو إثبات عزل.
> جرد 2026-11-03 HISTORICAL. آخر تحقق: 2026-11-08 عبر Neon MCP قراءة فقط على مشروع `young-frog-60183055` / فرع `production` (`br-young-bird-b43proeb`) / قاعدة `neondb`؛ لا كتابة ولا migrations ولا تغيير إعدادات.
> **الحالة الراهنة (2026-11-08):** الاتصال المستخدم للفحص `current_user=neondb_owner` مع `rolsuper=false` و`rolbypassrls=true` وعضوية في `authenticated`. 31/31 جدول AIGAS عليه RLS و`relforcerowsecurity=false`، وسياستان فقط (`aigas_sc_requests`, `aigas_sc_cancellations`). `authenticated` يملك SELECT/INSERT/UPDATE/DELETE على 31 جدولًا وEXECUTE على كل دوال `aigas_*` بما فيها `aigas_sc_usage_window` (SECURITY DEFINER). Default ACL لـ`neondb_owner`: `authenticated=arwd` على الجداول و`X` على الدوال و`U` على التسلسلات. `aigas_runtime` غير موجود. Data API `active` على `public` مع `db_anon_role=anonymous`. كل جداول AIGAS و`neon_auth.user/session/organization` بلا سجلات. دور اتصال خدمة Node الحية `NOT_VERIFIED`؛ وجود `neondb_owner` لا يثبت أنه المستخدم.
> النطاق: `pg_roles`، `role_table_grants`، `pg_policies`، `pg_class.relrowsecurity`، `pg_default_acl`، `pg_proc`، وإعداد Neon Data API. كل استعلامات Neon كانت للقراءة فقط.

---

## 1. الخلاصة التنفيذية

1. جرد 2026-11-03 في هذا المستند ذكر أن الاتصال الخادمي (`DATABASE_URL`) يستخدم `neondb_owner`. فحص 2026-11-08 أكد أن الدور موجود و`rolbypassrls=true`، لكنه لا يكشف أي دور تستخدمه خدمة Node؛ role اتصال الخدمة الحالية `NOT_VERIFIED`. إذا استخدم الاتصال دورًا يتجاوز RLS فلن تطبق سياسات RLS عليه؛ ويظل التحقق التشغيلي من شروط النطاق مطلوبًا.
2. `authenticated` يملك `SELECT/INSERT/UPDATE/DELETE` على الجداول الـ31 جميعًا، ويملك `EXECUTE` على دوال `public` عبر `ALTER DEFAULT PRIVILEGES`. RLS مفعّل على 31 جدولًا، لكن السياسات موجودة على جدولين فقط؛ لذلك الوصول الفعلي حاليًا **default deny** من RLS، وليس منتهيًا بغياب المنح.
3. Neon Data API **مفعّل** (`status: active`) على مخطط `public` مع `db_anon_role=anonymous` وتحويل الدور من `jwt_role_claim_key=.role`. لا توجد بيانات عمل ولا مستخدمون الآن، لكن أي خطأ مستقبلي في سياسة أو منح يتحول مباشرة إلى وصول عميل.
4. السياستان الموجودتان (`aigas_sc_requests`, `aigas_sc_cancellations`) تعتمدان فقط على GUCين (`aigas.sc_tenant_id`, `aigas.sc_user_id`) دون التحقق من عضوية. لا يوجد مسار عميل يضبطهما اليوم (لا RPC مكشوف)، لكنهما ليستا طبقة دفاع مستقلة.
5. لا يوجد دليل على قراءة عابرة للمؤسسات من العميل في هذه اللقطة. هذا **NOT VERIFIED كنفي**، وليس إثبات أمان.

| الطبقة | الحالة بعد هذه المهمة |
|---|---|
| `SOURCE_PRESENT` | نعم: `0025` + تعديلات الكود محلية |
| `SCHEMA_PRESENT` | نعم للجداول الحالية؛ `aigas_runtime` غير موجود بعد |
| `CONFIGURED` | لا: Data API ما زال على `public`، والاتصال المفحوص مالك متجاوز |
| `RUNTIME_VERIFIED` | لا: سيناريو Tenant A/B لم يُشغّل |
| `APPROVED` | لا: يلزم اعتماد المالك والأمن قبل التطبيق أو أي ادعاء Beta |

---

## 2. الأدوار كما هي فعليًا

| الدور | تسجيل دخول | `rolsuper` | `rolbypassrls` | الاستخدام |
|---|---|---|---|---|
| `neondb_owner` | نعم | لا | **نعم** | دور مالك الجداول؛ استخدامه من خدمة Node الحالية `NOT_VERIFIED` |
| `cloud_admin` | نعم | نعم | نعم | إدارة منصة |
| `neon_service` | نعم | لا | نعم | خدمة Neon |
| `neon_superuser` | لا | لا | نعم | منصة |
| `neon_auth` | نعم | لا | لا | خدمة Auth |
| `authenticator` | نعم | لا | لا | تسجيل دخول Data API ثم `SET ROLE` |
| `authenticated` | لا | لا | لا | دور JWT للطلبات الموثقة |
| `anonymous` | لا | لا | لا | دور JWT غير الموثق |
| `token_roles` | لا | لا | لا | أدوار JWT |

`neondb_owner` عضو في `authenticated` و`neon_auth` و`neon_superuser`. العضوية لا تغيّر أن الاتصال الخادمي يتجاوز RLS.

---

## 3. GRANT مقابل السماح الفعلي

| الطبقة | الحالة | الأثر |
|---|---|---|
| منح الجداول لـ`authenticated` | 4 امتيازات × 31 جدولًا | سطح هجوم إن أضيفت سياسة أو أُزيل RLS |
| `ALTER DEFAULT PRIVILEGES ... neondb_owner` | `authenticated=arwd` على الجداول الجديدة، `X` على الدوال | كل migration جديد يوسّع السطح تلقائيًا |
| RLS | مفعّل على 31/31، `FORCE` غير مفعّل | المالك يتجاوزه؛ غير المالك يُمنع افتراضيًا بلا سياسة |
| السياسات | 2 فقط، `TO public`، تعتمد GUC | لا تحقق عضوية مستقلًا |
| Data API | `active` على `public` | العميل يستطيع الوصول للـREST إن ملك JWT |
| `USAGE` على `public` | ممنوح أيضًا لـ`PUBLIC` | لا يمنح بيانات وحده؛ أُبقي لأن إلغاءه قد يكسر خدمات المنصة |

**قاعدة القرار:** GRANT وحده ليس ثغرة قراءة، وغياب GRANT ليس إثبات عزل. الفحص الحقيقي هو `role × schema exposure × RLS policy × predicate source`.

### 3.1 الفرق بين default deny ودور مالك يتجاوز RLS

- **Default deny (RLS مفعّل بلا سياسة permissive):** الدور غير المالك لا يرى صفوفًا، لكن المنح (GRANT) ما زال قائمًا. أي سياسة تُضاف لاحقًا، أو دالة `SECURITY DEFINER` تُمنح للدور، أو `set_config` يُقبل من مسار غير موثوق، تحوّل المنع الافتراضي إلى وصول فعلي. لذلك default deny نتيجة سياسة، وليس غياب سطح هجوم.
- **دور مالك بـ`BYPASSRLS`:** هنا لا تُقيَّم سياسات RLS أصلًا. `BYPASSRLS` يتقدم على `FORCE ROW LEVEL SECURITY`؛ إضافة `FORCE` لا تحمي اتصال المالك ولا تجعل RLS طبقة عزل. العزل في هذه الحالة يعتمد كليًا على شروط `tenant_id=$n` المكتوبة في كود الخادم.
- **الاستنتاج:** `relrowsecurity=true` ليست شهادة أمان. الشرط الفعلي هو اتصال خدمة بدور `NOBYPASSRLS` + سياسات تغطي كل جدول + سياق معاملي يُضبط بعد التحقق + منع أي منح أو دوال تسمح للعميل بتجاوز الطبقتين. `migrations/0025` يجمع هذه الشروط محليًا، لكنه غير مطبق ولم يُختبر تشغيليًا.

---

## 4. مصفوفة الوصول المستهدفة

`tenant` = مؤسسة محققة من الخادم؛ `row` = صف يخص المؤسسة؛ `id` = معرّف من العميل. الحالة الحالية مبنية على المصدر، لا على تشغيل.

| الدور / المسار | endpoint | tenant | table | الحالة الحالية | الهدف |
|---|---|---|---|---|---|
| `neondb_owner` (خادم) | `/app/api/*` | من عضوية محققة | كل جداول المنتج | مسموح، RLS متجاوز، شروط صريحة | دور `aigas_runtime` بـRLS مفعّل |
| `aigas_runtime` (مقترح) | الخادم | GUC معاملي بعد التحقق | جداول المؤسسة | غير موجود؛ `0025` ينشئه محليًا | `USING` + `WITH CHECK` على نطاق المؤسسة والعضوية |
| `authenticated` (Data API) | `/rest/v1/*` | JWT فقط | كل الجداول | منح كامل + RLS default deny | **صفر منح** بعد `0018/0025` |
| `anonymous` (Data API) | `/rest/v1/*` | لا شيء | كل الجداول | لا منح مباشر | صفر منح ونبض مراقبة |
| `authenticator` | تسجيل دخول REST | لا شيء | لا شيء | يتحول إلى `authenticated` | يبقى للـAuth فقط |
| مستخدم نهائي | واجهة `/app/*` | لا يصل DB مباشرة | لا شيء | يمر عبر Node | يبقى كذلك |

- `tenant` من `query/JSON` لا يُستخدم أبدًا كمصدر صلاحية؛ هو محدد اختياري داخل عضويات المُستخدم، وأي قيمة غير UUID أو غير مطابقة تُرفض.
- `id` عابر لمؤسسة أخرى يعيد `404/403` دون بيانات ودون تمييز يسرّب وجود السجل.
- `SET LOCAL`/`set_config(..., true)` هي الطريقة الوحيدة لضبط السياق، داخل معاملة، وتُصفَّر عند `COMMIT/ROLLBACK`.

---

## 5. ما نُفّذ في الكود المحلي

| الملف | التغيير |
|---|---|
| `src/server/kernel/core.mjs` | `isUuid` ورفض `workspace` غير الصالح قبل أي استعلام، دون إعادة القيمة في الخطأ |
| `src/server/kernel/db.mjs` | `setTenantScope`/`setActorScope` يرفضان العمل خارج معاملة (SAVEPOINT guard) ويقرآن القيم بعد ضبطها؛ `setActorScope` يمسح نطاق المؤسسة صراحةً؛ `requireRlsPosture` يرفض الاتصال المتجاوز عند `AIGAS_REQUIRE_RLS=true` |
| `src/server/kernel/access.mjs` | `requireProductAccess` يضبط actor scope ثم يتحقق من العضوية ثم يضبط tenant scope؛ `assertReferenceTenant` fail-closed بلا ابتلاع `42501/42P01` |
| `src/server/kernel/service.mjs` | `createWorkspace` يحوّل `42501` إلى `WORKSPACE_PROVISIONING_REQUIRED` بدل خطأ قاعدة بيانات عام |
| `src/server/kernel/administration.mjs` | قبول الدعوة تحت RLS يحوّل غياب الصف/رفض المنح إلى `INVITATION_BOOTSTRAP_REQUIRED` ولا يمنح عضوية |
| `src/server/secure-chat/requests.mjs` | `sc_*` GUCs أصبحت معلّقة في تعليق صريح: تغذي الـaggregate فقط وليست مصدر صلاحية |
| `src/server/kernel/service.mjs` | `tenantGuard` يتحقق من UUID ويضبط النطاق؛ `memberships` يضبط نطاق الفاعل؛ `audit` يرفض `tenant_id` غير صالح؛ لوحة Kernel المعتمدة تعرض `system.rls: BYPASSED/ENFORCED` (وليست ضمن فحص الصحة العام) |
| `src/server/secure-chat/service.mjs` | قراءة العضوية داخل معاملة بدل pool مباشر |
| `src/scripts/kernel.ts` | تسمية وحالة صريحة لفحص RLS في لوحة Kernel |
| `migrations/0018_aigas_data_api_grant_hardening.sql` | **محلي، غير مطبق**: سحب منح `authenticated`/`anonymous`، إلغاء default privileges، تشديد سياستي Secure Chat بالعضوية، سحب EXECUTE عن الدوال |
| `migrations/0019_aigas_runtime_least_privilege.sql` | **محلي، غير مطبق**: دور `aigas_runtime` بـ`NOBYPASSRLS` وسياسات نطاق مؤسسة على 29 جدولًا + سياستا عضوية، ومنح عمودية محدودة لـ`neon_auth` |
| `migrations/0025_aigas_tenant_isolation_closure.sql` | **محلي، غير مطبق**: يستكمل 0018/0019؛ دور `NOBYPASSRLS`، منح دنيا مصنفة، سياسات catalog-driven لكل جدول `aigas_*`، سياسة `RESTRICTIVE` تمنع `authenticated/anonymous`، مرجع عالمي فريد لـ`fw_decisions.request_id` و`sc_requests.id`، وفحوص posture تفشل الترحيل إن بقيت ثغرة |

---

## 6. عوائق واعتمادات قبل التطبيق أو تحويل الدور

1. **اعتماد المالك** على أن Data API لا يخدم جداول AIGAS، وأن الواجهة تمر عبر Node فقط. SQL لا يعطّل Data API؛ يلزم إجراء control-plane منفصل (تعطيل endpoint أو تقييد schemas) بموافقة صريحة.
2. **فرع تطوير ونسخة استعادة** قبل أي DCL على production. لا يُطبق `0018/0019` على الفرع الحالي مباشرة.
3. **بيانات اعتماد دور التشغيل**: إنشاء login لـ`aigas_runtime` خارج SQL (`LOGIN PASSWORD`) أو Login منفصل يبدأ بـ`SET ROLE aigas_runtime`، تخزينه في secret store، وتدوير `DATABASE_URL` في نافذة معتمدة. `NOINHERIT` يعني أن العضوية وحدها لا تمنح الصلاحيات. لا يوضع السر في المستودع أو التقارير.
4. **bootstrap مساحة العمل غير محلول**: إنشاء أول `aigas_tenants` وعضوية `OWNER` يحدث قبل وجود نطاق مؤسسة، وسياسات `0019` تمنعه. يحتاج دالة `SECURITY DEFINER` مراجعة أو مسار provisioning منفصل قبل التحويل.
5. **قبول الدعوات** يضيف عضوية لغير عضو؛ يحتاج أيضًا مسارًا مميزًا (دالة definer) قبل التحويل.
6. **`0016` غير مطبق** على القاعدة؛ منح `aigas_sc_usage_window_v2` في `0019` مشروط بوجوده.
7. **تحقق تشغيلي**: لا اختبارات ولا بناء ولا جلسة حقيقية في هذه المهمة. النتيجة تبقى `NOT_VERIFIED` حتى تُثبت على بيئة معتمدة باستعلامات `SET ROLE` وسيناريو مستأجرين.
8. **حماية كلمة مرور الدور**: `aigas_runtime` بلا LOGIN في `0019/0025`؛ لا تُضف كلمة مرور داخل migration. المشغّل ينشئ Login منفصلًا أو يفعّل LOGIN ويخزن السر في secret store.
9. **Data API control plane**: SQL لا يغيّر `db_schemas`؛ يجب على مالك Neon إخراج `public` من Data API أو تعطيل endpoint. حتى ذلك الحين، صفر منح + `aigas_client_deny` يمنعان قراءة AIGAS عبر REST، لكنهما لا يثبتان أن الإعداد نفسه مقيد.
10. **Bootstrap**: `aigas_runtime` لا يملك INSERT على `aigas_tenants` ولا policy لإنشاء أول عضوية. إنشاء أول مساحة عمل وقبول الدعوة يحتاجان مسارًا مميزًا معتمدًا؛ الكود يعيد `WORKSPACE_PROVISIONING_REQUIRED`/`INVITATION_BOOTSTRAP_REQUIRED` ولا يمنح شيئًا.
11. **فجوات مخطط قائمة**: `0014` (`aigas_hg_grants`, `aigas_hg_delegations`), `0016` (`aigas_sc_usage_window_v2`), و`0024` (أعمدة audit والمشغّل) غير مطبقة على الفرع المفحوص. `0025` catalog-driven فلا يفشل بسببها، لكن ميزات Human Gate/Secure Chat المعتمدة عليها تبقى غير مهيأة.
12. **التحقق التشغيلي**: سيناريو Tenant A/B في `docs/TENANT-ISOLATION-VERIFICATION.md` لم يُشغّل. لا يجوز إعلان عزل أو إطلاق Beta قبل تسجيل نتائجه على فرع staging معتمد.

---

## 7. خطة التحقق المستقبلية (غير منفذة)

1. على فرع معزول: تطبيق `0018` ثم `0019`، والتأكد من `pg_policies` و`relrowsecurity` و`pg_default_acl`.
2. `SET ROLE aigas_runtime; SET LOCAL aigas.user_id=...; SET LOCAL aigas.tenant_id=...` ثم قراءة جدول مؤسسة أخرى → صفر صفوف.
3. محاولة `INSERT` بـ`tenant_id` مختلف → رفض `WITH CHECK`.
4. `SET ROLE authenticated` ثم REST/`SET ROLE` على `public` → رفض الصلاحية.
5. تكرار السيناريو عبر pooler للتأكد من عدم بقاء سياق بين الطلبات.

التفاصيل التنفيذية والسيناريو الكامل (Tenant A/B) في `docs/TENANT-ISOLATION-VERIFICATION.md`؛ الحالة تبقى `NOT RUN` حتى موافقة المالك وتشغيله على staging.
