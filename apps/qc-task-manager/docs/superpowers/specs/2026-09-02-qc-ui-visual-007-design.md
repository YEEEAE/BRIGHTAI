# QC UI Visual 007 — Enterprise Visual Refinement

**Task:** `QC-100-UI-VISUAL-007`  
**Date:** 2026-09-02  
**Status:** Approved conversational direction; awaiting written-spec review

## Goal

Bring every server-rendered QC Task Manager screen to a consistent enterprise
standard without changing the product's background identity, data, routes,
authorization, business rules, or workflows. Every page must make the page
identity, primary work, current status/KPI, secondary actions, and supporting
information immediately distinguishable.

## Non-negotiable constraints

- Keep the current fixed `SystemBackground` and the existing readable content
  layer. Do not add a global scrim, replace the video, or change its rendering
  contract.
- Preserve all server-side queries, form methods, endpoint contracts, route
  URLs, permissions, audit behaviour, and workflow states.
- Keep the UI English and use the active v2 semantic tokens and shared
  components. No new visual or chart dependency.
- Retain native table semantics and horizontal scrolling where a true register
  cannot safely collapse into cards.
- Maintain WCAG 2.2 AA contrast, visible keyboard focus, text-visible statuses,
  and a 44px minimum target for standalone touch actions.

## Visual direction

The existing product is an operational internal tool, so this is a calm,
structured refinement rather than a decorative redesign:

1. **Reading surfaces.** Use opaque or deliberately translucent local surfaces
   only where content sits above a changing part of the background. They use
   semantic border, elevation, and surface tokens; blur remains limited to the
   already-approved reading/header surfaces, never large scrolling regions.
2. **Hierarchy.** A canonical page flow is: breadcrumb where relevant,
   `PageHeader`, current warning/blocker, primary action or work queue, key
   KPI/status, then supporting registers/history. Destructive actions remain
   separate and last.
3. **Typography.** Page titles, section headings, metadata, IDs, timestamps,
   tables, labels, and numbers use the named type roles. Data and dates use
   tabular figures where alignment matters; reading copy remains constrained to
   the existing readable measure.
4. **Density.** Tables remain information-dense but gain consistent header,
   row, column, and action spacing. Cards group a single decision or data unit;
   incidental borders and duplicate nested panels are removed rather than
   replaced by ornamental effects.
5. **Responsive behaviour.** Layouts start as a single column. Toolbars wrap
   before controls become too narrow, action groups remain reachable, and tables
   preserve usable columns using a scroll panel or a documented card fallback.

## Implementation boundaries

### Shared foundation

- Refine only the existing semantic tokens and reusable recipes when one proven
  problem affects more than one route: page shell, header/readability surface,
  table panel, section header, card, form controls, action groups, and metadata.
- Use the existing `PageHeader`, `SectionHeader`, `Card`, `AppButton`,
  `StatusPill`, `Banner`, `EmptyState`, `Pagination`, and form primitives.
- Keep legacy compatibility adapters but migrate each edited route to the
  canonical contract rather than adding a competing component pattern.

### Route-family migration

Each family is reviewed against the same visual checklist and changes only its
presentation markup/classes.

| Family | Covered routes |
| --- | --- |
| Entry and shared operations | `/`, `/login`, `/404`, `/dashboard`, `/dashboard/drilldown`, `/search`, `/notifications`, `/reports`, `/account/security` |
| Task workflow | `/employee`, `/employee/new`, `/supervisor`, `/supervisor/new`, `/manager`, `/manager/new`, `/manager/workload`, `/manager/requests`, `/tasks/[id]`, `/findings`, `/findings/[id]` |
| Laboratory command, registers, and operations | `/lab`, `/lab/management`, `/lab/search`, `/lab/notifications`, `/lab/calendar`, `/lab/audit`, `/lab/data-quality`, `/lab/reports`, `/lab/saved-views`, `/lab/acknowledgements/*`, `/lab/change-requests/*`, `/lab/retests/*`, `/lab/tests/*` |
| Laboratory master data and controlled documents | `/lab/products/*`, `/lab/equipment/*`, `/lab/calibration/*`, `/lab/maintenance/*`, `/lab/documents/*`, `/lab/templates/*` |
| Administration | `/admin`, `/admin/settings`, `/admin/system-health`, `/admin/users`, `/admin/users/audit`, `/admin/templates/*` |
| Print variants | all dedicated `*/print` pages: preserve print layout and validate separately from interactive screen chrome |

Dynamic routes are audited through representative, real test fixtures and their
shared page template. API and logout routes are not visual pages; they are listed
in evidence as out of visual scope so coverage cannot be implied.

## Verification and evidence

Create `apps/qc-task-manager/UI-VISUAL-100-EVIDENCE.md` with:

- inventory of every file route, split into visual and non-visual routes;
- each visual route's family, template owner, hierarchy/surface/table/responsive
  review result, and any justified exception;
- viewport checks at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, and 1920;
- proof that no horizontal overflow, clipped controls, text overlap, broken
  dialogs, or undersized standalone controls remains in covered templates;
- fresh command output for the visual consistency, design-system, responsive,
  typecheck, build, and acceptance tests; failed or unavailable checks are
  reported plainly rather than inferred.

## Out of scope

- Changes to database schema, migrations, backend query behaviour, API payloads,
  session/RBAC, audit history, or workflow transitions.
- Replacing the global background or adding page-wide visual effects.
- New dependencies, deployment, commit, or push.
