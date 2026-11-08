# Identity, First-Owner Bootstrap and Invitation Runbook

> Status: **LOCAL RUNBOOK — NOT EXECUTED**
> Applies to: `src/server/kernel/auth.mjs`, `administration.mjs`, `service.mjs`, `src/scripts/workspace-context.ts`,
> `src/pages/auth/*`, `src/pages/app/kernel/`, and `migrations/0006` / `0019` / `0025`.
> This document does not claim a working deployment, a real user, a sent invitation, or verified tenant isolation.

## 1. Purpose and boundaries

This runbook defines how an authorized operator validates the institutional identity lifecycle **after** the owner
approves a disposable environment and the database migration path:

1. Sign-in, session expiry, and fail-closed handling of an unconfigured MFA/SSO challenge.
2. First-tenant bootstrap with exactly one `OWNER` and no role escalation.
3. Invitation registration, acceptance, expiry, rejection, and cancellation bound to current organization authority.
4. Tenant switching that only applies a workspace after the backend confirms membership.

It does **not** authorize:
- Creating live tenants, users, invitations, or email delivery in this task.
- Applying migrations, changing RLS/grants, opening the Data API, or rotating credentials.
- Any production action. `SOURCE_PRESENT` in code is not `RUNTIME_VERIFIED`.

## 2. Evidence vocabulary (mandatory)

| State | Meaning |
| --- | --- |
| `SOURCE_PRESENT` | The code path exists locally and is reviewed. |
| `SCHEMA_PRESENT` | The required tables/columns exist on the inspected branch. |
| `CONFIGURED` | Required environment values are set on the reviewed runtime (values never printed). |
| `RUNTIME_VERIFIED` | A recorded run of the scenario below produced the expected outcome. |
| `APPROVED` | A named accountable owner signed the release decision for this scope. |

A scenario may only be described as passing when the evidence column says `RUNTIME_VERIFIED`. `SOURCE_PRESENT`
plus a green build is not evidence of identity, isolation, or invitation behaviour.

## 3. Approval and ownership

| Decision | Accountable owner | Required before |
| --- | --- | --- |
| Disposable Neon branch + restore point | Database operator | Any migration or scenario run |
| Runtime role (`NOBYPASSRLS`) and `DATABASE_URL` rotation | Security owner + DB operator | Enabling the portal |
| Auth origin/JWKS, email verification, Organization plugin | Security owner | Account A/B creation |
| MFA/SSO policy | Security owner | Any claim that MFA/SSO is supported |
| Invitation delivery (email) | Platform owner | Any claim that an invitation email was sent |
| Beta release gate | Platform owner | After all evidence rows are `RUNTIME_VERIFIED` |

The current code has **no approved MFA/SSO step**. A provider second-factor challenge is treated as a closed
state with a clear message; it is never converted into a session.

## 4. Prerequisites (not performed here)

1. A disposable branch or local PostgreSQL with `0001`, `0006`, and the approved `0018`/`0025` path applied on a
   reviewed environment. `0014`, `0016`, and `0024` remain unapplied on the inspected branch and are not required
   by the identity path.
2. `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, `DATABASE_URL` set **server-side only**. Do not paste values into
   this file, logs, browser storage, or chat.
3. `AIGAS_APP_ENABLED=true` only on the approved environment. The committed `render.yaml` keeps it `false`.
4. An approved origin for the Auth provider that matches the portal origin.
5. A reviewer who is not the person running the scenario.

## 5. Synthetic fixtures (specification only — do not create now)

Use only the reserved `example.test` domain and clearly synthetic names.

| Fixture | Purpose | Notes |
| --- | --- | --- |
| `owner.a@example.test` | Owner of tenant A | Verified email, no MFA |
| `member.b@example.test` | Invited member of tenant A | Verified email, no MFA |
| `owner.c@example.test` | Owner of tenant B (isolation control) | Verified email, no MFA |
| Tenant A | `Synthetic Workspace A` | Created by `owner.a` through the first-owner path |
| Tenant B | `Synthetic Workspace B` | Created by `owner.c`, never linked to A |

Rules:
- No real customer names, emails, phone numbers, or documents.
- No actual invitation email is sent during preparation. Provider invitations are created only inside the approved
  disposable environment, and the runbook records them as `NOT_CONFIRMED` delivery unless the provider log proves it.
- Delete or expire the disposable branch after the run; do not merge synthetic rows into production.

## 6. Scenario 1 — Sign-in and session expiry

1. Open `/auth/sign-up/` signed out. Expect the form, no private data, `no-store`, `noindex`.
2. Sign in with `owner.a@example.test`. Expect the session view and a link to `/app/kernel/`.
3. Open `/app/kernel/`. Expect `dashboard` to verify the JWT issuer, audience origin, expiry (<15m), and identity.
4. Force expiry (provider session revoke or wait for token expiry). Perform a GET. Expect 401, one forced session
   refresh attempt, then the signed-out view with "انتهت الجلسة" and no private DOM retained.
5. Perform a POST with an expired token. Expect 401 with **no replay** of the mutation.
6. Sign in with a wrong password and with a non-existent email. Expect the **same** generic message and no
   distinction in status, timing copy, or field errors.

Evidence to record: request path, HTTP status, UI state, and whether any private row was rendered.

## 7. Scenario 2 — First owner bootstrap

Creation authority is defined server-side as: an existing, non-banned Auth account under the per-user workspace
ceiling, creating a **new** tenant id. No tenant id, role, or membership is accepted from the request body.
Email verification is required for invitation acceptance, not for creating one's own first workspace.

1. As `owner.a`, create `Synthetic Workspace A` from `/app/kernel/`.
2. Expect one response with `persisted: true` and a new `tenantId`.
3. Read back (read-only): the tenant has exactly one membership, `user_id = owner.a`, `role = OWNER`.
4. Expect no product is enabled and no grant/trial/subscription row exists.
5. Repeat the create request concurrently (double click). Expect either one tenant plus an idempotent read, or a
   safe conflict — never two memberships or two owners in one tenant.
6. As `member.b` (before invitation), request tenant A in the URL. Expect `403` and no private data.
7. On a `NOBYPASSRLS` runtime role, expect `WORKSPACE_PROVISIONING_REQUIRED` and **no** tenant created. First-owner
   provisioning must use the approved privileged path, not a self-grant policy.

Record the exact status codes and the membership read-back.

## 8. Scenario 3 — Invitation lifecycle

Authority is re-read at acceptance time from both Kernel membership and the mapped Auth organization. Invitation
role is fixed to `member` at registration.

1. As `owner.a`, create a synthetic invitation for `member.b@example.test` with provider role `member`.
2. Register it with `POST /app/api/kernel/members/` `{operation:'register',invitationId}`. Delivery remains
   `NOT_CONFIRMED` unless the provider proves otherwise.
3. As `member.b`, open `/auth/accept-invitation/` and accept explicitly. Expect Kernel membership `MEMBER`.
4. Duplicate click / repeated POST: expect an idempotent success, no second membership, no duplicate audit event.
5. Attempt acceptance with `owner.c`: expect generic `INVALID_INVITATION` and no membership.
6. Demote or revoke the inviter, then attempt acceptance: expect `INVITER_AUTHORITY_REVOKED`.
7. Expire the invitation (provider expiry or disposable time control), then attempt acceptance:
   expect `INVITATION_EXPIRED` with the database clock, not the browser clock.
8. Reject or cancel the provider invitation, then attempt acceptance: expect `INVITATION_REVOKED`.
9. Cancel from Kernel before acceptance: expect provider status `canceled` to be required; an unconfirmed
   cancellation returns `CANCELLATION_NOT_CONFIRMED` and changes nothing.
10. After acceptance, revoke the member, then replay acceptance: expect `INVITATION_ALREADY_CONSUMED` and no
    re-grant.

Record each code and the resulting membership/audit state.

## 9. Scenario 4 — Tenant isolation and switching

1. `owner.c` creates `Synthetic Workspace B`.
2. `owner.a` switches in the selector. Expect a full reload, `aria-busy` while switching, and a backend-authorized
   dashboard for A. The selector value is never treated as authority.
3. Open `/app/kernel/?workspace=<tenant B id>` as `owner.a`. Expect `403`, private views cleared, and the selector
   reset to the caller's own membership.
4. As `owner.c`, verify no member, policy, invitation, grant, or audit row from A is visible.
5. Confirm `aigas_runtime` (or the approved runtime role) returns zero rows for the foreign tenant with
   `SET LOCAL aigas.tenant_id` and `aigas.user_id` set to the caller.

## 10. What remains blocked after this runbook

- `P0-03`/`P0-06` stay `BLOCKED` until the scenarios above are recorded on an approved environment.
- Invitation delivery is `NOT_CONFIRMED`; no email is sent by this repository.
- MFA/SSO is not implemented; only the closed-state message exists.
- Bootstrap and invitation acceptance under `aigas_runtime` require the approved `SECURITY DEFINER`/provisioning
  path described in `docs/DATA-ACCESS-AND-RLS.md`.
- No commit, push, deployment, migration, invitation, or user creation is performed by this task.

## 11. Evidence template

| Scenario | Expected | Observed | Evidence (path/status) | State |
| --- | --- | --- | --- | --- |
| Sign-in success | Session view | | | NOT RUN |
| Session expiry (GET) | 401 then signed-out | | | NOT RUN |
| Session expiry (POST) | 401, no replay | | | NOT RUN |
| Wrong password vs unknown email | Identical message | | | NOT RUN |
| First owner bootstrap | 1 OWNER, no grant | | | NOT RUN |
| Bootstrap under runtime role | `WORKSPACE_PROVISIONING_REQUIRED` | | | NOT RUN |
| Invite accept | MEMBER only | | | NOT RUN |
| Duplicate accept | Idempotent | | | NOT RUN |
| Foreign account accept | Generic rejection | | | NOT RUN |
| Inviter authority lost | `INVITER_AUTHORITY_REVOKED` | | | NOT RUN |
| Expired invitation | `INVITATION_EXPIRED` | | | NOT RUN |
| Rejected/canceled | `INVITATION_REVOKED` | | | NOT RUN |
| Cancellation unconfirmed | `CANCELLATION_NOT_CONFIRMED` | | | NOT RUN |
| Replay after revoke | `INVITATION_ALREADY_CONSUMED` | | | NOT RUN |
| Tenant B via URL as A | 403, cleared | | | NOT RUN |
