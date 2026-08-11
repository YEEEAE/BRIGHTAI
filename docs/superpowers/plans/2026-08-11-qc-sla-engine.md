# QC SLA Engine Implementation Plan

**Goal:** Add a server-authoritative, configurable SLA engine with pause behavior, dashboard metrics, in-app escalation, idempotent delivery, and regression coverage.

**Architecture:** Extend the existing sequential SQLite migration model with policy, task snapshot, escalation policy, and escalation event tables. Keep pure elapsed/status calculations in `src/lib/sla/index.ts`; keep database orchestration in `src/lib/sla/engine.ts`; invoke the engine at task lifecycle boundaries and dashboard reads. On Hold pauses only when the matched policy explicitly enables it; the default is continuing the SLA clock.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, SQLite migrations, existing in-app notifications and activity audit.

---

### Task 1: Add schema and shared SLA contracts

**Files:** `apps/qc-task-manager/db/migrations/003_sla_engine.sql`, `apps/qc-task-manager/db/schema.sql`, `apps/qc-task-manager/src/lib/db.ts`, `apps/qc-task-manager/src/lib/types.ts`

- [ ] Add `task_type` and SLA snapshot columns to `tasks`, plus `sla_policies`, `escalation_policies`, and `escalation_events` with foreign keys, checks, indexes, and unique idempotency keys.
- [ ] Add the migration to embedded startup migrations and required schema validation.
- [ ] Mirror the row contracts in TypeScript.

### Task 2: Implement pure SLA calculations and database engine

**Files:** `apps/qc-task-manager/src/lib/sla/index.ts`, `apps/qc-task-manager/src/lib/sla/engine.ts`, `apps/qc-task-manager/src/lib/notifications.ts`, `apps/qc-task-manager/src/lib/activity.ts`

- [ ] Implement server-time parsing, policy matching, snapshot creation, elapsed/remaining/percent/status calculation, and configurable pause-on-hold behavior.
- [ ] Implement task refresh, lifecycle initialization, pause/resume checkpointing, completion/reopen handling, and escalation processing.
- [ ] Seed the requested default policy and escalation thresholds without overwriting user configuration.
- [ ] Deliver only in-app notifications, record trigger rule/recipient/timestamp/delivery status, and make retries idempotent.

### Task 3: Wire task lifecycle and task creation

**Files:** `apps/qc-task-manager/src/lib/tasks.ts`, `apps/qc-task-manager/src/lib/taskUpdates.ts`

- [ ] Initialize SLA state on creation using server SQLite time and the selected matching policy.
- [ ] Refresh SLA state on status changes, completion, reopen, and recurring task creation.

### Task 4: Add dashboard SLA metrics

**Files:** `apps/qc-task-manager/src/lib/dashboard.ts`, `apps/qc-task-manager/src/pages/dashboard.astro`

- [ ] Add `SLA Compliance`, `At Risk`, `Critical`, `Breached`, `Average Resolution`, and `Average SLA Consumption` KPI data using current server time.
- [ ] Render the cards without changing existing filter semantics.

### Task 5: Test required temporal and delivery scenarios

**Files:** `apps/qc-task-manager/scripts/test-sla.mjs`, `apps/qc-task-manager/package.json`

- [ ] Add deterministic tests for timezone/server time, On Hold default and configured pause, reopen, complete, overdue, duplicate escalation, retry failure, and recovery.
- [ ] Run migration, architecture, domain, SLA, DB rules, typecheck, build, and diff checks; update the brain with exact results and remaining limits.
