import type { APIRoute } from 'astro';
import { isResponse, requireApiUser } from '../../../lib/api-security';
import { suggestTaskAssignees } from '../../../lib/assignment';
import { canAssignTask } from '../../../lib/permissions';

export const GET: APIRoute = (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  if (!canAssignTask(auth.role)) return new Response(JSON.stringify({ ok: false, error: 'Assignment suggestions require supervisor access.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  const url = new URL(context.request.url);
  const department = (url.searchParams.get('department') ?? '').trim();
  if (!department) return new Response(JSON.stringify({ ok: false, error: 'department is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true, recommendations: suggestTaskAssignees({ department, taskType: url.searchParams.get('taskType'), priority: url.searchParams.get('priority') as any }) }), { headers: { 'Content-Type': 'application/json' } });
};
