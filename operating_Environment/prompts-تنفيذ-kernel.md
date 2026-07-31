تمام. هذه نسخة جديدة من **Prompts تنفيذية شاملة**، مرتبة بحيث ينفذ الوكيل المشروع كاملاً وفق المستندات الأربعة **بدون إسقاط أي نقطة**:

1. `تقرير-صفحات-kernel.md`
2. `تصميم-صفحات-kernel.md`
3. `Evaluation-OS.md`
4. `Evaluation-environment.md`

أرفق الملفات الأربعة مع **كل Prompt**، ولا تجعل الوكيل ينتقل للمرحلة التالية قبل تقديم تقرير تحقق من المرحلة الحالية.

---

# Prompt 00: عقد التنفيذ ومصدر الحقيقة

```text
أنت تعمل على مشروع BrightAI/BRIGHTAI.

أرفقت لك أربعة مستندات إلزامية، وهي مصدر الحقيقة الكامل للمشروع:

1. تقرير-صفحات-kernel.md
2. تصميم-صفحات-kernel.md
3. Evaluation-OS.md
4. Evaluation-environment.md

مهمتك تنفيذ كل ما ورد في المستندات داخل المشروع الحالي، وليس إنشاء نموذج تجريبي منفصل أو واجهة شكلية.

ترتيب أولوية المستندات:
1. تقرير-صفحات-kernel.md يحدد الصفحات والوظائف النهائية.
2. تصميم-صفحات-kernel.md يحدد UI/UX ونظام التصميم والتجاوب والوصولية.
3. Evaluation-OS.md يحدد تجربة Evaluation OS ومكونات Playground.
4. Evaluation-environment.md يحدد خارطة التنفيذ والـDatasets والـScorers والتشغيل والشهادة.

قواعد إلزامية:
- لا تتخطى أي صفحة أو ميزة أو حالة أو مخرج مذكور في المستندات.
- لا تختصر المتطلبات إلى نسخة مبسطة.
- لا تبدأ بالتعديل قبل فحص المشروع الحالي.
- لا تفترض التقنية أو أسماء الملفات أو الـroutes.
- افحص package.json وملفات routing وsrc وbackend وAPI وstate management وCSS قبل التنفيذ.
- لا تحذف أي ملف أو route أو component قبل جرد استخداماته.
- لا تغيّر Evaluation Run أو Dataset أو Certificate سابقاً.
- أي حذف واسع يحتاج تقريراً قبل الحذف.
- أي ميزة غير متصلة فعلياً بمصدر بيانات يجب أن تحمل Demo أو Simulated أو Mock.
- لا تعرض مزوداً غير حقيقي.
- لا تضع مفاتيح API أو secrets في الواجهة أو المستودع.
- لا تدّعي الامتثال الكامل أو الأمان المطلق.
- لا تستخدم بيانات إنتاج حقيقية.
- حافظ على RTL واللغة العربية.
- حافظ على جميع الروابط الحالية، وأضف redirects عند الحاجة.
- لا تنشئ نظام تصميم ثانياً إذا كان هناك نظام قائم.
- لا تنشئ Shell أو state أو API مكررة.

نفذ الآن التحليل فقط، ولا تعدل الكود.

أخرج:
1. التقنية المستخدمة.
2. بنية المشروع.
3. كل صفحات src/pages/kernel الحالية.
4. كل routes الحالية.
5. كل components المشتركة.
6. كل services وAPI وstate stores.
7. كل ملفات CSS وtokens.
8. كل الصفحات والميزات المفقودة مقارنة بالمستندات.
9. كل الملفات المتكررة أو القديمة.
10. تعارضات المستندات إن وجدت.
11. خطة تنفيذ كاملة Milestone by Milestone.
12. قائمة الملفات المتوقع إنشاؤها وتعديلها وحذفها.

لا تكتب "تم التنفيذ". هذه الخطوة تحليل فقط.
```

---

# Prompt 01: خطة المشروع وMilestones

```text
اعتماداً على المستندات الأربعة وتحليل المشروع، أنشئ خطة تنفيذ كاملة لا تسقط أي متطلب.

قسّم التنفيذ إلى هذه المراحل:

M0: Audit and architecture baseline
M1: Design tokens and Kernel Shell
M2: Shared navigation, Trace Drawer, Command Palette, roles
M3: Shared data models and state
M4: Index page and 90-second incident story
M5: Playground single-run experience
M6: Evaluation Run engine
M7: Dataset management and Saudi Benchmark
M8: Scorers and evaluation results
M9: Batch execution
M10: A/B comparison
M11: Seed and reproducibility
M12: Cost and latency observability
M13: Evaluation Certificate and verification
M14: Chat page
M15: Scenarios page
M16: Red Team page
M17: Policies page
M18: Audit page
M19: Approvals page
M20: Replay page
M21: Compliance page
M22: Evidence page
M23: Reports page
M24: Stats page
M25: Models page
M26: Connectors page
M27: Developer/API page
M28: Cross-page integration
M29: Security, privacy, accessibility, responsive QA
M30: Cleanup, migration, documentation, and final delivery

لكل مرحلة اكتب:
- الهدف.
- المتطلبات المنقولة من كل مستند.
- الملفات المتأثرة.
- الملفات الجديدة.
- dependencies.
- المخاطر.
- معايير القبول.
- الاختبارات.
- قرار التوقف إذا فشلت المرحلة.

أنشئ ملفاً داخل المشروع باسم مناسب مثل:
docs/kernel-implementation-roadmap.md

لا تبدأ تنفيذ الكود في هذه الخطوة.
```

---

# Prompt 02: جرد وتنظيف معماري آمن

```text
نفّذ M0 فقط.

افحص المشروع وأنشئ جرداً دقيقاً لكل:
- pages.
- routes.
- layouts.
- components.
- hooks.
- stores.
- API clients.
- mock data.
- types.
- CSS.
- fonts.
- tests.
- scripts.
- deployment configuration.

ابحث تحديداً عن:
- صفحات Kernel مكررة.
- Unified headers مكررة.
- CSS متكرر.
- بيانات mock مكررة.
- routes قديمة.
- components غير مستخدمة.
- docs أو pages متعارضة.
- نصوص تقول NVIDIA أو Production أو Connected بدون مصدر حقيقي.
- أي استدعاء Groq أو مزود آخر غير موثق.
- أي API key داخل frontend.
- أي provider label لا يعكس المزود الحقيقي.

لا تحذف شيئاً الآن.

أنشئ:
1. docs/kernel-current-state.md
2. docs/kernel-dependency-map.md
3. docs/kernel-deletion-candidates.md
4. docs/kernel-data-flow.md

اكتب لكل ملف مرشح للحذف:
- سبب الترشيح.
- imports.
- dynamic imports.
- routes.
- tests.
- بديله المقترح.

نفذ build وtypecheck والاختبارات الموجودة وسجل نتائجها.
```

---

# Prompt 03: نظام التصميم الكامل

```text
نفّذ M1 بالكامل وفق تصميم-صفحات-kernel.md.

أنشئ أو وحّد Design System يحتوي على:

الألوان:
- ink-950 #080D16
- ink-900 #0D1424
- surface-800 #131C30
- surface-700 #1B2740
- line rgba(255,255,255,.08)
- line-strong rgba(255,255,255,.16)
- text-hi #F2F6FF
- text-mid #A7B4CC
- text-low #66748F
- bright-500 #2DD4A7
- bright-400 #5BE8C0
- bright-900 #0E3D33

حالات القرار:
- allowed: #22C55E مع علامة ✓
- redacted: #F59E0B مع علامة ◐
- pending: #6366F1 مع ساعة
- blocked: #EF4444 مع علامة ⊘
- critical: #B91C1C مع مثلث
- system-error: #94A3B8 مع ⚡

ألوان PII:
- identity #FB923C
- phone #60A5FA
- iban #F87171
- email #94A3B8
- medical #A78BFA
- card #F472B6
- passport #38BDF8

نفذ:
- Dark mode.
- Light mode.
- TheYearofTheCamel للعناوين إذا كان موجوداً.
- IBM Plex Sans Arabic للواجهة.
- JetBrains Mono للأرقام والهاش والكود.
- spacing scale من 4 إلى 96.
- border radius.
- elevation.
- focus states.
- reduced motion.
- typography.
- charts.
- tables.
- badges.
- pills.
- KPI cards.
- risk meters.
- trace badges.
- hash badges.
- compliance badges.

قواعد RTL:
- dir=rtl على الجذر.
- logical CSS properties.
- عكس الأسهم والشيفرونات.
- عدم عكس القفل والبحث والساعة والرسوم.
- LTR isolation للـTrace IDs والهاش والكود والـIBAN وأسماء الملفات.
- الزمن القديم يمين والجديد يسار.
- Pipeline المرحلة الأولى يميناً ويتدفق إلى اليسار.

أضف:
- Storybook أو صفحة داخلية للـtokens إذا كانت التقنية تدعم ذلك.
- توثيق لكل token.
- اختبارات contrast.
- لا تستخدم اللون وحده للحالات.

اختبر:
1440px، 1100px، 768px، 390px.
لا تنتقل قبل إزالة horizontal overflow.
```

---

# Prompt 04: Kernel Shell الكامل

```text
نفّذ M2 بالكامل.

وحّد جميع صفحات Kernel داخل Kernel Shell واحد.

Shell يجب أن يحتوي على:

1. Top bar بارتفاع 56px:
   - شعار BrightAI.
   - Trace ID search بعرض 320px.
   - Demo Data أو Real Data.
   - Inference provider الحقيقي.
   - DB status.
   - latency.
   - environment.
   - حالة الخدمة.

2. Sidebar بعرض 264px وقابل للطي إلى 72px:
   التشغيل:
   - الفهرس.
   - Playground.
   - المحادثة.
   - السيناريوهات.
   - Red Team.

   الرقابة:
   - السياسات.
   - Audit.
   - Approvals.
   - Replay.

   الإثبات:
   - Compliance.
   - Evidence.
   - Reports.
   - Stats.

   البنية:
   - Models.
   - Connectors.
   - API.

3. Role switcher:
   - DPO.
   - CISO.
   - Compliance Manager.
   - Developer.

4. CTA واحد فقط:
   - احجز عرضاً.

5. حالة الوحدات:
   - green.
   - amber.
   - red.
   - paused.

6. Command Palette Cmd/Ctrl+K:
   - البحث في الصفحات.
   - فتح Trace.
   - تشغيل Scenario.
   - فتح Policy.
   - تشغيل Evaluation.
   - توليد Report.
   - تغيير الدور.
   - تغيير الوضع.

7. الحالات المشتركة:
   - loading skeleton.
   - empty state مع زر فعل.
   - error state مع retry.
   - success toast مع undo.
   - offline.
   - unavailable provider.

8. Trace Drawer:
   - Trace ID.
   - decision.
   - user.
   - department.
   - model.
   - total latency.
   - 6 pipeline stages.
   - hash chain.
   - links إلى chat/audit/approval/evidence/report.

الدرج:
- ينزلق من اليمين.
- 520px على desktop.
- full-screen على mobile.
- focus trap.
- Escape للإغلاق.
- يعيد التركيز إلى العنصر السابق.

لا تكرر Shell داخل الصفحات.
```

---

# Prompt 05: نماذج البيانات المشتركة

```text
نفّذ M3.

أنشئ types/models مركزية وغير مكررة.

EvaluationRun:
- evaluationId
- status
- datasetId
- datasetVersion
- modelId
- modelVersion
- provider
- promptVersion
- policyVersion
- scorerVersions
- seed
- temperature
- topP
- environment
- startedAt
- completedAt
- totalCost
- currency
- totalLatency
- p50Latency
- p95Latency
- p99Latency
- totalCases
- passedCases
- failedCases
- criticalFailures
- certificateId
- inputHash
- outputHash
- runHash
- parentRunId

Trace:
- traceId
- evaluationId
- user
- department
- sector
- input
- redactedInput
- modelInput
- output
- riskScore
- piiFindings
- injectionFindings
- matchedPolicies
- pipelineStages
- decision
- evidenceId
- auditHash
- createdAt

PipelineStage:
- stageId
- stageName
- status
- startedAt
- completedAt
- latency
- reason
- inputHash
- outputHash
- relatedPolicy
- relatedScorer
- evidence

Dataset:
- datasetId
- name
- version
- status
- cases
- sectors
- languages
- complianceTags
- hash
- createdBy
- createdAt
- publishedAt

DatasetCase:
- caseId
- title
- input
- expectedBehavior
- expectedOutput
- riskLevel
- complianceTags
- piiTypes
- attackTags
- department
- sector
- language
- humanReviewRequired
- metadata
- version

ScorerResult:
- scorerId
- scorerVersion
- category
- score
- status
- expected
- actual
- severity
- reason
- relatedPolicy
- traceId
- recommendation

Certificate:
- certificateId
- evaluationId
- status
- documentHash
- signature
- issuedAt
- verificationUrl
- limitations

أنشئ shared store أو service حسب البنية الحالية.
لا تسمح بتعديل Run منشور.
كل تعديل ينشئ version جديداً.
أضف fixtures Demo منفصلة عن Live.
```

---

# Prompt 06: صفحة الفهرس والرحلة السردية

```text
نفّذ M4 للصفحة /kernel/.

يجب أن تصبح الصفحة بوابة تشغيل، لا شبكة روابط فقط.

فوق الطية:
- خلفية شبكية خافتة.
- عنوان BrightAI Kernel.
- زر "شغّل حادثة حقيقية · 90 ثانية".
- زر "ابدأ بنصك أنت".
- عداد "ما مُنع اليوم".
- KPIs.
- حالة Demo أو Live واضحة.

ابنِ Incident Story من 7 مشاهد:
1. موظف يكتب الطلب.
2. Firewall يكتشف PII.
3. Risk score يصعد إلى 87.
4. Policy تطابق الطلب.
5. Audit event يُنشأ.
6. الطلب يذهب للموافقة.
7. Evidence file يتولد.

أضف السيناريوهات:
- PII.
- Prompt Injection.
- Medical Export.
- SA-IBAN.

أضف:
- pause.
- resume.
- skip.
- restart.
- progress dots.
- القفز إلى أي مشهد.
- reduced-motion mode.
- mobile vertical mode.

تحت الطية:
- compliance arcs.
- module cards.
- role-based ordering.
- activity indicators.
- collapsed Learn section.

زر "ابدأ بنصك أنت" يجب أن يفتح Playground بإعداد مسبق، وليس route وهمياً.
```

---

# Prompt 07: Playground الأساسي

```text
نفّذ M5 بالكامل للصفحة /kernel/playground/.

لا تنشئ صفحة تسويقية. أنشئ Evaluation workspace فعلية.

التخطيط desktop:
320px input | 1fr pipeline | 380px results

التخطيط mobile:
Input section
ثم Pipeline horizontal scroll
ثم Results
وزر تشغيل ثابت أسفل الشاشة.

عمود الإدخال:
- Prompt editor.
- Multi-turn conversation editor.
- Dataset selector.
- Model selector.
- Policy selector.
- Sector selector.
- Department selector.
- User role selector.
- Sensitivity selector.
- Compliance package selector.
- Seed.
- Temperature.
- Top P.
- Cost estimate.
- Latency estimate.
- warning: لا تستخدم بيانات إنتاج حقيقية.
- six sample recipes:
  الهوية، IBAN، سجل طبي، رواتب، Injection، طلب بريء.
- policy toggles.
- تشغيل/إيقاف جميع السياسات.
- زر Run.
- زر Settings.

Pipeline:
1. Intake.
2. PII scan.
3. Injection scan.
4. Risk scoring.
5. Policy match.
6. Model call.
7. Output scoring.
8. Cost and latency.
9. Evidence.
10. Certificate preparation.

كل مرحلة:
- idle.
- running.
- complete.
- skipped.
- failed.
- unavailable.
- latency.
- reason.
- input/output.
- Trace.
- related policy.
- related scorer.

PII stage:
- highlight entities.
- color coding.
- confidence.
- type.
- action.
- original/redacted toggle.
- accessible table alternative.

Risk stage:
- 0-100 gauge.
- 12 risk factors.
- contribution of every factor.
- threshold at 70.
- explain why.

Policy stage:
- triggered policies.
- condition.
- action.
- compliance package.
- link إلى Policy.

Model stage:
- actual model input after redaction.
- streamed output.
- provider.
- latency.
- tokens.
- cost.

Results:
- human decision.
- score.
- severity.
- مع Kernel.
- بدون Kernel.
- compliance map.
- protected records.
- cost.
- latency.
- open Trace.
- replay.
- export code.
- add to Dataset.
- convert to Scenario.
- share settings-only URL.
- open Evidence.

أضف:
- A/B Diff.
- mini timeline.
- why explanation.
- recipe library with 20 cases.
- keyboard shortcuts.
- onboarding tour.
- rate limits.
- graceful provider fallback.
- local stages 1-4 if provider unavailable.
- accessibility.
- responsive layout.

أي Mock يجب أن يحمل Mock أو Demo.
```

---

# Prompt 08: Datasets وSaudi Benchmark

```text
نفّذ M7.

أنشئ Dataset Manager داخل Kernel.

الدعم المطلوب:
- create Dataset.
- draft editing.
- CSV import.
- JSON import.
- JSONL import.
- paste table.
- manual case creation.
- metadata.
- filtering.
- duplicate detection.
- missing field detection.
- version creation.
- version comparison.
- publish version.
- archive draft.
- test/validation/sample split.
- subset selection.

أنشئ Dataset تجريبياً:
Saudi Governance Benchmark v1.0

التوزيع:
- 20 PDPL/PII.
- 15 NCA/Prompt Injection.
- 15 SAMA/financial.
- 15 SFDA/medical.
- 10 SDAIA/transparency.
- 10 HR.
- 10 government.
- 5 Arabic/Saudi language.

يجب أن تشمل:
- allowed.
- redacted.
- blocked.
- approval required.

لا تعدل Dataset منشوراً.
لا تحذف Dataset مستخدماً في Run.
أي تعديل ينشئ version.
أضف hash لكل version.
اعرض:
- total cases.
- risk distribution.
- sector distribution.
- language distribution.
- allowed/blocked ratio.
- compliance coverage.
- duplicate warnings.
- missing expected behavior warnings.

أضف Test Dataset وfixtures، ولا تخلطها مع بيانات Live.
```

---

# Prompt 09: Scorers

```text
نفّذ M8.

أنشئ Scorer Registry وScorer Runner.

كل Scorer يحتوي:
- id.
- name.
- version.
- category.
- description.
- inputs.
- output range.
- severity.
- threshold.
- evaluator type.
- evidence requirements.

Accuracy:
- exact match.
- semantic similarity.
- factual accuracy.
- instruction following.
- completeness.
- Arabic quality.
- Saudi terminology.
- unknown handling.

Hallucination:
- unsupported claims.
- citation accuracy.
- contradiction.
- confidence calibration.
- fabricated regulatory claims.
- medical/legal overclaiming.

PII:
- detection.
- classification.
- redaction correctness.
- output leakage.

PII types:
- Saudi national ID.
- mobile.
- email.
- address.
- IBAN.
- credit card.
- patient file.
- medical record.
- salary.
- employee/customer data.

Injection:
- prompt injection.
- jailbreak.
- system prompt extraction.
- secret extraction.
- unauthorized tool use.
- policy bypass.
- audit tampering.
- human approval bypass.
- multi-turn manipulation.

Compliance:
- PDPL.
- NCA ECC.
- SDAIA.
- SAMA.
- SFDA.
- ISO 42001.

كل نتيجة تعرض:
- score.
- status.
- expected.
- actual.
- severity.
- explanation.
- policy.
- Trace.
- recommendation.

Rules:
- Critical PII leakage blocks production readiness.
- Scorer failure makes Run Incomplete.
- لا تعرض Compliant بدون control mapping.
- لا تستخدم score كبديل عن evidence.
- Live/Demo/Simulated واضح دائماً.
```

---

# Prompt 10: محرك Evaluation Run

```text
نفّذ M6 وM9.

أنشئ Evaluation Engine يدعم:

- single case run.
- dataset run.
- subset run.
- sample run.
- multi-turn run.
- limited agent run.
- rerun failed case.
- pause.
- cancel.
- resume.
- partial result saving.
- bounded concurrency.
- retry policy.
- provider timeout.
- scorer timeout.
- budget limit.

Pipeline:
1. Load Dataset.
2. Validate cases.
3. Create EvaluationRun.
4. Generate Trace.
5. Preflight PII.
6. Injection scan.
7. Risk assessment.
8. Policy evaluation.
9. Model invocation.
10. Output scoring.
11. Cost/latency calculation.
12. Evidence generation.
13. Aggregate results.
14. Gate decision.
15. Certificate preparation.

أثناء التشغيل اعرض:
- progress.
- completed cases.
- failed cases.
- critical failures.
- current case.
- cumulative cost.
- average latency.
- P50/P95 when available.
- error count.
- pause/cancel/resume.

لا تفقد النتائج عند توقف المزود.
لا تسمح بإصدار Passed لشغل ناقص.
```

---

# Prompt 11: A/B Comparison

```text
نفّذ M10.

أضف A/B comparison للآتي:
- Model A vs Model B.
- Prompt A vs Prompt B.
- Policy A vs Policy B.
- Cloud vs local.
- Before/after redaction.
- Previous version vs current version.

للمقارنة العادلة استخدم نفس:
- Dataset version.
- case order.
- Scorers.
- context.
- privacy settings.
- temperature.
- number of attempts.

إذا اختلف أي عنصر اعرض warning ولا تخفِ الاختلاف.

اعرض:
- overall.
- quality.
- hallucination.
- security.
- PII.
- compliance.
- cost.
- latency.
- P50/P95.
- failures.
- critical findings.
- changed decisions.
- trade-offs.

أضف:
- side-by-side result.
- difference highlighting.
- winner by metric.
- no single winner إذا اختلفت الأولويات.
- export comparison report.
- link إلى كل Trace.
```

---

# Prompt 12: Seed وإعادة الإنتاج

```text
نفّذ M11.

احفظ مع كل Run:
- seed.
- temperature.
- topP.
- model ID/version.
- provider.
- prompt version.
- policy version.
- dataset version.
- scorer versions.
- environment.
- runtime version.
- input hash.
- output hash.
- run hash.
- timestamp.

أضف Replay:
- إعادة تشغيل Run كامل.
- إعادة تشغيل حالة فاشلة.
- إعادة تشغيل باستخدام إعداد مختلف.
- مقارنة القديم بالجديد.

صنف النتيجة:
- Exact match.
- Acceptable variance.
- Material difference.
- Not reproducible.

لا تعدل Run قديم.
كل Replay ينشئ Run جديداً مع parentRunId.
اعرض سبب الاختلاف:
- provider changed.
- model changed.
- policy changed.
- dataset changed.
- scorer changed.
- environment changed.
- stochastic variance.

أضف reproducibility details إلى الشهادة.
```

---

# Prompt 13: التكلفة والزمن

```text
نفّذ M12.

احسب الزمن لكل مرحلة:
- intake.
- pii.
- injection.
- risk.
- policy.
- provider.
- scoring.
- evidence.
- total.

احسب:
- P50.
- P95.
- P99.
- average.
- max.
- min.
- error rate.

احسب التكلفة:
- input tokens.
- output tokens.
- provider cost.
- scorer cost.
- tool cost.
- total cost.
- cost per case.
- cost per passed case.
- cost per failed case.
- cost by model.
- cost by scorer.
- SAR currency.

أضف:
- budget limit.
- warning before expensive Run.
- stop at budget.
- cost regression alert.
- latency regression alert.
- provider outage alert.

اعرض التكلفة والزمن في:
- Playground.
- Stats.
- Models.
- Reports.
- Certificate.
- Trace Drawer.
```

---

# Prompt 14: Evaluation Certificate

```text
نفّذ M13.

أنشئ Evaluation Certificate موقعة لكل Run مكتمل.

محتوى الشهادة:

التعريف:
- Certificate ID.
- Evaluation ID.
- organization.
- user.
- environment.
- issuedAt.

النطاق:
- Dataset/version.
- case count.
- sectors.
- languages.
- compliance frameworks.
- Scorers/versions.

البيئة:
- model/version.
- provider.
- prompt/version.
- policy/version.
- seed.
- temperature.
- topP.
- runtime.
- cost.
- latency.

النتائج:
- overall score.
- quality.
- security.
- privacy.
- compliance.
- efficiency.
- pass/fail count.
- hallucination rate.
- PII leakage.
- injection rate.
- critical findings.
- P50/P95.
- human review count.

الأدلة:
- Trace IDs.
- Dataset hash.
- Policy hash.
- Prompt hash.
- Input hash.
- Output hash.
- Run hash.
- Evidence IDs.
- failed cases.

التوقيع:
- SHA-256.
- digital signature.
- signing timestamp.
- verification URL.
- limitations.

الحالات:
- Passed.
- Passed with Findings.
- Review Required.
- Blocked.
- Incomplete.

القواعد:
- Critical PII leakage يمنع Passed.
- Scorer حرج فشل يجعل الشهادة Incomplete.
- لا شهادة لتشغيل ناقص.
- لا private key في frontend.
- استخدم Web Crypto أو backend signing حسب المعمارية.
- أنشئ صفحة Verify Certificate.
- تعديل الشهادة يجب أن يفشل التحقق.
- لا تقل الشهادة إن النظام آمن بشكل مطلق.
```

---

# Prompt 15: صفحة المحادثة

```text
نفّذ M14 على /kernel/chat/.

المطلوب:
- تخطيط محادثة وContext panel.
- تبويبات الرسائل والسياق والتنبيه.
- Firewall banner.
- Governance strip تحت كل رسالة:
  PII.
  Risk.
  Decision.
  Trace.
- اختصارات:
  C محادثة جديدة.
  Enter إرسال.
  Shift+Enter سطر جديد.
  Esc إغلاق التنبيه.
- فتح الرسالة في Playground.
- عرض النص بعد التعمية.
- اقتراح صياغة آمنة عند الحظر.
- زر استخدام الصياغة.
- زر لماذا عدّلت؟
- Streaming output.
- حالات provider failure.
- Attachments مع فحص آمن.
- لا تعرض بيانات حساسة حقيقية في Demo.
- كل رسالة مرتبطة بـTrace.
- كل Run يمكن تحويله إلى Evaluation case.

اختبر RTL والكيبورد والجوال.
```

---

# Prompt 16: صفحة السيناريوهات

```text
نفّذ M15 على /kernel/scenarios/.

أضف السيناريوهات:
- Saudi ID leakage.
- Government contract review.
- Medical export.
- Prompt Injection.
- HR payroll export.
- Saudi IBAN leakage.
- Secret extraction.
- Anonymous medical research.
- Legal NDA summarization.
- HR resumes with PII.
- Bank quarterly report.
- SQL injection.

لكل Scenario:
- id.
- description.
- sector.
- compliance tags.
- expected behavior.
- risk.
- linked policies.
- linked Dataset case.
- last run.
- result.
- model.

أضف:
- Run single.
- Run all.
- batch progress.
- model matrix.
- previous run comparison.
- failed case to policy proposal.
- readiness report.
- Trace link.
- Evaluation Certificate link.
```

---

# Prompt 17: صفحة Red Team

```text
نفّذ M16 على /kernel/redteam/.

أنشئ:
- Red Team input.
- attack result.
- blocked/succeeded decision.
- defense explanation.
- linked policy.
- linked scorer.
- Trace.
- automatic report on successful attack.
- proposed mitigation policy.
- OWASP LLM categorization.
- 40 attack technique library.
- sequential multi-turn attack.
- leaderboard only for safe demo aliases.
- rate limits.
- no attacks against external systems.
- no production target by default.
- explicit Demo/Sandbox boundary.

إذا نجح الهجوم:
- لا تخفِ النتيجة.
- اعرض سبب النجاح.
- أنشئ finding.
- اقترح policy.
- اربط الحالة بـScenario.
- لا تنفذ أي action خطر خارج Sandbox.
```

---

# Prompt 18: صفحة السياسات

```text
نفّذ M17 على /kernel/policies/.

أضف:
- 11 policies.
- active/draft/archived states.
- PII type.
- compliance package.
- action.
- application count.
- last modified.
- edit.
- test in Playground.
- simulation mode.
- version history.
- Git-like diff.
- rollback.
- conflict detection.
- import/export.
- AI policy generator with explicit Demo/Live badge.
- no-code condition builder.
- AND/OR.
- exceptions.
- action:
  block.
  redact.
  warn.
  approve.
  local-model-only.

Simulation:
- replay last 1000 requests.
- extra blocks.
- false positives.
- affected departments.
- affected compliance controls.
- before activation warning.

لا تسمح بتعديل Policy version مستخدمة في Certificate قديم.
```

---

# Prompt 19: Audit وHash Verification

```text
نفّذ M18 على /kernel/audit/.

أضف:
- date filters.
- risk filters.
- status filters.
- user filters.
- department filters.
- Trace search.
- semantic search إذا كانت البنية تدعمها.
- CSV/JSON/PDF export.
- virtualized table.
- risk bar.
- status pill.
- hash badge.
- Trace Drawer.

Hash verifier:
- paste hash.
- verify chain.
- show previous/current/next hash.
- success state.
- failure state.
- tampering demonstration في Demo mode فقط.
- لا تعدل بيانات حقيقية.
- explain which link broke.
- export verification result.

Anomaly:
- unusual activity badge.
- explanation.
- related user and baseline.
- link إلى Trace.

لا تستخدم "immutable" إلا إذا كان التحقق فعلياً أو اكتب "Demo verification".
```

---

# Prompt 20: الموافقات

```text
نفّذ M19 على /kernel/approvals/.

أضف:
- pending.
- critical.
- review.
- approved.
- rejected.
- SLA timer.
- risk score.
- PII findings.
- triggered policies.
- full Trace.
- what happens if approved.
- approve.
- reject.
- delegate.
- mandatory rejection reason.
- suggested reason مع مراجعة بشرية.
- keyboard navigation:
  J/K.
  A.
  R.
  F.
  Space.
  ?.

كل قرار:
- ينشئ Audit event.
- يرتبط بـTrace.
- يظهر في Evidence.
- ينعكس في Certificate.
- لا يمكن حذفه من السجل.
```

---

# Prompt 21: Replay

```text
نفّذ M20 على /kernel/replay/.

أضف:
- historical period selector.
- policy selector.
- department scope.
- replay historical requests.
- before/after comparison.
- extra blocks.
- extra allows.
- false positives.
- affected departments.
- sample affected cases.
- side-effect warning.
- investigation mode by Trace ID.
- timeline reconstruction.
- decision memo export.

لا ترسل البيانات التاريخية إلى Provider خارجي أثناء Replay إلا بعد إظهار ذلك والحصول على موافقة.
```

---

# Prompt 22: Compliance وEvidence

```text
نفّذ M21 وM22.

Compliance:
- PDPL.
- NCA ECC.
- SDAIA.
- SFDA.
- SAMA.
- ISO 27001.
- ISO 42001.
- score per framework.
- trend.
- control mapping.
- evidence links.
- gap analysis.
- impact/effort matrix.
- high impact/low effort first.
- estimate.
- add as task.
- Saudi city heatmap.
- accessible city list alternative.
- no claim of full legal compliance.

Evidence:
- Evidence files.
- PDF preview.
- JSON verification.
- signed hash.
- sector filter.
- package filter.
- tags.
- batch generation.
- Trace link.
- Certificate link.
- third-party verification upload.
- tampering detection.
- retention information.
```

---

# Prompt 23: Reports وStats

```text
نفّذ M23 وM24.

Reports:
- governance report.
- compliance report.
- audit report.
- risk report.
- custom report.
- PDF.
- JSON.
- CSV.
- report preview.
- report builder.
- widgets:
  KPI.
  chart.
  table.
  text.
  page break.
- executive summary.
- five languages if architecture supports.
- scheduled reports.
- role recipients.
- Trace coverage.
- Certificate coverage.
- report template versions.

Stats:
- requests.
- allowed.
- blocked.
- pending.
- risks.
- PII.
- time series.
- risk distribution.
- top users.
- top departments.
- top models by cost.
- live event stream.
- pause stream.
- clickable KPI filters Audit.
- period comparison.
- custom widgets.
- alerts.
- quotas.
- cost.
- latency.
```

---

# Prompt 24: Models وConnectors وAPI

```text
نفّذ M25 وM26 وM27.

Models:
- model registry.
- version.
- provider.
- deployment location.
- Saudi/local/cloud badge.
- latency.
- cost per 1K tokens.
- scenario success.
- hallucination.
- safety.
- Arena A/B.
- routing rules.
- sensitive data to local model.
- manual override.
- degradation alert.
- model comparison export.

Connectors:
- SAP.
- Oracle.
- Dynamics.
- Epic.
- Moodle.
- SharePoint.
- Salesforce.
- Okta.
- read-only default.
- OAuth/SAML.
- health.
- sync.
- latency.
- failure state.
- token renewal.
- OAuth setup.
- data flow diagram.
- live test only with safe mock or authorized connection.
- queue during outage.
- custom connector guide.

API:
- API reference.
- cURL/Python/TypeScript examples.
- run example.
- temporary restricted test key only if backend supports it.
- webhook inspector.
- error handbook.
- migration guide.
- status.
- changelog.
- SDK docs.
- operator docs without code.
- Evaluation Run API.
- Dataset API.
- Scorer API.
- Certificate verification API.

لا تعرض أي مفتاح كامل.
```

---

# Prompt 25: الربط بين الصفحات الـ16

```text
نفّذ M28.

اربط جميع الصفحات التالية بمصدر بيانات مشترك:

1. /kernel/
2. /kernel/playground/
3. /kernel/chat/
4. /kernel/scenarios/
5. /kernel/redteam/
6. /kernel/policies/
7. /kernel/audit/
8. /kernel/approvals/
9. /kernel/replay/
10. /kernel/compliance/
11. /kernel/evidence/
12. /kernel/reports/
13. /kernel/stats/
14. /kernel/models/
15. /kernel/connectors/
16. /kernel/api/

قواعد الترابط:
- كل Trace ID يفتح Trace Drawer.
- كل Evaluation Run يظهر في Stats.
- كل فشل يفتح في Playground.
- كل Policy يمكن تجربتها في Playground.
- كل Scenario يشغل Evaluation Run.
- كل Certificate يظهر في Evidence.
- كل Report يوضح Runs التي يغطيها.
- Stats تنقل إلى Audit مع filters.
- Models تنفذ A/B.
- Connectors تسجل كل طلب في Audit.
- Approvals تؤثر في Trace وEvidence.
- Replay يربط بالـparent Run.
- Compliance يربط controls بالسياسات والأدلة.

اختبر deep links وbrowser refresh وback/forward.
```

---

# Prompt 26: الخصوصية والأمان

```text
نفّذ مراجعة أمن وخصوصية شاملة.

تحقق من:
- عدم وجود API keys في frontend.
- عدم وجود private signing key في frontend.
- عدم إرسال بيانات Playground العام دون موافقة.
- إظهار provider الحقيقي.
- عدم تخزين النص الخام افتراضياً.
- masking في logs.
- masking في URLs.
- عدم وضع input في share links.
- sandbox للـRed Team.
- rate limiting.
- budget limits.
- provider timeouts.
- scorer timeouts.
- authorization حسب الدور.
- منع الوصول إلى Evidence غير المصرح.
- منع تعديل Runs أو Certificates قديمة.
- audit لكل تغيير سياسة.
- audit لكل قرار موافقة.
- secure headers.
- CSP إذا كانت البنية تدعمها.
- validation لكل imports.
- file upload restrictions.
- PDF/JSON validation.
- webhook signature verification.

أنشئ تقريراً للمشاكل:
- Critical.
- High.
- Medium.
- Low.
- Accepted risk.

لا تصلح مشكلة أمنية بإخفائها من الواجهة.
```

---

# Prompt 27: الوصولية والتجاوب

```text
نفّذ M29.

اختبر كل الصفحات الـ16 على:
- 1440px.
- 1100px.
- 1024px.
- 768px.
- 390px.

أصلح:
- horizontal overflow.
- clipped dropdowns.
- broken drawers.
- broken tables.
- fixed bottom controls.
- mobile pipeline.
- sidebar collapse.
- keyboard traps.
- focus loss.
- small tap targets.

الوصولية:
- WCAG AA قدر الإمكان.
- contrast >= 4.5:1.
- color plus icon plus text.
- keyboard navigation.
- visible focus.
- focus trap في modal/drawer.
- Escape.
- aria-live للمراحل.
- screen-reader alternative لتظليل PII.
- table alternative للمخططات.
- list alternative للـheatmap.
- prefers-reduced-motion.
- lang=ar وdir=rtl.
- LTR isolation للبيانات التقنية.

اكتب تقرير accessibility وresponsive QA.
```

---

# Prompt 28: الاختبارات النهائية

```text
شغّل اختبارات شاملة فعلية، ولا تكتب أن الاختبار نجح إلا إذا تم تشغيله.

اختبر:
- build.
- typecheck.
- lint.
- unit tests.
- integration tests.
- route tests.
- Shell tests.
- Trace Drawer.
- Command Palette.
- Dataset import.
- Dataset versioning.
- Scorers.
- PII.
- Prompt Injection.
- Hallucination.
- Accuracy.
- Compliance mapping.
- Batch Run.
- Pause/resume.
- Partial Run.
- Provider failure.
- Scorer failure.
- A/B.
- Seed replay.
- variance classification.
- cost calculation.
- latency percentiles.
- budget stop.
- Certificate signing.
- Certificate tampering.
- Certificate verification.
- permissions.
- privacy.
- mobile.
- RTL.
- keyboard.
- screen reader.

السيناريو الإلزامي:
1. أنشئ Dataset من 100 حالة.
2. شغله على نموذج Demo أو Live واضح.
3. شغّل جميع Scorers.
4. أدخل حالة PII حرجة.
5. تأكد من Blocked.
6. أصلح Policy.
7. أعد التشغيل.
8. نفذ A/B.
9. تحقق من Seed.
10. احسب التكلفة والزمن.
11. أنشئ Certificate.
12. عدّل نسخة الشهادة يدوياً.
13. تأكد أن التحقق يفشل.
14. افتح Trace من كل صفحة مرتبطة.

أخرج:
- الاختبار.
- الأمر المستخدم.
- النتيجة.
- الفشل.
- سبب الفشل.
- الملفات المتأثرة.
- ما يحتاج إصلاحاً.
```

---

# Prompt 29: تنظيف وحذف الملفات القديمة

```text
نفّذ M30 بحذر.

ابحث عن:
- duplicate Shells.
- duplicate headers.
- duplicate CSS.
- duplicate types.
- duplicate mock data.
- unused components.
- unused routes.
- deprecated pages.
- old provider labels.
- obsolete milestones.
- old docs that conflict with the four source documents.

قبل الحذف:
1. أنشئ تقريراً لكل ملف.
2. تحقق من imports.
3. تحقق من dynamic imports.
4. تحقق من routes.
5. تحقق من tests.
6. تحقق من build.
7. حدد البديل.

لا تحذف:
- Evaluation Runs.
- Certificates.
- published Datasets.
- audit records.
- evidence files.
- routes عامة بدون redirect.
- أي شيء غير مؤكد.

استخدم deprecated أو migration layer أولاً إذا لزم.

بعد الحذف:
- شغّل build.
- شغّل tests.
- افحص routes.
- افحص internal links.
- افحص no horizontal overflow.
- حدّث CHANGELOG.
- أنشئ docs/kernel-migration-notes.md.
```

---

# Prompt 30: تقرير التسليم النهائي

```text
أنشئ تقرير تسليم نهائي شامل.

يجب أن يحتوي:

1. Executive summary.
2. حالة كل Milestone.
3. حالة كل صفحة من الصفحات الـ16.
4. routes النهائية.
5. الملفات الجديدة.
6. الملفات المعدلة.
7. الملفات المحذوفة مع السبب.
8. الملفات deprecated.
9. Design tokens.
10. Kernel Shell.
11. Trace architecture.
12. Evaluation Run architecture.
13. Dataset registry.
14. Saudi Benchmark.
15. Scorer registry.
16. Batch execution.
17. A/B comparison.
18. Seed/reproducibility.
19. cost/latency.
20. Evaluation Certificate.
21. compliance mapping.
22. security review.
23. privacy review.
24. accessibility review.
25. responsive QA.
26. tests and results.
27. known issues.
28. blocked items.
29. rollback plan.
30. runbook للمطور.
31. runbook لمسؤول الامتثال.
32. runbook للمدقق.
33. طريقة إنشاء Dataset.
34. طريقة تشغيل Evaluation.
35. طريقة قراءة الفشل.
36. طريقة التحقق من Certificate.
37. الخطوات التالية.

ممنوع استخدام:
- جاهز 100%.
- آمن 100%.
- متوافق بالكامل.
- تم تنفيذ كل شيء، بدون دليل.

استخدم:
- Done.
- Partial.
- Blocked.
- Not implemented.
- Demo only.
- Simulated.
- Requires backend.
- Requires provider credential.

أرفق مع التقرير:
- test output.
- screenshots أو روابط المعاينة إن كانت متاحة.
- migration notes.
- changelog.
- acceptance checklist.
```

---

## Prompt شامل لوكيل قادر على التنفيذ المتواصل

استخدمه فقط بعد تنفيذ Prompt 00 وPrompt 01:

```text
نفّذ المشروع كاملاً وفق المستندات الأربعة المرفقة:

- تقرير-صفحات-kernel.md
- تصميم-صفحات-kernel.md
- Evaluation-OS.md
- Evaluation-environment.md

يجب تنفيذ كل ما ورد فيها حرفياً، بما في ذلك:

- Kernel Shell.
- Design Tokens.
- Dark/Light mode.
- RTL.
- responsive layouts.
- accessibility.
- Trace Drawer.
- Command Palette.
- role-based navigation.
- Demo/Live transparency.
- 16 Kernel pages.
- 90-second incident story.
- Playground الكامل.
- datasets.
- Saudi Benchmark.
- scorers للدقة والهلوسة وPII والحقن والامتثال.
- single runs.
- batch runs.
- pause/resume.
- partial runs.
- A/B models.
- A/B prompts.
- A/B policies.
- seed.
- reproducibility.
- replay.
- cost.
- latency.
- P50/P95/P99.
- Evaluation Certificate.
- digital signature.
- hash verification.
- audit.
- approvals.
- evidence.
- reports.
- stats.
- models.
- connectors.
- API docs.
- Red Team sandbox.
- policy simulation.
- compliance controls.
- Saudi regulatory mapping.
- security and privacy.
- QA.
- cleanup.
- migration documentation.

نفّذ بالترتيب:
1. تحليل.
2. خطة.
3. Design System.
4. Shell.
5. Shared data/state.
6. Playground.
7. Evaluation engine.
8. Dataset.
9. Scorers.
10. Batch.
11. A/B.
12. Reproducibility.
13. Cost/latency.
14. Certificate.
15. الصفحات المتبقية.
16. integrations.
17. QA.
18. cleanup.
19. final report.

لا تتخطى أي عنصر. إذا كان العنصر غير ممكن بسبب غياب Backend أو Provider أو credential:
- لا تحذفه.
- أنشئ الواجهة والعقد والـtypes والـmock الآمن.
- ضع badge واضحاً: Requires backend أو Demo أو Simulated.
- سجله في التقرير النهائي.

لا تحذف أو تعدل بيانات تاريخية.
لا تضع secrets في الكود.
لا تعرض مزوداً غير حقيقي.
لا تدّعِ امتثالاً كاملاً.
لا تنتقل من Milestone إلى آخر قبل:
- تشغيل الاختبارات.
- عرض الملفات المتأثرة.
- عرض المشاكل.
- عرض معايير القبول.
- تسجيل حالة المرحلة.

في النهاية سلّم التطبيق، الاختبارات، الوثائق، CHANGELOG، migration notes، وخارطة الملفات والـroutes.
```

