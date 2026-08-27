// Shared class presets for register filter toolbars (docs/UI-DESIGN-SYSTEM.md
// §3.8). The 13+ lab filter forms share one shell / field / control recipe —
// these constants keep it defined once. Values are the exact classes the
// pages already render, so adoption is markup-neutral.
export const FILTER_TOOLBAR =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';
export const FILTER_FIELD = 'flex flex-col gap-1 text-sm font-medium text-slate-700';
export const FILTER_CONTROL =
  'mt-0.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
