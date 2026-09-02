# PROMPT 06 — ADVANCED FORMS, UNSAVED CHANGES & DRAFT AUTOSAVE

TASK ID:
QC-REMEDIATION-006

PRIORITY:
P1 / P2

ROLE:
Principal Form Interaction Architect, Frontend Systems Engineer, UX Resilience Specialist.

DEPENDS ON:
GATE B (PROMPT-02, PROMPT-04).

BLOCKS:
PROMPT-09, GATE C.

SOURCE FINDINGS:
- P1-6: Incomplete unsaved changes / draft protection across all 51 mutation forms (Autosave/Dirty State).
- Audit Sections 16, 25, 40, 64.

AFFECTED DOMAINS:
Domain 25 (Advanced Form Design & Data Entry UX), Domain 40 (Interaction Design), Domain 64 (Unsaved Changes / Draft / Autosave UX), Domain 76 (Data Quality).

MISSION:
Establish a canonical Form Contract and shared primitive across all 51 mutation forms in QC Task Manager to guarantee: automated dirty-state detection, localStorage draft preservation against accidental tab closure, native `beforeunload` warnings, client-server Zod validation parity, inline field error associations via `aria-describedby`, automatic focus placement on the first invalid field upon submit, and double-submission locking with pending indicators.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P1-6 and Forms Deep Dive (Section 16)
* inspect `apps/qc-task-manager/src/components/Form.tsx` (or existing form primitives)
* inspect form pages under `src/pages/employee/new.astro`, `src/pages/supervisor/new.astro`, `src/pages/manager/new.astro`, and `src/pages/lab/`
* inventory all 51 form routes.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/pages/employee/new.astro`
- `apps/qc-task-manager/src/pages/lab/tests/new.astro`
- `apps/qc-task-manager/src/pages/lab/equipment/new.astro`
- `apps/qc-task-manager/src/pages/lab/calibration/new.astro`
- `apps/qc-task-manager/src/pages/findings/new.astro`
- `apps/qc-task-manager/scripts/test-forms-advanced-100.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/form-design/SKILL.md`
- `.agents/skills/form-labelling/SKILL.md`

REQUIREMENTS:
1. Canonical Form Primitive (`src/components/CanonicalForm.tsx` or script controller):
   - Implement standardized form handler providing:
     - `isDirty` state tracker comparing current values against initial values.
     - `beforeunload` listener that intercepts tab closing or link navigation when form is dirty.
     - `draftStorageKey`: debounced (500ms) automatic persistence of field values to `localStorage`.
     - "Restore draft?" notification banner if a previous unsaved draft exists for this form URL.
     - Clear draft from `localStorage` upon successful HTTP 200/201 response.
2. Comprehensive Coverage Across All 51 Forms:
   - Wire the canonical controller into all creation, editing, calibration, review, and findings forms.
3. Accessibility & Focus Management:
   - When a form is submitted with validation errors:
     - Set focus immediately to the first invalid field.
     - Connect each error message element to its input using `aria-describedby="field-error-id"`.
     - Set `aria-invalid="true"` on invalid inputs.
4. Double-Submission & Pending State:
   - When the submit button is clicked, immediately set `disabled` and render an animated spinner with localized pending copy (e.g., "جاري الحفظ...").

NON-NEGOTIABLE BUSINESS RULES:
- Operators must NEVER lose 30 minutes of lab test data entry due to accidental navigation or browser refresh.
- Draft data stored in `localStorage` must be strictly scoped to the logged-in user ID to prevent data leakage between shared workstation operators.

IMPLEMENTATION REQUIREMENTS:
- Lightweight, zero heavy external form library dependencies.
- Full TypeScript typing for form schemas.

DO NOT:
- Do NOT patch forms individually with ad-hoc event handlers; use the shared canonical primitive.
- Do NOT store sensitive passwords or e-signature pins in `localStorage`.

TEST-FIRST / DEBUGGING REQUIREMENT:
Write a Playwright / Vitest test simulating typing into a lab test form, navigating away, and verifying the `beforeunload` dialog triggers, and that draft is restored on return.

TEST QUALITY REQUIREMENT:
Test behavioral state changes and `localStorage` JSON contents; do not test superficial HTML strings.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:forms-advanced-100`
- New: form dirty-state and draft restoration automated test suite.

REQUIRED BROWSER TESTS:
- E2E test on `/lab/tests/new`: type data -> refresh page -> click "استعادة المسودة" -> verify inputs populated.

REQUIRED DATABASE TESTS:
- Ensure submitting restored draft creates valid database record identical to a direct submission.

REQUIRED SECURITY TESTS:
- Ensure draft in `localStorage` is cleared on logout.

REQUIRED ACCESSIBILITY TESTS:
- Verify screen reader reads error message when focused on invalid input (`aria-describedby`).

REQUIRED ROLE TESTS:
- Verify form behavior functions identically for Analyst, Supervisor, and Admin roles.

REQUIRED NEGATIVE TESTS:
- Attempting to submit empty required fields triggers focus on first invalid input without server roundtrip.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Canonical form controller implemented and documented.
- AC-02: All 51 forms audited and integrated with dirty state and draft persistence.
- AC-03: `beforeunload` warning prevents accidental data loss across all edit forms.
- AC-04: Submitting with errors shifts focus to first invalid field and sets `aria-invalid="true"`.
- AC-05: Double-submit prevention locks button and renders spinner.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-06-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-06-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:forms-advanced-100`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...
