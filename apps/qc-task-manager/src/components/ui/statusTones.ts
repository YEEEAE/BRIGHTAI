// Central status → presentation map for the QC Task Manager design system
// (docs/UI-DESIGN-SYSTEM.md §2/§3.3). Pure data: no server imports, no
// permissions imports (UI components must stay authorization-free — the
// architecture guard enforces it). Task priority formatting remains a domain
// concern; task status badges use the adapter below.

/** Product-wide presentation roles. Domain enums stay domain-owned. */
export type StatusTone = 'neutral' | 'info' | 'pending' | 'warning' | 'success' | 'danger' | 'blocked';

export interface StatusPresentation {
  tone: StatusTone;
  label: string;
  /** Optional state cue; never the only carrier of meaning. */
  icon?: string;
}

/** Soft pill classes per tone (docs/UI-DESIGN-SYSTEM.md §2). */
export const TONE_PILL_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-surface-muted text-content-secondary ring-border',
  info: 'bg-info-soft text-info ring-info-border',
  pending: 'bg-warning-soft text-warning ring-warning-border',
  success: 'bg-success-soft text-success ring-success-border',
  warning: 'bg-warning-soft text-warning ring-warning-border',
  danger: 'bg-danger-soft text-danger ring-danger-border',
  blocked: 'bg-border text-content-secondary ring-border-strong',
};

/** Role-home "needs attention" card surfaces (single source — was duplicated
 *  byte-identically on /manager, /supervisor and /employee). Legacy literal
 *  Tailwind classes kept verbatim: migrating them to semantic tokens is a
 *  design-system change and must not ride along a refactor. */
export const ATTENTION_TONE: Record<'danger' | 'warning' | 'info' | 'neutral', string> = {
  danger: 'border-danger-border bg-danger-soft text-danger',
  warning: 'border-warning-border bg-warning-soft text-warning',
  info: 'border-info-border bg-info-soft text-info',
  neutral: 'border-border bg-surface text-content-secondary',
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
  UNDER_REVIEW: { tone: 'pending', label: 'Under Review' },
  IN_REVIEW: { tone: 'pending', label: 'In Review' },
  APPROVED: { tone: 'success', label: 'Approved' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
  RESUBMITTED: { tone: 'info', label: 'Resubmitted' },
  VOID: { tone: 'blocked', label: 'Void' },
  ARCHIVED: { tone: 'blocked', label: 'Archived' },
  SUPERSEDED: { tone: 'info', label: 'Superseded' },

  // Change requests.
  PENDING: { tone: 'info', label: 'Pending' },
  PENDING_REVIEW: { tone: 'pending', label: 'Pending Review' },
  PENDING_APPROVAL: { tone: 'pending', label: 'Pending Approval' },
  WITHDRAWN: { tone: 'blocked', label: 'Withdrawn' },
  CONFLICT: { tone: 'warning', label: 'Conflict' },

  // Results.
  PASS: { tone: 'success', label: 'Pass' },
  FAIL: { tone: 'danger', label: 'Fail' },
  HOLD: { tone: 'warning', label: 'Hold' },

  // Account / operational states.
  active: { tone: 'success', label: 'Active' },
  disabled: { tone: 'blocked', label: 'Disabled' },
  OVERDUE: { tone: 'danger', label: 'Overdue' },
  DUE_SOON: { tone: 'warning', label: 'Due Soon' },
  OK: { tone: 'success', label: 'OK' },
  WARNING: { tone: 'warning', label: 'Warning' },
  CRITICAL: { tone: 'danger', label: 'Critical' },

  OPEN: { tone: 'info', label: 'Open' },
  ACTION_REQUIRED: { tone: 'warning', label: 'Action Required' },
  VERIFICATION: { tone: 'pending', label: 'Verification' },
  CLOSED: { tone: 'success', label: 'Closed' },
  REOPENED: { tone: 'warning', label: 'Reopened' },
  IMPLEMENTATION: { tone: 'pending', label: 'Implementation' },
  EFFECTIVE: { tone: 'success', label: 'Effective' },
  UNVERIFIED: { tone: 'pending', label: 'Unverified' },
  VALID: { tone: 'success', label: 'Valid' },
  AI_REVIEWED: { tone: 'info', label: 'AI Reviewed' },
  AI_PENDING: { tone: 'pending', label: 'AI Review Pending' },
  HUMAN_VERIFIED: { tone: 'success', label: 'Human Verified' },
  TESTED: { tone: 'info', label: 'Tested' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  PLANNED: { tone: 'info', label: 'Planned' },
  IN_PROGRESS: { tone: 'pending', label: 'In Progress' },
  CANCELLED: { tone: 'blocked', label: 'Cancelled' },
  COMPLIANT: { tone: 'success', label: 'Compliant' },
  DUE_TODAY: { tone: 'warning', label: 'Due Today' },
  NOT_COMPLIANT: { tone: 'danger', label: 'Not Compliant' },
  UNKNOWN: { tone: 'neutral', label: 'Unknown' },
  ACKNOWLEDGED: { tone: 'success', label: 'Acknowledged' },
  ACTIVE: { tone: 'success', label: 'Active' },
  DISABLED: { tone: 'blocked', label: 'Disabled' },
  LOCKED: { tone: 'danger', label: 'Locked' },
  MUST_CHANGE_PASSWORD: { tone: 'warning', label: 'Password Change Required' },
  AI_READY: { tone: 'info', label: 'Ready' },
  AI_RUNNING: { tone: 'pending', label: 'Processing' },
  AI_ERROR: { tone: 'danger', label: 'AI Error' },
};

/** Presentation for a code — unknown codes degrade to a labeled neutral pill. */
export function statusPresentation(code: string): StatusPresentation {
  return STATUS_PRESENTATION[code] ?? { tone: 'neutral', label: humanizeStatusCode(code) };
}

/** Human label for an unknown code; prevents raw enum strings becoming UI copy. */
export function humanizeStatusCode(code: string): string {
  return code
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase()) || 'Unknown';
}

type DomainStatus = string | null | undefined;
const domain = (code: DomainStatus, fallback: StatusPresentation): StatusPresentation =>
  code ? statusPresentation(code) : fallback;

/** Explicit adapters: same presentation roles, independent domain vocabularies. */
export const statusAdapters = {
  task: (code: DomainStatus): StatusPresentation => ({
    ...domain(code, { tone: 'neutral', label: 'Not started' }),
    ...(code === 'not_started' ? { tone: 'info' as const, label: 'Not started' } : {}),
    ...(code === 'in_progress' ? { tone: 'pending' as const, label: 'In progress' } : {}),
    ...(code === 'on_hold' ? { tone: 'warning' as const, label: 'On hold' } : {}),
    ...(code === 'completed' ? { tone: 'success' as const, label: 'Completed' } : {}),
    ...(code === 'cancelled' ? { tone: 'blocked' as const, label: 'Cancelled' } : {}),
  }),
  finding: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  capa: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  evidence: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  labTest: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  document: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  equipment: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  calibration: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  maintenance: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  retest: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  notification: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Notification' }),
  account: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
  ai: (code: DomainStatus) => domain(code, { tone: 'neutral', label: 'Unknown' }),
} as const;

/** Compatibility aliases for consumers not migrated in this increment. */
export const LEGACY_TONE_ALIASES = {
  'neutral-strong': 'blocked',
  progress: 'pending',
  accent: 'info',
} as const;
