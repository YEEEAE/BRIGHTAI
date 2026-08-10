// POST /logout — destroy session, clear the cookie, and redirect to login.
import type { APIRoute } from 'astro';
import { setFlash } from '../lib/flash';
import { logoutAndClearCookie } from '../lib/session';

export const POST: APIRoute = async (context) => {
  logoutAndClearCookie(context);
  setFlash(context, 'info', 'You have been signed out.');
  return context.redirect('/login');
};
