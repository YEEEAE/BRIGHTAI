import type { AiCompletionRequest, AiProvider } from './types';

export type { AiCompletionRequest, AiProvider };

export function serverAiConfig(): { apiKey: string; model: string; timeoutMs: number; maxRetries: number } {
  const apiKey = process.env.GROQ_API_KEY?.trim() ?? '';
  if (!apiKey) throw new Error('AI provider is not configured.');
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? 15_000);
  const maxRetries = Number(process.env.AI_MAX_RETRIES ?? 2);
  return {
    apiKey,
    // GROQ_MODEL is the provider-specific contract; AI_MODEL remains a
    // backwards-compatible generic override for existing deployments.
    model: process.env.GROQ_MODEL?.trim() || process.env.AI_MODEL?.trim() || 'llama-3.3-70b-versatile',
    timeoutMs: Number.isFinite(timeoutMs) ? Math.max(1_000, Math.min(timeoutMs, 60_000)) : 15_000,
    maxRetries: Number.isFinite(maxRetries) ? Math.max(0, Math.min(Math.floor(maxRetries), 3)) : 2,
  };
}

export function isTransientProviderStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export function isAiProvider(value: unknown): value is AiProvider {
  return !!value && typeof (value as AiProvider).complete === 'function' && typeof (value as AiProvider).model === 'string';
}
