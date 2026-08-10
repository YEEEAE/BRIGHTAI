// POST /api/login — verify credentials, set cookie, redirect.
import type { APIRoute } from 'astro';
import { loginAndSetCookie } from '../../lib/session';

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const redirectTarget = String(form.get('redirect') || '/');

  const user = loginAndSetCookie(context, username, password);
  if (!user) {
    return context.redirect('/login?error=1');
  }

  // Safe redirect: only allow relative paths.
  const safe = redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
    ? redirectTarget
    : '/';
  return context.redirect(safe);
};
