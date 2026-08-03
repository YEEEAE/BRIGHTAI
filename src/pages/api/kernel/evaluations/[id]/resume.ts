/**
 * src/pages/api/kernel/evaluations/[id]/resume.ts — EVAL-CERT-004.
 *
 * POST: استئناف run متوقف (partial/running) — بعد استعادة آخر حالة، يواصل
 * من آخر case مكتمل. لا ينشئ نسخة جديدة (resume ≠ تصحيح).
 *
 * القواعد:
 *   - لا يستأنف run مكتمـل (immutable) أو مجمّد.
 *   - يضبط status = 'running' ويسمح بإضافة الحالات المتبقية.
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../../lib/kernel-certs/admin-auth';
import { getCertsContext } from '../../../../../lib/kernel-certs/facade';
import { appendAuditEvent } from '../../../../../lib/kernel-certs/prisma-store';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id) return json({ error: 'missing_id' }, 400);

  const ctx = getCertsContext();
  const run = await ctx.store.getRun(id);
  if (!run) return json({ error: 'run_not_found' }, 404);
  if (run.immutable) return json({ error: 'run_immutable' }, 409);

  const now = new Date().toISOString();
  const completed = await ctx.store.updateRun({
    ...run,
    status: 'partial',
    version: run.version,
    updatedAt: now,
  });

  await appendAuditEvent({ evaluationId: id, action: 'resume', metadata: { version: completed.version } });

  return json({ ok: true, run: completed, resumedFromCases: (await ctx.store.getCases(id)).length });
};