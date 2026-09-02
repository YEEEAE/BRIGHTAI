# PROMPT E2 — PRODUCTION DISASTER RECOVERY & RTO/RPO DRILL

TASK ID:
QC-RUNBOOK-E02

TYPE:
Disaster Recovery Operational Protocol

PRIMARY ACTORS:
Database Reliability Engineer (DBRE), SRE Lead, QC Disaster Recovery Team.

DEPENDS ON:
GATE C, PROMPT-E1.

SOURCE FINDINGS:
- P1-2: Lack of live production backup restore verification (RTO/RPO drill on cloud host).
- Domains 9 (Backup / Restore / DR), 20 (Reliability), 83 (Business Continuity).

MISSION:
Execute a live, simulated disaster recovery drill on a separate isolated cloud instance: generate a production database snapshot via `VACUUM INTO`, ship the snapshot to off-site storage, restore it onto a clean host, run integrity verification, measure actual Recovery Time Objective (RTO) and Recovery Point Objective (RPO), and prove business continuity compliance.

PROCEDURE:
1. Baseline Production Snapshot:
   - Trigger automated backup: `pnpm run db:backup`.
   - Record exact backup timestamp and SHA-256 checksum.
2. Simulate Catastrophic Server Loss:
   - Provision a fresh, empty target VM with no pre-existing database.
3. Restore Operation:
   - Transfer backup archive to target VM.
   - Execute restore script: `pnpm run db:restore <backup-file>`.
   - Start application on restored instance.
4. Verification & Metrics:
   - Run `PRAGMA integrity_check;` on restored database.
   - Query latest task created immediately prior to backup.
   - Measure wall-clock time from failure signal to full system restoration (Target: RTO < 15 minutes).
   - Calculate maximum potential data loss window (Target: RPO < 1 hour).

ACCEPTANCE CRITERIA:
- AC-01: Full database restore executed successfully on clean external host.
- AC-02: `PRAGMA integrity_check` returns `'ok'` with 0 errors.
- AC-03: Measured RTO < 15 minutes (Actual recorded).
- AC-04: Measured RPO < 1 hour.
- AC-05: Formal DR Drill Report archived at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-E2-DR-DRILL-EVIDENCE.md`.
