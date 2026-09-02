# PROMPT 04 — QC/QMS WORKFLOWS, LAB OPERATIONS & CHANGE REQUESTS

TASK ID:
QC-REMEDIATION-004

PRIORITY:
P1 / P2

ROLE:
QC/QMS Systems Engineer, Laboratory Information Management (LIMS) Specialist, Workflow Architect.

DEPENDS ON:
PROMPT-02, PROMPT-03.

BLOCKS:
PROMPT-05, GATE B.

SOURCE FINDINGS:
- P2-3: Laboratory change request form mirrors database schema rather than user intent workflow.
- Audit Sections 2, 7, 11, 15, 16, 18, 43, 44, 57, 58.

AFFECTED DOMAINS:
Domain 2 (QC Compliance), Domain 5 (Auditability / Traceability), Domain 8 (Workflow Rules), Domain 15 (Electronic Records / E-Signature), Domain 16 (Document Control SOP/WI), Domain 18 (State Machine), Domain 43 (Laboratory UX), Domain 44 (Compliance UX), Domain 57 (Service Design).

MISSION:
Overhaul the Laboratory Change Request workflow to be user-intent-driven, enforce dual-intent electronic signatures with SHA-256 record sealing for test releases, ensure document versioning (SOP/WI) enforces formal employee acknowledgement tracking, and guarantee strict segregation of duties between analysts and approving supervisors.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P2-3 and QC Deep Dive (Section 7)
* inspect `apps/qc-task-manager/src/pages/lab/change-requests/`
* inspect `apps/qc-task-manager/src/pages/lab/tests/[id].astro`
* inspect `apps/qc-task-manager/src/lib/qcWorkflow.ts`
* inspect `apps/qc-task-manager/src/lib/permissions.ts`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/pages/lab/change-requests/new.astro`
- `apps/qc-task-manager/src/pages/lab/change-requests/[id].astro`
- `apps/qc-task-manager/src/pages/lab/tests/[id]/review.astro`
- `apps/qc-task-manager/src/pages/lab/documents/[id]/versions.astro`
- `apps/qc-task-manager/src/pages/lab/acknowledgements/index.astro`
- `apps/qc-task-manager/scripts/test-qc-compliance-100.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/form-design/SKILL.md`

REQUIREMENTS:
1. Intent-Driven Change Request Form (P2-3):
   - Refactor `src/pages/lab/change-requests/new.astro`:
     - Replace raw database field dumps with a structured 3-step intent flow:
       - Step 1: Change Objective & Scope (Title, Reason, Urgency, Affected Areas).
       - Step 2: Risk & Quality Impact Assessment (GMP impact, validation required, rollback plan).
       - Step 3: Action Plan & Stakeholder Reviewers (Assignee, target completion date, attachments).
     - Provide smart defaults, contextual tooltips, and validation.
2. Strict Segregation of Duties:
   - In `src/lib/qcWorkflow.ts` and test review endpoints, enforce: the analyst who entered the lab test results CANNOT be the approving supervisor who signs off the Certificate of Analysis.
   - Attempting self-approval must be rejected with HTTP 403: "Segregation of duties violation: Analyst cannot approve own test."
3. Electronic Signature Durability:
   - Dual-intent signature requires: password re-entry + explicit signature reason (e.g. "I approve this test result for release").
   - Compute and store SHA-256 hash of the complete test dataset in `lab_test_approvals`. Any subsequent tampering with the raw test data invalidates the signature hash.
4. SOP / Document Acknowledgement:
   - Verify that updating an SOP to a new major version flags all assigned operators as "Pending Acknowledgement".

NON-NEGOTIABLE BUSINESS RULES:
- Once an electronic signature is applied and the test is approved, the record is IMMUTABLE.
- All status changes must record a permanent entry in `lab_audit_log` with timestamp, user ID, previous state, and new state.

IMPLEMENTATION REQUIREMENTS:
- Accessible Astro components with clear progressive enhancement.
- Comprehensive Zod validation schemas.

DO NOT:
- Do NOT permit bypassing the e-signature password check.
- Do NOT allow deleting lab audit trail records under any circumstances.

TEST-FIRST / DEBUGGING REQUIREMENT:
Write a test where an analyst attempts to approve their own lab test -> assert segregation of duties error.

TEST QUALITY REQUIREMENT:
Verify SHA-256 hash calculation matches the serialized record payload exactly.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:qc-compliance-100`
- `pnpm run test:lab-workflows-100`
- `pnpm run test:e-signature-integrity`
- New change request intent validation test.

REQUIRED BROWSER TESTS:
- E2E flow: Create Lab Test -> Record Results -> Review -> Dual-Intent Sign -> Verify Approved Badge.

REQUIRED DATABASE TESTS:
- Assert row in `lab_audit_log` exists for every step in the workflow.

REQUIRED SECURITY TESTS:
- Analyst role attempting to invoke `/api/lab/tests/[id]/review` directly via curl -> returns 403 Forbidden.

REQUIRED ACCESSIBILITY TESTS:
- Multi-step change request form must announce current step to screen readers via `aria-current="step"`.

REQUIRED ROLE TESTS:
- Test Analyst, Supervisor, Lab Manager, Quality Director permissions across lab routes.

REQUIRED NEGATIVE TESTS:
- Submitting e-signature with incorrect password -> returns 401 Unauthorized.

REGRESSION REQUIREMENT:
All 74 unit suites and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Change Request form refactored into structured, intent-driven steps.
- AC-02: Segregation of duties strictly enforced and covered by unit test.
- AC-03: Dual-intent e-signature binds SHA-256 digest of approved data.
- AC-04: SOP major version bumps trigger mandatory operator acknowledgements.
- AC-05: Immutable audit trail records generated for all lifecycle events.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-04-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-04-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:qc-compliance-100` and lab workflow tests.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...
