# P02 — Neon migrations وعزل المؤسسات والذاكرة (أساسのみ)

**الحالة العامة:** PARTIAL. أُنجز الأساس والتحقق في الفرع الاصطناعي المعزول محليًا؛ لم تُنفذ أي كتابة على Staging أو Production.

## ما تغيّر فعليًا

- `scripts/migration-order.mjs`: `DELTA_ORDER` يشمل الآن `0046` و`0047` بعد التحقق من أن Production holds بالضبط الـ31 جدولًا في `LIVE_BASELINE_TABLES`. `UPGRADE_ONLY` (0011/0012/0013/0019) لم يُمسّ ولا يُعاد تشغيله على fresh.
- `migrations/0047_aigas_agent_runtime_persistence.sql` (جديد، additive): 7 جداول `aigas_agent_*`/`tenant_memory`/`budget_reservations`/`outbox` بمفاتيح tenant_id وFKs ومفاتيح idempotency فريدة وRLS + FORCE وسياسة انتهاء ودوال start(uuid)/read(uuid)/budget/expiry وACL. لا أسرار ولا chain-of-thought: الأعمدة مراجع فقط بـCHECK يمنع الحرة النصية.
- إصلاح اعتماد الاسم `neondb_owner` تم في 0047 بشكل كتالوجي (يكتشف مالك `aigas_tenants`) بدل تعديل 0018: تعديل 0018 كان سيبطل checksums الحقيقية المسجلة في Staging والفرع المعزول. ص env revocations محفوظة ومُختبرة مع وجود/غياب authenticated/anonymous.
- دور `aigas_app_login`: LOGIN/NOINHERIT/NOBYPASSRLS، membership في `aigas_runtime` بـ`SET TRUE, INHERIT FALSE`، وصفر منح جداول مباشرة. لا يوجد owner DSN في التطبيق.
- `src/server/kernel/db.mjs`: يرفض اتصالًا يكون `session_user` فيه مالك جداول `aigas_%` (OWNER_DSN_REFUSED) قبل SET ROLE.
- `tests/migration-order.test.mjs` و`scripts/db-migration-rehearsal.mjs`: تحديث التوقعات وإضافة تحقق سلوكي للوكيل (start/read/idempotency/no-secret) عبر دور_login المحدود.

## الأدلة

- `rehearsal.json`: PG 18.6 — fresh 43/43، delta 44/44، resume 25 ثم 18/18، client_roles_absent 43/43، 54 جدولًا، 112 سياسة، و14/14 negative cases PASS.
- `verify-agent-persistence.sql` + تنفيذ على `raspy-surf-09603889/br-noisy-frog-bdwi4d6d` عبر معاملة أُرجعت: PASS للكتالوج، التوقيعات، grants/search_path، replay، cross-tenant،budget atomicity، ورفض مرجع يشبه سرًا؛ صفر صفوف متبقية بعد ROLLBACK.
- `catalog-snapshot.json` / `catalog-diff.json` / `CHECKSUMS.txt`: قياسات حقيقية من الكتالوجات ومجموعات SHA-256 للملفات الـ47.
- إيصال 0047 في الفرع المعزول: SHA `0d426c6291ea48b0b1c6529f5c30fcc18be58826997814d540e00fbbd3949cf6`، 209ms، APPLIED، 2026-11-26T18:51:37Z. الإيصالات الـ42 السابقة لم تُلمس.

## حالة معايير الإغلاق

| المعيار | الحالة | البيئة التي تحققت فيها | الحد المتبقي |
|---|---|---|---|
| DB-01 | PARTIAL | PASS في الفرع المعزول (54 جدولًا)؛ Staging 43 وProduction 31 | تطبيق delta على Staging/Production في P16/P34/P15 |
| DB-02 | FAIL_VERIFIED في Production | PASS في الفرع المعزول فقط | Production بلا `aigas_runtime`؛ لا كتابة قبل P15 |
| DB-03 | FAIL_VERIFIED في Staging | PASS في الفرع المعزول | Staging ما زال عند 0036؛ الدوال uuid غائبة |
| DB-04 | PASS في الفرع المعزول | 7/7 جداول جديدة FORCE + client deny، دوال بلا EXECUTE للعميل | إعادة القياس في Staging/Production |
| DB-05 | PASS في الفرع المعزول | agent persistence replay، budget atomicity، memory ACL结构، expiry | اختبارات P20 للاستخدام الحقيقي |
| DB-06 | FAIL_VERIFIED في Production | 54/54 في الفرع المعزول، 43/43 في Staging | Production 2/31 |
| DB-07 | PASS في الفرع المعزول | 43 إيصالًا حقيقيًا و47 ملفًا مطابقًا للـSHA، fresh/delta/resume PASS | مطابقة السجل في Staging/Production بعد التطبيق |

## أخطاء حقيقية اكتُشفت وأُصلحت أثناء التحقق

1. `ALTER ROLE` بسمة SUPERUSER من مالك غير superuser → 42501؛ أُزيل Alter واستُبدل بفحص fail-closed.
2. FK مركّب إلى `aigas_agent_steps(tenant_id,id)` بلا UNIQUE → 42830؛ أُضيف UNIQUE (tenant_id,id).
3. بدالة `aigas_agent_start` كان فحص النطاق على معرّف الطلب بدل مؤسسة المعاملة → 42501؛ أُصلح.
4. حد PostgreSQL الأقصى لتكرار regex هو 255 لا 512 → 2201B؛ صُغّرت كل مراجع `{1,255}` وأُضيف اختبار سلوكي يكشفه.

## حدود صريحة

لم يُفتح P15؛ لم تُطبّق أي خطة على Production أو Staging. لا ادعاء PASS_VERIFIED في هاتين البيئتين، ولا ادعاء production ready أو امتثال.
