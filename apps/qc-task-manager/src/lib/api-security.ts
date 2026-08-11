// Shared, server-side security gates for API routes. Middleware is a useful
// outer wall, but endpoints call these helpers themselves so an adapter or
// future routing change cannot accidentally expose an API handler.

import type { APIContext } from 'astro';
import { getCurrentUser } from './session';
import type { User } from './types';

export function apiJsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Resolve the authoritative user from the persisted server session. */
export function requireApiUser(context: APIContext): User | Response {
  const user = getCurrentUser(context);
  return user ?? apiJsonError('Not authenticated.', 401);
}

/**
 * CSRF gate for unsafe API methods. Astro also performs its own protection for
 * form requests; this explicit check protects handlers if that configuration
 * changes and makes the API contract independently auditable.
 */
export function requireCsrf(context: APIContext): Response | null {
  const origin = context.request.headers.get('origin');
  if (origin === context.url.origin) return null;
  return apiJsonError('Invalid request origin.', 403);
}

export function isResponse(value: User | Response): value is Response {
  return value instanceof Response;
}
