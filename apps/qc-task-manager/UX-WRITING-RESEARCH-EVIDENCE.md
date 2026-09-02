# UX Writing Research Evidence

## Scope

This file records evidence for the QC Task Manager UX-writing audit `QC-100-CONTENT-UX-010`. It is intentionally conservative: source review and automated checks are not human research.

## Evidence inventory

| Evidence | Status | What it supports | What it cannot support |
| --- | --- | --- | --- |
| Source inventory of `src/pages`, `src/components`, and `src/lib` | Complete for this audit | Copy locations, terminology, repeated patterns, and visible-state coverage | Whether QC staff understand the wording |
| Existing `docs/UX-WRITING.md` contract | Existing and updated | Preferred vocabulary, tone, AI boundary, and recovery pattern | Participant preference or task success |
| Automated content-quality guard | Added for this task | Required copy contracts and banned vague labels in audited surfaces | Real-world usability or accessibility with assistive technology |
| Existing automated UI, interaction, and E2E suites | Existing project evidence | Render/wiring regressions where their assertions apply | Human comprehension, time-on-task, assistance, or SUS |
| Participant sessions from `9-PILOT-UX-RESEARCH.md` | **Not run** | — | All human UX claims remain open |

## Audit decisions

- User-facing copy uses plain professional English and action-specific verbs.
- Error messages state what happened, whether data was saved, what to do next, and whether retrying is safe when the state is known.
- Technical implementation terms remain in source comments and diagnostics, not user-facing copy.
- Destructive actions name the object and consequence: `Delete task permanently`.
- Empty states orient the user and provide a relevant next action when one exists.
- `AI` surfaces remain advisory and explicitly require human review.

## Human research status

No participants, sessions, SUS scores, time-on-task results, assistance counts, error rates, or qualitative findings are claimed by this audit. The next valid evidence is a completed, role-separated pilot using the plan in `9-PILOT-UX-RESEARCH.md`.

## Automated quality claim

The content-quality guard is **100% pass for its declared rules** when it exits successfully. This means the checked contracts are present and no declared banned labels remain. It does not mean human UX quality is 100% or that the product has passed UAT.
