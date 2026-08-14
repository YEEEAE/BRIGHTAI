// GET /api/health — public readiness probe for orchestrators (Render).
//
// Deliberately NOT behind requireApiUser/CSRF: it is a GET, requires no
// session, performs no state change, and must be reachable by infrastructure
// that has no cookie. It reports the latest applied migration version from the
// real `schema_migrations` table so a deploy can verify the database exists
// and is migrated before traffic is routed to the service.
//
// Safety contract: the handler never logs and never includes file paths, env
// values, secrets, or exception messages in the response. `reason` values are
// fixed short strings only.

import { existsSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { DB_PATH, getDb } from '../../lib/db';

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function unhealthy(reason: string): Response {
  return json(503, { ok: false, status: 'unhealthy', reason });
}

export const GET: APIRoute = () => {
  // The probe must NEVER create the database: a missing file is an honest
  // "not ready" signal (empty persistent disk, moved file, ...), not something
  // to silently repair. The database is created by the application itself on
  // the first database-touching request (e.g. the first login), never by this
  // read-only probe.
  if (!existsSync(DB_PATH)) return unhealthy('database unavailable');

  try {
    const db = getDb();
    const row = db
      .prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations')
      .get() as { version: number } | undefined;
    const schemaVersion = Number(row?.version ?? 0);
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
      return unhealthy('schema not initialized');
    }
    return json(200, {
      ok: true,
      service: 'qc-task-manager',
      status: 'healthy',
      schemaVersion,
    });
  } catch {
    // Silent by design: exception messages can embed file paths and must
    // never leak into a probe response.
    return unhealthy('database unavailable');
  }
};
