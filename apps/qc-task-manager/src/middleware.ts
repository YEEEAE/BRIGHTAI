// Auth guard middleware for QC Task Manager.
// - Public (no session required): "/", "/login", Astro static assets.
// - All other routes require an active session; anonymous requests are sent to
//   /login with a `redirect` param so they return where they came from.
// - Role-specific prefixes (/admin, /manager, /supervisor, /dashboard) are
//   enforced here before the page renders, redirecting to the user's role home
//   with a one-shot flash message when access is denied.
// - The resolved session user (or null) is attached to context.locals.user for
//   every route so pages/components never re-parse the cookie.

import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';
import { setFlash } from './lib/flash';
import { canManageUsers, canViewDashboard, roleHome } from './lib/permissions';
import { handleLoginPost } from './lib/session';

const PUBLIC_PATHS = new Set(['/', '/login']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Astro generated static assets
  if (pathname.startsWith('/_astro/')) return true;
  return false;
}

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const user = getSessionUser(context.request);

  // Always attach the resolved user to locals (null when anonymous), so public
  // pages (e.g. "/") can redirect signed-in users to their role home.
  context.locals.user = user;

  // POST /login — self-submitting auth form. Astro 6 has no named request
  // handlers for .astro pages, so the middleware short-circuits the request
  // (the built-in same-origin/CSRF check has already run before us).
  if (pathname === '/login' && context.request.method === 'POST') {
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
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!canViewDashboard(user.role)) {
      return context.redirect(roleHome(user.role));
    }
  }

  // /admin/* — admin only.
  if (pathname.startsWith('/admin')) {
    if (!canManageUsers(user.role)) {
      setFlash(context, 'error', 'You do not have permission to access the admin area.');
      return context.redirect(roleHome(user.role));
    }
  }

  // /manager/* — manager + admin.
  if (pathname.startsWith('/manager')) {
    if (user.role !== 'manager' && user.role !== 'admin') {
      setFlash(context, 'error', 'You do not have permission to access the manager area.');
      return context.redirect(roleHome(user.role));
    }
  }

  // /supervisor/* — supervisor + manager + admin.
  if (pathname.startsWith('/supervisor')) {
    if (!['supervisor', 'manager', 'admin'].includes(user.role)) {
      setFlash(context, 'error', 'You do not have permission to access the supervisor area.');
      return context.redirect(roleHome(user.role));
    }
  }

  // /employee/* — any authenticated role may view the employee view.
  return next();
});
