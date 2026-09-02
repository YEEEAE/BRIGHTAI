# QC Task Manager — 9-Pilot UX Research Plan

**Status:** Ready to run; no participant results are claimed.
**Audience:** QC employees, reviewers, supervisors, managers, laboratory operators, and administrators.

## Research goals

1. Check whether each role can find the right workspace and understand the next action.
2. Check whether headings, labels, buttons, helper text, warnings, and errors explain the outcome in plain professional English.
3. Check whether users understand save, submit, review, approve, reject, return, archive, and permanent deletion consequences.
4. Identify recovery gaps: what happened, whether data was saved, whether retrying is safe, and what to do next.
5. Measure completion, time, assistance, errors, and confusion by role without combining unlike tasks.

## Role-based participant plan

| Role | Target participants | Relevant experience | Do not substitute |
| --- | ---: | --- | --- |
| Employee / task owner | 3–5 | Creates and updates assigned work | Demo-only observer |
| Supervisor | 3–5 | Assigns, reviews, and follows up tasks | Employee participant |
| Manager | 3–5 | Reviews deletion requests, workload, and approvals | Administrator |
| Laboratory operator / reviewer | 3–5 | Creates tests, records results, reviews evidence | General office user |
| Administrator | 2–3 | Manages users, templates, and system controls | Manager |

Recruit participants who use the corresponding QC workflow in their normal work. Use non-production data, record consent, and keep role permissions unchanged. The targets are a plan, not completed research.

## Scenarios

Run only the scenarios relevant to the participant's role:

1. Find a task that needs your attention and explain its status.
2. Create a task, save it, leave it, and resume it without losing information.
3. Update progress, add a checklist item, and explain what remains before completion.
4. Complete a task with evidence and a completion comment; identify the irreversible consequence.
5. Review a finding or laboratory test and choose approve, reject, or return for changes.
6. Search for a record, clear filters, and save a useful filter set.
7. Recover from a failed save or expired session; state whether retrying is safe.
8. Review a deletion request and distinguish keeping a task from deleting it permanently.
9. For laboratory roles: create a test draft, submit it for review, and respond to missing evidence.

## Moderated session script

- Explain: “We are testing the product wording and workflow, not your performance. Please think aloud.”
- Do not teach the intended answer. Ask “What would you do next?” before giving help.
- Capture the first interpretation, action, recovery attempt, and final outcome.
- Stop a scenario after success, three minutes without progress, or a safety concern.
- Ask the participant to read any error aloud and explain whether data was saved.

## Observation sheet

| Field | Record |
| --- | --- |
| Participant ID / role |  |
| Date / environment / device |  |
| Scenario ID |  |
| Start / end / time-on-task |  |
| Success: yes / partial / no |  |
| Assistance count and exact prompt |  |
| Error count and error text |  |
| Confusion point and first interpretation |  |
| Data-saving belief: saved / not saved / unsure |  |
| Retry-safety belief: safe / unsafe / unsure |  |
| Recovery completed: yes / no |  |
| Quote or observed behaviour |  |

## Task success criteria

A task is successful only when the participant completes the intended workflow, selects the correct action, preserves or verifies the expected data state, and explains the next state in their own words. Partial success means the workflow completes after assistance or a recoverable error. Do not count automated tests as participant success.

## Measures

- **Time-on-task:** elapsed seconds from the scenario start to the success decision; record pauses separately.
- **Assistance count:** number of moderator prompts beyond the scripted introduction.
- **Error count:** wrong action, invalid submission, avoidable recovery attempt, or misunderstanding of saved state.
- **Confusion points:** observed hesitation, backtracking, contradictory explanation, or request for clarification.
- **Recovery rate:** successful recovery without losing data or needing moderator intervention.

## SUS-style questionnaire

Use the standard 10-item System Usability Scale after the session. Score each statement from 1 (strongly disagree) to 5 (strongly agree), randomising positive and negative wording only if the facilitator can preserve the standard scoring.

1. I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I would need support to use this system.
5. I found the functions well integrated.
6. I thought there was too much inconsistency.
7. I would imagine most people would learn quickly.
8. I found the system cumbersome to use.
9. I felt confident using the system.
10. I needed to learn a lot before I could use the system.

Report SUS only after completed sessions. A planned questionnaire is not a SUS result.

## Qualitative questions

- Which words or labels were unclear, and what would you call them?
- What did you expect to happen after that action?
- What told you whether your work was saved?
- What would make you trust or distrust the warning?
- What would you do if this error appeared during a real inspection?
- Which information did you need but could not find?
- Which action felt risky, and why?
- What should the system say after success or failure?

## Analysis and reporting

Report results by role and scenario. Include numerator/denominator, median time, range, assistance, errors, recovery, notable confusion points, and representative quotes with participant IDs. Do not infer preferences from source inspection or automated checks. Mark every unrun session as **Not measured**.
