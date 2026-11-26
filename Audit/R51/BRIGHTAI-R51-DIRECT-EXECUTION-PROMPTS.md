#
---

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P22. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P19, P20, P27. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P22, P26. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P24, P26. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P21, P26. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P20, P21, P27. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P21, P22. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P17, P18, P19. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

## P17 — المصادقة الفعلية والجلسات وSSO/MFA

**التبعيات:** P03 P11 P16. **معايير الإغلاق:** SE-02 BE-08. **الموانع المرتبطة:** F08 F16.

**الملفات المستهدفة:**
- `src/server/kernel/auth.mjs`
- `src/server/kernel/auth-proxy.mjs`
- `src/server/kernel/sso.mjs`
- `src/server/kernel/access.mjs`
- `src/pages/auth/**`
- `src/scripts/auth-page.ts`
- `src/scripts/auth-validation.ts`
- `src/scripts/workspace-context.ts`
- `tests/auth-browser.e2e.mjs`

**أوامر العمل:**

أكمل auth proxy وcallback وtrusted origins وcookie/session boundaries وissuer/audience وفق عقد Neon المعتمد؛ راجع JWT EdDSA وexpiry/iat/revocation. نفّذ sign-in وsign-out وsign-up/verification وSSO/MFA حسب السياسة المعتمدة، وإدارة الأدوار وتبديل المؤسسة دون توريث سياق. أنشئ حسابات اختبار مع بريد اختبار معتمد في المرشح؛ لا تعتبر تعديل emailVerified في SQL اختبارًا للهوية. اضبط redirect allowlist ومنع open redirect وCSRF/session fixation. لا تخفّض شرط التوثيق ولا تعرض كلمة سر أو JWT في الأدلة.

**معيار التسليم:**

جلسة متصفح حقيقية لكل دور منطبق؛ verified JWT، رفض token مزور/منتهي/issuer خاطئ، منع cross-tenant وتبديل الدور غير المصرح، إبطال جلسة فعلي، نجاح SSO/MFA المعتمد أو مانع موثق يمنع بيع هذه الميزة.

---

## P18 — إغلاق دورة 48H عبر HTTP والعمليات المؤسسية

**التبعيات:** P11 P16 P17. **معايير الإغلاق:** PJ-02 PJ-03 PJ-06 BE-07. **الموانع المرتبطة:** F08 F13 F16.

**الملفات المستهدفة:**
- `src/server/kernel/self-service-trial.mjs`
- `src/server/kernel/trial-service.mjs`
- `src/server/kernel/operator-exploration.mjs`
- `src/server/kernel/exploration.mjs`
- `src/pages/app/api/kernel/trials/**`
- `src/pages/app/api/operator/trials/**`
- `src/pages/app/trial/index.astro`
- `src/pages/api/trial-availability.ts`
- `src/scripts/trial-home.ts`
- `src/scripts/operator-trials.ts`
- `tests/trial-db.test.mjs`
- `tests/trial.test.mjs`

**أوامر العمل:**

اربط التفعيل وقراءة الحالة والحصص والإلغاء والانتهاء والرفض/التفعيل بواسطة المشغل بالعقود الموجودة. اختبر عبر HTTP مصادق عليه: إنشاء مرة واحدة، إعادة الطلب، 48h server time، 100 وحدة أو الحصة المعتمدة لا رقم مختلق، concurrent consume، انتهاء ومنع فتح المنتج، cancel/expire/revoke وevent واحد. استخدم clock fixture معزولة لحدود الوقت ثم راقب expiry الحقيقي إذا أمكن دون انتظار مفتعل. افصل self-service synthetic عن enterprise trial وأي اتصال مدفوع. لا تفتح portal عام بلا gate.

**معيار التسليم:**

HTTP E2E من sign-in حتى تفعيل/عرض المنتجات/الانتهاء؛ one-trial identity وحصص ذرية ورفض التكرار، سجل أدلة، عدم auto-charge، status/availability يعكسان الحالة الفعلية.

---

## P19 — الترخيص والشراء والرحلة التجارية وPoV

**التبعيات:** P05 P11 P18. **معايير الإغلاق:** KE-04 PJ-04 PJ-05. **الموانع المرتبطة:** F08 F15.

**الملفات المستهدفة:**
- `src/server/kernel/administration.mjs`
- `src/server/kernel/access.mjs`
- `src/server/kernel/policies.mjs`
- `src/pages/pricing.astro`
- `src/pages/request-access.astro`
- `src/pages/contact.astro`
- `src/pages/products/[product].astro`
- `src/pages/api/enterprise-inquiry.ts`
- `src/scripts/enterprise-inquiry.ts`
- `src/scripts/enterprise-request-modal.ts`
- `src/shared/access-journey.mjs`

**أوامر العمل:**

نفّذ entitlements مستقلة للمنتجات وتفعيل/تعليق/انتهاء الترخيص دون رسوم Kernel مستقلة. اربط CTA وطلب الوصول واستقبال الطلب التجاري بقناة معتمدة فعلية، مع تحقق server-side وidempotency وrate limit ورفض البيانات غير اللازمة. اختبر قناة test inbox مصرح بها فقط. نفّذ رحلة PoV قبل الشراء ببيانات اصطناعية افتراضيًا، تقرير مخرجات وتنبيه انتهاء وحذف وفق السياسة، واعرض أسعار/اشتراك/ترخيص سنوي أو دائم فقط من قرارات المالك. لا تخترع أسعارًا أو SLA ولا تنشئ تحصيلًا مدفوعًا تلقائيًا.

**معيار التسليم:**

لكل منتج رحلة عرض→تجربة→نتيجة→طلب وصول؛ receipt حقيقي من قناة اختبار؛ منع الوصول غير المرخص ومنع شراء باقي المنتجات إجباريًا؛ قائمة أسعار وشروط معتمدة أو حالة صريحة تمنع العرض التجاري غير الموافق.

---

## P20 — ذاكرة الوكلاء وعزل السياق ودورة حياة البيانات

**التبعيات:** P02 P03 P05. **معايير الإغلاق:** DB-05 KE-03 SE-05. **الموانع المرتبطة:** F12.

**الملفات المستهدفة:**
- `src/server/agents/repository.mjs (جديد إذا لم يوجد)`
- `src/server/agents/runtime.mjs (من P03)`
- `src/server/kernel/db.mjs`
- `src/server/kernel/access.mjs`
- `src/server/secure-chat/service.mjs`
- `migrations/ (ترحيل additive جديد)`
- `tests/ (اختبارات agent-memory جديدة)`

**أوامر العمل:**

نفّذ memory store وACL على tenant/user/agent/run/session؛ فصل short-term context عن persistent memory، versioning ومصدر البيانات وTTL وconsent وrevocation. امنع retrieval عبر tenant آخر أو بعد تبديل الدور، وامنع تخزين أسرار/hidden reasoning. نفّذ redaction قبل persistence وexport/delete hooks وإبطال cache بعد حذف/تغيير صلاحية. اربط embeddings فقط إن كانت ضمن مزود معتمد وميزانية؛ لا تضف خدمة خارجية مدفوعة تلقائيًا. نفّذ tool result sanitization ضد memory poisoning.

**معيار التسليم:**

اختبارات عزل read/write/search/export/delete/expiry/revocation مع مؤسستين، لا تسرب بالـcache أو logs، حذف قابل للتحقق، لا ذاكرة وهمية بالواجهة.

---

## P21 — Outbox وحلقات الوكلاء والتعافي والتكامل بين المنتجات

**التبعيات:** P10 P20. **معايير الإغلاق:** BE-04 KE-02 KE-03 KE-04 LD-04 QA-04. **الموانع المرتبطة:** F10 F12.

**الملفات المستهدفة:**
- `src/server/agents/orchestrator.mjs (من P03)`
- `src/server/agents/tool-executor.mjs (من P03)`
- `src/server/agents/runtime.mjs (من P03)`
- `src/server/agents/repository.mjs (من P03)`
- `src/server/kernel/events.mjs`
- `src/server/ledger/writer.mjs`
- `src/server/human-gate/integration.mjs`
- `src/server/firewall/binding.mjs`
- `migrations/ (عند الحاجة)`
- `tests/ (اختبارات integration/recovery جديدة)`

**أوامر العمل:**

نفّذ durable outbox/dispatch داخلي بعقد versioned events وcausation/correlation وidempotency. استكمل bounded steps/deadlines/cancel/lease recovery وretry فقط للعمليات الآمنة؛ reconcile provider uncertainty دون مضاعفة استدعاء مدفوع. أضف checkpoint/resume مع recheck للعضوية والسياسة والحصة وapproval fingerprint؛ امنع تنفيذ tool بعد cancel/revoke. نفّذ سيناريوهات مستقلة لكل وكيل وتدفق كامل بين الخمسة عبر Kernel، وحقن فشل من mock للـDB/Ledger/provider/crash بين commit وdispatch.

**معيار التسليم:**

لا event مكرر ولا أثر جانبي مكرر، recovery بعد restart، الأدلة تطابق sequence، توقف آمن عند failure، تشغيل مستقل وتكامل اختياري حقيقي، bounded loop وقياسات تكلفة/زمن ضمن الحدود المعتمدة.

---

## P22 — اعتماد Groq والتحقق الحي لكل وكيل وحدود FinOps

**التبعيات:** P04 P21. **معايير الإغلاق:** SC-02 SC-04 SC-05 FW-02 FW-03. **الموانع المرتبطة:** F03 F10 F11 F12.

**الملفات المستهدفة:**
- `src/server/ai/groq-gateway.mjs`
- `src/server/ai/public-sandbox-limiter.mjs`
- `src/server/secure-chat/models.mjs`
- `src/server/firewall/provider.mjs`
- `src/server/kernel/env.mjs`
- `.env.example`
- `render.yaml`
- `src/server/agents/ (ملفات P03–P10)`
- `tests/helpers/secure-chat-model.mjs`

**أوامر العمل:**

أكمل enrollment بمرجع موافقة النموذج ومزود البيانات والإقامة والاحتفاظ والـtool capabilities. افحص توفر النموذج المرجعي qwen/qwen3.8-27b في الحساب الحقيقي؛ لا تفترض أنه موجود ولا تستبدله دون موافقة. وحد credential server-side ولا تستخرج قيمته للتقرير. جهّز contract tests لكل وكيل: schema/tool calls/results/cancellation، قياس tokens وreservation/settlement مشتركة بين workers، ضمان no egress عند deny. إذا أثبتت آلية الحساب أن probe/inference مجاني فعليًا نفّذ minimal synthetic invocation لكل وكيل عبر gateway؛ ميزانية المستخدم الحالية 0 USD، لا استدعاء غير مضمون المجانية. عند عدم توفر الأداة أو الاعتماد أو الموافقة اترك live AI محجوبًا وقدم دليل mock واضح.

**معيار التسليم:**

سجل model/provider approval حقيقي، اثبات tool call عبر كل وكيل، model/latency/tokens/cost موثقة، منع ميزانية متجاوزة وتزامن، صفر نداءات عند الحظر؛ لا PASS حي من mock.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P23, P24, P25. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

## P23 — Developer Workbench وعقود SDK/API الفعلية

**التبعيات:** P03 P10 P12. **معايير الإغلاق:** UX-07 BE-01 BE-08. **الموانع المرتبطة:** F15 F16.

**الملفات المستهدفة:**
- `src/pages/demo/developer-workbench.astro (جديد إذا غاب)`
- `src/pages/demo/governance.astro`
- `src/server/api/routes.mjs`
- `src/server/api/request-schemas.mjs`
- `src/server/api/response-schemas.mjs`
- `src/pages/app/api/agents/ (من P03)`
- `src/pages/docs.astro`
- `src/scripts/governance-demo.ts`

**أوامر العمل:**

أصلح مسار 404 بصفحة Workbench وفق MagicPath، أنشئ قائمة endpoints من registry الحقيقي مع auth/method/schema/errors/limits/version وأمثلة بيانات اصطناعية. افصل copy example وlocal try من التنفيذ الحقيقي؛ لا تخلق POST /api/governance/evaluate وهميًا. إذا نُفّذ endpoint موثق فمرره عبر boundary/authorization/quota وإلا صرّح أن المثال غير قابل للتنفيذ. أضف spec آلية التوليد أو docs عقد قابلة للتحقق وdeep links. لا تكشف bearer token أو payload حساس.

**معيار التسليم:**

GET 200 فعلي، كل مثال مربوط بعقد فعلي أو مميز كمحاكاة، أزرار النسخ والتنقل تعمل، API contract يطابق 108 العمليات الأصلية وما أضيف، no unauthorized writes.

---

## P24 — نقل Shell MagicPath ومطابقة 12 حالة بالصور والتفاعلات

**التبعيات:** P12 P23. **معايير الإغلاق:** UX-02 UX-04 UX-06. **الموانع المرتبطة:** F06 F15 F16.

**الملفات المستهدفة:**
- `src/pages/demo/governance.astro`
- `src/scripts/governance-demo.ts`
- `src/styles/experience-hub.css`
- `src/styles/experience.css`
- `src/styles/design-system.css`
- `src/styles/tokens.json`
- `src/layouts/AppLayout.astro`
- `src/components/design-system/Modal.astro`
- `tests/governance-demo-browser.e2e.mjs`

**أوامر العمل:**

نفّذ shell/sidebar/topbar/metrics/pipeline/cards من المرجع المثبت 476546341477171201؛ يمين 236px desktop مقابل اليسار 203px حاليًا، طبّق tokens وخط RTL بعد contrast مع الحفاظ على drawer الجوال إذا كان أفضل وبقرار موثق. اعمل same-state snapshots لكل قسم/مودال، 1440×900 و390×844 وإطار مماثل دون wrapper MagicPath. أصلح 5×5 مقابل 3×3 بمقياس معتمد لا تحويل صامت؛ APPROVED بعد الرفض في المرجع لا يُنسخ؛ reset وLedger empty-state وno-WebCrypto fail-closed. قارن animations/reduced motion وfocus/keyboard/tab/modal وكل control؛ لا تعدّل Hero أو المرجع.

**معيار التسليم:**

12/12 شاشة لها screenshots فعلية وحالات action/expected/actual، pixel diff threshold معتمد لكل stable region لا رقم تشابه مخترع، 5 حالات Firewall، approve/reject، tamper/reset، لا 404 ولا stale UI، جميع الانحرافات مبررة.

---

## P25 — تدقيق وإصلاح واجهات الموقع العام ومركز المعرفة وحماية Hero

**التبعيات:** P24. **معايير الإغلاق:** UX-03 UX-06 QA-05 SEO-03. **الموانع المرتبطة:** F06 F16.

**الملفات المستهدفة:**
- `src/pages/index.astro`
- `src/components/Header.astro`
- `src/components/Constellation.astro`
- `src/layouts/BaseLayout.astro`
- `src/pages/docs.astro`
- `src/pages/knowledge/**`
- `src/components/KnowledgeReader.astro`
- `src/scripts/knowledge-center.ts`
- `src/scripts/knowledge-reader.ts`
- `src/styles/knowledge-center.css`
- `src/styles/knowledge-reader.css`
- `src/styles/interior-motion.css`
- `src/styles/site.css`
- `tests/accessibility-performance-smoke.mjs`

**أوامر العمل:**

احفظ baseline للـHero/Header/Constellation والنص والترتيب قبل أي تعديل؛ لا تغيّرها ولا CSS مشتركة تؤثر عليها. أصلح فقط باقي المسارات العامة ومركز المعرفة والبحث والفلاتر والروابط وأخطاء 404/empty/loading، RTL/bidi وأسماء الأزرار والحركة. اعمل screenshots/rendered checks لكل صفحة مؤهلة بحسب الانطباق، viewport 320/360/390/650/768/1000/1024/1440/1920، keyboard/focus/contrast/reduced motion. أصلح أي خلل مثبت لا تعِد تصميم الهوية. نظّف duplicate files فقط بإثبات عدم الاستعمال.

**معيار التسليم:**

Hero/Header parity قبل/بعد، سجل page/action coverage مستقل، لا overflow أو hydration/console error مؤثر، WCAG AA checks المنطبقة واختبار لوحة المفاتيح؛ LCP/CLS/INP مختبري/ميداني منفصل.

---

## P26 — أمن التطبيق والوكلاء واختبارات الحدود الحرجة

**التبعيات:** P17 P20 P21 P22. **معايير الإغلاق:** SE-01 SE-03 SE-05 HG-04 FW-03 BE-08. **الموانع المرتبطة:** F10 F12 F16.

**الملفات المستهدفة:**
- `src/middleware.ts`
- `src/server/api/boundary.mjs`
- `src/server/kernel/auth.mjs`
- `src/server/kernel/access.mjs`
- `src/server/agents/tool-executor.mjs (من P03)`
- `src/server/firewall/guard.mjs`
- `src/server/secure-chat/policy.mjs`
- `src/pages/api/security/csp-report.ts`
- `SECURITY-SECURE-CHAT.md`
- `tests/secure-chat-security.e2e.mjs`

**أوامر العمل:**

نفّذ threat model لكل trust boundary مع إصلاح مباشر لأي إخفاق: input/output schema، origin/CSRF، XSS/SQLi/SSRF، prompt/tool injection وdata egress، tenant-ID tampering، malicious tool result، replay، overprivileged agent، rate limiting وpayload bounds. أضف allowlist صريحة للخروج والأدوات، منع secrets/PII في responses/logs، fail-closed عند غياب evidence أو policy. اختبر mock targets مصرح بها فقط دون استهداف خدمات طرف ثالث. راجع كل API method وerror/no-store وrole negative cases ولا تخفّض الضوابط لأجل نجاح الاختبار.

**معيار التسليم:**

100% critical controls المنطبقة، دليل request/response منقح على رفض الهجمات وحجب أي provider call، لا تسرب ولا bypass ولا approval من الوكيل؛ zero P0 مؤثر.

---

## P27 — خصوصية البيانات والامتثال وسياسات الاحتفاظ والحذف

**التبعيات:** P20 P26. **معايير الإغلاق:** SE-04 SE-05 RG-03 LD-03. **الموانع المرتبطة:** F05 F12.

**الملفات المستهدفة:**
- `src/server/governance/reference-catalog.mjs`
- `src/server/governance/internal-pack.mjs`
- `src/server/kernel/policies.mjs`
- `src/server/secure-chat/service.mjs`
- `src/server/ledger/service.mjs`
- `src/pages/privacy.astro`
- `src/pages/trust.astro`
- `src/pages/compliance.astro`
- `src/pages/terms.astro`
- `migrations/ (عند الحاجة)`

**أوامر العمل:**

نفّذ سجل data inventory وretention/legal hold/export/delete lifecycle حسب سياسة المالك المعتمدة، بما يشمل memory/agent payloads/telemetry/backups. اربط PDPL/SDAIA/ISO 42001/NIST بالضوابط ومراجع الإصدارات دون نسخ نصوص محمية أو ادعاء شهادة. أثبت data residency لكل خدمة ومزود وsubprocessor؛ Ohio بيئة اصطناعية فقط، لا بيانات عميل بلا اعتماد. أضف مسار طلب حذف/تصدير مأذون مع evidence؛ احفظ سلامة Ledger عبر سياسة فصل المحتوى عن metadata لا حذف أدلة محمية اعتباطًا. تحديث trust/legal text من أدلة تشغيل معتمدة.

**معيار التسليم:**

اختبار export/delete/retention/hold مع بيانات اصطناعية، توثيق إقامة/عدم تدريب/معالجة/احتفاظ مع موافقة، لا ادعاء امتثال غير مدعوم؛ مانع تجاري إن تعذر الاعتماد.

---

## P28 — النسخ الاحتياطي والاستعادة والتشغيل وإدارة الحوادث

**التبعيات:** P16 P26 P27. **معايير الإغلاق:** IN-05 SE-05 LD-04. **الموانع المرتبطة:** F05 F12.

**الملفات المستهدفة:**
- `render.yaml`
- `scripts/audit-runtime-posture.mjs`
- `scripts/smoke-healthz.mjs`
- `scripts/build-version.mjs`
- `src/server/kernel/readiness.mjs`
- `src/server/kernel/events.mjs`
- `docs/ (runbooks جديدة عند الحاجة)`

**أوامر العمل:**

نفّذ backup وrestore rehearsal معزولًا مع schema/ledger counts وintegrity وRTO/RPO مقاسين؛ اختبر restart وقفل مزود/kill switch وdegraded state وreconciliation. ضع runbook للأدوار والحوادث والتصعيد وإدارة الأسرار والتدوير، وrelease artifact manifest/verification؛ اختبر rollback للتطبيق بلا rollback DB مدمر. حدد plan/limits للـRender وNeon وعدم الادعاء بـSLA دون موافقة. أثبت branch protection وrestore policy قبل الإنتاج، ولا تنسخ البيانات الحقيقية إلى الاختبار.

**معيار التسليم:**

restore receipt فعلي من بيانات اصطناعية، زمن الاستعادة وفقد البيانات المقاس، rollback/kill switch مجرب، دليل alert/incident routing وأسماء الأسرار فقط، خطة rollback محفوظة.

---

## P29 — إصلاح CI وسلسلة التوريد والأداء والاختبارات

**التبعيات:** P21 P25 P26. **معايير الإغلاق:** QA-01 QA-02 QA-03 QA-04 QA-05 QA-06 SE-06 IN-04. **الموانع المرتبطة:** F04 F14.

**الملفات المستهدفة:**
- `.github/workflows/accessibility-performance.yml`
- `package.json`
- `package-lock.json`
- `scripts/server.mjs`
- `astro.config.mjs`
- `tests/accessibility-performance-smoke.mjs`
- `tests/ (المتأثرة فقط)`

**أوامر العمل:**

استرجع job logs الفعلية للإخفاق وحدد root cause، ثم أصلح الكود أو CI لا assertions. افحص advisories الحالية بما فيها GHSA-qh8j-hqjv-7m4x إن انطبقت على lockfile؛ حدث الاعتماد بأقل تغيير متوافق وراجع start script. شغّل npm ci/build/check واختبارات الوحدة/DB/Browser على SHA محدد، bounded concurrency/load مع mock provider وبدون إنفاق، فحص bundle وperformance. فعّل ruleset وrequired passing checks وفق إذن مالك GitHub؛ لا bypass. لا تعِد تشغيل اختبارات غير متأثرة إلا gate النهائي.

**معيار التسليم:**

CI green على SHA المرشح نفسه، logs السبب والإصلاح، advisory resolution أو mitigation مثبتة، lockfile reproducible، branch protection enforced، لا اختبار مضعف ولا فشل مخفي.

---

## P30 — إغلاق جرد الروابط وAPI والتحويلات والفهرسة التقنية

**التبعيات:** P23 P25 P29. **معايير الإغلاق:** BE-05 BE-06 BE-07 BE-08 SEO-02 SEO-03 SEO-05 SEO-06 SEO-07. **الموانع المرتبطة:** F07 F13 F16.

**الملفات المستهدفة:**
- `redirects.json`
- `sitemap.xml`
- `scripts/seo-build.mjs`
- `scripts/audit-sitemap-contract.mjs`
- `src/layouts/BaseLayout.astro`
- `src/server/api/routes.mjs`
- `src/pages/404.astro`
- `tests/seo-redirects.test.mjs`
- `tests/seo-build.test.mjs`

**أوامر العمل:**

أعد توليد inventory من HEAD النهائي: source patterns/dynamic expansion/sitemap/internal href/anchors/redirects/legacy. أعد اختبار 159 redirect rule والـ327 URL المكتشفة وأضف الجديد؛ صنّف 252 404 التاريخية حسب GSC/backlinks/retire/soft404 بدل تحويل جماعي. أنشئ link graph وbroken/orphan register وresumption checkpoint، كل public GET بمحتوى متوقع وcanonical، وكل API method بحسب auth/schema/status؛ write tests على المرشح فقط. أصلح كل عيب مؤثر في route أو redirect أو anchor أو canonical؛ لا تفهرس private/API أو hostname المرشح. عالج سبب sitemap error لا مجرد إعادة الإرسال.

**معيار التسليم:**

100% من المقام المكتشف والمنطبق مفحوص أو سبب غير قابل للتحقق مسجل يمنع ادعاء الاكتمال؛ no redirect loops/soft404/critical broken links؛ 301 للـ159 إن بقيت منطبقة؛ sitemap صالح وGSC قبول بعد إذن.

---

## P31 — SEO/GEO والمحتوى العربي ومركز المعرفة والتحويل

**التبعيات:** P19 P25 P30. **معايير الإغلاق:** SEO-01 SEO-03 PJ-04. **الموانع المرتبطة:** F07 F08.

**الملفات المستهدفة:**
- `src/data/knowledge.ts`
- `src/data/knowledge-guides.ts`
- `src/data/knowledge-hubs.ts`
- `src/data/knowledge-journeys.ts`
- `src/data/structured-data.ts`
- `src/data/editorial.ts`
- `src/pages/knowledge/**`
- `src/pages/docs.astro`
- `src/pages/products/[product].astro`
- `src/pages/solutions/[sector].astro`

**أوامر العمل:**

نفّذ تحسين metadata وstructured data وtopic clusters وinternal linking والبحث العربي وفق intent سعودي حقيقي. راجع الصفحات اليتيمة والمواد القديمة، أضف محتوى مفيد فقط بعد مراجعة بشرية ومراجع أصلية، لا صفحات SEO متكررة ولا fabricated endorsements. استخرج فرص GSC من فترة مكتملة، صنّف queries وصفحات ومشاكل cannibalization، راجع المنافسين التسعة من مصادرهم الرسمية لتحديد قدرات/رسائل ذات صلة بوعود AIGAS؛ لا تجعل ميزاتهم الإضافية scope تلقائيًا. اربط كل صفحة منتج/قطاع بCTA مناسب وتحسين قابل للقياس.

**معيار التسليم:**

محتوى عربي منقح ومعتمد، metadata/canonical/schema صحيحة، لا ادعاء تفوق أو امتثال، سجل intent→page→CTA وقياس baseline؛ ترتيب Google لا يُضمن ولا يُعتبر شرط كود قابلًا للتزييف.

---

## P32 — التحليلات والمراقبة والـconversion بأدلة فعلية

**التبعيات:** P19 P27 P28 P30. **معايير الإغلاق:** SEO-01 SEO-04 IN-05 QA-04. **الموانع المرتبطة:** F07 F12.

**الملفات المستهدفة:**
- `src/scripts/measurement.ts`
- `src/scripts/monitoring.ts`
- `src/pages/api/measurement-status.ts`
- `src/pages/api/observability.ts`
- `src/layouts/BaseLayout.astro`
- `src/server/kernel/events.mjs`
- `src/server/agents/runtime.mjs (من P03)`
- `render.yaml`

**أوامر العمل:**

نفّذ قياس GA4/GSC على الخاصية المعتمدة، tag مرة واحدة، consent وduplicate page_view وhostname isolation؛ استبعد localhost والمرشح من إنتاج القياس. اربط Sentry/PostHog release/environment/correlation وأحداث trial/activation/export/request-access مع payload allowlist خال من PII والنصوص والأسرار. لا تفعّل autocapture/session replay تلقائيًا. أضف metrics لوكلاء AI: duration/steps/tokens/budget/errors/cancel دون محتوى. أرسل synthetic events إلى test environment بعد إذنها، تحقق من الاستلام فعليًا وalert routing. قارن فترات GA4/GSC متساوية منفصلة المقامات.

**معيار التسليم:**

أحداث مستلمة ومربوطة بـSHA/بيئة، لا PII، no duplicate events، trace/alert مثبت، dashboard conversion وusage بأرقام فعلية لا دخل أو ترتيب متوقع.

---

## P33 — حزم النشر المؤسسي والتشغيل المستقل والتسليم للعميل

**التبعيات:** P19 P22 P27 P28. **معايير الإغلاق:** KE-04 PJ-04 IN-05 SE-04. **الموانع المرتبطة:** F05 F08 F12.

**الملفات المستهدفة:**
- `render.yaml`
- `package.json`
- `scripts/server.mjs`
- `.env.example`
- `src/server/kernel/env.mjs`
- `src/server/kernel/access.mjs`
- `docs/ (دليل تشغيل وترخيص جديد عند الحاجة)`

**أوامر العمل:**

نفّذ حزمة تشغيل مستقلة للمنتجات وKernel ضمن النمط المعتمد SaaS/On-Prem أو isolated customer environment إن كان ضمن وعد الإطلاق. أضف config validation وinstaller/release manifest ودليل upgrade/rollback/export/exit. افصل provider adapter عن Groq-specific assumptions؛ تشغيل معزول لا يعني air-gap عند وجود اتصال خارجي. لا تضف مزودًا أو منصة مدفوعة بلا إذن؛ اترك النمط غير المعتمد خارج العرض التجاري صراحة. اختبر تثبيت/تشغيل/ترقية حزمة محلية اصطناعية باستخدام نفس source وlockfile، no shared customer data.

**معيار التسليم:**

install/start/ready/upgrade/rollback مثبتة للنمط الموعود، دليل متطلبات الاستضافة والمفاتيح والإقامة والترخيص والدعم؛ لا ادعاء air-gap أو SLA بلا إثبات.

---

## P13 — جودة المصدر والمسارات وSEO وObservability

**التبعيات:** P01 P10 P11 P12 P29 P30 P31 P32. **معايير الإغلاق:** QA-01 QA-02 QA-03 QA-04 QA-05 QA-06 SEO-01 SEO-02 SEO-03 SEO-04 SEO-05 SEO-06 SEO-07.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P29, P30, P31, P32. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

**التبعيات:** P01 P02 P03 P04 P10 P11 P13 P26 P27 P28 P29 P33. **معايير الإغلاق:** SE-01 SE-03 SE-04 SE-05 SE-06 IN-04 IN-05.

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

**حدود التنفيذ:** نفّذ أساس هذه المهمة؛ أكمل التحقق والتعديلات المتخصصة في P26, P27, P28, P29. لا تعِد تنفيذ إصلاح أو اختبار ثبت على نفس النسخة والبيئة.

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

## P34 — بوابات القبول المستقلة وحساب النسب قبل النشر

**التبعيات:** P16 P17 P18 P19 P20 P21 P22 P23 P24 P25 P26 P27 P28 P29 P30 P31 P32 P33 P14. **معايير الإغلاق:** ALL83. **الموانع المرتبطة:** F01–F16.

**الملفات المستهدفة:**
- `scripts/audit-runtime-posture.mjs`
- `scripts/audit-sitemap-contract.mjs`
- `scripts/smoke-healthz.mjs`
- `tests/ (التحقق المتأثر وrelease gate)`
- `REQUIREMENTS-CLOSURE-OVERLAY.csv (دليل خارجي)`
- `EXECUTION-REQUIREMENT-MAP.csv (دليل خارجي)`

**أوامر العمل:**

اجمع أدلة كل مهمة من نفس SHA؛ ثبّت المقام الجديد المكتشف قبل الحساب مع حفظ 83 معيارًا الأصلية ودرجاتها، ومعايير جديدة منفصلة لا double-count. أعد الاختبار للـ64 غير المجتازة ولكل شرط تأثر بالتعديل، وحقق الموانع F01–F16 والفجوات التشغيلية المكتشفة. احسب independently المصدر/local/isolated/staging/live وكل منتج وAPI/Integration/UX وcritical controls. راجع دورتي Idea Destroyer وتبعيات التنفيذ، اكشف أي pass بلا proof وأعد فتحه، وافصل production-only checks المعلقة على cutover عن الإخفاقات الحقيقية: لا تشترط دليل post-cutover قبل السماح بـcutover. جهّز قائمة preflight gates وpost-cutover smoke وrollback triggers للمهمة P15.

**معيار التسليم:**

100% للمتطلبات المنطبقة القابلة للقياس في المرشح، 100% security critical وzero P0؛ كل production-only شرط موسوم pending-post-deploy لا PASS؛ scorecard قابل لإعادة الحساب، decision لكل نطاق، authorization مطلوب مستقلًا. لا تنشر في هذه المهمة.

---

## P15 — إغلاق النسب وإطلاق المشروع والنشر المحكوم

**التبعيات:** P01–P14 وP16–P34؛ P34 بوابة preflight إلزامية. **معايير الإغلاق:** جميع الـ83 وأي معيار جديد معتمد.

**الملفات المستهدفة من شجرة المصدر:**
- `render.yaml`
- `redirects.json`
- `scripts/build-version.mjs`
- `scripts/smoke-healthz.mjs`
- `scripts/audit-runtime-posture.mjs`
- `scripts/audit-sitemap-contract.mjs`
- `.github/workflows/accessibility-performance.yml`

**أوامر العمل:**

استلم نتائج تدقيق P34 المستقل على HEAD النهائي وأعد تحقق أي تغيير لاحق: استورد REQUIREMENTS-TRACKER.csv وEXECUTION-REQUIREMENT-MAP.csv، أعد جرد المتطلبات الجديدة قبل القياس، لا تحذف FAIL/BLOCKED ولا تغير المقام لتجميل الدرجة؛ تحقق من كل شرط في البيئة المطلوبة. اكتب خارج ملفات التطبيق تقرير scorecard بصفوف PASS_VERIFIED/FAIL_VERIFIED/NOT_VERIFIED/BLOCKED وSHA/UTC/evidence وenvironment، احسب الأوزان حسب 15 محورًا، raw numerator/denominator/evidence coverage، كل منتج/Backend/API/Integration/Design/Trial/Production منفصل. ارفع كل محور/منتج إلى 100% من المتطلبات المستهدفة، 100% critical وzero P0؛ 80% بوابة حد أدنى سابقة وليست بديلًا عن استكمال الوعود؛ أي residual يظل معلنًا ولا نشر مؤثر عليه. نفّذ Idea Destroyer دورتين وإعادة التحقق، لا تقبل self-reported نجاحات.
عند اجتياز preflight وموافقة المالك، نفّذ sequence النشر؛ أجّل فقط شروط القياس الحي التي يستحيل قياسها قبل cutover إلى smoke gate بعده، ولا تفتح Live AI أو commercial قبل إغلاقها. بتفويض مالك الإنتاج المحدد: backup+restore rehearsal وموافقة residency/model/budget، تطبيق delta ledger على Staging ثم production وفق خطة P02، تجهيز Node service بالإعدادات والأسرار المعتمدة، نشر SHA النهائي، فحص readiness وAuth وnegative tenant tests، verified 159 redirects والـSitemap والرحلة العامة، cutover Cloudflare إلى Node مع static origin محفوظ وTTL/rollback؛ تحقق من HTTPS وcanonical وreadyz وall live promises وسجل CI وobservability. افتح flags تدريجيًا وفق gates (public synthetic ثم live AI/trial/commercial). إن فشل أي critical check أعد origin/feature flags للنسخة السابقة، ولا تنفذ rollback DB مدمرًا؛ احتفظ بالدليل. لا تنقل DNS ولا تعدل بيانات الإنتاج دون إذن نشر صريح منفصل؛ الهدف نشر فعلي عند تحقق الشروط وليس توصية نشر فقط.

**معيار التسليم:**
- كل معيار مرتبط بدليل مباشر؛ سجل النشر الفعلي أو سبب حجبه، وقرار GO/NO-GO لكل نطاق.

---

