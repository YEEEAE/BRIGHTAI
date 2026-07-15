import { describe, it, expect, beforeAll, vi } from 'vitest';

// next/server stub: NextResponse.json returns a standard Response.
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: init?.headers as HeadersInit,
      }),
  },
}));

let dbOk = true;
let dbError: string | null = null;

vi.mock('@brightai/db', () => ({
  dbServiceRole: {
    $queryRaw: vi.fn(async () => {
      if (!dbOk) throw new Error(dbError ?? 'db down');
      return [{ '?column?': 1 }];
    }),
  },
}));

let GET: typeof import('../../app/api/health/route').GET;

beforeAll(async () => {
  GET = (await import('../../app/api/health/route')).GET;
});

async function readBody(res: Response) {
  return JSON.parse(await res.text()) as Record<string, unknown>;
}

describe('GET /api/health', () => {
  it('returns 200 + status=ok when DB reachable', async () => {
    dbOk = true;
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = await readBody(res);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('@brightai/dashboard');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.uptimeSec).toBe('number');
    expect(typeof body.responseTimeMs).toBe('number');
    const checks = body.checks as { db: { ok: boolean; latencyMs: number | null; error: string | null } };
    expect(checks.db.ok).toBe(true);
    expect(checks.db.latencyMs).not.toBeNull();
    expect(checks.db.error).toBeNull();
  });

  it('returns 503 + status=degraded when DB throws', async () => {
    dbOk = false;
    dbError = 'connection refused';
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await readBody(res);
    expect(body.status).toBe('degraded');
    const checks = body.checks as { db: { ok: boolean; latencyMs: number | null; error: string | null } };
    expect(checks.db.ok).toBe(false);
    expect(checks.db.error).toContain('connection refused');
    dbOk = true;
    dbError = null;
  });
});
