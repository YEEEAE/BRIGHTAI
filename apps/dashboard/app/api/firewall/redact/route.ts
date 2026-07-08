/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * POST /api/firewall/redact
 *
 * Pure redaction — no LLM call. Useful for:
 *   - clients that want to redact text before sending to their
 *     own LLM provider
 *   - batch scrubbing of stored documents
 *   - QA / testing
 *
 * Auth: Bearer <api_key> (looked up in the ApiKey table)
 *
 * Body: { text: string, action?: Action, nerEnabled?: boolean }
 * Returns: RedactionResult
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { resolveApiKey } from '@/lib/firewall/auth/api-key';
import { detectAndRedact, DEFAULT_POLICY } from '@/lib/firewall';
import type { Action, FirewallContext } from '@/lib/firewall';
import { consume } from '@/lib/firewall/ratelimit/redis-bucket';
import { logFirewallEvent, sha256Text, uniquePiiTypes } from '@/lib/firewall/audit/audit-writer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  text: z.string().min(1).max(64_000), // 64 KB cap per request
  action: z.enum(['redact', 'mask', 'tokenize', 'block']).optional(),
  nerEnabled: z.boolean().optional(),
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

  // 2. Rate limit ────────────────────────────────────────────────
  const rl = await consume({
    key: `redact:${apiKey.organizationId}:${apiKey.apiKeyId}`,
    limit: 120,
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

  // 4. Build context + run detection ─────────────────────────────
  const policy = {
    ...DEFAULT_POLICY,
    nerEnabled: body.nerEnabled ?? false,
  };
  // If the caller passed a single action, apply it to all types.
  if (body.action) {
    policy.actions = Object.fromEntries(
      Object.keys(policy.actions).map((k) => [k, body.action as Action]),
    ) as typeof policy.actions;
  }

  const ctx: FirewallContext = {
    organizationId: apiKey.organizationId,
    userId: apiKey.createdById,
    policy,
    requestId: nanoid(12),
  };

  const result = await detectAndRedact(body.text, ctx);

  // 5. Audit log ─────────────────────────────────────────────────
  try {
    await logFirewallEvent(ctx, {
      latencyMs: result.latencyMs,
      piiTypes: uniquePiiTypes(result.detections),
      detectionCount: result.detections.length,
      originalTextSha256: sha256Text(body.text),
      originalLength: body.text.length,
      effectiveAction: body.action ?? 'policy_default',
      model: null,
      tokensUsed: null,
      blocked: result.blocked,
      llmLatencyMs: null,
    });
  } catch {
    // Audit failures must not break the user-visible response.
    // The chain is best-effort during 1a; we'll add monitoring in 1b.
  }

  // 6. Return ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      ...result,
      requestId: ctx.requestId,
      totalLatencyMs: Date.now() - t0,
    },
    {
      status: result.blocked ? 451 : 200,
      headers: {
        'X-Firewall-Request-Id': ctx.requestId,
        'X-Firewall-Detections': String(result.detections.length),
        'X-Firewall-Blocked': result.blocked ? 'true' : 'false',
        'X-Firewall-RateLimit': rl.degraded ? 'degraded' : 'enforced',
        'Cache-Control': 'no-store',
      },
    },
  );
}
