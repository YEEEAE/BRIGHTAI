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
 * Strategy: mock Prisma + dbServiceRole via `vi.hoisted` so the mock
 * state is initialized BEFORE the hoisted `vi.mock` runs.
 */

import { describe, it, expect, vi } from 'vitest';

// Hoist all mock state so `vi.mock` factories can reference it
// without hitting "Cannot access before initialization".
const mocks = vi.hoisted(() => {
  const tx = {
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
  const db = {
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    auditLog: { findFirst: vi.fn(async () => null) },
  };
  return { tx, db };
});

vi.mock('@prisma/client', () => {
  // Use Prisma's own structure but expose only what we need.
  // PrismaClient + Prisma namespace re-export.
  return {
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {
        code: string;
        clientVersion: string;
        constructor(message: string, opts: { code: string; clientVersion: string }) {
          super(message);
          this.code = opts.code;
          this.clientVersion = opts.clientVersion;
        }
      },
    },
    PrismaClient: class {},
  };
});

vi.mock('@brightai/db', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      clientVersion: string;
      constructor(message: string, opts: { code: string; clientVersion: string }) {
        super(message);
        this.code = opts.code;
        this.clientVersion = opts.clientVersion;
      }
    },
  },
  PrismaClient: class {},
  dbServiceRole: mocks.db,
}));

// Import AFTER mocks are set up.
const durable = await import('../../lib/firewall/audit/durable');
const hashchain = await import('../../lib/firewall/audit/hashchain');

// Helper to build a Prisma error matching a code.
function prismaError(code: string, message = 'boom'): Error {
  const err = new Error(message) as Error & { code: string; clientVersion: string };
  err.code = code;
  err.clientVersion = '5';
  return err;
}

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
// Error classification
// ─────────────────────────────────────────────────────────────────

describe('classifyError — stable codes for telemetry', () => {
  it('classifies Prisma P2010 as prisma_P2010', () => {
    expect(durable.classifyError(prismaError('P2010'))).toBe('prisma_P2010');
  });

  it('classifies Prisma P2002 as prisma_P2002', () => {
    expect(durable.classifyError(prismaError('P2002'))).toBe('prisma_P2002');
  });

  it('classifies unknown errors as unknown_error', () => {
    expect(durable.classifyError(new Error('boom'))).toBe('unknown_error');
    expect(durable.classifyError(null)).toBe('unknown_error');
  });
});

// ─────────────────────────────────────────────────────────────────
// Idempotency
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — idempotency', () => {
  it('skips insert when audit already exists for requestId', async () => {
    mocks.db.auditLog.findFirst.mockResolvedValueOnce({
      id: 'audit-existing',
      hash: 'sha256-prev',
    });
    mocks.tx.auditLog.create.mockClear();
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.idempotent).toBe(true);
      expect(result.auditId).toBe('audit-existing');
      expect(result.hash).toBe('sha256-prev');
    }
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('inserts new audit when no existing row', async () => {
    mocks.db.auditLog.findFirst.mockResolvedValueOnce(null);
    mocks.tx.auditLog.create.mockClear();
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.idempotent).toBe(false);
    }
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Atomic AIRequest + AuditLog
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — atomic AIRequest + AuditLog', () => {
  it('creates audit only when no aiRequest needed', async () => {
    mocks.db.auditLog.findFirst.mockResolvedValueOnce(null);
    mocks.tx.auditLog.create.mockClear();
    const result = await durable.persistFirewallEventDurable({
      ctx,
      metadata: baseMetadata,
    });
    expect(result.ok).toBe(true);
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('creates AIRequest then AuditLog in same transaction', async () => {
    mocks.db.auditLog.findFirst.mockResolvedValueOnce(null);
    mocks.tx.aIRequest.create.mockClear();
    mocks.tx.auditLog.create.mockClear();
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
    expect(mocks.tx.aIRequest.create).toHaveBeenCalledTimes(1);
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Retry on transient errors
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — retry on transient errors', () => {
  it('retries up to 3 times on retryable errors then fails', async () => {
    mocks.db.auditLog.findFirst.mockReset();
    mocks.db.auditLog.findFirst.mockResolvedValue(null);
    mocks.db.$transaction.mockReset();
    mocks.db.$transaction.mockImplementation(async () => {
      throw prismaError('P2024', 'timeout');
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.attempts).toBe(3);
      expect(result.error.code).toBe('prisma_P2024');
    }
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(3);
  });

  it('succeeds on the 2nd attempt after one transient failure', async () => {
    mocks.db.auditLog.findFirst.mockReset();
    mocks.db.auditLog.findFirst.mockResolvedValue(null);
    let calls = 0;
    mocks.db.$transaction.mockReset();
    mocks.db.$transaction.mockImplementation(async (fn: (t: typeof mocks.tx) => Promise<unknown>) => {
      calls++;
      if (calls === 1) throw prismaError('P2024', 'transient');
      return fn(mocks.tx);
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attempts).toBe(2);
    }
    expect(calls).toBe(2);
  });

  it('does NOT retry on non-retryable errors (P2002 unique violation)', async () => {
    mocks.db.auditLog.findFirst.mockReset();
    mocks.db.auditLog.findFirst.mockResolvedValue(null);
    mocks.db.$transaction.mockReset();
    mocks.db.$transaction.mockImplementation(async () => {
      throw prismaError('P2002', 'duplicate');
    });
    const result = await durable.persistFirewallEventDurable({ ctx, metadata: baseMetadata });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.attempts).toBe(1);
      expect(result.error.code).toBe('prisma_P2002');
    }
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Closed failure + structured alerting
// ─────────────────────────────────────────────────────────────────

describe('persistFirewallEventDurable — closed failure semantics', () => {
  it('returns ok=false with structured error on retry exhaustion', async () => {
    mocks.db.auditLog.findFirst.mockReset();
    mocks.db.auditLog.findFirst.mockResolvedValue(null);
    mocks.db.$transaction.mockReset();
    mocks.db.$transaction.mockImplementation(async () => {
      const err = new Error('db connection refused') as Error & { code?: string };
      err.code = 'ECONNREFUSED';
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
    mocks.db.auditLog.findFirst.mockReset();
    mocks.db.auditLog.findFirst.mockResolvedValue(null);
    mocks.db.$transaction.mockReset();
    mocks.db.$transaction.mockImplementation(async () => {
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