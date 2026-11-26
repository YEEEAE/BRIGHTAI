# P03 — Kernel Agent Runtime وأساس API (2026-11-26)

## النطاق المنفَّذ
- ملفات جديدة تحت `src/server/agents/`: `contracts.mjs` (حالات/انتقالات/حدود/ manifests/ handoffs/ outbox)، `repository.mjs` (مهايئ P02 Postgres ومهايئ ذاكرة للاختبار)، `runtime.mjs` (دورة run/step/tool، إلغاء/مهلة/حد خطوات، فحص سياسة لكل خطوة، Human Gate pause/resume، أدلة Kernel وoutbox ذريين)، `tool-executor.mjs` (allowlist + فحص سياسة قبل/بعد + مخططات رسائل ونتائج)، `orchestrator.mjs` (خطة متعددة الوكلاء بصلاحية مستقلة لكل منتج)، `http.mjs` و`instance.mjs`.
- نقاط فعلية تحت `src/pages/app/api/agents/`: إنشاء/قراءة تشغيل، خطوة، استئناف، إلغاء، إعادة إرسال outbox، وتنفيذ خطة. سُجّلت في `routes.mjs` مع HEAD تلقائيًا، و`boundary.mjs` مع مفاتيح idempotency، ومخططات الطلب/الاستجابة.
- الهوية والمؤسسة والصلاحية والسياسة والأدلة من Kernel الحالي: `tenantGuard`، `requireProductAccess`، `evaluateKernelPolicy`، `audit` + `recordKernelAuditEvidence`؛ لا بناء هوية موازٍ ولا تمرير أسرار أو سياق مؤسسة أخرى في handoff.

## الأدلة المحلية (HEAD b0d6f77a + تعديلات working tree)
- `node --test tests/agent-runtime.test.mjs`: 15/15 PASS — يغطي idempotency، رفض handoff الأجنبي/القديم، فشل الدليل يلغي التشغيل والحدث، إعادة فحص السياسة، allowlist، انقطاع المزود، REQUEST_APPROVAL، pause/resume، الإلغاء، حد الخطوات، outbox retry/dead، سحب الإتاحة، وتعدد الوكلاء.
- `npm run build`: PASS (Astro 7.4.13 / Node 22.23.5) — 67 صفحة عامة.
- `node --test tests/api-contract.test.mjs`: 194/194 PASS بعد إعادة البناء — كل method مسجّل مع correlation/HEAD/OPTIONS/404/400/405/idempotency/مخطط الجسم، منها 7 طرق agent جديدة.

## حدود الدليل وقرار المعايير
- BE-01 / BE-03 / BE-04 / BE-08 / KE-01 / KE-02 / KE-03 / KE-04: **PASS محليًا** على العقد والمنطق والـHTTP؛ **PASS_VERIFIED في البيئة المطلوبة NOT VERIFIED**: لا إذن نشر، لا Staging/Production، لا `DATABASE_URL` معتمدة للتحقق من مسار Postgres/RLS، ولا موصل outbox مُهيأ.
- مهايئ Postgres مبني على جداول 0047 و`transaction`، لكنه لم يُختبر ضد Neon؛ اختبارات الذاكرة تختبر منطق Runtime لا SQL الفعلي.
- `kernelApproval` يتحقق من طلب Human Gate وقرار APPROVE وعدم انتهاء الصلاحية ومطابقة البصمة؛ المسار الكامل على قاعدة معتمدة لم يُختبر هنا.
- لا توجد كتابة على Staging/Production، ولا نشر، ولا استخدام لمزود مدفوع، ولا أسرار في السجلات أو الملفات.

## مؤجل صريحًا
- P20: عزل الذاكرة وسياسة الاحتفاظ الكاملة؛ P21: outbox dispatch حقيقي وتكامل المنتجات؛ P23: workbench/SDK. لم يُنفَّذ هنا عمل هذه المراحل.
