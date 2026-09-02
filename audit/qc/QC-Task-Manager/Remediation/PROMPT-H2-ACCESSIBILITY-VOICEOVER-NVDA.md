# PROMPT H2 — ACCESSIBILITY EXPERT VOICEOVER & NVDA RUNBOOK

TASK ID:
QC-RUNBOOK-H02

TYPE:
Assistive Technology Human Verification Runbook

PRIMARY ACTORS:
Certified Accessibility Specialist (IAAP CPACC / WAS) & Native Arabic Screen Reader User (VoiceOver / NVDA).

DEPENDS ON:
GATE C (PROMPT-09 Complete).

SOURCE FINDINGS:
- P1-1: Zero human verification with screen readers (VoiceOver/NVDA) in Arabic.
- Domains 26, 28, 55, 56.

MISSION:
Conduct live assistive technology evaluations using Apple VoiceOver (macOS / iOS) and NVDA (Windows) across core QC Task Manager workflows using Arabic speech synthesizers (Maged / Tariq / Laila), verifying that all information, interactive controls, and dynamic status updates are fully comprehensible and operable by blind users.

PROCEDURE:
1. Environment Configuration:
   - Test Setup 1: macOS Safari + VoiceOver (Arabic synthesizer).
   - Test Setup 2: Windows 11 Chrome + NVDA (Arabic synthesizer).
2. Key User Journeys Evaluated:
   - Login page: error announcements and field labels.
   - Dashboard: KPI summaries and data table alternatives.
   - Lab Test Entry: table navigation, input labels, error states.
   - Modal Dialogs: focus trapping, title announcement, dismissibility.
3. Verification Checklist:
   - Does screen reader announce Arabic labels in natural phrasing?
   - Are dynamic updates (`aria-live`) announced without interrupting current speech?
   - Can an analyst complete an entire test result workflow with monitor turned OFF?

ACCEPTANCE CRITERIA:
- AC-01: 100% of interactive controls announce valid accessible names and roles in Arabic.
- AC-02: Zero keyboard focus traps or silent dead-ends.
- AC-03: Complete workflow accomplished successfully with screen reader only.
- AC-04: Screen reader session recordings and transcript documented in `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-H2-SCREEN-READER-EVIDENCE.md`.
