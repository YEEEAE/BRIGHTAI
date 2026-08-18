// Shared safe-redirect helper. Open-redirect guard: only same-origin relative
// paths are allowed as redirect targets. This also blocks the backslash bypass
// (`/\evil.com` is normalized to `//evil.com` by browsers) and control
// characters, which the bare `startsWith('/')` check misses.

/** Return a safe internal redirect target, or `fallback` when the input is
 *  missing, absolute, protocol-relative, backslash-suffixed, or contains
 *  control characters. */
export function safeRedirectTarget(
  value: string | null | undefined,
  fallback = '/',
): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  // Backslashes and control characters (CR/LF/tab) are never valid in an
  // internal path and can be normalized into an external URL by browsers.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}