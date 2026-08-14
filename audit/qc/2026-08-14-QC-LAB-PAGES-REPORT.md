تمام. هذا تقرير مفصّل ومنسّق للصفحات، بنفس أسلوب `2026-08-14-QC-LAB-PAGES-REPORT.md` بس بالإنجليزي عشان يمشي مع البرومبتز والكود:

````markdown
# QC Laboratory — Detailed Pages & Implementation Report

> **Date:** 2026-08-14
> **Status:** Targeted design & implementation spec — NOT yet built in code.
> **Target app:** `apps/qc-task-manager/` (Astro SSR · SQLite · RBAC · CSRF · Zod)
> **Companion reporting app:** `apps/dashboard/` (Next.js)
> **Linked prompt pack:** `audit/qc/2026-08-14-QC-LAB-IMPLEMENTATION-PROMPTS.md`

---

## 1. Executive Summary

This report defines a new space inside QC Task Manager called **QC Laboratory**. The goal is to move the company lab from scattered forms and manual logs into a set of connected pages that persist to SQLite and expose data to employees, reviewers, and managers by permission.

The new space covers four core functions:

1. **Product test capture** by employees, supporting both `AIR` and `VACUUM`.
2. **Review & approval** of test results with a tamper-proof change log.
3. **Lab equipment** management: status, calibration, and history.
4. **SOP/WI documents** created, edited, and approved inside the system with independent versioning.

Every page must reuse the existing app foundation: Astro SSR, SQLite migrations, RBAC, CSRF, Zod, activity log, notifications, dashboard, exports, and the existing acceptance tests.

---

## 2. Scope Boundaries

### In scope
- A new route tree starting at `/lab`.
- Air/Vacuum forms saveable as draft.
- Five initial sample rows, extendable in a controlled way.
- Review, reject, and approve of results.
- Editable equipment register.
- Internal SOP/WI editor.
- New version on editing an approved document.
- Linking tests ↔ equipment ↔ documents.
- Lab metrics inside the Dashboard.
- Search, filters, CSV, print views.
- Notifications and audit trail.

### Out of scope (for now)
- File upload / PDF storage as a replacement for the internal editor.
- AI deciding PASS/FAIL.
- Auto-approval of documents or results.
- Inventing scientific formulas not present in the spec.
- Changing the existing task system or rebuilding the Dashboard.
- Adding new roles beyond the current four.

---

## 3. Page Map

| Route | Page | Users | Primary function |
|---|---|---|---|
| `/lab` | Laboratory home | All permitted roles | KPI summary, links, actions |
| `/lab/tests` | Test records list | All roles (scoped) | Search, filter, view test status |
| `/lab/tests/new?type=air` | New Air test | Employee + permitted | Create Air test draft |
| `/lab/tests/new?type=vacuum` | New Vacuum test | Employee + permitted | Create Vacuum test draft |
| `/lab/tests/[id]` | Test details | By permission | View, edit, review, approve |
| `/lab/equipment` | Lab equipment | All (scoped) | View & edit equipment register |
| `/lab/equipment/new` | New equipment | Manager/Supervisor/Admin | Add equipment |
| `/lab/equipment/[id]/edit` | Edit equipment | By permission | Edit + log change |
| `/lab/documents` | SOP/WI library | All (scoped) | Search, versions, statuses |
| `/lab/documents/new` | New document editor | Supervisor+ (Employee per flag) | Create SOP/WI draft |
| `/lab/documents/[id]` | Document view | By permission | Current version, history, links |
| `/lab/documents/[id]/edit` | Edit document | Draft owner / permitted | Edit draft or new version |
| `/lab/documents/[id]/versions` | Version history | Supervisor/Manager/Admin | Compare versions, approvals |
| `/dashboard` | Laboratory section | Admin/Manager/Supervisor | Lab KPIs and risks |

---

## 4. `/lab` — Laboratory Home

**Goal:** operational entry point; shows what the user needs now without loading everything up front.

**Header:** title `QC Laboratory`, subtitle `Product testing, equipment, and controlled laboratory documents`, plus `New Air Test`, `New Vacuum Test`, and `Create SOP/WI` (if permitted).

**KPI cards:** Draft tests · pending review · Approved (in period) · PASS/FAIL/HOLD · documents needing review · uncalibrated / under-maintenance equipment.

**Compact tables:**
1. **Recent Test Records** — Test ID, Type, Product, Result, Status, Tested By, Updated.
2. **Pending Reviews** — Type, owner, submitted date, age in days, open button.
3. **Equipment Alerts** — Equipment, Code, Status, Calibration, Updated.
4. **Document Reviews Due** — Document, Type, Version, Owner, review date.

**States:** normal · empty (with clear create buttons) · safe error (never expose DB path) · no-JS core content.

---

## 5. `/lab/tests` — Test Records List

**Goal:** show every test record the user is allowed to see, with server-side search and filters.

**Columns:** Test ID · Test Type (`AIR`/`VACUUM`) · Product Description · Lot Number · Sampling Area · Machine Name · Tested By · Final Result · Workflow Status · Created/Updated · `View`.

**Filters:** test type · status (Draft/Submitted/Under Review/Approved/Rejected/Void) · result (PASS/FAIL/HOLD) · tester · equipment · product · lot number · date range.

**Behavior:** server-side search + pagination · sorting limited to known columns · no SQL from query string · results respect section scope & permission · CSV export only for permitted users · approved records open read-only.

---

## 6. Air/Vacuum Entry Pages

Air and Vacuum use the **same form component and same save rules**, only `test_type` differs. Do NOT copy two separate forms — that causes future field/validation drift.

### Section 1 — Sample Identification
| Field | Type | Required | Notes |
|---|---|---:|---|
| Product Description | text | yes | product description |
| Connector Type | controlled single choice | yes | three fixed options |
| No. of Samples Tested | positive int | yes | defaults to 5 |
| Lot Number | text | yes | lot number |
| Sampling Area | text | yes | sampling area |

Connector Type options: Non-locking (Lipid connector) · Connector with floating or rotatable collar · Locking connector with fixed threads.

### Section 2 — Equipment Used
| Field | Type | Required | Notes |
|---|---|---:|---|
| Machine Name | select from `lab_equipment` or controlled text | yes | prefer linking to `lab_equipment` |
| Medium Used | text | yes | medium used in test |

### Section 3 — Connector Assembly
| Field | Type | Reference |
|---|---|---|
| Actual Pressure | decimal | `-2.5` to `-4 in./Hg` as a display hint |
| Torque (in.lb) | decimal | entered by employee |
| Time (Sec.) | positive number | entered by employee |
| Angle | number / controlled text | entered by employee |

The reference value does not auto-reject out-of-range input unless an explicit scientific rule is approved. Do not invent regulatory validation.

### Section 4 — Differential Conversion
- `Temperature (Measured)` — decimal. No undocumented conversion computed by the system.

### Section 5 — Test Parameters (reference, not free input unless configured)
- `Standard Parameter: Subatmospheric Pressure -40 ~ -80 kPa`
- `Acceptance Criteria: ≤ 800 Pa`
- `Holding Time: 18 ~ 56 Sec.`

If later made editable, store who changed them and when — they affect result interpretation.

### Section 6 — Test Results (5 initial rows)
| Column | Type | Notes |
|---|---|---|
| Sample No. | int | 1–5 default |
| Part Name | text | part name |
| Set Pressure (in./Hg) | decimal | set pressure |
| Actual Pressure | decimal | actual pressure |
| Volume (Sec.) | decimal | per current form definition |
| Pressure Difference | decimal | input or compute only if formula approved |
| Holding Time (Sec.) | decimal | holding time |
| Leakage Rate | decimal / controlled text | leakage rate |
| Result | PASS/FAIL/HOLD | not decided by AI |

Extras: `Any Remarks` · `Add Sample` (up to policy max) · `Save Draft` · `Submit for Review`. `Approve` never shown to the record owner.

### Section 7 — Authorization
- `Tested By` — auto-filled with current user (server-side), editable only under explicit admin policy.
- `Reviewed By` — filled on review. `Approved By: Q.C.M.` — filled on final approval.
- System names/dates never rely on browser hidden inputs.

### Section 8 — Final Result
PASS · FAIL · HOLD / FURTHER EVALUATION. Never auto-set by AI; issued by employee/reviewer per role and audit log.

---

## 7. `/lab/tests/[id]` — Test Details

**Draft mode:** all fields shown; owner (or permitted) edits; save; submit for review; recent edits log.
**Review mode:** entered vs reference values side by side; samples table; `Request Changes` (mandatory reason); `Approve` for authorized; self-approval blocked.
**Approved mode:** all fields read-only; record/version id; tester/reviewer/approver identity; submit/review/approve dates; Activity Timeline; Print View + CSV (if permitted).

**State cycle:**
```text
DRAFT
  -> SUBMITTED
  -> UNDER_REVIEW
       -> APPROVED
       -> REJECTED -> DRAFT
APPROVED -> VOID (authorized reason required)
```
The system never allows a direct browser-driven status change to a disallowed value.

---

## 8. `/lab/equipment` — Lab Equipment

**Columns:** Equipment · Code · Location (`LABORATORY`) · Status · Calibration (نعم/لا) · Serial Number · Notes · Updated By/At.

**Seed data:** the 24 equipment rows from the user request are inserted via an **idempotent migration/seed**, not a hardcoded array in the page. Preserve original text; do NOT auto-normalize status meanings before an official status dictionary is approved.

**Functions:** view · search & filter · add · edit · **archive instead of delete** · link to test/document · change history.

**Key rules:**
- Archiving does NOT delete links from old tests.
- Employees can't edit equipment unless policy grants it.
- Changing `Calibration` or `Status` writes to Activity Log.
- Serial number accepts text like `-` and `DOA-P104-AA`; never assume numeric only.

---

## 9. SOP/WI Pages

### `/lab/documents` — Library
Shows: Document Code · Title · Type (SOP/WI) · Current Version · Status · Owner · Related Product · Related Equipment · Effective Date · Review Due Date · Updated.
Filters: type · status · owner · equipment · product · review-due-soon.

### `/lab/documents/new` — Internal Editor
Metadata: Title · Document Code · Document Type · Description · Product Reference · Related Equipment · Owner · Review Due Date · Effective Date · Change Summary.
Editor: safe Markdown textarea (or existing project editor) · sanitized HTML preview · headings/lists/steps/tables/callouts/links · Save Draft · Submit for Review · never execute user HTML/JS.

### `/lab/documents/[id]` — View
Current approved version · status · owner/reviewer/approver · effective + next review dates · linked equipment/tests · View Versions · Print · Create Revision (if permitted).

### `/lab/documents/[id]/edit` — Edit & Versions
Edit the draft directly. An approved document is not edited in place — editing it creates a NEW version. Previous version stays `APPROVED` or `SUPERSEDED` per the approval cycle. `Change Summary` required per version.

**Document states:**
```text
DRAFT -> IN_REVIEW -> APPROVED -> SUPERSEDED
                  \-> DRAFT (changes requested)
APPROVED -> ARCHIVED (authorized action)
```

---

## 10. Permissions by Role

| Operation | Employee | Supervisor | Manager | Admin |
|---|---:|---:|---:|---:|
| View lab | Scoped | Yes | Yes | Yes |
| Create test draft | Yes | Yes | Yes | Yes |
| Edit own draft | Yes | Yes | Yes | Yes |
| Review test | No | Yes | Yes | Yes |
| Approve test | No | Per policy | Yes | Yes |
| Approve own record | No | No | No | No |
| View equipment | Yes | Yes | Yes | Yes |
| Edit equipment | Per policy | Yes | Yes | Yes |
| Archive equipment | No | Per policy | Yes | Yes |
| Create SOP/WI draft | Per policy | Yes | Yes | Yes |
| Review SOP/WI | No | Yes | Yes | Yes |
| Approve SOP/WI | No | Per policy | Yes | Yes |
| Export lab reports | Per policy | Yes | Yes | Yes |

This is a design matrix; reconcile it with `src/lib/permissions.ts` before building. Do not scatter checks across pages.

---

## 11. Data Model & Linking

**Target tables:** `lab_test_records` · `lab_test_samples` · `lab_equipment` · `lab_documents` · `lab_document_versions` · `lab_document_links` · `lab_activity_log`.

**Links to the existing system:**
| Existing system | Link method |
|---|---|
| users | tested_by, reviewed_by, approved_by, owner_id, actor_id |
| permissions | page & API protection from one source |
| migrations | add new tables without touching old ones |
| notifications | notify on submit, reject, approve, doc review |
| dashboard | independent lab queries in a Laboratory section |
| export | CSV/print with the same permission checks |
| audit | log every change, status, approval |
| AI | advisory only, never decides |

---

## 12. Expected APIs

```text
GET   /api/lab/tests
POST  /api/lab/tests
GET   /api/lab/tests/:id
PATCH /api/lab/tests/:id
POST  /api/lab/tests/:id/submit
POST  /api/lab/tests/:id/review
POST  /api/lab/tests/:id/approve
POST  /api/lab/tests/:id/void

GET   /api/lab/equipment
POST  /api/lab/equipment
PATCH /api/lab/equipment/:id
POST  /api/lab/equipment/:id/archive

GET   /api/lab/documents
POST  /api/lab/documents
GET   /api/lab/documents/:id
PATCH /api/lab/documents/:id
POST  /api/lab/documents/:id/submit
POST  /api/lab/documents/:id/request-changes
POST  /api/lab/documents/:id/approve
POST  /api/lab/documents/:id/supersede
GET   /api/lab/documents/:id/versions

GET   /api/lab/exports/tests.csv
GET   /api/lab/exports/equipment.csv
GET   /api/lab/exports/documents.csv
```
Every `POST/PATCH` needs CSRF, session, role check, validation, and an activity event.

---

## 13. Dashboard Integration

A separate **Laboratory** section, distinct from task KPIs:
- Tests by type · tests by status · PASS/FAIL/HOLD trend
- Average review time · tests pending approval
- Equipment under maintenance · uncalibrated equipment
- SOP/WI needing review · latest lab activity

All metrics: server-side · period-bounded · user-scoped · auditable against the DB. Visibility = **Admin + Manager + Supervisor** (Employee excluded) as the single source of truth.

---

## 14. Security & Quality

- No `innerHTML` for unsanitized SOP/WI content.
- Never trust `tested_by`, `approved_by`, `status`, or `final_result` from the browser.
- No self-approval. No silent editing of an approved record.
- Never expose file paths, env vars, or API secrets.
- No `unsafe-inline` in CSP. Use `requireCsrf` on every mutation.
- Positive-integer parsing for ids. Safe error messages.
- XSS test inside the SOP/WI editor.
- Respect skip link, focus, keyboard, reduced motion.
- Test at 360 / 768 / 1024 / 1440 with no overflow.

---

## 15. Acceptance Criteria

The QC Laboratory space is done only when:
- All core pages render SSR.
- Migrations succeed on fresh + existing DBs without breaking old data.
- Permissions enforced server + UI.
- Air/Vacuum forms save and re-render.
- Review/approve/reject work with an audit trail.
- Approved records and approved document versions are tamper-proof.
- The 24 equipment rows exist via idempotent seed.
- SOP/WI editor renders sanitized preview and stores Markdown + version.
- Dashboard shows reconcilable metrics.
- Search and export apply the same permissions.
- Security / a11y / responsive / E2E tests documented.
- No "Production Ready" claim while P0 blockers remain.

---

## 16. Open Decisions (need sign-off)

1. Do `AIR` and `VACUUM` have different formulas? Current spec doesn't say.
2. Max allowed number of samples per test?
3. Keep equipment statuses as mixed free text, or adopt an official status dictionary?
4. Who holds final SOP/WI approval authority?
5. Official unit for `Temperature` and `Leakage Rate`?
6. Do documents need a formal code like `SOP-QC-001` with auto-generation?
7. Does an approved report need an e-signature, or is user + timestamp enough?

Until these are decided, keep the implementation flexible and configurable, and do not invent scientific or regulatory rules.
````

جاهز. تبيني أنزّله كملف فعلي بالريبو تحت `audit/qc/`؟ ولا تبيه بالعربي بدل الإنجليزي؟