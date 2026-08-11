# SQLTools: QC SQLite connection

Use SQLTools only for inspection and carefully planned maintenance. The
development database is:

```text
apps/qc-task-manager/db/qc_tasks.db
```

From the monorepo root, the absolute local path is:

```text
$PWD/apps/qc-task-manager/db/qc_tasks.db
```

## Connect

1. Install the VS Code extensions **SQLTools** (`mtxr.sqltools`) and
   **SQLTools SQLite** (`mtxr.sqltools-driver-sqlite`).
2. Initialize the local database if it does not exist:

   ```bash
   export QC_DATABASE_PATH="$PWD/apps/qc-task-manager/db/qc_tasks.db"
   pnpm --filter @brightai/qc-task-manager db:init
   ```

3. Create a SQLite connection with this configuration:

   ```jsonc
   {
     "name": "QC Tasks DB",
     "driver": "SQLite",
     "database": "${workspaceFolder}/apps/qc-task-manager/db/qc_tasks.db",
     "previewLimit": 100
   }
   ```

4. Connect from the SQLTools sidebar, expand the database, then use **Show
   Table Data** or **New Query**.

## Safe queries

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;

SELECT username, full_name, role, is_active
FROM users
ORDER BY role, username;

SELECT status, COUNT(*) AS task_count
FROM tasks
GROUP BY status
ORDER BY task_count DESC;
```

## Safety rules

- Prefer read-only queries. Never edit the production database from a local
  SQLTools connection.
- Stop the app before manual schema work. SQLite uses WAL mode, so active
  databases can have `qc_tasks.db-wal` and `qc_tasks.db-shm` sidecars.
- Do not run `db/schema.sql` manually against an existing database. Use
  `pnpm --filter @brightai/qc-task-manager db:init` so the app's migrations
  run before schema indexes are applied.
- Take a WAL-safe backup before any maintenance:

  ```bash
  pnpm --filter @brightai/qc-task-manager db:backup
  ```

- Never inspect, export, or share password hashes, session tokens, attachments,
  or production data outside the authorized team.

For database lifecycle and restore guidance, see [DATABASE.md](DATABASE.md)
and [RESTORE.md](RESTORE.md).
