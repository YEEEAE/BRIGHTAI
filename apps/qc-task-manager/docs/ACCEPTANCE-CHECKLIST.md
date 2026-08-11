# QC Task Manager End-to-End Acceptance Checklist

Use this checklist for every release candidate. Run commands from the
repository root unless a command explicitly changes directory.

## 1. Automated gates

| Done | Command | Expected result |
|---|---|---|
| [ ] | `pnpm install --frozen-lockfile` | Root dependencies install successfully. |
| [ ] | `pnpm --filter @brightai/qc-task-manager test` | Domain and database-backed unit checks pass, including permissions, field whitelist, status transitions, overdue rules, recurrence, dependency guards, upload validation, login lockout, notification creation, backup, and migrations. |
| [ ] | `pnpm --filter @brightai/qc-task-manager typecheck` | Astro/TypeScript reports 0 errors. |
| [ ] | `pnpm --filter @brightai/qc-task-manager e2e:acceptance` | Builds QC, starts isolated standalone servers, and passes all acceptance suites. |
| [ ] | `pnpm build` | The existing BRIGHTAI root application still builds successfully. |

The E2E runner executes these isolated suites: `e2e-admin-users.mjs`,
`e2e-auth-lockout.mjs`, `e2e-task-shared.mjs`, `e2e-delete-request.mjs`,
`e2e-dashboard.mjs`, and `e2e-backup.mjs`.

## 2. Installation, startup, and database

| Done | Check | Command / action | Expected result |
|---|---|---|---|
| [ ] | Root install | `pnpm install --frozen-lockfile` | Completes from the monorepo root without package-resolution errors. |
| [ ] | QC independent build | `pnpm --filter @brightai/qc-task-manager build` | QC server build completes independently of the root site build. |
| [ ] | QC independent start | `QC_DATABASE_PATH=/absolute/tmp/qc-acceptance.db PORT=4321 pnpm --filter @brightai/qc-task-manager start` | QC serves `/login` on its own port; stop it after the check. |
| [ ] | Automatic database generation | Start QC with a new absolute `QC_DATABASE_PATH`, submit one login request, then inspect the path. | SQLite DB plus required schema tables is created automatically; no hand-created DB is needed. |
| [ ] | SQLTools browsing | Install `mtxr.sqltools` and `mtxr.sqltools-driver-sqlite`; open the repository root; use the `QC Tasks DB` connection from `.vscode/settings.json` or the README snippet. | SQLTools lists `users`, `tasks`, `task_activity_log`, `notifications`, and the other schema tables and can run `SELECT COUNT(*) FROM tasks`. |
| [ ] | Existing BRIGHTAI smoke | Run `pnpm build`, then load the existing public app home page from its normal dev/preview command. | Existing BRIGHTAI pages still serve; QC changes do not replace or break the root app. |

## 3. Roles and access

| Done | Journey | Expected result |
|---|---|---|
| [ ] | Log in as `admin` | Redirects to `/admin/users`. |
| [ ] | Log in as `manager` | Redirects to `/manager`. |
| [ ] | Log in as `supervisor` | Redirects to `/supervisor`. |
| [ ] | Log in as `employee` | Redirects to `/employee`. |
| [ ] | Log out | CSRF-protected logout redirects to `/login`, clears the cookie, and removes the server-side session. |
| [ ] | Employee opens `/dashboard` | Employee is denied and redirected to `/employee`; no dashboard data is exposed. |
| [ ] | Employee opens another employee's task | Access is denied. |
| [ ] | Employee downloads another task's attachment | Request is denied or returns not found; no BLOB is disclosed. |
| [ ] | Manager/admin opens a team task | Access is allowed according to the role scope. |

## 4. Users and tasks

| Done | Journey | Expected result |
|---|---|---|
| [ ] | Admin creates a user | New user is stored with a password hash, role, department, and active state; plaintext password is never rendered. |
| [ ] | New user logs in immediately | Login succeeds without restarting the server. |
| [ ] | Duplicate username / short password | Server-side validation rejects both and creates no invalid user. |
| [ ] | Manager creates a task | Task row and `task_created` activity row are present. |
| [ ] | Manager assigns a task | Assignee is stored and receives an `assigned` notification. |
| [ ] | Employee updates progress | Status/progress/blocker fields update on an owned task and activity history records the change. |
| [ ] | Employee changes title/locked field | Request is rejected; database title and other locked fields remain unchanged. |
| [ ] | Employee deletes a task | Direct deletion is unavailable; the task remains. |
| [ ] | Employee submits deletion request | Pending request is created and managers/admins are notified. |
| [ ] | Manager rejects deletion request | Task remains, request becomes rejected, reason and activity history are present. |
| [ ] | Manager approves deletion request | Task and its child records follow the documented cascade policy and request workflow completes. |

## 5. Lifecycle, dependencies, recurrence, and overdue work

| Done | Journey | Expected result |
|---|---|---|
| [ ] | Move task through statuses | Allowed transitions succeed; invalid transitions fail; `on_hold` requires a blocker note. |
| [ ] | Start work | First move to `in_progress` stamps `started_at` once and records `task_started`. |
| [ ] | Start task with incomplete dependency | Request is rejected with the blocking dependency; manager/admin override requires a reason and is logged. |
| [ ] | Complete dependency | Previously blocked task can start without an override. |
| [ ] | Complete recurring task | Exactly one next task is created with the next due date, copied business fields/checklist template, reset progress, and no copied evidence/comments. |
| [ ] | Recurrence end date | Next task is created when the next date equals the end date and is not created after it. |
| [ ] | Overdue task | An active task with `due_date < today` appears in overdue UI/KPI; due today, future, completed, and cancelled tasks do not. |

## 6. Completion and evidence

| Done | Journey | Expected result |
|---|---|---|
| [ ] | Complete with valid evidence | PDF/PNG/JPG/JPEG/XLSX/DOCX passes extension, MIME, size, and magic-byte checks; BLOB survives in SQLite. |
| [ ] | Complete with skipped evidence | Completion succeeds only with a comment; `evidence_skipped` is recorded. |
| [ ] | Complete without comment | Completion is rejected and task remains active; no completion comment/evidence/activity is committed. |
| [ ] | Invalid evidence | Wrong extension, MIME, signature, empty file, or file over 10 MB is rejected and task remains active. |
| [ ] | Completed task mutation | Completed task is read-only for every role. |
| [ ] | Manager reopens completed task | Reopen succeeds for manager/admin only, clears completion metadata as designed, and records `task_reopened`; editing becomes available again. |
| [ ] | Attachment download | Authorized task viewers receive the original bytes and safe `Content-Disposition`; unauthorized users do not. |
| [ ] | Restart persistence | Upload evidence, stop and restart the server against the same DB, then download it. The bytes and metadata are unchanged. |

## 7. Audit, notifications, and operations

| Done | Journey | Expected result |
|---|---|---|
| [ ] | Critical task actions | Create, assign, status/progress changes, blocker, completion, evidence upload/skip, reopen, deletion request/review, recurrence, and notification creation are in `task_activity_log`. |
| [ ] | Notification recipient | Active recipient gets the persisted notification; inactive users never receive one. |
| [ ] | Notification read state | Recipient can mark one notification read only for their own row, or mark all; unread badge updates. |
| [ ] | Manual backup | `pnpm --filter @brightai/qc-task-manager db:backup` creates `db/backups/qc_tasks-YYYY-MM-DD-HHmmss.db`. |
| [ ] | Backup integrity | Run `PRAGMA integrity_check` against the generated backup and expect `ok`; tables/data are queryable. |
| [ ] | Backup isolation | Backup files and status are not served as public HTTP downloads. |

## Sign-off

- Release/build identifier: ______________________________
- Database path used: ___________________________________
- Tester/date: __________________________________________
- Automated unit result: _________________________________
- Automated E2E result: _________________________________
- Manual exceptions or follow-up issues: _________________

