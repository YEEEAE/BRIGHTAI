/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Tamper-evident hash chain writer. Each new AuditLog row's
 * `hash` is computed as:
 *
 *   hash = SHA-256( prevHash || canonicalJson(payload without hash) )
 *
 * The first row in a chain has prevHash = ''.
 *
 * This gives BrightAI a verifiable audit trail: anyone with the
 * database can recompute every hash and detect tampering.
 *
 * Concurrency: we use a serializable transaction with an advisory
 * lock keyed on organizationId. Two parallel requests for the
 * same org will queue; cross-org writes are independent.
 *
 * Saudi PDPL context: PDPL Art. 19 (record of processing activities)
 * and NCA ECC 2-2024 §5 (audit logs) both require immutable
 * audit trails. This module is the implementation.
 */

import { createHash } from 'node:crypto';
import { Prisma } from '@brightai/db';
import { dbServiceRole } from '@brightai/db';

export type AuditChainInput = {
  organizationId: string;
  actorId: string | null;
  actorType: 'USER' | 'SYSTEM' | 'SUPPORT' | 'API_KEY';
  action:
    | 'REQUEST_CREATED'
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED'
    | 'POLICY_APPROVED';
  targetType?: string;
  targetId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Deterministic JSON serialization. Keys are sorted recursively
 * so that two semantically-equal payloads produce the same bytes.
 * (A subset of RFC 8785 JSON Canonicalization Scheme.)
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k]));
  return '{' + parts.join(',') + '}';
}

/**
 * Hash function used by the chain. SHA-256 over UTF-8 bytes.
 */
function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

interface LastHashRow {
  hash: string | null;
}

/**
 * Append a new audit log row to the org's chain. Returns the
 * inserted row including its computed hash.
 *
 * Implementation: opens a serializable transaction, takes an
 * advisory lock on the org, reads the last hash, computes the
 * new hash, inserts the row, and returns it.
 */
export async function appendAuditLog(
  input: AuditChainInput,
): Promise<{ id: string; prevHash: string | null; hash: string; createdAt: Date }> {
  return dbServiceRole.$transaction(
    (tx) => appendAuditLogInTx(tx, input),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/**
 * Transaction-friendly version of `appendAuditLog`. Caller passes
 * an open Prisma transaction so this can be composed with other
 * writes (e.g. AIRequest.create) for atomic persistence (HIGH-03
 * fix). Same chain logic + lock as the standalone version.
 */
export async function appendAuditLogInTx(
  tx: Prisma.TransactionClient,
  input: AuditChainInput,
): Promise<{ id: string; prevHash: string | null; hash: string; createdAt: Date }> {
  // Advisory lock on the org id so concurrent writes serialize.
  // pg_advisory_xact_lock takes a bigint; hash the org id to fit.
  const lockKey = hashStringToBigInt(input.organizationId);
  await tx.$executeRaw(
    Prisma.sql`SELECT pg_advisory_xact_lock(${lockKey})`,
  );

  const last = (await tx.$queryRaw<LastHashRow[]>`
    SELECT "hash" FROM "audit_logs"
    WHERE "organization_id" = ${input.organizationId}
    ORDER BY "created_at" DESC
    LIMIT 1
    FOR UPDATE
  `) as LastHashRow[];

  const prevHash: string | null = last[0]?.hash ?? null;
  const createdAt = new Date();

  // Build the payload that gets hashed — everything except
  // `hash` itself. We include createdAt so reordering is
  // detectable.
  const payload = {
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorType: input.actorType,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? {},
    createdAt: createdAt.toISOString(),
  };

  const hash = sha256((prevHash ?? '') + canonicalJson(payload));

  const row = await tx.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      actorType: input.actorType,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      prevHash,
      hash,
      createdAt,
    },
    select: {
      id: true,
      prevHash: true,
      hash: true,
      createdAt: true,
    },
  });

  // Cast: the schema declares hash as nullable but we always
  // write a non-null value via the chain writer.
  return row as { id: string; prevHash: string | null; hash: string; createdAt: Date };
}

/**
 * Verify the chain integrity for an organization. Walks the rows
 * in createdAt order and recomputes every hash. Returns the count
 * of rows verified and the first row that failed (if any).
 */
export async function verifyChain(organizationId: string): Promise<{
  ok: boolean;
  rowsChecked: number;
  firstFailure?: { id: string; expectedHash: string; actualHash: string };
}> {
  const rows = await dbServiceRole.auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      organizationId: true,
      actorId: true,
      actorType: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      prevHash: true,
      hash: true,
      createdAt: true,
    },
  });

  let prevHash: string | null = null;
  for (const row of rows) {
    const payload = {
      organizationId: row.organizationId,
      actorId: row.actorId,
      actorType: row.actorType,
      action: row.action,
      targetType: row.targetType ?? null,
      targetId: row.targetId ?? null,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    };
    const expected = sha256((prevHash ?? '') + canonicalJson(payload));
    if (expected !== row.hash) {
      return {
        ok: false,
        rowsChecked: rows.length,
        firstFailure: { id: row.id, expectedHash: expected, actualHash: row.hash ?? '' },
      };
    }
    if (row.prevHash !== prevHash) {
      return {
        ok: false,
        rowsChecked: rows.length,
        firstFailure: { id: row.id, expectedHash: row.prevHash ?? '', actualHash: prevHash ?? '' },
      };
    }
    prevHash = row.hash;
  }
  return { ok: true, rowsChecked: rows.length };
}

/** Hash a string into a 63-bit signed bigint for pg_advisory_xact_lock. */
function hashStringToBigInt(s: string): bigint {
  const h = createHash('sha256').update(s, 'utf8').digest();
  // Take the first 8 bytes as a signed bigint.
  const hex = h.subarray(0, 8).toString('hex');
  const unsigned = BigInt('0x' + hex);
  // Convert to signed 64-bit range.
  const mask = (BigInt(1) << BigInt(63)) - BigInt(1);
  return (unsigned & mask) - (unsigned & ~mask);
}
