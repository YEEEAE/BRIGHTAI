// POST /logout — destroy session, clear the cookie, and redirect to login.
import type { APIRoute } from 'astro';
import { setFlash } from '../lib/flash';
import { logoutAndClearCookie } from '../lib/session';
import { requireCsrf } from '../lib/api-security';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  logoutAndClearCookie(context);
  setFlash(context, 'info', 'You have been signed out.');
  return context.redirect('/login');
};
