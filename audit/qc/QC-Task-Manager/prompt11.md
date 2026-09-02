# QC-100-PERCENT-EXECUTION-PROMPTS

Paste-ready prompts for Codex 5.6 Luna, ordered to minimize regression. Each uses binary closure. Model/Repo/App = Codex 5.6 Luna · YEEEAE/BRIGHTAI · apps/qc-task-manager.

---

## EP-01 — Phase 0 · P0-1 Observability gate stale expectation

- **Task ID:** QC-P0-001-OBSERVABILITY-GATE · **Priority:** P0
- **Preconditions:** HEAD frozen; failing suite reproduced (`pnpm test:observability` exit 1).
- **Skills:** ux-writing, error-handling-ux.
- **Exact gap:** test:observability.mjs:18 expects "Something went wrong. Please try again." but source returns "We couldn't complete the request. The save state is unknown. Check the record before trying again."
- **Determination:** the TEST is wrong. The product copy is the correct, safer message (does not claim retry safety). Never weaken product copy.
- **Required:** update ONLY the test expectation to the current product copy; add a source-contract guard pinning the recovery copy so copy drift fails fast; document the decision in the evidence file.
- **Forbidden:** changing the product message; deleting the assertion; skipping the suite.
- **Tests:** pnpm test:observability (exit 0) → pnpm test (74/74) → pnpm typecheck.
- **Browser validation:** trigger a server error in dev and verify the message renders.
- **Evidence file:** 01-OBSERVABILITY-P0-FIX-EVIDENCE.md (before/after, root cause, business truth).
- **Stop conditions:** if the product copy is missing aria-live semantics, STOP and report instead of expanding scope.
- **DoD:** full unit suite green, evidence committed-ready, no product copy change.

## EP-02 — Phase 0 · P0-2 Restore a11y evidence file beside its gate

- **Task ID:** QC-P0-002-A11Y-EVIDENCE-RESTORE · **Priority:** P0
- **Preconditions:** P0-1 merged.
- **Exact gap:** test-a11y-ergonomics-100.mjs requires A11Y-ERGONOMICS-100-EVIDENCE.md beside the gate; file moved in ba29fb7e to Evidences/ and later removed during consolidation.
- **Required:** restore the file beside the gate from `git show ba29fb7e^:apps/qc-task-manager/A11Y-ERGONOMICS-100-EVIDENCE.md`; then EITHER keep the single app-dir copy and update the audit pack to reference it, OR relax the gate to accept a documented canonical path — choose one canonical location and make guard+docs agree.
- **Forbidden:** recreating divergent duplicate copies; weakening the gate to not require evidence.
- **Tests:** pnpm test:a11y-ergonomics-100 (exit 0) → pnpm test (74/74).
- **Browser validation:** none (source gate).
- **Evidence file:** 02-A11Y-EVIDENCE-RESTORE-EVIDENCE.md.
- **DoD:** single canonical evidence location, guard green, docs consistent.

## EP-03 — Phase 0/1 · P0-3 Destructive-delete confirmation broken in browser

- **Task ID:** QC-P0-003-DELETE-CONFIRM-E2E · **Priority:** P0
- **Preconditions:** EP-01, EP-02 merged.
- **Exact gap:** e2e-delete-request.mjs:196 times out waiting for `dialog[open] button:has-text("Confirm deletion")`.
- **Required:** reproduce locally; diagnose whether the dialog markup/behavior regressed (product) or the selector/stale-assumption (test). If product: restore the confirmation dialog for destructive delete (dialog element, explicit confirm button, focus trap, Escape=cancel, focus restoration). If test: fix selector to the real contract. Add regression E2E asserting the dialog appears within 5s. Then rerun the FULL e2e:acceptance (must unblock and pass all 28 suites).
- **Forbidden:** removing the confirmation step; auto-accepting dialogs; marking suite skip.
- **Tests:** e2e:delete-request → e2e:acceptance 28/28 → full unit suite.
- **Browser validation:** manual 360px + 1440px walk of the delete flow both roles with delete rights.
- **Evidence file:** 03-DELETE-CONFIRM-P0-EVIDENCE.md (root cause, diff, before/after screenshots).
- **DoD:** zero failing/blocked E2E suites at HEAD.

## EP-04 — Phase 1 · Security + engineering hard gates

- **Task ID:** QC-P1-004-SEC-ENG-GATES · **Priority:** P1
- **Gaps:** CSRF gate absent (054); no lint/error-architecture/maintainability gates (015, 020–022).
- **Required:** add CSRF contract suite (token presence + enforcement on mutating routes); add ESLint (or equivalent) with zero-warning baseline wired into run-full-tests; add swallowed-error scan gate (no empty catch in src/); register all in test-manifest.
- **Forbidden:** blanket-disabling rules; ignoring existing violations without a counted, dated budget.
- **Tests:** new gates green + full suite green.
- **Evidence file:** 04-SEC-ENG-GATES-EVIDENCE.md.
- **DoD:** criteria 015, 020, 021, 054 binary-MET with evidence.

## EP-05 — Phase 2 · Unified form contract

- **Task ID:** QC-P1-005-FORM-CONTRACT · **Priority:** P1
- **Gaps:** 251, 255–256, 258–266.
- **Required:** enforce data-qc-form mutation contract on ALL forms; guarantee aria-describedby error linkage; remove schema duplication in change-request form; add draft/dirty-state/expiry-recovery protection for long forms; extend form-productivity suites to cover each.
- **Forbidden:** excluding "minor" forms; client-only validation.
- **Tests:** form-productivity + new contract suites; e2e lab-form.
- **Evidence file:** 05-FORM-CONTRACT-EVIDENCE.md (per-form matrix).
- **DoD:** listed criteria MET, matrix shows zero forms outside contract.

## EP-06 — Phase 2 · Arabic PDF diagnostics to green

- **Task ID:** QC-P1-006-ARABIC-PDF · **Priority:** P1
- **Gap:** 288.
- **Required:** fix Arabic PDF rendering failures at root (font shaping/direction); keep diagnostics visible until green; no assertion removal.
- **Tests:** report-preview, lab-reports; visual PDF inspection.
- **Evidence file:** 06-ARABIC-PDF-EVIDENCE.md (sample PDFs before/after).
- **DoD:** criterion 288 MET; diagnostics green legitimately.

## EP-07 — Phase 7 · KPI + chart-accessibility contract

- **Task ID:** QC-P1-007-KPI-CONTRACT · **Priority:** P1
- **Gaps:** 246, 271, 273, 274, 276–278, 281.
- **Required:** every KPI declares question/owner/action/unit/period/as-of/numerator/denominator/target/previous/delta/interpretation/drilldown/zero-state; remove duplicate Average Completion Time vs Average Resolution; implement Act-now→Decide→Investigate→Context hierarchy; every chart has an HTML table equivalent.
- **Tests:** new KPI contract gate + dashboard suites.
- **Evidence file:** 07-KPI-CONTRACT-EVIDENCE.md.
- **DoD:** listed criteria MET.

## EP-08 — Phase 8 · Numeric performance budgets as pass/fail

- **Task ID:** QC-P1-008-PERF-BUDGETS · **Priority:** P1
- **Gaps:** 120, 122.
- **Required:** convert run-performance diagnostics into a budget gate: p50/p95/max per representative workflow, payload ceilings, query-count ceilings, regression tolerance; wire into manifest + release gate.
- **Forbidden:** budgets set above current measurements just to pass.
- **Evidence file:** 08-PERF-BUDGETS-EVIDENCE.md.
- **DoD:** 120, 122 MET.

## EP-09 — Phase 3/4/5 · Design-debt budget + IA + stale-data guard

- **Task ID:** QC-P2-009-DEBT-IA-GUARDS · **Priority:** P2
- **Gaps:** 150, 172, 185, 203.
- **Required:** enforce legacy raw-class no-regression budget; IA tree-test ready structure + escalation flow proof; stale-data/conflict guard on concurrent edits.
- **Evidence file:** 09-DEBT-IA-GUARDS-EVIDENCE.md.
- **DoD:** criteria MET locally (human perception items stay HUMAN).

## EP-10 — Phase 5 · AI governance, evals, fallback

- **Task ID:** QC-P2-010-AI-GOVERNANCE · **Priority:** P2
- **Gaps:** 294, 296–298, 300, 303.
- **Required:** AI governance policy artifact; golden-dataset eval harness for suggestions; model-risk register; explainability surfacing; failure/fallback suites; AI copy gate.
- **Constraint:** AI must never decide QC outcomes (keep HITL enforcement).
- **Evidence file:** 10-AI-GOVERNANCE-EVIDENCE.md.
- **DoD:** AI family ≥ 9/10 (299 stays MET).

## EP-11 — Phase 9 · Requirements registry + traceability

- **Task ID:** QC-P1-011-REQ-TRACEABILITY · **Priority:** P1 (with Product owner)
- **Gaps:** 001–007.
- **Required:** create requirements registry linking business objectives → workflows → routes/tests; assign owners to critical rules; scope-change ledger.
- **Evidence file:** 11-REQ-TRACEABILITY-EVIDENCE.md.
- **DoD:** A-family criteria MET except human sign-offs.

## HUMAN-ONLY RUNBOOK PROMPTS — EXTERNAL/HUMAN · CANNOT BE SELF-CERTIFIED BY CODEX

- **EP-H1** VoiceOver (macOS/iOS) validation across all role dashboards and forms.
- **EP-H2** NVDA (Windows) validation, same matrix.
- **EP-H3** Zoom 200%/400% + real-device reflow matrix (iOS/Android).
- **EP-H4** UAT employee + supervisor (task success, time-on-task, SUS).
- **EP-H5** UAT manager + admin (approvals, user admin, workload).
- **EP-H6** UAT lab operator + reviewer (full lab lifecycle).
- **EP-H7** Disabled-user research session (cognitive load, confusion points).
- **EP-H8** Independent design sign-off (design system + visual QA).
- **EP-H9** Independent security review / pentest.
- **EP-H10** Production deployment verification + DB read-back.
- **EP-H11** Backup/restore drill on production-like environment.
- **EP-H12** RUM + Core Web Vitals field collection.
- **EP-H13** Incident + problem-management drill.
- **EP-H14** Secrets rotation (local untracked credential revoke/rotate).
- **EP-H15** QC/business owner compliance sign-off (082 WI sourcing, 091–092).

## EP-FINAL — QC-FINAL-INDEPENDENT-100-PERCENT-VERIFICATION

**EXTERNAL/HUMAN-GATED — executable only after every EP above closes.**

- Ignore all previous percentages. Freeze a new HEAD. Rebuild the full criterion matrix from scratch.
- Run: typecheck, build (production), test (74/74), e2e:acceptance (28/28, zero BLOCKED), all domain gates.
- Verify browser matrices and read every human/external evidence artifact from EP-H1…H15.
- Recheck every previously OPEN criterion; produce exact MET/OPEN counts.
- **Refuse 100% if even one applicable criterion lacks evidence.** Verdict: NO-GO / CONDITIONAL GO / GO with exact blockers.

## Recommended execution order

EP-01 → EP-02 → EP-03 (P0s) → EP-04 → EP-05 → EP-06 → EP-11 → EP-07 → EP-08 → EP-09 → EP-10 → EP-H1…H15 (parallel where independent) → EP-FINAL.
