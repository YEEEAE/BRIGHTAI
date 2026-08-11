# QC Task Manager Architecture Guard Design

**Status:** Approved for implementation
**Scope:** `apps/qc-task-manager`

## Goal

Make the QC Task Manager's business rules auditable and centrally owned, then add a deterministic Architecture Guard that detects duplicated authority and unsafe layer boundaries.

## Current baseline

The application already has `src/lib/task-policy.ts` as the canonical home for task-domain constants and predicates, `src/lib/permissions.ts` for role authorization, `src/lib/validation.ts` for Zod input schemas, `src/lib/taskUpdates.ts` for server-side mutations, and SQLite constraints in `db/schema.sql`. The implementation will preserve these contracts and consolidate only duplicated or misplaced authority.

## Architecture

The canonical task rule surface is `src/lib/task-policy.ts`. It owns status values and transitions, employee field locks, task limits, upload allowlists, and pure task predicates. `src/lib/permissions.ts` owns role and authorization decisions and imports task policy definitions rather than recreating them. `src/lib/validation.ts` owns request-shape validation; domain predicates remain in the policy modules so validation cannot become the authorization layer.

The domain is organized into focused modules:

- `src/lib/sla/` owns SLA and due-date calculations.
- `src/lib/workflows/` owns task lifecycle transition contracts.
- `src/lib/audit/` owns server-side audit contracts and adapters.
- `src/lib/ai/` owns AI suggestions/adapters and has no mutation or authorization authority.
- `src/lib/findings/` owns finding classification and risk rules.
- `src/lib/capa/` owns corrective/preventive action rules.

Existing behavior is migrated incrementally. A new module must not create a second source of truth; compatibility exports may remain where existing callers require them.

## Trust boundaries

1. UI components and pages may render capabilities and submit requests, but must not be authorization authority.
2. API handlers must resolve the current server-side user and task, re-run validation and policy checks, and perform conditional/parameterized mutations.
3. AI code may propose text, classifications, or next actions. It cannot authorize, transition, close, reopen, cancel, assign, or write audit records as a business actor.
4. SQLite protects critical invariants with foreign keys, CHECK constraints, and conditional writes where applicable.
5. Audit records are created server-side from accepted mutations; clients cannot supply the actor or claim an audit event directly.

## Architecture Guard

`apps/qc-task-manager/scripts/architecture-guard.mjs` will be a dependency-free static check. It will scan source and schema files deterministically and fail with file/line evidence when it finds:

- duplicated role/permission authority outside the canonical authorization module;
- duplicated status transition maps or terminal-state definitions outside the canonical policy/workflow modules;
- duplicated field-lock lists outside `task-policy.ts`;
- duplicated validation constants or schema ownership outside `validation.ts`/domain policy modules;
- duplicated SLA/overdue calculations outside `sla/`;
- UI imports or code paths that directly access the DB or make server authorization decisions;
- AI modules importing mutation/workflow/authorization authority;
- mutation API modules that bypass the server policy/audit path;
- missing critical schema constraints for task status, user role, or task foreign keys.

Known compatibility exports and narrowly scoped infrastructure exceptions will be explicit in the guard's allowlist with a reason, rather than silently ignored.

## Testing strategy

Tests are written before implementation. The guard receives focused failing tests for canonical ownership and forbidden imports/authority, then the minimum implementation is added. Existing domain tests remain the behavioral source for status transitions, validation, field locking, calculations, and upload rules. The guard is included in the package test command.

## Documentation

- `docs/SINGLE-SOURCE-OF-TRUTH.md` will define rule ownership, allowed consumers, prohibited duplication, and the trust-boundary contract.
- `apps/qc-task-manager/docs/ARCHITECTURE.md` will document the module map, domain layers, and request flow.
- `apps/qc-task-manager/SECURITY.md` will document UI/API/AI/DB/audit boundaries and the Architecture Guard release check.

## Out of scope

- Introducing a new authorization framework or dependency.
- Replacing SQLite or changing deployment architecture.
- Giving AI write access to task state.
- Creating separate Finding/CAPA HTTP products; this change establishes domain boundaries and contracts only.
- Committing, branching, or pushing changes.
