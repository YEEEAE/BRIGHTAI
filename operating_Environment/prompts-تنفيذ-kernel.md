تمام. هذه نسخة جديدة من **Prompts تنفيذية شاملة**، مرتبة بحيث ينفذ الوكيل المشروع كاملاً وفق المستندات الأربعة **بدون إسقاط أي نقطة**:

1. `تقرير-صفحات-kernel.md`
2. `تصميم-صفحات-kernel.md`
3. `Evaluation-OS.md`
4. `Evaluation-environment.md`

أرفق الملفات الأربعة مع **كل Prompt**، ولا تجعل الوكيل ينتقل للمرحلة التالية قبل تقديم تقرير تحقق من المرحلة الحالية.

---

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

