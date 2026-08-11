# QC Disaster Recovery Implementation Plan

> **For agentic workers:** Inline execution in this session. Steps use checkbox syntax for tracking.

**Goal:** Build verified, metadata-rich SQLite backup/restore for QC Task Manager.

**Architecture:** Extend `src/lib/backup.ts` with metadata, verification, retention configuration, and guarded restore. Keep HTTP admin operations metadata-only and use a confirmed maintenance-safe restore operation; use real temporary SQLite databases for tests.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, Node fs/crypto, existing QC auth/CSRF and script test harness.

---

### Task 1: Backup metadata and verification tests

**Files:** Modify `apps/qc-task-manager/scripts/test.mjs`; Modify `apps/qc-task-manager/src/lib/backup.ts`.

- [ ] Add failing assertions for metadata fields, PASS verification, corrupt backup, missing file, wrong schema, and count mismatch.
- [ ] Run `pnpm --filter @brightai/qc-task-manager test:domain`; confirm the new assertions fail because the APIs do not exist.
- [ ] Implement typed metadata and `verifyBackup()` using a read-only temporary SQLite connection, integrity/FK checks, schema version, checksum, and important counts.
- [ ] Re-run the focused test and then the full domain test.

### Task 2: Restore safety and retention

**Files:** Modify `apps/qc-task-manager/src/lib/backup.ts`; Modify `apps/qc-task-manager/scripts/backup-db.mjs`; Modify `apps/qc-task-manager/package.json`.

- [ ] Add failing restore tests for valid restore, failed verification, missing file, and failed restore preserving the production DB.
- [ ] Implement `restoreBackup()` with mandatory confirmation, pre-restore safety backup, temp-file copy, post-copy integrity/FK checks, and atomic rename; parse `QC_BACKUP_RETENTION` and `--keep=N`.
- [ ] Re-run restore and retention tests.

### Task 3: Admin verification surface

**Files:** Modify `apps/qc-task-manager/src/pages/admin/settings/index.astro`; Modify `apps/qc-task-manager/src/pages/api/admin/backup.ts`; Add `apps/qc-task-manager/src/pages/api/admin/backup/verify.ts` if needed.

- [ ] Add failing surface assertions for backup size, verification state, and manual action.
- [ ] Load latest metadata and verification result in Admin settings; expose a verify endpoint that never replaces production; keep manual backup CSRF/RBAC protected.
- [ ] Run the existing admin backup E2E and update it for PASS/FAIL behavior.

### Task 4: Documentation and project verification

**Files:** Add `docs/DISASTER-RECOVERY.md`; Modify `apps/qc-task-manager/README.md` if required; Modify `.agents/brain.md`.

- [ ] Document backup contents, retention, verification, restore safety, commands, failure modes, and required environment variable names only.
- [ ] Run QC tests, typecheck, build, E2E backup, and `git diff --check`.
- [ ] Record exact results and remaining environmental limits in the brain ledger.
