# QC Task Manager migrations

## Source of truth

Create migrations under `apps/qc-task-manager/db/migrations/` with stable,
sequential filenames:

```text
001_initial.sql
002_legacy_schema_reconciliation.sql
003_add_example_index.sql
```

The runner discovers files in numeric order. A migration is applied once. Its
exact file bytes are hashed with SHA-256 and stored in `schema_migrations`.
Editing an already-applied migration is a hard failure; add a new migration
instead.

## Safety and recovery

- Each migration runs in a SQLite transaction.
- Successful versions are recorded only after commit.
- Failed SQL is rolled back and recorded in `schema_migration_failures`.
- `PRAGMA foreign_key_check` must be empty after every migration.
- Destructive SQL (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `DELETE FROM`)
  is rejected unless the migration explicitly contains
  `-- brightai:allow-destructive`.
- An opted-in destructive migration creates a pre-migration backup.
- Never renumber or edit an applied migration.

Inspect failures with:

```sql
SELECT version, name, error_message, failed_at
FROM schema_migration_failures
ORDER BY id DESC;
```

Fix the migration or its underlying database condition, then restart the app
or rerun `db:init`. The failed version has no success row, so it is retried.
If an applied checksum changed, restore the original file or create a new
numbered migration; do not bypass the guard.

## Legacy upgrade

When a database predates `schema_migrations`, migration 001 is recorded as a
baseline without replaying it over live tables. Migration 002 then applies the
deterministic additive reconciliation and safely rebuilds the legacy
delete-request table where needed. Existing users and tasks are retained;
rows pointing to already-deleted tasks cannot be recreated as valid foreign-key
children and are excluded during that specific table rebuild.

## Verification

```bash
pnpm --filter @brightai/qc-task-manager test:migrations
pnpm typecheck
pnpm test
pnpm build
```

The focused suite covers fresh, existing, upgrade, repeated, failed/recovery,
rollback, data preservation, foreign-key integrity, version/checksum, and
destructive-guard behavior using isolated temporary SQLite databases.
