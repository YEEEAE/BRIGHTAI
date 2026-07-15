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
