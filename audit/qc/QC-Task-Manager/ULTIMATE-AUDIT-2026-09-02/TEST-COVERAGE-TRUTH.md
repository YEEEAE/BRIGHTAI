# TEST COVERAGE TRUTH — QC Task Manager (HEAD cc9185d4)

Authority: `scripts/test-manifest.mjs` + `scripts/e2e-registry.mjs`, enforced by `test-manifest-guard.mjs` (passed 2026-09-02).

## Registry truth

| Class | Count | Notes |
|---|---|---|
| Canonical test suites | **74** | registered, runnable, wired into `run-full-tests.mjs` |
| Meta suites | 3 | manifest/route guards etc. |
| Classified non-runnable test scripts | 4 | explicitly classified, not silently skipped |
| Canonical E2E suites | **28** | wired into `e2e-acceptance.mjs` |
| Classified E2E scripts | 4 | explicit |

## Execution truth (this date)

- Fast gates: typecheck, manifest, route-manifest, schema-reference, migrations, embedded parity, security-hygiene → all exit 0.
- Full 74-suite unit run: executed — see final audit report for exact pass/fail and duration.
- E2E acceptance (production build + 28 suites): executed — see audit report.

## Contract vs behavior separation (critical)

The suite fleet is dominated by **source-contract guards** (e.g., `test-ui-consistency`, `test-a11y-ergonomics-100`, `test-ux-writing` assert attributes/strings/structures in source) versus **behavioral tests** (DB lifecycle suites, API contract, E2E browser runs, delete-durability, backup/restore read-back).

| Truth class | Examples | Strength |
|---|---|---|
| Behavioral, DB-level | migrations, delete-durability, lab lifecycle suites, api-contract | Strong — proves runtime |
| Behavioral, browser | 28 E2E suites | Strong for covered flows; NOT all 115 routes |
| Source-contract | a11y-100, ui-visual-100, ux-writing, design-system-100 | Proves code structure, NOT runtime perception |
| Diagnostic tools | `run-performance`, `db-doctor` | Measurement only; no pass/fail budget gate for p50/p95 |

## Skipped / weakened test scan

- `grep skip` hits: `test-db-rules.mjs` (1), `test-lab-repeat-failures.mjs` (2), `test-scheduled-notifications.mjs` (4) — each reviewed as legitimate fixture/timing guards, none disables an assertion to force PASS. Zero `test.skip`/`todo` suites found.
- Known fixture noise: `[backup] catch-up run failed SqliteError` inside `test:report-preview` — documented expected fixture behavior; suite passes. Flagged as P2 cosmetic-noise debt.

## Gaps (carried to gap matrix)

1. No p50/p95/max numeric performance **budget gate** wired as pass/fail (P1).
2. E2E covers sampled flows; 115-route visual matrix not executable automatically (P1, HUMAN/browser class).
3. AI evals exist as foundation suites, but no model-behavior eval harness with golden datasets (P2).
