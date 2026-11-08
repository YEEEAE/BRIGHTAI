# CURRENT IMPLEMENTATION REGISTER — BRIGHT AI / AIGAS

> **الغرض:** مصدر واحد لتوحيد الحقيقة بين المتطلبات والكود والمخطط والواجهات، دون تحويل أي متطلب إلى إثبات تشغيل.
> **آخر مراجعة مصدر ومخطط وتشغيل:** 2026-11-08
> **نسخة العمل المحلية:** الفرع `main`، HEAD `5404026c5f01172cd3175a66286d2375554b80d4`. working tree كان نظيفًا قبل مهمة مطابقة Neon بتاريخ 2026-11-08.
> **لقطة الحالة الحالية:** تفاصيل مخطط Neon وترتيب migrations في `Audit/outhers/MIGRATION-SCHEMA-RECONCILIATION-2026-11-08.md`؛ خط أساس الإصدار/المتصفح في `Audit/outhers/RELEASE-TRACEABILITY-BASELINE-2026-11-08.md`. فحص Neon الجديد قراءة فقط.
> **ملاحظة على المرجع الخارجي:** اللقطة المرجعية في نص المهمة كانت GitHub `main` عند `e33b480744b5d0b44344bf469f09b6cbbb50248f`. النسخة المحلية متقدمة عنها، وهذا السجل يعتمد **النسخة المحلية** عند أي اختلاف.
> **حدود الدليل:** لم يُشغّل build أو lint أو typecheck أو اختبارات. فُحصت عبر المتصفح قراءةً فقط URLs البوابة وHealth API وأعادت 404؛ هذا تحقق ضيق من الاستجابة العامة، لا من handler أو نشر HEAD. لم يُنشر شيء.
> **قاعدة:** `APPROVED_REQ` يعني مطلبًا معتمدًا في `MASTER-PROJECT-BLUEPRINT.md` / `PRODUCT-MASTER-CATALOG.yaml`. وجود الكود أو الجدول لا يرفع الحالة إلى `WORKING`.

> **تحديث المعرفة 2026-11-08:** الأعداد العامة أدناه حُدّثت من بناء محلي وفحص HTTP: 32 مقالًا، و56 مسارًا عامًا عاديًا منها 55 في sitemap و`public/llms.txt`. أضيفت 20 مقالة عبر `knowledge/[article].astro`. بقية أدلة المنتج والمخطط في هذا المستند تاريخية ولم يُعَد فحصها في هذه المهمة. لا نشر أو اعتماد تخصصي؛ الدليل: `Audit/knowledge-publication-2026-11-08/REPORT.md`.

---

## 1. سلّم الحقيقة المستخدم

| الحالة | المعنى | ما يجوز قوله |
|---|---|---|
| `APPROVED_REQ` | مطلب معتمد في Blueprint أو Catalog | «مطلوب ومصمم» |
| `SOURCE_PRESENT` | كود أو واجهة أو مسار موجود في النسخة المحلية | «موجود في المصدر» |
| `SCHEMA_PRESENT` | جدول/عمود/دالة موجودة في Neon عند الفحص | «موجود في المخطط» |
| `RUNTIME_NOT_VERIFIED` | لا يوجد دليل تشغيل على بيئة معتمدة | «غير متحقق تشغيليًا» |
| `BLOCKED_BY` | شرط خارجي أو ترحيل ناقص يمنع التشغيل | «محجوب حتى…» |

**حدود عامة ثابتة في هذه اللقطة:**

- `AIGAS_APP_ENABLED` غير مضبوط بـ`true` في المصدر/`render.yaml`؛ البوابة مغلقة افتراضيًا في الإنتاج (`src/server/kernel/env.mjs`).
- `APPROVED_MODELS = []` في `src/server/secure-chat/models.mjs:3`؛ لا يوجد نموذج أو مزود معتمد ومهيأ.
- لا توجد سجلات عمل في Neon: `aigas_tenants = 0`، `aigas_memberships = 0`، `aigas_product_access = 0`، `aigas_fw_decisions = 0`، `aigas_ld_events = 0`، `aigas_hg_requests = 0`، `aigas_re_assets = 0`، `aigas_sc_messages = 0`، و`neon_auth."user" = 0`، `neon_auth.session = 0`.
- RLS مفعّل على 31 جدولًا، لكن السياسات المعرّفة موجودة على جدولين فقط: `aigas_sc_requests` و`aigas_sc_cancellations`. بقية الجداول بلا سياسة RLS، لذا الاعتماد الفعلي على دور التطبيق وصلاحياته لا على RLS وحدها.

---

## 2. جرد المسارات والواجهات

### 2.1 المسارات العامة

| الفئة | العدد | المسارات |
|---|---:|---|
| ثابتة | 11 | `/`, `/about/`, `/services/`, `/pricing/`, `/contact/`, `/compliance/`, `/trust/`, `/privacy/`, `/terms/`, `/docs/`, `/kernel/` |
| منتجات | 6 | `/products/` + خمس صفحات منتجات |
| قطاعات | 4 | `/solutions/government/`, `/solutions/finance/`, `/solutions/healthcare/`, `/solutions/enterprise/` |
| أركان | 3 | `/pillars/safety/`, `/pillars/transparency/`, `/pillars/privacy/` |
| معرفة | 32 | 12 ملفًا مباشرًا و20 مقالة من `src/data/knowledge-guides.ts` عبر المسار الديناميكي |
| **إجمالي المسارات العامة العادية** | **56** | منها 55 متحققة محليًا في sitemap، و`/kernel/` بـ`noindex` |
| خاصة | 2 | `/auth/sign-up/`, `/auth/accept-invitation/` |
| بوابة | 8 أنماط | `/app/`, `/app/firewall/`, `/app/human-gate/`, `/app/kernel/`, `/app/ledger/`, `/app/risk-engine/`, `/app/risk-engine/:assetId`, `/app/secure-chat/` |
| خطأ | 1 | `/404/` |

`/app/` و`/auth/` مستبعدة من sitemap في `astro.config.mjs`، والبوابة محمية بـ`middleware` وتعطي عند تعطيلها 503 صفحة عربية (`APP_UNAVAILABLE`, `no-store`, `noindex`) لكل `/app/*` و503 JSON لكل `/app/api/*`، دون تحويل إلى صفحة عامة. دليل المشغّل: `docs/APP-PORTAL-RUNTIME-HANDOFF.md`.

### 2.2 مسارات API الخادمية (29 ملفًا)

| المنتج | المسارات |
|---|---|
| Kernel | `/app/api/kernel`، `.../health`، `.../invitations`، `.../members`، `.../policies`، `.../products` |
| Firewall | `/app/api/firewall/evaluate`، `.../guarded-executions`، `.../rules` |
| Ledger | `/app/api/ledger/events`، `.../[eventId]`، `.../[eventId]/export`، `.../[eventId]/verify` |
| Human Gate | `/app/api/human-gate/policy`، `.../requests`، `.../requests/[requestId]`، `.../cancel`، `.../decide`، `.../execute`، `.../delegations`، `.../delegations/[delegationId]/revoke` |
| Risk Engine | `/app/api/risk-engine/actions`، `.../export`، `.../assets`، `.../assets/[assetId]`، `.../assessments`، `.../revisions`، `.../treatments` |
| Secure Chat | `/app/api/secure-chat/models`، `.../messages` |

**حدود:** هذه مسارات **موجودة في المصدر** فقط. لا يوجد دليل على نشرها أو على استجابتها على `brightai.live`. عقود `docs/products/*/API-CONTRACT.yaml` تصميمات مقترحة وليست جردًا لهذه المسارات؛ عقد Firewall يعلن صراحة `PROPOSED_NOT_DEPLOYED`.

---

## 3. حالة الترحيلات والمخطط (Neon قراءة فقط)

**آخر تحقق:** Neon MCP قراءة فقط في 2026-11-08 على مشروع `young-frog-60183055`، فرع `production` (`br-young-bird-b43proeb`)، قاعدة `neondb`. لا كتابة ولا DDL ولا جدول migration ledger؛ الحالات استنتاج من الكائنات الفعلية. التفصيل في `Audit/outhers/MIGRATION-SCHEMA-RECONCILIATION-2026-11-08.md`.

عدد جداول `public` المرصود: **31**. لا يوجد جدول تتبع ترحيلات، لذا الحالة أدناه **استنتاج من المخطط الفعلي** لا من سجل تطبيق.

| الترحيل | وجوده في Neon | الدليل المرصود |
|---|---|---|
| `0001_aigas_kernel` | مطبّق | `aigas_tenants`, `aigas_memberships`, `aigas_product_access`, `aigas_audit_events` |
| `0002_aigas_firewall` + `0012` | مطبّق (بالنسخة الخماسية) | `aigas_fw_rules`, `aigas_fw_decisions`, وقيود `ALLOW/WARN/REDACT/ESCALATE/DENY` و`policy_version` و`request_fingerprint` |
| `0003_aigas_ledger` | مطبّق (قيد ثلاثيStates) | `aigas_ld_events`, `aigas_ld_evidence_requirements`، لكن قيد `metadata_json` ما زال يقبل `ALLOW/BLOCK/REDACT` فقط |
| `0004_aigas_human_gate` | مطبّق | `aigas_hg_requests`, `aigas_hg_decisions` |
| `0005_aigas_risk_engine` | مطبّق | `aigas_re_assets`, `aigas_re_asset_revisions`, `aigas_re_assessments` |
| `0006_aigas_kernel_administration` | مطبّق | `aigas_product_grants`, `aigas_auth_organizations`, `aigas_member_invitations`، وعمود `product_access.version` |
| `0007_aigas_human_gate_enforcement` | مطبّق | `aigas_hg_policies`, `aigas_hg_events`، وعمود `tenants.profile_version` |
| `0008_aigas_risk_engine_lifecycle` | مطبّق | `aigas_re_treatment_revisions` |
| `0009_aigas_secure_chat` | مطبّق | `aigas_sc_requests`, `aigas_sc_cancellations`, `aigas_sc_conversations`, `aigas_sc_messages`, وسياسة RLS لجدولين |
| `0010_aigas_kernel_policy_hierarchy` | مطبّق | `aigas_departments`, `aigas_department_memberships`, `aigas_department_events`, `aigas_policy_delegations`, `aigas_policies`, `aigas_policy_versions`, `aigas_policy_approvals`, `aigas_kernel_policy_decisions` |
| `0011_aigas_firewall_execution_binding` | متجاوز/غير مطبّق | غطّاه `0012`؛ لا أثر مستقل له |
| `0012_aigas_firewall_five_state_upgrade` | مطبّق | قيود الحالات الخمس والحقول المرصودة |
| `0013_aigas_ledger_five_state_and_chain_guard` | **جزئي / غير متكامل** | حقول السلسلة و`hash_profile=aigas-ledger-sha256-chain-v2` موجودة؛ دالة/trigger `aigas_ld_events_chain_guard` غائبان، وقيد `metadata_json` لا يزال يقبل قرارات Firewall الثلاثة فقط |
| `0014_aigas_human_gate_cancellation_delegation_and_grant` | **غير مطبّق** | لا يوجد `aigas_hg_delegations` ولا `aigas_hg_grants`؛ لا أعمدة `provider_ref/cancelled_at/review_level/...`. روجع محليًا 2026-11-08 وعُزّزت حراسه (عضوية/دور المراجع، طالب التنفيذ، فصل المهام عند الإذن، اتساق سبب الإلغاء) دون تنفيذ SQL |
| `0015_aigas_risk_engine_asset_context_residual_risk` | مطبّق | أعمدة السياق والمراجع وحالة الأصل و`residual_risk_description` موجودة |
| `0016_aigas_sc_user_token_quota` | **غير مطبّق** | لا توجد دالة `aigas_sc_usage_window_v2`؛ الموجودة `aigas_sc_usage_window` فقط |
| `0017_aigas_kernel_audit_context` | **غير مطبّق** | `aigas_audit_events` بلا `correlation_id/policy_version/idempotency_key` |
| `0018_aigas_data_api_grant_hardening` | **غير مطبّق** | دور `authenticated` ما زال يملك DML على 31 جدولًا؛ Data API نشط على `public` |
| `0019_aigas_runtime_least_privilege` | **غير مطبّق** | لا يوجد دور `aigas_runtime` ولا سياسات نطاق مؤسسة؛ دور Neon `neondb_owner` يتجاوز RLS. هوية DSN للخدمة المنشورة غير مثبتة هنا |
| `0025_aigas_tenant_isolation_closure` | **غير مطبّق** | مسودة محلية catalog-driven تستكمل 0018/0019: منح دنيا، سياسات لكل جدول `aigas_*`، رفض `RESTRICTIVE` لـ`authenticated/anonymous`، فهارس مرجع عالمية، وفحوص posture. تحتاج staging وموافقة قبل التطبيق |
| `0020_aigas_kernel_policy_review_requirements` | مطبّق | `aigas_policy_versions.required_approvals` موجود (تحقق 2026-11-08) |
| `0021_aigas_risk_engine_acceptance_guard` | مطبّق | الدالة `aigas_re_guard_treatment` والـtrigger `aigas_re_treatment_guard` موجودان (تحقق 2026-11-08) |
| `0022_aigas_reference_scope_guard` | **غير مطبّق** | لا يوجد `aigas_fw_decisions_request_scope_idx` ولا `aigas_sc_requests_scope_idx` |
| `0023_aigas_enterprise_trial_lifecycle` | **غير مطبّق** | لا يوجد جدول `aigas_trial_requests` |
| `0024_aigas_catalog_parity_repair` | **مسودة محلية فقط** | أعمدة Audit الثلاثة وحارس Ledger غير موجودة وقت الفحص؛ لم تُجرّب أو تطبق |
| `0026_aigas_risk_engine_residual_and_acceptance_policy` | **مسودة محلية فقط** | تضيف أعمدة الخطر المتبقي وقيود `NOT VALID` وتستبدل حارس 0021 بسياسة القبول الكاملة؛ لم تُطبّق على أي فرع. تحقق 2026-11-08: الأعمدة غائبة من `production` |
| `0027_aigas_sc_content_participant_only` | **مسودة محلية فقط** | تلغي سياسة `tenant_id` على `aigas_sc_conversations/aigas_sc_messages`، وتضع سياسة مشارك واحد، وتسحب صلاحيات جدولي المتن من `aigas_runtime/authenticated/anonymous`، وتفشل عند بقاء سياسة غير مقيدة بالمؤلف. تعتمد على `0025`. لم تُطبّق |

### 3.1 أثر الترحيلات الناقصة على الكود الحالي

| الناقص | الأثر الفعلي في المصدر |
|---|---|
| `0017` | `audit()` في `src/server/kernel/service.mjs:78` يُدرج `correlation_id`, `policy_version`, `idempotency_key`؛ على المخطط الحالي يفشل كل إجراء يمر بالتدقيق بخطأ عمود غير موجود (`42703`) |
| `0014` | خدمة Human Gate تقرأ/تكتب `aigas_hg_delegations` و`aigas_hg_grants` وأعمدة `provider_ref` وغيرها؛ كل عمليات Human Gate محجوبة على المخطط الحالي |
| `0013` | كاتب Ledger يسمح بـ`WARN/ESCALATE/DENY` و`request_fingerprint` في metadata؛ قيد Neon الحالي يرفضها، فتفشل أدلة Firewall المصنفة بهذه الحالات |
| `0016` | `reserve()` في Secure Chat يستدعي `aigas_sc_usage_window_v2`؛ الاستدعاء غير موجود على المخطط الحالي |
| `0027` | جداول المتن اليوم بلا سياسات ولا صلاحيات تطبيق (fail-closed)؛ بعد تطبيق `0019/0025` قد تظهر عليها سياسة `tenant_id` فقط حتى تُطبّق `0027` |

**تحديث مطابقة 2026-11-08:** فرع Neon الوحيد `production` غير محمي (`protected=false`)، وData API نشط على `public`. دور `aigas_runtime` غير موجود؛ `authenticated` لديه DML على الجداول الـ31. Migration `0019` تعتمد على دالة `0016` وتوصي بـ`0018` أولًا؛ قائمة سياسات `0019` لا تشمل جداول Human Gate الجديدة في `0014` ولا جداول trial في `0023`. لذلك لا يُعد تطبيق `0019` من المصدر وحده إثباتًا لصلاحية أقل أو جاهزية cutover. مسودة `0024` محدودة بأعمدة Audit nullable وحارس سلسلة Ledger ولا تعالج قيد metadata أو المنح/RLS.

**تنبيه:** هذه ليست قائمة أخطاء مكتشفة بالتشغيل؛ هي استنتاجات من مقارنة الكود بكتالوج Neon. أي تطبيق فعلي يحتاج اعتمادًا بشريًا وبيئة معتمدة. تحقق 2026-11-08 يؤكد RLS على 31/31، وسياسات على جدولين فقط، ومنح DML لـ`authenticated` على 31؛ لا يثبت ذلك استغلالًا أو وصولًا عابرًا للمؤسسات.

### 3.2 أسماء الجداول الـ31 المرصودة (Neon `public`)

| المجموعة | الجداول |
|---|---|
| Kernel والهوية | `aigas_tenants`, `aigas_memberships`, `aigas_product_access`, `aigas_product_grants`, `aigas_auth_organizations`, `aigas_member_invitations` |
| التدقيق | `aigas_audit_events` |
| Firewall | `aigas_fw_rules`, `aigas_fw_decisions` |
| Ledger | `aigas_ld_events`, `aigas_ld_evidence_requirements` |
| Human Gate | `aigas_hg_requests`, `aigas_hg_decisions`, `aigas_hg_policies`, `aigas_hg_events` |
| Risk Engine | `aigas_re_assets`, `aigas_re_asset_revisions`, `aigas_re_assessments`, `aigas_re_treatment_revisions` |
| Secure Chat | `aigas_sc_requests`, `aigas_sc_cancellations`, `aigas_sc_conversations`, `aigas_sc_messages` |
| هرمية السياسات والإدارات | `aigas_departments`, `aigas_department_memberships`, `aigas_department_events`, `aigas_policy_delegations`, `aigas_policies`, `aigas_policy_versions`, `aigas_policy_approvals`, `aigas_kernel_policy_decisions` |

**غير موجود وقت فحص 2026-11-08:** `aigas_hg_delegations`, `aigas_hg_grants` (0014)، دالة `aigas_sc_usage_window_v2` (0016)، trigger حارس سلسلة Ledger (0013)، أعمدة سياق التدقيق في `aigas_audit_events` (0017)، دور `aigas_runtime` وسياسات نطاقه (0019)، فهارس النطاق (0022)، وجدول تجربة `aigas_trial_requests` (0023).

---

## 4. مصفوفة القدرات

**الرموز:** `N` = غير موجود، `P` = جزئي/نطاق ضيق، `Y` = موجود في المصدر. `RUNTIME_NOT_VERIFIED` ثابت في كل الصفوف.

### 4.1 AIGAS Firewall — `FW-*`

| ID | APPROVED_REQ | SOURCE_PRESENT | SCHEMA_PRESENT | BLOCKED_BY | دليل الكود |
|---|---|---|---|---|---|
| FW-01 | نعم | P | Y | لا SDK/Proxy/Connector؛ لا نشر؛ لا مزود معتمد | `src/pages/app/api/firewall/*`, `src/server/firewall/http.mjs` |
| FW-02 | نعم | P | Y | خمس حالات وقواعد CRUD؛ لا تنفيذ خارجي | `firewall/core.mjs:evaluate`, `firewall/service.mjs:createFirewallService` |
| FW-03 | نعم | P | Y | لا سياسة منشورة (`aigas_policies=0`)؛ صلاحيات runtime غير متحققة | `firewall/service.mjs` (تقييم Kernel)، `kernel/policies.mjs` |
| FW-04 | نعم | P | Y | مطابقة حرفية `CONTAINS` فقط؛ لا corpus عربي/إنجليزي ولا تنقيح إنتاجي | `firewall/core.mjs:matches/evaluate` |
| FW-05 | نعم | N | N | لا كشف Prompt Injection ولا تحقق أدوات مستقل | — |
| FW-06 | نعم | N | N | لا وضع Shadow؛ الموجود `LAB`/`GUARD` فقط | `firewall/core.mjs:actions` |
| FW-07 | نعم | P | Y | حد 60/دقيقة داخل المعاملة فقط؛ لا failover لمزود | `firewall/service.mjs` (rate)، `firewall/guard.mjs` |
| FW-08 | نعم | P | P | تدقيق Kernel يحتاج `0017`؛ دليل Ledger الاختياري يحتاج `0013` | `kernel/service.mjs:audit`, `ledger/writer.mjs:recordProductEvent` |

**ملاحظة تسمية معتمدة:** الخمس حالات المطلوبة في Blueprint هي `ALLOW/WARN/REDACT/REQUEST_APPROVAL/BLOCK`، والكود يستخدم `ALLOW/WARN/REDACT/ESCALATE/DENY`. التعيين معلن في `firewall/core.mjs:10` ولا يغيّر المتطلب.

### 4.2 AIGAS Ledger — `LD-*`

| ID | APPROVED_REQ | SOURCE_PRESENT | SCHEMA_PRESENT | BLOCKED_BY | دليل الكود |
|---|---|---|---|---|---|
| LD-01 | نعم | P | Y | يُقبل الحدث من خدمات داخلية فقط؛ لا مصدر خارجي موثق | `ledger/writer.mjs:appendEvent`, `ledger/core.mjs:metadata` |
| LD-02 | نعم | P | P | سلسلة SHA-256 بلا توقيع مستقل؛ trigger الحماية `0013` غير مطبّق | `ledger/core.mjs:hashEvent/verifyEvent`, `public/downloads/aigas-ledger-verifier.mjs` |
| LD-03 | نعم | P | Y | savepoint للتدهور؛ لا مسار تخزين احتياطي دائم | `ledger/writer.mjs:recordProductEvent` |
| LD-04 | نعم | Y | Y | metadata allowlist فقط؛ بلا متن | `ledger/core.mjs:metadata/publicMetadata` |
| LD-05 | نعم | N | N | لا احتفاظ/Legal Hold/حذف | — |
| LD-06 | نعم | P | Y | تصدير + فاحص offline؛ لا توقيع ولا anchor خارجي | `ledger/service.mjs:chainThrough/bundleFor` |
| LD-07 | نعم | N | N | لا ربط مستندات امتثال/حوادث | — |

### 4.3 AIGAS Human Gate — `HG-*`

| ID | APPROVED_REQ | SOURCE_PRESENT | SCHEMA_PRESENT | BLOCKED_BY | دليل الكود |
|---|---|---|---|---|---|
| HG-01 | نعم | P | P | `0014` ناقص؛ `0017` ناقص؛ لا إشعارات | `human-gate/service.mjs:create` |
| HG-02 | نعم | P | P | مرحلة واحدة + SoD؛ لا مستويات متعددة | `human-gate/core.mjs:decisionAllowed`, الخدمة |
| HG-03 | نعم | P | N | جداول التفويض/الإذن غير موجودة؛ لا escalation | `human-gate/service.mjs:delegate/reviewAuthority` |
| HG-04 | نعم | P | P | قرارات append-only؛ تحتاج `0014` لأعمدة التفويض | `human-gate/service.mjs:decide` |
| HG-05 | نعم | P | N | `aigas_hg_grants` غير موجود؛ لا تنفيذ فعلي | `human-gate/service.mjs:execute` |

### 4.4 AIGAS Risk Engine — `RE-*`

| ID | APPROVED_REQ | SOURCE_PRESENT | SCHEMA_PRESENT | BLOCKED_BY | دليل الكود |
|---|---|---|---|---|---|
| RE-01 | نعم | Y | Y | إدخال يدوي فقط؛ لا اكتشاف آلي | `risk-engine/service.mjs`, `risk-engine/core.mjs:assetInput` |
| RE-02 | نعم | P | P | قواعد 3×3 حتمية للخطر الكامن والمتبقي؛ لا تحليل AI معتمد؛ الترحيل 0026 غير مطبّق | `risk-engine/core.mjs:evaluate/residualAssessment` |
| RE-03 | نعم | N | P | لا سياسات هرمية للمخاطر | — |
| RE-04 | نعم | P | Y | إعادة تقييم يدوية/أرشفة؛ لا مراقبة drift | `risk-engine/service.mjs:update/archive` |
| RE-05 | نعم | P | P | سياسة قبول صريحة وفصل مهام في المصدر؛ لا مسار مراجعة Privacy/Security ولا تحقق تشغيلي | `risk-engine/core.mjs:acceptanceDecision`; `0026` |

### 4.5 AIGAS Secure Chat — `SC-*`

| ID | APPROVED_REQ | SOURCE_PRESENT | SCHEMA_PRESENT | BLOCKED_BY | دليل الكود |
|---|---|---|---|---|---|
| SC-01 | نعم | P | Y | `APPROVED_MODELS=[]`؛ لا إرسال | `secure-chat/models.mjs`, `service.mjs:sendMessage` |
| SC-02 | نعم | Y | Y | حماية نصية أولية فقط؛ لا ادعاء DLP شامل | `secure-chat/policy.mjs:{protectText,approvedEgress}`, `service.mjs` |
| SC-03 | نعم | P | Y | محادثة مؤقتة فقط؛ لا سياسة حفظ/وصول استثنائي | `secure-chat/service.mjs` (EPHEMERAL + capabilities) |
| SC-04 | نعم | Y | Y | فصل metadata عن المتن | `secure-chat/requests.mjs`, `kernel/service.mjs:audit` |
| SC-05 | نعم | Y | Y | لا مشاركة/تصدير | لا سطح تصدير في `src/pages/app/secure-chat/` |
| SC-06 | نعم | P | N | `0016` ناقص؛ دالة الحصة v2 غير موجودة | `secure-chat/requests.mjs:{reserve,settle,cancel}` |
| SC-07 | نعم | Y | N | لا رفع ملفات/RAG في النطاق الحالي | `secure-chat/service.mjs` |

### 4.6 AIGAS Kernel (مكوّن مشترك غير مفوتر)

| المجال | SOURCE_PRESENT | SCHEMA_PRESENT | BLOCKED_BY |
|---|---|---|---|
| الهوية والجلسات | P (Neon Auth + `auth.mjs`) | Y (`neon_auth`) | لا مستخدمون/جلسات؛ لا تحقق من جلسة حقيقية |
| العضوية والمؤسسة | Y (`tenantGuard`, `memberships`) | Y | لا سجلات |
| أول مساحة ومالكها | Y (`createWorkspace`: مالك وحيد، تحقق قراءة بعد الكتابة، لا دور من الطلب) | Y | لا سجلات؛ تحت `NOBYPASSRLS` يبقى `WORKSPACE_PROVISIONING_REQUIRED` |
| الدعوات وقبولها | Y (`manageInvitation`: هوية/انتهاء/رفض/صلاحية داعي/تكرار) | Y (`0006`) | لا دعوات؛ الإرسال `NOT_CONFIRMED`؛ القبول تحت `NOBYPASSRLS` يبقى `INVITATION_BOOTSTRAP_REQUIRED` |
| إتاحة المنتجات والمنح | Y (`requireProductAccess`, `trial.mjs`) | P (`ADMIN_NON_BILLED` فقط؛ `0023` غير مطبق) | لا منح؛ لا شراء أو ترخيص محلي؛ Trial غير مفعّل |
| سياسات المؤسسة/الإدارات | Y (`kernel/policies.mjs`) | Y | لا سياسة منشورة |
| التدقيق الأساسي | Y (`audit`) | P | `0017` ناقص |
| Health/التشغيل | Y (`operationalHealth`) | Y | لا تشغيل معتمد |
| ترويسات الأمان وCSP | Y (`src/middleware.ts`: baseline مفروض + سياسة موارد Report-Only) | — | لا تحقق متصفح؛ الفرض يحتاج `AIGAS_CSP_ENFORCE=true` بعد اعتماد |

---

## 5. تعارضات حقيقية صُححت أو وُثقت

| التعارض | القرار | الملف |
|---|---|---|
| Registry يقول 29 مسارًا و5 مقالات معرفة | الصحيح محليًا: 36 مسارًا عامًا و12 مقالة؛ أُضيف تحديث مؤرخ | `docs/WEBSITE-PAGE-REGISTRY.yaml` |
| `MASTER-AGENT-CONTEXT` يقول 29/5 مقالات | صُحح إلى 36/12 مع توضيح تاريخ اللقطة | `docs/MASTER-AGENT-CONTEXT.md` |
| `PLATFORM-ARCHITECTURE` يقول «لا مسارات API خلفية» | يوجد `src/pages/app/api/**` في المصدر؛ أُضيف فحص حالي مؤرخ دون ادعاء نشر | `docs/PLATFORM-ARCHITECTURE.md` |
| Firewall FEATURE-STATUS يقول `neon_migration_applied: false` | المخطط الفعلي يثبت 0002 + 0012؛ صُحح مع بقاء 0013/0017 عائقًا | `docs/products/firewall/FEATURE-STATUS.yaml` |
| Ledger FEATURE-STATUS يقول `ledger_migration_applied_to_neon: false` | 0003 موجودة، و0013 غير مطبّق؛ فُصلت الحالتان | `docs/products/ledger/FEATURE-STATUS.yaml` |
| Catalog يستخدم `REQUEST_APPROVAL/BLOCK` والكود `ESCALATE/DENY` | تعيين صريح لا يغيّر المتطلب | `docs/PRODUCT-MASTER-CATALOG.yaml` |
| CSP كانت baseline فقط بلا `script-src`/`connect-src` | أُضيفت سياسة موارد محددة تُرسل Report-Only، وجرد المصادر في runbook | `src/middleware.ts` |

**لم يُغيَّر:** Hero، Constellation، الهيدر، الشعار، نصوص الأقسام التسويقية، روابط الحجز (`mailto`)، أو أي عقد API تشغيلي. لم تُضف ادعاءات إتاحة.

---

## 6. العوائق المفتوحة (لا تتجاوزها بافتراض)

1. **اعتماد الترحيلات:** فجوات المخطط تشمل `0013` (جزئي وغير متكامل)، `0014`, `0016`, `0017`, `0018`, `0019`, `0022`, `0023`؛ تحتاج مراجعة بشرية وتطبيقًا على بيئة معتمدة. لا تُطبّق هنا. (`0015`, `0020`, `0021` مثبتة بعناصر المخطط في فحص 2026-11-08.)
2. **صلاحيات runtime وRLS:** RLS مفعّل على 31/31، والسياسات على جدولين فقط؛ `authenticated` يملك DML على 31 جدولًا، ودور `neondb_owner` يتجاوز RLS. يلزم إغلاق فجوة المنح والدور والسياسات قبل تشغيل معتمد.
3. **الجلسة والمستخدمون:** لا مستخدم/جلسة في Neon Auth؛ لا يمكن إثبات أي رحلة موثقة.
4. **مزود/نموذج AI:** لا نموذج معتمد؛ أي إرسال حقيقي محجوب بقرار منتج وموافقة تشغيل.
5. **النشر:** لا دليل أن `/app/` يعمل على `brightai.live`؛ اللقطة المرجعية ذكرت 404، والكود الحالي يعطي 302/503 عند التعطيل. لا يُدّعى أي منهما دون فحص حي.
6. **الامتثال والشهادات:** لا شهادة ولا اعتماد تنظيمي مثبت؛ صفحات Trust/Compliance تعلن ذلك.
7. **الأسعار والتجربة:** غير معتمدة/غير مفعّلة؛ المنح الإدارية ليست Trial ولا License. دورة التجربة موجودة مصدريًا فقط (`trial.mjs` + `0023` غير المطبق) ولا تنشئ استحقاقًا عند الطلب.

---

## 7. طريقة التحديث

- أي إثبات تشغيلي جديد يُسجّل باسم البيئة والإصدار والتاريخ في `docs/products/*/ACCEPTANCE-AND-EVIDENCE.md` أولًا.
- لا يُرفع أي `status` إلى `WORKING` أو `AVAILABLE` من هذا الملف؛ هذا الملف يوثّق الحالة ولا يمنح اعتمادًا.
- مصفوفة traceability وأدلة التشغيل الحالية: `Audit/outhers/RELEASE-TRACEABILITY-BASELINE-2026-11-08.md`.
- عند تغيّر المخطط، أعد فحص Neon قراءة فقط وحدّث القسم 3 بتاريخ جديد.
