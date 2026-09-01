// Finding domain rules. Persistence and authorization remain outside this
// pure module; AI may suggest a finding but cannot make it authoritative.

import { FINDING_CLASSIFICATIONS, MAX_QC_METADATA_LENGTH, RISK_LEVELS } from '../task-policy';
import type { FindingClassification, RiskLevel } from '../types';

export { FINDING_CLASSIFICATIONS, RISK_LEVELS };

export const FINDING_STATUSES = ['OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'VERIFICATION', 'CLOSED', 'REOPENED'] as const;
export const RCA_METHODS = ['5_WHYS', 'FISHBONE', 'FREE_FORM'] as const;
export const FISHBONE_CATEGORIES = ['People', 'Process', 'Equipment', 'Material', 'Environment', 'Measurement', 'Management'] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];
export type RcaMethod = (typeof RCA_METHODS)[number];

const FINDING_TRANSITIONS: Record<FindingStatus, readonly FindingStatus[]> = {
  OPEN: ['UNDER_REVIEW', 'ACTION_REQUIRED', 'REOPENED'],
  UNDER_REVIEW: ['ACTION_REQUIRED', 'VERIFICATION', 'REOPENED'],
  ACTION_REQUIRED: ['VERIFICATION', 'REOPENED'],
  VERIFICATION: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['UNDER_REVIEW', 'ACTION_REQUIRED'],
};

export function isFindingStatus(value: string): value is FindingStatus {
  return (FINDING_STATUSES as readonly string[]).includes(value);
}

export function canTransitionFinding(from: string, to: string): boolean {
  return isFindingStatus(from) && isFindingStatus(to) && (from === to || FINDING_TRANSITIONS[from].includes(to));
}

export function normalizeFindingText(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && text.length <= MAX_QC_METADATA_LENGTH ? text : null;
}

export function isFinding(value: string): value is FindingClassification {
  return (FINDING_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function isRisk(value: string): value is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(value);
}
