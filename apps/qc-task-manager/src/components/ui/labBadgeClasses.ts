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
import { statusAdapters, TONE_PILL_CLASSES } from './statusTones';

const classesFor = (presentation: { tone: keyof typeof TONE_PILL_CLASSES }) => TONE_PILL_CLASSES[presentation.tone];

/** Calibration status → solid badge classes. */
export const CALIBRATION_STATUS_BADGE_CLS: Record<LabCalibrationStatus, string> = {
  COMPLIANT: classesFor(statusAdapters.calibration('COMPLIANT')),
  DUE_SOON: classesFor(statusAdapters.calibration('DUE_SOON')),
  DUE_TODAY: classesFor(statusAdapters.calibration('DUE_TODAY')),
  OVERDUE: classesFor(statusAdapters.calibration('OVERDUE')),
  NOT_COMPLIANT: classesFor(statusAdapters.calibration('NOT_COMPLIANT')),
  UNKNOWN: classesFor(statusAdapters.calibration('UNKNOWN')),
};

/** Controlled-document lifecycle status → soft badge classes. */
export const DOCUMENT_STATUS_BADGE_CLS: Record<LabDocumentStatus, string> = {
  DRAFT: classesFor(statusAdapters.document('DRAFT')),
  IN_REVIEW: classesFor(statusAdapters.document('IN_REVIEW')),
  APPROVED: classesFor(statusAdapters.document('APPROVED')),
  SUPERSEDED: classesFor(statusAdapters.document('SUPERSEDED')),
  ARCHIVED: classesFor(statusAdapters.document('ARCHIVED')),
};

/** Acknowledgement state → soft badge classes. */
export const ACKNOWLEDGEMENT_BADGE_CLS: Record<LabAcknowledgementStatus, string> = {
  PENDING: classesFor(statusAdapters.document('PENDING')),
  ACKNOWLEDGED: classesFor(statusAdapters.document('ACKNOWLEDGED')),
};

/** Controlled-document type → solid badge classes. */
export const DOCUMENT_TYPE_BADGE_CLS: Record<LabDocumentType, string> = {
  SOP: 'bg-info-soft text-info',
  WI: 'bg-accent-soft text-accent',
};

/** Task-template lifecycle → solid badge classes. */
export const TEMPLATE_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-warning-soft text-warning',
  ACTIVE: 'bg-success-soft text-success',
  ARCHIVED: 'bg-surface-muted text-content-muted',
};

/** Lab test workflow status → solid badge classes (detail + review queue). */
export const TEST_WORKFLOW_TONE: Record<string, string> = {
  DRAFT: classesFor(statusAdapters.labTest('DRAFT')),
  SUBMITTED: classesFor(statusAdapters.labTest('SUBMITTED')),
  UNDER_REVIEW: classesFor(statusAdapters.labTest('UNDER_REVIEW')),
  REJECTED: classesFor(statusAdapters.labTest('REJECTED')),
  APPROVED: classesFor(statusAdapters.labTest('APPROVED')),
  VOID: classesFor(statusAdapters.labTest('VOID')),
};

/** Lab test result text + badge classes (detail + review queue). */
export const TEST_RESULT_TONE: Record<string, string> = {
  PASS: classesFor(statusAdapters.labTest('PASS')),
  FAIL: classesFor(statusAdapters.labTest('FAIL')),
  HOLD: classesFor(statusAdapters.labTest('HOLD')),
};
