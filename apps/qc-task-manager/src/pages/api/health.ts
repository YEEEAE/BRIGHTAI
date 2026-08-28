// GET /api/health — public liveness probe for orchestrators (Render).
//
// This intentionally proves only that the SSR process can serve requests.
// On a first Render deployment, a strict SQLite check here prevents the app
// from ever receiving the first login request that initializes its database.
// Database readiness is exposed separately at /api/readiness for operators
// and monitoring after the service is live.

import type { APIRoute } from 'astro';

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const GET: APIRoute = () => {
  return json(200, { ok: true, service: 'qc-task-manager', status: 'healthy', live: true });
};
