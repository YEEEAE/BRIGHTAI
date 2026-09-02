# QC Task Manager — UX Writing & Microcopy

**Status:** Active product language contract  
**Owner:** QC product team  
**Scope:** User-visible labels, helper text, status language, errors, confirmations, empty states, permissions, AI assistance, and notifications.

## Voice and tone

- Direct, calm, and operational. Say what happened and what the user can do next.
- Use a specific action on buttons. Avoid vague labels such as `Submit`, `Update`, or `Manage` when the outcome is known.
- Use sentence case for labels and headings. Keep technical terms only when QC users need them.
- Never blame the user. Preserve their input after a failed request whenever the flow allows it.
- Keep helper text to one idea. Put constraints next to the field before submission.
- Use “review” for inspection and “approve” for a workflow decision. Do not use them interchangeably.
- AI output is advisory only. It must never sound like an authoritative QC decision.

## Terminology dictionary

| Preferred term | Meaning | Do not use variants | Where used |
| --- | --- | --- | --- |
| Save draft | Store an editable record without sending it to a queue | Save, Save record, Store draft | Lab test, product, equipment, calibration forms |
| Save and continue | Store the current section and stay in the workflow | Next, Continue | Multi-step forms |
| Submit for review | Send a completed record to the review queue | Submit, Send, Request approval | Tests, controlled documents, change requests |
| Review | Inspect a record and its evidence before deciding | Check, Validate (unless validation is the actual operation) | Review queues and detail pages |
| Approve | Make the allowed approval decision | Accept, Confirm (for workflow decisions) | Tests, documents, change requests |
| Reject | Return a record because it does not meet the requirement | Decline, Deny | Review workflows |
| Return for changes | Send the record back to its owner with a reason | Reject and edit, Send back | Review workflows where editing is allowed |
| Reopen task | Return a completed task to editable work | Re-activate, Undo complete | Task detail |
| Cancel task | Stop an active task with a required reason | Delete task, Close task | Task detail |
| Complete task | Mark an eligible task complete after required evidence and comment | Finish, Close | Task lifecycle |
| Pass / Fail / Hold | Final laboratory result choices | Success / Error / Pending | Lab tests and reports |
| Retest required | A new test is needed before the result can be accepted | Test again, Retry test | Lab results and retests |
| Keep task | Close a cancellation prompt without changing the task | Cancel (ambiguous in a cancellation dialog) | Cancellation dialog |
| Delete permanently | Irreversibly remove a record after an approved deletion request | Delete, Remove | Deletion confirmation |

## Action labels

Actions should describe the outcome, including the object where space allows:

- `Save draft` → editable state only.
- `Submit for review` → queue transition.
- `Approve test` / `Approve document` → workflow decision.
- `Reject request` → rejection of the request, not deletion of the task.
- `Return for changes` → record goes back for editing.
- `Confirm completion` → final step of task completion.
- `Upload evidence` → upload evidence for a task; `Upload` alone is acceptable only when the object is already explicit.

## Error and recovery pattern

Use this order whenever possible:

1. What happened.
2. Why it matters or what caused it, if useful.
3. What to do next.

Examples:

| Context | Preferred copy |
| --- | --- |
| Network failure | `We couldn't save the change because the connection was interrupted. Check your connection and try again.` |
| Conflict | `This record changed before you saved it. Review the latest record, then try again.` |
| Missing required input | `Add a cancellation reason before cancelling the task.` |
| Permission | `You need manager or administrator access to review this request.` |
| Missing evidence | `Add the required evidence or enter an approved override reason before continuing.` |
| Empty register | `No calibration records yet. Create the first record to get started.` |
| Empty search | `No records match these filters. Broaden your search or clear the filters.` |

Do not expose stack traces, internal permission function names, raw enum values, or security-sensitive details.

Every user-facing error must answer four questions whenever the application knows the answer: what happened, what to do next, whether data was saved, and whether retrying is safe. If the save state is unknown, say that it is unknown and direct the user to review the record before retrying. Never imply a successful save when the request failed.

## Audit coverage for QC-100-CONTENT-UX-010

The audit covers visible text and accessible names in `src/pages`, `src/components`, and `src/lib`, including headings, descriptions, actions, form labels, helper text, placeholders, tooltips, validation, warnings, confirmations, empty states, permission errors, success messages, failure messages, and destructive actions. The automated guard reports its declared source inventory and fails on bare high-risk action labels. Human comprehension remains unverified until participants complete `9-PILOT-UX-RESEARCH.md`; evidence is recorded in `UX-WRITING-RESEARCH-EVIDENCE.md`.

## AI assistance

Every AI surface must include:

- `AI-generated suggestions`.
- `Human review required`.
- `Advisory only — AI does not approve, reject, or decide QC outcomes.`

When unavailable: `AI assistance is not configured for this deployment. Continue manually; core QC workflows are unaffected.`

## Localization and accessibility

- Keep copy ready for Arabic and other future locales: no idioms, concatenated fragments, or text embedded in icons.
- Use flexible containers; labels and buttons may wrap.
- Keep acronyms defined at first use where the audience may not know them.
- Status meaning must remain in visible text; color and icons are supporting signals only.
- Error text is adjacent to the relevant control and available to assistive technology.
- Keep punctuation and capitalization stable so translations can be managed consistently.

## Inventory coverage

The current source audit covered buttons, labels, helper text, status labels, errors, confirmations, empty states, tooltips, permission messages, AI messages, and local notifications across `src/pages`, `src/components`, and `src/lib`. The highest-risk shared surfaces are:

- `TaskLifecycle.tsx` — complete, cancel, reopen, evidence, confirmation, and recovery copy.
- `ReviewDeleteRequestDialog.tsx` — permanent deletion confirmation and rejection reason.
- `AiReviewPanel.tsx` — advisory boundary and unavailable/error states.
- `OperationalState.astro` — shared empty, forbidden, conflict, and system-error states.
- Lab forms and review handlers — save, submit, approval, rejection, and permission language.

## Governance

New user-visible copy should be reviewed against this dictionary before merge. If a domain needs a different term, document the reason here and add a regression check for the new wording. Domain enums, API payloads, audit event names, and database values are not UI copy and must not be renamed as part of wording changes.
