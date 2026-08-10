// Auth guard middleware for QC Task Manager.
// - Public (no session required): "/", "/login", "/api/login", static assets.
//   Anonymous users see the landing page at "/"; signed-in users are redirected
//   to their role home by the page itself.
// - All other routes require an active session.
// - Role-specific prefixes (e.g. /admin, /manager, /dashboard) are enforced here
//   so the guard runs before the page renders.

import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, getSession } from './lib/auth';
import { canViewDashboard, canManageUsers } from './lib/permissions';

const PUBLIC_PATHS = new Set(['/', '/login', '/api/login']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // static-ish well-known endpoints
  if (pathname.startsWith('/_astro/')) return true;
  return false;
}

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const token = context.cookies.get(COOKIE_NAME)?.value;
  const session = getSession(token);

  // Always attach the session to locals when present (even on public routes,
  // so the landing page can redirect signed-in users to their role home).
  if (session) {
    context.locals.session = session;
  }

  // Public routes: render without requiring a session.
  if (isPublic(pathname)) return next();

  if (!session) {
    // Redirect to login, remembering where to come back to.
    const dest = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/login?redirect=${dest}`);
  }

  // Attach session to locals for downstream pages/endpoints.
  context.locals.session = session;

  // Role-scoped route protection.
  // /dashboard — employees have no dashboard (CORE BUSINESS RULE #1).
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!canViewDashboard(session.role)) {
      return context.redirect('/employee');
    }
  }

  // /admin/* — admin only.
  if (pathname.startsWith('/admin')) {
    if (!canManageUsers(session.role)) {
      return context.redirect('/');
    }
  }

  // /manager/* — manager + admin.
  if (pathname.startsWith('/manager')) {
    if (session.role !== 'manager' && session.role !== 'admin') {
      return context.redirect('/');
    }
  }

  // /supervisor/* — supervisor + manager + admin.
  if (pathname.startsWith('/supervisor')) {
    if (!['supervisor', 'manager', 'admin'].includes(session.role)) {
      return context.redirect('/');
    }
  }

  // /employee/* — any role can view (managers/supervisors may also browse the employee view).
  return next();
});
