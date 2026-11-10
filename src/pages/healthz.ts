import type { APIRoute } from 'astro';
import { readiness } from '../server/kernel/readiness.mjs';

// Public readiness for the Node SSR service. It is intentionally outside /app so
// a platform health checker gets a dependency answer even while the portal gate
// is closed. It returns states and identifiers only: no connection string, no
// key, no role name, no driver message.
export const prerender = false;

const headers = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

// A failed check must be a 503 answer, never an unhandled exception: the
// platform needs a status code it can act on.
async function evaluate() {
  try {
    const result = await readiness();
    return { result, status: result.state === 'ready' ? 200 : 503 };
  } catch {
    return {
      result: { schema: 1, status: 'not_ready', state: 'unavailable', errorType: 'READINESS_CHECK_FAILED', checkedAt: new Date().toISOString() },
      status: 503,
    };
  }
}

export const GET: APIRoute = async () => {
  const { result, status } = await evaluate();
  return Response.json(result, { headers, status });
};

// HEAD is supported explicitly so a checker that probes headers cannot fall
// through to a 404 or to a rendered page.
export const HEAD: APIRoute = async () => {
  const { status } = await evaluate();
  return new Response(null, { headers, status });
};
