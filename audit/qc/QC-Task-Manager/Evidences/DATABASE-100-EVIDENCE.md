# DATABASE-100 Evidence — QC-100-DATABASE-003

Date: 2026-09-02 (Asia/Riyadh)

## Scope and safety

- Scope: `apps/qc-task-manager` SQLite database, migrations, embedded migration bundle, initialization, doctor, integrity constraints, backup, restore, and retention.
- Every database opened by the consolidated gate is created under an OS temporary directory and removed in `finally` cleanup.
- No production database was opened, modified, restored, or used as a source.
- This document does not claim live production restore evidence. Live/staging operator evidence remains outside this local gate.

## Automated result

Command executed:

```text
node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-database-100.mjs
```

Result: **DATABASE-100: PASS (23 checks)**

The equivalent package entry point is `pnpm test:database-100`. The direct Node invocation was used for this run because the local runner could not download Corepack's pnpm package from npm; this was an environment limitation, not a product failure.

## Mandatory validation matrix

| Requirement | Evidence | Result |
|---|---|---|
| Fresh initialization | Fresh nested temp path initialized by `scripts/init-db.mjs` | PASS |
| Migration 001 → latest | `scripts/test-migrations.mjs`; 39 migrations applied | PASS |
| Migration checksum parity | `scripts/test-migrations.mjs` drift checks; embedded SHA-256 parity | PASS |
| Embedded migration parity | `scripts/test-embedded-migration-parity.mjs`; **39/39 byte-identical** | PASS |
| Schema-reference parity | `scripts/test-schema-reference.mjs`; **165 objects** | PASS |
| Foreign-key integrity | Fresh and restored `PRAGMA foreign_key_check` return `[]` | PASS |
| SQLite integrity check | Fresh and restored `PRAGMA integrity_check` return `ok` | PASS |
| WAL configuration | `journal_mode=wal`, `foreign_keys=1`, `busy_timeout=5000`, `synchronous=NORMAL` | PASS |
| Transaction rollback | Intentional exception leaves transaction sentinel absent | PASS |
| Duplicate prevention | Duplicate `users.username` rejected by UNIQUE constraint | PASS |
| Invalid state prevention | Invalid task status rejected by CHECK constraint | PASS |
| Downgrade/failure behavior | Migration failure rollback, failure ledger, checksum drift, and destructive SQL guard | PASS |
| Restart persistence | Existing isolated production-operations drill | PASS |
| Backup creation | Online SQLite backup creates a timestamped snapshot and metadata | PASS |
| Backup validation | Backup checksum, metadata counts, schema version, integrity, and FK validation | PASS |
| Restore into clean environment | Verified backup copied into a new isolated DB path | PASS |
| Restored DB integrity | Restored `PRAGMA integrity_check = ok` | PASS |
| Restored DB FK check | Restored `PRAGMA foreign_key_check = []` | PASS |
| Restored schema version | Restored `schema_migrations` max version = **39** | PASS |
| Critical record equality | Restore marker row matched before/after restore | PASS |

Additional gates in the run covered retention behavior, DB doctor diagnostics, and the operational backup/restore/restart drill.

## Index audit

The audit compared all index definitions in `db/schema.sql` against the startup contract in `src/lib/db.ts` and found **106/106** covered indexes. The audit used the observed prepared-query paths in `src/` and `scripts/` as the query inventory; no speculative index was added.

The audit found seven existing indexes that were not previously enforced by startup validation:

- `idx_attachments_evidence_type`
- `idx_login_attempts_ip_failure`
- `idx_qc_audit_user_actor_time`
- `idx_report_audit_actor_time`
- `idx_report_audit_type_time`
- `idx_task_templates_department`
- `idx_task_templates_status`

They are now included in the required-index contract. Schema and migration SQL were not changed because all seven indexes already existed and schema-reference parity was already exact.

## Files changed

- `src/lib/db.ts` — startup validation now covers all 106 schema indexes.
- `scripts/test-database-100.mjs` — isolated consolidated evidence gate.
- `package.json` — `test:database-100` script.
- `DATABASE-100-EVIDENCE.md` — this evidence record.

## Verification notes

- Existing migration, embedded parity, schema-reference, DB doctor, DB rules, retention, and production-operations suites all passed inside the isolated gate.
- No commit, push, deployment, or production mutation was performed.
- The evidence is local automated evidence only; it is not a substitute for PROMPT 14 live restore evidence.
