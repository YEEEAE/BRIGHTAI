# T03 — operator bootstrap and bounded internal discovery

Status: **PARTIAL** — local implementation verified; shared authenticated team journey NOT VERIFIED.
Date: 2026-11-11 (Asia/Riyadh). Final evidence captured 05:17:47 +03 (02:17:47Z).
Branch: `main`; base and final HEAD: `86954bd96dd4929a92ffa96066a309efc367ddf2` + working tree.
Requested historical baseline: `6a3d53f41b5bd1af59eb320245745498765bd320`; drift checked before editing; initial tree clean. No commits or branch changes.
Environment: macOS, Node v22.22.2, PostgreSQL 18.6 Homebrew, disposable loopback cluster/one database/two synthetic institutions. No dotenv or remote data in DB tests.

## Change and boundaries

- Privileged operator-only CLI/module: active operator row plus active Auth directory accounts; server generates institution ID and fixes exactly one OWNER, up to 30 MEMBER accounts. One transaction covers membership, five bounded grants and audit/readback; skipped audit aborts all writes. Runtime/browser still cannot self-grant. No Auth invitation path changed; no invitations or email sent.
- New migration `0033_aigas_exploration.sql`; existing applied migrations untouched. Added to delta order. **Not applied on Neon**.
- `INTERNAL_EXPLORATION_48H` is separate from administrative/commercial trial. No readiness rows forged; DB fixture confirms readiness table remains empty. No public Trial activation rules weakened.
- Per-product window exactly 48 hours; explicit operator quota 1–10000 browse calls per institution/product, shared across authorized members. No default cost/quota approval inferred from fixtures. Membership/RLS and expiration enforced for every call; row locking prevents last-unit double consumption. Successful browse audit and sanitized internal refusal logs; no content, tokens, tenant or user IDs in refusal logs. Failed product transactions roll back metering/audit.
- Dashboard advertises only bounded browse capabilities and truthful operation-specific restrictions. Product write/execute operations and Chat sending remain denied for exploration-only accounts. Existing independent grants retain their original rights.
- Close revokes all exploration grants immediately. It does **not** revoke Auth sessions or independent grants; CLI reports this explicitly. Export contains grant windows/usage and exploration audit metadata, no conversation content. Purge dry-run always reports retention approval required and never deletes anything.
- Hero/header/logo/Constellation/public copy/buttons/links/shared CSS/.env/workflows unchanged. No new dependencies.

## Verified capability matrix

| Product | Exploration capability | Actual local service exercised | Excluded |
|---|---|---|---|
| Firewall | dashboard | rules/history dashboard reads | evaluate/enforce/write |
| Ledger | list | event listing | create/verify/export |
| Human Gate | list | request listing | approve/execute/policy changes |
| Risk Engine | list | asset listing/filtering | assess/treatment/write |
| Secure Chat | browse | shared membership+grant guard; existing UI/model metadata path uses this capability | send/cancel; live authenticated models/UI NOT RUN |

List services return genuine empty state for new institutions; no synthetic success rows are rendered. Human Gate listing retains its existing lazy expiration behavior for due requests; no policies/execution rights are added. Full feature workflows remain T04/T05.

## Evidence ledger

All tests below refer to the same HEAD plus relevant final working-tree files. Times are Riyadh, 2026-11-11; UTC retained in DB log.

| Time | Check | Result | Scope |
|---|---|---|---|
| 05:13:59 | initial local PG launch in sandbox | BLOCKED | shared-memory `shmget` denied; not a code failure; rerun allowed outside sandbox |
| 05:14 | isolated DB initial scenario | PASS 1/1 | bootstrap, five capability guards, service reads, A→B, expiry, quota race, close/export |
| 05:16 | final service/dashboard + audit rollback scenario | PASS 1/1 | adds atomic rollback when audit insert silently skips and authorized returnTo |
| 05:16:49 | identity + navigation + migration-order unit checks, no-egress | 11 PASS / 1 FAIL | identity4 and navigation3 PASS; migration expected only0030–0032; new0033 correctly caused failure |
| 05:17 | migration-order after updating exact expected suffix | PASS 5/5 | no-op complete ledger and reject changed hashes/holes/failed/unknown receipts preserved |
| 05:17:37 | final DB scenario after refusal logging | PASS 1/1, 0 skipped | [raw output](local-db.tap); actual services4, Chat browse guard, one owner, no operator self-provisioning, runtime writes denied, exact48h, quota concurrency, expiry, close, retention dry-run |
| 05:15–05:16 | Browser/Astro dev127.0.0.1:4423 | PARTIAL | Kernel200, returnTo `/app/secure-chat/` retained, no private metrics, canonical API401 UNAUTHORIZED; Auth absent in this isolated dev process. Initial missing trailing slash produced404, corrected canonical route401. Initial sandbox listener EPERM resolved outside sandbox. Server stopped. |
| 05:12 | Neon staging SELECT readback | PASS read-only | operators schema present; active operators0; quota profiles0; exploration schema absent. No remote writes. |
| 05:17:47 | diff whitespace check | PASS | no shared CSS/protected components touched |

Build, E2E team sign-in, authenticated Browser return, invitation acceptance, live Chat listing, published/runtime behavior: **NOT RUN**. Invitation acceptance path unchanged. Browser showed `Neon Auth not configured`; no new synthetic remote account created. Unit JWT identity checks are not a managed Auth login test. T02 RLS74/local and Neon runtime34 evidence reused as historical scope only; new exploration grants tested locally here, not externally.

## Operator runbook

Before shared use: Identity/Kernel owner must review/apply0033 on approved isolated target using the existing migration ledger runner; provision a named active operator through the existing owner-controlled channel; verify approved Auth accounts, runtime pool and Node origin. The operator connection must be separate from the restricted application DSN. Do not place credentials in the JSON or shell history.

Run `node scripts/operator-exploration.mjs bootstrap input.json` with `OPERATOR_DATABASE_URL` supplied through the approved secret channel. The script does not read or write `.env`.

Input fields: `operatorId`, `ownerId`, `memberIds`, `name`, `limitUnits`, `approvalReference`. UUIDs must identify existing active accounts; caller cannot choose tenant ID, role, products, readiness or duration. No messages/invitations are generated.

For `export`, `purge-dry-run`, `close`, input is `operatorId` plus `tenantId`. Store the metadata export under approved access controls; export output can contain internal institution references. `purge-dry-run` offers no destructive mode.

Rollback: `close` via operator channel, then revoke sessions through the approved Auth operator channel if authorized. Independent access decisions require separate explicit revocation. Preserve audit and export evidence; retention/purge stays blocked until Privacy/Data owner approves schedule, legal hold rules, recovery and deletion plan. No retention duration invented.

## Release and ownership

- Source: local implementation present and exercised under real restricted runtime role.
- Local: bounded discovery PASS within tested service/guard scope; Browser team login incomplete.
- Published: unchanged; no push/deploy/DNS/production migration. Current live service not rechecked here.
- Internal shared: **NOT READY / NOT APPROVED**. Identity/Kernel/Product Operations: account/operator/grant approval, managed Auth journey and protected runtime pool. DBA: approved0033 application. DevOps: T01 isolated Node origin/deployment. T02 existing isolation evidence does not replace those steps.
- Public Beta: **NO-GO**. Commercial: **NO-GO**. Local PASS is not a release or compliance approval.
