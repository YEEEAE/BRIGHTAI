# QC Laboratory Additions — DeepSeek Flash v4 Prompts (New Pages + Full System Wiring)

> **Purpose:** Build the NEW company QC Laboratory additions inside `apps/qc-task-manager` and wire them into EVERYTHING: the existing system (auth, RBAC, navigation), the database (migrations, FKs, audit), the dashboard (laboratory KPI section), notifications, exports, and the audit chain.
> **Language:** Prompts are intentionally written in English for DeepSeek Flash v4.
> **Execution:** Run prompts in order (A0 → A5), ONE PROMPT PER SESSION. Do not proceed until the previous prompt's acceptance criteria pass with real command output.
> **Relationship to the base file:** `audit/qc/2026-08-14-QC-LAB-IMPLEMENTATION-PROMPTS.md` (v2) builds the lab foundation (migration 011, routes, RBAC, lifecycle, editor architecture). THIS file applies the exact company data and page-level requirements:
> - **A1 — Product Test Documents entry page** (AIR / VACUUM) with the exact printed form fields (black printed fields ONLY — no handwritten-only fields).
> - **A2 — Laboratory Equipment page** seeded with the exact 24 devices, editable by authorized users.
> - **A3 — SOP & WI pages** (library, internal editor, versions).
> - **A4 — Full integration** (navbar, dashboard Laboratory section, DB wiring, notifications, audit, exports, cross-links).
> - **A5 — Verification and delivery report.**
> Each prompt is written to be SAFE whether or not the base file's prompts already ran: A0 decides extend-vs-build per page. If the base prompts already built a page, these prompts EXTEND and align it with the exact data instead of duplicating it.
> **Design reference:** `audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md` (page map, permission matrix, lifecycle, open decisions).

## DeepSeek Flash v4 execution protocol (applies to every prompt)

1. **One prompt per session.** Paste the session bootstrap, then the single prompt.
2. **Verify before you claim.** Every acceptance criterion must map to a command you ran in THIS session with a pasted result. If not run, write `NOT RUN`.
3. **Ground every helper call.** Read the real signature of every existing helper (`permissions.ts`, `api-security.ts`, `notifications.ts`, audit writer, migration runner) before using it. Do not guess. Do not invent parallel helpers.
4. **Facts block is authoritative.** If the code on disk disagrees with a fact below, trust the code and note the discrepancy.
5. **Conflict protocol.** If a requirement conflicts with existing architecture or data, STOP at that requirement, explain, and propose options. Never build a second system.
6. **No scope drift.** No refactors or renames of existing code unless the prompt says so.
7. **Honest failure.** Report failing tests verbatim. Never delete/skip/loosen a test to make it pass.
8. **Forbidden always:** `git push`, `git commit`, editing `.env*`, editing `.github/workflows/`, deleting files or data, writing secrets, adding `unsafe-inline`/`unsafe-eval` to CSP, touching a real (non-temporary) database in tests.

## Session bootstrap (paste at the start of EVERY session)

```text
You are a senior full-stack engineer working inside the existing BRIGHTAI monorepo.

Target application: apps/qc-task-manager/

SESSION START CHECKLIST:
1. Read .agents/brain.md (at minimum the top 10 ledger entries).
2. Read audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md (design reference).
3. Read audit/qc/2026-08-14-QC-LAB-ADDITIONS-PROMPTS.md (this file) — the prompt
   you are executing plus the CANONICAL DATA blocks it references.
4. Read the real source of every existing module you plan to import from.
5. Confirm the current latest migration number in apps/qc-task-manager/db/migrations/.

NON-NEGOTIABLE RULES:
- Do not modify .env or .env.* files. Never write secrets anywhere.
- Do not modify .github/workflows/.
- Do not commit, do not push, do not create branches. The user commits.
- Do not delete files or existing data.
- Every schema change goes into a NEW sequential SQLite migration. Never edit an
  applied migration.
- Preserve existing tasks, findings, CAPA, workflows, AI guardrails, audit-chain
  behavior, backups, and dashboard behavior.
- Authorization is server-side only (src/lib/permissions.ts is the single source —
  add lab permissions there, never as scattered checks).
- Validate all input with the existing Zod/server validation conventions.
- Prepared SQLite statements only; never concatenate user input into SQL.
- Employee-entered text, equipment notes, and document content are UNTRUSTED data.
- Tests use an external temporary database (absolute QC_DATABASE_PATH), never a
  real database.
- The QC app UI language is English. Seed DATA strings (including Arabic notes)
  are preserved verbatim as data.
- Do not claim a feature is verified until the relevant command passed this session.

SESSION END REPORT:
1. Files created / modified (exact paths).
2. Commands run + real results (paste summary lines; mark NOT RUN where skipped).
3. Status per requirement: IMPLEMENTED / PARTIAL / BLOCKED (reason).
4. Any conflict with existing architecture and how it was resolved (or why stopped).
```

## Repository facts (verified 2026-08-14 — anchor, do not guess)

| Fact | Value |
|---|---|
| App package | `@brightai/qc-task-manager` under `apps/qc-task-manager/` |
| Runtime | Astro SSR (`output: 'server'`) + `@astrojs/node` standalone; React islands; Tailwind |
| Database | better-sqlite3, WAL; `QC_DATABASE_PATH` must be ABSOLUTE in tests/servers |
| Migrations | `001_initial.sql` … `010_ai_evidence_status.sql` — **next migration is `011_*.sql`** (or the first free number after any lab migration that already exists) |
| Migration runner | `src/lib/migrations.ts` — checksums, rollback guard, `schema_migrations`; extend, never bypass |
| RBAC single source | `src/lib/permissions.ts` (`PERMISSIONS` + `can*` functions) |
| Roles | `admin`, `manager`, `supervisor`, `employee` — no new roles |
| API security | `src/lib/api-security.ts` (`requireApiUser`, CSRF) — every lab API uses it |
| Validation | `src/lib/validation.ts` + Zod |
| Audit | `src/lib/activity.ts` + `src/lib/audit/` (SHA-256 chain); `pnpm test:audit-integrity` |
| Notifications | `src/lib/notifications.ts` (in-app; never notify inactive users) |
| Dashboard | `src/lib/dashboard.ts` + `src/pages/dashboard.astro` (9 KPI + 6 charts + 5 tables; employee forbidden) |
| Exports | `src/lib/export.ts` / `searchExport.ts` / `pdf.ts` (CSV/XLSX/PDF patterns) |
| Layout/nav | `src/layouts/BaseLayout.astro` (skip link, reduced motion), `src/components/Navbar.tsx` (desktop cluster only at `lg`/1024px) |
| CSP | `script-src 'self'` + hashes; `style-src 'self'` + fixed sha256 — NO inline styles |
| E2E harness | `scripts/e2e-acceptance.mjs` + suites (admin-users, auth-lockout, task-shared, delete-request, dashboard, a11y, backup, findings, reports, search, persistence) |
| Verify commands | `pnpm --filter @brightai/qc-task-manager typecheck` (baseline 0/0/~13 hints) · `pnpm --filter @brightai/qc-task-manager test` (all green) · `pnpm --filter @brightai/qc-task-manager e2e:acceptance` · `node scripts/verify-security-hygiene.mjs` · `node scripts/architecture-guard.mjs` |

---

## PROMPT A0 — Preflight: lab state check and extend-vs-build plan

```text
Read-only preflight. Do not implement features in this prompt.

GOAL: Determine, with evidence, what already exists for the QC Laboratory and
decide per page whether this additions file EXTENDS an existing implementation
or BUILDS it fresh.

CHECK (report each as EXISTS / PARTIAL / MISSING, with file paths):
1. db/migrations/ — any lab_* migration already applied? Which number is next?
2. src/pages/lab/** — which routes exist (/lab, /lab/tests, /lab/equipment,
   /lab/documents)?
3. src/lib/ — any lab helpers/types already present?
4. src/lib/permissions.ts — any lab permission functions already present?
5. Navbar — is there already a Laboratory link?
6. dashboard.astro / dashboard.ts — any laboratory section already present?
7. Tests — any lab test coverage already present?

DECIDE per addition (A1 test documents page, A2 equipment page, A3 SOP/WI pages):
- EXTEND: page exists -> A1/A2/A3 align it with the CANONICAL DATA below and add
  what is missing (fields, seed, behaviors).
- BUILD: page missing -> create it following the same conventions as existing
  pages (findings/, tasks/, dashboard).

CREATE: apps/qc-task-manager/docs/QC-LAB-ADDITIONS-PLAN.md containing:
- the evidence table above;
- the EXTEND/BUILD decision per page with reasons;
- the exact next migration number;
- the list of permissions to add to src/lib/permissions.ts (names only);
- risks and open decisions carried over from the pages report section 18
  (do NOT answer those decisions yourself).

ALLOWED FILE CHANGES: only the plan document.

Acceptance criteria:
- No production source or database file changed.
- Every EXISTS/PARTIAL/MISSING claim cites a real file path checked this session.
- The next migration number is stated explicitly.
```

---

## PROMPT A1 — Employee product test documents page (AIR / VACUUM)

```text
Build (or extend) the employee-facing page for entering PRODUCT TEST DOCUMENTS
for AIR and VACUUM tests.

Routes:
- /lab/tests/new?type=air     -> "New Air Test"
- /lab/tests/new?type=vacuum  -> "New Vacuum Test"
- (list + detail + review flow already covered by the base file; this prompt owns
  the DATA-ENTRY experience and its exact fields.)

FIELD RULE (critical): include ONLY the printed/black fields of the company form
specified below. Handwritten-only annotations on the paper form are OUT OF SCOPE.
If the user later attaches a form image whose printed fields differ from this
specification, STOP and confirm with the user before adding/removing fields.

=== CANONICAL FORM SPECIFICATION (8 sections, printed fields) ===

SECTION 1 — SAMPLE IDENTIFICATION  (employee-entered)
- Product Description ......... text, REQUIRED
- Connector Type .............. single choice, REQUIRED, exactly 3 options:
    ( ) Non-locking (Lipid connector)
    ( ) Connector with floating or rotatable collar
    ( ) Locking connector with fixed threads
- No. of Samples Tested ....... positive integer, REQUIRED, default 5,
                                max = lab policy cap (configurable constant,
                                suggest 20; reject beyond cap with a safe error)
- Lot Number .................. text, REQUIRED
- Sampling Area ............... text, REQUIRED

SECTION 2 — EQUIPMENT USED  (employee-entered)
- Machine Name ................ REQUIRED. Render as a <select> populated from
                                lab_equipment (non-archived rows) + an explicit
                                "Other (type manually)" option with a controlled
                                free-text input. Store equipment_id when selected,
                                plus the machine_name text always.
- Medium Used .................. text, REQUIRED

SECTION 3 — CONNECTOR ASSEMBLY  (employee-entered)
- Actual Pressure ............. decimal, REQUIRED. Display the reference range
                                "(-2.5 ~ -4) in./Hg" as a HINT next to the label.
                                Do NOT hard-reject values outside the range (no
                                invented regulatory rule). Accept negatives.
- Torque (in.lb) .............. decimal
- Time (Sec.) ................. positive number
- Angle ........................ number or controlled text

SECTION 4 — DIFFERENTIAL CONVERSION  (employee-entered)
- Temperature (Measured) ...... decimal. Show a unit label ONLY if the company
                                approved a unit (open decision — default: no
                                conversion, value stored as entered).

SECTION 5 — TEST PARAMETERS  (reference block — read-only by default)
Render exactly this text as a reference card beside the entry fields:
- Standard Parameter: Subatmospheric Pressure -40 ~ -80 kPa
- Acceptance Criteria: <= 800 Pa
- Holding Time: 18 ~ 56 Sec.
Snapshot these three values onto lab_test_records at SUBMIT time so the approved
record keeps the parameters it was judged against. If a future policy makes them
editable, every edit stores actor + timestamp + old/new values.

SECTION 6 — TEST RESULTS  (employee-entered, repeating rows)
Render a results table with N rows where N = "No. of Samples Tested" (default 5),
plus an "Add Sample" button bounded by the policy cap. Columns (exact labels):
| Sample No. | Part Name | Set Pressure (in./Hg) | Actual Pressure | Volume (Sec.) | Pressure Difference | Holding Time (Sec.) | Leakage Rate | Result |
- Sample No.: system-generated sequence 1..N.
- Part Name: text.
- Set Pressure / Actual Pressure / Volume / Pressure Difference / Holding Time /
  Leakage Rate: decimal inputs (Leakage Rate may be controlled text if the unit
  is textual; open decision — default decimal).
- Pressure Difference: ENTERED MANUALLY. Never auto-calculate unless the company
  approves an explicit formula (none is specified).
- Result: select PASS / FAIL / HOLD per sample — human decision only, never AI.
Below the table: "Any Remarks" free text.

SECTION 7 — AUTHORIZATION  (system-managed — NEVER from hidden inputs)
- Tested By: stamped from the authenticated session user at creation; shown
  read-only; changes only via an explicit admin policy.
- Reviewed By: stamped by the server at the review action (empty until then).
- Approved By: Q.C.M.: stamped by the server at approval (empty until then).
Reject any request body that tries to set these three fields.

SECTION 8 — FINAL RESULT  (employee-entered; reviewer confirms during review)
Single choice, exactly:
  ( ) PASS
  ( ) FAIL
  ( ) HOLD / FURTHER EVALUATION
Stored as 'PASS' | 'FAIL' | 'HOLD'. Never derived automatically. Never AI-decided.

=== END SPECIFICATION ===

BEHAVIOR:
- ONE shared form component + ONE Zod schema, config-driven by test_type
  ('AIR' | 'VACUUM'). No duplicated per-type forms.
- "Save Draft": persists partial input WITHOUT full validation (only type checks
  and bounded lengths); stays DRAFT; no notifications; logs lab_activity_log
  'created'/'updated'.
- "Submit for Review": full server-side validation (all REQUIRED above, enums,
  numeric parses, samples count == rows count) in ONE transaction: insert/update
  lab_test_records + lab_test_samples rows + snapshot section 5 values + status
  DRAFT -> SUBMITTED + activity event + notification to reviewers.
- After submit, the record is read-only for the tester until rejected back to
  DRAFT (rejection flow per base file PROMPT 04 — if missing, implement the
  minimal safe lifecycle: SUBMITTED -> REJECTED(reason) -> DRAFT editable).
- Server never trusts: tested_by/reviewed_by/approved_by/status/final_result
  transitions from the client.
- Print-ready rendering of a submitted/approved record reproducing the 8 printed
  sections (print CSS; include record ID, test type, and generated-at).

ALLOWED FILE CHANGES: src/pages/lab/tests/new.astro (+ shared form island),
src/lib/ lab schema/persistence helpers, a focused test script (extend
scripts/test.mjs or add scripts/test-lab-forms.mjs wired into `pnpm test`),
docs/QC-LAB-ADDITIONS-PLAN.md status update.

Verification commands (paste results):
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- NODE_ENV=production pnpm --filter @brightai/qc-task-manager build

Acceptance criteria:
1. Both ?type=air and ?type=vacuum render the SAME form architecture; test_type
   is stored and displayed (badge) correctly.
2. Draft with partial data saves and reloads with ALL values intact (including
   5 sample rows and section-3 negative pressure values).
3. Submit is rejected server-side for: missing required section-1 fields; invalid
   connector type; samples_tested=0 / > cap; non-numeric pressure; row/result
   enum tampering; client-sent tested_by/reviewed_by/approved_by/status fields.
4. Submit success writes record + N sample rows + parameter snapshot in ONE
   transaction (rollback verified by a failing-insert test).
5. Print view renders all 8 sections read-only.
6. Existing suites stay green (no regression in task-shared/dashboard).
```

---

## PROMPT A2 — Laboratory equipment page (24 devices, editable)

```text
Build (or extend) the LABORATORY EQUIPMENT registry page at /lab/equipment.

=== CANONICAL EQUIPMENT SEED DATA (24 rows — store VERBATIM) ===
Columns: equipment_name | equipment_code | location | status | calibration | serial_number | notes
- calibration: "yes"/"no" (Arabic نعم/لا in the source maps to yes/no).
- status and notes: keep the ORIGINAL text EXACTLY as provided (mixed Arabic/
  English is intentional company data). English display labels may be shown
  alongside via a DOCUMENTED display mapping — the original text is never
  overwritten.

1 | Breathing Filter Pressure | NOC-05 | LABORATORY | تحت الصيانة / NEW | yes | 251206666 | تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات
2 | Syringe Positive Pressure | ZTY-01 | LABORATORY | تحت الصيانة / NEW | yes | 251206010 | تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات
3 | Breathing Tube Leakage | HRT-02 | LABORATORY | تحت الصيانة / NEW | yes | 251206687 | تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات
4 | PUBTESTER INSTRUMENTS | FYT-01 | LABORATORY | تحت الصيانة / NEW | yes | 251206618 | تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات
5 | Catheter Hydraulic Pressure Leak Tester | HRT-01 | LABORATORY | تحت الصيانة / NEW | yes | 251206681 | تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات
6 | TECHNICAL OUR APPLICATION ASSISTANCE | - | LABORATORY | تحت الصيانة / NEW | no | 1-800-5556-3484 | —
7 | PRESSURE GAUGE (MASK) | FMA-PG-017 | LABORATORY | مستخدم | yes | 11017 | Found and Compliant
8 | Vacuum Gauge | HZ-60 | LABORATORY | تحت الصيانة | no | DOA-P104-AA | 115 Volts
9 | WEIGHT BALANCE | LAB-BAL-01 | LABORATORY | تحت الصيانة | yes | - | Found and Compliant
10 | SCALE VERIFICATION | LAB-CFR-SV-01 | LABORATORY | مستخدم | yes | - | Found and Compliant
11 | FLOW RATE | LAB-CFR-FRV-01 | LABORATORY | مستخدم | yes | - | —
12 | CONNECTOR ASSEMBLY DIV | LAB-SBC-TMC-01 | LABORATORY | مستخدم | yes | KPO22022601111 | التواصل مع المصنع
13 | MACHINE OPERATING PROCEDURE FOR TUBES | BSS-250N, 250N | LABORATORY | غير مستخدم / تحت الصيانة | yes | - | —
14 | PRESSURE | LAB-TMC-OL-C-PC-01 | LABORATORY | غير مستخدم | yes | - | —
15 | POSITIVE WATER BATH | LAB-SBC-TMC-07 | LABORATORY | غير مستخدم | yes | - | —
16 | MEDICAL PERFORMANCE TEST | YYL-03 | LABORATORY | غير مستخدم / DONE | yes | 20238265 | تم إصلاحه
17 | Falling Drop Positive Pressure Liquid | JBL-750 | LABORATORY | غير مستخدم / تحت الصيانة | yes | - | —
18 | Subatmospheric Air Testing | LAB-SBC-TMC-03 | LABORATORY | مستخدم | yes | KP02206061190 | Found and Compliant
19 | PRESSURE & POSTER | LAB-SBC-TMC-02 | LABORATORY | مستخدم | yes | K220001100 | —
20 | OPERATING PRODUCT | SS.2500W | LABORATORY | غير مستخدم | no | KP022060611-1 | Need Clip
21 | FILTER 13MM | DFT002 | LABORATORY | NEW | yes | M03250421013-3 | Need Clip
22 | VOLTAGE -220VAC | YYL03 | LABORATORY | NEW | no | 32503602 | Need Clip
23 | WATER BATH TEMPERATURE | LAB-CRF-WBTV-01 | LABORATORY | مستخدم | yes | 230427021 | Found and Compliant
24 | Catheter Vacuum Leak Test | DVT-01 | LABORATORY | NEW / تحت الصيانة | yes | 240710362 | —

STATUS DISPLAY MAPPING (derived, display/filter ONLY — originals preserved):
- مستخدم -> "In Use"
- تحت الصيانة -> "Under Maintenance"
- غير مستخدم -> "Not In Use"
- NEW -> "New"
- DONE -> "Done"
- Compound values keep both parts (e.g. "تحت الصيانة / NEW" -> "Under Maintenance / New").
Store this mapping in ONE documented place (e.g. src/lib/lab/equipmentStatus.ts)
and reuse it for badges, filters, and dashboard counts. Never mutate stored data.
The company may later approve an official status dictionary (open decision) —
this mapping must remain swappable.

=== END SEED DATA ===

IMPLEMENT:
1. Seed: load the 24 rows via an idempotent mechanism consistent with the
   project (seed runner or migration fixture — NOT a page array). Idempotency
   rule: never duplicate rows on re-run; never overwrite user edits made after
   seeding (match on equipment_code).
2. Page /lab/equipment (server-rendered table): columns Equipment | Code |
   Location | Status | Calibration | Serial Number | Notes | Updated By/At.
   - server-side search (name, code, serial, status, location) + filters
     (status via the display mapping, calibration yes/no) + pagination;
   - every row links to test records that used it (via lab_test_records
     equipment/machine reference) and to linked SOP/WI documents.
3. Editability (users CAN edit — authorization via src/lib/permissions.ts):
   - employee: view (+ edit ONLY if policy grants; default NO);
   - supervisor/manager: edit all operational fields (name, code, location,
     status, calibration, serial, notes);
   - admin: edit + create new + archive.
   - Edit form: accessible, labeled, Zod-validated; serial_number is TEXT
     (accepts "-", "DOA-P104-AA", "1-800-5556-3484"); status free text PLUS the
     display mapping (no forced enum — original mixed values must stay storable).
4. Every edit writes lab_activity_log with old/new values (calibration and
   status changes ALWAYS logged) and stamps updated_by/updated_at from the
   session.
5. Archive (admin): sets archived flag; archived equipment stays readable in
   historical test records and document links; never hard-deleted.

ALLOWED FILE CHANGES: seed/migration for the 24 rows, src/pages/lab/equipment.astro
(+ edit page or modal), src/lib/lab/ helpers (incl. equipmentStatus mapping),
src/lib/permissions.ts (additive lab functions), tests.

Verification commands (paste results):
- pnpm --filter @brightai/qc-task-manager test:migrations
- pnpm --filter @brightai/qc-task-manager test
- pnpm --filter @brightai/qc-task-manager typecheck

Acceptance criteria:
1. Fresh temp DB contains exactly 24 lab_equipment rows with values matching the
   canonical block verbatim (automated assertion: count=24; spot-check codes
   NOC-05/serial 251206666, DVT-01/serial 240710362, HZ-60/serial DOA-P104-AA,
   row 6 serial "1-800-5556-3484", row 13 code "BSS-250N, 250N").
2. Re-running the seed changes nothing (idempotent — asserted).
3. Authorized edit persists after reload; updated_by/updated_at stamped; activity
   row written with old/new values; employee edit without policy grant -> 403.
4. Filters/search return correct subsets via the display mapping (e.g. filtering
   "Under Maintenance" includes "تحت الصيانة / NEW" rows) without mutating data.
5. Archiving keeps the equipment resolvable from a linked test record page.
6. Existing suites stay green.
```

---

## PROMPT A3 — SOP & WI pages (library, internal editor, versions)

```text
Build (or extend) the SOP / WI (Work Instruction) pages under /lab/documents:

- /lab/documents .................. library (list + filters)
- /lab/documents/new .............. internal editor (create draft)
- /lab/documents/[id] ............. read view of the current version
- /lab/documents/[id]/edit ........ edit draft OR create a new version of an
                                     approved document
- /lab/documents/[id]/versions .... version history + compare

LIBRARY columns: Document Code | Title | Type (SOP/WI) | Current Version |
Status | Owner | Related Product | Related Equipment | Effective Date |
Review Due Date | Updated At. Filters: type, status, owner, equipment, product,
"review due soon" (review_due_date within N days, N configurable, default 30).

EDITOR (metadata): title, document_code, document_type (SOP|WI), description,
related_product, related_equipment (from lab_equipment), owner, effective_date,
review_due_date, change_summary (mandatory per version).
EDITOR (content): controlled textarea (Markdown) + server-rendered SANITIZED
preview. v1 Markdown set: headings, paragraphs, numbered steps, bullet lists,
tables, warning/note blocks, links, checklists. Prefer an existing renderer
dependency in the workspace; otherwise a minimal allowlist-based renderer +
sanitizer (strip scripts, event handlers, javascript: URLs, iframes). NEVER
innerHTML with untrusted content. Preserve original Markdown for editing.

LIFECYCLE (server-enforced):
  DRAFT -> IN_REVIEW -> APPROVED -> SUPERSEDED
                     \-> DRAFT (changes requested, mandatory reason)
  APPROVED -> ARCHIVED (authorized action)
- Editing an APPROVED document creates version N+1 as DRAFT and leaves the
  approved version untouched (immutable).
- Owner cannot approve their own document (separation of duties, same as tests).
- Approval stamps reviewer/approver identities + timestamps from the session.
- Every transition writes lab_activity_log and in-app notifications (owner on
  changes-requested/approved/superseded; reviewers on submit).
- Approved documents render on a print-friendly read-only page (code, title,
  version, effective date, approval block).

LINKING: link documents <-> equipment and <-> test records (lab_document_links)
from the editor metadata and from the equipment page (A2).

ALLOWED FILE CHANGES: src/pages/lab/documents/** , src/lib/ document helpers +
sanitizer, permissions wiring (document review/approve functions), tests.

Verification commands (paste results):
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs

Acceptance criteria:
1. Employee creates a draft SOP and a draft WI; reload shows identical content
   (Markdown preserved).
2. Reviewer requests changes with reason -> status DRAFT, owner notified.
3. Approve -> version frozen (direct PATCH fails); a new revision creates
   version N+1 while the old version shows APPROVED then SUPERSEDED after the
   new one is approved; history page lists both; compare renders both.
4. XSS attempt in content (script tag, onerror, javascript: URL) is sanitized —
   automated test asserts the payload never executes and is absent from rendered
   HTML.
5. Owner self-approval blocked server-side.
6. Existing suites stay green.
```

---

## PROMPT A4 — Full system integration (navbar, dashboard, DB, notifications, audit, exports)

```text
Wire the QC Laboratory additions into EVERYTHING. This prompt connects A1-A3 to
the rest of the system. No new user-facing pages except dashboard content.

1) NAVIGATION:
- Add a "Laboratory" entry to the role-filtered navigation (Navbar desktop
  cluster only at lg/1024px + mobile menu), linking /lab, visible to all roles;
  sub-links filtered by the lab permission matrix from src/lib/permissions.ts.
- Do NOT change existing link behavior or breakpoints; navbar overflow checks at
  390/768/1440 must stay clean (docWidth pattern from e2e-dashboard).

2) PERMISSIONS (single source — src/lib/permissions.ts, additive only):
Implement exactly this matrix as named functions (names may align with existing
conventions):
| Action                       | employee | supervisor | manager | admin |
|------------------------------|----------|------------|---------|-------|
| view lab area                | yes      | yes        | yes     | yes   |
| create test draft            | yes      | yes        | yes     | yes   |
| edit own draft               | yes      | yes        | yes     | yes   |
| review test                  | no       | yes        | yes     | yes   |
| approve test                 | no       | per policy | yes     | yes   |
| approve own record/document  | no       | no         | no      | no    |
| view equipment               | yes      | yes        | yes     | yes   |
| edit equipment               | per policy | yes      | yes     | yes   |
| archive equipment            | no       | per policy | yes     | yes   |
| create SOP/WI draft          | per policy | yes     | yes     | yes   |
| review SOP/WI                | no       | yes        | yes     | yes   |
| approve SOP/WI               | no       | per policy | yes     | yes   |
| export lab reports           | per policy | yes     | yes     | yes   |
"per policy" = driven by an explicit config constant/flag documented in one
place (default conservative), never guessed. Pages AND APIs enforce the same
functions.

3) DASHBOARD (additive Laboratory section — do not touch existing widgets):
Server-side queries in src/lib/dashboard.ts (new functions, existing style:
parameterized, scoped, testable) + section in dashboard.astro:
- Lab KPI cards: tests this period by type (AIR/VACUUM); tests by status
  (DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/VOID); final results PASS/FAIL/
  HOLD counts; tests awaiting review (+ oldest age in days); documents overdue
  for review; equipment under maintenance; equipment not calibrated (calibration
  = no).
- Lab charts (existing SVG chart conventions, data-* attributes for E2E):
  PASS/FAIL/HOLD distribution; tests per week by type (last 8 weeks).
- Lab table: recent laboratory activity (from lab_activity_log, scoped).
- All metrics respect the existing dashboard role gate (employee -> redirect).
- Extend scripts/e2e-dashboard.mjs: assert each lab KPI equals a direct SQL
  query on the temp fixture (same pattern as existing KPI checks).

4) DATABASE INTEGRITY:
- All lab FKs reference users(id)/lab_equipment(id)/lab_documents(id) correctly;
  add indexes used by the dashboard/list filters (test_type, status, final_result,
  created_at; equipment status/calibration; document status/review_due_date).
- PRAGMA foreign_key_check clean on a fresh temp DB (assert in migration tests).
- Existing backup path covers lab tables automatically (SQLite file-level) —
  verify e2e-backup stays green and note it in docs/DATABASE.md (one paragraph).

5) NOTIFICATIONS (src/lib/notifications.ts conventions):
- test submitted -> reviewers; test rejected/approved -> tester; test final
  result HOLD -> reviewers; document submitted -> reviewers; changes requested /
  approved / superseded -> owner; equipment archived or calibration changed ->
  lab stakeholders.
- Never notify inactive users; reuse existing idempotency conventions.

6) AUDIT:
- All lab mutations write lab_activity_log (actor, entity, action, old/new JSON).
- If the existing hash-chain covers lab events, chain verification stays green
  (pnpm test:audit-integrity). Otherwise document precisely why not in the plan
  doc — do not fork a second chain implementation.

7) EXPORTS + SEARCH:
- CSV exports: /api/lab/exports/tests.csv, equipment.csv, documents.csv — same
  authorization as pages, formula-character escaping, generated-at + IDs +
  versions; record export activity per project convention.
- Global search (existing /search conventions): include lab tests (product, lot,
  machine), equipment (name, code, serial), documents (title, code) — scoped by
  the same permissions.

ALLOWED FILE CHANGES: Navbar.tsx (links only), src/lib/permissions.ts (additive),
src/lib/dashboard.ts (new lab functions), src/pages/dashboard.astro (lab section),
DashboardCharts.tsx (lab widgets), src/lib/ notifications/audit wiring,
src/lib/export.ts or new lab export module, search integration, migration ONLY if
indexes are missing, scripts/e2e-dashboard.mjs (lab assertions), docs updates.

Verification commands (paste results):
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs
- node scripts/architecture-guard.mjs
- pnpm --filter @brightai/qc-task-manager e2e:acceptance

Acceptance criteria:
1. Navbar shows Laboratory for every role; employee sees no review/approve links;
   unauthorized direct URL access is still blocked server-side (test).
2. Permission matrix enforced: automated checks for at least employee-review-403,
   employee-approve-403, owner-self-approve-403, employee-equipment-edit-403
   (with default policy), manager-approve-200.
3. Dashboard lab KPIs match direct SQL on the temp fixture (e2e assertions pass);
   existing 45 dashboard checks + all other suites stay green.
4. Notifications created exactly for the listed events; inactive recipients get
   none (test).
5. Audit rows exist for every mutation in the e2e flow; chain verification green.
6. CSV exports authorized-only, escaped, with metadata; unauthorized -> 403.
7. No horizontal overflow at 360/768/1024/1440 on /lab, /lab/tests, /lab/equipment,
   /lab/documents, /dashboard (docWidth checks).
```

---

## PROMPT A5 — Additions verification and delivery report

```text
Final verification pass for the QC Laboratory additions (A1-A4). Do not add
features.

SCENARIOS (each must end PASS / FAIL / BLOCKED / NOT RUN with evidence):
1. Fresh temp DB: migrations apply (including lab tables + 24-row equipment seed);
   PRAGMA foreign_key_check empty; lab indexes present.
2. Employee opens /lab/tests/new?type=air, fills sections 1-8 (5 samples), saves
   draft, reloads, values identical; submits; status SUBMITTED.
3. Same for ?type=vacuum; invalid numeric/enum submissions rejected with
   field-level errors; client-sent authorization/status fields ignored/rejected.
4. Reviewer rejects with reason -> tester notified; employee edits and resubmits;
   approver approves -> APPROVED read-only; direct PATCH to approved record fails.
5. Tester self-approval blocked (both test records and documents).
6. Equipment: 24 seeded rows verbatim; edit by authorized role persists with
   activity log; employee edit 403 (default policy); archive preserves history;
   status filter via display mapping returns correct rows.
7. SOP/WI: draft -> submit -> changes requested -> resubmit -> approve; new
   revision creates N+1 without mutating approved N; XSS payload sanitized.
8. Dashboard lab KPIs equal direct SQL on the fixture; employee blocked from
   /dashboard.
9. Navbar + responsive: no overflow at 360/768/1024/1440 on all lab pages.
10. Notifications + audit rows exist for every event in scenarios 2-7; chain
    verification green.
11. CSV exports: authorized 200 with safe escaping; unauthorized 403.
12. ALL existing suites green (regression gate).

RUN (smallest first, then full):
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs
- node scripts/architecture-guard.mjs
- node scripts/verify-badge-contrast.mjs
- pnpm --filter @brightai/qc-task-manager e2e:acceptance
- NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
- git diff --check

CREATE: apps/qc-task-manager/docs/QC-LAB-ADDITIONS-VERIFICATION-REPORT.md
- scenario table (PASS/FAIL/BLOCKED/NOT RUN + evidence command + result line);
- files changed summary;
- remaining gaps and carried-over open decisions (pages report section 18);
- explicit statement that production readiness is NOT claimed if any P0 blocker
  from the evidence audit is still open.

Acceptance criteria:
- Report exists with honest per-scenario statuses backed by pasted command output.
- Zero regressions in the full suite; any failure reported verbatim, never hidden.
```

---

## Execution order summary

| Order | Prompt | Outcome |
|---:|---|---|
| 1 | A0 | Evidence-based extend-vs-build plan |
| 2 | A1 | AIR/VACUUM test documents entry page (exact printed fields) |
| 3 | A2 | Equipment registry (exact 24 devices, editable) |
| 4 | A3 | SOP/WI library + editor + versions |
| 5 | A4 | Full wiring: navbar, permissions, dashboard, DB, notifications, audit, exports |
| 6 | A5 | Verification + delivery report |

## Open decisions (do NOT invent answers — keep configurable)

Carried over from the pages report section 18; until the company answers them,
implement configurable defaults and never guess:

1. Do AIR and VACUUM have different formulas/acceptance rules? (Spec defines none.)
2. Maximum allowed samples per test (policy cap; default suggested 20).
3. Official equipment status dictionary vs preserving the current mixed text
   (current decision: preserve verbatim + display mapping).
4. Who holds final SOP/WI approval authority (Q.C.M.? manager? admin?).
5. Official units for Temperature (Measured) and Leakage Rate.
6. Formal document numbering (e.g. SOP-QC-001 auto-generation) — not specified.
7. Electronic signature requirements for approved reports vs user+timestamp audit
   trail (current: audit trail).
