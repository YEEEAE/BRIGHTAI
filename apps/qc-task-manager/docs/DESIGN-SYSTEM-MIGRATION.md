# QC Task Manager — Design System Migration

This is the incremental adoption path for the semantic foundation. It is a compatibility plan,
not permission to rewrite stable screens in bulk.

## Canonical ownership

| Primitive | Owns | Compatibility / domain adapters |
| --- | --- | --- |
| `AppButton.astro` | Action hierarchy, focus, disabled/loading states | `LabActionButton.astro` delegates to it |
| `StatusPill.astro` | All visible status presentation roles | `StatusBadge`, `QcStatusBadge`, and lab badges remain compatibility adapters |
| `Banner.astro` | Inline notices and recoverable route messages | `FlashNotice.astro` keeps one-shot transport |
| `OperationalState.astro` | Empty, error, conflict, and route outcomes | `EmptyState.astro` remains the explicit empty adapter |
| `PageHeader.astro` | Top-level title hierarchy and action placement | Auth, print, and special detail/error headers |
| `Pagination.astro` | Numbered register navigation | No new inline pagination windows |
| `ContextualHelp.astro` | Progressive disclosure guidance | No tour framework or duplicate help popover |

## Migration order

1. Shared primitives and global styles consume semantic tokens.
2. High-frequency filter toolbars use `formPresets` and `qc-focus`.
3. Dashboard, search, admin lists, and task creation adopt `PageHeader`/`AppButton` in
   separate route-sized changes.
4. Domain badge adapters move to `StatusPill` when their vocabulary is equivalent; domain
   adapters in `statusTones.ts` keep different raw enums separate.
5. Remaining leaf screens migrate when touched for a feature or bug fix.

## Guardrails

- Server-side RBAC, CSRF, workflows, audit writes, and database contracts are out of scope.
- Route migrations preserve URLs, form methods, labels, and domain semantics.
- New shared UI uses semantic aliases and the canonical focus contract.
- Compatibility is removed only after a source scan shows no consumers and UI, responsive,
  contrast, and build checks pass.
- No commit or push is performed by the implementation agent.
