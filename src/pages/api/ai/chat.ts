/**
 * src/pages/api/ai/chat.ts — REPORTS-SEC-01 (2026-07-06)
 *                  + KERNEL-AUDIT-2026-07-15-BATCH-2 (ARCH-2 + EXEC-01)
 *                  + KRN-003-FULL-2026-07-15 (EXEC-03 API key check)
 *
 * Server-side proxy for AI chat. Reads provider keys from
 * `process.env.GROQ_API_KEY` and `process.env.GEMINI_API_KEY`
 * at REQUEST TIME (runtime, not build time) so the keys are NEVER
 * inlined into the SSR bundle (ARCH-2 fix).
 *
 * Behavior:
 *  - POST { message: string, promptId?: 'compliance'|'policies'|'evidence'|'audit'|'scenarios', provider?: 'groq'|'gemini'|'auto' }
 *  - Returns { reply: string, provider: 'groq'|'gemini' } on success.
 *  - In-memory rate limit: 10 requests / minute / IP.
 *  - Validates: message is a non-empty string ≤ 4000 chars.
 *  - promptId is looked up server-side from KERNEL_SYSTEM_PROMPTS
 *    (EXEC-01 — KRN-001 prompt injection mitigation).
 *  - Auto mode: tries Groq first (fast), falls back to Gemini on failure.
 *  - Both providers fail → 502 with sanitized error.
 *
 * Why this exists:
 *  The BrightAI site (output: 'static' Astro) ships 190 prerendered
 *  pages. Any client-side AI integration would expose the key in the
 *  browser. By adding `@astrojs/node` and `export const prerender = false`
 *  on this file, ONLY this route is server-rendered; all other pages
 *  remain pure static HTML.
 *
 * Security (KRN-A1 + KRN-001 + EXEC-01 + KRN-003 / EXEC-03):
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
 *  - No message content is persisted server-side.
 */

import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import {
  KERNEL_SYSTEM_PROMPTS,
  KERNEL_SYSTEM_PROMPT_MAX_CHARS,
  type KernelSystemPromptKey,
} from '../../../data/kernel-system-prompts';
// KRN-013 / EXEC-13: shared client IP extraction with XFF rightmost-trust
import { getClientIp } from '../../../lib/ip';

export const prerender = false;

// ─────────────────────────────────────────────────────────────────────────
// Config — overridden via env vars in production
// ─────────────────────────────────────────────────────────────────────────
const MAX_MESSAGE_CHARS = 4000;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const PROVIDER_TIMEOUT_MS = 25_000;

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
// In-memory rate limit bucket (per IP)
// Single-instance only; for multi-instance deploys swap to KV/Redis.
// ─────────────────────────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIpLocal(req: Request): string {
  // KRN-013 / EXEC-13: TRUSTED_PROXY_COUNT env (default 1 for Render)
  const trustedProxyCount = parseInt(process.env.TRUSTED_PROXY_COUNT || '1', 10);
  return getClientIp(req, { trustedProxyCount });
}

function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || now > existing.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  existing.count += 1;
  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true };
}

// Periodic cleanup so the Map doesn't grow unbounded.
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, b] of buckets) {
      if (now > b.resetAt) buckets.delete(ip);
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't keep the process alive solely for cleanup.
  if (typeof cleanupTimer === 'object' && cleanupTimer && 'unref' in cleanupTimer) {
    (cleanupTimer as { unref: () => void }).unref?.();
  }
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
// Provider: Groq (OpenAI-compatible)
// ─────────────────────────────────────────────────────────────────────────
async function callGroq(
  message: string,
  systemPrompt: string | undefined,
  signal: AbortSignal,
): Promise<string> {
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
        { role: 'user', content: message },
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
  return text;
}

// ─────────────────────────────────────────────────────────────────────────
// Provider: Gemini (generativelanguage.googleapis.com)
// ─────────────────────────────────────────────────────────────────────────
async function callGemini(
  message: string,
  systemPrompt: string | undefined,
  signal: AbortSignal,
): Promise<string> {
  // ARCH-2: read env at runtime, never via import.meta.env (would be inlined)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_placeholder') {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: message }] }],
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
  return text;
}

// ─────────────────────────────────────────────────────────────────────────
// POST handler — the only exported route used by the client.
// ─────────────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  ensureCleanup();

  // 1. Origin allowlist (KRN-003 / EXEC-03) — check BEFORE rate limit so
  //    rejected requests don't waste CPU on JSON parsing.
  const auth = checkOriginAndAuth(request);
  if (!auth.ok) return auth.res;

  // 2. Rate limit
  const ip = getClientIpLocal(request);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
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

  // 7. Provider selection
  const requestedProvider =
    typeof b.provider === 'string' ? b.provider.toLowerCase() : 'auto';

  // 8. Per-provider timeout (KRN-015 fix) — fresh AbortController per call
  //    so a Groq timeout doesn't poison the Gemini fallback signal.
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
  let usedProvider: 'groq' | 'gemini' | '' = '';
  let lastError = '';

  try {
    if (requestedProvider === 'groq') {
      reply = await callWithTimeout((signal) => callGroq(message, systemPrompt, signal));
      usedProvider = 'groq';
    } else if (requestedProvider === 'gemini') {
      reply = await callWithTimeout((signal) => callGemini(message, systemPrompt, signal));
      usedProvider = 'gemini';
    } else {
      // auto: try Groq first, fallback to Gemini (each call gets its own AbortController)
      try {
        reply = await callWithTimeout((signal) => callGroq(message, systemPrompt, signal));
        usedProvider = 'groq';
      } catch (e) {
        lastError = (e as Error).message;
        reply = await callWithTimeout((signal) => callGemini(message, systemPrompt, signal));
        usedProvider = 'gemini';
      }
    }
  } catch (e) {
    return jsonError(502, 'provider_failed', { detail: (e as Error).message });
  }

  if (!usedProvider || !reply) {
    return jsonError(502, 'provider_failed', { detail: lastError || 'empty' });
  }

  return jsonResponse({ reply, provider: usedProvider });
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
