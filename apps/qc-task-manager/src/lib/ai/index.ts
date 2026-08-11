// AI is advisory only. Keep this module pure: no DB, permissions, workflow,
// task mutation, or audit imports are allowed here.

export type AiSuggestion = {
  kind: 'summary' | 'finding' | 'capa' | 'next_step';
  text: string;
  confidence?: number;
};

/** Normalize provider output for display; it does not authorize or persist it. */
export function normalizeAiSuggestion(input: Partial<AiSuggestion>): AiSuggestion | null {
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text || text.length > 2000) return null;
  const kind = input.kind;
  if (kind !== 'summary' && kind !== 'finding' && kind !== 'capa' && kind !== 'next_step') return null;
  const confidence = input.confidence == null ? undefined : Math.max(0, Math.min(1, Number(input.confidence)));
  return { kind, text, ...(Number.isFinite(confidence) ? { confidence } : {}) };
}

