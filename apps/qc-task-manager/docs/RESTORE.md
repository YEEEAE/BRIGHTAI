# Restoring `qc_tasks.db`

Only restore a backup during a planned maintenance window. Backup files contain
the complete internal QC database and must remain protected with the same
filesystem permissions and encryption as the live database.

1. **Stop the server.** Do not replace the database while Astro or another
   process has an open SQLite connection.
2. **Backup the current database.** Keep the existing `qc_tasks.db` somewhere
   safe before replacing it:

   ```bash
   cp /absolute/path/qc_tasks.db /absolute/path/qc_tasks.db.before-restore
   ```

3. **Replace `qc_tasks.db` with the selected backup.** For example:

   ```bash
   cp /absolute/path/db/backups/qc_tasks-YYYY-MM-DD-HHmmss.db \
      /absolute/path/db/qc_tasks.db
   ```

4. **Remove stale WAL and SHM files.** They belong to the previous database
   state and must not be reused:

   ```bash
   rm -f /absolute/path/db/qc_tasks.db-wal \
         /absolute/path/db/qc_tasks.db-shm
   ```

5. **Restart the server.** Use the normal production start command and verify
   that the application opens the intended `QC_DATABASE_PATH`.
6. **Verify table integrity with `PRAGMA integrity_check`.** Run this against
   the restored file and require the exact result `ok`:

   ```bash
   sqlite3 /absolute/path/db/qc_tasks.db \
     "PRAGMA integrity_check;"
   ```

Do not copy only `qc_tasks.db-wal` or `qc_tasks.db-shm`. The application creates
backups with SQLite's Online Backup API so the selected `.db` file is the
consistent restore unit.

