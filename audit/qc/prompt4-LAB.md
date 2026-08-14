أكيد. سأكتب **الشرح والملاحظات بالعربي**، أما **أسماء الصفحات والحقول والبرومبتز نفسها بالإنجليزي**؛ وهذه النسخة المحسّنة تضيف تدقيق قاعدة البيانات، seed آمن، حماية SQLite/Render، توحيد مخرجات الوكيل، وحقول التتبع المهمة.

## أهم التحسينات المعتمدة

- إضافة `Test Number` و`Test Date` لكل اختبار.
- استخدام `seed_key` ثابت للأجهزة بدل `code + serial` لأن بعض القيم مكررة.
- إضافة برومبت مستقل لفحص قاعدة البيانات القديمة قبل أي Migration.
- منع DeepSeek من تعديل النظام الحالي أو اختراع قواعد علمية.
- فرض تشغيل المشروع داخل `apps/qc-task-manager/` وليس `apps/dashboard/`.
- إضافة اختبارات IDOR وCSRF وXSS وCSV Formula Injection.
- إضافة قرار صريح لتخزين SQLite على Render باستخدام Persistent Disk.
- إلزام الوكيل بإرجاع الملفات المعدلة، أوامر التشغيل، نتائج الاختبارات، وأي مخاطر متبقية.

---

# QC Laboratory Implementation Prompt Pack

> **Instruction:** Execute these prompts in order. Every prompt must be given to the same repository-aware agent.

## MASTER CONTEXT

```text
You are implementing a new QC Laboratory module inside the existing monorepo:

Repository: yeeeae/brightai
Primary application: apps/qc-task-manager/
Secondary dashboard application: apps/dashboard/
Reference reports: audit/qc/REPORT.md and audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md

The primary implementation target is apps/qc-task-manager/.
It uses Astro SSR, SQLite, server-side sessions, RBAC, CSRF protection, Zod validation, activity logs, notifications, exports, and existing task-management infrastructure.

Do not rebuild existing authentication, permissions, database, dashboard, notification, or audit systems. Reuse their established conventions.

Do not move the Laboratory pages into apps/dashboard unless the existing architecture explicitly requires a reporting read-model there.

Do not invent scientific formulas, acceptance rules, regulatory requirements, automatic PASS/FAIL decisions, or undocumented fields.

AI may provide advisory information only. AI must never approve, reject, or determine a laboratory result.

For every prompt, first inspect the existing repository conventions. Before finishing, report:

1. Files created or modified.
2. Database migrations added.
3. Commands executed.
4. Test results.
5. Remaining risks or decisions.
6. Any behavior that was intentionally not implemented.

Do not claim production readiness unless all acceptance criteria pass.
```

---

## PROMPT 00: Repository Audit and Implementation Contract

```text
Before writing code, perform a read-only audit of the repository.

Inspect:

1. apps/qc-task-manager/src/lib/
2. Existing database and migration files.
3. Existing authentication and session handling.
4. Existing RBAC and permission helpers.
5. Existing CSRF implementation.
6. Existing Zod validation patterns.
7. Existing activity log and notification services.
8. Existing export and print-view patterns.
9. Existing SSR pages and API routes.
10. Existing tests and test commands.
11. apps/dashboard/ integration conventions.
12. audit/qc/REPORT.md.
13. audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md.
14. Existing prompt or implementation reports related to QC.

Do not modify files.

Produce a concise implementation contract containing:

- The correct database migration pattern.
- The correct server-side authorization pattern.
- The correct CSRF pattern.
- The correct session access pattern.
- The correct activity-log pattern.
- The correct notification pattern.
- The correct API response and error format.
- The correct SSR page structure.
- The correct testing commands.
- The correct way to integrate laboratory metrics with the dashboard.

Also identify conflicts between older reports and newer reports. The newer QC Laboratory report must be treated as the source of truth unless the repository proves otherwise.
```

---

## PROMPT 01: Existing Database and Migration Safety Audit

```text
Before creating any new Laboratory tables, audit the existing SQLite database and migration state.

Do not change application behavior yet.

Run and document:

1. PRAGMA user_version;
2. PRAGMA foreign_keys;
3. PRAGMA table_info(tasks);
4. PRAGMA table_info(users);
5. PRAGMA foreign_key_check;
6. PRAGMA integrity_check;
7. Inspect all existing CHECK constraints.
8. Inspect all existing migrations and their execution order.
9. Identify any old status constraints that may conflict with current statuses, especially:
   - urgent
   - cancelled
   - completed
   - on_hold
10. Confirm whether existing migrations are idempotent.
11. Confirm whether the current database contains production-like data.

If an old migration or constraint is unsafe, do not silently rewrite production data. Create a safe migration strategy and clearly report the required action.

Do not create Laboratory tables in this prompt.

Acceptance:
- Existing database integrity is explicitly reported.
- Existing foreign keys are explicitly reported.
- Existing task statuses are explicitly reported.
- Any migration risk is documented before new Laboratory work begins.
```

---

## PROMPT 02: Laboratory Database Schema

```text
Create a new idempotent SQLite migration for the QC Laboratory module.

Do not drop, rename, or modify existing tables unless the repository's migration design requires a safe additive change.

Create these tables:

1. lab_test_records

Required fields:

- id
- test_number TEXT NOT NULL UNIQUE
- test_date TEXT NOT NULL
- test_type TEXT NOT NULL CHECK(test_type IN ('AIR', 'VACUUM'))
- product_description TEXT NOT NULL
- connector_type TEXT NOT NULL
- no_of_samples INTEGER NOT NULL
- lot_number TEXT NOT NULL
- sampling_area TEXT NOT NULL
- machine_name TEXT NOT NULL
- equipment_id INTEGER REFERENCES lab_equipment(id)
- medium_used TEXT NOT NULL
- actual_pressure REAL
- torque_in_lb REAL
- assembly_time_sec REAL
- angle TEXT
- temperature_measured REAL
- standard_parameter TEXT
- acceptance_criteria TEXT
- holding_time_reference TEXT
- remarks TEXT
- final_result TEXT CHECK(final_result IN ('PASS', 'FAIL', 'HOLD') OR final_result IS NULL)
- workflow_status TEXT NOT NULL DEFAULT 'DRAFT'
- tested_by INTEGER REFERENCES users(id)
- reviewed_by INTEGER REFERENCES users(id)
- approved_by INTEGER REFERENCES users(id)
- created_by INTEGER REFERENCES users(id)
- updated_by INTEGER REFERENCES users(id)
- submitted_at
- reviewed_at
- approved_at
- created_at
- updated_at

Use safe constraints for:

- test_type
- workflow_status
- final_result
- no_of_samples
- test_number uniqueness

Do not make undocumented scientific fields mandatory.

2. lab_test_samples

Fields:

- id
- test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE CASCADE
- sample_no INTEGER NOT NULL
- part_name TEXT
- set_pressure_in_hg REAL
- actual_pressure REAL
- volume_sec REAL
- pressure_difference REAL
- holding_time_sec REAL
- leakage_rate TEXT
- result TEXT CHECK(result IN ('PASS', 'FAIL', 'HOLD') OR result IS NULL)
- created_at
- updated_at

Add a unique constraint on test_id + sample_no.

3. lab_equipment

Fields:

- id
- seed_key TEXT UNIQUE
- name TEXT NOT NULL
- code TEXT
- location TEXT NOT NULL DEFAULT 'LABORATORY'
- status TEXT NOT NULL
- calibration TEXT
- serial_number TEXT
- notes TEXT
- archived INTEGER NOT NULL DEFAULT 0
- created_by
- updated_by
- created_at
- updated_at

The seed_key is mandatory for the initial 24 equipment rows. Do not use code + serial_number as the only idempotency key because the source data contains repeated values such as '-' and '—'.

4. lab_documents

Fields:

- id
- document_code TEXT
- title TEXT NOT NULL
- document_type TEXT NOT NULL CHECK(document_type IN ('SOP', 'WI'))
- description TEXT
- product_reference TEXT
- owner_id INTEGER REFERENCES users(id)
- current_version_id INTEGER
- status TEXT NOT NULL DEFAULT 'DRAFT'
- effective_date
- review_due_date
- created_at
- updated_at

5. lab_document_versions

Fields:

- id
- document_id INTEGER NOT NULL REFERENCES lab_documents(id) ON DELETE CASCADE
- version_number INTEGER NOT NULL
- content_markdown TEXT NOT NULL
- change_summary TEXT NOT NULL
- status TEXT NOT NULL
- author_id INTEGER REFERENCES users(id)
- reviewed_by INTEGER REFERENCES users(id)
- approved_by INTEGER REFERENCES users(id)
- created_at
- approved_at

Add a unique constraint on document_id + version_number.

6. lab_document_links

Support links between documents, tests, and equipment.

7. lab_activity_log

Support:

- entity_type
- entity_id
- event
- actor_id
- old_value
- new_value
- ip
- created_at

Add indexes for:

- test_number
- test_type
- workflow_status
- final_result
- lot_number
- test_date
- equipment code
- equipment status
- document status
- review_due_date

Run:

- PRAGMA table_info for every new table.
- PRAGMA foreign_key_check.
- PRAGMA integrity_check.

Do not report success unless the migration runs correctly on both a fresh database and a temporary copy of the existing database.
```

---

## PROMPT 03: Idempotent Equipment Seed

```text
Create an idempotent seed or migration for the 24 initial laboratory equipment records supplied in the QC Laboratory specification.

Use stable seed keys:

- EQUIPMENT-001
- EQUIPMENT-002
- EQUIPMENT-003
- ...
- EQUIPMENT-024

The seed must upsert by seed_key, never by serial_number alone and never by code + serial_number alone.

Preserve the source values exactly, including:

- Arabic status text.
- Arabic notes.
- '-' serial values.
- '—' notes.
- Mixed statuses such as 'تحت الصيانة / NEW'.
- Duplicate codes or serial values.

The seed must:

1. Insert missing rows.
2. Update only the intended seed-owned fields for matching seed_key.
3. Never create duplicates when executed twice.
4. Never delete manually added equipment.
5. Never overwrite user-edited notes or statuses after the initial seed unless the repository has an explicit seed-update policy.
6. Remain safe on an existing populated database.

After execution, verify:

- Exactly 24 seed records exist.
- Every seed_key is unique.
- Duplicate serial values do not merge equipment rows.
- Running the seed twice does not increase the row count.
```

---

## PROMPT 04: Laboratory Permissions and Policies

```text
Extend the existing central permissions system without scattering role checks across pages.

Roles remain:

- Admin
- Manager
- Supervisor
- Employee

Implement permissions for:

- view_lab
- create_lab_test
- edit_lab_test_draft
- submit_lab_test
- review_lab_test
- approve_lab_test
- void_lab_test
- view_lab_equipment
- create_lab_equipment
- edit_lab_equipment
- archive_lab_equipment
- create_lab_document
- edit_lab_document_draft
- review_lab_document
- approve_lab_document
- export_lab_data
- view_lab_dashboard

Rules:

1. Employees may create and edit their own drafts.
2. Employees cannot review or approve tests.
3. Nobody may approve their own test.
4. Managers and Admins may approve tests.
5. Supervisors may review tests and may approve only if an explicit policy flag enables it.
6. Equipment archive requires Manager or Admin unless policy explicitly allows Supervisor.
7. Approved tests and approved document versions are immutable.
8. All checks must run server-side.
9. UI checks are only supplementary.

Create reusable predicates such as:

- canViewLab
- canEditLabTest
- canReviewLabTest
- canApproveLabTest
- canEditLabEquipment
- canArchiveLabEquipment
- canApproveLabDocument

Add unit tests for every role and operation.
```

---

## PROMPT 05: Shared Laboratory Services

```text
Create shared Laboratory services that follow existing project conventions.

Create or extend:

- lab-validation.ts
- lab-policy.ts
- lab-activity.ts
- lab-notifications.ts
- lab-queries.ts
- lab-exports.ts

Validation must cover:

- test_number
- test_date
- test_type
- required employee-entered fields
- positive sample count
- sample rows
- equipment fields
- document metadata
- document version fields

Do not invent scientific formulas or hard validation rules.

Policy must enforce:

Test workflow:

DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED
DRAFT <- REJECTED
APPROVED -> VOID

Document workflow:

DRAFT -> IN_REVIEW -> APPROVED -> SUPERSEDED
IN_REVIEW -> DRAFT when changes are requested
APPROVED -> ARCHIVED only through authorized action

Enforce:

- no self-approval
- no illegal transitions
- no editing approved records
- mandatory rejection/request-change reason
- server-derived tested_by, reviewed_by, and approved_by
- immutable approval timestamps

Every mutation must perform:

1. Session validation.
2. CSRF validation.
3. Permission validation.
4. Input validation.
5. State-policy validation.
6. Database transaction where multiple records change.
7. Activity logging.
8. Notification where required.
```

---

## PROMPT 06: Laboratory Home Page

```text
Create the SSR page:

/lab

Page title:

QC Laboratory

Subtitle:

Product testing, equipment, and controlled laboratory documents

Actions:

- New Air Test
- New Vacuum Test
- Create SOP/WI

Show these server-side KPI cards:

- Draft Tests
- Tests Pending Review
- Approved Tests
- PASS Results
- FAIL Results
- HOLD Results
- Documents Due for Review
- Equipment Under Maintenance
- Equipment Not Calibrated

Show these tables:

1. Recent Test Records
   - Test Number
   - Test Type
   - Test Date
   - Product
   - Final Result
   - Workflow Status
   - Tested By
   - Updated At

2. Pending Reviews
   - Test Number
   - Test Type
   - Owner
   - Submitted At
   - Age
   - Open action

3. Equipment Alerts
   - Equipment
   - Code
   - Status
   - Calibration
   - Updated At

4. Documents Due for Review
   - Document Code
   - Title
   - Document Type
   - Version
   - Owner
   - Review Due Date

The page must support:

- permission-scoped queries
- empty state
- safe error state
- no database paths in errors
- SSR content without requiring JavaScript
- accessible keyboard navigation
- responsive layouts at 360, 768, 1024, and 1440 pixels
```

---

## PROMPT 07: Test List and Test Creation Pages

```text
Create these SSR pages:

/lab/tests
/lab/tests/new?type=air
/lab/tests/new?type=vacuum

Use one shared form component for AIR and VACUUM. Only test_type changes.

The form must contain exactly these employee-entered fields:

1. SAMPLE IDENTIFICATION

- Test Number
- Test Date
- Product Description
- Connector Type
- No. of Samples Tested
- Lot Number
- Sampling Area

Connector Type options:

- Non-locking (Lipid connector)
- Connector with floating or rotatable collar
- Locking connector with fixed threads

2. EQUIPMENT USED

- Machine Name
- Medium Used

3. CONNECTOR ASSEMBLY

- Actual Pressure
- Torque (in.lb)
- Time (Sec.)
- Angle

Show the Actual Pressure reference:

(-2.5 ~ -4) in./Hg

This is a reference hint, not an automatic rejection rule.

4. DIFFERENTIAL CONVERSION

- Temperature (Measured)

Do not calculate any undocumented conversion.

5. TEST PARAMETERS

Show these as reference values:

- Standard Parameter: Subatmospheric Pressure -40 ~ -80 kPa
- Acceptance Criteria: ≤ 800 Pa
- Holding Time: 18 ~ 56 Sec.

6. TEST RESULTS

Start with five rows:

- Sample No.
- Part Name
- Set Pressure (in./Hg)
- Actual Pressure
- Volume (Sec.)
- Pressure Difference
- Holding Time (Sec.)
- Leakage Rate
- Result

Allowed Result values:

- PASS
- FAIL
- HOLD

Include:

- Any Remarks
- Add Sample
- Save Draft
- Submit for Review

Do not include handwritten fields from the source image. Do not add unapproved fields.

The list page must support:

- server-side search
- pagination
- filters
- sorting by allowlisted columns
- Test Number
- Test Type
- Test Date
- Product
- Lot Number
- Final Result
- Workflow Status
- Tested By
- Machine Name

Do not construct SQL directly from query-string values.
```

---

## PROMPT 08: Test Details, Review, Approval, and Print

```text
Create:

/lab/tests/[id]

And the following APIs:

GET /api/lab/tests
POST /api/lab/tests
GET /api/lab/tests/:id
PATCH /api/lab/tests/:id
POST /api/lab/tests/:id/submit
POST /api/lab/tests/:id/review
POST /api/lab/tests/:id/approve
POST /api/lab/tests/:id/void

Draft mode:

- Owner may edit permitted fields.
- Save changes.
- Submit for review.
- Show activity history.

Review mode:

- Show employee-entered values.
- Show reference values.
- Show all sample rows.
- Request Changes requires a reason.
- Approve is visible only to authorized roles.
- Self-approval must be rejected server-side.

Approved mode:

- Read-only fields.
- Test Number and Test Date.
- Tester, reviewer, approver.
- Submit/review/approval timestamps.
- Activity timeline.
- Print view.
- CSV export if permitted.

Void requires an authorized reason.

All mutations require:

- session
- CSRF
- permission
- validation
- state transition check
- transaction where needed
- activity event
- notification

An approved test must never be edited silently.
```

---

## PROMPT 09: Equipment Pages

```text
Create these SSR pages:

/lab/equipment
/lab/equipment/new
/lab/equipment/[id]/edit

Create these APIs:

GET /api/lab/equipment
POST /api/lab/equipment
PATCH /api/lab/equipment/:id
POST /api/lab/equipment/:id/archive

Columns:

- Equipment
- Code
- Location
- Status
- Calibration
- Serial Number
- Notes
- Updated By
- Updated At

Features:

- server-side search
- filters by status and calibration
- add equipment
- edit equipment
- archive instead of delete
- link equipment to tests and documents
- activity history

Rules:

1. Serial numbers are free text.
2. Duplicate serial numbers are allowed when the source data requires them.
3. Archived equipment remains visible in historical test records.
4. Employees cannot edit equipment unless policy grants it.
5. Status and Calibration changes create activity events.
6. The initial 24 rows come from the idempotent seed using seed_key.
7. The page must not contain the seed array.
```

---

## PROMPT 10: SOP/WI Document Pages

```text
Create:

/lab/documents
/lab/documents/new
/lab/documents/[id]
/lab/documents/[id]/edit
/lab/documents/[id]/versions

Document types:

- SOP
- WI

Metadata fields:

- Document Code
- Title
- Document Type
- Description
- Product Reference
- Related Equipment
- Owner
- Effective Date
- Review Due Date
- Change Summary

The editor must:

- store Markdown
- render sanitized HTML preview
- support headings
- support ordered and unordered lists
- support steps
- support tables
- support warnings/callouts
- support safe links
- reject or sanitize scripts and unsafe HTML
- never use unsanitized innerHTML

Rules:

1. Draft documents may be edited by authorized users.
2. Approved documents cannot be edited in place.
3. Editing an approved document creates a new version.
4. Change Summary is mandatory for every new version.
5. Previous versions remain available.
6. Approval creates reviewer and approver metadata.
7. Requests for changes return the document to Draft.
8. Every version change is logged.

Document statuses:

DRAFT
IN_REVIEW
APPROVED
SUPERSEDED
ARCHIVED
```

---

## PROMPT 11: Dashboard, Notifications, and Exports

```text
Integrate Laboratory functionality with the existing system.

Dashboard:

Add a separate Laboratory section with:

- tests by type
- tests by status
- PASS/FAIL/HOLD trend
- average review time
- tests pending approval
- equipment under maintenance
- equipment not calibrated
- documents due for review
- latest laboratory activity

Dashboard visibility:

- Admin: yes
- Manager: yes
- Supervisor: yes
- Employee: no

All metrics must be:

- server-side
- permission-scoped
- period-bounded
- auditable against the database

Notifications:

- notify reviewers when a test is submitted
- notify the owner when changes are requested
- notify owner and relevant approver after approval
- notify document owner when review is due

Exports:

- GET /api/lab/exports/tests.csv
- GET /api/lab/exports/equipment.csv
- GET /api/lab/exports/documents.csv

CSV requirements:

- same permission checks as pages
- safe against formula injection
- escape values beginning with =, +, -, or @
- never expose secrets or internal file paths

Add print views for:

- approved test record
- approved SOP/WI version
```

---

## PROMPT 12: SQLite and Render Deployment Safety

```text
Audit and document how SQLite is persisted in deployment.

The Laboratory module contains regulated operational data. Do not claim the system is production-ready until database persistence is confirmed.

Inspect:

1. Render configuration.
2. Dockerfile.
3. Start command.
4. SQLite database path.
5. Backup path.
6. Whether a persistent disk or persistent volume is configured.
7. Whether deployments can recreate the filesystem.
8. Whether backups are stored outside the disposable application filesystem.

Implement or document one approved strategy:

Option A:
- Render Persistent Disk is configured.
- SQLite database path points to the persistent mount.
- Backups are stored separately.
- Restore procedure is documented and tested.

Option B:
- The application migrates to PostgreSQL or another persistent production database.
- SQLite remains available only for local development and tests.

Add:

- startup database integrity check
- backup command
- restore command
- documented rollback process
- warning when running SQLite without persistent storage

Do not silently switch databases.
Do not delete existing SQLite data.
Report the final deployment decision and its risks.
```

---

## PROMPT 13: Security, Accessibility, and Acceptance Tests

```text
Add and run tests for the complete Laboratory module.

Database tests:

- migration applies once
- migration is idempotent
- foreign keys pass
- integrity_check passes
- five test samples save and reload
- equipment seed creates exactly 24 rows
- running seed twice creates no duplicates
- duplicate serial values do not merge records
- approved tests cannot be edited
- approved document versions remain immutable
- document version numbers increment correctly

Authorization tests:

- Employee cannot approve
- Employee cannot review
- users cannot approve their own test
- unauthorized users cannot access another user's scoped records
- IDOR attempts fail
- archived equipment cannot be deleted
- invalid state transitions fail

Security tests:

- missing CSRF fails
- invalid session fails
- invalid ids fail safely
- SQL injection attempts fail
- XSS in document Markdown is sanitized
- unsafe HTML is not executed
- CSV formula injection is neutralized
- errors do not expose database paths, environment variables, or secrets

E2E tests:

1. Employee creates an Air draft.
2. Employee creates a Vacuum draft.
3. Employee reloads and sees saved values.
4. Employee submits the test.
5. Reviewer requests changes with a reason.
6. Employee edits and resubmits.
7. Authorized approver approves.
8. Owner attempts self-approval and is rejected.
9. Approved test edit is rejected.
10. Equipment edit persists after reload.
11. Equipment seed is idempotent.
12. User creates an SOP/WI draft.
13. User previews sanitized Markdown.
14. Reviewer requests changes.
15. Authorized approver approves the document.
16. New revision does not modify the previous version.
17. Dashboard metrics match database fixtures.
18. Print views render correctly.
19. CSV exports respect permissions.

Run the repository's actual commands, including the appropriate equivalents of:

pnpm --filter @brightai/qc-task-manager typecheck
pnpm --filter @brightai/qc-task-manager test
pnpm --filter @brightai/qc-task-manager build

Report actual PASS/FAIL output. Do not claim tests passed unless they were executed.
```

---

## PROMPT 14: Final Documentation and Handover

```text
Create or update the following documentation:

1. QC Laboratory page report.
2. Laboratory API reference.
3. Laboratory database schema reference.
4. Permission matrix.
5. Equipment seed policy.
6. Test workflow state machine.
7. SOP/WI versioning policy.
8. Backup and restore procedure.
9. SQLite/Render persistence decision.
10. Test and acceptance report.
11. Known limitations and open decisions.

The final report must clearly separate:

- Implemented
- Tested and passed
- Implemented but not fully tested
- Not implemented
- Requires business approval
- Production blockers

Do not describe the module as Production Ready while any critical database, backup, authorization, migration, or deployment blocker remains.
```

---
