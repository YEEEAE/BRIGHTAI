/**
 * src/lib/ip.ts — KERNEL-AUDIT-2026-07-15-BATCH-8 (EXEC-13)
 *
 * Shared client IP extraction helper for SSR endpoints. Used by:
 *   - src/pages/api/ai/chat.ts (rate limit per IP)
 *   - src/pages/api/lead.ts (rate limit per IP + lead hashing)
 *
 * Problem (KRN-013):
 *   The previous inline getClientIp() in both chat.ts and lead.ts took the
 *   LEFTMOST entry from `x-forwarded-for`, which is client-controlled.
 *   RFC 7239 + the de-facto XFF convention is to count from the RIGHT by
 *   the number of trusted reverse proxies.
 *
 * Solution:
 *   - Take the rightmost entry from XFF, counting back by TRUSTED_PROXY_COUNT
 *     (default 1 for Render's single front proxy).
 *   - Falls back to `x-real-ip` if XFF is absent (and TRUSTED_PROXY_COUNT=0).
 *   - Returns 'unknown' as a last resort (matches prior behavior).
 *
 * Env vars (set in Render dashboard):
 *   - TRUSTED_PROXY_COUNT (number, default 1): how many proxies to trust
 *     between the client and the app. Render adds 1 XFF entry at the right,
 *     so TRUSTED_PROXY_COUNT=1 means trust only the rightmost.
 *   - TRUST_PROXY_DEPTH (alias, optional): same meaning, alternative name.
 */

export interface ClientIpOptions {
  /** Number of trusted reverse proxies between client and server. Default: 1 */
  trustedProxyCount?: number;
}

/**
 * Extract client IP from request headers. Trusts the rightmost N entries
 * of XFF (where N = trustedProxyCount), falls back to x-real-ip, then
 * returns 'unknown'.
 */
export function getClientIp(req: Request, opts: ClientIpOptions = {}): string {
  const trustedProxyCount = opts.trustedProxyCount ?? 1;

  // 1. Try x-forwarded-for (comma-separated, client → proxy1 → proxy2 → ...)
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      // Take the entry at index (length - trustedProxyCount), clamped to [0, length-1]
      // Example: "1.2.3.4, 10.0.0.1" with trustedProxyCount=1 → "10.0.0.1"
      // Example: "1.2.3.4, 10.0.0.1, 10.0.0.2" with trustedProxyCount=2 → "10.0.0.1"
      const idx = Math.max(0, parts.length - trustedProxyCount);
      return parts[idx];
    }
  }

  // 2. Fallback to x-real-ip (single proxy convention)
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  // 3. Last resort: no IP available
  return 'unknown';
}