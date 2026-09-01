# Ultimate Closing Prompts — Generated From Current Reality

عدد الوحدات نتج من findings الحالية: 4 software/verification prompts + 3 operator prompts + 1 final independent verification prompt = 8 prompts، مع 8 إجراءات يدوية مفصلة. لا يوجد claim أن أي prompt نُفذ.

## CP-01 — Secret exposure closure

@Superpowers @GitHub

اقرأ `.agents/mind/01-mind-latest.md` كاملًا، ثم افحص الواقع الحالي. اكتشف مهارات الأمن/الاختبار ذات الصلة واقرأ `SKILL.md` كاملًا. عالج credential المحلي في `.claude/settings.local.json` بدون طباعة القيمة أو نقلها للكود أو git. أضف فحصًا يمنع credentials في tracked artifacts إن لم يوجد بديل. تحقق بـsecurity hygiene و`git diff --check`. لا commit ولا push ولا deploy، وحدّث mind.

## CP-02 — Acceptance gate reproducibility

@Superpowers @GitHub

اقرأ mind، افحص `test-manifest.mjs` و`e2e-acceptance.mjs` وكل suite. استخدم مهارات Astro/testing/accessibility المناسبة بعد قراءتها كاملة. شغّل `test:manifest` ثم `e2e:acceptance` في runner يستطيع bind localhost. إذا فشل، أصلح السبب الجذري فقط ولا تضعف assertions. يجب توثيق final aggregate، عدد suites/assertions، logs وexit code. لا commit/push/deploy. حدّث mind.

## CP-03 — Documentation governance alignment

@Superpowers @GitHub

اقرأ mind، ثم حدّث فقط الوثائق التي تقول إن عدد المهارات 67 ليطابق الجرد الحالي 365، مع الحفاظ على مصدر العدد القابل لإعادة الحساب. لا تغير skill contents أو التطبيق. تحقق أن `skills-lock.json` يبقى 365/365 exact وأن `test:manifest` يمر. لا commit/push/deploy. حدّث mind.

## CP-04 — Controlled-source and operational readiness

@Superpowers @GitHub

لا تخترع WI pages 2/3 أو 3/3، ولا تغير سياسة المعايرة بدون قرار مكتوب. بعد توريد المصدر المضبوط، افحص provenance والتعارضات والهجرة والـUI والتصدير والتدقيق. ثم نفّذ staging deployment، persistent SQLite path، backup/restore drill، health/readiness، restart persistence، وRBAC smoke journeys. كل نتيجة تحتاج evidence جديد. لا production mutation إلا بموافقة operator، ولا commit/push/deploy بواسطة الوكيل.

## OP-01 — Human UAT

نفّذ `PILOT-UAT.md` مع موظفي QC الحقيقيين، لكل دور admin/manager/supervisor/employee. سجل success، time، assistance، errors، recovery، confusion، comments، وscreen-reader/keyboard observations. automated tests لا تُحسب UAT. ارفع النتائج كوثيقة موقعة.

## OP-02 — Credential rotation

مالك البيئة يلغي credential المحلي الذي اكتُشف، يصدر بديلًا من secret manager، ينظف الملف المحلي/history حسب سياسة الشركة، ثم يثبت scan نظيفًا. لا تُرسل القيمة للوكيل ولا تسجلها في mind.

## OP-03 — Live deployment and restore drill

مشغل الاستضافة ينشر الخدمة يدويًا حسب `DEPLOYMENT.md` مع persistent disk وsingle instance، ثم يثبت health/readiness، schema version، backup، restore، restart persistence، وlogs بلا أسرار. وجود workflow وحده ليس evidence نشر.

## CG-01 — Final independent verification

بعد إغلاق كل الوحدات، تجاهل كل completion claims. جمّد HEAD/status، أعد جرد files/routes/tables/migrations/tests/E2E/skills، شغّل typecheck/build/full canonical test gate، acceptance aggregate، DB doctor، parity/schema reference، security/CSRF/CSP/RBAC، backup/restore، accessibility automated، responsive/zoom، reporting، ثم افحص staging/live evidence وUAT. احسب النسب من الأدلة الجديدة، وطابق كل finding بالمصفوفة. verdict الوحيد: GO أو CONDITIONAL GO أو NO-GO. إذا ظهر عيب جديد، أنشئ prompt مستقل له. لا commit/push/deploy.

## Traceability

| Finding | Closure | Verification |
|---|---|---|
| P1-001 local credential | CP-01 + OP-02 | secret scan + rotation evidence |
| P1-002 acceptance not finally evidenced | CP-02 | final E2E exit 0 + aggregate |
| P2-001 human UAT absent | OP-01 | signed role-based UAT |
| P2-002 no live deployment | CP-04 + OP-03 | health + restore |
| P2-003 67/365 drift | CP-03 | docs grep + lock verifier |
| P2-004 WI source absent | CP-04 + source owner | provenance and catalog tests |
| P3-001 hints | backlog | typecheck decision |
| P3-002 Vite warnings | backlog | clean build or rationale |
| P3-003 suggestions ownership | owner decision | route contract decision |

## Dependency Graph

`OP-02 → CP-01`; `CP-02` and `CP-03` independent; `CP-04 → OP-03`; `OP-01` requires staging; `CG-01` last.
