# QC Task Manager Security Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce server-side authentication, authorization, validation and safe file handling throughout the QC Task Manager.

**Architecture:** Centralize security invariants in focused helpers: API authentication/CSRF, task visibility, and safe uploads. Route handlers call those helpers before performing prepared database queries. A security regression script tests the complete HTTP boundary; repository hygiene checks protect releases.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3 prepared statements, Zod, bcryptjs, Playwright/API requests.

---

### Task 1: Map and lock the API boundary

**Files:**
- Create: `apps/qc-task-manager/src/lib/api-security.ts`
- Modify: `apps/qc-task-manager/src/lib/session.ts`
- Test: `apps/qc-task-manager/scripts/e2e-security.mjs`

- [ ] Write failing tests for an anonymous API request, cross-origin state change, and malformed route identifier.
- [ ] Run the security script and confirm each assertion fails against the baseline.
- [ ] Implement `requireApiUser`, `requireCsrf`, and Zod route-id parsing; return only 401/403/400 safe responses.
- [ ] Run the script and confirm the boundary assertions pass.

### Task 2: Authorize every task and attachment operation

**Files:**
- Create: `apps/qc-task-manager/src/lib/task-access.ts`
- Modify: `apps/qc-task-manager/src/pages/api/tasks/[id]/**/*.ts`
- Test: `apps/qc-task-manager/scripts/e2e-security.mjs`

- [ ] Write failing IDOR tests: an employee accesses, mutates, downloads, comments on, or requests deletion for another employee's task.
- [ ] Run the tests and confirm the baseline permits or mishandles at least one path.
- [ ] Implement a prepared-query task loader and attachment ownership loader that use the existing role policy.
- [ ] Replace direct task/attachment lookups in every task API route with the shared access helper.
- [ ] Run tests and confirm every cross-user request receives 403 or 404 without a data leak.

### Task 3: Harden uploads and filename output

**Files:**
- Modify: `apps/qc-task-manager/src/lib/taskUpdates.ts`
- Modify: `apps/qc-task-manager/src/pages/api/tasks/[id]/attachments/index.ts`
- Modify: `apps/qc-task-manager/src/pages/api/tasks/[id]/attachments/[attachmentId].ts`
- Test: `apps/qc-task-manager/scripts/e2e-security.mjs`

- [ ] Write failing tests for traversal filenames, unsafe extensions/MIME pairs, invalid magic bytes, and over-limit uploads.
- [ ] Run the tests and observe failures before implementation.
- [ ] Reject byte length over the configured limit before BLOB construction/insertion; sanitize stored/displayed names and generate safe download headers.
- [ ] Use the extension/MIME/signature allowlists without accepting unknown aliases.
- [ ] Re-run the tests and confirm rejected input creates no attachment row.

### Task 4: Complete authentication defenses

**Files:**
- Modify: `apps/qc-task-manager/src/lib/auth.ts`
- Modify: `apps/qc-task-manager/src/lib/session.ts`
- Modify: `apps/qc-task-manager/src/pages/login.astro`
- Modify: `apps/qc-task-manager/db/schema.sql`
- Test: `apps/qc-task-manager/scripts/e2e-security.mjs`

- [ ] Write failing tests for disabled/locked/unknown login message equality, an IP rate limit, server session invalidation at logout, and production cookie attributes.
- [ ] Run the test to confirm baseline behavior differs.
- [ ] Add persistent prepared-statement-backed IP rate limiting, preserve generic external errors, and invalidate all required server-side state.
- [ ] Re-run authentication tests and existing lockout tests.

### Task 5: Security headers, logging and repository hygiene

**Files:**
- Modify: `apps/qc-task-manager/src/middleware.ts`
- Create: `apps/qc-task-manager/scripts/verify-security-hygiene.mjs`
- Create: `apps/qc-task-manager/SECURITY.md`
- Modify: `.gitignore`
- Test: `apps/qc-task-manager/scripts/e2e-security.mjs`

- [ ] Write header and hygiene checks that initially fail for absent CSP, tracked database files, secrets, or unsafe logs.
- [ ] Add CSP compatible with current Astro assets, required headers, a token/password/file-content log scan, and database/secret tracked-file checks.
- [ ] Write `SECURITY.md` with assets, adversaries, trust boundaries, controls, reporting, secret rotation, TLS/proxy/header/database requirements, backup encryption and update cadence.
- [ ] Run the security script and hygiene script to green.

### Task 6: Full regression and documentation

**Files:**
- Modify: `.agents/brain.md`

- [ ] Run typecheck, unit tests, build, security test, existing auth E2E and relevant task E2E.
- [ ] Resolve any regression at its root cause.
- [ ] Add the verified result, exceptions and affected files to the brain ledger.
- [ ] Confirm `git diff` contains no production database, secret or unrelated `audit/qc/prompt2.md` changes.
