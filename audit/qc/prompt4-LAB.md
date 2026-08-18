# BRIGHTAI QC Laboratory
## Complete DeepSeek Flash v4 Master Implementation Prompt Pack

**Repository:** `YEEEAE/BRIGHTAI`  
**Target application:** `apps/qc-task-manager/`  
**Primary route:** `/lab`  
**Prompt language:** English  
**Execution model:** Execute sequentially. Do not skip acceptance criteria.

---

# How to Use This Checklist

- Mark `☐` as not completed.
- Change it to `✅` when the prompt has been implemented and verified.
- Do not mark a prompt complete until its acceptance criteria and tests pass.
- If implementation is partial, leave `☐` and record notes in the status area.
- The executing agent must inspect the current repository before making changes.
- Existing BRIGHTAI architecture is the source of truth.

## Global Prompt Execution Status

Mark a prompt only when that prompt itself has been executed and verified.

- [✅] Prompt 00
- [✅] Prompt 01
- [✅] Prompt 02
- [✅] Prompt 03
- [✅] Prompt 04
- [✅] Prompt 05
- [✅] Prompt 06
- [✅] Prompt 07
- [✅] Prompt 08
- [✅] Prompt 09
- [✅] Prompt 10
- [✅] Prompt 11
- [✅] Prompt 12
- [✅] Prompt 13
- [✅] Prompt 14
- [✅] Prompt 15
- [✅] Prompt 16
- [✅] Prompt 17
- [✅] Prompt 18
- [✅] Prompt 19
- [✅] Prompt 20
- [✅] Prompt 21
- [✅] Prompt 22
- [✅] Prompt 23
- [✅] Prompt 24
- [✅] Prompt 25
- [✅] Prompt 26
- [✅] Prompt 27
- [✅] Prompt 28
- [✅] Prompt 29
- [✅] Prompt 30
- [✅] Prompt 31
- [✅] Prompt 32
- [✅] Prompt 33
- [ ] Prompt 34
- [ ] Prompt 35
- [ ] Prompt 36
- [ ] Prompt 37
- [ ] Prompt 38
- [ ] Prompt 39
- [ ] Prompt 40


---

# MASTER RULES — APPLY TO EVERY PROMPT

```text
You are DeepSeek Flash v4 acting as a senior staff full-stack engineer inside the
existing BRIGHTAI monorepo.

Repository:
YEEEAE/BRIGHTAI

Target application:
apps/qc-task-manager/

Your mission is to implement a complete QC Laboratory workspace that integrates
deeply with the existing application.

THIS IS NOT A GREENFIELD PROJECT.

The current BRIGHTAI implementation is the source of truth.

Before changing anything:

1. Read .agents/brain.md completely.
2. Read the relevant QC audit files.
3. Read:
   audit/qc/REPORT.md
   audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md
   audit/qc/2026-08-14-QC-LAB-IMPLEMENTATION-PROMPTS.md
   audit/qc/before/2026-08-14-EVIDENCE-AUDIT.md
4. Inspect apps/qc-task-manager/ sufficiently to understand:
   - routing
   - layouts
   - components
   - authentication
   - sessions
   - RBAC
   - permissions
   - database
   - migrations
   - validation
   - CSRF
   - audit/activity logging
   - notifications
   - dashboard
   - exports
   - tests
   - existing workflow/state transition patterns
5. Search the repository for existing services/components before creating anything.
6. Reuse existing architecture wherever possible.

NON-NEGOTIABLE:

- Do not create a second application.
- Do not create a second authentication system.
- Do not create a second RBAC system.
- Do not create a second notification system.
- Do not create a second audit system.
- Do not create a second dashboard system.
- Do not create a second export system.
- Do not create a second workflow engine.
- Do not duplicate business logic.
- Do not silently replace existing functionality.
- Do not rewrite unrelated features.
- Do not modify previous database migrations.
- Every schema change must use a new sequential migration.
- Do not modify .env or .env.* files.
- Never introduce secrets.
- Never write secrets into source code, tests, fixtures, logs, prompts, or docs.
- Do not modify CI/CD workflows unless explicitly instructed.
- Do not delete existing data.
- Do not delete existing files unless explicitly necessary and justified.
- Keep current tasks, findings, CAPA, SLA, evidence, workflows, AI guardrails,
  backup, dashboard, authentication, and notification behavior working.
- All authorization must be enforced server-side.
- Never trust hidden form fields for security decisions.
- Never trust query parameters for authorization.
- Never trust client-side role checks.
- Use existing Zod/server validation conventions.
- Use prepared/parameterized SQLite queries.
- Never concatenate untrusted input into SQL.
- Treat employee-entered text as untrusted.
- Treat Markdown/HTML document content as untrusted.
- Protect all state-changing requests with the existing CSRF mechanism.
- Do not invent medical, regulatory, scientific, or quality requirements.
- Do not invent formulas.
- Do not invent acceptance criteria.
- Never allow AI to automatically decide PASS/FAIL.
- Never allow AI to automatically approve a test.
- Never overwrite approved records silently.
- Preserve historical traceability.
- Do not claim something is verified unless the actual verification command passed.

When a requirement conflicts with the existing architecture:

1. inspect the implementation;
2. preserve the architecture;
3. choose the smallest compatible extension;
4. document the decision;
5. do not silently create an alternative architecture.

After every prompt:

1. List exact files changed.
2. List exact commands executed.
3. Report actual command results.
4. Report implementation status.
5. Report test status.
6. Report anything still unverified.
```

---

# PROMPT 00 — COMPLETE REPOSITORY DISCOVERY

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Perform a read-only discovery and architecture audit before implementing the
QC Laboratory.

Inspect:

- existing route map
- application layout
- navigation
- user roles
- permissions
- authentication
- session handling
- database connection
- migrations
- validation
- CSRF
- audit/activity logging
- notifications
- dashboard
- exports
- existing forms
- existing workflow/state transition services
- existing tables related to users/tasks/findings/CAPA/evidence
- testing infrastructure

Search the codebase for reusable:

- table components
- form components
- status badges
- modal/dialog components
- search/filter controls
- dashboard cards
- charts
- notification functions
- audit functions
- authorization helpers
- CSV export helpers
- print styles

Produce:

apps/qc-task-manager/docs/QC-LAB-MASTER-DISCOVERY.md

Classify laboratory-related functionality:

IMPLEMENTED
PARTIAL
MISSING
UNVERIFIED

Do NOT implement features in this prompt.

Acceptance criteria:

- No production code changes.
- The report reflects the real repository.
- Existing architecture is identified.
- Existing implementation is not falsely treated as missing.
```

---

# PROMPT 01 — MASTER LABORATORY ARCHITECTURE

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Create the final architecture contract for the QC Laboratory.

Target route tree:

/lab
/lab/tests
/lab/tests/new?type=air
/lab/tests/new?type=vacuum
/lab/tests/review
/lab/tests/[id]
/lab/tests/[id]/print

/lab/products
/lab/products/new
/lab/products/[id]
/lab/products/[id]/edit

/lab/templates
/lab/templates/new
/lab/templates/[id]
/lab/templates/[id]/edit

/lab/equipment
/lab/equipment/new
/lab/equipment/[id]
/lab/equipment/[id]/edit
/lab/equipment/[id]/maintenance

/lab/calibration
/lab/calibration/[id]

/lab/documents
/lab/documents/new
/lab/documents/[id]
/lab/documents/[id]/edit
/lab/documents/[id]/versions

/lab/retests
/lab/retests/[id]

/lab/search
/lab/reports
/lab/data-quality
/lab/calendar
/lab/notifications

Do not create routes blindly.

If a required feature already exists under another path, reuse the existing path
and document the mapping.

Define:

- route guards
- permissions
- services
- entities
- relationships
- database migration order
- workflow states
- audit events
- notifications
- dashboard dependencies
- export dependencies

Create:

apps/qc-task-manager/docs/QC-LAB-ARCHITECTURE.md
```

---

# PROMPT 02 — DATABASE FOUNDATION

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement the complete database foundation through new sequential migrations.

Do not alter old migrations.

Core entities:

1. lab_test_records
2. lab_test_samples
3. lab_equipment
4. lab_documents
5. lab_document_versions
6. lab_document_links

Additional recommended entities:

7. lab_products
8. lab_test_templates
9. lab_test_template_versions
10. lab_equipment_maintenance
11. lab_equipment_calibration
12. lab_test_retests
13. lab_test_document_snapshots
14. lab_test_equipment_snapshots
15. lab_sample_identifiers
16. lab_document_acknowledgements
17. lab_saved_views
18. lab_calendar_items only if a genuinely normalized calendar entity is needed

Use existing project conventions.

Do not add tables that duplicate existing application entities.

The test record must support:

- AIR
- VACUUM
- DRAFT
- SUBMITTED
- UNDER_REVIEW
- REJECTED
- APPROVED
- VOID

Results:

- PASS
- FAIL
- HOLD

Preserve created/updated metadata.

Use foreign keys and appropriate indexes.

IMPORTANT HISTORICAL RULE:

The canonical equipment relationship should be equipment_id.

Do not rely on equipment_name as the historical relationship.

When a test is finalized/approved, preserve a snapshot of relevant equipment
identity:

- equipment name at time of test
- equipment code at time of test
- serial number at time of test
- calibration state at time of test

Likewise preserve the controlled-document reference/version relevant to an
approved test.

Historical test records must remain historically correct even if equipment,
product, SOP, WI, template, or calibration data changes later.

Acceptance criteria:

- Migration succeeds.
- Fresh database succeeds.
- Existing database succeeds.
- Existing schema integrity remains valid.
```

---

# PROMPT 03 — NAVIGATION + RBAC

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Integrate QC Laboratory into the existing navigation.

Do not replace current navigation.

Use existing:

- layout
- sidebar
- mobile navigation
- breadcrumbs
- permission helpers
- flash messages
- error pages

Use existing roles.

Do not invent new roles unless the repository proves a new role is unavoidable.

Create/extend centralized permissions:

LAB_VIEW
LAB_TEST_CREATE
LAB_TEST_EDIT
LAB_TEST_SUBMIT
LAB_TEST_REVIEW
LAB_TEST_APPROVE
LAB_TEST_VOID

LAB_PRODUCT_VIEW
LAB_PRODUCT_EDIT
LAB_TEMPLATE_VIEW
LAB_TEMPLATE_EDIT

LAB_EQUIPMENT_VIEW
LAB_EQUIPMENT_EDIT
LAB_EQUIPMENT_ARCHIVE
LAB_EQUIPMENT_MAINTENANCE
LAB_CALIBRATION_VIEW
LAB_CALIBRATION_EDIT

LAB_DOCUMENT_VIEW
LAB_DOCUMENT_CREATE
LAB_DOCUMENT_EDIT
LAB_DOCUMENT_REVIEW
LAB_DOCUMENT_APPROVE
LAB_DOCUMENT_ARCHIVE
LAB_DOCUMENT_ACKNOWLEDGE

LAB_RETEST_CREATE
LAB_RETEST_VIEW

LAB_EXPORT
LAB_MANAGEMENT_DASHBOARD
LAB_DATA_QUALITY

Do not duplicate the permission system.

Acceptance criteria:

- unauthorized route access is blocked server-side;
- navigation is role-aware;
- hidden fields cannot bypass permissions;
- query parameters cannot bypass permissions;
- existing routes remain unchanged.
```

---

# PROMPT 04 — QC LABORATORY HOME / COMMAND CENTER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab as the operational Laboratory Command Center.

Header:

QC Laboratory

Description:

Product testing, equipment, calibration, controlled documents, and laboratory
quality operations.

Actions:

- New AIR Test
- New VACUUM Test
- New Retest where applicable
- New Product
- New Template
- New SOP
- New WI
- Equipment
- Calibration

KPIs:

- Tests Today
- Tests This Week
- Draft Tests
- Awaiting Review
- Approved Tests
- PASS
- FAIL
- HOLD
- Equipment Requiring Attention
- Calibration Due
- Documents Due for Review
- Retests Open
- Data Quality Issues

Sections:

Recent Tests
Pending Reviews
Equipment Alerts
Calibration Alerts
Document Reviews Due
Open Retests
Recent Laboratory Activity

Every KPI should support drill-down to filtered records.

Use real database queries.

Do not rebuild the global dashboard.
```

---

# PROMPT 05 — SHARED AIR/VACUUM TEST FORM

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Build one shared test form architecture for AIR and VACUUM.

Routes:

/lab/tests/new?type=air
/lab/tests/new?type=vacuum

Only include printed/black fields from the supplied QC form.
Do not add handwritten-only fields.

Section 1 — SAMPLE IDENTIFICATION

- Product Description
- Connector Type
- No. of Samples Tested
- Lot Number
- Sampling Area

Connector Type:

- Non-locking (Lipid connector)
- Connector with floating or rotatable collar
- Locking connector with fixed threads

Section 2 — EQUIPMENT USED

- Machine Name
- Medium Used

Machine Name should be backed by equipment_id whenever possible.

Section 3 — CONNECTOR ASSEMBLY

- Actual Pressure
- Torque (in.lb)
- Time (Sec.)
- Angle

Display:

Actual Pressure:
(-2.5 ~ -4) in./Hg

Section 4 — DIFFERENTIAL CONVERSION

- Temperature (Measured)

Section 5 — TEST PARAMETERS

Standard Parameter:
Subatmospheric Pressure -40 ~ -80 kPa

Acceptance Criteria:
≤ 800 Pa

Holding Time:
18 ~ 56 Sec.

Section 6 — TEST RESULTS

Five initial rows.

Columns:

- Sample No.
- Part Name
- Set Pressure (in./Hg)
- Actual Pressure
- Volume (Sec.)
- Pressure Difference
- Holding Time (Sec.)
- Leakage Rate
- Result

Result:

PASS
FAIL
HOLD / FURTHER EVALUATION

Any Remarks

Section 7 — AUTHORIZATION

- Tested By
- Reviewed By
- Approved By: Q.C.M.

Section 8 — FINAL RESULT

PASS
FAIL
HOLD / FURTHER EVALUATION

Capabilities:

- Save Draft
- Save and Continue
- Submit
- Cancel
- Unsaved change detection
- Accessible sample table
- Mobile support

Do not invent scientific formulas.

Do not let AI determine final results.
```

---

# PROMPT 06 — TEST REGISTER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab/tests.

Columns:

- Test ID
- Type
- Product
- Lot
- Sampling Area
- Equipment
- Tester
- Result
- Workflow Status
- Created
- Updated

Filters:

- Type
- Status
- Result
- Tester
- Equipment
- Product
- Lot
- Date

Search:

- Test ID
- Product
- Lot
- Equipment
- Tester

Requirements:

- server-side search
- pagination
- safe sorting
- indexed fields
- RBAC filtering
- export action where permitted

Approved tests must be visually read-only.
```

---

# PROMPT 07 — TEST DETAIL + PRINT

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/tests/[id]
/lab/tests/[id]/print

Detail must contain:

Test Identification
Sample Identification
Equipment
Connector Assembly
Differential Conversion
Test Parameters
Sample Results
Remarks
Authorization
Final Result
Workflow
Applicable SOP/WI
Equipment Snapshot
Calibration Snapshot
Audit Timeline
Retest History
Related Product
Related Investigation/NCR/CAPA hooks if existing system supports them

Approved records are read-only.

Print:

- A4
- server-rendered
- professional laboratory record
- no navigation
- no dashboard chrome
- exact stored values
- record ID
- controlled version metadata
- final result
- authorization
- relevant SOP/WI version
- equipment snapshot
- calibration state snapshot

Acceptance criteria:

- print output matches stored record exactly;
- historical references remain unchanged.
```

---

# PROMPT 08 — REVIEW CENTER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab/tests/review.

Dashboard:

- Awaiting Review
- Aging
- Rejected
- Approved Today
- HOLD

Filters:

- Test type
- Tester
- Product
- Lot
- Date
- Result
- Aging

Actions:

- Start Review
- Request Changes
- Reject
- Approve

Rules:

- Tester cannot approve own test.
- Rejection requires reason.
- Request Changes requires reason.
- Approval requires permission.
- Approved record immutable.
- Every transition audited.
- Existing notifications reused.

Do not build a second workflow engine.
```

---

# PROMPT 09 — PRODUCT MASTER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement a laboratory Product Master.

Routes:

/lab/products
/lab/products/new
/lab/products/[id]
/lab/products/[id]/edit

Fields:

- Product Name
- Product Code
- Product Description
- Connector Type
- Default Test Type
- Applicable Test Template
- Applicable SOP
- Applicable WI
- Related Equipment
- Active / Inactive
- Notes

When creating a test:

Employee selects product.

The system may populate approved reference values and linked documents.

Measured values remain editable and are never silently overwritten.

Use Product ID as the canonical relationship.

Historical tests must retain historical product identity.

Audit changes.
```

---

# PROMPT 10 — TEST TEMPLATES

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement laboratory Test Templates.

Routes:

/lab/templates
/lab/templates/new
/lab/templates/[id]
/lab/templates/[id]/edit

Types:

- AIR
- VACUUM

Templates may define:

- standard parameters
- reference ranges
- expected test structure
- default sample count
- connector options
- applicable SOP
- applicable WI
- equipment compatibility
- product associations

Do not let templates silently overwrite measured results.

Version templates.

When a test is created from a template, store:

- template_id
- template_version

Snapshot relevant configuration where needed for historical reproducibility.
```

---

# PROMPT 11 — EQUIPMENT REGISTRY

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/equipment
/lab/equipment/new
/lab/equipment/[id]
/lab/equipment/[id]/edit

Columns:

- Equipment
- Code
- Location
- Status
- Calibration
- Serial Number
- Notes

Seed the supplied 24 laboratory equipment records exactly as provided by the
business specification.

Preserve supplied values exactly.

Do not invent missing information.

Editable fields:

- equipment name
- code
- location
- status
- calibration status
- serial number
- notes

Features:

- search
- filters
- create
- edit
- archive
- restore where supported
- history

Important:

Use equipment_id as the canonical relationship.

Never hard-delete referenced equipment.
```

---

# PROMPT 12 — EQUIPMENT MAINTENANCE

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/equipment/[id]/maintenance

Fields:

- maintenance date
- issue
- maintenance type
- description
- technician/vendor
- status
- completed date
- notes

Do not fabricate historical entries.

Equipment timeline should combine:

- usage
- maintenance
- calibration
- returned to service

Audit all maintenance changes.
```

---

# PROMPT 13 — CALIBRATION MANAGEMENT

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/calibration

Fields:

- Equipment
- Last Calibration Date
- Calibration Due Date
- Calibration Provider
- Certificate Reference
- Calibration Result
- Next Due Date
- Status
- Notes

Support:

- compliant
- due
- overdue
- not compliant
- unknown

Missing data must remain nullable.

Use existing notification infrastructure.

When selecting equipment for a test:

show calibration status.

Do not block a test automatically unless an approved existing policy requires it.

At finalization/approval, snapshot the calibration state.
```

---

# PROMPT 14 — SOP/WI LIBRARY

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/documents

Support:

SOP
WI

Columns:

- Document Code
- Title
- Type
- Version
- Status
- Owner
- Effective Date
- Review Due
- Updated At

Filters:

- type
- status
- owner
- equipment
- product
- review due

Search:

- title
- code
- product
- equipment

Statuses:

DRAFT
IN_REVIEW
APPROVED
SUPERSEDED
ARCHIVED

Approved versions are immutable.
```

---

# PROMPT 15 — SOP/WI EDITOR

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/documents/new
/lab/documents/[id]/edit

Fields:

- document type
- title
- document code
- description
- product reference
- equipment
- owner
- review due date
- effective date
- change summary
- content

Support:

- headings
- numbered steps
- bullets
- tables
- warnings
- notes
- checklists
- safe links

Sanitize rendered HTML.

Workflow:

DRAFT
→ IN_REVIEW
→ APPROVED
→ SUPERSEDED
or
→ ARCHIVED

Editing approved content creates a new version.

Old approved version remains immutable.
```

---

# PROMPT 16 — DOCUMENT VERSION COMPARISON

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement:

/lab/documents/[id]/versions

Display:

- version
- status
- author
- created
- reviewer
- approver
- approval date
- change summary

Allow authorized comparison.

Comparison is read-only.
```

---

# PROMPT 17 — VERSION-LOCKED TEST REFERENCES

**Execution Checklist**

- [✅] Prompt executed and verified

```text
When a test is finalized/approved, preserve the exact relevant reference context.

Preserve:

1. Product identity snapshot
2. Equipment identity snapshot
3. Equipment calibration state snapshot
4. SOP code + version
5. WI code + version
6. Template + template version where applicable
7. Reference parameter values used
8. Relevant units

Historical tests must continue showing the exact references used at that time.

Example:

If a test used SOP-QC-001 v3,
later approving v4 must not change that historical test to v4.

Never dynamically resolve historical references to current values.
```

---

# PROMPT 18 — RETEST / REPEAT TEST WORKFLOW

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement a controlled Retest workflow.

Routes:

/lab/retests
/lab/retests/[id]

Allow authorized users to create a retest from an existing test.

Preserve:

- original test ID
- reason
- original result
- original final state
- new test ID
- relationship

Do not modify original test.

Example:

TEST-00081
  RETEST-01
  RETEST-02

Audit every retest creation and completion.
```

---

# PROMPT 19 — SAMPLE TRACEABILITY

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement sample-level traceability.

Each sample has a stable identifier.

Example:

LAB-TEST-00081-S03

Store:

- test
- sample number
- sample identifier
- part name
- status
- result

Sample identifiers must remain stable after test approval.

Do not duplicate the entire test record.
```

---

# PROMPT 20 — INVESTIGATION / NCR / CAPA HOOKS

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Do not build a duplicate NCR/CAPA system.

Inspect existing:

- findings
- NCR-like entities
- CAPA
- investigations

If existing entities exist:

allow laboratory tests to link to them.

Possible relationship:

Test
→ Finding
→ CAPA

or:

Test
→ Investigation

If no suitable target exists, create only a minimal future-compatible relation
hook.

Do not build a second quality-management workflow.
```

---

# PROMPT 21 — DOCUMENT ACKNOWLEDGEMENT

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement controlled-document acknowledgement.

Track:

- document
- version
- employee
- assigned date
- acknowledged date
- status

Statuses:

PENDING
ACKNOWLEDGED

Acknowledgement is version-specific.

SOP v3 acknowledgement does not equal SOP v4 acknowledgement.

Use existing user and notification architecture.
```

---

# PROMPT 22 — DOCUMENT REVIEW SCHEDULER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Extend document review management.

Show:

- 30 days remaining
- 15 days remaining
- 7 days remaining
- due today
- overdue

Reuse existing notification/scheduling architecture.

Do not duplicate scheduler infrastructure.
```

---

# PROMPT 23 — LABORATORY SEARCH

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab/search.

Search across:

- tests
- samples
- products
- equipment
- SOPs
- WIs
- retests

Search fields:

- test ID
- sample ID
- product
- lot
- equipment
- equipment code
- serial number
- document code
- document title

Use:

- server-side search
- indexed queries
- pagination
- RBAC filtering
- parameterized SQL

Do not expose unauthorized records.
```

---

# PROMPT 24 — SAVED VIEWS / FILTERS

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement user-specific saved laboratory views.

Examples:

My Air Tests
My Vacuum Tests
Awaiting My Review
Failed Tests
HOLD Tests
Equipment Under Maintenance
Calibration Due Soon
SOP Review Due
Pending Document Acknowledgement
Retests Open

Store structured validated filters.

Never store arbitrary SQL.

Users only see their own saved views.
```

---

# PROMPT 25 — LABORATORY CALENDAR

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab/calendar.

Display real operational dates:

- equipment calibration
- equipment maintenance
- SOP review deadlines
- WI review deadlines
- document acknowledgement deadlines
- supported test/retest dates

Do not invent events.

Use existing calendar infrastructure if available.
```

---

# PROMPT 26 — LABORATORY NOTIFICATION CENTER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab/notifications.

Show:

- review requests
- rejected tests
- requested changes
- approved tests
- document review reminders
- document acknowledgement reminders
- calibration reminders
- maintenance alerts
- retest updates

Reuse existing notification infrastructure.

Provide read/unread state and entity links.
```

---

# PROMPT 27 — DATA QUALITY CENTER

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement /lab/data-quality.

Identify data quality conditions such as:

Tests:
- missing lot
- missing equipment
- missing tester
- incomplete samples
- missing final result when required
- inconsistent status

Equipment:
- missing code
- missing serial
- missing calibration state
- missing location

Documents:
- missing owner
- missing review date
- missing approval metadata
- missing effective date where required

Products:
- missing code
- inactive product used unexpectedly
- missing applicable document where required

Only report conditions supported by actual data/policy.

Do not silently modify records.
```

---

# PROMPT 28 — DASHBOARD INTEGRATION

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Integrate the laboratory into the existing main dashboard.

Do not replace or rebuild it.

Metrics:

Tests:
- total
- AIR
- VACUUM
- draft
- submitted
- under review
- approved
- rejected
- void

Results:
- PASS
- FAIL
- HOLD

Equipment:
- active
- new
- maintenance
- unused
- calibration attention
- calibration compliant

Documents:
- SOP
- WI
- draft
- review
- approved
- superseded
- archived
- review due
- acknowledgement pending

Retests:
- total
- open
- completed
- by reason

Data Quality:
- open issues

Charts:

- tests by date
- AIR vs VACUUM
- PASS/FAIL/HOLD
- equipment status
- calibration
- document review status

Every KPI should support drill-down.
```

---

# PROMPT 29 — REPORTS AND EXPORTS

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Integrate Laboratory reporting into existing export architecture.

Reports:

1. Laboratory Test Register
2. AIR Test Register
3. VACUUM Test Register
4. PASS/FAIL/HOLD Report
5. Retest Report
6. Product Test History
7. Equipment Register
8. Equipment Calibration Report
9. Equipment Maintenance Report
10. SOP Register
11. WI Register
12. Document Review Due Report
13. Document Acknowledgement Report
14. Laboratory Activity Report
15. Data Quality Report

Respect all filters and permissions.

Never export secrets.

Use safe CSV generation.

Reuse the existing exporter.
```

---

# PROMPT 30 — LABORATORY AUDIT

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Every state-changing laboratory action must use the existing audit architecture.

Tests:
- create
- update
- submit
- review
- request changes
- reject
- approve
- void
- retest creation

Equipment:
- create
- update
- archive
- restore
- maintenance
- calibration

Products:
- create
- update
- archive

Templates:
- create
- update
- approve
- version

Documents:
- create
- update
- submit
- request changes
- approve
- supersede
- archive
- acknowledge

Relationships:
- link
- unlink

Do not store secrets in audit records.
```

---

# PROMPT 31 — ADVANCED AUDIT TIMELINE

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Create a readable Laboratory Audit Timeline.

Example:

14 Aug 2026 09:41
Employee created Test LAB-00081

14 Aug 2026 10:03
Employee submitted test

14 Aug 2026 11:20
Reviewer started review

14 Aug 2026 11:41
Reviewer requested changes

14 Aug 2026 13:10
Employee resubmitted

14 Aug 2026 14:02
QC Manager approved

Show:

- who
- what
- when
- before
- after
- reason

Do not create a parallel history system.
```

---

# PROMPT 32 — AI QC COPILOT

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Add a controlled AI assistance layer only if the existing BRIGHTAI AI
architecture supports safe integration.

AI may:

- summarize a test
- summarize equipment history
- summarize SOP/WI changes
- identify missing fields
- suggest review questions
- compare a test against approved SOP/WI content
- summarize historical FAIL patterns
- summarize repeated retests
- summarize data-quality issues

AI MUST NOT:

- decide PASS/FAIL
- approve tests
- approve documents
- modify records
- modify results
- modify equipment
- modify calibration
- invent scientific acceptance criteria

Every AI response must be clearly marked:

AI GENERATED — HUMAN REVIEW REQUIRED

Reuse existing AI infrastructure, permissions, guardrails, logging, and
configuration.
```

---

# PROMPT 33 — SECURITY HARDENING

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Perform a complete Laboratory security audit.

Test:

- authentication bypass
- RBAC bypass
- IDOR
- CSRF
- XSS
- SQL injection
- mass assignment
- hidden field manipulation
- route ID manipulation
- document access bypass
- export bypass
- equipment edit bypass
- self approval
- status transition bypass
- retest authorization
- saved view injection
- Markdown injection
- HTML injection
- malicious URLs
- audit tampering
- information leakage

For each vulnerability:

1. reproduce
2. identify root cause
3. fix
4. add regression test
5. rerun test

Acceptance criteria:

- no known critical/high Laboratory security issue remains.
```

---

# PROMPT 34 — PERFORMANCE + DATABASE INDEXING

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Audit laboratory database performance.

Inspect:

- test register
- review queue
- test details
- sample queries
- equipment
- maintenance
- calibration
- products
- templates
- documents
- versions
- search
- dashboard
- reports
- audit timeline

Check:

- N+1 queries
- missing indexes
- unbounded queries
- duplicate queries
- SELECT *
- expensive aggregation
- inefficient sorting
- inefficient search

Add only necessary indexes using new migrations.
```

---

# PROMPT 35 — ACCESSIBILITY + RESPONSIVE UX

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Perform an accessibility and responsive pass across the complete Laboratory.

Test:

360px
768px
1024px
1440px

Check:

- keyboard navigation
- focus
- screen readers
- labels
- validation
- table semantics
- touch target size
- responsive forms
- responsive tables
- modals
- alerts
- status badges
- print views
- loading
- empty states
- error states

The Laboratory must feel native to BRIGHTAI.

Do not redesign unrelated application areas.
```

---

# PROMPT 36 — COMPREHENSIVE TEST SUITE

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Create or extend tests for the complete Laboratory.

Database:
- migrations
- constraints
- foreign keys
- indexes

Tests:
- AIR creation
- VACUUM creation
- draft
- submit
- review
- reject
- request changes
- approve
- void
- self-approval prevention
- immutable approval

Samples:
- five samples
- controlled extension
- validation
- identifiers

Equipment:
- all 24 seed records
- edit
- archive
- maintenance
- calibration

Products:
- create
- edit
- archive
- relation to tests

Templates:
- create
- version
- relation to test

Documents:
- SOP
- WI
- draft
- review
- approval
- version
- comparison
- acknowledgement

Retests:
- create
- link
- original immutability

Dashboard:
- KPI accuracy
- role visibility

Search:
- authorization
- correctness

Exports:
- escaping
- authorization
- filtering

Security:
- CSRF
- IDOR
- XSS
- SQL injection
- permission bypass

AI:
- cannot approve
- cannot mutate
- clearly labeled output

Use isolated temporary databases.

Never run destructive tests against production data.
```

---

# PROMPT 37 — END-TO-END BUSINESS WORKFLOWS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Run and verify complete end-to-end business workflows.

WORKFLOW A — AIR TEST

Employee
→ Select product
→ Select AIR template
→ Select equipment
→ Enter sample information
→ Enter connector assembly
→ Enter test results
→ Save draft
→ Submit
→ Reviewer opens
→ Reviewer reviews
→ Approves
→ Record becomes read-only
→ Print
→ Dashboard updates
→ Audit recorded
→ Notification generated

WORKFLOW B — VACUUM TEST

Employee
→ Create VACUUM test
→ Save
→ Submit
→ Reviewer rejects
→ Reason captured
→ Employee edits
→ Resubmits
→ Reviewer approves

WORKFLOW C — EQUIPMENT

Manager
→ Create equipment
→ Edit equipment
→ Add maintenance
→ Add calibration
→ Link to test
→ Archive equipment
→ Historical test still shows original equipment snapshot

WORKFLOW D — SOP

Employee
→ Create SOP
→ Draft
→ Submit
→ Reviewer requests changes
→ Employee updates
→ Resubmit
→ Approve
→ Version 1 becomes immutable

WORKFLOW E — SOP REVISION

Create Version 2
→ Approve Version 2

Old tests continue showing Version 1.
New tests use Version 2.

WORKFLOW F — RETEST

Test FAIL
→ Authorized user creates retest
→ Original remains unchanged
→ Retest references original
→ Retest reviewed
→ Retest approved

WORKFLOW G — ACKNOWLEDGEMENT

SOP v4 approved
→ Employees receive acknowledgement requirement
→ Employee acknowledges
→ Dashboard updates
```

---

# PROMPT 38 — FINAL CODE QUALITY PASS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Inspect all Laboratory implementation for:

- duplicate code
- duplicate components
- dead code
- unused imports
- unnecessary dependencies
- inconsistent naming
- inconsistent enums
- inconsistent authorization
- inconsistent validation
- unsafe error handling
- missing audit events
- missing tests
- missing indexes
- incomplete loading states
- incomplete error states
- incomplete empty states
- duplicated database logic

Remove only unnecessary code introduced by Laboratory work.

Do not remove unrelated legacy functionality.

Run:

- formatter
- linter
- type check
- unit tests
- integration tests
- end-to-end tests
- production build

Record exact results.
```

---

# PROMPT 39 — PRODUCTION READINESS AUDIT

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Perform final production-readiness verification.

Verify:

Architecture
Database
Migrations
Authentication
RBAC
CSRF
Validation
SQL safety
XSS protection
Audit
Notifications
Dashboard
Search
Reports
Exports
Print
Accessibility
Responsive UI
Performance
AI guardrails
Document control
Equipment history
Calibration
Retesting
Data quality
Testing

Create:

apps/qc-task-manager/docs/QC-LAB-PRODUCTION-READINESS.md

Classify:

PASS
PARTIAL
FAIL
UNVERIFIED

Never mark PASS without real verification.

Provide:

1. Implemented functionality
2. Existing functionality reused
3. Database changes
4. Routes
5. Permissions
6. Audit integration
7. Notification integration
8. Dashboard integration
9. Product integration
10. Template integration
11. Equipment integration
12. Calibration integration
13. SOP/WI integration
14. Retest integration
15. Investigation/CAPA hooks
16. Data quality
17. AI guardrails
18. Security
19. Performance
20. Accessibility
21. Tests
22. Remaining risks
23. Required manual validation
24. Exact files changed
25. Exact commands executed
26. Exact results
```

---

# PROMPT 40 — FINAL MASTER REGRESSION

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Perform the final regression audit of BRIGHTAI.

The QC Laboratory implementation must not break:

- authentication
- sessions
- users
- tasks
- task updates
- evidence
- findings
- CAPA
- SLA
- notifications
- dashboard
- exports
- backup
- audit integrity
- existing AI functionality

Run the complete relevant test suite for the repository.

Verify:

- clean installation
- migration from existing database
- migration from empty database
- seeded laboratory data
- all routes
- all state transitions
- all permission boundaries
- all exports
- all audit events
- all critical dashboard metrics

Do NOT deploy.

Do NOT push.

Do NOT alter CI/CD.

Do NOT claim success unless actual verification succeeds.

Produce the final verification summary.
```

---

# FINAL EXECUTION ORDER

## Phase 1 — Foundation

- [ ] 00 Discovery
- [ ] 01 Architecture
- [ ] 02 Database
- [ ] 03 Navigation/RBAC

## Phase 2 — Core Laboratory

- [ ] 04 Laboratory Home
- [ ] 05 AIR/VACUUM Forms
- [ ] 06 Test Register
- [ ] 07 Test Detail/Print
- [ ] 08 Review Center

## Phase 3 — Master Data

- [ ] 09 Product Master
- [ ] 10 Test Templates
- [ ] 11 Equipment Registry
- [ ] 12 Equipment Maintenance
- [ ] 13 Calibration

## Phase 4 — Controlled Documents

- [ ] 14 SOP/WI Library
- [ ] 15 SOP/WI Editor
- [ ] 16 Version Comparison
- [ ] 17 Version-Locked References
- [ ] 21 Document Acknowledgement
- [ ] 22 Document Review Scheduler

## Phase 5 — Traceability and Quality

- [ ] 18 Retest
- [ ] 19 Sample Traceability
- [ ] 20 Investigation/NCR/CAPA Hooks
- [ ] 27 Data Quality Center

## Phase 6 — Productivity

- [ ] 23 Search
- [ ] 24 Saved Views
- [ ] 25 Laboratory Calendar
- [ ] 26 Laboratory Notifications

## Phase 7 — Intelligence and Reporting

- [ ] 28 Dashboard Integration
- [ ] 29 Reports/Exports
- [ ] 30 Audit
- [ ] 31 Audit Timeline
- [ ] 32 AI QC Copilot

## Phase 8 — Hardening

- [ ] 33 Security
- [ ] 34 Performance
- [ ] 35 Accessibility
- [ ] 36 Test Suite
- [ ] 37 End-to-End Workflows
- [ ] 38 Code Quality
- [ ] 39 Production Readiness
- [ ] 40 Final Regression

---

# DEFINITION OF DONE

The QC Laboratory is considered complete only when all execution prompts have been verified, the relevant acceptance criteria pass, existing BRIGHTAI functionality remains intact, and the final regression is green.

---

# AGENT EXECUTION CONTRACT

```text
DO NOT EXECUTE ALL PROMPTS AS ONE BLIND BATCH.

After each prompt:

1. Inspect current state.
2. Implement only the requested scope.
3. Run relevant tests.
4. Verify acceptance criteria.
5. List changed files.
6. List commands executed.
7. Report actual results.
8. Continue only after the prompt is verified.

If something already exists:
REUSE IT.

If something partially exists:
EXTEND IT.

If something is missing:
IMPLEMENT IT.

If something conflicts:
STOP THAT SUBTASK,
EXPLAIN THE CONFLICT,
AND CHOOSE THE SMALLEST COMPATIBLE CHANGE.

The final result must be one coherent BRIGHTAI QC platform.

Historical integrity is mandatory.

Human users remain responsible for:

- test measurements
- PASS/FAIL/HOLD
- review
- approval
- scientific interpretation
- quality decisions
```

---

# IMPLEMENTATION NOTES

**Current repository context to preserve**

The Laboratory extension must integrate with the existing:

- Astro SSR application
- SQLite database and sequential migrations
- authentication/session system
- RBAC
- CSRF protection
- Zod/server validation
- Activity/Audit Log
- Notifications
- Dashboard
- Exports
- Existing task/finding/CAPA/SLA/evidence architecture
- Existing AI guardrails
- Existing acceptance tests

**Historical integrity rule**

Never allow a later change to:

- Product Master
- Equipment
- Calibration
- SOP
- WI
- Template

to silently change the meaning of an already approved historical test.

Approved records must retain the exact reference context used when they were
performed and approved.
