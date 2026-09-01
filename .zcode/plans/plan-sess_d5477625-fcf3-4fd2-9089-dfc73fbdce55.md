# QC-100-ARCHITECTURE-002 — خطة الوصول لإثبات معماري 100%

المرجع: مخرجات PROMPT 00 المجمّدة (`audit/qc/QC-Task-Manager/100-PERCENT-*.md` — scorecard 125/173، typecheck ‏0/0/27 hints، 116 route، 65 suite + 28 E2E). التدقيق الثلاثي (3 وكلاء متوازيين) أنتج أدلة بـ file:line لكل بند من قائمة التدقيق المطلوبة.

## المرحلة 0 — REPORT3.md (أول تسليم، طلبك المباشر)
إنشاء `audit/qc/QC-Task-Manager/REPORT3.md` (بنمط REPORT.md/REPORT2.md): توثيق كامل لنتائج الوكلاء الثلاثة — كل بند من قائمة التدقيق (ملفات ضخمة، تكرار منطق/صلاحيات/تحقق، دورات استيراد، coupling خفي، كود ميت، مسارات يتيمة، ثوابت مكررة، magic values، عقود API غير متسقة، casts و any، promises غير معالجة، business rules في UI، SQL في الصفحات) مع أدلة file:line، جدول المقاييس الحالية (قبل)، ومصفوفة أولويات الإصلاح P1/P2/P3 مع حالة كل بند (يُصلح / يُوثّق justified).

## المرحلة 1 — baseline طازج قبل التنفيذ
تشغيل: `astro check` (تسجيل قائمة الـ27 hints كاملة)، `NODE_ENV=production pnpm build` (تسجيل تحذيري Vite حرفيًا)، `test:architecture`، `pnpm test` (65)، `test:route-manifest`، `verify-security-hygiene`. الأرقام تُسجّل في REPORT3.md كمقاييس "قبل".

## المرحلة 2 — الإصلاحات بالأدلة (Preserve behavior — TDD حيث يتغير السلوك)

**A. حذف الكود الميت (مؤكد بصفر مراجع — موافقتك صريحة):**
- حذف `src/pages/api/tasks/suggestions.ts` (مسار GET يتيم + فيه `as any`) — عدد المسارات 116→115 يثبت بالـroute-manifest.
- حذف `scripts/smoke-task-detail.mjs`. تصنيف `smoke-ai-live.mjs` و`ui-screenshots.mjs` كـ manual-diagnostic في `TEST_SCRIPT_CLASSIFICATIONS` (مرجعة في docs — لا تُحذف)، وإضافة أمر `test:security-hygiene` لـpackage.json.
- حذف الصادرات الميتة: `auth.ts:requireRole`، صادرات `systemHealth.ts` غير المستوردة، صادرات `backup-scheduler.ts` الخمس، أنواع `searchExport.ts` الداخلية، `seed.ts:isUsersEmpty`، `lab/seed.ts: EQUIPMENT_SEED_ROWS/LabEquipmentSeedRow`.

**B. توحيد سلطة الصلاحيات (صفر duplicated permission authority):**
- إسقاط `canApproveFinding` المكرر في `findings/index.ts:36` لمصدر `permissions.ts`.
- رفع قاعدة إنشاء الـretest من `lab/retests/new.astro:22` إلى predicate في `permissions.ts`.
- نقل row-authorization من `lab/tests/[id].astro:58` و`print.astro:34` إلى helper في `lib/lab/tests.ts`.

**C. توحيد employee-scope SQL (منسوخ 13 مرة):**
- وحدة جديدة `src/lib/scope.ts` بـSQL fragment وحيد + helper للربط، وتحويل 9 modules + 3 صفحات عليها (taskSearch، export، reporting/scope، notifications، lab/{search,overview,testSearch,calendar,scan,documents,retests}، employee/index).

**D. توحيد الـpagination/الفلترة (ثلاث أطر متوازية):**
- `src/lib/pagination.ts`: `PER_PAGE_OPTIONS`, `DEFAULT_PER_PAGE`, `isPerPage`, `mergeWheres`, `orderClause` — تستهلكها taskSearch + lab/testSearch + lab/search + lab/review + 12 سجلًا (يُلغي 24 نسخة مكررة). نفس السلوك حرفيًا.

**E. إخراج SQL من الصفحات (DB logic leaking into pages):**
- توحيد manager/index + supervisor/index (SQL توأم copy-paste) في service واحد بـlib.
- نقل SQL من employee/index، findings/index، admin/users/index إلى lib (dashboard/findings/users).
- حارس جديد: ممنوع `getDb` داخل src/pages (بعد الترحيل).

**F. توحيد عقود API (سلوكي → TDD أولاً):**
- العقد: نجاح `{ok:true,...}`، خطأ `{ok:false,error,code}` + no-store عبر `apiJsonError`.
- اختبار عقود جديد `scripts/test-api-contract.mjs` يُكتب أولاً (أحمر) ثم ترحيل 15 helper محلي `json()` داخل `api/tasks/[id]/*` و`findings` و`notifications` و`suggestions`... (استثناءات موثقة: health، readiness، endpoints الثنائية CSV/XLSX/PDF، endpoints الـflash+redirect).
- إصلاح `findings/[id].ts` catch-all 400 → 500 بكود DB، وتحويل plain-text responses في `capa/evidence/rca.ts` إلى JSON موحد.
- تسجيل `test:api-contract` في manifest (65→66 suites).

**G. Type Safety — 0/0/0:**
- إصلاح كل hint من قائمة astro check (unused imports/params غالبًا).
- إزالة `any`/`as any` في workflows/engine.ts، sla/engine.ts، assignment.ts (استبدال بأنواع صفوف صريحة)؛ تقليص non-null `!` حيث آمن. الـ~393 cast عند حدود better-sqlite3 تبقى (موثقة كنمط مقصود)، والهدف الرقمي 0 errors/0 warnings/0 actionable hints.

**H. Vite warnings:**
- إزالة الاستيراد الديناميكي المكرر ساكنًا في `tasks.ts:418` و`lab/review.ts:459` و`lab/testSearch.ts:541`.
- تجربة تحويل `import('./db')`/`import('../validation')` إلى static (الـloader يتكفل بـ?raw) — إن نجحت الاختبارات تختفي التحذيرات ويُغلق PERF-001؛ وإلا تُوثّق justification رسمي (قيد test-runner) في ملف الأدلة.

**I. Magic values:** `BCRYPT_ROUNDS` (6 مواضع)، ثابت 90-day purge في db.ts، توحيد PER_PAGE (بند D).

**J. فصل عند الشقوق الآمنة (قرارك):**
- تفكيك `taskUpdates.ts` (1,556) إلى مجلد `taskUpdates/` بملفات فرعية (progress/comments, checklist, lifecycle, attachments) مع `index.ts` يعيد التصدير — الواجهة العامة unchanged.
- `lab/documents.ts`, `lab/tests.ts`, `validation.ts`: توثيق ملكية وحجم في ARCHITECTURE.md (validation.ts مبرر: hub schemas).
- نقل business rules من الصفحات/UI إلى lib (TDD): delete-request eligibility (tasks/[id]:150)، evidence coverage (tasks/[id]:140 + تكرارها في TaskLifecycle.tsx عبر استيراد task-policy النقي)، immutable rule، fail-rate≥50، overdue-as-SQL (ضمن E).

**K. إصلاحات مصاحبة:** ازدواجية إنشاء request-id في middleware (وحدة واحدة)، ربط خرائط labels المكررة بالوحدات المشتركة الموجودة (RETEST_REASON_LABELS، LAB_DOCUMENT_STATUS_LABELS، TEST_RESULT_TONE في نفس الملف، attentionTone×3)، تسجيلات console.error في catch blocks الـ10 بالـTSX بدون تغيير رسائل المستخدم.

## المرحلة 3 — تقوية architecture-guard.mjs (يبقى dependency-free)
قواعد جديدة: (1) منع scope-SQL خارج scope.ts، (2) منع getDb في src/pages، (3) إلزام apiJsonError في كل api (allowlist موثق)، (4) منع تعريف canApproveFinding خارج permissions.ts، (5) حارس orphan-route: كل api/*.ts له مرجع، (6) منع local `json(` helpers في api. الهدف: `test:architecture` = PASS يحرس الحالة 100% دائمًا.

## المرحلة 4 — التوثيق
- تحديث `docs/ARCHITECTURE.md` (+ QC-LAB-ARCHITECTURE.md): خريطة ملكية الوحدات، scope.ts، عقد API الموحد، فك دورات changeRequests (inversion عبر sink module)، حل PERF-001.
- إنشاء `audit/qc/QC-Task-Manager/ARCHITECTURE-100-EVIDENCE.md`: كل هدف صلب مقابل أمر التحقق ومخرجه الفعلي + جدول المقاييس قبل/بعد + البنود الموثقة justified.

## المرحلة 5 — التحقق النهائي (كلها باغات صفر)
`astro check` (0/0/0) · `NODE_ENV=production pnpm build` (clean أو تحذيرات موثقة justification) · `test:architecture` PASS · `test:route-manifest` · `test:manifest` (66) · `pnpm test` كامل · `e2e:acceptance` كامل (runner يسمح بـlocalhost — 30/30) · `test:api-contract` · `verify-security-hygiene` · `git diff --check`. ثم تحديث `.agents/mind/01-mind-latest.md` بسجل منظم + ledger (القاعدة 3).

## المقاييس قبل/بعد (الهدف)
| مقياس | قبل | بعد |
|---|---|---|
| typecheck errors/warnings/hints | 0/0/27 | 0/0/0 |
| Vite import warnings | 2 | 0 أو موثقة |
| duplicated permission authority | canApproveFinding×2 + 55 سطر قرار | 0 |
| scope-SQL مكرر | 13 | 1 |
| كود ميت (unexplained) | 1 مسار + 1 سكربت + ~14 صادرة | 0 |
| SQL داخل صفحات | 17 statement في 5 صفحات | 0 |
| أي error contract خارج العقد | 21 ملف | 0 (استثناءات موثقة) |
| architecture guard rules | 5 | 11 |
| suites canonical | 65 | 66 |

## قيود صارمة
لا `git push` ولا `git commit` (عليك أنت) · لا لمس `.env*` ولا `.github/workflows` · لا تغيير RBAC/workflows/DB schema · الحذفان المعتمدان فقط: `api/tasks/suggestions.ts` و`smoke-task-detail.mjs` + الصادرات الميتة المذكورة · أي فشل تحقق = إصلاح جذري أو إفصاح صريح، بدون تجميل.