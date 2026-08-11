// AI suggestions are advisory only. Server integrations live in dedicated
// modules; AI never authorizes users, mutates tasks, or changes workflow state.

export type AiSuggestion = {
  kind: 'summary' | 'finding' | 'capa' | 'next_step';
  text: string;
  confidence?: number;
};

export { runStructuredAi, AiServiceError } from './service';
export { aiSummarySchema } from './schemas';
export { JSON_ONLY_SYSTEM_PROMPT } from './prompts';
export { analyzeTask, analyzeFinding, assistRca, assistCapa, buildManagementSummary, reviewEvidence } from './features';
export { redactContext, redactUnnecessaryPii } from './context';

/** Normalize provider output for display; it does not authorize or persist it. */
export function normalizeAiSuggestion(input: Partial<AiSuggestion>): AiSuggestion | null {
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text || text.length > 2000) return null;
  const kind = input.kind;
  if (kind !== 'summary' && kind !== 'finding' && kind !== 'capa' && kind !== 'next_step') return null;
  const confidence = input.confidence == null ? undefined : Math.max(0, Math.min(1, Number(input.confidence)));
  return { kind, text, ...(Number.isFinite(confidence) ? { confidence } : {}) };
}
