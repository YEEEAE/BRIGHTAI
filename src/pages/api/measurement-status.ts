import type { APIRoute } from 'astro';
import { env } from '../../server/kernel/env.mjs';
export const prerender = false;
// Public boolean only: no credentials, approval documents, tenant or session.
export const GET: APIRoute = () => new Response(JSON.stringify({
  enabled: env('AIGAS_MONITORING_KILL_SWITCH') !== 'true' && env('AIGAS_GA4_KILL_SWITCH') !== 'true',
}), {headers: {
  'Content-Type':'application/json', 'Cache-Control':'no-store',
  'CDN-Cache-Control':'no-store', 'Cloudflare-CDN-Cache-Control':'no-store',
  'X-Robots-Tag':'noindex, nofollow',
}});
