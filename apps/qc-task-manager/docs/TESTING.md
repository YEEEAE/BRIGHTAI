# Testing QC Task Manager

Run commands from the monorepo root. The workspace package name is
`@brightai/qc-task-manager`.

## Required checks

```bash
pnpm --filter @brightai/qc-task-manager test
pnpm --filter @brightai/qc-task-manager typecheck
NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
```

`test` runs both the domain suite and database-rule suite. The production build
is important because the secure session-cookie setting is compiled from the
build environment.

## Focused commands

```bash
pnpm --filter @brightai/qc-task-manager test:domain
pnpm --filter @brightai/qc-task-manager test:qc-operations
pnpm --filter @brightai/qc-task-manager test:db-rules
pnpm --filter @brightai/qc-task-manager db:init
pnpm --filter @brightai/qc-task-manager db:backup
```

## End-to-end acceptance

Run the acceptance suite when the local runtime can launch the standalone Node
server and load the native `better-sqlite3` module:

```bash
pnpm --filter @brightai/qc-task-manager e2e:acceptance
```

The command builds in production mode and exercises the live application. It
needs permission to listen on a local port and a `better-sqlite3` binary built
for the active Node ABI. If either is unavailable in a sandbox or after a Node
upgrade, rebuild/install dependencies with the repository's Node 22 LTS and
run the suite in a normal local shell.

## Manual smoke check

1. Set the local environment variables and run `db:init`.
2. Start `pnpm --filter @brightai/qc-task-manager dev`.
3. Open `http://localhost:4321/login`.
4. Sign in as each role and confirm its landing page and access boundaries.
5. Create a task, update it, attach permitted test evidence, and verify the
   activity log and notification behavior.
6. Build with `NODE_ENV=production`, start the standalone server, and confirm
   the session cookie is marked Secure over HTTPS in the deployed environment.

See [ROLES-AND-PERMISSIONS.md](ROLES-AND-PERMISSIONS.md) for the expected role
boundaries and [DEPLOYMENT.md](DEPLOYMENT.md) for the production configuration.
