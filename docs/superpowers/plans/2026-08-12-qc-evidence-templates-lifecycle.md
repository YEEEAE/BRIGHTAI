# QC Evidence, Templates, and Lifecycle Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the QC evidence architecture so template snapshots drive a server-side completion gate, evidence metadata is preserved, and the task/template lifecycle flows are documented and tested.

**Architecture:** Keep pure evidence/template rules in `src/lib/evidence` and `src/lib/templates`, persistence in `taskUpdates.ts`/`templatesStore.ts`, and authorization in existing permission boundaries. Required evidence is evaluated against both the current close request and non-rejected evidence already persisted on the task, while template configuration remains frozen in `tasks.template_snapshot`.

**Tech Stack:** Astro SSR, React islands, TypeScript, SQLite/better-sqlite3, Node assertion scripts, pnpm.

---

### Task 1: Lock the evidence behavior with regression tests

**Files:**
- Modify: `apps/qc-task-manager/scripts/test-templates.mjs`

- [x] **Step 1: Add failing assertions** for evidence description persistence, MIME mismatch, oversized files, persisted evidence satisfying a reopened task, and unauthorized replacement/close.
- [x] **Step 2: Run the focused test** and confirm it fails for the missing metadata/persisted-evidence behavior.

### Task 2: Finish server-side evidence persistence and completion gate

**Files:**
- Modify: `apps/qc-task-manager/src/lib/taskUpdates.ts`
- Modify: `apps/qc-task-manager/src/lib/types.ts`
- Modify: `apps/qc-task-manager/src/lib/taskDetails.ts`

- [x] **Step 1: Persist requirement descriptions with SHA-256, size, MIME, source, collector, timestamp, and verification status.**
- [x] **Step 2: Include existing non-rejected evidence types in the completion calculation without weakening authorization or replacement rules.**
- [x] **Step 3: Expose the metadata through typed task-detail queries.**
- [x] **Step 4: Re-run the focused tests and confirm green.**

### Task 3: Align operational documentation and examples

**Files:**
- Modify: `apps/qc-task-manager/docs/ARCHITECTURE.md`
- Modify: `apps/qc-task-manager/docs/ROLES-AND-PERMISSIONS.md`
- Modify: `apps/qc-task-manager/docs/TESTING.md`
- Modify: `apps/qc-task-manager/README.md`

- [x] **Step 1: Document Evidence metadata/security/statuses, template lifecycle/snapshot semantics, and server-side completion gates.**
- [x] **Step 2: Document the five requested QC template examples and their evidence patterns.**
- [x] **Step 3: Document focused and full verification commands.**

### Task 4: Verify the delivery

- [x] **Step 1:** Run `pnpm --filter @brightai/qc-task-manager typecheck`.
- [x] **Step 2:** Run `pnpm --filter @brightai/qc-task-manager test`.
- [x] **Step 3:** Run `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build`.
- [x] **Step 4:** Run `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` and `git diff --check`.
- [x] **Step 5:** Update `.agents/brain.md` with the ledger entry and exact verification results.
