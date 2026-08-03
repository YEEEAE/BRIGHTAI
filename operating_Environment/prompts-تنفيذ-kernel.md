تمام. هذه نسخة جديدة من **Prompts تنفيذية شاملة**، مرتبة بحيث ينفذ الوكيل المشروع كاملاً وفق المستندات الأربعة **بدون إسقاط أي نقطة**:

1. `تقرير-صفحات-kernel.md`
2. `تصميم-صفحات-kernel.md`
3. `Evaluation-OS.md`
4. `Evaluation-environment.md`

أرفق الملفات الأربعة مع **كل Prompt**، ولا تجعل الوكيل ينتقل للمرحلة التالية قبل تقديم تقرير تحقق من المرحلة الحالية.

---


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

