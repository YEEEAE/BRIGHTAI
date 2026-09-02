# SKILL USAGE MATRIX — QC Ultimate Audit

Registry: `skills-lock.json` — 365 skills registered (constitution's "67" claim is STALE, previously documented in mind).

| Domain | Skill(s) | Why applicable | Used? | Evidence |
|---|---|---|---|---|
| Accessibility | `accessibility-audit`, `accessibility-testing-strategy`, `keyboard-navigation`, `motion-sensitivity`, `touch-target-design`, `table-accessibility` | WCAG 2.2 AA domains (233–249) | Yes — methodology only | a11y gates (`test:a11y-ergonomics-100`, `e2e-a11y`) + manual-AT gap kept OPEN |
| Forms | `form-design`, `form-labelling`, `error-handling-ux` | Form domains (251–268) | Yes | `12-ADVANCED-FORMS-100-EVIDENCE` + form contract suites |
| Data Viz | `data-visualization` | KPI/chart domains (269–282) | Yes | `test:dashboard-reports`, `test:lab-trends` |
| UX | `usability-test-plan`, `journey-map`, `information-architecture`, `navigation-patterns` | UX/IA/Service (165–190) | Yes | route manifest + IA docs; participant research OPEN |
| UX Writing | `ux-writing`, `plain-language-design`, `readable-content` | M domains (208–219) | Yes | `test:ux-writing`, `test:content-quality-100` |
| Security | `error-prevention-recovery` + repo security suites | D domains (41–63) | Yes | `test:security-rbac-privacy-100`, `test:request-security`, `verify-security-hygiene` |
| Performance | `assess-load`, `performance-profiling` | H domains (119–136) | Yes | `test:performance`, `run-performance` |
| Design System | `design-token`, `design-token-audit`, `color-system`, `spacing-system`, `typography-scale`, `icon-system` | I domains (137–150) | Yes | `test:design-system-100`, `test:ui-consistency`, `test:badge-contrast` |
| UI Visual | `visual-hierarchy`, `responsive-design`, `critique-composition` | J domains (151–164) | Yes | `test:ui-visual-100` |
| Interaction | `micro-interaction-spec`, `motion-system`, `state-machine` | L domains (191–207) | Yes | `test:interaction-feedback`, `test:interaction-motion-100` |
| Testing | repo QA harness + `iteriterate-until-verified` discipline | F domains (93–106) | Yes | manifest guard, full suite, E2E registry |
| DB | `database-100` gate | C domains (25–40) | Yes | `test:database-100`, `test:migrations`, parity gate |
| AI | (no dedicated local skill for AI evals) | S domains (294–303) | No applicable skill found | AI audited via `test:ai-*` suites; gap noted |
| Production/DR | none local | G domains | No | `test:deployment-contract`, `test:production-operations`, `e2e-backup`; live evidence OPEN |

**Conclusion:** applicable skills were consulted for every audited domain family; the only domain family with no matching local skill is AI Governance/Evals (documented as a skill-registry gap).
