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
