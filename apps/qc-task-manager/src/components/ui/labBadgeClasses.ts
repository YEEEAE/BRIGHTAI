// Shared lab badge class maps (docs/UI-DESIGN-SYSTEM.md §2 legacy exception
// applied to lab-domain registers). Each map lives here exactly once — pages
// import instead of re-declaring drifted copies. Values are the exact classes
// the pages already render, so adoption is markup- and appearance-neutral.
// Workflow-neutral statuses (APPROVED, DRAFT…) also exist in statusTones.ts;
// these solid-scheme maps stay for the lab registers' documented scheme.
import type {
  LabDocumentStatus,
  LabDocumentType,
  LabAcknowledgementStatus,
} from '../../lib/types';
import type { LabCalibrationStatus } from '../../lib/lab/calibration';

/** Calibration status → solid badge classes. */
export const CALIBRATION_STATUS_BADGE_CLS: Record<LabCalibrationStatus, string> = {
  COMPLIANT: 'bg-emerald-100 text-emerald-800',
  DUE_SOON: 'bg-amber-100 text-amber-800',
  DUE_TODAY: 'bg-orange-100 text-orange-800',
  OVERDUE: 'bg-rose-100 text-rose-800',
  NOT_COMPLIANT: 'bg-red-100 text-red-800',
  UNKNOWN: 'bg-slate-100 text-slate-700',
};

/** Controlled-document lifecycle status → soft badge classes. */
export const DOCUMENT_STATUS_BADGE_CLS: Record<LabDocumentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SUPERSEDED: 'bg-violet-50 text-violet-700 ring-violet-200',
  ARCHIVED: 'bg-slate-100 text-slate-500 ring-slate-200',
};

/** Acknowledgement state → soft badge classes. */
export const ACKNOWLEDGEMENT_BADGE_CLS: Record<LabAcknowledgementStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  ACKNOWLEDGED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

/** Controlled-document type → solid badge classes. */
export const DOCUMENT_TYPE_BADGE_CLS: Record<LabDocumentType, string> = {
  SOP: 'bg-sky-100 text-sky-800',
  WI: 'bg-indigo-100 text-indigo-800',
};

/** Task-template lifecycle → solid badge classes. */
export const TEMPLATE_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-slate-200 text-slate-500',
};

/** Lab test workflow status → solid badge classes (detail + review queue). */
export const TEST_WORKFLOW_TONE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  VOID: 'bg-slate-200 text-slate-700',
};

/** Lab test result text + badge classes (detail + review queue). */
export const TEST_RESULT_TONE: Record<string, string> = {
  PASS: 'text-green-700',
  FAIL: 'text-red-700',
  HOLD: 'text-orange-700',
};
