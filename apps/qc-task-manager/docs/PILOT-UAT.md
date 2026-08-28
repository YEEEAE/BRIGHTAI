# QC Pilot UAT Runbook

> Use this guide to run employee acceptance testing of the QC Task Manager. It is a test script and evidence worksheet, not a statement of completed UAT. Do not record results in this runbook before a participant performs the scenario.

## Session setup

- Record the participant role, anonymized participant ID, tester date, browser/device, and test environment.
- Give the participant only the starting location and scenario goal. Do not coach unless they ask for help.
- Start timing when they receive the scenario and stop at the stated outcome or when they abandon it.
- Use test data only. Do not enter production records, passwords, or controlled data into comments.

## Evidence to collect for every scenario

| Field | Record |
| --- | --- |
| Success (Yes / No) | Did the participant reach the stated outcome without an unrecovered error? |
| Completion time | Minutes and seconds from start to outcome/abandonment. |
| Assistance required | None, hint, facilitator intervention, or unable to complete. |
| Errors | Visible message, request ID if shown, and what action caused it. |
| Confusing labels/buttons | Exact label or button text and why it was unclear. |
| Expected button location | Where the participant expected to find the action. |
| Comments | Participant wording, observed friction, and follow-up context. |

## Employee scenarios

| Scenario | Starting point | Participant goal / expected outcome |
| --- | --- | --- |
| Login and password | Login page with a first-login account | Sign in, replace the administrator-set password, and reach the role dashboard. |
| Find own task | Employee dashboard | Find one task assigned to the participant and open its details. |
| Update task | Open assigned task | Update permitted progress/status information and save it. |
| Create task (if allowed) | Employee dashboard for an account with create permission | Create a task and confirm it appears in the participant's task list. If the account lacks permission, record whether that limitation is understandable. |
| Create lab test | Laboratory dashboard | Start an AIR or VACUUM test and save it as a draft. |
| Fill samples | Lab test draft | Add or edit the required sample rows and record a human-selected result. |
| Submit test | Completed lab test draft | Submit the test for review and confirm its status/queue outcome. |
| Search | Laboratory search | Find a known test, document, equipment item, or product using search/filter controls. |
| Find WI | Documents register | Find a specified Work Instruction and open the controlled version. |
| Start WI content | New document or assigned WI draft | Start the content for a WI and save the editable draft without claiming approval. |
| Submit master-data proposal | Change Requests | Propose an allowed product, equipment, calibration, or retest master-data change and submit it for review. |

## Supervisor scenarios

| Scenario | Starting point | Participant goal / expected outcome |
| --- | --- | --- |
| Review test | Review Center | Open a submitted test, start review, and inspect measurements and samples. |
| Return for changes | Test under review | Return the test with a specific actionable reason; confirm the tester can see the status/reason. |
| Review controlled document | Documents review queue | Review a submitted SOP/WI and either leave it in review or return it with a reason. |
| Team workspace | Supervisor task dashboard | Find team work, identify an attention item, and navigate to its underlying record. |

## Manager scenarios

| Scenario | Starting point | Participant goal / expected outcome |
| --- | --- | --- |
| Approve test with e-signature | Review Center with an approvable test | Approve an eligible test using the participant's own current password for the electronic signature. |
| Change request review | Change Requests | Review a pending proposal and approve or reject it with the required rationale. |
| Document/template approval | Documents or Templates | Approve an eligible controlled document/template and confirm the status/version outcome. |
| Reports | Reports | Run a permitted report, inspect the preview scope, and export/print if required. |
| Calibration risk | Laboratory management or calibration register | Identify a due/overdue risk and open the related record. |
| Audit | Audit log | Find the audit trail for a specified recent workflow action. |

## Admin scenarios

| Scenario | Starting point | Participant goal / expected outcome |
| --- | --- | --- |
| Create user | Users | Create a test user with the specified role and task-creation permission. Do not record the password. |
| Reset password | Users | Reset a test user's password and confirm the next login requires a personal replacement password. |
| Role management | Users | Change a test user's permitted role/employee task-creation setting and confirm the intended dashboard/access changes after re-login. |
| System health | Admin/system health page | Check the health view and identify whether action is required. |
| Backup | Backup procedure | Run or validate the approved backup path in the test environment and record only the artifact/status, never secret paths or credentials. |

## Issue classification

| Priority | Use when | Example evidence to capture |
| --- | --- | --- |
| P0 — Blocks work, data integrity, or security | Work cannot proceed, data is incorrectly exposed/corrupted, or an authorization/security concern is observed. | Role, affected record type, exact step, error/request ID, and whether data exposure was observed. |
| P1 — Major workflow issue | A core scenario completes only through a workaround, has a serious incorrect outcome, or prevents a significant group from completing work. | Scenario, workaround, time impact, and affected roles. |
| P2 — Usability/polish | The scenario completes, but labels, placement, clarity, or interaction causes avoidable confusion or delay. | Exact wording/location expected and observed completion time. |
| P3 — Future enhancement | A useful improvement that is not required to complete the current workflow safely and correctly. | User need, expected value, and why it did not block the scenario. |

## Facilitator close-out

- Consolidate observations without inventing pass rates or UAT conclusions.
- Attach screenshots only after removing personal, password, and controlled information.
- Triage each issue using the classification above; keep P0/P1 evidence linked to the exact scenario and participant role.
- Record unresolved questions separately from defects.
