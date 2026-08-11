# Single Source of Truth — QC Task Manager

This contract defines where business authority lives. A consumer may read or
present a rule, but it must not recreate or override the rule.

## Ownership matrix

| Rule family | Canonical owner | Allowed consumers | Forbidden owner |
| --- | --- | --- | --- |
| Roles and RBAC | `apps/qc-task-manager/src/lib/permissions.ts` | server pages, API adapters, tests | React/Astro UI state |
| Task statuses and transitions | `src/lib/task-policy.ts` + `src/lib/workflows/` | mutation services, validation, tests | UI buttons or AI output |
| Field locking | `src/lib/task-policy.ts` | `permissions.ts`, task mutation service, UI hints | client-submitted allowlists |
| Request shape validation | `src/lib/validation.ts` | API/page handlers | UI-only validation |
| SLA, overdue, due-soon | `src/lib/sla/` | notifications, pages, tests | duplicated date calculations |
| Lifecycle orchestration | `src/lib/workflows/` and `taskUpdates.ts` | API handlers | UI or AI |
| Server audit | `src/lib/audit/` + `src/lib/activity.ts` | accepted mutation services | browser requests or AI |
| Findings and risk | `src/lib/findings/` + policy constants | forms, reports, tests | AI as final authority |
| CAPA rules | `src/lib/capa/` | findings/workflow adapters, tests | UI or AI as final authority |
| AI suggestions | `src/lib/ai/` | advisory UI and server adapters | DB, permissions, workflows, audit |
| Critical invariants | `db/schema.sql` and migrations | DB layer and tests | UI/API assumptions alone |

## Trust flow

```text
UI request
  → API session + CSRF + route validation
  → domain validation and authorization
  → workflow/policy mutation
  → SQLite constraints / conditional write
  → server-side audit event
```

- The UI is a presentation and request layer. Its disabled controls are hints,
  not authorization.
- The API resolves the current session and current database row, then repeats
  every relevant check. It does not trust role, actor, status, or field lists
  supplied by the browser.
- AI can suggest summaries, findings, CAPA text, or next steps. It cannot
  approve, assign, transition, close, reopen, cancel, or write audit events.
- SQLite protects status, role, progress, foreign-key, and child-record
  invariants. Application policy still owns business transitions that cannot be
  represented safely as a row CHECK constraint.
- Audit events are created after accepted server mutations and use the actor
  resolved from the server session.

## Duplication policy

Do not add a second role list, status transition map, field-lock list, upload
allowlist, validation limit, or SLA calculation. Compatibility re-exports are
allowed when they point to the canonical implementation and contain no copied
rule data.

Run the guard with:

```bash
pnpm --filter @brightai/qc-task-manager test:architecture
```

The guard reports stable categories and file/line evidence for duplicate
authority, UI authority, AI authority, API authority, missing canonical
modules, and missing database invariants.

