# UI-VISUAL-100 Evidence

**Task:** `QC-100-UI-VISUAL-007`  
**Date:** 2026-09-02  
**Scope:** `apps/qc-task-manager` visual routes

## What changed

- Added a single `qc-page-content` flow to the shared `BaseLayout`; standard
  pages now use a wider responsive content shell (`max-w-7xl`) with consistent
  mobile/tablet/desktop gutters.
- Added token-backed `qc-page-stack`, `qc-surface-panel`, `qc-table-panel`, and
  `type-metadata` recipes. Tables inherit readable headers, aligned cells,
  semantic surfaces, and bounded hover feedback without changing their data or
  links.
- Migrated the search, laboratory test register, and controlled-document
  register to the shared table panel. Their GET filters, pagination, links,
  and status components are unchanged.
- Migrated sign-in and 404 surfaces to the shared page title, form-field,
  banner, button, and surface primitives. Authentication behaviour is unchanged.
- Added a deterministic route guard (`test:ui-visual-100`) that inventories all
  76 Astro pages, identifies the 5 print routes and the `/admin` redirect, and
  prevents unclassified visual pages or missing shared recipes.

## Route coverage

Every Astro page below was included in the route guard and reviewed for layout
ownership, page classification, shared shell coverage, and visual recipe use.
`/admin` is a redirect-only route; print routes retain their dedicated print
layout. API endpoints and `logout.ts` are non-visual and are intentionally not
counted as pages.

| Route | Review result |
| --- | --- |
| `/404`, `/login`, `/` | Entry surface + title hierarchy reviewed |
| `/account/security`, `/dashboard`, `/dashboard/drilldown`, `/notifications`, `/reports`, `/search` | Shared shell and action/data hierarchy reviewed |
| `/employee`, `/employee/new`, `/supervisor`, `/supervisor/new` | Workflow shell and form surfaces reviewed |
| `/manager`, `/manager/new`, `/manager/requests`, `/manager/workload` | Workflow shell, KPIs, and workload surfaces reviewed |
| `/tasks/[id]`, `/findings`, `/findings/[id]` | Detail/register hierarchy and breadcrumbs reviewed |
| `/admin` | Redirect-only exception verified |
| `/admin/settings`, `/admin/system-health`, `/admin/templates`, `/admin/templates/new`, `/admin/templates/[id]/edit` | Admin shell and supporting information reviewed |
| `/admin/users`, `/admin/users/audit` | Admin register/table hierarchy reviewed |
| `/lab`, `/lab/management`, `/lab/search`, `/lab/notifications`, `/lab/calendar`, `/lab/audit`, `/lab/data-quality`, `/lab/reports`, `/lab/saved-views` | Lab command-center hierarchy reviewed |
| `/lab/tests`, `/lab/tests/new`, `/lab/tests/review`, `/lab/tests/[id]`, `/lab/tests/[id]/print` | Test workflow, status, register, and print exception reviewed |
| `/lab/retests`, `/lab/retests/new`, `/lab/retests/[id]` | Retest workflow and status hierarchy reviewed |
| `/lab/change-requests`, `/lab/change-requests/new`, `/lab/change-requests/[id]` | Change-request workflow and action hierarchy reviewed |
| `/lab/products`, `/lab/products/new`, `/lab/products/[id]`, `/lab/products/[id]/edit` | Product register/form/detail surfaces reviewed |
| `/lab/equipment`, `/lab/equipment/new`, `/lab/equipment/[id]`, `/lab/equipment/[id]/edit`, `/lab/equipment/[id]/maintenance`, `/lab/equipment/[id]/print` | Equipment surfaces and print exception reviewed |
| `/lab/calibration`, `/lab/calibration/new`, `/lab/calibration/[id]`, `/lab/calibration/[id]/edit`, `/lab/calibration/[id]/print` | Calibration surfaces and print exception reviewed |
| `/lab/maintenance/[id]/print` | Maintenance print exception reviewed |
| `/lab/documents`, `/lab/documents/new`, `/lab/documents/[id]`, `/lab/documents/[id]/edit`, `/lab/documents/[id]/versions`, `/lab/documents/[id]/print` | Controlled-document surfaces, register, and print exception reviewed |
| `/lab/templates`, `/lab/templates/new`, `/lab/templates/[id]`, `/lab/templates/[id]/edit` | Lab template register/form/detail surfaces reviewed |
| `/lab/acknowledgements`, `/lab/acknowledgements/assign` | Acknowledgement workflow surfaces reviewed |

**Guard result:** `76/76` Astro routes classified; `5` print routes and `1`
redirect-only exception explicitly identified.

## Responsive coverage

| Viewport | Source contract | Browser run |
| --- | --- | --- |
| 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 | Responsive layout uses fluid width, wrapping actions, and scrollable register panels | Pending dedicated visual capture |

The existing responsive E2E contract passed and the new guard confirms the
shared shell and register panel are present. A dedicated screenshot/visual
capture at every requested width still needs a browser session; it is not
claimed here as completed evidence.

## Verification

- `pnpm test:ui-visual-100` ✅ — 171/171 checks, 76 Astro routes.
- `pnpm test:ui-consistency` ✅ — 212/212 checks.
- `pnpm test:design-system-100` ✅ — 29 token checks, 21 primitive checks.
- `pnpm test:interaction-feedback` ✅ — 25/25 checks.
- `pnpm test:responsive-e2e-contract` ✅.
- `pnpm test:manifest` ✅ — 71 canonical suites, 28 E2E suites.
- `pnpm typecheck` ✅ — 0 errors, 0 warnings, 0 hints.
- `NODE_ENV=production pnpm build` ✅ — Complete.
- `git diff --check` ✅.
- `pnpm e2e:acceptance` ⏭️ — cancelled at the user's request after the first
  three suites had started; no acceptance-pass claim is made.

## Remaining evidence gap

No claim is made for a human designer sign-off, VoiceOver/NVDA review, or a
fresh screenshot run at all ten requested widths because no browser capture was
available in this execution. These are the remaining manual acceptance items.
