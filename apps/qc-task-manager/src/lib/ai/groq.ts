import { serverAiConfig, isTransientProviderStatus } from './provider';
import type { AiCompletionRequest, AiProvider } from './types';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type GroqOptions = { apiKey: string; model: string; timeoutMs: number; maxRetries: number; fetchImpl?: FetchLike; baseUrl?: string };

function safeProviderError(status: number): Error {
  return new Error(`AI provider request failed (${status}).`);
}

export function createGroqProvider(options: GroqOptions = { ...serverAiConfig() }): AiProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? 'https://api.groq.com/openai/v1/chat/completions';
  return {
    model: options.model,
    async complete(request: AiCompletionRequest): Promise<string> {
      for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
        try {
          const response = await fetchImpl(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.apiKey}` },
            body: JSON.stringify({ model: options.model, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: request.system }, { role: 'user', content: request.user }] }),
            signal: controller.signal,
          });
          if (!response.ok) {
            if (isTransientProviderStatus(response.status) && attempt < options.maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, Math.min(250 * (attempt + 1), 1_000)));
              continue;
            }
            throw safeProviderError(response.status);
          }
          const payload = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
          const content = payload.choices?.[0]?.message?.content;
          if (typeof content !== 'string' || !content.trim()) throw new Error('AI provider returned no content.');
          return content;
        } catch (error) {
          if (attempt < options.maxRetries && (error instanceof Error && error.name === 'AbortError')) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(250 * (attempt + 1), 1_000)));
            continue;
          }
          throw error instanceof Error && error.message.startsWith('AI provider') ? error : new Error('AI provider request failed.');
        } finally {
          clearTimeout(timeout);
        }
      }
      throw new Error('AI provider request failed.');
    },
  };
}
