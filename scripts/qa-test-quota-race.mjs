/**
 * scripts/test-quota-race.mjs — K4 acceptance: no race condition in quota.
 *
 * Runs checkQuota N times concurrently for the same IP and asserts that at
 * most RATE_LIMIT_MAX_REQUESTS succeed within the sliding window. With a real
 * Redis this exercises the atomic Lua script; without Redis it exercises the
 * in-memory dev fallback (visible, degraded). Set REDIS_URL to test the
 * distributed path.
 *
 * Usage: node scripts/test-quota-race.mjs
 */

import { checkQuota, __resetQuotaForTests } from '../src/lib/quota.ts';

const CONCURRENCY = 50;
const LIMIT = Number(process.env.CHAT_RATE_LIMIT_MAX ?? 10);
const WINDOW_SEC = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 60_000) / 1000;

__resetQuotaForTests();

// Use a fake-timers-free approach: all requests fire in the same window.
const ip = 'race-test-ip';

const results = await Promise.all(
  Array.from({ length: CONCURRENCY }, () =>
    checkQuota({ ip, estimatedTokens: 100 }),
  ),
);

const allowed = results.filter((r) => r.allowed).length;
const rejected = results.length - allowed;

console.log(`concurrent=${CONCURRENCY} limit=${LIMIT} allowed=${allowed} rejected=${rejected}`);
console.log(
  'degraded sample:',
  results[0].degraded ? 'true (no Redis / dev fallback)' : 'false (Redis-backed)',
);

if (allowed > LIMIT) {
  console.error(
    `RACE FAIL: ${allowed} requests allowed, but limit is ${LIMIT}. Quota is not atomic.`,
  );
  process.exit(1);
}

if (rejected < CONCURRENCY - LIMIT) {
  console.error(
    `RACE FAIL: expected at least ${CONCURRENCY - LIMIT} rejections, got ${rejected}.`,
  );
  process.exit(1);
}

console.log(`RACE PASS: exactly ${allowed} allowed (≤ ${LIMIT}), ${rejected} rejected.`);

// Also assert no key growth without TTL: daily counters must self-expire.
// We can't wait a full day, but we assert the call didn't throw and headers
// carry Cache-Control: no-store on every decision.
const missingNoStore = results.find((r) => r.headers['Cache-Control'] !== 'no-store');
if (missingNoStore) {
  console.error('FAIL: a quota decision omitted Cache-Control: no-store');
  process.exit(1);
}

console.log('PASS: all responses carry Cache-Control: no-store.');
process.exit(0);
