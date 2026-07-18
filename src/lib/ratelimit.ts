/**
 * src/lib/ratelimit.ts — BAI-005 (2026-07-15 / superseded 2026-07-18)
 *
 * DEPRECATED: quota + rate-limit logic now lives in src/lib/quota.ts (K4).
 * This file is a thin re-export so src/pages/api/lead.ts keeps working
 * without changes. Do not add new logic here.
 */

export { rateLimit, type RateLimitResult } from './quota';

import { __resetQuotaForTests } from './quota';

/** Backwards-compatible reset helper for tests. Delegates to quota state. */
export function __resetRateLimitForTests(): void {
  __resetQuotaForTests();
}
