# PROMPT FINAL — INDEPENDENT 100% RE-AUDIT & RELEASE SIGN-OFF

TASK ID:
QC-REMEDIATION-FINAL

PRIORITY:
P0 (INDEPENDENT VERIFICATION GATEWAY)

ROLE:
Lead Independent Systems Auditor, Chief Quality Inspector, Software Validation Director.

DEPENDS ON:
GATE D (All implementation prompts PROMPT-00 to 13, Human Prompts H1 to H5, and External Prompts E1 to E4).

BLOCKS:
PRODUCTION RELEASE GO-LIVE.

SOURCE FINDINGS:
All 100 Domains from `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/QC-TASK-MANAGER-ULTIMATE-100-PERCENT-AUDIT.md`.

MISSION:
Perform a completely independent, rigorous, zero-trust re-audit of the entire QC Task Manager system across all 100 mandatory domains from scratch. Evaluate all 400 binary criteria against the current finalized working tree, inspect all generated remediation evidence files, reject stale or unsupported claims, recalculate all strict and maturity percentages, and issue the authoritative final release verdict: GO / CONDITIONAL GO / NO-GO.

CURRENT-REALITY REQUIREMENT:
Before starting:
* read `.agents/mind/01-mind-latest.md`
* read original audit report (`QC-TASK-MANAGER-ULTIMATE-100-PERCENT-AUDIT.md`)
* freeze final HEAD (`git rev-parse HEAD`)
* freeze final git status (`git status --porcelain=v1`)
* read all evidence files in `audit/qc/QC-Task-Manager/Remediation/Evidence/`
* inspect final source code independently.

MANDATORY SOURCE INSPECTION:
- Full repository working tree across `apps/qc-task-manager/`.
- All 115 routes in `src/pages/`.
- All 39 database migrations and catalog schema.
- All 74 canonical test scripts and 28 canonical E2E suites.
- All evidence files in `audit/qc/QC-Task-Manager/Remediation/Evidence/`.

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/audit-reference-originality/SKILL.md`

STRICT INDEPENDENT AUDITOR RULES:
1. DO NOT FIX ISSUES DURING FINAL VERIFICATION. If a defect remains, report it factually.
2. DO NOT ASSUME PREVIOUS REMEDIATION SUCCEEDED. Re-run every verification command yourself.
3. Reject any "PASS" or "100%" claim that lacks concrete, reproducible evidence.
4. Any domain requiring human or external validation that lacks signed evidence forms MUST be scored OPEN or BLOCKED.

EXECUTION PROTOCOL:
1. Run full typecheck: `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check`.
2. Run full production build: `ASTRO_TELEMETRY_DISABLED=1 pnpm build`.
3. Run full manifest check: `pnpm run test:manifest`.
4. Run all 74 canonical unit suites: assert 74/74 PASS.
5. Run all 28 canonical E2E acceptance suites: assert 28/28 PASS.
6. Verify database migration parity and catalog integrity: 39 migrations, 165 objects.
7. Verify all 13 local implementation prompt evidence files exist and substantiate their claims.
8. Verify all 5 human runbook evidence files (H1-H5) exist with real signatures/recordings.
9. Verify all 4 external operational evidence files (E1-E4) exist with real metrics.
10. Re-evaluate all 400 binary criteria across the 100 domains and calculate final scores.

FINAL RESPONSE FORMAT (EXACT):
```text
CURRENT SYSTEM STRICT SCORE: XX.XX%
CURRENT SYSTEM MATURITY SCORE: XX.XX%
LOCAL TECHNICAL READINESS: XX.XX%
QC/COMPLIANCE READINESS: XX.XX%
SECURITY READINESS: XX.XX%
UX/DESIGN READINESS: XX.XX%
ACCESSIBILITY READINESS: XX.XX%
OPERATIONAL READINESS: XX.XX%
PRODUCTION READINESS: XX.XX%

RELEASE VERDICT: GO / CONDITIONAL GO / NO-GO

CRITICAL OPEN ITEMS: N
P0: N
P1: N
P2: N
P3: N
```

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/FINAL-INDEPENDENT-REAUDIT-REPORT.md`
