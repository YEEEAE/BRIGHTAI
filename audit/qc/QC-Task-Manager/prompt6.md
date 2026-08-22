إيه. جمعت لك الحزمة كاملة من الصفر وبترتيب تنفيذي، ودمجت فيها **قائمة WI الجديدة** بدل ما تكون إضافة منفصلة ملخبطة.

أهم شيء تغيّر عن النسخة السابقة: صار عندنا تصميم واضح يفرق بين **WI Catalog record** وبين **WI Content**. القائمة اللي بالصورة تعتبر Master Index فقط؛ يعني تدخل قاعدة البيانات كـ document identities بدون محتوى، وبعدها أي مستخدم مخوّل يقدر يضغط **Add Content** ويبدأ Version 1 حقيقية. هذا متوافق مع تصميم النظام الحالي اللي يفصل `lab_documents` عن `lab_document_versions`.

كذلك ثبتت أن `permissions.ts` يبقى المصدر الوحيد للصلاحيات، وأن `qc_audit_log` يبقى سجل التدقيق الوحيد، و`notifications` يبقى جدول الإشعارات الوحيد.

# وش أضفت تحديدًا؟

| الإضافة                     | الجديد                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| WI Catalog                  | استيراد الـ33 WI الظاهرة في Page 1/3                                                     |
| WI بدون محتوى               | `current_version_id = NULL` بدل اختراع محتوى                                             |
| Source metadata             | `source_revision`, `source_date`, `source_register_code`, `source_class`                 |
| Add Content                 | أول محتوى حقيقي ينشئ `Version 1 DRAFT`                                                   |
| جميع الأدوار                | يقدرون يبدأون محتوى WI حسب ownership/workflow                                            |
| Source Rev ≠ System Version | فصل Rev الورقية مثل `0` عن Version الرقمية                                               |
| إدارة WI                    | Filters: Missing Content / Draft / In Review / Approved                                  |
| WI Dashboard                | أرقام إجمالية ونسبة اكتمال المحتوى                                                       |
| Master Data Changes         | Employee/Supervisor يقدرون يضيفون ويعدلون Equipment/Product/Calibration عبر Review Queue |
| Management Visibility       | كل تغيير يظهر للإدارة مع before/after/actor/time                                         |
| Air/Vacuum form             | مطابقة النموذج الورقي بدون اختراع scientific values                                      |
| REJECTED Test               | يسمح لصاحبه بالتعديل وإعادة الإرسال                                                      |
| Templates                   | منع self-approval مطلوب                                                                  |
| Reporting                   | أضفت Prompt مستقل لإصلاح endpoints الناقصة                                               |
| Audit                       | أضفت Prompt مستقل لإصلاح audit durability/hash issues                                    |
| Final Verification          | Prompt نهائي يمنع اعتبار النظام Production Ready بدون اختبارات كاملة                     |

---

# Prompt 01 — Change Review Queue Foundation

```text
# QC-LAB-CHANGE-QUEUE-001
# Laboratory Contributor Change Review Queue

Repository:
YEEEAE/BRIGHTAI

Work ONLY inside:
apps/qc-task-manager/

Do NOT modify the root Astro marketing website under /src.

MISSION
Build one controlled Laboratory Change Review Queue that allows contributor roles
(employee and supervisor) to propose CREATE and UPDATE operations against selected
laboratory master-data entities without directly mutating canonical master data.

The implementation must remain consistent with the existing architecture:
- SQLite
- Astro SSR
- permissions.ts = single authorization authority
- qc_audit_log = single QC/Lab audit system
- notifications table = single notification system
- strict CSP
- every unsafe POST protected by CSRF
- Zod validation remains centralized in src/lib/validation.ts
- no heavy external dependencies
- no external SaaS or cloud workflow service

READ FIRST
Before modifying anything, inspect:

src/lib/permissions.ts
src/lib/validation.ts
src/lib/notifications.ts
src/lib/db.ts
src/lib/lab/equipment.ts
src/lib/lab/products.ts
src/lib/lab/calibration.ts
src/lib/lab/documents.ts
src/lib/lab/auditTimeline.ts
src/pages/lab/audit.astro
src/pages/lab/index.astro
src/middleware.ts

db/schema.sql
db/migrations/011_lab_core_master_data.sql
db/migrations/012_lab_tests.sql
db/migrations/013_lab_documents.sql
db/migrations/014 through 026

docs/QC-LAB-ARCHITECTURE.md

ARCHITECTURE RULE
Do NOT create a second audit system or a second notifications table.

────────────────────────────────────────
1. MIGRATION 027
────────────────────────────────────────

Create:

db/migrations/027_lab_change_requests.sql

Create table:

lab_change_requests

Columns:

id INTEGER PRIMARY KEY AUTOINCREMENT

entity_type TEXT NOT NULL CHECK entity_type IN:
- EQUIPMENT
- PRODUCT
- CALIBRATION
- RETEST_REQUEST

operation TEXT NOT NULL CHECK operation IN:
- CREATE
- UPDATE

entity_id INTEGER NULL

base_updated_at TEXT NULL

base_snapshot_json TEXT NULL

proposed_snapshot_json TEXT NOT NULL

status TEXT NOT NULL DEFAULT 'PENDING' CHECK status IN:
- PENDING
- APPROVED
- REJECTED

requested_by INTEGER NOT NULL
  REFERENCES users(id)
  ON DELETE RESTRICT

reviewed_by INTEGER NULL
  REFERENCES users(id)
  ON DELETE SET NULL

review_note TEXT NULL

applied_entity_id INTEGER NULL

created_at TEXT NOT NULL DEFAULT datetime('now')

reviewed_at TEXT NULL

Add indexes:

idx_lab_change_requests_status_created
  (status, created_at)

idx_lab_change_requests_requester_status
  (requested_by, status)

idx_lab_change_requests_target
  (entity_type, entity_id, status)

────────────────────────────────────────
2. EXTEND qc_audit_log
────────────────────────────────────────

Extend the existing qc_audit_log entity_type CHECK to support:

LAB_CHANGE_REQUEST

Use the same safe row-preserving rebuild pattern already used by the laboratory
migration architecture.

Do not drop existing audit rows.

Do not create lab_change_audit or any parallel audit table.

────────────────────────────────────────
3. DOMAIN SERVICE
────────────────────────────────────────

Create:

src/lib/lab/changeRequests.ts

Implement:

submitChangeRequest()

getChangeRequest()

listPendingChangeRequests()

listUserChangeRequests()

approveChangeRequest()

rejectChangeRequest()

cancelOwnPendingChangeRequest()
optional only if consistent with architecture

The module must:

- use prepared SQL
- use transactions
- revalidate target existence
- validate the proposed payload
- prevent double approval/rejection
- prevent requester from approving their own request
- require Manager/Admin for review
- preserve actor identity from session
- never trust requester/approver ids from body data

────────────────────────────────────────
4. OPTIMISTIC CONCURRENCY
────────────────────────────────────────

For UPDATE requests:

At request creation store:

base_updated_at
base_snapshot_json

At approval time:

Reload the canonical target.

Compare:

current.updated_at
vs
request.base_updated_at

If they differ:

DO NOT apply the proposed change.

Return a controlled conflict state/message:

"The target changed after this request was submitted. Review the latest record and resubmit the change."

Do not silently overwrite newer changes.

────────────────────────────────────────
5. AUDIT
────────────────────────────────────────

When submitted:

entity_type = LAB_CHANGE_REQUEST
entity_id   = request.id
action      = SUBMIT
actor_id    = requester
old_value   = base_snapshot_json
new_value   = proposed_snapshot_json

When approved:

LAB_CHANGE_REQUEST / APPROVAL

When rejected:

LAB_CHANGE_REQUEST / REJECTION

The actual canonical service must ALSO write its own normal entity audit event.

Example approval:

Ahmed proposes Equipment change
        ↓
LAB_CHANGE_REQUEST / SUBMIT

Manager approves
        ↓
LAB_CHANGE_REQUEST / APPROVAL

Equipment service updates canonical record
        ↓
LAB_EQUIPMENT / UPDATE

Both actions must remain visible.

────────────────────────────────────────
6. REVIEW AUTHORITY
────────────────────────────────────────

Add permission predicates in permissions.ts only.

Suggested contract:

canSubmitLabChangeRequest(role)
canViewOwnLabChangeRequests(role)
canReviewLabChangeRequests(role)
canApproveLabChangeRequest(user, request)

Rules:

All four roles may submit where the entity policy permits.

Only:
admin
manager

may approve/reject.

Requester may never approve their own request.

Do NOT place role arrays inside page handlers or services.

────────────────────────────────────────
7. VALIDATION
────────────────────────────────────────

Add schemas in:

src/lib/validation.ts

Examples:

labChangeRequestReviewSchema

Fields:
action = approve | reject
review_note

Reject requires a meaningful review note.

Approval may allow an optional review note.

Request payload itself must be generated from already validated canonical
entity forms instead of accepting arbitrary JSON submitted by the browser.

Do NOT allow:
entity_type + arbitrary proposed_snapshot_json
directly from untrusted request input.

────────────────────────────────────────
8. SECURITY
────────────────────────────────────────

Every POST must require:

authenticated session
CSRF
RBAC
entity-level permission
Zod validation

No unsafe inline JS.
No CSP relaxation.
No hidden-field authorization.

────────────────────────────────────────
9. MIGRATION INTEGRATION
────────────────────────────────────────

Update:

db/schema.sql
src/lib/db.ts

Register migration 027 following the exact migration engine pattern already used.

Required verification:

fresh DB:
001 → 027

upgrade:
026 → 027

PRAGMA integrity_check
PRAGMA foreign_key_check

────────────────────────────────────────
10. TESTS
────────────────────────────────────────

Create:

scripts/test-lab-change-requests.mjs

Cover:

employee can submit allowed proposal
supervisor can submit allowed proposal
employee cannot approve
supervisor cannot approve
manager can approve
admin can approve
requester cannot self-approve
rejected request never mutates target
approved request mutates exactly once
double approval rejected
double rejection rejected
stale update blocked
target missing handled safely
forged entity id rejected
invalid payload rejected
CSRF enforced
audit rows written
notification generation
inactive recipient handling
fresh migration works
upgrade migration works

DO NOT commit.
DO NOT push.
DO NOT deploy.

Return:
1. modified files
2. migrations applied
3. test commands
4. exact pass/fail results
5. known remaining risks
```

---

# Prompt 02 — RBAC Expansion: Everyone Can Contribute

```text
# QC-LAB-RBAC-EXPANSION-002
# Everyone Can Contribute, Management Retains Control

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

PRIMARY REQUIREMENT
Allow all roles, including employee, to contribute laboratory data while
preserving approval separation, immutable final states and management visibility.

permissions.ts MUST remain the single source of authorization truth.

READ FIRST

src/lib/permissions.ts
src/lib/types.ts
src/lib/lab/tests.ts
src/lib/lab/equipment.ts
src/lib/lab/products.ts
src/lib/lab/calibration.ts
src/lib/lab/documents.ts
src/lib/lab/templates.ts
src/lib/lab/review.ts
src/lib/lab/retests.ts
src/lib/lab/maintenance.ts if present
src/middleware.ts

CURRENT HARD INVARIANTS MUST REMAIN:

- APPROVED tests immutable
- VOID tests immutable
- APPROVED document versions immutable
- SUPERSEDED document versions immutable
- ARCHIVED records restricted
- tester cannot review own test
- tester cannot approve own test
- reviewer cannot approve same test
- document author cannot review/approve own version
- electronic signature remains mandatory where currently required
- authorization identities always come from session
- snapshots remain unchanged

────────────────────────────────────────
1. LAB TESTS
────────────────────────────────────────

All roles:

admin
manager
supervisor
employee

may:

create
edit their own DRAFT
edit their own REJECTED test
submit their own test

Review:

supervisor+
except own test

Approve:

manager+
except:
tester
creator
reviewer

Void:

manager+
using existing e-signature
only according to existing non-terminal/terminal policy

Fix the current inconsistency where general policy permits DRAFT/REJECTED editing
but the actual edit service only allows DRAFT.

Required lifecycle:

DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ↓
REJECTED
  ↓
original tester edits/reworks
  ↓
SUBMITTED

No new test record should be required just to correct a rejected test unless
business workflow explicitly requests a retest.

────────────────────────────────────────
2. EQUIPMENT
────────────────────────────────────────

All roles may contribute CREATE/UPDATE.

But canonical authority differs.

Employee:
CREATE → proposal
UPDATE → proposal

Supervisor:
CREATE → proposal
UPDATE → proposal

Manager:
CREATE → direct
UPDATE → direct
ARCHIVE/RESTORE → direct

Admin:
same as Manager

Add clear predicates:

canProposeLabEquipmentCreate
canProposeLabEquipmentEdit
canApplyLabEquipmentChange
canArchiveLabEquipment

Do NOT simply change:

canCreateLabEquipment(employee) = true

if that causes direct insertion into the canonical table.

The distinction between PROPOSE and APPLY must be explicit.

────────────────────────────────────────
3. PRODUCTS
────────────────────────────────────────

Employee:
CREATE → proposal
UPDATE → proposal

Supervisor:
CREATE → proposal
UPDATE → proposal

Manager/Admin:
direct canonical CREATE/UPDATE
archive/deactivate

Use Change Review Queue from Prompt 001.

────────────────────────────────────────
4. CALIBRATION
────────────────────────────────────────

Employee:
CREATE → proposal
UPDATE → proposal

Supervisor:
CREATE → proposal
UPDATE → proposal

Manager/Admin:
direct canonical CREATE/UPDATE

A proposal must NOT affect derived calibration status before it is approved.

────────────────────────────────────────
5. MAINTENANCE
────────────────────────────────────────

All roles may directly append maintenance events.

Reason:
maintenance history is append-only and audited.

Do NOT make old maintenance events editable or deletable.

Rules:

create = all roles
edit = none
delete = none

Archive status of equipment still controls whether new events may be added.

────────────────────────────────────────
6. CONTROLLED DOCUMENTS
────────────────────────────────────────

All roles may:

create a new SOP/WI DRAFT
start content on catalog-only WI
edit owned/authored DRAFT
edit owned/authored REJECTED/change-requested draft if workflow supports it
submit for review

Employee cannot:
review
approve
archive

Supervisor can:
review documents authored by another user

Manager/Admin can:
review another user's document
approve another user's document
archive

Self-approval restrictions remain absolute.

────────────────────────────────────────
7. LAB TEST TEMPLATES
────────────────────────────────────────

Extend contribution:

Employee/Supervisor may:
create DRAFT template
edit owned DRAFT

Manager/Admin:
approve/activate
archive

IMPORTANT:
Add entity-level self-approval protection.

A user who created/authored the current template version must not approve that
same version.

If required, introduce a permission predicate similar to:

canApproveLabTemplateRecord(user, template/version)

Do not rely on role only.

────────────────────────────────────────
8. RETESTS
────────────────────────────────────────

Do not let employee directly create an official retest execution record.

Allow employee to submit:

RETEST_REQUEST

through the Change Review Queue.

Supervisor/Manager/Admin may create the actual retest according to existing policy.

────────────────────────────────────────
9. FINDING LINKS
────────────────────────────────────────

Keep current quality-significant linking authority at supervisor+.

Do not broaden it to employee in this change.

────────────────────────────────────────
10. REPORTS
────────────────────────────────────────

Do not broaden management laboratory reports/export permissions as part of this prompt.

Employee access to personal test records is separate from cross-laboratory
management reports.

────────────────────────────────────────
11. FILES
────────────────────────────────────────

Primary:

src/lib/permissions.ts

Likely affected:

src/lib/lab/tests.ts
src/lib/lab/equipment.ts
src/lib/lab/products.ts
src/lib/lab/calibration.ts
src/lib/lab/documents.ts
src/lib/lab/templates.ts
src/lib/lab/retests.ts
src/pages/lab/**
src/middleware.ts

────────────────────────────────────────
12. TESTING
────────────────────────────────────────

Update:

scripts/test-lab-security.mjs
scripts/test-lab-tests.mjs
scripts/test-lab-equipment.mjs
scripts/test-lab-products.mjs
scripts/test-lab-calibration.mjs
scripts/test-lab-documents.mjs
scripts/test-lab-templates.mjs

and relevant E2E suites.

Test all four roles for:

view
create
edit
submit
review
approve
archive
void

Test entity ownership separately from role permission.

Run architecture guard to ensure permissions.ts remains the only authorization authority.

Do not commit/push/deploy.

Return evidence only.
```

---

# Prompt 03 — Equipment / Product / Calibration Contributor Integration

```text
# QC-LAB-CONTRIBUTOR-MASTER-DATA-003

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

DEPENDENCY
Prompt 001 and Prompt 002 must be implemented first.

MISSION
Wire Equipment, Product and Calibration forms into the Contributor Change
Review Queue.

DO NOT duplicate canonical domain logic.

READ:

src/lib/lab/changeRequests.ts
src/lib/lab/equipment.ts
src/lib/lab/products.ts
src/lib/lab/calibration.ts
src/lib/permissions.ts
src/lib/validation.ts
src/lib/notifications.ts

Relevant pages/components:

src/pages/lab/equipment/**
src/pages/lab/products/**
src/pages/lab/calibration/**
src/components/lab/LabEquipmentForm.astro
product/calibration form components

────────────────────────────────────────
BEHAVIOR BY ROLE
────────────────────────────────────────

EMPLOYEE/SUPERVISOR:

Create form:
validate normally
        ↓
build normalized proposed payload
        ↓
submit change request
        ↓
NO canonical mutation
        ↓
show Pending Review

Edit form:
load canonical record
        ↓
capture base snapshot + updated_at
        ↓
validate proposed form
        ↓
create UPDATE request
        ↓
NO canonical mutation

MANAGER/ADMIN:

Keep existing direct canonical behavior.

────────────────────────────────────────
EQUIPMENT
────────────────────────────────────────

Contributor can propose:

name
code
location
status_raw
calibration_status_raw
serial_number
notes

Archive/Restore:
Manager/Admin only.

Approval:

- revalidate equipment payload
- uniqueness check for code
- stale check
- call canonical equipment service
- canonical service writes LAB_EQUIPMENT audit
- Change Request writes approval audit
- requester receives notification

────────────────────────────────────────
PRODUCT
────────────────────────────────────────

Contributor can propose all existing editable product fields.

At approval:

- validate referenced template
- validate SOP/WI
- validate equipment relationships
- validate unique product code
- stale check
- reuse canonical product service

Archive/deactivate:
Manager/Admin only.

────────────────────────────────────────
CALIBRATION
────────────────────────────────────────

Contributor can propose existing calibration fields.

Proposal must not:
- change equipment calibration display state
- affect test-form calibration state
- create a visible canonical calibration row

until approved.

At approval:
validate dates again
validate equipment still exists/is eligible
apply through canonical service

────────────────────────────────────────
UI
────────────────────────────────────────

For contributor forms:

Primary button text:

"Submit for Review"

not:
"Save Equipment"

Show notice:

"Your change will be reviewed by laboratory management before it becomes active."

After submit redirect to either:

/lab/change-requests/{id}

or a supported My Changes location.

Manager/Admin forms retain:

Save
Update

────────────────────────────────────────
PENDING INDICATOR
────────────────────────────────────────

On target detail pages show:

Pending contributor changes: N

Manager/Admin:
click to review

Contributor:
see their own pending request status

Do not expose private unrelated requests to employees.

────────────────────────────────────────
AUDIT
────────────────────────────────────────

Canonical audit should only be written when canonical data changes.

Proposal audit is LAB_CHANGE_REQUEST.

Do NOT write fake LAB_EQUIPMENT UPDATE when only a proposal was submitted.

────────────────────────────────────────
SECURITY
────────────────────────────────────────

Do not trust:

entity_id in body
requested_by in body
reviewed_by in body
actor role in body

Use matched route/session.

Require CSRF.

────────────────────────────────────────
TESTS
────────────────────────────────────────

For all 3 entities test:

Employee create proposal
Employee update proposal
Supervisor create proposal
Manager direct create
Admin direct update
Canonical table unchanged while PENDING
Canonical table unchanged when REJECTED
Canonical table changes when APPROVED
stale conflict protection
unique-code conflict
invalid FK protection
CSRF
forged id
audit
notifications

Do not commit/push/deploy.
```

---

# Prompt 04 — SOP/WI Authoring for All Roles

```text
# QC-LAB-DOCUMENT-AUTHORING-004
# Employee/Supervisor SOP/WI Authoring

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Allow all roles to create and contribute controlled SOP/WI document content
while preserving the existing document lifecycle, versioning model and
separation of duties.

READ:

src/lib/permissions.ts
src/lib/lab/documents.ts
src/lib/validation.ts
src/lib/notifications.ts
src/lib/lab/auditTimeline.ts

src/components/lab/LabDocumentEditor.astro

src/pages/lab/documents/index.astro
src/pages/lab/documents/new.astro
src/pages/lab/documents/[id].astro
src/pages/lab/documents/[id]/edit.astro
src/pages/lab/documents/[id]/versions.astro

db/migrations/013_lab_documents.sql

────────────────────────────────────────
CORE RULE
────────────────────────────────────────

lab_documents = stable identity

lab_document_versions = authored content/version history

Never edit an APPROVED version in place.

────────────────────────────────────────
CATALOG-ONLY DOCUMENT SUPPORT
────────────────────────────────────────

A valid document may exist with:

lab_documents.current_version_id IS NULL

This means:

document identity exists
but no content has been authored yet

This is NOT database corruption.

Detail page must render:

Document Code
Title
Type
Source metadata if available

Content Status:
"No content has been entered yet."

Button:
Add Content

Do not fabricate version 1.

────────────────────────────────────────
FIRST CONTENT
────────────────────────────────────────

When an authorized user clicks Add Content:

Reuse LabDocumentEditor.

On first valid save:

- content must be non-empty
- create lab_document_versions version = 1
- status = DRAFT
- author_id = session user
- if owner_id is NULL:
  set owner_id = session user
- set current_version_id
- update document updated_at
- audit VERSION/CREATE appropriately
- all in one transaction

Never create version 1 until real content is submitted.

────────────────────────────────────────
ALL-ROLE AUTHORING
────────────────────────────────────────

Admin
Manager
Supervisor
Employee

may create a DRAFT document.

For Employee creation:

created_by = session user

owner_id should default server-side to session user.

Do not let an employee assign arbitrary ownership unless policy explicitly permits it.

Employee may edit only:

owned/authored DRAFT

Supervisor may:

edit owned/authored DRAFT
review another author's document

Manager/Admin may:

manage non-terminal drafts
review another author's document
approve another author's document

────────────────────────────────────────
WORKFLOW
────────────────────────────────────────

No content:
CATALOG ONLY

First author:
DRAFT v1

Submit:
IN_REVIEW

Review actions:
REQUEST_CHANGES
or equivalent existing workflow

Approval:
APPROVED

Later edit:
Version N+1 DRAFT

Old approved:
remains immutable/historically available

────────────────────────────────────────
SEPARATION OF DUTIES
────────────────────────────────────────

Author cannot review own document.

Author cannot approve own document.

Owner cannot approve own document.

Creator cannot approve own document.

Reviewer/approver identity must come from session.

Approval remains manager/admin.

Keep current e-signature behavior where implemented.

────────────────────────────────────────
AUDIT
────────────────────────────────────────

Use qc_audit_log only.

Audit:

CREATE document identity
VERSION first content
UPDATE draft
SUBMIT
REQUEST_CHANGES
APPROVAL
SUPERSEDE
archive

Store meaningful old_value/new_value for workflow transitions.

────────────────────────────────────────
NOTIFICATIONS
────────────────────────────────────────

Reuse existing types:

lab_document_review_started
lab_document_changes_requested
lab_document_approved
lab_document_archived
lab_document_review_due

Only add:

lab_document_content_started

if management visibility requires a persisted notification for first-content
creation.

Do not add duplicates unnecessarily.

────────────────────────────────────────
SECURITY
────────────────────────────────────────

Every POST:
auth
CSRF
permission
entity ownership
Zod validation

Document content remains untrusted input.

Keep existing sanitized Markdown/HTML architecture.

Do not weaken CSP.

────────────────────────────────────────
TESTS
────────────────────────────────────────

Test:

employee creates new DRAFT
employee starts catalog-only WI content
employee edits own draft
employee cannot edit unrelated draft
employee cannot review
employee cannot approve
supervisor reviews another user's document
supervisor cannot review own document
manager approves another user's document
manager cannot approve own-authored document
admin cannot self-approve own-authored version
first content creates v1
approved edit creates v2 draft
approved v1 unchanged
catalog-only current_version_id null remains supported
CSRF enforced
forged id rejected
audit present
notifications present

No commit/push/deploy.
```

---

# Prompt 05 — FR-MA-018 Paper Form Alignment

```text
# QC-LAB-FR-MA-018-ALIGNMENT-005
# Align Digital Lab Test Form With Supplied Controlled Paper Form

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

STRICT SOURCE RULE
The supplied paper-form transcription below is the ONLY authorized source for
scientific/reference values in this prompt.

Do NOT:
- correct scientific values
- infer missing labels
- invent units
- normalize ranges
- assume AIR and VACUUM use identical references
- substitute domain knowledge

If a source field is unclear:
store/display it as UNKNOWN or leave it unimplemented pending confirmation.

────────────────────────────────────────
PAPER FORM METADATA
────────────────────────────────────────

Company:
Saudi Mais Co. for Medical Products

Record:
Quality Record

Doc #:
FR-MA-018

Rev #:
06

Date:
01.01.2020

Page:
1 / 1

Form Title:
UNKNOWN / OBSCURED
DO NOT INVENT.

────────────────────────────────────────
SAMPLE IDENTIFICATION
────────────────────────────────────────

Product/Description

Connector Type:

1.
Non-locking (rigid) connector

2.
Connector with floating or movable collar

3.
Locking connector with fixed threads

Testing Date

No. of sample tested

Lot Number

Testing Area

────────────────────────────────────────
REQUIREMENTS
────────────────────────────────────────

Medium name

Visible value:
Subatmospheric Pressure Air Leakage Testing

Medium used

────────────────────────────────────────
CONNECTOR ASSEMBLY
────────────────────────────────────────

Actual Force:
≥23.5 N (5.3 lb)

Torque:
0.60 ± 0.1 N.m

Time:
(5±3) sec

Angle:
±3.0°

────────────────────────────────────────
ENVIRONMENTAL CONDITION
────────────────────────────────────────

Temperature:
(20-25) °C

Separate visible cell:
25 °C

Semantics of the separate 25 °C cell are UNCONFIRMED.

Humidity:
(40-65 %)

Separate visible cell:
35-65%

Semantics of this separate cell are UNCONFIRMED.

Do NOT decide whether those cells are measured values or reference values
without further source evidence.

────────────────────────────────────────
TEST RESULTS
────────────────────────────────────────

Visible text:

Standard condition:
Subatmospheric Pressure -80 ~ -80 kpa

Preserve exactly as visible.
Do NOT silently "correct" the range.

Another label is unreadable.

Visible associated value:
<0.010 Pa.cm³/s

Do not assign a business meaning to that value until the label is confirmed.

Another right-side preset label is also unclear.
Do not invent it.

────────────────────────────────────────
SAMPLE TABLE
────────────────────────────────────────

Printed sample rows:
1 through 12

Columns:

Sample No.

Part Name

Set pressure (kpa)

Applied Pressure (kpa)

Volume (liter)

Pressure Difference (kpa)

Holding Time (Sec)

Leakage Rate
visible unit:
Pa.cm³/s

Result:
Pass / Fail

────────────────────────────────────────
FINAL RESULT
────────────────────────────────────────

PASS

FAIL-*

HOLD / FURTHER EVALUATION

The meaning of the FAIL asterisk is UNKNOWN.
Do not invent a footnote.

────────────────────────────────────────
AUTHORIZATION
────────────────────────────────────────

Tested by:

Reviewed by: QC/E

Approved by: QA/E

Do not assume QA/E maps to an existing application role without explicit
business confirmation.

────────────────────────────────────────
READ CURRENT IMPLEMENTATION
────────────────────────────────────────

src/components/lab/LabTestForm.tsx
src/lib/lab/policy.ts
src/lib/lab/tests.ts
src/lib/lab/templates.ts
src/lib/validation.ts

src/pages/lab/tests/new.astro
src/pages/lab/tests/[id].astro
src/pages/lab/tests/[id]/print.astro

db/migrations/012_lab_tests.sql
db/schema.sql

────────────────────────────────────────
KNOWN DIGITAL DIFFERENCES TO RESOLVE
────────────────────────────────────────

Current connector labels differ from source.

Current system uses:
Actual Pressure

Paper form has:
Actual Force

Do NOT rename historical actual_pressure data into actual_force.

Current torque storage uses:
torque_in_lb

Paper form states:
N.m

Do NOT reinterpret existing torque_in_lb historical values.

Current sample grid includes:
Volume (Sec.)

Paper form states:
Volume (liter)

Do NOT reinterpret historical volume_sec data.

Current sample grid uses:
Actual Pressure

Paper form uses:
Applied Pressure

Preserve semantics separately.

────────────────────────────────────────
MIGRATION 028
────────────────────────────────────────

Create:

db/migrations/028_lab_test_form_alignment.sql

Add to lab_test_records:

testing_date TEXT NULL

actual_force TEXT NULL

torque_value TEXT NULL

humidity_measured TEXT NULL

Add to lab_test_samples:

applied_pressure TEXT NULL

volume_liter TEXT NULL

Add to lab_test_template_versions:

effective_date TEXT NULL

Do not remove:

actual_pressure
torque_in_lb
volume_sec

They are legacy historical fields until a verified mapping exists.

────────────────────────────────────────
REFERENCE SOURCE OF TRUTH
────────────────────────────────────────

Scientific reference values must NOT come from global hard-coded defaults.

Approved Test Template Version becomes the canonical reference source.

Template reference fields may live inside parameters_json.

Support optional values such as:

medium_name
actual_force_reference
torque_reference
time_reference
angle_reference
temperature_reference
humidity_reference
standard_condition
leakage_reference
holding_time_reference

Do not require every template to populate every field.

────────────────────────────────────────
REMOVE SCIENTIFIC FALLBACK
────────────────────────────────────────

Review:

LAB_ACTUAL_PRESSURE_REFERENCE
LAB_STANDARD_PARAMETER
LAB_ACCEPTANCE_CRITERIA
LAB_HOLDING_TIME

and any similar global reference constants.

UI must not silently use hard-coded scientific values when no approved template
reference exists.

Instead show:

"No approved reference available."

Templates may still contain company-approved reference text.

────────────────────────────────────────
AIR VS VACUUM
────────────────────────────────────────

Do not assume the values from this paper form apply to both:

air
vacuum

Template version has its own test_type.

Only compatible approved templates may populate reference display.

────────────────────────────────────────
SAMPLE COUNT
────────────────────────────────────────

The paper form contains 12 printed rows.

For the corresponding approved template:
default_sample_count may be 12.

Do NOT change the global maximum of 20 to 12 unless business confirms that
every test is restricted to 12.

────────────────────────────────────────
PRINT
────────────────────────────────────────

Update controlled print to show stored values accurately.

Display:

form/template identity where known
source/version metadata
testing date
paper-aligned field names
units from stored template/reference metadata
sample rows
final result
authorization
snapshots

Do not print invented fields.

────────────────────────────────────────
VALIDATION
────────────────────────────────────────

Use TEXT storage for measurements unless a confirmed normalized numeric model
exists.

Do not create automatic scientific PASS/FAIL calculations.

Final result remains a human decision.

────────────────────────────────────────
SNAPSHOTS
────────────────────────────────────────

At approval preserve:

product snapshot
template snapshot
parameter snapshot
equipment snapshot
calibration snapshot
controlled-document snapshot

Never re-resolve approved history against future master-data changes.

────────────────────────────────────────
TESTS
────────────────────────────────────────

Update:

scripts/test-lab-form.mjs
scripts/test-lab-tests.mjs
scripts/test-lab-print.mjs
scripts/test-lab-review.mjs

Relevant E2E.

Test:

12-row template default
exact connector labels
new fields save/edit
legacy fields preserved
reference comes only from approved template
no template → no approved reference
wrong test_type template rejected
no scientific auto-result
print shows exact stored data
snapshot remains stable after reference changes

No commit/push/deploy.
```

---

# Prompt 06 — Management Visibility + Notifications

```text
# QC-LAB-MANAGEMENT-VISIBILITY-006
# Laboratory Contributor Transparency

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Give Admin and Manager complete visibility over contributor changes without
creating a second audit system or notification system.

DEPENDENCY:
Prompts 001-004.

READ:

src/lib/lab/changeRequests.ts
src/lib/lab/auditTimeline.ts
src/pages/lab/audit.astro
src/lib/notifications.ts
src/pages/lab/notifications.astro
src/pages/notifications.astro
src/pages/lab/index.astro
src/lib/lab/overview.ts
src/lib/lab/navigation.ts
src/lib/permissions.ts

────────────────────────────────────────
1. CHANGE REVIEW PAGE
────────────────────────────────────────

Create:

src/pages/lab/change-requests/index.astro

Access:

Manager
Admin

Read-only employees may see ONLY their own requests through a separate scoped
view if needed.

Page must show:

Request ID
Entity
Operation
Target
Requested By
Requester Role
Submitted At
Status
Reviewer
Reviewed At
Review Note
Stale / Conflict status

For UPDATE requests show field-level diff:

Field
Before
Proposed

Example:

Serial Number
Before: EQ-ABC-100
Proposed: EQ-ABC-101

Location
Before: Lab 1
Proposed: Lab 2

Raw JSON may be available in a secondary details element for diagnostics but
must not replace human-readable diff.

────────────────────────────────────────
2. REVIEW ACTION
────────────────────────────────────────

Create endpoint following existing API conventions:

src/pages/api/lab/change-requests/[id]/review.ts

POST only.

Require:

session
CSRF
manager/admin
Zod validation
request PENDING
not self-review
stale check

Actions:

approve
reject

Reject requires reason.

────────────────────────────────────────
3. COMMAND CENTER
────────────────────────────────────────

Update:

src/pages/lab/index.astro
src/lib/lab/overview.ts

Cards:

Pending Master Data Changes

Contributor Changes Today

Rejected Changes

Changes Waiting > 24h

Recent Contributor Activity

Show examples using real audit data only.

Do not fabricate activity.

────────────────────────────────────────
4. RECENT ACTIVITY
────────────────────────────────────────

Use qc_audit_log.

Show:

time
actor
role
action
entity
record
link

Example UI copy:

"Ahmed proposed an update to Equipment EQ-014"

"Sarah started content for WI-8-2-2-M01"

"Ali submitted Test LAB-TEST-00142"

Do not infer events that are not present in audit rows.

────────────────────────────────────────
5. NOTIFICATIONS
────────────────────────────────────────

Extend NotificationKind with exactly:

lab_change_review_requested
lab_change_review_approved
lab_change_review_rejected

Update:

PERSISTED_SEVERITY
LAB_NOTIFICATION_KINDS

Requested:
send to active Manager/Admin recipients.

Approved:
send to requester.

Rejected:
send to requester with review reason.

Use entity_href.

Do NOT introduce another table.

────────────────────────────────────────
6. LAB AUDIT PAGE
────────────────────────────────────────

Extend:

src/lib/lab/auditTimeline.ts

with entity:

LAB_CHANGE_REQUEST

Update labels and href resolution.

Add filters if needed:

Change Requests

Keep existing role restriction for lab-wide audit unless RBAC specification
changes separately.

────────────────────────────────────────
7. MY CHANGES
────────────────────────────────────────

Provide contributor visibility to their own requests.

Either:

/lab/change-requests?mine=1

if safely RBAC-scoped

or:

a dedicated My Changes section.

Employee must never see another user's private pending proposal through forged
query parameters.

────────────────────────────────────────
8. TESTS
────────────────────────────────────────

Cover:

Manager sees all pending requests
Admin sees all
Employee sees only own
Supervisor sees only own unless another policy explicitly permits management view
diff accurate
request links correct
notifications use same notification table
read state shared with global bell
audit filter works
CSRF
RBAC
forged id
inactive users not notified

No commit/push/deploy.
```

---

# Prompt 07 — WI Master Catalog + Editable Content

```text
# QC-LAB-WI-CATALOG-007
# Import WI Titles From Controlled Master Index and Enable Content Authoring

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

SOURCE
A supplied company-controlled paper index:

Saudi Mais Co. for Medical Products
Quality Record (Appendix E)

Title:
Work Instruction(WI) List

Doc #:
F-4-2-1-2

Rev #:
12

Date:
09.02.2026

Page:
1/3

Class:
Class I

STRICT SOURCE RULE

This image contains DOCUMENT TITLES / MASTER INDEX DATA ONLY.

It does NOT contain the actual Work Instruction content.

Therefore:

- do not invent document content
- do not create fake procedures
- do not mark imported WIs APPROVED
- do not create placeholder document versions
- do not assume pages 2/3 and 3/3 contents
- import only the 33 visible rows

Preserve source spelling exactly.

────────────────────────────────────────
ARCHITECTURE
────────────────────────────────────────

Use existing:

lab_documents
lab_document_versions

Do NOT create:

lab_wi
wi_documents
wi_content
or any parallel WI database.

lab_documents:
stable identity/catalog record

lab_document_versions:
actual authored digital content

────────────────────────────────────────
MIGRATION 029
────────────────────────────────────────

Create:

db/migrations/029_wi_catalog_import.sql

Add nullable columns to lab_documents:

source_revision INTEGER

source_date TEXT

source_register_code TEXT

source_class TEXT

Do not use lab_document_versions.version for paper source revision.

They are different concepts.

Paper Source Revision may be:
0
1
2
...

System Content Version must follow existing positive digital version rules.

────────────────────────────────────────
IMPORT MODEL
────────────────────────────────────────

Each imported WI becomes:

type = 'WI'

status = 'DRAFT'

current_version_id = NULL

owner_id = NULL

reviewer_id = NULL

approver_id = NULL

source_register_code = 'F-4-2-1-2'

source_class = 'Class I'

source_revision = row Rev

source_date = normalized YYYY-MM-DD from source row

Do not create lab_document_versions.

────────────────────────────────────────
IDEMPOTENCY
────────────────────────────────────────

Import keyed by:

lab_documents.code

If a code already exists:

DO NOT:
overwrite title blindly
delete current content
replace current_version_id
downgrade status
change approved history

Safe behavior:

- preserve existing document
- populate missing source metadata if safe
- report collision in verification output

Do not destroy user-authored content.

────────────────────────────────────────
SOURCE ROWS
────────────────────────────────────────

1
Code:
WI-8-2-2-M01
Title:
Production Procedure for Saturation Probe
Source Revision:
2
Source Date:
30.09.2025

2
WI-8-2-2-M01-1
Inspection Procedure for Saturation Probe
Rev 0
30.09.2025

3
WI-8-2-2-M04
Production Procedure for Eye Sheild
Rev 1
13.09.2023

4
WI-8-2-2-M04-1
Inspection Procedure for Eye Sheild
Rev 1
13.09.2023

5
WI-8-2-2-M05
Production Procedure for Face Sheild
Rev 0
15.09.2023

6
WI-8-2-2-M05-1
Inspection Procedure for Face Sheild
Rev 0
15.09.2023

7
WI-8-2-2-M06
Production Procedure for Suspensory Bandage
Rev 2
14.10.2025

8
WI-8-2-2-M06-1
Inspection Procedure for Suspensory Bandage
Rev 0
14.10.2025

9
WI-8-2-2-M07
Production Procedure for Stethoscope
Rev 2
11.12.2022

10
WI-8-2-2-M07-1
Inspection Procedure for Stethoscope
Rev 0
11.12.2022

11
WI-8-2-2-M10
Production Procedure for Razor Blade
Rev 2
19.10.2025

12
WI-8-2-2-M10-1
Inspection Procedure for Razor Blade
Rev 0
19.10.2025

13
WI-8-2-2-M12
Production Procedure for Restraints
Rev 0
02.12.2024

14
WI-8-2-2-M12-1
Inspection Procedure for Restraints
Rev 0
02.12.2024

15
WI-8-2-2-M13
Production & Test Procedure for Nasopharyngeal Airway
Rev 2
01.04.2023

16
WI-8-2-2-M14
Production & Test Procedure for Blood Pressure Cuff
Rev 1
20.05.2023

17
WI-8-2-2-M15
Production & Test Procedure for Breathing Exerciser
Rev 0
20.05.2023

18
WI-8-2-2-M18
Production Procedure for Umbilical Ligature
Rev 0
29.09.2025

19
WI-8-2-2-M18-1
Inspection Procedure for Umbilical Ligature
Rev 0
29.09.2025

20
WI-8-2-2-M20
Production Procedure for Goggles
Rev 0
25.02.2025

21
WI-8-2-2-M20-1
Inspection Procedure for Goggles
Rev 0
25.02.2025

22
WI-8-2-2-M21
Production Procedure for Temperature Prob
Rev 0
18.02.2025

23
WI-8-2-2-M21-1
Inspection Procedure for Temperature Prob
Rev 0
18.02.2025

24
WI-8-2-2-M25
Production Procedure for Biohazard Specimen Transport Bag
Rev 0
16.03.2025

25
WI-8-2-2-M25-1
Inspection Procedure for Biohazard Specimen Transport Bag
Rev 0
16.03.2025

26
WI-8-2-2-M28
Production Procedure for Non Sterile Syringe Bulb
Rev 0
20.05.2023

27
WI-8-2-2-M28-1
Inspection Procedure for Non Sterile Syringe Bulb
Rev 0
28.11.2023

28
WI-8-2-2-M32
Production Procedure for Little Sucker
Rev 0
18.10.2025

29
WI-8-2-2-M32-1
Inspection Procedure for Little Sucker
Rev 0
18.10.2025

30
WI-8-2-2-M37
Production Procedure for IV Arm Board
Rev 0
27.01.2024

31
WI-8-2-2-M37-1
Inspection Procedure for IV Arm Board
Rev 0
27.01.2024

32
WI-8-2-2-M38
Production & Test Procedure for Positioning Aid
Rev 0
20.05.2023

33
WI-8-2-2-M39
Production Procedure for Mannual Resuscitator
Rev 0
23.11.2023

PRESERVE SOURCE SPELLING:

Eye Sheild
Face Sheild
Temperature Prob
Mannual Resuscitator

Do NOT silently correct them.

Future corrections must be normal audited edits.

────────────────────────────────────────
CATALOG-ONLY DETAIL PAGE
────────────────────────────────────────

A WI with:

current_version_id = NULL

must render normally.

Display:

Code
Title
Type = WI
Source Revision
Source Date
Source Register
Source Class

Content Status:
No content has been entered yet.

Primary action:

Add Content

Do not display:
Version 1
Approved
fake author

────────────────────────────────────────
FIRST CONTENT SAVE
────────────────────────────────────────

When Add Content is used:

- reuse LabDocumentEditor
- require real non-empty content
- session user is author
- create version=1
- status=DRAFT
- set current_version_id
- if owner_id NULL:
  set owner_id=session user
- audit
- all transactionally

────────────────────────────────────────
WORKFLOW
────────────────────────────────────────

Catalog only
    ↓
Add Content
    ↓
DRAFT v1
    ↓
Submit
    ↓
IN_REVIEW
    ↓
Review
    ↓
APPROVED

Later edit:

APPROVED v1
    ↓
new DRAFT v2

Never mutate v1 approved content.

────────────────────────────────────────
WI LIST UX
────────────────────────────────────────

Update:

/lab/documents

Filters:

Type:
All
SOP
WI

Content Status:
All
Missing Content
Draft
In Review
Approved

Columns:

Code
Title
Source Rev
Source Date
Content Status
System Version
Owner
Workflow Status
Updated At

For current_version_id NULL:

System Version = —
Content Status = Missing Content

────────────────────────────────────────
WI COMMAND CENTER
────────────────────────────────────────

Add:

WI Catalog

WI Missing Content

WI Draft Content

WI Under Review

WI Approved

WI Content Completion:
X / total

Use DB counts only.

────────────────────────────────────────
SEARCH
────────────────────────────────────────

Ensure WI catalog records are searchable by:

code
title
source metadata where appropriate

Do not require content to exist before a WI can be found.

────────────────────────────────────────
AUDIT
────────────────────────────────────────

Do not invent actor_id during migration.

If no legitimate user actor exists during migration-time seed:

the migration itself is import provenance.

Begin normal qc_audit_log events when a real user:

starts content
changes title/source metadata
edits content
submits
reviews
approves
archives

Do not fabricate a "System user #1".

────────────────────────────────────────
NOTIFICATIONS
────────────────────────────────────────

Reuse current document notifications.

Optionally add:

lab_document_content_started

only if needed.

Do not create a second notification mechanism.

────────────────────────────────────────
FILES
────────────────────────────────────────

db/migrations/029_wi_catalog_import.sql
db/schema.sql
src/lib/db.ts
src/lib/types.ts if required
src/lib/permissions.ts
src/lib/validation.ts
src/lib/lab/documents.ts
src/lib/lab/overview.ts
src/lib/lab/auditTimeline.ts
src/lib/lab/search.ts
src/lib/notifications.ts

src/components/lab/LabDocumentEditor.astro

src/pages/lab/index.astro
src/pages/lab/documents/index.astro
src/pages/lab/documents/[id].astro
src/pages/lab/documents/[id]/edit.astro
src/pages/lab/documents/[id]/versions.astro

────────────────────────────────────────
TESTS
────────────────────────────────────────

Verify:

exactly 33 source rows imported from page 1/3

unique codes

Rev 0 preserved

source dates preserved

no fake content

no fake document versions

current_version_id null after import

catalog-only details render

catalog-only record searchable

employee can Add Content

first content creates v1

empty content rejected

employee cannot approve

self-review blocked

self-approval blocked

approved version immutable

editing approved creates next draft version

dashboard counts accurate

WI Missing Content accurate

existing code collision does not overwrite content

CSRF

RBAC

audit

No commit.
No push.
No deploy.
```

---

# Prompt 08 — Restore Complete Reporting HTTP Layer

```text
# QC-REPORTING-TRANSPORT-FIX-008
# Restore Reporting Endpoints and Align UI, Catalog and E2E

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

BACKGROUND
The reporting domain exists, including ReportType catalog, authorization,
readers and output writers, while the current UI references HTTP routes for
report downloads.

MISSION
Verify and implement the missing reporting HTTP transport layer so every
advertised report download route resolves to a real server endpoint.

READ FIRST:

src/lib/reporting/**
src/lib/reporting/types.ts
src/lib/lab/labReports.ts or current lab reporting module
src/pages/reports.astro
src/pages/lab/reports.astro
scripts/e2e-reports.mjs
src/lib/permissions.ts
src/lib/api-security.ts
src/middleware.ts

DO NOT reimplement report generation logic inside endpoint files.

────────────────────────────────────────
EXPECTED ROUTES
────────────────────────────────────────

Support the report UI contract equivalent to:

GET /api/reports/[reportType].csv

GET /api/reports/[reportType].xlsx

GET /api/reports/[reportType].pdf

GET /api/reports/audit

Use Astro file routing compatible with these URLs.

────────────────────────────────────────
AUTHORIZATION
────────────────────────────────────────

Authorization must be resolved from the reporting catalog/service layer.

Do not use scattered:

if role === ...

inside endpoints where existing reporting authorization already exists.

Employee must not gain cross-laboratory reports through this fix.

────────────────────────────────────────
VALIDATION
────────────────────────────────────────

Validate:

reportType
format
date/filter parameters
pagination or scope inputs

Reject unsupported report names.

No dynamic SQL built from reportType input.

────────────────────────────────────────
DOWNLOAD HEADERS
────────────────────────────────────────

Use correct:

Content-Type
Content-Disposition
filename

CSV
XLSX
PDF

No unsafe filename input.

────────────────────────────────────────
AUDIT
────────────────────────────────────────

Use existing report_audit_log.

Do not create duplicate reporting audit.

Record:

user
report type
format
filters/parameters where current architecture requires it
timestamp

────────────────────────────────────────
UI
────────────────────────────────────────

Ensure:

src/pages/reports.astro
src/pages/lab/reports.astro

generate only routes that actually exist.

Fix stale copy such as an incorrect count of Lab reports if current catalog
contains a different count.

The catalog is source of truth.

────────────────────────────────────────
TESTS
────────────────────────────────────────

Run/update:

scripts/e2e-reports.mjs

and relevant unit scripts.

Test:

each report type × supported format

unauthenticated rejected

employee Lab report access rejected

supervisor/manager/admin according to permissions

invalid report type rejected

unsupported format rejected

audit record written

content types correct

download non-empty

No commit/push/deploy.
```

---

# Prompt 09 — Audit Durability and Integrity

```text
# QC-AUDIT-DURABILITY-009
# Preserve Audit Evidence Across Task Deletion and Extend QC/Lab Integrity

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

MISSION
Fix audit durability gaps without introducing a new audit subsystem.

READ:

src/lib/activity.ts
src/lib/deleteRequests.ts
src/lib/notifications.ts
src/lib/lab/auditTimeline.ts
all qc_audit_log writers
db/schema.sql
relevant migrations
scripts/test-audit-integrity.mjs
delete-request tests

────────────────────────────────────────
PROBLEM A — TASK DELETE HISTORY
────────────────────────────────────────

Current deletion flow must be reviewed for cascading removal of:

task_delete_requests
task_activity_log

A completed deletion approval must leave durable evidence of:

which task existed
who requested deletion
request reason
who approved/rejected
review note
when
task identity/reference
final outcome

Do not allow the act of deleting the task to delete the only evidence that the
deletion was approved.

────────────────────────────────────────
DESIGN REQUIREMENT
────────────────────────────────────────

Choose a design consistent with current architecture.

Preferred direction:

retain immutable deletion-history information outside task-owned CASCADE rows,
or change FK strategy safely.

Do not create fake task rows.

Do not break existing task children behavior without analysis.

Document migration implications.

────────────────────────────────────────
PROBLEM B — HASH CHAIN
────────────────────────────────────────

Current task activity hash-chain behavior must remain internally valid even
after a legitimate task deletion.

A permitted business operation must not make verification report the whole
audit chain as tampered.

Design and test the chain semantics accordingly.

Do not simply suppress verification errors.

────────────────────────────────────────
PROBLEM C — QC/LAB AUDIT
────────────────────────────────────────

qc_audit_log currently provides the shared Lab/QC timeline.

Add tamper-evident integrity if feasible inside the current SQLite architecture.

Potential fields:

previous_hash
event_hash

But first inspect existing audit ordering and transaction model.

Requirements:

deterministic canonical payload
stable actor/entity/action/timestamp/value representation
chain verification function
transactional hash append

Do not claim cryptographic immutability; call it tamper-evident.

────────────────────────────────────────
BACKWARD COMPATIBILITY
────────────────────────────────────────

Existing rows need a safe migration/backfill strategy.

Do not discard existing audit history.

If a chain segment cannot be retroactively proven, document a genesis/backfill
boundary explicitly.

────────────────────────────────────────
TESTS
────────────────────────────────────────

Test:

normal audit verification passes

manual UPDATE to old audit row fails

manual DELETE from protected history detected

legitimate task deletion does not destroy deletion evidence

legitimate task deletion does not invalidate unrelated audit history

Lab/QC audit chain verifies

approval/rejection records survive

migration preserves old rows

foreign keys pass

No commit/push/deploy.
```

---

# Prompt 10 — Full Regression and Production Readiness Gate

```text
# QC-FINAL-REGRESSION-GATE-010
# Independent Full-System Verification

Repository:
YEEEAE/BRIGHTAI

Scope:
apps/qc-task-manager/

ROLE
Act as an independent verification agent.

Do NOT add features in this prompt unless required to fix a test failure caused
by the implemented change set.

OBJECTIVE
Verify the complete system after Prompts 001-009.

Never report:
production-ready
green
verified

unless evidence supports it.

────────────────────────────────────────
1. MIGRATIONS
────────────────────────────────────────

Verify fresh DB:

001 → latest

Verify upgrade:

026 → 027 → 028 → 029

and any later audit migration created by Prompt 009.

Run:

PRAGMA integrity_check

PRAGMA foreign_key_check

Record:

schema version
table count

Do not use expected numbers if migrations legitimately changed them.
Report actual values.

────────────────────────────────────────
2. BUILD
────────────────────────────────────────

Run:

pnpm install
if dependencies already present, do not unnecessarily mutate lockfile

pnpm typecheck

pnpm build

Report exact output status.

────────────────────────────────────────
3. UNIT / DOMAIN TESTS
────────────────────────────────────────

Enumerate package.json test scripts.

Do not assume aggregate `pnpm test` includes every individual test script.

Run the aggregate.

Then identify any test:* scripts excluded from aggregate and run them separately.

Report:

command
passed
failed
skipped

────────────────────────────────────────
4. SECURITY REGRESSION
────────────────────────────────────────

Verify:

auth
CSRF
CSP
RBAC
IDOR
e-signature
self-review
self-approval
terminal-state freeze
uploads
rate-limit behavior
change-request authorization

────────────────────────────────────────
5. LAB WORKFLOW
────────────────────────────────────────

Test:

Employee creates Test
Employee edits DRAFT
Employee submits
Supervisor reviews
Manager approves
tester cannot review own
reviewer cannot approve own reviewed test
APPROVED frozen

Rejected path:

Submit
Reject
owner reworks
resubmit
review
approve

VOID path with e-signature

────────────────────────────────────────
6. CONTRIBUTOR MASTER DATA
────────────────────────────────────────

Employee proposes equipment create

Manager approves

Employee proposes equipment update

Admin rejects

Employee proposes calibration

Manager approves

Supervisor proposes Product

Admin approves

Verify management visibility and notifications.

────────────────────────────────────────
7. DOCUMENT / WI
────────────────────────────────────────

Verify:

33 imported WI page-1 catalog identities

no fabricated content

source revision preserved

source date preserved

catalog-only detail page

Employee Add Content
Version 1 DRAFT created

Supervisor reviews another user's WI

Manager approves

self-approval fails

edit approved → v2 draft

v1 remains frozen

WI dashboard counts accurate

────────────────────────────────────────
8. PAPER FORM
────────────────────────────────────────

Verify:

new FR-MA-018-aligned fields

legacy fields remain

no scientific hard-coded fallback

references only from compatible approved template

12-row template default where configured

print view accurate

snapshots stable after master-data changes

────────────────────────────────────────
9. REPORTING
────────────────────────────────────────

Verify all advertised reporting URLs.

Run complete reports E2E.

No 404 for advertised report actions.

Report audit works.

────────────────────────────────────────
10. FULL E2E ACCEPTANCE
────────────────────────────────────────

Run the acceptance runner from start to finish.

All suites must terminate cleanly.

Ensure every Playwright browser/context is closed.

Do not call full E2E PASS if the process hangs after assertions.

Record:

suite count
suite names
assertion count
failures
duration

If one suite is unverified:
overall E2E = UNVERIFIED

────────────────────────────────────────
11. RESTART / PERSISTENCE
────────────────────────────────────────

Test:

start server
create controlled records
stop server
restart server
verify records remain

Include:

WI content
change request
approved test

────────────────────────────────────────
12. BACKUP / RESTORE
────────────────────────────────────────

Create backup.

Verify:

checksum
integrity_check
foreign_key_check

Mutate DB.

Restore backup.

Restart.

Verify restored state.

────────────────────────────────────────
13. HEALTH
────────────────────────────────────────

Verify:

/api/health

Expected behavior against:

missing DB
uninitialized DB
healthy initialized DB

────────────────────────────────────────
14. PRODUCTION STATUS
────────────────────────────────────────

Separate final result into:

IMPLEMENTED

VERIFIED LOCALLY

VERIFIED IN PRODUCTION

Do not promote a feature from one level to another without evidence.

If no live deployment was tested:

Verified in production = NO

────────────────────────────────────────
15. FINAL OUTPUT
────────────────────────────────────────

Produce:

A. migration result
B. typecheck/build result
C. unit/domain test table
D. E2E suite table
E. security results
F. laboratory workflow results
G. WI results
H. reporting results
I. backup/restore results
J. remaining failures
K. Production GO / NO-GO

A Production GO requires:

all migrations clean
typecheck clean
build clean
required tests clean
full E2E terminates and passes
report endpoints work
audit integrity tests pass
backup/restore passes
restart persistence passes
no confirmed P0/P1 blocker

Do not commit.
Do not push.
Do not deploy unless explicitly instructed in a separate task.
```

---

## الترتيب الصحيح للتنفيذ

نفّذها بهذا التسلسل:

**001 → 002 → 003 → 004 → 007 → 005 → 006 → 008 → 009 → 010**

سبب تقديم `007 WI Catalog` على `005 Air/Vacuum`: عشان نفصل أولًا Document/Master data architecture، وبعدها نعدل Test Form بدون خلط بين WI database وبين Test Template references.

ومن ناحية الـ migrations يبقى الترتيب العددي:

```text
026 current
↓
027 Lab Change Requests
↓
028 Lab Test Form Alignment
↓
029 WI Catalog Import
↓
030+ إذا احتاج Audit Durability migration
```

النقطة الأهم اللي أضفتها بعد صورة الـWI: **الـ33 سجل تدخل قاعدة البيانات من الآن كعناوين فعلية قابلة للبحث والإدارة، لكن بدون أي محتوى وهمي.** وبعدها المحتوى يدخل من المستخدمين عبر نظام الـDocument Versions الموجود أصلًا، وتبقى الإدارة شايفة بالضبط من بدأ المحتوى، من عدله، متى، ومن راجعه واعتمده. الـAudit Timeline الحالي أصلًا مبني لعرض actor + role + before/after + reason، لذلك التوسعة تستفيد منه بدل بناء شيء ثاني.
