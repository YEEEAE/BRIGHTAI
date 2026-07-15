/**
 * src/pages/api/csrf-token.ts — CSRF-LEAD-001 (2026-07-15)
 *
 * GET /api/csrf-token/ — يرجّع CSRF token جديد + Set-Cookie.
 *
 * Usage from client:
 *   const { token } = await fetch('/api/csrf-token/').then(r => r.json());
 *   // الـ cookie ضبط تلقائياً من الـ Set-Cookie response header
 *   fetch('/api/lead/', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
 *     body: JSON.stringify(...),
 *   });
 *
 * Security:
 *  - Cookie: csrf=<token>; Path=/; SameSite=Strict; Secure; Max-Age=3600
 *    - SameSite=Strict: cookie ما ينرسل cross-site (defense in depth)
 *    - Secure: HTTPS only
 *    - HttpOnly=false: الـ client يحتاج يقرأ الـ token عشان يضعه في الـ header
 *      (double-submit pattern). الـ token نفسه ما يـ leak لأن SameSite=Strict
 *      يمنع الـ attacker من قراءته.
 *  - Body: { token: '...' } — الـ client يستخدم هذا للـ header.
 *  - Cache-Control: no-store — الـ token لازم يكون fresh.
 *
 * Caching:
 *  - `Cache-Control: no-store` — كل request يولّد token جديد.
 *  - هذا overhead مقبول (~1ms) عشان نضمن freshness.
 *
 * Errors:
 *  - 500 لو CSRF_SECRET مو مضبوط في env.
 */

import type { APIRoute } from 'astro';
import { generateCsrfToken, CSRF_COOKIE_NAME, CSRF_TTL_MS } from '../../lib/csrf';

export const prerender = false;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export const GET: APIRoute = async () => {
  let token: string;
  try {
    token = generateCsrfToken();
  } catch (err) {
    // CSRF_SECRET مو مضبوط — فشل صريح (لا silent).
    // eslint-disable-next-line no-console
    console.error('[csrf-token] CSRF_SECRET not configured:', err);
    return jsonResponse(
      { error: 'server_misconfigured', message: 'CSRF_SECRET is not configured.' },
      500,
    );
  }

  // بناء الـ Set-Cookie header.
  // ملاحظة: Secure flag يفترض إن الطلب جاي عبر HTTPS. لو Render يستخدم
  // Cloudflare proxy (الوضع الحالي)، الـ trust proxy headers يضمن إن
  // secure connections تشتغل حتى لو الـ internal connection HTTP.
  const cookieParts = [
    `${CSRF_COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${Math.floor(CSRF_TTL_MS / 1000)}`,
    'SameSite=Strict',
    'Secure',
  ];
  // HttpOnly=false (default للـ cookies) — الـ client يقرأه عبر document.cookie.
  // آمن لأن SameSite=Strict يضمن إن الـ cookie ما ينرسل cross-origin.

  return jsonResponse(
    { token },
    200,
    { 'Set-Cookie': cookieParts.join('; ') },
  );
};

// Method handlers
export const POST: APIRoute = async () =>
  jsonResponse({ error: 'method_not_allowed', allowed: ['GET'] }, 405);

export const PUT: APIRoute = async () =>
  jsonResponse({ error: 'method_not_allowed', allowed: ['GET'] }, 405);

export const DELETE: APIRoute = async () =>
  jsonResponse({ error: 'method_not_allowed', allowed: ['GET'] }, 405);