# HUMAN / EXTERNAL EVIDENCE GAPS — QC Task Manager

Items Codex **cannot** truthfully close locally. Each blocks its domain from 100% regardless of automated green.

| # | Gap | Domains affected | Class | Why not self-certifiable |
|---|---|---|---|---|
| 1 | VoiceOver (macOS/iOS) validation run | 236, O family | HUMAN | requires real AT + human perception |
| 2 | NVDA (Windows) validation run | 236, O family | HUMAN | requires real AT environment |
| 3 | 200% / 400% zoom & real-device reflow pass | 241–242, 160–161 | HUMAN | browser matrix partially automatable; perception is human |
| 4 | UAT per role (employee/supervisor/manager/admin/lab operator+reviewer) | E, K, N families | HUMAN | task success/SUS/error rates need participants |
| 5 | Disabled-user research session | 227–228, 249 | EXTERNAL | real participants |
| 6 | Independent design sign-off | I, J families | EXTERNAL | requires independent designer |
| 7 | Penetration test / independent security review | D family | EXTERNAL | adversarial validation beyond code audit |
| 8 | Production deployment evidence | 109, 114 | PRODUCTION | requires live environment |
| 9 | Production DB version + read-back | 28–40 | PRODUCTION | requires live DB access |
| 10 | Production backup/restore drill (valid backup → restore → read-back) | 38–40 | PRODUCTION | requires operator execution |
| 11 | Production RUM + Core Web Vitals field data | 135–136 | PRODUCTION | requires real traffic |
| 12 | Incident/problem drill (operator runbook execution) | 116–117 | HUMAN | drill by ops owner |
| 13 | QC/business owner final compliance sign-off | 91–92, 85–88 | EXTERNAL | regulatory ownership |
| 14 | Local credential rotation (untracked `.claude/settings.local.json`) | 59 Secrets | HUMAN (env owner) | revoke/rotate outside repo |

**Rule enforced:** none of these were marked MET anywhere in this audit. `BLOCKED/OPEN` counts as not met in every score.
