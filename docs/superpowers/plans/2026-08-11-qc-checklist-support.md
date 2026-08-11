# QC Checklist Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing QC Task Manager checklist foundation with reordering, completion gating, manager/admin overrides, full audit history, nullable QC metadata, and progress visibility in task rows and the dashboard.

**Architecture:** Keep checklist mutations in `applyTaskUpdate`/a focused checklist service and enforce authorization server-side through existing role/field-lock helpers. Add nullable task metadata columns through the existing startup migration path. Derive progress from checklist rows for task details, list views, and dashboard queries; completion remains atomic and accepts an explicit manager/admin override reason when incomplete items remain.

**Tech Stack:** Astro, React islands, TypeScript, SQLite/better-sqlite3, Vitest-style `scripts/test.mjs`, Playwright E2E scripts.

---

### Task 1: Define schema/types/migration contract

**Files:**
- Modify: `apps/qc-task-manager/db/schema.sql`
- Modify: `apps/qc-task-manager/src/lib/db.ts`
- Modify: `apps/qc-task-manager/src/lib/types.ts`
- Modify: `apps/qc-task-manager/src/lib/task-policy.ts`
- Test: `apps/qc-task-manager/scripts/test.mjs`

- [ ] Add nullable `inspection_type`, `finding_classification`, `risk_level`, `corrective_action_required`, `reference_number`, and `audit_batch_or_work_order` columns to `tasks` and add idempotent column migrations.
- [ ] Add checklist reorder/override constants and a typed `ChecklistProgress`/metadata shape.
- [ ] Add failing tests proving an old database boots unchanged and a new database exposes nullable metadata.
- [ ] Run the focused test and confirm RED, implement the migration/types, then confirm GREEN.

### Task 2: Implement checklist domain operations and completion gate

**Files:**
- Modify: `apps/qc-task-manager/src/lib/taskUpdates.ts`
- Modify: `apps/qc-task-manager/src/lib/activity.ts`
- Modify: `apps/qc-task-manager/src/lib/taskDetails.ts`
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Modify: `apps/qc-task-manager/src/pages/api/tasks/[id]/close.ts`
- Test: `apps/qc-task-manager/scripts/test.mjs`

- [ ] Add reorder operation using a validated ordered id list; supervisors may reorder only tasks they own/supervise, managers/admins may reorder all visible tasks, employees may only toggle when permitted.
- [ ] Add checklist progress calculation (`total`, `completed`, `percent`, `incomplete`) and activity entries for add/remove/toggle/reorder/override.
- [ ] Add nullable metadata validation and update handling with the existing field-lock rules.
- [ ] Gate `closeTask`: incomplete items reject employees/supervisors; manager/admin can continue only with a bounded explicit reason, recorded in activity.
- [ ] Write failing unit tests for reorder authorization, completion rejection, override acceptance/audit, and metadata round-trip; run RED then implement and run GREEN.

### Task 3: Build task-details checklist editor and metadata panel

**Files:**
- Modify: `apps/qc-task-manager/src/components/TaskUpdatePanel.tsx`
- Modify: `apps/qc-task-manager/src/pages/tasks/[id].astro`
- Create/modify: `apps/qc-task-manager/src/components/TaskChecklistEditor.tsx` (if separation keeps the island focused)
- Test: `apps/qc-task-manager/scripts/e2e-checklist.mjs`

- [ ] Show checklist progress percentage and completed/total count for every viewer.
- [ ] Add accessible move-up/move-down controls for supervisors/managers/admins and keep checkbox toggles available only when permitted.
- [ ] Add nullable QC metadata fields to the locked details form; existing tasks render blank values without forcing input.
- [ ] Add completion override reason input for manager/admin when incomplete items are present and surface the server error for everyone else.
- [ ] Add Playwright checks for reorder, progress refresh, metadata save, and completion gate/override.

### Task 4: Surface checklist progress in rows and dashboard

**Files:**
- Modify: `apps/qc-task-manager/src/lib/tasks.ts`
- Modify: `apps/qc-task-manager/src/lib/dashboard.ts`
- Modify: `apps/qc-task-manager/src/pages/employee/index.astro`
- Modify: `apps/qc-task-manager/src/pages/manager/index.astro`
- Modify: `apps/qc-task-manager/src/pages/supervisor/index.astro`
- Modify: `apps/qc-task-manager/src/pages/dashboard.astro`
- Test: `apps/qc-task-manager/scripts/e2e-checklist.mjs`

- [ ] Join/derive checklist progress in task list rows with zero-item behavior documented as 0% (or `—` where appropriate).
- [ ] Add dashboard KPI/chart/table progress data without changing existing filters or employee access gates.
- [ ] Verify responsive rendering at 390px and 1440px and ensure no horizontal overflow.

### Task 5: Regression verification and documentation

**Files:**
- Modify: `apps/qc-task-manager/README.md`
- Modify: `.agents/brain.md`
- Test: `apps/qc-task-manager/scripts/e2e-checklist.mjs`

- [ ] Run `pnpm typecheck`, `pnpm build`, existing unit tests, checklist E2E, and relevant dashboard/task E2E regressions.
- [ ] Record migration safety, authorization decisions, and verification results in the README and brain ledger.
- [ ] Leave changes uncommitted for the user.
