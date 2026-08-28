# Database operations

QC Task Manager uses one SQLite database through `better-sqlite3`. The app
opens it lazily on the first database-backed request, enables WAL mode,
foreign keys, a five-second busy timeout, and validates the schema on startup.

## Paths and environment variables

| Environment | `QC_DATABASE_PATH` | Backup location |
| --- | --- | --- |
| Local development | `$PWD/apps/qc-task-manager/db/qc_tasks.db` | next to the database in `backups/` |
| Render production | `/var/data/qc_tasks.db` | `/var/data/backups` via `QC_BACKUP_DIR` |

Always use an absolute `QC_DATABASE_PATH`. The legacy `QC_DB_PATH` alias is
accepted for compatibility, but new deployment configuration should use
`QC_DATABASE_PATH`.

Set `ADMIN_DEFAULT_PASSWORD` before creating an empty database. The initial
accounts (`admin`, `manager`, `supervisor`, and `employee`) are seeded only
when the `users` table is empty. The value is not a password-rotation tool;
reset existing users from `/admin/users` instead.

## Initialize or upgrade

From the repository root:

```bash
export QC_DATABASE_PATH="$PWD/apps/qc-task-manager/db/qc_tasks.db"
export ADMIN_DEFAULT_PASSWORD='replace-with-a-strong-password'
pnpm --filter @brightai/qc-task-manager db:init
```

`db:init` applies the same sequential migration history and schema validation as
the running application. Use it to prepare a fresh database or upgrade an
existing one. Do not paste `db/schema.sql` into SQLTools for an existing
database: `CREATE TABLE IF NOT EXISTS` cannot upgrade an old table shape.

`db:reset` intentionally recreates the database and is destructive; use it
only for disposable local data.

## Schema ownership and data handling

The executable schema source of truth is `db/migrations/`, not `db/schema.sql`.
The reference snapshot contains 12 application tables:

`users`, `tasks`, `task_comments`, `task_attachments`, `task_activity_log`,
`task_delete_requests`, `task_checklists`, `task_dependencies`, `notifications`,
`sessions`, `login_attempts`, and `saved_filters`.

Every database also contains `schema_migrations` with `version`, `name`,
SHA-256 `checksum`, and `applied_at`. Failed attempts are retained in
`schema_migration_failures`; failed SQL is rolled back and retried on the next
startup. Startup verifies the migration version, applied checksums, and
`PRAGMA foreign_key_check` before serving requests. See
[`MIGRATIONS.md`](MIGRATIONS.md) for the operational procedure.

Attachments are stored as BLOBs in SQLite. Treat the database and every backup
as confidential application data. Keep them outside `public/`, source control,
and ephemeral production storage.

## Backups

The process schedules a WAL-safe backup every day at 02:00 Asia/Riyadh and
runs one serialized catch-up after startup if the scheduled window was missed
or the latest backup is not a verified PASS for the current Riyadh day. Backup
status and the last verification result are persisted in `status.json`.
It retains 14 backup files by default. The scheduler is in-process, so the app
assumes one writable application instance; deploy one replica and keep any
off-service copy of backups outside the app.

## SQLite deployment contract

This architecture requires exactly one writable application instance and a
persistent disk for both `QC_DATABASE_PATH` and `QC_BACKUP_DIR`. Do not enable
horizontal multi-instance write scaling against this SQLite file. When the
host exposes a detectable scale-out setting (`QC_HORIZONTAL_SCALING=true`,
`QC_SQLITE_INSTANCE_COUNT>1`, `RENDER_NUM_INSTANCES>1`, or
`WEB_CONCURRENCY>1`), startup fails before opening the database.

The admin-only `/admin/system-health` page shows the safe DB filename, DB/WAL
sizes, schema and migration state, migration failures, SQLite integrity/FK
state, backup age and verification, audit-chain status, and disk capacity
warning. The public `/api/health` is a lightweight liveness probe and does not
touch SQLite; `/api/readiness` verifies SQLite and migrations without exposing
filesystem paths or creating a database. Neither endpoint scans audit chains.

Create an on-demand backup:

```bash
pnpm --filter @brightai/qc-task-manager db:backup
pnpm --filter @brightai/qc-task-manager db:backup -- --keep=30
```

Set `QC_BACKUP_DIR` when backups must be stored separately from the database.
The app runtime (scheduler, admin backups, migration pre-backups) and the CLI
scripts all resolve the directory through one shared helper
(`configuredBackupDirectory()` in `src/lib/backup.ts`), so status history and
restore drills always see the same backup set.
The backup implementation uses SQLite's online backup API, so it captures
committed WAL data and creates a standalone `.db` restore unit. Do not copy
the live `.db` file by itself while the service is running.

For production, retain backups on the persistent disk and schedule an
additional off-service copy. Test restoration periodically with the documented
[restore procedure](RESTORE.md).

## Integrity and maintenance

Before a planned maintenance action, stop the service, make a backup, and
check the selected database:

```bash
sqlite3 /absolute/path/qc_tasks.db "PRAGMA integrity_check;"
```

The expected result is `ok`. Follow [SQLTOOLS.md](SQLTOOLS.md) for safe local
inspection and [DEPLOYMENT.md](DEPLOYMENT.md) for Render disk configuration.
