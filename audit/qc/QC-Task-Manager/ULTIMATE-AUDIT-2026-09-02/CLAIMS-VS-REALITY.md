# CLAIMS VS REALITY — QC Task Manager

Adjudication of historical claims against CURRENT source at HEAD `cc9185d4` (2026-09-02).

| Historical claim | Source | Current reality | Verdict |
|---|---|---|---|
| 65 canonical suites | older mind entries | 74 | STALE |
| 67 → 69 → 71 suites (progressive) | successive old reports | 74 | STALE (current manifest wins) |
| 116 file routes | mind QC-100 entries | **115** | STALE |
| 28 E2E suites | prior reports | 28 | TRUE |
| 39 migrations, embedded parity | prior reports | 39/39 sha256-verified | TRUE (reproduced) |
| 165 schema objects | prior reports | 165 match fresh DB | TRUE (reproduced) |
| Baseline 125/173 = 72.254% (HEAD 05ae8fb) | `100-PERCENT-BASELINE.md` | different HEAD; denominator must be rebuilt — not carried forward | UNPROVEN for current HEAD (replaced by fresh matrix) |
| "deployed version v2.7.x" claims | old brain snapshots | no live deployment evidence reproduced in this audit | UNPROVEN |
| Backup catch-up failure messages in `test:report-preview` fixture | mind (documented as expected) | reproduced — messages present, suite passes | TRUE |
| Constitution "67 skills" | AGENTS.md | 365 in skills-lock.json | STALE (previously documented) |
| Local untracked credential needs rotation | mind 2026-08 entry | `.claude/settings.local.json` untracked; rotation still owner-action | OPEN (external) |
| WI pages 2/3 & 3/3 sourcing gap | mind QC-100 entry | not re-verified this audit; carried as P1 | UNPROVEN → OPEN |
| "Conditional GO" launch verdict | PRE-LAUNCH-REPORT + recent mind | consistent with current findings; re-issued with fresh numbers | PARTIALLY TRUE (numbers differ) |

## Contradiction rule applied

Where two historical documents disagreed (suite counts, route counts), the **current executable manifest/route-guard** was treated as sole authority. No historical snapshot was merged as if it happened at one HEAD.
