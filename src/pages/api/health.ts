/**
 * src/pages/api/health.ts — KERNEL-AUDIT-2026-07-15-BATCH-10 (EXEC-17)
 *
 * Lightweight health check endpoint for Render's healthCheckPath.
 *
 * Behavior:
 *  - GET /api/health/ → 200 { ok: true, ts: "<iso>", uptime: <seconds> }
 *  - No auth required (Render's internal health checker)
 *  - No external calls (Groq/Gemini/DB) — pure Node runtime
 *  - Responds in <50ms
 *
 * Why this exists:
 *  Render's default health check hits `/`, which is a prerendered static
 *  HTML page. If the Node SSR server is down but static files still serve,
 *  the health check falsely reports "healthy". Adding a real health endpoint
 *  that requires the Node process lets Render detect actual SSR outages.
 *
 * Astro routes:
 *  - prerender = false → server-side rendered (not prerendered HTML)
 *  - listed in render.yaml's healthCheckPath
 *  - excluded from sitemap (filter: !page.includes('/api/'))
 */

import type { APIRoute } from 'astro';

export const prerender = false;

const SERVER_START_TS = Date.now();

export const GET: APIRoute = async () => {
  const now = Date.now();
  const uptimeSec = Math.round((now - SERVER_START_TS) / 1000);
  return new Response(
    JSON.stringify({
      ok: true,
      ts: new Date(now).toISOString(),
      uptime: uptimeSec,
      service: 'brightai-kernel',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    },
  );
};

// Other HTTP methods → 405 (don't waste cycles on POST/PUT/DELETE)
export const POST: APIRoute = async () =>
  new Response(JSON.stringify({ error: 'method_not_allowed', allowed: ['GET'] }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const PUT: APIRoute = async () =>
  new Response(JSON.stringify({ error: 'method_not_allowed', allowed: ['GET'] }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const DELETE: APIRoute = async () =>
  new Response(JSON.stringify({ error: 'method_not_allowed', allowed: ['GET'] }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });