# QC Task Manager — Status Semantics

Version 1.0 · 2026-08-28

## Contract

Every visible state communicates through a human label, a semantic tone, and a
state cue where useful. Color is never the only signal. Domain values remain
unchanged; adapters in `src/components/ui/statusTones.ts` translate them for
presentation.

| Semantic role | Meaning | Visual intent |
|---|---|---|
| `neutral` | No action or unknown state | Muted surface |
| `info` | Informational or newly available | Blue info surface |
| `pending` | Waiting, in progress, or verification | Amber pending surface |
| `warning` | Attention needed, but not necessarily failed | Orange warning surface |
| `success` | Accepted, valid, compliant, or complete | Green success surface |
| `danger` | Failed, rejected, overdue, or critical | Red danger surface |
| `blocked` | Closed to editing, cancelled, archived, or withdrawn | Strong neutral surface |

## Domain inventory and adapter ownership

| Domain | Values covered | Adapter | Legacy presentation found | Decision |
|---|---|---|---|---|
| Tasks | `not_started`, `in_progress`, `on_hold`, `completed`, `cancelled` | `task` | `StatusBadge` + `format.ts` | Keep task labels; route through `StatusBadge`/`StatusPill` |
| Findings | `OPEN`, `UNDER_REVIEW`, `ACTION_REQUIRED`, `VERIFICATION`, `CLOSED`, `REOPENED` | `finding` | `QcStatusBadge`, inline classification styling | `QcStatusBadge` now canonical; classification is separate metadata |
| CAPA | `DRAFT`, `OPEN`, `IMPLEMENTATION`, `VERIFICATION`, `EFFECTIVE`, `CLOSED`, `REOPENED` | `capa` | Raw action/status text in detail form | Adapter available; workflow controls stay domain-owned |
| Evidence | `UNVERIFIED`, `VALID`, `REJECTED`, `AI_REVIEWED`, `AI_PENDING`, `HUMAN_VERIFIED` | `evidence` | Verification labels in evidence module | Adapter available; provenance remains separate |
| Lab tests/results | workflow values plus `PASS`, `FAIL`, `HOLD` | `labTest` | `labBadgeClasses`, test result maps | Compatibility maps derive from semantic roles |
| Documents | `DRAFT`, `IN_REVIEW`, `APPROVED`, `SUPERSEDED`, `ARCHIVED` | `document` | `LabDocumentStatusBadge`, local maps | Document badge now delegates to `StatusPill` |
| Products | lifecycle values owned by lab product policy | `equipment` (when status is shown) | page-local/raw values | No business enum changed |
| Equipment | company raw status tokens (`مستخدم`, `تحت الصيانة`, `NEW`, etc.) | `equipment` | `equipmentStatus.ts` display labels | Raw values preserved; labels remain an explicit data adapter |
| Calibration | `COMPLIANT`, `DUE_SOON`, `DUE_TODAY`, `OVERDUE`, `NOT_COMPLIANT`, `UNKNOWN` | `calibration` | `labBadgeClasses` | Compatibility map derives from semantic roles |
| Maintenance | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | `maintenance` | `MAINT_STATUS_CLS` local map | Next migration target; no workflow change |
| Retests | `OPEN`, `COMPLETED` | `retest` | raw values in register/detail | Adapter available; retest rules remain unchanged |
| Notifications | `danger`, `warning`, `info`, `success` severity | `notification` | notification card severity map | Card surface now uses semantic tokens |
| Account | `active`, `disabled` and auth states | `account` | account/admin local chips | Adapter available; RBAC/auth remains server-side |
| AI | `AI_PENDING`, `AI_REVIEWED` and feature outcomes | `ai` | feature-specific result copy | Adapter available; AI never becomes authoritative workflow state |

## Compatibility and migration rules

- `StatusBadge`, `QcStatusBadge`, `LabDocumentStatusBadge`, and
  `labBadgeClasses.ts` remain public compatibility surfaces during migration.
- `neutral-strong`, `progress`, and `accent` are deprecated aliases only; new
  consumers must use `blocked`, `pending`, or `info` respectively.
- Raw domain values are never rewritten in SQLite and no authorization or
  workflow transition is performed by presentation code.
- A new domain value requires an adapter entry, a human fallback label, a
  contrast check, and a UI consistency guard before it is exposed.

## Verification matrix

- Light and dark token blocks are checked by the shared token/contrast guards.
- Status labels and decorative dots are present in rendered badges; screen
  readers receive text even when a dot or icon is omitted.
- Print views keep text labels and do not depend on color for state meaning.
- The source guard `test:status-semantics` detects missing adapters, missing
  fallback labels, raw-color badge wrappers, and unapproved legacy leakage.
