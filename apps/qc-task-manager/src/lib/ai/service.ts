import { randomUUID } from 'node:crypto';
import { recordAiAudit } from '../aiAudit';
import { createGroqProvider } from './groq';
import { AI_NOT_CONFIGURED_MESSAGE } from './provider';
import { consumeAiRateLimit, parseStructuredResponse } from './guardrails';
import type { AiProvider, StructuredAiRequest } from './types';

export class AiServiceError extends Error {
  constructor(message = 'AI request could not be completed.') { super(message); this.name = 'AiServiceError'; }
}

/**
 * No provider credential is present in this deployment. Distinct from a
 * transient provider failure so the API can return a controlled
 * "AI unavailable" state instead of a generic error — advisory AI stays off
 * until an operator deliberately enables a provider (see docs/AI-SAFE-LAUNCH.md).
 */
export class AiNotConfiguredError extends AiServiceError {
  constructor() { super(AI_NOT_CONFIGURED_MESSAGE); this.name = 'AiNotConfiguredError'; }
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
    const notConfigured = error instanceof Error && error.message === AI_NOT_CONFIGURED_MESSAGE;
    const failureReason = error instanceof Error && error.message === 'invalid_structured_output' ? 'invalid_structured_output' : 'provider_failure';
    try { recordAiAudit({ userId: input.userId, feature: input.feature, model: provider.model, requestReference, responseReference: null, success: false, failureReason }); } catch { /* do not mask the service failure with audit failure */ }
    throw notConfigured ? new AiNotConfiguredError() : new AiServiceError();
  }
}
