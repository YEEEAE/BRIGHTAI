# Integration edges — reviewed subset

| Producer → consumer | Data / interface | State and error | Authorization | Evidence | Status |
|---|---|---|---|---|---|
| Firewall route → service | POST guarded-executions → `handle(..., 'enforce')` | request validation/error contract | handler authenticates | `src/pages/app/api/firewall/guarded-executions.ts:2`, `src/server/firewall/http.mjs:34` | source observed |
| Firewall → Kernel policy | operation, resource, department | non-ALLOW denies; unavailable 503 | tenant/product access | `src/server/firewall/service.mjs:202` | source observed; target runtime unverified |
| Firewall → Human Gate | decision, request, policy and metadata fingerprint | ESCALATE creates review if available; no provider resume | tenant, product access | `src/server/firewall/escalation.mjs:38`, `src/server/human-gate/service.mjs:397` | partial; payload binding gap |
| Firewall → Ledger | decision metadata | required evidence failure rolls back | transaction tenant scope | `src/server/firewall/service.mjs:270` | source observed; policy determines requirement |
| Risk → Human Gate | assessment review | review only, no execution permit | access and review authority | `src/server/risk-engine/review.mjs:9`, `src/server/human-gate/service.mjs:374` | partial; full lifecycle unverified |
| Secure Chat → Kernel/Firewall | message context, effective policies | DENY/WARN/ESCALATE block; REDACT followed by recheck | authenticated tenant/product | `src/server/secure-chat/integration.mjs:12` | source observed; no approval resume |
| Secure Chat → provider | protected frozen input | bounded call; unknown result reserved; no auto retry | model approval, quota, access and policy | `src/server/secure-chat/service.mjs:217`–`:280` | provider not tested |
| Secure Chat → output policy | reply rechecked before disclosure | failure hides reply, provider may have consumed | access revalidated | `src/server/secure-chat/service.mjs:34`, `:253` | source observed; live unverified |
| Public demo → local governance | synthetic session | local demo; no enterprise proof | session scope, no enterprise entitlement | `src/demo/governance.mjs`, `src/scripts/governance-demo.ts` | isolation needs full review |

Not an exhaustive import, SQL, grant or UI binding inventory. See `docs/PRODUCT-INTEGRATION-MATRIX.md` for prior detailed paths; reverify each before acceptance.
