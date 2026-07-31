تمام. هذه نسخة جديدة من **Prompts تنفيذية شاملة**، مرتبة بحيث ينفذ الوكيل المشروع كاملاً وفق المستندات الأربعة **بدون إسقاط أي نقطة**:

1. `تقرير-صفحات-kernel.md`
2. `تصميم-صفحات-kernel.md`
3. `Evaluation-OS.md`
4. `Evaluation-environment.md`

أرفق الملفات الأربعة مع **كل Prompt**، ولا تجعل الوكيل ينتقل للمرحلة التالية قبل تقديم تقرير تحقق من المرحلة الحالية.

---


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

