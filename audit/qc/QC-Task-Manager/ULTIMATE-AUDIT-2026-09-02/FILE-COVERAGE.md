# FILE COVERAGE — QC Ultimate Audit

**Scope:** `apps/qc-task-manager/` — HEAD `cc9185d4`.

## Inspection depth classes

- **R (Read):** file read fully or its governing logic inspected.
- **G (Gate):** file behavior directly proven by an executed AUTO gate on this date.
- **I (Inventory):** file counted/jenumerated only (existence, size, route classification).

## Coverage summary

| Area | Files | Depth | Method |
|---|---|---|---|
| `package.json` scripts (100+ gates) | 1 | R | full read |
| `scripts/test-manifest.mjs`, `test-manifest-guard.mjs`, `e2e-registry.mjs` | 3 | R | full read (drift guard logic verified) |
| `scripts/route-manifest.mjs` output | — | G | 115/25/6 verified |
| `db/migrations/*` | 39 | G | migration test + embedded sha256 parity |
| `db/schema.sql` / schema reference | 165 objects | G | fresh-DB comparison passed |
| `src/pages/**` | 76 | I + G | route manifest classified; visual/behavior per-route NOT individually browser-verified (OPEN) |
| `src/lib/**` (306 ts/astro total) | ~200 | G/I | exercised indirectly via 74 canonical suites |
| `src/lib/ai/**`, `aiAudit.ts`, `aiQcContext.ts` | — | G | `test:ai-foundation/features/lab` executed |
| `docs/**` | 30 | I | titles + selected claims cross-checked in CLAIMS-VS-REALITY |
| `README.md` (868 lines) / `SECURITY.md` (104) | 2 | R | read |
| Historical evidence pack (17→1 merged file, 2614 lines) | 1 | R | read; claims adjudicated in CLAIMS-VS-REALITY |
| `.agents/mind/01-mind-latest.md` (1339 lines) | 1 | R | full read per Rule Zero |
| `skills-lock.json` + `.agents/skills/` | 365 skills | I | count + structure verified |

## Honest coverage statement

- 100% of **registry/manifest/migration/schema** surfaces: directly verified this date.
- 100% of **74 canonical suites**: executed this date (see audit report for final counts).
- **Per-route browser-level visual/UX verification** of all 115 file routes: NOT performed — covered only by contract suites and sampled E2E (28 suites). This coverage gap is carried into the gap matrix (P1) and cannot be self-certified.
