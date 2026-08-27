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
  verifyCredentials,
} from './auth';
import { cleanupExpiredSessions } from './db';
import { changeOwnPassword } from './auth';
import { setFlash } from './flash';
import { roleHome } from './permissions';
import { safeRedirectTarget } from './redirect';
import { parseFormData, loginInputSchema, passwordChangeSchema } from './validation';
import type { SessionData, User } from './types';

/** Secure cookies follow the actual request scheme, not the build mode.
 *  `x-forwarded-proto` is only trusted when the app is explicitly deployed
 *  behind a trusted reverse proxy (TRUST_PROXY=1) — otherwise a directly
 *  exposed server would accept a client-supplied header as fact. */
function isSecureRequest(context: { request: Request; url?: URL }): boolean {
  if (context.url?.protocol === 'https:') return true;
  const proxyTrusted = process.env.TRUST_PROXY === '1';
  if (proxyTrusted) {
    return context.request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https';
  }
  return false;
}

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

/** Authenticate a user and set the session cookie. Returns the user or null
 * (bad credentials, disabled, or currently locked). */
export function loginAndSetCookie(
  context: APIContext,
  username: string,
  password: string,
): User | null {
  // Purge expired sessions on every login (per spec: no stale rows accumulate).
  cleanupExpiredSessions();
  const result = verifyCredentials(username, password, context.clientAddress);
  if (result.status !== 'ok') return null;
  const user = result.user;
  const token = createSession(user);
  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(context),
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
  /** Client IP (Astro's context.clientAddress) — recorded in login_attempts. */
  clientAddress?: string;
}

/**
 * Handle a self-submitted POST /login form. Parses the form body, verifies
 * credentials, purges expired sessions, sets the session cookie, flashes a
 * welcome message, and redirects to the safe target. Returns a redirect to
 * /login?error=1 on bad credentials.
 */
export async function handleLoginPost(context: LoginContext): Promise<Response> {
  const form = await context.request.formData();
  const rawTarget = String(form.get('redirect') ?? '');
  // Only allow internal redirect targets (blocks open-redirect abuse, including
  // the backslash normalization bypass used by browsers).
  const safeTarget = safeRedirectTarget(rawTarget, '/');

  // Shape validation via Zod (src/lib/validation.ts). An empty/malformed body
  // is treated exactly like bad credentials — no user enumeration.
  const parsed = parseFormData(loginInputSchema, form);
  if (!parsed.ok) {
    return context.redirect(`/login?redirect=${encodeURIComponent(safeTarget)}&error=1`);
  }
  const { username, password } = parsed.data;

  // Purge expired sessions on every login (per spec).
  cleanupExpiredSessions();

  // verifyCredentials returns a richer result: bad credentials, or a locked
  // account (5 consecutive failures → 10-minute lock, per spec).
  const result = verifyCredentials(username, password, context.clientAddress);
  if (result.status === 'locked' || result.status === 'invalid') {
    return context.redirect(`/login?redirect=${encodeURIComponent(safeTarget)}&error=1`);
  }
  const user = result.user;

  const token = createSession(user);
  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(context),
    path: '/',
    maxAge: Math.round(SESSION_TTL_MS / 1000),
  });

  // First-login password lifecycle: an account whose current password was set
  // by an admin/seeder is sent straight to the password-change flow instead of
  // its normal destination. The middleware gate keeps the rest of the app
  // unreachable for this session until the change completes.
  if (user.must_change_password) {
    setFlash(context, 'info', 'For security, set your own password before continuing.');
    return context.redirect('/account/security');
  }

  setFlash(context, 'success', `Welcome back, ${user.full_name}.`);
  return context.redirect(safeTarget);
}

/**
 * Handle the self-submitted POST /account/security form (self-service password
 * change). Requires an authenticated session; the middleware runs the same
 * CSRF gate used by the other form endpoints before dispatching here.
 *
 * On success the current session SURVIVES (requirement: keep the session or
 * replace it safely — the existing implementation keeps the opaque token) and
 * every OTHER session for the user is destroyed inside changeOwnPassword.
 * Password values are never logged; flash/redirect targets carry no secrets.
 */
export async function handlePasswordChangePost(context: APIContext): Promise<Response> {
  const session = readSession(context);
  if (!session) {
    return context.redirect('/login?redirect=%2Faccount%2Fsecurity');
  }

  const form = await context.request.formData();
  const parsed = parseFormData(passwordChangeSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect('/account/security');
  }

  const token = context.cookies.get(COOKIE_NAME)?.value;
  const result = changeOwnPassword(
    session.userId,
    parsed.data.currentPassword,
    parsed.data.newPassword,
    token,
  );
  if (!result.ok) {
    setFlash(context, 'error', result.error);
    return context.redirect('/account/security');
  }

  setFlash(context, 'success', 'Password updated. All other sessions were signed out.');
  return context.redirect(roleHome(session.role));
}
