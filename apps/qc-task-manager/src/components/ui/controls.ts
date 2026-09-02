/**
 * Canonical control recipes. These are deliberately presentation-only: form
 * ownership, validation, request methods and domain rules stay with routes.
 */
export const CONTROL_BASE =
  'w-full rounded-qc-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content shadow-sm placeholder:text-content-muted qc-focus disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-disabled';
export const CONTROL_TEXTAREA = `${CONTROL_BASE} min-h-24 resize-y`;
export const CONTROL_SELECT = `${CONTROL_BASE} pe-8`;
export const CONTROL_CHECKABLE =
  'h-4 w-4 rounded border-border-strong text-accent qc-focus disabled:cursor-not-allowed disabled:opacity-50';
export const CONTROL_SWITCH =
  'relative h-6 w-11 appearance-none rounded-pill bg-neutral-border transition-colors duration-qc-fast ease-qc-standard checked:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50';
export const CONTROL_SEARCH = `${CONTROL_BASE} ps-9`;
export const FIELD_LABEL = 'text-sm font-medium text-content';
export const FIELD_HINT = 'mt-1 text-xs text-content-secondary';
export const FIELD_ERROR = 'mt-1 text-xs font-medium text-danger';
export const ICON_BUTTON =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-qc-md text-content-secondary transition-colors duration-qc-fast hover:bg-surface-muted hover:text-content qc-focus disabled:cursor-not-allowed disabled:opacity-50';
export const DATA_CARD = 'qc-surface-card p-5';
export const TABLE_PANEL = 'qc-surface-card overflow-x-auto';
