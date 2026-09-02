# ARCHITECTURE-100-EVIDENCE — QC-100-ARCHITECTURE-002

> **المهمة:** QC-100-ARCHITECTURE-002 — رفع Architecture / Code Quality / Maintainability / Separation of Concerns / Dependency Boundaries / Type Safety / Error Handling إلى 100% مدعوم بالأدلة.
> **النطاق:** `apps/qc-task-manager/` كاملًا · **المرجع:** مخرجات PROMPT 00 المجمّدة + `REPORT3.md` (نفس المجلد).
> **التاريخ:** 2026-09-02 · **الفرع:** `main` · **لا commit ولا push ولا deploy** — الالتزام على المالك.
> **البيئة:** Node v22.22.3 + pnpm 10.19.0 (مطابق `.node-version` و`packageManager`).

---

## 1. الأهداف الصلبة — النتيجة الفعلية

| الهدف | المطلوب | الفعلي | أمر التحقق |
|---|---|---|---|
| typecheck errors | 0 | **0** | `npx astro check` |
| typecheck warnings | 0 | **0** | `npx astro check` |
| typecheck actionable hints | 0 | **0** (كانت 27) | `npx astro check` |
| build | clean | **exit 0، صفر تحذير** | `NODE_ENV=production npx astro build` |
| architecture guard | PASS | **PASS بـ9 قواعد** (كانت 5) | `node scripts/architecture-guard.mjs` |
| dead code غير مبرر | 0 | **0** | §3 |
| duplicated permission authority | 0 | **0** | §4 |
| Vite import warnings | 0 أو موثقة | **0** | §6 |
| unresolved architectural violations | 0 | **0 داخل نطاق المهمة**؛ دورات `lab/changeRequests` مؤجّلة وموثقة (§13.4) | §5 · §13.4 |
| e2e acceptance | PASS | **غير مُتحقَّق على الشجرة النهائية** — راجع §13.2 | `pnpm e2e:acceptance` |

## 2. جدول المقاييس قبل/بعد

| المقياس | قبل | بعد | الدليل |
|---|---|---|---|
| typecheck (errors/warnings/hints) | 0 / 0 / 27 | **0 / 0 / 0** | مخرج `astro check` (قائمة الـ27 كاملة في REPORT3 §2.1) |
| تحذيرات Vite للبناء | 2 (db.ts، validation.ts) | **0** | `grep -ci warn` على مخرج البناء = 0 |
| قواعد architecture-guard | 5 | **9** | `grep -c '^function check' scripts/architecture-guard.mjs` |
| canonical unit suites | 65 | **67** | `test:manifest` → «67 canonical suites, 28 canonical E2E» |
| `canApproveFinding` معرّفة | 2 مرة (permissions + findings) | **1** | §4 |
| صادرات ميتة في lib | ~11 مؤكدة | **0** | §3 |
| مسارات API يتيمة | 1 (`/api/tasks/suggestions`) | **0** | §3 + قاعدة ORPHAN_ROUTE |
| employee-scope SQL منسوخ | 13 موضعًا | **1** (`src/lib/scope.ts`) | §5.1 |
| `PER_PAGE_OPTIONS` مُعلنة | 12 نسخة + `DEFAULT_*` 13 نسخة | **1 + 1** (`src/lib/pagination.ts`) | §5.2 |
| SQL داخل `src/pages/**` | 17 statement في 5 صفحات | **0** | §5.3 + قاعدة PAGE_DB_ACCESS |
| SQL داخل `src/pages/api/**` | 4 ملفات | **1** (`readiness.ts` — probe موثق) | §5.3 |
| لهجات ردود API | 4 (`{ok,error}` / `{ok,error,code}` / plain-text / `reason`) | **1** (`apiJson` / `apiJsonError`) | §7 |
| أخطاء API بلا `code` | 53 | **0** | `test:api-contract` 159 فحصًا |
| helpers `json()` محلية في API | 15 | **0** | قاعدة API_CONTRACT |
| أكبر ملف mutation | `taskUpdates.ts` 1,556 سطرًا | **6 ملفات**: 655/483/313/168/109/30 | §8 |
| bcrypt cost inline | 6 مواضع | **1** (`BCRYPT_ROUNDS`) | §9 |
| catch blocks تبتلع الخطأ بلا تسجيل | 10 في TSX + 2 في lib | **0** | §10 |
| روابط تصدير مكسورة (404) | 2 | **0** | §11 |

## 3. الكود الميت — حُذف فعليًا (بموافقة صريحة من المالك)

| العنصر | الدليل قبل الحذف | الإجراء |
|---|---|---|
| `src/pages/api/tasks/suggestions.ts` | صفر مراجع في `src/`, `public/scripts/`, `scripts/` | حُذف — عدّ المسارات 116 → 115 (`test:route-manifest`) |
| `scripts/smoke-task-detail.mjs` | غير مسجل في package.json ولا أي registry | حُذف |
| `auth.ts:requireRole` | صفر مستدعين | حُذف |
| `systemHealth.ts`: `safeDatabasePath`, `fileSize`, `getDiskHealth`, `applicationIdentity` | تُستخدم داخليًا فقط | أُلغي التصدير (الدوال باقية) |
| `backup-scheduler.ts:schedulerOptionsForDatabase` | صفر مستدعين | حُذفت الدالة + استيرادها |
| `searchExport.ts`: `ExportColumn`, `ExportCellMap`, `SEARCH_EXPORT_COLUMNS`, `searchRowToCells` | داخلية فقط | أُلغي التصدير |
| `seed.ts:isUsersEmpty` | داخليًا فقط | أُلغي التصدير |
| `lab/overview.ts`: `getLabReturnedTests`, `getLabOwnedWIContent` (+ نوعاهما) | الصفحة توقفت عن عرضهما (commit `05a32acd`)؛ استعلاما DB كانا يُنفّذان بلا مستهلك | حُذفت |
| `lab/index.astro`: `documentsInReview` + `getLabDocumentInReviewCount()` | متغيّر محسوب ولا يُعرض | أُزيل النداء (الدالة باقية — تستخدمها `documents/index.astro`) |

**مُبرّأة من قائمة «الميت»** بعد تحقق سطر-بسطر (تقرير الوكيل كان خاطئًا فيها): صادرات `backup-scheduler` الأربع و`observability.ERROR_CODES` و`lab/seed.EQUIPMENT_SEED_ROWS` تستخدمها سويتات الاختبار فعليًا (`scripts/test.mjs:32-36`, `test-observability.mjs:9`, `test-lab-equipment.mjs:93`).

**سكربتات غير مسجلة أُبقيت وصُنّفت (justified):** `smoke-ai-live.mjs` و`ui-screenshots.mjs` مُحال إليهما في `docs/`؛ `verify-security-hygiene.mjs` صار له أمر `test:security-hygiene` ودخل الـmanifest.

## 4. سلطة الصلاحيات — صفر ازدواجية

| الحالة قبل | بعد |
|---|---|
| `canApproveFinding` معرّفة في `permissions.ts:165` **و** `findings/index.ts:36` بجسمين مستقلين | التعريف الوحيد في `permissions.ts`؛ `canReviewFinding` نُقلت إليه أيضًا؛ `api/findings/[id].ts` يستوردهما من مصدر واحد |
| قاعدة إنشاء retest موجودة في الصفحة فقط (`retests/new.astro:22`) وبصيغة مختلفة عن الـhandler | predicate واحد `canOpenLabRetestForm(role)` في `permissions.ts` تستهلكه الصفحة والـhandler |
| row-authorization محسوبة داخل `lab/tests/[id].astro:58` و`print.astro:34` | predicate واحد `canViewLabTestRecord(user, record)` في `permissions.ts` |
| `immutable = status === 'APPROVED' \|\| status === 'VOID'` في صفحتين | `isLabTestRecordImmutable(status)` في `lib/lab/policy.ts` |
| delete-request eligibility (CORE RULE #4) داخل `tasks/[id].astro:150` | `canRequestTaskDeletion(user, task)` في `lib/task-policy.ts` |

الحارس يمنع الرجوع: قاعدة `DUPLICATE_AUTHORITY` القائمة + `SCOPE_AUTHORITY` الجديدة.

## 5. حدود الاعتماد وفصل المسؤوليات

### 5.1 employee-scope SQL: 13 → 1
`src/lib/scope.ts` صار المالك الوحيد لعبارة الملكية بستة أشكال (task/lab-test/lab-document × مُسبَّق `t.`/`d.` وغير مُسبَّق) + `rowScopeParams()`. المستهلكون: `taskSearch`, `notifications`, `export`, `reporting/scope`, `lab/search` (موضعان), `lab/overview` (أربعة), `lab/calendar`, `lab/testSearch`, `roleWorkspace`. قاعدة `SCOPE_AUTHORITY` تفشل على أي نسخة أخرى.

### 5.2 الترقيم: 25 إعلانًا → 1
`src/lib/pagination.ts` يملك `PER_PAGE_OPTIONS`, `DEFAULT_PER_PAGE`, `isPerPage`, `isSortDir`, `buildOrderClause` (بـtiebreaker `id DESC`), `mergeWheres`. الوحدات الـ12 تُبقي أسماءها العامة كـaliases توافقية (`LAB_TEST_PER_PAGE_OPTIONS = PER_PAGE_OPTIONS`)، فلا تغيير في أي واجهة. أُزيلت النسخ المكررة حرفيًا لـ`mergeWheres`/`orderClause`/`isPerPage`/`isDir` من `taskSearch` و`lab/testSearch` و`lab/review`، وصفحة `lab/tests/review.astro` توقفت عن hardcode المصفوفة.

### 5.3 قاعدة البيانات خارج طبقة العرض
`src/lib/roleWorkspace.ts` جديد يملك استعلامات صفحات الأدوار الثلاث (SQL المدير/المشرف كان توأمًا copy-paste). `listAdminUsers()` في `users.ts` و`listFindingFormOptions()` في `qc-operations.ts` و`getTaskCore()` في `taskDetails.ts` و`addTaskComment()` في `taskUpdates` و`listReportAuditLog()` في `reporting/reader.ts` استقبلت باقي الاستعلامات من الصفحات والـendpoints. خريطة `ATTENTION_TONE` صارت في `components/ui/statusTones.ts` بدل ثلاث نسخ متطابقة.

### 5.4 خرائط labels المكررة
`LAB_RETEST_REASON_SHORT_LABELS`, `LAB_SAMPLE_STATUS_LABELS`, `LAB_TEST_PARAM_LABELS`, `LAB_FAIL_RATE_ALERT_THRESHOLD` انتقلت إلى `lib/lab/policy.ts`؛ صفحتا الاختبار والطباعة تستهلكانها بـalias، و`documents/[id].astro` صار يستورد `LAB_DOCUMENT_STATUS_LABELS` من `lib/lab/documents.ts`.

## 6. تحذيرات Vite — 0 (PERF-001 مغلقة)

**قبل:** تحذيران يقولان إن `db.ts` (يُستورد ديناميكيًا من `tasks.ts`) و`validation.ts` (من 10 وحدات lab) مُستورَدان ساكنًا في مكان آخر، فلا ينتج chunk منفصل.

**الجذر:** الديناميكية كانت لازمة تاريخيًا لأن `db.ts` يستورد `?raw` (39 هجرة) فلا يُحمَّل في Node العادي. لكن الوحدات الـ10 كلها تستورد `db` **ساكنًا** أصلًا (تحقق: `static_db_imports=1` لكل واحدة)، و`tasks.ts` يستورد `getDb` ساكنًا في السطر 16 وديناميكيًا في 418 — أي الديناميكية زائدة بلا فائدة.

**الإجراء:** حُوِّلت 13 ديناميكية زائدة إلى static؛ أُزيلت الأغلفة العدمية (`getSearchDb`, `getReviewDb`, `getLabTestDb`) والتعليقات المتقادمة التي تدّعي قيدًا لم يبقَ. الديناميكيات اللازمة الوحيدة الباقية: `import('exceljs')` (حزمة CJS خارجية عبر `vite.ssr.external`).

**النتيجة:** `NODE_ENV=production npx astro build` → exit 0 وصفر تحذير.

## 7. معالجة الأخطاء وعقد API

**قبل:** أربع لهجات — `apiJsonError`، 15 helper `json()` محلي بلا `code` وبلا `no-store`، plain-text في `findings/{capa,evidence,rca}`، و`{ok:false, reason}` في readiness. و53 خطأ بلا `code`، و`findings/[id].ts:17` يرد 400 على أي استثناء (بما فيها أعطال السيرفر).

**بعد (TDD — الاختبار كُتب أولًا وفشل بـ38 مخالفة ثم أُخضِر):**
- `apiJson(body[, status])` جديد بجانب `apiJsonError(msg, status[, code][, extra])`؛ كلاهما JSON + `no-store`.
- 35 endpoint مُرحَّل؛ صفر helper محلي؛ صفر body نصي؛ `AI` أُضيف لـ`SafeErrorCode` بدل تمرير حالة AI كنص.
- `scripts/test-api-contract.mjs` (**159 فحصًا**، أمر `test:api-contract`) مسجل canonical → 67 suite.

### 7.1 فصل «رفض السياسة» عن «عطل السيرفر» (تصحيح ذاتي أثناء التنفيذ)

المحاولة الأولى حوّلت كل catch في مسارات findings من 400 إلى 500. **هذا كان خطأ**، وكشفه `e2e-findings` بثلاثة إخفاقات: مخالفات قواعد QC (انتقال CAPA للخلف، إغلاق قبل الاعتماد، إغلاق بلا دليل) تُرمى كاستثناءات وهي **رفض متوقع** لا عطل، فتستحق 400.

التصحيح المعماري: صنف `DomainRuleError` جديد في `qc-operations.ts` (10 مواضع رمي قواعد صارت مُصنَّفة). في الـendpoints:

```ts
} catch (error) {
  if (error instanceof DomainRuleError) return apiJsonError(error.message, 400);
  return apiJsonError('… generic …', 500);
}
```

فصار: نص القاعدة (وهو نص موجَّه للمستخدم أصلًا) يظهر مع 400، وأي عطل غير متوقع يظهر برسالة عامة مع 500 بلا تسريب نص استثناء. وحُدِّثت القاعدة 4 في حارس العقد لتعتبر `DomainRuleError` استثناءً مشروعًا للـ400.

## 8. تفكيك وحدة المهام (قرار المالك: عند الشقوق الآمنة)

`taskUpdates.ts` (1,556 سطرًا) → مجلد `src/lib/taskUpdates/` بشقوق مأخوذة من عناوين الأقسام في الملف نفسه:

| الملف | الأسطر | المسؤولية |
|---|---|---|
| `update.ts` | 655 | تحديث الحقول + checklist + dependencies |
| `closure.ts` | 483 | تدفق الإغلاق + بوابة الأدلة |
| `shared.ts` | 313 | أنواع النتائج + حدود التدقيق + تحقق الملفات |
| `lifecycle.ts` | 168 | cancel / reopen |
| `attachments.ts` | 109 | رفع المرفقات + التعليقات |
| `index.ts` | 30 | الواجهة العامة + re-exports التوافقية |

الواجهة العامة **لم تتغير** — كل المستوردين (7 endpoints + صفحة + سويتان) يعملون بلا تعديل عدا مساري import صريحين بـ`.ts` في سكربتي اختبار. الوحدات الضخمة الأخرى (`lab/documents.ts` 1,553، `validation.ts` 1,359 كـschema hub، `lab/tests.ts` 1,191، `dashboard.ts` 1,114) بقيت بقرار المالك وتُوثَّق ملكيتها في `docs/ARCHITECTURE.md`.

## 9. Magic values

`BCRYPT_ROUNDS` مُصدَّر من `auth.ts` ويستهلكه `auth.ts` و`users.ts` و`seed.ts` (6 مواضع inline → 1)؛ `RETENTION_WINDOW_MS` في `db.ts` (نسختان inline → 1)؛ `LAB_FAIL_RATE_ALERT_THRESHOLD` في `lib/lab/policy.ts` (نسختان → 1)؛ خيارات الترقيم (§5.2).

## 10. الأخطاء المبتلعة

12 موضعًا كان يرمي كائن الخطأ تمامًا صار يسجّل `console.error` تشخيصيًا مع **إبقاء نص المستخدم حرفيًا** (فحوص `test:ux-writing` و`test:interaction-feedback` تحرسه): `TaskLifecycle` (3)، `CommentBox`، `AttachmentUploader`، `MarkReadButton`، `MarkAllReadButton`، `DeleteRequestDialog`، `Navbar` (fetch الخلفي)، `backup-scheduler` (catch-up).

## 11. اكتشاف عرضي: رابطا تصدير مكسورا (404)

قاعدة `ORPHAN_ROUTE` الجديدة كشفت أن `/api/lab/tests/export.csv` و`export.xlsx` بلا أي مُحيل — والسبب أن `lab/tests/index.astro:177-178` كانا يشيران إلى `/lab/tests/export.csv|xlsx`، وهذان **غير موجودين** كصفحة أو endpoint. أي زر «Export CSV/XLSX» في سجل اختبارات المختبر كان يرد 404. أُصلح المساران، وأُضيف فحص regression في `test:ui-consistency` (212 فحصًا الآن) يفشل على أي رابط تصدير لا يستهدف `/api/`.

## 12. سجل التحقق النهائي (أوامر ومخرجات فعلية على الشجرة النهائية)

| الأمر | المخرج |
|---|---|
| `npx astro check` | **0 errors / 0 warnings / 0 hints** |
| `NODE_ENV=production npx astro build` | **exit 0** · `warnings=0` (تحقق بـ`grep -ci warn` على السجل) |
| `node scripts/architecture-guard.mjs` | **PASS** — 9 قواعد |
| `node scripts/route-manifest.mjs --check` | **PASS** — 115 file routes / 25 middleware / 6 guards |
| `node scripts/test-manifest-guard.mjs` | **PASS** — 67 canonical suites, 28 canonical E2E |
| `node scripts/test-api-contract.mjs` | **PASS** — 159 checks / 35 endpoints |
| `node scripts/test-ui-consistency.mjs` | **PASS** — 212/212 |
| `node scripts/verify-security-hygiene.mjs` | **PASS** |
| `node scripts/test-qc-operations.mjs` | **PASS** |
| `git diff --check` | نظيف (أُصلحت مسافة زائدة واحدة في `tasks.ts:400`) |
| `node scripts/run-full-tests.mjs` | آخر تشغيل كامل: 66/67 ثم أُخضِر الأخير (§13.1) — **لم يُعَد تشغيل السلسلة بعد تعديلات §7.1** |
| `node scripts/e2e-acceptance.mjs` | **غير مُتحقَّق على الشجرة النهائية** (§13.2) |

### 12.1 تعديلان على ملفي حراسة — بالسبب

1. **`test-lab-ux-presentation.mjs`** كان يطلب ظهور نصوص حالات المستندات حرفيًا داخل `documents/[id].astro`؛ بعد إزالة الخريطة المكررة صارت النصوص في مالكها الوحيد `lib/lab/documents.ts`. أُضيف هذا الملف لخريطة الحارس فصار يقبل المصدر الكنسي — **نية الفحص محفوظة** (الحالات لا تزال صريحة ومعروضة للمستخدم)، ولم يُضعَّف أي شرط.
2. **`test-api-contract.mjs`** القاعدة 4: أُضيف `DomainRuleError` كاستثناء مشروع لرد 400، لأن رفض قاعدة QC رفضٌ متوقع لا عطل (§7.1).

لم يُعطَّل أو يُحذف أي assertion، ولم يُخفَّف أي فحص لإخضار نتيجة.

## 13. الحدود الصادقة — ما لم يُثبت في هذه المهمة

### 13.1 سلسلة الوحدات
آخر تشغيل كامل لـ`run-full-tests.mjs` (بعد كل تعديلات §3–§11 وقبل §7.1) أعطى **66 من 67 خضراء** والفشل الوحيد كان `test:lab-ux-presentation` من نوع «نص انتقل لمالكه الكنسي» — أُصلح وأُعيد تشغيل السويتة وحدها: **14/14 PASS**. لم تُعَد السلسلة كاملة بعد تعديلات §7.1 بأمر المستخدم بتخطي الاختبارات؛ السويتات المتأثرة مباشرة (`test-qc-operations`, `test-api-contract`, `architecture-guard`, `astro check`, `build`) شُغّلت فرديًا وكلها خضراء.

### 13.2 بوابة القبول E2E
التشغيل الكامل قبل §7.1 أعطى **فشلًا واحدًا** في `e2e-findings` بثلاث assertions تطلب 400 لرفض قواعد CAPA/الإغلاق — وهي بالضبط ما يعالجه تصحيح §7.1. **لم يُعَد تشغيل `e2e:acceptance` بعد التصحيح** (تخطي بأمر المستخدم)، لذلك حالته على الشجرة النهائية **غير مُتحقَّقة** ولا يجوز اعتبارها خضراء. الخطوة الأولى قبل أي نشر: `pnpm e2e:acceptance` في runner يسمح بـlocalhost.

### 13.3 الفجوات الخارجية (بلا تغيير)
G-01 نشر حي · G-02 UAT بشري · G-03 وصول يدوي بخبير · G-04 restore إنتاجي · G-05 RUM. هذه المهمة معمارية داخلية ولا تدّعي إغلاق أي منها.

### 13.4 قرارات justified موثقة (لا إنجازات)
- الوحدات الضخمة الأربع الباقية: `lab/documents.ts` 1,553 · `validation.ts` 1,359 (schema hub) · `lab/tests.ts` 1,191 · `dashboard.ts` 1,114 — بقرار المالك «فصل عند الشقوق الآمنة فقط».
- ~566 cast عند حدود better-sqlite3 — نمط مقصود بلا طبقة row-mapper في هذا النطاق؛ الهدف الرقمي كان typecheck 0/0/0 وتحقق.
- middleware كموجّه POST (25 معالجًا) + CSP hashes + `ENDPOINT_PAGE_PATHS` — عقد قائم موثق، لم يُفكَّك.
- `BaseLayout` يستعلم إشعارات الجرس في كل render — متطلب وظيفي موثق.
- دورات استيراد `lab/changeRequests ↔ {equipment, products, calibration, retests}` — **لم تُفكَّك** في هذه المهمة (تحتاج inversion عبر sink module؛ تُسجَّل كعمل تالٍ).

### 13.5 حدود الحوكمة
لا commit ولا push ولا deploy — القاعدة الثانية في دستور المشروع؛ الالتزام والنشر على المالك.
