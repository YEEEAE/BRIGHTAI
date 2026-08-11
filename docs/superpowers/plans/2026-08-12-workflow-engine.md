# Workflow Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-authoritative workflow engine for QC tasks with immutable definition snapshots, explicit approvals/rejections, workload analytics, explainable assignment recommendations, and role-scoped privacy.

**Architecture:** Workflow definitions and ordered steps are versioned configuration. Creating a workflow instance copies the definition and steps into instance snapshot JSON, so later edits cannot change historical behavior. Task closure goes through the instance gate; normal tasks use `Employee → Completed`, while legacy tasks keep their existing lifecycle until a new instance is explicitly created. Workload and assignment recommendations are read-only services; accepting a recommendation remains an explicit supervisor/manager action.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, sequential SQLite migrations, existing RBAC/session/activity/SLA layers, Node assertion scripts.

---

### Task 1: Add workflow schema and domain types

**Files:**
- Create: `apps/qc-task-manager/db/migrations/005_workflow_engine.sql`
- Modify: `apps/qc-task-manager/db/schema.sql`
- Modify: `apps/qc-task-manager/src/lib/types.ts`
- Test: `apps/qc-task-manager/scripts/test-workflow.mjs`

- [ ] **Step 1: Write failing migration/type assertions**

Assert that the four required tables exist; each workflow step has `role`, `step_order`, `is_required`, `approval_type`, and `sla_seconds`; instances store `definition_snapshot`; actions store actor, previous state, reason, and timestamp; users have optional skills data.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `pnpm --filter @brightai/qc-task-manager test:workflow`

Expected: FAIL because migration 005 and the workflow tables do not exist.

- [ ] **Step 3: Add migration and mirrored reference schema**

Create `workflow_definitions`, `workflow_steps`, `workflow_instances`, and `workflow_actions` with foreign keys, version/status checks, unique step order, immutable snapshot text, rejection fields, and indexes. Add `users.skills_json` as nullable JSON text. Seed two definitions only when absent: normal `Employee → Completed` and critical `Employee → Supervisor Review → Manager Approval → Closed`.

- [ ] **Step 4: Add TypeScript contracts**

Define `WorkflowDefinition`, `WorkflowStep`, `WorkflowInstance`, `WorkflowAction`, `WorkloadSummary`, `AssignmentRecommendation`, and explicit workflow/approval/action status unions in `types.ts`.

- [ ] **Step 5: Run the focused test and confirm it passes**

Run: `pnpm --filter @brightai/qc-task-manager test:workflow`

Expected: migration and type contract assertions pass.

### Task 2: Implement immutable workflow instances and transition gates

**Files:**
- Create: `apps/qc-task-manager/src/lib/workflows/engine.ts`
- Modify: `apps/qc-task-manager/src/lib/workflows/index.ts`
- Test: `apps/qc-task-manager/scripts/test-workflow.mjs`

- [ ] **Step 1: Add failing behavior tests**

Cover: normal instance starts at employee step; critical instance requires supervisor approval before manager approval; rejection records `previous_state`, `reason`, `actor`, and `timestamp`, then returns to the configured previous step; editing a definition after instance creation does not alter instance snapshot; legacy tasks do not get an implicit instance.

- [ ] **Step 2: Run focused tests and verify the expected failures**

Run: `pnpm --filter @brightai/qc-task-manager test:workflow`

Expected: FAIL with missing engine exports.

- [ ] **Step 3: Implement the engine**

Provide `createWorkflowInstance`, `getWorkflowInstance`, `getCurrentWorkflowStep`, `canApproveWorkflowStep`, `approveWorkflowStep`, `rejectWorkflowStep`, `canCloseTaskWithWorkflow`, and `snapshotDefinition`. All writes run in a transaction, re-check server-side role/step ownership, append an action row, and never mutate historical snapshot data. Rejection must require a non-empty reason.

- [ ] **Step 4: Integrate closure without breaking legacy tasks**

Update the existing close boundary so a task with an instance can close only when the workflow says so; a task without an instance retains the current closure rules. Normal task creation creates the default normal instance, while callers that create legacy/imported tasks can opt out.

- [ ] **Step 5: Run focused and existing domain tests**

Run: `pnpm --filter @brightai/qc-task-manager test:workflow && pnpm --filter @brightai/qc-task-manager test:domain`

Expected: both commands pass with no regression in status/closure behavior.

### Task 3: Add workload analytics and explainable assignment recommendations

**Files:**
- Create: `apps/qc-task-manager/src/lib/workload.ts`
- Create: `apps/qc-task-manager/src/lib/assignment.ts`
- Modify: `apps/qc-task-manager/src/lib/tasks.ts`
- Test: `apps/qc-task-manager/scripts/test-workflow.mjs`

- [ ] **Step 1: Add failing pure/service tests**

Assert each employee summary exposes `active_tasks`, `overdue`, `at_risk`, `critical`, `on_hold`, `completion_rate`, `average_resolution_seconds`, and `workload_score`. Assert recommendation ranking uses workload, same department, skills, historical completion/SLA results, and SLA pressure. Assert exactly three active candidates are returned when available and each contains human-readable `whyRecommended` reasons.

- [ ] **Step 2: Verify focused test failure**

Run: `pnpm --filter @brightai/qc-task-manager test:workflow`

Expected: FAIL because workload and assignment modules are missing.

- [ ] **Step 3: Implement read-only workload queries**

Use parameterized SQL and the existing SLA engine fields. Calculate completion rate and average resolution from completed tasks, and calculate a deterministic bounded workload score from active count, overdue/critical/at-risk counts, on-hold count, and SLA consumption.

- [ ] **Step 4: Implement recommendation scoring**

Parse `users.skills_json` defensively; score only active employees. Return ranked candidates with factor scores and reasons such as `Low workload`, `Same department`, `Matching skills`, `Strong completion history`, and `No critical SLA`. Do not update `tasks.assigned_to` in this module.

- [ ] **Step 5: Integrate suggestions into task creation**

Expose a read-only `suggestTaskAssignees` call for the create form/API. Preserve explicit assignment input; if no assignee is selected, leave it null and show suggestions rather than assigning automatically.

- [ ] **Step 6: Run focused tests**

Run: `pnpm --filter @brightai/qc-task-manager test:workflow`

Expected: workload and recommendation tests pass.

### Task 4: Enforce privacy and document the feature

**Files:**
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Create: `apps/qc-task-manager/src/pages/manager/workload.astro`
- Create: `apps/qc-task-manager/src/pages/api/tasks/suggestions.ts`
- Modify: `apps/qc-task-manager/docs/ARCHITECTURE.md`
- Modify: `apps/qc-task-manager/docs/ROLES-AND-PERMISSIONS.md`
- Modify: `apps/qc-task-manager/docs/TESTING.md`

- [ ] **Step 1: Add failing authorization tests**

Assert an employee can read only their own workload and recommendations for their own task context, while supervisor/manager/admin can read team comparisons according to existing area permissions. Assert no employee response contains another employee's metrics.

- [ ] **Step 2: Implement server-side privacy gates and routes**

Add canonical permission helpers. Make `/manager/workload` team-comparison data available only to supervisor/manager/admin. Make the suggestions endpoint return the top three plus explanation, require an authenticated creator with assignment permission, and never mutate a task.

- [ ] **Step 3: Add concise documentation**

Document RBAC versus workflow, default/legacy behavior, rejection audit shape, snapshot rule, workload definitions, recommendation non-authority, and privacy boundaries.

- [ ] **Step 4: Run complete verification**

Run: `pnpm --filter @brightai/qc-task-manager test`, `pnpm --filter @brightai/qc-task-manager typecheck`, `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build`, `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs`, and `git -c core.fsmonitor=false diff --check`.

Expected: all commands exit successfully; any existing environment-only warning is reported separately.

### Self-review checklist

- [ ] Normal workflow is exactly `Employee → Completed`.
- [ ] Legacy tasks keep current lifecycle and are not retroactively reinterpreted.
- [ ] Critical path has employee, supervisor, and manager gates.
- [ ] Rejection persists previous state, reason, actor, and timestamp.
- [ ] Instance snapshot is independent from later definition edits.
- [ ] Workload exposes all eight requested metrics.
- [ ] Recommendations are top-three, explainable, and never auto-assigned.
- [ ] Employee privacy excludes peer comparison data.
- [ ] No secrets, commits, branches, pushes, or workflow-file changes are introduced.
