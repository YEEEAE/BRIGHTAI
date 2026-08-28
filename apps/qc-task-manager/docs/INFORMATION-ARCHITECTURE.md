# QC Task Manager — Information Architecture

> Current-state inventory and task-oriented navigation contract for
> `apps/qc-task-manager/`. URLs remain unchanged; this document describes how
> users find and traverse the existing records.

## 1. Navigation model

### Global navigation

The authenticated header exposes role-filtered destinations from
`src/components/Navbar.tsx`. The labels describe work areas rather than
implementation folders:

| Area | Current destination | Audience |
| --- | --- | --- |
| Dashboard / My Tasks | `/dashboard`, `/manager`, `/supervisor`, or `/employee` | Role-specific |
| Search | `/search` | All roles |
| Findings | `/findings` | All roles, with server-scoped records |
| Laboratory | `/lab` | All roles |
| Reports | `/reports` | Supervisor+ |
| Administration / utility | `/manager/requests`, workload, users, templates, settings, system health, notifications, account | Permission-filtered |

The desktop header keeps the six primary destinations within the existing
seven-item choice limit. On smaller screens the same links are grouped under
`Workspace` and `Administration`; this is a presentation change only, not a
second permission system.

### Laboratory local navigation

`src/lib/lab/navigation.ts` is the source for the server-filtered local nav.
The conceptual groups are:

- **Overview:** Command Center, Search, Saved Views, Calendar, Notifications
- **Testing:** Tests, New Test, Review Queue, Retests
- **Master Data:** Products, Test Templates, Equipment, Maintenance, Calibration
- **Controlled Documents:** SOP / WI Documents, New Document, Acknowledgements
- **Operations:** Change Requests, Reports, Audit Timeline, Data Quality,
  Management Dashboard

The Management Dashboard is Manager/Admin-only. Review, audit, data quality,
reports, and master-data actions remain filtered by the canonical functions in
`src/lib/permissions.ts`; the local nav never decides authorization itself.

### Utility navigation

Notifications, account security, sign out, and system administration are kept
out of the primary work-area list. They are reachable from the header or the
role-filtered `More` group. No utility link is used as an authorization
boundary.

## 2. Current route inventory by user task

The grouping below is task-oriented. It intentionally does not mirror the
directory tree one-for-one.

| User task | Entry points | Natural record flow |
| --- | --- | --- |
| Manage daily work | role home, `/search`, `/tasks/[id]` | Task → Finding → CAPA → Evidence |
| Investigate a quality issue | `/findings`, `/findings/[id]` | Finding → RCA → CAPA → Evidence → Audit |
| Execute a laboratory test | `/lab`, `/lab/tests`, `/lab/tests/new`, `/lab/tests/[id]` | Product → Test → Review → Retest → Report |
| Maintain laboratory assets | `/lab/equipment`, `/lab/equipment/[id]` | Equipment → Calibration → Maintenance → Test usage |
| Control procedures and work instructions | `/lab/documents`, document detail/edit/version routes | Document → Version → Acknowledgement → Change Request |
| Govern laboratory operations | `/lab/management`, `/lab/data-quality`, `/lab/audit`, `/lab/reports` | Queue → filtered register → record detail → audit/print |
| Administer the service | `/admin/users`, templates, settings, system health | User/template/system record → audit or operational result |

Detail pages should link to the next record in a natural flow when the
relationship exists and the current user is allowed to see it. A user should
not have to return to global navigation to move from a test to its retest,
finding, product, equipment, or report.

## 3. Permissions UX contract

The UI classification is applied after server-side permission resolution:

| Situation | UI treatment |
| --- | --- |
| Action is irrelevant to the role | Do not render it |
| Action is relevant but the record/workflow blocks it | Render a disabled action with a short reason beside the action |
| Context is useful but mutation is denied | Keep the record context visible and show a restricted/read-only state |
| Authorized and workflow-ready | Render the action as an enabled link or form control |

The distinction is important for laboratory approvals, document self-review,
terminal records, calibration, and employee task scope. Client-side visibility
is never treated as authorization; pages and API handlers re-check the session,
CSRF, role, record ownership, and lifecycle rules.

## 4. Wayfinding contract

- Every internal record/list page uses the shared server-rendered
  `Breadcrumbs.astro` component.
- The current record is the final breadcrumb with `aria-current="page"`.
- The active global and Laboratory local links use `aria-current="page"` and
  a non-color cue (weight/background).
- Back links remain available on detail and error states because breadcrumbs
  are orientation, not a replacement for a task-specific return action.
- Direct URLs, browser back, Escape from open navigation, and the mobile menu
  must preserve the same role-filtered destinations.

## 5. Validation matrix

| Check | Employee | Supervisor | Manager | Admin |
| --- | ---: | ---: | ---: | ---: |
| Global role home + Search + Findings + Laboratory | ✓ | ✓ | ✓ | ✓ |
| Reports / audit / data quality | — | ✓ | ✓ | ✓ |
| Laboratory Management Dashboard | — | — | ✓ | ✓ |
| Admin users / templates / system health | — | — | — | ✓ |
| Own/assigned record context | ✓ | ✓ | ✓ | ✓ |

The executable coverage lives in the existing route, laboratory navigation,
responsive, and accessibility suites. This document is an inventory and
labeling contract, not a replacement for those tests.

## 6. Open validation work

- Human tree testing/card sorting is not yet available; labels above are based
  on current domain vocabulary and workflows, not invented categories.
- Full VoiceOver and 200% zoom review remains a UAT activity even though the
  automated keyboard, axe, responsive, and route guards exist.
