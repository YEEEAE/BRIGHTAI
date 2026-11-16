# Production hardening — 2026-11-16

Status: PARTIAL. No production writes, restore branch, retention/protection change, Data API change, server environment change, deploy, commit or push.

## Step 1 — PASS

- Target: lucky-salad-43566291 / br-rough-wind-bdkmg13n / neondb; direct endpoint ep-holy-shape-bdtttebk.c-8.us-east-2.aws.neon.tech.
- Fresh measurement: PostgreSQL 18.7, 43 AIGAS tables, 91 policies, ledger30/30 APPLIED through 0034; all 30 hashes matched repository bytes.
- Applied existing 0035 then 0036 using apply-migrations.mjs --mode resume with explicit host/database pins and verified-prefix gate.
- Runner: changed2, ledger32/32 APPLIED, failed0, 43 tables, 93 policies.
- Independent subsequent ledger read: all32 APPLIED and all32 SHA256 match. Full receipts: staging-ledger-hashes.json.

## Step 2 — PASS within executed scope

- Existing disjoint memberships selected without exporting actor or tenant identifiers.
- SET LOCAL ROLE aigas_runtime: connectionPrivilege().rlsEnforced=true.
- Own tenant guard passed; cross-tenant read through actual tenantGuard threw HTTP-status403 / FORBIDDEN; cross-tenant audit-event INSERT threw SQLSTATE42501.
- All probes rolled back. This is a server-guard + database test, not an HTTP/Auth end-to-end test; raw RLS SELECT is not claimed to raise42501.
- Direction tested: A→B. Reverse B→A not yet executed.
- Evidence: staging-isolation.json. Its owner-rls-guard=false is INVALID EVIDENCE: module-global connectionPrivilege cache retained the earlier runtime observation. Harness corrected to import a separate module instance for the owner probe; subsequent connection attempts timed out before queries. Owner503/RLS_NOT_ENFORCED remains NOT VERIFIED. Do not interpret that old result as an application regression or a pass.
- Repeated final posture recapture also timed out at connection establishment; staging-before.json is the PRE-migration9/9 snapshot, not final evidence.

## Production metadata remeasurement — read only

- Neon CLI8.16.0 authenticated project/branch reads succeeded; MCP startup timed out.
- young-frog-60183055 / br-young-bird-b43proeb / production: ready, protected=false.
- history_retention_seconds=21600 (6h), read from current project metadata.
- Historical child p08-restore-20261110 exists; it is not proof of a restore for this change window.
- Production SQL table/policy/role/ledger counts and Data API state NOT remeasured; report's old numbers are not asserted as current.

## Ordered next gate

1. Finish reverse isolation and isolated owner503 probe after connectivity returns.
2. Obtain owner's explicit approval for the production-derived restore rehearsal and maintenance window. Proposed source: young-frog-60183055 / br-young-bird-b43proeb; proposed temporary branch: p05-restore-20261116. No production mutation is included in this rehearsal approval.
3. Execute restoration and compute evidence before requesting retention/protection changes. Do not treat a current-state clone alone as PITR recovery proof.
4. Separate owner action/approval: disable public Data API; then separate production preflight/migration/runtime cutover gate; final posture required.

No production-readiness or recovery claim is established.
