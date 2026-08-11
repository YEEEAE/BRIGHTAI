# QC Automated Tests and Acceptance Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the QC Task Manager's requested domain rules and user journeys repeatable through automated tests, then document an executable end-to-end acceptance checklist.

**Architecture:** Extend the existing server-less QC test harness for pure/domain assertions, add a child-process-safe auth test for database-backed lockout behavior, and add one orchestration script that runs the existing live-server E2E suites against isolated temporary SQLite databases. The checklist will map every acceptance criterion to a command or observable result.

**Tech Stack:** Node.js `node:test`-style scripts, TypeScript loaded by the repository test loader, Astro Node adapter, Playwright, SQLite via `better-sqlite3`, Markdown.

---

### Task 1: Complete the explicit unit/domain test coverage

**Files:**
- Modify: `apps/qc-task-manager/scripts/test.mjs`
- Create: `apps/qc-task-manager/scripts/test-auth-lockout.mjs`
- Modify: `apps/qc-task-manager/package.json`

- [ ] Add named assertions for every requested pure rule: role permissions, the employee editable-field whitelist, status transitions/read-only behavior, `isOverdue`, recurrence dates/window gating, dependency validation, upload/evidence validation, and notification creation/read ownership.
- [ ] Run `pnpm --filter @brightai/qc-task-manager test` and confirm the new assertions execute.
- [ ] Add a separate child-process test command for login lockout so `QC_DATABASE_PATH` is selected before the DB module is loaded; create a temporary database, apply the existing schema initializer, exercise five failed attempts, verify a correct password is rejected while locked, then verify expiry resets the counter.
- [ ] Run the lockout test directly and confirm it leaves no database artifacts.

### Task 2: Add one isolated E2E acceptance runner

**Files:**
- Create: `apps/qc-task-manager/scripts/e2e-acceptance.mjs`
- Modify: `apps/qc-task-manager/package.json`

- [ ] Build the QC app once, start the standalone server with an absolute temporary `QC_DATABASE_PATH`, and wait for `/login` to return HTTP 200.
- [ ] Run the existing admin-users, auth-lockout, task-shared, delete-request, dashboard, and backup suites in separate child processes with unique ports and databases so one scenario cannot contaminate another.
- [ ] Propagate child failures, terminate each server in `finally`, and remove only the runner-owned temporary directory.
- [ ] Add a documented `e2e:acceptance` script that runs the orchestrator.

### Task 3: Publish the acceptance checklist

**Files:**
- Create: `apps/qc-task-manager/docs/ACCEPTANCE-CHECKLIST.md`
- Modify: `apps/qc-task-manager/README.md`

- [ ] Add a preflight section for root install, DB generation, SQLTools browsing, independent QC startup, and existing BRIGHTAI app smoke verification.
- [ ] Add a role matrix covering all logins, employee dashboard denial, employee field locking/deletion denial, manager reopen, and attachment authorization.
- [ ] Add task lifecycle checks for create/assign/progress, evidence success/skip/rejection, mandatory comment, read-only completion, activity history, dependencies, recurrence, and overdue calculations.
- [ ] Add persistence/operations checks for upload survival after restart and valid SQLite backup integrity.
- [ ] For every row include the exact command, expected result, and a checkbox for a human acceptance run.
- [ ] Link the checklist from the README and document the single runner command.

### Task 4: Verify and record the result

**Files:**
- Modify: `.agents/brain.md`

- [ ] Run the focused QC unit suite, lockout suite, typecheck, build, and acceptance runner.
- [ ] Record exact pass/fail counts and any environment blockers; do not claim a blocked E2E suite as passing.
- [ ] Add a ledger entry naming all changed files and the final verification state.

