// GET /api/readiness — public dependency readiness probe for operators.
//
// Unlike /api/health, this route verifies the SQLite file and migration state.
// It must not be used as Render's deployment health check: on first deploy the
// database is created during the first application request, and Render would
// otherwise block that request behind a failing health gate.

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
  return json(503, { ok: false, status: 'unready', reason });
}

export const GET: APIRoute = () => {
  if (!existsSync(DB_PATH)) return unhealthy('database unavailable');

  try {
    const row = getDb()
      .prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations')
      .get() as { version: number } | undefined;
    const schemaVersion = Number(row?.version ?? 0);
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) return unhealthy('schema not initialized');
    return json(200, {
      ok: true,
      service: 'qc-task-manager',
      status: 'ready',
      ready: true,
      dbInitialized: true,
      schemaVersion,
    });
  } catch {
    // Exception details can expose paths, so the public response stays fixed.
    return unhealthy('database unavailable');
  }
};
