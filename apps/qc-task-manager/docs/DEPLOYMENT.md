# Deploying QC Task Manager on Render

QC Task Manager is an Astro SSR application. Deploy it as a **Render Node Web
Service**, never as a **Static Site**. The Node process serves Astro pages,
authentication, API routes, SQLite access, migrations, and backup scheduling.

## Required Render service settings

Create a separate Node Web Service for QC from the monorepo repository. Keep
the service root at the repository root so Render can use the workspace lockfile.

| Setting | Value |
| --- | --- |
| Service type | Node Web Service |
| Runtime | Node |
| Node version | 22 LTS (`NODE_VERSION=22`) |
| Build command | `pnpm install --frozen-lockfile && NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` |
| Start command | `pnpm --filter @brightai/qc-task-manager start` |
| Health check | `/api/health` |

The package `start` command runs Astro's Node standalone entry point:

```bash
node ./dist/server/entry.mjs
```

Do not use `astro preview` as the production start command. Render supplies
`PORT`; do not hard-code a public port for production. Set `HOST=0.0.0.0` if
the service environment requires it.

## Health check endpoint

`GET /api/health` is the Render readiness probe (`healthCheckPath: /api/health`).
It is public (no session or CSRF required, like `/login`) and performs no state
changes, so Render can call it without a cookie.

- `200` — the SQLite database is reachable and migrated:

  ```json
  { "ok": true, "service": "qc-task-manager", "status": "healthy", "schemaVersion": 10 }
  ```

  `schemaVersion` is the latest applied version from the real
  `schema_migrations` table.
- `503` — the database file is missing/unreachable or the schema is not
  initialized:

  ```json
  { "ok": false, "status": "unhealthy", "reason": "database unavailable" }
  ```

The response never includes file paths, environment values, or secrets. The
probe is read-only and never creates the database: it reports `503` whenever
the database file is missing or unreachable, and `200` only once the file
exists and is migrated. The database is created by the application on the first
database-touching request (for example the first login POST), so on a fresh
deployment verify login once (step 4 below) before expecting the health check
to report healthy — and after the first deploy the persistent disk keeps the
database, so later deploys are healthy immediately. A moved/deleted database
file is reported as `503` — the correct signal for a service that cannot serve
work without its database.

## Persistent SQLite disk

Attach a **persistent disk** to the QC Web Service before its first production
boot. Mount it at `/var/data`, then set these paths:

```text
QC_DATABASE_PATH=/var/data/qc_tasks.db
QC_BACKUP_DIR=/var/data/backups
```

Both locations must be on the persistent disk. The default repository path
(`apps/qc-task-manager/db/qc_tasks.db`) is suitable for local development but
is not suitable for Render production storage.

Never put `qc_tasks.db`, `qc_tasks.db-wal`, `qc_tasks.db-shm`, or backups on
Render's ephemeral filesystem. A restart, deploy, or instance replacement can
discard data stored there.

## Environment variables

Set these values in the Render service environment. Mark secrets as secret
values in the dashboard and never commit their values.

| Variable | Production value / purpose |
| --- | --- |
| `NODE_VERSION` | `22` (Node 22 LTS) |
| `NODE_ENV` | `production` for build and runtime |
| `QC_DATABASE_PATH` | `/var/data/qc_tasks.db` on the persistent disk |
| `QC_BACKUP_DIR` | `/var/data/backups` on the persistent disk |
| `ADMIN_DEFAULT_PASSWORD` | strong one-time seed password; rotate immediately after first login |
| `SESSION_SECRET` | high-entropy secret kept stable across deploys; currently reserved because sessions use opaque SQLite tokens |
| `HOST` | `0.0.0.0` if required by the service environment |

Generate secrets outside source control, for example:

```bash
openssl rand -base64 48
```

`ADMIN_DEFAULT_PASSWORD` is only read when the `users` table is empty. After
the first boot, sign in as `admin`, open `/admin/users`, and reset the admin
password immediately. Updating the environment variable later does not update
an existing account.

## HTTPS and first deployment

1. Enable Render-managed HTTPS and use the HTTPS service URL or a custom domain
   with a valid certificate. Do not expose a plaintext HTTP endpoint.
2. Attach the persistent disk and configure the variables above.
3. Deploy the Node Web Service using the build and start commands in this
   document.
4. Open `https://<your-qc-service>/login` and verify login succeeds.
5. Reset the seeded admin password immediately at `/admin/users`.
6. Confirm the database and backup directory exist on the mounted disk.

## Backups and recovery

The application makes a WAL-safe backup at 02:00 Asia/Riyadh each day and runs
a catch-up backup after startup when today's backup is missing. It keeps the
latest 14 backups by default. This is useful but is not a complete disaster
recovery plan: schedule an independent copy of `/var/data/backups` to storage
outside the service and periodically test a restore.

Run an on-demand backup through the admin settings page or with a Render cron
job / one-off shell command that uses the same mounted disk:

```bash
pnpm --filter @brightai/qc-task-manager db:backup -- --keep=30
```

See [DATABASE.md](DATABASE.md) and [RESTORE.md](RESTORE.md) for backup and
restore details.

## Render configuration warning

The repository-level `render.yaml` currently configures the main BrightAI site
as a Node Web Service. It does **not** define a QC Task Manager service. Add
the QC service in the Render dashboard or a reviewed Blueprint before release.
If a QC service exists in Render and is configured as a Static Site, replace it
with the Node Web Service configuration above before deploying.
