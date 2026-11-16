# تدقيق عزل المؤسسات وRLS وLedger — 2026-11-16

> **النطاق:** مراجعة قراءة فقط للمصدر العامل (Production)، وStaging، وledger المهاجرات حتى `0033`، ومسارات API، وatomicity منحة 48 ساعة.
> **القيود المنفّذة:** لم يُطبَّق أي أمر على Neon Production، ولم يُنشأ فرع، ولم تُعدَّل حماية فرع، ولم تُكتب بيانات على Staging. كل استعلام على Neon كان `SELECT` أو `SET LOCAL` داخل معاملة ثم `RESET ROLE`.
> **الحكم:** `NO-GO` لتجربة Live 48 ساعة. المختبر العام `/demo/*` مستقل و`GO`. خطة Production جاهزة للاعتماد، غير مطبقة.

---

## 1. الخلاصة التنفيذية

| المحور | الحالة | الدليل |
|---|---|---|
| Staging posture (RLS/أدوار/سياسات) | **PASS قراءة فقط** | 42 جدولًا، 90 سياسة، RLS 42/42، FORCE 2، صفر منح عميل |
| Staging ledger | **PASS** | 29 صفًا APPLIED، و29/29 checksum مطابق للملفات المحلية |
| Staging عزل A/B | **PASS قراءة فقط** | Tenant A: 5 صفوف access؛ Tenant B: 0؛ outsider: 0؛ scope B=false |
| Local RLS matrix | **72/74 — FAIL** | فجوة posture واحدة في `0033` تنتج فشلين |
| Local 48h exploration | **PASS 1/1** | سباق حصة، إلغاء، انتهاء، سقف، منع كتابة runtime |
| Local trial cycle | **111/112** | الفشل الوحيد wiring لـfixture `EXPLORATION_TEST_DATABASE_URL` |
| Production RLS الفعلي | **FAIL** | 31 جدولًا، سياستان فقط، والتطبيق/`.env` يتصلان بدور المالك `BYPASSRLS` |
| Production Data API | **خطر مرتفع** | `active` على `public`، `anonymous`، aggregates=true، و31 جدولًا بمنح `authenticated` |
| Production ledger | **غائب** | لا `ops.aigas_migration_ledger`؛ الحالة مستنتجة من الكتالوج |
| حماية الفرع | **FAIL** | `production` و`p08-restore-20261110` بلا حماية، PITR 6 ساعات |
| بوابة Live 48h | **مغلقة** | 0 منح استكشاف نشطة، 0 readiness، 0 quota، 0 trials، والبوابة `AIGAS_APP_ENABLED=false` |
| المختبر العام | **مستقل** | `prerender`, `connect-src 'none'`, بلا Auth/API/تخزين |

**الخلاصة:** لا يصح وصف RLS بأنها طبقة عزل على المصدر العامل اليوم. RLS مثبتة على Staging ومختبرة محليًا، لكن Production يعمل بدور مالك `BYPASSRLS`، و`.env` المحلي يشير إلى Production بدور المالك. لذلك تظل Live 48h مغلقة حتى تنتهي بوابة cutover والتحقق السلوكي على Staging.

---

## 2. منهج التحقق والأدلة

| الأداة/المصدر | ما نُفّذ | الناتج |
|---|---|---|
| Neon MCP (قراءة) | `get_data_api`, `list_branches`, `run_sql`, `run_sql_transaction` | لقطات Production/Staging |
| `scripts/verify-runtime-rls.mjs` | عنقود PG18.6 محلي معزول | `Audit/tenant-isolation-2026-11-16/local-rls-matrix.json` |
| `scripts/verify-exploration-local.mjs` | عنقود PG18.6 محلي | `exploration-verify.log` — PASS |
| `scripts/verify-trial-local.mjs` | عنقود PG18.6 محلي | `trial-verify.log` — 111/112 |
| `node --test tests/migration-order.test.mjs` | تحقق الترتيب والـenvelope | 5/5 PASS |
| مراجعة كود | `src/server/kernel/*`, `src/pages/app/api/**` | جدول المسارات في §6 |

**حدود التغطية:** لم تُجرَ كتابة سلوكية على Staging (تتطلب موافقة مالك وبيانات اصطناعية جديدة). التحقق على Staging اقتصر على SELECT و`SET LOCAL ROLE`، وهو لا يثبت رفض INSERT/UPDATE عبر RLS. هذا مثبت محليًا فقط.

---

## 3. الحالة الدقيقة لكل بيئة

### 3.1 Production (`young-frog-60183055` / `br-young-bird-b43proeb`)

| القياس | القيمة |
|---|---|
| جداول `public` / `aigas_*` | 31 / 31 |
| سياسات RLS | **2** فقط، وكلتاهما `TO PUBLIC` وتقرأ GUC قديمًا `aigas.sc_*` |
| RLS enabled / forced | 31 / **0** |
| `aigas_runtime` | **غير موجود** |
| ledger المهاجرات | **غير موجود** (`ops` غائب) |
| منح `authenticated` | جداول AIGAS بـ31/31 عليها صلاحيات |
| Data API | `active`، `db_schemas=["public"]`، `db_anon_role=anonymous`، aggregates=true |
| دور المالك | `neondb_owner`: LOGIN + **BYPASSRLS** |
| حماية الفرع | `protected=false`؛ فرع الاستعادة أيضًا غير محمي؛ `store_passwords=true`؛ history retention=21,600s (6h) |

**فجوات عن رأس Staging:** 11 جدولًا: `aigas_exploration_grants`, `aigas_hg_delegations`, `aigas_hg_grants`, `aigas_release_readiness`, `aigas_trial_*` الخمسة، `aigas_trial_operators`. وانحراف كائنات جزئي: أعمدة 0017 غائبة، حارس سلسلة 0013 غائب، فهارس 0022 غائبة، أعمدة 0026 غائبة، و`required_approvals` من 0020 موجود مسبقًا.

### 3.2 Staging (`lucky-salad-43566291` / `br-rough-wind-bdkmg13n`)

| القياس | القيمة |
|---|---|
| جداول / سياسات | 42 / 90 |
| RLS enabled / forced | 42 / 2 (`aigas_sc_conversations`, `aigas_sc_messages`) |
| جداول بلا RLS | 0 |
| منح/تنفيذ للعميل | 0 جدول، 0 دالة |
| `aigas_runtime` | NOLOGIN, NOINHERIT, NOBYPASSRLS، 15 دالة و37 جدول SELECT |
| Login القناة | `aigas_t03_exploration_login` → `SET ROLE aigas_runtime` = true؛ ولا يستطيع `SET ROLE neondb_owner` |
| Definer functions | 15/15 بـ`search_path=pg_catalog, public`، والملكية `neondb_owner` |
| Ledger | `ops.aigas_migration_ledger`، 29/29 APPLIED، 29/29 hash مطابق |
| Data API | غير موجود (404) |
| Exploration | 10 منح (2/منتج)، **0 نشطة**، 0 ملغاة، 200 سقف/منتج |
| Trial gate | 1 operator، 0 readiness، 0 quota limits، 0 trials، 0 usage |
| حماية الفرع | `protected=false` |

**عزل A/B على Staging (SELECT فقط):** بعد `SET LOCAL ROLE aigas_runtime` وضبط GUCs من جلسة DBA:
- Tenant A: `aigas_product_access=5`, `aigas_audit_events=1`, `aigas_tenant_scope(A)=true`.
- Tenant B: `aigas_product_access=0`, `aigas_audit_events=0`, `scope(B)=false`.
- outsider بلا عضوية: `aigas_tenants=0`, `scope(A)=false`.
- الجدول `aigas_memberships` يعيد صف الفاعل فقط في وضع B، وهو مقصود لاكتشاف العضوية.

---

## 4. مراجعة ledger والاعتماديات والـchecksums

**الترتيب المعتمد** في `scripts/migration-order.mjs`:

```
FRESH_ORDER = 0001..0010, 0014..0018, 0020..0033        (يستثني UPGRADE_ONLY)
UPGRADE_ONLY = 0011, 0012, 0013, 0019
DELTA_ORDER  = 0013, 0014, 0016, 0017, 0018, 0020, 0021, 0022,
               0023, 0025, 0026, 0027, 0028, 0029, 0024, 0030, 0031, 0032, 0033
```

| فحص | النتيجة |
|---|---|
| checksums محلية = ledger Staging | **29/29 PASS** (كل الصفوف المطبقة) |
| 0011/0012/0013/0019 خارج ledger | متوقع: `UPGRADE_ONLY` |
| ترتيب الاعتماديات | PASS: 0023→0030، 0025→0027/0028، 0026→0031، 0030→0032، 0033 أخيرًا |
| `tests/migration-order.test.mjs` | 5/5 PASS |
| إعادة تشغيل نفس الملف بعد تعديله | يرفض: `resumeOrder` يتحقق من الـhash قبل الاستئناف |
| إنتاج ledger إنتاجي | **غائب** — لا يمكن إثبات ما طُبّق |

**ملاحظة حرجة:** ملفات `0017`, `0021`, `0026`, `0031`, `0033` لا تحتوي حراسات `IF NOT EXISTS` على مستوى العبارة. `0021/0026/0031` تستخدم `CREATE OR REPLACE` للدالة فتعيد الكتابة بأمان، لكن `0017` و`0026` تضيف أعمدة/قيودًا بلا حراسة. على Production الحالي الأعمدة غائبة، فالتطبيق الأول ناجح؛ لكن أي إعادة جزئية بلا ledger تحتاج preflight صريحًا قبل التنفيذ.

**نافذة `0023`→`0025`:** بين الترحيلين تبقى دوال trigger من `0023` قابلة للتنفيذ من PUBLIC حتى يسحبها `0025`. لا تُقسم النافذة؛ طبّق 0023 ثم 0025 في نفس نافذة الصيانة، ثم 0030/0032.

---

## 5. النتائج مرتبة بالخطورة

### F1 — Production Data API مفتوح على `public` مع منح عميل — **Critical**

- `db_schemas=["public"]`، `anonymous`، `aggregates=true`، و`authenticated` يملك صلاحيات على 31 جدولًا.
- الحاجز الحالي ليس «صفر منح» بل RLS مفعّلة بلا سياسات على 29 جدولًا (deny) + سياستان قديمتان تعتمدان `aigas.sc_*` غير مضبوطين.
- هذه ليست حالة عزل معتمدة. أي منح جديد أو سياسة permissive جديدة تفتح مسارًا مباشرًا يتجاوز Node.
- **المطلوب:** تعطيل Data API (الخيار A المعتمد شرطيًا) أو تقييده بمخطط غير AIGAS. إجراء control plane، يحتاج مالك المنصة.
- **دليل:** `production-baseline.json`، `docs/DATA-API-EXPOSURE-DECISION.md`.

### F2 — التطبيق متصل بدور المالك `BYPASSRLS` — **Critical**

- `.env` المحلي يشير إلى endpoint الإنتاج بدور `neondb_owner`، و`NODE_ENV=development` يفتح البوابة (`isPortalEnabled`).
- `.env.staging.local` يشير إلى Staging بدور `neondb_owner` أيضًا.
- `connectionPrivilege` يعيد `rlsEnforced=false`، و`AIGAS_REQUIRE_RLS` غير مضبوط.
- النتيجة: كل عزل التطبيق اليوم يعتمد على شروط `tenant_id` الصريحة في SQL، لا على RLS.
- **المطلوب:** DSN runtime بدور `NOBYPASSRLS`، و`AIGAS_REQUIRE_RLS=true`، ومنع `start:local` من الإنتاج بإضافة حارس بيئة.

### F3 — `0033` أسقطت `aigas_client_deny` عن جدول جديد — **High**

- `aigas_exploration_grants` يحمل RLS وسياسة `exploration_read` فقط، بلا سياسة restrictive deny.
- النتيجة: المصفوفة المحلية تفشل في فحصين:
  - `DB06/client-deny-restrictive`: 41/42.
  - `DB06/runtime-verb-matrix-exact`: الجدول الجديد غير معروف للمصفوفة.
- لا تسريب حالي (لا منح عميل)، لكنه يكسر الثابت الأمني: «كل جدول AIGAS عليه client deny».
- **المطلوب:** `0034` forward-only (لا تعديل `0033` المطبق).

### F4 — `FORCE RLS` لا يحمي من المالك `BYPASSRLS` — **High (تصحيح ادعاء)**

- `0027` تضع FORCE على جدولي محتوى Secure Chat، لكن `neondb_owner` يملك `rolbypassrls=true`، وFORCE لا يتجاوزه PostgreSQL.
- لذلك عبارة «المحتوى للمشارك فقط حتى في مواجهة المالك» غير صحيحة على المصدر الحالي. الضابط الحقيقي هو cutover إلى `aigas_runtime`.
- `0025` §9 توثق هذا القرار؛ لا تُضف FORCE شاملًا كبديل.

### F5 — لا ledger إنتاجي — **High**

- لا `ops.aigas_migration_ledger`، ولا `ops` schema. الحالة الحالية مستنتجة من الكتالوج.
- لا يمكن إثبات أي hash أو استئناف آمن. `apply-migrations.mjs --mode resume` يرفض بلا ledger، و`delta` يتحقق فقط من قائمة 31 جدولًا.
- **المطلوب:** اعتماد «خط أساس موثق» قبل delta؛ لا كتابة receipts كاذبة لملفات لم تُنتج الحالة الفعلية.

### F6 — حماية الفرع وPITR — **High**

- `production` و`p08-restore-20261110`: `protected=false`.
- `store_passwords=true`.
- history retention = 6 ساعات. نافذة 48h تتجاوزها؛ بعد 6 ساعات لا يكفي PITR للتراجع عن تغيير بدأ قبل النافذة.
- **المطلوب:** فرع pre-change محمي + snapshot/استعادة مثبتة قبل أي DDL.

### F7 — Bootstrap أول مساحة عمل بعد cutover — **High (blocker)**

- `createWorkspace` يكتب `aigas_tenants` و`aigas_memberships` مباشرة.
- `aigas_runtime` لا يملك INSERT على `aigas_tenants` (0025 لا تنشئ POLICY له)، والدور NOLOGIN ولا يوجد `SET ROLE` في `db.mjs`.
- النتيجة: عند تحويل DSN إلى runtime، إنشاء أول workspace سيفشل `42501` ويُعيد `WORKSPACE_PROVISIONING_REQUIRED`. كذلك قبول الدعوة.
- **المطلوب:** دالة `SECURITY DEFINER` ضيقة للـbootstrap + login role + `SET ROLE` في الاتصال، أو إبقاء الإنتاج على المالك (وهذا يلغي RLS).

### F8 — فحص Banned غائب من `aigas_is_tenant_member` — **Medium**

- RLS تقبل أي صف عضوية، ولا تنظر إلى `neon_auth.user.banned`.
- الخادم يفحص banned في `memberships` و`aigas_lock_member`، لكن أي مسار جديد يضبط GUCs بلا `lock_member` سيسمح لحساب محظور بتوكن ساري.
- **المطلوب:** إضافة `u.banned IS NOT TRUE` في 0034 (defense-in-depth).

### F9 — سقف الحصة global لا per-trial — **Medium (قرار أعمال)**

- `aigas_trial_quota_limits` مفتاحه `product_slug` فقط؛ كل التجارب تتشارك نفس السقف المعلن.
- لا overrides لكل مؤسسة/تجربة. إذا كان المقصود «سقف لكل تجربة»، فالتصميم الحالي لا يعبّر عنه.
- **المطلوب:** تأكيد مالك المنتج، أو إضافة عمود/جدول override مع approval.

### F10 — جدول reservations ينمو مع كل محاولة مرفوضة — **Medium (latent)**

- `aigas_trial_consume_quota` يُدخل صف reservation حتى عند `allowed=false` (سجل تدقيق).
- لا route حاليًا يستدعي `consumeTrialQuota`، لكن P07–P11 سيفتحه. مشغّل خبيث/خطأ retry بمفاتيح فريدة ينمو بلا حد.
- **المطلوب:** rate limit/سقف reservations أو عدم إدخال المرفوض بعد N محاولات، مع الاحتفاظ بدليل التدقيق.

### F11 — `close` لا يغلق entitlement — **Medium**

- `operatorCloseTrial` يحدّث الطلب إلى `CLOSED` لكن يترك `aigas_trial_entitlements.status='ACTIVE'`.
- `consume` يرفض لأن حالة الطلب ليست ACTIVATED، لكن أي مستهلك آخر يقرأ entitlements سيظنها نشطة.
- **المطلوب:** `UPDATE ... SET status='CLOSED'` داخل نفس المعاملة، أو توثيق أن consume هو الضابط الوحيد.

### F12 — مسار `firewall/enforce` يسمح بطلب بلا Origin — **Low/Medium**

- `readBody` يسمح `origin === null` لطلب `enforce` إذا وُجد Bearer، لعملاء التكامل.
- لا تنفيذ خارجي: يُسجّل قرارًا فقط، لكنه يوسّع سطح CSRF/التكامل. **المطلوب:** توثيق عملاء التكامل أو تضييق الشرط.

### F13 — `/app/api/kernel/health` بلا مصادقة — **Low**

- يعيد أكواد تهيئة فقط، لكنه oracle للاعتمادات عند فتح البوابة. لا أسرار. مقبول إن بقي `no-store` وبوابة مغلقة.

### F14 — قابلية الوصول إلى `aigas_exploration_consume` — **PASS**

- `SECURITY DEFINER`، `search_path` مثبت، `FOR UPDATE`، فحص العضوية والنافذة والسقف، وإدخال audit. لا منح لـPUBLIC/العميل. المخاطرة الوحيدة هي الفجوة F3 على جدول القراءة، لا على الدالة.

---

## 6. مسارات API — أي مسار يفتح تنفيذًا غير مقصود؟

**37 مسارًا** تحت `src/pages/app/api`. كلها خلف `middleware` وبوابة `AIGAS_APP_ENABLED`، ومعظمها `kernelHandler` الذي يفرض JWT.

| المسار/المجموعة | المصادقة | الصلاحية | التنفيذ | الحكم |
|---|---|---|---|---|
| `/app/api/kernel` GET/POST | JWT | عضو/أي مستخدم لإنشاء workspace | كتابة tenants/memberships | **blocker بعد cutover** (F7) |
| `/app/api/kernel/{members,invitations,policies,products,trials}` | JWT | workspace selector + membership + role | إدارة | سليم؛ workspace ليس تفويضًا |
| `/app/api/operator/trials/*` | JWT | `aigas_trial_operators` صف ACTIVE | قرار/تفعيل/إغلاق | سليم؛ لا دور من التوكن |
| `/app/api/human-gate/**` | JWT | product access + policy + permit | تغيير اسم workspace أو demo note فقط | سليم؛ لا adapter عام |
| `/app/api/firewall/**` | JWT | product access + role | تقييم/تسجيل قرار | لا تنفيذ خارجي |
| `/app/api/ledger/**`, `/risk-engine/**` | JWT | tenant + product access | CRUD/export | سليم؛ tenant من العضوية |
| `/app/api/secure-chat/**` | JWT | product access + model + policy + quota | إرسال لمزود | مغلق؛ provider غير مهيأ |
| `/app/api/kernel/health` | **بلا JWT** | — | أكواد فقط | مقبول |
| `/api/observability` | **بلا JWT** | same-origin + 256B + 30/min | إرسال telemetry | مقبول |
| `/demo/*` | بلا | — | محاكاة static | **مستقل وآمن** |

**الاستنتاج:** لا يوجد مسار يفتح تنفيذًا عامًا أو يشتق tenant من body/query بلا عضوية. أخطر «تنفيذ غير مقصود» هو **تشغيل الخادم محليًا على DSN الإنتاج بدور المالك** (F2)، ثم **createWorkspace** بعد cutover (F7).

**تفصيل إثبات الهوية:**
- `auth.mjs:29-32`: `sub` فقط من JWT موقّع EdDSA، ورفض `role=anonymous`/`is_anonymous`.
- `service.mjs:24-32`: `workspace` مجرد selector على `memberships`؛ `setTenantScope` بعد اختيار عضوية.
- `access.mjs:123-128`: العضوية تُقرأ بـ`aigas_lock_member(tenant, tokenUserId)`، و`requireRole`.
- `http.mjs:56`: تمرير `workspace` فقط؛ لا `tenant_id` من body.
- `exploration.mjs`: tenantId يأتي من `tenantGuard`.
- `trial-service.mjs:89-94`: operator من جدول، لا claim.

---

## 7. 48 ساعة: atomicity الإلغاء والسقف

**منحة الاستكشاف (0033):** `aigas_exploration_consume`:
- `FOR UPDATE` على صف المنحة → تزامن صحيح.
- فحص `revoked_at`، `starts_at`، `ends_at`، `used < limit_units`.
- `used=used+1` + audit في نفس المعاملة.
- `limit_units` بين 1 و10000؛ Staging 200/منتج.
- الدليل المحلي: سباق ناجح واحد من محاولتين، رفض الثاني `EXPLORATION_QUOTA_EXCEEDED`، ثم `EXPLORATION_EXPIRED` بعد نافذة 48h، ورفض runtime لـ`UPDATE` مباشر.
- **لا idempotency** للتجربة: إعادة المحاولة تستهلك وحدة. مقبول للتصفح، ويجب توثيقه.

**حصة التجربة (0030):** `aigas_trial_consume_quota`:
- `INSERT ... ON CONFLICT` ثم `SELECT ... FOR UPDATE` → serialize.
- replay بـ`idempotency_key` يعيد `used_after` المخزّن.
- `v_allowed = v_used + p_units <= v_limit`؛ لا refund عند الإلغاء.
- فحص `state=ACTIVATED`، النافذة، والاستحقاق النشط.
- **مخاطر:** F9 (global limit)، F10 (نمو reservations)، F11 (entitlement بعد close).

**Revocation:**
- الاستكشاف: `revoked_at` فقط عبر المالك؛ runtime لا يملك UPDATE.
- التجربة: لا `revoked_at` على quota limits؛ الإلغاء عبر `expires_at`/حذف/إغلاق الطلب. `close` لا يغلق entitlements (F11).
- Auth sessions لا تُبطل عند close (مذكور في العقل)؛ يبقى التوكن ساريًا حتى انتهائه/تسجيل الخروج.

---

## 8. مصفوفة القبول

| معيار القبول | الحالة | ملاحظة |
|---|---|---|
| Staging verification موثق | **PARTIAL** | قراءة فقط PASS؛ السلوكي (INSERT/UPDATE/Auth) NOT RUN |
| خطة Production معتمدة قبل التطبيق | **NOT YET** | الخطة جاهزة في `docs/AIGAS-DELTA-MIGRATION-PLAN-2026-11-16.md`؛ تحتاج توقيع Owner/Operator |
| Live 48h مغلقة حتى نجاح RLS/identity/role | **PASS (مغلقة)** | لكنها مغلقة بالغياب لا بالتحقق: 0 grants نشطة، 0 readiness/quota |
| RLS/identity/role isolation على المصدر العامل | **FAIL** | Production بلا runtime؛ التطبيق/`.env` مالك؛ RLS متجاوزة |
| المختبر العام مستقل وآمن قبل Live | **PASS** | static prerender، CSP `connect-src none`، بلا Auth/API/تخزين |
| عدم استخدام Staging كـPublic Demo | **PASS** | لا route عام يشير إلى Staging DB |

---

## 9. ما تغيّر / ما لم يُنفَّذ

**لم يُنفَّذ:** أي DDL/DCL على Neon، أي فرع، أي تغيير حماية، أي كتابة بيانات، أي تفعيل Live، أي تعطيل Data API.

**أُنتج:** هذا التقرير، لقطتا JSON، سجلا التحقق المحلي، وخطة delta.

**التوصية الفورية:** إبقاء `AIGAS_APP_ENABLED=false` على Production، وعدم فتح Live 48h، وعدم تحويل DSN إلى runtime قبل تنفيذ 0034/0035 والتحقق السلوكي على Staging.
