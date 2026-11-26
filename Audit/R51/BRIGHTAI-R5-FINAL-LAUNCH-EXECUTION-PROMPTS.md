# BRIGHT AI / AIGAS — R5.1 UNIFIED CLOSURE EXECUTION PACK

**15 برومبتًا موحدة بعد التحقق التشغيلي المعزول — الأدلة E01–E62.** نتائج E54–E62 مقدمة على الأوصاف التاريخية. لا تكرر ما ثبت في البيئة المعزولة، ولا تعتبره إغلاقًا للإنتاج. الميزانية الحالية لـGroq صفر دولار؛ لا استدعاء مدفوع ولا تعديل GitHub إلا بواسطة وكيل تنفيذ مفوض لاحقًا.

## P01 — Release topology & baseline

**Delta التدقيق الحالي / مطلوب إغلاقه:** E48/E57/E60: مرشح Render Node قائم، service srv-dc400fk9v7es73df3cc0، deploy dep-dc40a2t6e07s73dpro4g، SHA 5387cdf6282cc3775f73ade30c82f199967d9409، healthz=200 وreadyz=200 وDB/Auth READY مع portal DISABLED. لا تعِد إنشاء الخدمة ولا تستخدم production DSN. الإنتاج ما زال Static Site و159/159 تحويلًا نجحت في المرشح لا الإنتاج. أثبت platform health-check ثم cutover/rollback بعد التصريح المستقل.

**Owner:** SRE / release architect · **Dependencies:** none · **Findings/Evidence:** F02; E01 E02 E10 E18 E19 E31

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Freeze source tree, route methods, actual Render service and exact deploy ID. Compare render.yaml/node adapter/scripts/server.mjs with current static_site. Verify the already-created candidate Node service E48 (npm ci && npm run build; npm start); re-verify the already-passed isolated readiness and complete rollback/platform health-check evidence; do not repoint apex or remove static site. Inventory public/SSR/API/auth routes and middleware. Read actual current CI and advisories before proposing any change. Keep public content and synthetic route stable.

**ACCEPTANCE:** Exact SHA and Render service mapping; candidate service architecture and endpoint expectations documented; static site stays live; build/runtime plan covers dist/server entry. No domain cutover before P02/P03/P04/P13/P14/P15 and approval.

**ROLLBACK / STOP:** Existing static service and current live deploy ID retained; the isolated candidate deployment E48 exists. Do not remove or redeploy it without a reason and authorization.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P02 — Database parity, least privilege, agent persistence

**Delta التدقيق الحالي / مطلوب إغلاقه:** E54–E59: مشروع raspy-surf-09603889/branch br-noisy-frog-bdwi4d6d مستقل: 42/42 fresh migrations، 47 جدولًا/98 سياسة، 8/8 حالات عزل، دالتا trial(uuid) تعملان، login r51_app_login لا صلاحيات مباشرة على public ويملك SET TRUE/INHERIT FALSE إلى aigas_runtime. أصلح/وثق PG18 SET option في مسار provisioning. لا تعِد تشغيل 0011/0012/0013/0019 على fresh. افحص 0018 مع owner غير neondb_owner وclient role stubs في rehearsal منفصل. خطط إصلاح Production/Staging دون تنفيذ قبل موافقة منفصلة، مع hash ledger/backup/restore وHTTP auth tests.

**Owner:** PostgreSQL/security · **Dependencies:** P01 · **Findings/Evidence:** F01 F05 F09 F12; E03 E04 E05 E20 E21

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Compare both Neon branches via catalog SELECT only: tables/columns/constraints/indexes/triggers/functions/signatures/security definer/search_path/ACL/RLS/role membership and migration checksums vs 0001–0046. Confirm actual start/read(uuid) gap; identify full migration dependencies, including 0040, rather than blindly replaying. Plan additive, reversible migrations for agent runs/steps/tool calls/checkpoints/budget reservations/consent/tenant-bound memory and correlation to existing ledger only if not present. Design RLS and grants for NOBYPASSRLS runtime; no raw model hidden reasoning or secrets; transactional reservation/outbox and recovery. Establish residency decision, encrypted backup/restore, and separate staging/prod approval.

**ACCEPTANCE:** Catalog parity with candidate contract, both uuid functions and execute grants, least-privilege role, isolated cross-tenant negative evidence, replay/concurrency and recovery evidence, backup and restore verified; no owner bypass in runtime. Prioritize staging then production only after independent approval.

**ROLLBACK / STOP:** Versioned backup/restore and compatibility plan; if migrations irreversible, stop before production; keep flags closed.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P03 — Kernel agent runtime & secure tool executor

**Delta التدقيق الحالي / مطلوب إغلاقه:** استخدم INTEGRATION-MATRIX.csv ومسارات tenantGuard/requireProductAccess/lockGovernance/ledger writer الحالية. ضع عقد tools/run APIs في central registry وschemas؛ اختبر method/HEAD/error contract وrevocation وoutbox. أصلح تكامل enum لتغطية Secure Chat؛ لا تخلق endpoint مزيف.

**Owner:** Backend/Kernal architect · **Dependencies:** P01 P02 design · **Findings/Evidence:** F10 F12; E22 E26 E27 E29 E30 E34

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Implement-design shared agent contract, registry, typed tool definitions, state machine and bounded orchestrator using existing Kernel context. Each of five product agents is independently invokable when entitled; optional inter-agent coordination via Kernel only. Server-owned identity/tenant/role/asset/policy/version, tool schema strict allowlist, action/risk classification, capability mapping, pre/post policy checks, correlation/causation/idempotency, timeout/cancel, max steps/depth/fan-out, cycle detection. Use durable checkpoints without holding DB transaction across Groq; outbox/compensate external side effects; fail closed on policy/evidence/budget failure. No arbitrary shell/SQL/URL, network or autonomous permission escalation. Map old synthetic registry and keep deterministic engines reusable.

**ACCEPTANCE:** Prove tool call→validation→authorization→deterministic execution→redacted result→model/final with stub; reject forged tenant/tool/version, recursion, oversize args, stale policy and repeated writes; agent state survives crash safely; no unbounded loops. Evidence by agent/run/step, not just text completion.

**ROLLBACK / STOP:** Feature flags default off; retain current deterministic service adapters; disable agent dispatch without destroying records.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P04 — Shared Groq provider gateway and FinOps

**Delta التدقيق الحالي / مطلوب إغلاقه:** E61: الميزانية الصريحة $0، connector Groq مملوك لكن أدواته غير ظاهرة، 0 calls و0 إنفاق Groq من التدقيق؛ لا تستخدم المفتاح الذي ظهر سابقًا، لا تخترع نجاح inference. اربط credential جديدًا في secret store بعد موافقة تشغيل، مع allowlist وموديل معتمد وإثبات free quota؛ إذا لا يمكن ضمان عدم التكلفة فاعتمد stub tests واترك live provider BLOCKED. سجل المصدر APPROVED_MODELS فارغ وtext-only؛ لا تتجاوز approval أو budget.

**Owner:** AI/security/FinOps · **Dependencies:** P02 P03 · **Findings/Evidence:** F03 F10 F11 F12; E06 E17 E22 E23 E24 E28 E32 E33

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** One canonical server-side credential using current AIGAS_SC_GROQ_API_KEY as compatibility-first proposal; if owner .env uses GROQ_API_KEY, define explicit single-value alias/transition, reject conflicting values without logging, choose canonical after local presence-only check. Keep GROQ_MODEL and approved tenant/model/region/expiry/no-training/retention/capability registry; model reference qwen/qwen3.8-27b subject to account entitlement and approval (no silent fallback). Extend gateway with separate typed agent completion contract tools/tool_choice/tool results, strict JSON/tool_call validation, model-specific parameters and token accounting including tool schemas. Preserve current strict text-only path for non-agent callers. Local tool calling; no default remote MCP/built-ins/web access. Reserve per-step and per-run budget atomically across instances; limits per tenant/agent/user plus global, deadline, concurrency, bounded retry/429/reconcile unknown usage, circuit breaker. No provider call on deny or invalid approval; no secrets in clients or traces. Review Groq docs and data agreement.

**ACCEPTANCE:** Mock contract supports safe tool calls, malformed or unexpected responses rejected; no tool call bypass; rate-limit, cancel, retry, stale reservation and multi-worker budget verified; approval expiry/deny invokes zero external calls. Actual provider proof with synthetic data only after explicit cost and data approval; report model/latency/token counts from result, never invent.

**ROLLBACK / STOP:** Keep live provider disabled; revert to prior text adapter and approved deterministic mode; preserve reservations for reconciliation.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P05 — Registry, policy packs & agent identity

**Delta التدقيق الحالي / مطلوب إغلاقه:** افحص governance/contract.mjs product enum الناقص، وثبت policy versions وpack applicability؛ ربط PDPL/SDAIA/ISO وفق مصادر معتمدة ومراجعة بشرية دون ادعاء شهادة. registry/packs في MagicPath محلية فلا تُحسب persistence.

**Owner:** Governance architect · **Dependencies:** P02 P03 · **Findings/Evidence:** F08 F12; E26 E27 E34

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Map assets/models/agents/use-cases/vendors to tenant-owned stable versioned records, owner/mandate/approved tool scopes and autonomy levels. Distinguish product agents that conduct governance from third-party agents being governed. Use reviewed policy packs with source/reference/version/applicability and deterministic hierarchy/hard deny. Map requirement→control→check→finding→review→evidence. No model-generated policy auto-publication. Include agent/tool versions, approval expiry, revocation/kill switch and impact invalidation. Map every internal edge and product grant; distinguish public synthetic, live AI, 48h trial and paid scope.

**ACCEPTANCE:** Unregistered/expired agent blocked; policies and grants versioned and reproducible; ownership and scope validated; policy mutation requires authorized review; cross-tenant and revocation checks; no loss of product independence.

**ROLLBACK / STOP:** Retain prior policy versions; disable new agents; roll back configuration by approved version only.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P06 — Firewall Agent

**Delta التدقيق الحالي / مطلوب إغلاقه:** تحقق من decisions الخمسة في core لا من regex demo وحده. خريطة أدوات وtool results تحت policy؛ حالات DENY/ESCALATE وعدم إرسال Groq، input/output checks، idempotency. لا اعتماد مزود فارغ.

**Owner:** Firewall/AI security · **Dependencies:** P03 P04 P05 · **Findings/Evidence:** F03 F10 F12; E22 E24 E26 E27

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Design specialized agent to explain policy decisions, inspect safe metadata and suggest rules via tools such as read_effective_policy, evaluate_synthetic_request, draft_rule_proposal. Keep existing deterministic matcher, decisions ALLOW/WARN/REDACT/ESCALATE/DENY (BLOCK display alias only), pre/post PII/secrets/injection/egress checks; no model override or raw text before redaction. Review provider/tool registry, guarded execution binding, review escalation, output validation, rule versions and false-positive/false-negative methodology. Treat internal tool content as untrusted. If Firewall Agent is unavailable, deterministic Firewall remains functional and fail-closed.

**ACCEPTANCE:** Each action path proven with synthetic fixtures, DENY zero provider calls, REDACT before provider, ESCALATE no action until valid bound human grant, post-check blocks bad output; suggested rule not active until approved; tool calls logged and constrained. No claim of perfect injection detection.

**ROLLBACK / STOP:** Disable AI advisory while retaining deterministic firewall and guard decisions.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P07 — Risk Engine Agent

**Delta التدقيق الحالي / مطلوب إغلاقه:** تأكد من الفرق بين demo حساب 5×5 وrisk acceptance الحقيقي؛ استخدم عقد المنهج المحدد وأدلة versioned assessment. اختبر zero denominator وsample size وmetrics وdrift دون اختلاق بيانات.

**Owner:** Model risk specialist · **Dependencies:** P03 P04 P05 P06 · **Findings/Evidence:** F10 F12; E25 E27

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Extend existing Risk Assist into actual bounded agent using read_asset_revision, read_approved_method, calculate_risk (deterministic), propose_treatment and draft_assessment tools. Context synthetic or approved minimized, owner/asset/policy versions and findings. Preserve documented scoring matrix (3x3 or 5x5 by approved method), residual risk calculations, treatment revisions, human acceptance and review binding; no fixed deduction or LLM scoring authority. Include eval datasets, versioned replay, FPR/FNR/precision/recall/denominators, small-sample and drift limits. No model-generated risk acceptance.

**ACCEPTANCE:** Agent plans, invokes allowed tools, produces source-linked draft; arithmetic agrees with engine; no fabricated measurements; invalid method and missing assets stop; human review needed before final acceptance; evidence links to policy and Ledger.

**ROLLBACK / STOP:** Retain manual scoring and review; disable AI drafts.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P08 — Human Gate Agent

**Delta التدقيق الحالي / مطلوب إغلاقه:** أعد اختبار رفض Human Gate خصوصًا stage===5 APPROVED label في المرجع. اربط grant بالطلب/policy/tenant/actor/expiry، افحص separation of duties/replay/revoke. لا تجعل النموذج مراجعًا مخولًا.

**Owner:** Authorization engineer · **Dependencies:** P02 P03 P05 P06 P07 · **Findings/Evidence:** F09 F10 F12; E20 E29

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Build specialized review assistant with read_review_context, summarize_bound_request, explain_policy, draft_review_note; only authorized users see minimized evidence. Agent may prepare review and suggest routing, never approve/reject on behalf of reviewer, never consume grant or act as independent reviewer. Enforce existing separation of duties, role/delegation scope, payload digest, expiry/cancel, policy/asset version, one-time grant atomic consumption and revalidation at resume. Escalate uncertainty; no automated override even if LLM calls a tool.

**ACCEPTANCE:** Requestor cannot self-approve, replay/cross-tenant/stale payload denied, timeout cancels, retry does not duplicate execution, approval bound to exact action; model tool cannot approve or forge grant. Show both human decision and agent advisory separately.

**ROLLBACK / STOP:** Disable assistant; preserve pending requests and human review engine; no automatic re-execution.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P09 — Ledger Agent & independent evidence

**Delta التدقيق الحالي / مطلوب إغلاقه:** E58/E56: تحقق ترابط 5 أحداث اصطناعية في رحلة الشكاوى؛ رفض SQL لتعديل Ledger بـ42501. هذا ليس توقيعًا أو إثبات سلسلة مؤسسية مستقلة. أصلح رسالة empty-state التي تبقى بعد التسجيل (P12)، واختبر append/verify/export والتلاعب والتزامن تحت tenant scope.

**Owner:** Evidence integrity engineer · **Dependencies:** P02 P03 P05 P06 P07 P08 · **Findings/Evidence:** F08 F12; E27 E30

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Build agent to query authorized evidence, verify chain using deterministic verify tool, explain gaps, produce structured report with event references. No model-generated hash/signature or rewriting history. Every agent run/step/tool decision, provider model/version/usage and approval correlates to append-only evidence with minimal metadata; enforce tenant scope, canonical serialization, SHA-256 sequence/prev chain, clock and integrity checks, outbox/required evidence fail-closed, export/verify independent. Distinguish local demo checksum from signed production proof. No raw prompts, tool secrets or private chain-of-thought in evidence.

**ACCEPTANCE:** Tampered fixture detected by deterministic engine; event references reproducible; append/verify/export and mandatory evidence behavior demonstrated; no mutation via agent; sensitive fields redacted and read grants checked.

**ROLLBACK / STOP:** Disable AI summarizer; retain evidence verification and export; never truncate audit chain to roll back.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P10 — Secure Chat Agent and inter-agent handoffs

**Delta التدقيق الحالي / مطلوب إغلاقه:** أثبت أن Secure Chat لا يرفض tool_calls في عقد agentic الجديد فقط؛ حافظ على text-only legacy للطلبات الأخرى. أظهر agent handoff لهوية tenant وصلاحيات مستقلة؛ إلغاء/حذف/retention ومنع تعارض النتيجة. لا ترسل live إلا بموافقة.

**Owner:** Agent integration engineer · **Dependencies:** P03 P04 P05 P06 P07 P08 P09 · **Findings/Evidence:** F03 F10 F12; E06 E22 E23 E25 E27

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Build Secure Chat specialized assistant with conversation state and constrained handoff to Firewall/Risk/Human Gate/Ledger agents through Kernel. Preserve protected message context, input/output checks, permissions, session cancellation, per-user quotas, redaction, model approval, deterministic fallback explicitly labelled, and privacy deletion. No raw universal memory or secret-sharing; memory per tenant/actor/agent/session with scoped read permission and bounded TTL; agent handoff includes sanitized structured context and correlation, not untrusted authority. Define /agent run status/results/cancel contracts only after checking existing API routing; no invented existing endpoints. Verify standalone execution of each agent and multi-agent journey without multiplying costs for deterministic steps.

**ACCEPTANCE:** Each of five agents independently reaches real permitted tool execution under mock, and cross-agent flow completes with shared IDs. Unauthorized handoffs, stale grants, wrong tenant, malicious tool output, timeout/cancel, budget cap and dependency failure tested in isolated authorized environment; no fake canned live responses. Provider-backed E2E remains BLOCKED until explicit approval.

**ROLLBACK / STOP:** Revert chat to existing text adapter/read-only workflows; stop new runs and reconcile active operations.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P11 — Public synthetic, 48h trial & commercial product journey

**Delta التدقيق الحالي / مطلوب إغلاقه:** E58/E59/E57: رحلة الشكاوى الخماسية المحلية تعمل؛ DB trial رفض حساب غير موثق، 48 ساعة بدقة، idempotent start، dependencies 6/6، expiry محاكى مع EXPIRED وحدث واحد. تحقق البريد الحقيقي/JWT/browser E2E والحصص والإلغاء وenterprise inquiry لا يزال مطلوبًا؛ لا تعتبر admin-set emailVerified أو timestamps المحولة مصادقة أو مرور 48 ساعة حقيقيًا. Portal مغلق وtrial-availability=false. لا تفتح البوابة العامة حتى تكتمل حماية الوصول للمرشح.

**Owner:** Product/release · **Dependencies:** P02 P03 P05 P06 P07 P08 P09 P10 · **Findings/Evidence:** F01 F02 F08 F09 F12; E09 E10 E16 E18 E20

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Keep synthetic public lab no external provider by default, label simulated tools and results. Distinguish optional public live AI, authenticated 48h trial and paid production; no automatic payment/renewal. Link five product pages and demos, app, request access and contact, deep links, expiry/revocation, synthetic read-only workspace, entitlements, quotas, proof of value report, data deletion and escalation. User identity only from server. Do not expose agent commands during trial beyond allowed capability. Commercial docs include actual licensing, support/SLA, procurement, deployment modes and data exit; no unsupported compliance claims. Compare integrated journey with manually completed synthetic PoV.

**ACCEPTANCE:** All eligible links and controls mapped; local synthetic flows work without provider; trial starts only when runtime and entitlement gates valid, expires after approved 48h contract with no automatic conversion; cancellation prevents subsequent operations; no real customer request submitted during audit.

**ROLLBACK / STOP:** Keep account trial/live features closed; public lab and contact remain; no real customer conversion changes.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P12 — MagicPath fidelity and functional RTL UX

**Delta التدقيق الحالي / مطلوب إغلاقه:** E51/E58: عرض فعلي desktop و390px بلا تجاوز أفقي في العينة، 7 صفحات تفاعلية اصطناعية. أصلح reset العدادات (تبقى 2/2 حتى جلسة جديدة) وLedger empty-state المتزامن مع دليل مسجل. Developer Workbench 404 في الفحص السابق، inquiry unavailable. قارن نفس حالة 12 شاشة/modal مع revision المرجعي؛ PNG ثابتة وليست إثبات parity؛ لا تغير Hero/Header المحميين.

**Owner:** Design/A11y · **Dependencies:** P03 P05 P06 P07 P08 P09 P10 P11 · **Findings/Evidence:** F06 F08 F12; E08 E15 E16 E23

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Use exact copy revision as owner-designated working reference; flag original inaccessible. Validate all 12: Overview, Kernel, Firewall, Risk Engine, Human Gate, Ledger, Secure Chat, Registry, Policy Packs, Developer Workbench, Trust Center, Enterprise Request Modal. Preserve main Hero/header/Constellation and approved site section content/order; no new design concept. Add agent run state, tool-step summary (not hidden reasoning), approvals, sources, errors, cancel and evidence controls within existing visual system where needed. Map every UI action→route/API/auth/schema/state/result/error/export. Compare desktop/mobile RTL IBM Plex Sans Arabic, keyboard/focus/dialog semantics/contrast/reduced motion. Capture real before/after only; no claim screenshot parity from source.

**ACCEPTANCE:** 12 screen/modal rows with actual screenshots and action evidence; Hero/header unchanged; all controls function or are clearly unavailable; RTL/accessibility checks pass; no hidden failure masquerading as success. Reference blocked remains explicit.

**ROLLBACK / STOP:** Revert only new scoped agent UI changes; preserve original visual shell and protected regions.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P13 — QA, route census, SEO/GEO, analytics and market evidence

**Delta التدقيق الحالي / مطلوب إغلاقه:** E50/E60: 159 قاعدة × مضيفين =318 GET، المرشح 159/159 301 exact Location، الإنتاج 0/159. فحص 327 URL مكتشفًا: 75 HTTP200 و252 HTTP404؛ صنّف 404 تاريخية مقصودة مقابل قيمة SEO قبل التحويل. لا تتعامل مع الروابط المكتشفة كمقام كامل. أعد فحص CI على SHA الناتج، GSC sitemap/canonical/indexation وCWV وWCAG، واختبر عيبي reset/Ledger.

**Owner:** QA/SEO/observability · **Dependencies:** P01 P11 P12 · **Findings/Evidence:** F04 F07 F08; E01 E07 E09 E10 E12 E13

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Reconcile all 107 source route patterns and all discovered URLs/sitemaps/redirects/internal links; continue bounded GET checks, exact expected status/content/auth/canonical/indexability and browser render/console. Never submit real forms or POST against production. Diagnose CI failure from actual logs; inspect lockfile/advisories incl GHSA-qh8j-hqjv-7m4x applicability, build and existing accessibility/performance checks without weakening them. Isolated checks only when authorized. Review agent fault cases, response latency/cost/usage and cancellation. GSC sitemap recorded one error, GA4/GSC actual period; reconcile hosts, consent, conversion definitions, Sentry/PostHog project/release, PII redaction/no automatic capture. Compare nine competitors using official current docs; distinguish claims from verified operations.

**ACCEPTANCE:** Complete route/API inventory with per-row evidence and resume queue; CI cause/green result and known dependency posture; no broken critical route, measured budgets and no invented thresholds; sitemap/canonical reconciliation and truthful commercial copy. Separate source/runtime metrics.

**ROLLBACK / STOP:** Rollback SEO/UI/config by version only; do not submit sitemap or activate telemetry without explicit authorization.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P14 — Enterprise hardening, deployment readiness and recovery

**Delta التدقيق الحالي / مطلوب إغلاقه:** E54–E57/E59: خدمة Node جاهزة وموصولة بـNeon Auth وDB isolated عبر login محدود. AIGAS_REQUIRE_RLS=true وAIGAS_DB_RUNTIME_ROLE=aigas_runtime وhealth auth probe active. AIGAS_APP_ENABLED=false؛ لا تفتحها أو تحول DNS/production قبل الموافقة. Free Ohio synthetic only؛ لا اعتماد استضافة العملاء. تحقق من platform health path، backup/restore وMFA/SSO وlogin JWT E2E في بيئة وصول مقيدة، دون تعطيل الضوابط.

**Owner:** Security/SRE/DB · **Dependencies:** P01 P02 P03 P04 P10 P13 · **Findings/Evidence:** F01 F02 F03 F05 F09 F11 F12; E03 E04 E18 E19 E20 E28 E31 E33

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Prepare Render Node candidate, exact deploy SHA, startup secret presence-only checklist, health/readiness dependencies, feature flags fail closed; validate Cloudflare DNS target/HTTPS/cache/no-store and CSP, reverse proxy/CSRF/origin, SSO/MFA/RBAC as approved. Confirm country/region and data processor approval, provider terms, retention/deletion, encryption and backup/restore. Design separate local/on-prem provider option without claiming air-gap while using Groq. Ensure agent runs, tool rights, budgets and observability durable under restart and concurrency. Establish RTO/RPO/SLA based on owner-approved targets, rollback DNS/previous service and compatible schema; no infrastructure change now.

**ACCEPTANCE:** Candidate SSR readiness and least-privilege role evidence; no production content sent to unapproved region; no secret logging; prove restore and rollback; no cutover until P15 independently approves and owner authorizes. Confirm flags only for passed scope.

**ROLLBACK / STOP:** Retain old static service/live deploy and backup; revert routing only after explicit approval and safe schema compatibility.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

## P15 — Final independent re-audit, Idea Destroyer & release handoff

**Delta التدقيق الحالي / مطلوب إغلاقه:** E01–E62 + OPERATIONAL-BLOCKER-OVERLAY.csv. المرشح isolated READY، local synthetic tests mixed (عيبان)، DB trial and scoped RLS pass. Production NO-GO؛ Groq $0 وBLOCKED، actual JWT E2E / full MagicPath parity / agent runtime missing. لا تعِد احتساب مقام 83 الجزئي كنسبة نهائية. أعد تجميد نطاق ذري كامل بعد التنفيذ، احسب ≥80% لكل محور/منتج و100% critical وصفر P0، وافصل cutover authorization.

**Owner:** Independent evidence reviewer + release manager · **Dependencies:** P01–P14 · **Findings/Evidence:** F01–F12; E01–E34

ROLE: Principal engineer + security/release reviewer for BRIGHT AI / AIGAS. Repo https://github.com/YEEEAE/BRIGHTAI ; reference SHA `5387cdf6282cc3775f73ade30c82f199967d9409` (verify current candidate, do not silently carry scores across SHA); site https://brightai.live/ ; approved working MagicPath copy project `476546341477171200`, component `476546341477171202`, revision `476546341477171201` (original equality not verified). Objective: R5.1 unified release with five real specialized agents and Kernel orchestrator, one server-side Groq credential via .env/secret manager, deterministic security engines. Retain Astro/Node modular monolith unless evidence requires a different choice. Preserve Hero/header/Constellation, text, layout, animations, links and section order; no redesign or visual replacement of MagicPath. All work defaults to READ-ONLY: inspect first, propose exact diff and evidence; implement only with separate explicit permission in isolated checkout. No commit/push/merge, production edits, DNS, deploy, SQL migration, secret display/export, customer data, live/paid Groq or external mutation without explicit scope approval. Never weaken auth/RLS/policy/test assertions to pass. Report actual statuses (PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED), exact SHA, environment, file:line, safe evidence IDs, limitations, owners, residual risks. If an approval/dependency is missing, STOP that operation, continue independent read-only analysis. Do not claim 100% from code, screenshots or HTTP200. Use synthetic fixtures and mocks by default. No changes authorized by this prompt alone.

**TASK:** Re-inventory current approved candidate including every product agent and tool. Freeze exhaustive atomic requirements and weights before new scoring (retain 15 domain weights unless documented approval); each agent/tool acceptance belongs to its product, shared controls counted once. Complete route, backend/API, integration, design, security, local/staging/live and product evidence; compute weighted pass/evidence coverage with raw denominators and unknown/blocked; no score if exhaustive denominator missing. Recheck Idea Destroyer cycle 1 on project, freeze score/gates, then read R4 outputs and compare only original 78 criteria and compatible evidence; cycle 2 challenges prompts/cutover. Validate all findings and mapping, record residual risks. Candidate release plan: backup/restore, staging migration, candidate Node/secret names, isolated synthetic E2E, explicit owner approval for production migration/cutover, scoped smoke and monitoring, rollback. No automatic execution or deploy.

**ACCEPTANCE:** ≥80% every applicable domain and product, 100% critical security controls, zero open relevant P0, core E2E in target, no critical unknown/blocked. Independent GO/NO-GO/NOT_VERIFIED for local candidate/public synthetic/public live AI/48h trial/commercial; deploy authorization distinct. All 15 prompts and original R5 scope + new agentic scope traceable; absence of evidence is NOT_VERIFIED, not PASS.

**ROLLBACK / STOP:** Abort release if any critical gate fails; preserve existing static site, disable live flags, use reviewed restore/rollback plan only with separate explicit authorization.

**DELIVER:** evidence register, proposed file paths and exact acceptance matrix; list remaining BLOCKED/NOT_VERIFIED and authorization needed.

---

