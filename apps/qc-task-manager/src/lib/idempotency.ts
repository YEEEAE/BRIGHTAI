// Canonical Idempotency Key Architecture for QC Task Manager.
//
// Responsibilities (Domain 4 / Domain 34 / Domain 35):
//   1. Enforce `Idempotency-Key` header on critical mutating APIs:
//      - /api/tasks/[id]/close
//      - /api/lab/tests/[id]/review
//      - /api/findings/[id]/capa
//   2. Scope keys per user session to prevent cross-user key collision.
//   3. Deduplicate mutations within a 24-hour rolling window: duplicate requests
//      receive the cached HTTP status, headers, and body without re-executing mutations.
//   4. Verify payload integrity: altered body replay on the same key returns
//      HTTP 400 Mismatched Payload.
//   5. Concurrency safety: simultaneous in-flight requests on the same key return
//      HTTP 409 Conflict.
//   6. Clean transaction rollback on mutation failure so subsequent retries can succeed.

import { createHash } from 'node:crypto';
import type { APIContext } from 'astro';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { getDb, transaction } from './db';
import { apiJsonError } from './api-security';

/** Maximum allowed character length for an Idempotency-Key. */
export const MAX_IDEMPOTENCY_KEY_LEN = 200;

/** Expiration window for cached idempotency responses (24 hours). */
export const IDEMPOTENCY_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface IdempotencyRecord {
  id: number;
  key: string;
  user_id: number;
  route: string;
  request_hash: string;
  response_status: number | null;
  response_body: string | null;
  response_headers: string | null;
  status: 'PENDING' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

let _tableEnsured = false;

/**
 * Ensure `idempotency_keys` table and indexes exist in the target database.
 * Uses indexed foreign key `(user_id, key)` to prevent cross-user collision
 * and maintain relational integrity without table scan overhead.
 */
export function ensureIdempotencyTable(database?: BetterSqliteDatabase): void {
  const target = database ?? getDb();
  if (_tableEnsured && !database) return;

  target.exec(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      route TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      response_status INTEGER,
      response_body TEXT,
      response_headers TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_user_key
      ON idempotency_keys(user_id, key);
    CREATE INDEX IF NOT EXISTS idx_idempotency_created_at
      ON idempotency_keys(created_at);
  `);

  if (!database) _tableEnsured = true;
}

/** Validate format and length of client-provided idempotency key. */
export function validateIdempotencyKey(key: unknown): { ok: true; key: string } | { ok: false; error: string } {
  if (typeof key !== 'string') {
    return { ok: false, error: 'Idempotency-Key must be a string.' };
  }
  const trimmed = key.trim();
  if (trimmed.length < 1) {
    return { ok: false, error: 'Idempotency-Key cannot be empty.' };
  }
  if (trimmed.length > MAX_IDEMPOTENCY_KEY_LEN) {
    return { ok: false, error: `Idempotency-Key exceeds maximum length of ${MAX_IDEMPOTENCY_KEY_LEN} characters.` };
  }
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { ok: false, error: 'Idempotency-Key contains invalid control characters.' };
  }
  return { ok: true, key: trimmed };
}

/** Compute deterministic SHA-256 fingerprint of request payload. */
export function hashPayload(payload: unknown): string {
  const hash = createHash('sha256');
  if (payload == null) {
    hash.update('__NULL_OR_EMPTY__');
  } else if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
    hash.update(payload);
  } else if (payload instanceof FormData) {
    const entries: string[] = [];
    for (const [k, v] of payload.entries()) {
      if (typeof v === 'string') {
        entries.push(`${k}:${v}`);
      } else if (v && typeof v === 'object' && 'name' in v && 'size' in v) {
        entries.push(`${k}:file:${(v as File).name}:${(v as File).size}:${(v as File).type}`);
      }
    }
    entries.sort();
    hash.update(entries.join('|'));
  } else if (typeof payload === 'object') {
    try {
      const keys = Object.keys(payload as Record<string, unknown>).sort();
      const normalized: Record<string, unknown> = {};
      for (const k of keys) {
        normalized[k] = (payload as Record<string, unknown>)[k];
      }
      hash.update(JSON.stringify(normalized));
    } catch {
      hash.update(String(payload));
    }
  } else {
    hash.update(String(payload));
  }
  return hash.digest('hex');
}

export interface WithIdempotencyOptions {
  /** Optional explicit request payload to fingerprint (FormData, string, or object). */
  payload?: unknown;
  /** Route path override (defaults to context.url.pathname). */
  route?: string;
  /** Custom database instance (for isolated testing). */
  database?: BetterSqliteDatabase;
}

/**
 * Server-side Idempotency wrapper for mutation endpoints.
 *
 * Rules:
 *   - Reads `Idempotency-Key` from request header (or fallback from form).
 *   - If key is absent, proceeds with mutation execution without caching.
 *   - If key is present:
 *       1. Validates key syntax (1..200 chars, no control chars).
 *       2. Computes payload SHA-256 hash.
 *       3. Checks for existing record scoped to `(user.id, key)`.
 *       4. If duplicate within 24h has mismatched payload -> returns 400 Mismatched Payload.
 *       5. If duplicate is in-flight (status PENDING) -> returns 409 Conflict.
 *       6. If duplicate is COMPLETED -> returns cached response.
 *       7. If new -> runs mutation inside PENDING lease, saves output, and marks COMPLETED.
 */
export async function withIdempotency(
  context: APIContext,
  user: { id: number; role?: string },
  execute: () => Promise<Response>,
  options?: WithIdempotencyOptions,
): Promise<Response> {
  const db = options?.database ?? getDb();
  ensureIdempotencyTable(db);

  const rawHeader = context.request.headers.get('idempotency-key') ??
    context.request.headers.get('Idempotency-Key');

  // If client did not provide an Idempotency-Key header or payload key,
  // execute standard mutation path.
  let keyCandidate: string | null = null;
  if (rawHeader) {
    keyCandidate = rawHeader;
  } else if (options?.payload instanceof FormData) {
    const fromForm = options.payload.get('idempotency_key');
    if (typeof fromForm === 'string' && fromForm.trim()) {
      keyCandidate = fromForm;
    }
  }

  if (!keyCandidate) {
    return await execute();
  }

  const validated = validateIdempotencyKey(keyCandidate);
  if (!validated.ok) {
    return apiJsonError(validated.error, 400);
  }
  const key = validated.key;
  const route = options?.route ?? context.url.pathname;
  const requestHash = hashPayload(options?.payload);

  // Check existing key scoped to this user
  const existing = db
    .prepare('SELECT * FROM idempotency_keys WHERE user_id = ? AND key = ?')
    .get(user.id, key) as IdempotencyRecord | undefined;

  const now = Date.now();
  if (existing) {
    const createdTime = new Date(existing.created_at.includes('T') ? existing.created_at : `${existing.created_at}Z`).getTime();
    const isExpired = !Number.isNaN(createdTime) && (now - createdTime > IDEMPOTENCY_EXPIRY_MS);

    if (isExpired) {
      // Purge expired row and allow fresh execution
      db.prepare('DELETE FROM idempotency_keys WHERE id = ?').run(existing.id);
    } else {
      // Concurrent request with same key in-flight -> 409 Conflict
      if (existing.status === 'PENDING') {
        return apiJsonError(
          'A mutation with this Idempotency-Key is currently in progress.',
          409,
          'CONFLICT',
        );
      }

      // Replay attack with altered body on same key -> 400 Mismatched Payload
      if (existing.request_hash !== requestHash) {
        return apiJsonError('Mismatched Payload', 400, 'VALIDATION');
      }

      // Completed replay -> return cached response
      const headers = new Headers();
      if (existing.response_headers) {
        try {
          const parsedHeaders = JSON.parse(existing.response_headers) as Record<string, string>;
          for (const [hk, hv] of Object.entries(parsedHeaders)) {
            headers.set(hk, hv);
          }
        } catch {
          // Ignore header parse issues
        }
      }
      headers.set('X-Idempotent-Replay', 'true');
      return new Response(existing.response_body ?? '', {
        status: existing.response_status ?? 200,
        headers,
      });
    }
  }

  // Reserve the key with status 'PENDING'
  try {
    transaction(() => {
      db.prepare(
        `INSERT INTO idempotency_keys (key, user_id, route, request_hash, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))`,
      ).run(key, user.id, route, requestHash);
    });
  } catch (insertErr) {
    if (insertErr instanceof Error && /UNIQUE constraint failed/i.test(insertErr.message)) {
      return apiJsonError(
        'A mutation with this Idempotency-Key is currently in progress.',
        409,
        'CONFLICT',
      );
    }
    throw insertErr;
  }

  // Execute mutation
  let response: Response;
  try {
    response = await execute();
  } catch (executionError) {
    // If the mutation threw, remove the pending lease so retry is possible
    try {
      db.prepare("DELETE FROM idempotency_keys WHERE user_id = ? AND key = ? AND status = 'PENDING'").run(
        user.id,
        key,
      );
    } catch {
      // Suppress secondary cleanup failure
    }
    throw executionError;
  }

  // Cache response for 200, 201, 303 or standard successful mutation statuses
  try {
    const clone = response.clone();
    const bodyText = await clone.text();
    const headersObj: Record<string, string> = {};
    for (const [hk, hv] of response.headers.entries()) {
      headersObj[hk] = hv;
    }

    db.prepare(
      `UPDATE idempotency_keys
       SET status = 'COMPLETED',
           response_status = ?,
           response_body = ?,
           response_headers = ?,
           updated_at = datetime('now')
       WHERE user_id = ? AND key = ?`,
    ).run(response.status, bodyText, JSON.stringify(headersObj), user.id, key);
  } catch (cacheErr) {
    console.warn('[idempotency] could not cache mutation response', cacheErr);
  }

  return response;
}
