/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * POST /api/firewall/chat/completions
 *
 * OpenAI-compatible chat completions, gated by the firewall.
 *
 * Pipeline:
 *   1. Auth (Bearer API key)
 *   2. Rate limit (60 req/min/org, default)
 *   3. Detect PII in the last user message (input pass)
 *   4. Apply policy actions (mask | redact | tokenize | block)
 *   5. Call Groq with the redacted messages
 *   6. Re-detect PII in the assistant response (output pass)
 *   7. Re-apply actions on the response
 *   8. Persist AIRequest row + append audit log (hash-chained)
 *   9. Return OpenAI-shape response
 *
 * Phase 1a: non-streaming only. Phase 1b will add SSE streaming
 * with chunk-level redaction.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { resolveApiKey } from '@/lib/firewall/auth/api-key';
import { detect, applyActions, DEFAULT_POLICY } from '@/lib/firewall';
import type { FirewallContext } from '@/lib/firewall';
import { consume } from '@/lib/firewall/ratelimit/redis-bucket';
import { chat } from '@/lib/firewall/llm/groq-client';
import { logFirewallEvent, sha256Text, uniquePiiTypes } from '@/lib/firewall/audit/audit-writer';
import { dbServiceRole } from '@brightai/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Allow up to 60 s for the upstream LLM + two detection passes.
export const maxDuration = 60;

// OpenAI Chat Completions request shape (subset).
const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(0).max(64_000),
  name: z.string().optional(),
});

const BodySchema = z.object({
  model: z.string().optional(),
  messages: z.array(MessageSchema).min(1).max(64),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(8192).optional(),
  // Firewall-specific overrides (not part of OpenAI spec).
  firewall: z
    .object({
      nerEnabled: z.boolean().optional(),
      blockOnCritical: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const t0 = Date.now();

  // 1. Auth ──────────────────────────────────────────────────────
  const apiKey = await resolveApiKey(req.headers.get('authorization'));
  if (!apiKey) {
    return NextResponse.json(
      { error: 'invalid_or_missing_api_key' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 2. Rate limit (60/min/org) ───────────────────────────────────
  const rl = await consume({
    key: `chat:${apiKey.organizationId}`,
    limit: 60,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded', retryAfterSec: rl.retryAfterSec },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfterSec),
          'X-Firewall-RateLimit': rl.degraded ? 'degraded' : 'enforced',
        },
      },
    );
  }

  // 3. Parse body ────────────────────────────────────────────────
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', details: err instanceof Error ? err.message : 'parse_failed' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 4. Firewall context ──────────────────────────────────────────
  const ctx: FirewallContext = {
    organizationId: apiKey.organizationId,
    userId: apiKey.createdById,
    policy: {
      ...DEFAULT_POLICY,
      nerEnabled: body.firewall?.nerEnabled ?? false,
      blockOnCritical: body.firewall?.blockOnCritical ?? true,
    },
    requestId: nanoid(12),
  };

  // 5. Input PII pass (only the last user message — same as OpenAI
  //    does for safety filters).
  const lastUserIdx = (() => {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      if (body.messages[i].role === 'user') return i;
    }
    return -1;
  })();

  if (lastUserIdx === -1) {
    return NextResponse.json(
      { error: 'no_user_message' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const inputText = body.messages[lastUserIdx].content;
  const inputDetections = await detect(inputText, ctx);
  const inputResult = applyActions(inputText, inputDetections, ctx.policy);

  if (inputResult.blocked) {
    // Hard stop — record the block and return 451.
    try {
      await logFirewallEvent(ctx, {
        latencyMs: inputResult.latencyMs,
        piiTypes: uniquePiiTypes(inputDetections),
        detectionCount: inputDetections.length,
        originalTextSha256: sha256Text(inputText),
        originalLength: inputText.length,
        effectiveAction: 'block',
        model: null,
        tokensUsed: null,
        blocked: true,
        llmLatencyMs: null,
        notes: 'blocked_before_llm',
      });
    } catch {
      // ignore
    }
    return NextResponse.json(
      {
        error: 'blocked_by_firewall',
        reason: 'PII policy violation',
        detections: inputDetections.map((d) => ({ type: d.type, start: d.start, end: d.end })),
        requestId: ctx.requestId,
      },
      {
        status: 451,
        headers: {
          'X-Firewall-Request-Id': ctx.requestId,
          'X-Firewall-Blocked': 'true',
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  // 6. Build the redacted messages and call Groq ────────────────
  const redactedMessages = body.messages.map((m, i) =>
    i === lastUserIdx ? { ...m, content: inputResult.redactedText } : m,
  );

  const llmStart = Date.now();
  let llmResponse;
  try {
    llmResponse = await chat({
      messages: redactedMessages,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_llm_error';
    return NextResponse.json(
      { error: 'upstream_llm_error', details: message, requestId: ctx.requestId },
      {
        status: 502,
        headers: {
          'X-Firewall-Request-Id': ctx.requestId,
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  const llmLatencyMs = Date.now() - llmStart;

  // 7. Output PII pass ──────────────────────────────────────────
  const outputDetections = await detect(llmResponse.content, ctx);
  const outputResult = applyActions(llmResponse.content, outputDetections, ctx.policy);
  const finalContent = outputResult.blocked
    ? '[REDACTED_BY_FIREWALL]'
    : outputResult.redactedText;

  // 8. Persist AIRequest + audit log ────────────────────────────
  try {
    await dbServiceRole.$transaction(async (tx) => {
      // AIRequest row (tenant-scoped via withTenant would be ideal,
      // but we use the service role for the cross-org write — the
      // audit chain captures the orgId).
      const aiReq = await tx.aIRequest.create({
        data: {
          organizationId: ctx.organizationId,
          requestedById: ctx.userId ?? apiKey.createdById,
          prompt: inputText.slice(0, 8192),
          response: finalContent.slice(0, 8192),
          modelUsed: llmResponse.model,
          tokensUsed: llmResponse.totalTokens,
          piiDetected: inputDetections.length + outputDetections.length > 0,
          piiTypes: Array.from(
            new Set([
              ...uniquePiiTypes(inputDetections),
              ...uniquePiiTypes(outputDetections),
            ]),
          ),
          status: 'AUTO_APPROVED',
          riskScore: computeRisk(inputDetections, outputDetections),
          riskLevel: 'LOW',
        },
      });

      // Append to audit chain. The hashchain writer uses its own
      // transaction; this is fine because the advisory lock
      // serializes per-org.
      await logFirewallEvent(ctx, {
        latencyMs: inputResult.latencyMs + outputResult.latencyMs,
        piiTypes: Array.from(
          new Set([
            ...uniquePiiTypes(inputDetections),
            ...uniquePiiTypes(outputDetections),
          ]),
        ).sort(),
        detectionCount: inputDetections.length + outputDetections.length,
        originalTextSha256: sha256Text(inputText),
        originalLength: inputText.length,
        effectiveAction: 'mask', // default; per-type action in metadata
        model: llmResponse.model,
        tokensUsed: llmResponse.totalTokens,
        blocked: outputResult.blocked,
        llmLatencyMs,
        notes: `ai_request:${aiReq.id}`,
      });
    });
  } catch (err) {
    // Persistence failure must not lose the user's response.
    // eslint-disable-next-line no-console
    console.error('[firewall] persist failed:', err);
  }

  // 9. Return OpenAI-shape response ──────────────────────────────
  return NextResponse.json(
    {
      id: `chatcmpl-${ctx.requestId}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: llmResponse.model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: finalContent },
          finish_reason: llmResponse.finishReason ?? 'stop',
        },
      ],
      usage: {
        prompt_tokens: llmResponse.promptTokens,
        completion_tokens: llmResponse.completionTokens,
        total_tokens: llmResponse.totalTokens,
      },
      // BrightAI extensions (ignored by OpenAI clients).
      x_brightai_firewall: {
        requestId: ctx.requestId,
        inputDetections: inputDetections.length,
        outputDetections: outputDetections.length,
        inputPiiTypes: uniquePiiTypes(inputDetections),
        outputPiiTypes: uniquePiiTypes(outputDetections),
        latencyMs: Date.now() - t0,
      },
    },
    {
      headers: {
        'X-Firewall-Request-Id': ctx.requestId,
        'X-Firewall-Input-Detections': String(inputDetections.length),
        'X-Firewall-Output-Detections': String(outputDetections.length),
        'X-Firewall-Blocked': 'false',
        'X-Firewall-RateLimit': rl.degraded ? 'degraded' : 'enforced',
        'Cache-Control': 'no-store',
      },
    },
  );
}

function computeRisk(
  inputDets: Array<{ type: string; confidence: number }>,
  outputDets: Array<{ type: string; confidence: number }>,
): number {
  // Deterministic risk score in [0, 1]. No ML.
  const critical = new Set(['SAUDI_ID', 'CREDENTIAL', 'PATIENT_ID', 'CARD_OR_ACCOUNT']);
  const all = [...inputDets, ...outputDets];
  if (all.length === 0) return 0;
  const hasCritical = all.some((d) => critical.has(d.type));
  const score = Math.min(1, 0.1 * all.length + 0.4 * (hasCritical ? 1 : 0));
  return Number(score.toFixed(3));
}
