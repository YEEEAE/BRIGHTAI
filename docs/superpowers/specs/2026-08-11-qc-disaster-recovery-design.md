# QC Disaster Recovery Design

## Goal

Provide WAL-safe SQLite backups with portable metadata, independent verification, configurable retention, and a guarded restore path for the QC Task Manager.

## Design

`src/lib/backup.ts` remains the single backup service. A backup is created with SQLite's online backup API, normalized to a standalone database, hashed with SHA-256, and accompanied by JSON metadata containing schema version, application version, timestamp, checksum, and important record counts. Metadata is stored beside the database and is not served over HTTP.

Verification opens the backup in a temporary SQLite connection and runs `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, schema-version validation, checksum validation when metadata exists, and count comparisons. It returns a serializable `PASS`/`FAIL` result with checks and failure reasons.

Restore first verifies the selected backup, creates a safety backup of the current production database, copies the verified database to a temporary file in the production directory, runs post-copy integrity/FK checks, and atomically renames it into place. The HTTP admin action requires an explicit confirmation value and is disabled while the application connection is active; the CLI is the operational restore path after maintenance shutdown. No unverified file can replace production.

Retention is resolved from `QC_BACKUP_RETENTION`, with `--keep=N` as a CLI override and 14 as the default. Admin settings show last backup, size, status, last verification, retention, and a manual backup action.

## Acceptance

- Backup captures schema version, application version, timestamp, checksum, and counts.
- WAL-resident committed data is present in the backup.
- Verification returns PASS for a valid backup and FAIL for corrupt, missing, wrong-schema, or count-mismatched input.
- Restore refuses failed verification and protects the current production DB with a safety backup.
- Retention is configurable and deterministic.
- Tests cover backup, restore, corrupt backup, missing file, wrong schema, failed restore, and retention.
