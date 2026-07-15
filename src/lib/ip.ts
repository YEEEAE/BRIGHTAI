/**
 * src/lib/ip.ts — KRN-013 (EXEC-13)
 *
 * Shared client IP extraction helper for SSR endpoints. Used by:
 *   - src/pages/api/ai/chat.ts (rate limit per IP)
 *   - src/pages/api/lead.ts  (rate limit per IP + lead hashing)
 *
 * Threat (KRN-013):
 *   The previous inline getClientIp() took the LEFTMOST entry from
 *   x-forwarded-for — which is the client-controlled IP. An attacker can
 *   spoof XFF/X-Real-IP to rotate buckets and bypass the rate limit.
 *
 * Fix (this module):
 *   - TRUSTED_PROXY_COUNT > 0: take the rightmost N entries from XFF, where
 *     N is the number of trusted reverse proxies between the client and
 *     this app. Render fronts the Node service with a single proxy, so the
 *     default is 1 (trust only the rightmost entry — Render's appended IP).
 *     XFF is treated as: "client, ..., proxyN-1, proxyN". Trust the last N.
 *   - TRUSTED_PROXY_COUNT === 0: fall back to x-real-ip ONLY. This is for
 *     deployments where we trust exactly one proxy (e.g. nginx) which sets
 *     a server-controlled x-real-ip and we do NOT trust any XFF chain.
 *     Useful when running behind a proxy that doesn't preserve XFF safely.
 *   - Returns 'unknown' only as a last resort (no IP exposed). The rate
 *     limiter then buckets all 'unknown' IPs together — a safe default that
 *     blocks the entire anonymous pool, not isolated ones.
 *
 * Env vars (set in render.yaml / Render dashboard):
 *   - TRUSTED_PROXY_COUNT (integer, default 1): how many proxies to trust
 *     between the client and the app. Render adds 1 XFF entry at the right,
 *     so TRUSTED_PROXY_COUNT=1 means trust only the rightmost (Render's).
 *     Set to 0 to switch to x-real-ip-only mode.
 */

export interface ClientIpOptions {
  /** Number of trusted reverse proxies between client and server. Default: 1 */
  trustedProxyCount?: number;
}

/**
 * Extract client IP from request headers.
 *
 * Strategy (see module header for threat model):
 *   1. If trustedProxyCount === 0 → use x-real-ip (server-controlled header).
 *   2. If trustedProxyCount > 0  → use rightmost-trusted entry from XFF.
 *   3. Fallback: return 'unknown' (rate-limit pool buckets share this key).
 */
export function getClientIp(req: Request, opts: ClientIpOptions = {}): string {
  const trustedProxyCount = opts.trustedProxyCount ?? 1;

  // ── Mode 1: x-real-ip only (TRUSTED_PROXY_COUNT=0) ──────────────────
  // Use the server-controlled x-real-ip header. Client cannot spoof this
  // because the trusted proxy is the only one allowed to set it.
  if (trustedProxyCount === 0) {
    const real = req.headers.get('x-real-ip');
    if (real) return real.trim();
    return 'unknown';
  }

  // ── Mode 2: trust rightmost N entries of x-forwarded-for ─────────────
  // RFC 7239 + de-facto convention: XFF = "client, proxy1, proxy2, ...",
  // i.e. client on the LEFT, last trusted proxy on the RIGHT. The
  // server-controlled entry at position (length - N) is the first hop we
  // trust; entries to its left may include client-controlled spoofing.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      // Example: XFF="1.2.3.4, 10.0.0.1" with N=1 → index 1 = "10.0.0.1"
      //          XFF="1.2.3.4, 10.0.0.1, 10.0.0.2" with N=2 → index 1 = "10.0.0.1"
      const idx = Math.max(0, parts.length - trustedProxyCount);
      return parts[idx];
    }
  }

  // ── Mode 2 fallback: no XFF available even though we trust proxies ────
  // Do NOT fall back to x-real-ip here — that would indicate inconsistent
  // proxy config (proxy sets XFF but not x-real-ip, or vice versa) and
  // could mask spoofing attempts. Return 'unknown' to be safe.
  return 'unknown';
}
