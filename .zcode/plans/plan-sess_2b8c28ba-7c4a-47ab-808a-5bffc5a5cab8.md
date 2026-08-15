# Product Master — `/lab/products` (تطبيق داخل `apps/qc-task-manager`)

## الأساس الموجود مسبقًا (ما يعاد بناؤه)
- جدول `lab_products` موجود (migration 011) بأغلب الحقول: name, code (UNIQUE), description, connector_type, default_test_type, default_template_id, applicable_sop_id, applicable_wi_id, is_active, notes.
- الصلاحيات جاهزة في `permissions.ts`: `canViewLabProducts` (الكل) / `canCreateLabProduct` / `canEditLabProduct` (manager+).
- واجهة `LabProduct` موجودة في `types.ts`، ومدخل التنقل في `navigation.ts` (بيئة Master Data) لكنه معطّل لأن المسارات ليست في `IMPLEMENTED_LAB_ROUTES`.
- الاختبارات تستهلك المنتجات أصلًا عبر `resolveLabProductId` + `product_snapshot_json` يُجمَّد عند الاعتماد (review.ts) — الهوية التاريخية محفوظة بنيويًا.

## التنفيذ

### 1) Migration 016 — `016_lab_product_equipment.sql`
- جدول ربط `lab_product_equipment (product_id → lab_products ON DELETE CASCADE, equipment_id → lab_equipment ON DELETE CASCADE, PRIMARY KEY(product_id, equipment_id))` لحقل **Related Equipment** (العلاقة الكانونية by-ID).
- تسجيله في `db.ts` + مرآة في `schema.sql` + `types.ts` + تحديث عدّادات `test-migrations/test.mjs/test-dashboard-reports`.
- لا تخزين أسماء أجهزة نصية إطلاقًا.

### 2) طبقة الخدمة — `src/lib/lab/products.ts` (جديد)
- `listLabProductsForMaster` (قائمة مع بحث/فرز مكمَّم allowlist + ترقيم) بنمط `testSearch.ts`.
- `getLabProductById` (+ الأجهزة المرتبطة + عدد الاختبارات المرجعية).
- `createLabProduct` / `updateLabProduct` — ترانزاكشن تشمل جدول الربط (استبدال كامل للمجموعة).
- Audit لكل تغيير على `qc_audit_log` بـ `entity_type='LAB_PRODUCT'` وأفعال CREATE/UPDATE (نفس النمط الموجود — لا نظام تدقيق ثانٍ). التاريخ (History) = قراءة سجل الـ audit للكيان.
- تحقق من تفرّد `code` برسالة واضحة.

### 3) التحقق (validation) + الوسيط (middleware)
- `labProductSchema` في `validation.ts`: name/code مطلوبان، default_test_type enum (air/vacuum)، معرفات (IDs) موجودة وفاعلة، is_active منطقي (boolean)، notes طول محدود.
- POST handlers في `middleware.ts` بنمط `handleLabTestFormPost`: `/lab/products/new` و `/lab/products/[id]/edit` (يُقرأ id من الـ path) — `getCurrentUser` → صلاحية → CSRF → `parseFormData` → flash + redirect.

### 4) الصفحات (BaseLayout + Breadcrumbs + LabSecondaryNav بنمط الصفحات الموجودة)
- `src/pages/lab/products/index.astro` — جدول List: Code/Name/Connector/Default Test Type/Active + بحث GET server-side + ترقيم؛ زر New لمن يملك `canCreateLabProduct`؛ عمود Actions: View دائمًا، Edit لصاحب الصلاحية.
- `src/pages/lab/products/new.astro` + `.../[id]/edit.astro` — نموذج بالحقول الإحدى عشر (الحقول المرجعية dropdowns من الجداول الفعلية: templates/documents/equipment — بدون بذر بيانات مخترعة §78). صفحة edit تعرض قسم History (سجل الـ audit) read-only. المنتج غير الفاعل غير قابل للتحرير (بعرض فقط + hint).
- `src/pages/lab/products/[id].astro` — تفاصيل: كل الحقول + الأجهزة المرتبطة + عدد/روابط الاختبارات المرجعية (`/lab/tests?product=`) + Audit Timeline.
- النموذج: React island خفيف `client:visible` (نفس نمط LabTestForm) أو نموذج Astro خالص POST مباشر — يُختار حسب حماية فقدان البيانات المطلوبة؛ الأساس POST مباشر بدون JS.
- إضافة المسارات الأربعة لـ `IMPLEMENTED_LAB_ROUTES` (تنشيط روابط التنقل والـ drill-downs تلقائيًا).

### 5) ربط نموذج الاختبار بالمطلب "populate, never overwrite"
- في `handleLabTestFormPost` / `LabTestForm.tsx`: عند اختيار منتج، يُعرض ملخص القيم المرجعية والوثائق المرتبطة (connector_type، default_test_type، SOP/WI، القالب) كمقترحات فقط — **الحقول المقاسة تظل قابلة للتحرير ولا تُستبدل بصمت أبدًا** (الملء الأولي للمسودة فقط عند كون الحقول فارغة، لا كتابة فوق قيم أدخلها المستخدم).
- العلاقة الكانونية تبقى `product_id` + `product_snapshot_json` عند الاعتماد (موجود) — الهوية التاريخية محفوظة.

### 6) الاختبارات والتحقق
- `scripts/test-lab-products.mjs` (وحدة: بحث/فرز، CRUD، جدول الربط، audit، تفرّد code، عدم تحرير غير الفاعل) + `scripts/e2e-lab-products.mjs` (جدار auth/RBAC، إنشاء/تحرير، التاريخ، لا روابط ميتة، لا overflow عند 390/1440) — تسجيلهما في `package.json` و`e2e-acceptance`.
- تحديث `e2e-lab-nav.mjs` (allowlists).
- الأوامر: `pnpm typecheck` → `NODE_ENV=production pnpm build` → `pnpm test` كامل → تشغيل الـ e2e standalone (نمط المهام السابقة) → `architecture-guard`.

## الالتزامات
- لا بذر منتجات (§78 لا اختراع بيانات) — صفحات فارغة بـ EmptyState.
- كل SQL مكمَّم (لا نص مستخدم في SQL)، CSRF + صلاحيات server-side، الحقول المرجعية display-only لا فرض قيم.
- لا commit ولا push — اقتراح رسالة: `feat(lab): add Product Master CRUD /lab/products with equipment links + audit (PROMPT 08)`.
- تحديث `.agents/mind/01-mind-latest.md` بسجل جديد أعلى القسم 1 بعد التسليم.