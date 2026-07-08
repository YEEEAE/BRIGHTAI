/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * API-key authentication for the firewall endpoints.
 *
 * Clients send `Authorization: Bearer bk_live_xxxxx`. The server
 * SHA-256s the raw token, looks it up in the `ApiKey` table, and
 * returns the bound `organizationId` (and the actor id used for
 * the audit log).
 *
 * The raw key is never stored; only the SHA-256 hash. This means
 * a database leak does not expose the keys.
 *
 * If the `ApiKey` table is empty (first-time deploy, no keys
 * seeded) the caller gets 401. There is no "open" fallback.
 */

import 'server-only';
import { createHash } from 'node:crypto';
import { dbServiceRole } from '@brightai/db';

export interface ApiKeyContext {
  apiKeyId: string;
  organizationId: string;
  createdById: string;
}

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/**
 * Resolve the API key from an Authorization header. Returns null
 * if the header is missing/malformed/the key is unknown/inactive.
 */
export async function resolveApiKey(authHeader: string | null): Promise<ApiKeyContext | null> {
  if (!authHeader) return null;
  const m = /^Bearer\s+(\S+)$/.exec(authHeader);
  if (!m) return null;
  const raw = m[1];
  if (raw.length < 8) return null;

  const hashedKey = sha256(raw);
  const row = await dbServiceRole.apiKey.findUnique({
    where: { hashedKey },
    select: {
      id: true,
      organizationId: true,
      createdById: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!row) return null;
  if (row.status !== 'ACTIVE') return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  // Best-effort lastUsedAt update (fire-and-forget; not awaited).
  dbServiceRole.apiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // ignore — not critical for the request
    });

  return {
    apiKeyId: row.id,
    organizationId: row.organizationId,
    createdById: row.createdById,
  };
}
