# مصفوفة صلاحيات RLS ودور التشغيل — AIGAS

> **الحالة:** مُشتقّة من كتالوج مقاس، لا من نيّة تصميم. المصدر المحلي: `Audit/p03-runtime-rls-2026-11-10/local-runtime-rls.json` (PG 18.6، عنقود معزول، 69/69 فحصًا). المصدر الخارجي: `Audit/p03-runtime-rls-2026-11-10/neon-staging-posture.json` (قراءة فقط على `lucky-salad-43566291` / `br-rough-wind-bdkmg13n`، 9/9 فحوص وضع).
> **لا يمثل هذا المستند إثبات production ولا موافقة إطلاق.** `PASS ≠ RELEASED`.
> لا يحتوي هذا الملف أي DSN أو سر أو محتوى عميل.

---

## 1. الأدوار ومن يملك ماذا

| الدور | LOGIN | SUPERUSER | BYPASSRLS | يملك جداول AIGAS | الاستخدام المعتمد |
|---|---|---|---|---|---|
| `neondb_owner` | نعم | لا | **نعم** | **36/36** | migrations وops فقط. **ليس دور التطبيق.** |
| `aigas_runtime` | لا (NOLOGIN) | لا | **لا** | **0** | دور التطبيق. يصل إليه login منفصل بـ`SET ROLE`. |
| login المشغّل (نموذج `p03_runtime_login`) | نعم | لا | لا | 0 | `NOINHERIT` + عضوية `aigas_runtime` بـ`SET TRUE` فقط. |
| `authenticator` | نعم | لا | لا | 0 | Data API فقط: `SET ROLE authenticated`/`anonymous`. |
| `authenticated` | لا | لا | لا | 0 | دور JWT. **صفر منح.** |
| `anonymous` | لا | لا | لا | 0 | دور JWT غير موثّق. **صفر منح.** |
| `cloud_admin` / `neon_service` | نعم | admin / لا | نعم | 0 | منصة Neon، خارج مسار التطبيق. |

قياسات مؤكدة على الهدف المعزول: `aigas_runtime` = `rolsuper=false, rolbypassrls=false, rolcreaterole=false, rolcreatedb=false, rolreplication=false, rolcanlogin=false, rolinherit=false`، وعضوياته `[]` (لا `neondb_owner` ولا `authenticated`).

**قاعدة الملكية:** `BYPASSRLS` وحدها لا تكفي للحكم. الشرط الفعلي هو أن يكون دور الاتصال **غير مالك** و`NOBYPASSRLS`. لذلك يُقاس `pg_class.relowner` صراحةً: 36 جدولًا مملوكة `neondb_owner`، وصفر لـ`aigas_runtime`. عندها يكفي `ENABLE ROW LEVEL SECURITY` بلا `FORCE` لخضوع دور التطبيق، و`FORCE` يبقى مطلوبًا فقط للجداول التي قد يملكها دور آخر لاحقًا.

`FORCE ROW LEVEL SECURITY` = جدولان فقط: `aigas_sc_conversations` و`aigas_sc_messages`. المالك `BYPASSRLS` يتجاوزهما، وقياس `owner-reads-all-content-baseline` يثبت ذلك (قرأ 2 رسالة) — أي أن cutover إلى `aigas_runtime` هو الضابط، لا `FORCE`.

---

## 2. مصفوفة الأفعال — `aigas_runtime`

مقاسة بـ`has_table_privilege` على 36 جدولًا ومطابقة لكتلة §3 في `migrations/0025`. أي انحراف يفشل الفحص `runtime-verb-matrix-exact` (حاليًا: صفر انحراف محليًا وعلى الهدف).

| الأفعال | العدد | الجداول |
|---|---|---|
| `SELECT, INSERT` | 13 | `audit_events`, `auth_organizations`, `department_events`, `fw_decisions`, `hg_decisions`, `hg_events`, `kernel_policy_decisions`, `ld_events`, `policy_approvals`, `re_asset_revisions`, `re_treatment_revisions`, `sc_cancellations`, `trial_events` |
| `SELECT` فقط | 4 | `ld_evidence_requirements`, `product_grants`, `trial_entitlements`, `trial_requests` |
| `SELECT, INSERT, UPDATE` | 9 | `departments`, `hg_requests`, `member_invitations`, `policies`, `policy_delegations`, `policy_versions`, `product_access`, `re_assets`, `sc_requests` |
| `SELECT, UPDATE` | 1 | `tenants` (لا INSERT/DELETE: bootstrap مسار مميز) |
| `SELECT, INSERT, UPDATE, DELETE` | 7 | `department_memberships`, `fw_rules`, `hg_delegations`, `hg_grants`, `hg_policies`, `memberships`, `re_assessments` |
| بلا أي فعل | 2 | `sc_conversations`, `sc_messages` |

`TRUNCATE` و`REFERENCES` و`TRIGGER` = صفر على كل الجداول. التسلسلات: صفر منح. `public` schema: `USAGE` فقط.

**ملاحظة أقل صلاحية (مفتوحة):** الصفوف السبعة ذات CRUD الكامل تأتي من فرع `ELSE` في `0025` §3، لا من قائمة صريحة. RLS تقيّد الصفوف، لكن السطح أوسع من الحاجة، وأي جدول جديد غير مذكور سيرث CRUD صامتًا. راجع `docs/DATA-ACCESS-AND-RLS.md` §6 والتقرير `Audit/p03-runtime-rls-2026-11-10/REPORT.md` (F2).

---

## 3. نموذج السياسات

| النطاق | السياسة | الأفعال | المنطق |
|---|---|---|---|
| 32 جدولًا يحمل `tenant_id` | `aigas_runtime_tenant` | FOR ALL TO `aigas_runtime` | `USING`/`WITH CHECK` = `aigas_tenant_scope(tenant_id)` |
| `aigas_tenants` | `aigas_runtime_tenant_read` | SELECT | `aigas_is_tenant_member(id)` |
| `aigas_tenants` | `aigas_runtime_tenant_rename` | UPDATE | نطاق + `aigas_actor_is_manager(id)` |
| `aigas_memberships` | `self_membership` / roster read / insert / update / delete | SELECT/SELECT/INSERT/UPDATE/DELETE | العضو يقرأ صفه؛ المدير يدير غيره؛ **لا تعديل لصف الفاعل نفسه** |
| `aigas_sc_conversations`, `aigas_sc_messages` | `sc_content_participant` | FOR ALL TO PUBLIC | `tenant_id = GUC AND user_id = GUC` — **المشارك فقط** |
| 36 جدولًا | `aigas_client_deny` | RESTRICTIVE FOR ALL TO PUBLIC | `current_user NOT IN ('authenticated','anonymous','authenticator')` |

المجموع 77 سياسة: 64 (32×tenant+deny) + 6 (memberships) + 3 (tenants) + 4 (content: participant+deny لكل جدول). كل جدول يحمل `tenant_id` له سياسة permissive (فحص `permissive-policy-per-tenant-table` = صفر فجوة).

---

## 4. دورة حياة سياق المؤسسة (GUC)

1. الخادم يتحقق من JWT ثم يقرأ العضوية، وبعدها فقط يستدعي `set_config('aigas.tenant_id'|'aigas.user_id', …, true)`.
2. `true` = نطاق معاملة. `src/server/kernel/db.mjs` يفرض وجود معاملة عبر `SAVEPOINT` ويفشل بـ`TENANT_SCOPE_UNAVAILABLE` بدل تنفيذ استعلام غير منظور.
3. يُقرأ GUC بعد ضبطه (`set_config` return) لمقاومة pooler يتجاهل الضبط.
4. السياسات لا تثق بالـGUC وحده: `aigas_tenant_scope` يتحقق من **عضوية الفاعل** في نفس المؤسسة.

سلوك مقاس (دور `aigas_runtime`):

| السيناريو | النتيجة المقاسة |
|---|---|
| بلا نطاق | 0 صفوف |
| نطاق A | صفوف A فقط |
| `WHERE tenant_id = B` تحت نطاق A | 0 صفوف (لا خطأ يكشف الوجود) |
| `INSERT` بـ`tenant_id = B` تحت نطاق A | `42501 new row violates row-level security policy` |
| `UPDATE`/`DELETE` على صفوف B | 0 صفوف متأثرة |
| هوية بلا عضوية داخل A | 0 قراءة، وكتابة مرفوضة `42501` |
| تبديل selector A → B(actor غير عضو) → A داخل معاملة | `[A] → [] → [A]` |
| `tenant_id=A` مع actor من B | 0 صفوف |
| بعد `COMMIT`/`ROLLBACK` | القيمة `''`، والمعاملة التالية 0 صفوف |
| اتصال جديد | سياق فارغ |
| `SET row_security = off` | `42501 query would be affected by row-level security policy` |

**حدود الأمان (مهم):** RLS تعزل المؤسسات، لكنها لا تصادق هوية. أي جهة تحمل اعتماد `aigas_runtime` تستطيع كتابة أي UUID في GUC ثم تمرير فحص العضوية لذلك المستخدم. لذلك الحد الفعلي: التحقق من JWT والعضوية في الخادم **ثم** ضبط السياق داخل معاملة. لا تُمنح صلاحية `aigas_runtime` لأي مسار عميل، ولا يُقبل `tenant` من جسم الطلب.

---

## 5. الدوال و`EXECUTE`

- 25 دالة `aigas_*` في `public`. `authenticated` و`anonymous` = **صفر EXECUTE** على كل الدوال (فُحصت بـ`has_function_privilege`، ويشمل مسار `PUBLIC`).
- 8 دوال `SECURITY DEFINER`: `aigas_is_tenant_member`, `aigas_actor_role`, `aigas_actor_is_manager`, `aigas_lock_member`, `aigas_locked_product_grants`, `aigas_locked_evidence_requirements`, `aigas_sc_usage_window`, `aigas_sc_usage_window_v2`. سبب `DEFINER`: قراءة `aigas_memberships` بلا استدعاء RLS متكرر. مالكها مالك الجداول (`BYPASSRLS`)، وكلها `SET search_path = pg_catalog, public`.
- `aigas_runtime` يملك EXECUTE على 10 دوال فقط: المساعدات الخمس (`aigas_actor`, `aigas_is_tenant_member`, `aigas_actor_role`, `aigas_actor_is_manager`, `aigas_tenant_scope`) + `lock_member` + `locked_product_grants` + `locked_evidence_requirements` + `sc_usage_window` + `sc_usage_window_v2`.
- المساعدات تعيد `boolean`/`text`/`uuid` فقط ولا تكشف صفوفًا. مقاس: عضو → `true/ADMIN/false` حسب الدور؛ غير عضو → `false/null`.
- `qualified` لا تُمنح لأي دور عميل. لو أُضيفت مستقبلًا، فهي تعمل بصلاحيات المالك وتتجاوز RLS — لذلك تُعامل كسطح هجوم يجب مراجعته في كل migration.

---

## 6. التصدير (COPY)

`COPY` يحترم RLS لدور غير مالك. تحت نطاق A، تصدير:
- `DISTINCT tenant_id FROM aigas_fw_rules` → صف A واحد.
- `aigas_audit_events (tenant_id, action)` → صف A واحد.
- `count(*) FROM aigas_memberships` → 3 (أعضاء A).
- `count(*) FROM aigas_fw_decisions` → 1 (قرار A).

لا يظهر أي صف لـB. أي مسار تصدير/تقارير مستقبلي يجب أن يمر بنفس النمط (دور runtime + نطاق معاملة)، لا بـ`neondb_owner`.

---

## 7. الأدوار العميلة (Data API)

| الفحص | النتيجة |
|---|---|
| `authenticated`/`anonymous` على أي جدول AIGAS | 0 منح (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) |
| منح `PUBLIC` على جداول AIGAS | 0 |
| `EXECUTE` على دوال `public` | 0 للدورين |
| Default ACL لـ`neondb_owner` | لا يذكر `authenticated`/`anonymous` |
| `authenticator` بعد `SET ROLE authenticated` | `42501` قراءة |
| `authenticated` → `SET ROLE aigas_runtime` | `42501` |
| `aigas_runtime` → `SET ROLE neondb_owner`/`authenticated` | `42501` |
| `aigas_client_deny` | RESTRICTIVE على 36/36 |

هذه طبقة ثانية مستقلة: حتى لو أُضيف منح بالخطأ، تبقى السياسة المقيدة تمنع أدوار العميل. لكنها لا تغني عن إغلاق Data API على `public` — راجع `docs/DATA-API-EXPOSURE-DECISION.md`.

---

## 8. محتوى Secure Chat (DB07)

مقاس على عنقود محلي بدور اختبار يملك `SELECT, INSERT` على الجدولين فقط (لا يوجد نظير له على Neon؛ وجوده ضروري لتقييم المسند، وإلا يمنع المنح كل شيء قبل السياسة):

| الحالة | النتيجة |
|---|---|
| مشارك يقرأ رسائله | رسالة واحدة فقط |
| مشارك آخر في نفس المؤسسة | رسالة واحدة خاصة به، لا رسائل غيره |
| **ADMIN غير مشارك** | 0 صفوف |
| مالك مؤسسة أخرى | 0 صفوف |
| بلا نطاق | 0 صفوف |
| كتابة منسوبة لمؤلف آخر | `42501` من `WITH CHECK` |
| كتابة المشارك لرسالته | تنجح (ضابط موجب) |

على الهدف المعزول: `aigas_runtime` يملك **صفر أفعال** على الجدولين، و`FORCE RLS` مفعّل، والسياسة `sc_content_participant` تحوي `user_id` في `qual` و`with_check`. أي قراءة عبر التطبيق أو Data API غير ممكنة اليوم؛ إعادة فتح مسار قراءة/احتفاظ تحتاج تغييرًا معتمدًا منفصلًا.

---

## 9. ما لا تثبته هذه المصفوفة

- لا تثبت أن production يستخدم `aigas_runtime`؛ التحقق يحتاج `pg_stat_activity`/إعداد الخدمة في نافذة cutover.
- لا تثبت إغلاق Data API؛ إعداد `db_schemas` يُقرأ من control plane فقط.
- لا تثبت bootstrap أو قبول الدعوة تحت RLS؛ كلاهما `BLOCKED` حتى اعتماد مسار مميز.
- لا تثبت عدم وجود ثغرة منطقية داخل نفس المؤسسة (RBAC على مستوى التطبيق).
- لا تثبت سلوك التطبيق تحت حمل حقيقي، ولا استعادة/RPO/RTO.
