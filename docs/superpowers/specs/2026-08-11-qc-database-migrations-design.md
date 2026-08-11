# QC Database Migration Architecture

## Goal

Make the application code, canonical SQLite schema, and every existing database converge through a deterministic, sequential migration history.

## Design

The migration source of truth is `apps/qc-task-manager/db/migrations/`. Each SQL file has a zero-padded numeric version and stable name, for example `001_initial.sql`. The runner discovers files from the filesystem, validates their names and strictly increasing versions, computes SHA-256 checksums, and applies them in order.

The database owns migration state in `schema_migrations`. A row is written only after the migration transaction succeeds and contains the version, name, checksum, and applied timestamp. A failed migration is recorded separately in `schema_migration_failures` with the version, name, checksum, error, and timestamp; the failed SQL transaction is rolled back, so a later startup can retry the same version after the cause is fixed. An applied migration whose file checksum changes is a hard startup error.

The runner enables SQLite foreign keys before applying migrations, checks `PRAGMA foreign_key_check` after each migration, and validates the final required schema before the application seeds or serves requests. It rejects destructive SQL patterns by default; a migration may opt in using a clear `-- brightai:allow-destructive` header, and dangerous migrations create a database backup before execution.

Fresh databases apply the complete ordered history. Existing databases are classified by the presence of the legacy schema and receive a deterministic reconciliation migration that adds missing columns/indexes and rebuilds the legacy delete-request table without dropping user/task data. The old runtime `ALTER TABLE` lists are removed from the application startup path so schema history is no longer hidden in TypeScript or `schema.sql`.

## Recovery and compatibility

Migrations are transaction-scoped. SQLite rollback restores the pre-migration data and schema for transactional DDL. A failure row remains as operational evidence. The runner does not advance the schema version on failure. Re-running after a fix retries the failed version, while already-applied versions are skipped and verified by checksum.

## Tests

The migration test suite uses temporary SQLite files and verifies fresh creation, existing legacy upgrade, repeated idempotent startup, data preservation, foreign-key integrity, version validation, checksum drift rejection, destructive SQL rejection, failure recording/rollback, and recovery after the failing migration is corrected.
