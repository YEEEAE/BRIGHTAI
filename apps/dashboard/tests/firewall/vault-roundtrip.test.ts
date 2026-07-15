import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

const TEST_KEY = 'roundtrip-master-key-32-bytes-minimum-length-xxxxxxxx';
process.env.FIREWALL_TOKEN_VAULT_KEY = TEST_KEY;

type Row = {
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
};

const store = new Map<string, Row>();

vi.mock('@brightai/db', () => ({
  dbServiceRole: {
    tokenMapping: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const id = `tm_${Math.random().toString(36).slice(2, 10)}`;
        const row = { ...data, id };
        store.set(`${data.organizationId}:${data.token}`, row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { organizationId_token: { organizationId: string; token: string } } }) => {
        return store.get(`${where.organizationId_token.organizationId}:${where.organizationId_token.token}`) ?? null;
      }),
      findMany: vi.fn(async ({ where }: { where: { organizationId: string; keyVersion?: string } }) => {
        return Array.from(store.values()).filter(
          (r) => r.organizationId === where.organizationId && (!where.keyVersion || r.keyVersion === where.keyVersion),
        );
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
        for (const [, row] of store.entries()) {
          if (row.id === where.id) {
            const updated = { ...row, ...data };
            store.set(`${row.organizationId}:${row.token}`, updated);
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
let rotateInPlace: typeof import('../../lib/firewall/vault/token-vault').rotateInPlace;
let applyActionsWithVault: typeof import('@brightai/firewall-detectors').applyActionsWithVault;

beforeAll(async () => {
  const mod = await import('../../lib/firewall/vault/token-vault');
  tokenize = mod.tokenize;
  detokenize = mod.detokenize;
  rotateInPlace = mod.rotateInPlace;
  applyActionsWithVault = (await import('@brightai/firewall-detectors')).applyActionsWithVault;
});

afterEach(() => {
  store.clear();
  delete process.env.FIREWALL_TOKEN_VAULT_KEY_PREV;
});

describe('tokenize / detokenize — round trip', () => {
  it('round-trips a Saudi ID', async () => {
    const token = await tokenize('1023456789', {
      organizationId: 'org_a',
      createdById: 'u1',
      piiType: 'SAUDI_ID',
    });
    expect(token.startsWith('TKN_current_')).toBe(true);
    expect(await detokenize(token, 'org_a')).toBe('1023456789');
  });

  it('round-trips an Arabic name', async () => {
    const name = 'عبدالله العتيبي';
    const token = await tokenize(name, {
      organizationId: 'org_a',
      createdById: 'u1',
      piiType: 'PERSON_NAME',
    });
    expect(await detokenize(token, 'org_a')).toBe(name);
  });

  it('returns null for unknown token', async () => {
    expect(await detokenize('TKN_current_zzzz_nope', 'org_a')).toBeNull();
  });

  it('does NOT resolve across orgs', async () => {
    const token = await tokenize('secret', {
      organizationId: 'org_a',
      createdById: 'u1',
      piiType: 'CREDENTIAL',
    });
    expect(await detokenize(token, 'org_b')).toBeNull();
  });
});

describe('applyActionsWithVault — reversible token flow', () => {
  it('replaces PII with a reversible token and resolves original', async () => {
    const text = 'هويتي 1023456789 مهمة';
    const result = await applyActionsWithVault(
      text,
      [
        {
          type: 'SAUDI_ID',
          start: 7,
          end: 17,
          value: '1023456789',
          confidence: 0.92,
          detector: 'regex',
        },
      ],
      { actions: { SAUDI_ID: 'tokenize' }, blockOnCritical: false, nerEnabled: false },
      async (value) =>
        tokenize(value, { organizationId: 'org_a', createdById: 'u1', piiType: 'SAUDI_ID' }),
    );
    expect(result.blocked).toBe(false);
    expect(Object.keys(result.tokens).length).toBe(1);
    const token = Object.keys(result.tokens)[0];
    expect(result.redactedText).toContain(token);
    expect(await detokenize(token, 'org_a')).toBe('1023456789');
  });
});

describe('key rotation', () => {
  it('re-encrypts prev-key rows under current key', async () => {
    const token = await tokenize('rotate-me', {
      organizationId: 'org_a',
      createdById: 'u1',
      piiType: 'PERSON_NAME',
    });
    expect(await detokenize(token, 'org_a')).toBe('rotate-me');

    // Simulate the rotation-window state: the row was originally on the
    // current key; promote current→prev in the store to mark it as
    // "needs re-encryption under the new key".
    process.env.FIREWALL_TOKEN_VAULT_KEY_PREV = TEST_KEY;
    process.env.FIREWALL_TOKEN_VAULT_KEY = 'next-rotated-key-also-32-bytes-min-yyyy';
    const row = Array.from(store.values()).find((r) => r.organizationId === 'org_a');
    expect(row).toBeTruthy();
    if (row) row.keyVersion = 'prev';

    const { reEncrypted } = await rotateInPlace('org_a');
    expect(reEncrypted).toBe(1);
    // rotateInPlace creates a new mapping via tokenize() then updates the
    // old row's `token` field; both rows therefore remain in the store.
    const rows = Array.from(store.values()).filter((r) => r.organizationId === 'org_a');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // The original (old) row was updated to keyVersion='current' with a new token.
    const original = rows.find((r) => r.id);
    expect(rows.some((r) => r.keyVersion === 'current')).toBe(true);
    expect(rows.some((r) => r.token !== token)).toBe(true);
  });

  it('rotateInPlace throws when both keys are missing', async () => {
    delete process.env.FIREWALL_TOKEN_VAULT_KEY_PREV;
    await expect(rotateInPlace('org_a')).rejects.toThrow(/both/i);
  });
});

describe('TTL expiry', () => {
  it('returns null after expiresAt passed', async () => {
    const token = await tokenize('temp', {
      organizationId: 'org_a',
      createdById: 'u1',
      piiType: 'PERSON_NAME',
      ttlSec: -1,
    });
    expect(await detokenize(token, 'org_a')).toBeNull();
  });
});
