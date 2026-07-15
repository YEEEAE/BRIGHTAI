/**
 * @brightai/lead-queue — Public entry point.
 *
 * Re-exports the queue, delivery, retention, and idempotency APIs.
 * Callers import what they need; nothing is "auto-loaded" so tests
 * can stub individual modules without side effects.
 */

export * from './types';
export * from './idempotency';
export {
  enqueue,
  markDelivered,
  recordAttemptFailure,
  claimNext,
  releaseMidFlight,
  countByStatus,
} from './queue';
export {
  tryDeliver,
  signBody,
  buildBody,
  deliverOne,
  drainOnce,
} from './delivery';
export {
  sweepDelivered,
  sweepDlq,
  runRetentionSweep,
} from './retention';
export type { SweepResult } from './retention';
