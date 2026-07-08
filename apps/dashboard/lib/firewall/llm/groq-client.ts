/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Groq client wrapper. Exposes an OpenAI-compatible chat()
 * function so the API route can stay provider-agnostic (Phase 1c
 * will add a router for OpenAI, Anthropic, NVIDIA, ALLaM).
 *
 * Default model: llama-3.1-8b-instant (fast + cheap; suitable for
 * PII-redacted traffic). Override via GROQ_DEFAULT_MODEL env var
 * or per-request `model` parameter.
 */

import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string | null;
}

let client: Groq | null = null;
function getClient(): Groq {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. The firewall needs an LLM provider to forward chat requests. ' +
        'Set it in apps/dashboard/.env (or .env.local).',
    );
  }
  client = new Groq({ apiKey, maxRetries: 2, timeout: 30 * 1000 });
  return client;
}

const DEFAULT_MODEL = process.env.GROQ_DEFAULT_MODEL || 'llama-3.1-8b-instant';

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const groq = getClient();
  const model = req.model ?? DEFAULT_MODEL;

  const completion = await groq.chat.completions.create(
    {
      model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens ?? 1024,
    },
    { signal: req.signal },
  );

  const choice = completion.choices[0];
  if (!choice) {
    throw new Error('Groq returned an empty choices array.');
  }

  return {
    content: choice.message?.content ?? '',
    model: completion.model,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    totalTokens: completion.usage?.total_tokens ?? 0,
    finishReason: choice.finish_reason,
  };
}

/** True when the GROQ_API_KEY is configured. Used by the health route. */
export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}
