# QC Task Manager — Usability Test Plan

For the complete role-separated research program, including participant
criteria, the full task matrix, interview/survey instruments, observation
template, severity model, and baseline/comparison readout, use
[`UX-RESEARCH-PROGRAM.md`](UX-RESEARCH-PROGRAM.md). This document remains the
short operational summary and pilot checklist.

## Objectives

1. Can each role identify the next operational action without scanning low-priority analytics?
2. Can a tester submit or recover a lab form without losing work or misunderstanding its state?
3. Can a reviewer find a test, understand its status, and choose the correct decision?
4. Can a user search, recover from zero results, and open a useful result?

## Method

Moderated remote sessions using a seeded, non-production dataset. Think aloud
is encouraged, but participants must not enter real QC values. Five to eight
participants per role segment (employee/tester, supervisor, reviewer/manager)
is the target; pilot one session per segment first.

## Tasks and success criteria

| Task | Success | Expected time |
|---|---|---:|
| Find urgent work on dashboard | Opens the relevant action register and explains why | 2 min |
| Create a lab test draft | Saves a draft and can locate its saved state | 4 min |
| Submit a lab test | Submits without validation confusion and knows what happens next | 4 min |
| Recover a search | Removes/refines filters after zero results and opens a result | 3 min |
| Review a test | Starts review, inspects the record, and chooses an appropriate decision | 4 min |
| Handle rework | Requests changes with a reason and explains the next owner | 3 min |

## Measures

Task success, time on task, observable errors, recovery success, single ease
question (1–7), and short debrief comments. Compare against the telemetry
baseline where available; do not identify participants in product events.

## Facilitation and analysis

Use neutral prompts: “What would you do next?” and “What tells you that?” Do
not teach unless the session is blocked. Record task id, success/partial/fail,
time band, error category, and quote—never real form values. Cluster findings,
score impact/effort/confidence, and link each recommendation to a metric and
an owner.

## Pilot checklist

- Verify seeded records are synthetic and no secrets are present.
- Verify events contain only route, role, outcome, duration, and allowlisted metadata.
- Verify a rejected/abandoned task cannot be mistaken for a successful business action.
- Verify keyboard navigation and 360px/1440px layouts before sessions.
- Verify consent, recording notice, deletion path, and access list with the project owner.
