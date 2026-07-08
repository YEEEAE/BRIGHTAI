/**
 * @brightai/dashboard — /api/health
 *
 * Public health check. Returns:
 *   - 200 if the app + db are reachable
 *   - 503 if db is unreachable
 *
 * Used by:
 *   - Render health checks
 *   - Smoke tests in CI
 *   - Phase 0 verification script
 */

import { NextResponse } from 'next/server';
import { dbServiceRole } from '@brightai/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await dbServiceRole.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const body = {
    status: dbOk ? 'ok' : 'degraded',
    service: '@brightai/dashboard',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    responseTimeMs: Date.now() - startedAt,
    checks: {
      db: {
        ok: dbOk,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
    },
  };

  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
