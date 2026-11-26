# Module dependency graph — partial direct evidence

Graphify was unavailable. This is a manually checked subset, not an exhaustive cycle analysis.

| Importer | Imported capability | Evidence | Assessment |
|---|---|---|---|
| Firewall service | Kernel access, transaction, policy; Ledger writer | `src/server/firewall/service.mjs:1`–`:18` | shared enforcement and evidence |
| Firewall escalation | Human Gate core and integration | `src/server/firewall/escalation.mjs:2`–`:5` | cross-module integration |
| Human Gate service | Firewall registry; Ledger writer; Kernel | `src/server/human-gate/service.mjs:2`–`:10` | opposite module dependency exists; no proof of import cycle from these edges alone |
| Risk review | Human Gate core/integration | `src/server/risk-engine/review.mjs:2`–`:6` | integration boundary requires ownership review |
| Secure Chat integration | Kernel policy, Firewall core and Ledger | `src/server/secure-chat/integration.mjs:2`–`:8` | shared policy checks |
| Firewall guard | Secure Chat policy and Firewall provider | `src/server/firewall/guard.mjs:4`–`:6` | shared protection currently owned under Secure Chat |
| Risk assist | Secure Chat policy/model registry and Groq gateway | `src/server/risk-engine/assist.mjs:11`–`:13` | cross-module shared capability |

Do not infer a complete cycle-free graph, absence of server imports in browser bundles, or validated table ownership from this subset. Full static import and SQL inventory is outstanding.
