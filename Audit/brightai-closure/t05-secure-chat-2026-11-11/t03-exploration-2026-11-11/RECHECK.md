# T03 current-state recheck — PARTIAL

2026-11-11 19:51 Asia/Riyadh. Branch main; initial/final HEAD `f05b17936809bf9a98acfbc75676ae6cc242d3af` plus existing D06 working tree. Requested historical baseline `6a3d53f41b5bd1af59eb320245745498765bd320` differs. Environment: macOS, Node v22.22.2, PostgreSQL 18.6 Homebrew. Drift checked before verification and at final review. Existing D06 files preserved.

## Outcome

No new implementation change: operator-only bootstrap, transaction/audit rollback, one owner, fixed five-product browse capabilities, exact 48h grants, serialized quota, close/export and retention-blocked purge dry-run already exist. Rewriting them would duplicate a verified repair. Updated evidence instead; the existing report remains historical for its own SHA/time. No invitation path changed and no invitation/email sent.

## Current evidence

| Time +03 | Check | Result / scope |
|---|---|---|
| 19:49 | disposable PostgreSQL start in sandbox | BLOCKED by shmget permission; no test executed |
| 19:49:52 | `node scripts/verify-exploration-local.mjs` outside sandbox | PASS 1 scenario, 0 failures/skips; one disposable database, two synthetic institutions, restricted runtime; cluster removed |
| 19:49 | Neon staging catalog read | PASS read-only: exploration table absent, active operators 0, readiness records 0 |
| 19:50 | Neon staging counts/function read | PASS read-only: trial quota limits 0, active Auth directory identities 5, exploration consume function absent |
| 19:50 | local browser prerequisite | BLOCKED: native esbuild binary still absent; did not restart the known failing dev process or reprint its sensitive error |
| 19:51 | Chrome inventory | about:blank only; no authenticated session available in this browser surface |
| 19:51 | final whitespace review | PASS |

An initial Neon read used the incorrect name `aigas_trial_quota_profiles` and returned 42P01. Corrected against migration0030 to `aigas_trial_quota_limits`; the corrected read above succeeded. This was an inspection-query error, not an application failure.

The passing DB scenario covers: operator refusal for MEMBER; banned identity refusal; exactly one OWNER; bootstrap audit rollback; zero forged readiness; member dashboard and canonical product return destination; actual Firewall dashboard, Ledger list, Human Gate list, Risk Engine list; Secure Chat browse guard; A→B refusal; Chat send and Ledger create refusal; last-unit concurrent quota refusal; expired grant refusal; exact172800-second window; restricted runtime cannot self-grant or reset quota; export without content and purge without deletion; immediate access refusal after close. No paid or provider request; no dotenv loaded.

## Capability matrix and limits

| Product | Capability | Evidence |
|---|---|---|
| Firewall | dashboard | actual local service read |
| Ledger | list | actual local service read |
| Human Gate | list | actual local service read |
| Risk Engine | list | actual local service read |
| Secure Chat | browse | actual shared DB guard; models endpoint and authenticated UI NOT RUN |

Existing T02 broad RLS isolation remains historical and was not repeated. This run proves only the listed current scenario. Browser login/return, real team E2E, full Chat metadata/UI, invitation acceptance, session revocation and deployed behavior: NOT RUN. Five Auth directory rows do not prove credentials or sessions. No runtime contract or expiry/switch logic changed. No build or full suite run.

## Remaining blockers / ownership

- DBA + Identity/Kernel: apply reviewed0033 through the migration ledger on the approved isolated target; named active operator and authorized identities/grants/runtime pool are still required. No external migration or operator privilege change was performed under local implementation authorization. Synthetic-data permission does not itself authorize assigning a real operator or inventing quota approval.
- Local environment maintainer: restore the existing pinned esbuild installation before Browser source acceptance; no dependency reinstall was attempted here.
- Identity/Product Operations: real sign-in and return flow, five-product UI acceptance, approved quota and Auth session revocation channel. close currently reports sessionsRevoked=false truthfully; grant checks deny further exploration immediately, independent grants/sessions are not revoked.
- DevOps: T01 shared Node SSR origin/deployment. No branch/commit/push/PR/deploy/DNS/environment/workflow change.
- Privacy/Data owner: retention approval before purge; dry-run deletes nothing.

Source: existing implementation confirmed. Local: focused DB PASS. Published: NOT VERIFIED. Internal shared: NOT READY / NOT APPROVED. Public: NO-GO. Commercial: NO-GO.

Rollback: no new runtime edits to revert. Operational rollback remains close of exploration grants plus separately authorized Auth session revocation, preserving audit; no unapproved deletion.
