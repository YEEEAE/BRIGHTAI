# QC Workflow Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add safe requester withdrawal for pending laboratory change requests, make workflow-critical notifications transactionally durable, and provide notification category filters.

**Architecture:** Extend the existing `lab_change_requests` status constraint with one sequential migration, keep all state changes in `changeRequests.ts`, and use the existing `notifications` table. A strict notification writer will make persistence failures abort the surrounding SQLite transaction; external delivery remains outside this scope.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, SQLite migrations, Node assertion scripts.

---

### Task 1: Establish withdrawal and transactional notification contracts

**Files:**
- Create: `apps/qc-task-manager/db/migrations/038_lab_change_request_withdrawal.sql`
- Modify: `apps/qc-task-manager/src/lib/migrationRegistry.ts`
- Modify: `apps/qc-task-manager/src/lib/notifications.ts`
- Modify: `apps/qc-task-manager/src/lib/lab/changeRequests.ts`
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Test: `apps/qc-task-manager/scripts/test-lab-change-requests.mjs`

- [ ] Write failing assertions for `WITHDRAWN`, requester ownership, pending-only withdrawal, audit transition, no canonical row, pending counts, and strict notification persistence.
- [ ] Run `pnpm test:lab-change-requests` and confirm the new assertions fail because the status and operation do not exist.
- [ ] Add migration 038 rebuilding only the constrained request table while preserving rows/indexes and allowing `WITHDRAWN`; register it in the embedded registry.
- [ ] Add `withdrawChangeRequest(id, actor)` with a conditional `UPDATE ... WHERE requested_by=? AND status='PENDING'`, append `STATUS_TRANSITION` audit `PENDING` → `WITHDRAWN`, and never call canonical mutation code.
- [ ] Add a strict existing-table notification writer and use it for review-requested, approved, and rejected change-request notifications inside their existing transactions.
- [ ] Run the focused test again and then the migration/parity tests.

### Task 2: Add CSRF-protected withdrawal route and page action

**Files:**
- Create: `apps/qc-task-manager/src/pages/api/lab/change-requests/[id]/withdraw.ts`
- Modify: `apps/qc-task-manager/src/pages/lab/change-requests/[id].astro`
- Modify: `apps/qc-task-manager/src/pages/lab/change-requests/index.astro`
- Modify: `apps/qc-task-manager/scripts/test-lab-change-requests.mjs`

- [ ] Add failing route/source assertions for CSRF, signed-in user, requester-only action, and hidden actions for terminal/non-owner requests.
- [ ] Run the focused test and confirm the route/action assertions fail.
- [ ] Implement the POST route with `requireCsrf`, API authentication, positive ID parsing, and a redirect/JSON response matching the existing review route.
- [ ] Render a withdrawal form only for the owning requester while status is `PENDING`; show `WITHDRAWN` distinctly and leave approved/rejected terminal.
- [ ] Verify forged requests and missing/invalid CSRF cannot change state.

### Task 3: Add notification category filtering

**Files:**
- Modify: `apps/qc-task-manager/src/lib/notifications.ts`
- Modify: `apps/qc-task-manager/src/pages/notifications.astro`
- Modify: `apps/qc-task-manager/src/components/ui/notificationPresentation.ts`
- Modify: `apps/qc-task-manager/scripts/test-lab-notifications.mjs`

- [ ] Write failing assertions for All, Unread, Tasks, Tests, Documents, Change Requests, and existing Calibration/Equipment kinds, including counts and visibility.
- [ ] Run the focused notification test and confirm filter behavior is missing.
- [ ] Add an allow-listed category parser/query filter over existing notification kinds; do not add new notification kinds or tables.
- [ ] Render server-side filter links with active state and category counts while preserving shared `is_read` behavior.
- [ ] Run focused notification and UX/source-contract tests.

### Task 4: Full verification

- [ ] Run `pnpm test:lab-change-requests`, `pnpm test:lab-notifications`, `pnpm test:migrations`, and `pnpm test:embedded-migration-parity`.
- [ ] Run `pnpm typecheck`, `pnpm test`, `NODE_ENV=production pnpm build`, and `git diff --check`.
- [ ] Update `.agents/mind/01-mind-latest.md` with the structured task record and ledger entry; do not commit, push, or deploy.
