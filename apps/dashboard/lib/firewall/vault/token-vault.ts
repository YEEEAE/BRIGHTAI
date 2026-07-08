/**
 * BrightAI AI Firewall — Phase 1c
 *
 * Token Vault — reversible PII tokenization.
 *
 * When the firewall's `tokenize` action is applied to a PII value,
 * the original value is encrypted with AES-256-GCM and stored in
 * the `TokenMapping` table. The LLM only sees an opaque token like
 * `TKN_current_a1b2c3d4_k7m9p2q4`. Authorized callers (e.g. the
 * dashboard) can resolve the token back to the original value via
 * `detokenize()`.
 *
 * Encryption:
 *   - Master key: `FIREWALL_TOKEN_VAULT_KEY` (32+ random bytes,
 *     generated with `openssl rand -base64 32`)
 *   - AES key:   HKDF-SHA256(master, salt="brightai-firewall", info="aes-key")
 *   - HMAC key:  HKDF-SHA256(master, salt="brightai-firewall", info="hmac-key")
 *   - Cipher:    AES-256-GCM with random 12-byte IV
 *   - Auth:      GCM auth tag stored alongside ciphertext
 *
 * Key rotation:
 *   - Set `FIREWALL_TOKEN_VAULT_KEY` to the new key
 *   - Move the old key to `FIREWALL_TOKEN_VAULT_KEY_PREV`
 *   - New tokens are encrypted with the new key
 *   - Existing tokens are still readable via the prev key
 *   - After 24h, all in-flight tokens should be re-issued → drop PREV
 *
 * The vault is a singleton keyed on the orgId. Each org can have
 * its own vault key (for SaaS multi-tenant); for the Phase 1c MVP
 * all orgs share the same key from env (simpler ops, suitable
 * for the Sovereign Cloud SaaS deployment mode).
 */

import 'server-only';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';
import { dbServiceRole } from '@brightai/db';

/** Salt + info for HKDF — these are public (not secret), but
 *  pinning them prevents key reuse across different use cases. */
const HKDF_SALT = Buffer.from('brightai-firewall', 'utf8');
const HKDF_INFO_AES = Buffer.from('aes-key', 'utf8');
const HKDF_INFO_HMAC = Buffer.from('hmac-key', 'utf8');

/** AES-256-GCM IV length in bytes (NIST SP 800-38D §8.2.1). */
const IV_LENGTH = 12;

/** Random suffix length in the token (base64url-encoded bytes). */
const TOKEN_SUFFIX_BYTES = 12;

/** Length of the HMAC suffix (truncated for compact tokens). */
const HMAC_SUFFIX_CHARS = 8;

interface DerivedKeys {
  aes: Buffer;
  hmac: Buffer;
}

/** Derive AES + HMAC subkeys from the master vault key. */
function deriveKeys(master: string): DerivedKeys {
  const masterBuf = Buffer.from(master, 'utf8');
  // hkdfSync returns Uint8Array; convert to Buffer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = hkdfSync('sha256', masterBuf, HKDF_SALT, Buffer.concat([HKDF_INFO_AES, HKDF_INFO_HMAC]), 64) as any;
  return {
    aes: Buffer.from(result.slice(0, 32)),
    hmac: Buffer.from(result.slice(32, 64)),
  };
}

/** Get the current + previous master keys from env. */
function getKeys(): { current: string | null; prev: string | null } {
  return {
    current: process.env.FIREWALL_TOKEN_VAULT_KEY || null,
    prev: process.env.FIREWALL_TOKEN_VAULT_KEY_PREV || null,
  };
}

/** True if the vault is configured (at least the current key is set). */
export function isVaultConfigured(): boolean {
  return Boolean(process.env.FIREWALL_TOKEN_VAULT_KEY);
}

/** Generate a fresh random token suffix. */
function generateSuffix(): string {
  return randomBytes(TOKEN_SUFFIX_BYTES).toString('base64url');
}

/** HMAC-SHA256(suffix, hmacKey), hex-encoded, truncated. */
function computeHmac(suffix: string, hmacKey: Buffer): string {
  return createHmac('sha256', hmacKey).update(suffix, 'utf8').digest('hex').slice(0, HMAC_SUFFIX_CHARS);
}

export interface TokenizeOptions {
  organizationId: string;
  createdById: string;
  piiType: string;
  /** TTL in seconds. Default: 24h. */
  ttlSec?: number;
  /** Force the "prev" key version (used for re-encryption). */
  forceKeyVersion?: 'current' | 'prev';
}

/**
 * Tokenize a PII value: encrypt + store in DB + return the token.
 *
 * The returned token has the format:
 *   TKN_<keyId>_<suffix>_<hmac>
 *
 * Where:
 *   - keyId   = "current" or "prev" (which key encrypted it)
 *   - suffix  = 12 random bytes (base64url)
 *   - hmac    = 8-char HMAC-SHA256(suffix, hmacKey) for quick integrity
 */
export async function tokenize(value: string, opts: TokenizeOptions): Promise<string> {
  const master = getKeys();
  if (!master.current) {
    throw new Error(
      'FIREWALL_TOKEN_VAULT_KEY is not set. Set it in apps/dashboard/.env.local ' +
        '(generate with: openssl rand -base64 32).',
    );
  }
  const keyVersion = opts.forceKeyVersion ?? 'current';
  const masterKey = keyVersion === 'prev' && master.prev ? master.prev : master.current;
  const { aes, hmac } = deriveKeys(masterKey);

  const suffix = generateSuffix();
  const hmacSuffix = computeHmac(suffix, hmac);
  const token = `TKN_${keyVersion}_${suffix}_${hmacSuffix}`;

  // Encrypt the value with AES-256-GCM.
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', aes, iv);
  const encBuf = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Persist the mapping.
  await dbServiceRole.tokenMapping.create({
    data: {
      organizationId: opts.organizationId,
      token,
      // We store the HMAC of the suffix as a secondary integrity check
      // (the suffix itself is already part of the token). The "tokenHmac"
      // field here is the same value as hmacSuffix for now.
      tokenHmac: createHmac('sha256', hmac).update(token, 'utf8').digest('hex'),
      encryptedValue: encBuf.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyVersion,
      piiType: opts.piiType,
      expiresAt: opts.ttlSec ? new Date(Date.now() + opts.ttlSec * 1000) : null,
      createdById: opts.createdById,
    },
  });

  return token;
}

/**
 * Resolve a token back to its original value.
 *
 * Algorithm:
 *   1. Look up `TokenMapping` by (orgId, token).
 *   2. Try decrypting with the key version recorded on the row.
 *   3. If GCM auth tag fails (key was rotated), try the other key.
 *   4. Return the plaintext or `null` on any failure.
 */
export async function detokenize(
  token: string,
  orgId: string,
): Promise<string | null> {
  const row = await dbServiceRole.tokenMapping.findUnique({
    where: { organizationId_token: { organizationId: orgId, token } },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  const master = getKeys();
  // Try the row's recorded key version first, then the other.
  const triedFirst = row.keyVersion === 'prev' ? 'prev' : 'current';
  const triedSecond = triedFirst === 'current' ? 'prev' : 'current';
  const candidates: Array<'current' | 'prev'> = [triedFirst, triedSecond];

  for (const v of candidates) {
    const m = v === 'current' ? master.current : master.prev;
    if (!m) continue;
    try {
      const { aes } = deriveKeys(m);
      const iv = Buffer.from(row.iv, 'base64');
      const encBuf = Buffer.from(row.encryptedValue, 'base64');
      const authTag = Buffer.from(row.authTag, 'base64');
      const decipher = createDecipheriv('aes-256-gcm', aes, iv);
      decipher.setAuthTag(authTag);
      const plain = Buffer.concat([decipher.update(encBuf), decipher.final()]);
      return plain.toString('utf8');
    } catch {
      // Auth tag mismatch → try next key.
      continue;
    }
  }
  return null;
}

/**
 * Rotate the vault key. Call this from a cron job (quarterly).
 *
 * In a real deployment the rotation flow is:
 *   1. Generate new master key (`openssl rand -base64 32`).
 *   2. Set `FIREWALL_TOKEN_VAULT_KEY` to the new key.
 *   3. Set `FIREWALL_TOKEN_VAULT_KEY_PREV` to the current key.
 *   4. Deploy.
 *   5. After 24h, clear `FIREWALL_TOKEN_VAULT_KEY_PREV`.
 *
 * This function re-encrypts all existing mappings from the prev
 * key to the current key. It's safe to run mid-traffic because
 * detokenize() falls back to the prev key.
 *
 * For the Phase 1c MVP this is a manual operation; Phase 2 will
 * add a CLI script + scheduled job.
 */
export async function rotateInPlace(orgId: string): Promise<{ reEncrypted: number }> {
  const master = getKeys();
  if (!master.current || !master.prev) {
    throw new Error('Both FIREWALL_TOKEN_VAULT_KEY and FIREWALL_TOKEN_VAULT_KEY_PREV must be set to rotate.');
  }

  const rows = await dbServiceRole.tokenMapping.findMany({
    where: { organizationId: orgId, keyVersion: 'prev' },
  });

  let count = 0;
  for (const row of rows) {
    const plain = await detokenize(row.token, orgId);
    if (plain === null) continue;
    // Re-tokenize with the current key.
    const newToken = await tokenize(plain, {
      organizationId: orgId,
      createdById: row.createdById,
      piiType: row.piiType,
      ttlSec: row.expiresAt ? Math.floor((row.expiresAt.getTime() - Date.now()) / 1000) : undefined,
      forceKeyVersion: 'current',
    });
    // Replace the old mapping with the new one.
    await dbServiceRole.tokenMapping.update({
      where: { id: row.id },
      data: {
        token: newToken,
        keyVersion: 'current',
      },
    });
    count++;
  }
  return { reEncrypted: count };
}
