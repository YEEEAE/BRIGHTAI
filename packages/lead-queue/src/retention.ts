/**
 * @brightai/lead-queue — Retention sweep.
 *
 * Deletes two classes of rows:
 *   1. DELIVERED rows older than 7 days. Lead metadata leaves the
 *      database once the operator's CRM has it.
 *   2. DLQ rows older than 30 days. After a month, a permanently-failed
 *      lead is either no longer relevant or has been re-submitted by
 *      other means.
 *
 * PENDING / SENDING rows are never deleted by this sweep — they
 * represent work that may still complete.
 */

import { dbServiceRole } from '@brightai/db';
import {
  DELIVERED_TTL_DAYS,
  DLQ_TTL_DAYS,
} from './types';

export interface SweepResult {
  deliveredDeleted: number;
  dlqDeleted: number;
  sweptAt: Date;
}

export async function sweepDelivered(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - DELIVERED_TTL_DAYS * 24 * 60 * 60 * 1000);
  const r = await dbServiceRole.leadQueue.deleteMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { lt: cutoff },
    },
  });
  return r.count;
}

export async function sweepDlq(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - DLQ_TTL_DAYS * 24 * 60 * 60 * 1000);
  const r = await dbServiceRole.leadQueue.deleteMany({
    where: {
      status: 'DLQ',
      dlqAt: { lt: cutoff },
    },
  });
  return r.count;
}

export async function runRetentionSweep(now: Date = new Date()): Promise<SweepResult> {
  const [deliveredDeleted, dlqDeleted] = await Promise.all([
    sweepDelivered(now),
    sweepDlq(now),
  ]);
  return { deliveredDeleted, dlqDeleted, sweptAt: now };
}
