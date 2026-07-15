#!/usr/bin/env node
/**
 * @brightai/lead-queue — Retention sweep CLI.
 *
 * Runs the same retention logic as the worker, but from cron / Render
 * scheduled job. Reads DATABASE_URL from env. Exit codes:
 *   - 0 on success (even if 0 rows were swept)
 *   - non-zero on DB error (so the cron alert system fires)
 *
 * Usage:
 *   DATABASE_URL=... node scripts/retention-sweep.mjs
 *
 * Recommended cadence: hourly. Delivered TTL = 7 days, DLQ TTL = 30
 * days, so once an hour is generous.
 */

import { runRetentionSweep } from '../src/retention.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  // eslint-disable-next-line no-console
  console.error('[lead-queue] DATABASE_URL is not set; aborting.');
  process.exit(2);
}

try {
  const result = await runRetentionSweep();
  // eslint-disable-next-line no-console
  console.log(
    `[lead-queue] sweep ok at ${result.sweptAt.toISOString()} — ` +
    `delivered: ${result.deliveredDeleted}, dlq: ${result.dlqDeleted}`,
  );
  process.exit(0);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(`[lead-queue] sweep failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
