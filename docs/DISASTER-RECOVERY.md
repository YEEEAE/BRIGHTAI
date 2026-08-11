# QC Task Manager — Disaster Recovery

## What each backup contains

Backups are created with SQLite's online backup API, so committed pages in WAL are included in one consistent snapshot. Each `qc_tasks-YYYY-MM-DD-HHmmss.db` has a sidecar JSON file containing:

- SQLite schema version from `schema_migrations`
- Application version from `apps/qc-task-manager/package.json`
- ISO-8601 timestamp
- SHA-256 checksum of the final database file
- Important record counts (`users`, `tasks`, comments, attachments, and activity)

Backup files and metadata stay outside the public web root and are never downloadable through the application.

## Retention

The default is 14 database snapshots. Configure it with the environment variable `QC_BACKUP_RETENTION` (positive integer). The CLI supports a per-run override:

```bash
QC_DATABASE_PATH=/var/data/qc_tasks.db \
QC_BACKUP_DIR=/var/data/backups \
pnpm --filter @brightai/qc-task-manager db:backup -- --keep=30
```

The recommended production paths are `QC_DATABASE_PATH=/var/data/qc_tasks.db` and `QC_BACKUP_DIR=/var/data/backups` on persistent storage.

## Verification

Every newly created backup is verified before it is reported as successful. Verification opens the snapshot separately and runs:

1. `PRAGMA integrity_check`
2. `PRAGMA foreign_key_check`
3. Schema-version comparison
4. SHA-256 comparison with metadata
5. Important record-count comparison

The result is `PASS` or `FAIL`. A failed check is recorded in backup status and the snapshot must not be restored.

## Admin operation

Admins can open `/admin/settings` and see Last Backup, Backup Size, Backup Status, Last Verification, retention count, and the Manual Backup action. Manual Backup uses the same WAL-safe snapshot and verification path as the scheduler and CLI.

## Safe restore

Restore is a maintenance operation. It requires the exact confirmation string `RESTORE QC DATABASE`, a successful verification of the selected snapshot, and a safety backup of the current production database before replacement. The replacement is copied to a temporary file, checked again, and atomically renamed into place. If verification or the copy fails, the current production database is left untouched.

Before restoring in production:

1. Stop the QC application or place it in maintenance mode so no process holds the production SQLite connection.
2. Confirm the backup file and sidecar metadata are from the same snapshot directory.
3. Run the restore command from the application package with the exact confirmation string.
4. Start the service and run the normal smoke/login check.

The application does not expose a blind HTTP endpoint that replaces the live database. Admin HTTP actions create and verify backups only; production replacement must be an explicitly confirmed maintenance action.

## Failure modes

- Missing file: verification returns `FAIL`; no restore is attempted.
- Corrupt or non-SQLite file: `integrity_check`/open fails; production remains unchanged.
- Wrong schema or changed records: metadata comparison returns `FAIL`.
- Failed restore copy or post-copy check: temporary file is removed; the existing production file remains.
- Backup storage unavailable: status becomes `failure`; investigate persistent-disk capacity and permissions.

## Required configuration names

`QC_DATABASE_PATH`, `QC_BACKUP_DIR`, `QC_BACKUP_RETENTION`, `NODE_ENV`, and the existing authentication variables documented in the QC deployment guide.

## Test coverage

```bash
pnpm --filter @brightai/qc-task-manager test:domain
pnpm --filter @brightai/qc-task-manager test
```

The test suite uses temporary SQLite files and covers backup, WAL data, metadata, retention, valid restore, corrupt backup, missing file, wrong schema, and failed restore preservation.
