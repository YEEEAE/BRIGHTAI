// Convenience helpers for reading/writing the session cookie inside Astro
// endpoints and pages (APIContext).

import type { APIContext, AstroCookies } from 'astro';
import {
  COOKIE_NAME,
  SESSION_TTL_MS,
  createSession,
  destroySession,
  getSession,
  getUserById,
  isUserDisabled,
  verifyCredentials,
} from './auth';
import { cleanupExpiredSessions } from './db';
import { setFlash } from './flash';
import type { SessionData, User } from './types';

/** Read the current session from the request cookie, if any. */
export function readSession(context: APIContext): SessionData | null {
  const token = context.cookies.get(COOKIE_NAME)?.value;
  return getSession(token);
}

/** Resolve the fully-loaded current user, or null. */
export function getCurrentUser(context: APIContext): User | null {
  const session = readSession(context);
  if (!session) return null;
  return getUserById(session.userId);
}

/** Authenticate a user and set the session cookie. Returns the user or null. */
export function loginAndSetCookie(
  context: APIContext,
  username: string,
  password: string,
): User | null {
  // Purge expired sessions on every login (per spec: no stale rows accumulate).
  cleanupExpiredSessions();
  const user = verifyCredentials(username, password);
  if (!user) return null;
  const token = createSession(user);
  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: Math.round(SESSION_TTL_MS / 1000),
  });
  return user;
}

/** Clear the session cookie and destroy the server-side session. */
export function logoutAndClearCookie(context: APIContext): void {
  const token = context.cookies.get(COOKIE_NAME)?.value;
  destroySession(token);
  context.cookies.delete(COOKIE_NAME, { path: '/' });
}

/** Minimal surface of the middleware/page context needed to log a user in. */
export interface LoginContext {
  request: Request;
  cookies: AstroCookies;
  redirect: (path: string) => Response;
}

/**
 * Handle a self-submitted POST /login form. Parses the form body, verifies
 * credentials, purges expired sessions, sets the session cookie, flashes a
 * welcome message, and redirects to the safe target. Returns a redirect to
 * /login?error=1 on bad credentials.
 */
export async function handleLoginPost(context: LoginContext): Promise<Response> {
  const form = await context.request.formData();
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const rawTarget = String(form.get('redirect') ?? '');
  // Only allow internal redirect targets (blocks open-redirect abuse).
  const safeTarget = rawTarget.startsWith('/') && !rawTarget.startsWith('//') ? rawTarget : '/';

  // Purge expired sessions on every login (per spec).
  cleanupExpiredSessions();

  // Distinct message when the account exists but was deactivated by an admin.
  if (isUserDisabled(username)) {
    return context.redirect(`/login?redirect=${encodeURIComponent(safeTarget)}&disabled=1`);
  }

  const user = verifyCredentials(username, password);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(safeTarget)}&error=1`);
  }

  const token = createSession(user);
  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: Math.round(SESSION_TTL_MS / 1000),
  });
  setFlash(context, 'success', `Welcome back, ${user.full_name}.`);
  return context.redirect(safeTarget);
}
