# API contract register — generated index, review incomplete

Source: `src/server/api/routes.mjs`, `request-schemas.mjs`, `response-schemas.mjs`; HEAD `d42f658c7543024025ba8f8c9416a8bebd37d8fe`. This inventory does not verify handler authorization, per-operation side effects, consumers, version binding or deployment. HEAD inherits GET schema. See `docs/API-CONTRACT.md` for existing detailed semantics. Cells marked pending require manual verification; they must not be treated as absent or accepted.

| Route | Methods | Success schema keys present | Request/auth/scope/side effects/consumer |
|---|---|---|---|
| `/app/api/firewall/evaluate/` | POST | POST: yes | pending |
| `/app/api/firewall/guarded-executions/` | POST | POST: yes | pending |
| `/app/api/firewall/rules/` | GET, HEAD, POST, PATCH, DELETE | GET: yes, HEAD: yes, POST: yes, PATCH: yes, DELETE: yes | pending |
| `/app/api/human-gate/delegations/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/human-gate/delegations/[delegationId]/revoke/` | POST | POST: yes | pending |
| `/app/api/human-gate/policy/` | POST | POST: yes | pending |
| `/app/api/human-gate/requests/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/human-gate/requests/[requestId]/cancel/` | POST | POST: yes | pending |
| `/app/api/human-gate/requests/[requestId]/decide/` | POST | POST: yes | pending |
| `/app/api/human-gate/requests/[requestId]/execute/` | POST | POST: yes | pending |
| `/app/api/kernel/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/kernel/health/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/kernel/invitations/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/kernel/pilot-report/` | POST | POST: yes | pending |
| `/app/api/kernel/members/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/kernel/policies/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/kernel/products/` | PATCH | PATCH: yes | pending |
| `/app/api/kernel/trials/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/kernel/trials/[trialId]/cancel/` | POST | POST: yes | pending |
| `/app/api/kernel/trials/[trialId]/submit/` | POST | POST: yes | pending |
| `/app/api/ledger/events/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/ledger/events/[eventId]/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/ledger/events/[eventId]/export/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/ledger/events/[eventId]/verify/` | POST | POST: yes | pending |
| `/app/api/operator/trials/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/operator/trials/[trialId]/activate/` | POST | POST: yes | pending |
| `/app/api/operator/trials/[trialId]/close/` | POST | POST: yes | pending |
| `/app/api/operator/trials/[trialId]/decide/` | POST | POST: yes | pending |
| `/app/api/operator/trials/[trialId]/expire/` | POST | POST: yes | pending |
| `/app/api/risk-engine/actions/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/risk-engine/assets/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/risk-engine/assets/[assetId]/` | PATCH, DELETE | PATCH: yes, DELETE: yes | pending |
| `/app/api/risk-engine/assets/[assetId]/assessments/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
| `/app/api/risk-engine/assets/[assetId]/revisions/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/risk-engine/assets/[assetId]/treatments/` | GET, HEAD, POST, PATCH | GET: yes, HEAD: yes, POST: yes, PATCH: yes | pending |
| `/app/api/risk-engine/assist/` | POST | POST: yes | pending |
| `/app/api/risk-engine/export/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/secure-chat/messages/` | POST, DELETE | POST: yes, DELETE: yes | pending |
| `/app/api/secure-chat/models/` | GET, HEAD | GET: yes, HEAD: yes | pending |
| `/app/api/trial/` | GET, HEAD, POST | GET: yes, HEAD: yes, POST: yes | pending |
