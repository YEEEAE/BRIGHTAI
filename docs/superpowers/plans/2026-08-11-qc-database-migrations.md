# QC Database Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hidden SQLite schema mutations with deterministic sequential migrations and prove safe fresh/existing/upgrade/retry behavior.

**Architecture:** A focused migration runner discovers numbered SQL files, records successful versions and failures, validates checksums/foreign keys/schema, and is called by both the application startup path and `db:init`. The first migration creates the current production schema; the second reconciles legacy databases without data loss.

**Tech Stack:** Astro SSR, TypeScript, Node.js ESM, better-sqlite3, SQLite transactions, SHA-256 checksums, Node test scripts.

---

### Task 1: Build the migration test harness and failing contract tests

**Files:**
- Create: `apps/qc-task-manager/src/lib/migrations.ts`
- Create: `apps/qc-task-manager/scripts/test-migrations.mjs`
- Modify: `apps/qc-task-manager/package.json`

- [ ] Write tests covering fresh DB, legacy upgrade, repeated run, data preservation, FK integrity, schema version, failure rollback/recovery, checksum drift, and destructive guard.
- [ ] Run `pnpm --filter @brightai/qc-task-manager test:migrations` and confirm it fails because the runner is not implemented.

### Task 2: Implement deterministic migration discovery and metadata

**Files:**
- Create: `apps/qc-task-manager/db/migrations/001_initial.sql`
- Create: `apps/qc-task-manager/db/migrations/002_legacy_schema_reconciliation.sql`
- Modify: `apps/qc-task-manager/src/lib/migrations.ts`

- [ ] Discover only `NNN_name.sql` files in sorted version order.
- [ ] Compute checksums from exact file bytes and reject duplicate/non-sequential versions.
- [ ] Create `schema_migrations` and `schema_migration_failures` metadata tables.
- [ ] Reject changed checksums for applied migrations.

### Task 3: Implement safe execution, backup, and validation

**Files:**
- Modify: `apps/qc-task-manager/src/lib/migrations.ts`
- Modify: `apps/qc-task-manager/src/lib/db.ts`
- Modify: `apps/qc-task-manager/scripts/init-db.mjs`

- [ ] Apply each migration in a transaction and record success only after commit.
- [ ] Record failures while preserving rollback state; retry un-applied versions on the next run.
- [ ] Reject destructive SQL unless the migration explicitly opts in and create a backup first.
- [ ] Run `PRAGMA foreign_key_check` and schema validation after migration.
- [ ] Make startup and `db:init` use the same runner.

### Task 4: Remove hidden schema drift paths and document operations

**Files:**
- Modify: `apps/qc-task-manager/db/schema.sql`
- Modify: `apps/qc-task-manager/docs/DATABASE.md`
- Create: `apps/qc-task-manager/docs/MIGRATIONS.md`

- [ ] Make migrations the authoritative history and keep schema.sql as a compatibility/reference artifact.
- [ ] Document commands, backup policy, failure recovery, checksum drift, and destructive migration review.

### Task 5: Verify and record evidence

**Files:**
- Modify: `.agents/brain.md`

- [ ] Run `pnpm typecheck`, `pnpm test`, and `pnpm build` from the repository root.
- [ ] Run migration tests explicitly and capture pass/fail counts.
- [ ] Review `git diff --check` and confirm no commit/push was performed.
- [ ] Update brain ledger with only verified results and any environmental blockers.
