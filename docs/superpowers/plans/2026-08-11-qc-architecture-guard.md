# QC Architecture Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended for inline work) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a deterministic static Architecture Guard and central domain boundaries for task policy, SLA, workflows, audit, AI, findings, and CAPA without giving UI or AI business authority.

**Architecture:** Preserve `src/lib/task-policy.ts` as the task-rule source of truth and `src/lib/permissions.ts` as the authorization source of truth. Add focused domain modules with server adapters at the edges, then scan the source/schema tree for duplicated authority and unsafe imports. Keep the guard dependency-free and run it through the existing package test command.

**Tech Stack:** Astro SSR, TypeScript, SQLite/better-sqlite3, existing Node ESM test scripts, no new dependencies.

---

### Task 1: Establish failing Architecture Guard checks

**Files:**
- Create: `apps/qc-task-manager/scripts/architecture-guard.mjs`
- Modify: `apps/qc-task-manager/scripts/test.mjs`
- Test: `apps/qc-task-manager/scripts/test.mjs`

- [ ] **Step 1: Add a test entry that expects the guard to detect current violations.**

Add a deterministic test helper in `scripts/test.mjs` that executes `architecture-guard.mjs` with `spawnSync`, asserts exit status `0` after the migration, and reports stdout/stderr on failure. Before implementation, temporarily assert the expected violation categories against the current tree so the test demonstrates the gap.

- [ ] **Step 2: Run the focused test and observe the intended failure.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: FAIL because `architecture-guard.mjs` does not exist or the guard reports the pre-migration authority violations.

- [ ] **Step 3: Implement the guard's scanner primitives.**

Implement dependency-free helpers for repository-relative file discovery, line-numbered text matches, import extraction, and structured failure output. The command must scan only the QC app source, scripts, and `db/schema.sql`; it must never execute application code or inspect runtime DB state.

- [ ] **Step 4: Run the focused test again.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: The guard runs and fails with actionable file/line/category evidence until the source migration is complete.

### Task 2: Consolidate policy and workflow ownership

**Files:**
- Create: `apps/qc-task-manager/src/lib/workflows/index.ts`
- Create: `apps/qc-task-manager/src/lib/sla/index.ts`
- Modify: `apps/qc-task-manager/src/lib/task-policy.ts`
- Modify: `apps/qc-task-manager/src/lib/taskUpdates.ts`
- Modify: `apps/qc-task-manager/src/lib/notifications.ts`
- Modify: `apps/qc-task-manager/src/lib/format.ts`
- Test: `apps/qc-task-manager/scripts/test.mjs`

- [ ] **Step 1: Add failing domain assertions for workflow and SLA ownership.**

Assert that workflow transition functions delegate to `task-policy.ts`, SLA calculations have one canonical implementation, and notifications/formatting consume the SLA result instead of recomputing overdue/due-soon logic.

- [ ] **Step 2: Run the focused domain tests.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: FAIL because the new canonical modules and ownership contracts are absent.

- [ ] **Step 3: Implement minimal workflow and SLA modules.**

Move only duplicated pure logic into focused modules. `workflows/index.ts` must expose task lifecycle transition predicates and terminal-state checks through the existing policy contract. `sla/index.ts` must expose the canonical due-date/overdue/due-soon calculations and preserve current outputs. Update callers to import these functions; retain compatibility re-exports only where needed.

- [ ] **Step 4: Run domain tests and verify no behavior regression.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: PASS with the existing status, overdue, recurrence, and notification assertions unchanged.

### Task 3: Define server-side audit and non-authoritative AI boundaries

**Files:**
- Create: `apps/qc-task-manager/src/lib/audit/index.ts`
- Create: `apps/qc-task-manager/src/lib/ai/index.ts`
- Create: `apps/qc-task-manager/src/lib/findings/index.ts`
- Create: `apps/qc-task-manager/src/lib/capa/index.ts`
- Modify: `apps/qc-task-manager/src/lib/activity.ts`
- Modify: `apps/qc-task-manager/src/lib/taskUpdates.ts`
- Modify: `apps/qc-task-manager/src/lib/validation.ts`
- Test: `apps/qc-task-manager/scripts/test.mjs`

- [ ] **Step 1: Add failing contract tests.**

Test that audit creation requires a server-resolved actor/task mutation context, AI exports contain suggestion-only functions and no task mutation imports, and findings/CAPA values use the canonical policy limits and classifications.

- [ ] **Step 2: Run the tests to confirm the contracts fail first.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: FAIL because the boundary modules do not yet exist.

- [ ] **Step 3: Implement the boundary modules.**

Create small typed interfaces. `audit/index.ts` wraps the existing server-side `logActivity` path. `ai/index.ts` exposes pure suggestion normalization only and imports no DB, permissions, task updates, or workflow mutation code. `findings/index.ts` and `capa/index.ts` expose pure validation/normalization functions and reuse `task-policy.ts` constants.

- [ ] **Step 4: Route accepted mutations through the audit boundary.**

Update task mutation code to use the audit boundary without changing event names or persistence behavior. Keep actor identity sourced from the session/user object, never from request body fields.

- [ ] **Step 5: Run the focused tests.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: PASS, including current activity-log assertions and new boundary assertions.

### Task 4: Complete the static Architecture Guard rules

**Files:**
- Modify: `apps/qc-task-manager/scripts/architecture-guard.mjs`
- Modify: `apps/qc-task-manager/scripts/test.mjs`
- Modify: `apps/qc-task-manager/package.json`

- [ ] **Step 1: Add failing fixture-based checks for forbidden boundaries.**

Add temporary in-memory fixture strings to the guard test for: UI importing `db.ts`, AI importing `taskUpdates.ts`, duplicated role arrays, duplicated field-lock arrays, and API code that mutates without policy/audit imports. Assert each fixture produces the named violation category.

- [ ] **Step 2: Run the guard tests and confirm fixture failures.**

Run: `pnpm --filter @brightai/qc-task-manager test:domain`

Expected: FAIL for each intentionally invalid fixture before the final rule implementation.

- [ ] **Step 3: Implement all production-tree checks.**

Add explicit canonical ownership maps and narrow compatibility allowlists. Check imports by file path and authority markers by line. Check schema text for task status/user role CHECK constraints and required task foreign-key references. Fail with a non-zero exit and stable category labels; pass silently except for a summary count.

- [ ] **Step 4: Add the guard to the package test pipeline.**

Add `test:architecture` and invoke it from `test` before domain and DB checks. Do not add a dependency or modify workflows.

- [ ] **Step 5: Run the complete QC test suite.**

Run: `pnpm --filter @brightai/qc-task-manager test`

Expected: all migration, architecture, domain, and DB-rule checks pass with zero failures.

### Task 5: Document the source-of-truth contract

**Files:**
- Create: `docs/SINGLE-SOURCE-OF-TRUTH.md`
- Modify: `apps/qc-task-manager/docs/ARCHITECTURE.md`
- Modify: `apps/qc-task-manager/SECURITY.md`

- [ ] **Step 1: Write the ownership matrix.**

Document each rule family — RBAC, task status, validation, field locking, SLA, workflows, audit, AI, findings, CAPA, and DB invariants — with its canonical module, allowed consumers, forbidden owners, and test command.

- [ ] **Step 2: Document request and trust flows.**

Describe UI → API → policy/validation → DB → audit, and explicitly state that UI is advisory, API is authoritative after server re-check, AI is suggestion-only, DB protects critical invariants, and audit is server-side.

- [ ] **Step 3: Document the Architecture Guard.**

Add the command, failure categories, compatibility allowlist policy, and release expectation to both architecture and security documentation.

- [ ] **Step 4: Check documentation links and Markdown hygiene.**

Run: `git diff --check`

Expected: no whitespace errors.

### Task 6: Verify the full change and update project brain

**Files:**
- Modify: `.agents/brain.md`

- [ ] **Step 1: Run fresh verification commands.**

Run:

```bash
pnpm --filter @brightai/qc-task-manager test
pnpm --filter @brightai/qc-task-manager typecheck
NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
node apps/qc-task-manager/scripts/verify-security-hygiene.mjs
git diff --check
```

Expected: each command exits 0. If a live E2E is attempted and blocked by the documented environment limitation, report it as blocked rather than passing it.

- [ ] **Step 2: Inspect the diff and changed-file scope.**

Run: `git diff --stat && git diff -- apps/qc-task-manager docs .agents/brain.md`

Expected: only Architecture Guard, domain-boundary, documentation, tests, package script, and brain ledger changes are present; no secrets, workflow changes, commits, branches, or pushes.

- [ ] **Step 3: Update the brain ledger with evidence.**

Add a dated entry describing the files changed, the source-of-truth decisions, exact verification results, and any remaining limitation. Do not claim production readiness beyond the checks actually run.
