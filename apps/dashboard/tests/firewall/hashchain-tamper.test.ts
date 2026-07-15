import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createHash } from 'node:crypto';

type AuditRow = {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorType: 'USER' | 'SYSTEM' | 'SUPPORT' | 'API_KEY';
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  prevHash: string | null;
  hash: string;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

// In-memory auditLog storage; supports both Prisma's tx-style chains
// (used by appendAuditLogInTx) and the standalone $transaction.
const store: AuditRow[] = [];

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const obj = value as Record<string, unknown>;
  return (
    '{' +
    Object.keys(obj)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + canonical(obj[k]))
      .join(',') +
    '}'
  );
}

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function computeHash(prev: string | null, row: AuditRow): string {
  const payload = {
    organizationId: row.organizationId,
    actorId: row.actorId,
    actorType: row.actorType,
    action: row.action,
    targetType: row.targetType ?? null,
    targetId: row.targetId ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
  };
  return sha256((prev ?? '') + canonical(payload));
}

function findLastHash(orgId: string): string | null {
  const matches = store.filter((r) => r.organizationId === orgId);
  matches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return matches.length ? matches[matches.length - 1].hash : null;
}

function makeTx() {
  return {
    $executeRaw: vi.fn(async () => 0),
    $queryRaw: vi.fn(async (strings: TemplateStringsArray, ..._values: unknown[]) => {
      // We don't need actual advisory lock support for tests; return empty.
      void strings;
      return [] as Array<{ hash: string | null }>;
    }),
    auditLog: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Omit<AuditRow, 'hash'> & { hash?: string } }) => {
        const id = data.id ?? `al_${Math.random().toString(36).slice(2, 10)}`;
        const createdAt = data.createdAt ?? new Date();
        const row: AuditRow = {
          ...data,
          id,
          createdAt,
          prevHash: data.prevHash ?? findLastHash(data.organizationId),
        };
        row.hash = computeHash(row.prevHash, row);
        store.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where, orderBy }: { where?: { organizationId?: string }; orderBy?: unknown }) => {
        let out = store.slice();
        if (where?.organizationId) out = out.filter((r) => r.organizationId === where.organizationId);
        const ob = Array.isArray(orderBy) ? orderBy[0] : orderBy;
        if (ob && typeof ob === 'object') {
          const entry = Object.entries(ob as Record<string, string>)[0];
          if (entry && entry[1] === 'asc') {
            out.sort((a, b) => (a.createdAt.getTime() - b.createdAt.getTime()));
          }
        }
        return out;
      }),
    },
  };
}

const txMock = makeTx();

vi.mock('@prisma/client', () => {
  // Prisma.sql is a tagged template; we don't need real interpolation.
  // Returning an empty object is enough — the test never inspects its content.
  const sql = (strings: TemplateStringsArray) => Object.assign([], { strings });
  const TransactionIsolationLevel = { Serializable: 'Serializable' } as const;
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
      TransactionIsolationLevel,
      sql,
    },
    PrismaClient: class {},
  };
});

vi.mock('@brightai/db', () => {
  const sql = (strings: TemplateStringsArray) => Object.assign([], { strings });
  const TransactionIsolationLevel = { Serializable: 'Serializable' } as const;
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
      TransactionIsolationLevel,
      sql,
    },
    PrismaClient: class {},
    dbServiceRole: {
      $transaction: vi.fn(async (fn: (t: typeof txMock) => Promise<unknown>) => fn(txMock)),
      auditLog: txMock.auditLog,
    },
  };
});

let hashchain: typeof import('../../lib/firewall/audit/hashchain');
let appendAuditLog: typeof import('../../lib/firewall/audit/hashchain').appendAuditLog;
let appendAuditLogInTx: typeof import('../../lib/firewall/audit/hashchain').appendAuditLogInTx;
let verifyChain: typeof import('../../lib/firewall/audit/hashchain').verifyChain;

beforeAll(async () => {
  hashchain = await import('../../lib/firewall/audit/hashchain');
  appendAuditLog = hashchain.appendAuditLog;
  appendAuditLogInTx = hashchain.appendAuditLogInTx;
  verifyChain = hashchain.verifyChain;
});

beforeEach(() => {
  // Clear the in-memory auditLog between tests so org-scoped assertions
  // don't see rows left over from earlier tests.
  store.length = 0;
});

describe('appendAuditLog — chain construction', () => {
  it('writes the first row with prevHash=null and a deterministic hash', async () => {
    const row = await appendAuditLog({
      organizationId: 'org_hc',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
      targetType: 'AIRequest',
      targetId: 'ai_1',
      metadata: { reason: 'init' },
    });
    expect(row.prevHash).toBeNull();
    expect(row.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(store).toHaveLength(1);
  });

  it('links the second row via the first row hash', async () => {
    await appendAuditLog({
      organizationId: 'org_hc',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
      metadata: { i: 0 },
    });
    await appendAuditLog({
      organizationId: 'org_hc',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_APPROVED',
      metadata: { i: 1 },
    });
    expect(store).toHaveLength(2);
    expect(store[1].prevHash).toBe(store[0].hash);
    expect(store[1].hash).not.toBe(store[0].hash);
  });

  it('chains are org-scoped (org A and org B do not link)', async () => {
    await appendAuditLog({
      organizationId: 'org_A',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
    });
    await appendAuditLog({
      organizationId: 'org_B',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
    });
    const rowsForA = store.filter((r) => r.organizationId === 'org_A');
    const rowsForB = store.filter((r) => r.organizationId === 'org_B');
    expect(rowsForA[0].prevHash).toBeNull();
    expect(rowsForB[0].prevHash).toBeNull();
  });
});

describe('verifyChain — tamper detection', () => {
  it('returns ok=true for an intact chain', async () => {
    for (let i = 0; i < 3; i++) {
      await appendAuditLog({
        organizationId: 'org_intact',
        actorId: null,
        actorType: 'SYSTEM',
        action: 'REQUEST_CREATED',
        metadata: { i },
      });
    }
    const v = await verifyChain('org_intact');
    expect(v.ok).toBe(true);
    expect(v.rowsChecked).toBe(3);
    expect(v.firstFailure).toBeUndefined();
  });

  it('returns ok=false when metadata is mutated (hash mismatch)', async () => {
    await appendAuditLog({
      organizationId: 'org_tampered',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
      metadata: { amount: 100 },
    });
    await appendAuditLog({
      organizationId: 'org_tampered',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_APPROVED',
      metadata: { reason: 'good' },
    });
    // Tamper: change the first row's metadata without updating its hash.
    store[0].metadata = { amount: 9999 };
    const v = await verifyChain('org_tampered');
    expect(v.ok).toBe(false);
    expect(v.firstFailure?.id).toBe(store[0].id);
    expect(v.firstFailure?.actualHash).toBe(store[0].hash);
    expect(v.firstFailure?.expectedHash).not.toBe(store[0].hash);
  });

  it('returns ok=false when prevHash is broken', async () => {
    await appendAuditLog({
      organizationId: 'org_brokenlink',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
    });
    await appendAuditLog({
      organizationId: 'org_brokenlink',
      actorId: null,
      actorType: 'SYSTEM',
      action: 'REQUEST_CREATED',
    });
    // Detach second row from chain.
    store[1].prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const v = await verifyChain('org_brokenlink');
    expect(v.ok).toBe(false);
    expect(v.firstFailure?.id).toBe(store[1].id);
  });

  it('returns ok=true for an unknown org (no rows = valid)', async () => {
    const v = await verifyChain('org_unknown');
    expect(v.ok).toBe(true);
    expect(v.rowsChecked).toBe(0);
  });
});

describe('appendAuditLogInTx — tx-friendly variant', () => {
  it('is exported and callable with a Prisma TransactionClient', async () => {
    expect(typeof appendAuditLogInTx).toBe('function');
    // The mock tx exposes the same shape Prisma expects.
    const txAudit = await appendAuditLogInTx(txMock as unknown as Parameters<typeof appendAuditLogInTx>[0], {
      organizationId: 'org_tx',
      actorId: null,
      actorType: 'API_KEY',
      action: 'POLICY_APPROVED',
      metadata: { source: 'tx-friendly' },
    });
    expect(txAudit.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
