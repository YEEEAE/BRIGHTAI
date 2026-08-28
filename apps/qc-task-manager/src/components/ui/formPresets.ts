// Shared class presets for register filter toolbars (docs/UI-DESIGN-SYSTEM.md
// §3.8). The 13+ lab filter forms share one shell / field / control recipe —
// these constants keep it defined once. Values are the exact classes the
// pages already render, so adoption is markup-neutral.
export const FILTER_TOOLBAR =
  'rounded-qc-lg border border-border bg-surface p-4 shadow-sm';
export const FILTER_FIELD = 'flex flex-col gap-1 text-sm font-medium text-content-secondary';
export const FILTER_CONTROL =
  'mt-0.5 rounded-qc-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content qc-focus';
