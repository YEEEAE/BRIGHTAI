# QC-100-DESIGN-SYSTEM-006 — Design-system evidence

**Date:** 2026-09-02  
**Scope:** `apps/qc-task-manager` visual foundations, reusable primitives, and machine-verifiable consistency rules.  
**Out of scope:** workflow rules, server-side RBAC/CSRF, route URLs, SQLite data, and user-visible business behavior.

## Outcome

The task manager now has a versioned v2 token contract and a canonical primitive
catalogue. The guard makes raw palette values and unbounded transitions fail inside
the shared UI layer, while preserving a clearly reported legacy migration boundary for
route markup that cannot safely be bulk-rewritten.

## Audit evidence

| Area | Count | Finding |
| --- | ---: | --- |
| Astro pages | 76 | Mixed legacy page-level Tailwind visual rules remain. |
| Visual components | 45 | Shared UI owns the canonical recipes; domain adapters are retained. |
| Files containing raw palette utilities | 98 | Legacy migration queue, not a canonical-system claim. |
| High-frequency drift | 620 `text-slate-500`, 530 `text-slate-900`, 304 `border-slate-200` | Replaced in shared primitives by semantic aliases; routes migrate safely in follow-up batches. |

The audit included pages, Astro/React components, shared panels, forms, badges,
notifications, tables, page headers, navigation primitives, charts' semantic color
roles, and existing dialog/drawer behavior owners. No business behavior was changed.

## Implemented canonical contract

- Foundation tokens cover typography, spacing, radius, borders, elevation/shadows,
  opaque/glass/overlay surfaces, icon sizes, container/breakpoint references, motion,
  focus rings, chart roles, and semantic colors.
- Semantic aliases provide default/neutral, primary/accent, secondary/content,
  success, warning, danger, info, and disabled roles.
- Canonical form/action primitives now include `AppButton`, `IconButton`, `Input`,
  `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `DateControl`, `SearchInput`,
  and `FormField`.
- Presentation primitives include `Card`, `StatusPill`, `Banner`, `Toast`,
  `Skeleton`, `Pagination`, `Breadcrumbs`, `EmptyState`, `PageHeader`, and
  `SectionHeader`. Existing dialog, drawer, dropdown, tooltip, tabs, table and chart
  implementations are governed by the documented shell contracts until their
  behavior-specific adapters are migrated.
- `WorkflowContext`, contextual help, status attention surfaces, and lab badge maps
  were migrated from raw colors to semantic roles.

## Automated guards

`pnpm test:design-system-100` verifies:

1. Required v2 foundation and semantic token families exist.
2. The canonical primitive catalogue is present.
3. Shared `src/components/ui/` files contain no raw color palette utilities.
4. Shared primitives do not use `transition-all`.
5. System documentation contains both the catalogue and explicit legacy boundary.

The suite is registered in the canonical test manifest, so future test-registry drift
is also rejected.

## Claim boundary

This evidence does **not** claim that all 98 legacy source files already use semantic
tokens. It does establish zero unexplained visual primitive duplication in the shared
layer and prevents new shared drift. Reaching route-level 100% semantic usage requires
route-sized migrations with browser/regression evidence; bulk replacement would risk
changing validated enterprise workflows.
