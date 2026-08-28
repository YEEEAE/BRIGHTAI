// Central notification presentation for the QC Task Manager design system
// (docs/UI-DESIGN-SYSTEM.md §3.9). Single source for both /notifications and
// /lab/notifications — the two pages previously kept drifted copies of these
// maps locally. Pure data + pure functions: no DB, no server imports, no
// permissions imports (the architecture guard enforces that for UI).
import { humanizeStatusCode, TONE_PILL_CLASSES, type StatusTone } from './statusTones';

/** Decorative per-kind glyph, always aria-hidden next to the visible label. */
export const NOTIFICATION_KIND_ICON: Record<string, string> = {
  overdue: '🚨',
  due_soon: '📅',
  unstarted: '⏳',
  assigned: '👤',
  due_date_changed: '🗓️',
  priority_changed: '🚦',
  recurring_created: '🔁',
  task_completed: '✅',
  comment_added: '💬',
  blocker_added: '🚧',
  delete_requested: '🗑️',
  delete_approved: '✅',
  delete_rejected: '⛔',
  task_reopened: '🔄',
  sla_escalation: '🚨',
  lab_document_review_due: '📋',
  lab_test_review_started: '🔬',
  lab_test_rejected: '⛔',
  lab_test_changes_requested: '✏️',
  lab_test_approved: '✅',
  lab_test_voided: '🚫',
  lab_document_acknowledgement: '📖',
  lab_document_acknowledged: '👍',
  lab_document_review_started: '📄',
  lab_document_changes_requested: '📝',
  lab_document_approved: '✅',
  lab_document_archived: '📦',
  lab_document_content_started: '📝',
  lab_calibration_due: '⚖️',
  lab_calibration_overdue: '⚠️',
  lab_maintenance_event: '🔧',
  lab_retest_update: '🔁',
  lab_repeat_failures: '📉',
  lab_change_review_requested: '📨',
  lab_change_review_approved: '✅',
  lab_change_review_rejected: '⛔',
};

/** Human label per kind — same concept = same word on every screen. */
export const NOTIFICATION_KIND_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  unstarted: 'Not started',
  assigned: 'Assigned to you',
  due_date_changed: 'Due date changes',
  priority_changed: 'Priority changes',
  recurring_created: 'Recurring tasks',
  task_completed: 'Completed tasks',
  comment_added: 'New comments',
  blocker_added: 'Blockers',
  delete_requested: 'Deletion requests',
  delete_approved: 'Deletion approved',
  delete_rejected: 'Deletion rejected',
  task_reopened: 'Reopened tasks',
  sla_escalation: 'SLA escalations',
  lab_document_review_due: 'Document reviews',
  lab_test_review_started: 'Lab tests under review',
  lab_test_rejected: 'Lab tests rejected',
  lab_test_changes_requested: 'Lab test changes requested',
  lab_test_approved: 'Lab tests approved',
  lab_test_voided: 'Lab tests voided',
  lab_document_acknowledgement: 'Document acknowledgements required',
  lab_document_acknowledged: 'Document acknowledgements',
  lab_document_review_started: 'Document review started',
  lab_document_changes_requested: 'Document changes requested',
  lab_document_approved: 'Document approved',
  lab_document_archived: 'Document archived',
  lab_document_content_started: 'Document content started',
  lab_calibration_due: 'Calibration due',
  lab_calibration_overdue: 'Calibration overdue',
  lab_maintenance_event: 'Equipment maintenance',
  lab_retest_update: 'Retest updates',
  lab_repeat_failures: 'Lab repeated failures',
  lab_change_review_requested: 'Lab change requests',
  lab_change_review_approved: 'Lab change request approved',
  lab_change_review_rejected: 'Lab change request rejected',
};

/** Left-border + surface treatment per severity. */
export const NOTIFICATION_SEVERITY_CARD: Record<string, string> = {
  danger: 'border-l-danger bg-danger-soft',
  warning: 'border-l-warning bg-warning-soft',
  info: 'border-l-info bg-info-soft',
  success: 'border-l-success bg-success-soft',
};

export const NOTIFICATION_SEVERITY_TONE: Record<string, StatusTone> = {
  danger: 'danger', warning: 'warning', info: 'info', success: 'success',
};

export function notificationSeverityPresentation(severity: string) {
  const tone = NOTIFICATION_SEVERITY_TONE[severity] ?? 'neutral';
  return { tone, classes: TONE_PILL_CLASSES[tone], label: humanizeStatusCode(severity || 'notification') };
}

// Section order: danger → warning → info → success.
const SECTION_ORDER: Record<string, number> = {
  overdue: 0,
  delete_rejected: 0,
  lab_test_rejected: 0,
  lab_test_voided: 0,
  lab_calibration_overdue: 0,
  lab_repeat_failures: 0,
  lab_change_review_rejected: 0,
  due_soon: 1,
  due_date_changed: 1,
  priority_changed: 1,
  blocker_added: 1,
  delete_requested: 1,
  lab_document_review_due: 1,
  lab_document_acknowledgement: 1,
  lab_document_review_started: 1,
  lab_document_changes_requested: 1,
  lab_test_review_started: 1,
  lab_test_changes_requested: 1,
  lab_change_review_requested: 1,
  lab_calibration_due: 1,
  lab_maintenance_event: 1,
  assigned: 2,
  unstarted: 2,
  comment_added: 2,
  lab_retest_update: 2,
  lab_document_archived: 2,
  recurring_created: 3,
  task_completed: 3,
  task_reopened: 3,
  delete_approved: 3,
  lab_test_approved: 3,
  lab_change_review_approved: 3,
  lab_document_acknowledged: 3,
  lab_document_approved: 3,
};

export function notificationSectionOrder(kind: string): number {
  return SECTION_ORDER[kind] ?? 3;
}

interface KindCarrier {
  kind: string;
}

/** Group notifications by kind, preserving insertion order inside each group. */
export function groupNotificationsByKind<T extends KindCarrier>(items: readonly T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const n of items) {
    const list = grouped.get(n.kind) ?? [];
    list.push(n);
    grouped.set(n.kind, list);
  }
  return grouped;
}

/** Kind keys ordered by section severity (danger first, unknown kinds last). */
export function orderedNotificationKinds(grouped: ReadonlyMap<string, unknown>): string[] {
  return [...grouped.keys()].sort(
    (a, b) => notificationSectionOrder(a) - notificationSectionOrder(b),
  );
}
