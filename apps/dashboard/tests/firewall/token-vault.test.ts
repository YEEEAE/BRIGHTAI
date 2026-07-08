/**
 * BrightAI AI Firewall — Phase 1c
 *
 * Unit tests for the Token Vault (AES-256-GCM encryption + token
 * format). We mock the Prisma layer to keep the test pure.
 *
 * The vault requires `FIREWALL_TOKEN_VAULT_KEY` to be set. We
 * set it in the test before importing the module.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// Set the env var BEFORE importing the module.
const TEST_KEY = 'test-vault-key-do-not-use-in-production-32bytes-min';
process.env.FIREWALL_TOKEN_VAULT_KEY = TEST_KEY;

// Mock Prisma so the test doesn't need a real DB.
const store = new Map<string, {
  id: string;
  organizationId: string;
  token: string;
  tokenHmac: string;
  encryptedValue: string;
  iv: string;
  authTag: string;
  keyVersion: string;
  piiType: string;
  expiresAt: Date | null;
  createdById: string;
  createdAt: Date;
}>();

vi.mock('@brightai/db', () => ({
  dbServiceRole: {
    tokenMapping: {
      create: vi.fn(async ({ data }: { data: typeof store extends Map<string, infer V> ? V : never }) => {
        const id = `tm_${Math.random().toString(36).slice(2, 10)}`;
        const row = { ...data, id, createdAt: new Date() };
        store.set(`${data.organizationId}:${data.token}`, row as never);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { organizationId_token: { organizationId: string; token: string } } }) => {
        return store.get(`${where.organizationId_token.organizationId}:${where.organizationId_token.token}`) ?? null;
      }),
      findMany: vi.fn(async () => Array.from(store.values())),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { token: string; keyVersion: string } }) => {
        for (const [key, row] of store.entries()) {
          if (row.id === where.id) {
            const updated = { ...row, ...data };
            store.set(key, updated as never);
            return updated;
          }
        }
        return null;
      }),
    },
  },
}));

let tokenize: typeof import('../../lib/firewall/vault/token-vault').tokenize;
let detokenize: typeof import('../../lib/firewall/vault/token-vault').detokenize;
let isVaultConfigured: typeof import('../../lib/firewall/vault/token-vault').isVaultConfigured;

beforeAll(async () => {
  const mod = await import('../../lib/firewall/vault/token-vault');
  tokenize = mod.tokenize;
  detokenize = mod.detokenize;
  isVaultConfigured = mod.isVaultConfigured;
});

describe('isVaultConfigured', () => {
  it('returns true when FIREWALL_TOKEN_VAULT_KEY is set', () => {
    expect(isVaultConfigured()).toBe(true);
  });
});

describe('tokenize / detokenize — round trip', () => {
  it('round-trips a simple string', async () => {
    const token = await tokenize('1029482103', {
      organizationId: 'org_test',
      createdById: 'user_test',
      piiType: 'SAUDI_ID',
    });
    expect(token.startsWith('TKN_current_')).toBe(true);
    const resolved = await detokenize(token, 'org_test');
    expect(resolved).toBe('1029482103');
  });

  it('round-trips an IBAN', async () => {
    const iban = 'SA0380000000608010167519';
    const token = await tokenize(iban, {
      organizationId: 'org_test',
      createdById: 'user_test',
      piiType: 'SAUDI_IBAN',
    });
    expect(await detokenize(token, 'org_test')).toBe(iban);
  });

  it('round-trips Arabic text', async () => {
    const text = 'محمد العتيبي';
    const token = await tokenize(text, {
      organizationId: 'org_test',
      createdById: 'user_test',
      piiType: 'PERSON_NAME',
    });
    expect(await detokenize(token, 'org_test')).toBe(text);
  });

  it('produces a different token for the same value (random IV)', async () => {
    const t1 = await tokenize('hello', {
      organizationId: 'org_test',
      createdById: 'user_test',
      piiType: 'PERSON_NAME',
    });
    const t2 = await tokenize('hello', {
      organizationId: 'org_test',
      createdById: 'user_test',
      piiType: 'PERSON_NAME',
    });
    expect(t1).not.toBe(t2);
    // But both resolve to the same value.
    expect(await detokenize(t1, 'org_test')).toBe('hello');
    expect(await detokenize(t2, 'org_test')).toBe('hello');
  });

  it('returns null for an unknown token', async () => {
    const resolved = await detokenize('TKN_current_nonexistent_xxxxxxxx', 'org_test');
    expect(resolved).toBeNull();
  });

  it('does not return tokens for a different org', async () => {
    const token = await tokenize('secret', {
      organizationId: 'org_a',
      createdById: 'user_a',
      piiType: 'CREDENTIAL',
    });
    const resolved = await detokenize(token, 'org_b');
    expect(resolved).toBeNull();
  });
});
