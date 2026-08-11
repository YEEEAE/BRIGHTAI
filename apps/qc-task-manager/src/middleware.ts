// Auth guard middleware for QC Task Manager.
// - Public (no session required): "/", "/login", Astro static assets.
// - All other routes require an active session; anonymous requests are sent to
//   /login with a `redirect` param so they return where they came from.
// - Role-specific prefixes (/admin, /manager, /supervisor, /dashboard) are
//   enforced here before the page renders, redirecting to the user's role home
//   with a one-shot flash message when access is denied.
// - The resolved session user (or null) is attached to context.locals.user for
//   every route so pages/components never re-parse the cookie.
// - EVERY response (pages, redirects, API JSON, static assets) is passed
//   through withSecurityHeaders() before leaving the server: X-Frame-Options
//   DENY, X-Content-Type-Options nosniff, Referrer-Policy.
//
// All role decisions come from src/lib/permissions.ts — no scattered role
// checks in this file.

import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { getSessionUser } from './lib/auth';
import { setFlash } from './lib/flash';
import {
  canAccessManagerArea,
  canAccessSupervisorArea,
  PERMISSIONS,
  roleHome,
} from './lib/permissions';
import { handleLoginPost } from './lib/session';
import { handleCreateTaskPost } from './lib/tasks';
import { requireCsrf } from './lib/api-security';

const PUBLIC_PATHS = new Set(['/', '/login']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Astro generated static assets
  if (pathname.startsWith('/_astro/')) return true;
  return false;
}

/**
 * Attach security headers to a Response. Applied to EVERY outgoing response
 * (pages, redirects, API endpoints) — never skip. Headers are set on a copy so
 * both Astro's response and redirected responses get them uniformly.
 */
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  // DENY: the app is an internal tool — it must never be framed.
  headers.set('X-Frame-Options', 'DENY');
  // nosniff: browsers must not MIME-sniff (protects the attachment downloads
  // and any API responses from content-type confusion).
  headers.set('X-Content-Type-Options', 'nosniff');
  // Trim referrer leakage to same-origin.
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // The internal application ships only self-hosted Astro assets. Keep this
  // conservative CSP compatible with the current React islands and downloads.
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; media-src 'self'; worker-src 'self' blob:",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * The actual request handler. Every `return` path is a Response; the exported
 * onRequest wraps the result with withSecurityHeaders so no branch can
 * accidentally skip the headers.
 */
async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const { pathname } = context.url;
  const user = getSessionUser(context.request);

  // Always attach the resolved user to locals (null when anonymous), so public
  // pages (e.g. "/") can redirect signed-in users to their role home.
  context.locals.user = user;

  // POST /login — self-submitting auth form. Astro 6 has no named request
  // handlers for .astro pages, so the middleware short-circuits the request
  // (the built-in same-origin/CSRF check has already run before us).
  if (pathname === '/login' && context.request.method === 'POST') {
    const csrf = requireCsrf(context);
    if (csrf) return csrf;
    return handleLoginPost(context);
  }

  // Public routes: render without requiring a session.
  if (isPublic(pathname)) return next();

  // Authenticated wall: everything else requires an active session.
  if (!user) {
    const dest = pathname === '/logout' ? '/' : pathname + context.url.search;
    return context.redirect(`/login?redirect=${encodeURIComponent(dest)}`);
  }

  // /dashboard — employees have no dashboard (CORE BUSINESS RULE #1).
  // Redirect + flash so the user understands why they were bounced.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!PERMISSIONS.canViewDashboard(user.role)) {
      setFlash(context, 'error', 'You do not have permission to access the dashboard.');
      return context.redirect(roleHome(user.role));
    }
  }

  // /admin/* — admin only.
  if (pathname.startsWith('/admin')) {
    if (!PERMISSIONS.canManageUsers(user.role)) {
      setFlash(context, 'error', 'You do not have permission to access the admin area.');
      return context.redirect(roleHome(user.role));
    }
  }

  // /manager/* — manager + admin.
  if (pathname.startsWith('/manager')) {
    if (!canAccessManagerArea(user.role)) {
      setFlash(context, 'error', 'You do not have permission to access the manager area.');
      return context.redirect(roleHome(user.role));
    }
  }

  // /supervisor/* — supervisor + manager + admin.
  if (pathname.startsWith('/supervisor')) {
    if (!canAccessSupervisorArea(user.role)) {
      setFlash(context, 'error', 'You do not have permission to access the supervisor area.');
      return context.redirect(roleHome(user.role));
    }
  }

  // "New task" form submissions. Astro 6 pages have no named request handlers,
  // so the middleware short-circuits the POST (same pattern as POST /login).
  // The route guards above have already confirmed the user may access this
  // area; handleCreateTaskPost re-checks canCreateTask + assignment scope.
  if (context.request.method === 'POST') {
    if (pathname === '/manager/new' || pathname === '/supervisor/new') {
      return handleCreateTaskPost(context, { assignmentScope: 'all' });
    }
    if (pathname === '/employee/new') {
      return handleCreateTaskPost(context, { assignmentScope: 'self' });
    }
  }

  // /employee/* — any authenticated role may view the employee view.
  return next();
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await handle(context, next);
  return withSecurityHeaders(response);
});
