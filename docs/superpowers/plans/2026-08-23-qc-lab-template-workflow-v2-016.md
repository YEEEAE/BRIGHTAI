# QC Lab Template Workflow V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give contributor-authored laboratory test-template versions an auditable DRAFT → IN_REVIEW → APPROVED lifecycle with immutable approved identity, e-signature approval, RBAC, supersession, and optimistic concurrency.

**Architecture:** Preserve the already-applied migration 034 and add the next sequential migration 035. Extend the existing template service and shared permission authority; reuse the existing e-signature verifier and shared `qc_audit_log`. Keep template identity status separate from version status, with ACTIVE derived from an approved current version.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, SQLite migrations, native Astro forms, shell-based database tests.

---

### Task 1: Extend schema and runtime metadata

**Files:**
- Create: `apps/qc-task-manager/db/migrations/035_lab_template_review_workflow.sql`
- Modify: `apps/qc-task-manager/db/schema.sql`
- Modify: `apps/qc-task-manager/src/lib/db.ts`
- Modify: `apps/qc-task-manager/src/lib/types.ts`

- [x] Add version status and lifecycle actor/timestamp columns with a CHECK constraint, preserving all existing rows and backfilling `approved_by IS NOT NULL` to `APPROVED`, otherwise `DRAFT`.
- [x] Register migration 035 in embedded migrations and update schema mirror/types.
- [x] Add migration assertions for fresh and upgrade databases.

### Task 2: Make template permissions authoritative

**Files:**
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`

- [x] Add create/edit/submit/review/approve predicates with author exclusion and exact role boundaries.
- [x] Ensure managers/admins cannot approve their own current version.

### Task 3: Implement service workflow and concurrency

**Files:**
- Modify: `apps/qc-task-manager/src/lib/lab/templates.ts`
- Modify: `apps/qc-task-manager/src/lib/lab/esignature.ts` only if shared constants need reuse

- [x] Create versions as DRAFT, submit own DRAFT as IN_REVIEW, record review metadata, and approve only IN_REVIEW versions.
- [x] Require e-signature at the HTTP approval boundary and preserve the existing password-verification system.
- [x] Supersede prior APPROVED versions transactionally and keep historical references intact.
- [x] Reject code/test_type changes after first approval and reject stale `updated_at` tokens with a conflict error.
- [x] Keep archived templates frozen and expose only approved current references.

### Task 4: Update Astro forms and pages

**Files:**
- Modify: `apps/qc-task-manager/src/components/lab/LabTemplateForm.astro`
- Modify: `apps/qc-task-manager/src/pages/lab/templates/[id].astro`
- Modify: `apps/qc-task-manager/src/pages/lab/templates/[id]/edit.astro`
- Modify: `apps/qc-task-manager/src/pages/lab/templates/index.astro` if status labels/filters require it

- [x] Add submit/review/approve controls, e-signature password input, version token, and clear lifecycle/status metadata.
- [x] Disable immutable code/test_type identity after first approval while preserving submitted values.
- [x] Show conflict and archived freeze messages without last-write-wins behavior.

### Task 5: Add focused regression coverage and verify

**Files:**
- Modify: `apps/qc-task-manager/scripts/test-lab-templates.mjs`
- Modify: `apps/qc-task-manager/scripts/test.mjs` or migration-specific test fixture as required

- [x] Cover employee, supervisor, manager, and admin permissions; self-approval; e-signature; supersede; concurrency; archive freeze; and approved reference selection.
- [x] Run focused tests, migration tests, typecheck, production build, and `git diff --check`.
- [x] Update `.agents/mind/01-mind-latest.md` with the final evidence and the migration-034 conflict decision.
