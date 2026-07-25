/**
 * src/pages/api/health.ts — KERNEL-AUDIT-2026-07-15-BATCH-10 (EXEC-17)
 *                    + BAI-DEPLOY-11 (2026-07-25) — build identity in JSON.
 *
 * Lightweight health check endpoint for Render's healthCheckPath.
 *
 * Behavior:
 *  - GET /api/health/ → 200 { ok, status, commit, buildTime, ts, uptime, service }
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
 * BAI-DEPLOY-11 — build identity in the response:
 *  The `commit` and `buildTime` fields are populated from
 *  process.env.BRIGHTAI_BUILD_COMMIT / BRIGHTAI_BUILD_TIME, which the
 *  patched server chunk sets at module load (see
 *  scripts/patch-server-entry.mjs). This lets a post-deploy gate
 *  (scripts/verify-post-deploy.mjs) verify that the live build matches
 *  the expected git SHA by parsing the JSON — no need to parse headers.
 *
 *  In local dev (where the patcher hasn't run), the env vars are unset;
 *  we fall back to "dev" so the response shape is stable.
 *
 * Astro routes:
 *  - prerender = false → server-side rendered (not prerendered HTML)
 *  - listed in render.yaml's healthCheckPath
 *  - excluded from sitemap (filter: !page.includes('/api/'))
 */

import type { APIRoute } from 'astro';

export const prerender = false;

const SERVER_START_TS = Date.now();

/**
 * Read the build identity stamped by the patched server chunk.
 * Returns { commit, buildTime } — falls back to "dev" in local dev.
 */
function readBuildIdentity() {
  return {
    commit: (typeof process !== 'undefined' && process.env && process.env.BRIGHTAI_BUILD_COMMIT) || 'dev',
    buildTime: (typeof process !== 'undefined' && process.env && process.env.BRIGHTAI_BUILD_TIME) || 'dev',
  };
}

export const GET: APIRoute = async () => {
  const now = Date.now();
  const uptimeSec = Math.round((now - SERVER_START_TS) / 1000);
  const { commit, buildTime } = readBuildIdentity();
  return new Response(
    JSON.stringify({
      ok: true,
      status: 'healthy',
      commit,
      buildTime,
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
