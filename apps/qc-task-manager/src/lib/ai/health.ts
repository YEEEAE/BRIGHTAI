// AI provider health diagnostics for the admin system-health page.
//
// SAFE BY CONSTRUCTION: the returned shape carries a boolean "configured"
// flag plus non-secret runtime settings (model name, timeout, retries). The
// provider credential itself is NEVER included, echoed, or logged here —
// surfacing it would leak the secret the deployment keeps in the environment.

import { isAiProviderConfigured, resolveAiRuntimeConfig } from './provider';

export interface AiProviderHealth {
  /** True when a provider credential is present (its value is never exposed). */
  configured: boolean;
  /** 'groq' when configured, otherwise 'not_configured'. */
  provider: 'groq' | 'not_configured';
  /** Non-secret: resolved model identifier. */
  model: string;
  /** Non-secret: request timeout in milliseconds. */
  timeoutMs: number;
  /** Non-secret: retry budget per request. */
  maxRetries: number;
}

export function getAiProviderHealth(env: NodeJS.ProcessEnv = process.env): AiProviderHealth {
  const configured = isAiProviderConfigured(env);
  return {
    configured,
    provider: configured ? 'groq' : 'not_configured',
    ...resolveAiRuntimeConfig(env),
  };
}
