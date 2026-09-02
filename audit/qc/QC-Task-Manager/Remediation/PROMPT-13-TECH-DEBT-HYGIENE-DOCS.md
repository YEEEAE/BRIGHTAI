# PROMPT 13 — TECHNICAL DEBT, HYGIENE & DOCUMENTATION GOVERNANCE

TASK ID:
QC-REMEDIATION-013

PRIORITY:
P3 (Hygiene, Consistency & Single Source of Truth)

ROLE:
Principal Software Quality Engineer, Documentation Architect, Code Hygiene Specialist.

DEPENDS ON:
PROMPT-09, PROMPT-10, PROMPT-11, PROMPT-12.

BLOCKS:
GATE C.

SOURCE FINDINGS:
- P3-1: Trailing whitespace in documentation files (`prompt10.md`, etc.).
- Audit Sections 10, 22, 23, 31, 33, 85, 86, 88.

AFFECTED DOMAINS:
Domain 33 (Maintainability / Code Quality), Domain 85 (Developer Experience), Domain 86 (Technical Debt Management), Domain 88 (Content Design & Terminology).

MISSION:
Eliminate residual technical debt, clean up trailing whitespace across documentation files, reconcile historical documentation with current implementation reality, ensure `01-mind-latest.md` remains the authoritative project mind, and verify that `astro check` and `pnpm build` pass with 0 errors, 0 warnings, and 0 hints.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P3-1
* inspect git diff and untracked files
* run `git status`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/docs/`
- `apps/qc-task-manager/prompt10.md` (and related prompt files)
- `.agents/mind/01-mind-latest.md`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/better-writing/SKILL.md`

REQUIREMENTS:
1. Documentation Whitespace & Formatting Hygiene (P3-1):
   - Scan all Markdown files in `apps/qc-task-manager/` and remove trailing whitespace.
   - Ensure consistent Unix LF line endings.
2. Single Source of Truth Alignment:
   - Ensure `apps/qc-task-manager/docs/` accurately documents current architecture (Astro SSR + SQLite WAL + better-sqlite3) and does not reference deprecated stacks.
3. Code Quality & Type Safety:
   - Run `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check`: assert 0 errors, 0 warnings, 0 hints across all files.
   - Run `ASTRO_TELEMETRY_DISABLED=1 pnpm build`: assert clean standalone production build in < 8s.
4. Repository Hygiene:
   - Verify `.gitignore` prevents temporary files, sqlite WAL files (`*.db-wal`, `*.db-shm`), or test artifacts from being tracked.

NON-NEGOTIABLE BUSINESS RULES:
- Never delete architectural decision records (ADRs) or compliance documentation.
- Maintain Rule 0: `01-mind-latest.md` must be updated with exact factual summary.

IMPLEMENTATION REQUIREMENTS:
- Zero formatting churn in unrelated files.

DO NOT:
- Do NOT disable TypeScript strict checks or `@ts-ignore` to silence errors.

TEST-FIRST / DEBUGGING REQUIREMENT:
Run whitespace check script -> identify trailing spaces in `prompt10.md` -> clean up -> assert clean.

TEST QUALITY REQUIREMENT:
Automated linter and typecheck verification.

REQUIRED AUTOMATED TESTS:
- `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check`
- `ASTRO_TELEMETRY_DISABLED=1 pnpm build`
- `pnpm run test:manifest`

REQUIRED BROWSER TESTS:
None for hygiene prompt.

REQUIRED DATABASE TESTS:
None for documentation prompt.

REQUIRED SECURITY TESTS:
- Verify no secrets or sensitive tokens are stored in documentation files.

REQUIRED ACCESSIBILITY TESTS:
None.

REQUIRED ROLE TESTS:
None.

REQUIRED NEGATIVE TESTS:
- Introduce syntax error in draft file -> verify typecheck catches it.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Trailing whitespace removed from all documentation files.
- AC-02: `astro check` reports 0 errors, 0 warnings, 0 hints.
- AC-03: Production standalone build completes cleanly.
- AC-04: Documentation accurately reflects current architectural reality.
- AC-05: `.gitignore` protects repository from runtime artifacts.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-13-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-13-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm astro check` and `pnpm build`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...
