# PROMPT 00 — REMEDIATION BASELINE & ENVIRONMENT FREEZE

TASK ID:
QC-REMEDIATION-000

PRIORITY:
P0

ROLE:
Principal Systems Architect, DevOps/SRE Lead, Quality Assurance Director.

DEPENDS ON:
NONE.

BLOCKS:
PROMPT-01 through PROMPT-13, and all subsequent remediation gates.

SOURCE FINDINGS:
Section 2 (Current Reality Freeze) and Section 3 (Methodology) from `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/QC-TASK-MANAGER-ULTIMATE-100-PERCENT-AUDIT.md`.

AFFECTED DOMAINS:
Domain 1 (Quality Engineering), Domain 31 (Deployment / Release Engineering), Domain 32 (Configuration Management), Domain 80 (Environment Management).

MISSION:
Freeze the remediation working tree baseline, verify all environment prerequisites, validate that the exact HEAD commit matches expectations, record clean filesystem status, confirm dependencies, and establish the persistent audit tracking directory for the remediation program.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read assigned audit findings in `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/CURRENT-REALITY-FREEZE.md`
* record HEAD (`git rev-parse HEAD`)
* record git status (`git status --porcelain=v1`)
* inspect current implementation
* verify findings still exist.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/scripts/route-manifest.mjs`
- `apps/qc-task-manager/src/lib/migrationRegistry.ts`

MANDATORY SKILLS:
Read and strictly adhere to:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/team-workflow/SKILL.md`

REQUIREMENTS:
1. Verify runtime environment: Node.js (>= v20), pnpm (>= 9), and macOS ARM64 environment.
2. Verify that `pnpm run test:manifest` executes and validates 74 canonical test scripts and 28 canonical E2E suites with 0 orphans.
3. Verify that `scripts/route-manifest.mjs --check` passes with exactly 115 file routes and 25 middleware protected routes.
4. Establish the dedicated remediation evidence log directory: `audit/qc/QC-Task-Manager/Remediation/Evidence/`.

NON-NEGOTIABLE BUSINESS RULES:
- NO GIT PUSH, NO FORCED COMMIT without explicit user authorization.
- Zero product source code modification in Phase 0.

IMPLEMENTATION REQUIREMENTS:
- Produce an immutable baseline record capturing git commit, node version, pnpm version, route manifest checksum, and database schema object count (165 objects).

DO NOT:
- Do NOT modify product code.
- Do NOT bypass `test:manifest` guards.
- Do NOT ignore any dirty files in git status.

TEST-FIRST / DEBUGGING REQUIREMENT:
Run baseline inspection scripts and assert their exact exit codes before permitting Phase 1 execution.

TEST QUALITY REQUIREMENT:
Direct execution of canonical verification scripts; do not infer status from cached logs.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:manifest`
- `node scripts/route-manifest.mjs --check`
- `pnpm run test:embedded-migration-parity`
- `pnpm run test:schema-reference`

REQUIRED BROWSER TESTS:
None for Phase 0.

REQUIRED DATABASE TESTS:
- Schema reference parity against catalog (165 objects).

REQUIRED SECURITY TESTS:
- Verify absence of uncommitted secret files.

REQUIRED ACCESSIBILITY TESTS:
None for Phase 0.

REQUIRED ROLE TESTS:
None for Phase 0.

REQUIRED NEGATIVE TESTS:
- Attempting to run unlisted test scripts must fail the manifest guard.

REGRESSION REQUIREMENT:
Ensure working tree is strictly accounted for.

ACCEPTANCE CRITERIA:
- AC-01: Environment verified (Node >= 20, pnpm >= 9, ASTRO_TELEMETRY_DISABLED=1).
- AC-02: `test:manifest` passes with 74 unit suites, 28 E2E suites, 0 orphans.
- AC-03: `route-manifest --check` passes with 115 file routes.
- AC-04: Migration parity verified (39/39 sha256 byte-identical).
- AC-05: Schema reference verified (165 catalog objects).
- AC-06: Baseline evidence file generated at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-00-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-00-EVIDENCE.md` containing:
- HEAD before & after
- Environment dump
- Exact command outputs
- Criteria matrix

FINAL VERIFICATION:
Execute `pnpm run test:manifest` and `node scripts/route-manifest.mjs --check`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: X/Y
Tests: ...
Remaining: ...
