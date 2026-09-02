# QC Task Manager — UX / IA / Service Design Evidence

**Task ID:** `QC-100-UX-IA-008`  
**Scope:** employee, supervisor, manager, and admin experiences across the QC Task Manager  
**Review date:** 2026-09-02  
**Review type:** principal UX architecture audit of the current product and target information architecture

## Executive finding

The product has a sound technical navigation foundation: role-filtered global navigation, a permission-filtered Laboratory secondary navigation, shared breadcrumbs on key detail pages, and route-level guards. The current experience is not yet a complete task-oriented service model, however. The main cognitive-load risks are duplicated work-area concepts, incomplete cross-workflow continuation, and a mismatch between the requested end-to-end journeys and the existing service blueprint.

This document is evidence, not a claim of human UX validation. Automated route, accessibility, responsive, and workflow checks show implementation behavior; they do not prove that employees can find a destination, understand ownership, or complete the work without assistance. Human tree testing, role-based UAT, and screen-reader review remain open.

## Evidence boundary and sources

The audit used the current source and existing project documentation:

| Evidence | What it establishes |
|---|---|
| `src/components/Navbar.tsx` | Global labels and role-specific entry points; notification utility and More grouping |
| `src/lib/lab/navigation.ts` | Laboratory secondary-nav groups, permission filtering, and implemented-route allowlist |
| `src/pages/**` and `src/pages/api/**` | Current visual routes, action endpoints, and record families |
| `src/pages/dashboard.astro` | Attention-oriented dashboard cards and drilldown entry points |
| `src/pages/lab/management.astro` | Management attention/risk/quality/assurance entry points |
| `src/pages/lab/reports.astro` | Report catalogue, filter preview, and download flow |
| `docs/INFORMATION-ARCHITECTURE.md` | Previous IA contract and current state grouping |
| `docs/SERVICE-BLUEPRINT.md` | Previous four-journey handoff contract |
| `docs/UX-RESEARCH-PROGRAM.md` | Unexecuted human validation plan and role task matrix |
| `scripts/route-manifest.mjs` | Separation of file routes, middleware routes, and guards |

Source citations below use repository-relative paths and line numbers so the findings can be rechecked after later changes.

## 1. User mental models and jobs to be done

The primary IA should be organized around the work people are trying to finish, not around application folders or database entities.

| Role | Primary job | Questions the IA must answer | Natural home |
|---|---|---|---|
| Employee | Complete assigned work correctly and hand it off | What is mine? What is blocked? What do I submit next? Who receives it? | **My Work** |
| Supervisor | Review team work and resolve exceptions | What needs my review? What should I return? Who owns the correction? | **Team Review** |
| Manager | Make controlled decisions and monitor operational risk | What needs approval? What risk is aging? What decision is mine? | **Command Center** |
| Admin | Keep people, configuration, and service operation healthy | What is a service/admin issue? What can I change safely? What is the audit impact? | **Administration** |

### Recommended top-level mental model

```text
My Work / Team Review / Command Center
├── Work queue (tasks, tests, reviews, returned work)
├── Quality issues (findings, RCA, CAPA, evidence)
├── Laboratory operations (testing, assets, documents, changes)
├── Insights (reports, audit, data quality)
└── Administration (users, templates, settings, system health)
```

The current implementation can preserve existing URLs while exposing these concepts through labels, section headings, contextual links, and role-specific entry points. URL hierarchy is not required to mirror the mental model.

## 2. Current-state IA audit

### Global navigation

The global header currently exposes Dashboard, Tasks, Search, Findings, Laboratory, and Reports for manager/supervisor/admin roles; employees receive My Tasks, Search, Findings, and Laboratory. Admin and manager utility destinations are in More. This is evidenced in `src/components/Navbar.tsx:40-101`.

What works:

- Role filtering is explicit and server permission checks remain authoritative.
- Primary work areas are visible at desktop widths; mobile navigation groups the same destinations under Workspace and Administration (`Navbar.tsx:103-113`).
- Notifications are treated as a utility affordance with an unread count and recent-item dropdown (`Navbar.tsx:17-32`).
- Employee access correctly starts at My Tasks rather than the manager/supervisor dashboard (`Navbar.tsx:90-100`).

IA risks:

| Finding | Evidence | Severity | Why it increases cognitive load | Target direction |
|---|---|---:|---|---|
| Dashboard, Tasks, and My Tasks are different labels for different role homes | `Navbar.tsx:46-100` | P1 | A user cannot infer whether Dashboard is a summary, queue, or home; training must explain role-specific route semantics | Use a role-specific home label plus a consistent explanatory subtitle: “Command Center”, “Team Review”, or “My Work” |
| Search is global while Laboratory also owns a second search | `Navbar.tsx:48-55`, `lab/navigation.ts:61-66` | P1 | Users must choose a search scope before knowing what is indexed | Make global Search the cross-record search and label Lab Search “Laboratory search”; show scope in the page title and query controls |
| Reports exist globally and inside Laboratory | `Navbar.tsx:48-55`, `lab/navigation.ts:82-86` | P1 | The same word suggests the same result, but the scope and catalogue differ | Keep both routes, but label them “QC Reports” and “Laboratory Reports”; link each to the other only when scope changes |
| Notifications exist globally and inside Laboratory | `Navbar.tsx:17-32`, `lab/navigation.ts:61-66` | P1 | A user may split attention across two inboxes and miss ownership-changing events | Make the global inbox canonical; make Lab Notifications a filtered view with a visible “Laboratory notifications” scope |
| Administration is a mixed More menu | `Navbar.tsx:56-63`, `Navbar.tsx:74-77` | P2 | Delete Requests, Workload, Users, Templates, Backups, and System Health have different jobs and risk | Group More into “Team operations” and “System administration”; retain RBAC filtering |

### Laboratory secondary navigation

The current five groups are a useful starting point: Overview, Testing, Master Data, Controlled Documents, and Operations (`src/lib/lab/navigation.ts:39-52`). The nav is permission-filtered and restricted to implemented routes (`navigation.ts:139-147`), which is a strong anti-dead-link contract.

The grouping is still partly system-oriented. “Master Data” hides work users think of as “Equipment readiness” and “Test setup”; “Operations” combines decisions, reporting, quality assurance, and change control. Recommended labels and grouping:

| Current group | Target user-facing group | Included jobs |
|---|---|---|
| Overview | **Laboratory home** | Command Center, calendar, saved views, scoped notifications |
| Testing | **Testing work** | Tests, new test, review queue, retests |
| Master Data | **Readiness & reference data** | Products, templates, equipment, calibration, maintenance |
| Controlled Documents | **Procedures & acknowledgement** | SOP/WI register, new/revise, versions, acknowledgements |
| Operations | **Governance & insights** | Change requests, reports, audit, data quality, management |

This is a labeling change, not a permission change. `lab/navigation.ts:13-30` and `src/lib/permissions.ts` remain the authority for visibility and action eligibility.

### Breadcrumbs and page titles

The existing IA contract requires shared breadcrumbs on internal record/list pages and a task-specific back action (`docs/INFORMATION-ARCHITECTURE.md:42-54`). Detail pages such as Laboratory Management implement the pattern with `QC Tasks → Laboratory → Management` (`src/pages/lab/management.astro:58-62`).

Audit rule for every page:

```text
Breadcrumb: Home / Work area / Record family / Record
Title: [verb or object] + [scope], never an implementation name
Context: status · owner · next role · blocker
Return: back to the queue that launched this task
```

Open gap: the current evidence does not prove breadcrumb coverage for every list, create, edit, print, error, and scoped sub-route. The route manifest counts file routes but does not itself validate wayfinding semantics (`scripts/route-manifest.mjs:1-11`). This needs a route-level IA guard or a documented exception list.

### Dashboard entry points and attention model

The dashboard is already attention-oriented: filters are shared across KPI cards, charts, and tables (`src/pages/dashboard.astro:5-13`), and the Laboratory Management page exposes approval, change-request, calibration, equipment, document, retest, data-quality, audit, and system-health links (`src/pages/lab/management.astro:33-77`).

The target order for role homes should be:

1. **Needs my action** — actionable queue with owner and due/age.
2. **Blocked or at risk** — missing evidence, overdue calibration, rejected change, failed/hold test.
3. **Continue recent work** — drafts, returned records, last opened queue.
4. **Insights** — trends and reports, below actions.

Current risk: the product has strong destination links but does not yet prove that every card explains owner, next action, and resolution state. A card that opens a filtered register is only a valid entry point if the register preserves the filter, announces the scope, and provides a next action.

### Search, reports, notifications, settings, and admin

| Area | Current state | IA assessment | Required contract |
|---|---|---|---|
| Search | Global `/search` and Lab `/lab/search` | Useful separation only if scope is explicit | State searchable record types, current scope, filters, zero-result recovery, and result next actions |
| Reports | Global `/reports` and Lab `/lab/reports` | Duplicate label and potentially duplicate decision point | Title must include scope; preview must show date/filter/data scope before download |
| Notifications | Global `/notifications` and Lab `/lab/notifications` | Duplicate inbox risk | One canonical notification center plus scoped views; each item must link to action and resolution |
| Settings | `/admin/settings`, `/account/security` | Settings and personal security are correctly different jobs but discoverability is uneven | Keep account security in account; keep backups/configuration under System administration; explain permissions and operational impact |
| Admin | `/admin/users`, templates, settings, system health, audit | Admin home redirects to role home (`src/pages/admin/index.astro:1-3`) | Provide an explicit Administration landing page with People, Configuration, Operations, and Audit entry points; preserve route guards |

## 3. Target navigation contract

### Global navigation by role

| Role | Primary | Secondary/utility | Home attention priority |
|---|---|---|---|
| Employee | My Work · Search · Quality issues · Laboratory | Notifications · Account security | Returned work, due tasks, drafts, blocked submissions |
| Supervisor | Team Review · Search · Quality issues · Laboratory · Reports | Notifications · Team workload · Account security | Reviews due, returned/rework, overdue team work, findings |
| Manager | Command Center · Work queue · Search · Quality issues · Laboratory · Reports | Notifications · Team workload · Delete requests · Account security | Approvals, aged queues, quality risk, change requests |
| Admin | Command Center · Work queue · Search · Quality issues · Laboratory · Reports | Administration: People · Templates · System health · Settings · Audit | Service health, access issues, backup status, then operational risk |

### Laboratory local navigation by job

```text
Laboratory home
├── Testing work
│   ├── Test register
│   ├── Start a test
│   ├── Review queue
│   └── Retests
├── Readiness & reference data
│   ├── Products
│   ├── Test templates
│   ├── Equipment
│   ├── Calibration
│   └── Maintenance
├── Procedures & acknowledgement
│   ├── SOP / WI register
│   ├── Draft or revise document
│   └── Acknowledgements
└── Governance & insights
    ├── Change requests
    ├── Reports
    ├── Audit timeline
    ├── Data quality
    └── Management command center
```

The implementation can continue using `labNavForRole()` and the current route allowlist. The required change is the visible taxonomy and cross-link behavior, not the URL tree.

## 4. Service design: critical journeys

Legend: **Implemented** means a route/action exists in the current source; **partial** means the path exists but continuity, ownership, or evidence is not proven end-to-end; **gap** means the requested journey is not fully represented by the current documented blueprint or route contract.

### 4.1 Task creation → assignment → work → review → completion

| Stage | Employee | Supervisor/manager | System evidence | IA/service risk | Target handoff |
|---|---|---|---|---|---|
| Create | Start permitted task or draft | Manager/supervisor may create for team | `/employee/new`, `/supervisor/new`, `/manager/new`; middleware create handler in `scripts/route-manifest.mjs:46-70` | Multiple role-specific create entry points can feel like different products | One “Create work” label, role-specific form defaults, explicit owner |
| Assign | Confirm assignee and due date | Assign/reassign within authority | Role home routes and task detail | Ownership can be hidden in the form rather than summarized after save | Confirmation states “Owner / due / next role” |
| Work | Save, resume, attach evidence, comment | Monitor without taking employee work | Task detail and update endpoints | Users may not know whether save is draft or handoff | Persistent state + “Continue work” entry |
| Review | Submit once and see queue/next owner | Review, return, or approve as permitted | `tasks/[id]`, `TaskLifecycle`, review contracts | Return reason and next owner must remain visible after transition | Review result links back to the task and owner |
| Complete | See terminal outcome and history | Verify completion and evidence | close/reopen routes and audit | Completion can be mistaken for approval | Distinguish “completed work” from “approved decision” |

**Status:** partial. The route and lifecycle foundation exists, but this audit does not find a single documented trace covering assignment as a first-class user step, reviewer handoff, and terminal completion for all four roles.

### 4.2 Finding → RCA → CAPA → approval → closure

| Stage | Primary actor | Required screen answer | Current route/evidence | Target continuation |
|---|---|---|---|---|
| Find | Employee/supervisor/lab reviewer | What failed, where, and why it matters | `/findings`, `/findings/[id]` | Link from task/test result with source record context |
| RCA | Supervisor/manager | What is the root cause and what evidence supports it? | `/findings/[id]` and RCA API | Anchor RCA section in the finding, not a separate destination |
| CAPA | Assigned owner | What action, owner, due date, and evidence are required? | CAPA/evidence APIs under finding | Create or open CAPA in the same finding context |
| Approval | Authorized manager | What exactly am I approving and what remains blocked? | Finding policy/e-signature contracts | Approval action shows scope, evidence, and next role |
| Closure | Owner/verifier/manager | Why is this closed and how can I reopen safely? | Finding detail and audit | Closure summary links to RCA, CAPA, evidence, and audit |

**Status:** partial. The previous IA contract names the Finding → RCA → CAPA → Evidence flow (`docs/INFORMATION-ARCHITECTURE.md:26-38`), but the current evidence does not prove a complete approval-to-closure continuation map.

### 4.3 Lab test → submit → review → approve

| Stage | Primary actor | Touchpoint | Failure/recovery | Target next action |
|---|---|---|---|---|
| Start | Lab operator | `/lab/tests/new` | Missing product/equipment/reference data explains what to fix | “Save draft” or “Resolve reference data” |
| Enter | Lab operator | Lab test form | Section-level validation and draft preservation | Resume from last incomplete section |
| Submit | Lab operator | Submit for review | Review gate names exact missing field/evidence | Show submitted status and review queue link |
| Review | Reviewer/supervisor | `/lab/tests/review`, `/lab/tests/[id]` | Return for changes preserves original test and reason | Return to operator with owner and due context |
| Approve | Authorized reviewer/manager | Review action | Self-review and unauthorized transitions remain unavailable | Show terminal decision and related finding/retest/report |

**Status:** implemented foundation, partial service continuity. The form has explicit save/review states according to `docs/UX-RESEARCH-PROGRAM.md` and existing lab form contracts; the approval and related-record continuation still needs route-level traceability evidence.

### 4.4 Equipment → maintenance → calibration

| Stage | User job | Current route | Required IA signal |
|---|---|---|---|
| Find asset | Locate the equipment and readiness state | `/lab/equipment`, `/lab/equipment/[id]` | Searchable identity, status, next due date |
| Maintain | Record a maintenance event | `/lab/equipment/[id]/maintenance` | Maintenance history and returned-to-service outcome |
| Calibrate | Create or review calibration | `/lab/calibration`, `/lab/calibration/[id]` | Compliant/due/overdue/not compliant/unknown with explanation |
| Decide | Know whether testing can safely continue | Equipment/test context | One clear next action: maintain, calibrate, escalate, or use |

**Status:** partial. The current service blueprint records derived calibration states and append-only maintenance (`docs/SERVICE-BLUEPRINT.md:23`, `26-38`), but the audit requires stronger cross-links from the equipment detail to the next maintenance/calibration action and from a test to the equipment readiness explanation.

### 4.5 SOP/WI → revision → approval → acknowledgement

| Stage | Primary actor | Current destination | Required handoff |
|---|---|---|---|
| Find/use | Employee/lab operator | `/lab/documents`, `/lab/documents/[id]` | Current approved version and acknowledgement state |
| Revise | Author | `/lab/documents/new`, `/lab/documents/[id]/edit` | Change summary, source version, reviewer/approver |
| Review | Reviewer | Document detail/workflow | “Return for changes” returns to author without losing version context |
| Approve | Manager/admin | Document workflow | Approval scope and immutable version are explicit |
| Acknowledge | Assigned employee | `/lab/acknowledgements`, `/lab/acknowledgements/assign` | Link directly from notification to acknowledgement action |

**Status:** partial. The route family and state model exist; the previous blueprint covers draft/review/approved and version immutability (`docs/SERVICE-BLUEPRINT.md:24`, `26-38`). A full trace from revision to acknowledgement and notification resolution is not yet proven.

### 4.6 Change request → review → apply

| Stage | Primary actor | Current destination | Service contract |
|---|---|---|---|
| Propose | Contributor | `/lab/change-requests/new` | State what changes, why, affected record, and requested owner |
| Track | Contributor/reviewer | `/lab/change-requests`, `/lab/change-requests/[id]` | Show status, ageing, next role, and rejection reason |
| Review | Supervisor/manager/admin | Review API under change request | Approval/rejection is a decision with an audit event |
| Apply | Responsible operator/system owner | Related product/template/document/equipment context | Applying the change must not require re-finding the affected record |
| Resolve | Requester | Change request detail + notification | Closed request explains outcome and links to resulting record/version |

**Status:** partial. The management dashboard links to pending and rejected change-request registers (`src/pages/lab/management.astro:34-39`), but the “apply” step is not represented as a first-class continuation in the current service blueprint. This is the highest-risk dead-end candidate in the requested journeys.

### 4.7 Notification → action → resolution

| Stage | User question | Current evidence | Target behavior |
|---|---|---|---|
| Receive | Why am I seeing this? | Navbar supports unread count and recent notifications (`Navbar.tsx:17-32`) | Include event type, affected record, urgency, and owner |
| Open | Where do I act? | Notification item carries `href` (`Navbar.tsx:18-24`) | Link directly to the actionable state, not merely a list |
| Act | What can I do? | Action eligibility remains server-authoritative | Show permitted action, blocked reason, and next role |
| Resolve | Is it finished? | Read/read-all endpoints exist | Mark read is not resolution; item remains linked to outcome/status |

**Status:** partial. The product has notification delivery and read state, but read state is not the same as workflow resolution. The canonical notification center must show “open / action required / resolved” semantics and avoid duplicate global/Lab inboxes.

## 5. Cross-workflow service blueprint

| Lane | Shared target behavior |
|---|---|
| Physical evidence | Page title, breadcrumb, status, owner, next role, blocker, related record links, confirmation, notification |
| User action | Start, save, resume, submit, review, return, approve, acknowledge, apply, close |
| Frontstage | Show the next permitted action; preserve filter/context after a handoff; explain unavailable actions |
| Backstage | Resolve server scope/RBAC, validate lifecycle, persist audit event, create notification, derive related states |
| Support processes | SQLite schema/migrations, permission authority, route middleware, audit chain, report/export services, backup/health services |

### Service failure points to remove

| Failure point | User impact | Design remedy | Verification needed |
|---|---|---|---|
| A record changes owner but the UI stays on a generic detail page | User does not know what happens next | Add next-role/owner handoff panel and direct continuation link | Role UAT across submit/return/approve |
| A notification marks read before the work is resolved | Users lose attention signal | Separate read state from resolution state | Notification E2E + human comprehension test |
| A filtered KPI opens a register without an obvious scope | User distrusts counts or repeats filtering | Preserve query, title the scope, and show active filters | Route/link contract and browser test |
| Change is approved but application requires a new search | Context switching and duplicate entry | Link approval result to affected record/version and apply action | End-to-end change request scenario |
| A related record is absent or unauthorized | Dead link or unexplained blank state | Omit links when relation is absent; explain restricted context when applicable | Authorized/unauthorized fixture matrix |

## 6. Route and navigation traceability

### Entry-point coverage matrix

| Destination family | Global entry | Local entry | Detail continuation expected | Current assessment |
|---|---|---|---|---|
| Tasks | Role home, Tasks | — | Finding, comment, evidence, review/close | Entry exists; complete continuation needs audit |
| Findings | Global Findings | Lab/test related link | RCA, CAPA, evidence, audit | Entry exists; approval/closure trace partial |
| Tests | Laboratory | Lab Testing work | Product, equipment, finding, retest, report | Entry exists; related-link completeness partial |
| Equipment | Laboratory | Lab Readiness & reference data | Maintenance, calibration, tests | Entry exists; readiness continuation partial |
| Documents | Laboratory | Procedures & acknowledgement | Version, change request, acknowledgement | Entry exists; acknowledgement resolution partial |
| Change requests | Laboratory/management cards | Governance & insights | Affected record/version and notification | Review exists; apply continuation gap |
| Reports | Global Reports | Lab Reports | Source register and applied scope | Duplicate scope labels need resolution |
| Notifications | Header utility | Lab scoped view | Action target and resolved record | Duplicate inbox semantics need resolution |
| Admin | More | Admin landing target | Users/templates/settings/health/audit | `/admin` currently redirects; landing page discoverability gap |

### Orphan/dead-end rule

The target is **zero orphan destinations** and **zero dead-end journeys**, but this review does not claim that target is already achieved. The current route manifest proves file-route existence and separates middleware routes (`scripts/route-manifest.mjs:1-70`); it does not prove that every route has a parent link, breadcrumb, role-home entry, or next action.

To make the target testable, every visual route should have these fields in a route IA registry:

```text
route
page title
mental-model area
allowed roles
parent entry point
breadcrumb parent
primary job
primary action
back/return destination
next-state destination(s)
empty/error recovery
related record links
owner of the next step
```

Exceptions: login, logout, 404/500, print views, API routes, and intentional terminal states. Exceptions must be explicit, not inferred from missing links.

## 7. Prioritized remediation backlog

| Priority | Change | Impact | Size | Acceptance signal |
|---|---|---|---|---|
| P0 | Add route IA registry and automated parent/breadcrumb/back/next-action coverage | Makes orphan and dead-end claims measurable | M | Every non-exempt visual route has a trace row; zero unexplained failures |
| P0 | Make notification resolution distinct from read/unread and converge global/Lab inbox semantics | Prevents missed operational work | M | Notification journey resolves to action and terminal state for each role |
| P1 | Rename/clarify Dashboard, Tasks, Search, Reports, Notifications by scope and job | Reduces choice ambiguity without URL migration | S | Tree test users choose the right destination first click |
| P1 | Add cross-links for test↔equipment↔calibration↔finding↔retest↔report | Removes context switching | M | Each seeded relation is traversable forward and back under authorized roles |
| P1 | Complete change-request “apply” continuation | Removes the clearest dead-end risk | M | Approved request opens affected record/version and records applied outcome |
| P1 | Add Administration landing page | Makes admin jobs discoverable | S | Admin can reach people, templates, settings, health, and audit from one home |
| P2 | Replace system labels “Master Data” and mixed Operations grouping | Matches user vocabulary | S | Labels pass card sort/tree test with no role-specific explanation |

## 8. Validation plan and limits

The current project research program is ready but has no participant findings (`docs/UX-RESEARCH-PROGRAM.md` status and participant plan). Validate the target IA separately by role:

| Test | Employee | Supervisor | Manager | Admin |
|---|---:|---:|---:|---:|
| Tree test: locate primary job | ✓ | ✓ | ✓ | ✓ |
| First click: identify next action | ✓ | ✓ | ✓ | ✓ |
| Journey test: create/hand off | ✓ | ✓ | ✓ | — |
| Journey test: review/approve | — | ✓ | ✓ | — |
| Journey test: lab readiness/docs/change | ✓ | ✓ | ✓ | — |
| Journey test: settings/health/access | — | — | — | ✓ |
| VoiceOver/keyboard/200% zoom | ✓ | ✓ | ✓ | ✓ |

Do not convert automated PASS into UX success. Existing automated evidence is useful for implementation regressions, while the open validation questions are findability, comprehension, ownership, and recovery.

## Final assessment

- **IA foundation:** strong but taxonomy has duplicate scopes and mixed jobs.
- **Wayfinding:** key detail-page breadcrumbs and back affordances exist; complete route coverage is unproven.
- **Service continuity:** task/test/finding/document/equipment foundations exist; change-request apply and notification resolution need explicit continuation.
- **Traceability:** route existence is covered, route-to-mental-model and route-to-next-action are not yet fully registered.
- **100% readiness:** **partial / conditional** until the route IA registry, seven journey validation, and role-based human testing are complete.

