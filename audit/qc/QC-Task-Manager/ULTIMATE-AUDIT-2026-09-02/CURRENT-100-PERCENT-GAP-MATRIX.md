# CURRENT 100 PERCENT GAP MATRIX — only OPEN criteria

HEAD `cc9185d4` · 2026-09-02 · 131 OPEN criteria across 300 applicable.

## P0 — release blockers (3)

| ID | Domains | Issue | Source | Proof needed | Dependency | Owner |
|---|---|---|---|---|---|---|
| P0-1 | 129, 200, 213 | `test:observability` FAILS: gate expects stale copy "Something went wrong. Please try again." while product returns improved "We couldn't complete the request. The save state is unknown. Check the record before trying again." | `scripts/test-observability.mjs:18` vs live source | Determined root cause (stale test expectation — product copy is correct per UX-writing rules), fix TEST layer, add regression, suite green | none | Codex (EP-01) |
| P0-2 | 233–249 | `test:a11y-ergonomics-100` FAILS: required `A11Y-ERGONOMICS-100-EVIDENCE.md` missing beside gate. Commit `ba29fb7e` moved it to Evidences/; later user-approved consolidation removed the last on-disk copy (content preserved in combined pack) | gate line 70-71; `git show ba29fb7e` | Evidence file restored beside gate (recoverable via `git show ba29fb7e^:apps/qc-task-manager/A11Y-ERGONOMICS-100-EVIDENCE.md`), suite green | none | Codex (EP-02) |
| P0-3 | 102, 103, 205, 206, 214 + blocks 23 E2E suites | `e2e:delete-request` FAILS: dialog button "Confirm deletion" never appears (Playwright timeout 30s) — destructive-delete confirmation flow broken at browser level; acceptance runner aborts, 23 remaining E2E suites BLOCKED | `scripts/e2e-delete-request.mjs:196` | Diagnose product vs selector, fix correct layer, full e2e:acceptance green (28/28) | none | Codex (EP-03) |

## P1 — required before production-quality claim (grouped)

| Gap | Domains | Priority | Affected | Proof needed | Owner |
|---|---|---|---|---|---|
| WI pages 2/3 & 3/3 sourcing | 082 | P1 | lab documents | sourced content verified | Codex+QC owner |
| No numeric performance budget gate (p50/p95/max/payload) | 120, 122 | P1 | run-performance | pass/fail budgets in CI | Codex (EP-08) |
| CSRF dedicated gate absent | 054 | P1 | api-security | contract suite | Codex (EP-04) |
| KPI contract gaps (duplicates, denominators, targets, deltas, hierarchy) | 271, 273, 274, 276–278 | P1 | dashboard pages | KPI contract gate green | Codex (EP-07) |
| Accessible chart alternatives incomplete | 246, 281 | P1 | charts | every chart has HTML table equivalent | Codex (EP-07) |
| Form contract not universal (data-qc-form, aria-describedby, schema/UI parity, drafts/dirty/expiry) | 251, 255–256, 258–266 | P1 | 51 form files | unified mutation contract + suites | Codex (EP-05) |
| Arabic PDF diagnostic failures | 288 | P1 | pdf writer | diagnostics green without assertion weakening | Codex (EP-06) |
| No lint / error-architecture / maintainability gates | 015, 020–022 | P1 | src | gates added | Codex (EP-04) |
| Requirements registry + traceability | 003–007 | P1 | docs | registry created | Product owner |
| Threat model + CSRF + AI governance/evals artifacts | 044, 294, 297–298 | P1 | docs+tests | artifacts + gates | Codex+owner |

## P2 — quality/usability

- Domain-driven boundaries + module ownership map (010, 013).
- Data lineage + MDM registry (035, 036).
- Legacy design-debt no-regression budget (150).
- Stale-data/conflict guard (203).
- AI copy, fallback, explainability gates (296, 300, 303).
- Backup catch-up fixture noise cleanup (test:report-preview).
- i18n readiness gate (219).

## HUMAN/EXTERNAL/PRODUCTION block (cannot be closed by Codex)

All of: requirements/governance sign-offs (001–002, 005, 091–092, 118), UAT & research with participants (165–167, 170, 172, 174, 182–184, 220–232), screen readers & zoom & real devices (233, 236, 241–242, 247–249, 260, 268), visual/product design sign-off (151–153, 155, 160–161, 164, 289), secrets rotation (059), privacy UX (062), secure-SDLC external review (043), production deployment/DB/DR/RUM/CWV/BCP/incident/problem (109, 114–117, 126, 135–136), CSV protocol (104).
