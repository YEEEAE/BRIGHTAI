# PROMPT E4 — INCIDENT RESPONSE & AUTOMATED ROLLBACK DRILL

TASK ID:
QC-RUNBOOK-E04

TYPE:
Incident Management & Rollback Protocol

PRIMARY ACTORS:
On-Call SRE, Release Manager.

DEPENDS ON:
GATE C, PROMPT-E1.

SOURCE FINDINGS:
- Domains 82 (Incident Management), 83 (Business Continuity), 31 (Release Engineering).

MISSION:
Simulate a critical post-deployment failure (e.g. faulty migration or application crash loop), execute the automated rollback runbook, restore traffic to the prior known-good deployment within 5 minutes, and verify post-incident audit logging.

PROCEDURE:
1. Deploy intentionally broken version to staging slot.
2. Trigger automated health check failure detection.
3. Execute rapid rollback command to previous build artifact.
4. Verify database schema compatibility during backward rollback.
5. Complete standard Post-Incident Review (PIR) document.

ACCEPTANCE CRITERIA:
- AC-01: Failure detected and alerted within 60 seconds.
- AC-02: Rollback completed and healthy traffic restored in < 5 minutes.
- AC-03: Zero permanent database corruption.
- AC-04: PIR document archived at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-E4-INCIDENT-ROLLBACK-EVIDENCE.md`.
