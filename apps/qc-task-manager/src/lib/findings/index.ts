// Finding domain rules. Persistence and authorization remain outside this
// pure module; AI may suggest a finding but cannot make it authoritative.

import { FINDING_CLASSIFICATIONS, MAX_QC_METADATA_LENGTH, RISK_LEVELS } from '../task-policy';
import type { FindingClassification, RiskLevel } from '../types';

export { FINDING_CLASSIFICATIONS, RISK_LEVELS };

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

