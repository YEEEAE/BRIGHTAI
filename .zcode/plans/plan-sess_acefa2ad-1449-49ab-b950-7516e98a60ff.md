# PROMPT 03 — QC Laboratory: التنقل + RBAC + صلاحيات LAB_* (العقد v1.1 كامل)

## السياق (متحقق منه من العقل والريبو)
- PROMPT 02 (migrations 011–014 + db.ts + types.ts) منفذ ومتحقق (سجل QC-LAB-DB-FOUNDATION-001). `src/lib/lab/` و`src/pages/lab/**` و`src/pages/api/lab/**` فاضية — عظام مجلدات فقط.
- عقد المعمارية الملزم: `apps/qc-task-manager/docs/QC-LAB-ARCHITECTURE.md` (v1.1) — مصدر مصفوفة الصلاحيات (§6) وحارس المسارات (§5.1) والتنقل (§5.3).
- لا يوجد مكوّن breadcrumbs في التطبيق إطلاقًا (تحقق grep) — رغم أن البرومبت يقول "استخدم الموجود".

## الملفات المراد تغييرها

### 1. `src/lib/permissions.ts` — الصلاحيات المركزية (المصدر الوحيد)
إضافة قسم Laboratory فوق نمط `PERMISSIONS` الحالي (predicates تأخذ `role` أو `Pick<User,...>`)، حسب مصفوفة العقد §6.2 كاملة (~34 صلاحية):
- **Role-level**: `canViewLab`, `canCreateLabTest`, `canSubmitLabTest`(own later at page), `canReviewLabTest`(manager+ / supervisor بدون self), `canApproveLabTest`(admin + manager بدون self — D-4: supervisor ممنوع افتراضيًا), `canVoidLabTest`(admin/manager), `canCreate/Edit/ArchiveLabProduct`, `canCreate/EditLabTemplate`, `canApproveLabTemplate`(بدون self-edit), `canCreate/Edit/ArchiveLabEquipment`, `canRecordLabEquipmentMaintenance`(admin/manager/supervisor), `canView/EditLabCalibration`, `canCreate/Edit/Review/Approve/ArchiveLabDocument`, `canAcknowledgeLabDocument`(الكل), `canCreateLabRetest`(D-5: supervisor+), `canViewLabRetest`, `canViewLabReport`, `canExportLabData`, `canViewLabDataQuality`, `canViewLabManagementDashboard`, `canUseLabAiAssist`.
- **Entity-context predicates** (منع self-approval صلب server-side): `canEditLabTest(user, test)` (own DRAFT/REJECTED للموظف/المشرف)، `canReviewLabTest(user, test)` (`tested_by !== user.id` حتميًا)، `canApproveLabTest(user, test)` (`tested_by/reviewed_by !== user.id`)، ومثلها للوثائق (`author_id`).
- لا أدوار جديدة، لا نظام صلاحيات ثانٍ — نفس `ROLE_RANK` والملف الكنسي (architecture-guard يفرض ذلك أصلًا).

### 2. `src/middleware.ts` — حارس بادئة `/lab` واحد
بنمط حراس `/dashboard` و`/manager` الموجودة (middleware.ts:122-146): بعد جدار الـ auth، `/lab*` بدون `canViewLab` → `setFlash('error',...)` + redirect إلى `roleHome(user.role)`. `PUBLIC_PATHS` ما تتوسع. الفحوص الأدق (SUBMIT/APPROVE/...) تبقى لمسارات الصفحات/APIs في البرومبتات اللاحقة — هذا الحارس هو جدار البادئة فقط كما يحدد العقد §5.1.

### 3. `src/components/Navbar.tsx` — رابط واحد "Laboratory"
إضافة مدخل واحد `{href:'/lab', label:'Laboratory'}` في `ROLE_LINKS` للأدوار الأربعة (كلهم عندهم LAB_VIEW حسب العقد) — ما أستبدل ولا أعيد ترتيب الروابط الحالية. قائمة الجوال ترث تلقائيًا (نفس آلية lg الحالية). التنقل الثانوي داخل `/lab` نفسه (مجموعات Overview/Testing/Master Data/Controlled Documents/Operations) مو في الـ Navbar — كما يحدد العقد §5.3.

### 4. `src/pages/lab/index.astro` — صفحة هبوط /lab (جديدة)
- عبر `BaseLayout` القائم + FlashNotice + EmptyState.
- **مكوّن تنقل ثانوي جديد** `src/components/lab/LabSecondaryNav.astro` (server-rendered): مصفوفة معرفة (label, href, permission) لكل مجموعات العقد، تُفلتر بالصلاحية **server-side** من الجلسة — وتعرض فقط العناصر اللي مساراتها منفذة فعليًا (حاليًا `/lab` فقط، عبر قائمة `IMPLEMENTED_ROUTES` موثقة) عشان ما نصنع روابط ميتة 404؛ البرومبتات اللاحقة تضيف مدخلات فقط.
- **مكوّن Breadcrumbs جديد** `src/components/Breadcrumbs.astro` مشترك (ol + aria-current، RTL) — البرومبت طلب استخدام breadcrumbs موجودة لكن ما فيه أصلًا؛ قرار موثق: أصغر مكوّن مشترك جديد على نمط المكونات القائمة، يُستخدم بصفحات المختبر ويكون متاحًا لغيرها.
- أقسام مؤشرات وصفية بسيطة (بلا بيانات — الجداول فاضية بلا seed، وممنوع اختراع بيانات).

### 5. `scripts/test.mjs` — فحوص وحدة للمصفوفة كاملة
قسم "Laboratory RBAC" جديد: كل الأدوار × الصلاحيات المفتاحية (view للكل، create test للكل، review/approve/void للمدير+، D-4: supervisor approve مرفوض، D-5: employee retest مرفوض)، منع self-review/self-approval عبر entity predicates (tested_by/author_id == actor → false حتمًا)، الموظف يعدل اختباره DRAFT فقط.

### 6. `scripts/e2e-lab-nav.mjs` (جديد) + تسجيله في `scripts/e2e-acceptance.mjs`
بنمط السويتات القائمة (temp DB + port معزول): anonymous `/lab` → 302 `/login`؛ الأدوار الأربعة → 200 على `/lab` (كلهم LAB_VIEW)؛ رابط Laboratory ظاهر في الـ navbar للجميع (desktop + mobile menu)؛ التنقل الثانوي يختلف حسب الدور (employee ما يشوف Equipment Edit/Reports Reports Reports)؛ hidden fields/`?role=` query ما تتجاوز الحارس (POST بحقول مزورة يظل محكوم بالجلسة)؛ المسارات القائمة ما تأثرت (spot-check /dashboard + /manager + /employee).

### 7. توثيق + حارس المعمارية
- `docs/ROLES-AND-PERMISSIONS.md`: جدول مصفوفة LAB_* كامل + قواعد الحدود الصلبة (no self-approval، Authorization من الجلسة فقط، الحالات النهائية immutable).
- `scripts/architecture-guard.mjs`: إضافة قاعدة canonical ownership — صلاحيات LAB_* لا تُعرّف إلا في `permissions.ts` (منع أي `can...Lab` خارج الملف الكنسي).
- `README.md` (qc-task-manager): قسم Laboratory موجز.

### 8. تحديث العقل
سجل جديد أعلى `.agents/mind/01-mind-latest.md` (ledger + قرارات + أوامر التحقق الفعلية ونتائجها). لا commit ولا push — عليك.

## قرارات موثقة مسبقًا
1. **العقد الملزم كامل** (اختيارك): قائمة رسالتك مشمولة + الإضافات (PRODUCT_CREATE, TEMPLATE_CREATE/APPROVE/ARCHIVE, EQUIPMENT_CREATE, CALIBRATION_CREATE, REPORT_VIEW, AI_ASSIST, DATA_QUALITY_VIEW).
2. **Breadcrumbs مكوّن جديد مشترك** لأنه غير موجود أصلًا — أصغر امتداد متوافق، مو نظام بديل.
3. **لا روابط ميتة**: التنقل الثانوي يعرض فقط المسارات المنفذة فعليًا.
4. **حارس الـ middleware = جدار البادئة فقط** (LAB_VIEW)؛ فحوص الصلاحيات الأدق مسؤولية الصفحات/APIs في برومبتات لاحقة — نفس بنية الحراس القائمة.

## التحقق (قبل التسليم)
- `pnpm --filter @brightai/qc-task-manager typecheck` (متوقع 0 errors / 13 hints)
- `pnpm --filter @brightai/qc-task-manager test` (كل السلاسل + قسم RBAC الجديد)
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build`
- `node scripts/architecture-guard.mjs` + `node scripts/verify-security-hygiene.mjs`
- `pnpm --filter @brightai/qc-task-manager e2e:acceptance` (يشمل سويت lab-nav الجديدة + كل السويتات القائمة = لا regression)
- فحص يدوي 360px + 1440px (الـ navbar والـ secondary nav)

## غير متحقق/خارج النطاق
- لا صفحات اختبارات/أجهزة/وثائق فعلية (برومبتات 04+)، لا seed للأجهزة الـ24 (PROMPT 11)، لا APIs — `/lab` صفحة الهبوط فقط.
- أي نتيجة فشل تُبلَّغ بصراحة مع السبب — ما نتزين.