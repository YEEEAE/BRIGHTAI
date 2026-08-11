/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * GET /api/firewall/health
 *
 * Public health check (no auth). Reports:
 *   - detector status (regex version, NER loaded or not)
 *   - LLM provider configured (GROQ_API_KEY)
 *   - rate limit storage (Redis connected or in-memory fallback)
 *   - last audit log hash (for tamper-evidence verification)
 *
 * Used by:
 *   - Render health checks
 *   - smoke tests in CI
 *   - dashboard "system status" widget
 */

import { NextResponse } from 'next/server';
import { dbServiceRole } from '@brightai/db';
import { REGEX_VERSION, REGEX_SUPPORTED_TYPES } from '@/lib/firewall/detectors/regex';
import { isNerReady, NER_MODEL_ID } from '@/lib/firewall/detectors/ner';
import { isGroqConfigured } from '@/lib/firewall/llm/groq-client';
import { verifyChain } from '@/lib/firewall/audit/hashchain';
import { getRateLimitRedisStatus } from '@/lib/firewall/ratelimit/redis-bucket';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthBody {
  status: 'ok' | 'degraded' | 'down';
  service: '@brightai/firewall-layer-1';
  layer: 1;
  version: string;
  uptimeSec: number;
  detectors: {
    regex: { version: string; types: string[] };
    ner: { enabled: boolean; model: string; loaded: boolean };
  };
  llm: { groqConfigured: boolean; defaultModel: string };
  rateLimit: {
    /** 'redis' when Redis is up and the unified bucket is in use. */
    backend: 'redis' | 'memory';
    /** True when the rate limiter has degraded to the per-process fallback. */
    degraded: boolean;
  };
  audit: { lastOrgHash: string | null; verified: boolean };
  timestamp: string;
}

export async function GET() {
  const startedAt = Date.now();

  // Sample one org to confirm the audit table is reachable.
  let lastOrgHash: string | null = null;
  let verified = false;
  try {
    const sample = await dbServiceRole.organization.findFirst({
      where: { deletedAt: null },
      select: { id: true },
    });
    if (sample) {
      const v = await verifyChain(sample.id);
      lastOrgHash = v.ok ? 'ok' : `BROKEN_AT:${v.firstFailure?.id ?? 'unknown'}`;
      verified = v.ok;
    } else {
      lastOrgHash = 'no_orgs';
      verified = true;
    }
  } catch {
    lastOrgHash = null;
    verified = false;
  }

  const rlStatus = getRateLimitRedisStatus();

  const body: HealthBody = {
    status: verified ? 'ok' : 'degraded',
    service: '@brightai/firewall-layer-1',
    layer: 1,
    version: REGEX_VERSION,
    uptimeSec: Math.round(process.uptime()),
    detectors: {
      regex: { version: REGEX_VERSION, types: REGEX_SUPPORTED_TYPES },
      ner: {
        enabled: process.env.FIREWALL_NER_ENABLED !== 'false',
        model: NER_MODEL_ID,
        loaded: isNerReady(),
      },
    },
    llm: {
      groqConfigured: isGroqConfigured(),
      defaultModel:
        process.env.GROQ_MODEL || process.env.GROQ_DEFAULT_MODEL || 'llama-3.3-70b-versatile',
    },
    rateLimit: rlStatus,
    audit: { lastOrgHash, verified },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: body.status === 'down' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
