/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Durable audit persistence (HIGH-03 fix).
 *
 * Compliance context (PDPL Art. 19 + NCA ECC 2-2024 §5): every
 * governance-relevant operation MUST have a durable audit record.
 * The previous routes used `try { logFirewallEvent } catch { /* ignore *\/ }`
 * which silently dropped audit rows on DB outage — a compliance
 * violation even when the operation succeeded for the user.
 *
 * This module provides:
 *
 *   1. **Atomic persistence** — AIRequest.create + AuditLog row
 *      committed in a single Prisma transaction. If either fails,
 *      both are rolled back. The operation either succeeds with
 *      audit, or fails entirely (no half-state).
 *
 *   2. **Retry with exponential backoff** — transient DB errors
 *      (connection reset, deadlock, timeout) are retried up to
 *      N times. Distinguishes retryable vs non-retryable Prisma
 *      error codes (P2010/P2034/P2024 = retry; P2002/P2003 = fail).
 *
 *   3. **Idempotency** — the audit row is keyed on
 *      `targetId = ctx.requestId`. If a retry encounters an
 *      existing audit for the same requestId, it returns the
 *      existing row instead of creating a duplicate.
 *
 *   4. **Closed failure semantics** — if all retries are exhausted,
 *      the function returns `ok: false` with structured error info.
 *      The CALLER decides what to do: typically return 503 with
 *      `X-Firewall-Audit-Failed: true`. The governance operation
 *      DID NOT succeed — there's no audit, so it didn't happen.
 *
 *   5. **Structured alerting** — on retry exhaustion, emits a
 *      structured log line (`logAuditFailure`) with all context
 *      (requestId, orgId, attempts, error code). Production
 *      deployments can wire this to Sentry / PagerDuty.
 *
 * Design choice: we use **explicit failure** (not outbox queue).
 * The brief allows either; explicit failure is simpler and aligns
 * with the project's fail-closed posture for HIGH-02. A durable
 * file-based outbox could be added later if availability > compliance.
 */

import { Prisma, type PrismaClient } from '@brightai/db';
import { dbServiceRole } from '@brightai/db';
import { appendAuditLogInTx } from './hashchain';
import type { FirewallContext, FirewallEventMetadata } from '../detectors/types';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 100;
const MAX_DELAY_MS = 2000;

/**
 * Transient Prisma error codes that warrant a retry.
 * - P2010: Raw query failed (often connection / timeout)
 * - P2024: Timed out fetching a connection from pool
 * - P2034: Transaction conflict (deadlock / serialization failure)
 */
const RETRYABLE_PRISMA_CODES = new Set(['P2010', 'P2024', 'P2034']);

export type DurableAuditInput = {
  ctx: FirewallContext;
  metadata: FirewallEventMetadata;
  /** Optional AIRequest row to create atomically with the audit row. */
  aiRequest?: Prisma.AIRequestCreateInput;
  /** Optional IP / user-agent to attach. */
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type DurableAuditResult =
  | { ok: true; auditId: string; hash: string; aiRequestId: string | null; idempotent: boolean; attempts: number }
  | { ok: false; error: { code: string; message: string; attempts: number }; idempotent: boolean };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Classify a Prisma error as retryable or not. */
function isRetryable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_PRISMA_CODES.has(err.code);
  }
  // Network-level errors (ECONNRESET, ETIMEDOUT, etc.) on the
  // Node.js driver surface as a plain Error with a `code` field.
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: unknown }).code);
    return (
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'EPIPE' ||
      code === '57P01' || // admin_shutdown
      code === '57P02' || // crash_shutdown
      code === '57P03'    // cannot_connect_now
    );
  }
  return false;
}

/** Classify the final error into a stable code for telemetry. */
function classifyError(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return `prisma_${err.code}`;
  }
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: unknown }).code);
  }
  return 'unknown_error';
}

/**
 * Structured log line for production alerting. In a deployment with
 * Sentry/Datadog, this would integrate via the host platform's
 * logger. For now we use stderr JSON (consumed by any log shipper).
 */
export function logAuditFailure(input: {
  ctx: FirewallContext;
  error: { code: string; message: string; attempts: number };
  operation: 'persist_firewall_event';
}): void {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      severity: 'critical',
      event: 'firewall_audit_persistence_failed',
      operation: input.operation,
      organizationId: input.ctx.organizationId,
      requestId: input.ctx.requestId,
      userId: input.ctx.userId,
      error: input.error,
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Look up an existing audit row by requestId (idempotency check).
 * Returns the existing row if found.
 */
async function findExistingAudit(
  tx: Prisma.TransactionClient,
  requestId: string,
): Promise<{ id: string; hash: string | null } | null> {
  // We key idempotency on targetId = requestId + targetType = 'firewall_event'.
  // This is stable across retries because ctx.requestId is fixed per request.
  const existing = await tx.auditLog.findFirst({
    where: {
      targetId: requestId,
      targetType: 'firewall_event',
    },
    select: { id: true, hash: true },
  });
  return existing;
}

/**
 * Persist a firewall event durably with atomic AIRequest + AuditLog
 * commit, retry on transient failures, and idempotency via requestId.
 *
 * Returns:
 *   - `ok: true` if the audit row is committed (and AIRequest if requested)
 *   - `ok: false` if all retries failed (caller should return 503)
 *
 * Idempotency: if `ctx.requestId` already has an audit row, that row's
 * hash is returned and no new row is created. The `idempotent: true`
 * flag indicates this path was taken.
 */
export async function persistFirewallEventDurable(
  input: DurableAuditInput,
): Promise<DurableAuditResult> {
  let lastErr: unknown = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt;
    try {
      const result = await dbServiceRole.$transaction(
        async (tx) => {
          // 1. Idempotency check first (cheap, avoids lock contention
          //    if a retry arrives while we're already committed).
          const existing = await findExistingAudit(tx, input.ctx.requestId);
          if (existing) {
            return {
              ok: true as const,
              auditId: existing.id,
              hash: existing.hash ?? '',
              aiRequestId: null,
              idempotent: true,
              attempts: attempt,
            };
          }

          // 2. Create AIRequest atomically (if requested).
          let aiRequestId: string | null = null;
          if (input.aiRequest) {
            const aiReq = await tx.aIRequest.create({ data: input.aiRequest });
            aiRequestId = aiReq.id;
          }

          // 3. Append audit log row (hash chain).
          const auditRow = await appendAuditLogInTx(tx, {
            organizationId: input.ctx.organizationId,
            actorId: input.ctx.userId,
            actorType: 'API_KEY',
            action: 'REQUEST_CREATED',
            targetType: 'firewall_event',
            targetId: input.ctx.requestId,
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
            metadata: input.metadata as unknown as Record<string, unknown>,
          });

          return {
            ok: true as const,
            auditId: auditRow.id,
            hash: auditRow.hash,
            aiRequestId,
            idempotent: false,
            attempts: attempt,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 },
      );
      return result;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) {
        break;
      }
      // Exponential backoff with jitter (cap at MAX_DELAY_MS).
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS) +
        Math.random() * 50;
      await sleep(delay);
    }
  }

  // Closed failure — emit alert + return structured error.
  const errorInfo = {
    code: classifyError(lastErr),
    message: lastErr instanceof Error ? lastErr.message : String(lastErr),
    attempts,
  };
  logAuditFailure({
    ctx: input.ctx,
    error: errorInfo,
    operation: 'persist_firewall_event',
  });

  return {
    ok: false,
    error: errorInfo,
    idempotent: false,
  };
}

/**
 * Idempotency check helper: returns true if an audit row already
 * exists for the given requestId. Useful for routes that want to
 * short-circuit BEFORE doing expensive work (e.g. LLM calls).
 */
export async function hasAuditForRequest(requestId: string): Promise<boolean> {
  const existing = await dbServiceRole.auditLog.findFirst({
    where: { targetId: requestId, targetType: 'firewall_event' },
    select: { id: true },
  });
  return existing !== null;
}

// Re-export for tests / convenience
export { appendAuditLogInTx } from './hashchain';
export type { PrismaClient };