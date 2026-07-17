/**
 * BrightAI AI Firewall — Phase 1c
 *
 * POST /api/firewall/transcribe
 *
 * Audio transcription (Whisper) gated by the PII firewall.
 *
 * Pipeline:
 *   1. Auth (Bearer API key)
 *   2. Rate limit (60 req/min/org — same as chat)
 *   3. Accept the audio file (multipart/form-data)
 *   4. Forward to Groq whisper-large-v3 → raw transcription text
 *   5. Run PII detection + redaction on the transcription
 *   6. Optionally tokenize PII via the vault (reversible)
 *   7. Persist AIRequest + audit log
 *   8. Return OpenAI-shaped JSON with the redacted text
 *
 * Use cases:
 *   - Customer support call recordings → transcript → redact PII
 *   - Voice notes in healthcare apps → PII redaction for PDPL
 *   - Meeting recordings → safe storage with tokenized PII
 */

import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { resolveApiKey } from '@/lib/firewall/auth/api-key';
import { detect, applyActions, DEFAULT_POLICY } from '@/lib/firewall';
import { applyActionsWithVault } from '@/lib/firewall/engine/redaction';
import { tokenize } from '@/lib/firewall/vault/token-vault';
import { transcribe } from '@/lib/firewall/llm/groq-client';
import { consume } from '@/lib/firewall/ratelimit/redis-bucket';
import { persistFirewallEventDurable } from '@/lib/firewall/audit/durable';
import { sha256Text, uniquePiiTypes } from '@/lib/firewall/audit/audit-writer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Whisper large v3 can take 30-60s for long files.
export const maxDuration = 120;

/** Cap audio size at 25 MB (Groq's limit for whisper). */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

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
    key: `transcribe:${apiKey.organizationId}`,
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

  // 3. Parse multipart/form-data ────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_multipart', details: err instanceof Error ? err.message : 'parse_failed' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { error: 'missing_file', details: 'multipart field "file" is required (audio binary)' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const blob = file as Blob;
  if (blob.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: 'file_too_large', details: `Max ${MAX_AUDIO_BYTES / 1024 / 1024} MB`, sizeBytes: blob.size },
      { status: 413, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const filename =
    (formData.get('filename') as string) || 'audio.mp3';
  const language = (formData.get('language') as string) || 'ar'; // Default: Arabic
  const model = (formData.get('model') as string) || undefined;
  const prompt = (formData.get('prompt') as string) || undefined;
  const tokenizeParam = (formData.get('tokenize') as string) === 'true';
  const nerEnabled = (formData.get('nerEnabled') as string) === 'true';

  // 4. Firewall context ──────────────────────────────────────────
  const requestId = nanoid(12);
  const policy = {
    ...DEFAULT_POLICY,
    nerEnabled,
  };

  // 5. Forward to Groq ───────────────────────────────────────────
  let transcription;
  try {
    transcription = await transcribe({
      file: blob,
      filename,
      model,
      language,
      prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_transcribe_error';
    return NextResponse.json(
      { error: 'upstream_transcribe_error', details: message, requestId },
      {
        status: 502,
        headers: {
          'X-Firewall-Request-Id': requestId,
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  // 6. PII detection + redaction on the transcription ───────────
  const ctx = {
    organizationId: apiKey.organizationId,
    userId: apiKey.createdById,
    policy,
    requestId,
  };

  const detections = await detect(transcription.text, ctx);

  // If the caller asked for tokenize, use the vault. Otherwise
  // fall back to the synchronous applyActions (mask/redact/block).
  let result;
  if (tokenizeParam) {
    result = await applyActionsWithVault(
      transcription.text,
      detections,
      policy,
      async (value, type) => {
        return tokenize(value, {
          organizationId: apiKey.organizationId,
          createdById: apiKey.createdById,
          piiType: type,
          ttlSec: 24 * 60 * 60, // 24h
        });
      },
    );
  } else {
    result = applyActions(transcription.text, detections, policy);
  }

  if (result.blocked) {
    // HIGH-03: durable audit for block path. The block IS enforceable
    // (we return 451 regardless), but we MUST have an audit row. If
    // audit fails after retries, we still return 451 — the block is
    // enforced — but the alert fires via logAuditFailure.
    const persistResult = await persistFirewallEventDurable({
      ctx,
      metadata: {
        latencyMs: result.latencyMs,
        piiTypes: uniquePiiTypes(detections),
        detectionCount: detections.length,
        originalTextSha256: sha256Text(transcription.text),
        originalLength: transcription.text.length,
        effectiveAction: 'block',
        model: transcription.model,
        tokensUsed: null,
        blocked: true,
        llmLatencyMs: null,
        notes: `transcribe_blocked:${requestId}`,
      },
    });
    return NextResponse.json(
      {
        error: 'blocked_by_firewall',
        reason: 'PII policy violation in transcription',
        requestId,
        auditOk: persistResult.ok,
      },
      {
        status: 451,
        headers: {
          'X-Firewall-Request-Id': requestId,
          'X-Firewall-Blocked': 'true',
          'X-Firewall-Audit-Failed': persistResult.ok ? 'false' : 'true',
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  // 7. Persist AIRequest + audit log atomically (HIGH-03).
  const persistResult = await persistFirewallEventDurable({
    ctx,
    metadata: {
      latencyMs: result.latencyMs,
      piiTypes: uniquePiiTypes(detections),
      detectionCount: detections.length,
      originalTextSha256: sha256Text(transcription.text),
      originalLength: transcription.text.length,
      effectiveAction: tokenizeParam ? 'tokenize' : 'mask',
      model: transcription.model,
      tokensUsed: null,
      blocked: false,
      llmLatencyMs: null,
      notes: `transcribe:${requestId},duration:${transcription.durationSec ?? 'unknown'}`,
    },
    aiRequest: {
      organization: { connect: { id: apiKey.organizationId } },
      requestedBy: { connect: { id: apiKey.createdById } },
      prompt: `[audio:${filename}, ${blob.size} bytes, ${language}]`,
      response: result.redactedText.slice(0, 8192),
      modelUsed: transcription.model,
      tokensUsed: null,
      piiDetected: detections.length > 0,
      piiTypes: uniquePiiTypes(detections),
      status: 'AUTO_APPROVED',
      riskScore: Math.min(1, 0.1 * detections.length),
      riskLevel: 'LOW',
    },
  });

  if (!persistResult.ok) {
    return NextResponse.json(
      {
        error: 'audit_persistence_failed',
        details: persistResult.error.message,
        code: persistResult.error.code,
        requestId,
      },
      {
        status: 503,
        headers: {
          'X-Firewall-Request-Id': requestId,
          'X-Firewall-Audit-Failed': 'true',
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  // 8. Return ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      text: result.redactedText,
      model: transcription.model,
      language,
      durationSec: transcription.durationSec,
      detections: detections.length,
      piiTypes: uniquePiiTypes(detections),
      tokens: tokenizeParam ? result.tokens : undefined,
      requestId,
      totalLatencyMs: Date.now() - t0,
    },
    {
      headers: {
        'X-Firewall-Request-Id': requestId,
        'X-Firewall-Detections': String(detections.length),
        'X-Firewall-Blocked': 'false',
        'X-Firewall-RateLimit': rl.degraded ? 'degraded' : 'enforced',
        'Cache-Control': 'no-store',
      },
    },
  );
}
