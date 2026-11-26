# UI action binding register — initial, not accepted

This is a source index for the existing enterprise clients, not proof that MagicPath screens are wired or that these calls work in a target environment. All rows require browser network, identity, loading/error and tenant-isolation verification.

| Surface | Existing consumer / route | State | Remaining evidence |
|---|---|---|---|
| Kernel | `src/scripts/kernel.ts` → `/app/api/kernel/` and members/policies | source call observed | account/tenant and versioned values, errors, live network |
| Firewall | `src/scripts/firewall.ts` → `/app/api/firewall/` | source call observed | five outcomes, no egress on deny/warn/escalate, provider status |
| Human Gate | `src/scripts/human-gate.ts` → `/app/api/human-gate/` | source call observed | separate reviewers, stale/expired/replay, no implied execution |
| Risk | `src/scripts/risk-engine.ts` → `/app/api/risk-engine/` | source call observed | real asset/assessment/treatment/review linkage |
| Ledger | `src/scripts/ledger.ts` → `/app/api/ledger/events/` | source call observed | event links, verification, export and tamper cases |
| Secure Chat | `src/scripts/secure-chat.ts` → `/app/api/secure-chat/` | source call observed | model availability, guarded response and failure state |
| Self-service trial | `src/scripts/trial-home.ts` → `/app/api/trial/` | source call observed | session expiry and actual entitlement |
| Public governance | `src/scripts/governance-demo.ts` → local `src/demo/governance.mjs` | synthetic local state | network isolation and reset/history behavior |
| Registry / Policy Packs | no enterprise binding established in this review | NOT VERIFIED | identify actual authoritative service and screen, map versions |
| Developer Workbench | no contract consumer established in this review | NOT VERIFIED | derive from actual registry and verify consumers |
| Trust Center / enterprise CTA | no authenticated data binding established in this review | NOT VERIFIED | inspect actual surfaces, claims, links and session |
| MagicPath screens | not mapped in this review | NOT VERIFIED | inventory all screens and actions; no invented API |

All actions must display server-confirmed outcomes; a source import or mock is not proof of a successful server operation.
