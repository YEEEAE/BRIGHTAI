# BRIGHTAI QC Laboratory
## Complete Page & Functional Reference Specification

**Repository:** `YEEEAE/BRIGHTAI`  
**Application:** `apps/qc-task-manager/`  
**Primary Laboratory Route:** `/lab`  
**Audience:** DeepSeek Flash v4, Codex, senior developers, QA, product owners  
**Status:** Master functional reference / implementation source of truth  
**Language:** English  
**Scope:** QC Laboratory workspace integrated into the existing BRIGHTAI QC Task Manager

---

# 1. Purpose

This document is the functional reference for the complete QC Laboratory workspace.

It explains:

- every laboratory page;
- every route;
- every field;
- who can access each page;
- what users can create/edit/review/approve;
- the lifecycle of tests;
- the lifecycle of equipment;
- calibration and maintenance;
- Product Master;
- Test Templates;
- SOP/WI controlled documents;
- document versioning;
- sample traceability;
- retesting;
- investigation/NCR/CAPA hooks;
- notifications;
- laboratory search;
- saved views;
- calendar;
- dashboard integration;
- reporting and exports;
- data quality;
- audit/history;
- AI assistance boundaries;
- database relationships;
- historical traceability rules;
- responsive and print requirements.

This document is a **reference specification**, not an implementation prompt.

The implementation agent must compare this document against the real repository before changing code.

---

# 2. Existing Application Context

The QC Laboratory is an extension of the existing:

`apps/qc-task-manager/`

It must use the existing application architecture.

Expected existing infrastructure includes:

- Astro SSR;
- SQLite;
- sequential migrations;
- authentication;
- sessions;
- RBAC/permissions;
- CSRF protection;
- server-side validation;
- Zod conventions where already used;
- Activity/Audit Log;
- Notifications;
- Dashboard;
- Exports;
- Existing Tasks;
- Findings/CAPA/SLA/Evidence where present;
- Existing AI guardrails;
- existing design system;
- existing testing architecture.

## Critical rule

The Laboratory must NOT become a second application inside the application.

The following must not be duplicated:

- authentication;
- session handling;
- roles;
- permissions;
- dashboard;
- notification engine;
- audit engine;
- export engine;
- workflow engine;
- AI infrastructure.

Existing functionality should be extended, not replaced.

---

# 3. Laboratory Information Architecture

```text
QC Laboratory
│
├── Overview
│   └── /lab
│
├── Tests
│   ├── Test Register
│   │   └── /lab/tests
│   ├── New AIR Test
│   │   └── /lab/tests/new?type=air
│   ├── New VACUUM Test
│   │   └── /lab/tests/new?type=vacuum
│   ├── Review Center
│   │   └── /lab/tests/review
│   ├── Test Details
│   │   └── /lab/tests/[id]
│   └── Print
│       └── /lab/tests/[id]/print
│
├── Products
│   ├── Product Register
│   │   └── /lab/products
│   ├── New Product
│   │   └── /lab/products/new
│   └── Product Details / Edit
│       └── /lab/products/[id]
│
├── Test Templates
│   ├── Template Register
│   │   └── /lab/templates
│   ├── New Template
│   │   └── /lab/templates/new
│   └── Template Details / Edit
│       └── /lab/templates/[id]
│
├── Equipment
│   ├── Equipment Register
│   │   └── /lab/equipment
│   ├── New Equipment
│   │   └── /lab/equipment/new
│   ├── Equipment Details
│   │   └── /lab/equipment/[id]
│   ├── Equipment Edit
│   │   └── /lab/equipment/[id]/edit
│   └── Maintenance
│       └── /lab/equipment/[id]/maintenance
│
├── Calibration
│   ├── Calibration Register
│   │   └── /lab/calibration
│   └── Calibration Details
│       └── /lab/calibration/[id]
│
├── Documents
│   ├── SOP/WI Library
│   │   └── /lab/documents
│   ├── New Document
│   │   └── /lab/documents/new
│   ├── Document Details
│   │   └── /lab/documents/[id]
│   ├── Document Editor
│   │   └── /lab/documents/[id]/edit
│   └── Version History
│       └── /lab/documents/[id]/versions
│
├── Retesting
│   ├── Retest Register
│   │   └── /lab/retests
│   └── Retest Details
│       └── /lab/retests/[id]
│
├── Search
│   └── /lab/search
│
├── Reports
│   └── /lab/reports
│
├── Data Quality
│   └── /lab/data-quality
│
├── Calendar
│   └── /lab/calendar
│
└── Notifications
    └── /lab/notifications
```

---

# 4. Global Laboratory Navigation

The Laboratory navigation should group functions logically.

## Recommended navigation

### Overview
- Laboratory Overview

### Testing
- Test Register
- New AIR Test
- New VACUUM Test
- Review Center
- Retests

### Master Data
- Products
- Test Templates
- Equipment
- Calibration

### Controlled Documents
- SOP/WI Library

### Operations
- Search
- Reports
- Calendar
- Data Quality
- Notifications

The visible navigation must be filtered according to the existing RBAC model.

---

# 5. Laboratory Roles & Permissions

Do not create new roles unless the existing system proves a new role is necessary.

Use existing roles.

Recommended logical permissions:

```text
LAB_VIEW

LAB_TEST_VIEW
LAB_TEST_CREATE
LAB_TEST_EDIT
LAB_TEST_SUBMIT
LAB_TEST_REVIEW
LAB_TEST_APPROVE
LAB_TEST_VOID

LAB_PRODUCT_VIEW
LAB_PRODUCT_CREATE
LAB_PRODUCT_EDIT
LAB_PRODUCT_ARCHIVE

LAB_TEMPLATE_VIEW
LAB_TEMPLATE_CREATE
LAB_TEMPLATE_EDIT
LAB_TEMPLATE_APPROVE
LAB_TEMPLATE_ARCHIVE

LAB_EQUIPMENT_VIEW
LAB_EQUIPMENT_CREATE
LAB_EQUIPMENT_EDIT
LAB_EQUIPMENT_ARCHIVE
LAB_EQUIPMENT_MAINTENANCE

LAB_CALIBRATION_VIEW
LAB_CALIBRATION_CREATE
LAB_CALIBRATION_EDIT

LAB_DOCUMENT_VIEW
LAB_DOCUMENT_CREATE
LAB_DOCUMENT_EDIT
LAB_DOCUMENT_REVIEW
LAB_DOCUMENT_APPROVE
LAB_DOCUMENT_ARCHIVE
LAB_DOCUMENT_ACKNOWLEDGE

LAB_RETEST_VIEW
LAB_RETEST_CREATE

LAB_REPORT_VIEW
LAB_EXPORT

LAB_DATA_QUALITY_VIEW
LAB_MANAGEMENT_DASHBOARD

LAB_AI_ASSIST
```

These are logical permission names.

The implementation must map them to the repository's existing permission conventions rather than introducing a second authorization framework.

---

# 6. Global UI Rules

Every Laboratory page should reuse the current application design system.

## Required states

Every database-backed page should support:

- loading;
- populated;
- empty;
- validation error;
- server error;
- unauthorized;
- not found;
- read-only;
- archived where relevant.

## Responsive targets

At minimum test:

- 360px;
- 768px;
- 1024px;
- 1440px.

No unintended horizontal overflow.

## Accessibility

Use:

- real labels;
- keyboard navigation;
- visible focus;
- semantic tables;
- accessible dialogs;
- descriptive errors;
- accessible status badges;
- appropriate ARIA only where needed.

---

# 7. PAGE: `/lab`
## QC Laboratory Overview / Command Center

### Purpose

Main operational landing page for the laboratory.

This is not the global application dashboard.

It is a laboratory-focused workspace.

## Header

Title:

`QC Laboratory`

Description:

`Product testing, equipment, calibration, controlled documents, and laboratory quality operations.`

Primary actions:

- New AIR Test
- New VACUUM Test

Secondary actions:

- New Product
- New Template
- New SOP
- New WI
- Equipment
- Calibration

## KPI cards

### Testing

- Tests Today
- Tests This Week
- Draft
- Awaiting Review
- Approved
- PASS
- FAIL
- HOLD

### Equipment

- Equipment Requiring Attention
- Under Maintenance
- Calibration Due
- Calibration Overdue

### Documents

- Documents Due for Review
- Documents Overdue
- Pending Acknowledgements

### Quality

- Open Retests
- Data Quality Issues

Each KPI should be clickable.

Clicking a KPI should open the corresponding list with the correct filters.

## Main sections

### Recent Tests

Columns:

- Test ID
- Type
- Product
- Lot
- Equipment
- Tester
- Result
- Status
- Updated
- View

### Pending Reviews

Columns:

- Test ID
- Type
- Tester
- Submitted
- Aging
- Result
- Review

### Equipment Alerts

Columns:

- Equipment
- Code
- Status
- Calibration
- Alert
- Open

### Document Reviews Due

Columns:

- Document Code
- Title
- Type
- Version
- Owner
- Due Date
- Status
- Open

### Open Retests

Columns:

- Retest
- Original Test
- Product
- Reason
- Status
- Updated

### Recent Laboratory Activity

Timeline-style activity list.

## No-data state

Example:

`No laboratory activity yet.`

Provide relevant action buttons.

---

# 8. PAGE: `/lab/tests`
## Laboratory Test Register

### Purpose

Central searchable register for all laboratory tests.

## Main table

Columns:

- Test ID
- Test Type
- Product
- Lot Number
- Sampling Area
- Equipment
- Tester
- Final Result
- Workflow Status
- Created At
- Updated At
- Actions

## Search

Search by:

- Test ID;
- Product;
- Product Code;
- Lot;
- Sampling Area;
- Equipment;
- Tester.

## Filters

- AIR / VACUUM;
- DRAFT;
- SUBMITTED;
- UNDER_REVIEW;
- REJECTED;
- APPROVED;
- VOID;
- PASS;
- FAIL;
- HOLD;
- Tester;
- Equipment;
- Product;
- Date range.

## Actions

Depending on permissions:

- View
- Edit
- Submit
- Review
- Approve
- Create Retest
- Print
- Export

Approved tests:

`Read-only`

## Technical requirements

- server-side filtering;
- server-side pagination;
- bounded sorting;
- parameterized SQL;
- indexed fields;
- RBAC filtering.

---

# 9. PAGE: `/lab/tests/new?type=air`
## AIR Test Creation

This page uses the shared laboratory test form.

Only printed/black fields from the approved paper form become employee-entry fields.

Handwritten-only content must NOT be invented as additional fields.

---

# 10. PAGE: `/lab/tests/new?type=vacuum`
## VACUUM Test Creation

Uses the same form architecture as AIR.

Only `test_type` changes unless an explicitly approved Vacuum-specific requirement exists.

Do not create two independent forms.

---

# 11. TEST FORM
## Section 1 — Sample Identification

Employee fields:

### Product Description

Type:

text

Required:

yes

Should integrate with Product Master where available.

### Connector Type

Required.

Options:

1. Non-locking (Lipid connector)
2. Connector with floating or rotatable collar
3. Locking connector with fixed threads

### No. of Samples Tested

Type:

positive integer

Default:

5

The entered count controls the sample grid.

### Lot Number

Type:

text

Required:

yes

### Sampling Area

Type:

text

Required:

yes

---

# 12. TEST FORM
## Section 2 — Equipment Used

### Machine Name

Prefer:

`equipment_id`

UI should display:

- equipment name;
- equipment code;
- status;
- calibration state.

Do not use equipment name as the database relationship.

### Medium Used

Type:

text

---

# 13. TEST FORM
## Section 3 — Connector Assembly

### Actual Pressure

Display reference:

`(-2.5 ~ -4) in./Hg`

Do not automatically reject outside values unless the company explicitly defines this as a validation rule.

### Torque (in.lb)

Employee-entered numeric value.

### Time (Sec.)

Employee-entered numeric value.

### Angle

Employee-entered numeric value/text according to approved business requirement.

Do not invent unit semantics.

---

# 14. TEST FORM
## Section 4 — Differential Conversion

### Temperature (Measured)

Employee-entered.

Do not invent conversion formulas.

If a conversion formula already exists in the repository, reuse it.

Otherwise store the measured value.

---

# 15. TEST FORM
## Section 5 — Test Parameters

Display controlled reference values:

### Standard Parameter

`Subatmospheric Pressure -40 ~ -80 kPa`

### Acceptance Criteria

`≤ 800 Pa`

### Holding Time

`18 ~ 56 Sec.`

These reference values must be visually distinguished from measurements.

---

# 16. TEST FORM
## Section 6 — Test Results

Default rows:

1
2
3
4
5

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

Result choices:

- PASS
- FAIL
- HOLD / FURTHER EVALUATION

The result is entered/confirmed by authorized human users.

AI must not make the final quality decision.

## Sample expansion

If `No. of Samples Tested = 8`, the interface should create 8 controlled rows.

Do not allow arbitrary uncontrolled row growth.

---

# 17. TEST FORM
## Remarks

### Any Remarks

Free-form text.

Must be sanitized and stored safely.

---

# 18. TEST FORM
## Authorization

Fields:

- Tested By
- Reviewed By
- Approved By: Q.C.M.

The implementation should use references to existing users where the architecture supports it.

Do not trust manually submitted user IDs.

Authorization identities are system-controlled.

---

# 19. TEST FORM
## Final Result

Choices:

- PASS
- FAIL
- HOLD / FURTHER EVALUATION

The system must not use AI to automatically assign the final result.

---

# 20. TEST DRAFT BEHAVIOR

A draft should be savable before the test is complete.

Draft must preserve:

- product;
- lot;
- sampling area;
- equipment;
- medium;
- connector assembly;
- temperature;
- sample rows;
- remarks;
- selected parameters.

Draft can be edited according to permissions.

Draft is not a final quality record.

---

# 21. TEST WORKFLOW

Primary lifecycle:

```text
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ├──→ REJECTED
  │       ↓
  │     DRAFT
  │
  └──→ APPROVED
```

Optional controlled state:

```text
APPROVED
  ↓
VOID
```

Void must require:

- permission;
- reason;
- audit event.

---

# 22. TEST REVIEW RULES

A tester should not approve their own test.

Review requires:

- appropriate permission;
- complete test;
- review action;
- reviewer identity;
- timestamp.

Rejection requires reason.

Request Changes requires reason.

Approval records:

- approver;
- timestamp;
- final result.

---

# 23. APPROVED TEST IMMUTABILITY

After approval:

- test values are read-only;
- sample values are read-only;
- equipment reference is historically locked;
- calibration state is historically locked;
- SOP/WI reference is historically locked;
- template reference is historically locked.

Corrections require:

- controlled revision;
- retest;
- void/recreate;
- or existing quality process.

Never silently mutate approved data.

---

# 24. PAGE: `/lab/tests/[id]`
## Test Details

Display:

### Header

- Test ID
- AIR / VACUUM
- Product
- Status
- Result

### Main sections

- Sample Identification
- Equipment
- Connector Assembly
- Differential Conversion
- Test Parameters
- Sample Results
- Remarks
- Authorization
- Applicable SOP/WI
- Equipment Snapshot
- Calibration Snapshot
- Product Snapshot
- Template Snapshot
- Retest History
- Investigation/CAPA Links
- Audit Timeline

---

# 25. PAGE: `/lab/tests/[id]/print`
## Controlled Test Print

Print view must resemble an official controlled laboratory test record.

Include:

- QC Laboratory title;
- Test ID;
- Test Type;
- Sample Identification;
- Equipment Used;
- Connector Assembly;
- Differential Conversion;
- Test Parameters;
- Sample Results;
- Remarks;
- Authorization;
- Final Result;
- SOP/WI version;
- equipment snapshot;
- calibration state;
- record status;
- print timestamp.

Must be A4-friendly.

No application sidebar/navigation.

No unnecessary internal database information.

---

# 26. PAGE: `/lab/tests/review`
## Review Center

Purpose:

Central reviewer queue.

## Summary

- Awaiting Review
- Aging
- HOLD
- Rejected
- Approved Today

## Filters

- Test Type
- Tester
- Product
- Lot
- Date
- Result
- Age

## Table

- Test ID
- Type
- Product
- Tester
- Submitted At
- Age
- Result
- Status
- Open

## Review actions

- Start Review
- Request Changes
- Reject
- Approve

---

# 27. PRODUCT MASTER
## `/lab/products`

Purpose:

Central master data for tested products.

Fields:

- Product Name
- Product Code
- Description
- Connector Type
- Default Test Type
- Default Test Template
- Applicable SOP
- Applicable WI
- Related Equipment
- Active
- Notes

Features:

- Search
- Filter
- Create
- Edit
- Archive
- Details
- History

Tests should reference Product ID.

---

# 28. PRODUCT MASTER HISTORICAL RULE

A current Product Master change must not alter the meaning of historical approved tests.

Approved tests should retain relevant product snapshots:

- product name;
- product code;
- connector type;
- applicable reference information.

---

# 29. TEST TEMPLATES
## `/lab/templates`

Purpose:

Reduce repeated manual entry.

Types:

- AIR
- VACUUM

Template may define:

- default sample count;
- standard parameters;
- reference values;
- connector choices;
- applicable product;
- applicable equipment;
- SOP;
- WI.

Templates must be versioned.

---

# 30. TEMPLATE VERSIONING

Example:

```text
AIR-TEMPLATE-001 v1
AIR-TEMPLATE-001 v2
AIR-TEMPLATE-001 v3
```

A test created using v2 must preserve:

`Template 001 — Version 2`

even after v3 becomes current.

---

# 31. EQUIPMENT
## `/lab/equipment`

Columns:

- Equipment Name
- Equipment Code
- Location
- Status
- Calibration
- Serial Number
- Notes

Features:

- Search
- Filter
- Create
- Edit
- Archive
- Restore where supported
- Details
- Activity

---

# 32. INITIAL EQUIPMENT DATA

The initial laboratory registry contains the supplied business records, including:

1. Breathing Filter Pressure
2. Syringe Positive Pressure
3. Breathing Tube Leakage
4. PUBTESTER INSTRUMENTS
5. Catheter Hydraulic Pressure Leak Tester
6. TECHNICAL OUR APPLICATION ASSISTANCE
7. PRESSURE GAUGE (MASK)
8. Vacuum Gauge
9. WEIGHT BALANCE
10. SCALE VERIFICATION
11. FLOW RATE
12. CONNECTOR ASSEMBLY DIV
13. MACHINE OPERATING PROCEDURE FOR TUBES
14. PRESSURE
15. POSITIVE WATER BATH
16. MEDICAL PERFORMANCE TEST
17. Falling Drop Positive Pressure Liquid
18. Subatmospheric Air Testing
19. PRESSURE & POSTER
20. OPERATING PRODUCT SS.2500W
21. FILTER 13MM
22. VOLTAGE -220VAC
23. WATER BATH TEMPERATURE
24. Catheter Vacuum Leak Test

The exact supplied values are to be preserved as provided by the business.

Do not fabricate missing values.

---

# 33. EQUIPMENT DETAILS
## `/lab/equipment/[id]`

Display:

- name;
- code;
- location;
- status;
- calibration;
- serial number;
- notes;
- created by;
- updated by;
- last updated.

Related:

- tests;
- SOP/WI documents;
- maintenance;
- calibration;
- audit history.

---

# 34. EQUIPMENT RELATIONSHIP RULE

The database relationship is:

`test.equipment_id → equipment.id`

Never use:

`test.machine_name → equipment.name`

as the primary relationship.

---

# 35. EQUIPMENT SNAPSHOT

When a test is approved, preserve:

- equipment name;
- equipment code;
- serial number;
- location where relevant;
- calibration state;
- relevant calibration reference.

This guarantees historical accuracy.

---

# 36. MAINTENANCE
## `/lab/equipment/[id]/maintenance`

Track:

- maintenance date;
- issue;
- maintenance type;
- description;
- technician/vendor;
- status;
- completed date;
- notes.

Do not fabricate historical events.

---

# 37. CALIBRATION
## `/lab/calibration`

Track:

- equipment;
- last calibration date;
- calibration due date;
- provider;
- certificate reference;
- calibration result;
- next due date;
- status;
- notes.

Statuses should follow the project's existing conventions.

Possible UI states:

- Compliant
- Due Soon
- Due Today
- Overdue
- Not Compliant
- Unknown

---

# 38. CALIBRATION TEST INTEGRATION

When selecting equipment for a test, display calibration state.

Example:

```text
Subatmospheric Air Testing
LAB-SBC-TMC-03

Calibration:
COMPLIANT
```

or:

```text
Calibration:
OVERDUE
⚠ Review equipment status before proceeding.
```

Do not automatically block unless an approved company policy requires blocking.

---

# 39. SOP/WI
## `/lab/documents`

Document types:

- SOP
- WI

Fields:

- Document Code
- Title
- Type
- Description
- Product
- Related Equipment
- Owner
- Reviewer
- Approver
- Current Version
- Status
- Effective Date
- Review Due Date

Statuses:

- DRAFT
- IN_REVIEW
- APPROVED
- SUPERSEDED
- ARCHIVED

---

# 40. SOP/WI EDITOR
## `/lab/documents/new`
## `/lab/documents/[id]/edit`

Supported content:

- headings;
- paragraphs;
- numbered procedures;
- bullets;
- tables;
- warnings;
- notes;
- checklists;
- safe links.

Security:

- sanitize HTML;
- prevent scripts;
- validate URLs;
- limit content length;
- CSRF;
- server-side validation.

---

# 41. DOCUMENT WORKFLOW

```text
DRAFT
  ↓
IN_REVIEW
  ↓
APPROVED
  ↓
SUPERSEDED
```

Alternative:

```text
APPROVED
  ↓
ARCHIVED
```

Approved document version is immutable.

---

# 42. DOCUMENT VERSIONING

Example:

```text
SOP-QC-001 v1
SOP-QC-001 v2
SOP-QC-001 v3
```

Each version must store:

- content;
- author;
- reviewer;
- approver;
- created date;
- reviewed date;
- approved date;
- change summary.

---

# 43. PAGE: `/lab/documents/[id]/versions`

Display:

- version;
- status;
- author;
- created;
- reviewer;
- approver;
- approval date;
- change summary.

Allow comparison of two versions.

Comparison must be read-only.

---

# 44. CRITICAL DOCUMENT HISTORICAL RULE

If Test A used:

`SOP-QC-001 v3`

and later the current SOP becomes:

`SOP-QC-001 v4`

Test A must still show:

`SOP-QC-001 v3`

Do not dynamically replace historical references with the latest version.

The same rule applies to WI and Test Templates.

---

# 45. TEST ↔ DOCUMENT RELATIONSHIP

Each finalized test may reference:

- applicable SOP;
- applicable SOP version;
- applicable WI;
- applicable WI version.

Where possible, the relationship must be determined from:

- Product Master;
- Test Template;
- explicit reviewer/user selection.

Final approved test stores the resulting historical snapshot.

---

# 46. RETESTS
## `/lab/retests`

Purpose:

Controlled repeat testing.

Reasons may include:

- FAIL;
- HOLD/Further Evaluation;
- sample issue;
- equipment issue;
- procedural issue;
- other documented reason.

Do not overwrite the original test.

---

# 47. RETEST RELATIONSHIP

Example:

```text
Original:
LAB-TEST-00081

Retest:
LAB-RETEST-00081-01

Second Retest:
LAB-RETEST-00081-02
```

Original test stays immutable.

Retest references original.

---

# 48. SAMPLE TRACEABILITY

Each sample should have an identifier.

Example:

`LAB-TEST-00081-S03`

Store:

- test;
- sample number;
- sample identifier;
- part name;
- result;
- status.

The sample identifier remains stable after approval.

---

# 49. INVESTIGATION / NCR / CAPA

Laboratory tests may become sources for quality investigations.

Use the existing application's entities when possible.

Example:

```text
LAB TEST
   ↓
Finding / NCR
   ↓
CAPA
```

or:

```text
LAB TEST
   ↓
Investigation
```

Do not create a parallel CAPA system.

---

# 50. DOCUMENT ACKNOWLEDGEMENT

Approved SOP/WI versions may require employee acknowledgement.

Track:

- document;
- version;
- employee;
- assigned date;
- acknowledgement date;
- status.

Statuses:

- PENDING
- ACKNOWLEDGED

Acknowledgement is version-specific.

---

# 51. DOCUMENT REVIEW SCHEDULING

Display:

- 30 days before review;
- 15 days;
- 7 days;
- due today;
- overdue.

Use existing notification infrastructure.

Dashboard should show:

- Due Soon
- Due Today
- Overdue

---

# 52. LAB SEARCH
## `/lab/search`

Search entities:

- Tests
- Samples
- Products
- Equipment
- SOP
- WI
- Retests

Search fields:

- Test ID
- Sample ID
- Product
- Lot
- Equipment
- Equipment Code
- Serial Number
- Document Code
- Document Title

Search must be server-side.

---

# 53. SAVED VIEWS
## `/lab` and list pages

Users may save:

- My AIR Tests
- My VACUUM Tests
- Awaiting My Review
- Failed Tests
- HOLD Tests
- Equipment Under Maintenance
- Calibration Due
- SOP Review Due
- Pending Acknowledgements
- Open Retests

Saved views are user-scoped.

Never store arbitrary SQL.

---

# 54. LAB CALENDAR
## `/lab/calendar`

Display real operational events:

- calibration;
- maintenance;
- document review deadlines;
- acknowledgement deadlines;
- supported testing/retesting events.

Clicking an event opens its source record.

---

# 55. LAB NOTIFICATIONS
## `/lab/notifications`

Laboratory notifications may include:

- test submitted;
- review requested;
- test rejected;
- test returned for changes;
- test approved;
- document submitted;
- document changes requested;
- document approved;
- document review due;
- acknowledgement required;
- calibration due;
- calibration overdue;
- maintenance event;
- retest update.

Reuse existing notification system.

---

# 56. DATA QUALITY
## `/lab/data-quality`

Purpose:

Identify incomplete or inconsistent records.

## Test issues

Examples:

- missing Lot Number;
- missing Equipment;
- missing Tester;
- incomplete samples;
- missing Final Result;
- inconsistent workflow.

## Equipment issues

- missing code;
- missing serial;
- missing calibration state;
- missing location.

## Document issues

- missing owner;
- missing review date;
- missing approval metadata;
- missing effective date.

## Product issues

- missing code;
- incomplete reference setup.

The page reports issues.

It must not silently change data.

---

# 57. LAB DASHBOARD INTEGRATION

The global dashboard gets a Laboratory section.

Do not remove any existing dashboard feature.

## Testing KPIs

- Total;
- AIR;
- VACUUM;
- Draft;
- Submitted;
- Under Review;
- Approved;
- Rejected;
- Void.

## Result KPIs

- PASS;
- FAIL;
- HOLD.

## Equipment KPIs

- Active;
- New;
- Maintenance;
- Unused;
- Calibration Attention;
- Calibration Compliant.

## Documents

- SOP;
- WI;
- Draft;
- In Review;
- Approved;
- Superseded;
- Archived;
- Review Due;
- Acknowledgement Pending.

## Retests

- Total;
- Open;
- Completed;
- By reason.

## Data Quality

- Open Issues.

---

# 58. DASHBOARD CHARTS

Recommended:

### Tests by time

Day / week / month.

### AIR vs VACUUM

Comparison.

### PASS / FAIL / HOLD

Distribution.

### Equipment status

Used / New / Maintenance / Unused.

### Calibration

Compliant / Attention.

### Documents

Review status.

Every chart should support appropriate drill-down.

---

# 59. LAB REPORTS
## `/lab/reports`

Recommended reports:

1. Laboratory Test Register
2. AIR Test Register
3. VACUUM Test Register
4. PASS/FAIL/HOLD Report
5. Retest Report
6. Product Test History
7. Equipment Register
8. Calibration Report
9. Maintenance Report
10. SOP Register
11. WI Register
12. Review Due Report
13. Document Acknowledgement Report
14. Laboratory Activity Report
15. Data Quality Report

Use existing export infrastructure.

---

# 60. EXPORT RULES

Exports must:

- respect filters;
- respect date range;
- respect RBAC;
- use safe CSV escaping;
- exclude secrets;
- use bounded queries;
- not expose passwords;
- not expose sessions;
- not expose internal tokens.

---

# 61. AUDIT REQUIREMENTS

Audit:

### Tests

- create;
- edit;
- submit;
- review;
- request changes;
- reject;
- approve;
- void;
- retest.

### Equipment

- create;
- edit;
- archive;
- restore;
- maintenance;
- calibration.

### Products

- create;
- edit;
- archive.

### Templates

- create;
- edit;
- version;
- approve.

### Documents

- create;
- edit;
- submit;
- request changes;
- approve;
- supersede;
- archive;
- acknowledge.

### Relationships

- link;
- unlink.

Use the existing audit system.

---

# 62. AUDIT TIMELINE

The user-facing history should read naturally.

Example:

```text
14 Aug 2026 09:41
Ahmed created LAB-TEST-00081

14 Aug 2026 10:03
Ahmed submitted the test for review

14 Aug 2026 11:20
Mohammed started review

14 Aug 2026 11:41
Mohammed requested changes

14 Aug 2026 13:10
Ahmed resubmitted

14 Aug 2026 14:02
QC Manager approved the test
```

Where supported, show:

- actor;
- action;
- timestamp;
- previous value;
- new value;
- reason.

---

# 63. AI QC COPILOT

AI is assistive only.

Allowed:

- summarize;
- compare;
- identify missing data;
- suggest review questions;
- summarize equipment history;
- summarize document changes;
- summarize historical test trends.

Not allowed:

- automatic PASS;
- automatic FAIL;
- automatic approval;
- automatic document approval;
- changing database records;
- changing measured results;
- changing calibration;
- inventing criteria.

Display:

`AI GENERATED — HUMAN REVIEW REQUIRED`

Reuse existing BRIGHTAI AI infrastructure.

---

# 64. HISTORICAL TRACEABILITY MODEL

This is one of the most important requirements.

An approved test is a historical quality record.

It should retain enough context to reconstruct:

- what product;
- what equipment;
- what calibration state;
- what template;
- what SOP;
- what WI;
- what reference parameters;
- what measured results;
- who performed it;
- who reviewed it;
- who approved it.

Future changes to master data must not rewrite history.

---

# 65. RECOMMENDED HISTORICAL SNAPSHOTS

For approved test records:

### Product Snapshot

- name;
- code;
- connector type;
- relevant reference data.

### Equipment Snapshot

- name;
- code;
- serial;
- status;
- calibration state.

### Document Snapshot

- document code;
- type;
- version;
- title.

### Template Snapshot

- template ID;
- version;
- relevant reference configuration.

### Test Parameter Snapshot

- applicable standard parameter;
- acceptance criteria;
- holding-time reference;
- units.

---

# 66. SECURITY MODEL

Laboratory security must cover:

- authentication;
- RBAC;
- IDOR prevention;
- CSRF;
- XSS;
- SQL injection;
- mass assignment;
- hidden-field manipulation;
- unauthorized exports;
- unauthorized document access;
- self-approval;
- state-transition bypass;
- audit tampering.

All state-changing actions require:

- authorization;
- validation;
- CSRF;
- audit.

---

# 67. DATABASE RELATIONSHIP MODEL

Conceptual model:

```text
USER
 │
 ├──────── TEST
 │           │
 │           ├── SAMPLES
 │           ├── PRODUCT
 │           ├── EQUIPMENT
 │           ├── TEMPLATE
 │           ├── SOP/WI VERSION
 │           ├── RETEST
 │           ├── FINDING / CAPA / INVESTIGATION
 │           └── AUDIT
 │
 ├──────── PRODUCT
 │
 ├──────── EQUIPMENT
 │             ├── MAINTENANCE
 │             └── CALIBRATION
 │
 ├──────── DOCUMENT
 │             └── DOCUMENT VERSION
 │
 └──────── ACKNOWLEDGEMENT
```

This is conceptual.

The implementation must adapt it to the real existing schema.

---

# 68. DATABASE DESIGN RULES

Use:

- foreign keys;
- appropriate indexes;
- sequential migrations;
- timestamps;
- nullable fields for genuinely unavailable legacy data;
- normalization where appropriate;
- snapshots where historical preservation is necessary.

Avoid:

- storing relationships only in JSON;
- using names as foreign keys;
- destructive migrations;
- duplicate users;
- duplicate permissions.

---

# 69. PERFORMANCE REQUIREMENTS

Watch for:

- N+1 queries;
- unbounded activity history;
- SELECT *;
- unindexed search;
- expensive dashboard queries;
- duplicate joins;
- inefficient export queries.

Laboratory list pages should use:

- pagination;
- bounded queries;
- indexes;
- validated sorting.

---

# 70. PRINTING

Controlled print pages should be:

- A4-friendly;
- readable;
- server-rendered;
- consistent;
- free of navigation;
- free of unrelated dashboard UI.

Print should preserve:

- test identity;
- result;
- authorization;
- applicable document versions;
- equipment snapshot;
- calibration state.

---

# 71. RESPONSIVE UX

Required viewport verification:

```text
360px
768px
1024px
1440px
```

Particular attention:

- sample table;
- equipment table;
- document table;
- review queue;
- dashboard cards;
- filters;
- modals;
- print.

---

# 72. ACCEPTANCE PRINCIPLES

A feature is not complete because its page renders.

A feature is complete when:

1. UI exists;
2. route exists;
3. authorization exists;
4. database persistence exists;
5. validation exists;
6. audit exists;
7. notification integration exists where required;
8. dashboard integration exists where relevant;
9. tests exist;
10. actual verification passes.

---

# 73. END-TO-END CORE WORKFLOWS

## Workflow A — AIR

```text
Employee
→ Product selection
→ AIR Template
→ Equipment selection
→ Sample Identification
→ Measurements
→ Sample Results
→ Save Draft
→ Submit
→ Review
→ Approval
→ Print
→ Dashboard
→ Audit
→ Notification
```

## Workflow B — VACUUM

```text
Employee
→ Create VACUUM Test
→ Save
→ Submit
→ Review
→ Reject / Changes
→ Edit
→ Resubmit
→ Approve
```

## Workflow C — Retest

```text
Original FAIL
→ Create Retest
→ Original remains immutable
→ Retest performed
→ Review
→ Approval
```

## Workflow D — Controlled Document

```text
Create SOP
→ Draft
→ Review
→ Changes
→ Review
→ Approval
→ Acknowledgement
```

## Workflow E — Document Revision

```text
SOP v3
→ Tests use v3

SOP v4 approved
→ New tests use v4
→ Old tests remain v3
```

## Workflow F — Equipment

```text
Create Equipment
→ Maintenance
→ Calibration
→ Use in Test
→ Equipment Update
→ Historical Test remains snapshot-correct
```

---

# 74. TEST STRATEGY

Testing should cover:

## Unit

- validation;
- state transitions;
- permissions;
- snapshot creation;
- result handling.

## Integration

- database;
- migrations;
- audit;
- notifications;
- dashboard queries;
- exports.

## E2E

- AIR;
- VACUUM;
- review;
- approval;
- rejection;
- retest;
- equipment;
- calibration;
- SOP/WI;
- versioning;
- acknowledgements.

## Security

- IDOR;
- CSRF;
- XSS;
- SQL injection;
- authorization bypass.

---

# 75. DATA QUALITY PRINCIPLE

The system should help users identify bad/incomplete data without modifying it silently.

The Data Quality page is informational and corrective.

It should link users to the affected records.

---

# 76. AI PRINCIPLE

AI is an assistant.

Human users own:

- measurements;
- result interpretation;
- PASS;
- FAIL;
- HOLD;
- review;
- approval;
- quality decisions.

AI must never become the final quality authority.

---

# 77. IMPORTANT FIELD-SOURCE RULE

For the laboratory paper form:

### Employee-entered fields

Only printed/black fields from the approved form.

### Not automatically converted to fields

Handwritten annotations or handwritten-only information from sample/reference images.

If a field is ambiguous:

- inspect the provided specification;
- inspect existing audit documents;
- do not invent a field.

---

# 78. MASTER "DO NOT INVENT" RULE

Do not invent:

- scientific calculations;
- regulatory requirements;
- acceptance criteria;
- calibration dates;
- maintenance history;
- historical test results;
- fake equipment data;
- fake products;
- fake SOP content;
- fake approvals;
- fake users.

Use supplied data or real existing database data.

---

# 79. DEFINITION OF A HISTORICAL RECORD

A finalized/approved laboratory test is considered a controlled historical record.

It must remain understandable even if future:

- equipment data changes;
- product data changes;
- template versions change;
- SOP versions change;
- WI versions change;
- calibration state changes.

This requirement overrides convenience.

---

# 80. AGENT IMPLEMENTATION ORDER

Recommended sequence:

```text
1. Discovery
2. Architecture
3. Database
4. Navigation/RBAC
5. Laboratory Home
6. AIR/VACUUM Forms
7. Test Register
8. Test Detail/Print
9. Review Center
10. Product Master
11. Test Templates
12. Equipment
13. Maintenance
14. Calibration
15. SOP/WI Library
16. SOP/WI Editor
17. Version Comparison
18. Historical Snapshots
19. Retest
20. Sample Traceability
21. Investigation/CAPA Hooks
22. Document Acknowledgement
23. Review Scheduler
24. Search
25. Saved Views
26. Calendar
27. Notifications
28. Data Quality
29. Dashboard
30. Reports/Exports
31. Audit
32. Audit Timeline
33. AI Copilot
34. Security
35. Performance
36. Accessibility
37. Automated Tests
38. E2E Workflows
39. Code Quality
40. Production Readiness
41. Final Regression
```

---

# 81. AGENT VERIFICATION RULE

After every implementation stage:

- inspect changed files;
- run relevant tests;
- confirm database integrity;
- verify permissions;
- verify audit behavior;
- verify UI behavior;
- report actual command results.

Do not mark features verified merely because code exists.

---

# 82. FINAL SYSTEM OUTCOME

The desired final product is:

**BRIGHTAI QC Laboratory**

A connected internal QC laboratory platform where users can:

- manage products;
- create AIR tests;
- create VACUUM tests;
- record sample-level results;
- review and approve tests;
- retest failed/held tests;
- manage laboratory equipment;
- maintain calibration information;
- maintain maintenance history;
- manage test templates;
- manage controlled SOP/WI documents;
- version documents;
- acknowledge documents;
- search all laboratory entities;
- view operational alerts;
- analyze laboratory data;
- export reports;
- maintain a complete audit trail;
- use controlled AI assistance;
- preserve historical quality records.

The Laboratory is successful only when these functions operate as one integrated
BRIGHTAI subsystem rather than separate pages.

---

# 83. FINAL SOURCE-OF-TRUTH RULE

When the implementation agent encounters disagreement between:

- this reference;
- an old prompt;
- a new prompt;
- existing code;

the agent must:

1. inspect the actual repository;
2. preserve existing working architecture;
3. follow the latest approved business requirement;
4. preserve historical data;
5. document the decision;
6. avoid creating a parallel subsystem.

This document is a functional reference.

The actual repository remains the technical source of truth.
