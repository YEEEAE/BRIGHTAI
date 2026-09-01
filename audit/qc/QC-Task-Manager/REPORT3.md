# REPORT3 — التدقيق المعماري الشامل (QC-100-ARCHITECTURE-002)

> **المهمة:** QC-100-ARCHITECTURE-002 — رفع Architecture / Code Quality / Maintainability / Separation of Concerns / Dependency Boundaries / Type Safety / Error Handling إلى إثبات مدعوم بالأدلة 100%.
> **النطاق:** `apps/qc-task-manager/` كاملًا.
> **الطريقة:** ثلاثة وكلاء تدقيق متوازيين (lib+middleware+TSX / pages+API+layouts / guards+configs+baseline) + تشغيل بوابات تحقق طازجة.
> **المرجع المجمّد:** مخرجات PROMPT 00 — `100-PERCENT-BASELINE.md` / `100-PERCENT-GAP-MATRIX.md` / `100-PERCENT-EVIDENCE-MATRIX.md` (HEAD `05ae8fbab78e`, scorecard 125/173).
> **التاريخ:** 2026-09-02 · **الحالة وقت التدقيق:** شجرة نظيفة على `main`.

---

## 1. المقاييس الفعلية "قبل" (بوابات طازجة وقت هذا التقرير)

| البوابة | النتيجة | الدليل |
|---|---|---|
| `astro check` | **0 errors / 0 warnings / 27 hints** | قائمة الـ27 hints كاملة في §2.1 |
| `NODE_ENV=production astro build` | **exit 0** + **تحذيرا Vite** (db.ts / validation.ts) | §2.2 |
| `test:route-manifest` | PASS — **116 file routes / 25 middleware routes / 6 guards** | مخرج مباشر |
| `architecture-guard.mjs` | PASS (5 قواعد) | مخرج مباشر |
| `verify-security-hygiene.mjs` | PASS | مخرج مباشر |
| `pnpm test` (65 canonical suites) | PASS (سجل كامل في `/tmp/qc-arch-002/full-tests-before.log`) | مخرج مباشر |
| `e2e:acceptance` | 30/30 · 3059+ assertions (مثبت طازجًا في baseline PROMPT 00 بتاريخ 2026-09-02) | `100-PERCENT-BASELINE.md` |

### 2.1 قائمة الـ27 hint كاملة (astro check)

**lib (10):**
1. `src/lib/db.ts:395` — `receiver` unused
2. `src/lib/pdf.ts:176` — `pageLines` unused
3. `src/lib/taskUpdates.ts:1038` — `skipEvidence` unused
4. `src/lib/taskUpdates.ts:51` — `TASK_RECURRENCES` unused
5. `src/lib/taskUpdates.ts:47` — `MAX_OVERRIDE_REASON_LENGTH` unused
6. `src/lib/taskUpdates.ts:35` — `ALLOWED_EXTENSIONS` unused
7. `src/lib/templatesStore.ts:225` — `actorId` unused
8. `src/lib/lab/dashboard.ts:348` — `db` unused
9. `src/lib/lab/review.ts:628` — `testNumber` unused
10. `src/lib/reporting/scope.ts:4` — `filters` unused

**مكونات TSX (3):**
11. `src/components/ReviewDeleteRequestDialog.tsx:27` — `taskId` unused
12. `src/components/TaskUpdatePanel.tsx:230` — `checked` unused
13. `src/components/lab/LabTestForm.tsx:350` — `returnValue` deprecated

**صفحات/layots (12):**
14–15. `src/layouts/BaseLayout.astro:40,41` — astro(4000): سكربت بسمات يُعامل `is:inline` ضمنيًا (×2)
16. `src/pages/login.astro:7` — `roleHome` unused
17. `src/pages/admin/index.astro:3` — `roleHome` unused
18. `src/pages/employee/new.astro:14` — `roleHome` unused
19. `src/pages/lab/index.astro:85` — `documentsInReview` unused
20. `src/pages/lab/index.astro:77` — `ownedWIContent` unused
21. `src/pages/lab/index.astro:76` — `returnedTests` unused
22. `src/pages/lab/calibration/[id].astro:12` — `LabCalibrationStatus` unused (type)
23. `src/pages/lab/documents/[id].astro:29` — `LabDocumentType` unused (type)
24. `src/pages/lab/equipment/[id].astro:17` — `LabCalibrationStatus` unused (type)
25. `src/pages/lab/equipment/index.astro:30` — `canProposeLabEquipmentCreate` unused
26. `src/pages/lab/products/index.astro:26` — `canProposeLabProductCreate` unused
27. `src/pages/manager/workload.astro:8` — ts(80007): `await` بلا أثر على نوع التعبير

**لا توجد قائمة موثقة سابقة لهذه الـhints في أي مكان بالمستودع** — العدّاد فقط كان يتنقل بين التقارير (17/24/26/27). هذا التقرير أول توثيق كامل لهم.

### 2.2 تحذيرا Vite الحرفيان

```
(!) src/lib/db.ts is dynamically imported by src/lib/tasks.ts but also statically
    imported by 22 files ... dynamic import will not move module into another chunk.
(!) src/lib/validation.ts is dynamically imported by 10 lab modules
    (acknowledgements, calibration, changeRequests ×2, documents, equipment,
    findingLinks ×2, products, retests, templates) but also statically imported by
    auth.ts, changeRequests.ts, tests.ts, session.ts, tasks.ts.
```

**الجذر:** `migrationRegistry.ts:22+` يستورد 39 ملف هجرة بـ`?raw` (تحويل Vite فقط)، و`db.ts` يستورد `EMBEDDED_MIGRATIONS` منه — لذلك `db.ts` **غير قابل للتحميل في Node العادي** (`--experimental-strip-types`). الوحدات التي تُستورد من سكربتات Node المباشرة (taskSearch.ts:587، export.ts:90، pdfData.ts، lab/testSearch.ts:541) تستخدم `import('./db')` كسول **عمدًا** لهذا السبب (التعليق في taskSearch.ts:580-582). هذه الديناميكية load-bearing ولا تنتج تحذيرًا.

**التحذيران إذن ناتجان عن ديناميكيات زائدة فقط:** `tasks.ts:418` (يستورد db ساكنًا في السطر 16 وديناميكيًا في 418) و10 وحدات lab تستورد validation ديناميكيًا رغم أنها كلها تستورد db **ساكنًا** أصلًا (تحقق: static_db_imports=1 لكل المهن التسع) — أي التحويل إلى static لا يغيّر قابلية التحميل في أي سياق. راجع PERF-001 في `docs/FULL-ARCHITECTURE-UI-UX-REVIEW.md:202` — هذا التقرير يغلقها.

---

## 3. النتائج حسب بنود التدقيق المطلوبة (أدلة file:line)

### 3.1 الملفات الضخمة (Oversized files)

| الملف | الأسطر | المسؤوليات المدمجة |
|---|---|---|
| `src/lib/reporting/writers/fonts/fontData.ts` | 3,152 | blob خط base64 مضمّن (بيانات لا منطق) |
| `src/lib/taskUpdates.ts` | 1,556 | update+close+cancel+reopen+attachments+checklist+workflow+SLA+recurrence |
| `src/lib/lab/documents.ts` | 1,553 | وثائق + إصدارات + محتوى + إقرارات |
| `src/components/lab/LabTestForm.tsx` | 1,406 | نموذج 8 أقسام + شبكة عينات + validateSubmit |
| `src/lib/validation.ts` | 1,359 | ~45 schema zod (hub مقصود) |
| `src/lib/lab/tests.ts` | 1,191 | دورة حياة الاختبار كاملة |
| `src/lib/dashboard.ts` | 1,114 | 13+ استعلام KPI + نماذج عرض |
| `src/pages/dashboard.astro` | 852 | فلترة + 13 استعلام + بناء 18 بطاقة KPI + سكربت عميل |
| `src/pages/tasks/[id].astro` | 763 | 12 تحميل بيانات + قواعد أهلية + خرائط أيقونات/نغمات |
| `src/pages/lab/tests/[id].astro` | 754 | scope + immutability + QR + خرائط labels |
| `src/components/TaskLifecycle.tsx` | 799 | wizard الإغلاق + evidence gate (مكرر مع السيرفر) |

مجموع `src/pages`+`src/layouts`: 17,006 سطرًا في 116 مسارًا.

### 3.2 المنطق المكرر (Duplicated logic)

1. **ثلاثة أطر بحث/ترقيم متوازية:** `lib/taskSearch.ts` (683) — `lib/lab/testSearch.ts` (578، يعلن بنفسه في السطر 3: "Mirrors src/lib/taskSearch.ts exactly") — `lib/lab/search.ts` (628).
2. **`mergeWheres` مكرر حرفيًا:** taskSearch.ts:548-559 ≡ lab/testSearch.ts:467-479.
3. **`orderClause` مكرر:** taskSearch.ts:464-469 ≡ testSearch.ts:422-427 (بنفس تعليق tiebreaker).
4. **`scopeClause` مكرر 4×:** taskSearch.ts:442-448 ≡ testSearch.ts:397-403 ≡ lab/overview.ts:40-46 (يعلن "mirror") ≡ lab/search.ts:192.
5. **`isPerPage` مكرر 3×:** taskSearch.ts:156، testSearch.ts:149، lab/review.ts:214.
6. **خيار الترقيم `[10,25,50,100]` مُصدَّر 14 مرة** في lib + hardcoded في `lab/tests/review.astro:296` (يتجاهل `LAB_REVIEW_PER_PAGE_OPTIONS` الخاصة به!) و`DEFAULT_*_PER_PAGE = 25` ×13.
7. **SQL مدير/مشرف توأم copy-paste:** `manager/index.astro:23-51` ≡ `supervisor/index.astro:23-51` (diff = ترتيب تعليقات فقط).
8. **aiQcContext.ts (63) ≈ lab/aiContext.ts (158)** — بنايا سياق AI اثنتان بقواعد scope مختلفتين.
9. **ثلاث خرائط presentation للحالات:** lib/format.ts:111-137، components/ui/statusTones.ts، lib/dashboard.ts:38-44 (STATUS_COLORS).

### 3.3 الصلاحيات المكررة (Duplicated authorization) — الخطر الأعلى

- **`canApproveFinding` معرّف مرتين بجسمين مستقلين:** `lib/permissions.ts:165-167` و`lib/findings/index.ts:36-38` — المتصلون يستوردون من مصدرين مختلفين (findings/[id].astro من permissions؛ findings/index.astro من findings).
- **`requireRole` في auth.ts:366-372 — صفر مستدعين في كل المستودع** (helper صلاحيات ميت).
- **قاعدة إنشاء retest موجودة في الصفحة فقط وليست في permissions.ts:** `lab/retests/new.astro:22` — `if (!canCreateLabRetest(role) && role !== 'employee')`.
- **row-authorization محسوبة داخل الصفحات:** `lab/tests/[id].astro:58-59` و`print.astro:34-35` (`isOwn = role === 'employee' && (testedBy === userId || createdBy === userId)`).
- **~55 سطر قرار دور خارج permissions.ts في 24 ملفًا**، أبرزها: workflows/engine.ts:62-66 (`canAct`)، sla/engine.ts:122-133، taskDetails.ts:36-38، notifications.ts:434-440، reporting/{scope,authorization}.ts، tasks.ts:335-339.
- **employee-scope SQL منسوخ يدويًا 13 مرة:** `(t.assigned_to = ? OR t.created_by = ?)` في notifications.ts:437، taskSearch.ts:444، export.ts:94، reporting/scope.ts:19، **pages/employee/index.astro:41 (SQL خام داخل صفحة!)**؛ والمتغير `(t.tested_by = ? OR t.created_by = ?)` في lab/search.ts:192، lab/overview.ts:42، lab/calendar.ts، lab/testSearch.ts:399.
- إيجابي: 67 ملف API يستدعي predicates من permissions؛ 34/34 endpoint مصادق يستخدم `requireApiUser` (الاستثناءان الموثقان health/readiness).

### 3.4 التحقق المكرر (Duplicated validation)

- `validation.ts` هو المركز (~45 schema) لكن تنجو منه جيوب يدوية: taskUpdates.ts:504 (progress 0–100) و:777 (طول 200)، lab/tests.ts:388 **و755 (نفس فحص template_version_id مرتين في نفس الملف)**، equipment.ts:119.
- zod hubs ثانوية معزولة: ai/schemas.ts، uxTelemetry.ts:26-40.
- قواعد السيرفر مُعاد ترميزها في العميل: TaskUpdatePanel.tsx:183-184 (نفس رسالة progress حرفيًا)، LabTestForm.tsx:517-533 (validateSubmit يعيد قواعد labTestFormSchema).
- `findings/[id].ts:15` يستخدم `Object.fromEntries(formData)` يدويًا بدل `parseFormData` المشترك.

### 3.5 الدورات الاستيرادية (Circular dependencies) — 6 دورات حقيقية من 399 ضلع

1. `lab/changeRequests ↔ lab/equipment` (changeRequests.ts:21 ↔ equipment.ts:27)
2. `lab/changeRequests ↔ lab/products` (↔ products.ts:25)
3. `lab/changeRequests ↔ lab/calibration` (↔ calibration.ts:33)
4. `lab/changeRequests ↔ lab/retests` (↔ retests.ts:25)
5. `lab/labReports ↔ lab/retention` (ضلع واحد type-only)
6. `task-policy ↔ types` (ضلعان type-level)

النمط: changeRequests hub يستورد 4 منشئين siblings، وكلهم ينادون فيه لرفع change requests تلقائيًا. (لا يوجد أي استيراد من lib إلى src/pages أو src/components — الاتجاه نظيف هناك.)

### 3.6 الـCoupling الخفي وعدم وضوح الملكية

- **middleware.ts (383 سطرًا) هو mega-router فعلي:** ~20 regex POST dispatch (:204-346)، CSP hashes يدوية (:60-95)، جدار 405 بقائمة مسارات يدوية `ENDPOINT_PAGE_PATHS` (:357) يجب مزامنتها يدويًا مع شجرة الصفحات، تسجيل JSON (:367-382)، جدران أدوار (:155-197).
- **إنشاء request-id مزدوج كل طلب:** middleware.ts:109 (داخلي) + :369 (الغلاف).
- **lib ↔ lib/lab ثنائية الاتجاه بلا قاعدة حارسة:** db.ts:30,37 يستورد lab/seed وlab/wiCatalog؛ validation.ts:53 يستورد lab/policy؛ reporting/* يستورد lab/*؛ و8+ صفحات تستورد من الشجرتين معًا.
- **جلستان لنفس الكوكي:** auth.ts:357 `getSessionUser(request)` مقابل session.ts:42 `getCurrentUser(context)`.
- **BaseLayout.astro:26-31** يشغّل `countNotifications` + `listPersistedNotifications(userId, 8)` في **كل** render مصادق (بشع navbar bell) — قرار مقصود لكنه غير موثق كعقد.

### 3.7 الكود الميت (Dead code)

- **مسار API يتيم مؤكد:** `src/pages/api/tasks/suggestions.ts` (14 سطرًا، GET) — صفر مراجع في src/public/scripts؛ ميزة الاقتراحات الفعلية تستخدم `/api/lab/search-suggest` (8 مُحيلين + سكربتا اختبار).
- **سكربت ميت:** `scripts/smoke-task-detail.mjs` — غير مسجل في package.json ولا أي registry، غير مرئي حتى لحارس الـmanifest (نمط اسمه لا يطابق `test-*`/`e2e-*`).
- **~20 صادرة مُعلنة بلا مستورد (بعد تحقق سطر-بسطر، وصُححت نسبةً لتقرير الوكيل):**
  - مؤكدة ميتة: `auth.ts:requireRole` (صفر مستدعين)؛ `systemHealth.ts` — صادرات `safeDatabasePath/fileSize/getDiskHealth/applicationIdentity` (تُستخدم داخليًا فقط — تُلغى كلمة export مع بقاء الدوال)؛ `backup-scheduler.ts:schedulerOptionsForDatabase` (دالة كاملة بلا مستدعين — تُحذف مع استيرادها `configuredBackupDirectory`)؛ `searchExport.ts` — `ExportColumn/ExportCellMap/SEARCH_EXPORT_COLUMNS/searchRowToCells` (داخلية فقط؛ المُصدَّرة الفعلية searchRowsToCsv/Xlsx تبقى)؛ `seed.ts:isUsersEmpty` (داخليًا فقط).
  - **مُبرَّأة من قائمة الموت بعد التحقق (كانت خاطئة في تقرير الوكيل):** `backup-scheduler.ts` — `getNextScheduledBackupAt/getRiyadhDateKey/shouldRunBackupCatchup/stopBackupScheduler` تستخدمها `scripts/test.mjs:32-36,775-792`؛ `observability.ts:ERROR_CODES` تستخدمها `test-observability.mjs:9,15`؛ `lab/seed.ts:EQUIPMENT_SEED_ROWS/LabEquipmentSeedRow` تستخدمها `test-lab-equipment.mjs:93`؛ `flash.ts:Flash` نوع عام في توقيع `consumeFlash/setFlash`؛ `observability.ts:RequestLogInput` نوع توقيع `createRequestLog`.
- **سكربتات غير مسجلة لكنها مُحالة في الوثائق (لا تُحذف):** smoke-ai-live.mjs (PILOT-IMPLEMENTATION-STATUS.md:57)، ui-screenshots.mjs (UI-UX-PRODUCT-AUDIT.md:163)، verify-security-hygiene.mjs (بدون أمر npm رغم كونه جزءًا من بروتوكول إعادة إنتاج baseline).
- **Unreachable code: لم يُعثر على شيء. Stale imports: صفر** (مسح 76 صفحة — كل import يحل لملف موجود وكل رمز مستخدم).

### 3.8 الثوابت المكررة وMagic values

- **bcrypt cost `10` inline ×6** بلا ثابت: auth.ts:26,253؛ users.ts:122,352؛ seed.ts:101,204.
- **90-day purge** `90 * 24 * 60 * 60 * 1000` inline مرتين (db.ts:319,324).
- خيارات الترقيم (§3.2-6). LIMIT literals غير مسماة (LIMIT 1 ×33، 8 ×8، 50 ×4...). `z.string().max(200)` مُعلن 10+ مرات.
- **خرائط labels مكررة في الصفحات بجوار الوحدة المشتركة التي تتجاهلها:**
  - `RETEST_REASON_LABELS` في lab/tests/[id].astro:126-133 وprint.astro:78-85 — بينما `LAB_RETEST_REASON_LABELS` موجودة في lib/lab/policy.ts وتستخدمها صفحات retests الثلاث.
  - `STATUS_LABELS` في lab/documents/[id].astro:52 — بينما `LAB_DOCUMENT_STATUS_LABELS` في lib/lab/documents.ts:65.
  - `resultToneBadge` في lab/tests/[id].astro:88-92 **يطابق `TEST_RESULT_TONE` المستورد في نفس الملف (سطر 36)** — الاثنان مستخدمان معًا (:204 مقابل البقية).
  - `SAMPLE_STATUS_LABELS` و`PARAM_LABELS` مكررة بين tests/[id].astro وprint.astro.
  - `attentionTone` متطابق حرفيًا ×3 (manager/supervisor/employee index).
- **قواعد overdue بثلاث ترميزات:** SQL خام في manager:56-58 وsupervisor:54-56 + `isOverdue()` في lib مُستوردة في نفس الملفات.

### 3.9 عدم اتساق معالجة الأخطاء وعقود API

أربعة لهجات للخطأ:
1. `apiJsonError` الرسمي: `{ok:false, error, code}` + no-store (api-security.ts:15-20).
2. **15 helper `json()` محلي** في endpoints (tasks/[id]/*، findings، health، readiness، ai) — `{ok:false, error}` **بدون `code` وبدون no-store**.
3. **plain-text:** `api/findings/[id]/{capa,evidence,rca}.ts` — `new Response('Forbidden', {status:403})`.
4. `{ok:false, status:'unready', reason}` في readiness.ts:41.

تفاصيل: **53 payload خطأ بلا `code`**؛ invalid-id = 404 في tasks/* مقابل 400 في notifications/[id]/read.ts:20؛ **`findings/[id].ts:17` يرجع 400 لكل استثناء بما فيه أعطال السيرفر**؛ نجاح `admin/backup.ts` يتغير حسب header Accept (JSON أو redirect)؛ UX endpoint يرجع 204 فارغًا. الاستثناءان الموثقان: health.ts وreadiness.ts (probes عامة).

### 3.10 Type safety

| النمط | العدد | المواقع الحرجة |
|---|---|---|
| `: any` | 9 | assignment.ts:14، workflows/engine.ts:45,62، sla/engine.ts:63,122,129,170 |
| `as any` | 8 | assignment.ts:17، workload.ts:17، sla/engine.ts:126,129,170، lab/tests/[id].astro:80، api/tasks/suggestions.ts:13 |
| `as unknown as` | 6 | validation.ts:1287، lab/{calibration:431, products:265, equipment:325, retests:270}، api/reports/[reportType].[format].ts:84 |
| `@ts-ignore/expect-error/nocheck` | **0** | — |
| non-null `!` | 11 | dashboard.ts:715، lab/changeRequests.ts:138,296,311,325,348، lab/scan.ts:36، lab/qrcodes.ts:40، Navbar.tsx:483، DashboardCharts.tsx:220 |
| `as` casts (أغلبها حدود better-sqlite3 rows) | ~566 عبر lib+components+pages | نمط منهجي عند حدود SQL بلا طبقة row-mapper |
| `db.ts:394` | Proxy مبنية بـ`{} as BetterSqliteDatabase` | global cast |

### 3.11 Promises غير معالجة / أخطاء مبتلعة

- `backup-scheduler.ts:98-100` — `void createBackup(...).catch(() => {})` (ابتلاع كامل عند موقع النداء).
- `Navbar.tsx:224` — fetch مع `.catch(() => {})`.
- **10 catch blocks في TSX ترمي كائن الخطأ تمامًا** بلا أي logging: TaskLifecycle.tsx:260,287,309؛ CommentBox.tsx:61؛ AttachmentUploader.tsx:53؛ MarkReadButton.tsx:31؛ MarkAllReadButton.tsx:33؛ DeleteRequestDialog.tsx:41,84.
- lib: flash.ts:44-45 (موثق)، taskSearch.ts:680، templatesStore.ts:70,79، validation.ts:997,1117,1151، assignment.ts:10، backup-scheduler.ts:24.
- لا توجد سلاسل `.then()` بلا catch؛ الـ`void` المتعمدة (TaskUpdatePanel.tsx:543-544، TaskLifecycle.tsx:494) معالجة داخليًا.

### 3.12 Side effects في مكونات العرض / Business rules داخل UI

- **Side effects في render/module scope: صفر** (كل DOM/window داخل handlers/effects) — إيجابي.
- كل fetch في الـislands relative same-origin — إيجابي.
- **Business rules في UI:** evidence gate (TaskLifecycle.tsx:223-228,318-326 يعيد ترميز closeTask gate السيرفرية)؛ progress 0–100 (TaskUpdatePanel.tsx:183)؛ required-fields (LabTestForm.tsx:517-533)؛ terminal-state (TaskLifecycle.tsx:314-317).
- **Business rules في الصفحات:** delete-request eligibility (tasks/[id].astro:150-156 — CORE RULE #4 داخل صفحة)؛ cancel/reopen rank gates (:117-118)؛ evidence coverage (:140-144)؛ immutable rule (lab/tests/[id].astro:71 وtests/index.astro:144)؛ review-queue start (lab/tests/review.astro:157)؛ fail-rate≥50 (lab/reports.astro:243 وlab/products/[id].astro:325)؛ retest preconditions (retests/new.astro:20-33).
- **Route logic في الصفحات/الmiddleware:** 25 POST handler منفذة داخل middleware (route-manifest يثبتها) — قرار معماري قائم يجب توثيقه كعقد لا تفكيكه.

### 3.13 DB logic متسربة إلى الصفحات

| الصفحة | `.prepare()` |
|---|---|
| manager/index.astro | 5 (منها task-list SQL توأم المشرف) |
| supervisor/index.astro | 5 (نسخة حرفية) |
| employee/index.astro | 4 (منها scope SQL خام :41) |
| findings/index.astro | 2 |
| admin/users/index.astro | 1 |

المجموع: **17 statement في 5 صفحات** — كل الصفحات الـ70 الأخرى تستخدم lib services بشكل صحيح. (تسريبات ثانوية: api/tasks/[id]/comment.ts:44,79,87، api/reports/audit.ts:18-21، api/readiness.ts:30-32، و`admin/settings/index.astro:4` يستورد ثابت نظام ملفات `BACKUP_DIR` من lib/db.)

---

## 4. تحليل تغطية architecture-guard.mjs (الحارس الحالي: 5 قواعد)

يغطي: 11 ملف canonical بوجودها فقط؛ 7 أنماط duplicate-authority بـregex؛ حدود components/lib-ai ضد 7 وحدات (بـ`from '...'` فقط — الديناميكي يفلت)؛ 4 regex على schema.sql؛ keyword-presence لـAPI mutations (تعليق يحتوي كلمة "permissions" يكفي).

**لا يغطي (فجوات مثبتة):** الكود الميت؛ التكرار خارج الـ7 رموز؛ أي شيء type-safety؛ أي شيء error-handling؛ الدورات الاستيرادية؛ coupling lib↔lab؛ src/pages ضد حدود الـDB؛ المسارات اليتيمة؛ سكربتات smoke-*/ui-*/verify-* (regExp الحارس `^test-|^e2e-` لا يراها).

---

## 5. مصفوفة المعالجة (خطة الإصلاح المعتمدة)

| # | البند | القرار | الحالة |
|---|---|---|---|
| R1 | مسار `/api/tasks/suggestions` + `smoke-task-detail.mjs` + الصادرات الميتة (~20) | **حذف فعلي** (موافقة صريحة من المالك) | ⏳ |
| R2 | `canApproveFinding`×2 + requireRole الميت + قاعدة retest + row-authz في الصفحات | توحيد على permissions.ts / lib | ⏳ |
| R3 | employee-scope SQL ×13 | وحدة `lib/scope.ts` وحيدة + حارس | ⏳ |
| R4 | ثلاثة أطر بحث + 14 نسخة PER_PAGE + mergeWheres/orderClause | وحدة `lib/pagination.ts` مشتركة | ⏳ |
| R5 | 17 SQL في 5 صفحات (توأم manager/supervisor) | ترحيل إلى lib + حارس يمنع getDb في pages | ⏳ |
| R6 | 4 لهجات خطأ + 53 خطأ بلا code + findings catch-all 400 | عقد موحد + `test:api-contract` (TDD) | ⏳ |
| R7 | 27 hints + 9 any + 8 as any | إصلاح كامل → 0/0/0 | ⏳ |
| R8 | تحذيرا Vite (tasks.ts + 10 وحدات lab) | تحويل dynamic→static حيث آمن (مثبت أعلاه) | ⏳ |
| R9 | bcrypt×6، 90-day×2 | ثوابت مسماة | ⏳ |
| R10 | taskUpdates.ts 1,556 | تفكيك عند الشقوق (index.ts يعيد التصدير — الواجهة unchanged) | ⏳ |
| R11 | 6 دورات استيراد | inversion عبر sink لـchangeRequests؛ types-only توحيد اتجاه | ⏳ |
| R12 | خرائط labels المكررة (5 حالات) + overdue بثلاث ترميزات | ربط بالمصادر المشتركة الموجودة | ⏳ |
| R13 | business rules في UI/الصفحات | نقل إلى lib/task-policy (TDD حيث يتغير السلوك) | ⏳ |
| R14 | 10 catch مبتلعة + request-id مزدوج | console.error تشخيصي + توحيد الإنشاء | ⏳ |
| R15 | الحارس 5→11 قاعدة | تغطية: scope-SQL، getDb في pages، apiJsonError، orphan-api، duplicate canApproveFinding، local json() | ⏳ |
| R16 | الوحدات الضخمة الأخرى (lab/documents، lab/tests، validation، dashboard.astro...) | **justified**: توثيق ملكية وحجم في ARCHITECTURE.md (قرار المالك: فصل عند الشقوق فقط) | 📄 |
| R17 | middleware mega-router (25 POST) + CSP hashes + ENDPOINT_PAGE_PATHS | **justified**: عقد موثق (قرار معماري قائم؛ checkOrigin=false مقصود) | 📄 |
| R18 | BaseLayout استعلاما navbar لكل render | **justified**: متطلب وظيفي للجرس — يوثق كعقد | 📄 |
| R19 | ~566 cast حدود SQLite | **justified**: نمط حدود SQL المقصود — يوثق (لا row-mapper في هذا النطاق) | 📄 |
| R20 | الديناميكيات load-bearing (taskSearch/export/pdfData/testSearch → db) | **justified**: قيد ?raw في Node — يوثق | 📄 |

**المصطلحات:** ⏳ = يُنفّذ في هذه المهمة · 📄 = يُوثق justified (قرار المالك في QC-100-ARCHITECTURE-002).

---

## 6. إشارات إيجابية مثبتة (لا تُكسر أثناء الإصلاح)

- 0 `@ts-ignore` / 0 `eval` / 0 عربي في الواجهة · 34/34 API مصادق · كل fetch islands relative · 0 stale imports · 0 unreachable code · 0 side effects في render · CSP بلا unsafe-inline/eval · CSRF بطبقتين (Fetch Metadata + Origin) · 65 suite + 28 E2E كلها خضراء قبل التغيير.

---

*أُعد هذا التقرير من تدقيق الوكلاء الثلاثة + بوابات طازجة. التنفيذ اللاحق والقياس "بعد" في `ARCHITECTURE-100-EVIDENCE.md` (نفس المجلد).*
