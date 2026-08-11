# Restoring `qc_tasks.db`

Restore only during a planned maintenance window. Stop the QC server first so no process holds an open SQLite connection.

The supported restore command verifies the snapshot, creates a safety backup of the current database, validates a temporary copy, and atomically replaces the production file:

```bash
QC_DATABASE_PATH=/absolute/path/qc_tasks.db \
QC_BACKUP_DIR=/absolute/path/backups \
pnpm --filter @brightai/qc-task-manager db:restore -- \
  --backup=/absolute/path/backups/qc_tasks-YYYY-MM-DD-HHmmss.db \
  --confirm="RESTORE QC DATABASE"
```

The command refuses missing, corrupt, wrong-schema, checksum-mismatched, or count-mismatched backups. It never replaces production without the exact confirmation string. Do not manually copy a `.db` file over production and do not reuse old `-wal`/`-shm` sidecars.

See the repository-level [Disaster Recovery runbook](../../docs/DISASTER-RECOVERY.md) for verification, retention, failure modes, and post-restore checks.
