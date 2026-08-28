// Central status → presentation map for the QC Task Manager design system
// (docs/UI-DESIGN-SYSTEM.md §2/§3.3). Pure data: no server imports, no
// permissions imports (UI components must stay authorization-free — the
// architecture guard enforces it). Task statuses/priorities deliberately keep
// their legacy app-wide scheme in src/lib/format.ts (documented exception).

export type StatusTone =
  | 'neutral'
  | 'neutral-strong'
  | 'info'
  | 'progress'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent';

export interface StatusPresentation {
  tone: StatusTone;
  label: string;
}

/** Soft pill classes per tone (docs/UI-DESIGN-SYSTEM.md §2). */
export const TONE_PILL_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-surface-muted text-content-secondary ring-border',
  'neutral-strong': 'bg-border text-content-secondary ring-border-strong',
  info: 'bg-info-soft text-info ring-info-border',
  progress: 'bg-warning-soft text-warning ring-warning-border',
  success: 'bg-success-soft text-success ring-success-border',
  warning: 'bg-warning-soft text-warning ring-warning-border',
  danger: 'bg-danger-soft text-danger ring-danger-border',
  // Accent is reserved for superseded versions; keep it visually distinct
  // without introducing a second interactive accent.
  accent: 'bg-violet-50 text-violet-700 ring-violet-200',
};

/**
 * Status codes seen across the product. Keys are the exact DB/UI codes; where
 * the same code means the same thing everywhere (APPROVED, REJECTED, VOID…)
 * one entry covers every domain. Unknown codes fall back to a neutral pill
 * with the raw code as the label — a status is never rendered without text.
 */
export const STATUS_PRESENTATION: Record<string, StatusPresentation> = {
  // Workflow lifecycle (lab tests, documents, templates, change requests).
  DRAFT: { tone: 'neutral', label: 'Draft' },
  SUBMITTED: { tone: 'info', label: 'Submitted' },
  UNDER_REVIEW: { tone: 'progress', label: 'Under Review' },
  IN_REVIEW: { tone: 'progress', label: 'In Review' },
  APPROVED: { tone: 'success', label: 'Approved' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
  RESUBMITTED: { tone: 'info', label: 'Resubmitted' },
  VOID: { tone: 'neutral-strong', label: 'Void' },
  ARCHIVED: { tone: 'neutral-strong', label: 'Archived' },
  SUPERSEDED: { tone: 'accent', label: 'Superseded' },

  // Change requests.
  PENDING: { tone: 'info', label: 'Pending' },
  PENDING_REVIEW: { tone: 'progress', label: 'Pending Review' },
  PENDING_APPROVAL: { tone: 'progress', label: 'Pending Approval' },
  WITHDRAWN: { tone: 'neutral-strong', label: 'Withdrawn' },
  CONFLICT: { tone: 'warning', label: 'Conflict' },

  // Results.
  PASS: { tone: 'success', label: 'Pass' },
  FAIL: { tone: 'danger', label: 'Fail' },
  HOLD: { tone: 'warning', label: 'Hold' },

  // Account / operational states.
  active: { tone: 'success', label: 'Active' },
  disabled: { tone: 'neutral-strong', label: 'Disabled' },
  OVERDUE: { tone: 'danger', label: 'Overdue' },
  DUE_SOON: { tone: 'warning', label: 'Due Soon' },
  OK: { tone: 'success', label: 'OK' },
  WARNING: { tone: 'warning', label: 'Warning' },
  CRITICAL: { tone: 'danger', label: 'Critical' },
};

/** Presentation for a code — unknown codes degrade to a labeled neutral pill. */
export function statusPresentation(code: string): StatusPresentation {
  return STATUS_PRESENTATION[code] ?? { tone: 'neutral', label: code };
}
