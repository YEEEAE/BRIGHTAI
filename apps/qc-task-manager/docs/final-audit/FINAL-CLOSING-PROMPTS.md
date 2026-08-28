# FINAL CLOSING PROMPTS — QC-POST-IMPLEMENTATION-MASTER-AUDIT-022

Generated 2026-08-28 against HEAD `b51504b7`. Prompts address **only verified findings that exist NOW** (see POST-IMPLEMENTATION-REFERENCE-AUDIT.md §40). Execution order below. After all prompts: run `QC-FINAL-CLOSING-VERIFICATION`.

---

## PROMPT 1 of 6 — QC-CLOSING-E2E-GATE-RESTORE

"Re-verify every referenced finding against CURRENT HEAD before changing code. If the finding has already been resolved, do not reimplement it."

- **TASK ID:** QC-CLOSING-E2E-GATE-RESTORE
- **PRIORITY:** 1 (blocks the mandatory release gate)
- **FINDINGS ADDRESSED:** P1-001, P2-004
- **DEPENDENCIES:** none (do this first)
- **FILES/SYSTEMS TO INSPECT:** `scripts/e2e-lab-form.mjs` (lines ~120–180), `src/pages/lab/tests/new.astro:154` (ContextualHelp copy), `src/components/ui/ContextualHelp.astro`, `scripts/e2e-acceptance.mjs` (abort behavior at line ~148), all `scripts/e2e-*.mjs` that use bare `text=` locators.
- **EXACT OBJECTIVE:** Make `pnpm e2e:acceptance` reach final exit 0 with all 28 suites + 2 persistence phases, by fixing the test-side locator collision without weakening any assertion's intent and without changing product behavior.
- **IMPLEMENTATION REQUIREMENTS:**
  1. Replace `page.click('text=Save Draft')` with role-based locators, e.g. `page.getByRole('button', { name: 'Save Draft' })`, in every e2e script where a bare `text=` could match prose.
  2. Fix the sticky-action-bar assertion (`getByText('Submit for Review').count() === 1`) to count only actionable buttons: `page.getByRole('button', { name: 'Submit for Review' }).count()` (and equivalents for 'Save and Continue').
  3. Do NOT rewrite the help copy as the primary fix — the locator hardening is the durable contract; only adjust copy if a collision remains irreducible.
  4. Keep all other assertions byte-identical. No timeouts raised to mask slowness; no assertions deleted; no `skip`.
- **NON-GOALS:** product behavior changes, new features, copy rewrites beyond collision necessity.
- **PROJECT INVARIANTS:** no commit/push/deploy by the agent; no test weakening; English-only UI; controlled scientific values untouched.
- **TESTS TO ADD/UPDATE:** none new; the fixed suite itself is the regression guard. Optionally add a manifest-guard rule that fails on new bare `text=` button clicks in e2e scripts.
- **COMMANDS TO RUN:** `pnpm test:manifest` · `pnpm test:lab-form` · isolated `e2e-lab-form` under runner conditions · then full `pnpm e2e:acceptance` to completion.
- **ACCEPTANCE CRITERIA:** `pnpm e2e:acceptance` exit 0 with per-suite summary showing 28/28 suites + 2 persistence phases, zero failed assertions; recorded HEAD SHA + dirty status in the final summary.
- **ROLLBACK/RISK NOTES:** test-only change; revert is trivial. Risk: locator changes may reveal a real UI defect hidden by the crash — report any such finding, do not patch around it.
- **FINAL RESPONSE FORMAT:** per-command exit codes, suites passed/failed table, HEAD SHA, findings discovered (if any).

## PROMPT 2 of 6 — QC-CLOSING-SECURITY-HYGIENE

"Re-verify every referenced finding against CURRENT HEAD before changing code. If the finding has already been resolved, do not reopen it."

- **TASK ID:** QC-CLOSING-SECURITY-HYGIENE
- **PRIORITY:** 1
- **FINDINGS ADDRESSED:** P1-002, P2-003, P2-005, P2-006, P2-011, P3-013, P3-021
- **DEPENDENCIES:** none (parallel with Prompt 1)
- **FILES/SYSTEMS TO INSPECT:** repo-root `README.md:33` (EVAL_CERT_SIGNING_KEY_RING), `scripts/generate-eval-cert-key.mjs`, `scripts/seed-eval-cert-key.mjs`, `apps/qc-task-manager/.gitignore`, git index (tracked `qc_tasks.db`, `qc_tasks 3.db`), `src/lib/api-security.ts:122-150`, `src/lib/seed.ts:39-64`, `src/pages/login.astro:11,25`, `src/lib/session.ts:26-33`, `src/lib/redirect.ts`.
- **EXACT OBJECTIVE:** Remove committed key material (rotate), untrack DB artifacts, and add three defense-in-depth hardenings (body-size for chunked requests, prod guard independent of NODE_ENV, Secure-cookie policy) without breaking any existing flow.
- **IMPLEMENTATION REQUIREMENTS:**
  1. P1-002: replace the README PEM with a placeholder + instruction to generate locally; the OLD key must be treated as compromised — document required rotation wherever the eval key ring is consumed. Never print the key value in the report.
  2. P2-003: `git rm --cached "apps/qc-task-manager/qc_tasks.db" "apps/qc-task-manager/qc_tasks 3.db"`; extend `.gitignore` (`/*.db`, `/*.db-*` at app root). Do not delete user files from disk without confirmation.
  3. P2-005: enforce a real byte budget for bodies lacking `Content-Length` (stream/chunk accounting or `content-length`-independent cap) with same 413 contract.
  4. P2-006: introduce an explicit production signal (e.g. `QC_PROD=1` or host/bind check) OR'd with `NODE_ENV==='production'` for: seed refusal, boot admin123 refusal, login-hint suppression. Keep E2E fixture paths working.
  5. P2-011: make Secure-cookie behavior contract-tested (documented: Secure always in production deployments; explicit misconfiguration warning when session cookie would be issued without Secure and request is external).
  6. P3-013: use shared `safeRedirectTarget` on the login page instead of the inline weaker check.
  7. P3-021: report-only advice (file is untracked/user-level — recommend relocation + rotation; do not move user files yourself).
- **NON-GOALS:** no CSP changes, no new dependencies, no rate-limit architecture changes.
- **PROJECT INVARIANTS:** `test:request-security` architectural scan must stay green (or be extended to cover the new cap); secrets never printed; CSRF behavior unchanged for existing clients.
- **TESTS TO ADD/UPDATE:** chunked/no-Content-Length 413 case; prod-guard behavior when NODE_ENV unset but explicit prod signal set; redirect handling via shared helper; hygiene gate (verify-security-hygiene) now passes.
- **COMMANDS TO RUN:** `pnpm test:request-security` · `pnpm test:auth-password-lifecycle` · `node scripts/verify-security-hygiene.mjs` · `pnpm test` · `pnpm e2e:acceptance`.
- **ACCEPTANCE CRITERIA:** zero secret-like values tracked in repo (hygiene + scan PASS); `git ls-files` shows no app-root DB artifacts; all listed suites green; CSRF/E2E behavior unchanged.
- **ROLLBACK/RISK NOTES:** rotation is external to repo (document it); `.gitignore` change is additive; body-cap change must not break multipart uploads ≤10MB (attachment suite covers).
- **FINAL RESPONSE FORMAT:** per-finding closure evidence (file:line before/after), suite results, hygiene gate output.

## PROMPT 3 of 6 — QC-CLOSING-FORM-UX-CONSISTENCY

"Re-verify every referenced finding against CURRENT HEAD before changing code. If the finding has already been resolved, do not reimplement it."

- **TASK ID:** QC-CLOSING-FORM-UX-CONSISTENCY
- **PRIORITY:** 2
- **FINDINGS ADDRESSED:** P2-007, P2-009, P3-019, P3-020
- **DEPENDENCIES:** after Prompt 1 (so E2E can verify).
- **FILES/SYSTEMS TO INSPECT:** `src/pages/lab/change-requests/new.astro:35`, `src/pages/lab/retests/new.astro:94`, `public/scripts/form-productivity.js`, the 35 non-lab pages hand-rolling headers (admin/*, dashboard, search, manager|supervisor|employee/new, manager/requests, account/security), `src/components/ui/PageHeader.astro`, `src/components/ui/StatusPill.astro` + `findings/[id].astro:19`, `src/components/Navbar.tsx:397`, notifications empty state.
- **EXACT OBJECTIVE:** Bring the remaining surfaces to the established design-system contract: double-submit protection on the 2 lab forms, PageHeader on non-lab pages, StatusPill adoption where badges are hand-rolled, remove emoji from enterprise copy, and extend ContextualHelp to the heavy approval surfaces.
- **IMPLEMENTATION REQUIREMENTS:**
  1. Add `data-qc-form` to the 2 forms; verify the shared handler covers their validation-summary needs.
  2. Convert the 35 headers to PageHeader preserving exact titles/descriptions/actions; identity-block detail pages remain exempt per guard documentation.
  3. Replace hand-rolled severity pill in `findings/[id].astro` with StatusPill/statusTones (no visual regression beyond tone-source).
  4. Remove 🎉 from Navbar/notifications (keep friendly wording, no emoji).
  5. Add ContextualHelp to `lab/tests/[id]` (review/approve states), equipment and calibration editors — short, factual, no invented policy.
- **NON-GOALS:** no permission/logic changes; no new dependencies; no redesign of exempt identity blocks; no Arabic in UI.
- **PROJECT INVARIANTS:** `test:ui-consistency` (164 checks) must pass and be EXTENDED to lock the new conversions (non-lab PageHeader rule, emoji ban rule, data-qc-form presence rule).
- **TESTS TO ADD/UPDATE:** extend `test:ui-consistency` with the three new rules; `test:lab-ux-presentation` extended for new help blocks.
- **COMMANDS TO RUN:** `pnpm test:ui-consistency` · `pnpm test:lab-ux-presentation` · `pnpm typecheck` · `pnpm build` · `pnpm test` · `pnpm e2e:acceptance`.
- **ACCEPTANCE CRITERIA:** all suites green; visual parity of converted pages (same title/text/actions); guard rules prove persistence.
- **ROLLBACK/RISK NOTES:** markup-neutral conversions; keep old classes only where guard documents exemptions.
- **FINAL RESPONSE FORMAT:** list of converted files, guard-check counts before/after, suite results.

## PROMPT 4 of 6 — QC-CLOSING-DOCS-SCHEMA-DEADCODE

"Re-verify every referenced finding against CURRENT HEAD before changing code. If the finding has already been resolved, do not reimplement it."

- **TASK ID:** QC-CLOSING-DOCS-SCHEMA-DEADCODE
- **PRIORITY:** 3
- **FINDINGS ADDRESSED:** P2-008, P3-012, P3-016, P3-017, P3-018 (decision documentation), P3-022 (operator note)
- **DEPENDENCIES:** none.
- **FILES/SYSTEMS TO INSPECT:** `db/schema.sql`, `src/lib/db.ts` / `src/lib/migrationRegistry.ts` (index truth), `src/pages/api/tasks/suggestions.ts`, `src/middleware.ts` (comment at /login branch), `astro.config.mjs:20-22`, `docs/UI-DESIGN-SYSTEM.md`, `scripts/test-report-pdf-arabic.mjs`, `docs/DATABASE.md` (backup-retention note).
- **EXACT OBJECTIVE:** Make the documentation mirrors truthful and remove/justify dead code, with zero behavior change.
- **IMPLEMENTATION REQUIREMENTS:**
  1. Regenerate/sync `db/schema.sql` from migrations truth (add `ai_audit_log`, 6 missing indexes, resolve `idx_tasks_template`) OR clearly mark schema.sql as advisory and add a parity guard test so the mirror can never silently drift again.
  2. Remove dead `GET /api/tasks/suggestions` after double-confirming zero references (update route-manifest expectations + counts in tests).
  3. Correct the misleading middleware comment (state explicitly that Astro `checkOrigin` is disabled and CSRF is enforced by `requireCsrf`).
  4. Extend `docs/UI-DESIGN-SYSTEM.md` with the canonical-final section (notificationPresentation/NotificationCard, formPresets, labBadgeClasses, LabActionButton=wrapper, PageHeader-on-lab rule).
  5. Add a documented decision block for P3-018 (PDF writer contract: reverse vs mark-positioning) — decision to be made by QC management; do not implement the fix in this prompt.
  6. Add an operator note (docs) about `db/backups` retention sizing (P3-022) — no deletion of existing backups.
- **NON-GOALS:** no migration content changes, no schema behavior changes, no PDF-writer rewrite.
- **PROJECT INVARIANTS:** `test:migrations`, `test:embedded-migration-parity`, `test:route-manifest`, `test:db-doctor` all stay green with corrected counts.
- **TESTS TO ADD/UPDATE:** schema-parity guard (if option 1 chosen); route-manifest count updates.
- **COMMANDS TO RUN:** `pnpm test:migrations` · `pnpm test:embedded-migration-parity` · `pnpm test:route-manifest` · `pnpm test:db-doctor` · `pnpm test` · `pnpm build`.
- **ACCEPTANCE CRITERIA:** mirror either byte-consistent or guarded; dead route gone with green manifests; docs updated; zero behavior deltas.
- **ROLLBACK/RISK NOTES:** removing an API route is the only behavioral change — confirm zero references again at execution time.
- **FINAL RESPONSE FORMAT:** diff summary per file, gate outputs, explicit statement of which schema-sync option was taken.

## PROMPT 5 of 6 — QC-CLOSING-A11Y-COVERAGE-EXPANSION

"Re-verify every referenced finding against CURRENT HEAD before changing code. If the finding has already been resolved, do not reimplement it."

- **TASK ID:** QC-CLOSING-A11Y-COVERAGE-EXPANSION
- **PRIORITY:** 3
- **FINDINGS ADDRESSED:** P2-010
- **DEPENDENCIES:** after Prompt 3 (page changes could alter axe results).
- **FILES/SYSTEMS TO INSPECT:** `scripts/e2e-a11y.mjs` (SCAN_PAGES), unscanned high-traffic pages: `/findings`, `/search`, `/notifications`, `/admin/users`, `/admin/system-health`, `/lab/management`, `/lab/data-quality`, `/lab/audit`, `/lab/calendar`.
- **EXACT OBJECTIVE:** Expand the blocking axe gate from 12 to ~20+ representative pages (all roles), keeping Critical=0/Serious=0 as the pass bar, and fix any newly-surfaced violations at the component level.
- **IMPLEMENTATION REQUIREMENTS:** add pages with proper fixtures + auth; same rule set (no axe rules disabled); fix violations in shared components first; keep the report artifact contract (`download/qa/a11y-qc-report.json`).
- **NON-GOALS:** no print/PDF pages; no axe-rule relaxation; no new a11y dependencies.
- **PROJECT INVARIANTS:** the gate must remain FAIL-closed; fixtures deterministic with cleanup.
- **TESTS TO ADD/UPDATE:** the expanded scan itself; structural checks apply to new pages automatically.
- **COMMANDS TO RUN:** isolated `e2e-a11y` · `pnpm e2e:acceptance`.
- **ACCEPTANCE CRITERIA:** expanded scan green (Critical=0/Serious=0 across all scanned pages) inside a full acceptance run.
- **ROLLBACK/RISK NOTES:** new fixtures follow the existing idempotent pattern; any violation found indicates real debt — fix, don't deselect pages.
- **FINAL RESPONSE FORMAT:** scanned-page list with violation counts, fixes applied, final gate summary.

## PROMPT 6 of 6 — QC-FINAL-CLOSING-VERIFICATION

"Re-verify every referenced finding against CURRENT HEAD before changing code. If the finding has already been resolved, do not reimplement it."

- **TASK ID:** QC-FINAL-CLOSING-VERIFICATION
- **PRIORITY:** FINAL (must be last)
- **FINDINGS ADDRESSED:** verification closure for P1-001, P1-002, P2-003, P2-004, P2-005, P2-006, P2-007, P2-008, P2-009, P2-010, P2-011 + confirmation that P3 items are either closed or explicitly deferred with documentation.
- **DEPENDENCIES:** Prompts 1–5 complete.
- **EXACT OBJECTIVE:** Independent re-audit of the exact finding IDs above and a full mandatory-gate sweep; output GO / CONDITIONAL GO / NO-GO with evidence.
- **SCOPE (all mandatory):**
  1. Re-verify each finding ID against CURRENT HEAD (source evidence + targeted re-run).
  2. `pnpm typecheck` · `pnpm test:manifest` · `pnpm test:route-manifest` · `pnpm test:embedded-migration-parity` · `pnpm test:migrations` · `pnpm test` (full) · `NODE_ENV=production pnpm build` · `pnpm e2e:acceptance` (full, to final exit).
  3. Disposable-DB: fresh init → db:status (integrity/FK/parity) → backup → mutate → restore → restart → audit chains.
  4. RBAC: all four roles × core task workflow × core Lab workflow (approve/reject/withdraw paths) via E2E evidence in the acceptance run.
  5. Reports: at least one CSV/XLSX/PDF per class executed in-run with Content-Type/filename/audit assertions.
  6. Accessibility: expanded gate Critical=0/Serious=0. 7. Responsive suite executed.
  8. Deployment contract: consistent docs vs code; state explicitly whether LIVE VERIFIED or NOT LIVE VERIFIED.
  9. Human UAT: state HUMAN UAT: VERIFIED (with artifact) or NOT VERIFIED.
  10. Hygiene: `node scripts/verify-security-hygiene.mjs` + secret scan exit 0.
- **ACCEPTANCE CRITERIA (GO requires ALL):** no P0; no pilot-blocking P1; all gates exit 0; DB integrity/FK PASS; audit chains PASS; backup/restore PASS; RBAC PASS; core workflows PASS; reports PASS; axe Critical=0/Serious=0; deployment contract consistent; no exposed/default production credential; UAT results exist (for GO — otherwise CONDITIONAL GO with UAT as the only open condition).
- **NON-GOALS:** no code changes in this prompt (verification only) — defects found go back to a scoped prompt.
- **FINAL RESPONSE FORMAT:** per-finding closure table, per-gate exit codes, then exactly one of: `GO` / `CONDITIONAL GO (conditions: …)` / `NO-GO (blocking: …)`.
