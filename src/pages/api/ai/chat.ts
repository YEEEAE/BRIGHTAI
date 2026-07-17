/**
 * src/pages/api/ai/chat.ts — REPORTS-SEC-01 (2026-07-06)
 *                  + KERNEL-AUDIT-2026-07-15-BATCH-2 (ARCH-2 + EXEC-01)
 *                  + KRN-003-FULL-2026-07-15 (EXEC-03 API key check)
 *                  + CHAT-SESSION-2026-07-15 (multi-turn context store)
 *                  + CHAT-STREAM-2026-07-15 (SSE streaming path)
 *
 * Server-side proxy for AI chat. Reads provider keys from
 * `process.env.GROQ_API_KEY` and `process.env.GEMINI_API_KEY`
 * at REQUEST TIME (runtime, not build time) so the keys are NEVER
 * inlined into the SSR bundle (ARCH-2 fix).
 *
 * Behavior:
 *  - POST { message: string, sessionId?: string (UUID v4/v7), promptId?: ..., provider?: 'groq'|'gemini'|'auto' }
 *  - SSE path: client sends Accept: text/event-stream → server streams
 *    event: token / data: {"delta":"..."} frames then event: done.
 *    Gated by CHAT_STREAMING_ENABLED env var (default true).
 *    Backwards compat: Accept: application/json → old { reply, provider } shape.
 *  - Returns { reply: string, provider: 'groq'|'gemini' } on success.
 *  - In-memory rate limit: 10 requests / minute / IP.
 *  - Validates: message is a non-empty string ≤ 4000 chars.
 *  - promptId is looked up server-side from KERNEL_SYSTEM_PROMPTS
 *    (EXEC-01 — KRN-001 prompt injection mitigation).
 *  - Auto mode: tries Groq first (fast), falls back to Gemini on failure.
 *  - Both providers fail → 502 with sanitized error.
 *  - CHAT-SESSION-2026-07-15: when sessionId is provided, the last
 *    CHAT_SESSION_LIMITS.MAX_MESSAGES messages are fetched from Redis
 *    and prepended to the provider call as conversation context. The
 *    user message and assistant reply are then LPUSHed back to the same
 *    Redis LIST with LTRIM 0 (MAX_MESSAGES-1) and EXPIRE TTL. If
 *    sessionId is omitted, the endpoint behaves as a single-turn
 *    request (no Redis access). If Redis is unavailable, the endpoint
 *    degrades to in-memory storage (per-process, not shared across
 *    replicas or restarts) and returns `X-Chat-Session: degraded` so
 *    the client can surface a notice.
 *
 * Why this exists:
 *  The BrightAI site (output: 'static' Astro) ships 190 prerendered
 *  pages. Any client-side AI integration would expose the key in the
 *  browser. By adding `@astrojs/node` and `export const prerender = false`
 *  on this file, ONLY this route is server-rendered; all other pages
 *  remain pure static HTML.
 *
 * Security (KRN-A1 + KRN-001 + EXEC-01 + KRN-003 / EXEC-03 + CHAT-SESSION-2026-07-15):
 *  - Keys read via `process.env.X` (runtime, never inlined into the
 *    SSR bundle). Previously used `import.meta.env.X` which Astro/Vite
 *    statically replaces at build time — leading to the Gemini key
 *    being baked into `dist/server/chunks/*.mjs`. ARCH-2 moves reads
 *    to runtime.
 *  - promptId is the ONLY way to specify a system prompt. The
 *    `systemPrompt` field is rejected with 400. Server looks up the
 *    actual prompt text from KERNEL_SYSTEM_PROMPTS (server-side import).
 *  - Origin allowlist + optional API key (KRN-003 / EXEC-03): The
 *    endpoint accepts requests from the BrightAI origin (browser fetch
 *    via KernelAiAssistant / chat.astro) OR from any client sending a
 *    valid `x-brightai-chat-key` header matching the server-side
 *    `process.env.BRIGHTAI_CHAT_KEY` (rotating, set in Render dashboard).
 *    Either path is sufficient; failure on both returns 403. The env
 *    var is read at function scope (runtime) so it is never inlined
 *    into the SSR bundle, and is gated so unset/empty values fall
 *    back to Origin-only auth (current production state).
 *  - The client fetch (/api/ai/chat) goes through `fetch()` from the
 *    browser; keys are never returned in any response shape.
 *  - API key comparison uses `crypto.timingSafeEqual` to prevent
 *    timing attacks.
 *  - No request body is logged.
 *  - CHAT-SESSION-2026-07-15: sessionId is treated as untrusted input.
 *    We validate it matches a UUID format (any version) and apply a
 *    hard length cap (CHAT_SESSION_LIMITS.SESSION_ID_MAX_CHARS) so a
 *    malicious client can't blow up the Redis key space. Message
 *    content is stored as JSON in Redis with a defensive length cap
 *    on read; the original 4000-char cap on the incoming message
 *    remains the primary bound.
 *  - Stored messages never include the system prompt (it is resolved
 *    server-side per request), so a future client that uses a
 *    different promptId on a later turn cannot leak another prompt
 *    through the history.
 */

import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { CHAT_SESSION_LIMITS } from '@brightai/config';
import {
  KERNEL_SYSTEM_PROMPTS,
  KERNEL_SYSTEM_PROMPT_MAX_CHARS,
  type KernelSystemPromptKey,
} from '../../../data/kernel-system-prompts';
// KRN-013 / EXEC-13: shared client IP extraction with XFF rightmost-trust
import { getClientIp } from '../../../lib/ip';
// CHAT-SESSION-2026-07-15: Redis-backed conversation context store
import { getChatSessionStore, type ChatMessage } from '../../../lib/redis';
// BAI-005: shared Redis sliding-window rate limiter (unified across Render instances)
import { rateLimit } from '../../../lib/ratelimit';
// USAGE-001 (2026-07-15): token usage tracking for billing + analytics.
import { recordUsageAsync } from '../../../lib/usagetracker';

export const prerender = false;

// ─────────────────────────────────────────────────────────────────────────
// Config — overridden via env vars in production
// ─────────────────────────────────────────────────────────────────────────
const MAX_MESSAGE_CHARS = 4000;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const PROVIDER_TIMEOUT_MS = 25_000;

// CHAT-STREAM-2026-07-15: feature flag — set CHAT_STREAMING_ENABLED=false
// in env to force JSON-only mode without a redeploy (instant rollback).
function isChatStreamingEnabled(): boolean {
  return process.env.CHAT_STREAMING_ENABLED !== 'false';
}

// ─────────────────────────────────────────────────────────────────────────
// CHAT-SESSION-2026-07-15: UUID validation
//
// Accepts any UUID version (v4 and v7 are both fine — the server does
// not care about the version, only that the shape is canonical). The
// shape is what bounds the Redis key size; the version check is purely
// for client compatibility (the kernel AI assistant generates v4 today
// and v7 once the form-factor needs time ordering).
// ─────────────────────────────────────────────────────────────────────────
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidSessionId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= CHAT_SESSION_LIMITS.SESSION_ID_MAX_CHARS &&
    UUID_REGEX.test(value)
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Allowed promptIds — server-side allowlist for system prompt lookup
// (KRN-001 / EXEC-01 — prompt injection mitigation)
// ─────────────────────────────────────────────────────────────────────────
const ALLOWED_PROMPT_IDS = [
  'compliance',
  'policies',
  'evidence',
  'audit',
  'scenarios',
] as const satisfies readonly KernelSystemPromptKey[];

// ─────────────────────────────────────────────────────────────────────────
// Origin allowlist + optional API key (KRN-003 / EXEC-03 — open LLM proxy auth)
// ─────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://brightai.site',
  'https://www.brightai.site',
  // Dev origins
  'http://localhost:4321',
  'http://127.0.0.1:4321',
] as const;

/**
 * Constant-time string comparison. timingSafeEqual requires equal-length
 * buffers, so we length-check first (the length check itself does not
 * leak content — only the count of mismatched length attempts).
 */
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Check Origin header against allowlist, OR accept a valid x-brightai-chat-key
 * header if BRIGHTAI_CHAT_KEY is configured in the environment.
 *
 * Two authentication paths (either one is sufficient):
 *  1. Browser fetch from an allowed origin (Origin header in ALLOWED_ORIGINS).
 *  2. Non-browser client (curl/Postman/server-to-server) sending a valid
 *     x-brightai-chat-key header. The key is read at RUNTIME from
 *     process.env.BRIGHTAI_CHAT_KEY (function scope) — never via import.meta.env
 *     (which Astro/Vite statically inlines into the SSR bundle, per the
 *     ARCH-2 fix in BATCH-2). If the env var is unset/empty, this path is
 *     disabled and only Origin-based auth is accepted.
 *
 * Failure on both paths returns 403 with `error: 'origin_not_allowed'`.
 */
function checkOriginAndAuth(req: Request): { ok: true } | { ok: false; res: Response } {
  // Path 1: API key (KRN-003 / EXEC-03 — optional, runtime env read).
  // Allows non-browser clients (no Origin header needed) to authenticate
  // with a shared secret rotated via the BRIGHTAI_CHAT_KEY env var in
  // Render dashboard. Trim both sides to avoid whitespace mismatches.
  const expectedKey = process.env.BRIGHTAI_CHAT_KEY?.trim();
  if (expectedKey) {
    const providedKey = req.headers.get('x-brightai-chat-key')?.trim();
    if (providedKey && safeEqual(expectedKey, providedKey)) {
      return { ok: true };
    }
  }

  // Path 2: Origin allowlist (default for browser clients).
  // Browsers automatically attach an Origin header on fetch() from JS, so
  // this works for all in-app pages (KernelAiAssistant, chat.astro, etc.).
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])) {
    return {
      ok: false,
      res: new Response(
        JSON.stringify({
          error: 'origin_not_allowed',
          hint: 'Send requests from https://brightai.site (or include x-brightai-chat-key header).',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        },
      ),
    };
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Client IP extraction (KRN-013 / EXEC-13)
// ─────────────────────────────────────────────────────────────────────────

function getClientIpLocal(req: Request): string {
  // TRUSTED_PROXY_COUNT env (default 1 for Render)
  const trustedProxyCount = parseInt(process.env.TRUSTED_PROXY_COUNT || '1', 10);
  return getClientIp(req, { trustedProxyCount });
}

// ─────────────────────────────────────────────────────────────────────────
// JSON helpers
// ─────────────────────────────────────────────────────────────────────────
function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function jsonError(
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
): Response {
  const headers: Record<string, string> = {};
  if (status === 429 && typeof extra.retryAfterSec === 'number') {
    headers['Retry-After'] = String(extra.retryAfterSec);
  }
  return jsonResponse({ error, ...extra }, status, headers);
}

// ─────────────────────────────────────────────────────────────────────────
// Provider: Groq (OpenAI-compatible) — blocking JSON variant
// ─────────────────────────────────────────────────────────────────────────
async function callGroq(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  signal: AbortSignal,
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number } }> {
  // ARCH-2: read env at runtime, never via import.meta.env (would be inlined)
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_placeholder') {
    throw new Error('GROQ_API_KEY not configured');
  }
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const endpoint =
    process.env.GROQ_ENDPOINT ||
    'https://api.groq.com/openai/v1/chat/completions';

  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        // CHAT-SESSION-2026-07-15: full history (oldest → newest) is sent
        // as alternating user/assistant messages before the current
        // user turn. The history is already in chronological order
        // because src/lib/redis.ts reverse-reads the LPUSHed list.
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 800,
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`groq_${res.status}:${t.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text) {
    throw new Error('groq_empty_response');
  }
  // USAGE-001: extract usage for billing/analytics.
  // Groq (OpenAI-compatible) returns prompt_tokens + completion_tokens.
  // لو الـ usage object غائب (rare)، default إلى 0 مع warning.
  const usage = data?.usage;
  const promptTokens = typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
  const completionTokens = typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : 0;
  if (!usage) {
    // eslint-disable-next-line no-console
    console.warn('[chat] groq response missing usage object — recording 0 tokens');
  }
  return { text, usage: { promptTokens, completionTokens } };
}

// ─────────────────────────────────────────────────────────────────────────
// Provider: Gemini (generativelanguage.googleapis.com) — blocking JSON variant
// ─────────────────────────────────────────────────────────────────────────
async function callGemini(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  signal: AbortSignal,
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number } }> {
  // ARCH-2: read env at runtime, never via import.meta.env (would be inlined)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_placeholder') {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Gemini uses 'user' and 'model' roles (not 'assistant'). Map our
  // internal role names accordingly.
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(systemPrompt
        ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
        : {}),
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.4,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`gemini_${res.status}:${t.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text) {
    throw new Error('gemini_empty_response');
  }
  // USAGE-001: extract usage for billing/analytics.
  // Gemini returns usageMetadata with promptTokenCount + candidatesTokenCount.
  const meta = data?.usageMetadata;
  const promptTokens = typeof meta?.promptTokenCount === 'number' ? meta.promptTokenCount : 0;
  const completionTokens = typeof meta?.candidatesTokenCount === 'number' ? meta.candidatesTokenCount : 0;
  if (!meta) {
    // eslint-disable-next-line no-console
    console.warn('[chat] gemini response missing usageMetadata — recording 0 tokens');
  }
  return { text, usage: { promptTokens, completionTokens } };
}

// ─────────────────────────────────────────────────────────────────────────
// CHAT-STREAM-2026-07-15: SSE streaming helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build a groq request body (shared between blocking + streaming callsites).
 */
function buildGroqBody(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  stream: boolean,
): string {
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  return JSON.stringify({
    model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 800,
    temperature: 0.4,
    stream,
  });
}

/**
 * Build a Gemini request body (shared between blocking + streaming callsites).
 */
function buildGeminiBody(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
): string {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  return JSON.stringify({
    contents,
    ...(systemPrompt
      ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
      : {}),
    generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
  });
}

/**
 * Parse raw SSE text and yield each complete data payload string.
 * Handles multi-line buffering so partial frames are not lost.
 */
function* parseSSEChunk(chunk: string): Generator<string> {
  // Lines are separated by \n; frames by \n\n (or \r\n\r\n).
  // We yield only lines that start with "data: ".
  const lines = chunk.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      yield line.slice(6);
    }
  }
}

/**
 * Stream from Groq (OpenAI-compatible SSE) and yield delta strings.
 * Throws before yielding anything if the upstream HTTP request fails.
 */
async function* streamGroq(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_placeholder') {
    throw new Error('GROQ_API_KEY not configured');
  }
  const endpoint =
    process.env.GROQ_ENDPOINT ||
    'https://api.groq.com/openai/v1/chat/completions';

  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: buildGroqBody(messages, systemPrompt, true),
  });

  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '');
    throw new Error(`groq_${res.status}:${t.slice(0, 120)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // Process complete lines from buffer
      const lastNewline = buf.lastIndexOf('\n');
      if (lastNewline === -1) continue;
      const chunk = buf.slice(0, lastNewline + 1);
      buf = buf.slice(lastNewline + 1);
      for (const payload of parseSSEChunk(chunk)) {
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
          };
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            yield delta;
          }
          if (json?.choices?.[0]?.finish_reason === 'stop') return;
        } catch {
          // Malformed JSON frame — skip silently
        }
      }
    }
    // Flush remaining buffer
    if (buf.trim()) {
      for (const payload of parseSSEChunk(buf)) {
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) yield delta;
        } catch {
          // skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream from Gemini (:streamGenerateContent?alt=sse) and yield text chunks.
 * Throws before yielding anything if the upstream HTTP request fails.
 */
async function* streamGemini(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_placeholder') {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  // Use :streamGenerateContent?alt=sse for true SSE output
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: buildGeminiBody(messages, systemPrompt),
  });

  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '');
    throw new Error(`gemini_${res.status}:${t.slice(0, 120)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lastNewline = buf.lastIndexOf('\n');
      if (lastNewline === -1) continue;
      const chunk = buf.slice(0, lastNewline + 1);
      buf = buf.slice(lastNewline + 1);
      for (const payload of parseSSEChunk(chunk)) {
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
              finishReason?: string;
            }>;
          };
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === 'string' && text.length > 0) {
            yield text;
          }
          if (json?.candidates?.[0]?.finishReason === 'STOP') return;
        } catch {
          // skip malformed frame
        }
      }
    }
    // Flush remaining buffer
    if (buf.trim()) {
      for (const payload of parseSSEChunk(buf)) {
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === 'string' && text.length > 0) yield text;
        } catch {
          // skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Format a single SSE event frame.
 * Newlines inside data JSON are already escaped by JSON.stringify.
 */
function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Build the SSE Response with anti-buffering headers.
 * The caller passes a ReadableStream that emits UTF-8 encoded SSE text.
 */
function sseResponse(stream: ReadableStream<Uint8Array>, extraHeaders: Record<string, string> = {}): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      // Prevent Render's nginx proxy from buffering the SSE stream.
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// POST handler — the only exported route used by the client.
// ─────────────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  // 1. Origin allowlist (KRN-003 / EXEC-03) — check BEFORE rate limit so
  //    rejected requests don't waste CPU on JSON parsing.
  const auth = checkOriginAndAuth(request);
  if (!auth.ok) return auth.res;

  // 2. Rate limit (BAI-005: Redis sliding-window, unified across Render instances)
  //    Always runs before streaming — so the rate limit check is never inside
  //    a stream (where sending a 429 HTTP status would be impossible).
  const ip = getClientIpLocal(request);
  const rl = await rateLimit(`chat:${ip}`, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS / 1_000);
  if (!rl.allowed) {
    const headers: Record<string, string> = {
      'Retry-After': String(rl.retryAfterSec),
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': '0',
    };
    if (rl.degraded) headers['X-RateLimit-Degraded'] = 'true';
    return jsonError(429, 'rate_limited', { retryAfterSec: rl.retryAfterSec });
  }

  // 3. Parse JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  if (!body || typeof body !== 'object') {
    return jsonError(400, 'invalid_body');
  }
  const b = body as Record<string, unknown>;

  // 4. Validate message
  const messageRaw = b.message;
  if (typeof messageRaw !== 'string') {
    return jsonError(400, 'message_must_be_string');
  }
  const message = messageRaw.trim();
  if (!message) {
    return jsonError(400, 'message_empty');
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return jsonError(400, 'message_too_long', {
      max: MAX_MESSAGE_CHARS,
      length: message.length,
    });
  }

  // 5. Reject client-supplied systemPrompt (KRN-001 / EXEC-01 — prompt injection)
  if (b.systemPrompt !== undefined) {
    return jsonError(400, 'systemPrompt_not_accepted', {
      hint: 'Send promptId from the allowlist instead. See KERNEL_SYSTEM_PROMPTS keys.',
    });
  }

  // 6. Optional system prompt via server-side promptId allowlist (EXEC-01)
  let systemPrompt: string | undefined;
  if (typeof b.promptId === 'string') {
    if (!ALLOWED_PROMPT_IDS.includes(b.promptId as KernelSystemPromptKey)) {
      return jsonError(400, 'invalid_prompt_id', {
        allowed: ALLOWED_PROMPT_IDS,
      });
    }
    systemPrompt = KERNEL_SYSTEM_PROMPTS[b.promptId as KernelSystemPromptKey].slice(
      0,
      KERNEL_SYSTEM_PROMPT_MAX_CHARS,
    );
  }

  // 7. CHAT-SESSION-2026-07-15: optional sessionId → fetch conversation
  //    history from the Redis-backed store. If sessionId is absent, the
  //    endpoint behaves as a single-turn request (no Redis access). If
  //    sessionId is malformed, reject with 400. If sessionId is valid
  //    but Redis is unavailable, the store returns degraded=true and we
  //    still serve the request with an empty history + a response header
  //    so the client can surface a notice.
  let history: ChatMessage[] = [];
  let sessionDegraded = false;
  let sessionId: string | undefined;
  if (b.sessionId !== undefined) {
    if (!isValidSessionId(b.sessionId)) {
      return jsonError(400, 'invalid_session_id', {
        hint: 'sessionId must be a UUID v4 or v7 (lowercase, with dashes).',
      });
    }
    sessionId = b.sessionId;
    const store = getChatSessionStore();
    const result = await store.recent(
      sessionId,
      CHAT_SESSION_LIMITS.MAX_MESSAGES,
    );
    history = result.ok;
    sessionDegraded = result.degraded;
  }

  // 8. Provider selection
  const requestedProvider =
    typeof b.provider === 'string' ? b.provider.toLowerCase() : 'auto';

  // 9. Build the messages array passed to the provider: history first
  //    (already in chronological order from src/lib/redis.ts), then the
  //    current user turn at the tail.
  const providerMessages: ChatMessage[] = [
    ...history,
    { role: 'user', content: message, ts: Date.now() },
  ];

  // ─────────────────────────────────────────────────────────────────────
  // CHAT-STREAM-2026-07-15: SSE path
  //
  // Conditions to enter SSE path:
  //  1. Client sent Accept: text/event-stream
  //  2. CHAT_STREAMING_ENABLED env is not 'false' (feature flag)
  //
  // Security invariants preserved:
  //  - Origin + rate limit already checked above (before the stream opens)
  //  - KRN-015: fresh AbortController per provider call
  //  - KRN-001: promptId allowlist enforced above
  //  - Session history fetched above; push happens after done event
  // ─────────────────────────────────────────────────────────────────────
  const wantsSSE = request.headers.get('accept')?.includes('text/event-stream') ?? false;

  if (wantsSSE && isChatStreamingEnabled()) {
    // Capture locals for use inside ReadableStream constructor
    const _sessionId = sessionId;
    const _sessionDegraded = sessionDegraded;
    const _requestedProvider = requestedProvider;
    const _providerMessages = providerMessages;
    const _systemPrompt = systemPrompt;

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Enqueue helper
        const enq = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        // KRN-015 fix: fresh AbortController per provider call
        let ctrl = new AbortController();
        let providerTimer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);

        let usedProvider: 'groq' | 'gemini' | '' = '';
        let fullReply = '';
        let firstTokenSent = false;

        // Helper: run a streaming generator with timeout reset on each token.
        // Returns false if the generator threw before any token was yielded
        // (safe to attempt fallback). Returns true on success or
        // mid-stream error (fallback not possible after first token).
        async function pipeGenerator(
          gen: AsyncGenerator<string>,
          provider: 'groq' | 'gemini',
        ): Promise<'ok' | 'pre-first-token-error' | 'mid-stream-error'> {
          try {
            for await (const delta of gen) {
              fullReply += delta;
              enq('token', { delta });
              if (!firstTokenSent) {
                firstTokenSent = true;
                usedProvider = provider;
              }
            }
            return 'ok';
          } catch (e) {
            if (!firstTokenSent) {
              return 'pre-first-token-error';
            }
            // Mid-stream error — stream is already open, can't fallback
            enq('error', { error: (e as Error).message ?? 'stream_error' });
            return 'mid-stream-error';
          }
        }

        try {
          let outcome: 'ok' | 'pre-first-token-error' | 'mid-stream-error' = 'pre-first-token-error';

          if (_requestedProvider === 'groq') {
            outcome = await pipeGenerator(
              streamGroq(_providerMessages, _systemPrompt, ctrl.signal),
              'groq',
            );
            if (outcome === 'pre-first-token-error') {
              enq('error', { error: 'groq_failed' });
            }
          } else if (_requestedProvider === 'gemini') {
            outcome = await pipeGenerator(
              streamGemini(_providerMessages, _systemPrompt, ctrl.signal),
              'gemini',
            );
            if (outcome === 'pre-first-token-error') {
              enq('error', { error: 'gemini_failed' });
            }
          } else {
            // auto mode: try Groq first
            clearTimeout(providerTimer);
            ctrl = new AbortController();
            providerTimer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);

            outcome = await pipeGenerator(
              streamGroq(_providerMessages, _systemPrompt, ctrl.signal),
              'groq',
            );

            if (outcome === 'pre-first-token-error') {
              // Groq failed before first token — safe to try Gemini
              clearTimeout(providerTimer);
              ctrl = new AbortController();
              providerTimer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);

              outcome = await pipeGenerator(
                streamGemini(_providerMessages, _systemPrompt, ctrl.signal),
                'gemini',
              );

              if (outcome === 'pre-first-token-error') {
                enq('error', { error: 'all_providers_failed' });
              }
            }
            // mid-stream-error already handled inside pipeGenerator
          }

          // Send done event only on success
          if (outcome === 'ok' && usedProvider) {
            enq('done', {
              provider: usedProvider,
              sessionId: _sessionId ?? null,
            });

            // Session persistence — fire after done event is enqueued.
            // Non-fatal: a Redis failure here does not abort the response.
            if (_sessionId && fullReply) {
              const now = Date.now();
              getChatSessionStore()
                .push(
                  _sessionId,
                  [
                    { role: 'user', content: message, ts: now },
                    { role: 'assistant', content: fullReply, ts: now },
                  ],
                  {
                    maxMessages: CHAT_SESSION_LIMITS.MAX_MESSAGES,
                    ttlSeconds: CHAT_SESSION_LIMITS.TTL_SECONDS,
                  },
                )
                .catch(() => {
                  // Intentionally swallow — same as JSON path (non-fatal)
                });
            }
          }
        } catch (e) {
          // Outer catch: validation or setup errors that escaped pipeGenerator
          try {
            enq('error', { error: (e as Error).message ?? 'internal_error' });
          } catch {
            // controller may already be closed
          }
        } finally {
          clearTimeout(providerTimer);
          try { controller.close(); } catch { /* already closed */ }
        }
      },
    });

    const sseExtraHeaders: Record<string, string> = {};
    if (sessionId) {
      sseExtraHeaders['X-Chat-Session'] = sessionDegraded ? 'degraded' : 'ok';
    }
    return sseResponse(stream, sseExtraHeaders);
  }

  // ─────────────────────────────────────────────────────────────────────
  // JSON path — original blocking behaviour (backwards compatible)
  // ─────────────────────────────────────────────────────────────────────

  // 10. Per-provider timeout (KRN-015 fix) — fresh AbortController per call
  //     so a Groq timeout doesn't poison the Gemini fallback signal.
  async function callWithTimeout<T>(
    fn: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
    try {
      return await fn(ctrl.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  let reply = '';
  let usage: { promptTokens: number; completionTokens: number } = { promptTokens: 0, completionTokens: 0 };
  let usedProvider: 'groq' | 'gemini' | '' = '';
  let lastError = '';
  const providerStartTs = Date.now();

  try {
    if (requestedProvider === 'groq') {
      const result = await callWithTimeout((signal) =>
        callGroq(providerMessages, systemPrompt, signal),
      );
      reply = result.text;
      usage = result.usage;
      usedProvider = 'groq';
    } else if (requestedProvider === 'gemini') {
      const result = await callWithTimeout((signal) =>
        callGemini(providerMessages, systemPrompt, signal),
      );
      reply = result.text;
      usage = result.usage;
      usedProvider = 'gemini';
    } else {
      // auto: try Groq first, fallback to Gemini (each call gets its own AbortController)
      try {
        const result = await callWithTimeout((signal) =>
          callGroq(providerMessages, systemPrompt, signal),
        );
        reply = result.text;
        usage = result.usage;
        usedProvider = 'groq';
      } catch (e) {
        lastError = (e as Error).message;
        const result = await callWithTimeout((signal) =>
          callGemini(providerMessages, systemPrompt, signal),
        );
        reply = result.text;
        usage = result.usage;
        usedProvider = 'gemini';
      }
    }
  } catch (e) {
    return jsonError(502, 'provider_failed', { detail: (e as Error).message });
  }

  if (!usedProvider || !reply) {
    return jsonError(502, 'provider_failed', { detail: lastError || 'empty' });
  }

  // USAGE-001 (2026-07-15): record token usage for billing + analytics.
  // Fire-and-forget — ما ينتظر DB write (الـ response يخرج فوراً).
  // الـ marketing site anon → organizationId = null.
  const model =
    usedProvider === 'groq'
      ? process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
      : process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  recordUsageAsync({
    provider: usedProvider as 'groq' | 'gemini',
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    latencyMs: Date.now() - providerStartTs,
    promptId: typeof b.promptId === 'string' ? b.promptId : undefined,
    organizationId: null, // marketing site anon (dashboard passes via Clerk)
    sessionId: sessionId ?? undefined,
  });

  // 11. CHAT-SESSION-2026-07-15: persist the current turn (user + assistant)
  //     back to the store. Fire-and-forget from the response's perspective
  //     (we await so tests can assert, but in prod a slow Redis would
  //     surface in the same request — which is the right failure mode:
  //     the client knows context wasn't saved).
  const now = Date.now();
  if (sessionId) {
    try {
      await getChatSessionStore().push(
        sessionId,
        [
          { role: 'user', content: message, ts: now },
          { role: 'assistant', content: reply, ts: now },
        ],
        {
          maxMessages: CHAT_SESSION_LIMITS.MAX_MESSAGES,
          ttlSeconds: CHAT_SESSION_LIMITS.TTL_SECONDS,
        },
      );
    } catch {
      // Persistence failure is non-fatal. The reply is already on the
      // wire; the next request will simply start with the pre-failure
      // history. We intentionally do NOT surface this to the client —
      // a transient Redis blip shouldn't degrade the user experience
      // beyond what the X-Chat-Session header already signals.
    }
  }

  // 12. Build response. Set X-Chat-Session: degraded header when the
  //     in-memory fallback was used (or the write was skipped) so the
  //     client can show "conversation context not preserved across
  //     reloads" if it wants to.
  const extraHeaders: Record<string, string> = {};
  if (sessionId) {
    extraHeaders['X-Chat-Session'] = sessionDegraded ? 'degraded' : 'ok';
    // The reply itself is per-request and should not be cached. The
    // history lives in Redis (TTL 10 min) and is read on every request.
  }

  return jsonResponse(
    { reply, provider: usedProvider, sessionId: sessionId ?? null },
    200,
    extraHeaders,
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Other HTTP methods → 405 (don't burn rate-limit budget on GET/HEAD).
// ─────────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async () =>
  jsonError(405, 'method_not_allowed', { allowed: ['POST'] });

export const PUT: APIRoute = async () =>
  jsonError(405, 'method_not_allowed', { allowed: ['POST'] });

export const DELETE: APIRoute = async () =>
  jsonError(405, 'method_not_allowed', { allowed: ['POST'] });
