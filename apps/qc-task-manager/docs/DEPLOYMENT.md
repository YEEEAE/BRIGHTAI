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

## Health and readiness endpoints

`GET /api/health` is Render's liveness probe (`healthCheckPath: /api/health`).
It is public, requires no session or CSRF, performs no state change, and returns
`200` when the Astro SSR process can receive traffic:

```json
{ "ok": true, "service": "qc-task-manager", "status": "healthy", "live": true }
```

Do **not** make Render's deployment check depend on SQLite. On a fresh service,
the database is created at the first database-touching application request; a
strict DB health check would return `503` first and Render would block that
request, causing a deploy-time deadlock.

`GET /api/readiness` is the separate public database readiness probe for
operators and external monitoring. It never creates a database and returns:

- `200` only when SQLite is reachable and migrations are applied:

  ```json
  { "ok": true, "service": "qc-task-manager", "status": "ready", "ready": true, "dbInitialized": true, "schemaVersion": 38 }
  ```

- `503` when the database is missing, unreachable, or not migrated.

Neither response includes filesystem paths, environment values, or secrets.

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

### SQLite deployment contract

Run exactly one writable QC application instance. SQLite WAL mode is suitable
for this single-process deployment, but this file architecture does not
support horizontal multi-instance write scaling. A persistent disk is
required; the database and backup directory must both be on that disk.
The application fails startup when it detects `QC_HORIZONTAL_SCALING=true`,
`QC_SQLITE_INSTANCE_COUNT>1`, `RENDER_NUM_INSTANCES>1`, or
`WEB_CONCURRENCY>1`.

## Environment variables

Set these values in the Render service environment. Mark secrets as secret
values in the dashboard and never commit their values.

| Variable | Production value / purpose |
| --- | --- |
| `NODE_VERSION` | `22` (Node 22 LTS — satisfies the repository `engines` range) |
| `NODE_ENV` | `production` for build and runtime |
| `QC_DATABASE_PATH` | `/var/data/qc_tasks.db` on the persistent disk |
| `QC_BACKUP_DIR` | `/var/data/backups` on the persistent disk — honored by the app runtime (scheduler, admin backups, migration pre-backups) and the `db:backup`/`db:restore`/`db:init` CLI scripts; when unset every caller falls back to a `backups/` directory next to the database |
| `ADMIN_DEFAULT_PASSWORD` | strong one-time seed password; rotate immediately after first login (secret) |
| `HOST` | `0.0.0.0` if required by the service environment |

Optional variables:

| Variable | Purpose |
| --- | --- |
| `QC_BACKUP_RETENTION` | positive integer backup retention count (default `14`) |
| `GROQ_API_KEY` | optional — consultative AI features degrade safely without it; never commit the value. Enablement requires the operator checklist in [AI-SAFE-LAUNCH.md](AI-SAFE-LAUNCH.md): **ROTATE THE PROVIDER KEY OUTSIDE THE REPOSITORY BEFORE ENABLEMENT.** |
| `QC_SEED_MUST_CHANGE_PASSWORD` | E2E FIXTURES ONLY — `0` seeds accounts without the first-login `must_change_password` flag. Never set it on a real deployment (default: enforced). |
| `QC_DISK_CAPACITY_GB` | reference capacity for the `/admin/system-health` disk warning when filesystem stats are unavailable |

`SESSION_SECRET` is **reserved but not implemented** — the app does not read
it (sessions are opaque random tokens stored in SQLite). It is **not** part of
the required deployment contract: do not configure it in the Render
environment until a future signed-session implementation actually consumes
it. No secret value ever belongs in the repository: generate secrets outside
source control, for example:

```bash
openssl rand -base64 48
```

`ADMIN_DEFAULT_PASSWORD` is only read when the `users` table is empty. After
the first boot, sign in as `admin`, open `/admin/users`, and reset the admin
password immediately. Updating the environment variable later does not update
an existing account.

### Recovering a service nobody can sign in to

Because the seed password is read only on an empty `users` table, editing
`ADMIN_DEFAULT_PASSWORD` cannot rescue a running deployment whose admin
password was lost. Open a Render Shell on the QC service and reset the account
against the database on the mounted disk:

```bash
QC_NEW_PASSWORD='<generated-password>' pnpm --dir apps/qc-task-manager auth:reset-password -- --user=admin
```

The password is passed through the environment, not through argv, so it does
not land in shell history or the process list. The script reuses the same
`resetPassword()` path as `/admin/users`: the brute-force lock is cleared, the
change is appended to the user audit chain, and the account is re-flagged
`must_change_password`, so the first sign-in lands on `/account/security` and
the operator-generated password is replaced by the account owner's own.

Generate the temporary password outside source control and treat it as a
secret; never commit it:

```bash
openssl rand -base64 18 | tr -d '/+=' | cut -c1-16
```

## HTTPS and first deployment

1. Enable Render-managed HTTPS and use the HTTPS service URL or a custom domain
   with a valid certificate. Do not expose a plaintext HTTP endpoint.
2. Attach the persistent disk and configure the variables above.
3. Deploy the Node Web Service using the build and start commands in this
   document.
4. Open `https://<your-qc-service>/login` and verify login succeeds; this initializes a brand-new database on the mounted disk.
5. Reset the seeded admin password immediately at `/admin/users`.
6. Confirm the database and backup directory exist on the mounted disk.
7. Open `/admin/system-health` and confirm schema, migration, integrity, FK,
   audit-chain, backup verification, and disk status are healthy.

## Backups and recovery

The application makes a WAL-safe backup at 02:00 Asia/Riyadh each day and runs
a serialized catch-up backup after startup when the scheduled window was
missed or the latest backup is not a recent verified PASS. It keeps the latest
14 backups by default. This is useful but is not a complete disaster recovery
plan: schedule an independent copy of `/var/data/backups` to storage outside
the service and periodically test a restore.

## Production verification checklist (run after a user-controlled deploy)

1. Confirm Render shows one running writable instance and the persistent disk
   is mounted at `/var/data`.
2. `GET /api/health` anonymously: HTTP 200 with `live: true`. Then `GET /api/readiness`:
   HTTP 200, `ready: true`,
   `dbInitialized: true`, integer `schemaVersion`; no path, secret, or audit
   chain payload.
3. Open `/login`, sign in as the rotated admin, then open
   `/admin/system-health`: verify app version/commit, schema/latest migration,
   zero migration failures, FK enabled with zero violations, integrity PASS,
   audit chains PASS, backup verification PASS, and disk warning OK.
4. Trigger one manual backup from `/admin/settings`; confirm the timestamp,
   size, and verification change to PASS and that only the configured
   retention count remains.
5. Restart the service and confirm the database persists, `/api/readiness`
   returns `200` immediately after boot, and a missed-window
   catch-up creates at most one backup (no duplicate concurrent backup files).
6. From a maintenance shell, run `PRAGMA integrity_check;` and
   `PRAGMA foreign_key_check;` against the live DB; both must be clean.
7. Perform the documented restore drill on a maintenance copy, not the live
   file: backup, mutate a disposable copy, restore with the exact confirmation,
   reopen the connection, and verify important records, schema version,
   integrity, FK, and both audit chains.
8. Confirm no second instance, no ephemeral DB path, no deploy-triggered data
   reset, and no external SaaS dependency is required for operations.

Run an on-demand backup through the admin settings page or with a Render cron
job / one-off shell command that uses the same mounted disk:

```bash
pnpm --filter @brightai/qc-task-manager db:backup -- --keep=30
```

See [DATABASE.md](DATABASE.md) and [RESTORE.md](RESTORE.md) for backup and
restore details.

## Deployment ownership (no push from agents)

Deployment of the QC Task Manager is **owned by the user** and is performed
from the Render dashboard. Agents never push, never commit, and never trigger
deploys. To deploy or re-deploy the service, open the Render dashboard for the
`qc-task-manager` service and click **Manual Deploy** (and set the env values
listed above before the first deploy).

## Deployment topology: separate manual service, root blueprint untouched

QC Task Manager is **deliberately not defined in the repository-level
`render.yaml`**. The root blueprint owns only the public `brightai-site`
service and must not be modified to add QC. This is a recorded repository
decision, not an omission:

1. The public site's blueprint is regenerated by repository tooling (the
   redirect generator rewrites `render.yaml`), and a QC service block has been
   clobbered by it more than once. Keeping QC out of the blueprint protects
   both services from that failure mode.
2. A blueprint `Apply` would create the paid resources the block describes
   (persistent disks require a paid plan). Disk size and instance type are
   **operator choices** — this repository intentionally does not define them.
3. Render reads blueprints only from the repository root, so a nested
   `render.yaml` is not a supported alternative. The supported path for a
   separate service with its own persistent disk is a manually created
   dashboard service configured exactly as documented here.

**Create the QC service by hand in the Render dashboard** (New → Web Service,
select this monorepo repository) and apply the settings in the table at the top
of this document: Node Web Service, build/start commands, `healthCheckPath` of
`/api/health`, one instance, and an attached persistent disk mounted at
`/var/data`. The health probe checks the QC application itself — never the
public BrightAI site.

## Pre-pilot deployment checklist (complete before admitting real data)

Run every check against the live Render service after the first deploy, before
the pilot starts. Do not check an item from documentation alone.

- [ ] Persistent disk attached to the QC service and mounted at `/var/data`.
- [ ] DB path verified: `QC_DATABASE_PATH=/var/data/qc_tasks.db` set, and the
      file exists on the mounted disk (not the ephemeral working directory).
- [ ] Backup write verified: trigger one manual backup from
      `/admin/settings` and confirm a new file appears under
      `QC_BACKUP_DIR=/var/data/backups` with verification `PASS`.
- [ ] Restart data persistence verified: manually restart the service and
      confirm pre-restart tasks/records are still present and `/api/health`
      returns `200` immediately after boot.
- [ ] Liveness PASS: anonymous `GET /api/health` returns HTTP `200` with
      `live: true`.
- [ ] Database readiness PASS: anonymous `GET /api/readiness` returns HTTP
      `200` with `ready: true`, `dbInitialized: true`, and an integer
      `schemaVersion`.
- [ ] Audit chain PASS: `/admin/system-health` shows both audit chains
      (`task` and `qcLab`) with status `PASS`.
- [ ] DB integrity PASS: `/admin/system-health` shows `integrity_check` PASS,
      zero `foreign_key_check` violations, and zero migration failures.

When an item fails, fix the deployment configuration first — never seed real
data onto a service that has not passed this checklist.
