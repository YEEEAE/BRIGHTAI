import type { APIRoute } from 'astro';
import { kernelHandler, exact, headers } from '../../../server/kernel/http.mjs';
import { dashboard, createWorkspace } from '../../../server/kernel/service.mjs';
export const prerender = false;
export const GET = kernelHandler(dashboard);
const create = kernelHandler(async (identity: { userId: string }, _workspace: string | null, body: { name?: unknown }) => {
  exact(body, ['name']);
  const tenantId = await createWorkspace(identity, body.name);
  // Creation committed. Keep its result independent of a subsequent dashboard read.
  try { return { ...await dashboard(identity, tenantId), persisted: true, tenantId }; }
  catch { return { persisted: true, tenantId, refreshRequired: true }; }
}, true);
export const POST: APIRoute = async (context) => {
  const response = await create(context);
  if (!response.ok) return response;
  return new Response(response.body, { status: 201, headers });
};
