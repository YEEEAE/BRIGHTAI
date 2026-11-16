# T02 — Schema / RLS / runtime closure

2026-11-11 · **PARTIAL overall; local + authorized Staging delta DONE. Production unchanged.**

## Identity and scope

- Root `/Users/yzydalshmry/Desktop/BRIGHTAI`; branch `main`; initial/final HEAD `95f12b9c1fff4717904d4602de86c441a7a56d22` + this working tree. Requested reference `6a3d53f41b5bd1af59eb320245745498765bd320`; drift in relevant tracked code before edits: `scripts/verify-node-runtime.mjs` only. Neither drift nor historical E04–E06 closed T02.
- Initial working tree clean (`git -c core.fsmonitor=false status --short`; default fsmonitor IPC error bypassed read-only). During work, `Audit/brightai-closure/GENERATED-REMEDIATION-PROMPTS.md` changed independently; preserved, not edited by T02.
- Local Node v22.22.2; PostgreSQL18.6 Homebrew; remote PG18.6 Linux. UTC timestamps are in JSON/log evidence; user timezone Asia/Riyadh = UTC+03. `verification-index.json` records completion time, SHA, environment, result and evidence per check.
- Staging only: `lucky-salad-43566291` / `br-rough-wind-bdkmg13n` / `neondb`; direct host pinned in the approved scripts. Production inspected read-only: `young-frog-60183055` / `br-young-bird-b43proeb` / `neondb`.
- No branch/commit/push/PR/merge/deploy/DNS, `.env*` or workflows changes. No UI/CSS/Hero/header/logo/Constellation changes. No customer data copied into tests. Temporary secret held mode0600 outside repo and removed after verification; no DSN/password logged.

## Changes and cause

1. Added0031 and forward repair0032 to shared DELTA_ORDER. Preserved upgrade-only0011/0012/0013/0019 on fresh/resume;0013 is deliberately needed on the historical production delta. Numeric missing-file lists are not migration plans.
2. Fixed target delta runner: old plan replayed baseline CREATE files into an existing31-table database. It now executes DELTA_ORDER only. The local rehearsal still constructs the synthetic historical baseline before applying that delta.
3. Added `--mode resume --confirm-existing-ledger`: validates **all** receipt statuses/hashes/filenames and a gap-free fresh-order prefix before any changes; rejects unknown rows, gaps, changed hashes, failures and empty ledgers. Pinned direct host + database required; pooled DSNs refused; advisory lock serializes runner sessions.
4. Shared `applyMigration` strips only the outer SQL envelope, then commits schema+APPLIED hash receipt together. A real23502 receipt failure rolls schema back. It does not rewrite applied migration files/hashes.
5. Runtime matrix exposed a real0030 gap: new SECURITY DEFINER readiness trigger inherited PUBLIC EXECUTE. Added0032 to revoke it from PUBLIC/client/runtime; quota/readiness RPC grants retained. Prior0030/0031 files unchanged.
6. Updated matrix expectations to the0030 contract, including exact18 column grants. Quota tables intentionally remain deny-all and are tested with actual42501; no permissive policy or broad grants added to make a test pass. Runtime CRUD now uses a non-owner login wrapper. Local PG harnesses use new temporary directories; contract harness includes the previously omitted residual-risk database.

## Current evidence

| Check | Result | Evidence / limitation |
|---|---|---|
| Migration order / resume / changed hashes / CLI delta does not replay baseline | **5 PASS** | `migration-order.tap` |
| PG18 fresh | **28/28 PASS** | `rehearsal.json`; synthetic Auth catalog |
| PG18 production-shaped delta | **29/29 PASS** (11 synthetic historical baseline +18 delta) | Includes0031/0032; not29 production receipts |
| PG18 resume | **PASS** | Preserved25 receipts, applied0030/31/32; rerun empty |
| PG18 roles absent | **28/28 PASS** | No authenticated/anonymous roles, no invented production fixture |
| Negative/paired migration cases | **12/12 PASS** | Ordering/replay, ledger forged/genesis, function denial, receipt rollback |
| Local runtime RLS matrix | **74/74 PASS** | `runtime-rls.json`; A/B CRUD, nonmember, escalation, GUC, COPY, participant Chat predicates,18 exact column grants |
| Local contracts | **75/75 PASS**,0 fail/skip | `contracts.log`;9 disposable DBs, no-egress; Trial request/review/closed activation/approved synthetic quota/expiry and0031 residual-risk guards |
| Build | **PASS**,56 public pages | `build.log`; source build, not deployment |
| Staging migration | **28/28 APPLIED/hash match** | `staging-before.json`, `staging-after.json`, `staging-final.json`;25 original receipts including timestamps/duration unchanged |
| Staging runtime connection | **34/34 PASS** | `staging-runtime.json`; actual password login, non-owner/NOBYPASSRLS/NOINHERIT, SET LOCAL ROLE aigas_runtime; runtime itself remains NOLOGIN |
| Staging final runner | **PASS**,exit3=no-op | `staging-final.log`;0 changed,28 receipts unchanged;18 column grants;0031 function definition readback |
| Staging quota/readiness | **PASS, closed** | activation_gaps reports READINESS+QUOTA; runtime EXECUTE allowed, client EXECUTE denied; direct quota outsider42501;0 operators/readiness/quota approvals |
| Production / Data API | **READ-ONLY / PARTIAL** | `production-readonly.json`;31/RLS31/policies2/authenticated grants124, no runtime/ledger/activation_gaps;DataAPI active/public/aggregates=true |
| Data API external surface | **PARTIAL** | `data-api-surface.json`: unauthenticated HEAD only,3×400, no body downloaded. No authenticated JWT/GET or leak claim |
| Production migration / Data API disable / app cutover | **NOT RUN** | Restore gate below; permanent runtime login/secret-store/app pool setup belongs toT03 |

Staging at final: **41 tables/RLS41/FORCE2/89 policies/30 functions**, no client function EXECUTE. Actual runtime session was a short-lived restricted LOGIN, not owner impersonation presented as a connection proof. Owner seeded only random synthetic users/tenants/rules. Both tenant directions tested allCRUD, outsider allCRUD, escalation returned42501, Chat SELECT returned42501, COMMIT/ROLLBACK cleared role+tenant+actor GUC. Mutating runtime probes rolled back. Fixture users/tenants/rules and probe LOGIN removed; final leftover probe roles0.

Chat distinction: deployed runtime is denied table access entirely. Participant-only positive/negative content predicates were exercised **locally** using the existing dedicated content-probe role; no such content grant was created on Neon.0031 behavior passed local DB tests; remote receipt and installed function definition verified. No live product/browser end-to-end claim.

## Production delta / recovery / owner decision

Machine-readable18-step production delta: `production-delta-plan.json`, ordered:
`0013,0014,0016,0017,0018,0020,0021,0022,0023,0025,0026,0027,0028,0029,0024,0030,0031,0032`.

Preexisting0001–0010/0015 and historical0011/0012 are not replayed and are not fabricated as new APPLIED receipts.0024 is deliberately after0025, completing the real Ledger chain guard. Never stop for release between0018 and0025; trigger EXECUTE windows also require completion through0032. Reverify actual installed baseline definitions and current data constraints in the approved preflight, not just table names, before production.

**Restore gate remains BLOCKED.** Current control-plane snapshot list is empty. A real older branch exists: `p08-restore-20261110` / `br-plain-base-b42xp3zu`, anchored at `2026-11-10T18:03:26Z`, LSN `0/2633D28`; existence alone is not a current approved restore rehearsal/RPO. Historical logical rehearsal at `Audit/outhers/final-360-2026-11-10/BRIGHTAI-BETA-GATE-FINAL-2026-11-08/p17-restore-rehearsal-2026-11-10/evidence/local-measurements-20261110T223332Z.json` restored an isolated **Staging** logical backup (40s backup/155ms restore, verify0), explicitly no Neon point-in-time/RPO. It does not prove recovery of current production. No new clone or customer dump was made.

**Owner approved option A in this chat on2026-11-11:** «اعتماد تعطيل Data API (الخيار A) عند استيفاء بوابة الاستعادة». Approval is conditional; disable NOT EXECUTED. Updated `docs/DATA-API-EXPOSURE-DECISION.md` without pretending the target already has zero grants.

Required operator sequence before any production write:

1. Neon owner/DBA records approved window, exact production branch/database, write freeze boundary and restore point/snapshot ID+timestamp/LSN. Approve creation/retention of any recovery resource separately; no customer data transferred locally.
2. Restore in a separately approved Neon recovery target, verify catalog/ledger constraints/role posture and integrity in place, record actual RPO/RTO and operator acceptance. A successful snapshot creation alone is insufficient.
3. Reconcile current production baseline definitions and data compatibility (including0022 global uniqueness) against the rehearsed synthetic delta; freeze reviewed migration hashes and record go/no-go. Rehearsal remains source evidence, not production data compatibility proof.
4. Once recovery gate is satisfied, execute the owner's approved Data API disable on exact production/neondb; verify get_data_api404 plus external route denial. Do not recreate public exposure as routine rollback.
5. Apply reviewed delta via pinned unpooled target runner and atomic receipts in the same maintenance window. Re-read hashes and restricted-role A/B/denial/rollback results. Do not replay existing baseline or0019. On error, stop, inspect SQLSTATE and use validated roll-forward or approved recovery.
6. T03 provisions a permanent restricted LOGIN/secret-store path and verifies the actual application pool identity. No application owner connection allowed; a NOLOGIN runtime reached by SET LOCAL ROLE is valid.

**Rollback:** per-migration failures roll back schema+receipt; runtime test writes roll back; no inverse migration that withdraws RLS/client denial and no DROP of customer tables. Post-commit recovery requires the approved restore point plus controlled write outage or forward repair. No current snapshot/restore approval is inferred from historical reports.

## Failures encountered and resolved

- Sandbox shared-memory denial prevented initial PG initdb; reran the authorized local harnesses with sandbox escalation, no external database access.
- Envelope unit test3/4 exposed trailing comments after0025 COMMIT; runner accepts trailing comments, migration bytes unchanged; final5/5.
- Initial final-schema RLS matrix66/70 exposed the real readiness trigger EXECUTE leak plus old36-table expectations.0032 closed leak; explicit quota denial/exact column checks now74/74; no test disabled.
- Existing fixed PG temp directory/port caused42P07/port conflict on rerun; temporary directories made unique. Contract run74PASS/1FAIL identified omitted RISK_ENGINE_RESIDUAL_TEST_DATABASE_URL; fixed both harnesses, final75PASS/0FAIL/0SKIP.
- Added ACL query initially passed a zero-dimensional empty array to aclexplode (22023); corrected to strict `aclexplode(attacl)` which naturally skips NULL. Final local+Staging catalog checks passed.
- Node REPL network DNS unavailable; used approved direct CLI execution with temporary0600 credentials. No secret echoed.

## Release decisions and owners

| Stage | Decision | Remaining owner |
|---|---|---|
| Internal DB verification on isolated Staging | PASS for the measured schema/runtime scope only | PostgreSQL / Neon Security |
| Shared Internal application exploration | NOT READY / NOT VERIFIED byT02 | T01/T03 owners: deployed SSR, permanent runtime pool, bootstrap/capabilities |
| Public Beta | NO-GO | Neon owner/DBA: production recovery+delta+conditional DataAPI execution; product owners: end-to-end gates |
| Commercial | NO-GO | Recovery/security/privacy/UAT and independent release owners |

T02 is **PARTIAL**, not BLOCKED_BY_DEPENDENCY for local/Staging work. Remaining production blocker has a concrete owner (Neon owner/DBA) and an approved conditional Data API choice. Source/local/Staging evidence is not a published application change or independent release approval.
