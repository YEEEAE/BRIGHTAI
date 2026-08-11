// Corrective/preventive action domain rules. This module validates intent;
// server workflows decide whether and when a mutation may be persisted.

import { MAX_QC_METADATA_LENGTH } from '../task-policy';

export function normalizeCapaAction(value: unknown): string | null {
  const action = typeof value === 'string' ? value.trim() : '';
  return action && action.length <= MAX_QC_METADATA_LENGTH ? action : null;
}

export function requiresCorrectiveAction(findingClassification: string): boolean {
  return findingClassification === 'major' || findingClassification === 'critical';
}

