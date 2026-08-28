# QC Task Manager — UX Research Program

Status: ready to run; no participant findings have been collected yet · 2026-08-28

This program validates the redesigned QC Task Manager with realistic, role-based
work. It complements `UX-USABILITY-TEST-PLAN.md`, `PILOT-UAT.md`,
`UX-MEASUREMENT.md`, and `SERVICE-BLUEPRINT.md`. It does not replace server-side
RBAC, workflow policy, audit integrity, CSRF protection, or domain tests.

## Research questions

### Cross-role questions

1. Can the participant identify the next permitted action and its owner?
2. Can they tell the difference between saved, submitted, under review, rejected,
   approved, blocked, and failed states?
3. Can they recover from validation errors, zero results, expired sessions, or a
   returned record without losing work or taking an unsafe action?
4. Can they use the interface at 360px and 1440px, with keyboard navigation and
   visible focus?
5. Which labels, locations, or handoff details cause avoidable assistance or delay?

### Segment-specific questions

| Segment | Questions to answer |
|---|---|
| Employee | Can they create, save, resume, complete, and submit their own work? Do they understand ownership, evidence gates, and return-for-changes? |
| Supervisor | Can they find team attention items, review without self-review, return work with an actionable reason, and track the next owner? |
| Manager | Can they approve with e-signature, review change requests, investigate failures/calibration risk, and generate an appropriately scoped report? |
| Lab operator/reviewer | Can they enter a test from the reference data, preserve a draft, review samples/evidence, and distinguish human decisions from AI advisory output? |
| Admin | When administrative UX is in scope, can they manage users, roles, health, and backup procedures without confusing administration with QC workflow authority? |

## Participant plan and criteria

Recruit participants who perform the role in their normal QC work; do not ask one
person to represent multiple roles in the analysis. Use anonymized IDs (`EMP-01`,
`SUP-01`, etc.) and synthetic seeded records only.

| Segment | Target | Required experience | Exclusions |
|---|---:|---|---|
| Employee | 5–8 | Performs assigned QC tasks or lab data entry; has used the current process at least twice | Product owner, implementer, or facilitator |
| Supervisor | 5–8 | Reviews team work and returns or escalates records | Direct manager of the research team |
| Manager | 5–8 | Approves QC work, owns risk/reporting, or manages change requests | Anyone who designed the tested screens |
| Lab operator/reviewer | 5–8 | Enters or reviews laboratory tests, samples, equipment, calibration, or documents | Participants without relevant lab workflow exposure |
| Admin | 5–8 when admin UX is tested | Manages users, access, system health, or backup process | Include only if administrative UX is in scope |

Run one pilot per active segment before scaling. Five to eight participants is a
target, not a claim about statistical significance. Stop a segment early only
when new sessions stop producing materially new workflow findings and document
the reason.

## Method and session script

Use a moderated, task-based session with think-aloud. Recommended duration is
45–60 minutes: 5 minutes consent/context, 30–40 minutes tasks, and 5–10 minutes
debrief. The facilitator must not teach the interface during the measured task.

### Introduction and consent — 2–3 minutes

> We are evaluating the product, not you. We want to understand how this work
> feels in a realistic QC scenario. Please think aloud and tell us what you
> expect to happen. We will use synthetic records only. You may skip a question
> or stop at any time. With your permission, we will take notes and record the
> session; the recording is restricted to the research team and will be deleted
> according to the agreed retention plan.

Confirm: role, anonymized participant ID, consent, recording choice, device,
browser, viewport, keyboard/screen-reader needs, and test environment.

### Warm-up — 3–5 minutes

- Tell me about your role in the QC process.
- Think about the last time you completed this kind of work. What were you
  trying to accomplish?
- What information do you need before you can safely hand work to the next role?
- What do you currently use when a record is returned, missing evidence, or hard
  to find?

### Core probes — 8–10 minutes

Use only as needed; keep them neutral:

- What would you do next, and what tells you that?
- What did you expect to happen here?
- How would you check that the change was saved?
- What would you do if this action were unavailable?
- Who do you think owns the next step?
- Tell me more about that.
- What happened next in your current process?

Do not ask leading questions such as “Was that easy?” or “Do you like this
design?” Ask “How easy or difficult was that?” only after the task, then probe
for the observed cause.

### Task briefing

Give the participant a role-appropriate scenario goal, not click instructions.
Read the task text once, then start the timer. Do not reveal the expected route,
button, status, or answer.

## Task matrix

Use the smallest applicable set per segment. Each task gets a fresh synthetic
record unless the scenario explicitly tests resume or handoff.

| ID | Scenario prompt | Expected observable outcome | Primary segments |
|---|---|---|---|
| T1 Create | “You need to start the assigned QC work for today. Create the appropriate draft.” | A permitted task/test/document draft is created with the correct ownership and no invented data. | Employee, lab operator |
| T2 Save | “Enter the available synthetic information and save your work for later.” | Participant saves without submitting and can explain the saved state. | Employee, lab operator |
| T3 Resume | “Continue the work you started earlier.” | Participant locates the draft, verifies its state, and resumes without overwriting or duplicating it. | Employee, lab operator |
| T4 Submit | “The record is complete. Send it to the next role.” | Participant resolves required blockers, submits once, and explains the queue/next owner. | Employee, supervisor, lab operator |
| T5 Review | “A submitted test/document is waiting for your review. Decide what you need to inspect.” | Reviewer opens the correct record, finds evidence/status/context, and does not review their own work. | Supervisor, lab reviewer, manager |
| T6 Reject/rework | “The record needs a correction. Return it with an actionable reason.” | Participant selects the permitted return/reject action, writes a useful reason, and explains what happens next. | Supervisor, manager |
| T7 Approve | “This record is eligible for approval. Complete the approval step.” | Authorized manager uses their own current password for e-signature and understands the terminal outcome. | Manager |
| T8 Search | “Find the specified synthetic test, document, equipment item, or product.” | Participant uses search/filter, recovers from zero results if encountered, and opens the useful result. | Employee, supervisor, manager, lab operator |
| T9 Investigate failure | “A test/finding has failed. Work out what needs attention and where to continue.” | Participant follows status, evidence, audit/context, and related-record links without changing an unauthorized state. | Supervisor, manager, lab reviewer |
| T10 Calibration due | “Check whether the equipment is ready and identify the next action.” | Participant distinguishes due/overdue/unknown state and opens the related calibration or maintenance record. | Manager, lab operator/reviewer |
| T11 Report/export | “Generate the report needed for this review and export it if permitted.” | Participant verifies scope, chooses the right report, and exports/prints without exposing out-of-scope records. | Manager, supervisor, admin |
| T12 Admin (optional) | “Create or update a synthetic user with the specified role, then verify the access change.” | Admin changes only permitted account settings and understands that UI hiding is not the authorization boundary. | Admin |

### Wrap-up — 3–5 minutes

- Which part of that work took the most thought?
- What, if anything, would you want to confirm before relying on this in a real
  QC workflow?
- What information was missing at the handoff?
- If you could change one thing, what would it be and why?
- Is there anything we did not ask that would affect your work?

Then administer SEQ for each completed task and SUS once at the end. Never ask
the participant to enter real QC values, passwords, controlled data, or personal
information.

## Measures and definitions

Capture measures by participant segment and task. Do not combine radically
different roles into one average.

| Metric | Definition | Collection | Reporting rule |
|---|---|---|---|
| Task success | Reached the stated safe outcome without unrecovered error | Facilitator outcome: success / partial / fail | Report n/N by role and task |
| Time on task | Seconds from task briefing to outcome or abandonment | Stopwatch | Report median and range; use p50/p90 when sample permits |
| Error rate | Observable errors divided by task attempts | Observation log | Separate recoverable, unrecovered, and authorization-risk errors |
| Assistance | Highest support used: none, neutral probe, hint, facilitator intervention, unable | Observation log | Report distribution by role/task |
| Recovery success | Recovered from the intended failure state without data loss or unsafe action | Scenario outcome | Report separately for validation, zero results, rework, session, and permission cases |
| SEQ | Single Ease Question after each task, 1 = very difficult, 7 = very easy | Participant rating | Report median/distribution by task; do not treat it as proof of success |
| SUS | Standard 10-item perceived-usability questionnaire after session | Verbatim standard SUS instrument, 1 = strongly disagree, 5 = strongly agree | Score 0–100 using standard alternating-item calculation; report n and role mix |

### SUS instrument

Use the standard wording and order; do not modify it between baseline and
comparison. Ask the participant to rate each statement from 1 (Strongly
disagree) to 5 (Strongly agree):

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

Score odd items as response minus 1; score even items as 5 minus response;
sum and multiply by 2.5. Keep raw responses private and report the score with
sample size and segment.

## Observation template

Copy this block once per participant and task. Keep quotes anonymized and never
copy record IDs, search text, form values, passwords, filenames, or controlled
content into research notes.

```md
### Observation — [participant ID] / [role] / [task ID]
- Date/time:
- Environment: [seeded/non-production] / [browser] / [device] / [viewport]
- Starting point:
- Scenario outcome: [success / partial / fail / abandoned]
- Time on task:
- Assistance: [none / neutral probe / hint / intervention / unable]
- Errors observed: [recoverable / unrecovered / authorization-risk]
- Recovery: [yes / no / not applicable]
- SEQ (1–7):
- Expected action/location:
- Observed action/location:
- Exact UI wording noticed:
- Participant quote (anonymized, no sensitive data):
- What seemed to cause the behavior:
- Severity candidate: [P0 / P1 / P2 / P3 / unresolved]
- Evidence reference: [screen note / timestamp / screenshot sanitized]
```

## Interview and survey follow-up

Use the interview questions above to understand motivation and mental models;
do not use a survey to discover an unknown usability problem. After at least
one pilot per segment, send a short survey to quantify prevalence:

1. Which QC role do you perform most often? (Employee / Supervisor / Manager /
   Lab operator or reviewer / Admin)
2. In the last 7 days, which activities did you complete? (Create, save/resume,
   submit, review, return/reject, approve, search, investigate failure,
   calibration, report/export)
3. How often did you need help to complete those activities? (Never / Once /
   2–3 times / 4+ times)
4. Which activity took the most time? (same list)
5. How easy or difficult was it to know the next permitted action? (1 = very
   difficult, 5 = very easy)
6. What is the one change that would most improve your work? (open text)

Keep the survey under five minutes, pilot it with 3–5 people, report response
rate and role mix, and cross-tab results by role. Do not interpret a survey as
evidence that a workflow is safe unless task observation supports it.

## JTBD and journey framing

### Core job

When QC work must move through a controlled handoff, the participant wants to
complete the next permitted step with enough evidence and context, so the record
can move forward without rework, unsafe approval, or loss of traceability.

| Dimension | Expected outcome |
|---|---|
| Functional | Enter, save, resume, submit, review, return, approve, investigate, and report within the assigned authority. |
| Emotional | Feel certain about what is saved, what is blocked, and who acts next; avoid fear of losing work or making an unauthorized decision. |
| Social | Be seen by the next role as reliable, complete, and audit-ready. |

Map each session across: define → locate → prepare → confirm → execute →
monitor → modify/recover → conclude. The current journey should reference the
existing `WorkflowContext`, status semantics, notifications, audit trail, and
related-record links. Record the participant’s emotional rating after each
stage only as a prompt for discussion; do not turn it into a product KPI.

## Findings synthesis and severity

Synthesize only after every participant’s observations have been indexed. Tag
each observation with its participant ID before clustering; ensure every
participant appears in the synthesis. Mark single-source observations as such.

| Severity | Apply when | Required response |
|---|---|---|
| P0 | Blocks work, exposes data, corrupts data, or creates an authorization/security risk | Stop affected pilot path; preserve evidence; escalate immediately and do not redesign around the violation |
| P1 | Core workflow requires a serious workaround, produces a wrong outcome, or affects a meaningful role group | Prioritize before declaring the UX ready; retest the affected task and role |
| P2 | Task completes but wording, placement, clarity, or interaction causes avoidable error/delay | Prioritize against observed frequency, time, and confidence; retest when changed |
| P3 | Valuable enhancement that does not prevent safe completion | Backlog with the job and expected value; do not present as a defect |

### Finding record

```md
## F-[number] — [short evidence-based title]
- Segment(s):
- Participants: [IDs and count; single-source?]
- Tasks affected:
- Evidence: [observation IDs/timestamps]
- Finding: [what participants did, without interpreting beyond evidence]
- User impact: [time, error, assistance, confidence, safety, or handoff impact]
- Severity: [P0 / P1 / P2 / P3]
- Confidence: [high / medium / low] — explain sample or conflicting evidence
- Recommendation: [smallest change that addresses the cause]
- Owner:
- Acceptance measure:
- Retest plan:
```

Do not create findings from automated test output alone. Automated tests confirm
contracts; human sessions establish whether participants understand and can
operate the workflow.

## Baseline, comparison, and impact readout

1. Freeze the tested build, seeded dataset, task wording, facilitator script,
   viewport/device setup, and metric definitions.
2. Collect at least 14 days of privacy-minimized product baseline where relevant;
   use the existing UX telemetry contract and do not add identifiers or record
   content.
3. Run the pilot, then the full role-separated sessions. Record sample size,
   role mix, dates, missing data, device mix, and protocol deviations.
4. If an intervention is shipped, rerun the same task set with comparable role
   criteria and equivalent synthetic difficulty. Keep the facilitator neutral.
5. Compare task success, time, errors, assistance, recovery, SEQ, and SUS. Use
   medians/distributions and role-level results; avoid causal claims from a
   small uncontrolled sample.
6. Link each recommendation to a metric, observed evidence, owner, and retest
   decision. A result is “improved” only when the predefined comparison supports
   it and important safety/accessibility outcomes did not regress.

### Impact readout template

```md
# UX Research Readout — [scope] — [date]

## Context
- Problem and affected role(s):
- Decision this research informs:

## Method
- Sessions / survey / telemetry date range:
- Participants by role:
- Tasks and build:
- Deviations and missing data:

## Baseline → intervention → current
| Role/task | Baseline | Current | Difference | n | Caveat |
|---|---:|---:|---:|---:|---|

## Findings
- P0/P1:
- P2:
- P3:
- Unresolved questions:

## Operational implication
- What changed for safe completion, handoff, effort, or risk:

## Decision
- [ship / revise / retest / stop]
- Owner and next date:
```

No findings, baseline, comparison, or UX-success claim exists until actual
participants complete the scenarios and the evidence is analyzed by role.

## Readiness checklist

- [ ] Synthetic dataset verified; no production records, secrets, or controlled values.
- [ ] Role accounts and server-side permissions verified for each scenario.
- [ ] Consent, recording notice, access list, and deletion path approved.
- [ ] 360px, 1440px, keyboard, focus, and VoiceOver checks scheduled.
- [ ] Facilitator script and task wording frozen before baseline sessions.
- [ ] Observation templates prepared; no sensitive fields captured.
- [ ] At least one pilot session completed per active segment.
- [ ] Findings tagged by role and participant before affinity clustering.
- [ ] Baseline date range, sample, missing data, and telemetry privacy contract recorded.
- [ ] Automated tests are reported as implementation evidence, never as UX success.
