// Convenience helpers for reading/writing the session cookie inside Astro
// endpoints and pages (APIContext).

import type { APIContext } from 'astro';
import {
  COOKIE_NAME,
  createSession,
  destroySession,
  getSession,
  getUserById,
  verifyCredentials,
} from './auth';
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
  const user = verifyCredentials(username, password);
  if (!user) return null;
  const token = createSession(user);
  context.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return user;
}

/** Clear the session cookie and destroy the server-side session. */
export function logoutAndClearCookie(context: APIContext): void {
  const token = context.cookies.get(COOKIE_NAME)?.value;
  destroySession(token);
  context.cookies.delete(COOKIE_NAME, { path: '/' });
}
