# T04 — four products and Firewall review binding

Status: **PARTIAL**. Local representative operations verified; shared team use and an actual Firewall review adapter remain blocked.

Date: 2026-11-11, Asia/Riyadh. Branch: `main`.
Initial/final HEAD: `48e0f4fe61a3e7b86bb752675d6148ede01c7a1d` plus the local changes in this report. Requested baseline `6a3d53f41b5bd1af59eb320245745498765bd320` had drifted. Initial tree was clean; HEAD/tree rechecked immediately before editing. No branch/commit/push/deploy.

Environment: macOS, Node v22.22.2, Homebrew PostgreSQL 18.6, one disposable loopback database on port55437, real `aigas_runtime` NOSUPERUSER/NOBYPASSRLS with transaction-local tenant/identity settings. Auth catalog and identity resolver are synthetic fixtures, not managed Neon Auth. Test process blocks external socket connections. Cluster stopped and removed. Current local migrations installed only in that disposable database. No provider call, customer data, dotenv in the DB runner, remote write, or remote migration.

## Change

The existing pending-review contract accepted a review with the wrong tenant and did not carry or compare its request fingerprint. This was latent behind the empty server integration registry, not evidence of a deployed exploit. Regression reproduced `REVIEW_PENDING` for a different tenant before the fix.

- `requestHumanReview` now receives the durable decision fingerprint inside the existing transaction and includes it in binding v2.
- The adapter result and guard use the same strict predicate: valid review/decision/request/tenant UUIDs, explicit tenant, subject decision, request reference, policy version, fingerprint, operation type and PENDING status. Missing tenant no longer passes. Legacy v1 bindings are refused.
- Registry remains empty. No unsupported operation was mapped to `INTERNAL_DEMO_NOTE`; no policy/approval was invented. ESCALATE still returns409 `HUMAN_GATE_NOT_CONFIGURED`, creates no review and sends nothing. Other Firewall LAB operations continue working. A successful pending-review fixture is contract validation only, not an actual adapter/DB review.

## Current evidence ledger

All times on 2026-11-11. Unit times are the observed session interval, not per-test clock measurements. DB/product and Browser timestamps are recorded directly.

| Time Riyadh | Check | Result and scope |
|---|---|---|
| 05:21–05:23 session interval | `node --import ./tests/helpers/no-egress.mjs --test tests/firewall-review-binding.test.mjs` before fix | FAIL1/1 as expected: wrong tenant returned REVIEW_PENDING; valuable regression reproduced |
| 05:21–05:23 session interval | same command after fix, with `tests/firewall.test.mjs` | PASS7/7, FAIL0, SKIP0; pending success and rejection of tenant/request/fingerprint/operation/status/ID mismatch, existing decision approval replay rejection |
| 05:23:38 | local PG bootstrap in sandbox | BLOCKED by shmget permission, not application failure; isolated launch outside sandbox subsequently allowed |
| 05:23–05:24 | first isolated DB scenario | FAIL1/1: fixture used a placeholder policy checksum; real Kernel integrity guard correctly denied403. Fixture corrected to the actual checksum contract; guard unchanged. [Output](initial-fixture-failure.tap) |
| 05:24:33.098–.203 | `node scripts/verify-products-local.mjs` final | PASS1 representative scenario / four products, FAIL0, SKIP0. [Output with synthetic IDs/readbacks](local-db.tap) |
| 05:25:36.810 | Chrome + Astro dev127.0.0.1:4424 | PASS4/4 unauthenticated canonical API requests:401 UNAUTHORIZED and private,no-store,max-age=0; Kernel200. No DB/Auth configured in this dev process. Authenticated Browser flow NOT RUN. Server and tab closed. |
| 05:21:22.699 | Neon staging read-only query | PG18.6, exploration schema absent, active operators0, readiness rows0. Target `lucky-salad-43566291` / `br-rough-wind-bdkmg13n` / `neondb`. Earlier combined query failed42P01 on assumed quota table name; corrected discovery query above succeeded. This is posture readback, not proof of a remote product transaction. |

Unit command ran once red and once green. No build/E2E/full suite or concurrency rerun; locks/schema/execution/export implementations unchanged. T02 RLS evidence is reused within its documented historical scope; this scenario additionally runs representative operations under restricted runtime on the current source. No live RLS or managed login claim.

## Same-environment representative operations

The scenario uses real HTTP handlers with an injected synthetic identity resolver, actual services and a single migrated DB. Fixtures grant independent local administrative access; T03 exploration-only grants are not expanded into mutation rights.

| Product | Operation and readback | Boundary |
|---|---|---|
| Firewall | Create rules, enforce ESCALATE, read tenant/decision/request/policy/fingerprint from DB, reject replay; subsequent LAB ALLOW succeeds | ESCALATE409 and zero Human Gate rows, external_action_executed=false; LAB is a real API result with mode LAB, not provider execution |
| Ledger | Create event, DB readback, verify MATCH, real JSON export with verification MATCH | INTEGRITY_ONLY_NO_SIGNATURE preserved |
| Human Gate | Real KERNEL_WORKSPACE_RENAME request; self-approval403, independent ADMIN approval, unchanged target after approval, explicit requester execution, persisted renamed target, replay409 | Approval alone has no effect; no external execution |
| Risk Engine | Create asset, independent ADMIN HIGH assessment, OWNER treatment acceptance; revision readback residual score4 | deployment_authorized=false |

This is representative coverage, not an exhaustive CRUD, race, rollback, UI, export or security certification. Existing implementations outside the changed binding contract were preserved.

## Rollback and remaining owners

No new adapter was enabled; there is nothing new to disable in the registry. Keep it empty to retain honest per-operation blocking. Reverting the three binding changes restores the previous local contract, but loses stricter mismatch rejection. Do not erase decisions/audits, and do not retry an already evaluated request UUID. No data migration or completed external effect exists in this change.

- Backend / AI Governance: approve a supported Firewall review operation and reviewer-visible, privacy-reviewed payload/metadata contract; implement its server adapter and persist a PENDING review atomically with tenant/decision/request/policy/fingerprint. Success of that actual integration is **NOT RUN / NOT IMPLEMENTED**. Current safe-block alternative is verified.
- Identity / Product Operations / DBA (T03): approved active operator/accounts/grants and0033 on the isolated target, plus managed Auth team journey. Current staging readback has no operator/readiness and lacks exploration schema.
- DevOps (T01): authorized isolated Node deployment; published routes and product transactions **NOT RUN** here.
- Product QA: shared authenticated Browser/API acceptance after those dependencies. Local handler fixtures do not satisfy it.

Source: binding fix implemented. Local: representative four-product operations PASS. Published: unchanged/unverified. Approval: none inferred.
**Internal shared: NOT READY / NOT APPROVED. Public: NO-GO. Commercial: NO-GO.** No decision authorizes an external action or releases a product.

Protected Hero/header/logo/Constellation/copy/buttons/links/shared CSS, `.env*` and workflows untouched. Graphify executable/graph absent; targeted source inspection used. Skill: verification-before-completion. Browser and Neon connectors used only for the checks above.
