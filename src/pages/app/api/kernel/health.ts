import type { APIRoute } from 'astro';
import { operationalHealth } from '../../../../server/kernel/service.mjs';
export const prerender = false;
// Anonymous liveness: returns setup-state codes only, never configuration values or connection details.
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };
export const GET: APIRoute = async () => {
  try {
    return Response.json(await operationalHealth(), { headers });
  } catch {
    return Response.json({ status: 'degraded', checks: { auth: 'UNKNOWN', database: 'DB_UNAVAILABLE', schema: 'NOT_CHECKED' } }, { headers, status: 503 });
  }
};
