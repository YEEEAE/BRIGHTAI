/**
 * @brightai/dashboard — GET /api/audit/list
 *
 * AUDIT-UI-001 (2026-07-15): Audit log API for the dashboard.
 *
 * Auth: requires `audit:read` permission (OWNER + ADMIN + COMPLIANCE_OFFICER).
 *
 * Query params:
 *   - limit  (default 50, max 200)
 *   - offset (default 0)
 *   - action (optional filter: REQUEST_CREATED, REQUEST_APPROVED, ...)
 *   - from   (optional ISO date — createdAt >= from)
 *   - to     (optional ISO date — createdAt <= to)
 *
 * Response: 200 { entries: [...], total: number } | 401/403
 *
 * Service role + explicit organizationId filter = RLS isolation.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireSessionPermission, runInTenantContext } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // 1. Auth + permission.
  let ctx;
  try {
    ctx = await requireSessionPermission('audit:read');
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'Not authenticated' : 'Forbidden' },
      { status },
    );
  }

  // 2. Parse query params.
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);
  const action = url.searchParams.get('action') || undefined;
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  // 3. Build query — tenant isolation is enforced by RLS via
  //    runInTenantContext (no manual organizationId filter needed).
  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = from;
    if (to)   (where.createdAt as Record<string, Date>).lte = to;
  }

  // 4. Fetch entries + total count inside a tenant transaction.
  const [entries, total] = await runInTenantContext(ctx, (tx) =>
    Promise.all([
      tx.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          actorId: true,
          actorType: true,
          action: true,
          targetType: true,
          targetId: true,
          ipAddress: true,
          metadata: true,
          prevHash: true,
          hash: true,
          createdAt: true,
        },
      }),
      tx.auditLog.count({ where }),
    ]),
  );

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      // Short hash prefix for display (first 12 chars).
      hashShort: e.hash ? e.hash.slice(0, 12) : null,
      prevHashShort: e.prevHash ? e.prevHash.slice(0, 12) : null,
    })),
    total,
    limit,
    offset,
  });
}