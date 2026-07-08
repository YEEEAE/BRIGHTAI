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

// ─────────────────────────────────────────────────────────────────
// Streaming (Phase 1b)
// ─────────────────────────────────────────────────────────────────

export interface ChatChunk {
  content: string;
  finishReason: string | null;
  /** Model that produced this chunk. Usually set on the first chunk. */
  model?: string;
}

/**
 * Streaming chat completion. Yields content deltas as they arrive
 * from the upstream provider. The caller (the chat route) is
 * responsible for redacting each delta before sending to the client.
 *
 * Token usage is NOT reported in the stream (Groq sends it only on
 * the final chunk with `stream_options: { include_usage: true }`).
 * We handle this via the `usage` callback below.
 */
export async function* chatStream(req: ChatRequest): AsyncGenerator<ChatChunk> {
  const groq = getClient();
  const model = req.model ?? DEFAULT_MODEL;

  // The Groq SDK's create() overloads on the `stream` option, which
  // makes the discriminated type wider than we want. Cast through
  // `any` to call with the streaming shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = (await (groq.chat.completions.create as any)({
    model,
    messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: req.temperature ?? 0.2,
    max_tokens: req.maxTokens ?? 1024,
    stream: true,
    stream_options: { include_usage: true },
  })) as AsyncIterable<{ choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }; model?: string }>;

  let finalModel: string | null = null;

  for await (const chunk of stream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = chunk as any;
    if (c.model) finalModel = c.model;
    if (c.usage) {
      finalUsage = {
        prompt_tokens: c.usage.prompt_tokens ?? 0,
        completion_tokens: c.usage.completion_tokens ?? 0,
        total_tokens: c.usage.total_tokens ?? 0,
      };
    }
    const choice = c.choices?.[0];
    if (!choice) continue;
    const delta = choice.delta?.content ?? '';
    const finishReason = choice.finish_reason ?? null;
    if (delta || finishReason) {
      yield { content: delta, finishReason, model: finalModel ?? undefined };
    }
  }

  // Final sentinel with usage info (consumers can listen for finishReason='stop').
  if (finalUsage) {
    yield {
      content: '',
      finishReason: 'stop',
      model: finalModel ?? undefined,
    };
  }
}

export interface StreamUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

/**
 * Wrap a stream and collect usage info. The returned generator
 * yields the same chunks as `chatStream`; the second value of the
 * tuple is the usage callback that should be called once at the end.
 */
export async function collectStreamUsage(
  stream: AsyncGenerator<ChatChunk>,
): Promise<{ chunks: ChatChunk[]; usage: StreamUsage | null }> {
  const chunks: ChatChunk[] = [];
  let model = '';
  for await (const chunk of stream) {
    chunks.push(chunk);
    if (chunk.model) model = chunk.model;
  }
  return {
    chunks,
    usage: model
      ? { promptTokens: 0, completionTokens: 0, totalTokens: 0, model }
      : null,
  };
}
