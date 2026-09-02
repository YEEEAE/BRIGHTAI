# PROMPT 01 — P0 CORRECTNESS & CANONICAL GATE UNBLOCKING

TASK ID:
QC-REMEDIATION-001

PRIORITY:
P0 (CRITICAL RELEASE BLOCKER)

ROLE:
Principal Quality Systems Engineer, Staff Test Architect, Observability Lead.

DEPENDS ON:
PROMPT-00.

BLOCKS:
INTEGRATION GATE A and all subsequent feature/workflow remediation prompts.

SOURCE FINDINGS:
- P0-1: `test:observability` assertion failure (`scripts/test-observability.mjs:18`)
- P0-2: `test:a11y-ergonomics-100` missing evidence file check (`scripts/test-a11y-ergonomics-100.mjs`)
- P0-3: `e2e:delete-request` button locator text mismatch blocking runner (`scripts/e2e-delete-request.mjs:196`)
- Audit Sections 1, 4, 12, 19, 24, 28, 32 (Risks 1 & 2).

AFFECTED DOMAINS:
Domain 1 (Quality Engineering), Domain 12 (Functional Workflow Correctness), Domain 13 (Testing Architecture), Domain 19 (Error Architecture), Domain 26 (Accessibility), Domain 30 (Observability), Domain 65 (Destructive Action Confirmation).

MISSION:
Directly resolve the three active P0 defects in the current HEAD tree, unblock the acceptance test runner, restore 100% pass rate across the 74 canonical unit suites and 28 canonical E2E acceptance suites, and ensure all release gates can execute end-to-end.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read audit findings P0-1, P0-2, P0-3
* record HEAD (`git rev-parse HEAD`)
* inspect current implementation:
  - `apps/qc-task-manager/scripts/test-observability.mjs`
  - `apps/qc-task-manager/src/lib/observability.ts`
  - `apps/qc-task-manager/scripts/test-a11y-ergonomics-100.mjs`
  - `apps/qc-task-manager/scripts/e2e-delete-request.mjs`
  - `apps/qc-task-manager/src/components/ReviewDeleteRequestDialog.tsx`
* reproduce all three failures independently.

MANDATORY SOURCE INSPECTION:
1. `apps/qc-task-manager/scripts/test-observability.mjs` lines 1-35.
2. `apps/qc-task-manager/src/lib/observability.ts` lines 50-95.
3. `apps/qc-task-manager/scripts/test-a11y-ergonomics-100.mjs` lines 1-40.
4. `apps/qc-task-manager/scripts/e2e-delete-request.mjs` lines 180-210.
5. `apps/qc-task-manager/src/components/ReviewDeleteRequestDialog.tsx` lines 70-95.
6. `apps/qc-task-manager/scripts/e2e-acceptance.mjs` (orchestrator).

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/error-handling-ux/SKILL.md`
- `.agents/skills/accessibility-audit/SKILL.md`

REQUIREMENTS:
1. P0-1 (Observability):
   - In `apps/qc-task-manager/scripts/test-observability.mjs:18`, update the assertion to match the enhanced, privacy-safe error message produced by `src/lib/observability.ts`: `'We couldn’t complete the request. The save state is unknown. Check the record before trying again.'`.
   - Verify that test passes with exit code 0.
2. P0-2 (Accessibility Evidence Gate):
   - In `apps/qc-task-manager/scripts/test-a11y-ergonomics-100.mjs`, update the required evidence path to point to the consolidated evidence file (`audit/qc/QC-Task-Manager/Evidences/QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md`) or restore the localized evidence file beside the gate without breaking repo structure.
   - Verify that `pnpm run test:a11y-ergonomics-100` executes and passes cleanly.
3. P0-3 (E2E Delete Request Locator):
   - In `apps/qc-task-manager/scripts/e2e-delete-request.mjs:196`, update the Playwright locator: change `dialog[open] button:has-text("Confirm deletion")` to `dialog[open] button:has-text("Delete task permanently")` (matching `ReviewDeleteRequestDialog.tsx:83`).
   - Run `node apps/qc-task-manager/scripts/e2e-delete-request.mjs` in isolation and verify it completes with exit code 0.
4. Full E2E Unblocking:
   - Run the full acceptance runner: `node apps/qc-task-manager/scripts/e2e-acceptance.mjs`.
   - Verify that all 28 canonical suites execute sequentially and pass without timeouts or aborts.

NON-NEGOTIABLE BUSINESS RULES:
- Never weaken security or delete safety checks.
- Deletion requests MUST remain strictly protected by manager dual-confirmation.
- Error messages presented to the user must NEVER leak raw database errors or stack traces.

IMPLEMENTATION REQUIREMENTS:
- Fixes must be precise, minimal, and fully documented.
- No flaky timeouts; Playwright locators must be resilient.

DO NOT:
- Do NOT delete the observability test or reduce its assertion breadth.
- Do NOT disable the a11y gate.
- Do NOT comment out the destructive deletion dialog or bypass the manager authorization check.

TEST-FIRST / DEBUGGING REQUIREMENT:
- Step 1: Run `pnpm run test:observability` -> confirm exit code 1.
- Step 2: Run `pnpm run test:a11y-ergonomics-100` -> confirm exit code 1.
- Step 3: Run `node apps/qc-task-manager/scripts/e2e-delete-request.mjs` -> confirm timeout at line 196.
- Apply fixes.
- Step 4: Re-run all three in isolation -> confirm exit code 0.
- Step 5: Run cumulative test suite.

TEST QUALITY REQUIREMENT:
Exact text and selector matching; verify dialog open state, button presence, action submission, and record deletion in DB.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:observability`
- `pnpm run test:a11y-ergonomics-100`
- `pnpm run test:manifest`
- All 74 unit suites via `scripts/run_all_canonical.mjs`

REQUIRED BROWSER TESTS:
- `node apps/qc-task-manager/scripts/e2e-delete-request.mjs`
- Full suite: `node apps/qc-task-manager/scripts/e2e-acceptance.mjs` (28/28 suites)

REQUIRED DATABASE TESTS:
- Verify task deletion log in `task_deletion_history` is created when delete request is approved.

REQUIRED SECURITY TESTS:
- Verify that non-manager users cannot trigger the delete request approval dialog.

REQUIRED ACCESSIBILITY TESTS:
- Verify that `ReviewDeleteRequestDialog` has `role="dialog"`, `aria-modal="true"`, and traps focus.

REQUIRED ROLE TESTS:
- Verify Employee can request deletion.
- Verify Manager can review and approve deletion.
- Verify Supervisor cannot approve deletion.

REQUIRED NEGATIVE TESTS:
- Submitting delete request dialog without required confirmation text must be rejected.

REGRESSION REQUIREMENT:
- All 74 canonical unit suites must pass.
- All 28 canonical E2E suites must pass.
- `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check` must report 0 errors, 0 warnings.
- `ASTRO_TELEMETRY_DISABLED=1 pnpm build` must complete cleanly.

ACCEPTANCE CRITERIA:
- AC-01: `test:observability` passes with 0 assertions failed.
- AC-02: `test:a11y-ergonomics-100` passes with 0 errors.
- AC-03: `e2e:delete-request` completes in < 15s with 0 timeouts.
- AC-04: `e2e-acceptance.mjs` runs all 28 suites to completion with 28/28 PASS.
- AC-05: Full canonical test suite passes 74/74 unit suites.
- AC-06: Zero regressions in typecheck and build.

TARGET:
All applicable AC = PASS (6/6). Zero failing tests in HEAD.

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-01-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test` and `node scripts/e2e-acceptance.mjs`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: 74/74 unit passed, 28/28 E2E passed
Remaining: 0 P0 blockers
