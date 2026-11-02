import type { APIRoute } from 'astro';
import { operationalHealth } from '../../../../server/kernel/service.mjs';
export const prerender = false;
// Anonymous liveness: returns setup-state codes only, never configuration values or connection details.
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };
export const GET: APIRoute = async () => {
  try {
    const result = await operationalHealth();
    return Response.json(result, { headers, status: result.state === 'blocked' ? 503 : 200 });
  } catch {
    return Response.json({ status: 'degraded', state: 'degraded', errorType: 'HEALTH_CHECK_FAILED', updatedAt: new Date().toISOString(), configuration: { auth: 'UNKNOWN', database: 'UNKNOWN' }, checks: { auth: 'UNKNOWN', database: 'DB_UNAVAILABLE', schema: 'NOT_CHECKED', administration: 'NOT_CHECKED' } }, { headers, status: 503 });
  }
};
