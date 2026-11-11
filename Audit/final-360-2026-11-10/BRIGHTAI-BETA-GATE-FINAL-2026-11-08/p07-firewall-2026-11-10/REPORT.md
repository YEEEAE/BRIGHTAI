# P07 Firewall — local assessment, 2026-11-10

Status: PARTIAL. No release or external integration claim.

- Baseline: `7b1f533f71c7b1f41884790366a4d5967c85a87b`; evaluated HEAD `360c042542b6dcd6186e4babd5b802e1e84dd34b` on `main`. Existing unrelated working-tree modification: `Audit/EXECUTION-PROMPTS.md`.
- Environment/time: Node v22.22.2, disposable localhost PostgreSQL 18, Asia/Riyadh, 2026-11-10 approximately 20:41–20:43. No production credentials or external network used by local test. Database tests use the no-egress preload and disposable fresh databases; the cluster was removed by the harness.
- `node scripts/firewall-local-verify.mjs`: PASS 8/8. In-process guard sandbox only; no database, HTTP server, external AI provider or real review request.
- `node --test tests/firewall.test.mjs`: PASS 5/5. Includes handler-level negative HTTP requests, not a full authenticated browser journey.
- `TMPDIR=<unique temporary directory> P06_PG_PORT=55487 node scripts/verify-trial-local.mjs`: PASS 46/46, 0 skipped, eight disposable databases. Firewall DB test covers rule creation/readback, update from version 1 to 2, tenant/role rejection, decision metadata privacy and rollback on forced decision insert failure. This is not proof of five end-to-end HTTP outcomes, quota, mandatory audit failure, replay, or bound escalation.
- First local PostgreSQL startup was blocked by sandbox shared-memory permissions; rerun with system permission passed.
- Source inspection: review and provider registries are empty. Human Gate schema currently limits operation types to `INTERNAL_DEMO_NOTE` and `KERNEL_WORKSPACE_RENAME`; no approved Firewall review payload or operation is present. `ESCALATE` reports `HUMAN_GATE_NOT_CONFIGURED` and cannot create the required PENDING request. A local sandbox is not an AI provider or proof of escalation.
- Remaining acceptance: approved P09 review contract and P08 evidence dependency; owner-approved connector registration; atomic bound PENDING request and negative approval/replay tests; five HTTP cases with reason/version/evidence readback; quota, audit failure and binding tests; browser verification. Provider approval from P11 is separate. No registry entry, external transmission, migration, deployment, or product code change was made.
- Rollback intent: disable connector and writes on fault; never automatically allow.

## Follow-up implementation

- HEAD remains `360c042542b6dcd6186e4babd5b802e1e84dd34b`; changes are local working tree. Human approval now must include the same Firewall decision ID as well as tenant, request, policy version and fingerprint. A unit test rejects a different decision and accepts a matching synthetic binding; no execution integration is enabled.
- The isolated database test now drives the real Firewall HTTP handler with synthetic identity through the runtime-role transaction for all five LAB outcomes. It verifies each reason, rule version, saved decision and corresponding Kernel audit correlation/version. It also exercises tenant denial, quota 429, forced Kernel audit failure with decision rollback, and guarded replay rejection when Kernel policy is absent. Auth is injected; this is not a network server or authenticated browser test. LAB ESCALATE is not a Human Gate request.
- `node --test tests/firewall.test.mjs`: PASS 6/6; `node scripts/firewall-local-verify.mjs`: PASS 8/8. The sandbox REDACT assertion verifies only the evaluated text reaches its local adapter; it is not an external provider test.
- Remaining: approved P09 operation/payload contract and owner-approved connector registration, atomic PENDING/readback and approval lifecycle, P08 evidence dependency, approved provider if applicable, guarded five-state HTTP integration with an approved Kernel policy, cross-tenant replay and browser verification. No external resources were changed.
- Final follow-up run: `TMPDIR=<unique temporary directory> P06_PG_PORT=55487 node scripts/verify-trial-local.mjs` PASS 47/47, 0 skipped; eight disposable local databases, no-egress preload, cluster removed. Run completed 2026-11-10 Asia/Riyadh.
