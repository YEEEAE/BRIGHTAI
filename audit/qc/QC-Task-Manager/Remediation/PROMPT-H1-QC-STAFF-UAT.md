# PROMPT H1 — REAL QC STAFF UAT & USABILITY RESEARCH RUNBOOK

TASK ID:
QC-RUNBOOK-H01

TYPE:
Human Verification Procedure / UAT Protocol

PRIMARY ACTORS:
8 Real QC Staff Members (2 Laboratory Analysts, 2 Quality Supervisors, 2 Quality Managers, 1 Systems Admin, 1 QA Auditor).

DEPENDS ON:
GATE C (All Local Implementation Prompts Complete).

SOURCE FINDINGS:
- P1-3: Pilot user research and UAT plan (`9-PILOT-UX-RESEARCH.md`) unexecuted on live participants.
- Domains 1, 22, 23, 37, 38, 66, 67.

MISSION:
Execute the formal User Acceptance Testing (UAT) and Pilot Usability Protocol with 8 real QC practitioners under simulated working conditions, measure task success rate, record time-on-task, compute System Usability Scale (SUS) scores, and produce signed acceptance records.

PROCEDURE:
1. Participant Onboarding & Briefing (10 mins):
   - Review participant rights, ethical consent, and test environment setup.
2. Scenario Execution (45 mins per participant):
   - Scenario A (Analyst): Login -> Navigate to Lab -> Record Sample Results -> Submit for Review.
   - Scenario B (Supervisor): Review pending test -> Inspect out-of-spec result -> Raise Finding -> E-sign approval.
   - Scenario C (Manager): Filter dashboard metrics -> Review deletion request -> Export Certificate of Analysis PDF.
   - Scenario D (Admin): Create new user role -> Verify permission boundary -> Run database backup check.
3. Quantitative Measurement:
   - Record completion time for each scenario.
   - Log unassisted task success (Target: >= 90%).
   - Administer standard 10-item System Usability Scale (SUS) questionnaire (Target: SUS >= 80).
4. Qualitative Debrief:
   - Identify points of friction, confusing microcopy, or workflow hesitations.

ACCEPTANCE CRITERIA:
- AC-01: 8 participants completed all assigned scenarios.
- AC-02: Overall task success rate >= 90%.
- AC-03: Mean SUS score >= 80 (Grade A usability).
- AC-04: Signed UAT completion forms archived.
- AC-05: Formal UAT findings report written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-H1-UAT-EVIDENCE.md`.
