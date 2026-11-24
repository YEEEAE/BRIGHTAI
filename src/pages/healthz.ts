import type { APIRoute } from 'astro';
import { healthResponse } from '../server/kernel/health-endpoint.mjs';

// Public readiness for the Node SSR service. It is intentionally outside /app so
// a platform health checker gets a dependency answer even while the portal gate
// is closed. The response contract lives in health-endpoint.mjs: fixed keys,
// states only, never a connection string, key, role name or driver message.
export const prerender = false;

export const GET: APIRoute = async () => healthResponse('GET');

// HEAD is supported explicitly so a checker that probes headers cannot fall
// through to a 404, a redirect or a rendered page.
export const HEAD: APIRoute = async () => healthResponse('HEAD');
