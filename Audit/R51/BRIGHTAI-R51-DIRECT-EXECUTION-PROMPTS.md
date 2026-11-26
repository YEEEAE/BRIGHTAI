# BRIGHT AI / AIGAS — R5.1 DIRECT EXECUTION & CONTROLLED LAUNCH

**نسخة تنفيذية واحدة — 15 مهمة مباشرة على الملفات.** موجّهة لوكيل التطوير الذي يملك تفويض تعديل checkout، لا لهذا المساعد. كل مهمة تنفّذ الكود وتثبت نتائجه. نطاق الوكلاء الخمسة جزء من نفس المقام. لا تغيير في المستودع قام به معدّ هذه الحزمة.

## طريقة التشغيل

نفّذ P01→P15 وفق التبعيات؛ لا تبدأ العمل بالتوازي على الملفات المشتركة (P03→P04→P05→P06…→P10، P11→P12→P13→P14→P15). انسخ تعليمات التنفيذ العامة مع المهمة المحددة. بعد كل مهمة احتفظ بـdiff والنتائج والـSHA ودليل القبول. الفشل في مورد خارجي لا يمنع إصلاح الكود المحلي؛ يمنع ادعاء إغلاق ذلك المعيار. لا تنفذ انتقال الإنتاج قبل بوابات P15.

## تعليمات التنفيذ العامة (تُرفق بكل مهمة)

أنت وكيل التطوير المنفّذ في checkout مشروع YEEEAE/BRIGHTAI. المطلوب **تعديل الملفات وتنفيذ الإصلاحات فعليًا**، وليس إعداد تقرير اقتراحات. استعمل HEAD الحالي بعد مقارنته بالمرجع `5387cdf6282cc3775f73ade30c82f199967d9409`، وافحص الملفات قبل تعديلها. لا تعِد بناء ما ثبت عمله، ولا تستبدل منطقًا حقيقيًا بمحاكاة. نفّذ التغييرات في فرع عمل محلي مفوض، مع الحفاظ على Hero/Header/Constellation والهوية والنص والترتيب. لا تلمس ملفات غير منطبقة؛ مسارات النجمة نطاق عمل وليست أمرًا بتعديل كل ملف. المسارات الجديدة المذكورة مقترحة لإنشاء التنفيذ إن لم يوجد نظير فعلي. استخدم MCP المناسبة للتحقق؛ لا تعرض أسرارًا أو بيانات عملاء. الميزانية المصرح بها لـGroq صفر دولار حتى تفويض جديد. لا تفتح production/DNS/paid services دون تصريح المالك المحدد. في نهاية المهمة شغّل الاختبارات المتأثرة بالفعل، أصلح failures، ثم سلّم diff، قائمة الملفات، أوامر ونتائج التحقق، أرقام المعايير المغلقة ودليلًا لكل منها، rollback، وما تعذر. لا تسجل PASS من وجود الكود فقط؛ عند غياب إذن خارجي أكمل الإصلاح المحلي ولا تتجاوز البوابة. لا تضيع الجولة بتحليل منفصل عن تنفيذ التغيير.

## P01 — تثبيت مرشح Node وخط النشر

**التبعيات:** -. **معايير الإغلاق:** BE-02 BE-05 BE-06 BE-07 IN-01 IN-02 IN-03 IN-06.

**الملفات المستهدفة من شجرة المصدر:**
- `render.yaml`
- `astro.config.mjs`
- `package.json`
- `scripts/server.mjs`
- `scripts/build-version.mjs`
- `src/pages/healthz.ts`
- `src/pages/readyz.ts`
- `src/server/kernel/readiness.mjs`
- `src/server/kernel/health-endpoint.mjs`

**أوامر العمل:**

عدّل إعدادات البناء والنشر لتوحيد Node SSR وartifact identity؛ استخدم خدمة المرشح القائمة brightai-r51-audit بدل إنشاء خدمة ثالثة. اجعل health check مناسبًا لسياسة إتاحة الخدمة، وافصل liveness وreadiness، وثبّت build SHA وNode/lockfile. أصلح أي تناقض بين render.yaml وواقع الإعدادات. احمِ preview من الفهرسة والتكرار ولا تغيّر canonical للصفحات الرئيسية. أبقِ static origin الحالي كخيار rollback إلى P15. لا تربط المرشح ببيانات إنتاج.
نفّذ npm ci ثم npm run build، ثم شغّل npm start وتحقق من healthz/readyz وعقود JSON وno-store؛ ارفع المرشح في البيئة المعزولة فقط بعد إذنها. سجل SHA، deploy ID، body/hash ونتائج GET؛ readiness السابق 200 دليل مرجعي لا يغني عن إعادة التحقق على الإصدار الجديد.

**معيار التسليم:**
- `BE-02` — واجهات health/readiness/trial تعيد العقد المتوقع على النطاق → دليل PASS_VERIFIED في البيئة المطلوبة.
- `BE-05` — جرد 107 ملفات مسارات المصدر من الشجرة المثبتة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `BE-06` — قراءة 51 wrapper TS و64 pattern بما فيها SSO → دليل PASS_VERIFIED في البيئة المطلوبة.
- `BE-07` — فحص GET لعقود الصحة والجاهزية والتجربة والقياس والاستفسار على النشر الحالي → دليل PASS_VERIFIED في البيئة المطلوبة.
- `IN-01` — SHA Render live يطابق main المثبت → دليل PASS_VERIFIED في البيئة المطلوبة.
- `IN-02` — نوع خدمة Render يوافق Node SSR → دليل PASS_VERIFIED في البيئة المطلوبة.
- `IN-03` — ربط Cloudflare إلى الخدمة الفعلية معلوم → دليل PASS_VERIFIED في البيئة المطلوبة.
- `IN-06` — SHA الحالي مطابق لآخر نشر Render → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P02 — ترحيلات Neon وعزل المؤسسات والذاكرة

**التبعيات:** P01. **معايير الإغلاق:** DB-01 DB-02 DB-03 DB-04 DB-05 DB-06 DB-07.

**الملفات المستهدفة من شجرة المصدر:**
- `migrations/*.sql`
- `scripts/apply-migrations.mjs`
- `scripts/migration-order.mjs`
- `scripts/db-migration-rehearsal.mjs`
- `scripts/audit-runtime-posture.mjs`
- `src/server/kernel/db.mjs`
- `src/server/kernel/access.mjs`
- `tests/migration-order.test.mjs`
- `tests/kernel-db.test.mjs`

**أوامر العمل:**

عدّل runner لتضمين 0046 في خطة delta بعد التحقق من baseline الحقيقي؛ لا تعِد تشغيل upgrade-only 0011/0012/0013/0019 على fresh. أصلح اعتماد 0018 على اسم neondb_owner إن كان غير موجود مع الحفاظ على revocations، واختبر authenticated/anonymous. أضف migration جديدًا بعد آخر رقم فعلي، additive، لجداول agent_runs/agent_steps/tool_invocations/checkpoints/tenant_memory/budget_reservations/outbox عند غيابها؛ tenant_id وFKs وunique idempotency keys وRLS وسياسة expiry وACL؛ لا تخزن chain-of-thought أو أسرارًا. اجعل provision دور login محدود بلا direct table grants، SET TRUE/INHERIT FALSE إلى aigas_runtime مع اختبار PG18؛ لا تستخدم owner DSN في التطبيق. لا تعِد إنشاء raspy-surf-09603889: 42/42 و47 جدولًا و98 سياسة و8/8 حالات مثبتة، أعد فقط ما يتأثر بالتغيير. جهّز خطة delta منفصلة للـStaging والإنتاج تعتمد checksum وcatalog diff وbackup/restore، لا تطبقها على الإنتاج قبل بوابة P15.
تحقق بالـSQL من signatures start/read(uuid)، عدم تجاوز RLS، سياسات كل جدول، محاولات cross-tenant لجميع أنواع الوصول، grants/SECURITY DEFINER/search_path، replay وconcurrency وrollback. سجّل migration receipts حقيقية لا قيم مصطنعة.

**معيار التسليم:**
- `DB-01` — توافق جداول Production وStaging مع العقد المطلوب → دليل PASS_VERIFIED في البيئة المطلوبة.
- `DB-02` — دور runtime المطلوب موجود في Production → دليل PASS_VERIFIED في البيئة المطلوبة.
- `DB-03` — الدالتان start/read(uuid) في Staging → دليل PASS_VERIFIED في البيئة المطلوبة.
- `DB-04` — عزل مؤسستين وroles/grants/SECURITY DEFINER وFORCE حسب الانطباق → دليل PASS_VERIFIED في البيئة المطلوبة.
- `DB-05` — agent persistence وmemory ACL وbudget atomicity → دليل PASS_VERIFIED في البيئة المطلوبة.
- `DB-06` — تغطية جداول public بالسياسات RLS في Production → دليل PASS_VERIFIED في البيئة المطلوبة.
- `DB-07` — مطابقة 46 migration مع سجل تنفيذ وchecksum وقيود الدوال → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P03 — بناء Kernel Agent Runtime وAPI

**التبعيات:** P01 P02. **معايير الإغلاق:** BE-01 BE-03 BE-04 BE-08 KE-01 KE-02 KE-03 KE-04.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/kernel/service.mjs`
- `src/server/kernel/access.mjs`
- `src/server/kernel/policies.mjs`
- `src/server/kernel/contracts.mjs`
- `src/server/kernel/http.mjs`
- `src/server/api/routes.mjs`
- `src/server/api/boundary.mjs`
- `src/server/api/request-schemas.mjs`
- `src/server/api/response-schemas.mjs`
- `src/pages/app/api/kernel.ts`
- `src/pages/app/api/kernel/**`

**أوامر العمل:**

أنشئ ملفات جديدة تحت src/server/agents/ (runtime.mjs, orchestrator.mjs, tool-executor.mjs, contracts.mjs, repository.mjs) واستخدم وظائف Kernel الحالية بدل إعادة بناء الهوية. عرف run/step/tool lifecycle بحالات واضحة، bounded loop/max steps/deadline/cancel، tenant context مستمد من JWT/session فقط، capability manifests وschema validation، tool allowlist وpre/post policy check، Human Gate pause/resume، append evidence وoutbox ذري مع P02. أضف endpoints فعلية تحت src/pages/app/api/agents/ عند الحاجة وحدّث registry/schema مع كل method وHEAD/error/idempotency. كل handoff يحمل run_id/parent_step/tenant/agent+policy versions/correlation دون تمرير أسرار أو سياق مؤسسة أخرى. اجعل المنتجات قابلة للتشغيل منفردة وفق entitlement وعبر orchestrator.
نفّذ اختبارات عقد 108 عمليات الأصلية زائد الجديدة، رفض الأدوار/النطاقات/المدخلات، انقطاع المزود والـoutbox والـretry/cancel/revocation؛ لا تعرض JSON وهميًا أو نجاحًا عبر HTTP200 غير مطابق.

**معيار التسليم:**
- `BE-01` — عقد HTTP/JSON/error لكل method مع correlation وvalidation → دليل PASS_VERIFIED في البيئة المطلوبة.
- `BE-03` — عقد agent tool messages ونتائج tools على البوابة الحالية → دليل PASS_VERIFIED في البيئة المطلوبة.
- `BE-04` — Idempotency/transactions/outbox والتعافي من الفشل الجزئي في E2E → دليل PASS_VERIFIED في البيئة المطلوبة.
- `BE-08` — مطابقة جميع API methods سلوكياً بما فيها HEAD/auth/validation/error → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-01` — مصدر سياق وهوية وصلاحيات Kernel في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-02` — خطة وتنفيذ متعدد الوكلاء محدود الخطوات بإعادة فحص السياسة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-03` — handoff مرتبط بالمؤسسة والنسخة وcorrelation وrevocation → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-04` — استقلال المنتج دون تجاوز Kernel أو فرض شراء باقي المنتجات → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P04 — Groq Gateway واحد وخمس وكلاء وFinOps

**التبعيات:** P02 P03. **معايير الإغلاق:** SC-01 SC-02 SC-03 SC-04 SC-05 FW-02.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/ai/groq-gateway.mjs`
- `src/server/ai/public-sandbox-limiter.mjs`
- `src/server/secure-chat/models.mjs`
- `src/server/secure-chat/adapter.mjs`
- `src/server/kernel/env.mjs`
- `.env.example`
- `render.yaml`
- `tests/helpers/secure-chat-model.mjs`
- `tests/secure-chat.test.mjs`

**أوامر العمل:**

حوّل البوابة إلى typed provider adapter يدعم رسائل tools/tool_calls/tool results، strict schemas وtool argument parsing، مع إبقاء مسار النص الحالي متوافقًا. وحد GROQ_API_KEY كاسم خادمي canonical مع alias مؤقت AIGAS_SC_GROQ_API_KEY؛ عند اختلاف القيم fail closed بلا طباعة، لا تكرر المفاتيح. حدّث .env.example بالأسماء فقط لا الأسرار. املأ سجل النماذج من موافقة موثقة وموديل Groq متاح فعليًا، لا تختلق موافقة أو نموذجًا. طبق policy pre/post، reservation ذري على DB بدل file-only في multi-worker، tenant/user/agent/global limits وtoken costs/timeout/429/backoff/cancel/reconciliation. مزود واحد مشترك ولا خمس مفاتيح، ولا client-side keys.
نفّذ mock replay لأداة واحدة وعدة أدوات وmalformed tool/رفض/expiry/429/timeout، إثبات صفر provider calls عند الحجب. اربط كل وكيل لاحقًا عبر نفس gateway. في الميزانية الحالية 0 USD، لا inference مدفوع؛ نفّذ probe حقيقي فقط إن أمكن إثبات أنه مجاني ضمن الحساب وباعتماد صالح، وإلا احتفظ BLOCKED كمانع للنشر الحي؛ لا تعتبر mock أو connector health دليل inference.

**معيار التسليم:**
- `SC-01` — حدود الميزانية وtimeouts/circuit breaker في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SC-02` — model approved registry في المصدر غير فارغ → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SC-03` — Secure Chat adapter يقبل tool_calls وفق العقد الآمن الجديد → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SC-04` — توحيد اسم secret بين gateway وblueprint → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SC-05` — shared key والاتصال والـusage فعليًا وbudgets متعددة العمال → دليل PASS_VERIFIED في البيئة المطلوبة.
- `FW-02` — provider registry معتمد غير فارغ في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P05 — Registry وPolicy Packs وهوية Agent

**التبعيات:** P02 P03. **معايير الإغلاق:** RG-01 RG-02 RG-03 RG-04 RG-05.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/governance/contract.mjs`
- `src/server/governance/registry.mjs`
- `src/server/governance/internal-pack.mjs`
- `src/server/governance/reference-catalog.mjs`
- `src/server/kernel/policies.mjs`
- `src/pages/app/api/kernel/policies.ts`
- `src/pages/app/api/kernel/products.ts`
- `tests/governance-packs.test.mjs`
- `tests/governance-reference.test.mjs`

**أوامر العمل:**

أصلح product enum وتطابق جميع العقود لتشمل Secure Chat، وعرّف سجلات agent/tool/model/vendor/asset بمالك وmandate ونسخة وscope وapproval expiry/revocation. افصل governing agents عن governed third-party agents. اربط Policy Packs بنسخ وsource references وapproval workflow وprecedence deterministic وhard deny. أضف عمليات CRUD المصرح بها وقراءة فقط للآخرين عبر Kernel؛ اربط واجهة Registry إلى سجلات حقيقية، ولا تعتمد local arrays. أضف tests للانتهاء، self-approval، تعارض النسخ، ترخيص منتج واحد وrevocation؛ لا تنشر نص قانوني مولد آليًا أو ادعاء شهادة.

**معيار التسليم:**
- `RG-01` — registry لمحاكاة الأصل/التقييم والإصدار موجود في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RG-02` — asset/model/agent/vendor lifecycle وowner/mandate/capabilities → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RG-03` — سياسات versioned مراجع وربط requirement/control/finding/evidence → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RG-04` — تعديل policy بمراجعة ومنع self-approval وإلغاء التفويض → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RG-05` — تغطية سجل الحوكمة لمنتج Secure Chat بعقد متسق → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P06 — Firewall AI Agent

**التبعيات:** P03 P04 P05. **معايير الإغلاق:** FW-01 FW-03 FW-04.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/firewall/core.mjs`
- `src/server/firewall/agent-registry.mjs`
- `src/server/firewall/provider.mjs`
- `src/server/firewall/guard.mjs`
- `src/server/firewall/binding.mjs`
- `src/server/firewall/escalation.mjs`
- `src/server/firewall/service.mjs`
- `src/server/firewall/http.mjs`
- `src/pages/app/api/firewall/**`
- `src/scripts/firewall.ts`
- `src/components/FirewallWorkspace.astro`
- `tests/firewall*.mjs`
- `tests/fixtures/firewall-governance-corpus.mjs`

**أوامر العمل:**

أضف firewall-agent.mjs ضمن src/server/agents/ واربطه بـKernel runtime وGroq gateway؛ tools محددة inspect_input/read_policy/classify/recommend_redaction/explain_decision، لا تجعل توصية النموذج تتجاوز engine الحتمي. حافظ على حالات القرار الخمس الفعلية من core، وحماية prompt injection/PII/tool egress/SSRF/data disclosure، input+output+tool checks، escalation مرتبط بنسخة payload/grant وعند deny لا خروج. عدّل واجهة workspace لتعرض decision/reason/evidence دون معلومات حساسة. اختبر corpus مع المقامات FP/FN، replay، رفض المزود والحجب، الحالات الخمس، إعادة التحقق بعد تعديل payload أو policy؛ لا تختلق نسبة دقة.

**معيار التسليم:**
- `FW-01` — سجل أدوات اصطناعي default deny موجود بالمصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `FW-03` — agent tool loop حي مع five-state وinput/output checks وredact → دليل PASS_VERIFIED في البيئة المطلوبة.
- `FW-04` — تغطية matchers وPII/injection ونتائج FPR/FNR بمقام → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P07 — Risk Engine AI Agent

**التبعيات:** P03 P04 P05. **معايير الإغلاق:** RE-01 RE-02 RE-03 RE-04.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/risk-engine/core.mjs`
- `src/server/risk-engine/assist.mjs`
- `src/server/risk-engine/service.mjs`
- `src/server/risk-engine/evaluation.mjs`
- `src/server/risk-engine/review.mjs`
- `src/server/risk-engine/http.mjs`
- `src/pages/app/api/risk-engine/**`
- `src/components/RiskWorkspace.astro`
- `src/scripts/risk-engine.ts`
- `tests/risk*.mjs`

**أوامر العمل:**

أضف risk-agent.mjs بأدوات read_asset/read_policy/assess/propose_treatment/read_evidence؛ حوّل assist من اقتراح منفرد إلى run محدود متعدد الأدوات. احسب الدرجات في deterministic engine وفق نسخة المقياس المعتمدة؛ لا تخصم رقمًا ثابتًا لكل control كما في prototype. اربط evidence/version وresidual risk وowner/due date وhuman acceptance، ومنع الوكيل من قبول الخطر بنفسه. حدّث صفحة الأصل ونتائج API. نفّذ حالات boundary/invalid input, concurrent revision, expired acceptance، replay/fairness/drift بمقام وsample disclosure؛ لا تعرض نتائج model حية من replay اصطناعي.

**معيار التسليم:**
- `RE-01` — advisory synthetic JSON وrole/idempotency في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RE-02` — agent متعدد الأدوات لتقييم الأصل والمعالجات مع مصادر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RE-03` — درجات مخاطر موثقة وresidual وقبول بشري E2E → دليل PASS_VERIFIED في البيئة المطلوبة.
- `RE-04` — evaluation/drift/fairness ومقامات النتائج → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P08 — Human Gate AI Agent

**التبعيات:** P03 P04 P05 P06 P07. **معايير الإغلاق:** HG-01 HG-02 HG-03 HG-04.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/human-gate/core.mjs`
- `src/server/human-gate/service.mjs`
- `src/server/human-gate/integration.mjs`
- `src/server/human-gate/http.mjs`
- `src/pages/app/api/human-gate/**`
- `src/scripts/human-gate.ts`
- `src/pages/app/human-gate/index.astro`
- `tests/human-gate*.mjs`
- `tests/firewall-review-binding.test.mjs`

**أوامر العمل:**

أضف human-gate-agent.mjs لتلخيص الطلب وشرح المخاطر وتقديم توصية فقط، بأدوات قراءة مأذونة. نفّذ workflow binding لهوية المراجع وصلاحياته ونسخة القرار وdigest والمدة، one-time grant وseparation of duties، منع self-approval، revoke/cancel/expire/replay، إعادة تقييم السياسة بعد الاستئناف؛ لا تجعل stage completed يعني APPROVED عند الرفض. اربط UI approve/reject/return/reason بالحالة الفعلية. اختبر الرفض والتعليق والقبول والانتهاء وتغيير payload وتزامن قرارين والتفويض الموقوف؛ إثبات no execution before authorized approval.

**معيار التسليم:**
- `HG-01` — state machine/grant binding في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `HG-02` — agent تلخيص الطلب بالأدوات والمراجع مع فصل المهام → دليل PASS_VERIFIED في البيئة المطلوبة.
- `HG-03` — approve/reject/expiry/replay/one-time grant E2E → دليل PASS_VERIFIED في البيئة المطلوبة.
- `HG-04` — اعتماد بشري لا يمكن للوكيل تزويره أو استئنافه دون إعادة فحص → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P09 — Ledger AI Agent وأدلة قابلة للتحقق

**التبعيات:** P02 P03 P04 P08. **معايير الإغلاق:** LD-01 LD-02 LD-03 LD-04.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/ledger/core.mjs`
- `src/server/ledger/writer.mjs`
- `src/server/ledger/service.mjs`
- `src/server/ledger/http.mjs`
- `src/pages/app/api/ledger/**`
- `src/scripts/ledger.ts`
- `src/demo/governance-evidence.mjs`
- `tests/ledger*.mjs`
- `tests/governance-evidence.test.mjs`

**أوامر العمل:**

أضف ledger-agent.mjs لتحليل واسترجاع أدلة مأذونة وتفسيرها، لا توليد hashes أو تغيير السجلات بواسطة LLM. اربط كل run/step/tool/provider usage وقرار بشري بـcorrelation وtenant وإصدار؛ canonical digest وتوقيع/مفتاح معتمد حسب سياسة البيئة وسجل append-only. اجعل verify يفشل عند غياب crypto أو key أو chain أو tamper؛ لا تعتبر قيمة ثابتة دليل صحة. أضف export مصرحًا به مع redaction وmanifest وverification مستقل. اربط retention/authorized export مع audit trail. اختبر tamper/deletion/reorder/replay/cross-tenant/export/no-crypto، عدم ازدواج evidence عند retry، وانقطاع Ledger يجب أن يوقف التنفيذ المتأثر.

**معيار التسليم:**
- `LD-01` — Ledger service وevent queries موجودة في المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `LD-02` — agent يسترجع أدلة مأذونة ويحللها دون صنع بصمات → دليل PASS_VERIFIED في البيئة المطلوبة.
- `LD-03` — append/verify/export وtamper check وسلسلة canonical E2E → دليل PASS_VERIFIED في البيئة المطلوبة.
- `LD-04` — أدلة كل agent step وtool call وprovider usage مرتبطة → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P10 — Secure Chat AI Agent وربط الوكلاء

**التبعيات:** P03 P04 P05 P06 P07 P08 P09. **معايير الإغلاق:** SC-03 SC-05 KE-02 KE-03 KE-04.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/secure-chat/service.mjs`
- `src/server/secure-chat/adapter.mjs`
- `src/server/secure-chat/integration.mjs`
- `src/server/secure-chat/policy.mjs`
- `src/server/secure-chat/requests.mjs`
- `src/pages/app/api/secure-chat/**`
- `src/pages/app/secure-chat/index.astro`
- `src/scripts/secure-chat.ts`
- `tests/secure-chat*.mjs`

**أوامر العمل:**

أضف secure-chat-agent.mjs الذي يستخدم gateway الموحد ويملك tools حصرًا مسجلة في Kernel لاستدعاء الوكلاء الآخرين وفق entitlement. اعرض run status/tool results/references وpause/approve/cancel دون كشف hidden reasoning. افرض message/session ownership وtenant memory scope وredaction وإلغاء الطلب وquota؛ لا تخزن raw secrets. نفّذ رحلة متكاملة: registry→risk→firewall→human approval→groq/tool→output gate→ledger؛ نفّذ كل منتج منفردًا كذلك. اختبر رفض cross-tenant/context poisoning، malicious tool results، permission change mid-run، cancellation، provider failure، evidence consistency. لا تفعّل live AI حتى موافقة النموذج والميزانية وإثبات provider؛ المحاكاة تبقى مميزة.

**معيار التسليم:**
- `SC-03` — Secure Chat adapter يقبل tool_calls وفق العقد الآمن الجديد → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SC-05` — shared key والاتصال والـusage فعليًا وbudgets متعددة العمال → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-02` — خطة وتنفيذ متعدد الوكلاء محدود الخطوات بإعادة فحص السياسة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-03` — handoff مرتبط بالمؤسسة والنسخة وcorrelation وrevocation → دليل PASS_VERIFIED في البيئة المطلوبة.
- `KE-04` — استقلال المنتج دون تجاوز Kernel أو فرض شراء باقي المنتجات → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P11 — تجربة 48 ساعة والرحلة التجارية والمصادقة

**التبعيات:** P02 P03 P05 P10. **معايير الإغلاق:** PJ-01 PJ-02 PJ-03 PJ-04 PJ-05 PJ-06 SE-02.

**الملفات المستهدفة من شجرة المصدر:**
- `src/server/kernel/auth.mjs`
- `src/server/kernel/auth-proxy.mjs`
- `src/server/kernel/sso.mjs`
- `src/server/kernel/self-service-trial.mjs`
- `src/server/kernel/trial-service.mjs`
- `src/server/kernel/operator-exploration.mjs`
- `src/pages/auth/**`
- `src/pages/app/trial/index.astro`
- `src/pages/app/operator/trials/index.astro`
- `src/pages/api/trial-availability.ts`
- `src/pages/api/enterprise-inquiry.ts`
- `src/scripts/trial-home.ts`
- `src/scripts/enterprise-request-modal.ts`
- `src/pages/request-access.astro`
- `src/pages/pricing.astro`
- `src/pages/contact.astro`
- `tests/auth-browser.e2e.mjs`
- `tests/trial*.mjs`

**أوامر العمل:**

أكمل رحلة sign-in/verified identity/JWT issuer/expiry/CSRF/origin/SSO والمصادقة الإضافية حسب السياسة، دون تعطيل gate للتحقق من البريد. على البيئة المعزولة استخدم حسابات اختبار مخصصة وتحقق حقيقي من التوكن لا fixture emailVerified؛ اختبر عضوًا ومالكًا ومؤسسة أخرى. اربط trial availability والتفعيل الحقيقي وquota/cancel/expire/one per identity وoperator review وامتناع auto-charge؛ 48h SQL والexpiry/idempotency ثبتت سابقًا، أعد الاختبارات المتأثرة وأثبت HTTP E2E. اقفل المسار عند الإلغاء والانتهاء. اجعل الاستقبال الإلكتروني حقيقيًا عبر قناة معتمدة أو اعرض البديل صراحة ولا تسجل نجاح إرسال وهميًا. حدّث صفحات العرض والسعر وPoV/SLA/consent/deletion/عدم تدريب دون ادعاء غير معتمد. لا ترسل طلبات حقيقية للعميل أثناء التحقق.

**معيار التسليم:**
- `PJ-01` — المختبرات الخمسة والموحد تظهر محتوى عام → دليل PASS_VERIFIED في البيئة المطلوبة.
- `PJ-02` — إتاحة trial JSON على النطاق → دليل PASS_VERIFIED في البيئة المطلوبة.
- `PJ-03` — 48h synthetic read-only، انتهاء/إلغاء/حصص وعدم دفع تلقائي E2E → دليل PASS_VERIFIED في البيئة المطلوبة.
- `PJ-04` — PoV وعرض تجاري وSLA/دعم وقنوات التواصل مثبتة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `PJ-05` — مسارات المختبرات 7 وcomplaint 5 وrequest-access متاحة HTTP → دليل PASS_VERIFIED في البيئة المطلوبة.
- `PJ-06` — رابط status المعلن في المختبرات يعمل على النشر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SE-02` — SSO/MFA/RBAC وCSRF/session/origin في بيئة مستهدفة → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P12 — مطابقة MagicPath وإصلاح كل تفاعل RTL

**التبعيات:** P03 P05 P06 P07 P08 P09 P10 P11. **معايير الإغلاق:** UX-01 UX-02 UX-03 UX-04 UX-05 UX-06 UX-07.

**الملفات المستهدفة من شجرة المصدر:**
- `src/pages/demo/governance.astro`
- `src/scripts/governance-demo.ts`
- `src/demo/governance.mjs`
- `src/demo/governance-evidence.mjs`
- `src/pages/demo/[product].astro`
- `src/pages/demo/workshop-preview/[view].astro`
- `src/scripts/complaint-journey.ts`
- `src/scripts/product-showcase.ts`
- `src/components/design-system/Modal.astro`
- `src/layouts/AppLayout.astro`
- `src/styles/design-system.css`
- `src/styles/experience-hub.css`
- `src/styles/experience.css`
- `src/styles/theme.css`
- `src/styles/tokens.json`
- `src/pages/app/**`
- `tests/governance-demo-browser.e2e.mjs`
- `tests/secure-chat-browser.e2e.mjs`

**أوامر العمل:**

نفّذ المقارنة مع المرجع التفاعلي المثبت smartly-home-5770/revision 476546341477171201؛ استخرج من TSX/CSS actual tokens/layout، لا تنسخ المحاكاة كمنتج مؤسسي. حافظ على Hero/Header/Constellation والنص وترتيب الصفحة الرئيسية قبل/بعد بصور baseline. طابق الشاشات الـ12 بنفس state والبيانات والمقاس؛ RTL/sidebar/tabs/cards/typography/spacing/status/empty/loading/error/animations/reduced motion/keyboard/focus/modal، واستخدم ألوان المرجع مع contrast. أصلح reset في governance-demo.ts: close() lines43–59 يمسح التفاصيل لكن العدادات تبقى؛ صفر جميع metrics والـcorrelation والـderived state وأخفِ السجل قبل new session؛ أصلح ledger empty-state في render() line123 وCSS specificity/hidden في governance.astro، بحيث لا يظهر مع وجود events. أنشئ route فعلي /demo/developer-workbench/ إذا غاب، استخدم registry لعروض API الحقيقية أو label مثال غير قابل للتشغيل؛ لا تخلق endpoint وهميًا. حل تناقض prototype stage=5→APPROVED حتى بعد رفض وdigest placeholder عند crypto غير متاح؛ أضف الرفض/blocked verification كحالات صريحة. لا تغير مرجع MagicPath؛ اصلح التطبيق.
نفّذ جميع حالات الشاشات بـ1440/390 وkeyboard، مقارنة screenshot same-state بأبعاد ثابتة، diff لكل شاشة ومراجعة بشرية للمناطق المتحركة. اعتمد الوظائف الحتمية الحقيقية لا نسخ سلوك المرجع الخاطئ. اكتب سجل 12 بندًا مع expected/actual/screenshots/action statuses؛ UX-02 لا PASS إلا بعد تحقق كامل.

**دلائل E63–E64 / تعديلات إلزامية من تشغيل MagicPath:** 11/11 tabs plus modal actually opened. Desktop reference sidebar x1189 width236 vs candidate left x18 width203; reference dark #101019 vs candidate lab transparent (verify body background); same h1 sizes 30/24 but different computed font stacks. Mobile reference full-width nav vs candidate collapsible drawer; both no overflow in measured viewport, iframe heights differ. Preserve mobile usability rather than forcing a less usable pattern. Risk 5×5 vs live demo 3×3: document owner-approved scale and display version, no silent conversion; use deterministic calculation, not fixed 3-point reduction. Reference five fixtures REDACT/BLOCK/ESCALATE/ALLOW/WARN verified; candidate repeat same five. Reference rejection actually shows erroneous APPROVED badge; explicit REJECTED required. Reference Ledger tamper detection passed locally; target must fail closed without crypto, no empty-state contradiction. Reference Developer local action works and labels example proposed; candidate route 404 — implement route and examples from central API contract. Reference chat is disabled while candidate simulation is local: keep synthetic capability, present distinction explicitly. Modal opened/closed in reference; no submission. Compare all rows in `MAGICPATH-INTERACTIVE-COMPARISON.csv`; Browser Use comparison run failed, fallback Playwright succeeded; missing pixel/animation/keyboard evidence remains mandatory.

**معيار التسليم:**
- `UX-01` — قراءة كود revision المنسوخ المرجعي → دليل PASS_VERIFIED في البيئة المطلوبة.
- `UX-02` — تطابق 12 بندًا بصريًا ووظيفيًا → دليل PASS_VERIFIED في البيئة المطلوبة.
- `UX-03` — Hero/header والهوية والترتيب محمية بbaseline بصري → دليل PASS_VERIFIED في البيئة المطلوبة.
- `UX-04` — حالات agent tool/approval/timeout/error/accessibility قابلة للاستخدام → دليل PASS_VERIFIED في البيئة المطلوبة.
- `UX-05` — جرد 12 أقسام/شاشات مرجع MagicPath من المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `UX-06` — مطابقة viewport والفوكس/keyboard وحالات error لكل action → دليل PASS_VERIFIED في البيئة المطلوبة.
- `UX-07` — مثال Developer يشير لمسار API معرف أو يوضح عدم تشغيله → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P13 — جودة المصدر والمسارات وSEO وObservability

**التبعيات:** P01 P10 P11 P12. **معايير الإغلاق:** QA-01 QA-02 QA-03 QA-04 QA-05 QA-06 SEO-01 SEO-02 SEO-03 SEO-04 SEO-05 SEO-06 SEO-07.

**الملفات المستهدفة من شجرة المصدر:**
- `.github/workflows/accessibility-performance.yml`
- `package.json`
- `package-lock.json`
- `scripts/seo-build.mjs`
- `scripts/audit-sitemap-contract.mjs`
- `redirects.json`
- `sitemap.xml`
- `src/layouts/BaseLayout.astro`
- `src/middleware.ts`
- `src/scripts/measurement.ts`
- `src/scripts/monitoring.ts`
- `src/data/structured-data.ts`
- `src/pages/api/measurement-status.ts`
- `src/pages/api/observability.ts`
- `tests/accessibility-performance-smoke.mjs`
- `tests/seo*.mjs`

**أوامر العمل:**

استرجع سجل CI الفاشل الفعلي وحدد السبب ولا تخمّنه؛ أصلح source/workflow/lockfile على أساس السبب، شغّل build/typecheck/scripts الموجودة في package.json وsuite الأمن/المتصفح/الأداء على SHA النهائي. تحقق من advisories مع remediation لا تحديثات عمياء. 159 redirect rules مثبتة على Node؛ 327 discovered GET: 75 200 و252 404 على القديم؛ صنّف كل 404 عبر قيمة GSC/backlinks/intended retire (لا تحويل جماعي للرئيسية). أصلح التحويلات والـcanonical/sitemap/indexability/soft404/link graph وبنية المقالات، وأزل duplicate routes/styles فقط بعد إثبات أنها غير مستخدمة. راجع GSC sitemap error وإشارات GA4 من بيئة الإنتاج فقط، Sentry/PostHog/PII/consent وأحداث تحويل لا محتوى محادثة. لا تزور نتائج Lighthouse أو بيانات ترتيب. نفّذ حملًا محدودًا مع bounded cost/failure/cancellation وقارن same-SHA CI evidence؛ route inventory 107 ملفات/108 عمليات سابقًا وليس مقامًا ثابتًا بعد التعديل.

**معيار التسليم:**
- `QA-01` — آخر CI accessibility/performance اجتاز → دليل PASS_VERIFIED في البيئة المطلوبة.
- `QA-02` — cause مثبت من سجل CI → دليل PASS_VERIFIED في البيئة المطلوبة.
- `QA-03` — dependency advisory/lockfile وbuild/check على مرشح → دليل PASS_VERIFIED في البيئة المطلوبة.
- `QA-04` — load/cost/fault/recovery للحلقات agentic وإلغاء الطلبات → دليل PASS_VERIFIED في البيئة المطلوبة.
- `QA-05` — CI accessibility/performance لنفس SHA ناجح → دليل PASS_VERIFIED في البيئة المطلوبة.
- `QA-06` — نتائج suite محلية/متصفح على نفس SHA مثبتة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-01` — GA4/GSC استرجاع فترة مكتملة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-02` — sitemap بلا أخطاء مسجلة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-03` — canonical/redirect/link/visual crawl كامل → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-04` — Sentry/PostHog trace وPII minimization وconversion → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-05` — جميع 67 صفحات sitemap الحالية HTTP200 بمحتوى → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-06` — التحويلات المعلنة /sitemap.xml و/solutions/ai-firewall/ تعمل → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SEO-07` — كل 159 redirect aliases و327 URL discovered مفحوصة مع graph كامل → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P14 — الأمان المؤسسي والجاهزية والاستعادة

**التبعيات:** P01 P02 P03 P04 P10 P11 P13. **معايير الإغلاق:** SE-01 SE-03 SE-04 SE-05 SE-06 IN-04 IN-05.

**الملفات المستهدفة من شجرة المصدر:**
- `src/middleware.ts`
- `src/server/kernel/auth.mjs`
- `src/server/kernel/db.mjs`
- `src/server/kernel/access.mjs`
- `src/server/api/boundary.mjs`
- `src/server/ai/groq-gateway.mjs`
- `src/pages/api/security/csp-report.ts`
- `render.yaml`
- `.github/workflows/accessibility-performance.yml`
- `SECURITY-SECURE-CHAT.md`
- `tests/secure-chat-security.e2e.mjs`

**أوامر العمل:**

أغلق security gates: Origin/CSRF/session fixation/SSRF/tool injection/XSS/cross-tenant/deny-on-evidence-failure؛ مراجعة grants/role/policy، no client secret/PII في logs، no-store للمسارات الخاصة وCSP. حدّث الوثائق وتكوين secret manager بأسماء فقط؛ دوّر الاعتماد السابق عند مالكه إذا تعرّض دون عرضه. فعّل قواعد main المطلوبة وrequired checks بعد إذن مالك GitHub (لا تعطّل حماية لتجاوز CI). اختبر backup/restore في بيئة جديدة، RTO/RPO موثقة وخطة incident/kill switch وrollback وversioned signed artifact. احسم إقامة البيانات السعودية أو استثناء مصرح؛ Ohio اصطناعي فقط لا دليل قبول production. راجع اتفاقيات مزود Groq/عدم التدريب/احتفاظ/حذف قبل أي بيانات حقيقية. وثّق negative tests وrestore receipt؛ كل critical gate 100%، بلا استثناءات صامتة.

**معيار التسليم:**
- `SE-01` — منع مفتاح provider العام في resolver المصدر → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SE-03` — tool allowlist + injection وSSRF وdata egress checks فعليًا → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SE-04` — موافقة الإقامة وعدم التدريب والاحتفاظ والحذف → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SE-05` — حجب التنفيذ عند فشل السياسة/الدليل ومنع تسريب الذاكرة → دليل PASS_VERIFIED في البيئة المطلوبة.
- `SE-06` — حماية main فعالة وتمنع bypass لبوابات الإطلاق → دليل PASS_VERIFIED في البيئة المطلوبة.
- `IN-04` — حماية الفروع وفق الإعداد المرصود → دليل PASS_VERIFIED في البيئة المطلوبة.
- `IN-05` — restore/rollback وsecrets presence وprivate caching verified → دليل PASS_VERIFIED في البيئة المطلوبة.

---

## P15 — إغلاق النسب وإطلاق المشروع والنشر المحكوم

**التبعيات:** P01–P14. **معايير الإغلاق:** جميع الـ83 وأي معيار جديد معتمد.

**الملفات المستهدفة من شجرة المصدر:**
- `render.yaml`
- `redirects.json`
- `scripts/build-version.mjs`
- `scripts/smoke-healthz.mjs`
- `scripts/audit-runtime-posture.mjs`
- `scripts/audit-sitemap-contract.mjs`
- `.github/workflows/accessibility-performance.yml`

**أوامر العمل:**

نفّذ تدقيق قبول نهائي مستقل على HEAD النهائي: استورد REQUIREMENTS-TRACKER.csv وEXECUTION-REQUIREMENT-MAP.csv، أعد جرد المتطلبات الجديدة قبل القياس، لا تحذف FAIL/BLOCKED ولا تغير المقام لتجميل الدرجة؛ تحقق من كل شرط في البيئة المطلوبة. اكتب خارج ملفات التطبيق تقرير scorecard بصفوف PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED وSHA/UTC/evidence وenvironment، احسب الأوزان حسب 15 محورًا، raw numerator/denominator/evidence coverage، كل منتج/Backend/API/Integration/Design/Trial/Production منفصل. ارفع كل محور/منتج إلى 100% من المتطلبات المستهدفة، 100% critical وzero P0؛ 80% بوابة حد أدنى سابقة وليست بديلًا عن استكمال الوعود؛ أي residual يظل معلنًا ولا نشر مؤثر عليه. نفّذ Idea Destroyer دورتين وإعادة التحقق، لا تقبل self-reported نجاحات.
عند اجتياز البوابات، نفّذ sequence النشر بتفويض مالك الإنتاج المحدد: backup+restore rehearsal وموافقة residency/model/budget، تطبيق delta ledger على Staging ثم production وفق خطة P02، تجهيز Node service بالإعدادات والأسرار المعتمدة، نشر SHA النهائي، فحص readiness وAuth وnegative tenant tests، verified 159 redirects والـSitemap والرحلة العامة، cutover Cloudflare إلى Node مع static origin محفوظ وTTL/rollback؛ تحقق من HTTPS وcanonical وreadyz وall live promises وسجل CI وobservability. افتح flags تدريجيًا وفق gates (public synthetic ثم live AI/trial/commercial). إن فشل أي critical check أعد origin/feature flags للنسخة السابقة، ولا تنفذ rollback DB مدمرًا؛ احتفظ بالدليل. لا تنقل DNS ولا تعدل بيانات الإنتاج دون إذن نشر صريح منفصل؛ الهدف نشر فعلي عند تحقق الشروط وليس توصية نشر فقط.

**معيار التسليم:**
- كل معيار مرتبط بدليل مباشر؛ سجل النشر الفعلي أو سبب حجبه، وقرار GO/NO-GO لكل نطاق.

---

