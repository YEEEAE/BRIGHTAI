// POST /logout — destroy session and redirect to login.
import type { APIRoute } from 'astro';
import { logoutAndClearCookie } from '../lib/session';

export const POST: APIRoute = async (context) => {
  logoutAndClearCookie(context);
  return context.redirect('/login');
};
