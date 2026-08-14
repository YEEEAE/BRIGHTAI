# Roles and permissions

Authorization is enforced in `src/lib/permissions.ts`. Role checks are
server-side; hiding a button is not a permission boundary.

| Capability | Admin | Manager | Supervisor | Employee |
| --- | :---: | :---: | :---: | :---: |
| Dashboard | Yes | Yes | Yes | No |
| Manage users | Yes | No | No | No |
| Create tasks | Yes | Yes | Yes | Only when `can_create_tasks` is enabled |
| Assign tasks | Yes | Yes | Yes | No |
| Edit locked task fields | Yes | Yes | Yes | No |
| Update status, progress, blockers, comments, attachments | Yes | Yes | Yes | Own or assigned tasks only |
| Directly delete tasks | Yes | Yes | No | No |
| Submit deletion request | No | No | No | Yes |
| Review deletion requests | Yes | Yes | No | No |
| View all tasks | Yes | Yes | Yes | No, only own or assigned tasks |
| Manage task templates | Yes | No | No | No |
| Instantiate ACTIVE templates | Yes | Yes | Yes | Yes, when task creation is enabled |

## QC Operations RBAC

| Finding/CAPA capability | Admin | Manager | Supervisor | Employee |
| --- | :---: | :---: | :---: | :---: |
| Full control | Yes | No | No | No |
| Review Finding / CAPA | Yes | Yes | Yes | Assigned action only |
| Approve / reject closure | Yes | Yes | No | No |
| Evidence and corrective-action updates | Yes | Yes | Review only | Assigned owner only |

The UI only reflects these permissions; every API mutation resolves the actor
from the server session and applies the same checks again.

## Evidence and completion gate

Evidence upload and replacement use the current task authorization check. The
wizard is only a convenience layer: `/api/tasks/:id/close` re-validates the
actor, file extension, MIME, magic bytes, size, SHA-256 duplicate, and template
snapshot requirements. Required evidence cannot be skipped. A manager/admin
can override a missing requirement only by supplying a reason, which is written
to the task activity log. Existing non-rejected evidence remains valid when a
completed task is reopened; rejected evidence does not satisfy the gate.

## QC Laboratory RBAC

Laboratory permissions live in the same canonical `src/lib/permissions.ts`
(`can*Lab*` predicates — enforced by `architecture-guard.mjs`; there is no
second permission system). The `/lab` route prefix is walled in
`src/middleware.ts` (session + `LAB_VIEW`); every lab page and API handler
re-checks its specific permission server-side. The full route→permission map
is in [QC-LAB-ARCHITECTURE.md](QC-LAB-ARCHITECTURE.md) §5.

| Laboratory capability | Admin | Manager | Supervisor | Employee |
| --- | :---: | :---: | :---: | :---: |
| Enter the laboratory (`/lab`, LAB_VIEW) | Yes | Yes | Yes | Yes |
| View tests / products / templates / equipment / calibration / documents / retests | Yes | Yes | Yes | Yes |
| Create test records | Yes | Yes | Yes | Yes |
| Edit test records | Any non-terminal | Any non-terminal | Own DRAFT/REJECTED | Own DRAFT/REJECTED |
| Submit test for review | Yes | Yes | Own | Own |
| Review tests | Yes | Yes | Yes — never own test | No |
| Approve tests | Yes | Yes — never own test/review | No (D-4) | No |
| Void tests | Yes | Yes | No | No |
| Create / edit / archive products | Yes | Yes | No | No |
| Create / edit templates | Yes | Yes | No | No |
| Approve templates | Yes | Yes — not own edit | No | No |
| Create / edit / archive equipment | Yes | Yes | No | No |
| Record equipment maintenance | Yes | Yes | Yes | No |
| Create / edit calibration records | Yes | Yes | No | No |
| Create / edit documents (SOP/WI) | Yes | Yes | Own | No |
| Review documents | Yes | Yes | Yes — never own document | No |
| Approve documents | Yes | Yes — never own version | No | No |
| Archive documents | Yes | Yes | No | No |
| Acknowledge documents | Yes | Yes | Yes | Yes |
| Create retests | Yes | Yes | Yes (D-5) | No |
| Reports / exports / data quality / management dashboard | Yes | Yes | Yes | No |
| AI assist (advisory only) | Yes | Yes | Yes | Yes |

Hard rules enforced server-side by the entity-context predicates:

- A tester can never review or approve their own test — even an admin.
- A document author can never review or approve their own version.
- Tested/Reviewed/Approved By are derived from the session user, never from
  request input (hidden fields and query parameters carry no authority).
- `final_result` (PASS/FAIL/HOLD) is entered by authorized humans only; AI is
  advisory and never decides a result or approves a record.
- Terminal states (`APPROVED`, `VOID`, `SUPERSEDED`, `ARCHIVED`) are immutable
  for every role; editing an approved document means creating a new draft
  version.

## Role landing pages

| Role | Landing page |
| --- | --- |
| Admin | `/admin/users` |
| Manager | `/manager` |
| Supervisor | `/supervisor` |
| Employee | `/employee` |

## Task rules that apply to everyone

- Completed and cancelled tasks are read-only for every role.
- Only admin and manager can reopen a completed task to `in_progress`.
- Employees may update only `status`, `progress_percent`, and `blocker_note`
  through the task-update surface; comments and attachments have dedicated
  actions.
- Employees cannot change title, description, department, assignee, due date,
  priority, recurrence, checklist structure, or dependencies.
- Moving a task to `on_hold` requires a blocker note. Completion uses the
  completion workflow, including a mandatory completion comment.
- An employee can edit or complete only a task they created or are assigned.
- The `can_create_tasks` flag affects employee accounts only; it does not
  restrict admin, manager, or supervisor task creation.

## User administration

Only administrators can create users, alter role/department/active status,
toggle an employee's `can_create_tasks` flag, and reset passwords. Resetting a
password also clears that account's lockout state. Use `/admin/users` to reset
the seeded admin password immediately after the first login.

Workflow is separate from RBAC: employees may work their assigned step,
supervisors review, and managers approve or close according to the immutable
workflow instance. Team workload comparisons and peer metrics are restricted
to supervisors, managers, and admins; employees do not receive comparison
data. Assignment recommendations are suggestions only and require an explicit
authorized assignment action.

For the full system overview, see [ARCHITECTURE.md](ARCHITECTURE.md).
