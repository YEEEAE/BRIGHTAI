حللت **HEAD الحالي في GitHub عند commit `311a0adb...`** وقارنته بالحالة اللي كانت قبل تنفيذ الحزمة السابقة. التنفيذ فعليًا كبير: صار عندك الآن migrations إلى `030`، Change Review Queue، WI Catalog، توسعة RBAC، محاذاة Air/Vacuum، Audit durability، hash chain لـ QC/Lab، وتوسعة اختبارات. لكن بعد مراجعة الكود الحالي نفسه، عندي **عدة مشاكل فعلية ما زالت موجودة** وبعضها أهم من أخطاء SQL اللي ظهرت لك.

أفصلها لك أولًا، وبعدها أعطيك الحزمة الجديدة من Prompts مكملة لـ `001–010`.

---

# أولًا: أخطاء الـ migrations اللي ظهرت لك

أغلب الأخطاء اللي أرسلتها **ليست migrations معطوبة**. المشكلة أنك تشغل ملفات migration منفردة على قاعدة مطبق عليها نفس الـ migrations مسبقًا، أو قاعدة قديمة شكل جداولها لا يطابق التسلسل الحالي.

الـ migration runner عندك مصمم يمنع إعادة تطبيق migration مسجلة عن طريق `schema_migrations` + checksum، ويشغل كل migration داخل transaction ثم `foreign_key_check`. كما أن `002` تحديدًا ليس SQL مستقلًا؛ هو marker يفسره `migrations.ts` ويشغل `reconcileLegacy()` برمجيًا.

| الملف                                  | الخطأ                              | السبب الحقيقي                                                                                 | الحكم                     |
| -------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| `002_legacy_schema_reconciliation.sql` | `SQLITE_MISUSE: not an error`      | الملف مجرد markers/comments؛ ما فيه SQL فعلي                                                  | ✅ متوقع عند تشغيله يدويًا |
| `003_sla_engine.sql`                   | duplicate `task_type`              | `ALTER TABLE tasks ADD COLUMN task_type` سبق تطبيقه                                           | ✅ إعادة تشغيل migration   |
| `005_evidence_templates.sql`           | duplicate `evidence_type`          | العمود موجود أصلًا                                                                            | ✅ إعادة تشغيل migration   |
| `006_workflow_engine.sql`              | duplicate `skills_json`            | العمود موجود أصلًا                                                                            | ✅ إعادة تشغيل migration   |
| `008_audit_integrity.sql`              | duplicate `previous_hash`          | Migration مطبقة                                                                               | ✅ إعادة تشغيل migration   |
| `011_lab_core_master_data.sql`         | duplicate `current_version_id`     | العمود موجود من 011                                                                           | ✅ إعادة تشغيل migration   |
| `012_lab_tests.sql`                    | no such `product_id`               | عندك `lab_test_records` قديم/غير متوافق؛ `CREATE TABLE IF NOT EXISTS` ما يعيد بناء جدول موجود | ⚠️ قاعدة غير متوافقة      |
| `013_lab_documents.sql`                | no such `code`                     | `lab_documents` موجود بشكل قديم/ناقص                                                          | ⚠️ قاعدة غير متوافقة      |
| `020_lab_sample_status.sql`            | no such `lab_test_samples.test_id` | prerequisite schema لـ012 غير موجود بالشكل الصحيح                                             | ⚠️ قاعدة غير متوافقة      |
| `023...`                               | duplicate `approved_at`            | مطبق مسبقًا                                                                                   | ✅ إعادة تشغيل migration   |
| `024...`                               | no such `created_by`               | جدول `lab_test_records` الموجود لا يطابق schema الحالي                                        | ⚠️ قاعدة غير متوافقة      |

مثلًا `003` يحتوي فعلًا `ALTER TABLE tasks ADD COLUMN task_type` بدون `IF NOT EXISTS`. هذا صحيح في migration sequential، لكنه سيفشل طبيعيًا لو شغلته للمرة الثانية.  ونفس الشيء في `005`, `006`, `008`, `011` و`023`.

## لا تصلحها بهذه الطريقة

**لا تعدل migrations 001–030 وتضيف `IF NOT EXISTS` عشوائيًا.**

عندك checksum guard. أي تعديل على migration سبق تطبيقها سيخلي قاعدة موجودة ترفض الإقلاع بسبب checksum drift.

الطريقة الصحيحة لتشغيل قاعدة البيانات هي:

```bash
cd apps/qc-task-manager

pnpm db:init
```

ولقاعدة disposable فقط:

```bash
pnpm db:reset
```

`init-db.mjs` نفسه مصمم يستخدم نفس migration runner الموجود في التطبيق.

**لا تستخدم `db:reset` على قاعدة فيها بيانات حقيقية.**

---

# ثانيًا: تقييمي للتعديلات الجديدة

البنية تحسنت بوضوح. خصوصًا:

* صار عندك **30 migration**.
* Change Review Queue موجود فعليًا.
* Employee/Supervisor proposals منفصلة عن canonical master data.
* WI Catalog دخل قاعدة البيانات.
* Scientific hard-coded defaults انشالت من `policy.ts`.
* Connector labels تصححت.
* Audit task deletion تحسن كثير.
* QC/Lab صار له hash chain.
* Template self-approval protection أضيف.
* Reporting tests توسعت.
* Notifications الجديدة داخلة بنفس النظام بدل نظام موازي.

الـ `policy.ts` الحالي فعلًا صار يقول إن Reference Values مصدرها Approved Template Versions، وما عاد يحتوي scientific defaults.

لكن فيه مشاكل لازم تتعالج.

---

# أهم المشاكل الحالية

## P0 — 1. Reporting endpoints غير موجودة في GitHub HEAD

هذي أهم مفاجأة.

الـ `mind` الحالي يقول إن:

```text
/api/reports/[reportType].csv|xlsx|pdf
/api/reports/audit
```

موجودة ومثبتة E2E.

لكن في **GitHub HEAD الحالي**:

* حاولت أقرأ endpoint المتوقع → `404`.
* بحثت عن `/api/reports` implementation → ما ظهر endpoint source.
* commit الخاص بـ Prompt 008 عدل reporting libs والـUI والاختبار، لكنه ما أضاف route files.

وفي نفس الوقت `/reports` ما زال يبني روابط مباشرة لها:

```text
/api/reports/${selectedType}.csv
/api/reports/${selectedType}.xlsx
/api/reports/${selectedType}.pdf
/api/reports/audit
```

الاحتمال الأقرب: الـ endpoints كانت موجودة **محليًا كـ untracked/uncommitted files** وقت تشغيل E2E ثم ما دخلت GitHub.

هذا Source-of-Truth drift خطير.

---

# P0 — 2. Full E2E blocker القديم ما زال موجودًا

`e2e-task-search.mjs` الحالي إلى الآن:

```text
finally {
   ...
   db.close();
}
```

لكن **ما فيه `await browser.close()`**.

يعني المشكلة القديمة اللي كانت توقف الـ acceptance runner بعد Search ما زالت موجودة في GitHub الحالي.

بالتالي ما أقدر أقول إن Prompt 010 النهائي تحقق فعليًا.

---

# P1 — 3. Change Request للـ Retest يعيد اختراع منطق Retest

هذي مشكلة فعلية في الكود.

في:

```text
src/lib/lab/changeRequests.ts
```

لما Manager يعتمد `RETEST_REQUEST`، الكود ينشئ:

* `lab_test_retests`
* `lab_test_records`

يدويًا.

بينما عندك أصلًا canonical service كاملة:

```ts
createLabRetest()
```

في:

```text
src/lib/lab/retests.ts
```

وهي أفضل لأنها:

* تخصص Retest Number بطريقة race-aware.
* تولد `LAB-TEST-xxxxx`.
* تعمل audit.
* تعمل notification.
* تنسخ controlled context بالطريقة المركزية.

النسخة الموجودة داخل Change Request تنشئ test number:

```text
PENDING-CR-${request.id}
```

ولا أرى أنها تحوله بعدين إلى:

```text
LAB-TEST-000xx
```

هذه **Bug وظيفية حقيقية**.

الحل:

```text
Change Request Approval
        ↓
createLabRetest(...)
```

فقط.

لا يكون فيه implementation ثاني.

---

# P1 — 4. Audit durability ما زالت ناقصة في `qc_audit_log`

Migration 030 أصلحت:

```text
task_activity_log
```

وشالت FK cascading من `task_id` عشان يبقى التاريخ بعد حذف المهمة. ممتاز.

لكن `qc_audit_log.task_id` في schema ما زال مرتبطًا بالمهمة بـ:

```sql
REFERENCES tasks(id) ON DELETE CASCADE
```

وهذا يعني لو Finding/QC audit row مرتبط بـ Task وانحذفت المهمة، audit row ممكن ينحذف.

والآن بما إنك أضفت hash chain إلى `qc_audit_log`، حذف صف من وسط السلسلة ممكن يكسرها أيضًا.

يعني Prompt 009 أصلح نصف المشكلة، مو كلها.

الحل الصحيح:

```text
qc_audit_log.task_id
```

يصير historical identity وليس cascade-owned child.

---

# P1 — 5. WI import ينسب الـ33 WI لأول مستخدم في النظام

هذا مهم.

في:

```ts
const firstUser =
  SELECT id FROM users ORDER BY id LIMIT 1
```

ثم كل WI المستوردة تدخل:

```text
created_by = firstUser.id
```

يعني قاعدة البيانات تقول إن أول User هو اللي **أنشأ** الـ33 WI، وهذا غير صحيح.

وأكثر من كذا: `permissions.ts` يعتبر `created_by` جزءًا من self-approval/ownership rules، فـ fake provenance قد يؤثر على الصلاحيات.

الحل الأنظف:

```text
creation_origin = USER | SOURCE_IMPORT
created_by nullable فقط للـ SOURCE_IMPORT
source_page
source_row_no
imported_at
```

ولا ننسب الوثيقة لإنسان ما أنشأها.

---

# P1 — 6. فيه Data-loss edge case داخل Sample Grid

في `LabTestForm.tsx` أضفت:

```text
applied_pressure
volume_liter
```

لكن:

```ts
isRowEmpty()
```

ما يفحصهم.

النتيجة:

لو المستخدم عبّى فقط:

```text
Applied Pressure
Volume (liter)
```

ثم قلل عدد العينات، النظام ممكن يعتبر الصف "فارغ" ويحذفه **بدون confirmation**.

هذا لازم يتصلح فورًا.

---

# P1 — 7. Sample Result ما زال يسمح HOLD

النموذج الورقي اللي أعطيتني إياه كان Sample-level:

```text
Pass / Fail
```

أما Final Result:

```text
PASS
FAIL
HOLD / FURTHER EVALUATION
```

لكن `policy.ts` عندك إلى الآن يستخدم نفس:

```ts
LAB_RESULT_OPTIONS = ['PASS', 'FAIL', 'HOLD']
```

للـ sample والـ final.

الأفضل تفصل:

```text
LAB_SAMPLE_RESULT_OPTIONS
PASS | FAIL

LAB_FINAL_RESULT_OPTIONS
PASS | FAIL | HOLD
```

إلا إذا عندك مستند رسمي ثاني يثبت Sample HOLD.

---

# P1 — 8. `pnpm test` للحين مو كل الاختبارات

عندك scripts:

```text
test:lab-print
test:lab-retention
```

لكن `pnpm test` الحالي لا يشغلهم ضمن aggregate.

فعبارة:

> `pnpm test` شامل كل شيء

ما زالت غير صحيحة حرفيًا.

الحل مو بس تضيفهم يدويًا؛ الأفضل تسوي **test manifest guard** يمنع تكرار المشكلة مستقبلًا.

---

# P2 — 9. Permission WI مربوط برقم Register محدد

في `permissions.ts`:

```ts
doc.source_register_code === 'F-4-2-1-2'
```

مستخدم كجزء من السماح ببدء محتوى catalog-only.

هذا راح ينكسر أول ما تضيف:

* Page 2/3 من Register آخر.
* SOP Catalog.
* WI Register جديد.

الـ authorization ما المفروض يعرف رقم نموذج ورقي.

الأصح:

```text
creation_origin === SOURCE_IMPORT
current_version_id === null
status === DRAFT
owner_id === null
```

---

# P2 — 10. Legacy fields ظاهرة للمستخدم مع الحقول الجديدة

في Sample grid حاليًا تعرض:

```text
Applied Pressure (kpa)
Actual Pressure (legacy)

Volume (liter)
Volume (Sec.) (legacy)
```

مع بعض.

تقنيًا هذا يحافظ على البيانات، لكن UX سيئ.

المستخدم الجديد ما يحتاج يشوف legacy fields أصلًا.

الحل:

* New Tests → الحقول الحديثة فقط.
* Historical Test يحتوي legacy data → قسم:

```text
Legacy Recorded Data
```

read-only أو expandable.

---

# P2 — 11. Test Template workflow ناقص مرحلة Review واضحة

الـ Template الحالي:

```text
DRAFT
→ ACTIVE
→ ARCHIVED
```

والاعتماد يرفع أحدث version مباشرة إلى ACTIVE.

بما أنك الآن تسمح Employee/Supervisor بإنشاء Template Draft، الأفضل يكون:

```text
DRAFT
↓ Submit
IN_REVIEW
↓ Approve
APPROVED / ACTIVE
```

مع:

* submitted_by
* submitted_at
* reviewed_by
* reviewed_at
* approved_by
* approved_at

والـ approver ما يكون author.

---

# P2 — 12. Cancel Change Request مسجل كـ REJECTED

عندك:

```ts
cancelOwnPendingChangeRequest()
```

ويعمل:

```text
status = REJECTED
reviewed_by = requester نفسه
review_note = Cancelled by requester
```

بدون Audit كامل.

هذا semantic غلط.

لازم:

```text
CANCELLED
cancelled_by
cancelled_at
```

ولا نحط requester في `reviewed_by`.

---

# P2 — 13. Approval audit للـ Change Request before/after غير مفيد

في approve:

```text
old_value = proposed_snapshot_json
new_value = proposed_snapshot_json
```

يعني Before = After.

الأفضل:

```text
old_value = PENDING
new_value = APPROVED
```

والـ proposed/base snapshots موجودة أصلًا في request.

---

# P2 — 14. Notifications تمتص DB errors

`createNotification()` حاليًا:

```ts
catch {
   console.error(...)
   return false
}
```

للإشعارات العادية مقبول.

لكن لشيء مثل:

```text
Master Data approval request
Document approval
Test rejection
```

إذا فشل notification insert، التغيير يكمل بصمت.

الأفضل تضيف:

```text
best-effort notification
required workflow notification
```

بنفس جدول `notifications`، مو نظام ثاني.

---

# P2 — 15. Middleware صار Controller ضخم

`middleware.ts` حاليًا يتعامل مع:

* Tests
* Products
* Templates
* Equipment
* Calibration
* Retests
* Change Requests
* Documents
* وغيرها.

وهذا أحد أسباب صعوبة معرفة Route موجودة أو لا.

على المدى المتوسط:

```text
middleware.ts
= auth + CSP + high-level route walls

src/pages/api/**
= controllers

src/lib/**
= domain
```

هذا أنظف كثير.

---

# تقييمي الحالي

| المجال                   | قبل التوسعة |                          الآن |
| ------------------------ | ----------: | ----------------------------: |
| Architecture             |          87 |                        **91** |
| Database design          |          86 |                        **89** |
| Laboratory functionality |          82 |                        **92** |
| Auditability             |          76 |                        **89** |
| Security                 |          81 |                        **88** |
| RBAC                     |          85 |                        **93** |
| Testing depth            |          67 |                        **83** |
| UX                       |          76 |                        **79** |
| Reporting                |          65 | **؟ — GitHub route mismatch** |
| Production readiness     |          68 |                        **76** |

أنا ما أرفع Production Readiness أكثر من كذا الآن بسبب:

1. Reporting source mismatch.
2. Full E2E hang ما زال موجود.
3. Retest proposal duplicate path.
4. QC audit cascade.
5. ما فيه production verification.

---

# تحسينات إضافية أنصح بها على مستوى النظام كامل

## Database

أضيف:

* `db:doctor`.
* Schema fingerprint.
* Migration checksum report.
* Controlled source provenance.
* Optimistic concurrency لـ Documents/Templates.
* Audit correlation IDs.
* DB-level freeze triggers للـ APPROVED/VOID records.
* FTS5 لاحقًا للـ WI/SOP/Test search إذا البيانات كبرت.

## Laboratory

أضيف:

* Template-driven Form Definition بدل hardcoding كل ورقة جديدة في React.
* Sample Excel-like paste.
* Keyboard navigation بالسهم/Tab.
* Copy-down للقيم المتكررة.
* Autosave Draft اختياري.
* Deterministic Pre-submit Check.
* Equipment calibration warning داخل form.
* Retest lineage graph.
* Test → WI/SOP → Template → Equipment traceability panel.
* Approved reference provenance بجانب كل Reference Value.

## Documents

أضيف:

* deterministic version diff.
* "Missing Content" backlog.
* Assigned author.
* Due date لاستكمال WI.
* Document ownership handover.
* Bulk linking WI ↔ Products.
* Acknowledgement progress per document.
* Source page/row provenance.

## Change Review

أضيف:

* Structured field diff.
* Conflict resolution.
* Withdraw Request.
* Resubmit from rejected request.
* Link canonical audit event to request.
* SLA لـ pending review.
* Dashboard "waiting >24h".

## UX

أقوى تغيير أنصح فيه:

**Role-oriented Lab Home** بدل نفس الصفحة للجميع.

Employee:

```text
My Tests
My Drafts
My WI Drafts
My Change Requests
Items Returned for Changes
Quick New Test
```

Supervisor:

```text
Tests Awaiting Review
Documents Awaiting Review
Team Activity
Open Retests
```

Manager/Admin:

```text
Approval Queue
Change Requests
Audit Health
Calibration Risks
Document Risks
Pending Master Data
```

هذا يقلل التشتيت بشكل كبير.

## Design

* Sticky bottom action bar في النماذج الطويلة.
* Progress indicator:

```text
1 Identification
2 Equipment
3 Conditions
4 Samples
5 Result
6 Review
```

* Status colors موحدة.
* Side panel للـ References.
* Side-by-side Before/After في Change Requests.
* Print Preview حقيقي.
* Legacy data مخفية عن العمليات الجديدة.

## Security

أضيف:

* DB structural freeze للأوضاع النهائية.
* Audit-chain health check إداري.
* Correlation/request ID لكل mutation.
* Security event log للـ failed e-signature.
* Re-auth timeout قبل approval لو الجلسة قديمة.
* Hide entity existence للـ employee where appropriate.
* CSRF + `Sec-Fetch-Site` defense-in-depth.

## AI

الـ AI عندك الأفضل يظل:

```text
Advisory only
```

وأضيف له:

* Change Request summary.
* WI version change summary.
* "Missing controlled references" detector.
* Review preparation.
* Data-quality explanation.

لكن **ولا واحد** منهم:

* يعتمد.
* يقرر PASS/FAIL.
* يغيّر DB مباشرة.

---

# الحزمة الجديدة من Prompts

الحزمة السابقة `001–010` تعتبر الأساس المنفذ.

لا تعيد تنفيذها Blindly.

الترتيب الجديد:

```text
001–010  ← implemented baseline
011      DB Doctor + Migration UX
012      Post-implementation correctness fixes
013      Audit durability completion
014      WI provenance cleanup
015      Lab Form UX + data integrity
016      Template workflow v2
017      Reporting + Route Source of Truth
018      Test/E2E completeness
019      Production health + backup hardening
020      UX/Accessibility/Performance
021      Final independent verification
```

---

# Prompt 011 — Database Doctor + Migration Safety

```text
# QC-DB-MIGRATION-DOCTOR-011

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Eliminate migration confusion without modifying historical migrations 001–030.

CRITICAL:
DO NOT MODIFY THE CONTENT OF ANY APPLIED MIGRATION 001–030.

The migration runner uses checksums and editing historical files can break
existing databases.

READ FIRST:

src/lib/migrations.ts
src/lib/db.ts
scripts/init-db.mjs
scripts/test-migrations.mjs
db/migrations/001-030
db/schema.sql
package.json

KNOWN USER IDE ERRORS:

002 → SQLITE_MISUSE
003 → duplicate task_type
005 → duplicate evidence_type
006 → duplicate skills_json
008 → duplicate previous_hash
011 → duplicate current_version_id
012 → missing product_id
013 → missing code
020 → missing lab_test_samples.test_id
023 → duplicate approved_at
024 → missing created_by

These errors occurred while executing migration SQL manually against an
already-migrated or incompatible database.

DO NOT "fix" these errors by making old migrations standalone-idempotent.

────────────────────────
1. CREATE DB DOCTOR
────────────────────────

Create:

scripts/db-doctor.mjs

Add package scripts:

db:status
db:verify

The tool must print:

Resolved database path
File exists
File size
WAL mode
foreign_keys state
schema migration version
latest repository migration version
applied migration count
migration failures count

Run:

PRAGMA integrity_check
PRAGMA foreign_key_check

Print:

PASS / FAIL

────────────────────────
2. MIGRATION STATUS
────────────────────────

Read:

schema_migrations

Display:

version
name
applied_at
checksum state

Compare every stored checksum with repository migration checksum.

Report:

MATCH
MISSING
DRIFT

Do not mutate anything.

────────────────────────
3. REQUIRED SCHEMA DIAGNOSTICS
────────────────────────

Check required tables and important columns.

At minimum verify:

tasks.task_type
task_attachments.evidence_type
users.skills_json
task_activity_log.previous_hash
lab_test_templates.current_version_id
lab_test_records.product_id
lab_test_records.created_by
lab_documents.code
lab_documents.approved_at
lab_test_samples.test_id

If missing:

print exact explanation:

"The database schema is incompatible with migration history."

Do not automatically ALTER the table.

────────────────────────
4. SAFE USER GUIDANCE
────────────────────────

At the end print:

For existing database:
pnpm db:init

For disposable local database only:
pnpm db:reset

Never recommend db:reset if database contains production/user data.

Explicitly state:

Do not execute individual migration files from DataGrip/SQLTools.

002 is a runner marker and is not a standalone SQL migration.

────────────────────────
5. FIX IN-MEMORY BACKUP EDGE CASE
────────────────────────

Inspect backupBeforeMigration().

Ensure a destructive migration using an in-memory SQLite database does not call:

copyFileSync(':memory:', ...)

Handle :memory: explicitly.

Do not weaken backup behavior for real file databases.

────────────────────────
6. TESTS
────────────────────────

Test:

fresh DB
fully migrated DB
legacy DB
incompatible old table shape
checksum drift
missing migration
foreign key violation
integrity failure reporting
:memory: destructive migration behavior

No commit.
No push.
No deploy.

Return evidence only.
```

---

# Prompt 012 — Correctness Fixes After 001–010

```text
# QC-POST-IMPLEMENTATION-CORRECTNESS-012

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Fix concrete correctness issues discovered after implementation of Prompts 001–010.

Do not redesign unrelated features.

READ:

src/lib/lab/changeRequests.ts
src/lib/lab/retests.ts
src/lib/permissions.ts
src/components/lab/LabTestForm.tsx
src/lib/lab/policy.ts
scripts/test-lab-change-requests.mjs
scripts/test-lab-retests.mjs
scripts/test-lab-form.mjs

────────────────────────
1. RETEST CHANGE REQUEST
────────────────────────

REMOVE duplicated retest creation logic from:

changeRequests.ts

Change Request approval for RETEST_REQUEST MUST reuse:

createLabRetest()

from:

src/lib/lab/retests.ts

Do not directly INSERT:

lab_test_retests
lab_test_records

inside changeRequests.ts.

Required result:

manager approves employee retest request
→ createLabRetest()
→ canonical LAB-RETEST number
→ canonical LAB-TEST-xxxxx new test number
→ canonical audit
→ canonical notification
→ change request marked APPROVED

No PENDING-CR-* test numbers may remain.

Test concurrent sequence allocation.

────────────────────────
2. CHANGE REQUEST APPROVAL AUDIT
────────────────────────

Current approval audit must not store identical proposal JSON as both old/new.

Use:

old_value = PENDING
new_value = APPROVED

For rejection:

old_value = PENDING
new_value = REJECTED

Proposal/base payloads remain on lab_change_requests.

Keep review_note.

────────────────────────
3. CHANGE REQUEST CANCELLATION
────────────────────────

Do not represent requester cancellation as REJECTED.

If cancellation feature is used, create migration:

031_lab_change_request_lifecycle.sql

Add status:

CANCELLED

Add:

cancelled_at

Requester cancellation:

status = CANCELLED
reviewed_by = NULL
reviewed_at = NULL
cancelled_at = now

Audit:

STATUS_TRANSITION
PENDING → CANCELLED

Do not create a fake reviewer.

If cancellation feature is unused, remove dead function instead of carrying
incorrect semantics.

────────────────────────
4. SAMPLE GRID DATA LOSS
────────────────────────

Fix isRowEmpty() in LabTestForm.tsx.

It MUST include:

applied_pressure
volume_liter

If a user reduces sample_count and any removed row contains either value,
the confirmation dialog must appear.

Add regression tests.

────────────────────────
5. RESULT OPTION SEPARATION
────────────────────────

Separate:

LAB_SAMPLE_RESULT_OPTIONS
LAB_FINAL_RESULT_OPTIONS

For the supplied FR-MA-018 paper source:

sample:
PASS
FAIL

final:
PASS
FAIL
HOLD

Do not assume other templates need the same rule.

If result options should eventually be template-specific, design the code so
the template can override the allowed sample results without hard-coding
scientific decisions.

────────────────────────
6. TESTS
────────────────────────

Cover:

employee retest request
manager approval
canonical retest service used
valid LAB-TEST number
notifications
audit
sample applied_pressure removal warning
sample volume_liter removal warning
sample HOLD rejected where form policy is PASS/FAIL
final HOLD accepted

No commit/push/deploy.
```

---

# Prompt 013 — Complete Audit Durability

```text
# QC-AUDIT-DURABILITY-COMPLETION-013

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

DEPENDENCY:
Migration 030 already exists.

MISSION
Close the remaining deletion/audit integrity gap in qc_audit_log.

READ:

db/migrations/030_audit_durability.sql
db/schema.sql
src/lib/audit/qcChain.ts
src/lib/deleteRequests.ts
src/lib/qc-operations.ts
src/lib/lab/**
scripts/test-audit-integrity.mjs
scripts/test-delete-durability.mjs

CURRENT RISK

task_activity_log.task_id was converted to historical identity.

But qc_audit_log.task_id still has a task FK with ON DELETE CASCADE.

A legitimate task deletion must never remove QC/Lab audit rows or break the
QC audit hash chain.

────────────────────────
MIGRATION 032
────────────────────────

Create:

032_qc_audit_task_identity.sql

Safely rebuild qc_audit_log.

Preserve:

id
entity_type
entity_id
task_id
actor_id
action
old_value
new_value
note
created_at
previous_hash
event_hash

Change task_id from task-owned cascade FK to historical integer identity.

Do not change task_id values.

Keep actor_id FK RESTRICT.

Preserve all rows and IDs.

Recreate indexes.

────────────────────────
HASH CHAIN
────────────────────────

Because payload values are unchanged, preserve valid hashes where safe.

Verify the chain before and after migration.

Do not silently rehash tampered data.

If legacy rows need a defined genesis boundary, retain the existing explicit
boundary model.

────────────────────────
STRUCTURAL TEST
────────────────────────

Create:

task
finding linked to task
qc_audit_log events with task_id
valid QC chain

Then perform approved task deletion.

Assert:

task removed
task deletion history survives
task_activity_log survives
qc_audit_log rows survive
task chain valid
QC chain valid

Also test manual tampering is still detected.

────────────────────────
ADMIN HEALTH
────────────────────────

Expose a reusable read-only helper:

verifyAllAuditChains()

Return:

task chain status
QC/Lab chain status
last verified timestamp if persisted elsewhere later

Do not perform expensive full chain verification on every public health request.

No commit/push/deploy.
```

---

# Prompt 014 — WI Provenance Cleanup

```text
# QC-WI-PROVENANCE-014

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Remove false human authorship from imported WI catalog identities and make
paper-source provenance explicit.

READ:

src/lib/lab/wiCatalog.ts
src/lib/lab/documents.ts
src/lib/permissions.ts
db/migrations/013_lab_documents.sql
db/migrations/029_wi_catalog_import.sql
db/schema.sql

CURRENT PROBLEM

The importer selects:

SELECT id FROM users ORDER BY id LIMIT 1

and stores that person as created_by for all imported WI catalog identities.

That user did not author/import those paper documents and this false identity
can affect ownership/self-approval rules.

────────────────────────
MIGRATION 033
────────────────────────

Create a safe row-preserving migration.

Add:

creation_origin TEXT NOT NULL DEFAULT 'USER'
CHECK creation_origin IN ('USER','SOURCE_IMPORT')

source_page INTEGER NULL
source_row_no INTEGER NULL
imported_at TEXT NULL

Allow lab_documents.created_by to be NULL for SOURCE_IMPORT records.

Existing USER-created records retain their real created_by.

Imported F-4-2-1-2 catalog records become:

creation_origin = SOURCE_IMPORT
created_by = NULL
source_page = 1
source_row_no = 1..33
imported_at = preserved migration/import timestamp

Do not change:

code
title
source_revision
source_date
content
current_version_id
workflow status

────────────────────────
APPLICATION ENFORCEMENT
────────────────────────

User-created SOP/WI MUST still require session created_by.

Only SOURCE_IMPORT may have created_by NULL.

Enforce this in service code.

Do not rely solely on UI.

────────────────────────
PERMISSIONS
────────────────────────

Remove hard-coded authorization dependency on:

source_register_code === 'F-4-2-1-2'

Catalog-only first-content permission should instead rely on:

creation_origin = SOURCE_IMPORT
current_version_id IS NULL
status = DRAFT
owner_id IS NULL

Any future imported source register should work automatically.

────────────────────────
FIRST CONTENT
────────────────────────

When a user starts real content:

owner_id = session user
version.author_id = session user

Do NOT rewrite the source catalog's creation_origin.

The distinction remains:

paper identity imported from source
digital content authored by user

────────────────────────
UI
────────────────────────

Display:

Source Register
Source Page
Source Row
Source Revision
Source Date
Imported Record

Do not label importer metadata as "Created by Administrator".

────────────────────────
TESTS
────────────────────────

Verify:

33 WI rows
created_by NULL for source import
source rows 1–33
page=1
no fake owner
employee can start content
first author becomes owner
self-approval rules use real author/owner
future different register works without permission code change

No commit/push/deploy.
```

---

# Prompt 015 — Laboratory Form UX + Data Integrity

```text
# QC-LAB-FORM-UX-INTEGRITY-015

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Make the laboratory test form fast, clear and safe for daily operator use while
preserving exact historical data and approved-template references.

READ:

src/components/lab/LabTestForm.tsx
src/lib/lab/tests.ts
src/lib/lab/policy.ts
src/lib/lab/reference-panel.ts
src/pages/lab/tests/new.astro
src/pages/lab/tests/[id].astro
src/pages/lab/tests/[id]/print.astro

────────────────────────
1. LEGACY FIELD UX
────────────────────────

New tests must NOT ask operators to enter both:

Applied Pressure
Actual Pressure (legacy)

or:

Volume (liter)
Volume (Sec.) (legacy)

For NEW records:

show current paper-aligned fields only.

For existing historical records that contain legacy values:

show:

"Legacy Recorded Data"

inside a collapsible/read-only section.

Never delete or reinterpret old values.

────────────────────────
2. PAPER LABEL
────────────────────────

Display:

Testing Area

for the existing sampling_area field when using this form.

Do not rename/delete the historical DB column merely for a UI label.

────────────────────────
3. STICKY ACTION BAR
────────────────────────

For the long form create a responsive sticky action bar:

Save Draft
Save and Continue
Submit for Review
Cancel

Always show:

Draft / Unsaved Changes state.

Do not hide validation errors behind the bar.

────────────────────────
4. SECTION NAVIGATION
────────────────────────

Create accessible section navigation:

1 Sample Identification
2 Equipment
3 Requirements
4 Connector Assembly
5 Environment
6 Samples
7 Final Result
8 Review

Show completed/incomplete state deterministically.

Do not calculate scientific pass/fail.

────────────────────────
5. SAMPLE TABLE PRODUCTIVITY
────────────────────────

Add keyboard-friendly spreadsheet behavior without a heavy grid dependency.

Support:

Tab progression
Arrow navigation where practical
Copy cell
Paste tab/newline-separated cells from spreadsheet
Copy-down selected value
Clear row

All pasted values MUST go through existing server validation.

Never allow pasted row count beyond configured sample_count.

────────────────────────
6. REFERENCES
────────────────────────

Reference panel must clearly show:

Approved Template
Template Version
Effective Date
Source document reference if available

Display all populated approved parameters.

Missing values:

No approved reference available.

Never substitute a global fallback.

────────────────────────
7. TEMPLATE REQUIREMENT POLICY
────────────────────────

Introduce a configurable template property:

requires_approved_template_for_submission

Default should preserve current behavior.

Do NOT globally require templates without business evidence.

If enabled for a template/test configuration:

Draft may save without template.
Submit must have compatible approved template.

────────────────────────
8. ACCESSIBILITY
────────────────────────

Error summary links/focus to failing fields.

Use:

aria-invalid
aria-describedby
fieldset/legend for result groups
proper table headers
keyboard-operable dynamic rows

Do not weaken CSP.

────────────────────────
9. PRINT
────────────────────────

Print current fields only.

Historical legacy values may appear in a clearly labeled Legacy Data block.

Do not mix units.

────────────────────────
10. TESTS
────────────────────────

Unit + browser tests for:

keyboard flow
paste
sample count limits
legacy hidden on new test
legacy visible on historical test
validation focus
reference provenance
print
mobile layout

No commit/push/deploy.
```

---

# Prompt 016 — Controlled Template Workflow V2

```text
# QC-LAB-TEMPLATE-WORKFLOW-V2-016

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Give contributor-authored Test Templates a real review/approval lifecycle.

READ:

src/lib/lab/templates.ts
src/lib/permissions.ts
src/components/lab/LabTemplateForm.astro
src/pages/lab/templates/**
src/lib/lab/esignature.ts
db/migrations/011_lab_core_master_data.sql
db/migrations/028_lab_test_form_alignment.sql

────────────────────────
MIGRATION 034
────────────────────────

Extend lab_test_template_versions with:

status TEXT
CHECK:
DRAFT
IN_REVIEW
APPROVED
SUPERSEDED

submitted_by
submitted_at

reviewed_by
reviewed_at

approved_at

Backfill:

approved_by IS NOT NULL → APPROVED
else → DRAFT

Do not lose version history.

────────────────────────
WORKFLOW
────────────────────────

DRAFT
↓ Submit
IN_REVIEW
↓ Approve
APPROVED

When a later version is approved:

previous APPROVED version → SUPERSEDED

Template identity remains:

DRAFT/ACTIVE/ARCHIVED

ACTIVE means it has an approved current version.

────────────────────────
RBAC
────────────────────────

Employee/Supervisor:

create own DRAFT
edit own DRAFT
submit own DRAFT

Supervisor+:
review another user's template

Manager/Admin:
approve another user's template

No author/creator may approve their own current version.

Keep permissions.ts as single authority.

────────────────────────
E-SIGNATURE
────────────────────────

Use the existing e-signature infrastructure for template approval.

Do not create another password verification system.

Audit:

submitted
reviewed
approved
superseded

────────────────────────
IDENTITY IMMUTABILITY
────────────────────────

After first approved version:

template code becomes immutable.

Evaluate whether test_type should be immutable after first approval.

If changing test_type would alter historical meaning, create a new template
instead of mutating the old identity.

Do not silently rewrite historic interpretation.

────────────────────────
CONCURRENCY
────────────────────────

Prevent two editors from overwriting the same template draft.

Use updated_at/version token optimistic concurrency.

Show conflict instead of last-write-wins.

────────────────────────
TESTS
────────────────────────

All four roles
self approval
e-signature
version supersede
concurrency conflict
archived freeze
approved reference selection

No commit/push/deploy.
```

---

# Prompt 017 — Reporting + Route Source of Truth

```text
# QC-ROUTE-AND-REPORTING-SOURCE-TRUTH-017

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Resolve the mismatch between reporting UI/tests/mind records and the actual
GitHub repository routes.

IMPORTANT:
Do not trust prior task notes.
Treat the current repository tree as source of truth.

READ:

src/pages/reports.astro
src/pages/lab/reports.astro
src/pages/api/**
src/lib/reporting/**
scripts/e2e-reports.mjs
src/middleware.ts
.agents/mind/01-mind-latest.md

────────────────────────
1. INVENTORY
────────────────────────

Enumerate every real file-based route.

Verify whether these ACTUALLY exist in source:

GET /api/reports/<reportType>.csv
GET /api/reports/<reportType>.xlsx
GET /api/reports/<reportType>.pdf
GET /api/reports/audit

Do not infer existence because an E2E test references them.

────────────────────────
2. IF MISSING
────────────────────────

Implement actual Astro-supported endpoint files.

Choose a routing pattern that Astro 6 build proves works.

Do not invent a filename syntax without testing it.

Endpoint must reuse:

report catalog
authorizeReport()
filters parser
writers
report_audit_log

No reporting logic duplicated in route file.

────────────────────────
3. ROUTE MANIFEST
────────────────────────

Create:

scripts/route-manifest.mjs

Generate/validate a normalized route inventory from src/pages.

Add architecture test asserting:

every internal UI href/form action referring to required API routes has a
matching actual route or documented middleware route.

This should prevent phantom routes.

────────────────────────
4. MIDDLEWARE ROUTES
────────────────────────

Explicitly document middleware-short-circuited routes separately from file routes.

Long-term target:

middleware = cross-cutting auth/security
API/page handlers = request controllers

Do not perform a huge refactor in this prompt.

────────────────────────
5. E2E
────────────────────────

Run e2e-reports against a clean build produced from the exact Git commit/worktree
being tested.

Before starting, record:

git status --porcelain
git rev-parse HEAD

If untracked source files are present:

verification is NOT reproducible.

Do not claim PASS until the route source is tracked.

────────────────────────
6. TESTS
────────────────────────

Every 24 report types × supported formats
audit route
anonymous
employee
supervisor
manager
admin
invalid report
invalid format
unsupported filters
content type
filename
non-empty body
audit row

No commit/push/deploy.
```

---

# Prompt 018 — Test Manifest + Full E2E Completion

```text
# QC-TEST-COMPLETENESS-018

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Make "all tests passed" mechanically true and prevent test scripts from being
silently excluded from the aggregate.

READ:

package.json
scripts/test*.mjs
scripts/e2e*.mjs
scripts/e2e-acceptance.mjs

────────────────────────
1. UNIT TEST MANIFEST
────────────────────────

Identify every package script matching:

test:*

Exclude only deliberate meta/interactive aliases.

The aggregate must include every canonical test suite.

Current known omissions to verify:

test:lab-print
test:lab-retention

Do not assume this list is complete.

────────────────────────
2. MANIFEST GUARD
────────────────────────

Create a test that fails if:

a canonical test:* script exists
but is not included in the supported full-test manifest.

Avoid circular test:test invocation.

Prefer one explicit manifest in code over duplicating a huge shell chain in
multiple places.

────────────────────────
3. E2E RESOURCE CLEANUP
────────────────────────

Fix every Playwright E2E suite to close:

pages
contexts
browser
database

in finally.

Known file to inspect:

scripts/e2e-task-search.mjs

It currently closes the DB but must also close its browser resources.

────────────────────────
4. ACCEPTANCE RUNNER
────────────────────────

Each child suite gets:

timeout
exit-code capture
stdout/stderr capture
cleanup

One hung suite must fail with:

TIMEOUT

not block forever.

────────────────────────
5. EXACT RESULT
────────────────────────

Run:

pnpm test
pnpm typecheck
pnpm build
pnpm e2e:acceptance

Report:

all unit suites
all E2E suites
assertion counts
duration
timeouts
failures

Do not call E2E green until the parent process exits 0.

────────────────────────
6. REPRODUCIBILITY
────────────────────────

At run start print:

HEAD SHA
dirty/untracked status
Node version
pnpm version
DB path

No commit/push/deploy.
```

---

# Prompt 019 — Production Health + Backup Hardening

```text
# QC-PRODUCTION-OPERATIONS-019

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Make SQLite/Astro production operation observable and recoverable without
external SaaS dependencies.

READ:

render.yaml
src/lib/db.ts
src/lib/backup.ts
src/lib/backup-scheduler.ts
src/pages/api/health.ts
scripts/backup-db.mjs
scripts/restore-db.mjs

────────────────────────
1. ADMIN SYSTEM HEALTH
────────────────────────

Create:

/admin/system-health

Admin only.

Display:

App version/commit
DB path (safe display — no secrets)
DB file size
WAL size
schema version
latest migration
migration failure count
foreign key status
integrity status
last successful backup
backup age
last backup size
audit chain status
disk free space if available

Do NOT expose this publicly.

────────────────────────
2. PUBLIC HEALTH
────────────────────────

Keep /api/health lightweight.

Do not full-scan audit chains on every readiness probe.

Return:

service ready
DB initialized
schema version

No sensitive filesystem paths.

────────────────────────
3. BACKUP HEALTH
────────────────────────

Persist/derive:

last successful backup timestamp
last verification result

On application startup:

if the scheduled backup window was missed and no recent valid backup exists,
perform one controlled catch-up backup.

Avoid duplicate concurrent backups.

────────────────────────
4. RESTORE DRILL
────────────────────────

Add automated test:

backup real temp DB
mutate DB
restore backup
restart DB connection
verify important records
verify integrity
verify FK
verify migration version
verify audit chains

────────────────────────
5. DISK PROTECTION
────────────────────────

Warn Admin when:

DB + WAL + backups approach configured disk capacity.

Do not introduce external monitoring service.

────────────────────────
6. SQLITE DEPLOYMENT CONTRACT
────────────────────────

Document explicitly:

one writable application instance
persistent disk required
no horizontal multi-instance write scaling with this SQLite file architecture

Fail startup if a configuration known to violate this contract can be detected.

────────────────────────
7. PRODUCTION VERIFICATION
────────────────────────

Do not deploy.

Prepare exact verification checklist for later live deployment.

No commit/push/deploy.
```

---

# Prompt 020 — UX / Accessibility / Performance Pass

```text
# QC-UX-A11Y-PERFORMANCE-020

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Perform a complete interaction-design and accessibility pass without changing
business rules.

Use existing Astro/Tailwind/React stack.
No heavy UI framework.

────────────────────────
1. ROLE-BASED LAB HOME
────────────────────────

Employee priority:

My Tests
My Drafts
Returned for Changes
My WI Content
My Change Requests
Quick New Test

Supervisor:

Tests Awaiting Review
Documents Awaiting Review
Team Risks
Open Retests
Calibration alerts

Manager/Admin:

Approval Queue
Change Requests
Audit Health
Data Quality
Calibration Risk
WI Completion
Master Data activity

Use existing permissions.ts.

────────────────────────
2. CONSISTENT ACTION HIERARCHY
────────────────────────

Primary:
Submit / Approve / Save

Secondary:
Save Draft / Request Changes

Destructive:
Void / Archive

Keep colors/labels consistent everywhere.

────────────────────────
3. CHANGE REQUEST UX
────────────────────────

Show:

requester
timestamp
before
after
changed fields
conflict state
canonical target
audit correlation

Add:

Withdraw Request
Resubmit Rejected Request

Never hide review reason.

────────────────────────
4. DOCUMENT UX
────────────────────────

Missing Content
Draft
In Review
Approved
Superseded
Archived

must have clearly distinct consistent badges.

Catalog-only WIs should have:

Add Content

as obvious primary action.

────────────────────────
5. ACCESSIBILITY
────────────────────────

Audit:

keyboard
focus order
error focus
ARIA
tables
form grouping
dialog semantics
contrast
44px interactive targets
screen reader labels
reduced motion

No CSP relaxation.

────────────────────────
6. MOBILE / TABLET
────────────────────────

Registers:

horizontal overflow only where unavoidable

Provide card/list fallback where tables become unusable.

Long laboratory sample tables may remain horizontally scrollable but must keep
Sample No. visible/sticky where possible.

────────────────────────
7. PERFORMANCE
────────────────────────

Measure before optimizing.

Check:

SQL query counts
N+1 queries
hydrated React islands
large report generation
document lists
audit timeline
dashboard query latency

Add indexes only with query evidence.

No speculative indexes.

────────────────────────
8. EMPTY/ERROR STATES
────────────────────────

Every major screen should distinguish:

No data
No permission
Filter returned no results
System error
Pending review
Missing content

Never use the same generic empty message for all states.

────────────────────────
9. TESTS
────────────────────────

Accessibility checks
keyboard E2E
responsive screenshots
no console errors
CSP remains strict
performance regression thresholds where stable

No commit/push/deploy.
```

---

# Prompt 021 — Final Independent Verification

```text
# QC-FINAL-INDEPENDENT-AUDIT-021

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

ROLE
Independent verifier.

Do not trust:
mind entries
previous PASS claims
prompt completion messages

Only current files + actual test execution count.

────────────────────────
CHECK
────────────────────────

Migrations:
001 → latest fresh
026/030 → latest upgrades
integrity_check
foreign_key_check
checksum consistency

Database Doctor:
PASS

RBAC:
all roles
all entities
entity ownership
self-review
self-approval
terminal freeze

Change Requests:
equipment
product
calibration
retest
cancel
reject
approve
stale conflict

WI:
33 page-1 source identities
real provenance
no fake created_by
first-content flow
review
approval
versioning

Tests:
Air/Vacuum
paper-aligned fields
legacy preservation
sample data-loss regression
references
snapshots
retest lineage

Audit:
task deletion
QC deletion
task hash chain
QC hash chain
tampering

Reporting:
actual tracked route files
all report formats
audit

Tests:
ALL test:* manifest
typecheck
build
FULL E2E parent exits 0

Backup:
backup
restore
restart

Production:
state separately:

IMPLEMENTED
VERIFIED LOCALLY
VERIFIED IN PRODUCTION

────────────────────────
FINAL OUTPUT
────────────────────────

1. exact HEAD SHA
2. dirty/untracked files
3. schema version
4. table/index counts
5. unit test matrix
6. E2E matrix
7. security findings
8. UX findings
9. database findings
10. deployment findings
11. P0/P1/P2/P3
12. GO / NO-GO

Do not say production-ready without live deployment evidence.

Do not commit.
Do not push.
Do not deploy.
```

---

## ترتيب التنفيذ اللي أنصح فيه الآن

لا تبدأ بالتصميم قبل إصلاح correctness.

نفّذ:

```text
011  DB Doctor
 ↓
012  Correctness bugs
 ↓
013  QC Audit durability
 ↓
014  WI provenance
 ↓
017  Reporting / Route source truth
 ↓
018  Full testing
 ↓
015  Lab Form UX
 ↓
016  Template workflow
 ↓
020  Full UX/A11y/Performance
 ↓
019  Production operations
 ↓
021  Final independent audit
```

وأهم نقطة بخصوص أخطاء SQL اللي أرسلتها: **ما أنصح تلمس migrations القديمة نهائيًا.** المشكلة الأساسية تحتاج Tooling يوضح للمطور هل القاعدة migrated، stale، أو incompatible؛ مو تحويل 30 migration تاريخية إلى scripts قابلة للتشغيل اليدوي. هذا يتوافق مع تصميم الـrunner الحالي ويحافظ على checksum protection الموجود عندك.

بعد تنفيذ `011–021`، النظام بيكون أقرب بكثير لمرحلة أقدر أحكم عليها بـ Production GO بدل الاعتماد على عدد المميزات فقط.
