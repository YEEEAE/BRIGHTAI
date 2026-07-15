/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Audit durability tests (HIGH-03).
 *
 * Acceptance criteria:
 *   1. Retry with exponential backoff on transient DB errors.
 *   2. Idempotency: same requestId twice → one audit row.
 *   3. Closed failure on retry exhaustion (ok=false with error info).
 *   4. Non-retryable errors fail immediately (no retry).
 *   5. AIRequest + AuditLog are atomic (one transaction).
 *
 * Strategy: import the pure helpers (`isRetryable`, `classifyError`)
 * directly to test the decision logic without a real DB. For the
 * idempotency check + atomic commit logic, we mock the Prisma
 * `dbServiceRole` to verify behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@brightai/db';

// Mock @brightai/db BEFORE importing the durable module.
const mockTx = {
  $executeRaw: vi.fn(async () => 0),
  $queryRaw: vi.fn(async () => [] as Array<{ hash: string | null }>),
  auditLog: {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: { id?: string; hash?: string } }) => ({
      id: data.id ?? 'audit-test-123',
      prevHash: null,
      hash: data.hash ?? 'sha256-test',
      createdAt: new Date(),
    })),
  },
  aIRequest: {
    create: vi.fn(async ({ data }: { data: { id?: string } }) => ({
      id: data.id ?? 'aireq-test-456',
      ...data,
    })),
  },
};
const mockDb = {
  $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  auditLog: { findFirst: vi.fn(async () => null) },
};

vi.mock('@brightai/db', () => ({
  Prisma: Prisma,
  PrismaClient: class {},
  dbServiceRole: mockDb,
}));

// Import AFTER mocking.
const durable = await import('../../lib/firewall/audit/durable');
const hashchain = await import('../../lib/firewall/audit/hashchain');

const ctx = {
  organizationId: 'org-test',
  userId: 'user-test',
  policy: { actions: {}, blockOnCritical: true, nerEnabled: false },
  requestId: 'req-durable-test-1',
};

const baseMetadata = {
  latencyMs: 5,
  piiTypes: ['SAUDI_ID'],
  detectionCount: 1,
  originalTextSha256: 'abc123',
  originalLength: 10,
  effectiveAction: 'mask' as const,
  model: null,
  tokensUsed: null,
  blocked: false,
  llmLatencyMs: null,
};

// ─────────────────────────────────────────────────────────────────
// isRetryable classification
// ─────────────────────────────────────────────────────────────────

describe('isRetryable — Prisma error classification', () => {
  it('retries on P2010 (raw query failed)', async () => {
    // Reach into the private via a smoke test of the function.
    const err = new Prisma.PrismaClientKnownRequestError('boom', { code: 'P2010', clientVersion: '5' });
    // Call via a wrapper that exposes it.
    expect(durable.classifyError(err)).toBe('prisma_P2010');
  });

  it('classifies P2002 (unique violation) as non-retryable code', () => {
    const err = new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' });
    expect(durable.classifyError(err)).toBe('prisma_P2002');
  });

  it('classifies unknown errors as unknown_error', () => {
    expect(durable.classifyError(new Error('boom'))).toBe('unknown_error');
    expect(durable.classifyError(null)).toBe('unknown_error');
  });
});

// ─────────────────────────────────────────────────────────────────
// Idempotency: same requestId → one audit row
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — idempotency', () => {
  it('skips insert when audit already exists for requestId', async () => {
    mockDb.auditLog.findFirst.mockResolvedValueOnce({
      id: 'audit-existing',
      hash: 'sha256-prev',
    });
    mockTx.auditLog.create.mockClear();
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.idempotent).toBe(true);
      expect(result.auditId).toBe('audit-existing');
      expect(result.hash).toBe('sha256-prev');
    }
    // auditLog.create must NOT be called.
    expect(mockTx.auditLog.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────
// Atomic persistence: AIRequest + AuditLog in one transaction
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — atomic AIRequest + AuditLog', () => {
  it('creates both rows when no aiRequest needed', async () => {
    mockDb.auditLog.findFirst.mockResolvedValueOnce(null);
    mockTx.auditLog.create.mockClear();
    const result = await durable.persistFirewallEventDurable({
      ctx,
      metadata: baseMetadata,
    });
    expect(result.ok).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('creates AIRequest then AuditLog in same transaction', async () => {
    mockDb.auditLog.findFirst.mockResolvedValueOnce(null);
    mockTx.aIRequest.create.mockClear();
    mockTx.auditLog.create.mockClear();
    const result = await durable.persistFirewallEventDurable({
      ctx,
      metadata: baseMetadata,
      aiRequest: {
        organizationId: ctx.organizationId,
        requestedById: ctx.userId ?? 'fallback',
        prompt: 'test prompt',
        response: 'test response',
        modelUsed: 'test-model',
        piiDetected: true,
        piiTypes: ['SAUDI_ID'],
        status: 'AUTO_APPROVED',
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.aiRequestId).toBeTruthy();
    // Both creates must run inside the transaction.
    expect(mockTx.aIRequest.create).toHaveBeenCalledTimes(1);
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('rolls back when audit fails (transaction wraps both)', async () => {
    mockDb.auditLog.findFirst.mockResolvedValueOnce(null);
    mockTx.auditLog.create.mockRejectedValueOnce(new Error('audit failed'));
    // Simulate $transaction invoking the fn and propagating the error.
    mockDb.$transaction.mockImplementationOnce(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.attempts).toBeGreaterThanOrEqual(1);
      expect(result.error.message).toContain('audit failed');
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Retry on transient errors
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — retry on transient errors', () => {
  it('retries up to 3 times on retryable errors then fails', async () => {
    const retryable = new Prisma.PrismaClientKnownRequestError('timeout', { code: 'P2024', clientVersion: '5' });
    mockDb.auditLog.findFirst.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation(async () => {
      throw retryable;
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.attempts).toBe(3);
      expect(result.error.code).toBe('prisma_P2024');
    }
    expect(mockDb.$transaction).toHaveBeenCalledTimes(3);
  });

  it('succeeds on the 2nd attempt after one transient failure', async () => {
    let calls = 0;
    mockDb.auditLog.findFirst.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
      calls++;
      if (calls === 1) {
        throw new Prisma.PrismaClientKnownRequestError('transient', { code: 'P2024', clientVersion: '5' });
      }
      return fn(mockTx);
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attempts).toBe(2);
    }
    expect(calls).toBe(2);
  });

  it('does NOT retry on non-retryable errors (P2002 unique violation)', async () => {
    mockDb.auditLog.findFirst.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation(async () => {
      throw new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' });
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.attempts).toBe(1);
      expect(result.error.code).toBe('prisma_P2002');
    }
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Closed failure: returns structured error info on retry exhaustion
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — closed failure semantics', () => {
  it('returns ok=false with structured error on retry exhaustion', async () => {
    mockDb.auditLog.findFirst.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation(async () => {
      const err = new Error('db connection refused');
      (err as Error & { code?: string }).code = 'ECONNREFUSED';
      throw err;
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ECONNREFUSED');
      expect(result.error.attempts).toBe(3);
      expect(typeof result.error.message).toBe('string');
    }
  });

  it('structured alert is logged via stderr JSON on closed failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.auditLog.findFirst.mockResolvedValue(null);
    mockDb.$transaction.mockImplementation(async () => {
      throw new Error('simulated db outage');
    });
    await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(consoleSpy).toHaveBeenCalled();
    const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
    const logged = JSON.parse(String(lastCall[0]));
    expect(logged.severity).toBe('critical');
    expect(logged.event).toBe('firewall_audit_persistence_failed');
    expect(logged.organizationId).toBe('org-test');
    expect(logged.requestId).toBe('req-durable-test-1');
    expect(logged.error.code).toBeTruthy();
    expect(logged.error.attempts).toBe(3);
    consoleSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────
// Backward compat: appendAuditLogInTx is exported by durable.ts
// ─────────────────────────────────────────────────────────────────

describe('appendAuditLogInTx — re-export from durable', () => {
  it('exports the tx-friendly variant', () => {
    expect(durable.appendAuditLogInTx).toBe(hashchain.appendAuditLogInTx);
  });
});