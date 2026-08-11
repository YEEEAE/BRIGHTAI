# تطوير Evidence Architecture + Task Templates — QC Task Manager

قرارات معتمدة: **Admin فقط** لإدارة القوالب (مثل `/admin/users`)، **نطاق كامل Data layer + Tests + UI**، و**تجاوز الـ gate بـ reason إلزامي للـ manager/admin** (نفس نمط checklist override الحالي).

---

## 0. الفلسفة المعمارية
- نتبع التقسيم القائم: **pure policy module** (زي `capa/index.ts`، `findings/index.ts` — بدون DB) + **mutation layer** (زي `qc-operations.ts`).
- migration `005` **additive فقط** — ما يمسّ أعمدة/جداول قائمة، يضيف فقط (آمن على الـ DBs الموجودة).
- الـ `task_attachments` تظل المخزن الفعلي للأدلة (BLOBs) — أوسّعها بأعمدة الـ metadata الناقصة بدل ما أنشئ جدول موازي.
- `task_templates` جديد كليًا (ما فيه قوالب أصلًا حاليًا).

---

## 1. الـ DB Migration `db/migrations/005_evidence_templates.sql`
ملف sequential جديد (المحرك يفحص الترقيم والـ checksum). محتواه:

**أ) جدول `task_templates`** (Canonical Template configuration):
```
id, code (unique slug مثل 'daily-inspection'), title, description,
department, priority (CHECK low/medium/high/urgent), task_type,
sla_policy_id (FK → sla_policies ON DELETE SET NULL),
checklist_json TEXT DEFAULT '[]'           — [{title, sort_order}]
evidence_requirements_json TEXT DEFAULT '[]'  — [{type, label, requirement: REQUIRED|OPTIONAL, allowed_extensions?, max_files?, description?}]
recurrence (CHECK none/daily/weekly/monthly),
finding_defaults_json TEXT DEFAULT '{}'     — {inspection_type, classification, severity, risk_level, corrective_action_required}
assignment_rules_json TEXT DEFAULT '{}'     — {default_department?, auto_assign_user_id?, allowed_assignee_role?}
lifecycle_status (CHECK DRAFT/ACTIVE/ARCHIVED) DEFAULT 'DRAFT',
version INTEGER DEFAULT 1,
created_by (FK users RESTRICT), created_at, updated_at
+ indexes على (lifecycle_status) و(department)
```

**ب) توسيع `task_attachments`** بأعمدة الـ Evidence Metadata المطلوبة:
```
evidence_type TEXT          — يربط الملف بـ evidence requirement type
evidence_label TEXT
description TEXT
source TEXT                 — manual_upload | sensor | system_generated | ...
collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL
collected_at TEXT
verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
  CHECK (verification_status IN ('UNVERIFIED','VALID','REJECTED','AI_REVIEWED','HUMAN_VERIFIED'))
```

**ج) توسيع `tasks`** برابط الـ Template + الـ Snapshot:
```
template_id INTEGER REFERENCES task_templates(id) ON DELETE SET NULL
template_snapshot TEXT      — JSON كامل لإعدادات القالب لحظة الإنشاء (لا يتغيّر لو تغيّر القالب لاحقًا)
```

**د) Seed الـ 5 أمثلة المطلوبة** (`INSERT OR IGNORE` لـ idempotency):
Daily Inspection, Weekly QC Review, Monthly Audit, Material Inspection, Non-Conformance Review — كـ `ACTIVE` templates بـ evidence_requirements واقعية (مثال Inspection: Inspection Report REQUIRED + Photo REQUIRED + Measurement XLSX OPTIONAL).

## 2. تحديث `db/schema.sql` (Reference Snapshot)
أضيف نفس الجداول/الأعمدة للـ snapshot (ملف مرجعي فقط، الـ migration runner هو المصدر).

## 3. Pure Policy Modules (جديدة، dependency-free)

### `src/lib/evidence/index.ts`
- `VERIFICATION_STATUSES = ['UNVERIFIED','VALID','REJECTED','AI_REVIEWED','HUMAN_VERIFIED']` + type + `isVerificationStatus`.
- `EVIDENCE_REQUIREMENT = ['REQUIRED','OPTIONAL']` + type + predicate.
- `EvidenceRequirement` interface (type/label/requirement/allowed_extensions/max_files/description).
- `normalizeEvidenceRequirements(json)` → ينظّف ويتحقق، يرفض التكرار في `type`.
- `requiredEvidenceTypes(requirements)` → قائمة أنواع REQUIRED فقط.
- **`computeMissingEvidence(requirements, uploadedTypes)`** → القلب: يرجع REQUIRED types اللي ما فيها ملف مرفوع. (هذا الـ pure logic للـ completion gate).
- إعادة تصدير الثوابت القائمة من `task-policy.ts` (`EVIDENCE_EXTENSIONS`, `EVIDENCE_EXT_MIME`, `EVIDENCE_SIGNATURES`, `isEvidenceExtension`) لتوحيد المصدر.
- `EVIDENCE_SOURCES` (allowed source values) + predicate.

### `src/lib/templates/index.ts`
- `TEMPLATE_LIFECYCLE = ['DRAFT','ACTIVE','ARCHIVED']` + type + `isTemplateLifecycle`.
- `TEMPLATE_TRANSITIONS` map:
  - DRAFT → ACTIVE, ARCHIVED
  - ACTIVE → ARCHIVED, DRAFT
  - ARCHIVED → DRAFT (فك الأرشفة)
- `canTransitionTemplate(from, to)`.
- `TemplateConfig` interface + `buildSnapshot(template)` → ينتج الـ JSON snapshot المستقل (يُخزّن على المهمة عند الإنشاء).
- `summarizeTemplateForForm(snapshot)` → كائن عناوين/قيم لتعبئة NewTaskForm.
- validators: `validateTemplateConfig(input)` → رسائل أخطاء واضحة.

## 4. Mutation Layer

### `src/lib/templatesStore.ts` (DB mutations، نمط qc-operations.ts)
- `listTemplates({status?, department?})`, `getTemplate(id)`, `getTemplateByCode(code)`.
- `createTemplate(input, actorId)` → يبدأ DRAFT، audit في `task_activity_log` (action `template_created` — لازم أضيفه في `activity.ts`).
- `updateTemplate(id, input, actorId)` → لا يسمح بتعديل ARCHIVED.
- `transitionTemplate(id, toStatus, actorId)` → DRAFT↔ACTIVE↔ARCHIVED.
- **`instantiateTemplate(templateId, overrides, actorId)`** → المعلمة الحرجة:
  1. يقرا القالب ويتحقق إنه ACTIVE.
  2. يبني snapshot مستقل عبر `buildSnapshot`.
  3. يُنشئ `tasks` row بالحقول من snapshot + overrides (title/assigned_to/due_date).
  4. ينسخ checklist items من snapshot.
  5. يخزّن `template_id` + `template_snapshot` على المهمة.
  6. كل شيء داخل `transaction` واحد + activity log.
- **أضيف Actions** في `src/lib/activity.ts`: `template_created`, `template_updated`, `template_archived`, `template_activated`, `template_instantiated`.

## 5. Permissions (`src/lib/permissions.ts`)
- `canManageTemplates(role)` → `role === 'admin'` (يُضاف أيضًا لـ `PERMISSIONS` object).
- `canOverrideEvidenceGate(role)` → `hasRankAtLeast(role, 'manager')`.

## 6. Validation (`src/lib/validation.ts`)
- `templateCreateSchema` (Zod): code (slug), title, description?, department, priority enum, task_type?, sla_policy_id?, checklist (array), evidence_requirements (array of objects), recurrence enum, finding_defaults (object), assignment_rules (object).
- `templateEditSchema` (partial، بدون code).
- `templateInstantiateSchema`: template_id + overrides (title?, assigned_to?, due_date?).
- إعادة استخدام `qcText`, `checkboxBool`, الـ enum preprocessor القائم.
- أضيف `'evidence_requirements'` و`'checklist'` لـ `ARRAY_FIELDS` في `formToRecord`.

## 7. Completion Gate (Server-side في `closeTask`)
هذا قلب المتطلب "لا تسمح بالـ completion لو Required Evidence ناقص":
1. في بداية `closeTask`: اقرا `template_snapshot` من المهمة، استخرج `evidence_requirements`.
2. لو فيه requirements: اقرا الأنواع المرفوعة (من `accepted` files بعد ما يُعطى كل واحد `evidence_type`)، نادِ `computeMissingEvidence`.
3. لو فيه missing:
   - موظف/مشرف → رفض فورًا برسالة: "Missing required evidence: X, Y".
   - manager/admin → اقبل `evidence_override_reason` إلزامي (نفس نمط `checklist_override_reason`)، سجّله في activity (`Action.EVIDENCE_GATE_OVERRIDE`).
4. خزّن كل ملف evidence بـ `evidence_type`/`collected_by`/`collected_at`/`source`/`verification_status='UNVERIFIED'`.
5. **Duplicate hash guard**: قبل INSERT، افحص لو نفس SHA-256 موجود لنفس المهمة → رفض "duplicate evidence file".
6. **Replacement**: لو evidence_type مرفوع وكان موجود قبل (لمهمة incomplete)، استبدل القديم (احذف row القديم، أضف الجديد) بدل الازدواجية.

كذلك أعدّل `validateEvidenceFile` لتقبل `allowed_extensions` من المتطلب (السماح بتضييق النوع لكل requirement) مع fallback للـ allowlist العام.

## 8. Admin UI (Admin-only)

### `src/pages/admin/templates/index.astro`
- frontmatter: role-gate (`canManageTemplates`)، يجلب `listTemplates()`.
- جدول يعرض: code, title, department, priority, lifecycle status, # evidences required.
- أزرار: New, Edit, Activate/Archive/Draft حسب الحالة.

### `src/pages/admin/templates/api.ts`
- نمط `admin/users/api.ts`: `requireCsrf` + `getCurrentUser` + `canManageTemplates` gate + action dispatcher (`create`/`edit`/`activate`/`archive`/`unarchive`) + Zod validation + flash + redirect.

### `src/pages/admin/templates/new.astro` و `[id]/edit.astro`
- نموذج إنشاء/تحرير: حقول القالب + editors للـ checklist وevidence_requirements (islands صغيرة تضيف صفوف ديناميكية، نمط TaskChecklistInput).

### `Navbar.tsx`
- أضيف `{ href: '/admin/templates', label: 'Templates' }` لـ `ROLE_LINKS.admin` فقط.

## 9. NewTaskForm + Task Detail + Wizard

### `src/components/NewTaskForm.astro`
- أضيف `templates: TemplateSummary[]` prop.
- `<select name="template_id">` في أعلى النموذج (optional).
- inline `<script>` (CSP-safe، Astro يجمّعه لملف خارجي): على `change` يعبّي title/description/department/priority/recurrence + يضيف checklist items، من بيانات template مضمّنة في `data-*` أو inline JSON.

### `src/pages/tasks/[id].astro`
- اقرا `template_snapshot`، استخرج `evidence_requirements` + اعرض قسم **"Required Evidence"** يوضّح المطلوب/الاختياري.
- مرّر `evidenceRequirements` لـ `TaskLifecycle` props.
- في قسم closure (مكتمل): اعرض الـ evidence مع `verification_status` badge و`collected_by`/`collected_at`.

### `src/components/TaskLifecycle.tsx`
- أضيف `evidenceRequirements` prop.
- **Step 0 (Evidence)**: لكل ملف مقبول، أضف `<select>` لاختيار `evidence_type` من المتطلبات الممكنة. أعرض checklist "Required Evidence" يعلّم كل نوع مغطّى. gate `canGoNext` على تغطية كل REQUIRED (ما لم يكن skip أو override manager).
- أرسل `evidence_type` parallel field عبر `form.append('evidence_type', type)` (نفس ترتيب `evidence`).
- أرسل `evidence_override_reason` لو فيه missing والصلاحية تسمح.

## 10. Tests (شاملة حسب المتطلبات)

### `scripts/test-templates.mjs` (جديد — نمط test-sla.mjs مع temp DB)
Pure policy asserts + DB mutations:
- **Template lifecycle**: create (DRAFT default), edit, archive, activate, invalid transitions rejected, instantiate produces snapshot.
- **Snapshot immutability**: أنشئ task من template → عدّل الـ template → الـ task snapshot ما يتغيّر (التأكيد الجوهري للمتطلب).
- **Evidence requirements parsing**: normalize، رفض تكرار type، تمييز REQUIRED/OPTIONAL.
- **Compute missing evidence**: scenarios مختلفة.

### توسيع `scripts/test.mjs` بفحوصات Evidence الجديدة
- **wrong MIME**: ملف بـ extension مسموح لكن MIME غلط → رفض (موجود، أتأكد).
- **wrong signature**: PDF مزيف (magic bytes ما تطابق) → رفض (موجود).
- **oversized**: ملف > 10MB → رفض (موجود).
- **duplicate**: نفس SHA-256 لمهمة → رفض "duplicate" (جديد).
- **unauthorized**: موظف يرفع evidence لمهمة مو له → 403 (جديد — عبر canEditTask).
- **replacement**: رفع evidence_type موجود → استبدال القديم (جديد).
- **verification_status**: default UNVERIFIED، transitions صالحة (جديد).
- **Completion gate**: مهمة بـ required evidence ناقص → closeTask مرفوض؛ manager override بـ reason ينجح؛ موظف override مرفوض (جديد).

### ربط الـ pipeline في `package.json`
- أضيف `"test:templates"` بنفس آلية `--import ../../scripts/test-ts-loader.mjs --experimental-strip-types`.
- أضيفه لـ سلسلة `"test"`.

## 11. Architecture Guard (`scripts/architecture-guard.mjs`)
- أضيف `src/lib/evidence/index.ts` و`src/lib/templates/index.ts` لـ `checkRequiredFiles` + الـ canonical set (عشان يصيروا modules رسميين محميين من تكرار الـ authority).

## 12. التوثيق
- `docs/ARCHITECTURE.md`: قسم Evidence Architecture + Task Templates (pure vs mutation split، snapshot، completion gate).
- `docs/ROLES-AND-PERMISSIONS.md`: `canManageTemplates` + `canOverrideEvidenceGate`.
- `docs/TESTING.md`: سيناريوهات الـ evidence والـ templates الجديدة.
- `README.md`: قسم Templates (الاستخدام + الأمثلة الـ 5).

## 13. التحقق (قبل التسليم)
- `pnpm --filter @brightai/qc-task-manager typecheck` → 0 errors.
- `pnpm --filter @brightai/qc-task-manager test` (migration + architecture + qc-operations + domain + sla + db-rules + **templates**) → كلها pass.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → Server built.
- `verify-security-hygiene.mjs` → pass.
- فحص يدوي: أنشئ template من UI → instantiate → ارفع evidence → أكمل مهمة (مع/بدون required مكتمل).

## 14. تحديث الـ brain
بعد نجاح كل التحقق: entry جديد برقم المهمة + ledger + قرارات (admin-only templates، snapshot immutability، completion gate override، evidence metadata columns) + الأرقام (عدد tests الجديدة).

---

## ترتيب التنفيذ المقترح
1 → 2 → 3 (pure modules) → 4 (store) → 5/6 (permissions/validation) → 7 (gate) → 11 (guard) → 10 (tests، تشتغل أولًا على الـ pure) → 8/9 (UI) → 12 (docs) → 13 (verify) → 14 (brain).

## ملاحظات مهمة
- **ما يدفع commit/push** (القاعدة الثانية) — المستخدم يلتزم.
- **ما أكسر CSP** — أي `<script>` في Astro يُجمّع خارجيًا تلقائيًا (بدون `unsafe-inline`).
- **الأدلة موجودة كم تخزين BLOB** — ما أنقلها لجدول جديد، أوسّع الـ schema فقط.
- الـ Evidence requirements مرنة: لو مهمة ما لها template، الـ snapshot فاضي والـ gate ما يفرض شي (سلوك حالي محفوظ).
