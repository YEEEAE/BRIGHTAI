import type { AiCompletionRequest, AiProvider } from './types';

export type { AiCompletionRequest, AiProvider };

/** Thrown by serverAiConfig() when no provider credential is present. */
export const AI_NOT_CONFIGURED_MESSAGE = 'AI provider is not configured.';

/**
 * Non-secret AI runtime configuration (model / timeout / retries). Reads
 * non-credential environment variables only; the API key itself is resolved
 * exclusively inside serverAiConfig() so this module stays safe to surface in
 * health diagnostics.
 */
export function resolveAiRuntimeConfig(env: NodeJS.ProcessEnv = process.env): {
  model: string;
  timeoutMs: number;
  maxRetries: number;
} {
  const timeoutMs = Number(env.AI_TIMEOUT_MS ?? 15_000);
  const maxRetries = Number(env.AI_MAX_RETRIES ?? 2);
  return {
    // GROQ_MODEL is the provider-specific contract; AI_MODEL remains a
    // backwards-compatible generic override for existing deployments.
    model: env.GROQ_MODEL?.trim() || env.AI_MODEL?.trim() || 'llama-3.3-70b-versatile',
    timeoutMs: Number.isFinite(timeoutMs) ? Math.max(1_000, Math.min(timeoutMs, 60_000)) : 15_000,
    maxRetries: Number.isFinite(maxRetries) ? Math.max(0, Math.min(Math.floor(maxRetries), 3)) : 2,
  };
}

/** True only when a non-empty provider credential is present in the environment. */
export function isAiProviderConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.GROQ_API_KEY?.trim() ?? '').length > 0;
}

export function serverAiConfig(): { apiKey: string; model: string; timeoutMs: number; maxRetries: number } {
  const apiKey = process.env.GROQ_API_KEY?.trim() ?? '';
  if (!apiKey) throw new Error(AI_NOT_CONFIGURED_MESSAGE);
  return { apiKey, ...resolveAiRuntimeConfig() };
}

export function isTransientProviderStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export function isAiProvider(value: unknown): value is AiProvider {
  return !!value && typeof (value as AiProvider).complete === 'function' && typeof (value as AiProvider).model === 'string';
}
