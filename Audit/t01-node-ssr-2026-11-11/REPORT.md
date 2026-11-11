# T01 — Node SSR / deployment reconciliation

Status: DONE LOCAL verification; PARTIAL overall, isolated deploy BLOCKED_BY_PERMISSION.
Measured: 2026-11-11 01:40:24–01:40:41 UTC (04:40 Riyadh).
Branch main; HEAD 8a5f498c8fde96a53e400b2e4be3641e129e41b5 + working tree (verification script/documentation only). Initial tree clean.

## Change and evidence
Existing P04 server, Node blueprint, middleware and readiness were already present; no duplicate server or UI change. Extended runtime verifier with GET/HEAD private cache, both CDN headers, Vary credentials, noindex, redirects/query preservation, 404 and timestamp per check. Fixed verifier cleanup waiting for an already exited child. Updated operator handoff to remove the historical liveness workaround and specify edge bypass and correct workspace discovery.

- Build PASS, explicit Node v22.22.2, 56 public pages; build.log and version.json.
- Runtime 19 PASS / 0 FAIL / 0 SKIP; per-test times in runtime.log.
- Positive readiness used a disposable PostgreSQL18 cluster, loopback55481, one empty schema table; stopped in finally. No shared database, customer data or .env read. Auth configuration was synthetic HTTPS .invalid; active auth probe SKIPPED. This proves configured mode, not working external identity or full schema/runtime RLS.
- Tests cover actual Node process, public200, portal503 HTML/JSON, API401, missing auth503, DB failure503, readiness200/503, malformed Host400/backslash400, GET/HEAD redirect301 and 404, private cache/Vary/noindex.
- Authenticated403, real Auth JWKS, full DB schema, T02/T03 readiness, full redirect matrix and edge bypass NOT RUN. npm ci NOT RUN; installed node_modules used.
- git diff --check PASS. No production server code changed; Hero/header/logo/Constellation/CSS untouched.

## Source / published / approval
Read-only Render reconciliation and public HTTP performed at 01:34–01:36 UTC in preceding verification, same HEAD:
service srv-d7m5bcjbc2fs73826v20 in workspace tea-d7m59qbeo5us73ekdu80 remains static_site/dist/client with pnpm build; deploy dep-dbpsb5ss728c738pbpmg live and matches HEAD. Isolated historical service srv-dbpj8jajnfac739je6lg returns404 in this workspace; its historical workspace tea-dade102fngtc739064v0 must be checked before any duplicate creation.
Public GET/HEAD: /, /solutions/, /docs/ 200; /app/, /app/kernel/, /healthz/, /app/api/kernel/health/, /knowledge/ 404. Missing-route GET is HTML with public cache max-age0/s-maxage300 and no noindex. This is not the required API/private cache contract.
D01 owns solutions content (src/pages/solutions.astro). D07 owns knowledge root/listing reconciliation (src/pages/docs.astro and src/pages/knowledge/).

No branch/commit/push/PR/deploy/DNS/env/workflow or external data changes. No service created/changed. Runtime service/deploy IDs in tests are synthetic, not proof of Render deployment. SHA in version.json identifies source HEAD; working-tree verifier/docs changes remain uncommitted.

## Remaining owner action
DevOps/owner must explicitly authorize isolated service configuration/deployment in verified workspace; leave custom domain unchanged. Use npm ci && npm run build, npm start, HOST0.0.0.0, healthCheckPath /healthz/, closed portal. T02/T03 supply least-privilege DB/Auth and acceptance. Re-read service/deploy/SHA/artifact and real HTTP matrix after authorized deploy; do not substitute liveness or weaken readiness. Edge operator proves bypass for /app/*, /auth/* and health including errors.
Internal shared: NOT READY. Public Beta: NO-GO. Commercial: NO-GO. PASS is not release approval.
