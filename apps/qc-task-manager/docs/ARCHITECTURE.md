# QC Task Manager — Architecture & Operations

> Concise reference for how `@brightai/qc-task-manager` is put together and how
> to operate it. For the user-facing guide see the app `README.md`.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Astro 6, `output: 'server'` | SSR, zero-JS pages by default |
| Adapter | `@astrojs/node` (standalone) | `node dist/server/entry.mjs` runs anywhere |
| Interactivity | React islands (`@astrojs/react`) | Only where needed (update panel, uploader, charts, comment box, delete dialog, navbar) |
| Styling | Tailwind CSS (`@astrojs/tailwind`) | Utility-first, consistent with the monorepo |
| DB | SQLite via `better-sqlite3` | Zero-ops file DB, WAL mode, `foreign_keys = ON` |
| Auth | `bcryptjs` + server-side sessions | Password hashes; opaque `randomUUID()` tokens in an HttpOnly cookie, 12 h TTL |
| Validation | `zod` | Server-side input validation in `src/lib/validation.ts` |
| Charts | Pure SVG | No chart dependency — see `src/components/DashboardCharts.tsx` |

TypeScript runs in **strict** mode (`tsconfig.json`).

## Module map (`src/lib/`)

| Module | Responsibility |
| --- | --- |
| `db.ts` | SQLite singleton, WAL, idempotent schema apply, migrations, session cleanup, typed `query()` helper |
| `auth.ts` | bcrypt verify, session create/read/destroy, `getSessionUser(request)` |
| `session.ts` | Cookie helpers + `handleLoginPost` (self-submitting form) |
| `permissions.ts` | **Single source of truth** for role checks (`PERMISSIONS`, area guards, `roleHome`) |
| `task-policy.ts` | **Canonical domain rules**: statuses/priorities, field locks, limits, upload allowlist, read-only/transition predicates |
| `validation.ts` | Zod schemas for every server input (login, task create/update, comment, close, delete request, user create, dashboard filters) |
| `sla/` | Pure SLA, overdue, and due-soon calculations |
| `workflows/` | Task lifecycle transition boundary; delegates rule ownership to `task-policy.ts` |
| `audit/` | Server-side audit boundary for accepted mutations |
| `ai/` | Suggestion-only AI normalization; no DB, authorization, workflow, or audit authority |
| `findings/` | Finding classification, risk, and finding-text domain rules |
| `capa/` | Corrective/preventive action domain rules |
| `qc-operations.ts` | Finding/CAPA/RCA persistence, lifecycle gates, evidence, and server-side audit transactions |
| `tasks.ts` | Task creation + assignment-scope validation + `handleCreateTaskPost` |
| `taskUpdates.ts` | Update / closure flow / attachment upload (atomic, permission-gated) |
| `taskDetails.ts` | Read queries + `canViewTask` + activity timeline text |
| `activity.ts` | `logActivity()` — every mutation is recorded (`task_activity_log`) |
| `notifications.ts` | Derived in-app notifications (overdue / due-soon / unstarted / recent activity / pending delete requests) |
| `backup.ts` | Programmatic SQLite backup via better-sqlite3's `backup()` (timestamped, retention-pruned) |
| `export.ts` | CSV export of tasks (pure `tasksToCsv` + role-scoped `exportTasksForRole`) |
| `users.ts` | Admin user management (create, activate/deactivate, reset password, `can_create_tasks`) |
| `deleteRequests.ts` | Employee delete-request workflow (submit / review) |
| `dashboard.ts` | Read-only KPI / chart / table queries for `/dashboard` |
| `format.ts` | Pure formatting + status color/emoji maps (server + client safe) |
| `seed.ts` | Role seed + `SEED_DEMO=1` demo team/tasks |
| `types.ts` | Shared domain types (mirrors `db/schema.sql`) |
| `scripts/architecture-guard.mjs` | Dependency-free static guard for rule ownership and trust boundaries |

## Key business rules (encoded in `task-policy.ts`)

1. Employees have **no dashboard**; role home routes: admin → `/admin/users`, manager → `/manager`, supervisor → `/supervisor`, employee → `/employee`.
2. **Field locking**: employees may only edit `status`, `progress_percent`, `blocker_note` (plus comments/attachments via dedicated endpoints). Title/description/assignee/due date/priority are supervisor+.
3. **Completed tasks are read-only for everyone** — enforced in `taskUpdates.ts`, all endpoints, and the UI.
4. **Closure flow**: completing requires a mandatory completion comment; evidence is uploaded or the skip is recorded. Atomic, race-safe (conditional UPDATE).
5. **Delete requests**: employees cannot delete — they request; manager/admin approve (hard delete) or reject. The request row is a child of its task (`task_id … ON DELETE CASCADE`), so an approved request is cascade-removed with the task; rejected requests stay in history (titles joined live).
6. **Activity log**: every task mutation writes `task_activity_log` rows (who / what / old / new / when).

## QC Operations Platform

QC Operations is additive to the existing Task model. `qc_findings.task_id` is
the only parent link; the Task entity and its lifecycle are not replaced.

- Finding classifications: `conforming`, `observation`, `minor`, `major`, `critical`.
- Finding lifecycle: `OPEN → UNDER_REVIEW → ACTION_REQUIRED → VERIFICATION → CLOSED`, with `REOPENED` for rework.
- CAPA lifecycle: `DRAFT → OPEN → IMPLEMENTATION → VERIFICATION → EFFECTIVE → CLOSED`, with `REOPENED` for rework.
- RCA methods: `5_WHYS`, `FISHBONE`, and `FREE_FORM`; Fishbone supports People, Process, Equipment, Material, Environment, Measurement, and Management.
- Critical Findings cannot close unless a CAPA is effective/closed and corrective action, evidence, effectiveness review, verification, approval, and Finding closure evidence are present.
- CAPA cannot close unless corrective action, evidence, effectiveness review, and approval are non-empty.
- Every Finding/CAPA/RCA/Evidence create, update, status transition, approval, rejection, closure, and reopen writes `qc_audit_log` server-side.

Routes: `/findings` lists and creates Findings; `/findings/[id]` renders Finding Timeline, RCA, CAPA, Evidence, Approval, and Audit sections. API handlers re-check session, CSRF, role, assignment, and lifecycle rules.

## Source-of-truth and request boundaries

`docs/SINGLE-SOURCE-OF-TRUTH.md` is the detailed ownership contract. In short,
UI controls are advisory, API handlers re-check session and domain policy,
AI code is suggestion-only, SQLite protects critical invariants, and audit is
created server-side. The Architecture Guard checks these boundaries and the
absence of copied role/status/field-lock/SLA authority.

## Operations

```bash
pnpm install                                   # from the monorepo root
pnpm --filter @brightai/qc-task-manager dev    # dev server on :4321
pnpm --filter @brightai/qc-task-manager build  # SSR build → dist/server/entry.mjs
pnpm --filter @brightai/qc-task-manager db:seed    # apply schema + seed roles (idempotent)
pnpm --filter @brightai/qc-task-manager db:backup  # snapshot DB → db/backups/ (keeps last 14)
pnpm --filter @brightai/qc-task-manager typecheck  # astro check (strict)
pnpm --filter @brightai/qc-task-manager test       # structure + unit smoke (no server needed)
pnpm --filter @brightai/qc-task-manager test:architecture # source-of-truth/trust-boundary guard
```

Environment:

| Var | Meaning | Default |
| --- | --- | --- |
| `QC_DB_PATH` | Absolute path to an alternate SQLite database | `<app>/db/qc_tasks.db` |
| `QC_BACKUP_DIR` | Backup output directory (`db:backup`) | `<app>/db/backups` |
| `ADMIN_DEFAULT_PASSWORD` | Seed password for all seeded accounts | `admin123` (warns) |
| `SEED_DEMO=1` | Seed demo team + 12 mixed-status tasks on an empty DB | off |

## Testing

- `scripts/e2e-dashboard.mjs` (29 assertions) and `scripts/e2e-delete-request.mjs` (31) run against a **live server** sharing `QC_DB_PATH` — the heavy regression suites. See the README for the exact run recipe.
- Schema/migrations live in `db/schema.sql` + `src/lib/db.ts` (column migrations + a `task_delete_requests` rebuild into the spec's CASCADE shape).
- `scripts/test.mjs` (`pnpm test`) runs fast, server-less checks: spec-structure compliance, Zod schema behavior, task-policy rules, CSV escaping, and a real backup round-trip on a temp DB.
