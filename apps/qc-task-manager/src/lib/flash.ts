// One-shot "flash" messages surfaced after a redirect (login, role guard,
// form errors). Stored in a short-lived readable cookie, consumed once
// by the next page render.

import type { AstroCookies } from 'astro';

const FLASH_COOKIE = 'qc_flash';

export interface Flash {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const VALID_TYPES = new Set(['success', 'error', 'info', 'warning']);

/** Anything that exposes the Astro cookies API (context, page, component). */
interface CookieJar {
  cookies: AstroCookies;
}

/** Set a one-shot flash message delivered on the next response. */
export function setFlash(ctx: CookieJar, type: Flash['type'], message: string): void {
  ctx.cookies.set(FLASH_COOKIE, JSON.stringify({ type, message }), {
    httpOnly: true,
    sameSite: 'lax',
    // import.meta.env is undefined under the plain Node test runner — treat
    // that as non-production so flash stays usable in server-less tests.
    secure: import.meta.env?.PROD === true,
    path: '/',
    maxAge: 60,
  });
}

/** Read and consume a flash message. Returns null when none is pending. */
export function consumeFlash(ctx: CookieJar): Flash | null {
  const raw = ctx.cookies.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  ctx.cookies.delete(FLASH_COOKIE, { path: '/' });
  try {
    const parsed = JSON.parse(raw) as Partial<Flash>;
    if (typeof parsed?.message === 'string' && typeof parsed?.type === 'string' && VALID_TYPES.has(parsed.type)) {
      return { type: parsed.type as Flash['type'], message: parsed.message };
    }
  } catch {
    // ignore malformed flash payloads
  }
  return null;
}
