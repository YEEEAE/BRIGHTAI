# Final Evidence Ledger — 2026-09-01

## Baseline

| Item | Evidence |
|---|---|
| HEAD | `77bf18b6592dbb91ddace645347b4e893efbabea` |
| Working tree | `git status --porcelain` clean output; fsmonitor emitted environment error |
| Runtime | Node v22.22.3, pnpm 10.19.0 |
| Application | Astro SSR + Node + SQLite |

## Fresh commands

| Command | Result |
|---|---|
| `typecheck` | PASS, 0 errors/0 warnings/27 hints |
| `build` | PASS, exit 0; Vite warnings only |
| `test:manifest` | PASS, 65 unit + 28 E2E |
| `test:route-manifest` | PASS, 116/25/6 |
| `test:embedded-migration-parity` | PASS, 39/39 |
| `test:schema-reference` | PASS, 165 objects |
| `test:badge-contrast` | PASS |
| `verify-security-hygiene` | PASS |
| `test:deployment-contract` | PASS, 22 |
| `test:production-operations` | PASS |
| `pnpm test` | PASS, final aggregate: 65 canonical suites |
| `e2e:acceptance` sandbox | BLOCKED before journeys: localhost listen EPERM |
| `e2e:acceptance` escalated | PASS, all suites + restart persistence; final marker captured |

Acceptance aggregate: 30/30 suites (28 canonical + 2-phase restart persistence), 3059+ passed assertions, 0 failed; one or more suite outputs were not machine-parsable for an exact total, so the lower bound is reported honestly.

## Findings

| ID | Severity | Finding | Closure |
|---|---|---|---|
| P1-001 | P1 | Local untracked credential-like value | Manual revoke/rotate + clean local settings |
| P1-002 | closed | Sandbox-only localhost permission issue | Permitted runner final marker |
| P2-001 | P2 | Human UAT absent | Human action |
| P2-002 | P2 | Live deployment absent from evidence | Operator action |
| P2-003 | P2 | 67 vs 365 skill count drift | Docs prompt |
| P2-004 | P2 | WI source pages 2/3 and 3/3 missing | Source owner action |
| P3-001 | P3 | 27 typecheck hints | Maintenance backlog |
| P3-002 | P3 | Vite import warnings | Maintenance backlog |
| P3-003 | P3 | Suggestions endpoint ownership unclear | Owner decision |
