// Corrective/preventive action domain rules. This module validates intent;
// server workflows decide whether and when a mutation may be persisted.

import { MAX_QC_METADATA_LENGTH } from '../task-policy';

export const CAPA_STATUSES = ['DRAFT', 'OPEN', 'IMPLEMENTATION', 'VERIFICATION', 'EFFECTIVE', 'CLOSED', 'REOPENED'] as const;
export type CapaStatus = (typeof CAPA_STATUSES)[number];

const CAPA_TRANSITIONS: Record<CapaStatus, readonly CapaStatus[]> = {
  DRAFT: ['OPEN'],
  OPEN: ['IMPLEMENTATION', 'REOPENED'],
  IMPLEMENTATION: ['VERIFICATION', 'REOPENED'],
  VERIFICATION: ['EFFECTIVE', 'REOPENED'],
  EFFECTIVE: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['OPEN', 'IMPLEMENTATION'],
};

export function canTransitionCapa(from: string, to: string): boolean {
  return (CAPA_STATUSES as readonly string[]).includes(from) &&
    (CAPA_STATUSES as readonly string[]).includes(to) &&
    (from === to || CAPA_TRANSITIONS[from as CapaStatus].includes(to as CapaStatus));
}

export function hasCapaClosureGates(capa: { corrective_action?: string | null; evidence?: string | null; effectiveness_check?: string | null; approval?: string | null }): boolean {
  return [capa.corrective_action, capa.evidence, capa.effectiveness_check, capa.approval].every((value) => normalizeCapaAction(value) !== null);
}

export function canCloseCapa(capa: Parameters<typeof hasCapaClosureGates>[0]): boolean {
  return hasCapaClosureGates(capa);
}

export function normalizeCapaAction(value: unknown): string | null {
  const action = typeof value === 'string' ? value.trim() : '';
  return action && action.length <= MAX_QC_METADATA_LENGTH ? action : null;
}

export function requiresCorrectiveAction(findingClassification: string): boolean {
  return findingClassification === 'major' || findingClassification === 'critical';
}
