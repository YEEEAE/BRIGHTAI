import { randomUUID } from 'node:crypto';
import { recordAiAudit } from '../aiAudit';
import { createGroqProvider } from './groq';
import { consumeAiRateLimit, parseStructuredResponse } from './guardrails';
import type { AiProvider, StructuredAiRequest } from './types';

export class AiServiceError extends Error {
  constructor(message = 'AI request could not be completed.') { super(message); this.name = 'AiServiceError'; }
}

export async function runStructuredAi<T>(input: StructuredAiRequest<T>): Promise<{ data: T; requestReference: string; responseReference: string }> {
  if (!consumeAiRateLimit(input.userId, input.feature)) throw new AiServiceError('AI rate limit exceeded.');
  let provider: AiProvider = input.provider ?? { model: 'llama-3.3-70b-versatile', complete: async () => { throw new Error('AI provider unavailable.'); } };
  const requestReference = randomUUID();
  try {
    provider = input.provider ?? createGroqProvider();
    const raw = await provider.complete({ system: input.systemPrompt, user: input.userPrompt });
    const data = parseStructuredResponse(raw, input.schema);
    const responseReference = randomUUID();
    recordAiAudit({ userId: input.userId, feature: input.feature, model: provider.model, requestReference, responseReference, success: true });
    return { data, requestReference, responseReference };
  } catch (error) {
    const failureReason = error instanceof Error && error.message === 'invalid_structured_output' ? 'invalid_structured_output' : 'provider_failure';
    try { recordAiAudit({ userId: input.userId, feature: input.feature, model: provider.model, requestReference, responseReference: null, success: false, failureReason }); } catch { /* do not mask the service failure with audit failure */ }
    throw new AiServiceError();
  }
}
